const {
    gi: {
        Clutter,
        Gio,
        St
    },
    misc: {
        util: Util
    },
    ui: {
        applet: Applet,
        main: Main,
        messageTray: MessageTray,
        popupMenu: PopupMenu
    }
} = imports;

const {
    UNICODE_SYMBOLS
} = require("js_modules/globalConstants.js");

const {
    _,
    ngettext,
    escapeHTML,
    tryFn,
    launchUri
} = require("js_modules/globalUtils.js");

const {
    APPLET_PREFS,
    DBUS_NAME,
    DBUS_PATH,
    MailnagProxy,
    NotificationMode
} = require("js_modules/constants.js");

const {
    CustomNotificationSource
} = require("js_modules/notificationsUtils.js");

const {
    AccountMenu,
    Debugger,
    ellipsize,
    MailItem
} = require("js_modules/utils.js");

const {
    getBaseAppletClass
} = require("js_modules/appletsUtils.js");

class Mailnag extends getBaseAppletClass(Applet.TextIconApplet) {
    constructor(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
        super({
            metadata: aMetadata,
            orientation: aOrientation,
            panel_height: aPanelHeight,
            instance_id: aInstanceID,
            init_signal_manager: false,
            pref_keys: APPLET_PREFS
        });

        this.menu_keybinding_name = this.$.metadata.uuid + "-" + this.$.instance_id;

        this.__initializeApplet(() => {
            this._expandAppletContextMenu();
        }, () => {
            this.set_applet_icon_symbolic_name("mail-read");
            this.set_applet_tooltip("?");
            this.set_applet_label("?");

            this.menuItems = {};
            this.accountMenus = {};
            this._onMailsAddedId = 0;
            this._onMailsRemovedId = 0;
            this.busWatcherId = 0;

            this.menu.connect("open-state-changed",
                (aMenu, aOpen) => this._onMenuOpenStateChanged(aMenu, aOpen));

            this.mailnagWasRunning = false;
            this.mailnag = null;

            this._notificationSource = null;
            this.notification = null;
            this._notiticationParams = {
                titleMarkup: true,
                bodyMarkup: true
            };

            this._updateKeybindings();

            // watch bus
            this.busWatcherId = Gio.bus_watch_name(
                Gio.BusType.SESSION, DBUS_NAME, Gio.BusNameOwnerFlags.NONE,
                () => this.onBusAppeared(), () => this.onBusVanished());
        });
    }

    _expandAppletContextMenu() {
        let menuItem = new PopupMenu.PopupIconMenuItem(
            _("Configure Mailnag daemon"),
            "system-run-symbolic",
            St.IconType.SYMBOLIC
        );
        menuItem.connect("activate", () => Util.spawn_async(["mailnag-config"], null));

        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Help"),
            "dialog-information",
            St.IconType.SYMBOLIC
        );
        menuItem.connect("activate", () => this.__openHelpPage());

