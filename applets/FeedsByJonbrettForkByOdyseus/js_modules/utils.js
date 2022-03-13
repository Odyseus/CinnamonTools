const {
    gi: {
        Clutter,
        St
    },
    misc: {
        params: Params,
        signalManager: SignalManager,
        util: Util
    },
    signals: Signals,
    ui: {
        popupMenu: PopupMenu,
        tooltips: Tooltips
    }
} = imports;

const {
    _,
    CINNAMON_STANDARD_CONFIG_FOLDER,
    copyToClipboard,
    escapeHTML,
    ngettext,
    tryFn,
    launchUri
} = require("js_modules/globalUtils.js");

const {
    File
} = require("js_modules/customFileUtils.js");

const {
    escapeUnescapeReplacer,
    html2text
} = require("js_modules/stringUtils.js");

const {
    IntelligentTooltip
} = require("js_modules/customTooltips.js");

const {
    FeedParams
} = require("js_modules/constants.js");

const {
    DebugManager,
    LoggingLevel
} = require("js_modules/debugManager.js");

var Debugger = new DebugManager(`org.cinnamon.applets.${__meta.uuid}`);

const DATA_STORAGE_FOLDER = `${CINNAMON_STANDARD_CONFIG_FOLDER}/${__meta.uuid}-Storage`;

function runtimeInfo(aMsg) {
    Debugger.logging_level !== LoggingLevel.NORMAL && aMsg &&
        global.log(`[FeedsReader] ${aMsg}`);
}

function runtimeError(aMsg) {
    aMsg && global.logError(`[FeedsReader] ${aMsg}`);
}

