#!/usr/bin/python3
# -*- coding: utf-8 -*-

import gi
import json
import sys
import os
import gettext

gi.require_version("Gtk", "3.0")

from gi.repository import Gtk


gettext.install("cinnamon", "/usr/share/locale")

HOME = os.path.expanduser("~")
APPLET_UUID = "{{UUID}}"

TRANSLATIONS = {}


def _(string):
    # check for a translation for this xlet
    if APPLET_UUID not in TRANSLATIONS:
        try:
            TRANSLATIONS[APPLET_UUID] = gettext.translation(
                APPLET_UUID, HOME + "/.local/share/locale").gettext
        except IOError:
            try:
                TRANSLATIONS[APPLET_UUID] = gettext.translation(
                    APPLET_UUID, "/usr/share/locale").gettext
            except IOError:
                TRANSLATIONS[APPLET_UUID] = None

    # do not translate white spaces
    if not string.strip():
        return string

    if TRANSLATIONS[APPLET_UUID]:
        result = TRANSLATIONS[APPLET_UUID](string)

        try:
            result = result.decode("utf-8")
        except Exception:
            result = result

        if result != string:
            return result

    return gettext.gettext(string)


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

    dialog = Gtk.FileChooserDialog(parent=None,
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

    response = dialog.run()

    if response == Gtk.ResponseType.ACCEPT or response == Gtk.ResponseType.OK:
        filename = dialog.get_filename()

        if type == "export" and ".json" not in filename:
            filename = filename + ".json"

        # The file path is "stripped/trimmed" on the JavaScript side.
        print(filename)

    dialog.destroy()

    raise SystemExit()


def _display_message_dialog(level, msg_json):
    if level == "error":
        message_type = Gtk.MessageType.ERROR
    elif level == "warning":
        message_type = Gtk.MessageType.WARNING
    else:
        message_type = Gtk.MessageType.INFO

    dialog = Gtk.MessageDialog(
        transient_for=Gtk.Window(),  # Just to STFU retarded warnings.
        title=msg_json["title"],
        modal=True,
        message_type=message_type,
        buttons=Gtk.ButtonsType.CLOSE
    )

    esc = msg_json["message"]

    dialog.set_markup(esc)
    dialog.show_all()
    dialog.run()
    dialog.destroy()

    raise SystemExit()


def _display_confirm_dialog(msg_json):
    dialog = Gtk.MessageDialog(
        transient_for=Gtk.Window(),  # Just to STFU retarded warnings.
        title=msg_json["title"],
        modal=True,
        message_type=Gtk.MessageType.WARNING,
        buttons=(_("_Cancel"), Gtk.ResponseType.CANCEL,
                 # TO TRANSLATORS: Could be left blank.
                 _("_OK"), Gtk.ResponseType.OK)
    )

    esc = msg_json["message"]

    dialog.set_markup(esc)
    dialog.show_all()

    response = dialog.run()

    if response == Gtk.ResponseType.ACCEPT or response == Gtk.ResponseType.OK:
        print("_just_do_it_")
    else:
        print("_do_not_do_it_")

    dialog.destroy()

    raise SystemExit()


def copy_image_data(image_file_path):
    from gi.repository import Gdk
    from gi.repository.GdkPixbuf import Pixbuf

    assert os.path.exists(image_file_path), "File does not exist: %s" % image_file_path
    image = Pixbuf.new_from_file(image_file_path)

    atom = Gdk.atom_intern("CLIPBOARD", True)
    clipboard = Gtk.Clipboard.get(atom)
    clipboard.set_image(image)
    clipboard.store()

    raise SystemExit()


if __name__ == "__main__":
    try:
        action = sys.argv[1]
    except Exception:
        action = None

    if action == "warning" or action == "error" or action == "info":
        try:
            msg_json = json.loads(sys.argv[2])
            _display_message_dialog(action, msg_json)
        except IndexError:
            raise SystemExit("Argument required: JSON object.")
    elif action == "export":
        _import_export("export")
    elif action == "import":
        _import_export("import")
    elif action == "confirm":
        try:
            msg_json = json.loads(sys.argv[2])
            _display_confirm_dialog(msg_json)
        except IndexError:
            raise SystemExit("Argument required: JSON object.")
    elif action == "copy_image_data":
        try:
            copy_image_data(sys.argv[2])
        except IndexError:
            raise SystemExit("Argument required: File path to image.")
    else:
        raise SystemExit("Nothing to do here.")
