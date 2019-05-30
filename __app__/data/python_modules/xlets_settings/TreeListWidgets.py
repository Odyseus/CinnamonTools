#!/usr/bin/python3
# -*- coding: utf-8 -*-
import gi
import json
import os

gi.require_version("Gtk", "3.0")
gi.require_version("Gdk", "3.0")

from gi.repository import Gdk
from gi.repository import Gio
from gi.repository import Gtk
from gi.repository import Pango
from html import escape

from .AppChooserWidgets import AppChooser
from .SettingsWidgets import ColorChooser
from .SettingsWidgets import ComboBox
from .SettingsWidgets import Entry
from .SettingsWidgets import FileChooser
from .SettingsWidgets import IconChooser
from .SettingsWidgets import Keybinding
from .SettingsWidgets import KeybindingWithOptions
from .SettingsWidgets import SettingsWidget
from .SettingsWidgets import SpinButton
from .SettingsWidgets import Switch
from .SettingsWidgets import Text
from .SettingsWidgets import TextView
from .SettingsWidgets import _
from .common import BaseGrid
from .common import contrast_rgba_color
from .common import generate_options_from_paths
from .common import import_export
from .common import sort_combo_options
# from SettingsWidgets import SoundFileChooser

LIST_VARIABLE_TYPE_MAP = {
    # appchooser
    "app": str,
    # switch
    "boolean": bool,
    # colorchooser
    "color": str,
    # filechooser
    "file": str,
    # spinbutton
    "float": float,
    # iconfilechooser
    "icon": str,
    # spinbutton
    "integer": int,
    # keybinding
    "keybinding": str,
    # keybinding-with-options
    "keybinding-with-options": str,
    # textview
    "multistring": str,
    # soundfilechooser
    "sound": str,
    # entry
    "string": str,
}

LIST_CLASS_TYPE_MAP = {
    "app": AppChooser,
    "boolean": Switch,
    "color": ColorChooser,
    "file": FileChooser,
    "float": SpinButton,
    "icon": IconChooser,
    "integer": SpinButton,
    "keybinding": Keybinding,
    "keybinding-with-options": KeybindingWithOptions,
    "multistring": TextView,
    "string": Entry,
    # "sound": SoundFileChooser,
}

LIST_PROPERTIES_MAP = {
    # entry and iconfilechooser: If true, expand the widget to all available space.
    "expand-width": "expand_width",
    # spinbutton: Maximum value.
    "max": "maxi",
    # spinbutton: Minimum value.
    "min": "mini",
    # filechooser: If true, enable folder selection of the file chooser. If false,
    # enable file selection.
    "select-dir": "dir_select",
    # spinbutton: Adjustment amount.
    "step": "step",
    # spinbutton: How many digits to handle.
    "digits": "digits",
    # spinbutton: Adjustment amount when using the Page Up/Down keys.
    "page": "page",
    # list: The title for a column.
    "title": "label",
    # spinbutton: Unit type description.
    "units": "units",
    # All widgets.
    "tooltip": "tooltip",
    # keybinding: Expose the number of keybindings to create.
    "num-bind": "num_bind",
    # colorchooser: Whether to be able to specify opacity.
    "use-alpha": "use_alpha",
}


