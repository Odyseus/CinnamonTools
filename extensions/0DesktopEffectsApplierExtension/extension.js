// {{IMPORTER}}

let desktopEffects = null;

let XletMeta,
    _,
    $,
    G,
    D,
    C,
    CustomFileUtils,
    Settings,
    DesktopNotificationsUtils,
    EffectsApplier;

const {
    gi: {
        Clutter,
        Gio,
        GLib
    },
    mainloop: Mainloop,
    misc: {
        params: Params,
        util: Util
    },
    ui: {
        main: Main
    }
} = imports;

function DesktopEffectsApplier() {
    this._init.apply(this, arguments);
}

DesktopEffectsApplier.prototype = {
    effectTypes: [
        "shader",
        "color",
        "desaturation",
        "contrast",
        "brightness"
    ],

    injectionsStorage: {
        workspace: null,
        appSwitcher3D: null,
        expoThumbnail: null,
        timelineSwitcher: null
    },

    _init: function() {
        this._settingsDesktopFileName = "org.Cinnamon.Extensions.DesktopEffectsApplier.Settings";
        this._settingsDesktopFilePath = GLib.get_home_dir() +
            "/.local/share/applications/%s.desktop".format(this._settingsDesktopFileName);
        this._allEffects = {};
        this._allEffectsIDs = [];
        this.registeredEffectKeybindings = [];
        this.registeredGlobalKeybindings = [];

        if (!Settings.pref_usage_notified) {
            $.Notification.notify(
                G.escapeHTML(_("Read this extension help page for usage instructions.")),
                DesktopNotificationsUtils.NotificationUrgency.CRITICAL
            );
            Settings.pref_usage_notified = true;
        }
    },

    get fxMap() {
        return this._allEffects;
    },

    get fxIDs() {
        return this._allEffectsIDs;
    },

    _updateEffectsMap: function() {
        delete this._allEffectsIDs;
        this._allEffectsIDs = [];

        delete this._allEffects;
        this._allEffects = {};

        let t = this.effectTypes.length;
        while (t--) {
            // NOTE: This is to avoid generating effects with duplicated IDs. Since it would be to
            // complex to check duplicated effects on the settings framework side, I imply force
            // unique IDs here.
            let idSuffix = 1;
            let effectType = this.effectTypes[t];
            // Mark for deletion on EOL. Cinnamon 3.6.x+
            // Replace JSON trick with Object.assign().
            let effectsList = JSON.parse(JSON.stringify(Settings["pref_" + effectType + "_list"]));
            let i = effectsList.length;
            while (i--) {
                let e = effectsList[i];

                switch (effectType) {
                    case "shader":
                    case "color":
                    case "desaturation":
                        /* NOTE: The String() call is because an effect of type desaturation
                         * returns a float, not a string.
                         */
                        e["id"] = effectType +
                            String(e["base_name"]).replace(C.PROP_NAME_CLEANER_RE, "_") +
                            "_" + idSuffix;
                        break;
                    case "contrast":
                    case "brightness":
                        e["id"] = (effectType +
                                e["red"] + e["green"] + e["blue"]).replace(C.PROP_NAME_CLEANER_RE, "_") +
                            "_" + idSuffix;
                        break;
                }

                e["type"] = effectType;
                e["extra_shaders_path"] = Settings.pref_extra_shaders_path;
                this._allEffects[e.id] = Params.parse(e, C.EFFECT_DEFAULT_PARAMS, true);
                this._allEffectsIDs.push(e.id);

                idSuffix += 1;
            }
        }
    },

    _iterateAllWindows: function(aEffectObj, aAction) {
        let isListOfActors = false;
        let onlyNonMinimized = /_non_minimized_/.test(aAction);
        let allWindows;

        switch (aAction) {
            case "all_windows":
            case "all_non_minimized_windows":
                isListOfActors = true;
                allWindows = global.get_window_actors();
                break;
            case "all_windows_current_workspace":
            case "all_non_minimized_windows_current_workspace":
                allWindows = global.screen.get_active_workspace().list_windows();
                break;
                /* TODO: Multi-monitor support.
                 * Since I don't have a multi-monitor setup, I can't test this.
                 * I don't have a f*cking crystal ball to read documentation that doesn't
                 * exist and I already spent all the hours that I was willing to waste
                 * reading source code in C.
                 */
                // case "all_windows_current_monitor":
                // case "all_non_minimized_windows_current_monitor":
                //     break;
        }

        allWindows = allWindows.filter((aWin) => {
            let win = isListOfActors ? aWin.metaWindow : aWin;
            let isAllowed = win.get_window_type() in C.ALLOWED_WIN_TYPES;

            if (onlyNonMinimized && win.minimized) {
                isAllowed = false;
            }

            return isAllowed;
        });

        let w = allWindows.length;

        if (w > 0) {
            while (w--) {
                let actor = isListOfActors ?
                    allWindows[w] :
                    allWindows[w].get_compositor_private();

                if (!actor) {
                    continue;
                }

                this._toggleEffect(aEffectObj, actor);
            }
        }
    },

    _toggleEffect: function(aEffectObj, aActor = null) {
        if (!aActor || !(aActor instanceof Clutter.Actor)) {
            return;
        }

        if (aActor.get_effect(aEffectObj.id)) {
            EffectsApplier.removeEffect(aEffectObj.id, aActor);
        } else {
            EffectsApplier.addEffect(aEffectObj, aActor);
        }
    },

    _registerEffectKeybindings: function() {
        this._removeKeybindings("Effect");

        let registerKb = (aEffect, aAction, aKb) => {
            let kbName = XletMeta.uuid + aEffect.id + aAction;
            Main.keybindingManager.addHotKey(
                kbName,
                aKb,
                () => this._runEffectKeybindingAction(aEffect, aAction)
            );

            this.registeredEffectKeybindings.push(kbName);
        };

        let e = this.fxIDs.length;
        while (e--) {
            let effect = this.fxMap[this.fxIDs[e]];
            let i = 4;
            while (i--) {
                let val = effect["trigger_" + i];
                if (effect["trigger_" + i] !== "::") {
                    let opts = val.split("::");

                    if (opts.length === 2 && opts[0] && opts[1]) {
                        registerKb(effect, opts[1], opts[0]);
                    }
                }
            }
        }
    },

    _registerGlobalKeybindings: function() {
        this._removeKeybindings("Global");

        let registerKb = (aAction, aKb) => {
            let kbName = XletMeta.uuid + "Global" + aAction;
            Main.keybindingManager.addHotKey(
                kbName,
                aKb,
                () => this._runGlobalKeybindingAction(aAction)
            );

            this.registeredGlobalKeybindings.push(kbName);
        };

        // Mark for deletion on EOL. Cinnamon 3.6.x+
        // Replace JSON trick with Object.assign().
        let globalKbs = JSON.parse(JSON.stringify(Settings.pref_global_keybindings));
        let i = globalKbs.length;
        while (i--) {
            /* NOTE: Do not allow to register a keybinding without an action
             * nor an action without a keybinding. Duh!
             */
            if (globalKbs[i].action && globalKbs[i].keybinding) {
                registerKb(globalKbs[i].action, globalKbs[i].keybinding);
            }
        }
    },

    _removeKeybindings: function(aType) {
        /* NOTE: All registered keybinding names are stored in their individual properties.
         * This makes it easy to remove them so I don't have to constantly re-create
         * these names.
         */
        let kbType = "registered" + aType + "Keybindings";
        let i = this[kbType].length;
        while (i--) {
            Main.keybindingManager.removeHotKey(this[kbType][i]);
        }

        delete this[kbType];
        this[kbType] = [];
    },

    _runEffectKeybindingAction: function(aEffect, aAction) {
        switch (aAction) {
            case "all_windows":
            case "all_windows_current_workspace":
            case "all_non_minimized_windows":
            case "all_non_minimized_windows_current_workspace":
                /* TODO: Multi-monitor support.
                 */
                // case "all_windows_current_monitor":
                // case "all_non_minimized_windows_current_monitor":
                this._iterateAllWindows(aEffect, aAction);
                break;
            case "focused_window":
                this._toggleEffect(
                    aEffect,
                    global.display.focus_window && global.display.focus_window.get_compositor_private()
                );
                break;
            case "screen":
                this._toggleEffect(aEffect, Main.uiGroup);
                break;
        }
    },

    _runGlobalKeybindingAction: function(aAction) {
        switch (aAction) {
            case "clear_all_windows_effects":
                this.clearAllWindowsEffects();
                break;
            case "clear_all_windows_effects_current_workspace":
                break;
                /* TODO: Multi-monitor support.
                 */
                // case "clear_all_windows_effects_current_monitor":
            case "clear_all_screen_effects":
                this.clearAllScreenEffects();
                break;
            case "open_extension_settings":
                this.openXletSettings();
                break;
        }
    },

    _applyCinnamonInjections: function() {
        let extScope = this;

        /* NOTE: This injection affects Scale mode (all windows displayed in "exposé").
         */
        C.Injections.workspace._init = G.injectMethodAfter(
            imports.ui.workspace.WindowClone.prototype,
            "_init",
            function(realWindow, myContainer) { // jshint ignore:line
                try {
                    for (let i = extScope.fxIDs.length - 1; i >= 0; i--) {
                        let id = extScope.fxIDs[i];
                        if (this.realWindow.get_effect(id) &&
                            extScope.actorHasEffectStored(this.realWindow, id)) {
                            this.actor.add_effect_with_name(
                                id,
                                this.realWindow[C.EFFECTS_PROP_NAME][id].getNewEffect(this.actor)
                            );
                        } else {
                            this.actor.remove_effect_by_name(id);
                        }
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
                        let e = extScope.fxIDs.length;
                        while (e--) {
                            let id = extScope.fxIDs[e];
                            let preview = this._previews[i];
                            let winActor = preview.metaWindow.get_compositor_private();

                            if (winActor.get_effect(id) &&
                                extScope.actorHasEffectStored(winActor, id)) {
                                preview.add_effect_with_name(
                                    id,
                                    winActor[C.EFFECTS_PROP_NAME][id].getNewEffect(preview)
                                );
                            } else {
                                preview.remove_effect_by_name(id);
                            }
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
                        let e = extScope.fxIDs.length;
                        while (e--) {
                            let id = extScope.fxIDs[e];
                            let clone = this.windows[i];
                            let winActor = clone.metaWindow.get_compositor_private();

                            if (winActor.get_effect(id) &&
                                extScope.actorHasEffectStored(winActor, id)) {
                                clone.actor.add_effect_with_name(
                                    id,
                                    winActor[C.EFFECTS_PROP_NAME][id].getNewEffect(clone.actor)
                                );
                            } else {
                                clone.actor.remove_effect_by_name(id);
                            }
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
                        let e = extScope.fxIDs.length;
                        while (e--) {
                            let id = extScope.fxIDs[e];
                            let clone = this._previews[i];
                            let winActor = clone.metaWindow.get_compositor_private();

                            if (winActor.get_effect(id) &&
                                extScope.actorHasEffectStored(winActor, id)) {
                                clone.add_effect_with_name(
                                    id,
                                    winActor[C.EFFECTS_PROP_NAME][id].getNewEffect(clone)
                                );
                            } else {
                                clone.remove_effect_by_name(id);
                            }
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

    enable: function() {
        this._updateEffectsMap();
        this._registerEffectKeybindings();
        this._registerGlobalKeybindings();
        Settings.pref_apply_cinnamon_injections && this._applyCinnamonInjections();

        this._connectSignals();
        this._generateSettingsDesktopFile();
    },

    disable: function() {
        /* NOTE: Set pref_desktop_file_generated to false so it forces the re-generation
         * of the desktop file the next time the extension is enabled.
         */
        Settings.pref_desktop_file_generated = false;

        this._removeSettingsDesktopFile();
        this._removeKeybindings("Effect");
        this._removeKeybindings("Global");
        this._removeCinnamonInjections();
        this.clearAllWindowsEffects();
        this.clearAllScreenEffects();
        Settings.destroy();
    },

    reApplyAllWindowsEffects: function() {
        /* NOTE: Here are re-applied all effects to all opened windows.
         * This only works after disabling and re-enabling the extension or
         * after applying the changes made to the effects lists.
         */
        let allWinActors = global.get_window_actors();
        let w = allWinActors.length;
        while (w--) {
            let e = this.fxIDs.length;
            while (e--) {
                let id = this.fxIDs[e];

                if (this.actorHasEffectStored(allWinActors[w], id)) {
                    allWinActors[w].add_effect_with_name(
                        id,
                        allWinActors[w][C.EFFECTS_PROP_NAME][id].getNewEffect(allWinActors[w])
                    );
                } else {
                    allWinActors[w].remove_effect_by_name(id);
                }
            }
        }
    },

    softlyClearAllEffects: function() {
        let allActors = global.get_window_actors().concat([Main.uiGroup]);
        let a = allActors.length;
        while (a--) {
            if (!allActors[a]) {
                continue;
            }

            let e = this.fxIDs.length;
            while (e--) {
                if (allActors[a].get_effect(this.fxIDs[e])) {
                    allActors[a].remove_effect_by_name(this.fxIDs[e]);
                }
            }
        }
    },

    actorHasEffectStored: function(aActor, aEffectId) {
        return aActor.hasOwnProperty(C.EFFECTS_PROP_NAME) &&
            aActor[C.EFFECTS_PROP_NAME].hasOwnProperty(aEffectId);
    },

    clearAllWindowsEffects: function() {
        let allWinActors = global.get_window_actors();
        let i = allWinActors.length;
        while (i--) {
            if (allWinActors[i].hasOwnProperty(C.EFFECTS_PROP_NAME)) {
                allWinActors[i][C.EFFECTS_PROP_NAME].removeAllEffects();
                allWinActors[i][C.EFFECTS_PROP_NAME] = null;
                delete allWinActors[i][C.EFFECTS_PROP_NAME];
            }
        }
    },

    clearAllScreenEffects: function() {
        if (Main.uiGroup.hasOwnProperty(C.EFFECTS_PROP_NAME)) {
            Main.uiGroup[C.EFFECTS_PROP_NAME].removeAllEffects();
            Main.uiGroup[C.EFFECTS_PROP_NAME] = null;
            delete Main.uiGroup[C.EFFECTS_PROP_NAME];
        }
    },

    openXletSettings: function() {
        Util.spawn_async([XletMeta.path + "/settings.py"], null);
    },

    openHelpPage: function() {
        G.xdgOpen(XletMeta.path + "/HELP.html");
    },

    _connectSignals: function() {
        Settings.connect([
            "pref_extra_shaders_path",
            "pref_global_keybindings",
            "pref_shader_list",
            "pref_color_list",
            "pref_desaturation_list",
            "pref_contrast_list",
            "pref_brightness_list",
            "pref_usage_notified",
            "pref_apply_cinnamon_injections",
            "trigger_shader_list_changed",
            "trigger_color_list_changed",
            "trigger_desaturation_list_changed",
            "trigger_contrast_list_changed",
            "trigger_brightness_list_changed",
            "trigger_global_keybindings_changed"
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
            case "trigger_global_keybindings_changed":
                this._registerGlobalKeybindings();
                break;
            case "trigger_shader_list_changed":
            case "trigger_color_list_changed":
            case "trigger_desaturation_list_changed":
            case "trigger_contrast_list_changed":
            case "trigger_brightness_list_changed":
                this.softlyClearAllEffects();
                this._updateEffectsMap();
                this._registerEffectKeybindings();

                Mainloop.idle_add(() => {
                    this.reApplyAllWindowsEffects();

                    return GLib.SOURCE_REMOVE;
                });
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
        }
    }
};

function init(aXletMeta) {
    XletMeta = aXletMeta;

    C = __import("constants.js");
    G = __import("globalUtils.js");
    D = __import("debugManager.js");
    CustomFileUtils = __import("customFileUtils.js");
    $ = __import("utils.js");
    DesktopNotificationsUtils = __import("desktopNotificationsUtils.js");
    EffectsApplier = __import("effectsApplier.js");

    _ = G._;
    Settings = C.Settings;
}

function enable() {
    D.wrapObjectMethods($.Debugger, {
        DesktopEffectsApplier: DesktopEffectsApplier
    });

    try {
        desktopEffects = new DesktopEffectsApplier();
        desktopEffects.enable();

        /* NOTE: Object needed to be able to trigger callbacks when pressing
         * buttons in the settings window. Cinnamon 3.0.x, we are screwed.
         */
        return {
            openXletSettings: desktopEffects.openXletSettings
        };
    } catch (aErr) {
        global.logError(aErr);
    }

    return null;
}

function disable() {
    desktopEffects.disable();
    desktopEffects = null;
}
