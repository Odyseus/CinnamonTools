#!/usr/bin/python3
# -*- coding: utf-8 -*-

import collections
import gettext
import gi
import json
import os
import sys

gi.require_version("Gtk", "3.0")

from gi.repository import Gtk, GLib, Gio, GdkPixbuf, Pango

gettext.install("cinnamon", "/usr/share/locale")

HOME = os.path.expanduser("~")
APPLET_DIR = os.path.dirname(os.path.abspath(__file__))
APPLET_UUID = str(os.path.basename(APPLET_DIR))
APPLET_CONFIG_DIR = os.path.join(HOME, ".cinnamon", "configs", APPLET_UUID)
APPLICATION_ID = "org.Cinnamon.Applets.CinnamonMenu.CustomLaunchersManager"

TRANSLATIONS = {}


def _(string):
    # check for a translation for this xlet
    if APPLET_UUID not in TRANSLATIONS:
        try:
            TRANSLATIONS[APPLET_UUID] = gettext.translation(
                APPLET_UUID, HOME + "/.local/share/locale").gettext
        except IOError:
            try:
                TRANSLATIONS[APPLET_UUID] = gettext.translation(
                    APPLET_UUID, "/usr/share/locale").gettext
            except IOError:
                TRANSLATIONS[APPLET_UUID] = None

    # do not translate white spaces
    if not string.strip():
        return string

    if TRANSLATIONS[APPLET_UUID]:
        result = TRANSLATIONS[APPLET_UUID](string)

        try:
            result = result.decode("utf-8")
        except Exception:
            result = result

        if result != string:
            return result

    return gettext.gettext(string)


COLUMNS = [{
    "id": "title",
    "title": "%s (Mandatory)" % _("Title"),
    "type": "string"
}, {
    "id": "command",
    "title": "%s (Mandatory)" % _("Command"),
    "type": "string"
}, {
    "id": "icon",
    "title": "%s (Mandatory)" % _("Icon"),
    "type": "icon"
}, {
    "id": "description",
    "title": "%s (Optional)" % _("Description"),
    "type": "string"
}]


class BaseGrid(Gtk.Grid):

    def __init__(self, tooltip="", orientation=Gtk.Orientation.VERTICAL):
        Gtk.Grid.__init__(self)
        self.set_orientation(orientation)
        self.set_tooltip_text(tooltip)

    def set_spacing(self, col, row):
        self.set_column_spacing(col)
        self.set_row_spacing(row)


class SectionContainer(Gtk.Frame):

    def __init__(self, title):
        Gtk.Frame.__init__(self)
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
        Gtk.Box.__init__(self, orientation=Gtk.Orientation.HORIZONTAL)

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
        Gtk.Label.__init__(self)
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
        super(IconChooser, self).__init__()

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
        super(Entry, self).__init__()
        self.set_spacing(5, 5)

        self.label = SettingsLabel(label)
        self.content_widget = Gtk.Entry()
        self.content_widget.set_valign(Gtk.Align.CENTER)
        self.content_widget.set_hexpand(True)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)


VARIABLE_TYPE_MAP = {
    "string": str,
    "icon": str,
}

CLASS_TYPE_MAP = {
    "string": Entry,
    "icon": IconChooser,
}

PROPERTIES_MAP = {
    "title": "label",
}


def list_edit_factory(options):
    kwargs = {}
    widget_type = CLASS_TYPE_MAP[options["type"]]

    class Widget(widget_type):
        def __init__(self, **kwargs):
            super(Widget, self).__init__(**kwargs)

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
                except Exception as e:
                    return None
            else:
                if hasattr(self, "bind_object"):
                    return self.bind_object.get_property(self.bind_prop)
                return self.content_widget.get_property(self.bind_prop)

    for prop in options:
        if prop in PROPERTIES_MAP:
            kwargs[PROPERTIES_MAP[prop]] = options[prop]

    return Widget(**kwargs)


