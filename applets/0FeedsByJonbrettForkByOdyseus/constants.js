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
var FEED_LOCAL_DATA_FILE = DataStorage + "/%s.json";
var FeedParams = Object.freeze({
    id: "",
    group: "",
    custom_title: "",
    url: "",
    notify: true,
    interval: 30,
    show_read_items: false,
    show_image: false
});

/* exported MIN_MENU_WIDTH,
            FEED_LOCAL_DATA_FILE,
            FeedParams
 */
