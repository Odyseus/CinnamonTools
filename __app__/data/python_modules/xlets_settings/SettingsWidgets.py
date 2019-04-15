#!/usr/bin/python3
# -*- coding: utf-8 -*-
import cgi
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

from .KeybindingWidgets import ButtonKeybinding
from .common import BaseGrid
from .common import _

__all__ = [
    "Button",
    "CAN_BACKEND",
    "ColorChooser",
    "ComboBox",
    "Entry",
    "FileChooser",
    "IconChooser",
    "Keybinding",
    "KeybindingWithOptions",
    "SectionContainer",
    "SettingsLabel",
    "SettingsRevealer",
    "SettingsWidget",
    "SpinButton",
    "Switch",
    "Text",
    "TextView",
]


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


class SectionContainer(Gtk.Frame):
    def __init__(self, title):
        super().__init__()
        self.set_shadow_type(Gtk.ShadowType.IN)

        self.box = BaseGrid()
        self.box.set_border_width(0)
        self.box.set_property("margin", 0)
        self.box.set_spacing(0, 0)
        self.add(self.box)

        toolbar = Gtk.Toolbar()
        toolbar.set_hexpand(True)
        Gtk.StyleContext.add_class(Gtk.Widget.get_style_context(toolbar), "cs-header")

        label = Gtk.Label()
        label.set_hexpand(True)
        label.set_markup("<b>%s</b>" % cgi.escape(title))
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

        if isinstance(widget, (Switch, ColorChooser)):
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

        if isinstance(widget, (Switch, ColorChooser)):
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


class SettingsRevealer(Gtk.Revealer):
    def __init__(self, schema=None, key=None, values=None, check_func=None):
        # Gtk.Revealer.__init__(self)
        super().__init__()

        self.check_func = check_func

        self.box = BaseGrid(orientation=Gtk.Orientation.VERTICAL, spacing=15)
        Gtk.Revealer.add(self, self.box)

        self.set_transition_type(Gtk.RevealerTransitionType.SLIDE_DOWN)
        self.set_transition_duration(150)

        if schema:
            self.settings = Gio.Settings.new(schema)
            # if there aren't values or a function provided to determine visibility we can do a simple bind
            if values is None and check_func is None:
                self.settings.bind(key, self, "reveal-child", Gio.SettingsBindFlags.GET)
            else:
                self.values = values
                self.settings.connect("changed::" + key, self.on_settings_changed)
                self.on_settings_changed(self.settings, key)

    def add(self, widget):
        self.box.pack_start(widget, False, True, 0)

    # only used when checking values
    def on_settings_changed(self, settings, key):
        value = settings.get_value(key).unpack()
        if self.check_func is None:
            self.set_reveal_child(value in self.values)
        else:
            self.set_reveal_child(self.check_func(value, self.values))


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

    # NOTE: This is to handle gsettings. Don't bother looking at it.
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
            # NOTE: The label should be escaped where it is needed in the
            # label declaration side.
            self.content_widget.set_markup(label)
        else:
            self.content_widget.set_label(label)

        self.attach(self.content_widget, 0, 0, 1, 1)


class Button(SettingsWidget):
    bind_dir = None

    def __init__(self, label, tooltip=""):
        super().__init__()
        self.label = label

        self.content_widget = Gtk.Button(label=label)
        self.attach(self.content_widget, 0, 0, 2, 1)
        self.content_widget.set_hexpand(True)

        self.set_tooltip_text(tooltip)

    def _on_button_clicked(self, *args):
        self.set_value(not self.get_value())

    def set_label(self, label):
        self.label = label
        self.content_widget.set_label(label)

    def connect_widget_handlers(self, *args):
        self.content_widget.connect("clicked", self._on_button_clicked)

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

    def __init__(self, label, expand_width=True, size_group=None, dep_key=None, tooltip=""):
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

    def __init__(self, label, expand_width=True, size_group=None, dep_key=None, tooltip=""):
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


class TextView(SettingsWidget):
    bind_prop = "text"
    bind_dir = Gio.SettingsBindFlags.DEFAULT

    def __init__(self, label, height=200, dep_key=None, tooltip=""):
        super().__init__(dep_key=dep_key)

        self.set_spacing(5, 5)

        self.label = Gtk.Label.new(label)
        self.label.set_halign(Gtk.Align.CENTER)

        self.scrolledwindow = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
        self.scrolledwindow.set_size_request(width=-1, height=height)
        self.scrolledwindow.set_policy(hscrollbar_policy=Gtk.PolicyType.AUTOMATIC,
                                       vscrollbar_policy=Gtk.PolicyType.AUTOMATIC)
        self.scrolledwindow.set_shadow_type(type=Gtk.ShadowType.ETCHED_IN)
        self.content_widget = Gtk.TextView()
        self.content_widget.set_border_width(3)
        self.content_widget.set_hexpand(True)
        self.content_widget.set_wrap_mode(wrap_mode=Gtk.WrapMode.NONE)
        self.bind_object = self.content_widget.get_buffer()

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.scrolledwindow, 0, 1, 1, 1)
        self.scrolledwindow.add(self.content_widget)
        self._value_changed_timer = None


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
        self.content_widget.connect("changed", self.on_my_value_changed)

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


