const $ = require("js_modules/utils.js");

var Translator = class Translator extends $.TranslationProviderBase {
    constructor(aExtension) {
        super(aExtension, {
            name: "Yandex.TranslateTS",
            ts_engine_name: "yandex"
        });
    }
};

/* exported Translator
 */
