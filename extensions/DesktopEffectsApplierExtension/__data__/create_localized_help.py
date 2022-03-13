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


class Main(LocalizedHelpCreator):

    def __init__(self, *args):
        super().__init__(*args)

    def get_content_base(self, for_readme):
        return ""

    def get_content_extra(self):
        return md("{}".format("\n".join([
            "## %s" % _("Features"),
            "",
            "- %s" % _("All effects are applied through keyboard shortcuts."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s %s" % (_("All effects applied to windows are inherited by their *clones*. That is, the thumbnails of the windows displayed in [[Alt]] + [[Tab]] window switchers, Expo, etc."),
                         # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                         _("See **Known issues and limitations**.")),
            "",
            "## %s" % _("Known issues and limitations"),
            "",
            "- %s" % _("All effects applied by this extension are transient. Which means that, whenever a window is closed, Cinnamon is restarted or the system is restarted, all effects will be removed/destroyed."),
            "- %s" % _("Thumbnails of windows in the classic application switcher will not inherit the effect of the real windows. This is a limitation of my own; I simply couldn't find the way of doing it."),
            ""
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
