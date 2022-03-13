#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Settings widgets.

Attributes
----------
CAN_BACKEND : list
    List of widgets that can be used to control settings.
gsettings_objects : dict
    Storage for instantiated :py:class:`Gio.Settings` instances.
JSON_SETTINGS_PROPERTIES_MAP : dict
    JSON attribute to Python keywords argument map used by the settings widgets.
"""
import gi
import math
import os

gi.require_version("Gtk", "3.0")
gi.require_version("Gdk", "3.0")

from gi.repository import GLib
from gi.repository import GObject
from gi.repository import Gdk
from gi.repository import Gio
from gi.repository import Gtk
from gi.repository import Pango

from .IconChooserWidgets import IconChooserButton
from .KeybindingWidgets import ButtonKeybinding
from .common import BaseGrid
from .common import IntelligentGtkDialog
from .common import _
from .common import display_message_dialog
from .common import get_global
from .common import get_toplevel_window

# NOTE: JEESH!!! I hate import *!!!
__all__ = [
    "Button",
    "ButtonsGroup",
    "CAN_BACKEND",
    "ColorChooser",
    "ComboBox",
    "Entry",
    "FileChooser",
    "gsettings_objects",
    "IconChooser",
    "JSON_SETTINGS_PROPERTIES_MAP",
    "Keybinding",
    "KeybindingWithOptions",
    "Range",
    "SettingsLabel",
    "SettingsPage",
    "SettingsRevealer",
    "SettingsSection",
    "SettingsStack",
    "SettingsWidget",
    "SoundFileChooser",
    "SpinButton",
    "StringsList",
    "Switch",
    "Text",
    "TextView",
    "TextViewButton",
    # "DateChooser",
    # "EffectChooser",
    # "FontButton",
    # "TweenChooser",
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
    # scale: Set a custom label to display as a minimum value.
    "min-label": "min_label",
    # scale: Set a custom label to display as a maximum value.
    "max-label": "max_label",
    # scale:
    "invert": "invert",
    # scale:
    "marks": "marks",
    # filechooser: If true, enable folder selection of the file chooser. If false,
    # enable file selection.
    "select-dir": "dir_select",
    # filechooser: A dictionary of filter labels mapped to a list of file patterns.
    "pattern-filters": "pattern_filters",
    # filechooser: A dictionary of filter labels mapped to a list of file MIME types.
    "mimetype-filters": "mimetype_filters",
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
    # label: Whether to make the label selectable to be able to copy text.
    "selectable": "selectable",
    # list: An array of strings to be added as labels to the add/edit entry.
    "dialog-info-labels": "dialog_info_labels",
    # colorchooser: Whether to be able to specify opacity.
    "use-alpha": "use_alpha",
    # list: A dictionary that can be empty and accepts one key called ``read-only-keys``.
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
    # "first-option": "first_option",
    # button: Image for a button.
    "image": "image",
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
    "Range",
    "SoundFileChooser",
    "SpinButton",
    "StringsList",
    "Switch",
    "TextView",
    "TextViewButton",
    "TreeList",
    # "DateChooser",
    # "EffectChooser",
    # "FontButton",
    # "TweenChooser",
]

gsettings_objects = {}


class SettingsStack(Gtk.Stack):
    """The stack used to switch xlets instances.

    Attributes
    ----------
    expand : bool
        Expand.
    """

    def __init__(self):
        """Initialization.
        """
        super().__init__()
        self.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT_RIGHT)
        self.set_transition_duration(150)
        self.expand = True


class SettingsPage(BaseGrid):
    """Settings sections holder.
    """

    def __init__(self):
        """Initialization.
        """
        super().__init__()
        self.set_spacing(15, 15)
        # NOTE: Set property to avoid calling 2 methods.
        self.set_property("expand", True)
        # NOTE: Set property to avoid calling 4 methods.
        self.set_property("margin", 15)
        self.set_border_width(0)

    def add_section(self, title=None, subtitle=None, section_info={}):
        """Add section to page.

        Parameters
        ----------
        title : None, optional
            Section title.
        subtitle : None, optional
            Section subtitle.
        section_info : dict, optional
            See :any:`SettingsWidgets.SettingsSection`, "section_info".

        Returns
        -------
        SettingsWidgets.SettingsSection
            The settings section.
        """
        section = SettingsSection(title, subtitle, section_info)
        self.add(section)

        return section

    def add_reveal_section(self, title=None, subtitle=None, section_info={},
                           schema=None, pref_key=None, values=None, revealer=None):
        """Add reveal section to page.

        Parameters
        ----------
        title : None, optional
            Section title.
        subtitle : None, optional
            Section subtitle.
        section_info : dict, optional
            See :any:`SettingsWidgets.SettingsSection`.
        schema : None, optional
            See :any:`SettingsRevealer`.
        pref_key : None, optional
            See :any:`SettingsRevealer`.
        values : None, optional
            See :any:`SettingsRevealer`.
        revealer : None, optional
            The revealer that will be attached to the section and to which the widget will
            be attached to.

        Returns
        -------
        SettingsWidgets.SettingsSection
            The settings section.
        """
        section = SettingsSection(title, subtitle, section_info)

        if revealer is None:
            revealer = SettingsRevealer(schema, pref_key, values)

        revealer.add(section)
        section._revealer = revealer
        self.add(revealer)

        return section


class SettingsSection(BaseGrid):
    """Settings section.

    Attributes
    ----------
    always_show : bool
        Always show.
    box : BaseGrid
        An instance of ``BaseGrid`` that will contain all widgets in a section.
    frame : Gtk.Frame
        An instance of ``Gtk.Frame`` that will contain self.box for aesthetic purposes.
    need_separator : bool
        Flag that indicates if there is a need to insert a separator after a widget.
    revealers : list
        A list were to store a created :py:class:`Gtk.Revealer` inside a section.
    size_group : Gtk.SizeGroup
        A ``Gtk.SizeGroup``.
    """

    def __init__(self, title=None, subtitle=None, section_info={}):
        """Initialization.

        Parameters
        ----------
        title : None, optional
            Section title.
        subtitle : None, optional
            Section subtitle.
        section_info : dict, optional
            Data used to create a button at the end of the section title that opens a dialog.
            The dictionary can contain two keys. The "context" key can have one of three values
            ("information" (default), "error" or "warning") and it will be used to decide which icon
            the button will have. And a "message" key that will store the text in valid markup
            that will be used on the displayed message.
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
                label.set_line_wrap(True)
                label.set_line_wrap_mode(Pango.WrapMode.WORD)
                label.set_hexpand(True)
                label.set_markup(f"<b>{title}</b>")
                label.set_xalign(0.0)
                header_box.attach(label, 0, 0, 1, 1)

                if section_info:
                    button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
                        f'dialog-{section_info.get("context", "information")}-symbolic',
                        Gtk.IconSize.BUTTON
                    ))
                    # Mark for deletion on EOL. Gtk4
                    # Stop using set_relief and set the boolean property has-frame.
                    button.set_relief(Gtk.ReliefStyle.NONE)
                    button.set_always_show_image(True)
                    button.set_tooltip_text(_("Information related to this specific section"))
                    button.connect("clicked", display_message_dialog,
                                   title, section_info.get("message", ""),
                                   section_info.get("context", "info"))
                    header_box.attach(button, 1, 0, 1, 1)

            if subtitle:
                sub = Gtk.Label()
                sub.set_line_wrap(True)
                sub.set_line_wrap_mode(Pango.WrapMode.WORD)
                sub.set_text(subtitle)
                # Mark for deletion on EOL. Gtk4
                # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
                sub.get_style_context().add_class(Gtk.STYLE_CLASS_DIM_LABEL)
                sub.set_xalign(0.0)
                header_box.attach(sub, 0, 1, 1, 1)

        self.frame = Gtk.Frame()
        self.frame.set_no_show_all(True)
        # Mark for deletion on EOL. Gtk4
        # Stop using set_shadow_type and set the boolean property has-frame.
        self.frame.set_shadow_type(Gtk.ShadowType.IN)
        # Mark for deletion on EOL. Gtk4
        # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
        self.frame.get_style_context().add_class(Gtk.STYLE_CLASS_VIEW)

        self.size_group = Gtk.SizeGroup()
        self.size_group.set_mode(Gtk.SizeGroupMode.VERTICAL)

        self.box = BaseGrid()
        self.frame.add(self.box)
        self.add(self.frame)

        self.need_separator = False

    def add_row(self, widget, col_pos, row_pos, col_span, row_span):
        """Add a row to the section.

        Parameters
        ----------
        widget : Gtk.Widget
            Widget to insert in a section row.
        col_pos : int
            At which column to insert a widget.
        row_pos : int
            At which row to insert a widget.
        col_span : int
            How many columns a widget will occupy.
        row_span : int
            How many rows a widget will occupy.
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
        """Add a reveal row to the section.

        Parameters
        ----------
        widget : Gtk.Widget
            Widget to insert in a section row.
        col_pos : int
            At which column to insert a widget.
        row_pos : int
            At which row to insert a widget.
        col_span : int
            How many columns a widget will occupy.
        row_span : int
            How many rows a widget will occupy.
        schema : None, optional
            See :any:`xlets_settings.SettingsWidgets.SettingsRevealer`.
        pref_key : None, optional
            See :any:`xlets_settings.SettingsWidgets.SettingsRevealer`.
        values : None, optional
            See :any:`xlets_settings.SettingsWidgets.SettingsRevealer`.
        check_func : None, optional
            See :any:`xlets_settings.SettingsWidgets.SettingsRevealer`.
        revealer : None, optional
            The revealer that will be attached to the section and to which the widget will
            be attached to.

        Returns
        -------
        JSONSettingsRevealer, xlets_settings.SettingsWidgets.SettingsRevealer
            The revealer.
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
            revealer.notify_id = revealer.connect("notify::child-revealed", self.check_reveal_state)
            self.check_reveal_state()

        return revealer

    def add_note(self, text):
        """Add a note to a section.

        Parameters
        ----------
        text : str
            The note text.

        Returns
        -------
        Gtk.Label
            The note to add to a section.
        """
        label = Gtk.Label()
        label.set_line_wrap(True)
        label.set_line_wrap_mode(Pango.WrapMode.WORD)
        label.set_xalign(0.0)
        label.set_markup(text)
        label.set_line_wrap(True)
        self.add(label)

        return label

    def update_always_show_state(self):
        """Update always show state.

        Returns
        -------
        None
            Halt execution.
        """
        if self.always_show:
            return

        self.frame.set_no_show_all(False)
        self.frame.show_all()
        self.always_show = True

        for revealer in self.revealers:
            revealer.disconnect(revealer.notify_id)

    def check_reveal_state(self, *args):
        """Check reveal state.

        Parameters
        ----------
        *args
            Arguments.

        Returns
        -------
        None
            Halt execution.
        """
        for revealer in self.revealers:
            if revealer.props.child_revealed:
                self.box.show_all()
                self.frame.show()
                return

        self.frame.hide()


