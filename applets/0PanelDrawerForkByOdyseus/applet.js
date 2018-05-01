const AppletUUID = "{{UUID}}";

let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets[AppletUUID].utils;
}

const _ = $._;

const Applet = imports.ui.applet;
const Lang = imports.lang;
const Main = imports.ui.main;
const Settings = imports.ui.settings;
const PopupMenu = imports.ui.popupMenu;
const Mainloop = imports.mainloop;
const Util = imports.misc.util;
const St = imports.gi.St;

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

        try {
            this._bindSettings();
        } catch (e) {
            global.logError(e);
        }

        Mainloop.idle_add(() => {
            try {
                this.set_applet_icon_symbolic_name("pan-end");

                let editMode = global.settings.get_boolean("panel-edit-mode");
                this.panelEditMode = new PopupMenu.PopupSwitchMenuItem(_("Panel Edit mode"), editMode);
                this.panelEditMode.connect("toggled", function(item) {
                    global.settings.set_boolean("panel-edit-mode", item.state);
                });
                this._applet_context_menu.addMenuItem(this.panelEditMode);

                let addapplets = new PopupMenu.PopupMenuItem(_("Add applets to the panel"));
                let addappletsicon = new St.Icon({
                    icon_name: "applets",
                    icon_size: 22,
                    icon_type: St.IconType.FULLCOLOR
                });
                addapplets.connect("activate", function() {
                    Util.spawnCommandLine("cinnamon-settings applets");
                });
                addapplets.addActor(addappletsicon, {
                    align: St.Align.END
                });
                this._applet_context_menu.addMenuItem(addapplets);

                global.settings.connect("changed::panel-edit-mode", Lang.bind(this, this.on_panel_edit_mode_changed));
                this.actor.connect("enter-event", Lang.bind(this, this._onEntered));

                this._hideTimeoutId = 0;
                this.h = true;
                this.alreadyH = [];

                if ((!this.disable_starttime_autohide) || this.auto_hide) {
                    this._hideTimeoutId = Mainloop.timeout_add_seconds(2, Lang.bind(this, function() {
                        if (this.h) {
                            this.autodo(true);
                        }
                    }));
                }

                /*if more than one instance
                this.actor.connect('hide', Lang.bind(this, function(){
                    if (this.h)
                        this.doAction(true);
                }));*/

                this.cbox = Main.panel._rightBox;

                /*this doesn't work, i don't know why!
                if (Main.panel2 !== null){
                    let c2=Main.panel2._rightBox.get_children();
                    if (c2.indexOf(this.actor) > -1)
                        this.cbox = Main.panel2._rightBox;
                }*/

                this.cbox.connect("queue-relayout", Lang.bind(this, Lang.bind(this, function(actor, m) { // jshint ignore:line
                    if (this.autohide_rs && !this.h) {
                        if (this._rshideTimeoutId) {
                            Mainloop.source_remove(this._rshideTimeoutId);
                            this._rshideTimeoutId = null;
                        }
                        this._rshideTimeoutId = Mainloop.timeout_add_seconds(this.autohide_rs_time, Lang.bind(this, function() {
                            if (!this.h) {
                                //this.h=true;
                                this.doAction(true);
                                this.autodo(true);
                            }
                        }));
                    }
                })));
            } catch (aErr) {
                global.logError(aErr);
            }
        });
    },

    _bindSettings: function() {
        this.settings = new Settings.AppletSettings(this, this.metadata.uuid, this.instance_id);

        // Needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        let bD = {
            IN: 1,
            OUT: 2,
            BIDIRECTIONAL: 3
        };
        let settingsArray = [
            [bD.IN, "auto_hide", Lang.bind(this, function() {
                if (this._hideTimeoutId & !this.auto_hide) {
                    Mainloop.source_remove(this._hideTimeoutId);
                    this._hideTimeoutId = 0;
                } else if (this.auto_hide & this.h) {
                    this.autodo(true);
                }
            })],
            [bD.IN, "disable_starttime_autohide", null],
            [bD.IN, "hover_activates", null],
            [bD.IN, "hover_activates_hide", null],
            [bD.IN, "hide_time", null],
            [bD.IN, "hover_time", null],
            [bD.IN, "autohide_rs", Lang.bind(this, function() {
                if (!this.h) {
                    //this.h=true;
                    this.doAction(true);
                    this.autodo(true);
                }
            })],
            [bD.IN, "autohide_rs_time", null]
        ];
        let newBinding = typeof this.settings.bind === "function";
        for (let [binding, property_name, callback] of settingsArray) {
            // Condition needed for retro-compatibility.
            // Mark for deletion on EOL. Cinnamon 3.2.x+
            if (newBinding) {
                this.settings.bind(property_name, property_name, callback);
            } else {
                this.settings.bindProperty(binding, property_name, property_name, callback, null);
            }
        }
    },

    on_applet_clicked: function(event) { // jshint ignore:line
        this.doAction(true);
    },

    _onEntered: function(event) { // jshint ignore:line
        if (!this.actor.hover && this.hover_activates && !global.settings.get_boolean("panel-edit-mode")) {
            this._showTimeoutId = Mainloop.timeout_add(this.hover_time, Lang.bind(this, function() {
                if (this.actor.hover && (this.hover_activates_hide || !this.h)) {
                    this.doAction(true);
                }
            }));
        }
    },

    doAction: function(updalreadyH) {
        if (this._hideTimeoutId) {
            Mainloop.source_remove(this._hideTimeoutId);
            this._hideTimeoutId = 0;
        }

        if (this._rshideTimeoutId) {
            Mainloop.source_remove(this._rshideTimeoutId);
            this._rshideTimeoutId = null;
        }

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
                    Mainloop.timeout_add(10, Lang.bind(this, function() {
                        this.tray.hide();
                    }));
                    continue;
                    //this.traysize = 
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
                this._hideTimeoutId = Mainloop.timeout_add_seconds(this.hide_time, Lang.bind(this, function() {
                    this.autodo(updalreadyH);
                }));
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
        this._hideTimeoutId = 0;
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
                Lang.bind(this, function() {
                    this.autodo(updalreadyH);
                }));
        } else if (this.h && !global.settings.get_boolean("panel-edit-mode")) {
            this.doAction(updalreadyH);
        }

    },

    on_applet_removed_from_panel: function() {
        if (!this.h) {
            this.doAction(true);
        }
    }
};

function main(aMetadata, aOrientation, aPanel_height, aInstance_id) {
    return new PanelDrawerForkByOdyseusApplet(aMetadata, aOrientation, aPanel_height, aInstance_id);
}
