const {
    DebugManager
} = require("js_modules/debugManager.js");

const {
    CustomNotification
} = require("js_modules/notificationsUtils.js");

const {
    _,
    escapeHTML,
    launchUri
} = require("js_modules/globalUtils.js");

var Debugger = new DebugManager(`org.cinnamon.{{XLET_TYPE}}s.${__meta.uuid}`);

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

/* exported Debugger,
            Notification
 */
