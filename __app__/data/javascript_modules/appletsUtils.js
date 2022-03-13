const {
    gi: {
        GLib,
        St
    },
    misc: {
        params: Params,
        signalManager: SignalManager,
        util: Util
    },
    ui: {
        applet: Applet,
        popupMenu: PopupMenu,
        settings: Settings
    }
} = imports;

const {
    _,
    arrayEach,
    isPrimitive,
    KeybindingsManager,
    launchUri,
    ScheduleManager,
    tryFn
} = require("js_modules/globalUtils.js");

// WARNING: Beware of the _ property set as an object. Re-set it after parameters parsing.
// Params.parse will make shallow copies of objects.
// This bit me hard in the arse! The problem was that the _ object was being reused
// when binding settings and all instances of an applet shared the same settings.
// I will keep here this note FOREVER because this is the second time that this happens
// to me. LOL
var AppletBaseParams = Object.freeze({
    /***********************************************************
     * Properties set at applet initialization when/if needed. *
     ***********************************************************/
    // The following 4 properties are the arguments passed by an applet's main() function.
    metadata: null,
    orientation: null,
    // NOTE: Keep an eye on this one. It will be removed in the future and it will f*ck up
    // the order of an applet's main function.
    panel_height: null,
    instance_id: null,
    // Whether to initialize an instance of SignalManager.SignalManager.
    init_signal_manager: true,
    // An instance of SignalManager.SignalManager.
    signal_manager: null,
    // Whether to initialize an instance of globalUtils.ScheduleManager.
    init_schedule_manager: true,
    // An instance of globalUtils.ScheduleManager.
    schedule_manager: null,
    // Whether to initialize an instance of globalUtils.KeybindingsManager.
    init_keybinding_manager: true,
    // An instance of globalUtils.KeybindingsManager.
    keybinding_manager: null,
    // The list of all the applet's settings.
    pref_keys: [],
    // NOTE: This is the value of Applet.AllowedLayout.BOTH. But to avoid importing the applet.js
    // module here, I just directly define its "raw" value.
    allowed_layout: Applet.AllowedLayout.BOTH,
    // Initialize an instance of Applet.AppletPopupMenu stored in a property named `menu` and add the
    // menu to an instance of PopupMenu.PopupMenuManager stored in a property named `menuManager`.
    init_menu: true,
    /*******************************
     * Dynamically set properties. *
     *******************************/
    // An instance of Settings.AppletSettings.
    settings: null,
    // The object bound to Settings.AppletSettings.
    _: null
});

/**
 * Get base applet class.
 *
 * @param {Class} aMasterClass - An instance of applet.Applet.
 *
 * @return {Class} An instance of BaseApplet.
 */
