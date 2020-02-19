//{{IMPORTER}}

let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta["{{UUID}}"];
}

const GlobalUtils = __import("globalUtils.js");
const DesktopNotificationsUtils = __import("desktopNotificationsUtils.js");
const DebugManager = __import("debugManager.js");

const {
    ui: {
        main: Main
    }
} = imports;

const {
    _,
    escapeHTML,
    xdgOpen
} = GlobalUtils;

const {
    CustomNotification
} = DesktopNotificationsUtils;

var HANDLER_PROP = "__HandledByPanelDrawer";

var Debugger = new DebugManager.DebugManager();

var Notification = new CustomNotification({
    title: escapeHTML(_(XletMeta.name)),
    defaultButtons: [{
        action: "dialog-information",
        label: escapeHTML(_("Help"))
    }],
    actionInvokedCallback: (aSource, aAction) => {
        switch (aAction) {
            case "dialog-information":
                xdgOpen(XletMeta.path + "/HELP.html");
                break;
        }
    }
});

/* NOTE: I couldn't find an universal way to get the panel an applet is placed on!
 * Totally and absolutely ridiculous!
 */
function getPanelOfApplet(aInstanceId) {
    let enabledApplets = global.settings.get_strv("enabled-applets");

    let i = enabledApplets.length;
    while (i--) {
        try {
            let [panel, location, order, uuid, instance_id] = enabledApplets[i].split(":"); // jshint ignore:line

            if (XletMeta.uuid === uuid && aInstanceId === instance_id && Main.panelManager.panels[panel.slice(5)]) {
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
