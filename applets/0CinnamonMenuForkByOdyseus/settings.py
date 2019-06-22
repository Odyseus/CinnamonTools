#!/usr/bin/python3
# -*- coding: utf-8 -*-
import argparse
import os
import sys

from html import escape

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
modules_dir = os.path.join(XLET_DIR)
sys.path.append(modules_dir)

from python_modules.xlets_settings import MainApplication
from python_modules.xlets_settings import _

PAD_POSITIONS = ["top", "right", "bottom", "left"]

PAD_POSITIONS_LABELS = {
    "top": _("Box top padding"),
    "right": _("Box right padding"),
    "bottom": _("Box bottom padding"),
    "left": _("Box left padding")
}


def get_widget(pref, description):
    return {
        "widget-type": "spinbutton",
        "args": {
            "pref_key": pref,
            "properties": {
                "description": description,
                "min": 0,
                "max": 500,
                "step": 1,
                "units": _("pixels")
            }
        }
    }


def get_appearance_widgets(**kwargs):
    all_widgets = []

    for pos in PAD_POSITIONS:
        all_widgets.append(get_widget(kwargs[pos + "_pref"], PAD_POSITIONS_LABELS[pos]))

    return all_widgets


ASTERISK = " (*)"
CINN_RESTART = "(*) <i>%s</i>" % escape(_("Cinnamon needs to be restarted"))

