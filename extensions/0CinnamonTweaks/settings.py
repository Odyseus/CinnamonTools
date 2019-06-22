#!/usr/bin/python3
# -*- coding: utf-8 -*-
import argparse
import os
import sys

from html import escape

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
MODULES_DIR = os.path.join(XLET_DIR)
sys.path.append(MODULES_DIR)

from python_modules.xlets_settings import CINNAMON_VERSION
from python_modules.xlets_settings import MainApplication
from python_modules.xlets_settings import _
from python_modules.xlets_settings.common import compare_version

CIRCLE = "<b>⚫</b>"
ASTERISK = " (*)"

CINN_RESTART = "(*) <i>%s</i>" % escape(_("Cinnamon needs to be restarted"))

NOTIFICATIONS_SECTION_INFO = "\n".join([
    escape(_("After enabling notifications tweaks, some settings set by this extension will have priority over Cinnamon's notification settings.")),
    "",
    "%s %s" % (
        CIRCLE,
        escape(_("The Cinnamon's setting to display notifications at the bottom of the screen is ignored. The position set by this extension is the only one that will take effect."))
    ),
    "%s %s" % (
        CIRCLE,
        escape(_("The notification positioning is calculated in a different way by this extension compared to the way Cinnamon calculates it. This extension offers complete control over the distance from all pertinent sides of the popup."))
    )
])

WIN_DECORATIONS_SECTION_INFO = "\n".join([
    "%s %s" % (
        CIRCLE,
        escape(_("This tweak settings are purposely NOT applied in real time. Click the »Apply windows decorations settings« button to save settings."))
    ),
    "%s %s" % (
        CIRCLE,
        escape(_("Client side decorated windows and WINE applications aren't affected by this tweak."))
    ),
    "%s %s" % (
        CIRCLE,
        escape(_("Close all windows that belongs to an application that is going to be added to the applications list and before applying the settings of this tweak."))
    ),
    "%s %s" % (
        CIRCLE,
        escape(
            _("Read this extension help for more detailed instructions, list of dependencies and known issues."))
    )
])


LOGGING_LEVEL_TOOLTIP = "\n".join([
    _("It enables the ability to log the output of several functions used by the extension."),
    "",
    "%s: %s" % (_("Normal"), _("Only log messages caused by non critical errors.")),
    "%s: %s" % (_("Verbose"), _("Additinally log extra output messages and all HTTP responses.")),
    "%s: %s" % (_("Very verbose"), _(
        "Additionally log all method calls from all JavaScript classes/prototypes along with their execution time."))
])


WINDOWS_AUTO_MOVE_COLUMNS = [{
    "id": "app_id",
    "title": _("Application"),
    "type": "app"
}, {
    "id": "workspace",
    "title": _("Workspace"),
    "type": "integer",
    "min": 1,
    "max": 36,
    "step": 1
}]

CSCT = "%s: %s"

CUSTOM_SHADOWS_COLUMNS = [{
    "id": "win_type",
    "title": _("Window type"),
    "type": "string",
    "options": {
        "f_normal": CSCT % (_("Focused"), _("normal")),
        "f_dialog": CSCT % (_("Focused"), _("dialog")),
        "f_modal_dialog": CSCT % (_("Focused"), _("modal dialog")),
        "f_utility": CSCT % (_("Focused"), _("utility")),
        "f_border": CSCT % (_("Focused"), _("border")),
        "f_menu": CSCT % (_("Focused"), _("menu")),
        "f_popup-menu": CSCT % (_("Focused"), _("popup menu")),
        "f_dropdown-menu": CSCT % (_("Focused"), _("dropdown menu")),
        "f_attached": CSCT % (_("Focused"), _("attached")),
        "u_normal": CSCT % (_("Unfocused"), _("normal")),
        "u_dialog": CSCT % (_("Unfocused"), _("dialog")),
        "u_modal_dialog": CSCT % (_("Unfocused"), _("modal dialog")),
        "u_utility": CSCT % (_("Unfocused"), _("utility")),
        "u_border": CSCT % (_("Unfocused"), _("border")),
        "u_menu": CSCT % (_("Unfocused"), _("menu")),
        "u_popup-menu": CSCT % (_("Unfocused"), _("popup menu")),
        "u_dropdown-menu": CSCT % (_("Unfocused"), _("dropdown menu")),
        "u_attached": CSCT % (_("Unfocused"), _("attached")),
    }
}, {
    "id": "radius",
    "title": _("Radius"),
    "type": "integer",
    "min": 1,
    "max": 255,
    "step": 1
}, {
    "id": "top_fade",
    "title": _("Top fade"),
    "type": "integer",
    "min": -100,
    "max": 100,
    "step": 1
}, {
    "id": "x_offset",
    "title": _("X offset"),
    "type": "integer",
    "min": 0,
    "max": 100,
    "step": 1
}, {
    "id": "y_offset",
    "title": _("Y offset"),
    "type": "integer",
    "min": 0,
    "max": 100,
    "step": 1
}, {
    "id": "opacity",
    "title": _("Opacity"),
    "type": "integer",
    "min": 0,
    "max": 255,
    "step": 1
}]

