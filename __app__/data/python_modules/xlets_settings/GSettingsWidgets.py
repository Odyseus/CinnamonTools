# -*- coding: utf-8 -*-
"""Slimmed down and functional module to handle gsettings from an xlet settings window.

Only exposed a limited set of widgets (Switch and ComboBox). I will add more if
the need arises.

It can handle schemas that aren't installed on a system.

Attributes
----------
CAN_BACKEND : list
    List of widgets that can be used to control settings.
GioSSS : Gio.SettingsSchemaSource
    A ``Gio.SettingsSchemaSource``.
"""
from gi.repository import GLib
from gi.repository import Gio

from . import exceptions
# NOTE: Only import __all__ when I expose more widgets.
# from .SettingsWidgets import *                                          # noqa
from .SettingsWidgets import ComboBox                                     # noqa
from .SettingsWidgets import JSON_SETTINGS_PROPERTIES_MAP                 # noqa
from .SettingsWidgets import Switch                                       # noqa
from .SettingsWidgets import gsettings_objects                            # noqa
from .common import handle_combobox_options

GioSSS = Gio.SettingsSchemaSource


# NOTE: JEESH!!! I hate import *!!!
__all__ = [  # noqa
    # NOTE: Defined in this module.
    "GSettingsComboBox",
    "GSettingsSwitch",
    # "GSettingsColorChooser",
    # "GSettingsEntry",
    # "GSettingsFileChooser",
    # "GSettingsIconChooser",
    # "GSettingsRange",
    # "GSettingsSoundFileChooser",
    # "GSettingsSpinButton",
    # "GSettingsTextView",
]

# NOTE: Do not enable widgets that I don't use for now.
# I only use the ComboBox and Switch widgets for the Debugging section of my xlets.
CAN_BACKEND = [
    "ComboBox",
    "Switch",
    # "ColorChooser",
    # "Entry",
    # "FileChooser",
    # "IconChooser",
    # "Range",
    # "SoundFileChooser",
    # "SpinButton",
    # "TextView",
]

# Monkey patch Gio.Settings object


