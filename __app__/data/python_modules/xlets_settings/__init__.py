# -*- coding: utf-8 -*-
"""Cinnamon's xlets settings re-implementation.

Attributes
----------
G_SETTINGS_WIDGETS : dict
    gsettings widgets map.
MAIN_APP : MainApplication
    An instance of :any:`MainApplication`.
MODULE_PATH : str
    Path to the root of this module.
proxy : Gio.DBusProxy
    A ``Gio.DBusProxy``.
XLET_SETTINGS_WIDGETS : dict
    Settings widgets map.

Deleted Attributes
------------------
CINNAMON_VERSION : str
    Cinnamon version.
GTK_VERSION : str
    Gtk version.
"""
import argparse
import gi
import json
import os

gi.require_version("Gdk", "3.0")
gi.require_version("GdkPixbuf", "2.0")
gi.require_version("Gtk", "3.0")

from gi.repository import GLib
from gi.repository import Gdk
from gi.repository import GdkPixbuf
from gi.repository import Gio
from gi.repository import Gtk
from html import escape
# from subprocess import check_output
from subprocess import run

from . import exceptions
from .GSettingsWidgets import *                                           # noqa
from .JsonSettingsWidgets import *                                        # noqa
from .ansi_colors import Ansi
from .common import BaseGrid
from .common import HOME
from .common import _
from .common import get_global
from .common import set_global

MODULE_PATH = os.path.dirname(os.path.abspath(__file__))

# NOTE: Commented until they are needed.
# CINNAMON_VERSION = check_output(
#     ["cinnamon", "--version"]
# ).decode("utf-8").splitlines()[0].split(" ")[1]
# GTK_VERSION = f"{Gtk.get_major_version()}.{Gtk.get_minor_version()}"

proxy = None
MAIN_APP = None

XLET_SETTINGS_WIDGETS = {
    "appchooser": "JSONSettingsAppChooser",
    "applist": "JSONSettingsAppList",
    "button": "JSONSettingsButton",  # NOTE: Custom simplified widget.
    "colorchooser": "JSONSettingsColorChooser",
    "combobox": "JSONSettingsComboBox",
    "entry": "JSONSettingsEntry",
    "filechooser": "JSONSettingsFileChooser",
    "iconfilechooser": "JSONSettingsIconChooser",
    "keybinding": "JSONSettingsKeybinding",
    "keybinding-with-options": "JSONSettingsKeybindingWithOptions",
    "list": "JSONSettingsTreeList",
    "scale": "JSONSettingsRange",
    "soundfilechooser": "JSONSettingsSoundFileChooser",
    "spinbutton": "JSONSettingsSpinButton",
    "stringslist": "JSONSettingsStringsList",
    "switch": "JSONSettingsSwitch",
    "textview": "JSONSettingsTextView",
    "textviewbutton": "JSONSettingsTextViewButton",
    # "datechooser": "JSONSettingsDateChooser",
    # "effect": "JSONSettingsEffectChooser",
    # "fontchooser": "JSONSettingsFontButton",
    # "tween": "JSONSettingsTweenChooser",
}

G_SETTINGS_WIDGETS = {
    "gcombobox": "GSettingsComboBox",
    "gswitch": "GSettingsSwitch",
    # "gcolorchooser": "GSettingsColorChooser",
    # "gentry": "GSettingsEntry",
    # "gfilechooser": "GSettingsFileChooser",
    # "giconfilechooser": "GSettingsIconChooser",
    # "gscale": "GSettingsRange",
    # "gsoundfilechooser": "GSettingsSoundFileChooser",
    # "gspinbutton": "GSettingsSpinButton",
    # "gtextview": "GSettingsTextView",
}


