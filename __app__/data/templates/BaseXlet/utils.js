let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.$$XLET_MANAGER$$.$$XLET_TYPE$$Meta["{{UUID}}"];
}

const {
    gettext: Gettext,
    gi: {
        Clutter,
        Gio,
        GLib,
        St
    },
    misc: {
        params: Params
    },
    ui: {
        main: Main,
        messageTray: MessageTray,
        modalDialog: ModalDialog,
        tooltips: Tooltips
    }
} = imports;

var NotificationUrgency = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
};

const GioSSS = Gio.SettingsSchemaSource;

var SETTINGS_SCHEMA = "org.cinnamon.applets." + XletMeta.uuid;

Gettext.bindtextdomain(XletMeta.uuid, GLib.get_home_dir() + "/.local/share/locale");

/**
 * escape/unescape replacer.
 * @type {Object}
 */
var escapeUnescapeReplacer = {
    escapeHash: {
        _: (input) => {
            let ret = escapeUnescapeReplacer.escapeHash[input];
            if (!ret) {
                if (input.length - 1) {
                    ret = String.fromCharCode(parseInt(input.substring(input.length - 3 ? 2 : 1), 16));
                } else {
                    let code = input.charCodeAt(0);
                    ret = code < 256 ? "%" + (0 + code.toString(16)).slice(-2).toUpperCase() : "%u" + ("000" + code.toString(16)).slice(-4).toUpperCase();
                }
                escapeUnescapeReplacer.escapeHash[ret] = input;
                escapeUnescapeReplacer.escapeHash[input] = ret;
            }
            return ret;
        }
    },

    escape: (aStr) => {
        return aStr.toString().replace(/[^\w @\*\-\+\.\/]/g, (aChar) => {
            return escapeUnescapeReplacer.escapeHash._(aChar);
        });
    },

    unescape: (aStr) => {
        return aStr.toString().replace(/%(u[\da-f]{4}|[\da-f]{2})/gi, (aSeq) => {
            return escapeUnescapeReplacer.escapeHash._(aSeq);
        });
    }
};

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
 * customNotify description
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
 * Clutter confirmation dialog.
 *
 * It presents a modal dialog with a header and a message and the Cancel button as the
 * one that it's focused by default.
 *
 * @param {Function} aCallback          - The function to call when pressing the OK button.
 * @param {String}   aDialogHeader      - The header/title of the dialog.
 * @param {String}   aDialogMessage     - The message of the dialog.
 * @param {String}   aCancelButtonLabel - The label of the button that represents the cancellation of an operation.
 * @param {String}   aDoButtonLabel     - The label of the button that confirms that the operation should proceed.
 */
function ConfirmationDialog() {
    this._init.apply(this, arguments);
}

