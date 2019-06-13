#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Module with utility functions and classes.

Attributes
----------
PATHS : dict
    Paths storage.
root_folder : str
    The main folder containing the application. All commands must be executed from this location
    without exceptions.
URLS : dict
    URLs storage.
XLET_META : dict
    Xlet meta type.
XLET_SYSTEM : dict
    Xlet system type.
"""
import json
import os

from shutil import copy2
from shutil import copytree
from shutil import ignore_patterns
from shutil import rmtree

from .python_utils import cmd_utils
from .python_utils import file_utils
from .python_utils import misc_utils
from .python_utils import prompts
from .python_utils import shell_utils
from .python_utils import string_utils
from .python_utils.ansi_colors import Ansi
from .python_utils.simple_validators import generate_numeral_options_validator
from .python_utils.simple_validators import validate_output_path


validate_options_1_2 = generate_numeral_options_validator(2)
validate_options_1_2_3 = generate_numeral_options_validator(3)

root_folder = os.path.realpath(os.path.abspath(os.path.join(
    os.path.normpath(os.path.join(os.path.dirname(__file__), *([".."] * 2))))))


URLS = {
    "repo": "https://gitlab.com/Odyseus/CinnamonTools",
    "repo_pages": "https://odyseus.gitlab.io/CinnamonTools",
    "repo_docs": "https://odyseus.gitlab.io/cinnamon_tools_docs"
}

PATHS = {
    "xlets_install_location": file_utils.expand_path(os.path.join("~", ".local", "share", "cinnamon")),
    "docs_sources": os.path.join(root_folder, "__app__", "cinnamon_tools_docs"),
    "docs_built": os.path.join(root_folder, "__app__", "cinnamon_tools_docs", "docs"),
    "domain_storage_file": os.path.join(root_folder, "tmp", "domain_name"),
    "theme_name_storage_file": os.path.join(root_folder, "tmp", "theme_name"),
    "all_xlets_meta_file": os.path.join(root_folder, "tmp", "xlets_metadata.json"),
    "theme_latest_build_data_file": os.path.join(root_folder, "tmp", "theme_latest_default_data.json"),
    "xlets_latest_build_data_file": os.path.join(root_folder, "tmp", "xlets_latest_default_data.json")
}

XLET_SYSTEM = {
    "applet": "appletManager",
    "extension": "extensionSystem",
}

XLET_META = {
    "applet": "appletMeta",
    "extension": "extensionMeta",
}

_missing_theme_or_domain_name_msg = """**{capital}NameNotSet:**

The command line option **--{lower}-name=<name>** should be used to define a {lower}
name for use when building {types}.

Or a file named **{lower}_name** should be created inside a folder named **tmp** at
the root of the repository whose only content should be the desired {lower} name.

The `--{lower}-name` command line option has precedence over the {lower} name found
inside the **{lower}_name** file.
"""

_existent_xlet_destination_msg = """**Destination folder exists!!!**
{path}

Choosing to proceed will completely remove the existent folder.
"""

_not_specified_output_location = """**No output location specified!!!**

