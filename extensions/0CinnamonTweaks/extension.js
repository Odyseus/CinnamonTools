let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
}

const _ = $._;
const Settings = $.Settings;

const {
    gi: {
        Cinnamon,
        Clutter,
        Gio,
        Meta,
        St
    },
    mainloop: Mainloop,
    misc: {
        util: Util
    },
    ui: {
        applet: Applet,
        desklet: Desklet,
        main: Main,
        popupMenu: PopupMenu,
        tooltips: Tooltips,
        tweener: Tweener
    }
} = imports;

// Imported only when needed in an attempt to gain performance.
// Not that it's needed, but, the more tweaks I add, the more crap will I need to import.
let HotCornerPatched = null;
let AppletManager = null;
let DeskletManager = null;
let ShadowFactory = null;
let WorkspaceTracker = null;

let allowEnabling = false;
let xletMeta = null;

let CONNECTION_IDS = {
    settings_bindings: {},
    DTD: 0, // CT_DropToDesktopPatch toggle ID.
    PPMM: 0, // CT_PopupMenuManagerPatch toggle ID.
    TTP: 0, // CT_TooltipsPatch toggle ID.
    HCP: 0, // CT_HotCornersPatch toggle ID. Mark for deletion on EOL. Cinnamon 3.2.x+
    MTP: 0, // CT_MessageTrayPatch toggle ID.
    DMP: 0, // CT_DeskletManagerPatch toggle ID.
    AMP: 0, // CT_AppletManagerPatch toogle ID.
    WDAE: 0, // CT_WindowDemandsAttentionBehavior toogle ID.
    WDAE_EXEC: 0, // CT_WindowDemandsAttentionBehavior execution ID.
    WDAE_CONNECTION: 0, // CT_WindowDemandsAttentionBehavior connection ID.
    CWS: 0, // CT_CustomWindowShadows toggle ID.
    CWS_EXEC: 0, // CT_CustomWindowShadows execution ID.
    AMW: 0, // CT_AutoMoveWindows toggle ID.
    MAXNG: 0, // CT_MaximusNG toggle ID.
};

// Container for old attributes and functions for later restore.
let STG = {
    PPMM: {},
    TTP: {},
    HCP: {},
    MTP: {},
    AMP: {},
    DMP: {},
    AMW: {},
    MAXNG: {}
};

function disconnectAllSettings() {
    for (let id in CONNECTION_IDS.settings_bindings) {
        Settings.disconnect(id);
    }

    Settings.destroy();
}

function connectSettings(aPrefKeys, aCallback) {
    let settingsCallback = () => {
        aCallback();
    };

    for (let i = aPrefKeys.length - 1; i >= 0; i--) {
        let prop = (aPrefKeys[i].split("-")).join("_");
        CONNECTION_IDS.settings_bindings[prop] = Settings.connect(
            "changed::" + aPrefKeys[i], settingsCallback
        );
    }
}

function _bindSettings() {
    connectSettings([
        "desktop-tweaks-enabled",
        "desktop-tweaks-allow-drop-to-desktop"
    ], CT_DropToDesktopPatch.toggle);

    connectSettings([
        "popup-menu-manager-tweaks-enabled",
        "popup-menu-manager-applets-menus-behavior"
    ], CT_PopupMenuManagerPatch.toggle);

    connectSettings([
        "applets-tweaks-enabled",
        "applets-ask-confirmation-applet-removal",
        "applets-add-open-folder-item-to-context",
        "applets-add-edit-file-item-to-context",
        "applets-add-open-folder-item-to-context-placement",
        "applets-add-edit-file-item-to-context-placement"
    ], () => {
        try {
            if (!AppletManager) {
                AppletManager = imports.ui.appletManager;
            }
        } finally {
            CT_AppletManagerPatch.toggle();
        }
    });

    connectSettings([
        "desklets-tweaks-enabled",
        "desklets-ask-confirmation-applet-removal",
        "desklets-add-open-folder-item-to-context",
        "desklets-add-edit-file-item-to-context",
        "desklets-add-open-folder-item-to-context-placement",
        "desklets-add-edit-file-item-to-context-placement"
    ], () => {
        try {
            if (!DeskletManager) {
                DeskletManager = imports.ui.deskletManager;
            }
        } finally {
            CT_DeskletManagerPatch.toggle();
        }
    });

    connectSettings([
        "notifications-enable-tweaks",
        "notifications-enable-animation",
        "notifications-enable-close-button",
        "notifications-position",
        "notifications-distance-from-panel",
        "notifications-right-margin"
    ], CT_MessageTrayPatch.toggle);

    connectSettings([
        "win-demands-attention-activation-mode",
        "win-demands-attention-keyboard-shortcut"
    ], CT_WindowDemandsAttentionBehavior.toggle);

    connectSettings([
        "hotcorners-tweaks-enabled",
        "hotcorners-delay-top-left",
        "hotcorners-delay-top-right",
        "hotcorners-delay-bottom-left",
        "hotcorners-delay-bottom-right"
    ], () => {
        try {
            if (!HotCornerPatched) {
                // Mark for deletion on EOL. Cinnamon 3.6.x+
                if (typeof require === "function") {
                    HotCornerPatched = require("./extra_modules/hotCornerPatched.js");
                } else {
                    HotCornerPatched = imports.ui.extensionSystem.extensions["{{UUID}}"].extra_modules.hotCornerPatched;
                }
            }
        } finally {
            CT_HotCornersPatch.toggle(); // Mark for deletion on EOL. Cinnamon 3.2.x+
        }
    });

    connectSettings([
        "tooltips-tweaks-enabled",
        "tooltips-alignment",
        "tooltips-delay"
    ], CT_TooltipsPatch.toggle);

    connectSettings([
        "window-shadows-tweaks-enabled",
        "window-shadows-preset",
        "window-shadows-custom-preset"
    ], () => {
        try {
            if (!ShadowFactory) {
                ShadowFactory = Meta.ShadowFactory.get_default();
            }
        } finally {
            CT_CustomWindowShadows.toggle();
        }
    });

    connectSettings([
        "window-auto-move-tweaks-enabled"
    ], () => {
        try {
            if (!WorkspaceTracker) {
                // Mark for deletion on EOL. Cinnamon 3.6.x+
                if (typeof require === "function") {
                    WorkspaceTracker = require("./extra_modules/WorkspaceTracker.js");
                } else {
                    WorkspaceTracker = imports.ui.extensionSystem.extensions["{{UUID}}"].extra_modules.WorkspaceTracker;
                }
            }
        } finally {
            CT_AutoMoveWindows.toggle();
        }
    });

    // Instead of automatically triggering the callback every
    // time one of the maximus related settings changes, trigger it on demand.
    // This is done because this tweak is buggy as heck.
    // The following is more of a dummy setting.
    // I'm using it so I can trigger a JavaScript function from
    // the Python code from the settings window.
    connectSettings([
        "maximus-apply-settings"
    ], CT_MaximusNG.toggle);

    connectSettings([
        "test-notifications"
    ], $.testNotifications);
}

