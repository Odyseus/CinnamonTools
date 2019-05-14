#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Cinnamon's xlets settings re-implementation.

Attributes
----------
CINNAMON_VERSION : str
    Cinnamon version.
proxy : Gio.DBusProxy
    DBus proxy.
XLET_SETTINGS_WIDGETS : dict
    Settings widgets map.
"""
import cgi
import gi
import json
import os

gi.require_version("Gtk", "3.0")
gi.require_version("Gdk", "3.0")

from gi.repository import GLib
from gi.repository import Gdk
from gi.repository import Gio
from gi.repository import Gtk
from gi.repository import Pango
from subprocess import check_output
from subprocess import run

from .JsonSettingsWidgets import *  # noqa
from .common import BaseGrid
from .common import HOME
from .common import _
from .common import compare_version

module_path = os.path.dirname(os.path.abspath(__file__))

CINNAMON_VERSION = check_output(
    ["cinnamon", "--version"]
).decode("utf-8").splitlines()[0].split(" ")[1]

proxy = None

XLET_SETTINGS_WIDGETS = {
    # NOTE: Custom simplified widget.
    "button": "JSONSettingsButton",
    "colorchooser": "JSONSettingsColorChooser",
    "combobox": "JSONSettingsComboBox",
    "entry": "JSONSettingsEntry",
    "filechooser": "JSONSettingsFileChooser",
    "iconfilechooser": "JSONSettingsIconChooser",
    "keybinding": "JSONSettingsKeybinding",
    "keybinding-with-options": "JSONSettingsKeybindingWithOptions",
    "list": "JSONSettingsList",
    "spinbutton": "JSONSettingsSpinButton",
    "switch": "JSONSettingsSwitch",
    "textview": "JSONSettingsTextView",
    # "datechooser": "JSONSettingsDateChooser",
    # "effect": "JSONSettingsEffectChooser",
    # "fontchooser": "JSONSettingsFontButton",
    # "scale": "JSONSettingsRange",
    # "soundfilechooser": "JSONSettingsSoundFileChooser",
    # "tween": "JSONSettingsTweenChooser",
}


class SettingsBox(BaseGrid):
    """Settings box.

    Attributes
    ----------
    stack_switcher : Gtk.StackSwitcher
        The Gtk.StackSwitcher used to switch pages.
    """

    def __init__(self, pages_definition=[], settings={}, xlet_instance_id="",
                 xlet_uuid="", app_window=None):
        """Initialization.

        Parameters
        ----------
        pages_definition : list, optional
            The list containing the data to generate all window widgets.
        settings : dict, optional
            <class "JSONSettingsHandler">
        xlet_instance_id : str, optional
            The instance ID of an xlet.
        xlet_uuid : str, optional
            The xlet UUID.
        app_window : None, optional
            <class "Gtk.ApplicationWindow">.
        """
        BaseGrid.__init__(self)
        self.set_border_width(0)
        self.set_spacing(0, 0)
        self.set_property("expand", True)
        self.set_property("margin", 0)

        stack = Gtk.Stack()
        stack.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT_RIGHT)
        stack.set_transition_duration(150)
        stack.set_property("margin", 0)
        stack.set_property("expand", True)

        create_stack_switcher = len(pages_definition) > 1
        page_count = 0

        for page_def in pages_definition:
            # NOTE: Possibility to hide entire pages depending on a condition defined in
            # the widgets definition file.
            if not page_def.get("compatible", True):
                continue

            page_scrolled_window = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
            page_scrolled_window.set_policy(hscrollbar_policy=Gtk.PolicyType.NEVER,
                                            vscrollbar_policy=Gtk.PolicyType.AUTOMATIC)
            page_scrolled_window.set_shadow_type(type=Gtk.ShadowType.ETCHED_IN)
            page = BaseGrid()
            page.set_spacing(15, 15)
            page.set_property("expand", True)
            page.set_property("margin", 15)
            page.set_border_width(0)
            page_scrolled_window.add(page)

            section_count = 0

            for section_def in page_def["sections"]:
                # NOTE: Possibility to hide entire sections depending on a condition defined in
                # the widgets definition file.
                if not section_def.get("compatible", True):
                    continue

                section_container = SectionContainer(  # noqa
                    section_def.get("section-title", ""),
                    section_def.get("section-info", {}),
                )
                section_widgets = section_def["widgets"]

                for i in range(0, len(section_widgets)):
                    widget_def = section_widgets[i]

                    # NOTE: Possibility to hide individual widgets depending on a condition defined in
                    # the widgets definition file.
                    if not widget_def.get("compatible", True):
                        continue

                    if widget_def["widget-type"] == "label":
                        widget = Text(**widget_def["args"])  # noqa
                    elif widget_def["widget-type"] in XLET_SETTINGS_WIDGETS:
                        widget_def["args"]["settings"] = settings
                        widget = globals()[XLET_SETTINGS_WIDGETS[widget_def["widget-type"]]](
                            **widget_def["args"])
                        if widget_def["widget-type"] == "list" and app_window is not None:
                            widget.app_window = app_window
                    else:
                        continue

                    if widget_def["widget-type"] == "list":
                        widget.fill_row()
                    else:
                        widget.set_border_width(5)
                        widget.set_margin_left(15)
                        widget.set_margin_right(15)

                    if widget_def["widget-type"] == "button":
                        col_span = 2
                    else:
                        col_span = 1

                    if "dependency" in widget_def["args"].get("properties", []):
                        revealer = JSONSettingsRevealer(  # noqa
                            settings, widget_def["args"]["properties"]["dependency"])
                        section_container.add_reveal_row(
                            widget, 0, i + 1, col_span, 1, revealer=revealer)
                    else:
                        section_container.add_row(widget, 0, i + 1, col_span, 1)

                page.attach(section_container, 0, section_count, 1, 1)
                section_count += 1

            page_count += 1
            stack.add_titled(page_scrolled_window, "stack_id_%d" %
                             page_count, page_def["page-title"])

            if page_def.get("page-icon"):
                stack.child_set_property(page_scrolled_window, "icon-name", page_def["page-icon"])

        if create_stack_switcher:
            self.stack_switcher = Gtk.StackSwitcher()
            self.stack_switcher.set_stack(stack)
            self.stack_switcher.set_halign(Gtk.Align.CENTER)
            self.stack_switcher.set_homogeneous(False)
        else:
            self.stack_switcher = None

        self.add(stack)

        self.show_all()

    def get_stack_switcher(self):
        """Get stack switcher.

        Returns
        -------
        Gtk.StackSwitcher
            The Gtk.StackSwitcher used to switch pages.
        """
        return self.stack_switcher


class MainApplication(Gtk.Application):
    """Main application.

    Attributes
    ----------
    application_base_id : str
        A base application ID that will be used to generate the real application ID.
    application_title : str
        A custom application title.
    current_selected_tab : str
        The name of the currently selected stack.
    display_settings_handling : bool
        Whether to display settings handler item in the header bar menu.
    help_file_path : str
        Path to the xlet help file.
    pages_definition : list
        The list containing the data to generate all window widgets.
    required_args : set
        Required arguments.
    settings : object
        <class "JSONSettingsHandler">.
    win_current_height : int
        Window current height.
    win_current_width : int
        Window current width.
    win_initial_height : int
        Window initial height.
    win_initial_width : int
        Window initial width.
    win_is_maximized : bool
        Whether the window is maximized.
    win_state_cache_file : str
        Path to the file where the window state is stored.
    window : object
        <class "Gtk.ApplicationWindow">.
    xlet_dir : str
        Path to where the xlet is installed.
    xlet_help_file_exists : bool
        Whether the HELP.html file inside an xlet directory exist.
    xlet_instance_id : str
        The instance ID of an xlet.
    xlet_meta : dict
        An xlet metadata as found inside its metadata.json file plus the added
        xlet path.
    xlet_type : str
        The type of xlet.
    xlet_uuid : str
        The xlet UUID.
    """
    required_args = {
        "application_base_id",
        "pages_definition",
        "xlet_instance_id",
        "xlet_type",
        "xlet_uuid",
    }

    def __init__(self, **kwargs):
        """Initialization.

        Parameters
        ----------
        **kwargs
            Keyword arguments.

        Raises
        ------
        SystemExit
            Halt execution if missing required arguments.
        """
        kwargs_keys = set(kwargs.keys())

        if not self.required_args.issubset(kwargs_keys):
            raise SystemExit("Missing required arguments: %s" %
                             ", ".join(list(self.required_args.difference(kwargs_keys))))

        self.application_base_id = ""
        self.display_settings_handling = True
        self.application_title = ""
        self.pages_definition = []
        self.win_initial_height = 600
        self.win_initial_width = 800
        self.xlet_dir = ""
        self.xlet_instance_id = ""
        self.xlet_type = ""
        self.xlet_uuid = ""

        for key, value in kwargs.items():
            setattr(self, key, value)

        self.load_xlet_data_and_instance()

        GLib.set_application_name(self._get_application_title())

        super().__init__(
            application_id=self._get_application_id(),
            flags=Gio.ApplicationFlags.FLAGS_NONE,
        )

        self.load_css()

    def load_css(self):
        """Summary
        """
        css_provider = Gtk.CssProvider()
        # css_provider.load_from_path(
        #     os.path.join(XLET_DIR, "stylesheet.css"))
        # Loading from data so I don't have to deal with a style sheet file
        # with just a couple of lines of code.
        css_provider.load_from_data(str.encode(
            """
            .cinnamon-xlet-settings-section-information-button:hover,
            .cinnamon-xlet-settings-section-information-button {
                padding: 0;
            }
            """
        ))

        screen = Gdk.Screen.get_default()
        context = Gtk.StyleContext()
        context.add_provider_for_screen(screen, css_provider,
                                        Gtk.STYLE_PROVIDER_PRIORITY_USER)

    def _get_application_title(self):
        """Get application title.

        Returns
        -------
        str
            The application title.
        """
        if self.application_title:
            title_text = self.application_title
        else:
            title_text = _("Settings for %s") % _(self.xlet_meta["name"])

        return title_text

    def _get_application_id(self):
        """Get application ID.

        Returns
        -------
        str
            The application ID.
        """
        return "%s-%s" % (self.application_base_id, (self.xlet_instance_id or "unique"))

    def _on_proxy_ready(self, obj, result, data=None):
        """Define proxy on proxy ready.

        Parameters
        ----------
        obj : object
            <class "Gio.DBusProxy">.
        result : object
            <class "Gio.Task">.
        data : None, optional
            User data.
        """
        global proxy
        proxy = Gio.DBusProxy.new_for_bus_finish(result)

        if not proxy.get_name_owner():
            proxy = None

        if proxy:
            # Mark for deletion on EOL. Cinnamon 3.2.x+
            # Remove call to proxy.highlightApplet. Which isn't very useful anyways.
            try:
                proxy.highlightXlet("(ssb)", self.xlet_uuid, self.xlet_instance_id, True)
            except Exception:
                proxy.highlightApplet("(ss)", self.xlet_uuid, self.xlet_instance_id)

    def do_activate(self, *args):
        """Do activate.

        Parameters
        ----------
        *args : object, optional
            Arguments.
        """
        self.window.present()

    def do_startup(self, *args):
        """Do startup.

        Parameters
        ----------
        *args : object, optional
            Arguments.
        """
        Gtk.Application.do_startup(self)
        self._load_window_state()
        self._buildUI()

    def on_size_allocate_cb(self, window, *args):
        """Save window state and size in size-allocate signal.

        Parameters
        ----------
        window : object
            <class "Gtk.ApplicationWindow">.
        *args : object
            Arguments.
        """
        if not window.is_maximized():
            win_width, win_height = window.get_size()
            self.win_current_width = win_width
            self.win_current_height = win_height

        # NOTE: Using the event.new_window_state & Gdk.WindowState.MAXIMIZED
        # check in on_window_state_event_cb will not save the maximized state
        # when maximizing the window and then closing it, unless the window
        # is first unfocused and refocused.
        # Are you F*CKING KIDING ME!?!?!?!
        # SO, save the maximized state EVERY SINGLE F*CKING time size-allocate
        # is triggered and move the F*CK on!!!!
        self.win_is_maximized = window.is_maximized()

    def on_window_state_event_cb(self, window, event):
        """Save window state in window-state-event signal.

        Parameters
        ----------
        window : object
            <class "Gtk.ApplicationWindow">.
        event : object
            <class "Gdk.EventWindowState">.
        """
        if event.new_window_state & Gdk.WindowState.MAXIMIZED:
            self.win_is_maximized = window.is_maximized()

    def _store_window_state(self):
        """Store window state to file.
        """
        try:
            os.makedirs(os.path.dirname(self.win_state_cache_file), exist_ok=True)

            with open(self.win_state_cache_file, "w+") as state_file:
                json.dump({
                    "width": self.win_current_width,
                    "height": self.win_current_height,
                    "is_maximized": self.win_is_maximized,
                    "selected_tab": self.current_selected_tab
                }, state_file)
        except Exception as e:
            print(e)

    def _load_window_state(self):
        """Load window state from file.
        """
        default_state = {
            "width": self.win_initial_width,
            "height": self.win_initial_height,
            "is_maximized": False,
            "selected_tab": "stack_id_1"
        }
        self.win_state_cache_file = os.path.join(
            GLib.get_user_cache_dir(), self._get_application_id(), "state.json")

        if os.path.isfile(self.win_state_cache_file):
            try:
                with open(self.win_state_cache_file) as state_file:
                    state_data = json.loads(state_file.read())
            except Exception as e:
                print(e)
                state_data = default_state
        else:
            state_data = default_state

        self.win_current_width = state_data.get("width", default_state["width"])
        self.win_current_height = state_data.get("height", default_state["height"])
        self.win_is_maximized = state_data.get("is_maximized", default_state["is_maximized"])
        self.current_selected_tab = state_data.get("selected_tab", default_state["selected_tab"])

    def _buildUI(self):
        """Build UI.
        """
        self.window = Gtk.ApplicationWindow(application=self,
                                            title=self._get_application_title())
        self.window.set_type_hint(Gdk.WindowTypeHint.NORMAL)
        # NOTE: Always use set_default_size(). Otherwise, when exiting maximized
        # state, the window will be resized to its minimum size instead of its
        # previous size.
        self.window.set_default_size(
            self.win_current_width or self.win_initial_width,
            self.win_current_height or self.win_initial_height
        )

        if self.win_is_maximized:
            self.window.maximize()
        else:
            self.window.set_position(Gtk.WindowPosition.CENTER)

        icon_path = os.path.join(self.xlet_dir, "icon.svg")

        if not os.path.isfile(icon_path):
            icon_path = os.path.join(self.xlet_dir, "icon.png")

        if os.path.isfile(icon_path):
            self.window.set_icon_from_file(icon_path)

        settings_box = SettingsBox(pages_definition=self.pages_definition,
                                   settings=self.settings,
                                   xlet_instance_id=self.xlet_instance_id,
                                   xlet_uuid=self.xlet_uuid,
                                   app_window=self.window)

        # NOTE: I tested several layouts for the header.
        # The current in use is the "less worse" that I could come up with. ¬¬
        # Set the stack switcher as a custom title using set_custom_title. Then
        # add a Gtk.Label to hold the title of the window and insert it using
        # header.pack_start.
        # For when there is not stack switcher, directly insert the Gtk.Label
        # holding the title set_custom_title.
        header = Gtk.HeaderBar()
        header.set_show_close_button(True)

        header_title = Gtk.Label(self._get_application_title())
        # NOTE: Set the "title" class to the label so it is styled accordingly.
        Gtk.StyleContext.add_class(Gtk.Widget.get_style_context(header_title), "title")
        header_title.set_tooltip_text(self._get_application_title())
        # NOTE: Ellipsize the title label so the window can tile/resize even when there
        # is not enough room to display the complete text.
        header_title.set_property("ellipsize", Pango.EllipsizeMode.END)

        stack_switcher = settings_box.get_stack_switcher()

        if stack_switcher is not None:
            stack = stack_switcher.get_stack()
            stack.connect("notify", self.on_stack_switcher_changed)
            header.pack_start(header_title)
            header.set_custom_title(stack_switcher)

            try:
                stack.set_visible_child_name(self.current_selected_tab)
            except Exception:
                pass
        else:
            header.set_custom_title(header_title)

        self.window.set_titlebar(header)

        main_box = BaseGrid()
        main_box.set_spacing(0, 0)
        main_box.set_property("margin", 0)

        if self.xlet_help_file_exists or self.display_settings_handling:
            add_separator = False
            menu_popup = Gtk.Menu()
            menu_popup.set_halign(Gtk.Align.END)

            if self.display_settings_handling:
                menu_popup.append(
                    self.create_menu_item(text=_("Import from a file"),
                                          callback=self.restore_settings)
                )
                menu_popup.append(
                    self.create_menu_item(text=_("Export to a file"),
                                          callback=self.backup_settings)
                )
                menu_popup.append(
                    self.create_menu_item(text=_("Reset to defaults"),
                                          callback=self.reset_settings)
                )
                add_separator = True

            if self.xlet_help_file_exists:
                if add_separator:
                    menu_popup.append(Gtk.SeparatorMenuItem())

                menu_popup.append(
                    self.create_menu_item(text=_("Help"),
                                          callback=self.open_help_page)
                )

            menu_popup.show_all()
            menu_button = Gtk.MenuButton()
            menu_button.set_popup(menu_popup)
            menu_button.add(Gtk.Image.new_from_icon_name(
                "open-menu-symbolic", Gtk.IconSize.MENU
            ))

            header.pack_end(menu_button)

        # Mark for deletion on EOL. Cinnamon 3.2.x+
        # Remove the compare_version() check (or update it) and the highlight_button entirely.
        if compare_version(CINNAMON_VERSION, "3.2.0") < 0 and self.xlet_type != "extension":
            highlight_button = Gtk.Button()
            highlight_button.add(Gtk.Image.new_from_icon_name(
                "software-update-available-symbolic", Gtk.IconSize.SMALL_TOOLBAR
            ))
            highlight_button.set_tooltip_text(
                _("Momentarily highlight the %s on your desktop") % self.xlet_type)
            highlight_button.connect("clicked", self.on_highlight_button_clicked)
            header.pack_end(highlight_button)

        # NOTE: Separator used so the buttons on the right of the header bar never
        # touch the stack switcher. This is so the misalignment between these elements
        # isn't blatantly noticed (there isn't in existence ONE Gtk3 theme that
        # can align these elements together inside a header bar. NONE!!!).
        header.pack_end(Gtk.Separator(orientation=Gtk.Orientation.VERTICAL))

        main_box.add(settings_box)

        self.window.add(main_box)
        self.window.show_all()
        self.window.connect("destroy", self.on_quit)
        self.window.connect("size-allocate", self.on_size_allocate_cb)
        self.window.connect("window-state-event", self.on_window_state_event_cb)

    def create_menu_item(self, text, callback, *args):
        """Create menu item.

        Parameters
        ----------
        text : str
            Text for the menu item.
        callback : function
            Callback function to be executed when the menu item is activated.
        *args
            Arguments.

        Returns
        -------
        object
            <class "Gtk.MenuItem">.
        """
        item = Gtk.MenuItem(text)

        if callback is not None:
            item.connect("activate", callback, *args)

        return item

    def open_help_page(self, *args):
        """Open the xlet help page.

        Parameters
        ----------
        *args
            Arguments.
        """
        run(["xdg-open", self.help_file_path])

    def load_xlet_data_and_instance(self):
        """Load xlet data and instance.
        """
        self.xlet_dir = "/usr/share/cinnamon/%ss/%s" % (self.xlet_type, self.xlet_uuid)

        if not os.path.exists(self.xlet_dir):
            self.xlet_dir = "%s/.local/share/cinnamon/%ss/%s" % (
                HOME, self.xlet_type, self.xlet_uuid)

        if os.path.exists("%s/metadata.json" % self.xlet_dir):
            raw_data = open("%s/metadata.json" % self.xlet_dir).read()
            self.xlet_meta = json.loads(raw_data)
            self.xlet_meta["path"] = self.xlet_dir
        else:
            print("Could not find %s metadata for uuid %s - are you sure it's installed correctly?" %
                  (self.xlet_type, self.xlet_uuid))
            quit()

        # NOTE: Append the "icons" folder found in the framework.
        Gtk.IconTheme.get_default().append_search_path(os.path.join(module_path, "icons"))

        # NOTE: If exists, append the "icons" folder found in the xlet. Some xlets
        # settings windows might want to add icons that are shipped with them.
        # For use in the stack switcher for example.
        if os.path.isdir(os.path.join(self.xlet_dir, "icons")):
            Gtk.IconTheme.get_default().append_search_path(os.path.join(self.xlet_dir, "icons"))

        self.help_file_path = os.path.join(self.xlet_dir, "HELP.html")
        self.xlet_help_file_exists = os.path.isfile(self.help_file_path)

        config_path = "%s/.cinnamon/configs/%s" % (HOME, self.xlet_uuid)
        self.settings = JSONSettingsHandler(  # noqa
            os.path.join(config_path, "%s.json" % (self.xlet_instance_id or self.xlet_uuid)),
            xlet_meta=self.xlet_meta
        )

        # NOTE: Do not initialize DBus proxy when the xlet type is extension.
        if self.xlet_type != "extension":
            try:
                Gio.DBusProxy.new_for_bus(Gio.BusType.SESSION,
                                          Gio.DBusProxyFlags.NONE,
                                          None,
                                          "org.Cinnamon",
                                          "/org/Cinnamon",
                                          "org.Cinnamon",
                                          None,
                                          self._on_proxy_ready,
                                          None)
            except Exception as e:
                print(e)

    def backup_settings(self, *args):
        """Backup xlet settings.

        Parameters
        ----------
        *args
            Arguments.
        """
        dialog = Gtk.FileChooserDialog(title=_("Select or enter file to export to"),
                                       action=Gtk.FileChooserAction.SAVE,
                                       transient_for=self.window,
                                       buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                                                _("_Save"), Gtk.ResponseType.ACCEPT))

        dialog.set_do_overwrite_confirmation(True)
        filter_text = Gtk.FileFilter()
        filter_text.add_pattern("*.json")
        filter_text.set_name(_("JSON files"))
        dialog.add_filter(filter_text)

        response = dialog.run()

        if response == Gtk.ResponseType.ACCEPT:
            filename = dialog.get_filename()

            if ".json" not in filename:
                filename = filename + ".json"

            self.settings.save_to_file(filename)

        dialog.destroy()

    def restore_settings(self, *args):
        """Restore xlet settings.

        Parameters
        ----------
        *args
            Arguments.
        """
        dialog = Gtk.FileChooserDialog(title=_("Select a JSON file to import"),
                                       action=Gtk.FileChooserAction.OPEN,
                                       transient_for=self.window,
                                       buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                                                _("_Save"), Gtk.ResponseType.OK))

        filter_text = Gtk.FileFilter()
        filter_text.add_pattern("*.json")
        filter_text.set_name(_("JSON files"))
        dialog.add_filter(filter_text)

        response = dialog.run()

        if response == Gtk.ResponseType.OK:
            filename = dialog.get_filename()
            self.settings.load_from_file(filename)

        dialog.destroy()

    def reset_settings(self, *args):
        """Reset xlet settings.

        Parameters
        ----------
        *args
            Arguments.
        """
        dialog = Gtk.MessageDialog(transient_for=self.window,
                                   flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
                                   message_type=Gtk.MessageType.WARNING,
                                   buttons=Gtk.ButtonsType.YES_NO)

        dialog.set_title(_("Trying to reset all settings!!!"))

        msg = cgi.escape(_("Reset all settings to their default values?"))
        dialog.set_markup(msg)

        dialog.show_all()
        response = dialog.run()

        if response == Gtk.ResponseType.YES:
            self.settings.reset_to_defaults()

        dialog.destroy()

    # Mark for deletion on EOL. Cinnamon 3.2.x+
    # Remove function.
    def on_highlight_button_clicked(self, *args):
        """Highlight applet on demand.

        Parameters
        ----------
        *args
            Arguments.
        """
        if proxy:
            try:
                proxy.highlightApplet("(ss)", self.xlet_uuid, self.xlet_instance_id)
            except Exception:
                pass

    def on_stack_switcher_changed(self, stack, *args):
        """Highlight applet on demand.

        Parameters
        ----------
        stack : object
            The stack from which to get the its name.
        *args
            Arguments.
        """
        self.current_selected_tab = stack.get_visible_child_name()

    def on_quit(self, *args):
        """On quit.

        Parameters
        ----------
        *args
            Arguments.
        """
        self._store_window_state()

        if proxy:
            try:
                proxy.highlightXlet("(ssb)", self.xlet_uuid, self.xlet_instance_id, False)
            except Exception:
                pass

        self.quit()


if __name__ == "__main__":
    pass
