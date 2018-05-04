#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""Multi selection menu creator.
"""

import curses

from shutil import get_terminal_size

from . import app_utils


class MultiSelect():
    """Allows you to select from a list with curses.

    Based on `picker Python module <https://github.com/MSchuwalow/picker>`__.

    Attributes
    ----------
    aborted : bool
        Description
    all_menu_items : list
        Description
    arrow : str
        Description
    c_empty : TYPE
        Description
    c_selected : TYPE
        Description
    cursor : int
        Description
    footer : TYPE
        Description
    length : int
        Description
    more : TYPE
        Description
    offset : int
        Description
    selcount : int
        Description
    selected : int
        Description
    stdscr : TYPE
        Description
    title : TYPE
        Description
    win : TYPE
        Description
    window_height : TYPE
        Description
    window_width : TYPE
        Description


    Example
    -------
    .. code::

        opts = MultiSelect(
            title='Select files to delete',
            options=[
                ".autofsck ", ".autorelabel", "bin/", "boot/",
                "cgroup/", "dev/", "etc/", "home/", "installimage.conf",
            ]
        ).getSelected()

        if not opts:
            print("Aborted!")
        else:
            print(opts)
    """

    def __init__(self, menu_items=[], title="", arrow="==>",
                 footer="Space = toggle ─ Enter = accept ─ q = cancel",
                 more="...", char_selected="[X]", char_empty="[ ]"):
        """Summary

        Parameters
        ----------
        menu_items : TYPE
            Description
        title : str, optional
            Description
        arrow : str, optional
            Description
        footer : str, optional
            Description
        more : str, optional
            Description
        c_selected : str, optional
            Description
        c_empty : str, optional
            Description
        """
        self.title = title
        self.arrow = arrow
        self.footer = footer
        self.more = more
        self.char_selected = char_selected
        self.char_empty = char_empty

        self.all_menu_items = []
        self.win = None
        self.stdscr = None
        self.cursor = 0
        self.offset = 0
        self.selected = 0
        self.selcount = 0
        self.aborted = False
        self.window_height = (get_terminal_size((80, 24))[1] or 24) - 5
        self.window_width = (get_terminal_size((80, 24))[0] or 80)
        self.length = 0

        for item in menu_items:
            self.all_menu_items.append({
                "label": item,
                "selected": False
            })
            self.length = len(self.all_menu_items)

        self.curses_start()
        curses.wrapper(self.curses_loop)
        self.curses_stop()

    def curses_start(self):
        """Summary
        """
        self.stdscr = curses.initscr()

        curses.noecho()
        curses.cbreak()
        curses.curs_set(0)
        self.win = curses.newwin(
            5 + self.window_height,
            self.window_width,
            0,
            0
        )

    def curses_stop(self):
        """Summary
        """
        curses.nocbreak()
        self.stdscr.keypad(0)
        curses.echo()
        curses.endwin()

    def getSelected(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        if self.aborted:
            return False

        selected_items = [x for x in self.all_menu_items if x["selected"]]
        selected_items_labels = [x["label"] for x in selected_items]
        return selected_items_labels

    def redraw(self):
        """Summary
        """
        self.win.clear()
        self.win.box(0, 0)
        self.win.addstr(self.window_height + 4, 5, " " + self.footer + " ", curses.A_BOLD)

        position = 0
        items_range = self.all_menu_items[self.offset:self.offset + self.window_height + 1]

        for option in items_range:
            if option["selected"]:
                line_label = self.char_selected + " "
            else:
                line_label = self.char_empty + " "

            self.win.addstr(position + 2, 5, line_label + option["label"])
            position = position + 1

        # hint for more content above
        if self.offset > 0:
            self.win.addstr(1, 5, self.more)

        # hint for more content below
        if self.offset + self.window_height <= self.length - 2:
            self.win.addstr(self.window_height + 3, 5, self.more)

        self.win.addstr(0, 5, " " + self.title + " ", curses.A_BOLD)
        self.win.addstr(
            0, self.window_width - 8,
            " " + str(self.selcount) + "/" + str(self.length) + " ",
            curses.A_BOLD
        )
        self.win.addstr(self.cursor + 2, 1, self.arrow, curses.A_BOLD)
        self.win.refresh()

    def check_cursor_up(self):
        """Summary
        """
        if self.cursor < 0:
            self.cursor = 0
            if self.offset > 0:
                self.offset = self.offset - 1

    def check_cursor_down(self):
        """Summary
        """
        if self.cursor >= self.length:
            self.cursor = self.cursor - 1

        if self.cursor > self.window_height:
            self.cursor = self.window_height
            self.offset = self.offset + 1

            if self.offset + self.cursor >= self.length:
                self.offset = self.offset - 1

    def curses_loop(self, stdscr):
        """Summary

        Parameters
        ----------
        stdscr : TYPE
            Description

        Raises
        ------
        app_utils.KeyboardInterruption
            Description
        """
        try:
            while True:
                self.redraw()
                c = stdscr.getch()

                if c == ord("q") or c == ord("Q"):
                    self.aborted = True
                    break
                elif c == curses.KEY_UP:
                    self.cursor = self.cursor - 1
                elif c == curses.KEY_DOWN:
                    self.cursor = self.cursor + 1
                elif c == ord(' '):
                    self.all_menu_items[self.selected]["selected"] = \
                        not self.all_menu_items[self.selected]["selected"]
                elif c == 10:
                    break

                # deal with interaction limits
                self.check_cursor_up()
                self.check_cursor_down()

                # compute selected position only after dealing with limits
                self.selected = self.cursor + self.offset

                temp = self.getSelected()
                self.selcount = len(temp)
        except (KeyboardInterrupt, SystemExit):
            self.aborted = True
            raise app_utils.KeyboardInterruption()


if __name__ == "__main__":
    pass