class SettingsBox(BaseGrid):
    """Settings box.

    Attributes
    ----------
    stack : Gtk.Stack
        A ``Gtk.Stack``.
    """
    _double_col_span = [
        "applist",
        "button",
        "buttonsgroup",
    ]

    _should_fill_row = [
        "list"
    ]

    def __init__(self, window_definition, instance_info={}, xlet_meta=None):
        """Initialization.

        Parameters
        ----------
        window_definition : WindowDefinition
            The instance of :any:`WindowDefinition` containing the data to generate all window widgets.
        instance_info : dict, optional
            Xlet instance information.
        xlet_meta : None, optional
            Xlet metadata.
        """
        super().__init__(orientation=Gtk.Orientation.HORIZONTAL)
        self.set_border_width(0)
        self.set_spacing(0, 0)
        # NOTE: Set property to avoid calling 2 methods.
        self.set_property("expand", True)
        # NOTE: Set property to avoid calling 4 methods.
        self.set_property("margin", 0)

        self._timer = None
        self._xlet_meta = xlet_meta
        self._instance_info = instance_info

        stack = Gtk.Stack()
        self.stack = stack
        stack.set_transition_type(Gtk.StackTransitionType.SLIDE_UP_DOWN)
        stack.set_transition_duration(150)
        # NOTE: Set property to avoid calling 2 methods.
        stack.set_property("expand", True)
        # NOTE: Set property to avoid calling 4 methods.
        stack.set_property("margin", 0)

        page_count = 0

        for page_def in window_definition.pages:
            # NOTE: Possibility to hide entire pages depending on a condition defined in
            # the widgets definition file.
            if not page_def.compatible:
                continue

            page_scrolled_window = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
            page_scrolled_window.set_policy(hscrollbar_policy=Gtk.PolicyType.NEVER,
                                            vscrollbar_policy=Gtk.PolicyType.AUTOMATIC)
            # Mark for deletion on EOL. Gtk4
            # Stop using set_shadow_type and set the boolean property has-frame.
            page_scrolled_window.set_shadow_type(type=Gtk.ShadowType.ETCHED_IN)
            page = SettingsPage()  # noqa | JsonSettingsWidgets > SettingsWidgets
            page_scrolled_window.add(page)

            section_count = 0

            for section_def in page_def.sections:
                # NOTE: Possibility to hide entire sections depending on a condition defined in
                # the widgets definition file.
                if not section_def.compatible:
                    continue

                if section_def.dependency:
                    revealer = JSONSettingsRevealer(  # noqa | JsonSettingsWidgets
                        self._instance_info["settings"], section_def.dependency
                    )
                    section_container = page.add_reveal_section(
                        title=section_def.title,
                        subtitle=section_def.subtitle,
                        section_info=section_def.info,
                        revealer=revealer
                    )
                else:
                    section_container = page.add_section(
                        title=section_def.title,
                        subtitle=section_def.subtitle,
                        section_info=section_def.info,
                    )

                section_widgets = section_def.widgets

                for i, widget_def in enumerate(section_widgets):
                    # NOTE: Possibility to hide individual widgets depending on a condition defined in
                    # the widgets definition file.
                    if not widget_def.compatible:
                        continue

                    widget = None

                    try:
                        # NOTE: widget_def is modified by adding an instance of JSONSettingsHandler to it.
                        # widget_def is stored in widget_def_clean so it can be used by json.dumps() when
                        # is printed to STDOUT for easy reading. A shallow copy is enough.
                        widget_def_clean = widget_def.__dict__
                        widget_type = widget_def.widget_type
                        widget = self.create_widget(widget_def)
                    except Exception as err:
                        MAIN_APP.errors_found = True
                        print(Ansi.LIGHT_RED(err))
                        print(Ansi.DEFAULT("**Widget definition**"))
                        print(json.dumps(widget_def_clean, indent=4))
                        continue

                    if not widget:
                        continue

                    if widget_type in self._should_fill_row:
                        widget.fill_row()
                    else:
                        widget.set_border_width(5)
                        widget.set_margin_start(15)
                        widget.set_margin_end(15)

                    if widget_type in self._double_col_span:
                        col_span = 2
                    else:
                        col_span = 1

                    if "dependency" in widget_def.widget_kwargs:
                        revealer = JSONSettingsRevealer(  # noqa | JsonSettingsWidgets
                            self._instance_info["settings"], widget_def.widget_kwargs["dependency"]
                        )
                        section_container.add_reveal_row(widget, 0, i + 1, col_span, 1,
                                                         revealer=revealer)
                    else:
                        section_container.add_row(widget, 0, i + 1, col_span, 1)

                section_count += 1

                for note in section_def.notes:
                    section_container.add_note(note)

                if len(page_def.sections) != section_count:
                    section_container.add(Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL))

            page_count += 1
            stack.add_titled(page_scrolled_window, "stack_id_%d" %
                             page_count, page_def.title)

        if window_definition.should_create_page_switcher():
            page_switcher = Gtk.StackSidebar()
            page_switcher.set_stack(stack)
            self.add(page_switcher)
            stack.connect("notify::visible-child", self.on_stack_switcher_changed)

        self.add(stack)

        self.show_all()

    def create_widget(self, widget_def):
        """Create widget.

        Parameters
        ----------
        widget_def : builder.Widget
            An instance of :any:`builder.Widget`.

        Returns
        -------
        SettingsWidgets.SettingsWidget
            A widget ready to be added to the main application window.

        Raises
        ------
        exceptions.MissingPreferenceKey
            Inform that a preference key doesn't exist in the settings-schema.json file.
        exceptions.UnkownWidgetType
            Inform that the widget type is non existent.
        """
        widget = None
        widget_type = widget_def.widget_type
        widget_pref_key = widget_def.pref_key
        widget_kwargs = widget_def.widget_kwargs

        if widget_type == "label":
            widget = Text(**widget_kwargs)  # noqa | JsonSettingsWidgets > SettingsWidgets
        elif widget_type == "buttonsgroup":
            widget = ButtonsGroup()  # noqa | JsonSettingsWidgets > SettingsWidgets

            for i, button_def in enumerate(widget_kwargs.get("buttons", [])):
                button_pref_key = button_def[0]
                button_kwargs = button_def[1]
                button_kwargs["for_group"] = True

                button = globals()[XLET_SETTINGS_WIDGETS["button"]](
                    pref_key=button_pref_key,
                    settings=self._instance_info["settings"],
                    widget_kwargs=button_kwargs
                )
                widget.attach(button, i, 0, 1, 1)
        elif widget_type in XLET_SETTINGS_WIDGETS:
            # NOTE: Doing this check so I can find out at once if there are one or more
            # missing pref. keys and fix them all at once.
            if widget_pref_key not in self._instance_info["settings"].settings:
                raise exceptions.MissingPreferenceKey(widget_pref_key)

            widget = globals()[XLET_SETTINGS_WIDGETS[widget_type]](
                pref_key=widget_pref_key,
                settings=self._instance_info["settings"],
                widget_kwargs=widget_kwargs
            )
        elif widget_type in G_SETTINGS_WIDGETS:
            widget = globals()[G_SETTINGS_WIDGETS[widget_type]](
                pref_key=widget_pref_key,
                schema=widget_def.schema,
                xlet_meta=self._xlet_meta,
                widget_kwargs=widget_kwargs
            )
        else:
            raise exceptions.UnkownWidgetType(widget_type)

        return widget

    def _on_stack_switcher_changed(self):
        """On stack switcher changed delayed.

        Returns
        -------
        bool
            Remove source.
        """
        # NOTE: This bit me in the arse real good!!! LOL
        # Without the throttle, and connecting only the "notify" signal to the stack, the
        # on_stack_switcher_changed method was triggered like 5 times and it always stored
        # the wrong value to MAIN_APP.win_stacks_state.
        # With the "notify::visible-child" signal connected, on_stack_switcher_changed triggers
        # automatically only once when the stack is created and the first child is selected,
        # and immediately again, if needed, to select the child name stored in
        # MAIN_APP.win_stacks_state. The second call will cancel the first and then store what was
        # stored (Yeah, I know! ¬¬). Successive changes to the visible children (selecting items
        # in the sidebar) will trigger on_stack_switcher_changed and store the
        # correct ID (hopefully).
        MAIN_APP.store_selected_stack(self.stack.get_visible_child_name())
        self._timer = None

        return GLib.SOURCE_REMOVE

    def on_stack_switcher_changed(self, *args):
        """On stack switcher changed.

        Parameters
        ----------
        *args
            Arguments.
        """
        if self._timer:
            GLib.source_remove(self._timer)

        self._timer = GLib.timeout_add(500, self._on_stack_switcher_changed)

    def get_page_stack(self):
        """Get stack switcher.

        Returns
        -------
        Gtk.StackSwitcher
            The Gtk.StackSwitcher used to switch pages.
        """
        return self.stack


