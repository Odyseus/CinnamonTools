var XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

const {
    gettext: Gettext,
    gi: {
        GLib
    },
} = imports;

Gettext.bindtextdomain(XletMeta.uuid, GLib.get_home_dir() + "/.local/share/locale");

/**
 * Return the localized translation of a string, based on the xlet domain or
 * the current global domain (Cinnamon's).
 *
 * This function "overrides" the _() function globally defined by Cinnamon.
 *
 * @param {String} aStr - The string being translated.
 *
 * @return {String} The translated string.
 */
function _(aStr) {
    let customTrans = Gettext.dgettext(XletMeta.uuid, aStr);

    if (customTrans !== aStr && aStr !== "") {
        return customTrans;
    }

    return Gettext.gettext(aStr);
}

var NotificationsUrgency = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
};

var EFFECT_PROP_NAME = "__ColorBlindnessAssistantExtension";

var ELLIPSIS = "...";

var EFFECT_DEFAULT_PARAMS = Object.freeze({
    base_name: "",
    actor: "",
    color_space: "",
    keybinding: "",
    id: "", // On-the-fly.
});

var DESKTOP_FILE_TEMPLATE = "[Desktop Entry]\n\
Encoding=UTF-8\n\
Name=%%NAME%%\n\
Comment=%%COMMENT%%\n\
Type=Application\n\
Exec=%%EXEC%%\n\
Icon=%%ICON%%\n\
Categories=Settings;\n\
Hidden=false\n\
NoDisplay=false\n\
";

var ShaderEffectTypeMap = {
    acromatopia_rod_simulation: 4,
    acromatopia_blue_cone_simulation: 5,
    deuteranopia_compensation: 2,
    deuteranopia_simulation: 2,
    protanopia_compensation: 1,
    protanopia_simulation: 1,
    tritanopia_compensation: 3,
    tritanopia_simulation: 3,
};

var ShaderColorSpaceMap = {
    srgb: 0,
    cie: 1,
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
    tritanopia_simulation: _("Tritan sim."),
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
    tritanopia_simulation: _("Tritanopia simulation"),
};

/* exported  EFFECT_PROP_NAME,
             NotificationsUrgency,
             ELLIPSIS,
             EFFECT_DEFAULT_PARAMS,
             DESKTOP_FILE_TEMPLATE,
             ShaderEffectTypeMap,
             ShaderColorSpaceMap,
             ColorInspectorInfoBannerLabels,
             DaltonizerWizardLabels,
             DaltonizerWizardTooltips
 */
