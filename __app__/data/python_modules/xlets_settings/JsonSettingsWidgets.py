#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Xlets settings widgets factory.

Attributes
----------
OPERATIONS : list
    Description
OPERATIONS_MAP : dict
    Description
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

from .AppChooserWidgets import AppChooser  # noqa
from .AppChooserWidgets import AppList  # noqa
from .SettingsWidgets import *  # noqa
from .TreeListWidgets import List  # noqa
from .common import BaseGrid
from .common import sort_combo_options

# NOTE: JEESH!!! I hate import *!!!
__all__ = [
    # NOTE: Defined in this module.
    "JSONSettingsHandler",
    "JSONSettingsRevealer",
    "JSONSettingsBackend",
    # NOTE: Defined in SettingsWidgets module.
    "CAN_BACKEND",
    "JSONSettingsAppChooser",
    "JSONSettingsAppList",
    "JSONSettingsButton",
    "JSONSettingsColorChooser",
    "JSONSettingsComboBox",
    "JSONSettingsEntry",
    "JSONSettingsFileChooser",
    "JSONSettingsIconChooser",
    "JSONSettingsKeybinding",
    "JSONSettingsKeybindingWithOptions",
    "JSONSettingsList",
    "JSONSettingsSpinButton",
    "JSONSettingsSwitch",
    "JSONSettingsTextView",
    "SettingsSection",
    "SettingsLabel",
    "SettingsPage",
    "SettingsRevealer",
    "SettingsStack",
    "SettingsWidget",
    "Text"
    # "JSONSettingsDateChooser",
    # "JSONSettingsEffectChooser",
    # "JSONSettingsFontButton",
    # "JSONSettingsRange",
    # "JSONSettingsSoundFileChooser",
    # "JSONSettingsTweenChooser"
]

CAN_BACKEND.append("AppChooser")  # noqa | SettingsWidgets
CAN_BACKEND.append("AppList")  # noqa | SettingsWidgets
CAN_BACKEND.append("List")  # noqa | SettingsWidgets


OPERATIONS = ["<=", ">=", "<", ">", "!=", "="]

OPERATIONS_MAP = {"<": operator.lt, "<=": operator.le, ">": operator.gt,
                  ">=": operator.ge, "!=": operator.ne, "=": operator.eq}


