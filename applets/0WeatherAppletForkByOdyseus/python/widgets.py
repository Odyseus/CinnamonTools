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
import cgi
import collections
import gettext
import gi
import json
import operator
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

HOME = os.path.expanduser("~")

gettext.bindtextdomain("{{UUID}}", HOME + "/.local/share/locale")
gettext.textdomain("{{UUID}}")
_ = gettext.gettext

CAN_BACKEND = [
    "Button",
    "ComboBox",
    "Entry",
    "IconChooser",
    "List",
    "Switch",
    # "ColorChooser",
    # "DateChooser",
    # "EffectChooser",
    # "FileChooser",
    # "FontButton",
    # "Keybinding",
    # "Range",
    # "SoundFileChooser",
    "SpinButton",
    # "TextView",
    # "TweenChooser"
]


JSON_SETTINGS_PROPERTIES_MAP = {
    "columns": "columns",
    "move-buttons": "move_buttons",
    "description": "label",
    "expand-width": "expand_width",
    "height": "height",
    "use-markup": "use_markup",
    "max": "maxi",
    "min": "mini",
    "possible": "possible",
    "select-dir": "dir_select",
    "show-value": "show_value",
    "step": "step",
    "tooltip": "tooltip",
    "units": "units",
}

XLET_SETTINGS_WIDGETS = {
    # NOTE: Custom simplified widget.
    "button": "JSONSettingsButton",
    "combobox": "JSONSettingsComboBox",
    "entry": "JSONSettingsEntry",
    "iconfilechooser": "JSONSettingsIconChooser",
    "list": "JSONSettingsList",
    "switch": "JSONSettingsSwitch",
    # "colorchooser": "JSONSettingsColorChooser",
    # "datechooser": "JSONSettingsDateChooser",
    # "effect": "JSONSettingsEffectChooser",
    # "filechooser": "JSONSettingsFileChooser",
    # "fontchooser": "JSONSettingsFontButton",
    # "keybinding": "JSONSettingsKeybinding",
    # "scale": "JSONSettingsRange",
    # "soundfilechooser": "JSONSettingsSoundFileChooser",
    "spinbutton": "JSONSettingsSpinButton",
    # "textview": "JSONSettingsTextView",
    # "tween": "JSONSettingsTweenChooser",
}


def _import_export(parent, type, last_dir):
    if type == "export":
        mode = Gtk.FileChooserAction.SAVE
        string = _("Select or enter file to export to")
        # TO TRANSLATORS: Could be left blank.
        btns = (_("_Cancel"), Gtk.ResponseType.CANCEL,
                _("_Save"), Gtk.ResponseType.ACCEPT)
    elif type == "import":
        mode = Gtk.FileChooserAction.OPEN
        string = _("Select a file to import")
        # TO TRANSLATORS: Could be left blank.
        btns = (_("_Cancel"), Gtk.ResponseType.CANCEL,
                # TO TRANSLATORS: Could be left blank.
                _("_Open"), Gtk.ResponseType.OK)

    dialog = Gtk.FileChooserDialog(transient_for=parent.get_toplevel(),
                                   title=string,
                                   action=mode,
                                   buttons=btns)

    if last_dir:
        dialog.set_current_folder(last_dir)

    if type == "export":
        dialog.set_do_overwrite_confirmation(True)

    filter_text = Gtk.FileFilter()
    filter_text.add_pattern("*.json")
    filter_text.set_name(_("JSON files"))

    dialog.add_filter(filter_text)

    filepath = None
    response = dialog.run()

    if response == Gtk.ResponseType.ACCEPT or response == Gtk.ResponseType.OK:
        filepath = dialog.get_filename()

        if type == "export" and ".json" not in filepath:
            filepath = filepath + ".json"

    dialog.destroy()

    return filepath


class BaseGrid(Gtk.Grid):

    def __init__(self, tooltip="", orientation=Gtk.Orientation.VERTICAL):
        super().__init__()
        self.set_orientation(orientation)
        self.set_tooltip_text(tooltip)

    def set_spacing(self, col, row):
        self.set_column_spacing(col)
        self.set_row_spacing(row)