class ColorChooser(SettingsWidget):
    bind_dir = None

    def __init__(self, label, use_alpha=True, size_group=None, dep_key=None, tooltip=""):
        super().__init__(dep_key=dep_key)

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)
        self.content_widget = Gtk.ColorButton()
        self.content_widget.set_use_alpha(use_alpha)
        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def on_setting_changed(self, *args):
        color_string = self.get_value()
        rgba = Gdk.RGBA()
        rgba.parse(color_string)
        self.content_widget.set_rgba(rgba)

    def connect_widget_handlers(self, *args):
        self.content_widget.connect("color-set", self.on_my_value_changed)

    def on_my_value_changed(self, widget):
        self.set_value(self.content_widget.get_rgba().to_string())

    def clicked(self, *args):
        self.content_widget.do_clicked(self.content_widget)


class FileChooser(SettingsWidget):
    bind_dir = None

    def __init__(self, label, dir_select=False, size_group=None, dep_key=None, tooltip=""):
        super().__init__(dep_key=dep_key)
        if dir_select:
            action = Gtk.FileChooserAction.SELECT_FOLDER
        else:
            action = Gtk.FileChooserAction.OPEN

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)
        self.content_widget = Gtk.FileChooserButton(action=action)
        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def on_file_selected(self, *args):
        self.set_value(self.content_widget.get_uri())

    def on_setting_changed(self, *args):
        self.content_widget.set_uri(self.get_value())

    def connect_widget_handlers(self, *args):
        self.content_widget.connect("file-set", self.on_file_selected)


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
        if (step and "." in str(step)):
            digits = len(str(step).split(".")[1])
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


class Keybinding(SettingsWidget):
    bind_dir = None

    def __init__(self, label, num_bind=2, size_group=None, dep_key=None, tooltip=""):
        super().__init__(dep_key=dep_key)
        self.set_spacing(5, 5)

        self.num_bind = num_bind

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)

        self.buttons = []
        self.teach_button = None

        self.content_widget = Gtk.Frame(shadow_type=Gtk.ShadowType.IN)
        self.content_widget.set_valign(Gtk.Align.CENTER)
        box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        self.content_widget.add(box)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        for x in range(self.num_bind):
            if x != 0:
                box.add(Gtk.Separator(orientation=Gtk.Orientation.VERTICAL))
            kb = ButtonKeybinding()
            kb.set_size_request(150, -1)
            kb.connect("accel-edited", self.on_kb_changed)
            kb.connect("accel-cleared", self.on_kb_changed)
            box.attach(kb, x, 0, 1, 1)
            self.buttons.append(kb)

        self.event_id = None
        self.teaching = False

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def on_kb_changed(self, *args):
        bindings = []

        for x in range(self.num_bind):
            string = self.buttons[x].get_accel_string()
            bindings.append(string)

        self.set_value("::".join(bindings))

    def on_setting_changed(self, *args):
        value = self.get_value()
        bindings = value.split("::")

        for x in range(min(len(bindings), self.num_bind)):
            self.buttons[x].set_accel_string(bindings[x])

    def connect_widget_handlers(self, *args):
        pass


class KeybindingWithOptions(SettingsWidget):
    bind_dir = None

    def __init__(self, label, options=[], valtype=None, size_group=None, dep_key=None, tooltip=""):
        super().__init__(dep_key=dep_key)
        self.set_spacing(5, 5)

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)

        self.teach_button = None
        self.valtype = valtype
        self.option_map = {}

        self.content_widget = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        kb_box = Gtk.Frame(shadow_type=Gtk.ShadowType.IN)
        kb_box.set_valign(Gtk.Align.CENTER)

        self.kb_button = ButtonKeybinding()
        self.kb_button.set_size_request(150, -1)
        kb_box.add(self.kb_button)

        self.combo_button = Gtk.ComboBox()
        renderer_text = Gtk.CellRendererText()
        self.combo_button.pack_start(renderer_text, True)
        self.combo_button.add_attribute(renderer_text, "text", 1)
        self.combo_button.set_valign(Gtk.Align.CENTER)

        self.content_widget.attach(kb_box, 0, 0, 1, 1)
        self.content_widget.attach(Gtk.Separator(orientation=Gtk.Orientation.VERTICAL), 1, 0, 1, 1)
        self.content_widget.attach(self.combo_button, 2, 0, 1, 1)

        self.event_id = None
        self.teaching = False

        self.set_options(options)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

    def on_setting_changed(self, *args):
        self.value = self.get_value()

        try:
            binding, option = self.value.split("::")
        except Exception:
            binding, option = "", ""

        self.kb_button.set_accel_string(binding)

        try:
            self.combo_button.set_active_iter(self.option_map[option])
        except Exception:
            self.combo_button.set_active_iter(None)

    def on_kb_changed(self, *args):
        try:
            kb, opt = self.get_value().split("::")
        except Exception:
            kb, opt = "", ""  # noqa

        self.set_value(self.kb_button.get_accel_string() + "::" + opt)

    def on_combo_value_changed(self, combo):
        tree_iter = combo.get_active_iter()

        if tree_iter is not None:
            self.value = self.kb_button.get_accel_string() + "::" + self.model[tree_iter][0]
            self.set_value(self.value)

    def connect_widget_handlers(self, *args):
        self.kb_button.connect("accel-edited", self.on_kb_changed)
        self.kb_button.connect("accel-cleared", self.on_kb_changed)
        self.combo_button.connect("changed", self.on_combo_value_changed)

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


if __name__ == "__main__":
    pass
