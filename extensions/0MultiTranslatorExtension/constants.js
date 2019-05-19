let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

const {
    gettext: Gettext,
    gi: {
        GLib
    },
    ui: {
        settings: {
            ExtensionSettings
        }
    }
} = imports;

Gettext.bindtextdomain(XletMeta.uuid, GLib.get_home_dir() + "/.local/share/locale");

/**
 * Return the localized translation of a string, based on the xlet domain or
 * the current global domain (Cinnamon's).
 *
 * This function "overrides" the _() function globally defined by Cinnamon.
 *
 * @param {String} aStr - The string being translated.
 *
 * @return {String} The translated string.
 */
function _(aStr) {
    let customTrans = Gettext.dgettext(XletMeta.uuid, aStr);

    if (customTrans !== aStr && aStr !== "") {
        return customTrans;
    }

    return Gettext.gettext(aStr);
}

const BOUND_SETTINGS_ARRAY = [
    "pref_ui_animation_time",
    "pref_open_translator_dialog_keybinding",
    "pref_translate_from_clipboard_keybinding",
    "pref_translate_from_selection_keybinding",
    "pref_default_translator",
    "pref_translators_prefs",
    "pref_translators_prefs_defaults_control",
    "pref_translators_prefs_defaults",
    "trigger_translators_prefs_defaults",
    "trigger_date_format_syntax_info",
    "pref_languages_stats",
    "pref_last_translator",
    "pref_remember_last_translator",
    "pref_auto_translate_when_switching_language",
    "pref_show_most_used",
    "pref_sync_entries_scrolling",
    "pref_width_percents",
    "pref_height_percents",
    "pref_font_size",
    "pref_dialog_theme",
    "pref_dialog_theme_custom",
    "pref_history_enabled",
    "pref_history_timestamp",
    "pref_history_timestamp_custom",
    "pref_history_width_to_trigger_word_wrap",
    "pref_yandex_api_keys",
    "pref_logging_level",
    "pref_debugger_enabled",
    "pref_loggin_save_history_indented",
    "pref_keep_source_entry_text_selected",
    "pref_informed_about_dependencies"
];

/* NOTE: Future me, ULTRA-VERY-IMPORTANT!!!
 * TL;DR;: Keep using Cinnamon's native settings system initialized inside an
 * applet/desklet class/prototype, not globally declared and initialized in its
 * own class/prototype.
 * Do NOT bother using Cinnamon's native settings system initialized with its own
 * class/prototype on any type of xlet other than extensions.
 * The settings system for applets/desklets requires an xlet instance ID to be
 * passed for the settings to be initialized. This will force me to initialize the
 * settings class/prototype inside main(). That would defeat the purpose of having
 * a class initialized in a module to be able to use it by any other module.
 * It is worth mentioning that, if an xlet is NOT multi-instance (like extension are),
 * its instance ID is also its UUID; which is available globally.
 */
function MultiTranslatorSettings() {
    this._init.apply(this, arguments);
}

MultiTranslatorSettings.prototype = {
    _init: function() {
        this.settings = new ExtensionSettings(
            this,
            XletMeta.uuid
        );

        this._handlers = [];

        this._bindSettings();
    },

    _bindSettings: function() {
        /* NOTE: I converted the entire extension from using gsetting into using
         * Cinnamon's native settings system for the sole purpose of "enjoying"
         * the native system. I was enjoying it until I discovered that using
         * this.settings.bind/bindProperty doesn't make properties act like
         * getters!!! So I had to f*cking do it myself!!!!
         */
        let i = BOUND_SETTINGS_ARRAY.length;
        while (i--) {
            Object.defineProperty(
                this,
                BOUND_SETTINGS_ARRAY[i],
                this._getDescriptor(BOUND_SETTINGS_ARRAY[i])
            );
        }
    },

    _getDescriptor: function(aKey) {
        return Object.create({
            get: () => {
                return this.settings.getValue(aKey);
            },
            set: (aVal) => {
                this.settings.setValue(aKey, aVal);
            },
            enumerable: true,
            configurable: true
        });
    },

    connect: function(signal, callback) {
        let handler_id = this.settings.connect(signal, callback);
        this._handlers.push(handler_id);
        return handler_id;
    },

    destroy: function() {
        while (this._handlers.length) {
            this.disconnect(this._handlers[0]);
        }
    },

    disconnect: function(handler_id) {
        let index = this._handlers.indexOf(handler_id);
        this.settings.disconnect(handler_id);

        if (index > -1) {
            this._handlers.splice(index, 1);
        }
    }
};