        this._applet_context_menu.addMenuItem(menuItem);
    }

    // called on applet startup (even though mailnag bus already exists)
    onBusAppeared() {
        const bus = Gio.bus_get_sync(Gio.BusType.SESSION, null);
        this.mailnag = new MailnagProxy(bus, DBUS_NAME, DBUS_PATH);

        // connect mailnag signals
        this._onMailsAddedId = this.mailnag.connectSignal("MailsAdded",
            (source, t, newMails) => this.onMailsAdded(source, t, newMails));
        this._onMailsRemovedId = this.mailnag.connectSignal("MailsRemoved",
            (source, t, remainingMails) => this.onMailsRemoved(source, t, remainingMails));

        this.loadMails();

        this.mailnagWasRunning = true;
    }

    onBusVanished() {
        // disconnect signals
        if (this._onMailsAddedId > 0) {
            this.mailnag.disconnectSignal(this._onMailsAddedId);
            this.mailnag.disconnectSignal(this._onMailsRemovedId);
            this._onMailsAddedId = 0;
            this._onMailsRemovedId = 0;
            delete this.mailnag;
        }

        this._destroyNotification();

        if (this.mailnagWasRunning) {
            this.showError(_("Mailnag daemon stopped working!"));
        } else {
            this.showError(_("Mailnag daemon isn't running! Do you have it installed?"));
        }
    }

    loadMails() {
        this.menu.removeAll();
        this.menuItems = {};
        this.accountMenus = {};

        tryFn(() => {
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
                    const mi = this.makeMenuItem(mails[i]);
                    this.addMailMenuItem(mi);
                }
            } else {
                this.showNoUnread();
            }
            this.showMailCount();
            // TODO: show error message in menu
        }, (aErr) => global.logError(aErr));
    }

    getMails() {
        try {
            const mails = this.mailnag.GetMailsSync();
            return this.fromDbusMailList(mails).new;
        } catch (aErr) {
            // TODO: show error message in menu
            global.logError(aErr);
        }

        return [];
    }

    // converts the mail list returned from dbus to a list of dictionaries
    fromDbusMailList(aDBusList) {
        const mList = {
            new: [],
            all: []
        };

        for (let m in mList) {
            const idx = m === "new" ? 0 : 1;
            const mails = aDBusList[idx];
            const r = mList[m];

            if (!mails) {
                continue;
            }

            let i = 0,
                iLen = mails.length;

            for (; i < iLen; i++) {
                const mail = mails[i];
                const [sender, size1] = mail["sender_name"].get_string(); // jshint ignore:line
                const [sender_address, size2] = mail["sender_addr"].get_string(); // jshint ignore:line
                const [subject, size3] = mail["subject"].get_string(); // jshint ignore:line
                let [mail_id, size4] = mail["id"].get_string(); // jshint ignore:line
                const datetime = new Date(mail["datetime"].get_int32() * 1000); // sec to ms
                let account = "";

                tryFn(() => {
                    const [accountx, size5] = mail["account_name"].get_string(); // jshint ignore:line
                    account = accountx;

                    // make mail id unique in case same mail appears in multiple accounts (in case of mail forwarding)
                    mail_id += "_" + account;
                }, (aErr) => {}); // jshint ignore:line

                r.push({
                    id: mail_id,
                    sender: sender,
                    datetime: datetime,
                    sender_address: sender_address,
                    subject: subject,
                    account: account
                });
            }
        }

        return mList;
    }

    sortMails(aMails) {
        // ascending order
        aMails.sort((m1, m2) => {
            return m1.datetime - m2.datetime;
        });
        return aMails;
    }

    onMailsAdded(source, t, aDBusMailList) {
        this.removeNoUnread();

        const mails = this.fromDbusMailList(aDBusMailList);
        let newMails = mails.new;
        const allMails = mails.all;
        newMails = this.sortMails(newMails);

        if (this.currentMailCount() + newMails.length > 0) {
            this.showMarkAllRead();
        }

        let i = 0,
            iLen = newMails.length;

        for (; i < iLen; i++) {
            const mi = this.makeMenuItem(newMails[i]);
            this.addMailMenuItem(mi);
        }

        this.showMailCount();

        if (this.currentMailCount() > 0) {
            this.showMarkAllRead();
        }

        this.$.schedule_manager.idleCall("on_mails_added", function() {
            this.notify(newMails, allMails);

            if (iLen && this.$._.third_party_integration_panel_drawer) {
                this.actor.show();
            }
        }.bind(this));
    }

    onMailsRemoved(source, t, aRemainingMails) {
        aRemainingMails = this.fromDbusMailList(aRemainingMails).new;

        // make a list of remaining ids
        const ids = new Set();
        let i = 0,
            iLen = aRemainingMails.length;

        for (; i < iLen; i++) {
            ids.add(aRemainingMails[i].id);
        }

        // remove menu item if its id isn't in the list
        for (const id in this.menuItems) {
            if (this.menuItems.hasOwnProperty(id) &&
                !ids.has(id)) {
                this.removeMailMenuItem(id);
            }
        }
    }

    makeMenuItem(aMail) {
        const mi = new MailItem({
            id: aMail.id,
            sender: aMail.sender,
            sender_address: aMail.sender_address,
            subject: aMail.subject,
            datetime: aMail.datetime,
            account: aMail.account
        });
        mi.markReadButton.connect("clicked",
            () => this.markMailRead(aMail.id));
        mi.connect("activate", () => this.launchClient(true));
        this.menuItems[aMail.id] = mi;

        return mi;
    }

    makeAccountMenu(aAccount) {
        const accmenu = new AccountMenu(aAccount, this.$.orientation);
        accmenu.menu.connect("open-state-changed",
            (aMenu, aOpen) => this._subMenuOpenStateChanged(aMenu, aOpen));

        this.accountMenus[aAccount] = accmenu;

        if (this.$.orientation === St.Side.TOP) {
            this.menu.addMenuItem(accmenu, 0);
        } else {
            this.menu.addMenuItem(accmenu);
        }

        return accmenu;
    }

    _subMenuOpenStateChanged(aMenu, aOpen) {
        if (aOpen && this.$._.keep_one_menu_open) {
            const children = aMenu._getTopMenu()._getMenuItems();

            for (let i = children.length - 1; i >= 0; i--) {
                const item = children[i];

                if (item instanceof PopupMenu.PopupSubMenuMenuItem ||
                    item instanceof AccountMenu) {
                    if (aMenu !== item.menu) {
                        item.menu.close(true);
                    }
                }
            }
        }
    }

    _onMenuOpenStateChanged(aMenu, aOpen) {
        if (aOpen) {
            this.$.schedule_manager.idleCall("on_menu_open_state_changed", function() {
                for (const id in this.menuItems) {
                    if (this.menuItems.hasOwnProperty(id)) {
                        this.menuItems[id].updateTimeDisplay();
                    }
                }
            }.bind(this));
        }
    }

    // Adds a MailItem to the menu. If `account` is defined it's added
    // to its 'account menu'. An 'account menu' is created if it
    // doesn't exist.
    addMailMenuItem(aMailItem) {
        if (aMailItem.hasOwnProperty("account") && aMailItem.account) {
            let accmenu;
            if (aMailItem.account in this.accountMenus) {
                accmenu = this.accountMenus[aMailItem.account];
            } else {
                accmenu = this.makeAccountMenu(aMailItem.account);
            }
            accmenu.add(aMailItem);
        } else {
            if (this.$.orientation === St.Side.TOP) {
                this.menu.addMenuItem(aMailItem, 0); // add to top of menu
            } else {
                this.menu.addMenuItem(aMailItem); // add to bottom of menu
            }
        }
    }

    notify(aNewMails, aAllMails, aTest = false) {
        if (this.$._.notification_mode === NotificationMode.DISABLED) {
            return;
        }

        this._ensureNotificationSource();

        /* NOTE: Mailnag uses a Python list comprehension to concatenate the newMails
         * and allMails lists. The way that it is done in Python code cannot be done
         * in JavaScript (without writing a million lines of code).
         * Creating a Set of mail IDs seems to be working the same way as in the Python side.
         * Keep an eye on it for now.
         */
        const newMailsIDs = new Set(aNewMails.map((m) => {
            return m.id;
        }));
        const mails = [...aNewMails, ...aAllMails.filter((m) => {
            return !newMailsIDs.has(m.id);
        })];
        const mailCount = mails.length;
        const title = escapeHTML(ngettext("You have %d new mail!", "You have %d new mails!", mailCount)
            .format(mailCount));
        let body = "";
        const markReadButtonLabel = mailCount > 1 ?
            _("Mark All Read") :
            _("Mark Read");
        const mailsToShow = mailCount <= this.$._.notification_max_mails ?
            mailCount :
            this.$._.notification_max_mails;
        let msgTemplate;
        switch (this.$._.notification_mode) {
            case NotificationMode.SUMMARY_EXPANDED:
                msgTemplate = "%s\n<i>%s</i>\n\n";
                break;
            case NotificationMode.SUMMARY_COMPACT:
                msgTemplate = "<b>%s:</b>\n%s\n";
                break;
            case NotificationMode.SUMMARY_COMPRESSED:
                msgTemplate = "%s - <i>%s</i>\n";
                break;
            case NotificationMode.SUMMARY_CUSTOM:
                msgTemplate = this.$._.notification_custom_template;
                break;
        }

        let c = 0;
        for (; c < mailsToShow; c++) {
            /* NOTE: I stumbled upon mails that contain new lines in the mails subject. ¬¬
             * So, eradicate them! And since I don't like surprises, eradicate them
             * from the sender and the account to.
             */
            const sender = ellipsize(mails[c].sender || mails[c].sender_address,
                    this.$._.notification_sender_max_chars)
                .replace(/\s+/g, " ");
            const account = ellipsize(mails[c].account,
                    this.$._.notification_sender_max_chars)
                .replace(/\s+/g, " ");
            const subject = ellipsize(mails[c].subject,
                    this.$._.notification_subject_max_chars)
                .replace(/\s+/g, " ");

            if (this.$._.notification_mode === NotificationMode.SUMMARY_CUSTOM) {
                /* NOTE: Since the format function added by CJS is very limited (it doesn't
                 * support keyword arguments), I had to improvise and implement placeholders.
                 */
                body += msgTemplate
                    .replace("{{sender}}", sender)
                    .replace("{{account}}", account)
                    .replace("{{subject}}", subject);
            } else {
                const from = this.$._.notification_mode === NotificationMode.SUMMARY_COMPRESSED ?
                    sender :
                    sender + " " + UNICODE_SYMBOLS.black_rightwards_arrowhead + " " + account;

                body += msgTemplate.format(
                    escapeHTML(from),
                    escapeHTML(subject)
                );
            }
        }

        if (mailCount > this.$._.notification_max_mails) {
            const additionalMailsCount = mailCount - this.$._.notification_max_mails;
            body += "<i>%s</i>".format(
                escapeHTML(
                    ngettext("(and %d more)", "(and %d more)", additionalMailsCount)
                    .format(additionalMailsCount)
                )
                /* NOTE: I'm not sure if the previous ngettext call is needed.
                 * It doesn't hurt to use it, so keep it.
                 * And in case that I'm asking, this comment is bellow the code
                 * so gettext doesn't capture it.
                 */
            );
        }

        body = body.trim();

        if (this._notificationSource && !this.notification) {
            this.notification = new MessageTray.Notification(
                this._notificationSource,
                " ",
                " ",
                this._notiticationParams
            );
            this.notification.addButton("mark-read", markReadButtonLabel);

            if (this.$._.mail_client_command_or_url) {
                this.notification.addButton("open-client", _("Open Mail client"));
            }

            this.notification.setTransient(false);
            this.notification.setResident(true);
            this.notification.setUrgency(MessageTray.Urgency.HIGH);
            this.notification.connect("destroy", () => {
                this.notification = null;
            });
            this.notification.connect("action-invoked", (aSource, aAction) => {
                switch (aAction) {
                    case "mark-read":
                        /* NOTE: Do not trigger markMailsRead since the mails displayed in a
                         * test notification are just dummy text, not real mails.
                         */
                        aTest || this.markMailsRead(mails);
                        aSource.destroy();
                        break;
                    case "open-client":
                        this.launchClient();
                        break;
                }
            });
        }

        if (this.notification) {
            /* NOTE: Use of a try{}catch{} block because there could be errors
             * thrown by the custom template. And use Main.criticalNotify() and not
             * this.notification to avoid possible infinite loops.
             */
            tryFn(() => {
                this.notification.update(
                    title,
                    body,
                    this._notiticationParams
                );

                this._notificationSource.notify(this.notification);
            }, (aErr) => {
                const icon = new St.Icon({
                    icon_name: "dialog-error",
                    icon_type: St.IconType.SYMBOLIC,
                    icon_size: 24
                });

                Main.criticalNotify(
                    escapeHTML(_(this.$.metadata.name)),
                    escapeHTML(aErr),
                    icon
                );
                global.logError(aErr);
            });
        }
    }

    _ensureNotificationSource() {
        if (!this._notificationSource) {
            this._notificationSource = new CustomNotificationSource(
                escapeHTML(_(this.$.metadata.name))
            );
            this._notificationSource.connect("destroy", () => {
                this._notificationSource = null;
            });

            if (Main.messageTray) {
                Main.messageTray.add(this._notificationSource);
            }
        }
    }

    _destroyNotification() {
        /* NOTE: The notification source is also destroyed when the notification is destroyed.
         */
        this.notification && this.notification.destroy();
    }

    _testNotifications() {
        const mails = [];

        let i = 0,
            iLen = 10;
        for (; i < iLen; i++) {
            mails.push({
                id: i + "_account_name",
                sender: "Sender name " + i,
                datetime: new Date().getTime(),
                sender_address: "Sender address " + i,
                subject: "Lorem ipsum dolor sit amet, alterum accusam \nadversarium qui in.",
                account: "Account name " + i
            });
        }

        this.notify(mails, [], true);
    }

    showMarkAllRead() {
        this.removeMarkAllRead();

        this._markAllRead = new PopupMenu.PopupMenuItem(_("Mark All Read"));
        this._separator = new PopupMenu.PopupSeparatorMenuItem();

        this._markAllRead.connect("activate", () => this.markAllRead());

        if (this.$.orientation === St.Side.TOP) {
            this.menu.addMenuItem(this._separator);
            this.menu.addMenuItem(this._markAllRead);
        } else {
            this.menu.addMenuItem(this._markAllRead, 0);
            this.menu.addMenuItem(this._separator, 1);
        }
    }

    removeMarkAllRead() {
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
    }

    // removes all items from menu and adds a message
    showNoUnread() {
        this.menu.removeAll();
        this.accountMenus = {};
        this.menuItems = {};
        this._noUnreadItem = this.menu.addAction(_("No unread mails."));
        this._noUnreadItem.actor.reactive = false;
        this.set_applet_icon_symbolic_name("mail-read");
    }

    // makes sure "no unread mail" is not shown
    removeNoUnread() {
        if (this.hasOwnProperty("_noUnreadItem") &&
            this._noUnreadItem instanceof PopupMenu.PopupMenuItem) {
            this._noUnreadItem.destroy();
            delete this._noUnreadItem;
        }

        this.set_applet_icon_symbolic_name("mail-unread");
    }

    currentMailCount() {
        return Object.keys(this.menuItems).length;
    }

    showMailCount() {
        // display '?' if mailnag proxy is not present
        if (!this.mailnag || typeof this.mailnag !== "object") {
            this.set_applet_label("?");
            this.set_applet_tooltip(_("Mailnag daemon is not running!"));
        } else {
            const num = this.currentMailCount();
            this.set_applet_label(num.toString());
            if (num > 0) {
                if (num === 1) {
                    let s = "";

                    for (const id in this.menuItems) {
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
    }

    showError(message) {
        global.logError("Mailnag applet ERROR: " + message);

        this.menu.removeAll();
        this.set_applet_label("!!");
        this.set_applet_tooltip(_("Click to see error!"));
        this.menu.addAction("%s: ".format(_("Error")) + message);
        this.set_applet_icon_symbolic_name("mail-unread");
    }

    markMailRead(aId) {
        this.$.schedule_manager.clearSchedule("panel_drawer_handler");

        // remove account name from mail id
        const actual_id = aId.slice(0, aId.indexOf("_"));

        // tell mailnag
        this.mailnag.MarkMailAsReadSync(actual_id);

        this.removeMailMenuItem(aId);

        this.$.schedule_manager.setTimeout("panel_drawer_handler", this.autoHideApplet.bind(this), 500);
    }

    removeMailMenuItem(id) {
        // switch the focus to `menu` from `menuItem` to prevent menu from closing
        this.menu.actor.grab_key_focus();

        if (id in this.menuItems && this.menuItems[id].hasOwnProperty("account")) {
            // update account menu if there is one
            const account = this.menuItems[id].account;
            if (account && account in this.accountMenus) {
                const accountMenu = this.accountMenus[account];
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
        }

        // handle other visual updates
        if (this.currentMailCount() === 0) {
            this.showNoUnread();
            this.menu.close();
            this.removeMarkAllRead();
        }

        this.showMailCount();

        // TODO: destroy the notification as well if any
        /* NOTE: Destroying the notification doesn't seem right when removing
         * a mail from the menu that may or may not be present on the notification.
         * Furthermore, removing an specific mail from the notification isn't
         * possible at all, since the displayed mails in a notification come from
         * the MailsAdded daemon signal, and this removeMailMenuItem function
         * just handles actors in the applet menu.
         */
    }

    markMailsRead(aMails) {
        let i = 0,
            iLen = aMails.length;

        for (; i < iLen; i++) {
            this.markMailRead(aMails[i].id);
        }
    }

    markAllRead() {
        for (const id in this.menuItems) {
            if (this.menuItems.hasOwnProperty(id)) {
                this.markMailRead(id);
            }
        }
    }

    autoHideApplet() {
        if (this.$._.third_party_integration_panel_drawer &&
            this.actor.hasOwnProperty("__HandledByPanelDrawer") &&
            !Object.keys(this.menuItems).length) {
            this.actor.hide();
        }
    }

    launchClient(aFromMenuItem = false) {
        if (aFromMenuItem && !this.$._.launch_client_on_click) {
            return;
        }

        this.menu.close();

        if (this.$._.mail_client_command_or_url.startsWith("http")) { // client is a web page
            launchUri(this.$._.mail_client_command_or_url);
        } else { // client is a command
            Util.spawn_async(this.$._.mail_client_command_or_url, null);
        }
    }

    on_applet_clicked() {
        this.menu.toggle();
    }

    _onButtonPressEvent(aActor, aEvent) {
        if (aEvent.get_button() === Clutter.BUTTON_MIDDLE) { // 2: middle button
            switch (this.$._.middle_click_behavior) {
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

        return super._onButtonPressEvent(aActor, aEvent);
    }

    on_orientation_changed() {
        super.on_orientation_changed();
        this.loadMails();
    }

    on_applet_removed_from_panel() {
        super.on_applet_removed_from_panel();

        this._destroyNotification();

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

    _updateKeybindings() {
        this.$.keybinding_manager.addKeybinding("toggle_menu", this.$._.toggle_menu_keybinding, () => {
            if (!Main.overview.visible && !Main.expo.visible) {
                this.on_applet_clicked();
            }
        });
    }

    _onSettingsChanged(aPrefValue, aPrefKey) {
        switch (aPrefKey) {
            case "toggle_menu_keybinding":
                this._updateKeybindings();
                break;
            case "logging_level":
            case "debugger_enabled":
                Debugger.logging_level = this.$._.logging_level;
                Debugger.debugger_enabled = this.$._.debugger_enabled;
                break;
        }
    }
}

function main() {
    Debugger.wrapObjectMethods({
        CustomNotificationSource: CustomNotificationSource,
        Mailnag: Mailnag
    });

    return new Mailnag(...arguments);
}
