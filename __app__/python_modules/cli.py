#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""Main command line application.

Attributes
----------
docopt_doc : str
    Used to store/define the docstring that will be passed to docopt as the "doc" argument.
"""

import os
import sys

from threading import Thread

from . import app_utils
from .__init__ import __appname__, __version__, __appdescription__
from .python_utils import exceptions, log_system, file_utils, shell_utils
from .python_utils.docopt import docopt


if sys.version_info < (3, 5):
    raise exceptions.WrongPythonVersion()


docopt_doc = """{__appname__} {__version__}

{__appdescription__}

Usage:
    app.py manual
    app.py menu [-d <domain> | --domain=<domain>]
                [-o <dir> | --output=<dir>]
                [-n | --no-confirmation]
    app.py build (-a | --all-xlets | -x <name> | --xlet=<name>)
                 [-x <name>... | --xlet=<name>...]
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
                    [-f | --force-clean-build]
                    [-u | --update-inventories]
    app.py repo (submodules | subtrees) (init | update)
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

-f, --force-clean-build
    Clear doctree cache and destination folder when building the documentation.

-u, --update-inventories
    Update inventory files from their on-line resources when building the
    documentation. Inventory files will be updated automatically if they don't
    already exist.

Command `manual`:
    Display the manual page for this application.

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
    docs                 Generate documentation.
    docs_no_api          Generate documentation without extracting Python
                         modules docstrings.
    base_xlet            Interactively generate a "skeleton" xlet.

Sub-commands for the `repo` command:
    submodules           Manage Cinnamon Tools' repository sub-modules.
    subtrees             Manage Cinnamon Tools' repository sub-trees.

