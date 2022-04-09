#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys

if sys.version_info < (3, 7):
    msg = r'[1;31m WrongPythonVersion: Minimum Python version supported: 3.7 [0m'
    raise SystemExit(msg)

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, XLET_DIR)

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
applet_section.add_widget("entry", "applet_tooltip", {
    "description": _("Tooltip"),
    "tooltip": _("Enter custom text to show as the applet tooltip.")
})
applet_section.add_widget("keybinding", "toggle_menu_keybinding", {
    "description": _("Keyboard shortcut to open and close the menu"),
    "num-bind": 1
})

menu_page = win_def.add_page(_("Menu"))
menu_section = menu_page.add_section(_("Menu building settings"))
menu_section.add_widget("filechooser", "main_directory", {
    "description": _("Choose main directory"),
    "tooltip": _("Choose a directory with files and/or folders in it.\nThe files will be used to create the menu items.\nThe folders will be used to create sub-menus."),
    "select-dir": True
})
menu_section.add_widget("switch", "show_only_desktop_files", {
    "description": _("Show only .desktop files"),
    "tooltip": _("If enabled, only .desktop files will be used to create the menu.\nIf disabled, all file types will be used to create the menu.")
})
menu_section.add_widget("switch", "show_hidden_files", {
    "description": _("Show hidden files"),
    "tooltip": _("If enabled, hidden files will be used to create menu items.")
})
menu_section.add_widget("switch", "show_hidden_folders", {
    "description": _("Show hidden folders"),
    "tooltip": _("If enabled, hidden sub folders will also be used to create sub-menus.")
})
menu_section.add_widget("switch", "create_sub_menus", {
    "description": _("Create sub-menus"),
    "tooltip": _("If disabled, the sub folders found inside the main folder will be ignored and sub-menus will not be created.")
})
menu_section.add_widget("switch", "parse_directory_files_for_icons", {
    "description": _("Parse .directory files for icons"),
    "tooltip": _("If enabled, .directory files will be used to assign icons to sub-menus.")
})

menu_section = menu_page.add_section(_("Menu behavior settings"))
menu_section.add_widget("switch", "auto_close_opened_sub_menus", {
    "description": _("Keep just one sub menu open"),
    "tooltip": _("When enabled, the previously opened sub menu will be automatically closed.")
})
menu_section.add_widget("switch", "autoupdate", {
    "description": _("Auto-update menu"),
    "tooltip": _("If enabled, the applet will monitor the main folder for added/deleted/renamed files/folders and rebuild the menu.\nIf disabled, the menu will have to be updated manually from its context menu.")
})

adv_page = win_def.add_page(_("Advanced"))
adv_section = adv_page.add_section(_("Advanced settings"))
adv_section.add_widget("spinbutton", "max_files_to_handle_fail_safe", {
    "description": _("Maximum amount of files/folders to use to create menu items"),
    "min": 100,
    "max": 10000,
    "step": 100,
    "units": _("files/folders")
})
adv_section.add_widget("spinbutton", "max_files_to_list_fail_safe", {
    "description": _("Maximum amount of files/folders to allow to be listed"),
    "min": 100,
    "max": 10000,
    "step": 100,
    "units": _("files/folders")
})
adv_section.add_widget("textview", "files_blacklist", {
    "description": _("Colon separated list of file names to ignore"),
    "tooltip": _("This is a black list. Names listed here will not be used to create menu items."),
    "height": 100
})
adv_section.add_widget("textview", "dirs_blacklist", {
    "description": _("Colon separated list of folder names to ignore"),
    "tooltip": _("This is a black list. Names listed here will not be used to create menu items."),
    "height": 100
})

appear_page = win_def.add_page(_("Appearance"))
appear_section = appear_page.add_section(_("Appearance settings"))
appear_section.add_widget("iconfilechooser", "icon_for_submenus", {
    "description": _("Default icon for sub-menus")
})
appear_section.add_widget("switch", "show_submenu_icons", {
    "description": _("Display sub-menu icons")
})
appear_section.add_widget("spinbutton", "sub_menu_icon_size", {
    "description": _("Sub-menus icon size"),
    "dependency": "show_submenu_icons",
    "min": 16,
    "max": 512,
    "step": 1,
    "units": _("pixels")
})
appear_section.add_widget("switch", "show_menuitem_icons", {
    "description": _("Display menu items icon")
})
appear_section.add_widget("spinbutton", "menuitem_icon_size", {
    "description": _("Menu items icon size"),
    "dependency": "show_submenu_icons",
    "min": 16,
    "max": 512,
    "step": 1,
    "units": _("pixels")
})
appear_section.add_widget("textview", "style_for_sub_menus", {
    "description": _("Style for sub-menus"),
    "height": 100
})
appear_section.add_widget("textview", "style_for_menu_items", {
    "description": _("Style for menu items"),
    "height": 100
})
appear_section.add_widget("button", "apply_styles", {
    "description": "Apply styles"
})

other_page = win_def.add_page(_("Other"))
other_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
