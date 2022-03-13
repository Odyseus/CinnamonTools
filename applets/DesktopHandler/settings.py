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
from python_modules.xlets_settings.builder import ASTERISK_END
from python_modules.xlets_settings.builder import CINN_RESTART
from python_modules.xlets_settings.builder import WindowDefinition
from python_modules.xlets_settings.builder import get_debugging_section

XLET_UUID = os.path.basename(XLET_DIR)
XLET_TYPE = os.path.basename(os.path.dirname(XLET_DIR))[:-1]

COMBOBOX_OPTIONS_SCROLL_CLICK = {
    "expo": _("Expo"),
    "overview": _("Overview"),
    "appswitcher": _("Launch App Switcher"),
    "desktop": _("Toggle Show desktop"),
    "cc1": _("Run 1st Custom Command"),
    "cc2": _("Run 2nd Custom Command"),
    "cc3": _("Run 3rd Custom Command"),
    "cc4": _("Run 4rd Custom Command"),
    "none": _("None"),
}

COMBOBOX_OPTIONS_HOVER = {
    "expo": _("Expo"),
    "overview": _("Overview"),
    "appswitcher": _("Launch App Switcher"),
    "desktop": _("Toggle Show desktop"),
    "peek": _("Desktop Peek")
}

COMBOBOX_OPTIONS_SWITCHER_STYLE = {
    "icons": _("Icons only"),
    "thumbnails": _("Thumbnails only"),
    "icons+thumbnails": _("Icons and thumbnails"),
    "icons+preview": _("Icons and window preview"),
    "preview": _("Window preview (no icons)"),
    "coverflow": _("Coverflow (3D)"),
    "timeline": _("Timeline (3D)"),
    "default": _("System default")
}

COMBOBOX_OPTIONS_APP_SWITCHER = {
    "switch-windows": _("Current workspace"),
    "switch-panels": _("All workspaces"),
    "switch-group": _("Current Application")
}

KEEP_OPEN_TOOLTIP = _(
    "Even with this preference disabled, the menu can be kept open if the Control modifier key is pressed while performing the action.")

win_def = WindowDefinition()
applet_page = win_def.add_page(_("Applet settings"))
applet_section = applet_page.add_section(_("Applet settings"), notes=[CINN_RESTART])
applet_section.add_widget("iconfilechooser", "applet_icon", {
    "description": _("Icon"),
    "tooltip": _("Select an icon to show in the panel.")
})
applet_section.add_widget("entry", "applet_label", {
    "description": _("Label"),
    "tooltip": _("Enter custom text to show in the panel.")
})
applet_section.add_widget("spinbutton", "applet_width_height", {
    "description": _("Applet custom width/height") + ASTERISK_END,
    "tooltip": _("Set to 0 (zero) to not set a width/height. On horizontal panels it will set a fixed width, and on vertical panels it will set a fixed height."),
    "min": 0,
    "max": 500,
    "step": 1,
    "page": 10,
    "units": _("pixels")
})

hover_section = applet_page.add_section(_("Hover over applet settings"))
hover_section.add_widget("switch", "hover_enabled", {
    "description": _("Enable hover actions")
})
hover_section.add_widget("combobox", "hover_action", {
    "description": _("Action on applet hover"),
    "dependency": "hover_enabled",
    "options": COMBOBOX_OPTIONS_HOVER
})
hover_section.add_widget("spinbutton", "hover_delay", {
    "description": _("Hover delay"),
    "dependency": "hover_enabled",
    "min": 0,
    "max": 2000,
    "step": 10,
    "page": 100,
    "units": _("milliseconds")
})

hover_section = applet_page.add_section(_("Desktop peek settings"), dependency="hover_action=peek")
hover_section.add_widget("switch", "opacify_desktop_icons", {
    "description": _("Opacify the icons on the desktop")
})
hover_section.add_widget("switch", "opacify_desklets", {
    "description": _("Opacify desklets")
})
hover_section.add_widget("scale", "peek_opacity", {
    "description": _("Level of opacity"),
    "min": 0,
    "max": 255,
    "step": 10
})
hover_section.add_widget("switch", "blur_effect_enabled", {
    "description": _("Blur windows")
})

mouse_page = win_def.add_page(_("Mouse settings"))
mouse_section = mouse_page.add_section(_("Mouse click settings"))
mouse_section.add_widget("combobox", "left_click_action", {
    "description": _("Action on applet left click"),
    "dependency": "button_to_open_menu!=winlistmenu1",
    "options": COMBOBOX_OPTIONS_SCROLL_CLICK
})
mouse_section.add_widget("combobox", "middle_click_action", {
    "description": _("Action on applet middle click"),
    "dependency": "button_to_open_menu!=winlistmenu2",
    "options": COMBOBOX_OPTIONS_SCROLL_CLICK
})

