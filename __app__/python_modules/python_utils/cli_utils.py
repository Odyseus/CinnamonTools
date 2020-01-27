#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Command line interface utilities.
"""
import os
import sys

from . import exceptions
from . import file_utils
from . import log_system
from . import shell_utils
from .docopt import docopt

if sys.version_info < (3, 5):
    raise exceptions.WrongPythonVersion()


class CommandLineInterfaceSuper():
    """Command line interface super class.

    It handles the arguments parsed by the docopt module.

    Attributes
    ----------
    logger : object
        See :any:`LogSystem`.
    """
    _cli_header_blacklist = []

    def __init__(self, app_name, logs_storage_dir="UserData/logs"):
        """Initialization.

        Parameters
        ----------
        app_name : str
            Application name.
        logs_storage_dir : str
            Log files storage location.
        """
        self._app_name = app_name

        log_file = log_system.generate_log_path(storage_dir=logs_storage_dir,
                                                prefix="CLI")
        file_utils.remove_surplus_files(logs_storage_dir, "CLI*")
        self.logger = log_system.LogSystem(log_file, verbose=True)

        self._display_cli_header()

    def _display_cli_header(self):
        """Display CLI header.
        """
        if not self._cli_header_blacklist or not any(self._cli_header_blacklist):
            self.logger.info("**%s**" % shell_utils.get_cli_header(self._app_name), date=False, to_file=False)
            print("")

    def print_log_file(self):
        """Print the path to the log file used by the current logger.
        """
        print()
        self.logger.info(shell_utils.get_cli_separator("-"), date=False, to_file=False)
        self.logger.warning("**Log file location:**", date=False, to_file=False)
        self.logger.warning("**%s**" % self.logger.get_log_file(), date=False, to_file=False)
        self.logger.info(shell_utils.get_cli_separator("-"), date=False, to_file=False)

    def run(self):
        """Execute the assigned action stored in self.action if any.

        Raises
        ------
        exceptions.MethodNotImplemented
            See :any:`exceptions.MethodNotImplemented`
        """
        raise exceptions.MethodNotImplemented("run")

    def _system_executable_generation(self, **kwargs):
        """See :any:`template_utils.system_executable_generation`

        Parameters
        ----------
        **kwargs
            See :any:`template_utils.system_executable_generation`
        """
        from . import template_utils

        template_utils.system_executable_generation(**kwargs)

    def _display_manual_page(self, man_page_path):
        """Display manual page.

        Parameters
        ----------
        man_page_path : str
            The absolute path to the manual page.
        """
        from subprocess import run

        run(["man", man_page_path])


def run_cli(flag_file="", docopt_doc="", app_name="", app_version="", app_status="", cli_class=None):
    """Initialize main command line interface.

    Raises
    ------
    exceptions.BadExecutionLocation
        Do not allow to run any command if the "flag" file isn't found where it should be.
        See :any:`exceptions.BadExecutionLocation`.

    Parameters
    ----------
    flag_file : str
        The name of a "flag" file.
    docopt_doc : str
        docopt docstring.
    app_name : str, optional
        Application name.
    app_version : str, optional
        Application version.
    app_status : str, optional
        Application status.
    cli_class : class
        See :any:`CommandLineInterfaceSuper`.
    """
    if not os.path.exists(flag_file):
        raise exceptions.BadExecutionLocation()

    arguments = docopt(docopt_doc, version="%s %s%s" %
                       (app_name,
                        app_version,
                        " (%s)" % app_status if app_status else ""))
    cli = cli_class(arguments)
    cli.run()


if __name__ == "__main__":
    pass
