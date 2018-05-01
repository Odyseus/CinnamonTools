#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""Command line menu creator.
"""

from . import app_utils


class Menu(object):
    """Easily create command-line menus.

    .. note::
        This is a slightly modified version of the Menu module.
        https://pypi.python.org/pypi/Menu

        **Modifications**:

        - Changed some default values to suit my needs.
        - Some aesthetic changes for better readability of the menu items on the screen.
        - This modified version doesn't clear the screen every time a menu is opened.

    Attributes
    ----------
    is_message_enabled : bool
        Description
    is_open : bool
        Description
    is_title_enabled : bool
        Description
    menu_items : list
        Description
    message : str
        Description
    prompt : str
        Description
    refresh : method
        Description
    title : str
        Description
    """

    def __init__(self, menu_items=[], title="", message="", prompt="❯", refresh=lambda: None):
        """Initialize.

        Parameters
        ----------
        menu_items : list, optional
            Description
        title : str, optional
            Description
        message : str, optional
            Description
        prompt : str, optional
            Description
        refresh : method, optional
            Description
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
        """Summary

        Parameters
        ----------
        menu_items : list
            Description

        Raises
        ------
        err
            Description
        TypeError
            Description
        ValueError
            Description
        """
        original_menu_items = self.menu_items
        self.menu_items = []

        try:
            for item in menu_items:
                if not isinstance(item, tuple):
                    raise TypeError(item, "item is not a tuple")

                if len(item) != 2:
                    raise ValueError(item, "item is not of length 2")

                self.add_menu_item(item[0], item[1])
        except (TypeError, ValueError) as err:
            self.menu_items = original_menu_items
            raise err

    def set_title(self, title):
        """Summary

        Parameters
        ----------
        title : str
            Description
        """
        self.title = title

    def set_title_enabled(self, is_enabled):
        """Summary

        Parameters
        ----------
        is_enabled : bool
            Description
        """
        self.is_title_enabled = is_enabled

    def set_message(self, message):
        """Summary

        Parameters
        ----------
        message : str
            Description
        """
        self.message = message

    def set_message_enabled(self, is_enabled):
        """Summary

        Parameters
        ----------
        is_enabled : bool
            Description
        """
        self.is_message_enabled = is_enabled

    def set_prompt(self, prompt):
        """Summary

        Parameters
        ----------
        prompt : str
            Description
        """
        self.prompt = prompt

    def set_refresh(self, refresh):
        """Summary

        Parameters
        ----------
        refresh : method
            Description

        Raises
        ------
        TypeError
            Description
        """
        if not callable(refresh):
            raise TypeError(refresh, "refresh is not callable")

        self.refresh = refresh

    def add_menu_item(self, label, handler):
        """Summary

        Parameters
        ----------
        label : str
            Description
        handler : method
            Description

        Raises
        ------
        TypeError
            Description
        """
        if not callable(handler):
            raise TypeError(handler, "handler is not callable")

        self.menu_items += [(label, handler)]

    def open(self):
        """Summary

        Raises
        ------
        app_utils.KeyboardInterruption
            Description
        app_utils.OperationAborted
            Description
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
            raise app_utils.KeyboardInterruption()
        except SystemExit:
            self.is_open = False
            raise app_utils.OperationAborted("")

    def close(self):
        """Summary
        """
        self.is_open = False

    def show(self):
        """Show menu.
        """
        if self.is_title_enabled:
            print(app_utils.Ansi.INFO(self.title))
            print()

        if self.is_message_enabled:
            print(self.message)
            print()

        for (index, item) in enumerate(self.menu_items):
            print(app_utils.Ansi.INFO(str(index + 1) + ". "), end="")
            print(item[0])

        print()

    def input(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        if len(self.menu_items) == 0:
            return Menu.CLOSE

        try:
            self.show()
            index = int(input(self.prompt + " ")) - 1
            return self.menu_items[index][1]
        except (ValueError, IndexError):
            print(app_utils.Ansi.WARNING("Invalid item."))
            return self.input()

    def CLOSE(self):
        """Summary
        """
        pass


if __name__ == "__main__":
    pass
