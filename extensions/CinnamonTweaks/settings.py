#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys

if sys.version_info < (3, 7):
    msg = r'[1;31m WrongPythonVersion: Minimum Python version supported: 3.7 [0m'
    raise SystemExit(msg)

from html import escape

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(XLET_DIR)

from python_modules.xlets_settings import _
from python_modules.xlets_settings import cli
from python_modules.xlets_settings.builder import ASTERISK_END
from python_modules.xlets_settings.builder import CINN_RESTART
from python_modules.xlets_settings.builder import CIRCLE
from python_modules.xlets_settings.builder import WindowDefinition
from python_modules.xlets_settings.builder import get_debugging_section

XLET_UUID = os.path.basename(XLET_DIR)
XLET_TYPE = os.path.basename(os.path.dirname(XLET_DIR))[:-1]


WIN_DECORATIONS_SECTION_INFO = "\n".join([
    "%s %s" % (
        CIRCLE,
        escape(_("This tweak settings are purposely NOT applied in real time. Click the »Apply windows decorations settings« button to save settings."))
    ),
    "%s %s" % (
        CIRCLE,
        escape(_("Client side decorated windows and WINE applications aren't affected by this tweak."))
    ),
    "%s %s" % (
        CIRCLE,
        escape(_("Close all windows that belongs to an application that is going to be added to the applications list and before applying the settings of this tweak."))
    ),
    "%s %s" % (
        CIRCLE,
        escape(
            _("Read this extension help for more detailed instructions, list of dependencies and known issues."))
    )
])


LOOKING_GLASS_SECTION_INFO = "\n".join([
    escape(_("Logging to the ~/.cinnamon/glass.log file was removed around Cinnamon 3.8.x in favor of redirecting the output to .xsession-errors. I added back this feature mainly for two reasons.")),
    "%s %s" % (
        CIRCLE,
        escape(_("Melange is an absolute chore to use. Even if I were to get used to its less than optimal behavior (always on top by default, not remembering the current tab when Cinnamon is restarted, etc.), I will never tolerate not being able to log objects without having Melange's interface chocking with them."))
    ),
    "%s %s" % (
        CIRCLE,
        escape(_("I have found some distributions in which the .xsession-errors file doesn't exist. And even if the .xsession-errors file is available, sifting through trillions of logged lines from every single application in the system is more than annoying."))
    ),
])


WINDOWS_AUTO_MOVE_COLUMNS = [{
    "id": "app_id",
    "title": _("Application"),
    "type": "app"
}, {
    "id": "workspace",
    "title": _("Workspace"),
    "type": "integer",
    "min": 1,
    "max": 36,
    "step": 1
}]

CSCT = "%s: %s"

CUSTOM_SHADOWS_COLUMNS = [{
    "id": "win_type",
    "title": _("Window type"),
    "type": "string",
    "options": {
        "f_normal": CSCT % (_("Focused"), _("normal")),
        "f_dialog": CSCT % (_("Focused"), _("dialog")),
        "f_modal_dialog": CSCT % (_("Focused"), _("modal dialog")),
        "f_utility": CSCT % (_("Focused"), _("utility")),
        "f_border": CSCT % (_("Focused"), _("border")),
        "f_menu": CSCT % (_("Focused"), _("menu")),
        "f_popup-menu": CSCT % (_("Focused"), _("popup menu")),
        "f_dropdown-menu": CSCT % (_("Focused"), _("dropdown menu")),
        "f_attached": CSCT % (_("Focused"), _("attached")),
        "u_normal": CSCT % (_("Unfocused"), _("normal")),
        "u_dialog": CSCT % (_("Unfocused"), _("dialog")),
        "u_modal_dialog": CSCT % (_("Unfocused"), _("modal dialog")),
        "u_utility": CSCT % (_("Unfocused"), _("utility")),
        "u_border": CSCT % (_("Unfocused"), _("border")),
        "u_menu": CSCT % (_("Unfocused"), _("menu")),
        "u_popup-menu": CSCT % (_("Unfocused"), _("popup menu")),
        "u_dropdown-menu": CSCT % (_("Unfocused"), _("dropdown menu")),
        "u_attached": CSCT % (_("Unfocused"), _("attached")),
    }
}, {
    "id": "radius",
    "title": _("Radius"),
    "type": "integer",
    "min": 1,
    "max": 255,
    "step": 1
}, {
    "id": "top_fade",
    "title": _("Top fade"),
    "type": "integer",
    "min": -100,
    "max": 100,
    "step": 1
}, {
    "id": "x_offset",
    "title": _("X offset"),
    "type": "integer",
    "min": 0,
    "max": 100,
    "step": 1
}, {
    "id": "y_offset",
    "title": _("Y offset"),
    "type": "integer",
    "min": 0,
    "max": 100,
    "step": 1
}, {
    "id": "opacity",
    "title": _("Opacity"),
    "type": "integer",
    "min": 0,
    "max": 255,
    "step": 1
}]


