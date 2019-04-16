let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta["{{UUID}}"];
}

const {
    gettext: Gettext,
    gi: {
        Clutter,
        Gio,
        GLib,
        Pango,
        Soup,
        St
    },
    misc: {
        util: Util
    },
    signals: Signals,
    ui: {
        main: Main,
        messageTray: MessageTray,
        popupMenu: PopupMenu,
        tooltips: Tooltips
    }
} = imports;

var DataStorage = GLib.get_home_dir() + "/.cinnamon/" + XletMeta.uuid + "-Storage";

const MIN_MENU_WIDTH = 400;
const FEED_LOCAL_DATA_FILE = DataStorage + "/%s.json";

Gettext.bindtextdomain(XletMeta.uuid, GLib.get_home_dir() + "/.local/share/locale");

/**
 * Return the localized translation of a string, based on the xlet domain or
 * the current global domain (Cinnamon's).
 *
 * This function "overrides" the _() function globally defined by Cinnamon.
 *
 * @param {String} aStr - The string being translated.
 *
 * @return {String} The translated string.
 */
function _(aStr) {
    let customTrans = Gettext.dgettext(XletMeta.uuid, aStr);

    if (customTrans !== aStr && aStr !== "") {
        return customTrans;
    }

    return Gettext.gettext(aStr);
}

var escapeUnescapeReplacer = {
    escapeHash: {
        _: (input) => {
            let ret = escapeUnescapeReplacer.escapeHash[input];
            if (!ret) {
                if (input.length - 1) {
                    ret = String.fromCharCode(parseInt(input.substring(input.length - 3 ? 2 : 1), 16));
                } else {
                    let code = input.charCodeAt(0);
                    ret = code < 256 ? "%" + (0 + code.toString(16)).slice(-2).toUpperCase() : "%u" + ("000" + code.toString(16)).slice(-4).toUpperCase();
                }
                escapeUnescapeReplacer.escapeHash[ret] = input;
                escapeUnescapeReplacer.escapeHash[input] = ret;
            }
            return ret;
        }
    },

    escape: (aStr) => {
        return aStr.toString().replace(/[^\w @\*\-\+\.\/]/g, (aChar) => {
            return escapeUnescapeReplacer.escapeHash._(aChar);
        });
    },

    unescape: (aStr) => {
        return aStr.toString().replace(/%(u[\da-f]{4}|[\da-f]{2})/gi, (aSeq) => {
            return escapeUnescapeReplacer.escapeHash._(aSeq);
        });
    }
};

function FeedMessageTraySource() {
    this._init.apply(this, arguments);
}

FeedMessageTraySource.prototype = {
    __proto__: MessageTray.Source.prototype,

    _init: function() {
        MessageTray.Source.prototype._init.call(this, _(XletMeta.name));
        this._setSummaryIcon(this.createNotificationIcon());
    },

    createNotificationIcon: function() {
        return new St.Icon({
            gicon: Gio.icon_new_for_string(XletMeta.path + "/icon.png"),
            icon_size: 24
        });
    },

    open: function() {
        this.destroy();
    }
};

/* Menu item for displaying the feed title*/
function FeedSubMenuItem() {
    this._init.apply(this, arguments);
}