class SectionContainer(Gtk.Frame):

    def __init__(self, title):
        Gtk.Frame.__init__(self)
        self.set_shadow_type(Gtk.ShadowType.IN)

        self.box = BaseGrid()
        self.box.set_border_width(0)
        self.box.set_property("margin", 0)
        self.box.set_spacing(0, 0)
        self.add(self.box)

        toolbar = Gtk.Toolbar()
        Gtk.StyleContext.add_class(Gtk.Widget.get_style_context(toolbar), "cs-header")

        label = Gtk.Label()
        label.set_markup("<b>%s</b>" % title)
        title_holder = Gtk.ToolItem()
        title_holder.add(label)
        toolbar.add(title_holder)
        self.box.attach(toolbar, 0, 0, 2, 1)

        self.need_separator = False

    def add_row(self, widget, col_pos, row_pos, col_span, row_span):
        list_box = Gtk.ListBox()
        list_box.set_selection_mode(Gtk.SelectionMode.NONE)
        row = Gtk.ListBoxRow()
        row.add(widget)

        if self.need_separator:
            list_box.add(Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL))

        if isinstance(widget, Switch):
            list_box.connect("row-activated", widget.clicked)

        list_box.add(row)

        self.box.attach(list_box, col_pos, row_pos, col_span, row_span)

        self.need_separator = True

    def add_reveal_row(self, widget, col_pos, row_pos, col_span, row_span,
                       schema=None, key=None, values=None, check_func=None, revealer=None):
        vbox = BaseGrid()

        if self.need_separator:
            vbox.add(Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL))

        list_box = Gtk.ListBox()
        list_box.set_selection_mode(Gtk.SelectionMode.NONE)
        row = Gtk.ListBoxRow(can_focus=False)
        row.add(widget)

        if isinstance(widget, Switch):
            list_box.connect("row-activated", widget.clicked)

        list_box.add(row)
        vbox.add(list_box)

        # FIXME: Handle only JSONSettingsRevealer for now.
        # if revealer is None:
        #     revealer = SettingsRevealer(schema, key, values, check_func)

        widget.revealer = revealer
        revealer.add(vbox)
        self.box.attach(revealer, col_pos, row_pos, col_span, row_span)

        self.need_separator = True

        return revealer


class SettingsWidget(BaseGrid):
    def __init__(self, dep_key=None):
        super().__init__(orientation=Gtk.Orientation.HORIZONTAL)

        if dep_key:
            self.set_dep_key(dep_key)

    def set_dep_key(self, dep_key):
        flag = Gio.SettingsBindFlags.GET
        if dep_key[0] == "!":
            dep_key = dep_key[1:]
            flag |= Gio.Settings.BindFlags.INVERT_BOOLEAN

        split = dep_key.split("/")
        dep_settings = Gio.Settings.new(split[0])
        dep_settings.bind(split[1], self, "sensitive", flag)

    def add_to_size_group(self, group):
        group.add_widget(self.content_widget)

    def fill_row(self):
        self.set_border_width(0)
        self.set_margin_left(0)
        self.set_margin_right(0)

    def get_settings(self, schema):
        global settings_objects
        try:
            return settings_objects[schema]
        except Exception:
            settings_objects[schema] = Gio.Settings.new(schema)
            return settings_objects[schema]


class Text(SettingsWidget):
    def __init__(self, label, align=Gtk.Align.START, use_markup=False):
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

        if use_markup:
            self.content_widget.set_markup(label)
        else:
            self.content_widget.set_label(label)

        self.attach(self.content_widget, 0, 0, 1, 1)


class Button(SettingsWidget):
    do_not_bind = True

    def __init__(self, label, tooltip=""):
        super().__init__()
        self.label = label

        self.content_widget = Gtk.Button(label=label)
        self.attach(self.content_widget, 0, 0, 2, 1)
        self.content_widget.connect("clicked", self._on_button_clicked)
        self.content_widget.set_hexpand(True)

        self.set_tooltip_text(tooltip)

    def _on_button_clicked(self, *args):
        self.set_value(not self.get_value())

    def set_label(self, label):
        self.label = label
        self.content_widget.set_label(label)

    def connect_widget_handlers(self, *args):
        pass

    def on_setting_changed(self, *args):
        pass


class SettingsLabel(Gtk.Label):

    def __init__(self, text=None, use_markup=False):
        super().__init__()

        if use_markup:
            self.set_markup(text)
        else:
            self.set_label(text)

        self.set_alignment(0.0, 0.5)

    def set_label_text(self, text):
        self.set_label(text)

    def set_label_markup(self, markup):
        self.set_markup(markup)


