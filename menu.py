#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Command line menu creator.
"""
from . import exceptions
from .ansi_colors import Ansi


class Menu(object):
    """Easily create command-line menus.

    .. note::
        This is a slightly modified version of the `Menu module <https://pypi.python.org/pypi/Menu>`__.

        **Modifications**:

        - Changed some default values to suit my needs.
        - Some aesthetic changes for better readability of the menu items on the screen.
        - This modified version doesn't clear the screen every time a menu is opened.

    Attributes
    ----------
    is_message_enabled : bool
        Used to whether or not to display the menu message.
    is_open : bool
        Whether the menu is open or not.
    is_title_enabled : bool
        Used to whether or not to display the menu title.
    menu_items : list
        The list of menu items to create the menu.
    message : str
        A message/description to use in the menu.
    prompt : str
        The character used as a prompt for the menu.
    refresh : method
        A function to call before displaying the menu.
    title : str
        A title to use on the menu.
    """

    def __init__(self, menu_items=[], title="", message="", prompt="❯ ", refresh=lambda: None):
        """Initialize.

        Parameters
        ----------
        menu_items : list, optional
            The list of menu items to create the menu.
        title : str, optional
            A title to use on the menu.
        message : str, optional
            A message/description to use in the menu.
        prompt : str, optional
            The character used as a prompt for the menu.
        refresh : method, optional
            A function to call before displaying the menu.
        """
        self.menu_items = menu_items
        self.title = title
        self.is_title_enabled = bool(title)
        self.message = message
        self.is_message_enabled = bool(message)
        self.refresh = refresh
        self.prompt = prompt
        self.is_open = False

    def set_menu_items(self, menu_items):
        """Set menu items.

        Parameters
        ----------
        menu_items : list
            List of tuples used to create the menu itmes.

        Raises
        ------
        SystemExit
            Halt execution.
        TypeError
            If a menu item inside the menu list isn't a tuple.
        ValueError
            If the tuple lenght of the menu item inside the menu list is not equal to two (2).
        """
        original_menu_items = self.menu_items
        self.menu_items = []

        try:
            for item in menu_items:
                if not isinstance(item, tuple):
                    print(item)
                    print(Ansi.ERROR("TypeError: item is not a tuple"))
                    raise TypeError()

                if len(item) != 2:
                    print(item)
                    print(Ansi.ERROR("ValueError: item is not of length 2"))
                    raise ValueError()

                self.add_menu_item(item[0], item[1])
        except (TypeError, ValueError):
            self.menu_items = original_menu_items
            raise SystemExit()

    def set_title(self, title):
        """Set title.

        Parameters
        ----------
        title : str
            The string used as the menu title.
        """
        self.title = title

    def set_title_enabled(self, is_enabled):
        """Set title enabled.

        Parameters
        ----------
        is_enabled : bool
            Whether the menu title will be displayed or not.
        """
        self.is_title_enabled = is_enabled

    def set_message(self, message):
        """Set message.

        Parameters
        ----------
        message : str
            The string used as the menu message.
        """
        self.message = message

    def set_message_enabled(self, is_enabled):
        """Set message enabled.

        Parameters
        ----------
        is_enabled : bool
            Whether the menu message will be displayed or not.
        """
        self.is_message_enabled = is_enabled

    def set_prompt(self, prompt):
        """Set prompt.

        Parameters
        ----------
        prompt : str
            The prompt character to be used by the menu.
        """
        self.prompt = prompt

    def set_refresh(self, refresh):
        """Set refresh.

        Parameters
        ----------
        refresh : method
            A function to call before displaying the menu.

        Raises
        ------
        TypeError
            Halt execution if the refresh method isn't a callable.
        """
        if not callable(refresh):
            print(refresh)
            print(Ansi.ERROR("TypeError: refresh is not callable"))
            raise TypeError()

        self.refresh = refresh

    def add_menu_item(self, label, handler):
        """Add menu item.

        Parameters
        ----------
        label : str
            The text used by a menu item.
        handler : method
            The function to call when activating a menu item.

        Raises
        ------
        TypeError
            Halt execution if the handler method isn't a callable.
        """
        if not callable(handler):
            print(handler)
            print(Ansi.ERROR("TypeError: handler is not callable"))
            raise TypeError()

        self.menu_items += [(label, handler)]

    def open(self):
        """Open menu.

        Raises
        ------
        exceptions.KeyboardInterruption
            Halt execution on Ctrl + C press.
        exceptions.OperationAborted
            Halt execution.
        """
        self.is_open = True

        try:
            while self.is_open:
                self.refresh()
                func = self.input()

                if func == Menu.CLOSE:
                    func = self.close

                print()
                func()
        except KeyboardInterrupt:
            self.is_open = False
            raise exceptions.KeyboardInterruption()
        except SystemExit:
            self.is_open = False
            raise exceptions.OperationAborted("")

    def close(self):
        """Close menu.
        """
        self.is_open = False

    def show(self):
        """Display menu.
        """
        if self.is_title_enabled:
            print(Ansi.INFO(self.title))
            print()

        if self.is_message_enabled:
            print(self.message)
            print()

        for (index, item) in enumerate(self.menu_items):
            print(Ansi.INFO(str(index + 1) + ". "), end="")
            print(item[0])

        print()

    def input(self):
        """Process input.

        Returns
        -------
        method
            The method to call when a menu item is activated.
        """
        if len(self.menu_items) == 0:
            return Menu.CLOSE

        try:
            self.show()
            index = int(input(self.prompt)) - 1
            return self.menu_items[index][1]
        except (ValueError, IndexError):
            print(Ansi.WARNING("Invalid item."))
            return self.input()

    def CLOSE(self):
        """Close menu.
        """
        pass


if __name__ == "__main__":
    pass
