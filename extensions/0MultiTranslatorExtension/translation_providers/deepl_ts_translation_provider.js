let $;
// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
}

var NEEDS_EXTENSION_OBJECT = false;

function Translator() {
    this._init.apply(this, arguments);
}

Translator.prototype = {
    __proto__: $.TranslateShellBaseTranslator.prototype,

    _init: function(aExtension) {
        this.engine_name = "deepl";
        this.provider_name = "DeepL.TranslatorTS";
        this.provider_limit = 1400;
        this.provider_max_queries = 3;

        $.TranslateShellBaseTranslator.prototype._init.call(this, aExtension);
    }
};

/* exported NEEDS_EXTENSION_OBJECT
 */