FeedSubMenuItem.prototype = {
    __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,

    _init: function(aURL, aApplet, params) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            hover: false
        });
        this._applet = aApplet;

        // Used to keep track of unique feeds.
        this.feed_id = params.feed_id;
        this.notify = params.notify;
        this.interval = params.interval; // TODO: Not implemented.

        // TODO: Add Box layout type to facilitate adding an icon?
        this.menuItemCount = 0;
        this.show_action_items = false;
        this._title = new St.Label({
            text: "loading"
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

        this.logger = params.logger;
        this.max_items = params.max_items;
        this.show_feed_image = params.show_feed_image; // TODO: Not implemented.
        this.show_read_items = params.show_read_items;
        this.description_max_length = params.description_max_length;
        this.tooltip_max_width = params.tooltip_max_width;
        this.unread_count = 0;
        this.logger.debug("Loading FeedReader url: " + aURL);
        this.custom_title = params.custom_title;

        this.reader = new FeedReader(
            this,
            this.logger,
            this.feed_id,
            aURL,
            this.notify, {
                onUpdate: () => this.update(),
                onError: () => this.error(),
                onNewItem: (feed, feedtitle, itemtitle) => {
                    this._applet.new_item_notification(feed, feedtitle, itemtitle);
                },
                onItemRead: (feed) => {
                    this._applet.item_read_notification(feed);
                },
                onDownloaded: () => {
                    this._applet.process_next_feed();
                }
            }
        );

        this.reader.connect("items-loaded", () => {
            this.logger.debug("items-loaded Event Fired for reader");
            // Title needs to be set on items-loaded event
            this.rssTitle = this.custom_title ? this.custom_title : this.reader.title;
            this._title.set_text(this.rssTitle);

            this.title_length = (this._title.length > MIN_MENU_WIDTH) ?
                this._title.length :
                MIN_MENU_WIDTH;
            this._applet.enqueue_feed(this);
            this.update();
            this._applet.process_next_feed();
        });

        this.actor.connect("enter-event",
            () => this._buttonEnterEvent());
        this.actor.connect("leave-event",
            () => this._buttonLeaveEvent());
    },

    get_title: function() {
        let title = this.custom_title || this.reader.title;
        if (this.reader.is_redirected) {
            title += " (Redirected to: " + this.reader.redirected_url + ")";
        }
        title += " [" + this.reader.get_unread_count() + " / " + this.reader.items.length + "]";
        return title;
    },

    get_unread_count: function() {
        return this.unread_count;
    },

    error: function(reader, message, full_message) { // jshint ignore:line
        this.menu.removeAll();
    },

    update: function() {
        this.logger.debug("");
        this.menu.removeAll();
        this.menuItemCount = 0;
        let msg = "Finding first " +
            this.max_items +
            " unread items out of: " +
            this.reader.items.length +
            " total items";

        this.logger.debug(msg);
        let menu_items = 0;
        this.unread_count = 0;

        for (let i = 0; i < this.reader.items.length && menu_items < this.max_items; i++) {
            if (this.reader.items[i].read && !this.show_read_items) {
                continue;
            }

            if (!this.reader.items[i].read) {
                this.unread_count++;
            }

            let item = new FeedMenuItem(this, this.reader.items[i], this.title_length, this.logger);
            item.connect("item-read", () => {
                this.update();
            });
            this.menu.addMenuItem(item);

            menu_items++;
        }

        // Add the menu items and close the menu?
        this._add_submenu();

        this.logger.debug("Items Loaded: " + menu_items);
        this.logger.debug("Link: " + this.reader.url);

        let tooltipText = "<b>%s:</b> \n".format(escapeHTML(_("Right Click to open feed"))) +
            escapeHTML(this.reader.url);
        this.tooltip = new Tooltips.Tooltip(this.actor, "");
        this.tooltip._tooltip.get_clutter_text().set_markup(tooltipText);
        this._title.set_text(this.get_title());

        if (this.unread_count > 0) {
            this.actor.set_style("font-weight:bold;");
        } else {
            this.actor.set_style("font-weight:normal;");
        }

        this._applet.update_title();
    },

    on_settings_changed: function(params) {
        this.max_items = params.max_items;
        this.show_feed_image = params.show_feed_image; // TODO: Not implemented.
        this.show_read_items = params.show_read_items;
        this.description_max_length = params.description_max_length;
        this.tooltip_max_width = params.tooltip_max_width;
        this.update();
    },

    _onButtonReleaseEvent: function(actor, event) {
        this.logger.debug("Button Released Event: " + event.get_button());

        if (event.get_button() == 3) {
            // Right click, open feed url
            try {
                Util.spawnCommandLine("xdg-open " + this.reader.get_url());
            } catch (aErr) {
                global.logError(aErr);
            }
        } else {
            // Left click, show menu
            this._applet.toggle_feeds(this);
        }
    },

    _onKeyPressEvent: function(actor, event) {
        let symbol = event.get_key_symbol();

        if (symbol === Clutter.KEY_space ||
            symbol === Clutter.KEY_Return ||
            symbol === Clutter.KEY_Right) {
            this._applet.toggle_feeds(this);
            return true;
        }
        return false;
    },

    open_menu: function() {
        this.logger.debug("Feed id:" + this.feed_id);

        this.menu.open(true);
        this._applet.open_menu = this;
    },

    close_menu: function() {
        this.logger.debug("Feed id:" + this.feed_id);
        this.menu.close(false);
    },

    _add_submenu: function() {
        // Add a new item to the top of the list.
        let menu_item;

        if (this.reader.get_unread_count() > this.max_items) {
            // Only one page of items to read, no need to display mark all posts option.
            menu_item = new FeedContextMenuItem(this, _("Mark All Posts Read"), "mark_all_read");
            this.menu.addMenuItem(menu_item, 0);
            this.menuItemCount++;
        }

        let cnt = (this.max_items < this.unread_count) ? this.max_items : this.unread_count;
        if (cnt > 0) {
            menu_item = new FeedContextMenuItem(this,
                _("Mark Next %d Posts Read".format(cnt)), "mark_next_read");
            this.menu.addMenuItem(menu_item, 0);
            this.menuItemCount++;
        }

        if (this.reader.is_redirected) {
            menu_item = new FeedContextMenuItem(this, _("Update feed URL"), "update_feed_url");
            this.menu.addMenuItem(menu_item, 0);
            this.menuItemCount++;
        }
    },

    _buttonEnterEvent: function() {
        this.actor.change_style_pseudo_class("active", true);
    },

    _buttonLeaveEvent: function() {
        this.actor.change_style_pseudo_class("active", false);
    }
};
Signals.addSignalMethods(FeedSubMenuItem.prototype);

