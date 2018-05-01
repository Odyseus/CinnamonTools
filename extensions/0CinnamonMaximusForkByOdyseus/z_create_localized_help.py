#!/usr/bin/python3
# -*- coding: utf-8 -*-

import sys
import os

xlet_dir = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))

xlet_slug = os.path.basename(xlet_dir)

repo_folder = os.path.normpath(os.path.join(xlet_dir, *([".."] * 2)))

app_folder = os.path.join(repo_folder, "__app__")

if app_folder not in sys.path:
    sys.path.insert(0, app_folder)


from python_modules.localized_help_creator import LocalizedHelpCreator, _, md


class Main(LocalizedHelpCreator):

    def __init__(self, xlet_dir, xlet_slug):
        super(Main, self).__init__(xlet_dir, xlet_slug)

    def get_content_base(self, for_readme):
        return "\n".join([
            "## %s" % _("Description"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("This extension is a fork of the [Cinnamon Maximus](https://cinnamon-spices.linuxmint.com/extensions/view/29) extension by Fatih Mete. The main difference with the original is that I removed the blacklist feature in favor of a whitelist feature. I also added a couple of options for troubleshooting and completely removed the top border of undecorated maximized windows."),
            "",
            "## %s" % _("Dependencies"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("The **xprop** and **xwininfo** commands needs to be available on the system."),
            "",
            "- %s %s" % (_("Debian based distributions:"),
                         # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                         _("These commands are provided by the **x11-utils** package. Linux Mint already has this package installed.")),
            "- %s %s" % (_("Archlinux based distributions:"),
                         # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                         _("These commands are provided by the **xorg-xprop** and **xorg-xwininfo** packages.")),
            "- %s %s" % (_("Fedora based distributions:"),
                         # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                         _("These commands are provided by the **xorg-x11-utils** package.")),
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
