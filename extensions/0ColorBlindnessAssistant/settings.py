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

CINN_RESTART = "(*) <i>%s</i>" % escape(_("Cinnamon needs to be restarted"))

INFO_LABELS = [
    "<b>%s</b>: %s" % (
        escape(_("Acromatopia (rod monochromatism)")),
        escape(_("Total or almost total color blindness."))
    ),
    "<b>%s</b>: %s" % (
        escape(_("Acromatopia (blue-cone monochromatism)")),
        escape(_("Total or almost total color blindness."))
    ),
    "<b>%s</b>: %s" % (
        escape(_("Deuteranopia")),
        escape(_("Green color deficiency."))
    ),
    "<b>%s</b>: %s" % (
        escape(_("Protanopia")),
        escape(_("Red color deficiency."))
    ),
    "<b>%s</b>: %s" % (
        escape(_("Tritanopia")),
        escape(_("Blue color deficiency."))
    )
]


LOGGING_LEVEL_TOOLTIP = "\n".join([
    _("It enables the ability to log the output of several functions used by the extension."),
    "",
    "%s: %s" % (_("Normal"), _("Only log messages caused by non critical errors.")),
    "%s: %s" % (_("Verbose"), _("Additionally log extra output messages and all HTTP responses.")),
    "%s: %s" % (_("Very verbose"), _(
        "Additionally log all method calls from all JavaScript classes/prototypes along with their execution time."))
])


EFFECTS_COLUMNS = [{
    "id": "base_name",
    "title": _("Effect"),
    "default": "acromatopia_rod_simulation",
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
            "widget-attrs": {
                "pref_key": "pref_color_inspector_kb"
            },
            "widget-kwargs": {
                "description": _("Keybinding"),
                "num-bind": 1
            }
        }, {
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_color_inspector_always_copy_to_clipboard"
            },
            "widget-kwargs": {
                "description": _("Always copy color information to clipboard"),
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_color_inspector_animation_time"
            },
            "widget-kwargs": {
                "description": _("UI animation time"),
                "units": _("milliseconds"),
                "default": 200,
                "max": 500,
                "min": 0,
                "step": 50,
                "page": 100
            }
        }]
    }, {
        "section-title": _("Daltonizer"),
        "widgets": [{
            "widget-type": "keybinding",
            "widget-attrs": {
                "pref_key": "pref_daltonizer_wizard_kb"
            },
            "widget-kwargs": {
                "description": _("Keybinding"),
                "num-bind": 1
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_daltonizer_animation_time"
            },
            "widget-kwargs": {
                "description": _("UI animation time"),
                "tooltip": _("Set to zero to disable animations."),
                "units": _("milliseconds"),
                "default": 200,
                "max": 500,
                "min": 0,
                "step": 50,
                "page": 100
            }
        }, {
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_daltonizer_show_actors_box"
            },
            "widget-kwargs": {
                "description": _("Display actor selection section")
            }
        }, {
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_daltonizer_show_colorspaces_box"
            },
            "widget-kwargs": {
                "description": _("Display color space selection section")
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
            "widget-attrs": {
                "pref_key": "pref_effects_list",
                "apply_key": "trigger_effects_list",
                "imp_exp_path_key": "pref_imp_exp_last_selected_directory"
            },
            "widget-kwargs": {
                "columns": EFFECTS_COLUMNS,
                "height": 250,
                "dialog-info-labels": INFO_LABELS
            }
        }]
    }]
}


OTHER_TAB = {
    "page-title": _("Other"),
    "sections": [{
        "section-title": _("GUI theme"),
        "widgets": [{
            "widget-type": "combobox",
            "widget-attrs": {
                "pref_key": "pref_theme"
            },
            "widget-kwargs": {
                "description": _("Theme"),
                "options": {
                    "default": _("Default"),
                    "custom": _("Custom")
                }
            }
        }, {
            "widget-type": "filechooser",
            "widget-attrs": {
                "pref_key": "pref_theme_path_custom"
            },
            "widget-kwargs": {
                "description": _("Custom theme path")
            }
        }]
    }, {
        "section-title": _("Miscellaneous"),
        "widgets": [{
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_apply_cinnamon_injections"
            },
            "widget-kwargs": {
                "description": _("Windows clones inherit effects"),
                "tooltip": _("Window thumbnails generated by the [[Alt]] + [[Tab]] switchers and workspace previews will inherit the effect of the real windows.")
            }
        }]
    }, {
        "section-title": _("Debugging"),
        "section-notes": [CINN_RESTART],
        "widgets": [{
            "widget-type": "gcombobox",
            "widget-attrs": {
                "pref_key": "pref-logging-level",
                "schema": "org.cinnamon.{{XLET_TYPE}}s.{{UUID}}"
            },
            "widget-kwargs": {
                "description": "%s (*)" % _("Logging level"),
                "tooltip": LOGGING_LEVEL_TOOLTIP,
                "options": {
                    0: _("Normal"),
                    1: _("Verbose"),
                    2: _("Very verbose")
                }
            }
        }, {
            "widget-type": "gswitch",
            "widget-attrs": {
                "pref_key": "pref-debugger-enabled",
                "schema": "org.cinnamon.{{XLET_TYPE}}s.{{UUID}}"
            },
            "widget-kwargs": {
                "description": "%s (*)" % _("Enable debugger"),
                "tooltip": _("It enables the ability to catch all exceptions that under normal use would not be caught.")
            }
        }]
    }]
}


PAGES_DEFINITION = [
    TOOLS_TAB,
    EFFECTS_TAB,
    OTHER_TAB,
]


if __name__ == "__main__":
    # NOTE: I extend sys.argv for extensions so I can call the settings.py script without arguments.
    sys.argv.extend(("--xlet-uuid={{UUID}}",
                     "--app-id=org.Cinnamon.Extensions.ColorBlindnessAssistant.Settings"))
    sys.exit(cli(PAGES_DEFINITION))
