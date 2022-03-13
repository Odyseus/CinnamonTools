#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys

xlet_dir = os.getcwd()
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
            _("This applet is based on [Smart Panel](https://cinnamon-spices.linuxmint.com/extensions/view/32) extension and [Show Desktop ++](https://cinnamon-spices.linuxmint.com/applets/view/165) applet, both authored by  **mohammad-sn**. I *mixed* both of them into an applet because there is not always room on the panel to perform the actions added by **Smart Panel**. The **Smart Panel** extension can still be installed and activated at the same time than this applet to have even more desktop actions."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("An intended effect of using this applet is that it includes the features of the **Scale**, **Expo**, **Show desktop** and **Windows Quick List** applets, and partially some of **Workspace switcher** applet features (all applets shipped with Cinnamon by default)."),
            "",
            "## %s" % _("Features"),
            "",
            "- %s **(*)**" % _("The applet icon, label, width (height on vertical panels) can be customized."),
            "- %s" % _("Scroll over applet actions."),
            "    - %s" % _("Adjust opacity of windows"),
            "    - %s" % _("Switch between windows"),
            "    - %s" % _("Switch between workspaces"),
            "    - %s" % _("Toggle Show desktop"),
            "- %s" % _("Hover over applet actions."),
            "    - %s" % _("Desktop Peek"),
            "    - %s" % _("Expo"),
            "    - %s" % _("Launch App Switcher"),
            "    - %s" % _("Overview"),
            "    - %s" % _("Toggle Show desktop"),
            "- %s" % _("Posibility to perform different actions for scrolling up and down."),
            "- %s" % _("Posibility to perform different actions on left and middle click."),
            "- %s" % _("Actions for up/down scroll and/or left/middle clicks."),
            "    - %s" % _("Expo"),
            "    - %s" % _("Launch App Switcher"),
            "    - %s" % _("Overview"),
            "    - %s" % _("Run 1st Custom Command"),
            "    - %s" % _("Run 2nd Custom Command"),
            "    - %s" % _("Run 3rd Custom Command"),
            "    - %s" % _("Run 4rd Custom Command"),
            "    - %s" % _("Show Desktop"),
            "- %s" % _("Posibility to create a windows list menu."),
            "- %s" % _("Left/Middle/Right click on applet can be configured to open the windows list menu."),
            "- %s" % _("Desktop peek functionality with configurable levels of opacity and blur."),
        ])

    def get_content_extra(self):
        return "",
        utils.get_bootstrap_alert(
            heading=md("<strong>(*)</strong> ") + _("Why set a fixed applet width/height?"),
            content=md(
                "\n".join([
                    _("This option is for people that wants to use an instance of this applet at the end of a panel without an icon and without a label (like the button seen on Windows taskbars).")
                ])
            )
        ),

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


def main():
    m = Main(xlet_dir, xlet_slug)
    return m.start()


if __name__ == "__main__":
    sys.exit(main())
