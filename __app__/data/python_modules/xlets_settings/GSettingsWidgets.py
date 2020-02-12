#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Slimmed down and functional module to handle gsettings from an xlet settings window.

Only implemented a limited set of widgets (Switch and ComboBox). I will add more if
the need arises.

It can handle schemas that aren't installed on a system.

Attributes
----------
CAN_BACKEND : TYPE
    Description
GioSSS : TYPE
    Description
"""
from gi.repository import GLib
from gi.repository import Gio

from .SettingsWidgets import *  # noqa
from .common import sort_combo_options


GioSSS = Gio.SettingsSchemaSource


# NOTE: JEESH!!! I hate import *!!!
__all__ = [
    # NOTE: Defined in this module.
    "GSettingsComboBox",
    "GSettingsSwitch"
]


CAN_BACKEND = [
    "ComboBox",
    "Switch",
    # "ColorChooser",
    # "Entry",
    # "FileChooser",
    # "FontButton",
    # "IconChooser",
    # "Range",
    # "SpinButton",
    # "TextView",
]

# Monkey patch Gio.Settings object


def __setitem__(self, key, value):
    """Summary

    Parameters
    ----------
    key : TYPE
        Description
    value : TYPE
        Description

    Raises
    ------
    KeyError
        Description
    ValueError
        Description
    """
    # set_value() aborts the program on an unknown key
    if key not in self:
        raise KeyError("Unknown key: %r" % (key,))

    # determine type string of this key
    range = self.get_range(key)
    type_ = range.get_child_value(0).get_string()
    v = range.get_child_value(1)

    if type_ == "type":
        # v is boxed empty array, type of its elements is the allowed value type
        assert v.get_child_value(0).get_type_string().startswith("a")
        type_str = v.get_child_value(0).get_type_string()[1:]
    elif type_ == "enum":
        # v is an array with the allowed values
        assert v.get_child_value(0).get_type_string().startswith("a")
        type_str = v.get_child_value(0).get_child_value(0).get_type_string()
    elif type_ == "flags":
        # v is an array with the allowed values
        assert v.get_child_value(0).get_type_string().startswith("a")
        type_str = v.get_child_value(0).get_type_string()
    elif type_ == "range":
        # type_str is a tuple giving the range
        assert v.get_child_value(0).get_type_string().startswith("(")
        type_str = v.get_child_value(0).get_type_string()[1]

    if not self.set_value(key, GLib.Variant(type_str, value)):
        raise ValueError("value '%s' for key '%s' is outside of valid range" % (value, key))


def bind_with_mapping(self, key, widget, prop, flags, key_to_prop, prop_to_key):
    """Summary

    Parameters
    ----------
    key : TYPE
        Description
    widget : TYPE
        Description
    prop : TYPE
        Description
    flags : TYPE
        Description
    key_to_prop : TYPE
        Description
    prop_to_key : TYPE
        Description
    """
    self._ignore_key_changed = False

    def key_changed(settings, key):
        """Summary

        Parameters
        ----------
        settings : TYPE
            Description
        key : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        if self._ignore_key_changed:
            return

        self._ignore_prop_changed = True
        widget.set_property(prop, key_to_prop(self[key]))
        self._ignore_prop_changed = False

    def prop_changed(widget, param):
        """Summary

        Parameters
        ----------
        widget : TYPE
            Description
        param : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        if self._ignore_prop_changed:
            return

        self._ignore_key_changed = True
        self[key] = prop_to_key(widget.get_property(prop))
        self._ignore_key_changed = False

    if not (flags & (Gio.SettingsBindFlags.SET | Gio.SettingsBindFlags.GET)):  # ie Gio.SettingsBindFlags.DEFAULT
        flags |= Gio.SettingsBindFlags.SET | Gio.SettingsBindFlags.GET

    if flags & Gio.SettingsBindFlags.GET:
        key_changed(self, key)

        if not (flags & Gio.SettingsBindFlags.GET_NO_CHANGES):
            self.connect("changed::" + key, key_changed)

    if flags & Gio.SettingsBindFlags.SET:
        widget.connect("notify::" + prop, prop_changed)

    if not (flags & Gio.SettingsBindFlags.NO_SENSITIVITY):
        self.bind_writable(key, widget, "sensitive", False)


Gio.Settings.bind_with_mapping = bind_with_mapping
Gio.Settings.__setitem__ = __setitem__


# This class is not meant to be used directly - it is only a backend for the
# settings widgets to enable them to bind attributes to gsettings keys. To use
# the gesttings backend, simply add the "GSettings" prefix to the beginning
# of the widget class name. The arguments of the backended class will be
# (label, schema, key, any additional widget-specific args and keyword args).
# (Note: this only works for classes that are gsettings compatible.)
#
# If you wish to make a new widget available to be backended, place it in the
# CAN_BACKEND list. In addition, you will need to add the following attributes
# to the widget class:
#
# bind_dir - (Gio.SettingsBindFlags) flags to define the binding direction or
#            None if you don't want the setting bound (for example if the
#            setting effects multiple attributes)
# bind_prop - (string) the attribute in the widget that will be bound to the
#             setting. This property may be omitted if bind_dir is None
# bind_object - (optional) the object to which to bind to (only needed if the
#               attribute to be bound is not a property of self.content_widget)
# map_get, map_set - (function, optional) a function to map between setting and
#                    bound attribute. May also be passed as a keyword arg during
#                    instantiation. These will be ignored if bind_dir=None
# set_rounding - (function, optional) To be used to set the digits to round to
#                if the setting is an integer


class GSettingsBackend(object):

    """Summary
    """

    def attach_backend(self):
        """Summary
        """
        if hasattr(self, "set_rounding"):
            vtype = self.settings.get_value(self.pref_key).get_type_string()
            if vtype in ["i", "u"]:
                self.set_rounding(0)

        if hasattr(self, "bind_object"):
            bind_object = self.bind_object
        else:
            bind_object = self.content_widget

        if hasattr(self, "map_get") or hasattr(self, "map_set"):
            self.settings.bind_with_mapping(
                self.pref_key, bind_object, self.bind_prop, self.bind_dir, self.map_get, self.map_set)
        elif self.bind_dir is not None:
            self.settings.bind(self.pref_key, bind_object, self.bind_prop, self.bind_dir)
        else:
            self.settings.connect("changed::" + self.pref_key, self.on_setting_changed)
            self.settings.bind_writable(self.pref_key, bind_object, "sensitive", False)
            self.on_setting_changed()
            self.connect_widget_handlers()

    def set_value(self, value):
        """Summary

        Parameters
        ----------
        value : TYPE
            Description
        """
        self.settings[self.pref_key] = value

    def get_value(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        return self.settings[self.pref_key]

    def get_range(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        range = self.settings.get_range(self.pref_key)
        if range[0] == "range":
            return [range[1][0], range[1][1]]
        else:
            return None

    def on_setting_changed(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Description

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
            Description

        Raises
        ------
        NotImplementedError
            Description
        """
        if self.bind_dir is None:
            raise NotImplementedError(
                "SettingsWidget classes with no .bind_dir must implement connect_widget_handlers().")


