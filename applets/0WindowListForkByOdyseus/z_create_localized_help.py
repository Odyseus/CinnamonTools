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
            _("This applet is a fork of the default Window list applet shipped with Cinnamon."),
            "",
            "## %s" % _("Differences with the original applet"),
            "",
            "- %s" % _("Added option to remove the label from the window list buttons."),
            "- %s" % _("Added option to remove the tooltips from the window list buttons."),
            "- %s" % _("Added icons to the window list button's context menu."),
            "- %s" % _("Added option to invert the contex menu items."),
            "- %s" % _("Added option to hide/move the **Preferences** sub menu."),
        ])

    def get_content_extra(self):
        return md("\n".join([
            "## %s" % _("Inverted menu on top panel"),
            "",
            utils.get_image_container(
                extra_classes="inverted-menu-on-top-panel",
                alt=_("Inverted menu on top panel")
            ),
        ]))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return """
Array.prototype.slice.call(document.getElementsByClassName("inverted-menu-on-top-panel")).forEach(function(aEl) {
    aEl.setAttribute("src", "data:image/png;base64,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");
});
"""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
