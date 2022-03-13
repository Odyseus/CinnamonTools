const {
    _
} = require("js_modules/globalUtils.js");

var APPLET_PREFS = [
    "applet_icon",
    "applet_label",
    "show_tasks_counter_on_applet",
    "toggle_menu_keybinding",
    "use_fail_safe",
    "animate_menu",
    "keep_one_menu_open",
    "section_font_size",
    "section_set_min_width",
    "section_set_max_width",
    "section_keep_alphabetic_order",
    "section_set_bold",
    "section_remove_native_entry_theming",
    "section_remove_native_entry_theming_sizing",
    "task_font_size",
    "task_set_min_width",
    "task_set_max_width",
    "task_set_custom_spacing",
    "task_set_bold",
    "task_remove_native_entry_theming",
    "task_remove_native_entry_theming_sizing",
    "task_completed_character",
    "task_notcompleted_character",
    "tasks_priorities_colors_enabled",
    "tasks_priorities_highlight_entire_row",
    "autobackups_enabled",
    "autobackups_max_files_to_keep",
    "last_backup_cleanup",
    "initial_load",
    "imp_exp_last_selected_directory_tasks",
    "imp_exp_last_selected_directory_tags",
    "save_last_selected_directory",
    "tag_definitions",
    "tag_definitions_apply"
];

var DEFAULT_TAG_DEFINITIONS = [{
    "enabled": true,
    "tag": "@critical",
    "text_color": "rgba(0,0,0,1)",
    "bg_color": "rgba(255,0,0,1)"
}, {
    "enabled": true,
    "tag": "@high",
    "text_color": "rgba(0,0,0,1)",
    "bg_color": "rgba(200,0,0,1)"
}, {
    "enabled": true,
    "tag": "@today",
    "text_color": "rgba(0,0,0,1)",
    "bg_color": "rgba(255,255,0,1)"
}, {
    "enabled": true,
    "tag": "@medium",
    "text_color": "rgba(0,0,0,1)",
    "bg_color": "rgba(232,204,73,1)"
}, {
    "enabled": true,
    "tag": "@low",
    "text_color": "rgba(0,0,0,1)",
    "bg_color": "rgba(221,160,221,1)"
}];

var OrnamentType = {
    NONE: 0,
    CHECK: 1,
    DOT: 2,
    ICON: 3
};

// This is used to create an example tasks list.
// I chose to do this so the example can be localized.
var DefaultExampleTasks = {
    "name": _("Tasks list - Some examples"),
    "sort-tasks-alphabetically": true,
    "sort-tasks-by-completed": true,
    "display-remove-task-buttons": true,
    "keep-completed-tasks-hidden": false,
    "tasks": [{
        "name": _('Tasks can be "tagged" by simply writing "@tagname" as part of the task text.'),
        "completed": false
    }, {
        "name": _("This is a @critical priority task"),
        "completed": false
    }, {
        "name": _("This is a @high priority task"),
        "completed": false
    }, {
        "name": _("This is a @medium priority task"),
        "completed": false
    }, {
        "name": _("This is a @today priority task"),
        "completed": false
    }, {
        "name": _("This is a @low priority task"),
        "completed": false
    }]
};

/* exported OrnamentType,
            DefaultExampleTasks,
            APPLET_PREFS,
            DEFAULT_TAG_DEFINITIONS
 */
