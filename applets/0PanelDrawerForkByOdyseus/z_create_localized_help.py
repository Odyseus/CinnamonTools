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
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("This applet is a fork of [Drawer (show/hide applets)](https://cinnamon-spices.linuxmint.com/applets/view/169) applet by [mohammad-sn](https://github.com/mohammad-sn). Its main purpose is to selectively toggle the visibility of a group of applets inside a panel."),
            "",
            "## %s" % _("Differences with the original applet"),
            "",
            "- %s" % _("Multiple instances of this fork can be placed in any panel (only one instance per panel)."),
            "- %s" % _("This fork supports vertical panels."),
            "",
        ])

    def get_content_extra(self):
        return md("{}".format("\n".join([
            "## %s" % _("Usage"),
            "",
            utils.get_bootstrap_alert(
                context="warning",
                content="<strong>%s</strong>" % md(
                    _("Do not try to hide with this applet the Cinnamon's default System Tray applet (nor any other applet that acts as such). The original Drawer applet handles these types of applets in a very *hacky* way (it sets the size of the tray icons to zero when hiding them and sets them back to a hard-coded size when displaying them). I simply removed that behavior from this fork because I refuse to deal with the mess that the system tray mechanism is in Cinnamon.")
                )
            ),
            "",
            "- %s" % _("The applet does its job when it is placed inside the rigth box of a panel (bottom box for vertical panels). Do not place inside any other panel box."),
            "- %s" % _("All applets that are placed in front of this applet (or on top of it in vertical panels) will be hidden."),
        ])
        ))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


def main():
    m = Main(xlet_dir, xlet_slug)
    return m.start()


if __name__ == "__main__":
    sys.exit(main())
