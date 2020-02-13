#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Applications chooser widgets.
"""
import gi

gi.require_version("Gtk", "3.0")

from gi.repository import GObject
from gi.repository import Gio
from gi.repository import Gtk

from .SettingsWidgets import SettingsLabel
from .SettingsWidgets import SettingsWidget
from .common import BaseGrid
from .common import _


class ApplicationChooserWidget(Gtk.Dialog):
    """Application chooser widget.

    Source: https://stackoverflow.com/a/41985006

    Provides a dialog to select an application from all those installed. The regular
    :py:class:`Gtk.AppChooserDialog` does not seem to provide any way to allow selection from all
    installed applications, so this dialog serves as a replacement.

    Example
    -------

    .. code:: python

        # Multi selection disabled.
        # Hidden applications not included.
        app_chooser = ApplicationChooserWidget(transient_for=None,  # Set accordingly.
                                               multi_selection=False,
                                               show_no_display=False)
        # Open application chooser dialog.
        application = app_chooser.run()

        if application is not None:
            application.launch()

    .. code:: python

        # Multi selection enabled.
        # Hidden applications included.
        app_chooser = ApplicationChooserWidget(transient_for=None,  # Set accordingly.
                                               multi_selection=True,
                                               show_no_display=True)
        # Open application chooser dialog.
        applications = app_chooser.run()

        if applications is not None and len(applications) > 0:
            for app in applications:
                print(app.get_id())

    Attributes
    ----------
    app_list : list
        The list of all installed applications.
    label : str
        A string used as a title for the applications chooser dialog.
    list_store : object
        See :py:class:`Gtk.ListStore`.
    selected_apps : list
        List of selected applications.
    tree_view : object
        See :py:class:`Gtk.TreeView`.
    """

    def __init__(self, transient_for=None, multi_selection=False, show_no_display=True):
        """Initialization.

        Parameters
        ----------
        transient_for : None, optional
            See :py:class:`Gtk.Window`.
        multi_selection : bool, optional
            Allow multi selection inside the applications list.
        show_no_display : bool, optional
            Show hidden applications.
        """
        super().__init__(title=_("Application Chooser"),
                         use_header_bar=True,
                         transient_for=transient_for,
                         flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
                         buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                                  _("_OK"), Gtk.ResponseType.OK))
        self.set_size_request(400, 500)
        self._multi_selection = multi_selection
        self._show_no_display = show_no_display

        self._headerbar = self.get_header_bar()
        content_box = self.get_content_area()
        content_box_grid = BaseGrid()
        content_box_grid.set_property("expand", True)
        content_box_grid.set_spacing(0, 6)
        content_box.add(content_box_grid)

        # Can be programmatically changed if needed.
        self.label = Gtk.Label(_("Choose an application"))
        content_box_grid.attach(self.label, 0, 0, 1, 1)

        self.list_store = Gtk.ListStore()
        # Switched from [str, str, int] model to the current one because I was
        # having a lot of missing icons for applications.
        self.list_store.set_column_types([GObject.TYPE_STRING, Gio.Icon, GObject.TYPE_INT])

        pixbuf_renderer = Gtk.CellRendererPixbuf()
        text_renderer = Gtk.CellRendererText()
        icon_column = Gtk.TreeViewColumn()
        icon_column.pack_start(pixbuf_renderer, False)
        icon_column.add_attribute(pixbuf_renderer, "gicon", 1)
        text_column = Gtk.TreeViewColumn("text", text_renderer, text=0)

        self.tree_view = Gtk.TreeView()

        if self._multi_selection:
            self.tree_view.get_selection().set_mode(Gtk.SelectionMode.MULTIPLE)
        else:
            self.tree_view.get_selection().set_mode(Gtk.SelectionMode.SINGLE)

        self.tree_view.set_model(self.list_store)
        self.tree_view.set_headers_visible(False)
        self.tree_view.append_column(icon_column)
        self.tree_view.append_column(text_column)

        scroll_window = Gtk.ScrolledWindow()
        scroll_window.set_property("expand", True)
        scroll_window.set_shadow_type(type=Gtk.ShadowType.IN)
        scroll_window.add(self.tree_view)
        content_box_grid.attach(scroll_window, 0, 1, 1, 1)

        self._ok_button = self.get_widget_for_response(Gtk.ResponseType.OK)

        self._ok_button.connect("clicked", self.on_ok)
        self.tree_view.connect("row-activated", self.on_ok)
        self.tree_view.get_selection().connect("changed", self._update_ok_button_sensitivity)

        self.selected_apps = []
        self.app_list = []

        self._update_ok_button_sensitivity()

    def _update_ok_button_sensitivity(self, *args):
        """Update OK button sensitivity.

        Parameters
        ----------
        *args
            Arguments.
        """
        tree_model, paths = self.tree_view.get_selection().get_selected_rows()
        self._ok_button.set_sensitive(len(paths) != 0)

    def _populate_app_list(self):
        """Populate the list of applications with all installed applications.

        <strikethrough>Icons are provided by icon-name, however some applications may return a full
        path to a custom icon rather than a themed-icon name, or even no name
        at all. In these cases the generic "gtk-missing-icon" icon is used.</strikethrough>

        NOTE: (by Odyseus) I switched to a :py:class:`Gio.Icon`. Simply because that's what
        :py:class:`Gio.AppInfo` provides and the icon is practically guaranteed to show up
        be it a named icon or a path to an image.
        """
        # I added this filter because there are more that 200 screen savers in Linux Mint. ¬¬
        # They were unnecessarily slowing the heck out the loading of the list of applications.
        # At this point in time, none of the tweaks that makes use of this ApplicationChooserWidget
        # would require to choose a screen saver from the list, so I happily ignore them for now.
        def filter_list(x):
            """Filter application list.

            Parameters
            ----------
            x : :py:class:`Gio.DesktopAppInfo`
                The applicaction to filter.

            Returns
            -------
            bool
                If the application should be included in the list of applications.
            """
            lowered = str(x.get_id()).lower()

            # I think that is more precise to check the start of the app ID. (?)
            # The following condition filters out all .desktop files that
            # are inside a folders called "screensavers" and "kde4".
            if lowered.startswith("screensavers-") or lowered.startswith("kde4-"):
                return False

            return True if self._show_no_display else not x.get_nodisplay()

        self.app_list = list(filter(filter_list, Gio.AppInfo.get_all()))
        count = 0

        for i, app in enumerate(self.app_list):
            if not self._show_no_display and app.get_nodisplay():
                continue

            gio_icon = app.get_icon()

            if gio_icon:
                app_icon = gio_icon
            else:
                app_icon = Gio.Icon.new_for_string("image-missing")

            app_name = app.get_display_name()
            iter = self.list_store.append()
            self.list_store.set(iter,
                                [0, 1, 2],
                                [app_name, app_icon, i])
            count += 1

        self.list_store.set_sort_column_id(0, Gtk.SortType.ASCENDING)
        self._headerbar.set_subtitle(_("Total applications") + ": " + str(count))

    def run(self):
        """Run the dialog to get a selected application/s.

        Returns
        -------
        list
            All selected applications.
        :py:class:`Gio.AppInfo`
            One selected application.
        None
            No selected applications.
        """
        self._populate_app_list()
        self.show_all()
        response = super().run()

        if response == Gtk.ResponseType.OK and self.selected_apps:
            if self._multi_selection:
                return self.selected_apps
            else:
                return self.selected_apps[0]

        return None

    def set_label(self, text):
        """Set the label text, "Application Chooser" by default.

        Parameters
        ----------
        text : str
            String for the dialog title.
        """
        self.label.set_text(text)

    def on_ok(self, *args):
        """Get :py:class:`Gio.AppInfo` of selected applications when user presses OK.

        Parameters
        ----------
        *args
            Arguments.
        """
        selection = self.tree_view.get_selection()
        tree_model, paths = selection.get_selected_rows()

        for path in paths:
            tree_iter = tree_model.get_iter(path)
            app_index = tree_model.get_value(tree_iter, 2)
            self.selected_apps.append(self.app_list[app_index])

        self.response(Gtk.ResponseType.OK)


class AppList(SettingsWidget):
    """Summary

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    content_widget : TYPE
        Description
    label : str
        Widget text.
    """
    bind_dir = None
    _columns = {
        "APPINFO": 0,
        "DISPLAY_NAME": 1,
        "ICON": 2
    }

    def __init__(self, label, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : str
            Widget text.
        dep_key : None, optional
            Dependency key/s.
        tooltip : str, optional
            Widget tooltip.
        """
        super().__init__(dep_key=dep_key)
        self.label = label
        self.content_widget = Gtk.Button(label=label, valign=Gtk.Align.CENTER)
        self.content_widget.set_hexpand(True)
        self.attach(self.content_widget, 0, 0, 2, 1)

        self.set_tooltip_text(tooltip)

        self._app_store = Gtk.ListStore()
        self._app_store.set_column_types([Gio.AppInfo, GObject.TYPE_STRING, Gio.Icon])

    def _open_applications_list(self, *args):
        """Open applications list.

        Parameters
        ----------
        *args
            Arguments.
        """
        dialog = Gtk.Dialog(transient_for=self.get_toplevel(),
                            use_header_bar=True,
                            title=_("Applications list"),
                            flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT)

        content_area = dialog.get_content_area()
        content_area_grid = BaseGrid()
        content_area.add(content_area_grid)

        label = Gtk.Label(_("Duplicated entries will be automatically removed"))
        label.set_margin_bottom(6)
        content_area_grid.attach(label, 0, 0, 1, 1)

        scrolled = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
        scrolled.set_size_request(width=300, height=300)
        scrolled.set_shadow_type(type=Gtk.ShadowType.IN)
        scrolled.set_policy(hscrollbar_policy=Gtk.PolicyType.NEVER,
                            vscrollbar_policy=Gtk.PolicyType.AUTOMATIC)
        content_area_grid.attach(scrolled, 0, 1, 1, 1)

        tree_view = Gtk.TreeView()
        tree_view.set_model(self._app_store)
        tree_view.set_property("expand", True)
        tree_view.get_selection().set_mode(Gtk.SelectionMode.MULTIPLE)

        app_column = Gtk.TreeViewColumn()
        app_column.set_title(_("Application"))
        app_column.set_property("expand", True)
        app_column.set_sort_column_id(self._columns["DISPLAY_NAME"])
        app_column.set_sort_indicator(True)

        icon_renderer = Gtk.CellRendererPixbuf()
        app_column.pack_start(icon_renderer, False)
        app_column.add_attribute(icon_renderer, "gicon", self._columns["ICON"])
        name_renderer = Gtk.CellRendererText()
        app_column.pack_start(name_renderer, True)
        app_column.add_attribute(name_renderer, "text", self._columns["DISPLAY_NAME"])
        tree_view.append_column(app_column)

        scrolled.add(tree_view)

        toolbar = Gtk.Toolbar()
        toolbar.set_icon_size(Gtk.IconSize.MENU)
        toolbar.set_hexpand(True)
        toolbar.set_halign(Gtk.Align.FILL)
        toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR)
        content_area_grid.attach(toolbar, 0, 2, 1, 1)

        button_holder = Gtk.ToolItem()
        button_holder.set_expand(True)
        toolbar.add(button_holder)
        buttons_box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        buttons_box.set_halign(Gtk.Align.CENTER)
        button_holder.add(buttons_box)

        new_button = Gtk.ToolButton()
        new_button.set_icon_name("list-add-symbolic")
        new_button.set_tooltip_text(_("Add Applications"))
        new_button.connect("clicked", self._add_applications)
        buttons_box.add(new_button)

        del_button = Gtk.ToolButton()
        del_button.set_icon_name("edit-delete-symbolic")
        del_button.set_tooltip_text(_("Remove selected applications"))
        del_button.connect("clicked", self._delete_selected_applications, tree_view)
        buttons_box.add(del_button)

        selection = tree_view.get_selection()

        def set_del_button_sensitive(sel):
            """Set delete button sensitivity.

            Parameters
            ----------
            sel : object
                See :py:class:`Gtk.TreeSelection`.
            """
            del_button.set_sensitive(sel.count_selected_rows() != 0)

        selection.connect("changed", set_del_button_sensitive)
        del_button.set_sensitive(selection.count_selected_rows() != 0)

        self._populate_app_list()

        content_area.show_all()
        dialog.run()

        dialog.destroy()
        self._list_changed()

    def _populate_app_list(self, *args):
        """Populate applications list.

        Parameters
        ----------
        *args
            Arguments.
        """
        self._app_store.clear()

        # NOTE: list(set()) in case that there are duplicated entries added externally.
        current_applications = list(set(self.get_value()))
        valid_applications = set()

        for id in current_applications:
            # Needed just in case there is an application in the list and then
            # that application is uninstalled.
            # If the application doesn't exists anymore, the first dialog
            # will fail to open.
            try:
                app_info = Gio.DesktopAppInfo.new(id)
            except Exception:
                app_info = None

            if not app_info:
                continue

            valid_applications.add(id)

            iter = self._app_store.append()

            self._app_store.set(iter, [
                self._columns["APPINFO"],
                self._columns["ICON"],
                self._columns["DISPLAY_NAME"]
            ], [
                app_info,
                app_info.get_icon(),
                app_info.get_display_name()
            ])

        # NOTE: Sets comparison.
        if (valid_applications != set(current_applications)):  # some items were filtered out
            self.set_value(list(valid_applications))

        # The following line auto sorts the list at start up!!! Finally!!!
        self._app_store.set_sort_column_id(self._columns["DISPLAY_NAME"], Gtk.SortType.ASCENDING)

    def _add_applications(self, *args):
        """Add applications.

        Parameters
        ----------
        *args
            Arguments.
        """
        app_chooser = ApplicationChooserWidget(transient_for=self.get_toplevel(),
                                               multi_selection=True)
        app_chooser.set_label(_("Choose one or more applications (Hold Ctrl key)"))
        apps_info = app_chooser.run()
        app_chooser.destroy()

        if apps_info is not None and len(apps_info) > 0:
            for a_i in apps_info:
                iter = self._app_store.append()

                self._app_store.set(iter, [
                    self._columns["APPINFO"],
                    self._columns["ICON"],
                    self._columns["DISPLAY_NAME"]
                ], [
                    a_i,
                    a_i.get_icon(),
                    a_i.get_display_name()
                ])

    def _delete_selected_applications(self, widget, tree):
        """Delete selected applications.

        Parameters
        ----------
        widget : TYPE
            Description
        tree : TYPE
            Description
        """
        selection = tree.get_selection()
        tree_model, paths = selection.get_selected_rows()

        # Iterate in reverse so the right rows are removed. ¬¬
        for path in reversed(paths):
            tree_iter = tree_model.get_iter(path)
            tree_model.remove(tree_iter)

    def _list_changed(self):
        """List changed.
        """
        # NOTE: Use of set() to avoid storing duplicated apps.
        data = set()

        for app in self._app_store:
            data.add(app[self._columns["APPINFO"]].get_id())

        self.set_value(list(data))

    def on_setting_changed(self, *args):
        """See :any:`JSONSettingsBackend.on_setting_changed`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self._populate_app_list()

    def connect_widget_handlers(self, *args):
        """See :any:`JSONSettingsBackend.connect_widget_handlers`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("clicked", self._open_applications_list)


