const $ = require("js_modules/utils.js");

var Translator = class Translator extends $.TranslateShellBaseTranslator {
    constructor(aExtension) {
        super(aExtension, {
            name: "Apertium.TS",
            ts_engine_name: "apertium",
            ts_extra_options: [
                "--show-original", "n",
                // If using these arguments with apertium, it gives blank translations.
                // "--show-prompt-message", "n",
                // "--no-bidi",
            ]
        });
    }
};

/* exported Translator
 */
