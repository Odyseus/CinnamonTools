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
from python_modules.xlets_settings.builder import WindowDefinition
from python_modules.xlets_settings.builder import get_debugging_section

XLET_UUID = os.path.basename(XLET_DIR)
XLET_TYPE = os.path.basename(os.path.dirname(XLET_DIR))[:-1]

LISTS_BASIC_INFO_LABELS = [
    "<b>%s:</b> %s" % (
        escape(_("Triggers")),
        escape(
            _("Keyboard shortcuts that will apply an effect to the entire screen or to specific windows."))
    )
]

SHADERS_INFO_LABELS = [
    "<b>%s</b>" % escape(_("Signals connections")),
    "<b>'new-frame':</b> %s" % escape(
        _("When set to a value grater than zero, the `height`, `width`, `mouseX` and `mouseY` uniform values defined on a shader file will be updated every X milliseconds. X being the value set in this option.")),
    "<b>'size-changed':</b> %s" % escape(
        _("When enabled, the `height` and `width` uniform values defined on a shader file will be updated every time an actor (a window or the screen) changes its size."))
]

DESATURATION_INFO_LABELS = [
    "<b>%s:</b> %s" % (escape(_("Desaturation levels")),
                       escape(_("The desaturation factor, with 0.0 being 'do not desaturate' and 1.0 being 'fully desaturate'.")))
]

CONTRAST_INFO_LABELS = [
    "<b>%s:</b> %s" % (escape(_("Color levels")),
                       escape(_("Color component of the change in contrast where 0.0 designates no change.")))
]

BRIGHTNESS_INFO_LABELS = [
    "<b>%s:</b> %s" % (escape(_("Color levels")),
                       escape(_("Color component of the change in brightness where 0.0 designates no change.")))
]

TRIGGER_OPTIONS = {
    "all_windows": _("All windows"),
    "all_non_minimized_windows": _("All non-minimized windows"),
    "all_windows_current_workspace": _("All windows (current workspace)"),
    "all_non_minimized_windows_current_workspace": _("All non-minimized windows (current workspace)"),
    # "all_windows_current_monitor": _("All windows (current monitor)"),
    # "all_non_minimized_windows_current_monitor": _("All non-minimized windows (current monitor)"),
    "focused_window": _("Focused window"),
    "screen": _("Screen"),
}

ALL_TRIGGER_OPTIONS = [{
    "id": "trigger_0",
    "title": _("Trigger 1"),
    "default": "::",
    "type": "keybinding-with-options",
    "options": TRIGGER_OPTIONS
}, {
    "id": "trigger_1",
    "title": _("Trigger 2"),
    "default": "::",
    "type": "keybinding-with-options",
    "options": TRIGGER_OPTIONS
}, {
    "id": "trigger_2",
    "title": _("Trigger 3"),
    "default": "::",
    "type": "keybinding-with-options",
    "options": TRIGGER_OPTIONS
}, {
    "id": "trigger_3",
    "title": _("Trigger 4"),
    "default": "::",
    "type": "keybinding-with-options",
    "options": TRIGGER_OPTIONS
}, {
    "id": "trigger_4",
    "title": _("Trigger 5"),
    "default": "::",
    "type": "keybinding-with-options",
    "options": TRIGGER_OPTIONS
}]

SHADERS_COLUMNS = [{
    "id": "base_name",
    "title": _("Shader"),
    "type": "string",
    "options": {
        "file-patterns": ["*.frag.glsl"],
        "path-in-xlet": "shaders",
        "path-in-setting": "extra_shaders_path",
    }
}, {
    "id": "new_frame_signal",
    "title": "'new-frame'",
    "default": 0,
    "tooltip": _("Connect 'new-frame' signal"),
    "type": "integer",
    "units": _("millisecons"),
    "max": 60000,
    "min": 0,
    "step": 100,
    "page": 1000,
}, {
    "id": "add_size_changed_signal",
    "title": "'size-changed'",
    "default": False,
    "tooltip": _("Connect 'size-changed' signal"),
    "type": "boolean",
}]

DESATURATION_COLUMNS = [{
    "id": "base_name",
    "title": _("Desaturation level"),
    "default": 0.0,
    "type": "float",
    "max": 1.0,
    "min": 0.0,
    "step": 0.01,
    "page": 0.1,
}]

COLORS_COLUMNS = [{
    "id": "base_name",
    "title": _("Color"),
    "default": "rgba(255,255,255,0.5)",
    "type": "color",
    "use-alpha": False
}]

