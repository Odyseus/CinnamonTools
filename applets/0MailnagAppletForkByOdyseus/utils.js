let XletMeta,
    GlobalConstants,
    GlobalUtils,
    Constants,
    DebugManager;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta["{{UUID}}"];
}

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalConstants = require("./globalConstants.js");
    GlobalUtils = require("./globalUtils.js");
    Constants = require("./constants.js");
    DebugManager = require("./debugManager.js");
} else {
    GlobalConstants = imports.ui.appletManager.applets["{{UUID}}"].globalConstants;
    GlobalUtils = imports.ui.appletManager.applets["{{UUID}}"].globalUtils;
    Constants = imports.ui.appletManager.applets["{{UUID}}"].constants;
    DebugManager = imports.ui.appletManager.applets["{{UUID}}"].debugManager;
}

const {
    gi: {
        St
    },
    ui: {
        popupMenu: PopupMenu
    }
} = imports;

const {
    UNICODE_SYMBOLS
} = GlobalConstants;

const {
    _,
    ngettext
} = GlobalUtils;

var Debugger = new DebugManager.DebugManager();

function MailItem() {
    this._init.apply(this, arguments);
}

MailItem.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(id, sender, sender_address, subject, datetime, account) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this);

        this.id = id;
        this.subject = subject;
        this.account = account;
        this.datetime = datetime;

        if (sender === "") {
            sender = sender_address;
        }
        this.sender = sender;

        this._sender_label = new St.Label({
            text: sender,
            style_class: "mailnag-sender-label"
        });
        this._subject_label = new St.Label({
            text: subject,
            style_class: "mailnag-subject-label"
        });
        this._datetime_label = new St.Label({
            text: this.formatDatetime(datetime),
            style_class: "popup-inactive-menu-item"
        });

        // mark read icon
        let markReadIcon = new St.Icon({
            icon_name: "edit-delete",
            icon_type: St.IconType.SYMBOLIC,
            style_class: "popup-menu-icon"
        });
        this.markReadButton = new St.Button({
            child: markReadIcon,
            style_class: "mailnag-mark-read-button"
        });

        // setup layout
        this._vBox = new St.BoxLayout({
            vertical: true
        });

        this._vBox.add(this._sender_label);
        this._vBox.add(this._subject_label);

        this.addActor(this._vBox, {
            expand: true
        });
        this.addActor(this._datetime_label);
        this.addActor(this.markReadButton, {
            expand: false,
            align: St.Align.END
        });
    },

    activate: function(event, keepMenu) { // jshint ignore:line
        this.emit("activate", event, true); // keepMenu=True, prevents menu from closing
    },

    updateTimeDisplay: function() {
        this._datetime_label.text = this.formatDatetime(this.datetime);
    },

    // formats datetime relative to now
    formatDatetime: function(datetime) {
        let time_diff = (new Date().getTime() - datetime.getTime()) / 1000;
        let days_diff = Math.floor(time_diff / 86400); // 86400 = Amount of seconds in 24 hours.

        if (days_diff === 0) { // today
            if (time_diff < 60) { // <1 minute
                return _("just now");
            } else if (time_diff < 3600) { // <1 hour
                let m = Math.floor(time_diff / 60);
                return ngettext("%d minute ago", "%d minutes ago", m).format(m);
            } else {
                let h = Math.floor(time_diff / 3600);
                return ngettext("%d hour ago", "%d hours ago", h).format(h);
            }
        } else { // before today
            if (days_diff === 1) {
                return _("yesterday");
            } else if (days_diff < 7) {
                return ngettext("%d day ago", "%d days ago", days_diff).format(days_diff);
            } else if (days_diff < 30) {
                let w = Math.ceil(days_diff / 7);
                return ngettext("%d week ago", "%d weeks ago", w).format(w);
            } else {
                return datetime.toLocaleDateString();
            }
        }
    }
};

function AccountMenu() {
    this._init.apply(this, arguments);
}

AccountMenu.prototype = {
    __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,

    _init: function(account, orientation) {
        PopupMenu.PopupSubMenuMenuItem.prototype._init.call(this, account, false);
        this._orientation = orientation; // needed for sorting
        this.label.style_class = "mailnag-account-label";
        this.menuItems = {};
    },

    add: function(mailMenuItem) {
        if (this._orientation === St.Side.TOP) {
            this.menu.addMenuItem(mailMenuItem, 0); // add to top of menu
        } else {
            this.menu.addMenuItem(mailMenuItem); // add to bottom of menu
        }

        this.menuItems[mailMenuItem.id] = mailMenuItem;
    }
};

function ellipsize(aString, aMaxLen) {
    if (aMaxLen < 3) {
        aMaxLen = 3;
    }

    return (aString.length > aMaxLen) ?
        aString.substr(0, aMaxLen - 1) + UNICODE_SYMBOLS.horizontal_ellipsis :
        aString;
}

DebugManager.wrapObjectMethods(Debugger, {
    AccountMenu: AccountMenu,
    MailItem: MailItem,
});

/* exported ellipsize
 */
