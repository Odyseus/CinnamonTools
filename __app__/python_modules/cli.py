#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Main command line application.

Attributes
----------
docopt_doc : str
    Used to store/define the docstring that will be passed to ``docopt`` as the ``doc`` argument.
"""
import os

from threading import Thread

from .python_utils import cli_utils
from .python_utils import exceptions

from . import app_utils
from . import theme_utils
from . import xlets_utils
from .__init__ import __appdescription__
from .__init__ import __appname__
from .__init__ import __version__


docopt_doc = f"""{__appname__} {__version__}

{__appdescription__}

Usage:
    app.py (-h | --help | --version | --manual | -r | --restart-cinnamon)
    app.py menu
    app.py build_xlets [-x <name>... | --xlet-name=<name>...]
                       [-d <domain> | --domain=<domain>]
                       [-o <dir> | --output=<dir>]
                       [-e <dir> | --extra-files=<dir>]
                       [-i | --install-localizations]
                       [-n | --no-confirmation]
                       [-r | --restart-cinnamon]
    app.py build_themes [-t <name> | --theme-name=<name>]
                        [-v <name>... | --variant-name=<name>...]
                        [-o <dir> | --output=<dir>]
                        [-n | --no-confirmation]
                        [-r | --restart-cinnamon]
    app.py dev_xlets <sub_commands>...
                     [-x <name>... | --xlet-name=<name>...]
    app.py dev_themes <sub_commands>...
                      [-s <exec> | --sass-parser=<exec>]
                      [-v <name>... | --variant-name=<name>...]
    app.py generate (system_executable | docs | docs_no_api | base_xlet |
                    repo_changelog | themes_changelog | all_changelogs)
                    [-f | --force-clean-build]
                    [-u | --update-inventories]
    app.py print_xlets_slugs
    app.py print_theme_variants
    app.py repo (submodules | subtrees) (init | update)

Options:

-h, --help
    Show this application basic help.

--manual
    Show this application manual page.

--version
    Show application version.

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

-s <exec>, --sass-parser=<exec>
    Name or absolute path to Dart Sass executable. This may be needed only if
    Dart Sass isn't available in a system's PATH.

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

-v <name>, --variant-name=<name>
    Theme variant name (the name of its folder). If not specified, all theme
    variants will be worked on.

-x <name>, --xlet-name=<name>
    Specify one or more applets/extensions to build. If none are specified,
    all xlets will be built.

dev_xlets <sub_commands>:

    **generate_meta_file**
        Generate the file containing all the metadata of all xlets on this
        repository.

    **update_pot_files**
        Update all .pot files from all xlets.

    **update_spanish_localizations**
        Update all Spanish localizations from all xlets.

    **create_xlets_changelogs**
        Generate the CHANGELOG.md files for all xlets.

    **create_localized_help**
        Execute the create_localized_help.py script for each xlet to generate
        their HELP.html files.

    **generate_trans_stats**
        Generate translations statistics.

    **check_js_modules**
        Check if a JS module defined in an xlet configuration file is actually
        used/imported by an xlet and vice versa.

dev_themes <sub_commands>:

    **generate_gtk_sass_includes_index**
        Generate Gtk includes index file.

    **parse_sass**
        Parse Sass files.

    **generate_thumbnails**
        Generate themes thumbnails.