class AppMenuButton(Gtk.MenuButton):
    """Application menu button.

    Attributes
    ----------
    main_app : MainApplication
        The main application.
    """

    def __init__(self, main_app):
        """Initialization.

        Parameters
        ----------
        main_app : MainApplication
            The main application.
        """
        image = Gtk.Image.new_from_icon_name(
            "open-menu-symbolic", Gtk.IconSize.BUTTON
        )
        super().__init__(image=image)

        self.main_app = main_app

        main_model = Gio.Menu()

        if self.main_app.display_settings_handling:
            xlet_settings_model = Gio.Menu()
            xlet_settings_model.append(_("Import settings from a file"), "app.import_settings")
            xlet_settings_model.append(_("Export settings to a file"), "app.backup_settings")
            xlet_settings_model.append(_("Reset settings to defaults"), "app.reset_settings")
            main_model.append_section(_("Xlet settings"), xlet_settings_model)

        if self.main_app.xlet_help_file_exists:
            xlet_help_model = Gio.Menu()
            xlet_help_model.append(_("Help"), "app.open_help_page")
            main_model.append_section(None, xlet_help_model)

        app_prefs_model = Gio.Menu()
        app_prefs_submenu_model = Gio.Menu()
        app_prefs_submenu_model.append(
            _("Use headerbars on dialogs"),
            "app.use_header_bars_on_dialogs")
        app_prefs_model.append_submenu(_("Application preferences"), app_prefs_submenu_model)
        main_model.append_section(None, app_prefs_model)

        self.set_menu_model(main_model)


class AppHeaderBar(Gtk.HeaderBar):
    """Application header bar.

    Attributes
    ----------
    app_image : Gtk.Button
        A button with an image to display when there is only one xlet instance to handle.
    instance_switcher : Gtk.StackSwitcher
        Instance switcher stack.
    instance_switcher_box : BaseGrid
        Instance switcher buttons container.
    main_app : MainApplication
        The main application.
    next_button : Gtk.Button
        Button to switch to next instance.
    prev_button : Gtk.Button
        Button to switch to previous instance.
    """

    def __init__(self, main_app):
        """Initialization.

        Parameters
        ----------
        main_app : MainApplication
            The main application.
        """
        super().__init__()
        self.main_app = main_app

        self.set_show_close_button(True)

        self.instance_switcher = Gtk.StackSwitcher()

        self.instance_switcher_box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        # Mark for deletion on EOL. Gtk4
        # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
        self.instance_switcher_box.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED)

        self.prev_button = Gtk.Button.new_from_icon_name(
            "go-previous-symbolic", Gtk.IconSize.BUTTON)
        self.prev_button.set_tooltip_text(_("Previous instance"))
        self.prev_button.connect("clicked", self.main_app.previous_instance)
        self.instance_switcher_box.add(self.prev_button)

        self.instance_switcher_box.add(self.instance_switcher)

        self.next_button = Gtk.Button.new_from_icon_name(
            "go-next-symbolic", Gtk.IconSize.BUTTON)
        self.next_button.set_tooltip_text(_("Next instance"))
        self.next_button.connect("clicked", self.main_app.next_instance)
        self.instance_switcher_box.add(self.next_button)

        res, width, height = Gtk.IconSize.lookup(Gtk.IconSize.BUTTON)
        pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_size(
            self.main_app.xlet_icon_path,
            width if res else 16,
            height if res else 16
        )
        image = Gtk.Image.new_from_pixbuf(pixbuf)
        self.app_image = Gtk.Button(image=image)
        self.app_image.set_sensitive(False)
        # Mark for deletion on EOL. Gtk4
        # Stop using set_relief and set the boolean property has-frame.
        self.app_image.set_relief(Gtk.ReliefStyle.NONE)
        self.app_image.set_can_focus(False)
        self.app_image.set_receives_default(False)
        self.app_image.set_can_default(False)
        # Mark for deletion on EOL. Gtk4
        # Replace Gtk.StyleContext.add_class with Gtk.Widget.add_css_class.
        # NOTE: Set of a custom class to override the insensitive/disabled styling.
        self.app_image.get_style_context().add_class("cinnamon-xlet-settings-app")
        self.app_image.get_style_context().add_class("title-button")

        self.pack_start(self.app_image)
        self.pack_start(self.instance_switcher_box)

        if self.main_app.xlet_help_file_exists or self.main_app.display_settings_handling:
            self.pack_end(AppMenuButton(self.main_app))

        self.set_title(self.main_app._get_application_title())


