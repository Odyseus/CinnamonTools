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
"""

import json
import os

from shutil import copy2
from shutil import copytree
from shutil import ignore_patterns
from shutil import rmtree

from .python_utils import cmd_utils
from .python_utils import exceptions
from .python_utils import file_utils
from .python_utils import misc_utils
from .python_utils import prompts
from .python_utils import shell_utils
from .python_utils import string_utils
from .python_utils.ansi_colors import Ansi


root_folder = os.path.realpath(os.path.abspath(os.path.join(
    os.path.normpath(os.path.join(os.path.dirname(__file__), *([".."] * 2))))))

URLS = {
    "repo": "https://gitlab.com/Odyseus/CinnamonTools",
    "repo_pages": "https://odyseus.gitlab.io/CinnamonTools",
    "repo_docs": "https://odyseus.gitlab.io/cinnamon_tools_docs"
}

PATHS = {
    "docs_sources": os.path.join(root_folder, "__app__", "cinnamon_tools_docs"),
    "domain_storage_file": os.path.join(root_folder, "tmp", "domain_name"),
    "theme_name_storage_file": os.path.join(root_folder, "tmp", "theme_name"),
    "all_xlets_meta_file": os.path.join(root_folder, "tmp", "xlets_metadata.json"),
    "theme_latest_build_data_file": os.path.join(root_folder, "tmp", "theme_latest_default_data.json")
}

_missing_theme_or_domain_name_msg = """**{capital}NameNotSet:**

The command line option **--{lower}-name=<name>** should be used to define a {lower}
name for use when building {types}.

Or a file named **theme_name** should be created inside a folder named **tmp** at
the root of the repository whose only content should be the desired {lower} name.

The `--{lower}-name` command line option has precedence over the {lower} name found
inside the **{lower}_name** file.
"""

_existent_xlet_destination_msg = """**Destination folder exists!!!**
{path}

