#!/usr/bin/python3
# -*- coding: utf-8 -*-

import gettext
import gi
import json
import os
import sys

gi.require_version('Gtk', '3.0')

from gi.repository import GObject
from gi.repository import Gio
from gi.repository import Gtk
from gi.repository import Pango

HOME = os.path.expanduser("~")

gettext.bindtextdomain("{{UUID}}", HOME + "/.local/share/locale")
gettext.textdomain("{{UUID}}")
_ = gettext.gettext

XLET_DIR = os.path.dirname(os.path.abspath(__file__))

langList = {
    "?": "Unknown",
    "": "Auto",
    "af": "Afrikaans",
    "sq": "Albanian",
    "am": "Amharic",
    "ar": "Arabic",
    "hy": "Armenian",
    "az": "Azerbaijani",
    "eu": "Basque",
    "be": "Belarusian",
    "bn": "Bengali",
    "bs": "Bosnian (Y)",
    "bg": "Bulgarian",
    "ca": "Catalan",
    "ny": "Cebuano",
    "ceb": "Chichewa",
    "zh": "Chinese (Y)",
    "zh-CN": "Chinese",
    "co": "Corsican",
    "hr": "Croatian",
    "cs": "Czech",
    "da": "Danish",
    "nl": "Dutch",
    "en": "English",
    "eo": "Esperanto",
    "et": "Estonian",
    "tl": "Filipino",
    "fi": "Finnish",
    "fr": "French",
    "fy": "Frisian",
    "gl": "Galician",
    "ka": "Georgian",
    "de": "German",
    "el": "Greek",
    "gu": "Gujarati",
    "ht": "Haitian Creole",
    "ha": "Hausa",
    "haw": "Hawaiian",
    "he": "Hebrew (Y)",
    "iw": "Hebrew",
    "hi": "Hindi",
    "hmn": "Hmong",
    "hu": "Hungarian",
    "is": "Icelandic",
    "ig": "Igbo",
    "id": "Indonesian",
    "ga": "Irish",
    "it": "Italian",
    "ja": "Japanese",
    "jw": "Javanese",
    "kn": "Kannada",
    "kk": "Kazakh",
    "km": "Khmer",
    "ko": "Korean",
    "ku": "Kurdish (Kurmanji)",
    "ky": "Kyrgyz",
    "lo": "Lao",
    "la": "Latin",
    "lv": "Latvian",
    "lt": "Lithuanian",
    "lb": "Luxembourgish",
    "mk": "Macedonian",
    "mg": "Malagasy",
    "ms": "Malay",
    "ml": "Malayalam",
    "mt": "Maltese",
    "mi": "Maori",
    "mr": "Marathi",
    "mn": "Mongolian",
    "my": "Myanmar (Burmese)",
    "ne": "Nepali",
    "no": "Norwegian",
    "ps": "Pashto",
    "fa": "Persian",
    "pl": "Polish",
    "pt": "Portuguese",
    "pa": "Punjabi",
    "ro": "Romanian",
    "ru": "Russian",
    "sm": "Samoan",
    "gd": "Scots Gaelic",
    "sr": "Serbian",
    "st": "Sesotho",
    "sn": "Shona",
    "sd": "Sindhi",
    "si": "Sinhala",
    "sk": "Slovak",
    "sl": "Slovenian",
    "so": "Somali",
    "es": "Spanish",
    "su": "Sundanese",
    "sw": "Swahili",
    "sv": "Swedish",
    "tg": "Tajik",
    "ta": "Tamil",
    "te": "Telugu",
    "th": "Thai",
    "tr": "Turkish",
    "uk": "Ukrainian",
    "ur": "Urdu",
    "uz": "Uzbek",
    "vi": "Vietnamese",
    "cy": "Welsh",
    "xh": "Xhosa",
    "yi": "Yiddish",
    "yo": "Yoruba",
    "zu": "Zulu"
}