XLETS_TAB = {
    "page-title": _("Xlets"),
    "compatible": compare_version(CINNAMON_VERSION, "4.2") < 0,
    "sections": [{
        "section-title": _("Applets tweaks"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_applets_tweaks_enabled",
                "properties": {
                    "description": _("Enable Applets tweaks")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_applets_ask_confirmation_applet_removal",
                "properties": {
                    "description": _("Ask for confirmation on applet removal"),
                    "dependency": "pref_applets_tweaks_enabled",
                    "tooltip": _("Display a confirmation dialog on removal.\nKeeping the Ctrl key pressed will bypass the confirmation.")
                }
            }
        }]
    }, {
        "section-title": _("Desklets tweaks"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_desklets_tweaks_enabled",
                "properties": {
                    "description": _("Enable Desklets tweaks")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_desklets_ask_confirmation_desklet_removal",
                "properties": {
                    "description": _("Ask for confirmation on desklet removal"),
                    "dependency": "pref_desklets_tweaks_enabled",
                    "tooltip": _("Display a confirmation dialog on removal.\nKeeping the Ctrl key pressed will bypass the confirmation.")
                }
            }
        }]
    }]
}


HOTCORNERS_TAB = {
    "page-title": _("Hot corners"),
    "compatible": compare_version(CINNAMON_VERSION, "3.2") < 0,
    "sections": [{
        "section-title": _("Hot corners tweaks"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_hotcorners_tweaks_enabled",
                "properties": {
                    "description": _("Enable Hot Corners tweaks")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_hotcorners_delay_top_left",
                "properties": {
                    "description": _("Top left hot corner activation delay"),
                    "dependency": "pref_hotcorners_tweaks_enabled",
                    "tooltip": _("Set a delay in milliseconds to activate this hot corner."),
                    "min": 0,
                    "max": 1000,
                    "step": 50,
                    "units": _("milliseconds")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_hotcorners_delay_top_right",
                "properties": {
                    "description": _("Top right hot corner activation delay"),
                    "dependency": "pref_hotcorners_tweaks_enabled",
                    "tooltip": _("Set a delay in milliseconds to activate this hot corner."),
                    "min": 0,
                    "max": 1000,
                    "step": 50,
                    "units": _("milliseconds")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_hotcorners_delay_bottom_left",
                "properties": {
                    "description": _("Bottom left hot corner activation delay"),
                    "dependency": "pref_hotcorners_tweaks_enabled",
                    "tooltip": _("Set a delay in milliseconds to activate this hot corner."),
                    "min": 0,
                    "max": 1000,
                    "step": 50,
                    "units": _("milliseconds")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_hotcorners_delay_bottom_right",
                "properties": {
                    "description": _("Bottom right hot corner activation delay"),
                    "dependency": "pref_hotcorners_tweaks_enabled",
                    "tooltip": _("Set a delay in milliseconds to activate this hot corner."),
                    "min": 0,
                    "max": 1000,
                    "step": 50,
                    "units": _("milliseconds")
                }
            }
        }]
    }]
}

DESKTOP_TAB = {
    "page-title": _("Desktop"),
    "sections": [{
        "section-title": _("Desktop area tweaks"),
        "section-notes": [CINN_RESTART],
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_desktop_tweaks_enabled",
                "properties": {
                    "description": _("Enable Desktop area tweaks") + ASTERISK
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_desktop_tweaks_allow_drop_to_desktop",
                "properties": {
                    "description": _("Enable applications drop to the Desktop") + ASTERISK,
                    "dependency": "pref_desktop_tweaks_enabled",
                    "tooltip": _("With this option enabled, applications can be dragged from the menu applet and from the panel launchers applet and dropped into the desktop.")
                }
            }
        }]
    }, {
        "section-title": _("Tooltips tweaks"),
        "section-notes": [CINN_RESTART],
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_tooltips_tweaks_enabled",
                "properties": {
                    "description": _("Enable Tooltips tweaks") + ASTERISK
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_tooltips_inteligent_positioning",
                "properties": {
                    "description": _("Inteligent positioning") + ASTERISK,
                    "dependency": "pref_tooltips_tweaks_enabled",
                    "tooltip": _("Tooltips on Cinnamon's UI are positioned always at the bottom of the mouse cursor; no matter if there is room to display the entire tooltip. This results in cut off tooltips. With this tweak enabled, if there is no room to display the entire tooltip below the mouse cursor, the tooltip will be display above the mouse cursor.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_tooltips_never_centered",
                "properties": {
                    "description": _("Never center tooltip text") + ASTERISK,
                    "dependency": "pref_tooltips_tweaks_enabled",
                    "tooltip": _("Override the centered alignment of tooltips text set by certain Cinnamon themes (all the default ones). With this tweak enabled, the tooltip text will be aligned to the left or right depending on the text direction of the current system language.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_tooltips_half_monitor_width",
                "properties": {
                    "description": _("Restrict tooltips width to half monitor width") + ASTERISK,
                    "dependency": "pref_tooltips_tweaks_enabled"
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_tooltips_delay",
                "properties": {
                    "description": _("Tooltips show delay") + ASTERISK,
                    "dependency": "pref_tooltips_tweaks_enabled",
                    "tooltip": _("Set a delay in milliseconds to display Cinnamon's UI tooltips."),
                    "min": 100,
                    "max": 1000,
                    "step": 50,
                    "units": _("milliseconds")
                }
            }
        }]
    }, {
        "section-title": _("Popup menus tweaks"),
        "section-notes": [CINN_RESTART],
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_popup_menu_manager_tweaks_enabled",
                "properties": {
                    "description": _("Enable Popup menus tweaks") + ASTERISK
                }
            }
        }, {
            "widget-type": "combobox",
            "args": {
                "pref_key": "pref_popup_menu_manager_applets_menus_behavior",
                "properties": {
                    "description": _("Panel menus behavior") + ASTERISK,
                    "dependency": "pref_popup_menu_manager_tweaks_enabled",
                    "tooltip": _("This setting affects only the behavior of menus that belongs to applets placed on any panel.\n\nDon't eat clicks: By default, when one opens an applet's menu on Cinnamon and then click on another applet to open its menu, the first click is used to close the first opened menu, and then another click has to be performed to open the menu of the second applet. With this option enabled, one can directly open the menu of any applet even if another applet has its menu open."),
                    "options": {
                        "default": _("Default behavior"),
                        "do-not-eat": _("Don't \"eat\" clicks")
                    }
                }
            }
        }]
    }]
}

