let $,
    D,
    E,
    F,
    G,
    Settings,
    XletMeta = null,
    customSettingsFrameworkExamples = null;

const {
    gi: {
        GLib,
        Gio
    },
    mainloop: Mainloop
} = imports;

function getExtensionClass(aBaseExtension) {
    class CustomSettingsFrameworkExamples extends aBaseExtension {
        constructor() {
            super({
                metadata: XletMeta,
                settings: $.Settings,
                notification: $.Notification,
                pref_keys: $.EXTENSION_PREFS
            });

            this.testFile = null;
            this._testFileFailSafeStartPath = `${XletMeta.path}/file_tests_playground`;
            this._testFileDontCallHandler = new Set([
                "filetest_ensureparents",
                "filetest_instancepath",
                "filetest_secondarypath",
                "filetest_data_to_write"
            ]);
        }

        enable() {
            super.enable();
        }

        disable() {
            super.disable();
        }

        handle_file_tests_action(aPrefKey) {
            const [discard, action] = aPrefKey.split("_"); // jshint ignore:line

            if (!Settings.filetest_instancepath) {
                global.logError("There isn't a path stored in <filetest_instancepath>.");
                return;
            }

            if (!Settings.filetest_instancepath.startsWith(this._testFileFailSafeStartPath)) {
                global.logError(`The path stored in <filetest_instancepath> should point to a location at <${this._testFileFailSafeStartPath}> and nowhere else.`);
                return;
            }

            if (action !== "init" &&
                action !== "destroy") {
                if (!(this.testFile instanceof F.File)) {
                    global.logError("File object for path stored in <filetest_instancepath> is not initialized.");
                    return;
                } else {
                    if (this.testFile.path !== Settings.filetest_instancepath) {
                        global.logError("File object path is different from the path stored in <filetest_instancepath>. Reinitialize");
                        return;
                    }
                }
            }

            switch (action) {
                case "init":
                    this.testFile = new F.File(Settings.filetest_instancepath);
                    break;
                case "destroy":
                    this.testFile = null;
                    break;
                case "exists":
                    global.log(`Exists = ${this.testFile.exists}`);
                    break;
                case "isfile":
                    global.log(`Is file = ${this.testFile.is_file}`);
                    break;
                case "isrealfile":
                    global.log(`Is real file = ${this.testFile.is_real_file}`);
                    break;
                case "isdirectory":
                    global.log(`Is directory = ${this.testFile.is_directory}`);
                    break;
                case "isrealdirectory":
                    global.log(`Is real directory = ${this.testFile.is_real_directory}`);
                    break;
                case "issymlink":
                    global.log(`Is symbolic link = ${this.testFile.is_symlink}`);
                    break;
                case "isexecutable":
                    global.log(`Is executable = ${this.testFile.is_executable}`);
                    break;
                case "copy":
                    if (!Settings.filetest_secondarypath.startsWith(this._testFileFailSafeStartPath)) {
                        global.logError(`The path stored in <filetest_secondarypath> should point to a location at <${this._testFileFailSafeStartPath}> and nowhere else.`);
                        return;
                    }

                    if (Settings.filetest_secondarypath === Settings.filetest_instancepath) {
                        global.logError(`Choose a different path for <filetest_secondarypath>.`);
                        return;
                    }

                    this.testFile.copy(Settings.filetest_secondarypath).then((aUserData) => {
                        global.log(`User data = ${aUserData}`);
                    }).catch((aErr) => global.logError(aErr));
                    break;
                case "delete":
                    this.testFile.delete().then((aSuccess) => {
                        global.log(`Delete successful = ${aSuccess}`);
                    }).catch((aErr) => global.logError(aErr));
                    break;
                case "write":
                    this.testFile.write(Settings.filetest_data_to_write, {
                        ensure_parents: Settings.filetest_ensureparents
                    }).then((aSuccess) => {
                        global.log(`Data written successfully = ${aSuccess}`);
                    }).catch((aErr) => global.logError(aErr));
                    break;
                case "append":
                    this.testFile.append(Settings.filetest_data_to_write, {
                        ensure_parents: Settings.filetest_ensureparents
                    }).then((aSuccess) => {
                        global.log(`Data appended successfully = ${aSuccess}`);
                    }).catch((aErr) => global.logError(aErr));
                    break;
                case "listdir":
                    this.testFile.listDir().then((aParams) => {
                        const allFileNames = aParams.files_info.map((aFileInfo) => {
                            return `${aFileInfo.get_name()}`;
                        });
                        global.log(`File names = ${allFileNames.join("\n")}`);
                        global.log(`Fail safe breached = ${aParams.fail_safe_breached}`);
                    }).catch((aErr) => global.logError(aErr));
                    break;
                case "setexecutable":
                    global.log(`Is executable = ${this.testFile.is_executable}`);
                    this.testFile.chmod(755).then((aSuccess) => {
                        global.log(`Set mode successful = ${aSuccess}`);
                        global.log(`Is executable = ${this.testFile.is_executable}`);
                    }).catch((aErr) => global.logError(aErr));
                    break;
                case "info":
                    this.testFile.info({
                        attributes: "*"
                    }).then((aFileInfo) => {
                        global.log(`File standard name   = ${aFileInfo.get_attribute_as_string(Gio.FILE_ATTRIBUTE_STANDARD_NAME)}`);
                        global.log(`File standard size   = ${aFileInfo.get_attribute_as_string(Gio.FILE_ATTRIBUTE_STANDARD_SIZE)}`);
                        global.log(`File groupd ID       = ${aFileInfo.get_attribute_as_string(Gio.FILE_ATTRIBUTE_UNIX_GID)}`);
                        global.log(`File user ID         = ${aFileInfo.get_attribute_as_string(Gio.FILE_ATTRIBUTE_UNIX_UID)}`);
                        global.log(`File owner user real = ${aFileInfo.get_attribute_as_string(Gio.FILE_ATTRIBUTE_OWNER_USER_REAL)}`);
                        global.log(`File owner user      = ${aFileInfo.get_attribute_as_string(Gio.FILE_ATTRIBUTE_OWNER_USER)}`);
                        global.log(`File owner group     = ${aFileInfo.get_attribute_as_string(Gio.FILE_ATTRIBUTE_OWNER_GROUP)}`);
                        global.log(`File time created    = ${aFileInfo.get_attribute_as_string(Gio.FILE_ATTRIBUTE_TIME_CREATED)}`);
                        global.log(`File time access     = ${aFileInfo.get_attribute_as_string(Gio.FILE_ATTRIBUTE_TIME_ACCESS)}`);
                        global.log(`File time changed    = ${aFileInfo.get_attribute_as_string(Gio.FILE_ATTRIBUTE_TIME_CHANGED)}`);
                        global.log(`File time modified   = ${aFileInfo.get_attribute_as_string(Gio.FILE_ATTRIBUTE_TIME_MODIFIED)}`);
                    }).catch((aErr) => global.logError(aErr));
                    break;
                case "read":
                    this.testFile.read().then((aData) => {
                        global.log(`File content = ${aData}`);
                    }).catch((aErr) => global.logError(aErr));
                    break;
            }
        }

        __connectSignals() {
            Settings.connect($.EXTENSION_PREFS, function(aPrefKey) {
                this.__onSettingsChanged(aPrefKey);
            }.bind(this));
        }

        __onSettingsChanged(aPrefKey) {
            if (aPrefKey.startsWith("filetest_")) {
                if (!this._testFileDontCallHandler.has(aPrefKey)) {
                    this.handle_file_tests_action(aPrefKey);
                }
            } else {
                global.log(`${"=".repeat(47)}\nPreference key: ${aPrefKey}\nPreference value: ${Settings[aPrefKey]}`);
            }
        }
    }

    $.Debugger.wrapObjectMethods({
        CustomSettingsFrameworkExamples: CustomSettingsFrameworkExamples
    });

    return new CustomSettingsFrameworkExamples();
}