class JSONSettingsHandler():
    """Summary

    Attributes
    ----------
    bindings : dict
        Description
    deps : dict
        Description
    file_monitor : TYPE
        Description
    file_obj : TYPE
        Description
    filepath : TYPE
        Description
    handler : TYPE
        Description
    listeners : dict
        Description
    notify_callback : TYPE
        Description
    resume_timeout : TYPE
        Description
    settings : TYPE
        Description
    xlet_meta : TYPE
        Description
    """

    def __init__(self, filepath, notify_callback=None, xlet_meta=None):
        """Initialization.

        Parameters
        ----------
        filepath : TYPE
            Description
        notify_callback : None, optional
            Description
        xlet_meta : None, optional
            Description
        """
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
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        return self.xlet_meta

    def bind(self, key, obj, prop, direction, map_get=None, map_set=None):
        """Summary

        Parameters
        ----------
        key : TYPE
            Description
        obj : TYPE
            Description
        prop : TYPE
            Description
        direction : TYPE
            Description
        map_get : None, optional
            Description
        map_set : None, optional
            Description
        """
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
        """Summary

        Parameters
        ----------
        key : TYPE
            Description
        callback : TYPE
            Description
        """
        if key not in self.listeners:
            self.listeners[key] = []
        self.listeners[key].append(callback)

    def get_value(self, key):
        """Summary

        Parameters
        ----------
        key : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        return self.get_property(key, "value")

    def set_value(self, key, value):
        """Summary

        Parameters
        ----------
        key : TYPE
            Description
        value : TYPE
            Description
        """
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
        """Summary

        Parameters
        ----------
        key : TYPE
            Description
        prop : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        props = self.settings[key]
        return props[prop]

    def has_property(self, key, prop):
        """Summary

        Parameters
        ----------
        key : TYPE
            Description
        prop : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        return prop in self.settings[key]

    def has_key(self, key):
        """Summary

        Parameters
        ----------
        key : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        return key in self.settings

    def object_value_changed(self, obj, value, key):
        """Summary

        Parameters
        ----------
        obj : TYPE
            Description
        value : TYPE
            Description
        key : TYPE
            Description
        """
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
        """Summary

        Parameters
        ----------
        info : TYPE
            Description
        value : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        if info["dir"] & Gio.SettingsBindFlags.GET == 0:
            return

        with info["obj"].freeze_notify():
            if "map_get" in info and info["map_get"] is not None:
                value = info["map_get"](value)
            if value != info["obj"].get_property(info["prop"]) and value is not None:
                info["obj"].set_property(info["prop"], value)

    def check_settings(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
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
        """Summary

        Returns
        -------
        TYPE
            Description

        Raises
        ------
        Exception
            Description
        """
        with open(self.filepath) as settings_file:
            raw_data = settings_file.read()

        try:
            settings = json.loads(raw_data, encoding=None,
                                  object_pairs_hook=collections.OrderedDict)
        except Exception:
            raise Exception("Failed to parse settings JSON data for file %s" % (self.filepath))
        return settings

    def save_settings(self):
        """Summary
        """
        self.pause_monitor()

        if os.path.exists(self.filepath):
            os.remove(self.filepath)

        raw_data = json.dumps(self.settings, indent=4)

        with open(self.filepath, "w+") as settings_file:
            settings_file.write(raw_data)

        self.resume_monitor()

    def pause_monitor(self):
        """Summary
        """
        self.file_monitor.cancel()
        self.handler = None

    def resume_monitor(self):
        """Summary
        """
        if self.resume_timeout:
            GLib.source_remove(self.resume_timeout)
        self.resume_timeout = GLib.timeout_add(2000, self.do_resume)

    def do_resume(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        self.file_monitor = self.file_obj.monitor_file(Gio.FileMonitorFlags.SEND_MOVED, None)
        self.handler = self.file_monitor.connect("changed", self.check_settings)
        self.resume_timeout = None
        return False

    def reset_to_defaults(self):
        """Summary
        """
        for key in self.settings:
            if "value" in self.settings[key]:
                self.settings[key]["value"] = self.settings[key]["default"]
                self.do_key_update(key)

        self.save_settings()

    def do_key_update(self, key):
        """Summary

        Parameters
        ----------
        key : TYPE
            Description
        """
        if key in self.bindings:
            for info in self.bindings[key]:
                self.set_object_value(info, self.settings[key]["value"])

        if key in self.listeners:
            for callback in self.listeners[key]:
                callback(key, self.settings[key]["value"])

    def load_from_file(self, filepath):
        """Summary

        Parameters
        ----------
        filepath : TYPE
            Description

        Raises
        ------
        Exception
            Description
        """
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
        """Summary

        Parameters
        ----------
        filepath : TYPE
            Description
        """
        if os.path.exists(filepath):
            os.remove(filepath)

        raw_data = json.dumps(self.settings, indent=4)

        with open(filepath, "w+") as settings_file:
            settings_file.write(raw_data)


class JSONSettingsRevealer(Gtk.Revealer):
    """Summary

    Attributes
    ----------
    box : TYPE
        Description
    dep_keys : dict
        Description
    ops : dict
        Description
    settings : TYPE
        Description
    value : TYPE
        Description
    """

    def __init__(self, settings, dep_key):
        """Initialization.

        Parameters
        ----------
        settings : TYPE
            Description
        dep_key : TYPE
            Description
        """
        super().__init__()
        self.settings = settings

        if isinstance(dep_key, str):
            dep_keys = [dep_key]
        else:
            dep_keys = dep_key

        self.dep_keys = {}
        self.ops = {}
        self.value = None

        for d_k in dep_keys:
            operator_found = False

            for op in OPERATIONS:
                if op in d_k:
                    key, value = d_k.split(op)
                    self.dep_keys[key] = value
                    self.ops[key] = op
                    operator_found = True
                    break

            # If an operator is used, continue to the next dep. key.
            if operator_found:
                continue

            if d_k[:1] == "!":
                self.dep_keys[d_k[1:]] = True
            else:
                self.dep_keys[d_k] = False

        self.box = BaseGrid()
        Gtk.Revealer.add(self, self.box)

        self.set_transition_type(Gtk.RevealerTransitionType.SLIDE_DOWN)
        self.set_transition_duration(150)

        for k in self.dep_keys.keys():
            self.settings.listen(k, self.key_changed)

        self.key_changed()

    def add(self, widget):
        """Summary

        Parameters
        ----------
        widget : object
            See :py:class:`Gtk.Widget`.
        """
        self.box.attach(widget, 0, 0, 1, 1)

    def key_changed(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        reveal_conditions = []

        for key, val in self.dep_keys.items():
            dep_value = self.settings.get_value(key)
            try:
                if key in self.ops:
                    val_type = type(dep_value)
                    reveal_conditions.append(
                        OPERATIONS_MAP[self.ops[key]](dep_value, val_type(val)))
                elif dep_value != val:
                    reveal_conditions.append(True)
                else:
                    reveal_conditions.append(False)
            except Exception as err:
                print(err)

        self.set_reveal_child(all(reveal_conditions))


class JSONSettingsBackend(object):
    """Summary
    """

    def attach_backend(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        self._saving = False

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
                               getattr(self, "map_get", None),
                               getattr(self, "map_set", None))
        else:
            self.settings.listen(self.pref_key, self._settings_changed_callback)
            self.on_setting_changed()
            self.connect_widget_handlers()

    def set_value(self, value):
        """Summary

        Parameters
        ----------
        value : TYPE
            Description
        """
        self._saving = True
        self.settings.set_value(self.pref_key, value)
        self._saving = False

    def _settings_changed_callback(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Description
        """
        if not self._saving:
            self.on_setting_changed(*args)

    def get_value(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        return self.settings.get_value(self.pref_key)

    def get_range(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        min = self.settings.get_property(self.pref_key, "min")
        max = self.settings.get_property(self.pref_key, "max")
        return [min, max]

    def on_setting_changed(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.

        Raises
        ------
        NotImplementedError
            Description
        """
        raise NotImplementedError("SettingsWidget class must implement on_setting_changed().")

    def connect_widget_handlers(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.

        Raises
        ------
        NotImplementedError
            Description
        """
        if self.bind_dir is None:
            raise NotImplementedError(
                "SettingsWidget classes with no .bind_dir must implement connect_widget_handlers().")


def json_settings_factory(subclass):
    """Summary

    Parameters
    ----------
    subclass : TYPE
        Description

    Raises
    ------
    SystemExit
        Description
    """
    if subclass not in CAN_BACKEND:  # noqa | SettingsWidgets
        raise SystemExit()

    class NewClass(globals()[subclass], JSONSettingsBackend):
        """Summary

        Attributes
        ----------
        apply_key : TYPE
            Description
        imp_exp_path_key : TYPE
            Description
        pref_key : TYPE
            Description
        settings : TYPE
            Description
        """

        def __init__(self, widget_attrs={}, widget_kwargs={}):
            """Initialization.

            Parameters
            ----------
            widget_attrs : dict, optional
                Description
            widget_kwargs : dict, optional
                Description

            Returns
            -------
            TYPE
                Description
            """
            self.pref_key = widget_attrs.get("pref_key")
            self.apply_key = widget_attrs.get("apply_key")
            self.imp_exp_path_key = widget_attrs.get("imp_exp_path_key")
            self.settings = widget_attrs.get("settings")

            kwargs = {}

            for k in widget_kwargs:
                if k in JSON_SETTINGS_PROPERTIES_MAP:  # noqa | SettingsWidgets
                    kwargs[JSON_SETTINGS_PROPERTIES_MAP[k]] = widget_kwargs[k]  # noqa | SettingsWidgets
                elif k == "options":
                    options_list = widget_kwargs[k]

                    # NOTE: Sort both types of options. Otherwise, items will appear in
                    # different order every single time the widget is re-built.
                    if isinstance(options_list, dict):
                        kwargs["options"] = [(a, b) for a, b in options_list.items()]
                    else:
                        kwargs["options"] = zip(options_list, options_list)

                    kwargs["options"] = sort_combo_options(
                        kwargs["options"], widget_kwargs.get("first-option", ""))

            super().__init__(**kwargs)
            self.attach_backend()

    return NewClass


for setting_widget in CAN_BACKEND:  # noqa | SettingsWidgets
    globals()["JSONSettings" + setting_widget] = json_settings_factory(setting_widget)


if __name__ == "__main__":
    pass
