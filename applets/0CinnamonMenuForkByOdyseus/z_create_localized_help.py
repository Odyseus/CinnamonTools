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
from python_modules.localized_help_creator import utils


class Main(LocalizedHelpCreator):

    def __init__(self, xlet_dir, xlet_slug):
        super(Main, self).__init__(xlet_dir, xlet_slug)

    def get_content_base(self, for_readme):
        return "\n".join([
            "## %s" % _("Description"),
            "",
            _("This applet is a custom version of the default Cinnamon Menu applet, but more customizable and without things irrelevant to searching/launching applications."),
            "",
            "## %s" % _("Options/Features"),
            "",
            "- %s" % _("Implemented fuzzy search."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("Removed **Favorites** box in favor of a **Favorites** category."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("Removed **Places** category."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("Removed **Recent Files** category."),
            "- %s" % _("Removed file system search."),
            "- %s" % _("Removed search providers."),
            "- %s" % _("Removed applications info box in favor of tooltips."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("Removed **All Applications** category in favor of not having it (LOL)."),
            "- %s" % _("Removed drag&drop capabilities."),
            "- %s" % _("Removed recently installed applications highlighting."),
            "- %s" % _("Added a custom launchers box that can run any command/script/file."),
            "- %s" % _("Custom launchers icons can have a custom size and can be symbolic or full color."),
            "- %s" % _("Custom launchers can execute any command (as entered in a terminal) or a path to a file. If the file is an executable script, an attempt to execute it will be made. Otherwise, the file will be opened with the systems handler for that file type."),
            "- %s" % _("The size of the Categories/Applications icons can be customized."),
            "- %s" % _("The placement of the categories box and the applications box can be swapped."),
            "- %s" % _("The placement of the custom launchers box and the search box can be swapped."),
            "- %s" % _("Scrollbars in the applications box can be hidden."),
            "- %s" % _("Recently installed applications highlighting can be disabled."),
            "- %s" % _("Recently used applications can be remembered and will be displayed on a category called **Recent Applications**. The applications will be sorted by execution time. The order of these applications can be inverted and there is an option to exclude favorites from being listed."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("The default **Add to panel**, **Add to desktop** and **Uninstall** context menu items can be hidden."),
            "- %s" % _("The menu editor can be directly opened from this applet context menu without the need to open it from the settings windows of this applet."),
            "- %s" % _("The context menu for applications has 5 new items:"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    - %s" % _("**Run as root:** Executes application as root."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    - %s" % _("**Edit .desktop file:** Open the application's .desktop file with a text editor."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    - %s" % _("**Open .desktop file folder:** Open the folder where the application's .desktop file is stored."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    - %s" % _("**Run from terminal:** Open a terminal and run application from there."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    - %s" % _("**Run from terminal as root:** Same as above but the application is executed as root."),
        ])

    def get_content_extra(self):
        return md("{}".format("\n".join([
            "### %s" % _("Menu emulating the Whisker menu (XFCE)"),
            "",
            utils.get_image_container(
                extra_classes="menu-emulating-the-whisker-menu",
                alt=_("Menu emulating the Whisker menu (XFCE)")
            ),
            "",
            "## %s" % _("Keyboard navigation"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "**%s** %s" % (_("Note:"), _("Almost all keyboard shortcuts on this menu are the same as the original menu. There are just a couple of differences that I was forced to add to my menu to make some of its features to work.")),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("[[Left Arrow]] and [[Right Arrow]] keys:"),
            "    - %s" %
            _("Cycles through the applications box and categories box if the focus is in one of these boxes."),
            "    - %s" %
            _("If the focus is on the custom launchers box, these keys will cycle through this box buttons."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("[[Tab]] key:"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    - %s" %
            _("If the applications box or categories box are currently focused, the [[Tab]] key will switch the focus to the custom launchers box."),
            "    - %s" %
            _("If the focus is on the custom launchers box, the focus will go back to the categories box."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("[[Up Arrow]] and [[Down Arrow]] keys:"),
            "    - %s" % _("If the applications box or categories box are currently focused, these keys will cycle through the items in the currently highlighted box."),
            "    - %s" %
            _("If the focus is on the custom launchers box, the focus will go back to the categories box."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("[[Page Up]] and [[Page Down]] keys: Jumps to the first and last item of the currently selected box. This doesn't affect the custom launchers."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("[[Menu]] or [[Alt]] + [[Enter]] keys: Opens and closes the context menu (if any) of the currently highlighted item."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("[[Enter]] key: Executes the currently highlighted item."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("[[Escape]] key: It closes the main menu. If a context menu is open, it will close the context menu instead and a second tap of this key will close the main menu."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" %
            _("[[Shift]] + [[Enter]]: Executes the application as root. This doesn't affect the custom launchers."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("[[Ctrl]] + [[Enter]]: Open a terminal and run application from there. This doesn't affect the custom launchers."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("[[Ctrl]] + [[Shift]] + [[Enter]]: Open a terminal and run application from there, but the application is executed as root. This doesn't affect the custom launchers."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "## %s" % _("Applications left click extra actions"),
            _("When left clicking an application on the menu, certain key modifiers can be pressed to execute an application in a special way."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("[[Shift]] + **Left click**: Executes application as root."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("[[Ctrl]] + **Left click**: Open a terminal and run application from there."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("[[Ctrl]] + [[Shift]] + **Left click**: Open a terminal and run application from there, but the application is executed as root."),
            "",
            "## %s" % _("About \"Run from terminal\" options"),
            _("These options are meant for debugging purposes (to see the console output after opening/closing a program to detect possible errors, for example). Instead of opening a terminal to launch a program of which one might not know its command, one can do it directly from the menu and in just one step. Options to run from a terminal an application listed on the menu can be found on the applications context menu and can be hidden/shown from this applet settings window."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("By default, these options will use the system's default terminal emulator (**x-terminal-emulator** on Debian based distributions). Any other terminal emulator can be specified inside the settings window of this applet, as long as said emulator has support for the **-e** argument. I did my tests with **gnome-terminal**, **xterm** and **terminator**. Additional arguments could be passed to the terminal emulator, but it's not supported by me."),
            "",
            "## %s" % _("Favorites handling"),
            _("**Note:** The favorites category will update its content after changing to another category and going back to the favorites category."),
            "",
            "## %s" % _("Troubleshooting/extra information"),
            "1. " + _("Run from terminal."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    1. **%s** %s" % (_("Debian based distributions:"),
                                  _("If the command **x-terminal-emulator** doesn't run the terminal emulator that one wants to be the default, run the following command to set a different default terminal emulator.")),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "        - %s" % "`sudo update-alternatives --config x-terminal-emulator`",
            "        - %s" % _("Type in the number of the selection and hit enter."),
            "    2. **%s** %s" %
            (_("For other distributions:"),
             _("Just set the terminal executable of your choice on this applet settings window.")),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "2. %s" % _("There is a folder named **icons** inside this applet directory. It contains several symbolic icons (most of them are from the Faenza icon theme) and each icon can be used directly by name (on a custom launcher, for example)."),
        ])
        ))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return """
Array.prototype.slice.call(document.getElementsByClassName("menu-emulating-the-whisker-menu")).forEach(function(aEl) {
    aEl.setAttribute("src", "data:image/png;base64,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");
});
"""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
