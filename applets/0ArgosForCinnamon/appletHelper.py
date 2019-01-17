#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""
This file is just a helper to open a Gtk.FileChooserDialog from an xlet code.
All the _file_chooser function does is to print a path to then be used on
the JavaScript side of the xlet.
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


def _file_chooser():
    try:
        last_dir = os.path.dirname(sys.argv[2])
    except Exception:
        last_dir = None

    mode = Gtk.FileChooserAction.OPEN
    string = _("Select a file")
    # TO TRANSLATORS: Could be left blank.
    btns = (_("_Cancel"), Gtk.ResponseType.CANCEL,
            # TO TRANSLATORS: Could be left blank.
            _("_Open"), Gtk.ResponseType.OK)

    dialog = Gtk.FileChooserDialog(parent=None,
                                   title=string,
                                   action=mode,
                                   buttons=btns)

    if last_dir is not None:
        dialog.set_current_folder(last_dir)

    response = dialog.run()

    if response == Gtk.ResponseType.OK:
        filename = dialog.get_filename()

        # The file path is "stripped/trimmed" on the JavaScript side.
        print(filename)

    dialog.destroy()


if __name__ == "__main__":
    try:
        arg = sys.argv[1]
    except Exception:
        arg = None

    if arg == "open":
        _file_chooser()
    else:
        print(_("Nothing to do here."))
