let XletMeta = null,
    GlobalUtils;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
} else {
    GlobalUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].globalUtils;
}

const {
    _
} = GlobalUtils;

function init(aXletMeta) {
    XletMeta = aXletMeta;
}

function enable() {
    //
}

function disable() {
    //
}
