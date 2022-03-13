#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys

if sys.version_info < (3, 7):
    msg = r'[1;31m WrongPythonVersion: Minimum Python version supported: 3.7 [0m'
    raise SystemExit(msg)

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(XLET_DIR)

from python_modules.xlets_settings import _
from python_modules.xlets_settings import cli
from python_modules.xlets_settings.builder import WindowDefinition
from python_modules.xlets_settings.builder import get_debugging_section

XLET_UUID = os.path.basename(XLET_DIR)
XLET_TYPE = os.path.basename(os.path.dirname(XLET_DIR))[:-1]

win_def = WindowDefinition()
general_page = win_def.add_page(_("General"))
general_section = general_page.add_section(_("General settings"))
general_section.add_widget("switch", "auto_hide", {
    "description": _("Auto-hide"),
    "tooltip": _("With this option enabled, applets will be hidden automatically. Otherwise, applets will be hidden when interacting with the drawer.")
})
general_section.add_widget("spinbutton", "hide_delay", {
    "description": _("Auto-hide delay"),
    "dependency": "auto_hide",
    "min": 0.25,
    "max": 10.0,
    "step": 0.25,
    "units": _("seconds")
})
general_section.add_widget("switch", "disable_starttime_autohide", {
    "description": _("Disable start time auto-hide"),
    "tooltip": _("Do not automatically hide at system startup."),
    "dependency": "auto_hide"
})
general_section.add_widget("switch", "hover_activates", {
    "description": _("Activate on hover"),
    "tooltip": _("Display applets on mouse hover.")
})
general_section.add_widget("switch", "hover_activates_hide", {
    "description": _("Hide on hover"),
    "tooltip": _("Hide applets on mouse hover."),
    "dependency": "hover_activates"
})
general_section.add_widget("spinbutton", "hover_delay", {
    "description": _("Hover delay"),
    "tooltip": _("Hide applets on mouse hover."),
    "dependency": "hover_activates",
    "min": 10,
    "max": 1000,
    "step": 10,
    "units": _("milliseconds")
})
general_section.add_widget("switch", "autohide_reshowing", {
    "description": _("Auto-hide reshowing applets"),
    "tooltip": _("With this option enabled, applets managed by the drawer and whose visibility is variable (the notifications applet for example), will be automatically hidden after a delay. With this option disabled, such applets will stay visible until the drawer is interacted again.")
})
general_section.add_widget("spinbutton", "autohide_reshowing_delay", {
    "description": _("Auto-hide delay"),
    "dependency": "autohide_reshowing",
    "min": 0,
    "max": 5,
    "step": 0.25,
    "units": _("seconds")
})

appear_page = win_def.add_page(_("Appearance"))
appear_section = appear_page.add_section(_("Appearance settings"))
appear_section.add_widget("iconfilechooser", "horizontal_expand_icon_name", {
    "description": _("Horizontal expand icon")
})
appear_section.add_widget("iconfilechooser", "horizontal_collapse_icon_name", {
    "description": _("Horizontal collapse icon")
})
appear_section.add_widget("iconfilechooser", "vertical_expand_icon_name", {
    "description": _("Vertical expand icon")
})
appear_section.add_widget("iconfilechooser", "vertical_collapse_icon_name", {
    "description": _("Vertical collapse icon")
})

other_page = win_def.add_page(_("Other"))
other_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
