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
            _("This applet is a fork of [Feeds Reader](https://cinnamon-spices.linuxmint.com/applets/view/149) applet by Jason Jackson (a.k.a. jake1164)."),
            "",
            "## %s" % _("Differences with the original applet"),
            "",
            "- %s" % _("Added keyboard shortcut to be able to open/close the menu."),
            "- %s" % _("Added proper keyboard navigation for the menu."),
            "- %s" % _("Eliminated the need of a stylesheet.css file. The menu will be styled respecting the currently used Cinnamon theme."),
            "- %s" % _("Feeds will only be updated from their online sources if the last check was made after the refresh interval."),
            "- %s" % _("Forced the use of Python 3 in all Python modules/scripts."),
            "",
            "## " + _("Dependencies"),
            "- **feedparser:** " +
            _("The feedparser Python 3 module is a universal feed parser that handles RSS 0.9x, RSS 1.0, RSS 2.0, CDF, Atom 0.3, and Atom 1.0 feeds."),
            _("Install with `pip` (Cinnamon needs to be restarted after installing feedparser if the applet was already placed in a panel):"),
            """
```
sudo pip3 install feedparser
```
            """
            "",
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