mouse_section = mouse_page.add_section(_("Mouse scroll settings"))
mouse_section.add_widget("combobox", "scroll_action", {
    "description": _("Action on scrolling"),
    "valtype": str,
    "options": {
        "switch_workspace": _("Switch between workspaces"),
        "adjust_opacity": _("Adjust opacity of windows"),
        "desktop": _("Toggle Show desktop"),
        "switch-windows": _("Switch between windows"),
        "none": _("None"),
    }
})
mouse_section.add_widget("switch", "prevent_fast_scroll", {
    "description": _("Prevent accidental workspace/window switching on rapid scrolling")
})
mouse_section.add_widget("spinbutton", "scroll_delay", {
    "description": _("Minimum delay between scrolls"),
    "dependency": "prevent_fast_scroll",
    "min": 0,
    "max": 500,
    "step": 10,
    "page": 100,
    "units": _("milliseconds")
})
mouse_section.add_widget("switch", "separated_scroll_action", {
    "description": _("Independent actions for scrolling up and down")
})
mouse_section.add_widget("combobox", "scroll_up_action", {
    "description": _("Action on scrolling up"),
    "dependency": "separated_scroll_action",
    "options": COMBOBOX_OPTIONS_SCROLL_CLICK
})
mouse_section.add_widget("combobox", "scroll_down_action", {
    "description": _("Action on scrolling down"),
    "dependency": "separated_scroll_action",
    "options": COMBOBOX_OPTIONS_SCROLL_CLICK
})

win_menu_page = win_def.add_page(_("Windows list menu"))
win_menu_section = win_menu_page.add_section(_("Windows list menu settings"), notes=[CINN_RESTART])
win_menu_section.add_widget("switch", "windows_list_menu_enabled", {
    "description": _("Enable Windows list menu") + ASTERISK_END
})
win_menu_section.add_widget("combobox", "button_to_open_menu", {
    "description": _("Mouse button to open menu (It will override mouse click actions)"),
    "dependency": "windows_list_menu_enabled",
    "options": {
        "winlistmenu1": _("Left click"),
        "winlistmenu2": _("Middle click"),
        "winlistmenu3": _("Right click")
    }
})
win_menu_section.add_widget("switch", "show_close_buttons", {
    "description": _("Show close buttons on windows list"),
    "dependency": "windows_list_menu_enabled",
})
win_menu_section.add_widget("switch", "show_close_all_buttons", {
    "description": _("Show close all windows buttons for workspaces"),
    "dependency": "windows_list_menu_enabled",
})
win_menu_section.add_widget("switch", "keep_menu_open_when_closing", {
    "description": _("Keep menu open while closing windows"),
    "tooltip": KEEP_OPEN_TOOLTIP,
    "dependency": "windows_list_menu_enabled",
})
win_menu_section.add_widget("switch", "keep_menu_open_when_activating", {
    "description": _("Keep menu open while activating windows"),
    "tooltip": KEEP_OPEN_TOOLTIP,
    "dependency": "windows_list_menu_enabled",
})
win_menu_section.add_widget("switch", "show_context_menu_default_items", {
    "description": _("Show context menu default items on right click"),
    "dependency": "windows_list_menu_enabled",
})
win_menu_section.add_widget("switch", "show_context_menu_help", {
    "description": _("Show \"Help\""),
    "dependency": "show_context_menu_default_items"
})
win_menu_section.add_widget("switch", "show_context_menu_about", {
    "description": _("Show \"About...\""),
    "dependency": "show_context_menu_default_items"
})
win_menu_section.add_widget("switch", "show_context_menu_remove", {
    "description": _("Show \"Remove\""),
    "dependency": "show_context_menu_default_items"
})

appswitcher_page = win_def.add_page(_("App switcher"))
appswitcher_section = appswitcher_page.add_section(_("App switcher settings"))
appswitcher_section.add_widget("combobox", "switcher_style", {
    "description": _("App switcher style"),
    "options": COMBOBOX_OPTIONS_SWITCHER_STYLE
})
appswitcher_section.add_widget("combobox", "switcher_scope", {
    "description": _("Switch between windows from"),
    "options": COMBOBOX_OPTIONS_APP_SWITCHER
})
appswitcher_section.add_widget("combobox", "switcher_scope_modified", {
    "description": _("When a modifier key is pressed, switch between windows from"),
    "options": COMBOBOX_OPTIONS_APP_SWITCHER
})
appswitcher_section.add_widget("combobox", "switcher_scope_modifier", {
    "description": _("Modifier key"),
    "options": {
        "4": _("Ctrl"),
        "1": _("Shift")
    }
})

appear_page = win_def.add_page(_("Appearance"))
appear_section = appear_page.add_section(_("Appearance settings"))
appear_section.add_widget("iconfilechooser", "icon_close_all_windows", {
    "description": _("Close all windows icon")
})
appear_section.add_widget("spinbutton", "icon_close_all_windows_size", {
    "description": _("Close all windows icon size"),
    "min": 12,
    "max": 256,
    "step": 2,
    "page": 2,
    "units": _("pixels")
})
appear_section.add_widget("iconfilechooser", "icon_close_window", {
    "description": _("Close window icon")
})
appear_section.add_widget("spinbutton", "icon_close_window_size", {
    "description": _("Close window icon size"),
    "min": 12,
    "max": 256,
    "step": 2,
    "page": 2,
    "units": _("pixels")
})
appear_section.add_widget("spinbutton", "icon_applications_size", {
    "description": _("Applications icon size"),
    "min": 12,
    "max": 256,
    "step": 2,
    "page": 2,
    "units": _("pixels")
})

commands_page = win_def.add_page(_("Commands"))
commands_section = commands_page.add_section(_("Custom commands"))
commands_section.add_widget("entry", "custom_cmd1_action", {
    "description": _("1st Custom Command")
})
commands_section.add_widget("entry", "custom_cmd2_action", {
    "description": _("2nd Custom Command")
})
commands_section.add_widget("entry", "custom_cmd3_action", {
    "description": _("3rd Custom Command")
})
commands_section.add_widget("entry", "custom_cmd4_action", {
    "description": _("4rd Custom Command")
})

other_page = win_def.add_page(_("Other"))
other_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
