#!/usr/bin/python3
# -*- coding: utf-8 -*-
import argparse
import gettext
import gi
import json
import os

gi.require_version("Gtk", "3.0")
gi.require_version("Gdk", "3.0")

from copy import deepcopy
from datetime import datetime
from gi.repository import GLib
from gi.repository import GObject
from gi.repository import Gdk
from gi.repository import Gio
from gi.repository import Gtk
from gi.repository import Pango
from htnl import escape
from time import time

from python_modules.html_tags_stripper import strip_html_tags

HOME = os.path.expanduser("~")

gettext.bindtextdomain("{{UUID}}", HOME + "/.local/share/locale")
gettext.textdomain("{{UUID}}")
_ = gettext.gettext

XLET_DIR = os.path.dirname(os.path.abspath(__file__))
APPLICATION_ID = "org.Cinnamon.Extensions.MultiTranslator.TranslationHistory"
APPLICATION_TITLE = _("Multi Translator history")
# NOTE: Keep in sync with constants.js:HISTORY_FILE_VERSION
HISTORY_FILE_VERSION = 2
# NOTE: Store and reuse. It's pointless to calculate the date for each entry
# since they will have a difference of a couple of milliseconds and then
# displayed using only seconds.
CURRENT_DATE_TIME = round(time(), 3)
HISTORY_FILE_PATH = os.path.join(HOME, ".cinnamon", "configs",
                                 "{{UUID}}-History", "translation_history.json")

swap = 1
ok = -1
equal = 0


LANGUAGES_LIST = {
    "auto": _("Detect language"),
    "?": _("Unknown"),
    "af": _("Afrikaans"),
    "am": _("Amharic"),
    "ar": _("Arabic"),
    "az": _("Azerbaijani"),
    "be": _("Belarusian"),
    "bg": _("Bulgarian"),
    "bn": _("Bengali"),
    "bs": _("Bosnian (Y)"),
    "ca": _("Catalan"),
    "ceb": _("Chichewa"),
    "co": _("Corsican"),
    "cs": _("Czech"),
    "cy": _("Welsh"),
    "da": _("Danish"),
    "de": _("German"),
    "el": _("Greek"),
    "en": _("English"),
    "eo": _("Esperanto"),
    "es": _("Spanish"),
    "et": _("Estonian"),
    "eu": _("Basque"),
    "fa": _("Persian"),
    "fi": _("Finnish"),
    "fr": _("French"),
    "fy": _("Frisian"),
    "ga": _("Irish"),
    "gd": _("Scots Gaelic"),
    "gl": _("Galician"),
    "gu": _("Gujarati"),
    "ha": _("Hausa"),
    "haw": _("Hawaiian"),
    "he": _("Hebrew (Y)"),
    "hi": _("Hindi"),
    "hmn": _("Hmong"),
    "hr": _("Croatian"),
    "ht": _("Haitian Creole"),
    "hu": _("Hungarian"),
    "hy": _("Armenian"),
    "id": _("Indonesian"),
    "ig": _("Igbo"),
    "is": _("Icelandic"),
    "it": _("Italian"),
    "iw": _("Hebrew"),
    "ja": _("Japanese"),
    "jw": _("Javanese"),
    "ka": _("Georgian"),
    "kk": _("Kazakh"),
    "km": _("Khmer"),
    "kn": _("Kannada"),
    "ko": _("Korean"),
    "ku": _("Kurdish (Kurmanji)"),
    "ky": _("Kyrgyz"),
    "la": _("Latin"),
    "lb": _("Luxembourgish"),
    "lo": _("Lao"),
    "lt": _("Lithuanian"),
    "lv": _("Latvian"),
    "mg": _("Malagasy"),
    "mi": _("Maori"),
    "mk": _("Macedonian"),
    "ml": _("Malayalam"),
    "mn": _("Mongolian"),
    "mr": _("Marathi"),
    "ms": _("Malay"),
    "mt": _("Maltese"),
    "my": _("Myanmar (Burmese)"),
    "ne": _("Nepali"),
    "nl": _("Dutch"),
    "no": _("Norwegian"),
    "ny": _("Cebuano"),
    "pa": _("Punjabi"),
    "pl": _("Polish"),
    "ps": _("Pashto"),
    "pt": _("Portuguese"),
    "ro": _("Romanian"),
    "ru": _("Russian"),
    "sd": _("Sindhi"),
    "si": _("Sinhala"),
    "sk": _("Slovak"),
    "sl": _("Slovenian"),
    "sm": _("Samoan"),
    "sn": _("Shona"),
    "so": _("Somali"),
    "sq": _("Albanian"),
    "sr": _("Serbian"),
    "st": _("Sesotho"),
    "su": _("Sundanese"),
    "sv": _("Swedish"),
    "sw": _("Swahili"),
    "ta": _("Tamil"),
    "te": _("Telugu"),
    "tg": _("Tajik"),
    "th": _("Thai"),
    "tl": _("Filipino"),
    "tr": _("Turkish"),
    "uk": _("Ukrainian"),
    "ur": _("Urdu"),
    "uz": _("Uzbek"),
    "vi": _("Vietnamese"),
    "xh": _("Xhosa"),
    "yi": _("Yiddish"),
    "yo": _("Yoruba"),
    "zh": _("Chinese (Y)"),
    "zh-CN": _("Chinese Simplified"),
    "zh-TW": _("Chinese Traditional"),
    "zu": _("Zulu")
}