var Settings = new MultiTranslatorSettings();

var TTS_URI = "https://translate.google.com/translate_tts?client=tw-ob&ie=UTF-8&total=1&idx=0&textlen=%d&q=%s&tl=%s";
var TTS_TEXT_MAX_LEN = 100;
var LNG_CHOOSER_COLUMNS = 4;
var CINNAMON_VERSION = GLib.getenv("CINNAMON_VERSION");
/* NOTE: Keep in sync with translatorHistory.py:
 */
var HISTORY_FILE_VERSION = 2;

// NOTE: Keep in sync with pref_translators_prefs_defaults_control.
// Increment by 1 every time that I add/remove an engine.
// Always overwrite the preference with the value of this variable.
var DEFAULT_ENGINES_CONTROL = 0;

// NOTE: Keep in sync with pref_translators_prefs_defaults.
// Add/remove engines.
// Always overwrite the default for this preference with the value of this variable.
var DEFAULT_ENGINES = [{
    "provider_name": "Apertium.TS",
    "default_source": "auto",
    "default_target": "en",
    "remember_last_lang": true
}, {
    "provider_name": "Bing.TranslatorTS",
    "default_source": "auto",
    "default_target": "en",
    "remember_last_lang": true
}, {
    "provider_name": "Google.TranslateTS",
    "default_source": "auto",
    "default_target": "en",
    "remember_last_lang": true
}, {
    "provider_name": "Google.Translate",
    "default_source": "auto",
    "default_target": "en",
    "remember_last_lang": true
}, {
    "provider_name": "Yandex.Translate",
    "default_source": "auto",
    "default_target": "en",
    "remember_last_lang": true
}, {
    "provider_name": "Yandex.TranslateTS",
    "default_source": "auto",
    "default_target": "en",
    "remember_last_lang": true
}];
var KnownStatusCodes = {
    2: "(2) " + _("Unable to resolve destination host name"),
    307: "(307) " + _("Temporary redirect"),
    3: "(3) " + _("Unable to resolve proxy host name"),
    400: "(400) " + _("Bad request"),
    401: "(401) " + _("Unauthorized"),
    402: "(402) " + _("Payment required"),
    404: "(404) " + _("Not found"),
    407: "(407) " + _("Proxy authentication required"),
    408: "(408) " + _("Request timeout"),
    4: "(4) " + _("Unable to connect to remote host"),
    500: "(500) " + _("Internal server error"),
    503: "(503) " + _("Service unavailable"),
    5: "(5) " + _("Unable to connect to proxy"),
    6: "(6) " + _("SSL/TLS negotiation failed"),
    7: "(7) " + _("A network error occurred, or the other end closed the connection unexpectedly"),
};
var STATS_TYPE_SOURCE = "source";
var STATS_TYPE_TARGET = "target";
var LoggingLevel = {
    NORMAL: 0,
    VERBOSE: 1,
    VERY_VERBOSE: 2
};
var MagicKeys = {
    CYRILLIC_CONTROL: 8196,
    CYRILLIC_SHIFT: 8192
};
var NotificationUrgency = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
};
var STATUS_BAR_MAX_MESSAGE_LENGTH = 100;
var StatusbarMessageType = {
    ERROR: 0,
    INFO: 1,
    SUCCESS: 2
};
var STATUS_BAR_MESSAGE_PARAMS = Object.freeze({
    message: "",
    timeout: 4000, // 4 seconds.
    type: StatusbarMessageType.INFO,
    animate: true,
    store_only: false
});
var DIALOG_POPUP_ITEM_PARAMS = Object.freeze({
    label: "",
    icon_name: "",
    callback: null,
    is_translators_popup: false
});
var SPINNER_PARAMS = Object.freeze({
    speed: 200,
    sequence: ["—", "\\", "|", "/", "—"]
});
/* NOTE: "name", "url", and "ts_engine_name" SHOULD always be set.
 * name: Mandatory for all engines.
 * url: Mandatory for engines that doesn't use translate-shell.
 * ts_engine_name: Mandatory for engines that do use translate-shell.
 */
