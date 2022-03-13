const $ = require("js_modules/utils.js");

var Translator = class Translator extends $.TranslateShellBaseTranslator {
    constructor(aExtension) {
        super(aExtension, {
            name: "Google.TranslateTS",
            ts_engine_name: "google",
            char_limit: 5000
        });
    }
};

/* exported Translator
 */
