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
        super().__init__(xlet_dir, xlet_slug)

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
                src="./assets/images/inverted-menu-on-top-panel.png",
                alt=_("Inverted menu on top panel")
            ),
        ]))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