def sanitize_entry(version, entry):
    # NOTE: The date in version 1 of the history was stored as a custom formatted
    # date string (Yes! I'm a dumb arse!!! LOL).
    # It's just impossible to convert it to time, so set to the current date and move on.
    if version == 1 and isinstance(entry["d"], str):
        entry["d"] = CURRENT_DATE_TIME

    return entry


def merge_history(target, source):
    merged_history = deepcopy(target)
    dst_version = source.pop("__version__", HISTORY_FILE_VERSION)

    for source_lang, source_entries in source.items():
        if source_lang not in target:
            merged_history[source_lang] = {}

        for src_text, entry in source_entries.items():
            # NOTE: The source text has to be stripped of HTML markup. So, delete the
            # original entry and add the new one with stripped markup.
            try:
                del merged_history[source_lang][src_text]
            except Exception:
                pass

            src_text = strip_html_tags(src_text)

            merged_history[source_lang][src_text] = sanitize_entry(
                dst_version, entry)

    return merged_history


def sanitize_history(transient_for=None):
    dialog = Gtk.MessageDialog(transient_for=transient_for,
                               modal=False,
                               message_type=Gtk.MessageType.WARNING,
                               buttons=Gtk.ButtonsType.YES_NO)

    dialog.set_title(_("History file sanitation"))

    msg = [
        "<b>%s</b>" % escape(
            _("It is recommended to perform a backup of the history file before continuing.")),
        escape(_("Proceed anyways?")),
    ]
    dialog.set_markup("\n".join(msg))
    dialog.show_all()
    response = dialog.run()
    dialog.destroy()

    if response == Gtk.ResponseType.YES and os.path.exists(HISTORY_FILE_PATH):
        try:
            dummy = {
                "__version__": HISTORY_FILE_VERSION
            }

            with open(HISTORY_FILE_PATH, "r", encoding="UTF-8") as history_file:
                dirty_history = json.loads(history_file.read())

            sanitized_history = merge_history(dummy, dirty_history)

            with open(HISTORY_FILE_PATH, "w", encoding="UTF-8") as history_file:
                history_file.write(json.dumps(sanitized_history))

            return True
        except Exception as err:
            print(err)

    return False


def import_export(parent, type, last_dir):
    if type == "export":
        mode = Gtk.FileChooserAction.SAVE
        string = _("Select or enter file to export to")
        btns = (_("_Cancel"), Gtk.ResponseType.CANCEL,
                _("_Save"), Gtk.ResponseType.ACCEPT)
    elif type == "import":
        mode = Gtk.FileChooserAction.OPEN
        string = _("Select a file to import")
        btns = (_("_Cancel"), Gtk.ResponseType.CANCEL,
                _("_Open"), Gtk.ResponseType.OK)

    dialog = Gtk.FileChooserDialog(transient_for=parent.get_toplevel(),
                                   title=string,
                                   action=mode,
                                   buttons=btns)

    if last_dir is not None:
        dialog.set_current_folder(last_dir)

    if type == "export":
        dialog.set_do_overwrite_confirmation(True)

    filter_text = Gtk.FileFilter()
    filter_text.add_pattern("*.json")
    filter_text.set_name(_("JSON files"))

    dialog.add_filter(filter_text)

    filepath = None
    response = dialog.run()

    if response == Gtk.ResponseType.ACCEPT or response == Gtk.ResponseType.OK:
        filepath = dialog.get_filename()

        if type == "export" and ".json" not in filepath:
            filepath = filepath + ".json"

    dialog.destroy()

    return filepath


