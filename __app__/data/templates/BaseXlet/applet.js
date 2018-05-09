let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.$$XLET_MANAGER$$.$$XLET_TYPE$$s["{{UUID}}"].utils;
}

const _ = $._;

const Applet = imports.ui.applet;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const Settings = imports.ui.settings;
const St = imports.gi.St;
const Util = imports.misc.util;

function MyApplet(aMetadata, aOrientation, aPanel_height, aInstance_id) {
    this._init(aMetadata, aOrientation, aPanel_height, aInstance_id);
}

MyApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(aMetadata, aOrientation, aPanel_height, aInstance_id) {
        Applet.TextIconApplet.prototype._init.call(this, aOrientation, aPanel_height, aInstance_id);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.metadata = aMetadata;
        this.orientation = aOrientation;
        this.instance_id = aInstance_id;

        // "Real time" declarations/calls that could/will cause problems if declared/executed
        // inside Mainloop.idle_add.
        try {
            // Initialize applet's settings system.
            this._bindSettings();
            // Add new items to the applet context menu or override the default ones.
            this._expandAppletContextMenu();
            // To be able to use icons stored inside a folder called "icons" by name.
            Gtk.IconTheme.get_default().append_search_path(aMetadata.path + "/icons/");
        } catch (aErr) {
            global.logError(aErr);
        }

        Mainloop.idle_add(() => {
            try {
                //
                this._updateIconAndLabel();
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
        let prefKeysArray = [
            "pref_custom_icon_for_applet",
            "pref_custom_label_for_applet"
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

    _expandAppletContextMenu: function() {
        let menuItem = new PopupMenu.PopupIconMenuItem(_("Help"),
            "dialog-information", St.IconType.SYMBOLIC);
        menuItem.connect("activate", Lang.bind(this, function() {
            Util.spawn_async(["xdg-open", this.metadata.path + "/HELP.html"], null);
        }));
        this._applet_context_menu.addMenuItem(menuItem);
    },

    _updateIconAndLabel: function() {
        try {
            if (this.pref_custom_icon_for_applet === "") {
                this.set_applet_icon_name("");
            } else if (GLib.path_is_absolute(this.pref_custom_icon_for_applet) &&
                GLib.file_test(this.pref_custom_icon_for_applet, GLib.FileTest.EXISTS)) {
                if (this.pref_custom_icon_for_applet.search("-symbolic") !== -1) {
                    this.set_applet_icon_symbolic_path(this.pref_custom_icon_for_applet);
                } else {
                    this.set_applet_icon_path(this.pref_custom_icon_for_applet);
                }
            } else if (Gtk.IconTheme.get_default().has_icon(this.pref_custom_icon_for_applet)) {
                if (this.pref_custom_icon_for_applet.search("-symbolic") !== -1) {
                    this.set_applet_icon_symbolic_name(this.pref_custom_icon_for_applet);
                } else {
                    this.set_applet_icon_name(this.pref_custom_icon_for_applet);
                }
                // START mark Odyseus
                // I added the last condition without checking Gtk.IconTheme.get_default.
                // Otherwise, if there is a valid icon name added by
                //  Gtk.IconTheme.get_default().append_search_path, it will not be recognized.
                // With the following extra condition, the worst that can happen is that
                //  the applet icon will not change/be set.
            } else {
                try {
                    if (this.pref_custom_icon_for_applet.search("-symbolic") !== -1) {
                        this.set_applet_icon_symbolic_name(this.pref_custom_icon_for_applet);
                    } else {
                        this.set_applet_icon_name(this.pref_custom_icon_for_applet);
                    }
                } catch (aErr) {
                    global.logError(aErr);
                }
            }
        } catch (aErr) {
            global.logWarning('Could not load icon file "' + this.pref_custom_icon_for_applet + '" for menu button');
        }

        if (this.pref_custom_icon_for_applet === "") {
            this._applet_icon_box.hide();
        } else {
            this._applet_icon_box.show();
        }

        if (this.orientation === St.Side.LEFT || this.orientation === St.Side.RIGHT) { // no menu label if in a vertical panel
            this.set_applet_label("");
        } else {
            if (this.pref_custom_label_for_applet !== "") {
                this.set_applet_label(_(this.pref_custom_label_for_applet));
            } else {
                this.set_applet_label("");
            }
        }

        this.updateLabelVisibility();
    },

    updateLabelVisibility: function() {
        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (typeof this.hide_applet_label !== "function") {
            if (this.orientation == St.Side.LEFT || this.orientation == St.Side.RIGHT) {
                this.hide_applet_label(true);
            } else {
                if (this.pref_custom_label_for_applet === "") {
                    this.hide_applet_label(true);
                } else {
                    this.hide_applet_label(false);
                }
            }
        }
    },

    _onSettingsChanged: function(aPrefKey) {
        switch (aPrefKey) {
            case "pref_custom_icon_for_applet":
            case "pref_custom_label_for_applet":
                this._updateIconAndLabel();
                break;
        }
    }
};

function main(aMetadata, aOrientation, aPanel_height, aInstance_id) {
    return new MyApplet(aMetadata, aOrientation, aPanel_height, aInstance_id);
}
