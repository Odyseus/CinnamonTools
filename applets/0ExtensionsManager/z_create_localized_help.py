#!/usr/bin/python3
# -*- coding: utf-8 -*-

import os
import sys

xlet_dir = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))

xlet_slug = os.path.basename(xlet_dir)

repo_folder = os.path.normpath(os.path.join(xlet_dir, *([".."] * 2)))

app_folder = os.path.join(repo_folder, "__app__")

if app_folder not in sys.path:
    sys.path.insert(0, app_folder)

from python_modules.localized_help_creator import LocalizedHelpCreator
from python_modules.localized_help_creator import _
from python_modules.localized_help_creator import md
from python_modules.localized_help_creator import utils


class Main(LocalizedHelpCreator):

    def __init__(self, xlet_dir, xlet_slug):
        super(Main, self).__init__(xlet_dir, xlet_slug)

    def get_content_base(self, for_readme):
        return "\n".join([
            "## %s" % _("Description"),
            "",
            _("This applet creates a menu with a list of all installed extensions in Cinnamon. From each menu item different tasks can be performed:"),
            "",
            "- %s" % _("Enable/Disable the extension"),
            "- %s" % _("Open the extension's settings page"),
            "- %s" % _("Open the extension's Spices page"),
            "- %s" % _("Open the extension folder"),
            "- %s" % _("Open its extension.js file"),
        ])

    def get_content_extra(self):
        return md("\n".join([
            "## %s" % _("Settings window"),
            "",
            utils.get_image_container(
                extra_classes="settings-window",
                alt=_("Settings window")
            ),
            "",
        ]))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return """
Array.prototype.slice.call(document.getElementsByClassName("settings-window")).forEach(function(aEl) {
    aEl.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyIAAANSCAMAAACusYqtAAADAFBMVEU8kOg6j+c+kOJIlNdFj9JAhMpFhL9Qf7FCbqUzaLc8WZ8sTJwwSY4wQ4Y1O3wxOW4wRm0+WnhVaXlqbnh5cnCIfGeMfHKGg4KKj4yFjp6VlZaXl5iXlpadjpSumIWinpygoJ+goKCioqKoqKico7KJpMKAp8t3qNRtoclhmstfotZOouBSqOZao+lgr+Vrrel+uOhyweuBy+2H0PCO0vGX0O2b2PGe3fOi2PGr0fKmzumsyNimxc2avMauubWzta+zs7O6uLe/uby+vb2+vr6+vr6+vr6/v7+/v7+/wMDAwMDAwMHAwcG/wcLBwcLDwrzQwanKyK/M0bjEw8HDw8PDw8PDw8PDxMTExMTExcXExca9x8jExsbFxsXGxsbGx8bHyMfHyMjHyMjIyMjIycjJycrJysrKyszKy8vLy8vMzMzMzMzNzM3Nzc3Nzs7Oz8/Pzs/Pz8/Q0M/Q0NDR0dHR0tHP09LU1c3T0tLT0tPT1NTU1NTV1dXV1dXW1tXX1tPW1tbX1NfY0NfX1dfW1tfW19fR2dnX2NnY2NnZ2djZ2dnd3dLb2trb29vd3NzZ3d3d3d3f3t7f39/h4ODh4eHi4uLj4+Pk4+Pk5OTl5uXn6Ofp6enq6urq6urr6+rr7Ovr7Ozs7e3t7ert7u3t7u7t7+7v7+7v8e3w8e/w8fDx8fHy8vLz8/Lz8/Pz8/P09PTz8/Py8vTW6PPN4vfG3vC64vK05/bE6fXM7vbS8Pbb8/bh7vfo9Pjr9fbu9vjy9vn09vb29vX19fL28+T29en29uz29/D39/X29/X29/f29/f29/f3+Pj5+fn5+fr4+fz5+/v7+/v+/v7+/v79/fr28dj279H27cby5sby5b326bjy5bDv4K7v1Z/rzZjuzYnrwm/owXvevIzJtYvMqn/YqmrmslrUm1TOika4iFWpb0C/bDW0XTCrSyuUSTqGRjR2OThtSTFUREBdOVdOLlFcL0pXLUFSMyxcKiJCJCIyMTIrMUQlLlEjJTEkIiP///9ahjhkAAABAHRSTlP///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AU/cHJQAAAAlwSFlzAAALEwAACxMBAJqcGAAAQnZJREFUeAHs1r9vG2UYB3Bv/gOe11efXucsZGJuZEFCOQ6M0qGqROSahbELY4cuhIWRA6X3++IQWyoiYkCOxQINS5pKKC2dKpW3rtRKFYPPDPdXhOe1fal9rhOGiyDS85ES+77Pe++7vF/JhRPEyhVCSEaZnSCsCLu+LwghC3obTFbkyl6/2yGELOju3WVYkWv93TcjhKyfFFivu2RICPFZoSx2CCHLlAuVP9vLEEIqhcqTs+aEUEV+316GEIIV+Tki/407impF5P/j80YQRWHj5lyIFelFJM9rD0iPUps1a/laTfXO3ukAPxIAIyI543wxu13ljTBo8OrtTEX2QpIfvNhqrWaEqRGshctEDx5FZ+4EZhjeYABGSHLG+WLWWee80eD8amc2xYrcDUh+8GIf9PvdERS9JgNjxADACG4oAKoVtEqqxuSXO/gBq60SYLaCiZEdeeOdmO4FIyiB4ccKzK1Kg6BZAlWbPUGP5VvkHJwvZmF/g6ONfjibYkW6Acm1IirnRicBU4H32k0FVj+xNhUwY1b05PBjBep+jJ9VEx/lSN56KzOa7KRhnhQTbMBQ/VCD1xsEadCSrwMYMyfAFTMgZ+JTQdZ+jfPa/nyGFdn1SX7wjiIjeMUA9I7fTmDt+3DI9G4XbzoOD34Ygu4NGZiHx7IiODr66W8wN+dHk51iMJusji/6h49/fFkqWqcbpAF+7z/EBTMnvP8E3yYSn/q3udvgqOHOhViRbZfkB+/ob0I8d7cTgDV8xGvrujGMGdgDy5U3fDdmAKZ8jEF33RHUM6PJTjcVfQRfyJuvyeYVrdNV0yB93Zg5wXOnCJ/K5kIIzvFfJnawIZ9tYEec2RQrErgk14oYLhoyeYMnFcEH3fP9wD+94f7hQ2zCp/iIIwsXmZmRNd7JSqCkyy1iKN57xV5X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");
});
"""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