class MainApplication(Gtk.Application):
    """Main application.

    Attributes
    ----------
    all_applications_list : list
        The list of all installed applications on a system.
    all_instances_info : list
        Storage for all xlets instances information.
    application_id : str
        The application ID.
    cinnamon_gsettings : Gio.Settings
        Cinnamon's gsettings settings (schema ``org.cinnamon``) to get the list of enabled xlets.
    errors_found : bool
        Flag to display a notification when non-critical errors are found.
    gtk_app_info_monitor : Gio.AppInfoMonitor
        The ``Gio.AppInfoMonitor`` used to monitor system applications changes.
    gtk_app_info_monitor_signal : int
        Signal ID for ``self.gtk_app_info_monitor`` connection.
    gtk_app_info_monitor_uptodate : bool
        *Flag* used to conditionally force the update of self.all_applications_list.
    gtk_icon_theme : Gtk.IconTheme
        This is used to append extra folders to ``Gtk.IconTheme`` to use icons by name instead
        of by path. It is also used by the :any:`IconChooser` widgets to get the list of icons in an
        icon theme.
    gtk_icon_theme_signal : int
        Signal ID for ``self.gtk_icon_theme`` connection.
    gtk_icon_theme_uptodate : bool
        *Flag* used to conditionally force the update of self.icon_chooser_contexts_store.
    header_bar : Gtk.HeaderBar
        The header bar used by this application.
    help_file_path : str
        Path to an xlet help file.
    icon_chooser_contexts_store : Gtk.ListStore
        The place where the icon theme contexts are stored. Each element on this list has two elements.
        The translated icon context name (for display purposes) at index 0 and the icon context name
        (used to retrieve from the icon theme all icons from such context) at index 1.
    icon_chooser_icons_store : Gtk.ListStore
        The icons database to be used by the :any:`IconChooser` entry.
    instance_stack : Gtk.Stack
        The stack where every :any:`SettingsBox` for each xlet instance are added.
    selected_instance : dict
        The information of the currently selected instance.
    win_current_height : int
        Window current height.
    win_current_width : int
        Window current width.
    win_initial_stack : string
        Initial stack ID to open the window with this stack selected.
    win_is_maximized : bool
        Whether the window is maximized.
    win_stacks_state : dict
        The name of each selected stack of each xlet instance.
    win_state_cache_file : str
        Path to the file where the window state is stored.
    window : Gtk.ApplicationWindow
        The window used by this application.
    xlet_dir : str
        Path to where the xlet is installed.
    xlet_help_file_exists : bool
        Whether the HELP.html file inside an xlet directory exist.
    xlet_icon_path : str
        Path to a file called icon.svg (or icon.png) inside an xlet folder.
    xlet_instance_id : str
        Xlet isntance ID.
    """
    _required_args = {
        "window_definition",
        "xlet_type",
        "xlet_uuid"
    }
    _allowed_xlet_types = {
        "applet",
        "desklet",
        "extension"
    }

    def __init__(self, **kwargs):
        """Initialization.

        Parameters
        ----------
        **kwargs
            Keyword arguments.

        Raises
        ------
        exceptions.MissingRequiredArgument
            Halt execution if any of the required arguments weren't passed.
        exceptions.WrongType
            Halt execution if a wrong xlet type was passed.
        """
        kwargs_keys = set(kwargs.keys())

        if not self._required_args.issubset(kwargs_keys):
            raise exceptions.MissingRequiredArgument(
                list(self._required_args.difference(kwargs_keys)))

        # NOTE: kwargs attributes/CLI parameters.
        for key, value in kwargs.items():
            setattr(self, key, value)

        # NOTE: Default values.
        # self.application_id = ""
        # self.display_settings_handling = True
        # self.debug_mode = False
        # self.application_title = ""
        # self.window_definition = None
        # self.win_initial_height = 600
        # self.win_initial_width = 800
        # self.win_initial_stack = ""
        # self.xlet_instance_id = ""
        # self.xlet_type = "extension"
        # self.xlet_uuid = ""
        # NOTE: Other attributes.
        self.xlet_dir = f"/usr/share/cinnamon/{self.xlet_type}s/{self.xlet_uuid}"
        self.errors_found = False
        self.selected_instance = None
        self.gtk_icon_theme_uptodate = False
        self.gtk_app_info_monitor_uptodate = False
        self.all_applications_list = []
        self.icon_chooser_icons_store = Gtk.ListStore(str, str)
        self.icon_chooser_contexts_store = Gtk.ListStore(str, str)
        self.cinnamon_gsettings = Gio.Settings.new("org.cinnamon")
        self.all_instances_info = []
        self.gtk_app_info_monitor = Gio.AppInfoMonitor.get()
        self.gtk_app_info_monitor_signal = self.gtk_app_info_monitor.connect(
            "changed", self.on_gtk_app_info_monitor_changed)
        self.gtk_icon_theme = Gtk.IconTheme.get_default()
        self.gtk_icon_theme_signal = self.gtk_icon_theme.connect(
            "changed", self.on_gtk_icon_theme_changed)
        # NOTE: Append the "icons" folder found in the framework.
        self.gtk_icon_theme.append_search_path(os.path.join(MODULE_PATH, "icons"))

        if self.xlet_type not in self._allowed_xlet_types:
            raise exceptions.WrongType(expected=", ".join(self._allowed_xlet_types),
                                       received=str(self.xlet_type))

        if not self.application_id:
            self.application_id = f'org.Cinnamon.{self.xlet_type.title()}s.{self.xlet_uuid.replace("@", ".")}.Settings'

        if self.xlet_type == "extension" and not self.xlet_instance_id:
            self.xlet_instance_id = self.xlet_uuid

        self.load_xlet_data()

        self.xlet_icon_path = os.path.join(self.xlet_dir, "icon.svg")

        if not os.path.isfile(self.xlet_icon_path):
            self.xlet_icon_path = os.path.join(self.xlet_dir, "icon.png")

        if not os.path.isfile(self.xlet_icon_path):
            self.xlet_icon_path = None

        GLib.set_application_name(self._get_application_title())

        super().__init__(
            application_id=self.application_id,
            flags=Gio.ApplicationFlags.FLAGS_NONE,
        )

        self.attach_app_actions()

    def attach_app_actions(self):
        """Attach application actions.

        These actions are mainly triggered from the :any:`AppMenuButton` items.
        """
        for action_name in [
            "import_settings",
            "backup_settings",
            "reset_settings",
            "open_help_page",
        ]:
            action = Gio.SimpleAction(name=action_name)
            action.connect("activate", getattr(self, action_name))
            self.add_action(action)

        action = Gio.SimpleAction.new_stateful(
            name="use_header_bars_on_dialogs",
            parameter_type=None,
            state=GLib.Variant.new_boolean(get_global("USE_HEADER_BARS_ON_DIALOGS"))
        )
        action.connect("change-state", self._toggle_use_header_bars_on_dialogs)
        self.add_action(action)

    def _toggle_use_header_bars_on_dialogs(self, action, value):
        """Toggle USE_HEADER_BARS_ON_DIALOGS setting.

        Parameters
        ----------
        action : Gio.SimpleAction
            The action whose state changed.
        value : GLib.Variant
            Value of the action.
        """
        action.set_state(value)
        set_global("USE_HEADER_BARS_ON_DIALOGS", value.get_boolean())

    def on_gtk_app_info_monitor_changed(self, *args):
        """Set self.gtk_app_info_monitor_changed to true to force stored applications update.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.gtk_app_info_monitor_uptodate = False

    def on_gtk_icon_theme_changed(self, *args):
        """Set self.gtk_icon_theme_changed to true to force stored icons update.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.gtk_icon_theme_uptodate = False

    def init_apps_chooser_data(self):
        """Initialize applications chooser data.

        Returns
        -------
        None
            Halt execution.
        """
        if self.gtk_app_info_monitor_uptodate:
            return

        self.all_applications_list.clear()
        app_blacklist = set(("screensavers-", "kde4-"))

        # I added this filter because there are more that 200 screen savers in Linux Mint. ¬¬
        # They were unnecessarily slowing the heck out the loading of the list of applications.
        # At this point in time, none of the tweaks that makes use of this ApplicationChooserDialog
        # would require to choose a screen saver from the list, so I happily ignore them for now.
        def filter_list(x):
            """Filter application list.

            Parameters
            ----------
            x : Gio.DesktopAppInfo
                The application to filter.

            Returns
            -------
            bool
                If the application should be included in the list of applications.
            """
            lowered = str(x.get_id()).lower()

            # I think that is more precise to check the start of the app ID. (?)
            # The following condition filters out all .desktop files that
            # are inside a folders called "screensavers" and "kde4".
            return lowered[:13] not in app_blacklist and lowered[:5] not in app_blacklist

        self.all_applications_list = list(filter(filter_list, Gio.AppInfo.get_all()))

        self.gtk_app_info_monitor_uptodate = True

    def init_icon_chooser_data(self):
        """Initialize icon chooser data.

        This data is generated and stored in :any:`MainApplication` so the
        tasks aren't performed for each :any:`IconChooserDialog` created.

        Returns
        -------
        None
            Halt execution.
        """
        if self.gtk_icon_theme_uptodate:
            return

        self.icon_chooser_icons_store.clear()
        self.icon_chooser_contexts_store.clear()

        icon_contexts = [[_(context), context]
                         for context in self.gtk_icon_theme.list_contexts()]
        icon_contexts.sort()

        # NOTE: Store absolutely all icons. The ones that are categorized will be removed.
        # The rest of icons will be displayed in the Other category.
        all_icons_set = set(self.gtk_icon_theme.list_icons(None))

        for l, context in icon_contexts:  # noqa
            icons = self.gtk_icon_theme.list_icons(context)

            for icon in sorted(icons):
                self.icon_chooser_icons_store.append([context, icon])

            all_icons_set = all_icons_set - set(icons)

        other_icons = list(all_icons_set)
        other_icons.sort()

        for icon in other_icons:
            self.icon_chooser_icons_store.append(["other", icon])

        icon_contexts += [[_("Other"), "other"]]

        for ctx in icon_contexts:
            self.icon_chooser_contexts_store.append(ctx)

        all_icons_set.clear()

        self.gtk_icon_theme_uptodate = True

    def load_xlet_data(self):
        """Load xlet data.
        """
        self.xlet_dir = f"/usr/share/cinnamon/{self.xlet_type}s/{self.xlet_uuid}"

        if not os.path.exists(self.xlet_dir):
            self.xlet_dir = f"{HOME}/.local/share/cinnamon/{self.xlet_type}s/{self.xlet_uuid}"

        metadata_path = f"{self.xlet_dir}/metadata.json"

        if os.path.exists(metadata_path):
            raw_data = open(metadata_path).read()
            self._xlet_meta = json.loads(raw_data)
            self._xlet_meta["path"] = self.xlet_dir
        else:
            print(
                f"Could not find {self.xlet_type} metadata for uuid {self.xlet_uuid} - are you sure it's installed correctly?")
            quit()

        # NOTE: If exists, append the "icons" folder found in the xlet. Some xlets
        # settings windows might want to add icons that are shipped with them.
        # This allows to use the shipped icons by name instead of by their path.
        if os.path.isdir(os.path.join(self.xlet_dir, "icons")):
            self.gtk_icon_theme.get_default().append_search_path(os.path.join(self.xlet_dir, "icons"))

        self.help_file_path = os.path.join(self.xlet_dir, "HELP.html")
        self.xlet_help_file_exists = os.path.isfile(self.help_file_path)

    def load_instances(self):
        """Load xlets instances.
        """
        config_path = f"{HOME}/.cinnamon/configs/{self.xlet_uuid}"
        instances = 0
        config_files = sorted([entry.name for entry in os.scandir(
            config_path) if entry.is_file(follow_symlinks=False) and entry.name.endswith(".json")])

        # LOGIC: For extensions it's always false. For other types, if max-instances metadata.json
        # property is anyhthong other than 1.
        multi_instance = int(
            self._xlet_meta.get("max-instances", 1)
        ) != 1 and self.xlet_type != "extension"

        for item in config_files:
            instance_id = item[0:-5]

            if not multi_instance and instance_id != self.xlet_uuid:
                continue  # for single instance the file name should be [uuid].json

            if multi_instance:
                try:
                    int(instance_id)
                except Exception:
                    continue  # multi-instance should have file names of the form [instance-id].json

                instance_exists = False
                enabled_xlets = self.cinnamon_gsettings.get_strv(f"enabled-{self.xlet_type}s")

                for xlet_def in enabled_xlets:
                    if self.xlet_uuid in xlet_def and instance_id in xlet_def.split(":"):
                        instance_exists = True
                        break

                if not instance_exists:
                    continue

            settings = JSONSettingsHandler(  # noqa | JsonSettingsWidgets
                filepath=os.path.join(config_path, item),
                # notify_callback=self.notify_dbus,
                xlet_meta=self._xlet_meta,
                instance_id=instance_id
            )

            instance_info = {
                # A JsonSettingsWidgets instance.
                "settings": settings,
                # The ID of a the selected stack in the side.
                "stack_id": self.win_stacks_state.get(instance_id, "stack_id_1"),
                # The ID (file name without extention) of the xlet instance.
                "id": instance_id,
                "uuid": self.xlet_uuid,
                "stack": SettingsStack()  # noqa | JsonSettingsWidgets > SettingsWidgets
            }

            instance_box = SettingsBox(self.window_definition,
                                       instance_info=instance_info,
                                       xlet_meta=self._xlet_meta)

            self.all_instances_info.append(instance_info)
            self.instance_stack.add_named(instance_box, instance_id)

            # LOGIC: If self.xlet_instance_id is set, it was set from the CLI or the xlet is
            # an extension.
            # If it isn't set, the application was called without arguments, either from a terminal
            # or from one of Cinnamon's xlet managers.
            # No need to set self.selected_instance here since it will be set after all
            # instances are loaded and using the instance with the ID stored in
            # self.xlet_instance_id.
            if not self.xlet_instance_id:
                self.xlet_instance_id = instance_id

            instances += 1

        if instances < 2:
            self.header_bar.app_image.show()
            self.header_bar.instance_switcher_box.set_no_show_all(True)
            self.header_bar.instance_switcher_box.hide()
        else:
            self.header_bar.app_image.set_no_show_all(True)
            self.header_bar.app_image.hide()
            self.header_bar.instance_switcher_box.show()

    def build_window(self):
        """Build window.
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

        if self.xlet_icon_path is not None:
            self.window.set_icon_from_file(self.xlet_icon_path)

        self.header_bar = AppHeaderBar(self)

        main_box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        main_box.set_spacing(0, 0)
        # NOTE: Set property to avoid calling 4 methods.
        main_box.set_property("margin", 0)

        self.instance_stack = Gtk.Stack()
        main_box.add(self.instance_stack)

        self.window.set_titlebar(self.header_bar)
        self.window.add(main_box)
        self.window.connect("destroy", self.on_quit)
        # Mark for deletion on EOL. Gtk4
        # Stop using size-allocate and window-state-event.
        # Use property notification for Gtk.Window:default-width and Gtk.Window:default-height.
        self.window.connect("size-allocate", self.on_size_allocate_cb)
        self.window.connect("window-state-event", self.on_window_state_event_cb)

    def _set_win_subtitle(self):
        """Set window subtitle.
        """
        if self.selected_instance["id"] == self.xlet_uuid:
            self.header_bar.set_subtitle(self.selected_instance["id"])
        else:
            self.header_bar.set_subtitle(f'{self.xlet_uuid} - {self.selected_instance["id"]}')

    def load_css(self):
        """Load CSS.
        """
        css_provider = Gtk.CssProvider()
        css_provider.load_from_path(os.path.join(MODULE_PATH, "stylesheet.css"))
        # css_provider.load_from_data(str.encode("""CSS styles"""))

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
            title_text = _("Settings for %s") % _(self._xlet_meta["name"])

        return title_text

    def _on_proxy_ready(self, obj, result, data=None):
        """Define proxy on proxy ready.

        Parameters
        ----------
        obj : Gio.DBusProxy
            A ``Gio.DBusProxy``.
        result : Gio.Task
            A ``Gio.Task``.
        data : None, optional
            User data.
        """
        global proxy
        proxy = Gio.DBusProxy.new_for_bus_finish(result)

        if not proxy.get_name_owner():
            proxy = None

        if proxy:
            try:
                proxy.highlightXlet("(ssb)", self.xlet_uuid, self.selected_instance["id"], True)
            except Exception:
                pass

    def do_activate(self, *args):
        """Do activate.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.window.present()

    def do_startup(self, *args):
        """Do startup.

        Parameters
        ----------
        *args
            Arguments.

        Raises
        ------
        exceptions.PEBCAK
            Halt execution.
        """
        self.load_css()

        Gtk.Application.do_startup(self)
        self._load_window_state()
        self.build_window()
        self.load_instances()

        if self.xlet_instance_id:
            for instance_info in self.all_instances_info:
                if instance_info["id"] == self.xlet_instance_id:
                    self.set_instance(instance_info)
                    break

        if not self.selected_instance:
            raise exceptions.PEBCAK()

        self._set_win_subtitle()
        self.window.show_all()

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
            except Exception as err:
                print(err)

        if self.errors_found:
            self.notify_errors()

    def on_size_allocate_cb(self, window, *args):
        """Save window state and size in size-allocate signal.

        Parameters
        ----------
        window : Gtk.ApplicationWindow
            This application window.
        *args
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
        window : Gtk.ApplicationWindow
            A ``Gtk.ApplicationWindow``.
        event : Gdk.EventWindowState
            A ``Gdk.EventWindowState``.
        """
        if event.new_window_state & Gdk.WindowState.MAXIMIZED:
            self.win_is_maximized = window.is_maximized()

    def store_selected_stack(self, stack_id):
        """Store selected stack.

        Parameters
        ----------
        stack_id : str
            The ID of the currently selected sidebar item.
        """
        self.win_stacks_state[self.selected_instance["id"]] = stack_id
        self.selected_instance["stack_id"] = stack_id

    def _store_window_state(self):
        """Store window state to file.
        """
        try:
            os.makedirs(os.path.dirname(self.win_state_cache_file), exist_ok=True)

            with open(self.win_state_cache_file, "w+") as state_file:
                json.dump({
                    "use_header_bars_on_dialogs": get_global("USE_HEADER_BARS_ON_DIALOGS"),
                    "width": self.win_current_width,
                    "height": self.win_current_height,
                    "is_maximized": self.win_is_maximized,
                    "stacks_state": self.win_stacks_state
                }, state_file, indent=4)
        except Exception as err:
            print(err)

    def _load_window_state(self):
        """Load window state from file.
        """
        default_state = {
            "width": self.win_initial_width,
            "height": self.win_initial_height,
            "is_maximized": False,
            "stacks_state": {}
        }
        self.win_state_cache_file = os.path.join(
            GLib.get_user_cache_dir(), self.application_id, "state.json")

        if os.path.isfile(self.win_state_cache_file):
            try:
                with open(self.win_state_cache_file) as state_file:
                    state_data = json.loads(state_file.read())
            except Exception as err:
                print(err)
                state_data = default_state
        else:
            state_data = default_state

        self.win_current_width = state_data.get("width", default_state["width"])
        self.win_current_height = state_data.get("height", default_state["height"])
        self.win_is_maximized = state_data.get("is_maximized", default_state["is_maximized"])
        self.win_stacks_state = state_data.get("stacks_state", default_state["stacks_state"])

        use_header_bars_on_dialogs = state_data.get("use_header_bars_on_dialogs", True)

        set_global("USE_HEADER_BARS_ON_DIALOGS", use_header_bars_on_dialogs)
        self.change_action_state("use_header_bars_on_dialogs",
                                 GLib.Variant.new_boolean(use_header_bars_on_dialogs))

    def create_menu_item(self, text, callback, *args):
        """Create menu item.

        Parameters
        ----------
        text : str
            Text for the menu item.
        callback : method
            Callback function to be executed when the menu item is activated.
        *args
            Arguments.

        Returns
        -------
        Gtk.MenuItem
            The created menu item.
        """
        item = Gtk.MenuItem(text)

        if callback is not None:
            item.connect("activate", callback, *args)

        return item

    def set_instance(self, instance_info):
        """Set instance.

        Parameters
        ----------
        instance_info : dict
            Xlet instance information.
        """
        self.instance_stack.set_visible_child_name(instance_info["id"])
        self.header_bar.instance_switcher.set_stack(instance_info["stack"])

        # NOTE: This has to be done BEFORE storing the new instance because it has to remove the
        # highlighting of the currently highlighted xlet, highlight the one that's going to be
        # the selected instance and then set the selected instance.
        try:
            if self.xlet_type != "extension" and proxy:
                proxy.highlightXlet("(ssb)", self.xlet_uuid, self.selected_instance["id"], False)
                proxy.highlightXlet("(ssb)", self.xlet_uuid, instance_info["id"], True)
        except Exception:
            pass

        self.selected_instance = instance_info
        self._set_win_subtitle()
        self.set_visible_stack_for_page()

    def set_visible_stack_for_page(self):
        """Set visible stack for page.
        """
        if self.selected_instance and self.selected_instance["id"] in self.win_stacks_state or self.win_initial_stack:
            instance_stack = self.instance_stack.get_visible_child()
            page_stack = instance_stack.get_page_stack()
            page = page_stack.get_child_by_name(
                self.win_initial_stack if
                self.win_initial_stack else
                self.selected_instance["stack_id"]
            )

            if page is not None:
                page_stack.set_visible_child(page)

            self.win_initial_stack = ""

    def previous_instance(self, *args):
        """Select previous instance.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.instance_stack.set_transition_type(Gtk.StackTransitionType.SLIDE_RIGHT)
        index = self.all_instances_info.index(self.selected_instance)
        self.set_instance(self.all_instances_info[index - 1])

    def next_instance(self, *args):
        """Select next instance.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.instance_stack.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT)
        index = self.all_instances_info.index(self.selected_instance)

        if index == len(self.all_instances_info) - 1:
            index = 0
        else:
            index += 1

        self.set_instance(self.all_instances_info[index])

    def open_help_page(self, *args):
        """Open the xlet help page.

        Parameters
        ----------
        *args
            Arguments.
        """
        run(["xdg-open", self.help_file_path])

    def backup_settings(self, *args):
        """Backup xlet settings.

        Parameters
        ----------
        *args
            Arguments.
        """
        dialog = Gtk.FileChooserDialog(
            title=_("Select or enter file to export to"),
            action=Gtk.FileChooserAction.SAVE,
            transient_for=self.window,
            use_header_bar=get_global("USE_HEADER_BARS_ON_DIALOGS"),
            buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                     _("_Save"), Gtk.ResponseType.ACCEPT)
        )

        dialog.set_do_overwrite_confirmation(True)
        filter_text = Gtk.FileFilter()
        filter_text.add_pattern("*.json")
        filter_text.set_name(_("JSON files"))
        dialog.add_filter(filter_text)

        response = dialog.run()

        if response == Gtk.ResponseType.ACCEPT:
            filename = dialog.get_filename()

            if ".json" not in filename:
                filename = f"{filename}.json"

            self.selected_instance["settings"].save_to_file(filename)

        dialog.destroy()

    def import_settings(self, *args):
        """Import xlet settings.

        Parameters
        ----------
        *args
            Arguments.
        """
        dialog = Gtk.FileChooserDialog(
            title=_("Select a JSON file to import"),
            action=Gtk.FileChooserAction.OPEN,
            transient_for=self.window,
            use_header_bar=get_global("USE_HEADER_BARS_ON_DIALOGS"),
            buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                     _("_Save"), Gtk.ResponseType.OK)
        )

        filter_text = Gtk.FileFilter()
        filter_text.add_pattern("*.json")
        filter_text.set_name(_("JSON files"))
        dialog.add_filter(filter_text)

        response = dialog.run()

        if response == Gtk.ResponseType.OK:
            filename = dialog.get_filename()
            self.selected_instance["settings"].load_from_file(filename)

        dialog.destroy()

    def reset_settings(self, *args):
        """Reset xlet settings.

        Parameters
        ----------
        *args
            Arguments.
        """
        dialog = Gtk.MessageDialog(
            transient_for=self.window,
            use_header_bar=get_global("USE_HEADER_BARS_ON_DIALOGS"),
            flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
            message_type=Gtk.MessageType.WARNING,
            buttons=Gtk.ButtonsType.YES_NO
        )

        dialog.set_title(_("Trying to reset all settings!!!"))

        msg = escape(_("Reset all settings to their default values?"))
        dialog.set_markup(msg)

        dialog.show_all()
        response = dialog.run()

        if response == Gtk.ResponseType.YES:
            self.selected_instance["settings"].reset_to_defaults()

        dialog.destroy()

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
                proxy.highlightXlet("(ssb)", self.xlet_uuid, self.selected_instance["id"], False)
            except Exception:
                pass

        self.gtk_icon_theme.disconnect(self.gtk_icon_theme_signal)
        self.gtk_app_info_monitor.disconnect(self.gtk_app_info_monitor_signal)

        self.quit()

    def notify_errors(self):
        """Send a desktop notification when non-critical errors are found.

        NOTE
        ----
        The use of ``Notify`` and :any:`Gio.Notification` as a fallback is because
        :any:`Gio.Notification`'s notifications are tied to the :any:`Gtk.Application`
        that sends them (¬¬). If a fatal error occurs after a non-critical, I'm left looking
        at the screen like a moron waiting for the application window to appear. Using
        ``Notify``, I'm informed instantly.
        If (when) ``Notify`` is removed, implement a call to ``notify-send`` and f**k Gtk.
        """
        title = self._get_application_title()
        body = "Errors found while creating widgets. You know what to do."

        try:
            gi.require_version("Notify", "0.7")
            from gi.repository import Notify

            Notify.init(self.application_id)
            notification = Notify.Notification.new(title, body, "dialog-error")
            notification.set_urgency(Notify.Urgency.CRITICAL)
            notification.show()
            print("gi.repository.Notify used.")
        except Exception:
            notification = Gio.Notification.new(title)
            notification.set_icon(Gio.ThemedIcon.new("dialog-error"))
            notification.set_body(body)
            notification.set_priority(Gio.NotificationPriority.URGENT)
            self.send_notification("send-message", notification)
            print("gi.repository.Gio.Notification used.")


