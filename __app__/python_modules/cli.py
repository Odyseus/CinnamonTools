#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""Main command line application.

Attributes
----------
docopt_doc : str
    Used to store/define the docstring that will be passed to docopt as the "doc" argument.
env : dict
    Copy of the system's environment to be passed to Popen.
root_folder : str
    The main folder containing the application. All commands must be executed from this location
    without exceptions.
"""

import os
import sys

from threading import Thread

from . import app_utils
from .__init__ import __appname__, __version__
from .docopt import docopt


if sys.version_info < (3, 5):
    raise app_utils.WrongPythonVersion()

env = os.environ.copy()

root_folder = os.path.realpath(os.path.abspath(os.path.join(
    os.path.normpath(os.path.join(os.path.dirname(__file__), *([".."] * 2))))))


docopt_doc = """{__appname__} {__version__}

Usage:
    app.py menu [-d <domain> | --domain=<domain>]
                [-o <dir> | --output=<dir>]
                [-n | --no-confirmation]
    app.py build (-a | --all-xlets | -x <name> | --xlet=<name>)
                 [-x <name> | --xlet=<name>]...
                 [-d <domain> | --domain=<domain>]
                 [-o <dir> | --output=<dir>]
                 [-n | --no-confirmation]
                 [-r | --restart-cinnamon]
    app.py build_themes [-t <name> | --theme-name=<name>]
                        [-o <dir> | --output=<dir>]
                        [-n | --no-confirmation]
                        [-r | --restart-cinnamon]
    app.py dev <sub_commands>...
    app.py generate (system_executable | docs | docs_no_api | base_xlet)
    app.py (-h | --help | --version | -r | --restart-cinnamon)

Options:

-h, --help
    Show this screen.

--version
    Show application version.

-x <name>, --xlet=<name>
    Specify one or more applets/extensions to build.

-a, --all-xlets
    Build all xlets.

-d <domain>, --domain=<domain>
    This option should be used to define a domain name for use when
    building xlets.
    A file named "domain_name" can also be created at the root of the repository
    whose only content should be the desired domain name.
    This option has precedence over the domain name found inside
    the "domain_name" file.

-o <dir>, --output=<dir>
    The output directory that will be used to save the built xlets.
    WARNING!!! If the destination folder is inside a Dropbox folder, all
    symbolic links will be resolved.

-n, --no-confirmation
    Do not ask confirmation when building an xlet and the destination already
    exists. Specifying this option means that an existent destination will be
    completely removed, no questions asked.

-r, --restart-cinnamon
    Restart Cinnamon.

-t <name>, --theme-name=<name>
    A string used to give a name to the themes. The final theme names will look
    like this: <theme_name>-<theme_variant>.
    A file named "theme_name" can also be created at the root of the repository
    whose only content should be the desired theme name.
    This option has precedence over the theme name found inside
    the "theme_name" file.

Command `menu`:
    Open a CLI menu to perform tasks.

Command `build`:
    Build the specified xlets.

Command `build_themes`:
    Build all the themes variants.

Sub-commands for the `dev` command and the order they will be executed:
    generate_meta_file              update_pot_files
    update_spanish_localizations    create_localized_help
    generate_trans_stats            create_changelogs

Sub-commands for the `generate` command:
    system_executable    Create an executable for this application on the system
                         PATH to be able to run it from anywhere.
    docs                 Generate documentation page.
    docs_no_api          Generate documentation page without extracting Python
                         modules docstrings.
    base_xlet            Generate a "skeleton" xlet.

