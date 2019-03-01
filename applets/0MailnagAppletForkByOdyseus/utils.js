let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta["{{UUID}}"];
}

const {
    gettext: Gettext,
    gi: {
        Gio,
        GLib,
        St
    },
    ui: {
        messageTray: MessageTray,
        popupMenu: PopupMenu
    }
} = imports;

const dbus_xml = '<node name="/mailnag/MailnagService">\
    <interface name="mailnag.MailnagService">\
        <signal name="MailsRemoved">\
            <arg type="aa{sv}" name="remaining_mails" />\
        </signal>\
        <signal name="MailsAdded">\
            <arg type="aa{sv}" name="new_mails" />\
            <arg type="aa{sv}" name="all_mails" />\
        </signal>\
        <method name="GetMailCount">\
            <arg direction="out" type="u" />\
        </method>\
        <method name="MarkMailAsRead">\
            <arg direction="in"  type="s" name="mail_id" />\
        </method>\
        <method name="Shutdown">\
        </method>\
        <method name="GetMails">\
            <arg direction="out" type="aa{sv}" />\
        </method>\
        <method name="CheckForMails">\
        </method>\
    </interface>\
</node>';

var MailnagProxy = Gio.DBusProxy.makeProxyWrapper(dbus_xml);
var DBUS_NAME = "mailnag.MailnagService";
var DBUS_PATH = "/mailnag/MailnagService";

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

/**
 * Return the localized translation of a string, based on the xlet domain or the
 * current global domain (Cinnamon's), but consider plural forms. If a translation
 * is found, apply the plural formula to aN, and return the resulting message
 * (some languages have more than two plural forms). If no translation is found,
 * return singular if aN is 1; return plural otherwise.
 *
 * This function "overrides" the ngettext() function globally defined by Cinnamon.
 *
 * @param {String}  aSingular - The singular string being translated.
 * @param {String}  aPlural   - The plural string being translated.
 * @param {Integer} aN        - The number (e.g. item count) to determine the translation for
 * the respective grammatical number.
 *
 * @return {String} The translated string.
 */
function ngettext(aSingular, aPlural, aN) {
    let customTrans = Gettext.dngettext(XletMeta.uuid, aSingular, aPlural, aN);

    if (aN === 1) {
        if (customTrans !== aSingular) {
            return customTrans;
        }
    } else {
        if (customTrans !== aPlural) {
            return customTrans;
        }
    }

    return Gettext.ngettext(aSingular, aPlural, aN);
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
                return ngettext("d% week ago", "%d weeks ago", w).format(w);
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

/* exported DBUS_NAME,
            DBUS_PATH,
            MailnagProxy
 */
