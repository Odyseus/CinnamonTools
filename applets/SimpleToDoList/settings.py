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
from python_modules.xlets_settings.builder import ASTERISK_START
from python_modules.xlets_settings.builder import WindowDefinition
from python_modules.xlets_settings.builder import get_debugging_section

XLET_UUID = os.path.basename(XLET_DIR)
XLET_TYPE = os.path.basename(os.path.dirname(XLET_DIR))[:-1]

ENTRY_WIDTH_TT = _("Cinnamon menus automatically change their size to accommodate the elements that they contain. Setting a fixed size for those elements will avoid the constant resizing of the menu when opening/closing sub menus.")

INFO_LABEL = [
    "<b>%s</b> %s" % (ASTERISK_START, escape(_("Mandatory fields"))),
    escape(_("For colors to take effect, native entry theming may need to be removed. See options on »Appearance« section."))
]

COLUMNS = [{
    "id": "enabled",
    "title": _("Enabled"),
    "default": True,
    "type": "boolean"
}, {
    "id": "tag",
    "title": _("Tag") + ASTERISK_END,
    "type": "string"
}, {
    "id": "text_color",
    "title": _("Text color") + ASTERISK_END,
    "type": "color"
}, {
    "id": "bg_color",
    "title": _("Background color") + ASTERISK_END,
    "type": "color"
}]

win_def = WindowDefinition()
general_page = win_def.add_page(_("General"))
general_section = general_page.add_section(_("Applet settings"))
general_section.add_widget("iconfilechooser", "applet_icon", {
    "description": _("Icon"),
    "tooltip": _("Select an icon to show in the panel."),
})
general_section.add_widget("entry", "applet_label", {
    "description": _("Label"),
    "tooltip": _("Enter custom text to show in the panel")
})
general_section.add_widget("keybinding", "toggle_menu_keybinding", {
    "description": _("Keyboard shortcut to open and close the menu")
})
general_section.add_widget("switch", "show_tasks_counter_on_applet", {
    "description": _("Display tasks counter on applet")
})

general_section = general_page.add_section(_("Menu settings"))
general_section.add_widget("switch", "use_fail_safe", {
    "description": _("Avoid accidental sections/tasks deletions"),
    "tooltip": _("When enabled, to remove a task or a section of the menu, the Control key needs to be pressed."),
})
general_section.add_widget("switch", "animate_menu", {
    "description": _("Animate menu"),
    "tooltip": _("Enables/Disables menu open/close animations."),
})
general_section.add_widget("switch", "keep_one_menu_open", {
    "description": _("Keep just one sub menu open"),
    "tooltip": _("When enabled, the previously opened sub menu will be automatically closed."),
})

appear_page = win_def.add_page(_("Appearance"))
appear_section = appear_page.add_section(_("Sections appearance"))
appear_section.add_widget("spinbutton", "section_font_size", {
    "description": _("Label font size"),
    "min": 0.1,
    "max": 10.0,
    "step": 0.05,
    "units": "ems"
})
appear_section.add_widget("spinbutton", "section_set_min_width", {
    "description": _("Set minimum entry width"),
    "tooltip": ENTRY_WIDTH_TT,
    "min": 0,
    "max": 1024,
    "step": 2,
    "units": _("pixels"),
})
appear_section.add_widget("spinbutton", "section_set_max_width", {
    "description": _("Set maximum entry width"),
    "tooltip": ENTRY_WIDTH_TT,
    "min": 0,
    "max": 1024,
    "step": 2,
    "units": _("pixels"),
})
appear_section.add_widget("switch", "section_keep_alphabetic_order", {
    "description": _("Keep sections sorted alphabetically"),
    "tooltip": _("When enabled, the sections will be displayed/created in alphabetic order.")
})
appear_section.add_widget("switch", "section_set_bold", {
    "description": _("Set bold")
})
appear_section.add_widget("switch", "section_remove_native_entry_theming", {
    "description": _("Remove native entry theming (only visuals)")
})
appear_section.add_widget("switch", "section_remove_native_entry_theming_sizing", {
    "description": _("Remove native entry theming (also sizing)"),
    "dependency": "section_remove_native_entry_theming",
})

