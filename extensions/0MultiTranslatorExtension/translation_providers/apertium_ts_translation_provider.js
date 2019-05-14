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
