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
    ColorInspectorInfoBannerLabels,
    EXTENSION_PREFS
} = require("js_modules/constants.js");

const {
    CustomExtensionSettings
} = require("js_modules/extensionsUtils.js");

var Settings = new CustomExtensionSettings(EXTENSION_PREFS);

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

// NOTE: Defined here to avoid ugly indentation when defined inside a class method.
function getColorSummary(aC) {
    return `${aC.exact_match ? _("Exact Match") : _("Approximation")}: ${aC.detected_name}
${ColorInspectorInfoBannerLabels["input"]}: ${aC.input_hex} - ${aC.input_rgb} - ${aC.input_hsl}
${ColorInspectorInfoBannerLabels["detected"]}: ${aC.detected_hex} - ${aC.detected_rgb} - ${aC.detected_hsl}
${ColorInspectorInfoBannerLabels["hue"].format(aC.hue_name)}: ${aC.hue_hex} - ${aC.hue_rgb} - ${aC.hue_hsl}
`;
}

function getDaltonizerClass(aClass) {
    return Settings.daltonizer_compact_ui ? `${aClass} compact` : aClass;
}

/* exported Notification,
            Settings,
            getColorSummary,
            getDaltonizerClass
 */