var FeedSubMenuItem = class FeedSubMenuItem extends PopupMenu.PopupSubMenuMenuItem {
    constructor(aApplet, aParams) {
        super();

        if (this.menu && this.menu instanceof PopupMenu.PopupSubMenu) {
            this._signals.disconnect("open-state-changed", this.menu);
            this.menu.destroy();
        }

        this.focusOnHover = false;
        this._applet = aApplet;
        this.params = Params.parse(aParams, FeedParams, true);

        // NOTE: Utterly ignore the following TODO. "Web masters" are murdering RSS, nobody
        // bothers to add an image/icon to their feeds.
        // TODO: Add Box layout type to facilitate adding an icon?
        this.menuItemCount = 0;
        this._visitURLContextItem = null;
        this._contextVisible = false;
        this._title = new St.Label({
            text: _("Loading...")
        });

        this.addActor(this._title, {
            expand: true,
            align: St.Align.START
        });

        this._triangleBin = new St.Bin({
            x_align: St.Align.END
        });
        this.addActor(this._triangleBin, {
            expand: true,
            span: -1,
            align: St.Align.END
        });

        this._triangle = new St.Icon({
            style_class: "popup-menu-arrow",
            icon_name: "pan-end",
            icon_type: St.IconType.SYMBOLIC,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
            important: true
        });

        this._triangle.pivot_point = new Clutter.Point({
            x: 0.5,
            y: 0.6
        });
        this._triangleBin.child = this._triangle;

        this.menu = new PopupMenu.PopupSubMenu(this.actor, this._triangle);

        this._unread_count = 0;
        runtimeInfo(`Loading url: ${this.params.url}`);

        this.reader = new FeedReader(this);

        this._signals.connect(this.reader, "articles-loaded", function() {
            runtimeInfo("articles-loaded event fired for reader");
            // Title needs to be set on articles-loaded event
            this.rssTitle = this.params.custom_title || this.reader.feed_title;
            this._title.set_text(this.rssTitle);
            this._applet.enqueueFeed(this);
            this.update();
            this._applet.processNextFeed();
        }.bind(this));
        this._signals.connect(this.reader, "articles-updated", function() {
            runtimeInfo("articles-updated Event Fired for reader");
            this.update();
        }.bind(this));
        this._signals.connect(this.reader, "articles-read", function(aFeedReader) {
            runtimeInfo("articles-read Event Fired for reader");
            this._applet.notifyArticlesRead(aFeedReader);
        }.bind(this));
        this._signals.connect(this.reader, "notify-new-articles", function(aFeedReader, aFeedtitle, aItemTitle) {
            runtimeInfo("notify-new-articles Event Fired for reader");
            this._applet.notifyNewArticles(aFeedReader, aFeedtitle, aItemTitle);
        }.bind(this));
        this._signals.connect(this.reader, "feed-downloaded", function() {
            runtimeInfo("feed-downloaded Event Fired for reader");
            this._applet.processNextFeed();
        }.bind(this));

        this._signals.connect(this, "destroy", function() {
            this.reader.emit("destroy");
        }.bind(this));
        this._signals.connect(this.menu, "open-state-changed", function(aMenu, aOpen) {
            !aOpen && this._closeContextItems();
        }.bind(this));
    }

    _updateTitleLength() {
        this.title_length = (this._title.get_width() > this._applet.$._.min_article_item_width) ?
            this._title.get_width() :
            this._applet.$._.min_article_item_width;
    }

    getTitle() {
        let title = this.params.custom_title || this.reader.feed_title;

        if (this.reader.is_redirected) {
            title += ` (Redirected to: ${this.reader.redirected_url})`;
        }

        title += ` [${this.reader.unread_count} / ${this.reader.articles.length}]`;
        return title;
    }

    get unread_count() {
        return this._unread_count;
    }

    error(reader, message, full_message) { // jshint ignore:line
        this.menu.removeAll();
    }

    update() {
        this.menu.removeAll();
        this.menuItemCount = 0;
        const msg = "Finding first " +
            this._applet.$._.max_items +
            " unread articles out of: " +
            this.reader.articles.length +
            " total articles.";

        runtimeInfo(msg);
        let menu_items = 0;
        this._unread_count = 0;

        this._updateTitleLength();

        for (let i = 0; i < this.reader.articles.length && menu_items < this._applet.$._.max_items; i++) {
            if (this.reader.articles[i].read && !this.params.show_read_items) {
                continue;
            }

            if (!this.reader.articles[i].read) {
                this._unread_count++;
            }

            const item = new FeedMenuItem(this, this.reader.articles[i], this.title_length);
            this._signals.connect(item, "article-read", function() {
                this.update();
            }.bind(this));

            this.menu.addMenuItem(item);

            menu_items++;
        }

        // Add the menu items and close the menu?
        this._addContextMenu();

        runtimeInfo(`Items Loaded: ${menu_items}`);
        runtimeInfo(`Link: ${this.params.url}`);

        const tooltipText = "<b>%s:</b> \n".format(escapeHTML(_("Right Click to display extra options"))) +
            escapeHTML(this.params.url);
        this.tooltip = new Tooltips.Tooltip(this.actor, "");
        this.tooltip._tooltip.get_clutter_text().set_markup(tooltipText);
        this._title.set_text(this.getTitle());

        if (this._unread_count > 0) {
            this.actor.set_style("font-weight:bold;");
        } else {
            this.actor.set_style("font-weight:normal;");
        }

        this._applet.updateAppletState();
    }

    _onButtonReleaseEvent(aActor, aEvent) {
        runtimeInfo(`Button Released Event: ${aEvent.get_button()}`);

        if (aEvent.get_button() === Clutter.BUTTON_SECONDARY) {
            this.toggleFeedContextItems();

            if (!this.menu.isOpen) {
                this._applet.toggleFeedMenu(this);
            }
        } else {
            // Any other click, show menu.
            this._applet.toggleFeedMenu(this);
        }
    }

    _onKeyPressEvent(aActor, aEvent) {
        const symbol = aEvent.get_key_symbol();

        if (symbol === Clutter.KEY_space ||
            symbol === Clutter.KEY_KP_Enter ||
            symbol === Clutter.KEY_Return ||
            symbol === Clutter.KEY_Right) {
            this._applet.toggleFeedMenu(this);
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    openFeedMenu() {
        runtimeInfo(`Feed id: ${this.params.id}`);

        this.menu.open(true);
        this._applet.openedFeedMenu = this;
    }

    closeFeedMenu() {
        runtimeInfo(`Feed id: ${this.params.id}`);
        this.menu.close(false);
    }

    _addContextMenu() {
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(), 0);

        // Add a new item to the top of the list.
        let menu_item;

        if (this.reader.unread_count > this._applet.$._.max_items) {
            // Only one page of items to read, no need to display mark all posts option.
            menu_item = new FeedContextMenuItem(this, _("Mark All Articles as Read"), "mark_all_read");
            this.menu.addMenuItem(menu_item, 0);
            this.menuItemCount++;
        }

        const cnt = (this._applet.$._.max_items < this._unread_count) ?
            this._applet.$._.max_items :
            this._unread_count;

        if (cnt > 0) {
            menu_item = new FeedContextMenuItem(this, ngettext(
                "Mark %d Article as Read".format(cnt),
                "Mark the Next %d Articles as Read".format(cnt),
                cnt
            ), "mark_next_read");
            this.menu.addMenuItem(menu_item, 0);
            this.menuItemCount++;
        }

        if (this.reader.is_redirected) {
            menu_item = new FeedContextMenuItem(this, _("Update Feed URL"), "update_feed_url");
            this.menu.addMenuItem(menu_item, 0);
            this.menuItemCount++;
        }

        this._visitURLContextItem = new FeedContextMenuItem(this, _("Visit Feed URL"), "visit_feed_url");
        this.menu.addMenuItem(this._visitURLContextItem, 0);
        this._visitURLContextItem.actor.visible = false;
        this.menuItemCount++;

        this._toggleShowReadItemsContextItem = new PopupMenu.PopupSwitchMenuItem(
            _("Show read"),
            this.params.show_read_items, {
                focusOnHover: false
            }
        );
        this.menu.addMenuItem(this._toggleShowReadItemsContextItem, 0);
        this._toggleShowReadItemsContextItem.actor.visible = false;
        this._signals.connect(this._toggleShowReadItemsContextItem, "toggled", function(aActor, aEvent) {
            this._toggleSwitch(aActor, aEvent, "show_read_items");
        }.bind(this));
        this.menuItemCount++;

        this._toggleNotifyContextItem = new PopupMenu.PopupSwitchMenuItem(
            _("Notify"),
            this.params.notify, {
                focusOnHover: false
            }
        );
        this.menu.addMenuItem(this._toggleNotifyContextItem, 0);
        this._toggleNotifyContextItem.actor.visible = false;
        this._signals.connect(this._toggleNotifyContextItem, "toggled", function(aActor, aEvent) {
            this._toggleSwitch(aActor, aEvent, "notify");
        }.bind(this));
        this.menuItemCount++;

        this._toggleEnabledContextItem = new PopupMenu.PopupSwitchMenuItem(
            _("Enabled"),
            this.params.enabled, {
                focusOnHover: false
            }
        );
        this.menu.addMenuItem(this._toggleEnabledContextItem, 0);
        this._toggleEnabledContextItem.actor.visible = false;
        this._signals.connect(this._toggleEnabledContextItem, "toggled", function(aActor, aEvent) {
            this._toggleSwitch(aActor, aEvent, "enabled");
        }.bind(this));
        this.menuItemCount++;
    }

    toggleFeedContextItems() {
        if (this._contextVisible) {
            this._closeContextItems();
        } else {
            this._contextVisible = true;
            this._visitURLContextItem.actor.visible = true;
            this._toggleShowReadItemsContextItem.actor.visible = true;
            this._toggleNotifyContextItem.actor.visible = true;
            this._toggleEnabledContextItem.actor.visible = true;
        }
    }

    _closeContextItems() {
        this._contextVisible = false;
        this._visitURLContextItem.actor.visible = false;
        this._toggleShowReadItemsContextItem.actor.visible = false;
        this._toggleNotifyContextItem.actor.visible = false;
        this._toggleEnabledContextItem.actor.visible = false;
    }

    _toggleSwitch(aActor, aEvent, aFeedOption) {
        this.params[aFeedOption] = !this.params[aFeedOption];
        aActor.setToggleState(this.params[aFeedOption]);

        this._applet.requestMenuRebuild = true;
        this._applet.updateFeedsMapItem(this.params.id, aFeedOption, this.params[aFeedOption]);
    }
};
Signals.addSignalMethods(FeedSubMenuItem.prototype);

var FeedMenuItem = class FeedMenuItem extends PopupMenu.PopupSubMenuMenuItem {
    constructor(aSubMenu, aArticle, aWidth) {
        super();

        if (this.menu && this.menu instanceof PopupMenu.PopupSubMenu) {
            this._signals.disconnect("open-state-changed", this.menu);
            this.menu.destroy();
        }

        this.focusOnHover = false;

        this._context_items_count = 0;
        this.subMenu = aSubMenu;

        this.menu = new PopupMenu.PopupSubMenu(this.actor);
        this.article = aArticle;

        if (this.subMenu._applet.$._.show_icons_in_menu) {
            this.icon = new St.Icon({
                icon_type: St.IconType.SYMBOLIC,
                style_class: "popup-menu-icon"
            });
        }

        // Calculate the age of the article, hours or days only
        const age = this._calculateAge(this.article.published);

        this.label = new St.Label({
            text: age + this.article.title
        });

        const box = new St.BoxLayout({
            // NOTE: Use of the popup-combobox-item class to separate the icon from the label.
            style_class: this.subMenu._applet.$._.show_icons_in_menu ?
                "popup-combobox-item" : "popup-submenu-menu-item"
        });
        box.set_width(aWidth);

        if (this.subMenu._applet.$._.show_icons_in_menu) {
            box.add(this.icon, {
                span: 0
            });
        }

        box.add(this.label, {
            expand: true,
            span: 1,
            align: St.Align.START
        });
        this.addActor(box, {
            expand: true
        });

        this.tooltip = new IntelligentTooltip(this.actor, "", {
            max_width: this.subMenu._applet.$._.tooltip_max_width
        });

        // NOTE: Always use plain text strings. Trying to cut a marked up string is just a
        // freaking nightmare.
        let articleDescription = html2text(this.article.description);

        if (this.subMenu._applet.$._.description_max_length !== 0 &&
            articleDescription.length >= this.subMenu._applet.$._.description_max_length) {
            articleDescription = articleDescription
                .substring(0, this.subMenu._applet.$._.description_max_length) + "\n...";
        }

        tryFn(() => {
            this.tooltip._tooltip.get_clutter_text().set_markup(
                "<b>" +
                this.article.title +
                "</b>\n" +
                "<b>%s</b>: ".format(_("Published")) + this.article.published + "\n\n" +
                articleDescription);
        }, (aErr) => {
            runtimeError(`Error Tweaking Tooltip: ${aErr}`);

            const description = this.article.title + "\n" +
                "%s: ".format(_("Published")) + this.article.published + "\n\n" +
                articleDescription;
            this.tooltip._tooltip.set_text(description);
        });

        this._signals.connect(this, "destroy", function() {
            this.tooltip.destroy();
        }.bind(this));

        this._setReadState();
    }

    _setReadState() {
        if (this.article.read) {
            if (this.subMenu._applet.$._.show_icons_in_menu) {
                this.icon.set_icon_name(this.subMenu._applet.$._.feed_icon);
            } else {
                this.label.set_style("font-weight:normal;");
            }
        } else {
            if (this.subMenu._applet.$._.show_icons_in_menu) {
                this.icon.set_icon_name(this.subMenu._applet.$._.new_feed_icon);
            } else {
                this.label.set_style("font-weight:bold;");
            }
        }
    }

    _onButtonReleaseEvent(aActor, aEvent) {
        runtimeInfo(`Button Released Event: ${aEvent.get_button()}`);

        switch (aEvent.get_button()) {
            case Clutter.BUTTON_PRIMARY:
                this.activate(aEvent);

                return Clutter.EVENT_STOP;
            case Clutter.BUTTON_SECONDARY: // Is this feed expanded?
                runtimeInfo("Show Submenu");
                this.toggleContextMenu();

                return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    activate() {
        this.article.openArticle();
        this.markRead();
    }

    markRead() {
        this.article.markArticleRead();
        this._setReadState();

        this._closeContextMenu();

        this.emit("article-read");

        // Check and toggle feeds if this is the last article.
        this.subMenu._applet.toggleFeedMenu(this.subMenu, true);
    }

    _openContextMenu() {
        if (this._context_items_count === 0) {
            // No submenu article(s), add the article(s)
            let menu_item;
            menu_item = new FeedContextMenuItem(this, _("Mark Article as Read"), "mark_post_read");
            this.menu.addMenuItem(menu_item);
            this._context_items_count++;

            menu_item = new FeedContextMenuItem(this, _("Copy Article URL"), "copy_post_url");
            this.menu.addMenuItem(menu_item);
            this._context_items_count++;
        }

        this.menu.open();
    }

    _closeContextMenu() {
        // No need to remove, just close the menu.

        this.menu.close();
    }

    toggleContextMenu() {
        if (!this.menu.isOpen) {
            this._openContextMenu();
        } else {
            this._closeContextMenu();
        }
    }

    _calculateAge(aPublished) {
        // If published date was not provided by the feed, return nothing.
        // Otherwise, this function will return the "start of time" date.
        if (!aPublished) {
            return "";
        }

        try {
            const age = new Date().getTime() - aPublished;
            const h = Math.floor(age / (60 * 60 * 1000));
            const d = Math.floor(age / (24 * 60 * 60 * 1000));

            if (d > 0) {
                return "(" + d + _("d") + ") ";
            } else if (h > 0) {
                return "(" + h + _("h") + ") ";
            } else {
                return _("(<1%s) ".format(_("h")));
            }
        } catch (aErr) {
            global.logError(aErr);
            return "";
        }

        return "";
    }
};

var FeedContextMenuItem = class FeedContextMenuItem extends PopupMenu.PopupBaseMenuItem {
    constructor(aParent, aLabel, aAction) {
        super({
            focusOnHover: false
        });

        this.parent = aParent;
        this._action = aAction;
        this.label = new St.Label({
            text: aLabel
        });
        this.addActor(this.label);
    }

    activate(event) { // jshint ignore:line
        switch (this._action) {
            case "mark_all_read":
                // NOTE: this.parent = FeedSubMenuItem
                runtimeInfo("Marking all items read");
                tryFn(() => {
                    this.parent.reader.markAllArticlesRead();
                    this.parent.update();
                    // All items have been marked so we know we are opening a new feed menu.
                    this.parent._applet.toggleFeedMenu(null);
                }, (aErr) => global.logError(aErr));
                break;
            case "mark_next_read":
                // NOTE: this.parent = FeedSubMenuItem
                runtimeInfo(`Marking next ${this.parent._applet.$._.max_items} items read`);
                tryFn(() => {
                    this.parent.reader.markNextArticlesRead(this.parent._applet.$._.max_items);
                    this.parent.update();
                    this.parent._applet.toggleFeedMenu(this.parent, true);
                }, (aErr) => global.logError(aErr));

                break;
            case "update_feed_url":
                // NOTE: this.parent = FeedSubMenuItem
                tryFn(() => {
                    const redirected_url = this.parent.reader.redirected_url;
                    const current_url = this.parent.params.url;

                    runtimeInfo(`Updating feed to point to: ${redirected_url}`);

                    this.parent._applet.redirectFeed(this.parent, current_url, redirected_url);

                    // Hide the context item. Do not trigger this.update; it will completely destroy
                    // and recreate the sub menu just to hide this context item.
                    this.actor.visible = false;
                }, (aErr) => global.logError(aErr));
                break;
            case "mark_post_read":
                // NOTE: this.parent = FeedMenuItem
                runtimeInfo("Marking article 'read'");
                this.parent.markRead();
                break;
            case "copy_post_url":
                // NOTE: this.parent = FeedMenuItem
                runtimeInfo("Copy article URL");
                copyToClipboard(this.parent.article.link);
                this.parent.subMenu._applet.menu.close(false);
                break;
            case "visit_feed_url":
                // NOTE: this.parent = FeedSubMenuItem
                runtimeInfo(`Opening feed URL: ${this.parent.params.url}`);
                launchUri(this.parent.params.url);
                this.parent._applet.menu.close(false);
                break;
        }
    }

    _onButtonReleaseEvent(actor, event) {
        if (event.get_button() === 1) {
            this.activate(event);
        }

        return Clutter.EVENT_STOP;
    }
};

/* FeedArticleItem objects are used to store data for a single article in a news feed */
var FeedArticleItem = class FeedArticleItem {
    constructor(aParams) {
        // NOTE: Expected params.
        // id
        // title
        // link
        // description
        // published
        for (const prop in aParams) {
            if (aParams.hasOwnProperty(prop)) {
                this[prop] = aParams[prop];
            }
        }

        this.read = false;
        this.deleted = false;
    }

    openArticle() {
        launchUri(this.link);
        this.markArticleRead();
    }

    markArticleRead(aSingle = true) {
        this.read = true;
        // Only notify when marking individual articles.
        if (aSingle) {
            this.emit("article-read");
        }
    }
};
Signals.addSignalMethods(FeedArticleItem.prototype);

var FeedReader = class FeedReader {
    constructor(aSubMenu) {
        this.subMenu = aSubMenu;
        this.article_status = [];
        this._locallyLoaded = false;
        this.error = false;
        this.articlesFilePath = `${DATA_STORAGE_FOLDER}/${aSubMenu._applet.$.instance_id}/${aSubMenu.params.id}`;
        this.entries_file = new File(`${this.articlesFilePath}.json`);
        this.articles_file = null;
        this.signal_manager = new SignalManager.SignalManager();

        this.feed_title = "";
        this.articles = [];
        this.is_redirected = false;
        this.redirected_url = "";
        this._loadArticles();

        this.signal_manager.connect(this, "destroy", function() {
            this.destroy();
        }.bind(this));
    }

    _checkArticlesFile() {
        if (this.articles_file &&
            (this.articles_file.gio_file === null || this.articles_file.path === DATA_STORAGE_FOLDER)) {
            this.articles_file.destroy();
            this.articles_file = null;
            this.articles_file = new File(this.articlesFilePath);
        } else if (!this.articles_file) {
            this.articles_file = new File(this.articlesFilePath);
        }
    }

    get feedInterval() {
        const feedInterval = this.subMenu.params.interval;

        if (feedInterval !== 0 && feedInterval !== this.subMenu._applet.$._.refresh_interval_mins) {
            return feedInterval;
        }

        return this.subMenu._applet.$._.refresh_interval_mins;
    }

    _shouldUpdate() {
        if (this.subMenu._applet.forceDownload ||
            !this.subMenu._applet.$._.last_checked_storage.hasOwnProperty(this.subMenu.params.id)) {
            return true;
        }

        //                       milliseconds  - milliseconds
        if (Math.round(new Date().getTime() -
                this.subMenu._applet.$._.last_checked_storage[this.subMenu.params.id]) >=
            //                       minutes to milliseconds
            Math.round(this.feedInterval * 60 * 1000)) {
            return true;
        }

        return !this.entries_file.exists;
    }

    downloadFeed() {
        if (this._shouldUpdate()) {
            this._locallyLoaded = false;
            runtimeInfo("Processing newly downloaded feed.");
            Util.spawn_async([`${__meta.path}/python_modules/get_feed.py`, this.subMenu.params.url],
                (aResponse, aLocal) => this._processFeed(aResponse, aLocal));
        } else {
            this._locallyLoaded = true;
            runtimeInfo("Processing locally stored feed.");
            this._processFeedLocally();
        }
    }

    _processFeedLocally() {
        this.entries_file.read().then((aData) => {
            /* NOTE: The original authors were right on the money!
             * Do not even think about removing the escape/unescape processes.
             * That thing bit me right in the arse!!!
             */
            this._processFeed(escapeUnescapeReplacer.unescape(aData), true);
        }).catch((aErr) => {
            runtimeError(`Failed to read feed data file for ${this.subMenu.params.url}: ${aErr}`);
        });
    }

    _processFeed(aResponse, aLocal) {
        runtimeInfo(aResponse);

        if (aResponse.trim() === "feedparser_error") {
            this.subMenu._applet.missingDependencies = true;
            this.subMenu._applet.informMissingDependency();
            return;
        }

        const startTime = new Date().getTime(); // Temp timer for gathering info of performance changes
        const new_articles = [];
        const unread_articles = [];
        let info;

        // If aResponse is the data coming from the on-line source, save it for later be used locally.
        if (!aLocal) {
            /* NOTE: The original authors were right on the money!
             * Do not even think about removing the escape/unescape processes.
             * That thing bit me right in the arse!!!
             */
            this.entries_file.write(escapeUnescapeReplacer.escape(aResponse), {
                ensure_parents: !this.entries_file.exists
            }).catch((aErr) => global.logError(aErr));
        }

        tryFn(() => {
            info = JSON.parse(aResponse);
            // Check for error messages first:

            if (info.hasOwnProperty("exception")) {
                // Invalid feed detected, throw and log error.
                this.feed_title = _(info.exception.trim());
                throw info.exception;
            }

            this.feed_title = this.subMenu.params.custom_title || info.title || info.link;
            runtimeInfo(`Processing feed: ${info.title}`);

            // Check if feed has a permanent redirect
            if (!aLocal && info.hasOwnProperty("redirected_url")) {
                this.is_redirected = true;
                this.redirected_url = info.redirected_url;
                runtimeInfo(`Feed has been redirected to: ${info.redirected_url}(Please update feed)`);
                // eventually need to address this more forcefully
            }

            // Look for new items
            for (const entry of info.entries) {

                // We only need to process new items, so check if the item exists already
                const existing = this._getArticleByID(entry.id);

                // not found, add to new item list.
                if (existing === null) {
                    // Do not calculate a date from nothing.
                    const published = entry.pubDate ? new Date(entry.pubDate) : 0;

                    const article = new FeedArticleItem({
                        id: entry.id,
                        title: html2text(entry.title),
                        link: entry.link,
                        description: entry.description,
                        published: published
                    });

                    // Connect the events
                    this.signal_manager.connect(article, "article-read", function() {
                        this._onArticleRead();
                    }.bind(this));

                    // check if already read
                    if (this._isArticleRead(article.id)) {
                        article.read = true;
                    } else {
                        unread_articles.push(article);
                    }

                    new_articles.push(article);
                } else {
                    // Existing article, reuse the article for now.
                    new_articles.push(existing);
                }
            }
        }, (aErr) => global.logError(aErr));

        if (unread_articles.length > 0) {
            runtimeInfo(`Fetched ${unread_articles.length} new articles from ${this.subMenu.params.url}`);
            tryFn(() => {
                this.articles = new_articles;
                // Update the saved articles so we can keep track of new and unread articles.
                this._saveArticles();
                this.emit("articles-updated");

                if (this.subMenu.params.notify) {
                    if (this.subMenu._applet.$._.unified_notifications || unread_articles.length > 1) {
                        this.emit("notify-new-articles", this.feed_title,
                            ngettext(
                                "%d unread article!".format(unread_articles.length),
                                "%d unread articles!".format(unread_articles.length),
                                unread_articles.length
                            )
                        );
                    } else if (!this.subMenu._applet.$._.unified_notifications && unread_articles.length === 1) {
                        this.emit("notify-new-articles", this.feed_title, unread_articles[0].title);
                    }
                } else {
                    runtimeInfo("Item level notifications disabled");
                }
            }, (aErr) => global.logError(aErr));
        }

        // Make articles available even on the first load.
        if (this.articles.length === 0 && new_articles.length > 0) {
            this.articles = new_articles;
            this.emit("articles-updated");
        }

        if (!aLocal && info.hasOwnProperty("lastcheck")) {
            this.subMenu._applet.$._.last_checked_storage[this.subMenu.params.id] = info.lastcheck;
            this.subMenu._applet.$._.last_checked_storage.save();
        }

        // Notify to start the next article downloading.
        const time = new Date().getTime() - startTime;
        this.emit("feed-downloaded");

        runtimeInfo(`Processing Items took: ${time} ms`);
    }

    markAllArticlesRead() {
        for (const article of this.articles) {
            article.markArticleRead(false);
        }

        this.emit("articles-read");
        this._saveArticles();
    }

    markNextArticlesRead(number) {
        runtimeInfo(`Number of articles marked as read: ${number}`);

        // Mark next unread n articles read
        let marked = 0;

        for (const article of this.articles) {
            if (!article.read) {
                marked++;
                article.markArticleRead(false);
            }
            // only mark the number of articles read that we specify.
            if (marked === number) {
                break;
            }
        }

        this.emit("articles-read");
        this._saveArticles();
    }

    _onArticleRead() {
        this.emit("articles-read");
        this._saveArticles();
    }

    _saveArticles() {
        this._checkArticlesFile();

        const article_list = [];
        for (const article of this.articles) {
            article_list.push({
                "id": article.id,
                "read": article.read,
                "deleted": article.deleted
            });
        }

        // Update the article status
        this.article_status = article_list;

        const data = {
            "feed_title": this.feed_title,
            "article_list": article_list
        };

        /* NOTE: The original authors were right on the money!
         * Do not even think about removing the escape/unescape processes.
         * That thing bit me right in the arse!!!
         */
        const output = escapeUnescapeReplacer.escape(JSON.stringify(data));
        this.articles_file.write(output, {
            ensure_parents: !this.articles_file.exists
        }).catch((aErr) => {
            global.logError(`Failed to write feed file ${aErr}`);
        });
    }

    /* This is the callback for the async file load and will
     * load the id, read, deleted status of each message. This is a limited amount of
     * data and thus without a network connection we will not get the title information.
     */
    _loadArticles() {
        this._checkArticlesFile();
        const failLoad = () => {
            this.article_status = [];
            runtimeInfo("Number Loaded: 0");
            this.feed_title = _("Fail to load feed");
            this.emit("articles-loaded");
        };
        this.articles_file.read().then((aData) => {
            if (!aData) {
                failLoad();
                return;
            }

            tryFn(() => {
                /* NOTE: The original authors were right on the money!
                 * Do not even think about removing the escape/unescape processes.
                 * That thing bit me right in the arse!!!
                 */
                const data = JSON.parse(escapeUnescapeReplacer.unescape(aData));

                if (typeof data === "object") {
                    if (data.hasOwnProperty("title")) {
                        this.feed_title = data.title;
                    } else {
                        this.feed_title = _("Loading...");
                    }

                    if (data.hasOwnProperty("article_list")) {
                        this.article_status = data.article_list;
                    } else {
                        this.article_status = [];
                    }

                    runtimeInfo(`Number Loaded: ${this.article_status.length}`);
                    this.emit("articles-loaded");
                } else {
                    global.logError(`Invalid data file for ${this.subMenu.params.url}`);
                }
            }, (aErr) => {
                runtimeError(`Failed to read feed data file for ${this.subMenu.params.url}: ${aErr}`);
            });
        }).catch((aErr) => {
            global.logError(aErr);
            failLoad();
        });
    }

    get unread_count() {
        let count = 0;
        for (const status of this.article_status) {
            if (!status.read) {
                count++;
            }
        }

        return count;
    }

    _getArticleByID(id) {
        let i = this.articles.length;
        while (i--) {
            if (this.articles[i].id === id) {
                return this.articles[i];
            }
        }
        return null;
    }

    _isArticleRead(aId) {
        let i = this.article_status.length;
        while (i--) {
            if (this.article_status[i].id === aId && this.article_status[i].read) {
                return true;
            }
        }
        return false;
    }

    destroy() {
        this.signal_manager.disconnectAllSignals();
        this.entries_file && this.entries_file.destroy();
        this.articles_file && this.articles_file.destroy();
    }
};
Signals.addSignalMethods(FeedReader.prototype);

Debugger.wrapObjectMethods({
    FeedArticleItem: FeedArticleItem,
    FeedMenuItem: FeedMenuItem,
    FeedReader: FeedReader,
    FeedSubMenuItem: FeedSubMenuItem,
    IntelligentTooltip: IntelligentTooltip
});
