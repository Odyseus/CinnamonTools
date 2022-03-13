#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Widgets for selecting themed icons.

TODO
----
- IconChooserDialog

    1. Investigate if it would be possible to use a single instance of IconChooserDialog for all
        IconChooser instances found in a window. Right now the IconChooserDialog is created for every
        IconChooser widget and re-used after is closed.
    2. If the first point can be achieved, investigate if I can implement the use of a Gtk.StackSidebar.
        Right now I'm using a single Gtk.FlowBox and destroying all of its children on category selection.
        Maybe I can implement a Gtk.FlowBox for every category and make all their Gtk.FlowBoxChild elements
        persistent but created/displayed in chunks?
"""
import gi
import os

from threading import Thread

gi.require_version("Gtk", "3.0")
gi.require_version("Gdk", "3.0")
gi.require_version("GdkPixbuf", "2.0")

from gi.repository import GLib
from gi.repository import GObject
from gi.repository import Gdk
from gi.repository import GdkPixbuf
from gi.repository import Gtk
from gi.repository import Pango

from . import exceptions
from .common import BaseGrid
from .common import _
from .common import get_global
from .common import get_toplevel_window


class IconChooserDialog(Gtk.Dialog):
    """GTK+ 3 Dialog to allow selection of a themed icon.

    Based on `python-gtk-themed-icon-chooser \
    <https://github.com/Tomha/python-gtk-themed-icon-chooser>`__ and
    XApp's native widget.

    The name of the selection icon is made available as a result of the run
    method, or by the get_selected_icon_name method.

    Note
    ----
    If 1000s of icons are displayed this is 1000s of widgets. They are
    loaded asynchronously to prevent blocking the main thread, but they must
    still be show()n from the main thread, which may momentarily block it. This
    can be limited by filtering the available icon selection beforehand.

    Todo
    ----
    Not all memory created by the dialog seems to be released.
    """

    def __init__(self, transient_for=None):
        """Initialization.

        Parameters
        ----------
        transient_for : Gtk.Window
            The window the dialog will be transient for.
        """
        super().__init__(
            transient_for=transient_for,
            use_header_bar=get_global("USE_HEADER_BARS_ON_DIALOGS"),
            title=_("Choose an Icon"),
            flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
            buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                     _("_Select"), Gtk.ResponseType.OK)
        )
        GLib.threads_init()

        self.set_default_size(800, 600)

        self._icon_size = 32
        self._search_term = ""
        self._selected_icon = ""
        self._main_app = get_global("MAIN_APP")

        # Widgets start here
        self._headerbar = self.get_header_bar()
        self._sidebar = Gtk.ListBox()
        self._sidebar.set_vexpand(True)
        c = self._sidebar.get_style_context()
        # Mark for deletion on EOL. Gtk4
        # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
        c.add_class(Gtk.STYLE_CLASS_SIDEBAR)
        c.add_class("cinnamon-xlet-settings-app")
        c.add_class("icon-chooser-dialog-sidebar")
        sidebar_frame = Gtk.Frame()
        # Mark for deletion on EOL. Gtk4
        # Stop using set_shadow_type and set the boolean property has-frame.
        sidebar_frame.set_shadow_type(Gtk.ShadowType.IN)
        sidebar_frame.add(self._sidebar)
        sidebar_box_scroller = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
        sidebar_box_scroller.set_policy(hscrollbar_policy=Gtk.PolicyType.NEVER,
                                        vscrollbar_policy=Gtk.PolicyType.AUTOMATIC)
        sidebar_box_scroller.add(sidebar_frame)

        self._flow_box = Gtk.FlowBox()
        self._flow_box.set_property("expand", True)
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
        # Mark for deletion on EOL. Gtk4
        # Stop using set_shadow_type and set the boolean property has-frame.
        self._flow_box_frame.set_shadow_type(Gtk.ShadowType.IN)
        # Mark for deletion on EOL. Gtk4
        # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
        self._flow_box_frame.get_style_context().add_class(Gtk.STYLE_CLASS_VIEW)
        self._flow_box_frame.add(self._flow_box_scroller)

        self._search_entry = Gtk.SearchEntry()
        self._search_entry.set_hexpand(True)
        self._search_entry.set_placeholder_text(_("Search..."))

        browse_image_button = Gtk.Button(label=_("Browse"))

        search_box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        # Mark for deletion on EOL. Gtk4
        # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
        search_box.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED)
        search_box.attach(self._search_entry, 0, 0, 1, 1)
        search_box.attach(browse_image_button, 1, 0, 1, 1)

        icon_selector_box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        icon_selector_box.set_property("expand", True)
        icon_selector_box.attach(sidebar_box_scroller, 0, 0, 1, 1)
        icon_selector_box.attach(self._flow_box_frame, 1, 0, 1, 1)

        # Spinner
        self._spinner = Gtk.Spinner()
        self._spinner.set_size_request(48, 48)
        self._spinner.set_property("expand", False)
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
        # Mark for deletion on EOL. Gtk4
        # Use Gtk.EventControllerKey instead of key-press-event.
        self._search_entry.connect("key-press-event", self._on_search_entry_key_pressed)
        browse_image_button.connect("clicked", self._on_browse_button_clicked)
        self._sidebar.connect("selected-rows-changed", self._on_category_selected)
        self._flow_box.connect("selected-children-changed", self._on_icon_selected)

        GLib.idle_add(self._populate_sidebar)

    def run(self):
        """Run dialog to select a themed icon.

        Returns
        -------
        str
            An icon name or path.
        """
        if self._main_app.gtk_icon_theme_uptodate:
            self._populate_sidebar(True)

        self._select_button.set_sensitive(False)

        self.show_all()

        if self._search_term:
            if "/" in self._search_term and os.path.isdir(os.path.dirname(self._search_term)):
                self._on_browse_button_clicked(None, dir_path=os.path.dirname(self._search_term))
            else:
                self._search_entry.set_text(self._search_term)
                GLib.idle_add(self._filter_icons)

        response = super().run()

        if response == Gtk.ResponseType.OK:
            return self.get_selected_icon_name()

        return None

    def _populate_sidebar(self, repopulate=False):
        """Populate the dialog sidebar.

        Parameters
        ----------
        repopulate : bool, optional
            Whether to repopulate the icons storage due to changes outside of the application.
        """
        if repopulate:
            for child in self._sidebar.get_children():
                child.destroy()

        self._main_app.init_icon_chooser_data()

        for label, context in self._main_app.icon_chooser_contexts_store:
            row = Gtk.ListBoxRow()
            # Mark for deletion on EOL. Gtk4
            # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
            # NOTE: Class added to be able to style these items as elements of a Gtk.StackSidebar.
            row.get_style_context().add_class("sidebar-item")
            cat_label = Gtk.Label(label)
            cat_label.set_xalign(0.0)
            cat_label.set_margin_start(6)
            cat_label.set_margin_end(6)
            row.add(cat_label)
            self._sidebar.add(row)

    def _create_icon_previews(self, context):
        """Create icon previews to be placed in the dialog's icon box.

        Intended to be run in new thread. This only creates previews and adds
        them to the icon flow box, but it will not show()/display them. This is
        done by calling _display_icon_previews, which should be done in the
        main thread via GLib.idle_add.

        Parameters
        ----------
        context : str
            A string identifying a particular type of icon.

        NOTE
        ----
        FIXME: I'm forced to use a Gtk.ListStore to store ALL icons for the Gtk.EntryCompletion.
        I used to store ALL icons in a dictionary to be able to iterate icons under
        a specific category. Having the EXACT SAME DATA stored twice didn't seem appropiate, so here
        I re-use the Gtk.ListStore (self._main_app.icon_chooser_icons_store).
        The thing is that having to iterate through THE ENTIRE ICONS DATABASE is as bad as having
        the data stored twice. I don't know how the f*ck to iterate the icon_chooser_icons_store
        Gtk.ListStore selectively.
        """
        for ctc, icon in self._main_app.icon_chooser_icons_store:
            if ctc != context:
                continue

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
        self._spinner.hide()
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
            Arguments.
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
        """Update dialog subttle.

        Parameters
        ----------
        count : int
            The currently displayed amount of icons.
        """
        if self._headerbar:
            self._headerbar.set_subtitle(_("Icons shown") + f": {str(count)}")

    def _on_category_selected(self, *args):
        """When the context is changed, display the approprite icons.

        Parameters
        ----------
        *args
            Arguments.

        Returns
        -------
        None
            Halt execution.
        """
        selection = self._sidebar.get_selected_rows()

        if not selection:
            return

        self._select_button.set_sensitive(False)
        self._selected_icon = ""

        for child in self._flow_box.get_children():
            child.destroy()

        # Place a spinner in the icon section while icons are loaded.
        self._flow_box_frame.remove(self._flow_box_frame.get_children()[0])
        self._flow_box_frame.add(self._spinner)
        # NOTE: Starting the spinner whon't display it. ¬¬
        self._spinner.show()
        self._spinner.start()

        # Load icon previews for the new context asynchronously.
        context_label, context = self._main_app.icon_chooser_contexts_store[selection[0].get_index(
        )]

        thread = Thread(target=self._create_icon_previews, args=(context,))
        thread.setDaemon(True)
        thread.start()

    def _on_icon_selected(self, *args):
        """Sets the selected_icon property when the selection changes.

        Parameters
        ----------
        *args
            Arguments.

        Returns
        -------
        None
            Halt execution.
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
        widget : Gtk.SearchEntry
            The search entry.
        event : Gdk.EventKey
            The event triggered.
        """
        if event.keyval == Gdk.KEY_Escape:
            if self._search_term:
                self._search_entry.set_text("")
            else:
                GLib.idle_add(self.response, Gtk.ResponseType.CANCEL)

    def update_icon_preview_cb(self, dialog, preview):
        """Update the image preview when browsing for image files.

        Parameters
        ----------
        dialog : Gtk.FileChooserDialog
            The dialog to browser for images.
        preview : Gtk.Image
            The selected image in the dialog.
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
        """On brose button clicked.

        Parameters
        ----------
        widget : Gtk.Button
            The button clicked.
        dir_path : str, optional
            The path to a folder for the dialog to use as a start folder.
        """
        dialog = Gtk.FileChooserDialog(
            title=_("Choose an Icon"),
            action=Gtk.FileChooserAction.OPEN,
            transient_for=get_toplevel_window(self),
            use_header_bar=get_global("USE_HEADER_BARS_ON_DIALOGS"),
            buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                     _("_Select"), Gtk.ResponseType.OK)
        )

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

    def get_icon_size(self):
        """Get the pixel size to display icons in.

        Returns
        -------
        int
            Size to display icons in, in pixels.
        """
        return self._icon_size

    def get_search_term(self):
        """Get the string used for filtering icons by name.

        Returns
        -------
        str
            String used for filtering icons by name.
        """
        return self._search_term

    def get_selected_icon_name(self):
        """Get the name of the icon selected in the dialog.

        Returns
        -------
        str
            Name of the currently selected icon.
        """
        return self._selected_icon

    def set_icon_size(self, size):
        """Set the pixel size to display icons in.

        Dialog will not update the icon size once it has been shown.

        Parameters
        ----------
        size : int
            Size to display icons in, in pixels.

        Raises
        ------
        exceptions.WrongType
            Wrong value type.
        """
        if not type(size) == int:
            raise exceptions.WrongType("int", type(size).__name__)

        self._icon_size = size

    def set_search_term(self, filter_term):
        """Set the string used for filtering icons by name.

        Dialog will not update the filter term once it has been shown.

        Parameters
        ----------
        filter_term : str
            String used for filtering icons by name.

        Raises
        ------
        exceptions.WrongType
            Wrong value type.
        """
        if not type(filter_term) == str:
            raise exceptions.WrongType("str", type(filter_term).__name__)

        self._search_term = filter_term