win_def = WindowDefinition()
desktop_page = win_def.add_page(_("Desktop"))
desktop_section = desktop_page.add_section(_("Desktop area tweaks"), notes=[CINN_RESTART])
desktop_section.add_widget("switch", "desktop_tweaks_enabled", {
    "description": _("Enable Desktop area tweaks") + ASTERISK_END
})
desktop_section.add_widget("switch", "desktop_tweaks_allow_drop_to_desktop", {
    "description": _("Enable applications drop to the Desktop") + ASTERISK_END,
    "dependency": "desktop_tweaks_enabled",
    "tooltip": _("With this option enabled, applications can be dragged from the menu applet and from the panel launchers applet and dropped into the desktop.")
})

tt_page = win_def.add_page(_("Tooltips"))
tt_section = tt_page.add_section(_("Tooltips tweaks"), notes=[CINN_RESTART])
tt_section.add_widget("switch", "tooltips_tweaks_enabled", {
    "description": _("Enable Tooltips tweaks") + ASTERISK_END
})
tt_section.add_widget("switch", "tooltips_inteligent_positioning", {
    "description": _("Inteligent positioning") + ASTERISK_END,
    "dependency": "tooltips_tweaks_enabled",
    "tooltip": _("Tooltips on Cinnamon's UI are positioned always at the bottom of the mouse cursor; no matter if there is room to display the entire tooltip. This results in cut off tooltips. With this tweak enabled, if there is no room to display the entire tooltip below the mouse cursor, the tooltip will be displayed above the mouse cursor.")
})
tt_section.add_widget("switch", "tooltips_never_centered", {
    "description": _("Never center tooltip text") + ASTERISK_END,
    "dependency": "tooltips_tweaks_enabled",
    "tooltip": _("Override the centered alignment of tooltips text set by certain Cinnamon themes (all the default ones). With this tweak enabled, the tooltip text will be aligned to the left or right depending on the text direction of the current system language.")
})
tt_section.add_widget("switch", "tooltips_half_monitor_width", {
    "description": _("Restrict tooltips width to half monitor width") + ASTERISK_END,
    "dependency": "tooltips_tweaks_enabled"
})
tt_section.add_widget("spinbutton", "tooltips_delay", {
    "description": _("Tooltips show delay") + ASTERISK_END,
    "dependency": "tooltips_tweaks_enabled",
    "tooltip": _("Set a delay in milliseconds to display Cinnamon's UI tooltips."),
    "min": 100,
    "max": 1000,
    "step": 50,
    "units": _("milliseconds")
})

popup_page = win_def.add_page(_("Popup menus"))
popup_section = popup_page.add_section(_("Popup menus tweaks"), notes=[CINN_RESTART])
popup_section.add_widget("switch", "popup_menu_manager_tweaks_enabled", {
    "description": _("Enable Popup menus tweaks") + ASTERISK_END
})
popup_section.add_widget("combobox", "popup_menu_manager_applets_menus_behavior", {
    "description": _("Panel menus behavior") + ASTERISK_END,
    "dependency": "popup_menu_manager_tweaks_enabled",
    "tooltip": _("This setting affects only the behavior of menus that belongs to applets placed on any panel.\n\nDon't eat clicks: By default, when one opens an applet's menu on Cinnamon and then click on another applet to open its menu, the first click is used to close the first opened menu, and then another click has to be performed to open the menu of the second applet. With this option enabled, one can directly open the menu of any applet even if another applet has its menu open."),
    "options": {
        "default": _("Default behavior"),
        "do-not-eat": _("Don't \"eat\" clicks")
    }
})

win_page = win_def.add_page(_("Windows"))
win_section = win_page.add_section(_("Window focus tweaks"))
win_section.add_widget("switch", "windows_focus_enable_tweaks", {
    "description": _("Enable windows focus tweaks")
})
win_section.add_widget("combobox", "win_demands_attention_activation_mode", {
    "description": _("The activation of windows demanding attention..."),
    "dependency": "windows_focus_enable_tweaks",
    "options": {
        "none": _("...is handled by the system"),
        "force": _("...is immediate"),
        "hotkey": _("...is performed with a keyboard shortcut")
    }
})
win_section.add_widget("keybinding", "win_demands_attention_keyboard_shortcut", {
    "description": _("Activate window demanding attention"),
    "dependency": "windows_focus_enable_tweaks",
    "num-bind": 1
})