Choosing to proceed will completely remove the existent folder.
"""

_xlet_dir_ignored_patterns = [
    "__pycache__",
    "__data__",
    "*~",
    "*.bak",
    "*.pyc",
    "z_config.py",
    "z_create_localized_help.py",
]

_extra_common_files = [{
    "source_path": root_folder,
    "file_name": "LICENSE.md",
}, {
    "source_path": os.path.join(root_folder, "__app__", "data", "python_scripts"),
    "file_name": "helper.py",
}]

_readme_list_item_template = "- [{xlet_name}](%s/_static/xlets_help_pages/{xlet_slug}/index.html)" % (
    URLS["repo_docs"])

_theme_build_data = """
**Cinnamon version:**       {cinnamon_version}
**Cinnamon font size:**     {cinnamon_font_size}
**Cinnamon font family:**   {cinnamon_font_family}
**Gtk3 version:**           {gtk3_version}
**Theme name:**             {theme_name}
"""


class XletsHelperCore():
    """Xlets core functions.

    Attributes
    ----------
    logger : object
        See <class :any:`LogSystem`>.
    xlets_meta : dict
        The metadata of all xlets in this repository.
    """

    def __init__(self, logger=None):
        """Initialize.

        Parameters
        ----------
        logger : object
            See <class :any:`LogSystem`>.
        """
        self.logger = logger

        try:
            self.xlets_meta = AllXletsMetadata()
        except Exception:
            self.generate_meta_file()

    def generate_meta_file(self):
        """See :any:`generate_meta_file`
        """
        generate_meta_file()

    def create_changelogs(self):
        """Create change logs.

        Generate the CHANGELOG.md files for all xlets.
        """
        from . import changelog_handler

        self.logger.info("**Generating change logs...**")

        for xlet in self.xlets_meta.meta_list:
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

        for xlet in self.xlets_meta.meta_list:
            xlet_root_folder = file_utils.get_parent_dir(xlet["meta-path"], 0)

            self.logger.info(
                "**Updating localization template for %s...**" % xlet["name"])

            try:
                if not cmd_utils.which("make-cinnamon-xlet-pot-cli"):
                    print(Ansi.LIGHT_RED("**MissingCommand:** make-cinnamon-xlet-pot-cli command not found!!!"))
                    raise SystemExit()

                cmd = [
                    "make-cinnamon-xlet-pot-cli",
                    "--custom-header",
                    "--scan-additional-file=../../__app__/python_modules/localized_help_creator.py",
                    "--ignored-pattern=__data__/*"
                ]
                cmd_utils.run_cmd(cmd, stdout=None, stderr=None, cwd=xlet_root_folder)
            except Exception:
                continue

    def create_localized_help(self):
        """Create localized help.

        Execute the z_create_localized_help.py script for each xlet to generate their
        HELP.html files.
        """
        self.logger.info("**Starting localized help creation...**")

        applets_list_items = []
        extensions_list_items = []

        for xlet in self.xlets_meta.meta_list:
            xlet_root_folder = file_utils.get_parent_dir(xlet["meta-path"], 0)
            script_file_path = os.path.join(xlet_root_folder, "z_create_localized_help.py")

            if os.path.exists(script_file_path):
                self.logger.info("**Creating localized help for %s...**" % xlet["name"])
                cmd_utils.run_cmd([script_file_path], stdout=None,
                                  stderr=None, cwd=xlet_root_folder)

                # Store list items for later creating the README.md file.
                list_item = _readme_list_item_template.format(
                    xlet_name=xlet["name"],
                    xlet_slug=xlet["slug"]
                )

                if xlet["type"] == "applet":
                    applets_list_items.append(list_item)
                elif xlet["type"] == "extension":
                    extensions_list_items.append(list_item)

        self.logger.info("**Generating repository README.md file...**")

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
            print(Ansi.LIGHT_RED("**MissingCommand:** msgmerge command not found!!!"))
            raise SystemExit()

        markdown_content = ""
        po_tmp_storage = os.path.join(root_folder, "tmp", "po_files_updated")
        trans_stats_file = os.path.join(
            root_folder, "tmp", "po_files_untranslated_table.md")
        rmtree(po_tmp_storage, ignore_errors=True)
        os.makedirs(po_tmp_storage, exist_ok=True)

        for xlet in get_xlets_dirs():
            xlet_type, xlet_dir_name = xlet.split(" ")
            xlet_po_dir = os.path.join(
                root_folder, "%ss" % xlet_type.lower(), xlet_dir_name, "po")
            tmp_xlet_po_dir = os.path.join(
                po_tmp_storage, "%ss" % xlet_type.lower(), xlet_dir_name)
            os.makedirs(tmp_xlet_po_dir, exist_ok=True)

            if file_utils.is_real_dir(xlet_po_dir):
                xlet_po_list = file_utils.recursive_glob(xlet_po_dir, "*.po")

                if xlet_po_list:
                    self.logger.info("%s %s" %
                                     (xlet_type, xlet_dir_name), date=False)
                    markdown_content += "\n### %s %s\n" % (
                        xlet_type, xlet_dir_name)
                    markdown_content += "\n"
                    markdown_content += "|LANGUAGE|UNTRANSLATED|\n"
                    markdown_content += "|--------|------------|\n"

                    for po_file_path in xlet_po_list:
                        po_base_name = os.path.basename(po_file_path)
                        tmp_po_file_path = os.path.join(tmp_xlet_po_dir, po_base_name)
                        tmp_pot_file_path = os.path.join(xlet_po_dir, "%s.pot" % xlet_dir_name)

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
            print(Ansi.LIGHT_RED("**MissingCommand:** msgmerge command not found!!!"))
            raise SystemExit()

        for xlet in get_xlets_dirs():
            xlet_type, xlet_dir_name = xlet.split(" ")
            po_dir = os.path.join(root_folder, "%ss" %
                                  xlet_type.lower(), xlet_dir_name, "po")
            po_file = os.path.join(po_dir, "es.po")

            if file_utils.is_real_dir(po_dir) and file_utils.is_real_file(po_file):
                self.logger.info("**Updating localization for %s**" % xlet_dir_name)

                if cmd_utils.run_cmd([
                    "msgmerge",
                    "--no-fuzzy-matching",      # Do not use fuzzy matching.
                    "--previous",               # Keep previous msgids of translated messages.
                    "--backup=off",             # Never make backups.
                    "--update",                 # Update .po file, do nothing if up to date.
                    "es.po",                    # The .po file to update.
                    "%s.pot" % xlet_dir_name    # The template file to update from.
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
        try:
            if not os.path.exists(PATHS["all_xlets_meta_file"]):
                generate_meta_file()
        finally:
            with open(PATHS["all_xlets_meta_file"], "r", encoding="UTF-8") as xlets_metadata:
                self.meta_list = list(json.loads(xlets_metadata.read()))


def generate_meta_file():
    """Generate the file containing all the metadata of all xlets on this repository.
    This metadata file is used by several functions on the XletsHelperCore class.
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

            if "/applets/" in xlet_meta_files[i]:
                json_meta["type"] = "applet"
            elif "/extensions/" in xlet_meta_files[i]:
                json_meta["type"] = "extension"

            xlet_meta.append(json_meta)

    with open(PATHS["all_xlets_meta_file"], "w", encoding="UTF-8") as outfile:
        json.dump(xlet_meta, outfile, indent=4, ensure_ascii=False)


