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
SUPPORTED_CINNAMON_VERSION_MAX : float
    Maximum Cinnamon version number.
SUPPORTED_CINNAMON_VERSION_MIN : float
    Minimum Cinnamon version number.
URLS : dict
    URLs storage.
validate_options_1_2 : function
    Function to validate numeric input.
validate_options_1_to_5 : function
    Function to validate numeric input.
XLET_META : dict
    Xlet meta type.
XLET_SYSTEM : dict
    Xlet system type.
"""
import json
import os

from runpy import run_path
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
validate_options_1_to_5 = generate_numeral_options_validator(5)

root_folder = os.path.realpath(os.path.abspath(os.path.join(
    os.path.normpath(os.path.join(os.path.dirname(__file__), *([".."] * 2))))))

SUPPORTED_CINNAMON_VERSION_MIN = 3.0

SUPPORTED_CINNAMON_VERSION_MAX = 7.0

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

_supported_cinnamon_theme_versions = [
    "3.0",
    "3.4",
    "4.0",
    "4.2",
    "4.4"
]

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
**Ask overwrite confirmation:**  {do_not_confirm}
**Dry run:**                     {dry_run}
"""

_xlets_build_data = """
**Domain name:**                 {domain_name}
**Output directory:**            {build_output}
**Install localizations:**       {install_localizations}
**Extra files from:**            {extra_files}
**Ask overwrite confirmation:**  {do_not_confirm}
**Dry run:**                     {dry_run}
"""

_git_log_cmd_xlets = 'git log --grep={xlet_slug} --pretty=format:"\
- **Date:** %aD%n\
- **Commit:** [%h]({repo_url}/commit/%h)%n\
- **Author:** %aN%n%n\`\`\`%n%b%n\`\`\`%n%n***%n" \
-- {relative_xlet_path} {append_or_override} "{log_path}"'

_changelog_header_xlets = """## {xlet_name} changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository]({repo_url})

***

"""

_git_log_cmd_repo = 'git log --grep="{all_xlets_slugs}" --invert-grep --pretty=format:"\
- **Date:** %aD%n\
- **Commit:** [%h]({repo_url}/commit/%h)%n\
- **Author:** %aN%n%n\`\`\`%n%B%n\`\`\`%n%n***%n" \
-- {relative_xlet_path} {append_or_override} "{log_path}"'

_changelog_header_repo = """## Repository changelog

#### The changelogs for xlets can be found inside each xlet folder and/or in their help pages.

***

"""