class List(SettingsWidget):
    bind_dir = None

    def __init__(self, label=None, columns=None, height=200):
        super(List, self).__init__()
        self.columns = columns
        self.set_hexpand(True)
        self.set_vexpand(True)

        if label is not None:
            self.label = Gtk.Label(label)

        self.content_widget = Gtk.TreeView()

        scrollbox = Gtk.ScrolledWindow()
        scrollbox.set_size_request(-1, height)
        scrollbox.set_hexpand(True)
        scrollbox.set_vexpand(True)
        scrollbox.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC)
        self.attach(scrollbox, 0, 0, 1, 1)
        scrollbox.add(self.content_widget)

        types = []
        for i in range(len(columns)):
            types.append(VARIABLE_TYPE_MAP[columns[i]["type"]])
            renderer = Gtk.CellRendererText()
            renderer.set_property("wrap-mode", Pango.WrapMode.WORD_CHAR)
            renderer.set_property("wrap-width", 250)
            column = Gtk.TreeViewColumn(columns[i]["title"], renderer, text=i)
            column.set_resizable(True)
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
        self.remove_button.connect("clicked", self.remove_item)
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
        buttons_box.attach(self.add_button, 0, 0, 1, 1)
        buttons_box.attach(self.remove_button, 1, 0, 1, 1)
        buttons_box.attach(self.edit_button, 2, 0, 1, 1)
        buttons_box.attach(self.move_up_button, 3, 0, 1, 1)
        buttons_box.attach(self.move_down_button, 4, 0, 1, 1)

        refresh_button = Gtk.ToolButton(None, None)
        refresh_button.set_icon_name("document-save-symbolic")
        refresh_button.set_tooltip_text(_("Apply changes"))
        refresh_button.connect("clicked", self.reload_menu)
        buttons_box.attach(refresh_button, 5, 0, 1, 1)

        self.content_widget.get_selection().connect("changed", self.update_button_sensitivity)
        self.content_widget.set_activate_on_single_click(False)
        self.content_widget.connect("row-activated", self.on_row_activated)

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

    def on_row_activated(self, *args):
        self.edit_item()

    def add_item(self, *args):
        data = self.open_add_edit_dialog()
        if data is not None:
            self.model.append(data)
            self.list_changed()

    def remove_item(self, *args):
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

    def move_item_down(self, *args):
        model, t_iter = self.content_widget.get_selection().get_selected()
        model.swap(t_iter, model.iter_next(t_iter))
        self.list_changed()

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
        for i in range(len(self.columns)):
            if len(widgets) != 0:
                content.add(Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL))

            widget = list_edit_factory(self.columns[i])
            widget.set_border_width(5)
            widgets.append(widget)

            settings_box = Gtk.ListBox()
            settings_box.set_selection_mode(Gtk.SelectionMode.NONE)

            content.attach(settings_box, 0, i, 1, 1)
            settings_box.add(widget)

            if info is not None and info[i] is not None:
                widget.set_widget_value(info[i])
            elif "default" in self.columns[i]:
                widget.set_widget_value(self.columns[i]["default"])

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


class AboutDialog(Gtk.AboutDialog):

    def __init__(self, app):
        logo = GdkPixbuf.Pixbuf.new_from_file_at_size(
            os.path.join(app.xlet_dir, "icon.png"), 64, 64)

        Gtk.AboutDialog.__init__(self, transient_for=app.window)
        data = app.xlet_meta

        try:
            contributors_translated = []
            contributors = data["contributors"]

            if isinstance(contributors, str):
                contributors = contributors.split(",")

            for contributor in contributors:
                contributors_translated.append(_(contributor.strip()))

            self.add_credit_section(_("Contributors/Mentions:"),
                                    sorted(contributors_translated, key=self.lowered))
        except Exception:
            pass

        # TO TRANSLATORS:
        # Here goes the name/s of the author/s of the translations.
        # Only e-mail addresses and links to GitHub accounts are allowed. NOTHING MORE.
        self.set_translator_credits(_("translator-credits"))
        self.set_license_type(Gtk.License.GPL_3_0)
        self.set_wrap_license(True)
        self.set_version(data["version"])
        self.set_comments(_(data["description"]))
        self.set_website(data["website"])
        self.set_website_label(_(data["name"]))
        self.set_authors(["Odyseus https://github.com/Odyseus"])
        self.set_logo(logo)
        self.connect("response", self.on_response)

    def lowered(self, item):
        return item.lower()

    def on_response(self, dialog, response):
        self.destroy()


class JSONSettingsHandler(object):
    def __init__(self, filepath):
        super(JSONSettingsHandler, self).__init__()

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
        new_file = open(self.filepath, 'w+')
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
        new_file = open(filepath, 'w+')
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
        super(JSONSettingsList, self).__init__(**kwargs)
        self.attach_backend()


class CustomLaunchersManagerWindow(Gtk.ApplicationWindow):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.set_default_size(800, 450)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.set_icon_from_file(os.path.join(app.xlet_dir, "icon.png"))

    def open_about_dialog(self, widget):
        if app.xlet_meta is not None:
            aboutdialog = AboutDialog(app.xlet_dir)
            aboutdialog.run()


class CustomLaunchersManagerApplication(Gtk.Application):

    def __init__(self, *args, **kwargs):
        self.type = "applet"
        self.uuid = APPLET_UUID
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
                                                   title=_("%s") % self.xlet_meta["name"])
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
