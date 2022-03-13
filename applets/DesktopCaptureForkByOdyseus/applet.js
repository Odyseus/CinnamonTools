const {
    gi: {
        Cinnamon,
        Clutter,
        Gio,
        GLib,
        Meta,
        St
    },
    misc: {
        util: Util
    },
    ui: {
        applet: Applet,
        main: Main,
        popupMenu: PopupMenu
    }
} = imports;

const {
    _,
    copyToClipboard,
    deepMergeObjects,
    escapeHTML,
    getKeybindingDisplayName,
    isObject,
    ngettext,
    tokensReplacer,
    tryFn,
    launchUri
} = require("js_modules/globalUtils.js");

const {
    IntelligentTooltip
} = require("js_modules/customTooltips.js");

const {
    File
} = require("js_modules/customFileUtils.js");

const {
    getBaseAppletClass
} = require("js_modules/appletsUtils.js");

const {
    APPLET_PREFS,
    CinnamonRecorderProfilesBase,
    ClipboardCopyType,
    Devices,
    InteractiveCallouts,
    KeybindingSupport,
    PROGRAMS_SUPPORT_EMPTY,
    ProgramSupportBase,
    SelectionType,
    SelectionTypeStr
} = require("js_modules/constants.js");

const {
    askForConfirmation,
    CinnamonRecorderProfileSelector,
    CustomPopupMenuSection,
    CustomPopupSliderMenuItem,
    CustomSwitchMenuItem,
    Debugger,
    Exec,
    extendMenuItem,
    LastCaptureContainer,
    notify,
    onSubMenuOpenStateChanged,
    ProgramSelectorSubMenuItem,
    runtimeError,
    runtimeInfo,
    ScreenshotHelper,
    TryExec
} = require("js_modules/utils.js");

class DesktopCapture extends getBaseAppletClass(Applet.IconApplet) {
    constructor(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
        super({
            metadata: aMetadata,
            orientation: aOrientation,
            panel_height: aPanelHeight,
            instance_id: aInstanceID,
            pref_keys: APPLET_PREFS
        });

        this._keybinding_base = this.$.metadata.uuid + "-" + this.$.instance_id;

        this.__initializeApplet(() => {
            this._expandAppletContextMenu();
        }, () => {
            this.settings_schema_file = new File(`${this.$.metadata.path}/settings-schema.json`);
            this.appletHelper = `${this.$.metadata.path}/appletHelper.py`;
            this.cinnamonRecorder = this.$._.recorder_program === "cinnamon" ?
                new Cinnamon.Recorder({
                    stage: global.stage
                }) :
                null;
            this.lastCapture = {
                camera: null,
                recorder: null
            };
            this.oldStylesheetPath = null;
            this.cameraSection = null;
            this.recorderSection = null;
            this.cameraHeader = null;
            this.recorderHeader = null;
            this.cameraLastCaptureContent = null;
            this.recorderLastCaptureContent = null;

            this._oldKeybindingsNames = [];
            this._newKeybindingsStorage = {};
            this._programSupport = {};
            this._cinnamonRecorderProfiles = {};
            this._cameraRedoMenuItem = null;
            this._recorderRedoMenuItem = null;

            this._setupSaveDirs();

            this.set_applet_tooltip(_(this.$.metadata.description));

            this._loadTheme();
            this._setupProgramSupport();
            this._setupCinnamonRecorderProfiles();
        });
    }

    __connectSignals() {
        // When monitors are connected or disconnected, redraw the menu
        this.$.signal_manager.connect(Main.layoutManager, "monitors-changed", function() {
            if (this.$._.camera_program === "cinnamon") {
                this.drawMenu();
            }
        }.bind(this));
        this.$.signal_manager.connect(Main.themeManager, "theme-set", function() {
            this._loadTheme(false);
        }.bind(this));
        this.$.signal_manager.connect(this, "orientation-changed", function() {
            this.__seekAndDetroyConfigureContext();
        }.bind(this));
    }

    _expandAppletContextMenu() {
        let mi = new PopupMenu.PopupIconMenuItem(
            _("Open screenshots folder"),
            "folder",
            St.IconType.SYMBOLIC
        );
        mi.connect("activate", () => {
            this._doRunHandler(this._cameraSaveDir);
        });
        this._applet_context_menu.addMenuItem(mi);

        mi = new PopupMenu.PopupIconMenuItem(
            _("Open screencasts folder"),
            "folder",
            St.IconType.SYMBOLIC
        );
        mi.connect("activate", () => {
            this._doRunHandler(this._recorderSaveDir);
        });
        this._applet_context_menu.addMenuItem(mi);

        this._applet_context_menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const itemFns = (aType, aPrefName, aPrefEmptyVal) => {
            switch (aType) {
                case "export":
                    return () => this._exportJSONData(aPrefName);
                case "import":
                    return () => this._importJSONData(aPrefName);
                case "reset":
                    return () => this._resetPrefToDefault(aPrefName);
                case "remove":
                    return () => this._clearPref(aPrefName, aPrefEmptyVal);
                default:
                    return (aMenu, aOpen) => onSubMenuOpenStateChanged(aMenu, aOpen);
            }
        };

        for (const pref of [{
                name: "program_support",
                empty_value: PROGRAMS_SUPPORT_EMPTY
            }, {
                name: "cinn_rec_profiles",
                empty_value: {}
            }]) {
            let subMLabel,
                exportLabel,
                importLabel,
                resetLabel,
                removeLabel;

            switch (pref.name) {
                case "program_support":
                    subMLabel = _("Programs support");
                    exportLabel = _("Export programs");
                    importLabel = _("Import programs");
                    resetLabel = _("Reset programs");
                    removeLabel = _("Remove all programs");
                    break;
                case "cinn_rec_profiles":
                    subMLabel = _("Cinnamon recorder profiles");
                    exportLabel = _("Export profiles");
                    importLabel = _("Import profiles");
                    resetLabel = _("Reset profiles");
                    removeLabel = _("Remove all profiles");
                    break;
            }

            const subMenu = new PopupMenu.PopupSubMenuMenuItem(subMLabel);
            subMenu.menu.connect("open-state-changed", itemFns(null, null));
            this._applet_context_menu.addMenuItem(subMenu);

            mi = new PopupMenu.PopupIconMenuItem(
                exportLabel,
                "desktop-capture-export-data",
                St.IconType.SYMBOLIC
            );
            mi.connect("activate", itemFns("export", pref.name));
            subMenu.menu.addMenuItem(mi);

            mi = new PopupMenu.PopupIconMenuItem(
                importLabel,
                "desktop-capture-import-data",
                St.IconType.SYMBOLIC
            );
            mi.connect("activate", itemFns("import", pref.name));
            subMenu.menu.addMenuItem(mi);

            mi = new PopupMenu.PopupIconMenuItem(
                resetLabel,
                "dialog-warning",
                St.IconType.SYMBOLIC
            );
            mi.connect("activate", itemFns("reset", pref.name));
            subMenu.menu.addMenuItem(mi);

            mi = new PopupMenu.PopupIconMenuItem(
                removeLabel,
                "dialog-warning",
                St.IconType.SYMBOLIC
            );
            mi.connect("activate", itemFns("remove", pref.name, pref.empty_value));
            subMenu.menu.addMenuItem(mi);
        }

        this._applet_context_menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        mi = new PopupMenu.PopupIconMenuItem(
            _("Help"),
            "dialog-information",
            St.IconType.SYMBOLIC
        );
        mi.connect("activate", () => this._doRunHandler(`${this.$.metadata.path}/HELP.html`));
        this._applet_context_menu.addMenuItem(mi);

        this.__seekAndDetroyConfigureContext();
    }