def __setitem__(self, key, value):
    """Override :py:class:`Gio.Settings`'s ``__setitem__`` method.

    Parameters
    ----------
    key : str
        A gsettings key.
    value : int, str, list
        A value for a gsetting.

    Raises
    ------
    KeyError
        Unkmown key.
    ValueError
        Wrong value type.
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
        raise ValueError(f"value '{value}' for key '{key}' is outside of valid range")


def bind_with_mapping(self, pref_key, widget, prop, flags, map_get, map_set):
    """Override :py:class:`Gio.Settings`'s ``bind_with_mapping`` method.

    Parameters
    ----------
    pref_key : str
        A gsettings key.
    widget : Gtk.Widget
        An object to bind.
    prop : str
        The widget property to bind.
    flags : Gio.SettingsBindFlags
        ``Gio.SettingsBindFlags`` flags.
    map_get : method
        See ``map_set``.
    map_set : method
        A function to map between setting and bound attribute.
        May also be passed as a keyword argument during instantiation.
        These methods will be ignored if ``bind_dir = None``.
    """
    self._ignore_key_changed = False

    def key_changed(*args):
        """Key changed callback.

        Parameters
        ----------
        *args
            Arguments.

        Returns
        -------
        None
            Halt execution.
        """
        if self._ignore_key_changed:
            return

        self._ignore_prop_changed = True
        widget.set_property(prop, map_get(self[pref_key]))
        self._ignore_prop_changed = False

    def prop_changed(widget, *args):
        """On widget property changed.

        Parameters
        ----------
        widget : Gtk.Widget
            The widget to get the property value from.
        *args
            Arguments.

        Returns
        -------
        None
            Halt execution.
        """
        if self._ignore_prop_changed:
            return

        self._ignore_key_changed = True
        self[pref_key] = map_set(widget.get_property(prop))
        self._ignore_key_changed = False

    if not (flags & (Gio.SettingsBindFlags.SET | Gio.SettingsBindFlags.GET)
            ):  # ie Gio.SettingsBindFlags.DEFAULT
        flags |= Gio.SettingsBindFlags.SET | Gio.SettingsBindFlags.GET

    if flags & Gio.SettingsBindFlags.GET:
        key_changed(self, pref_key)

        if not (flags & Gio.SettingsBindFlags.GET_NO_CHANGES):
            self.connect(f"changed::{pref_key}", key_changed)

    if flags & Gio.SettingsBindFlags.SET:
        widget.connect(f"notify::{prop}", prop_changed)

    if not (flags & Gio.SettingsBindFlags.NO_SENSITIVITY):
        self.bind_writable(pref_key, widget, "sensitive", False)


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
    """gsettings backend.
    """

    def attach_backend(self):
        """Attach backend.
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
            self.settings.connect(f"changed::{self.pref_key}", self.on_setting_changed)
            self.settings.bind_writable(self.pref_key, bind_object, "sensitive", False)
            self.on_setting_changed()
            self.connect_widget_handlers()

    def set_value(self, value):
        """Set preference value.

        Parameters
        ----------
        value : str, int, list
            The new preference value.
        """
        self.settings[self.pref_key] = value

    def get_value(self):
        """Get preference value.

        Returns
        -------
        str, int, list
            The current preference value.
        """
        return self.settings[self.pref_key]

    def get_range(self):
        """Get minimum/maximum range for a preference.

        Returns
        -------
        list
            A list with two elements. Minimum value at index 0 and maximum value at index 1.
        """
        range = self.settings.get_range(self.pref_key)
        if range[0] == "range":
            return [range[1][0], range[1][1]]
        else:
            return None

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
        exceptions.MethodNotimplemented
            :any:`SettingsWidget` classes must implement this method.
        """
        raise exceptions.MethodNotimplemented("on_setting_changed")

    def connect_widget_handlers(self, *args):
        """This method triggers once when the widget factory function creates a new widget class
        from an instance of :any:`SettingsWidget` and :any:`GSettingsBackend`.

        Parameters
        ----------
        *args
            Arguments.

        Raises
        ------
        exceptions.MethodNotimplemented
            :any:`SettingsWidget` classes with no bind_dir property set must implement this method.
        """
        if self.bind_dir is None:
            raise exceptions.MethodNotimplemented("connect_widget_handlers")


def get_gsettings_schema(schema, xlet_meta={}):
    """Get gsettings schema.

    Parameters
    ----------
    schema : str
        A gsettings schema.
    xlet_meta : dict, optional
        An xlet metadata.

    Returns
    -------
    Gio.Settings
        A ``Gio.Settings``.

    Raises
    ------
    Exception
        Schema not found.
    """
    schema_source = None
    xlet_path = xlet_meta.get("path", "")
    xlet_uuid = xlet_meta.get("uuid", "")

    # NOTE: If the schema contains the xlet UUID, search for it inside the xlet folder.
    if xlet_path and xlet_uuid in schema:
        schema_source = GioSSS.new_from_directory(
            f"{xlet_path}/schemas",
            GioSSS.get_default(),
            False
        )

    if not schema_source:
        schema_source = GioSSS.get_default()

    schema_obj = schema_source.lookup(schema, False)

    if not schema_obj:
        raise Exception(
            f"Schema '{schema}' could not be found for xlet '{xlet_uuid}'. Please check your installation."
        )

    return Gio.Settings(settings_schema=schema_obj)


def g_settings_factory(subclass):
    """GSettings widgets factory.

    Parameters
    ----------
    subclass : str
        The class name of a :any:`SettingsWidgets` based instance.

    Returns
    -------
    class
        A new class based on ``subclass`` and ``GSettingsBackend``.

    Raises
    ------
    exceptions.CannotBackend
        The widget cannot be backended.
    """
    if subclass not in CAN_BACKEND:
        raise exceptions.CannotBackend(subclass)

    class NewClass(globals()[subclass], GSettingsBackend):
        """New backended widget class.

        Attributes
        ----------
        map_get : method
            See ``map_set``.
        map_set : method
            A function to map between setting and bound attribute.
            May also be passed as a keyword argument during instantiation.
            These methods will be ignored if ``bind_dir = None``.
        pref_key : str
            Preference key.
        settings : Gio.Settings
            A ``Gio.Settings`` instance.
        """

        def __init__(self, pref_key={}, schema="", xlet_meta={}, widget_kwargs={}):
            """Initialization.

            Parameters
            ----------
            pref_key : dict, optional
                The preference key to handle.
            schema : str, optional
                Schema to which pref_key belongs to.
            xlet_meta : dict, optional
                Xlet metadata.
            widget_kwargs : dict, optional
                Widget keyword arguments.
            """
            self.pref_key = pref_key
            schema = schema

            if schema not in gsettings_objects:
                gsettings_objects[schema] = get_gsettings_schema(schema, xlet_meta)

            self.settings = gsettings_objects[schema]

            if "map_get" in widget_kwargs:
                self.map_get = widget_kwargs["map_get"]
                del widget_kwargs["map_get"]
            if "map_set" in widget_kwargs:
                self.map_set = widget_kwargs["map_set"]
                del widget_kwargs["map_set"]

            kwargs = {}

            for k in widget_kwargs:
                if k in JSON_SETTINGS_PROPERTIES_MAP:
                    kwargs[JSON_SETTINGS_PROPERTIES_MAP[k]] = widget_kwargs[k]
                elif k == "options":
                    kwargs["options"] = handle_combobox_options(
                        options=widget_kwargs[k],
                        first_option=widget_kwargs.get("first-option", ""),
                        xlet_settings=self.settings
                    )

            super().__init__(**kwargs)
            self.attach_backend()

    return NewClass


for widget in CAN_BACKEND:
    globals()[f"GSettings{widget}"] = g_settings_factory(widget)


if __name__ == "__main__":
    pass