function togglePatch(aPatch, aID, aEnabledPref) {
    try {
        aPatch.disable();
        if (CONNECTION_IDS[aID] > 0) {
            Mainloop.source_remove(CONNECTION_IDS[aID]);
            CONNECTION_IDS[aID] = 0;
        }

        if (!aEnabledPref) {
            return;
        }

        CONNECTION_IDS[aID] = Mainloop.timeout_add(1000, () => {
            aPatch.enable();
            CONNECTION_IDS[aID] = 0;
            return false;
        });
    } catch (aErr) {
        global.logError(aErr);
    }
}

const CT_AppletManagerPatch = {
    enable: function() {
        if (Settings.applets_add_open_folder_item_to_context ||
            Settings.applets_add_edit_file_item_to_context) {
            STG.AMP.finalizeContextMenu = $.injectToFunction(Applet.Applet.prototype, "finalizeContextMenu", function() {
                let menuItems = this._applet_context_menu._getMenuItems();
                let itemsLength = menuItems.length;
                if (itemsLength > 0) {
                    let getPosition = (aPos) => {
                        let pos;
                        switch (Number($.CTX_ITM_POS[aPos])) {
                            case 0: // Last place
                                pos = itemsLength;
                                break;
                            case 1: // Before "Remove..."
                                pos = menuItems.indexOf(this.context_menu_item_remove);
                                break;
                            case 2: // Before "Configure..."
                                if (menuItems.indexOf(this.context_menu_item_configure) !== -1) {
                                    pos = menuItems.indexOf(this.context_menu_item_configure);
                                } else {
                                    pos = menuItems.indexOf(this.context_menu_item_remove);
                                }
                                break;
                            case 3: // Before "About..."
                                pos = menuItems.indexOf(this.context_menu_item_about);
                                break;
                        }
                        while (pos < 0) {
                            ++pos;
                        }
                        return pos;
                    };

                    if (Settings.applets_add_open_folder_item_to_context &&
                        !this.context_menu_item_custom_open_folder) {
                        let position = getPosition(Settings.applets_add_open_folder_item_to_context_placement);
                        this.context_menu_item_custom_open_folder = new PopupMenu.PopupIconMenuItem(
                            _("Open applet folder"),
                            "folder",
                            St.IconType.SYMBOLIC);
                        this.context_menu_item_custom_open_folder.connect("activate",
                            () => {
                                Util.spawn_async(["xdg-open", this._meta["path"]], null);
                            });
                        this._applet_context_menu.addMenuItem(
                            this.context_menu_item_custom_open_folder,
                            position
                        );
                    }

                    if (Settings.applets_add_edit_file_item_to_context &&
                        !this.context_menu_item_custom_edit_file) {
                        let position = getPosition(Settings.applets_add_edit_file_item_to_context_placement);
                        this.context_menu_item_custom_edit_file = new PopupMenu.PopupIconMenuItem(
                            _("Edit applet main file"),
                            "text-editor",
                            St.IconType.SYMBOLIC);
                        this.context_menu_item_custom_edit_file.connect("activate",
                            () => {
                                Util.spawn_async(["xdg-open", this._meta["path"] + "/applet.js"], null);
                            });
                        this._applet_context_menu.addMenuItem(
                            this.context_menu_item_custom_edit_file,
                            position
                        );
                    }
                }
            });
        }

        if (Settings.applets_ask_confirmation_applet_removal) {
            let am = AppletManager;
            // Extracted from /usr/share/cinnamon/js/ui/appletManager.js
            // Patch Appletmanager._removeAppletFromPanel to ask for confirmation on applet removal.
            STG.AMP._removeAppletFromPanel = am._removeAppletFromPanel;
            am._removeAppletFromPanel = function(uuid, applet_id) {
                let removeApplet = () => {
                    // TODO: Check the exact Cinnamon version in which this function was changed. ¬¬
                    // Mark for deletion on EOL. Cinnamon 3.6.x+
                    if ($.versionCompare($.CINNAMON_VERSION, "3.6.4") >= 0) {
                        // WARNING!!!
                        // This is an object: {key:value}
                        // This isn't a ¬@#½~¬ object!!!: {key}
                        let definition = $.queryCollection(am.definitions, {
                            uuid: uuid,
                            applet_id: applet_id
                        });

                        if (!definition) {
                            return false;
                        }

                        am.removeApplet(definition);
                    } else {
                        let enabledApplets = am.enabledAppletDefinitions.raw;
                        for (let i = 0; i < enabledApplets.length; i++) {
                            let appletDefinition = am.getAppletDefinition(enabledApplets[i]);
                            if (appletDefinition) {
                                if (uuid == appletDefinition.uuid && applet_id == appletDefinition.applet_id) {
                                    let newEnabledApplets = enabledApplets.slice(0);
                                    newEnabledApplets.splice(i, 1);
                                    global.settings.set_strv("enabled-applets", newEnabledApplets);
                                    break;
                                }
                            }
                        }
                    }

                    return false;
                };
                let ctrlKey = Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2];

                if (ctrlKey) {
                    removeApplet();
                } else {
                    let dialog = new $.ConfirmationDialog(() => {
                            removeApplet();
                        },
                        "Applet removal",
                        _("Do you want to remove '%s' from your panel?\nInstance ID: %s")
                        .format(AppletManager.get_object_for_uuid(uuid, applet_id)._meta.name, applet_id)
                    );
                    dialog.open();
                }
            };
        }
    },

    disable: function() {
        if (STG.AMP.finalizeContextMenu) {
            $.removeInjection(Applet.Applet.prototype, STG.AMP, "finalizeContextMenu");
        }

        if (STG.AMP._removeAppletFromPanel) {
            AppletManager._removeAppletFromPanel = STG.AMP._removeAppletFromPanel;
            delete STG.AMP._removeAppletFromPanel;
        }
    },

    toggle: function() {
        togglePatch(CT_AppletManagerPatch, "AMP", Settings.applets_tweaks_enabled);
    }
};