Choose a location that you own.
"""

_xlet_dir_ignored_patterns = [
    "__pycache__",
    "__data__",
    "*~",
    "*.bak",
    "*.pyc",
    "z_*"
]

_xlet_extra_files_ignored_patterns = [
    "*.js",
    "*.py",
    "*.xml",
    "*.pot",
    "*.json"
]

_extra_common_files = [{
    "source_path": root_folder,
    "file_name": "LICENSE.md",
}, {
    "source_path": os.path.join(root_folder, "__app__", "data", "python_scripts"),
    "file_name": "helper.py",
}, {
    "source_path": os.path.join(root_folder, "__app__", "data", "html_assets", "js"),
    "destination_path": "assets/js",
    "file_name": "localizations-handler.min.js",
    "depends_on": "HELP.html",
}, {
    "source_path": os.path.join(root_folder, "__app__", "data", "html_assets", "css"),
    "destination_path": "assets/css",
    "file_name": "bootstrap-tweaks.css",
    "depends_on": "HELP.html",
}, {
    "source_path": os.path.join(root_folder, "__app__", "data", "html_assets", "css"),
    "destination_path": "assets/css",
    "file_name": "flatly_bootstrap_theme.min.css",
    "depends_on": "HELP.html",
}]

_common_help_assets = [{
    "source_path": os.path.join(root_folder, "__app__", "data", "html_assets", "js"),
    "destination_path": "js",
    "file_name": "localizations-handler.min.js"
}, {
    "source_path": os.path.join(root_folder, "__app__", "data", "html_assets", "css"),
    "destination_path": "css",
    "file_name": "bootstrap-tweaks.css"
}, {
    "source_path": os.path.join(root_folder, "__app__", "data", "html_assets", "css"),
    "destination_path": "css",
    "file_name": "flatly_bootstrap_theme.min.css"
}]

_readme_list_item_template = "- [{xlet_name}](%s/_static/xlets_help_pages/{xlet_slug}/index.html)" % (
    URLS["repo_docs"])

_theme_build_data = """
**Cinnamon version:**            {cinnamon_version}
**Cinnamon font size:**          {cinnamon_font_size}
**Cinnamon font family:**        {cinnamon_font_family}
**Gtk3 version:**                {gtk3_version}
**Gtk3 CSD shadow:**             {gtk3_csd_shadow}
**Gtk3 CSD backdrop shadow:**    {gtk3_csd_backdrop_shadow}
**Theme name:**                  {theme_name}
**Output directory:**            {build_output}
**Ask overwrite confirmation:**  {do_not_cofirm}
**Dry run:**                     {dry_run}
"""

_xlets_build_data = """
**Domain name:**                 {domain_name}
**Output directory:**            {build_output}
**Install localizations:**       {install_localizations}
**Extra files from:**            {extra_files}
**Ask overwrite confirmation:**  {do_not_cofirm}
**Dry run:**                     {dry_run}
"""


class XletsHelperCore():
    """Xlets core functions.

    Attributes
    ----------
    all_xlets_meta : list
        All xlets meta data.
    logger : object
        See <class :any:`LogSystem`>.
    xlets_meta : dict
        The metadata of all xlets in this repository.
    """

    def __init__(self, xlets=None, logger=None):
        """Initialize.

        Parameters
        ----------
        xlets : None, optional
            The list of xlets to handle.
        logger : object
            See <class :any:`LogSystem`>.
        """
        self.logger = logger

        self.all_xlets_meta = AllXletsMetadata().meta_list

        if xlets:
            xlets_filter = [f.split(" ")[1] for f in xlets]
            self.xlets_meta = [x for x in self.all_xlets_meta if x["slug"] in xlets_filter]
        else:
            self.xlets_meta = self.all_xlets_meta

    def generate_meta_file(self):
        """See :any:`generate_meta_file`
        """
        generate_meta_file(return_data=False)

    def create_changelogs(self):
        """Create change logs.

        Generate the CHANGELOG.md files for all xlets.
        """
        from . import changelog_handler

        self.logger.info("**Generating change logs...**")

        for xlet in self.xlets_meta:
            self.logger.info("**Generating change log for %s...**" % xlet["name"])

            try:
                xlet_root_folder = file_utils.get_parent_dir(xlet["meta-path"], 0)
                log_path = os.path.join(xlet_root_folder, "__data__", "CHANGELOG.md")
                os.makedirs(os.path.dirname(log_path), exist_ok=True)

                with open(log_path, "w") as f:
                    f.write(changelog_handler.CHANGELOG_HEADER.format(
                        xlet_name=xlet["name"],
                        repo_url=URLS["repo"]
                    ))

                # Generate change log from current repository paths.
                relative_xlet_path = "./" + xlet["type"] + "s/" + xlet["slug"]
                cmd = changelog_handler.git_log_cmd.format(
                    xlet_slug=xlet["slug"],
                    relative_xlet_path=relative_xlet_path,
                    append_or_override=">>",
                    log_path=log_path,
                    repo_url=URLS["repo"]
                )
                cmd_utils.run_cmd(cmd, stdout=None, stderr=None, cwd=root_folder, shell=True)
            except Exception as err:
                self.logger.error(err)

    def update_pot_files(self):
        """Update POT files.

        Update all .pot files from all xlets.

        Raises
        ------
        SystemExit
            Halt execution if the make-cinnamon-xlet-pot-cli command is not found.
        """
        self.logger.info("**Starting POT files update...**")

        for xlet in self.xlets_meta:
            additional_files_to_scan = []
            xlet_root_folder = file_utils.get_parent_dir(xlet["meta-path"], 0)
            xlet_config_file = os.path.join(xlet_root_folder, "z_config.py")

            if file_utils.is_real_file(xlet_config_file):
                from runpy import run_path
                extra_settings = run_path(xlet_config_file)["settings"]
                extra_paths = extra_settings.get("make_pot_additional_files")

                if extra_paths is not None:
                    additional_files_to_scan = [
                        "--scan-additional-file=%s" % p for p in extra_paths]

            self.logger.info(
                "**Updating localization template for %s...**" % xlet["name"])

            try:
                if not cmd_utils.which("make-cinnamon-xlet-pot-cli"):
                    self.logger.error(
                        "**MissingCommand:** make-cinnamon-xlet-pot-cli command not found!!!", date=False)
                    raise SystemExit(1)

                cmd = [
                    "make-cinnamon-xlet-pot-cli",
                    "--custom-header",
                    "--scan-additional-file=../../__app__/python_modules/localized_help_creator.py",
                    "--ignored-pattern=__data__/*"
                ] + additional_files_to_scan
                cmd_utils.run_cmd(cmd, stdout=None, stderr=None, cwd=xlet_root_folder)
            except Exception:
                continue

    def create_localized_help(self):
        """Create localized help.

        Execute the z_create_localized_help.py script for each xlet to generate their
        HELP.html files.
        """
        self.logger.info("**Starting localized help creation...**")

        for xlet in self.xlets_meta:
            xlet_root_folder = file_utils.get_parent_dir(xlet["meta-path"], 0)
            script_file_path = os.path.join(xlet_root_folder, "z_create_localized_help.py")

            if os.path.exists(script_file_path):
                self.logger.info("**Creating localized help for %s...**" % xlet["name"])
                cmd_utils.run_cmd([script_file_path], stdout=None,
                                  stderr=None, cwd=xlet_root_folder)

        self.update_repository_readme()

    def update_repository_readme(self):
        """Update repository README file.
        """
        self.logger.info("**Generating repository README.md file...**")
        applets_list_items = []
        extensions_list_items = []

        for xlet in self.all_xlets_meta:
            xlet_root_folder = file_utils.get_parent_dir(xlet["meta-path"], 0)
            script_file_path = os.path.join(xlet_root_folder, "z_create_localized_help.py")

            if os.path.exists(script_file_path):
                # Store list items for later creating the README.md file.
                list_item = _readme_list_item_template.format(
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
                    repo_url=URLS["repo"],
                    repo_docs_url=URLS["repo_docs"]
                ))

    def generate_trans_stats(self):
        """Generate translations statistics.

        Generates files that contain the amount of untranslated strings an xlet has.

        Raises
        ------
        SystemExit
            Halt execution if the msgmerge command is not found.
        """
        self.logger.info("**Generating translation statistics...**")

        if not cmd_utils.which("msgmerge"):
            self.logger.error("**MissingCommand:** msgmerge command not found!!!")
            raise SystemExit(1)

        markdown_content = ""
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
                root_folder, "%ss" % xlet_type.lower(), xlet_slug, "po")
            tmp_xlet_po_dir = os.path.join(
                po_tmp_storage, "%ss" % xlet_type.lower(), xlet_slug)
            os.makedirs(tmp_xlet_po_dir, exist_ok=True)

            if file_utils.is_real_dir(xlet_po_dir):
                xlet_po_list = file_utils.recursive_glob(xlet_po_dir, "*.po")

                if xlet_po_list:
                    self.logger.info("%s %s" %
                                     (xlet_type, xlet_slug), date=False)
                    markdown_content += "\n### %s %s\n" % (
                        xlet_type, xlet_slug)
                    markdown_content += "\n"
                    markdown_content += "|LANGUAGE|UNTRANSLATED|\n"
                    markdown_content += "|--------|------------|\n"

                    for po_file_path in xlet_po_list:
                        po_base_name = os.path.basename(po_file_path)
                        tmp_po_file_path = os.path.join(tmp_xlet_po_dir, po_base_name)
                        tmp_pot_file_path = os.path.join(xlet_po_dir, "%s.pot" % xlet_slug)

                        self.logger.info("**Copying %s to temporary location...**" %
                                         po_base_name, date=False)
                        copy2(po_file_path, tmp_po_file_path)

                        self.logger.info("**Updating temporary %s from localization template...**" %
                                         po_base_name, date=False)
                        cmd_utils.run_cmd([
                            "msgmerge",
                            "--no-fuzzy-matching",  # Do not use fuzzy matching.
                            "--previous",           # Keep previous msgids of translated messages.
                            "--backup=off",         # Never make backups.
                            "--update",             # Update .po file, do nothing if up to date.
                            tmp_po_file_path,       # The .po file to update.
                            tmp_pot_file_path       # The template file to update from.
                        ], stdout=None, stderr=None)

                        self.logger.info("**Counting untranslated strings...**", date=False)
                        trans_count_cmd = 'msggrep -v -T -e "." "%s" | grep -c ^msgstr'
                        trans_count_output = cmd_utils.run_cmd(trans_count_cmd % tmp_po_file_path,
                                                               shell=True).stdout
                        trans_count = str(trans_count_output.decode("UTF-8").strip())
                        markdown_content += "|%s|%s|\n" % (po_base_name, trans_count)

        if markdown_content:
            with open(trans_stats_file, "w", encoding="UTF-8") as trans_file:
                trans_file.write(markdown_content)

    def update_spanish_localizations(self):
        """Update Spanish localizations.

        Update all Spanish localizations from all xlets.

        Raises
        ------
        SystemExit
            Halt execution if the msgmerge command is not found.
        """
        self.logger.info("**Updating Spanish localizations...**")

        if not cmd_utils.which("msgmerge"):
            self.logger.error("**MissingCommand:** msgmerge command not found!!!")
            raise SystemExit(1)

        for xlet in self.xlets_meta:
            xlet_type = xlet.get("type", "")
            xlet_slug = xlet.get("slug", "")

            if not xlet_type or not xlet_slug:
                continue

            po_dir = os.path.join(root_folder, "%ss" %
                                  xlet_type.lower(), xlet_slug, "po")
            po_file = os.path.join(po_dir, "es.po")

            if file_utils.is_real_dir(po_dir) and file_utils.is_real_file(po_file):
                self.logger.info("**Updating localization for %s**" % xlet_slug)

                if cmd_utils.run_cmd([
                    "msgmerge",
                    "--no-fuzzy-matching",      # Do not use fuzzy matching.
                    "--previous",               # Keep previous msgids of translated messages.
                    "--backup=off",             # Never make backups.
                    "--update",                 # Update .po file, do nothing if up to date.
                    "es.po",                    # The .po file to update.
                    "%s.pot" % xlet_slug        # The template file to update from.
                ], stdout=None, stderr=None, cwd=po_dir).returncode:
                    self.logger.warning("**Something might have gone wrong!**")


class AllXletsMetadata():
    """All xlets metadata.

    Attributes
    ----------
    meta_list : list
        A list of dictionaries containing all xlets metadata.
    """

    def __init__(self):
        """Initialization.
        """
        if os.path.exists(PATHS["all_xlets_meta_file"]):
            with open(PATHS["all_xlets_meta_file"], "r", encoding="UTF-8") as xlets_metadata:
                self.meta_list = list(json.loads(xlets_metadata.read()))
        else:
            self.meta_list = generate_meta_file()


def generate_meta_file(return_data=True):
    """Generate the file containing all the metadata of all xlets on this repository.
    This metadata file is used by several functions on the XletsHelperCore class.

    Parameters
    ----------
    return_data : bool, optional
        Whether to return the data or not.

    Returns
    -------
    list
        The xlets metadata.
    """
    xlet_meta_files = []
    xlet_meta = []

    for dirname, dirnames, filenames in os.walk(os.path.join(root_folder, "applets"), topdown=False):
        for filename in filenames:
            if filename == "metadata.json":
                xlet_meta_files.append(os.path.join(dirname, filename))

    for dirname, dirnames, filenames in os.walk(os.path.join(root_folder, "extensions"), topdown=False):
        for filename in filenames:
            if filename == "metadata.json":
                xlet_meta_files.append(os.path.join(dirname, filename))

    for i in range(0, len(xlet_meta_files)):
        with open(xlet_meta_files[i], "r", encoding="UTF-8") as xlet_meta_file:
            raw_meta = xlet_meta_file.read()
            json_meta = json.loads(raw_meta)
            # Store the path to the metadata.json file so I can use it to create
            # the different needed paths when needed.
            # This will allow me to avoid to constantly create a path with
            # os.path.join in my functions. I will just use the metadata.json path
            # and "traverse it".
            json_meta["meta-path"] = xlet_meta_files[i]
            json_meta["slug"] = os.path.basename(
                os.path.dirname(xlet_meta_files[i]))

            if "/applets/" + json_meta["slug"] in xlet_meta_files[i]:
                json_meta["type"] = "applet"
            elif "/extensions/" + json_meta["slug"] in xlet_meta_files[i]:
                json_meta["type"] = "extension"

            xlet_meta.append(json_meta)

    with open(PATHS["all_xlets_meta_file"], "w", encoding="UTF-8") as outfile:
        json.dump(xlet_meta, outfile, indent=4, ensure_ascii=False)

    if return_data:
        return xlet_meta


def build_xlets(xlets=[],
                domain_name=None,
                build_output="",
                do_not_cofirm=False,
                install_localizations=False,
                extra_files="",
                dry_run=False,
                logger=None,
                from_menu=False):
    """Build xlets.

    Parameters
    ----------
    xlets : list, optional
        The list of xlets to build.
    domain_name : None, optional
        The domain name to use to build the xlets.
    build_output : str, optional
        Path to the folder were the built xlets are stored.
    do_not_cofirm : bool, optional
        Whether to ask for overwrite confirmation when an xlet destination exists or not.
    dry_run : bool, optional
        See <class :any:`XletBuilder`>.
    logger : object
        See <class :any:`LogSystem`>.
    from_menu : bool, optional
        Whether this function was called from the CLI menu or not.

    Raises
    ------
    SystemExit
        Halt execution if the domain name cannot be obtained.
    """
    # NOTE: o_m_l_v a.k.a. options_map_latest_used_values
    try:
        with open(PATHS["xlets_latest_build_data_file"], "r", encoding="UTF-8") as f:
            o_m_l_v = json.loads(f.read())
    except Exception:
        o_m_l_v = None

    if not domain_name:
        try:
            with open(PATHS["domain_storage_file"], "r", encoding="UTF-8") as domain_file:
                domain_name = domain_file.read().strip()
        except Exception:
            domain_name = "domain.com"

    options_map = {
        "install_localizations": {
            "1": False,
            "2": True
        },
        "do_not_cofirm": {
            "1": False,
            "2": True
        },
        "dry_run": {
            "1": False,
            "2": True
        }
    }

    # __version__ is used to verify that the stored data is compatible with the
    # default data used when building xlets.
    options_map_defaults = {
        "__version__": "2",
        "domain_name": domain_name,
        # Note: Check needed to avoid storing None.
        "build_output": build_output or "",
        "install_localizations": "2" if install_localizations else "1",
        "extra_files": extra_files,
        "do_not_cofirm": "2" if do_not_cofirm else "1",
        "dry_run": "2" if dry_run else "1"
    }

    interactive = from_menu

    if interactive and o_m_l_v is not None and options_map_defaults != o_m_l_v and \
            options_map_defaults["__version__"] == o_m_l_v.get("__version__"):
        print_separator(logger)
        inform("Build data from a previous xlet build found at:")
        logger.info("**%s**" % PATHS["xlets_latest_build_data_file"], date=False, to_file=False)
        inform("Details:")
        logger.info(_xlets_build_data.format(
            domain_name=o_m_l_v["domain_name"],
            build_output=o_m_l_v["build_output"],
            do_not_cofirm=str(not options_map["do_not_cofirm"][o_m_l_v["do_not_cofirm"]]),
            install_localizations=str(
                options_map["install_localizations"][o_m_l_v["install_localizations"]]),
            extra_files=o_m_l_v["extra_files"],
            dry_run=str(options_map["dry_run"][o_m_l_v["dry_run"]])
        ), date=False, to_file=False)
        print_separator(logger)
        inform("Choose an option:")
        question = "%s\n%s\n%s" % ("**1.** Use data interactively.",
                                   "**2.** Use data and directly build xlets.",
                                   "**Press any other key to not use stored data.**")

        answer = prompts.read_char(question)

        # Do not change defaults if one chooses not to use stored build data.
        if answer == "1" or answer == "2":
            options_map_defaults = o_m_l_v
        else:
            pass

        interactive = answer != "2"

    if interactive:
        # Ask for domain name.
        print_separator(logger)
        inform("Choose a domain name:")
        prompts.do_prompt(options_map_defaults,
                          "domain_name",
                          "Enter name",
                          options_map_defaults["domain_name"])

        # Ask for build output.
        print_separator(logger)
        inform("Where to store built xlets?")
        inform("Choose an option:")
        question = "%s\n%s\n%s" % ("**1.** Temporary location.",
                                   "**2.** Install into user home.",
                                   "**Press any other key to specify a location.**")

        answer = prompts.read_char(question)
        ask_for_confirmation_options = answer != "1"

        if answer == "1":
            options_map_defaults["build_output"] = os.path.join(
                get_base_temp_folder(),
                misc_utils.micro_to_milli(misc_utils.get_date_time("filename"))
            )
        elif answer == "2":
            options_map_defaults["build_output"] = PATHS["xlets_install_location"]
        else:
            # Ask for output directory.
            print_separator(logger)
            inform("Choose a storage location:")
            # NOTE: Yes, if the previous build_output was the temporary location,
            # inform that it will be overwritten with a new temporary location.
            # This is to avoid dealing with existing xlets built into /tmp.
            if options_map_defaults["build_output"].startswith(get_base_temp_folder()):
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
        if options_map_defaults["build_output"].startswith(get_base_temp_folder()):
            ask_for_confirmation_options = False
            options_map_defaults["do_not_cofirm"] = "2"

        if ask_for_confirmation_options:
            # Ask for overwrite confirmation.
            print_separator(logger)
            inform("Choose what to do when a built xlet already exists at the destination.")
            inform("1. Confirm each overwrite operation")
            inform("2. Directly overwrite existent xlets")
            prompts.do_prompt(options_map_defaults,
                              "do_not_cofirm",
                              "Enter option",
                              options_map_defaults["do_not_cofirm"],
                              validator=validate_options_1_2)

        # NOTE: Do not ask to install localizations if the output location
        # is not Cinnamon's install location ofr xlets.
        if options_map_defaults["build_output"].startswith(PATHS["xlets_install_location"]):
            # Ask for localizations installation.
            print_separator(logger)
            inform("Choose if you want to install xlets localizations.")
            inform("1. Do not install xlets localizations")
            inform("2. Install xlets localizations")
            prompts.do_prompt(options_map_defaults,
                              "install_localizations",
                              "Enter option",
                              options_map_defaults["install_localizations"],
                              validator=validate_options_1_2)

        # Ask for extra files location.
        print_separator(logger)
        inform("Choose a location containing extra files to be copied into the built xlets folders.")
        logger.warning("Read the documentation to learn how this option works.",
                       date=False, to_file=False)
        inform("Choose an option:")
        question = "%s\n%s" % ("**1.** Specify location.",
                               "**Press any other key to ignore and reset this option.**")

        answer = prompts.read_char(question)

        if answer == "1":
            inform("Choose extra files location:")
            prompts.do_prompt(options_map_defaults,
                              "extra_files",
                              "Enter location",
                              options_map_defaults["extra_files"],
                              validator=validate_output_path)
        else:
            options_map_defaults["extra_files"] = ""

        # Ask for dry.
        print_separator(logger)
        inform("Choose to perform the build operation or a trial run with no changes made.")
        inform("1. Perform build operation")
        inform("2. Perform a trial run (dry run)")
        prompts.do_prompt(options_map_defaults,
                          "dry_run",
                          "Enter option",
                          options_map_defaults["dry_run"],
                          validator=validate_options_1_2)

    # TODO: Implement a "domain name validator" function.
    if not options_map_defaults["domain_name"].strip():
        logger.warning(_missing_theme_or_domain_name_msg.format(capital="Domain",
                                                                lower="domain",
                                                                types="xlets"), date=False, to_file=False)
        raise SystemExit(1)

    if options_map_defaults["build_output"].startswith(get_base_temp_folder()):
        options_map_defaults["build_output"] = os.path.join(
            get_base_temp_folder(),
            misc_utils.micro_to_milli(misc_utils.get_date_time("filename"))
        )

    if not options_map_defaults["build_output"]:
        logger.warning(_not_specified_output_location, date=False, to_file=False)
        raise SystemExit(1)

    all_xlets = get_xlets_dirs()

    xlets_data = []

    for x in xlets:
        if x in all_xlets:
            xlet_type, xlet_dir_name = x.split(" ")
            uuid = "%s@%s" % (xlet_dir_name, options_map_defaults["domain_name"])
            xlets_data.append({
                "uuid": uuid,
                "type": xlet_type.lower(),
                "slug": xlet_dir_name,
                "source": os.path.join(root_folder, "%ss" % xlet_type.lower(), xlet_dir_name),
                "destination": os.path.join(
                    file_utils.expand_path(options_map_defaults["build_output"]),
                    "%ss" % xlet_type.lower(),
                    uuid
                )
            })
        else:
            logger.warning("**%s doesn't exists.**" % x)
            logger.warning("**Global metadata file might need to be re-generated.**" % x)

    dry_run = options_map["dry_run"][options_map_defaults["dry_run"]]
    do_not_cofirm = options_map["do_not_cofirm"][options_map_defaults["do_not_cofirm"]]
    install_localizations = options_map["install_localizations"][
        options_map_defaults["install_localizations"]
    ]

    if xlets_data:
        built_xlets = []

        for data in xlets_data:
            builder = XletBuilder(
                data,
                do_not_cofirm=do_not_cofirm,
                install_localizations=install_localizations,
                extra_files=options_map_defaults["extra_files"],
                dry_run=dry_run,
                logger=logger
            )
            built = builder.build()

            if built:
                built_xlets.append(data["slug"])

        if len(xlets_data) != len(built_xlets):
            print_separator(logger)
            logger.warning(
                "The build process of some xlets was canceled or there was an error while building them.")
            logger.warning("Check the logs for more details.")

        if dry_run:
            logger.log_dry_run("**Built xlets will be saved at:**\n%s" %
                               options_map_defaults["build_output"])
            logger.log_dry_run("**Xlets build data will be saved at:**\n%s" %
                               PATHS["xlets_latest_build_data_file"])
        else:
            print("")
            logger.info("**Built xlets saved at:**\n%s" % options_map_defaults["build_output"])

            with open(PATHS["xlets_latest_build_data_file"], "w", encoding="UTF-8") as outfile:
                json.dump(options_map_defaults, outfile, indent=4, ensure_ascii=False)


class XletBuilder():
    """XletBuilder class.

    Attributes
    ----------
    logger : object
        See <class :any:`LogSystem`>.
    """

    def __init__(self, xlet_data,
                 do_not_cofirm=False,
                 install_localizations=False,
                 extra_files="",
                 dry_run=False,
                 logger=None):
        """Initialize.

        Parameters
        ----------
        xlet_data : dict
            The xlet data to handle.
        do_not_cofirm : bool
            Whether to ask for overwrite confirmation when an xlet destination exists or not.
        dry_run : bool
            Log an action without actually performing it.
        logger : object
            See <class :any:`LogSystem`>.
        """
        self._xlet_data = xlet_data
        self._do_not_cofirm = do_not_cofirm
        self._install_localizations = install_localizations
        self._extra_files = extra_files
        self._dry_run = dry_run
        self.logger = logger

        self._schemas_dir = os.path.join(xlet_data["destination"], "schemas")
        self._config_file = os.path.join(xlet_data["source"], "z_config.py")

    def build(self):
        """Build xlet.
        """
        self.logger.info(shell_utils.get_cli_separator("#"), date=False)
        self.logger.info("**Building the %s %s**" %
                         (self._xlet_data["type"], self._xlet_data["slug"]))

        # NOTE: If the copy operation was canceled, do not proceed with the building process.
        proceed = self._do_copy()

        if proceed:
            self._handle_config_file()

            if self._dry_run:
                self.logger.log_dry_run("**String substitutions will be performed at:**\n%s" %
                                        self._xlet_data["destination"])
            else:
                string_utils.do_string_substitutions(self._xlet_data["destination"],
                                                     self._get_replacement_data(),
                                                     logger=self.logger)

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
            ("{{XLET_SYSTEM}}", XLET_SYSTEM[self._xlet_data.get("type", "")]),
            ("{{XLET_META}}", XLET_META[self._xlet_data.get("type", "")]),
            ("{{REPO_URL}}", URLS["repo"]),
            ("{{XLET_TYPE}}", self._xlet_data.get("type", "")),
            # Yes, include the escaped double quotes to keep the template file without errors.
            # The replacement data will be a "Python boolean" (True or False).
            ("\"{{XLET_HAS_SCHEMA}}\"", "True" if file_utils.is_real_dir(self._schemas_dir) else "False"),
        ]

    def _do_copy(self):
        """Copy xlet files into its final destination.

        NOTE: Do not raise inside this function. Return True or False so other instances
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
            if not self._do_not_cofirm:
                self.logger.warning(_existent_xlet_destination_msg.format(
                    path=self._xlet_data["destination"]
                ), date=False, to_file=False)

            if self._do_not_cofirm or prompts.confirm(prompt="Proceed?", response=False):
                if self._dry_run:
                    self.logger.log_dry_run("**Destination will be eradicated:**\n%s" %
                                            self._xlet_data["destination"])
                else:
                    rmtree(self._xlet_data["destination"], ignore_errors=True)
            else:
                self.logger.warning("Building the %s %s was canceled." %
                                    (self._xlet_data["type"], self._xlet_data["slug"]
                                     ), date=False, to_file=False)
                return False

        self.logger.info("**Copying main xlet files...**")

        if self._dry_run:
            self.logger.log_dry_run("**Source:** %s" % self._xlet_data["source"])
            self.logger.log_dry_run("**Will be copied into:** %s" % self._xlet_data["destination"])
        else:
            copytree(self._xlet_data["source"], self._xlet_data["destination"], symlinks=False,
                     ignore=ignore_patterns(*_xlet_dir_ignored_patterns),
                     ignore_dangling_symlinks=True)

        self.logger.info("**Copying common xlet files...**")
        for extra in _extra_common_files:
            src = os.path.join(extra["source_path"], extra["file_name"])
            dst = os.path.join(self._xlet_data["destination"], extra.get(
                "destination_path", ""), extra["file_name"])

            if extra.get("depends_on") is not None:
                file_to_check = os.path.join(self._xlet_data["destination"], extra["depends_on"])

                if not os.path.exists(file_to_check):
                    continue

            if self._dry_run:
                self.logger.log_dry_run("**Source:** %s" % src)
                self.logger.log_dry_run("**Will be copied into:** %s" % dst)
            else:
                if not os.path.exists(os.path.dirname(dst)):
                    os.makedirs(os.path.dirname(dst))

                copy2(src, dst)

        return True

    def _handle_config_file(self):
        """Handle xlet configuration file if any.
        """
        if os.path.exists(self._config_file):
            from runpy import run_path
            extra_settings = run_path(self._config_file)["settings"]

            if extra_settings.get("extra_files", False):
                self.logger.info("**Copying extra files...**")

                for obj in extra_settings.get("extra_files"):
                    src = os.path.join(root_folder, obj["source"])
                    dst = os.path.join(self._xlet_data["destination"], obj["destination"])

                    if file_utils.is_real_dir(src):
                        if self._dry_run:
                            self.logger.log_dry_run("**Folder to be copied:**\n%s" % src)
                            self.logger.log_dry_run("**Destination:**\n%s" % dst)
                        else:
                            file_utils.custom_copytree(src, dst, logger=self.logger, overwrite=True)
                    elif file_utils.is_real_file(src):
                        if self._dry_run:
                            self.logger.log_dry_run("**File to be copied:**\n%s" % src)
                            self.logger.log_dry_run("**Destination:**\n%s" % dst)
                        else:
                            file_utils.custom_copy2(src, dst, logger=self.logger, overwrite=True)

            if extra_settings.get("symlinks", False):
                self.logger.info("**Generating symbolic links...**")

                if self._dry_run:
                    self.logger.log_dry_run("**Changing current working directory to:**\n%s" %
                                            self._xlet_data["destination"])
                else:
                    os.chdir(self._xlet_data["destination"])

                for dir in extra_settings.get("symlinks"):
                    parent_dir = os.path.join(self._xlet_data["destination"], dir)

                    if self._dry_run:
                        self.logger.log_dry_run(
                            "**Parent directory will be created at:**\n%s" % parent_dir)
                    else:
                        os.makedirs(parent_dir, exist_ok=True)

                    for src, dst in extra_settings.get("symlinks")[dir]:
                        if self._dry_run:
                            self.logger.log_dry_run(
                                "**Symbolic link for file/folder:**\n%s" % src)
                            self.logger.log_dry_run(
                                "**Will be created at:**\n%s" % os.path.join(dir, dst))
                        else:
                            os.symlink(src, os.path.join(dir, dst))

                if self._dry_run:
                    self.logger.log_dry_run("**Changing current working directory to:**\n%s" %
                                            root_folder)
                else:
                    os.chdir(root_folder)

    def _compile_schemas(self):
        """Compile schema files if any.
        """
        if file_utils.is_real_dir(self._schemas_dir):
            self.logger.info("**Compiling gsettings schema...**")
            cmd = ["glib-compile-schemas", ".", "--targetdir=."]

            if self._dry_run:
                self.logger.log_dry_run("**Command that will be executed:**\n%s" % " ".join(cmd))
                self.logger.log_dry_run(
                    "**Command will be executed on directory:**\n%s" % self._schemas_dir)
            else:
                cmd_utils.run_cmd(cmd, stdout=None, stderr=None, cwd=self._schemas_dir)

    def _copy_extra_files(self):
        if not self._extra_files:
            return

        extra_files_for_xlet = os.path.join(
            self._extra_files,
            self._xlet_data["type"] + "s",
            self._xlet_data["slug"]
        )

        if not file_utils.is_real_dir(extra_files_for_xlet):
            return

        self.logger.info("**Copying extra files into built xlet folder:**")

        file_utils.custom_copytree(extra_files_for_xlet,
                                   self._xlet_data["destination"],
                                   logger=self.logger,
                                   log_copied_file=True,
                                   ignored_patterns=_xlet_dir_ignored_patterns,
                                   overwrite=True)

    def _set_executable(self):
        """Set files as executable.
        """
        self.logger.info("**Setting execution permissions to the following files:**")
        valid_extensions = (".py", ".bash", ".sh", ".rb")

        if self._dry_run:
            self.logger.log_dry_run("**Files located at:**\n%s" % self._xlet_data["destination"])
            self.logger.log_dry_run("**Files ending with the following extensions:** %s" %
                                    ", ".join(valid_extensions))
        else:
            for root, dirs, files in os.walk(self._xlet_data["destination"], topdown=False):
                for fname in files:
                    # Only deal with a limited set of file extensions.
                    if not fname.endswith(valid_extensions):
                        continue

                    file_path = os.path.join(root, fname)

                    if file_utils.is_real_file(file_path):
                        self.logger.info(os.path.relpath(
                            file_path, self._xlet_data["destination"]), date=False)
                        os.chmod(file_path, 0o755)

    def _install_po_files(self):
        if not self._install_localizations:
            return

        if not self._xlet_data["destination"].startswith(PATHS["xlets_install_location"]):
            self.logger.warning(
                "**Localizations can only be installed when the xlets are built into Cinnamon's install location for xlets.**")
            return

        self.logger.info("**Installing xlet localizations:**")

        try:
            executable = "make-cinnamon-xlet-pot-cli"

            # Mark for deletion on EOL. Cinnamon 3.8.x+
            # Newer Cinnamon versions use cinnamon-xlet-makepot.
            if not cmd_utils.which(executable):
                executable = "cinnamon-json-makepot"

            if not cmd_utils.which(executable):
                executable = "cinnamon-xlet-makepot"

            cmd_utils.run_cmd(executable + " -i",
                              stdout=None,
                              stderr=None,
                              shell=True,
                              cwd=self._xlet_data["destination"])
        except Exception as err:
            self.logger.error(err)


