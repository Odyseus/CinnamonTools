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
from python_modules.xlets_settings.builder import WindowDefinition
from python_modules.xlets_settings.builder import get_debugging_section

XLET_UUID = os.path.basename(XLET_DIR)
XLET_TYPE = os.path.basename(os.path.dirname(XLET_DIR))[:-1]

IDS_COLUMN = [{
    "id": "enabled",
    "title": _("Enabled"),
    "type": "boolean"
}, {
    "id": "smooth",
    "title": _("Smooth"),
    "type": "boolean"
}, {
    "id": "id",
    "title": _("Graphs"),
    "type": "string",
    "options": {
        "cpu": _("CPU"),
        "mem": _("Memory"),
        "swap": _("Swap"),
        "net": _("Network"),
        "load": _("Load average"),
    }
}, {
    "id": "width_height",
    "title": _("Width/Height"),
    "type": "integer",
    "default": 40,
    "min": 5,
    "max": 500,
    "step": 1,
    "units": _("pixels")
}, {
    "id": "bg_color",
    "title": _("Background color"),
    "type": "color"
}, {
    "id": "border_color",
    "title": _("Border color"),
    "type": "color"
}]

win_def = WindowDefinition()
general_page = win_def.add_page(_("General"))
general_section = general_page.add_section(_("General"))
general_section.add_widget("keybinding", "run_command_keybinding", {
    "description": _("Keyboard shortcut to launch a custom command")
})
general_section.add_widget("entry", "onkeybinding_command", {
    "description": _("Command to launch on keyboard shortcut"),
    "tooltip": _("Command to launch when the keyboard shortcut specified above is pressed.")
})
general_section.add_widget("entry", "onclick_command", {
    "description": _("Command to launch on click"),
    "tooltip": _("Command to launch when the applet is clicked.")
})

general_section = general_page.add_section(_("Graphs"), notes=[
    "<i>%s</i>" % escape(_("Move elements on the list to reorder the graphs in the applet and its tooltip."))
])
general_section.add_widget("list", "graph_definitions", {
    "columns": IDS_COLUMN,
    "immutable": {
        "read-only-keys": ["id"],
        "allow-edition": True
    }
})

appear_page = win_def.add_page(_("Appearance"))
appear_section = appear_page.add_section(_("Appearance"))
appear_section.add_widget("spinbutton", "graph_spacing", {
    "description": _("Graph spacing"),
    "tooltip": _("The number of pixels between each graph. Can be set to -1 to allow single line borders between graphs if borders are enabled."),
    "min": -1,
    "max": 100,
    "step": 1,
    "units": _("pixels")
})
appear_section.add_widget("spinbutton", "refresh_rate", {
    "description": _("Refresh rate"),
    "min": 100,
    "max": 10000,
    "step": 50,
    "units": _("milliseconds")
})
appear_section.add_widget("switch", "use_padding", {
    "description": _("Use custom applet padding")
})
appear_section.add_widget("spinbutton", "padding_lr", {
    "description": _("Left/right padding"),
    "dependency": "use_padding",
    "min": 0,
    "max": 100,
    "step": 1,
    "units": _("pixels")
})
appear_section.add_widget("spinbutton", "padding_tb", {
    "description": _("Top/bottom padding"),
    "dependency": "use_padding",
    "min": 0,
    "max": 100,
    "step": 1,
    "units": _("pixels")
})

cpu_page = win_def.add_page(_("CPU"))
cpu_section = cpu_page.add_section(_("CPU graph"))
cpu_section.add_widget("spinbutton", "cpu_tooltip_decimals", {
    "description": _("Show this many decimals in the tooltip"),
    "min": 0,
    "max": 10,
    "step": 1,
    "units": _("decimals")
})
cpu_section.add_widget("colorchooser", "cpu_color_0", {
    "description": _("User color")
})
cpu_section.add_widget("colorchooser", "cpu_color_1", {
    "description": _("Nice color")
})
cpu_section.add_widget("colorchooser", "cpu_color_2", {
    "description": _("Kernel color")
})
cpu_section.add_widget("colorchooser", "cpu_color_3", {
    "description": _("IOWait color")
})

mem_page = win_def.add_page(_("Memory"))
mem_section = mem_page.add_section(_("Memory graph"))
mem_section.add_widget("colorchooser", "mem_color_0", {
    "description": _("Used color")
})
mem_section.add_widget("colorchooser", "mem_color_1", {
    "description": _("Cached color")
})

swap_page = win_def.add_page(_("Swap"))
swap_section = swap_page.add_section(_("Swap graph"))
swap_section.add_widget("colorchooser", "swap_color_0", {
    "description": _("Used color")
})

net_page = win_def.add_page(_("Network"))
net_section = net_page.add_section(_("Network graph"))
net_section.add_widget("colorchooser", "net_color_0", {
    "description": _("Download color")
})
net_section.add_widget("colorchooser", "net_color_1", {
    "description": _("Upload color")
})

load_page = win_def.add_page(_("Load average"))
load_section = load_page.add_section(_("Load average graph"))
load_section.add_widget("colorchooser", "load_color_0", {
    "description": _("Color")
})


other_page = win_def.add_page(_("Other"))
other_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
