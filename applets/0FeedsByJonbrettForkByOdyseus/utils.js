let XletMeta,
    GlobalUtils,
    Constants,
    DebugManager,
    CustomTooltips,
    CustomFileUtils;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta["{{UUID}}"];
}

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
    Constants = require("./constants.js");
    DebugManager = require("./debugManager.js");
    CustomTooltips = require("./customTooltips.js");
    CustomFileUtils = require("./customFileUtils.js");
} else {
    GlobalUtils = imports.ui.appletManager.applets["{{UUID}}"].globalUtils;
    Constants = imports.ui.appletManager.applets["{{UUID}}"].constants;
    DebugManager = imports.ui.appletManager.applets["{{UUID}}"].debugManager;
    CustomTooltips = imports.ui.appletManager.applets["{{UUID}}"].customTooltips;
    CustomFileUtils = imports.ui.appletManager.applets["{{UUID}}"].customFileUtils;
}

const {
    gi: {
        Clutter,
        Gio,
        Pango,
        Soup,
        St
    },
    misc: {
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
    escapeUnescapeReplacer,
    escapeHTML
} = GlobalUtils;

const {
    saveToFileAsync
} = CustomFileUtils;

const {
    InteligentTooltip
} = CustomTooltips;

const {
    MIN_MENU_WIDTH,
    FEED_LOCAL_DATA_FILE,
    DataStorage
} = Constants;

const {
    LoggingLevel
} = DebugManager;

var Debugger = new DebugManager.DebugManager();

function runtimeInfo(aMsg) {
    Debugger.logging_level !== LoggingLevel.NORMAL && aMsg &&
        global.log("[FeedReader] " + aMsg);
}

function runtimeError(aMsg) {
    aMsg && global.logError("[FeedReader] " + aMsg);
}

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

        this.max_items = params.max_items;
        this.show_feed_image = params.show_feed_image; // TODO: Not implemented.
        this.show_read_items = params.show_read_items;
        this.description_max_length = params.description_max_length;
        this.tooltip_max_width = params.tooltip_max_width;
        this.unread_count = 0;
        runtimeInfo("Loading url: " + aURL);
        this.custom_title = params.custom_title;

        this.reader = new FeedReader(
            this,
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
            runtimeInfo("items-loaded Event Fired for reader");
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
        this.menu.removeAll();
        this.menuItemCount = 0;
        let msg = "Finding first " +
            this.max_items +
            " unread items out of: " +
            this.reader.items.length +
            " total items";

        runtimeInfo(msg);
        let menu_items = 0;
        this.unread_count = 0;

        for (let i = 0; i < this.reader.items.length && menu_items < this.max_items; i++) {
            if (this.reader.items[i].read && !this.show_read_items) {
                continue;
            }

            if (!this.reader.items[i].read) {
                this.unread_count++;
            }

            let item = new FeedMenuItem(this, this.reader.items[i], this.title_length);
            item.connect("item-read", () => {
                this.update();
            });
            this.menu.addMenuItem(item);

            menu_items++;
        }

        // Add the menu items and close the menu?
        this._add_submenu();

        runtimeInfo("Items Loaded: " + menu_items);
        runtimeInfo("Link: " + this.reader.url);

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
        runtimeInfo("Button Released Event: " + event.get_button());

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
        runtimeInfo("Feed id:" + this.feed_id);

        this.menu.open(true);
        this._applet.open_menu = this;
    },

    close_menu: function() {
        runtimeInfo("Feed id:" + this.feed_id);
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

    _init: function(parent, item, width) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            hover: false
        });
        this._item_menu_count = 0;
        this.parent = parent;
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

        this.tooltip = new InteligentTooltip(this.actor, "");
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
            runtimeError("Error Tweaking Tooltip: " + aErr);

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
        runtimeInfo("Button Released Event: " + event.get_button());

        if (event.get_button() == 1) {
            this.activate(event);
            return true;
        }

        // Is this feed expanded?
        if (event.get_button() == 3) {
            runtimeInfo("Show Submenu");
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
        // no need to remove, just close the menu.

        this.menu.close();
    },

    toggleContextMenu: function() {
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
            global.logError(aErr);
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
        switch (this._action) {
            case "mark_all_read":
                runtimeInfo("Marking all items read");
                try {
                    this._source_item.reader.mark_all_items_read();
                    this._source_item.update();
                    // All items have been marked so we know we are opening a new feed menu.
                    this._source_item._applet.toggle_feeds(null);
                } catch (aErr) {
                    global.logError(aErr);
                }
                break;
            case "mark_next_read":
                runtimeInfo("Marking next " + this._source_item.max_items + " items read");
                try {
                    this._source_item.reader.mark_next_items_read(this._source_item.max_items);
                    this._source_item.update();
                    this._source_item._applet.toggle_feeds(this._source_item, true);
                } catch (aErr) {
                    global.logError(aErr);
                }

                break;
            case "update_feed_url":
                try {
                    let redirected_url = this._source_item.reader.redirected_url;
                    let current_url = this._source_item.reader.url;

                    runtimeInfo("Updating feed to point to: " + redirected_url);

                    // Update the feed, no GUI is shown

                    this._source_item._applet.redirect_feed(current_url, redirected_url);

                    // Reload the regular title and remove the is_redirected flag
                    this._source_item._applet.toggle_feeds(this._source_item, true);
                } catch (aErr) {
                    global.logError(aErr);
                }
                break;
            case "mark_post_read":
                runtimeInfo("Marking item 'read'");
                this._source_item.mark_read();
                break;

                // TODO: Not implemented.
                // case "delete_all_items":
                //     runtimeInfo("Marking all items 'deleted'");
                //     break;

                // TODO: Not implemented.
                // case "delete_post":
                //     runtimeInfo("Deleting item");
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
    _init: function(parent, id, url, notify, callbacks) {
        this.parent = parent;
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
            global.logError(aErr);
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
        if (this._shouldUpdate() || this.parent._applet.force_download) {
            runtimeInfo("Processing newly downloaded feed.");
            Util.spawn_async([XletMeta.path + "/python/get_feed.py", this.url],
                (response, aLocal) => this.process_feed(response, aLocal));
        } else {
            runtimeInfo("Processing locally stored feed.");
            this.process_feed_locally();
        }
    },

    process_feed_locally: function() {
        this.entries_file.load_contents_async(null, (aFile, aResponce) => {
            let success,
                contents = "",
                tag;

            try {
                [success, contents, tag] = aFile.load_contents_finish(aResponce);
            } catch (aErr) {
                global.logError(aErr);
            }

            try {
                /* NOTE: The original authors were right on the money!
                 * Do not even think about removing the escape/unescape processes.
                 * That thing bit me right in the arse!!!
                 */
                this.process_feed(escapeUnescapeReplacer.unescape(contents), true);
            } catch (aErr) {
                /* Invalid file contents */
                runtimeError("Failed to read feed data file for " + this.url + ":" + aErr);
            }
        });
    },

    process_feed: function(response, aLocal) {
        runtimeInfo(response);

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
            /* NOTE: The original authors were right on the money!
             * Do not even think about removing the escape/unescape processes.
             * That thing bit me right in the arse!!!
             */
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
            runtimeInfo("Processing feed: " + info.title);

            // Check if feed has a permanent redirect
            if (!aLocal && info.redirected_url != undefined) {
                this.is_redirected = true;
                this.redirected_url = info.redirected_url;
                runtimeInfo("Feed has been redirected to: " + info.redirected_url + "(Please update feed)");
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
            global.logError(aErr);
        }

        /* Were there any new items? */
        if (unread_items.length > 0) {
            runtimeInfo("Fetched " + unread_items.length + " new items from " + this.url);
            try {
                this.items = new_items;
                // Update the saved items so we can keep track of new and unread items.
                this.save_items();
                this.callbacks.onUpdate();

                if (!this.notify) {
                    runtimeInfo("Item level notifications disabled");
                } else {
                    if (this.parent._applet.pref_unified_notifications || unread_items.length > 1) {
                        this.callbacks.onNewItem(this, this.title, _("%d unread items!".format(unread_items.length)));
                    } else if (!this.parent._applet.pref_unified_notifications && unread_items.length == 1) {
                        this.callbacks.onNewItem(this, this.title, unread_items[0].title);
                    }
                }
            } catch (aErr) {
                global.logError(aErr);
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

        runtimeInfo("Processing Items took: " + time + " ms");
    },

    mark_all_items_read: function() {
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
        runtimeInfo("Number of items marked as read:" + number);

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
        // TODO: Switch to be an event
        this.callbacks.onItemRead(this);
        this.save_items();
    },

    on_item_deleted: function() {
        this.save_items();
    },

    save_items: function() {
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
            runtimeInfo("Saving feed data to: " + filename);

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

            /* NOTE: The original authors were right on the money!
             * Do not even think about removing the escape/unescape processes.
             * That thing bit me right in the arse!!!
             */
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
        let file = Gio.file_new_for_path(DataStorage + "/" + this.id);

        file.load_contents_async(null, (aFile, aResponce) => {
            let success,
                contents = "",
                tag;

            try {
                [success, contents, tag] = aFile.load_contents_finish(aResponce);
            } catch (aErr) {
                global.logError(aErr);
            }

            if (!contents) {
                this.item_status = [];
                runtimeInfo("Number Loaded: 0");
                this.title = _("Loading feed");
                this.emit("items-loaded");
                return;
            }

            try {
                /* NOTE: The original authors were right on the money!
                 * Do not even think about removing the escape/unescape processes.
                 * That thing bit me right in the arse!!!
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

                    runtimeInfo("Number Loaded: " + this.item_status.length);
                    this.emit("items-loaded");
                } else {
                    global.logError("Invalid data file for " + this.url);
                }
            } catch (aErr) {
                runtimeError("Failed to read feed data file for " + this.url + ":" + aErr);
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
        runtimeInfo("FeedReader (" + this.url + "): " + msg);
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

DebugManager.wrapObjectMethods(Debugger, {
    FeedDataItem: FeedDataItem,
    FeedMenuItem: FeedMenuItem,
    FeedReader: FeedReader,
    FeedSubMenuItem: FeedSubMenuItem,
    InteligentTooltip: InteligentTooltip
});