class SettingsRevealer(Gtk.Revealer):
    """Settings revealer widget.

    Attributes
    ----------
    box : BaseGrid
        An instance of ``BaseGrid`` that will contain all widgets inside a revealer.
    check_func : method
        A function that when executed will return the condition that will decide
        if the revealer is shown or hidden. It receives two arguments. The first argument is
        the current value of the pref_key preference. The second argument is a list of values
        that could be used to check the current value against.
    settings : Gio.Settings
        A ``Gio.Settings`` instance.
    values : list
        See :any:`SettingsRevealer.check_func`.
    """

    def __init__(self, schema=None, pref_key=None, values=None, check_func=None):
        """Initialization.

        Parameters
        ----------
        schema : None, optional
            gsettings schema used to instantiate :any:`SettingsRevealer.settings`.
        pref_key : None, optional
            The preference key whose value will determine if the revealer is shown or hidden.
        values : None, optional
            See :any:`SettingsRevealer.values`.
        check_func : None, optional
            See :any:`SettingsRevealer.check_func`.
        """
        Gtk.Revealer.__init__(self)

        self.check_func = check_func

        self.box = BaseGrid(spacing=15)
        Gtk.Revealer.add(self, self.box)

        self.set_transition_type(Gtk.RevealerTransitionType.SLIDE_DOWN)
        self.set_transition_duration(150)

        if schema:
            self.settings = Gio.Settings.new(schema)
            # if there aren't values or a function provided to determine visibility we
            # can do a simple bind
            if values is None and check_func is None:
                self.settings.bind(pref_key, self, "reveal-child", Gio.SettingsBindFlags.GET)
            else:
                self.values = values
                self.settings.connect(f"changed::{pref_key}", self.on_settings_changed)
                self.on_settings_changed(self.settings, pref_key)

    def add(self, widget):
        """Add widget to revealer.

        Parameters
        ----------
        widget : Gtk.Widget
            The widget to add to the revealer.
        """
        self.box.attach(widget, 0, 0, 1, 1)

    # only used when checking values
    def on_settings_changed(self, settings, pref_key):
        """Function to set the revealer visibility.

        Parameters
        ----------
        settings : Gio.Settings
            A ``Gio.Settings`` instance.
        pref_key : str
            The preference key whose value will determine if the revealer is shown or hidden.
        """
        value = settings.get_value(pref_key).unpack()
        if self.check_func is None:
            self.set_reveal_child(value in self.values)
        else:
            self.set_reveal_child(self.check_func(value, self.values))


class SettingsWidget(BaseGrid):
    """Main class to generate all types of widgets (be them gsettings widgets or xlets widgets).
    """

    def __init__(self, dep_key=None):
        """Initialization.

        Parameters
        ----------
        dep_key : None, optional
            A string on the format "gsettings.schema/gsetting-key".
        """
        super().__init__(orientation=Gtk.Orientation.HORIZONTAL)
        self.set_spacing(5, 5)

        if dep_key:
            self.set_dep_key(dep_key)

    def set_dep_key(self, dep_key):
        """Set dependency key.

        This is used by gsettings widgets. It works by setting a widget sensitivity instead of
        using a revealer. dep_key is a string in the format "gsettings.schema/gsetting-key".

        Parameters
        ----------
        dep_key : str
            A string on the format "gsettings.schema/gsetting-key".

        TODO
        ----
        See if I can modify this mechanism to be handled exactly as the dependency keys for
        xlets settings. As it is it just works with booleans. @low
        """
        flag = Gio.SettingsBindFlags.GET
        if dep_key[0] == "!":
            dep_key = dep_key[1:]
            flag |= Gio.Settings.BindFlags.INVERT_BOOLEAN

        split = dep_key.split("/")
        dep_settings = Gio.Settings.new(split[0])
        dep_settings.bind(split[1], self, "sensitive", flag)

    def add_to_size_group(self, group):
        """Add widget to A ``Gtk.SizeGroup``.

        Parameters
        ----------
        group : Gtk.SizeGroup
            A ``Gtk.SizeGroup``.
        """
        group.add_widget(self.content_widget)

    def fill_row(self):
        """Fill row.
        """
        self.set_border_width(0)
        self.set_margin_start(0)
        self.set_margin_end(0)

    def get_settings(self, schema):
        """Get :py:class:`Gio.Settings` instance.

        Parameters
        ----------
        schema : str
            gsettings schema.

        Returns
        -------
        Gio.Settings
            An instantiated ``Gio.Settings`` instance.
        """
        global gsettings_objects
        try:
            return gsettings_objects[schema]
        except Exception:
            gsettings_objects[schema] = Gio.Settings.new(schema)
            return gsettings_objects[schema]


