const {
    gi: {
        GLib
    },
    mainloop: Mainloop,
    misc: {
        params: Params,
        signalManager: SignalManager,
        util: Util
    },
    ui: {
        settings: {
            ExtensionSettings
        }
    }
} = imports;

const {
    _,
    escapeHTML,
    InjectionsManager,
    isPrimitive,
    KeybindingsManager,
    launchUri,
    ScheduleManager
} = require("js_modules/globalUtils.js");

const {
    File,
    generateDesktopFile
} = require("js_modules/customFileUtils.js");

var ExtensionsBaseParams = Object.freeze({
    /**************************************************************
     * Properties set at extension initialization when/if needed. *
     **************************************************************/
    // The metadata property is the argument passed by an extension's init() function.
    metadata: null,
    // Whether to initialize an instance of SignalManager.SignalManager.
    init_signal_manager: false,
    // An instance of SignalManager.SignalManager.
    signal_manager: null,
    // Whether to initialize an instance of globalUtils.ScheduleManager.
    init_schedule_manager: false,
    // An instance of globalUtils.ScheduleManager.
    schedule_manager: null,
    // Whether to initialize an instance of globalUtils.KeybindingsManager.
    init_keybinding_manager: false,
    // An instance of globalUtils.KeybindingsManager.
    keybinding_manager: null,
    // Whether to initialize an instance of injectionsUtils.InjectionsManager.
    init_injection_manager: false,
    // An instance of injectionsUtils.InjectionsManager.
    injection_manager: null,
    // An instance of NotificationsUtils.CustomNotification. To be called only from inside
    // the parent class. The notification object is globally declared inside the extension context.
    notification: null,
    // Implemented to avoid performing "heavy" tasks like .desktop file creation, etc.
    // It's set to true by default because all my extensions make use of
    // the custom settings framework.
    uses_settings_app: true,
    // An instance of CustomExtensionSettings. This is only used to call its destroy() method
    // from inside the parent class when an extension is disabled. The settings object is globally
    // declared inside the extension context.
    settings: null,
    /*******************************
     * Dynamically set properties. *
     *******************************/
    // ID used by extension using the xlets custom settings framework.
    settings_app_id: "",
    // Path to the .desktop file used/generated to open an extension settings window.
    settings_app_desktop_file_path: "",
    // The Gio.File instance of the .desktop file.
    settings_app_desktop_file: null
});

/**
 * [CustomExtensionSettings description]
 *
 * TODO: Investigate why I didn't use the built-in ExtensionSettings.bind to bind settings.
 * NOTE: That's why I now document as much as possible. LOL
 *
 * @param {Object} aBoundSettingsArray - An array of preference keys.
 *
 * @type {Class}
 */
var CustomExtensionSettings = class CustomExtensionSettings {
    constructor(aBoundSettingsArray) {
        this._boundSettingsArray = aBoundSettingsArray;
        this._signal_manager = new SignalManager.SignalManager();
        this.settings = new ExtensionSettings(
            this,
            __meta.uuid
        );

        this.__bindToObject();
    }

    /**
     * Bind preference keys as properties of this class.
     */
    __bindToObject() {
        let i = this._boundSettingsArray.length;
        while (i--) {
            Object.defineProperty(
                this,
                this._boundSettingsArray[i],
                this.__getDescriptor(this._boundSettingsArray[i])
            );
        }
    }

    /**
     * Get the descriptor for the property being defined.
     *
     * @param {String} aKey - Preference key.
     *
     * @return {Object} The object to use as descriptor argument for Object.defineProperty.
     */
    __getDescriptor(aKey) {
        return Object.create({
            get: () => {
                return this.settings.getValue(aKey);
            },
            set: (aVal) => {
                this.settings.setValue(aKey, aVal);
            },
            enumerable: true,
            configurable: true
        });
    }

    /**
     * Connect preference/s to monitor for changes.
     *
     * NOTE: The reason for the connections to not be set at initialization is that this class is
     * instantiated before the extension is actually loaded and the callback bound to settings
     * changes is defined in the extension object. This has the advantage of using a single settings
     * instance declared globally that can be used from any module without being forced to pass it
     * as argument through a trillion class's instances like I'm forced to do with applets.
     *
     * WARNING: Do not bind/connect settings whose values aren't primitives.
     * Bound non-primitive settings will always trigger a settings changed signal.
     * It will trigger a "changed::pref_name" signal and a "settings-changed" signal.
     *
     * @param {String|Array} aPrefKey  - A preference key or an array of preference keys.
     * @param {Function}     aCallback - Function to trigger on setting changes.
     *
     * @return {Integer|Boolean} A connection signal ID or true if performing connections in bulk.
     */
    connect(aPrefKey, aCallback) {
        if (typeof aPrefKey === "object" && Array.isArray(aPrefKey)) {
            let i = aPrefKey.length;
            while (i--) {
                const prefKey = aPrefKey[i];
                // NOTE: Fail safe. Do not connect the callback to preferences with
                // non-primitive default values.
                if (isPrimitive(this.settings.getDefaultValue(prefKey))) {
                    this._signal_manager.connect(
                        this.settings,
                        `changed::${prefKey}`,
                        aCallback.bind(null, prefKey)
                    );
                }
            }

            return true;
        }

        return this._signal_manager.connect(
            this.settings,
            `changed::${aPrefKey}`,
            aCallback.bind(null, aPrefKey)
        );
    }

    /**
     * Perform clean up.
     *
     * @param  {Boolean} aFinalize - Description
     */
    destroy(aFinalize = false) {
        this._signal_manager.disconnectAllSignals();

        // NOTE: Calling finalize will delete settings configuration files. And that's
        // something that I absolutely DO NOT want for extensions. Finding and deleting or editing
        // an existent configuration file with possibly problematic preferences is easy enough.
        // But re-setting preferences for an extension with a lot of preferences or very complex ones
        // is an absolute chore.
        // TODO: Investigate if some clean up is needed.
        aFinalize && this.settings.finalize();
    }

    /**
     * Disconnect signal for preference.
     *
     * @param {String}   aPrefKey  - The preference key connected.
     * @param {Function} aCallback - Specific function bound to a preference; in case that more than one function is bound to a preference.
     */
    disconnect(aPrefKey, aCallback = null) {
        this._signal_manager.disconnect(
            `changed::${aPrefKey}`,
            this.settings,
            aCallback
        );
    }
};

