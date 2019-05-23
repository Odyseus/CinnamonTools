var GSETTINGS_SCHEMA = "org.cinnamon.applets.{{UUID}}";
var SMI_DEFAULT_PARAMS = Object.freeze({
    name: "",
    description: "",
    type: "none",
    styleClass: "popup-menu-item",
    reactive: true,
    activatable: true,
    withMenu: false
});
var SEARCH_PRIORITY = {
    HIGH: -99999,
    MEDIUM: 0,
    LOW: 50000,
    VERY_LOW: 99999
};
var SEARCH_DATA = [{
    "context": "description",
    "priority": SEARCH_PRIORITY.VERY_LOW
}, {
    "context": "keywords",
    "priority": SEARCH_PRIORITY.MEDIUM
}, {
    "context": "generic_name",
    "priority": SEARCH_PRIORITY.HIGH
}, {
    "context": "name",
    "priority": SEARCH_PRIORITY.HIGH
}];

/* exported SEARCH_PRIORITY,
            SMI_DEFAULT_PARAMS,
            GSETTINGS_SCHEMA,
            SEARCH_DATA
 */
