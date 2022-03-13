const {
    _
} = require("js_modules/globalUtils.js");

var EXTENSION_PREFS = [
    "usage_notified",
    "effects_list",
    "daltonizer_wizard_kb",
    "daltonizer_animation_time",
    "daltonizer_show_actors_box",
    "daltonizer_show_colorspaces_box",
    "daltonizer_compact_ui",
    "color_inspector_kb",
    "color_inspector_hsl_visible",
    "color_inspector_hex_visible",
    "color_inspector_rgb_visible",
    "color_inspector_positioning_mode",
    "color_inspector_animation_time",
    "color_inspector_always_copy_to_clipboard_lc",
    "color_inspector_always_copy_to_clipboard_rc",
    "color_inspector_always_copy_to_clipboard_notify",
    "theme",
    "theme_path_custom",
    "apply_cinnamon_injections",
    "effects_list_apply",
    "imp_exp_last_selected_directory"
];

var EFFECT_PROP_NAME = "__ColorBlindnessAssistantExtension";

var ELLIPSIS = "...";

var EffectDefaultParams = Object.freeze({
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
    detected: _("Detected Color"),
    hue: _("Hue (%s)")
};

var ColorInspectorInfoBannerColorCodes = [
    "hex",
    "rgb",
    "hsl"
];

var ColorInspectorTooltips = {
    copy_color: _("Copy color to clipboard"),
    copy_summary: _("Copy summary color to clipboard")
};

var DaltonizerWizardLabels = {
    none: {
        normal: _("Normal"),
        // TO TRANSLATORS: Acronym for "Normal".
        compact: _("N")
    },
    focused_window: {
        normal: _("Focused window"),
        // TO TRANSLATORS: Acronym for "Focused window".
        compact: _("FW")
    },
    screen: {
        normal: _("Screen"),
        // TO TRANSLATORS: Acronym for "Screen".
        compact: _("S")
    },
    srgb: {
        normal: "sRGB",
        compact: "sRGB"
    },
    cie: {
        normal: "CIE",
        compact: "CIE"
    },
    acromatopia_rod_simulation: {
        // TO TRANSLATORS: Abbreviation for "Acromatopia (rod) simulation".
        normal: _("Acrom. (R) sim."),
        // TO TRANSLATORS: Acronym for "Acromatopia (rod) simulation".
        compact: _("A(R)S")
    },
    acromatopia_blue_cone_simulation: {
        // TO TRANSLATORS: Abbreviation for "Acromatopia (blue cone) simulation".
        normal: _("Acrom. (BC) sim."),
        // TO TRANSLATORS: Acronym for "Acromatopia (blue cone) simulation".
        compact: _("A(BC)S")
    },
    deuteranopia_compensation: {
        // TO TRANSLATORS: Abbreviation for "Deuteranopia compensation".
        normal: _("Deuteran comp."),
        // TO TRANSLATORS: Acronym for "Deuteranopia compensation".
        compact: _("DC")
    },
    protanopia_compensation: {
        // TO TRANSLATORS: Abbreviation for "Protanopia compensation".
        normal: _("Protan comp."),
        // TO TRANSLATORS: Acronym for "Protanopia compensation".
        compact: _("PC")
    },
    tritanopia_compensation: {
        // TO TRANSLATORS: Abbreviation for "Tritanopia compensation".
        normal: _("Tritan comp."),
        // TO TRANSLATORS: Acronym for "Tritanopia compensation".
        compact: _("TC")
    },
    deuteranopia_simulation: {
        // TO TRANSLATORS: Abbreviation for "Deuteranopia simulation".
        normal: _("Deuteran sim."),
        // TO TRANSLATORS: Acronym for "Deuteranopia simulation".
        compact: _("DS")
    },
    protanopia_simulation: {
        // TO TRANSLATORS: Abbreviation for "Protanopia simulation".
        normal: _("Protan sim."),
        // TO TRANSLATORS: Acronym for "Protanopia simulation".
        compact: _("PS")
    },
    tritanopia_simulation: {
        // TO TRANSLATORS: Abbreviation for "Tritanopia simulation".
        normal: _("Tritan sim."),
        // TO TRANSLATORS: Acronym for "Tritanopia simulation".
        compact: _("TS")
    }
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
             ELLIPSIS,
             EffectDefaultParams,
             ShaderEffectTypeMap,
             ShaderColorSpaceMap,
             ColorInspectorInfoBannerLabels,
             ColorInspectorTooltips,
             ColorInspectorInfoBannerColorCodes,
             DaltonizerWizardLabels,
             DaltonizerWizardTooltips,
             EXTENSION_PREFS
 */