/* Menu item for displaying an feed item */
function FeedMenuItem() {
    this._init.apply(this, arguments);
}

FeedMenuItem.prototype = {
    __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,

    _init: function(parent, item, width, logger, params) { // jshint ignore:line
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            hover: false
        });
        this._item_menu_count = 0;
        this.parent = parent;
        this.logger = logger;
        this.show_action_items = false;

        this.menu = new PopupMenu.PopupSubMenu(this.actor);
        this.item = item;
        if (this.item.read) {
            this._icon_name = this.parent._applet.pref_feed_icon;
            this.icon_type = St.IconType.SYMBOLIC;
        } else {
            this._icon_name = this.parent._applet.pref_new_feed_icon;
            this.icon_type = St.IconType.FULLCOLOR;
        }

        this.icon = new St.Icon({
            icon_name: this._icon_name,
            icon_type: this.icon_type,
            style_class: "popup-menu-icon"
        });

        // Calculate the age of the post, hours or days only
        let age = this.calculate_age(item.published);

        this.label = new St.Label({
            text: age + item.title
        });

        let box = new St.BoxLayout({
            style_class: "popup-combobox-item"
        });
        box.set_width(width);

        box.add(this.icon, {
            span: 0
        });
        box.add(this.label, {
            expand: true,
            span: 1,
            align: St.Align.START
        });
        this.addActor(box, {
            expand: true
        });

        this.tooltip = new CustomTooltip(this.actor, "");
        this.tooltip._tooltip.set_style("text-align: left;max-width: %spx;"
            .format(this.parent.tooltip_max_width));
        this.tooltip._tooltip.get_clutter_text().set_line_wrap(true);
        this.tooltip._tooltip.get_clutter_text().set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        this.tooltip._tooltip.get_clutter_text().ellipsize = Pango.EllipsizeMode.NONE; // Just in case

        try {
            this.tooltip._tooltip.get_clutter_text().set_markup(
                "<b>" +
                item.title +
                "</b>\n" +
                "<b>%s</b>: ".format(_("Published")) + item.published + "\n\n" +
                item.description);
        } catch (aErr) {
            this.logger.warning("Error Tweaking Tooltip: " + aErr);

            let description = item.title + "\n" +
                "%s: ".format(_("Published")) + item.published + "\n\n" +
                item.description_text;
            this.tooltip._tooltip.set_text(description);
        }

        /* Ensure tooltip is destroyed when this menu item is destroyed */
        this.connect("destroy", () => {
            this.tooltip.destroy();
        });
        this.actor.connect("enter-event",
            () => this._buttonEnterEvent());
        this.actor.connect("leave-event",
            () => this._buttonLeaveEvent());
    },

    _onButtonReleaseEvent: function(actor, event) {
        this.logger.debug("Button Released Event: " + event.get_button());

        if (event.get_button() == 1) {
            this.activate(event);
            return true;
        }

        // Is this feed expanded?
        if (event.get_button() == 3) {
            this.logger.debug("Show Submenu");
            this.toggleContextMenu();
            // this.open_menu();
            return true;
        }
        return false;
    },

    activate: function() {
        /* Opens item then marks it read */
        this.item.open();
        this.mark_read();
    },

    mark_read: function() {
        /* Marks the item read without opening it. */
        this.logger.debug("mark_read");
        this.item.mark_read();
        this._icon_name = this.parent._applet.pref_feed_icon;
        this.icon.set_icon_name(this._icon_name);
        // Close sub menus if action has been taken.
        if (this.show_action_items) {
            this.toggleContextMenu();
        }

        this.emit("item-read");

        // Check and toggle feeds if this is the last item.
        // if(this.parent.get_unread_count() == 0)
        this.parent._applet.toggle_feeds(this.parent, true);
    },

    _open_context_menu: function() {
        this.logger.debug("");

        if (this._item_menu_count == 0) {
            // No submenu item(s), add the item(s)
            let menu_item;
            menu_item = new FeedContextMenuItem(this, _("Mark Post Read"), "mark_post_read");
            this.menu.addMenuItem(menu_item);
            this._item_menu_count++;
        }

        this.menu.open();
    },

    _close_context_menu: function() {
        this.logger.debug("");
        // no need to remove, just close the menu.

        this.menu.close();
    },

    toggleContextMenu: function() {
        this.logger.debug("");

        if (!this.menu.isOpen) {
            this._open_context_menu();
        } else {
            this._close_context_menu();
        }
    },

    calculate_age: function(published) {
        // If published date was not provided by the feed, return nothing.
        // Otherwise, this function will return the "start of time" date.
        if (!published) {
            return "";
        }

        try {
            let age = new Date().getTime() - published;
            let h = Math.floor(age / (60 * 60 * 1000));
            let d = Math.floor(age / (24 * 60 * 60 * 1000));

            if (d > 0) {
                return "(" + d + _("d") + ") ";
            } else if (h > 0) {
                return "(" + h + _("h") + ") ";
            } else {
                return _("(<1%s) ".format(_("h")));
            }
        } catch (aErr) {
            this.logger.error(aErr);
            return "";
        }
    },

    _buttonEnterEvent: function() {
        this.actor.change_style_pseudo_class("active", true);
    },

    _buttonLeaveEvent: function() {
        this.actor.change_style_pseudo_class("active", false);
    }
};

