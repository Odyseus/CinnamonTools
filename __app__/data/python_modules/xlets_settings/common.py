#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Common utilities.

Attributes
----------
HOME : str
    Path to user home.
"""
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
from operator import itemgetter

HOME = os.path.expanduser("~")

gettext.bindtextdomain("{{UUID}}", HOME + "/.local/share/locale")
gettext.textdomain("{{UUID}}")
_ = gettext.gettext


class BaseGrid(Gtk.Grid):
    """The base of all grids.
    """

    def __init__(self, tooltip="", orientation=Gtk.Orientation.VERTICAL):
        """Initialization.

        Parameters
        ----------
        tooltip : str, optional
            Tooltip text.
        orientation : Gtk.Orientation, optional
            The widget orientation.
        """
        super().__init__()
        self.set_orientation(orientation)
        self.set_tooltip_text(tooltip)

    def set_spacing(self, col, row):
        """Set columns/rows spacing.

        Parameters
        ----------
        col : int
            Spacing to set to columns.
        row : int
            Spacing to set to rows.
        """
        self.set_column_spacing(col)
        self.set_row_spacing(row)


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

    Parameters
    ----------
    version1 : str
        Description
    version2 : str
        Description

    Returns
    -------
    int
        Description
    """
    def chn(x):
        """Summary

        Parameters
        ----------
        x : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        return chain.from_iterable(x)

    def split_chrs(strings, chars):
        """Summary

        Parameters
        ----------
        strings : TYPE
            Description
        chars : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        for ch in chars:
            strings = chn([e.split(ch) for e in strings])
        return strings

    def split_digit_char(x):
        """Summary

        Parameters
        ----------
        x : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        return [s for s in re.split(r"([a-zA-Z]+)", x) if len(s) > 0]

    def splt(x):
        """Summary

        Parameters
        ----------
        x : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        return [split_digit_char(y) for y in split_chrs([x], ".-_")]

    def pad(c1, c2, f="0"):
        """Summary

        Parameters
        ----------
        c1 : TYPE
            Description
        c2 : TYPE
            Description
        f : str, optional
            Description
        """
        while len(c1) > len(c2):
            c2 += [f]
        while len(c2) > len(c1):
            c1 += [f]

    def base_code(ints, base):
        """Summary

        Parameters
        ----------
        ints : TYPE
            Description
        base : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        res = 0
        for i in ints:
            res = base * res + i
        return res

    def ABS(lst):
        """Summary

        Parameters
        ----------
        lst : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        return [abs(x) for x in lst]

    def cmp(v1, v2):
        """Summary

        Parameters
        ----------
        v1 : TYPE
            Description
        v2 : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
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
    """Determine font color based on background color.

    Parameters
    ----------
    rgba : Gdk.RGBA
        The :py:class:`Gdk.RGBA` color from which to get its luminance.

    Returns
    -------
    Gdk.RGBA
        Black or white.
    """
    # <3 https://stackoverflow.com/a/1855903
    # StackOverflow to the rescue!!!
    luminance = (0.299 * rgba.red + 0.587 * rgba.green + 0.114 * rgba.blue) / 1.0

    if luminance > 0.5 or rgba.alpha < 0.5:
        d = 0  # Bright colors - Black font
    else:
        d = 1.0  # Dark colors - White font

    return Gdk.RGBA(d, d, d, 1.0)


def import_export(parent, action_type, last_dir):
    """Import/Export data from/to a :any:`List` widget.

    Parameters
    ----------
    parent : List
        The parent widget to get the top level window from.
    action_type : str
        Which action to perform (export or import).
    last_dir : str
        The last selected directory to be able to open the dialog from that location.

    Returns
    -------
    str
        The selected file path.
    """
    if action_type == "export":
        action_mode = Gtk.FileChooserAction.SAVE
        string = _("Select or enter file to export to")
        btns = (_("_Cancel"), Gtk.ResponseType.CANCEL,
                _("_Save"), Gtk.ResponseType.ACCEPT)
    elif action_type == "import":
        action_mode = Gtk.FileChooserAction.OPEN
        string = _("Select a file to import")
        btns = (_("_Cancel"), Gtk.ResponseType.CANCEL,
                _("_Open"), Gtk.ResponseType.OK)

    dialog = Gtk.FileChooserDialog(transient_for=parent.get_toplevel(),
                                   title=string,
                                   use_header_bar=True,
                                   action=action_mode,
                                   buttons=btns)

    if last_dir is not None:
        dialog.set_current_folder(last_dir)

    if action_type == "export":
        dialog.set_do_overwrite_confirmation(True)

    filter_text = Gtk.FileFilter()
    filter_text.add_pattern("*.json")
    filter_text.set_name(_("JSON files"))

    dialog.add_filter(filter_text)

    filepath = None
    response = dialog.run()

    if response == Gtk.ResponseType.ACCEPT or response == Gtk.ResponseType.OK:
        filepath = dialog.get_filename()

        if action_type == "export" and ".json" not in filepath:
            filepath = filepath + ".json"

    dialog.destroy()

    return filepath


def generate_options_from_paths(opts, xlet_settings):
    """Generate options from paths.

    This function dynamically generates the ``options`` option for :any:`KeybindingWithOptions` and
    :any:`ComboBox` widgets based on files found inside a folder.

    Parameters
    ----------
    opts : dict
        Options used to scan a path to look for files. Possible options are:

            - file-patterns (required): A file pattern to look for files with.
            - path-in-xlet (optional): A path relative to an xlet folder.
            - path-in-setting (optional): An xlet setting that stores an absolute path.

        File names found in ``path-in-xlet`` path will be prefixed by ``::``.

    xlet_settings : dict
        Used when ``path-in-setting`` has a path stored.

    Returns
    -------
    list
        The list of options.
    """
    options = []

    def scan_and_generate(folder_path, add_prefix):
        """Scan path and generate options.

        Parameters
        ----------
        folder_path : str
            Path to a folder.
        add_prefix : bool
            Whether to add a prefix.
        """
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
    """Display a message dialog.

    Parameters
    ----------
    widget : object
        The widget to get the top level window from.
    title : str
        The title of the dialog.
    message : str
        The message of the dialog.
    context : str, optional
        One of "information", "error" or "warning".
    """
    if context == "warning":
        message_type = Gtk.MessageType.WARNING
    elif context == "error":
        message_type = Gtk.MessageType.ERROR
    else:
        message_type = Gtk.MessageType.INFO

    dialog = Gtk.MessageDialog(transient_for=widget.get_toplevel(),
                               title=title,
                               flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
                               message_type=message_type,
                               buttons=Gtk.ButtonsType.OK)

    if isinstance(message, list):
        message = "\n".join(message)

    dialog.set_markup(message)
    dialog.show_all()
    dialog.run()
    dialog.destroy()


def sort_combo_options(options, first_option=""):
    """Sort :any:`ComboBox` widget options.

    If the list of tuples was built from a dictionary, the list needs to be
    sorted by the item at index 1 of each tuple. If the list of tuples was
    built from a list, both items in each tuple are identical, so sort also
    by index 1.

    Parameters
    ----------
    options : list
        See :any:`ComboBox` ``options`` argument.
    first_option : str, optional
        The key to exclude from sorting and place always at the top.

    Returns
    -------
    list
        The sorted list.
    """
    only_first = []

    if first_option:
        for i, opt in enumerate(options):
            if options[i][0] == first_option:
                only_first.append(opt)
                del options[i]
                break

    return only_first + sorted(options, key=itemgetter(1))


def get_keybinding_display_name(accel_string):
    """Get keybinding display name.

    Converts an accelerator keyval and modifier mask into a (possibly translated) string that can
    be displayed to a user.

    Parameters
    ----------
    accel_string : str
        Accel. string.

    Returns
    -------
    str
        Accel. string display name.
    """
    text = accel_string

    if accel_string:
        key, codes, mods = Gtk.accelerator_parse_with_keycode(accel_string)
        if codes is not None and len(codes) > 0:
            text = Gtk.accelerator_get_label_with_keycode(None, key, codes[0], mods)

    return text


if __name__ == "__main__":
    pass
