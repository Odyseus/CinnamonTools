#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""Main command line application.

Attributes
----------
docopt_doc : str
    Used to store/define the docstring that will be passed to ``docopt`` as the ``doc`` argument.
"""

import os

from threading import Thread

from . import app_utils
from .__init__ import __appdescription__
from .__init__ import __appname__
from .__init__ import __version__
from .python_utils import cli_utils
from .python_utils import exceptions


docopt_doc = """{__appname__} {__version__}

{__appdescription__}

Usage:
    app.py (-h | --help | --version | --manual | -r | --restart-cinnamon)
    app.py menu
    app.py build (-a | --all-xlets | -x <name> | --xlet=<name>)
                 [-x <name>... | --xlet=<name>...]
                 [-d <domain> | --domain=<domain>]
                 [-o <dir> | --output=<dir>]
                 [-e <dir> | --extra-files=<dir>]
                 [-i | --install-localizations]
                 [-n | --no-confirmation]
                 [-r | --restart-cinnamon]
                 [-y | --dry-run]
    app.py build_themes [-t <name> | --theme-name=<name>]
                        [-o <dir> | --output=<dir>]
                        [-n | --no-confirmation]
                        [-r | --restart-cinnamon]
                        [-y | --dry-run]
    app.py parse_sass [-y | --dry-run]
    app.py dev <sub_commands>...
               [-x <name>... | --xlet=<name>...]
    app.py generate (system_executable | docs | docs_no_api | base_xlet |
                    repo_changelog | themes_changelog | all_changelogs)
                    [-f | --force-clean-build]
                    [-u | --update-inventories]
    app.py print_xlets_slugs
    app.py repo (submodules | subtrees) (init | update) [-y | --dry-run]

Options:

-h, --help
    Show this application basic help.

--manual
    Show this application manual page.

--version
    Show application version.

-a, --all-xlets
    Build all xlets.

-d <domain>, --domain=<domain>
    This option should be used to define a domain name for use when
    building xlets.
    A file named **domain_name** can also be created inside a folder named
    **tmp** at the root of the repository whose only content should be the
    desired domain name.
    This option has precedence over the domain name found inside
    the **domain_name** file.

-e <dir>, --extra-files=<dir>
    Path to a folder containing files that will be copied into an xlet folder
    at build time. Read the documentation to learn how this option works.

-f, --force-clean-build
    Clear doctree cache and destination folder when building the documentation.

-i, --install-localizations
    Install xlets localizations after building xlets.

-n, --no-confirmation
    Do not ask confirmation when building an xlet and the destination already
    exists. Specifying this option means that an existent destination will be
    completely removed, no questions asked.

-o <dir>, --output=<dir>
    The output directory that will be used to save the built xlets.
    **WARNING!!!** If the destination folder is inside a Dropbox folder, all
    symbolic links will be resolved.

-r, --restart-cinnamon
    Restart Cinnamon.

-t <name>, --theme-name=<name>
    A string used to give a name to the themes. The final theme names will look
    like this: **<theme_name>-<theme_variant>**.
    A file named **theme_name** can also be created inside a folder named
    **tmp** at the root of the repository whose only content should be the
    desired theme name.
    This option has precedence over the theme name found inside
    the **theme_name** file.

-u, --update-inventories
    Update inventory files from their on-line resources when building the
    documentation. Inventory files will be updated automatically if they don't
    already exist.

-x <name>, --xlet=<name>
    Specify one or more applets/extensions to build.

-y, --dry-run
    Do not perform file system changes. Only display messages informing of the
    actions that will be performed or commands that will be executed.
    WARNING! Some file system changes will be performed (e.g. temporary files
    creation).