def list_edit_factory(options, xlet_settings):
    kwargs = {}

    if "options-from-paths" in options:
        options["options"] = generate_options_from_paths(
            options["options-from-paths"], xlet_settings)

    if "options" in options:
        kwargs["valtype"] = LIST_VARIABLE_TYPE_MAP[options["type"]]

        if options["type"] == "keybinding-with-options":
            widget_type = KeybindingWithOptions
        else:
            widget_type = ComboBox

        options_list = options["options"]

        # NOTE: Sort both types of options. Otherwise, items will appear in
        # different order every single time the widget is re-built.
        if isinstance(options_list, dict):
            kwargs["options"] = [(a, b) for a, b in options_list.items()]
        else:
            kwargs["options"] = zip(options_list, options_list)

        kwargs["options"] = sort_combo_options(kwargs["options"], options.get("first-option", ""))
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

    def __init__(self, label=None, columns=None, immutable=None, dialog_info_labels=None, height=200,
                 move_buttons=True, dialog_width=450, apply_and_quit=False):
        super().__init__()
        self.columns = columns
        self.immutable = immutable
        self.dialog_info_labels = dialog_info_labels
        self.move_buttons = move_buttons
        self.dialog_width = dialog_width
        self.apply_and_quit = apply_and_quit
        self.set_hexpand(True)
        self.set_vexpand(True)
        self.timer = None
        self.app_window = None

        self.add_button = None
        self.remove_button = None
        self.edit_button = None
        self.move_up_button = None
        self.move_down_button = None
        self.export_button = None

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
                    self.model[path][col] = not self.model[path][col]
                    self.list_changed(path)

                renderer.connect("toggled", toggle_checkbox, i)
                prop_name = "active"
            elif render_type == "integer" or render_type == "float":
                renderer = Gtk.CellRendererSpin()
                renderer.set_property("editable", True)
                digits = 0

                adjustment = Gtk.Adjustment()

                if column_def.get("max") is not None:
                    adjustment.set_upper(column_def["max"])

                if column_def.get("min") is not None:
                    adjustment.set_lower(column_def["min"])

                if column_def.get("step") is not None:
                    step = column_def["step"]
                    adjustment.set_step_increment(step)

                    # NOTE: Without setting the digits property to a Gtk.CellRendererSpin()
                    # that handles floats, the widget is pretty useless.
                    if ("." in str(step)):
                        digits = len(str(step).split(".")[1])

                def edit_spin(widget, path, value, data):
                    # NOTE: Stupid internationalization!
                    # float(value) will fail when value is a comma-separated float. ¬¬
                    # int(value) will fail when value is a comma/dot separated integer. ¬¬
                    # It might not be needed to use replace() for integers, but it doesn't hurt
                    # to have it. So, leave it.
                    val = str(value)
                    num_parser = int

                    if data["num_parser"] == "float":
                        val = val.replace(",", ".")
                        num_parser = float
                    else:
                        val = val.replace(",", "").replace(".", "")

                    self.model[path][data["col_index"]] = num_parser(val)
                    self.list_changed(path)

                renderer.connect("edited", edit_spin, {
                    "col_index": i,
                    "num_parser": render_type
                })
                renderer.set_property("digits", digits)
                renderer.set_property("adjustment", adjustment)
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

            if column_def["type"] == "color":
                def set_color_func(col, rend, model, row_iter, data):
                    value = model[row_iter][data["col_index"]]
                    bg_rgba = Gdk.RGBA()
                    bg_rgba.parse(value)
                    fg_rgba = contrast_rgba_color(bg_rgba)
                    rend.set_property("background-rgba", bg_rgba)
                    rend.set_property("foreground-rgba", fg_rgba)

                column.set_cell_data_func(renderer, set_color_func, {
                    "col_index": i
                })
            elif column_def["type"] == "app":
                def set_app_func(col, rend, model, row_iter, data):
                    value = model[row_iter][data["col_index"]]

                    try:
                        app_info = Gio.DesktopAppInfo.new(value)
                    except Exception:
                        app_info = None

                    if isinstance(app_info, Gio.DesktopAppInfo):
                        rend.set_property("text", app_info.get_display_name())
                    else:
                        rend.set_property("text", _("No app chosen"))

                column.set_cell_data_func(renderer, set_app_func, {
                    "col_index": i
                })

            if has_option_map:
                def map_func(col, rend, model, row_iter, data):
                    value = model[row_iter][data["col_index"]]

                    for val, key in data["options"].items():
                        if data["col_def_type"] == "keybinding-with-options":
                            try:
                                kb, opt = value.split("::")
                            except Exception:
                                kb, opt = "", ""

                            # NOTE: Reduce list "noise".
                            # Do not set text to the cell if there is no keybinding.
                            if kb and val == opt:
                                rend.set_property(
                                    "text",
                                    self.get_keybinding_display_name(kb) + "::" + key
                                )
                                break
                            else:
                                rend.set_property("text", "")
                        else:
                            if val == value:
                                rend.set_property("text", key)
                                break
                            else:
                                rend.set_property("text", "")

                column.set_cell_data_func(renderer, map_func, {
                    "options": column_def["options"],
                    "col_index": i,
                    "col_def_type": column_def["type"]
                })
            else:
                if column_def["type"] == "keybinding":
                    def kb_map_func(col, rend, model, row_iter, data):
                        value = model[row_iter][data["col_index"]]

                        if value:
                            kbs = map(lambda e: self.get_keybinding_display_name(
                                e), value.split("::"))
                            rend.set_property(
                                "text",
                                "::".join(kbs)
                            )
                        else:
                            rend.set_property("text", "")

                    column.set_cell_data_func(renderer, kb_map_func, {
                        "col_index": i
                    })
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
        button_toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR)
        self.attach(button_toolbar, 0, 1, 1, 1)

        button_holder = Gtk.ToolItem()
        button_holder.set_expand(True)
        button_toolbar.add(button_holder)
        buttons_box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        buttons_box.set_halign(Gtk.Align.CENTER)
        button_holder.add(buttons_box)

        button_position = 0

        if self.immutable is None:
            self.add_button = Gtk.ToolButton(None, None)
            self.add_button.set_icon_name("list-add-symbolic")
            self.add_button.set_tooltip_text(_("Add new item"))
            self.add_button.connect("clicked", self.add_item)

            buttons_box.attach(self.add_button, button_position, 0, 1, 1)
            button_position += 1

            self.remove_button = Gtk.ToolButton(None, None)
            self.remove_button.set_icon_name("list-remove-symbolic")
            self.remove_button.set_tooltip_text(_("Remove selected item"))
            # NOTE: Using button-release-event to be able to catch events.
            # clicked event doesn't pass the event. ¬¬
            self.remove_button.connect("button-release-event", self.remove_item_cb)
            self.remove_button.set_sensitive(False)

            buttons_box.attach(self.remove_button, button_position, 0, 1, 1)
            button_position += 1

        self.edit_button = Gtk.ToolButton(None, None)
        self.edit_button.set_icon_name("view-list-symbolic")
        self.edit_button.set_tooltip_text(_("Edit selected item"))
        self.edit_button.connect("clicked", self.edit_item)
        self.edit_button.set_sensitive(False)

        buttons_box.attach(self.edit_button, button_position, 0, 1, 1)
        button_position += 1

        if self.move_buttons:
            self.move_up_button = Gtk.ToolButton(None, None)
            self.move_up_button.set_icon_name("go-up-symbolic")
            self.move_up_button.set_tooltip_text(_("Move selected item up"))
            self.move_up_button.connect("clicked", self.move_item_up)
            self.move_up_button.set_sensitive(False)
            buttons_box.attach(self.move_up_button, button_position, 0, 1, 1)
            button_position += 1

            self.move_down_button = Gtk.ToolButton(None, None)
            self.move_down_button.set_icon_name("go-down-symbolic")
            self.move_down_button.set_tooltip_text(_("Move selected item down"))
            self.move_down_button.connect("clicked", self.move_item_down)
            self.move_down_button.set_sensitive(False)
            buttons_box.attach(self.move_down_button, button_position, 0, 1, 1)
            button_position += 1

        if self.imp_exp_path_key:
            self.export_button = Gtk.ToolButton(None, None)

            if Gtk.IconTheme.get_default().has_icon("document-export-symbolic"):
                self.export_button.set_icon_name("document-export-symbolic")
            else:
                self.export_button.set_icon_name("custom-export-data-symbolic")

            self.export_button.set_tooltip_text(_("Export data"))
            self.export_button.connect("clicked", self.export_data)
            self.export_button.set_sensitive(False)
            buttons_box.attach(self.export_button, button_position, 0, 1, 1)
            button_position += 1

            import_button = Gtk.ToolButton(None, None)

            if Gtk.IconTheme.get_default().has_icon("document-import-symbolic"):
                import_button.set_icon_name("document-import-symbolic")
            else:
                import_button.set_icon_name("custom-import-data-symbolic")

            import_button.set_tooltip_text(_("Import data"))
            import_button.connect("clicked", self.import_data)
            buttons_box.attach(import_button, button_position, 0, 1, 1)
            button_position += 1

        if self.apply_key:
            apply_button = Gtk.ToolButton(None, None)
            apply_button.set_icon_name("document-save-symbolic")
            apply_button.set_tooltip_text(_("Apply changes"))
            apply_button.connect("clicked", self.apply_changes)
            buttons_box.attach(apply_button, button_position, 0, 1, 1)

        self.content_widget.get_selection().connect("changed", self.update_button_sensitivity)
        self.content_widget.set_activate_on_single_click(False)
        self.content_widget.connect("row-activated", self.on_row_activated)
        self.update_button_sensitivity()

    def get_keybinding_display_name(self, accel_string):
        text = ""

        if accel_string:
            key, codes, mods = Gtk.accelerator_parse_with_keycode(accel_string)
            if codes is not None and len(codes) > 0:
                text = Gtk.accelerator_get_label_with_keycode(None, key, codes[0], mods)

        return text

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
        if self.immutable is not None:
            return False

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

        if self.remove_button is not None:
            if selected is None:
                self.remove_button.set_sensitive(False)
            else:
                self.remove_button.set_sensitive(True)

        if selected is None:
            self.edit_button.set_sensitive(False)
        else:
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

        if self.export_button is not None:
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

            esc = escape(
                _("Are you sure that you want to remove this item?"))
            esc += "\n\n<b>%s</b>: %s" % (escape(_("Note")),
                                          escape(_("Press and hold Control key to remove items without confirmation.")))
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
        filepath = import_export(
            self, "export",
            self.settings.get_value(self.imp_exp_path_key) if self.imp_exp_path_key else None
        )

        if filepath:
            if os.path.exists(filepath):
                os.remove(filepath)

            raw_data = json.dumps(self.settings.get_value(self.pref_key), indent=4)

            with open(filepath, "w+", encoding="UTF-8") as data_file:
                data_file.write(raw_data)

            if self.imp_exp_path_key:
                self.settings.set_value(self.imp_exp_path_key,
                                        os.path.dirname(filepath))

    def import_data(self, *args):
        filepath = import_export(
            self,
            "import",
            self.settings.get_value(self.imp_exp_path_key) if self.imp_exp_path_key else
            None
        )

        if self.imp_exp_path_key and filepath:
            self.settings.set_value(self.imp_exp_path_key,
                                    os.path.dirname(filepath))

        if filepath:
            dialog = Gtk.Dialog(
                transient_for=self.get_toplevel(),
                title=_("Choose how to add the imported data"),
                flags=Gtk.DialogFlags.MODAL,
                buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                         _("_Overwrite"), Gtk.ResponseType.OK,
                         _("_Append"), Gtk.ResponseType.YES)
            )

            buttons_box = dialog.get_action_area()
            buttons_box.set_property("halign", Gtk.Align.CENTER)

            # Make OK button the default.
            # https://stackoverflow.com/q/23983975
            cancel_button = dialog.get_widget_for_response(response_id=Gtk.ResponseType.CANCEL)
            cancel_button.set_can_default(True)
            cancel_button.grab_default()

            content_area = dialog.get_content_area()
            content_area.set_border_width(10)
            content_area.set_margin_left(10)
            content_area.set_margin_right(10)
            label = Gtk.Label(xalign=0)
            label.set_markup("<b>%s</b>: %s\n<b>%s</b>: %s" % (
                escape(_("Overwrite")),
                escape(_("replace the current data with the imported data.")),
                escape(_("Append")),
                escape(_("add the imported data to the current data.")),
            ))
            content_area.add(label)

            content_area.show_all()
            response = dialog.run()

            if response == Gtk.ResponseType.OK:
                override_existent_data = True
            elif response == Gtk.ResponseType.YES:
                override_existent_data = False
            else:
                dialog.destroy()
                return

            dialog.destroy()

            with open(filepath, "r", encoding="UTF-8") as data_file:
                raw_data = data_file.read()

            try:
                imported_data = json.loads(raw_data, encoding="UTF-8")
            except Exception:
                raise Exception("Failed to parse settings JSON data for file %s" % filepath)

            existent_data = self.settings.get_value(self.pref_key)

            if isinstance(existent_data, list) and isinstance(imported_data, list):
                if override_existent_data:
                    self.settings.set_value(self.pref_key, imported_data)
                else:
                    self.settings.set_value(self.pref_key, existent_data + imported_data)

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

        if self.apply_and_quit and self.app_window is not None and \
                isinstance(self.app_window, Gtk.ApplicationWindow):
            self.app_window.emit("destroy")

    def open_add_edit_dialog(self, info=None):
        if info is None:
            title = _("Add new entry")
        else:
            title = _("Edit entry")

        dialog = Gtk.Dialog(transient_for=self.get_toplevel(),
                            use_header_bar=True,
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

        dialog.set_size_request(width=self.dialog_width, height=-1)
        content_area = dialog.get_content_area()
        content_area.set_border_width(5)

        frame = Gtk.Frame()
        frame.set_shadow_type(Gtk.ShadowType.IN)
        frame.get_style_context().add_class(Gtk.STYLE_CLASS_VIEW)
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

            widget = list_edit_factory(self.columns[i], self.settings)
            widget.set_border_width(5)

            if isinstance(self.immutable, dict):
                widget.set_sensitive(self.columns[i]["id"]
                                     not in self.immutable.get("read_only_keys", []))

            if isinstance(widget, (Switch, ColorChooser)):
                settings_box.connect("row-activated", widget.clicked)

            widgets.append(widget)
            content.attach(settings_box, 0, i, 1, 1)
            settings_box.add(widget)

            if info is not None and info[i] is not None:
                widget.set_widget_value(info[i])
            elif "default" in self.columns[i]:
                widget.set_widget_value(self.columns[i]["default"])

            last_widget_pos += 1

        if self.dialog_info_labels:
            for label in self.dialog_info_labels:
                content.add(Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL))

                info_label = Text(label, use_markup=True)
                info_label.set_border_width(5)
                info_label_container = Gtk.ListBox()
                info_label_container.set_selection_mode(Gtk.SelectionMode.NONE)
                content.attach(info_label_container, 0, last_widget_pos, 1, 1)
                info_label_container.add(info_label)

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


if __name__ == "__main__":
    pass