class Text(SettingsWidget):
    """A simple widget to display informative text.

    Attributes
    ----------
    content_widget : Gtk.Label
        The main widget that will be used to represent a setting value.
    label : str
        The label widget.
    """

    def __init__(self, label, align=Gtk.Align.START, use_markup=False, selectable=False):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        align : int, optional
            :py:class:`Gtk.Align`.
        use_markup : bool, optional
            Whether or not to use markup in the label.
        selectable : bool, optional
            Make the :any:`Gtk.Label` widget text selectable.
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
        self.content_widget.set_line_wrap(True)
        self.content_widget.set_line_wrap_mode(Pango.WrapMode.WORD)
        self.content_widget.set_selectable(selectable)

        if use_markup:
            # NOTE: The label should be escaped where it is needed in the
            # label declaration side.
            self.content_widget.set_markup(label)
        else:
            self.content_widget.set_label(label)

        self.attach(self.content_widget, 0, 0, 1, 1)


class Button(SettingsWidget):
    """A button widget that when pressed bill toggle a boolean preference.

    Attributes
    ----------
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    content_widget : Gtk.Button
        The main widget that will be used to represent a setting value.
    label : str
        The label widget.
    """

    bind_dir = None

    def __init__(self, label="", image="", tooltip="", for_group=False):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        image : str, optional
            An image for the button.
        tooltip : str, optional
            Widget tooltip text.
        for_group : bool, optional
            If the button is added to an instance of :any;`ButtonsGroup`, span the button widget
            just one column instead of two.
        """
        super().__init__()
        self.label = label

        if image:
            self.content_widget = Gtk.Button(
                image=Gtk.Image.new_from_icon_name(image, Gtk.IconSize.BUTTON),
                label=label,
                valign=Gtk.Align.CENTER
            )
        else:
            self.content_widget = Gtk.Button(label=label, valign=Gtk.Align.CENTER)

        self.attach(self.content_widget, 0, 0, 1 if for_group else 2, 1)
        self.content_widget.set_hexpand(True)

        self.set_tooltip_text(tooltip)

    def _on_button_clicked(self, *args):
        """On button clicked.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.set_value(not self.get_value())

    def set_label(self, label):
        """Set label.

        Parameters
        ----------
        label : str
            The label text.
        """
        self.label = label
        self.content_widget.set_label(label)

    def on_setting_changed(self, *args):
        """See :any:`JSONSettingsBackend.on_setting_changed`.

        Parameters
        ----------
        *args
            Arguments.
        """
        pass

    def connect_widget_handlers(self, *args):
        """See :any:`JSONSettingsBackend.connect_widget_handlers`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("clicked", self._on_button_clicked)


class ButtonsGroup(BaseGrid):
    """A widget used to group instances of :any:`Button`.
    """

    def __init__(self):
        """Initialization.
        """
        super().__init__(orientation=Gtk.Orientation.HORIZONTAL)
        self.set_column_homogeneous(True)
        self.set_spacing(5, 5)


class SettingsLabel(Gtk.Label):
    """A label widget that will be used as description for each created widget.
    """

    def __init__(self, text=None, use_markup=False):
        """Initialization.

        Parameters
        ----------
        text : None, optional
            Label text.
        use_markup : bool, optional
            Whether or not to insert the text as markup.
        """
        super().__init__()

        if use_markup:
            self.set_markup(text)
        else:
            self.set_label(text)

        self.set_alignment(0.0, 0.5)
        self.set_line_wrap(True)
        self.set_line_wrap_mode(Pango.WrapMode.WORD)

    def set_label_text(self, text):
        """Set label text.

        Parameters
        ----------
        text : str
            Label text.
        """
        self.set_label(text)

    def set_label_markup(self, markup):
        """Set label markup.

        Parameters
        ----------
        markup : str
            Label markup.
        """
        self.set_markup(markup)


class IconChooser(SettingsWidget):
    """A widget to choose named icons or icon files.

    Attributes
    ----------
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    bind_object : IconChooserButton
        See :any:`JSONSettingsBackend`.
    bind_prop : str
        See :any:`JSONSettingsBackend`.
    label : SettingsWidgets.SettingsLabel
        The label widget.
    """

    bind_prop = "icon"
    bind_dir = Gio.SettingsBindFlags.DEFAULT

    def __init__(self, label, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        size_group : None, optional
            A ``Gtk.SizeGroup``.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
        """
        super().__init__(dep_key=dep_key)
        self._completion = None
        self._setting_entry_text = False

        self.label = SettingsLabel(label)

        icon_chooser = IconChooserButton(self)
        self.bind_object = icon_chooser.button

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(icon_chooser, 1, 0, 1, 1)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)