NOTIFICATIONS_TAB = {
    "page-title": _("Notifications"),
    "sections": [{
        "section-title": _("Notifications tweaks"),
        "section-info": {
            "context": "warning",
            "message": NOTIFICATIONS_SECTION_INFO
        },
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_notifications_enable_tweaks",
                "properties": {
                    "description": _("Enable notifications tweaks")
                }}
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_notifications_enable_animation",
                "properties": {
                    "description": _("Enable notifications open/close animation"),
                    "dependency": "pref_notifications_enable_tweaks"
                }
            }
        }, {
            "widget-type": "switch",
            "compatible": compare_version(CINNAMON_VERSION, "3.6.4") < 0,
            "args": {
                "pref_key": "pref_notifications_enable_close_button",
                "properties": {
                    "description": _("Add close notification button"),
                    "dependency": "pref_notifications_enable_tweaks"
                }
            }
        }, {
            "widget-type": "combobox",
            "args": {
                "pref_key": "pref_notifications_position",
                "properties": {
                    "description": _("Notifications position"),
                    "dependency": "pref_notifications_enable_tweaks",
                    "options": {
                        "top": _("Top-right of screen (System default)"),
                        "bottom": _("Bottom-right of screen")
                    }
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_notifications_distance_from_panel",
                "properties": {
                    "description": _("Distance from panel"),
                    "dependency": "pref_notifications_enable_tweaks",
                    "tooltip": _("For notifications displayed at the top-right of screen: this is the distance between the bottom border of the top panel (if no top panel, from the top of the screen) to the top border of the notification popup.\n\nFor notifications displayed at the bottom-right of screen: this is the distance between the top border of the bottom panel (if no bottom panel, from the bottom of the screen) to the bottom border of the notification popup."),
                    "min": 0,
                    "max": 512,
                    "step": 1,
                    "units": _("pixels")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_notifications_right_margin",
                "properties": {
                    "description": _("Notification popup right margin"),
                    "dependency": "pref_notifications_enable_tweaks",
                    "tooltip": _("By default, Cinnamon sets the right margin of the notification popup if it is defined by the currently used theme (margin-from-right-edge-of-screen CSS property). This option allows to set a custom right margin, ignoring the defined by the theme."),
                    "min": 0,
                    "max": 512,
                    "step": 1,
                    "units": _("pixels")
                }
            }
        }, {
            "widget-type": "button",
            "args": {
                "pref_key": "pref_test_notifications",
                "properties": {
                    "description": _("Display a test notification")
                }
            }
        }]
    }]
}

