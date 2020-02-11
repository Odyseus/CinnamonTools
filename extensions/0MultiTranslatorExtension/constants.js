let XletMeta,
    GlobalUtils,
    XletsSettingsUtils;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
    XletsSettingsUtils = require("./xletsSettingsUtils.js");
} else {
    GlobalUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].globalUtils;
    XletsSettingsUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].xletsSettingsUtils;
}

const {
    _
} = GlobalUtils;

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
    "pref_loggin_save_history_indented",
    "pref_keep_source_entry_text_selected",
    "pref_informed_about_dependencies",
    "pref_desktop_file_generated"
];

var Settings = new XletsSettingsUtils.CustomExtensionSettings(BOUND_SETTINGS_ARRAY);

var TRANS_SHELL_REPLACEMENT_DATA = {
    /* NOTE: Reference extracted from translate-shell.
     *  AnsiCode["reset"]         = AnsiCode[0] = "\33[0m"
     *  AnsiCode["bold"]          = "\33[1m"
     *  AnsiCode["underline"]     = "\33[4m"
     *  AnsiCode["negative"]      = "\33[7m"
     *  AnsiCode["no bold"]       = "\33[22m"
     *  AnsiCode["no underline"]  = "\33[24m"
     *  AnsiCode["positive"]      = "\33[27m"
     *  AnsiCode["black"]         = "\33[30m"
     *  AnsiCode["red"]           = "\33[31m"
     *  AnsiCode["green"]         = "\33[32m"
     *  AnsiCode["yellow"]        = "\33[33m"
     *  AnsiCode["blue"]          = "\33[34m"
     *  AnsiCode["magenta"]       = "\33[35m"
     *  AnsiCode["cyan"]          = "\33[36m"
     *  AnsiCode["gray"]          = "\33[37m"
     *  AnsiCode["default"]       = "\33[39m"
     *  AnsiCode["dark gray"]     = "\33[90m"
     *  AnsiCode["light red"]     = "\33[91m"
     *  AnsiCode["light green"]   = "\33[92m"
     *  AnsiCode["light yellow"]  = "\33[93m"
     *  AnsiCode["light blue"]    = "\33[94m"
     *  AnsiCode["light magenta"] = "\33[95m"
     *  AnsiCode["light cyan"]    = "\33[96m"
     *  AnsiCode["white"]         = "\33[97m"
     */
    // Clean up all escape sequences.
    "\x1B[1m": "<b>",
    "\x1B[22m": "</b>",
    "\x1B[4m": "<u>",
    "\x1B[24m": "</u>",
    "\x1B[7m": "",
    "\x1B[27m": "",
    "\x1B[30m": "",
    "\x1B[31m": "",
    "\x1B[32m": "",
    "\x1B[33m": "",
    "\x1B[34m": "",
    "\x1B[35m": "",
    "\x1B[36m": "",
    "\x1B[37m": "",
    "\x1B[39m": "",
    "\x1B[90m": "",
    "\x1B[91m": "",
    "\x1B[92m": "",
    "\x1B[93m": "",
    "\x1B[94m": "",
    "\x1B[95m": "",
    "\x1B[96m": "",
    "\x1B[97m": "",
    // Just in case.
    "[\r\n]+": "\n"
};
var TTS_URI = "https://translate.google.com/translate_tts?client=tw-ob&ie=UTF-8&total=1&idx=0&textlen=%d&q=%s&tl=%s";
var TTS_TEXT_MAX_LEN = 100;
var LNG_CHOOSER_COLUMNS = 4;
/* NOTE: Keep in sync with translatorHistory.py:
 */
var HISTORY_FILE_VERSION = 2;

// NOTE: Keep in sync with pref_translators_prefs_defaults_control.
// Increment by 1 every time that I add/remove an engine.
// Always overwrite the preference with the value of this variable.
var DEFAULT_ENGINES_CONTROL = 1;

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
    7: "(7) " + _("A network error occurred, or the other end closed the connection unexpectedly")
};
var STATS_TYPE_SOURCE = "source";
var STATS_TYPE_TARGET = "target";
var MagicKeys = {
    CYRILLIC_CONTROL: 8196,
    CYRILLIC_SHIFT: 8192
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
    providers: "multi-translator-providers-symbolic"
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
            TRANS_SHELL_REPLACEMENT_DATA,
            KnownStatusCodes,
            TTS_TEXT_MAX_LEN,
            LNG_CHOOSER_COLUMNS,
            STATUS_BAR_MAX_MESSAGE_LENGTH,
            DEFAULT_ENGINES_CONTROL,
            DEFAULT_ENGINES,
            HISTORY_FILE_VERSION,
            STATS_TYPE_SOURCE,
            STATS_TYPE_TARGET,
            LoggingLevel,
            MagicKeys,
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
