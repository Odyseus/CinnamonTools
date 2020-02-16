#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Settings widgets.

Attributes
----------
CAN_BACKEND : list
    List of widgets that can be used to control settings.
JSON_SETTINGS_PROPERTIES_MAP : dict
    JSON attribute to Python keywords argument map used by the settings widgets.
settings_objects : dict
    Storage for instantiated :py:class:`Gio.Settings` instances.
"""
import gi

gi.require_version("Gtk", "3.0")
gi.require_version("Gdk", "3.0")

from gi.repository import GLib
from gi.repository import Gdk
from gi.repository import Gio
from gi.repository import Gtk
from gi.repository import Pango

from .IconChooserWidgets import IconChooserButton
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
        self.set_property("expand", True)
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
            See :any:`SettingsSection`, "section_info".

        Returns
        -------
        object
            :any:`SettingsSection`.
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
            See :any:`SettingsSection`.
        schema : None, optional
            See :py:class:`SettingsRevealer`.
        pref_key : None, optional
            See :py:class:`SettingsRevealer`.
        values : None, optional
            See :py:class:`SettingsRevealer`.
        revealer : None, optional
            The revealer that will be attached to the section and to which the widget will
            be attached to.

        Returns
        -------
        object
            :any:`SettingsSection`.
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
    box : object
        An instance of :any:`BaseGrid` that will contain all widgets in a section.
    frame : object
        An instance of :py:class:`Gtk.Frame` that will contain self.box for aesthetic purposes.
    need_separator : bool
        Flag that indicates if there is a need to insert a separator after a widget.
    revealers : list
        A list were to store a created :py:class:`Gtk.Revealer` inside a section.
    size_group : object
        :py:class:`Gtk.SizeGroup`.
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
            ("information" (default), "error" or"warning") and it will be used to decide which icon
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
        """Add a row to the section.

        Parameters
        ----------
        widget : object
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
        widget : object
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
            See :py:class:`SettingsRevealer`.
        pref_key : None, optional
            See :py:class:`SettingsRevealer`.
        values : None, optional
            See :py:class:`SettingsRevealer`.
        check_func : None, optional
            See :py:class:`SettingsRevealer`.
        revealer : None, optional
            The revealer that will be attached to the section and to which the widget will
            be attached to.

        Returns
        -------
        object
            :any:`JSONSettingsRevealer`.
        object
            :any:`SettingsRevealer`.
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
        object
            :py:class:`Gtk.Label`.
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
    box : object
        An instance of :any:`BaseGrid` that will contain all widgets inside a revealer.
    check_func : object
        A function that when executed will return the condition that will decide
        if the revealer is shown or hidden. It receives two arguments. The first argument is
        the current value of the pref_key preference. The second argument is a list of values
        that could be used to check the current value against.
    settings : object
        :py:class:`Gio.Settings`.
    values : list
        See :py:class:`SettingsRevealer.check_func`.
    """

    def __init__(self, schema=None, pref_key=None, values=None, check_func=None):
        """Initialization.

        Parameters
        ----------
        schema : None, optional
            gsettings schema used to instantiate :py:class:`SettingsRevealer.settings`.
        pref_key : None, optional
            The preference key whose value will determine if the revealer is shown or hidden.
        values : None, optional
            See :py:class:`SettingsRevealer.values`.
        check_func : None, optional
            See :py:class:`SettingsRevealer.check_func`.
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
        """Add widget to revealer.

        Parameters
        ----------
        widget : object
            See : :py:class:`Gtk.Widget`.
        """
        self.box.attach(widget, 0, 0, 1, 1)

    # only used when checking values
    def on_settings_changed(self, settings, pref_key):
        """Function to set the revealer visibility.

        Parameters
        ----------
        settings : object
            :py:class:`Gio.Settings`.
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
        self._main_app = None

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
        """
        flag = Gio.SettingsBindFlags.GET
        if dep_key[0] == "!":
            dep_key = dep_key[1:]
            flag |= Gio.Settings.BindFlags.INVERT_BOOLEAN

        split = dep_key.split("/")
        dep_settings = Gio.Settings.new(split[0])
        dep_settings.bind(split[1], self, "sensitive", flag)

    def add_to_size_group(self, group):
        """Add widget to :py:class:`Gtk.SizeGroup`.

        Parameters
        ----------
        group : object
            :py:class:`Gtk.SizeGroup`.
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
        object
            :py:class:`Gio.Settings`.
        """
        global settings_objects
        try:
            return settings_objects[schema]
        except Exception:
            settings_objects[schema] = Gio.Settings.new(schema)
            return settings_objects[schema]

    def get_main_app(self):
        """Get main application.

        Returns
        -------
        Gtk.Application
            See ``main_app`` of :any:`SettingsBox`.
        """
        return self._main_app

    def set_main_app(self, main_app):
        """Set main application.

        Parameters
        ----------
        main_app : Gtk.Application
            See ``main_app`` of :any:`SettingsBox`.
        """
        self._main_app = main_app


