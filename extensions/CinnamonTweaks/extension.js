let $,
    _,
    C,
    D,
    NotificationsUtils,
    E,
    F,
    G,
    Settings,
    XletMeta,
    cinnamonTweaks = null;

const {
    gi: {
        Cinnamon,
        Clutter,
        GLib,
        Meta,
        St
    },
    mainloop: Mainloop,
    misc: {
        params: Params,
        signalManager: SignalManager
    },
    ui: {
        main: Main,
        popupMenu: PopupMenu,
        tooltips: Tooltips
    }
} = imports;

const Tweaks = {
    classes: {},
    instances: {}
};

const CT_Base = class CT_Base {
    constructor(aSettingToEnable, aParams) {
        const params = Params.parse(aParams, C.CT_BaseParams);

        this.setting_to_enable = aSettingToEnable;
        this.schedule_manager = new G.ScheduleManager();
        this.signal_manager = params.init_signal_manager ?
            new SignalManager.SignalManager() :
            null;
        this.keybinding_manager = params.init_keybinding_manager ?
            new G.KeybindingsManager(`${XletMeta.uuid}-${aSettingToEnable}`) :
            null;
        this.injection_manager = params.init_injection_manager ?
            new G.InjectionsManager() :
            null;
    }

    enable() {
        // NOTE: Meant to be overwritten.
    }

    disable() {
        // NOTE: Always call super() on the instance.
        this.schedule_manager.clearAllSchedules();
        this.keybinding_manager && this.keybinding_manager.clearAllKeybindings();
        this.signal_manager && this.signal_manager.disconnectAllSignals();
        this.injection_manager && this.injection_manager.restoreAll();
    }

    toggle() {
        this.disable();
        this.schedule_manager.clearSchedule("re_enable");

        if (Settings[this.setting_to_enable]) {
            this.schedule_manager.setTimeout("re_enable", this.enable.bind(this), 1000);
        }
    }
};

Tweaks.classes["windows_focus_enable_tweaks"] = class CT_WindowDemandsAttentionBehavior extends CT_Base {
    constructor() {
        super("windows_focus_enable_tweaks", {
            init_signal_manager: true,
            init_keybinding_manager: true
        });
        this._windows = [];
        this._tracker = Cinnamon.WindowTracker.get_default();
    }

    enable() {
        if (Settings.win_demands_attention_activation_mode !== "none") {
            Settings.win_demands_attention_activation_mode === "hotkey" && this._add_keybindings();

            this.signal_manager.connect(global.display, "window-demands-attention", function(aDisplay, aWin) {
                switch (Settings.win_demands_attention_activation_mode) {
                    case "hotkey":
                        this._windows.push(aWin);
                        break;
                    case "force":
                        Main.activateWindow(aWin);
                        break;
                }
            }.bind(this));
        }
    }

    disable() {
        super.disable();
    }

    _add_keybindings() {
        let shortcut = Settings.win_demands_attention_keyboard_shortcut;
        shortcut = shortcut.includes("::") ? shortcut : `${shortcut}::`;

        this.keybinding_manager.addKeybinding("window_demands_attention_shortcut", shortcut, function() {
            if (this._windows.length === 0) {
                $.Notification.notify(_("No windows in the queue."));
                return;
            }

            const last_window = this._windows.pop();
            Main.activateWindow(last_window);
        }.bind(this));
    }
};

