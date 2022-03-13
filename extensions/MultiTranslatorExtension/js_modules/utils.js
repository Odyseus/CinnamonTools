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
    EXTENSION_PREFS,
    KnownStatusCodes,
    TranslationProviderParams,
    TRANS_SHELL_REPLACEMENT_DATA
} = require("js_modules/constants.js");

const {
    _,
    arrayEach,
    escapeHTML,
    isBlank,
    launchUri,
    tokensReplacer,
    tryFn
} = require("js_modules/globalUtils.js");

const {
    DebugManager,
    LoggingLevel,
    methodWrapper
} = require("js_modules/debugManager.js");

const {
    CustomNotification,
    NotificationUrgency
} = require("js_modules/notificationsUtils.js");

const {
    SpawnReader
} = require("js_modules/spawnUtils.js");

const {
    File
} = require("js_modules/customFileUtils.js");

const {
    CustomExtensionSettings
} = require("js_modules/extensionsUtils.js");

var Settings = new CustomExtensionSettings(EXTENSION_PREFS);

const OutputReader = new SpawnReader({
    flags: GLib.SpawnFlags.SEARCH_PATH
});

var Debugger = new DebugManager(`org.cinnamon.extensions.${__meta.uuid}`);

let Gst;

try {
    imports.gi.versions.Gst = "1.0";
    Gst = imports.gi.Gst;
} catch (aErr) {
    global.logError(aErr);
}

Debugger.wrapObjectMethods({
    CustomNotification: CustomNotification
});

Soup.Session.prototype.add_feature.call(
    _httpSession,
    new Soup.ProxyResolverDefault()
);
_httpSession.user_agent = "Mozilla/5.0";
_httpSession.timeout = 10;

