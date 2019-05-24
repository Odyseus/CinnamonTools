let XletMeta,
    GlobalUtils,
    DebugManager,
    Constants,
    SpawnUtils,
    DesktopNotificationsUtils;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
    DebugManager = require("./debugManager.js");
    Constants = require("./constants.js");
    SpawnUtils = require("./spawnUtils.js");
    DesktopNotificationsUtils = require("./desktopNotificationsUtils.js");
} else {
    GlobalUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].globalUtils;
    DebugManager = imports.ui.extensionSystem.extensions["{{UUID}}"].debugManager;
    Constants = imports.ui.extensionSystem.extensions["{{UUID}}"].constants;
    SpawnUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].spawnUtils;
    DesktopNotificationsUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].desktopNotificationsUtils;
}

const {
    gi: {
        Clutter,
        Gio,
        GLib,
        Soup
    },
    misc: {
        util: Util,
        params: Params
    },
    signals: Signals
} = imports;

const _httpSession = new Soup.SessionAsync();

const {
    Languages,
    DEFAULT_ENGINES,
    KnownStatusCodes,
    TRANSLATION_PROVIDER_PARAMS,
    TRANS_SHELL_REPLACEMENT_DATA,
    Settings
} = Constants;

const {
    _,
    xdgOpen,
    escapeHTML,
    isBlank,
    tokensReplacer
} = GlobalUtils;

const {
    LoggingLevel,
    prototypeDebugger
} = DebugManager;

const {
    CustomNotification,
    NotificationUrgency
} = DesktopNotificationsUtils;

const OutputReader = new SpawnUtils.SpawnReader();

let Gst;

try {
    imports.gi.versions.Gst = "1.0";
    Gst = imports.gi.Gst;
} catch (aErr) {
    global.logError(aErr);
}

if (Settings.pref_logging_level === LoggingLevel.VERY_VERBOSE || Settings.pref_debugger_enabled) {
    try {
        let protos = {
            CustomNotification: CustomNotification,
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

var Notification = new CustomNotification({
    title: escapeHTML(_(XletMeta.name)),
    defaultButtons: [{
        action: "dialog-information",
        label: escapeHTML(_("Help"))
    }],
    actionInvokedCallback: (aSource, aAction) => {
        switch (aAction) {
            case "dialog-information":
                xdgOpen(XletMeta.path + "/HELP.html");
                break;
        }
    }
});

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

function getSelection(aCallback) {
    OutputReader.spawn(
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
                Notification.notify(escapeHTML(_("All dependencies seem to be met.")));
            }

            Settings.pref_informed_about_dependencies = true;
        });
}

function informAboutMissingDependencies(aRes) {
    Notification.notify([
            escapeHTML(_("Unmet dependencies found!!!")),
            "<b>" + escapeHTML(aRes) + "</b>",
            escapeHTML(_("Check this extension help file for instructions.")),
            escapeHTML(_("This information has also been logged into the ~/.cinnamon/glass.log or ~/.xsession-errors files."))
        ],
        NotificationUrgency.CRITICAL
    );
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

            if (!file_name.endsWith("_translation_provider.js")) {
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
            return key.startsWith(key_string);
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
        try {
            return tokensReplacer(aStandardOutput, TRANS_SHELL_REPLACEMENT_DATA);
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

        OutputReader.spawn(
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

/* exported getUnichar,
            getUIAnimationTime,
            getKeyByValue,
            getSelection,
            checkDependencies,
*/
