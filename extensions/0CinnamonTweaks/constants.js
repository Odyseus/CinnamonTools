let XletsSettingsUtils;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    XletsSettingsUtils = require("./xletsSettingsUtils.js");
} else {
    XletsSettingsUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].xletsSettingsUtils;
}

const BOUND_SETTINGS_ARRAY = [
    "pref_desktop_tweaks_enabled",
    "pref_desktop_tweaks_allow_drop_to_desktop",
    "pref_popup_menu_manager_tweaks_enabled",
    "pref_popup_menu_manager_applets_menus_behavior",
    "pref_applets_tweaks_enabled",
    "pref_applets_ask_confirmation_applet_removal",
    "pref_desklets_tweaks_enabled",
    "pref_desklets_ask_confirmation_desklet_removal",
    "pref_notifications_enable_tweaks",
    "pref_notifications_enable_animation",
    "pref_notifications_enable_close_button",
    "pref_notifications_position",
    "pref_notifications_distance_from_panel",
    "pref_notifications_right_margin",
    "pref_windows_focus_enable_tweaks",
    "pref_win_demands_attention_activation_mode",
    "pref_win_demands_attention_keyboard_shortcut",
    "pref_hotcorners_tweaks_enabled",
    "pref_hotcorners_delay_top_left",
    "pref_hotcorners_delay_top_right",
    "pref_hotcorners_delay_bottom_left",
    "pref_hotcorners_delay_bottom_right",
    "pref_tooltips_tweaks_enabled",
    "pref_tooltips_inteligent_positioning",
    "pref_tooltips_never_centered",
    "pref_tooltips_half_monitor_width",
    "pref_tooltips_delay",
    "pref_initial_load",
    "pref_window_shadows_tweaks_enabled",
    "pref_window_shadows_preset",
    "pref_window_shadows_custom_preset",
    "trigger_window_shadows_custom_preset",
    "pref_window_auto_move_tweaks_enabled",
    "pref_window_auto_move_application_list",
    "pref_window_auto_move_auto_focus",
    "pref_window_auto_move_fullscreen_in_own_ws",
    "pref_window_auto_move_fullscreen_in_own_ws_blacklist",
    "pref_maximus_enable_tweak",
    "pref_maximus_undecorate_half_maximized",
    "pref_maximus_undecorate_tiled",
    "pref_maximus_is_blacklist",
    "pref_maximus_app_list",
    "pref_maximus_enable_logging",
    "pref_maximus_apply_settings",
    "pref_maximus_invisible_windows_hack",
    "pref_test_notifications",
    "pref_logging_level",
    "pref_debugger_enabled",
    "pref_desktop_file_generated"
];

var Settings = new XletsSettingsUtils.CustomExtensionSettings(BOUND_SETTINGS_ARRAY);

var WIN_MOVER_PROP = "__CT_WindowMover_storage";

var Connections = {
    DTD: 0, // CT_DropToDesktopPatch toggle ID.
    PPMM: 0, // CT_PopupMenuManagerPatch toggle ID.
    TTP: 0, // CT_TooltipsPatch toggle ID.
    HCP: 0, // CT_HotCornersPatch toggle ID. Mark for deletion on EOL. Cinnamon 3.2.x+
    MTP: 0, // CT_MessageTrayPatch toggle ID.
    DMP: 0, // CT_DeskletManagerPatch toggle ID.
    AMP: 0, // CT_AppletManagerPatch toogle ID.
    WDAE: 0, // CT_WindowDemandsAttentionBehavior toogle ID.
    WDAE_EXEC: 0, // CT_WindowDemandsAttentionBehavior execution ID.
    WDAE_CONNECTION: 0, // CT_WindowDemandsAttentionBehavior connection ID.
    CWS: 0, // CT_CustomWindowShadows toggle ID.
    CWS_EXEC: 0, // CT_CustomWindowShadows execution ID.
    AMW: 0, // CT_AutoMoveWindows toggle ID.
    MAXNG: 0, // CT_MaximusNG toggle ID.
};

// Container for old attributes and functions for later restore.
var Injections = {
    PPMM: {},
    TTP: {},
    HCP: null,
    MTP: {},
    AMP: {},
    DMP: {},
    AMW: {},
    MAXNG: {}
};

var ShadowValues = {
    "windows_10": {
        "focused": {
            "normal": [3, -1, 0, 3, 128],
            "dialog": [3, -1, 0, 3, 128],
            "modal_dialog": [3, -1, 0, 1, 128],
            "utility": [3, -1, 0, 3, 128],
            "border": [3, -1, 0, 3, 128],
            "menu": [3, -1, 0, 3, 128],
            "popup-menu": [1, 0, 0, 1, 128],
            "dropdown-menu": [1, 10, 0, 1, 128],
            "attached": [1, 0, 0, 1, 128]
        },
        "unfocused": {
            "normal": [3, -1, 0, 3, 128],
            "dialog": [3, -1, 0, 3, 128],
            "modal_dialog": [3, -1, 0, 1, 128],
            "utility": [3, -1, 0, 3, 128],
            "border": [3, -1, 0, 3, 128],
            "menu": [3, -1, 0, 3, 128],
            "popup-menu": [1, 0, 0, 1, 128],
            "dropdown-menu": [1, 10, 0, 1, 128],
            "attached": [1, 0, 0, 1, 128]
        }
    },
    "no_shadows": {
        "focused": {
            "normal": [1, -1, 0, 3, 0],
            "dialog": [1, -1, 0, 3, 0],
            "modal_dialog": [1, -1, 0, 1, 0],
            "utility": [1, -1, 0, 1, 0],
            "border": [1, -1, 0, 3, 0],
            "menu": [1, -1, 0, 3, 0],
            "popup-menu": [1, -1, 0, 1, 0],
            "dropdown-menu": [1, 10, 0, 1, 0],
            "attached": [1, -1, 0, 1, 0]
        },
        "unfocused": {
            "normal": [1, -1, 0, 3, 0],
            "dialog": [1, -1, 0, 3, 0],
            "modal_dialog": [1, -1, 0, 3, 0],
            "utility": [1, -1, 0, 1, 0],
            "border": [1, -1, 0, 3, 0],
            "menu": [1, -1, 0, 0, 0],
            "popup-menu": [1, -1, 0, 1, 0],
            "dropdown-menu": [1, 10, 0, 1, 0],
            "attached": [1, -1, 0, 3, 0]
        }
    },
    "default": {
        "focused": {
            "normal": [6, -1, 0, 3, 255],
            "dialog": [6, -1, 0, 3, 255],
            "modal_dialog": [6, -1, 0, 1, 255],
            "utility": [3, -1, 0, 1, 255],
            "border": [6, -1, 0, 3, 255],
            "menu": [6, -1, 0, 3, 255],
            "popup-menu": [1, -1, 0, 1, 128],
            "dropdown-menu": [1, 10, 0, 1, 128],
            "attached": [6, -1, 0, 1, 255]
        },
        "unfocused": {
            "normal": [3, -1, 0, 3, 128],
            "dialog": [3, -1, 0, 3, 128],
            "modal_dialog": [3, -1, 0, 3, 128],
            "utility": [3, -1, 0, 1, 128],
            "border": [3, -1, 0, 3, 128],
            "menu": [3, -1, 0, 0, 128],
            "popup-menu": [1, -1, 0, 1, 128],
            "dropdown-menu": [1, 10, 0, 1, 128],
            "attached": [3, -1, 0, 3, 128]
        }
    }
};

/* exported Settings,
            WIN_MOVER_PROP,
            Connections,
            Injections,
            ShadowValues,
 */
