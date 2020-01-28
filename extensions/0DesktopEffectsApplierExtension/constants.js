let GlobalUtils,
    XletsSettingsUtils;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
    XletsSettingsUtils = require("./xletsSettingsUtils.js");
} else {
    GlobalUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].globalUtils;
    XletsSettingsUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].xletsSettingsUtils;
}

var BOUND_SETTINGS_ARRAY = [
    "pref_desktop_file_generated",
    "pref_logging_level",
    "pref_debugger_enabled",
    "pref_extra_shaders_path",
    "pref_global_keybindings",
    "pref_shader_list",
    "pref_color_list",
    "pref_desaturation_list",
    "pref_contrast_list",
    "pref_brightness_list",
    "pref_usage_notified",
    "trigger_shader_list_changed",
    "trigger_color_list_changed",
    "trigger_desaturation_list_changed",
    "trigger_contrast_list_changed",
    "trigger_brightness_list_changed",
    "trigger_global_keybindings_changed",
    "pref_imp_exp_last_selected_directory",
    "pref_apply_cinnamon_injections"
];

var Settings = new XletsSettingsUtils.CustomExtensionSettings(BOUND_SETTINGS_ARRAY);
var DEFAULT_SHADER_FILE_RE = /^\:\:/;
var URI_RE = /^file\:\/\//;
var PROP_NAME_CLEANER_RE = /[\s\:\.\,\(\)\@]/g;
var EFFECTS_PROP_NAME = "__CinnamonDesktopEffectsApplierExtension";

var EFFECT_DEFAULT_PARAMS = Object.freeze({
    type: "", // On-the-fly.
    base_name: "",
    extra_shaders_path: "", // On-the-fly.
    id: "", // On-the-fly.
    new_frame_signal: 0,
    add_size_changed_signal: false,
    trigger_0: "",
    trigger_1: "",
    trigger_2: "",
    trigger_3: "",
    trigger_4: ""
});

/* NOTE: These are all the window types that I found in Muffin's source code.
 * (muffin/src/muffin-enum-types.c)
 * I don't know if there are more nor if it's adviced to allow to add effects
 * to all the window types. I just want to blacklist the freaking desktop.
 */
var ALLOWED_WIN_TYPES = {
    0: "NORMAL",
    // 1: "DESKTOP",
    // 2: "DOCK",
    3: "DIALOG",
    4: "MODAL_DIALOG",
    5: "TOOLBAR",
    6: "MENU",
    7: "UTILITY",
    8: "SPLASHSCREEN",
    9: "DROPDOWN_MENU",
    10: "POPUP_MENU",
    11: "TOOLTIP",
    12: "NOTIFICATION",
    13: "COMBO",
    14: "DND",
    15: "OVERRIDE_OTHER"
};

var Injections = {
    workspace: {},
    appSwitcher3D: {},
    expoThumbnail: {},
    timelineSwitcher: {}
};

/* exported _,
            EFFECT_DEFAULT_PARAMS,
            NotificationsUrgency,
            DESKTOP_FILE_TEMPLATE,
            ALLOWED_WIN_TYPES,
            DEFAULT_SHADER_FILE_RE,
            URI_RE,
            EFFECTS_PROP_NAME,
            PROP_NAME_CLEANER_RE,
            Settings,
            BOUND_SETTINGS_ARRAY,
            Injections
*/
