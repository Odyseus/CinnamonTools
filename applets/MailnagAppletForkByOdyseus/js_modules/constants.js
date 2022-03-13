const {
    gi: {
        Gio
    }
} = imports;

var APPLET_PREFS = [
    "toggle_menu_keybinding",
    "notification_mode",
    "notification_custom_template",
    "notification_max_mails",
    "notification_sender_max_chars",
    "notification_subject_max_chars",
    "launch_client_on_click",
    "client",
    "middle_click_behavior",
    "keep_one_menu_open",
    "logging_level",
    "debugger_enabled",
    "third_party_integration_panel_drawer"
];

const dbus_xml = `<node name="/mailnag/MailnagService">
    <interface name="mailnag.MailnagService">
        <signal name="MailsRemoved">
            <arg type="aa{sv}" name="remaining_mails" />
        </signal>
        <signal name="MailsAdded">
            <arg type="aa{sv}" name="new_mails" />
            <arg type="aa{sv}" name="all_mails" />
        </signal>
        <method name="GetMailCount">
            <arg direction="out" type="u" />
        </method>
        <method name="MarkMailAsRead">
            <arg direction="in"  type="s" name="mail_id" />
        </method>
        <method name="Shutdown">
        </method>
        <method name="GetMails">
            <arg direction="out" type="aa{sv}" />
        </method>
        <method name="CheckForMails">
        </method>
    </interface>
</node>`;

var MailnagProxy = Gio.DBusProxy.makeProxyWrapper(dbus_xml);
var DBUS_NAME = "mailnag.MailnagService";
var DBUS_PATH = "/mailnag/MailnagService";
var NotificationMode = {
    DISABLED: 0,
    SUMMARY_EXPANDED: 1,
    SUMMARY_COMPACT: 2,
    SUMMARY_COMPRESSED: 3,
    SUMMARY_CUSTOM: 4
};
var MailItemParams = Object.freeze({
    id: "",
    sender: "",
    sender_address: "",
    subject: "",
    datetime: "",
    account: ""
});

/* exported MailnagProxy,
            DBUS_NAME,
            DBUS_PATH,
            NotificationMode,
            MailItemParams,
            APPLET_PREFS
*/
