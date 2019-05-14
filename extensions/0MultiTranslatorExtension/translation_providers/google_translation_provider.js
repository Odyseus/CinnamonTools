let $,
    constants;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
    constants = require("./constants.js");
} else {
    $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
    constants = imports.ui.extensionSystem.extensions["{{UUID}}"].constants;
}

const {
    _,
    Languages
} = constants;

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
                url: "https://translate.googleapis.com/translate_a/single?client=gtx&sl=%s&tl=%s&dt=t&q=%s",
                headers: {
                    "user-agent": "Mozilla/5.0",
                    "Referer": "https://translate.google.com/",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );
    },

    getPairs: function(language) { // jshint ignore:line
        let temp = {};

        for (let key in Languages) {
            if (key === "auto") {
                continue;
            }

            temp[key] = Languages[key];
        }

        return temp;
    },

    parseResponse: function(aResponseData) {
        let result = {},
            json,
            transText,
            detectedLang;

        try {
            json = JSON.parse(aResponseData.replace(/,+/g, ","));

            if (json[0].length > 1) {
                let i = 0,
                    iLen = json[0].length;
                for (; i < iLen; i++) {
                    transText += (json[0][i][0]).trim() + " ";
                }
            } else {
                transText = json[0][0][0];
            }

            if (this._extension.current_source_lang === "auto") {
                detectedLang = result[1] ? result[1] : "?";
            } else {
                detectedLang = this._extension.current_source_lang;
            }

            result = {
                detectedLang: detectedLang,
                message: transText
            };
        } catch (aErr) {
            global.logError("%s %s: %s".format(
                this.params.name,
                _("Error"),
                JSON.stringify(aErr, null, "\t")
            ));
            result = {
                message: _("Can't translate text, please try later.")
            };
        }

        return result;
    }
};