function init(aXletMeta) {
    XletMeta = aXletMeta;

    /* NOTE: I have to initialize the modules and all their exported variables
     * at this stage because the stupid asynchronicity of newer versions of Cinnamon.
     * Since I'm using Cinnamon's native settings system declared and instantiated
     * in an external module (so I can use it globally from all modules and without
     * the need to pass the settings object through a trillion other objects),
     * attempting to initialize the settings outside init() fails because the stupid
     * extension isn't loaded yet. ¬¬
     */
    $ = require("js_modules/utils.js");
    D = require("js_modules/debugManager.js");
    E = require("js_modules/extensionsUtils.js");
    F = require("js_modules/customFileUtils.js");
    G = require("js_modules/globalUtils.js");

    Settings = $.Settings;

    $.Debugger.wrapObjectMethods({
        BaseExtension: E.BaseExtension
    });
}

function enable() {
    G.tryFn(() => {
        customSettingsFrameworkExamples = getExtensionClass(E.BaseExtension);

        Mainloop.idle_add(() => {
            customSettingsFrameworkExamples.enable();

            return GLib.SOURCE_REMOVE;
        });
    }, (aErr) => global.logError(aErr));

    return customSettingsFrameworkExamples ? {
        __openXletSettings: customSettingsFrameworkExamples.__openXletSettings
    } : null;
}

function disable() {
    if (customSettingsFrameworkExamples !== null) {
        customSettingsFrameworkExamples.disable();
        customSettingsFrameworkExamples = null;
    }
}
