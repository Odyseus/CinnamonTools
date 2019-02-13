#!/usr/bin/python3
# -*- coding: utf-8 -*-

import cgi
import collections
import gettext
import gi
import json
import os
import sys

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

APPLICATION_ID = "org.Cinnamon.Applets.CinnamonMenu.CustomLaunchersManager"

COLUMNS = [{
    "id": "enabled",
    "title": _("Enabled"),
    "type": "boolean"
}, {
    "id": "icon",
    "title": "%s (*)" % _("Icon"),
    "type": "icon"
}, {
    "id": "title",
    "title": "%s (*)" % _("Title"),
    "type": "string"
}, {
    "id": "command",
    "title": "%s (*)" % _("Command"),
    "type": "string"
}, {
    "id": "description",
    "title": _("Description"),
    "type": "string"
}]


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
        super().__init__()
        self.set_shadow_type(Gtk.ShadowType.OUT)

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


class SettingsWidget(BaseGrid):
    def __init__(self):
        super().__init__(orientation=Gtk.Orientation.HORIZONTAL)

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


class SettingsLabel(Gtk.Label):

    def __init__(self, text=None, markup=None):
        super().__init__()

        if text:
            self.set_label(text)

        if markup:
            self.set_markup(markup)

        self.set_alignment(0.0, 0.5)

    def set_label_text(self, text):
        self.set_label(text)

    def set_label_markup(self, markup):
        self.set_markup(markup)


class IconChooser(SettingsWidget):
    bind_prop = "text"
    bind_dir = Gio.SettingsBindFlags.DEFAULT

    def __init__(self, label):
        super().__init__()

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

    def __init__(self, label):
        super().__init__()
        self.set_spacing(5, 5)

        self.label = SettingsLabel(label)
        self.content_widget = Gtk.Entry()
        self.content_widget.set_valign(Gtk.Align.CENTER)
        self.content_widget.set_hexpand(True)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)


class Switch(SettingsWidget):
    bind_prop = "active"
    bind_dir = Gio.SettingsBindFlags.DEFAULT

    def __init__(self, label):
        super().__init__()
        self.set_spacing(5, 5)

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)
        self.content_widget = Gtk.Switch(valign=Gtk.Align.CENTER)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

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


VARIABLE_TYPE_MAP = {
    "string": str,
    "icon": str,
    "boolean": bool
}

CLASS_TYPE_MAP = {
    "string": Entry,
    "icon": IconChooser,
    "boolean": Switch
}

PROPERTIES_MAP = {
    "title": "label",
}


def list_edit_factory(options):
    kwargs = {}
    widget_type = CLASS_TYPE_MAP[options["type"]]

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
        if prop in PROPERTIES_MAP:
            kwargs[PROPERTIES_MAP[prop]] = options[prop]

    return Widget(**kwargs)


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


