const Cinnamon = imports.gi.Cinnamon;
const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Settings = imports.ui.settings;

let CONNECTION_IDS = {
    WDAE: 0
};

const SHORTCUT_ID = "window-demands-attention-extension";

let changeSettingsTimeout;

const WindowDemandsAttentionExtension = new Lang.Class({
    Name: "WindowDemandsAttentionExtension",

    _init: function() {
        this.settings = new Settings.ExtensionSettings(this, "{{UUID}}");
        this._bindSettings();

        if (this.pref_activation_mode === "hotkey") {
            this._windows = [];

            CONNECTION_IDS.WDAE = global.display.connect(
                "window-demands-attention",
                Lang.bind(this, this._on_window_demands_attention)
            );
        } else if (this.pref_activation_mode === "force") {
            this._tracker = Cinnamon.WindowTracker.get_default();
            this._handlerid = global.display.connect("window-demands-attention",
                Lang.bind(this, this._on_window_demands_attention));
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

        let settingsArray = [
            [bD.IN, "pref_keyboard_shortcut", this._toggleEnabled],
            [bD.IN, "pref_activation_mode", this._toggleEnabled]
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
    _toggleEnabled: function() {
        disable();
        if (changeSettingsTimeout !== null) {
            Mainloop.source_remove(changeSettingsTimeout);
        }

        changeSettingsTimeout = Mainloop.timeout_add(500, Lang.bind(this, enable));
    },

    _on_window_demands_attention: function(aDisplay, aWin) {
        if (this.pref_activation_mode === "hotkey") {
            this._windows.push(aWin);
        } else if (this.pref_activation_mode === "force") {
            Main.activateWindow(aWin);
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
            SHORTCUT_ID,
            this.pref_keyboard_shortcut,
            Lang.bind(this, this._activate_last_window));
    },

    _remove_keybindings: function() {
        Main.keybindingManager.removeHotKey(SHORTCUT_ID);
    },

    enable: function() {
        if (this.pref_activation_mode === "hotkey") {
            this._add_keybindings();
        }
    },

    _destroy: function() {
        try {
            global.display.disconnect(this._handlerid);
        } catch (aErr) {}

        try {
            global.display.disconnect(CONNECTION_IDS.WDAE);
        } catch (aErr) {}

        CONNECTION_IDS.WDAE = 0;
        this._windows = null;
        this._remove_keybindings();
    }
});

let wdae = null;

function enable() {
    try {
        wdae = new WindowDemandsAttentionExtension();
        wdae.enable();
    } catch (aErr) {
        Main.notify("[Window demands attention behavior]", aErr.message);
        global.logError(aErr);
    }
}

function disable() {
    if (changeSettingsTimeout !== null) {
        Mainloop.source_remove(changeSettingsTimeout);
    }

    if (wdae !== null) {
        wdae._destroy();
        wdae = null;
    }
}

function init() {
    //
}