function FeedContextMenuItem(feed_display_menu_item, label, action) {
    this._init(feed_display_menu_item, label, action);
}

FeedContextMenuItem.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(feed_display_menu_item, label, action) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            hover: false
        });

        this._source_item = feed_display_menu_item;
        this.logger = feed_display_menu_item.logger;
        this._action = action;
        this.label = new St.Label({
            text: label
        });
        this.addActor(this.label);
        this.actor.connect("enter-event",
            () => this._buttonEnterEvent());
        this.actor.connect("leave-event",
            () => this._buttonLeaveEvent());
    },

    activate: function(event) { // jshint ignore:line
        this.logger.debug("");

        switch (this._action) {
            case "mark_all_read":
                this.logger.debug("Marking all items read");
                try {
                    this._source_item.reader.mark_all_items_read();
                    this._source_item.update();
                    // All items have been marked so we know we are opening a new feed menu.
                    this._source_item._applet.toggle_feeds(null);
                } catch (aErr) {
                    this.logger.error("Error: " + aErr);
                }
                break;
            case "mark_next_read":
                this.logger.debug("Marking next " + this._source_item.max_items + " items read");
                try {
                    this._source_item.reader.mark_next_items_read(this._source_item.max_items);
                    this._source_item.update();
                    this._source_item._applet.toggle_feeds(this._source_item, true);

                } catch (aErr) {
                    this.logger.error("error: " + aErr);
                }

                break;
            case "update_feed_url":
                try {
                    let redirected_url = this._source_item.reader.redirected_url;
                    let current_url = this._source_item.reader.url;

                    this.logger.debug("Updating feed to point to: " + redirected_url);

                    // Update the feed, no GUI is shown

                    this._source_item._applet.redirect_feed(current_url, redirected_url);

                    // Reload the regular title and remove the is_redirected flag
                    this._source_item._applet.toggle_feeds(this._source_item, true);
                } catch (aErr) {
                    global.logError(aErr);
                }
                break;
            case "mark_post_read":
                this.logger.debug("Marking item 'read'");
                this._source_item.mark_read();
                break;

                // TODO: Not implemented.
                // case "delete_all_items":
                //     this.logger.debug("Marking all items 'deleted'");
                //     break;

                // TODO: Not implemented.
                // case "delete_post":
                //     this.logger.debug("Deleting item");
                //     break;
        }
    },

    _onButtonReleaseEvent: function(actor, event) {
        if (event.get_button() == 1) {
            this.activate(event);
        }
        return true;
    },

    _buttonEnterEvent: function() {
        this.actor.change_style_pseudo_class("active", true);
    },

    _buttonLeaveEvent: function() {
        this.actor.change_style_pseudo_class("active", false);
    }
};

/* FeedDataItem objects are used to store data for a single item in a news feed */
function FeedDataItem() {
    this._init.apply(this, arguments);
}

FeedDataItem.prototype = {
    _init: function(id, title, link, description, description_text, published) {
        this.id = id;
        this.title = title;
        this.link = link;
        this.description = description;
        this.description_text = description_text;
        this.published = published;
        this.read = false;
        this.deleted = false;
        this.is_redirected = false;
    },

    open: function() {
        try {
            Util.spawnCommandLine("xdg-open " + this.link);
        } catch (aErr) {
            global.logError(aErr);
        }
        this.mark_read();
    },

    mark_read: function(single = true) {
        this.read = true;
        // Only notify when marking individual items
        if (single) {
            this.emit("item-read");
        }
    },

    delete_item: function() {
        this.deleted = true;
        this.emit("item-deleted");
    }
};
Signals.addSignalMethods(FeedDataItem.prototype);

function FeedReader() {
    this._init.apply(this, arguments);
}

