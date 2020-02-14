#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Dialog for selecting themed icons.
"""
import gi
import os

from threading import Thread

gi.require_version("Gtk", "3.0")
gi.require_version("Gdk", "3.0")
gi.require_version("GdkPixbuf", "2.0")

from gi.repository import GLib
from gi.repository import Gdk
from gi.repository import GdkPixbuf
from gi.repository import Gtk
from gi.repository import Pango

from . import exceptions
from .common import BaseGrid
from .common import _


class IconChooserDialog(Gtk.Dialog):
    """GTK+ 3 Dialog to allow selection of a themed icon.

    Based on `python-gtk-themed-icon-chooser \
    <https://github.com/Tomha/python-gtk-themed-icon-chooser>`__ and
    Cinnamon's native widget.

    The name of the selection icon is made available as a result of the run
    method, or by the get_selected_icon_name method.

    NOTE
    ----
    If 1000s of icons are displayed this is 1000s of widgets. They are
    loaded asynchronously to prevent blocking the main thread, but they must
    still be show()n from the main thread, which may momentarily block it. This
    can be limited by filtering the available icon selection beforehand.

    TODO
    ----
    Not all memory created by the dialog seems to be released.
    """

    def __init__(self, transient_for=None):
        """Initialization.

        Parameters
        ----------
        transient_for : TYPE
            Description
        """
        super().__init__(transient_for=transient_for,
                         use_header_bar=True,
                         title=_("Choose an Icon"),
                         flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
                         buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                                  _("_Select"), Gtk.ResponseType.OK)
                         )
        GLib.threads_init()

        self.set_default_size(800, 600)

        # Mark for deletion on EOL. Gtk 3.18.
        # Keep call to set_css_name without the try/catch.
        try:
            self.set_css_name("stacksidebar")
        except Exception:
            pass

        self._icon_size = 32
        self._search_term = ""
        self._selected_icon = ""
        self._timer = None
        self._main_app = None

        # Widgets start here
        self._headerbar = self.get_header_bar()
        self._sidebar = Gtk.ListBox()
        self._sidebar.set_vexpand(True)
        sidebar_frame = Gtk.Frame()
        sidebar_frame.set_shadow_type(Gtk.ShadowType.IN)
        sidebar_frame.add(self._sidebar)
        sidebar_box_scroller = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
        sidebar_box_scroller.get_style_context().add_class(Gtk.STYLE_CLASS_SIDEBAR)
        sidebar_box_scroller.set_policy(hscrollbar_policy=Gtk.PolicyType.NEVER,
                                        vscrollbar_policy=Gtk.PolicyType.AUTOMATIC)
        sidebar_box_scroller.add(sidebar_frame)

        self._flow_box = Gtk.FlowBox()
        self._flow_box.set_vexpand(True)
        self._flow_box.set_hexpand(True)
        self._flow_box.set_orientation(Gtk.Orientation.HORIZONTAL)
        self._flow_box.set_column_spacing(8)
        self._flow_box.set_row_spacing(8)
        self._flow_box.set_homogeneous(True)
        self._flow_box.set_valign(Gtk.Align.START)

        self._flow_box_scroller = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
        self._flow_box_scroller.set_policy(hscrollbar_policy=Gtk.PolicyType.NEVER,
                                           vscrollbar_policy=Gtk.PolicyType.AUTOMATIC)
        self._flow_box_scroller.add(self._flow_box)

        self._flow_box_frame = Gtk.Frame()
        self._flow_box_frame.set_hexpand(True)
        self._flow_box_frame.set_shadow_type(Gtk.ShadowType.IN)
        self._flow_box_frame.get_style_context().add_class(Gtk.STYLE_CLASS_VIEW)
        self._flow_box_frame.add(self._flow_box_scroller)

        self._search_entry = Gtk.SearchEntry()
        self._search_entry.set_hexpand(True)
        self._search_entry.set_placeholder_text(_("Search..."))

        browse_image_button = Gtk.Button(label=_("Browse"), valign=Gtk.Align.CENTER)
        browse_image_button.get_style_context().add_class("text-button")

        search_box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        search_box.attach(self._search_entry, 0, 0, 1, 1)
        search_box.attach(browse_image_button, 1, 0, 1, 1)

        icon_selector_box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        icon_selector_box.set_hexpand(True)
        icon_selector_box.set_vexpand(True)
        icon_selector_box.attach(sidebar_box_scroller, 0, 0, 1, 1)
        icon_selector_box.attach(self._flow_box_frame, 1, 0, 1, 1)

        # Spinner
        self._spinner = Gtk.Spinner()
        self._spinner.set_size_request(48, 48)
        self._spinner.set_hexpand(False)
        self._spinner.set_vexpand(False)
        self._spinner.set_halign(Gtk.Align.CENTER)
        self._spinner.set_valign(Gtk.Align.CENTER)

        content_box = self.get_content_area()
        content_box.set_spacing(4)
        content_box.pack_start(search_box, False, False, 0)
        content_box.pack_start(icon_selector_box, True, True, 1)

        # Dialog Buttons
        self._select_button = self.get_widget_for_response(Gtk.ResponseType.OK)

        # Connect Signals
        self._search_entry.connect("changed", self._filter_icons)
        self._search_entry.connect("key-press-event", self._on_search_entry_key_pressed)
        browse_image_button.connect("clicked", self._on_browse_button_clicked)
        self._sidebar.connect("selected-rows-changed", self._on_category_selected)
        self._flow_box.connect("selected-children-changed", self._on_icon_selected)

    def _populate_sidebar(self):
        """Summary
        """
        for label, context in self._main_app.icon_chooser_store:
            row = Gtk.ListBoxRow()
            row.get_style_context().add_class("sidebar-item")
            cat_label = Gtk.Label(label)
            cat_label.set_xalign(0.0)
            cat_label.set_margin_start(6)
            cat_label.set_margin_end(6)
            row.add(cat_label)
            self._sidebar.add(row)

        self._sidebar.select_row(self._sidebar.get_row_at_index(0))

    def _create_icon_previews(self, context):
        """Create icon previews to be placed in the dialog's icon box.

        Intended to be run in new thread. This only creates previews and adds
        them to the icon flow box, but it will not show()/display them. This is
        done by calling _display_icon_previews, which should be done in the
        main thread via GLib.idle_add.

        Parameters
        ----------
        context : TYPE
            Description
        """
        for icon in self._main_app.icon_chooser_icons.get(context, []):
            flow_child = Gtk.FlowBoxChild()
            flow_child.add(_IconPreview(icon, self._icon_size))
            GLib.idle_add(self._flow_box.insert, flow_child, -1)

        GLib.idle_add(self._display_icon_previews)

    def _display_icon_previews(self):
        """Display icons and clean up after _create_icon_previews is run.

        WARNING: This must be run from the main thread, however show_all can
        take a noticeable amount of time, so the dialog will freeze momentarily
        as this runs if there are many icons to display. This is not avoidable
        to my knowledge.
        """
        self._spinner.stop()
        self._flow_box_frame.remove(self._flow_box_frame.get_children()[0])
        self._flow_box_frame.add(self._flow_box_scroller)
        self._flow_box_scroller.show_all()

        if self._search_entry.get_text():
            self._filter_icons()
            self._search_entry.set_position(len(self._search_entry.get_text()))
        else:
            self._flow_box.show_all()
            self._update_subtitle(len(self._flow_box.get_children()))

    def _filter_icons(self, *args):
        """Filter icons based on filter term, used when filter term changes.

        Parameters
        ----------
        *args
            Description
        """
        self._search_term = self._search_entry.get_text()
        flow_box_children = self._flow_box.get_children()

        if self._search_term == "":
            self._flow_box.show_all()
            self._update_subtitle(len(self._flow_box.get_children()))
        elif len(self._search_term) > 2:
            icons_count = 0
            self._update_subtitle(icons_count)

            for icon in flow_box_children:
                name = icon.get_children()[0].get_name().lower()

                if self._search_term.lower() in name:
                    icons_count += 1
                    icon.show()
                else:
                    icon.hide()

            self._update_subtitle(icons_count)

    def _update_subtitle(self, count):
        """Summary

        Parameters
        ----------
        count : TYPE
            Description
        """
        self._headerbar.set_subtitle(_("Icons shown") + ": " + str(count))

    def _on_category_selected(self, *args):
        """When the context is changed, display the approprite icons.

        Parameters
        ----------
        *args
            Description

        Returns
        -------
        TYPE
            Description
        """
        selection = self._sidebar.get_selected_rows()

        if not selection:
            return

        self._select_button.set_sensitive(False)
        self._selected_icon = None

        for child in self._flow_box.get_children():
            child.destroy()

        # Place a spinner in the icon section while icons are loaded.
        self._flow_box_frame.remove(self._flow_box_frame.get_children()[0])
        self._flow_box_frame.add(self._spinner)
        self._spinner.start()

        # Load icon previews for the new context asynchronously.
        context_label, context = self._main_app.icon_chooser_store[selection[0].get_index()]

        thread = Thread(target=self._create_icon_previews, args=(context,))
        thread.setDaemon(True)
        thread.start()

    def _on_icon_selected(self, *args):
        """Sets the selected_icon property when the selection changes.

        Parameters
        ----------
        *args
            Description

        Returns
        -------
        TYPE
            Description
        """
        selection = self._flow_box.get_selected_children()

        if not selection:
            return

        self._selected_icon = selection[0].get_children()[0].get_name()
        self._select_button.set_sensitive(True)

    def _on_search_entry_key_pressed(self, widget, event):
        """Sets the selected_icon property when the selection changes.

        Parameters
        ----------
        widget : TYPE
            Description
        event : TYPE
            Description
        """
        if event.keyval == Gdk.KEY_Escape:
            if self._search_term:
                self._search_entry.set_text("")
            else:
                GLib.idle_add(self.response, Gtk.ResponseType.CANCEL)

    def update_icon_preview_cb(self, dialog, preview):
        """Summary

        Parameters
        ----------
        dialog : TYPE
            Description
        preview : TYPE
            Description
        """
        filename = dialog.get_preview_filename()
        dialog.set_preview_widget_active(False)

        if filename is not None:
            if os.path.isfile(filename):
                try:
                    pixbuf = GdkPixbuf.Pixbuf.new_from_file(filename)
                except Exception:
                    pixbuf = None

                if pixbuf is not None:
                    try:
                        if pixbuf.get_width() > 128:
                            pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_size(filename, 128, -1)
                        elif pixbuf.get_height() > 128:
                            pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_size(filename, -1, 128)
                    except Exception:
                        pixbuf = None

                    if pixbuf is not None:
                        preview.set_from_pixbuf(pixbuf)
                        dialog.set_preview_widget_active(True)

    def _on_browse_button_clicked(self, widget, dir_path="/usr/share/icons"):
        """Summary

        Parameters
        ----------
        widget : TYPE
            Description
        dir_path : str, optional
            Description
        """
        dialog = Gtk.FileChooserDialog(title=_("Choose an Icon"),
                                       action=Gtk.FileChooserAction.OPEN,
                                       transient_for=self,
                                       use_header_bar=True,
                                       buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                                                _("_Select"), Gtk.ResponseType.OK))

        filter_text = Gtk.FileFilter()
        filter_text.set_name(_("Image files"))
        filter_text.add_mime_type("image/*")
        dialog.add_filter(filter_text)

        preview = Gtk.Image()
        dialog.set_preview_widget(preview)
        dialog.connect("update-preview", self.update_icon_preview_cb, preview)

        if dir_path:
            dialog.set_current_folder(dir_path)

        response = dialog.run()

        if response == Gtk.ResponseType.OK:
            filename = dialog.get_filename()
            self._selected_icon = filename
            # Emit the OK response to the parent dialog. So the icon chooser dialog is
            # directly closed and return the selected image path.
            # NOTE: It seems that without the call to GLib.idle_add, the "master" dialog doesn't
            # have time to return properly. Who knows what the heck is happening!
            # Most likely, I'm asking Python to do to much.
            GLib.idle_add(self.response, response)

        dialog.destroy()

    def run(self):
        """Run dialog to select a themed icon.

        This loads a the current icon theme, gets and filters available
        contexts, then filters/displays icon previews for the first
        (alphabetically) context.

        Returns
        -------
        TYPE
            Description
        """
        self._main_app.init_icon_chooser_data()

        self._select_button.set_sensitive(False)
        self._populate_sidebar()

        self.show_all()

        if self._search_term:
            if "/" in self._search_term and os.path.isdir(os.path.dirname(self._search_term)):
                self._on_browse_button_clicked(None, dir_path=os.path.dirname(self._search_term))
            else:
                self._search_entry.set_text(self._search_term)

        response = super().run()

        if response == Gtk.ResponseType.OK:
            return self.get_selected_icon_name()

        return None

    def get_icon_size(self):
        """Get the pixel size to display icons in.

        Returns
        -------
        TYPE
            Size to display icons in, in pixels.
        """
        return self._icon_size

    def get_search_term(self):
        """Get the string used for filtering icons by name.

        Returns
        -------
        TYPE
            String used for filtering icons by name.
        """
        return self._search_term

    def get_selected_icon_name(self):
        """Get the name of the icon selected in the dialog.

        Returns
        -------
        TYPE
            Name of the currently selected icon.
        """
        return self._selected_icon

    def get_main_app(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        return self._main_app

    def set_icon_size(self, size):
        """Set the pixel size to display icons in.

        Dialog will not update the icon size once it has been shown.

        Parameters
        ----------
        size : TYPE
            Size to display icons in, in pixels.

        Raises
        ------
        exceptions.WrongType
            Description
        """
        if not type(size) == int:
            raise exceptions.WrongType("int", type(size).__name__)

        self._icon_size = size

    def set_search_term(self, filter_term):
        """Set the string used for filtering icons by name.

        Dialog will not update the filter term once it has been shown.

        Parameters
        ----------
        filter_term : TYPE
            String used for filtering icons by name.

        Raises
        ------
        exceptions.WrongType
            Description
        """
        if not type(filter_term) == str:
            raise exceptions.WrongType("str", type(filter_term).__name__)

        self._search_term = filter_term

    def set_main_app(self, main_app):
        """Summary

        Parameters
        ----------
        main_app : TYPE
            Description
        """
        self._main_app = main_app


class _IconPreview(BaseGrid):
    """Creates a preview box for icons containing the icon and its name.
    """

    def __init__(self, name, size):
        """Initialization.

        Parameters
        ----------
        name : TYPE
            Description
        size : TYPE
            Description
        """
        super().__init__(tooltip=name)
        self.set_hexpand(True)
        self.set_vexpand(True)

        self._icon_name = name

        icon = Gtk.Image.new_from_icon_name(name, Gtk.IconSize.DIALOG)
        # Gtk.Image.new_from_icon_name seems to sometimes ignore the set size,
        #   leading to inconsistent icon sizes. Solution is to force a size
        #   using set_pixel_size.
        icon.set_pixel_size(size)
        icon.set_hexpand(True)
        icon.set_vexpand(True)

        label = Gtk.Label(name)
        label.set_justify(Gtk.Justification.CENTER)
        label.set_lines(3)
        label.set_line_wrap(True)
        label.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR)
        label.set_max_width_chars(12)
        label.set_ellipsize(Pango.EllipsizeMode.END)
        label.set_alignment(0.5, 0.5)
        label.set_hexpand(True)
        label.set_vexpand(True)

        self.attach(icon, 0, 0, 1, 1)
        self.attach(label, 0, 1, 1, 1)

    def get_name(self):
        """Get the name of the icon.

        Returns
        -------
        TYPE
            Name of the icon.
        """
        return self._icon_name


if __name__ == "__main__":
    pass
