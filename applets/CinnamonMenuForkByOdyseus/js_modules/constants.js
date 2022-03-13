var VECTOR_BOX_DEBUG = false;
var VECTOR_BOX_LEGACY = true;
var VECTOR_BOX_POLL_INTERVAL = 25;
var VECTOR_BOX_MIN_MOVEMENT = 2; // Movement smaller than this disables the mask.
var GSETTINGS_SCHEMA = `org.cinnamon.applets.${__meta.uuid}`;
var SMIDefaultParams = Object.freeze({
    name: "",
    description: "",
    type: "none",
    styleClass: "popup-menu-item",
    reactive: true,
    activatable: true,
    withMenu: false
});
var SEARCH_PRIORITY = {
    HIGH: -99999,
    MEDIUM: 0,
    LOW: 50000,
    VERY_LOW: 99999
};
var SEARCH_DATA = [{
    "context": "description",
    "priority": SEARCH_PRIORITY.VERY_LOW
}, {
    "context": "keywords",
    "priority": SEARCH_PRIORITY.MEDIUM
}, {
    "context": "generic_name",
    "priority": SEARCH_PRIORITY.HIGH
}, {
    "context": "name",
    "priority": SEARCH_PRIORITY.HIGH
}];
var APPLET_PREFS = [
    "activate_on_hover",
    "use_a_custom_icon_for_applet",
    "custom_icon_for_applet",
    "custom_label_for_applet",
    "toggle_menu_keybinding",
    "show_category_icons",
    "show_application_icons",
    "animate_menu",
    "enable_autoscroll",
    "menu_hover_delay",
    // Extras
    "strict_search_results",
    "swap_categories_box",
    "hide_applications_list_scrollbar",
    "hide_categories_list_scrollbar",
    "category_icon_size",
    "application_icon_size",
    "search_result_icon_size",
    "terminal_emulator",
    "default_shell",
    "privilege_elevator",
    "context_show_additional_application_actions",
    "context_custom_editor_for_edit_desktop_file",
    "context_gain_privileges",
    "custom_launchers_apply",
    "custom_launchers",
    "custom_launchers_icon_size",
    "custom_launchers_box_alignment",
    "max_width_for_buttons",
    "custom_launchers_box_invert_buttons_order",
    "invert_menu_layout",
    "show_all_applications_category",
    "recently_used_apps_show_separator",
    "recently_used_apps_enabled",
    "recently_used_apps_ignore_favorites",
    "recently_used_apps_invert_order",
    "recently_used_apps_max_amount",
    "hard_refresh_menu",
    "max_search_results",
    "imp_exp_last_selected_directory",
    "menu_elements_padding",
    "context_menu_items"
];
var PADDED_ELEMENTS = {
    "custom_launchers_box": "customLaunchersBox",
    "search_entry": "searchEntry",
    "search_box": "searchBox",
    "categories_box": "categoriesBox",
    "applications_box": "applicationsBox"
};
var PADDING_CSS = "padding-top: %spx;padding-right: %spx;padding-bottom: %spx;padding-left: %spx;";

/* exported SEARCH_PRIORITY,
            SMIDefaultParams,
            GSETTINGS_SCHEMA,
            SEARCH_DATA,
            APPLET_PREFS,
            PADDING_CSS,
            PADDED_ELEMENTS,
            VECTOR_BOX_DEBUG,
            VECTOR_BOX_LEGACY,
            VECTOR_BOX_POLL_INTERVAL,
            VECTOR_BOX_MIN_MOVEMENT
 */