# button_reload is commented out in case I have to come back to it.
HISTORY_UI = '''
<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated with glade 3.16.1 -->
<interface>
  <requires lib="gtk+" version="3.10"/>
      <object class="GtkVBox" id="vbox3">
        <property name="width_request">475</property>
        <property name="visible">True</property>
        <property name="can_focus">False</property>
        <property name="border_width">12</property>
        <property name="spacing">12</property>
        <child>
          <object class="GtkScrolledWindow" id="scrolledwindow6">
            <property name="visible">True</property>
            <property name="can_focus">True</property>
            <property name="shadow_type">in</property>
            <child>
              <object class="GtkTreeView" id="treeview_history">
                <property name="visible">True</property>
                <property name="can_focus">True</property>
                <property name="reorderable">True</property>
                <property name="rules_hint">True</property>
                <property name="enable_search">False</property>
                <child internal-child="selection">
                  <object class="GtkTreeSelection" id="treeview-selection1"/>
                </child>
              </object>
            </child>
          </object>
          <packing>
            <property name="expand">True</property>
            <property name="fill">True</property>
            <property name="position">0</property>
          </packing>
        </child>
        <child>
          <object class="GtkHButtonBox" id="hbuttonbox2">
            <property name="visible">True</property>
            <property name="can_focus">False</property>
            <property name="spacing">15</property>
            <property name="layout_style">end</property>
<!--            <child>
              <object class="GtkButton" id="button_reload">
                <property name="visible">True</property>
                <property name="can_focus">True</property>
                <property name="receives_default">True</property>
                <property name="use_stock">True</property>
              </object>
              <packing>
                <property name="expand">False</property>
                <property name="fill">False</property>
                <property name="position">1</property>
              </packing>
            </child>
-->            <child>
              <object class="GtkButton" id="button_close">
                <property name="label">gtk-close</property>
                <property name="visible">True</property>
                <property name="can_focus">True</property>
                <property name="receives_default">True</property>
                <property name="use_stock">True</property>
              </object>
              <packing>
                <property name="expand">False</property>
                <property name="fill">False</property>
                <property name="position">1</property>
              </packing>
            </child>
          </object>
          <packing>
            <property name="expand">False</property>
            <property name="fill">True</property>
            <property name="position">1</property>
          </packing>
        </child>
      </object>
</interface>
'''


