let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta["{{UUID}}"];
}

const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const MessageTray = imports.ui.messageTray;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;

Gettext.bindtextdomain(XletMeta.uuid, GLib.get_home_dir() + "/.local/share/locale");

/**
 * Return the localized translation of a string, based on the xlet domain or
 * the current global domain (Cinnamon's).
 *
 * This function "overrides" the _() function globally defined by Cinnamon.
 *
 * @param {String} aStr - The string being translated.
 *
 * @return {String} The translated string.
 */
function _(aStr) {
    let customTrans = Gettext.dgettext(XletMeta.uuid, aStr);

    if (customTrans !== aStr && aStr !== "") {
        return customTrans;
    }

    return Gettext.gettext(aStr);
}

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

        try {
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
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    activate: function(event, keepMenu) { // jshint ignore:line
        this.emit("activate", event, true); // keepMenu=True, prevents menu from closing
    },

    updateTimeDisplay: function() {
        this._datetime_label.text = this.formatDatetime(this.datetime);
    },

    // formats datetime relative to now
    formatDatetime: function(datetime) {
        let now = new Date();
        const sec_24h = 24 * 60 * 60; // 24h * 60 min * 60 sec
        let time_diff = (now.getTime() - datetime.getTime()) / 1e3;
        let days_diff = Math.floor(time_diff / sec_24h);

        if (days_diff === 0) { // today
            if (time_diff < 60) { // <1 minute
                return "just now";
            } else if (time_diff < 120) { // <2 minute
                return "1 minute ago";
            } else if (time_diff < 60 * 60) { // <1 hour
                return Math.floor(time_diff / 60) + " minutes ago";
            } else if (time_diff < 2 * 60 * 60) { // <2 hours
                return "1 hour ago";
            } else {
                return Math.floor(time_diff / 60 * 60) + " hours ago";
            }
        } else { // before today
            if (days_diff == 1) {
                return "yesterday";
            } else if (days_diff < 7) {
                return days_diff + " days ago";
            } else if (days_diff < 30) {
                return Math.ceil(days_diff / 7) + " weeks ago";
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
        if (this._orientation == St.Side.TOP) {
            this.menu.addMenuItem(mailMenuItem, 0); // add to top of menu
        } else {
            this.menu.addMenuItem(mailMenuItem); // add to bottom of menu
        }

        this.menuItems[mailMenuItem.id] = mailMenuItem;
    }
};

function NotificationSource() {
    this._init.apply(this, arguments);
}

NotificationSource.prototype = {
    __proto__: MessageTray.Source.prototype,
    _init: function() {
        MessageTray.Source.prototype._init.call(this, "Mailnag");
        this._setSummaryIcon(this.createNotificationIcon());
    },

    createNotificationIcon: function() {
        return new St.Icon({
            icon_name: "mail-unread",
            icon_size: this.ICON_SIZE
        });
    }
};

/*
exported _
 */
