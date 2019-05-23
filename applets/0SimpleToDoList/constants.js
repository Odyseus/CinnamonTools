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

var OrnamentType = {
    NONE: 0,
    CHECK: 1,
    DOT: 2,
    ICON: 3
};

// This is used to create an example tasks list.
// I chose to do this so the example can be localized.
var DefaultExampleTasks = {
    "name": _("Tasks list - Some examples"),
    "sort-tasks-alphabetically": true,
    "sort-tasks-by-completed": true,
    "display-remove-task-buttons": true,
    "keep-completed-tasks-hidden": false,
    "tasks": [{
        "name": _('Tasks can be "tagged" by simply writing "@tagname" as part of the task text. For now, there are 5 priority tags available.'),
        "completed": false
    }, {
        "name": _("This is a @critical priority task"),
        "completed": false
    }, {
        "name": _("This is a @high priority task"),
        "completed": false
    }, {
        "name": _("This is a @medium priority task"),
        "completed": false
    }, {
        "name": _("This is a @today priority task"),
        "completed": false
    }, {
        "name": _("This is a @low priority task"),
        "completed": false
    }]
};

/* exported OrnamentType,
            DefaultExampleTasks
 */
