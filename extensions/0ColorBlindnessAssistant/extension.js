//{{IMPORTER}}

let XletMeta,
    assistant,
    _,
    $,
    G,
    D,
    C,
    Colorinspector,
    Daltonizer,
    CustomFileUtils,
    Settings,
    DesktopNotificationsUtils;

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
        params: Params,
        signalManager: SignalManager,
        util: Util
    },
    ui: {
        main: Main
    }
} = imports;

function ColorBlindnessAssistant() {
    this._init.apply(this, arguments);
}

ColorBlindnessAssistant.prototype = {
    _effect_id: "color_blindness_assistant_effect",
    _global_kbs: [
        "pref_daltonizer_wizard_kb",
        "pref_color_inspector_kb"
    ],

    _init: function() {
        this.sigMan = new SignalManager.SignalManager(null);
        this._settingsDesktopFileName = "org.Cinnamon.Extensions.ColorBlindnessAssistant.Settings";
        this._settingsDesktopFilePath = GLib.get_home_dir() +
            "/.local/share/applications/%s.desktop".format(this._settingsDesktopFileName);
        this.theme = null;
        this.stylesheet = null;
        this.load_theme_id = 0;
        this._allEffects = {};
        this._allEffectsIDs = [];
        this._shaderSource = "";
        this._daltonizer = null;
        this._colorInspector = null;
        this.registeredEffectKeybindings = [];
        this.registeredGlobalKeybindings = [];

        if (!Settings.pref_usage_notified) {
            $.Notification.notify(
                G.escapeHTML(_("Read this extension help page for usage instructions.")),
                DesktopNotificationsUtils.NotificationUrgency.CRITICAL
            );
            Settings.pref_usage_notified = true;
        }

        this._loadTheme();
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

        // Mark for deletion on EOL. Cinnamon 3.6.x+
        // Replace JSON trick with Object.assign().
        let effectsList = JSON.parse(JSON.stringify(Settings.pref_effects_list));
        let i = effectsList.length;
        while (i--) {
            let e = effectsList[i];
            e["id"] = "%s:%s:%s".format(e["base_name"], e["actor"], e["color_space"]);
            this._allEffects[e.id] = Params.parse(e, C.EFFECT_DEFAULT_PARAMS, true);
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
    },

    _getEffect: function(aEffectDef) {
        let compensate = /_compensation$/.test(aEffectDef.base_name);
        let effect = new Clutter.ShaderEffect({
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
    },

    _registerEffectKeybindings: function() {
        this._removeKeybindings("Effect");

        let registerKb = (aEffectDef) => {
            let kbName = XletMeta.uuid + aEffectDef.id;
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

    toggleColorInspector: function() {
        if (this._daltonizer !== null && this._daltonizer.daltonizerActive) {
            this._daltonizer.hideUI();
        }

        if (this._colorInspector === null) {
            this._colorInspector = new Colorinspector.ColorInspector(
                Settings.pref_color_inspector_always_copy_to_clipboard,
                Settings.pref_color_inspector_animation_time / 1000
            );
            this._colorInspector.initUI();
        }

        this._colorInspector.toggleUI();
    },

    toggleDaltonizer: function() {
        if (this._colorInspector !== null && this._colorInspector.inspectorActive) {
            this._colorInspector.hideUI();
        }

        if (this._daltonizer === null) {
            this._daltonizer = new Daltonizer.Daltonizer(
                this._toggleEffect.bind(this),
                Settings.pref_daltonizer_animation_time / 1000,
                Settings.pref_daltonizer_show_actors_box,
                Settings.pref_daltonizer_show_colorspaces_box
            );
            this._daltonizer.initUI();
        }

        this._daltonizer.toggleUI();
    },

    _registerGlobalKeybindings: function() {
        this._removeKeybindings("Global");

        let registerKb = (aKbProp) => {
            let kbName = XletMeta.uuid + "Global" + aKbProp;
            Main.keybindingManager.addHotKey(
                kbName,
                Settings[aKbProp],
                () => {
                    switch (aKbProp) {
                        case "pref_daltonizer_wizard_kb":
                            this.toggleDaltonizer();
                            break;
                        case "pref_color_inspector_kb":
                            this.toggleColorInspector();
                            break;
                    }
                }
            );

            this.registeredGlobalKeybindings.push(kbName);
        };

        let i = this._global_kbs.length;
        while (i--) {
            if (Settings[this._global_kbs[i]]) {
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
        let shaderFile = Gio.file_new_for_path(XletMeta.path + "/shader.frag.glsl");

        if (shaderFile && shaderFile.query_exists(null)) {
            shaderFile.load_contents_async(null,
                (aFile, aResponce) => {
                    let success,
                        contents = "",
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

    openXletSettings: function() {
        Util.spawn_async([XletMeta.path + "/settings.py"], null);
    },

    openHelpPage: function() {
        G.xdgOpen(XletMeta.path + "/HELP.html");
    },

    _loadTheme: function(aFullReload) {
        if (this.load_theme_id > 0) {
            Mainloop.source_remove(this.load_theme_id);
            this.load_theme_id = 0;
        }

        try {
            this.unloadStylesheet();
        } catch (aErr) {
            global.logError(aErr);
        } finally {
            this.load_theme_id = Mainloop.timeout_add(300,
                () => {
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

                    this.load_theme_id = 0;
                }
            );
        }
    },

    loadStylesheet: function() {
        let themePath = this._getCssPath();

        try {
            let themeContext = St.ThemeContext.get_for_stage(global.stage);
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
    },

    unloadStylesheet: function() {
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
    },

    _getCssPath: function() {
        let defaultThemepath = XletMeta.path + "/themes/default.css";
        let cssPath = Settings.pref_theme === "custom" ?
            Settings.pref_theme_path_custom :
            defaultThemepath;

        if (/^file:\/\//.test(cssPath)) {
            cssPath = cssPath.substr(7);
        }

        try {
            let cssFile = Gio.file_new_for_path(cssPath);

            if (!cssPath || !cssFile.query_exists(null)) {
                cssPath = defaultThemepath;
            }
        } catch (aErr) {
            cssPath = defaultThemepath;
            global.logError(aErr);
        }

        return cssPath;
    },

    _applyCinnamonInjections: function() {
        let extScope = this;
        /* NOTE: Use try{}catch{} blocks inside all injections code because it isn't
         * a question IF it will break in the future but WHEN will be broken.
         * Heck! Even the injection mechanism might break due to the incessant new
         * "features" added to the worse programming language in existence!
         */

        /* NOTE: This injection affects Scale mode (all windows displayed in "exposé").
         */
        C.Injections.workspace._init = G.injectMethodAfter(
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
        C.Injections.appSwitcher3D._adaptClones = G.injectMethodAfter(
            imports.ui.appSwitcher.appSwitcher3D.AppSwitcher3D.prototype,
            "_adaptClones",
            function() {
                try {
                    let i = this._previews.length;
                    while (i--) {
                        let preview = this._previews[i];
                        let winActor = preview.metaWindow.get_compositor_private();

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
        C.Injections.expoThumbnail.syncStacking = G.injectMethodAfter(
            imports.ui.expoThumbnail.ExpoWorkspaceThumbnail.prototype,
            "syncStacking",
            function() {
                try {
                    let i = this.windows.length;
                    while (i--) {
                        let clone = this.windows[i];
                        let winActor = clone.metaWindow.get_compositor_private();

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
        C.Injections.timelineSwitcher._adaptClones = G.injectMethodAfter(
            imports.ui.appSwitcher.timelineSwitcher.TimelineSwitcher.prototype,
            "_adaptClones",
            function() {
                try {
                    let i = this._previews.length;
                    while (i--) {
                        let clone = this._previews[i];
                        let winActor = clone.metaWindow.get_compositor_private();

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
    },

    _removeCinnamonInjections: function() {
        G.removeInjection(
            imports.ui.workspace.WindowClone.prototype,
            C.Injections.workspace,
            "_init"
        );
        G.removeInjection(
            imports.ui.appSwitcher.appSwitcher3D.AppSwitcher3D.prototype,
            C.Injections.appSwitcher3D,
            "_adaptClones"
        );
        G.removeInjection(
            imports.ui.expoThumbnail.ExpoWorkspaceThumbnail.prototype,
            C.Injections.expoThumbnail,
            "syncStacking"
        );
        G.removeInjection(
            imports.ui.appSwitcher.timelineSwitcher.TimelineSwitcher.prototype,
            C.Injections.timelineSwitcher,
            "_adaptClones"
        );
    },

    enable: function(aFromInit = false) {
        /* NOTE: aFromInit is used to only perform certain calls when the
         * extension is initialized.
         */
        aFromInit && this._loadShaderFileAsync();
        this._updateEffectsMap();
        this._registerEffectKeybindings();
        this._registerGlobalKeybindings();
        Settings.pref_apply_cinnamon_injections && this._applyCinnamonInjections();
        this._connectSignals();
        this._generateSettingsDesktopFile();
    },

    disable: function() {
        /* NOTE: Set pref_desktop_file_generated to false so it forces the re-generation
         * of the desktop file (if it's needed) the next time the extension is enabled.
         */
        Settings.pref_desktop_file_generated = false;

        this._removeSettingsDesktopFile();
        this.unloadStylesheet();
        this._removeKeybindings("Effect");
        this._removeKeybindings("Global");
        this._removeCinnamonInjections();

        if (this._colorInspector !== null) {
            this._colorInspector.destroyUI();
            this._colorInspector = null;
        }

        if (this._daltonizer !== null) {
            this._daltonizer.destroyUI();
            this._daltonizer = null;
        }

        this.sigMan.disconnectAllSignals();
        Settings.destroy();
    },

    _connectSignals: function() {
        this.sigMan.connect(Main.themeManager, "theme-set", function() {
            this._loadTheme(false);
        }.bind(this));

        Settings.connect([
            "pref_daltonizer_wizard_kb",
            "pref_color_inspector_kb",
            "pref_daltonizer_animation_time",
            "pref_daltonizer_show_actors_box",
            "pref_daltonizer_show_colorspaces_box",
            "pref_color_inspector_animation_time",
            "pref_color_inspector_always_copy_to_clipboard",
            "pref_theme",
            "pref_theme_path_custom",
            "pref_apply_cinnamon_injections",
            "trigger_effects_list"
        ], function(aPrefKey) {
            this._onSettingsChanged(aPrefKey);
        }.bind(this));
    },

    _generateSettingsDesktopFile: function() {
        if (!Settings.pref_desktop_file_generated) {
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
            }
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    _onSettingsChanged: function(aPrefKey) {
        switch (aPrefKey) {
            case "pref_daltonizer_wizard_kb":
            case "pref_color_inspector_kb":
                this._registerGlobalKeybindings();
                break;
            case "pref_daltonizer_animation_time":
            case "pref_daltonizer_show_actors_box":
            case "pref_daltonizer_show_colorspaces_box":
                if (this._daltonizer !== null) {
                    this._daltonizer.animationTime = Settings.pref_daltonizer_animation_time / 1000;
                    this._daltonizer.showActorsBox = Settings.pref_daltonizer_show_actors_box;
                    this._daltonizer.showColorspacesBox = Settings.pref_daltonizer_show_colorspaces_box;
                }
                break;
            case "pref_color_inspector_animation_time":
            case "pref_color_inspector_always_copy_to_clipboard":
                if (this._colorInspector !== null) {
                    this._colorInspector.animationTime = Settings.pref_color_inspector_animation_time / 1000;
                    this._colorInspector.copyInfoToClipboard = Settings.pref_color_inspector_always_copy_to_clipboard;
                }
                break;
            case "pref_theme":
            case "pref_theme_path_custom":
                if (aPrefKey === "pref_theme_path_custom" &&
                    Settings.pref_theme !== "custom") {
                    return;
                }

                this._loadTheme(true);
                break;
            case "pref_apply_cinnamon_injections":
                try {
                    this._removeCinnamonInjections();
                } finally {
                    Mainloop.idle_add(() => {
                        Settings.pref_apply_cinnamon_injections && this._applyCinnamonInjections();

                        return GLib.SOURCE_REMOVE;
                    });
                }
                break;
            case "trigger_effects_list":
                try {
                    this.disable(true);
                } finally {
                    Mainloop.idle_add(() => {
                        this.enable();

                        return GLib.SOURCE_REMOVE;
                    });
                }
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

    G = __import("globalUtils.js");
    D = __import("debugManager.js");
    C = __import("constants.js");
    Colorinspector = __import("colorInspector.js");
    Daltonizer = __import("daltonizer.js");
    CustomFileUtils = __import("customFileUtils.js");
    $ = __import("utils.js");
    DesktopNotificationsUtils = __import("desktopNotificationsUtils.js");

    _ = G._;
    Settings = C.Settings;

    D.wrapObjectMethods($.Debugger, {
        ColorBlindnessAssistant: ColorBlindnessAssistant
    });
}

function enable() {
    try {
        assistant = new ColorBlindnessAssistant();
        assistant.enable(true);

        /* NOTE: Object needed to be able to trigger callbacks when pressing
         * buttons in the settings window. Cinnamon 3.0.x, we are screwed.
         */
        return {
            openXletSettings: assistant.openXletSettings
        };
    } catch (aErr) {
        global.logError(aErr);
    }

    return null;
}

function disable() {
    assistant.disable();
    assistant = null;
}
