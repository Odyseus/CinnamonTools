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

    .. code::

        # Multi selection disabled.
        # Hidden applications not included.
        app_chooser = ApplicationChooserWidget(parent=None,
                                               multi_selection=False,
                                               show_no_display=False)
        # Open application chooser dialog.
        application = app_chooser.run()

        if application is not None:
            application.launch()

    .. code::

        # Multi selection enabled.
        # Hidden applications included.
        app_chooser = ApplicationChooserWidget(parent=None,
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
    multi_selection : bool
        Allow multi selection inside the applications list.
    selected_apps : list
        List of selected applications.
    show_no_display : bool
        Show hidden applications.
    tree_view : object
        See :py:class:`Gtk.TreeView`.
    """

    def __init__(self, parent=None, multi_selection=False, show_no_display=True):
        """Initialization.

        Parameters
        ----------
        parent : None, optional
            See :py:class:`Gtk.Window`.
        multi_selection : bool, optional
            Allow multi selection inside the applications list.
        show_no_display : bool, optional
            Show hidden applications.
        """
        super().__init__(self,
                         title=_("Application Chooser"),
                         use_header_bar=True,
                         transient_for=parent,
                         flags=Gtk.DialogFlags.MODAL)

        self.set_default_size(400, 500)
        self.multi_selection = multi_selection
        self.show_no_display = show_no_display

        content_box = self.get_content_area()
        content_box.set_property("margin", 8)
        content_box.set_spacing(8)
        content_box_grid = BaseGrid()
        content_box_grid.set_property("expand", True)
        content_box_grid.set_spacing(0, 5)
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

        if self.multi_selection:
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

        ok_button = self.add_button(_("_OK"), Gtk.ResponseType.OK)
        ok_button.connect("clicked", self.on_ok)

        self.add_button(_("_Cancel"), Gtk.ResponseType.CANCEL)

        self.selected_apps = []
        self.app_list = []

    def populate_app_list(self):
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

            return True if self.show_no_display else not x.get_nodisplay()

        self.app_list = list(filter(filter_list, Gio.AppInfo.get_all()))

        for i in range(0, len(self.app_list)):
            app = self.app_list[i]

            if not self.show_no_display and app.get_nodisplay():
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

        self.list_store.set_sort_column_id(0, Gtk.SortType.ASCENDING)

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
        self.populate_app_list()
        self.show_all()
        super().run()
        self.destroy()

        if self.selected_apps:
            if self.multi_selection:
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


class AppList(SettingsWidget):
    """Summary

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

    def __init__(self, label, dep_key=None, tooltip=""):
        """Initialization.

        Parameters
        ----------
        label : TYPE
            Description
        dep_key : None, optional
            Description
        tooltip : str, optional
            Description
        """
        super().__init__(dep_key=dep_key)
        self.label = label
        self._change_permitted = True
        self._columns = {
            "APPINFO": 0,
            "DISPLAY_NAME": 1,
            "ICON": 2
        }

        self.content_widget = Gtk.Button(label=label, valign=Gtk.Align.CENTER)
        self.attach(self.content_widget, 0, 0, 2, 1)
        self.content_widget.set_hexpand(True)

        self.set_tooltip_text(tooltip)

        self._app_store = Gtk.ListStore()
        self._app_store.set_column_types([Gio.AppInfo, GObject.TYPE_STRING, Gio.Icon])

    def open_applications_list(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        dialog = Gtk.Dialog(transient_for=self.get_toplevel(),
                            use_header_bar=True,
                            title=_("Applications list"),
                            flags=Gtk.DialogFlags.MODAL)

        content_area = dialog.get_content_area()
        content_area_grid = BaseGrid()
        content_area_grid.set_spacing(0, 0)
        content_area_grid.set_property("margin", 10)
        content_area.add(content_area_grid)

        self._change_permitted = False

        scrolled = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
        scrolled.set_size_request(width=300, height=300)
        scrolled.set_shadow_type(type=Gtk.ShadowType.IN)
        scrolled.set_policy(hscrollbar_policy=Gtk.PolicyType.NEVER,
                            vscrollbar_policy=Gtk.PolicyType.AUTOMATIC)
        content_area_grid.attach(scrolled, 0, 0, 1, 1)

        self._tree_view = Gtk.TreeView()
        self._tree_view.set_property("model", self._app_store)
        self._tree_view.set_property("expand", True)
        self._tree_view.get_selection().set_mode(Gtk.SelectionMode.MULTIPLE)

        app_column = Gtk.TreeViewColumn()
        app_column.set_property("title", _("Application"))
        app_column.set_property("expand", True)
        app_column.set_sort_column_id(self._columns["DISPLAY_NAME"])
        app_column.set_sort_indicator(True)

        icon_renderer = Gtk.CellRendererPixbuf()
        app_column.pack_start(icon_renderer, False)
        app_column.add_attribute(icon_renderer, "gicon", self._columns["ICON"])
        name_renderer = Gtk.CellRendererText()
        app_column.pack_start(name_renderer, True)
        app_column.add_attribute(name_renderer, "text", self._columns["DISPLAY_NAME"])
        self._tree_view.append_column(app_column)

        scrolled.add(self._tree_view)

        toolbar = Gtk.Toolbar()
        toolbar.set_icon_size(Gtk.IconSize.BUTTON)
        toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR)
        content_area_grid.attach(toolbar, 0, 1, 1, 1)

        new_button = Gtk.ToolButton()
        new_button.set_icon_name("bookmark-new-symbolic")
        new_button.set_label(_("Add Application"))
        new_button.set_is_important(True)
        new_button.connect("clicked", self._add_applications)
        toolbar.add(new_button)

        del_button = Gtk.ToolButton()
        del_button.set_icon_name("edit-delete-symbolic")
        del_button.set_tooltip_text(_("Remove selected applications"))
        del_button.connect("clicked", self._delete_selected_applications)
        toolbar.add(del_button)

        selection = self._tree_view.get_selection()

        def set_del_button_sensitive(sel):
            """Summary

            Parameters
            ----------
            sel : TYPE
                Description
            """
            del_button.set_sensitive(selection.count_selected_rows() != 0)

        selection.connect("changed", set_del_button_sensitive)
        del_button.set_sensitive(selection.count_selected_rows() != 0)

        self._change_permitted = True
        self.on_setting_changed()

        content_area.show_all()
        dialog.run()

        dialog.destroy()
        self.list_changed()

    def _add_applications(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        app_chooser = ApplicationChooserWidget(parent=self.get_toplevel(),
                                               multi_selection=True)
        app_chooser.set_label(_("Choose one or more applications (Hold Ctrl key)"))
        apps_info = app_chooser.run()

        if apps_info is not None and len(apps_info) > 0:
            self._change_permitted = False

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

            self._change_permitted = True

    def _delete_selected_applications(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self._change_permitted = False
        selection = self._tree_view.get_selection()
        tree_model, paths = selection.get_selected_rows()

        # Iterate in reverse so the right rows are removed. ¬¬
        for path in reversed(paths):
            tree_iter = tree_model.get_iter(path)
            tree_model.remove(tree_iter)

        self._change_permitted = True

    def list_changed(self):
        """Summary
        """
        data = set()

        for app in self._app_store:
            data.add(app[self._columns["APPINFO"]].get_id())

        self.set_value(list(data))

    def on_setting_changed(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.

        Returns
        -------
        None
            Halt execution.
        """
        if not self._change_permitted:
            # Ignore this notification, model is being modified outside
            return

        self._app_store.clear()

        current_applications = self.get_value()
        valid_applications = []

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

            valid_applications.append(id)

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

        if (len(valid_applications) != len(current_applications)):  # some items were filtered out
            self.set_value(valid_applications)

        # The following line auto sorts the list at start up!!! Finally!!!
        self._app_store.set_sort_column_id(self._columns["DISPLAY_NAME"], Gtk.SortType.ASCENDING)

    def connect_widget_handlers(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("clicked", self.open_applications_list)


class AppChooser(SettingsWidget):
    """Summary

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

        self.attach(self.label, 0, 0, 1, 1)
        self.attach(self.content_widget, 1, 0, 1, 1)

        self.set_tooltip_text(tooltip)

        if size_group:
            self.add_to_size_group(size_group)

        self.set_button_data()

    def open_app_chooser(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        app_chooser = ApplicationChooserWidget(parent=self.get_toplevel(),
                                               multi_selection=False)
        app_chooser.set_label(_("Choose an application"))
        app_info = app_chooser.run()

        if app_info is not None:
            self.on_app_selected(app_info.get_id())

    def on_app_selected(self, apps_id):
        """Summary

        Parameters
        ----------
        apps_id : TYPE
            Description
        """
        self.set_value(apps_id)
        self.on_setting_changed()

    def set_button_data(self, image=None, label=_("No app chosen"), extra_info=""):
        """Summary

        Parameters
        ----------
        image : None, optional
            Description
        label : TYPE, optional
            Description
        extra_info : str, optional
            Description
        """
        if image is None:
            image = Gtk.Image.new_from_gicon(
                Gio.Icon.new_for_string("image-missing"), Gtk.IconSize.BUTTON)

        self.content_widget.set_image(image)
        self.content_widget.set_label(label)
        self.content_widget.set_tooltip_text(label + extra_info)

    def on_setting_changed(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        try:
            app_info = Gio.DesktopAppInfo.new(self.get_value())
        except Exception:
            app_info = None

        if isinstance(app_info, Gio.DesktopAppInfo):
            extra_info = "\n%s" % app_info.get_id()
            label = app_info.get_display_name()

            try:
                image = Gtk.Image.new_from_gicon(app_info.get_icon(), Gtk.IconSize.BUTTON)
            except Exception:
                image = Gtk.Image.new_from_gicon(
                    Gio.Icon.new_for_string("image-missing"), Gtk.IconSize.BUTTON)
            self.set_button_data(image=image, label=label, extra_info=extra_info)
        else:
            self.set_button_data()

    def connect_widget_handlers(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.content_widget.connect("clicked", self.open_app_chooser)


if __name__ == "__main__":
    pass
