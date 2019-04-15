#!/usr/bin/python3
# -*- coding: utf-8 -*-
import cgi
import fnmatch
import gi
import json
import os

gi.require_version("Gtk", "3.0")
gi.require_version("Gdk", "3.0")

from gi.repository import Gdk
from gi.repository import Gtk
from gi.repository import Pango

from .SettingsWidgets import ColorChooser
from .SettingsWidgets import ComboBox
from .SettingsWidgets import Entry
from .SettingsWidgets import FileChooser
from .SettingsWidgets import IconChooser
from .SettingsWidgets import Keybinding
from .SettingsWidgets import KeybindingWithOptions
from .SettingsWidgets import SettingsLabel
from .SettingsWidgets import SettingsWidget
from .SettingsWidgets import SpinButton
from .SettingsWidgets import Switch
from .SettingsWidgets import _
from .common import BaseGrid
from .common import generate_options_from_paths
# from SettingsWidgets import SoundFileChooser

WIDGET_VARIABLE_TYPE_MAP = {
    "boolean": bool,
    "file": str,
    "float": float,
    "icon": str,
    "integer": int,
    "keybinding": str,
    "keybinding-with-options": str,
    "sound": str,
    "string": str,
    "color": str,
}

WIDGET_CLASS_TYPE_MAP = {
    "boolean": Switch,
    "icon": IconChooser,
    "string": Entry,
    "file": FileChooser,
    "float": SpinButton,
    "integer": SpinButton,
    "keybinding": Keybinding,
    "keybinding-with-options": KeybindingWithOptions,
    # "sound": SoundFileChooser,
    "color": ColorChooser,
}

WIDGET_PROPERTIES_MAP = {
    "expand-width": "expand_width",
    "max": "maxi",
    "min": "mini",
    "select-dir": "dir_select",
    "step": "step",
    "title": "label",
    "units": "units",
    "tooltip": "tooltip",
    # NOTE: Expose the number of keybindings to create for a "keybinding" widget.
    "num-bind": "num_bind",
}


def secondary_widget_factory(widget_def, xlet_settings):
    kwargs = {}

    if "options-from-paths" in widget_def:
        widget_def["options"] = generate_options_from_paths(
            widget_def["options-from-paths"], xlet_settings)

    if "options" in widget_def:
        kwargs["valtype"] = WIDGET_VARIABLE_TYPE_MAP[widget_def["type"]]

        if widget_def["type"] == "keybinding-with-options":
            widget_type = KeybindingWithOptions
        else:
            widget_type = ComboBox

        options_list = widget_def["options"]

        if isinstance(options_list, dict):
            kwargs["options"] = sorted([(a, b) for a, b in options_list.items()])
        else:
            kwargs["options"] = zip(options_list, options_list)
    else:
        widget_type = WIDGET_CLASS_TYPE_MAP[widget_def["type"]]

    class Widget(widget_type):
        def __init__(self, **kwargs):
            super().__init__(**kwargs)

            if self.bind_dir is None:
                self.connect_widget_handlers()

        def get_range(self):
            return None

        def set_value(self, value):
            self.widget_value = value

        def get_value(self):
            if hasattr(self, "widget_value"):
                return self.widget_value
            else:
                return None

        def set_widget_value(self, value):
            if self.bind_dir is None:
                self.widget_value = value
                self.on_setting_changed()
            else:
                if hasattr(self, "bind_object"):
                    self.bind_object.set_property(self.bind_prop, value)
                else:
                    self.content_widget.set_property(self.bind_prop, value)

        def get_widget_value(self):
            if self.bind_dir is None:
                try:
                    return self.widget_value
                except Exception:
                    return None
            else:
                if hasattr(self, "bind_object"):
                    return self.bind_object.get_property(self.bind_prop)
                return self.content_widget.get_property(self.bind_prop)

    for prop in widget_def:
        if prop in WIDGET_PROPERTIES_MAP:
            kwargs[WIDGET_PROPERTIES_MAP[prop]] = widget_def[prop]

    return Widget(**kwargs)


class MultiOptions(SettingsWidget):
    bind_dir = None

    def __init__(self, label, options=[], valtype=None, size_group=None, dep_key=None, tooltip=""):
        super().__init__(dep_key=dep_key)
        self.set_spacing(5, 5)

        self.label = SettingsLabel(label)
        self.label.set_halign(Gtk.Align.CENTER)

        self.valtype = valtype
        self.option_map = {}
        self.secondary_widget = None

        self.content_widget = Gtk.Stack()
        self.content_widget.set_transition_type(Gtk.StackTransitionType.SLIDE_UP_DOWN)
        self.content_widget.set_transition_duration(150)
        self.content_widget.set_property("margin", 0)
        self.content_widget.set_property("expand", True)

        self.stack_switcher = Gtk.StackSwitcher()
        self.stack_switcher.set_stack(self.stack)
        self.stack_switcher.set_halign(Gtk.Align.CENTER)
        self.stack_switcher.set_homogeneous(False)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 0, 1, 1, 1)
        self.attach(self.stack_switcher, 0, 2, 1, 1)

        self.populate_stack(options)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def populate_stack(self, options):
        if self.valtype is not None:
            var_type = self.valtype
        else:
            var_type = type(options[0][0])

        self.model = Gtk.ListStore(var_type, str)

        for option in options:
            self.option_map[option[0]] = self.model.append([option[0], option[1]])

        self.combo_button.set_model(self.model)
        self.combo_button.set_id_column(0)


    def set_options(self, options):
        if self.valtype is not None:
            var_type = self.valtype
        else:
            var_type = type(options[0][0])

        self.model = Gtk.ListStore(var_type, str)

        for option in options:
            self.option_map[option[0]] = self.model.append([option[0], option[1]])

        self.combo_button.set_model(self.model)
        self.combo_button.set_id_column(0)

    def attach_secondary_widget(self):
        if self.secondary_widget is not None:
            self.secondary_widget.destroy()

        try:
            combo_option, secondary_widget_def = self.get_value().split("::")
        except Exception:
            combo_option, secondary_widget_def = "", None

        if combo_option and secondary_widget_def:
            self.secondary_widget = secondary_widget_factory(secondary_widget_def, self.settings)

    def connect_widget_handlers(self, *args):
        pass


if __name__ == "__main__":
    pass