"""


class CommandLineInterface(cli_utils.CommandLineInterfaceSuper):
    """Command line tool.

    It handles the arguments parsed by the ``docopt`` module.

    Attributes
    ----------
    a : dict
        Where ``docopt_args`` is stored.
    action : method
        Set the method that will be executed when calling CommandLineInterface.run().
    dev_theme_args_order : list
        List used as a guide to execute functions in the order they need to.
    dev_themes_func_names : list
        A list of function names that will be used to execute those functions
        in the order they were defined (passed as arguments).
    dev_xlets_args_order : list
        List used as a guide to execute functions in the order they need to.
    dev_xlets_func_names : list
        A list of function names that will be used to execute those functions
        in the order they were defined (passed as arguments).
    repo_action : str
        Which action to perform on a repository.
    theme_helper : ThemeHelperCore
        An instantiated ``ThemeHelperCore`` instance.
    theme_variants : list
        The complete or partial list of theme variants.
    xlets_display_names : list
        The complete or partial list of xlets as returned by :any:`get_xlets_display_names`.
    xlets_helper : XletsHelperCore
        An instantiated ``XletsHelperCore`` instance.
    """
    action = None
    dev_xlets_func_names = []
    dev_themes_func_names = []
    dev_xlets_args_order = [
        "generate_meta_file",
        "update_pot_files",
        "update_spanish_localizations",
        "create_xlets_changelogs",
        "create_localized_help",
        "generate_trans_stats",
        "check_js_modules"
    ]
    dev_theme_args_order = [
        "generate_gtk_sass_includes_index",
        "parse_sass",
        "generate_thumbnails"
    ]
    xlets_display_names = []
    theme_variants = []
    xlets_helper = None
    theme_helper = None

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
            self.a["print_theme_variants"],
            self.a["menu"]
        ]
        self._print_log_blacklist = [
            self.a["--manual"],
            self.a["print_xlets_slugs"],
            self.a["print_theme_variants"]
        ]

        super().__init__(__appname__, "tmp/logs")

        if self.a["build_themes"] or self.a["dev_themes"]:
            self.theme_variants = sorted(list(set(self.a["--variant-name"])))
        elif self.a["build_xlets"] or self.a["dev_xlets"]:
            all_xlets_display_names = xlets_utils.get_xlets_display_names()

            if self.a["--xlet-name"]:
                # NOTE: Deduplicate arguments. Workaround docopt issue:
                # https://github.com/docopt/docopt/issues/134
                # Not perfect, but good enough for this particular usage case.
                for x in set(self.a["--xlet-name"]):
                    if f"Applet {x}" in all_xlets_display_names:
                        self.xlets_display_names.append(f"Applet {x}")
                    elif f"Extension {x}" in all_xlets_display_names:
                        self.xlets_display_names.append(f"Extension {x}")
            else:
                self.xlets_display_names = all_xlets_display_names

            self.xlets_display_names = sorted(self.xlets_display_names)

        if self.a["print_theme_variants"]:
            self.action = self.print_theme_variants
        elif self.a["print_xlets_slugs"]:
            self.action = self.print_xlets_slugs
        elif self.a["--manual"]:
            self.action = self.display_manual_page
        elif self.a["menu"]:
            self.action = self.display_main_menu
        elif self.a["build_xlets"]:
            self.action = self.build_xlets

            if self.a["--xlet-name"]:
                self.logger.info("**Building the following xlets:**")

                for x in self.xlets_display_names:
                    self.logger.info(x)
            else:
                self.logger.info("**Building all xlets.**")
        elif self.a["build_themes"]:
            self.action = self.build_themes
            self.logger.info("**Building all themes.**")
        elif self.a["dev_themes"]:
            dev_themes_args = list(set(self.a["<sub_commands>"]))
            dev_themes_args.sort(key=lambda x: self.dev_theme_args_order.index(x))

            pass_variants = bool(self.a["--variant-name"])
            self.theme_helper = theme_utils.ThemeHelperCore(
                theme_variants=self.theme_variants if pass_variants else None,
                sass_parser=self.a["--sass-parser"],
                logger=self.logger
            )

            self.logger.info("**Command:** dev_themes")
            self.logger.info("**Arguments:**")

            for func in dev_themes_args:
                if func in self.dev_theme_args_order:
                    self.logger.info(func)
                    self.dev_themes_func_names.append(func)
                else:
                    self.logger.warning("**Non existent function:** %s" % func)
        elif self.a["dev_xlets"]:
            # NOTE: Deduplicate arguments. Workaround docopt issue:
            # https://github.com/docopt/docopt/issues/134
            dev_args = list(set(self.a["<sub_commands>"]))
            # NOTE: Sort the arguments so one doesn't have to worry about the order
            # in which they are passed.
            # Source: https://stackoverflow.com/a/12814719.
            dev_args.sort(key=lambda x: self.dev_xlets_args_order.index(x))
            # NOTE: Do not pass xlets unnecessarily so in the initialization side of
            # xlets_utils.XletsHelperCore all the xlets metadata is used and no filtering
            # is done.
            pass_xlets = bool(self.a["--xlet-name"])
            self.xlets_helper = xlets_utils.XletsHelperCore(
                xlets_display_names=self.xlets_display_names if pass_xlets else None,
                logger=self.logger
            )
            self.logger.info("**Command:** dev_xlets")
            self.logger.info("**Arguments:**")

            for func in dev_args:
                if getattr(self.xlets_helper, func, False):
                    self.logger.info(func)
                    self.dev_xlets_func_names.append(func)
                else:
                    self.logger.warning("**Non existent function:** %s" % func)

            # NOTE: append last so all the errors caught will be printed at the end.
            if self.dev_xlets_func_names:
                self.dev_xlets_func_names.append("log_errors")
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
            if self.dev_xlets_func_names:
                for func in self.dev_xlets_func_names:
                    t = Thread(target=getattr(self.xlets_helper, func, None))
                    t.daemon = True
                    t.start()
                    threads.append(t)

                    for thread in threads:
                        if thread is not None and thread.is_alive():
                            thread.join()

            if self.dev_themes_func_names:
                for func in self.dev_themes_func_names:
                    t = Thread(target=getattr(self.theme_helper, func, None))
                    t.daemon = True
                    t.start()
                    threads.append(t)

                    for thread in threads:
                        if thread is not None and thread.is_alive():
                            thread.join()

            if self.action:
                t = Thread(target=self.action)
                t.daemon = True
                t.start()
                threads.append(t)

                for thread in threads:
                    if thread is not None and thread.is_alive():
                        thread.join()

            self.print_log_file()
        except (KeyboardInterrupt, SystemExit):
            self.print_log_file()
            raise exceptions.KeyboardInterruption()
        else:
            if self.a["--restart-cinnamon"]:
                t = Thread(target=app_utils.restart_cinnamon)
                t.daemon = True
                t.start()
                threads.append(t)

                for thread in threads:
                    if thread is not None and thread.is_alive():
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
        """See :any:`xlets_utils.build_xlets`
        """
        xlets_utils.build_xlets(xlets_display_names=self.xlets_display_names,
                                domain_name=self.a["--domain"],
                                build_output=self.a["--output"],
                                do_not_confirm=self.a["--no-confirmation"],
                                install_localizations=self.a["--install-localizations"],
                                extra_files=self.a["--extra-files"],
                                logger=self.logger)

    def build_themes(self):
        """See :any:`theme_utils.build_themes`
        """
        theme_utils.build_themes(theme_name=self.a["--theme-name"],
                                 theme_variants=sorted(list(set(self.a["--variant-name"]))),
                                 build_output=self.a["--output"],
                                 do_not_confirm=self.a["--no-confirmation"],
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
        """See :any:`theme_utils.generate_themes_changelog`.
        """
        theme_utils.generate_themes_changelog(logger=self.logger)

    def generate_all_changelogs(self):
        """See :any:`app_utils.generate_repo_changelog` and :any:`theme_utils.generate_themes_changelog`.
        """
        app_utils.generate_repo_changelog(logger=self.logger)
        theme_utils.generate_themes_changelog(logger=self.logger)

    def base_xlet_generation(self):
        """See :any:`xlets_utils.BaseXletGenerator`
        """
        base_xlet_generetor = xlets_utils.BaseXletGenerator(logger=self.logger)
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
            "url": "git@gitlab.com:Odyseus/python_utils.git",
            "path": "__app__/python_modules/python_utils"
        }]
        git_utils.manage_repo(
            "subtree",
            self.repo_action,
            cwd=app_utils.root_folder,
            subtrees=subtrees,
            logger=self.logger
        )

    def print_xlets_slugs(self):
        """See :any:`xlets_utils.print_xlets_slugs`
        """
        xlets_utils.print_xlets_slugs()

    def print_theme_variants(self):
        """See :any:`theme_utils.print_theme_variants`
        """
        theme_utils.print_theme_variants()


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
