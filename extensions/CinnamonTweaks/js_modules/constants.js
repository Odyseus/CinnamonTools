var EXTENSION_PREFS = [
    "desktop_tweaks_enabled",
    "desktop_tweaks_allow_drop_to_desktop",
    "popup_menu_manager_tweaks_enabled",
    "popup_menu_manager_applets_menus_behavior",
    "windows_focus_enable_tweaks",
    "win_demands_attention_activation_mode",
    "win_demands_attention_keyboard_shortcut",
    "tooltips_tweaks_enabled",
    "tooltips_inteligent_positioning",
    "tooltips_never_centered",
    "tooltips_half_monitor_width",
    "tooltips_delay",
    "initial_load",
    "window_shadows_tweaks_enabled",
    "window_shadows_preset",
    "window_shadows_custom_preset",
    "window_shadows_preset_apply",
    "window_auto_move_tweaks_enabled",
    "window_auto_move_application_list",
    "window_auto_move_auto_focus",
    "window_auto_move_fullscreen_in_own_ws",
    "window_auto_move_fullscreen_in_own_ws_blacklist",
    "maximus_enabled",
    "maximus_undecorate_half_maximized",
    "maximus_undecorate_tiled",
    "maximus_is_blacklist",
    "maximus_app_list",
    "maximus_enable_logging",
    "maximus_apply_settings",
    "maximus_invisible_windows_hack",
    "restore_logging_to_glass_log_file"
];

var TWEAKS_PREFS = [
    "desktop_tweaks_enabled",
    "maximus_enabled",
    "popup_menu_manager_tweaks_enabled",
    "tooltips_tweaks_enabled",
    "window_auto_move_tweaks_enabled",
    "window_shadows_tweaks_enabled",
    "windows_focus_enable_tweaks"
];

var MIN_CINNAMON_VERSION = "5.0.0";

var WIN_MOVER_PROP = "__CT_WindowMover_storage";

var CT_BaseParams = Object.freeze({
    // The setting name whose value needs to be retrieved to enable a tweak.
    setting_to_enable: "",
    // Initialize SignalManager.SignalManager?
    init_signal_manager: false,
    // Initialize globalUtils.KeybindingsManager?
    init_keybinding_manager: false,
    // Initialize injectionsUtils.InjectionsManager?
    init_injection_manager: false
});

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

/* exported EXTENSION_PREFS,
            WIN_MOVER_PROP,
            ShadowValues,
            TWEAKS_PREFS,
            MIN_CINNAMON_VERSION,
            CT_BaseParams
 */
