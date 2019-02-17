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


class Main(LocalizedHelpCreator):

    def __init__(self, *args):
        super().__init__(*args)

    def get_content_base(self, for_readme):
        return "\n".join([
            "## %s" % _("Description"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("This applet is a fork of [System Monitor](https://cinnamon-spices.linuxmint.com/applets/view/88) applet by Josef Michálek (a.k.a. Orcus)."),
            "",
            "## %s" % _("Differences with the original applet"),
            "",
            "- %s" % _("Added keyboard shortcut to be able to launch a custom command."),
            "- %s" % _("Added option to hide the graphs background, not just set it transparent."),
            "",
            "## " + _("Dependencies"),
            "- **GTop:** " +
            _("The gtop library reads information about processes and the state of the system."),
            "    - **%s** %s" % (_("Debian based distributions:"),
                                 # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                                 _("The package is called **gir1.2-gtop-2.0**.")),
            "    - **%s** %s" % (_("Archlinux based distributions:"),
                                 # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                                 _("The package is called **libgtop**.")),
            "    - **%s** %s" % (_("Fedora based distributions:"),
                                 # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                                 _("The package is called **libgtop2**.")),
            "",
            "**%s**" % _("Restart Cinnamon after installing the packages for the applet to recognize them."),
        ])

    def get_content_extra(self):
        return ""

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
