let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui["{{XLET_SYSTEM}}"]["{{XLET_META}}"]["{{UUID}}"];
}

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

const NOTIFICATION_PARAMS = Object.freeze({
    title: "",
    defaultButtons: [],
    actionInvokedCallback: null
});

var NotificationUrgency = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
};

function CustomNotificationSource() {
    this._init.apply(this, arguments);
}

CustomNotificationSource.prototype = {
    __proto__: MessageTray.Source.prototype,

    _init: function(aTitle) {
        MessageTray.Source.prototype._init.call(this, aTitle);
        this._setSummaryIcon(this.createNotificationIcon());
    },

    createNotificationIcon: function() {
        let iconPath = XletMeta.path + "/icon.svg";

        if (!Gio.file_new_for_path(iconPath).query_exists(null)) {
            iconPath = XletMeta.path + "/icon.png";
        }

        return new St.Icon({
            gicon: Gio.icon_new_for_string(iconPath),
            icon_size: 24
        });
    },

    open: function() {
        this.destroy();
    }
};

/**
 * A desktop notification that can be reused so the notification tray isn't "spammed".
 *
 * - It always uses the xlet name as the notification title.
 * - Automatically uses icons existent in an xlet folder.
 * - It accepts default buttons and extra buttons.
 */
function CustomNotification() {
    this._init.apply(this, arguments);
}

CustomNotification.prototype = {
    /**
     * Initialize.
     *
     * @param  {Object} aParams Initialization parameters.
     *                          title {String}: The title that the notification will use.
     *                              It should be "markup safe".
     *                          defaultButtons {Array}: A list of objects with two keys:
     *                              action {String}: An ID that will be used to trigger
     *                                  an action defined inside actionInvokedCallback.
     *                              label {String}: The label that the generated button will have.
     *                          actionInvokedCallback {Function}: A function that will be triggered
     *                              by the added buttons. Two parameters are passed to this function;
     *                              the notification source and an action ID.
     */
    _init: function(aParams) {
        this._params = Params.parse(aParams, NOTIFICATION_PARAMS);
        this._notification = null;
        this._notificationSource = null;
        this._notificationParams = {
            titleMarkup: true,
            bannerMarkup: true,
            bodyMarkup: true,
            clear: true
        };
    },

    _ensureNotificationSource: function() {
        if (!this._notificationSource) {
            this._notificationSource = new CustomNotificationSource(this._params.title);
            this._notificationSource.connect("destroy", () => {
                this._notificationSource = null;
            });

            if (Main.messageTray) {
                Main.messageTray.add(this._notificationSource);
            }
        }
    },

    /**
     * Method called to display a notification.
     *
     * @param {String}  aMessage      - The message to display. It should be "markup safe".
     * @param {Integer} aUrgency      - The notification urgency. See NotificationUrgency.
     * @param {Array}   aExtraButtons - Extra buttons to display.
     */
    notify: function(aMessage = "", aUrgency = NotificationUrgency.NORMAL, aExtraButtons = []) {
        this._ensureNotificationSource();

        let body = "";

        if (Array.isArray(aMessage)) {
            aMessage = aMessage.join("\n");
        }

        body += aMessage + "\n";

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

            if (typeof this._params.actionInvokedCallback === "function") {
                this._notification.connect(
                    "action-invoked",
                    (aSource, aAction) => this._params.actionInvokedCallback(aSource, aAction)
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
             */
            let defaultButtons = this._params.defaultButtons;
            let b = 0,
                bLen = defaultButtons.length;
            for (; b < bLen; b++) {
                this._notification.addButton(
                    defaultButtons[b].action,
                    defaultButtons[b].label
                );
            }

            let e = 0,
                eLen = aExtraButtons.length;

            if (eLen > 0) {
                for (; e < eLen; e++) {
                    this._notification.addButton(
                        aExtraButtons[e].action,
                        aExtraButtons[e].label
                    );
                }
            }

            this._notificationSource.notify(this._notification);
        } else {
            this._notification && this._notification.destroy();
        }
    }
};
