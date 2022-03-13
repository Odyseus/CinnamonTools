const {
    gi: {
        St
    },
    mainloop: Mainloop,
    ui: {
        applet: Applet,
        popupMenu: PopupMenu
    }
} = imports;

const {
    _,
    escapeHTML
} = require("js_modules/globalUtils.js");

const {
    NotificationUrgency
} = require("js_modules/notificationsUtils.js");

const {
    Debugger,
    getPanelOfApplet,
    HANDLER_PROP,
    Notification,
} = require("js_modules/utils.js");

const {
    APPLET_PREFS
} = require("js_modules/constants.js");

const {
    getBaseAppletClass
} = require("js_modules/appletsUtils.js");

class PanelDrawer extends getBaseAppletClass(Applet.IconApplet) {
    constructor(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
        super({
            metadata: aMetadata,
            orientation: aOrientation,
            panel_height: aPanelHeight,
            instance_id: aInstanceID,
            init_keybinding_manager: false,
            pref_keys: APPLET_PREFS,
            init_menu: false
        });

        this.__initializeApplet(() => {
            this.vertical = this.$.orientation === St.Side.LEFT || this.$.orientation === St.Side.RIGHT;
            this.set_applet_tooltip(_(this.$.metadata.name));
            this._expandAppletContextMenu();

            this._collapse = true;
            this.handledPanel = null;
            this.handledPanelBox = null;
            this.collapsedApplets = new Set();

            this._setupHandledPanel();
        }, () => {
            if (!this.handledPanel || !this.handledPanelBox) {
                this.set_applet_icon_symbolic_name("dialog-error");

                const msg = [
                    escapeHTML(_("Something have gone wrong.")),
                    escapeHTML(_("The applet was not able to identify the panel it is in.")),
                    escapeHTML(_("Try restarting Cinnamon."))
                ];

                Notification.notify(msg, NotificationUrgency.CRITICAL);

                return;
            }

            this.__setAppletIcon(true);

            if (!this.$._.disable_starttime_autohide || this.$._.auto_hide) {
                this.$.schedule_manager.setTimeout("hide_drawer", function() {
                    if (this._collapse) {
                        this.autoCollapse();
                    }
                }.bind(this), 2000);
            }

            if (!this.$._.usage_notified) {
                Notification.notify(
                    escapeHTML(_("Read this applet help page for usage instructions.")),
                    NotificationUrgency.CRITICAL
                );
                this.$._.usage_notified = true;
            }
        });
    }

    __connectSignals() {
        this.$.signal_manager.connect(global.settings, "changed::panel-edit-mode", function() {
            this.on_panel_edit_mode_changed();
        }.bind(this));
        this.$.signal_manager.connect(this.actor, "enter-event", function(aEvent) {
            this._onEntered(aEvent);
        }.bind(this));
        this.$.signal_manager.connect(this, "orientation-changed", function() {
            this.__seekAndDetroyConfigureContext();
        }.bind(this));
    }

