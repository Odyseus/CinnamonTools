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
            _("This applet is a fork of [Mailnag](https://cinnamon-spices.linuxmint.com/applets/view/244) applet by [Hasan Yavuz](https://github.com/hyOzd) (a.k.a. hyOzd)."),
            "",
            "## %s" % _("Differences with the original applet"),
            "",
            "- %s" % _("Added keyboard shortcut to be able to open/close the menu."),
            "- %s" % _("Added option to keep just one sub-menu open."),
            "- %s" % _("Removed obsolete code. Mostly features that doesn't exist anymore in modern JavaScript."),
            "",
            "## " + _("Dependencies"),
            "",
            "- **mailnag:** " + \
            _("Mailnag is a daemon program that checks POP3 and IMAP servers for new mail."),
            _("Cinnamon needs to be restarted after installing Mailnag if the applet was already placed in a panel"),
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
