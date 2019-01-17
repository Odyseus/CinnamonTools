#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""
This file is just a helper to open a Gtk.FileChooserDialog from an xlet code.
All the _import_export function does is to print a path to then be used on
the JavaScript side of the xlet.

Using this custom script instead the one shipped with Cinnamon because I plan to
expand it using the argparse module to make it a little more "powerful" and multi-purpose.
Plus, i don't want to depend on something that might get deleted in the future.
"""

import gettext
import gi
import os
import sys

gi.require_version("Gtk", "3.0")

from gi.repository import Gtk

gettext.bindtextdomain("{{UUID}}", os.path.expanduser("~") + "/.local/share/locale")
gettext.textdomain("{{UUID}}")
_ = gettext.gettext


def _import_export(type):
    try:
        last_dir = os.path.dirname(sys.argv[2])
    except Exception:
        last_dir = None

    if type == "export":
        mode = Gtk.FileChooserAction.SAVE
        string = _("Select or enter file to export to")
        # TO TRANSLATORS: Could be left blank.
        btns = (_("_Cancel"), Gtk.ResponseType.CANCEL,
                _("_Save"), Gtk.ResponseType.ACCEPT)
    elif type == "import":
        mode = Gtk.FileChooserAction.OPEN
        string = _("Select a file to import")
        # TO TRANSLATORS: Could be left blank.
        btns = (_("_Cancel"), Gtk.ResponseType.CANCEL,
                # TO TRANSLATORS: Could be left blank.
                _("_Open"), Gtk.ResponseType.OK)
    elif type == "save":
        mode = Gtk.FileChooserAction.SAVE
        string = _("Select a file to save to")
        # TO TRANSLATORS: Could be left blank.
        btns = (_("_Cancel"), Gtk.ResponseType.CANCEL,
                _("_Save"), Gtk.ResponseType.ACCEPT)

    dialog = Gtk.FileChooserDialog(parent=None,
                                   title=string,
                                   action=mode,
                                   buttons=btns)

    if last_dir is not None:
        dialog.set_current_folder(last_dir)

    if type == "export" or type == "save":
        dialog.set_do_overwrite_confirmation(True)

    filter_text = Gtk.FileFilter()

    if type == "save":
        filter_text.add_pattern("*")
        filter_text.set_name(_("TODO files"))
    else:
        filter_text.add_pattern("*.json")
        filter_text.set_name(_("JSON files"))

    dialog.add_filter(filter_text)

    response = dialog.run()

    if response == Gtk.ResponseType.ACCEPT or response == Gtk.ResponseType.OK:
        filename = dialog.get_filename()

        if type == "export" and ".json" not in filename:
            filename = filename + ".json"

        # The file path is "stripped/trimmed" on the JavaScript side.
        print(filename)

    dialog.destroy()


if __name__ == "__main__":
    try:
        arg = sys.argv[1]
    except Exception:
        arg = None

    if arg == "export":
        _import_export("export")
    elif arg == "import":
        _import_export("import")
    elif arg == "save":
        _import_export("save")
    else:
        print(_("Nothing to do here."))