    _loadTheme(aFullReload = false) {
        tryFn(() => {
            this.unloadStylesheet();
        }, (aErr) => {
            global.logError(aErr);
        }, () => {
            this.$.schedule_manager.setTimeout("load_theme", function() {
                tryFn(() => {
                    /* NOTE: Without calling Main.loadTheme() this xlet stylesheet
                     * doesn't reload correctly. ¬¬
                     */
                    if (aFullReload) {
                        Main.themeManager._changeTheme();
                    }

                    this.loadStylesheet();

                }, (aErr) => global.logError(aErr));
            }.bind(this), 1000);
        });
    }

    loadStylesheet() {
        this.stylesheet = this._getCssPath();

        tryFn(() => {
            const themeContext = St.ThemeContext.get_for_stage(global.stage);
            this.theme = themeContext.get_theme();
        }, (aErr) => {
            global.logError(_("Error trying to get theme"));
            global.logError(aErr);
        });

        tryFn(() => {
            this.theme.load_stylesheet(this.stylesheet);
        }, (aErr) => {
            global.logError(_("Stylesheet parse error"));
            global.logError(aErr);
        });
    }

    unloadStylesheet() {
        if (this.theme && this.stylesheet) {
            tryFn(() => {
                this.theme.unload_stylesheet(this.stylesheet);
            }, (aErr) => {
                global.logError(_("Error unloading stylesheet"));
                global.logError(aErr);
            }, () => {
                this.theme = null;
                this.stylesheet = null;
            });
        }
    }

    _getCssPath() {
        const defaultThemepath = `${this.$.metadata.path}/themes/light-overlay.css`;
        let cssPath;

        switch (this.$._.theme_selector) {
            case "light":
                cssPath = `${this.$.metadata.path}/themes/light-overlay.css`;
                break;
            case "dark":
                cssPath = `${this.$.metadata.path}/themes/dark-overlay.css`;
                break;
            case "custom":
                cssPath = this.$._.theme_custom;
                break;
        }

        const cssFile = new File(cssPath);

        if (cssFile.is_file) {
            return cssFile.path;
        }

        return defaultThemepath;
    }

    __setAppletIcon(aRecording) {
        const icon = (aRecording ?
                this.$._.applet_icon_recording :
                this.$._.applet_icon) ||
            "desktop-capture-camera-photo-symbolic";
        super.__setAppletIcon(icon);
    }

    stopAnyRecorder() {
        const device = "recorder";

        if (this.getDeviceProgram(device) === "cinnamon") {
            this.toggleCinnamonRecorder();
        } else if (this.hasDeviceProperty(device, "stop-command")) {
            this.runCommand(
                this.getDeviceProperty(device, "stop-command"), device, false, false);
        }
    }

    _storeNewKeybinding(aDevice, aLabel, aCallback) {
        if (!this._newKeybindingsStorage.hasOwnProperty(aDevice)) {
            this._newKeybindingsStorage[aDevice] = [];
        }

        // aLabel can be a property in KeybindingSupport or directly the pref.
        // name suffix. One case of this is when registering the keybinding
        // for Cinnamon's recorder or the stop recorder keybinding.
        const keyPrefNameSuffix = KeybindingSupport[aDevice].hasOwnProperty(aLabel) ?
            KeybindingSupport[aDevice][aLabel] : aLabel;
        const keyPrefName = `key_${aDevice}_${keyPrefNameSuffix}`;

        // Check if keyPrefName is a property of the applet (the actual pref. name)
        // and check if the pref. actually has a keybinding set. Otherwise, do
        // not store the new keybinding into _newKeybindingsStorage.
        if (this.$._.hasOwnProperty(keyPrefName) && this.$._[keyPrefName]) {
            this._newKeybindingsStorage[aDevice].push({
                keybindingName: this._keybinding_base + "-" + keyPrefName,
                keyPrefValue: this.$._[keyPrefName],
                callback: aCallback
            });
        }
    }

    _registerKeyBindings() {
        this._removeKeybindings(() => {
            // Define function outside loop.
            const keyFn = (aKey) => {
                return () => {
                    aKey.callback();
                };
            };

            for (const device of Devices) {
                // If the device is disabled, do not bother storing keybindings.
                if (!this.hasDevice(device)) {
                    continue;
                }

                const newKeys = this._newKeybindingsStorage.hasOwnProperty(device) ?
                    this._newKeybindingsStorage[device] : [];

                // If there isn't new keys, do not continue.
                if (newKeys.length === 0) {
                    continue;
                }

                for (const key of newKeys) {
                    // Store the new keybinding name to _oldKeybindingsNames for
                    // later removal.
                    this._oldKeybindingsNames.push(key.keybindingName);
                    // And finally create the keybinding.
                    Main.keybindingManager.addHotKey(
                        key.keybindingName,
                        key.keyPrefValue,
                        keyFn(key)
                    );
                }

                // After registering the new keybindings, clear _newKeybindingsStorage.
                this._newKeybindingsStorage[device] = [];
            }
        });
    }

    _removeKeybindings(aCallback) {
        tryFn(() => {
            for (const keybindingName of this._oldKeybindingsNames) {
                Main.keybindingManager.removeHotKey(keybindingName);
            }
        }, (aErr) => {}, () => { // jshint ignore:line
            this._oldKeybindingsNames = [];

            if (!!aCallback) {
                aCallback();
            }
        });
    }

    _setupCinnamonRecorderProfiles() {
        // Stick with the JSON trick. Do not use Object.assign().
        this.cinnamonRecorderProfiles = deepMergeObjects(CinnamonRecorderProfilesBase,
            JSON.parse(JSON.stringify(this.$._.cinn_rec_profiles)));

        if (!this.cinnamonRecorderProfiles
            .hasOwnProperty(this.$._.cinn_rec_current_profile)) {
            this.$._.cinn_rec_current_profile = "default";
        }

        this.drawMenu();
    }

    _setupProgramSupport() {
        // Clone the original object before doing possible modifications.
        // It is to avoid triggering the pref callback.
        // Stick with the JSON trick. Do not use Object.assign().
        const prefProgramSupportCopy = JSON.parse(JSON.stringify(this.$._.program_support));
        // If either of the devices in the preference pref_program_support
        // has "disabled" or "cinnamon", remove them.
        // Those two shouldn't be overriden/removed/modified.
        for (const prop of ["disabled", "cinnamon"]) {
            for (const device of Devices) {
                if (prefProgramSupportCopy[device].hasOwnProperty(prop)) {
                    delete prefProgramSupportCopy[device][prop];
                }
            }
        }

        if (prefProgramSupportCopy !== this.$._.program_support) {
            this.$._.program_support = prefProgramSupportCopy;
        }

        this.programSupport = deepMergeObjects(ProgramSupportBase, prefProgramSupportCopy);

        // If the new modified programSupport doesn't contain the currently
        // set program for a device, set the current program to cinnamon.
        // A situation in which this could happen is when importing new programs.
        // The newly imported list could have removed the currently set
        // program for a device.
        // Doing it AFTER programSupport has been generated so is checked with
        // "disabled" and "cinnamon" in it.
        for (const device of Devices) {
            if (!this.programSupport[device]
                .hasOwnProperty(this.$._[`${device}_program`])) {
                this.$._[`${device}_program`] = "cinnamon";
            }
        }

        this.drawMenu();
    }

