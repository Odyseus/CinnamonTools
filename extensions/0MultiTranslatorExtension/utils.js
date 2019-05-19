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
        Clutter,
        Gio,
        GLib,
        Gtk,
        Pango,
        Soup,
        St
    },
    misc: {
        util: Util,
        params: Params
    },
    signals: Signals,
    ui: {
        main: Main,
        messageTray: MessageTray,
        tooltips: Tooltips
    }
} = imports;

const _httpSession = new Soup.SessionAsync();

const {
    _,
    NotificationUrgency,
    Languages,
    DEFAULT_ENGINES,
    KnownStatusCodes,
    LoggingLevel,
    TRANSLATION_PROVIDER_PARAMS,
    Settings
} = Constants;

let Gst;

try {
    imports.gi.versions.Gst = "1.0";
    Gst = imports.gi.Gst;
} catch (aErr) {
    global.logError(aErr);
}

Soup.Session.prototype.add_feature.call(
    _httpSession,
    new Soup.ProxyResolverDefault()
);
_httpSession.user_agent = "Mozilla/5.0";
_httpSession.timeout = 10;

if (Settings.pref_logging_level !== LoggingLevel.NORMAL) {
    const SoupLogger = Soup.Logger.new(Soup.LoggerLogLevel.HEADERS | Soup.LoggerLogLevel.BODY, -1);

    Soup.Session.prototype.add_feature.call(
        _httpSession,
        SoupLogger
    );
    SoupLogger.set_printer(soupPrinter);
}

const ProxySettings = new Gio.Settings({
    schema_id: "org.gnome.system.proxy"
});

const ProxySettingsHTTP = new Gio.Settings({
    schema_id: "org.gnome.system.proxy.http"
});

function xdgOpen() {
    Util.spawn_async(["xdg-open"].concat(Array.prototype.slice.call(arguments)), null);
}

function getKeybindingDisplayName(aAccelString) {
    let text = "";

    if (aAccelString) {
        let [key, codes, mods] = Gtk.accelerator_parse_with_keycode(aAccelString);

        if (codes !== null && codes.length > 0) {
            text = Gtk.accelerator_get_label_with_keycode(null, key, codes[0], mods);
        }
    }

    return text;
}

function soupPrinter(aLog, aLevel = null, aDirection = null, aData = null) {
    if (aLevel && aDirection && aData) {
        global.log(String(aData));
    }
}

function getUIAnimationTime() {
    return Settings.pref_ui_animation_time === 0 ?
        0.01 :
        Settings.pref_ui_animation_time / 1000;
}

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

function startsWith(str1, str2) {
    return str1.slice(0, str2.length) === str2;
}

function endsWith(str1, str2) {
    return str1.slice(-str2.length) === str2;
}

