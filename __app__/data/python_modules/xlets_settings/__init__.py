#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Cinnamon's xlets settings re-implementation.

Attributes
----------
CINNAMON_VERSION : str
    Cinnamon version.
G_SETTINGS_WIDGETS : TYPE
    Description
GTK_VERSION : str
    Gtk version.
MODULE_PATH : str
    Path to the root of this module.
proxy : object
    See :py:class:`Gio.DBusProxy`.
XLET_SETTINGS_WIDGETS : dict
    Settings widgets map.
"""
import gi
import json
import os
import traceback

gi.require_version("Gdk", "3.0")
gi.require_version("GdkPixbuf", "2.0")
gi.require_version("Gtk", "3.0")

from gi.repository import GLib
from gi.repository import Gdk
from gi.repository import GdkPixbuf
from gi.repository import Gio
from gi.repository import Gtk
from html import escape
from subprocess import check_output
from subprocess import run

from .GSettingsWidgets import *  # noqa
from .JsonSettingsWidgets import *  # noqa
from .common import BaseGrid
from .common import HOME
from .common import _
from .common import compare_version

MODULE_PATH = os.path.dirname(os.path.abspath(__file__))

CINNAMON_VERSION = check_output(
    ["cinnamon", "--version"]
).decode("utf-8").splitlines()[0].split(" ")[1]

GTK_VERSION = "%s.%s" % (
    Gtk.get_major_version(),
    Gtk.get_minor_version()
)

proxy = None

XLET_SETTINGS_WIDGETS = {
    # NOTE: Custom simplified widget.
    "button": "JSONSettingsButton",
    "applist": "JSONSettingsAppList",
    "appchooser": "JSONSettingsAppChooser",
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

G_SETTINGS_WIDGETS = {
    "gcombobox": "GSettingsComboBox",
    "gswitch": "GSettingsSwitch"
}


class SettingsBox(BaseGrid):
    """Settings box.

    Attributes
    ----------
    instance_info : dict
        Xlet instance information.
    main_app : object
        :py:class:`Gtk.Application`.
    stack : object
        :py:class:`Gtk.Stack`.
    timer : int
        Throttle timer.
    xlet_meta : TYPE
        Description
    """

    def __init__(self, pages_definition=[], instance_info={}, main_app=None, xlet_meta=None):
        """Initialization.

        Parameters
        ----------
        pages_definition : list, optional
            The list containing the data to generate all window widgets.
        instance_info : dict, optional
            Xlet instance information.
        main_app : None, optional
            See :py:class:`Gtk.Application`.
        xlet_meta : None, optional
            Description
        """
        super().__init__(orientation=Gtk.Orientation.HORIZONTAL)
        self.set_border_width(0)
        self.set_spacing(0, 0)
        self.set_property("expand", True)
        self.set_property("margin", 0)

        self.timer = None
        self.main_app = main_app
        self.xlet_meta = xlet_meta
        self.instance_info = instance_info

        stack = Gtk.Stack()
        self.stack = stack
        stack.set_transition_type(Gtk.StackTransitionType.SLIDE_UP_DOWN)
        stack.set_transition_duration(150)
        stack.set_property("margin", 0)
        stack.set_property("expand", True)

        create_page_switcher = len(pages_definition) > 1
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
            page = SettingsPage()  # noqa | JsonSettingsWidgets > SettingsWidgets
            page_scrolled_window.add(page)

            section_count = 0

            for section_def in page_def["sections"]:
                # NOTE: Possibility to hide entire sections depending on a condition defined in
                # the widgets definition file.
                if not section_def.get("compatible", True):
                    continue

                if "dependency" in section_def:
                    revealer = JSONSettingsRevealer(  # noqa | JsonSettingsWidgets
                    instance_info["settings"], section_def["dependency"]
                    )
                    section_container = page.add_reveal_section(
                        title=section_def.get("section-title", ""),
                        subtitle=section_def.get("section-subtitle", ""),
                        section_info=section_def.get("section-info", {}),
                        revealer=revealer
                    )
                else:
                    section_container = page.add_section(
                        title=section_def.get("section-title", ""),
                        subtitle=section_def.get("section-subtitle", ""),
                        section_info=section_def.get("section-info", {}),
                    )

                section_widgets = section_def["widgets"]

                for i, widget_def in enumerate(section_widgets):
                    # NOTE: widget_def is modified by adding an instance of JSONSettingsHandler to it.
                    # widget_def is stored in widget_def_clean so it can be used by json.dumps() when
                    # is printed to STDOUT for easy reading.
                    widget_def_clean = widget_def

                    # NOTE: Possibility to hide individual widgets depending on a condition defined in
                    # the widgets definition file.
                    if not widget_def.get("compatible", True):
                        continue

                    try:
                        if widget_def["widget-type"] == "label":
                            widget = Text(**widget_def["widget-kwargs"])  # noqa | JsonSettingsWidgets > SettingsWidgets
                        elif widget_def["widget-type"] in XLET_SETTINGS_WIDGETS:
                            widget_def["widget-attrs"]["settings"] = instance_info["settings"]
                            widget = globals()[XLET_SETTINGS_WIDGETS[widget_def["widget-type"]]](
                                widget_attrs=widget_def["widget-attrs"], widget_kwargs=widget_def["widget-kwargs"])

                            if (widget_def["widget-type"] == "list" or widget_def["widget-type"] == "iconfilechooser") and main_app is not None:
                                widget.main_app = main_app
                        elif widget_def["widget-type"] in G_SETTINGS_WIDGETS:
                            widget_def["widget-attrs"]["xlet_meta"] = self.xlet_meta
                            widget = globals()[G_SETTINGS_WIDGETS[widget_def["widget-type"]]](
                                widget_attrs=widget_def["widget-attrs"], widget_kwargs=widget_def["widget-kwargs"])
                        else:
                            continue
                    except Exception:
                        print("Widget definition")

                        try:
                            print(json.dumps(widget_def_clean, indent=4))
                        except Exception:
                            print(widget_def_clean)

                        print(traceback.format_exc())
                        continue

                    if widget_def["widget-type"] == "list":
                        widget.fill_row()
                    else:
                        widget.set_border_width(5)
                        widget.set_margin_start(15)
                        widget.set_margin_end(15)

                    if widget_def["widget-type"] == "button":
                        col_span = 2
                    else:
                        col_span = 1

                    if "dependency" in widget_def["widget-kwargs"]:
                        revealer = JSONSettingsRevealer(  # noqa | JsonSettingsWidgets
                            instance_info["settings"], widget_def["widget-kwargs"]["dependency"])
                        section_container.add_reveal_row(
                            widget, 0, i + 1, col_span, 1, revealer=revealer)
                    else:
                        section_container.add_row(widget, 0, i + 1, col_span, 1)

                section_count += 1

                for note in section_def.get("section-notes", []):
                    section_container.add_note(note)

                if len(page_def["sections"]) != section_count:
                    section_container.add(Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL))

            page_count += 1
            stack.add_titled(page_scrolled_window, "stack_id_%d" %
                             page_count, page_def["page-title"])

        if create_page_switcher:
            page_switcher = Gtk.StackSidebar()
            style_context = page_switcher.get_style_context()
            # Mark for deletion on EOL. Gtk 3.18.
            # Remove class definition.
            style_context.add_class("cinnamon-xlet-settings-app-sidebar")
            page_switcher.set_stack(stack)
            self.add(page_switcher)
            stack.connect("notify::visible-child", self.on_stack_switcher_changed)

        self.add(stack)

        self.show_all()

    def on_stack_switcher_changed(self, *args):
        """Highlight applet on demand.

        Parameters
        ----------
        *args
            Arguments.
        """
        # NOTE: This bit me in the arse real good!!! LOL
        # Without the throttle, and connecting only the "notify" signal to the stack, the
        # on_stack_switcher_changed method was triggered like 5 times and it always stored
        # the wrong value to self.main_app.win_stacks_state.
        # With the "notify::visible-child" signal connected, on_stack_switcher_changed triggers
        # automatically only once when the stack is created and the first child is selected,
        # and immediately again, if needed, to select the child name stored in
        # self.main_app.win_stacks_state. The second call will cancel the first and then store what was
        # stored (Yeah, I know! ¬¬). Successive changes to the visible children (selecting items
        # in the sidebar) will trigger on_stack_switcher_changed and store the correct ID (hopefully).

        def apply(self):
            """Apply.
            """
            self.main_app.win_stacks_state[self.instance_info["id"]
                                           ] = self.stack.get_visible_child_name()
            self.timer = None

        if self.timer:
            GLib.source_remove(self.timer)

        self.timer = GLib.timeout_add(500, apply, self)

    def get_page_stack(self):
        """Get stack switcher.

        Returns
        -------
        Gtk.StackSwitcher
            The Gtk.StackSwitcher used to switch pages.
        """
        return self.stack


class MainApplication(Gtk.Application):
    """Main application.

    Attributes
    ----------
    all_instances_info : list
        Storage for all xlets instances information.
    app_image : object
        See :py:class:`Gtk.Button`.
    application_id : str
        A base application ID that will be used to generate the real application ID.
    application_title : str
        A custom application title.
    cinnamon_gsettings : object
        See :py:class:`Gio.Settings`.
    display_settings_handling : bool
        Whether to display settings handler item in the header bar menu.
    gtk_icon_theme : TYPE
        Description
    gtk_icon_theme_changed : bool
        Description
    header_bar : object
        See :py:class:`Gtk.HeaderBar`.
    help_file_path : str
        Path to the xlet help file.
    icon_chooser_icons : TYPE
        Description
    icon_chooser_store : TYPE
        Description
    instance_stack : object
        See :py:class:`Gtk.Stack`.
    instance_switcher : object
        See :py:class:`Gtk.StackSwitcher`.
    instance_switcher_box : object
        See :py:class:`BaseGrid`.
    legacy_xlet_highlighting : bool
        Whether to use the "old way" of highlighting an xlet instance.
    next_button : object
        See :py:class:`Gtk.Button`.
    pages_definition : list
        The list containing the data to generate all window widgets.
    prev_button : object
        See :py:class:`Gtk.Button`.
    selected_instance : dict
        The information of the currently selected instance.
    win_current_height : int
        Window current height.
    win_current_width : int
        Window current width.
    win_initial_height : int
        Window initial height.
    win_initial_stack : TYPE
        Description
    win_initial_width : int
        Window initial width.
    win_is_maximized : bool
        Whether the window is maximized.
    win_stacks_state : dict
        The name of each selected stack of each xlet instance.
    win_state_cache_file : str
        Path to the file where the window state is stored.
    window : object
        See :py:class:`Gtk.ApplicationWindow`.
    xlet_dir : str
        Path to where the xlet is installed.
    xlet_help_file_exists : bool
        Whether the HELP.html file inside an xlet directory exist.
    xlet_icon_path : str
        Path to a file called icon.svg (or icon.png) inside an xlet folder.
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
    _required_args = {
        "application_id",
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

        if not self._required_args.issubset(kwargs_keys):
            raise SystemExit("Missing required arguments: %s" %
                             ", ".join(list(self._required_args.difference(kwargs_keys))))

        # kwargs attributes.
        self.application_id = ""
        self.display_settings_handling = True
        self.application_title = ""
        self.pages_definition = []
        self.win_initial_height = 600
        self.win_initial_width = 800
        self.win_initial_stack = None
        self.xlet_dir = ""
        self.xlet_instance_id = ""
        self.xlet_type = ""
        self.xlet_uuid = ""
        # Other attributes.
        self.selected_instance = None
        self.gtk_icon_theme_changed = False
        self.icon_chooser_store = Gtk.ListStore(str, str)
        self.icon_chooser_icons = dict()
        self.cinnamon_gsettings = Gio.Settings.new("org.cinnamon")
        self.all_instances_info = []
        self.gtk_icon_theme = Gtk.IconTheme.get_default()
        self.gtk_icon_theme.connect("changed", self.on_gtk_icon_theme_changed)
        # NOTE: Append the "icons" folder found in the framework.
        self.gtk_icon_theme.append_search_path(os.path.join(MODULE_PATH, "icons"))

        # Mark for deletion on EOL. Cinnamon 3.2.x+
        # See where this property is used.
        self.legacy_xlet_highlighting = compare_version(CINNAMON_VERSION, "3.2.0") < 0

        for key, value in kwargs.items():
            setattr(self, key, value)

        if not self.xlet_instance_id:
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

    def on_gtk_icon_theme_changed(self, *args):
        """Summary

        Parameters
        ----------
        *args
            Arguments.
        """
        self.gtk_icon_theme_changed = True

    def init_icon_chooser_data(self):
        """Initialize icon chooser data.

        This data is generated and stored in :any:`MainApplication` so the
        tasks aren't performed for each :any:`IconChooserDialog` created.
        """
        if not self.gtk_icon_theme_changed:
            self.icon_chooser_store.clear()
            self.icon_chooser_icons.clear()

            icon_contexts = [[_(context), context]
                             for context in self.gtk_icon_theme.list_contexts()]
            icon_contexts.sort()

            all_icons_set = set(self.gtk_icon_theme.list_icons(None))

            for l, context in icon_contexts:
                icons = self.gtk_icon_theme.list_icons(context)
                self.icon_chooser_icons[context] = icons
                all_icons_set = all_icons_set - set(icons)

            other_icons = list(all_icons_set)
            other_icons.sort()

            icon_contexts += [[_("Other"), "other"]]

            self.icon_chooser_icons["other"] = other_icons

            for ctx in icon_contexts:
                self.icon_chooser_store.append(ctx)

            self.gtk_icon_theme_changed = True

    def load_xlet_data(self):
        """Load xlet data.
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
        config_path = "%s/.cinnamon/configs/%s" % (HOME, self.xlet_uuid)
        instances = 0
        config_files = sorted([entry.name for entry in os.scandir(
            config_path) if entry.is_file(follow_symlinks=False) and entry.name.endswith(".json")])

        multi_instance = int(self.xlet_meta.get("max-instances", 1)) != 1
        multiple_pages = len(self.pages_definition) > 1

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
                enabled_xlets = self.cinnamon_gsettings.get_strv("enabled-%ss" % self.xlet_type)

                for xlet_def in enabled_xlets:
                    if self.xlet_uuid in xlet_def and instance_id in xlet_def.split(":"):
                        instance_exists = True
                        break

                if not instance_exists:
                    continue

            settings = JSONSettingsHandler(  # noqa | JsonSettingsWidgets
                filepath=os.path.join(config_path, item),
                xlet_meta=self.xlet_meta
            )
            settings.instance_id = instance_id

            instance_info = {
                "settings": settings,
                "id": instance_id,
                "uuid": self.xlet_uuid,
                "stack": SettingsStack() if multiple_pages else None  # noqa | JsonSettingsWidgets > SettingsWidgets
            }

            instance_box = SettingsBox(pages_definition=self.pages_definition,
                                       instance_info=instance_info,
                                       main_app=self,
                                       xlet_meta=self.xlet_meta)

            self.all_instances_info.append(instance_info)
            self.instance_stack.add_named(instance_box, instance_id)

            if self.selected_instance is None:
                self.selected_instance = instance_info

                if "stack" in instance_info:
                    self.instance_switcher.set_stack(instance_info["stack"])

            instances += 1

        if instances < 2:
            self.app_image.show()
            self.instance_switcher_box.set_no_show_all(True)
            self.instance_switcher_box.hide()
        else:
            self.app_image.set_no_show_all(True)
            self.app_image.hide()
            self.instance_switcher_box.show()

        self.set_visible_stack_for_page()

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

        self.instance_switcher = Gtk.StackSwitcher()

        self.instance_switcher_box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        self.instance_switcher_box.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED)

        self.prev_button = Gtk.Button.new_from_icon_name(
            "go-previous-symbolic", Gtk.IconSize.BUTTON)
        self.prev_button.set_tooltip_text(_("Previous instance"))
        self.instance_switcher_box.add(self.prev_button)

        self.instance_switcher_box.add(self.instance_switcher)

        self.next_button = Gtk.Button.new_from_icon_name(
            "go-next-symbolic", Gtk.IconSize.BUTTON)
        self.next_button.set_tooltip_text(_("Next instance"))
        self.instance_switcher_box.add(self.next_button)

        self.header_bar = Gtk.HeaderBar()
        self.header_bar.set_show_close_button(True)

        res, width, height = Gtk.IconSize.lookup(Gtk.IconSize.BUTTON)
        pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_size(
            self.xlet_icon_path,
            width if res else 16,
            height if res else 16
        )
        image = Gtk.Image.new_from_pixbuf(pixbuf)
        self.app_image = Gtk.Button(image=image)
        self.app_image.set_sensitive(False)
        # NOTE: Set of a custom class to override the insensitive/disabled styling.
        self.app_image.get_style_context().add_class("cinnamon-xlet-settings-app-title-button")
        self.app_image.set_property("can_default", False)
        self.app_image.set_property("receives_default", False)
        self.app_image.set_property("can_focus", False)
        self.app_image.set_property("relief", Gtk.ReliefStyle.NONE)

        self.header_bar.pack_start(self.app_image)
        self.header_bar.pack_start(self.instance_switcher_box)
        self.header_bar.set_title(self._get_application_title())

        main_box = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        main_box.set_spacing(0, 0)
        main_box.set_property("margin", 0)

        self.instance_stack = Gtk.Stack()
        main_box.add(self.instance_stack)

        if self.xlet_help_file_exists or self.display_settings_handling:
            add_separator = False
            menu_popup = Gtk.Menu()
            menu_popup.set_halign(Gtk.Align.END)

            if self.display_settings_handling:
                menu_popup.append(
                    self.create_menu_item(text=_("Import settings from a file"),
                                          callback=self.restore_settings)
                )
                menu_popup.append(
                    self.create_menu_item(text=_("Export settings to a file"),
                                          callback=self.backup_settings)
                )
                menu_popup.append(
                    self.create_menu_item(text=_("Reset settings to defaults"),
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
                "open-menu-symbolic", Gtk.IconSize.BUTTON
            ))

            self.header_bar.pack_end(menu_button)

        # Mark for deletion on EOL. Cinnamon 3.2.x+
        # Remove check and button.
        if self.legacy_xlet_highlighting and self.xlet_type != "extension":
            highlight_button = Gtk.Button()
            highlight_button.add(Gtk.Image.new_from_icon_name(
                "software-update-available-symbolic", Gtk.IconSize.BUTTON
            ))
            highlight_button.set_tooltip_text(
                _("Momentarily highlight the %s on your desktop") % self.xlet_type)
            highlight_button.connect("clicked", self.on_highlight_button_clicked)
            self.header_bar.pack_end(highlight_button)

        self.window.set_titlebar(self.header_bar)
        self.window.add(main_box)
        self.window.connect("destroy", self.on_quit)
        self.window.connect("size-allocate", self.on_size_allocate_cb)
        self.window.connect("window-state-event", self.on_window_state_event_cb)
        self.prev_button.connect("clicked", self.previous_instance)
        self.next_button.connect("clicked", self.next_instance)

    def _set_win_subtitle(self):
        """Set window subtitle.
        """
        if self.selected_instance["id"] == self.xlet_uuid:
            self.header_bar.set_subtitle(self.selected_instance["id"])
        else:
            self.header_bar.set_subtitle("%s - %s" % (self.xlet_uuid, self.selected_instance["id"]))

    def load_css(self):
        """Load CSS.
        """
        css_provider = Gtk.CssProvider()
        # css_provider.load_from_path(
        #     os.path.join(XLET_DIR, "stylesheet.css"))
        # Loading from data so I don't have to deal with a style sheet file
        # with just a couple of lines of code.
        css_provider.load_from_data(str.encode(
            # Mark for deletion on EOL. Gtk 3.18.
            # Remove comparison and leave only newer Gtk version code.
            # NOTE: The .cinnamon-xlet-settings-app-sidebar .sidebar-item > .label
            # selector is to enforce a padding to a Gtk.ListBox() that it is used
            # as a sidebar. Without the padding, scrollbars will cover part of the
            # sidebar items label.
            """
            .cinnamon-xlet-settings-app-sidebar .sidebar-item > .label {
                padding-left: 6px;
                padding-right: 6px;
            }
            .cinnamon-xlet-settings-app-title-button GtkImage:insensitive {
                opacity: 1;
                -gtk-image-effect: none;
            }
            """ if compare_version(GTK_VERSION, "3.22") < 0 else """
            .cinnamon-xlet-settings-app-title-button image:disabled {
                opacity: 1;
                -gtk-icon-effect: none;
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

    def _on_proxy_ready(self, obj, result, data=None):
        """Define proxy on proxy ready.

        Parameters
        ----------
        obj : object
            See :py:class:`Gio.DBusProxy`.
        result : object
            See :py:class:`Gio.Task`.
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
                proxy.highlightXlet("(ssb)", self.xlet_uuid, self.selected_instance["id"], True)
            except Exception:
                try:
                    proxy.highlightApplet("(ss)", self.xlet_uuid, self.selected_instance["id"])
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
        """
        self.load_css()

        Gtk.Application.do_startup(self)
        self._load_window_state()
        self.build_window()
        self.load_instances()

        if self.xlet_instance_id and len(self.all_instances_info) > 1:
            for instance_info in self.all_instances_info:
                if instance_info["id"] == self.xlet_instance_id:
                    self.set_instance(instance_info)
                    break

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

    def on_size_allocate_cb(self, window, *args):
        """Save window state and size in size-allocate signal.

        Parameters
        ----------
        window : object
            See :py:class:`Gtk.ApplicationWindow`.
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
        window : object
            See :py:class:`Gtk.ApplicationWindow`.
        event : object
            See :py:class:`Gdk.EventWindowState`.
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
            See :py:class:`Gtk.MenuItem`.
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

        if "stack" in instance_info:
            self.instance_switcher.set_stack(instance_info["stack"])

            children = instance_info["stack"].get_children()

            if len(children) > 1:
                instance_info["stack"].set_visible_child(children[0])

        # NOTE: This has to be done BEFORE storing the new instance because it has to remove the
        # highlighting of the currently highlighted xlet, highlight the one that's going to be
        # the selected instance and then set the selected instance.
        try:
            # Mark for deletion on EOL. Cinnamon 3.2.x+
            # Remove check for legacy highlighting (or update it).
            if not self.legacy_xlet_highlighting and self.xlet_type != "extension" and proxy:
                proxy.highlightXlet("(ssb)", self.xlet_uuid, self.selected_instance["id"], False)
                proxy.highlightXlet("(ssb)", self.xlet_uuid, instance_info["id"], True)
        except Exception:
            pass

        self.selected_instance = instance_info
        self._set_win_subtitle()
        self.set_visible_stack_for_page()

        # NOTE: This has to be done AFTER storing the new instance.
        # Mark for deletion on EOL. Cinnamon 3.2.x+
        # Remove call.
        self.on_highlight_button_clicked()

    def set_visible_stack_for_page(self):
        """Set visible stack for page.
        """
        if self.selected_instance["id"] in self.win_stacks_state or self.win_initial_stack:
            # NOTE: Keep the try/catch block!!!
            # When I add/remove pages to an xlet settings page, the already stored
            # stacks IDs might not exist. In which case, the first stack is always selected.
            try:
                instance_stack = self.instance_stack.get_visible_child()
                page_stack = instance_stack.get_page_stack()
                page = page_stack.get_child_by_name(
                    self.win_initial_stack if
                    self.win_initial_stack else
                    self.win_stacks_state[self.selected_instance["id"]]
                )

                if page is not None:
                    page_stack.set_visible_child(page)
            except Exception as err:
                print(err)

            self.win_initial_stack = None

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
        dialog = Gtk.FileChooserDialog(title=_("Select or enter file to export to"),
                                       action=Gtk.FileChooserAction.SAVE,
                                       transient_for=self.window,
                                       use_header_bar=True,
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

            self.selected_instance["settings"].save_to_file(filename)

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
                                       use_header_bar=True,
                                       buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                                                _("_Save"), Gtk.ResponseType.OK))

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
        dialog = Gtk.MessageDialog(transient_for=self.window,
                                   flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
                                   message_type=Gtk.MessageType.WARNING,
                                   buttons=Gtk.ButtonsType.YES_NO)

        dialog.set_title(_("Trying to reset all settings!!!"))

        msg = escape(_("Reset all settings to their default values?"))
        dialog.set_markup(msg)

        dialog.show_all()
        response = dialog.run()

        if response == Gtk.ResponseType.YES:
            self.selected_instance["settings"].reset_to_defaults()

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
        if proxy and self.legacy_xlet_highlighting:
            try:
                proxy.highlightApplet("(ss)", self.xlet_uuid, self.selected_instance["id"])
            except Exception:
                pass

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

        self.quit()


if __name__ == "__main__":
    pass