class List(SettingsWidget):
    bind_dir = None

    def __init__(self, label=None, columns=None, height=200):
        super().__init__()
        self.columns = columns
        self.set_hexpand(True)
        self.set_vexpand(True)

        if label is not None:
            self.label = Gtk.Label(label)

        self.content_widget = Gtk.TreeView()
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
            types.append(VARIABLE_TYPE_MAP[column_def["type"]])

            if column_def["type"] == "boolean":
                renderer = Gtk.CellRendererToggle()

                def toggle_checkbox(widget, path, column):
                    self.model[path][column] = not self.model[path][column]
                    self.list_changed()

                renderer.connect("toggled", toggle_checkbox, i)
                prop_name = "active"
            elif column_def["type"] == "icon":
                renderer = Gtk.CellRendererPixbuf()
                prop_name = "icon_name"
            else:
                renderer = Gtk.CellRendererText()
                renderer.set_property("wrap-mode", Pango.WrapMode.WORD_CHAR)
                renderer.set_property("wrap-width", 250)
                prop_name = "text"

            column = Gtk.TreeViewColumn(column_def["title"], renderer)
            column.add_attribute(renderer, prop_name, i)
            # NOTE: Do not set resizable the first column because the GUI crashes
            # when the column is resized to the point of disappearance. ¬¬
            # FYI: The crash doesn't happen on Cinnamon's settings windows.
            column.set_resizable(i != 0)
            self.content_widget.append_column(column)

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
        self.add_button.set_tooltip_text(_("Add new launcher"))
        self.add_button.connect("clicked", self.add_item)

        self.remove_button = Gtk.ToolButton(None, None)
        self.remove_button.set_icon_name("list-remove-symbolic")
        self.remove_button.set_tooltip_text(_("Remove selected launcher"))
        # NOTE: Using button-release-event to be able to catch events.
        # clicked event doesn't pass the event. ¬¬
        self.remove_button.connect("button-release-event", self.remove_item_cb)
        self.remove_button.set_sensitive(False)

        self.edit_button = Gtk.ToolButton(None, None)
        self.edit_button.set_icon_name("view-list-symbolic")
        self.edit_button.set_tooltip_text(_("Edit selected launcher"))
        self.edit_button.connect("clicked", self.edit_item)
        self.edit_button.set_sensitive(False)

        self.move_up_button = Gtk.ToolButton(None, None)
        self.move_up_button.set_icon_name("go-up-symbolic")
        self.move_up_button.set_tooltip_text(_("Move selected launcher up"))
        self.move_up_button.connect("clicked", self.move_item_up)
        self.move_up_button.set_sensitive(False)

        self.move_down_button = Gtk.ToolButton(None, None)
        self.move_down_button.set_icon_name("go-down-symbolic")
        self.move_down_button.set_tooltip_text(_("Move selected launcher down"))
        self.move_down_button.connect("clicked", self.move_item_down)
        self.move_down_button.set_sensitive(False)

        self.export_button = Gtk.ToolButton(None, None)
        self.export_button.set_icon_name("custom-export-launchers-symbolic")
        self.export_button.set_tooltip_text(_("Export launchers"))
        self.export_button.connect("clicked", self.export_launchers)

        import_button = Gtk.ToolButton(None, None)
        import_button.set_icon_name("custom-import-launchers-symbolic")
        import_button.set_tooltip_text(_("Import launchers"))
        import_button.connect("clicked", self.import_launchers)

        refresh_button = Gtk.ToolButton(None, None)
        refresh_button.set_icon_name("document-save-symbolic")
        refresh_button.set_tooltip_text(_("Apply changes"))
        refresh_button.connect("clicked", self.reload_menu)

        buttons_box.attach(self.add_button, 0, 0, 1, 1)
        buttons_box.attach(self.remove_button, 1, 0, 1, 1)
        buttons_box.attach(self.edit_button, 2, 0, 1, 1)
        buttons_box.attach(self.move_up_button, 3, 0, 1, 1)
        buttons_box.attach(self.move_down_button, 4, 0, 1, 1)
        buttons_box.attach(self.export_button, 5, 0, 1, 1)
        buttons_box.attach(import_button, 6, 0, 1, 1)
        buttons_box.attach(refresh_button, 7, 0, 1, 1)

        self.content_widget.get_selection().connect("changed", self.update_button_sensitivity)
        self.content_widget.set_activate_on_single_click(False)
        self.content_widget.connect("row-activated", self.on_row_activated)

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

        if selected is None or model.iter_previous(selected) is None:
            self.move_up_button.set_sensitive(False)
        else:
            self.move_up_button.set_sensitive(True)

        if selected is None or model.iter_next(selected) is None:
            self.move_down_button.set_sensitive(False)
        else:
            self.move_down_button.set_sensitive(True)

        if len(self.settings.get_value("pref_custom_launchers")) == 0:
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

            dialog.set_title(_("Custom launcher removal"))

            esc = cgi.escape(
                _("Are you sure that you want to remove this custom launcher?"))
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
        model.remove(t_iter)

        self.list_changed()

    def edit_item(self, *args):
        model, t_iter = self.content_widget.get_selection().get_selected()
        data = self.open_add_edit_dialog(model[t_iter])
        if data is not None:
            for i in range(len(data)):
                self.model[t_iter][i] = data[i]
            self.list_changed()

    def move_item_up(self, *args):
        model, t_iter = self.content_widget.get_selection().get_selected()
        model.swap(t_iter, model.iter_previous(t_iter))
        self.list_changed()

    def move_item_to_first_position(self, *args):
        model, t_iter = self.content_widget.get_selection().get_selected()
        model.move_after(t_iter, None)
        self.list_changed()

    def move_item_down(self, *args):
        model, t_iter = self.content_widget.get_selection().get_selected()
        model.swap(t_iter, model.iter_next(t_iter))
        self.list_changed()

    def move_item_to_last_position(self, *args):
        model, t_iter = self.content_widget.get_selection().get_selected()
        model.move_before(t_iter, None)
        self.list_changed()

    def export_launchers(self, *args):
        filepath = _import_export(self, "export",
                                  self.settings.get_value("pref_imp_exp_last_selected_directory"))

        if filepath:
            if os.path.exists(filepath):
                os.remove(filepath)

            raw_data = json.dumps(self.settings.get_value("pref_custom_launchers"), indent=4)

            with open(filepath, "w+", encoding="UTF-8") as launchers_file:
                launchers_file.write(raw_data)

            self.settings.set_value("pref_imp_exp_last_selected_directory",
                                    os.path.dirname(filepath))

    def import_launchers(self, *args):
        filepath = _import_export(self, "import",
                                  self.settings.get_value("pref_imp_exp_last_selected_directory"))

        if filepath:
            with open(filepath, "r", encoding="UTF-8") as launchers_file:
                raw_data = launchers_file.read()

            try:
                launchers = json.loads(raw_data, encoding="UTF-8")
            except Exception:
                raise Exception("Failed to parse settings JSON data for file %s" % (filepath))

            self.settings.set_value("pref_custom_launchers", launchers)
            self.settings.set_value("pref_imp_exp_last_selected_directory",
                                    os.path.dirname(filepath))
            self.on_setting_changed()

    def reload_menu(self, *args):
        self.settings.set_value("pref_hard_refresh_menu",
                                not self.settings.get_value("pref_hard_refresh_menu"))

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

        dialog.set_size_request(width=450, height=-1)
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

        content.add(Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL))
        info_label = InfoLabel(" ")
        info_label.set_border_width(5)
        info_label.content_widget.set_markup("<b>(*) %s</b>" % _("Mandatory fields"))
        info_label_container = Gtk.ListBox()
        info_label_container.set_selection_mode(Gtk.SelectionMode.NONE)
        content.attach(info_label_container, 0, last_widget_pos, 1, 1)
        info_label_container.add(info_label)

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

    def list_changed(self, *args):
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