def build_xlets(xlets=[], domain_name=None, build_output="", do_not_cofirm=False,
                dry_run=False, logger=None, from_menu=False):
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
    options_map_defaults = {
        "domain_name": "domain.com"
    }

    if not domain_name:
        try:
            with open(PATHS["domain_storage_file"], "r", encoding="UTF-8") as domain_file:
                domain_name = domain_file.read().strip()
        except Exception:
            domain_name = False

    if not domain_name:
        inform("\nEnter a domain name:")
        prompts.do_prompt(options_map_defaults, "domain_name",
                          "Enter name", options_map_defaults["domain_name"])
        domain_name = options_map_defaults["domain_name"].strip()

    # TODO:
    # Implement a "domain name validator" function.
    if not domain_name:
        # Message from the raised exception isn't printed when this function
        # is executed from the CLI menu.
        # So, print the message explicitly.
        print(Ansi.LIGHT_YELLOW(_missing_theme_or_domain_name_msg.format(capital="Domain",
                                                                         lower="domain",
                                                                         types="xlets")))
        raise SystemExit()

    if not build_output:
        base_output_path = os.path.join(get_base_temp_folder(),
                                        misc_utils.micro_to_milli(misc_utils.get_date_time("filename")))
    else:
        base_output_path = build_output

    all_xlets = get_xlets_dirs()

    xlets_data = []

    if xlets:
        for x in xlets:
            if x in all_xlets:
                xlet_type, xlet_dir_name = x.split(" ")
                uuid = "%s@%s" % (xlet_dir_name, domain_name)
                xlets_data.append({
                    "uuid": uuid,
                    "type": xlet_type.lower(),
                    "slug": xlet_dir_name,
                    "source": os.path.join(root_folder, "%ss" % xlet_type.lower(), xlet_dir_name),
                    "destination": os.path.join(base_output_path, "%ss" % xlet_type.lower(), uuid),
                })
            else:
                logger.warning("**%s doesn't exists.**" % x)

    if xlets_data:
        for data in xlets_data:
            builder = XletBuilder(data, do_not_cofirm=do_not_cofirm, dry_run=dry_run, logger=logger)
            builder.build()

    print("")
    logger.info("**Built xlets saved at:**\n%s" % base_output_path)


