#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Cinnamon settings widgets custom implementation.

This is an uber-simplified implementation of the settings widgets used by
recent versions of Cinnamon.

Changes
-------

- Eradication of Gtk.Box in favor of Gtk.Grid.
- Added keyboard handling (delete/move) of items inside the List widget.
- Simplified version of a Button widget that doesn't attach a callback,
  but toggles a boolean preference.
"""

import collections
import gi
import json
import operator
import os

gi.require_version("Gtk", "3.0")

from gi.repository import GLib
from gi.repository import Gio
from gi.repository import Gtk

# NOTE: JEESH!!! I hate import *!!!
from .SettingsWidgets import *  # noqa
from .TreeListWidgets import List  # noqa
from .common import BaseGrid


CAN_BACKEND.append("List")  # noqa

JSON_SETTINGS_PROPERTIES_MAP = {
    "description": "label",
    "min": "mini",
    "max": "maxi",
    "step": "step",
    "page": "page",
    "digits": "digits",
    "units": "units",
    "show-value": "show_value",
    "select-dir": "dir_select",
    "height": "height",
    "tooltip": "tooltip",
    "possible": "possible",
    "expand-width": "expand_width",
    "columns": "columns",
    "event-sounds": "event_sounds",
    # NOTE: Wether to display or not the the Up/Down buttons in a "list" widget.
    "move-buttons": "move_buttons",
    # NOTE: For "list" widgets. The default width of the Edit entry dialog.
    "dialog-width": "dialog_width",
    # NOTE: For "list" widgets. Whether to close the settions window after applying.
    "apply-and-quit": "apply_and_quit",
    # NOTE: Expose the number of keybindings to create for a "keybinding" widget.
    "num-bind": "num_bind",
    # NOTE: Wether to use markup in "label" widgets.
    "use-markup": "use_markup",
    # NOTE: An array of strings to be added as labels to the add/edit entry for "list" widgets.
    "dialog-info-labels": "dialog_info_labels",
    # NOTE: Wheter to be able to specify opacity on ColorChooser widgets.
    "use-alpha": "use_alpha",
    # NOTE: For "list" widgets.
    # A dict that can be empty and accepts one key called `read_only_keys`. A list of
    # column IDs whose created widgets should be set as unsensitive.
    # An immutable list widget has a fixed ammount of items.
    # Items cannot be added nor removed but they do can be edited.
    "immutable": "immutable",
    # NOTE: For "textview" widgets. Wheter the Tab key inserts a tab character (accept-tabs = true)
    # or the keyboard focus is moved (accept-tabs = false).
    "accept-tabs": "accept_tabs",
}


OPERATIONS = ["<=", ">=", "<", ">", "!=", "="]

OPERATIONS_MAP = {"<": operator.lt, "<=": operator.le, ">": operator.gt,
                  ">=": operator.ge, "!=": operator.ne, "=": operator.eq}


class JSONSettingsHandler():
    def __init__(self, filepath, notify_callback=None, xlet_meta=None):
        super().__init__()

        self.resume_timeout = None
        self.notify_callback = notify_callback
        self.xlet_meta = xlet_meta

        self.filepath = filepath
        self.file_obj = Gio.File.new_for_path(self.filepath)
        self.file_monitor = self.file_obj.monitor_file(Gio.FileMonitorFlags.SEND_MOVED, None)
        self.file_monitor.connect("changed", self.check_settings)

        self.bindings = {}
        self.listeners = {}
        self.deps = {}

        self.settings = self.get_settings()

    def get_xlet_meta(self):
        return self.xlet_meta

    def bind(self, key, obj, prop, direction, map_get=None, map_set=None):
        if direction & (Gio.SettingsBindFlags.SET | Gio.SettingsBindFlags.GET) == 0:
            direction |= Gio.SettingsBindFlags.SET | Gio.SettingsBindFlags.GET

        binding_info = {"obj": obj, "prop": prop, "dir": direction,
                        "map_get": map_get, "map_set": map_set}
        if key not in self.bindings:
            self.bindings[key] = []
        self.bindings[key].append(binding_info)

        if direction & Gio.SettingsBindFlags.GET != 0:
            self.set_object_value(binding_info, self.get_value(key))
        if direction & Gio.SettingsBindFlags.SET != 0:
            binding_info["oid"] = obj.connect("notify::" + prop, self.object_value_changed, key)

    def listen(self, key, callback):
        if key not in self.listeners:
            self.listeners[key] = []
        self.listeners[key].append(callback)

    def get_value(self, key):
        return self.get_property(key, "value")

    def set_value(self, key, value):
        if value != self.settings[key]["value"]:
            self.settings[key]["value"] = value
            self.save_settings()
            if self.notify_callback:
                self.notify_callback(self, key, value)

            if key in self.bindings:
                for info in self.bindings[key]:
                    self.set_object_value(info, value)

            if key in self.listeners:
                for callback in self.listeners[key]:
                    callback(key, value)

    def get_property(self, key, prop):
        props = self.settings[key]
        return props[prop]

    def has_property(self, key, prop):
        return prop in self.settings[key]

    def has_key(self, key):
        return key in self.settings

    def object_value_changed(self, obj, value, key):
        for info in self.bindings[key]:
            if obj == info["obj"]:
                value = info["obj"].get_property(info["prop"])
                if "map_set" in info and info["map_set"] is not None:
                    value = info["map_set"](value)

        for info in self.bindings[key]:
            if obj != info["obj"]:
                self.set_object_value(info, value)
        self.set_value(key, value)

        if key in self.listeners:
            for callback in self.listeners[key]:
                callback(key, value)

    def set_object_value(self, info, value):
        if info["dir"] & Gio.SettingsBindFlags.GET == 0:
            return

        with info["obj"].freeze_notify():
            if "map_get" in info and info["map_get"] is not None:
                value = info["map_get"](value)
            if value != info["obj"].get_property(info["prop"]) and value is not None:
                info["obj"].set_property(info["prop"], value)

    def check_settings(self, *args):
        old_settings = self.settings
        self.settings = self.get_settings()

        for key in self.bindings:
            new_value = self.settings[key]["value"]
            if new_value != old_settings[key]["value"]:
                for info in self.bindings[key]:
                    self.set_object_value(info, new_value)

        for key, callback_list in self.listeners.items():
            new_value = self.settings[key]["value"]
            if new_value != old_settings[key]["value"]:
                for callback in callback_list:
                    callback(key, new_value)

    def get_settings(self):
        with open(self.filepath) as settings_file:
            raw_data = settings_file.read()

        try:
            settings = json.loads(raw_data, encoding=None,
                                  object_pairs_hook=collections.OrderedDict)
        except Exception:
            raise Exception("Failed to parse settings JSON data for file %s" % (self.filepath))
        return settings

    def save_settings(self):
        self.pause_monitor()

        if os.path.exists(self.filepath):
            os.remove(self.filepath)

        raw_data = json.dumps(self.settings, indent=4)

        with open(self.filepath, "w+") as settings_file:
            settings_file.write(raw_data)

        self.resume_monitor()

    def pause_monitor(self):
        self.file_monitor.cancel()
        self.handler = None

    def resume_monitor(self):
        if self.resume_timeout:
            GLib.source_remove(self.resume_timeout)
        self.resume_timeout = GLib.timeout_add(2000, self.do_resume)

    def do_resume(self):
        self.file_monitor = self.file_obj.monitor_file(Gio.FileMonitorFlags.SEND_MOVED, None)
        self.handler = self.file_monitor.connect("changed", self.check_settings)
        self.resume_timeout = None
        return False

    def reset_to_defaults(self):
        for key in self.settings:
            if "value" in self.settings[key]:
                self.settings[key]["value"] = self.settings[key]["default"]
                self.do_key_update(key)

        self.save_settings()

    def do_key_update(self, key):
        if key in self.bindings:
            for info in self.bindings[key]:
                self.set_object_value(info, self.settings[key]["value"])

        if key in self.listeners:
            for callback in self.listeners[key]:
                callback(key, self.settings[key]["value"])

    def load_from_file(self, filepath):
        with open(filepath) as settings_file:
            raw_data = settings_file.read()

        try:
            settings = json.loads(raw_data, encoding=None,
                                  object_pairs_hook=collections.OrderedDict)
        except Exception:
            raise Exception("Failed to parse settings JSON data for file %s" % (self.filepath))

        for key in self.settings:
            if "value" not in self.settings[key]:
                continue
            if key in settings and "value" in self.settings[key]:
                self.settings[key]["value"] = settings[key]["value"]
                self.do_key_update(key)
            else:
                print("Skipping key %s: the key does not exist in %s or has no value" % (key, filepath))
        self.save_settings()

    def save_to_file(self, filepath):
        if os.path.exists(filepath):
            os.remove(filepath)

        raw_data = json.dumps(self.settings, indent=4)

        with open(filepath, "w+") as settings_file:
            settings_file.write(raw_data)


class JSONSettingsRevealer(Gtk.Revealer):
    def __init__(self, settings, dep_key):
        super().__init__()
        self.settings = settings

        self.dep_key = None
        self.op = None
        self.value = None

        for op in OPERATIONS:
            if op in dep_key:
                self.op = op
                self.dep_key, self.value = dep_key.split(op)
                break

        if self.dep_key is None:
            if dep_key[:1] is "!":
                self.invert = True
                self.dep_key = dep_key[1:]
            else:
                self.invert = False
                self.dep_key = dep_key

        self.box = BaseGrid()
        Gtk.Revealer.add(self, self.box)

        self.set_transition_type(Gtk.RevealerTransitionType.SLIDE_DOWN)
        self.set_transition_duration(150)

        self.settings.listen(self.dep_key, self.key_changed)
        self.key_changed(self.dep_key, self.settings.get_value(self.dep_key))

    def add(self, widget):
        self.box.attach(widget, 0, 0, 1, 1)

    def key_changed(self, dep_key, value):
        try:
            if self.op is not None:
                val_type = type(value)
                self.set_reveal_child(OPERATIONS_MAP[self.op](value, val_type(self.value)))
            elif value != self.invert:
                self.set_reveal_child(True)
            else:
                self.set_reveal_child(False)
        except Exception as e:
            print(e)


class JSONSettingsBackend(object):
    def attach_backend(self):
        if hasattr(self, "set_rounding") and self.settings.has_property(self.pref_key, "round"):
            self.set_rounding(self.settings.get_property(self.pref_key, "round"))

        if hasattr(self, "do_not_bind"):
            return

        if hasattr(self, "bind_object"):
            bind_object = self.bind_object
        else:
            bind_object = self.content_widget

        if self.bind_dir is not None:
            self.settings.bind(self.pref_key, bind_object, self.bind_prop, self.bind_dir,
                               self.map_get if hasattr(self, "map_get") else None,
                               self.map_set if hasattr(self, "map_set") else None)
        else:
            self.settings.listen(self.pref_key, self.on_setting_changed)
            self.on_setting_changed()
            self.connect_widget_handlers()

    def set_value(self, value):
        self.settings.set_value(self.pref_key, value)

    def get_value(self):
        return self.settings.get_value(self.pref_key)

    def get_range(self):
        min = self.settings.get_property(self.pref_key, "min")
        max = self.settings.get_property(self.pref_key, "max")
        return [min, max]

    def on_setting_changed(self, *args):
        raise NotImplementedError("SettingsWidget class must implement on_setting_changed().")

    def connect_widget_handlers(self, *args):
        if self.bind_dir is None:
            raise NotImplementedError(
                "SettingsWidget classes with no .bind_dir must implement connect_widget_handlers().")


def json_settings_factory(subclass):
    if subclass not in CAN_BACKEND:  # noqa
        raise SystemExit()

    class NewClass(globals()[subclass], JSONSettingsBackend):
        def __init__(self, pref_key="", apply_key="", imp_exp_path_key="",
                     settings={}, properties={}):
            self.pref_key = pref_key
            self.apply_key = apply_key
            self.imp_exp_path_key = imp_exp_path_key
            self.settings = settings

            kwargs = {}

            for prop in properties:
                if prop in JSON_SETTINGS_PROPERTIES_MAP:
                    kwargs[JSON_SETTINGS_PROPERTIES_MAP[prop]] = properties[prop]
                elif prop == "options":
                    kwargs["options"] = []

                    for value, label in properties[prop].items():
                        kwargs["options"].append((value, label))
            super().__init__(**kwargs)
            self.attach_backend()

    return NewClass


for setting_widget in CAN_BACKEND:  # noqa
    globals()["JSONSettings" + setting_widget] = json_settings_factory(setting_widget)


if __name__ == "__main__":
    pass
