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
from python_modules.xlets_settings.builder import ASTERISK_END
from python_modules.xlets_settings.builder import CINN_RESTART_MIGHT
from python_modules.xlets_settings.builder import WindowDefinition
from python_modules.xlets_settings.builder import get_debugging_section

XLET_UUID = os.path.basename(XLET_DIR)
XLET_TYPE = os.path.basename(os.path.dirname(XLET_DIR))[:-1]

LOCATIONS_STORAGE_INFO_LABELS = [
    "<b>%s</b>" % escape(_("Language legends")),
    "<b>(O)</b>: %s" % escape(_("Language supported by OpenWeatherMap.")),
    "<b>(W)</b>: %s" % escape(_("Language supported by WeatherBit.")),
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
        "af": "af (O)",
        "al": "al (O)",
        "ar": "ar (O)(W)",
        "az": "az (O)(W)",
        "be": "be (W)",
        "bg": "bg (O)(W)",
        "bs": "bs (W)",
        "ca": "ca (O)(W)",
        "cz": "cz (O)(W)",
        "da": "da (O)(W)",
        "de": "de (O)(W)",
        "el": "el (O)(W)",
        "en": "en (O)(W)",
        "es": "es (O)(W)",
        "et": "et (W)",
        "eu": "eu (O)",
        "fa": "fa (O)",
        "fi": "fi (O)(W)",
        "fr": "fr (O)(W)",
        "gl": "gl (O)",
        "he": "he (O)",
        "hi": "hi (O)",
        "hr": "hr (O)(W)",
        "hu": "hu (O)(W)",
        "id": "id (O)(W)",
        "is": "is (W)",
        "it": "it (O)(W)",
        "iw": "iw (W)",
        "ja": "ja (O)(W)",
        "kr": "kr (O)",
        "kw": "kw (W)",
        "la": "la (O)",
        "lt": "lt (O)(W)",
        "mk": "mk (O)",
        "nb": "nb (W)",
        "nl": "nl (O)(W)",
        "no": "no (O)",
        "pl": "pl (O)(W)",
        "pt": "pt (O)(W)",
        "ro": "ro (O)(W)",
        "ru": "ru (O)(W)",
        "se": "se (O)",
        "sk": "sk (O)(W)",
        "sl": "sl (O)(W)",
        "sp": "sp (O)",
        "sr": "sr (O)(W)",
        "sv": "sv (O)(W)",
        "th": "th (O)",
        "tr": "tr (O)(W)",
        "ua": "ua (O)",
        "uk": "uk (O)(W)",
        "vi": "vi (O)",
        "zh": "zh (W)",
        "zh-tw": "zh-tw (W)",
        "zh_cn": "zh_cn (O)",
        "zh_tw": "zh_tw (O)",
        "zu": "zu (O)",
    }
}, {
    "id": "forecastDays",
    "title": _("Fore. days"),
    "type": "integer",
    "col-resize": False,
    "default": 5,
    "min": 1,
    "max": 16,
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
    "default": "OpenWeatherMap",
    "options": [
        "OpenWeatherMap",
        "WeatherBit"
    ]
}]

win_def = WindowDefinition()
general_page = win_def.add_page(_("General"))
general_section = general_page.add_section(_("General"))
general_section.add_widget("keybinding", "toggle_menu_keybinding", {
    "description": _("Keyboard shortcut to open and close the menu"),
    "num-bind": 1
})
general_section.add_widget("spinbutton", "refresh_interval", {
    "description": _("Update weather data interval"),
    "min": 30,
    "max": 1440,
    "units": _("minutes"),
    "step": 5
})

