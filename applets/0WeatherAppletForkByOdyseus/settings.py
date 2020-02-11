#!/usr/bin/python3
# -*- coding: utf-8 -*-
import argparse
import os
import sys

from html import escape

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
modules_dir = os.path.join(XLET_DIR)
sys.path.append(modules_dir)

from python_modules.xlets_settings import MainApplication
from python_modules.xlets_settings import _

ASTERISK = " (*)"
CINN_RESTART = "(*) <i>%s</i>" % escape(_("Cinnamon needs to be restarted"))
CINN_RESTART_MIGHT = "(*) <i>%s</i>" % escape(_("Cinnamon might need to be restarted"))

INFO_LABELS = [
    "<b>%s</b>" % escape(_("Language legends")),
    "<b>(D)</b>: %s" % escape(_("Language supported by DarkSky.")),
    "<b>(O)</b>: %s" % escape(_("Language supported by OpenWeatherMap.")),
    "<b>(W)</b>: %s" % escape(_("Language supported by WeatherBit.")),
]

LOGGING_LEVEL_TOOLTIP = "\n".join([
    _("It enables the ability to log the output of several functions used by the extension."),
    "",
    "%s: %s" % (_("Normal"), _("Only log messages caused by non critical errors.")),
    "%s: %s" % (_("Verbose"), _("Additionally log extra output messages and all HTTP responses.")),
    "%s: %s" % (_("Very verbose"), _(
        "Additionally log all method calls from all JavaScript classes/prototypes along with their execution time."))
])

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

GENERAL_TAB = {
    "page-title": _("General"),
    "sections": [{
        "section-title": _("General"),
        "widgets": [{
            "widget-type": "keybinding",
            "widget-attrs": {
                "pref_key": "pref_overlay_key"
            },
            "widget-kwargs": {
                "description": _("Keyboard shortcut to open and close the menu"),
                "num-bind": 1
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_refresh_interval"
            },
            "widget-kwargs": {
                "description": _("Update weather data interval"),
                "min": 30,
                "max": 1440,
                "units": _("minutes"),
                "step": 5
            }
        }]
    }, {
        "section-title": _("Units"),
        "widgets": [{
            "widget-type": "combobox",
            "widget-attrs": {
                "pref_key": "pref_temperature_unit"
            },
            "widget-kwargs": {
                "description": "Temperature unit",
                "options": {
                    "celsius": _("Celsius"),
                    "fahrenheit": _("Fahrenheit"),
                    "kelvin": _("Kelvin")
                }
            }
        }, {
            "widget-type": "combobox",
            "widget-attrs": {
                "pref_key": "pref_distance_unit"
            },
            "widget-kwargs": {
                "description": "Distance unit",
                "options": {
                    "km": _("Kilometers"),
                    "m": _("Meters"),
                    "mile": _("Miles")
                }
            }
        }, {
            "widget-type": "combobox",
            "widget-attrs": {
                "pref_key": "pref_wind_speed_unit"
            },
            "widget-kwargs": {
                "description": "Wind speed unit",
                "options": {
                    "kph": _("Kilometers per hour"),
                    "knot": _("Knots"),
                    "m/s": _("Meters per second"),
                    "mph": _("Miles per hour")
                }
            }
        }, {
            "widget-type": "combobox",
            "widget-attrs": {
                "pref_key": "pref_pressure_unit"
            },
            "widget-kwargs": {
                "description": "Atmospheric pressure unit",
                "options": {
                    "atm": _("Atmospheres"),
                    "hPa": _("Hectopascals"),
                    "inHg": _("Inches mercury"),
                    "kPa": _("Kilopascals"),
                    "mbar": _("Millibars"),
                    "mmHg": _("Millimeters mercury"),
                    "Pa": _("Pascals"),
                    "psi": _("Pounds per square inch")
                }
            }
        }]
    }, {
        "section-title": _("Debugging"),
        "section-notes": [CINN_RESTART],
        "widgets": [{
            "widget-type": "combobox",
            "widget-attrs": {
                "pref_key": "pref_logging_level"
            },
            "widget-kwargs": {
                "description": _("Logging level") + ASTERISK,
                "tooltip": LOGGING_LEVEL_TOOLTIP,
                "options": {
                    0: _("Normal"),
                    1: _("Verbose"),
                    2: _("Very verbose")
                }
            }
        }, {
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_debugger_enabled"
            },
            "widget-kwargs": {
                "description": _("Enable debugger") + ASTERISK,
                "tooltip": _("It enables the ability to catch all exceptions that under normal use would not be caught.")
            }
        }]
    }]
}

LOCATIONS_TAB = {
    "page-title": _("Locations"),
    "sections": [{
        "section-title": _("Locations manager"),
        "widgets": [{
            "widget-type": "list",
            "widget-attrs": {
                "pref_key": "pref_locations_storage",
                "apply_key": "trigger_reload_locations",
                "imp_exp_path_key": "pref_imp_exp_last_selected_directory"
            },
            "widget-kwargs": {
                "columns": COLUMNS,
                "height": 300,
                "move-buttons": False,
                "dialog-info-labels": INFO_LABELS
            }
        }]
    }]
}


