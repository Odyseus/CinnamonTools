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

    def __init__(self, *args):
        super().__init__(*args)

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
                src="./assets/images/settings-window.png",
                alt=_("Settings window")
            ),
            "",
        ]))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
