const Applet = imports.ui.applet;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const MessageTray = imports.ui.messageTray;
const PopupMenu = imports.ui.popupMenu;
const Settings = imports.ui.settings;
const St = imports.gi.St;
const Util = imports.misc.util;

const dbus_name = "mailnag.MailnagService";
const dbus_path = "/mailnag/MailnagService";
// const dbus_interface = "mailnag.MailnagService";

const dbus_xml = "<node name=\"/mailnag/MailnagService\"> \
  <interface name=\"mailnag.MailnagService\"> \
    <signal name=\"MailsRemoved\"> \
      <arg type=\"aa{sv}\" name=\"remaining_mails\" /> \
    </signal> \
    <signal name=\"MailsAdded\"> \
      <arg type=\"aa{sv}\" name=\"new_mails\" /> \
      <arg type=\"aa{sv}\" name=\"all_mails\" /> \
    </signal> \
    <method name=\"GetMailCount\"> \
      <arg direction=\"out\" type=\"u\" /> \
    </method> \
    <method name=\"MarkMailAsRead\"> \
      <arg direction=\"in\"  type=\"s\" name=\"mail_id\" /> \
    </method> \
    <method name=\"Shutdown\"> \
    </method> \
    <method name=\"GetMails\"> \
      <arg direction=\"out\" type=\"aa{sv}\" /> \
    </method> \
    <method name=\"CheckForMails\"> \
    </method> \
  </interface> \
</node>";

const MailnagProxy = Gio.DBusProxy.makeProxyWrapper(dbus_xml);

// if have more than this many, show "Mark All Read" button
const SHOW_MARK_ALL_COUNT = 3;

// function dump(x) {
//     if (typeof x === "object" && x !== null) {
//         global.log(JSON.stringify(x));
//     } else {
//         global.log(String(x));
//     }
// }