class XletBuilder():
    """XletBuilder class.

    Attributes
    ----------
    logger : object
        See <class :any:`LogSystem`>.
    """

    def __init__(self, xlet_data, do_not_cofirm=False, dry_run=False, logger=None):
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
        self._dry_run = dry_run
        self.logger = logger

        self._schemas_dir = os.path.join(xlet_data["destination"], "schemas")
        self._config_file = os.path.join(xlet_data["source"], "z_config.py")
        self._replacement_data = [
            ("{{UUID}}", xlet_data.get("uuid", "")),
            ("{{REPO_URL}}", URLS["repo"]),
            ("{{XLET_TYPE}}", xlet_data.get("type", "")),
            # Yes, include the escaped double quotes to keep the template file without errors.
            # The replacement data will be a "Python boolean" (True or False).
            ("\"{{XLET_HAS_SCHEMA}}\"", "True" if file_utils.is_real_dir(self._schemas_dir) else "False"),
        ]

    def build(self):
        """Build xlet.
        """
        self.logger.info(shell_utils.get_cli_separator("#"), date=False)
        self.logger.info("**Building the %s %s**" %
                         (self._xlet_data["type"], self._xlet_data["slug"]))

        self._do_copy()

        if self._dry_run:
            self.logger.log_dry_run("**String substitutions will be performed at:**\n%s" %
                                    self._xlet_data["destination"])
        else:
            string_utils.do_string_substitutions(self._xlet_data["destination"],
                                                 self._replacement_data,
                                                 logger=self.logger)
        self._compile_schemas()
        self._handle_config_file()
        self._set_executable()

    def _do_copy(self):
        """Copy xlet files into its final destination.

        Raises
        ------
        exceptions.InvalidDestination
            Invalid xlet destination.
        exceptions.OperationAborted
            Halt build operation.
        """
        if file_utils.is_real_file(self._xlet_data["destination"]):
            raise exceptions.InvalidDestination(
                "Destination exists and is a file!!! Aborted!!!")

        if file_utils.is_real_dir(self._xlet_data["destination"]):
            if not self._do_not_cofirm:
                print(Ansi.LIGHT_YELLOW(_existent_xlet_destination_msg.format(
                    path=self._xlet_data["destination"])))

            if self._do_not_cofirm or prompts.confirm(prompt="Proceed?", response=False):
                if self._dry_run:
                    self.logger.log_dry_run("**Destination will be eradicated:**\n%s" %
                                            self._xlet_data["destination"])
                else:
                    rmtree(self._xlet_data["destination"], ignore_errors=True)
            else:
                raise exceptions.OperationAborted("Building the %s %s was canceled." %
                                                  (self._xlet_data["type"], self._xlet_data["slug"]))

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
            dst = os.path.join(self._xlet_data["destination"], extra["file_name"])

            if self._dry_run:
                self.logger.log_dry_run("**Source:** %s" % src)
                self.logger.log_dry_run("**Will be copied into:** %s" % dst)
            else:
                copy2(src, dst)

    def _compile_schemas(self):
        """Compile schemas file if any.
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

    def _handle_config_file(self):
        """Handle xlet configuration file if any.
        """
        if os.path.exists(self._config_file):
            from runpy import run_path
            extra_settings = run_path(self._config_file)["settings"]

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


def validate_cinn_theme_options(x):
    """Validate themes options.

    Parameters
    ----------
    x : str
        The entered option to validate.

    Returns
    -------
    str
        The validated option.

    Raises
    ------
    exceptions.ValidationError
        Halt execution if option is not valid.
    """
    if not x or x not in ["1", "2", "3"]:
        raise exceptions.ValidationError('Possible options are "1", "2" or "3".')

    return x


def validate_gtk3_theme_options(x):
    """Validate themes options.

    Parameters
    ----------
    x : str
        The entered option to validate.

    Returns
    -------
    str
        The validated option.

    Raises
    ------
    exceptions.ValidationError
        Halt execution if option is not valid.
    """
    if not x or x not in ["1", "2"]:
        raise exceptions.ValidationError('Possible options are "1" or "2".')

    return x


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
    try:
        with open(PATHS["theme_latest_build_data_file"], "r", encoding="UTF-8") as f:
            o_m_l_v = json.loads(f.read())
    except Exception:
        o_m_l_v = None

    options_map = {
        "cinnamon_version": {
            "1": "3.0",
            "2": "3.4",
            "3": "4.0"
        },
        "gtk3_version": {
            "1": "3.18",
            "2": "3.22"
        }
    }

    # __version__ is used to verify that the stored data is compatible with the
    # default data used when generating themes.
    options_map_defaults = {
        "__version__": "1",
        "theme_name": "MyThemeName",
        "cinnamon_version": "1",
        "cinnamon_font_size": "9pt",
        "cinnamon_font_family": '"Noto Sans", sans, Sans-Serif',
        "gtk3_version": "1"
    }

    interactive = True

    # o_m_l_v a.k.a. options_map_latest_used_values
    if o_m_l_v is not None and options_map_defaults != o_m_l_v and \
            options_map_defaults["__version__"] == o_m_l_v.get("__version__"):
        inform("Build data from a previous theme build found at:")
        logger.info("**%s**" % PATHS["theme_latest_build_data_file"], date=False, to_file=False)
        inform("Details:")
        print(Ansi.DEFAULT(_theme_build_data.format(
            cinnamon_version=options_map["cinnamon_version"][o_m_l_v["cinnamon_version"]],
            cinnamon_font_size=o_m_l_v["cinnamon_font_size"],
            cinnamon_font_family=o_m_l_v["cinnamon_font_family"],
            gtk3_version=options_map["gtk3_version"][o_m_l_v["gtk3_version"]],
            theme_name=o_m_l_v["theme_name"],
        )))
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
        inform("Choose in which Cinnamon version the theme will be used.")
        inform("1. 3.0.x to 3.2.x (Default)")
        inform("2. 3.4.x to 3.8.x")
        inform("3. 4.0.x plus")

        prompts.do_prompt(options_map_defaults,
                          "cinnamon_version",
                          "Enter an option",
                          options_map_defaults["cinnamon_version"],
                          validator=validate_cinn_theme_options)

        # Ask for Cinnamon theme font size.
        inform("Set the Cinnamon theme font size.")

        prompts.do_prompt(options_map_defaults,
                          "cinnamon_font_size",
                          "Enter a value",
                          options_map_defaults["cinnamon_font_size"])

        # Ask for Cinnamon theme font family.
        inform("Set the Cinnamon theme font family.")

        prompts.do_prompt(options_map_defaults,
                          "cinnamon_font_family",
                          "Enter a value",
                          options_map_defaults["cinnamon_font_family"])

        # Ask for Gtk3 theme version.
        inform("Choose in which Gtk+ version the theme will be used.")
        inform("1. 3.18.x (Default)")
        inform("2. 3.22.x")

        prompts.do_prompt(options_map_defaults,
                          "gtk3_version",
                          "Enter an option",
                          options_map_defaults["gtk3_version"],
                          validator=validate_gtk3_theme_options)

    theme_data = {
        "cinnamon_version": options_map["cinnamon_version"][options_map_defaults["cinnamon_version"]],
        "cinnamon_font_size": options_map_defaults["cinnamon_font_size"],
        "cinnamon_font_family": options_map_defaults["cinnamon_font_family"],
        "gtk3_version": options_map["gtk3_version"][options_map_defaults["gtk3_version"]]
    }

    if interactive:
        if theme_name:
            options_map_defaults["theme_name"] = theme_name
        else:
            try:
                with open(PATHS["theme_name_storage_file"], "r", encoding="UTF-8") as theme_file:
                    options_map_defaults["theme_name"] = theme_file.read().strip()
            except Exception:
                pass

        inform("Enter a name for the theme:")
        prompts.do_prompt(options_map_defaults,
                          "theme_name",
                          "Enter name",
                          options_map_defaults["theme_name"])

    if not options_map_defaults["theme_name"].strip():
        print(Ansi.LIGHT_YELLOW(_missing_theme_or_domain_name_msg.format(capital="Theme",
                                                                         lower="theme",
                                                                         types="themes")))
        raise SystemExit()

    if not build_output:
        base_output_path = os.path.join(get_base_temp_folder(),
                                        misc_utils.micro_to_milli(misc_utils.get_date_time("filename")))
    else:
        base_output_path = build_output

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

    for variant in theme_variants:
        logger.info(shell_utils.get_cli_separator("-"), date=False)
        logger.info("**Generating variant:** %s" % variant)

        full_theme_name = "%s-%s" % (options_map_defaults["theme_name"].strip(), variant)

        destination_folder = os.path.join(base_output_path, full_theme_name)

        if file_utils.is_real_file(destination_folder):
            print(Ansi.LIGHT_RED("**InvalidDestination:** Destination exists and is a file!!! Aborted!!!"))
            raise SystemExit()

        if file_utils.is_real_dir(destination_folder):
            if not do_not_cofirm:
                print(Ansi.LIGHT_YELLOW(_existent_xlet_destination_msg.format(path=destination_folder)))

            if do_not_cofirm or prompts.confirm(prompt="Proceed?", response=False):
                if dry_run:
                    logger.log_dry_run("**Destination will be eradicated:**\n%s" %
                                       destination_folder)
                else:
                    rmtree(destination_folder, ignore_errors=True)
            else:
                print(Ansi.LIGHT_RED("**OperationAborted:** The theme building process was canceled."))
                raise SystemExit()

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

        logger.success("**Theme variant %s successfully built.**" % variant)

    print("")
    logger.info("**Built themes saved at %s**" % base_output_path)

    if dry_run:
        logger.log_dry_run("**Theme build data will be saved at:**\n%s" %
                           PATHS["theme_latest_build_data_file"])
    else:
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
            raise SystemExit()

        inform("\nEnter a description for the xlet:")
        prompts.do_prompt(prompt_data, "description",
                          "Enter description", prompt_data["description"])
        self.xlet_data["description"] = prompt_data["description"]

        if self.xlet_data["type"] != "extension":
            inform("\nEnter max instances for the xlet:")
            prompts.do_prompt(prompt_data, "max_instances",
                              "Enter description", prompt_data["max_instances"])
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


if __name__ == "__main__":
    pass