FeedReader.prototype = {
    _init: function(parent, logger, id, url, notify, callbacks) {
        this.parent = parent;
        this.logger = logger;
        this.id = id;
        this.item_status = [];
        this.url = url;
        this.notify = notify;
        this.callbacks = callbacks;
        this.error = false;
        this.entries_file = Gio.file_new_for_path(FEED_LOCAL_DATA_FILE.format(id));

        /* Feed data */
        this.title = "";
        this.items = [];

        this.image = {};

        /* Init HTTP session */
        try {
            this.session = new Soup.SessionAsync();
            Soup.Session.prototype.add_feature.call(this.session,
                new Soup.ProxyResolverDefault());
        } catch (aErr) {
            this.logger.error(aErr);
            throw "Failed to create HTTP session: " + aErr;
        }

        this.load_items();
    },

    get_url: function() {
        return this.url;
    },

    _shouldUpdate: function() {
        if (!this.parent._applet.pref_last_checked_storage.hasOwnProperty(this.id)) {
            return true;
        }

        //                       milliseconds  - milliseconds
        if (Math.round(new Date().getTime() -
                this.parent._applet.pref_last_checked_storage[this.id]) >=
            //                       minutes to milliseconds
            Math.round(this.parent._applet.pref_refresh_interval_mins * 60 * 1000)) {
            return true;
        }

        return !this.entries_file.query_exists(null);
    },

    download_feed: function() {
        this.logger.debug("");

        if (this._shouldUpdate() || this.parent._applet.force_download) {
            this.logger.debug("Processing newly downloaded feed.");
            Util.spawn_async([XletMeta.path + "/python/get_feed.py", this.url],
                (response, aLocal) => this.process_feed(response, aLocal));
        } else {
            this.logger.debug("Processing locally stored feed.");
            this.process_feed_locally();
        }
    },

    process_feed_locally: function() {
        this.logger.debug("");
        this.entries_file.load_contents_async(null, (aFile, aResponce) => {
            let success,
                contents = "",
                tag;

            try {
                [success, contents, tag] = aFile.load_contents_finish(aResponce);
            } catch (aErr) {
                this.logger.warning(aErr);
            }

            try {
                this.process_feed(escapeUnescapeReplacer.unescape(contents), true);
            } catch (aErr) {
                /* Invalid file contents */
                this.logger.error("Failed to read feed data file for " + this.url + ":" + aErr);
            }
        });
    },

    process_feed: function(response, aLocal) {
        this.logger.debug("");
        this.logger.debug(response);

        if (response.trim() === "feedparser_error") {
            this.parent._applet._informMissingDependency();
            return;
        }

        let startTime = new Date().getTime(); // Temp timer for gathering info of performance changes
        let new_items = [];
        let unread_items = [];
        let info;

        // If response is the data coming from the on-line source, save it for later be used locally.
        if (!aLocal) {
            saveToFileAsync(escapeUnescapeReplacer.escape(response), this.entries_file);
        }

        try {
            info = JSON.parse(response);
            // Check for error messages first:

            if (info.exception != undefined) {
                // Invalid feed detected, throw and log error.
                this.title = _("Invalid feed url");
                throw info.exception;
            }

            this.title = info.title;
            this.logger.debug("Processing feed: " + info.title);

            // Check if feed has a permanent redirect
            if (!aLocal && info.redirected_url != undefined) {
                this.is_redirected = true;
                this.redirected_url = info.redirected_url;
                this.logger.debug("Feed has been redirected to: " + info.redirected_url + "(Please update feed)");
                // eventually need to address this more forcefully
            }

            // Look for new items
            let i = 0,
                iLen = info.entries.length;
            for (; i < iLen; i++) {
                // We only need to process new items, so check if the item exists already
                let existing = this._get_item_by_id(info.entries[i].id);

                // not found, add to new item list.
                if (existing == null) {
                    // Do not calculate a date from nothing.
                    let published = info.entries[i].pubDate ? new Date(info.entries[i].pubDate) : "";
                    // format title once as text
                    let title = this.html2text(info.entries[i].title);

                    // Store the description once as text and once as pango
                    let description_text = this.html2text(info.entries[i].description)
                        .substring(0, this.parent.description_max_length);
                    let description = this.html2pango(info.entries[i].description)
                        .substring(0, this.parent.description_max_length);

                    let item = new FeedDataItem(info.entries[i].id,
                        title,
                        info.entries[i].link,
                        description,
                        description_text,
                        published
                    );

                    // Connect the events
                    item.connect("item-read", () => {
                        this.on_item_read();
                    });
                    item.connect("item-deleted", () => {
                        this.on_item_deleted();
                    });

                    // check if already read
                    if (this._is_item_read(item.id)) {
                        item.read = true;
                    } else {
                        unread_items.push(item);
                    }

                    new_items.push(item);
                } else {
                    // Existing item, reuse the item for now.
                    new_items.push(existing);
                }
            }
        } catch (aErr) {
            this.logger.error(aErr);
        }

        /* Were there any new items? */
        if (unread_items.length > 0) {
            this.logger.debug("Fetched " + unread_items.length + " new items from " + this.url);
            try {
                this.items = new_items;
                // Update the saved items so we can keep track of new and unread items.
                this.save_items();
                this.callbacks.onUpdate();

                if (!this.notify) {
                    this.logger.debug("Item level notifications disabled");
                } else {
                    if (this.parent._applet.pref_unified_notifications || unread_items.length > 1) {
                        this.callbacks.onNewItem(this, this.title, _("%d unread items!".format(unread_items.length)));
                    } else if (!this.parent._applet.pref_unified_notifications && unread_items.length == 1) {
                        this.callbacks.onNewItem(this, this.title, unread_items[0].title);
                    }
                }
            } catch (aErr) {
                this.logger.error(aErr);
            }
        }

        // Make items available even on the first load.
        if (this.items.length == 0 && new_items.length > 0) {
            this.items = new_items;
            // TODO: Switch to be an event
            this.callbacks.onUpdate();
            // this.emit('')
        }

        if (!aLocal && info.hasOwnProperty("lastcheck")) {
            this.parent._applet.pref_last_checked_storage[this.id] = info.lastcheck;
            this.parent._applet.pref_last_checked_storage.save();
        }

        // Notify to start the next item downloading.
        let time = new Date().getTime() - startTime;
        // TODO: Switch to be an event
        this.callbacks.onDownloaded();
        // this.emit('')

        this.logger.debug("Processing Items took: " + time + " ms");
    },

    mark_all_items_read: function() {
        this.logger.debug("");

        let i = this.items.length;
        while (i--) {
            this.items[i].mark_read(false);
        }

        // TODO: Switch to be an event
        this.callbacks.onItemRead(this);
        // this.emit('')
        this.save_items();
    },

    mark_next_items_read: function(number) {
        this.logger.debug("Number of items marked as read:" + number);

        // Mark next unread n items read
        let marked = 0;
        let i = 0,
            iLen = this.items.length;
        for (; i < iLen; i++) {
            if (!this.items[i].read) {
                marked++;
                this.items[i].mark_read(false);
            }
            // only mark the number of items read that we specify.
            if (marked == number) {
                break;
            }
        }
        // TODO: Switch to be an event
        this.callbacks.onItemRead(this);
        this.save_items();
    },

    on_item_read: function() {
        this.logger.debug("");
        // TODO: Switch to be an event
        this.callbacks.onItemRead(this);
        this.save_items();
    },

    on_item_deleted: function() {
        this.logger.debug("");
        this.save_items();
    },

    save_items: function() {
        this.logger.debug("");
        try {
            let dir = Gio.file_parse_name(DataStorage);
            if (!dir.query_exists(null)) {
                dir.make_directory_with_parents(null);
            }

            /* Write feed items read list to a file as JSON.
             * I found escaping the string helps to deal with special
             * characters, which could cause problems when parsing the file
             * later */
            // Filename is now the uuid created when a feed is added to the list.
            let filename = DataStorage + "/" + this.id;
            this.logger.debug("Saving feed data to: " + filename);

            let file = Gio.file_parse_name(filename);

            let item_list = [];
            let i = 0,
                iLen = this.items.length;
            for (; i < iLen; i++) {
                item_list.push({
                    "id": this.items[i].id,
                    "read": this.items[i].read,
                    "deleted": this.items[i].deleted
                });
            }

            // Update the item status
            this.item_status = item_list;

            let data = {
                "feed_title": this.title,
                "item_list": item_list
            };

            let output = escapeUnescapeReplacer.escape(JSON.stringify(data));
            saveToFileAsync(output, file);
        } catch (aErr) {
            global.logError("Failed to write feed file " + aErr);
        }
    },

    /* This is the callback for the async file load and will
     * load the id, read, deleted status of each message. This is a limited amount of
     * data and thus without a network connection we will not get the title information.
     */
    load_items: function() {
        this.logger.debug("");

        let file = Gio.file_new_for_path(DataStorage + "/" + this.id);

        file.load_contents_async(null, (aFile, aResponce) => {
            let success,
                contents = "",
                tag;

            try {
                [success, contents, tag] = aFile.load_contents_finish(aResponce);
            } catch (aErr) {
                this.logger.warning(aErr);
            }

            if (!contents) {
                this.item_status = [];
                this.logger.debug("Number Loaded: 0");
                this.title = _("Loading feed");
                this.emit("items-loaded");
                return;
            }

            try {
                /* NOTE: The original authors were right on the money!
                 * Do not even think about removing the escape/unescape processes.
                 * That thing bite me right in the arse!!!
                 */
                let data = JSON.parse(escapeUnescapeReplacer.unescape(contents));

                if (typeof data == "object") {
                    if (data.feed_title != undefined) {
                        this.title = data.feed_title;
                    } else {
                        this.title = _("Loading feed");
                    }

                    if (data.item_list != undefined) {
                        this.item_status = data.item_list;
                    } else {
                        this.item_status = [];
                    }

                    this.logger.debug("Number Loaded: " + this.item_status.length);
                    this.emit("items-loaded");
                } else {
                    global.logError("Invalid data file for " + this.url);
                }
            } catch (aErr) {
                this.logger.error("Failed to read feed data file for " + this.url + ":" + aErr);
            }
        });
    },

    get_unread_count: function() {
        let count = 0;
        for (let i = 0; i < this.item_status.length; i++) {
            if (!this.item_status[i].read) {
                count++;
            }
        }
        return count;
    },

    _get_item_by_id: function(id) {
        let i = this.items.length;
        while (i--) {
            if (this.items[i].id == id) {
                return this.items[i];
            }
        }
        return null;
    },

    _is_item_read: function(id) {
        let i = this.item_status.length;
        while (i--) {
            if (this.item_status[i].id == id && this.item_status[i].read) {
                return true;
            }
        }
        return false;
    },

    on_error: function(msg, details) {
        this.logger.debug("FeedReader (" + this.url + "): " + msg);
        this.error = true;
        this.error_messsage = msg;
        this.error_details = details;
        // TODO: Switch to be an event
        if (this.callbacks.onError) {
            this.callbacks.onError(this, msg, details);
        }

        return 1;
    },

    html2text: function(html) {
        /* Convert html to plaintext */
        let ret = html.replace("<br/>", "\n");
        ret = ret.replace("</p>", "\n");
        ret = ret.replace(/<\/h[0-9]>/g, "\n\n");
        ret = ret.replace(/<.*?>/g, "");
        ret = ret.replace("&nbsp;", " ");
        ret = ret.replace("&quot;", '"');
        ret = ret.replace("&rdquo;", '"');
        ret = ret.replace("&ldquo;", '"');
        ret = ret.replace("&#8220;", '"');
        ret = ret.replace("&#8221;", '"');
        ret = ret.replace("&rsquo;", "'");
        ret = ret.replace("&lsquo;", "'");
        ret = ret.replace("&#8216;", "'");
        ret = ret.replace("&#8217;", "'");
        ret = ret.replace("&#8230;", "...");
        return ret;
    },

    html2pango: function(html) {
        let ret = html;
        let esc_open = "-@~]";
        let esc_close = "]~@-";

        /* </p> <br/> --> newline */
        ret = ret.replace("<br/>", "\n").replace("</p>", "\n");

        /* &nbsp; --> space */
        ret = ret.replace(/&nbsp;/g, " ");

        /* Headings --> <b> + 2*newline */
        ret = ret.replace(/<h[0-9]>/g, esc_open + 'span weight="bold"' + esc_close);
        ret = ret.replace(/<\/h[0-9]>\s*/g, esc_open + "/span" + esc_close + "\n\n");

        /* <strong> -> <b> */
        ret = ret.replace("<strong>", esc_open + "b" + esc_close);
        ret = ret.replace("</strong>", esc_open + "/b" + esc_close);

        /* <i> -> <i> */
        ret = ret.replace("<i>", esc_open + "i" + esc_close);
        ret = ret.replace("</i>", esc_open + "/i" + esc_close);

        /* Strip remaining tags */
        ret = ret.replace(/<.*?>/g, "");

        /* Replace escaped <, > with actual angle-brackets */
        let re1 = new RegExp(esc_open, "g");
        let re2 = new RegExp(esc_close, "g");
        ret = ret.replace(re1, "<").replace(re2, ">");

        let cleanedRet = ret.replace(/[\r\n]+/g, "\n");

        return cleanedRet;
    }
};
Signals.addSignalMethods(FeedReader.prototype);

