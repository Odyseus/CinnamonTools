#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Settings widgets.

Attributes
----------
CAN_BACKEND : TYPE
    Description
JSON_SETTINGS_PROPERTIES_MAP : TYPE
    Description
settings_objects : dict
    Description
"""
import gi
import os

gi.require_version("Gtk", "3.0")
gi.require_version("Gdk", "3.0")
gi.require_version("GdkPixbuf", "2.0")

from gi.repository import GLib
from gi.repository import Gdk
from gi.repository import GdkPixbuf
from gi.repository import Gio
from gi.repository import Gtk
from gi.repository import Pango

from .IconChooserWidgets import IconChooserDialog
from .KeybindingWidgets import ButtonKeybinding
from .common import BaseGrid
from .common import _
from .common import display_message_dialog

# NOTE: JEESH!!! I hate import *!!!
__all__ = [
    "settings_objects",
    "JSON_SETTINGS_PROPERTIES_MAP",
    "Button",
    "CAN_BACKEND",
    "ColorChooser",
    "ComboBox",
    "Entry",
    "FileChooser",
    "IconChooser",
    "Keybinding",
    "KeybindingWithOptions",
    "SettingsSection",
    "SettingsLabel",
    "SettingsPage",
    "SettingsRevealer",
    "SettingsStack",
    "SettingsWidget",
    "SpinButton",
    "Switch",
    "Text",
    "TextView"
    # "DateChooser",
    # "EffectChooser",
    # "FontButton",
    # "Range",
    # "SoundFileChooser",
    # "TweenChooser"
]


JSON_SETTINGS_PROPERTIES_MAP = {
    # All widgets.
    "description": "label",
    # spinbutton: Minimum value.
    "min": "mini",
    # spinbutton: Maximum value.
    "max": "maxi",
    # spinbutton: Adjustment amount.
    "step": "step",
    # spinbutton: Adjustment amount when using the Page Up/Down keys.
    "page": "page",
    # spinbutton: How many digits to handle.
    "digits": "digits",
    # spinbutton: Unit type description.
    "units": "units",
    # scale: Show value on the widget.
    "show-value": "show_value",
    # filechooser: If true, enable folder selection of the file chooser. If false,
    # enable file selection.
    "select-dir": "dir_select",
    # textview: The height of the textview.
    "height": "height",
    # All widgets.
    "tooltip": "tooltip",
    # possible: List of effect name.
    "possible": "possible",
    # entry and iconfilechooser: If true, expand the widget to all available space.
    "expand-width": "expand_width",
    # list: Columns definition.
    "columns": "columns",
    # soundfilechooser: If True, only wav and ogg sound files will be filtered in
    # the file chooser dialog. If set to False, all sound files will be displayed.
    "event-sounds": "event_sounds",
    # list: Whether to display or not the the Up/Down buttons.
    "move-buttons": "move_buttons",
    # list: The default width of the Edit entry dialog.
    "dialog-width": "dialog_width",
    # list: Allow multiple rows selection.
    "multi-select": "multi_select",
    # list: Whether to close the settings window after applying.
    "apply-and-quit": "apply_and_quit",
    # keybinding: Expose the number of keybindings to create.
    "num-bind": "num_bind",
    # label: Whether to use markup.
    "use-markup": "use_markup",
    # list: An array of strings to be added as labels to the add/edit entry.
    "dialog-info-labels": "dialog_info_labels",
    # colorchooser: Whether to be able to specify opacity.
    "use-alpha": "use_alpha",
    # list: A dictionary that can be empty and accepts one key called ``read_only_keys``.
    # A list of column IDs whose created widgets should be set as nonsensitive.
    # An immutable list widget has a fixed amount of items.
    # Items cannot be added nor removed but they do can be edited.
    "immutable": "immutable",
    # textview: Whether the Tab key inserts a tab character (accept-tabs = true)
    # or the keyboard focus is moved (accept-tabs = false).
    "accept-tabs": "accept_tabs",
    # combobox: Explicit value type to convert an option key to.
    "valtype": "valtype",
    # combobox: A key from the "options" key for comboboxes. This key will be excluded from
    # the sorting of options and will appear always at the top of the combobox.
    # NOTE: Not passed as widget argument. Kept here just to keep it documented.
    "first-option": "first_option",
}

CAN_BACKEND = [
    "Button",
    "ColorChooser",
    "ComboBox",
    "Entry",
    "FileChooser",
    "IconChooser",
    "Keybinding",
    "KeybindingWithOptions",
    "List",
    "SpinButton",
    "Switch",
    "TextView",
    # "DateChooser",
    # "EffectChooser",
    # "FontButton",
    # "Range",
    # "SoundFileChooser",
    # "TweenChooser"
]

settings_objects = {}


class SettingsStack(Gtk.Stack):
    """Summary

    Attributes
    ----------
    expand : bool
        Description
    """

    def __init__(self):
        """Initialization.
        """
        super().__init__()
        self.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT_RIGHT)
        self.set_transition_duration(150)
        self.expand = True


class SettingsPage(BaseGrid):
    """Summary
    """

    def __init__(self):
        """Initialization.
        """
        super().__init__()
        self.set_spacing(15, 15)
        self.set_property("expand", True)
        self.set_property("margin", 15)
        self.set_border_width(0)

    def add_section(self, title=None, subtitle=None, section_info={}):
        """Summary

        Parameters
        ----------
        title : None, optional
            Description
        subtitle : None, optional
            Description
        section_info : dict, optional
            Description

        Returns
        -------
        TYPE
            Description
        """
        section = SettingsSection(title, subtitle, section_info)
        self.add(section)

        return section

    def add_reveal_section(self, title=None, subtitle=None, section_info={},
                           schema=None, pref_key=None, values=None, revealer=None):
        """Summary

        Parameters
        ----------
        title : None, optional
            Description
        subtitle : None, optional
            Description
        section_info : dict, optional
            Description
        schema : None, optional
            Description
        pref_key : None, optional
            Description
        values : None, optional
            Description
        revealer : None, optional
            Description

        Returns
        -------
        TYPE
            Description
        """
        section = SettingsSection(title, subtitle, section_info)

        if revealer is None:
            revealer = SettingsRevealer(schema, pref_key, values)

        revealer.add(section)
        section._revealer = revealer
        self.add(revealer)

        return section


class SettingsSection(BaseGrid):

    """Summary

    Attributes
    ----------
    always_show : bool
        Description
    box : TYPE
        Description
    frame : TYPE
        Description
    need_separator : bool
        Description
    revealers : list
        Description
    size_group : TYPE
        Description
    """
    def __init__(self, title=None, subtitle=None, section_info={}):
        """Initialization.

        Parameters
        ----------
        title : None, optional
            Description
        subtitle : None, optional
            Description
        section_info : dict, optional
            Description
        """
        super().__init__()
        self.set_spacing(10, 10)

        self.always_show = False
        self.revealers = []

        if title or subtitle:
            header_box = BaseGrid()
            header_box.set_spacing(10, 10)
            self.add(header_box)

            if title:
                label = Gtk.Label()
                label.set_property("wrap", True)
                label.set_property("wrap-mode", Pango.WrapMode.WORD)
                label.set_hexpand(True)
                label.set_markup("<b>%s</b>" % title)
                label.set_xalign(0.0)
                header_box.attach(label, 0, 0, 1, 1)

                if section_info:
                    button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
                        ("dialog-%s-symbolic" % section_info.get("context", "information")),
                        Gtk.IconSize.BUTTON
                    ))
                    button.set_relief(Gtk.ReliefStyle.NONE)
                    button.set_always_show_image(True)
                    button.set_tooltip_text(_("Information related to this specific section"))
                    button.connect("clicked", display_message_dialog,
                                   title, section_info.get("message", ""),
                                   section_info.get("context", "information"))
                    header_box.attach(button, 1, 0, 1, 1)

            if subtitle:
                sub = Gtk.Label()
                sub.set_property("wrap", True)
                sub.set_property("wrap-mode", Pango.WrapMode.WORD)
                sub.set_text(subtitle)
                sub.get_style_context().add_class(Gtk.STYLE_CLASS_DIM_LABEL)
                sub.set_xalign(0.0)
                header_box.attach(sub, 0, 1, 1, 1)

        self.frame = Gtk.Frame()
        self.frame.set_no_show_all(True)
        self.frame.set_shadow_type(Gtk.ShadowType.IN)
        self.frame.get_style_context().add_class(Gtk.STYLE_CLASS_VIEW)

        self.size_group = Gtk.SizeGroup()
        self.size_group.set_mode(Gtk.SizeGroupMode.VERTICAL)

        self.box = BaseGrid()
        self.frame.add(self.box)
        self.add(self.frame)

        self.need_separator = False

    def add_row(self, widget, col_pos, row_pos, col_span, row_span):
        """Summary

        Parameters
        ----------
        widget : TYPE
            Description
        col_pos : TYPE
            Description
        row_pos : TYPE
            Description
        col_span : TYPE
            Description
        row_span : TYPE
            Description
        """
        list_box = Gtk.ListBox(can_focus=False)
        list_box.set_selection_mode(Gtk.SelectionMode.NONE)
        row = Gtk.ListBoxRow(can_focus=False)
        row.add(widget)

        if self.need_separator:
            list_box.add(Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL))

        if isinstance(widget, (Switch, ColorChooser)):
            list_box.connect("row-activated", widget.clicked)

        # NOTE: I was forced to use this condition because it was impossible for
        # the content of the TextView to be edited. It was necessary to triple
        # click it to gain access to it or being focused with keyboard navigation.
        # With this callback set to the list_box, the TextView content can directly
        # be accessed with a single click.
        if isinstance(widget, TextView):
            list_box.connect("row-activated", widget.focus_the_retarded_text_view)

        list_box.add(row)

        self.box.attach(list_box, col_pos, row_pos, col_span, row_span)

        self.update_always_show_state()

        self.need_separator = True

    def add_reveal_row(self, widget, col_pos, row_pos, col_span, row_span,
                       schema=None, pref_key=None, values=None, check_func=None, revealer=None):
        """Summary

        Parameters
        ----------
        widget : TYPE
            Description
        col_pos : TYPE
            Description
        row_pos : TYPE
            Description
        col_span : TYPE
            Description
        row_span : TYPE
            Description
        schema : None, optional
            Description
        pref_key : None, optional
            Description
        values : None, optional
            Description
        check_func : None, optional
            Description
        revealer : None, optional
            Description

        Returns
        -------
        TYPE
            Description
        """
        list_box = Gtk.ListBox(can_focus=False)
        list_box.set_selection_mode(Gtk.SelectionMode.NONE)

        if self.need_separator:
            list_box.add(Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL))

        row = Gtk.ListBoxRow(can_focus=False)
        row.add(widget)

        if isinstance(widget, (Switch, ColorChooser)):
            list_box.connect("row-activated", widget.clicked)

        list_box.add(row)

        if revealer is None:
            revealer = SettingsRevealer(schema, pref_key, values, check_func)

        widget.revealer = revealer
        revealer.add(list_box)
        self.box.attach(revealer, col_pos, row_pos, col_span, row_span)

        self.need_separator = True

        self.revealers.append(revealer)

        if not self.always_show:
            revealer.notify_id = revealer.connect('notify::child-revealed', self.check_reveal_state)
            self.check_reveal_state()

        return revealer

    def add_note(self, text):
        """Summary

        Parameters
        ----------
        text : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        label = Gtk.Label()
        label.set_property("wrap", True)
        label.set_property("wrap-mode", Pango.WrapMode.WORD)
        label.set_xalign(0.0)
        label.set_markup(text)
        label.set_line_wrap(True)
        self.add(label)

        return label

    def update_always_show_state(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        if self.always_show:
            return

        self.frame.set_no_show_all(False)
        self.frame.show_all()
        self.always_show = True

        for revealer in self.revealers:
            revealer.disconnect(revealer.notify_id)

    def check_reveal_state(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Description

        Returns
        -------
        TYPE
            Description
        """
        for revealer in self.revealers:
            if revealer.props.child_revealed:
                self.box.show_all()
                self.frame.show()
                return

        self.frame.hide()


class SettingsRevealer(Gtk.Revealer):
    """Summary

    Attributes
    ----------
    box : TYPE
        Description
    check_func : TYPE
        Description
    settings : TYPE
        Description
    values : TYPE
        Description

    Note
    ----
    Not used for now.
    """

    def __init__(self, schema=None, pref_key=None, values=None, check_func=None):
        """Initialization.

        Parameters
        ----------
        schema : None, optional
            Description
        pref_key : None, optional
            Description
        values : None, optional
            Description
        check_func : None, optional
            Description
        """
        Gtk.Revealer.__init__(self)

        self.check_func = check_func

        self.box = BaseGrid(spacing=15)
        Gtk.Revealer.add(self, self.box)

        self.set_transition_type(Gtk.RevealerTransitionType.SLIDE_DOWN)
        self.set_transition_duration(150)

        if schema:
            self.settings = Gio.Settings.new(schema)
            # if there aren't values or a function provided to determine visibility we can do a simple bind
            if values is None and check_func is None:
                self.settings.bind(pref_key, self, "reveal-child", Gio.SettingsBindFlags.GET)
            else:
                self.values = values
                self.settings.connect("changed::" + pref_key, self.on_settings_changed)
                self.on_settings_changed(self.settings, pref_key)

    def add(self, widget):
        """Summary

        Parameters
        ----------
        widget : object
            See : :py:class:`Gtk.Widget`.
        """
        self.box.attach(widget, 0, 0, 1, 1)

    # only used when checking values
    def on_settings_changed(self, settings, key):
        """Summary

        Parameters
        ----------
        settings : TYPE
            Description
        key : TYPE
            Description
        """
        value = settings.get_value(key).unpack()
        if self.check_func is None:
            self.set_reveal_child(value in self.values)
        else:
            self.set_reveal_child(self.check_func(value, self.values))


class SettingsWidget(BaseGrid):
    """Summary
    """

    def __init__(self, dep_key=None):
        """Initialization.

        Parameters
        ----------
        dep_key : None, optional
            Description
        """
        super().__init__(orientation=Gtk.Orientation.HORIZONTAL)
        self.set_spacing(5, 5)

        if dep_key:
            self.set_dep_key(dep_key)

    def set_dep_key(self, dep_key):
        """Summary

        Parameters
        ----------
        dep_key : TYPE
            Description
        """
        flag = Gio.SettingsBindFlags.GET
        if dep_key[0] == "!":
            dep_key = dep_key[1:]
            flag |= Gio.Settings.BindFlags.INVERT_BOOLEAN

        split = dep_key.split("/")
        dep_settings = Gio.Settings.new(split[0])
        dep_settings.bind(split[1], self, "sensitive", flag)

    def add_to_size_group(self, group):
        """Summary

        Parameters
        ----------
        group : TYPE
            Description
        """
        group.add_widget(self.content_widget)

    def fill_row(self):
        """Summary
        """
        self.set_border_width(0)
        self.set_margin_start(0)
        self.set_margin_end(0)

    def get_settings(self, schema):
        """Summary

        Parameters
        ----------
        schema : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        global settings_objects
        try:
            return settings_objects[schema]
        except Exception:
            settings_objects[schema] = Gio.Settings.new(schema)
            return settings_objects[schema]


class Text(SettingsWidget):
    """Summary

    Attributes
    ----------
    content_widget : TYPE
        Description
    label : TYPE
        Description
    """

    def __init__(self, label, align=Gtk.Align.START, use_markup=False):
        """Initialization.

        Parameters
        ----------
        label : TYPE
            Description
        align : TYPE, optional
            Description
        use_markup : bool, optional
            Description
        """
        super().__init__()
        self.label = label

        if align == Gtk.Align.END:
            xalign = 1.0
            justification = Gtk.Justification.RIGHT
        elif align == Gtk.Align.CENTER:
            xalign = 0.5
            justification = Gtk.Justification.CENTER
        else:  # START and FILL align left
            xalign = 0
            justification = Gtk.Justification.LEFT

        self.content_widget = Gtk.Label(halign=align, xalign=xalign, justify=justification)
        self.content_widget.set_property("wrap", True)
        self.content_widget.set_property("wrap-mode", Pango.WrapMode.WORD)
        self.content_widget.set_line_wrap(True)

        if use_markup:
            # NOTE: The label should be escaped where it is needed in the
            # label declaration side.
            self.content_widget.set_markup(label)
        else:
            self.content_widget.set_label(label)

        self.attach(self.content_widget, 0, 0, 1, 1)


class Button(SettingsWidget):
    """Summary

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    content_widget : TYPE
        Description
    label : TYPE
        Description
    """

    bind_dir = None

    def __init__(self, label, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : TYPE
            Description
        tooltip : str, optional
            Description
        """
        super().__init__()
        self.label = label

        self.content_widget = Gtk.Button(label=label, valign=Gtk.Align.CENTER)
        self.attach(self.content_widget, 0, 0, 2, 1)
        self.content_widget.set_hexpand(True)

        self.set_tooltip_text(tooltip)

    def _on_button_clicked(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.set_value(not self.get_value())

    def set_label(self, label):
        """Summary

        Parameters
        ----------
        label : TYPE
            Description
        """
        self.label = label
        self.content_widget.set_label(label)

    def connect_widget_handlers(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("clicked", self._on_button_clicked)

    def on_setting_changed(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        pass


class SettingsLabel(Gtk.Label):
    """Summary
    """

    def __init__(self, text=None, use_markup=False):
        """Initialization.

        Parameters
        ----------
        text : None, optional
            Description
        use_markup : bool, optional
            Description
        """
        super().__init__()

        if use_markup:
            self.set_markup(text)
        else:
            self.set_label(text)

        self.set_alignment(0.0, 0.5)
        self.set_property("wrap", True)
        self.set_property("wrap-mode", Pango.WrapMode.WORD)

    def set_label_text(self, text):
        """Summary

        Parameters
        ----------
        text : TYPE
            Description
        """
        self.set_label(text)

    def set_label_markup(self, markup):
        """Summary

        Parameters
        ----------
        markup : TYPE
            Description
        """
        self.set_markup(markup)


class IconChooser(SettingsWidget):
    """Summary

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    bind_object : TYPE
        Description
    bind_prop : str
        Description
    content_widget : TYPE
        Description
    handler : TYPE
        Description
    label : TYPE
        Description
    main_app : TYPE
        Description
    """

    bind_prop = "text"
    bind_dir = Gio.SettingsBindFlags.DEFAULT

    def __init__(self, label, expand_width=True, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : TYPE
            Description
        expand_width : bool, optional
            Description
        size_group : None, optional
            Description
        dep_key : None, optional
            Description
        tooltip : str, optional
            Description
        """
        super().__init__(dep_key=dep_key)
        self._timer = None
        self.main_app = None
        valid, self.width, self.height = Gtk.icon_size_lookup(Gtk.IconSize.BUTTON)

        self.label = SettingsLabel(label)

        self.content_widget = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        self.content_widget.set_spacing(5, 0)
        self.content_widget.set_hexpand(True)
        self.content_widget.set_valign(Gtk.Align.CENTER)
        self.bind_object = Gtk.Entry()
        self.bind_object.set_hexpand(True)
        button = Gtk.Button()

        self._preview_image = Gtk.Image.new()
        button.set_image(self._preview_image)

        self.content_widget.attach(self.bind_object, 0, 0, 1, 1)
        self.content_widget.attach(button, 1, 0, 1, 1)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        button.connect("clicked", self._on_button_pressed)
        self.handler = self.bind_object.connect("changed", self._set_widget_icon)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

        self._set_widget_icon()

    def _set_widget_icon(self, *args):
        """Set widget icon.

        Parameters
        ----------
        *args
            Arguments.
        """
        def apply(self):
            """Delayed apply.
            """
            val = self.bind_object.get_text().strip()

            if val:
                # NOTE: Check for the existence of "/" first so os.path.isfile() is not called unnecessarily.
                if "/" in val and os.path.isfile(val):
                    img = GdkPixbuf.Pixbuf.new_from_file_at_size(val, self.width, self.height)
                    self._preview_image.set_from_pixbuf(img)
                else:
                    self._preview_image.set_from_icon_name(val, Gtk.IconSize.BUTTON)
            else:
                self._preview_image.set_from_icon_name("image-missing", Gtk.IconSize.BUTTON)

            self._timer = None

        if self._timer:
            GLib.source_remove(self._timer)

        self._timer = GLib.timeout_add(300, apply, self)

    def _on_button_pressed(self, widget):
        """Summary

        Parameters
        ----------
        widget : TYPE
            Description
        """
        dialog = IconChooserDialog(transient_for=self.get_toplevel())
        dialog.set_main_app(self.main_app)
        search_term = self.get_value() if self.get_value() is not None else ""
        dialog.set_search_term(search_term)

        response = dialog.run()  # Return either an icon name, an icon path or None.

        if response is not None:
            self.bind_object.set_text(response)
            self.set_value(response)

        dialog.destroy()


class Entry(SettingsWidget):
    """Summary

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    bind_prop : str
        Description
    content_widget : TYPE
        Description
    label : TYPE
        Description
    """

    bind_prop = "text"
    bind_dir = Gio.SettingsBindFlags.DEFAULT

    def __init__(self, label, expand_width=True, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : TYPE
            Description
        expand_width : bool, optional
            Description
        size_group : None, optional
            Description
        dep_key : None, optional
            Description
        tooltip : str, optional
            Description
        """
        super().__init__(dep_key=dep_key)

        self.label = SettingsLabel(label)
        self.content_widget = Gtk.Entry(valign=Gtk.Align.CENTER)
        self.content_widget.set_hexpand(expand_width)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)


class TextView(SettingsWidget):
    """Summary

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    bind_object : TYPE
        Description
    bind_prop : str
        Description
    content_widget : TYPE
        Description
    label : TYPE
        Description
    scrolledwindow : TYPE
        Description
    """

    bind_prop = "text"
    bind_dir = Gio.SettingsBindFlags.DEFAULT

    def __init__(self, label, height=200, accept_tabs=False, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : TYPE
            Description
        height : int, optional
            Description
        accept_tabs : bool, optional
            Description
        dep_key : None, optional
            Description
        tooltip : str, optional
            Description
        """
        super().__init__(dep_key=dep_key)

        self.label = SettingsLabel(label)
        self.label.set_alignment(0.5, 0.5)

        self.scrolledwindow = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
        self.scrolledwindow.set_size_request(width=-1, height=height)
        self.scrolledwindow.set_policy(hscrollbar_policy=Gtk.PolicyType.AUTOMATIC,
                                       vscrollbar_policy=Gtk.PolicyType.AUTOMATIC)
        self.scrolledwindow.set_shadow_type(type=Gtk.ShadowType.ETCHED_IN)
        self.content_widget = Gtk.TextView()
        self.content_widget.set_accepts_tab(accept_tabs)
        self.content_widget.set_border_width(3)
        self.content_widget.set_hexpand(True)
        self.content_widget.set_wrap_mode(wrap_mode=Gtk.WrapMode.NONE)
        self.bind_object = self.content_widget.get_buffer()

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.scrolledwindow, 0, 1, 1, 1)
        self.scrolledwindow.add(self.content_widget)

        self.set_tooltip_text(tooltip)

    def focus_the_retarded_text_view(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.

        Returns
        -------
        TYPE
            Description
        """
        self.content_widget.grab_focus()
        return False


class Switch(SettingsWidget):
    """Summary

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    bind_prop : str
        Description
    content_widget : TYPE
        Description
    label : TYPE
        Description
    """

    bind_prop = "active"
    bind_dir = Gio.SettingsBindFlags.DEFAULT

    def __init__(self, label, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : TYPE
            Description
        dep_key : None, optional
            Description
        tooltip : str, optional
            Description
        """
        super().__init__(dep_key=dep_key)

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)
        self.content_widget = Gtk.Switch(valign=Gtk.Align.CENTER)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        self.set_tooltip_text(tooltip)

    def clicked(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        if self.is_sensitive():
            self.content_widget.set_active(not self.content_widget.get_active())


class ComboBox(SettingsWidget):
    """Summary

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    content_widget : TYPE
        Description
    label : TYPE
        Description
    model : TYPE
        Description
    value : TYPE
        Description
    """

    bind_dir = None

    def __init__(self, label, options=[], valtype=None, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : TYPE
            Description
        options : list, optional
            Description
        valtype : None, optional
            Description
        size_group : None, optional
            Description
        dep_key : None, optional
            Description
        tooltip : str, optional
            Description
        """
        super().__init__()

        self._valtype = valtype
        self._option_map = {}

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)

        self.content_widget = Gtk.ComboBox(valign=Gtk.Align.CENTER)
        renderer_text = Gtk.CellRendererText()
        self.content_widget.pack_start(renderer_text, True)
        self.content_widget.add_attribute(renderer_text, "text", 1)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        self._set_options(options)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def _on_my_value_changed(self, widget):
        """Summary

        Parameters
        ----------
        widget : TYPE
            Description
        """
        tree_iter = widget.get_active_iter()
        if tree_iter is not None:
            self.value = self.model[tree_iter][0]
            self.set_value(self.value)

    def _set_options(self, options):
        """Summary

        Parameters
        ----------
        options : TYPE
            Description
        """
        if self._valtype is not None:
            var_type = self._valtype
        else:
            # assume all keys are the same type (mixing types is going to cause an error somewhere)
            var_type = type(options[0][0])

        self.model = Gtk.ListStore(var_type, str)

        for option in options:
            self._option_map[var_type(option[0])] = self.model.append(
                [var_type(option[0]), option[1]])

        self.content_widget.set_model(self.model)
        self.content_widget.set_id_column(0)

    def on_setting_changed(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.value = self.get_value()
        try:
            self.content_widget.set_active_iter(self._option_map[self.value])
        except Exception:
            self.content_widget.set_active_iter(None)

    def connect_widget_handlers(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("changed", self._on_my_value_changed)


class ColorChooser(SettingsWidget):
    """Summary

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    content_widget : TYPE
        Description
    label : TYPE
        Description
    """

    bind_dir = None

    def __init__(self, label, use_alpha=True, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : TYPE
            Description
        use_alpha : bool, optional
            Description
        size_group : None, optional
            Description
        dep_key : None, optional
            Description
        tooltip : str, optional
            Description
        """
        super().__init__(dep_key=dep_key)

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)
        self.content_widget = Gtk.ColorButton()
        self.content_widget.set_use_alpha(use_alpha)
        self._clear_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
            "edit-clear-symbolic",
            Gtk.IconSize.BUTTON
        ))
        self._clear_button.set_tooltip_text(_("Clear color"))
        self._clear_button.set_valign(Gtk.Align.CENTER)
        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self._clear_button, 1, 0, 1, 1)
        self.attach(self.content_widget, 2, 0, 1, 1)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def _on_clear_button_clicked(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.set_value("")
        self._set_widget_color("")

    def _on_color_set(self, widget):
        """Summary

        Parameters
        ----------
        widget : TYPE
            Description
        """
        self.set_value(self.content_widget.get_rgba().to_string())

    def _set_widget_color(self, color_string):
        """Summary

        Parameters
        ----------
        widget : TYPE
            Description
        """
        # NOTE: Luckyly, empty strings will set the color to white.
        rgba = Gdk.RGBA()
        rgba.parse(color_string)
        # NOTE: set_rgba sets RGBA and RGB.
        self.content_widget.set_rgba(rgba)

    def clicked(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.do_clicked(self.content_widget)

    def on_setting_changed(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self._set_widget_color(self.get_value())

    def connect_widget_handlers(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("color-set", self._on_color_set)
        self._clear_button.connect("clicked", self._on_clear_button_clicked)


class FileChooser(SettingsWidget):
    """Summary

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    content_widget : TYPE
        Description
    label : TYPE
        Description
    """

    bind_dir = None

    def __init__(self, label, dir_select=False, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : TYPE
            Description
        dir_select : bool, optional
            Description
        size_group : None, optional
            Description
        dep_key : None, optional
            Description
        tooltip : str, optional
            Description
        """
        super().__init__(dep_key=dep_key)
        if dir_select:
            action = Gtk.FileChooserAction.SELECT_FOLDER
        else:
            action = Gtk.FileChooserAction.OPEN

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)
        self._clear_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
            "edit-clear-symbolic",
            Gtk.IconSize.BUTTON
        ))
        self.content_widget = Gtk.FileChooserButton(action=action, valign=Gtk.Align.CENTER)
        self._clear_button.set_tooltip_text(_("Clear path"))
        self._clear_button.set_valign(Gtk.Align.CENTER)
        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self._clear_button, 1, 0, 1, 1)
        self.attach(self.content_widget, 2, 0, 1, 1)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def _on_file_selected(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.set_value(self.content_widget.get_uri())

    def _on_clear_button_clicked(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.set_value("")
        self.content_widget.set_uri("")

    def on_setting_changed(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.set_uri(self.get_value())

    def connect_widget_handlers(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("file-set", self._on_file_selected)
        self._clear_button.connect("clicked", self._on_clear_button_clicked)


class SpinButton(SettingsWidget):
    """Summary

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    bind_prop : str
        Description
    content_widget : TYPE
        Description
    label : TYPE
        Description
    """

    bind_prop = "value"
    bind_dir = Gio.SettingsBindFlags.GET

    def __init__(self, label, units="", mini=None, maxi=None, step=1, page=None, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : TYPE
            Description
        units : str, optional
            Description
        mini : None, optional
            Description
        maxi : None, optional
            Description
        step : int, optional
            Description
        page : None, optional
            Description
        size_group : None, optional
            Description
        dep_key : None, optional
            Description
        tooltip : str, optional
            Description
        """
        super().__init__(dep_key=dep_key)

        self._timer = None

        if units:
            label += " (%s)" % units

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)
        self.content_widget = Gtk.SpinButton(valign=Gtk.Align.CENTER)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        # NOTE: The original implementation calls get_range to get the min and max values
        # defined in the settings-schema.json file. Since I mostly use generic settings, I don't
        # specify any properties in the settings-schema.json file for spinbuttons. Due to
        # this, calling get_range raises an exception. In this case, just use the mini and maxi
        # parameters and move on.
        try:
            range = self.get_range()
        except Exception:
            range = [mini, maxi]

        if mini is None or maxi is None:
            mini = range[0]
            maxi = range[1]
        elif range is not None:
            mini = max(mini, range[0])
            maxi = min(maxi, range[1])

        if not page:
            page = step

        self.content_widget.set_range(mini, maxi)
        self.content_widget.set_increments(step, page)

        digits = 0
        if (step and "." in str(step)):
            digits = len(str(step).split(".")[1])
        self.content_widget.set_digits(digits)

        self.content_widget.connect("value-changed", self._apply_later)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def _apply_later(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        def apply(self):
            """Delayed apply.
            """
            self.set_value(self.content_widget.get_value())
            self._timer = None

        if self._timer:
            GLib.source_remove(self._timer)

        self._timer = GLib.timeout_add(300, apply, self)


class Keybinding(SettingsWidget):
    """Summary

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    content_widget : TYPE
        Description
    label : TYPE
        Description
    """

    bind_dir = None

    def __init__(self, label, num_bind=1, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : TYPE
            Description
        num_bind : int, optional
            Description
        size_group : None, optional
            Description
        dep_key : None, optional
            Description
        tooltip : str, optional
            Description
        """
        super().__init__(dep_key=dep_key)

        self._num_bind = num_bind
        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)

        self._kb_buttons = []

        self.content_widget = Gtk.Frame(shadow_type=Gtk.ShadowType.IN, valign=Gtk.Align.CENTER)
        box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        self.content_widget.add(box)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        for x in range(self._num_bind):
            if x != 0:
                box.add(Gtk.Separator(orientation=Gtk.Orientation.VERTICAL))
            kb = ButtonKeybinding()
            kb.set_size_request(150, -1)
            kb.connect("accel-edited", self._on_kb_changed)
            kb.connect("accel-cleared", self._on_kb_changed)
            box.attach(kb, x, 0, 1, 1)
            self._kb_buttons.append(kb)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def _on_kb_changed(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        bindings = []

        for x in range(self._num_bind):
            string = self._kb_buttons[x].get_accel_string()
            bindings.append(string)

        self.set_value("::".join(bindings))

    def on_setting_changed(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        value = self.get_value()
        bindings = value.split("::")

        for x in range(min(len(bindings), self._num_bind)):
            self._kb_buttons[x].set_accel_string(bindings[x])

    def connect_widget_handlers(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        pass


class KeybindingWithOptions(SettingsWidget):
    """Summary

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    content_widget : TYPE
        Description
    label : TYPE
        Description
    model : TYPE
        Description
    value : TYPE
        Description
    """

    bind_dir = None

    def __init__(self, label, options=[], valtype=None, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : TYPE
            Description
        options : list, optional
            Description
        valtype : None, optional
            Description
        size_group : None, optional
            Description
        dep_key : None, optional
            Description
        tooltip : str, optional
            Description
        """
        super().__init__(dep_key=dep_key)

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)

        self._valtype = valtype
        self._option_map = {}

        self.content_widget = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        kb_box = Gtk.Frame(shadow_type=Gtk.ShadowType.IN)
        kb_box.set_valign(Gtk.Align.CENTER)

        self._kb_button = ButtonKeybinding()
        self._kb_button.set_size_request(150, -1)
        kb_box.add(self._kb_button)

        self._combo_button = Gtk.ComboBox()
        renderer_text = Gtk.CellRendererText()
        self._combo_button.pack_start(renderer_text, True)
        self._combo_button.add_attribute(renderer_text, "text", 1)
        self._combo_button.set_valign(Gtk.Align.CENTER)

        self.content_widget.attach(kb_box, 0, 0, 1, 1)
        self.content_widget.attach(Gtk.Separator(orientation=Gtk.Orientation.VERTICAL), 1, 0, 1, 1)
        self.content_widget.attach(self._combo_button, 2, 0, 1, 1)

        self._set_options(options)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def _on_kb_changed(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        try:
            kb, opt = self.get_value().split("::")
        except Exception:
            kb, opt = "", ""  # noqa

        self.set_value(self._kb_button.get_accel_string() + "::" + opt)

    def _on_combo_value_changed(self, combo):
        """Summary

        Parameters
        ----------
        combo : TYPE
            Description
        """
        tree_iter = combo.get_active_iter()

        if tree_iter is not None:
            self.value = self._kb_button.get_accel_string() + "::" + self.model[tree_iter][0]
            self.set_value(self.value)

    def _set_options(self, options):
        """Summary

        Parameters
        ----------
        options : TYPE
            Description
        """
        if self._valtype is not None:
            var_type = self._valtype
        else:
            var_type = type(options[0][0])

        self.model = Gtk.ListStore(var_type, str)

        for option in options:
            self._option_map[var_type(option[0])] = self.model.append(
                [var_type(option[0]), option[1]])

        self._combo_button.set_model(self.model)
        self._combo_button.set_id_column(0)

    def on_setting_changed(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.value = self.get_value()

        try:
            binding, option = self.value.split("::")
        except Exception:
            binding, option = "", ""

        self._kb_button.set_accel_string(binding)

        try:
            self._combo_button.set_active_iter(self._option_map[option])
        except Exception:
            self._combo_button.set_active_iter(None)

    def connect_widget_handlers(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self._kb_button.connect("accel-edited", self._on_kb_changed)
        self._kb_button.connect("accel-cleared", self._on_kb_changed)
        self._combo_button.connect("changed", self._on_combo_value_changed)


if __name__ == "__main__":
    pass
