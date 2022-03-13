#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Common utilities.

Attributes
----------
HOME : str
    Path to user home.
MAIN_APP : MainApplication
    The main application.
OPERATIONS : list
    Comparison operations.
OPERATIONS_MAP : dict
    Comparison operations map.
USE_HEADER_BARS_ON_DIALOGS : bool
    Whether to use header bars on dialogs.
"""
import fnmatch
import gettext
import gi
import operator
import os
import re

gi.require_version("Gtk", "3.0")
gi.require_version("Gdk", "3.0")

from gi.repository import GLib
from gi.repository import Gdk
from gi.repository import Gtk
from itertools import chain

MAIN_APP = None
# NOTE: This variable is in place for when a global setting is available on Cinnamon (with any luck)
# like it's available now on Mate.
USE_HEADER_BARS_ON_DIALOGS = True
HOME = os.path.expanduser("~")

gettext.bindtextdomain("{{UUID}}", f"{HOME}/.local/share/locale")
gettext.textdomain("{{UUID}}")
_ = gettext.gettext


# CRITICAL: Do not change the order of the items inside this list.
OPERATIONS = ["<=", ">=", "<", ">", "!=", "="]

OPERATIONS_MAP = {
    "!=": operator.ne,
    "<": operator.lt,
    "<=": operator.le,
    "=": operator.eq,
    ">": operator.gt,
    ">=": operator.ge
}


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


class IntelligentGtkDialog(Gtk.Dialog):
    """Intelligent dialog.

    An instance of :any:`Gtk.Dialog` that remembers the size it had the last time it was opened.
    """

    def __init__(self, parent_widget, **kwargs):
        """Initialization.

        Parameters
        ----------
        parent_widget : SettingsWidget.
            The widget used to store the size of the dialog. The widget has to have the
            ``dialog_width`` and ``dialog_height`` properties set to set a default size for the dialog.
        **kwargs
            Keyword arguments.
        """
        super().__init__(**kwargs)
        self._timer = None
        self._parent_widget = parent_widget
        self.set_default_size(width=parent_widget.dialog_width,
                              height=parent_widget.dialog_height)
        self.connect("check-resize", self.on_check_resize)

    def _on_check_resize(self, *args):
        """``check-resize`` signal callback delayed.

        Parameters
        ----------
        *args
            Arguments.

        Returns
        -------
        bool
            Remove source.
        """
        width, height = self.get_size()

        if self._parent_widget.dialog_width != width:
            self._parent_widget.dialog_width = width

        if self._parent_widget.dialog_height != height:
            self._parent_widget.dialog_height = height

        self._timer = None

        return GLib.SOURCE_REMOVE

    def on_check_resize(self, *args):
        """``check-resize`` signal callback.

        Attempt to store the current dialog size when the dialog is re-sized. Delayed to avoid
        executing code a trillion times per second.

        Parameters
        ----------
        *args
            Arguments.
        """
        if self._timer:
            GLib.source_remove(self._timer)

        self._timer = GLib.timeout_add(300, self._on_check_resize)


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
        The first version to be compared.
    version2 : str
        The second version to be compared.

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


def check_version(version1, op, version2):
    """Check version.

    This function is a proxy to the compare_version function to allow a more "natural" usage.

    Parameters
    ----------
    version1 : str
        The first version to be compared.
    op : str
        The comparison operator.
    version2 : str
        The second version to be compared.

    Returns
    -------
    bool
        The result of the comparison.

    Raises
    ------
    err
        Halt execution.
    """
    try:
        return OPERATIONS_MAP[op](compare_version(version1, version2), 0)
    except Exception as err:
        raise err


def contrast_rgba_color(rgba):
    """Determine font color based on background color.

    Parameters
    ----------
    rgba : Gdk.RGBA
        The ``Gdk.RGBA`` color from which to get its luminance.

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
    """Import/Export data from/to a :any:`TreeList` widget.

    Parameters
    ----------
    parent : TreeList
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

    dialog = Gtk.FileChooserDialog(
        transient_for=get_toplevel_window(parent),
        title=string,
        use_header_bar=get_global("USE_HEADER_BARS_ON_DIALOGS"),
        action=action_mode,
        buttons=btns
    )

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
            filepath = f"{filepath}.json"

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
        prefix = "::" if add_prefix else ""

        for pattern in opts.get("file-patterns"):
            for file_name in fnmatch.filter(os.listdir(folder_path), pattern):
                options.append((prefix + file_name, prefix + file_name))

    if opts.get("path-in-xlet"):
        path_in_xlet = os.path.join(xlet_settings.get_xlet_meta()["path"], opts.get("path-in-xlet"))

        if os.path.isdir(path_in_xlet):
            scan_and_generate(path_in_xlet, True)

    if opts.get("path-in-setting"):
        setting_value = xlet_settings.get_value(opts.get("path-in-setting"))
        setting_value = setting_value[7:] if setting_value.startswith("file://") else setting_value

        # NOTE: Failsafe. Do not allow user's home to be added.
        if setting_value and setting_value != os.path.expanduser(
                "~") and os.path.isdir(setting_value):
            scan_and_generate(setting_value, False)

    return options


def handle_combobox_options(options=None, first_option="", xlet_settings=None, sort_options=True):
    """Handle combobox options.

    Parameters
    ----------
    options : None, optional
        The options key of a combobox widget definition.
    first_option : str, optional
        The option that should always be listed first in the combobox.
    xlet_settings : None, optional
        A :any:`JSONSettingsHandler` instance.
    sort_options : bool, optional
        If the options should be sorted.

    Returns
    -------
    list
        Handled combobox options.
    """
    handled_options = []

    if isinstance(options, list):
        handled_options = zip(options, options)
    elif isinstance(options, dict):
        if "file-patterns" in options and isinstance(options["file-patterns"], list):
            handled_options = generate_options_from_paths(options, xlet_settings)
        else:
            handled_options = [(a, b) for a, b in options.items()]

    # NOTE: Sort options. Otherwise, items will appear in
    # different order every single time the widget is re-built.
    if sort_options:
        return sort_combo_options(handled_options, first_option)

    # NOTE: Do not sort if it isn't needed.
    return handled_options


def display_message_dialog(widget, title, message, context="info"):
    """Display a message dialog.

    Parameters
    ----------
    widget : Gtk.Widget
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
    elif context == "question":
        message_type = Gtk.MessageType.QUESTION
    elif context == "info":
        message_type = Gtk.MessageType.INFO
    else:
        message_type = Gtk.MessageType.OTHER

    dialog = Gtk.MessageDialog(
        transient_for=get_toplevel_window(widget),
        use_header_bar=get_global("USE_HEADER_BARS_ON_DIALOGS"),
        title=title,
        flags=Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
        message_type=message_type,
        buttons=Gtk.ButtonsType.OK
    )

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

    return only_first + sorted(options, key=operator.itemgetter(1))


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


def set_global(key, value):
    """Set global variable.

    Parameters
    ----------
    key : str
        The variable name.
    value : Any
        The variable value.
    """
    globals()[key] = value


def get_global(key):
    """Get global variable.

    Parameters
    ----------
    key : str
        The variable name.

    Returns
    -------
    Any
        The value stored in the global variable.
    """
    return globals()[key]


def get_main_app():
    """get main application.

    Returns
    -------
    MainApplication
        The main application.
    """
    return MAIN_APP


def get_toplevel_window(widget):
    """Get a top level window.

    This is mainly used for setting the ``transient_for`` parameter when creating instances of
    a :any:`Gtk.Dialog`. Since some widgets on this framework open dialogs from another dialogs,
    I can't set dialogs to always use the main application window.

    Parameters
    ----------
    widget : Gtk.Widget
        A widget from which to get a top level window.

    Returns
    -------
    MainApplication
        The main application.
    """
    try:
        toplevel = widget.get_toplevel()

        if isinstance(toplevel, (Gtk.ApplicationWindow, Gtk.Window)):
            return toplevel
    except Exception:
        pass

    return MAIN_APP.window


if __name__ == "__main__":
    pass