Tweaks.classes["tooltips_tweaks_enabled"] = class CT_TooltipsPatch extends CT_Base {
    constructor() {
        super("tooltips_tweaks_enabled", {
            init_injection_manager: true
        });
    }

    enable() {
        if (Settings.tooltips_delay !== 300) {
            this.injection_manager.overrideMethod(Tooltips.TooltipBase.prototype, "_onMotionEvent",
                function(aActor, aEvent) {
                    if (this._showTimer) {
                        Mainloop.source_remove(this._showTimer);
                        this._showTimer = null;
                    }

                    if (this._hideTimer) {
                        Mainloop.source_remove(this._hideTimer);
                        this._hideTimer = null;
                    }

                    if (!this.visible) {
                        this._showTimer = Mainloop.timeout_add(Settings.tooltips_delay,
                            () => this._onShowTimerComplete());
                        this.mousePosition = aEvent.get_coords();
                    } else {
                        this._hideTimer = Mainloop.timeout_add(500,
                            () => this._onHideTimerComplete());
                    }
                }
            );

            this.injection_manager.overrideMethod(Tooltips.TooltipBase.prototype, "_onEnterEvent",
                function(aActor, aEvent) {
                    if (!this._showTimer) {
                        this._showTimer = Mainloop.timeout_add(Settings.tooltips_delay,
                            () => this._onShowTimerComplete());
                        this.mousePosition = aEvent.get_coords();
                    }
                }
            );
        }

        if (Settings.tooltips_inteligent_positioning ||
            Settings.tooltips_never_centered ||
            Settings.tooltips_half_monitor_width) {
            this.injection_manager.overrideMethod(Tooltips.Tooltip.prototype, "show",
                function() {
                    if (this._tooltip.get_text() === "" || !this.mousePosition) {
                        return;
                    }

                    const tooltipWidth = this._tooltip.get_allocation_box().x2 - this._tooltip.get_allocation_box().x1;
                    const tooltipHeight = this._tooltip.get_allocation_box().y2 - this._tooltip.get_allocation_box().y1;
                    const monitor = Main.layoutManager.findMonitorForActor(this.item);

                    const cursorSize = this.desktop_settings.get_int("cursor-size");
                    let tooltipTop = this.mousePosition[1] + Math.round(cursorSize / 1.5);
                    let tooltipLeft = this.mousePosition[0] + Math.round(cursorSize / 2);
                    tooltipLeft = Math.max(tooltipLeft, monitor.x);
                    tooltipLeft = Math.min(tooltipLeft, monitor.x + monitor.width - tooltipWidth);

                    if (Settings.tooltips_inteligent_positioning &&
                        (tooltipTop + tooltipHeight > monitor.height)) {
                        tooltipTop = tooltipTop - tooltipHeight - Math.round(cursorSize);
                    }

                    this._tooltip.set_position(tooltipLeft, tooltipTop);

                    if (Settings.tooltips_never_centered ||
                        Settings.tooltips_half_monitor_width) {
                        let style = "";

                        // Align to right or left depending on default direction.
                        if (Settings.tooltips_never_centered) {
                            const rtl = (St.Widget.get_default_direction() === St.TextDirection.RTL);
                            style += "text-align: %s;".format(rtl ? "right" : "left");
                        }

                        // Set max. width of tooltip to half the width of the monitor.
                        if (Settings.tooltips_half_monitor_width) {
                            style += "max-width: %spx;".format(String(Math.round(Number(monitor.width) / 2)));
                        }

                        this._tooltip.set_style(style);
                    }

                    this._tooltip.show();
                    this._tooltip.raise_top();
                    this.visible = true;
                }
            );
        }
    }

    disable() {
        super.disable();
    }
};

Tweaks.classes["popup_menu_manager_tweaks_enabled"] = class CT_PopupMenuManagerPatch extends CT_Base {
    constructor() {
        super("popup_menu_manager_tweaks_enabled", {
            init_injection_manager: true
        });
    }

    enable() {
        if (Settings.popup_menu_manager_applets_menus_behavior !== "default") {
            this.injection_manager.overrideMethod(PopupMenu.PopupMenuManager.prototype, "_onEventCapture",
                function(aActor, aEvent) {
                    if (!this.grabbed) {
                        return Clutter.EVENT_PROPAGATE;
                    }

                    if (Main.keyboard.shouldTakeEvent(aEvent)) {
                        return Clutter.EVENT_PROPAGATE;
                    }

                    if (this._owner.menuEventFilter &&
                        this._owner.menuEventFilter(aEvent)) {
                        return Clutter.EVENT_STOP;
                    }

                    if (this._activeMenu !== null && this._activeMenu.passEvents) {
                        return Clutter.EVENT_PROPAGATE;
                    }

                    if (this._didPop) {
                        this._didPop = false;
                        return Clutter.EVENT_STOP;
                    }

                    const activeMenuContains = this._eventIsOnActiveMenu(aEvent);
                    const eventType = aEvent.type();

                    if (eventType === Clutter.EventType.BUTTON_RELEASE) {
                        if (activeMenuContains) {
                            return Clutter.EVENT_PROPAGATE;
                        } else {
                            this._closeMenu();
                            return Clutter.EVENT_PROPAGATE; // NOTE: Changed. true > false
                        }
                    } else if (eventType === Clutter.EventType.BUTTON_PRESS && !activeMenuContains) {
                        this._closeMenu();
                        return Clutter.EVENT_PROPAGATE; // NOTE: Changed. true > false
                    } else if (!this._shouldBlockEvent(aEvent)) {
                        return Clutter.EVENT_PROPAGATE;
                    }

                    return Clutter.EVENT_PROPAGATE; // NOTE: Changed. true > false
                }
            );
        }
    }

    disable() {
        super.disable();
    }
};

