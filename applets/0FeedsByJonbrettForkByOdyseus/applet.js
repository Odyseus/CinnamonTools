let GlobalUtils,
    Constants,
    $,
    DebugManager,
    DesktopNotificationsUtils,
    CustomDialogs,
    CustomTooltips;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
    Constants = require("./constants.js");
    $ = require("./utils.js");
    DebugManager = require("./debugManager.js");
    DesktopNotificationsUtils = require("./desktopNotificationsUtils.js");
    CustomDialogs = require("./customDialogs.js");
    CustomTooltips = require("./customTooltips.js");
} else {
    GlobalUtils = imports.ui.appletManager.applets["{{UUID}}"].globalUtils;
    Constants = imports.ui.appletManager.applets["{{UUID}}"].constants;
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
    DebugManager = imports.ui.appletManager.applets["{{UUID}}"].debugManager;
    DesktopNotificationsUtils = imports.ui.appletManager.applets["{{UUID}}"].desktopNotificationsUtils;
    CustomDialogs = imports.ui.appletManager.applets["{{UUID}}"].customDialogs;
    CustomTooltips = imports.ui.appletManager.applets["{{UUID}}"].customTooltips;
}

const {
    gi: {
        GLib,
        Gtk,
        St
    },
    mainloop: Mainloop,
    misc: {
        signalManager: SignalManager,
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
    escapeHTML,
    xdgOpen
} = GlobalUtils;

const {
    runtimeInfo
} = $;

const {
    CustomNotificationSource
} = DesktopNotificationsUtils;

const {
    IntelligentTooltip
} = CustomTooltips;

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
            this.sigMan = new SignalManager.SignalManager(null);
            this.main_loop_id = 0;
            this.missing_deps_id = 0;
            this.unified_notifications_id = 0;
            this.openedFeedMenu = null;
            this.requestMenuRebuild = false;
            this.forceDownload = false;
            this.missingDependencies = false;
            this.unifiedNotification = null;
            this._feedsQueue = [];
            this._unifiedNotificationData = [];
            this._unifiedNotificationParams = {
                titleMarkup: true,
                bannerMarkup: true,
                bodyMarkup: true
            };

            runtimeInfo("Applet Instance ID: " + this.instance_id);

            this.feed_items = [];

            this._setAppletIcon(false);
            this.set_applet_tooltip(_("Feeds reader"));

            runtimeInfo("Creating menus");
            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menu = new Applet.AppletPopupMenu(this, this.orientation);
            this.menuManager.addMenu(this.menu);

            this._updateKeybindings();

            this.fullReload();

            this.sigMan.connect(this.menu, "open-state-changed", function(aMenu, aOpen) {
                this._onOpenStateChanged(aMenu, aOpen);
            }.bind(this));
            this.sigMan.connect(this, "orientation-changed", function() {
                this._seekAndDetroyConfigureContext();
            }.bind(this));
        });
    },

    _initializeSettings: function(aDirectCallback, aIdleCallback) {
        this.settings = new Settings.AppletSettings(
            this,
            this.metadata.uuid,
            this.instance_id
        );

        this._bindSettings();
        aDirectCallback();

        Mainloop.idle_add(() => {
            aIdleCallback();

            return GLib.SOURCE_REMOVE;
        });
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
            "pref_show_icons_in_menu",
            "pref_last_checked_storage",
            "pref_description_max_length",
            "pref_tooltip_max_width",
            "pref_refresh_interval_mins",
            "pref_max_items",
            "pref_min_article_item_width",
            "pref_notifications_enabled",
            "pref_unified_notifications",
            "pref_overlay_key",
            "pref_new_feed_icon",
            "pref_feed_icon",
            "pref_logging_level",
            "pref_debugger_enabled",
            "pref_third_party_integration_panel_drawer",
            "pref_feeds",
            "pref_feeds_changed",
            "pref_imp_exp_last_selected_directory"
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
        let setIcon = (aIcon, aIsPath) => {
            if (aIcon.search("-symbolic") !== -1) {
                this[aIsPath ?
                    "set_applet_icon_symbolic_path" :
                    "set_applet_icon_symbolic_name"](aIcon);
            } else {
                this[aIsPath ?
                    "set_applet_icon_path" :
                    "set_applet_icon_name"](aIcon);
            }
        };

        try {
            if (GLib.path_is_absolute(icon) &&
                GLib.file_test(icon, GLib.FileTest.EXISTS)) {
                setIcon(icon, true);
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
        if (this.missing_deps_id > 0) {
            Mainloop.source_remove(this.missing_deps_id);
            this.missing_deps_id = 0;
        }

        // NOTE: I'm forced to use a delay because until the first response returning a
        // feedparser_error can set this.missingDependencies to true, a lot of calls to the
        // get_feed.py script could be made, causing to display several notifications.
        // So, with this delay, it doesn't matter how many times in a row
        // this._informMissingDependency is called, only the last call will be actually executed.
        this.missing_deps_id = Mainloop.timeout_add(1000, () => {
            this.set_applet_icon_symbolic_name("dialog-error");
            let msg = [_("Missing dependency!!!"),
                _("This applet needs the feedparser Python 3 module installed on your system for it to work."),
                _("Read this applet help for more details (Applet context menu > Help item)."),
                _("Restart Cinnamon after satisfying all dependencies.")
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
        });
    },

    _notifyImport: function(aMsg, aContext) {
        let icon = new St.Icon({
            icon_name: "dialog-" + aContext,
            icon_type: St.IconType.SYMBOLIC,
            icon_size: 24
        });

        Main.criticalNotify(_(this.metadata.name), aMsg.join("\n"), icon);
    },

    enqueueFeed: function(aItem) {
        runtimeInfo("Checking to add id " + aItem.params.id + " to the process queue.");
        // Only add items once to the queue.

        let found = this._feedsQueue.find(aFeed => (aFeed.params.id === aItem.params.id));

        if (!found) {
            // push the item on the queue
            this._feedsQueue.push(aItem);
            runtimeInfo("Added feed to the process queue.");
        }
    },

    processNextFeed: function() {
        if (this.missingDependencies) {
            return;
        }

        // Need to limit this to a single execution
        runtimeInfo("Processing the process queue, length: " + this._feedsQueue.length);
        if (this._feedsQueue.length > 0) {
            let item = this._feedsQueue.shift();
            // start the download of the feed
            item.reader.downloadFeed();
        } else {
            this.forceDownload = false;
        }
    },

    _expandAppletContextMenu: function() {
        let menuItem = new Applet.MenuItem(
            _("Mark all feeds as read"),
            "object-select-symbolic",
            () => {
                let dialog = new CustomDialogs.ConfirmDialog({
                    dialogName: "FeedsReaderDialog",
                    headline: _(this.metadata.name),
                    description: _("Are you sure that you want to mark as read all articles from all feeds?"),
                    cancelLabel: _("Cancel"),
                    okLabel: _("OK"),
                    callback: () => {
                        let i = this.feed_items.length;
                        while (i--) {
                            this.feed_items[i].reader.markAllArticlesRead();
                            this.feed_items[i].update();
                        }
                    }
                });
                dialog.open();
            }
        );
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _("Mark all articles from all feeds as read.")
        );
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new Applet.MenuItem(
            _("Reload"),
            "view-refresh-symbolic",
            () => {
                runtimeInfo("Calling reload from context menu.");
                this.forceDownload = true;
                this.fullReload();
            }
        );
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _("Update feeds from their on-line sources.")
        );
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new Applet.MenuItem(
            _("Manage feeds"),
            "document-properties-symbolic",
            () => {
                this.openXletSettings("stack_id_2");
            }
        );
        this._applet_context_menu.addMenuItem(menuItem);

        this._applet_context_menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Extras submenu
        let subMenu = new PopupMenu.PopupSubMenuMenuItem(_("Extras"));
        this._applet_context_menu.addMenuItem(subMenu);

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Import feeds in old format"),
            "feeds-reader-import-data",
            St.IconType.SYMBOLIC
        );
        menuItem.connect("activate", () => {
            Util.spawn_async(
                [this.metadata.path + "/python_modules/feeds_importer.py", "--csv"],
                (aResponse) => {
                    this._precessImport(aResponse);
                }
            );
        });
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _("Import feeds from an old version of this applet.")
        );
        subMenu.menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Import feeds from OPML file"),
            "feeds-reader-import-data",
            St.IconType.SYMBOLIC
        );
        menuItem.connect("activate", () => {
            Util.spawn_async(
                [this.metadata.path + "/python_modules/feeds_importer.py", "--opml"],
                (aResponse) => {
                    this._precessImport(aResponse);
                }
            );
        });
        subMenu.menu.addMenuItem(menuItem);

        subMenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        menuItem = new Applet.MenuItem(
            _("Help"),
            "dialog-information",
            () => {
                xdgOpen(this.metadata.path + "/HELP.html");
            }
        );
        subMenu.menu.addMenuItem(menuItem);

        this._seekAndDetroyConfigureContext();
    },

    _seekAndDetroyConfigureContext: function() {
        let menuItem = new PopupMenu.PopupIconMenuItem(_("Configure..."),
            "system-run", St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => {
            this.openXletSettings();
        });

        Mainloop.timeout_add_seconds(5, () => {
            try {
                let children = this._applet_context_menu._getMenuItems();
                let i = children.length;
                while (i--) {
                    if (this.hasOwnProperty("context_menu_item_configure") &&
                        children[i] === this.context_menu_item_configure) {
                        children[i].destroy();
                        this.context_menu_item_configure = menuItem;
                        this._applet_context_menu.addMenuItem(
                            this.context_menu_item_configure,
                            i
                        );
                        break;
                    }
                }
            } catch (aErr) {
                global.logError(aErr);
            }

            return GLib.SOURCE_REMOVE;
        });
    },

    loadFeedsMap: function() {
        try {
            this.feedsMap = JSON.parse(JSON.stringify(this.pref_feeds))
                .map((aObj) => {
                    // NOTE: Add zzzz to ID of feeds with no category. This allows to keep feeds with
                    // a category on top when sorting.
                    aObj["id"] = (
                        this.instance_id + "_" + (aObj.category ? aObj.category : "zzzz") + "_" + aObj.url
                    ).replace(/\W/g, "_");
                    return aObj;
                }).sort((a, b) => {
                    return a.id.localeCompare(b.id);
                });
        } catch (aErr) {
            global.logError(aErr);
            this.feedsMap = null;
        }
    },

    updateFeedsMapItem: function(aFeedID, aKey, aValue) {
        try {
            for (let i = this.feedsMap.length - 1; i >= 0; i--) {
                if (this.feedsMap[i].id === aFeedID) {
                    this.feedsMap[i][aKey] = aValue;
                }
            }
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    dumpFeedsMap: function() {
        try {
            let feedsMap = this.feedsMap.map((aObj) => {
                delete aObj["id"];
                return aObj;
            });

            this.pref_feeds = feedsMap;
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    updateAppletState: function() {
        let unreadCount = 0;
        let tooltip = "";
        let first = true;

        // Application tooltip will only list unread feeds.
        let i = this.feed_items.length;
        while (i--) {
            let count = this.feed_items[i].getUnreadCount();

            if (count > 0) {
                unreadCount += count;
                // ensure the last feed added does not get a newline character.
                if (!first) {
                    tooltip += "\n";
                }
                tooltip += this.feed_items[i].getTitle();
                first = false;
            }
        }

        if (unreadCount > 0) {
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

    _loadFeeds: function() {
        this._unifiedNotificationData = [];

        let f = this.feed_items.length;
        while (f--) {
            this.feed_items[f] && this.feed_items[f].destroy();
        }

        this.feed_items = [];
        this.menu.removeAll();

        let i = 0,
            itemCoun = 0,
            iLen = this.feedsMap.length;
        for (; i < iLen; i++) {
            if (this.feedsMap[i].enabled) {
                this.feed_items[itemCoun] = new $.FeedSubMenuItem(this, this.feedsMap[i]);
                this.menu.addMenuItem(this.feed_items[itemCoun]);
                itemCoun += 1;
            }
        }
    },

    _processFeeds: function() {
        runtimeInfo("Removing previous timer: " + this.main_loop_id);

        // Remove any previous timeout.
        if (this.main_loop_id > 0) {
            Mainloop.source_remove(this.main_loop_id);
            this.main_loop_id = 0;
        }

        runtimeInfo("Number of feeds to queue: " + this.feed_items.length);

        let i = this.feed_items.length;
        while (i--) {
            this.enqueueFeed(this.feed_items[i]);
        }

        // Process the queue items.
        this.processNextFeed();

        // Set the next timeout.
        this.main_loop_id = Mainloop.timeout_add_seconds(this.pref_refresh_interval_mins,
            () => this._processFeeds());

        runtimeInfo("main_loop_id: " + this.main_loop_id);
    },

    fullReload: function() {
        this.loadFeedsMap();

        Mainloop.idle_add(() => {
            this._loadFeeds();
            this._processFeeds();

            return GLib.SOURCE_REMOVE;
        });
    },

    notifyNewArticles: function(aFeedReader, aTitle, aText) {
        if (!this.pref_notifications_enabled) {
            runtimeInfo("Notifications Disabled");
            return;
        }

        this._notifyMessage(aFeedReader, aTitle, aText);
    },

    notifyArticlesRead: function(aFeedReader) {
        if (this.pref_notifications_enabled) {
            this._destroyMessage(aFeedReader);
        }
    },

    toggleFeedMenu: function(aFeedToShow, aAutoNext = false) {
        runtimeInfo("auto_next = " + aAutoNext);

        // Check if a menu is already open
        if (this.openedFeedMenu) {
            // if matches requested feed and is not empty then exit, otherwise close the feed
            if (aFeedToShow &&
                this.openedFeedMenu.params.id === aFeedToShow.params.id &&
                this.openedFeedMenu.unread_count > 0) {
                return;
            }

            // Close the last menu since we will be opening a new menu.
            this.openedFeedMenu.closeFeedMenu();
            this.openedFeedMenu = null;
        }

        if (aAutoNext && aFeedToShow && aFeedToShow.unread_count === 0) {
            aFeedToShow = null;
        }

        // NOTE: this.openedFeedMenu is stored on FeedSubMenuItem.openFeedMenu() side.
        if (aFeedToShow) {
            // We know the feed to show, just open it.
            aFeedToShow.openFeedMenu();
        } else {
            let i = 0,
                iLen = this.feed_items.length;
            for (; i < iLen; i++) {
                if (this.feed_items[i].unread_count > 0) {
                    runtimeInfo("Opening Menu: " + this.feed_items[i]);
                    this.feed_items[i].openFeedMenu();
                    return;
                }
            }
            // If we get here then no feeds are available, if this was the result of opening or marking the
            // last feed read then close the menu.
            if (aAutoNext) { // Close the menu since this is the last feed
                this.menu.close(false);
            }
        }
    },

    redirectFeed: function(aSubMenu, aCurrentURL, aRedirectedURL) {
        let i = this.pref_feeds.length;
        while (i--) {
            if (this.pref_feeds[i].hasOwnProperty("url") && this.pref_feeds[i].url === aCurrentURL) {
                this.pref_feeds[i].url = aRedirectedURL;
                aSubMenu.reader.is_redirected = false;
                this.toggleFeedMenu(aSubMenu, true);
                aSubMenu._title.set_text(aSubMenu.getTitle());
                break;
            }
        }

        this.pref_feeds.save();

        this.loadFeedsMap();
    },

    _ensureNotificationSource: function() {
        if (!this._notificationSource) {
            this._notificationSource = new CustomNotificationSource(
                escapeHTML(_(this.metadata.name)) + this.instance_id
            );
            this._notificationSource.connect("destroy", () => {
                this._notificationSource = null;
            });

            if (Main.messageTray) {
                Main.messageTray.add(this._notificationSource);
            }
        }
    },

    _precessImport: function(aResponse) {
        try {
            let newFeeds = JSON.parse(aResponse);
            let pref = this.pref_feeds;
            this.pref_feeds = pref.concat(newFeeds);

            this._notifyImport([
                _("Feeds successfully imported."),
                _("All imported feeds are disabled.")
            ], "info");
        } catch (aErr) {
            this._notifyImport([
                _("Error importing feeds file!"),
                _("Look at the logs for details.") +
                "\n~/.cinnamon/glass.log - ~/.xsession-errors"
            ], "error");
            global.logError("Error importing feeds file!");
            global.logError("Response:");
            global.logError(aResponse);
            global.logError(aErr);
        }
    },

    _notifyMessage: function(aFeedReader, aTitle, aText) {
        if (aFeedReader.hasOwnProperty("_notification")) {
            aFeedReader._notification.destroy();
        }

        this._ensureNotificationSource();

        if (this.pref_unified_notifications) {
            this._updateUnifiedNotificationData(aFeedReader, aTitle, aText);

            if (this.unified_notifications_id > 0) {
                Mainloop.source_remove(this.unified_notifications_id);
                this.unified_notifications_id = 0;
            }

            this.unified_notifications_id = Mainloop.timeout_add(5000,
                () => this._updateUnifiedNotification(aFeedReader.locallyLoaded));
        } else {
            aFeedReader._notification = new MessageTray.Notification(
                this._notificationSource,
                aTitle,
                aText,
                this._unifiedNotificationParams
            );
            aFeedReader._notification.setTransient(false);
            aFeedReader._notification.connect("destroy", function() {
                this._notification = null;
                delete this._notification;
            }.bind(aFeedReader));

            this._notificationSource.notify(aFeedReader._notification);
        }
    },

    _updateUnifiedNotification: function(aLocallyLoaded) {
        let body = "";

        let i = this._unifiedNotificationData.length;
        while (i--) {
            let data = this._unifiedNotificationData[i];

            if (data.title && data.text && data.unread > 0) {
                body += "<b>%s</b>".format(escapeHTML(data.title)) + "\n";
                body += data.text + "\n";
            }
        }

        body = body.trim();

        if (this._notificationSource && !this.unifiedNotification) {
            this.unifiedNotification = new MessageTray.Notification(
                this._notificationSource,
                escapeHTML(_(this.metadata.name)) + this.instance_id,
                body,
                this._unifiedNotificationParams
            );
            this.unifiedNotification.setTransient(false);
            this.unifiedNotification.connect("destroy", () => {
                this.unifiedNotification = null;
            });

            this._notificationSource.notify(this.unifiedNotification);
        }

        if (body && this.unifiedNotification) {
            this.unifiedNotification.update(
                _(this.metadata.name),
                body,
                this._unifiedNotificationParams
            );

            aLocallyLoaded || this._notificationSource.notify(this.unifiedNotification);
        } else {
            this.unifiedNotification && this.unifiedNotification.destroy();
        }

        this.unified_notifications_id = 0;
    },

    _updateUnifiedNotificationData: function(aFeedReader, aTitle, aText) {
        this._removeFeedFromUnifiedNotificationData(aFeedReader);
        this._unifiedNotificationData.push({
            id: aFeedReader.subMenu.params.id,
            title: aTitle || "",
            text: aText || "",
            unread: parseInt(aFeedReader.getUnreadCount(), 10)
        });
    },

    _removeFeedFromUnifiedNotificationData: function(aFeedReader) {
        let i = this._unifiedNotificationData.length;
        while (i--) {
            if (this._unifiedNotificationData[i].id === aFeedReader.subMenu.params.id) {
                this._unifiedNotificationData.splice(i, 1);
                break;
            }
        }
    },

    _destroyMessage: function(aFeedReader) {
        this._removeFeedFromUnifiedNotificationData(aFeedReader);
        aFeedReader.hasOwnProperty("_notification") && aFeedReader._notification.destroy();
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

    _onOpenStateChanged: function(aMenu, aOpen) {
        if (!aOpen && this.requestMenuRebuild) {
            this.requestMenuRebuild = false;
            this.dumpFeedsMap();
            this.fullReload();
        }
    },

    on_applet_removed_from_panel: function() {
        // Clean up the timer so if the feed applet is removed it stops firing requests.
        if (this.main_loop_id > 0) {
            runtimeInfo("Removing Timer with ID: " + this.main_loop_id);
            Mainloop.source_remove(this.main_loop_id);
            this.main_loop_id = 0;
        }

        if (this.missing_deps_id > 0) {
            Mainloop.source_remove(this.missing_deps_id);
            this.missing_deps_id = 0;
        }

        if (this.unified_notifications_id > 0) {
            Mainloop.source_remove(this.unified_notifications_id);
            this.unified_notifications_id = 0;
        }

        // Remove all notifications since they no longer apply.
        let i = this.feed_items.length;
        while (i--) {
            this._destroyMessage(this.feed_items[i].reader);
        }

        if (this.settings) {
            this.settings.finalize();
        }

        Main.keybindingManager.removeHotKey(this.menu_keybinding_name);
        this.sigMan.disconnectAllSignals();
    },

    on_applet_clicked: function(event) { // jshint ignore:line
        this.menu.toggle();
        this.toggleFeedMenu(null);
    },

    openXletSettings: function(aStackID) {
        let cmd = [
            this.metadata.path + "/settings.py",
            "--xlet-type=applet",
            "--xlet-instance-id=" + this.instance_id,
            "--xlet-uuid=" + this.metadata.uuid,
            "--app-id=org.Cinnamon.Applets.FeedsByJonbrettForkByOdyseus.Settings"
        ];

        if (aStackID) {
            cmd = cmd.concat(["--stack-id=" + aStackID]);
        }

        Util.spawn_async(cmd, null);
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
            case "pref_show_icons_in_menu":
            case "pref_refresh_interval_mins":
            case "pref_description_max_length":
            case "pref_tooltip_max_width":
            case "pref_notifications_enabled":
            case "pref_max_items":
            case "pref_min_article_item_width":
                let i = this.feed_items.length;
                while (i--) {
                    this.feed_items[i].update();
                }

                this._processFeeds();
                break;
            case "pref_feeds_changed":
                this.fullReload();
                break;
            case "pref_overlay_key":
                this._updateKeybindings();
                break;
            case "pref_feed_icon":
            case "pref_new_feed_icon":
                this.updateAppletState();
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