const CT_DeskletManagerPatch = {
    enable: function() {
        if (Settings.desklets_add_open_folder_item_to_context ||
            Settings.desklets_add_edit_file_item_to_context) {
            STG.DMP.finalizeContextMenu = $.injectToFunction(Desklet.Desklet.prototype, "finalizeContextMenu", function() {
                let menuItems = this._menu._getMenuItems();
                let itemsLength = menuItems.length;
                if (itemsLength > 0) {
                    let getPosition = (aPos) => {
                        let pos;
                        switch (Number($.CTX_ITM_POS[aPos])) {
                            case 0: // Last place
                                pos = itemsLength;
                                break;
                            case 1: // Before "Remove..."
                                pos = menuItems.indexOf(this.context_menu_item_remove);
                                break;
                            case 2: // Before "Configure..."
                                if (menuItems.indexOf(this.context_menu_item_configure) !== -1) {
                                    pos = menuItems.indexOf(this.context_menu_item_configure);
                                } else {
                                    pos = menuItems.indexOf(this.context_menu_item_remove);
                                }
                                break;
                            case 3: // Before "About..."
                                pos = menuItems.indexOf(this.context_menu_item_about);
                                break;
                        }
                        while (pos < 0) {
                            ++pos;
                        }
                        return pos;
                    };

                    if (Settings.desklets_add_open_folder_item_to_context &&
                        !this.context_menu_item_custom_open_folder) {
                        let position = getPosition(Settings.desklets_add_open_folder_item_to_context_placement);
                        this.context_menu_item_custom_open_folder = new PopupMenu.PopupIconMenuItem(
                            _("Open desklet folder"),
                            "folder",
                            St.IconType.SYMBOLIC);
                        this.context_menu_item_custom_open_folder.connect("activate", () => {
                            Util.spawn_async(["xdg-open", this._meta["path"]], null);
                        });
                        this._menu.addMenuItem(
                            this.context_menu_item_custom_open_folder,
                            position
                        );
                    }

                    if (Settings.desklets_add_edit_file_item_to_context &&
                        !this.context_menu_item_custom_edit_file) {
                        let position = getPosition(Settings.desklets_add_edit_file_item_to_context_placement);
                        this.context_menu_item_custom_edit_file = new PopupMenu.PopupIconMenuItem(
                            _("Edit desklet main file"),
                            "text-editor",
                            St.IconType.SYMBOLIC);
                        this.context_menu_item_custom_edit_file.connect("activate", () => {
                            Util.spawn_async(["xdg-open", this._meta["path"] + "/desklet.js"], null);
                        });
                        this._menu.addMenuItem(
                            this.context_menu_item_custom_edit_file,
                            position
                        );
                    }
                }
            });
        }

        if (Settings.desklets_ask_confirmation_desklet_removal) {
            let dm = DeskletManager;

            // Extracted from /usr/share/cinnamon/js/ui/deskletManager.js
            // Patch DeskletManager.removeDesklet to ask for confirmation on desklet removal.
            STG.DMP.removeDesklet = dm.removeDesklet;
            dm.removeDesklet = function(uuid, desklet_id) {
                let ENABLED_DESKLETS_KEY = "enabled-desklets";
                let removeDesklet = () => {
                    try {
                        let list = global.settings.get_strv(ENABLED_DESKLETS_KEY);
                        for (let i = 0; i < list.length; i++) {
                            let definition = list[i];
                            let elements = definition.split(":");
                            if (uuid == elements[0] && desklet_id == elements[1]) {
                                list.splice(i, 1);
                            }
                        }
                        global.settings.set_strv(ENABLED_DESKLETS_KEY, list);
                    } catch (aErr) {
                        global.logError(aErr.message);
                    }
                };
                let ctrlKey = Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2];

                if (ctrlKey) {
                    removeDesklet();
                } else {
                    let dialog = new $.ConfirmationDialog(() => {
                            removeDesklet();
                        },
                        "Desklet removal",
                        _("Do you want to remove '%s' from your desktop?\nInstance ID: %s")
                        .format(DeskletManager.get_object_for_uuid(uuid, desklet_id)._meta.name, desklet_id)
                    );
                    dialog.open();
                }
            };
        }
    },

    disable: function() {
        if (STG.DMP.finalizeContextMenu) {
            $.removeInjection(Desklet.Desklet.prototype, STG.DMP, "finalizeContextMenu");
        }

        if (STG.DMP.removeDesklet) {
            DeskletManager.removeDesklet = STG.DMP.removeDesklet;
            delete STG.DMP.removeDesklet;
        }
    },

    toggle: function() {
        togglePatch(CT_DeskletManagerPatch, "DMP", Settings.desklets_tweaks_enabled);
    }
};

