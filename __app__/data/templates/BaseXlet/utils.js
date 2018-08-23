let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.$$XLET_MANAGER$$.$$XLET_TYPE$$Meta["{{UUID}}"];
}

const Clutter = imports.gi.Clutter;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const ModalDialog = imports.ui.modalDialog;
const St = imports.gi.St;
const Tooltips = imports.ui.tooltips;

var NotificationUrgency = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
};

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

/**
 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
 *
 * This function was born in http://stackoverflow.com/a/6832721.
 *
 * @param {String}  v1                      - The first version to be compared.
 * @param {String}  v2                      - The second version to be compared.
 * @param {Object}  options                 - Optional flags that affect comparison behavior:
 * @param {Boolean} options.lexicographical - If true, compares each part of the version strings
 * lexicographically instead of naturally; this allows suffixes such as "b" or "dev" but will cause
 * "1.10" to be considered smaller than "1.2".
 * @param {Boolean} options.zeroExtend      - If true, changes the result if one version string has
 * less parts than the other. In this case the shorter string will be padded with "zero" parts
 * instead of being considered smaller.
 *
 * @returns {Number|NaN}
 * - 0 if the versions are equal.
 * - a negative integer if v1 < v2.
 * - a positive integer if v1 > v2.
 * - NaN if either version string is in the wrong format.
 *
 * @copyright by Jon Papaioannou (["john", "papaioannou"].join(".") + "@gmail.com")
 * @license This function is in the public domain. Do what you want with it, no strings attached.
 */
function versionCompare(v1, v2, options) {
    let lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split("."),
        v2parts = v2.split(".");

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) {
            v1parts.push("0");
        }
        while (v2parts.length < v1parts.length) {
            v2parts.push("0");
        }
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (let i = 0; i < v1parts.length; ++i) {
        if (v2parts.length === i) {
            return 1;
        }

        if (v1parts[i] === v2parts[i]) {
            continue;
        } else if (v1parts[i] > v2parts[i]) {
            return 1;
        } else {
            return -1;
        }
    }

    if (v1parts.length !== v2parts.length) {
        return -1;
    }

    return 0;
}

/**
 * [customNotify description]
 * @param  {String}  aTitle    [description]
 * @param  {String}  aBody     [description]
 * @param  {String}  aIconName [description]
 * @param  {Integer} aUrgency  [description]
 * @param  {Object}  aButtons  [description]
 */
function customNotify(aTitle, aBody, aIconName, aUrgency, aButtons) {
    let icon = new St.Icon({
        icon_name: aIconName,
        icon_type: St.IconType.SYMBOLIC,
        icon_size: 24
    });
    let source = new MessageTray.SystemNotificationSource();
    Main.messageTray.add(source);
    let notification = new MessageTray.Notification(source, aTitle, aBody, {
        icon: icon,
        bodyMarkup: true,
        titleMarkup: true,
        bannerMarkup: true
    });
    notification.setTransient(aUrgency === NotificationUrgency.LOW);

    if (aUrgency !== NotificationUrgency.LOW && typeof aUrgency === "number") {
        notification.setUrgency(aUrgency);
    }

    try {
        if (aButtons && typeof aButtons === "object") {
            let destroyEmitted = (aButton) => {
                return () => aButton.tooltip.destroy();
            };

            let i = 0,
                iLen = aButtons.length;
            for (; i < iLen; i++) {
                let btnObj = aButtons[i];
                try {
                    if (!notification._buttonBox) {

                        let box = new St.BoxLayout({
                            name: "notification-actions"
                        });
                        notification.setActionArea(box, {
                            x_expand: true,
                            y_expand: false,
                            x_fill: true,
                            y_fill: false,
                            x_align: St.Align.START
                        });
                        notification._buttonBox = box;
                    }

                    let button = new St.Button({
                        can_focus: true
                    });

                    if (btnObj.iconName) {
                        notification.setUseActionIcons(true);
                        button.add_style_class_name("notification-icon-button");
                        button.child = new St.Icon({
                            icon_name: btnObj.iconName,
                            icon_type: St.IconType.SYMBOLIC,
                            icon_size: 16
                        });
                    } else {
                        button.add_style_class_name("notification-button");
                        button.label = btnObj.label;
                    }

                    button.connect("clicked", btnObj.callback);

                    if (btnObj.tooltip) {
                        button.tooltip = new Tooltips.Tooltip(
                            button,
                            btnObj.tooltip
                        );
                        button.connect("destroy", destroyEmitted(button));
                    }

                    if (notification._buttonBox.get_n_children() > 0) {
                        notification._buttonFocusManager.remove_group(notification._buttonBox);
                    }

                    notification._buttonBox.add(button);
                    notification._buttonFocusManager.add_group(notification._buttonBox);
                    notification._inhibitTransparency = true;
                    notification.updateFadeOnMouseover();
                    notification._updated();
                } catch (aErr) {
                    global.logError(aErr);
                    continue;
                }
            }
        }
    } finally {
        source.notify(notification);
    }
}

/**
 * [ConfirmationDialog description]
 * @param  {Object}  aCallback           [description]
 * @param  {String}  aDialogLabel        [description]
 * @param  {String}  aDialogMessage      [description]
 * @param  {String}  aCancelButtonLabel  [description]
 * @param  {String}  aDoButtonLabel      [description]
 */
