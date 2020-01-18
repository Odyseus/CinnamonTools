let GlobalUtils,
    Constants,
    $,
    DebugManager,
    DesktopNotificationsUtils;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
    Constants = require("./constants.js");
    $ = require("./utils.js");
    DebugManager = require("./debugManager.js");
    DesktopNotificationsUtils = require("./desktopNotificationsUtils.js");
} else {
    GlobalUtils = imports.ui.appletManager.applets["{{UUID}}"].globalUtils;
    Constants = imports.ui.appletManager.applets["{{UUID}}"].constants;
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
    DebugManager = imports.ui.appletManager.applets["{{UUID}}"].debugManager;
    DesktopNotificationsUtils = imports.ui.appletManager.applets["{{UUID}}"].desktopNotificationsUtils;
}

const {
    gi: {
        GLib,
        Gtk,
        St
    },
    mainloop: Mainloop,
    misc: {
        util: Util
    },
    ui: {
        applet: Applet,
        main: Main,
        messageTray: MessageTray,
        popupMenu: PopupMenu,
        settings: Settings
    }
} = imports;

const {
    _,
    escapeHTML
} = GlobalUtils;

const {
    FEED_CONFIG_FILE
} = Constants;

const {
    runtimeInfo
} = $;

const {
    CustomNotificationSource
} = DesktopNotificationsUtils;

function FeedsReaderForkByOdyseus() {
    this._init.apply(this, arguments);
}

