#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Countermessure for mediocre web technologies (forgive the redundancy).
"""


replacement_data = [
    # NOTE: Gtk3 CSS properties.
    ("-gtkarrow-", "-GtkArrow-"),
    ("-gtkbin-", "-GtkBin-"),
    ("-gtkbox-", "-GtkBox-"),
    ("-gtkbutton-", "-GtkButton-"),
    ("-gtkcalendar-", "-GtkCalendar-"),
    ("-gtkcellview-", "-GtkCellView-"),
    ("-gtkcheckbutton-", "-GtkCheckButton-"),
    ("-gtkcheckmenuitem-", "-GtkCheckMenuItem-"),
    ("-gtkcombobox-", "-GtkComboBox-"),
    ("-gtkcontainer-", "-GtkContainer-"),
    ("-gtkdialog-", "-GtkDialog-"),
    ("-gtkdrawingarea-", "-GtkDrawingArea-"),
    ("-gtkentry-", "-GtkEntry-"),
    ("-gtkexpander-", "-GtkExpander-"),
    ("-gtkfixed-", "-GtkFixed-"),
    ("-gtkflowbox-", "-GtkFlowBox-"),
    ("-gtkglarea-", "-GtkGLArea-"),
    ("-gtkgrid-", "-GtkGrid-"),
    ("-gtkheaderbar-", "-GtkHeaderBar-"),
    ("-gtkhsv-", "-GtkHSV-"),
    ("-gtkhtml-", "-GtkHTML-"),
    ("-gtkiconview-", "-GtkIconView-"),
    ("-gtkimhtml-", "-GtkIMHtml-"),
    ("-gtkinvisible-", "-GtkInvisible-"),
    ("-gtklayout-", "-GtkLayout-"),
    ("-gtklevelbar-", "-GtkLevelBar-"),
    ("-gtklistbox-", "-GtkListBox-"),
    ("-gtkmenu-", "-GtkMenu-"),
    ("-gtkmenuitem-", "-GtkMenuItem-"),
    ("-gtkmenushell-", "-GtkMenuShell-"),
    ("-gtkmisc-", "-GtkMisc-"),
    ("-gtknotebook-", "-GtkNotebook-"),
    ("-gtkpaned-", "-GtkPaned-"),
    ("-gtkprogressbar-", "-GtkProgressBar-"),
    ("-gtkrange-", "-GtkRange-"),
    ("-gtkscale-", "-GtkScale-"),
    ("-gtkscrollbar-", "-GtkScrollbar-"),
    ("-gtkscrolledwindow-", "-GtkScrolledWindow-"),
    ("-gtkseparator-", "-GtkSeparator-"),
    ("-gtksocket-", "-GtkSocket-"),
    ("-gtkspinner-", "-GtkSpinner-"),
    ("-gtkstack-", "-GtkStack-"),
    ("-gtkstatusbar-", "-GtkStatusbar-"),
    ("-gtkswitch-", "-GtkSwitch-"),
    ("-gtktable-", "-GtkTable-"),
    ("-gtktextview-", "-GtkTextView-"),
    ("-gtktoolbar-", "-GtkToolbar-"),
    ("-gtktoolbutton-", "-GtkToolButton-"),
    ("-gtktoolitemgroup-", "-GtkToolItemGroup-"),
    ("-gtktoolpalette-", "-GtkToolPalette-"),
    ("-gtktreeview-", "-GtkTreeView-"),
    ("-gtkwidget-", "-GtkWidget-"),
    ("-gtkwindow-", "-GtkWindow-"),
    ("-terminalscreen-", "-TerminalScreen-"),
    ("-wncktasklist-", "-WnckTasklist-"),
    # NOTE: Cinnamon CSS properties.
    ("-nemoplacestreeview-", "-NemoPlacesTreeView-"),
    # NOTE: Who the f*ck knows.
    ("-pnldockbin-", "-PnlDockBin-"),
    ("-natrayapplet-", "-NaTrayApplet-"),
]


def correct_property_case(data):
    """Correct property names case.

    Yes, this is the same function found in the string_utils.py module. I re-define it here
    to avoid doing complex relative imports.

    Parameters
    ----------
    data : str
        Data to modify.

    Returns
    -------
    str
        Modified data.
    """
    for template, replacement in replacement_data:
        if template in data:
            data = data.replace(template, replacement)

    return data


if __name__ == "__main__":
    pass