appear_section = appear_page.add_section(_("Tasks appearance"))
appear_section.add_widget("spinbutton", "task_font_size", {
    "description": _("Label font size"),
    "min": 0.1,
    "max": 10.0,
    "step": 0.05,
    "units": "ems"
})
appear_section.add_widget("spinbutton", "task_set_min_width", {
    "description": _("Set minimum entry width"),
    "tooltip": ENTRY_WIDTH_TT,
    "min": 0,
    "max": 1024,
    "step": 2,
    "units": _("pixels"),
})
appear_section.add_widget("spinbutton", "task_set_max_width", {
    "description": _("Set maximum entry width"),
    "tooltip": ENTRY_WIDTH_TT,
    "min": 0,
    "max": 1024,
    "step": 2,
    "units": _("pixels"),
})
appear_section.add_widget("spinbutton", "task_set_custom_spacing", {
    "description": _("Custom elements spacing"),
    "tooltip": _("Some Cinnamon themes might set the spacing for the popup-menu-item class too big or too small, resulting in too much space wasted inside this applet menu or in elements to close to each other. This setting allows to change that spacing."),
    "min": 0,
    "max": 20,
    "step": 1,
    "units": _("pixels"),
})
appear_section.add_widget("switch", "task_set_bold", {
    "description": _("Set bold")
})
appear_section.add_widget("switch", "task_remove_native_entry_theming", {
    "description": _("Remove native entry theming (only visuals)")
})
appear_section.add_widget("switch", "task_remove_native_entry_theming_sizing", {
    "description": _("Remove native entry theming (also sizing)"),
    "dependency": "task_remove_native_entry_theming"
})


tags_page = win_def.add_page(_("Tags"))
tags_section = tags_page.add_section(_("Priority tags settings"))
tags_section.add_widget("switch", "tasks_priorities_colors_enabled", {
    "description": _("Enable priority tags colorization"),
    "tooltip": _("If enabled, this option will colorize a task entry depending on the tags found on its text. Tasks can be \"tagged\" by simply writing \"@tagname\" as part of the task text."),
})
tags_section.add_widget("switch", "tasks_priorities_highlight_entire_row", {
    "description": _("Colorize entire menu item"),
    "dependency": "tasks_priorities_colors_enabled",
    "tooltip": _("This option is useful, for example, when the Cinnamon theme used styles entries with a non transparent background image. The background color set by a priority tag will not be visible in this case. With this option enabled, the entire menu item of a task will be colorized and not just its entry."),
})

tags_section = tags_page.add_section(_("Tag definitions"),
                                     dependency="tasks_priorities_colors_enabled",
                                     notes=[
                                     ASTERISK_START + _("Mandatory fields"),
                                     _("Tags defined at the top of the list will have priority over the ones defined at the bottom of it."),
                                     _("Removing all tag definitions will cause all default definitions to be added back.")
                                     ])
tags_section.add_widget("list", "tag_definitions", {
    "columns": COLUMNS,
    "height": 300,
    "dialog-info-labels": INFO_LABEL
})

other_page = win_def.add_page(_("Other"))
other_section = other_page.add_section(_("Save as TODO file settings"))
other_section.add_widget("entry", "task_completed_character", {
    "description": _("Character/s for completed tasks"),
    "tooltip": _("The character or characters that will represent a completed task on a TODO file."),
})
other_section.add_widget("entry", "task_notcompleted_character", {
    "description": _("Character/s for not completed tasks"),
    "tooltip": _("The character or characters that will represent a not completed task on a TODO file."),
})

other_section = other_page.add_section(_("Tasks backup settings"))
other_section.add_widget("switch", "autobackups_enabled", {
    "description": _("Enable auto backups"),
    "tooltip": _("It enables the ability to automatically backup the tasks list."),
})
other_section.add_widget("spinbutton", "autobackups_max_files_to_keep", {
    "description": _("Maximum backup files to keep"),
    "dependency": "autobackups_enabled",
    "tooltip": _("The directory where the backup files are stored is cleaned periodically. Only the most recent backup files are kept.\nBackups cleanup frequency:\n\n* Every time the applet is initialized, regardless of when was the last time a cleanup operation was performed.\n* Every time that this applet's tasks list are modified, but only if the last cleanup operation was performed at least in the last 60 minutes."),
    "min": 10,
    "max": 100,
    "step": 1,
    "units": _("files"),
})
other_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