const CT_MessageTrayPatch = {
    enable: function() {
        let mt = Main.messageTray;
        let bottomPosition = Settings.notifications_position === "bottom";
        let ANIMATION_TIME = Settings.notifications_enable_animation ? 0.2 : 0.001;
        // Cinnamon versions prior to 3.2.x uses true/flase to get top/bottom panel.
        // Newer versions use numbers to identify all four possible panels.
        let boolPanel = $.versionCompare($.CINNAMON_VERSION, "3.2.0") <= 0;
        let bottomPanel = Main.panelManager.getPanel(0, (boolPanel ? true : 1));
        let topPanel = Main.panelManager.getPanel(0, (boolPanel ? false : 0));
        let rightPanel = boolPanel ? null : Main.panelManager.getPanel(0, 3);
        let State = {
            HIDDEN: 0,
            SHOWING: 1,
            SHOWN: 2,
            HIDING: 3
        };
        let Urgency = {
            LOW: 0,
            NORMAL: 1,
            HIGH: 2,
            CRITICAL: 3
        };

        let getDistanceFromAnchorPanel = () => {
            return Number(Settings.notifications_distance_from_panel);
        };

        // Notifications on Cinnamon 3.6.x already have close buttons.
        // Mark for deletion on EOL. Cinnamon 3.6.x+
        if ($.versionCompare($.CINNAMON_VERSION, "3.6.4") <= 0 &&
            Settings.notifications_enable_close_button) {
            // Needed to "accommodate" the close button.
            // The only difference is in the col_span property when setting a child.
            // Up until now, it's retro-compatible enough.
            STG.MTP._updateLastColumnSettings = mt._updateLastColumnSettings;
            mt._updateLastColumnSettings = function() {
                if (this._scrollArea) {
                    this._notification.child_set(this._scrollArea, {
                        col: this._imageBin ? 2 : 1,
                        col_span: this._imageBin ? 2 : 3
                    });
                }

                if (this._actionArea) {
                    this._notification.child_set(this._actionArea, {
                        col: this._imageBin ? 2 : 1,
                        col_span: this._imageBin ? 2 : 3
                    });
                }
            };
        }

        // Extracted from /usr/share/cinnamon/js/ui/messageTray.js
        // Patch _hideNotification to allow correct animation.
        STG.MTP._hideNotification = mt._hideNotification;
        mt._hideNotification = function() {
            let y;

            this._focusGrabber.ungrabFocus();

            if (this._notificationExpandedId) {
                this._notification.disconnect(this._notificationExpandedId);
                this._notificationExpandedId = 0;
            }

            if (bottomPosition) {
                if (this.bottomPositionSignal) {
                    this._notificationBin.disconnect(this.bottomPositionSignal);
                }

                y = Main.layoutManager.primaryMonitor.height;

                if (bottomPanel) {
                    y -= bottomPanel.actor.get_height() - 15;
                }
            } else {
                y = Main.layoutManager.primaryMonitor.y;
            }

            this._tween(this._notificationBin, "_notificationState", State.HIDDEN, {
                y: y,
                opacity: 0,
                time: ANIMATION_TIME,
                transition: "easeOutQuad",
                onComplete: this._hideNotificationCompleted,
                onCompleteScope: this
            });
        };

        // Patch _showNotification to allow correct animation and custom right margin.
        STG.MTP._showNotification = mt._showNotification;
        mt._showNotification = function() {
            this._notificationTimeoutId = 1;
            this._notification = this._notificationQueue.shift();

            if (this._notification.actor._parent_container) {
                this._notification.collapseCompleted();
                this._notification.actor._parent_container.remove_actor(this._notification.actor);
            }

            this._notificationClickedId = this._notification.connect("done-displaying",
                () => this._escapeTray());
            this._notificationBin.child = this._notification.actor;
            this._notificationBin.opacity = 0;

            let monitor = Main.layoutManager.primaryMonitor;
            let rightGap = Number(Settings.notifications_right_margin);
            let distanceFromAnchorPanel = getDistanceFromAnchorPanel();

            if (rightPanel) {
                rightGap += rightPanel.actor.get_width();
            }

            if (!bottomPosition) {
                if (topPanel) {
                    distanceFromAnchorPanel += topPanel.actor.get_height();
                }

                this._notificationBin.y = monitor.y + distanceFromAnchorPanel; // Notifications appear from here (for the animation)
            }

            this._notificationBin.x = monitor.x + monitor.width - this._notification._table.width - rightGap;

            Main.soundManager.play("notification");

            Main.layoutManager._chrome.modifyActorParams(this._notificationBin, {
                visibleInFullscreen: this._notification.urgency === Urgency.CRITICAL
            });

            if (bottomPosition) {
                if (bottomPanel) {
                    distanceFromAnchorPanel += bottomPanel.actor.get_height();
                }

                let getBottomPositionY = () => {
                    return monitor.height - this._notificationBin.height - distanceFromAnchorPanel;
                };
                let shouldReturn = false;
                let initialY = getBottomPositionY();
                // For multi-line notifications, the correct height will not be known until the
                // notification is done animating, so this will set _notificationBin.y when
                // queue-redraw is emitted, and return early if the  height decreases
                // to prevent unnecessary property setting.
                this.bottomPositionSignal = this._notificationBin.connect("queue-redraw", () => {
                    if (shouldReturn) {
                        return;
                    }

                    this._notificationBin.y = getBottomPositionY();

                    if (initialY > this._notificationBin.y) {
                        shouldReturn = true;
                    }
                });
            }

            this._notificationBin.show();

            this._updateShowingNotification();

            let [x, y, mods] = global.get_pointer(); // jshint ignore:line
            this._showNotificationMouseX = x;
            this._showNotificationMouseY = y;
            this._lastSeenMouseY = y;

            // I can neither override not inject code into the Notification.prototype._init method.
            // So, I have to insert the close button "on-the-fly".
            // Mark for deletion on EOL. Cinnamon 3.6.x+
            if ($.versionCompare($.CINNAMON_VERSION, "3.6.4") <= 0 &&
                Settings.notifications_enable_close_button) {
                try {
                    let icon = new St.Icon({
                        icon_name: "window-close",
                        icon_type: St.IconType.SYMBOLIC,
                        icon_size: 16
                    });
                    let closeButton = new St.Button({
                        child: icon,
                        opacity: 128
                    });
                    closeButton.connect("clicked",
                        function() {
                            this.destroy();
                        }.bind(this._notification));
                    closeButton.connect("notify::hover",
                        () => {
                            closeButton.opacity = closeButton.hover ? 255 : 128;
                        });
                    this._notification._table.add(closeButton, {
                        row: 0,
                        col: 3,
                        x_expand: false,
                        y_expand: false,
                        y_fill: false,
                        y_align: St.Align.START
                    });
                } catch (aErr) {
                    global.logError(aErr);
                }
            }
        };

        // Patch _onNotificationExpanded to allow correct showing animation and custom top/bottom margins.
        STG.MTP._onNotificationExpanded = mt._onNotificationExpanded;
        mt._onNotificationExpanded = function() {
            // FIXME PART 1:
            // I had to add the condition to set this variable to force expandedY to be
            // different than
            let expandedY = bottomPosition ?
                this._notification.actor.height + this._notificationBin.height :
                this._notification.actor.height - this._notificationBin.height;
            // let expandedY = this._notification.actor.height - this._notificationBin.height;
            let monitor = Main.layoutManager.primaryMonitor;
            let anchorPanel = bottomPosition ? bottomPanel : topPanel;
            let distanceFromAnchorPanel = getDistanceFromAnchorPanel();

            if (anchorPanel) {
                distanceFromAnchorPanel += anchorPanel.actor.get_height();
            }

            let newY = bottomPosition ?
                monitor.height - this._notificationBin.height - distanceFromAnchorPanel :
                monitor.y + distanceFromAnchorPanel;

            // FIXME PART 2:
            // The fix of the upstream bug (this._notification.y changed to this._notification.actor.y)
            // exposed a bug on this extension.
            // Until I understand what the heck the following conditions actually do,
            // I will force to always use an animation.
            if (this._notificationBin.y < expandedY) {
                this._notificationBin.y = expandedY;
            } else if (this._notification.actor.y != expandedY) {
                this._tween(this._notificationBin, "_notificationState", State.SHOWN, {
                    y: newY,
                    opacity: 255,
                    time: ANIMATION_TIME,
                    transition: "easeOutQuad",
                    onComplete: this._showNotificationCompleted,
                    onCompleteScope: this
                });
            }
        };

        STG.MTP._updateShowingNotification = mt._updateShowingNotification;
        mt._updateShowingNotification = function() {
            Tweener.removeTweens(this._notificationBin);

            this._expandNotification(true);

            let monitor = Main.layoutManager.primaryMonitor;
            let anchorPanel = bottomPosition ? bottomPanel : topPanel;
            let distanceFromAnchorPanel = getDistanceFromAnchorPanel();

            if (anchorPanel) {
                distanceFromAnchorPanel += anchorPanel.actor.get_height();
            }

            let newY = bottomPosition ?
                monitor.height - this._notificationBin.height - distanceFromAnchorPanel :
                monitor.y + distanceFromAnchorPanel;

            this._tween(this._notificationBin, "_notificationState", State.SHOWN, {
                y: newY,
                opacity: 255,
                time: ANIMATION_TIME,
                transition: "easeOutQuad",
                onComplete: this._showNotificationCompleted,
                onCompleteScope: this
            });
        };

    },

    disable: function() {
        if (STG.MTP._updateLastColumnSettings) {
            Main.messageTray._updateLastColumnSettings = STG.MTP._updateLastColumnSettings;
            delete STG.MTP._updateLastColumnSettings;
        }

        if (STG.MTP._hideNotification) {
            Main.messageTray._hideNotification = STG.MTP._hideNotification;
            delete STG.MTP._hideNotification;
        }

        if (STG.MTP._showNotification) {
            Main.messageTray._showNotification = STG.MTP._showNotification;
            delete STG.MTP._showNotification;
        }

        if (STG.MTP._onNotificationExpanded) {
            Main.messageTray._onNotificationExpanded = STG.MTP._onNotificationExpanded;
            delete STG.MTP._onNotificationExpanded;
        }

        if (STG.MTP._updateShowingNotification) {
            Main.messageTray._updateShowingNotification = STG.MTP._updateShowingNotification;
            delete STG.MTP._updateShowingNotification;
        }
    },

    toggle: function() {
        togglePatch(CT_MessageTrayPatch, "MTP", Settings.notifications_enable_tweaks);
    }
};