class Text(SettingsWidget):
    """A simple widget to display informative text.

    Attributes
    ----------
    content_widget : object
        The main widget that will be used to represent a setting value.
    label : object
        The label widget.
    """

    def __init__(self, label, align=Gtk.Align.START, use_markup=False):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        align : int, optional
            :py:class:`Gtk.Align`.
        use_markup : bool, optional
            Whether or not to use markup in the label.
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
    """A button widget that when pressed bill toggle a boolean preference.

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    content_widget : object
        The main widget that will be used to represent a setting value.
    label : object
        The label widget.
    """

    bind_dir = None

    def __init__(self, label, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        tooltip : str, optional
            Widget tooltip text.
        """
        super().__init__()
        self.label = label

        self.content_widget = Gtk.Button(label=label, valign=Gtk.Align.CENTER)
        self.attach(self.content_widget, 0, 0, 2, 1)
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
        self.set_property("wrap", True)
        self.set_property("wrap-mode", Pango.WrapMode.WORD)

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
    bind_dir : int, None
        See :any:`JSONSettingsBackend`.
    bind_object : object
        See :any:`JSONSettingsBackend`.
    bind_prop : str
        See :any:`JSONSettingsBackend`.
    content_widget : object
        The main widget that will be used to represent a setting value.
    label : object
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
            :py:class:`Gtk.SizeGroup`.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
        """
        super().__init__(dep_key=dep_key)
        self._timer = None
        self._setting_icon = False

        self.label = SettingsLabel(label)

        self.content_widget = Gtk.Entry()
        value = self.get_value()
        self.content_widget.set_text(value if value is not None else "")
        self.content_widget.set_hexpand(True)
        self.bind_object = IconChooserButton(self)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)
        self.attach(self.bind_object, 2, 0, 1, 1)

        self.content_widget.connect("changed", self._on_entry_changed)
        self.bind_object.connect("icon-selected", self._on_icon_selected)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def set_main_app(self, main_app):
        """Set main application.

        This overrides the method on the root class because the widget that actually needs it is
        self.bind_object, not its container.

        Parameters
        ----------
        main_app : Gtk.Application
            See ``main_app`` of :any:`SettingsBox`.
        """
        self.bind_object.set_main_app(main_app)

    def _on_entry_changed(self, *args):
        """On text entry changed.

        Parameters
        ----------
        *args
            Arguments.
        """
        if not self._setting_icon:
            value = self.content_widget.get_text().strip()
            self.bind_object.set_icon(value)
            self.set_value(value)

    def _on_icon_selected(self, widget, icon):
        """On icon selected.

        Parameters
        ----------
        widget : IconChooserButton
            The icon chooser button.
        icon : str
            The icon name or path to set into the text entry.
        """
        self._setting_icon = True

        if icon is not None:
            self.content_widget.set_text(icon)

        self._setting_icon = False