APPEARANCE_TAB = {
    "page-title": _("Appearance"),
    "sections": [{
        "section-title": _("General appearance"),
        "widgets": [{
            "widget-type": "combobox",
            "widget-attrs": {
                "pref_key": "pref_icon_theme"
            },
            "widget-kwargs": {
                "description": _("Icon theme"),
                "options": {
                    "system": _("System"),
                    "built-in": _("Built-in"),
                    "custom": _("Custom")
                }
            }
        }, {
            "widget-type": "filechooser",
            "widget-attrs": {
                "pref_key": "pref_icon_theme_path_custom"
            },
            "widget-kwargs": {
                "description": _("Path to custom icon theme"),
                "select-dir": True
            }
        }]
    }, {
        "section-title": _("Menu appearance"),
        "section-notes": [CINN_RESTART_MIGHT],
        "widgets": [{
            "widget-type": "combobox",
            "widget-attrs": {
                "pref_key": "pref_menu_theme"
            },
            "widget-kwargs": {
                "description": _("Menu theme"),
                "options": {
                    "default": _("Default"),
                    "custom": _("Custom")
                }
            }
        }, {
            "widget-type": "filechooser",
            "widget-attrs": {
                "pref_key": "pref_menu_theme_path_custom"
            },
            "widget-kwargs": {
                "description": _("Path to custom style sheet")
            }
        }, {
            "widget-type": "combobox",
            "widget-attrs": {
                "pref_key": "pref_menu_orientation"
            },
            "widget-kwargs": {
                "description": _("Menu orientation"),
                "options": {
                    "horizontal": _("Horizontal"),
                    "vertical": _("Vertical")
                }
            }
        }, {
            "widget-type": "combobox",
            "widget-attrs": {
                "pref_key": "pref_menu_icon_type"
            },
            "widget-kwargs": {
                "description": _("Menu icon type") + ASTERISK,
                "valtype": int,
                "options": {
                    "1": _("Full color"),
                    "0": _("Symbolic")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_current_weather_icon_size"
            },
            "widget-kwargs": {
                "description": _("Current weather icon size"),
                "min": 16,
                "max": 512,
                "units": _("pixels"),
                "step": 2
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_forecasts_icon_size"
            },
            "widget-kwargs": {
                "description": _("Forecasts icon size"),
                "min": 16,
                "max": 512,
                "units": _("pixels"),
                "step": 2
            }
        }, {
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_temperature_high_first"
            },
            "widget-kwargs": {
                "description": _("Show high temperature first in forecast")
            }
        }, {
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_forecats_display_dates"
            },
            "widget-kwargs": {
                "description": _("Display forecast dates")
            }
        }, {
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_show_common_sense_hours"
            },
            "widget-kwargs": {
                "description": _("Display time in 24 hours format")
            }
        }]
    }, {
        "section-title": _("Applet appearance"),
        "section-notes": [CINN_RESTART_MIGHT],
        "widgets": [{
            "widget-type": "combobox",
            "widget-attrs": {
                "pref_key": "pref_applet_icon_type"
            },
            "widget-kwargs": {
                "description": _("Applet icon type") + ASTERISK,
                "valtype": int,
                "options": {
                    "1": _("Full color"),
                    "0": _("Symbolic")
                }
            }
        }, {
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_show_current_temperature_in_panel"
            },
            "widget-kwargs": {
                "description": _("Display current temperature in panel")
            }
        }, {
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_show_current_condition_in_panel"
            },
            "widget-kwargs": {
                "description": _("Display weather condition in panel")
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
            "widget-attrs": {
                "pref_key": "pref_darksky_credential_app_id"
            },
            "widget-kwargs": {
                "description": _("Secret Key")
            }
        }]
    }, {
        "section-title": _("OpenWeatherMap"),
        "widgets": [{
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_open_weather_map_credential_app_id"
            },
            "widget-kwargs": {
                "description": _("API Key")
            }
        }]
    }, {
        "section-title": _("WeatherBit"),
        "widgets": [{
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_weatherbit_credential_app_id"
            },
            "widget-kwargs": {
                "description": _("API Key")
            }
        }]
    }, {
        "section-title": _("Yahoo! Weather"),
        "widgets": [{
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_yahoo_credential_app_id"
            },
            "widget-kwargs": {
                "description": _("App ID")
            }
        }, {
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_yahoo_credential_client_id"
            },
            "widget-kwargs": {
                "description": _("Client ID (Consumer Key)")
            }
        }, {
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_yahoo_credential_client_secret"
            },
            "widget-kwargs": {
                "description": _("Client Secret (Consumer Secret)")
            }
        }]
    }]
}


PAGES_OBJECT = [
    GENERAL_TAB,
    LOCATIONS_TAB,
    APPEARANCE_TAB,
    CREDENTIALS_TAB
]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--xlet-type", dest="xlet_type")
    parser.add_argument("--xlet-instance-id", dest="xlet_instance_id")
    parser.add_argument("--xlet-uuid", dest="xlet_uuid")

    args = parser.parse_args()

    app = MainApplication(
        application_id="org.Cinnamon.Applets.WeatherApplet.Settings",
        xlet_type=args.xlet_type or "extension",
        xlet_instance_id=args.xlet_instance_id or None,
        xlet_uuid=args.xlet_uuid or "{{UUID}}",
        pages_definition=PAGES_OBJECT
    )
    app.run()