/**
 * Base class for extensions creation.
 *
 * @type {Class}
 */
var BaseExtension = class BaseExtension {
    constructor(aExtensionsBaseParams) {
        this.$ = Params.parse(aExtensionsBaseParams, ExtensionsBaseParams, true);
        // WARNING: Keep this ID generation exactly the same as in the application_id property
        // of the MainApplication class found in the xlets settings framework.
        // This is needed because the desktop file needs to have the exact same name as the Gtk
        // application ID. ¬¬
        this.$.settings_app_id = `org.Cinnamon.Extensions.${this.$.metadata.uuid.replace("@", ".")}.Settings`;
        this.$.settings_app_desktop_file_path = `${GLib.get_home_dir()}/.local/share/applications/${this.$.settings_app_id}.desktop`;

        this.$.schedule_manager = this.$.init_schedule_manager ?
            new ScheduleManager() :
            null;
        this.$.keybinding_manager = this.$.init_keybinding_manager ?
            new KeybindingsManager(`${this.$.metadata.uuid}-${this.$.instance_id}`) :
            null;
        this.$.signal_manager = this.$.init_signal_manager ?
            new SignalManager.SignalManager() :
            null;
        this.$.injection_manager = this.$.init_injection_manager ?
            new InjectionsManager() :
            null;

        if (this.$.uses_settings_app) {
            this.$.settings_app_desktop_file = new File(this.$.settings_app_desktop_file_path);
        }
    }

    /**
     * Method to call when the extension is enabled.
     *
     * NOTE: Always call super() on the instance.
     */
    enable() {
        this.__connectSignals();

        Mainloop.idle_add(() => {
            this.$.uses_settings_app && this.__generateSettingsDesktopFile();

            return GLib.SOURCE_REMOVE;
        });
    }

    /**
     * Method to call when the extension is disabled.
     *
     * NOTE: Always call super() on the instance.
     */
    disable() {
        this.$.settings && this.$.settings.destroy();
        this.$.signal_manager && this.$.signal_manager.disconnectAllSignals();
        this.$.schedule_manager && this.$.schedule_manager.clearAllSchedules();
        this.$.keybinding_manager && this.$.keybinding_manager.clearAllKeybindings();
        this.$.injection_manager && this.$.injection_manager.restoreAll();

        Mainloop.idle_add(() => {
            this.$.uses_settings_app && this.__removeSettingsDesktopFile();

            return GLib.SOURCE_REMOVE;
        });
    }

    /**
     * Method to call to open the extension help page.
     */
    __openHelpPage() {
        launchUri(`${this.$.metadata.path}/HELP.html`);
    }

    /**
     * Method to call to open the extension settings window.
     *
     * @param {String} aStackID - The ID of a preference window's stack (e.g. stack_id_1).
     */
    __openXletSettings(aStackID) {
        const cmd = [
            `${this.$.metadata.path}/settings.py`,
            "--xlet-type=extension",
            `--xlet-uuid=${this.$.metadata.uuid}`,
            `--app-id=${this.$.settings_app_id}`
        ];

        aStackID && cmd.push(`--stack-id=${aStackID}`);

        Util.spawn_async(cmd, null);
    }

    /**
     * Method to call to generate the .desktop file to open the extension settings window.
     */
    __generateSettingsDesktopFile() {
        if (!this.$.settings_app_desktop_file.exists) {
            generateDesktopFile({
                file_name: this.$.settings_app_id,
                data_name: _(this.$.metadata.name),
                data_comment: _("Settings for %s").format(_(this.$.metadata.name)),
                data_exec: `${this.$.metadata.path}/settings.py`,
                data_icon: `${this.$.metadata.path}/icon.svg`
            });

            if (this.$.notification) {
                this.$.notification.notify([
                    escapeHTML(_("A shortcut to open this extension settings has been generated.")),
                    escapeHTML(_("Search for it on your applications menu.")),
                    escapeHTML(_("Read this extension help page for more details."))
                ]);
            }
        }
    }

    /**
     * Method to call to remove the .desktop file generated to open the extension settings window.
     */
    __removeSettingsDesktopFile() {
        if (this.$.settings_app_desktop_file) {
            this.$.settings_app_desktop_file.delete().catch((aErr) => global.logError(aErr));
        }
    }

    /**
     * Method to call to connect signals.
     *
     * NOTE: Meant to be overwritten.
     */
    __connectSignals() {}

    /**
     * Method to call to perform actions on settings changed.
     *
     * NOTE: Meant to be overwritten.
     *
     * @param {String} aPrefKey - The key of the preference that changed.
     */
    __onSettingsChanged(aPrefKey) { // jshint ignore:line
        // WARNING: Avoid binding settings whose values aren't primitives.
        // Bound non-primitive settings will always trigger a settings changed signal whether
        // their values changed or not.
        // It will trigger a "changed::pref_name" signal and a "settings-changed" signal.
    }
};

/* exported ExtensionsBaseParams,
            CustomExtensionSettings,
            BaseExtension
 */