""".format(__appname__=__appname__,
           __version__=__version__)


class CommandLineTool():
    """Command line tool.

    It handles the arguments parsed by the docopt module.

    Attributes
    ----------
    action : method
        Set the method that will be executed when calling CommandLineTool.run().
    build_output : TYPE
        Description
    dev_args_order : list
        List used as a gude to execute functions in the order they need to.
    do_not_cofirm : TYPE
        Description
    func_names : list
        Description
    logger : object
        See <class :any:`app_utils.LogSystem`>.
    xlets : list
        Description
    xlets_helper : object
        See :any:`app_utils.XletsHelperCore`.
    """
    dev_args_order = [
        "generate_meta_file",
        "update_pot_files",
        "update_spanish_localizations",
        "create_localized_help",
        "generate_trans_stats",
        "create_changelogs",
    ]

    def __init__(self, args):
        """
        Parameters
        ----------
        args : dict
            The dictionary of arguments as returned by docopt parser.
        """
        super(CommandLineTool, self).__init__()

        self.action = None
        app_utils.remove_surplus_files("tmp/logs", "CLI*")
        self.logger = app_utils.LogSystem(filename=app_utils.get_log_file(
            storage_dir="tmp/logs", prefix="CLI"), verbose=True)

        self.build_output = args["--output"]
        self.theme_name = args["--theme-name"]
        self.do_not_cofirm = args["--no-confirmation"]
        self.xlets = []
        self.func_names = []
        self.domain_name = args["--domain"]
        self.xlets_helper = None
        self.restart_cinnamon = args["--restart-cinnamon"]

        if not args["menu"]:
            self.logger.info(app_utils.get_cli_header(__appname__), date=False)
            print("")

        if args["menu"]:
            self.action = self.display_main_menu

        if args["build"]:
            self.action = self.build_xlets
            all_xlets = app_utils.get_xlets_dirs()

            if args["--all-xlets"]:
                self.logger.info("Building all xlets.")
                self.xlets = all_xlets
            elif args["--xlet"]:
                self.logger.info("Building the following xlets:")

                # Workaround docopt issue:
                # https://github.com/docopt/docopt/issues/134
                # Not perfect, but good enough for this particular usage case.
                for x in set(args["--xlet"]):
                    if "Applet " + x in all_xlets:
                        self.xlets.append("Applet " + x)
                    elif "Extension " + x in all_xlets:
                        self.xlets.append("Extension " + x)

                for x in sorted(self.xlets):
                    self.logger.info(x)

        if args["build_themes"]:
            self.action = self.build_themes
            self.logger.info("Building all themes.")

        if args["dev"]:
            # Sort the arguments so one doesn't have to worry about the order
            # in which they are passed.
            # Source: https://stackoverflow.com/a/12814719.
            args["<sub_commands>"].sort(key=lambda x: self.dev_args_order.index(x))
            self.xlets_helper = app_utils.XletsHelperCore(logger=self.logger)
            self.logger.info("Command: dev")
            self.logger.info("Arguments:")

            for func in list(set(args["<sub_commands>"])):
                if getattr(self.xlets_helper, func, False):
                    self.logger.info(func)
                    self.func_names.append(func)
                else:
                    self.logger.warning("Non existent function: %s" % func)

        if args["generate"]:
            if args["system_executable"]:
                self.logger.info("System executable generation...")
                self.action = self.system_executable_generation

            if args["docs"]:
                self.logger.info("Documentation generation...")
                self.action = self.docs_generation

            if args["docs_no_api"]:
                self.logger.info("Documentation generation...")
                self.action = self.docs_no_api_generation

            if args["base_xlet"]:
                self.logger.info("Base xlet generation...")
                self.action = self.base_xlet_generation

    def run(self):
        """Execute the assigned actions.
        """
        try:
            threads = []

            if self.func_names:
                for func in self.func_names:
                    t = Thread(target=getattr(self.xlets_helper, func, None))
                    t.daemon = True
                    t.start()
                    threads.append(t)

                    for thread in threads:
                        if thread is not None and thread.isAlive():
                            thread.join()

            if self.action:
                t = Thread(target=self.action)
                t.daemon = True
                t.start()
                threads.append(t)

                for thread in threads:
                    if thread is not None and thread.isAlive():
                        thread.join()

            if self.restart_cinnamon:
                t = Thread(target=app_utils.restart_cinnamon)
                t.daemon = True
                t.start()
                threads.append(t)

                for thread in threads:
                    if thread is not None and thread.isAlive():
                        thread.join()
        except (KeyboardInterrupt, SystemExit):
            raise app_utils.KeyboardInterruption()

    def display_main_menu(self):
        """See :any:`app_menu.CLIMenu`
        """
        from . import app_menu
        cli_menu = app_menu.CLIMenu(theme_name=self.theme_name,
                                    domain_name=self.domain_name,
                                    build_output=self.build_output,
                                    do_not_cofirm=self.do_not_cofirm,
                                    logger=self.logger)
        cli_menu.open_main_menu()

    def build_xlets(self):
        """See :any:`app_utils.build_xlets`
        """
        app_utils.build_xlets(xlets=self.xlets,
                              domain_name=self.domain_name,
                              build_output=self.build_output,
                              do_not_cofirm=self.do_not_cofirm,
                              logger=self.logger)

    def build_themes(self):
        """See :any:`app_utils.build_themes`
        """
        app_utils.build_themes(theme_name=self.theme_name,
                               build_output=self.build_output,
                               do_not_cofirm=self.do_not_cofirm,
                               logger=self.logger)

    def system_executable_generation(self):
        """See :any:`app_utils.system_executable_generation`
        """
        app_utils.system_executable_generation(
            "cinnamon-tools-app", root_folder, logger=self.logger)

    def docs_generation(self):
        """See :any:`app_utils.generate_docs`
        """
        app_utils.generate_docs(True)

    def docs_no_api_generation(self):
        """See :any:`app_utils.generate_docs`
        """
        app_utils.generate_docs(False)

    def base_xlet_generation(self):
        """See :any:`app_utils.BaseXletGenerator`
        """
        base_xlet_generetor = app_utils.BaseXletGenerator(logger=self.logger)
        base_xlet_generetor.generate()


def main():
    """Initialize main command line interface.

    Raises
    ------
    app_utils.BadExecutionLocation
        Do not allow to run any command if the "flag" file isn't
        found where it should be. See :any:`app_utils.BadExecutionLocation`.
    """
    if not os.path.exists(".cinnamon-tools.flag"):
        raise app_utils.BadExecutionLocation()

    arguments = docopt(docopt_doc, version="%s %s" % (__appname__, __version__))
    cli = CommandLineTool(arguments)
    cli.run()


if __name__ == "__main__":
    pass
