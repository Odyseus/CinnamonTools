let GlobalUtils,
    dummy;

// Mark for deletion on EOL. Cinnamon 4.0.x
// Remove polyfill usage.
if (typeof require === "function") {
    dummy = require("./lib/String_padStart.js");
} else {
    dummy = imports.ui.appletManager.applets["{{UUID}}"]["lib"].String_padStart;
}

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
} else {
    GlobalUtils = imports.ui.appletManager.applets["{{UUID}}"].globalUtils;
}

const {
    _
} = GlobalUtils;

var SOUND_ID = 1;
var HANDLE_SIZE = 10;
var HANDLE_NAMES = [
    "handleNw",
    "handleN",
    "handleNe",
    "handleW",
    "handleE",
    "handleSw",
    "handleS",
    "handleSe"
];
var BORDER_NAMES = [
    "border1",
    "border2",
    "border3",
    "border4"
];
// Just a dummy variable for gettext to detect and extract translatable strings.
var TRANSLATABLE_STRINGS = [
    _("Disabled"),
    _("Area"),
    _("Cinnamon UI"),
    _("Current Window"),
    _("Monitor"),
    _("Screen"),
    _("Tooltip"),
    _("Window Menu"),
    _("Window Section"),
    _("Window")
];
var Devices = ["camera", "recorder"];
var ClipboardCopyType = {
    OFF: 0,
    IMAGE_PATH: 1,
    IMAGE_DATA: 2
};
var KeybindingSupport = {
    "camera": {
        "Area": "area",
        "Cinnamon UI": "cinnamon_ui",
        "Monitor 0": "monitor_0",
        "Monitor 1": "monitor_1",
        "Monitor 2": "monitor_2",
        "Repeat last": "repeat",
        "Screen": "screen",
        "Window": "window"
    },
    "recorder": {

    }
};
var PROGRAMS_SUPPORT_EMPTY = {
    camera: {},
    recorder: {}
};
var SelectionType = {
    ALL_WORKSPACES: 0,
    /* @todo */
    SCREEN: 1,
    MONITOR: 2,
    WINDOW: 3,
    AREA: 4,
    CINNAMON: 5,
    REPEAT: 6
};
var InteractiveCallouts = {
    "#INTERACTIVE_AREA_HELPER#": SelectionType.AREA,
    "#INTERACTIVE_WINDOW_HELPER#": SelectionType.WINDOW
};
var SelectionTypeStr = {
    0: "workspaces",
    1: "screen",
    2: "monitor",
    3: "window",
    4: "area",
    5: "cinnamon",
    6: "repeat"
};
var ProgramSupportBase = {
    "camera": {
        "disabled": {
            "title": "Disabled"
        },
        "cinnamon": {
            "title": "Cinnamon",
            "cursor": true,
            "timer": true,
            "menuitems": {
                "Window": "WINDOW",
                "Area": "AREA",
                "Cinnamon UI": "CINNAMON",
                "Screen": "SCREEN"
            }
        }
    },
    "recorder": {
        "disabled": {
            "title": "Disabled"
        },
        "cinnamon": {
            "title": "Cinnamon",
            "fps": true,
            "menuitems": {}
        }
    }
};
var CinnamonRecorderProfilesBase = {
    "default": {
        "title": "Default",
        "description": "Encoder: On2 VP8\nMuxer: WebM\nFile extension: webm",
        "file-extension": "webm",
        "pipeline": "vp8enc min_quantizer=13 max_quantizer=13 cpu-used=5 deadline=1000000 threads=%T ! queue ! webmmux"
    }
};

/* exported SOUND_ID,
            HANDLE_SIZE,
            HANDLE_NAMES,
            BORDER_NAMES,
            TRANSLATABLE_STRINGS,
            Devices,
            ClipboardCopyType,
            KeybindingSupport,
            PROGRAMS_SUPPORT_EMPTY,
            InteractiveCallouts,
            SelectionTypeStr,
            ProgramSupportBase,
            CinnamonRecorderProfilesBase,
*/
