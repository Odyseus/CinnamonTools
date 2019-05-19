let XletMeta,
    Constants;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    Constants = require("./constants.js");
} else {
    Constants = imports.ui.extensionSystem.extensions["{{UUID}}"].constants;
}

const {
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

var {
    _,
    DESKTOP_FILE_TEMPLATE,
} = Constants;

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
    let desktopFilePath = "%s/org.Cinnamon.Extensions.ColorBlindnessAssistant.Settings.desktop";

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

function MessageTraySource() {
    this._init.apply(this, arguments);
}

MessageTraySource.prototype = {
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

function escapeHTML(aStr) {
    aStr = String(aStr)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    return aStr;
}

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

function removeInjection(aProto, aName, aOriginal) {
    aProto[aName] = aOriginal;
}

/* exported generateSettingsDesktopFile,
            escapeHTML,
            injectAfter,
            removeInjection
*/
