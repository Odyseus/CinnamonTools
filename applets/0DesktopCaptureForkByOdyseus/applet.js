const AppletUUID = "{{UUID}}";

let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets[AppletUUID].utils;
}

const _ = $._;
const ngettext = $.ngettext;

const {
    gi: {
        Cinnamon,
        Clutter,
        Gio,
        GLib,
        Gtk,
        Meta,
        St
    },
    mainloop: Mainloop,
    misc: {
        util: Util
    },
    ui: {
        applet: Applet,
        main: Main,
        popupMenu: PopupMenu,
        settings: Settings
    }
} = imports;

function DesktopCapture() {
    this._init.apply(this, arguments);
}

DesktopCapture.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(aMetadata, aOrientation, aPanel_height, aInstance_id) {
        Applet.IconApplet.prototype._init.call(this, aOrientation, aPanel_height, aInstance_id);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.metadata = aMetadata;
        this.instance_id = aInstance_id;
        this.orientation = aOrientation;
        this._keybinding_base = this.metadata.uuid + "-" + this.instance_id;

        this._initializeSettings(() => {
            this._expandAppletContextMenu();
            Gtk.IconTheme.get_default().append_search_path(aMetadata.path + "/icons/");
        }, () => {
            this.logger = new $.Logger("DesktopCapture", this.pref_enable_verbose_logging);

            this.appletHelper = this.metadata.path + "/appletHelper.py";
            this.cinnamonRecorder = null;
            this.lastCapture = {
                camera: null,
                recorder: null
            };
            this.oldStylesheetPath = null;
            this.rebuild_recorder_section_id = null;
            this.rebuild_camera_section_id = null;
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

            if (this.pref_recorder_program === "cinnamon") {
                this.cinnamonRecorder = new Cinnamon.Recorder({
                    stage: global.stage
                });
            }

            // I'm forced to use a timeout because the absolutely retarded Cinnamon settings
            // system isn't triggering the f*cking settings changed callbacks!!!!
            // So, in versions of Cinnamon that doesn't trigger such callback, I have to call them
            // manually. And in versions of Cinnamon that do trigger such callbacks, they are
            // triggered manually AND automatically.
            this._draw_menu_id = 0;
            this._register_key_bindings_id = 0;

            this._setupSaveDirs();

            this.menuManager = new PopupMenu.PopupMenuManager(this);

            this.set_applet_tooltip(_(this.metadata.description));

            this.loadTheme();
            this._setupProgramSupport();
            this._setupCinnamonRecorderProfiles();

            // When monitors are connected or disconnected, redraw the menu
            Main.layoutManager.connect("monitors-changed", () => {
                if (this.pref_camera_program === "cinnamon") {
                    this.drawMenu();
                }
            });
            Main.themeManager.connect("theme-set", () => this.loadTheme());

            this._disclaimerRead();
        });
    },

    _expandAppletContextMenu: function() {
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

        let itemFns = (aType, aPrefName, aPrefEmptyVal) => {
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
                    return (aMenu, aOpen) => $.onSubMenuOpenStateChanged(aMenu, aOpen);
            }
        };

        for (let pref of [{
                name: "pref_program_support",
                empty_value: $.PROGRAMS_SUPPORT_EMPTY
            }, {
                name: "pref_cinn_rec_profiles",
                empty_value: {}
            }]) {
            let subMLabel,
                exportLabel,
                importLabel,
                resetLabel,
                removeLabel;

            switch (pref.name) {
                case "pref_program_support":
                    subMLabel = _("Programs Support");
                    exportLabel = _("Export programs");
                    importLabel = _("Import programs");
                    resetLabel = _("Reset programs");
                    removeLabel = _("Remove all programs");
                    break;
                case "pref_cinn_rec_profiles":
                    subMLabel = _("Cinnamon Recorder Profiles");
                    exportLabel = _("Export profiles");
                    importLabel = _("Import profiles");
                    resetLabel = _("Reset profiles");
                    removeLabel = _("Remove all profiles");
                    break;
            }

            let subMenu = new PopupMenu.PopupSubMenuMenuItem(subMLabel);
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
        mi.connect("activate",
            () => this._doRunHandler(this.metadata.path + "/HELP.html"));
        this._applet_context_menu.addMenuItem(mi);
    },

    _initializeSettings: function(aDirectCallback, aIdleCallback) {
        this.settings = new Settings.AppletSettings(
            this,
            this.metadata.uuid,
            this.instance_id,
            true // Asynchronous settings initialization.
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
            "pref_custom_icon_for_applet",
            "pref_custom_icon_for_applet_recording",
            "pref_camera_save_dir",
            "pref_camera_save_prefix",
            "pref_include_cursor",
            "pref_timer_delay",
            "pref_recorder_fps",
            "pref_timer_display_on_screen",
            "pref_key_camera_window",
            "pref_key_camera_area",
            "pref_key_camera_cinnamon_ui",
            "pref_key_camera_screen",
            "pref_key_camera_repeat",
            "pref_key_camera_monitor_0",
            "pref_key_camera_monitor_1",
            "pref_key_camera_monitor_2",
            "pref_key_recorder_repeat",
            "pref_capture_window_as_area",
            "pref_include_window_frame",
            "pref_use_camera_flash",
            "pref_include_styles",
            "pref_play_shutter_sound",
            "pref_play_timer_interval_sound",
            "pref_copy_to_clipboard",
            "pref_show_copy_toggle",
            "pref_auto_copy_data_auto_off",
            "pref_auto_copy_data",
            "pref_recorder_save_dir",
            "pref_recorder_save_prefix",
            "pref_key_recorder_stop_toggle",
            "pref_record_sound",
            "pref_disclaimer_read",
            "pref_enable_verbose_logging",
            "pref_theme_selector",
            "pref_theme_custom",
            "pref_program_support",
            "pref_cinn_rec_current_profile",
            "pref_cinn_rec_profiles",
            "pref_camera_program",
            "pref_recorder_program",
            "pref_imp_exp_last_selected_directory",
            "pref_display_device_options_in_sub_menu",
            "pref_last_camera_capture",
            "pref_last_recorder_capture"
        ];
        let newBinding = typeof this.settings.bind === "function";
        for (let pref_key of prefKeysArray) {
            // Condition needed for retro-compatibility.
            // Mark for deletion on EOL. Cinnamon 3.2.x+
            // Abandon this.settings.bindProperty and keep this.settings.bind.
            if (newBinding) {
                this.settings.bind(pref_key, pref_key, this._onSettingsChanged, pref_key);
            } else {
                this.settings.bindProperty(bD.BIDIRECTIONAL, pref_key, pref_key,
                    this._onSettingsChanged, pref_key);
            }
        }
    },

    loadTheme: function(aFullReload) {
        this.logger.debug("");

        let globalTheme;

        try {
            globalTheme = St.ThemeContext.get_for_stage(global.stage).get_theme();
        } catch (aErr) {
            globalTheme = null;
        }

        if (globalTheme) {
            if (this.oldStylesheetPath) {
                try {
                    globalTheme.unload_stylesheet(this.oldStylesheetPath);
                } catch (aErr) {
                    this.logger.warning("Failing unloading stylesheet");
                    this.logger.warning(aErr);
                }
            }

            try {
                let cssPath = this.getCssPath();

                if (!cssPath) {
                    throw _("No stylesheet found");
                }

                globalTheme.load_stylesheet(cssPath);
                this.oldStylesheetPath = cssPath;
            } catch (aErr) {
                this.logger.warning("Error loading stylesheet");
                this.logger.warning(aErr);
            } finally {
                if (aFullReload) {
                    Main.themeManager._changeTheme();
                }
            }
        }
    },

    getCssPath: function() {
        this.logger.debug("");

        switch (this.pref_theme_selector) {
            case "light":
                return this.metadata.path + "/themes/light-overlay.css";
            case "dark":
                return this.metadata.path + "/themes/dark-overlay.css";
            case "custom":
                if (!this.pref_theme_custom) {
                    return null;
                }

                return /^file:\/\//.test(this.pref_theme_custom) ?
                    this.pref_theme_custom.substr(7) :
                    this.pref_theme_custom;
        }

        return "";
    },

    _setAppletIcon: function(aRecording) {
        this.logger.debug("");

        let icon = (aRecording ?
                this.pref_custom_icon_for_applet_recording :
                this.pref_custom_icon_for_applet) ||
            "desktop-capture-camera-photo-symbolic";
        let setIcon = (aIcon, aIsPath) => {
            if (aIcon.search("-symbolic") !== -1) {
                this[aIsPath ?
                    "set_applet_icon_symbolic_path" :
                    "set_applet_icon_symbolic_name"](aIcon);
            } else {
                this[aIsPath ?
                    "set_applet_icon_path" :
                    "set_applet_icon_name"](aIcon);
            }
        };

        if (GLib.path_is_absolute(icon) &&
            GLib.file_test(icon, GLib.FileTest.EXISTS)) {
            setIcon(icon, true);
        } else {
            try {
                setIcon(icon);
            } catch (aErr) {
                global.logWarning('Could not load icon "' + icon + '" for applet.');
            }
        }
    },

    stopAnyRecorder: function() {
        this.logger.debug("");

        let device = "recorder";

        if (this.getDeviceProgram(device) === "cinnamon") {
            this.toggleCinnamonRecorder();
        } else if (this.hasDeviceProperty(device, "stop-command")) {
            this.runCommand(
                this.getDeviceProperty(device, "stop-command"), device, false, false);
        }
    },

    _storeNewKeybinding: function(aDevice, aLabel, aCallback) {
        this.logger.debug("");

        if (!this._newKeybindingsStorage.hasOwnProperty(aDevice)) {
            this._newKeybindingsStorage[aDevice] = [];
        }

        // aLabel can be a property in KeybindingSupport or directly the pref.
        // name suffix. One case of this is when registering the keybinding
        // for Cinnamon's recorder or the stop recorder keybinding.
        let keyPrefNameSuffix = $.KeybindingSupport[aDevice].hasOwnProperty(aLabel) ?
            $.KeybindingSupport[aDevice][aLabel] : aLabel;
        let keyPrefName = "pref_key_" + aDevice + "_" + keyPrefNameSuffix;

        // Check if keyPrefName is a property of the applet (the actual pref. name)
        // and check if the pref. actually has a keybinding set. Otherwise, do
        // not store the new keybinding into _newKeybindingsStorage.
        if (this.hasOwnProperty(keyPrefName) && this[keyPrefName]) {
            this._newKeybindingsStorage[aDevice].push({
                keybindingName: this._keybinding_base + "-" + keyPrefName,
                keyPrefValue: this[keyPrefName],
                callback: aCallback
            });
        }
    },

    _registerKeyBindings: function() {
        this.logger.debug("");

        this._removeKeybindings(() => {
            // Define function outside loop.
            let keyFn = (aKey) => {
                return () => {
                    aKey.callback();
                };
            };

            for (let device of $.Devices) {
                // If the device is disabled, do not bother storing keybindings.
                if (!this.hasDevice(device)) {
                    continue;
                }

                let newKeys = this._newKeybindingsStorage.hasOwnProperty(device) ?
                    this._newKeybindingsStorage[device] : [];

                // If there isn't new keys, do not continue.
                if (newKeys.length === 0) {
                    continue;
                }

                for (let key of newKeys) {
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
    },

    _removeKeybindings: function(aCallback) {
        this.logger.debug("");

        try {
            for (let keybindingName of this._oldKeybindingsNames) {
                Main.keybindingManager.removeHotKey(keybindingName);
            }
        } finally {
            this._oldKeybindingsNames = [];

            if (!!aCallback) {
                aCallback();
            }
        }
    },

    _setupCinnamonRecorderProfiles: function() {
        this.logger.debug("");

        let prefcinnamonRecorderProfilesCopy = JSON.parse(
            JSON.stringify(this.pref_cinn_rec_profiles));

        this.cinnamonRecorderProfiles = $.mergeRecursive($.CinnamonRecorderProfilesBase,
            JSON.parse(JSON.stringify(prefcinnamonRecorderProfilesCopy)));

        if (!this.cinnamonRecorderProfiles
            .hasOwnProperty(this.pref_cinn_rec_current_profile)) {
            this.pref_cinn_rec_current_profile = "default";
        }

        this.drawMenu();
    },

    _setupProgramSupport: function() {
        this.logger.debug("");

        // Clone the original object before doing possible modifications.
        // It is to avoid triggering the pref callback.
        // JSON back and forth conversion because Object.assign isn't available
        // on the version of Cinnamon that I use and because Object.assign is
        // just garbage and because it gets rid of functions.
        let prefProgramSupportCopy = JSON.parse(JSON.stringify(this.pref_program_support));
        // If either of the devices in the preference pref_program_support
        // has "disabled" or "cinnamon", remove them.
        // Those two shouldn't be overriden/removed/modified.
        for (let prop of ["disabled", "cinnamon"]) {
            for (let device of $.Devices) {
                if (prefProgramSupportCopy[device].hasOwnProperty(prop)) {
                    delete prefProgramSupportCopy[device][prop];
                }
            }
        }

        if (prefProgramSupportCopy !== this.pref_program_support) {
            this.pref_program_support = prefProgramSupportCopy;
        }

        // Use all this nonsense until the "geniuses" at Mozilla finally decide
        // on a unique and standard way for deep merging objects.
        this.programSupport = $.mergeRecursive($.ProgramSupportBase,
            JSON.parse(JSON.stringify(prefProgramSupportCopy)));

        // If the new modified programSupport doesn't contain the currently
        // set program for a device, set the current program to cinnamon.
        // A situation in which this could happen is when importing new programs.
        // The newly imported list could have removed the currently set
        // program for a device.
        // Doing it AFTER programSupport has been generated so is checked with
        // "disabled" and "cinnamon" in it.
        for (let device of $.Devices) {
            if (!this.programSupport[device]
                .hasOwnProperty(this["pref_" + device + "_program"])) {
                this["pref_" + device + "_program"] = "cinnamon";
            }
        }

        this.drawMenu();
    },

    _setupSaveDirs: function() {
        this.logger.debug("");

        let prefMap = {
            pref_camera_save_dir: "_cameraSaveDir",
            pref_recorder_save_dir: "_recorderSaveDir"
        };

        for (let pref in prefMap) {
            if (!this[pref].trim()) {
                // If the pref is empty, setup default user directories.
                let defaultDir = GLib.get_user_special_dir(
                    (pref === "pref_camera_save_dir" ?
                        GLib.UserDirectory.DIRECTORY_PICTURES :
                        GLib.UserDirectory.DIRECTORY_VIDEOS));
                this[pref] = defaultDir;
                this[prefMap[pref]] = defaultDir;
            } else if (/^file:\/\//.test(this[pref])) {
                // In case that an URI is used instead of a path.
                this[pref] = this[pref].replace("file://", "");
                this[prefMap[pref]] = this[pref].replace("file://", "");
            } else {
                // Leave it as-is.
                this[prefMap[pref]] = this[pref];
            }
        }
    },

    _onMenuKeyRelease: function(actor, event) {
        this.logger.debug("");

        let symbol = event.get_key_symbol();

        if (symbol === Clutter.Shift_L) {
            this.setModifier(symbol, false);
        }

        return false;
    },

    _onMenuKeyPress: function(actor, event) {
        this.logger.debug("");

        let symbol = event.get_key_symbol();

        if (symbol === Clutter.Shift_L) {
            this.setModifier(symbol, true);
        }

        return false;
    },

    _doRunHandler: function(aURI) {
        this.logger.debug("");

        let uri = /^file:\/\//.test(aURI) ?
            aURI :
            "file://" + aURI;

        // Gio.app_info_launch_default_for_uri returns false in case of error.
        // If so, try to use xdg-open.
        if (!Gio.app_info_launch_default_for_uri(uri,
                new Gio.AppLaunchContext())) {
            this.logger.runtime_info("Spawning xdg-open " + uri);
            Util.spawn_async(["xdg-open", uri], null);
        }
    },

    drawMenu: function() {
        this.logger.debug("");

        this._setAppletIcon();
        this._newKeybindingsStorage = {};

        if (this._draw_menu_id > 0) {
            Mainloop.source_remove(this._draw_menu_id);
            this._draw_menu_id = 0;
        }

        this._draw_menu_id = Mainloop.timeout_add(500, () => {
            if (this.menu) {
                this.menuManager.removeMenu(this.menu);
                this.menu.removeAll(); // Just in case.
                this.menu.destroy();
            }

            this.menu = new Applet.AppletPopupMenu(this, this.orientation);
            this.menuManager.addMenu(this.menu);

            let lastCaptureFn = (aDevive) => {
                return (aMenu, aOpen) => {
                    aOpen && this[aDevive + "LastCaptureContent"]._onFileDataChanged();
                    $.onSubMenuOpenStateChanged(aMenu, aOpen);
                };
            };

            for (let device of $.Devices) {
                this[device + "Header"] = new $.ProgramSelectorSubMenuItem(
                    this, {
                        item_label: " ",
                        pref_key: "pref_" + device + "_program",
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
                this[device + "Header"].tooltip = new $.CustomTooltip(
                    this[device + "Header"].actor,
                    (device === "camera" ?
                        _("Choose camera") :
                        _("Choose recorder"))
                );

                this[device + "Section"] = new $.CustomPopupMenuSection();

                let lastCaptureSubMenu = new PopupMenu.PopupSubMenuMenuItem(_("Latest Capture"));
                this[device + "LastCaptureContent"] = new $.LastCaptureContainer(this, {
                    device: device
                });
                lastCaptureSubMenu.menu.connect("open-state-changed", lastCaptureFn(device));
                lastCaptureSubMenu.label.add_style_class_name("desktop-capture-last-capture-submenu-label");
                lastCaptureSubMenu.menu.addMenuItem(this[device + "LastCaptureContent"]);

                this.menu.addMenuItem(this[device + "Header"]);
                this.menu.addMenuItem(this[device + "Section"]);
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
        });
    },

    _rebuildDeviceSection: function(aDevice) {
        this.logger.debug("");

        this.lastCapture[aDevice] = null;
        let sectionHeader = this[aDevice + "Header"];
        let section = this[aDevice + "Section"];
        let headerLabel = aDevice === "camera" ? _("Screenshot") : _("Screencast");
        let deviceOptionItems = [];

        section.removeAll();

        // Set header label.
        if (this.hasDevice(aDevice)) {
            if (this.hasDeviceProperty(aDevice, "title")) {
                sectionHeader.setLabel(_(this.getDeviceProperty(aDevice, "title")));
            } else {
                sectionHeader.setLabel(headerLabel + ": " +
                    _("Assign a title to your program!!!"));
            }
        } else {
            sectionHeader.setLabel(headerLabel + ": " +
                _("Disabled"));
        }

        if (!this.hasDevice(aDevice) &&
            !this.hasDeviceProperty(aDevice, "menuitems")) {
            return true;
        }

        // Populate device section.
        let menuItems = this.getDeviceProperty(aDevice, "menuitems");
        let itemFn = (aDev, aCmdOrAction, aIsRecording) => {
            if (this.getDeviceProgram(aDev) === "cinnamon") {
                if (aDev === "camera") {
                    return (aE) => {
                        return this.runCinnamonCamera(
                            $.SelectionType[aCmdOrAction], aE);
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

        for (let item in menuItems) {
            let cmdOrAct = menuItems[item];

            // The Cinnamon's "Repeat last" item is treated differently.
            if (cmdOrAct === "REPEAT") {
                continue;
            }

            // Executing any recorder that isn't Cinnamon's triggers the _setAppletIcon
            // function. Since I uber-simplified the menu items creation, there
            // isn't an easy way of differentiating the menu items that need to affect
            // the state of the applet icon without complicating things. So, I simply
            // "flag" a menu item's label that doesn't need to reflect a state by changing
            // the applet icon with a # (number or hash character).
            let flaged = item.charAt(0) === "#";
            let label = flaged ? item.substr(1) : item;

            if (label === "---") {
                section.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            } else {
                section.addAction(
                    _(label),
                    itemFn(aDevice, cmdOrAct, !flaged && aDevice === "recorder"),
                    (label in $.KeybindingSupport[aDevice]) ?
                    this["pref_key_" + aDevice + "_" +
                        $.KeybindingSupport[aDevice][label]] :
                    ""
                );

                if (label in $.KeybindingSupport[aDevice]) {
                    this._storeNewKeybinding(
                        aDevice,
                        label,
                        itemFn(aDevice, cmdOrAct, flaged && aDevice === "recorder")
                    );
                }
            }
        }

        if (this.hasDeviceProperty(aDevice, "cursor")) {
            let includeCursorSwitch = new $.CustomSwitchMenuItem(
                _("Include cursor"),
                this.pref_include_cursor, {
                    style_class: "bin"
                }
            );
            includeCursorSwitch.tooltip = new $.CustomTooltip(
                includeCursorSwitch.actor,
                _("Whether to include mouse cursor in screenshot.")
            );
            includeCursorSwitch.connect("toggled", (aSwitch, aVal) => {
                this.pref_include_cursor = aVal;
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
                                        $.SelectionType.MONITOR, aE, aMonitorIndex);
                                }, "pref_key_" + aDevice + "_monitor_" + aMonitorIndex);
                        }
                    }, this);
                }

            }

            if (this.pref_show_copy_toggle) {
                let copyDataSwitch = new $.CustomSwitchMenuItem(
                    _("Auto copy image"),
                    this.pref_auto_copy_data, {
                        style_class: "bin"
                    }
                );
                copyDataSwitch.connect("toggled", (aSwitch, aVal) => {
                    this.pref_auto_copy_data = aVal;
                    return false;
                });
                deviceOptionItems.push(copyDataSwitch);
            } else {
                // Turn off our hidden setting since the UI can't.
                this.pref_auto_copy_data = false;
            }

            this._cameraRedoMenuItem = section.addAction(
                _("Repeat last"),
                () => this.repeatLastCapture(aDevice),
                this.pref_key_camera_repeat);

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
                let timerSliderHeader = $.extendMenuItem(
                    new PopupMenu.PopupMenuItem(_("Capture delay")),
                    "detailed_text", "desktop-capture-menu-header"
                );
                timerSliderHeader.setSensitive(false);
                deviceOptionItems.push(timerSliderHeader);

                let timerSlider = new $.CustomPopupSliderMenuItem(
                    this, {
                        pref_key: "pref_timer_delay",
                        header: timerSliderHeader,
                        info_label_cb: function() {
                            // TO TRANSLATORS:
                            // sec. = abbreviation of "second"
                            // secs. = abbreviation of "seconds"
                            return ngettext("sec.", "secs.", this.pref_timer_delay);
                        }.bind(this),
                        slider_value: parseFloat(this.pref_timer_delay / 10),
                        slider_value_min: 0,
                        slider_value_max: 10
                    });
                timerSlider.tooltip = new $.CustomTooltip(
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
                    let profileSelector = new $.CinnamonRecorderProfileSelector(
                        this, {
                            item_label: _("Profile") + ": " +
                                this.cinnamonRecorderProfiles[
                                    this.pref_cinn_rec_current_profile]["title"],
                            pref_key: "pref_cinn_rec_current_profile",
                            item_style_class: "desktop-capture-cinnamon-recorder-profile-submenu-label"
                        }
                    );
                    profileSelector.tooltip = new $.CustomTooltip(
                        profileSelector.actor,
                        _("Choose Cinnamon recorder profile")
                    );
                    section.addMenuItem(profileSelector);
                }

                this._cinnamonRecorderItem = section.addAction(
                    _("Start recording"),
                    () => this.toggleCinnamonRecorder(),
                    this.pref_key_recorder_stop_toggle
                );

                this._storeNewKeybinding(
                    aDevice,
                    "stop_toggle",
                    () => this.toggleCinnamonRecorder()
                );
            } else {
                if (this.hasDeviceProperty(aDevice, "sound")) {
                    let soundSwitch = new $.CustomSwitchMenuItem(
                        _("Record sound"),
                        this.pref_record_sound, {
                            style_class: "bin"
                        }
                    );
                    soundSwitch.tooltip = new $.CustomTooltip(
                        soundSwitch.actor,
                        _("Whether to record sound.")
                    );
                    soundSwitch.connect("toggled", (aSwitch, aVal) => {
                        this.pref_record_sound = aVal;
                        return false;
                    });
                    deviceOptionItems.push(soundSwitch);
                }

                this._recorderRedoMenuItem = section.addAction(
                    _("Repeat last"),
                    () => this.repeatLastCapture(aDevice),
                    this.pref_key_recorder_repeat);

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
                }
            }

            if (this.hasDeviceProperty(aDevice, "fps") &&
                this.getDeviceProperty(aDevice, "fps")) {
                let fpsSliderHeader = $.extendMenuItem(
                    new PopupMenu.PopupMenuItem(_("Frames per second")),
                    "detailed_text", "desktop-capture-menu-header"
                );
                fpsSliderHeader.setSensitive(false);
                deviceOptionItems.push(fpsSliderHeader);

                let fpsSlider = new $.CustomPopupSliderMenuItem(
                    this, {
                        pref_key: "pref_recorder_fps",
                        header: fpsSliderHeader,
                        info_label_cb: () => {
                            return _("FPS");
                        },
                        slider_value: parseFloat(this.pref_recorder_fps / 120),
                        slider_value_min: 10,
                        slider_value_max: 120
                    });
                fpsSlider.tooltip = new $.CustomTooltip(
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

            if (this.pref_display_device_options_in_sub_menu) {
                let subMenu = new PopupMenu.PopupSubMenuMenuItem(_("Device options"));
                subMenu.menu.connect("open-state-changed",
                    (aMenu, aOpen) => $.onSubMenuOpenStateChanged(aMenu, aOpen));
                subMenu.label.add_style_class_name("desktop-capture-device-options-submenu-label");
                section.addMenuItem(subMenu);
                optionsContainer = subMenu.menu;
            } else {
                optionsContainer = section;
            }

            for (let optionItem of deviceOptionItems) {
                optionsContainer.addMenuItem(optionItem);
            }
        }

        if (this._register_key_bindings_id > 0) {
            Mainloop.source_remove(this._register_key_bindings_id);
            this._register_key_bindings_id = 0;
        }

        this._register_key_bindings_id = Mainloop.timeout_add(1000, () => {
            this._registerKeyBindings();
        });

        this[aDevice + "LastCaptureContent"].fileData =
            // Clean up the useless save function bound to the setting property.
            JSON.parse(JSON.stringify(this["pref_last_" + aDevice + "_capture"]));

        return true;
    },

    getFilenameForDevice: function(aDevice, aType) {
        this.logger.debug("");

        let date = new Date();
        let prefix = this["pref_" + aDevice + "_save_prefix"];

        if (!aType) {
            prefix = prefix.replace("%TYPE_", "");
            prefix = prefix.replace("%TYPE-", "");
            prefix = prefix.replace("%TYPE", "");
        }

        return $.replaceTokens(
            [
                "%Y",
                "%M",
                "%D",
                "%H",
                "%I",
                "%S",
                "%m",
                aDevice === "camera" ? "%TYPE" : null
            ], [
                date.getFullYear(),
                $.padNum(date.getMonth() + 1),
                $.padNum(date.getDate()),
                $.padNum(date.getHours()),
                $.padNum(date.getMinutes()),
                $.padNum(date.getSeconds()),
                $.padNum(date.getMilliseconds()),
                aDevice === "camera" ? $.SelectionTypeStr[aType] : null
            ],
            prefix);
    },

    repeatLastCapture: function(aDevice) {
        this.logger.debug("");

        let lastCapture = this.lastCapture[aDevice];

        if (lastCapture) {
            let newFilename;
            if (lastCapture.hasOwnProperty("command")) {
                try {
                    newFilename = this.getFilenameForDevice(
                        lastCapture.device);
                } catch (aErr) {
                    newFilename = false;
                    this.logger.error(aErr);
                }

                if (!newFilename) {
                    return false;
                }

                let cmd = lastCapture.command
                    .replace(lastCapture.current_file_name, newFilename);
                lastCapture.current_file_path = lastCapture.current_file_path.replace(
                    lastCapture.current_file_name,
                    newFilename
                );

                this.logger.runtime_info("Running again command: " + cmd);

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
                try {
                    newFilename = this._getCreateFilePath(this._cameraSaveDir,
                        this.getFilenameForDevice("camera", lastCapture.selectionType), "png");
                } catch (aErr) {
                    newFilename = false;
                    this.logger.error(aErr);
                }

                if (!newFilename) {
                    return false;
                }

                lastCapture.options.filename = newFilename;

                this.closeMainMenu();
                let camera = new $.ScreenshotHelper(null, null,
                    lastCapture.options, this.logger);

                // Timeout to not worry about closing menu animation.
                Mainloop.timeout_add(200, () => {
                    switch (lastCapture.selectionType) {
                        case $.SelectionType.WINDOW:
                            camera.screenshotWindow(
                                lastCapture.window,
                                lastCapture.options);
                            break;
                        case $.SelectionType.AREA:
                            camera.screenshotArea(
                                lastCapture.x,
                                lastCapture.y,
                                lastCapture.width,
                                lastCapture.height,
                                lastCapture.options);
                            break;
                        case $.SelectionType.CINNAMON:
                            camera.screenshotCinnamon(
                                lastCapture.actor,
                                lastCapture.stageX,
                                lastCapture.stageY,
                                lastCapture.options);
                            break;
                    }

                    return false;
                });
            }
        }

        return true;
    },

    cinnamonCameraComplete: function(screenshot) {
        this.logger.debug("");

        screenshot.uploaded = false;
        screenshot.json = null;
        screenshot.extraActionMessage = "";

        this.lastCapture["camera"] = screenshot;

        // All programs/devices support redo item, but Cinnamon's needs "special treatment".
        if (this.getDeviceProgram("camera") === "cinnamon") {
            if (this.lastCapture["camera"].selectionType !== $.SelectionType.SCREEN) {
                this._cameraRedoMenuItem.actor.show();
            } else {
                this._cameraRedoMenuItem.actor.hide();
            }
        }

        this._handleHistoryAndClipboard("camera", screenshot.file);
    },

    _handleHistoryAndClipboard: function(aDevice, aFilePath) {
        let historyEntry = {
            d: new Date().getTime(),
            f: aFilePath
        };

        this["pref_last_" + aDevice + "_capture"] = historyEntry;
        this[aDevice + "LastCaptureContent"].fileData = historyEntry;

        if (aDevice === "camera") {
            let copyToClipboard = this.pref_auto_copy_data ?
                $.ClipboardCopyType.IMAGE_DATA :
                this.pref_copy_to_clipboard;

            if (this.pref_auto_copy_data && this.pref_auto_copy_data_auto_off) {
                this.pref_auto_copy_data = false;
                this._rebuildDeviceSection("camera");
            }

            switch (copyToClipboard) {
                case $.ClipboardCopyType.IMAGE_PATH:
                    $.setClipboardText(aFilePath);
                    $.notify([_("File path copied to clipboard.")]);
                    break;
                case $.ClipboardCopyType.IMAGE_DATA:
                    $.Exec(this.appletHelper + " copy_image_data " + aFilePath);
                    $.notify([_("Image data copied to clipboard.")]);
                    break;
            }
        }
    },

    runCinnamonCamera: function(aType, aEvent, aMonitorIndex) {
        this.logger.debug("");

        if (!this._disclaimerRead()) {
            return false;
        }

        if (aType === $.SelectionType.REPEAT) {
            this.logger.runtime_info("We shouldn't have reached runCinnamonCamera.");
            return false;
        }

        let filename;
        try {
            filename = this._getCreateFilePath(this._cameraSaveDir,
                this.getFilenameForDevice("camera", aType), "png");
        } catch (aErr) {
            filename = false;
            this.logger.error(aErr);
        }

        if (!filename) {
            return false;
        }

        let fnCapture = () => {
            new $.ScreenshotHelper(aType,
                (aScreenshot) => this.cinnamonCameraComplete(aScreenshot), {
                    includeCursor: this.pref_include_cursor,
                    useFlash: this.pref_use_camera_flash,
                    includeFrame: this.pref_include_window_frame,
                    includeStyles: this.pref_include_styles,
                    windowAsArea: this.pref_capture_window_as_area,
                    playShutterSound: this.pref_play_shutter_sound,
                    useTimer: this.pref_timer_delay > 0,
                    showTimer: this.pref_timer_display_on_screen,
                    playTimerSound: this.pref_play_timer_interval_sound,
                    timerDuration: this.pref_timer_delay,
                    filename: filename,
                    monitorIndex: aMonitorIndex
                }, this.logger
            );

            return false;
        };

        this.closeMainMenu();
        // Timeout to not worry about closing menu animation.
        Mainloop.timeout_add(200, fnCapture);

        return true;
    },

    closeMainMenu: function() {
        this.logger.debug("");

        this.menu.close(true);
    },

    _updateCinnamonRecorderStatus: function() {
        this.logger.debug("");

        if (this.cinnamonRecorder.is_recording()) {
            this._setAppletIcon(true);
            this._cinnamonRecorderItem.label.set_text(_("Stop recording"));
        } else {
            this._setAppletIcon();
            this._cinnamonRecorderItem.label.set_text(_("Start recording"));
        }
    },

    _checkSaveFolder: function(aFolderPath) {
        this.logger.debug("");

        let folder = Gio.file_new_for_path(aFolderPath);
        let msg = this.criticalBaseMessage;

        if (!folder.query_exists(null)) {
            msg.push(_("Save folder doesn't exist!"));
            msg.push(folder.get_path());
            $.notify(msg, "error");
            return false;
        } else {
            let fileType = folder.query_file_type(Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
            // Don't restrict to only directories, just exclude normal files
            if (fileType === Gio.FileType.REGULAR) {
                msg.push(_("Path to save folder is not a directory!"));
                msg.push(folder.get_path());
                $.notify(msg, "error");
                return false;
            }
        }

        return true;
    },

    _getCreateFilePath: function(folderPath, fileName, fileExtension) {
        this.logger.debug("");

        if (!this._checkSaveFolder(folderPath)) {
            return false;
        }

        let msg = this.criticalBaseMessage;
        let file = Gio.file_new_for_path(folderPath + "/" + fileName + "." + fileExtension);
        let desiredFilepath = file.get_path();
        msg.push(_("File cannot be created!"));
        msg.push(desiredFilepath);

        try {
            if (file.create(Gio.FileCreateFlags.NONE, null)) {
                file.delete(null);
            } else {
                $.notify(msg, "error");
                return false;
            }
        } catch (aErr) {
            this.logger.error(aErr);
            $.notify(msg, "error");
            return false;
        }

        return desiredFilepath;
    },

    toggleCinnamonRecorder: function() {
        this.logger.debug("");

        if (this.cinnamonRecorder.is_recording()) {
            this.cinnamonRecorder.pause();
            Meta.enable_unredirect_for_screen(global.screen);
            this._updateCinnamonRecorderStatus();
        } else {
            let file_path;

            try {
                file_path = this._getCreateFilePath(
                    this._recorderSaveDir,
                    this.getFilenameForDevice("recorder"),
                    this.cinnamonRecorderProfiles[this.pref_cinn_rec_current_profile]["file-extension"]
                );
            } catch (aErr) {
                file_path = false;
                this.logger.error(aErr);
            }

            if (!file_path) {
                this.logger.runtime_info("No file name.");
                return false;
            }

            this.cinnamonRecorder.set_filename(file_path);
            this.logger.runtime_info("Capturing screencast to " + file_path);

            this.cinnamonRecorder.set_framerate(this.pref_recorder_fps);

            let pipeline = this.cinnamonRecorderProfiles[this.pref_cinn_rec_current_profile]["pipeline"];

            if (!pipeline.match(/^\s*$/)) {
                this.logger.runtime_info("Pipeline is " + pipeline);
                this.cinnamonRecorder.set_pipeline(pipeline);
            } else {
                this.logger.runtime_info("Pipeline is Cinnamon's default");
                this.cinnamonRecorder.set_pipeline(null);
            }

            Meta.disable_unredirect_for_screen(global.screen);

            // Timeout to not worry about closing menu animation.
            Mainloop.timeout_add(200,
                () => {

                    try {
                        this.cinnamonRecorder.record();
                    } catch (aErr) {
                        global.logError(aErr);
                    } finally {
                        this._updateCinnamonRecorderStatus();
                        this._handleHistoryAndClipboard("recorder", file_path);
                    }

                    return false;
                });
        }

        return true;
    },

    get_cinnamon_recorder_property: function(aProfile, aProperty) {
        this.logger.debug("");

        if (this.cinnamonRecorderProfiles.hasOwnProperty(aProfile) &&
            this.cinnamonRecorderProfiles[aProfile].hasOwnProperty(aProperty)) {
            return this.cinnamonRecorderProfiles[aProfile][aProperty];
        }

        return $.CinnamonRecorderProfilesBase["default"][aProperty];
    },

    getDevicePrograms: function(aDevice) {
        this.logger.debug("");

        return this.programSupport[aDevice];
    },

    getDeviceProperties: function(aDevice) {
        this.logger.debug("");

        return this.programSupport[aDevice][this.getDeviceProgram(aDevice)];
    },

    getDeviceProgram: function(aDevice) {
        this.logger.debug("");

        return this["pref_" + aDevice + "_program"];
    },

    getDeviceProperty: function(aDevice, aProperty) {
        this.logger.debug("");

        return this.getDeviceProperties(aDevice)[aProperty];
    },

    hasDeviceProperty: function(aDevice, aProperty) {
        this.logger.debug("");

        return this.getDeviceProperties(aDevice).hasOwnProperty(aProperty);
    },

    hasDevice: function(aDevice) {
        this.logger.debug("");

        return this["pref_" + aDevice + "_program"] !== "disabled";
    },

    _applyCommandReplacements: function(aCmd, aDevice) {
        this.logger.debug("");

        let cursor = "",
            sound = "";

        if (this.hasDeviceProperty(aDevice, "cursor")) {
            cursor = this.getDeviceProperty(aDevice, "cursor")[
                this.pref_include_cursor ? "on" : "off"
            ];
        }

        if (this.hasDeviceProperty(aDevice, "sound")) {
            sound = this.getDeviceProperty(aDevice, "sound")[
                this.pref_record_sound ? "on" : "off"
            ];
        }

        // This has to be done outside the main replacements because the appended
        // code also has replacement data.
        // And this is done differently as the original applet did it so I
        // can use the same object (menuitems) to create items of any kind.
        for (let i = 9; i >= 0; i--) {
            let idx = i + 1;
            let prop = "append-" + idx;

            if (this.hasDeviceProperty(aDevice, prop)) {
                aCmd = aCmd.replace("{{APPEND_" + idx + "}}",
                    this.getDeviceProperty(aDevice, prop));
            }
        }

        let fileExtension = false;

        if (/{{EXT}}/.test(aCmd)) {
            if ((aCmd.match(/{{EXT}}/g) || []).length === 2) {
                fileExtension = aCmd.split("{{EXT}}")[1];
            }

            aCmd = aCmd.replace(/{{EXT}}/g, "");
        }

        let fileName = this.getFilenameForDevice(aDevice);

        let replacements = {
            "{{SELF}}": this["pref_" + aDevice + "_program"],
            "{{DELAY}}": this.pref_timer_delay,
            "{{CURSOR}}": cursor,
            "{{SOUND}}": sound,
            "{{DIRECTORY}}": aDevice === "camera" ?
                this._cameraSaveDir : this._recorderSaveDir,
            "{{SCREEN_DIMENSIONS}}": global.screen_width + "x" +
                global.screen_height,
            "{{SCREEN_WIDTH}}": global.screen_width,
            "{{SCREEN_HEIGHT}}": global.screen_height,
            "{{RECORDER_DIR}}": this._recorderSaveDir,
            "{{SCREENSHOT_DIR}}": this._cameraSaveDir,
            "{{FILENAME}}": fileName
        };

        for (let k in replacements) {
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
    },

    runCommand: function(aCmd, aDevice, aIsRecording, aUseScreenshotHelper, aEvent) {
        this.logger.debug("");

        let cmdObj = this._applyCommandReplacements(aCmd, aDevice);
        let cmd = cmdObj.command;

        let helperMode = null;
        for (let k in $.InteractiveCallouts) {
            if (cmd.indexOf(k) !== -1) {
                if (aUseScreenshotHelper) {
                    helperMode = $.InteractiveCallouts[k];
                    this.logger.runtime_info('Using screenshot helper from capture mode "' +
                        $.SelectionTypeStr[helperMode] + '"');
                }

                cmd = cmd.replace(k, "");
                cmd = cmd.trim();
                break;
            }
        }

        if (aUseScreenshotHelper) {
            if (helperMode !== null) {
                let ss = new $.ScreenshotHelper(helperMode, // jshint ignore:line
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
                    }, this.logger);
            } else {
                if (aEvent && aEvent.get_button() === 3) {
                    this.displayDialogMessage(_("Displaying command that will be executed") +
                        ":\n\n" + '<span font_desc="monospace 10">' + $.escapeHTML(cmd) + "</span>",
                        "info");
                    return false;
                }

                this["_" + aDevice + "RedoMenuItem"].actor.hide();
                this.logger.runtime_info("Running command: " + cmd);
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
    },

    runCommandInteractively: function(aParams) {
        this.logger.debug("");

        let niceHeight = aParams.vars["height"] % 2 === 0 ?
            aParams.vars["height"] :
            aParams.vars["height"] + 1,
            niceWidth = aParams.vars["width"] % 2 === 0 ?
            aParams.vars["width"] :
            aParams.vars["width"] + 1;

        let replacements = {
            "{{I_X}}": aParams.vars["x"],
            "{{I_Y}}": aParams.vars["y"],
            "{{I_X_Y}}": aParams.vars["x"] + "," + aParams.vars["y"],
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

        for (let k in replacements) {
            aParams.command = aParams.command.replace(k, replacements[k]);
        }

        if (aParams.event && aParams.event.get_button() === 3) {
            this.displayDialogMessage(_("Displaying command that will be executed") +
                ":\n\n" + '<span font_desc="monospace 10">' + $.escapeHTML(aParams.command) + "</span>",
                "info");
            return false;
        }

        this.logger.runtime_info("Interactively running command: " + aParams.command);

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
    },

    onProcessSpawned: function(aParams) {
        this.logger.debug("");

        aParams.is_recording && this._setAppletIcon(true);
    },

    onProcessError: function(aParams) {
        this.logger.debug("");

        this._setAppletIcon();

        this.displayDialogMessage(_("Command exited with error status") +
            ":\n\n" + '<span font_desc="monospace 10">' + $.escapeHTML(aParams.command) + "</span>",
            "error");
        aParams.stdout && this.logger.runtime_error(aParams.stdout);
        aParams.stderr && this.logger.runtime_error(aParams.stderr);
    },

    onProcessComplete: function(aParams) {
        this.logger.debug("");

        this.logger.runtime_info("Process exited with status " + aParams.status);

        if (aParams.status > 0) {
            this.logger.runtime_error(aParams.stdout);
            this.onProcessError({
                command: aParams.command,
                stdout: aParams.stdout,
                stderr: null
            });

            return false;
        }

        this._setAppletIcon();

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
                this["_" + aParams.device + "RedoMenuItem"].actor.show();
            }

            this._handleHistoryAndClipboard(aParams.device, aParams.current_file_path);
        }

        return true;
    },

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
    displayDialogMessage: function(aMsg, aLevel) {
        this.logger.debug("");

        let msg = {
            title: _(this.metadata.name),
            message: aMsg
        };

        Util.spawn_async([this.appletHelper, aLevel, JSON.stringify(msg)], null);
    },

    Exec: function(cmd) {
        this.logger.debug("");

        this.closeMainMenu();

        // Timeout to not worry about closing menu animation.
        return Mainloop.timeout_add(200, () => {
            $.Exec(cmd);
            return false;
        });
    },

    TryExec: function(aParams) {
        this.logger.debug("");

        this.closeMainMenu();

        aParams["logger"] = this.logger;

        // Timeout to not worry about closing menu animation.
        return Mainloop.timeout_add(200,
            () => {
                $.TryExec(aParams);
                return false;
            });
    },

    _exportJSONData: function(aPref) {
        this.logger.debug("");

        Util.spawn_async([
                this.appletHelper,
                "export",
                this.pref_imp_exp_last_selected_directory
            ],
            (aOutput) => {
                let path = aOutput.trim();

                if (!Boolean(path)) {
                    return;
                }

                let rawData = JSON.stringify(this[aPref], null, 4);
                let file = Gio.file_new_for_path(path);
                this.pref_imp_exp_last_selected_directory = path;
                $.saveToFileAsync(rawData, file);
            }
        );
    },

    _importJSONData: function(aPref) {
        this.logger.debug("");

        Util.spawn_async([
                this.appletHelper,
                "import",
                this.pref_imp_exp_last_selected_directory
            ],
            (aOutput) => {
                let path = aOutput.trim();

                if (!Boolean(path) && GLib.path_is_absolute(path) &&
                    GLib.file_test(path, GLib.FileTest.EXISTS)) {
                    return;
                }

                let file = Gio.file_new_for_path(path);
                this.pref_imp_exp_last_selected_directory = path;
                file.load_contents_async(null, (aFile, aResponce) => {
                    let rawData;
                    let jsonData;

                    try {
                        rawData = aFile.load_contents_finish(aResponce)[1];
                    } catch (aErr) {
                        this.logger.error(aErr.message);
                        return;
                    }

                    try {
                        jsonData = JSON.parse(rawData);
                    } catch (aErr) {
                        this.logger.error(aErr);
                        $.notify([
                            _("Possibly malformed JSON file."),
                            _("Check the logs."),
                            "~/.cinnamon/glass.log",
                            "~/.xsession-errors"
                        ], "error");
                        return;
                    }

                    switch (aPref) {
                        case "pref_program_support":
                            this._handleImportedPrograms(jsonData);
                            break;
                        case "pref_cinn_rec_profiles":
                            this._handleImportedCinnamonRecorderProfiles(jsonData);
                            break;
                    }
                });
            }
        );
    },

    _handleImportedPrograms: function(aJSONData) {
        try {
            if ($.isObject(aJSONData)) {
                for (let device of $.Devices) {
                    if (!aJSONData.hasOwnProperty(device)) {
                        aJSONData[device] = {};
                    }
                }

                this.pref_program_support = aJSONData;
            } else {
                this.pref_program_support = $.PROGRAMS_SUPPORT_EMPTY;
            }
        } catch (aErr) {
            this.logger.warning(aErr);
            this.pref_program_support = $.PROGRAMS_SUPPORT_EMPTY;
        } finally {
            this._setupProgramSupport();
        }
    },

    _handleImportedCinnamonRecorderProfiles: function(aJSONData) {
        try {
            if ($.isObject(aJSONData)) {
                this.pref_cinn_rec_profiles = aJSONData;
            } else {
                this.pref_cinn_rec_profiles = {};
            }
        } catch (aErr) {
            this.logger.warning(aErr);
            this.pref_cinn_rec_profiles = {};
        } finally {
            this._setupCinnamonRecorderProfiles();
        }
    },

    _resetPrefToDefault: function(aPref) {
        this.logger.debug("");

        $.askForConfirmation({
            message: _("Do you really want to reset this preference to its default value?"),
            pref_name: aPref
        }, (aParams) => {
            let file = Gio.file_new_for_path(this.metadata.path + "/settings-schema.json");
            file.load_contents_async(null, (aFile, aResponce) => {
                let success,
                    contents,
                    tag;

                try {
                    [success, contents, tag] = aFile.load_contents_finish(aResponce);
                } catch (aErr) {
                    global.logError(aErr.message);
                    return;
                }

                if (!success) {
                    global.logError("Error parsing %s".format(file.get_path()));
                    return;
                }

                try {
                    this[aParams.pref_name] = JSON.parse(contents)[aParams.pref_name].default;
                } finally {
                    switch (aParams.pref_name) {
                        case "pref_program_support":
                            this._setupProgramSupport();
                            break;
                        case "pref_cinn_rec_profiles":
                            this._setupCinnamonRecorderProfiles();
                            break;
                    }
                }
            });
        });
    },

    _clearPref: function(aPref, aPrefEmptyVal) {
        this.logger.debug("");

        $.askForConfirmation({
            message: _("Do you really want to empty this preference?"),
            pref_name: aPref,
            pref_empty_value: aPrefEmptyVal
        }, (aParams) => {
            try {
                this[aParams.pref_name] = aParams.pref_empty_value;
            } finally {
                switch (aParams.pref_name) {
                    case "pref_program_support":
                        this._setupProgramSupport();
                        break;
                    case "pref_cinn_rec_profiles":
                        this._setupCinnamonRecorderProfiles();
                        break;
                }
            }
        });
    },

    _disclaimerRead: function() {
        if (!this.pref_disclaimer_read &&
            $.versionCompare($.CinnamonVersion, "3.0.99") <= 0) {
            let msg = [
                _("The Cinnamon's 3.0.x built-in screenshot mechanism is broken!"),
                _("Do not use it or Cinnamon will crash!"),
                _("Read this applet help page (Known issues) for more details on the matter."),
                _("You will keep seeing this notification until you follow the instructions found on the help page.")
            ];
            $.notify(msg, "error");
            return false;
        }

        return true;
    },

    get criticalBaseMessage() {
        return [
            _("Operation aborted!")
        ];
    },

    get programSupport() {
        return this._programSupport;
    },

    set programSupport(aVal) {
        delete this._programSupport;
        this._programSupport = aVal;
    },

    get cinnamonRecorderProfiles() {
        return this._cinnamonRecorderProfiles;
    },

    set cinnamonRecorderProfiles(aVal) {
        delete this._cinnamonRecorderProfiles;
        this._cinnamonRecorderProfiles = aVal;
    },

    on_applet_clicked: function() {
        this.logger.debug("");

        this.menu.toggle();
    },

    on_applet_removed_from_panel: function() {
        this.logger.debug("");

        if (this._draw_menu_id > 0) {
            Mainloop.source_remove(this._draw_menu_id);
            this._draw_menu_id = 0;
        }

        if (this._register_key_bindings_id > 0) {
            Mainloop.source_remove(this._register_key_bindings_id);
            this._register_key_bindings_id = 0;
        }

        this.settings.finalize();
    },

    _onSettingsChanged: function(aPrefValue, aPrefKey) { // jshint ignore:line
        // Note: On Cinnamon versions greater than 3.2.x, two arguments are passed to the
        // settings callback instead of just one as in older versions. The first one is the
        // setting value and the second one is the user data. To workaround this nonsense,
        // check if the second argument is undefined to decide which
        // argument to use as the pref key depending on the Cinnamon version.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        // Remove the following variable and directly use the second argument.
        let pref_key = aPrefKey || aPrefValue;
        switch (pref_key) {
            case "pref_theme_selector":
            case "pref_theme_custom":
                if (pref_key === "pref_theme_custom" &&
                    this.pref_theme_selector !== "custom") {
                    return;
                }

                this.loadTheme(true);
                break;
            case "pref_enable_verbose_logging":
                this.logger.runtime_info("Logging changed to " +
                    (this.pref_enable_verbose_logging ? "debug" : "info"));
                this.logger.verbose = this.pref_enable_verbose_logging;
                break;
            case "pref_custom_icon_for_applet":
            case "pref_custom_icon_for_applet_recording":
                this._setAppletIcon();
                break;
            case "pref_camera_save_dir":
            case "pref_recorder_save_dir":
                this._setupSaveDirs();
                break;
            case "pref_show_copy_toggle":
            case "pref_camera_program":
                this._rebuildDeviceSection("camera");
                break;
            case "pref_recorder_program":
                if (this.pref_recorder_program === "cinnamon") {
                    this.cinnamonRecorder = new Cinnamon.Recorder({
                        stage: global.stage
                    });
                }

                this._rebuildDeviceSection("recorder");
                break;
            case "pref_display_device_options_in_sub_menu":
                this.drawMenu();
                break;
        }
    }
};

function main(metadata, orientation, panelHeight, instanceId) {
    return new DesktopCapture(metadata, orientation, panelHeight, instanceId);
}
