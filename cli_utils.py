#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Command line interface utilities.
"""
import os
import sys

from . import log_system, file_utils, shell_utils, exceptions
from .docopt import docopt

if sys.version_info < (3, 5):
    raise exceptions.WrongPythonVersion()


def get_docopt_base_doc(app_meta):
    """Get docopt base docstring.

    Parameters
    ----------
    app_meta : list
        The __init__ module with an application meta data.

    Returns
    -------
    str
        The docopt base docstring with an application meta data.
    """
    return """{appname} {version}{status}

{appdescription}

""".format(appname=app_meta.__appname__,
           appdescription=app_meta.__appdescription__,
           version=app_meta.__version__,
           status=" (%s)" % app_meta.__status__ if app_meta.__status__ else "")


class CommandLineInterfaceSuper():
    """Command line interface super class.

    It handles the arguments parsed by the docopt module.

    Attributes
    ----------
    logger : object
        See <class :any:`LogSystem`>.
    """
    _app_meta = None
    _cli_header_blacklist = []
    _logs_storage_dir = None

    def __init__(self):
        """Initialize.
        """
        self._check_required_properties()

        log_file = log_system.get_log_file(storage_dir=self._logs_storage_dir,
                                           prefix="CLI")
        file_utils.remove_surplus_files(self._logs_storage_dir, "CLI*")
        self.logger = log_system.LogSystem(log_file, verbose=True)

        self._display_cli_header()

    def _check_required_properties(self):
        """Check required properties.

        Raises
        ------
        exceptions.MissingMandatoryProperty
            Description
        """
        if not self._app_meta:
            raise exceptions.MissingMandatoryProperty("CommandLineInterfaceSuper._app_meta")

        if not self._logs_storage_dir:
            raise exceptions.MissingMandatoryProperty("CommandLineInterfaceSuper._logs_storage_dir")

    def _display_cli_header(self):
        """Display CLI header.
        """
        if not self._cli_header_blacklist or not all(self._cli_header_blacklist):
            self.logger.info(shell_utils.get_cli_header(self._app_meta.__appname__), date=False)
            print("")

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
            Description
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
        from subprocess import call

        call(["man", man_page_path])


def run_cli(flag_file="", docopt_doc="", app_meta={}, cli_class=None):
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
    app_meta : module
        The __init__ module with an application meta data.
    cli_class : class
        See <class :any:`CommandLineInterfaceSuper`>.
    """
    if not os.path.exists(flag_file):
        raise exceptions.BadExecutionLocation()

    arguments = docopt(docopt_doc, version="%s %s%s" %
                       (app_meta.__appname__,
                        app_meta.__version__,
                        " (%s)" % app_meta.__status__ if app_meta.__status__ else ""))
    cli = cli_class(arguments)
    cli.run()


if __name__ == "__main__":
    pass