class Entry(SettingsWidget):
    """An editable entry to store text into a preference.

    Attributes
    ----------
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    bind_prop : str
        See :any:`JSONSettingsBackend.attach_backend`.
    content_widget : Gtk.Entry
        The main widget that will be used to represent a setting value.
    label : SettingsWidgets.SettingsLabel
        The label widget.
    """

    bind_prop = "text"
    bind_dir = Gio.SettingsBindFlags.DEFAULT

    def __init__(self, label, expand_width=True, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        expand_width : bool, optional
            If True, expand the widget to all available space.
        size_group : None, optional
            A ``Gtk.SizeGroup``.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
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
    """An editable entry to store text in multiple lines into a preference.

    Attributes
    ----------
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    bind_object : Gtk.EntryBuffer
        See :any:`JSONSettingsBackend.attach_backend`.
    bind_prop : str
        See :any:`JSONSettingsBackend.attach_backend`.
    content_widget : Gtk.TextView
        The main widget that will be used to represent a setting value.
    label : SettingsWidgets.SettingsLabel
        The label widget.
    """

    bind_prop = "text"
    bind_dir = Gio.SettingsBindFlags.DEFAULT

    def __init__(self, label, height=200, accept_tabs=False, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        height : int, optional
            Minimum list widget height.
        accept_tabs : bool, optional
            Whether the :kbd:`Tab` key inserts a tab character (accept_tabs = True)
            or the keyboard focus is moved (accept_tabs = False).
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
        """
        super().__init__(dep_key=dep_key)

        self.label = SettingsLabel(label)
        self.label.set_alignment(0.5, 0.5)

        scrolledwindow = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
        scrolledwindow.set_size_request(width=-1, height=height)
        scrolledwindow.set_policy(hscrollbar_policy=Gtk.PolicyType.AUTOMATIC,
                                  vscrollbar_policy=Gtk.PolicyType.AUTOMATIC)
        # Mark for deletion on EOL. Gtk4
        # Stop using set_shadow_type and set the boolean property has-frame.
        scrolledwindow.set_shadow_type(type=Gtk.ShadowType.ETCHED_IN)
        self.content_widget = Gtk.TextView()
        self.content_widget.set_accepts_tab(accept_tabs)
        self.content_widget.set_border_width(3)
        self.content_widget.set_hexpand(True)
        self.content_widget.set_wrap_mode(wrap_mode=Gtk.WrapMode.NONE)
        self.bind_object = self.content_widget.get_buffer()

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(scrolledwindow, 0, 1, 1, 1)
        scrolledwindow.add(self.content_widget)

        self.set_tooltip_text(tooltip)

    def focus_the_retarded_text_view(self, *args):
        """Focus the :py:class:`Gtk.TextView` when clicked.

        This is a workaround for ``Gtk.TextView`` elements.

        Parameters
        ----------
        *args
            Arguments.

        Returns
        -------
        int
            See :py:class:`Gdk.EVENT_STOP`.
        """
        self.content_widget.grab_focus()
        return Gdk.EVENT_STOP


class TextViewButton(SettingsWidget):
    """Same widget as :any:`TextView` but the editable entry is in its own dialog that's accessed
    through a button.

    Attributes
    ----------
    accept_tabs : bool
        Whether the :kbd:`Tab` key inserts a tab character (accept_tabs = True)
        or the keyboard focus is moved (accept_tabs = False).
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    content_widget : Gtk.Button
        The button to display the dialog with the editable entry.
    dialog_height : int
        Height of the dialog tied to the widget.
    dialog_width : int
        Width of the dialog tied to the widget.
    label : SettingsWidgets.SettingsLabel
        The label widget.
    textview_buffer : Gtk.TextBuffer
        The buffer used by the :any:`Gtk.TextView`.
    """
    bind_dir = None

    def __init__(self, label, accept_tabs=False, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            The widget label.
        accept_tabs : bool, optional
            Whether the :kbd:`Tab` key inserts a tab character (accept_tabs = True)
            or the keyboard focus is moved (accept_tabs = False).
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
        """
        super().__init__(dep_key=dep_key)
        self.dialog_width = 500
        self.dialog_height = 400
        self.label = label
        self.accept_tabs = accept_tabs
        self.content_widget = Gtk.Button(label=label, valign=Gtk.Align.CENTER)
        self.content_widget.set_hexpand(True)
        self.textview_buffer = Gtk.TextBuffer()
        self.attach(self.content_widget, 0, 0, 2, 1)

        self.set_tooltip_text(tooltip)

    def _open_text_view(self, *args):
        """Open the dialog with the editable entry.

        Parameters
        ----------
        *args
            Arguments.
        """
        dialog = IntelligentGtkDialog(
            self,
            transient_for=get_toplevel_window(self),
            use_header_bar=get_global("USE_HEADER_BARS_ON_DIALOGS"),
            title=self.label,
            flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
            buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                     _("_Save"), Gtk.ResponseType.OK)
        )

        content_area = dialog.get_content_area()
        content_area_grid = BaseGrid()
        content_area.add(content_area_grid)

        scrolled = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
        # NOTE: Set property to avoid calling 2 methods.
        scrolled.set_property("expand", True)
        # Mark for deletion on EOL. Gtk4
        # Stop using set_shadow_type and set the boolean property has-frame.
        scrolled.set_shadow_type(type=Gtk.ShadowType.IN)
        scrolled.set_policy(hscrollbar_policy=Gtk.PolicyType.AUTOMATIC,
                            vscrollbar_policy=Gtk.PolicyType.AUTOMATIC)
        content_area_grid.attach(scrolled, 0, 0, 1, 1)

        textview = Gtk.TextView.new_with_buffer(self.textview_buffer)
        textview.set_accepts_tab(self.accept_tabs)
        textview.set_border_width(3)
        textview.set_hexpand(True)
        textview.set_wrap_mode(wrap_mode=Gtk.WrapMode.NONE)
        scrolled.add(textview)

        current_text = self.get_value()
        self.textview_buffer.set_text(current_text)

        content_area.show_all()
        response = dialog.run()

        if response == Gtk.ResponseType.OK:
            new_text = self.textview_buffer.get_text(
                self.textview_buffer.get_start_iter(),
                self.textview_buffer.get_end_iter(),
                True  # FIXME: Should I or should I not?
            )

            if current_text != new_text:
                self.set_value(new_text)

        dialog.destroy()

    def on_setting_changed(self, *args):
        """See :any:`JSONSettingsBackend.on_setting_changed`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.textview_buffer.set_text(self.get_value())

    def connect_widget_handlers(self, *args):
        """See :any:`JSONSettingsBackend.connect_widget_handlers`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("clicked", self._open_text_view)


class Switch(SettingsWidget):
    """A switch widget to toggle a boolean preference.

    Attributes
    ----------
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    bind_prop : str
        See :any:`JSONSettingsBackend.attach_backend`.
    content_widget : Gtk.Switch
        The main widget that will be used to represent a setting value.
    label : SettingsWidgets.SettingsLabel
        The label widget.
    """

    bind_prop = "active"
    bind_dir = Gio.SettingsBindFlags.DEFAULT

    def __init__(self, label, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
        """
        super().__init__(dep_key=dep_key)

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)
        self.content_widget = Gtk.Switch(valign=Gtk.Align.CENTER)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        self.set_tooltip_text(tooltip)

    def clicked(self, *args):
        """Clicked.

        Parameters
        ----------
        *args
            Arguments.
        """
        if self.is_sensitive():
            self.content_widget.set_active(not self.content_widget.get_active())


class Range(SettingsWidget):
    """A widget to choose a numeric value with a slider.

    Attributes
    ----------
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    bind_object : Gtk.Scale
        See :any:`JSONSettingsBackend`.
    bind_prop : str
        See :any:`JSONSettingsBackend.attach_backend`.
    content_widget : Gtk.Scale
        The main widget that will be used to represent a setting value.
    flipped : bool
        FIXME: I don't understand what this does just yet, so I didn't exposed its use.
    invert : bool
        Flip the rendering of the widget.
    label : Gtk.Label
        The label widget.
    log : bool
        FIXME: I don't understand what this does just yet, so I didn't exposed its use.
    map_get : function
        See :any:`JSONSettingsHandler.bind`.
    map_set : function
        See :any:`JSONSettingsHandler.bind`.
    max_label : Gtk.Label
        The maximum label widget text.
    min_label : Gtk.Label
        The minimum label widget text.
    step : int
        Adjustment amount.
    value : int
        Widget value.
    """
    bind_prop = "value"
    bind_dir = Gio.SettingsBindFlags.GET | Gio.SettingsBindFlags.NO_SENSITIVITY

    def __init__(self, label, min_label="", max_label="", mini=None, maxi=None, step=None,
                 invert=False, log=False, show_value=True, dep_key=None, tooltip="",
                 flipped=False, units="", marks=[]):
        """Initialization.

        Parameters
        ----------
        label : str
            The label widget text.
        min_label : str, optional
            The minimum label widget text.
        max_label : str, optional
            The maximum label widget text.
        mini : None, optional
            Minimum value.
        maxi : None, optional
            Maximum value.
        step : None, optional
            Adjustment amount.
        invert : bool, optional
            Flip the rendering of the widget.
        log : bool, optional
            FIXME: I don't understand what this does just yet, so I didn't exposed its use.
        show_value : bool, optional
            Display the actual value in the slider.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
        flipped : bool, optional
            FIXME: I don't understand what this does just yet, so I didn't exposed its use.
        units : str, optional
            Unit type description.
        marks : list, optional
            Data to generate marks in the :any:`Gtk.Scale` widget.
        """
        super().__init__(dep_key=dep_key)

        self.log = log
        self.invert = invert
        self.flipped = flipped
        self._timer = None
        self.value = 0

        if units:
            label += " ({})".format(units)

        self.label = Gtk.Label.new(label)
        self.label.set_halign(Gtk.Align.CENTER)
        self.label.set_hexpand(True)

        self.min_label = Gtk.Label()
        self.max_label = Gtk.Label()
        self.min_label.set_alignment(1.0, 0.75)
        self.max_label.set_alignment(1.0, 0.75)
        self.min_label.set_margin_right(6)
        self.max_label.set_margin_left(6)

        # NOTE: The original implementation calls get_range to get the min and max values
        # defined in the settings-schema.json file. Since I mostly use generic settings, I don't
        # specify any properties in the settings-schema.json file for spinbuttons. Due to
        # this, calling get_range raises an exception. In this case, just use the mini and maxi
        # parameters and move on.
        # FIXME: Revisit and fix it.
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

        if log:
            mini = math.log(mini)
            maxi = math.log(maxi)
            if self.flipped:
                self.map_get = lambda x: -1 * (math.log(x))
                self.map_set = lambda x: math.exp(x)
            else:
                self.map_get = lambda x: math.log(x)
                self.map_set = lambda x: math.exp(x)
        elif self.flipped:
            self.map_get = lambda x: x * -1
            self.map_set = lambda x: x * -1

        if self.flipped:
            tmp_mini = mini
            mini = maxi * -1
            maxi = tmp_mini * -1

        if step is None:
            self.step = (maxi - mini) * 0.02
        else:
            self.step = math.log(step) if log else step

        # NOTE: min_label and max_label can be specified as null/None in the settings files
        # to force not to set a label. By default, the markup is always set to the min/max values.
        if min_label is not None:
            self.min_label.set_markup(f"<i><small>{str(min_label or mini)}</small></i>")

        if max_label is not None:
            self.max_label.set_markup(f"<i><small>{str(max_label or maxi)}</small></i>")

        self.content_widget = Gtk.Scale.new_with_range(
            Gtk.Orientation.HORIZONTAL, mini, maxi, self.step)
        self.content_widget.set_inverted(invert)
        self.content_widget.set_hexpand(True)
        self.content_widget.set_draw_value(show_value and not self.flipped)
        self.bind_object = self.content_widget.get_adjustment()

        if marks:
            if isinstance(marks, list):
                for value in marks:
                    self.content_widget.add_mark(float(value), Gtk.PositionType.BOTTOM, "")
            elif isinstance(marks, dict):
                for value, markup in marks.items():
                    self.content_widget.add_mark(float(value), Gtk.PositionType.BOTTOM, str(markup))

        if invert:
            self.step *= -1  # Gtk.Scale.new_with_range want a positive value, but our custom scroll handler wants a negative value

        scale_container = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        scale_container.attach(self.min_label, 2 if invert else 0, 0, 1, 1)
        scale_container.attach(self.content_widget, 1, 0, 1, 1)
        scale_container.attach(self.max_label, 0 if invert else 2, 0, 1, 1)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(scale_container, 0, 1, 1, 1)

        self.content_widget.connect("scroll-event", self.on_scroll_event)
        self.content_widget.connect("value-changed", self.on_value_changed)

        if (not log) and self.step % 1 == 0:
            self.content_widget.connect("change-value", self.round_value_to_step)

        self.set_tooltip_text(tooltip)

    def round_value_to_step(self, widget, scroll, value, data=None):
        """Round value to step.

        Parameters
        ----------
        widget : Gtk.Scale
            The object which received the signal.
        scroll : Gdk.EventKey
            The ``Gdk.EventKey`` which triggered this signal.
        value : int
            The widget value.
        data : None, optional
            User data.

        Returns
        -------
        bool
            FIXME: Event propagation?
        """
        if value % self.step != 0:
            widget.set_value(round(value / self.step) * self.step)
            return True

        return False

    def _on_value_changed(self):
        """On value changed.

        Returns
        -------
        bool
            Remove source.
        """
        if self.log:
            self.set_value(math.exp(abs(self.content_widget.get_value())))
        else:
            if self.flipped:
                self.set_value(self.content_widget.get_value() * -1)
            else:
                self.set_value(self.content_widget.get_value())

        self._timer = None

        return GLib.SOURCE_REMOVE

    def on_value_changed(self, *args):
        """Delayed apply.

        Parameters
        ----------
        *args
            Arguments.
        """
        if self._timer:
            GLib.source_remove(self._timer)

        self._timer = GLib.timeout_add(300, self._on_value_changed)

    def on_scroll_event(self, widget, event):
        """On scroll event.

        Parameters
        ----------
        widget : Gtk.Scale
            The object which received the signal.
        event : Gdk.EventKey
            The ``Gdk.EventKey`` which triggered this signal.

        Returns
        -------
        bool
            FIXME: Event propagation?
        """
        found, delta_x, delta_y = event.get_scroll_deltas()

        # If you scroll up, delta_y < 0. This is a weird world
        widget.set_value(widget.get_value() - delta_y * self.step)

        return True

    def add_mark(self, value, position, markup):
        """Add mark.

        Parameters
        ----------
        value : float
            The value at which the mark is placed, must be between the lower and upper limits of \
            the scales’ adjustment.
        position : Gtk.PositionType
            where to draw the mark. For a horizontal scale, `Gtk.PositionType.TOP` and \
            `Gtk.PositionType.LEFT` are drawn above the scale, anything else below. \
            For a vertical scale, `Gtk.PositionType.LEFT` and `Gtk.PositionType.TOP` are drawn to \
            the left of the scale, anything else to the right.
        markup : str, None
            Text to be shown at the mark, using Pango markup.
        """
        if self.log:
            self.content_widget.add_mark(math.log(value), position, markup)
        else:
            self.content_widget.add_mark(value, position, markup)

    def set_rounding(self, digits):
        """Set rounding.

        Sets the number of digits to round the value to when it changes.

        Parameters
        ----------
        digits : int
            The precision in digits.
        """
        if not self.log:
            self.content_widget.set_round_digits(digits)
            self.content_widget.set_digits(digits)


class ComboBox(SettingsWidget):
    """A combo box widget from which to choose any of the predefined values.

    Attributes
    ----------
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    content_widget : Gtk.ComboBox
        The main widget that will be used to represent a setting value.
    label : SettingsWidgets.SettingsLabel
        The label widget.
    model : Gtk.ListStore
        The model used as storage by this widget.
    value : str, int, float
        The preference stored value used to set the current combo box item.
    """

    bind_dir = None

    def __init__(self, label, options=[], valtype=None, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        options : list, optional
            A list of tuples of two elements representing the options used to build
            a :any:`ComboBox` widget and its derivatives.
        valtype : None, optional
            The type used to coerce a specific option type.
        size_group : None, optional
            A ``Gtk.SizeGroup``.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
        """
        super().__init__(dep_key=dep_key)

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

    def _on_combo_value_changed(self, widget):
        """On value changed.

        Parameters
        ----------
        widget : Gtk.ComboBox
            The widget combo box.
        """
        tree_iter = widget.get_active_iter()
        if tree_iter is not None:
            self.value = self.model[tree_iter][0]
            self.set_value(self.value)

    def _set_options(self, options):
        """Set options

        Parameters
        ----------
        options : list
            See :any:`ComboBox` ``options`` argument.
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
        """See :any:`JSONSettingsBackend.on_setting_changed`.

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
        """See :any:`JSONSettingsBackend.connect_widget_handlers`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("changed", self._on_combo_value_changed)


class ColorChooser(SettingsWidget):
    """Widget to choose a color.

    Attributes
    ----------
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    content_widget : Gtk.ColorButton
        The main widget that will be used to represent a setting value.
    label : SettingsWidgets.SettingsLabel
        The label widget.
    """

    bind_dir = None

    def __init__(self, label, use_alpha=True, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        use_alpha : bool, optional
            Whether the widget is be able to specify opacity.
        size_group : None, optional
            A ``Gtk.SizeGroup``.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
        """
        super().__init__(dep_key=dep_key)

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)

        container = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        container.set_spacing(0, 0)
        # Mark for deletion on EOL. Gtk4
        # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
        container.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED)

        self._clear_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
            "edit-clear-symbolic",
            Gtk.IconSize.BUTTON
        ))
        self._clear_button.set_tooltip_text(_("Clear color"))
        self.content_widget = Gtk.ColorButton()
        self.content_widget.set_use_alpha(use_alpha)

        self.attach(self.label, 0, 0, 1, 1)
        container.attach(self._clear_button, 0, 0, 1, 1)
        container.attach(self.content_widget, 1, 0, 1, 1)
        self.attach(container, 1, 0, 1, 1)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def _on_clear_button_clicked(self, *args):
        """On clear button clicked.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.set_value("")
        self._set_widget_color("")

    def _on_color_set(self, *args):
        """On color set.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.set_value(self.content_widget.get_rgba().to_string())

    def _set_widget_color(self, color_string):
        """Set widget color.

        Parameters
        ----------
        color_string : str
            The string color.
        """
        # NOTE: Luckily, empty strings will set the color to white.
        rgba = Gdk.RGBA()
        rgba.parse(color_string)
        # NOTE: set_rgba sets RGBA and RGB.
        self.content_widget.set_rgba(rgba)

    def clicked(self, *args):
        """On clicked.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.do_clicked(self.content_widget)

    def on_setting_changed(self, *args):
        """See :any:`JSONSettingsBackend.on_setting_changed`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self._set_widget_color(self.get_value())

    def connect_widget_handlers(self, *args):
        """See :any:`JSONSettingsBackend.connect_widget_handlers`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("color-set", self._on_color_set)
        self._clear_button.connect("clicked", self._on_clear_button_clicked)


class FileChooser(SettingsWidget):
    """A widget to choose and store a path to a file or directory into a preference.

    Attributes
    ----------
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    content_widget : Gtk.Button
        The main widget that will be used to represent a setting value.
    label : SettingsWidgets.SettingsLabel
        The label widget.
    """

    bind_dir = None

    def __init__(self, label, dir_select=False, size_group=None, dep_key=None, tooltip="",
                 pattern_filters={}, mimetype_filters={}):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        dir_select : bool, optional
            If True, enable folder selection on the file chooser. If False,
            enable file selection.
        size_group : None, optional
            A ``Gtk.SizeGroup``.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
        pattern_filters : dict, optional
            Filters to add to the :any:`Gtk.FileChooserDialog`.
        mimetype_filters : dict, optional
            Filters to add to the :any:`Gtk.FileChooserDialog`.
        """
        super().__init__(dep_key=dep_key)
        self._dir_select = dir_select
        self._pattern_filters = pattern_filters
        self._mimetype_filters = mimetype_filters
        self._content_widget_label = None

        container = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        container.set_spacing(0, 0)
        # Mark for deletion on EOL. Gtk4
        # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
        container.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED)

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)
        self._clear_button = Gtk.Button(
            image=Gtk.Image.new_from_icon_name("edit-clear-symbolic", Gtk.IconSize.BUTTON)
        )
        self._clear_button.set_tooltip_text(_("Clear path"))
        self.content_widget = Gtk.Button(
            image=Gtk.Image.new_from_icon_name(
                "folder-open-symbolic" if dir_select else "document-open-symbolic",
                Gtk.IconSize.BUTTON),
            # NOTE: Initialize with an empty label.
            # Otherwise, I can't access it and store it in self._content_widget_label.
            label=""
        )

        try:
            # Mark for deletion on EOL. Gtk4
            # Switch to Gtk.Widget's children APIs to access the button label.
            self._content_widget_label = self.content_widget.get_image().get_parent().get_children()[
                1]
            self._content_widget_label.set_max_width_chars(30)
            self._content_widget_label.set_ellipsize(Pango.EllipsizeMode.END)
        except Exception:
            pass

        self.attach(self.label, 0, 0, 1, 1)
        container.attach(self._clear_button, 0, 0, 1, 1)
        container.attach(self.content_widget, 1, 0, 1, 1)
        self.attach(container, 1, 0, 1, 1)

        self.set_tooltip_text(tooltip)
        self._update_button_label_and_tooltip()

        if size_group:
            self.add_to_size_group(size_group)

    def _update_button_label_and_tooltip(self):
        """Update button label and tooltip.
        """
        value = self.get_value()

        if value:
            self.content_widget.set_label(GLib.basename(value))
            self.content_widget.set_tooltip_text(value)

            try:
                if not GLib.file_test(value, GLib.FileTest.EXISTS):
                    self.content_widget.set_tooltip_text(
                        _("Non-existent file/location") + "\n" + value)

                    if self._content_widget_label:
                        # Mark for deletion on EOL. Gtk4
                        # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
                        self._content_widget_label.get_style_context().add_class(Gtk.STYLE_CLASS_ERROR)
            except Exception:
                pass
        else:
            self.content_widget.set_label(_("(None)"))

            if self._dir_select:
                self.content_widget.set_tooltip_text(_("Select a folder"))
            else:
                self.content_widget.set_tooltip_text(_("Select a file"))

    def _attach_filters(self, dialog, filter_type):
        """Attach filters to dialog.

        Parameters
        ----------
        dialog : Gtk.FileChooserDialog
            The dialog to which to attach filters.
        filter_type : str, optional
            One of "pattern" or "mimetype".

        Returns
        -------
        None
            Halt execution.
        """
        filters = getattr(self, f"_{filter_type}_filters")

        if not filters:
            return

        for label, patterns in filters.items():
            filter = Gtk.FileFilter()
            filter.set_name(label)

            for p in patterns:
                if filter_type == "pattern":
                    filter.add_pattern(p)
                else:
                    filter.add_mime_type(p)

            dialog.add_filter(filter)

        # NOTE: Always add this filter last to not make the dialog too restrictive.
        filter = Gtk.FileFilter()
        filter.set_name(_("Any files"))
        filter.add_pattern("*")
        dialog.add_filter(filter)

    def _on_content_widget_clicked(self, *args):
        """On content widget clicked.

        Parameters
        ----------
        *args
            Arguments.
        """
        if self._dir_select:
            action = Gtk.FileChooserAction.SELECT_FOLDER
            title = _("Select a folder")
        else:
            action = Gtk.FileChooserAction.OPEN
            title = _("Select a file")

        dialog = Gtk.FileChooserDialog(
            title=title,
            action=action,
            transient_for=get_toplevel_window(self),
            use_header_bar=get_global("USE_HEADER_BARS_ON_DIALOGS"),
            flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
            buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                     _("_Select"), Gtk.ResponseType.OK)
        )

        parent_of_current_path = GLib.path_get_dirname(self.get_value())

        if GLib.file_test(parent_of_current_path, GLib.FileTest.IS_DIR):
            dialog.set_current_folder(parent_of_current_path)
        else:
            dialog.set_current_folder("")

        if not self._dir_select:
            self._attach_filters(dialog, "pattern")
            self._attach_filters(dialog, "mimetype")

        response = dialog.run()

        if response == Gtk.ResponseType.OK:
            self.set_value(dialog.get_filename())

        dialog.destroy()
        self._update_button_label_and_tooltip()

    def _on_clear_button_clicked(self, *args):
        """On clear button clicked.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.set_value("")
        self._update_button_label_and_tooltip()

    def on_setting_changed(self, *args):
        """See :any:`JSONSettingsBackend.on_setting_changed`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self._update_button_label_and_tooltip()

    def connect_widget_handlers(self, *args):
        """See :any:`JSONSettingsBackend.connect_widget_handlers`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("clicked", self._on_content_widget_clicked)
        self._clear_button.connect("clicked", self._on_clear_button_clicked)


class SpinButton(SettingsWidget):
    """A widget to choose and store an integer or float value into a preference.

    Attributes
    ----------
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    bind_prop : str
        See :any:`JSONSettingsBackend.attach_backend`.
    content_widget : Gtk.SpinButton
        The main widget that will be used to represent a setting value.
    label : SettingsWidgets.SettingsLabel
        The label widget.
    """

    bind_prop = "value"
    bind_dir = Gio.SettingsBindFlags.GET

    def __init__(self, label, units="", mini=None, maxi=None, step=1,
                 page=None, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        units : str, optional
            Unit type description.
        mini : None, optional
            Minimum value.
        maxi : None, optional
            Maximum value.
        step : int, float, optional
            Adjustment amount.
        page : None, optional
            Adjustment amount when using the Page Up/Down keys.
        size_group : None, optional
            A ``Gtk.SizeGroup``.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
        """
        super().__init__(dep_key=dep_key)

        self._timer = None

        if units:
            label += f" ({units})"

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
        # FIXME: Revisit and fix it.
        # FIXME: Another thing that I found. When a min or max value is a negative integer, the
        # widget saves the value as float. This could f**k up the JavaScript side of the xlet that
        # might expect an integer. I'm thinking of reading at initialization the min or max values
        # type and store it to later apply it to the value that is going to be saved.
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

        self.content_widget.connect("value-changed", self.on_value_changed)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def _on_value_changed(self):
        """On value changed.

        Returns
        -------
        bool
            Remove source.
        """
        self.set_value(self.content_widget.get_value())
        self._timer = None

        return GLib.SOURCE_REMOVE

    def on_value_changed(self, *args):
        """Delayed apply.

        Parameters
        ----------
        *args
            Arguments.
        """
        if self._timer:
            GLib.source_remove(self._timer)

        self._timer = GLib.timeout_add(300, self._on_value_changed)


