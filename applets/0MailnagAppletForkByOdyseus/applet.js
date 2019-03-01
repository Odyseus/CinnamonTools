let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
}

const _ = $._;
const ngettext = $.ngettext;

const {
    gi: {
        Gio,
        St
    },
    mainloop: Mainloop,
    misc: {
        util: Util
    },
    ui: {
        applet: Applet,
        main: Main,
        messageTray: MessageTray,
        popupMenu: PopupMenu,
        settings: Settings
    }
} = imports;

const dbus_name = "mailnag.MailnagService";
const dbus_path = "/mailnag/MailnagService";

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

const MailnagProxy = Gio.DBusProxy.makeProxyWrapper(dbus_xml);

function MailnagAppletForkByOdyseusApplet() {
    this._init.apply(this, arguments);
}

MailnagAppletForkByOdyseusApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(aMetadata, aOrientation, aPanel_height, aInstance_id) {
        Applet.TextIconApplet.prototype._init.call(this, aOrientation, aPanel_height, aInstance_id);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.metadata = aMetadata;
        this.orientation = aOrientation;
        this.instance_id = aInstance_id;

        this._initializeSettings(() => {
            this._applet_context_menu.addCommandlineAction(
                _("Configure Mailnag"), "mailnag-config");
        }, () => {
            this.set_applet_icon_symbolic_name("mail-read");
            this.set_applet_tooltip("?");
            this.set_applet_label("?");

            this.menuItems = {};
            this.accountMenus = {};
            this._onMailsAddedId = 0;
            this._onMailsRemovedId = 0;
            this.busWatcherId = 0;

            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menu = new Applet.AppletPopupMenu(this, this.orientation);
            this.menuManager.addMenu(this.menu);

            this.mailnagWasRunning = false;
            this.mailnag = null;

            this._notificationSource = new $.NotificationSource();
            if (Main.messageTray) {
                Main.messageTray.add(this._notificationSource);
            }

            // watch bus
            this.busWatcherId = Gio.bus_watch_name(
                Gio.BusType.SESSION, dbus_name, Gio.BusNameOwnerFlags.NONE,
                () => this.onBusAppeared(), () => this.onBusVanished());
        });
    },

    _initializeSettings: function(aDirectCallback, aIdleCallback) {
        this.settings = new Settings.AppletSettings(
            this,
            this.metadata.uuid,
            this.instance_id,
            true // Asynchronous settings initialization.
        );

        let callback = () => {
            try {
                this._bindSettings();
                aDirectCallback();
            } catch (aErr) {
                global.logError(aErr);
            }

            Mainloop.idle_add(() => {
                try {
                    aIdleCallback();
                } catch (aErr) {
                    global.logError(aErr);
                }
            });
        };

        // Needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 4.2.x+
        // Always use promise. Declare content of callback variable
        // directly inside the promise callback.
        switch (this.settings.hasOwnProperty("promise")) {
            case true:
                this.settings.promise.then(() => callback());
                break;
            case false:
                callback();
                break;
        }
    },

    _bindSettings: function() {
        // Needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        let bD = {
            IN: 1,
            OUT: 2,
            BIDIRECTIONAL: 3
        };
        let prefKeysArray = [
            "pref_notifications_enabled",
            "pref_launch_client_on_click",
            "pref_client",
            "pref_middle_click_behavior",
            "pref_keep_one_menu_open"
        ];
        let newBinding = typeof this.settings.bind === "function";
        for (let pref_key of prefKeysArray) {
            // Condition needed for retro-compatibility.
            // Mark for deletion on EOL. Cinnamon 3.2.x+
            // Abandon this.settings.bindProperty and keep this.settings.bind.
            if (newBinding) {
                this.settings.bind(pref_key, pref_key, this._onSettingsChanged, pref_key);
            } else {
                this.settings.bindProperty(bD.BIDIRECTIONAL, pref_key, pref_key, this._onSettingsChanged, pref_key);
            }
        }
    },

    // called on applet startup (even though mailnag bus already exists)
    onBusAppeared: function() {
        let bus = Gio.bus_get_sync(Gio.BusType.SESSION, null);
        this.mailnag = new MailnagProxy(bus, dbus_name, dbus_path);

        // connect mailnag signals
        this._onMailsAddedId = this.mailnag.connectSignal("MailsAdded",
            (source, t, newMails) => this.onMailsAdded(source, t, newMails));
        this._onMailsRemovedId = this.mailnag.connectSignal("MailsRemoved",
            (source, t, remainingMails) => this.onMailsRemoved(source, t, remainingMails));

        this.loadMails();

        this.mailnagWasRunning = true;
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
            this.showError(_("Mailnag daemon stopped working!"));
        } else {
            this.showError(_("Mailnag daemon isn't running! Do you have it installed?"));
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

                if (mails.length > 0) {
                    this.showMarkAllRead();
                }

                let i = 0,
                    iLen = mails.length;

                for (; i < iLen; i++) {
                    let mi = this.makeMenuItem(mails[i]);
                    this.addMailMenuItem(mi);
                }
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

        return r;
    },

    sortMails: function(mails) {
        // ascending order
        mails.sort((m1, m2) => {
            return m1.datetime - m2.datetime;
        });
        return mails;
    },

    onMailsAdded: function(source, t, newMails) {
        this.removeNoUnread();

        newMails = this.fromDbusMailList(newMails);
        newMails = this.sortMails(newMails);

        if (this.currentMailCount() + newMails.length > 0) {
            this.showMarkAllRead();
        }

        let i = 0,
            iLen = newMails.length;

        for (; i < iLen; i++) {
            let mi = this.makeMenuItem(newMails[i]);
            this.addMailMenuItem(mi);
        }

        this.notify(newMails);
        this.showMailCount();

        if (this.currentMailCount() > 0) {
            this.showMarkAllRead();
        }
    },

    onMailsRemoved: function(source, t, remainingMails) {
        remainingMails = this.fromDbusMailList(remainingMails);

        // make a list of remaining ids
        let ids = new Set();
        let i = 0,
            iLen = remainingMails.length;

        for (; i < iLen; i++) {
            ids.add(remainingMails[i].id);
        }

        // remove menu item if its id isn't in the list
        for (let id in this.menuItems) {
            if (this.menuItems.hasOwnProperty(id) &&
                !ids.has(id)) {
                this.removeMailMenuItem(id);
            }
        }
    },

    makeMenuItem: function(mail) {
        let mi = new $.MailItem(mail.id, mail.sender, mail.sender_address, mail.subject, mail.datetime, mail.account);
        mi.markReadButton.connect("clicked",
            () => this.markMailRead(mail.id));
        mi.connect("activate", () => this.launchClient());
        this.menuItems[mail.id] = mi;

        return mi;
    },

    makeAccountMenu: function(account) {
        let accmenu = new $.AccountMenu(account, this.orientation);
        accmenu.menu.connect("open-state-changed",
            (aMenu, aOpen) => this._subMenuOpenStateChanged(aMenu, aOpen));

        this.accountMenus[account] = accmenu;

        if (this.orientation === St.Side.TOP) {
            this.menu.addMenuItem(accmenu, 0);
        } else {
            this.menu.addMenuItem(accmenu);
        }

        return accmenu;
    },

    _subMenuOpenStateChanged: function(aMenu, aOpen) {
        if (aOpen && this.pref_keep_one_menu_open) {
            let children = aMenu._getTopMenu()._getMenuItems();

            for (let i = children.length - 1; i >= 0; i--) {
                let item = children[i];

                if (item instanceof PopupMenu.PopupSubMenuMenuItem ||
                    item instanceof $.AccountMenu) {
                    if (aMenu !== item.menu) {
                        item.menu.close(true);
                    }
                }
            }
        }
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
            if (this.orientation === St.Side.TOP) {
                this.menu.addMenuItem(mailItem, 0); // add to top of menu
            } else {
                this.menu.addMenuItem(mailItem); // add to bottom of menu
            }
        }
    },

    notify: function(mails) {
        if (!this.pref_notifications_enabled) {
            return;
        }

        let ntfTitle = "";
        let ntfBody = "";
        let markButtonLabel = "";

        if (mails.length > 1) {
            ntfTitle = ngettext("You have %d new mail!", "You have %d new mails!", mails.length)
                .format(mails.length);
            markButtonLabel = _("Mark All Read");

            let i = 0,
                iLen = mails.length;

            for (; i < iLen; i++) {
                ntfBody += mails[i].subject + "\n";
            }
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
        notification.connect("action-invoked", (source, action) => {
            if (action === "mark-read") {
                this.markMailsRead(mails);
                source.destroy();
            }
        });
        this._notificationSource.notify(notification);
    },

    showMarkAllRead: function() {
        this.removeMarkAllRead();

        this._markAllRead = new PopupMenu.PopupMenuItem(_("Mark All Read"));
        this._separator = new PopupMenu.PopupSeparatorMenuItem();

        this._markAllRead.connect("activate", () => this.markAllRead());

        if (this.orientation === St.Side.TOP) {
            this.menu.addMenuItem(this._separator);
            this.menu.addMenuItem(this._markAllRead);
        } else {
            this.menu.addMenuItem(this._markAllRead, 0);
            this.menu.addMenuItem(this._separator, 1);
        }
    },

    removeMarkAllRead: function() {
        if (this.hasOwnProperty("_markAllRead") &&
            this._markAllRead instanceof PopupMenu.PopupMenuItem) {
            this._markAllRead.destroy();
            delete this._markAllRead;
        }

        if (this.hasOwnProperty("_separator") &&
            this._separator instanceof PopupMenu.PopupSeparatorMenuItem) {
            this._separator.destroy();
            delete this._separator;
        }
    },

    // removes all items from menu and adds a message
    showNoUnread: function() {
        this.menu.removeAll();
        this.accountMenus = {};
        this.menuItems = {};
        this._noUnreadItem = this.menu.addAction(_("No unread mails."));
        this.set_applet_icon_symbolic_name("mail-read");
    },

    // makes sure "no unread mail" is not shown
    removeNoUnread: function() {
        if (this.hasOwnProperty("_noUnreadItem") &&
            this._noUnreadItem instanceof PopupMenu.PopupMenuItem) {
            this._noUnreadItem.destroy();
            delete this._noUnreadItem;
        }

        this.set_applet_icon_symbolic_name("mail-unread");
    },

    currentMailCount: function() {
        return Object.keys(this.menuItems).length;
    },

    showMailCount: function() {
        // display '?' if mailnag proxy is not present
        if (!this.mailnag || typeof this.mailnag !== "object") {
            this.set_applet_label("?");
            this.set_applet_tooltip(_("Mailnag daemon is not running!"));
        } else {
            let num = Object.keys(this.menuItems).length;
            this.set_applet_label(num.toString());
            if (num > 0) {
                if (num === 1) {
                    let s = "";

                    for (let id in this.menuItems) {
                        if (this.menuItems.hasOwnProperty(id)) {
                            s = _("You have a mail from %s!").format(this.menuItems[id].sender);
                        }
                    }

                    this.set_applet_tooltip(s);
                } else {
                    this.set_applet_tooltip(ngettext("You have %d unread mail!",
                        "You have %d unread mails!", num).format(num));
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
        this.menu.addAction("%s: ".format(_("Error")) + message);
        this.set_applet_icon_symbolic_name("mail-unread");
    },

    markMailRead: function(id) {
        // remove account name from mail id
        let actual_id = id.slice(0, id.indexOf("_"));

        // tell mailnag
        this.mailnag.MarkMailAsReadSync(actual_id);

        this.removeMailMenuItem(id);
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

        if (this.currentMailCount() === 0) {
            this.removeMarkAllRead();
        }

        // TODO: destroy the notification as well if any
    },

    // marks a list of mails as read
    markMailsRead: function(mails) {
        let i = 0,
            iLen = mails.length;

        for (; i < iLen; i++) {
            this.markMailRead(mails[i].id);
        }
    },

    // mark all currently displayed mail as read
    markAllRead: function() {
        for (let id in this.menuItems) {
            if (this.menuItems.hasOwnProperty(id)) {
                this.markMailRead(id);
            }
        }
    },

    launchClient: function() {
        if (!this.pref_launch_client_on_click) {
            return;
        }

        this.menu.close();

        if (this.pref_client.startsWith("http")) { // client is a web page
            Util.spawn_async("xdg-open " + this.pref_client, null);
        } else { // client is a command
            Util.spawn_async(this.pref_client, null);
        }
    },

    on_applet_clicked: function(event) { // jshint ignore:line
        if (!this.menu.isOpen) {
            for (let id in this.menuItems) {
                if (this.menuItems.hasOwnProperty(id)) {
                    this.menuItems[id].updateTimeDisplay();
                }
            }
        }

        this.menu.toggle();
    },

    _onButtonPressEvent: function(actor, event) {
        if (event.get_button() === 2) { // 2: middle button
            switch (this.pref_middle_click_behavior) {
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
        this.orientation = orientation;
        this.loadMails();
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

        if (this.settings) {
            this.settings.finalize();
        }
    },

    _onSettingsChanged: function(aPrefValue, aPrefKey) { // jshint ignore:line
        // Note: On Cinnamon versions greater than 3.2.x, two arguments are passed to the
        // settings callback instead of just one as in older versions. The first one is the
        // setting value and the second one is the user data. To workaround this nonsense,
        // check if the second argument is undefined to decide which
        // argument to use as the pref key depending on the Cinnamon version.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        // Remove the following variable and directly use the second argument.
        // let pref_key = aPrefKey || aPrefValue;
    }
};

function main(aMetadata, aOrientation, aPanel_height, aInstance_id) {
    return new MailnagAppletForkByOdyseusApplet(aMetadata, aOrientation, aPanel_height, aInstance_id);
}
