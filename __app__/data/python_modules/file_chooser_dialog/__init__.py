# -*- coding: utf-8 -*-
"""File chooser dialog.

Designed mostly to be used from JavaScript code to get a dialog to choose a path from. It can
also be used as a module if needed/wanted.

Examples
--------

Used as a module from Python to select a single file.

.. code:: python

    #!/usr/bin/env python3
    # -*- coding: utf-8 -*-

    from file_chooser_dialog import open_dialog

    pattern_filters = ["JSON files;*.json", "All files;*"]
    filename = open_dialog(return_paths=True,
                           transient_for=None,  # Set accordingly.
                           buttons_labels=_("_Cancel") + ":" + _("_Open"),
                           title=_("Select a JSON file"),
                           pattern_filters=pattern_filters,
                           dialog_action="open")

    print(filename)  # Path to selected file.
    print(type(filename))  # String (str).

Same as the previous example, but from the command line. The selected path will be printed to STDOUT.

.. code:: shell

    $ ./file_chooser_dialog.py --title "Select a JSON file" --pattern-filters "JSON files;*.json" "All files;*"

Used as a module from Python to select multiple files.

.. code:: python

    #!/usr/bin/env python3
    # -*- coding: utf-8 -*-

    from file_chooser_dialog import open_dialog

    mimetype_filters = ["Audio files;audio/*", "All files;*"]
    filename = open_dialog(return_paths=True,
                           select_multiple=True,
                           transient_for=None,  # Set accordingly.
                           buttons_labels=_("_Cancel") + ":" + _("_Open"),
                           title=_("Select audio files"),
                           mimetype_filters=mimetype_filters,
                           dialog_action="open")

    print(filename)  # List of paths to selected files.
    print(type(filename))  # List (list).

Same as the previous example, but from the command line. The selected paths will be printed to STDOUT
in "JSON format".

.. code:: shell

    $ ./file_chooser_dialog.py --title "Select audio files" --mimetype-filters "Audio files;audio/*" "All files;*"
"""
import gi
import json

gi.require_version("Gtk", "3.0")

from gi.repository import Gtk


def _attach_filters(dialog, filter_arg=[], filter_type="pattern"):
    """Attach filters to dialog.

    Parameters
    ----------
    dialog : object
        See :py:class:`Gtk.FileChooserDialog`.
    filter_arg : list
        Description
    filter_type : str, optional
        One of "pattern" or "mimetype".

    Returns
    -------
    object
        :py:class:`Gtk.FileChooserDialog`.
    """
    for f in filter_arg:
        name, all_filters = f.split(";")

        filter = Gtk.FileFilter()
        filter.set_name(name)

        rules = all_filters.split(":")

        for rule in rules:
            if filter_type == "pattern":
                filter.add_pattern(rule)
            else:
                filter.add_mime_type(rule)

        dialog.add_filter(filter)

    return dialog


