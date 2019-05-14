let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
}

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
