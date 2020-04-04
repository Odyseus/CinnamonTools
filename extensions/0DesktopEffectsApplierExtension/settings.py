#!/usr/bin/python3
# -*- coding: utf-8 -*-
import os
import sys

from html import escape

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
modules_dir = os.path.join(XLET_DIR)
sys.path.append(modules_dir)

from python_modules.xlets_settings import _
from python_modules.xlets_settings import cli

CINN_RESTART = "(*) <i>%s</i>" % escape(_("Cinnamon needs to be restarted"))

LOGGING_LEVEL_TOOLTIP = "\n".join([
    _("It enables the ability to log the output of several functions used by the extension."),
    "",
    "%s: %s" % (_("Normal"), _("Only log messages caused by non critical errors.")),
    "%s: %s" % (_("Verbose"), _("Additionally log extra output messages and all HTTP responses.")),
    "%s: %s" % (_("Very verbose"), _(
        "Additionally log all method calls from all JavaScript classes/prototypes along with their execution time."))
])

INFO_LABELS = [
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
    "options-from-paths": {
        "file-patterns": ["*.shader.glsl"],
        "path-in-xlet": "shaders",
        "path-in-setting": "pref_extra_shaders_path",
    }
}, {
    "id": "new_frame_signal",
    "title": "'new-frame'",
    "default": 0,
    "tooltip": _("Connect 'new-frame' signal"),
    "type": "integer",
    "units": "millisecons",
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


SHADERS_TAB = {
    "page-title": _("Shaders"),
    "page-icon": "custom-shader-symbolic",
    "sections": [{
        "section-title": _("Shader effects"),
        "widgets": [{
            "widget-type": "list",
            "widget-attrs": {
                "pref_key": "pref_shader_list",
                "apply_key": "trigger_shader_list_changed",
                "imp_exp_path_key": "pref_imp_exp_last_selected_directory"
            },
            "widget-kwargs": {
                "columns": SHADERS_COLUMNS + ALL_TRIGGER_OPTIONS,
                "height": 280,
                "dialog-info-labels": SHADERS_INFO_LABELS + INFO_LABELS
            }
        }, {
            "widget-type": "filechooser",
            "widget-attrs": {
                "pref_key": "pref_extra_shaders_path"
            },
            "widget-kwargs": {
                "description": "Extra shaders path",
                "select-dir": True,
                "default": ""
            }
        }]
    }]
}

DESATURATION_TAB = {
    "page-title": _("Desaturation"),
    "page-icon": "custom-desaturation-symbolic",
    "sections": [{
        "section-title": _("Desaturation effects"),
        "widgets": [{
            "widget-type": "list",
            "widget-attrs": {
                "pref_key": "pref_desaturation_list",
                "apply_key": "trigger_desaturation_list_changed",
                "imp_exp_path_key": "pref_imp_exp_last_selected_directory"
            },
            "widget-kwargs": {
                "columns": DESATURATION_COLUMNS + ALL_TRIGGER_OPTIONS,
                "height": 300,
                "dialog-info-labels": DESATURATION_INFO_LABELS + INFO_LABELS
            }
        }]
    }]
}

COLORS_TAB = {
    "page-title": _("Colors"),
    "page-icon": "custom-color-symbolic",
    "sections": [{
        "section-title": _("Color effects"),
        "widgets": [{
            "widget-type": "list",
            "widget-attrs": {
                "pref_key": "pref_color_list",
                "apply_key": "trigger_color_list_changed",
                "imp_exp_path_key": "pref_imp_exp_last_selected_directory"
            },
            "widget-kwargs": {
                "columns": COLORS_COLUMNS + ALL_TRIGGER_OPTIONS,
                "height": 300,
                "dialog-info-labels": INFO_LABELS
            }
        }]
    }]
}

CONTRAST_TAB = {
    "page-title": _("Contrast"),
    "page-icon": "custom-contrast-symbolic",
    "sections": [{
        "section-title": _("Contrast effects"),
        "widgets": [{
            "widget-type": "list",
            "widget-attrs": {
                "pref_key": "pref_contrast_list",
                "apply_key": "trigger_contrast_list_changed",
                "imp_exp_path_key": "pref_imp_exp_last_selected_directory"
            },
            "widget-kwargs": {
                "columns": CONTRAST_COLUMNS + ALL_TRIGGER_OPTIONS,
                "height": 300,
                "dialog-info-labels": CONTRAST_INFO_LABELS + INFO_LABELS
            }
        }]
    }]
}

BRIGHTNESS_TAB = {
    "page-title": _("Brightness"),
    "page-icon": "custom-brightness-symbolic",
    "sections": [{
        "section-title": _("Brightness effects"),
        "widgets": [{
            "widget-type": "list",
            "widget-attrs": {
                "pref_key": "pref_brightness_list",
                "apply_key": "trigger_brightness_list_changed",
                "imp_exp_path_key": "pref_imp_exp_last_selected_directory"
            },
            "widget-kwargs": {
                "columns": BRIGHTNESS_COLUMNS + ALL_TRIGGER_OPTIONS,
                "height": 300,
                "dialog-info-labels": BRIGHTNESS_INFO_LABELS + INFO_LABELS
            }
        }]
    }]
}


OTHER_TAB = {
    "page-title": _("Other"),
    "page-icon": "system-run-symbolic",
    "sections": [{
        "section-title": _("Global keybindings"),
        "widgets": [{
            "widget-type": "list",
            "widget-attrs": {
                "pref_key": "pref_global_keybindings",
                "apply_key": "trigger_global_keybindings_changed",
                "imp_exp_path_key": "pref_imp_exp_last_selected_directory"
            },
            "widget-kwargs": {
                "columns": KEYBINDINGS_COLUMNS
            }
        }]
    }, {
        "section-title": _("Miscellaneous"),
        "widgets": [{
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_apply_cinnamon_injections"
            },
            "widget-kwargs": {
                "description": _("Windows clones inherit effects"),
                "tooltip": _("Window thumbnails generated by the [[Alt]] + [[Tab]] switchers and workspace previews will inherit the effect of the real windows.")
            }
        }]
    }, {
        "section-title": _("Debugging"),
        "section-notes": [CINN_RESTART],
        "widgets": [{
            "widget-type": "gcombobox",
            "widget-attrs": {
                "pref_key": "pref-logging-level",
                "schema": "org.cinnamon.{{XLET_TYPE}}s.{{UUID}}"
            },
            "widget-kwargs": {
                "description": "%s (*)" % _("Logging level"),
                "tooltip": LOGGING_LEVEL_TOOLTIP,
                "options": {
                    0: _("Normal"),
                    1: _("Verbose"),
                    2: _("Very verbose")
                }
            }
        }, {
            "widget-type": "gswitch",
            "widget-attrs": {
                "pref_key": "pref-debugger-enabled",
                "schema": "org.cinnamon.{{XLET_TYPE}}s.{{UUID}}"
            },
            "widget-kwargs": {
                "description": "%s (*)" % _("Enable debugger"),
                "tooltip": _("It enables the ability to catch all exceptions that under normal use would not be caught.")
            }
        }]
    }]
}

PAGES_DEFINITION = [
    SHADERS_TAB,
    DESATURATION_TAB,
    COLORS_TAB,
    CONTRAST_TAB,
    BRIGHTNESS_TAB,
    OTHER_TAB,
]


if __name__ == "__main__":
    # NOTE: I extend sys.argv for extensions so I can call the settings.py script without arguments.
    sys.argv.extend(("--xlet-uuid={{UUID}}",
                     "--app-id=org.Cinnamon.Extensions.DesktopEffectsApplier.Settings"))
    sys.exit(cli(PAGES_DEFINITION))
