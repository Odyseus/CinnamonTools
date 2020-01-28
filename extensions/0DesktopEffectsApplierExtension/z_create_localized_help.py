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
            "",
            "## %s" % _("Custom xlet settings system"),
            "",
            _("This xlet uses a custom application to handle its settings. Cinnamon's native settings system handles external applications for xlets settings in a very limited way. To work around these limitations, I put in place different mechanisms depending on the xlet type."),
            "",
            "- **%s:** %s" % (
                _("Applets"),
                # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                _("The **Configure...** context menu item is overridden so it opens the proper settings application.")
            ),
            "- **%s:** %s" % (
                _("Extensions"),
                # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                _("A shortcut (a .desktop file) to open the proper settings application is automatically generated upon enabling the extension and it is removed when the extension is disabled. The .desktop file is created at **~/.local/share/applications**, so it will make the shortcut available in your applications menu inside the **Preferences** category.")
            ),
            "- **%s:** %s" % (
                _("For all xlets types"),
                # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                _("If the *wrong* settings window is opened, a button to open the *right* settings window will be available.")
            ),
            ""
        ])
        ))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