function WindowDemandsAttention() {
    this._init.apply(this, arguments);
}

WindowDemandsAttention.prototype = {
    wdae_shortcut_id: "cinnamon-tweaks-window-demands-attention-shortcut",

    _init: function() {
        if (Settings.win_demands_attention_activation_mode === "hotkey") {
            this._windows = [];
            CONNECTION_IDS.WDAE_CONNECTION = global.display.connect(
                "window-demands-attention",
                (aDisplay, aWin) => {
                    this._on_window_demands_attention(aDisplay, aWin);
                }
            );
        } else if (Settings.win_demands_attention_activation_mode === "force") {
            this._tracker = Cinnamon.WindowTracker.get_default();
            this._handlerid = global.display.connect("window-demands-attention",
                (aDisplay, aWin) => {
                    this._on_window_demands_attention(aDisplay, aWin);
                }
            );
        }
    },

    _on_window_demands_attention: function(aDisplay, aWin) {
        switch (Settings.win_demands_attention_activation_mode) {
            case "hotkey":
                this._windows.push(aWin);
                break;
            case "force":
                Main.activateWindow(aWin);
                break;
        }
    },

    _activate_last_window: function() {
        if (this._windows.length === 0) {
            Main.notify("No windows in the queue.");
            return;
        }

        let last_window = this._windows.pop();
        Main.activateWindow(last_window);
    },

    _add_keybindings: function() {
        Main.keybindingManager.addHotKey(
            this.wdae_shortcut_id,
            Settings.win_demands_attention_keyboard_shortcut + "::",
            () => this._activate_last_window());
    },

    _remove_keybindings: function() {
        Main.keybindingManager.removeHotKey(this.wdae_shortcut_id);
    },

    enable: function() {
        if (Settings.win_demands_attention_activation_mode === "hotkey") {
            this._add_keybindings();
        }
    },

    _destroy: function() {
        try {
            global.display.disconnect(this._handlerid);
        } catch (aErr) {}

        try {
            global.display.disconnect(CONNECTION_IDS.WDAE_CONNECTION);
        } catch (aErr) {}

        CONNECTION_IDS.WDAE_CONNECTION = 0;
        this._windows = null;
        this._remove_keybindings();
    }
};