def get_gsettings_schema(schema, xlet_meta={}):
    """Summary

    Parameters
    ----------
    schema : TYPE
        Description
    xlet_meta : TYPE
        Description

    Returns
    -------
    TYPE
        Description

    Raises
    ------
    Exception
        Description
    """
    xlet_path = xlet_meta.get("path", "")
    xlet_uuid = xlet_meta.get("uuid", "")

    # NOTE: If the schema contains the xlet UUID, search for it inside the xlet folder.
    if xlet_path and xlet_uuid in schema:
        schema_source = GioSSS.new_from_directory(
            xlet_path + "/schemas",
            GioSSS.get_default(),
            False
        )
    else:
        schema_source = GioSSS.get_default()

    schema_obj = schema_source.lookup(schema, False)

    if not schema_obj:
        raise Exception(
            "Schema '%s' could not be found for xlet '%s'. Please check your installation."
            % (schema, xlet_uuid)
        )

    return Gio.Settings(settings_schema=schema_obj)


def g_settings_factory(subclass):
    """Summary

    Parameters
    ----------
    subclass : TYPE
        Description
    """
    class NewClass(globals()[subclass], GSettingsBackend):

        """Summary

        Attributes
        ----------
        pref_key : TYPE
            Description
        settings : TYPE
            Description
        """

        def __init__(self, widget_attrs={}, widget_kwargs={}):
            """Summary

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
            schema = widget_attrs.get("schema", "")

            if schema not in settings_objects:  # noqa | SettingsWidgets
                settings_objects[schema] = get_gsettings_schema(schema, widget_attrs.get("xlet_meta"))  # noqa | SettingsWidgets

            self.settings = settings_objects[schema]  # noqa | SettingsWidgets

            if "map_get" in widget_kwargs:
                self.map_get = widget_kwargs["map_get"]
                del widget_kwargs["map_get"]
            if "map_set" in widget_kwargs:
                self.map_set = widget_kwargs["map_set"]
                del widget_kwargs["map_set"]

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


for widget in CAN_BACKEND:
    globals()["GSettings" + widget] = g_settings_factory(widget)


if __name__ == "__main__":
    pass