/**
 * Logger
 * Implemented using the functions found in:
 * http://stackoverflow.com/a/13227808
 */
function Logger() {
    this._init.apply(this, arguments);
}

Logger.prototype = {
    _init: function(aDisplayName, aVerbose) {
        this.verbose = aVerbose;
        this.base_message = "[" + aDisplayName + "::%s]%s";
    },

    /**
     * debug
     *
     * Log a message only when verbose logging is enabled.
     *
     * @param  {String} aMsg The message to log.
     */
    debug: function(aMsg) {
        if (this.verbose) {
            global.log(this.base_message.format(this._getCaller(), this._formatMessage(aMsg)));
        }
    },

    /**
     * error
     *
     * Log an error message.
     *
     * @param  {String} aMsg The message to log.
     */
    error: function(aMsg) {
        global.logError(this.base_message.format(this._getCaller(), this._formatMessage(aMsg)));
    },

    /**
     * warning
     *
     * Log a warning message.
     *
     * @param  {String} aMsg The message to log.
     */
    warning: function(aMsg) {
        global.logWarning(this.base_message.format(this._getCaller(), this._formatMessage(aMsg)));
    },

    /**
     * info
     *
     * Log an info message.
     *
     * @param {String} aMsg - The message to log.
     */
    info: function(aMsg) {
        global.log(this.base_message.format(this._getCaller(), this._formatMessage(aMsg)));
    },

    /**
     * _formatMessage
     *
     * It just adds a space at the beginning of a string if the string isn't empty.
     *
     * @param  {String} aMsg The message to "format".
     * @return {String}      The formatted message.
     */
    _formatMessage: function(aMsg) {
        return aMsg ? " " + aMsg : "";
    },

    /**
     * [_getCaller description]
     * @return {String} A string representing the caller function name plus the
     * file name and line number.
     */
    _getCaller: function() {
        let stack = this._getStack();

        // Remove superfluous function calls on stack
        stack.shift(); // _getCaller --> _getStack
        stack.shift(); // debug --> _getCaller

        let caller = stack[0].split("/");
        // Return only the caller function and the file name and line number.
        return (caller.shift() + "@" + caller.pop()).replace(/\@+/g, "@");
    },

    _getStack: function() {
        // Save original Error.prepareStackTrace
        let origPrepareStackTrace = Error.prepareStackTrace;

        // Override with function that just returns `stack`
        Error.prepareStackTrace = (_, stack) => {
            return stack;
        };

        // Create a new `Error`, which automatically gets `stack`
        let err = new Error();

        // Evaluate `err.stack`, which calls our new `Error.prepareStackTrace`
        let stack = err.stack.split("\n");

        // Restore original `Error.prepareStackTrace`
        Error.prepareStackTrace = origPrepareStackTrace;

        // Remove superfluous function call on stack
        stack.shift(); // getStack --> Error

        return stack;
    }
};

