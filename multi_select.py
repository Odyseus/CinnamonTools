#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""Multi selection menu creator.
"""

import curses

from shutil import get_terminal_size

from . import exceptions


class MultiSelect():
    """Allows you to select from a list with curses.

    Based on `picker Python module <https://github.com/MSchuwalow/picker>`__.

    Attributes
    ----------
    aborted : bool
        Menu selection aborted.
    all_menu_items : list
        The menu items that constitute the multi select menu.
    arrow : str
        The character/s used to *point* the menu item that can be selected.
    char_empty : str
        The character/s used to represent a non selected menu item.
    char_selected : str
        The character/s used to represent a selected menu item.
    cursor : int
        The current cursor position.
    footer : str
        Informational text placed at the bottom of the menu.
    length : int
        The amount of menu items.
    more : str
        Character/s representing the availability of more menu items than the screen can display.
    offset : int
        Te amount of menu items off-screen. (?)
    selcount : int
        The amount of selected menu items.
    selected : int
        The index of the menu item on the current cursor position.
    stdscr : object
        See <class :any:`curses.initscr`>.
    title : str
        A title to use on the menu.
    win : object
        See <class :any:`curses.newwin`>.
    window_height : int
        The height of the terminal window.
    window_width : int
        The width of the terminal window.


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
        """Initialization.

        Parameters
        ----------
        menu_items : list
            The data that will be used to create the menu items.
        title : str, optional
            A title to use on the menu.
        arrow : str, optional
            The character/s used to *point* the menu item that can be selected.
        footer : str, optional
            Informational text placed at the bottom of the menu.
        more : str, optional
            Character/s representing the availability of more menu items than the screen can display.
        char_selected : str, optional
            The character/s used to represent a selected menu item.
        char_empty : str, optional
            The character/s used to represent a non selected menu item.
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
        """curses start.
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
        """curses stop.
        """
        curses.nocbreak()
        self.stdscr.keypad(0)
        curses.echo()
        curses.endwin()

    def getSelected(self):
        """Get selected.

        Returns
        -------
        list
            The labels of the selected menu items.
        """
        if self.aborted:
            return False

        selected_items = [x for x in self.all_menu_items if x["selected"]]
        selected_items_labels = [x["label"] for x in selected_items]
        return selected_items_labels

    def redraw(self):
        """Redraw.
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
        """Check cursor up.
        """
        if self.cursor < 0:
            self.cursor = 0
            if self.offset > 0:
                self.offset = self.offset - 1

    def check_cursor_down(self):
        """Check cursor down.
        """
        if self.cursor >= self.length:
            self.cursor = self.cursor - 1

        if self.cursor > self.window_height:
            self.cursor = self.window_height
            self.offset = self.offset + 1

            if self.offset + self.cursor >= self.length:
                self.offset = self.offset - 1

    def curses_loop(self, stdscr):
        """Curses loop.

        Parameters
        ----------
        stdscr : object
            See <class :any:`curses.initscr`>.

        Raises
        ------
        exceptions.KeyboardInterruption
            Halt execution on Ctrl + C press.
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
            raise exceptions.KeyboardInterruption()


if __name__ == "__main__":
    pass