function escapeHTML(aStr) {
    return aStr.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getFilesInDir(path) {
    let dir = Gio.file_new_for_path(path);
    let file_enum,
        info;
    let result = [];

    try {
        file_enum = dir.enumerate_children(
            "standard::*",
            Gio.FileQueryInfoFlags.NONE,
            null
        );
    } catch (aErr) {
        global.logError(aErr);
        return false;
    }

    while ((info = file_enum.next_file(null)) !== null) {
        let file_type = info.get_file_type();

        if (file_type !== Gio.FileType.REGULAR) {
            continue;
        }

        let file_name = info.get_name();
        result.push(file_name);
    }

    file_enum.close(null);

    return result;
}

function getUnichar(keyval) {
    let ch = Clutter.keysym_to_unicode(keyval);

    if (ch) {
        return String.fromCharCode(ch);
    } else {
        return false;
    }
}

// http://stackoverflow.com/a/7654602
var asyncLoop = function(o) {
    let i = -1;

    let loop = function() {
        i++;
        if (i === o.length) {
            o.callback();
            return;
        }
        o.functionToLoop(loop, i);
    };

    loop(); // init
};

function replaceAll(str, find, replace) {
    try {
        return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
    } catch (aErr) {
        return aErr;
    }
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function getKeyByValue(aObj, aValue) {
    for (let key in aObj) {
        if (aObj.hasOwnProperty(key) && aObj[key] === aValue) {
            return key;
        }
    }

    return null;
}

function getEngineByName(aName, aEngines) {
    let i = aEngines.length;
    while (i--) {
        if (aEngines[i]["provider_name"] === aName) {
            return aEngines[i];
        }
    }

    return null;
}

/**
 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
 *
 * This function was born in http://stackoverflow.com/a/6832721.
 *
 * @param {string} v1 The first version to be compared.
 * @param {string} v2 The second version to be compared.
 * @param {object} [options] Optional flags that affect comparison behavior:
 * <ul>
 *     <li>
 *         <tt>lexicographical: true</tt> compares each part of the version strings lexicographically instead of
 *         naturally; this allows suffixes such as "b" or "dev" but will cause "1.10" to be considered smaller than
 *         "1.2".
 *     </li>
 *     <li>
 *         <tt>zeroExtend: true</tt> changes the result if one version string has less parts than the other. In
 *         this case the shorter string will be padded with "zero" parts instead of being considered smaller.
 *     </li>
 * </ul>
 * @returns {number|NaN}
 * <ul>
 *    <li>0 if the versions are equal</li>
 *    <li>a negative integer iff v1 < v2</li>
 *    <li>a positive integer iff v1 > v2</li>
 *    <li>NaN if either version string is in the wrong format</li>
 * </ul>
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

function getSelection(aCallback) {
    spawnWithCallback(
        null, ["xsel", "-o"],
        null,
        GLib.SpawnFlags.SEARCH_PATH,
        null,
        (aStandardOutput) => {
            // Remove possible "illegal" characters.
            let str = aStandardOutput;
            // Replace line breaks and duplicated white spaces with a single space.
            str = (str.replace(/\s+/g, " ")).trim();

            aCallback(str);

            if (Settings.pref_logging_level !== LoggingLevel.NORMAL) {
                global.log("\ngetSelection()>str:\n" + str);
            }
        }
    );
}

function checkDependencies() {
    Util.spawn_async([
            XletMeta.path + "/extensionHelper.py",
            "--check-dependencies"
        ],
        (aResponse) => {
            if (Settings.pref_logging_level !== LoggingLevel.NORMAL) {
                global.log("\ncheckDependencies()>aResponse:\n" + aResponse);
            }

            let res = (aResponse.split("<!--SEPARATOR-->")[1])
                // Preserve line breaks.
                .replace(/\n+/g, "<br>")
                .replace(/\s+/g, " ")
                .replace(/<br>/g, "\n");
            res = res.trim();

            if (res.length > 1) {
                global.logError(
                    "\n# [" + _(XletMeta.name) + "]" + "\n" +
                    "# " + _("Unmet dependencies found!!!") + "\n" +
                    res + "\n" +
                    "# " + _("Check this extension help file for instructions.") + "\n" +
                    "# " + _("It can be accessed from the translation dialog main menu.") + "\n" +
                    "# " + _("You will not see this notification again.")
                );
                informAboutMissingDependencies(res);
            } else {
                Main.notify(_(XletMeta.name), _("All dependencies seem to be met."));
            }

            Settings.pref_informed_about_dependencies = true;
        });
}

function informAboutMissingDependencies(aRes) {
    customNotify(
        _(XletMeta.name),
        escapeHTML(_("Unmet dependencies found!!!")) + "\n" +
        "<b>" + escapeHTML(aRes) + "</b>" + "\n\n" +
        escapeHTML(_("Check this extension help file for instructions.")) + "\n" +
        escapeHTML(_("This information has also been logged into the ~/.cinnamon/glass.log or ~/.xsession-errors files.")),
        "dialog-warning",
        NotificationUrgency.CRITICAL
    );
}

function customNotify(aTitle, aBody, aIconName = "dialog-info", aUrgency = NotificationUrgency.NORMAL, aButtons = []) {
    let icon = new St.Icon({
        icon_name: aIconName,
        icon_type: St.IconType.SYMBOLIC,
        icon_size: 24
    });
    let source = new MessageTray.SystemNotificationSource();
    Main.messageTray.add(source);
    let notification = new MessageTray.Notification(source, escapeHTML(aTitle), aBody, {
        icon: icon,
        bodyMarkup: true,
        titleMarkup: true,
        bannerMarkup: true
    });

    notification.setUrgency(aUrgency);
    notification.setTransient(false);
    notification.setResident(true);
    notification.connect("action-invoked", (aSource, aAction) => {
        switch (aAction) {
            case "dialog-information":
                xdgOpen(XletMeta.path + "/HELP.html");
                break;
        }
    });

    notification.addButton("dialog-information", _("Help"));

    for (let i = aButtons.length - 1; i >= 0; i--) {
        notification.addButton(aButtons[i].action, aButtons[i].label);
    }

    source.notify(notification);
}

function ProvidersManager() {
    this._init.apply(this, arguments);
}

ProvidersManager.prototype = {
    _init: function(aExtension) {
        this._extension = aExtension;
        this._translators = this._loadTranslators();
        this._default = this.getByName(Settings.pref_default_translator);
        this._current = this._default;
    },

    _loadTranslators: function() {
        let translator_module;
        let translators = [];
        let files_list = getFilesInDir(XletMeta.path + "/translation_providers");
        let translators_imports;

        if (typeof require !== "function") {
            translators_imports = imports.ui.extensionSystem.extensions[XletMeta.uuid].translation_providers;
        }

        let i = 0,
            iLen = files_list.length;
        for (; i < iLen; i++) {
            let file_name = files_list[i];

            if (!endsWith(file_name, "_translation_provider.js")) {
                continue;
            }

            // Mark for deletion on EOL. Cinnamon 3.6.x+
            if (typeof require === "function") {
                translator_module = require("./translation_providers/" + file_name);
            } else {
                /* NOTE: Remove file extension.
                 */
                translator_module = translators_imports[file_name.slice(0, -3)];
            }

            if (Settings.pref_logging_level === LoggingLevel.VERY_VERBOSE ||
                Settings.pref_debugger_enabled) {
                try {
                    prototypeDebugger(translator_module.Translator, {
                        /* NOTE: Remove the "_translation_provider.js" part of the file name.
                         */
                        objectName: "Translator(%s)".format(file_name.slice(0, -24)),
                        verbose: Settings.pref_logging_level === LoggingLevel.VERY_VERBOSE,
                        debug: Settings.pref_debugger_enabled
                    });
                } catch (aErr) {
                    global.logError(aErr);
                }
            }

            let translator = new translator_module.Translator(this._extension);

            translator.file_name = file_name;
            translators.push(translator);
        }

        return translators;
    },

    getByName: function(aName) {
        if (isBlank(aName)) {
            return false;
        }

        let i = 0,
            iLen = this._translators.length;
        for (; i < iLen; i++) {
            let translator = this._translators[i];

            if (translator.name.toLowerCase() === aName.toLowerCase()) {
                return translator;
            }
        }

        return false;
    },

    get current() {
        return this._current;
    },

    set current(aTransObjectOrName) {
        let name = aTransObjectOrName;
        let translator = aTransObjectOrName;

        if (aTransObjectOrName instanceof TranslationProviderBase) {
            name = aTransObjectOrName.name;
        } else {
            translator = this.getByName(name);
        }

        this._current = translator;

        Settings.pref_last_translator = name;
    },

    get last_used() {
        let name = Settings.pref_last_translator;
        let translator = this.getByName(name);

        if (!translator) {
            return false;
        }

        return translator;
    },

    get default() {
        return this._default;
    },

    get translators_names() {
        let result = [];

        let i = 0,
            iLen = this._translators.length;
        for (; i < iLen; i++) {
            result.push(this._translators[i].name);
        }

        return result;
    },

    get translators() {
        return this._translators;
    },

    get num_translators() {
        return this._translators.length;
    },

    destroy: function() {
        let i = 0,
            iLen = this._translators.length;
        for (; i < iLen; i++) {
            this._translators[i].destroy();
        }
    }
};