if (Debugger.logging_level !== LoggingLevel.NORMAL) {
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
    title: escapeHTML(_(__meta.name)),
    default_buttons: [{
        action: "dialog-information",
        label: escapeHTML(_("Help"))
    }],
    action_invoked_callback: (aSource, aAction) => {
        switch (aAction) {
            case "dialog-information":
                launchUri(`${__meta.path}/HELP.html`);
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
    return Settings.ui_animation_time === 0 ?
        0.01 :
        Settings.ui_animation_time / 1000;
}

function getUnichar(keyval) {
    const ch = Clutter.keysym_to_unicode(keyval);

    if (ch) {
        return String.fromCharCode(ch);
    } else {
        return false;
    }
}

// http://stackoverflow.com/a/7654602
var asyncLoop = function(o) {
    let i = -1;

    const loop = function() {
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
    for (const key in aObj) {
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
    OutputReader.spawn(null, ["xsel", "-o"], null, (aStandardOutput) => {
        // Remove possible "illegal" characters.
        let str = aStandardOutput;
        // Replace line breaks and duplicated white spaces with a single space.
        str = (str.replace(/\s+/g, " ")).trim();

        aCallback(str);

        if (Debugger.logging_level !== LoggingLevel.NORMAL) {
            global.log("\ngetSelection()>str:\n" + str);
        }
    });
}

function checkDependencies() {
    Util.spawn_async([
            `${__meta.path}/extensionHelper.py`,
            "--check-dependencies"
        ],
        (aResponse) => {
            if (Debugger.logging_level !== LoggingLevel.NORMAL) {
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
                    "\n# [" + _(__meta.name) + "]" + "\n" +
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

            Settings.informed_about_dependencies = true;
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

var ProvidersManager = class ProvidersManager {
    constructor(aExtension) {
        this._extension = aExtension;
        this._providersDir = new File(`${__meta.path}/js_modules/translation_providers`);
        this.translatorsSet = false;
        this._translators = [];
        this._loadTranslators();
        this._default = false;
        this._current = false;
    }

    _loadTranslators() {
        this._providersDir.listDir().then((aParams) => {
            const allFileNames = aParams.files_info.map((aFileInfo) => {
                return `${aFileInfo.get_name()}`;
            });

            tryFn(() => {
                for (const file_name of allFileNames) {
                    if (!file_name.endsWith("_translation_provider.js")) {
                        continue;
                    }

                    const translator_module = require(`js_modules/translation_providers/${file_name}`);

                    if (Debugger.logging_level === LoggingLevel.VERY_VERBOSE ||
                        Debugger.debugger_enabled) {
                        try {
                            methodWrapper(translator_module.Translator, {
                                /* NOTE: Remove the "_translation_provider.js" part of the file name.
                                 */
                                object_name: "Translator(%s)".format(file_name.slice(0, -24)),
                                verbose: Debugger.logging_level === LoggingLevel.VERY_VERBOSE,
                                debug: Debugger.debugger_enabled
                            });
                        } catch (aErr) {
                            global.logError(aErr);
                        }
                    }

                    const translator = new translator_module.Translator(this._extension);

                    translator.file_name = file_name;
                    this._translators.push(translator);
                }
            }, (aErr) => {
                global.logError(aErr);
            }, () => {
                this.translatorsSet = true;
                this._default = this.getByName(Settings.default_translator);
                this._current = this._default;
            });
        }).catch((aErr) => {
            this.translatorsSet = true;
            global.logError(aErr);
        });
    }

    getByName(aName) {
        if (isBlank(aName)) {
            return false;
        }

        let i = 0,
            iLen = this._translators.length;
        for (; i < iLen; i++) {
            const translator = this._translators[i];

            if (translator.name.toLowerCase() === aName.toLowerCase()) {
                return translator;
            }
        }

        return false;
    }

    get current() {
        return this._current;
    }

    set current(aTransObjectOrName) {
        let name = aTransObjectOrName;
        let translator = aTransObjectOrName;

        if (aTransObjectOrName instanceof TranslationProviderBase) {
            name = aTransObjectOrName.name;
        } else {
            translator = this.getByName(name);
        }

        this._current = translator;

        Settings.last_translator = name;
    }

    get last_used() {
        const name = Settings.last_translator;
        const translator = this.getByName(name);

        if (!translator) {
            return false;
        }

        return translator;
    }

    get default() {
        return this._default;
    }

    get translators_names() {
        const result = [];

        for (const translator of this._translators) {
            result.push(translator.name);
        }

        return result;
    }

    get translators() {
        return this._translators;
    }

    get num_translators() {
        return this._translators.length;
    }

    destroy() {
        for (const translator of this._translators) {
            translator.destroy();
        }

        this._providersDir && this._providersDir.destroy();
    }
};

var LanguagesStats = class LanguagesStats {
    constructor() {
        // Stick with the JSON trick. Do not use Object.assign().
        this._storage = JSON.parse(JSON.stringify(Settings.languages_stats));
    }

    increment(aroviderName, aType, aLangData) {
        const key_string = "%s-%s-%s".format(
            aroviderName,
            aType,
            aLangData.code
        );

        if (key_string in this._storage) {
            this._storage[key_string].count++;
        } else {
            const data = {
                lang_name: aLangData.name,
                lang_code: aLangData.code,
                count: 1
            };
            this._storage[key_string] = data;
        }

        this.save();
    }

    getNMostUsed(aProviderName, aType, aN) {
        aN = aN || 5;
        const key_string = "%s-%s".format(aProviderName, aType);
        const keys = Object.keys(this._storage);

        const filtered = keys.filter((key) => {
            if (this._storage[key].count <= 3) {
                return false;
            }
            return key.startsWith(key_string);
        });
        filtered.sort((a, b) => {
            return this._storage[b].count > this._storage[a].count;
        });

        const result = [];

        arrayEach(filtered, (aLang, aIdx) => {
            if (aIdx >= aN) {
                return false;
            }

            // Stick with the JSON trick. Do not use Object.assign().
            const clone = JSON.parse(JSON.stringify(this._storage[aLang]));
            result.push(clone);

            return true;
        });

        return result.slice(0);
    }

    save() {
        Settings.languages_stats = this._storage;
        this.emit("stats-changed");
    }
};
Signals.addSignalMethods(LanguagesStats.prototype);

var TranslationProviderBase = class TranslationProviderBase {
    constructor(aExtension, aParams) {
        this._extension = aExtension;
        this.params = Params.parse(aParams, TranslationProviderParams);
    }

    get prefs() {
        if (!Settings.translators_prefs.hasOwnProperty(this.name)) {
            const temp = getEngineByName(this.name, DEFAULT_ENGINES);
            temp["last_source"] = "";
            temp["last_target"] = "";

            Settings.translators_prefs[this.name] = temp;
        }

        return Settings.translators_prefs[this.name];
    }

    set prefs(aObj) {
        const s = JSON.parse(JSON.stringify(Settings.translators_prefs));
        s[this.name][aObj.key] = aObj.val;
        Settings.translators_prefs = s;
    }

    _getDataAsync(aURL, aCallback) {
        const request = Soup.Message.new("GET", aURL);

        if (this.params.headers) {
            for (const key in this.params.headers) {
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
    }

    makeUrl(aSourceLangCode, aTargetLangCode, aText) {
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
    }

    getLanguages() {
        return Languages;
    }

    getLanguageName(aLangCode) {
        return Languages[aLangCode] || false;
    }

    getPairs(aLang) { // jshint ignore:line
        throw new Error(_("Not implemented"));
    }

    parseResponse(aResponseData, aText, aSourceLangCode, aTargetLangCode) { // jshint ignore:line
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
    }

    translate(aSourceLangCode, aTargetLangCode, aText, aCallback) {
        if (isBlank(aText)) {
            aCallback(false);
            return;
        }

        const url = this.makeUrl(aSourceLangCode, aTargetLangCode, aText);
        this._getDataAsync(url, (aResponseData) => {
            const data = this.parseResponse(aResponseData, aText, aSourceLangCode, aTargetLangCode);
            aCallback(data);
        });
    }

    get name() {
        return this.params.name;
    }

    get char_limit() {
        return this.params.char_limit * this.params.max_queries;
    }
};

var TranslateShellBaseTranslator = class TranslateShellBaseTranslator extends TranslationProviderBase {
    constructor(aExtension, aParams) {
        super(aExtension, aParams);

        this._results = [];
    }

    _splitText(aText) {
        const sentences = aText.match(this.params.sentences_regexp);

        if (sentences === null) {
            return false;
        }

        let temp = "";
        const result = [];

        arrayEach(sentences, (aSentence, aIdx) => {
            if (isBlank(aSentence)) {
                temp += "\n";
                return;
            }

            if (aSentence.length + temp.length > this.char_limit) {
                result.push(temp);
                temp = aSentence;
            } else {
                temp += aSentence;
                if (aIdx === (sentences.length - 1)) {
                    result.push(temp);
                }
            }
        });

        return result;
    }

    getPairs(aLang) { // jshint ignore:line
        const temp = {};

        for (const key in Languages) {
            if (key === "auto") {
                continue;
            }

            temp[key] = Languages[key];
        }

        return temp;
    }

    parseResponse(aStandardOutput) {
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
    }

    execTransShell(aSourceLang, aTargetLang, aText, aCallback) {
        let proxy = false;

        if (ProxySettings.get_string("mode") === "manual") {
            proxy = ProxySettingsHTTP.get_string("host").slice(1, -1);
            proxy += ":";
            proxy += ProxySettingsHTTP.get_int("port");
        }

        const command = ["trans"];
        const options = [
            "-e", this.params.ts_engine_name,
            "--show-languages", (aSourceLang === "auto" ? "y" : "n"),
            ...this.ts_extra_options
        ];

        const subjects = [
            (aSourceLang === "auto" ? "" : aSourceLang) + ":" + aTargetLang,
            aText
        ];

        if (proxy) {
            options.push("-x");
            options.push(proxy);
        }

        OutputReader.spawn(null, [...command, ...options, ...subjects], null, (aStandardOutput) => {
            aStandardOutput = this.parseResponse(aStandardOutput);

            aCallback(aStandardOutput);
        });
    }

    translate(aSourceLang, aTargetLang, aText, aDisplayTranslationCallback) {
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

        const splitted = this._splitText(aText);

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

Debugger.wrapObjectMethods({
    LanguagesStats: LanguagesStats,
    TranslateShellBaseTranslator: TranslateShellBaseTranslator,
    TranslationProviderBase: TranslationProviderBase,
    ProvidersManager: ProvidersManager
});

/* exported getUnichar,
            getUIAnimationTime,
            getKeyByValue,
            getSelection,
            checkDependencies,
*/
