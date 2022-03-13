const {
    ui: {
        main: Main
    }
} = imports;

const {
    _,
    escapeHTML,
    launchUri
} = require("js_modules/globalUtils.js");

const {
    CustomNotification
} = require("js_modules/notificationsUtils.js");

const {
    DebugManager
} = require("js_modules/debugManager.js");

var HANDLER_PROP = "__HandledByPanelDrawer";

var Debugger = new DebugManager(`org.cinnamon.applets.${__meta.uuid}`);

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

/* NOTE: I couldn't find an universal way to get the panel an applet is placed on!
 * Totally and absolutely ridiculous!
 * ADDENDUM: In newer Cinnamon versions the Applet class has the `panel` property set.
 * I will keep using this function because the enabled-applets setting is less likely to change.
 */
function getPanelOfApplet(aInstanceId) {
    const enabledApplets = global.settings.get_strv("enabled-applets");

    let i = enabledApplets.length;
    while (i--) {
        try {
            const [panel, location, order, uuid, instance_id] = enabledApplets[i].split(":"); // jshint ignore:line

            if (__meta.uuid === uuid && aInstanceId === instance_id && Main.panelManager.panels[panel.slice(5)]) {
                return Main.panelManager.panels[panel.slice(5)];
            }
        } catch (aErr) {
            continue;
        }
    }

    return "";
}

/* exported Debugger,
            HANDLER_PROP,
            Notification,
            getPanelOfApplet
 */