function _(aStr) {
    return aStr;
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

        if (days_diff === 0) // today
        {
            if (time_diff < 60) // <1 minute
            {
                return "just now";
            } else if (time_diff < 120) // <2 minute
            {
                return "1 minute ago";
            } else if (time_diff < 60 * 60) // <1 hour
            {
                return Math.floor(time_diff / 60) + " minutes ago";
            } else if (time_diff < 2 * 60 * 60) // <2 hours
            {
                return "1 hour ago";
            } else {
                return Math.floor(time_diff / 60 * 60) + " hours ago";
            }
        } else // before today
        {
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

function MailnagAppletForkByOdyseusApplet() {
    this._init.apply(this, arguments);
}

MailnagAppletForkByOdyseusApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(metadata, orientation, panel_height, instance_id) {
        Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

        this._orientation = orientation;

        try {
            // init settings
            this.settings = new Settings.AppletSettings(this, metadata["uuid"], instance_id);
            this.settings.bindProperty(Settings.BindingDirection.IN,
                "notifications", "notifications_enabled",
                function() {});
            this.settings.bindProperty(Settings.BindingDirection.IN,
                "launch_client_on_click", "launch_client_on_click",
                function() {});
            this.settings.bindProperty(Settings.BindingDirection.IN,
                "client", "client",
                function() {});
            this.settings.bindProperty(Settings.BindingDirection.IN,
                "middle_click", "middle_click_behavior",
                function() {});

            this._applet_context_menu.addCommandlineAction(
                "Configure Mailnag", "mailnag-config");
        } catch (aErr) {
            global.logError(aErr);
        }

        Mainloop.idle_add(() => {
            try {
                this.set_applet_icon_symbolic_name("mail-read");
                this.set_applet_tooltip("?");
                this.set_applet_label("?");

                this.menuItems = {};
                this.accountMenus = {};
                this._onMailsAddedId = 0;
                this._onMailsRemovedId = 0;
                this.busWatcherId = 0;

                this.menuManager = new PopupMenu.PopupMenuManager(this);
                this.menu = new Applet.AppletPopupMenu(this, orientation);
                this.menuManager.addMenu(this.menu);

                this.mailnagWasRunning = false;

                this._notificationSource = new NotificationSource();
                if (Main.messageTray) {
                    Main.messageTray.add(this._notificationSource);
                }

                // watch bus
                this.busWatcherId = Gio.bus_watch_name(
                    Gio.BusType.SESSION, dbus_name, Gio.BusNameOwnerFlags.NONE,
                    Lang.bind(this, this.onBusAppeared), Lang.bind(this, this.onBusVanished));
            } catch (aErr) {
                global.logError(aErr);
            }
        });
    },

    // called on applet startup (even though mailnag bus already exists)
    onBusAppeared: function() {
        try {
            let bus = Gio.bus_get_sync(Gio.BusType.SESSION, null);
            this.mailnag = new MailnagProxy(bus, dbus_name, dbus_path);

            // connect mailnag signals
            this._onMailsAddedId = this.mailnag.connectSignal(
                "MailsAdded", Lang.bind(this, this.onMailsAdded));
            this._onMailsRemovedId = this.mailnag.connectSignal(
                "MailsRemoved", Lang.bind(this, this.onMailsRemoved));

            this.loadMails();

            this.mailnagWasRunning = true;
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    onBusVanished: function() {
        // disconnect signals
        if (this._onMailsAddedId > 0) {
            this.mailnag.disconnectSignal(this._onMailsAddedId);
            this.mailnag.disconnectSignal(this._onMailsRemovedId);
            this._onMailsAddedId = 0;
            this._onMailsRemovedId = 0;
            delete this.mailnag;
        }

        // TODO: delete any notifications currently alive

        if (this.mailnagWasRunning) {
            this.showError("Mailnag daemon stopped working!");
        } else {
            this.showError("Mailnag daemon isn't running! Do you have it installed?");
        }
    },

    loadMails: function() {
        this.menu.removeAll();
        this.menuItems = {};
        this.accountMenus = {};

        try {
            let mails = this.getMails();

            if (mails.length > 0) {
                this.removeNoUnread();

                mails = this.sortMails(mails);

                if (mails.length > SHOW_MARK_ALL_COUNT) {
                    this.showMarkAllRead();
                }

                let i = 0,
                    iLen = mails.length;

                for (; i < iLen; i++) {
                    let mi = this.makeMenuItem(mails[i]);
                    this.addMailMenuItem(mi);
                }

                // for each(let mail in mails) {
                //     global.logError(typeof mail);
                //     let mi = this.makeMenuItem(mail);
                //     this.addMailMenuItem(mi);
                // }
            } else {
                this.showNoUnread();
            }
            this.showMailCount();
        } catch (aErr) {
            // TODO: show error messsage in menu
            global.logError(aErr);
        }
    },

    getMails: function() {
        try {
            let mails = this.mailnag.GetMailsSync();
            return this.fromDbusMailList(mails);
        } catch (aErr) {
            // TODO: show error messsage in menu
            global.logError(aErr);
        }

        return [];
    },

    // converts the mail list returned from dbus to a list of dictionaries
    fromDbusMailList: function(dbusList) {
        let mails = dbusList[0];
        let r = [];

        let i = 0,
            iLen = mails.length;

        for (; i < iLen; i++) {
            let mail = mails[i];
            let [sender, size1] = mail["sender_name"].get_string(); // jshint ignore:line
            let [sender_address, size2] = mail["sender_addr"].get_string(); // jshint ignore:line
            let [subject, size3] = mail["subject"].get_string(); // jshint ignore:line
            let [mail_id, size4] = mail["id"].get_string(); // jshint ignore:line
            let datetime = new Date(mail["datetime"].get_int32() * 1000); // sec to ms
            let account = "";

            try {
                let [accountx, size5] = mail["account_name"].get_string(); // jshint ignore:line
                account = accountx;

                // make mail id unique in case same mail appears in multiple accounts (in case of mail forwarding)
                mail_id += "_" + account;
            } catch (e) {
                // ignored
            }

            r.push({
                id: mail_id,
                sender: sender,
                datetime: datetime,
                sender_address: sender_address,
                subject: subject,
                account: account
            });
        }

        // for each(let mail in mails) {
        //     let [sender, size1] = mail['sender_name'].get_string(); // jshint ignore:line
        //     let [sender_address, size2] = mail['sender_addr'].get_string(); // jshint ignore:line
        //     let [subject, size3] = mail['subject'].get_string(); // jshint ignore:line
        //     let [mail_id, size4] = mail['id'].get_string(); // jshint ignore:line
        //     let datetime = new Date(mail['datetime'].get_int32() * 1000); // sec to ms
        //     let account = "";
        //     try {
        //         let [accountx, size5] = mail['account_name'].get_string(); // jshint ignore:line
        //         account = accountx;

        //         // make mail id unique in case same mail appears in multiple accounts (in case of mail forwarding)
        //         mail_id += "_" + account;
        //     } catch (e) {
        //         // ignored
        //     }

        //     r.push({
        //         id: mail_id,
        //         sender: sender,
        //         datetime: datetime,
        //         sender_address: sender_address,
        //         subject: subject,
        //         account: account
        //     });
        // }
        return r;
    },

    sortMails: function(mails) {
        // ascending order
        mails.sort(function(m1, m2) {
            return m1.datetime - m2.datetime;
        });
        return mails;
    },

    onMailsAdded: function(source, t, newMails) {
        try {
            this.removeNoUnread();

            newMails = this.fromDbusMailList(newMails);
            newMails = this.sortMails(newMails);

            if (this.currentMailCount() + newMails.length > SHOW_MARK_ALL_COUNT) {
                this.showMarkAllRead();
            }

            let i = 0,
                iLen = newMails.length;

            for (; i < iLen; i++) {
                let mi = this.makeMenuItem(newMails[i]);
                this.addMailMenuItem(mi);
            }

            // for each(let mail in newMails) {
            //     let mi = this.makeMenuItem(mail);
            //     this.addMailMenuItem(mi);
            // }
            this.notify(newMails);
            this.showMailCount();

            if (this.currentMailCount() > SHOW_MARK_ALL_COUNT) {
                this.showMarkAllRead();
            }
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    onMailsRemoved: function(source, t, remainingMails) {
        try {
            remainingMails = this.fromDbusMailList(remainingMails);

            // make a list of remaining ids
            let ids = [];
            let i = 0,
                iLen = remainingMails.length;
            let j = 0,
                jLen = this.menuItems.length;

            for (; i < iLen; i++) {
                ids.push(remainingMails[i].id);
            }

            // remove menu item if its id isn't in the list
            for (; j < jLen; j++) {
                let mi = this.menuItems[j];

                if (ids.indexOf(mi.id) < 0) {
                    this.removeMailMenuItem(mi.id);
                }
            }

            // for each(let mail in remainingMails) {
            //     ids.push(mail.id);
            // }

            // remove menu item if its id isn't in the list
            // for each(let mi in this.menuItems) {
            //     if (ids.indexOf(mi.id) < 0) {
            //         this.removeMailMenuItem(mi.id);
            //     }
            // }
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    makeMenuItem: function(mail) {
        let mi = new MailItem(mail.id, mail.sender, mail.sender_address, mail.subject, mail.datetime, mail.account);
        mi.markReadButton.connect(
            "clicked",
            Lang.bind(this, function() {
                this.markMailRead(mail.id);
            }));
        mi.connect("activate", Lang.bind(this, this.launchClient));
        this.menuItems[mail.id] = mi;
        return mi;
    },

    makeAccountMenu: function(account) {
        let accmenu = new AccountMenu(account, this._orientation);
        this.accountMenus[account] = accmenu;

        if (this._orientation == St.Side.TOP) {
            this.menu.addMenuItem(accmenu, 0);
        } else {
            this.menu.addMenuItem(accmenu);
        }

        return accmenu;
    },

    // Adds a MailItem to the menu. If `account` is defined it's added
    // to its 'account menu'. An 'account menu' is created if it
    // doesn't exist.
    addMailMenuItem: function(mailItem) {
        if (mailItem.account) {
            let accmenu;
            if (mailItem.account in this.accountMenus) {
                accmenu = this.accountMenus[mailItem.account];
            } else {
                accmenu = this.makeAccountMenu(mailItem.account);
            }
            accmenu.add(mailItem);
        } else {
            if (this._orientation == St.Side.TOP) {
                this.menu.addMenuItem(mailItem, 0); // add to top of menu
            } else {
                this.menu.addMenuItem(mailItem); // add to bottom of menu
            }
        }
    },

    notify: function(mails) {
        try {
            if (!this.notifications_enabled) {
                return;
            }

            let ntfTitle = "";
            let ntfBody = "";
            let markButtonLabel = "";
            if (mails.length > 1) {
                ntfTitle = _("You have %d new mails!").format(mails.length);
                markButtonLabel = _("Mark All Read");

                let i = 0,
                    iLen = mails.length;

                for (; i < iLen; i++) {
                    ntfBody += mails[i].subject + "\n";
                }

                // for each(let mail in mails) {
                //     ntfBody += mail.subject + "\n";
                // }
            } else {
                ntfTitle = _("You have new mail!");
                ntfBody = mails[0].subject;
                markButtonLabel = _("Mark Read");
            }
            let notification = new MessageTray.Notification(
                this._notificationSource,
                "Mailnag", ntfTitle, {
                    body: ntfBody
                }
            );
            notification.setTransient(true);
            notification.addButton("mark-read", markButtonLabel);
            notification.connect("action-invoked", Lang.bind(this, function(source, action) {
                if (action == "mark-read") {
                    this.markMailsRead(mails);
                    source.destroy();
                }
            }));
            this._notificationSource.notify(notification);
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    showMarkAllRead: function() {
        try {
            if (typeof this._markAllRead === "object") {
                this.removeMarkAllRead();
            }

            this._markAllRead = new PopupMenu.PopupMenuItem(_("Mark All Read"));
            this._separator = new PopupMenu.PopupSeparatorMenuItem();

            this._markAllRead.connect("activate", Lang.bind(this, this.markAllRead));

            if (this._orientation == St.Side.TOP) {
                this.menu.addMenuItem(this._separator);
                this.menu.addMenuItem(this._markAllRead);
            } else {
                this.menu.addMenuItem(this._markAllRead, 0);
                this.menu.addMenuItem(this._separator, 1);
            }
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    removeMarkAllRead: function() {
        try {
            if (typeof this._markAllRead === "object") {
                this._markAllRead.destroy();
                this._separator.destroy();
                delete this._markAllRead;
                delete this._separator;
            }
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    // removes all items from menu and adds a message
    showNoUnread: function() {
        try {
            this.menu.removeAll();
            this.accountMenus = {};
            this.menuItems = {};
            this._noUnreadItem = this.menu.addAction(_("No unread mails."));
            this.set_applet_icon_symbolic_name("mail-read");
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    // makes sure "no unread mail" is not shown
    removeNoUnread: function() {
        try {
            if (typeof this._noUnreadItem === "object") {
                this._noUnreadItem.destroy();
                delete this._noUnreadItem;
            }
            this.set_applet_icon_symbolic_name("mail-unread");
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    currentMailCount: function() {
        return Object.keys(this.menuItems).length;
    },

    showMailCount: function() {
        // display '?' if mailnag proxy is not present
        if (typeof this.mailnag !== "object") {
            this.set_applet_label("?");
            this.set_applet_tooltip(_("Mailnag daemon is not running!"));
        } else {
            let num = Object.keys(this.menuItems).length;
            this.set_applet_label(num.toString());
            if (num > 0) {
                if (num == 1) {
                    let s = "";

                    for (let mi in this.menuItems) {
                        if (this.menuItems.hasOwnProperty(mi)) {
                            s = _("You have a mail from %s!").format(this.menuItems[mi].sender);
                        }
                    }

                    // for each(let m in this.menuItems) { // actually there is only 1 item
                    //     s = _("You have a mail from %s!").format(m.sender);
                    // }
                    this.set_applet_tooltip(s);
                } else {
                    this.set_applet_tooltip(_("You have %d unread mails!").format(num));
                }
            } else {
                this.set_applet_tooltip(_("No unread mails."));
            }
        }
    },

    showError: function(message) {
        global.logError("MailnagApplet ERROR: " + message);

        this.menu.removeAll();
        this.set_applet_label("!!");
        this.set_applet_tooltip(_("Click to see error!"));
        this.menu.addAction(_("Error: " + message));
        this.set_applet_icon_symbolic_name("mail-unread");
    },

    markMailRead: function(id) {
        try {
            // remove account name from mail id
            let actual_id = id.slice(0, id.indexOf("_"));

            // tell mailnag
            this.mailnag.MarkMailAsReadSync(actual_id);

            this.removeMailMenuItem(id);
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    removeMailMenuItem: function(id) {
        // switch the focus to `menu` from `menuItem` to prevent menu from closing
        this.menu.actor.grab_key_focus();

        // update account menu if there is one
        let account = this.menuItems[id].account;
        if (account) {
            let accountMenu = this.accountMenus[account];
            delete accountMenu.menuItems[id];
            if (Object.keys(accountMenu.menuItems).length === 0) {
                // remove account menu as well
                accountMenu.destroy();
                delete this.accountMenus[account];
            }
        }

        // remove menu item
        this.menuItems[id].destroy();
        delete this.menuItems[id];

        // handle other visual updates
        if (Object.keys(this.menuItems).length === 0) {
            this.showNoUnread();
            this.menu.close();
        }
        this.showMailCount();

        if (this.currentMailCount() <= SHOW_MARK_ALL_COUNT) {
            this.removeMarkAllRead();
        }

        // TODO: destroy the notification as well if any
    },

    // marks a list of mails as read
    markMailsRead: function(mails) {
        try {
            let i = 0,
                iLen = mails.length;

            for (; i < iLen; i++) {
                this.markMailRead(mails[i].id);
            }

            // for each(let mail in mails) {
            //     this.markMailRead(mail.id);
            // }
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    // mark all currently displayed mail as read
    markAllRead: function() {
        try {
            for (let mi in this.menuItems) {
                if (this.menuItems.hasOwnProperty(mi)) {
                    this.markMailRead(this.menuItems[mi].id);
                }
            }

            // for (; i < iLen; i++) {
            //     global.logError(this.menuItems[i].id);
            //     this.markMailRead(this.menuItems[i].id);
            // }
        } catch (aErr) {
            global.logError(aErr);
        }
        // for each(let m in this.menuItems) {
        //     this.markMailRead(m.id);
        // }
    },

    launchClient: function() {
        if (!this.launch_client_on_click) {
            return;
        }

        if (this.client.startsWith("http")) // client is a web page
        {
            Util.spawnCommandLine("xdg-open " + this.client);
        } else // client is a command
        {
            Util.spawnCommandLine(this.client);
        }
        this.menu.close();
    },

    on_applet_clicked: function(event) { // jshint ignore:line
        if (!this.menu.isOpen) {
            // for each(let accmenu in this.accountMenus) {
            //     accmenu.menu.open();
            // }

            let i = 0,
                iLen = this.menuItems.length;

            for (; i < iLen; i++) {
                this.menuItems[i].updateTimeDisplay();
            }

            // for each(let mi in this.menuItems) {
            //     mi.updateTimeDisplay();
            // }
        }
        this.menu.toggle();
    },

    _onButtonPressEvent: function(actor, event) {
        if (event.get_button() == 2) { // 2: middle button
            switch (this.middle_click_behavior) {
                case "mark_read":
                    this.markAllRead();
                    break;
                case "launch_client":
                    this.launchClient();
                    break;
                default:
                    // do nothing
                    break;
            }
        }
        return Applet.Applet.prototype._onButtonPressEvent.call(this, actor, event);
    },

    on_orientation_changed: function(orientation) {
        this._orientation = orientation;
        try {
            this.loadMails();
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    on_applet_removed_from_panel: function() {
        // TODO: remove all notifications
        if (this._onMailsAddedId > 0) {
            this.mailnag.disconnectSignal(this._onMailsAddedId);
            this._onMailsAddedId = 0;
        }

        if (this._onMailsRemovedId > 0) {
            this.mailnag.disconnectSignal(this._onMailsRemovedId);
            this._onMailsRemovedId = 0;
        }

        if (this.busWatcherId > 0) {
            Gio.bus_unwatch_name(this.busWatcherId);
            this.busWatcherId = 0;
        }
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MailnagAppletForkByOdyseusApplet(metadata, orientation, panel_height, instance_id);
}
