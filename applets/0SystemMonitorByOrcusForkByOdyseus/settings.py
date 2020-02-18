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

LOGGING_LEVEL_TOOLTIP = "\n".join([
    _("It enables the ability to log the output of several functions used by the extension."),
    "",
    "%s: %s" % (_("Normal"), _("Only log messages caused by non critical errors.")),
    "%s: %s" % (_("Verbose"), _("Additionally log extra output messages and all HTTP responses.")),
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
            "widget-attrs": {
                "pref_key": "pref_overlay_key"
            },
            "widget-kwargs": {
                "description": _("Keyboard shortcut to launch a custom command")
            }
        }, {
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_onkeybinding_command"
            },
            "widget-kwargs": {
                "description": _("Command to launch on keyboard shortcut"),
                "tooltip": _("Command to launch when the keyboard shortcut specified above is pressed.")
            }
        }, {
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_onclick_command"
            },
            "widget-kwargs": {
                "description": _("Command to launch on click"),
                "tooltip": _("Command to launch when the applet is clicked.")
            }
        }]
    }, {
        "section-title": _("Graphs order"),
        "section-notes": [
            "<i>%s</i>" % escape(_("Move elements on the list to reorder the graphs in the applet."))
        ],
        "widgets": [{
            "widget-type": "list",
            "widget-attrs": {
                "pref_key": "pref_graph_ids"
            },
            "widget-kwargs": {
                "columns": IDS_COLUMN,
                "immutable": {
                    "allow-edition": False
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
            "widget-attrs": {
                "pref_key": "pref_smooth"
            },
            "widget-kwargs": {
                "description": _("Smooth graphs")
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_graph_width"
            },
            "widget-kwargs": {
                "description": _("Common graph width"),
                "tooltip": _("If the applet is in a vertical panel, this sets the graph height. The graph width is then the panel width minus padding."),
                "min": 10,
                "max": 1000,
                "step": 1,
                "units": "pixels"
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_graph_spacing"
            },
            "widget-kwargs": {
                "description": _("Graph spacing"),
                "tooltip": _("The number of pixels between each graph. Can be set to -1 to allow single line borders between graphs if borders are enabled."),
                "min": -1,
                "max": 100,
                "step": 1,
                "units": "pixels"
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_refresh_rate"
            },
            "widget-kwargs": {
                "description": _("Refresh rate"),
                "min": 100,
                "max": 10000,
                "step": 50,
                "units": "milliseconds"
            }
        }, {
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_use_padding"
            },
            "widget-kwargs": {
                "description": _("Use custom applet padding")
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_padding_lr"
            },
            "widget-kwargs": {
                "description": _("Left/right padding"),
                "dependency": "pref_use_padding",
                "min": 0,
                "max": 100,
                "step": 1,
                "units": "pixels"
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_padding_tb"
            },
            "widget-kwargs": {
                "description": _("Top/bottom padding"),
                "dependency": "pref_use_padding",
                "min": 0,
                "max": 100,
                "step": 1,
                "units": "pixels"
            }
        }, {
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_draw_background"
            },
            "widget-kwargs": {
                "description": _("Draw background")
            }
        }, {
            "widget-type": "colorchooser",
            "widget-attrs": {
                "pref_key": "pref_bg_color"
            },
            "widget-kwargs": {
                "description": _("Background color"),
                "dependency": "pref_draw_background"
            }
        }, {
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_draw_border"
            },
            "widget-kwargs": {
                "description": _("Draw border")
            }
        }, {
            "widget-type": "colorchooser",
            "widget-attrs": {
                "pref_key": "pref_border_color"
            },
            "widget-kwargs": {
                "description": _("Border color"),
                "dependency": "pref_draw_border"
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
            "widget-attrs": {
                "pref_key": "pref_cpu_override_graph_width"
            },
            "widget-kwargs": {
                "description": _("Override graph width")
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_cpu_graph_width"
            },
            "widget-kwargs": {
                "description": _("Graph width"),
                "dependency": "pref_cpu_override_graph_width",
                "min": 10,
                "max": 1000,
                "step": 1,
                "units": "pixels"
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_cpu_tooltip_decimals"
            },
            "widget-kwargs": {
                "description": _("Show this many decimals in the tooltip"),
                "min": 0,
                "max": 10,
                "step": 1,
                "units": "decimals"
            }
        }, {
            "widget-type": "colorchooser",
            "widget-attrs": {
                "pref_key": "pref_cpu_color_0"
            },
            "widget-kwargs": {
                "description": _("User color")
            }
        }, {
            "widget-type": "colorchooser",
            "widget-attrs": {
                "pref_key": "pref_cpu_color_1"
            },
            "widget-kwargs": {
                "description": _("Nice color")
            }
        }, {
            "widget-type": "colorchooser",
            "widget-attrs": {
                "pref_key": "pref_cpu_color_2"
            },
            "widget-kwargs": {
                "description": _("Kernel color")
            }
        }, {
            "widget-type": "colorchooser",
            "widget-attrs": {
                "pref_key": "pref_cpu_color_3"
            },
            "widget-kwargs": {
                "description": _("IOWait color")
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
            "widget-attrs": {
                "pref_key": "pref_mem_override_graph_width"
            },
            "widget-kwargs": {
                "description": _("Override graph width")
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_mem_graph_width"
            },
            "widget-kwargs": {
                "description": _("Graph width"),
                "dependency": "pref_mem_override_graph_width",
                "min": 10,
                "max": 1000,
                "step": 1,
                "units": "pixels"
            }
        }, {
            "widget-type": "colorchooser",
            "widget-attrs": {
                "pref_key": "pref_mem_color_0"
            },
            "widget-kwargs": {
                "description": _("Used color")
            }
        }, {
            "widget-type": "colorchooser",
            "widget-attrs": {
                "pref_key": "pref_mem_color_1"
            },
            "widget-kwargs": {
                "description": _("Cached color")
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
            "widget-attrs": {
                "pref_key": "pref_swap_override_graph_width"
            },
            "widget-kwargs": {
                "description": _("Override graph width")
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_swap_graph_width"
            },
            "widget-kwargs": {
                "description": _("Graph width"),
                "dependency": "pref_swap_override_graph_width",
                "min": 10,
                "max": 1000,
                "step": 1,
                "units": "pixels"
            }
        }, {
            "widget-type": "colorchooser",
            "widget-attrs": {
                "pref_key": "pref_swap_color_0"
            },
            "widget-kwargs": {
                "description": _("Used color")
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
            "widget-attrs": {
                "pref_key": "pref_net_override_graph_width"
            },
            "widget-kwargs": {
                "description": _("Override graph width")
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_net_graph_width"
            },
            "widget-kwargs": {
                "description": _("Graph width"),
                "dependency": "pref_net_override_graph_width",
                "min": 10,
                "max": 1000,
                "step": 1,
                "units": "pixels"
            }
        }, {
            "widget-type": "colorchooser",
            "widget-attrs": {
                "pref_key": "pref_net_color_0"
            },
            "widget-kwargs": {
                "description": _("Download color")
            }
        }, {
            "widget-type": "colorchooser",
            "widget-attrs": {
                "pref_key": "pref_net_color_1"
            },
            "widget-kwargs": {
                "description": _("Upload color")
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
            "widget-attrs": {
                "pref_key": "pref_load_override_graph_width"
            },
            "widget-kwargs": {
                "description": _("Override graph width")
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_load_graph_width"
            },
            "widget-kwargs": {
                "description": _("Graph width"),
                "dependency": "pref_load_override_graph_width",
                "min": 10,
                "max": 1000,
                "step": 1,
                "units": "pixels"
            }
        }, {
            "widget-type": "colorchooser",
            "widget-attrs": {
                "pref_key": "pref_load_color_0"
            },
            "widget-kwargs": {
                "description": _("Color")
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
    sys.exit(cli(PAGES_DEFINITION))
