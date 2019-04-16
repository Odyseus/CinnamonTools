let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

const {
    gettext: Gettext,
    gi: {
        Gio,
        GLib,
        St
    },
    misc: {
        fileUtils: FileUtils,
        util: Util
    },
    ui: {
        messageTray: MessageTray,
    }
} = imports;

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

var EFFECT_DEFAULT_PARAMS = Object.freeze({
    type: "", // On-the-fly.
    base_name: "",
    extra_shaders_path: "", // On-the-fly.
    id: "", // On-the-fly.
    new_frame_signal: 0,
    add_size_changed_signal: false,
    trigger_0: "",
    trigger_1: "",
    trigger_2: "",
    trigger_3: "",
    trigger_4: "",
});

var NotificationsUrgency = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
};

const DESKTOP_FILE_TEMPLATE = '[Desktop Entry]\n\
Encoding=UTF-8\n\
Name=%%NAME%%\n\
Comment=%%COMMENT%%\n\
Type=Application\n\
Exec=%%EXEC%%\n\
Icon=%%ICON%%\n\
Categories=Settings;\n\
Hidden=false\n\
NoDisplay=false\n\
';

/* NOTE: These are all the window types that I found in Muffin's source code.
 * (muffin/src/muffin-enum-types.c)
 * I don't know if there are more nor if it's adviced to allow to add effects
 * to all the window types. I just want to blacklist the freaking desktop.
 */
var ALLOWED_WIN_TYPES = {
    0: "NORMAL",
    // 1: "DESKTOP",
    // 2: "DOCK",
    3: "DIALOG",
    4: "MODAL_DIALOG",
    5: "TOOLBAR",
    6: "MENU",
    7: "UTILITY",
    8: "SPLASHSCREEN",
    9: "DROPDOWN_MENU",
    10: "POPUP_MENU",
    11: "TOOLTIP",
    12: "NOTIFICATION",
    13: "COMBO",
    14: "DND",
    15: "OVERRIDE_OTHER",
};

var PROP_NAME_CLEANER_RE = /[\s\:\.\,\(\)\@]/g;

function DesktopEffectsApplierMessageTraySource() {
    this._init.apply(this, arguments);
}

DesktopEffectsApplierMessageTraySource.prototype = {
    __proto__: MessageTray.Source.prototype,

    _init: function() {
        MessageTray.Source.prototype._init.call(this, _(XletMeta.name));
        this._setSummaryIcon(this.createNotificationIcon());
    },

    createNotificationIcon: function() {
        return new St.Icon({
            gicon: Gio.icon_new_for_string(XletMeta.path + "/icon.svg"),
            icon_size: 24
        });
    },

    open: function() {
        this.destroy();
    }
};

function injectAfter(aParent, aName, aFunc) {
    let origin = aParent[aName];
    aParent[aName] = function() {
        let ret;
        ret = origin.apply(this, arguments);
        if (ret === undefined) {
            ret = aFunc.apply(this, arguments);
        }
        return ret;
    };
    return origin;
}

function removeInjection(proto, name, orig) {
    proto[name] = orig;
}

/**
 * Save data to a file asynchronously whether the file exists or not.
 *
 * @param {String}   aData     - The data to save to the file.
 * @param {Gio.File} aFile     - The Gio.File object of the file to save to.
 * @param {Function} aCallback - The function to call after the save operation finishes.
 */
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

function generateSettingsDesktopFile(aWhere) {
    let desktopFilePath = "%s/org.Cinnamon.Extensions.DesktopEffectsApplier.Settings.desktop";

    switch (aWhere) {
        case "desktop":
            desktopFilePath = desktopFilePath.format(
                GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP));
            break;
        case "xdg":
            desktopFilePath = desktopFilePath.format(
                GLib.get_home_dir() + "/.local/share/applications");
            break;
    }

    let desktopFile = Gio.file_new_for_path(desktopFilePath);
    let data = DESKTOP_FILE_TEMPLATE
        .replace("%%NAME%%", _(XletMeta.name))
        .replace("%%COMMENT%%", _("Settings for %s").format(_(XletMeta.name)))
        .replace("%%EXEC%%", XletMeta.path + "/settings.py")
        .replace("%%ICON%%", XletMeta.path + "/icon.svg");

    saveToFileAsync(data, desktopFile, () => {
        if (FileUtils.hasOwnProperty("changeModeGFile")) {
            FileUtils.changeModeGFile(desktopFile.get_path(), 755);
        } else {
            Util.spawnCommandLine('chmod +x "' + desktopFile.get_path() + '"');
        }
    });
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
            EFFECT_DEFAULT_PARAMS,
            ALLOWED_WIN_TYPES,
            NotificationsUrgency,
            PROP_NAME_CLEANER_RE,
            generateSettingsDesktopFile,
            injectAfter,
            removeInjection,
            escapeHTML
 */