class JSONSettingsHandler(object):
    def __init__(self, filepath):
        super().__init__()

        self.resume_timeout = None

        self.filepath = filepath
        self.file_obj = Gio.File.new_for_path(self.filepath)
        self.settings = self.get_settings()

    def get_value(self, key):
        return self.get_property(key, "value")

    def set_value(self, key, value):
        if value != self.settings[key]["value"]:
            self.settings[key]["value"] = value
            self.save_settings()

    def get_property(self, key, prop):
        props = self.settings[key]
        return props[prop]

    def has_property(self, key, prop):
        return prop in self.settings[key]

    def has_key(self, key):
        return key in self.settings

    def get_settings(self):
        file = open(self.filepath)
        raw_data = file.read()
        file.close()
        try:
            settings = json.loads(raw_data, encoding=None,
                                  object_pairs_hook=collections.OrderedDict)
        except Exception:
            raise Exception("Failed to parse settings JSON data for file %s" % (self.filepath))
        return settings

    def save_settings(self):
        if os.path.exists(self.filepath):
            os.remove(self.filepath)

        raw_data = json.dumps(self.settings, indent=4)
        new_file = open(self.filepath, "w+")
        new_file.write(raw_data)
        new_file.close()

    def load_from_file(self, filepath):
        file = open(filepath)
        raw_data = file.read()
        file.close()
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
            else:
                print("Skipping key %s: the key does not exist in %s or has no value" % (key, filepath))
        self.save_settings()

    def save_to_file(self, filepath):
        if os.path.exists(filepath):
            os.remove(filepath)
        raw_data = json.dumps(self.settings, indent=4)
        new_file = open(filepath, "w+")
        new_file.write(raw_data)
        new_file.close()