function LanguagesStats() {
    this._init.apply(this, arguments);
}

LanguagesStats.prototype = {
    _init: function() {
        // Mark for deletion on EOL. Cinnamon 3.6.x+
        // Replace JSON trick with Object.assign().
        this._storage = JSON.parse(JSON.stringify(Settings.pref_languages_stats));
    },

    increment: function(aroviderName, aType, aLangData) {
        let key_string = "%s-%s-%s".format(
            aroviderName,
            aType,
            aLangData.code
        );

        if (key_string in this._storage) {
            this._storage[key_string].count++;
        } else {
            let data = {
                lang_name: aLangData.name,
                lang_code: aLangData.code,
                count: 1
            };
            this._storage[key_string] = data;
        }

        this.save();
    },

    getNMostUsed: function(aProviderName, aType, aN) {
        aN = aN || 5;
        let key_string = "%s-%s".format(aProviderName, aType);
        let keys = Object.keys(this._storage);

        let filtered = keys.filter((key) => {
            if (this._storage[key].count <= 3) {
                return false;
            }
            return startsWith(key, key_string);
        });
        filtered.sort((a, b) => {
            return this._storage[b].count > this._storage[a].count;
        });

        let result = [];
        let i = 0,
            iLen = filtered.length;
        for (; i < iLen; i++) {
            if (i >= aN) {
                break;
            }

            // Mark for deletion on EOL. Cinnamon 3.6.x+
            // Replace JSON trick with Object.assign().
            let clone = JSON.parse(JSON.stringify(this._storage[filtered[i]]));
            result.push(clone);
        }

        return result.slice(0);
    },

    save: function() {
        Settings.pref_languages_stats = this._storage;
        this.emit("stats-changed");
    }
};
Signals.addSignalMethods(LanguagesStats.prototype);