class IconChooser(SettingsWidget):
    bind_prop = "text"
    bind_dir = Gio.SettingsBindFlags.DEFAULT

    def __init__(self, label, expand_width=False, size_group=None, dep_key=None, tooltip=""):
        super().__init__(dep_key=dep_key)

        valid, self.width, self.height = Gtk.icon_size_lookup(Gtk.IconSize.BUTTON)

        self.set_spacing(5, 5)

        self.label = SettingsLabel(label)

        self.content_widget = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        self.content_widget.set_spacing(5, 0)
        self.content_widget.set_hexpand(True)
        self.bind_object = Gtk.Entry()
        self.bind_object.set_hexpand(True)
        self.image_button = Gtk.Button()

        self.preview = Gtk.Image.new()
        self.image_button.set_image(self.preview)

        self.content_widget.attach(self.bind_object, 0, 0, 1, 1)
        self.content_widget.attach(self.image_button, 1, 0, 1, 1)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        self.image_button.connect("clicked", self.on_button_pressed)
        self.handler = self.bind_object.connect("changed", self.set_icon)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def set_icon(self, *args):
        val = self.bind_object.get_text()
        if os.path.exists(val) and not os.path.isdir(val):
            img = GdkPixbuf.Pixbuf.new_from_file_at_size(val, self.width, self.height)
            self.preview.set_from_pixbuf(img)
        else:
            self.preview.set_from_icon_name(val, Gtk.IconSize.BUTTON)

    def on_button_pressed(self, widget):
        dialog = Gtk.FileChooserDialog(title=_("Choose an Icon"),
                                       action=Gtk.FileChooserAction.OPEN,
                                       transient_for=self.get_toplevel(),
                                       buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                                                _("_Open"), Gtk.ResponseType.OK))

        filter_text = Gtk.FileFilter()
        filter_text.set_name(_("Image files"))
        filter_text.add_mime_type("image/*")
        dialog.add_filter(filter_text)

        preview = Gtk.Image()
        dialog.set_preview_widget(preview)
        dialog.connect("update-preview", self.update_icon_preview_cb, preview)

        response = dialog.run()

        if response == Gtk.ResponseType.OK:
            filename = dialog.get_filename()
            self.bind_object.set_text(filename)
            self.set_value(filename)

        dialog.destroy()

    def update_icon_preview_cb(self, dialog, preview):
        filename = dialog.get_preview_filename()
        dialog.set_preview_widget_active(False)
        if filename is not None:
            if os.path.isfile(filename):
                pixbuf = GdkPixbuf.Pixbuf.new_from_file(filename)
                if pixbuf is not None:
                    if pixbuf.get_width() > 128:
                        pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_size(filename, 128, -1)
                    elif pixbuf.get_height() > 128:
                        pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_size(filename, -1, 128)
                    preview.set_from_pixbuf(pixbuf)
                    dialog.set_preview_widget_active(True)


class Entry(SettingsWidget):
    bind_prop = "text"
    bind_dir = Gio.SettingsBindFlags.DEFAULT

    def __init__(self, label, expand_width=False, size_group=None, dep_key=None, tooltip=""):
        super().__init__(dep_key=dep_key)
        self.set_spacing(5, 5)

        self.label = SettingsLabel(label)
        self.content_widget = Gtk.Entry()
        self.content_widget.set_valign(Gtk.Align.CENTER)
        self.content_widget.set_hexpand(expand_width)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)


class Switch(SettingsWidget):
    bind_prop = "active"
    bind_dir = Gio.SettingsBindFlags.DEFAULT

    def __init__(self, label, dep_key=None, tooltip=""):
        super().__init__(dep_key=dep_key)
        self.set_spacing(5, 5)

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)
        self.content_widget = Gtk.Switch(valign=Gtk.Align.CENTER)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        self.set_tooltip_text(tooltip)

    def clicked(self, *args):
        if self.is_sensitive():
            self.content_widget.set_active(not self.content_widget.get_active())


class InfoLabel(BaseGrid):
    def __init__(self, label, align=Gtk.Align.START):
        super().__init__()
        self.set_spacing(5, 5)

        if align == Gtk.Align.END:
            xalign = 1.0
            justification = Gtk.Justification.RIGHT
        elif align == Gtk.Align.CENTER:
            xalign = 0.5
            justification = Gtk.Justification.CENTER
        else:  # START and FILL align left
            xalign = 0
            justification = Gtk.Justification.LEFT

        self.content_widget = Gtk.Label(label, halign=align, xalign=xalign, justify=justification)
        self.content_widget.set_line_wrap(True)
        self.attach(self.content_widget, 0, 0, 1, 1)


class ComboBox(SettingsWidget):
    bind_dir = None

    def __init__(self, label, options=[], valtype=None, size_group=None, dep_key=None, tooltip=""):
        super().__init__()
        self.set_spacing(5, 5)

        self.valtype = valtype
        self.option_map = {}

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)

        self.content_widget = Gtk.ComboBox()
        renderer_text = Gtk.CellRendererText()
        self.content_widget.pack_start(renderer_text, True)
        self.content_widget.add_attribute(renderer_text, "text", 1)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        self.content_widget.set_valign(Gtk.Align.CENTER)

        self.set_options(options)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def on_my_value_changed(self, widget):
        tree_iter = widget.get_active_iter()
        if tree_iter is not None:
            self.value = self.model[tree_iter][0]
            self.set_value(self.value)

    def on_setting_changed(self, *args):
        self.value = self.get_value()
        try:
            self.content_widget.set_active_iter(self.option_map[self.value])
        except Exception:
            self.content_widget.set_active_iter(None)

    def connect_widget_handlers(self, *args):
        self.content_widget.connect('changed', self.on_my_value_changed)

    def set_options(self, options):
        if self.valtype is not None:
            var_type = self.valtype
        else:
            # assume all keys are the same type (mixing types is going to cause an error somewhere)
            var_type = type(options[0][0])

        self.model = Gtk.ListStore(var_type, str)

        for option in options:
            self.option_map[option[0]] = self.model.append([option[0], option[1]])

        self.content_widget.set_model(self.model)
        self.content_widget.set_id_column(0)


