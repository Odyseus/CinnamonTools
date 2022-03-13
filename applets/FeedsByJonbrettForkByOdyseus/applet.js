const {
    gi: {
        St
    },
    misc: {
        util: Util
    },
    ui: {
        applet: Applet,
        main: Main,
        messageTray: MessageTray,
        popupMenu: PopupMenu
    }
} = imports;

const {
    _,
    arrayEach,
    escapeHTML,
    tryFn
} = require("js_modules/globalUtils.js");

const {
    CustomNotificationSource
} = require("js_modules/notificationsUtils.js");

const {
    IntelligentTooltip
} = require("js_modules/customTooltips.js");

const {
    ConfirmDialog
} = require("js_modules/customDialogs.js");

const {
    Debugger,
    FeedSubMenuItem,
    runtimeInfo
} = require("js_modules/utils.js");

const {
    APPLET_PREFS
} = require("js_modules/constants.js");

const {
    getBaseAppletClass
} = require("js_modules/appletsUtils.js");

class FeedsReaderForkByOdyseus extends getBaseAppletClass(Applet.IconApplet) {
    constructor(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
        super({
            metadata: aMetadata,
            orientation: aOrientation,
            panel_height: aPanelHeight,
            instance_id: aInstanceID,
            pref_keys: APPLET_PREFS
        });

        this.__initializeApplet(() => {
            this._expandAppletContextMenu();
        }, () => {
            this.openedFeedMenu = null;
            this.requestMenuRebuild = false;
            this.forceDownload = false;
            this.missingDependencies = false;
            this.unifiedNotification = null;
            this._feedsQueue = [];
            this._unifiedNotificationData = [];
            this._unifiedNotificationParams = {
                titleMarkup: true,
                bodyMarkup: true
            };

            runtimeInfo(`Applet Instance ID: ${this.$.instance_id}`);

            this.feed_items = [];

            this.__setAppletIcon(false);
            this.set_applet_tooltip(_("Feeds reader"));

            this._updateKeybindings();

            this.fullReload();
        });
    }

    __connectSignals() {
        this.$.signal_manager.connect(this.menu, "open-state-changed", function(aMenu, aOpen) {
            this._onOpenStateChanged(aMenu, aOpen);
        }.bind(this));
        this.$.signal_manager.connect(this, "orientation-changed", function() {
            this.__seekAndDetroyConfigureContext();
        }.bind(this));
    }

    __setAppletIcon(aNewFeed) {
        const icon = (aNewFeed ? this.$._.new_feed_icon : this.$._.feed_icon) ||
            "feeds-reader-rss-feed-symbolic";
        super.__setAppletIcon(icon);
    }

    informMissingDependency() {
        // NOTE: I'm forced to use a delay because until the first response returning a
        // feedparser_error can set this.missingDependencies to true, a lot of calls to the
        // get_feed.py script could be made, causing to display several notifications.
        // So, with this delay, it doesn't matter how many times in a row
        // this.informMissingDependency is called, only the last call will be actually executed.
        this.$.schedule_manager.setTimeout("missing_dependencies", function() {
            this.set_applet_icon_symbolic_name("dialog-error");
            const msg = [_("Missing dependency!!!"),
                _("This applet needs the feedparser Python 3 module installed on your system for it to work."),
                _("Read this applet help for more details (Applet context menu > Help item)."),
                _("Restart Cinnamon after satisfying all dependencies.")
            ];

            const tt = _(this.$.metadata.name) + "\n\n" + msg.join("\n");

            if (this._applet_tooltip) {
                tryFn(() => {
                    this._applet_tooltip._tooltip.get_clutter_text().set_markup(
                        `<span color="red"><b>${escapeHTML(tt)}</b></span>`);
                }, (aErr) => {
                    this.set_applet_tooltip(tt);
                    global.logError(aErr);
                });
            } else {
                this.set_applet_tooltip(tt);
            }

            const icon = new St.Icon({
                icon_name: "dialog-error",
                icon_type: St.IconType.SYMBOLIC,
                icon_size: 24
            });

            Main.criticalNotify(_(this.$.metadata.name), msg.join("\n"), icon);

        }.bind(this), 1000);
    }

    _notifyImport(aMsg, aContext) {
        const icon = new St.Icon({
            icon_name: `dialog-${aContext}`,
            icon_type: St.IconType.SYMBOLIC,
            icon_size: 24
        });

        Main.criticalNotify(_(this.$.metadata.name), aMsg.join("\n"), icon);
    }

