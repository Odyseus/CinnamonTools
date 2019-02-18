var XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta["{{UUID}}"];
}

// KEEP ME: There will always be non retro compatible changes on Cinnamon as long
// as it keeps being treated as a F***ING web application!!!
// var CINNAMON_VERSION = GLib.getenv("CINNAMON_VERSION");
var AnsiColors = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];

var DebugManagerSchema = "org.cinnamon.applets." + XletMeta.uuid;

// Placeholder strings.
var Placeholders = {
    BLANK: "   ",
    ELLIPSIS: "...",
};

var OrnamentType = {
    NONE: 0,
    CHECK: 1,
    DOT: 2,
    ICON: 3
};

var NotificationUrgency = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
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
    "iconissymbolic",
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
    "iconissymbolic": false,
});

/* exported AnsiColors,
            DebugManagerSchema,
            OrnamentType,
            NotificationUrgency,
            BooleanAttrs,
            Placeholders,
            TruthyVals,
            DefaultAttributes,
 */