function TranslationProviderBase() {
    this._init.apply(this, arguments);
}

TranslationProviderBase.prototype = {
    _init: function(aExtension, aParams) {
        this._extension = aExtension;
        this.params = Params.parse(aParams, TRANSLATION_PROVIDER_PARAMS);
    },

    get prefs() {
        if (!Settings.pref_translators_prefs.hasOwnProperty(this.name)) {
            let temp = getEngineByName(this.name, DEFAULT_ENGINES);
            temp["last_source"] = "";
            temp["last_target"] = "";

            Settings.pref_translators_prefs[this.name] = temp;
        }

        return Settings.pref_translators_prefs[this.name];
    },

    set prefs(aObj) {
        let s = JSON.parse(JSON.stringify(Settings.pref_translators_prefs));
        s[this.name][aObj.key] = aObj.val;
        Settings.pref_translators_prefs = s;
    },

    _getDataAsync: function(aURL, aCallback) {
        let request = Soup.Message.new("GET", aURL);

        if (this.params.headers) {
            for (let key in this.params.headers) {
                request.request_headers.append(key, this.params.headers[key]);
            }
        }

        _httpSession.queue_message(request,
            (aSession, aMessage) => {
                if (aMessage.status_code === Soup.KnownStatusCode.OK) {
                    try {
                        aCallback.call(this._extension, request.response_body.data);
                    } catch (aErr) {
                        global.logError(aErr);
                        aCallback.call(this._extension, String(aErr));
                    }
                } else {
                    aCallback.call(this._extension,
                        "%s %s: %s".format(_("Error getting data!"),
                            _("Status code"),
                            ((aMessage.status_code in KnownStatusCodes ?
                                KnownStatusCodes[aMessage.status_code] :
                                aMessage.status_code))
                        )
                    );

                    global.logError("Status code: " + aMessage.status_code);
                    global.logError("Response body data: " + aMessage.response_body.data);
                }
            }
        );
    },

    makeUrl: function(aSourceLangCode, aTargetLangCode, aText) {
        let result = "";

        switch (this.name) {
            case "Google.Translate":
                result = this.params.url.format(
                    aSourceLangCode,
                    aTargetLangCode,
                    encodeURIComponent(aText)
                );
                break;
            case "Yandex.Translate":
                result = this.params.url.format(
                    this.YandexAPIKey,
                    (aSourceLangCode === "auto" ? "" : aSourceLangCode + "-") + aTargetLangCode,
                    encodeURIComponent(aText)
                );
                break;
                // Not used for now
                // Google, Bing and Apertium all use translate-shell
            default:
                result = "";
                // result = this.params.url.format(
                //     (aSourceLangCode === "auto" ? "" : aSourceLangCode + "-") + aTargetLangCode,
                //     encodeURIComponent(aText)
                // );
                break;
        }

        return result;
    },

    getLanguages: function() {
        return Languages;
    },

    getLanguageName: function(aLangCode) {
        return Languages[aLangCode] || false;
    },

    getPairs: function(aLang) { // jshint ignore:line
        throw new Error(_("Not implemented"));
    },

    parseResponse: function(aResponseData, aText, aSourceLangCode, aTargetLangCode) { // jshint ignore:line
        /* NOTE: Each translator instance uses different arguments.
         * aResponseData: Is the data returned by the HTTP request.
         * aText: Is the text that needs to be translated.
         * aSourceLangCode: The source language code.
         * aTargetLangCode: The target language code.
         * aText, aSourceLangCode and aTargetLangCode are passed so in engines that are
         * a nightmare to parse (like Google Translate and its indecipherable response) one
         * doesn't have to hunt down data that already is known.
         */
        throw new Error(_("Not implemented"));
    },

    translate: function(aSourceLangCode, aTargetLangCode, aText, aCallback) {
        if (isBlank(aText)) {
            aCallback(false);
            return;
        }

        let url = this.makeUrl(aSourceLangCode, aTargetLangCode, aText);
        this._getDataAsync(url, (aResponseData) => {
            let data = this.parseResponse(aResponseData, aText, aSourceLangCode, aTargetLangCode);
            aCallback(data);
        });
    },

    get name() {
        return this.params.name;
    },

    get char_limit() {
        return this.params.char_limit * this.params.max_queries;
    }
};

