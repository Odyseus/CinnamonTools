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
            _("This extension adds some options to modify the default behavior of certain Cinnamon features."),
        ])

    def get_content_extra(self):
        return md("{}".format("\n".join([
            "## %s" % _("Extension options details"),
            "",
            utils.get_bootstrap_alert(
                context="warning",
                # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                content=_("Some tweaks have warnings, dependencies, limitations and or known issues that must be read and understood before a tweak is enabled. No worries, nothing *fatal* could ever happen.")
            ),
            "",
            "## %s" % _("Table of Content"),
            "",
            "- [%s](#appletsdesklets-tweaks-{{lhc_lang_id}})" % _("Applets/Desklets tweaks"),
            "- [%s](#hot-corners-tweaks-{{lhc_lang_id}})" % _("Hot Corners tweaks"),
            "- [%s](#desktop-area-tweaks-{{lhc_lang_id}})" % _("Desktop area tweaks"),
            "- [%s](#popup-menus-tweaks-{{lhc_lang_id}})" % _("Popup menus tweaks"),
            "- [%s](#tooltips-tweaks-{{lhc_lang_id}})" % _("Tooltips tweaks"),
            "- [%s](#notifications-tweaks-{{lhc_lang_id}})" % _("Notifications tweaks"),
            "- [%s](#window-focus-tweaks-{{lhc_lang_id}})" % _("Window focus tweaks"),
            "- [%s](#window-shadows-tweaks-{{lhc_lang_id}})" % _("Window Shadows tweaks"),
            "- [%s](#auto-move-windows-{{lhc_lang_id}})" % _("Auto move windows"),
            "- [%s](#windows-decorations-removal-{{lhc_lang_id}})" % _(
                "Windows decorations removal"),
            "***",
            '<span id="appletsdesklets-tweaks-{{lhc_lang_id}}"></span>',
            "### %s" % _("Applets/Desklets tweaks"),
            "- **%s** %s" % (_("Ask for confirmation on applet/desklet removal:"), _(
                "Instead of directly remove the applet/desklet from the context menus, it will ask for confirmation. This option doesn't affect the removal of applets/desklets from the Applets/Desklets manager in Cinnamon settings (there will be no confirmation).")),
            "***",
            '<span id="hot-corners-tweaks-{{lhc_lang_id}}"></span>',
            "### %s" % _("Hot Corners tweaks"),
            _("This tweak is only available for Cinnamon versions lower than 3.2. Cinnamon 3.2.x already has hot corners delay activation."),
            "- **%s** %s" % (_("Top left hot corner activation delay:"), _("Crystal clear.")),
            "- **%s** %s" % (_("Top right hot corner activation delay:"), _("Crystal clear.")),
            "- **%s** %s" % (_("Bottom left hot corner activation delay:"), _("Crystal clear.")),
            "- **%s** %s" % (_("Bottom right hot corner activation delay:"), _("Crystal clear.")),
            "***",
            '<span id="desktop-area-tweaks-{{lhc_lang_id}}"></span>',
            "### %s" % _("Desktop area tweaks"),
            "- **%s** %s" % (_("Enable applications drop to the Desktop:"), _(
                "This tweak enables the ability to drag and drop applications from the menu applet and from the panel launchers applet into the desktop.")),
            "***",
            '<span id="popup-menus-tweaks-{{lhc_lang_id}}"></span>',
            "### %s" % _("Popup menus tweaks"),
            "##### %s" % _("Panel menus behavior"),
            "",
            utils.get_bootstrap_alert(
                content=_(
                    "This setting affects only the behavior of menus that belongs to applets placed on any panel.")
            ),
            "",
            "- **%s** %s" % (_("Don't eat clicks:"), _("By default, when one opens an applet's menu on Cinnamon and then click on another applet to open its menu, the first click is used to close the first opened menu, and then another click has to be performed to open the menu of the second applet. With this option enabled, one can directly open the menu of any applet even if another applet has its menu open.")),
            "***",
            '<span id="tooltips-tweaks-{{lhc_lang_id}}"></span>',
            "### %s" % _("Tooltips tweaks"),
            "- **%s:** %s" % (_("Intelligent positioning"), _(
                "It prevents the mouse cursor overlapping the tooltip and also allows to display a tooltip above the mouse cursor if there is no room on the screen to completely show the tooltip below it.")),
            "- **%s:** %s" % (_("Never center tooltip text"), _(
                "Override the centered alignment of tooltips text set by certain Cinnamon themes (all the default ones). With this tweak enabled, the tooltip text will be aligned to the left or right depending on the text direction of the current system language.")),
            "- **%s:** %s" % (_("Restrict tooltips width to half monitor width"),
                              _("Crystal clear.")),
            "- **%s** %s" % (_("Tooltips show delay:"), _("Crystal clear.")),
            "***",
            '<span id="notifications-tweaks-{{lhc_lang_id}}"></span>',
            "### %s" % _("Notifications tweaks"),
            "- **%s** %s" % (_("Enable notifications open/close animation:"), _("Crystal clear.")),
            "- **%s** %s" % (_("Notifications position:"), _(
                "Notifications can be displayed at the top-right of screen (system default) or at the bottom-right of screen.")),
            "- **%s**" % (_("Distance from panel:")),
            "    - **%s** %s" % (_("For notifications displayed at the top-right of screen:"), _(
                "This is the distance between the bottom border of the top panel (if no top panel, from the top of the screen) to the top border of the notification popup.")),
            "    - **%s** %s" % (_("For notifications displayed at the bottom-right of screen:"), _(
                "This is the distance between the top border of the bottom panel (if no bottom panel, from the bottom of the screen) to the bottom border of the notification popup.")),
            "- **%s** %s" % (_("Notification popup right margin:"), _(
                "By default, the right margin of the notification popup is defined by the currently used theme. This option, set to any value other than 0 (zero), allows to set a custom right margin, ignoring the defined by the theme.")),
            "***",
            '<span id="window-focus-tweaks-{{lhc_lang_id}}"></span>',
            "### %s" % _("Window focus tweaks"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("Tweak based on the gnome-shell extension called [Steal My Focus](https://github.com/v-dimitrov/gnome-shell-extension-stealmyfocus) by [Valentin Dimitrov](https://github.com/v-dimitrov) and another gnome-shell extension called [Window Demands Attention Shortcut](https://github.com/awamper/window-demands-attention-shortcut) by [awamper](https://github.com/awamper)."),
            "",
            _("Some windows that demands attention will not gain focus regardless of the settings combination on Cinnamon settings. This option will allow you to correct that."),
            "",
            "- **%s**" % _("The activation of windows demanding attention...:"),
            "    - **%s** %s" % (_("...is handled by the system:"), _("Crystal clear.")),
            "    - **%s** %s" % (_("...is immediate:"),
                                 _("will force windows demanding attention to be focused immediately.")),
            "    - **%s** %s" % (_("...is performed with a keyboard shortcut:"),
                                 _("will focus windows demanding attention with a keyboard shortcut.")),
            "- **%s** %s" % (_("Keyboard shortcut:"),
                             _("Set a keyboard shortcut for the option **...is performed with a keyboard shortcut**.")),
            "***",
            '<span id="window-shadows-tweaks-{{lhc_lang_id}}"></span>',
            "### %s" % _("Window Shadows tweaks"),
            "",
            utils.get_bootstrap_alert(
                content=_(
                    "Client side decorated windows aren't affected by this tweak.")
            ),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("Tweak based on a Cinnamon extension called [Custom Shadows](https://cinnamon-spices.linuxmint.com/extensions/view/43) created by [mikhail-ekzi](https://github.com/mikhail-ekzi). It allows to modify the shadows used by Cinnamon's window manager (Muffin)."),
            "",
            "##### %s" % _("Shadow presets"),
            "- **%s**" % _("Custom shadows"),
            "- **%s**" % _("Default shadows"),
            "- **%s**" % _("No shadows"),
            "- **%s**" % _("Windows 10 shadows"),
            "***",
            '<span id="auto-move-windows-{{lhc_lang_id}}"></span>',
            "### %s" % _("Auto move windows"),
            _("This tweak is composed of two features that work in conjunction:"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "1. **%s:** %s" % (
                _("Auto move application to specific workspaces"),
                _("Tweak based on the gnome-shell extension called [Auto Move Windows](https://extensions.gnome.org/extension/16/auto-move-windows/) by [Florian Muellner](https://github.com/fmuellner). It enables the ability to set rules to open determined applications on specific workspaces.")
            ),
            "2. **%s:** %s" % (
                _("Move full screen applications to their own workspace"),
                _("Tweak based on two gnome-shell extensions; one called [Fullscreen On New Workspace](https://extensions.gnome.org/extension/1502/fullscreen-on-new-workspace) by [Satyajit Ranjeev](https://github.com/satran) and another one called [Maximize To Workspace](https://extensions.gnome.org/extension/1181/maximize-to-workspace) by [rliang](https://github.com/rliang).")
            ),
            "",
            "#### %s" % _("Usage"),
            "",
            "- %s" % _("When an application is opened, it will be moved to the workspace that it is configured to be opened on."),
            "- %s" % _("When an application enters full screen, it will be moved to the first empty workspace (a workspace that has no windows on it). Except when the application is configured to be opened into an specific workspace."),
            "- %s" % _("If an application is not configured to be opened into an specific workspace, and there are no empty workspaces, when the application enters full screen, a new workspace will be created."),
            "- %s" % _("When an application that entered into full screen exits that state, it will be moved back into the workspace from which the application was set to full screen."),
            "- %s" % _("When an application that entered into full screen is closed, the first workspace will be activated."),
            "- %s" % _("If an application needed to create a new workspace, that workspace will be removed when the application exits full screen or is closed, but only if there are no other windows in it."),
            "",
            utils.get_bootstrap_alert(
                content=_("See %s.") % ('<a href="#applications-not-showing-up-{{lhc_lang_id}}">%s</a>' % _(
                    "Applications not showing up on the applications chooser dialogs"))
            ),
            "",
            "***",
            '<span id="windows-decorations-removal-{{lhc_lang_id}}"></span>',
            "### %s" % _("Windows decorations removal"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("Tweak based on the extension called [Cinnamon Maximus](https://cinnamon-spices.linuxmint.com/extensions/view/29) by [Fatih Mete](https://github.com/fatihmete) with some options from the gnome-shell extension called [Maximus NG](https://github.com/luispabon/maximus-gnome-shell) by [Luis Pabon](https://github.com/luispabon). This tweak allows to remove the windows decorations from maximized/half-maximized/tiled windows."),
            "",
            utils.get_bootstrap_alert(
                content=_("See %s.") % ('<a href="#applications-not-showing-up-{{lhc_lang_id}}">%s</a>' % _(
                    "Applications not showing up on the applications chooser dialogs"))
            ),
            "",
            "#### %s" % _("Dependencies"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("This tweak requires two commands available on the system (**xprop** and **xwininfo**) for it to work."),
            "",
            "- %s %s" % (_("Debian based distributions:"),
                         # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                         _("These commands are provided by the **x11-utils** package. Linux Mint already has this package installed.")),
            "- %s %s" % (_("Archlinux based distributions:"),
                         # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                         _("These commands are provided by the **xorg-xprop** and **xorg-xwininfo** packages.")),
            "- %s %s" % (_("Fedora based distributions:"),
                         # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                         _("These commands are provided by the **xorg-x11-utils** package.")),
            "",
            "#### %s" % _("Warnings"),
            "- %s" % _("Client side decorated windows and WINE applications aren't affected by this tweak."),
            "- %s" % _("Close all windows that belongs to an application that is going to be added to the applications list and before applying the settings of this tweak."),
            "- %s" % _("As a general rule to avoid issues, before enabling and configuring this tweak, close all windows currently opened, enable and configure this tweak and then log out and log back in."),
            "",
            "#### %s" % _("Known issues"),
            "- **%s** %s" % (_("Invisible windows:"), _("Sometimes, windows of applications that are configured to remove their decorations can become invisible. The application's icon can still be seen in the panel (taskbar) and when clicked to focus its respective window, the invisible window will block the clicks as if it were visible. To fix this, the window needs to be unmaximized (it will become visible again) and then closed. When reopened, the window should behave normally.")),
            "- **%s** %s" % (_("Applications stuck undecorated:"), _(
                "Some times, an application will get stuck undecorated even after unmaximizing it. Restarting the application will recover its ability to decorate and undecorate itself.")),
            "",
            "#### %s" % _("Alternative"),
            _("There is an alternative way of hiding the title bar of absolutely all maximized windows without exceptions. By editing your Metacity theme (window decorations theme). It works infinitely better and without any of the issues this tweak on this extension has."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("Simply go to `/Path/To/Your/Theme/metacity-1` folder and edit with any text editor the file called **metacity-theme-3.xml**. If that file doesn't exists in your theme, then it should exist one called **metacity-theme-2.xml** or **metacity-theme-1.xml**. Choose the one with the bigger number."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("Find the **frame_geometry** element named **max** (or **maximized** or **normal_max** or **normal_maximized**). Its exact name may vary depending on the theme."),
            "- %s" % _("Basically, one has to set to that element the attribute **has_title** to false, and then set all sizes of all its properties to 0 (zero). Some themes might require to add more properties and set them to 0 (zero) to completely get rid of the title bar."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("Next you will find examples on how to edit the Metacity themes found on the **Mint-X** and **Mint-Y** themes."),
            "",
            "##### %s" % _("For the Metacity theme found on the Mint-X theme"),
            "",
            """```xml
<frame_geometry name="maximized" has_title="false" title_scale="medium" parent="normal" rounded_top_left="false" rounded_top_right="false">
    <distance name="right_width" value="0" />
    <distance name="left_titlebar_edge" value="0"/>
    <distance name="right_titlebar_edge" value="0"/>
    <distance name="title_vertical_pad" value="0"/>
    <border name="title_border" left="0" right="0" top="0" bottom="0"/>
    <border name="button_border" left="0" right="0" top="0" bottom="0"/>
    <distance name="bottom_height" value="0" />
</frame_geometry>
```""",
            "",
            "##### %s" % _("For the Metacity theme found on Mint-Y theme"),
            "",
            """```xml
<frame_geometry name="max" has_title="false" title_scale="medium" parent="normal" rounded_top_left="false" rounded_top_right="false">
    <distance name="right_width" value="0" />
    <distance name="left_titlebar_edge" value="0"/>
    <distance name="right_titlebar_edge" value="0"/>
    <distance name="title_vertical_pad" value="0"/>
    <border name="title_border" left="0" right="0" top="0" bottom="0"/>
    <border name="button_border" left="0" right="0" top="0" bottom="0"/>
    <distance name="bottom_height" value="0" />
    <distance name="button_width" value="0"/>
    <distance name="button_height" value="0"/>
</frame_geometry>
```""",
            "***",
            "## %s" % _("General extension issues"),
            '<span id="applications-not-showing-up-{{lhc_lang_id}}"></span>',

            "### %s" % _("Applications not showing up on the applications chooser dialogs"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("The application chooser dialog used by the settings window of this extension lists only those applications that have available .desktop files. Simply because these applications are the only ones that any of the tweaks that require an application ID (**Auto move windows** and **Windows decorations removal**) will recognize and handle."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("Following the [Desktop Entry Specification](https://specifications.freedesktop.org/desktop-entry-spec/latest/index.html), one can create a .desktop file for any application that doesn't appear in the applications list."),
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
