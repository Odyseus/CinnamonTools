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
            _("This applet is based on [Smart Panel](https://cinnamon-spices.linuxmint.com/extensions/view/32) extension and [Show Desktop ++](https://cinnamon-spices.linuxmint.com/applets/view/165) applet, both authored by  **mohammad-sn**. I *mixed* both of them into an applet because there is not always room on the panel to perform the actions added by **Smart Panel**. The **Smart Panel** extension can still be installed and activated at the same time than this applet to have even more desktop actions."),
            "",
            "## %s" % _("Features"),
            "",
            "- %s" % _("The applet icon, background color and width can be customized."),
            "- %s" % _("Scroll over applet actions:"),
            "    - %s" % _("Switch between workspaces"),
            "    - %s" % _("Adjust opacity of windows"),
            "    - %s" % _("Toggle Show desktop"),
            "    - %s" % _("Switch between windows"),
            "- %s" % _("Posibility to perform different actions for scrolling up and down."),
            "- %s" % _("Posibility to perform different actions on left and middle click."),
            "- %s" % _("Actions for up/down scroll and/or left/middle clicks."),
            "    - %s" % _("Expo"),
            "    - %s" % _("Overview"),
            "    - %s" % _("Launch App Switcher"),
            "    - %s" % _("Show Desktop"),
            "    - %s" % _("Run 1st Custom Command"),
            "    - %s" % _("Run 2nd Custom Command"),
            "    - %s" % _("Run 3rd Custom Command"),
            "    - %s" % _("Run 4rd Custom Command"),
            "- %s" % _("Posibility to create a windows list menu."),
            "- %s" % _("Left/Middle/Right click on applet can be configured to open the windows list menu."),
            "- %s" % _("Desktop peek functionality with configurable levels of opacity."),
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