FeedsReaderForkByOdyseus.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(aMetadata, aOrientation, aPanelHeight, aInstanceId) {
        Applet.IconApplet.prototype._init.call(this, aOrientation, aPanelHeight, aInstanceId);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.metadata = aMetadata;
        this.instance_id = aInstanceId;
        this.orientation = aOrientation;
        this.menu_keybinding_name = this.metadata.uuid + "-" + this.instance_id;

        this._initializeSettings(() => {
            this._expandAppletContextMenu();
        }, () => {
            this.open_menu = null;
            this.feed_queue = [];
            this.force_download = false;
            this.unifiedNotification = null;
            this._unifiedNotificationData = {};
            this._unifiedNotificationParams = {
                titleMarkup: true,
                bannerMarkup: true,
                bodyMarkup: true
            };

            runtimeInfo("Applet Instance ID: " + this.instance_id);
            runtimeInfo("Selected Instance Name: " + this.pref_profile_name);

            this.feeds = [];

            this._setAppletIcon(false);
            this.set_applet_tooltip(_("Feed reader"));

            runtimeInfo("Creating menus");
            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menu = new Applet.AppletPopupMenu(this, this.orientation);
            this.menuManager.addMenu(this.menu);

            this.feed_file_error = false;
            this._read_json_config();
            this._updateKeybindings();

            this.timeout = this.pref_refresh_interval_mins * 60 * 1000;
            runtimeInfo("Initial timeout set in: " + this.timeout + " ms");
            this.timer_id = Mainloop.timeout_add(this.timeout,
                () => this._process_feeds());

            runtimeInfo("timer_id: " + this.timer_id);
        });
    },

    _initializeSettings: function(aDirectCallback, aIdleCallback) {
        this.settings = new Settings.AppletSettings(
            this,
            this.metadata.uuid,
            this.instance_id
        );

        let callback = () => {
            try {
                this._bindSettings();
                aDirectCallback();
            } catch (aErr) {
                global.logError(aErr);
            }

            Mainloop.idle_add(() => {
                try {
                    aIdleCallback();
                } catch (aErr) {
                    global.logError(aErr);
                }

                return GLib.SOURCE_REMOVE;
            });
        };

        // Needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 4.2.x+
        // Always use promise. Declare content of callback variable
        // directly inside the promise callback.
        switch (this.settings.hasOwnProperty("promise")) {
            case true:
                this.settings.promise.then(() => callback());
                break;
            case false:
                callback();
                break;
        }
    },

    _bindSettings: function() {
        // Needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        let bD = {
            IN: 1,
            OUT: 2,
            BIDIRECTIONAL: 3
        };
        let prefKeysArray = [
            "pref_last_checked_storage",
            "pref_description_max_length",
            "pref_tooltip_max_width",
            "pref_refresh_interval_mins",
            "pref_max_items",
            "pref_notifications_enabled",
            "pref_unified_notifications",
            "pref_profile_name",
            "pref_overlay_key",
            "pref_new_feed_icon",
            "pref_feed_icon",
            "pref_logging_level",
            "pref_debugger_enabled",
            "pref_third_party_integration_panel_drawer"
        ];
        let newBinding = typeof this.settings.bind === "function";
        for (let pref_key of prefKeysArray) {
            // Condition needed for retro-compatibility.
            // Mark for deletion on EOL. Cinnamon 3.2.x+
            // Abandon this.settings.bindProperty and keep this.settings.bind.
            if (newBinding) {
                this.settings.bind(pref_key, pref_key, this._onSettingsChanged, pref_key);
            } else {
                this.settings.bindProperty(bD.BIDIRECTIONAL, pref_key, pref_key, this._onSettingsChanged, pref_key);
            }
        }
    },

    _setAppletIcon: function(aNewFeed) {
        let icon = (aNewFeed ? this.pref_new_feed_icon : this.pref_feed_icon) ||
            "feeds-reader-rss-feed-symbolic";
        let setIcon = (aIcon) => {
            if (aIcon.search("-symbolic") !== -1) {
                this.set_applet_icon_symbolic_name(aIcon);
            } else {
                this.set_applet_icon_name(aIcon);
            }
        };

        try {
            if (GLib.path_is_absolute(icon) &&
                GLib.file_test(icon, GLib.FileTest.EXISTS)) {
                setIcon(icon);
            } else if (Gtk.IconTheme.get_default().has_icon(icon)) {
                setIcon(icon);
                /* NOTE:
                 * I added the last condition without checking Gtk.IconTheme.get_default.
                 * Otherwise, if there is a valid icon name added by
                 *  Gtk.IconTheme.get_default().append_search_path, it will not be recognized.
                 * With the following extra condition, the worst that can happen is that
                 * the applet icon will not change/be set.
                 */
            } else {
                try {
                    setIcon(icon);
                } catch (aErr) {
                    global.logError(aErr);
                }
            }
        } catch (aErr) {
            global.logWarning('Could not load icon file "' + icon + '" for menu button');
        }
    },

    _informMissingDependency: function() {
        this.set_applet_icon_symbolic_name("dialog-error");
        let msg = [_("Missing dependency!!!"),
            _("This applet needs the feedparser Python 3 module installed on your system for it to work."),
            _("Read this applet help for more details (Applet context menu > Help item).")
        ];

        let tt = _(this.metadata.name) + "\n\n" + msg.join("\n");

        if (this._applet_tooltip) {
            try {
                this._applet_tooltip._tooltip.get_clutter_text().set_markup(
                    '<span color="red"><b>' + escapeHTML(tt) + "</b></span>");
            } catch (aErr) {
                this.set_applet_tooltip(tt);
                global.logError(aErr);
            }
        } else {
            this.set_applet_tooltip(tt);
        }

        let icon = new St.Icon({
            icon_name: "dialog-error",
            icon_type: St.IconType.SYMBOLIC,
            icon_size: 24
        });

        Main.criticalNotify(_(this.metadata.name), msg.join("\n"), icon);
    },

    /* Public method for adding a feed to be processed (downloaded) */
    enqueue_feed: function(item) {
        runtimeInfo("Checking to add feed_id " + item.feed_id + " to the process queue.");
        // Only add items once to the queue.

        let found = this.feed_queue.find(feed => (feed.feed_id == item.feed_id));

        if (!found) {
            // push the item on the queue
            this.feed_queue.push(item);
            runtimeInfo("Added feed to the process queue.");
        }
    },

    /* Public method to dequeue the next feed and process it (downloading and parsing). */
    process_next_feed: function() {
        // Need to limit this to a single execution
        runtimeInfo("Processing the process queue, length: " + this.feed_queue.length);
        if (this.feed_queue.length > 0) {
            let item = this.feed_queue.shift();
            this.is_feed_downloading = true;
            // start the download of the feed
            item.reader.download_feed();
        } else {
            this.force_download = false;
        }
    },

    /* Private method to create the sub menu items for a feed. */
    _expandAppletContextMenu: function() {
        let menuItem = new Applet.MenuItem(
            _("Mark all read"),
            "object-select-symbolic",
            () => {
                let i = this.feeds.length;
                while (i--) {
                    this.feeds[i].reader.mark_all_items_read();
                    this.feeds[i].update();
                }
            }
        );
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new Applet.MenuItem(
            _("Reload"),
            "view-refresh-symbolic",
            () => {
                runtimeInfo("Calling reload from context menu.");
                this.force_download = true;
                this._process_feeds();
            }
        );
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new Applet.MenuItem(
            _("Manage feeds"),
            "document-properties-symbolic",
            () => {
                this.manage_feeds();
            }
        );
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new Applet.MenuItem(
            _("Help"),
            "dialog-information",
            () => {
                Util.spawn_async(["xdg-open", this.metadata.path + "/HELP.html"], null);
            }
        );
        this._applet_context_menu.addMenuItem(menuItem);
    },

    _read_json_config: function(profile_name = null) {
        if (profile_name != null && profile_name.trim() != "") {
            this.pref_profile_name = profile_name.trim();
        }
        // Read the json config file.
        let argv = [this.metadata.path + "/python/config_file_manager.py", FEED_CONFIG_FILE];
        Util.spawn_async(argv,
            (aFeedsConfigFileData) => this._load_feeds(aFeedsConfigFileData));
    },

    /* Private method used to load / reload all the feeds. */
    _load_feeds: function(aFeedsConfigFileData) {
        this.feeds = [];
        this.menu.removeAll();
        let data = JSON.parse(aFeedsConfigFileData);

        // Find the feeds for the selected profile_name and populate those feeds.
        let i = 0,
            iLen = data["profiles"].length;
        for (; i < iLen; i++) {
            let profiles = data["profiles"];

            if (profiles[i]["name"].trim() === this.pref_profile_name) {
                let f = 0,
                    fLen = profiles[i]["feeds"].length;
                for (; f < fLen; f++) {
                    let feed = profiles[i]["feeds"][f];

                    try {
                        if (feed["enabled"]) {
                            this.feeds[f] = new $.FeedSubMenuItem(
                                feed["url"],
                                this, {
                                    feed_id: feed["id"],
                                    max_items: this.pref_max_items,
                                    description_max_length: this.pref_description_max_length,
                                    tooltip_max_width: this.pref_tooltip_max_width,
                                    show_read_items: feed["showreaditems"],
                                    show_feed_image: feed["showimage"], // TODO: Not implemented.
                                    custom_title: feed["title"],
                                    notify: feed["notify"],
                                    interval: feed["interval"] // TODO: Not implemented.
                                });
                            this.menu.addMenuItem(this.feeds[f]);
                        }
                    } catch (aErr) {
                        global.logError("Error Parsing feeds.json file: " + aErr);
                    }
                }
            }
        }
    },

    /* public method to notify of changes to
     * feed info (e.g. unread count, title).  Updates the
     * applet icon and tooltip */
    update_title: function() {
        let unread_count = 0;
        let tooltip = "";
        let first = true;

        // Application tooltip will only list unread feeds.
        let i = this.feeds.length;
        while (i--) {
            let count = this.feeds[i].get_unread_count();

            if (count > 0) {
                unread_count += count;
                // ensure the last feed added does not get a newline character.
                if (!first) {
                    tooltip += "\n";
                }
                tooltip += this.feeds[i].get_title();
                first = false;
            }
        }

        if (unread_count > 0) {
            this._setAppletIcon(true);
            this._toggleAppletVisibility(true);
            this.set_applet_tooltip(tooltip);
        } else {
            this._setAppletIcon(false);
            this._toggleAppletVisibility(false);
            this.set_applet_tooltip(_("No unread feeds"));
        }
    },

    _toggleAppletVisibility: function(aShow) {
        if (this.pref_third_party_integration_panel_drawer &&
            this.actor.hasOwnProperty("__HandledByPanelDrawer")) {
            this.actor[aShow ? "show" : "hide"]();
        }
    },

    /* Private method to initiate the downloading and refreshing of all feeds. */
    _process_feeds: function() {
        runtimeInfo("Removing previous timer: " + this.timer_id);

        /* Remove any previous timeout */
        if (this.timer_id) {
            Mainloop.source_remove(this.timer_id);
            this.timer_id = 0;
        }
        runtimeInfo("Number of feeds to queue: " + this.feeds.length);
        let i = this.feeds.length;
        while (i--) {
            this.enqueue_feed(this.feeds[i]);
        }

        // Process the queue items.
        this.process_next_feed();

        /* Convert refresh interval from mins -> ms */
        this.timeout = this.pref_refresh_interval_mins * 60 * 1000;

        runtimeInfo("Setting next timeout to: " + this.timeout + " ms");
        /* Set the next timeout */
        this.timer_id = Mainloop.timeout_add(this.timeout,
            () => this._process_feeds());

        runtimeInfo("timer_id: " + this.timer_id);
    },

    on_applet_clicked: function(event) { // jshint ignore:line
        this.menu.toggle();
        this.toggle_feeds(null);
    },

    new_item_notification: function(feed, feedtitle, itemtitle) {
        if (!this.pref_notifications_enabled) {
            runtimeInfo("Notifications Disabled");
            return;
        }
        this._notifyMessage(feed, feedtitle, itemtitle);
    },

    item_read_notification: function(feed) {
        if (this.pref_notifications_enabled) {
            this._destroyMessage(feed);
        }
    },

    toggle_feeds: function(feed_to_show, auto_next = false) {
        runtimeInfo("auto_next = " + auto_next);

        // Check if a menu is already open
        if (this.open_menu) {
            // if matches requested feed and is not empty then exit, otherwise close the feed
            if (feed_to_show && this.open_menu.feed_id == feed_to_show.feed_id && this.open_menu.unread_count > 0) {
                return;
            }

            // Close the last menu since we will be opening a new menu.
            this.open_menu.close_menu();
            this.open_menu = null;
        }

        if (auto_next && feed_to_show && feed_to_show.unread_count == 0) {
            feed_to_show = null;
        }

        if (feed_to_show) {
            // We know the feed to show, just open it.
            this.feed_to_show = feed_to_show;
            this.feed_to_show.open_menu();
        } else {
            let i = 0,
                iLen = this.feeds.length;
            for (; i < iLen; i++) {
                if (this.feeds[i].unread_count > 0) {
                    runtimeInfo("Opening Menu: " + this.feeds[i]);
                    this.feeds[i].open_menu();
                    return;
                }
            }
            // If we get here then no feeds are available, if this was the result of opening or marking the
            // last feed read then close the menu.
            if (auto_next) { // Close the menu since this is the last feed
                this.menu.close(false);
            }
        }
    },

    manage_feeds: function() {
        let argv = [
            this.metadata.path + "/python/manage_feeds.py",
            FEED_CONFIG_FILE,
            this.pref_profile_name
        ];
        Util.spawn_async(argv,
            (aProfileName) => this._read_json_config(aProfileName));
    },

    redirect_feed: function(current_url, redirected_url) {
        let argv = [this.metadata.path + "/python/config_file_manager.py", FEED_CONFIG_FILE];
        argv.push("--profile", this.pref_profile_name);
        argv.push("--oldurl", current_url);
        argv.push("--newurl", redirected_url);
        Util.spawn_async(argv,
            (aProfileName) => this._read_json_config(aProfileName));
    },

    on_applet_removed_from_panel: function() {
        /* Clean up the timer so if the feed applet is removed it stops firing requests.  */
        if (this.timer_id) {
            runtimeInfo("Removing Timer with ID: " + this.timer_id);
            Mainloop.source_remove(this.timer_id);
            this.timer_id = 0;
        }

        // Remove all notifications since they no longer apply
        let i = this.feeds.length;
        while (i--) {
            this._destroyMessage(this.feeds[i].reader);
        }

        if (this.settings) {
            this.settings.finalize();
        }

        Main.keybindingManager.removeHotKey(this.menu_keybinding_name);
    },

    _ensureNotificationSource: function() {
        if (!this._notificationSource) {
            this._notificationSource = new CustomNotificationSource(
                escapeHTML(_(this.metadata.name))
            );
            this._notificationSource.connect("destroy", () => {
                this._notificationSource = null;
            });

            if (Main.messageTray) {
                Main.messageTray.add(this._notificationSource);
            }
        }
    },

    _notifyMessage: function(reader, title, text) {
        if (reader._notification) {
            reader._notification.destroy();
        }

        this._ensureNotificationSource();

        if (this.pref_unified_notifications) {
            this._updateUnifiedNotificationData(reader, title, text);
            this._updateUnifiedNotification(true);
        } else {
            reader._notification = new MessageTray.Notification(
                this._notificationSource,
                title,
                text,
                this._unifiedNotificationParams
            );
            reader._notification.setTransient(false);
            reader._notification.connect("destroy", () => {
                reader._notification = null;
            });

            this._notificationSource.notify(reader._notification);
        }
    },

    _updateUnifiedNotification: function(aNotify) {
        let body = "";

        for (let id in this._unifiedNotificationData) {
            let data = this._unifiedNotificationData[id];

            if (data.title && data.text && data.unread > 0) {
                body += "<b>%s</b>".format(escapeHTML(data.title)) + "\n";
                body += data.text + "\n";
            }
        }

        body = body.trim();

        if (this._notificationSource && !this.unifiedNotification) {
            this.unifiedNotification = new MessageTray.Notification(
                this._notificationSource,
                escapeHTML(_(this.metadata.name)),
                body,
                this._unifiedNotificationParams
            );
            this.unifiedNotification.setTransient(false);
            this.unifiedNotification.connect("destroy", () => {
                this.unifiedNotification = null;
            });

            this._notificationSource.notify(this.unifiedNotification);
        }

        if (body) {
            this.unifiedNotification.update(
                _(this.metadata.name),
                body,
                this._unifiedNotificationParams
            );

            aNotify && this._notificationSource.notify(this.unifiedNotification);
        } else {
            this.unifiedNotification && this.unifiedNotification.destroy();
        }
    },

    _updateUnifiedNotificationData: function(aReader, aTitle, aText) {
        this._unifiedNotificationData[aReader.id] = {
            title: aTitle || "",
            text: aText || "",
            unread: parseInt(aReader.get_unread_count(), 10)
        };
    },

    _destroyMessage: function(aReader) {
        this._updateUnifiedNotificationData(aReader);
        aReader._notification && aReader._notification.destroy();
        this.unifiedNotification && this._updateUnifiedNotification(false);
    },

    _updateKeybindings: function() {
        Main.keybindingManager.removeHotKey(this.menu_keybinding_name);

        if (this.pref_overlay_key !== "") {
            Main.keybindingManager.addHotKey(
                this.menu_keybinding_name,
                this.pref_overlay_key,
                () => {
                    if (!Main.overview.visible && !Main.expo.visible) {
                        this.on_applet_clicked();
                    }
                }
            );
        }
    },

    _onSettingsChanged: function(aPrefValue, aPrefKey) {
        /* NOTE: On Cinnamon versions greater than 3.2.x, two arguments are passed to the
         * settings callback instead of just one as in older versions. The first one is the
         * setting value and the second one is the user data. To workaround this nonsense,
         * check if the second argument is undefined to decide which
         * argument to use as the pref key depending on the Cinnamon version.
         */
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        // Remove the following variable and directly use the second argument.
        let pref_key = aPrefKey || aPrefValue;
        switch (pref_key) {
            case "pref_refresh_interval_mins":
            case "pref_description_max_length":
            case "pref_tooltip_max_width":
            case "pref_notifications_enabled":
            case "pref_max_items":
                let i = this.feeds.length;
                while (i--) {
                    this.feeds[i].on_settings_changed({
                        max_items: this.pref_max_items,
                        description_max_length: this.pref_description_max_length,
                        tooltip_max_width: this.pref_tooltip_max_width
                    });
                }

                this._process_feeds();
                break;
            case "pref_profile_name":
                this._read_json_config();
                break;
            case "pref_overlay_key":
                this._updateKeybindings();
                break;
            case "pref_feed_icon":
            case "pref_new_feed_icon":
                this.update_title();
                break;
            case "pref_logging_level":
            case "pref_debugger_enabled":
                $.Debugger.logging_level = this.pref_logging_level;
                $.Debugger.debugger_enabled = this.pref_debugger_enabled;
                break;
        }
    }
};

function main(aMetadata, aOrientation, aPanelHeight, aInstanceId) {
    DebugManager.wrapObjectMethods($.Debugger, {
        CustomNotificationSource: CustomNotificationSource,
        FeedsReaderForkByOdyseus: FeedsReaderForkByOdyseus
    });

    return new FeedsReaderForkByOdyseus(aMetadata, aOrientation, aPanelHeight, aInstanceId);
}