class JSONSettingsBackend(object):
    def attach_backend(self):
        self.on_setting_changed()
        self.connect_widget_handlers()

    def set_value(self, value):
        self.settings.set_value(self.key, value)

    def get_value(self):
        return self.settings.get_value(self.key)

    def get_range(self):
        min = self.settings.get_property(self.key, "min")
        max = self.settings.get_property(self.key, "max")
        return [min, max]

    def on_setting_changed(self, *args):
        raise NotImplementedError("SettingsWidget class must implement on_setting_changed().")

    def connect_widget_handlers(self, *args):
        if self.bind_dir is None:
            raise NotImplementedError(
                "SettingsWidget classes with no .bind_dir must implement connect_widget_handlers().")


class JSONSettingsList(List, JSONSettingsBackend):
    """docstring for JSONSettingsList"""

    def __init__(self, key, settings):
        self.key = key
        self.settings = settings
        kwargs = {
            "columns": COLUMNS
        }
        super().__init__(**kwargs)
        self.attach_backend()


class CustomLaunchersManagerWindow(Gtk.ApplicationWindow):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.set_default_size(800, 450)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.set_icon_from_file(os.path.join(app.xlet_dir, "icon.png"))


class CustomLaunchersManagerApplication(Gtk.Application):

    def __init__(self, *args, **kwargs):
        self.type = "applet"
        self.uuid = "{{UUID}}"
        self.selected_instance = None
        self.gsettings = Gio.Settings.new("org.cinnamon")
        self.load_xlet_data()
        self.load_instance()

        GLib.set_application_name(self.xlet_meta["name"])
        super().__init__(*args,
                         application_id="%s-%s" % (APPLICATION_ID, INSTANCE_ID),
                         flags=Gio.ApplicationFlags.FLAGS_NONE,
                         **kwargs)

        self.application = Gtk.Application()
        self.application.connect("activate", self.do_activate)
        self.application.connect("startup", self.do_startup)

    def do_activate(self, data=None):
        self.window.present()

    def do_startup(self, data=None):
        Gtk.Application.do_startup(self)
        self._buildUI()

    def _buildUI(self):
        self.window = CustomLaunchersManagerWindow(application=self,
                                                   title=_(self.xlet_meta["name"]))
        self.window.connect("destroy", self.on_quit)
        page = BaseGrid()
        page.set_spacing(15, 15)
        page.set_border_width(15)
        section_container = SectionContainer(_("Custom launchers"))
        launchers_list = JSONSettingsList(key="pref_custom_launchers",
                                          settings=self.settings)
        section_container.box.attach(launchers_list, 0, 1, 1, 1)
        page.attach(section_container, 0, 0, 1, 1)
        self.window.add(page)
        self.window.show_all()

    def load_xlet_data(self):
        self.xlet_dir = "/usr/share/cinnamon/%ss/%s" % (self.type, self.uuid)
        if not os.path.exists(self.xlet_dir):
            self.xlet_dir = "%s/.local/share/cinnamon/%ss/%s" % (HOME, self.type, self.uuid)

        if os.path.exists("%s/metadata.json" % self.xlet_dir):
            raw_data = open("%s/metadata.json" % self.xlet_dir).read()
            self.xlet_meta = json.loads(raw_data)
        else:
            print("Could not find %s metadata for uuid %s - are you sure it's installed correctly?" %
                  (self.type, self.uuid))
            quit()

        Gtk.IconTheme.get_default().append_search_path(os.path.join(self.xlet_dir, "icons"))

    def load_instance(self):
        path = "%s/.cinnamon/configs/%s" % (HOME, self.uuid)
        self.settings = JSONSettingsHandler(os.path.join(path, "%s.json" % INSTANCE_ID))

    def on_quit(self, action):
        self.quit()


if __name__ == "__main__":
    try:
        arg = sys.argv[1]
    except Exception:
        arg = None

    global INSTANCE_ID
    INSTANCE_ID = arg

    app = CustomLaunchersManagerApplication()
    app.run()
