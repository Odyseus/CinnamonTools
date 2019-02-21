let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
}

const _ = $._;

const {
    gi: {
        St
    },
    mainloop: Mainloop,
    misc: {
        util: Util
    },
    ui: {
        applet: Applet,
        main: Main,
        popupMenu: PopupMenu,
        settings: Settings
    }
} = imports;

function PanelDrawerForkByOdyseusApplet() {
    this._init.apply(this, arguments);
}

PanelDrawerForkByOdyseusApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(aMetadata, aOrientation, aPanel_height, aInstance_id) {
        Applet.IconApplet.prototype._init.call(this, aOrientation, aPanel_height, aInstance_id);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.HORIZONTAL);
        }

        this.metadata = aMetadata;
        this.instance_id = aInstance_id;
        this.orientation = aOrientation;

        this._initializeSettings(() => {
            this._expandAppletContextMenu();
        }, () => {
            this.set_applet_icon_symbolic_name("pan-end");

            global.settings.connect("changed::panel-edit-mode",
                () => this.on_panel_edit_mode_changed());
            this.actor.connect("enter-event",
                (aEvent) => this._onEntered(aEvent));

            this._hideTimeoutId = 0;
            this._rshideTimeoutId = 0;
            this.h = true;
            this.alreadyH = [];

            if ((!this.disable_starttime_autohide) || this.auto_hide) {
                this._hideTimeoutId = Mainloop.timeout_add_seconds(2,
                    () => {
                        if (this.h) {
                            this.autodo(true);
                        }
                        return false;
                    }
                );
            }

            /*if more than one instance
            this.actor.connect('hide', ()=>{
                if (this.h)
                    this.doAction(true);
            });*/

            this.cbox = Main.panel._rightBox;

            /*this doesn't work, i don't know why!
            if (Main.panel2 !== null){
                let c2=Main.panel2._rightBox.get_children();
                if (c2.indexOf(this.actor) > -1)
                    this.cbox = Main.panel2._rightBox;
            }*/

            this.cbox.connect("queue-relayout", () => {
                if (this.autohide_rs && !this.h) {
                    this._rshideTimeoutId = Mainloop.timeout_add_seconds(this.autohide_rs_time, () => {
                        if (!this.h) {
                            // this.h=true;
                            this.doAction(true);
                            this.autodo(true);
                        }
                        return false;
                    });
                }
            });
        });
    },

    _expandAppletContextMenu: function() {
        let editMode = global.settings.get_boolean("panel-edit-mode");
        this.panelEditMode = new PopupMenu.PopupSwitchMenuItem(_("Panel Edit mode"), editMode);
        this.panelEditMode.connect("toggled", (item) => {
            global.settings.set_boolean("panel-edit-mode", item.state);
        });
        this._applet_context_menu.addMenuItem(this.panelEditMode);

        let addapplets = new PopupMenu.PopupMenuItem(_("Add applets to the panel"));
        let addappletsicon = new St.Icon({
            icon_name: "applets",
            icon_size: 22,
            icon_type: St.IconType.FULLCOLOR
        });
        addapplets.connect("activate", () => {
            Util.spawnCommandLine("cinnamon-settings applets");
        });
        addapplets.addActor(addappletsicon, {
            align: St.Align.END
        });
        this._applet_context_menu.addMenuItem(addapplets);
    },

    _initializeSettings: function(aDirectCallback, aIdleCallback) {
        this.settings = new Settings.AppletSettings(
            this,
            this.metadata.uuid,
            this.instance_id,
            true // Asynchronous settings initialization.
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
            "auto_hide",
            "disable_starttime_autohide",
            "hover_activates",
            "hover_activates_hide",
            "hide_time",
            "hover_time",
            "autohide_rs",
            "autohide_rs_time"
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

    on_applet_clicked: function(event) { // jshint ignore:line
        this.doAction(true);
    },

    _onEntered: function(event) { // jshint ignore:line
        if (!this.actor.hover && this.hover_activates && !global.settings.get_boolean("panel-edit-mode")) {
            this._showTimeoutId = Mainloop.timeout_add(this.hover_time, () => {
                if (this.actor.hover && (this.hover_activates_hide || !this.h)) {
                    this.doAction(true);
                }
            });
        }
    },

    doAction: function(updalreadyH) {
        let _children = this.cbox.get_children();
        let p = _children.indexOf(this.actor);

        if (this.h) {

            if (updalreadyH) {
                this.alreadyH = [];
            }

            this.set_applet_icon_symbolic_name("pan-start");
            for (let i = p - 1; i > -1; i--) {
                if (!_children[i].visible && updalreadyH) {
                    this.alreadyH.push(_children[i]);
                }
                if (_children[i]._applet._uuid == "systray@cinnamon.org" || _children[i]._applet._uuid == "systray@cinnaman") {
                    this.tray = _children[i];
                    let tis = _children[i].get_first_child().get_children();
                    for (let j in tis) {
                        tis[j].set_size(0, 0);
                    }
                    Mainloop.timeout_add(10, () => {
                        this.tray.hide();
                    });
                    continue;
                    // this.traysize =
                }
                _children[i].hide();
                //                if(_children[i]._applet._uuid=="systray@cinnamon.org" || _children[i]._applet._uuid=="systray-collapsible@koutch"){
                //                    this.sta=_children[i];
                //                    this.stai=i;
                //                    this.cbox.remove_actor(_children[i]);
                //                }
            }
        } else {
            this.set_applet_icon_symbolic_name("pan-end");
            for (let i = 0; i < p; i++) {
                if (this.alreadyH.indexOf(_children[i]) < 0) {
                    _children[i].show();
                }

                if (_children[i]._applet._uuid == "systray@cinnaman") {
                    let htis = _children[i].get_first_child().get_children();
                    for (let j in htis) {
                        htis[j].set_size(16, 16);
                    }
                }

                if (_children[i]._applet._uuid == "systray@cinnamon.org") {
                    let htis = _children[i].get_first_child().get_children();
                    for (let j in htis) {
                        htis[j].set_size(20, 20);
                    }
                }
            }

            if (this.sta) {
                this.cbox.insert_actor(this.sta, this.stai);
                Main.statusIconDispatcher.redisplay();
            }

            if (this.auto_hide & !global.settings.get_boolean("panel-edit-mode")) {
                this._hideTimeoutId = Mainloop.timeout_add_seconds(this.hide_time, () => {
                    this.autodo(updalreadyH);
                    return false;
                });
            }
        }
        this.h = !this.h;
    },

    on_panel_edit_mode_changed: function() {
        this.panelEditMode.setToggleState(global.settings.get_boolean("panel-edit-mode"));
        if (global.settings.get_boolean("panel-edit-mode")) {
            if (!this.h) {
                this.doAction(true);
            }
        } else if (this.h) {
            this.doAction(true);
        }
    },

    autodo: function(updalreadyH) {
        let postpone = this.actor.hover;
        let _children = this.cbox.get_children();
        let p = _children.indexOf(this.actor);
        for (let i = 0; i < p; i++) {
            postpone = postpone || _children[i].hover;
            if (_children[i]._applet._menuManager) {
                postpone = postpone || _children[i]._applet._menuManager._activeMenu;
            }
            if (_children[i]._applet.menuManager) {
                postpone = postpone || _children[i]._applet.menuManager._activeMenu;
            }
            if (postpone) {
                break;
            }
        }

        if (postpone) {
            this._hideTimeoutId = Mainloop.timeout_add_seconds(this.hide_time,
                () => {
                    this.autodo(updalreadyH);
                    return false;
                });
        } else if (this.h && !global.settings.get_boolean("panel-edit-mode")) {
            this.doAction(updalreadyH);
        }

    },

    on_applet_removed_from_panel: function() {
        if (!this.h) {
            this.doAction(true);
        }

        if (this.settings) {
            this.settings.finalize();
        }
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
            case "auto_hide":
                if (this.auto_hide & this.h) {
                    this.autodo(true);
                }
                break;
            case "autohide_rs":
                if (!this.h) {
                    // this.h=true;
                    this.doAction(true);
                    this.autodo(true);
                }
                break;
        }
    }
};

function main(aMetadata, aOrientation, aPanel_height, aInstance_id) {
    return new PanelDrawerForkByOdyseusApplet(aMetadata, aOrientation, aPanel_height, aInstance_id);
}
