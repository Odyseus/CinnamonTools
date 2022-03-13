let $,
    _,
    assistant,
    C,
    ColorInspector,
    D,
    Daltonizer,
    NotificationsUtils,
    E,
    F,
    G,
    Settings,
    XletMeta;

const {
    gi: {
        Clutter,
        GLib,
        Meta,
        St
    },
    mainloop: Mainloop,
    misc: {
        params: Params
    },
    ui: {
        main: Main
    }
} = imports;

function getExtensionClass(aBaseExtension) {
    class ColorBlindnessAssistant extends aBaseExtension {
        constructor() {
            super({
                metadata: XletMeta,
                init_injection_manager: true,
                init_signal_manager: true,
                init_schedule_manager: true,
                init_keybinding_manager: true,
                settings: Settings,
                notification: $.Notification,
                pref_keys: C.EXTENSION_PREFS
            });

            this._effect_id = "color_blindness_assistant_effect";
            this._global_kbs = [
                "daltonizer_wizard_kb",
                "color_inspector_kb"
            ];

            this.effects_keybinding_manager = new G.KeybindingsManager();
            this.theme = null;
            this.stylesheet = null;
            this._allEffects = {};
            this._allEffectsIDs = [];
            this._shaderSource = "";
            this._daltonizer = null;
            this._colorInspector = null;

            if (!Settings.usage_notified) {
                $.Notification.notify(
                    G.escapeHTML(_("Read this xlet help page for usage instructions.")),
                    NotificationsUtils.NotificationUrgency.CRITICAL
                );
                Settings.usage_notified = true;
            }

            this._loadTheme();
        }

        enable(aFromInit = false) {
            /* NOTE: aFromInit is used to only perform certain calls when the
             * extension is initialized.
             */
            aFromInit && this._loadShaderFileAsync();
            this._updateEffectsMap();
            this._registerEffectKeybindings();
            this._registerGlobalKeybindings();
            Settings.apply_cinnamon_injections && this._applyCinnamonInjections();

            super.enable();
        }

        disable() {
            this.unloadStylesheet();
            this.effects_keybinding_manager.clearAllKeybindings();

            if (this._colorInspector !== null) {
                this._colorInspector.destroyUI();
                this._colorInspector = null;
            }

            if (this._daltonizer !== null) {
                this._daltonizer.destroyUI();
                this._daltonizer = null;
            }

            super.disable();
        }

        get fxMap() {
            return this._allEffects;
        }

        get fxIDs() {
            return this._allEffectsIDs;
        }

        set fxIDs(aVal) {
            delete this._allEffectsIDs;
            this._allEffectsIDs = aVal;
        }

        _updateEffectsMap() {
            delete this._allEffects;
            this._allEffects = {};

            // Stick with the JSON trick. Do not use Object.assign().
            for (const effect of JSON.parse(JSON.stringify(Settings.effects_list))) {
                effect["id"] = `${effect["base_name"]}:${effect["actor"]}:${effect["color_space"]}`;
                this._allEffects[effect.id] = Params.parse(effect, C.EffectDefaultParams, true);
            }

            /* NOTE: Objects suck!!! Since I'm constantly iterating through the effects,
             * store all of their IDs in an array for infinitely faster iterations.
             */
            this.fxIDs = Object.keys(this._allEffects);
        }

        _toggleEffect(aEffectDef) {
            let actor = null;
            switch (aEffectDef.actor) {
                case "focused_window":
                    const focusedWindow = global.display.focus_window;
                    const winType = focusedWindow.get_window_type();

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

            if (actor.hasOwnProperty(C.EFFECT_PROP_NAME) &&
                actor[C.EFFECT_PROP_NAME].id !== aEffectDef.id &&
                actor.get_effect(this._effect_id)) {
                actor.remove_effect_by_name(this._effect_id);
                actor[C.EFFECT_PROP_NAME] = null;
                delete actor[C.EFFECT_PROP_NAME];
            }

            /* NOTE: The base_name "none" is used by the daltonizer wizard.
             */
            if (aEffectDef.base_name === "none") {
                return;
            }

            if (actor.get_effect(this._effect_id)) {
                actor.remove_effect_by_name(this._effect_id);
                actor[C.EFFECT_PROP_NAME] = null;
                delete actor[C.EFFECT_PROP_NAME];
            } else {
                actor.add_effect_with_name(this._effect_id, this._getEffect(aEffectDef));
                actor[C.EFFECT_PROP_NAME] = aEffectDef;
            }
        }

        _getEffect(aEffectDef) {
            const compensate = /_compensation$/.test(aEffectDef.base_name);
            const effect = new Clutter.ShaderEffect({
                shader_type: Clutter.ShaderType.FRAGMENT_SHADER
            });

            /* NOTE: I can't make boolean uniforms to work inside the shader file. WTH!?
             * So, I use integers and move on.
             */
            effect.set_shader_source(this._shaderSource);
            effect.set_uniform_value("tex", 0);
            effect.set_uniform_value("_type", C.ShaderEffectTypeMap[aEffectDef.base_name]);
            effect.set_uniform_value("_use_cie_rgb", C.ShaderColorSpaceMap[aEffectDef.color_space]);
            effect.set_uniform_value("_compensate", compensate ? 1 : 0);

            return effect;
        }

        _registerEffectKeybindings() {
            this.effects_keybinding_manager.clearAllKeybindings();

            for (const effectID of this.fxIDs) {
                const effectDef = this.fxMap[effectID];

                if (effectDef.keybinding) {
                    this.effects_keybinding_manager.addKeybinding(
                        effectDef.id,
                        effectDef.keybinding,
                        this._toggleEffect.bind(this, effectDef)
                    );
                }
            }
        }

        toggleColorInspector() {
            if (this._daltonizer !== null && this._daltonizer.daltonizerActive) {
                this._daltonizer.hideUI();
            }

            if (this._colorInspector === null) {
                this._colorInspector = new ColorInspector.ColorInspector();
                this._colorInspector.initUI();
            }

            this._colorInspector.toggleUI();
        }

        toggleDaltonizer() {
            if (this._colorInspector !== null && this._colorInspector.inspectorActive) {
                this._colorInspector.hideUI();
            }

            if (this._daltonizer === null) {
                this._daltonizer = new Daltonizer.Daltonizer(this._toggleEffect.bind(this));
                this._daltonizer.initUI();
            }

            this._daltonizer.toggleUI();
        }

        _triggerGlobalKeybinding(aKbName) {
            switch (aKbName) {
                case "daltonizer_wizard_kb":
                    this.toggleDaltonizer();
                    break;
                case "color_inspector_kb":
                    this.toggleColorInspector();
                    break;
            }
        }

        _registerGlobalKeybindings() {
            this.$.keybinding_manager.clearAllKeybindings();

            for (const kbName of this._global_kbs) {
                this.$.keybinding_manager.addKeybinding(
                    kbName,
                    Settings[kbName],
                    this._triggerGlobalKeybinding.bind(this, kbName));
            }
        }

        _loadShaderFileAsync() {
            const shaderFile = new F.File(`${XletMeta.path}/shader.frag.glsl`);
            shaderFile.read()
                .then((aData) => {
                    this._shaderSource = aData;
                }, (aErr) => {
                    global.logError(aErr);
                });
        }

        _loadTheme(aFullReload) {
            this.$.schedule_manager.clearSchedule("load_theme");

            G.tryFn(() => {
                this.unloadStylesheet();
            }, (aErr) => {
                global.logError(aErr);
            }, () => {
                this.$.schedule_manager.setTimeout("load_theme", () => {
                    try {
                        /* NOTE: Without calling Main.themeManager._changeTheme() this xlet stylesheet
                         * doesn't reload correctly. ¬¬
                         */
                        if (aFullReload) {
                            Main.themeManager._changeTheme();
                        }

                        this.loadStylesheet();
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                }, 300);
            });
        }

        loadStylesheet() {
            const themePath = this._getCssPath();

            try {
                const themeContext = St.ThemeContext.get_for_stage(global.stage);
                this.theme = themeContext.get_theme();
            } catch (aErr) {
                global.logError(_("Error trying to get theme"));
                global.logError(aErr);
            }

            try {
                this.theme.load_stylesheet(themePath);
                this.stylesheet = themePath;
            } catch (aErr) {
                global.logError(_("Stylesheet parse error"));
                global.logError(aErr);
            }
        }

        unloadStylesheet() {
            if (this.theme && this.stylesheet) {
                try {
                    this.theme.unload_stylesheet(this.stylesheet);
                } catch (aErr) {
                    global.logError(_("Error unloading stylesheet"));
                    global.logError(aErr);
                } finally {
                    this.theme = null;
                    this.stylesheet = null;
                }
            }
        }

        _getCssPath() {
            const defaultThemepath = `${XletMeta.path}/themes/default.css`;
            const cssFile = new F.File(Settings.theme === "custom" ?
                Settings.theme_path_custom :
                defaultThemepath);

            if (cssFile.is_file) {
                return cssFile.path;
            }

            return defaultThemepath;
        }

        _applyCinnamonInjections() {
            const extScope = this;
            /* NOTE: Use try{}catch{} blocks inside all injections code because it isn't
             * a question IF it will break in the future but WHEN will be broken.
             * Heck! Even the injection mechanism might break due to the incessant new
             * "features" added to the worse programming language in existence!
             */

            /* NOTE: This injection affects Scale mode (all windows displayed in "exposé").
             */
            this.$.injection_manager.injectMethodAfter(
                imports.ui.workspace.WindowClone.prototype,
                "_init",
                function(realWindow, myContainer) { // jshint ignore:line
                    try {
                        if (this.realWindow.get_effect(extScope._effect_id) &&
                            this.realWindow.hasOwnProperty(C.EFFECT_PROP_NAME)) {
                            this.actor.add_effect_with_name(
                                extScope._effect_id,
                                extScope._getEffect(this.realWindow[C.EFFECT_PROP_NAME])
                            );
                        } else {
                            this.actor.remove_effect_by_name(extScope._effect_id);
                        }
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                }
            );

            /* NOTE: This injection affects Coverflow (3D).
             */
            this.$.injection_manager.injectMethodAfter(
                imports.ui.appSwitcher.appSwitcher3D.AppSwitcher3D.prototype,
                "_adaptClones",
                function() {
                    try {
                        for (const preview of this._previews) {
                            const winActor = preview.metaWindow.get_compositor_private();

                            if (winActor.get_effect(extScope._effect_id) &&
                                winActor.hasOwnProperty(C.EFFECT_PROP_NAME)) {
                                preview.add_effect_with_name(
                                    extScope._effect_id,
                                    extScope._getEffect(winActor[C.EFFECT_PROP_NAME])
                                );
                            } else {
                                preview.remove_effect_by_name(extScope._effect_id);
                            }
                        }
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                }

            );

            /* NOTE: This injection affects Expo mode (the preview of all workspaces).
             */
            this.$.injection_manager.injectMethodAfter(
                imports.ui.expoThumbnail.ExpoWorkspaceThumbnail.prototype,
                "syncStacking",
                function() {
                    try {
                        for (const clone of this.windows) {
                            const winActor = clone.metaWindow.get_compositor_private();

                            if (winActor.get_effect(extScope._effect_id) &&
                                winActor.hasOwnProperty(C.EFFECT_PROP_NAME)) {
                                clone.actor.add_effect_with_name(
                                    extScope._effect_id,
                                    extScope._getEffect(winActor[C.EFFECT_PROP_NAME])
                                );
                            } else {
                                clone.actor.remove_effect_by_name(extScope._effect_id);
                            }
                        }
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                }
            );

            /* NOTE: This injection affects Timeline (3D).
             */
            this.$.injection_manager.injectMethodAfter(
                imports.ui.appSwitcher.timelineSwitcher.TimelineSwitcher.prototype,
                "_adaptClones",
                function() {
                    try {
                        for (const clone of this._previews) {
                            const winActor = clone.metaWindow.get_compositor_private();

                            if (winActor.get_effect(extScope._effect_id) &&
                                winActor.hasOwnProperty(C.EFFECT_PROP_NAME)) {
                                clone.add_effect_with_name(
                                    extScope._effect_id,
                                    extScope._getEffect(winActor[C.EFFECT_PROP_NAME])
                                );
                            } else {
                                clone.remove_effect_by_name(extScope._effect_id);
                            }
                        }
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                }

            );
        }

        __connectSignals() {
            this.$.signal_manager.connect(
                Main.themeManager,
                "theme-set",
                this._loadTheme.bind(this, false)
            );

            Settings.connect(C.EXTENSION_PREFS, function(aPrefKey) {
                this.__onSettingsChanged(aPrefKey);
            }.bind(this));
        }

        __onSettingsChanged(aPrefKey) {
            switch (aPrefKey) {
                case "daltonizer_wizard_kb":
                case "color_inspector_kb":
                    this._registerGlobalKeybindings();
                    break;
                case "theme":
                case "theme_path_custom":
                    if (aPrefKey === "theme_path_custom" &&
                        Settings.theme !== "custom") {
                        return;
                    }

                    this._loadTheme(true);
                    break;
                case "apply_cinnamon_injections":
                    // FIXME: I smell disaster here. Re-evaluate the injection_manager's methods to
                    // see if it has the same problem that the schedule_manager had and I fixed.
                    try {
                        this.$.injection_manager.restoreAll();
                    } finally {
                        Mainloop.idle_add(() => {
                            Settings.apply_cinnamon_injections && this._applyCinnamonInjections();

                            return GLib.SOURCE_REMOVE;
                        });
                    }
                    break;
                case "daltonizer_compact_ui":
                    this.$.schedule_manager.setTimeout("daltonizer_destruction", () => {
                        if (this._daltonizer) {
                            this._daltonizer.destroyUI();
                            this._daltonizer = null;
                        }
                    }, 100);
                    break;
                case "color_inspector_hsl_visible":
                case "color_inspector_hex_visible":
                case "color_inspector_rgb_visible":
                    this.$.schedule_manager.setTimeout("color_inspector_destruction", () => {
                        if (this._colorInspector) {
                            this._colorInspector.destroyUI();
                            this._colorInspector = null;
                        }
                    }, 100);
                    break;
                case "effects_list_apply":
                    this._updateEffectsMap();
                    this._registerEffectKeybindings();
                    break;
            }
        }
    }

    $.Debugger.wrapObjectMethods({
        ColorBlindnessAssistant: ColorBlindnessAssistant
    });

    return new ColorBlindnessAssistant();
}

function init(aXletMeta) {
    XletMeta = aXletMeta;

    /* NOTE: I have to initialize the modules and all their exported variables
     * at this stage because the stupid asynchronicity of newer versions of Cinnamon.
     * Since I'm using Cinnamon's native settings system declared and instantiated
     * in the constants.js module (so I can use it globally from all modules and without
     * the need to pass the settings object through a trillion other objects),
     * attempting to initialize the settings outside init() fails because the stupid
     * extension isn't loaded yet. ¬¬
     */

    $ = require("js_modules/utils.js");
    C = require("js_modules/constants.js");
    ColorInspector = require("js_modules/colorInspector.js");
    D = require("js_modules/debugManager.js");
    Daltonizer = require("js_modules/daltonizer.js");
    NotificationsUtils = require("js_modules/notificationsUtils.js");
    E = require("js_modules/extensionsUtils.js");
    F = require("js_modules/customFileUtils.js");
    G = require("js_modules/globalUtils.js");

    _ = G._;
    Settings = $.Settings;

    $.Debugger.wrapObjectMethods({
        BaseExtension: E.BaseExtension
    });
}

function enable() {
    G.tryFn(() => {
        assistant = getExtensionClass(E.BaseExtension);

        Mainloop.idle_add(() => {
            assistant.enable(true);

            return GLib.SOURCE_REMOVE;
        });
    }, (aErr) => global.logError(aErr));

    return assistant ? {
        __openXletSettings: assistant.__openXletSettings
    } : null;
}

function disable() {
    if (assistant !== null) {
        assistant.disable();
        assistant = null;
    }
}