class AppChooser(SettingsWidget):
    """Widget to store an application.

    Attributes
    ----------
    bind_dir : int
        See :py:class:`Gio.SettingsBindFlags`.
    content_widget : TYPE
        Description
    label : TYPE
        Description
    """
    bind_dir = None

    def __init__(self, label, size_group=None, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : TYPE
            Description
        size_group : None, optional
            Description
        dep_key : None, optional
            Description
        tooltip : str, optional
            Description
        """
        super().__init__(dep_key=dep_key)

        self.label = SettingsLabel(label)
        self.label.set_hexpand(True)
        self.content_widget = Gtk.Button(valign=Gtk.Align.CENTER)
        self.content_widget.set_always_show_image(True)

        self._clear_button = Gtk.Button(image=Gtk.Image.new_from_icon_name(
            "edit-clear-symbolic",
            Gtk.IconSize.BUTTON
        ))
        self._clear_button.set_tooltip_text(_("Clear application"))
        self._clear_button.set_valign(Gtk.Align.CENTER)

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self._clear_button, 1, 0, 1, 1)
        self.attach(self.content_widget, 2, 0, 1, 1)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

        self._set_button_data()

    def _on_clear_button_clicked(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.set_value("")
        self._set_button_data()

    def _open_app_chooser(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        app_chooser = ApplicationChooserWidget(transient_for=self.get_toplevel(),
                                               multi_selection=False)
        app_chooser.set_label(_("Choose an application"))
        app_info = app_chooser.run()
        app_chooser.destroy()

        if app_info is not None:
            self._on_app_selected(app_info.get_id())

    def _on_app_selected(self, apps_id):
        """Summary

        Parameters
        ----------
        apps_id : TYPE
            Description
        """
        self.set_value(apps_id)
        self._set_button_data()

    def _set_button_data(self):
        """Summary
        """
        image = Gtk.Image.new_from_gicon(
            Gio.Icon.new_for_string("image-missing"), Gtk.IconSize.BUTTON)
        label = _("No app chosen")
        extra_info = ""

        try:
            app_info = Gio.DesktopAppInfo.new(self.get_value())
        except Exception:
            app_info = None

        if isinstance(app_info, Gio.DesktopAppInfo):
            try:
                label = app_info.get_display_name()
                extra_info = "\n%s" % app_info.get_id()
                image = Gtk.Image.new_from_gicon(app_info.get_icon(), Gtk.IconSize.BUTTON)
            except Exception:
                pass

        self.content_widget.set_image(image)
        self.content_widget.set_label(label)
        self.content_widget.set_tooltip_text(label + extra_info)

    def on_setting_changed(self, *args):
        """See :any:`JSONSettingsBackend.on_setting_changed`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self._set_button_data()

    def connect_widget_handlers(self, *args):
        """See :any:`JSONSettingsBackend.connect_widget_handlers`.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("clicked", self._open_app_chooser)
        self._clear_button.connect("clicked", self._on_clear_button_clicked)


if __name__ == "__main__":
    pass