def _list_xlets_dirs(xlet_type_subdir):
    """Get list of xlets directories for an xlet type.

    Parameters
    ----------
    xlet_type_subdir : str
        The repository sub directory for an xlet type.

    Returns
    -------
    list
        The list of xlet directory names.
    """
    return os.listdir(os.path.join(root_folder, xlet_type_subdir))


def get_xlets_dirs():
    """Get xlets dirs.

    Returns
    -------
    list
        The list of xlets directory names prefixed with their "types".
    """
    applets_dirs = ["Applet %s" % item for item in _list_xlets_dirs("applets")
                    if not item.startswith("0z")]
    extensions_dirs = ["Extension %s" % item for item in _list_xlets_dirs("extensions")
                       if not item.startswith("0z")]

    return applets_dirs + extensions_dirs


def build_themes(theme_name="", build_output="", do_not_cofirm=False,
                 dry_run=False, logger=None, from_menu=False):
    """Build themes.

    Parameters
    ----------
    theme_name : str, optional
        The given name of the theme.
    build_output : str, optional
        Path to the destination folder were the built themes will be saved.
    do_not_cofirm : bool, optional
        Whether to ask for overwrite confirmation when a theme destination exists or not.
    dry_run : bool, optional
        See <class :any:`XletBuilder`>.
    logger : object
        See <class :any:`LogSystem`>.
    from_menu : bool, optional
        Whether this function was called from the CLI menu or not.

    Raises
    ------
    SystemExit
        Halt execution if the theme name cannot be obtained.
    """
    # NOTE: o_m_l_v a.k.a. options_map_latest_used_values
    try:
        with open(PATHS["theme_latest_build_data_file"], "r", encoding="UTF-8") as f:
            o_m_l_v = json.loads(f.read())
    except Exception:
        o_m_l_v = None

    if not theme_name:
        try:
            with open(PATHS["theme_name_storage_file"], "r", encoding="UTF-8") as theme_file:
                theme_name = theme_file.read().strip()
        except Exception:
            theme_name = "MyThemeName"

    options_map = {
        "cinnamon_version": {
            "1": "3.0",
            "2": "3.4",
            "3": "4.0"
        },
        "gtk3_version": {
            "1": "3.18",
            "2": "3.22"
        },
        "do_not_cofirm": {
            "1": False,
            "2": True
        },
        "dry_run": {
            "1": False,
            "2": True
        }
    }

    # __version__ is used to verify that the stored data is compatible with the
    # default data used when generating themes.
    options_map_defaults = {
        "__version__": "3",
        "theme_name": theme_name,
        # Note: Check needed to avoid storing None.
        "build_output": build_output or "",
        "do_not_cofirm": "2" if do_not_cofirm else "1",
        "dry_run": "2" if dry_run else "1",
        "cinnamon_version": "1",
        "cinnamon_font_size": "10pt",
        "cinnamon_font_family": '"Noto Sans", sans, Sans-Serif',
        "gtk3_version": "1",
        "gtk3_csd_shadow": "0 2px 5px 0 alpha(black, 0.3), 0 0 0 1px darker(@theme_bg_color)",
        "gtk3_csd_backdrop_shadow": "0 2px 5px 0 alpha(black, 0.1), 0 0 0 1px darker(@theme_bg_color)",
    }

    interactive = True

    if o_m_l_v is not None and options_map_defaults != o_m_l_v and \
            options_map_defaults["__version__"] == o_m_l_v.get("__version__"):
        print_separator(logger)
        inform("Build data from a previous theme build found at:")
        logger.info("**%s**" % PATHS["theme_latest_build_data_file"], date=False, to_file=False)
        inform("Details:")
        logger.info(_theme_build_data.format(
            cinnamon_version=options_map["cinnamon_version"][o_m_l_v["cinnamon_version"]],
            cinnamon_font_size=o_m_l_v["cinnamon_font_size"],
            cinnamon_font_family=o_m_l_v["cinnamon_font_family"],
            gtk3_version=options_map["gtk3_version"][o_m_l_v["gtk3_version"]],
            gtk3_csd_shadow=o_m_l_v["gtk3_csd_shadow"],
            gtk3_csd_backdrop_shadow=o_m_l_v["gtk3_csd_backdrop_shadow"],
            theme_name=o_m_l_v["theme_name"],
            build_output=o_m_l_v["build_output"],
            do_not_cofirm=str(not options_map["do_not_cofirm"][o_m_l_v["do_not_cofirm"]]),
            dry_run=str(options_map["dry_run"][o_m_l_v["dry_run"]])
        ), date=False, to_file=False)
        print_separator(logger)
        inform("Choose an option:")
        question = "%s\n%s\n%s" % ("**1.** Use data interactively.",
                                   "**2.** Use data and directly build themes.",
                                   "**Press any other key to not use stored data.**")

        answer = prompts.read_char(question)

        # Do not change defaults if one chooses not to use stored build data.
        if answer == "1" or answer == "2":
            options_map_defaults = o_m_l_v
        else:
            pass

        interactive = answer != "2"

    if interactive:
        # Ask for Cinnamon theme version.
        print_separator(logger)
        inform("Choose in which Cinnamon version the theme will be used.")
        inform("1. 3.0.x to 3.2.x")
        inform("2. 3.4.x to 3.8.x")
        inform("3. 4.0.x plus")

        prompts.do_prompt(options_map_defaults,
                          "cinnamon_version",
                          "Enter an option",
                          options_map_defaults["cinnamon_version"],
                          validator=validate_options_1_2_3)

        # Ask for Cinnamon theme font size.
        print_separator(logger)
        inform("Set the Cinnamon theme font size.")

        prompts.do_prompt(options_map_defaults,
                          "cinnamon_font_size",
                          "Enter a value",
                          options_map_defaults["cinnamon_font_size"])

        # Ask for Cinnamon theme font family.
        print_separator(logger)
        inform("Set the Cinnamon theme font family.")

        prompts.do_prompt(options_map_defaults,
                          "cinnamon_font_family",
                          "Enter a value",
                          options_map_defaults["cinnamon_font_family"])

        # Ask for Gtk3 theme version.
        print_separator(logger)
        inform("Choose in which Gtk+ version the theme will be used.")
        inform("1. 3.18.x")
        inform("2. 3.22.x")

        prompts.do_prompt(options_map_defaults,
                          "gtk3_version",
                          "Enter an option",
                          options_map_defaults["gtk3_version"],
                          validator=validate_options_1_2)

        # Ask for Gtk3 theme CSD selector.
        print_separator(logger)
        inform("Set Gtk3 client side decorations shadow.")
        inform("Selector: %s" % (
            ".window-frame" if options_map_defaults["gtk3_version"] == "1" else "decoration"
        ))

        prompts.do_prompt(options_map_defaults,
                          "gtk3_csd_shadow",
                          "Enter a value",
                          options_map_defaults["gtk3_csd_shadow"])

        # Ask for Gtk3 theme CSD backdrop selector.
        print_separator(logger)
        inform("Set Gtk3 client side decorations backdrop shadow.")
        inform("Selector: %s" % (
            ".window-frame:backdrop" if options_map_defaults["gtk3_version"] == "1" else "decoration:backdrop"
        ))

        prompts.do_prompt(options_map_defaults,
                          "gtk3_csd_backdrop_shadow",
                          "Enter a value",
                          options_map_defaults["gtk3_csd_backdrop_shadow"])

        # Ask for build output.
        print_separator(logger)
        inform("Where to store built themes?")
        inform("Choose an option:")
        question = "%s\n%s\n%s" % ("**1.** Temporary location.",
                                   "**2.** Install into user home.",
                                   "**Press any other key to specify a location.**")

        answer = prompts.read_char(question)
        ask_for_confirmation_options = answer != "1"

        if answer == "1":
            options_map_defaults["build_output"] = os.path.join(
                get_base_temp_folder(),
                misc_utils.micro_to_milli(misc_utils.get_date_time("filename"))
            )
        elif answer == "2":
            options_map_defaults["build_output"] = os.path.join(
                "~", ".themes"
            )
        else:
            # Ask for output directory.
            print_separator(logger)
            inform("Choose a storage location:")
            # NOTE: Yes, if the previous build_output was the temporary location,
            # inform that it will be overwritten with a new temporary location.
            # This is to avoid dealing with existing xlets built into /tmp.
            if options_map_defaults["build_output"].startswith(get_base_temp_folder()):
                logger.info(
                    "The following default value, if chosen, it will be re-generated and overwritten.",
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
        if options_map_defaults["build_output"].startswith(get_base_temp_folder()):
            ask_for_confirmation_options = False
            options_map_defaults["do_not_cofirm"] = "2"

        if ask_for_confirmation_options:
            # Ask for overwrite confirmation.
            print_separator(logger)
            inform("Choose what to do when a built theme already exists at the destination.")
            inform("1. Confirm each overwrite operation")
            inform("2. Directly overwrite existent themes")
            prompts.do_prompt(options_map_defaults,
                              "do_not_cofirm",
                              "Enter option",
                              options_map_defaults["do_not_cofirm"],
                              validator=validate_options_1_2)

        # Ask for dry.
        print_separator(logger)
        inform("Choose to perform the build operation or a trial run with no changes made.")
        inform("1. Perform build operation")
        inform("2. Perform a trial run (dry run)")
        prompts.do_prompt(options_map_defaults,
                          "dry_run",
                          "Enter option",
                          options_map_defaults["dry_run"],
                          validator=validate_options_1_2)

    theme_data = {
        "cinnamon_version": options_map["cinnamon_version"][options_map_defaults["cinnamon_version"]],
        "cinnamon_font_size": options_map_defaults["cinnamon_font_size"],
        "cinnamon_font_family": options_map_defaults["cinnamon_font_family"],
        "gtk3_version": options_map["gtk3_version"][options_map_defaults["gtk3_version"]],
        "gtk3_csd_shadow": options_map_defaults["gtk3_csd_shadow"],
        "gtk3_csd_backdrop_shadow": options_map_defaults["gtk3_csd_backdrop_shadow"],
    }

    if interactive:
        print_separator(logger)
        inform("Enter a name for the theme:")
        prompts.do_prompt(options_map_defaults,
                          "theme_name",
                          "Enter name",
                          options_map_defaults["theme_name"])

    if not options_map_defaults["theme_name"].strip():
        logger.warning(_missing_theme_or_domain_name_msg.format(
            capital="Theme",
            lower="theme",
            types="themes"
        ), date=False, to_file=False)

        raise SystemExit(1)

    if options_map_defaults["build_output"].startswith(get_base_temp_folder()):
        options_map_defaults["build_output"] = os.path.join(
            get_base_temp_folder(),
            misc_utils.micro_to_milli(misc_utils.get_date_time("filename"))
        )

    if not options_map_defaults["build_output"]:
        logger.warning(_not_specified_output_location, date=False, to_file=False)
        raise SystemExit(1)

    themes_sources = os.path.join(root_folder, "themes")
    common_version_insensitive_files = os.path.join(
        themes_sources, "_common", "_version_insensitive")
    common_version_sensitive = os.path.join(themes_sources, "_common", "_version_sensitive")
    common_version_sensitive_cinnamon_files = os.path.join(
        common_version_sensitive, "cinnamon", theme_data["cinnamon_version"])
    common_version_sensitive_gtk3_files = os.path.join(
        common_version_sensitive, "gtk-3.0", theme_data["gtk3_version"])
    theme_variants = os.listdir(os.path.join(themes_sources, "_variants"))
    strings_subst_extensions = (".css", ".svg", ".xml", ".json", ".rc",
                                "gtkrc", ".theme", ".ini")

    from runpy import run_path

    dry_run = options_map["dry_run"][options_map_defaults["dry_run"]]
    do_not_cofirm = options_map["do_not_cofirm"][options_map_defaults["do_not_cofirm"]]
    built_theme_variants = []

    for variant in theme_variants:
        logger.info(shell_utils.get_cli_separator("-"), date=False)
        logger.info("**Generating variant:** %s" % variant)

        full_theme_name = "%s-%s" % (options_map_defaults["theme_name"].strip(), variant)

        destination_folder = file_utils.expand_path(
            os.path.join(options_map_defaults["build_output"], full_theme_name)
        )

        if file_utils.is_real_file(destination_folder):
            logger.warning("**InvalidDestination:** Destination exists and is a file!!! Aborted!!!",
                           date=False)
            continue

        if file_utils.is_real_dir(destination_folder):
            if not do_not_cofirm:
                logger.warning(_existent_xlet_destination_msg.format(path=destination_folder),
                               date=False)

            if do_not_cofirm or prompts.confirm(prompt="Proceed?", response=False):
                if dry_run:
                    logger.log_dry_run("**Destination will be eradicated:**\n%s" %
                                       destination_folder)
                else:
                    rmtree(destination_folder, ignore_errors=True)
            else:
                logger.warning("**OperationAborted:** The theme building process was canceled.",
                               date=False)
                continue

        variant_folder = os.path.join(themes_sources, "_variants", variant)
        variant_config = run_path(os.path.join(variant_folder, "config.py"))["settings"]
        variant_config["replacement_data"].append(("@repo_url@", URLS["repo"]))
        variant_config["replacement_data"].append(
            ("@theme_name@", options_map_defaults["theme_name"].strip()))
        variant_config["replacement_data"].append(("@theme_variant@", variant))
        variant_config["replacement_data"].append(
            ('"@font_size@"', theme_data["cinnamon_font_size"]))
        variant_config["replacement_data"].append(
            ('"@font_family@"', theme_data["cinnamon_font_family"]))
        variant_config["replacement_data"].append(
            ('"@csd_shadow@"', theme_data["gtk3_csd_shadow"]))
        variant_config["replacement_data"].append(
            ('"@csd_backdrop_shadow@"', theme_data["gtk3_csd_backdrop_shadow"]))
        variant_version_insensitive_files = os.path.join(variant_folder, "_version_insensitive")
        variant_version_sensitive = os.path.join(variant_folder, "_version_sensitive")
        variant_version_sensitive_cinnamon_files = os.path.join(
            variant_version_sensitive, "cinnamon", theme_data["cinnamon_version"])
        variant_version_sensitive_gtk3_files = os.path.join(
            variant_version_sensitive, "gtk-3.0", theme_data["gtk3_version"])

        logger.info("**Copying files...**")

        if dry_run:
            logger.log_dry_run("**Copying common version insensitive files:**")
            logger.log_dry_run("**Source:**\n%s" % common_version_insensitive_files)
            logger.log_dry_run("**Destination:**\n%s" % destination_folder)
        else:
            file_utils.custom_copytree2(common_version_insensitive_files, destination_folder)

        if os.path.exists(common_version_sensitive_cinnamon_files):
            if dry_run:
                logger.log_dry_run("**Copying version sensitive Cinnamon files:**")
                logger.log_dry_run("**Source:**\n%s" % common_version_sensitive_cinnamon_files)
                logger.log_dry_run("**Destination:**\n%s" %
                                   os.path.join(destination_folder, "cinnamon"))
            else:
                file_utils.custom_copytree2(common_version_sensitive_cinnamon_files,
                                            os.path.join(destination_folder, "cinnamon"))

        if os.path.exists(common_version_sensitive_gtk3_files):
            if dry_run:
                logger.log_dry_run("**Copying version sensitive Gtk 3 files:**")
                logger.log_dry_run("**Source:**\n%s" % common_version_sensitive_gtk3_files)
                logger.log_dry_run("**Destination:**\n%s" %
                                   os.path.join(destination_folder, "gtk-3.0"))
            else:
                file_utils.custom_copytree2(common_version_sensitive_gtk3_files,
                                            os.path.join(destination_folder, "gtk-3.0"))

        if dry_run:
            logger.log_dry_run("**Copying variant version insensitive files:**")
            logger.log_dry_run("**Source:**\n%s" % variant_version_insensitive_files)
            logger.log_dry_run("**Destination:**\n%s" % destination_folder)
        else:
            file_utils.custom_copytree2(variant_version_insensitive_files, destination_folder)

        if os.path.exists(variant_version_sensitive_gtk3_files):
            if dry_run:
                logger.log_dry_run("**Copying variant version sensitive Gtk 3 files:**")
                logger.log_dry_run("**Source:**\n%s" % variant_version_sensitive_gtk3_files)
                logger.log_dry_run("**Destination:**\n%s" %
                                   os.path.join(destination_folder, "gtk-3.0"))
            else:
                file_utils.custom_copytree2(variant_version_sensitive_gtk3_files,
                                            os.path.join(destination_folder, "gtk-3.0"))

        if os.path.exists(variant_version_sensitive_cinnamon_files):
            if dry_run:
                logger.log_dry_run("**Copying variant version sensitive Cinnamon files:**")
                logger.log_dry_run("**Source:**\n%s" % variant_version_sensitive_cinnamon_files)
                logger.log_dry_run("**Destination:**\n%s" %
                                   os.path.join(destination_folder, "cinnamon"))
            else:
                file_utils.custom_copytree2(variant_version_sensitive_cinnamon_files,
                                            os.path.join(destination_folder, "cinnamon"))

        logger.info("**Performing string substitutions...**")
        if dry_run:
            logger.log_dry_run("**Files located at:**\n%s" % destination_folder)
            logger.log_dry_run("**Files ending with the following extensions:** %s" %
                               ", ".join(strings_subst_extensions))
        else:
            for root, dirs, files in os.walk(destination_folder, topdown=False):
                for fname in files:
                    # Only deal with a limited set of file extensions.
                    if not fname.endswith(strings_subst_extensions):
                        continue

                    file_path = os.path.join(root, fname)

                    with open(file_path, "r+", encoding="UTF-8") as file:
                        file_data = file.read()
                        file.seek(0)
                        file_data_modified = string_utils.do_replacements(
                            file_data, variant_config["replacement_data"])

                        if file_data_modified != file_data:
                            file.write(file_data_modified)
                            file.truncate()

        built_theme_variants.append(variant)
        logger.success("**Theme variant %s successfully built.**" % variant)

    if len(theme_variants) != len(built_theme_variants):
        print_separator(logger)
        logger.warning(
            "The build process of some themes was canceled or there was an error while building them.")
        logger.warning("Check the logs for more details.")

    if dry_run:
        logger.log_dry_run("**Built themes will be saved at %s**" %
                           options_map_defaults["build_output"])
        logger.log_dry_run("**Theme build data will be saved at:**\n%s" %
                           PATHS["theme_latest_build_data_file"])
    else:
        print("")
        logger.info("**Built themes saved at %s**" % options_map_defaults["build_output"])

        with open(PATHS["theme_latest_build_data_file"], "w", encoding="UTF-8") as outfile:
            json.dump(options_map_defaults, outfile, indent=4, ensure_ascii=False)


def restart_cinnamon():
    """Restart Cinnamon.
    """
    cmd_utils.run_cmd("nohup cinnamon --replace > /dev/null 2>&1 &",
                      stdout=None, stderr=None, shell=True)


class BaseXletGenerator():
    """Base xlet generator.

    Attributes
    ----------
    base_xlet_path : str
        Path to the base application (the template).
    logger : object
        See <class :any:`LogSystem`>.
    new_xlet_destination : str
        The path to the new generated application.
    xlet_data : dict
        Storage for xlet data that will be used to generate a base xlet.
    """

    def __init__(self, logger):
        """Initialize.

        Parameters
        ----------
        logger : object
            See <class :any:`LogSystem`>.
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
                "manager": "appletManager",
                "files": [
                    "applet.js",
                    "utils.js",
                    "metadata.json",
                    "settings-schema.json",
                    "z_create_localized_help.py"
                ]
            },
            "2": {
                "type": "extension",
                "manager": "extensionSystem",
                "files": [
                    "extension.js",
                    "utils.js",
                    "metadata.json",
                    "z_create_localized_help.py"
                ]
            }
        }

        inform("\nEnter an xlet type:\n\n1. applet\n2. extension")
        prompts.do_prompt(prompt_data, "type", "Choose an option", prompt_data["type"])
        self.xlet_data["type"] = prompt_data_map[prompt_data["type"]]["type"]

        inform("\nEnter a name for the xlet:")
        prompts.do_prompt(prompt_data, "name", "Enter name", prompt_data["name"])
        self.xlet_data["name"] = prompt_data["name"]

        # Define these here so I can check for existent destination immediately after the
        # xlet name is defined and exit if it already exists.
        self.xlet_data["slug"] = "0" + "".join([part.title()
                                                for part in self.xlet_data["name"].split(" ")])

        self.base_xlet_path = os.path.join(root_folder, "__app__", "data", "templates", "BaseXlet")
        self.new_xlet_destination = os.path.join(root_folder,
                                                 "%ss" % self.xlet_data["type"],
                                                 self.xlet_data["slug"])

        if os.path.exists(self.new_xlet_destination):
            self.logger.warning("**ExistentLocation:** New xlet cannot be created.")
            raise SystemExit(1)

        inform("\nEnter a description for the xlet:")
        prompts.do_prompt(prompt_data, "description",
                          "Enter description", prompt_data["description"])
        self.xlet_data["description"] = prompt_data["description"]

        if self.xlet_data["type"] != "extension":
            inform("\nEnter max instances for the xlet:")
            prompts.do_prompt(prompt_data, "max_instances",
                              "Enter max. instances", prompt_data["max_instances"])
            self.xlet_data["max_instances"] = prompt_data["max_instances"]

        self.xlet_data["manager"] = prompt_data_map[prompt_data["type"]]["manager"]
        self.xlet_data["files"] = prompt_data_map[prompt_data["type"]]["files"]
        self.xlet_data["type_title_case"] = prompt_data["type"].title()

        self._replacement_data = [
            ("$$XLET_NAME$$", self.xlet_data["name"]),
            ("$$XLET_DESCRIPTION$$", self.xlet_data["description"]),
            ("$$XLET_MANAGER$$", self.xlet_data["manager"]),
            ("$$XLET_TYPE$$", self.xlet_data["type"]),
            ("$$XLET_TYPE_TITLE_CASE$$", self.xlet_data["type_title_case"]),
        ]

    def _do_copy(self):
        """Do copy.
        """
        os.makedirs(self.new_xlet_destination, exist_ok=True)

        self.logger.info("**Copying files...**")

        for file_name in self.xlet_data["files"]:
            copy2(os.path.join(self.base_xlet_path, file_name),
                  os.path.join(self.new_xlet_destination, file_name))


def generate_docs(generate_api_docs=False,
                  update_inventories=False,
                  force_clean_build=False,
                  logger=None):
    """See :any:`sphinx_docs_utils.generate_docs`

    Parameters
    ----------
    generate_api_docs : bool, optional
        See :any:`sphinx_docs_utils.generate_docs`.
    update_inventories : bool, optional
        See :any:`sphinx_docs_utils.generate_docs`.
    force_clean_build : bool, optional
        See :any:`sphinx_docs_utils.generate_docs`.
    logger : None, optional
        See :any:`LogSystem`.
    """
    from .python_utils import sphinx_docs_utils

    ignored_apidoc_modules = [
        os.path.join("__app__", "python_modules", "python_utils", "bottle.py"),
        os.path.join("__app__", "python_modules", "python_utils", "docopt.py"),
        os.path.join("__app__", "python_modules", "python_utils", "jsonschema"),
        os.path.join("__app__", "python_modules", "python_utils", "mistune.py"),
        os.path.join("__app__", "python_modules", "python_utils", "polib.py"),
        os.path.join("__app__", "python_modules", "python_utils", "pyperclip"),
        os.path.join("__app__", "python_modules", "python_utils", "titlecase.py"),
        os.path.join("__app__", "python_modules", "python_utils", "tqdm"),
        # The following module has perfectly valid docstrings, but Sphinx is being a
        # b*tch and throws a million warnings for no reason.
        # Ignore it until Sphinx gets its sh*t together.
        os.path.join("__app__", "python_modules", "python_utils", "tqdm_wget.py"),
        # Ignore the python_utils folder from all apps.
    ]

    base_apidoc_dest_path_rel_to_root = os.path.join("__app__", "cinnamon_tools_docs", "modules")

    apidoc_paths_rel_to_root = [
        (os.path.join("__app__", "python_modules"),
            os.path.join(base_apidoc_dest_path_rel_to_root, "python_modules"))
    ]

    sphinx_docs_utils.generate_docs(root_folder=root_folder,
                                    docs_src_path_rel_to_root=os.path.join(
                                        "__app__", "cinnamon_tools_docs"),
                                    docs_dest_path_rel_to_root=os.path.join(
                                        "__app__", "cinnamon_tools_docs", "docs"),
                                    apidoc_paths_rel_to_root=apidoc_paths_rel_to_root,
                                    doctree_temp_location_rel_to_sys_temp="CinnamonTools-doctrees",
                                    ignored_modules=ignored_apidoc_modules,
                                    generate_api_docs=generate_api_docs,
                                    update_inventories=update_inventories,
                                    force_clean_build=force_clean_build,
                                    logger=logger)

    # Man pages building.
    sphinx_docs_utils.generate_man_pages(root_folder=root_folder,
                                         docs_src_path_rel_to_root=os.path.join(
                                             "__app__", "cinnamon_tools_docs"),
                                         docs_dest_path_rel_to_root=os.path.join(
                                             "__app__", "data", "man"),
                                         doctree_temp_location_rel_to_sys_temp="CinnamonTools-man-doctrees",
                                         logger=logger)

    copy_help_pages_to_docs(logger)


def copy_help_pages_to_docs(logger):
    """Copy xlets help pages into built docs.

    Parameters
    ----------
    logger : object
        See <class :any:`LogSystem`>.
    """
    logger.info("**Copying xlets help pages into docs folder...**")

    xlets_list = AllXletsMetadata().meta_list

    # NOTE: Copy only once the asset files into the root of the _static folder.
    for asset in _common_help_assets:
        src = os.path.join(asset["source_path"], asset["file_name"])
        dst = os.path.join(PATHS["docs_built"], "_static",
                           asset["destination_path"], asset["file_name"])

        # NOTE: Be carefull. Do not remove folders, just files.
        if os.path.exists(dst):
            os.remove(dst)

        # Shouldn't be needed, but it doesn't hurt...
        if not os.path.exists(os.path.dirname(dst)):
            os.makedirs(os.path.dirname(dst), exist_ok=True)

        copy2(src, dst)

    for xlet in xlets_list:
        xlet_folder = file_utils.get_parent_dir(xlet["meta-path"], 0)
        xlet_html_file = os.path.join(xlet_folder, "HELP.html")

        if not os.path.exists(xlet_html_file):
            continue

        xlet_assets_folder = os.path.join(xlet_folder, "assets")
        xlet_icon = os.path.join(xlet_folder, "icon.png")
        dest_path = os.path.join(PATHS["docs_built"], "_static",
                                 "xlets_help_pages", xlet["slug"])
        dest_html_file = os.path.join(dest_path, "index.html")
        dest_icon_file = os.path.join(dest_path, "icon.png")
        dest_assets_folder = os.path.join(dest_path, "assets")

        # Clean up.
        if os.path.exists(dest_path):
            rmtree(dest_path)

        os.makedirs(dest_path, exist_ok=True)

        # Copy new files/folders.
        if os.path.exists(xlet_assets_folder):
            copytree(xlet_assets_folder, dest_assets_folder)

        copy2(xlet_html_file, dest_html_file)
        copy2(xlet_icon, dest_icon_file)

    # NOTE: Since I decided to copy only one copy of each common asset, change the
    # relative paths in all HTML files with a mass substitution.
    replacement_data = [
        ("./assets/css", "../../css"),
        ("./assets/js", "../../js"),
    ]

    string_utils.do_string_substitutions(os.path.join(PATHS["docs_built"],
                                                      "_static", "xlets_help_pages"),
                                         replacement_data,
                                         allowed_extensions=(".html"),
                                         logger=logger)


def get_base_temp_folder():
    """Get base temporary directory.

    Returns
    -------
    str
        Path to a temporary folder.
    """
    return os.path.join(misc_utils.get_system_tempdir(), "CinnamonToolsTemp")


def print_xlets_slugs():
    """Print xlets slugs.

    This method is called by the Bash completions script to auto-complete
    xlets slugs for the ``--xlet=`` and ``-x`` CLI options.
    """
    for xlet in get_xlets_dirs():
        xlet_type, xlet_dir_name = xlet.split(" ")
        print(xlet_dir_name)


def inform(msg):
    """Inform.

    Parameters
    ----------
    msg : str
        Message to display.
    """
    print(Ansi.LIGHT_MAGENTA("**%s**" % msg))


def print_separator(logger):
    """Print separator.

    Parameters
    ----------
    logger : object
        See <class :any:`LogSystem`>.
    """
    logger.info(shell_utils.get_cli_separator("-"), date=False, to_file=False)


if __name__ == "__main__":
    pass
