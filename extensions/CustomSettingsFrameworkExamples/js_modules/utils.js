const {
    DebugManager
} = require("js_modules/debugManager.js");

const {
    CustomNotification
} = require("js_modules/notificationsUtils.js");

const {
    escapeHTML
} = require("js_modules/globalUtils.js");

const {
    CustomExtensionSettings
} = require("js_modules/extensionsUtils.js");

var EXTENSION_PREFS = [
    "appchooser",
    "applist",
    "applist_changed",
    "button",
    "colorchooser",
    "combobox_integer",
    "combobox_paths",
    "combobox_string",
    "combobox_string_list",
    "dependency_1_boolean",
    "dependency_1_false",
    "dependency_1_true",
    "dependency_2_comparisons",
    "dependency_2_equal",
    "dependency_2_equal_or_greater_than",
    "dependency_2_equal_or_less_than",
    "dependency_2_greater_than",
    "dependency_2_less_than",
    "dependency_3_multiple_1",
    "dependency_3_multiple_2",
    "entry",
    "filechooser_directory_select",
    "filechooser_file_select",
    "filetest_append",
    "filetest_copy",
    "filetest_data_to_write",
    "filetest_delete",
    "filetest_destroy",
    "filetest_ensureparents",
    "filetest_exists",
    "filetest_info",
    "filetest_init",
    "filetest_instancepath",
    "filetest_isdirectory",
    "filetest_isexecutable",
    "filetest_isfile",
    "filetest_isrealdirectory",
    "filetest_isrealfile",
    "filetest_issymlink",
    "filetest_listdir",
    "filetest_read",
    "filetest_secondarypath",
    "filetest_setexecutable",
    "filetest_write",
    "iconfilechooser",
    "keybinding_1",
    "keybinding_2",
    "keybinding_with_options",
    "list_1",
    "list_2",
    "list_2_apply",
    "list_2_imp_exp_path",
    "list_3",
    "list_3_apply",
    "path_extra_files_for_combobox",
    "scale_1",
    "scale_2",
    "scale_3",
    "soundfilechooser",
    "spinbutton",
    "stringslist",
    "stringslist_changed",
    "switch",
    "textview",
    "textviewbutton"
];

var Debugger = new DebugManager(`org.cinnamon.extensions.${__meta.uuid}`);

var Settings = new CustomExtensionSettings(EXTENSION_PREFS);

Debugger.wrapObjectMethods({
    CustomNotification: CustomNotification
});

var Notification = new CustomNotification({
    title: escapeHTML(__meta.name)
});

/* exported Notification,
            Settings
 */
