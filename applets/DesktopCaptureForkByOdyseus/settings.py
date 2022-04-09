#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys

if sys.version_info < (3, 7):
    msg = r'[1;31m WrongPythonVersion: Minimum Python version supported: 3.7 [0m'
    raise SystemExit(msg)

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, XLET_DIR)

from python_modules.xlets_settings import _
from python_modules.xlets_settings import cli
from python_modules.xlets_settings.builder import Section
from python_modules.xlets_settings.builder import WindowDefinition
from python_modules.xlets_settings.builder import get_debugging_section

XLET_UUID = os.path.basename(XLET_DIR)
XLET_TYPE = os.path.basename(os.path.dirname(XLET_DIR))[:-1]

FILE_FORMAT_TT = _("Format for the generated file name. Possible placeholders are:\n\n%Y = year\n%M = month\n%D = day\n%H = hours\n%I = minutes\n%S = seconds\n%m = milliseconds\n%TYPE = area, window, etc. (for screenshots only).")


def get_save_keybindings_section():
    section = Section("")
    section.add_widget("button", "save_keybindings", {
        "description": _("Save keybindings")
    })
    return section


win_def = WindowDefinition()
general_page = win_def.add_page(_("General"))
general_section = general_page.add_section(_("General"))
general_section.add_widget("iconfilechooser", "applet_icon", {
    "description": _("Normal icon"),
    "tooltip": _("Select an icon to show in the panel.")
})
general_section.add_widget("iconfilechooser", "applet_icon_recording", {
    "description": _("Recording icon"),
    "tooltip": _("Select an icon to show in the panel when screencasting is active.")
})
general_section.add_widget("switch", "display_device_options_in_sub_menu", {
    "description": _("Display menu quick options in a submenu")
})

screenshots_page = win_def.add_page(_("Screenshots"))
screenshots_section = screenshots_page.add_section(_("Screenshots general settings"))
screenshots_section.add_widget("filechooser", "camera_save_dir", {
    "description": _("Save location"),
    "select-dir": True,
    "tooltip": _("Path to a folder to save new screenshots.")
})
screenshots_section.add_widget("entry", "camera_save_prefix", {
    "description": _("File name format"),
    "tooltip": FILE_FORMAT_TT
})

cin_ss_section = screenshots_page.add_section(_("CInnamon's built-in screenshots settings"))
cin_ss_section.add_widget("switch", "timer_display_on_screen", {
    "description": _("Show capture timer"),
    "tooltip": _("Whether to show the timer on the screen.")
})
cin_ss_section.add_widget("switch", "capture_window_as_area", {
    "description": _("Capture windows as area"),
    "tooltip": _("Asking the desktop manager for a screenshot of a window would usually result in a nice image retaining any transparent regions. But depending on the graphics drivers and Cinnamon version it may turn out black or distorted.")
})
cin_ss_section.add_widget("switch", "include_window_frame", {
    "description": _("Include window frame"),
    "tooltip": _("Whether to include the window frame and titlebar in window captures.")
})
cin_ss_section.add_widget("switch", "use_camera_flash", {
    "description": _("Show camera flash"),
    "tooltip": _("Whether to show a bright flash over the capture area.")
})
cin_ss_section.add_widget("switch", "include_styles", {
    "description": _("Include highlight style on screenshot"),
    "tooltip": _("When taking a screenshot of the Cinnamon UI, include the highlight effect in the captured image. The 'desktop-capture-capture-outline-frame' CSS class is the one that style the highlight effect.")
})
cin_ss_section.add_widget("switch", "play_shutter_sound", {
    "description": _("Play shutter sound"),
    "tooltip": _("Whether to play the shutter sound as the capture is made.")
})
cin_ss_section.add_widget("switch", "play_timer_interval_sound", {
    "description": _("Play timer interval sound"),
    "tooltip": _("Whether to play the timer interval sound as the timer counts down.")
})
cin_ss_section.add_widget("switch", "show_copy_toggle", {
    "description": _("Show toggle button for copying image to clipboard"),
    "tooltip": _("Whether to show another toggle button in the menu for copying image to clipboard. If you have notifications enabled you probably don't need this set.")
})
cin_ss_section.add_widget("switch", "auto_copy_data_auto_off", {
    "description": _("Turn off auto copy image data toggle after capture"),
    "tooltip": _("When set, the copy image to clipboard toggle button override will be turned off after a successful capture.")
})