function escapeHTML(aStr) {
    aStr = String(aStr)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    return aStr;
}

function saveToFileAsync(aData, aFile, aCallback) {
    let data = new GLib.Bytes(aData);

    aFile.replace_async(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION,
        GLib.PRIORITY_DEFAULT, null,
        (aObj, aResponse) => {
            let stream = aObj.replace_finish(aResponse);

            stream.write_bytes_async(data, GLib.PRIORITY_DEFAULT,
                null,
                (aW_obj, aW_res) => {

                    aW_obj.write_bytes_finish(aW_res);
                    stream.close(null);

                    if (aCallback && typeof aCallback === "function") {
                        aCallback();
                    }
                });
        });
}

/**
 * An instance of Tooltips.Tooltip that positions the tooltip above the
 * mouse cursor if the tooltip is to big to fit the screen.
 *
 * This is only useful for tooltips close the the bottom of the screen.
 * Top panel users will surely be screwed if a tooltip is bigger than the
 * screen height. LOL
 */
function CustomTooltip() {
    this._init.apply(this, arguments);
}

CustomTooltip.prototype = {
    __proto__: Tooltips.Tooltip.prototype,

    _init: function(aActor, aTitle) {
        Tooltips.Tooltip.prototype._init.call(this, aActor, aTitle);

        this.desktop_settings = new Gio.Settings({
            schema_id: "org.cinnamon.desktop.interface"
        });
    },

    show: function() {
        if (this._tooltip.get_text() == "" || !this.mousePosition)
            return;

        let tooltipWidth = this._tooltip.get_allocation_box().x2 - this._tooltip.get_allocation_box().x1;
        let tooltipHeight = this._tooltip.get_height();

        let monitor = Main.layoutManager.findMonitorForActor(this.item);

        let cursorSize = this.desktop_settings.get_int("cursor-size");
        let tooltipTop = this.mousePosition[1] + Math.round(cursorSize / 1.5);
        let tooltipLeft = this.mousePosition[0] + Math.round(cursorSize / 2);
        tooltipLeft = Math.max(tooltipLeft, monitor.x);
        tooltipLeft = Math.min(tooltipLeft, monitor.x + monitor.width - tooltipWidth);

        if (tooltipTop + tooltipHeight > monitor.height) {
            tooltipTop = tooltipTop - tooltipHeight - Math.round(cursorSize);
        }

        this._tooltip.set_position(tooltipLeft, tooltipTop);

        this._tooltip.show();
        this._tooltip.raise_top();
        this.visible = true;
    }
};

/* exported escapeHTML
 */
