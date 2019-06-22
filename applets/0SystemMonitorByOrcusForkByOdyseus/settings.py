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

ASTERISK = " (*)"
CINN_RESTART = "(*) <i>%s</i>" % escape(_("Cinnamon needs to be restarted"))

LOGGING_LEVEL_TOOLTIP = "\n".join([
    _("It enables the ability to log the output of several functions used by the extension."),
    "",
    "%s: %s" % (_("Normal"), _("Only log messages caused by non critical errors.")),
    "%s: %s" % (_("Verbose"), _("Additinally log extra output messages and all HTTP responses.")),
    "%s: %s" % (_("Very verbose"), _(
        "Additionally log all method calls from all JavaScript classes/prototypes along with their execution time."))
])


IDS_COLUMN = [{
    "id": "enabled",
    "title": _("Enabled"),
    "type": "boolean"
}, {
    "id": "graph_id",
    "title": _("Graphs"),
    "type": "string",
    "options": {
        "cpu": _("CPU"),
        "mem": _("Memory"),
        "swap": _("Swap"),
        "net": _("Network"),
        "load": _("Load average"),
    }
}]


GENERAL_TAB = {
    "page-title": _("General"),
    "sections": [{
        "section-title": _("General"),
        "widgets": [{
            "widget-type": "keybinding",
            "args": {
                "pref_key": "pref_overlay_key",
                "properties": {
                    "description": _("Keyboard shortcut to launch a custom command"),
                    "num-bind": 1
                }
            }
        }, {
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_onkeybinding_command",
                "properties": {
                    "description": _("Command to launch on keyboard shortcut"),
                    "tooltip": _("Command to launch when the keyboard shortcut specified above is pressed.")
                }
            }
        }, {
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_onclick_command",
                "properties": {
                    "description": _("Command to launch on click"),
                    "tooltip": _("Command to launch when the applet is clicked.")
                }
            }
        }]
    }, {
        "section-title": _("Graphs order"),
        "section-notes": [
            "<i>%s</i>" % escape(_("Move elements on the list to reorder the graphs in the applet."))
        ],
        "widgets": [{
            "widget-type": "list",
            "args": {
                "pref_key": "pref_graph_ids",
                "properties": {
                    "columns": IDS_COLUMN,
                    "immutable": {
                        "allow_edition": False
                    }
                }
            }
        }]
    }]
}

