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
            "",
            utils.get_bootstrap_alert(
                heading=_("Disclaimer"),
                content=md(
                    _("I don't possess any certified knowledge about color vision deficiency nor the science of color. This extension is provided with the hope that it might be useful to persons with a color vision deficiency pathology. The algorithms used to calculate the simulation/compensation effects for the different pathologies are based on scientific researches, theses and blog posts that I came across.")
                    + " " + _("See %s.") % ("**[%s](#xlet-contributors)**" % _("References"))
                )),
            "",
            "## %s" % _("Description"),
            "",
            _("Color Blindness Assistant is a Cinnamon extension that provides tools to assist users with color vision deficiency (CVD)."),
            "",
            utils.get_bootstrap_alert(
                heading=_("Basic references"),
                content=md("\n".join([
                    "- **%s**: %s %s" % (_("Acromatopia (rod monochromatism)"),
                                         _("Total or almost total color blindness."),
                                         "[Wiktionary](https://en.wiktionary.org/wiki/achromatopia)"),
                    "- **%s**: %s %s" % (_("Acromatopia (blue-cone monochromatism)"),
                                         _("Total or almost total color blindness."),
                                         "[Wiktionary](https://en.wiktionary.org/wiki/achromatopia)"),
                    "- **%s**: %s %s" % (_("Protanopia"),
                                         _("First colors (reds) vision deficiency."),
                                         "[Wiktionary](https://en.wiktionary.org/wiki/protanopia)"),
                    "- **%s**: %s %s" % (_("Deuteranopia"),
                                         _("Second colors (greens) vision deficiency."),
                                         "[Wiktionary](https://en.wiktionary.org/wiki/deuteranopia)"),
                    "- **%s**: %s %s" % (_("Tritanopia"),
                                         _("Third colors (blues) vision deficiency."),
                                         "[Wiktionary](https://en.wiktionary.org/wiki/tritanopia)"),
                ])
                )),
            "",
            "## %s" % _("Features"),
            "",
            _("This extension provides mainly three features."),
            "",
            "- **%s**: %s" % (_("Color blindness compensation"),
                              _("A user can apply an effect (specific to her/his pathology) that will (might) help her/him to better differentiate colors.")),
            "- **%s**: %s" % (_("Color blindness simulation"),
                              _("A developer can apply an effect that will show her/him how a person with color vision deficiency will (might) see certain color combinations.")),
            "- **%s**: %s" % (_("Color naming"),
                              _("This feature is useful for knowing the name of the color that's immediately under the cursor.")),
        ])

    def get_content_extra(self):
        return md("{}".format("\n".join([
            "",
            "## %s" % _("Usage"),
            "",
            "- %s" % _("This extension features are accessible entirely through keyboard shortcuts."),
            "- %s" % _("At least two keyboard shortcuts need to be configured to use all features provided by this extension. One to open the color inspector and one to open the daltonizer."),
            "- %s" % _("Additional keyboard shortcuts can be configured to apply specific effects to the screen or the focused window."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _(
                "Window thumbnails generated by the [[Alt]] + [[Tab]] switchers and workspace previews will inherit the effect of the real windows.") + " "
            + _("See %s.") % ("**[%s](#known-issues-{{lhc_lang_id}})**" % _("Known issues")),
            "",
            "## %s" % _("Tools description"),
            "",
            "### %s" % _("Color inspector"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("The heart of this tool is a JavaScript library called **Name that color** that comes with a list of more than 1600 color names. The following information is displayed by this tool:"),
            "",
            "- **%s**: %s" % (_("Color name"),
                              _("It could be an approximation of the input color or an exact match.")),
            "- **%s**: %s" % (_("Input Color"), _(
                "The hexadecimal and RGB representation of the color that's immediately under the mouse cursor.")),
            "- **%s**: %s" % (_("Detected Color"), _(
                "The hexadecimal and RGB representation of the color detected by the **Name that color** library based on the input color.")),
            "- **%s**: %s" % (_("Hue"),
                              _("The name and hexadecimal representation of the input color hue.")),
            "",
            utils.get_image_container(
                src="assets/images/color-inspector-exact-match.png",
                alt=_("Exact color match example.")
            ),
            "</br>",
            utils.get_image_container(
                src="assets/images/color-inspector-approximation.png",
                alt=_("Color approximation example.")
            ),
            "",
            "### %s" % _("Daltonizer"),
            "",
            _("Daltonizer is a tool that allows to apply an effect on-the-fly to a focused window or the screen. An effect can simulate a color vision deficiency or compensate it. The daltonizer UI is composed of the following sections:"),
            "",
            "- **%s**: %s" % (_("Effect Name"),
                              _("The effect to apply to the currently focused actor.")),
            "- **%s**: %s **(*)**" % (_("Actor"),
                                      _("The actor (focused window or screen) to which to apply an effect.")),
            "- **%s**: %s **(*)**" % (_("Color Space"),
                                      _("The color space used to perform the effects calculations.")),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "**(*)** %s" % _("The **Actor** and **Color Space** sections could be hidden from this extension settings window for the following reasons:"),
            ""
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "1. %s" % _("The actor selection mechanism is automatic. One could simply use the **Show desktop** applet to hide all windows and the daltonizer will target the screen to apply an effect. And after applying an effect, one could use again the **Show desktop** applet to display all windows."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "2. %s" % _("As I understand it (like I said, I'm no expert), the color space used to make the calculations depends on the technology used by the monitor/display device. If a user doesn't need to change to the CIE color space, this section could be hidden since the sRGB color space is the color space used by default."),
            "",
            utils.get_image_container(
                src="assets/images/daltonizer-example.png",
                alt=_("Daltonizer example.")
            ),
            "",
            "## %s" % _("GUI theme"),
            "",
            "- %s" % _("This extension supports custom themes to style its GUIs (the color inspector and the daltonizer)."),
            "- %s" % _("The default theme (found in EXTENSION_FOLDER/themes/default.css) only sets a generic styling to accommodate the elements in the GUIs."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("To use a custom theme, just set the **Theme** option to **Custom** and set the **Custom theme path** option to point to a style sheet file."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("To create a custom theme, just make a copy of the default theme file anywhere on the file system, **except** inside the extension folder. The default theme file has the complete list of CSS classes and IDs used by this extension."),
            "- %s" % _("For the custom theme changes to be reflected while the theme file is modified, either Cinnamon can be restarted or the Cinnamon theme can be reloaded."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _(
                "Cinnamon provides a command to reload its theme. Just open the **Run command** dialog ([[Alt]] + [[F2]]), type **rt** and press [[Enter]]."),
            "",
            '<span id="known-issues-{{lhc_lang_id}}"></span>',
            "## %s" % _("Known issues"),
            "",
            "- %s" % _("Thumbnails of windows in the classic application switcher will not inherit the effect of the real windows. This is a limitation of my own; I simply couldn't find the way of doing it."),
            "- %s" % _("Thumbnails of windows generated by applets/extensions/desklets (from third-parties or that come by default with Cinnamon) will not inherit the effect of the real windows. This would be too much of an undertaking for me, the developer of this extension, to accomplish (if possible at all)."),
            "- %s" % _("Windows whose decorations were removed might become invisible when trying to apply any effect. I couldn't find a fix or workaround for this (other than restoring back these windows decorations, that is)."),
            "",
            "## %s" % _("Limitations"),
            "",
            "- %s" % _("All effects applied by this extension are transient. Which means that, whenever a window is closed, Cinnamon is restarted or the system is restarted, all effects will be removed/destroyed."),
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
