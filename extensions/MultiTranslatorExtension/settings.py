#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys

if sys.version_info < (3, 7):
    msg = r'[1;31m WrongPythonVersion: Minimum Python version supported: 3.7 [0m'
    raise SystemExit(msg)

from html import escape

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(XLET_DIR)

from python_modules.xlets_settings import _
from python_modules.xlets_settings import cli
from python_modules.xlets_settings.builder import WindowDefinition
from python_modules.xlets_settings.builder import get_debugging_section

XLET_UUID = os.path.basename(XLET_DIR)
XLET_TYPE = os.path.basename(os.path.dirname(XLET_DIR))[:-1]

LANGUAGES_LIST = {
    "auto": _("Detect language"),
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
}


TRANSLATORS_COLUMNS = [{
    "id": "provider_name",
    "title": _("Translator"),
    "type": "string"
}, {
    "id": "default_source",
    "title": _("Source language"),
    "type": "string",
    "first-option": "auto",
    "options": LANGUAGES_LIST
}, {
    "id": "default_target",
    "title": _("Target language"),
    "type": "string",
    "first-option": "auto",
    "options": LANGUAGES_LIST
}, {
    "id": "remember_last_lang",
    "title": _("Remember last language"),
    "type": "boolean"
}]

win_def = WindowDefinition()
global_page = win_def.add_page(_("General"))
global_section = global_page.add_section(_("General options"))
global_section.add_widget("combobox", "default_translator", {
    "description": _("Default translation provider"),
    "tooltip": "\n".join([
        _("Select the default translation provider."),
        _("Providers marked with (*) require translate-shell package to work."),
        _("See the extended help of this extension for more information.")
    ]),
    "options": {
        "Apertium.TS": "Apertium (*)",
        "Bing.TranslatorTS": "%s (*)" % _("Bing Translator"),
        "Google.Translate": _("Google Translate"),
        "Google.TranslateTS": "%s (*)" % _("Google Translate"),
        "Yandex.Translate": _("Yandex Translate"),
        "Yandex.TranslateTS": "%s (*)" % _("Yandex Translate"),
    }
})
global_section.add_widget("spinbutton", "ui_animation_time", {
    "description": _("UI animation time"),
    "tooltip": _("Set to zero to disable animations."),
    "units": _("milliseconds"),
    "default": 200,
    "max": 500,
    "min": 0,
    "step": 50,
    "page": 100
})
global_section.add_widget("switch", "remember_last_translator", {
    "description": _("Remember last translator"),
    "tooltip": _("Remember last used translation provider.")
})
global_section.add_widget("switch", "auto_translate_when_switching_language", {
    "description": _("Automatically translate when switching languages")
})
global_section.add_widget("switch", "keep_source_entry_text_selected", {
    "description": _("Keep source entry text selected"),
    "tooltip": _("Keep source entry text selected whenever the translation dialog is opened and the source entry box contains text.")
})
global_section.add_widget("switch", "show_most_used", {
    "description": _("Show most used languages"),
    "tooltip": _("Display a list of most used languages.")
})
global_section.add_widget("switch", "sync_entries_scrolling", {
    "description": _("Synchronize scroll entries"),
    "tooltip": _("Make the source and target entries scroll synchronously.")
})
global_section.add_widget("keybinding", "open_translator_dialog_keybinding", {
    "description": _("Keybinding to open translator dialog")
})
global_section.add_widget("keybinding", "translate_from_clipboard_keybinding", {
    "description": _("Keybinding to translate text from clipboard")
})
global_section.add_widget("keybinding", "translate_from_selection_keybinding", {
    "description": _("Keybinding to translate text from primary selection")
})

trans_page = win_def.add_page(_("Translators"))
trans_section = trans_page.add_section(_("Translators default preferences"), notes=[
    "<i>%s</i>" % escape(_("Translators whose names are suffixed with TS require translate-shell package"))
])
trans_section.add_widget("list", "translators_prefs_defaults", {
    "columns": TRANSLATORS_COLUMNS,
    "immutable": {
        "read-only-keys": ["provider_name"]
    },
    "height": 300,
    "move-buttons": False
})

appear_page = win_def.add_page(_("Appearance"))
appear_section = appear_page.add_section(_("Translation dialog appearance"))
appear_section.add_widget("combobox", "dialog_theme", {
    "description": _("Dialog theme"),
    "tooltip": _("Select a theme for the translation dialog."),
    "options": {
        "custom": _("Custom"),
        "default": _("Default")
    }
})
appear_section.add_widget("filechooser", "dialog_theme_custom", {
    "select_dir": False,
    "description": _("Custom theme path"),
    "tooltip": _("Select a custom theme for the translation dialog."),
})
appear_section.add_widget("spinbutton", "font_size", {
    "description": _("Font size"),
    "tooltip": _("Select a font size for the source text and target text entries."),
    "min": 0.50,
    "max": 3.00,
    "step": 0.10,
    "page": 0.50,
    "units": _("ems")
})
appear_section.add_widget("spinbutton", "width_percents", {
    "description": _("Percentage of screen width"),
    "tooltip": _("What percentage of screen width should the translation dialog fill."),
    "min": 50,
    "max": 100,
    "step": 5,
    "page": 10,
    "units": _("percentage")
})
appear_section.add_widget("spinbutton", "height_percents", {
    "description": _("Percentage of screen height"),
    "tooltip": _("What percentage of screen height should the translation dialog fill."),
    "min": 50,
    "max": 100,
    "step": 5,
    "page": 10,
    "units": _("percentage")
})

history_page = win_def.add_page(_("History"))
history_section = history_page.add_section(_("Translation history settings"))
history_section.add_widget("switch", "history_enabled", {
    "description": _("Enable translation history"),
})
history_section.add_widget("combobox", "history_timestamp", {
    "description": _("Timestamp for history entries"),
    "tooltip": _("Timestamp format for the translation history entries.\nNote: After changing this setting, only new entries in the translation history will be saved with the new timestamp format. Old entries will still have the previous timestamp format."),
    "dependency": "history_enabled",
    "options": {
        "custom": _("Custom"),
        "iso": "ISO8601 (2000 12-31 12:00:00)",
        "eu": "{0} (2000 31-12 12:00:00)".format(_("European"))
    }
})
history_section.add_widget("entry", "history_timestamp_custom", {
    "description": _("Custom timestamp"),
    "dependency": "history_enabled"
})
history_section.add_widget("button", "trigger_date_format_syntax_info", {
    "description": _("Date format syntax information"),
    "dependency": "history_enabled"
})
history_section.add_widget("spinbutton", "history_width_to_trigger_word_wrap", {
    "description": _("Width to trigger word wrap"),
    "tooltip": _("The \"Source text\" and \"Target text\" columns on the history window will wrap their text at the width defined by this setting."),
    "dependency": "history_enabled",
    "min": 100,
    "max": 1024,
    "step": 10,
    "page": 100,
    "units": _("pixels")
})

misc_page = win_def.add_page(_("Miscellaneous"))
misc_section = misc_page.add_section(_("Credentials"))
misc_section.add_widget("textview", "yandex_api_keys", {
    "height": 150,
    "description": _("Yandex API keys"),
    "tooltip": _("Enter one API key per line.\nRead the help file found inside this extension folder to know how to get free Yandex API keys.")
})

misc_section = misc_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))
misc_section.add_widget("switch", "loggin_save_history_indented", {
    "description": _("Indent translation history data"),
    "tooltip": _("It allows to save the translation history data with indentation.")
})


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