function getBaseAppletClass(aMasterClass) {
    /**
     * Applet base class.
     *
     * @param {Object}   aAppletParams   - Applet parameters.
     *
     * @type {Class}
     */
    return class BaseApplet extends aMasterClass {
        constructor(aAppletParams) {
            const {
                orientation,
                panel_height,
                instance_id
            } = aAppletParams;
            super(orientation, panel_height, instance_id);

            this.menuManager = null;
            this.menu = null;

            this.$ = Params.parse(aAppletParams, AppletBaseParams, true);
            // NOTE: Redeclared. See AppletBaseParams' warning.
            this.$._ = {};

            // NOTE: Declared here to avoid repetitive code since all of my applets use it.
            this.$.schedule_manager = this.$.init_schedule_manager ?
                new ScheduleManager() :
                null;
            this.$.keybinding_manager = this.$.init_keybinding_manager ?
                new KeybindingsManager(`${this.$.metadata.uuid}-${this.$.instance_id}`) :
                null;
            this.$.signal_manager = this.$.init_signal_manager ?
                new SignalManager.SignalManager() :
                null;
            this.setAllowedLayout(this.$.allowed_layout);

            tryFn(() => {
                if (this.$.pref_keys.length) {
                    this.$.settings = new Settings.AppletSettings(
                        this.$._,
                        this.$.metadata.uuid,
                        this.$.instance_id
                    );

                    arrayEach(this.$.pref_keys, (aPrefKey) => {
                        this.$.settings.bind(
                            // Preference key.
                            aPrefKey,
                            // Property name for the bound object.
                            aPrefKey,
                            // NOTE: Fail safe. Do not assign the callback to preferences with
                            // non-primitive default values.
                            (isPrimitive(this.$.settings.getDefaultValue(aPrefKey)) ?
                                (...args) => this.__onSettingsChanged.call(this, ...args) :
                                null),
                            // User data passed as second argument of the callback.
                            // The first argument is the value that the preference had before it changed.
                            aPrefKey
                        );
                    });
                }
            }, (aErr) => global.logError(aErr));
        }

        /**
         * Initialize applet.
         *
         * NOTE: Meant to be called from an applet's instance constructor.
         *
         * @param {Function} aDirectCallback - Function to call after basic initial setup.
         * @param {Function} aIdleCallback   - Function to call after aDirectCallback and inside a Mainloop.idle_add call.
         */
        __initializeApplet(aDirectCallback, aIdleCallback) {
            // NOTE: It took me hours to debug a blatant error inside the constructor of a class that
            // didn't log SHITE!!! Even if the code were to be defined directly in the constructor
            // and not inside private functions, the class' `constructor` methods are not wrapped by the
            // debug manager. ¬¬
            tryFn(() => {
                aDirectCallback();
            }, (aErr) => global.logError(aErr));

            this.$.schedule_manager.idleCall("__internal_idle_call", () => {
                tryFn(() => {
                    if (this.$.init_menu) {
                        this.__initMainMenu();
                    }

                    aIdleCallback();
                    this.__connectSignals();
                }, (aErr) => global.logError(aErr));
            });
        }

        /**
         * Initialize a menu for the applet.
         */
        __initMainMenu() {
            // NOTE: Only try to create the manager once.
            if (!this.menuManager) {
                this.menuManager = new PopupMenu.PopupMenuManager(this);
            }

            // NOTE: Always destroy the menu if it exists. No need to remove it from the manager first.
            if (this.menu) {
                this.menu.removeAll();
                this.menu.destroy();
            }

            this.menu = new Applet.AppletPopupMenu(this, this.$.orientation);
            this.menuManager.addMenu(this.menu);
        }

        /**
         * Method to call to connect signals.
         *
         * NOTE: Meant to be overwritten.
         */
        __connectSignals() {}

        /**
         * Set aplet icon.
         *
         * @param {String} aIcon - The icon name or path to use as the applet icon.
         */
        __setAppletIcon(aIcon) {
            // NOTE: Something has gone terribly wrong if it isn't a string.
            if (typeof aIcon !== "string") {
                throw new TypeError("Passed icon is not of type string.");
            }

            // NOTE: Only TextIconApplet and IconApplet classes have the _applet_icon_box property.
            // __setAppletIcon shouldn't be called from a TextApplet instance.
            if (typeof this._applet_icon_box !== "object") {
                throw new TypeError("Only TextIconApplet and IconApplet classes have icons.");
            }

            if (aIcon) {
                if (GLib.path_is_absolute(aIcon) &&
                    GLib.file_test(aIcon, GLib.FileTest.EXISTS)) {
                    this[aIcon.includes("-symbolic") ?
                        "set_applet_icon_symbolic_path" :
                        "set_applet_icon_path"](aIcon);
                } else {
                    tryFn(() => {
                        this[aIcon.includes("-symbolic") ?
                            "set_applet_icon_symbolic_name" :
                            "set_applet_icon_name"](aIcon);
                    }, (aErr) => global.logError(aErr));
                }

                this._applet_icon_box.show();
            } else {
                this._applet_icon_box.hide();
            }
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
         * NOTE: The `--xlet-type` and `--xlet-uuid` CLI parameters are mandatory, but they
         * are set in the settings.py file so I can call it without arguments.
         *
         * @param {String} aStackID - The ID of a preference window's stack (e.g. stack_id_1).
         */
        __openXletSettings(aStackID) {
            const cmd = [
                `${this.$.metadata.path}/settings.py`,
                `--xlet-instance-id=${this.$.instance_id}`
            ];

            aStackID && cmd.push(`--stack-id=${aStackID}`);

            Util.spawn_async(cmd, null);
        }

        /**
         * Override the default Configure context menu item to be able to open other settings
         * application instead of Cinnamon's default.
         *
         * NOTE: By default, override the built-in Configure context menu to open
         * the custom settings window with an instance ID as CLI parameter.
         * Otherwise, call super() on the instance with aMenuitem as its argument
         * to perform any other task (I doubt that I will ever perform any other task).
         *
         * @param {Object} aMenuitem - An optional menu item to override the original one.
         */
        __seekAndDetroyConfigureContext(aMenuitem = null) {
            this.$.schedule_manager.setTimeout("__internal_seek_and_destroy_configure_context", () => {
                let menuItem = aMenuitem;

                if (menuItem === null) {
                    menuItem = new PopupMenu.PopupIconMenuItem(_("Configure..."),
                        "system-run", St.IconType.SYMBOLIC);
                    menuItem.connect("activate", () => this.__openXletSettings());
                }

                const children = this._applet_context_menu._getMenuItems();
                let i = children.length;
                while (i--) {
                    if (menuItem && this.hasOwnProperty("context_menu_item_configure") &&
                        children[i] === this.context_menu_item_configure) {
                        children[i].destroy();
                        this.context_menu_item_configure = menuItem;
                        this._applet_context_menu.addMenuItem(
                            this.context_menu_item_configure,
                            i
                        );
                        break;
                    }
                }
            }, 3000);
        }

        /**
         * Method to call to perform actions on settings changed.
         *
         * Instead of binding each preference key with its own callback function that has to be
         * defined in the main applet class, bind all preferences to a single callback. One function
         * to rule them all. LOL
         *
         * NOTE: Meant to be overwritten.
         *
         * @param {Any}    aPrefOldValue - The previous value the preference had.
         * @param {String} aPrefKey      - The key of the preference that changed.
         */
        __onSettingsChanged(aPrefOldValue, aPrefKey) { // jshint ignore:line
            // WARNING: Avoid binding settings whose values aren't primitives.
            // Bound non-primitive settings will always trigger a settings changed signal whether
            // their values changed or not.
            // It will trigger a "changed::pref_name" signal and a "settings-changed" signal.
            // In the case of applets, the preferences are all bound, except the ones with
            // non-primitive default values.
        }

        /**
         * Native method of applet.Applet class.
         *
         * NOTE: Always call super() on the instance with aOrientation as its argument.
         *
         * @param {Number} aOrientation - Applet orientation.
         */
        on_orientation_changed(aOrientation) {
            this.$.orientation = aOrientation;
        }

        /**
         * Native method of applet.Applet class.
         *
         * NOTE: Always call super() on the instance.
         */
        on_applet_removed_from_panel() {
            this.$.signal_manager && this.$.signal_manager.disconnectAllSignals();
            this.$.schedule_manager && this.$.schedule_manager.clearAllSchedules();
            this.$.keybinding_manager && this.$.keybinding_manager.clearAllKeybindings();
            this.$.settings && this.$.settings.finalize();

            if (this.menu) {
                this.menu.removeAll(); // Just in case.
                this.menu.destroy();
            }

            this.menuManager && this.menuManager.destroy();
        }
    };
}

/* exported getBaseAppletClass
 */
