const {
    _,
    escapeHTML,
    launchUri
} = require("js_modules/globalUtils.js");

const {
    DebugManager
} = require("js_modules/debugManager.js");

const {
    CustomNotification
} = require("js_modules/notificationsUtils.js");

const {
    CustomExtensionSettings
} = require("js_modules/extensionsUtils.js");

const {
    EXTENSION_PREFS
} = require("js_modules/constants.js");

var Debugger = new DebugManager(`org.cinnamon.extensions.${__meta.uuid}`);

Debugger.wrapObjectMethods({
    CustomNotification: CustomNotification
});

var Notification = new CustomNotification({
    title: escapeHTML(_(__meta.name)),
    default_buttons: [{
        action: "dialog-information",
        label: escapeHTML(_("Help"))
    }],
    action_invoked_callback: (aSource, aAction) => {
        switch (aAction) {
            case "dialog-information":
                launchUri(`${__meta.path}/HELP.html`);
                break;
        }
    }
});

var Settings = new CustomExtensionSettings(EXTENSION_PREFS);

/* exported Notification,
            Settings
 */