""".format(__appname__=__appname__,
           __appdescription__=__appdescription__,
           __version__=__version__)


class CommandLineTool():
    """Command line tool.

    It handles the arguments parsed by the docopt module.

    Attributes
    ----------
    action : method
        Set the method that will be executed when calling CommandLineTool.run().
    build_output : str
        Path to the folder were the built xlets are stored.
    dev_args_order : list
        List used as a gude to execute functions in the order they need to.
    do_not_cofirm : bool
        Whether to ask for overwrite confirmation when an xlet destination exists or not.
    domain_name : str
        The domain name to use to build the xlets.
    force_clean_build : bool
        Remove destination and doctrees directories before building the documentation.
    func_names : list
        Function names to be executed.
    generate_api_docs : bool
        If False, do not extract docstrings from Python modules.
    logger : object
        See <class :any:`LogSystem`>.
    restart_cinnamon : bool
        Whether or not to restart Cinnamon after the xlet/theme build process.
    theme_name : str
        The given name of the theme.
    update_inventories : bool
        Whether to force the update of the inventory files. Inventory files will be updated
        anyway f they don't exist.
    xlets : list
        The list of xlets to build.
    xlets_helper : object
        See :any:`app_utils.XletsHelperCore`.
    """
    dev_args_order = [
        "generate_meta_file",
        "update_pot_files",
        "update_spanish_localizations",
        "create_changelogs",
        "create_localized_help",
        "generate_trans_stats",
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
        file_utils.remove_surplus_files("tmp/logs", "CLI*")
        self.logger = log_system.LogSystem(filename=log_system.get_log_file(
            storage_dir="tmp/logs", prefix="CLI"), verbose=True)

        self.build_output = args["--output"]
        self.theme_name = args["--theme-name"]
        self.do_not_cofirm = args["--no-confirmation"]
        self.xlets = []
        self.func_names = []
        self.domain_name = args["--domain"]
        self.xlets_helper = None
        self.restart_cinnamon = args["--restart-cinnamon"]
        self.force_clean_build = args["--force-clean-build"]
        self.update_inventories = args["--update-inventories"]
        self.generate_api_docs = args["docs"]

        if not args["menu"] and not args["manual"]:
            self.logger.info(shell_utils.get_cli_header(__appname__), date=False)
            print("")

        if args["manual"]:
            self.action = self.display_manual_page

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
            dev_args = list(set(args["<sub_commands>"]))
            dev_args.sort(key=lambda x: self.dev_args_order.index(x))
            self.xlets_helper = app_utils.XletsHelperCore(logger=self.logger)
            self.logger.info("Command: dev")
            self.logger.info("Arguments:")

            for func in dev_args:
                if getattr(self.xlets_helper, func, False):
                    self.logger.info(func)
                    self.func_names.append(func)
                else:
                    self.logger.warning("Non existent function: %s" % func)

        if args["generate"]:
            if args["system_executable"]:
                self.logger.info("System executable generation...")
                self.action = self.system_executable_generation

            if args["docs"] or args["docs_no_api"]:
                self.logger.info("Documentation generation...")
                self.action = self.generate_docs

            if args["base_xlet"]:
                self.logger.info("Base xlet generation...")
                self.action = self.base_xlet_generation

        if args["repo"]:
            self.repo_action = "init" if args["init"] else "update" if args["update"] else ""

            if args["submodules"]:
                self.logger.info("Managing repository sub-modules...")
                self.action = self.manage_repo_submodules

            if args["subtrees"]:
                self.logger.info("Managing repository sub-trees...")
                self.action = self.manage_repo_subtrees

    def run(self):
        """Execute the assigned actions.

        Raises
        ------
        exceptions.KeyboardInterruption
            Halt execution on Ctrl + C press.
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
            raise exceptions.KeyboardInterruption()

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

    def display_manual_page(self):
        """See :any:`app_menu.CLIMenu`
        """
        from subprocess import call

        call(["man", "./app.py.1"], cwd=os.path.join(app_utils.root_folder, "__app__", "data", "man"))

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
        """See :any:`template_utils.system_executable_generation`
        """
        from .python_utils import template_utils

        template_utils.system_executable_generation(
            exec_name="cinnamon-tools-cli",
            app_root_folder=app_utils.root_folder,
            sys_exec_template_path=os.path.join(
                app_utils.root_folder, "__app__", "data", "templates", "system_executable"),
            bash_completions_template_path=os.path.join(
                app_utils.root_folder, "__app__", "data", "templates", "bash_completions.bash"),
            logger=self.logger
        )

    def generate_docs(self):
        """See :any:`sphinx_docs_utils.generate_docs`
        """
        app_utils.generate_docs(generate_api_docs=self.generate_api_docs,
                                update_inventories=self.update_inventories,
                                force_clean_build=self.force_clean_build,
                                logger=self.logger)

    def base_xlet_generation(self):
        """See :any:`app_utils.BaseXletGenerator`
        """
        base_xlet_generetor = app_utils.BaseXletGenerator(logger=self.logger)
        base_xlet_generetor.generate()

    def manage_repo_submodules(self):
        """See :any:`git_utils.manage_repo`
        """
        from .python_utils import git_utils

        git_utils.manage_repo(
            "submodule",
            self.repo_action,
            cwd=app_utils.root_folder,
            logger=self.logger
        )

    def manage_repo_subtrees(self):
        """See :any:`git_utils.manage_repo`
        """
        from .python_utils import git_utils

        subtrees = [{
            "remote_name": "python_utils",
            "remote_url": "git@gitlab.com:Odyseus/python_utils.git",
            "path": "__app__/python_modules/python_utils"
        }]
        git_utils.manage_repo(
            "subtree",
            self.repo_action,
            cwd=app_utils.root_folder,
            subtrees=subtrees,
            logger=self.logger
        )


def main():
    """Initialize main command line interface.

    Raises
    ------
    exceptions.BadExecutionLocation
        Do not allow to run any command if the "flag" file isn't
        found where it should be. See :any:`exceptions.BadExecutionLocation`.
    """
    if not os.path.exists(".cinnamon-tools.flag"):
        raise exceptions.BadExecutionLocation()

    arguments = docopt(docopt_doc, version="%s %s" % (__appname__, __version__))
    cli = CommandLineTool(arguments)
    cli.run()


if __name__ == "__main__":
    pass