Tweaks.classes["desktop_tweaks_enabled"] = class CT_DropToDesktopPatch extends CT_Base {
    constructor() {
        super("desktop_tweaks_enabled");
    }

    enable() {
        if (Settings.desktop_tweaks_allow_drop_to_desktop &&
            !Main.layoutManager.hasOwnProperty("__CT_DropToDesktopPatch_desktop")) {
            Main.layoutManager.__CT_DropToDesktopPatch_desktop = new $.CT_NemoDesktopArea();
        }
    }

    disable() {
        if (Main.layoutManager.__CT_DropToDesktopPatch_desktop) {
            delete Main.layoutManager.__CT_DropToDesktopPatch_desktop;
        }

        super.disable();
    }
};

Tweaks.classes["window_shadows_tweaks_enabled"] = class CT_CustomWindowShadows extends CT_Base {
    constructor() {
        super("window_shadows_tweaks_enabled");
        this._shadowFactory = Meta.ShadowFactory.get_default();
    }

    enable() {
        this.activate_preset(Settings.window_shadows_preset);
    }

    disable() {
        this.activate_preset("default");
        super.disable();
    }

    create_params(r) {
        return new Meta.ShadowParams({
            "radius": r[0],
            "top_fade": r[1],
            "x_offset": r[2],
            "y_offset": r[3],
            "opacity": r[4]
        });
    }

    get_custom_preset() {
        const preset = {
            focused: {},
            unfocused: {}
        };
        /* NOTE: DO NOT replace JSON trick with Object.assign().
         * The JSON trick eradicates functions. Object.assign() don't.
         */
        for (const pre of JSON.parse(JSON.stringify(Settings.window_shadows_custom_preset))) {
            const [state, type] = pre.win_type.split(/_(.+)/);
            preset[state === "u" ?
                "unfocused" :
                "focused"][type] = [
                pre.radius,
                pre.top_fade,
                pre.x_offset,
                pre.y_offset,
                pre.opacity
            ];
        }

        return preset;
    }

    activate_preset(aPreset) {
        const presets = Object.assign({}, C.ShadowValues);

        G.tryFn(() => {
            if (aPreset === "custom") {
                presets["custom"] = this.get_custom_preset();
            }
        }, (aErr) => {
            global.logError(aErr);
        }, () => {
            if (aPreset in presets) {
                const focused = presets[aPreset].focused;
                const unfocused = presets[aPreset].unfocused;

                G.objectEach(focused, (aRecord) => {
                    this._shadowFactory.set_params(aRecord, true, this.create_params(focused[aRecord]));
                });

                G.objectEach(unfocused, (aRecord) => {
                    this._shadowFactory.set_params(aRecord, false, this.create_params(unfocused[aRecord]));
                });
            }
        });
    }
};

Tweaks.classes["window_auto_move_tweaks_enabled"] = class CT_AutoMoveWindows extends CT_Base {
    constructor() {
        super("window_auto_move_tweaks_enabled");
        this._winMover = null;
    }

    enable() {
        G.tryFn(() => {
            if (!Main.wm.hasOwnProperty("__CT_workspaceTracker")) {
                const {
                    WorkspaceTracker
                } = require("js_modules/WorkspaceTracker.js");
                $.Debugger.wrapObjectMethods({
                    WorkspaceTracker: WorkspaceTracker
                });
                Main.wm.__CT_workspaceTracker = new WorkspaceTracker(Main.wm);
            }
        }, null, () => {
            G.tryFn(() => {
                this._winMover = new $.CT_WindowMover();
            }, (aErr) => {
                global.logError(aErr);
            });
        });
    }

    disable() {
        if (this._winMover) {
            this._winMover.destroy();
        }

        if (Main.wm.hasOwnProperty("__CT_workspaceTracker")) {
            delete Main.wm.__CT_workspaceTracker;
        }

        super.disable();
    }
};

Tweaks.classes["maximus_enabled"] = class CT_MaximusNG extends CT_Base {
    constructor() {
        super("maximus_enabled");
        this.maximus = null;
    }

    enable() {
        this.maximus = new $.CT_MaximusNG();
        this.maximus.startUndecorating();
    }

    disable() {
        if (this.maximus) {
            this.maximus.stopUndecorating();
            this.maximus = null;
        }

        super.disable();
    }
};

