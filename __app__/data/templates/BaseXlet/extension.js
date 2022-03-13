let $,
    D,
    NotificationsUtils,
    E,
    G,
    Settings,
    XletMeta = null,
    myExtension = null;

const {
    gi: {
        GLib
    },
    mainloop: Mainloop
} = imports;

function getExtensionClass(aBaseExtension) {
    class MyExtension extends aBaseExtension {
        constructor() {
            super({
                /***********************************************
                 * Properties set at extension initialization. *
                 ***********************************************/
                // The metadata property is the argument passed by an extension's init() function.
                metadata: XletMeta,
                // An instance of NotificationsUtils.CustomNotification. To be called only from inside
                // the parent class. The notification object is globally declared inside the extension context.
                notification: $.Notification,
                // An instance of CustomExtensionSettings. This is only used to call its destroy() method
                // from inside the parent class when an extension is disabled. The settings object is globally
                // declared inside the extension context.
                settings: $.Settings,
            });
        }

        enable() {
            // NOTE: Always call super() from this instance.
            super.enable();
        }

        disable() {
            // NOTE: Always call super() from this instance.
            super.disable();
        }

        __connectSignals() {
            // NOTE: Declared in BaseExtension and meant to be overwritten.
            Settings.connect($.EXTENSION_PREFS, function(aPrefKey) {
                this.__onSettingsChanged(aPrefKey);
            }.bind(this));
        }

        __onSettingsChanged(aPrefKey) {
            // NOTE: Declared in BaseExtension and meant to be overwritten.
            global.logError(`${"=".repeat(47)}\nPreference key: ${aPrefKey}\nPreference value: ${Settings[aPrefKey]}`);
        }
    }

    $.Debugger.wrapObjectMethods({
        MyExtension: MyExtension
    });

    return new MyExtension();
}

function init(aXletMeta) {
    XletMeta = aXletMeta;

    /* NOTE: I have to initialize the modules and all their exported variables
     * at this stage because the stupid asynchronicity of newer versions of Cinnamon.
     * Since I'm using Cinnamon's native settings system declared and instantiated
     * in an external module (so I can use it globally from all modules and without
     * the need to pass the settings object through a trillion other objects),
     * attempting to initialize the settings outside init() fails because the stupid
     * extension isn't loaded yet. ¬¬
     */
    $ = require("js_modules/utils.js");
    D = require("js_modules/debugManager.js");
    NotificationsUtils = require("js_modules/notificationsUtils.js");
    E = require("js_modules/extensionsUtils.js");
    G = require("js_modules/globalUtils.js");

    Settings = $.Settings;

    $.Debugger.wrapObjectMethods({
        BaseExtension: E.BaseExtension
    });
}

function enable() {
    try {
        myExtension = getExtensionClass(E.BaseExtension);

        Mainloop.idle_add(() => {
            myExtension.enable();

            return GLib.SOURCE_REMOVE;
        });

        return {
            // NOTE: __openXletSettings is declared in BaseExtension. It is only meant to open
            // an application based on the xlets settings custom framework.
            __openXletSettings: myExtension.__openXletSettings
        };
    } catch (aErr) {
        global.logError(aErr);
    }

    return null;
}

function disable() {
    if (myExtension !== null) {
        myExtension.disable();
        myExtension = null;
    }
}