    _expandAppletContextMenu() {
        const editModeSwitch = new PopupMenu.PopupSwitchMenuItem(
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

        const menuItem = new PopupMenu.PopupIconMenuItem(_("Help"), "dialog-information", St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => this.__openHelpPage());
        this._applet_context_menu.addMenuItem(menuItem);

        this.__seekAndDetroyConfigureContext();
    }

    __setAppletIcon(aCollapsed) {
        if (this.vertical) {
            super.__setAppletIcon(aCollapsed ?
                this.$._.vertical_collapse_icon_name :
                this.$._.vertical_expand_icon_name
            );
        } else {
            super.__setAppletIcon(aCollapsed ?
                this.$._.horizontal_collapse_icon_name :
                this.$._.horizontal_expand_icon_name
            );
        }
    }

    _setupHandledPanel() {
        this.$.signal_manager.disconnect("queue-relayout", this.handledPanelBox);

        this.handledPanel = getPanelOfApplet(this.$.instance_id);
        this.handledPanelBox = this.handledPanel ? this.handledPanel._rightBox : null;

        if (this.handledPanelBox) {
            this.$.signal_manager.connect(this.handledPanelBox, "queue-relayout", function() {
                if (this.$._.autohide_reshowing && !this._collapse) {
                    this.$.schedule_manager.setTimeout("autohide_reshowing_drawer", function() {
                        if (!this._collapse) {
                            this.toggleCollapsed();
                            this.autoCollapse();
                        }
                    }.bind(this), this.$._.autohide_reshowing_delay * 1000);
                }
            }.bind(this));
        }
    }

    _onEntered(event) { // jshint ignore:line
        if (!this.actor.hover && this.$._.hover_activates && !this.editModeEnabled) {
            this._showTimeoutId = Mainloop.timeout_add(this.$._.hover_delay, () => {
                if (this.actor.hover && (this.$._.hover_activates_hide || !this._collapse)) {
                    this.toggleCollapsed();
                }
            });
        }
    }

    toggleCollapsed() {
        const _children = this.handledPanelBox.get_children();
        const selfIndex = _children.indexOf(this.actor);

        if (this._collapse) {
            this.collapsedApplets.clear();

            this.__setAppletIcon(false);

            for (let i = selfIndex - 1; i > -1; i--) {
                if (!_children[i].visible) {
                    this.collapsedApplets.add(_children[i]);
                }

                _children[i].hide();
                _children[i][HANDLER_PROP] = true;
            }
        } else {
            this.__setAppletIcon(true);

            for (let i = 0; i < selfIndex; i++) {
                if (!this.collapsedApplets.has(_children[i])) {
                    _children[i].show();

                    if (_children[i].hasOwnProperty(HANDLER_PROP)) {
                        delete _children[i][HANDLER_PROP];
                    }
                }
            }

            if (this.$._.auto_hide && !this.editModeEnabled) {
                this.$.schedule_manager.setTimeout(
                    "hide_drawer",
                    this.autoCollapse.bind(this),
                    this.$._.hide_delay * 1000
                );
            }
        }

        this._collapse = !this._collapse;
    }

    autoCollapse() {
        let postpone = this.actor.hover;
        let panelBoxChildren = this.handledPanelBox.get_children();
        let selfIndex = panelBoxChildren.indexOf(this.actor);

        let i = 0;
        for (; i < selfIndex; i++) {
            const child = panelBoxChildren[i];
            const hasAppletObject = child.hasOwnProperty("_applet");
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
            this.$.schedule_manager.setTimeout(
                "hide_drawer",
                this.autoCollapse.bind(this),
                this.$._.hide_delay * 1000
            );
        } else if (this._collapse && !this.editModeEnabled) {
            this.toggleCollapsed();
        }
    }

    on_orientation_changed(aOrientation) {
        super.on_orientation_changed(aOrientation);
        this.vertical = aOrientation === St.Side.LEFT || aOrientation === St.Side.RIGHT;

        this._setupHandledPanel();
    }

    on_applet_clicked() {
        if (this.handledPanelBox) {
            this.toggleCollapsed();
        }
    }

    on_panel_edit_mode_changed() {
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
    }

    on_applet_removed_from_panel() {
        if (!this._collapse) {
            this.toggleCollapsed();
        }

        super.on_applet_removed_from_panel();
    }

    get editModeEnabled() {
        return global.settings.get_boolean("panel-edit-mode");
    }

    __onSettingsChanged(aPrefOldValue, aPrefKey) {
        switch (aPrefKey) {
            case "auto_hide":
                if (this.$._.auto_hide && this._collapse) {
                    this.autoCollapse();
                }
                break;
            case "autohide_reshowing":
                if (!this._collapse) {
                    this.toggleCollapsed();
                    this.autoCollapse();
                }
                break;
            case "horizontal_expand_icon_name":
            case "horizontal_collapse_icon_name":
            case "vertical_expand_icon_name":
            case "vertical_collapse_icon_name":
                this.__setAppletIcon(this._collapse);
                break;
        }
    }
}

function main() {
    Debugger.wrapObjectMethods({
        PanelDrawer: PanelDrawer
    });

    return new PanelDrawer(...arguments);
}