const CT_WindowDemandsAttentionBehavior = {
    enable: function() {
        try {
            if (CONNECTION_IDS.WDAE_EXEC > 0) {
                this.disable();
            }
        } finally {
            CONNECTION_IDS.WDAE_EXEC = new WindowDemandsAttention();
            CONNECTION_IDS.WDAE_EXEC.enable();
        }
    },

    disable: function() {
        if (CONNECTION_IDS.WDAE_EXEC > 0) {
            CONNECTION_IDS.WDAE_EXEC._destroy();
            CONNECTION_IDS.WDAE_EXEC = 0;
        }
    },

    toggle: function() {
        togglePatch(CT_WindowDemandsAttentionBehavior,
            "WDAE",
            Settings.win_demands_attention_activation_mode !== "none");
    }
};

// Mark for deletion on EOL. Cinnamon 3.2.x+
const CT_HotCornersPatch = {
    enable: function() {

        if (this.shouldEnable()) {
            STG.HCP = Main.layoutManager.hotCornerManager;
            delete Main.layoutManager.hotCornerManager;
            Main.layoutManager.hotCornerManager = new HotCornerPatched.HotCornerManager({
                0: Settings.hotcorners_delay_top_left,
                1: Settings.hotcorners_delay_top_right,
                2: Settings.hotcorners_delay_bottom_left,
                3: Settings.hotcorners_delay_bottom_right
            });
            Main.layoutManager._updateHotCorners();
            global.settings.connect("changed::overview-corner", () => this.toggle());
        } else {
            $.dealWithRejection(_("Hotcorners tweaks"));
        }
    },

    disable: function() {
        if (STG.HCP) {
            Main.layoutManager.hotCornerManager = STG.HCP;
            delete STG.HCP;
        }
    },

    toggle: function() {
        togglePatch(CT_HotCornersPatch, "HCP", Settings.hotcorners_tweaks_enabled);
    },

    shouldEnable: function() {
        return $.versionCompare($.CINNAMON_VERSION, "3.0.7") <= 0;
    }
};

const CT_TooltipsPatch = {
    enable: function() {
        if (this.shouldEnable("delay")) {
            if (Settings.tooltips_delay !== 300) {
                if ($.versionCompare($.CINNAMON_VERSION, "3.0.7") <= 0) {
                    STG.TTP._onMotionEvent = Tooltips.TooltipBase._onMotionEvent;
                    Tooltips.TooltipBase.prototype["_onMotionEvent"] = function(actor, event) {
                        if (this._showTimer) {
                            Mainloop.source_remove(this._showTimer);
                            this._showTimer = null;
                        }

                        if (!this.visible) {
                            this._showTimer = Mainloop.timeout_add(Settings.tooltips_delay,
                                () => this._onTimerComplete());
                            this.mousePosition = event.get_coords();
                        }
                    };

                    STG.TTP._onEnterEvent = Tooltips.TooltipBase._onEnterEvent;
                    Tooltips.TooltipBase.prototype["_onEnterEvent"] = function(actor, event) {
                        if (!this._showTimer) {
                            this._showTimer = Mainloop.timeout_add(Settings.tooltips_delay,
                                () => this._onTimerComplete());
                            this.mousePosition = event.get_coords();
                        }
                    };
                } else if ($.versionCompare($.CINNAMON_VERSION, "3.2.0") >= 0) {
                    STG.TTP._onMotionEvent = Tooltips.TooltipBase._onMotionEvent;
                    Tooltips.TooltipBase.prototype["_onMotionEvent"] = function(actor, event) {
                        if (this._showTimer) {
                            Mainloop.source_remove(this._showTimer);
                            this._showTimer = null;
                        }

                        if (this._hideTimer) {
                            Mainloop.source_remove(this._hideTimer);
                            this._hideTimer = null;
                        }

                        if (!this.visible) {
                            this._showTimer = Mainloop.timeout_add(Settings.tooltips_delay,
                                () => this._onShowTimerComplete());
                            this.mousePosition = event.get_coords();
                        } else {
                            this._hideTimer = Mainloop.timeout_add(500,
                                () => this._onHideTimerComplete());
                        }
                    };

                    STG.TTP._onEnterEvent = Tooltips.TooltipBase._onEnterEvent;
                    Tooltips.TooltipBase.prototype["_onEnterEvent"] = function(actor, event) {
                        if (!this._showTimer) {
                            this._showTimer = Mainloop.timeout_add(Settings.tooltips_delay,
                                () => this._onShowTimerComplete());
                            this.mousePosition = event.get_coords();
                        }
                    };
                }
            }
        }

        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Settings.tooltips_alignment) {
            if (this.shouldEnable("positioning")) {
                this.desktop_settings = new Gio.Settings({
                    schema_id: "org.cinnamon.desktop.interface"
                });

                STG.TTP.show = Tooltips.Tooltip.show;
                Tooltips.Tooltip.prototype["show"] = function() {
                    if (this._tooltip.get_text() === "" || !this.mousePosition) {
                        return;
                    }

                    let tooltipWidth = this._tooltip.get_allocation_box().x2 -
                        this._tooltip.get_allocation_box().x1;

                    let monitor = Main.layoutManager.findMonitorForActor(this.item);

                    let cursorSize = CT_TooltipsPatch.desktop_settings.get_int("cursor-size");
                    let tooltipTop = this.mousePosition[1] + (cursorSize / 1.5);
                    let tooltipLeft = this.mousePosition[0] + (cursorSize / 2);

                    tooltipLeft = Math.max(tooltipLeft, monitor.x);
                    tooltipLeft = Math.min(tooltipLeft, monitor.x + monitor.width - tooltipWidth);

                    this._tooltip.set_position(tooltipLeft, tooltipTop);

                    this._tooltip.show();
                    this._tooltip.raise_top();
                    this.visible = true;
                };
            } else {
                Settings.tooltips_alignment = false;
                $.dealWithRejection(_("Avoid mouse pointer overlapping tooltips"));
            }
        }
    },

    disable: function() {
        if (STG.TTP._onMotionEvent) {
            Tooltips.TooltipBase.prototype["_onMotionEvent"] = STG.TTP._onMotionEvent;
            delete STG.TTP._onMotionEvent;
        }

        if (STG.TTP._onEnterEvent) {
            Tooltips.Tooltip.prototype["_onEnterEvent"] = STG.TTP._onEnterEvent;
            delete STG.TTP._onEnterEvent;
        }

        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (STG.TTP.show) {
            Tooltips.Tooltip.prototype["show"] = STG.TTP.show;
            delete STG.TTP.show;
        }
    },

    toggle: function() {
        togglePatch(CT_TooltipsPatch, "TTP", Settings.tooltips_tweaks_enabled);
    },

    shouldEnable: function(aTweak) {
        switch (aTweak) {
            case "delay":
                return true;
            case "positioning":
                return $.versionCompare($.CINNAMON_VERSION, "3.0.7") <= 0;
        }
        return false;
    }
};

