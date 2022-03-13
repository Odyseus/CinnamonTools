const $ = require("js_modules/utils.js");

var Translator = class Translator extends $.TranslateShellBaseTranslator {
    constructor(aExtension) {
        super(aExtension, {
            name: "Bing.TranslatorTS",
            ts_engine_name: "bing"
        });
    }
};

/* exported Translator
 */
