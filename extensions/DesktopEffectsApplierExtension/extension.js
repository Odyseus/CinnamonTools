let $,
    _,
    C,
    D,
    NotificationsUtils,
    E,
    EffectsApplier,
    G,
    Settings,
    XletMeta,
    desktopEffects = null;

const {
    gi: {
        Clutter,
        GLib
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
    class DesktopEffectsApplier extends aBaseExtension {
        constructor() {
            super({
                metadata: XletMeta,
                init_injection_manager: true,
                init_keybinding_manager: true,
                settings: Settings,
                notification: $.Notification,
                pref_keys: C.EXTENSION_PREFS
            });

            this.effectTypes = [
                "shader",
                "color",
                "desaturation",
                "contrast",
                "brightness"
            ];

            this._allEffects = {};
            this._allEffectsIDs = [];
            this.effects_keybinding_manager = new G.KeybindingsManager();

            if (!Settings.usage_notified) {
                $.Notification.notify(
                    G.escapeHTML(_("Read this xlet help page for usage instructions.")),
                    NotificationsUtils.NotificationUrgency.CRITICAL
                );
                Settings.usage_notified = true;
            }
        }

        enable() {
            this._updateEffectsMap();
            this._registerEffectKeybindings();
            this._registerGlobalKeybindings();
            Settings.apply_cinnamon_injections && this._applyCinnamonInjections();

            super.enable();
        }

        disable() {
            this.effects_keybinding_manager.clearAllKeybindings();
            this.clearAllWindowsEffects();
            this.clearAllScreenEffects();

            super.disable();
        }

        get fxMap() {
            return this._allEffects;
        }

        get fxIDs() {
            return this._allEffectsIDs;
        }

        _updateEffectsMap() {
            delete this._allEffectsIDs;
            this._allEffectsIDs = [];

            delete this._allEffects;
            this._allEffects = {};

            for (const effectType of this.effectTypes) {
                // NOTE: This is to avoid generating effects with duplicated IDs. Since it would be to
                // complex to check duplicated effects on the settings framework side, I imply force
                // unique IDs here.
                let idSuffix = 1;

                // Stick with the JSON trick. Do not use Object.assign().
                for (const effect of JSON.parse(JSON.stringify(Settings[`${effectType}_list`]))) {
                    switch (effectType) {
                        case "shader":
                        case "color":
                        case "desaturation":
                            /* NOTE: The String() call is because an effect of type desaturation
                             * returns a float, not a string.
                             */
                            effect["id"] = effectType +
                                String(effect["base_name"]).replace(C.PROP_NAME_CLEANER_RE, "_") +
                                `_${idSuffix}`;
                            break;
                        case "contrast":
                        case "brightness":
                            effect["id"] = (effectType +
                                    effect["red"] + effect["green"] + effect["blue"]).replace(C.PROP_NAME_CLEANER_RE, "_") +
                                `_${idSuffix}`;
                            break;
                    }

                    effect["type"] = effectType;
                    effect["extra_shaders_path"] = Settings.extra_shaders_path;
                    this._allEffects[effect.id] = Params.parse(effect, C.EffectDefaultParams, true);
                    this._allEffectsIDs.push(effect.id);

                    idSuffix += 1;
                }
            }
        }

        _iterateAllWindows(aEffectObj, aAction) {
            let isListOfActors = false;
            const onlyNonMinimized = /_non_minimized_/.test(aAction);
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
                const win = isListOfActors ? aWin.metaWindow : aWin;
                let isAllowed = win.get_window_type() in C.ALLOWED_WIN_TYPES;

                if (onlyNonMinimized && win.minimized) {
                    isAllowed = false;
                }

                return isAllowed;
            });

            for (const win of allWindows) {
                const actor = isListOfActors ?
                    win :
                    win.get_compositor_private();

                if (!actor) {
                    continue;
                }

                this._toggleEffect(aEffectObj, actor);
            }
        }

        _toggleEffect(aEffectObj, aActor = null) {
            if (!aActor || !(aActor instanceof Clutter.Actor)) {
                return;
            }

            if (aActor.get_effect(aEffectObj.id)) {
                EffectsApplier.removeEffect(aEffectObj.id, aActor);
            } else {
                EffectsApplier.addEffect(aEffectObj, aActor);
            }
        }

        _registerEffectKeybindings() {
            this.effects_keybinding_manager.clearAllKeybindings();

            for (const effectID of this.fxIDs) {
                const effect = this.fxMap[effectID];

                for (const triggerID of [...Array(4).keys()]) {
                    const val = effect[`trigger_${triggerID}`];

                    if (effect[`trigger_${triggerID}`] !== "::") {
                        const opts = val.split("::");

                        if (opts.length === 2 && opts[0] && opts[1]) {
                            this.effects_keybinding_manager.addKeybinding(
                                effect.id + opts[1],
                                opts[0],
                                this._runEffectKeybindingAction.bind(this, effect, opts[1])
                            );
                        }
                    }
                }
            }
        }

        _registerGlobalKeybindings() {
            this.$.keybinding_manager.clearAllKeybindings();

            for (const kb of JSON.parse(JSON.stringify(Settings.global_keybindings))) {
                // NOTE: Do not allow to register a keybinding without an action
                // nor an action without a keybinding. Duh!
                if (kb.action && kb.keybinding) {
                    this.$.keybinding_manager.addKeybinding(
                        kb.action,
                        kb.keybinding,
                        this._runGlobalKeybindingAction.bind(this, kb.action)
                    );
                }
            }
        }

        _runEffectKeybindingAction(aEffect, aAction) {
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
        }

        _runGlobalKeybindingAction(aAction) {
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
                    this.__openXletSettings();
                    break;
            }
        }

        _applyCinnamonInjections() {
            const extScope = this;

            /* NOTE: This injection affects Scale mode (all windows displayed in "exposé").
             */
            this.$.injection_manager.injectMethodAfter(
                imports.ui.workspace.WindowClone.prototype,
                "_init",
                function(realWindow, myContainer) { // jshint ignore:line
                    try {
                        for (let i = extScope.fxIDs.length - 1; i >= 0; i--) {
                            const id = extScope.fxIDs[i];
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
            this.$.injection_manager.injectMethodAfter(
                imports.ui.appSwitcher.appSwitcher3D.AppSwitcher3D.prototype,
                "_adaptClones",
                function() {
                    try {
                        for (const preview of this._previews) {
                            for (const effectID of extScope.fxIDs) {
                                const winActor = preview.metaWindow.get_compositor_private();

                                if (winActor.get_effect(effectID) &&
                                    extScope.actorHasEffectStored(winActor, effectID)) {
                                    preview.add_effect_with_name(
                                        effectID,
                                        winActor[C.EFFECTS_PROP_NAME][effectID].getNewEffect(preview)
                                    );
                                } else {
                                    preview.remove_effect_by_name(effectID);
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
            this.$.injection_manager.injectMethodAfter(
                imports.ui.expoThumbnail.ExpoWorkspaceThumbnail.prototype,
                "syncStacking",
                function() {
                    try {
                        for (const clone of this.windows) {
                            for (const effectID of extScope.fxIDs) {
                                const winActor = clone.metaWindow.get_compositor_private();

                                if (winActor.get_effect(effectID) &&
                                    extScope.actorHasEffectStored(winActor, effectID)) {
                                    clone.actor.add_effect_with_name(
                                        effectID,
                                        winActor[C.EFFECTS_PROP_NAME][effectID].getNewEffect(clone.actor)
                                    );
                                } else {
                                    clone.actor.remove_effect_by_name(effectID);
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
            this.$.injection_manager.injectMethodAfter(
                imports.ui.appSwitcher.timelineSwitcher.TimelineSwitcher.prototype,
                "_adaptClones",
                function() {
                    try {
                        for (const clone of this._previews) {
                            for (const effectID of extScope.fxIDs) {
                                const winActor = clone.metaWindow.get_compositor_private();

                                if (winActor.get_effect(effectID) &&
                                    extScope.actorHasEffectStored(winActor, effectID)) {
                                    clone.add_effect_with_name(
                                        effectID,
                                        winActor[C.EFFECTS_PROP_NAME][effectID].getNewEffect(clone)
                                    );
                                } else {
                                    clone.remove_effect_by_name(effectID);
                                }
                            }
                        }
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                }
            );
        }

        reApplyAllWindowsEffects() {
            // NOTE: Here are re-applied all effects to all opened windows.
            //  This only works after disabling and re-enabling the extension or
            //  after applying the changes made to the effects lists.
            for (const win of global.get_window_actors()) {
                for (const effectID of this.fxIDs) {
                    if (this.actorHasEffectStored(win, effectID)) {
                        win.add_effect_with_name(
                            effectID,
                            win[C.EFFECTS_PROP_NAME][effectID].getNewEffect(win)
                        );
                    } else {
                        win.remove_effect_by_name(effectID);
                    }
                }
            }
        }

        softlyClearAllEffects() {
            for (const actor of [...global.get_window_actors(), ...[Main.uiGroup]]) {
                if (!actor) {
                    continue;
                }

                for (const effectID of this.fxIDs) {
                    if (actor.get_effect(effectID)) {
                        actor.remove_effect_by_name(effectID);
                    }
                }
            }
        }

        actorHasEffectStored(aActor, aEffectId) {
            return aActor.hasOwnProperty(C.EFFECTS_PROP_NAME) &&
                aActor[C.EFFECTS_PROP_NAME].hasOwnProperty(aEffectId);
        }

        clearAllWindowsEffects() {
            for (const win of global.get_window_actors()) {
                if (win.hasOwnProperty(C.EFFECTS_PROP_NAME)) {
                    win[C.EFFECTS_PROP_NAME].removeAllEffects();
                    win[C.EFFECTS_PROP_NAME] = null;
                    delete win[C.EFFECTS_PROP_NAME];
                }
            }
        }

        clearAllScreenEffects() {
            if (Main.uiGroup.hasOwnProperty(C.EFFECTS_PROP_NAME)) {
                Main.uiGroup[C.EFFECTS_PROP_NAME].removeAllEffects();
                Main.uiGroup[C.EFFECTS_PROP_NAME] = null;
                delete Main.uiGroup[C.EFFECTS_PROP_NAME];
            }
        }

        __connectSignals() {
            Settings.connect(C.EXTENSION_PREFS, function(aPrefKey) {
                this.__onSettingsChanged(aPrefKey);
            }.bind(this));
        }

        __onSettingsChanged(aPrefKey) {
            switch (aPrefKey) {
                case "global_keybindings_apply":
                    this._registerGlobalKeybindings();
                    break;
                case "shader_list_apply":
                case "color_list_apply":
                case "desaturation_list_apply":
                case "contrast_list_apply":
                case "brightness_list_apply":
                    this.softlyClearAllEffects();
                    this._updateEffectsMap();
                    this._registerEffectKeybindings();

                    Mainloop.idle_add(() => {
                        this.reApplyAllWindowsEffects();

                        return GLib.SOURCE_REMOVE;
                    });
                    break;
                case "apply_cinnamon_injections":
                    try {
                        this.$.injection_manager.restoreAll();
                    } finally {
                        Mainloop.idle_add(() => {
                            Settings.apply_cinnamon_injections && this._applyCinnamonInjections();

                            return GLib.SOURCE_REMOVE;
                        });
                    }
                    break;
            }
        }
    }

    $.Debugger.wrapObjectMethods({
        DesktopEffectsApplier: DesktopEffectsApplier
    });

    return new DesktopEffectsApplier();
}

function init(aXletMeta) {
    XletMeta = aXletMeta;

    $ = require("js_modules/utils.js");
    C = require("js_modules/constants.js");
    D = require("js_modules/debugManager.js");
    NotificationsUtils = require("js_modules/notificationsUtils.js");
    E = require("js_modules/extensionsUtils.js");
    EffectsApplier = require("js_modules/effectsApplier.js");
    G = require("js_modules/globalUtils.js");

    _ = G._;
    Settings = $.Settings;

    $.Debugger.wrapObjectMethods({
        BaseExtension: E.BaseExtension
    });
}

function enable() {
    G.tryFn(() => {
        desktopEffects = getExtensionClass(E.BaseExtension);

        Mainloop.idle_add(() => {
            desktopEffects.enable();

            return GLib.SOURCE_REMOVE;
        });
    }, (aErr) => global.logError(aErr));

    return desktopEffects ? {
        __openXletSettings: desktopEffects.__openXletSettings
    } : null;
}

function disable() {
    if (desktopEffects !== null) {
        desktopEffects.disable();
        desktopEffects = null;
    }
}
