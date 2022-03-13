const {
    gi: {
        Gio,
        St
    },
    misc: {
        params: Params
    },
    ui: {
        main: Main,
        messageTray: MessageTray
    }
} = imports;

const NotificationParams = Object.freeze({
    title: "",
    default_buttons: null,
    action_invoked_callback: null
});

var NotificationUrgency = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
};

var CustomNotificationSource = class CustomNotificationSource extends MessageTray.Source {
    constructor(aTitle) {
        super(aTitle);
        this._setSummaryIcon(this.createNotificationIcon());
    }

    createNotificationIcon() {
        let iconPath = `${__meta.path}/icon.svg`;

        if (!Gio.file_new_for_path(iconPath).query_exists(null)) {
            iconPath = `${__meta.path}/icon.png`;
        }

        return new St.Icon({
            gicon: Gio.icon_new_for_string(iconPath),
            icon_size: 24
        });
    }

    open() {
        this.destroy();
    }
};

/**
 * A desktop notification that can be reused so the notification tray isn't "spammed".
 *
 * - It always uses the xlet name as the notification title.
 * - Automatically uses icons existent in an xlet folder.
 * - It accepts default buttons and extra buttons.
 *
 * @param  {Object}   aParams                        - Initialization parameters.
 *                                                      title {String}: The title that the notification will use.
 *                                                      It should be "markup safe".
 * @param  {Array}    aParams.default_buttons         - A list of objects with two keys:
 *                                                      action {String}: An ID that will be used to trigger
 *                                                      an action defined inside action_invoked_callback.
 *                                                      label {String}: The label that the generated button will have.
 * @param  {Function} aParams.action_invoked_callback - A function that will be triggered by
 *                                                      the added buttons. Two parameters are
 *                                                      passed to this function; the notification
 *                                                      source and an action ID.
 *
 * @type {Class}
 */
var CustomNotification = class CustomNotification {
    constructor(aParams = {}) {
        this._params = Params.parse(aParams, NotificationParams);
        this._notification = null;
        this._notificationSource = null;
        this._notificationParams = {
            titleMarkup: true,
            bodyMarkup: true
        };
    }

    _ensureNotificationSource() {
        if (!this._notificationSource) {
            this._notificationSource = new CustomNotificationSource(this._params.title);
            this._notificationSource.connect("destroy", () => {
                this._notificationSource = null;
            });

            if (Main.messageTray) {
                Main.messageTray.add(this._notificationSource);
            }
        }
    }

    /**
     * Method called to display a notification.
     *
     * @param {String}  aMessage      - The message to display. It should be "markup safe".
     * @param {Integer} aUrgency      - The notification urgency. See NotificationUrgency.
     * @param {Array}   aExtraButtons - Extra buttons to display.
     */
    notify(aMessage = "", aUrgency = NotificationUrgency.NORMAL, aExtraButtons = []) {
        this._ensureNotificationSource();

        let body = "";

        if (Array.isArray(aMessage)) {
            aMessage = aMessage.join("\n");
        }

        body += `${aMessage}\n`;

        body = body.trim();

        if (this._notificationSource && !this._notification) {
            this._notification = new MessageTray.Notification(
                this._notificationSource,
                this._params.title,
                body,
                this._notificationParams
            );

            this._notification.setUrgency(aUrgency);
            this._notification.setTransient(false);
            this._notification.setResident(true);
            this._notification.connect("destroy", () => {
                this._notification = null;
            });

            if (typeof this._params.action_invoked_callback === "function") {
                this._notification.connect(
                    "action-invoked",
                    (aSource, aAction) => this._params.action_invoked_callback(aSource, aAction)
                );
            }
        }

        if (body) {
            this._notification.update(
                this._params.title,
                body,
                this._notificationParams
            );

            /* NOTE: The call to this._notification.update() clears all buttons.
             * ADDENDUM: At least, It did cleared all buttons in the past. I found instances
             * in which notifications had repeated buttons, so call clearButtons and move on.
             * ADDENDUM: Now that I think of it, it might still work as expected. The problem might be
             * the default parameter for default_buttons is (was) a non-primitive. I changed that
             * to avoid repeated buttons. I will keep the call to clearButtons() commented along
             * with these notes to avoid future hassle.
             */
            // this._notification.clearButtons();

            // NOTE: Don't bother attempting to use icons on action buttons. The implementation
            // checks with Gtk.IconTheme.get_default().has_icon(icon) to decide if an icon can
            // be set. This just throws out of the window the possibility to use custom icons
            // that reside inside the icons folder in an xlet root folder.
            const allButtons = Array.isArray(this._params.default_buttons) ? [
                ...this._params.default_buttons, ...aExtraButtons
            ] : [
                ...aExtraButtons
            ];
            let b = 0,
                bLen = allButtons.length;
            for (; b < bLen; b++) {
                this._notification.addButton(
                    allButtons[b].action,
                    allButtons[b].label
                );
            }

            this._notificationSource.notify(this._notification);
        } else {
            this._notification && this._notification.destroy();
        }
    }
};

/* exported CustomNotification
 */
