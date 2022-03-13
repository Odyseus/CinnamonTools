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
            _("The function of this applet is very simple, create a menu based on the files/folders found inside a main folder (specified on this applet settings window). The files will be used to create menu items and the sub folders will be used to create sub-menus."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("I mainly created this applet to replicate the functionality of the XFCE plugin called **Directory Menu** and the KDE widget called **Quick access**."),
            "",
            utils.get_bootstrap_alert(
                context="danger",
                heading=_("Danger"),
                content=_("This applet has to read every single file/folder inside a main folder to create its menu. So, do not try to use this applet to create a menu based on a folder that contains thousands of files!!! Your system may slow down, freeze or even crash!!!")
            ),
            "",
            "## %s" % _("Features"),
            "",
            "- %s" % _("More than one instance of this applet can be installed at the same time."),
            "- %s" % _("A hotkey can be assigned to open/close the menu."),
            "- %s" % _("Menu items to .desktop files will be displayed with the icon and name declared inside the .desktop files themselves."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _(
                "The menu can be kept open while activating menu items by pressing [[Ctrl]] + **Left click** or with **Middle click**."),
            "- %s" % _("This applet can create menu and sub-menu items even from symbolic links found inside the main folder."),
            "",
        ])

    def get_content_extra(self):
        return md("{}".format("\n".join([
            "### %s" % _("Image featuring different icons for each sub-menu and different icon sizes"),
            "",
            utils.get_image_container(
                src="./assets/images/image-featuring-different-icons-each-sub-menu-and-different-icon-sizes.png",
                alt=_("Image featuring different icons for each sub-menu and different icon sizes")
            ),
            "",
            "## %s" % _("Applet usage"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("After placing a new instance of **Quick Menu** into a panel, an existing directory needs to be chosen for it to create a menu structure with."),
            "- %s" % _("Applications can also be dragged (from Cinnamon menu or any other menu based on it) and dropped into this applet in the panel for quick item creation. This operation makes a copy of the application's .desktop file into the directory configured to be used by this applet."),
            "- %s" % _("Menu items created from .desktop files will be displayed with the icon and name declared inside the .desktop files themselves."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _(
                "Menu items created from .desktop files have a context menu (opened with **Right click** or with the [[Menu]] key). From their context menu one has direct access to edit the .desktop file and also to actions provided by them if any."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _(
                "The menu can be kept open while activating menu items by pressing [[Ctrl]] + **Left click** or with **Middle click**."),
            "",
            "## %s" % _("How to set a different icon for each sub-menu"),
            "",
            "- %s" %
            _("Create a file named .directory inside the folders that will be used to create the sub-menus."),
            "- %s" % _("The content of the .directory file should be exactly as follows."),
            "",
            """```
[Desktop Entry]
Type=Application
Icon=icon name or absolute path to an icon file
```""",
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("The path to the icon has to be a valid icon name or a full path."),
            "",
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