    _setupSaveDirs() {
        const prefMap = {
            camera_save_dir: "_cameraSaveDir",
            recorder_save_dir: "_recorderSaveDir"
        };

        for (const pref in prefMap) {
            if (!this.$._[pref].trim()) {
                // If the pref is empty, setup default user directories.
                const defaultDir = GLib.get_user_special_dir(
                    (pref === "camera_save_dir" ?
                        GLib.UserDirectory.DIRECTORY_PICTURES :
                        GLib.UserDirectory.DIRECTORY_VIDEOS));
                this.$._[pref] = defaultDir;
                this[prefMap[pref]] = defaultDir;
            } else if (this.$._[pref].startsWith("file://")) {
                // In case that an URI is used instead of a path.
                this.$._[pref] = this.$._[pref].replace("file://", "");
                this[prefMap[pref]] = this.$._[pref].replace("file://", "");
            } else {
                // Leave it as-is.
                this[prefMap[pref]] = this.$._[pref];
            }
        }
    }

    _onMenuKeyRelease(actor, event) {
        const symbol = event.get_key_symbol();

        if (symbol === Clutter.KEY_Shift_L) {
            this.setModifier(symbol, false);
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _onMenuKeyPress(actor, event) {
        const symbol = event.get_key_symbol();

        if (symbol === Clutter.KEY_Shift_L) {
            this.setModifier(symbol, true);
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _doRunHandler(aURI) {
        runtimeInfo(`Opening "${aURI}"`);
        launchUri(aURI);
    }

    drawMenu() {
        this.__setAppletIcon();
        this._newKeybindingsStorage = {};

        this.$.schedule_manager.setTimeout("draw_menu", function() {
            this.__initMainMenu();

            const lastCaptureFn = (aDevive) => {
                return (aMenu, aOpen) => {
                    aOpen && this[`${aDevive}LastCaptureContent`]._onFileDataChanged();
                    onSubMenuOpenStateChanged(aMenu, aOpen);
                };
            };

            for (const device of Devices) {
                this[`${device}Header`] = new ProgramSelectorSubMenuItem(
                    this, {
                        item_label: " ",
                        pref_key: `${device}_program`,
                        icon_name: (device === "camera" ?
                            "camera-photo" :
                            "media-record"),
                        item_style_class: "desktop-capture-program-selector-submenu-label",
                        extra_params: {
                            device_programs: this.getDevicePrograms(device),
                            device: device
                        }
                    }
                );
                this[device + "Header"].tooltip = new IntelligentTooltip(
                    this[`${device}Header`].actor,
                    (device === "camera" ?
                        _("Choose camera") :
                        _("Choose recorder"))
                );

                this[`${device}Section`] = new CustomPopupMenuSection();

                const lastCaptureSubMenu = new PopupMenu.PopupSubMenuMenuItem(_("Latest capture"));
                this[`${device}LastCaptureContent`] = new LastCaptureContainer(this, {
                    device: device
                });
                lastCaptureSubMenu.menu.connect("open-state-changed", lastCaptureFn(device));
                lastCaptureSubMenu.label.add_style_class_name("desktop-capture-last-capture-submenu-label");
                lastCaptureSubMenu.menu.addMenuItem(this[`${device}LastCaptureContent`]);

                this.menu.addMenuItem(this[`${device}Header`]);
                this.menu.addMenuItem(this[`${device}Section`]);
                this.menu.addMenuItem(lastCaptureSubMenu);

                device === "camera" &&
                    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

                this._rebuildDeviceSection(device);
            }

            // Listen in for shift+clicks so we can alter our behavior accordingly.
            this.menu.actor.connect("key-press-event",
                (aActor, aEvent) => this._onMenuKeyPress(aActor, aEvent));
            this.menu.actor.connect("key-release-event",
                (aActor, aEvent) => this._onMenuKeyRelease(aActor, aEvent));
        }.bind(this), 500);
    }

    _rebuildDeviceSection(aDevice) {
        this.lastCapture[aDevice] = null;
        const sectionHeader = this[`${aDevice}Header`];
        const section = this[`${aDevice}Section`];
        const headerLabel = aDevice === "camera" ? _("Screenshot") : _("Screencast");
        const deviceOptionItems = [];

        section.removeAll();

        // Set header label.
        if (this.hasDevice(aDevice)) {
            if (this.hasDeviceProperty(aDevice, "title")) {
                sectionHeader.setLabel(_(this.getDeviceProperty(aDevice, "title")));
            } else {
                sectionHeader.setLabel(`${headerLabel}: ${_("Assign a title to your program!!!")}`);
            }
        } else {
            sectionHeader.setLabel(`${headerLabel}: ${_("Disabled")}`);
        }

        if (!this.hasDevice(aDevice) &&
            !this.hasDeviceProperty(aDevice, "menuitems")) {
            return true;
        }

        // Populate device section.
        const menuItems = this.getDeviceProperty(aDevice, "menuitems");
        const itemFn = (aDev, aCmdOrAction, aIsRecording) => {
            if (this.getDeviceProgram(aDev) === "cinnamon") {
                if (aDev === "camera") {
                    return (aE) => {
                        return this.runCinnamonCamera(
                            SelectionType[aCmdOrAction], aE);
                    };
                } else {
                    return () => this.toggleCinnamonRecorder();
                }
            } else {
                return (aE) => {
                    this.runCommand(aCmdOrAction, aDev, aIsRecording, true, aE);
                    return false;
                };
            }

            return true;
        };

        for (const item in menuItems) {
            const cmdOrAct = menuItems[item];

            // The Cinnamon's "Repeat last" item is treated differently.
            if (cmdOrAct === "REPEAT") {
                continue;
            }

            // Executing any recorder that isn't Cinnamon's triggers the __setAppletIcon
            // function. Since I uber-simplified the menu items creation, there
            // isn't an easy way of differentiating the menu items that need to affect
            // the state of the applet icon without complicating things. So, I simply
            // "flag" a menu item's label that doesn't need to reflect a state by changing
            // the applet icon with a # (number or hash character).
            const flaged = item.charAt(0) === "#";
            const label = flaged ? item.substr(1) : item;

            if (label === "---") {
                section.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            } else {
                section.addAction(
                    _(label),
                    itemFn(aDevice, cmdOrAct, !flaged && aDevice === "recorder"),
                    (label in KeybindingSupport[aDevice]) ?
                    getKeybindingDisplayName(this.$._[`key_${aDevice}_${KeybindingSupport[aDevice][label]}`]) :
                    ""
                );

                if (label in KeybindingSupport[aDevice]) {
                    this._storeNewKeybinding(
                        aDevice,
                        label,
                        itemFn(aDevice, cmdOrAct, flaged && aDevice === "recorder")
                    );
                }
            }
        }

        if (this.hasDeviceProperty(aDevice, "cursor")) {
            const includeCursorSwitch = new CustomSwitchMenuItem(
                _("Include cursor"),
                this.$._.include_cursor, {
                    style_class: "bin"
                }
            );
            includeCursorSwitch.tooltip = new IntelligentTooltip(
                includeCursorSwitch.actor,
                _("Whether to include mouse cursor in screenshot.")
            );
            includeCursorSwitch.connect("toggled", (aSwitch, aVal) => {
                this.$._.include_cursor = aVal;
                return false;
            });
            deviceOptionItems.push(includeCursorSwitch);
        }

        if (aDevice === "camera") {
            if (this.getDeviceProgram(aDevice) === "cinnamon") {
                if (Main.layoutManager.monitors.length > 1) {
                    Main.layoutManager.monitors.forEach((aMonitor, aMonitorIndex) => {
                        if (aMonitorIndex < 3) {
                            section.addAction(_("Monitor %d").format(aMonitorIndex + 1),
                                (aE) => {
                                    return this.runCinnamonCamera(
                                        SelectionType.MONITOR, aE, aMonitorIndex);
                                }, getKeybindingDisplayName(`key_${aDevice}_monitor_${aMonitorIndex}`));
                        }
                    }, this);
                }

            }

            if (this.$._.show_copy_toggle) {
                const copyDataSwitch = new CustomSwitchMenuItem(
                    _("Auto copy image"),
                    this.$._.auto_copy_data, {
                        style_class: "bin"
                    }
                );
                copyDataSwitch.connect("toggled", (aSwitch, aVal) => {
                    this.$._.auto_copy_data = aVal;
                    return false;
                });
                deviceOptionItems.push(copyDataSwitch);
            } else {
                // Turn off our hidden setting since the UI can't.
                this.$._.auto_copy_data = false;
            }

            this._cameraRedoMenuItem = section.addAction(
                _("Repeat last"),
                () => this.repeatLastCapture(aDevice),
                this.$._.key_camera_repeat);

            if (!this.lastCapture[aDevice]) {
                this._cameraRedoMenuItem.actor.hide();
            }

            this._storeNewKeybinding(
                aDevice,
                "repeat",
                () => this.repeatLastCapture(aDevice)
            );

            if (this.hasDeviceProperty(aDevice, "timer") &&
                this.getDeviceProperty(aDevice, "timer")) {
                const timerSliderHeader = extendMenuItem(
                    new PopupMenu.PopupMenuItem(_("Capture delay")),
                    "detailed_text", "desktop-capture-menu-header"
                );
                timerSliderHeader.setSensitive(false);
                deviceOptionItems.push(timerSliderHeader);

                const timerSlider = new CustomPopupSliderMenuItem(
                    this, {
                        pref_key: "timer_delay",
                        header: timerSliderHeader,
                        info_label_cb: function() {
                            // TO TRANSLATORS:
                            // sec. = abbreviation of "second"
                            // secs. = abbreviation of "seconds"
                            return ngettext("sec.", "secs.", this.$._.timer_delay);
                        }.bind(this),
                        slider_value: parseFloat(this.$._.timer_delay / 10),
                        slider_value_min: 0,
                        slider_value_max: 10
                    });
                timerSlider.tooltip = new IntelligentTooltip(
                    timerSlider.actor,
                    _("How many seconds to wait before taking a screenshot.")
                );
                timerSlider.emit("value-changed");
                deviceOptionItems.push(timerSlider);
            }
        } else if (aDevice === "recorder") {
            if (this.getDeviceProgram(aDevice) === "cinnamon") {
                // Do not add the Cinnamon recorder profile selector
                // if there are no custom profiles.
                if (Object.keys(this.cinnamonRecorderProfiles).length > 1) {
                    const profileSelector = new CinnamonRecorderProfileSelector(
                        this, {
                            item_label: `${_("Profile")}: ${this.cinnamonRecorderProfiles[this.$._.cinn_rec_current_profile]["title"]}`,
                            pref_key: "cinn_rec_current_profile",
                            item_style_class: "desktop-capture-cinnamon-recorder-profile-submenu-label"
                        }
                    );
                    profileSelector.tooltip = new IntelligentTooltip(
                        profileSelector.actor,
                        _("Choose Cinnamon recorder profile")
                    );
                    section.addMenuItem(profileSelector);
                }

                this._cinnamonRecorderItem = section.addAction(
                    _("Start recording"),
                    () => this.toggleCinnamonRecorder(),
                    this.$._.key_recorder_stop_toggle
                );

                this._storeNewKeybinding(
                    aDevice,
                    "stop_toggle",
                    () => this.toggleCinnamonRecorder()
                );
            } else {
                if (this.hasDeviceProperty(aDevice, "sound")) {
                    const soundSwitch = new CustomSwitchMenuItem(
                        _("Record sound"),
                        this.$._.record_sound, {
                            style_class: "bin"
                        }
                    );
                    soundSwitch.tooltip = new IntelligentTooltip(
                        soundSwitch.actor,
                        _("Whether to record sound.")
                    );
                    soundSwitch.connect("toggled", (aSwitch, aVal) => {
                        this.$._.record_sound = aVal;
                        return false;
                    });
                    deviceOptionItems.push(soundSwitch);
                }

                this._recorderRedoMenuItem = section.addAction(
                    _("Repeat last"),
                    () => this.repeatLastCapture(aDevice),
                    this.$._.key_recorder_repeat);

                if (!this.lastCapture[aDevice]) {
                    this._recorderRedoMenuItem.actor.hide();
                }

                this._storeNewKeybinding(
                    aDevice,
                    "repeat",
                    () => this.repeatLastCapture(aDevice)
                );

                if (this.hasDeviceProperty(aDevice, "stop-command")) {
                    section.addAction(
                        _("Stop recording"),
                        () => {
                            this.stopAnyRecorder();
                        }
                    );

                    this._storeNewKeybinding(
                        aDevice,
                        "stop_toggle",
                        () => this.stopAnyRecorder()
                    );
                }
            }

            if (this.hasDeviceProperty(aDevice, "fps") &&
                this.getDeviceProperty(aDevice, "fps")) {
                const fpsSliderHeader = extendMenuItem(
                    new PopupMenu.PopupMenuItem(_("Frames per second")),
                    "detailed_text", "desktop-capture-menu-header"
                );
                fpsSliderHeader.setSensitive(false);
                deviceOptionItems.push(fpsSliderHeader);

                const fpsSlider = new CustomPopupSliderMenuItem(
                    this, {
                        pref_key: "recorder_fps",
                        header: fpsSliderHeader,
                        info_label_cb: () => {
                            return _("FPS");
                        },
                        slider_value: parseFloat(this.$._.recorder_fps / 120),
                        slider_value_min: 10,
                        slider_value_max: 120
                    });
                fpsSlider.tooltip = new IntelligentTooltip(
                    fpsSlider.actor,
                    _("Frames per second")
                );

                fpsSlider.emit("value-changed");
                deviceOptionItems.push(fpsSlider);
            }
        }

        // Insert option items, if any.
        if (deviceOptionItems.length > 0) {
            let optionsContainer;

            if (this.$._.display_device_options_in_sub_menu) {
                const subMenu = new PopupMenu.PopupSubMenuMenuItem(_("Device options"));
                subMenu.menu.connect("open-state-changed",
                    (aMenu, aOpen) => onSubMenuOpenStateChanged(aMenu, aOpen));
                subMenu.label.add_style_class_name("desktop-capture-device-options-submenu-label");
                section.addMenuItem(subMenu);
                optionsContainer = subMenu.menu;
            } else {
                optionsContainer = section;
            }

            for (const optionItem of deviceOptionItems) {
                optionsContainer.addMenuItem(optionItem);
            }
        }

        this.$.schedule_manager.setTimeout("register_keybindings", function() {
            this._registerKeyBindings();
        }.bind(this), 1000);

        // Stick with the JSON trick. Do not use Object.assign().
        this[`${aDevice}LastCaptureContent`].fileData =
            // Clean up the useless save function bound to the setting property.
            JSON.parse(JSON.stringify(this.$._[`last_${aDevice}_capture`]));

        return true;
    }

    getFilenameForDevice(aDevice, aType) {
        const date = new Date();
        let prefix = this.$._[`${aDevice}_save_prefix`];

        if (!aType) {
            prefix = prefix.replace("%TYPE_", "");
            prefix = prefix.replace("%TYPE-", "");
            prefix = prefix.replace("%TYPE", "");
        }

        const replacements = {
            "%Y": date.getFullYear(),
            "%M": String(date.getMonth() + 1).padStart(2, "0"),
            "%D": String(date.getDate()).padStart(2, "0"),
            "%H": String(date.getHours()).padStart(2, "0"),
            "%I": String(date.getMinutes()).padStart(2, "0"),
            "%S": String(date.getSeconds()).padStart(2, "0"),
            "%m": String(date.getMilliseconds()).padStart(2, "0")
        };

        if (aDevice === "camera") {
            replacements["%TYPE"] = SelectionTypeStr[aType];
        }

        return tokensReplacer(prefix, replacements);
    }

    repeatLastCapture(aDevice) {
        const lastCapture = this.lastCapture[aDevice];

        if (lastCapture) {
            let newFilename;
            if (lastCapture.hasOwnProperty("command")) {
                tryFn(() => {
                    newFilename = this.getFilenameForDevice(lastCapture.device);
                }, (aErr) => {
                    newFilename = false;
                    global.logError(aErr);
                });

                if (!newFilename) {
                    return false;
                }

                const cmd = lastCapture.command
                    .replace(lastCapture.current_file_name, newFilename);
                lastCapture.current_file_path = lastCapture.current_file_path.replace(
                    lastCapture.current_file_name,
                    newFilename
                );

                runtimeInfo(`Running again command: ${cmd}`);

                this.TryExec({
                    command: cmd,
                    device: aDevice,
                    is_recording: lastCapture.is_recording,
                    current_file_path: lastCapture.current_file_path,
                    current_file_extension: lastCapture.current_file_extension,
                    current_file_name: newFilename,
                    on_start: (aParams) => this.onProcessSpawned(aParams),
                    on_failure: (aParams) => this.onProcessError(aParams),
                    on_complete: (aParams) => this.onProcessComplete(aParams)
                });
            } else {
                tryFn(() => {
                    newFilename = this._getCreateFilePath(this._cameraSaveDir,
                        this.getFilenameForDevice("camera", lastCapture.selectionType), "png");
                }, (aErr) => {
                    newFilename = false;
                    global.logError(aErr);
                });

                if (!newFilename) {
                    return false;
                }

                lastCapture.options.filename = newFilename;

                this.closeMainMenu();
                const camera = new ScreenshotHelper(null, null,
                    lastCapture.options);

                // Timeout to not worry about closing menu animation.
                this.$.schedule_manager.setTimeout("repeat_last_capture", function() {
                    switch (lastCapture.selectionType) {
                        case SelectionType.WINDOW:
                            camera.screenshotWindow(
                                lastCapture.window,
                                lastCapture.options);
                            break;
                        case SelectionType.AREA:
                            camera.screenshotArea(
                                lastCapture.x,
                                lastCapture.y,
                                lastCapture.width,
                                lastCapture.height,
                                lastCapture.options);
                            break;
                        case SelectionType.CINNAMON:
                            camera.screenshotCinnamon(
                                lastCapture.actor,
                                lastCapture.stageX,
                                lastCapture.stageY,
                                lastCapture.options);
                            break;
                    }
                }.bind(this), 200);
            }
        }

        return true;
    }

    cinnamonCameraComplete(screenshot) {
        screenshot.uploaded = false;
        screenshot.json = null;
        screenshot.extraActionMessage = "";

        this.lastCapture["camera"] = screenshot;

        // All programs/devices support redo item, but Cinnamon's needs "special treatment".
        if (this.getDeviceProgram("camera") === "cinnamon") {
            if (this.lastCapture["camera"].selectionType !== SelectionType.SCREEN) {
                this._cameraRedoMenuItem.actor.show();
            } else {
                this._cameraRedoMenuItem.actor.hide();
            }
        }

        this._handleHistoryAndClipboard("camera", screenshot.file);
    }

    _handleHistoryAndClipboard(aDevice, aFilePath) {
        const historyEntry = {
            d: new Date().getTime(),
            f: aFilePath
        };

        this.$._[`last_${aDevice}_capture`] = historyEntry;
        this[aDevice + "LastCaptureContent"].fileData = historyEntry;

        if (aDevice === "camera") {
            const copyType = this.$._.auto_copy_data ?
                ClipboardCopyType.IMAGE_DATA :
                this.$._.copy_to_clipboard;

            if (this.$._.auto_copy_data && this.$._.auto_copy_data_auto_off) {
                this.$._.auto_copy_data = false;
                this._rebuildDeviceSection("camera");
            }

            switch (copyType) {
                case ClipboardCopyType.IMAGE_PATH:
                    copyToClipboard(aFilePath);
                    notify([_("File path copied to clipboard.")]);
                    break;
                case ClipboardCopyType.IMAGE_DATA:
                    Exec(`${this.appletHelper} copy_image_data ${aFilePath}`);
                    notify([_("Image data copied to clipboard.")]);
                    break;
            }
        }
    }

    runCinnamonCamera(aType, aEvent, aMonitorIndex) {
        if (aType === SelectionType.REPEAT) {
            runtimeInfo("We shouldn't have reached runCinnamonCamera.");
            return false;
        }

        let filename;

        tryFn(() => {
            filename = this._getCreateFilePath(this._cameraSaveDir,
                this.getFilenameForDevice("camera", aType), "png");
        }, (aErr) => {
            filename = false;
            global.logError(aErr);
        });

        if (!filename) {
            return false;
        }

        const fnCapture = () => {
            let helper = new ScreenshotHelper(aType, // jshint ignore:line
                (aScreenshot) => this.cinnamonCameraComplete(aScreenshot), {
                    includeCursor: this.$._.include_cursor,
                    useFlash: this.$._.use_camera_flash,
                    includeFrame: this.$._.include_window_frame,
                    includeStyles: this.$._.include_styles,
                    windowAsArea: this.$._.capture_window_as_area,
                    playShutterSound: this.$._.play_shutter_sound,
                    useTimer: this.$._.timer_delay > 0,
                    showTimer: this.$._.timer_display_on_screen,
                    playTimerSound: this.$._.play_timer_interval_sound,
                    timerDuration: this.$._.timer_delay,
                    filename: filename,
                    monitorIndex: aMonitorIndex
                }
            );
        };

        this.closeMainMenu();
        // Timeout to not worry about closing menu animation.
        this.$.schedule_manager.setTimeout("run_cinnamon_camera", function() {
            fnCapture();
        }.bind(this), 200);

        return true;
    }

    closeMainMenu() {
        this.menu.close(true);
    }

    _updateCinnamonRecorderStatus() {
        if (this.cinnamonRecorder.is_recording()) {
            this.__setAppletIcon(true);
            this._cinnamonRecorderItem.label.set_text(_("Stop recording"));
        } else {
            this.__setAppletIcon();
            this._cinnamonRecorderItem.label.set_text(_("Start recording"));
        }
    }

    _checkSaveFolder(aFolderPath) {
        const folder = Gio.file_new_for_path(aFolderPath);
        const msg = this.criticalBaseMessage;

        if (!folder.query_exists(null)) {
            msg.push(_("Selected storage folder doesn't exist!"));
            msg.push(folder.get_path());
            notify(msg, "error");
            return false;
        } else {
            const fileType = folder.query_file_type(Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
            // Don't restrict to only directories, just exclude normal files
            if (fileType === Gio.FileType.REGULAR) {
                msg.push(_("Selected storage folder is not a directory!"));
                msg.push(folder.get_path());
                notify(msg, "error");
                return false;
            }
        }

        return true;
    }

    _getCreateFilePath(folderPath, fileName, fileExtension) {
        if (!this._checkSaveFolder(folderPath)) {
            return false;
        }

        const msg = this.criticalBaseMessage;
        const file = Gio.file_new_for_path(`${folderPath}/${fileName}.${fileExtension}`);
        const desiredFilepath = file.get_path();
        msg.push(_("File cannot be created!"));
        msg.push(desiredFilepath);

        try {
            if (file.create(Gio.FileCreateFlags.NONE, null)) {
                file.delete(null);
            } else {
                notify(msg, "error");
                return false;
            }
        } catch (aErr) {
            global.logError(aErr);
            notify(msg, "error");
            return false;
        }

        return desiredFilepath;
    }

    toggleCinnamonRecorder() {
        if (this.cinnamonRecorder.is_recording()) {
            this.cinnamonRecorder.pause();
            Meta.enable_unredirect_for_screen(global.screen);
            this._updateCinnamonRecorderStatus();
        } else {
            let file_path;

            tryFn(() => {
                file_path = this._getCreateFilePath(
                    this._recorderSaveDir,
                    this.getFilenameForDevice("recorder"),
                    this.cinnamonRecorderProfiles[this.$._.cinn_rec_current_profile]["file-extension"]
                );
            }, (aErr) => {
                file_path = false;
                global.logError(aErr);
            });

            if (!file_path) {
                runtimeInfo("No file name.");
                return false;
            }

            this.cinnamonRecorder.set_filename(file_path);
            runtimeInfo(`Capturing screencast to ${file_path}`);

            this.cinnamonRecorder.set_framerate(this.$._.recorder_fps);

            const pipeline = this.cinnamonRecorderProfiles[this.$._.cinn_rec_current_profile]["pipeline"];

            if (!pipeline.match(/^\s*$/)) {
                runtimeInfo(`Pipeline is ${pipeline}`);
                this.cinnamonRecorder.set_pipeline(pipeline);
            } else {
                runtimeInfo("Pipeline is Cinnamon's default");
                this.cinnamonRecorder.set_pipeline(null);
            }

            Meta.disable_unredirect_for_screen(global.screen);

            // Timeout to not worry about closing menu animation.
            this.$.schedule_manager.setTimeout("toggle_cinnamon_recorder", function() {
                tryFn(() => {
                    this.cinnamonRecorder.record();
                }, (aErr) => {
                    global.logError(aErr);
                }, () => {
                    this._updateCinnamonRecorderStatus();
                    this._handleHistoryAndClipboard("recorder", file_path);
                });
            }.bind(this), 200);
        }

        return true;
    }

    get_cinnamon_recorder_property(aProfile, aProperty) {
        if (this.cinnamonRecorderProfiles.hasOwnProperty(aProfile) &&
            this.cinnamonRecorderProfiles[aProfile].hasOwnProperty(aProperty)) {
            return this.cinnamonRecorderProfiles[aProfile][aProperty];
        }

        return CinnamonRecorderProfilesBase["default"][aProperty];
    }

    getDevicePrograms(aDevice) {
        return this.programSupport[aDevice];
    }

    getDeviceProperties(aDevice) {
        return this.programSupport[aDevice][this.getDeviceProgram(aDevice)];
    }

    getDeviceProgram(aDevice) {
        return this.$._[`${aDevice}_program`];
    }

    getDeviceProperty(aDevice, aProperty) {
        return this.getDeviceProperties(aDevice)[aProperty];
    }

    hasDeviceProperty(aDevice, aProperty) {
        return this.getDeviceProperties(aDevice).hasOwnProperty(aProperty);
    }

    hasDevice(aDevice) {
        return this.$._[`${aDevice}_program`] !== "disabled";
    }

    _applyCommandReplacements(aCmd, aDevice) {
        let cursor = "",
            sound = "";

        if (this.hasDeviceProperty(aDevice, "cursor")) {
            cursor = this.getDeviceProperty(aDevice, "cursor")[
                this.$._.include_cursor ? "on" : "off"
            ];
        }

        if (this.hasDeviceProperty(aDevice, "sound")) {
            sound = this.getDeviceProperty(aDevice, "sound")[
                this.$._.record_sound ? "on" : "off"
            ];
        }

        // This has to be done outside the main replacements because the appended
        // code also has replacement data.
        // And this is done differently as the original applet did it so I
        // can use the same object (menuitems) to create items of any kind.
        for (let i = 9; i >= 0; i--) {
            const idx = i + 1;
            const prop = `append-${idx}`;

            if (this.hasDeviceProperty(aDevice, prop)) {
                aCmd = aCmd.replace(`{{APPEND_${idx}}}`, this.getDeviceProperty(aDevice, prop));
            }
        }

        let fileExtension = false;

        if (/{{EXT}}/.test(aCmd)) {
            if ((aCmd.match(/{{EXT}}/g) || []).length === 2) {
                fileExtension = aCmd.split("{{EXT}}")[1];
            }

            aCmd = aCmd.replace(/{{EXT}}/g, "");
        }

        const fileName = this.getFilenameForDevice(aDevice);

        const replacements = {
            "{{SELF}}": this.$._[`${aDevice}_program`],
            "{{DELAY}}": this.$._.timer_delay,
            "{{CURSOR}}": cursor,
            "{{SOUND}}": sound,
            "{{DIRECTORY}}": aDevice === "camera" ?
                this._cameraSaveDir : this._recorderSaveDir,
            "{{SCREEN_DIMENSIONS}}": `${global.screen_width}x${global.screen_height}`,
            "{{SCREEN_WIDTH}}": global.screen_width,
            "{{SCREEN_HEIGHT}}": global.screen_height,
            "{{RECORDER_DIR}}": this._recorderSaveDir,
            "{{SCREENSHOT_DIR}}": this._cameraSaveDir,
            "{{FILENAME}}": fileName
        };

        for (const k in replacements) {
            aCmd = aCmd.replace(k, replacements[k]);
        }

        return {
            command: aCmd,
            current_file_path: (fileExtension ?
                (aDevice === "camera" ?
                    this._cameraSaveDir :
                    this._recorderSaveDir) +
                "/" + fileName + "." + fileExtension :
                false),
            current_file_name: fileName,
            current_file_extension: fileExtension
        };
    }

    runCommand(aCmd, aDevice, aIsRecording, aUseScreenshotHelper, aEvent) {
        const cmdObj = this._applyCommandReplacements(aCmd, aDevice);
        let cmd = cmdObj.command;

        let helperMode = null;
        for (const k in InteractiveCallouts) {
            if (cmd.indexOf(k) !== -1) {
                if (aUseScreenshotHelper) {
                    helperMode = InteractiveCallouts[k];
                    runtimeInfo(`Using screenshot helper from capture mode "${SelectionTypeStr[helperMode]}"`);
                }

                cmd = cmd.replace(k, "");
                cmd = cmd.trim();
                break;
            }
        }

        if (aUseScreenshotHelper) {
            if (helperMode !== null) {
                let ss = new ScreenshotHelper(helperMode, // jshint ignore:line
                    (aVars) => this.runCommandInteractively({
                        command: cmd,
                        event: aEvent,
                        device: aDevice,
                        current_file_path: cmdObj.current_file_path,
                        current_file_extension: cmdObj.current_file_extension,
                        current_file_name: cmdObj.current_file_name,
                        vars: aVars,
                        is_recording: aIsRecording
                    }), {
                        selectionHelper: true
                    });
            } else {
                if (aEvent && aEvent.get_button() === Clutter.BUTTON_SECONDARY) {
                    this.displayDialogMessage(`${_("Displaying command that will be executed")}:` + "\n\n" +
                        `<span font_desc="monospace 10">${escapeHTML(cmd)}</span>`,
                        "info");
                    return false;
                }

                this[`_${aDevice}RedoMenuItem`].actor.hide();
                runtimeInfo(`Running command: ${cmd}`);
                this.TryExec({
                    command: cmd,
                    current_file_path: cmdObj.current_file_path,
                    current_file_extension: cmdObj.current_file_extension,
                    current_file_name: cmdObj.current_file_name,
                    device: aDevice,
                    is_recording: aIsRecording,
                    on_start: (aParams) => this.onProcessSpawned(aParams),
                    on_failure: (aParams) => this.onProcessError(aParams),
                    on_complete: (aParams) => this.onProcessComplete(aParams)
                });
            }
        } else {
            this.TryExec({
                command: cmd
            });
        }

        return false;
    }

    runCommandInteractively(aParams) {
        const niceHeight = aParams.vars["height"] % 2 === 0 ?
            aParams.vars["height"] :
            aParams.vars["height"] + 1,
            niceWidth = aParams.vars["width"] % 2 === 0 ?
            aParams.vars["width"] :
            aParams.vars["width"] + 1;

        const replacements = {
            "{{I_X}}": aParams.vars["x"],
            "{{I_Y}}": aParams.vars["y"],
            "{{I_X_Y}}": `${aParams.vars["x"]},${aParams.vars["y"]}`,
            "{{I_WIDTH}}": aParams.vars["width"],
            "{{I_HEIGHT}}": aParams.vars["height"],
            "{{I_NICE_WIDTH}}": niceWidth,
            "{{I_NICE_HEIGHT}}": niceHeight
        };

        if (aParams.vars["window"]) {
            // numeric xwindow id e.g. to use with xprop/xwininfo
            replacements["{{I_X_WINDOW_ID}}"] = aParams.vars.window.get_meta_window().get_xwindow();
            replacements["{{I_X_WINDOW_FRAME}}"] = aParams.vars.window["x-window"]; // Window frame
            replacements["{{I_WM_CLASS}}"] = aParams.vars.window.get_meta_window().get_wm_class();
            replacements["{{I_WINDOW_TITLE}}"] = aParams.vars.window.get_meta_window().get_title();
        }

        for (const k in replacements) {
            aParams.command = aParams.command.replace(k, replacements[k]);
        }

        if (aParams.event && aParams.event.get_button() === Clutter.BUTTON_SECONDARY) {
            this.displayDialogMessage(`${_("Displaying command that will be executed")}:` + "\n\n" +
                `<span font_desc="monospace 10">${escapeHTML(aParams.command)}</span>`,
                "info");
            return false;
        }

        runtimeInfo(`Interactively running command: ${aParams.command}`);

        this.TryExec({
            command: aParams.command,
            can_repeat: true,
            device: aParams.device,
            is_recording: aParams.is_recording,
            current_file_path: aParams.current_file_path,
            current_file_extension: aParams.current_file_extension,
            current_file_name: aParams.current_file_name,
            on_start: (aParams) => this.onProcessSpawned(aParams),
            on_failure: (aParams) => this.onProcessError(aParams),
            on_complete: (aParams) => this.onProcessComplete(aParams)
        });

        return true;
    }

    onProcessSpawned(aParams) {
        aParams.is_recording && this.__setAppletIcon(true);
    }

    onProcessError(aParams) {
        this.__setAppletIcon();

        this.displayDialogMessage(`${_("Command exited with error status")}:` + "\n\n" +
            `<span font_desc="monospace 10">${escapeHTML(aParams.command)}</span>`,
            "error");
        aParams.stdout && runtimeError(aParams.stdout);
        aParams.stderr && runtimeError(aParams.stderr);
    }

    onProcessComplete(aParams) {
        runtimeInfo(`Process exited with status ${aParams.status}`);

        if (aParams.status > 0) {
            runtimeError(aParams.stdout);
            this.onProcessError({
                command: aParams.command,
                stdout: aParams.stdout,
                stderr: null
            });

            return false;
        }

        this.__setAppletIcon();

        if (aParams.current_file_path) {
            if (aParams.can_repeat) {
                this.lastCapture[aParams.device] = {
                    command: aParams.command,
                    is_recording: aParams.is_recording,
                    device: aParams.device,
                    current_file_path: aParams.current_file_path,
                    current_file_extension: aParams.current_file_extension,
                    current_file_name: aParams.current_file_name
                };
                this[`_${aParams.device}RedoMenuItem`].actor.show();
            }

            this._handleHistoryAndClipboard(aParams.device, aParams.current_file_path);
        }

        return true;
    }

    /**
     * [displayDialogMessage description]
     *
     * Using Gtk/Python to create a dialog instead of Clutter dialogs
     * (ModalDialog class). They are an absolute GARBAGE. Their text message
     * cannot be selected/copied and the dialog cannot be moved out of the way
     * and I would have to write two hundreds lines of code just to get a
     * barely functional dialog.
     * Gtk dialogs are also GARBAGE, but at least they aren't absolute GARBAGE
     * and I can get a functional dialog with just ten lines of code.
     *
     * @param {String} aLevel - "error" or "warning"
     * @param {String} aMsg   - The message.
     */
    displayDialogMessage(aMsg, aLevel) {
        const msg = {
            title: _(this.$.metadata.name),
            message: aMsg
        };

        Util.spawn_async([this.appletHelper, aLevel, JSON.stringify(msg)], null);
    }

    Exec(cmd) {
        this.closeMainMenu();

        // Timeout to not worry about closing menu animation.
        this.$.schedule_manager.setTimeout("exec", function() {
            Exec(cmd);
        }.bind(this), 200);

    }

    TryExec(aParams) {
        this.closeMainMenu();

        // Timeout to not worry about closing menu animation.
        this.$.schedule_manager.setTimeout("try_exec", function() {
            TryExec(aParams);
        }.bind(this), 200);
    }

    _exportJSONData(aPref) {
        Util.spawn_async([
                this.appletHelper,
                "export",
                this.$._.imp_exp_last_selected_directory
            ],
            (aOutput) => {
                const path = aOutput.trim();

                if (!Boolean(path)) {
                    return;
                }

                const rawData = JSON.stringify(this.$._[aPref], null, 4);
                const file = new File(path);
                this.$._.imp_exp_last_selected_directory = path;
                file.write(rawData).catch((aErr) => global.logError(aErr));
            }
        );
    }

    _importJSONData(aPref) {
        Util.spawn_async([
                this.appletHelper,
                "import",
                this.$._.imp_exp_last_selected_directory
            ],
            (aOutput) => {
                const path = aOutput.trim();

                if (!Boolean(path) && GLib.path_is_absolute(path) &&
                    GLib.file_test(path, GLib.FileTest.EXISTS)) {
                    return;
                }

                const file = new File(path);
                this.$._.imp_exp_last_selected_directory = path;
                file.read().then((aData) => {
                    tryFn(() => {
                        const jsonData = JSON.parse(aData);

                        switch (aPref) {
                            case "program_support":
                                this._handleImportedPrograms(jsonData);
                                break;
                            case "cinn_rec_profiles":
                                this._handleImportedCinnamonRecorderProfiles(jsonData);
                                break;
                        }
                    }, (aErr) => {
                        global.logError(aErr);
                        notify([
                            _("Possibly malformed JSON file."),
                            _("Check the logs."),
                            "~/.cinnamon/glass.log",
                            "~/.xsession-errors"
                        ], "error");
                    });
                }).catch((aErr) => {
                    global.logError(aErr);
                });
            }
        );
    }

    _handleImportedPrograms(aJSONData) {
        tryFn(() => {
            if (isObject(aJSONData)) {
                for (const device of Devices) {
                    if (!aJSONData.hasOwnProperty(device)) {
                        aJSONData[device] = {};
                    }
                }

                this.$._.program_support = aJSONData;
            } else {
                this.$._.program_support = PROGRAMS_SUPPORT_EMPTY;
            }
        }, (aErr) => {
            global.logError(aErr);
            this.$._.program_support = PROGRAMS_SUPPORT_EMPTY;
        }, () => {
            this._setupProgramSupport();
        });
    }

    _handleImportedCinnamonRecorderProfiles(aJSONData) {
        tryFn(() => {
            if (isObject(aJSONData)) {
                this.$._.cinn_rec_profiles = aJSONData;
            } else {
                this.$._.cinn_rec_profiles = {};
            }
        }, (aErr) => {
            global.logError(aErr);
            this.$._.cinn_rec_profiles = {};
        }, () => {
            this._setupCinnamonRecorderProfiles();
        });
    }

    _resetPrefToDefault(aPref) {
        askForConfirmation({
            message: _("Do you really want to reset this preference to its default value?"),
            pref_name: aPref
        }, (aParams) => {
            this.settings_schema_file.read().then((aData) => {
                tryFn(() => {
                    this.$._[aParams.pref_name] = JSON.parse(aData)[aParams.pref_name].default;
                }, (aErr) => {
                    global.logError(aErr);
                }, () => {
                    switch (aParams.pref_name) {
                        case "program_support":
                            this._setupProgramSupport();
                            break;
                        case "cinn_rec_profiles":
                            this._setupCinnamonRecorderProfiles();
                            break;
                    }
                });
            }).catch((aErr) => global.logError(aErr));
        });
    }

    _clearPref(aPref, aPrefEmptyVal) {
        askForConfirmation({
            message: _("Do you really want to empty this preference?"),
            pref_name: aPref,
            pref_empty_value: aPrefEmptyVal
        }, (aParams) => {
            tryFn(() => {
                this.$._[aParams.pref_name] = aParams.pref_empty_value;
            }, (aErr) => {}, () => { // jshint ignore:line
                switch (aParams.pref_name) {
                    case "program_support":
                        this._setupProgramSupport();
                        break;
                    case "cinn_rec_profiles":
                        this._setupCinnamonRecorderProfiles();
                        break;
                }
            });
        });
    }

    get criticalBaseMessage() {
        return [
            _("Operation aborted!")
        ];
    }

    get programSupport() {
        return this._programSupport;
    }

    set programSupport(aVal) {
        delete this._programSupport;
        this._programSupport = aVal;
    }

    get cinnamonRecorderProfiles() {
        return this._cinnamonRecorderProfiles;
    }

    set cinnamonRecorderProfiles(aVal) {
        delete this._cinnamonRecorderProfiles;
        this._cinnamonRecorderProfiles = aVal;
    }

    on_applet_clicked() {
        this.menu.toggle();
    }

    on_applet_removed_from_panel() {
        super.on_applet_removed_from_panel();
    }

    __onSettingsChanged(aPrefOldValue, aPrefKey) {
        switch (aPrefKey) {
            case "theme_selector":
            case "theme_custom":
                if (aPrefKey === "theme_custom" &&
                    this.$._.theme_selector !== "custom") {
                    return;
                }

                this._loadTheme(true);
                break;
            case "applet_icon":
            case "applet_icon_recording":
                this.__setAppletIcon();
                break;
            case "camera_save_dir":
            case "recorder_save_dir":
                this._setupSaveDirs();
                break;
            case "show_copy_toggle":
            case "camera_program":
                this._rebuildDeviceSection("camera");
                break;
            case "recorder_program":
                if (this.$._.recorder_program === "cinnamon") {
                    this.cinnamonRecorder = new Cinnamon.Recorder({
                        stage: global.stage
                    });
                }

                this._rebuildDeviceSection("recorder");
                break;
            case "save_keybindings":
            case "display_device_options_in_sub_menu":
                this.drawMenu();
                break;
        }
    }
}

function main() {
    Debugger.wrapObjectMethods({
        DesktopCapture: DesktopCapture,
        IntelligentTooltip: IntelligentTooltip
    });

    return new DesktopCapture(...arguments);
}
