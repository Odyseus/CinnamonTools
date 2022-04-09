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
from python_modules.xlets_settings.builder import ASTERISK_END
from python_modules.xlets_settings.builder import WindowDefinition
from python_modules.xlets_settings.builder import get_debugging_section

XLET_UUID = os.path.basename(XLET_DIR)
XLET_TYPE = os.path.basename(os.path.dirname(XLET_DIR))[:-1]

COLUMNS = [{
    "id": "enabled",
    "title": _("Enabled"),
    "default": True,
    "type": "boolean"
}, {
    "id": "notify",
    "title": _("Notify"),
    "default": True,
    "type": "boolean"
}, {
    "id": "show_read_items",
    "title": _("Show read"),
    "type": "boolean"
}, {
    "id": "interval",
    "title": _("Interval"),
    "type": "integer",
    "default": 0,
    "min": 0,
    "max": 144,
    "step": 1,
    "units": _("minutes")
}, {
    "id": "category",
    "title": _("Category"),
    "type": "string"
}, {
    "id": "custom_title",
    "title": _("Custom title"),
    "type": "string"
}, {
    "id": "url",
    "title": _("URL") + ASTERISK_END,
    "type": "string"
}]

INFO_LABEL = [
    "<b>(*) %s</b>" % escape(_("Mandatory fields"))
]

win_def = WindowDefinition()
applet_page = win_def.add_page(_("General"))
applet_section = applet_page.add_section(_("Applet settings"))
applet_section.add_widget("keybinding", "toggle_menu_keybinding", {
    "description": _("Keyboard shortcut to open and close the menu"),
    "num-bind": 1
})
applet_section.add_widget("iconfilechooser", "new_feed_icon", {
    "description": _("Icon used when there are new feeds"),
    "tooltip": _("Select an icon to show in the panel.")
})
applet_section.add_widget("iconfilechooser", "feed_icon", {
    "description": _("Icon used when there are not new feeds"),
    "tooltip": _("Select an icon to show in the panel.")
})

applet_section = applet_page.add_section(_("Menu settings"))
applet_section.add_widget("switch", "show_icons_in_menu", {
    "description": _("Show icons on menu")
})
applet_section.add_widget("spinbutton", "min_article_item_width", {
    "description": _("Minimum article items width"),
    "tooltip": _("Set a minimum width for article menu items. This is used to prevent the menu to drastically change size when opening/closing sub-menus."),
    "min": 0,
    "max": 1000,
    "step": 50,
    "units": _("pixels")
})
applet_section.add_widget("spinbutton", "max_items", {
    "description": _("Maximum number of articles"),
    "tooltip": _("Maximum number of article items to display for each feed."),
    "min": 1,
    "max": 20,
    "step": 1,
    "units": _("articles")
})
applet_section.add_widget("spinbutton", "refresh_interval_mins", {
    "description": _("Update interval"),
    "tooltip": _("Interval between checking for new articles."),
    "min": 1,
    "max": 1440,
    "step": 1,
    "units": _("minutes")
})
applet_section.add_widget("spinbutton", "description_max_length", {
    "description": _("Description maximum length"),
    "tooltip": _("The maximum numbers of characters that will be displayed in the article tooltip as the article description. With a value of zero the entire article will be displayed."),
    "min": 0,
    "max": 10000,
    "step": 100,
    "units": _("characters")
})
applet_section.add_widget("spinbutton", "tooltip_max_width", {
    "description": _("Tooltip maximum width"),
    "tooltip": _("Set a custom maximum width for the articles tooltips. With a value of zero the maximum width will be set to half the monitor width."),
    "min": 0,
    "max": 2000,
    "step": 100,
    "units": _("pixels")
})

applet_section = applet_page.add_section(_("Notifications settings"))
applet_section.add_widget("switch", "notifications_enabled", {
    "description": _("Show notifications for new articles"),
    "tooltip": _("If enabled, a popup notification will be displayed for new articles.")
})
applet_section.add_widget("switch", "unified_notifications", {
    "description": _("Unified notifications"),
    "tooltip": _("If enabled, all feeds notifications will use and update one notification."),
    "dependency": "notifications_enabled"
})

feeds_page = win_def.add_page(_("Feeds"))
feeds_section = feeds_page.add_section(_("Feeds Manager"), notes=["(*) " + _("Mandatory fields")])
feeds_section.add_widget("list", "feeds", {
    "columns": COLUMNS,
    "height": 500,
    "multi-select": True,
    "move-buttons": False,
    "dialog-width": 600,
    "dialog-info-labels": INFO_LABEL
})


other_page = win_def.add_page(_("Other"))
other_section = feeds_page.add_section(_("Third party integrations"))
other_section.add_widget("switch", "third_party_integration_panel_drawer", {
    "description": _("Panel Drawer applet integration"),
    "tooltip": _("Display applet when receiving new articles.")
})

other_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
