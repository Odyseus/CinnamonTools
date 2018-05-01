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
            _("This applet is a fork of [System Monitor](https://cinnamon-spices.linuxmint.com/applets/view/88) applet by Josef Michálek (a.k.a. Orcus)."),
            "",
            "## %s" % _("Differences with the original applet"),
            "",
            "**%s**" % ("This applet is not compatible with vertical panels!"),
            "",
            "- %s" % _("This applet uses Cinnamon's native settings system instead of an external library (gjs)."),
            "- %s" % _("I added an option to use a custom command on applet click."),
            "- %s" % _("I added an option to set a custom width for each graph individually."),
            "- %s" % _("I added an option to align this applet tooltip text to the left."),
            "- %s" % _("Removed NetworkManager dependency."),
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
                                 _("The package is called **libgtop2-devel**.")),
            "- **NetworkManager:** " +
            _("NetworkManager is a system network service that manages your network devices and connections, attempting to keep active network connectivity when available."),
            "    - **%s** %s" % (_("Debian based distributions:"),
                                 # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                                 _("The package is called **gir1.2-networkmanager-1.0**.")),
            "    - **%s** %s" % (_("Archlinux based distributions:"),
                                 # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                                 _("The package is called **networkmanager**.")),
            "    - **%s** %s" % (_("Fedora based distributions:"),
                                 # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                                 _("The package is called **NetworkManager**.")),
            "",
            "**%s** %s" % (_("Important note:"),
                           # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                           _("NetworkManager is only used if the **GTop** library version installed on a system is < **2.32** and doesn't support certain library calls. So, basically, if the network graph on this applet works without having installed NetworkManager, then you don't need to install it.")),
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