class XletsHelperCore():
    """Xlets core functions.

    Attributes
    ----------
    all_xlets_meta : list
        All xlets meta data.
    logger : object
        See :any:`LogSystem`.
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
        logger : object
            See :any:`LogSystem`.
        """
        self.logger = logger
        self.xlets_display_names = xlets_display_names
        self.all_xlets_meta = AllXletsMetadata().meta_list

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
        """See :any:`generate_meta_file`
        """
        self.all_xlets_meta = generate_meta_file()
        self._store_xlets_meta()

    def create_xlets_changelogs(self):
        """Create xlets change logs.

        Generate the CHANGELOG.md files for all xlets.
        """
        self.logger.info("**Generating xlets change logs...**")

        for xlet in self.xlets_meta:
            self.logger.info("**Generating change log for %s...**" % xlet["name"])

            try:
                xlet_root_folder = file_utils.get_parent_dir(xlet["meta-path"], 0)
                log_path = os.path.join(xlet_root_folder, "__data__", "CHANGELOG.md")
                os.makedirs(os.path.dirname(log_path), exist_ok=True)

                with open(log_path, "w") as f:
                    f.write(_changelog_header_xlets.format(
                        xlet_name=xlet["name"],
                        repo_url=URLS["repo"]
                    ))

                # Generate change log from current repository paths.
                relative_xlet_path = "./" + xlet["type"] + "s/" + xlet["slug"]
                cmd = _git_log_cmd_xlets.format(
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
    This metadata file is used by several functions on the :any:`XletsHelperCore` class.

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

    applet_dirs = _list_xlets_dirs("applets")
    exension_dirs = _list_xlets_dirs("extensions")

    def append_meta_path(xlet_dirs, xlet_type):
        """Append metadata path.

        Parameters
        ----------
        xlet_dirs : list
            List of xlets directories.
        xlet_type : str
            The type of xlet.
        """
        for xlet_dir in xlet_dirs:
            xlet_meta_path = os.path.join(root_folder, xlet_type, xlet_dir, "metadata.json")

            if file_utils.is_real_file(xlet_meta_path):
                xlet_meta_files.append(xlet_meta_path)

    append_meta_path(applet_dirs, "applets")
    append_meta_path(exension_dirs, "extensions")

    for xlet_meta_path in xlet_meta_files:
        with open(xlet_meta_path, "r", encoding="UTF-8") as xlet_meta_file:
            raw_meta = xlet_meta_file.read()
            json_meta = json.loads(raw_meta)
            # Store the path to the metadata.json file so I can use it to create
            # the different needed paths when needed.
            # This will allow me to avoid to constantly create a path with
            # os.path.join in my functions. I will just use the metadata.json path
            # and "traverse it".
            json_meta["meta-path"] = xlet_meta_path
            json_meta["slug"] = os.path.basename(
                os.path.dirname(xlet_meta_path))

            if "/applets/" + json_meta["slug"] in xlet_meta_path:
                json_meta["type"] = "applet"
            elif "/extensions/" + json_meta["slug"] in xlet_meta_path:
                json_meta["type"] = "extension"

            xlet_meta.append(json_meta)

    with open(PATHS["all_xlets_meta_file"], "w", encoding="UTF-8") as outfile:
        json.dump(xlet_meta, outfile, indent=4, ensure_ascii=False)

    if return_data:
        return xlet_meta


def supported_cinnamon_versions_range(start, stop):
    """Generate a list of Cinnamon versions.

    This generates a list of Cinnamon versions from a start version to an end version using only
    mayor and minor version numbers (floats) ignoring micro numbers.

    Parameters
    ----------
    start : float/int
        The start version number.
    stop : float/int
        The end version number.

    Returns
    -------
    list
        List of supported Cinnamon versions.
    """
    count = start
    versions = []

    while count < stop:
        # NOTE: Round to 1 decimal point.
        # Because working with floats sucks in every single programming language!
        versions.append("%.1f" % count)
        count += 0.1

    # NOTE: Because depending on the stop value, it might get added or not to
    # the array. So, check if it is, add it otherwise. FLOATS SUCK!!!
    if str(stop) not in versions:
        versions.append("%.1f" % stop)

    return versions


def build_xlets(xlets_display_names=[],
                domain_name=None,
                build_output="",
                do_not_confirm=False,
                install_localizations=False,
                extra_files="",
                dry_run=False,
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
    dry_run : bool, optional
        See :any:`XletBuilder`.
    logger : object
        See :any:`LogSystem`.
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
        "do_not_confirm": {
            "1": False,
            "2": True
        },
        "dry_run": {
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
        "do_not_confirm": "2" if do_not_confirm else "1",
        "dry_run": "2" if dry_run else "1"
    }

    interactive = from_menu

    if interactive and o_m_l_v is not None and options_map_defaults != o_m_l_v:
        print_separator(logger)
        inform("Build data from a previous xlet build found at:")
        logger.info("**%s**" % PATHS["xlets_latest_build_data_file"], date=False, to_file=False)
        inform("Details:")
        logger.info(_xlets_build_data.format(
            domain_name=o_m_l_v["domain_name"],
            build_output=o_m_l_v["build_output"],
            do_not_confirm=str(not options_map["do_not_confirm"][o_m_l_v["do_not_confirm"]]),
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
            options_map_defaults["do_not_confirm"] = "2"

        if ask_for_confirmation_options:
            # Ask for overwrite confirmation.
            print_separator(logger)
            inform("Choose what to do when a built xlet already exists at the destination.")
            inform("1. Confirm each overwrite operation")
            inform("2. Directly overwrite existent xlets")
            prompts.do_prompt(options_map_defaults,
                              "do_not_confirm",
                              "Enter option",
                              options_map_defaults["do_not_confirm"],
                              validator=validate_options_1_2)

        # NOTE: Do not ask to install localizations if the output location
        # is not Cinnamon's install location for xlets.
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

    if options_map_defaults["build_output"].startswith(get_base_temp_folder()) or \
            not options_map_defaults["build_output"]:
        options_map_defaults["build_output"] = os.path.join(
            get_base_temp_folder(),
            misc_utils.micro_to_milli(misc_utils.get_date_time("filename"))
        )

    xlets_data = []

    for x in xlets_display_names:
        xlet_type, xlet_dir_name = x.split(" ")
        xlet_type = xlet_type.lower()
        xlet_source = os.path.join(root_folder, "%ss" % xlet_type, xlet_dir_name)
        xlet_config_file = os.path.join(xlet_source, "z_config.py")

        if file_utils.is_real_file(xlet_config_file):
            xlet_config = run_path(xlet_config_file)["settings"]
        else:
            xlet_config = {}

        uuid = "%s@%s" % (xlet_dir_name, options_map_defaults["domain_name"])
        xlets_data.append({
            "uuid": uuid,
            "type": xlet_type,
            "slug": xlet_dir_name,
            "config": xlet_config,
            "source": xlet_source,
            "destination": os.path.join(
                file_utils.expand_path(options_map_defaults["build_output"]),
                "%ss" % xlet_type,
                uuid
            )
        })

    dry_run = options_map["dry_run"][options_map_defaults["dry_run"]]
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
        See :any:`LogSystem`.
    """

    def __init__(self, xlet_data,
                 do_not_confirm=False,
                 install_localizations=False,
                 extra_files="",
                 dry_run=False,
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
        dry_run : bool
            Log an action without actually performing it.
        logger : object
            See :any:`LogSystem`.
        """
        self._xlet_data = xlet_data
        self._do_not_confirm = do_not_confirm
        self._install_localizations = install_localizations
        self._extra_files = extra_files
        self._dry_run = dry_run
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
        self.logger.info(shell_utils.get_cli_separator("#"), date=False)
        self.logger.info("**Building the %s %s**" %
                         (self._xlet_data["type"], self._xlet_data["slug"]))

        # NOTE: If the copy operation was canceled, do not proceed with the building process.
        proceed = self._do_copy()

        if proceed:
            self._handle_config_data()

            if self._dry_run:
                self.logger.log_dry_run("**String substitutions will be performed at:**\n%s" %
                                        self._xlet_data["destination"])
            else:
                string_utils.do_string_substitutions(self._xlet_data["destination"],
                                                     self._get_replacement_data(),
                                                     logger=self.logger)

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
            if not self._do_not_confirm:
                self.logger.warning(_existent_xlet_destination_msg.format(
                    path=self._xlet_data["destination"]
                ), date=False, to_file=False)

            if self._do_not_confirm or prompts.confirm(prompt="Proceed?", response=False):
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

    def _handle_config_data(self):
        """Handle xlet configuration file if any.
        """
        config_data = self._xlet_data["config"]

        if config_data:
            if config_data.get("extra_files", False):
                self.logger.info("**Copying extra files...**")

                for obj in config_data.get("extra_files"):
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

            if config_data.get("symlinks", False):
                self.logger.info("**Generating symbolic links...**")

                if self._dry_run:
                    self.logger.log_dry_run("**Changing current working directory to:**\n%s" %
                                            self._xlet_data["destination"])
                else:
                    os.chdir(self._xlet_data["destination"])

                for dir in config_data.get("symlinks"):
                    parent_dir = os.path.join(self._xlet_data["destination"], dir)

                    if self._dry_run:
                        self.logger.log_dry_run(
                            "**Parent directory will be created at:**\n%s" % parent_dir)
                    else:
                        os.makedirs(parent_dir, exist_ok=True)

                    for src, dst in config_data.get("symlinks")[dir]:
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

            if config_data.get("min_cinnamon_version_override", None):
                self.logger.info("**Minimum Cinnamon version override found...**")
                self._min_cinnamon_version_override = config_data.get(
                    "min_cinnamon_version_override")

            if config_data.get("max_cinnamon_version_override", None):
                self.logger.info("**Maximum Cinnamon version override found...**")
                self._max_cinnamon_version_override = config_data.get(
                    "max_cinnamon_version_override")

    def _modify_metadata(self):
        """Modify metadata.
        """
        self.logger.info("**Modifying xlet metadata...**")
        meta_path = os.path.join(self._xlet_data["destination"], "metadata.json")

        if self._dry_run:
            self.logger.log_dry_run("**The metadata for the '%s' xlet will be modified:**\n%s" %
                                    (self._xlet_data["slug"], meta_path))
        else:
            with open(meta_path, "r", encoding="UTF-8") as old:
                xlet_metadata = json.loads(old.read())

            supported_versions = supported_cinnamon_versions_range(
                self._min_cinnamon_version_override if self._min_cinnamon_version_override is not None
                else SUPPORTED_CINNAMON_VERSION_MIN,
                self._max_cinnamon_version_override if self._max_cinnamon_version_override is not None
                else SUPPORTED_CINNAMON_VERSION_MAX
            )

            xlet_metadata["cinnamon-version"] = supported_versions
            xlet_metadata["uuid"] = self._xlet_data["uuid"]
            xlet_metadata["website"] = URLS["repo"]
            xlet_metadata["url"] = URLS["repo"]

            with open(meta_path, "w", encoding="UTF-8") as new:
                json.dump(xlet_metadata, new, indent=4, ensure_ascii=False)

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
            self._xlet_data["type"] + "s",
            self._xlet_data["slug"]
        )

        if not file_utils.is_real_dir(extra_files_for_xlet):
            return

        self.logger.info("**Copying extra files into built xlet folder:**")

        if self._dry_run:
            self.logger.log_dry_run("**Files located at:**\n%s" % extra_files_for_xlet)
            self.logger.log_dry_run("**Destination:**\n%s" % self._xlet_data["destination"])
        else:
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
        """Install xlets .po files.

        Returns
        -------
        None
            Halt execution.
        """
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

            cmd = executable + " -i"

            if self._dry_run:
                self.logger.log_dry_run("**Command that will be executed:**\n%s" % cmd)
                self.logger.log_dry_run(
                    "**Command will be executed on directory:**\n%s" % self._xlet_data["destination"])
            else:
                cmd_utils.run_cmd(cmd,
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
    return [entry.name for entry in os.scandir(os.path.join(root_folder, xlet_type_subdir))
            if all((entry.is_dir(follow_symlinks=False),
                    not entry.name.startswith("0z"),
                    not entry.name.endswith("~"))
                   )]


def get_xlets_display_names():
    """Get xlets dirs.

    Returns
    -------
    list
        The list of xlets directory names prefixed with their "types".
    """
    applets_dirs = ["Applet %s" % item for item in _list_xlets_dirs("applets")]
    extensions_dirs = ["Extension %s" % item for item in _list_xlets_dirs("extensions")]

    return applets_dirs + extensions_dirs


def get_cinnamon_theme_stage_css_rule(font_family, font_size):
    """Get Cinnamon theme stage CSS rule.

    Parameters
    ----------
    font_family : str
        A valid value for the font-family CSS rule.
    font_size : str
        A valid value for the font-size CSS rule.

    Returns
    -------
    None/str
        A string representing the stage CSS rule or None.
    """
    family = "" if font_family == "unset"else "font-family: %s;" % font_family
    size = "" if font_size == "unset"else "font-size: %s;" % font_size

    if not family and not size:
        return None

    return "stage {%s%s}\n\n" % (family, size)


def build_themes(theme_name="", build_output="", do_not_confirm=False,
                 dry_run=False, logger=None, from_menu=False):
    """Build themes.

    Parameters
    ----------
    theme_name : str, optional
        The given name of the theme.
    build_output : str, optional
        Path to the destination folder were the built themes will be saved.
    do_not_confirm : bool, optional
        Whether to ask for overwrite confirmation when a theme destination exists or not.
    dry_run : bool, optional
        See :any:`XletBuilder`.
    logger : object
        See :any:`LogSystem`.
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
            "3": "4.0",
            "4": "4.2",
            "5": "4.4"
        },
        "gtk3_version": {
            "1": "3.18",
            "2": "3.22"
        },
        "do_not_confirm": {
            "1": False,
            "2": True
        },
        "dry_run": {
            "1": False,
            "2": True
        }
    }

    options_map_defaults = {
        "theme_name": theme_name,
        # Note: Check needed to avoid storing None.
        "build_output": build_output or "",
        "do_not_confirm": "2" if do_not_confirm else "1",
        "dry_run": "2" if dry_run else "1",
        "cinnamon_version": "1",
        "cinnamon_font_size": "10pt",
        "cinnamon_font_family": '"Noto Sans", sans, Sans-Serif',
        "gtk3_version": "1",
        "gtk3_csd_shadow": "0 2px 5px 0 alpha(black, 0.3), 0 0 0 1px darker(@theme_bg_color)",
        "gtk3_csd_backdrop_shadow": "0 2px 5px 0 alpha(black, 0.1), 0 0 0 1px darker(@theme_bg_color)",
    }

    interactive = True

    if o_m_l_v is not None and options_map_defaults != o_m_l_v:
        print_separator(logger)
        inform("Build data from a previous theme build found at:")
        logger.info("**%s**" % PATHS["theme_latest_build_data_file"], date=False, to_file=False)
        inform("Details:")
        logger.info(_theme_build_data.format(
            cinnamon_version=options_map["cinnamon_version"][
                o_m_l_v.get("cinnamon_version", options_map_defaults["cinnamon_version"])
            ],
            cinnamon_font_size=o_m_l_v.get("cinnamon_font_size",
                                           options_map_defaults["cinnamon_font_size"]),
            cinnamon_font_family=o_m_l_v.get("cinnamon_font_family",
                                             options_map_defaults["cinnamon_font_family"]),
            gtk3_version=options_map["gtk3_version"][
                o_m_l_v.get("gtk3_version", options_map_defaults["gtk3_version"])
            ],
            gtk3_csd_shadow=o_m_l_v.get("gtk3_csd_shadow",
                                        options_map_defaults["gtk3_csd_shadow"]),
            gtk3_csd_backdrop_shadow=o_m_l_v.get("gtk3_csd_backdrop_shadow",
                                                 options_map_defaults["gtk3_csd_backdrop_shadow"]),
            theme_name=o_m_l_v.get("theme_name",
                                   options_map_defaults["theme_name"]),
            build_output=o_m_l_v.get("build_output",
                                     options_map_defaults["build_output"]),
            do_not_confirm=str(not options_map["do_not_confirm"][
                o_m_l_v.get("do_not_confirm", options_map_defaults["do_not_confirm"])
            ]),
            dry_run=str(options_map["dry_run"][
                o_m_l_v.get("dry_run", options_map_defaults["dry_run"])
            ])
        ), date=False, to_file=False)
        print_separator(logger)
        inform("Choose an option:")
        question = "%s\n%s\n%s" % ("**1.** Use data interactively.",
                                   "**2.** Use data and directly build themes.",
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
        # Ask for Cinnamon theme version.
        print_separator(logger)
        inform("Choose in which Cinnamon version the theme will be used.")
        inform("1. 3.0.x to 3.2.x")
        inform("2. 3.4.x to 3.8.x")
        inform("3. 4.0.x")
        inform("4. 4.2.x")
        inform("5. 4.4.x plus")

        prompts.do_prompt(options_map_defaults,
                          "cinnamon_version",
                          "Enter an option",
                          options_map_defaults["cinnamon_version"],
                          validator=validate_options_1_to_5)

        # Ask for Cinnamon theme font size.
        print_separator(logger)
        inform("Set the Cinnamon theme font size.")
        inform("A valid value for the font-size CSS property.")

        prompts.do_prompt(options_map_defaults,
                          "cinnamon_font_size",
                          "Enter a value",
                          options_map_defaults["cinnamon_font_size"])

        # Ask for Cinnamon theme font family.
        print_separator(logger)
        inform("Set the Cinnamon theme font family.")
        inform("A valid value for the font-family CSS property.")

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
        inform("A valid value for the box-shadow CSS property.")
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
        inform("A valid value for the box-shadow CSS property.")
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
            options_map_defaults["do_not_confirm"] = "2"

        if ask_for_confirmation_options:
            # Ask for overwrite confirmation.
            print_separator(logger)
            inform("Choose what to do when a built theme already exists at the destination.")
            inform("1. Confirm each overwrite operation")
            inform("2. Directly overwrite existent themes")
            prompts.do_prompt(options_map_defaults,
                              "do_not_confirm",
                              "Enter option",
                              options_map_defaults["do_not_confirm"],
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

    if options_map_defaults["build_output"].startswith(get_base_temp_folder()) or \
            not options_map_defaults["build_output"]:
        options_map_defaults["build_output"] = os.path.join(
            get_base_temp_folder(),
            misc_utils.micro_to_milli(misc_utils.get_date_time("filename"))
        )

    themes_sources = os.path.join(root_folder, "themes")
    common_version_insensitive_files = os.path.join(
        themes_sources, "_common", "_version_insensitive")
    common_version_sensitive = os.path.join(themes_sources, "_common", "_version_sensitive")
    common_version_sensitive_cinnamon_files = os.path.join(
        common_version_sensitive, "cinnamon", theme_data["cinnamon_version"])
    common_version_sensitive_gtk3_files = os.path.join(
        common_version_sensitive, "gtk-3.0", theme_data["gtk3_version"])
    theme_variants = [entry.name for entry in os.scandir(
        os.path.join(themes_sources, "_variants")) if entry.is_dir(follow_symlinks=False)]
    strings_subst_extensions = (".css", ".svg", ".xml", ".json", ".rc",
                                "gtkrc", ".theme", ".ini")

    dry_run = options_map["dry_run"][options_map_defaults["dry_run"]]
    do_not_confirm = options_map["do_not_confirm"][options_map_defaults["do_not_confirm"]]
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
            if not do_not_confirm:
                logger.warning(_existent_xlet_destination_msg.format(path=destination_folder),
                               date=False)

            if do_not_confirm or prompts.confirm(prompt="Proceed?", response=False):
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

        logger.info("**Prepending data to Cinnamon theme...**")
        cinnamon_css = os.path.join(destination_folder, "cinnamon", "cinnamon.css")
        cinnamon_stage_css_rule = get_cinnamon_theme_stage_css_rule(
            theme_data["cinnamon_font_family"],
            theme_data["cinnamon_font_size"]
        )

        if os.path.exists(cinnamon_css) and cinnamon_stage_css_rule is not None:
            if dry_run:
                logger.log_dry_run("**File located at:**\n%s" % cinnamon_css)
            else:
                with open(cinnamon_css, "r+", encoding="UTF-8") as css_file:
                    css_file.seek(0)
                    css_file_content = css_file.readlines()
                    css_file.seek(0)
                    css_file.write(cinnamon_stage_css_rule)
                    css_file.writelines(css_file_content)
                    css_file.truncate()

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
        See :any:`LogSystem`.
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
            See :any:`LogSystem`.
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
        # Ignore until I finish them.
        os.path.join("__app__", "data", "python_modules", "xlets_settings", "GSettingsWidgets.py"),
        os.path.join("__app__", "data", "python_modules",
                     "xlets_settings", "z_MultiOptionsWidgets.py")
    ]

    base_apidoc_dest_path_rel_to_root = os.path.join("__app__", "cinnamon_tools_docs", "modules")

    apidoc_paths_rel_to_root = [
        (os.path.join("__app__", "python_modules"),
            os.path.join(base_apidoc_dest_path_rel_to_root, "python_modules")),
        (os.path.join("__app__", "data", "python_modules", "xlets_settings"),
            os.path.join(base_apidoc_dest_path_rel_to_root, "xlets_settings"))
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
        See :any:`LogSystem`.
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
    for xlet_dir_name in _list_xlets_dirs("applets") + _list_xlets_dirs("extensions"):
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
        See :any:`LogSystem`.
    """
    logger.info(shell_utils.get_cli_separator("-"), date=False, to_file=False)


def parse_sass(dry_run, logger):
    """Parse SASS.

    Parameters
    ----------
    dry_run : bool, optional
        See :any:`XletBuilder`.
    logger : object
        See :any:`LogSystem`.

    Raises
    ------
    SystemExit
        Halt execution.
    """
    if cmd_utils.which("sass"):
        cmd = ["sass"]
        cmd_arg_1 = "%s:%s"
        cmd_arg_2 = ["--no-source-map", "--style", "expanded"]
    elif cmd_utils.which("sassc"):
        cmd = ["sassc"]
        cmd_arg_1 = "%s %s"
        cmd_arg_2 = ["--style", "expanded"]
    else:
        logger.error("Missing sass command. Read documentation for requirements.")
        raise SystemExit(1)

    themes_folder = os.path.join(root_folder, "themes")

    files_to_remove = []
    sass_path = os.path.join(themes_folder, "_sass")
    variants_path = os.path.join(themes_folder, "_variants")
    template_file_path = os.path.join(sass_path, "cinnamon", "template.scss")
    variants = [entry.name for entry in os.scandir(
        variants_path) if entry.is_dir(follow_symlinks=False)]

    with open(template_file_path, "r", encoding="UTF-8") as template_file:
        template_data = template_file.read()

    for variant_name in variants:
        logger.info("**Attempting to parse SASS files for variant: %s**" % variant_name)
        variant_config_path = os.path.join(variants_path, variant_name, "config.py")

        if not os.path.exists(variant_config_path):
            logger.error(variant_name + " is not a valid folder for a theme variant.")
            continue

        try:
            variant_config = run_path(variant_config_path)["settings"]
        except Exception as err:
            logger.error("Error reading varian config file. Read documentation for usage.")
            logger.error(err)
            continue

        for cinnamon_version in _supported_cinnamon_theme_versions:
            logger.info("**Processing SASS files for Cinnamon version: %s**" % cinnamon_version)
            sass_file_path = os.path.join(sass_path, "cinnamon", "%s-%s.scss" %
                                          (variant_name, cinnamon_version))
            # NOTE: Replace the dot to be able to store an integer since I don't trust SASS comparisons.
            # In fact, I don't trust floats in any programming language in existence.
            # Also replace all placeholders including the double quotes to be able to store "raw data".
            sass_file_data = template_data.replace(
                '"@cinnamon_version@"', cinnamon_version.replace(".", ""))
            sass_file_data = sass_file_data.replace("@variant@", variant_name)
            sass_file_data = sass_file_data.replace(
                '"@selected_bg_color@"', variant_config["selected_bg_color"])
            sass_file_data = sass_file_data.replace(
                '"@warning_color@"', variant_config["warning_color"])
            sass_file_data = sass_file_data.replace(
                '"@error_color@"', variant_config["error_color"])
            sass_file_data = sass_file_data.replace(
                '"@link_color@"', variant_config["link_color"])

            if dry_run:
                logger.log_dry_run("**A template file will be created at:**\n%s" % sass_file_path)
            else:
                with open(sass_file_path, "w", encoding="UTF-8") as sass_file:
                    sass_file.write(sass_file_data)

            css_file_path = os.path.abspath(
                os.path.join(variants_path, variant_name, "_version_sensitive",
                             "cinnamon", cinnamon_version, "cinnamon.css"))

            if dry_run:
                logger.log_dry_run(
                    "**Parent directory will be created at:**\n%s" % os.path.dirname(css_file_path))
            else:
                os.makedirs(os.path.dirname(css_file_path), exist_ok=True)

            final_cmd = cmd + [cmd_arg_1 % (sass_file_path, css_file_path)] + cmd_arg_2

            if dry_run:
                logger.log_dry_run("**Command that will be executed:**\n%s" % " ".join(final_cmd))
                logger.log_dry_run(
                    "**Command will be executed on directory:**\n%s" % os.path.dirname(sass_file_path))
            else:
                cmd_utils.run_cmd(" ".join(final_cmd), stdout=None, stderr=None,
                                  cwd=os.path.dirname(sass_file_path), shell=True)

            files_to_remove.append(sass_file_path)

    logger.info("**Cleaning temporary files...**")

    if dry_run:
        logger.log_dry_run("**The following files will be removed:**\n%s" %
                           "\n".join(files_to_remove))
    else:
        for file_path in files_to_remove:
            os.remove(file_path)


def generate_repo_changelog(logger):
    """Generate repository changelog.

    Parameters
    ----------
    logger : object
        See :any:`LogSystem`-
    """
    xlets_list = AllXletsMetadata().meta_list
    all_xlets_slugs = [xlet["slug"] for xlet in xlets_list]
    log_path = os.path.join(root_folder, "CHANGELOG.md")

    try:
        with open(log_path, "w") as f:
            f.write(_changelog_header_repo)

        cmd = _git_log_cmd_repo.format(
            all_xlets_slugs="\\|".join(all_xlets_slugs),
            relative_xlet_path="./",
            append_or_override=">>",
            log_path=log_path,
            repo_url=URLS["repo"]
        )
        cmd_utils.run_cmd(cmd, stdout=None, stderr=None, cwd=root_folder, shell=True)
    except Exception as err:
        logger.error(err)


if __name__ == "__main__":
    pass
