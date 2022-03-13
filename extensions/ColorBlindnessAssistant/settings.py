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

EFFECTS_LIST_INFO_LABELS = [
    "<b>%s</b>: %s" % (
        escape(_("Acromatopia (rod monochromatism)")),
        escape(_("Total or almost total color blindness."))
    ),
    "<b>%s</b>: %s" % (
        escape(_("Acromatopia (blue-cone monochromatism)")),
        escape(_("Total or almost total color blindness."))
    ),
    "<b>%s</b>: %s" % (
        escape(_("Deuteranopia")),
        escape(_("Green color deficiency."))
    ),
    "<b>%s</b>: %s" % (
        escape(_("Protanopia")),
        escape(_("Red color deficiency."))
    ),
    "<b>%s</b>: %s" % (
        escape(_("Tritanopia")),
        escape(_("Blue color deficiency."))
    )
]

EFFECTS_COLUMNS = [{
    "id": "base_name",
    "title": _("Effect"),
    "default": "acromatopia_rod_simulation",
    "type": "string",
    "options": {
        "acromatopia_rod_simulation": _("Acromatopia (rod) simulation"),
        "acromatopia_blue_cone_simulation": _("Acromatopia (blue cone) simulation"),
        "deuteranopia_compensation": _("Deuteranopia compensation"),
        "deuteranopia_simulation": _("Deuteranopia simulation"),
        "protanopia_compensation": _("Protanopia compensation"),
        "protanopia_simulation": _("Protanopia simulation"),
        "tritanopia_compensation": _("Tritanopia compensation"),
        "tritanopia_simulation": _("Tritanopia simulation"),
    }
}, {
    "id": "actor",
    "title": _("Actor"),
    "default": "focused_window",
    "type": "string",
    "options": {
        "focused_window": _("Focused window"),
        "screen": _("Screen"),
    }
}, {
    "id": "color_space",
    "title": _("Color space"),
    "default": "srgb",
    "type": "string",
    "options": {
        "srgb": _("sRGB"),
        "cie": _("CIE RGB"),
    }
}, {
    "id": "keybinding",
    "title": _("Keybinding"),
    "type": "keybinding",
    "num-bind": 1
}]


ALWAYS_COPY_TT = _("The color inspector UI can be closed with any mouse click. This option allows to choose what information to copy to clipboard when the UI is closed with a mouse click.")

COMBO_OPTIONS = {
    "disabled": _("Disabled"),
    "summary": _("Color summary"),
    "input_hex": _("Input HEX"),
    "input_rgb": _("Input RGB"),
    "input_hsl": _("Input HSL"),
    "detected_hex": _("Detected HEX"),
    "detected_rgb": _("Detected RGB"),
    "detected_hsl": _("Detected HSL"),
    "hue_hex": _("Hue HEX"),
    "hue_rgb": _("Hue RGB"),
    "hue_hsl": _("Hue HSL")
}

win_def = WindowDefinition()
inspector_page = win_def.add_page(_("Color inspector"))
inspector_section = inspector_page.add_section(_("Color inspector settings"))
inspector_section.add_widget("keybinding", "color_inspector_kb", {
    "description": _("Keybinding"),
    "num-bind": 1
})
inspector_section.add_widget("switch", "color_inspector_hex_visible", {
    "description": _("Display colors in HEX format")
})
inspector_section.add_widget("switch", "color_inspector_rgb_visible", {
    "description": _("Display colors in RGB format")
})
inspector_section.add_widget("switch", "color_inspector_hsl_visible", {
    "description": _("Display colors in HSL format")
})
inspector_section.add_widget("combobox", "color_inspector_positioning_mode", {
    "description": _("Color inspector positioning mode"),
    "options": {
        "follow": _("Follow cursor"),
        "initial": _("Initial position"),
        "corners": _("Screen corners")
    }
})
inspector_section.add_widget("combobox", "color_inspector_always_copy_to_clipboard_lc", {
    "description": _("Always copy color information to clipboard") + " (%s)" % _("Left click"),
    "tooltip": ALWAYS_COPY_TT,
    "first-option": "disabled",
    "options": COMBO_OPTIONS
})
inspector_section.add_widget("combobox", "color_inspector_always_copy_to_clipboard_rc", {
    "description": _("Always copy color information to clipboard") + " (%s)" % _("Right click"),
    "tooltip": ALWAYS_COPY_TT,
    "first-option": "disabled",
    "options": COMBO_OPTIONS
})
inspector_section.add_widget("switch", "color_inspector_always_copy_to_clipboard_notify", {
    "description": _("Display notification after copying to clipboard"),
})
inspector_section.add_widget("spinbutton", "color_inspector_animation_time", {
    "description": _("UI animation time"),
    "units": _("milliseconds"),
    "default": 200,
    "max": 500,
    "min": 0,
    "step": 50,
    "page": 100
})

daltonizer_page = win_def.add_page(_("Daltonizer"))
daltonizer_section = daltonizer_page.add_section(_("Daltonizer settings"))
daltonizer_section.add_widget("keybinding", "daltonizer_wizard_kb", {
    "description": _("Keybinding"),
    "num-bind": 1
})
daltonizer_section.add_widget("spinbutton", "daltonizer_animation_time", {
    "description": _("UI animation time"),
    "tooltip": _("Set to zero to disable animations."),
    "units": _("milliseconds"),
    "default": 200,
    "max": 500,
    "min": 0,
    "step": 50,
    "page": 100
})
daltonizer_section.add_widget("switch", "daltonizer_compact_ui", {
    "description": _("Compact UI")
})
daltonizer_section.add_widget("switch", "daltonizer_show_actors_box", {
    "description": _("Display actor selection section")
})
daltonizer_section.add_widget("switch", "daltonizer_show_colorspaces_box", {
    "description": _("Display color space selection section")
})

effects_page = win_def.add_page(_("Effects"))
effects_section = effects_page.add_section(_("Effects settings"))
effects_section.add_label({
    "label": _("Assign specific effects to keyboard shortcuts.")
})
effects_section.add_widget("list", "effects_list", {
    "columns": EFFECTS_COLUMNS,
    "height": 250,
    "dialog-info-labels": EFFECTS_LIST_INFO_LABELS
})

other_page = win_def.add_page(_("Other"))
other_section = other_page.add_section(_("GUI theme"))
other_section.add_widget("combobox", "theme", {
    "description": _("Theme"),
    "options": {
        "default": _("Default"),
        "custom": _("Custom")
    }
})
other_section.add_widget("filechooser", "theme_path_custom", {
    "description": _("Custom theme path"),
    "dependency": "theme=custom"
})

other_section = other_page.add_section(_("Miscellaneous"))
other_section.add_widget("switch", "apply_cinnamon_injections", {
    "description": _("Windows clones inherit effects"),
    "tooltip": _("Window thumbnails generated by the [[Alt]] + [[Tab]] switchers and workspace previews will inherit the effect of the real windows.")
})

other_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
