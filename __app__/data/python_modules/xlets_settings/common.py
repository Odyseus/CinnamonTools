#!/usr/bin/python3
# -*- coding: utf-8 -*-
import fnmatch
import gettext
import gi
import os
import re

gi.require_version("Gtk", "3.0")
gi.require_version("Gdk", "3.0")

from gi.repository import Gdk
from gi.repository import Gtk
from itertools import chain

HOME = os.path.expanduser("~")

gettext.bindtextdomain("{{UUID}}", HOME + "/.local/share/locale")
gettext.textdomain("{{UUID}}")
_ = gettext.gettext


class BaseGrid(Gtk.Grid):

    def __init__(self, tooltip="", orientation=Gtk.Orientation.VERTICAL):
        super().__init__()
        self.set_orientation(orientation)
        self.set_tooltip_text(tooltip)

    def set_spacing(self, col, row):
        self.set_column_spacing(col)
        self.set_row_spacing(row)


class InfoLabel(BaseGrid):
    def __init__(self, label, align=Gtk.Align.START):
        super().__init__()
        self.set_spacing(5, 5)

        if align == Gtk.Align.END:
            xalign = 1.0
            justification = Gtk.Justification.RIGHT
        elif align == Gtk.Align.CENTER:
            xalign = 0.5
            justification = Gtk.Justification.CENTER
        else:  # START and FILL align left
            xalign = 0
            justification = Gtk.Justification.LEFT

        self.content_widget = Gtk.Label(label, halign=align, xalign=xalign, justify=justification)
        self.content_widget.set_line_wrap(True)
        self.attach(self.content_widget, 0, 0, 1, 1)


def compare_version(version1, version2):
    """Compares two version numbers.

    Source: https://stackoverflow.com/a/12923860

    NOTE: Keep me. Sooner or later I might need to implement Cinnamon version
    specific code. ¬¬

    >>> compare_version("1", "2") >> compare_version("2", "1") > 0
    True
    >>> compare_version("1", "1") == 0
    True
    >>> compare_version("1.0", "1") == 0
    True
    >>> compare_version("1", "1.000") == 0
    True
    >>> compare_version("12.01", "12.1") == 0
    True
    >>> compare_version("13.0.1", "13.00.02") >> compare_version("1.1.1.1", "1.1.1.1") == 0
    True
    >>> compare_version("1.1.1.2", "1.1.1.1") >0
    True
    >>> compare_version("1.1.3", "1.1.3.000") == 0
    True
    >>> compare_version("3.1.1.0", "3.1.2.10") >> compare_version("1.1", "1.10") >> compare_version("1.1.2","1.1.2") == 0
    True
    >>> compare_version("1.1.2","1.1.1") > 0
    True
    >>> compare_version("1.2","1.1.1") > 0
    True
    >>> compare_version("1.1.1-rc2","1.1.1-rc1") > 0
    True
    >>> compare_version("1.1.1a-rc2","1.1.1a-rc1") > 0
    True
    >>> compare_version("1.1.10-rc1","1.1.1a-rc2") > 0
    True
    >>> compare_version("1.1.1a-rc2","1.1.2-rc1") >> compare_version("1.11","1.10.9") > 0
    True
    >>> compare_version("1.4","1.4-rc1") > 0
    True
    >>> compare_version("1.4c3","1.3") > 0
    True
    >>> compare_version("2.8.7rel.2","2.8.7rel.1") > 0
    True
    >>> compare_version("2.8.7.1rel.2","2.8.7rel.1") > 0
    True
    """
    def chn(x):
        return chain.from_iterable(x)

    def split_chrs(strings, chars):
        for ch in chars:
            strings = chn([e.split(ch) for e in strings])
        return strings

    def split_digit_char(x):
        return [s for s in re.split(r"([a-zA-Z]+)", x) if len(s) > 0]

    def splt(x):
        return [split_digit_char(y) for y in split_chrs([x], ".-_")]

    def pad(c1, c2, f="0"):
        while len(c1) > len(c2):
            c2 += [f]
        while len(c2) > len(c1):
            c1 += [f]

    def base_code(ints, base):
        res = 0
        for i in ints:
            res = base * res + i
        return res

    def ABS(lst):
        return [abs(x) for x in lst]

    def cmp(v1, v2):
        c1 = splt(v1)
        c2 = splt(v2)
        pad(c1, c2, ["0"])

        for i in range(len(c1)):
            pad(c1[i], c2[i])

        cc1 = [int(c, 36) for c in chn(c1)]
        cc2 = [int(c, 36) for c in chn(c2)]
        maxint = max(ABS(cc1 + cc2)) + 1

        return base_code(cc1, maxint) - base_code(cc2, maxint)

    v_main_1, v_sub_1 = version1, "999"
    v_main_2, v_sub_2 = version2, "999"

    try:
        v_main_1, v_sub_1 = tuple(re.split("rel|rc", version1))
    except Exception:
        pass

    try:
        v_main_2, v_sub_2 = tuple(re.split("rel|rc", version2))
    except Exception:
        pass

    cmp_res = [cmp(v_main_1, v_main_2), cmp(v_sub_1, v_sub_2)]
    res = base_code(cmp_res, max(ABS(cmp_res)) + 1)

    return res


def contrast_rgba_color(rgba):
    # <3 https://stackoverflow.com/a/1855903
    # StackOverflow to the rescue!!!
    luminance = (0.299 * rgba.red + 0.587 * rgba.green + 0.114 * rgba.blue) / 1.0

    if luminance > 0.5 or rgba.alpha < 0.5:
        d = 0  # Bright colors - Black font
    else:
        d = 1.0  # Dark colors - White font

    return Gdk.RGBA(d, d, d, 1.0)


def import_export(parent, type, last_dir):
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


def generate_options_from_paths(opts, xlet_settings):
    options = []

    def scan_and_generate(folder_path, add_prefix):
        for pattern in opts.get("file-patterns"):
            for file_name in fnmatch.filter(os.listdir(folder_path), pattern):
                options.append(("::" if add_prefix else "") + file_name)

    if opts.get("path-in-xlet"):
        path_in_xlet = os.path.join(xlet_settings.get_xlet_meta()["path"], opts.get("path-in-xlet"))

        if os.path.isdir(path_in_xlet):
            scan_and_generate(path_in_xlet, True)

    if opts.get("path-in-setting"):
        setting_value = xlet_settings.get_value(opts.get("path-in-setting"))
        setting_value = setting_value[7:] if setting_value.startswith("file://") else setting_value

        # NOTE: Failsafe. Do not allow user's home to be added.
        if setting_value and setting_value != os.path.expanduser("~") and os.path.isdir(setting_value):
            scan_and_generate(setting_value, False)

    return options


def display_message_dialog(widget, title, message, context="information"):
    if context == "warning":
        message_type = Gtk.MessageType.WARNING
    elif context == "error":
        message_type = Gtk.MessageType.ERROR
    else:
        message_type = Gtk.MessageType.INFO

    dialog = Gtk.MessageDialog(transient_for=widget.get_toplevel(),
                               title=title,
                               modal=True,
                               message_type=message_type,
                               buttons=Gtk.ButtonsType.OK)

    if isinstance(message, list):
        message = "\n".join(message)

    dialog.set_markup(message)
    dialog.show_all()
    dialog.run()
    dialog.destroy()


if __name__ == "__main__":
    pass
