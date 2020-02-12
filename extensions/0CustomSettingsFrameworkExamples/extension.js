let customSettingsFrameworkExamples = null,
    XletMeta = null,
    G,
    D,
    CustomFileUtils,
    DesktopNotificationsUtils,
    Settings;

const {
    gi: {
        Gio,
        GLib
    },
    mainloop: Mainloop,
} = imports;

function CustomSettingsFrameworkExamples() {
    this._init.apply(this, arguments);
}

CustomSettingsFrameworkExamples.prototype = {
    _init: function() {
        this._settingsDesktopFileName = "org.Cinnamon.Extensions.CustomSettingsFrameworkExamples.Settings";
        this._settingsDesktopFilePath = GLib.get_home_dir() +
            "/.local/share/applications/%s.desktop".format(this._settingsDesktopFileName);
    },

    enable: function() {
        this._generateSettingsDesktopFile();
        this._bindSettings();
    },

    disable: function() {
        this._removeSettingsDesktopFile();

        Settings.destroy();
    },

    _bindSettings: function() {
        // NOTE: List of setting types that should never be bound.
        let blackList = [
            "pref_applist", // applist
            "pref_list_1", // list
            "pref_list_2", // list
        ];
        let filteredSettings = $.BOUND_SETTINGS_ARRAY.filter(function(aEl) {
            return blackList.indexOf(aEl) === -1;
        });

        Settings.connect(filteredSettings, function(aPrefKey) {
            this._onSettingsChanged(aPrefKey);
        }.bind(this));
    },

    _onSettingsChanged: function(aPrefKey) {
        global.logError("=".repeat(47) + "\nPreference key: " + aPrefKey + "\nPreference value: " + Settings[aPrefKey]);
    },

    _generateSettingsDesktopFile: function() {
        if (!Settings.pref_desktop_file_generated) {
            CustomFileUtils.generateDesktopFile({
                fileName: this._settingsDesktopFileName,
                dataName: XletMeta.name,
                dataComment: "Settings for %s".format(XletMeta.name),
                dataExec: XletMeta.path + "/settings.py",
                dataIcon: XletMeta.path + "/icon.svg"
            });

            $.Notification.notify([
                G.escapeHTML("A shortcut to open this extension settings has been generated."),
                G.escapeHTML("Search for it on your applications menu."),
                G.escapeHTML("Read this extension help page for more details.")
            ]);

            Settings.pref_desktop_file_generated = true;
        }
    },

    _removeSettingsDesktopFile: function() {
        try {
            let desktopFile = Gio.file_new_for_path(this._settingsDesktopFilePath);

            if (desktopFile.query_exists(null)) {
                desktopFile.delete_async(GLib.PRIORITY_LOW, null, null);
                Settings.pref_desktop_file_generated = false;
            }
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    openXletSettings: function() {
        G.xdgOpen(XletMeta.path + "/settings.py");
    }
};

function init(aXletMeta) {
    XletMeta = aXletMeta;

    /* NOTE: I have to initialize the modules and all its exported variables
     * at this stage because the stupid asynchronicity of newer versions of Cinnamon.
     * Since I'm using Cinnamon's native settings system declared and instantiated
     * in the constants.js module (so I can use it globally from all modules and without
     * the need to pass the settings object through a trillion other objects),
     * attempting to initialize the settings outside init() fails because the stupid
     * extension isn't loaded yet. ¬¬
     */

    // Mark for deletion on EOL. Cinnamon 3.6.x+
    if (typeof require === "function") {
        G = require("./globalUtils.js");
        D = require("./debugManager.js");
        $ = require("./utils.js");
        CustomFileUtils = require("./customFileUtils.js");
        DesktopNotificationsUtils = require("./desktopNotificationsUtils.js");
    } else {
        G = imports.ui.extensionSystem.extensions["{{UUID}}"].globalUtils;
        D = imports.ui.extensionSystem.extensions["{{UUID}}"].debugManager;
        $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
        CustomFileUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].customFileUtils;
        DesktopNotificationsUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].desktopNotificationsUtils;
    }

    Settings = $.Settings;

    D.wrapObjectMethods($.Debugger, {
        CustomSettingsFrameworkExamples: CustomSettingsFrameworkExamples
    });
}

function enable() {
    try {
        customSettingsFrameworkExamples = new CustomSettingsFrameworkExamples();

        Mainloop.idle_add(() => {
            customSettingsFrameworkExamples.enable();

            return GLib.SOURCE_REMOVE;
        });

        return {
            openXletSettings: customSettingsFrameworkExamples.openXletSettings
        };
    } catch (aErr) {
        global.logError(aErr);
    }

    return null;
}

function disable() {
    if (customSettingsFrameworkExamples !== null) {
        customSettingsFrameworkExamples.disable();
    }
}
