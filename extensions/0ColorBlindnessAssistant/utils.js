//{{IMPORTER}}

let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

const GlobalUtils = __import("globalUtils.js");
const DebugManager = __import("debugManager.js");
const DesktopNotificationsUtils = __import("desktopNotificationsUtils.js");

const {
    _,
    escapeHTML,
    xdgOpen
} = GlobalUtils;

const {
    wrapObjectMethods
} = DebugManager;

const {
    CustomNotification
} = DesktopNotificationsUtils;

var Debugger = new DebugManager.DebugManager("org.cinnamon.{{XLET_TYPE}}s.{{UUID}}");

wrapObjectMethods(Debugger, {
    CustomNotification: CustomNotification
});

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

/* exported Notification
 */
