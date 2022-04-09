#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys

if sys.version_info < (3, 7):
    msg = r'[1;31m WrongPythonVersion: Minimum Python version supported: 3.7 [0m'
    raise SystemExit(msg)

from html import escape

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, XLET_DIR)

from python_modules.xlets_settings import _
from python_modules.xlets_settings import cli
from python_modules.xlets_settings.builder import Section
from python_modules.xlets_settings.builder import WindowDefinition
from python_modules.xlets_settings.builder import get_debugging_section

XLET_UUID = os.path.basename(XLET_DIR)
XLET_TYPE = os.path.basename(os.path.dirname(XLET_DIR))[:-1]


def get_save_button_section():
    section = Section("")
    section.add_widget("button", "hard_refresh_menu", {
        "description": _("Save settings"),
        "tooltip": _("Most settings are not automatically saved when modified.\nPress this button for the settings to take effect.")
    })
    return section


LAUNCHERS_COLUMNS = [{
    "id": "enabled",
    "title": _("Enabled"),
    "default": True,
    "type": "boolean"
}, {
    "id": "icon",
    "title": "%s (*)" % _("Icon"),
    "type": "icon"
}, {
    "id": "title",
    "title": "%s (*)" % _("Title"),
    "type": "string"
}, {
    "id": "command",
    "title": "%s (*)" % _("Command"),
    "type": "string"
}, {
    "id": "description",
    "title": _("Description"),
    "type": "string"
}]

# NOTE: Justification for using a list widget instead of individual switches.
# - Only one setting instead of eleven.
# - Possibility to change the order of the menu items.
CONTEXT_MENU_COLUMNS = [{
    "id": "enabled",
    "title": _("Enabled"),
    "default": True,
    "type": "boolean"
}, {
    "id": "context_id",
    "title": _("Menu item label"),
    "type": "string",
    "options": {
        "add_to_panel": _("Add to panel"),
        "add_to_desktop": _("Add to desktop"),
        "add_remove_favorite": _("Add/Remove to/from favorites"),
        "uninstall": _("Uninstall"),
        "run_with_nvidia_gpu": _("Run with NVIDIA GPU"),
        "run_as_root": _("Run as root"),
        "edit_desktop_file": _("Edit .desktop file"),
        "edit_with_menu_editor": _("Edit with menu editor"),
        "desktop_file_folder": _("Open .desktop file folder"),
        "run_from_terminal": _("Run from terminal"),
        "run_from_terminal_as_root": _("Run from terminal as root"),
    }
}]

# NOTE: Justification for using a list widget instead of individual spin buttons.
# - Only one settings instead of twenty.
# - Less of a chore to edit.
MENU_ELEMENTS_PADDING_COLUMNS = [{
    "id": "element_id",
    "title": _("Menu element"),
    "type": "string",
    "options": {
        "custom_launchers_box": _("Custom launchers box"),
        "categories_box": _("Categories box"),
        "applications_box": _("Applications box"),
        "search_entry": _("Search entry"),
        "search_box": _("Search box"),
    }
}, {
    "id": "top_padding",
    "title": _("Top padding"),
    "type": "integer",
    "col-resize": False,
    "default": 5,
    "min": 0,
    "max": 500,
    "step": 1,
    "units": _("pixels")
}, {
    "id": "right_padding",
    "title": _("Right padding"),
    "type": "integer",
    "col-resize": False,
    "default": 5,
    "min": 0,
    "max": 500,
    "step": 1,
    "units": _("pixels")
}, {
    "id": "bottom_padding",
    "title": _("Bottom padding"),
    "type": "integer",
    "col-resize": False,
    "default": 5,
    "min": 0,
    "max": 500,
    "step": 1,
    "units": _("pixels")
}, {
    "id": "left_padding",
    "title": _("Left padding"),
    "type": "integer",
    "col-resize": False,
    "default": 5,
    "min": 0,
    "max": 500,
    "step": 1,
    "units": _("pixels")
}]

INFO_LABEL = [
    "<b>(*) %s</b>" % escape(_("Mandatory fields"))
]

win_def = WindowDefinition()
applet_page = win_def.add_page(_("Applet settings"))
applet_section = applet_page.add_section(_("Applet settings"))
applet_section.add_widget("keybinding", "toggle_menu_keybinding", {
    "description": _("Keyboard shortcut to open and close the menu"),
    "num-bind": 1
})
applet_section.add_widget("switch", "use_a_custom_icon_for_applet", {
    "description": _("Use a custom icon"),
    "tooltip": _("Unchecking this allows the theme to set the icon.")
})
applet_section.add_widget("iconfilechooser", "custom_icon_for_applet", {
    "description": _("Icon"),
    "dependency": "use_a_custom_icon_for_applet",
    "tooltip": _("Select an icon to show in the panel.")
})
applet_section.add_widget("entry", "custom_label_for_applet", {
    "description": _("Text"),
    "tooltip": _("Enter custom text to show in the panel.")
})