var TRANSLATION_PROVIDER_PARAMS = Object.freeze({
    name: "",
    char_limit: 1400,
    max_queries: 3,
    url: "",
    headers: null,
    sentences_regexp: /\n|([^\r\n.!?]+([.!?]+|\n|$))/gim,
    ts_engine_name: "",
    ts_extra_options: [
        "--show-original", "n",
        "--show-prompt-message", "n",
        "--no-bidi"
    ]
});
var DialogState = {
    OPENED: 0,
    CLOSED: 1,
    OPENING: 2,
    CLOSING: 3,
    FADED_OUT: 4
};
var Icons = {
    help: "dialog-question-symbolic",
    preferences: "preferences-system-symbolic",
    close: "window-close-symbolic",
    shutdown: "system-shutdown-symbolic",
    listen: "audio-volume-high-symbolic",
    history: "document-open-recent-symbolic",
    menu: "open-menu-symbolic",
    dictionary: "dictionary-symbolic",
    find: "edit-find-symbolic",
    swap: "multi-translator-swap-language-symbolic",
    translate: "multi-translator-translate-symbolic",
    providers: "multi-translator-providers-symbolic",
};

var ProviderData = {
    website: {
        "Apertium.TS": "https://www.apertium.org",
        "Bing.TranslatorTS": "https://www.bing.com/translator/",
        "Google.Translate": "https://translate.google.com",
        "Google.TranslateTS": "https://translate.google.com",
        "Yandex.Translate": "https://translate.yandex.net",
        "Yandex.TranslateTS": "https://translate.yandex.net"
    },
    display_name: {
        "Apertium.TS": _("Apertium"),
        "Bing.TranslatorTS": _("Bing Translator"),
        "Google.Translate": _("Google Translate"),
        "Google.TranslateTS": _("Google Translate"),
        "Yandex.Translate": "Yandex.Translate",
        "Yandex.TranslateTS": "Yandex.Translate"
    },
    icon: {
        "Apertium.TS": "multi-translator-generic-translator",
        "Bing.TranslatorTS": "multi-translator-bing-translator",
        "Google.Translate": "multi-translator-google-translate",
        "Google.TranslateTS": "multi-translator-google-translate",
        "Yandex.Translate": "multi-translator-yandex-translate",
        "Yandex.TranslateTS": "multi-translator-yandex-translate"
    }
};