Tweaks.classes["restore_logging_to_glass_log_file"] = class CT_RestoreLoggingToGlassLogFile extends CT_Base {
    constructor() {
        super("restore_logging_to_glass_log_file", {
            init_injection_manager: true
        });
        this.initialMessagesLength = 0;
        this.initialMessagesDiffHandled = false;
        this.logFile = null;
        this.logBackupFile = null;
        // NOTE: Promise chain. <3 https://stackoverflow.com/a/38574458
        this.promiseChain = Promise.resolve();
        // NOTE: I changed the original location of the glass.log file to a STANDARD one.
        // this._cin_log_folder = GLib.get_home_dir() + "/.cinnamon/";
        this._cin_log_folder = GLib.get_home_dir() + "/.local/share/cinnamon/logs";
    }

    _setupLogFile() {
        return new Promise((aResolve, aReject) => {
            G.tryFn(() => {
                this.logFile = new F.File(this._cin_log_folder + "/glass.log");
                this.logBackupFile = new F.File(this._cin_log_folder + "/glass.log.last");
                this.logFile.ensure_parents();

                if (this.logFile.exists) {
                    this.logFile.copy(this.logBackupFile.gio_file).then(() => aResolve()).catch((aErr) => aReject(aErr));
                } else {
                    aResolve();
                }
            }, (aErr) => aReject(aErr));
        });
    }

    formatMessage(aError) {
        return `${aError.category} t=${(new Date(parseInt(aError.timestamp, 10))).toISOString()} ${aError.message}\n`;
    }

    enable() {
        this._setupLogFile().then(() => {
            const messages = imports.ui.main._errorLogStack.map(aError => this.formatMessage(aError));
            this.initialMessagesLength = messages.length;
            this.logFile.write(messages.join("")).then((aSuccess) => {
                const self = this;

                // NOTE: I thought that this wasn't going to work since I always used the injectMethod*
                // functions in prototypes. In this case, _log is a function defined at module level.
                // TODO: Investigate the dbus service used by LookingGlass. Maybe I can connect to it and
                // there is not need for a hacky injection.
                aSuccess && this.injection_manager.injectMethodAfter(
                    imports.ui.main,
                    "_log",
                    // WARNING: Do not complicate thinks more than they already are.
                    // If any error happen, always restore original function.
                    // And needless to say, DO NOT CALL ANY LOG FUNCTION HERE. Infinite loop guaranteed.
                    function(aCategory = "info", aMsg = "") { // jshint ignore:line
                        G.tryFn(() => {
                            const errors = imports.ui.main._errorLogStack;
                            const errorsLength = errors.length;

                            // NOTE: This is to counteract the likely possibility of missing some
                            // errors between the time that the initial errors are written and
                            // the time that the injection is functional.
                            if (!self.initialMessagesDiffHandled && errorsLength > self.initialMessagesLength) {
                                self.initialMessagesDiffHandled = true;
                                const lastErrors = errors.slice(self.initialMessagesLength, errorsLength)
                                    .map(aError => self.formatMessage(aError));
                                self.promiseChain = self.promiseChain.then(
                                    // NOTE: append.bind(null, ...args) won't work here.
                                    () => self.logFile.append(lastErrors.join(""))
                                );

                                return;
                            }

                            if (errorsLength) {
                                const lastError = errors[errorsLength - 1];
                                self.promiseChain = self.promiseChain.then(
                                    // NOTE: append.bind(null, ...args) won't work here.
                                    () => self.logFile.append(self.formatMessage(lastError))
                                );
                            }
                        }, (aErr) => {
                            self.disable();
                            global.logError(aErr);
                        });
                    }

                );
            }).catch((aErr) => global.logError(aErr));
        }).catch((aErr) => global.logError("Error during looking-glass log initialization", aErr));
    }

    disable() {
        this.logFile && this.logFile.destroy();
        this.logBackupFile && this.logBackupFile.destroy();
        this.logFile = null;
        this.logBackupFile = null;

        super.disable();
    }
};