const CT_PopupMenuManagerPatch = {
    enable: function() {

        if (Settings.popup_menu_manager_applets_menus_behavior !== "default") {
            STG.PPMM._onEventCapture = PopupMenu.PopupMenuManager.prototype["_onEventCapture"];
            PopupMenu.PopupMenuManager.prototype["_onEventCapture"] = function(actor, event) {
                if (!this.grabbed) {
                    return false;
                }

                if (Main.keyboard.shouldTakeEvent(event)) {
                    return Clutter.EVENT_PROPAGATE;
                }

                if (this._owner.menuEventFilter &&
                    this._owner.menuEventFilter(event)) {
                    return true;
                }

                if (this._activeMenu !== null && this._activeMenu.passEvents) {
                    return false;
                }

                if (this._didPop) {
                    this._didPop = false;
                    return true;
                }

                let activeMenuContains = this._eventIsOnActiveMenu(event);
                let eventType = event.type();

                if (eventType == Clutter.EventType.BUTTON_RELEASE) {
                    if (activeMenuContains) {
                        return false;
                    } else {
                        this._closeMenu();
                        return false;
                    }
                } else if (eventType == Clutter.EventType.BUTTON_PRESS && !activeMenuContains) {
                    this._closeMenu();
                    return false;
                } else if (!this._shouldBlockEvent(event)) {
                    return false;
                }

                return false;
            };
        }
    },

    disable: function() {
        if (STG.PPMM._onEventCapture) {
            PopupMenu.PopupMenuManager.prototype["_onEventCapture"] = STG.PPMM._onEventCapture;
            delete STG.PPMM._onEventCapture;
        }
    },

    toggle: function() {
        togglePatch(CT_PopupMenuManagerPatch, "PPMM", Settings.popup_menu_manager_tweaks_enabled);
    }
};

const CT_DropToDesktopPatch = {
    enable: function() {
        if (!Main.layoutManager.CT_DropToDesktopPatch_desktop &&
            Settings.desktop_tweaks_allow_drop_to_desktop) {
            Main.layoutManager.CT_DropToDesktopPatch_desktop = new $.CT_NemoDesktopArea();
        }
    },

    disable: function() {
        if (Main.layoutManager.CT_DropToDesktopPatch_desktop) {
            delete Main.layoutManager.CT_DropToDesktopPatch_desktop;
        }
    },

    toggle: function() {
        togglePatch(CT_DropToDesktopPatch, "DTD", Settings.desktop_tweaks_enabled);
    }
};

const CT_CustomWindowShadows = {
    enable: function() {
        this.activate_preset(Settings.window_shadows_preset);
    },

    disable: function() {
        this.activate_preset("default");
    },

    toggle: function() {
        togglePatch(CT_CustomWindowShadows, "CWS", Settings.window_shadows_tweaks_enabled);
    },

    create_params: function(r) {
        return new Meta.ShadowParams({
            "radius": r[0],
            "top_fade": r[1],
            "x_offset": r[2],
            "y_offset": r[3],
            "opacity": r[4]
        });
    },

    activate_preset: function(aPreset) {
        let presets = $.SHADOW_VALUES;

        try {
            if (aPreset === "custom") {
                let customPreset = Settings.window_shadows_custom_preset;

                if (customPreset === "") {
                    Settings.window_shadows_custom_preset = JSON.stringify(presets.default);
                    customPreset = presets.default;
                }

                presets["custom"] = typeof customPreset === "string" ?
                    JSON.parse(customPreset) :
                    customPreset;
            }
        } catch (aErr) {
            global.logError(aErr);
        } finally {
            if (aPreset in presets) {
                let focused = presets[aPreset].focused;
                let unfocused = presets[aPreset].unfocused;

                for (let record in focused) {
                    ShadowFactory.set_params(record, true, this.create_params(focused[record]));
                }

                for (let record in unfocused) {
                    ShadowFactory.set_params(record, false, this.create_params(unfocused[record]));
                }
            }
        }
    }
};

const CT_AutoMoveWindows = {
    _trackerExists: true,
    _winMover: false,
    enable: function() {
        try {
            if (!Main.wm._workspaceTracker) {
                this._trackerExists = false;
                Main.wm._workspaceTracker = new WorkspaceTracker.WorkspaceTracker();
            }
        } finally {
            try {
                STG.AMW._checkWorkspaces = Main.wm._workspaceTracker._checkWorkspaces;
                Main.wm._workspaceTracker._checkWorkspaces = $.CT_MyCheckWorkspaces;

                this._winMover = new $.CT_WindowMover(Settings);
            } catch (aErr) {
                global.logError(aErr);
            }
        }
    },

    disable: function() {
        if (this._winMover) {
            this._winMover.destroy();
        }

        if (STG.AMW._checkWorkspaces) {
            Main.wm._workspaceTracker._checkWorkspaces = STG.AMW._checkWorkspaces;
            delete STG.AMW._checkWorkspaces;
        }

        if (!this._trackerExists) {
            delete Main.wm._workspaceTracker;
        }
    },

    toggle: function() {
        togglePatch(CT_AutoMoveWindows, "AMW", Settings.window_auto_move_tweaks_enabled);
    }
};

