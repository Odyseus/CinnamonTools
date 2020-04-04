// {{IMPORTER}}

const GlobalUtils = __import("globalUtils.js");
const DesktopNotificationsUtils = __import("desktopNotificationsUtils.js");
const DebugManager = __import("debugManager.js");
const $ = __import("utils.js");

const {
    gi: {
        GLib,
        St
    },
    mainloop: Mainloop,
    misc: {
        signalManager: SignalManager
    },
    ui: {
        applet: Applet,
        popupMenu: PopupMenu,
        settings: Settings
    }
} = imports;

const {
    _,
    escapeHTML,
    xdgOpen
} = GlobalUtils;

function PanelDrawer() {
    this._init.apply(this, arguments);
}

PanelDrawer.prototype = {
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
        this.vertical = this.orientation === St.Side.LEFT || this.orientation === St.Side.RIGHT;

        this._initializeSettings(() => {
            this.set_applet_tooltip(_(this.metadata.name));

            this._hideTimeoutId = 0;
            this._reshowingHideTimeoutId = 0;
            this._collapse = true;
            this.handledPanel = null;
            this.handledPanelBox = null;
            this.collapsedApplets = new Set();
            this.sigMan = new SignalManager.SignalManager(null);

            this._setupHandledPanel();
            this._expandAppletContextMenu();
        }, () => {
            if (!this.handledPanel || !this.handledPanelBox) {
                this.set_applet_icon_symbolic_name("dialog-error");

                let msg = [
                    escapeHTML(_("Something have gone wrong.")),
                    escapeHTML(_("The applet was not able to identify the panel it is in.")),
                    escapeHTML(_("Try restarting Cinnamon."))
                ];

                $.Notification.notify(msg, DesktopNotificationsUtils.NotificationUrgency.CRITICAL);

                return;
            }

            this._setAppletIcon(true);

            this.sigMan.connect(global.settings, "changed::panel-edit-mode", function() {
                this.on_panel_edit_mode_changed();
            }.bind(this));
            this.sigMan.connect(this.actor, "enter-event", function(aEvent) {
                this._onEntered(aEvent);
            }.bind(this));

            if (!this.pref_disable_starttime_autohide || this.pref_auto_hide) {
                if (this._hideTimeoutId > 0) {
                    Mainloop.source_remove(this._hideTimeoutId);
                    this._hideTimeoutId = 0;
                }

                this._hideTimeoutId = Mainloop.timeout_add_seconds(2,
                    () => {
                        if (this._collapse) {
                            this.autoCollapse();
                        }

                        this._hideTimeoutId = 0;

                        return GLib.SOURCE_REMOVE;
                    }
                );
            }

            if (!this.pref_usage_notified) {
                $.Notification.notify(
                    escapeHTML(_("Read this applet help page for usage instructions.")),
                    DesktopNotificationsUtils.NotificationUrgency.CRITICAL
                );
                this.pref_usage_notified = true;
            }
        });
    },

    _expandAppletContextMenu: function() {
        /* NOTE: If panel couldn't be retrieved, don't bother nor think about it!!! ¬¬
         */
        if (!this.handledPanel) {
            return;
        }

        let editModeSwitch = new PopupMenu.PopupSwitchMenuItem(
            _("Panel edit mode"),
            global.settings.get_boolean("panel-edit-mode")
        );
        editModeSwitch.connect("toggled", function(aItem) {
            global.settings.set_boolean("panel-edit-mode", aItem.state);
        });
        this._applet_context_menu.addMenuItem(editModeSwitch);

        global.settings.connect("changed::panel-edit-mode", () => {
            editModeSwitch.setToggleState(global.settings.get_boolean("panel-edit-mode"));
        });

        this._applet_context_menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        let menuItem = new PopupMenu.PopupIconMenuItem(
            _("Help"),
            "dialog-information",
            St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => {
            xdgOpen(this.metadata.path + "/HELP.html");
        });
        this._applet_context_menu.addMenuItem(menuItem);
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
            "pref_auto_hide",
            "pref_disable_starttime_autohide",
            "pref_hover_activates",
            "pref_hover_activates_hide",
            "pref_hide_delay",
            "pref_hover_delay",
            "pref_autohide_reshowing",
            "pref_autohide_reshowing_delay",
            "pref_horizontal_expand_icon_name",
            "pref_horizontal_collapse_icon_name",
            "pref_vertical_expand_icon_name",
            "pref_vertical_collapse_icon_name",
            "pref_logging_level",
            "pref_debugger_enabled",
            "pref_usage_notified"
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

    _setAppletIcon: function(aCollapsed) {
        if (this.vertical) {
            this.set_applet_icon_symbolic_name(aCollapsed ?
                this.pref_vertical_collapse_icon_name :
                this.pref_vertical_expand_icon_name
            );
        } else {
            this.set_applet_icon_symbolic_name(aCollapsed ?
                this.pref_horizontal_collapse_icon_name :
                this.pref_horizontal_expand_icon_name
            );
        }
    },

    _setupHandledPanel: function() {
        this.sigMan.disconnect("queue-relayout", this.handledPanelBox);

        this.handledPanel = $.getPanelOfApplet(this.instance_id);
        this.handledPanelBox = this.handledPanel._rightBox;

        if (this.handledPanelBox) {
            this.sigMan.connect(this.handledPanelBox, "queue-relayout", function() {
                if (this.pref_autohide_reshowing && !this._collapse) {
                    if (this._reshowingHideTimeoutId > 0) {
                        Mainloop.source_remove(this._reshowingHideTimeoutId);
                        this._reshowingHideTimeoutId = 0;
                    }

                    this._reshowingHideTimeoutId = Mainloop.timeout_add_seconds(this.pref_autohide_reshowing_delay, () => {
                        if (!this._collapse) {
                            this.toggleCollapsed();
                            this.autoCollapse();
                        }

                        this._reshowingHideTimeoutId = 0;

                        return GLib.SOURCE_REMOVE;
                    });
                }
            }.bind(this));
        }
    },

    _onEntered: function(event) { // jshint ignore:line
        if (!this.actor.hover && this.pref_hover_activates && !this.editModeEnabled) {
            this._showTimeoutId = Mainloop.timeout_add(this.pref_hover_delay, () => {
                if (this.actor.hover && (this.pref_hover_activates_hide || !this._collapse)) {
                    this.toggleCollapsed();
                }
            });
        }
    },

    toggleCollapsed: function() {
        let _children = this.handledPanelBox.get_children();
        let selfIndex = _children.indexOf(this.actor);

        if (this._collapse) {
            this.collapsedApplets.clear();

            this._setAppletIcon(false);

            for (let i = selfIndex - 1; i > -1; i--) {
                if (!_children[i].visible) {
                    this.collapsedApplets.add(_children[i]);
                }

                _children[i].hide();
                _children[i][$.HANDLER_PROP] = true;
            }
        } else {
            this._setAppletIcon(true);

            for (let i = 0; i < selfIndex; i++) {
                if (!this.collapsedApplets.has(_children[i])) {
                    _children[i].show();

                    if (_children[i].hasOwnProperty($.HANDLER_PROP)) {
                        delete _children[i][$.HANDLER_PROP];
                    }
                }
            }

            if (this.pref_auto_hide && !this.editModeEnabled) {
                if (this._hideTimeoutId > 0) {
                    Mainloop.source_remove(this._hideTimeoutId);
                    this._hideTimeoutId = 0;
                }

                this._hideTimeoutId = Mainloop.timeout_add_seconds(this.pref_hide_delay, () => {
                    this.autoCollapse();
                    this._hideTimeoutId = 0;

                    return GLib.SOURCE_REMOVE;
                });
            }
        }

        this._collapse = !this._collapse;
    },

    autoCollapse: function() {
        let postpone = this.actor.hover;
        let panelBoxChildren = this.handledPanelBox.get_children();
        let selfIndex = panelBoxChildren.indexOf(this.actor);

        let i = 0;
        for (; i < selfIndex; i++) {
            let child = panelBoxChildren[i];
            let hasAppletObject = child.hasOwnProperty("_applet");
            postpone = postpone || child.hover;

            if (hasAppletObject && child._applet.hasOwnProperty("_menuManager") &&
                child._applet._menuManager) {
                postpone = postpone || child._applet._menuManager._activeMenu;
            }

            if (hasAppletObject && child._applet.hasOwnProperty("menuManager") &&
                child._applet.menuManager) {
                postpone = postpone || child._applet.menuManager._activeMenu;
            }

            if (postpone) {
                break;
            }
        }

        if (postpone) {
            if (this._hideTimeoutId > 0) {
                Mainloop.source_remove(this._hideTimeoutId);
                this._hideTimeoutId = 0;
            }

            this._hideTimeoutId = Mainloop.timeout_add_seconds(this.pref_hide_delay,
                () => {
                    this.autoCollapse();
                    this._hideTimeoutId = 0;

                    return GLib.SOURCE_REMOVE;
                }
            );
        } else if (this._collapse && !this.editModeEnabled) {
            this.toggleCollapsed();
        }
    },

    on_orientation_changed: function(aOrientation) {
        this.vertical = aOrientation === St.Side.LEFT || aOrientation === St.Side.RIGHT;

        this._setupHandledPanel();
    },

    on_applet_clicked: function() {
        if (this.handledPanelBox) {
            this.toggleCollapsed();
        }
    },

    on_panel_edit_mode_changed: function() {
        if (this.editModeEnabled) {
            if (!this._collapse) {
                /* NOTE: Workaround for unbelievable retarded newer versions of Cinnamon.
                 * When entering edit mode, the panel box would not expand when displaying
                 * the applet that were hidden. ¬¬
                 */
                this.handledPanelBox.set_size(-1, -1);
                this.toggleCollapsed();
            }
        } else if (this._collapse) {
            this.toggleCollapsed();
        }
    },

    on_applet_removed_from_panel: function() {
        if (!this._collapse) {
            this.toggleCollapsed();
        }

        this.sigMan.disconnectAllSignals();
        this.settings && this.settings.finalize();
    },

    get editModeEnabled() {
        return global.settings.get_boolean("panel-edit-mode");
    },

    _onSettingsChanged: function(aPrefValue, aPrefKey) {
        // Note: On Cinnamon versions greater than 3.2.x, two arguments are passed to the
        // settings callback instead of just one as in older versions. The first one is the
        // setting value and the second one is the user data. To workaround this nonsense,
        // check if the second argument is undefined to decide which
        // argument to use as the pref key depending on the Cinnamon version.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        // Remove the following variable and directly use the second argument.
        let pref_key = aPrefKey || aPrefValue;
        switch (pref_key) {
            case "pref_auto_hide":
                if (this.pref_auto_hide && this._collapse) {
                    this.autoCollapse();
                }
                break;
            case "pref_autohide_reshowing":
                if (!this._collapse) {
                    this.toggleCollapsed();
                    this.autoCollapse();
                }
                break;
            case "pref_horizontal_expand_icon_name":
            case "pref_horizontal_collapse_icon_name":
            case "pref_vertical_expand_icon_name":
            case "pref_vertical_collapse_icon_name":
                this._setAppletIcon(this._collapse);
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
        PanelDrawer: PanelDrawer
    });

    return new PanelDrawer(aMetadata, aOrientation, aPanelHeight, aInstanceId);
}
