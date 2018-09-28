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
    build_output : str
        Path to the folder were the built xlets are stored.
    do_not_cofirm : bool
        Whether to ask for overwrite confirmation when an xlet destination exists or not.
    domain_name : str
        The domain name to use to build the xlets.
    logger : object
        See <class :any:`LogSystem`>.
    main_menu : object
        Main menu. See <class :any:`menu.Menu`>.
    theme_name : str
        The given name of the theme.
    xlets_helper : object
        Helper functions. See <class :any:`app_utils.XletsHelperCore`>.
    """

    def __init__(self, theme_name="", domain_name="",
                 build_output="", do_not_cofirm=False, logger=None):
        """Initialize.

        Parameters
        ----------
        theme_name : str, optional
            The given name of the theme.
        domain_name : str, optional
            The domain name to use to build the xlets.
        build_output : str
            Path to the folder were the built xlets are stored.
        do_not_cofirm : bool
            Whether to ask for overwrite confirmation when an xlet destination exists or not.
        logger : object
            See <class :any:`LogSystem`>.
        """
        self.theme_name = theme_name
        self.domain_name = domain_name
        self.build_output = build_output
        self.do_not_cofirm = do_not_cofirm
        self.logger = logger
        self.xlets_helper = app_utils.XletsHelperCore(logger=self.logger)

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
        app_utils.build_xlets(xlets=app_utils.get_xlets_dirs(),
                              domain_name=self.domain_name,
                              build_output=self.build_output,
                              do_not_cofirm=self.do_not_cofirm,
                              logger=self.logger,
                              from_menu=True)

    def build_themes(self):
        """Build all themes.
        """
        app_utils.build_themes(theme_name=self.theme_name,
                               build_output=self.build_output,
                               do_not_cofirm=self.do_not_cofirm,
                               logger=self.logger,
                               from_menu=True)

    def display_build_selector(self):
        """Display the build selector menu.
        """
        selected_items = multi_select.MultiSelect(
            title="Choose xlets to build",
            menu_items=sorted(app_utils.get_xlets_dirs())
        ).getSelected()

        if selected_items:
            self.close_main_menu()
            app_utils.build_xlets(xlets=selected_items,
                                  domain_name=self.domain_name,
                                  build_output=self.build_output,
                                  do_not_cofirm=self.do_not_cofirm,
                                  logger=self.logger,
                                  from_menu=True)
        else:
            print(app_utils.Ansi.WARNING("Operation aborted."))


if __name__ == "__main__":
    pass
