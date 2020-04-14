#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Xlets settings widgets factory.

Attributes
----------
OPERATIONS : list
    Comparison operations.
OPERATIONS_MAP : dict
    Comparison operations map.
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

from . import exceptions
from .AppChooserWidgets import AppChooser  # noqa
from .AppChooserWidgets import AppList  # noqa
from .SettingsWidgets import *  # noqa
from .TreeListWidgets import TreeList  # noqa
from .common import BaseGrid
from .common import sort_combo_options

# NOTE: JEESH!!! I hate import *!!!
__all__ = [  # noqa
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
    "JSONSettingsTreeList",
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
CAN_BACKEND.append("TreeList")  # noqa | SettingsWidgets


OPERATIONS = ["<=", ">=", "<", ">", "!=", "="]

OPERATIONS_MAP = {"<": operator.lt, "<=": operator.le, ">": operator.gt,
                  ">=": operator.ge, "!=": operator.ne, "=": operator.eq}


class JSONSettingsHandler():
    """Xlets settings backend.

    Attributes
    ----------
    bindings : dict
        All the bindings stored when calling ``self.bind()``.
    deps : dict
        Dependency keys.
    file_monitor : Gio.FileMonitor
        A ``Gio.FileMonitor`` for the given ``self``, or None on error.
    file_monitor_signal : int
        Where the connection for the file monitor's ``changed`` signal is stored.
    file_obj : Gio.File
        A new Gio.File for the path ``self.filepath``.
    filepath : str
        Path to an xlet JSON configuration file.
    listeners : dict
        See :any:`JSONSettingsHandler.listen`.
    notify_callback : method
        See ``MainApplication.notify_dbus`` (**Not used**).
    resume_timeout : int
        The ID (greater than 0) of the event source.
    settings : dict
        An xlet settings file content.
    xlet_meta : dict
        Xlet metadata.
    """

    def __init__(self, filepath, notify_callback=None, xlet_meta=None):
        """Initialization.

        Parameters
        ----------
        filepath : str
            Path to an xlet JSON configuration file.
        notify_callback : None, optional
            See ``MainApplication.notify_dbus`` (**Not used**).
        xlet_meta : None, optional
            Xlet metadata.
        """
        super().__init__()

        self.resume_timeout = None
        self.notify_callback = notify_callback
        self.xlet_meta = xlet_meta

        self.filepath = filepath
        self.file_obj = Gio.File.new_for_path(self.filepath)
        self.file_monitor = self.file_obj.monitor_file(Gio.FileMonitorFlags.SEND_MOVED, None)
        self.file_monitor_signal = self.file_monitor.connect("changed", self.check_settings)

        self.bindings = {}
        self.listeners = {}
        self.deps = {}

        self.settings = self.get_settings()

    def get_xlet_meta(self):
        """Get xlet metadata.

        Returns
        -------
        dict
            Xlet metadata.
        """
        return self.xlet_meta

    def bind(self, key, obj, prop, direction, map_get=None, map_set=None):
        """Bind a preference to a widget property.

        Parameters
        ----------
        key : str
            The preference key.
        obj : Gtk.Widget
            The widget to bind.
        prop : str
            The widget property.
        direction : Gio.SettingsBindFlags
            The ``Gio.SettingsBindFlags`` flag.
        map_get : method, None, optional
            A function to map between setting and bound attribute.
        map_set : method, None, optional
            A function to map between setting and bound attribute.
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
        """Preference key _listeners_. Store a callback to be executed every time a preference
        changes its value.

        Parameters
        ----------
        key : str
            The preference key.
        callback : method
            The function to call.
        """
        if key not in self.listeners:
            self.listeners[key] = []
        self.listeners[key].append(callback)

    def get_value(self, key):
        """Get preference value.

        Parameters
        ----------
        key : str
            The preference key.

        Returns
        -------
        int, str, list, float, dict
            The preference value.
        """
        return self.get_property(key, "value")

    def set_value(self, key, value):
        """Set preference value.

        Parameters
        ----------
        key : str
            The preference key.
        value : int, str, list, float, dict
            The preference value.
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
        """Get ``self.settings`` property.

        Parameters
        ----------
        key : str
            The preference key.
        prop : str
            The property to get.

        Returns
        -------
        int, str, list, float, dict
            The property value.
        """
        props = self.settings[key]
        return props[prop]

    def has_property(self, key, prop):
        """Check if ``self.settings`` has a property.

        Parameters
        ----------
        key : str
            The preference key.
        prop : str
            The property to check.

        Returns
        -------
        bool
            If the property exist.
        """
        return prop in self.settings[key]

    def has_key(self, key):
        """Check if ``self.settings`` has a preference key.

        Parameters
        ----------
        key : str
            The preference key.

        Returns
        -------
        bool
            If the preference exist.
        """
        return key in self.settings

    def object_value_changed(self, obj, value, key):
        """On object value changed.

        Callback connected to the ``obj`` ``notify::<bind_prop>`` signal.

        Parameters
        ----------
        obj : Gtk.Widget
            A widget whose monitored property has changed.
        value : str, int, float
            The widget's property value.
        key : str
            The preference handled by the widget.
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
        """Set widget property.

        Parameters
        ----------
        info : dict
            Binding information.
        value : str, int, float
            The new value for the widget's property.

        Returns
        -------
        None
            Halt execution.
        """
        if info["dir"] & Gio.SettingsBindFlags.GET == 0:
            return

        with info["obj"].freeze_notify():
            if "map_get" in info and info["map_get"] is not None:
                value = info["map_get"](value)
            if value != info["obj"].get_property(info["prop"]) and value is not None:
                info["obj"].set_property(info["prop"], value)

    def check_settings(self, *args):
        """Check settings file.

        Check if the settings stored in a settings file has changed and update all widgets.

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
        """Get settings from settings file.

        Returns
        -------
        dict
            The settings file data.

        Raises
        ------
        exceptions.MalformedJSONFile
            Malformed JOSN file.
        """
        with open(self.filepath, "r", encoding="UTF-8") as settings_file:
            raw_data = settings_file.read()

        try:
            settings = json.loads(raw_data, encoding=None,
                                  object_pairs_hook=collections.OrderedDict)
        except Exception:
            raise exceptions.MalformedJSONFile(self.filepath)
        return settings

    def save_settings(self):
        """Save settings to file.
        """
        self.pause_monitor()

        if os.path.exists(self.filepath):
            os.remove(self.filepath)

        raw_data = json.dumps(self.settings, indent=4)

        with open(self.filepath, "w+", encoding="UTF-8") as settings_file:
            settings_file.write(raw_data)

        self.resume_monitor()

    def pause_monitor(self):
        """Pause settings file monitor.
        """
        if self.file_monitor_signal:
            self.file_monitor.disconnect(self.file_monitor_signal)

        self.file_monitor.cancel()
        self.file_monitor_signal = None

    def resume_monitor(self):
        """Delayed resume of settings file monitor.
        """
        if self.resume_timeout:
            GLib.source_remove(self.resume_timeout)
        self.resume_timeout = GLib.timeout_add(2000, self.do_resume)

    def do_resume(self):
        """Resume settings file monitor.

        Returns
        -------
        bool
            Break loop execution.
        """
        self.file_monitor = self.file_obj.monitor_file(Gio.FileMonitorFlags.SEND_MOVED, None)
        self.file_monitor_signal = self.file_monitor.connect("changed", self.check_settings)
        self.resume_timeout = None
        return GLib.SOURCE_REMOVE

    def reset_to_defaults(self):
        """Reset settings to their default values.
        """
        for key in self.settings:
            if "value" in self.settings[key]:
                self.settings[key]["value"] = self.settings[key]["default"]
                self.do_key_update(key)

        self.save_settings()

    def do_key_update(self, key):
        """Do preference key update.

        Parameters
        ----------
        key : str
            A preference key.
        """
        if key in self.bindings:
            for info in self.bindings[key]:
                self.set_object_value(info, self.settings[key]["value"])

        if key in self.listeners:
            for callback in self.listeners[key]:
                callback(key, self.settings[key]["value"])

    def load_from_file(self, filepath):
        """Load settings from file.

        Parameters
        ----------
        filepath : str
            Path to a settings file.

        Raises
        ------
        exceptions.MalformedJSONFile
            Malformed JOSN file.
        """
        with open(filepath, "r", encoding="UTF-8") as settings_file:
            raw_data = settings_file.read()

        try:
            settings = json.loads(raw_data, encoding=None,
                                  object_pairs_hook=collections.OrderedDict)
        except Exception:
            raise exceptions.MalformedJSONFile(filepath)

        for key in self.settings:
            if "value" not in self.settings[key]:
                continue
            if key in settings and "value" in self.settings[key]:
                self.settings[key]["value"] = settings[key]["value"]
                self.do_key_update(key)
            else:
                print(
                    "Skipping key %s: the key does not exist in %s or has no value" %
                    (key, filepath))

        self.save_settings()

    def save_to_file(self, filepath):
        """Save settings to file.

        Parameters
        ----------
        filepath : str
            The path to a file to save the settings into.
        """
        if os.path.exists(filepath):
            os.remove(filepath)

        raw_data = json.dumps(self.settings, indent=4)

        with open(filepath, "w+", encoding="UTF-8") as settings_file:
            settings_file.write(raw_data)


class JSONSettingsRevealer(Gtk.Revealer):
    """JSON settings revealer.

    Attributes
    ----------
    box : BaseGrid
        The container for the widgets that are going to be added to the revealer.
    dep_keys : dict
        Dependency keys storage.
    ops : dict
        Comparison operations storage.
    settings : JSONSettingsHandler
        The xlets settings handler.
    """

    def __init__(self, settings, dep_key):
        """Initialization.

        Parameters
        ----------
        settings : JSONSettingsHandler
            The xlets settings handler.
        dep_key : str, list
            Dependency key/s.

        Raises
        ------
        exceptions.WrongType
            Wrong type for ``dep_key``.
        """
        if not isinstance(dep_key, (str, list)):
            raise exceptions.WrongType("str, list", type(dep_key).__name__)

        super().__init__()
        self.settings = settings

        if isinstance(dep_key, str):
            dep_keys = [dep_key]
        else:
            dep_keys = dep_key

        self.dep_keys = {}
        self.ops = {}

        for d_k in dep_keys:
            operator_found = False

            for op in OPERATIONS:
                if op in d_k:
                    key, value = d_k.split(op)
                    self.dep_keys[key] = value
                    self.ops[key] = op
                    operator_found = True
                    break

            # If an operator is used, continue to the next dependency key.
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
        """Add widget to revealer.

        Parameters
        ----------
        widget : Gtk.Widget
            A ``Gtk.Widget`` to add to the revealer.
        """
        self.box.attach(widget, 0, 0, 1, 1)

    def key_changed(self, *args):
        """On key value changed.

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
    """JSON settings backend.
    """

    def attach_backend(self):
        """Attach backend.
        """
        self._saving = False

        if hasattr(self, "set_rounding") and self.settings.has_property(self.pref_key, "round"):
            self.set_rounding(self.settings.get_property(self.pref_key, "round"))

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
        """Set preference value.

        Parameters
        ----------
        value : int, str, float, list
            The new value for the preference.
        """
        self._saving = True
        self.settings.set_value(self.pref_key, value)
        self._saving = False

    def _settings_changed_callback(self, *args):
        """Proxy function for ``self.on_setting_changed``.

        Parameters
        ----------
        *args
            Arguments.
        """
        if not self._saving:
            self.on_setting_changed(*args)

    def get_value(self):
        """Get preference value.

        Returns
        -------
        int, str, float, list
            The current preference value.
        """
        return self.settings.get_value(self.pref_key)

    def get_range(self):
        """Get minimum/maximum range for a preference.

        Returns
        -------
        list
            A list with two elements. Minimum value at index 0 and maximum value at index 1.
        """
        min = self.settings.get_property(self.pref_key, "min")
        max = self.settings.get_property(self.pref_key, "max")
        return [min, max]

    def on_setting_changed(self, *args):
        """This method triggers at widget creation time and when a preference value was changed
        externally. Its execution should update the widget (or widgets, if it's a multi-widget
        widget, like the keybinding widget) using the data of the new preference value.

        Parameters
        ----------
        *args
            Arguments.

        Raises
        ------
        exceptions.MethodUnimplemented
            :any:`SettingsWidget` classes must implement this method.
        """
        raise exceptions.MethodUnimplemented("on_setting_changed")

    def connect_widget_handlers(self, *args):
        """This method triggers once when the widget factory function creates a new widget class
        from an instance of :any:`SettingsWidget` and :any:`JSONSettingsBackend`.

        Parameters
        ----------
        *args
            Arguments.

        Raises
        ------
        exceptions.MethodUnimplemented
            :any:`SettingsWidget` classes with no bind_dir property set must implement this method.
        """
        if self.bind_dir is None:
            raise exceptions.MethodUnimplemented("connect_widget_handlers")


def json_settings_factory(subclass):
    """JSONSettings widgets factory.

    Parameters
    ----------
    subclass : str
        The class name of a :any:`SettingsWidgets` based instance.

    Returns
    -------
    class
        A new class based on ``subclass`` and ``JSONSettingsBackend``.

    Raises
    ------
    exceptions.CannotBackend
        The widget cannot be backended.
    """
    if subclass not in CAN_BACKEND:  # noqa | SettingsWidgets
        raise exceptions.CannotBackend(subclass)

    class NewClass(globals()[subclass], JSONSettingsBackend):
        """New super class.

        Attributes
        ----------
        apply_key : str
            See :any:`TreeList._apply_changes`.
        imp_exp_path_key : str
            See :any:`TreeList._export_data` and :any:`TreeList._import_data` .
        pref_key : str
            The preference key that this widget will control.
        settings : JSONSettingsHandler
            The xlets settings handler.
        """

        def __init__(self, widget_attrs={}, widget_kwargs={}):
            """Initialization.

            Parameters
            ----------
            widget_attrs : dict, optional
                Widget attributes.
            widget_kwargs : dict, optional
                Widget keyword arguments.
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
