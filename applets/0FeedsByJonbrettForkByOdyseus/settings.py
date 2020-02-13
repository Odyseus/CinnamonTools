#!/usr/bin/python3
# -*- coding: utf-8 -*-
import os
import sys

from html import escape

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
modules_dir = os.path.join(XLET_DIR)
sys.path.append(modules_dir)

from python_modules.xlets_settings import _
from python_modules.xlets_settings import cli

ASTERISK = " (*)"
CINN_RESTART = "(*) <i>%s</i>" % escape(_("Cinnamon needs to be restarted"))


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
    "title": _("URL") + ASTERISK,
    "type": "string"
}]


LOGGING_LEVEL_TOOLTIP = "\n".join([
    _("It enables the ability to log the output of several functions used by the extension."),
    "",
    "%s: %s" % (_("Normal"), _("Only log messages caused by non critical errors.")),
    "%s: %s" % (_("Verbose"), _("Additionally log extra output messages and all HTTP responses.")),
    "%s: %s" % (_("Very verbose"), _(
        "Additionally log all method calls from all JavaScript classes/prototypes along with their execution time."))
])

INFO_LABEL = [
    "<b>(*) %s</b>" % escape(_("Mandatory fields"))
]

APPLET_TAB = {
    "page-title": _("General"),
    "sections": [{
        "section-title": _("Applet settings"),
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
            "widget-type": "iconfilechooser",
            "widget-attrs": {
                "pref_key": "pref_new_feed_icon"
            },
            "widget-kwargs": {
                "description": _("Icon used when there are new feeds"),
                "tooltip": _("Select an icon to show in the panel.")
            }
        }, {
            "widget-type": "iconfilechooser",
            "widget-attrs": {
                "pref_key": "pref_feed_icon"
            },
            "widget-kwargs": {
                "description": _("Icon used when there are not new feeds"),
                "tooltip": _("Select an icon to show in the panel.")
            }
        }]
    }, {
        "section-title": _("Menu settings"),
        "widgets": [{
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_show_icons_in_menu"
            },
            "widget-kwargs": {
                "description": _("Show icons on menu")
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_min_article_item_width"
            },
            "widget-kwargs": {
                "description": _("Minimum article items width"),
                "tooltip": _("Set a minimum width for article menu items. This is used to prevent the menu to drastically change size when opening/closing sub-menus."),
                "min": 0,
                "max": 1000,
                "step": 50,
                "units": _("pixels")
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_max_items"
            },
            "widget-kwargs": {
                "description": _("Maximum number of articles"),
                "tooltip": _("Maximum number of article items to display for each feed."),
                "min": 1,
                "max": 20,
                "step": 1,
                "units": _("articles")
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_refresh_interval_mins"
            },
            "widget-kwargs": {
                "description": _("Update interval"),
                "tooltip": _("Interval between checking for new articles."),
                "min": 1,
                "max": 1440,
                "step": 1,
                "units": _("minutes")
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_description_max_length"
            },
            "widget-kwargs": {
                "description": _("Description maximum length"),
                "tooltip": _("The maximum numbers of characters that will be displayed in the article tooltip as the article description. With a value of zero the entire article will be displayed."),
                "min": 0,
                "max": 10000,
                "step": 100,
                "units": _("characters")
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_tooltip_max_width"
            },
            "widget-kwargs": {
                "description": _("Tooltip maximum width"),
                "tooltip": _("Set a custom maximum width for the articles tooltips. With a value of zero the maximum width will be set to half the monitor width."),
                "min": 0,
                "max": 2000,
                "step": 100,
                "units": _("pixels")
            }
        }]
    }, {
        "section-title": _("Notifications settings"),
        "widgets": [{
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_notifications_enabled"
            },
            "widget-kwargs": {
                "description": _("Show notifications for new articles"),
                "tooltip": _("If enabled, a popup notification will be displayed for new articles.")
            }
        }, {
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_unified_notifications"
            },
            "widget-kwargs": {
                "description": _("Unified notifications"),
                "tooltip": _("If enabled, all feeds notifications will use and update one notification."),
                "dependency": "pref_notifications_enabled"
            }
        }
            # FIXME: Not used yet. It gave me a headache when I started to think about
            # how to implement this. LOL
            # , {
            #     "widget-type": "spinbutton",
            #     "widget-attrs": {
            #         "pref_key": "pref_unified_notifications_max_entries"
            #     },
            #     "widget-kwargs": {
            #         "description": _("Maximum unified entries"),
            #         "tooltip": _("If enabled, display only the last X feed notifications."),
            #         "dependency": "pref_unified_notifications",
            #         "min": 5,
            #         "max": 50,
            #         "step": 1,
            #         "units": _("feeds")
            #     }
            # }
        ]
    }]
}

FEEDS_TAB = {
    "page-title": _("Feeds"),
    "sections": [{
        "section-title": _("Feeds Manager"),
        "section-notes": ["(*) " + _("Mandatory fields")],
        "widgets": [{
            "widget-type": "list",
            "widget-attrs": {
                "pref_key": "pref_feeds",
                "apply_key": "pref_feeds_changed",
                "imp_exp_path_key": "pref_imp_exp_last_selected_directory"
            },
            "widget-kwargs": {
                "columns": COLUMNS,
                "height": 500,
                "multi-select": True,
                "move-buttons": False,
                "dialog-width": 600,
                "dialog-info-labels": INFO_LABEL
            }
        }]
    }]
}

OTHER_TAB = {
    "page-title": _("Other"),
    "sections": [{
        "section-title": _("Third party integrations"),
        "widgets": [{
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_third_party_integration_panel_drawer"
            },
            "widget-kwargs": {
                "description": _("Panel Drawer applet integration"),
                "tooltip": _("Display applet when receiving new articles.")
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

PAGES_DEFINITION = [
    APPLET_TAB,
    FEEDS_TAB,
    OTHER_TAB
]


if __name__ == "__main__":
    sys.exit(cli(PAGES_DEFINITION))
