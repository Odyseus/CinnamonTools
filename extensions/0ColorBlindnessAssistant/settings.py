#!/usr/bin/python3
# -*- coding: utf-8 -*-
import argparse
import cgi
import os
import sys

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
modules_dir = os.path.join(XLET_DIR)
sys.path.append(modules_dir)

from python_modules.xlets_settings import MainApplication
from python_modules.xlets_settings import _

INFO_LABELS = [
    "<b>%s</b>: %s" % (
        cgi.escape(_("Acromatopia (rod monochromatism)")),
        cgi.escape(_("Total or almost total color blindness."))
    ),
    "<b>%s</b>: %s" % (
        cgi.escape(_("Acromatopia (blue-cone monochromatism)")),
        cgi.escape(_("Total or almost total color blindness."))
    ),
    "<b>%s</b>: %s" % (
        cgi.escape(_("Deuteranopia")),
        cgi.escape(_("Green color deficiency."))
    ),
    "<b>%s</b>: %s" % (
        cgi.escape(_("Protanopia")),
        cgi.escape(_("Red color deficiency."))
    ),
    "<b>%s</b>: %s" % (
        cgi.escape(_("Tritanopia")),
        cgi.escape(_("Blue color deficiency."))
    )
]

EFFECTS_COLUMNS = [{
    "id": "base_name",
    "title": _("Effect"),
    "default": "acromatopia_simulation",
    "type": "string",
    "options": {
        "acromatopia_rod_simulation": _("Acromatopia (rod) simulation"),
        "acromatopia_blue_cone_simulation": _("Acromatopia (blue cone) simulation"),
        "deuteranopia_compensation": _("Deuteranopia compensation"),
        "deuteranopia_simulation": _("Deuteranopia simulation"),
        "protanopia_compensation": _("Protanopia compensation"),
        "protanopia_simulation": _("Protanopia simulation"),
        "tritanopia_compensation": _("Tritanopia compensation"),
        "tritanopia_simulation": _("Tritanopia simulation"),
    }
}, {
    "id": "actor",
    "title": _("Actor"),
    "default": "focused_window",
    "type": "string",
    "options": {
        "focused_window": _("Focused window"),
        "screen": _("Screen"),
    }
}, {
    "id": "color_space",
    "title": _("Color space"),
    "default": "srgb",
    "type": "string",
    "options": {
        "srgb": _("sRGB"),
        "cie": _("CIE RGB"),
    }
}, {
    "id": "keybinding",
    "title": _("Keybinding"),
    "type": "keybinding",
    "num-bind": 1
}]


TOOLS_TAB = {
    "page-title": _("Tools"),
    "sections": [{
        "section-title": _("Color inspector"),
        "widgets": [{
            "widget-type": "keybinding",
            "args": {
                "pref_key": "pref_color_inspector_kb",
                "properties": {
                    "description": _("Color inspector keybinding"),
                    "num-bind": 1
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_color_inspector_always_copy_to_clipboard",
                "properties": {
                    "description": _("Always copy color information to clipboard"),
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_color_inspector_animation_time",
                "properties": {
                    "description": _("Color inspector animation time"),
                    "units": _("milliseconds"),
                    "default": 200,
                    "max": 500,
                    "min": 0,
                    "step": 50,
                    "page": 100
                }
            }
        }]
    }, {
        "section-title": _("Daltonizer"),
        "widgets": [{
            "widget-type": "keybinding",
            "args": {
                "pref_key": "pref_daltonizer_wizard_kb",
                "properties": {
                    "description": _("Daltonizer wizard keybinding"),
                    "num-bind": 1
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_daltonizer_animation_time",
                "properties": {
                    "description": _("Daltonizer animation time"),
                    "units": _("milliseconds"),
                    "default": 200,
                    "max": 500,
                    "min": 0,
                    "step": 50,
                    "page": 100
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_daltonizer_show_actors_box",
                "properties": {
                    "description": _("Display actor selection section")
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_daltonizer_show_colorspaces_box",
                "properties": {
                    "description": _("Display color space selection section")
                }
            }
        }]
    }]
}


EFFECTS_TAB = {
    "page-title": _("Effects"),
    "sections": [{
        "section-title": _("Effects"),
        "widgets": [{
            "widget-type": "list",
            "args": {
                "pref_key": "pref_effects_list",
                "apply_key": "trigger_effects_list",
                "imp_exp_path_key": "pref_imp_exp_last_selected_directory",
                "properties": {
                    "columns": EFFECTS_COLUMNS,
                    "height": 250,
                    "dialog-info-labels": INFO_LABELS
                }
            }
        }]
    }]
}


OTHER_TAB = {
    "page-title": _("Other"),
    "sections": [{
        "section-title": _("Settings page shortcut"),
        "section-info": {
            "context": "warning",
            "message": cgi.escape(_("Generated .desktop files will not be automatically deleted when this extension is disabled/uninstalled."))
        },
        "widgets": [{
            "widget-type": "button",
            "args": {
                "pref_key": "trigger_settings_shortcut_creation_desktop",
                "properties": {
                    "description": _("Create shortcut on desktop"),
                    "tooltip": _("Create a .desktop file to launch this extension settings from the desktop.")
                }
            }
        }, {
            "widget-type": "button",
            "args": {
                "pref_key": "trigger_settings_shortcut_creation_xdg",
                "properties": {
                    "description": _("Create shortcut on ~/.local/share/applications"),
                    "tooltip": _("Create a .desktop file to launch this extension settings from the applications menu.")
                }
            }
        }]
    }, {
        "section-title": _("GUIs theme"),
        "widgets": [{
            "widget-type": "combobox",
            "args": {
                "pref_key": "pref_theme",
                "properties": {
                    "description": _("Theme"),
                    "options": {
                        "default": _("Default"),
                        "custom": _("Custom")
                    }
                }
            }
        }, {
            "widget-type": "filechooser",
            "args": {
                "pref_key": "pref_theme_path_custom",
                "properties": {
                    "description": _("Custom theme path")
                }
            }
        }]
    }, {
        "section-title": _("Miscellaneous"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_apply_cinnamon_injections",
                "properties": {
                    "description": _("Windows clones inherit effects"),
                    "tooltip": _("Window thumbnails generated by the [[Alt]] + [[Tab]] switchers and workspace previews will inherit the effect of the real windows.")
                }
            }
        }]
    }]
}


PAGES_OBJECT = [
    TOOLS_TAB,
    EFFECTS_TAB,
    OTHER_TAB,
]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--xlet-type", dest="xlet_type")
    parser.add_argument("--xlet-instance-id", dest="xlet_instance_id")
    parser.add_argument("--xlet-uuid", dest="xlet_uuid")

    args = parser.parse_args()

    app = MainApplication(
        application_base_id="org.Cinnamon.Extensions.ColorBlindnessAssistant.Settings",
        xlet_type=args.xlet_type or "extension",
        xlet_instance_id=args.xlet_instance_id or None,
        xlet_uuid=args.xlet_uuid or "{{UUID}}",
        pages_definition=PAGES_OBJECT,
        win_initial_width=800,
        win_initial_height=470,
    )
    app.run()
