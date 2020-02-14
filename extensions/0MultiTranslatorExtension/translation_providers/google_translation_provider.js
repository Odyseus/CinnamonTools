let $,
    GlobalUtils,
    Constants;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
    GlobalUtils = require("./globalUtils.js");
    Constants = require("./constants.js");
} else {
    $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
    GlobalUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].globalUtils;
    Constants = imports.ui.extensionSystem.extensions["{{UUID}}"].constants;
}

const {
    Languages
} = Constants;

const {
    _,
    escapeHTML
} = GlobalUtils;

const LABELS = {
    definitions: _("Definitions"),
    synonyms: _("Synonyms"),
    examples: _("Examples"),
    seeAlso: _("See also"),
    didYouMean: _("Did you mean:"),
    showingTransFor: _("Showing translation for:")
};

const RESPONSE_INDEX_MAP = {
    possibleMistakes: 7,
    phonetic: 2,
    originalLanguage: 2,
    confidence: 6,
    translation: 0,
    genderSpecific: 18,
    allTranslations: 1,
    definitions: 12,
    synonyms: 11,
    examples: 13,
    seeAlso: 14
};

const DATA_LIST = [
    "possibleMistakes",
    "phonetic",
    "originalLanguage",
    "confidence",
    "translation",
    "genderSpecific",
    "allTranslations",
    "definitions",
    "synonyms",
    "examples",
    "seeAlso"
];

function Translator() {
    this._init.apply(this, arguments);
}

