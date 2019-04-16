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
            _("Color Blindness Assistant is a Cinnamon extension that provides tools to assist users with color vision deficiency (CVD)."),
            "",
            "## %s" % _("Features"),
            "",
            _("This extension provides mainly of three features."),
            "",
            "- **%s**: %s" % (_("Color blindness compensation"),
                              _("A user can apply an effect (specific to her/his pathology) that will (might) help her/him to better differentiate colors.")),
            "- **%s**: %s" % (_("Color blindness simulation"),
                              _("A developer can apply an effect that will show her/him how a person with color vision deficiency will (might) see certain color combinations.")),
            "- **%s**: %s" % (_("Color naming"),
                              _("This feature is useful for knowing the name of the color that's immediately under the cursor.")),
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