class HistoryWindow(Gtk.ApplicationWindow):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class HistoryApplication(Gtk.Application):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, application_id="org.cinnamon.extensions.multi-translator-history",
                         flags=Gio.ApplicationFlags.HANDLES_COMMAND_LINE,
                         **kwargs)

        self.window = None
        self.resume_timeout = None

    # Create and activate a HistoryWindow, with self (the HistoryApplication) as
    # application the window belongs to.
    def do_activate(self):
        # Allow a single window and raise any existing ones
        if not self.window:
            self.window = HistoryWindow(application=self, title="")
            self.window.set_position(Gtk.WindowPosition.CENTER)
            self.window.set_size_request(width=-1, height=300)
            self.window.set_icon_from_file(os.path.join(XLET_DIR, "icon.png"))
            self.window.set_title(_("Multi Translator history"))
            self.window.set_default_size(int(self.sizes[0]), int(self.sizes[1]))
            self.window.connect("destroy", self.on_quit)
            self.window.add(self.box)

        self.window.present()

    # Start up the application
    def do_startup(self):
        Gtk.Application.do_startup(self)

        self.filepath = os.path.join(
            HOME, ".cinnamon", "configs", "{{UUID}}-History", "translation_history.json")
        self.file_obj = Gio.File.new_for_path(self.filepath)
        self.file_monitor = self.file_obj.monitor_file(Gio.FileMonitorFlags.SEND_MOVED, None)
        self.file_monitor.connect("changed", self.monitor_triggered)

        self.sizes = sys.argv[2].split(",")
        builder = Gtk.Builder()
        builder.add_from_string(HISTORY_UI)
        self.box = builder.get_object("vbox3")

        self.treeview = builder.get_object("treeview_history")

        column1 = Gtk.TreeViewColumn(_("Date"), Gtk.CellRendererText(), text=1)
        column1.set_sort_column_id(1)
        column1.set_resizable(True)

        cr2 = Gtk.CellRendererText()
        cr2.set_property('wrap-mode', Pango.WrapMode.WORD_CHAR)
        cr2.set_property('wrap-width', int(self.sizes[2]))
        cr2.set_property('editable', True)
        column2 = Gtk.TreeViewColumn(_("Source text"), cr2, markup=0)
        column2.set_sort_column_id(0)
        column2.set_resizable(True)

        cr3 = Gtk.CellRendererText()
        column3 = Gtk.TreeViewColumn(_("Language pair"), cr3, markup=2)
        column3.set_sort_column_id(2)
        column3.set_resizable(True)

        cr4 = Gtk.CellRendererText()
        cr4.set_property('wrap-mode', Pango.WrapMode.WORD_CHAR)
        cr4.set_property('wrap-width', int(self.sizes[2]))
        cr4.set_property('editable', True)
        column4 = Gtk.TreeViewColumn(_("Target text"), cr4, markup=3)
        column4.set_sort_column_id(3)
        column4.set_resizable(True)

        self.treeview.append_column(column1)
        self.treeview.append_column(column2)
        self.treeview.append_column(column3)
        self.treeview.append_column(column4)

        self.treeview.set_headers_clickable(True)
        self.treeview.set_reorderable(False)
        self.treeview.set_search_column(0)
        self.treeview.set_enable_search(True)

        self.treeview.show()

        self.populate(self)

        close_button = builder.get_object("button_close")
        close_button.connect("clicked", self.on_quit)

        # Just commented out in case I have to come back to it.
        # reload_button = builder.get_object("button_reload")
        # reload_button.set_label(_("Reload"))
        # reload_button.set_tooltip_text(_("Reload translation history"))
        # reload_button.connect("clicked", self.populate)
        # img_path = os.path.join(
        #     XLET_DIR, "icons", "popup-translator-document-open-recent-symbolic.svg")
        # img_file = Gio.File.new_for_path(img_path)
        # img_file_icon = Gio.FileIcon.new(img_file)
        # img = Gtk.Image.new_from_gicon(img_file_icon, Gtk.IconSize.BUTTON)
        # reload_button.set_image(img)

    # Forced to add this and the Gio.ApplicationFlags.HANDLES_COMMAND_LINE flag.
    # Otherwise, I can't pass arguments.
    def do_command_line(self, command_line):
        self.activate()
        return 0

    def populate(self, widget):
        self.pause_monitor()

        model = Gtk.TreeStore(str, str, str, str)
        path = os.path.join(
            HOME, ".cinnamon", "configs", "{{UUID}}-History", "translation_history.json")

        if (os.path.exists(path)):
            data = open(path, 'r').read()
            transList = json.loads(data)

            for lang in transList:
                if str(lang) != "__version__":
                    for entry in transList[lang]:
                        try:
                            sourceLang = langList[transList[lang][entry]["sL"]]
                        except Exception:
                            sourceLang = langList["?"]

                        try:
                            targetLang = langList[transList[lang][entry]["tL"]]
                        except Exception:
                            targetLang = langList["?"]

                        iter = model.insert_before(None, None)
                        model.set_value(iter, 0, entry)
                        model.row_changed(model.get_path(iter), iter)
                        model.set_value(iter, 1, "%s" % (transList[lang][entry]["d"]))
                        model.set_value(iter, 2, "<b>%s > %s</b>" % (sourceLang, targetLang))
                        model.set_value(iter, 3, transList[lang][entry]["tT"])

        model.set_sort_column_id(1, Gtk.SortType.DESCENDING)
        self.treeview.set_model(model)
        del model

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
        self.populate(self)

    def on_quit(self, action):
        self.pause_monitor()
        self.quit()


def main():
    arg = sys.argv[1]

    if arg == "history":
        app = HistoryApplication()
        app.run(sys.argv)
    elif arg == "check-dependencies":
        import subprocess

        msg = "<!--SEPARATOR-->"

        try:
            subprocess.check_call(["xsel", "--version"])
        except OSError:
            # TO TRANSLATORS: "xsel" is a command, do not translate.
            msg += "# %s\n" % _("xsel command not found!!!")

        try:
            subprocess.check_call(["xdg-open", "--version"])
        except OSError:
            # TO TRANSLATORS: "xdg-open" is a command, do not translate.
            msg += "# %s\n" % _("xdg-open command not found!!!")

        try:
            subprocess.check_call(["trans", "-V"])
        except OSError:
            # TO TRANSLATORS: "trans" is a command and "PATH" is an
            # environmental variable, do not translate.
            msg += "# %s\n" % _("trans command not found or it isn't in your PATH!!!")

        print(msg)


if __name__ == "__main__":
    main()