Translator.prototype = {
    __proto__: $.TranslationProviderBase.prototype,

    _init: function(aExtension) {
        $.TranslationProviderBase.prototype._init.call(
            this,
            aExtension, {
                name: "Google.Translate",
                url: "https://translate.googleapis.com/translate_a/single?client=gtx&ie=UTF-8&oe=UTF-8&dt=bd&dt=ex&dt=ld&dt=md&dt=rw&dt=rm&dt=ss&dt=t&dt=at&dt=gt&dt=qca&sl=%s&tl=%s&q=%s",
                headers: {
                    "user-agent": "Mozilla/5.0",
                    "Referer": "https://translate.google.com/",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );
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

    parseResponse: function(aResponseData, aSourceText, aSourceLangCode, aTargetLangCode) {
        try {
            let response = JSON.parse(aResponseData);
            let extraData = {
                sourceLangCode: aSourceLangCode,
                targetLangCode: aTargetLangCode
            };
            let msg = "";

            msg += aSourceText + "\n";

            /* NOTE: Parse one segment at a time and fail gracefully.
             */
            let i = 0,
                iLen = DATA_LIST.length;
            for (; i < iLen; i++) {
                msg += this._parseMessageFragment(DATA_LIST[i], response, extraData);
            }

            /* NOTE: Clean up multiple blank lines leaving only one blank line.
             */
            msg = msg.replace(/\n\s*\n/g, "\n\n");

            return {
                detectedLang: response[2] || "?",
                message: msg
            };
        } catch (aErr) {
            global.logError("%s %s: %s".format(
                this.params.name,
                _("Error"),
                String(aErr)
            ));
            global.logError("Response data");
            global.logError(JSON.stringify(aResponseData, null, "\t"));

            return {
                message: _("Error translating text! A detailed error has been logged.")
            };
        }
    },

    _parseMessageFragment: function(aDataType, aResponse, aExtraData) {
        let translation = null;
        let fragment = "";
        let sectionTitleTemplate = "<b>%s</b>\n%s\n\n";

        try {
            switch (aDataType) {
                case "phonetic":
                    translation = aResponse[RESPONSE_INDEX_MAP.translation];
                    let transLen = translation.length;

                    if (translation) {
                        if (transLen > 1 && translation[transLen - 1][3]) {
                            fragment += "/%s/".format(translation[transLen - 1][3]);
                        }
                    }
                    break;
                case "originalLanguage":
                    let originalLanguage = aResponse[RESPONSE_INDEX_MAP.originalLanguage] ||
                        aExtraData.sourceLangCode;
                    let confidence = aResponse[RESPONSE_INDEX_MAP.confidence];
                    fragment += escapeHTML("[ %s -> %s ] %s%\n\n".format(
                        (originalLanguage in Languages) ?
                        Languages[originalLanguage] :
                        originalLanguage,
                        (aExtraData.targetLangCode in Languages) ?
                        Languages[aExtraData.targetLangCode] :
                        aExtraData.targetLangCode,
                        String(Math.round(confidence * 100) || "?")
                    ));
                    break;
                case "translation":
                    translation = aResponse[RESPONSE_INDEX_MAP.translation];
                    let transStr = "";

                    if (!translation || translation.length === 0) {
                        break;
                    }

                    if (translation) {
                        let i = 0,
                            iLen = translation.length;
                        for (; i < iLen; i++) {
                            if (translation[i] && translation[i][0]) {
                                transStr += translation[i][0];
                            }
                        }
                    }

                    if (transStr) {
                        fragment += "<b>%s</b>".format(transStr);
                    }
                    break;
                case "genderSpecific":
                    let genderSpecific = aResponse[RESPONSE_INDEX_MAP.genderSpecific];

                    if (!genderSpecific || genderSpecific.length === 0) {
                        break;
                    }

                    genderSpecific = genderSpecific[0];

                    if (genderSpecific) {
                        fragment += "(♀) <b>%s</b>\n".format(genderSpecific[1][1]);
                        fragment += "(♂) <b>%s</b>\n".format(genderSpecific[0][1]);
                    }
                    break;
                case "allTranslations":
                    let allTranslations = aResponse[RESPONSE_INDEX_MAP.allTranslations];

                    if (!allTranslations) {
                        break;
                    }

                    if (allTranslations) {
                        let allTransList = "\n";

                        for (let trans of allTranslations) {
                            if (trans[2]) {
                                allTransList += trans[0] + "\n";

                                let l = 0,
                                    lLen = trans[2].length;
                                for (; l < lLen; l++) {
                                    allTransList += "\t<b>%s</b>".format(trans[2][l][0]) +
                                        "\n\t- " + trans[2][l][1].join("; ") + "\n\n";
                                }
                            } else {
                                allTransList += trans[0] +
                                    "\n\t" + trans[1].join("; ") + "\n" +
                                    (trans[3] ? "\t- " + trans[3] : "") + "\n\n";
                            }
                        }

                        fragment += allTransList;
                    }
                    break;
                case "definitions":
                    let definitions = aResponse[RESPONSE_INDEX_MAP.definitions];

                    if (!definitions || definitions.length === 0) {
                        break;
                    }

                    let d = 0,
                        dLen = definitions.length;

                    if (dLen > 0) {
                        let defList = "";
                        for (; d < dLen; d++) {
                            let def = definitions[d];

                            if (def[1]) {
                                let l = 0,
                                    lLen = def[1].length;
                                for (; l < lLen; l++) {
                                    defList += def[0] +
                                        "\n\t <b>%s</b>".format(def[1][l][0]) +
                                        (def[1][l][2] && '\n\t- "%s"'.format(def[1][l][2])) +
                                        "\n\n";
                                }
                            }
                        }

                        if (defList) {
                            fragment += sectionTitleTemplate.format(
                                LABELS.definitions,
                                defList
                            );
                        }
                    }
                    break;
                case "synonyms":
                    let synonyms = aResponse[RESPONSE_INDEX_MAP.synonyms];

                    if (!synonyms || synonyms.length === 0) {
                        break;
                    }

                    let s = 0,
                        sLen = synonyms.length;

                    if (sLen > 0) {
                        let synList = "";
                        for (; s < sLen; s++) {
                            let def = synonyms[s];

                            if (def[1]) {
                                let l = 0,
                                    lLen = def[1].length;
                                for (; l < lLen; l++) {
                                    synList += def[0] +
                                        "\n\t- " + def[1][l][0].join("; ") +
                                        "\n\n";
                                }
                            }
                        }

                        if (synList) {
                            fragment += sectionTitleTemplate.format(
                                LABELS.synonyms,
                                synList
                            );
                        }
                    }
                    break;
                case "examples":
                    let examples = aResponse[RESPONSE_INDEX_MAP.examples];

                    if (!examples || examples.length === 0) {
                        break;
                    }

                    examples = examples[0];

                    let exList = "";

                    if (examples) {
                        let i = 0,
                            iLen = examples.length;
                        for (; i < iLen; i++) {
                            if (examples[i][0]) {
                                exList += "\t- " + examples[i][0] + "\n\n";
                            }
                        }

                        if (exList) {
                            fragment += sectionTitleTemplate.format(
                                LABELS.examples,
                                exList
                            );
                        }
                    }
                    break;
                case "seeAlso":
                    let seeAlso = aResponse[RESPONSE_INDEX_MAP.seeAlso];

                    if (!seeAlso || seeAlso.length === 0) {
                        break;
                    }

                    fragment += sectionTitleTemplate.format(
                        LABELS.seeAlso,
                        "\t- " + seeAlso[0].join(", ")
                    );
                    break;
                case "possibleMistakes":
                    let possibleMistakes = aResponse[RESPONSE_INDEX_MAP.possibleMistakes];

                    if (!possibleMistakes || possibleMistakes.length === 0) {
                        break;
                    }

                    fragment += "\n\n%s %s\n\n".format(
                        possibleMistakes[5] ?
                        LABELS.showingTransFor :
                        LABELS.didYouMean,
                        possibleMistakes[0]
                    );
                    break;
            }
        } catch (aErr) {
            if ($.Debugger.debugger_enabled) {
                global.logError(aErr);

                let data = aResponse[RESPONSE_INDEX_MAP[aDataType]];

                if (data) {
                    global.logError("typeof data = " + typeof data);
                    global.logError("Array.isArray(data) = " + Array.isArray(data));
                    global.logError("_parseMessageFragment error for data type: " +
                        aDataType + " = " + JSON.stringify(data, null, "\t"));
                }
            }
        }

        return fragment + "\n\n";
    }
};