class SpinButton(SettingsWidget):
    bind_prop = "value"
    bind_dir = Gio.SettingsBindFlags.GET

    def __init__(self, label, units="", mini=None, maxi=None, step=1, page=None, size_group=None, dep_key=None, tooltip=""):
        super().__init__(dep_key=dep_key)
        self.set_spacing(5, 5)

        self.timer = None

        if units:
            label += " (%s)" % units

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)
        self.content_widget = Gtk.SpinButton()
        self.content_widget.set_valign(Gtk.Align.CENTER)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        range = self.get_range()

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
        if (step and '.' in str(step)):
            digits = len(str(step).split('.')[1])
        self.content_widget.set_digits(digits)

        self.content_widget.connect("value-changed", self.apply_later)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def apply_later(self, *args):
        def apply(self):
            self.set_value(self.content_widget.get_value())
            self.timer = None

        if self.timer:
            GLib.source_remove(self.timer)
        self.timer = GLib.timeout_add(300, apply, self)


OPERATIONS = ['<=', '>=', '<', '>', '!=', '=']

OPERATIONS_MAP = {'<': operator.lt, '<=': operator.le, '>': operator.gt,
                  '>=': operator.ge, '!=': operator.ne, '=': operator.eq}


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
            if dep_key[:1] is '!':
                self.invert = True
                self.dep_key = dep_key[1:]
            else:
                self.invert = False
                self.dep_key = dep_key

        self.box = BaseGrid()
        # self.box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=15)
        Gtk.Revealer.add(self, self.box)

        self.set_transition_type(Gtk.RevealerTransitionType.SLIDE_DOWN)
        self.set_transition_duration(150)

        self.settings.listen(self.dep_key, self.key_changed)
        self.key_changed(self.dep_key, self.settings.get_value(self.dep_key))

    def add(self, widget):
        self.box.attach(widget, 0, 0, 1, 1)
        # self.box.pack_start(widget, False, True, 0)

    def key_changed(self, dep_key, value):
        print("dep_key")
        print(dep_key)
        print("value")
        print(value)
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


LIST_VARIABLE_TYPE_MAP = {
    "boolean": bool,
    "file": str,
    "float": float,
    "icon": str,
    "integer": int,
    "keybinding": str,
    "sound": str,
    "string": str,
}

LIST_CLASS_TYPE_MAP = {
    "boolean": Switch,
    "icon": IconChooser,
    "string": Entry,
    # "file": FileChooser,
    "float": SpinButton,
    "integer": SpinButton,
    # "keybinding": Keybinding,
    # "sound": SoundFileChooser,
}

LIST_PROPERTIES_MAP = {
    "expand-width": "expand_width",
    "max": "maxi",
    "min": "mini",
    "select-dir": "dir_select",
    "step": "step",
    "title": "label",
    "units": "units",
    "tooltip": "tooltip",
}


def list_edit_factory(options):
    kwargs = {}

    if "options" in options:
        kwargs["valtype"] = LIST_VARIABLE_TYPE_MAP[options["type"]]
        widget_type = ComboBox
        options_list = options["options"]

        if isinstance(options_list, dict):
            kwargs["options"] = sorted([(b, a) for a, b in options_list.items()])
        else:
            kwargs["options"] = zip(options_list, options_list)

    else:
        widget_type = LIST_CLASS_TYPE_MAP[options["type"]]

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

    for prop in options:
        if prop in LIST_PROPERTIES_MAP:
            kwargs[LIST_PROPERTIES_MAP[prop]] = options[prop]

    return Widget(**kwargs)


