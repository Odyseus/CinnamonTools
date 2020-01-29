#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Command Line Interface menu to build xlets and themes.
"""

from . import app_utils
from .__init__ import __appname__
from .__init__ import __version__
from .python_utils import menu
from .python_utils import multi_select


class CLIMenu():
    """CLIMenu

    Attributes
    ----------
    logger : object
        See :any:`LogSystem`.
    main_menu : object
        Main menu. See :any:`menu.Menu`.
    """

    def __init__(self, logger=None):
        """Initialize.

        Parameters
        ----------
        logger : object
            See :any:`LogSystem`.
        """
        self.logger = logger

        self.main_menu = menu.Menu(title="%s %s" % (__appname__, __version__),
                                   message="Main menu")

        self.main_menu.set_menu_items([
            ("Choose xlets to build", self.display_build_selector),
            ("Build all xlets", self.build_all_xlets),
            ("Build themes", self.build_themes),
            ("Restart Cinnamon", app_utils.restart_cinnamon),
            ("Exit", self.main_menu.close)
        ])

    def open_main_menu(self):
        """Open main menu.
        """
        self.main_menu.open()

    def close_main_menu(self):
        """Close main menu.
        """
        self.main_menu.close()

    def build_all_xlets(self):
        """Build all xlets.
        """
        app_utils.build_xlets(xlets_display_names=app_utils.get_xlets_display_names(),
                              logger=self.logger,
                              from_menu=True)

    def build_themes(self):
        """Build all themes.
        """
        app_utils.build_themes(logger=self.logger,
                               from_menu=True)

    def display_build_selector(self):
        """Display the build selector menu.
        """
        selected_items = multi_select.MultiSelect(
            title="Choose xlets to build",
            menu_items=sorted(app_utils.get_xlets_display_names())
        ).getSelected()

        if selected_items:
            self.close_main_menu()
            app_utils.build_xlets(xlets_display_names=selected_items,
                                  logger=self.logger,
                                  from_menu=True)
        else:
            print(app_utils.Ansi.LIGHT_YELLOW("Operation aborted."))


if __name__ == "__main__":
    pass