class Keybinding(SettingsWidget):
    """A widget to set and store a keybinding into a preference.

    Attributes
    ----------
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    content_widget : Gtk.Frame
        The main widget that will be used to represent a setting value.
    label : SettingsWidgets.SettingsLabel
        The label widget.
    """

    bind_dir = None

    def __init__(self, label, num_bind=1, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        num_bind : int, optional
            Number of keybinding widgets.
        size_group : None, optional
            A ``Gtk.SizeGroup``.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
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
        """On keybinding changed.

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
        """See :any:`JSONSettingsBackend.on_setting_changed`.

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
        """See :any:`JSONSettingsBackend.connect_widget_handlers`.

        Parameters
        ----------
        *args
            Arguments.
        """
        pass


class KeybindingWithOptions(SettingsWidget):
    """A widget to choose a keybinding and bind it to an option from a combo box.

    Attributes
    ----------
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    content_widget : BaseGrid
        The main widget that will be used to represent a setting value.
    label : SettingsWidgets.SettingsLabel
        The label widget.
    model : Gtk.ListStore
        The model used as storage by this widget.
    value : str, int, float
        The preference stored value used to set the current combo box item.
    """

    bind_dir = None

    def __init__(self, label, options=[], valtype=None,
                 size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        options : list, optional
            A list of tuples of two elements representing the options used to build
            a :any:`ComboBox` widget and its derivatives.
        valtype : None, optional
            The type used to coerce a specific option type.
        size_group : None, optional
            A ``Gtk.SizeGroup``.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
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
        """On keybinding changed.

        Parameters
        ----------
        *args
            Arguments.
        """
        try:
            kb, opt = self.get_value().split("::")
        except Exception:
            kb, opt = "", ""  # noqa

        self.set_value(f"{self._kb_button.get_accel_string()}::{opt}")

    def _on_combo_value_changed(self, combo):
        """On combo box changed.

        Parameters
        ----------
        combo : Gtk.ComboBox
            The widget combo box.
        """
        tree_iter = combo.get_active_iter()

        if tree_iter is not None:
            self.value = f"{self._kb_button.get_accel_string()}::{self.model[tree_iter][0]}"
            self.set_value(self.value)

    def _set_options(self, options):
        """Set options.

        Parameters
        ----------
        options : list
            See :any:`ComboBox` ``options`` argument.
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
        """See :any:`JSONSettingsBackend.on_setting_changed`.

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
        """See :any:`JSONSettingsBackend.connect_widget_handlers`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self._kb_button.connect("accel-edited", self._on_kb_changed)
        self._kb_button.connect("accel-cleared", self._on_kb_changed)
        self._combo_button.connect("changed", self._on_combo_value_changed)


class StringsList(SettingsWidget):
    """Strings list widget.

    Attributes
    ----------
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    content_widget : Gtk.Button
        The content widget.
    dialog_height : int
        Height of the dialog tied to the widget.
    dialog_width : int
        Width of the dialog tied to the widget.
    label : str
        The widget label.
    """
    bind_dir = None
    _columns = {
        "STRING": 0
    }

    def __init__(self, label, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            Widget label text.
        dep_key : None, optional
            Dependency key/s.
        tooltip : str, optional
            Widget tooltip text.
        """
        super().__init__(dep_key=dep_key)
        self.dialog_width = 400
        self.dialog_height = 500
        self.label = label
        self.content_widget = Gtk.Button(label=label, valign=Gtk.Align.CENTER)
        self.content_widget.set_hexpand(True)
        self.attach(self.content_widget, 0, 0, 2, 1)
        self._changed_pref_key = f"{self.pref_key}_changed"

        if self._changed_pref_key not in self.settings.settings:
            self._changed_pref_key = None

        self.set_tooltip_text(tooltip)

        self._strings_store = Gtk.ListStore()
        self._strings_store.set_column_types([GObject.TYPE_STRING])

    def _open_strings_list(self, *args):
        """Open applications list.

        Parameters
        ----------
        *args
            Arguments.
        """
        dialog = IntelligentGtkDialog(
            self,
            transient_for=get_toplevel_window(self),
            use_header_bar=get_global("USE_HEADER_BARS_ON_DIALOGS"),
            title=_("Strings list"),
            flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT
        )

        content_area = dialog.get_content_area()
        content_area_grid = BaseGrid()
        content_area.add(content_area_grid)

        entry = Gtk.Entry()
        entry.set_hexpand(True)

        def add_string(widget, self):
            """Add string.

            Parameters
            ----------
            widget : Gtk.Entry
                The widget to get the value from.
            self : SettingsWidget
                Reference to :any:`StringsList`.
            """
            self._add_string_to_list(widget.get_text())
            widget.set_text("")

        entry.connect("activate", add_string, self)
        content_area_grid.attach(entry, 0, 1, 1, 1)

        scrolled = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
        # Mark for deletion on EOL. Gtk4
        # Stop using set_shadow_type and set the boolean property has-frame.
        scrolled.set_shadow_type(type=Gtk.ShadowType.IN)
        scrolled.set_policy(hscrollbar_policy=Gtk.PolicyType.NEVER,
                            vscrollbar_policy=Gtk.PolicyType.AUTOMATIC)
        content_area_grid.attach(scrolled, 0, 2, 1, 1)

        tree_view = Gtk.TreeView()
        tree_view.set_model(self._strings_store)
        tree_view.set_property("expand", True)
        tree_view.get_selection().set_mode(Gtk.SelectionMode.MULTIPLE)

        column = Gtk.TreeViewColumn()
        column.set_title(_("Entries"))
        column.set_property("expand", True)
        column.set_sort_column_id(self._columns["STRING"])

        renderer = Gtk.CellRendererText()
        column.pack_start(renderer, True)
        column.add_attribute(renderer, "text", self._columns["STRING"])
        tree_view.append_column(column)

        scrolled.add(tree_view)

        toolbar = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        toolbar.set_halign(Gtk.Align.FILL)
        toolbar.set_hexpand(True)
        # Mark for deletion on EOL. Gtk4
        # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
        toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR)
        buttons_box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        buttons_box.set_halign(Gtk.Align.CENTER)
        buttons_box.set_hexpand(True)
        toolbar.attach(buttons_box, 0, 1, 1, 1)
        content_area_grid.attach(toolbar, 0, 3, 1, 1)

        del_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
            "edit-delete-symbolic",
            Gtk.IconSize.LARGE_TOOLBAR
        ))
        del_button.set_tooltip_text(_("Remove selected entries"))
        del_button.connect("clicked", self._delete_selected_strings, tree_view)
        buttons_box.add(del_button)

        help_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
            "dialog-information-symbolic",
            Gtk.IconSize.LARGE_TOOLBAR
        ))
        help_button.set_tooltip_text(_("Help"))
        help_button.connect("clicked", self._display_help, dialog)
        buttons_box.add(help_button)

        selection = tree_view.get_selection()

        def set_del_button_sensitive(sel):
            """Set delete button sensitivity.

            Parameters
            ----------
            sel : Gtk.TreeSelection
                THe selection containing the selected entries.
            """
            del_button.set_sensitive(sel.count_selected_rows() != 0)

        selection.connect("changed", set_del_button_sensitive)
        del_button.set_sensitive(selection.count_selected_rows() != 0)

        self._populate_strings_list()

        content_area.show_all()
        dialog.run()

        dialog.destroy()
        self._list_changed()

    def _display_help(self, widget, dialog):
        """Display help message.

        Parameters
        ----------
        widget : Gtk.Button
            The help button.
        dialog : IntelligentGtkDialog
            The dialog to use in the ``transient_for`` parameter of the message dialog that will be displayed.
        """
        msg = [
            _("Duplicated entries will be automatically removed."),
            _("Entries will be also sorted alphabetically.")
        ]
        display_message_dialog(dialog, _("Basic information"), msg)

    def _populate_strings_list(self, *args):
        """Populate applications list.

        Parameters
        ----------
        *args
            Arguments.
        """
        self._strings_store.clear()

        # NOTE: list(set()) in case that there are duplicated entries added externally.
        current_strings = list(set(self.get_value()))

        for value in current_strings:
            self._add_string_to_list(value)

        # The following line auto sorts the list at start up!!! Finally!!!
        self._strings_store.set_sort_column_id(self._columns["STRING"], Gtk.SortType.ASCENDING)

    def _add_string_to_list(self, value):
        """Add string to list.

        Parameters
        ----------
        value : str
            A newly added string to add to the strings list.
        """
        iter = self._strings_store.append()

        self._strings_store.set(iter, [
            self._columns["STRING"]
        ], [
            value
        ])

    def _delete_selected_strings(self, widget, tree):
        """Delete selected applications.

        Parameters
        ----------
        widget : Gtk.Button
            A ``Gtk.Button``.
        tree : Gtk.TreeView
            A ``Gtk.TreeView``.
        """
        selection = tree.get_selection()
        tree_model, paths = selection.get_selected_rows()

        # Iterate in reverse so the right rows are removed.
        for path in reversed(paths):
            tree_iter = tree_model.get_iter(path)
            tree_model.remove(tree_iter)

    def _list_changed(self):
        """List changed.
        """
        # NOTE: Use of set() to avoid storing duplicates.
        data = set()

        for value in self._strings_store:
            data.add(value[self._columns["STRING"]])

        # NOTE: Do not unnecessarily save data if the list of strings hasn't changed.
        if data != set(self.get_value()):
            self.set_value(list(data))

            if self._changed_pref_key:
                self.settings.set_value(
                    self._changed_pref_key,
                    not self.settings.get_value(
                        self._changed_pref_key))

    def on_setting_changed(self, *args):
        """See :any:`JSONSettingsBackend.on_setting_changed`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self._populate_strings_list()

    def connect_widget_handlers(self, *args):
        """See :any:`JSONSettingsBackend.connect_widget_handlers`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("clicked", self._open_strings_list)


