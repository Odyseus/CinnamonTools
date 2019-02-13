#!/usr/bin/python3
# -*- coding: utf-8 -*-

import gi
import json
import os
import sys

from subprocess import run

gi.require_version("Gtk", "3.0")

from gi.repository import GLib
from gi.repository import Gio
from gi.repository import Gtk

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))

if XLET_DIR not in sys.path:
    sys.path.insert(0, XLET_DIR)

from python import widgets

HOME = widgets.HOME

_ = widgets._

APPLICATION_ID = "org.Cinnamon.Applets.WeatherApplet.LocationsManager"

COLUMNS = [{
    "id": "locationName",
    "title": _("Location name"),
    "expand-width": True,
    "type": "string"
}, {
    "id": "locationID",
    "title": _("Location ID"),
    "expand-width": True,
    "type": "string"
},
    {
    "id": "languageID",
    "title": _("Language"),
    "type": "string",
    "default": "en",
    "options": [
        "ar",
        "az",
        "be",
        "bg",
        "bn",
        "bs",
        "ca",
        "cs",
        "cz",
        "da",
        "de",
        "el",
        "en",
        "eo",
        "es",
        "et",
        "fa",
        "fi",
        "fr",
        "gl",
        "he",
        "hi",
        "hr",
        "hu",
        "id",
        "is",
        "it",
        "ja",
        "ka",
        "ko",
        "kr",
        "kw",
        "la",
        "lt",
        "lv",
        "mk",
        "nl",
        "no",
        "pl",
        "pt",
        "ro",
        "ru",
        "se",
        "sk",
        "sl",
        "sr",
        "sv",
        "ta",
        "te",
        "tet",
        "tr",
        "ua",
        "uk",
        "vi",
        "x-pig-latin",
        "zh",
        "zh-tw",
        "zh_cn",
        "zh_tw",
    ]
}, {
    "id": "forecastDays",
    "title": _("Fore. days"),
    "type": "integer",
    "col-resize": False,
    "default": 5,
    "min": 1,
    "max": 10,
    "step": 1,
    "units": _("days")
}, {
    "id": "forecastRowsCols",
    "title": _("Fore. rows/cols"),
    "type": "integer",
    "col-resize": False,
    "default": 1,
    "min": 1,
    "max": 2,
    "step": 1,
    "units": _("rows/cols")
}, {
    "id": "providerID",
    "title": _("Provider"),
    "type": "string",
    "default": "YahooWeather",
    "options": [
        "DarkSky",
        "OpenWeatherMap",
        "YahooWeather"
    ]
}]

LOCATIONS_TAB = {
    "page-title": _("Locations"),
    "sections": [{
        "section-title": _("Locations"),
        "widgets": [{
            "widget-type": "list",
            "args": {
                "pref_key": "pref_locations_storage",
                "apply_key": "trigger_reload_locations",
                "imp_exp_path_key": "pref_imp_exp_last_selected_directory",
                "properties": {
                    "columns": COLUMNS,
                    "height": 250,
                    "move-buttons": False
                }
            }
        }]
    }]
}

CREDENTIALS_TAB = {
    "page-title": _("Credentials"),
    "sections": [{
        "section-title": _("Dark Sky"),
        "widgets": [{
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_darksky_credential_app_id",
                "properties": {
                    "description": "App ID",
                    "expand-width": True
                }
            }
        }]
    }, {
        "section-title": _("OpenWeatherMap"),
        "widgets": [{
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_open_weather_map_credential_app_id",
                "properties": {
                    "description": "App ID",
                    "expand-width": True
                }
            }
        }]
    }, {
        "section-title": _("Yahoo! Weather"),
        "widgets": [{
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_yahoo_credential_app_id",
                "properties": {
                    "description": "App ID",
                    "expand-width": True
                }
            }
        }, {
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_yahoo_credential_client_id",
                "properties": {
                    "description": "Client ID (Consumer Key)",
                    "expand-width": True
                }
            }
        }, {
            "widget-type": "entry",
            "args": {
                "pref_key": "pref_yahoo_credential_client_secret",
                "properties": {
                    "description": "Client Secret (Consumer Secret)",
                    "expand-width": True
                }
            }
        }]
    }]
}


PAGES_OBJECT = [
    LOCATIONS_TAB,
    CREDENTIALS_TAB
]


class WeatherLocationsManagerWindow(Gtk.ApplicationWindow):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.set_default_size(800, 420)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.set_icon_from_file(os.path.join(app.xlet_dir, "icon.png"))


