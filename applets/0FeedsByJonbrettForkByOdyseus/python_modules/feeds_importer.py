#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Feeds Manager GUI.

Attributes
----------
ngettext : TYPE
    Description

Deleted Attributes
------------------
APPLICATION_ID : str
    ID used by a Gtk.Application instance.
APPLICATION_NAME : str
    Application name.
XLET_DIR : str
    Path to the xlet folder.
"""

import argparse
import csv
import gettext
import gi
import json
import os

import xml.etree.ElementTree as et

gi.require_version("Gtk", "3.0")

from gi.repository import Gtk

from file_chooser_dialog import open_dialog

gettext.bindtextdomain("{{UUID}}", os.path.expanduser("~") + "/.local/share/locale")
gettext.textdomain("{{UUID}}")
_ = gettext.gettext
ngettext = gettext.ngettext


def _import_opml(input_file):
    """Reads feeds list from an OPML file.

    Parameters
    ----------
    input_file : str
        path to the OPML file.

    Returns
    -------
    list
        The list of imported feeds..
    """
    feeds = []
    tree = et.parse(input_file)
    root = tree.getroot()

    for outline in root.findall('.//outline[@type="rss"]'):
        url = outline.attrib.get("xmlUrl", "")

        try:
            title = outline.attrib.get("text", "")
        except Exception:
            title = ""

        feeds.append({
            "enabled": False,
            "category": "",
            "custom_title": title,
            "url": url,
            "notify": True,
            "interval": 0,
            "show_read_items": False
        })

    return feeds


def _import_csv(input_file):
    """Summary

    Parameters
    ----------
    input_file : str
        path to the OPML file.

    Returns
    -------
    list
        The list of imported feeds..

    Raises
    ------
    Exception
        Description
    """
    feeds = []

    with open(input_file, mode="r") as csv_file:
        header = csv_file.readline()

        if header != "### feeds export v=1.0\n":
            return None

        file_reader = csv.reader(csv_file)

        for line in file_reader:
            url = line[1]
            title = line[2]

            feeds.append({
                "enabled": False,
                "category": "",
                "custom_title": title,
                "url": url,
                "notify": _to_bool(line[3]),
                "interval": 0,
                "show_read_items": _to_bool(line[5])
            })

    return feeds


def _to_bool(val):
    """Summary

    Parameters
    ----------
    val : TYPE
        Description

    Returns
    -------
    TYPE
        Description
    """
    return val.lower() == "true"


def _import_feeds(import_type):
    """Summary

    Parameters
    ----------
    import_type : TYPE
        Description
    """
    pattern_filters = None
    mimetype_filters = None
    new_feeds = []

    if import_type == "opml":
        title = _("Choose a OPML feed file")
        pattern_filters = [_("OPML files") + ";*.opml"]
    else:
        title = _("Choose a feed file")
        mimetype_filters = [_("CSV files") + ";text/x-csv"]

    filename = open_dialog(return_paths=True,
                           transient_for=None,
                           buttons_labels=_("_Cancel") + ":" + _("_Open"),
                           title=title,
                           pattern_filters=pattern_filters,
                           mimetype_filters=mimetype_filters,
                           dialog_action="open")

    if filename:
        title = _("File imported")

        try:
            if import_type == "opml":
                new_feeds = _import_opml(filename)
            else:
                new_feeds = _import_csv(filename)

            if import_type == "csv" and new_feeds is None:
                raise Exception(_("Invalid file, first line must match: %s") %
                                "### feeds export v=1.0")

            new_feeds_count = len(new_feeds)

            dialog = Gtk.MessageDialog(title=_("File imported"),
                                       transient_for=None,
                                       message_type=Gtk.MessageType.INFO,
                                       buttons=Gtk.ButtonsType.OK)
            dialog.format_secondary_text(
                ngettext("%d feed found" % new_feeds_count,
                         "%d feeds found" % new_feeds_count,
                         new_feeds_count)
            )
            dialog.run()
            dialog.destroy()

        except Exception as err:
            dialog = Gtk.MessageDialog(title=_("Failed to import file"),
                                       transient_for=None,
                                       message_type=Gtk.MessageType.ERROR,
                                       buttons=Gtk.ButtonsType.CLOSE)
            dialog.format_secondary_text(str(err))
            dialog.run()
            dialog.destroy()

        if new_feeds:
            print(json.dumps(new_feeds, indent=4))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--csv", dest="import_type", action="store_const", const="csv")
    group.add_argument("--opml", dest="import_type", action="store_const", const="opml")

    args = parser.parse_args()

    _import_feeds(args.import_type)