menu_page = win_def.add_page(_("Menu settings"))
menu_section = menu_page.add_section(_("Menu settings"))
menu_section.add_widget("switch", "enable_autoscroll", {
    "description": _("Enable autoscrolling in application list"),
    "tooltip": _("Choose whether or not to enable smooth autoscrolling in the application list.")
})
menu_section.add_widget("switch", "animate_menu", {
    "description": _("Use menu animations"),
    "tooltip": _("Allow the menu to animate on open and close.")
})
menu_section.add_widget("switch", "activate_on_hover", {
    "description": _("Open the menu when I move my mouse over it"),
    "tooltip": _("Enable opening the menu when the mouse enters the applet.")
})
menu_section.add_widget("switch", "strict_search_results", {
    "description": _("Strict search results"),
    "tooltip": _("If enabled, low priority search results will not be displayed.")
})
menu_section.add_widget("spinbutton", "menu_hover_delay", {
    "description": _("Menu hover delay"),
    "dependency": "activate_on_hover",
    "tooltip": _("Delay before the menu opens when hovered."),
    "min": 0,
    "max": 1000,
    "step": 50,
    "units": _("milliseconds")
})
menu_section.add_widget("spinbutton", "max_search_results", {
    "description": _("Maximum search results"),
    "tooltip": _("Set the maximum amount of search results to be displayed."),
    "min": 5,
    "max": 100,
    "step": 1,
    "units": _("items")
})
menu_page.add_section(get_save_button_section())

menu_layout_page = win_def.add_page(_("Menu layout"))
menu_layout_page.add_section(get_save_button_section())
menu_layout_section = menu_layout_page.add_section(_("Menu layout"))
menu_layout_section.add_widget("switch", "show_all_applications_category", {
    "description": _("Show \"All Applications\" category")
})
menu_layout_section.add_widget("switch", "recently_used_apps_enabled", {
    "description": _("Show \"Recently Used\" category"),
    "tooltip": _("From the moment this option is enabled, every application launched from the menu will be stored and displayed in the \"Recently Used\" category.\nEvery time this option is disabled, the list of recently used applications will be cleared.")
})
menu_layout_section.add_widget("switch", "recently_used_apps_show_separator", {
    "description": _("Show separator below \"Recently Used\" category"),
    "dependency": "recently_used_apps_enabled"
})
menu_layout_section.add_widget("switch", "show_category_icons", {
    "description": _("Show category icons"),
    "tooltip": _("Choose whether or not to show icons on categories.")
})
menu_layout_section.add_widget("switch", "show_application_icons", {
    "description": _("Show application icons"),
    "tooltip": _("Choose whether or not to show icons on applications.")
})
menu_layout_section.add_widget("switch", "hide_applications_list_scrollbar", {
    "description": _("Hide applications list scrollbar")
})
menu_layout_section.add_widget("switch", "hide_categories_list_scrollbar", {
    "description": _("Hide categories list scrollbar")
})
menu_layout_section.add_widget("switch", "invert_menu_layout", {
    "description": _("Invert menu layout"),
    "tooltip": _("By default, the search box is at the top of the menu and the custom launchers box is at the bottom. Enabling this preference will invert those elements in the menu.")
})
menu_layout_section.add_widget("switch", "swap_categories_box", {
    "description": _("Swap categories box"),
    "tooltip": _("By default, the categories box is to the left of the applications list. With this option enabled, the categories box will be placed to the right of the applications list.")
})
menu_layout_section.add_widget("switch", "custom_launchers_box_invert_buttons_order", {
    "description": _("Invert custom launches box buttons order")
})
menu_layout_section.add_widget("spinbutton", "max_width_for_buttons", {
    "description": _("Maximum button width"),
    "tooltip": _("Define the maximum width of menu items inside the applications box."),
    "min": 1,
    "max": 50,
    "step": 0.5,
    "units": "ems"
})
menu_layout_section.add_widget("spinbutton", "category_icon_size", {
    "description": _("Categories icon size"),
    "dependency": "show_category_icons",
    "min": 16,
    "max": 256,
    "step": 2,
    "units": _("pixels")
})
menu_layout_section.add_widget("spinbutton", "application_icon_size", {
    "description": _("Applications icon size"),
    "dependency": "show_application_icons",
    "min": 16,
    "max": 256,
    "step": 2,
    "units": _("pixels")
})
menu_layout_section.add_widget("spinbutton", "search_result_icon_size", {
    "description": _("Search results icon size"),
    "dependency": "show_application_icons",
    "min": 16,
    "max": 256,
    "step": 2,
    "units": _("pixels")
})
menu_layout_section.add_widget("spinbutton", "custom_launchers_icon_size", {
    "description": _("Custom launchers icon size"),
    "min": 16,
    "max": 256,
    "step": 2,
    "units": _("pixels")
})
menu_layout_section.add_widget("combobox", "custom_launchers_box_alignment", {
    "description": _("Custom launchers button alignment"),
    "valtype": int,
    "options": {
        0: _("Left"),
        1: _("Middle"),
        2: _("Right")
    }
})