class _IconChooserButton(Gtk.Button):
    """GTK + 3 Button to open dialog allowing selection of a themed icon.

    The name of the selected icon is emitted via the "icon-selected" signal
    once the dialog is closed, or via the get_selected_icon_name method.

    NOTE: The icon preview in the dialog and on the button may differ since
    icons can have a different appearance at different sizes.By default the
    dialog uses a larger size (32px) than the button (16px).
    set_dialog_icon_size(16) can be used to get the dialog to display the same
    icon that will be shown on the button, if you desire.

    Attributes
    ----------
    dialog : IconChooserDialog
        The icon chooser dialog.
    icon : str
        The icon name or path currently stored in a preference.
    """
    __gsignals__ = {
        "icon-selected": (GObject.SignalFlags.RUN_FIRST,
                          GObject.TYPE_NONE,
                          [GObject.TYPE_STRING])
    }

    __gproperties__ = {
        "icon": (str,
                 _("Icon"),
                 _("The string representing the icon."),
                 "",
                 GObject.ParamFlags.READWRITE | GObject.ParamFlags.EXPLICIT_NOTIFY)
    }

    def __init__(self, parent_widget):
        """Initialization.

        Parameters
        ----------
        parent_widget : IconChooser
            The main widget to which this widget is tied to.
        """
        super().__init__()
        GLib.threads_init()

        self._parent_widget = parent_widget
        self._timer = None
        self._main_app = None
        self._dialog_icon_size = 32
        self._search_term = ""
        self.icon = ""
        self.dialog = None

        self._icon = Gtk.Image.new()
        self.set_image(self._icon)

        self.connect("clicked", self._show_dialog)
        self.connect("destroy", self._on_destroy)

        GLib.idle_add(self.ensure_dialog)

    def _on_destroy(self, *args):
        """On widget destroy.

        Parameters
        ----------
        *args
            Arguments.
        """
        if self.dialog is not None:
            self.dialog.destroy()

    def do_get_property(self, prop):
        """Get property override.

        Parameters
        ----------
        prop : GObject.ParamSpec
            The property to handle.

        Returns
        -------
        str
            The icon string.

        Raises
        ------
        AttributeError
            Wrong attribute.
        """
        if prop.name == "icon":
            return getattr(self, prop.name)
        else:
            raise AttributeError(f"Unknown property '{prop.name}'")

    def do_set_property(self, prop, value):
        """Set property override.

        Parameters
        ----------
        prop : GObject.ParamSpec
            The property to handle.
        value : str
            The property value.

        Raises
        ------
        AttributeError
            Wrong attribute.
        """
        if prop.name == "icon":
            if value and value != self.icon:
                setattr(self, prop.name, value)
                self.set_icon(value)
        else:
            raise AttributeError(f"Unknown property '{prop.name}'")

    def ensure_dialog(self):
        """Ensure that the dialog is created once.

        Returns
        -------
        None
            Halt execution.
        """
        if self.dialog is not None:
            return

        self.dialog = IconChooserDialog(get_toplevel_window(self))

    def _set_icon(self, icon):
        """Set button icon.

        Parameters
        ----------
        icon : str
            The icon name or path.

        Returns
        -------
        bool
            Remove source.
        """
        if icon:
            # NOTE: Check for the existence of "/" first so os.path.isfile() is not
            # called unnecessarily.
            if "/" in icon and os.path.isfile(icon):
                valid, width, height = Gtk.icon_size_lookup(Gtk.IconSize.BUTTON)
                img = GdkPixbuf.Pixbuf.new_from_file_at_size(icon, width, height)
                self._icon.set_from_pixbuf(img)
            else:
                self._icon.set_from_icon_name(icon, Gtk.IconSize.BUTTON)

            self.icon = icon
            self.notify("icon")
            self.emit("icon-selected", self.icon)
        else:
            self._icon.set_from_icon_name("edit-find-symbolic", Gtk.IconSize.BUTTON)

        self._timer = None

        return GLib.SOURCE_REMOVE

    def set_icon(self, icon):
        """Set button icon.

        Parameters
        ----------
        icon : str
            The icon name or path.
        """
        if self._timer:
            GLib.source_remove(self._timer)

        self._timer = GLib.timeout_add(300, self._set_icon, icon)

    def _show_dialog(self, *args):
        """Called when the button is clicked to show a selection dialog.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.ensure_dialog()
        self.dialog.set_transient_for(get_toplevel_window(self))
        self.dialog.set_icon_size(self._dialog_icon_size)
        icon = self._parent_widget.get_value()
        self.dialog.set_search_term(icon if icon is not None else "")

        self.icon = self.dialog.run()

        if self.icon is not None:
            self.set_icon(self.icon)

        self.dialog.hide()

    def get_dialog_icon_size(self):
        """Get the pixel size to display icons in.

        Returns
        -------
        int
            Size to display icons in pixels.
        """
        return self._dialog_icon_size

    def get_search_term(self):
        """Get the string used for filtering icons by name.

        Returns
        -------
        str
            String used for filtering icons by name.
        """
        return self._search_term

    def get_selected_icon_name(self):
        """Get the name of the icon selected in the dialog.

        Returns
        -------
        str
            Name or path of the currently selected icon.
        """
        return self.icon

    def set_dialog_icon_size(self, size):
        """Set the pixel size to display icons in.

        Dialog will not update the icon size once it has been shown.

        Parameters
        ----------
        size : int
            The dialog icons size.

        Raises
        ------
        exceptions.WrongType
            Wrong value type.
        """
        if not type(size) == int:
            raise exceptions.WrongType("int", type(size).__name__)
        self._dialog_icon_size = size

    def set_search_term(self, search_term):
        """Set the string used for filtering icons by name.

        If use_regex is True, the provided string will be used as the pattern
        for a regex match, otherwise basic case-insensitive matching is used.

        Dialog will not update the filter term once it has been shown.

        Parameters
        ----------
        search_term : str
            String used for filtering icons by name.

        Raises
        ------
        exceptions.WrongType
            Wrong value type.
        """
        if not type(search_term) == str:
            raise exceptions.WrongType("str", type(search_term).__name__)
        self._search_term = search_term


GObject.type_register(_IconChooserButton)


class IconChooserButton(BaseGrid):
    """Icon chooser button.

    Attributes
    ----------
    button : _IconChooserButton
        The button.
    entry : Gtk.Entry
        The entry.
    parent_widget : SettingsWidgets.IconChooser
        The parent widget.

    TODO
    ----
    Improve the synchronization of all widget values. Between the entry changes triggering icon
    selection, icon selection triggering entry changes and Gtk.EntryCompletion triggering both;
    I barely can keep up with the synchronization mechanism. Sometimes the cursor moves itself to the
    beginning of the entry while typing.
    """

    def __init__(self, parent_widget):
        """Initialization.

        Parameters
        ----------
        parent_widget : SettingsWidgets.IconChooser
            The parent widget.
        """
        super().__init__(orientation=Gtk.Orientation.HORIZONTAL)
        self.set_spacing(0, 0)
        # Mark for deletion on EOL. Gtk4
        # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
        self.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED)

        self._main_app = get_global("MAIN_APP")
        self._timer = None
        self._completion = None
        self._setting_entry_text = False
        self.parent_widget = parent_widget
        self.entry = Gtk.Entry()
        self.entry.set_hexpand(True)
        self.button = _IconChooserButton(parent_widget)

        self.attach(self.entry, 0, 0, 1, 1)
        self.attach(self.button, 1, 0, 1, 1)

        self.entry.connect("changed", self.on_entry_changed)
        self.button.connect("icon-selected", self.on_icon_selected)

    def _on_entry_changed(self, widget):
        """On entry changed delayed.

        Parameters
        ----------
        widget : Gtk.Entry
            The changed entry.

        Returns
        -------
        bool
            Remove source.
        """
        if not self._completion and self._main_app.gtk_icon_theme_uptodate:
            self._completion = Gtk.EntryCompletion()
            # NOTE: Auto complete matches when navigation the completions popup.
            self._completion.set_inline_selection(True)
            # NOTE: Limit the width of the completions popupt to the width of the entry tied to it.
            self._completion.set_popup_set_width(True)
            # NOTE: The Gtk.ListStore were all icons are stored.
            self._completion.set_model(self._main_app.icon_chooser_icons_store)
            # NOTE: The second column of the Gtk.ListStorage is the one containing the icons. The
            # first one has the icons categories.
            self._completion.set_text_column(1)
            # NOTE: Trigger auto completions after typimng 3 or more characters.
            self._completion.set_minimum_key_length(3)
            widget.set_completion(self._completion)

        if not self._setting_entry_text:
            value = widget.get_text().strip()
            self.button.set_icon(value)
            self.parent_widget.set_value(value)

        self._timer = None

        return GLib.SOURCE_REMOVE

    def on_entry_changed(self, widget):
        """On entry changed.

        Parameters
        ----------
        widget : Gtk.Entry
            The changed entry.
        """
        if self._timer:
            GLib.source_remove(self._timer)

        self._timer = GLib.timeout_add(300, self._on_entry_changed, widget)

    def on_icon_selected(self, widget, icon):
        """On icon selected.

        Parameters
        ----------
        widget : _IconChooserButton
            The icon chooser button.
        icon : str
            The icon.
        """
        self._setting_entry_text = True

        if icon is not None:
            self.entry.set_text(icon)
            self.parent_widget.set_value(icon)

        self._setting_entry_text = False


class _IconPreview(BaseGrid):
    """Creates a preview box for icons containing the icon and its name.
    """

    def __init__(self, name, size):
        """Initialization.

        Parameters
        ----------
        name : str
            Icon name.
        size : int
            Icon size.
        """
        super().__init__(tooltip=name)
        self.set_hexpand(True)
        self.set_vexpand(True)

        self._icon_name = name

        icon = Gtk.Image.new_from_icon_name(name, Gtk.IconSize.DIALOG)
        # NOTE: Gtk.Image.new_from_icon_name seems to sometimes ignore the set size,
        # leading to inconsistent icon sizes. Solution is to force a size
        # using set_pixel_size.
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
        str
            Name of the icon.
        """
        return self._icon_name


if __name__ == "__main__":
    pass
