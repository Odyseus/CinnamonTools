let XletMeta,
    GlobalUtils,
    DebugManager,
    Constants,
    DesktopNotificationsUtils;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
    DebugManager = require("./debugManager.js");
    Constants = require("./constants.js");
    DesktopNotificationsUtils = require("./desktopNotificationsUtils.js");
} else {
    GlobalUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].globalUtils;
    DebugManager = imports.ui.extensionSystem.extensions["{{UUID}}"].debugManager;
    Constants = imports.ui.extensionSystem.extensions["{{UUID}}"].constants;
    DesktopNotificationsUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].desktopNotificationsUtils;
}

const {
    Settings
} = Constants;

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

wrapObjectMethods(Settings, {
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
