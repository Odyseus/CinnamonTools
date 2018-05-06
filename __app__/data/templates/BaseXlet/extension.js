let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
}

const _ = $._;

let xletMeta = null;

// Called when extension is loaded
function init(aXletMeta) {
    xletMeta = aXletMeta;
}

// Called when extension is loaded
function enable() {
    //
}

// Called when extension gets disabled
function disable() {
    //
}