win_section = win_page.add_section(_("Window shadows tweaks"), info={
    "context": "warning",
    "message": _("Client side decorated windows aren't affected by this tweak.")
})
win_section.add_widget("switch", "window_shadows_tweaks_enabled", {
    "description": _("Enable window shadows tweaks"),
    "tooltip": _("This tweak allows us to customize the shadow of all windows.")
})
win_section.add_widget("combobox", "window_shadows_preset", {
    "description": _("Shadow presets"),
    "dependency": "window_shadows_tweaks_enabled",
    "options": {
        "custom": _("Custom shadows"),
        "default": _("Default shadows"),
        "no_shadows": _("No shadows"),
        "windows_10": _("Windows 10 shadows")
    }
})
win_section.add_widget("list", "window_shadows_custom_preset", {
    "columns": CUSTOM_SHADOWS_COLUMNS,
    "dependency": [
        "window_shadows_preset=custom",
        "window_shadows_tweaks_enabled"
    ],
    "immutable": {
        "read-only-keys": ["win_type"]
    },
    "height": 300,
    "move-buttons": False
})

win_section = win_page.add_section(_("Auto move windows"), info={
    "context": "warning",
    "message": _("Not all applications can be assigned to be moved. Most applications which can open multiple instances of themselves most likely cannot be configured to be automatically moved.")
})
win_section.add_widget("switch", "window_auto_move_tweaks_enabled", {
    "description": _("Enable auto move windows tweak"),
    "tooltip": _("This tweak enables the ability to set rules to open determined applications on specific workspaces.")
})
win_section.add_widget("switch", "window_auto_move_auto_focus", {
    "description": _("Automatically switch to moved application's workspace"),
    "dependency": "window_auto_move_tweaks_enabled"
})
win_section.add_widget("switch", "window_auto_move_fullscreen_in_own_ws", {
    "description": _("Move full screen applications to their own workspace"),
    "dependency": "window_auto_move_tweaks_enabled"
})
win_section.add_widget("applist", "window_auto_move_fullscreen_in_own_ws_blacklist", {
    "description": _("Full screen applications blacklist"),
    "dependency": "window_auto_move_tweaks_enabled",
    "tooltip": _("Applications that should not be moved to a new workspace when they enter in full screen.")
})
win_section.add_widget("list", "window_auto_move_application_list", {
    "columns": WINDOWS_AUTO_MOVE_COLUMNS,
    "dependency": "window_auto_move_tweaks_enabled"
})

win_section = win_page.add_section(_("Windows decorations removal"), info={
    "context": "warning",
    "message": WIN_DECORATIONS_SECTION_INFO
})
win_section.add_widget("button", "maximus_apply_settings", {
    "description": _("Apply windows decorations settings")
})
win_section.add_widget("switch", "maximus_enabled", {
    "description": _("Enable maximized windows decoration removal")
})
win_section.add_widget("switch", "maximus_undecorate_half_maximized", {
    "description": _("Undecorate half-maximized windows?"),
    "dependency": "maximus_enabled"
})
win_section.add_widget("switch", "maximus_undecorate_tiled", {
    "description": _("Undecorate tiled windows?"),
    "dependency": "maximus_enabled"
})
win_section.add_widget("switch", "maximus_is_blacklist", {
    "description": _("Applications list is a blacklist?"),
    "dependency": "maximus_enabled",
    "tooltip": _("If enabled, all applications will have their window decorations removed, except those listed in the list of applications.\n\nIf disabled, only the application from the list of applications will have their decorations removed.")
})
win_section.add_widget("switch", "maximus_invisible_windows_hack", {
    "description": _("Enable hack for invisible windows"),
    "dependency": "maximus_enabled",
    "tooltip": _("On Cinnamon 3.4 or greater, the windows of the applications configured so that their decorations are removed when maximized, may become invisible. Enabling this option might prevent that, but it might also add a border of about 1 pixel in place of the title bar (it might depend on the metacity theme (Window borders) used).")
})
win_section.add_widget("switch", "maximus_enable_logging", {
    "description": _("Enable logging"),
    "dependency": "maximus_enabled",
    "tooltip": _("For debugging purposes only.")
})
win_section.add_widget("applist", "maximus_app_list", {
    "description": _("Edit applications list"),
    "dependency": "maximus_enabled"
})

misc_page = win_def.add_page(_("Miscellaneous"))
misc_section = misc_page.add_section(_("Looking Glass"), info={
    "message": LOOKING_GLASS_SECTION_INFO
})
misc_section.add_widget("switch", "restore_logging_to_glass_log_file", {
    "description": _("Restore logging to glass.log file"),
    "tooltip": _("Originally, this file was located at ~/.cinnamon/glass.log. I changed its location to ~/.local/share/cinnamon/logs/glass.log.")
})

other_page = win_def.add_page(_("Other"))
other_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