var Languages = {
    "auto": _("Detect language"),
    "?": _("Unknown"),
    "af": _("Afrikaans"),
    "am": _("Amharic"),
    "ar": _("Arabic"),
    "az": _("Azerbaijani"),
    "be": _("Belarusian"),
    "bg": _("Bulgarian"),
    "bn": _("Bengali"),
    "bs": _("Bosnian (Y)"),
    "ca": _("Catalan"),
    "ceb": _("Chichewa"),
    "co": _("Corsican"),
    "cs": _("Czech"),
    "cy": _("Welsh"),
    "da": _("Danish"),
    "de": _("German"),
    "el": _("Greek"),
    "en": _("English"),
    "eo": _("Esperanto"),
    "es": _("Spanish"),
    "et": _("Estonian"),
    "eu": _("Basque"),
    "fa": _("Persian"),
    "fi": _("Finnish"),
    "fr": _("French"),
    "fy": _("Frisian"),
    "ga": _("Irish"),
    "gd": _("Scots Gaelic"),
    "gl": _("Galician"),
    "gu": _("Gujarati"),
    "ha": _("Hausa"),
    "haw": _("Hawaiian"),
    "he": _("Hebrew (Y)"),
    "hi": _("Hindi"),
    "hmn": _("Hmong"),
    "hr": _("Croatian"),
    "ht": _("Haitian Creole"),
    "hu": _("Hungarian"),
    "hy": _("Armenian"),
    "id": _("Indonesian"),
    "ig": _("Igbo"),
    "is": _("Icelandic"),
    "it": _("Italian"),
    "iw": _("Hebrew"),
    "ja": _("Japanese"),
    "jw": _("Javanese"),
    "ka": _("Georgian"),
    "kk": _("Kazakh"),
    "km": _("Khmer"),
    "kn": _("Kannada"),
    "ko": _("Korean"),
    "ku": _("Kurdish (Kurmanji)"),
    "ky": _("Kyrgyz"),
    "la": _("Latin"),
    "lb": _("Luxembourgish"),
    "lo": _("Lao"),
    "lt": _("Lithuanian"),
    "lv": _("Latvian"),
    "mg": _("Malagasy"),
    "mi": _("Maori"),
    "mk": _("Macedonian"),
    "ml": _("Malayalam"),
    "mn": _("Mongolian"),
    "mr": _("Marathi"),
    "ms": _("Malay"),
    "mt": _("Maltese"),
    "my": _("Myanmar (Burmese)"),
    "ne": _("Nepali"),
    "nl": _("Dutch"),
    "no": _("Norwegian"),
    "ny": _("Cebuano"),
    "pa": _("Punjabi"),
    "pl": _("Polish"),
    "ps": _("Pashto"),
    "pt": _("Portuguese"),
    "ro": _("Romanian"),
    "ru": _("Russian"),
    "sd": _("Sindhi"),
    "si": _("Sinhala"),
    "sk": _("Slovak"),
    "sl": _("Slovenian"),
    "sm": _("Samoan"),
    "sn": _("Shona"),
    "so": _("Somali"),
    "sq": _("Albanian"),
    "sr": _("Serbian"),
    "st": _("Sesotho"),
    "su": _("Sundanese"),
    "sv": _("Swedish"),
    "sw": _("Swahili"),
    "ta": _("Tamil"),
    "te": _("Telugu"),
    "tg": _("Tajik"),
    "th": _("Thai"),
    "tl": _("Filipino"),
    "tr": _("Turkish"),
    "uk": _("Ukrainian"),
    "ur": _("Urdu"),
    "uz": _("Uzbek"),
    "vi": _("Vietnamese"),
    "xh": _("Xhosa"),
    "yi": _("Yiddish"),
    "yo": _("Yoruba"),
    "zh": _("Chinese (Y)"),
    "zh-CN": _("Chinese Simplified"),
    "zh-TW": _("Chinese Traditional"),
    "zu": _("Zulu")
};

