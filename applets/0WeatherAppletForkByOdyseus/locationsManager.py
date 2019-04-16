#!/usr/bin/python3
# -*- coding: utf-8 -*-
import argparse
import cgi
import os
import sys

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
modules_dir = os.path.join(XLET_DIR)
sys.path.append(modules_dir)

from python_modules.xlets_settings import MainApplication
from python_modules.xlets_settings import _


INFO_LABELS = [
    "<b>%s</b>" % cgi.escape(_("Language legends")),
    "<b>(D)</b>: %s" % cgi.escape(_("Language supported by DarkSky.")),
    "<b>(O)</b>: %s" % cgi.escape(_("Language supported by OpenWeatherMap.")),
    "<b>(W)</b>: %s" % cgi.escape(_("Language supported by WeatherBit.")),
]

COLUMNS = [{
    "id": "locationName",
    "title": _("Location name"),
    "type": "string"
}, {
    "id": "locationID",
    "title": _("Location ID"),
    "type": "string"
},
    {
    "id": "languageID",
    "title": _("Language"),
    "type": "string",
    "default": "en",
    "options": {
        "ar": "ar (D)(O)(W)",
        "az": "az (D)(W)",
        "be": "be (D)(W)",
        "bg": "bg (D)(O)(W)",
        "bs": "bs (D)(W)",
        "ca": "ca (D)(O)(W)",
        "cs": "cs (D)",
        "cz": "cz (O)(W)",
        "da": "da (D)(W)",
        "de": "de (D)(O)(W)",
        "el": "el (D)(O)(W)",
        "en": "en (D)(O)(W)",
        "es": "es (D)(O)",
        "et": "et (D)(W)",
        "fa": "fa (O)",
        "fi": "fi (D)(O)(W)",
        "fr": "fr (D)(O)(W)",
        "gl": "gl (O)",
        "he": "he (D)",
        "hr": "hr (D)(O)(W)",
        "hu": "hu (D)(O)(W)",
        "id": "id (D)(W)",
        "is": "is (D)(W)",
        "it": "it (D)(O)(W)",
        "ja": "ja (D)(O)",
        "ka": "ka (D)",
        "ko": "ko (D)",
        "kr": "kr (O)",
        "kw": "kw (D)(W)",
        "la": "la (O)",
        "lt": "lt (O)(W)",
        "lv": "lv (D)",
        "mk": "mk (O)",
        "nb": "nb (D)(W)",
        "nl": "nl (D)(O)(W)",
        "no": "no (D)",
        "pl": "pl (D)(O)(W)",
        "pt": "pt (D)(O)(W)",
        "ro": "ro (D)(O)(W)",
        "ru": "ru (D)(O)(W)",
        "se": "se (O)",
        "sk": "sk (D)(O)(W)",
        "sl": "sl (D)(O)(W)",
        "sr": "sr (D)(W)",
        "sv": "sv (D)(W)",
        "te": "tet (D)",
        "tr": "tr (D)(O)(W)",
        "ua": "ua (O)",
        "uk": "uk (D)(W)",
        "vi": "vi (O)",
        "x-pig-latin": "x-pig-latin (D)",
        "zh": "zh (D)(W)",
        "zh-tw": "zh-tw (D)(W)",
        "zh_cn": "zh_cn (O)",
        "zh_tw": "zh_tw (O)",
    }
}, {
    "id": "forecastDays",
    "title": _("Fore. days"),
    "type": "integer",
    "col-resize": False,
    "default": 5,
    "min": 1,
    "max": 10,
    "step": 1,
    "units": _("days")
}, {
    "id": "forecastRowsCols",
    "title": _("Fore. rows/cols"),
    "type": "integer",
    "col-resize": False,
    "default": 1,
    "min": 1,
    "max": 2,
    "step": 1,
    "units": _("rows/cols")
}, {
    "id": "providerID",
    "title": _("Provider"),
    "type": "string",
    "default": "YahooWeather",
    "options": [
        "DarkSky",
        "OpenWeatherMap",
        "WeatherBit",
        "YahooWeather"
    ]
}]

LOCATIONS_TAB = {
    "page-title": _("Locations"),
    "sections": [{
        "section-title": _("Locations"),
        "widgets": [{
            "widget-type": "list",
            "args": {
                "pref_key": "pref_locations_storage",
                "apply_key": "trigger_reload_locations",
                "imp_exp_path_key": "pref_imp_exp_last_selected_directory",
                "properties": {
                    "columns": COLUMNS,
                    "height": 300,
                    "move-buttons": False,
                    "apply-and-quit": True,
                    "dialog-info-labels": INFO_LABELS
                }
            }
        }]
    }]
}

CREDENTIALS_TAB = {
    "page-title": _("Credentials"),
    "sections": [{
        "section-title": _("Dark Sky"),
        "widgets": [{
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_darksky_credential_app_id",
                "properties": {
                    "description": "Secret Key"
                }
            }
        }]
    }, {
        "section-title": _("OpenWeatherMap"),
        "widgets": [{
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_open_weather_map_credential_app_id",
                "properties": {
                    "description": _("API Key")
                }
            }
        }]
    }, {
        "section-title": _("WeatherBit"),
        "widgets": [{
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_weatherbit_credential_app_id",
                "properties": {
                    "description": _("API Key")
                }
            }
        }]
    }, {
        "section-title": _("Yahoo! Weather"),
        "widgets": [{
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_yahoo_credential_app_id",
                "properties": {
                    "description": _("App ID")
                }
            }
        }, {
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_yahoo_credential_client_id",
                "properties": {
                    "description": _("Client ID (Consumer Key)")
                }
            }
        }, {
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_yahoo_credential_client_secret",
                "properties": {
                    "description": _("Client Secret (Consumer Secret)")
                }
            }
        }]
    }]
}


PAGES_OBJECT = [
    LOCATIONS_TAB,
    CREDENTIALS_TAB
]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--xlet-type", dest="xlet_type")
    parser.add_argument("--xlet-instance-id", dest="xlet_instance_id")
    parser.add_argument("--xlet-uuid", dest="xlet_uuid")

    args = parser.parse_args()

    app = MainApplication(
        application_base_id="org.Cinnamon.Applets.WeatherApplet.LocationsManager",
        xlet_type=args.xlet_type or "extension",
        xlet_instance_id=args.xlet_instance_id or None,
        xlet_uuid=args.xlet_uuid or "{{UUID}}",
        pages_definition=PAGES_OBJECT,
        application_title=_("Locations manager"),
        win_initial_width=800,
        win_initial_height=530,
        display_settings_handling=False
    )
    app.run()