function TranslateShellBaseTranslator() {
    this._init.apply(this, arguments);
}

TranslateShellBaseTranslator.prototype = {
    __proto__: TranslationProviderBase.prototype,

    _init: function(aExtension, aParams) {
        TranslationProviderBase.prototype._init.call(
            this,
            aExtension,
            aParams
        );

        this._results = [];
    },

    _splitText: function(aText) {
        let sentences = aText.match(this.params.sentences_regexp);

        if (sentences === null) {
            return false;
        }

        let temp = "";
        let result = [];

        for (let i = 0; i < sentences.length; i++) {
            let sentence = sentences[i];

            if (isBlank(sentence)) {
                temp += "\n";
                continue;
            }

            if (sentence.length + temp.length > this.char_limit) {
                result.push(temp);
                temp = sentence;
            } else {
                temp += sentence;
                if (i === (sentences.length - 1)) {
                    result.push(temp);
                }
            }
        }

        return result;
    },

    getPairs: function(aLang) { // jshint ignore:line
        let temp = {};

        for (let key in Languages) {
            if (key === "auto") {
                continue;
            }

            temp[key] = Languages[key];
        }

        return temp;
    },

    parseResponse: function(aStandardOutput) {
        /* NOTE: Reference extracted from translate-shell.
         *  AnsiCode["reset"]         = AnsiCode[0] = "\33[0m"
         *  AnsiCode["bold"]          = "\33[1m"
         *  AnsiCode["underline"]     = "\33[4m"
         *  AnsiCode["negative"]      = "\33[7m"
         *  AnsiCode["no bold"]       = "\33[22m"
         *  AnsiCode["no underline"]  = "\33[24m"
         *  AnsiCode["positive"]      = "\33[27m"
         *  AnsiCode["black"]         = "\33[30m"
         *  AnsiCode["red"]           = "\33[31m"
         *  AnsiCode["green"]         = "\33[32m"
         *  AnsiCode["yellow"]        = "\33[33m"
         *  AnsiCode["blue"]          = "\33[34m"
         *  AnsiCode["magenta"]       = "\33[35m"
         *  AnsiCode["cyan"]          = "\33[36m"
         *  AnsiCode["gray"]          = "\33[37m"
         *  AnsiCode["default"]       = "\33[39m"
         *  AnsiCode["dark gray"]     = "\33[90m"
         *  AnsiCode["light red"]     = "\33[91m"
         *  AnsiCode["light green"]   = "\33[92m"
         *  AnsiCode["light yellow"]  = "\33[93m"
         *  AnsiCode["light blue"]    = "\33[94m"
         *  AnsiCode["light magenta"] = "\33[95m"
         *  AnsiCode["light cyan"]    = "\33[96m"
         *  AnsiCode["white"]         = "\33[97m"
         */
        let stuff = {
            // Clean up all escape sequences.
            "\x1B[1m": "<b>",
            "\x1B[22m": "</b>",
            "\x1B[4m": "<u>",
            "\x1B[24m": "</u>",
            "\x1B[7m": "",
            "\x1B[27m": "",
            "\x1B[30m": "",
            "\x1B[31m": "",
            "\x1B[32m": "",
            "\x1B[33m": "",
            "\x1B[34m": "",
            "\x1B[35m": "",
            "\x1B[36m": "",
            "\x1B[37m": "",
            "\x1B[39m": "",
            "\x1B[90m": "",
            "\x1B[91m": "",
            "\x1B[92m": "",
            "\x1B[93m": "",
            "\x1B[94m": "",
            "\x1B[95m": "",
            "\x1B[96m": "",
            "\x1B[97m": "",
            // Just in case.
            "[\r\n]+": "\n",
        };
        try {
            for (let hex in stuff) {
                aStandardOutput = replaceAll(aStandardOutput, hex, stuff[hex]);
            }

            return aStandardOutput;
        } catch (aErr) {
            return "%s:\n%s\n%s:\n%s".format(
                _("Error while parsing data"),
                String(aErr),
                _("Data"),
                aStandardOutput
            );
        }
    },

    execTransShell: function(aSourceLang, aTargetLang, aText, aCallback) {
        let proxy = false;

        if (ProxySettings.get_string("mode") === "manual") {
            proxy = ProxySettingsHTTP.get_string("host").slice(1, -1);
            proxy += ":";
            proxy += ProxySettingsHTTP.get_int("port");
        }

        let command = ["trans"];
        let options = [
            "-e", this.params.ts_engine_name,
            "--show-languages", (aSourceLang === "auto" ? "y" : "n")
        ];
        options.concat(this.ts_extra_options);

        let subjects = [
            (aSourceLang === "auto" ? "" : aSourceLang) + ":" + aTargetLang,
            aText
        ];

        if (proxy) {
            options.push("-x");
            options.push(proxy);
        }

        spawnWithCallback(
            null, command.concat(options).concat(subjects),
            null,
            GLib.SpawnFlags.SEARCH_PATH,
            null,
            (aStandardOutput) => {
                aStandardOutput = this.parseResponse(aStandardOutput);

                aCallback(aStandardOutput);
            }
        );
    },

    translate: function(aSourceLang, aTargetLang, aText, aDisplayTranslationCallback) {
        /* NOTE: This might never trigger since translate is never called with
         * empty text. But it doesn't hurt to have it just in case. Furthermore,
         * I might want to add documents translation in the future (very green idea),
         * to the call to translate might not come from the dialog,
         * but from another mechanism.
         */
        if (isBlank(aText)) {
            aDisplayTranslationCallback(_("Nothing to translate"));
            return;
        }

        let splitted = this._splitText(aText);

        if (!splitted || splitted.length === 1) {
            if (splitted) {
                aText = splitted[0];
            }

            this.execTransShell(aSourceLang, aTargetLang, aText, (aData) => {
                aDisplayTranslationCallback.call(this._extension, aData);
            });
        } else {
            this._results = [];

            asyncLoop({
                length: splitted.length,
                functionToLoop: (aLoop, aIndex) => {
                    this.execTransShell(aSourceLang, aTargetLang, splitted[aIndex], (aData) => {
                        this._results.push(aData);
                        aLoop();
                    });
                },
                callback: () => {
                    aDisplayTranslationCallback.call(this._extension, this._results.join(" "));
                }
            });
        }
    }
};

