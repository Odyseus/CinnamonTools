const {
    gi: {
        St
    },
    misc: {
        params: Params
    },
    ui: {
        popupMenu: PopupMenu
    }
} = imports;

const {
    UNICODE_SYMBOLS
} = require("js_modules/globalConstants.js");

const {
    _,
    ngettext
} = require("js_modules/globalUtils.js");

const {
    MailItemParams
} = require("js_modules/constants.js");

const {
    DebugManager
} = require("js_modules/debugManager.js");

var Debugger = new DebugManager(`org.cinnamon.applets.${__meta.uuid}`);

var MailItem = class MailItem extends PopupMenu.PopupBaseMenuItem {
    constructor(aParams) {
        super();

        const params = Params.parse(aParams, MailItemParams);

        this.id = params.id;
        this.subject = params.subject;
        this.account = params.account;
        this.datetime = params.datetime;
        this.sender_address = params.sender_address;
        this.sender = params.sender || params.sender_address;

        this._sender_label = new St.Label({
            text: this.sender,
            style_class: "mailnag-sender-label"
        });
        this._subject_label = new St.Label({
            text: this.subject,
            style_class: "mailnag-subject-label"
        });
        this._datetime_label = new St.Label({
            text: this.formatDatetime(this.datetime),
            style_class: "popup-inactive-menu-item"
        });

        // mark read icon
        const markReadIcon = new St.Icon({
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
    }

    activate(aEvent) {
        this.emit("activate", aEvent, true); // keepMenu=True, prevents menu from closing
    }

    updateTimeDisplay() {
        this._datetime_label.text = this.formatDatetime(this.datetime);
    }

    // formats datetime relative to now
    formatDatetime(aDatetime) {
        const time_diff = (new Date().getTime() - aDatetime.getTime()) / 1000;
        const days_diff = Math.floor(time_diff / 86400); // 86400 = Amount of seconds in 24 hours.

        if (days_diff === 0) { // today
            if (time_diff < 60) { // <1 minute
                return _("just now");
            } else if (time_diff < 3600) { // <1 hour
                const m = Math.floor(time_diff / 60);
                return ngettext("%d minute ago", "%d minutes ago", m).format(m);
            } else {
                const h = Math.floor(time_diff / 3600);
                return ngettext("%d hour ago", "%d hours ago", h).format(h);
            }
        } else { // before today
            if (days_diff === 1) {
                return _("yesterday");
            } else if (days_diff < 7) {
                return ngettext("%d day ago", "%d days ago", days_diff).format(days_diff);
            } else if (days_diff < 30) {
                const w = Math.ceil(days_diff / 7);
                return ngettext("%d week ago", "%d weeks ago", w).format(w);
            } else {
                return aDatetime.toLocaleDateString();
            }
        }
    }
};

var AccountMenu = class AccountMenu extends PopupMenu.PopupSubMenuMenuItem {
    constructor(aAccount, aOrientation) {
        super(aAccount, false);
        this._orientation = aOrientation; // needed for sorting
        this.label.style_class = "mailnag-account-label";
        this.menuItems = {};
    }

    add(aMailMenuItem) {
        if (this._orientation === St.Side.TOP) {
            this.menu.addMenuItem(aMailMenuItem, 0); // add to top of menu
        } else {
            this.menu.addMenuItem(aMailMenuItem); // add to bottom of menu
        }

        this.menuItems[aMailMenuItem.id] = aMailMenuItem;
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

Debugger.wrapObjectMethods({
    AccountMenu: AccountMenu,
    MailItem: MailItem
});

/* exported ellipsize
 */