def cli(window_definition):
    """CLI interface.

    Parameters
    ----------
    window_definition : WindowDefinition
        The instance of :any:`WindowDefinition` containing the data to generate all window widgets.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument("--xlet-type", dest="xlet_type", default="extension", type=str)
    parser.add_argument("--xlet-instance-id", dest="xlet_instance_id", default="", type=str)
    parser.add_argument("--xlet-uuid", dest="xlet_uuid", default="", type=str)
    parser.add_argument("--app-id", dest="application_id", default="", type=str)
    parser.add_argument("--stack-id", dest="win_initial_stack", default="", type=str)
    # NOTE: I exposed the following arguments mostly for when this framework is used in a
    # "non-standard way". Since I don't have in mind any non-standard implementations,
    # I don't use the arguments, but I will keep them all the same.
    parser.add_argument("--app-title", dest="application_title", default="", type=str)
    parser.add_argument("--win-width", dest="win_initial_width", default=800, type=int)
    parser.add_argument("--win-height", dest="win_initial_height", default=600, type=int)
    parser.add_argument("--debug", dest="debug_mode", action="store_true")
    parser.add_argument("--hide-settings-handling",
                        dest="display_settings_handling", action="store_false")

    args = parser.parse_args()

    kwargs = dict(vars(args), **{
        "window_definition": window_definition
    })

    global MAIN_APP
    MAIN_APP = MainApplication(**kwargs)
    set_global("MAIN_APP", MAIN_APP)
    MAIN_APP.run()


if __name__ == "__main__":
    pass