    enqueueFeed(aItem) {
        runtimeInfo(`Checking to add id ${aItem.params.id} to the process queue.`);
        // Only add items once to the queue.

        const found = this._feedsQueue.find(aFeed => (aFeed.params.id === aItem.params.id));

        if (!found) {
            // push the item on the queue
            this._feedsQueue.push(aItem);
            runtimeInfo("Added feed to the process queue.");
        }
    }

    processNextFeed() {
        if (this.missingDependencies) {
            return;
        }

        // Need to limit this to a single execution
        runtimeInfo(`Processing the process queue, length: ${this._feedsQueue.length}`);
        if (this._feedsQueue.length > 0) {
            const item = this._feedsQueue.shift();
            // start the download of the feed
            item.reader.downloadFeed();
        } else {
            this.forceDownload = false;
        }
    }

    _expandAppletContextMenu() {
        let menuItem = new PopupMenu.PopupIconMenuItem(
            _("Mark all feeds as read"),
            "object-select-symbolic",
            St.IconType.SYMBOLIC
        );
        menuItem.connect("activate", () => {
            const dialog = new ConfirmDialog({
                dialog_name: "FeedsReaderDialog",
                headline: _(this.$.metadata.name),
                description: _("Are you sure that you want to mark as read all articles from all feeds?"),
                cancel_label: _("Cancel"),
                ok_label: _("OK"),
                callback: () => {
                    for (const feed of this.feed_items) {
                        feed.reader.markAllArticlesRead();
                        feed.update();
                    }
                }
            });
            dialog.open();
        });
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _("Mark all articles from all feeds as read.")
        );
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Reload"),
            "view-refresh-symbolic",
            St.IconType.SYMBOLIC
        );
        menuItem.connect("activate", () => {
            runtimeInfo("Calling reload from context menu.");
            this.forceDownload = true;
            this.fullReload();
        });
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _("Update feeds from their on-line sources.")
        );
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Manage feeds"),
            "document-properties-symbolic",
            St.IconType.SYMBOLIC
        );
        menuItem.connect("activate", () => this.__openXletSettings("stack_id_2"));
        this._applet_context_menu.addMenuItem(menuItem);

        this._applet_context_menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Extras submenu
        const subMenu = new PopupMenu.PopupSubMenuMenuItem(_("Extras"));
        this._applet_context_menu.addMenuItem(subMenu);

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Import feeds in old format"),
            "feeds-reader-import-data",
            St.IconType.SYMBOLIC
        );
        menuItem.connect("activate", () => {
            Util.spawn_async(
                [`${this.$.metadata.path}/python_modules/feeds_importer.py`, "--csv"],
                (aResponse) => {
                    this._processImport(aResponse);
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
                [`${this.$.metadata.path}/python_modules/feeds_importer.py`, "--opml"],
                (aResponse) => {
                    this._processImport(aResponse);
                }
            );
        });
        subMenu.menu.addMenuItem(menuItem);

        subMenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        menuItem = new PopupMenu.PopupIconMenuItem(_("Help"), "dialog-information", St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => this.__openHelpPage());

        subMenu.menu.addMenuItem(menuItem);

        this.__seekAndDetroyConfigureContext();
    }

    loadFeedsMap() {
        tryFn(() => {
            this.feedsMap = JSON.parse(JSON.stringify(this.$._.feeds))
                .map((aObj) => {
                    // NOTE: Add zzzz to ID of feeds with no category. This allows to keep feeds with
                    // a category on top when sorting.
                    aObj["id"] = ((aObj.category ? aObj.category : "zzzz") + "_" + aObj.url).replace(/\W/g, "_");
                    return aObj;
                }).sort((a, b) => {
                    return a.category.localeCompare(b.category) || a.custom_title.localeCompare(b.custom_title);
                    // return a.id.localeCompare(b.id);
                });
        }, (aErr) => {
            global.logError(aErr);
            this.feedsMap = null;
        });
    }

    updateFeedsMapItem(aFeedID, aKey, aValue) {
        tryFn(() => {
            arrayEach(this.feedsMap, (aFeed, aIdx) => {
                if (aFeed.id === aFeedID) {
                    this.feedsMap[aIdx][aKey] = aValue;
                }
            });
        }, (aErr) => global.logError(aErr));
    }

    dumpFeedsMap() {
        tryFn(() => {
            const feedsMap = this.feedsMap.map((aObj) => {
                delete aObj["id"];
                return aObj;
            });

            this.$._.feeds = feedsMap;
        }, (aErr) => global.logError(aErr));
    }

    updateAppletState() {
        let unreadCount = 0;
        let tooltip = "";
        let first = true;

        // Application tooltip will only list unread feeds.
        for (const feed of this.feed_items) {
            const count = feed.unread_count;

            if (count > 0) {
                unreadCount += count;
                // ensure the last feed added does not get a newline character.
                if (!first) {
                    tooltip += "\n";
                }
                tooltip += feed.getTitle();
                first = false;
            }
        }

        if (unreadCount > 0) {
            this.__setAppletIcon(true);
            this._toggleAppletVisibility(true);
            this.set_applet_tooltip(tooltip);
        } else {
            this.__setAppletIcon(false);
            this._toggleAppletVisibility(false);
            this.set_applet_tooltip(_("No unread feeds"));
        }
    }

    _toggleAppletVisibility(aShow) {
        if (this.$._.third_party_integration_panel_drawer &&
            this.actor.hasOwnProperty("__HandledByPanelDrawer")) {
            this.actor[aShow ? "show" : "hide"]();
        }
    }

    _loadFeeds() {
        this._unifiedNotificationData = [];

        for (const feed of this.feed_items) {
            feed && feed.destroy();
        }

        this.feed_items = [];
        this.menu.removeAll();
        let itemCoun = 0;

        for (const feed of this.feedsMap) {
            if (feed.enabled) {
                this.feed_items[itemCoun] = new FeedSubMenuItem(this, feed);
                this.menu.addMenuItem(this.feed_items[itemCoun]);
                itemCoun += 1;
            }
        }
    }

    _processFeeds() {
        runtimeInfo(`Number of feeds to queue: ${this.feed_items.length}`);

        for (const feed of this.feed_items) {
            this.enqueueFeed(feed);
        }

        // Process the queue items.
        this.processNextFeed();

        // Set the next timeout.
        this.$.schedule_manager.setTimeout("refresh_feeds", function() {
            this._processFeeds();
        }.bind(this), this.$._.refresh_interval_mins * 1000);
    }

    fullReload() {
        this.loadFeedsMap();

        this.$.schedule_manager.idleCall("full_reload", function() {
            this._loadFeeds();
            this._processFeeds();
        }.bind(this));
    }

    notifyNewArticles(aFeedReader, aTitle, aText) {
        if (!this.$._.notifications_enabled) {
            runtimeInfo("Notifications Disabled");
            return;
        }

        this._notifyMessage(aFeedReader, aTitle, aText);
    }

    notifyArticlesRead(aFeedReader) {
        if (this.$._.notifications_enabled) {
            this._destroyMessage(aFeedReader);
        }
    }

    toggleFeedMenu(aFeedToShow, aAutoNext = false) {
        runtimeInfo(`auto_next = ${aAutoNext}`);

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
                    runtimeInfo(`Opening Menu: ${this.feed_items[i]}`);
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
    }

    redirectFeed(aSubMenu, aCurrentURL, aRedirectedURL) {
        arrayEach(this.$._.feeds, (aFeed, aIdx) => {
            if (aFeed.hasOwnProperty("url") && aFeed.url === aCurrentURL) {
                this.$._.feeds[aIdx].url = aRedirectedURL;
                aSubMenu.reader.is_redirected = false;
                this.toggleFeedMenu(aSubMenu, true);
                aSubMenu._title.set_text(aSubMenu.getTitle());
                return false;
            }
        });

        this.$._.feeds.save();

        this.loadFeedsMap();
    }

    _ensureNotificationSource() {
        if (!this._notificationSource) {
            this._notificationSource = new CustomNotificationSource(
                escapeHTML(_(this.$.metadata.name)) + this.$.instance_id
            );
            this._notificationSource.connect("destroy", () => {
                this._notificationSource = null;
            });

            if (Main.messageTray) {
                Main.messageTray.add(this._notificationSource);
            }
        }
    }

    _processImport(aResponse) {
        tryFn(() => {
            const newFeeds = JSON.parse(aResponse);
            this.$._.feeds = [...this.$._.feeds, ...newFeeds];

            this._notifyImport([
                _("Feeds successfully imported."),
                _("All imported feeds are disabled.")
            ], "info");
        }, (aErr) => {
            this._notifyImport([
                _("Error importing feeds file!"),
                _("Look at the logs for details.") +
                "\n~/.cinnamon/glass.log - ~/.xsession-errors"
            ], "error");
            global.logError("Error importing feeds file!");
            global.logError("Response:");
            global.logError(aResponse);
            global.logError(aErr);
        });
    }

    _notifyMessage(aFeedReader, aTitle, aText) {
        if (aFeedReader.hasOwnProperty("_notification")) {
            aFeedReader._notification.destroy();
        }

        this._ensureNotificationSource();

        if (this.$._.unified_notifications) {
            this._updateUnifiedNotificationData(aFeedReader, aTitle, aText);

            this.$.schedule_manager.setTimeout("update_unified_notifications", function() {
                this._updateUnifiedNotification(aFeedReader.locallyLoaded);
            }.bind(this), this.$._.peek_desktop_delay);
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
    }

    _updateUnifiedNotification(aLocallyLoaded) {
        let body = "";

        for (const data of this._unifiedNotificationData) {
            if (data.title && data.text && data.unread > 0) {
                body += `<b>${escapeHTML(data.title)}</b>\n${data.text}\n`;
            }
        }

        body = body.trim();

        if (this._notificationSource && !this.unifiedNotification) {
            this.unifiedNotification = new MessageTray.Notification(
                this._notificationSource,
                escapeHTML(_(this.$.metadata.name)) + this.$.instance_id,
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
                _(this.$.metadata.name),
                body,
                this._unifiedNotificationParams
            );

            aLocallyLoaded || this._notificationSource.notify(this.unifiedNotification);
        } else {
            this.unifiedNotification && this.unifiedNotification.destroy();
        }
    }

    _updateUnifiedNotificationData(aFeedReader, aTitle, aText) {
        this._removeFeedFromUnifiedNotificationData(aFeedReader);
        this._unifiedNotificationData.push({
            id: aFeedReader.subMenu.params.id,
            title: aTitle || "",
            text: aText || "",
            unread: parseInt(aFeedReader.unread_count, 10)
        });
    }

    _removeFeedFromUnifiedNotificationData(aFeedReader) {
        arrayEach(this._unifiedNotificationData, (aData, aIdx) => {
            if (aData.id === aFeedReader.subMenu.params.id) {
                this._unifiedNotificationData.splice(aIdx, 1);
                return false;
            }
        }, true);
    }

    _destroyMessage(aFeedReader) {
        this._removeFeedFromUnifiedNotificationData(aFeedReader);
        aFeedReader.hasOwnProperty("_notification") && aFeedReader._notification.destroy();
        this.unifiedNotification && this._updateUnifiedNotification(false);
    }

    _updateKeybindings() {
        this.$.keybinding_manager.addKeybinding("toggle_menu", this.$._.toggle_menu_keybinding, () => {
            if (!Main.overview.visible && !Main.expo.visible) {
                this.on_applet_clicked();
            }
        });
    }

    _onOpenStateChanged(aMenu, aOpen) {
        if (!aOpen && this.requestMenuRebuild) {
            this.requestMenuRebuild = false;
            this.dumpFeedsMap();
            this.fullReload();
        }
    }

    on_applet_removed_from_panel() {
        super.on_applet_removed_from_panel();

        // Remove all notifications since they no longer apply.
        for (const feed of this.feed_items) {
            this._destroyMessage(feed.reader);
        }
    }

    on_applet_clicked(event) { // jshint ignore:line
        this.menu.toggle();
        this.toggleFeedMenu(null);
    }

    __onSettingsChanged(aPrefOldValue, aPrefKey) {
        switch (aPrefKey) {
            case "show_icons_in_menu":
            case "refresh_interval_mins":
            case "description_max_length":
            case "tooltip_max_width":
            case "notifications_enabled":
            case "max_items":
            case "min_article_item_width":
                for (const feed of this.feed_items) {
                    feed.update();
                }

                this._processFeeds();
                break;
            case "feeds_apply":
                this.fullReload();
                break;
            case "toggle_menu_keybinding":
                this._updateKeybindings();
                break;
            case "feed_icon":
            case "new_feed_icon":
                this.updateAppletState();
                break;
        }
    }
}

function main() {
    Debugger.wrapObjectMethods({
        CustomNotificationSource: CustomNotificationSource,
        FeedsReaderForkByOdyseus: FeedsReaderForkByOdyseus
    });

    return new FeedsReaderForkByOdyseus(...arguments);
}
