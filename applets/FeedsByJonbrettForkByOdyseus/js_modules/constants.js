var APPLET_PREFS = [
    "show_icons_in_menu",
    "last_checked_storage",
    "description_max_length",
    "tooltip_max_width",
    "refresh_interval_mins",
    "max_items",
    "min_article_item_width",
    "notifications_enabled",
    "unified_notifications",
    "toggle_menu_keybinding",
    "new_feed_icon",
    "feed_icon",
    "third_party_integration_panel_drawer",
    "feeds",
    "feeds_apply",
    "imp_exp_last_selected_directory"
];

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

/* exported FeedParams,
            APPLET_PREFS
 */