APPEARANCE_TAB = {
    "page-title": _("Appearance"),
    "sections": [{
        "section-title": _("Appearance"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_smooth",
                "properties": {
                    "description": _("Smooth graphs")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_graph_width",
                "properties": {
                    "description": _("Common graph width"),
                    "tooltip": _("If the applet is in a vertical panel, this sets the graph height. The graph width is then the panel width minus padding."),
                    "min": 10,
                    "max": 1000,
                    "step": 1,
                    "units": "pixels"
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_graph_spacing",
                "properties": {
                    "description": _("Graph spacing"),
                    "tooltip": _("The number of pixels between each graph. Can be set to -1 to allow single line borders between graphs if borders are enabled."),
                    "min": -1,
                    "max": 100,
                    "step": 1,
                    "units": "pixels"
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_refresh_rate",
                "properties": {
                    "description": _("Refresh rate"),
                    "min": 100,
                    "max": 10000,
                    "step": 50,
                    "units": "milliseconds"
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_use_padding",
                "properties": {
                    "description": _("Use custom applet padding")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_padding_lr",
                "properties": {
                    "description": _("Left/right padding"),
                    "dependency": "pref_use_padding",
                    "min": 0,
                    "max": 100,
                    "step": 1,
                    "units": "pixels"
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_padding_tb",
                "properties": {
                    "description": _("Top/bottom padding"),
                    "dependency": "pref_use_padding",
                    "min": 0,
                    "max": 100,
                    "step": 1,
                    "units": "pixels"
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_draw_background",
                "properties": {
                    "description": _("Draw background")
                }
            }
        }, {
            "widget-type": "colorchooser",
            "args": {
                "pref_key": "pref_bg_color",
                "properties": {
                    "description": _("Background color"),
                    "dependency": "pref_draw_background"
                }
            }
        }, {
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_draw_border",
                "properties": {
                    "description": _("Draw border")
                }
            }
        }, {
            "widget-type": "colorchooser",
            "args": {
                "pref_key": "pref_border_color",
                "properties": {
                    "description": _("Border color"),
                    "dependency": "pref_draw_border"
                }
            }
        }]
    }]
}

CPU_TAB = {
    "page-title": _("CPU"),
    "sections": [{
        "section-title": _("CPU"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_cpu_override_graph_width",
                "properties": {
                    "description": _("Override graph width")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_cpu_graph_width",
                "properties": {
                    "description": _("Graph width"),
                    "dependency": "pref_cpu_override_graph_width",
                    "min": 10,
                    "max": 1000,
                    "step": 1,
                    "units": "pixels"
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_cpu_tooltip_decimals",
                "properties": {
                    "description": _("Show this many decimals in the tooltip"),
                    "min": 0,
                    "max": 10,
                    "step": 1,
                    "units": "decimals"
                }
            }
        }, {
            "widget-type": "colorchooser",
            "args": {
                "pref_key": "pref_cpu_color_0",
                "properties": {
                    "description": _("User color")
                }
            }
        }, {
            "widget-type": "colorchooser",
            "args": {
                "pref_key": "pref_cpu_color_1",
                "properties": {
                    "description": _("Nice color")
                }
            }
        }, {
            "widget-type": "colorchooser",
            "args": {
                "pref_key": "pref_cpu_color_2",
                "properties": {
                    "description": _("Kernel color")
                }
            }
        }, {
            "widget-type": "colorchooser",
            "args": {
                "pref_key": "pref_cpu_color_3",
                "properties": {
                    "description": _("IOWait color")
                }
            }
        }]
    }]
}

MEMORY_TAB = {
    "page-title": _("Memory"),
    "sections": [{
        "section-title": _("Memory graph"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_mem_override_graph_width",
                "properties": {
                    "description": _("Override graph width")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_mem_graph_width",
                "properties": {
                    "description": _("Graph width"),
                    "dependency": "pref_mem_override_graph_width",
                    "min": 10,
                    "max": 1000,
                    "step": 1,
                    "units": "pixels"
                }
            }
        }, {
            "widget-type": "colorchooser",
            "args": {
                "pref_key": "pref_mem_color_0",
                "properties": {
                    "description": _("Used color")
                }
            }
        }, {
            "widget-type": "colorchooser",
            "args": {
                "pref_key": "pref_mem_color_1",
                "properties": {
                    "description": _("Cached color")
                }
            }
        }]
    }]
}

SWAP_TAB = {
    "page-title": _("Swap"),
    "sections": [{
        "section-title": _("Swap graph"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_swap_override_graph_width",
                "properties": {
                    "description": _("Override graph width")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_swap_graph_width",
                "properties": {
                    "description": _("Graph width"),
                    "dependency": "pref_swap_override_graph_width",
                    "min": 10,
                    "max": 1000,
                    "step": 1,
                    "units": "pixels"
                }
            }
        }, {
            "widget-type": "colorchooser",
            "args": {
                "pref_key": "pref_swap_color_0",
                "properties": {
                    "description": _("Used color")
                }
            }
        }]
    }]
}

NETWORK_TAB = {
    "page-title": _("Network"),
    "sections": [{
        "section-title": _("Network graph"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_net_override_graph_width",
                "properties": {
                    "description": _("Override graph width")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_net_graph_width",
                "properties": {
                    "description": _("Graph width"),
                    "dependency": "pref_net_override_graph_width",
                    "min": 10,
                    "max": 1000,
                    "step": 1,
                    "units": "pixels"
                }
            }
        }, {
            "widget-type": "colorchooser",
            "args": {
                "pref_key": "pref_net_color_0",
                "properties": {
                    "description": _("Download color")
                }
            }
        }, {
            "widget-type": "colorchooser",
            "args": {
                "pref_key": "pref_net_color_1",
                "properties": {
                    "description": _("Upload color")
                }
            }
        }]
    }]
}

LOAD_TAB = {
    "page-title": _("Load average"),
    "sections": [{
        "section-title": _("Load average graph"),
        "widgets": [{
            "widget-type": "switch",
            "args": {
                "pref_key": "pref_load_override_graph_width",
                "properties": {
                    "description": _("Override graph width")
                }
            }
        }, {
            "widget-type": "spinbutton",
            "args": {
                "pref_key": "pref_load_graph_width",
                "properties": {
                    "description": _("Graph width"),
                    "dependency": "pref_load_override_graph_width",
                    "min": 10,
                    "max": 1000,
                    "step": 1,
                    "units": "pixels"
                }
            }
        }, {
            "widget-type": "colorchooser",
            "args": {
                "pref_key": "pref_load_color_0",
                "properties": {
                    "description": _("Color")
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
    GENERAL_TAB,
    APPEARANCE_TAB,
    CPU_TAB,
    MEMORY_TAB,
    SWAP_TAB,
    NETWORK_TAB,
    LOAD_TAB,
    OTHER_TAB
]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--xlet-type", dest="xlet_type")
    parser.add_argument("--xlet-instance-id", dest="xlet_instance_id")
    parser.add_argument("--xlet-uuid", dest="xlet_uuid")

    args = parser.parse_args()

    app = MainApplication(
        application_id="org.Cinnamon.Applets.SystemMonitor.Settings",
        xlet_type=args.xlet_type or "extension",
        xlet_instance_id=args.xlet_instance_id or None,
        xlet_uuid=args.xlet_uuid or "{{UUID}}",
        pages_definition=PAGES_OBJECT
    )
    app.run()