class List(SettingsWidget):
    bind_dir = None

    def __init__(self, label=None, columns=None, height=200, move_buttons=True):
        super().__init__()
        self.columns = columns
        self.move_buttons = move_buttons
        self.set_hexpand(True)
        self.set_vexpand(True)
        self.timer = None
        self.app_window = None

        if label is not None:
            self.label = Gtk.Label(label)

        self.tooltips_storage = {}
        self.content_widget = Gtk.TreeView()
        self.content_widget.set_grid_lines(Gtk.TreeViewGridLines.BOTH)

        self.content_widget.connect("key-press-event", self.key_press_cb)

        scrollbox = Gtk.ScrolledWindow()
        scrollbox.set_size_request(-1, height)
        scrollbox.set_hexpand(True)
        scrollbox.set_vexpand(True)
        scrollbox.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC)
        self.attach(scrollbox, 0, 0, 1, 1)
        scrollbox.add(self.content_widget)

        types = []

        for i in range(len(columns)):
            column_def = columns[i]
            types.append(LIST_VARIABLE_TYPE_MAP[column_def["type"]])

            if column_def.get("tooltip"):
                self.tooltips_storage[column_def["title"]] = column_def["tooltip"]

            has_option_map = "options" in column_def and isinstance(column_def["options"], dict)
            render_type = "string" if has_option_map else column_def["type"]

            if render_type == "boolean":
                renderer = Gtk.CellRendererToggle()

                def toggle_checkbox(widget, path, col):
                    self.model[path][col] = not self.model[path][column]
                    self.list_changed(path)

                renderer.connect("toggled", toggle_checkbox, i)
                prop_name = "active"
            elif render_type == "integer" or render_type == "float":
                renderer = Gtk.CellRendererSpin()
                renderer.set_property("editable", True)

                def edit_spin(widget, path, value, col):
                    self.model[path][col] = int(value)
                    self.list_changed(path)

                renderer.connect("edited", edit_spin, i)
                adjustment = Gtk.Adjustment()

                if column_def.get("min"):
                    adjustment.set_lower(column_def.get("min"))

                if column_def.get("max"):
                    adjustment.set_upper(column_def.get("max"))

                if column_def.get("step"):
                    adjustment.set_step_increment(column_def.get("step"))

                renderer.set_property("adjustment", adjustment)
                renderer.set_property("editable", True)

                prop_name = "text"
            elif render_type == "icon":
                renderer = Gtk.CellRendererPixbuf()
                prop_name = "icon_name"
            else:
                renderer = Gtk.CellRendererText()
                renderer.set_property("wrap-mode", Pango.WrapMode.WORD_CHAR)
                renderer.set_property("wrap-width", 250)
                prop_name = "text"

            column = Gtk.TreeViewColumn(column_def["title"], renderer)

            if has_option_map:
                def map_func(col, rend, model, row_iter, options):
                    value = model[row_iter][i]
                    for key, val in options.items():
                        if val == value:
                            rend.set_property("text", key)

                column.set_cell_data_func(renderer, map_func, column_def["options"])
            else:
                column.add_attribute(renderer, prop_name, i)

            if "align" in column_def:
                renderer.set_alignment(column_def["align"], 0.5)

            column.set_resizable(True)
            self.content_widget.append_column(column)

        if len(self.tooltips_storage) > 0:
            self.content_widget.props.has_tooltip = True
            self.content_widget.connect("query-tooltip", self.query_tooltip_cb)

        self.model = Gtk.ListStore(*types)
        self.content_widget.set_model(self.model)

        button_toolbar = Gtk.Toolbar()
        button_toolbar.set_icon_size(1)
        button_toolbar.set_halign(Gtk.Align.FILL)
        button_toolbar.set_hexpand(True)
        Gtk.StyleContext.add_class(Gtk.Widget.get_style_context(button_toolbar), "inline-toolbar")
        self.attach(button_toolbar, 0, 1, 1, 1)

        button_holder = Gtk.ToolItem()
        button_holder.set_expand(True)
        button_toolbar.add(button_holder)
        buttons_box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        buttons_box.set_halign(Gtk.Align.CENTER)
        button_holder.add(buttons_box)

        self.add_button = Gtk.ToolButton(None, None)
        self.add_button.set_icon_name("list-add-symbolic")
        self.add_button.set_tooltip_text(_("Add new item"))
        self.add_button.connect("clicked", self.add_item)

        self.remove_button = Gtk.ToolButton(None, None)
        self.remove_button.set_icon_name("list-remove-symbolic")
        self.remove_button.set_tooltip_text(_("Remove selected item"))
        # NOTE: Using button-release-event to be able to catch events.
        # clicked event doesn't pass the event. ¬¬
        self.remove_button.connect("button-release-event", self.remove_item_cb)
        self.remove_button.set_sensitive(False)

        self.edit_button = Gtk.ToolButton(None, None)
        self.edit_button.set_icon_name("view-list-symbolic")
        self.edit_button.set_tooltip_text(_("Edit selected item"))
        self.edit_button.connect("clicked", self.edit_item)
        self.edit_button.set_sensitive(False)

        buttons_box.attach(self.add_button, 0, 0, 1, 1)
        buttons_box.attach(self.remove_button, 1, 0, 1, 1)
        buttons_box.attach(self.edit_button, 2, 0, 1, 1)

        last_position = 3

        if self.move_buttons:
            self.move_up_button = Gtk.ToolButton(None, None)
            self.move_up_button.set_icon_name("go-up-symbolic")
            self.move_up_button.set_tooltip_text(_("Move selected item up"))
            self.move_up_button.connect("clicked", self.move_item_up)
            self.move_up_button.set_sensitive(False)
            buttons_box.attach(self.move_up_button, last_position, 0, 1, 1)
            last_position += 1

            self.move_down_button = Gtk.ToolButton(None, None)
            self.move_down_button.set_icon_name("go-down-symbolic")
            self.move_down_button.set_tooltip_text(_("Move selected item down"))
            self.move_down_button.connect("clicked", self.move_item_down)
            self.move_down_button.set_sensitive(False)
            buttons_box.attach(self.move_down_button, last_position, 0, 1, 1)
            last_position += 1

        if self.imp_exp_path_key:
            self.export_button = Gtk.ToolButton(None, None)
            self.export_button.set_icon_name("custom-export-data-symbolic")
            self.export_button.set_tooltip_text(_("Export data"))
            self.export_button.connect("clicked", self.export_data)
            self.export_button.set_sensitive(False)
            buttons_box.attach(self.export_button, last_position, 0, 1, 1)
            last_position += 1

            import_button = Gtk.ToolButton(None, None)
            import_button.set_icon_name("custom-import-data-symbolic")
            import_button.set_tooltip_text(_("Import data"))
            import_button.connect("clicked", self.import_data)
            buttons_box.attach(import_button, last_position, 0, 1, 1)
            last_position += 1

        if self.apply_key:
            apply_button = Gtk.ToolButton(None, None)
            apply_button.set_icon_name("document-save-symbolic")
            apply_button.set_tooltip_text(_("Apply changes"))
            apply_button.connect("clicked", self.apply_changes)
            buttons_box.attach(apply_button, last_position, 0, 1, 1)

        self.content_widget.get_selection().connect("changed", self.update_button_sensitivity)
        self.content_widget.set_activate_on_single_click(False)
        self.content_widget.connect("row-activated", self.on_row_activated)
        self.update_button_sensitivity()

    def query_tooltip_cb(self, widget, x, y, keyboard_tip, tooltip):
        ctx = widget.get_tooltip_context(x, y, keyboard_tip)

        if not ctx:
            return False

        try:
            path, col, cell_x, cell_y = widget.get_path_at_pos(x, y)
            col_title = col.get_title()
        except Exception:
            return False
        else:
            if self.tooltips_storage.get(col_title):
                tooltip.set_text(self.tooltips_storage.get(col_title))
                widget.set_tooltip_cell(tooltip, ctx.path, col, None)
                return True

            return False

    def key_press_cb(self, widget, event):
        state = event.get_state() & Gdk.ModifierType.CONTROL_MASK
        ctrl = state == Gdk.ModifierType.CONTROL_MASK
        symbol, keyval = event.get_keyval()

        if symbol and keyval == Gdk.KEY_Delete:
            self.remove_item_cb(None, event)
            return True
        elif ctrl and symbol and (keyval == Gdk.KEY_N or keyval == Gdk.KEY_n):
            self.add_item()
            return True
        elif ctrl and symbol and keyval == Gdk.KEY_Up:
            self.move_item_up()
            return True
        elif ctrl and symbol and keyval == Gdk.KEY_Down:
            self.move_item_down()
            return True
        elif ctrl and symbol and keyval == Gdk.KEY_Page_Up:
            self.move_item_to_first_position()
            return True
        elif ctrl and symbol and keyval == Gdk.KEY_Page_Down:
            self.move_item_to_last_position()
            return True

        return False

    def update_button_sensitivity(self, *args):
        model, selected = self.content_widget.get_selection().get_selected()
        if selected is None:
            self.remove_button.set_sensitive(False)
            self.edit_button.set_sensitive(False)
        else:
            self.remove_button.set_sensitive(True)
            self.edit_button.set_sensitive(True)

        if self.move_buttons:
            if selected is None or model.iter_previous(selected) is None:
                self.move_up_button.set_sensitive(False)
            else:
                self.move_up_button.set_sensitive(True)

            if selected is None or model.iter_next(selected) is None:
                self.move_down_button.set_sensitive(False)
            else:
                self.move_down_button.set_sensitive(True)

        if self.imp_exp_path_key:
            if len(self.settings.get_value(self.pref_key)) == 0:
                self.export_button.set_sensitive(False)
            else:
                self.export_button.set_sensitive(True)

    def on_row_activated(self, *args):
        self.edit_item()

    def add_item(self, *args):
        data = self.open_add_edit_dialog()
        if data is not None:
            self.model.append(data)
            self.list_changed()

    def remove_item_cb(self, widget, event):
        state = event.get_state() & Gdk.ModifierType.CONTROL_MASK
        confirm_removal = state != Gdk.ModifierType.CONTROL_MASK

        if confirm_removal:
            dialog = Gtk.MessageDialog(transient_for=self.get_toplevel(),
                                       modal=True,
                                       message_type=Gtk.MessageType.WARNING,
                                       buttons=Gtk.ButtonsType.YES_NO)

            dialog.set_title(_("Item removal"))

            esc = cgi.escape(
                _("Are you sure that you want to remove this item?"))
            esc += "\n\n<b>%s</b>: %s" % (_("Note"),
                                          _("Press and hold Control key to remove items without confirmation."))
            dialog.set_markup(esc)
            dialog.show_all()
            response = dialog.run()
            dialog.destroy()

            if response == Gtk.ResponseType.YES:
                self.remove_item()

            return None
        else:
            self.remove_item()

    def remove_item(self):
        model, t_iter = self.content_widget.get_selection().get_selected()
        path = model.get_path(t_iter)
        model.remove(t_iter)
        self.list_changed(path)

    def edit_item(self, *args):
        model, t_iter = self.content_widget.get_selection().get_selected()
        data = self.open_add_edit_dialog(model[t_iter])
        if data is not None:
            for i in range(len(data)):
                self.model[t_iter][i] = data[i]
            self.list_changed(model.get_path(t_iter))

    def move_item_up(self, *args):
        model, t_iter = self.content_widget.get_selection().get_selected()
        model.swap(t_iter, model.iter_previous(t_iter))
        self.list_changed(model.get_path(t_iter))

    def move_item_to_first_position(self, *args):
        model, t_iter = self.content_widget.get_selection().get_selected()
        model.move_after(t_iter, None)
        self.list_changed(model.get_path(t_iter))

    def move_item_down(self, *args):
        model, t_iter = self.content_widget.get_selection().get_selected()
        model.swap(t_iter, model.iter_next(t_iter))
        self.list_changed(model.get_path(t_iter))

    def move_item_to_last_position(self, *args):
        model, t_iter = self.content_widget.get_selection().get_selected()
        model.move_before(t_iter, None)
        self.list_changed(model.get_path(t_iter))

    def export_data(self, *args):
        filepath = _import_export(self, "export",
                                  self.settings.get_value(self.imp_exp_path_key))

        if filepath:
            if os.path.exists(filepath):
                os.remove(filepath)

            raw_data = json.dumps(self.settings.get_value(self.pref_key), indent=4)

            with open(filepath, "w+", encoding="UTF-8") as data_file:
                data_file.write(raw_data)

            self.settings.set_value(self.imp_exp_path_key,
                                    os.path.dirname(filepath))

    def import_data(self, *args):
        filepath = _import_export(self, "import",
                                  self.settings.get_value(self.imp_exp_path_key))

        if filepath:
            with open(filepath, "r", encoding="UTF-8") as data_file:
                raw_data = data_file.read()

            try:
                exported_data = json.loads(raw_data, encoding="UTF-8")
            except Exception:
                raise Exception("Failed to parse settings JSON data for file %s" % filepath)

            existent_data = self.settings.get_value(self.pref_key)

            if isinstance(existent_data, list) and isinstance(exported_data, list):
                self.settings.set_value(self.pref_key, existent_data + exported_data)
                self.settings.set_value(self.imp_exp_path_key,
                                        os.path.dirname(filepath))
                self.on_setting_changed()
            else:
                raise Exception("Wrong data type found on file %s" % filepath)

    def apply_changes(self, *args):
        # NOTE: The setting controlled by this widget (List) is saved in real time.
        # This apply_changes function simply toggles a setting that can have a
        # callback attached (on the JavaScript side) so it can be triggered on demand
        # when the Apply changes button is pressed and not every time the data in the
        # widget is modified.
        # This is done so because sometimes one might not desire to attach a
        # callback to this widget.
        self.settings.set_value(self.apply_key,
                                not self.settings.get_value(self.apply_key))

        if self.app_window is not None and isinstance(self.app_window, Gtk.ApplicationWindow):
            self.app_window.emit("destroy")

    def open_add_edit_dialog(self, info=None):
        if info is None:
            title = _("Add new entry")
        else:
            title = _("Edit entry")

        dialog = Gtk.Dialog(transient_for=self.get_toplevel(),
                            title=title,
                            flags=Gtk.DialogFlags.MODAL,
                            buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                                     _("_Save"), Gtk.ResponseType.OK)
                            )

        # Make OK button the default.
        # https://stackoverflow.com/q/23983975
        ok_button = dialog.get_widget_for_response(response_id=Gtk.ResponseType.OK)
        ok_button.set_can_default(True)
        ok_button.grab_default()

        # dialog.set_size_request(width=450, height=-1)
        content_area = dialog.get_content_area()
        content_area.set_border_width(5)

        frame = Gtk.Frame()
        frame.set_shadow_type(Gtk.ShadowType.IN)
        frame_style = frame.get_style_context()
        frame_style.add_class("view")
        content_area.add(frame)

        content = BaseGrid()
        frame.add(content)

        widgets = []
        last_widget_pos = 0

        for i in range(len(self.columns)):
            if len(widgets) != 0:
                content.add(Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL))

            settings_box = Gtk.ListBox()
            settings_box.set_selection_mode(Gtk.SelectionMode.NONE)

            widget = list_edit_factory(self.columns[i])
            widget.set_border_width(5)

            if isinstance(widget, Switch):
                settings_box.connect("row-activated", widget.clicked)

            widgets.append(widget)
            content.attach(settings_box, 0, i, 1, 1)
            settings_box.add(widget)

            if info is not None and info[i] is not None:
                widget.set_widget_value(info[i])
            elif "default" in self.columns[i]:
                widget.set_widget_value(self.columns[i]["default"])

            last_widget_pos += 1

        content_area.show_all()
        response = dialog.run()

        if response == Gtk.ResponseType.OK:
            values = []
            for widget in widgets:
                values.append(widget.get_widget_value())

            dialog.destroy()
            return values

        dialog.destroy()
        return None

    def list_changed(self, path=None):
        data = []
        for row in self.model:
            i = 0
            row_info = {}
            for column in self.columns:
                row_info[column["id"]] = row[i]
                i += 1
            data.append(row_info)

        self.set_value(data)
        self.update_button_sensitivity()

        if path:
            try:
                self.content_widget.get_selection().select_path(path)
            except Exception:
                pass

    def on_setting_changed(self, *args):
        self.model.clear()
        rows = self.get_value()
        for row in rows:
            row_info = []
            for column in self.columns:
                cid = column["id"]
                if cid in row:
                    row_info.append(row[column["id"]])
                elif "default" in column:
                    row_info.append(column["default"])
                else:
                    row_info.append(None)
            self.model.append(row_info)

        self.content_widget.columns_autosize()

    def connect_widget_handlers(self, *args):
        pass