COLUMNS = [{
    "id": "enabled",
    "title": _("Enabled"),
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

INFO_LABEL = [
    "<b>(*) %s</b>" % escape(_("Mandatory fields"))
]


LOGGING_LEVEL_TOOLTIP = "\n".join([
    _("It enables the ability to log the output of several functions used by the extension."),
    "",
    "%s: %s" % (_("Normal"), _("Only log messages caused by non critical errors.")),
    "%s: %s" % (_("Verbose"), _("Additinally log extra output messages and all HTTP responses.")),
    "%s: %s" % (_("Very verbose"), _(
        "Additionally log all method calls from all JavaScript classes/prototypes along with their execution time."))
])

SAVE_BUTTON_SECTION = {
    "section-title": "",
    "widgets": [{
        "widget-type": "button",
        "args": {
            "pref_key": "pref_hard_refresh_menu",
            "properties": {
                "description": _("Save settings"),
                "tooltip": _("Most settings are not automatically saved when modified.\nPress this button for the settings to take effect.")
            }
        }
    }]
}

APPLET_TAB = {
    "page-title": _("Applet settings"),
    "sections": [{
        "section-title": _("Applet settings"),
        "widgets": [{
            "widget-type": "keybinding",
            "args": {
                "pref_key": "pref_overlay_key",
                "properties": {
                    "description": _("Keyboard shortcut to open and close the menu"),
                    "num-bind": 1
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_use_a_custom_icon_for_applet",
                "properties": {
                    "description": _("Use a custom icon"),
                    "tooltip": _("Unchecking this allows the theme to set the icon.")
                }
            }
        }, {
            "widget-type": "iconfilechooser",
            "args": {
                "pref_key": "pref_custom_icon_for_applet",
                "properties": {
                    "description": _("Icon"),
                    "dependency": "pref_use_a_custom_icon_for_applet",
                    "tooltip": _("Select an icon to show in the panel.")
                }
            }
        }, {
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_custom_label_for_applet",
                "properties": {
                    "description": _("Text"),
                    "tooltip": _("Enter custom text to show in the panel.")
                }
            }
        }]
    }]
}

MENU_SETTINGS_TAB = {
    "page-title": _("Menu settings"),
    "sections": [{
        "section-title": _("Menu settings"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_enable_autoscroll",
                "properties": {
                    "description": _("Enable autoscrolling in application list"),
                    "tooltip": _("Choose whether or not to enable smooth autoscrolling in the application list.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_animate_menu",
                "properties": {
                    "description": _("Use menu animations"),
                    "tooltip": _("Allow the menu to animate on open and close.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_activate_on_hover",
                "properties": {
                    "description": _("Open the menu when I move my mouse over it"),
                    "tooltip": _("Enable opening the menu when the mouse enters the applet.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_strict_search_results",
                "properties": {
                    "description": _("Strict search results"),
                    "tooltip": _("If enabled, low priority search results will not be displayed.")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_menu_hover_delay",
                "properties": {
                    "description": _("Menu hover delay"),
                    "dependency": "pref_activate_on_hover",
                    "tooltip": _("Delay before the menu opens when hovered."),
                    "min": 0,
                    "max": 1000,
                    "step": 50,
                    "units": _("milliseconds")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_max_search_results",
                "properties": {
                    "description": _("Maximum search results"),
                    "tooltip": _("Set the maximum amount of search results to be displayed."),
                    "min": 5,
                    "max": 100,
                    "step": 1,
                    "units": _("items")
                }
            }
        }]
    }, SAVE_BUTTON_SECTION]
}


MENU_LAYOUT_TAB = {
    "page-title": _("Menu layout"),
    "sections": [SAVE_BUTTON_SECTION, {
        "section-title": _("Menu layout"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_show_all_applications_category",
                "properties": {
                    "description": _("Show \"All Applications\" category")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_recently_used_apps_enabled",
                "properties": {
                    "description": _("Show \"Recently Used\" category"),
                    "tooltip": _("From the moment this option is enabled, every application launched from the menu will be stored and displayed in the \"Recently Used\" category.\nEvery time this option is disabled, the list of recently used applications will be cleared.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_recently_used_apps_show_separator",
                "properties": {
                    "description": _("Show separator below \"Recently Used\" category"),
                    "dependency": "pref_recently_used_apps_enabled"
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_show_category_icons",
                "properties": {
                    "description": _("Show category icons"),
                    "tooltip": _("Choose whether or not to show icons on categories.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_show_application_icons",
                "properties": {
                    "description": _("Show application icons"),
                    "tooltip": _("Choose whether or not to show icons on applications.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_hide_applications_list_scrollbar",
                "properties": {
                    "description": _("Hide applications list scrollbar")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_invert_menu_layout",
                "properties": {
                    "description": _("Invert menu layout"),
                    "tooltip": _("By default, the search box is at the top of the menu and the custom launchers box is at the bottom. Enabling this preference will invert those elements in the menu.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_swap_categories_box",
                "properties": {
                    "description": _("Swap categories box"),
                    "tooltip": _("By default, the categories box is to the left of the applications list. With this option enabled, the categories box will be placed to the right of the applications list.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_custom_launchers_box_invert_buttons_order",
                "properties": {
                    "description": _("Invert custom launches box buttons order")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_max_width_for_buttons",
                "properties": {
                    "description": _("Maximum button width"),
                    "tooltip": _("Define the maximum width of menu items inside the applications box."),
                    "min": 1,
                    "max": 50,
                    "step": 0.5,
                    "units": "ems"
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_category_icon_size",
                "properties": {
                    "description": _("Categories icon size"),
                    "dependency": "pref_show_category_icons",
                    "min": 16,
                    "max": 256,
                    "step": 2,
                    "units": _("pixels")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_application_icon_size",
                "properties": {
                    "description": _("Applications icon size"),
                    "dependency": "pref_show_application_icons",
                    "min": 16,
                    "max": 256,
                    "step": 2,
                    "units": _("pixels")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_search_result_icon_size",
                "properties": {
                    "description": _("Search results icon size"),
                    "dependency": "pref_show_application_icons",
                    "min": 16,
                    "max": 256,
                    "step": 2,
                    "units": _("pixels")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_custom_launchers_icon_size",
                "properties": {
                    "description": _("Custom launchers icon size"),
                    "min": 16,
                    "max": 256,
                    "step": 2,
                    "units": "pixels"
                }
            }
        }, {
            "widget-type": "combobox",
            "args": {
                "pref_key": "pref_custom_launchers_box_alignment",
                "properties": {
                    "description": _("Custom launchers button alignment"),
                    "valtype": int,
                    "options": {
                        0: _("Left"),
                        1: _("Middle"),
                        2: _("Right")
                    }
                }
            }
        }]
    }, {
        "section-title": _("Recent applications"),
        "dependency": "pref_recently_used_apps_enabled",
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_recently_used_apps_ignore_favorites",
                "properties": {
                    "description": _("Ignore Favorites"),
                    "tooltip": _("If enabled, applications set as Favorite will not be displayed in the list of \"Recent Applications\".")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_recently_used_apps_invert_order",
                "properties": {
                    "description": _("Invert recently used applications order"),
                    "tooltip": _("By default, the most recently used application is at the top of the list. With this option enabled, the most recently used application will be at the bottom of the list.")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_recently_used_apps_max_amount",
                "properties": {
                    "description": _("Maximum recently used applications to display"),
                    "min": 5,
                    "max": 100,
                    "step": 1,
                    "units": _("applications")
                }
            }
        }]
    }, SAVE_BUTTON_SECTION]
}

CONTEXT_MENU_TAB = {
    "page-title": _("Context menu"),
    "sections": [SAVE_BUTTON_SECTION, {
        "section-title": _("Context menu"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_context_show_add_to_panel",
                "properties": {
                    "description": _("Show \"Add to panel\" on context")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_context_show_add_to_desktop",
                "properties": {
                    "description": _("Show \"Add to desktop\" on context")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_context_show_add_remove_favorite",
                "properties": {
                    "description": _("Show \"Add/Remove to/from favorites\" on context")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_context_show_uninstall",
                "properties": {
                    "description": _("Show \"Uninstall\" on context")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_context_show_bumblebee",
                "properties": {
                    "description": _("Show \"Run with NVIDIA GPU\" on context")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_context_show_run_as_root",
                "properties": {
                    "description": _("Show \"Run as root\" on context")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_context_show_run_from_terminal",
                "properties": {
                    "description": _("Show \"Run from terminal\" on context")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_context_show_run_from_terminal_as_root",
                "properties": {
                    "description": _("Show \"Run from terminal as root\" on context")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_context_show_desktop_file_folder",
                "properties": {
                    "description": _("Show \"Open .desktop file folder\" on context")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_context_show_edit_desktop_file",
                "properties": {
                    "description": _("Show \"Edit .desktop file\" on context"),
                    "tooltip": _("It adds to the applications context menu an entry that will allow you to open the current selected application's .desktop file in a text editor.")
                }
            }
        }]
    }, {
        "section-title": _("Advanced"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_context_gain_privileges",
                "properties": {
                    "description": _("Gain privileges of not owned files"),
                    "tooltip": _("If enabled, this options will open as root .desktop files that aren't owned by the current user.\n\nThis isn't needed for all text editors. Some text editors will allow you to open and edit not owned files and will ask for the root password at the moment of saving the changes.")
                }
            }
        }, {
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_context_custom_editor_for_edit_desktop_file",
                "properties": {
                    "description": _("Custom text editor"),
                    "tooltip": _("Set a custom text editor to open .desktop files (just the name of the text editor executable or the path to it).\nLeave it blank to let the system decide.")
                }
            }
        }, {
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_privilege_elevator",
                "properties": {
                    "description": _("Privileges elevator"),
                    "tooltip": _("The graphical front-end to use to run applications as root.\nThis is used by the \"Open as Root\" context menu and the option \"Gain privileges of not owned files\".")
                }
            }
        }, {
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_terminal_emulator",
                "properties": {
                    "description": _("Terminal emulator"),
                    "tooltip": _("Choose the terminal emulator used by all launch from terminal options.\nIMPORTANT!!! The terminal emulator has to support the -e argument (execute the argument to this option inside the terminal).")
                }
            }
        }, {
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_default_shell",
                "properties": {
                    "description": _("Command interpreter (shell)"),
                    "tooltip": _("The command interpreter (shell) used when launching programs from a terminal.\nIMPORTANT!!! The shell has to support the -c argument (take the argument passed by this option as a command to execute.).")
                }
            }
        }]
    }, SAVE_BUTTON_SECTION]
}

APPEARANCE_TAB = {
    "page-title": _("Appearance"),
    "sections": [SAVE_BUTTON_SECTION, {
        "section-title": _("Custom launchers box padding"),
        "widgets": get_appearance_widgets(top_pref="pref_custom_launchers_box_padding_top",
                                          right_pref="pref_custom_launchers_box_padding_right",
                                          bottom_pref="pref_custom_launchers_box_padding_bottom",
                                          left_pref="pref_custom_launchers_box_padding_left")
    }, {
        "section-title": _("Categories box padding"),
        "widgets": get_appearance_widgets(top_pref="pref_categories_box_padding_top",
                                          right_pref="pref_categories_box_padding_right",
                                          bottom_pref="pref_categories_box_padding_bottom",
                                          left_pref="pref_categories_box_padding_left")
    }, {
        "section-title": _("Applications box padding"),
        "widgets": get_appearance_widgets(top_pref="pref_applications_box_padding_top",
                                          right_pref="pref_applications_box_padding_right",
                                          bottom_pref="pref_applications_box_padding_bottom",
                                          left_pref="pref_applications_box_padding_left")
    }, {
        "section-title": _("Search entry padding"),
        "widgets": get_appearance_widgets(top_pref="pref_search_entry_padding_top",
                                          right_pref="pref_search_entry_padding_right",
                                          bottom_pref="pref_search_entry_padding_bottom",
                                          left_pref="pref_search_entry_padding_left")
    }, {
        "section-title": _("Search box padding"),
        "widgets": get_appearance_widgets(top_pref="pref_search_box_padding_top",
                                          right_pref="pref_search_box_padding_right",
                                          bottom_pref="pref_search_box_padding_bottom",
                                          left_pref="pref_search_box_padding_left")
    }, SAVE_BUTTON_SECTION]
}

LAUNCHERS_TAB = {
    "page-title": _("Custom launchers"),
    "sections": [{
        "section-title": _("Custom launchers"),
        "section-notes": ["(*) " + _("Mandatory fields")],
        "widgets": [{
            "widget-type": "list",
            "args": {
                "pref_key": "pref_custom_launchers",
                "apply_key": "pref_hard_refresh_menu",
                "imp_exp_path_key": "pref_imp_exp_last_selected_directory",
                "properties": {
                    "columns": COLUMNS,
                    "height": 300,
                    "dialog-info-labels": INFO_LABEL
                }
            }
        }]
    }]
}

OTHER_TAB = {
    "page-title": _("Other"),
    "sections": [{
        "section-title": _("Debugging"),
        "section-notes": [CINN_RESTART],
        "widgets": [{
            "widget-type": "combobox",
            "args": {
                "pref_key": "pref_logging_level",
                "properties": {
                    "description": _("Logging level") + ASTERISK,
                    "tooltip": LOGGING_LEVEL_TOOLTIP,
                    "options": {
                        0: _("Normal"),
                        1: _("Verbose"),
                        2: _("Very verbose")
                    }
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_debugger_enabled",
                "properties": {
                    "description": _("Enable debugger") + ASTERISK,
                    "tooltip": _("It enables the ability to catch all exceptions that under normal use would not be caught.")
                }
            }
        }]
    }]
}


PAGES_OBJECT = [
    APPLET_TAB,
    MENU_SETTINGS_TAB,
    MENU_LAYOUT_TAB,
    CONTEXT_MENU_TAB,
    APPEARANCE_TAB,
    LAUNCHERS_TAB,
    OTHER_TAB
]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--xlet-type", dest="xlet_type")
    parser.add_argument("--xlet-instance-id", dest="xlet_instance_id")
    parser.add_argument("--xlet-uuid", dest="xlet_uuid")

    args = parser.parse_args()

    app = MainApplication(
        application_id="org.Cinnamon.Applets.CinnamonMenu.Settings",
        xlet_type=args.xlet_type or "extension",
        xlet_instance_id=args.xlet_instance_id or None,
        xlet_uuid=args.xlet_uuid or "{{UUID}}",
        pages_definition=PAGES_OBJECT
    )
    app.run()