menu_layout_section = menu_layout_page.add_section(_("Recent applications"),
                                                   dependency="recently_used_apps_enabled")
menu_layout_section.add_widget("switch", "recently_used_apps_ignore_favorites", {
    "description": _("Ignore Favorites"),
    "tooltip": _("If enabled, applications set as Favorite will not be displayed in the list of \"Recent Applications\".")
})
menu_layout_section.add_widget("switch", "recently_used_apps_invert_order", {
    "description": _("Invert recently used applications order"),
    "tooltip": _("By default, the most recently used application is at the top of the list. With this option enabled, the most recently used application will be at the bottom of the list.")
})
menu_layout_section.add_widget("spinbutton", "recently_used_apps_max_amount", {
    "description": _("Maximum recently used applications to display"),
    "min": 5,
    "max": 100,
    "step": 1,
    "units": _("applications")
})
menu_layout_page.add_section(get_save_button_section())

context_page = win_def.add_page(_("Context menu"))
context_section = context_page.add_section(_("Context menu"),
                                           notes=[_("Changes take effect immediately")])
context_section.add_widget("switch", "context_show_additional_application_actions", {
    "description": _("Show additional application actions")
})
context_section.add_widget("list", "context_menu_items", {
    "columns": CONTEXT_MENU_COLUMNS,
    "height": 350,
    "immutable": {
        "read-only-keys": "context_id",
        "allow-edition": True
    }
})

appear_page = win_def.add_page(_("Appearance"))
appear_section = appear_page.add_section(_("Menu elements padding"))
appear_section.add_widget("list", "menu_elements_padding", {
    "columns": MENU_ELEMENTS_PADDING_COLUMNS,
    "height": 200,
    "move-buttons": False,
    "immutable": {
        "read-only-keys": "element_id",
        "allow-edition": True
    }
})
appear_page.add_section(get_save_button_section())

launchers_page = win_def.add_page(_("Custom launchers"))
launchers_section = launchers_page.add_section(_("Custom launchers"),
                                               notes=["(*) " + _("Mandatory fields")])
launchers_section.add_widget("list", "custom_launchers", {
    "columns": LAUNCHERS_COLUMNS,
    "height": 300,
    "dialog-info-labels": INFO_LABEL
})

other_page = win_def.add_page(_("Other"))

advanced_section = other_page.add_section(_("Advanced"))
advanced_section.add_widget("switch", "context_gain_privileges", {
    "description": _("Gain privileges of not owned files"),
    "tooltip": _("If enabled, this options will open as root .desktop files that aren't owned by the current user.\n\nThis isn't needed for all text editors. Some text editors will allow you to open and edit not owned files and will ask for the root password at the moment of saving the changes.")
})
advanced_section.add_widget("entry", "context_custom_editor_for_edit_desktop_file", {
    "description": _("Custom text editor"),
    "tooltip": _("Set a custom text editor to open .desktop files (just the name of the text editor executable or the path to it).\nLeave it blank to let the system decide.")
})
advanced_section.add_widget("entry", "privilege_elevator", {
    "description": _("Privileges elevator"),
    "tooltip": _("The graphical front-end to use to run applications as root.\nThis is used by the \"Open as Root\" context menu and the option \"Gain privileges of not owned files\".")
})
advanced_section.add_widget("entry", "terminal_emulator", {
    "description": _("Terminal emulator"),
    "tooltip": _("Choose the terminal emulator used by all launch from terminal options.\nIMPORTANT!!! The terminal emulator has to support the -e argument (execute the argument to this option inside the terminal).")
})
advanced_section.add_widget("entry", "default_shell", {
    "description": _("Command interpreter (shell)"),
    "tooltip": _("The command interpreter (shell) used when launching programs from a terminal.\nIMPORTANT!!! The shell has to support the -c argument (take the argument passed by this option as a command to execute.).")
})

other_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