class Entry(SettingsWidget):
    """An editable entry to store text into a preference.

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    bind_prop : str
        See :any:`JSONSettingsBackend.attach_backend`.
    content_widget : object
        The main widget that will be used to represent a setting value.
    label : object
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
            :py:class:`Gtk.SizeGroup`.
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
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    bind_object : object
        See :any:`JSONSettingsBackend.attach_backend`.
    bind_prop : str
        See :any:`JSONSettingsBackend.attach_backend`.
    content_widget : object
        The main widget that will be used to represent a setting value.
    label : object
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

        This is a workaround for :py:class:`Gtk.TextView` elements.

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


class Switch(SettingsWidget):
    """A switch widget to toggle a boolean preference.

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    bind_prop : str
        See :any:`JSONSettingsBackend.attach_backend`.
    content_widget : object
        The main widget that will be used to represent a setting value.
    label : object
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


class ComboBox(SettingsWidget):
    """A combo box widget from which to choose any of the predefined values.

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    content_widget : object
        The main widget that will be used to represent a setting value.
    label : object
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
            :py:class:`Gtk.SizeGroup`.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
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
        self.content_widget.connect("changed", self._on_my_value_changed)


class ColorChooser(SettingsWidget):
    """Widget to choose a color.

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    content_widget : object
        The main widget that will be used to represent a setting value.
    label : object
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
            :py:class:`Gtk.SizeGroup`.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
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
            Description
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
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    content_widget : object
        The main widget that will be used to represent a setting value.
    label : object
        The label widget.
    """

    bind_dir = None

    def __init__(self, label, dir_select=False, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            The label text.
        dir_select : bool, optional
            If True, enable folder selection on the file chooser. If False,
            enable file selection.
        size_group : None, optional
            :py:class:`Gtk.SizeGroup`.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
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
        """On file selected.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.set_value(self.content_widget.get_uri())

    def _on_clear_button_clicked(self, *args):
        """On clear button clicked.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.set_value("")
        self.content_widget.set_uri("")

    def on_setting_changed(self, *args):
        """See :any:`JSONSettingsBackend.on_setting_changed`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.set_uri(self.get_value())

    def connect_widget_handlers(self, *args):
        """See :any:`JSONSettingsBackend.connect_widget_handlers`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("file-set", self._on_file_selected)
        self._clear_button.connect("clicked", self._on_clear_button_clicked)


class SpinButton(SettingsWidget):
    """A widget to choose and store an integer or float value into a preference.

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    bind_prop : str
        See :any:`JSONSettingsBackend.attach_backend`.
    content_widget : object
        The main widget that will be used to represent a setting value.
    label : object
        The label widget.
    """

    bind_prop = "value"
    bind_dir = Gio.SettingsBindFlags.GET

    def __init__(self, label, units="", mini=None, maxi=None, step=1, page=None, size_group=None, dep_key=None, tooltip=""):
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
            :py:class:`Gtk.SizeGroup`.
        dep_key : None, optional
            See :any:`SettingsWidget.set_dep_key`.
        tooltip : str, optional
            Widget tooltip text.
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
        """Delayed apply.

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
    """A widget to set and store a keybinding into a preference.

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    content_widget : object
        The main widget that will be used to represent a setting value.
    label : object
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
            :py:class:`Gtk.SizeGroup`.
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
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    content_widget : object
        The main widget that will be used to represent a setting value.
    label : object
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
            :py:class:`Gtk.SizeGroup`.
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

        self.set_value(self._kb_button.get_accel_string() + "::" + opt)

    def _on_combo_value_changed(self, combo):
        """On combo box changed.

        Parameters
        ----------
        combo : Gtk.ComboBox
            The widget combo box.
        """
        tree_iter = combo.get_active_iter()

        if tree_iter is not None:
            self.value = self._kb_button.get_accel_string() + "::" + self.model[tree_iter][0]
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


if __name__ == "__main__":
    pass