class SoundFileChooser(SettingsWidget):
    """Sound file chooser widget.

    Attributes
    ----------
    bind_dir : Gio.SettingsBindFlags, None
        See :any:`JSONSettingsBackend`.
    content_widget : BaseGrid
        The main widget that will be used to represent a setting value.
    label : str
        The label widget.
    """
    bind_dir = None

    def __init__(self, label, event_sounds=True, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            The label widget.
        event_sounds : bool, optional
            If True, only wav and ogg sound files will be filtered in
            the file chooser dialog. If set to False, all sound files will be displayed.
        size_group : None, optional
            A ``Gtk.SizeGroup``.
        dep_key : None, optional
            Dependency key/s.
        tooltip : str, optional
            Widget tooltip text.
        """
        super().__init__(dep_key=dep_key)
        self._proxy = None
        self._event_sounds = event_sounds
        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)
        self.content_widget = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        # Mark for deletion on EOL. Gtk4
        # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
        self.content_widget.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED)

        self._clear_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
            "edit-clear-symbolic",
            Gtk.IconSize.BUTTON
        ))
        self._clear_button.set_tooltip_text(_("Clear sound"))

        self._file_picker_button = Gtk.Button()

        button_content = BaseGrid()
        button_content.set_spacing(5, 5)
        self._file_picker_button.add(button_content)

        self._button_label = Gtk.Label()
        button_content.attach(Gtk.Image(icon_name="sound"), 0, 0, 1, 1)
        button_content.attach(self._button_label, 1, 0, 1, 1)

        self._play_button = Gtk.Button()
        self._play_button.set_image(Gtk.Image.new_from_icon_name(
            "media-playback-start-symbolic",
            Gtk.IconSize.BUTTON
        ))

        self.content_widget.attach(self._clear_button, 0, 0, 1, 1)
        self.content_widget.attach(self._file_picker_button, 1, 0, 1, 1)
        self.content_widget.attach(self._play_button, 2, 0, 1, 1)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        try:
            Gio.DBusProxy.new_for_bus(Gio.BusType.SESSION, Gio.DBusProxyFlags.NONE, None,
                                      "org.cinnamon.SettingsDaemon.Sound",
                                      "/org/cinnamon/SettingsDaemon/Sound",
                                      "org.cinnamon.SettingsDaemon.Sound",
                                      None, self._on_proxy_ready, None)
        except GLib.Error as e:
            print(e.message)
            self._proxy = None
            self._play_button.set_sensitive(False)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def _on_clear_button_clicked(self, *args):
        """On clear button clicked.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.set_value("")
        self.update_button_label()

    def _on_proxy_ready(self, object, result, data=None):
        """On proxy ready.

        Parameters
        ----------
        object : GObject.Object
            The object the asynchronous operation was started with.
        result : Gio.AsyncResult
            A :any:`Gio.AsyncResult`.
        data : None, optional
            User data passed to the callback.
        """
        self._proxy = Gio.DBusProxy.new_for_bus_finish(result)
        self.update_button_label()

    def on_play_clicked(self, widget):
        """On play button clicked.

        Parameters
        ----------
        widget : Gtk.Button
            The button that triggered this function.
        """
        self._proxy.PlaySoundFile("(us)", 0, self.get_value())

    def on_picker_clicked(self, widget):
        """On picker clicked.

        Parameters
        ----------
        widget : Gtk.Button
            The button that triggered this function.
        """
        dialog = Gtk.FileChooserDialog(
            title=self.label.get_text(),
            use_header_bar=get_global("USE_HEADER_BARS_ON_DIALOGS"),
            action=Gtk.FileChooserAction.OPEN,
            transient_for=get_toplevel_window(self),
            buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                     _("_Open"), Gtk.ResponseType.ACCEPT)
        )

        if os.path.exists(self.get_value()):
            dialog.set_filename(self.get_value())
        else:
            dialog.set_current_folder("/usr/share/sounds")

        sound_filter = Gtk.FileFilter()

        if self._event_sounds:
            sound_filter.add_mime_type("audio/x-wav")
            sound_filter.add_mime_type("audio/x-vorbis+ogg")
        else:
            sound_filter.add_mime_type("audio/*")

        sound_filter.set_name(_("Sound files"))
        dialog.add_filter(sound_filter)

        response = dialog.run()

        if response == Gtk.ResponseType.ACCEPT:
            name = dialog.get_filename()
            self.set_value(name)

        self.update_button_label()
        dialog.destroy()

    def update_button_label(self):
        """Update button label.
        """
        absolute_path = self.get_value()

        if absolute_path:
            self._button_label.set_label(GLib.path_get_basename(absolute_path))
            self._file_picker_button.set_tooltip_text(absolute_path)
            self._play_button.set_sensitive(bool(self._proxy))

            if not GLib.file_test(absolute_path, GLib.FileTest.EXISTS):
                self._file_picker_button.set_tooltip_text(
                    _("Non-existent file") + "\n" + absolute_path)
                # Mark for deletion on EOL. Gtk4
                # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
                self._button_label.get_style_context().add_class(Gtk.STYLE_CLASS_ERROR)
                self._play_button.set_sensitive(False)
        else:
            self._button_label.set_label(_("No sound"))
            self._play_button.set_sensitive(False)

    def on_setting_changed(self, *args):
        """See :any:`JSONSettingsBackend.on_setting_changed`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.update_button_label()

    def connect_widget_handlers(self, *args):
        """See :any:`JSONSettingsBackend.connect_widget_handlers`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self._clear_button.connect("clicked", self._on_clear_button_clicked)
        self._play_button.connect("clicked", self.on_play_clicked)
        self._file_picker_button.connect("clicked", self.on_picker_clicked)


if __name__ == "__main__":
    pass