def open_dialog(return_paths=False,
                transient_for=None,
                select_multiple=False,
                buttons_labels="",
                title="Open",
                last_dir="",
                pattern_filters=[],
                mimetype_filters=[],
                dialog_action="open"):
    """Open file chooser dialog.

    Parameters
    ----------
    return_paths : bool, optional
        Whether to return the selected paths. If false, the path/s will be printed to STDOUT.
    transient_for : None, optional
        A :py:class:`Gdk.Window` to attach the dialog to.
    select_multiple : bool, optional
        Whether to allow multiple paths selection.
    buttons_labels : str, optional
        A string representiong the dialog's buttons labels separated by a colon. To the left of
        the colon, the ``CANCEL`` button label and to the right the ``OK`` button label. Example:
        "Cancel:Save".
    title : str, optional
        The dialog title.
    last_dir : str, optional
        Description
    pattern_filters : list, optional
        A list of strings representing the file pattern filters that will be attached to the dialog.

        .. code::

            Format: "FILTER_LABEL;FILTER_1:FILTER_2:FILTER_3"

        .. code:: python

            # Example Python.
            pattern_filters = ["All files;*", "JSON files;*.json", "Text files;*.txt"]

        .. code:: shell

            # Example command line.
            $ ./file_chooser_dialog.py --pattern-filters "All files;*", "JSON files;*.json", "Text files;*.txt"

    mimetype_filters : list, optional
        A list of strings representing the MIME type filters that will be attached to the dialog.

        .. code::

            Format: "FILTER_LABEL;FILTER_1:FILTER_2:FILTER_3"

        .. code:: python

            # Example Python.
            mimetype_filters = ["All files;*", "Image files;image/*"]

        .. code:: shell

            # Example command line.
            $ ./file_chooser_dialog.py --mimetype-filters "All files;*", "Image files;image/*"

    dialog_action : str, optional
        One of "open", "select_folder" or "save".

    Returns
    -------
    str
        The selected path when ``select_multiple`` is false or ``dialog_action`` is "save".
    list
        The selected paths when ``select_multiple`` is true and ``dialog_action`` is not "save".
    """
    [cancel_label, ok_label] = buttons_labels.split(":") if \
        buttons_labels else ["_Cancel", "_Open"]

    if dialog_action == "save":
        action = Gtk.FileChooserAction.SAVE
    elif dialog_action == "select_folder":
        action = Gtk.FileChooserAction.SELECT_FOLDER
    else:
        action = Gtk.FileChooserAction.OPEN

    dialog = Gtk.FileChooserDialog(
        title=title,
        action=action,
        transient_for=transient_for,
        use_header_bar=True,
        buttons=(cancel_label, Gtk.ResponseType.CANCEL,
                 ok_label, Gtk.ResponseType.OK)
    )

    if last_dir:
        dialog.set_current_folder(last_dir)

    if pattern_filters:
        _attach_filters(dialog, pattern_filters, filter_type="pattern")

    if mimetype_filters:
        _attach_filters(dialog, mimetype_filters, filter_type="mimetype")

    if dialog_action == "save":
        dialog.set_do_overwrite_confirmation(True)

    if dialog_action != "save" and select_multiple:
        dialog.set_select_multiple(True)

    response = dialog.run()

    if response == Gtk.ResponseType.OK:
        if dialog_action != "save" and select_multiple:
            return_value = json.dumps(dialog.get_filenames())
        else:
            return_value = dialog.get_filename()

        if return_paths:
            return return_value
        else:
            print(return_value)

    dialog.destroy()

    return None


def cli():
    """Command line interface.

    .. code::

        usage: file_chooser_dialog.py [-h] [--title TITLE]
                                      [--buttons-labels BUTTONS_LABELS]
                                      [--pattern-filters [PATTERN_FILTERS [PATTERN_FILTERS ...]]]
                                      [--mimetype-filters [MIMETYPE_FILTERS [MIMETYPE_FILTERS ...]]]
                                      [--select-multiple] [--last-dir LAST_DIR]
                                      [--action-open | --action-save | --action-select-folder]

        optional arguments:
          -h, --help            show this help message and exit
          --title TITLE         Text to display as the dialog title.
          --buttons-labels BUTTONS_LABELS
                                Labels for the buttons in the format "_Cancel:_Open"
          --pattern-filters [PATTERN_FILTERS [PATTERN_FILTERS ...]]
                                Pattern filters.
          --mimetype-filters [MIMETYPE_FILTERS [MIMETYPE_FILTERS ...]]
                                Mimetype filters.
          --select-multiple     Enable multiple selection.
          --last-dir LAST_DIR   Last used directory.
          --action-open
          --action-save
          --action-select-folder


    """
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--title", dest="title",
        help="Text to display as the dialog title."
    )
    parser.add_argument(
        "--buttons-labels", dest="buttons_labels",
        help="Labels for the buttons in the format \"_Cancel:_Open\""
    )
    parser.add_argument(
        "--pattern-filters", dest="pattern_filters", nargs="*",
        help="Pattern filters."
    )
    parser.add_argument(
        "--mimetype-filters", dest="mimetype_filters", nargs="*",
        help="Mimetype filters."
    )
    parser.add_argument(
        "--select-multiple", dest="select_multiple", action="store_true",
        help="Enable multiple selection."
    )
    parser.add_argument(
        "--last-dir", dest="last_dir",
        help="Last used directory."
    )

    group = parser.add_mutually_exclusive_group()
    group.add_argument("--action-open", dest="dialog_action", action="store_const", const="open",
                       help="Select file/s and print selection to standard output.")
    group.add_argument("--action-save", dest="dialog_action", action="store_const", const="save",
                       help="Select file to save to.")
    group.add_argument("--action-select-folder", dest="dialog_action", action="store_const",
                       const="select_folder",
                       help="Select folder/s and print selection to standard output.")

    args = parser.parse_args()
    open_dialog(**vars(args))


if __name__ == "__main__":
    pass
