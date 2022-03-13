var EXTENSION_PREFS = [
    "extra_shaders_path",
    "global_keybindings",
    "shader_list",
    "color_list",
    "desaturation_list",
    "contrast_list",
    "brightness_list",
    "usage_notified",
    "shader_list_apply",
    "color_list_apply",
    "desaturation_list_apply",
    "contrast_list_apply",
    "brightness_list_apply",
    "global_keybindings_apply",
    "imp_exp_last_selected_directory",
    "apply_cinnamon_injections"
];

var URI_RE = /^file\:\/\//;
var PROP_NAME_CLEANER_RE = /[\s\:\.\,\(\)\@]/g;
var EFFECTS_PROP_NAME = "__CinnamonDesktopEffectsApplierExtension";

var EffectDefaultParams = Object.freeze({
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

/* exported _,
            EffectDefaultParams,
            NotificationsUrgency,
            DESKTOP_FILE_TEMPLATE,
            ALLOWED_WIN_TYPES,
            URI_RE,
            EFFECTS_PROP_NAME,
            PROP_NAME_CLEANER_RE,
            EXTENSION_PREFS
*/