class WeatherLocationsManagerApplication(Gtk.Application):

    def __init__(self, *args, **kwargs):
        self.type = "applet"
        self.uuid = "{{UUID}}"
        self.selected_instance = None
        self.gsettings = Gio.Settings.new("org.cinnamon")
        self.load_xlet_data()
        self.load_instance()

        GLib.set_application_name(self.xlet_meta["name"])
        super().__init__(*args,
                         application_id="%s-%s" % (APPLICATION_ID, INSTANCE_ID),
                         flags=Gio.ApplicationFlags.FLAGS_NONE,
                         **kwargs)

        self.application = Gtk.Application()
        self.application.connect("activate", self.do_activate)
        self.application.connect("startup", self.do_startup)

    def do_activate(self, data=None):
        self.window.present()

    def do_startup(self, data=None):
        Gtk.Application.do_startup(self)
        self._buildUI()

    def _buildUI(self):
        self.window = WeatherLocationsManagerWindow(application=self,
                                                    title=_(self.xlet_meta["name"]))
        self.window.connect("destroy", self.on_quit)

        settings_box = widgets.SettingsBox(pages_object=PAGES_OBJECT,
                                           settings=self.settings,
                                           app_window=self.window)

        main_box = widgets.BaseGrid()
        main_box.set_spacing(0, 0)
        main_box.set_property("margin", 0)
        self.window.add(main_box)

        toolbar = Gtk.Toolbar()
        toolbar.get_style_context().add_class("primary-toolbar")
        main_box.add(toolbar)

        toolitem = Gtk.ToolItem()
        toolitem.set_expand(True)
        toolbar.add(toolitem)

        self.toolbar_box = widgets.BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        self.toolbar_box.set_spacing(0, 0)
        toolbar_box_scrolledwindow = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
        toolbar_box_scrolledwindow.set_policy(hscrollbar_policy=Gtk.PolicyType.AUTOMATIC,
                                              vscrollbar_policy=Gtk.PolicyType.NEVER)
        toolbar_box_scrolledwindow.add(self.toolbar_box)
        toolitem.add(toolbar_box_scrolledwindow)

        dummy_grid_1 = widgets.BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        dummy_grid_1.set_property("hexpand", True)
        self.toolbar_box.attach(dummy_grid_1, 0, 0, 1, 1)

        self.toolbar_box.attach(settings_box.get_stack_switcher(), 1, 0, 1, 1)

        dummy_grid_2 = widgets.BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        dummy_grid_2.set_property("hexpand", True)
        self.toolbar_box.attach(dummy_grid_2, 2, 0, 1, 1)

        menu_popup = Gtk.Menu()
        menu_popup.set_halign(Gtk.Align.END)
        # menu_popup.append(self.create_menu_item(_("Reset settings to defaults"),
        #                                         self._restore_default_values))
        # menu_popup.append(self.create_menu_item(_("Import settings from a file"),
        #                                         self._import_export_settings, False))
        # menu_popup.append(self.create_menu_item(_("Export settings to a file"),
        #                                         self._import_export_settings, True))
        # menu_popup.append(Gtk.SeparatorMenuItem())

        menu_popup.append(self.create_menu_item(text=_("Help"),
                                                callback=self.open_help_page))
        # menu_popup.append(self.create_menu_item(text=_("About"),
        #                                         callback=self.open_about_dialog))

        menu_popup.show_all()
        menu_button = Gtk.MenuButton()
        menu_button.set_popup(menu_popup)
        menu_button.add(Gtk.Image.new_from_icon_name(
            "open-menu-symbolic", Gtk.IconSize.SMALL_TOOLBAR))

        self.toolbar_box.attach(menu_button, 3, 0, 1, 1)

        main_boxscrolledwindow = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
        main_boxscrolledwindow.set_policy(hscrollbar_policy=Gtk.PolicyType.NEVER,
                                          vscrollbar_policy=Gtk.PolicyType.AUTOMATIC)
        main_boxscrolledwindow.set_shadow_type(type=Gtk.ShadowType.ETCHED_IN)
        main_boxscrolledwindow.add(settings_box)

        main_box.add(main_boxscrolledwindow)

        self.window.show_all()

    def create_menu_item(self, text, callback, *args):
        item = Gtk.MenuItem(text)

        if (callback is not None):
            item.connect("activate", callback, *args)

        return item

    def open_help_page(self, widget):
        run(("xdg-open", os.path.join(XLET_DIR, "HELP.html")))

    def load_xlet_data(self):
        self.xlet_dir = "/usr/share/cinnamon/%ss/%s" % (self.type, self.uuid)
        if not os.path.exists(self.xlet_dir):
            self.xlet_dir = "%s/.local/share/cinnamon/%ss/%s" % (HOME, self.type, self.uuid)

        if os.path.exists("%s/metadata.json" % self.xlet_dir):
            raw_data = open("%s/metadata.json" % self.xlet_dir).read()
            self.xlet_meta = json.loads(raw_data)
        else:
            print("Could not find %s metadata for uuid %s - are you sure it's installed correctly?" %
                  (self.type, self.uuid))
            quit()

        Gtk.IconTheme.get_default().append_search_path(os.path.join(self.xlet_dir, "icons"))

    def load_instance(self):
        path = "%s/.cinnamon/configs/%s" % (HOME, self.uuid)
        self.settings = widgets.JSONSettingsHandler(os.path.join(path, "%s.json" % INSTANCE_ID))

    def on_quit(self, action):
        self.quit()


if __name__ == "__main__":
    try:
        arg = sys.argv[1]
    except Exception:
        arg = None

    global INSTANCE_ID
    INSTANCE_ID = arg

    app = WeatherLocationsManagerApplication()
    app.run()
