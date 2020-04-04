// {{IMPORTER}}

const GlobalUtils = __import("globalUtils.js");

const {
    _
} = GlobalUtils;

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

var CustomPopupSliderMenuItemParams = Object.freeze({
    value: "",
    associated_submenu: "",
    tooltip: "",
    value_changed_cb: null,
    drag_begin_cb: null,
    drag_end_cb: null
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

/* exported AnsiColors,
            SLIDER_SCALE,
            UNITS_MAP,
            OrnamentType,
            BooleanAttrs,
            Placeholders,
            TruthyVals,
            DefaultAttributes,
            UnitSelectorMenuItemParams,
            UnitSelectorSubMenuItemParams,
            CustomPopupSliderMenuItemParams,
            ArgosMenuItemParams,
            UnitsMultiplicationFactor
 */
