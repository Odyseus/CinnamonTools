const {
    _
} = require("js_modules/globalUtils.js");

var APPLET_PREFS = [
    "applet_width_height",
    "applet_icon",
    "applet_label",
    "scroll_action",
    "separated_scroll_action",
    "left_click_action",
    "middle_click_action",
    "windows_list_menu_enabled",
    "button_to_open_menu",
    "scroll_up_action",
    "scroll_down_action",
    "custom_cmd1_action",
    "custom_cmd2_action",
    "custom_cmd3_action",
    "custom_cmd4_action",
    "prevent_fast_scroll",
    "scroll_delay",
    "switcher_style",
    "switcher_scope",
    "switcher_scope_modified",
    "switcher_scope_modifier",
    "show_context_menu_default_items",
    "show_context_menu_help",
    "show_context_menu_about",
    "show_context_menu_remove",
    "keep_menu_open_when_closing",
    "keep_menu_open_when_activating",
    "show_close_buttons",
    "show_close_all_buttons",
    "hover_delay",
    "hover_action",
    "hover_enabled",
    "peek_opacity",
    "opacify_desktop_icons",
    "opacify_desklets",
    "blur_effect_enabled",
    "icon_close_all_windows",
    "icon_close_all_windows_size",
    "icon_close_window",
    "icon_close_window_size",
    "icon_applications_size"
];

var STRINGS_MAP = {
    "expo": _("Expo"),
    "overview": _("Overview"),
    "appswitcher": _("Launch App Switcher"),
    "cc1": _("Run 1st Custom Command"),
    "cc2": _("Run 2nd Custom Command"),
    "cc3": _("Run 3rd Custom Command"),
    "cc4": _("Run 4rd Custom Command"),
    "none": _("None"),
    "icons": _("Icons only"),
    "thumbnails": _("Thumbnails only"),
    "icons+thumbnails": _("Icons and thumbnails"),
    "icons+preview": _("Icons and window preview"),
    "preview": _("Window preview (no icons)"),
    "coverflow": _("Coverflow (3D)"),
    "timeline": _("Timeline (3D)"),
    "default": _("System default"),
    "switch_workspace": _("Switch between workspaces"),
    "adjust_opacity": _("Adjust opacity of windows"),
    "desktop": _("Toggle show desktop"),
    "switch-windows": _("Switch between windows"),
    "winmenu": _("Open windows list menu")
};

var WindowMenuItemParams = Object.freeze({
    title: "",
    icon: null,
    windows: null,
    sticky: false,
    menusection: null,
    workspace: 0,
    meta_window: null
});

/* exported STRINGS_MAP,
            APPLET_PREFS,
            WindowMenuItemParams
 */
