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


class Main(LocalizedHelpCreator):

    def __init__(self, *args):
        super().__init__(*args)

    def get_content_base(self, for_readme):
        return "\n".join([
            "## %s" % _("Description"),
            "",
            _("Applet based on the gnome-shell extension called [Desk Changer](https://github.com/BigE/desk-changer) by [Eric Gach](https://github.com/BigE). A wallpaper slideshow applet with multiple profiles support."),
            "",
            "## %s" % _("Features"),
            "",
            "- %s" % _("Possibility to create and switch between several profiles. A profile is simply a list of images and/or folders containing images that this applet will use to switch the wallpaper."),
            "- %s" % _("Possibility to preview the next wallpaper from this applet menu."),
            "- %s" % _("Wallpapers can be switched on demand from the controls found in this applet menu."),
            "- %s" % _("The wallpapers rotation can be alphabetically or random."),
            "- %s" % _("The wallpapers rotation can be defined by an interval in seconds or hourly."),
            "- %s" % _("Possibility to open the next or current wallpapers from this applet menu."),
            "- %s" % _("Possibility to display a notification every time the wallpaper is switched."),
            "- %s" % _("Configurable hotkeys to switch to next/previous wallpaper."),
            "- %s" % _("Read the tooltips of each option on this applet settings window for more details."),
        ])

    def get_content_extra(self):
        return md("{}".format("\n".join([
            "## %s" % _("Xlet's settings window"),
            _("From this xlet settings window, all options can be imported, exported and/or reseted to their defaults."),
            "",
            "- %s" % _("To be able to perform any of these actions, the settings schema needs to be installed in the system. This is done automatically when the xlet is installed from the Cinnamon xlets manager. But if the xlet was installed manually, the settings schema also needs to be installed manually. This is achieved by simply going to the xlet folder and launch the following command:"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    - %s %s" % (_("Command to install the settings schema:"),
                             "`./settings.py install-schema`"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    - %s %s" % (_("Command to uninstall the settings schema:"),
                             "`./settings.py remove-schema`"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("To import/export settings, the **dconf** command needs to be available on the system."),
            "",
        ])
        ))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