const CT_MaximusNG = {
    maximus: null,

    enable: function() {
        this.maximus = new $.CT_MaximusNG();
        this.maximus.startUndecorating();
    },

    disable: function() {
        if (this.maximus) {
            this.maximus.stopUndecorating();
            this.maximus = null;
        }
    },

    toggle: function() {
        togglePatch(CT_MaximusNG, "MAXNG", Settings.maximus_enable_tweak);
    }
};

// Patch template

/*
const CT_Patch = {
    enable: function() {
        //
    },

    disable: function() {
        //
    },

    toggle: function() {
        togglePatch(CT_Patch, "Key from CONNECTION_IDS object", Settings.pref_that_enables_tweak);
    }
};
 */

// Called when extension is loaded
function init(aXletMeta) {
    xletMeta = aXletMeta;

    try {
        allowEnabling = $.versionCompare($.CINNAMON_VERSION, "2.8.6") >= 0;
    } catch (aErr) {
        global.logError(aErr.message);
        allowEnabling = false;
    }

    if (allowEnabling) {
        _bindSettings();
    }
}

// Called when extension is loaded
function enable() {
    // DO NOT allow to enable extension if it isn't installed on a proper Cinnamon version.
    if (allowEnabling) {
        try {
            if (Settings.applets_tweaks_enabled) {
                try {
                    if (!AppletManager) {
                        AppletManager = imports.ui.appletManager;
                    }
                } finally {
                    CT_AppletManagerPatch.enable();
                }
            }
        } catch (aErr) {
            global.logError(aErr.message);
        }

        try {
            if (Settings.desklets_tweaks_enabled) {
                try {
                    if (!DeskletManager) {
                        DeskletManager = imports.ui.deskletManager;
                    }
                } finally {
                    CT_DeskletManagerPatch.enable();
                }
            }
        } catch (aErr) {
            global.logError(aErr.message);
        }

        try {
            if (Settings.notifications_enable_tweaks) {
                CT_MessageTrayPatch.enable();
            }
        } catch (aErr) {
            global.logError(aErr.message);
        }

        try {
            if (Settings.win_demands_attention_activation_mode !== "none") {
                CT_WindowDemandsAttentionBehavior.enable();
            }
        } catch (aErr) {
            global.logError(aErr.message);
        }

        // Mark for deletion on EOL. Cinnamon 3.2.x+
        try {
            if (Settings.hotcorners_tweaks_enabled) {
                try {
                    // Mark for deletion on EOL. Cinnamon 3.6.x+
                    try {
                        HotCornerPatched = require("./extra_modules/hotCornerPatched.js");
                    } catch (aErr) {
                        HotCornerPatched = imports.extension.extra_modules.hotCornerPatched;
                    }
                } finally {
                    CT_HotCornersPatch.enable();
                }
            }
        } catch (aErr) {
            global.logError(aErr.message);
        }

        try {
            if (Settings.tooltips_tweaks_enabled) {
                CT_TooltipsPatch.enable();
            }
        } catch (aErr) {
            global.logError(aErr.message);
        }

        try {
            if (Settings.popup_menu_manager_tweaks_enabled) {
                CT_PopupMenuManagerPatch.enable();
            }
        } catch (aErr) {
            global.logError(aErr.message);
        }

        try {
            if (Settings.desktop_tweaks_enabled) {
                CT_DropToDesktopPatch.enable();
            }
        } catch (aErr) {
            global.logError(aErr.message);
        }

        try {
            if (Settings.window_shadows_tweaks_enabled) {
                try {
                    ShadowFactory = Meta.ShadowFactory.get_default();
                } finally {
                    CT_CustomWindowShadows.enable();
                }
            }
        } catch (aErr) {
            global.logError(aErr.message);
        }

        try {
            if (Settings.window_auto_move_tweaks_enabled) {
                try {
                    // Mark for deletion on EOL. Cinnamon 3.6.x+
                    try {
                        WorkspaceTracker = require("./extra_modules/WorkspaceTracker.js");
                    } catch (aErr) {
                        WorkspaceTracker = imports.extension.extra_modules.WorkspaceTracker;
                    }
                } finally {
                    CT_AutoMoveWindows.enable();
                }
            }
        } catch (aErr) {
            global.logError(aErr.message);
        }

        try {
            if (Settings.maximus_enable_tweak) {
                CT_MaximusNG.enable();
            }
        } catch (aErr) {
            global.logError(aErr.message);
        }

        if (!Settings.initial_load) {
            let msg = [
                _("If you updated this extension from an older version, <b>you must check its settings window</b>."),
                _("Some preferences may have been changed to their default values."),
                _("This message will not be displayed again.")
            ];
            let icon = new St.Icon({
                icon_name: "dialog-warning",
                icon_type: St.IconType.FULLCOLOR,
                icon_size: 48
            });
            Mainloop.timeout_add(5000, () => {
                Main.criticalNotify(
                    _(xletMeta.name),
                    msg.join(" "),
                    icon
                );
                Settings.initial_load = true;
            });
        }
    } else {
        disconnectAllSettings();

        $.informAndDisable();
    }
}

// Called when extension gets disabled
function disable() {
    disconnectAllSettings();

    let patches = [
        CT_AppletManagerPatch,
        CT_DeskletManagerPatch,
        CT_MessageTrayPatch,
        CT_WindowDemandsAttentionBehavior,
        CT_HotCornersPatch,
        CT_TooltipsPatch,
        CT_PopupMenuManagerPatch,
        CT_DropToDesktopPatch,
        CT_CustomWindowShadows,
        CT_AutoMoveWindows,
        CT_MaximusNG
    ];

    for (let i = patches.length - 1; i >= 0; i--) {
        try {
            patches[i].disable();
        } catch (aErr) {
            continue;
        }
    }
}

/*
Notes:
- CT_HotCornersPatch marked for deletion on Cinnamon 2.8 (LM 17.3) end-of-life (EOL).
- CT_TooltipsPatch positioning/alignement: Same as CT_HotCornersPatch.
*/