class BaseGrid(Gtk.Grid):

    def __init__(self, tooltip="", orientation=Gtk.Orientation.VERTICAL):
        super().__init__()
        self.set_orientation(orientation)
        self.set_tooltip_text(tooltip)

    def set_spacing(self, col, row):
        self.set_column_spacing(col)
        self.set_row_spacing(row)


class InfoBar(Gtk.InfoBar):

    def __init__(self, app):
        super().__init__()
        self.app = app
        self._populate()

    def _populate(self):
        content_box = self.get_content_area()
        content_box.set_homogeneous(False)

        self.connect("response", self._on_response)
        self.set_message_type(Gtk.MessageType.WARNING)
        self.set_show_close_button(True)
        self.add_button(_("Help"), Gtk.ResponseType.HELP)
        self.add_button(_("Sanitize"), Gtk.ResponseType.ACCEPT)

        label = Gtk.Label(_("The translation history requires sanitation."))
        label.set_line_wrap(True)
        content_box.pack_start(label, True, True, 0)
        self.show_all()

    def _on_response(self, widget, event):
        if event == Gtk.ResponseType.ACCEPT:
            sanitized = sanitize_history(self.app.window)

            if sanitized:
                self.hide()
        elif event == Gtk.ResponseType.HELP:
            from subprocess import run
            run(["xdg-open", XLET_DIR + "/HELP.html"])


