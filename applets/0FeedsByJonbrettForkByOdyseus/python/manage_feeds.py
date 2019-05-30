#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Feeds Manager GUI.

Attributes
----------
APPLICATION_ID : str
    ID used by a Gtk.Application instance.
APPLICATION_NAME : str
    Application name.
XLET_DIR : str
    Path to the xlet folder.
"""

import argparse
import gettext
import gi
import os
import sys

gi.require_version("Gtk", "3.0")

from gi.repository import GLib
from gi.repository import Gio
from gi.repository import Gtk
from html import escape

from config_file_manager import ConfigFileManager

gettext.bindtextdomain("{{UUID}}", os.path.expanduser("~") + "/.local/share/locale")
gettext.textdomain("{{UUID}}")
_ = gettext.gettext

APPLICATION_ID = "org.Cinnamon.Applets.FeedsReader.Application"
APPLICATION_NAME = _("Feeds Reader (Fork By Odyseus)")
# NOTE: Look at the nested calls to os.path.dirname.
# It's because this script is inside a sub-folder inside the actual xlet folder.
XLET_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def display_warning_message(widget, title, message):
    """Display warning message.

    Parameters
    ----------
    widget : object
        The widget attached to this callback.
    title : str
        Dialog title.
    message : str
        Dialog message.
    """
    dialog = Gtk.MessageDialog(transient_for=app.window,
                               title=title,
                               modal=True,
                               message_type=Gtk.MessageType.WARNING,
                               buttons=Gtk.ButtonsType.OK)

    try:
        esc = escape(message)
    except Exception:
        esc = message

    dialog.set_markup(esc)
    dialog.show_all()
    dialog.run()
    dialog.destroy()


class BaseGrid(Gtk.Grid):
    """Base Gtk.Grid.
    """

    def __init__(self, tooltip="", orientation=Gtk.Orientation.VERTICAL):
        """Initialization.

        Parameters
        ----------
        tooltip : str, optional
            Grid tooltip.
        orientation : object, optional
            Grid orientation.
        """
        Gtk.Grid.__init__(self)
        self.set_orientation(orientation)
        self.set_tooltip_text(tooltip)

    def set_spacing(self, col, row):
        """Set spacing.

        Parameters
        ----------
        col : int
            Column spacing.
        row : int
            Row spacing.
        """
        self.set_column_spacing(col)
        self.set_row_spacing(row)


class FeedsManagerWindow(Gtk.ApplicationWindow):
    """Feeds manager window.

    Attributes
    ----------
    hidden_fields : list
        The list of hidden columns.
    main_box : object
        The main container of the window.
    profile_combo : object
        The profile selection combo box.
    show_hidden_fields : bool
        Whether to display or not the hidden columns.
    treeview : object
        The tree view element listing all feeds on a profile.
    """

    def __init__(self, *args, **kwargs):
        """Initialization.

        Parameters
        ----------
        *args
            Arguments.
        **kwargs
            Keyword arguments.
        """
        super().__init__(*args, **kwargs)
        self.show_hidden_fields = False
        self.hidden_fields = []

        self.set_default_size(800, 450)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.set_icon_from_file(os.path.join(XLET_DIR, "icon.png"))
        self.main_box = BaseGrid()
        self.add(self.main_box)

    def get_toolbar(self):
        """Get toolbar.

        Returns
        -------
        object
            The window toolbar.
        """
        toolbar = Gtk.Toolbar()
        toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_PRIMARY_TOOLBAR)

        toolitem = Gtk.ToolItem()
        toolitem.set_expand(True)
        toolbar.add(toolitem)

        toolbar_box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        toolbar_box.set_spacing(5, 0)
        toolbar_box.set_property("hexpand", True)
        toolbar_box.set_property("vexpand", False)

        toolbar_box_scrolledwindow = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
        toolbar_box_scrolledwindow.set_policy(hscrollbar_policy=Gtk.PolicyType.AUTOMATIC,
                                              vscrollbar_policy=Gtk.PolicyType.NEVER)
        toolbar_box_scrolledwindow.add(toolbar_box)
        toolitem.add(toolbar_box_scrolledwindow)

        dummy_grid = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        dummy_grid.set_property("hexpand", True)

        profile_label = Gtk.Label()
        profile_label.set_property("vexpand", False)
        profile_label.set_property("valign", Gtk.Align.CENTER)
        profile_label.set_text(_("Profile Name:"))
        profile_label.show()

        # Profile combo
        self.profile_combo = Gtk.ComboBoxText()
        self.profile_combo.set_property("valign", Gtk.Align.CENTER)
        self.profile_combo.set_property("vexpand", False)
        self.profile_combo.set_model(self.config.profiles)
        self.profile_combo.set_active(self.config.get_profile_id())
        self.profile_combo.set_id_column(0)
        self.profile_combo.connect("changed", self.change_profile)

        add_profile_button = Gtk.Button()
        add_profile_button.set_property("valign", Gtk.Align.CENTER)
        add_profile_button.add(Gtk.Image.new_from_icon_name(
            "list-add-symbolic", Gtk.IconSize.BUTTON))
        add_profile_button.set_tooltip_text(_("Create a new profile"))

        add_profile_button.connect("clicked", self.on_new_profile_button_activate)

        remove_profile_button = Gtk.Button()
        remove_profile_button.set_property("valign", Gtk.Align.CENTER)
        remove_profile_button.add(Gtk.Image.new_from_icon_name(
            "edit-delete-symbolic", Gtk.IconSize.BUTTON))
        remove_profile_button.set_tooltip_text(_("Remove current profile"))

        remove_profile_button.connect("clicked", self.on_remove_profile_button_activate)

        # Menu button
        menu_popup = Gtk.Menu()
        menu_popup.set_halign(Gtk.Align.END)
        menu_popup.append(self.create_menu_item(text=_("Import OPML"),
                                                callback=self._import_opml))
        menu_popup.append(self.create_menu_item(text=_("Import Feeds File"),
                                                callback=self._import_feeds_file))
        menu_popup.append(Gtk.SeparatorMenuItem())
        menu_popup.append(self.create_menu_item(text=_("Export Feeds File"),
                                                callback=self.on_menu_export_feeds))
        menu_popup.append(Gtk.SeparatorMenuItem())
        menu_popup.append(self.create_menu_item(text=_("Toggle Hidden Fields"),
                                                callback=self.on_menu_toggle_hidden))
        menu_popup.append(Gtk.SeparatorMenuItem())
        menu_popup.append(self.create_menu_item(text=_("Help"),
                                                callback=self.open_help_page))

        menu_popup.show_all()
        menu_button = Gtk.MenuButton()
        menu_button.set_property("valign", Gtk.Align.CENTER)
        menu_button.set_popup(menu_popup)
        menu_button.add(Gtk.Image.new_from_icon_name("open-menu-symbolic", Gtk.IconSize.BUTTON))
        menu_button.set_tooltip_text(_("Manage settings"))

        toolbar_box.attach(profile_label, 0, 0, 1, 1)
        toolbar_box.attach(self.profile_combo, 1, 0, 1, 1)
        toolbar_box.attach(add_profile_button, 2, 0, 1, 1)
        toolbar_box.attach(remove_profile_button, 3, 0, 1, 1)
        toolbar_box.attach(dummy_grid, 4, 0, 1, 1)
        toolbar_box.attach(menu_button, 5, 0, 1, 1)

        return toolbar

    def get_feed_table(self):
        """Get feed table.

        Returns
        -------
        object
            The table containing all feeds from a profile.
        """
        self.treeview = Gtk.TreeView(model=self.config.feeds)
        self.treeview.set_hexpand(True)
        self.treeview.set_vexpand(True)
        self.treeview.set_reorderable(True)

        renderer_id = Gtk.CellRendererText()
        renderer_id.set_property("editable", False)
        column_id = Gtk.TreeViewColumn("Id", renderer_id, text=0)
        column_id.set_expand(False)
        column_id.set_visible(self.show_hidden_fields)
        self.hidden_fields.append(column_id)
        self.treeview.append_column(column_id)

        renderer_enable = Gtk.CellRendererToggle()
        renderer_enable.connect("toggled", self.field_toggled, 1)
        column_enable = Gtk.TreeViewColumn(_("Enable"), renderer_enable, active=1)
        column_enable.set_expand(False)
        self.treeview.append_column(column_enable)

        renderer_url = Gtk.CellRendererText()
        renderer_url.set_property("editable", True)
        renderer_url.connect("edited", self.text_edited, 2)
        column_url = Gtk.TreeViewColumn(_("Url"), renderer_url, text=2)
        column_url.set_expand(True)
        self.treeview.append_column(column_url)

        renderer_title = Gtk.CellRendererText()
        renderer_title.set_property("editable", True)
        renderer_title.connect("edited", self.text_edited, 3)
        column_title = Gtk.TreeViewColumn(_("Custom title"), renderer_title, text=3)
        column_title.set_expand(True)
        self.treeview.append_column(column_title)

        renderer_notify = Gtk.CellRendererToggle()
        renderer_notify.connect("toggled", self.field_toggled, 4)
        column_notify = Gtk.TreeViewColumn(_("Notify"), renderer_notify, active=4)
        column_notify.set_expand(False)
        self.treeview.append_column(column_notify)

        renderer_showread = Gtk.CellRendererToggle()
        renderer_showread.connect("toggled", self.field_toggled, 6)
        column_showread = Gtk.TreeViewColumn(_("Show Read"), renderer_showread, active=6)
        column_showread.set_expand(False)
        self.treeview.append_column(column_showread)

        renderer_interval = Gtk.CellRendererText()
        renderer_interval.set_property("editable", True)
        renderer_interval.connect("edited", self.interval_edited)
        column_interval = Gtk.TreeViewColumn(_("Interval"), renderer_interval, text=5)
        column_interval.set_expand(False)
        column_interval.set_visible(self.show_hidden_fields)
        self.hidden_fields.append(column_interval)
        self.treeview.append_column(column_interval)

        renderer_showimage = Gtk.CellRendererToggle()
        renderer_showimage.connect("toggled", self.field_toggled, 7)
        column_showimage = Gtk.TreeViewColumn(_("Show Image"), renderer_showimage, active=7)
        column_showimage.set_expand(False)
        column_showimage.set_visible(self.show_hidden_fields)
        self.hidden_fields.append(column_showimage)
        self.treeview.append_column(column_showimage)

        scrolled_window = Gtk.ScrolledWindow()
        scrolled_window.set_policy(Gtk.PolicyType.AUTOMATIC,
                                   Gtk.PolicyType.AUTOMATIC)

        scrolled_window.add(self.treeview)

        return scrolled_window

    def get_button_box(self):
        """Get button box.

        Returns
        -------
        object
            The buttons container.
        """
        box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        box.set_property("margin", 10)
        box.set_spacing(10, 10)

        add_button = Gtk.Button(
            image=Gtk.Image.new_from_icon_name("list-add", Gtk.IconSize.BUTTON),
            label=_("Add Feed")
        )
        add_button.set_tooltip_text(_("Add a new Feed."))
        add_button.connect("clicked", self.new_feed)

        del_button = Gtk.Button(
            image=Gtk.Image.new_from_icon_name("edit-delete", Gtk.IconSize.BUTTON),
            label=_("Delete Feed")
        )
        del_button.set_tooltip_text(_("Delete selected Feed."))
        del_button.connect("clicked", self.remove_feed)

        cancel_button = Gtk.Button(
            image=Gtk.Image.new_from_icon_name("window-close", Gtk.IconSize.BUTTON),
            label=_("Cancel")
        )
        cancel_button.connect("clicked", app.on_quit)

        save_button = Gtk.Button(
            image=Gtk.Image.new_from_icon_name("document-save", Gtk.IconSize.BUTTON),
            label=_("Apply")
        )
        save_button.set_tooltip_text(_("Save changes."))
        save_button.connect("clicked", self.save_clicked)
        save_button.connect("clicked", app.on_quit)

        dummy_grid = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        dummy_grid.set_hexpand(True)

        box.attach(add_button, 0, 0, 1, 1)
        box.attach(del_button, 1, 0, 1, 1)
        box.attach(dummy_grid, 2, 0, 1, 1)
        box.attach(save_button, 3, 0, 1, 1)
        box.attach(cancel_button, 4, 0, 1, 1)

        return box

    def on_remove_profile_button_activate(self, widget):
        """On delete profile button activated.

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        """
        profile_name = self.config.get_profile_name(self.profile_combo.get_active())

        if profile_name == "Default":
            display_warning_message(None, _("Unauthorized action"),
                                    _("Default profile cannot be removed."))
        else:
            question = Gtk.MessageDialog(self,
                                         Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
                                         Gtk.MessageType.QUESTION,
                                         Gtk.ButtonsType.OK_CANCEL,
                                         "\n".join([_("Do you wish to remove the currently selected profile?"),
                                                    _("This operation cannot be undone!")]))
            question.set_title(_("Profile removal"))
            response = question.run()
            question.destroy()

            if response == Gtk.ResponseType.OK:
                index = self.config.remove_profile(profile_name)
                self.profile_combo.set_model(self.config.profiles)
                self.profile_combo.set_active(index)

    def on_new_profile_button_activate(self, widget):
        """On new profile button activated.

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        """
        checking = Gtk.MessageDialog(self,
                                     Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
                                     Gtk.MessageType.QUESTION,
                                     Gtk.ButtonsType.OK_CANCEL,
                                     _("Changes will be discarded, continue?"))
        checking.set_title(_("Are you sure?"))
        response = checking.run()
        checking.destroy()

        if response == Gtk.ResponseType.OK:
            dialog = Gtk.MessageDialog(self,
                                       Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
                                       Gtk.MessageType.QUESTION,
                                       Gtk.ButtonsType.OK_CANCEL,
                                       _("New Profile Name"))
            # Make OK button the default.
            # https://stackoverflow.com/q/23983975
            ok_button = dialog.get_widget_for_response(response_id=Gtk.ResponseType.OK)
            ok_button.set_can_default(True)
            ok_button.grab_default()

            dialog_box = dialog.get_content_area()
            dialog.set_title(_("Add New Profile"))
            entry = Gtk.Entry()
            entry.set_activates_default(True)
            entry.set_size_request(100, 0)
            dialog_box.pack_end(entry, False, False, 0)
            dialog.show_all()
            response = dialog.run()
            name = entry.get_text()
            dialog.destroy()

            if response == Gtk.ResponseType.OK and name != "":
                index = self.config.add_profile(name)
                self.profile_combo.set_model(self.config.profiles)
                self.profile_combo.set_active(index)

    def change_profile(self, widget):
        """When a new profile is selected we need to switch the feeds and the profile gets
        updated also.

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        """
        selected = widget.get_active()
        self.config.set_profile(self.config.get_profile_name(selected))
        self.treeview.set_model(self.config.feeds)

    def text_edited(self, widget, row, text, col):
        """When a text box is edited we need to update the feed array.

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        row : str
            Row to edit.
        text : str
            Output.
        col : int
            Column to edit.
        """
        if len(text) > 0:
            self.config.feeds[row][col] = text

        else:
            self.config.feeds[row][col] = None

    def field_toggled(self, widget, row, col):
        """Toggle the value of the passed row / col in the feed array

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        row : str
            Row to edit.
        col : int
            Column to edit.
        """
        self.config.feeds[row][col] = not self.config.feeds[row][col]

    def interval_edited(self, widget, row, text):
        """When the interval is changed convert it to a number or refuse to update the field in the feed array

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        row : str
            Row to edit.
        text : str
            Output.
        """
        try:
            self.config.feeds[row][5] = int(text)
        except Exception:
            pass  # Nothing to do, ignore this.

    def remove_feed(self, widget):
        """When delete button is clicked we find the selected record and remove it
        from the feed array.

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        """
        selection = self.treeview.get_selection()
        result = selection.get_selected()
        if result:
            model, itr = result
        model.remove(itr)

    def new_feed(self, widget):
        """Adds a new row to the bottom of the array / Grid

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        """
        self.config.feeds.append([ConfigFileManager.get_new_id(), True,
                                  "http://", "", True, 5, False, False])
        self.treeview.set_cursor(len(self.config.feeds) - 1, self.treeview.get_column(0), True)
        self.set_size_request(-1, 150 + len(self.config.feeds) * 20)

    def save_clicked(self, widget):
        """When the user clicks apply we update and save the json file to disk

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        """
        self.save_config()

    def save_config(self):
        """Summary
        """
        try:
            self.config.save()
            # This "returns" data to be used on the JavaScript side. ¬¬
            print(self.config.get_profile())
        except Exception as err:
            dialog = Gtk.MessageDialog(self, 0,
                                       Gtk.MessageType.ERROR,
                                       Gtk.ButtonsType.CLOSE,
                                       _("Failed to save config file"))
            dialog.format_secondary_text(str(err))
            dialog.run()
            dialog.destroy()

    def _import_opml(self, widget):
        """Import OPML.

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        """
        self.on_menu_import(widget, "OPML")

    def _import_feeds_file(self, widget):
        """Import feeds file.

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        """
        self.on_menu_import(widget, "FEEDS")

    def on_menu_import(self, widget, type):
        """Import dialog.

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        type : str
            Import type.
        """
        filter_type = Gtk.FileFilter()
        if type == "OPML":
            title = _("Choose a OPML feed file")
            filter_type.set_name(_("OPML files"))
            filter_type.add_pattern("*.opml")
        else:
            title = _("Choose a feed file")
            filter_type.set_name(_("CSV files"))
            filter_type.add_mime_type("text/x-csv")

        dialog = Gtk.FileChooserDialog(title, self,
                                       Gtk.FileChooserAction.OPEN,
                                       (
                                           Gtk.STOCK_CANCEL,
                                           Gtk.ResponseType.CANCEL,
                                           Gtk.STOCK_OPEN,
                                           Gtk.ResponseType.OK
                                       ))

        filter_any = Gtk.FileFilter()
        filter_any.set_name(_("All files"))
        filter_any.add_pattern("*")

        # Add filters to dialog box
        dialog.add_filter(filter_type)
        dialog.add_filter(filter_any)

        response = dialog.run()
        filename = dialog.get_filename()
        dialog.destroy()

        if response == Gtk.ResponseType.OK:
            try:
                if type == "OPML":
                    new_feeds = self.config.import_opml_file(filename)
                else:
                    new_feeds = self.config.import_feeds(filename)

                dialog = Gtk.MessageDialog(self, 0,
                                           Gtk.MessageType.INFO,
                                           Gtk.ButtonsType.OK,
                                           _("File imported"))
                dialog.format_secondary_text(_("Imported %d feeds") % new_feeds)
                dialog.run()
                dialog.destroy()

            except Exception as e:
                dialog = Gtk.MessageDialog(self, 0,
                                           Gtk.MessageType.ERROR,
                                           Gtk.ButtonsType.CLOSE,
                                           _("Failed to import file"))
                dialog.format_secondary_text(str(e))
                dialog.run()
                dialog.destroy()

    def on_menu_export_feeds(self, widget):
        """Export dialog.

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        """
        dialog = Gtk.FileChooserDialog(_("Save a feed file"), self,
                                       Gtk.FileChooserAction.SAVE,
                                       (
            Gtk.STOCK_CANCEL,
            Gtk.ResponseType.CANCEL,
            Gtk.STOCK_SAVE,
            Gtk.ResponseType.OK
        ))

        dialog.set_current_name("%s.csv" % _("Untitled"))

        # Add filters to dialog box
        filter_text = Gtk.FileFilter()
        filter_text.set_name(_("CSV files"))
        filter_text.add_mime_type("text/x-csv")
        dialog.add_filter(filter_text)

        filter_any = Gtk.FileFilter()
        filter_any.set_name(_("All files"))
        filter_any.add_pattern("*")
        dialog.add_filter(filter_any)

        response = dialog.run()
        filename = dialog.get_filename()
        dialog.destroy()
        sys.stderr.write(str(response))

        if response == Gtk.ResponseType.OK:
            try:
                self.config.export_feeds(filename)
            except Exception as ex:
                sys.stderr.write(_("Unable to export file, exception: %s") % str(ex))
                error_dialog = Gtk.MessageDialog(self, 0,
                                                 Gtk.MessageType.ERROR,
                                                 Gtk.ButtonsType.CLOSE,
                                                 _("Unable to export file"))
                error_dialog.format_secondary_text(str(ex))

                error_dialog.run()
                error_dialog.destroy()

    def on_menu_toggle_hidden(self, widget):
        """Hide no implemented features.

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        """
        self.show_hidden_fields = not self.show_hidden_fields
        for column in self.hidden_fields:
            column.set_visible(self.show_hidden_fields)

    def open_help_page(self, widget):
        """Open xlet help page.

        Parameters
        ----------
        widget : object
            The widget attached to this callback.
        """
        from subprocess import call
        call(("xdg-open", os.path.join(XLET_DIR, "HELP.html")))

    # A million thanks to the """geniuses""" ($%&½€#&) at Gnome for
    # deprecating Gtk.ImageMenuItem!!! ¬¬
    def create_menu_item(self, text, callback):
        """Create menu item.

        Parameters
        ----------
        text : str
            Menu item label.
        callback : object
            Menu item activation callback.

        Returns
        -------
        object
            The generated menu item.
        """
        item = Gtk.MenuItem(text)

        if (callback is not None):
            item.connect("activate", callback)

        return item


class FeedsManagerApplication(Gtk.Application):
    """Feeds Manager application.

    Attributes
    ----------
    application : object
        Instance of Gtk.Application.
    config : object
        Instance of ConfigFileManager.
    window : object
        Instance of FeedsManagerWindow.
    """

    def __init__(self, config, *args, **kwargs):
        """Initialization.

        Parameters
        ----------
        config : object
            Instance of ConfigFileManager.
        *args
            Positional arguments.
        **kwargs
            Keyword arguments.
        """
        self.config = config

        GLib.set_application_name(APPLICATION_NAME)
        super().__init__(*args,
                         application_id=APPLICATION_ID,
                         flags=Gio.ApplicationFlags.FLAGS_NONE,
                         **kwargs)

        self.application = Gtk.Application()
        self.application.connect("startup", self.do_startup, "hello")
        self.application.connect("activate", self.do_activate)

    def do_activate(self, data=None):
        """Activate window.

        Parameters
        ----------
        data : None, optional
            Data.
        """
        self.window.present()

    def do_startup(self, data=None):
        """Initialize application.

        Parameters
        ----------
        data : None, optional
            Data.
        """
        Gtk.Application.do_startup(self)
        self._buildUI()

    def _buildUI(self):
        """Build UI.
        """
        self.window = FeedsManagerWindow(application=self,
                                         title=APPLICATION_NAME)
        self.window.config = self.config

        self.window.connect("destroy", self.on_quit)
        self.window.main_box.attach(self.window.get_toolbar(), 0, 0, 1, 1)
        self.window.main_box.attach(self.window.get_feed_table(), 0, 1, 1, 1)
        self.window.main_box.attach(self.window.get_button_box(), 0, 2, 1, 1)

        self.window.show_all()

    def on_quit(self, window):
        """On quit.

        Parameters
        ----------
        window : object
            The application window.
        """
        self.quit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("filename", help=_("Path to the feeds.json file."))
    parser.add_argument("profile", help=_("Profile name used by an instance of this applet."))

    args = parser.parse_args()

    config = ConfigFileManager(args.filename, args.profile)
    app = FeedsManagerApplication(config)
    app.run()