recorder_page = win_def.add_page(_("Recorder"))
recorder_section = recorder_page.add_section(_("Recorder general settings"),
                                             notes=[_("Not all recorder tools may respect these settings.")])
recorder_section.add_widget("combobox", "copy_to_clipboard", {
    "description": _("Copy to clipboard"),
    "tooltip": _("Whether to copy the file path or image data of screenshots to clipboard after capture."),
    "first-option": 0,
    "options": {
        0: _("Off"),
        1: _("File path"),
        2: _("Image data")
    }
})
recorder_section.add_widget("filechooser", "recorder_save_dir", {
    "description": _("Save location"),
    "select-dir": True,
    "tooltip": _("Path to a folder for new screen recordings.")
})
recorder_section.add_widget("entry", "recorder_save_prefix", {
    "description": _("File name format"),
    "tooltip": FILE_FORMAT_TT
})

keybindings_page = win_def.add_page(_("Keybindings"))
keybindings_page.add_section(get_save_keybindings_section())
ss_keybindings_section = keybindings_page.add_section(_("Screenshot keybindings"))
ss_keybindings_section.add_widget("keybinding", "key_camera_window", {
    "description": _("Capture a window")
})
ss_keybindings_section.add_widget("keybinding", "key_camera_area", {
    "description": _("Capture an area")
})
ss_keybindings_section.add_widget("keybinding", "key_camera_cinnamon_ui", {
    "description": _("Capture a Cinnamon UI element"),
    "tooltip": _("Cinnamon only.")
})
ss_keybindings_section.add_widget("keybinding", "key_camera_screen", {
    "description": _("Capture the screen")
})
ss_keybindings_section.add_widget("keybinding", "key_camera_monitor_0", {
    "description": _("Capture monitor 1"),
    "tooltip": _("Cinnamon only.")
})
ss_keybindings_section.add_widget("keybinding", "key_camera_monitor_1", {
    "description": _("Capture monitor 2"),
    "tooltip": _("Cinnamon only.")
})
ss_keybindings_section.add_widget("keybinding", "key_camera_monitor_2", {
    "description": _("Capture monitor 3"),
    "tooltip": _("Cinnamon only.")
})
ss_keybindings_section.add_widget("keybinding", "key_camera_repeat", {
    "description": _("Repeat last capture")
})

rec_keybindings_section = keybindings_page.add_section(_("Recorder keybindings"))
rec_keybindings_section.add_widget("keybinding", "key_recorder_stop_toggle", {
    "description": _("Start/stop recording"),
    "tooltip": _("Will start only Cinnamon Recorder. Will stop any recorder using its stop-command.")
})
rec_keybindings_section.add_widget("keybinding", "key_recorder_repeat", {
    "description": _("Repeat last capture")
})
keybindings_page.add_section(get_save_keybindings_section())

appear_page = win_def.add_page(_("Appearance"))
appear_section = appear_page.add_section(_("Overlay appearance"))
appear_section.add_widget("combobox", "theme_selector", {
    "description": _("Overlay theme"),
    "tooltip": _("These themes are used to style the Cinnamon helpers overlay (area selector, window selector, etc.). The built-in themes can be found in APPLET_FOLDER/themes and can be used as a base to create a custom theme."),
    "first-option": "custom",
    "options": {
        "light": _("Light overlay"),
        "dark": _("Dark overlay"),
        "custom": _("Custom overlay")
    }
})
appear_section.add_widget("filechooser", "theme_custom", {
    "description": _("Path to custom stylesheet"),
    "select-dir": False
})

other_page = win_def.add_page(_("Other"))
other_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