class HistoryWindow(Gtk.ApplicationWindow):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class HistoryApplication(Gtk.Application):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, application_id=APPLICATION_ID,
                         flags=Gio.ApplicationFlags.HANDLES_COMMAND_LINE,
                         **kwargs)

        self.window = None
        self.resume_timeout = None
        self.win_initial_height = 600
        self.win_initial_width = 800
        self.last_export_import_location = None

    def on_size_allocate_cb(self, window, *args):
        if not window.is_maximized():
            win_width, win_height = window.get_size()
            self.win_current_width = win_width
            self.win_current_height = win_height

        self.win_is_maximized = window.is_maximized()

    def on_window_state_event_cb(self, window, event):
        if event.new_window_state & Gdk.WindowState.MAXIMIZED:
            self.win_is_maximized = window.is_maximized()

    def _store_window_state(self):
        try:
            os.makedirs(os.path.dirname(self.win_state_cache_file), exist_ok=True)

            with open(self.win_state_cache_file, "w+", encoding="UTF-8") as state_file:
                json.dump({
                    "width": self.win_current_width,
                    "height": self.win_current_height,
                    "is_maximized": self.win_is_maximized,
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
        }
        self.win_state_cache_file = os.path.join(
            GLib.get_user_cache_dir(), APPLICATION_ID, "state.json")

        if os.path.isfile(self.win_state_cache_file):
            try:
                with open(self.win_state_cache_file, "r", encoding="UTF-8") as state_file:
                    state_data = json.loads(state_file.read())
            except Exception as e:
                print(e)
                state_data = default_state
        else:
            state_data = default_state

        self.win_current_width = state_data.get("width", default_state["width"])
        self.win_current_height = state_data.get("height", default_state["height"])
        self.win_is_maximized = state_data.get("is_maximized", default_state["is_maximized"])

    def do_activate(self):
        self.window.present()

    def do_startup(self, *args):
        Gtk.Application.do_startup(self)
        self._load_window_state()
        self._buildUI()

    def _buildUI(self):
        self.window = HistoryWindow(application=self,
                                    title=APPLICATION_TITLE)

        self.window.connect("destroy", self.on_quit)
        self.window.connect("size-allocate", self.on_size_allocate_cb)
        self.window.connect("window-state-event", self.on_window_state_event_cb)

        self.window.set_default_size(
            self.win_current_width or self.win_initial_width,
            self.win_current_height or self.win_initial_height
        )

        icon_path = os.path.join(XLET_DIR, "icon.svg")

        if not os.path.isfile(icon_path):
            icon_path = os.path.join(XLET_DIR, "icon.png")

        if os.path.isfile(icon_path):
            self.window.set_icon_from_file(icon_path)

        self.search_entry = Gtk.SearchEntry()
        self.search_entry.set_property("width-chars", 20)
        self.search_entry.set_placeholder_text(_("Source text search"))
        self.search_entry.connect("search-changed", self.on_search_entry_refilter)

        header = Gtk.HeaderBar()
        header.set_show_close_button(True)

        header_title = Gtk.Label(APPLICATION_TITLE)
        header_title.get_style_context().add_class(Gtk.STYLE_CLASS_TITLE)
        header_title.set_tooltip_text(APPLICATION_TITLE)
        header_title.set_property("ellipsize", Pango.EllipsizeMode.END)
        header.pack_start(header_title)
        header.set_custom_title(self.search_entry)

        self.window.set_titlebar(header)

        self.file_obj = Gio.File.new_for_path(HISTORY_FILE_PATH)
        self.file_monitor = self.file_obj.monitor_file(Gio.FileMonitorFlags.SEND_MOVED, None)
        self.file_monitor.connect("changed", self.monitor_triggered)

        self.box = BaseGrid(orientation=Gtk.Orientation.VERTICAL)
        self.box.set_border_width(10)
        self.window.add(self.box)

        self.infobar_container = BaseGrid(orientation=Gtk.Orientation.HORIZONTAL)
        self.box.add(self.infobar_container)

        scrolled_window = Gtk.ScrolledWindow(hadjustment=None, vadjustment=None)
        scrolled_window.set_policy(hscrollbar_policy=Gtk.PolicyType.AUTOMATIC,
                                   vscrollbar_policy=Gtk.PolicyType.AUTOMATIC)
        scrolled_window.set_shadow_type(type=Gtk.ShadowType.ETCHED_IN)
        scrolled_window.set_property("expand", True)
        scrolled_window.set_property("can_focus", True)

        self.box.add(scrolled_window)

        self.treeview = Gtk.TreeView()
        self.treeview.set_grid_lines(Gtk.TreeViewGridLines.BOTH)
        scrolled_window.add(self.treeview)

        column1 = Gtk.TreeViewColumn(_("UTC date"), Gtk.CellRendererText(), text=0)
        column1.set_sort_column_id(0)
        column1.set_resizable(True)

        cr2 = Gtk.CellRendererText()
        cr2.set_property("wrap-mode", Pango.WrapMode.WORD_CHAR)
        cr2.set_property("wrap-width", int(WORD_WRAP))
        cr2.set_property("editable", True)
        column2 = Gtk.TreeViewColumn(_("Source text"), cr2, text=1)
        column2.set_sort_column_id(1)
        column2.set_resizable(True)

        cr3 = Gtk.CellRendererText()
        column3 = Gtk.TreeViewColumn(_("Language pair"), cr3, markup=2)
        column3.set_sort_column_id(2)
        column3.set_resizable(True)

        cr4 = Gtk.CellRendererText()
        cr4.set_property("wrap-mode", Pango.WrapMode.WORD_CHAR)
        cr4.set_property("wrap-width", int(WORD_WRAP))
        cr4.set_property("editable", True)
        column4 = Gtk.TreeViewColumn(_("Target text"), cr4, text=3)
        column4.set_sort_column_id(3)
        column4.set_resizable(True)

        self.treeview.append_column(column1)
        self.treeview.append_column(column2)
        self.treeview.append_column(column3)
        self.treeview.append_column(column4)
        self.treeview.set_headers_clickable(True)
        self.treeview.set_enable_search(True)
        self.treeview.set_search_entry(self.search_entry)

        menu_popup = Gtk.Menu()
        menu_popup.set_halign(Gtk.Align.END)

        menu_popup.append(
            self.create_menu_item(text=_("Import history"),
                                  callback=self.import_history)
        )
        menu_popup.append(
            self.create_menu_item(text=_("Export history"),
                                  callback=self.export_history)
        )
        menu_popup.append(
            self.create_menu_item(text=_("Reset history"),
                                  callback=self.reset_history)
        )

        menu_popup.show_all()
        menu_button = Gtk.MenuButton()
        menu_button.set_popup(menu_popup)
        menu_button.add(Gtk.Image.new_from_icon_name(
            "open-menu-symbolic", Gtk.IconSize.BUTTON
        ))

        header.pack_end(menu_button)
        header.pack_end(Gtk.Separator(orientation=Gtk.Orientation.VERTICAL))

        self.populate()

        if self.win_is_maximized:
            self.window.maximize()
        else:
            self.window.set_position(Gtk.WindowPosition.CENTER)

        self.window.show_all()
        self.search_entry.grab_focus_without_selecting()

    def import_history(self, *args):
        self.pause_monitor()

        imported_file_path = import_export(self.window, "import", self.last_export_import_location)

        if imported_file_path:
            self.last_export_import_location = os.path.dirname(imported_file_path)

            with open(imported_file_path, "r", encoding="UTF-8") as imported_file:
                imported_raw_data = imported_file.read()

            try:
                imported_data = json.loads(imported_raw_data, encoding="UTF-8")
            except Exception:
                raise Exception("Failed to parse JSON data for file %s" % imported_file_path)

            if not isinstance(imported_data, dict):
                raise Exception("Wrong data type found on file %s" % imported_file_path)

            with open(HISTORY_FILE_PATH, "r", encoding="UTF-8") as existent_file:
                existent_raw_data = existent_file.read()

            try:
                existent_data = json.loads(existent_raw_data, encoding="UTF-8")
            except Exception:
                raise Exception("Failed to parse JSON data for file %s" % HISTORY_FILE_PATH)

            if not isinstance(existent_data, dict):
                raise Exception("Wrong data type found on file %s" % HISTORY_FILE_PATH)

            try:
                merged_data = merge_history(existent_data, imported_data)

                with open(HISTORY_FILE_PATH, "w", encoding="UTF-8") as existent_file:
                    existent_file.write(json.dumps(merged_data))

                self.populate()
            except Exception as err:
                self.resume_monitor()
                print(err)

    def export_history(self, *args):
        file_path = import_export(self.window, "export", self.last_export_import_location)

        if file_path:
            self.last_export_import_location = os.path.dirname(file_path)

            if os.path.exists(file_path):
                os.remove(file_path)

            with open(HISTORY_FILE_PATH, "r", encoding="UTF-8") as in_file:
                raw_data = in_file.read()

            with open(file_path, "w+", encoding="UTF-8") as out_file:
                out_file.write(raw_data)

    def reset_history(self, *args):
        self.pause_monitor()

        dialog = Gtk.MessageDialog(transient_for=self.window.get_toplevel(),
                                   modal=True,
                                   message_type=Gtk.MessageType.WARNING,
                                   buttons=Gtk.ButtonsType.YES_NO)

        dialog.set_title(_("Reset history"))

        msg = [
            _("Are you sure that you want to reset the translation history?"),
            _("This operation is permanent and irreversible."),
            _("It is recommended to perform a backup of the history file before continuing."),
        ]
        dialog.set_markup(escape("\n".join(msg)))
        dialog.show_all()
        response = dialog.run()
        dialog.destroy()

        if response == Gtk.ResponseType.YES and os.path.exists(HISTORY_FILE_PATH):
            with open(HISTORY_FILE_PATH, "w", encoding="UTF-8") as history_file:
                history_file.write(json.dumps({
                    "__version__": HISTORY_FILE_VERSION
                }))

            self.populate()
        else:
            self.resume_monitor()

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

    def match_func(self, model, iterr, *args):
        query = self.search_entry.get_buffer().get_text().lower()
        # NOTE: Compare query with column 1 text (source text).
        value = model.get_value(iterr, 1)

        if query == "":
            return True
        elif query in value.lower():
            return True

        return False

    def on_search_entry_refilter(self, widget, *args):
        self.tree_filter.refilter()

    # Forced to add this and the Gio.ApplicationFlags.HANDLES_COMMAND_LINE flag.
    # Otherwise, I can't pass arguments.
    def do_command_line(self, command_line):
        self.activate()
        return 0

    def sort_column_func(self, model, iter1, iter2, data={}):
        sort_type = data.get("sort_type", "string")

        try:
            value1 = model.get_value(iter1, data.get("col_index", 0)).lower()
            value2 = model.get_value(iter2, data.get("col_index", 0)).lower()
        except Exception:
            value1 = None
            value2 = None

        if value1 == value2:
            return equal
        else:
            if sort_type == "integer":
                if value1 > value2:
                    return swap
                else:
                    return ok
            elif sort_type == "string":
                sorted_row_list = [value1, value2]
                sorted_row_list.sort()

                if sorted_row_list == [value1, value2]:
                    return ok
                else:
                    return swap

    def populate(self):
        self.pause_monitor()

        self.tree_store = Gtk.TreeStore(str, str, str, str)
        self.tree_store.set_sort_func(0, self.sort_column_func, {
            "col_index": 0,
            "sort_type": "integer"
        })
        self.tree_store.set_sort_func(1, self.sort_column_func, {
            "col_index": 1
        })
        self.tree_store.set_sort_func(2, self.sort_column_func, {
            "col_index": 2
        })
        self.tree_store.set_sort_func(3, self.sort_column_func, {
            "col_index": 3
        })

        self.tree_filter = self.tree_store.filter_new()
        self.tree_filter.set_visible_func(self.match_func)

        if (os.path.exists(HISTORY_FILE_PATH)):
            with open(HISTORY_FILE_PATH, "r", encoding="UTF-8") as history_data:
                trans_list = json.loads(history_data.read())

                try:
                    # NOTE: I'm forced to build the info bar when it's time to show it
                    # because the f*cking thing won't hide on demand nor it can't
                    # be built hidden. WTF!?!?!
                    if trans_list["__version__"] != HISTORY_FILE_VERSION:
                        self.infobar_container.add(InfoBar(self))
                except Exception as err:
                    print(err)

                # NOTE: Delete it so I don't have to use a condition inside the loop.
                del trans_list["__version__"]

                for lang in trans_list:
                    for entry in trans_list[lang]:
                        # NOTE: The following two try:except: blocks are faster than using .get().
                        try:
                            source_lang = LANGUAGES_LIST[trans_list[lang][entry]["sL"]]
                        except Exception:
                            source_lang = LANGUAGES_LIST["?"]

                        try:
                            target_lang = LANGUAGES_LIST[trans_list[lang][entry]["tL"]]
                        except Exception:
                            target_lang = LANGUAGES_LIST["?"]

                        iter = self.tree_store.insert_before(None, None)

                        # NOTE: An existent history is sanitized on the JavaScript side.
                        # But just in case that someone just copies an old history file,
                        # use the try:except: block.
                        try:
                            timestamp = datetime.fromtimestamp(
                                int(trans_list[lang][entry]["d"])
                            ).strftime(str(TIMESTAMP_FORMAT))
                        except Exception:
                            timestamp = str(trans_list[lang][entry]["d"])

                        self.tree_store.set_value(iter, 0, timestamp)
                        self.tree_store.set_value(iter, 1, entry)

                        # NOTE:Safely clean destination text from HTML markup.
                        # The source text was saved without HTML markup.
                        # And if the history file used was from a previous version,
                        # the JavaScript side will take care of the HTML markup of the
                        # source text.
                        try:
                            destination_text_cleaned = strip_html_tags(
                                trans_list[lang][entry]["tT"])
                        except Exception:
                            destination_text_cleaned = trans_list[lang][entry]["tT"]

                        self.tree_store.set_value(iter, 2, "<b>%s %s %s</b>" % (
                            escape(source_lang),
                            escape(">"),
                            escape(target_lang)
                        ))
                        self.tree_store.set_value(iter, 3, destination_text_cleaned)

        self.tree_store.set_sort_column_id(0, Gtk.SortType.DESCENDING)
        self.treeview.set_model(Gtk.TreeModelSort(self.tree_filter))

        self.resume_monitor()

    def pause_monitor(self):
        self.file_monitor.cancel()
        self.handler = None

    def resume_monitor(self):
        if self.resume_timeout:
            GObject.source_remove(self.resume_timeout)

        self.resume_timeout = GObject.timeout_add(2000, self.do_resume)

    def do_resume(self):
        self.file_monitor = self.file_obj.monitor_file(Gio.FileMonitorFlags.SEND_MOVED, None)
        self.handler = self.file_monitor.connect("changed", self.monitor_triggered)
        self.resume_timeout = None
        return False

    def monitor_triggered(self, *args):
        self.populate()

    def on_quit(self, action):
        self.pause_monitor()
        self._store_window_state()
        self.quit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    group = parser.add_mutually_exclusive_group()
    group.add_argument("--gui", dest="gui", action="store_true")
    group.add_argument("--sanitize", dest="sanitize", action="store_true")

    parser.add_argument("--word-wrap", dest="word_wrap")
    parser.add_argument("--timestamp-format", dest="timestamp_format")

    args = parser.parse_args()

    if args.gui:
        global TIMESTAMP_FORMAT
        TIMESTAMP_FORMAT = args.timestamp_format or "%Y-%m-%d %H:%M:%S"
        global WORD_WRAP
        WORD_WRAP = args.word_wrap or 300
        app = HistoryApplication()
        app.run()
    elif args.sanitize:
        sanitize_history()