function CustomTooltip() {
    this._init.apply(this, arguments);
}

CustomTooltip.prototype = {
    __proto__: Tooltips.Tooltip.prototype,

    _init: function(aActor, aText) {
        Tooltips.Tooltip.prototype._init.call(this, aActor, aText);

        this._tooltip.set_style("text-align: left;width:auto;max-width: 450px;");
        this._tooltip.get_clutter_text().set_line_wrap(true);
        this._tooltip.get_clutter_text().set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        this._tooltip.get_clutter_text().ellipsize = Pango.EllipsizeMode.NONE; // Just in case

        aActor.connect("destroy", () => this.destroy());
    },

    destroy: function() {
        Tooltips.Tooltip.prototype.destroy.call(this);
    }
};

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
        verbose: true,
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
                let now;

                if (options.verbose) {
                    now = GLib.get_monotonic_time();
                }

                if (options.debug) {
                    try {
                        val = aTarget.apply(aThisA, aArgs);
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                } else {
                    val = aTarget.apply(aThisA, aArgs);
                }

                if (options.verbose) {
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

if (Settings.pref_logging_level === LoggingLevel.VERY_VERBOSE || Settings.pref_debugger_enabled) {
    try {
        let protos = {
            CustomTooltip: CustomTooltip,
            LanguagesStats: LanguagesStats,
            TranslateShellBaseTranslator: TranslateShellBaseTranslator,
            TranslationProviderBase: TranslationProviderBase,
            ProvidersManager: ProvidersManager
        };

        for (let name in protos) {
            prototypeDebugger(protos[name], {
                objectName: name,
                verbose: Settings.pref_logging_level === LoggingLevel.VERY_VERBOSE,
                debug: Settings.pref_debugger_enabled
            });
        }
    } catch (aErr) {
        global.logError(aErr);
    }
}

// Combines the benefits of spawn sync (easy retrieval of output)
// with those of spawn_async (non-blocking execution).
// Based on https://github.com/optimisme/gjs-examples/blob/master/assets/spawn.js.
function spawnWithCallback(aWorkingDirectory, aArgv, aEnvp, aFlags, aChildSetup, aCallback) {
    let success, pid, stdinFile, stdoutFile, stderrFile;

    try {
        [success, pid, stdinFile, stdoutFile, stderrFile] = // jshint ignore:line
        GLib.spawn_async_with_pipes(aWorkingDirectory, aArgv, aEnvp, aFlags, aChildSetup);
    } catch (aErr) {
        global.logError(aErr);
        Main.criticalNotify(
            _(XletMeta.name),
            String(aErr).split("\n")[0]
        );
    }

    if (!success) {
        return;
    }

    GLib.close(stdinFile);

    let standardOutput = "";

    let stdoutStream = new Gio.DataInputStream({
        base_stream: new Gio.UnixInputStream({
            fd: stdoutFile
        })
    });

    readStream(stdoutStream, (aOutput) => {
        if (aOutput === null) {
            stdoutStream.close(null);
            aCallback(standardOutput);
        } else {
            standardOutput += aOutput;
        }
    });

    let standardError = "";

    let stderrStream = new Gio.DataInputStream({
        base_stream: new Gio.UnixInputStream({
            fd: stderrFile
        })
    });

    readStream(stderrStream, (aError) => {
        if (aError === null) {
            stderrStream.close(null);

            if (standardError) {
                global.logError(standardError);
                Main.criticalNotify(
                    _(XletMeta.name),
                    String(standardError).split("\n")[0]
                );
            }
        } else {
            standardError += aError;
        }
    });
}

function readStream(aStream, aCallback) {
    aStream.read_line_async(GLib.PRIORITY_LOW, null, (aSource, aResult) => {
        let [line] = aSource.read_line_finish(aResult);

        if (line === null) {
            aCallback(null);
        } else {
            aCallback(String(line) + "\n");
            readStream(aSource, aCallback);
        }
    });
}

/* exported getUnichar,
            xdgOpen,
            getKeybindingDisplayName,
            getUIAnimationTime,
            getKeyByValue,
            versionCompare,
            getSelection,
            checkDependencies,
            spawnWithCallback,
*/
