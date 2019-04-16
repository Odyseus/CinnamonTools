let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

let $,
    EffectsApplier,
    EffectsStoragePropName;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
    EffectsApplier = require("./effectsApplier.js");
} else {
    $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
    EffectsApplier = imports.ui.extensionSystem.extensions["{{UUID}}"].effectsApplier;
}

EffectsStoragePropName = EffectsApplier.DESKTOP_EFFECTS_PROP_NAME;

const _ = $._;

const {
    gi: {
        Clutter
    },
    mainloop: Mainloop,
    misc: {
        params: Params,
        util: Util
    },
    ui: {
        main: Main,
        messageTray: MessageTray,
        settings: Settings
    }
} = imports;

let xletMeta = null;
let desktopEffects = null;

function DesktopEffectsApplier() {
    this._init.apply(this, arguments);
}

DesktopEffectsApplier.prototype = {
    effectTypes: [
        "shader",
        "color",
        "desaturation",
        "contrast",
        "brightness",
    ],

    _init: function() {
        this._initializeSettings(() => {
            this.workspaceInjection = null;
            this.appSwitcher3DInjection = null;
            this.expoThumbnailInjection = null;
            this.timelineSwitcherInjection = null;
            this._allEffects = {};
            this._allEffectsIDs = [];
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

            if (!this.pref_usage_notified) {
                this._notifyMessage(
                    _("Read this extension help page for usage instructions."),
                    $.NotificationsUrgency.CRITICAL
                );
                this.pref_usage_notified = true;
            }
        }, () => {
            /* NOTE: Do not use Mainloop.idle_add calls.
             * Reason: I'm planning to create an applet that will interact
             * with this extension. So, the extension needs to be ready before
             * the applet is initialized.
             */
        });
    },

    _initializeSettings: function(aDirectCallback, aIdleCallback) {
        this.settings = new Settings.ExtensionSettings(
            this,
            xletMeta.uuid,
            /* NOTE: Do not use asynchronous settings initialization.
             * Reason: I'm planning to create an applet that will interact
             * with this extension. So, the extension needs to be ready before
             * the applet is initialized.
             */
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
            "pref_extra_shaders_path",
            "pref_global_keybindings",
            "pref_shader_list",
            "pref_color_list",
            "pref_desaturation_list",
            "pref_contrast_list",
            "pref_brightness_list",
            "pref_usage_notified",
            "trigger_shader_list_changed",
            "trigger_color_list_changed",
            "trigger_desaturation_list_changed",
            "trigger_contrast_list_changed",
            "trigger_brightness_list_changed",
            "trigger_global_keybindings_changed",
            "trigger_settings_shortcut_creation_desktop",
            "trigger_settings_shortcut_creation_xdg",
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

    _ensureNotificationSource: function() {
        if (!this._notificationSource) {
            this._notificationSource = new $.DesktopEffectsApplierMessageTraySource();
            this._notificationSource.connect("destroy", () => {
                this._notificationSource = null;
            });

            if (Main.messageTray) {
                Main.messageTray.add(this._notificationSource);
            }
        }
    },

    _notifyMessage: function(aMessage, aUrgency = $.NotificationsUrgency.NORMAL, aButtons = []) {
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
        }

        if (body) {
            this.desktopNotification.update(
                $.escapeHTML(_(XletMeta.name)),
                body,
                this._desktopNotificationParams
            );

            this.desktopNotification.addButton("dialog-information", _("Help"));

            for (let i = aButtons.length - 1; i >= 0; i--) {
                this.desktopNotification.addButton(aButtons[i].action, aButtons[i].label);
            }

            this._notificationSource.notify(this.desktopNotification);
        } else {
            this.desktopNotification && this.desktopNotification.destroy();
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

        let t = this.effectTypes.length;
        while (t--) {
            let effectType = this.effectTypes[t];
            let effectsList = JSON.parse(JSON.stringify(this["pref_" + effectType + "_list"]));
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
                        e["id"] = effectType + String(e["base_name"]).replace($.PROP_NAME_CLEANER_RE, "_");
                        break;
                    case "contrast":
                    case "brightness":
                        e["id"] = (effectType + e["red"] + e["green"] + e["blue"]).replace($.PROP_NAME_CLEANER_RE, "_");
                        break;
                }

                e["type"] = effectType;
                e["extra_shaders_path"] = this.pref_extra_shaders_path;
                this._allEffects[e.id] = Params.parse(e, $.EFFECT_DEFAULT_PARAMS, true);
            }
        }

        /* NOTE: Objects suck!!! Since I'm constantly iterating through the effects,
         * store all of their IDs in an array for infinitely faster iterations.
         */
        this.fxIDs = Object.keys(this._allEffects);
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
            let isAllowed = win.get_window_type() in $.ALLOWED_WIN_TYPES;

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
            let kbName = xletMeta.uuid + aEffect.id + aAction;
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
            let kbName = xletMeta.uuid + "Global" + aAction;
            Main.keybindingManager.addHotKey(
                kbName,
                aKb,
                () => this._runGlobalKeybindingAction(aAction)
            );

            this.registeredGlobalKeybindings.push(kbName);
        };

        let globalKbs = JSON.parse(JSON.stringify(this.pref_global_keybindings));
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
                this.openExtensionSettings();
                break;
        }
    },

    enable: function() {
        this._updateEffectsMap();
        this._registerEffectKeybindings();
        this._registerGlobalKeybindings();

        let self = this;

        // Injections.
        /* NOTE: This injection affects Scale mode (all windows displayed in "exposé").
         */
        if (!this.workspaceInjection) {
            this.workspaceInjection = $.injectAfter(
                imports.ui.workspace.WindowClone.prototype,
                "_init",
                function(realWindow, myContainer) { // jshint ignore:line
                    for (let i = self.fxIDs.length - 1; i >= 0; i--) {
                        let id = self.fxIDs[i];
                        if (this.realWindow.get_effect(id) &&
                            self.actorHasEffectStored(this.realWindow, id)) {
                            this.actor.add_effect_with_name(
                                id,
                                this.realWindow[EffectsStoragePropName][id].getNewEffect(this.actor)
                            );
                        } else {
                            this.actor.remove_effect_by_name(id);
                        }
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
                    let i = this._previews.length;
                    while (i--) {
                        let e = self.fxIDs.length;
                        while (e--) {
                            let id = self.fxIDs[e];
                            let preview = this._previews[i];
                            let winActor = preview.metaWindow.get_compositor_private();

                            if (winActor.get_effect(id) &&
                                self.actorHasEffectStored(winActor, id)) {
                                preview.add_effect_with_name(
                                    id,
                                    winActor[EffectsStoragePropName][id].getNewEffect(preview)
                                );
                            } else {
                                preview.remove_effect_by_name(id);
                            }
                        }
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
                    let i = this.windows.length;
                    while (i--) {
                        let e = self.fxIDs.length;
                        while (e--) {
                            let id = self.fxIDs[e];
                            let clone = this.windows[i];
                            let winActor = clone.metaWindow.get_compositor_private();

                            if (winActor.get_effect(id) &&
                                self.actorHasEffectStored(winActor, id)) {
                                clone.actor.add_effect_with_name(
                                    id,
                                    winActor[EffectsStoragePropName][id].getNewEffect(clone.actor)
                                );
                            } else {
                                clone.actor.remove_effect_by_name(id);
                            }
                        }
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
                    let i = this._previews.length;
                    while (i--) {
                        let e = self.fxIDs.length;
                        while (e--) {
                            let id = self.fxIDs[e];
                            let clone = this._previews[i];
                            let winActor = clone.metaWindow.get_compositor_private();

                            if (winActor.get_effect(id) &&
                                self.actorHasEffectStored(winActor, id)) {
                                clone.add_effect_with_name(
                                    id,
                                    winActor[EffectsStoragePropName][id].getNewEffect(clone)
                                );
                            } else {
                                clone.remove_effect_by_name(id);
                            }
                        }
                    }
                }
            );
        }

        /* NOTE: Here are re-applied all effects to all opened windows.
         * This only works after disabling and re-enabling the extension or
         * after applying the changes made to the effects lists.
         */
        try {
            let allWinActors = global.get_window_actors();
            let w = allWinActors.length;
            while (w--) {
                let e = this.fxIDs.length;
                while (e--) {
                    let id = this.fxIDs[e];

                    if (self.actorHasEffectStored(allWinActors[w], id)) {
                        allWinActors[w].add_effect_with_name(
                            id,
                            allWinActors[w][EffectsStoragePropName][id].getNewEffect(allWinActors[w])
                        );
                    } else {
                        allWinActors[w].remove_effect_by_name(id);
                    }
                }
            }
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    disable: function(aPartial) {
        // Keybindings unregistration.
        this._removeKeybindings("Effect");
        this._removeKeybindings("Global");

        if (aPartial) {
            // Clear all effects "softly".
            this.softlyClearAllEffects();
        } else {
            // Clear all effects "hardly".
            this.clearAllWindowsEffects();
            this.clearAllScreenEffects();
        }

        if (!aPartial) {
            // Remove injections.
            $.removeInjection(
                imports.ui.workspace.WindowClone.prototype,
                "_init",
                this.workspaceInjection
            );
            this.workspaceInjection = null;

            $.removeInjection(
                imports.ui.appSwitcher.appSwitcher3D.AppSwitcher3D.prototype,
                "_adaptClones",
                this.appSwitcher3DInjection
            );
            this.appSwitcher3DInjection = null;

            $.removeInjection(
                imports.ui.expoThumbnail.ExpoWorkspaceThumbnail.prototype,
                "syncStacking",
                this.expoThumbnailInjection
            );
            this.expoThumbnailInjection = null;

            $.removeInjection(
                imports.ui.appSwitcher.timelineSwitcher.TimelineSwitcher.prototype,
                "_adaptClones",
                this.timelineSwitcherInjection
            );
            this.timelineSwitcherInjection = null;
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
        return aActor.hasOwnProperty(EffectsStoragePropName) &&
            aActor[EffectsStoragePropName].hasOwnProperty(aEffectId);
    },

    clearAllWindowsEffects: function() {
        let allWinActors = global.get_window_actors();
        let i = allWinActors.length;
        while (i--) {
            if (allWinActors[i].hasOwnProperty(EffectsStoragePropName)) {
                allWinActors[i][EffectsStoragePropName].removeAllEffects();
                allWinActors[i][EffectsStoragePropName] = null;
                delete allWinActors[i][EffectsStoragePropName];
            }
        }
    },

    clearAllScreenEffects: function() {
        if (Main.uiGroup.hasOwnProperty(EffectsStoragePropName)) {
            Main.uiGroup[EffectsStoragePropName].removeAllEffects();
            Main.uiGroup[EffectsStoragePropName] = null;
            delete Main.uiGroup[EffectsStoragePropName];
        }
    },

    openExtensionSettings: function() {
        Util.spawn_async([xletMeta.path + "/settings.py"], null);
    },

    openHelpPage: function() {
        this._xdgOpen(XletMeta.path + "/HELP.html");
    },

    _xdgOpen: function() {
        Util.spawn_async(["xdg-open"].concat(Array.prototype.slice.call(arguments)), null);
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
            case "trigger_global_keybindings_changed":
                this._registerGlobalKeybindings();
                break;
            case "trigger_shader_list_changed":
            case "trigger_color_list_changed":
            case "trigger_desaturation_list_changed":
            case "trigger_contrast_list_changed":
            case "trigger_brightness_list_changed":
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
        desktopEffects = new DesktopEffectsApplier();
        desktopEffects.enable();

        /* NOTE: Object needed to be able to trigger callbacks when pressing
         * buttons in the settings window. Cinnamon 3.0.x, we are screwed.
         */
        return {
            openSettings: desktopEffects.openExtensionSettings
        };
    } catch (aErr) {
        global.logError(aErr);
    }
}

function disable() {
    desktopEffects.disable();
    desktopEffects = null;
}