class JSONSettingsHandler():
    def __init__(self, filepath, notify_callback=None):
        super().__init__()

        self.resume_timeout = None
        self.notify_callback = notify_callback

        self.filepath = filepath
        self.file_obj = Gio.File.new_for_path(self.filepath)
        self.file_monitor = self.file_obj.monitor_file(Gio.FileMonitorFlags.SEND_MOVED, None)
        self.file_monitor.connect("changed", self.check_settings)

        self.bindings = {}
        self.listeners = {}
        self.deps = {}

        self.settings = self.get_settings()

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
    if subclass not in CAN_BACKEND:
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
                        kwargs["options"].append((label, value))
            super().__init__(**kwargs)
            self.attach_backend()

    return NewClass


for setting_widget in CAN_BACKEND:
    globals()["JSONSettings" + setting_widget] = json_settings_factory(setting_widget)


class SettingsBox(BaseGrid):

    def __init__(self, pages_object=[], settings={}, app_window=None):
        BaseGrid.__init__(self)
        self.set_border_width(0)
        self.set_spacing(0, 0)
        self.set_property("expand", True)
        self.set_property("margin", 0)

        stack = Gtk.Stack()
        stack.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT_RIGHT)
        stack.set_transition_duration(150)
        stack.set_property("margin", 0)
        stack.set_property("expand", True)

        page_count = 0
        for page_obj in pages_object:
            # Possibility to hide entire pages
            if not page_obj.get("compatible", True):
                continue

            page = BaseGrid()
            page.set_spacing(15, 15)
            page.set_property("expand", True)
            page.set_property("margin-top", 15)
            page.set_property("margin-left", 15)
            page.set_property("margin-right", 15)
            page.set_border_width(0)

            section_count = 0
            for section_obj in page_obj["sections"]:
                # Possibility to hide entire sections
                if not section_obj.get("compatible", True):
                    continue

                section_container = SectionContainer(section_obj["section-title"])
                section_widgets = section_obj["widgets"]

                for i in range(0, len(section_widgets)):
                    widget_obj = section_widgets[i]

                    # Possibility to hide individual widgets
                    if not widget_obj.get("compatible", True):
                        continue

                    if widget_obj["widget-type"] == "label":
                        widget = Text(**widget_obj["args"])
                    elif widget_obj["widget-type"] in XLET_SETTINGS_WIDGETS:
                        widget_obj["args"]["settings"] = settings
                        widget = globals()[XLET_SETTINGS_WIDGETS[widget_obj["widget-type"]]](
                            **widget_obj["args"])
                        if widget_obj["widget-type"] == "list" and app_window is not None:
                            widget.app_window = app_window
                    else:
                        continue

                    if widget_obj["widget-type"] == "list":
                        widget.fill_row()
                    else:
                        widget.set_border_width(5)
                        widget.set_margin_left(15)
                        widget.set_margin_right(15)

                    if widget_obj["widget-type"] == "button":
                        col_span = 2
                    else:
                        col_span = 1

                    if "dependency" in widget_obj["args"].get("properties", []):
                        revealer = JSONSettingsRevealer(
                            settings, widget_obj["args"]["properties"]["dependency"])
                        section_container.add_reveal_row(
                            widget, 0, i + 1, col_span, 1, revealer=revealer)
                    else:
                        section_container.add_row(widget, 0, i + 1, col_span, 1)

                page.attach(section_container, 0, section_count, 1, 1)
                section_count += 1

            page_count += 1
            stack.add_titled(page, "stack_id_%s" % str(page_count), page_obj["page-title"])

        self.stack_switcher = Gtk.StackSwitcher()
        self.stack_switcher.set_stack(stack)
        self.stack_switcher.set_halign(Gtk.Align.CENTER)
        self.stack_switcher.set_homogeneous(False)

        self.attach(stack, 0, 0, 1, 1)

        self.show_all()

    def get_stack_switcher(self):
        return self.stack_switcher


if __name__ == "__main__":
    pass