function getExtensionClass(aBaseExtension) {
    class CinnamonTweaks extends aBaseExtension {
        constructor() {
            super({
                metadata: XletMeta,
                schedule_manager: new G.ScheduleManager(),
                settings: Settings,
                notification: $.Notification,
                pref_keys: C.EXTENSION_PREFS
            });

            this._allowEnable = G.check_version(G.CINNAMON_VERSION, ">=", C.MIN_CINNAMON_VERSION);
        }

        enable() {
            if (!this._allowEnable) {
                $.informAndDisable();
                return false;
            }

            G.objectEach(Tweaks.classes, (aTweakPref) => {
                if (Settings[aTweakPref]) {
                    Tweaks.instances[aTweakPref] = new Tweaks.classes[aTweakPref]();
                    Tweaks.instances[aTweakPref].enable();
                }
            });

            if (!Settings.initial_load) {
                const msg = [
                    G.escapeHTML(_("If you updated this extension from an older version, you must check its settings window.")),
                    G.escapeHTML(_("Some preferences may have been changed to their default values.")),
                    G.escapeHTML(_("This message will not be displayed again."))
                ];
                this.$.schedule_manager.setTimeout("initial_load", () => {
                    $.Notification.notify(
                        msg,
                        NotificationsUtils.NotificationUrgency.CRITICAL
                    );
                    Settings.initial_load = true;
                }, 5000);
            }

            super.enable();

            return true;
        }

        disable() {
            G.objectEach(Tweaks.instances, (aTweakPref) => {
                try {
                    if (Tweaks.instances[aTweakPref]) {
                        Tweaks.instances[aTweakPref].disable();
                        Tweaks.instances[aTweakPref] = null;
                    }
                } catch (aErr) {}
            });

            super.disable();
        }

        toggleTweak(aPref) {
            if (aPref in Tweaks.classes) {
                G.tryFn(() => {
                    if (!(aPref in Tweaks.instances)) {
                        Tweaks.instances[aPref] = new Tweaks.classes[aPref]();
                    }
                }, null, () => {
                    Tweaks.instances[aPref].toggle();
                });
            }
        }

        __connectSignals() {
            Settings.connect(C.EXTENSION_PREFS, function(aPrefKey) {
                this.__onSettingsChanged(aPrefKey);
            }.bind(this));
        }

        __onSettingsChanged(aPrefKey) {
            switch (aPrefKey) {
                case "desktop_tweaks_enabled":
                case "desktop_tweaks_allow_drop_to_desktop":
                case "tooltips_tweaks_enabled":
                case "tooltips_inteligent_positioning":
                case "tooltips_never_centered":
                case "tooltips_half_monitor_width":
                case "tooltips_delay":
                case "popup_menu_manager_tweaks_enabled":
                case "popup_menu_manager_applets_menus_behavior":
                    $.informCinnamonRestart();
                    break;
                case "windows_focus_enable_tweaks":
                case "win_demands_attention_activation_mode":
                case "win_demands_attention_keyboard_shortcut":
                    this.toggleTweak("windows_focus_enable_tweaks");
                    break;
                case "window_shadows_tweaks_enabled":
                case "window_shadows_preset":
                case "window_shadows_preset_apply":
                    this.toggleTweak("window_shadows_tweaks_enabled");
                    break;
                case "window_auto_move_tweaks_enabled":
                    this.toggleTweak("window_auto_move_tweaks_enabled");
                    break;
                case "maximus_apply_settings":
                    this.toggleTweak("maximus_enabled");
                    break;
                case "restore_logging_to_glass_log_file":
                    this.toggleTweak("restore_logging_to_glass_log_file");
                    break;
            }
        }
    }

    $.Debugger.wrapObjectMethods({
        CinnamonTweaks: CinnamonTweaks
    });

    return new CinnamonTweaks();
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
    D = require("js_modules/debugManager.js");
    NotificationsUtils = require("js_modules/notificationsUtils.js");
    E = require("js_modules/extensionsUtils.js");
    F = require("js_modules/customFileUtils.js");
    G = require("js_modules/globalUtils.js");

    _ = G._;
    Settings = $.Settings;

    $.Debugger.wrapObjectMethods({
        BaseExtension: E.BaseExtension,
        CT_Base: CT_Base,
        CT_AutoMoveWindows: Tweaks.classes["window_auto_move_tweaks_enabled"],
        CT_CustomWindowShadows: Tweaks.classes["window_shadows_tweaks_enabled"],
        CT_DropToDesktopPatch: Tweaks.classes["desktop_tweaks_enabled"],
        CT_MaximusNG: Tweaks.classes["maximus_enabled"],
        CT_PopupMenuManagerPatch: Tweaks.classes["popup_menu_manager_tweaks_enabled"],
        CT_RestoreLoggingToGlassLogFile: Tweaks.classes["restore_logging_to_glass_log_file"],
        CT_TooltipsPatch: Tweaks.classes["tooltips_tweaks_enabled"],
        CT_WindowDemandsAttentionBehavior: Tweaks.classes["windows_focus_enable_tweaks"]
    });
}

function enable() {
    G.tryFn(() => {
        cinnamonTweaks = getExtensionClass(E.BaseExtension);

        Mainloop.idle_add(() => {
            cinnamonTweaks.enable();

            return GLib.SOURCE_REMOVE;
        });
    }, (aErr) => global.logError(aErr));

    return cinnamonTweaks ? {
        __openXletSettings: cinnamonTweaks.__openXletSettings
    } : null;
}

function disable() {
    if (cinnamonTweaks !== null) {
        cinnamonTweaks.disable();
        cinnamonTweaks = null;
    }
}