function ConfirmationDialog() {
    this._init.apply(this, arguments);
}

ConfirmationDialog.prototype = {
    __proto__: ModalDialog.ModalDialog.prototype,

    _init: function(aCallback, aDialogLabel, aDialogMessage, aCancelButtonLabel, aDoButtonLabel) {
        ModalDialog.ModalDialog.prototype._init.call(this, {
            styleClass: null
        });

        let mainContentBox = new St.BoxLayout({
            style_class: "confirm-dialog-main-layout",
            vertical: false
        });
        this.contentLayout.add(mainContentBox, {
            x_fill: true,
            y_fill: true
        });

        let messageBox = new St.BoxLayout({
            style_class: "confirm-dialog-message-layout",
            vertical: true
        });
        mainContentBox.add(messageBox, {
            y_align: St.Align.START
        });

        this._subjectLabel = new St.Label({
            style_class: "confirm-dialog-headline",
            text: aDialogLabel
        });

        messageBox.add(this._subjectLabel, {
            y_fill: false,
            y_align: St.Align.START
        });

        this._descriptionLabel = new St.Label({
            style_class: "confirm-dialog-description",
            text: aDialogMessage
        });

        messageBox.add(this._descriptionLabel, {
            y_fill: true,
            y_align: St.Align.START
        });

        this.setButtons([{
            label: aCancelButtonLabel,
            focused: true,
            action: () => {
                this.close();
            },
            key: Clutter.Escape
        }, {
            label: aDoButtonLabel,
            action: () => {
                this.close();
                aCallback();
            }
        }]);
    }
};

Date.prototype.toCustomISOString = function() {
    var tzo = -this.getTimezoneOffset(),
        dif = tzo >= 0 ? "+" : "-",
        pad = function(num) {
            var norm = Math.floor(Math.abs(num));
            return (norm < 10 ? "0" : "") + norm;
        };
    return this.getFullYear() +
        "-" + pad(this.getMonth() + 1) +
        "-" + pad(this.getDate()) +
        "_" + pad(this.getHours()) +
        "." + pad(this.getMinutes()) +
        "." + pad(this.getSeconds()) +
        "." + pad(this.getMilliseconds()) +
        dif + pad(tzo / 60) +
        "." + pad(tzo % 60);
};

function saveToFileAsync(aData, aFile, aCallback) {
    let data = new GLib.Bytes(aData);

    aFile.replace_async(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION,
        GLib.PRIORITY_DEFAULT, null,
        function(aObj, aResponse) {
            let stream = aObj.replace_finish(aResponse);

            stream.write_bytes_async(data, GLib.PRIORITY_DEFAULT,
                null,
                function(aW_obj, aW_res) {

                    aW_obj.write_bytes_finish(aW_res);
                    stream.close(null);

                    if (aCallback && typeof aCallback === "function") {
                        aCallback();
                    }
                });
        });
}

function listDirAsync(aFileObj, aCallback) {
    let allFiles = [];
    aFileObj.enumerate_children_async(Gio.FILE_ATTRIBUTE_STANDARD_NAME,
        Gio.FileQueryInfoFlags.NONE,
        GLib.PRIORITY_LOW, null,
        function(aFileObj_a, aResponse_a) {
            let enumerator = aFileObj_a.enumerate_children_finish(aResponse_a);

            function onNextFileComplete(aFileObj_b, aResponse_b) {
                let files = aFileObj_b.next_files_finish(aResponse_b);

                if (files.length) {
                    allFiles = allFiles.concat(files);
                    enumerator.next_files_async(100, GLib.PRIORITY_LOW, null, onNextFileComplete);
                } else {
                    enumerator.close(null);

                    if (aCallback && typeof aCallback === "function") {
                        aCallback(allFiles);
                    }
                }
            }
            enumerator.next_files_async(100, GLib.PRIORITY_LOW, null, onNextFileComplete);
        });
}

function removeSurplusFilesFromDirectory(aDirPath, aMaxFilesToKeep) {
    try {
        listDirAsync(Gio.file_new_for_path(aDirPath), function(aAllFiles) {
            // Generate file paths from Gio.FileInfo objects.
            let allFilesPaths = aAllFiles.map(function(aFile) {
                return aDirPath + "/" + aFile.get_name();
            });

            // Sort paths in ascending order.
            allFilesPaths.sort(function(a, b) {
                return a - b;
            });

            // Slice from the list the files to keep.
            let pathsToBeRemoved = allFilesPaths.slice(0, -aMaxFilesToKeep);

            // Proceed with removal.
            for (let path of pathsToBeRemoved) {
                try {
                    Gio.file_new_for_path(path).delete_async(GLib.PRIORITY_LOW, null, null);
                } catch (aErr) {
                    global.logError(aErr);
                }
            }
        });
    } catch (aErr) {
        global.logError(aErr);
    }
}

function getGLibVersion() {
    return "%s.%s.%s".format(GLib.MAJOR_VERSION, GLib.MINOR_VERSION, GLib.MICRO_VERSION);
}

function escapeHTML(aStr) {
    aStr = String(aStr)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    return aStr;
}

/* exported _,
            ngettext,
            versionCompare,
            customNotify,
            saveToFileAsync,
            removeSurplusFilesFromDirectory,
            getGLibVersion,
            escapeHTML
 */
