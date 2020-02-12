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

    def __init__(self, *args):
        super().__init__(*args)

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
            "- %s" % _("Removed drag&drop capabilities."),
            "- %s" % _("Removed recently installed applications highlighting."),
            "- %s" % _("Added a custom launchers box that can run any command/script/file."),
            "- %s" % _("Custom launchers icons can have a custom size and can be symbolic or full color."),
            "- %s" % _("Custom launchers can execute any command (as entered in a terminal) or a path to a file. If the file is an executable script, an attempt to execute it will be made. Otherwise, the file will be opened with the systems handler for that file type."),
            "- %s" % _("The size of the Categories/Applications icons can be customized."),
            "- %s" % _("The placement of the categories box and the applications box can be swapped."),
            "- %s" % _("The placement of the custom launchers box and the search box can be swapped."),
            "- %s" % _("Scrollbars in the applications box can be hidden."),
            "- %s" % _("Recently used applications can be remembered and will be displayed on a category called **Recently Used**. The applications will be sorted by execution time. The order of these applications can be inverted and there is an option to exclude favorites from being listed."),
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
                src="assets/images/menu-emulating-the-whisker-menu.png",
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


def main():
    m = Main(xlet_dir, xlet_slug)
    return m.start()


if __name__ == "__main__":
    sys.exit(main())