var Endonyms = {
    "Afrikaans": _("Afrikaans"),
    "አማርኛ": _("Amharic"),
    "العربية": _("Arabic"),
    "Azərbaycanca": _("Azerbaijani"),
    "беларуская": _("Belarusian"),
    "български": _("Bulgarian"),
    "বাংলা": _("Bengali"),
    "Bosanski": _("Bosnian (Y)"),
    "Català": _("Catalan"),
    "Nyanja": _("Chichewa"),
    "Corsu": _("Corsican"),
    "Čeština": _("Czech"),
    "Cymraeg": _("Welsh"),
    "Dansk": _("Danish"),
    "Deutsch": _("German"),
    "Ελληνικά": _("Greek"),
    "English": _("English"),
    "Esperanto": _("Esperanto"),
    "Español": _("Spanish"),
    "Eesti": _("Estonian"),
    "Euskara": _("Basque"),
    "فارسی": _("Persian"),
    "Suomi": _("Finnish"),
    "Français": _("French"),
    "Frysk": _("Frisian"),
    "Gaeilge": _("Irish"),
    "Gàidhlig": _("Scots Gaelic"),
    "Galego": _("Galician"),
    "ગુજરાતી": _("Gujarati"),
    "Hausa": _("Hausa"),
    "ʻŌlelo Hawaiʻi": _("Hawaiian"),
    "हिन्दी": _("Hindi"),
    "Hmoob": _("Hmong"),
    "Hrvatski": _("Croatian"),
    "Kreyòl Ayisyen": _("Haitian Creole"),
    "Magyar": _("Hungarian"),
    "Հայերեն": _("Armenian"),
    "Bahasa Indonesia": _("Indonesian"),
    "Igbo": _("Igbo"),
    "Íslenska": _("Icelandic"),
    "Italiano": _("Italian"),
    "עִבְרִית": _("Hebrew"),
    "日本語": _("Japanese"),
    "Basa Jawa": _("Javanese"),
    "ქართული": _("Georgian"),
    "Қазақ тілі": _("Kazakh"),
    "ភាសាខ្មែរ": _("Khmer"),
    "ಕನ್ನಡ": _("Kannada"),
    "한국어": _("Korean"),
    "Kurdî": _("Kurdish (Kurmanji)"),
    "Кыргызча": _("Kyrgyz"),
    "Latina": _("Latin"),
    "Lëtzebuergesch": _("Luxembourgish"),
    "ຄຳ​ແປ​ສຳລັບ": _("Lao"),
    "Lietuvių": _("Lithuanian"),
    "Latviešu": _("Latvian"),
    "Malagasy": _("Malagasy"),
    "Māori": _("Maori"),
    "Македонски": _("Macedonian"),
    "മലയാളം": _("Malayalam"),
    "Монгол": _("Mongolian"),
    "मराठी": _("Marathi"),
    "Bahasa Melayu": _("Malay"),
    "Malti": _("Maltese"),
    "မြန်မာစာ": _("Myanmar (Burmese)"),
    "नेपाली": _("Nepali"),
    "Nederlands": _("Dutch"),
    "Norsk": _("Norwegian"),
    "Cebuano": _("Cebuano"),
    "ਪੰਜਾਬੀ": _("Punjabi"),
    "Polski": _("Polish"),
    "پښتو": _("Pashto"),
    "Português": _("Portuguese"),
    "Română": _("Romanian"),
    "Русский": _("Russian"),
    "سنڌي": _("Sindhi"),
    "සිංහල": _("Sinhala"),
    "Slovenčina": _("Slovak"),
    "Slovenščina": _("Slovenian"),
    "Gagana Sāmoa": _("Samoan"),
    "chiShona": _("Shona"),
    "Soomaali": _("Somali"),
    "Shqip": _("Albanian"),
    "српски": _("Serbian"),
    "srpski": _("Serbian"),
    "Sesotho": _("Sesotho"),
    "Basa Sunda": _("Sundanese"),
    "Svenska": _("Swedish"),
    "Kiswahili": _("Swahili"),
    "தமிழ்": _("Tamil"),
    "తెలుగు": _("Telugu"),
    "Тоҷикӣ": _("Tajik"),
    "ไทย": _("Thai"),
    "Tagalog": _("Filipino"),
    "Türkçe": _("Turkish"),
    "Українська": _("Ukrainian"),
    "اُردُو": _("Urdu"),
    "Oʻzbek tili": _("Uzbek"),
    "Tiếng Việt": _("Vietnamese"),
    "isiXhosa": _("Xhosa"),
    "ייִדיש": _("Yiddish"),
    "Yorùbá": _("Yoruba"),
    "简体中文": _("Chinese Simplified"),
    "正體中文": _("Chinese Traditional"),
    "isiZulu": _("Zulu")
};

/* exported TTS_URI,
            Settings,
            KnownStatusCodes,
            TTS_TEXT_MAX_LEN,
            LNG_CHOOSER_COLUMNS,
            STATUS_BAR_MAX_MESSAGE_LENGTH,
            DEFAULT_ENGINES_CONTROL,
            DEFAULT_ENGINES,
            HISTORY_FILE_VERSION,
            CINNAMON_VERSION,
            STATS_TYPE_SOURCE,
            STATS_TYPE_TARGET,
            LoggingLevel,
            MagicKeys,
            NotificationUrgency,
            StatusbarMessageType,
            STATUS_BAR_MESSAGE_PARAMS,
            DIALOG_POPUP_ITEM_PARAMS,
            SPINNER_PARAMS,
            TRANSLATION_PROVIDER_PARAMS,
            DialogState,
            Icons,
            ProviderData,
            Languages,
            Endonyms,
*/
