let GlobalUtils;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
} else {
    GlobalUtils = imports.ui.appletManager.applets["{{UUID}}"].globalUtils;
}

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
 */