WINDOWS_TAB = {
    "page-title": _("Windows"),
    "sections": [{
        "section-title": _("Window focus tweaks"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_windows_focus_enable_tweaks",
                "properties": {
                    "description": _("Enable windows focus tweaks")
                }
            }
        }, {
            "widget-type": "combobox",
            "args": {
                "pref_key": "pref_win_demands_attention_activation_mode",
                "properties": {
                    "description": _("The activation of windows demanding attention..."),
                    "dependency": "pref_windows_focus_enable_tweaks",
                    "options": {
                        "none": _("...is handled by the system"),
                        "force": _("...is immediate"),
                        "hotkey": _("...is performed with a keyboard shortcut")
                    }
                }
            }
        }, {
            "widget-type": "keybinding",
            "args": {
                "pref_key": "pref_win_demands_attention_keyboard_shortcut",
                "properties": {
                    "description": _("Activate window demanding attention"),
                    "dependency": "pref_windows_focus_enable_tweaks",
                    "num-bind": 1
                }
            }
        }]
    }, {
        "section-title": _("Window shadows tweaks"),
        "section-info": {
            "context": "warning",
            "message": _("Client side decorated windows aren't affected by this tweak.")
        },
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_window_shadows_tweaks_enabled",
                "properties": {
                    "description": _("Enable window shadows tweaks"),
                    "tooltip": _("This tweak allows us to customize the shadow of all windows.")
                }
            }
        }, {
            "widget-type": "combobox",
            "args": {
                "pref_key": "pref_window_shadows_preset",
                "properties": {
                    "description": _("Shadow presets"),
                    "dependency": "pref_window_shadows_tweaks_enabled",
                    "options": {
                        "custom": _("Custom shadows"),
                        "default": _("Default shadows"),
                        "no_shadows": _("No shadows"),
                        "windows_10": _("Windows 10 shadows")
                    }
                }
            }
        }, {
            "widget-type": "list",
            "args": {
                "pref_key": "pref_window_shadows_custom_preset",
                "apply_key": "trigger_window_shadows_custom_preset",
                "properties": {
                    "columns": CUSTOM_SHADOWS_COLUMNS,
                    "dependency": [
                        "pref_window_shadows_preset=custom",
                        "pref_window_shadows_tweaks_enabled"
                    ],
                    "immutable": {
                        "read_only_keys": ["win_type"]
                    },
                    "height": 300,
                    "move-buttons": False
                }
            }
        }]
    }, {
        "section-title": _("Auto move windows"),
        "section-info": {
            "context": "warning",
            "message": _("Not all applications can be assigned to be moved. Most applications which can open multiple instances of themselves most likely cannot be configured to be automatically moved.")
        },
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_window_auto_move_tweaks_enabled",
                "properties": {
                    "description": _("Enable auto move windows tweak"),
                    "tooltip": _("This tweak enables the ability to set rules to open determined applications on specific workspaces.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_window_auto_move_auto_focus",
                "properties": {
                    "description": _("Automatically switch to moved application's workspace"),
                    "dependency": "pref_window_auto_move_tweaks_enabled"
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_window_auto_move_fullscreen_in_own_ws",
                "properties": {
                    "description": _("Move full screen applications to their own workspace"),
                    "dependency": "pref_window_auto_move_tweaks_enabled"
                }
            }
        }, {
            "widget-type": "applist",
            "args": {
                "pref_key": "pref_window_auto_move_fullscreen_in_own_ws_blacklist",
                "properties": {
                    "description": _("Full screen applications blacklist"),
                    "dependency": "pref_window_auto_move_tweaks_enabled",
                    "tooltip": _("Applications that should not be moved to a new workspace when they enter in full screen.")
                }
            }
        }, {
            "widget-type": "list",
            "args": {
                "pref_key": "pref_window_auto_move_application_list",
                "properties": {
                    "columns": WINDOWS_AUTO_MOVE_COLUMNS,
                    "dependency": "pref_window_auto_move_tweaks_enabled"
                }
            }
        }]
    }, {
        "section-title": _("Windows decorations removal"),
        "section-info": {
            "context": "warning",
            "message": WIN_DECORATIONS_SECTION_INFO
        },
        "widgets": [{
            "widget-type": "button",
            "args": {
                "pref_key": "pref_maximus_apply_settings",
                "properties": {
                    "description": _("Apply windows decorations settings")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_maximus_enable_tweak",
                "properties": {
                    "description": _("Enable maximized windows decoration removal")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_maximus_undecorate_half_maximized",
                "properties": {
                    "description": _("Undecorate half-maximized windows?"),
                    "dependency": "pref_maximus_enable_tweak"
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_maximus_undecorate_tiled",
                "properties": {
                    "description": _("Undecorate tiled windows?"),
                    "dependency": "pref_maximus_enable_tweak"
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_maximus_is_blacklist",
                "properties": {
                    "description": _("Applications list is a blacklist?"),
                    "dependency": "pref_maximus_enable_tweak",
                    "tooltip": _("If enabled, all applications will have their window decorations removed, except those listed in the list of applications.\n\nIf disabled, only the application from the list of applications will have their decorations removed.")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_maximus_invisible_windows_hack",
                "properties": {
                    "description": _("Enable hack for invisible windows"),
                    "dependency": "pref_maximus_enable_tweak",
                    "tooltip": _("On Cinnamon 3.4 or greater, the windows of the applications configured so that their decorations are removed when maximized, may become invisible. Enabling this option might prevent that, but it might also add a border of about 1 pixel in place of the title bar (it might depend on the metacity theme (Window borders) used).")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_maximus_enable_logging",
                "properties": {
                    "description": _("Enable logging"),
                    "dependency": "pref_maximus_enable_tweak",
                    "tooltip": _("For debugging purposes only.")
                }
            }
        }, {
            "widget-type": "applist",
            "args": {
                "pref_key": "pref_maximus_app_list",
                "properties": {
                    "description": _("Edit applications list"),
                    "dependency": "pref_maximus_enable_tweak"
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
    XLETS_TAB,
    HOTCORNERS_TAB,
    DESKTOP_TAB,
    NOTIFICATIONS_TAB,
    WINDOWS_TAB,
    OTHER_TAB
]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--xlet-type", dest="xlet_type")
    parser.add_argument("--xlet-instance-id", dest="xlet_instance_id")
    parser.add_argument("--xlet-uuid", dest="xlet_uuid")

    args = parser.parse_args()

    app = MainApplication(
        application_id="org.Cinnamon.Extensions.CinnamonTweaks.Settings",
        xlet_type=args.xlet_type or "extension",
        xlet_instance_id=args.xlet_instance_id or None,
        xlet_uuid=args.xlet_uuid or "{{UUID}}",
        pages_definition=PAGES_OBJECT,
        win_initial_width=800,
        win_initial_height=500,
    )
    app.run()
