#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tree list widget.

Attributes
----------
LIST_CLASS_TYPE_MAP : dict
    Widget JSON name to class name map.
LIST_PROPERTIES_MAP : dict
    JSON attribute to Python keywords argument map used by the settings widgets.
LIST_VARIABLE_TYPE_MAP : dict
    Widget JSON name to value type map.
"""
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

from . import exceptions
from .AppChooserWidgets import AppChooser
from .SettingsWidgets import ColorChooser
from .SettingsWidgets import ComboBox
from .SettingsWidgets import Entry
from .SettingsWidgets import FileChooser
from .SettingsWidgets import IconChooser
from .SettingsWidgets import Keybinding
from .SettingsWidgets import KeybindingWithOptions
from .SettingsWidgets import SettingsWidget
from .SettingsWidgets import SoundFileChooser
from .SettingsWidgets import SpinButton
from .SettingsWidgets import Switch
from .SettingsWidgets import Text
from .SettingsWidgets import TextView
from .common import BaseGrid
from .common import IntelligentGtkDialog
from .common import _
from .common import contrast_rgba_color
from .common import display_message_dialog
from .common import get_global
from .common import get_keybinding_display_name
from .common import get_toplevel_window
from .common import handle_combobox_options
from .common import import_export

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
    "sound": SoundFileChooser,
    "string": Entry,
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
    "pattern-filters": "pattern_filters",
    "mimetype-filters": "mimetype_filters",
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
    # soundfilechooser: If True, only wav and ogg sound files will be filtered in
    # the file chooser dialog. If set to False, all sound files will be displayed.
    "event-sounds": "event_sounds",
}


def list_edit_factory(col_def, xlet_settings):
    """Edit dialog widgets factory.

    Parameters
    ----------
    col_def : dict
        Column definition.
    xlet_settings : JSONSettingsHandler
        A ``JSONSettingsHandler``.

    Returns
    -------
    object
        New widget.
    """
    kwargs = {}

    if "options" in col_def:
        kwargs["valtype"] = LIST_VARIABLE_TYPE_MAP[col_def["type"]]

        if col_def["type"] == "keybinding-with-options":
            widget_type = KeybindingWithOptions
        else:
            widget_type = ComboBox

        kwargs["options"] = handle_combobox_options(
            options=col_def["options"],
            first_option=col_def.get("first-option", ""),
            xlet_settings=xlet_settings
        )
    else:
        widget_type = LIST_CLASS_TYPE_MAP[col_def["type"]]

    class Widget(widget_type):
        """New list widget.

        Attributes
        ----------
        widget_value : int, str, float
            The list widget value.
        """

        def __init__(self, **ka):
            """Initialization.

            Parameters
            ----------
            **ka
                Keyword argumets.
            """
            super().__init__(**ka)

            if self.bind_dir is None:
                self.connect_widget_handlers()

        def get_range(self):
            """Get range.

            Returns
            -------
            None
                None.
            """
            return None

        def set_value(self, value):
            """Set value.

            Parameters
            ----------
            value : int, str, float
                The widget value.
            """
            self.widget_value = value

        def get_value(self):
            """Get value.

            Returns
            -------
            int, str, float
                The widget value.
            """
            if hasattr(self, "widget_value"):
                return self.widget_value
            else:
                return None

        def set_widget_value(self, value):
            """Set widget value.

            Parameters
            ----------
            value : int, str, float
                The widget value.
            """
            if self.bind_dir is None:
                self.widget_value = value
                self.on_setting_changed()
            else:
                if hasattr(self, "bind_object"):
                    self.bind_object.set_property(self.bind_prop, value)
                else:
                    self.content_widget.set_property(self.bind_prop, value)

        def get_widget_value(self):
            """Get widget value.

            Returns
            -------
            int, str, float
                The widget value.
            """
            if self.bind_dir is None:
                try:
                    return self.widget_value
                except Exception:
                    return None
            else:
                if hasattr(self, "bind_object"):
                    return self.bind_object.get_property(self.bind_prop)
                return self.content_widget.get_property(self.bind_prop)

    for prop in col_def:
        if prop in LIST_PROPERTIES_MAP:
            kwargs[LIST_PROPERTIES_MAP[prop]] = col_def[prop]

    return Widget(**kwargs)


class TreeList(SettingsWidget):
    """Tree list widget.

    Attributes
    ----------
    apply_key : str
        The preference key bound to the Apply changes button on a :any:`TreeList` widget.
    bind_dir : Gio.SettingsBindFlags, None
        ``Gio.SettingsBindFlags`` flags.
    content_widget : Gtk.TreeView
        The main widget that will be used to represent a setting value.
    dialog_height : int
        Height of the dialog tied to the widget.
    dialog_width : int
        Width of the dialog tied to the widget.
    imp_exp_path_key : str
        The preference key where the last selected path used on the import/export file chooser dialog.
    model : Gtk.ListStore
        The model used as storage by this widget.
    """

    bind_dir = None

    def __init__(self, columns=None, immutable=False, dialog_info_labels=None, height=200,
                 move_buttons=True, multi_select=False, dialog_width=450, apply_and_quit=False):
        """Initialization.

        Parameters
        ----------
        columns : None, optional
            The columns definitions used to build ``self.content_widget``.
        immutable : dict, bool, optional
            Whether items in the list can be removed or new ones can be added. If a
            :py:class:`dict`, two options are available. The ``read-only-keys`` key will
            allow to specify a list of column IDs whose created widgets should be set as
            insensitive to not allow edition. The ``allow-edition`` key can be set to True or False.
            If set to True, all columns in the list will be editable, except those whose IDs are
            specified in the ``read-only-keys`` key. If set to False, none of the widgets on the
            list will be editable.
        dialog_info_labels : list, None, optional
            A list of strings. It allows to display informative labels on the edit/add dialog.
            This allows to keep the window clean and at the same time keep basic information at hand.
        height : int, optional
            A fixed height for the tree.
        move_buttons : bool, optional
            Whether to display the move items up/down buttons.
        multi_select : bool, optional
            It allows to select multiple rows inside the widget.
            Mostly useful for mass deletions of items.
        dialog_width : int, optional
            A minimum width for the add/edit dialog,
        apply_and_quit : bool, optional
            It allows to exit the settings window when the apply button on the widget is clicked.

        Todo
        ----
        Find a way to make the tree expand to the available space inside its page.
        """
        super().__init__()
        self.set_spacing(0, 0)
        self.set_hexpand(True)
        self.set_vexpand(True)

        self.dialog_width = dialog_width
        self.dialog_height = -1
        self._columns = columns
        self._immutable = bool(immutable)
        self._immutable_options = immutable if isinstance(immutable, dict) else {}
        self._read_only_keys = self._immutable_options.get("read-only-keys", [])
        self._dialog_info_labels = dialog_info_labels
        self._move_buttons = move_buttons
        self._multi_select = multi_select
        self._apply_and_quit = apply_and_quit
        self._timer = None
        self._tooltips_storage = {}

        self._allow_edition = not self._immutable or \
            self._immutable_options.get("allow-edition", True)

        self._add_button = None
        self._remove_button = None
        self._edit_button = None
        self._move_up_button = None
        self._move_down_button = None
        self._export_button = None
        self.apply_key = f'{self.pref_key}_apply'
        self.imp_exp_path_key = f'{self.pref_key}_imp_exp_path'

        if self.apply_key not in self.settings.settings:
            self.apply_key = None

        if self.imp_exp_path_key not in self.settings.settings:
            self.imp_exp_path_key = None

        # NOTE: If an imp_exp_path_key doesn't exists for a specific instance of this widget,
        # attempt to locate a global one.
        if not self.imp_exp_path_key and "imp_exp_last_selected_directory" in self.settings.settings:
            self.imp_exp_path_key = None

        self.content_widget = Gtk.TreeView()
        self.content_widget.set_grid_lines(Gtk.TreeViewGridLines.BOTH)

        if self._multi_select:
            self.content_widget.get_selection().set_mode(Gtk.SelectionMode.MULTIPLE)

        # Mark for deletion on EOL. Gtk4
        # Use Gtk.EventControllerKey instead of key-press-event.
        self.content_widget.connect("key-press-event", self._on_key_press_cb)

        scrollbox = Gtk.ScrolledWindow()
        scrollbox.set_size_request(-1, height)
        scrollbox.set_hexpand(True)
        scrollbox.set_vexpand(True)
        scrollbox.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC)
        self.attach(scrollbox, 0, 0, 1, 1)
        scrollbox.add(self.content_widget)

        types = []

        for i, column_def in enumerate(columns):
            types.append(LIST_VARIABLE_TYPE_MAP[column_def["type"]])

            if column_def.get("tooltip"):
                self._tooltips_storage[column_def["title"]] = column_def["tooltip"]

            has_option_map = "options" in column_def
            # has_option_map = "options" in column_def and isinstance(column_def["options"], dict)
            render_type = "string" if has_option_map else column_def["type"]

            # NOTE: About read-only-keys option in an immutable list widget.
            # I'm preventing the renderers of type boolean, integer and float from being "in-line editable"
            # when the column it belongs to is set to be read only.
            if render_type == "boolean":
                renderer = Gtk.CellRendererToggle()

                def toggle_checkbox(widget, path, col):
                    """Toggle checkbox.

                    Parameters
                    ----------
                    widget : Gtk.CellRendererToggle
                        The toggle widget.
                    path : str
                        String representation of :py:class:`Gtk.TreePath` describing the event location.
                    col : int
                        Column index.
                    """
                    self.model[path][col] = not self.model[path][col]
                    self._list_changed()

                if column_def["id"] not in self._read_only_keys:
                    renderer.connect("toggled", toggle_checkbox, i)

                prop_name = "active"
            elif render_type == "integer" or render_type == "float":
                renderer = Gtk.CellRendererSpin()
                renderer.set_property("editable", column_def["id"] not in self._read_only_keys)
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
                    """Edit spin button.

                    Parameters
                    ----------
                    widget : Gtk.CellRendererSpin
                        The spin widget.
                    path : str
                        String representation of :py:class:`Gtk.TreePath` describing the event location.
                    value : int, float
                        The widget value.
                    data : dict
                        Data holding row information.
                    """
                    val = str(value)
                    num_parser = int

                    # NOTE: Stupid internationalization!
                    # float(value) will fail when value is a comma-separated float. ¬¬
                    # int(value) will fail when value is a comma/dot separated integer. ¬¬
                    # It might not be needed to use replace() for integers, but it doesn't hurt
                    # to have it. So, leave it.
                    if data["num_parser"] == "float":
                        val = val.replace(",", ".")
                        num_parser = float
                    else:
                        val = val.replace(",", "").replace(".", "")

                    self.model[path][data["col_index"]] = num_parser(val)
                    self._list_changed()

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
                    """Function to set color.

                    Parameters
                    ----------
                    col : Gtk.CellLayout
                        A ``Gtk.CellLayout``.
                    rend : Gtk.CellRenderer
                        The cell renderer whose value is to be set.
                    model : Gtk.TreeModel
                        The model.
                    row_iter : Gtk.TreeIter
                        A ``Gtk.TreeIter`` indicating the row to set the value for.
                    data : dict
                        User data passed to ``Gtk.CellLayout.set_cell_data_func()``.
                    """
                    value = model[row_iter][data["col_index"]]

                    if value is not None:
                        bg_rgba = Gdk.RGBA()
                        bg_rgba.parse(value)
                        fg_rgba = contrast_rgba_color(bg_rgba)
                        rend.set_property("background-rgba", bg_rgba)
                        rend.set_property("foreground-rgba", fg_rgba)
                    else:
                        # NOTE: I was having "residual colors" set in new list items.
                        # When I added a new list item with a color set and then added another
                        # new item but with the color not set, the newly added item's cell would
                        # have the same color than the previously added item's cell.
                        # Setting the following two properties fixed that.
                        rend.set_property("background-set", False)
                        rend.set_property("foreground-set", False)

                column.set_cell_data_func(renderer, set_color_func, {
                    "col_index": i
                })
            elif column_def["type"] == "app":
                def set_app_func(col, rend, model, row_iter, data):
                    """Function to set application.

                    Parameters
                    ----------
                    col : Gtk.CellLayout
                        A ``Gtk.CellLayout``.
                    rend : Gtk.CellRenderer
                        The cell renderer whose value is to be set.
                    model : Gtk.TreeModel
                        The model.
                    row_iter : Gtk.TreeIter
                        A ``Gtk.TreeIter`` indicating the row to set the value for.
                    data : dict
                        User data passed to ``Gtk.CellLayout.set_cell_data_func()``.
                    """
                    value = model[row_iter][data["col_index"]]

                    try:
                        app_info = Gio.DesktopAppInfo.new(value)
                    except Exception:
                        app_info = None

                    if isinstance(app_info, Gio.DesktopAppInfo):
                        rend.set_property("text", app_info.get_display_name())
                    else:
                        rend.set_property("text", _("Invalid app") if value else _("No app chosen"))

                column.set_cell_data_func(renderer, set_app_func, {
                    "col_index": i
                })

            if has_option_map:
                def map_func(col, rend, model, row_iter, data):
                    """Map function.

                    Parameters
                    ----------
                    col : Gtk.CellLayout
                        A ``Gtk.CellLayout``.
                    rend : Gtk.CellRenderer
                        The cell renderer whose value is to be set.
                    model : Gtk.TreeModel
                        The model.
                    row_iter : Gtk.TreeIter
                        A ``Gtk.TreeIter`` indicating the row to set the value for.
                    data : dict
                        User data passed to ``Gtk.CellLayout.set_cell_data_func()``.
                    """
                    value = model[row_iter][data["col_index"]]
                    options_tuples = handle_combobox_options(
                        options=data["column_def"]["options"],
                        first_option=data["column_def"].get("first-option", ""),
                        xlet_settings=data["xlet_settings"]
                    )

                    for val, key in options_tuples:
                        if data["column_def"]["type"] == "keybinding-with-options":
                            try:
                                kb, opt = value.split("::")
                            except Exception:
                                kb, opt = "", ""

                            # NOTE: Reduce list "noise".
                            # Do not set text to the cell if there is no keybinding.
                            if kb and val == opt:
                                rend.set_property(
                                    "text",
                                    f"{get_keybinding_display_name(kb)}::{key}"
                                )
                                break
                            else:
                                rend.set_property("text", "")
                        else:
                            if val == value:
                                # NOTE: If the options definition is a dictionary, localize the
                                # display value.
                                loc_key = _(key) if isinstance(
                                    data["column_def"]["options"], dict) else key
                                rend.set_property("text", loc_key)
                                break
                            else:
                                rend.set_property("text", "")

                column.set_cell_data_func(renderer, map_func, {
                    "column_def": column_def,
                    "xlet_settings": self.settings,
                    "col_index": i
                })
            else:
                if column_def["type"] == "keybinding":
                    def kb_map_func(col, rend, model, row_iter, data):
                        """Map function.

                        Parameters
                        ----------
                        col : Gtk.CellLayout
                            A ``Gtk.CellLayout``.
                        rend : Gtk.CellRenderer
                            The cell renderer whose value is to be set.
                        model : Gtk.TreeModel
                            The model.
                        row_iter : Gtk.TreeIter
                            A ``Gtk.TreeIter`` indicating the row to set the value for.
                        data : dict
                            User data passed to ``Gtk.CellLayout.set_cell_data_func()``.
                        """
                        value = model[row_iter][data["col_index"]]

                        if value:
                            kbs = map(lambda e: get_keybinding_display_name(
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

            column.set_resizable(column_def.get("col-resize", True))
            self.content_widget.append_column(column)

        if len(self._tooltips_storage) > 0:
            self.content_widget.props.has_tooltip = True
            self.content_widget.connect("query-tooltip", self.query_tooltip_cb)

        self.model = Gtk.ListStore(*types)
        self.content_widget.set_model(self.model)

        buttons_box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        buttons_box.set_halign(Gtk.Align.CENTER)
        buttons_box.set_hexpand(True)

        # NOTE: This is used as button position inside a Gtk.Grid and also as buttons count.
        button_position = 0

        if not self._immutable:
            self._add_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
                "list-add-symbolic",
                Gtk.IconSize.LARGE_TOOLBAR
            ))
            self._add_button.set_tooltip_text(_("Add new item"))
            self._add_button.connect("clicked", self._add_item)

            buttons_box.attach(self._add_button, button_position, 0, 1, 1)
            button_position += 1

            self._remove_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
                "list-remove-symbolic",
                Gtk.IconSize.LARGE_TOOLBAR
            ))
            self._remove_button.set_tooltip_text(_("Remove selected item"))
            # NOTE: Using button-release-event to be able to catch events.
            # clicked event doesn't pass the event. ¬¬
            # Mark for deletion on EOL. Gtk4
            # Use Gtk.GestureClick instead of button-release-event.
            self._remove_button.connect("button-release-event", self._on_remove_item_cb)
            self._remove_button.set_sensitive(False)

            buttons_box.attach(self._remove_button, button_position, 0, 1, 1)
            button_position += 1

        if self._allow_edition:
            self._edit_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
                "view-list-symbolic",
                Gtk.IconSize.LARGE_TOOLBAR
            ))
            self._edit_button.set_tooltip_text(_("Edit selected item"))
            self._edit_button.connect("clicked", self._edit_item)
            self._edit_button.set_sensitive(False)

            buttons_box.attach(self._edit_button, button_position, 0, 1, 1)
            button_position += 1

        if self._move_buttons:
            self._move_up_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
                "go-up-symbolic",
                Gtk.IconSize.LARGE_TOOLBAR
            ))
            self._move_up_button.set_tooltip_text(_("Move selected item up"))
            self._move_up_button.connect("clicked", self._move_item_up)
            self._move_up_button.set_sensitive(False)
            buttons_box.attach(self._move_up_button, button_position, 0, 1, 1)
            button_position += 1

            self._move_down_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
                "go-down-symbolic",
                Gtk.IconSize.LARGE_TOOLBAR
            ))
            self._move_down_button.set_tooltip_text(_("Move selected item down"))
            self._move_down_button.connect("clicked", self._move_item_down)
            self._move_down_button.set_sensitive(False)
            buttons_box.attach(self._move_down_button, button_position, 0, 1, 1)
            button_position += 1

        if self.imp_exp_path_key:
            self._export_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
                "document-export-symbolic"
                if Gtk.IconTheme.get_default().has_icon("document-export-symbolic") else
                "xlets-settings-export-data-symbolic",
                Gtk.IconSize.LARGE_TOOLBAR
            ))

            self._export_button.set_tooltip_text(_("Export data"))
            self._export_button.connect("clicked", self._export_data)
            self._export_button.set_sensitive(False)
            buttons_box.attach(self._export_button, button_position, 0, 1, 1)
            button_position += 1

            import_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
                "document-import-symbolic"
                if Gtk.IconTheme.get_default().has_icon("document-import-symbolic") else
                "xlets-settings-import-data-symbolic",
                Gtk.IconSize.LARGE_TOOLBAR
            ))

            import_button.set_tooltip_text(_("Import data"))
            import_button.connect("clicked", self._import_data)
            buttons_box.attach(import_button, button_position, 0, 1, 1)
            button_position += 1

        if self.apply_key:
            apply_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
                "document-save-symbolic",
                Gtk.IconSize.LARGE_TOOLBAR
            ))
            apply_button.set_tooltip_text(_("Apply changes"))
            apply_button.connect("clicked", self._apply_changes)
            buttons_box.attach(apply_button, button_position, 0, 1, 1)

        # NOTE: If no buttons were added to buttons_box, destroy it.
        if button_position > 0:
            toolbar = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
            toolbar.set_halign(Gtk.Align.FILL)
            toolbar.set_hexpand(True)
            # Mark for deletion on EOL. Gtk4
            # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
            toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR)
            toolbar.attach(buttons_box, 0, 1, 1, 1)
            self.attach(toolbar, 0, 1, 1, 1)
        else:
            buttons_box.destroy()

        self.content_widget.get_selection().connect("changed", self._update_button_sensitivity)
        self.content_widget.set_activate_on_single_click(False)
        self.content_widget.connect("row-activated", self._on_row_activated)
        self._update_button_sensitivity()

    def query_tooltip_cb(self, widget, x, y, keyboard_tip, tooltip):
        """Query tooltip callback function.

        Parameters
        ----------
        widget : Gtk.TreeView
            The object which received the signal.
        x : int
            The x coordinate of the cursor position where the request has been emitted,
            relative to widget’s left side.
        y : int
            The y coordinate of the cursor position where the request has been emitted,
            relative to widget’s top.
        keyboard_tip : bool
            True if the tooltip was triggered using the keyboard
        tooltip : Gtk.Tooltip
            A ``Gtk.Tooltip``.

        Returns
        -------
        bool
            True if tooltip should be shown right now, False otherwise.
        """
        ctx = widget.get_tooltip_context(x, y, keyboard_tip)

        if not ctx:
            return False

        try:
            path, col, cell_x, cell_y = widget.get_path_at_pos(x, y)
            col_title = col.get_title()
        except Exception:
            return False
        else:
            if self._tooltips_storage.get(col_title):
                tooltip.set_text(self._tooltips_storage.get(col_title))
                widget.set_tooltip_cell(tooltip, ctx.path, col, None)
                return True

            return False

    def _on_key_press_cb(self, widget, event):
        """On keyboard press event.

        Parameters
        ----------
        widget : Gtk.TreeView
            The object which received the signal.
        event : Gdk.EventKey
            The ``Gdk.EventKey`` which triggered this signal.

        Returns
        -------
        bool
            True to stop other handlers from being invoked for the event.
            False to propagate the event further.
        """
        state = event.get_state() & Gdk.ModifierType.CONTROL_MASK
        ctrl = state == Gdk.ModifierType.CONTROL_MASK
        symbol, keyval = event.get_keyval()

        if not self._immutable and symbol and keyval == Gdk.KEY_Delete:
            self._on_remove_item_cb(None, event)
            return True
        elif not self._immutable and ctrl and symbol and (keyval == Gdk.KEY_N or keyval == Gdk.KEY_n):
            self._add_item()
            return True
        elif self._move_buttons and ctrl and symbol and keyval == Gdk.KEY_Up:
            self._move_item_up()
            return True
        elif self._move_buttons and ctrl and symbol and keyval == Gdk.KEY_Down:
            self._move_item_down()
            return True
        elif self._move_buttons and ctrl and symbol and keyval == Gdk.KEY_Page_Up:
            self._move_item_to_first_position()
            return True
        elif self._move_buttons and ctrl and symbol and keyval == Gdk.KEY_Page_Down:
            self._move_item_to_last_position()
            return True

        return False

    def _update_button_sensitivity(self, *args):
        """Update button sensitivity.

        Parameters
        ----------
        *args
            Arguments.
        """
        paths = []
        selected = None

        if self._multi_select:
            model, paths = self.content_widget.get_selection().get_selected_rows()
            selected = None if len(paths) == 0 else model.get_iter(paths[0])
        else:
            model, selected = self.content_widget.get_selection().get_selected()

        if self._remove_button is not None:
            if selected is None:
                self._remove_button.set_sensitive(False)
            else:
                self._remove_button.set_sensitive(True)

        if self._edit_button:
            if selected is None or len(paths) > 1:
                self._edit_button.set_sensitive(False)
            else:
                self._edit_button.set_sensitive(True)

        if self._move_buttons:
            if selected is None or (self._multi_select and len(paths) > 1) or \
                    model.iter_previous(selected) is None:
                self._move_up_button.set_sensitive(False)
            else:
                self._move_up_button.set_sensitive(True)

            if selected is None or (self._multi_select and len(paths) > 1) or \
                    model.iter_next(selected) is None:
                self._move_down_button.set_sensitive(False)
            else:
                self._move_down_button.set_sensitive(True)

        if self._export_button is not None:
            if len(self.settings.get_value(self.pref_key)) == 0:
                self._export_button.set_sensitive(False)
            else:
                self._export_button.set_sensitive(True)

    def _on_row_activated(self, *args):
        """On row activated.

        Parameters
        ----------
        *args
            Arguments.
        """
        if self._allow_edition:
            self._edit_item()

    def _add_item(self, *args):
        """Add a new item.

        Parameters
        ----------
        *args
            Arguments.
        """
        data = self._open_add_edit_dialog()

        if data is not None:
            self.model.append(data)
            self._list_changed()

    def _on_remove_item_cb(self, widget, event):
        """On item removed callback function.

        Parameters
        ----------
        widget : Gtk.Button
            The object which received the signal.
        event : Gdk.EventButton
            The ``Gdk.EventButton`` which triggered this signal.

        Returns
        -------
        bool
            True to stop other handlers from being invoked for the event.
            False to propagate the event further.
        """
        state = event.get_state() & Gdk.ModifierType.CONTROL_MASK
        confirm_removal = state != Gdk.ModifierType.CONTROL_MASK

        if confirm_removal:
            dialog = Gtk.MessageDialog(transient_for=get_toplevel_window(self),
                                       flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
                                       message_type=Gtk.MessageType.WARNING,
                                       buttons=Gtk.ButtonsType.YES_NO)

            dialog.set_title(_("Item removal"))

            esc = escape(
                _("Are you sure that you want to remove the selected items?"))
            esc += "\n\n<b>%s</b>: %s" % (escape(_("Note")),
                                          escape(_("Press and hold Control key to remove items without confirmation.")))
            dialog.set_markup(esc)
            dialog.show_all()
            response = dialog.run()
            dialog.destroy()

            if response == Gtk.ResponseType.YES:
                self._remove_item()

            return None
        else:
            self._remove_item()

    def _remove_item(self):
        """Remove item.
        """
        if self._multi_select:
            model, paths = self.content_widget.get_selection().get_selected_rows()

            for path in reversed(paths):
                t_iter = model.get_iter(path)
                model.remove(t_iter)
                self._list_changed()
        else:
            model, t_iter = self.content_widget.get_selection().get_selected()
            path = model.get_path(t_iter)
            model.remove(t_iter)
            self._list_changed()

    def _edit_item(self, *args):
        """Edit existent item.

        Parameters
        ----------
        *args
            Arguments.
        """
        if self._multi_select:
            model, paths = self.content_widget.get_selection().get_selected_rows()

            if paths:
                path = paths[0]
                t_iter = model.get_iter(path)
                data = self._open_add_edit_dialog(model[t_iter])

                if data is not None:
                    for i in range(len(data)):
                        self.model[t_iter][i] = data[i]

                    self._list_changed()
        else:
            model, t_iter = self.content_widget.get_selection().get_selected()
            data = self._open_add_edit_dialog(model[t_iter])

            if data is not None:
                for i in range(len(data)):
                    self.model[t_iter][i] = data[i]

                self._list_changed()

    def _move_item_up(self, *args):
        """Move item up.

        Parameters
        ----------
        *args
            Arguments.
        """
        if self._multi_select:
            model, paths = self.content_widget.get_selection().get_selected_rows()

            if paths and len(paths) == 1:
                t_iter = model.get_iter(paths[0])
                model.swap(t_iter, model.iter_previous(t_iter))
                self._list_changed()
        else:
            model, t_iter = self.content_widget.get_selection().get_selected()
            model.swap(t_iter, model.iter_previous(t_iter))
            self._list_changed()

    def _move_item_to_first_position(self, *args):
        """Move item to first position.

        Parameters
        ----------
        *args
            Arguments.
        """
        if self._multi_select:
            model, paths = self.content_widget.get_selection().get_selected_rows()

            if paths and len(paths) == 1:
                model.move_after(model.get_iter(paths[0]), None)
                self._list_changed()
        else:
            model, t_iter = self.content_widget.get_selection().get_selected()
            model.move_after(t_iter, None)
            self._list_changed()

    def _move_item_down(self, *args):
        """Move item down.

        Parameters
        ----------
        *args
            Arguments.
        """
        if self._multi_select:
            model, paths = self.content_widget.get_selection().get_selected_rows()

            if paths and len(paths) == 1:
                t_iter = model.get_iter(paths[0])
                model.swap(t_iter, model.iter_next(t_iter))
                self._list_changed()
        else:
            model, t_iter = self.content_widget.get_selection().get_selected()
            model.swap(t_iter, model.iter_next(t_iter))
            self._list_changed()

    def _move_item_to_last_position(self, *args):
        """Move item to last position.

        Parameters
        ----------
        *args
            Arguments.
        """
        if self._multi_select:
            model, paths = self.content_widget.get_selection().get_selected_rows()

            if paths and len(paths) == 1:
                model.move_before(model.get_iter(paths[0]), None)
                self._list_changed()
        else:
            model, t_iter = self.content_widget.get_selection().get_selected()
            model.move_before(t_iter, None)
            self._list_changed()

    def _export_data(self, *args):
        """Export data.

        Parameters
        ----------
        *args
            Arguments.
        """
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

    def _import_data(self, *args):
        """Import data.

        Parameters
        ----------
        *args
            Arguments.

        Returns
        -------
        None
            Halt execution.

        Raises
        ------
        exceptions.MalformedJSONFile
            The exported file is malformed.
        exceptions.WrongType
            The file contains wrong data type.
        """
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
                transient_for=get_toplevel_window(self),
                title=_("Import data"),
                flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
                use_header_bar=get_global("USE_HEADER_BARS_ON_DIALOGS"),
                buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                         _("_Overwrite"), Gtk.ResponseType.OK,
                         _("_Append"), Gtk.ResponseType.YES)
            )

            dialog.set_default_response(Gtk.ResponseType.CANCEL)
            # NOTE: Enforcing a minimum width to avoid the title of the dialog to ellipsize. ¬¬
            # I WILL NOT build from scratch an entire titlebar just to make its title behave
            # as it f*cking should!!!
            dialog.set_default_size(500, -1)

            # Make Cancel button the default.
            # https://stackoverflow.com/q/23983975
            cancel_button = dialog.get_widget_for_response(response_id=Gtk.ResponseType.CANCEL)
            cancel_button.set_can_default(True)
            cancel_button.grab_default()

            content_area = dialog.get_content_area()
            content_area.set_border_width(10)
            content_area.set_margin_start(10)
            content_area.set_margin_end(10)
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
                imported_data = json.loads(raw_data)
            except Exception:
                raise exceptions.MalformedJSONFile(filepath)

            existent_data = self.settings.get_value(self.pref_key)

            if isinstance(existent_data, list) and isinstance(imported_data, list):
                if override_existent_data:
                    self.settings.set_value(self.pref_key, imported_data)
                else:
                    self.settings.set_value(self.pref_key, existent_data + imported_data)

                self.on_setting_changed()
            else:
                msg = _("Wrong data type found on file '{%s}'")

                display_message_dialog(self,
                                       _("Error importing data"),
                                       msg % filepath,
                                       context="error")
                print(msg % filepath)
                raise exceptions.WrongType("list", type(imported_data).__name__)

    def _apply_changes(self, *args):
        """Apply changes.

        Parameters
        ----------
        *args
            Arguments.

        Note
        ----
        This preference widget should not have a callback attached to it (equality comparison between
        objects and all that jazz). So this function is attached to another xlet preference that
        can be bound to a function that can re-apply the changes made to this widget value.
        """
        # NOTE: The setting controlled by this widget (TreeList) is saved in real time.
        # This _apply_changes function simply toggles a setting that can have a
        # callback attached (on the JavaScript side) so it can be triggered on demand
        # when the Apply changes button is pressed and not every time the data in the
        # widget is modified.
        # This is done so because sometimes one might not desire to attach a
        # callback to this widget.
        self.settings.set_value(self.apply_key,
                                not self.settings.get_value(self.apply_key))

        main_app = get_global("MAIN_APP")

        if main_app is not None:
            if self._apply_and_quit and main_app.window is not None and \
                    isinstance(main_app.window, Gtk.ApplicationWindow):
                main_app.window.emit("destroy")

    def _open_add_edit_dialog(self, tree_row=None):
        """Open add/edit dialog.

        Parameters
        ----------
        tree_row : None, optional
            A :py:class:`Gtk.TreeModelRow`.

        Returns
        -------
        list
            List of values to be saved as a new column definition.
        """
        if tree_row is None:
            title = _("Add new entry")
        else:
            title = _("Edit entry")

        dialog = IntelligentGtkDialog(
            self,
            transient_for=get_toplevel_window(self),
            use_header_bar=get_global("USE_HEADER_BARS_ON_DIALOGS"),
            title=title,
            flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
            buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                     _("_Save"), Gtk.ResponseType.OK)
        )

        # Make OK button the default.
        # https://stackoverflow.com/q/23983975
        ok_button = dialog.get_widget_for_response(response_id=Gtk.ResponseType.OK)
        ok_button.set_can_default(True)
        ok_button.grab_default()

        content_area = dialog.get_content_area()
        content_area.set_border_width(5)

        frame = Gtk.Frame()
        # Mark for deletion on EOL. Gtk4
        # Stop using set_shadow_type and set the boolean property has-frame.
        frame.set_shadow_type(Gtk.ShadowType.IN)
        # Mark for deletion on EOL. Gtk4
        # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
        frame.get_style_context().add_class(Gtk.STYLE_CLASS_VIEW)
        content_area.add(frame)

        content = BaseGrid()
        frame.add(content)

        widgets = []
        last_widget_pos = 0

        for i, col_def in enumerate(self._columns):
            if len(widgets) != 0:
                content.add(Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL))

            settings_box = Gtk.ListBox()
            settings_box.set_selection_mode(Gtk.SelectionMode.NONE)

            widget = list_edit_factory(col_def, self.settings)
            widget.set_border_width(5)

            widget.set_sensitive(col_def["id"] not in self._read_only_keys)

            if isinstance(widget, (Switch, ColorChooser)):
                settings_box.connect("row-activated", widget.clicked)

            # NOTE: I was forced to use this condition because it was impossible for
            # the content of the TextView to be edited. It was necessary to triple
            # click it to gain access to it or being focused with keyboard navigation.
            # With this callback set to the settings_box, the TextView content can directly
            # be accessed with a single click.
            if isinstance(widget, TextView):
                settings_box.connect("row-activated", widget.focus_the_retarded_text_view)

            widgets.append(widget)
            content.attach(settings_box, 0, i, 1, 1)
            settings_box.add(widget)

            if tree_row is not None and tree_row[i] is not None:
                widget.set_widget_value(tree_row[i])
            elif "default" in col_def:
                widget.set_widget_value(col_def["default"])

            last_widget_pos += 1

        if self._dialog_info_labels:
            for label in self._dialog_info_labels:
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

    def _list_changed(self):
        """List changed.
        """
        data = []
        for row in self.model:
            i = 0
            row_info = {}
            for column in self._columns:
                # NOTE: Prevent storing null as a value for a preference that expects a string.
                row_info[column["id"]] = "" if row[i] is None else row[i]
                i += 1
            data.append(row_info)

        self.set_value(data)
        self._update_button_sensitivity()

    def on_setting_changed(self, *args):
        """See :any:`JSONSettingsBackend.on_setting_changed`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.model.clear()
        rows = self.get_value()
        for row in rows:
            row_info = []

            for column in self._columns:
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
        """See :any:`JSONSettingsBackend.connect_widget_handlers`.

        Parameters
        ----------
        *args
            Arguments.
        """
        pass


if __name__ == "__main__":
    pass
