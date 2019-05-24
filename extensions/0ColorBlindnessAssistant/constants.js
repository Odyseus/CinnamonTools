let XletMeta,
    GlobalUtils;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
} else {
    GlobalUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].globalUtils;
}

const {
    ui: {
        settings: {
            ExtensionSettings
        }
    }
} = imports;

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

/* NOTE: Future me, ULTRA-VERY-IMPORTANT!!!
 * TL;DR;: Keep using Cinnamon's native settings system initialized inside an
 * applet/desklet class/prototype, not globally declared and initialized in its
 * own class/prototype.
 * Do NOT bother using Cinnamon's native settings system initialized with its own
 * class/prototype on any type of xlet other than extensions.
 * The settings system for applets/desklets requires an xlet instance ID to be
 * passed for the settings to be initialized. This will force me to initialize the
 * settings class/prototype inside main(). That would defeat the purpose of having
 * a class initialized in a module to be able to use it by any other module.
 * It is worth mentioning that, if an xlet is NOT multi-instance (like extension are),
 * its instance ID is also its UUID; which is available globally.
 */
function ColorBlindnessAssistantSettings() {
    this._init.apply(this, arguments);
}

ColorBlindnessAssistantSettings.prototype = {
    _init: function() {
        this.settings = new ExtensionSettings(
            this,
            XletMeta.uuid
        );

        this._handlers = [];

        this._bindSettings();
    },

    _bindSettings: function() {
        /* NOTE: I converted the entire extension from using gsetting into using
         * Cinnamon's native settings system for the sole purpose of "enjoying"
         * the native system. I was enjoying it until I discovered that using
         * this.settings.bind/bindProperty doesn't make properties act like
         * getters!!! So I had to f*cking do it myself!!!!
         */
        let i = BOUND_SETTINGS_ARRAY.length;
        while (i--) {
            Object.defineProperty(
                this,
                BOUND_SETTINGS_ARRAY[i],
                this._getDescriptor(BOUND_SETTINGS_ARRAY[i])
            );
        }
    },

    _getDescriptor: function(aKey) {
        return Object.create({
            get: () => {
                return this.settings.getValue(aKey);
            },
            set: (aVal) => {
                this.settings.setValue(aKey, aVal);
            },
            enumerable: true,
            configurable: true
        });
    },

    connect: function(signal, callback) {
        let handler_id = this.settings.connect(signal, callback);
        this._handlers.push(handler_id);
        return handler_id;
    },

    destroy: function() {
        while (this._handlers.length) {
            this.disconnect(this._handlers[0]);
        }
    },

    disconnect: function(handler_id) {
        let index = this._handlers.indexOf(handler_id);
        this.settings.disconnect(handler_id);

        if (index > -1) {
            this._handlers.splice(index, 1);
        }
    }
};

var Settings = new ColorBlindnessAssistantSettings();

var EFFECT_PROP_NAME = "__ColorBlindnessAssistantExtension";

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
             ELLIPSIS,
             EFFECT_DEFAULT_PARAMS,
             ShaderEffectTypeMap,
             ShaderColorSpaceMap,
             ColorInspectorInfoBannerLabels,
             DaltonizerWizardLabels,
             DaltonizerWizardTooltips
 */
