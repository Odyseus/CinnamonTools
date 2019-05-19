let $,
    Constants,
    Colorinspector,
    Daltonizer;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    Constants = require("./constants.js");
    Colorinspector = require("./colorInspector.js");
    Daltonizer = require("./daltonizer.js");
    $ = require("./utils.js");
} else {
    Constants = imports.ui.extensionSystem.extensions["{{UUID}}"].constants;
    Colorinspector = imports.ui.extensionSystem.extensions["{{UUID}}"].colorInspector;
    Daltonizer = imports.ui.extensionSystem.extensions["{{UUID}}"].daltonizer;
    $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
}

const {
    gi: {
        Clutter,
        Gio,
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
        main: Main,
        messageTray: MessageTray,
        settings: Settings
    }
} = imports;

const {
    _,
    NotificationsUrgency,
    ShaderEffectTypeMap,
    ShaderColorSpaceMap,
    EFFECT_PROP_NAME,
    EFFECT_DEFAULT_PARAMS
} = Constants;

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
            this.sigMan = new SignalManager.SignalManager(null);
            this.workspaceInjection = null;
            this.appSwitcher3DInjection = null;
            this.expoThumbnailInjection = null;
            this.timelineSwitcherInjection = null;
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
            this._notificationSource = null;
            this.desktopNotification = null;
            this._notificationParams = {
                titleMarkup: true,
                bannerMarkup: true,
                bodyMarkup: true,
                clear: true
            };
        }, () => {
            if (!this.pref_usage_notified) {
                this._notifyMessage(
                    _("Read this extension help page for usage instructions."),
                    NotificationsUrgency.CRITICAL
                );
                this.pref_usage_notified = true;
            }

            this._loadTheme();

            this.sigMan.connect(Main.themeManager, "theme-set", function() {
                this._loadTheme(false);
            }.bind(this));
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
            "pref_usage_notified",
            "pref_effects_list",
            "pref_daltonizer_wizard_kb",
            "pref_daltonizer_animation_time",
            "pref_daltonizer_show_actors_box",
            "pref_daltonizer_show_colorspaces_box",
            "pref_color_inspector_kb",
            "pref_color_inspector_animation_time",
            "pref_color_inspector_always_copy_to_clipboard",
            "pref_theme",
            "pref_theme_path_custom",
            "pref_apply_cinnamon_injections",
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

        // Mark for deletion on EOL. Cinnamon 3.6.x+
        // Replace JSON trick with Object.assign().
        let effectsList = JSON.parse(JSON.stringify(this.pref_effects_list));
        let i = effectsList.length;
        while (i--) {
            let e = effectsList[i];
            e["id"] = "%s:%s:%s".format(e["base_name"], e["actor"], e["color_space"]);
            this._allEffects[e.id] = Params.parse(e, EFFECT_DEFAULT_PARAMS, true);
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

        if (actor.hasOwnProperty(EFFECT_PROP_NAME) &&
            actor[EFFECT_PROP_NAME].id !== aEffectDef.id &&
            actor.get_effect(this._effect_id)) {
            actor.remove_effect_by_name(this._effect_id);
            actor[EFFECT_PROP_NAME] = null;
            delete actor[EFFECT_PROP_NAME];
        }

        /* NOTE: The base_name "none" is used by the daltonizer wizard.
         */
        if (aEffectDef.base_name === "none") {
            return;
        }

        if (actor.get_effect(this._effect_id)) {
            actor.remove_effect_by_name(this._effect_id);
            actor[EFFECT_PROP_NAME] = null;
            delete actor[EFFECT_PROP_NAME];
        } else {
            actor.add_effect_with_name(this._effect_id, this._getEffect(aEffectDef));
            actor[EFFECT_PROP_NAME] = aEffectDef;
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
        effect.set_uniform_value("_type", ShaderEffectTypeMap[aEffectDef.base_name]);
        effect.set_uniform_value("_use_cie_rgb", ShaderColorSpaceMap[aEffectDef.color_space]);
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

    toggleColorInspector: function() {
        if (this._daltonizer !== null && this._daltonizer.daltonizerActive) {
            this._daltonizer.hideUI();
        }

        if (this._colorInspector === null) {
            this._colorInspector = new Colorinspector.ColorInspector(
                this._notifyMessage.bind(this),
                this.pref_color_inspector_always_copy_to_clipboard,
                this.pref_color_inspector_animation_time / 1000
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
                this.pref_daltonizer_animation_time / 1000,
                this.pref_daltonizer_show_actors_box,
                this.pref_daltonizer_show_colorspaces_box
            );
            this._daltonizer.initUI();
        }

        this._daltonizer.toggleUI();
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

    _ensureNotificationSource: function() {
        if (!this._notificationSource) {
            this._notificationSource = new $.MessageTraySource();
            this._notificationSource.connect("destroy", () => {
                this._notificationSource = null;
            });

            if (Main.messageTray) {
                Main.messageTray.add(this._notificationSource);
            }
        }
    },

    _notifyMessage: function(aMessage, aUrgency = NotificationsUrgency.NORMAL, aButtons = []) {
        this._ensureNotificationSource();

        let body = "";

        body += aMessage + "\n";

        body = body.trim();

        if (this._notificationSource && !this.desktopNotification) {
            this.desktopNotification = new MessageTray.Notification(
                this._notificationSource,
                " ",
                " ",
                this._notificationParams
            );
            this.desktopNotification.setUrgency(aUrgency);
            this.desktopNotification.setTransient(false);
            this.desktopNotification.setResident(true);
            this.desktopNotification.connect("destroy", () => {
                this.desktopNotification = null;
            });
            this.desktopNotification.connect("action-invoked", (aSource, aAction) => {
                switch (aAction) {
                    case "dialog-information":
                        this.openHelpPage();
                        break;
                }
            });

            this.desktopNotification.addButton("dialog-information", _("Help"));
        }

        if (body) {
            this.desktopNotification.update(
                $.escapeHTML(_(xletMeta.name)),
                body,
                this._desktopNotificationParams
            );

            /* FIXME: Buttons should be removed before adding more.
             * It should remove all buttons, if any, and leave the default ones
             * (like the "Help" button).
             */
            for (let i = aButtons.length - 1; i >= 0; i--) {
                this.desktopNotification.addButton(aButtons[i].action, aButtons[i].label);
            }

            this._notificationSource.notify(this.desktopNotification);
        } else {
            this.desktopNotification && this.desktopNotification.destroy();
        }
    },

    openExtensionSettings: function() {
        Util.spawn_async([xletMeta.path + "/settings.py"], null);
    },

    openHelpPage: function() {
        this._xdgOpen(xletMeta.path + "/HELP.html");
    },

    _xdgOpen: function() {
        Util.spawn_async(["xdg-open"].concat(Array.prototype.slice.call(arguments)), null);
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
        let defaultThemepath = xletMeta.path + "/themes/default.css";
        let cssPath = this.pref_theme === "custom" ?
            this.pref_theme_path_custom :
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
        if (!this.workspaceInjection) {
            this.workspaceInjection = $.injectAfter(
                imports.ui.workspace.WindowClone.prototype,
                "_init",
                function(realWindow, myContainer) { // jshint ignore:line
                    try {
                        if (this.realWindow.get_effect(extScope._effect_id) &&
                            this.realWindow.hasOwnProperty(EFFECT_PROP_NAME)) {
                            this.actor.add_effect_with_name(
                                extScope._effect_id,
                                extScope._getEffect(this.realWindow[EFFECT_PROP_NAME])
                            );
                        } else {
                            this.actor.remove_effect_by_name(extScope._effect_id);
                        }
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                }
            );
        }

        /* NOTE: This injection affects Coverflow (3D).
         */
        if (!this.appSwitcher3DInjection) {
            this.appSwitcher3DInjection = $.injectAfter(
                imports.ui.appSwitcher.appSwitcher3D.AppSwitcher3D.prototype,
                "_adaptClones",
                function() {
                    try {
                        let i = this._previews.length;
                        while (i--) {
                            let preview = this._previews[i];
                            let winActor = preview.metaWindow.get_compositor_private();

                            if (winActor.get_effect(extScope._effect_id) &&
                                winActor.hasOwnProperty(EFFECT_PROP_NAME)) {
                                preview.add_effect_with_name(
                                    extScope._effect_id,
                                    extScope._getEffect(winActor[EFFECT_PROP_NAME])
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
        }

        /* NOTE: This injection affects Expo mode (the preview of all workspaces).
         */
        if (!this.expoThumbnailInjection) {
            this.expoThumbnailInjection = $.injectAfter(
                imports.ui.expoThumbnail.ExpoWorkspaceThumbnail.prototype,
                "syncStacking",
                function() {
                    try {
                        let i = this.windows.length;
                        while (i--) {
                            let clone = this.windows[i];
                            let winActor = clone.metaWindow.get_compositor_private();

                            if (winActor.get_effect(extScope._effect_id) &&
                                winActor.hasOwnProperty(EFFECT_PROP_NAME)) {
                                clone.actor.add_effect_with_name(
                                    extScope._effect_id,
                                    extScope._getEffect(winActor[EFFECT_PROP_NAME])
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
        }

        /* NOTE: This injection affects Timeline (3D).
         */
        if (!this.timelineSwitcherInjection) {
            this.timelineSwitcherInjection = $.injectAfter(
                imports.ui.appSwitcher.timelineSwitcher.TimelineSwitcher.prototype,
                "_adaptClones",
                function() {
                    try {
                        let i = this._previews.length;
                        while (i--) {
                            let clone = this._previews[i];
                            let winActor = clone.metaWindow.get_compositor_private();

                            if (winActor.get_effect(extScope._effect_id) &&
                                winActor.hasOwnProperty(EFFECT_PROP_NAME)) {
                                clone.add_effect_with_name(
                                    extScope._effect_id,
                                    extScope._getEffect(winActor[EFFECT_PROP_NAME])
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
    },

    _removeCinnamonInjections: function() {
        if (this.workspaceInjection) {
            $.removeInjection(
                imports.ui.workspace.WindowClone.prototype,
                "_init",
                this.workspaceInjection
            );
            this.workspaceInjection = null;
        }

        if (this.appSwitcher3DInjection) {
            $.removeInjection(
                imports.ui.appSwitcher.appSwitcher3D.AppSwitcher3D.prototype,
                "_adaptClones",
                this.appSwitcher3DInjection
            );
            this.appSwitcher3DInjection = null;
        }

        if (this.expoThumbnailInjection) {
            $.removeInjection(
                imports.ui.expoThumbnail.ExpoWorkspaceThumbnail.prototype,
                "syncStacking",
                this.expoThumbnailInjection
            );
            this.expoThumbnailInjection = null;
        }

        if (this.timelineSwitcherInjection) {
            $.removeInjection(
                imports.ui.appSwitcher.timelineSwitcher.TimelineSwitcher.prototype,
                "_adaptClones",
                this.timelineSwitcherInjection
            );
            this.timelineSwitcherInjection = null;
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
        this.pref_apply_cinnamon_injections && this._applyCinnamonInjections();
    },

    disable: function() {
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
            case "pref_daltonizer_animation_time":
            case "pref_daltonizer_show_actors_box":
            case "pref_daltonizer_show_colorspaces_box":
                if (this._daltonizer !== null) {
                    this._daltonizer.animationTime = this.pref_daltonizer_animation_time / 1000;
                    this._daltonizer.showActorsBox = this.pref_daltonizer_show_actors_box;
                    this._daltonizer.showColorspacesBox = this.pref_daltonizer_show_colorspaces_box;
                }
                break;
            case "pref_color_inspector_animation_time":
            case "pref_color_inspector_always_copy_to_clipboard":
                if (this._colorInspector !== null) {
                    this._colorInspector.animationTime = this.pref_color_inspector_animation_time / 1000;
                    this._colorInspector.copyInfoToClipboard = this.pref_color_inspector_always_copy_to_clipboard;
                }
                break;
            case "pref_theme":
            case "pref_theme_path_custom":
                if (pref_key === "pref_theme_path_custom" &&
                    this.pref_theme !== "custom") {
                    return;
                }

                this._loadTheme(true);
                break;
            case "pref_apply_cinnamon_injections":
                try {
                    this._removeCinnamonInjections();
                } finally {
                    Mainloop.idle_add(() => {
                        this.pref_apply_cinnamon_injections && this._applyCinnamonInjections();
                    });
                }
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

        /* NOTE: Object needed to be able to trigger callbacks when pressing
         * buttons in the settings window. Cinnamon 3.0.x, we are screwed.
         */
        return {
            openSettings: assistant.openExtensionSettings
        };
    } catch (aErr) {
        global.logError(aErr);
    }
}

function disable() {
    assistant.disable();
    assistant = null;
}
