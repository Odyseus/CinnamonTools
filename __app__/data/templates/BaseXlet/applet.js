let $,
    GlobalUtils,
    DebugManager;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
    GlobalUtils = require("./globalUtils.js");
    DebugManager = require("./debugManager.js");
} else {
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
    GlobalUtils = imports.ui.appletManager.applets["{{UUID}}"].globalUtils;
    DebugManager = imports.ui.appletManager.applets["{{UUID}}"].debugManager;
}

const {
    _,
    xdgOpen
} = GlobalUtils;

const {
    gi: {
        GLib,
        St
    },
    mainloop: Mainloop,
    ui: {
        applet: Applet,
        popupMenu: PopupMenu,
        settings: Settings
    }
} = imports;

function MyApplet() {
    this._init.apply(this, arguments);
}

MyApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(aMetadata, aOrientation, aPanelHeight, aInstanceId) {
        Applet.TextIconApplet.prototype._init.call(this, aOrientation, aPanelHeight, aInstanceId);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.metadata = aMetadata;
        this.orientation = aOrientation;
        this.instance_id = aInstanceId;

        this._initializeSettings(() => {
            /* NOTE: Direct function calls.
             * These calls are performed AFTER the applet's settings are initialized
             * (this._bindSettings() was called).
             * These function calls can depend on settings (they were already initialized)
             * but should't depend on any other properties.
             */
            // Add new items to the applet context menu or override the default ones.
            this._expandAppletContextMenu();
        }, () => {
            /* NOTE: Idle function calls.
             * All these function calls are performed inside a Mainloop.idle_add() call.
             */
            this._updateIconAndLabel();
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
            "pref_custom_icon_for_applet",
            "pref_custom_label_for_applet",
            "pref_logging_level",
            "pref_debugger_enabled"
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
        menuItem.connect("activate", () => {
            xdgOpen(this.metadata.path + "/HELP.html");
        });
        this._applet_context_menu.addMenuItem(menuItem);
    },

    _updateIconAndLabel: function() {
        let icon = this.pref_custom_icon_for_applet;
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

        if (GLib.path_is_absolute(icon) &&
            GLib.file_test(icon, GLib.FileTest.EXISTS)) {
            setIcon(icon, true);
        } else {
            try {
                setIcon(icon);
            } catch (aErr) {
                global.logWarning('Could not load icon "' + icon + '" for applet.');
            }
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
        if (typeof this.hide_applet_label === "function") {
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

    on_applet_removed_from_panel: function() {
        if (this.settings) {
            this.settings.finalize();
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
            case "pref_custom_icon_for_applet":
            case "pref_custom_label_for_applet":
                this._updateIconAndLabel();
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
        MyApplet: MyApplet
    });

    return new MyApplet(aMetadata, aOrientation, aPanelHeight, aInstanceId);
}
