let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta["{{UUID}}"];
}

const {
    gi: {
        GLib
    }
} = imports;

var DataStorage = GLib.get_home_dir() + "/.cinnamon/" + XletMeta.uuid + "-Storage";
var MIN_MENU_WIDTH = 400;
var FEED_LOCAL_DATA_FILE = DataStorage + "/%s.json";
var FEED_CONFIG_FILE = DataStorage + "/feeds.json";

/* exported MIN_MENU_WIDTH,
            FEED_LOCAL_DATA_FILE,
            FEED_CONFIG_FILE,
 */