CONTRAST_COLUMNS = [{
    "id": "red",
    "title": _("Red level"),
    "default": 0.0,
    "type": "float",
    "max": 1.0,
    "min": -1.0,
    "step": 0.01,
    "page": 0.1,
}, {
    "id": "green",
    "title": _("Green level"),
    "default": 0.0,
    "type": "float",
    "max": 1.0,
    "min": -1.0,
    "step": 0.01,
    "page": 0.1,
}, {
    "id": "blue",
    "title": _("Blue level"),
    "default": 0.0,
    "type": "float",
    "max": 1.0,
    "min": -1.0,
    "step": 0.01,
    "page": 0.1,
}]

BRIGHTNESS_COLUMNS = [{
    "id": "red",
    "title": _("Red level"),
    "default": 0.0,
    "type": "float",
    "max": 1.0,
    "min": -1.0,
    "step": 0.01,
    "page": 0.1
}, {
    "id": "green",
    "title": _("Green level"),
    "default": 0.0,
    "type": "float",
    "max": 1.0,
    "min": -1.0,
    "step": 0.01,
    "page": 0.1,
}, {
    "id": "blue",
    "title": _("Blue level"),
    "default": 0.0,
    "type": "float",
    "max": 1.0,
    "min": -1.0,
    "step": 0.01,
    "page": 0.1,
}]


KEYBINDINGS_COLUMNS = [{
    "id": "action",
    "title": _("Action"),
    "type": "string",
    "options": {
            "clear_all_windows_effects": "Clear all windows effects",
            "clear_all_windows_effects_current_workspace": "Clear all windows effects (current workspace)",
            # "clear_all_windows_effects_current_monitor": "Clear all windows effects (current monitor)",
            "clear_all_screen_effects": "Clear all screen effects",
            "open_extension_settings": "Open extension settings",
    }
}, {
    "id": "keybinding",
    "title": _("Keybinding"),
    "type": "keybinding",
    "num-bind": 1
}]


win_def = WindowDefinition()
shaders_page = win_def.add_page(_("Shaders"))
shaders_section = shaders_page.add_section(_("Shader effects"))
shaders_section.add_widget("list", "shader_list", {
    "columns": SHADERS_COLUMNS + ALL_TRIGGER_OPTIONS,
    "height": 280,
    "dialog-info-labels": SHADERS_INFO_LABELS + LISTS_BASIC_INFO_LABELS
})
shaders_section.add_widget("filechooser", "extra_shaders_path", {
    "description": _("Extra shaders path"),
    "select-dir": True,
    "default": ""
})

des_page = win_def.add_page(_("Desaturation"))
des_section = des_page.add_section(_("Desaturation effects"))
des_section.add_widget("list", "desaturation_list", {
    "columns": DESATURATION_COLUMNS + ALL_TRIGGER_OPTIONS,
    "height": 300,
    "dialog-info-labels": DESATURATION_INFO_LABELS + LISTS_BASIC_INFO_LABELS
})

colors_page = win_def.add_page(_("Colors"))
colors_section = colors_page.add_section(_("Color effects"))
colors_section.add_widget("list", "color_list", {
    "columns": COLORS_COLUMNS + ALL_TRIGGER_OPTIONS,
    "height": 300,
    "dialog-info-labels": LISTS_BASIC_INFO_LABELS
})

contrast_page = win_def.add_page(_("Contrast"))
contrast_section = contrast_page.add_section(_("Contrast effects"))
contrast_section.add_widget("list", "contrast_list", {
    "columns": CONTRAST_COLUMNS + ALL_TRIGGER_OPTIONS,
    "height": 300,
    "dialog-info-labels": CONTRAST_INFO_LABELS + LISTS_BASIC_INFO_LABELS
})

bright_page = win_def.add_page(_("Brightness"))
bright_section = bright_page.add_section(_("Brightness effects"))
bright_section.add_widget("list", "brightness_list", {
    "columns": BRIGHTNESS_COLUMNS + ALL_TRIGGER_OPTIONS,
    "height": 300,
    "dialog-info-labels": BRIGHTNESS_INFO_LABELS + LISTS_BASIC_INFO_LABELS
})

other_page = win_def.add_page(_("Other"))
other_section = other_page.add_section(_("Global keybindings"))
other_section.add_widget("list", "global_keybindings", {
    "columns": KEYBINDINGS_COLUMNS
})

other_section = other_page.add_section(_("Miscellaneous"))
other_section.add_widget("switch", "apply_cinnamon_injections", {
    "description": _("Windows clones inherit effects"),
    "tooltip": _("Window thumbnails generated by the [[Alt]] + [[Tab]] switchers and workspace previews will inherit the effect of the real windows.")
})

other_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
