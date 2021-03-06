// {{IMPORTER}}

let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

let GlobalUtils = __import("globalUtils.js");
let DebugManager = __import("debugManager.js");
let DesktopNotificationsUtils = __import("desktopNotificationsUtils.js");
let XletsSettingsUtils = __import("xletsSettingsUtils.js");

const {
    wrapObjectMethods
} = DebugManager;

const {
    CustomNotification
} = DesktopNotificationsUtils;

const {
    escapeHTML
} = GlobalUtils;

var BOUND_SETTINGS_ARRAY = [
    // Widgets
    "pref_applist",
    "pref_filechooser_directory_select",
    "pref_filechooser_file_select",
    "pref_iconfilechooser",
    "pref_colorchooser",
    "pref_appchooser",
    "pref_list_1",
    "pref_list_1_apply",
    "pref_list_1_imp_exp_path",
    "pref_list_2",
    "pref_list_2_apply",
    "pref_keybinding_1",
    "pref_keybinding_2",
    "pref_keybinding_with_options",
    "pref_dependency_1_boolean",
    "pref_dependency_1_true",
    "pref_dependency_1_false",
    "pref_dependency_2_comparisons",
    "pref_dependency_2_greater_than",
    "pref_dependency_2_less_than",
    "pref_dependency_2_equal_or_greater_than",
    "pref_dependency_2_equal_or_less_than",
    "pref_dependency_2_equal",
    "pref_dependency_3_multiple_1",
    "pref_dependency_3_multiple_2",
    "pref_switch",
    "pref_entry",
    "pref_combobox_string",
    "pref_combobox_integer",
    "pref_spinbutton",
    "pref_button",
    "pref_textview",
    // Runtime
    // "pref_logging_level",
    // "pref_debugger_enabled",
    "pref_desktop_file_generated"
];

var Debugger = new DebugManager.DebugManager("org.cinnamon.{{XLET_TYPE}}s.{{UUID}}");

var Settings = new XletsSettingsUtils.CustomExtensionSettings(BOUND_SETTINGS_ARRAY);

wrapObjectMethods(Debugger, {
    CustomNotification: CustomNotification
});

var Notification = new CustomNotification({
    title: escapeHTML(XletMeta.name)
});

/* exported Notification,
            Settings
 */