general_section = general_page.add_section(_("Units"))
general_section.add_widget("combobox", "temperature_unit", {
    "description": "Temperature unit",
    "options": {
        "celsius": _("Celsius"),
        "fahrenheit": _("Fahrenheit"),
        "kelvin": _("Kelvin")
    }
})
general_section.add_widget("combobox", "distance_unit", {
    "description": "Distance unit",
    "options": {
        "km": _("Kilometers"),
        "m": _("Meters"),
        "mile": _("Miles")
    }
})
general_section.add_widget("combobox", "wind_speed_unit", {
    "description": "Wind speed unit",
    "options": {
        "kph": _("Kilometers per hour"),
        "knot": _("Knots"),
        "m/s": _("Meters per second"),
        "mph": _("Miles per hour")
    }
})
general_section.add_widget("combobox", "pressure_unit", {
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
})


locations_page = win_def.add_page(_("Locations"))
locations_section = locations_page.add_section(_("Locations manager"))
locations_section.add_widget("list", "locations_storage", {
    "columns": COLUMNS,
    "height": 300,
    "move-buttons": False,
    "dialog-info-labels": LOCATIONS_STORAGE_INFO_LABELS
})

appear_page = win_def.add_page(_("Appearance"))
appear_section = appear_page.add_section(_("General appearance"))
appear_section.add_widget("combobox", "icon_theme", {
    "description": _("Icon theme"),
    "options": {
        "system": _("System"),
        "built-in": _("Built-in"),
        "custom": _("Custom")
    }
})
appear_section.add_widget("filechooser", "icon_theme_path_custom", {
    "description": _("Path to custom icon theme"),
    "select-dir": True
})

appear_section = appear_page.add_section(_("Menu appearance"), notes=[CINN_RESTART_MIGHT])
appear_section.add_widget("combobox", "menu_theme", {
    "description": _("Menu theme"),
    "options": {
        "default": _("Default"),
        "custom": _("Custom")
    }
})
appear_section.add_widget("filechooser", "menu_theme_path_custom", {
    "description": _("Path to custom style sheet")
})
appear_section.add_widget("combobox", "menu_orientation", {
    "description": _("Menu orientation"),
    "options": {
        "horizontal": _("Horizontal"),
        "vertical": _("Vertical")
    }
})
appear_section.add_widget("combobox", "menu_icon_type", {
    "description": _("Menu icon type") + ASTERISK_END,
    "valtype": int,
    "options": {
        "1": _("Full color"),
        "0": _("Symbolic")
    }
})
appear_section.add_widget("spinbutton", "current_weather_icon_size", {
    "description": _("Current weather icon size"),
    "min": 16,
    "max": 512,
    "units": _("pixels"),
    "step": 2
})
appear_section.add_widget("spinbutton", "forecasts_icon_size", {
    "description": _("Forecasts icon size"),
    "min": 16,
    "max": 512,
    "units": _("pixels"),
    "step": 2
})
appear_section.add_widget("switch", "temperature_high_first", {
    "description": _("Show high temperature first in forecast")
})
appear_section.add_widget("switch", "forecats_display_dates", {
    "description": _("Display forecast dates")
})
appear_section.add_widget("switch", "show_common_sense_hours", {
    "description": _("Display time in 24 hours format")
})

appear_section = appear_page.add_section(_("Applet appearance"), notes=[CINN_RESTART_MIGHT])
appear_section.add_widget("combobox", "applet_icon_type", {
    "description": _("Applet icon type") + ASTERISK_END,
    "valtype": int,
    "options": {
        "1": _("Full color"),
        "0": _("Symbolic")
    }
})
appear_section.add_widget("switch", "show_current_temperature_in_panel", {
    "description": _("Display current temperature in panel")
})
appear_section.add_widget("switch", "show_current_condition_in_panel", {
    "description": _("Display weather condition in panel")
})

cred_page = win_def.add_page(_("Credentials"))
cred_section = cred_page.add_section(_("OpenWeatherMap"))
cred_section.add_widget("entry", "open_weather_map_credential_app_id", {
    "description": _("API Key")
})
cred_section = cred_page.add_section(_("WeatherBit"))
cred_section.add_widget("entry", "weatherbit_credential_app_id", {
    "description": _("API Key")
})


other_page = win_def.add_page(_("Other"))
other_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
