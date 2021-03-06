// {{IMPORTER}}

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
                name: "Google.TranslateTS",
                ts_engine_name: "google",
                char_limit: 5000
            });
    }
};
