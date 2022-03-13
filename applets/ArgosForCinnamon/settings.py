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
applet_page = win_def.add_page(_("Applet"))
applet_section = applet_page.add_section(_("Applet settings"))
applet_section.add_widget("iconfilechooser", "applet_icon", {
    "description": _("Icon"),
    "tooltip": _("Select an icon to show in the panel.")
})
applet_section.add_widget("entry", "applet_label", {
    "description": _("Label"),
    "tooltip": _("Enter custom text to show in the panel.")
})
applet_section.add_widget("switch", "show_script_name", {
    "description": _("Show script name on applet"),
    "tooltip": _("When inside the script there isn't a line assigned to be shown on the applet, the script name will be displayed. With this option disabled, the script name will not be shown on this applet, giving us the possibility to use a custom text for the applet.")
})
applet_section.add_widget("switch", "prevent_applet_lines_ellipsation", {
    "description": _("Prevent applet lines ellipsation"),
    "tooltip": _("When enabled, the text of lines defined in a script to be displayed in the applet will not ellipsize.")
})
applet_section.add_widget("keybinding", "toggle_menu_keybinding", {
    "description": _("Keyboard shortcut to open and close the menu")
})
applet_section.add_widget("switch", "animate_menu", {
    "description": _("Animate menu"),
    "tooltip": _("Enables/Disables menu open/close animations.")
})
applet_section.add_widget("switch", "keep_one_menu_open", {
    "description": _("Keep just one sub menu open"),
    "tooltip": _("When enabled, the previously opened sub menu will be automatically closed.")
})

script_page = win_def.add_page(_("Script"))
script_section = script_page.add_section(_("Script settings"))
script_section.add_widget("filechooser", "file_path", {
    "description": _("Path to script")
})
script_section.add_widget("switch", "update_on_menu_open", {
    "description": _("Execute script on menu open"),
    "tooltip": _("When enabled, the script will be executed immediately when the main menu is opened to refresh its content.")
})
script_section.add_widget("spinbutton", "update_interval", {
    "description": _("Execution interval"),
    "tooltip": _("Set the script execution interval. If set to 0 (zero), the timer will be disabled."),
    "min": 0,
    "max": 3600,
    "step": 1,
    "units": _("custom")
})
script_section.add_widget("combobox", "update_interval_units", {
    "description": _("Execution interval time unit"),
    "tooltip": _("Choose the time unit for the script execution interval."),
    "options": {
        "Seconds": "s",
        "Minutes": "m",
        "Hours": "h",
        "Days": "d"
    }
})
script_section.add_widget("spinbutton", "rotation_interval", {
    "description": _("Rotation interval"),
    "tooltip": _("Set the applet text rotation interval. If set to 0 (zero), the timer will be disabled. This timer is only used if there are more than one line asigned to be displayed as the applet text. If there is only one line asigned for the applet text, this timer will be completely ignored. So, it isn't needed to set this timer to 0 (zero) to disable it."),
    "min": 0,
    "max": 3600,
    "step": 1,
    "units": _("custom")
})
script_section.add_widget("combobox", "rotation_interval_units", {
    "description": _("Rotation interval time unit"),
    "tooltip": _("Choose the time unit for the applet text rotation interval."),
    "options": {
        "Seconds": "s",
        "Minutes": "m",
        "Hours": "h",
        "Days": "d"
    }
})
script_section.add_widget("switch", "cycle_on_menu_open", {
    "description": _("Rotate script only when menu is open"),
    "tooltip": _("When enabled, the script will be executed and its execution repeated at the specified rotation interval only when the main menu is opened.")
})

appear_page = win_def.add_page(_("Appearance"))
appear_section = appear_page.add_section(_("Appearance settings"))
appear_section.add_widget("spinbutton", "default_icon_size", {
    "description": _("Default icon size"),
    "tooltip": _("Set a default size in pixels for the icons inside this applet main menu. The size of the icon of a menu item can be overridden by setting the \"iconSize\" attribute on the menu item's respective line on the script."),
    "min": 16,
    "max": 512,
    "step": 1,
    "units": _("pixels")
})
appear_section.add_widget("spinbutton", "menu_spacing", {
    "description": _("Spacing for items inside the menu"),
    "min": 0.00,
    "max": 10.00,
    "step": 0.05,
    "units": "ems"
})
appear_section.add_widget("spinbutton", "menu_spacing", {
    "description": _("Spacing for items inside the applet"),
    "min": 0,
    "max": 10,
    "step": 1,
    "units": _("pixels")
})

adv_page = win_def.add_page(_("Advanced"))
adv_section = adv_page.add_section(_("Advanced settings"))
adv_section.add_widget("entry", "terminal_emulator", {
    "description": _("Terminal emulator"),
    "tooltip": _("Choose the terminal emulator used by this applet. Used when an item has the 'terminal' attribute set to true.")
})
adv_section.add_widget("entry", "terminal_emulator_argument", {
    "description": _("Terminal emulator argument"),
    "tooltip": _("The argument used by a terminal program that allows to execute a command inside the terminal window. In most terminals is '-e'. In terminals that decided to reinvent the wheel, read their manual pages.")
})
adv_section.add_widget("entry", "shell", {
    "description": _("Default shell"),
    "tooltip": _("Default shell used to execute commands.")
})
adv_section.add_widget("entry", "shell_argument", {
    "description": _("Shell argument"),
    "tooltip": _("The argument used by a shell program that allows to execute a command. In most shells is '-c'.")
})

other_page = win_def.add_page(_("Other"))
other_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
