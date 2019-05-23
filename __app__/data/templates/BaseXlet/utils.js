let DebugManager;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    DebugManager = require("./debugManager.js");
} else {
    DebugManager = imports.ui.$$XLET_MANAGER$$.$$XLET_TYPE$$s["{{UUID}}"].debugManager;
}

var Debugger = new DebugManager.DebugManager();

/* exported Debugger
 */