""".format(__appname__=__appname__,
           __appdescription__=__appdescription__,
           __version__=__version__)


class CommandLineInterface(cli_utils.CommandLineInterfaceSuper):
    """Command line tool.

    It handles the arguments parsed by the ``docopt`` module.

    Attributes
    ----------
    a : dict
        Where ``docopt_args`` is stored.
    action : method
        Set the method that will be executed when calling CommandLineInterface.run().
    dev_args_order : list
        List used as a guide to execute functions in the order they need to.
    func_names : list
        A list of function names that will be used to execute those functions
        in the order they were defined (passed as arguments).
    repo_action : str
        Which action to perform on a repository.
    xlets_display_names : list
        The complete or partial list of xlets as returned by :any:`get_xlets_display_names`.
    xlets_helper : XletsHelperCore
        An instantiated ``XletsHelperCore`` instance.
    """
    action = None
    func_names = []
    dev_args_order = [
        "generate_meta_file",
        "update_pot_files",
        "update_spanish_localizations",
        "create_xlets_changelogs",
        "create_localized_help",
        "generate_trans_stats"
    ]
    xlets_display_names = []
    xlets_helper = None

    def __init__(self, docopt_args):
        """Initialize.

        Parameters
        ----------
        docopt_args : dict
            The dictionary of arguments as returned by ``docopt`` parser.
        """
        self.a = docopt_args
        self._cli_header_blacklist = [
            self.a["--manual"],
            self.a["print_xlets_slugs"],
            self.a["menu"]
        ]
        self._print_log_blacklist = [
            self.a["print_xlets_slugs"]
        ]

        super().__init__(__appname__, "tmp/logs")

        if self.a["build"] or self.a["dev"]:
            all_xlets_display_names = app_utils.get_xlets_display_names()

            if self.a["--all-xlets"]:
                self.xlets_display_names = all_xlets_display_names
            elif self.a["--xlet"]:
                # NOTE: Deduplicate arguments. Workaround docopt issue:
                # https://github.com/docopt/docopt/issues/134
                # Not perfect, but good enough for this particular usage case.
                for x in set(self.a["--xlet"]):
                    if "Applet " + x in all_xlets_display_names:
                        self.xlets_display_names.append("Applet " + x)
                    elif "Extension " + x in all_xlets_display_names:
                        self.xlets_display_names.append("Extension " + x)

            self.xlets_display_names = sorted(self.xlets_display_names)

        if self.a["print_xlets_slugs"]:
            self.action = self.print_xlets_slugs
        elif self.a["--manual"]:
            self.action = self.display_manual_page
        elif self.a["menu"]:
            self.action = self.display_main_menu
        elif self.a["build"]:
            self.action = self.build_xlets

            if self.a["--all-xlets"]:
                self.logger.info("**Building all xlets.**")
            elif self.a["--xlet"]:
                self.logger.info("**Building the following xlets:**")

                for x in self.xlets_display_names:
                    self.logger.info(x)
        elif self.a["build_themes"]:
            self.action = self.build_themes
            self.logger.info("**Building all themes.**")
        elif self.a["parse_sass"]:
            self.action = self.parse_sass
            self.logger.info("**Parsing Sass files.**")
        elif self.a["dev"]:
            # NOTE: Deduplicate arguments. Workaround docopt issue:
            # https://github.com/docopt/docopt/issues/134
            dev_args = list(set(self.a["<sub_commands>"]))
            # NOTE: Sort the arguments so one doesn't have to worry about the order
            # in which they are passed.
            # Source: https://stackoverflow.com/a/12814719.
            dev_args.sort(key=lambda x: self.dev_args_order.index(x))
            # NOTE: Do not pass xlets unnecessarily so in the initialization side of
            # app_utils.XletsHelperCore all the xlets metadata is used and no filtering
            # is done.
            pass_xlets = bool(self.a["--xlet"])
            self.xlets_helper = app_utils.XletsHelperCore(
                xlets_display_names=self.xlets_display_names if pass_xlets else None,
                logger=self.logger
            )
            self.logger.info("**Command:** dev")
            self.logger.info("**Arguments:**")

            for func in dev_args:
                if getattr(self.xlets_helper, func, False):
                    self.logger.info(func)
                    self.func_names.append(func)
                else:
                    self.logger.warning("**Non existent function:** %s" % func)

            # NOTE: append last so all the errors caught will be printed at the end.
            if self.func_names:
                self.func_names.append("log_errors")
        elif self.a["generate"]:
            if self.a["system_executable"]:
                self.logger.info("**System executable generation...**")
                self.action = self.system_executable_generation

            if self.a["docs"] or self.a["docs_no_api"]:
                self.logger.info("**Documentation generation...**")
                self.action = self.generate_docs

            if self.a["base_xlet"]:
                self.logger.info("**Base xlet generation...**")
                self.action = self.base_xlet_generation

            if self.a["repo_changelog"]:
                self.logger.info("**Repository changelog generation...**")
                self.action = self.generate_repo_changelog

            if self.a["themes_changelog"]:
                self.logger.info("**Themes changelog generation...**")
                self.action = self.generate_themes_changelog

            if self.a["all_changelogs"]:
                self.logger.info("**Changelogs generation...**")
                self.action = self.generate_all_changelogs
        elif self.a["repo"]:
            self.repo_action = "init" if self.a["init"] else "update" if self.a["update"] else ""

            if self.a["submodules"]:
                self.logger.info("**Managing repository sub-modules...**")
                self.action = self.manage_repo_submodules

            if self.a["subtrees"]:
                self.logger.info("**Managing repository sub-trees...**")
                self.action = self.manage_repo_subtrees

    def run(self):
        """Execute the assigned actions.

        Raises
        ------
        exceptions.KeyboardInterruption
            Halt execution on Ctrl + C press.
        """
        threads = []

        try:
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

            self.print_log_file()
        except (KeyboardInterrupt, SystemExit):
            self.print_log_file()
            raise exceptions.KeyboardInterruption()
        else:
            if self.a["--restart-cinnamon"]:
                if self.a["--dry-run"]:
                    self.logger.log_dry_run("**Cinnamon will be restarted.**")
                else:
                    t = Thread(target=app_utils.restart_cinnamon)
                    t.daemon = True
                    t.start()
                    threads.append(t)

                    for thread in threads:
                        if thread is not None and thread.isAlive():
                            thread.join()

    def display_main_menu(self):
        """See :any:`app_menu.CLIMenu`
        """
        from . import app_menu

        cli_menu = app_menu.CLIMenu(logger=self.logger)
        cli_menu.open_main_menu()

    def display_manual_page(self):
        """See :any:`cli_utils.CommandLineInterfaceSuper._display_manual_page`.
        """
        self._display_manual_page(os.path.join(app_utils.root_folder,
                                               "__app__", "data", "man", "app.py.1"))

    def build_xlets(self):
        """See :any:`app_utils.build_xlets`
        """
        app_utils.build_xlets(xlets_display_names=self.xlets_display_names,
                              domain_name=self.a["--domain"],
                              build_output=self.a["--output"],
                              do_not_confirm=self.a["--no-confirmation"],
                              install_localizations=self.a["--install-localizations"],
                              extra_files=self.a["--extra-files"],
                              dry_run=self.a["--dry-run"],
                              logger=self.logger)

    def build_themes(self):
        """See :any:`app_utils.build_themes`
        """
        app_utils.build_themes(theme_name=self.a["--theme-name"],
                               build_output=self.a["--output"],
                               do_not_confirm=self.a["--no-confirmation"],
                               dry_run=self.a["--dry-run"],
                               logger=self.logger)

    def parse_sass(self):
        """See :any:`app_utils.parse_sass`
        """
        app_utils.parse_sass(dry_run=self.a["--dry-run"],
                             logger=self.logger)

    def system_executable_generation(self):
        """See :any:`cli_utils.CommandLineInterfaceSuper._system_executable_generation`.
        """
        self._system_executable_generation(
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
        app_utils.generate_docs(generate_api_docs=self.a["docs"],
                                update_inventories=self.a["--update-inventories"],
                                force_clean_build=self.a["--force-clean-build"],
                                logger=self.logger)

    def generate_repo_changelog(self):
        """See :any:`app_utils.generate_repo_changelog`.
        """
        app_utils.generate_repo_changelog(logger=self.logger)

    def generate_themes_changelog(self):
        """See :any:`app_utils.generate_themes_changelog`.
        """
        app_utils.generate_themes_changelog(logger=self.logger)

    def generate_all_changelogs(self):
        """See :any:`app_utils.generate_repo_changelog` and :any:`app_utils.generate_themes_changelog`.
        """
        app_utils.generate_repo_changelog(logger=self.logger)
        app_utils.generate_themes_changelog(logger=self.logger)

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
            dry_run=self.a["--dry-run"],
            logger=self.logger
        )

    def manage_repo_subtrees(self):
        """See :any:`git_utils.manage_repo`
        """
        from .python_utils import git_utils

        subtrees = [{
            "url": "git@gitlab.com:Odyseus/python_utils.git",
            "path": "__app__/python_modules/python_utils"
        }]
        git_utils.manage_repo(
            "subtree",
            self.repo_action,
            cwd=app_utils.root_folder,
            subtrees=subtrees,
            dry_run=self.a["--dry-run"],
            logger=self.logger
        )

    def print_xlets_slugs(self):
        """See :any:`app_utils.print_xlets_slugs`
        """
        app_utils.print_xlets_slugs()


def main():
    """Initialize command line interface.
    """
    cli_utils.run_cli(flag_file=".cinnamon-tools.flag",
                      docopt_doc=docopt_doc,
                      app_name=__appname__,
                      app_version=__version__,
                      cli_class=CommandLineInterface)


if __name__ == "__main__":
    pass
