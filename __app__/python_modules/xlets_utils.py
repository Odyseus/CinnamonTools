#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Module with utility functions and classes.

Attributes
----------
root_folder : str
    The main folder containing the application. All commands must be executed from this location
    without exceptions.
validate_options_1 : method
    Function to validate numeric input.
validate_options_1_2 : method
    Function to validate numeric input.
"""
import json
import os
import sys

from shutil import copy2
from shutil import copytree
from shutil import ignore_patterns
from shutil import rmtree

from .python_utils import cmd_utils
from .python_utils import file_utils
from .python_utils import misc_utils
from .python_utils import prompts
from .python_utils import string_utils
from .python_utils import yaml_utils
from .python_utils.simple_validators import generate_numeral_options_validator
from .python_utils.simple_validators import validate_output_path

from . import app_data
from . import app_utils

root_folder = os.path.realpath(os.path.abspath(os.path.join(
    os.path.normpath(os.path.join(os.path.dirname(__file__), *([os.pardir] * 2))))))
validate_options_1 = generate_numeral_options_validator(1)
validate_options_1_2 = generate_numeral_options_validator(2)


class XletsHelperCore():
    """Xlets core functions.

    Attributes
    ----------
    all_xlets_meta : list
        All xlets meta data.
    logger : LogSystem
        The logger.
    xlets_display_names : list
        The complete list of xlets as returned by :any:`get_xlets_display_names`.
    xlets_meta : dict
        The metadata of all xlets in this repository.
    """

    def __init__(self, xlets_display_names=[], logger=None):
        """Initialize.

        Parameters
        ----------
        xlets_display_names : list, optional
            The complete list of xlets as returned by :any:`get_xlets_display_names`.
        logger : LogSystem
            The logger.
        """
        self.logger = logger
        self.xlets_display_names = xlets_display_names
        self.all_xlets_meta = app_utils.AllXletsMetadata().meta_list
        self._errors = {}

        self._store_xlets_meta()

    def _store_xlets_meta(self):
        """Set xlets metadata.
        """
        if self.xlets_display_names:
            xlets_filter = [f.split(" ")[1] for f in self.xlets_display_names]
            self.xlets_meta = [x for x in self.all_xlets_meta if x["slug"] in xlets_filter]
        else:
            self.xlets_meta = self.all_xlets_meta

    def generate_meta_file(self):
        """See :any:`app_utils.generate_meta_file`
        """
        self.all_xlets_meta = app_utils.generate_meta_file()
        self._store_xlets_meta()

    def check_js_modules(self):
        """Check JavaScript modules.

        This function checks if a JS module defined in an xlet configuration file is actually
        used/imported by an xlet. It also checks if an xlet used/imported by an xlet is actually
        defined in an xlet configuration file.

        TODO
        ----
        Deal with JS files inside an xlet folder that might not need to be checked. For example,
        JS files belonging to HTML assets don't need to be checked.
        """
        app_utils.print_separator(self.logger, "#")
        self.logger.info("**Checking xlets JavaScript modules...**")

        all_js_modules = [entry.name for entry in os.scandir(app_data.PATHS["js_modules"])
                          if entry.is_file(follow_symlinks=False)]

        for xlet in self.xlets_meta:
            app_utils.print_separator(self.logger)
            self.logger.info(f'**Checking JavaScript modules for {xlet["name"]}...**')

            js_files_data = {}
            xlet_root_folder = file_utils.get_parent_dir(xlet["meta-path"], 0)
            xlet_config_file = os.path.join(xlet_root_folder, "__data__", "config.yaml")

            if file_utils.is_real_file(xlet_config_file):
                with open(xlet_config_file, "r") as config_file:
                    extra_settings = yaml_utils.load(config_file)

                if "javascript_modules" not in extra_settings:
                    continue

            for root, dirs, files in os.walk(xlet_root_folder, topdown=False):
                for fname in files:
                    if not fname.endswith(".js"):
                        continue

                    js_file_path = os.path.join(root, fname)

                    with open(js_file_path, "r") as js_file:
                        js_files_data[js_file_path] = js_file.read()

            not_used_modules = []
            not_defined_modules = []

            for js_module in extra_settings["javascript_modules"]:
                js_module_used = False

                for js_file_path, js_file_content in js_files_data.items():
                    if js_module_used:
                        break

                    js_module_used = js_module in js_file_content

                if not js_module_used:
                    not_used_modules.append(js_module)

            for js_module in all_js_modules:
                js_module_used = False

                for js_file_path, js_file_content in js_files_data.items():
                    if js_module_used:
                        break

                    js_module_used = js_module in js_file_content

                if js_module_used and js_module not in extra_settings["javascript_modules"]:
                    not_defined_modules.append(js_module)

            if not_used_modules:
                self.logger.warning(
                    "**Found JavaScript modules defined in config.yaml but not used:\n%s**" %
                    "\n".join(not_used_modules))

            if not_defined_modules:
                self.logger.warning(
                    "**Found JavaScript modules used but not defined in config.yaml:\n%s**" %
                    "\n".join(not_defined_modules))

            if not not_used_modules and not not_defined_modules:
                self.logger.info("**No anomalies were found.**")

            js_files_data.clear()

    def create_xlets_changelogs(self):
        """Create xlets change logs.

        Generate the CHANGELOG.md files for all xlets.
        """
        app_utils.print_separator(self.logger, "#")
        self.logger.info("**Generating xlets change logs...**")

        for xlet in self.xlets_meta:
            app_utils.print_separator(self.logger)
            self.logger.info(f'**Generating change log for {xlet["name"]}...**')

            xlet_root_folder = file_utils.get_parent_dir(xlet["meta-path"], 0)
            log_path = os.path.join(xlet_root_folder, "__data__", "CHANGELOG.md")
            os.makedirs(os.path.dirname(log_path), exist_ok=True)

            with open(log_path, "w") as f:
                f.write(app_data.CHANGELOG_HEADER_XLETS.format(
                    xlet_name=xlet["name"],
                    repo_url=app_data.URLS["repo"]
                ))

            # Generate change log from current repository paths.
            relative_path = f'./{xlet["type"]}s/{xlet["slug"]}'
            cmd = app_data.GIT_LOG_CMD_XLETS.format(
                xlet_slug=xlet["slug"],
                relative_path=relative_path,
                append_or_override=">>",
                log_path=log_path,
                repo_url=app_data.URLS["repo"]
            )
            po = cmd_utils.run_cmd(cmd, stdout=None, cwd=root_folder, shell=True)

            if po.stderr:
                self._store_error(xlet["slug"],
                                  "create_xlets_changelogs",
                                  po.stderr.decode("UTF-8"))

    def update_pot_files(self):
        """Update POT files.

        Update all .pot files from all xlets.

        Raises
        ------
        SystemExit
            Halt execution if the make-cinnamon-xlet-pot-cli command is not found.
        """
        app_utils.print_separator(self.logger, "#")
        self.logger.info("**Starting POT files update...**")

        for xlet in self.xlets_meta:
            additional_files_to_scan = [
                # NOTE: See app_data.py > LOCALIZED_STRINGS
                "--scan-additional-file=../../__app__/python_modules/app_data.py"
            ]
            extra_paths = []
            extra_settings = {}
            xlet_root_folder = file_utils.get_parent_dir(xlet["meta-path"], 0)
            xlet_pot_file = os.path.join(xlet_root_folder, "po", "{{UUID}}.pot")
            xlet_config_file = os.path.join(xlet_root_folder, "__data__", "config.yaml")
            create_localized_help_file = os.path.join(
                xlet_root_folder, "__data__", "create_localized_help.py")

            if file_utils.is_real_file(xlet_config_file):
                with open(xlet_config_file, "r") as config_file:
                    extra_settings = yaml_utils.load(config_file)

                extra_paths = extra_settings.get("make_pot_additional_files", [])
                additional_files_to_scan.extend(
                    [f'--scan-additional-file={p}' for p in extra_paths]
                )

            for src_dir_name in app_data.XLET_MODULES_MAP.keys():
                modules = extra_settings.get(src_dir_name, [])
                src_dir_path = os.path.join(root_folder, "__app__", "data", src_dir_name)

                if modules:
                    for mod in modules:
                        mod_path = os.path.join(src_dir_path, mod)

                        if file_utils.is_real_file(mod_path):
                            additional_files_to_scan.append(
                                f'--scan-additional-file={mod_path.replace(root_folder, "../..")}'
                            )
                        elif file_utils.is_real_dir(mod_path):
                            for root, dirs, files in os.walk(mod_path, topdown=False):
                                for fname in files:
                                    # Only deal with a limited set of file extensions.
                                    if not fname.endswith((".py", ".js")):
                                        continue
                                    additional_files_to_scan.append(
                                        "--scan-additional-file=%s" %
                                        os.path.join(root, fname).replace(root_folder, "../..")
                                    )

            if file_utils.is_real_file(create_localized_help_file):
                additional_files_to_scan.append(
                    "--scan-additional-file=../../__app__/python_modules/localized_help_creator.py")

            self.logger.info(f'**Updating localization template for {xlet["name"]}...**')

            if not cmd_utils.which("make-cinnamon-xlet-pot-cli"):
                self.logger.error(
                    "**MissingCommand:** make-cinnamon-xlet-pot-cli command not found!!!", date=False)
                raise SystemExit(1)

            cmd = [
                "make-cinnamon-xlet-pot-cli",
                "--custom-header",
                f'--output={xlet_pot_file}',
                "--ignored-pattern=__data__/__000__*"
            ] + additional_files_to_scan
            po = cmd_utils.run_cmd(cmd, stdout=None, cwd=xlet_root_folder)

            if po.stderr:
                self._store_error(xlet["slug"],
                                  "update_pot_files",
                                  po.stderr.decode("UTF-8"))

    def create_localized_help(self):
        """Create localized help.

        Execute the create_localized_help.py script for each xlet to generate their
        HELP.html files.
        """
        app_utils.print_separator(self.logger, "#")
        self.logger.info("**Starting localized help creation...**")

        for xlet in self.xlets_meta:
            xlet_root_folder = file_utils.get_parent_dir(xlet["meta-path"], 0)
            script_file_path = os.path.join(
                xlet_root_folder, "__data__", "create_localized_help.py")

            if os.path.exists(script_file_path):
                app_utils.print_separator(self.logger)
                self.logger.info(f'**Creating localized help for {xlet["name"]}...**')
                # NOTE: Passing sys.executable ensures that the create_localized_help.py script
                # is executed with the same interpreter that the main applications is executed with.
                po = cmd_utils.run_cmd([sys.executable, script_file_path],
                                       stdout=None, cwd=xlet_root_folder)

                if po.stderr:
                    self._store_error(xlet["slug"],
                                      "create_localized_help",
                                      po.stderr.decode("UTF-8"))

        self.update_repository_readme()

    def update_repository_readme(self):
        """Update repository README file.
        """
        app_utils.print_separator(self.logger, "#")
        self.logger.info("**Generating repository README.md file...**")
        applets_list_items = []
        extensions_list_items = []

        for xlet in self.all_xlets_meta:
            xlet_root_folder = file_utils.get_parent_dir(xlet["meta-path"], 0)
            script_file_path = os.path.join(
                xlet_root_folder, "__data__", "create_localized_help.py")

            if os.path.exists(script_file_path):
                # Store list items for later creating the README.md file.
                list_item = app_data.README_LIST_ITEM_TEMPLATE.format(
                    xlet_name=xlet["name"],
                    xlet_slug=xlet["slug"]
                )

                if xlet["type"] == "applet":
                    applets_list_items.append(list_item)
                elif xlet["type"] == "extension":
                    extensions_list_items.append(list_item)

        readme_template_path = os.path.join(root_folder, "__app__", "data",
                                            "templates", "README.md")
        readme_file_path = os.path.join(root_folder, "README.md")

        with open(readme_template_path, "r", encoding="UTF-8") as readme_template:
            template = readme_template.read()

            with open(readme_file_path, "w", encoding="UTF-8") as readme_file:
                readme_file.write(template.format(
                    applets_help_pages="\n".join(sorted(applets_list_items)),
                    extensions_help_pages="\n".join(sorted(extensions_list_items)),
                    repo_url=app_data.URLS["repo"],
                    repo_docs_url=app_data.URLS["repo_docs"]
                ))

    def generate_trans_stats(self):
        """Generate translations statistics.

        Generates files that contain the amount of untranslated strings an xlet has.

        Raises
        ------
        SystemExit
            Halt execution if the msgmerge command is not found.
        """
        app_utils.print_separator(self.logger, "#")
        self.logger.info("**Generating translation statistics...**")

        if not cmd_utils.which("msgmerge"):
            self.logger.error("**MissingCommand:** msgmerge command not found!!!")
            raise SystemExit(1)

        markdown_content = []
        po_tmp_storage = os.path.join(root_folder, "tmp", "po_files_updated")
        trans_stats_file = os.path.join(
            root_folder, "tmp", "po_files_untranslated_table.md")
        rmtree(po_tmp_storage, ignore_errors=True)
        os.makedirs(po_tmp_storage, exist_ok=True)

        for xlet in self.xlets_meta:
            xlet_type = xlet.get("type", "")
            xlet_slug = xlet.get("slug", "")

            if not xlet_type or not xlet_slug:
                continue

            xlet_po_dir = os.path.join(
                root_folder, f'{xlet_type.lower()}s', xlet_slug, "po")
            tmp_xlet_po_dir = os.path.join(
                po_tmp_storage, f"{xlet_type.lower()}s", xlet_slug)
            os.makedirs(tmp_xlet_po_dir, exist_ok=True)

            if file_utils.is_real_dir(xlet_po_dir):
                xlet_po_list = file_utils.recursive_glob(xlet_po_dir, "*.po")

                if xlet_po_list:
                    app_utils.print_separator(self.logger)
                    self.logger.info(f'**{xlet_type} {xlet_slug}**', date=False)
                    markdown_content.extend(
                        [
                            "",
                            f'### {xlet_type} {xlet_slug}',
                            "",
                            "|LANGUAGE|UNTRANSLATED|",
                            "|--------|------------|",
                        ]
                    )

                    for po_file_path in xlet_po_list:
                        po_base_name = os.path.basename(po_file_path)
                        tmp_po_file_path = os.path.join(tmp_xlet_po_dir, po_base_name)
                        tmp_pot_file_path = os.path.join(xlet_po_dir, "{{UUID}}.pot")

                        self.logger.info(f'**Copying {po_base_name} to temporary location...**',
                                         date=False)
                        copy2(po_file_path, tmp_po_file_path)

                        self.logger.info(f'**Updating temporary {po_base_name} from localization template...**',
                                         date=False)
                        po = cmd_utils.run_cmd([
                            "msgmerge",
                            "--silent",             # Shut the heck up.
                            "--no-wrap",            # Do not wrap long lines.
                            "--no-fuzzy-matching",  # Do not use fuzzy matching.
                            "--backup=off",         # Never make backups.
                            "--update",             # Update .po file, do nothing if up to date.
                            tmp_po_file_path,       # The .po file to update.
                            tmp_pot_file_path       # The template file to update from.
                        ], stdout=None)

                        if po.stderr:
                            self._store_error(xlet_slug,
                                              f"update_spanish_localizations {po_base_name}",
                                              po.stderr.decode("UTF-8"))

                        self.logger.info("**Counting untranslated strings...**", date=False)
                        trans_count_cmd = f'msggrep -v -T -e "." "{tmp_po_file_path}" | grep -c ^msgstr'
                        trans_count_output = cmd_utils.run_cmd(trans_count_cmd,
                                                               shell=True).stdout
                        trans_count = int(trans_count_output.decode("UTF-8").strip())
                        markdown_content.append("|%s|%d|" % (
                            po_base_name, trans_count - 1 if trans_count > 0 else trans_count))

        if markdown_content:
            with open(trans_stats_file, "w", encoding="UTF-8") as trans_file:
                trans_file.write("\n".join(markdown_content))

    def update_spanish_localizations(self):
        """Update Spanish localizations.

        Update all Spanish localizations from all xlets.

        Raises
        ------
        SystemExit
            Halt execution if the msgmerge command is not found.
        """
        app_utils.print_separator(self.logger, "#")
        self.logger.info("**Updating Spanish localizations...**")

        if not cmd_utils.which("msgmerge"):
            self.logger.error("**MissingCommand:** msgmerge command not found!!!")
            raise SystemExit(1)

        for xlet in self.xlets_meta:
            xlet_type = xlet.get("type", "")
            xlet_slug = xlet.get("slug", "")

            if not xlet_type or not xlet_slug:
                continue

            po_dir = os.path.join(root_folder, f'{xlet_type.lower()}s', xlet_slug, "po")
            po_file = os.path.join(po_dir, "es.po")

            if file_utils.is_real_file(po_file):
                app_utils.print_separator(self.logger)
                self.logger.info(f'**Updating localization for {xlet_slug}**')

                po = cmd_utils.run_cmd([
                    "msgmerge",
                    "--silent",                 # Shut the heck up.
                    "--no-wrap",                # Do not wrap long lines.
                    "--no-fuzzy-matching",      # Do not use fuzzy matching.
                    "--backup=off",             # Never make backups.
                    "--update",                 # Update .po file, do nothing if up to date.
                    "es.po",                    # The .po file to update.
                    "{{UUID}}.pot"              # The template file to update from.
                ], stdout=None, cwd=po_dir)

                if po.stderr:
                    self._store_error(xlet_slug,
                                      "update_spanish_localizations:msgmerge",
                                      po.stderr.decode("UTF-8"))

                # NOTE: Keep me just in case.
                # po = cmd_utils.run_cmd([
                #     "msgattrib",
                #     "--no-wrap",                # Do not wrap long line.
                #     "--no-obsolete",            # Remove unused translations.
                #     "--output-file=es.po",      # Overrwrite original file.
                #     "es.po"                     # The .po file to update.
                # ], stdout=None, cwd=po_dir)

                # if po.stderr:
                #     self._store_error(xlet_slug,
                #                       "update_spanish_localizations:msgattrib",
                #                       po.stderr.decode("UTF-8"))

    def _store_error(self, xlet_slug, function_name, error):
        """Store error for later logging.

        Parameters
        ----------
        xlet_slug : str
            Xlet slug.
        function_name : str
            The name of the function that raised the error.
        error : str
            The error message.
        """
        if xlet_slug not in self._errors:
            self._errors[xlet_slug] = {}

        if function_name not in self._errors[xlet_slug]:
            self._errors[xlet_slug][function_name] = []

        self._errors[xlet_slug][function_name].append(error)

    def log_errors(self):
        """Log all stored errors.
        """
        for xlet_slug in self._errors:
            app_utils.print_separator(self.logger, "#")
            self.logger.error(f'**{xlet_slug}**', date=False)

            for function_name in self._errors[xlet_slug]:
                app_utils.print_separator(self.logger)
                self.logger.error(function_name, date=False)

                for error in self._errors[xlet_slug][function_name]:
                    app_utils.print_separator(self.logger)
                    self.logger.error(error.replace(root_folder, ""), date=False)


def build_xlets(xlets_display_names=[],
                domain_name=None,
                build_output="",
                do_not_confirm=False,
                install_localizations=False,
                extra_files="",
                logger=None,
                from_menu=False):
    """Build xlets.

    Parameters
    ----------
    xlets_display_names : list, optional
        The list of xlets to build.
    domain_name : None, optional
        The domain name to use to build the xlets.
    build_output : str, optional
        Path to the folder were the built xlets are stored.
    do_not_confirm : bool, optional
        Whether to ask for overwrite confirmation when an xlet destination exists or not.
    install_localizations : bool, optional
        Whether or not to install xlet localizations.
    extra_files : str, optional
        Path to a folder containing files that will be copied into an xlet folder at build time.
    logger : LogSystem
        The logger.
    from_menu : bool, optional
        Whether this function was called from the CLI menu or not.

    Raises
    ------
    SystemExit
        Halt execution if the domain name cannot be obtained.
    """
    # NOTE: o_m_l_v a.k.a. options_map_latest_used_values
    try:
        with open(app_data.PATHS["xlets_latest_build_data_file"], "r", encoding="UTF-8") as f:
            o_m_l_v = json.loads(f.read())
    except Exception:
        o_m_l_v = None

    if not domain_name:
        try:
            with open(app_data.PATHS["domain_storage_file"], "r", encoding="UTF-8") as domain_file:
                domain_name = domain_file.read().strip()
        except Exception:
            domain_name = "domain.com"

    options_map = {
        "install_localizations": {
            "1": False,
            "2": True
        },
        "do_not_confirm": {
            "1": False,
            "2": True
        }
    }

    options_map_defaults = {
        "domain_name": domain_name,
        # Note: Check needed to avoid storing None.
        "build_output": build_output or "",
        "install_localizations": "2" if install_localizations else "1",
        "extra_files": extra_files,
        "do_not_confirm": "2" if do_not_confirm else "1"
    }

    interactive = from_menu

    if interactive and o_m_l_v is not None and options_map_defaults != o_m_l_v:
        app_utils.print_separator(logger)
        app_utils.inform("Build data from a previous xlet build found at:")
        logger.info(f'**{app_data.PATHS["xlets_latest_build_data_file"]}**',
                    date=False, to_file=False)
        app_utils.inform("Details:")
        logger.info(app_data.XLETS_BUILD_DATA.format(
            domain_name=o_m_l_v["domain_name"],
            build_output=o_m_l_v["build_output"],
            do_not_confirm=str(not options_map["do_not_confirm"][o_m_l_v["do_not_confirm"]]),
            install_localizations=str(
                options_map["install_localizations"][o_m_l_v["install_localizations"]]),
            extra_files=o_m_l_v["extra_files"],
        ), date=False, to_file=False)
        app_utils.print_separator(logger)
        app_utils.inform("Choose an option:")
        question = "%s\n%s\n%s" % ("**1.** Use data interactively.",
                                   "**2.** Use data and directly build xlets.",
                                   "**Press any other key to not use stored data.**")

        answer = prompts.read_char(question)

        # Do not change defaults if one chooses not to use stored build data.
        if answer == "1" or answer == "2":
            # Check that the stored options contain all options needed for the building process.
            # If not, add them.
            for opt, val in options_map_defaults.items():
                if opt not in o_m_l_v:
                    o_m_l_v[opt] = val

            # Check that the stored options doesn't contain options that aren't used anymore.
            # If they do, remove them.
            new_o_m_l_v = {}
            for opt, val in o_m_l_v.items():
                if opt in options_map_defaults:
                    new_o_m_l_v[opt] = o_m_l_v[opt]

            options_map_defaults = new_o_m_l_v
        else:
            pass

        interactive = answer != "2"

    if interactive:
        # Ask for domain name.
        app_utils.print_separator(logger)
        app_utils.inform("Choose a domain name:")
        prompts.do_prompt(options_map_defaults,
                          "domain_name",
                          "Enter name",
                          options_map_defaults["domain_name"])

        # Ask for build output.
        app_utils.print_separator(logger)
        app_utils.inform(["Where to store built xlets?",
                          "Choose an option:"])
        question = "%s\n%s\n%s" % ("**1.** Temporary location.",
                                   "**2.** Install into user home.",
                                   "**Press any other key to specify a location.**")

        answer = prompts.read_char(question)
        ask_for_confirmation_options = answer != "1"

        if answer == "1":
            options_map_defaults["build_output"] = os.path.join(
                app_utils.get_base_temp_folder(),
                misc_utils.micro_to_milli(misc_utils.get_date_time("filename"))
            )
        elif answer == "2":
            options_map_defaults["build_output"] = app_data.PATHS["xlets_install_location"]
        else:
            # Ask for output directory.
            app_utils.print_separator(logger)
            app_utils.inform("Choose a storage location:")
            # NOTE: Yes, if the previous build_output was the temporary location,
            # inform that it will be overwritten with a new temporary location.
            # This is to avoid dealing with existing xlets built into /tmp.
            if options_map_defaults["build_output"].startswith(app_utils.get_base_temp_folder()):
                logger.warning(
                    "The following default value, if chosen, will be re-generated and overwritten.",
                    date=False, to_file=False)

            prompts.do_prompt(options_map_defaults,
                              "build_output",
                              "Enter a path",
                              options_map_defaults["build_output"],
                              validator=validate_output_path)

        # NOTE: Yes, check again (just in case) if build_output is inside /tmp.
        # So I can cancel asking for confirmation options since there is no
        # need to ask for confirmation options when the possibility of
        # overwriting an existing xlet is null.
        if options_map_defaults["build_output"].startswith(app_utils.get_base_temp_folder()):
            ask_for_confirmation_options = False
            options_map_defaults["do_not_confirm"] = "2"

        if ask_for_confirmation_options:
            # Ask for overwrite confirmation.
            app_utils.print_separator(logger)
            app_utils.inform(["Choose what to do when a built xlet already exists at the destination.",
                              "1. Confirm each overwrite operation",
                              "2. Directly overwrite existent xlets"])
            prompts.do_prompt(options_map_defaults,
                              "do_not_confirm",
                              "Enter option",
                              options_map_defaults["do_not_confirm"],
                              validator=validate_options_1_2)

        # NOTE: Do not ask to install localizations if the output location
        # is not Cinnamon's install location for xlets.
        if options_map_defaults["build_output"].startswith(
                app_data.PATHS["xlets_install_location"]):
            # Ask for localizations installation.
            app_utils.print_separator(logger)
            app_utils.inform(["Choose if you want to install xlets localizations.",
                              "1. Do not install xlets localizations",
                              "2. Install xlets localizations"])
            prompts.do_prompt(options_map_defaults,
                              "install_localizations",
                              "Enter option",
                              options_map_defaults["install_localizations"],
                              validator=validate_options_1_2)

        # Ask for extra files location.
        app_utils.print_separator(logger)
        app_utils.inform(
            "Choose a location containing extra files to be copied into the built xlets folders.")
        logger.warning("Read the documentation to learn how this option works.",
                       date=False, to_file=False)
        app_utils.inform("Choose an option:")
        question = "%s\n%s" % ("**1.** Specify location.",
                               "**Press any other key to ignore and reset this option.**")

        answer = prompts.read_char(question)

        if answer == "1":
            app_utils.inform("Choose extra files location:")
            prompts.do_prompt(options_map_defaults,
                              "extra_files",
                              "Enter location",
                              options_map_defaults["extra_files"],
                              validator=validate_output_path)
        else:
            options_map_defaults["extra_files"] = ""

    # TODO: Implement a "domain name validator" function.
    if not options_map_defaults["domain_name"].strip():
        logger.warning(app_data.MISSING_THEME_OR_DOMAIN_NAME_MSG.format(capital="Domain",
                                                                        lower="domain",
                                                                        types="xlets"), date=False, to_file=False)
        raise SystemExit(1)

    if options_map_defaults["build_output"].startswith(app_utils.get_base_temp_folder()) or \
            not options_map_defaults["build_output"]:
        options_map_defaults["build_output"] = os.path.join(
            app_utils.get_base_temp_folder(),
            misc_utils.micro_to_milli(misc_utils.get_date_time("filename"))
        )

    xlets_data = []

    for x in xlets_display_names:
        xlet_type, xlet_dir_name = x.split(" ")
        xlet_type = xlet_type.lower()
        xlet_source = os.path.join(root_folder, f'{xlet_type}s', xlet_dir_name)
        xlet_config_file = os.path.join(xlet_source, "__data__", "config.yaml")

        if file_utils.is_real_file(xlet_config_file):
            with open(xlet_config_file, "r") as config_file:
                xlet_config = yaml_utils.load(config_file)
        else:
            xlet_config = {}

        uuid = f'{xlet_dir_name}@{options_map_defaults["domain_name"]}'
        xlets_data.append({
            "uuid": uuid,
            "type": xlet_type,
            "slug": xlet_dir_name,
            "config": xlet_config,
            "source": xlet_source,
            "destination": os.path.join(
                file_utils.expand_path(options_map_defaults["build_output"]),
                f'{xlet_type}s',
                uuid
            )
        })

    do_not_confirm = options_map["do_not_confirm"][options_map_defaults["do_not_confirm"]]
    install_localizations = options_map["install_localizations"][
        options_map_defaults["install_localizations"]
    ]

    if xlets_data:
        built_xlets = []

        for data in xlets_data:
            builder = XletBuilder(
                data,
                do_not_confirm=do_not_confirm,
                install_localizations=install_localizations,
                extra_files=options_map_defaults["extra_files"],
                logger=logger
            )
            built = builder.build()

            if built:
                built_xlets.append(data["slug"])

        if len(xlets_data) != len(built_xlets):
            app_utils.print_separator(logger)
            logger.warning(
                "The build process of some xlets was canceled or there was an error while building them.")
            logger.warning("Check the logs for more details.")

        print("")
        logger.info(f'**Built xlets saved at:**\n{options_map_defaults["build_output"]}')

        with open(app_data.PATHS["xlets_latest_build_data_file"], "w", encoding="UTF-8") as outfile:
            json.dump(options_map_defaults, outfile, indent=4, ensure_ascii=False)


class XletBuilder():
    """XletBuilder class.

    Attributes
    ----------
    logger : LogSystem
        The logger.
    """

    def __init__(self, xlet_data,
                 do_not_confirm=False,
                 install_localizations=False,
                 extra_files="",
                 logger=None):
        """Initialize.

        Parameters
        ----------
        xlet_data : dict
            The xlet data to handle.
        do_not_confirm : bool
            Whether to ask for overwrite confirmation when an xlet destination exists or not.
        install_localizations : bool, optional
            Whether or not to install xlet localizations.
        extra_files : str, optional
            Path to a folder containing files that will be copied into an xlet folder at build time.
        logger : LogSystem
            The logger.
        """
        self._xlet_data = xlet_data
        self._do_not_confirm = do_not_confirm
        self._install_localizations = install_localizations
        self._extra_files = extra_files
        self._min_cinnamon_version_override = None
        self._max_cinnamon_version_override = None
        self.logger = logger

        self._schemas_dir = os.path.join(xlet_data["destination"], "schemas")

    def build(self):
        """Build xlet.

        Returns
        -------
        bool
            Whether the xlet was built or not.
        """
        app_utils.print_separator(self.logger, sep="#")
        self.logger.info(f'**Building the {self._xlet_data["type"]} {self._xlet_data["slug"]}**')

        # NOTE: If the copy operation was canceled, do not proceed with the building process.
        proceed = self._do_copy()

        if proceed:
            self._handle_config_data()

            string_utils.do_string_substitutions(
                self._xlet_data["destination"],
                self._get_replacement_data(),
                allowed_extensions=(".py", ".bash", ".js", ".json", ".xml", ".pot"),
                logger=self.logger
            )

            self._modify_metadata()
            self._compile_schemas()
            self._copy_extra_files()
            self._set_executable()
            self._install_po_files()

            return True

        return False

    def _get_replacement_data(self):
        """Get replacement data.

        Returns
        -------
        list
            The list of replacements.
        """
        return [
            ("{{UUID}}", self._xlet_data.get("uuid", "")),
            ("{{REPO_URL}}", app_data.URLS["repo"]),
            ("{{XLET_TYPE}}", self._xlet_data.get("type", "")),
            (app_data.PYTHON_SHEBANGS["dev"], app_data.PYTHON_SHEBANGS["dist"])
        ]

    def _do_copy(self):
        """Copy xlet files into its final destination.

        Note
        ----
        Do not raise inside this function. Return True or False so other instances
        of this class can continue operating. For example, if one is building several
        xlets and decides not to overwrite one of them, just continue building the rest
        of the xlets.

        Returns
        -------
        None
            Halt build operation.
        """
        if file_utils.is_real_file(self._xlet_data["destination"]):
            self.logger.warning("Destination exists and is a file!!! Aborted!!!",
                                date=False, to_file=False)
            return False

        if file_utils.is_real_dir(self._xlet_data["destination"]):
            if not self._do_not_confirm:
                self.logger.warning(app_data.EXISTENT_XLET_DESTINATION_MSG.format(
                    path=self._xlet_data["destination"]
                ), date=False, to_file=False)

            if self._do_not_confirm or prompts.confirm(prompt="Proceed?", response=False):
                rmtree(self._xlet_data["destination"], ignore_errors=True)
            else:
                self.logger.warning(
                    f'Building the {self._xlet_data["type"]} {self._xlet_data["slug"]} was canceled.',
                    date=False, to_file=False
                )
                return False

        self.logger.info("**Copying main xlet files...**")

        copytree(self._xlet_data["source"], self._xlet_data["destination"], symlinks=False,
                 ignore=ignore_patterns(*app_data.XLET_DIR_IGNORED_PATTERNS),
                 ignore_dangling_symlinks=True)

        self.logger.info("**Copying common xlet files...**")
        for extra in app_data.EXTRA_COMMON_FILES:
            src = os.path.join(extra["source_path"], extra["file_name"])
            dst = os.path.join(self._xlet_data["destination"], extra.get(
                "destination_path", ""), extra["file_name"])

            if extra.get("depends_on") is not None:
                file_to_check = os.path.join(self._xlet_data["destination"], extra["depends_on"])

                if not os.path.exists(file_to_check):
                    continue

            if not os.path.exists(os.path.dirname(dst)):
                os.makedirs(os.path.dirname(dst))

            copy2(src, dst)

        return True

    def _handle_config_data(self):
        """Handle xlet configuration file if any.
        """
        config_data = self._xlet_data["config"]

        if config_data:
            for src_dir_name, dst_dir_name in app_data.XLET_MODULES_MAP.items():
                if config_data.get(src_dir_name, False):
                    self.logger.info(f'**Copying {src_dir_name} files...**')

                    for module_name in config_data.get(src_dir_name):
                        src = os.path.join(
                            root_folder, "__app__", "data", src_dir_name, module_name)
                        dst = os.path.join(
                            self._xlet_data["destination"], dst_dir_name, module_name)

                        self._copy_file_or_folder(src, dst)

            if config_data.get("extra_files", False):
                self.logger.info("**Copying extra files...**")

                for obj in config_data.get("extra_files"):
                    src = os.path.join(root_folder, obj["source"])
                    dst = os.path.join(self._xlet_data["destination"], obj["destination"])

                    self._copy_file_or_folder(src, dst)

            if config_data.get("symlinks", False):
                self.logger.info("**Generating symbolic links...**")

                os.chdir(self._xlet_data["destination"])

                for dir in config_data.get("symlinks"):
                    parent_dir = os.path.join(self._xlet_data["destination"], dir)

                    os.makedirs(parent_dir, exist_ok=True)

                    for src, dst in config_data.get("symlinks")[dir]:
                        os.symlink(src, os.path.join(dir, dst))

                os.chdir(root_folder)

            if config_data.get("min_cinnamon_version_override", None):
                self.logger.info("**Minimum Cinnamon version override found...**")
                self._min_cinnamon_version_override = config_data.get(
                    "min_cinnamon_version_override")

            if config_data.get("max_cinnamon_version_override", None):
                self.logger.info("**Maximum Cinnamon version override found...**")
                self._max_cinnamon_version_override = config_data.get(
                    "max_cinnamon_version_override")

    def _copy_file_or_folder(self, src, dst):
        """Copy file or folder.

        Parameters
        ----------
        src : str
            Source path.
        dst : str
            Destination path.
        """
        if file_utils.is_real_dir(src):
            file_utils.custom_copytree(src, dst, logger=self.logger, overwrite=True)
        elif file_utils.is_real_file(src):
            file_utils.custom_copy2(src, dst, logger=self.logger, overwrite=True)

    def _modify_metadata(self):
        """Modify metadata.json file.
        """
        self.logger.info("**Modifying xlet metadata...**")
        meta_path = os.path.join(self._xlet_data["destination"], "metadata.json")

        with open(meta_path, "r", encoding="UTF-8") as old:
            xlet_metadata = json.loads(old.read())

        supported_versions = app_utils.supported_cinnamon_versions_range(
            self._min_cinnamon_version_override if self._min_cinnamon_version_override is not None
            else app_data.SUPPORTED_CINNAMON_VERSION_MIN,
            self._max_cinnamon_version_override if self._max_cinnamon_version_override is not None
            else app_data.SUPPORTED_CINNAMON_VERSION_MAX
        )

        xlet_metadata["cinnamon-version"] = supported_versions
        xlet_metadata["uuid"] = self._xlet_data["uuid"]
        xlet_metadata["website"] = app_data.URLS["repo"]
        xlet_metadata["url"] = app_data.URLS["repo"]
        xlet_metadata["contributors"] = app_data.LOCALIZED_STRINGS["metadata-contributors"]
        xlet_metadata["comments"] = app_data.LOCALIZED_STRINGS["metadata-comments"]

        with open(meta_path, "w", encoding="UTF-8") as new:
            json.dump(xlet_metadata, new, indent=4, ensure_ascii=False)

    def _compile_schemas(self):
        """Compile schema files if any.
        """
        if file_utils.is_real_dir(self._schemas_dir):
            self.logger.info("**Compiling gsettings schema...**")
            cmd = ["glib-compile-schemas", ".", "--targetdir=."]

            cmd_utils.run_cmd(cmd, stdout=None, stderr=None, cwd=self._schemas_dir)

    def _copy_extra_files(self):
        """Copy extra files.

        Returns
        -------
        None
            Halt execution.
        """
        if not self._extra_files:
            return

        extra_files_for_xlet = os.path.join(
            self._extra_files,
            f'{self._xlet_data["type"]}s',
            self._xlet_data["slug"]
        )

        if not file_utils.is_real_dir(extra_files_for_xlet):
            return

        self.logger.info("**Copying extra files into built xlet folder:**")

        ignored_patterns = app_data.XLET_DIR_IGNORED_PATTERNS + app_data.XLET_EXTRA_FILES_IGNORED_PATTERNS
        file_utils.custom_copytree(extra_files_for_xlet,
                                   self._xlet_data["destination"],
                                   logger=self.logger,
                                   log_copied_file=True,
                                   ignored_patterns=ignored_patterns,
                                   overwrite=True)

    def _set_executable(self):
        """Set files as executable.

        Returns
        -------
        None
            Halt execution.
        """
        self.logger.info("**Setting execution permissions to the following files:**")
        existent_files_list = []
        files_list = app_data.XLET_EXEC_FILES + self._xlet_data["config"].get("set_executable", [])
        files_list.sort()

        for f in files_list:
            file_path = os.path.join(self._xlet_data["destination"], f)

            if file_utils.is_real_file(file_path):
                existent_files_list.append(file_path)

        if len(existent_files_list) == 0:
            return

        for file_path in existent_files_list:
            self.logger.info(os.path.relpath(
                file_path, self._xlet_data["destination"]), date=False)
            os.chmod(file_path, 0o755)

    def _install_po_files(self):
        """Install xlets .po files.

        Returns
        -------
        None
            Halt execution.
        """
        if not self._install_localizations:
            return

        if not self._xlet_data["destination"].startswith(app_data.PATHS["xlets_install_location"]):
            self.logger.warning(
                "**Localizations can only be installed when the xlets are built into Cinnamon's install location for xlets.**")
            return

        self.logger.info("**Installing xlet localizations:**")

        try:
            cmd_str = cmd_utils.which("make-cinnamon-xlet-pot-cli") or cmd_utils.which("cinnamon-xlet-makepot")
            cmd = f"{cmd_str} -i"

            cmd_utils.run_cmd(cmd,
                              stdout=None,
                              stderr=None,
                              shell=True,
                              cwd=self._xlet_data["destination"])
        except Exception as err:
            self.logger.error(err)


def get_xlets_display_names():
    """Get xlets dirs.

    Returns
    -------
    list
        The list of xlets directory names prefixed with their "types".
    """
    applets_dirs = [f'Applet {item}' for item in app_utils.list_xlets_dirs("applets")]
    extensions_dirs = [f'Extension {item}' for item in app_utils.list_xlets_dirs("extensions")]

    return applets_dirs + extensions_dirs


class BaseXletGenerator():
    """Base xlet generator.

    Attributes
    ----------
    base_xlet_path : str
        Path to the base application (the template).
    logger : LogSystem
        The logger.
    new_xlet_destination : str
        The path to the new generated application.
    xlet_data : dict
        Storage for xlet data that will be used to generate a base xlet.
    """

    def __init__(self, logger):
        """Initialization.

        Parameters
        ----------
        logger : LogSystem
            The logger.
        """
        self.logger = logger
        self.xlet_data = {}

    def generate(self):
        """Generate.
        """
        self._do_setup()
        self._do_copy()
        string_utils.do_string_substitutions(self.new_xlet_destination,
                                             self._replacement_data, logger=self.logger)

    def _do_setup(self):
        """Do setup.

        Raises
        ------
        SystemExit
            Halt execution if the destination exists.
        """
        prompt_data = {
            "type": "1",
            "name": "My Custom Xlet",
            "description": "My custom xlet description.",
            "max_instances": "-1",
        }

        prompt_data_map = {
            "1": {
                "type": "applet",
                "files": [
                    "__data__/config.yaml",
                    "__data__/create_localized_help.py",
                    "applet.js",
                    "js_modules/constants.js",
                    "js_modules/utils.js",
                    "metadata.json",
                    "settings-schema.json"
                ]
            },
            "2": {
                "type": "extension",
                "files": [
                    "__data__/config.yaml",
                    "__data__/create_localized_help.py",
                    "extension.js",
                    "js_modules/constants.js",
                    "js_modules/utils.js",
                    "metadata.json"
                ]
            }
        }

        app_utils.inform("\nEnter an xlet type:\n\n1. applet\n2. extension")
        prompts.do_prompt(prompt_data, "type", "Choose an option", prompt_data["type"])
        self.xlet_data["type"] = prompt_data_map[prompt_data["type"]]["type"]

        app_utils.inform("\nEnter a name for the xlet:")
        prompts.do_prompt(prompt_data, "name", "Enter name", prompt_data["name"])
        self.xlet_data["name"] = prompt_data["name"]

        # Define these here so I can check for existent destination immediately after the
        # xlet name is defined and exit if it already exists.
        self.xlet_data["slug"] = "".join([part.title()
                                          for part in self.xlet_data["name"].split(" ")])

        self.base_xlet_path = os.path.join(root_folder, "__app__", "data", "templates", "BaseXlet")
        self.new_xlet_destination = os.path.join(root_folder,
                                                 f'{self.xlet_data["type"]}s',
                                                 self.xlet_data["slug"])

        if os.path.exists(self.new_xlet_destination):
            self.logger.warning("**ExistentLocation:** New xlet cannot be created.")
            raise SystemExit(1)

        app_utils.inform("\nEnter a description for the xlet:")
        prompts.do_prompt(prompt_data, "description",
                          "Enter description", prompt_data["description"])
        self.xlet_data["description"] = prompt_data["description"]

        if self.xlet_data["type"] != "extension":
            app_utils.inform("\nEnter max instances for the xlet:")
            prompts.do_prompt(prompt_data, "max_instances",
                              "Enter max. instances", prompt_data["max_instances"])
            self.xlet_data["max_instances"] = prompt_data["max_instances"]

        self.xlet_data["files"] = prompt_data_map[prompt_data["type"]]["files"]
        self.xlet_data["type_title_case"] = prompt_data["type"].title()

        self._replacement_data = [
            ("$$XLET_NAME$$", self.xlet_data["name"]),
            ("$$XLET_DESCRIPTION$$", self.xlet_data["description"]),
            ("$$XLET_TYPE$$", self.xlet_data["type"]),
            ("$$XLET_TYPE_TITLE_CASE$$", self.xlet_data["type_title_case"]),
        ]

    def _do_copy(self):
        """Do copy.
        """
        os.makedirs(self.new_xlet_destination, exist_ok=True)

        self.logger.info("**Copying files...**")

        for file_name in self.xlet_data["files"]:
            file_utils.custom_copy2(os.path.join(self.base_xlet_path, file_name),
                                    os.path.join(self.new_xlet_destination, file_name),
                                    logger=self.logger, overwrite=True)


def print_xlets_slugs():
    """Print xlets slugs.

    This method is called by the Bash completions script to auto-complete
    xlets slugs for the ``--xlet-name=`` and ``-x`` CLI options.
    """
    for xlet_dir_name in app_utils.list_xlets_dirs(
            "applets") + app_utils.list_xlets_dirs("extensions"):
        print(xlet_dir_name)


if __name__ == "__main__":
    pass
