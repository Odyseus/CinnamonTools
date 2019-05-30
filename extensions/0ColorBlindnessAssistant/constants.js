let GlobalUtils,
    ExtensionSettingsUtils;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
    ExtensionSettingsUtils = require("./extensionSettingsUtils.js");
} else {
    GlobalUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].globalUtils;
    ExtensionSettingsUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].extensionSettingsUtils;
}

const {
    _
} = GlobalUtils;

const BOUND_SETTINGS_ARRAY = [
    "pref_logging_level",
    "pref_debugger_enabled",
    "pref_usage_notified",
    "pref_effects_list",
    "pref_daltonizer_wizard_kb",
    "pref_daltonizer_animation_time",
    "pref_daltonizer_show_actors_box",
    "pref_daltonizer_show_colorspaces_box",
    "pref_color_inspector_kb",
    "pref_color_inspector_animation_time",
    "pref_color_inspector_always_copy_to_clipboard",
    "pref_theme",
    "pref_theme_path_custom",
    "pref_apply_cinnamon_injections",
    "trigger_effects_list",
    "pref_desktop_file_generated",
    "pref_imp_exp_last_selected_directory"
];

var Settings = new ExtensionSettingsUtils.CustomExtensionSettings(BOUND_SETTINGS_ARRAY);

var EFFECT_PROP_NAME = "__ColorBlindnessAssistantExtension";

var Injections = {
    workspace: {},
    appSwitcher3D: {},
    expoThumbnail: {},
    timelineSwitcher: {}
};

var ELLIPSIS = "...";

var EFFECT_DEFAULT_PARAMS = Object.freeze({
    base_name: "",
    actor: "",
    color_space: "",
    keybinding: "",
    id: "", // On-the-fly.
});

var ShaderEffectTypeMap = {
    acromatopia_rod_simulation: 4,
    acromatopia_blue_cone_simulation: 5,
    deuteranopia_compensation: 2,
    deuteranopia_simulation: 2,
    protanopia_compensation: 1,
    protanopia_simulation: 1,
    tritanopia_compensation: 3,
    tritanopia_simulation: 3
};

var ShaderColorSpaceMap = {
    srgb: 0,
    cie: 1
};

var ColorInspectorInfoBannerLabels = {
    input: _("Input Color"),
    code: _("Detected Color"),
    hue: _("Hue")
};

var DaltonizerWizardLabels = {
    none: _("Normal"),
    focused_window: _("Focused window"),
    screen: _("Screen"),
    srgb: "sRGB",
    cie: "CIE",
    acromatopia_rod_simulation: _("Acrom. (R) sim."),
    acromatopia_blue_cone_simulation: _("Acrom. (BC) sim."),
    deuteranopia_compensation: _("Deuteran comp."),
    protanopia_compensation: _("Protan comp."),
    tritanopia_compensation: _("Tritan comp."),
    deuteranopia_simulation: _("Deuteran sim."),
    protanopia_simulation: _("Protan sim."),
    tritanopia_simulation: _("Tritan sim.")
};

var DaltonizerWizardTooltips = {
    none: _("Normal"),
    focused_window: _("Focused window"),
    screen: _("Screen"),
    srgb: _("Standard RGB"),
    cie: "CIE RGB",
    acromatopia_rod_simulation: _("Acromatopia (rod) simulation"),
    acromatopia_blue_cone_simulation: _("Acromatopia (blue cone) simulation"),
    deuteranopia_compensation: _("Deuteranopia compensation"),
    protanopia_compensation: _("Protanopia compensation"),
    tritanopia_compensation: _("Tritanopia compensation"),
    deuteranopia_simulation: _("Deuteranopia simulation"),
    protanopia_simulation: _("Protanopia simulation"),
    tritanopia_simulation: _("Tritanopia simulation")
};

/* exported  EFFECT_PROP_NAME,
             Settings,
             LoggingLevel,
             Injections,
             ELLIPSIS,
             EFFECT_DEFAULT_PARAMS,
             ShaderEffectTypeMap,
             ShaderColorSpaceMap,
             ColorInspectorInfoBannerLabels,
             DaltonizerWizardLabels,
             DaltonizerWizardTooltips
 */
