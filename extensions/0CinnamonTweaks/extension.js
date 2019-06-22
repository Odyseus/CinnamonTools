let cinnamonTweaks = null,
    XletMeta,
    _,
    $,
    G,
    D,
    C,
    CustomDialogs,
    CustomFileUtils,
    DesktopNotificationsUtils,
    Settings;

const {
    gi: {
        Clutter,
        Gio,
        GLib,
        Meta,
        St
    },
    mainloop: Mainloop,
    misc: {
        util: Util
    },
    ui: {
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

function togglePatch(aPatch, aID, aEnabledPref) {
    try {
        aPatch.disable();
        if (C.Connections[aID] > 0) {
            Mainloop.source_remove(C.Connections[aID]);
            C.Connections[aID] = 0;
        }

        if (!aEnabledPref) {
            return;
        }

        C.Connections[aID] = Mainloop.timeout_add(1000, () => {
            aPatch.enable();
            C.Connections[aID] = 0;
            return GLib.SOURCE_REMOVE;
        });
    } catch (aErr) {
        global.logError(aErr);
    }
}

const CT_AppletManagerPatch = {
    enable: function() {
        if (Settings.pref_applets_ask_confirmation_applet_removal) {
            let am = AppletManager;
            // Extracted from /usr/share/cinnamon/js/ui/appletManager.js
            // Patch Appletmanager._removeAppletFromPanel to ask for confirmation on applet removal.
            C.Injections.AMP._removeAppletFromPanel = G.overrideMethod(am, "_removeAppletFromPanel",
                function(uuid, applet_id) {
                    let removeApplet = () => {
                        // TODO: Check the exact Cinnamon version in which this function was changed. ¬¬
                        // Mark for deletion on EOL. Cinnamon 3.6.x+
                        if (G.versionCompare(G.CINNAMON_VERSION, "3.6.4") >= 0) {
                            // WARNING: This is an object: {key:value}
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
                                    if (uuid === appletDefinition.uuid && applet_id === appletDefinition.applet_id) {
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
                        let dialog = new CustomDialogs.ConfirmDialog({
                            dialogName: "CinnamonTweaksAppletRemoval",
                            headline: _("Applet removal"),
                            description: _("Are you sure you want to remove %s?").format(
                                AppletManager.get_object_for_uuid(uuid, applet_id)._meta.name
                            ) + "\n%s: %s".format(_("Instance ID"), applet_id),
                            cancelLabel: _("Cancel"),
                            okLabel: _("OK"),
                            callback: () => {
                                removeApplet();
                            }
                        });
                        dialog.open();
                    }
                }
            );
        }
    },

    disable: function() {
        G.removeOverride(AppletManager, C.Injections.AMP, "_removeAppletFromPanel");
    },

    toggle: function() {
        togglePatch(CT_AppletManagerPatch, "AMP", Settings.pref_applets_tweaks_enabled);
    }
};

const CT_DeskletManagerPatch = {
    enable: function() {
        if (Settings.pref_desklets_ask_confirmation_desklet_removal) {
            let dm = DeskletManager;

            // Extracted from /usr/share/cinnamon/js/ui/deskletManager.js
            // Patch DeskletManager.removeDesklet to ask for confirmation on desklet removal.
            C.Injections.DMP.removeDesklet = G.overrideMethod(dm, "removeDesklet",
                function(uuid, desklet_id) {
                    let ENABLED_DESKLETS_KEY = "enabled-desklets";
                    let removeDesklet = () => {
                        try {
                            let list = global.settings.get_strv(ENABLED_DESKLETS_KEY);
                            for (let i = 0; i < list.length; i++) {
                                let definition = list[i];
                                let elements = definition.split(":");
                                if (uuid === elements[0] && desklet_id === elements[1]) {
                                    list.splice(i, 1);
                                }
                            }
                            global.settings.set_strv(ENABLED_DESKLETS_KEY, list);
                        } catch (aErr) {
                            global.logError(aErr);
                        }
                    };
                    let ctrlKey = Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2];

                    if (ctrlKey) {
                        removeDesklet();
                    } else {
                        let dialog = new CustomDialogs.ConfirmDialog({
                            dialogName: "CinnamonTweaksDeskletRemoval",
                            headline: _("Desklet removal"),
                            description: _("Are you sure you want to remove %s?").format(
                                DeskletManager.get_object_for_uuid(uuid, desklet_id)._meta.name
                            ) + "\n%s: %s".format(_("Instance ID"), desklet_id),
                            cancelLabel: _("Cancel"),
                            okLabel: _("OK"),
                            callback: () => {
                                removeDesklet();
                            }
                        });
                        dialog.open();
                    }
                }
            );
        }
    },

    disable: function() {
        G.removeOverride(DeskletManager, C.Injections.DMP, "removeDesklet");
    },

    toggle: function() {
        togglePatch(CT_DeskletManagerPatch, "DMP", Settings.pref_desklets_tweaks_enabled);
    }
};

const CT_MessageTrayPatch = {
    enable: function() {
        let mt = Main.messageTray;
        let bottomPosition = Settings.pref_notifications_position === "bottom";
        let ANIMATION_TIME = Settings.pref_notifications_enable_animation ? 0.2 : 0.001;
        // Cinnamon versions prior to 3.2.x uses true/flase to get top/bottom panel.
        // Newer versions use numbers to identify all four possible panels.
        let boolPanel = G.versionCompare(G.CINNAMON_VERSION, "3.2.0") <= 0;
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
            return Number(Settings.pref_notifications_distance_from_panel);
        };

        // Notifications on Cinnamon 3.6.x already have close buttons.
        // Mark for deletion on EOL. Cinnamon 3.6.x+
        if (G.versionCompare(G.CINNAMON_VERSION, "3.6.4") <= 0 &&
            Settings.pref_notifications_enable_close_button) {
            // Needed to "accommodate" the close button.
            // The only difference is in the col_span property when setting a child.
            // Up until now, it's retro-compatible enough.
            C.Injections.MTP._updateLastColumnSettings = G.overrideMethod(mt, "_updateLastColumnSettings",
                function() {
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
                }
            );
        }

        // Extracted from /usr/share/cinnamon/js/ui/messageTray.js
        // Patch _hideNotification to allow correct animation.
        C.Injections.MTP._hideNotification = G.overrideMethod(mt, "_hideNotification",
            function() {
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
            }
        );

        // Patch _showNotification to allow correct animation and custom right margin.
        C.Injections.MTP._showNotification = G.overrideMethod(mt, "_showNotification",
            function() {
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
                let rightGap = Number(Settings.pref_notifications_right_margin);
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

                // I can neither override nor inject code into the Notification.prototype._init method.
                // So, I have to insert the close button "on-the-fly".
                // Mark for deletion on EOL. Cinnamon 3.6.x+
                if (G.versionCompare(G.CINNAMON_VERSION, "3.6.4") <= 0 &&
                    Settings.pref_notifications_enable_close_button) {
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
            }
        );

        // Patch _onNotificationExpanded to allow correct showing animation and custom top/bottom margins.
        C.Injections.MTP._onNotificationExpanded = G.overrideMethod(mt, "_onNotificationExpanded",
            function() {
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
                } else if (this._notification.actor.y !== expandedY) {
                    this._tween(this._notificationBin, "_notificationState", State.SHOWN, {
                        y: newY,
                        opacity: 255,
                        time: ANIMATION_TIME,
                        transition: "easeOutQuad",
                        onComplete: this._showNotificationCompleted,
                        onCompleteScope: this
                    });
                }
            }
        );

        C.Injections.MTP._updateShowingNotification = G.overrideMethod(mt, "_updateShowingNotification",
            function() {
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
            }
        );
    },

    disable: function() {
        G.removeOverride(Main.messageTray, C.Injections.MTP, "_updateLastColumnSettings");
        G.removeOverride(Main.messageTray, C.Injections.MTP, "_hideNotification");
        G.removeOverride(Main.messageTray, C.Injections.MTP, "_showNotification");
        G.removeOverride(Main.messageTray, C.Injections.MTP, "_onNotificationExpanded");
        G.removeOverride(Main.messageTray, C.Injections.MTP, "_updateShowingNotification");
    },

    toggle: function() {
        togglePatch(CT_MessageTrayPatch, "MTP", Settings.pref_notifications_enable_tweaks);
    }
};

const CT_WindowDemandsAttentionBehavior = {
    enable: function() {
        try {
            if (C.Connections.WDAE_EXEC > 0) {
                this.disable();
            }
        } finally {
            C.Connections.WDAE_EXEC = new $.WindowDemandsAttention();
            C.Connections.WDAE_EXEC.enable();
        }
    },

    disable: function() {
        if (C.Connections.WDAE_EXEC > 0) {
            C.Connections.WDAE_EXEC._destroy();
            C.Connections.WDAE_EXEC = 0;
        }
    },

    toggle: function() {
        togglePatch(CT_WindowDemandsAttentionBehavior,
            "WDAE",
            Settings.pref_windows_focus_enable_tweaks &&
            Settings.pref_win_demands_attention_activation_mode !== "none");
    }
};

// Mark for deletion on EOL. Cinnamon 3.2.x+
const CT_HotCornersPatch = {
    _overview_corner_changed_id: 0,

    enable: function() {
        if (this.shouldEnable()) {
            C.Injections.HCP = Main.layoutManager.hotCornerManager;
            delete Main.layoutManager.hotCornerManager;
            Main.layoutManager.hotCornerManager = new HotCornerPatched.HotCornerManager({
                0: Settings.pref_hotcorners_delay_top_left,
                1: Settings.pref_hotcorners_delay_top_right,
                2: Settings.pref_hotcorners_delay_bottom_left,
                3: Settings.pref_hotcorners_delay_bottom_right
            });
            Main.layoutManager._updateHotCorners();
            this._overview_corner_changed_id = global.settings.connect("changed::overview-corner", () => this.toggle());
        } else {
            $.dealWithRejection(_("Hotcorners tweaks"));
        }
    },

    disable: function() {
        if (C.Injections.HCP) {
            Main.layoutManager.hotCornerManager = C.Injections.HCP;
            C.Injections.HCP = null;
        }

        if (this._overview_corner_changed_id > 0) {
            global.settings.disconnect(this._overview_corner_changed_id);
        }
    },

    toggle: function() {
        togglePatch(CT_HotCornersPatch, "HCP", Settings.pref_hotcorners_tweaks_enabled);
    },

    shouldEnable: function() {
        return G.versionCompare(G.CINNAMON_VERSION, "3.0.99") <= 0;
    }
};

const CT_TooltipsPatch = {
    enable: function() {
        if (Settings.pref_tooltips_delay !== 300) {
            if (G.versionCompare(G.CINNAMON_VERSION, "3.0.99") <= 0) {
                C.Injections.TTP._onMotionEvent = G.overrideMethod(Tooltips.TooltipBase.prototype, "_onMotionEvent",
                    function(actor, event) {
                        if (this._showTimer) {
                            Mainloop.source_remove(this._showTimer);
                            this._showTimer = null;
                        }

                        if (!this.visible) {
                            this._showTimer = Mainloop.timeout_add(Settings.pref_tooltips_delay,
                                () => this._onTimerComplete());
                            this.mousePosition = event.get_coords();
                        }
                    }
                );

                C.Injections.TTP._onEnterEvent = G.overrideMethod(Tooltips.TooltipBase.prototype, "_onEnterEvent",
                    function(actor, event) {
                        if (!this._showTimer) {
                            this._showTimer = Mainloop.timeout_add(Settings.pref_tooltips_delay,
                                () => this._onTimerComplete());
                            this.mousePosition = event.get_coords();
                        }
                    }
                );
            } else if (G.versionCompare(G.CINNAMON_VERSION, "3.2.0") >= 0) {
                C.Injections.TTP._onMotionEvent = G.overrideMethod(Tooltips.TooltipBase.prototype, "_onMotionEvent",
                    function(actor, event) {
                        if (this._showTimer) {
                            Mainloop.source_remove(this._showTimer);
                            this._showTimer = null;
                        }

                        if (this._hideTimer) {
                            Mainloop.source_remove(this._hideTimer);
                            this._hideTimer = null;
                        }

                        if (!this.visible) {
                            this._showTimer = Mainloop.timeout_add(Settings.pref_tooltips_delay,
                                () => this._onShowTimerComplete());
                            this.mousePosition = event.get_coords();
                        } else {
                            this._hideTimer = Mainloop.timeout_add(500,
                                () => this._onHideTimerComplete());
                        }
                    }
                );

                C.Injections.TTP._onEnterEvent = G.overrideMethod(Tooltips.TooltipBase.prototype, "_onEnterEvent",
                    function(actor, event) {
                        if (!this._showTimer) {
                            this._showTimer = Mainloop.timeout_add(Settings.pref_tooltips_delay,
                                () => this._onShowTimerComplete());
                            this.mousePosition = event.get_coords();
                        }
                    }
                );
            }
        }

        if (Settings.pref_tooltips_inteligent_positioning ||
            Settings.pref_tooltips_never_centered ||
            Settings.pref_tooltips_half_monitor_width) {
            this.desktop_settings = new Gio.Settings({
                schema_id: "org.cinnamon.desktop.interface"
            });

            C.Injections.TTP.show = G.overrideMethod(Tooltips.Tooltip.prototype, "show",
                function() {
                    if (this._tooltip.get_text() == "" || !this.mousePosition) {
                        return;
                    }

                    let tooltipWidth = this._tooltip.get_allocation_box().x2 - this._tooltip.get_allocation_box().x1;
                    let tooltipHeight = this._tooltip.get_allocation_box().y2 - this._tooltip.get_allocation_box().y1;

                    let monitor = Main.layoutManager.findMonitorForActor(this.item);

                    let cursorSize = CT_TooltipsPatch.desktop_settings.get_int("cursor-size");
                    let tooltipTop = this.mousePosition[1] + Math.round(cursorSize / 1.5);
                    let tooltipLeft = this.mousePosition[0] + Math.round(cursorSize / 2);
                    tooltipLeft = Math.max(tooltipLeft, monitor.x);
                    tooltipLeft = Math.min(tooltipLeft, monitor.x + monitor.width - tooltipWidth);

                    if (Settings.pref_tooltips_inteligent_positioning &&
                        (tooltipTop + tooltipHeight > monitor.height)) {
                        tooltipTop = tooltipTop - tooltipHeight - Math.round(cursorSize);
                    }

                    this._tooltip.set_position(tooltipLeft, tooltipTop);

                    if (Settings.pref_tooltips_never_centered ||
                        Settings.pref_tooltips_half_monitor_width) {
                        let style = "";

                        // Align to right or left depending on default direction.
                        if (Settings.pref_tooltips_never_centered) {
                            let rtl = (St.Widget.get_default_direction() === St.TextDirection.RTL);
                            style += "text-align: %s;".format(rtl ? "right" : "left");
                        }

                        // Set max. width of tooltip to half the width of the monitor.
                        if (Settings.pref_tooltips_half_monitor_width) {
                            style += "max-width: %spx;".format(String(Math.round(Number(monitor.width) / 2)));
                        }

                        this._tooltip.set_style(style);
                    }

                    this._tooltip.show();
                    this._tooltip.raise_top();
                    this.visible = true;
                }
            );
        }
    },

    disable: function() {
        G.removeOverride(Tooltips.TooltipBase.prototype, C.Injections.TTP, "_onMotionEvent");
        G.removeOverride(Tooltips.Tooltip.prototype, C.Injections.TTP, "_onEnterEvent");
        G.removeOverride(Tooltips.Tooltip.prototype, C.Injections.TTP, "show");
    },

    toggle: function() {
        togglePatch(CT_TooltipsPatch, "TTP", Settings.pref_tooltips_tweaks_enabled);
    }
};

const CT_PopupMenuManagerPatch = {
    enable: function() {

        if (Settings.pref_popup_menu_manager_applets_menus_behavior !== "default") {
            C.Injections.PPMM._onEventCapture = G.overrideMethod(PopupMenu.PopupMenuManager.prototype, "_onEventCapture",
                function(actor, event) {
                    if (!this.grabbed) {
                        return Clutter.EVENT_PROPAGATE;
                    }

                    if (Main.keyboard.shouldTakeEvent(event)) {
                        return Clutter.EVENT_PROPAGATE;
                    }

                    if (this._owner.menuEventFilter &&
                        this._owner.menuEventFilter(event)) {
                        return Clutter.EVENT_STOP;
                    }

                    if (this._activeMenu !== null && this._activeMenu.passEvents) {
                        return Clutter.EVENT_PROPAGATE;
                    }

                    if (this._didPop) {
                        this._didPop = false;
                        return Clutter.EVENT_STOP;
                    }

                    let activeMenuContains = this._eventIsOnActiveMenu(event);
                    let eventType = event.type();

                    if (eventType === Clutter.EventType.BUTTON_RELEASE) {
                        if (activeMenuContains) {
                            return Clutter.EVENT_PROPAGATE;
                        } else {
                            this._closeMenu();
                            return Clutter.EVENT_PROPAGATE;
                        }
                    } else if (eventType === Clutter.EventType.BUTTON_PRESS && !activeMenuContains) {
                        this._closeMenu();
                        return Clutter.EVENT_PROPAGATE;
                    } else if (!this._shouldBlockEvent(event)) {
                        return Clutter.EVENT_PROPAGATE;
                    }

                    return Clutter.EVENT_PROPAGATE;
                }
            );
        }
    },

    disable: function() {
        G.removeOverride(PopupMenu.PopupMenuManager.prototype, C.Injections.PPMM, "_onEventCapture");
    },

    toggle: function() {
        togglePatch(CT_PopupMenuManagerPatch, "PPMM", Settings.pref_popup_menu_manager_tweaks_enabled);
    }
};

const CT_DropToDesktopPatch = {
    enable: function() {
        if (Settings.pref_desktop_tweaks_allow_drop_to_desktop &&
            !Main.layoutManager.hasOwnProperty("__CT_DropToDesktopPatch_desktop")) {
            Main.layoutManager.__CT_DropToDesktopPatch_desktop = new $.CT_NemoDesktopArea();
        }
    },

    disable: function() {
        if (Main.layoutManager.__CT_DropToDesktopPatch_desktop) {
            delete Main.layoutManager.__CT_DropToDesktopPatch_desktop;
        }
    },

    toggle: function() {
        togglePatch(CT_DropToDesktopPatch, "DTD", Settings.pref_desktop_tweaks_enabled);
    }
};

const CT_CustomWindowShadows = {
    enable: function() {
        this.activate_preset(Settings.pref_window_shadows_preset);
    },

    disable: function() {
        this.activate_preset("default");
    },

    toggle: function() {
        togglePatch(CT_CustomWindowShadows, "CWS", Settings.pref_window_shadows_tweaks_enabled);
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

    get_custom_preset: function() {
        let preset = {
            focused: {},
            unfocused: {}
        };
        /* NOTE: DO NOT replace JSON trick with Object.assign().
         * The JSON trick eradicates functions. Object.assign() don't.
         */
        let settingPreset = JSON.parse(JSON.stringify(Settings.pref_window_shadows_custom_preset));
        let i = settingPreset.length;
        while (i--) {
            let [state, type] = settingPreset[i].win_type.split(/_(.+)/);
            preset[state === "u" ?
                "unfocused" :
                "focused"][type] = [
                settingPreset[i].radius,
                settingPreset[i].top_fade,
                settingPreset[i].x_offset,
                settingPreset[i].y_offset,
                settingPreset[i].opacity
            ];
        }

        return preset;
    },

    activate_preset: function(aPreset) {
        // Mark for deletion on EOL. Cinnamon 3.6.x+
        // Replace JSON trick with Object.assign().
        let presets = JSON.parse(JSON.stringify(C.ShadowValues));

        try {
            if (aPreset === "custom") {
                presets["custom"] = this.get_custom_preset();
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
    _winMover: null,
    enable: function() {
        try {
            if (!Main.wm.hasOwnProperty("__CT_workspaceTracker")) {
                Main.wm.__CT_workspaceTracker = new WorkspaceTracker.WorkspaceTracker(Main.wm);
            }
        } finally {
            try {
                this._winMover = new $.CT_WindowMover();
            } catch (aErr) {
                global.logError(aErr);
            }
        }
    },

    disable: function() {
        if (this._winMover) {
            this._winMover.destroy();
        }

        if (Main.wm.hasOwnProperty("__CT_workspaceTracker")) {
            delete Main.wm.__CT_workspaceTracker;
        }
    },

    toggle: function() {
        togglePatch(CT_AutoMoveWindows, "AMW", Settings.pref_window_auto_move_tweaks_enabled);
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
        togglePatch(CT_MaximusNG, "MAXNG", Settings.pref_maximus_enable_tweak);
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
        togglePatch(CT_Patch, "Key from C.Connections object", Settings.pref_pref_that_enables_tweak);
    }
};
 */

function CinnamonTweaks() {
    this._init.apply(this, arguments);
}

CinnamonTweaks.prototype = {
    _init: function() {
        this._allowEnable = G.versionCompare(G.CINNAMON_VERSION, "3.0.0") >= 0;
        this._settingsDesktopFileName = "org.Cinnamon.Extensions.CinnamonTweaks.Settings";
        this._settingsDesktopFilePath = GLib.get_home_dir() +
            "/.local/share/applications/%s.desktop".format(this._settingsDesktopFileName);
    },

    enable: function() {
        if (!this._allowEnable) {
            $.informAndDisable();
            return false;
        }

        if (Settings.pref_applets_tweaks_enabled) {
            try {
                if (!AppletManager) {
                    AppletManager = imports.ui.appletManager;
                }
            } finally {
                CT_AppletManagerPatch.enable();
            }
        }

        if (Settings.pref_desklets_tweaks_enabled) {
            try {
                if (!DeskletManager) {
                    DeskletManager = imports.ui.deskletManager;
                }
            } finally {
                CT_DeskletManagerPatch.enable();
            }
        }

        if (Settings.pref_notifications_enable_tweaks) {
            CT_MessageTrayPatch.enable();
        }

        if (Settings.pref_windows_focus_enable_tweaks &&
            Settings.pref_win_demands_attention_activation_mode !== "none") {
            CT_WindowDemandsAttentionBehavior.enable();
        }

        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Settings.pref_hotcorners_tweaks_enabled) {
            try {
                // Mark for deletion on EOL. Cinnamon 3.6.x+
                if (typeof require === "function") {
                    HotCornerPatched = require("./extra_modules/hotCornerPatched.js");
                } else {
                    HotCornerPatched = imports.ui.extensionSystem.extensions["{{UUID}}"].extra_modules.hotCornerPatched;
                }
            } finally {
                CT_HotCornersPatch.enable();
            }
        }

        if (Settings.pref_tooltips_tweaks_enabled) {
            CT_TooltipsPatch.enable();
        }

        if (Settings.pref_popup_menu_manager_tweaks_enabled) {
            CT_PopupMenuManagerPatch.enable();
        }

        if (Settings.pref_desktop_tweaks_enabled) {
            CT_DropToDesktopPatch.enable();
        }

        if (Settings.pref_window_shadows_tweaks_enabled) {
            try {
                ShadowFactory = Meta.ShadowFactory.get_default();
            } finally {
                CT_CustomWindowShadows.enable();
            }
        }

        if (Settings.pref_window_auto_move_tweaks_enabled) {
            try {
                // Mark for deletion on EOL. Cinnamon 3.6.x+
                if (typeof require === "function") {
                    WorkspaceTracker = require("./extra_modules/WorkspaceTracker.js");
                } else {
                    WorkspaceTracker = imports.ui.extensionSystem.extensions["{{UUID}}"].extra_modules.WorkspaceTracker;
                }
            } finally {
                CT_AutoMoveWindows.enable();
            }
        }

        if (Settings.pref_maximus_enable_tweak) {
            CT_MaximusNG.enable();
        }

        if (!Settings.pref_initial_load) {
            let msg = [
                G.escapeHTML(_("If you updated this extension from an older version, you must check its settings window.")),
                G.escapeHTML(_("Some preferences may have been changed to their default values.")),
                G.escapeHTML(_("This message will not be displayed again."))
            ];

            Mainloop.timeout_add(5000, () => {
                $.Notification.notify(
                    msg,
                    DesktopNotificationsUtils.NotificationUrgency.CRITICAL
                );
                Settings.pref_initial_load = true;

                return GLib.SOURCE_REMOVE;
            });
        }

        this._generateSettingsDesktopFile();
        this._bindSettings();

        return true;
    },

    disable: function() {
        this._removeSettingsDesktopFile();

        let patches = [
            CT_AppletManagerPatch,
            CT_AutoMoveWindows,
            CT_CustomWindowShadows,
            CT_DeskletManagerPatch,
            CT_DropToDesktopPatch,
            CT_HotCornersPatch,
            CT_MaximusNG,
            CT_MessageTrayPatch,
            CT_PopupMenuManagerPatch,
            CT_TooltipsPatch,
            CT_WindowDemandsAttentionBehavior
        ];

        for (let i = patches.length - 1; i >= 0; i--) {
            try {
                patches[i].disable();
            } catch (aErr) {
                continue;
            }
        }

        Settings.destroy();
    },

    _bindSettings: function() {
        Settings.connect([
            "pref_daltonizer_wizard_kb",
            "pref_desktop_tweaks_enabled",
            "pref_desktop_tweaks_allow_drop_to_desktop",
            "pref_tooltips_tweaks_enabled",
            "pref_tooltips_inteligent_positioning",
            "pref_tooltips_never_centered",
            "pref_tooltips_half_monitor_width",
            "pref_tooltips_delay",
            "pref_popup_menu_manager_tweaks_enabled",
            "pref_popup_menu_manager_applets_menus_behavior",
            "pref_applets_tweaks_enabled",
            "pref_applets_ask_confirmation_applet_removal",
            "pref_desklets_tweaks_enabled",
            "pref_desklets_ask_confirmation_desklet_removal",
            "pref_notifications_enable_tweaks",
            "pref_notifications_enable_animation",
            "pref_notifications_enable_close_button",
            "pref_notifications_position",
            "pref_notifications_distance_from_panel",
            "pref_notifications_right_margin",
            "pref_windows_focus_enable_tweaks",
            "pref_win_demands_attention_activation_mode",
            "pref_win_demands_attention_keyboard_shortcut",
            "pref_hotcorners_tweaks_enabled",
            "pref_hotcorners_delay_top_left",
            "pref_hotcorners_delay_top_right",
            "pref_hotcorners_delay_bottom_left",
            "pref_hotcorners_delay_bottom_right",
            "pref_window_shadows_tweaks_enabled",
            "pref_window_shadows_preset",
            "trigger_window_shadows_custom_preset",
            "pref_window_auto_move_tweaks_enabled",
            "pref_maximus_apply_settings",
            "pref_test_notifications"
        ], function(aPrefKey) {
            this._onSettingsChanged(aPrefKey);
        }.bind(this));
    },

    openExtensionSettings: function() {
        Util.spawn_async([XletMeta.path + "/settings.py"], null);
    },

    _generateSettingsDesktopFile: function() {
        if (G.versionCompare(G.CINNAMON_VERSION, "3.6.0") < 0 &&
            !Settings.pref_desktop_file_generated) {
            CustomFileUtils.generateDesktopFile({
                fileName: this._settingsDesktopFileName,
                dataName: _(XletMeta.name),
                dataComment: _("Settings for %s").format(_(XletMeta.name)),
                dataExec: XletMeta.path + "/settings.py",
                dataIcon: XletMeta.path + "/icon.svg"
            });

            $.Notification.notify([
                G.escapeHTML(_("A shortcut to open this extension settings has been generated.")),
                G.escapeHTML(_("Search for it on your applications menu.")),
                G.escapeHTML(_("Read this extension help page for more details."))
            ]);

            Settings.pref_desktop_file_generated = true;
        }
    },

    _removeSettingsDesktopFile: function() {
        try {
            let desktopFile = Gio.file_new_for_path(this._settingsDesktopFilePath);

            if (desktopFile.query_exists(null)) {
                desktopFile.delete_async(GLib.PRIORITY_LOW, null, null);
                Settings.pref_desktop_file_generated = false;
            }
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    _onSettingsChanged: function(aPrefKey) {
        switch (aPrefKey) {
            case "pref_daltonizer_wizard_kb":
            case "pref_desktop_tweaks_enabled":
            case "pref_desktop_tweaks_allow_drop_to_desktop":
            case "pref_tooltips_tweaks_enabled":
            case "pref_tooltips_inteligent_positioning":
            case "pref_tooltips_never_centered":
            case "pref_tooltips_half_monitor_width":
            case "pref_tooltips_delay":
            case "pref_popup_menu_manager_tweaks_enabled":
            case "pref_popup_menu_manager_applets_menus_behavior":
            case "pref_logging_level":
            case "pref_debugger_enabled":
                $.informCinnamonRestart();
                break;
            case "pref_applets_tweaks_enabled":
            case "pref_applets_ask_confirmation_applet_removal":
                try {
                    if (!AppletManager) {
                        AppletManager = imports.ui.appletManager;
                    }
                } finally {
                    CT_AppletManagerPatch.toggle();
                }
                break;
            case "pref_desklets_tweaks_enabled":
            case "pref_desklets_ask_confirmation_desklet_removal":
                try {
                    if (!DeskletManager) {
                        DeskletManager = imports.ui.deskletManager;
                    }
                } finally {
                    CT_DeskletManagerPatch.toggle();
                }
                break;
            case "pref_notifications_enable_tweaks":
            case "pref_notifications_enable_animation":
            case "pref_notifications_enable_close_button":
            case "pref_notifications_position":
            case "pref_notifications_distance_from_panel":
            case "pref_notifications_right_margin":
                CT_MessageTrayPatch.toggle();
                break;
            case "pref_windows_focus_enable_tweaks":
            case "pref_win_demands_attention_activation_mode":
            case "pref_win_demands_attention_keyboard_shortcut":
                CT_WindowDemandsAttentionBehavior.toggle();
                break;
            case "pref_hotcorners_tweaks_enabled":
            case "pref_hotcorners_delay_top_left":
            case "pref_hotcorners_delay_top_right":
            case "pref_hotcorners_delay_bottom_left":
            case "pref_hotcorners_delay_bottom_right":
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
                break;
            case "pref_window_shadows_tweaks_enabled":
            case "pref_window_shadows_preset":
            case "trigger_window_shadows_custom_preset":
                try {
                    if (!ShadowFactory) {
                        ShadowFactory = Meta.ShadowFactory.get_default();
                    }
                } finally {
                    CT_CustomWindowShadows.toggle();
                }
                break;
            case "pref_window_auto_move_tweaks_enabled":
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
                break;
            case "pref_maximus_apply_settings":
                CT_MaximusNG.toggle();
                break;
            case "pref_test_notifications":
                $.testNotifications();
                break;
        }
    }
};

function init(aXletMeta) {
    XletMeta = aXletMeta;

    /* NOTE: I have to initialize the modules and all its exported variables
     * at this stage because the stupid asynchronicity of newer versions of Cinnamon.
     * Since I'm using Cinnamon's native settings system declared and instantiated
     * in the constants.js module (so I can use it globally from all modules and without
     * the need to pass the settings object through a trillion other objects),
     * attempting to initialize the settings outside init() fails because the stupid
     * extension isn't loaded yet. ¬¬
     */

    // Mark for deletion on EOL. Cinnamon 3.6.x+
    if (typeof require === "function") {
        G = require("./globalUtils.js");
        D = require("./debugManager.js");
        C = require("./constants.js");
        $ = require("./utils.js");
        CustomDialogs = require("./customDialogs.js");
        CustomFileUtils = require("./customFileUtils.js");
        DesktopNotificationsUtils = require("./desktopNotificationsUtils.js");
    } else {
        G = imports.ui.extensionSystem.extensions["{{UUID}}"].globalUtils;
        D = imports.ui.extensionSystem.extensions["{{UUID}}"].debugManager;
        C = imports.ui.extensionSystem.extensions["{{UUID}}"].constants;
        $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
        CustomDialogs = imports.ui.extensionSystem.extensions["{{UUID}}"].customDialogs;
        CustomFileUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].customFileUtils;
        DesktopNotificationsUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].desktopNotificationsUtils;
    }

    _ = G._;
    Settings = C.Settings;

    D.wrapObjectMethods(Settings, {
        CinnamonTweaks: CinnamonTweaks,
        CT_AppletManagerPatch: CT_AppletManagerPatch,
        CT_AutoMoveWindows: CT_AutoMoveWindows,
        CT_CustomWindowShadows: CT_CustomWindowShadows,
        CT_DeskletManagerPatch: CT_DeskletManagerPatch,
        CT_DropToDesktopPatch: CT_DropToDesktopPatch,
        CT_HotCornersPatch: CT_HotCornersPatch,
        CT_MaximusNG: CT_MaximusNG,
        CT_MessageTrayPatch: CT_MessageTrayPatch,
        CT_PopupMenuManagerPatch: CT_PopupMenuManagerPatch,
        CT_TooltipsPatch: CT_TooltipsPatch,
        CT_WindowDemandsAttentionBehavior: CT_WindowDemandsAttentionBehavior
    });
}

function enable() {
    try {
        cinnamonTweaks = new CinnamonTweaks();

        Mainloop.idle_add(() => {
            cinnamonTweaks.enable();

            return GLib.SOURCE_REMOVE;
        });

        return {
            openSettings: cinnamonTweaks.openExtensionSettings
        };
    } catch (aErr) {
        global.logError(aErr);
    }

    return null;
}

function disable() {
    if (cinnamonTweaks !== null) {
        cinnamonTweaks.disable();
    }
}