ConfirmationDialog.prototype = {
    __proto__: ModalDialog.ModalDialog.prototype,

    _init: function(aCallback, aDialogHeader, aDialogMessage, aCancelButtonLabel, aDoButtonLabel) {
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
            text: aDialogHeader
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

/**
 * Save data to a file asynchronously whether the file exists or not.
 *
 * @param {String}   aData     - The data save to the file.
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

/**
 * List all files in a directory asynchronously and process them.
 *
 * @param {Gio.File} aFileObj  - The Gio.File object to enumerate.
 * @param {Function} aCallback - Function to which to pass the array of Gio.FileInfo objects generated by this function.
 */
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

/**
 * Remove surplus files from a directory.
 *
 * @param {String}  aDirPath        - The path to the directory from which to remove files.
 * @param {Integer} aMaxFilesToKeep - Maximum amount of files to keep.
 */
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

/**
 * Get the version number of the GLib library.
 *
 * @return {String}  The GLib library version.
 */
function getGLibVersion() {
    return "%s.%s.%s".format(GLib.MAJOR_VERSION, GLib.MINOR_VERSION, GLib.MICRO_VERSION);
}

/**
 * Escape HTML entities.
 *
 * @param {String} aStr - The string from which to escape the HTML entities.
 *
 * @return {String} String with HTML entities escaped.
 */
function escapeHTML(aStr) {
    aStr = String(aStr)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    return aStr;
}

function isObject(item) {
    return (item && typeof item === "object" && !Array.isArray(item));
}

/**
 * Safely get values from an Object.
 *
 * So one doesn't have to use hasOwnProperty a gazillion times!!!!
 *
 * @return {Any/null} [description]
 */
function safeGet() {
    // All arguments passed to the function.
    let args = Array.prototype.slice.call(arguments);
    // Extract the first argument (the object).
    // After this point, args are all the keys to get
    // a value from the object.
    let obj = args.shift();
    let value = null;

    if (!isObject(obj)) {
        return null;
    }

    while (args.length) {
        let key = args.shift();

        if (isObject(obj) && obj.hasOwnProperty(key)) {
            value = obj = obj[key];
        } else {
            value = obj = null;
            break;
        }
    }

    return value;
}

/**
 * Example function on how to use safeGet to return a different default
 * other than null.
 *
 * @return {Any} The value of an object property or a default value.
 */
function safeGetEllipsis() {
    let val = safeGet.apply(null, arguments);
    return val === null ? "..." : val;
}

function isGetter(obj, prop) {
    return !!Object.getOwnPropertyDescriptor(obj.prototype, prop)["get"];
}

function isSetter(obj, prop) {
    return !!Object.getOwnPropertyDescriptor(obj.prototype, prop)["set"];
}

/**
 * Benchmark function invocations within a given class or prototype.
 *
 * @param  {Object}  aObject                    JavaScript class or prototype to benchmark.
 * @param  {Object}  aParams                    Object containing parameters, all are optional.
 * @param  {String}  aParams.objectName         Because it's impossible to get the name of a prototype
 *                                              in JavaScript, force it down its throat. ¬¬
 * @param  {Array}   aParams.methods            By default, all methods in aObject will be
 *                                              "proxyfied". aParams.methods should containg the name
 *                                              of the methods that one wants to debug/benchmark.
 *                                              aParams.methods acts as a whitelist by default.
 * @param  {Boolean} aParams.blacklistMethods   If true, ALL methods in aObject will be
 *                                              debugged/benchmarked, except those listed in aParams.methods.
 * @param  {Number}  aParams.threshold          The minimum latency of interest.
 * @param  {Boolean}  aParams.debug              If true, the target method will be executed inside a
 *                                              try{} catch{} block.
 */
function prototypeDebugger(aObject, aParams) {
    let options = Params.parse(aParams, {
        objectName: "Object",
        methods: [],
        blacklistMethods: false,
        debug: true,
        threshold: 3
    });
    let keys = Object.getOwnPropertyNames(aObject.prototype);

    if (options.methods.length > 0) {
        keys = keys.filter((aKey) => {
            return options.blacklistMethods ?
                // Treat aMethods as a blacklist, so don't include these keys.
                options.methods.indexOf(aKey) === -1 :
                // Keep ONLY the keys in aMethods.
                options.methods.indexOf(aKey) >= 0;
        });
    }

    let outpuTemplate = "[%s.%s]: %fms (MAX: %fms AVG: %fms)";
    let times = [];
    let i = keys.length;

    let getHandler = (aKey) => {
        return {
            apply: function(aTarget, aThisA, aArgs) { // jshint ignore:line
                let val;
                let now = GLib.get_monotonic_time();

                if (options.debug) {
                    try {
                        val = aTarget.apply(aThisA, aArgs);
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                } else {
                    val = aTarget.apply(aThisA, aArgs);
                }

                let time = GLib.get_monotonic_time() - now;

                if (time >= options.threshold) {
                    times.push(time);
                    let total = 0;
                    let timesLength = times.length;
                    let z = timesLength;

                    while (z--) {
                        total += times[z];
                    }

                    let max = (Math.max.apply(null, times) / 1000).toFixed(2);
                    let avg = ((total / timesLength) / 1000).toFixed(2);
                    time = (time / 1000).toFixed(2);

                    global.log(outpuTemplate.format(
                        options.objectName,
                        aKey,
                        time,
                        max,
                        avg
                    ));
                }

                return val;
            }
        };
    };

    while (i--) {
        let key = keys[i];

        /* NOTE: If key is a setter or getter, aObject.prototype[key] will throw.
         */
        if (!!Object.getOwnPropertyDescriptor(aObject.prototype, key)["get"] ||
            !!Object.getOwnPropertyDescriptor(aObject.prototype, key)["set"]) {
            continue;
        }

        let fn = aObject.prototype[key];

        if (typeof fn !== "function") {
            continue;
        }

        aObject.prototype[key] = new Proxy(fn, getHandler(key));
    }
}

function DebugManager() {
    this._init.apply(this, arguments);
}

DebugManager.prototype = {
    _init: function() {
        let schema = SETTINGS_SCHEMA;
        let schemaDir = Gio.file_new_for_path(XletMeta.path + "/schemas");
        let schemaSource;

        if (schemaDir.query_exists(null)) {
            schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
                GioSSS.get_default(),
                false);
        } else {
            schemaSource = GioSSS.get_default();
        }

        this.schemaObj = schemaSource.lookup(schema, false);

        if (!this.schemaObj) {
            throw new Error(_("Schema %s could not be found for xlet %s.")
                .format(schema, XletMeta.uuid) + _("Please check your installation."));
        }

        this.schema = new Gio.Settings({
            settings_schema: this.schemaObj
        });

        this._handlers = [];
    },

    set verboseLogging(aValue) {
        this.schema.set_boolean("pref-enable-verbose-logging", aValue);
    },

    get verboseLogging() {
        return this.schema.get_boolean("pref-enable-verbose-logging");
    },

    connect: function(signal, callback) {
        let handler_id = this.schema.connect(signal, callback);
        this._handlers.push(handler_id);
        return handler_id;
    },

    destroy: function() {
        // Remove the remaining signals...
        while (this._handlers.length) {
            this.disconnect(this._handlers[0]);
        }
    },

    disconnect: function(handler_id) {
        let index = this._handlers.indexOf(handler_id);
        this.schema.disconnect(handler_id);

        if (index > -1) {
            this._handlers.splice(index, 1);
        }
    }
};

/**
 * Logger
 * Implemented using the functions found in:
 * http://stackoverflow.com/a/13227808
 */
function Logger() {
    this._init.apply(this, arguments);
}

Logger.prototype = {
    _init: function(aDisplayName, aVerbose, aSuperfluousCalls = 3) {
        this._verbose = aVerbose;
        this._superfluous = aSuperfluousCalls;
        this.base_message = "[" + aDisplayName + "::%s]%s";
    },

    _log: function(aLevel, aMsg, aIsRuntime) {
        if (typeof aMsg === "object") {
            /* NOTE: Logging function in global can handle objects.
             */
            global[aLevel](this.base_message.format(
                aIsRuntime ? "" : this._getCaller(),
                this._formatMessage("")
            ));
            global[aLevel](aMsg);
        } else {
            global[aLevel](this.base_message.format(
                aIsRuntime ? "" : this._getCaller(),
                this._formatMessage(aMsg)
            ));
        }
    },

    /**
     * runtime_error
     *
     * Log a message without specifying the caller.
     *
     * @param  {String} aMsg The message to log.
     */
    runtime_error: function(aMsg) {
        this._log("logError", aMsg, true);
    },

    /**
     * runtime_info
     *
     * Log a message without specifying the caller.
     *
     * @param  {String} aMsg The message to log.
     */
    runtime_info: function(aMsg) {
        this._log("log", aMsg, true);
    },

    /**
     * debug
     *
     * Log a message only when verbose logging is enabled.
     *
     * @param  {String} aMsg The message to log.
     */
    debug: function(aMsg) {
        if (this.verbose) {
            this._log("log", aMsg);
        }
    },

    /**
     * error
     *
     * Log an error message.
     *
     * @param  {String} aMsg The message to log.
     */
    error: function(aMsg) {
        this._log("logError", aMsg);
    },

    /**
     * warning
     *
     * Log a warning message.
     *
     * @param  {String} aMsg The message to log.
     */
    warning: function(aMsg) {
        this._log("logWarning", aMsg);
    },

    /**
     * info
     *
     * Log an info message.
     *
     * @param {String} aMsg - The message to log.
     */
    info: function(aMsg) {
        this._log("log", aMsg);
    },

    /**
     * _formatMessage
     *
     * It just adds a space at the beginning of a string if the string isn't empty.
     *
     * @param  {String} aMsg The message to "format".
     * @return {String}      The formatted message.
     */
    _formatMessage: function(aMsg) {
        return aMsg ? " " + aMsg : "";
    },

    /**
     * [_getCaller description]
     * @return {String} A string representing the caller function name plus the
     * file name and line number.
     */
    _getCaller: function() {
        let stack = this._getStack();

        // Remove superfluous function calls on stack
        stack.shift(); // _getCaller --> _getStack
        stack.shift(); // debug --> _getCaller

        let caller = stack[0].split("/");
        // Return only the caller function and the file name and line number.
        return (caller.shift() + "@" + caller.pop()).replace(/\@+/g, "@");
    },

    _getStack: function() {
        // Save original Error.prepareStackTrace
        let origPrepareStackTrace = Error.prepareStackTrace;

        // Override with function that just returns `stack`
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };

        // Create a new `Error`, which automatically gets `stack`
        let err = new Error();

        // Evaluate `err.stack`, which calls our new `Error.prepareStackTrace`
        let stack = err.stack.split("\n");

        // Restore original `Error.prepareStackTrace`
        Error.prepareStackTrace = origPrepareStackTrace;

        // Remove superfluous function call on stack
        // stack.shift(); // getStack --> Error
        // stack.shift(); // getStack --> Error
        // stack.shift(); // getStack --> Error

        let i = this._superfluous;
        while (i--) {
            stack.shift();
        }

        return stack;
    },

    get verbose() {
        return this._verbose;
    },

    set verbose(aVal) {
        this._verbose = aVal;
    }
};

/* exported _,
            ngettext,
            versionCompare,
            customNotify,
            saveToFileAsync,
            removeSurplusFilesFromDirectory,
            getGLibVersion,
            escapeHTML,
            prototypeDebugger
 */
