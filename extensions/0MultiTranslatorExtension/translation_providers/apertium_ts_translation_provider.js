//{{IMPORTER}}

const $ = __import("utils.js");

function Translator() {
    this._init.apply(this, arguments);
}

Translator.prototype = {
    __proto__: $.TranslateShellBaseTranslator.prototype,

    _init: function(aExtension) {
        $.TranslateShellBaseTranslator.prototype._init.call(
            this,
            aExtension, {
                name: "Apertium.TS",
                ts_engine_name: "apertium",
                ts_extra_options: [
                    "--show-original", "n",
                    // If using these arguments with apertium, it gives blank translations.
                    // "--show-prompt-message", "n",
                    // "--no-bidi",
                ]
            }
        );
    }
};
