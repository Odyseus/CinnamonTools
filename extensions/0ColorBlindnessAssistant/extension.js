let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
}

const {
    gi: {
        Clutter,
        Gio,
        Meta
    },
    mainloop: Mainloop,
    misc: {
        params: Params
    },
    ui: {
        main: Main,
        settings: Settings
    }
} = imports;

let xletMeta = null;
let assistant = null;

function ColorBlindnessAssistant() {
    this._init.apply(this, arguments);
}

ColorBlindnessAssistant.prototype = {
    _effect_id: "color_blindness_assistant_effect",
    _global_kbs: [
        "pref_daltonizer_wizard_kb",
        "pref_color_inspector_kb",
    ],

    _init: function() {
        this._initializeSettings(() => {
            this._allEffects = {};
            this._allEffectsIDs = [];
            this._shaderSource = "";
            this._colorInspector = null;
            this.registeredEffectKeybindings = [];
            this.registeredGlobalKeybindings = [];

            // if (!this.pref_usage_notified) {
            //     this._notifyMessage(
            //         _("Read this extension help page for usage instructions."),
            //         $.NotificationsUrgency.CRITICAL
            //     );
            //     this.pref_usage_notified = true;
            // }
        }, () => {
            //
        });
    },

    _initializeSettings: function(aDirectCallback, aIdleCallback) {
        this.settings = new Settings.ExtensionSettings(
            this,
            xletMeta.uuid,
            false // Asynchronous settings initialization.
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
            "pref_effects_list",
            "pref_daltonizer_wizard_kb",
            "pref_color_inspector_kb",
            "pref_color_inspector_always_copy_to_clipboard",
            "trigger_effects_list",
            "trigger_settings_shortcut_creation_desktop",
            "trigger_settings_shortcut_creation_xdg",
            "pref_imp_exp_last_selected_directory",
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

    get fxMap() {
        return this._allEffects;
    },

    get fxIDs() {
        return this._allEffectsIDs;
    },

    set fxIDs(aVal) {
        delete this._allEffectsIDs;
        this._allEffectsIDs = aVal;
    },

    _updateEffectsMap: function() {
        delete this._allEffects;
        this._allEffects = {};

        let effectsList = JSON.parse(JSON.stringify(this.pref_effects_list));
        let i = effectsList.length;
        while (i--) {
            let e = effectsList[i];
            e["id"] = "%s_%s_%s".format(e["base_name"], e["actor"], e["color_space"]);
            this._allEffects[e.id] = Params.parse(e, $.EFFECT_DEFAULT_PARAMS, true);
        }

        /* NOTE: Objects suck!!! Since I'm constantly iterating through the effects,
         * store all of their IDs in an array for infinitely faster iterations.
         */
        this.fxIDs = Object.keys(this._allEffects);
    },

    _toggleEffect: function(aEffectDef) {
        let actor = null;

        switch (aEffectDef.actor) {
            case "focused_window":
                let focusedWindow = global.display.focus_window;
                let winType = focusedWindow.get_window_type();

                if (winType !== Meta.WindowType.DESKTOP &&
                    winType !== Meta.WindowType.DOCK) {
                    actor = focusedWindow.get_compositor_private();
                }
                break;
            case "screen":
                actor = Main.uiGroup;
                break;
        }

        if (!actor || !(actor instanceof Clutter.Actor)) {
            return;
        }

        if (actor.hasOwnProperty($.EFFECT_PROP_NAME) &&
            actor[$.EFFECT_PROP_NAME] !== aEffectDef.id &&
            actor.get_effect(this._effect_id)) {
            actor.remove_effect_by_name(this._effect_id);
        }

        if (actor.get_effect(this._effect_id)) {
            actor.remove_effect_by_name(this._effect_id);
            actor[$.EFFECT_PROP_NAME] = null;
            delete actor[$.EFFECT_PROP_NAME];
        } else {
            actor.add_effect_with_name(this._effect_id, this._getEffect(aEffectDef));
            actor[$.EFFECT_PROP_NAME] = aEffectDef.id;
        }
    },

    _getEffect: function(aEffectDef) {
        let compensate = /_compensation$/.test(aEffectDef.base_name);
        let effect = new Clutter.ShaderEffect({
            shader_type: Clutter.ShaderType.FRAGMENT_SHADER
        });

        effect.set_shader_source(this._shaderSource);
        effect.set_uniform_value("tex", 0);
        effect.set_uniform_value("_type", $.EffectTypeMap[aEffectDef.base_name]);
        effect.set_uniform_value("_use_cie_rgb", $.ColorSpaceMap[aEffectDef.color_space]);
        effect.set_uniform_value("_compensate", compensate ? 1 : 0);

        return effect;
    },

    _registerEffectKeybindings: function() {
        this._removeKeybindings("Effect");

        let registerKb = (aEffectDef) => {
            let kbName = xletMeta.uuid + aEffectDef.id;
            Main.keybindingManager.addHotKey(
                kbName,
                aEffectDef.keybinding,
                () => this._toggleEffect(aEffectDef)
            );

            this.registeredEffectKeybindings.push(kbName);
        };

        let e = this.fxIDs.length;
        while (e--) {
            let effectDef = this.fxMap[this.fxIDs[e]];

            if (effectDef.keybinding) {
                registerKb(effectDef);
            }
        }
    },

    startColorInspector: function() {
        if (this._colorInspector !== null) {
            this._colorInspector.abort();
            this._colorInspector = null;
        }

        this._colorInspector = new $.ColorInspector({
            copyInfoToClipboard: this.pref_color_inspector_always_copy_to_clipboard
        });
        this._colorInspector.inspect();
    },

    _registerGlobalKeybindings: function() {
        this._removeKeybindings("Global");

        let registerKb = (aKbProp) => {
            let kbName = xletMeta.uuid + "Global" + aKbProp;
            Main.keybindingManager.addHotKey(
                kbName,
                this[aKbProp],
                () => {
                    switch (aKbProp) {
                        case "pref_daltonizer_wizard_kb":
                            //
                            break;
                        case "pref_color_inspector_kb":
                            this.startColorInspector();
                            break;
                    }
                }
            );

            this.registeredGlobalKeybindings.push(kbName);
        };

        let i = this._global_kbs.length;
        while (i--) {
            if (this[this._global_kbs[i]]) {
                registerKb(this._global_kbs[i]);
            }
        }
    },

    _removeKeybindings: function(aType) {
        let kbType = "registered" + aType + "Keybindings";
        let i = this[kbType].length;
        while (i--) {
            Main.keybindingManager.removeHotKey(this[kbType][i]);
        }

        delete this[kbType];
        this[kbType] = [];
    },

    _loadShaderFileAsync: function() {
        let shaderFile = Gio.file_new_for_path(xletMeta.path + "/shader.frag.glsl");

        if (shaderFile && shaderFile.query_exists(null)) {
            shaderFile.load_contents_async(null,
                (aFile, aResponce) => {
                    let success, contents = "",
                        tag;

                    try {
                        [success, contents, tag] = aFile.load_contents_finish(aResponce);
                    } catch (aErr) {
                        global.logError(aErr.message);
                        return;
                    }

                    if (!success) {
                        global.logError("Error reading shader file: %s".format(shaderFile.get_path()));
                        return;
                    }

                    this._shaderSource = String(contents);
                }
            );
        }
    },

    enable: function(aFromInit = false) {
        /* NOTE: aFromInit is used to only perform certain calls when the
         * extension is initialized.
         */
        aFromInit && this._loadShaderFileAsync();
        this._updateEffectsMap();
        this._registerEffectKeybindings();
        this._registerGlobalKeybindings();
    },

    disable: function() {
        this._removeKeybindings("Effect");
        this._removeKeybindings("Global");

        if (this._colorInspector !== null) {
            this._colorInspector.abort();
            this._colorInspector = null;
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
            case "pref_daltonizer_wizard_kb":
            case "pref_color_inspector_kb":
                this._registerGlobalKeybindings();
                break;
            case "trigger_effects_list":
                /* NOTE: "Partially" disable the extension and re-enable it.
                 * A "partial" disable doesn't remove Cinnamon's injections/overrides
                 * and does a "soft removal" of effects.
                 * This allows to easily add back the already applied effects and the
                 * Cinnamon overrides don't need to be removed and re-applied since they
                 * use dynamic data.
                 */
                try {
                    this.disable(true);
                } finally {
                    Mainloop.idle_add(() => {
                        this.enable();
                    });
                }
                break;
            case "trigger_settings_shortcut_creation_desktop":
            case "trigger_settings_shortcut_creation_xdg":
                let where = pref_key === "trigger_settings_shortcut_creation_desktop" ?
                    "desktop" : "xdg";
                $.generateSettingsDesktopFile(where);
                break;
        }
    }
};

function init(aXletMeta) {
    xletMeta = aXletMeta;
}

function enable() {
    try {
        assistant = new ColorBlindnessAssistant();
        assistant.enable(true);
    } catch (aErr) {
        global.logError(aErr);
    }
}

function disable() {
    assistant.disable();
    assistant = null;
}
