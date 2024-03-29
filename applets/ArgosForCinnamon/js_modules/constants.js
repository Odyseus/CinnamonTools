const {
    _
} = require("js_modules/globalUtils.js");

var APPLET_PREFS = [
    "applet_icon",
    "applet_label",
    "show_script_name",
    "prevent_applet_lines_ellipsation",
    "toggle_menu_keybinding",
    "animate_menu",
    "keep_one_menu_open",
    "file_path",
    "default_icon_size",
    "menu_spacing",
    "applet_spacing",
    "update_on_menu_open",
    "cycle_on_menu_open",
    "update_interval",
    "update_interval_units",
    "rotation_interval",
    "rotation_interval_units",
    "terminal_emulator",
    "terminal_emulator_argument",
    "shell",
    "shell_argument",
    "last_selected_directory",
    "initial_load_done"
];

var AnsiColors = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];

// Placeholder strings.
var Placeholders = {
    BLANK: "   ",
    ELLIPSIS: "..."
};

var OrnamentType = {
    NONE: 0,
    CHECK: 1,
    DOT: 2,
    ICON: 3
};

var BooleanAttrs = new Set([
    "terminal",
    "refresh",
    "trim",
    "dropdown",
    "alternate",
    "emojize",
    "ansi",
    "usemarkup",
    "unescape",
    "iconissymbolic"
]);

var TruthyVals = new Set([
    "true",
    "1"
]);

var DefaultAttributes = Object.freeze({
    // Runtime defined attributes.
    "hasAction": false,
    "isSeparator": false,
    "markup": "",
    "text": "",
    "menuLevel": 0,
    // User defined attributes.
    "command": "",
    "bash": "",
    "shell": "",
    "shellargument": "",
    "terminal": false,
    "href": "",
    "eval": "",
    "refresh": false,
    "color": "",
    "font": "",
    "size": "",
    "iconname": "",
    "image": "",
    "templateimage": "",
    "imagewidth": "",
    "imageheight": "",
    "length": "",
    "trim": true,
    "dropdown": true,
    "alternate": false,
    "emojize": true,
    "ansi": true,
    "usemarkup": true,
    "unescape": true,
    "tooltip": "",
    "iconsize": "",
    "iconissymbolic": false
});

var UnitSelectorMenuItemParams = Object.freeze({
    submenu: null,
    label: "",
    value: "",
    units_key: ""
});

var UnitSelectorSubMenuItemParams = Object.freeze({
    settings: null,
    label: "",
    tooltip: "",
    value_key: "",
    units_key: "",
    set_unit_cb: null
});

var ArgosMenuItemParams = Object.freeze({
    applet_menu: null,
    update_cb: null,
    settings: null,
    line: null,
    alt_line: null
});

var UnitsMultiplicationFactor = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400
};

var SLIDER_SCALE = 0.00025;

var UNITS_MAP = {
    s: {
        capital: _("Seconds")
    },
    m: {
        capital: _("Minutes")
    },
    h: {
        capital: _("Hours")
    },
    d: {
        capital: _("Days")
    }
};

var EXEC_ATTRIBUTES = ["bash", "command"];

/* exported AnsiColors,
            APPLET_PREFS,
            SLIDER_SCALE,
            UNITS_MAP,
            OrnamentType,
            BooleanAttrs,
            Placeholders,
            TruthyVals,
            DefaultAttributes,
            UnitSelectorMenuItemParams,
            UnitSelectorSubMenuItemParams,
            ArgosMenuItemParams,
            UnitsMultiplicationFactor,
            EXEC_ATTRIBUTES
 */
