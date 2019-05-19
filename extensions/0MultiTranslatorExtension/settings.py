#!/usr/bin/python3
# -*- coding: utf-8 -*-
import argparse
import cgi
import os
import sys

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
MODULES_DIR = os.path.join(XLET_DIR)
sys.path.append(MODULES_DIR)

from python_modules.xlets_settings import MainApplication
from python_modules.xlets_settings import _

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


LOGGING_LEVEL_TOOLTIP = "\n".join([
    _("It enables the ability to log the output of several functions used by the extension."),
    "",
    "%s: %s" % (_("Normal"), _("Only log messages caused by non critical errors.")),
    "%s: %s" % (_("Verbose"), _("Additinally log extra output messages and all HTTP responses.")),
    "%s: %s" % (_("Very verbose"), _(
        "Additionally log all method calls from all JavaScript classes/prototypes along with their execution time."))
])

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

GLOBAL_TAB = {
    "page-title": _("General"),
    "sections": [{
        "section-title": _("General options"),
        "widgets": [{
            "widget-type": "combobox",
            "args": {
                "pref_key": "pref_default_translator",
                "properties": {
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
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_ui_animation_time",
                "properties": {
                    "description": _("UI animation time"),
                    "tooltip": _("Set to zero to disable animations."),
                    "units": _("milliseconds"),
                    "default": 200,
                    "max": 500,
                    "min": 0,
                    "step": 50,
                    "page": 100
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_remember_last_translator",
                "properties": {
                    "description": _("Remember last translator"),
                    "tooltip": _("Remember last used translation provider.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_auto_translate_when_switching_language",
                "properties": {
                    "description": _("Automatically translate when switching languages")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_keep_source_entry_text_selected",
                "properties": {
                    "description": _("Keep source entry text selected"),
                    "tooltip": _("Keep source entry text selected whenever the translation dialog is opened and the source entry box contains text.")}
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_show_most_used",
                "properties": {
                    "description": _("Show most used languages"),
                    "tooltip": _("Display a list of most used languages.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_sync_entries_scrolling",
                "properties": {
                    "description": _("Synchronize scroll entries"),
                    "tooltip": _("Make the source and target entries scroll synchronously.")
                }
            }
        }, {
            "widget-type": "keybinding",
            "args": {
                "pref_key": "pref_open_translator_dialog_keybinding",
                "properties": {
                    "description": _("Keybinding to open translator dialog"),
                    "num-bind": 1
                }
            }
        }, {
            "widget-type": "keybinding",
            "args": {
                "pref_key": "pref_translate_from_clipboard_keybinding",
                "properties": {
                    "description": _("Keybinding to translate text from clipboard"),
                    "num-bind": 1
                }
            }
        }, {
            "widget-type": "keybinding",
            "args": {
                "pref_key": "pref_translate_from_selection_keybinding",
                "properties": {
                    "description": _("Keybinding to translate text from primary selection"),
                    "num-bind": 1
                }
            }
        }]
    }]
}


TRANSLATORS_TAB = {
    "page-title": _("Translators"),
    "sections": [{
        "section-title": _("Translation dialog appearance"),
        "widgets": [{
            "widget-type": "list",
            "args": {
                "pref_key": "pref_translators_prefs_defaults",
                "apply_key": "trigger_translators_prefs_defaults",
                "properties": {
                    "columns": TRANSLATORS_COLUMNS,
                    "immutable": {
                        "read_only_keys": ["provider_name"]
                    },
                    "height": 300,
                    "move-buttons": False
                }
            }
        }]
    }]
}


APPEARANCE_TAB = {
    "page-title": _("Appearance"),
    "sections": [{
        "section-title": _("Translation dialog appearance"),
        "widgets": [{
            "widget-type": "combobox",
            "args": {
                "pref_key": "pref_dialog_theme",
                "properties": {
                    "description": _("Dialog theme"),
                    "tooltip": _("Select a theme for the translation dialog."),
                    "options": {
                        "custom": _("Custom"),
                        "default": _("Default")
                    }
                }
            }
        }, {
            "widget-type": "filechooser",
            "args": {
                "pref_key": "pref_dialog_theme_custom",
                "properties": {
                    "select_dir": False,
                    "description": _("Custom theme path"),
                    "tooltip": _("Select a custom theme for the translation dialog."),
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_font_size",
                "properties": {
                    "description": _("Font size"),
                    "tooltip": _("Select a font size for the source text and target text entries."),
                    "min": 0.50,
                    "max": 3.00,
                    "step": 0.10,
                    "page": 0.50,
                    "units": _("ems")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_width_percents",
                "properties": {
                    "description": _("Percentage of screen width"),
                    "tooltip": _("What percentage of screen width should the translation dialog fill."),
                    "min": 50,
                    "max": 100,
                    "step": 5,
                    "page": 10,
                    "units": _("percentage")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_height_percents",
                "properties": {
                    "description": _("Percentage of screen height"),
                    "tooltip": _("What percentage of screen height should the translation dialog fill."),
                    "min": 50,
                    "max": 100,
                    "step": 5,
                    "page": 10,
                    "units": _("percentage")
                }
            }
        }]
    }]
}


HISTORY_TAB = {
    "page-title": _("History"),
    "sections": [{
        "section-title": _("Translation history settings"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_history_enabled",
                "properties": {
                    "description": _("Enable translation history"),
                }
            }
        }, {
            "widget-type": "combobox",
            "args": {
                "pref_key": "pref_history_timestamp",
                "properties": {
                    "description": _("Timestamp for history entries"),
                    "tooltip": _("Timestamp format for the translation history entries.\nNote: After changing this setting, only new entries in the translation history will be saved with the new timestamp format. Old entries will still have the previous timestamp format."),
                    "dependency": "pref_history_enabled",
                    "options": {
                        "custom": _("Custom"),
                        "iso": "ISO8601 (2000 12-31 12:00:00)",
                        "eu": "{0} (2000 31-12 12:00:00)".format(_("European"))
                    }
                }
            }
        }, {
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_history_timestamp_custom",
                "properties": {
                    "description": _("Custom timestamp"),
                    "dependency": "pref_history_enabled"
                }
            }
        }, {
            "widget-type": "button",
            "args": {
                "pref_key": "trigger_date_format_syntax_info",
                "properties": {
                    "description": _("Date format syntax information"),
                    "dependency": "pref_history_enabled"
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_history_width_to_trigger_word_wrap",
                "properties": {
                    "description": _("Width to trigger word wrap"),
                    "tooltip": _("The \"Source text\" and \"Target text\" columns on the history window will wrap their text at the width defined by this setting."),
                    "dependency": "pref_history_enabled",
                    "min": 100,
                    "max": 1024,
                    "step": 10,
                    "page": 100,
                    "units": _("pixels")
                }
            }
        }]
    }]
}


MISCELLANEOUS_TAB = {
    "page-title": _("Miscellaneous"),
    "sections": [{
        "section-title": _("Credentials"),
        "widgets": [{
            "widget-type": "textview",
            "args": {
                "pref_key": "pref_yandex_api_keys",
                "properties": {
                    "height": 150,
                    "description": _("Yandex API keys"),
                    "tooltip": _("Enter one API key per line.\nRead the help file found inside this extension folder to know how to get free Yandex API keys.")
                }
            }
        }]
    }, {
        "section-title": _("Debugging"),
        "widgets": [{
            "widget-type": "combobox",
            "args": {
                "pref_key": "pref_logging_level",
                "properties": {
                    "description": "%s (*)" % _("Logging level"),
                    "tooltip": LOGGING_LEVEL_TOOLTIP,
                    "options": {
                        0: _("Normal"),
                        1: _("Verbose"),
                        2: _("Very verbose")
                    }
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_debugger_enabled",
                "properties": {
                    "description": "%s (*)" % _("Enable debugger"),
                    "tooltip": _("It enables the ability to catch all exceptions that under normal use would not be caught.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_loggin_save_history_indented",
                "properties": {
                    "description": _("Indent translation history data"),
                    "tooltip": _("It allows to save the translation history data with indentation.")
                }
            }
        }, {
            "widget-type": "label",
            "args": {
                "label": "<b>(*) %s</b>" % cgi.escape(_("Requires Cinnamon restart to enable/disable")),
                "use_markup": True
            }
        }]
    }]
}


PAGES_OBJECT = [
    GLOBAL_TAB,
    TRANSLATORS_TAB,
    APPEARANCE_TAB,
    HISTORY_TAB,
    MISCELLANEOUS_TAB,
]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--xlet-type", dest="xlet_type")
    parser.add_argument("--xlet-instance-id", dest="xlet_instance_id")
    parser.add_argument("--xlet-uuid", dest="xlet_uuid")

    args = parser.parse_args()

    app = MainApplication(
        application_base_id="org.Cinnamon.Extensions.MultiTranslator.Settings",
        xlet_type=args.xlet_type or "extension",
        xlet_instance_id=args.xlet_instance_id or None,
        xlet_uuid=args.xlet_uuid or "{{UUID}}",
        pages_definition=PAGES_OBJECT,
        win_initial_width=800,
        win_initial_height=530,
    )
    app.run()
