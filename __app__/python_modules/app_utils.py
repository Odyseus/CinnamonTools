# -*- coding: utf-8 -*-
"""Module with utility functions and classes.

Attributes
----------
root_folder : str
    The main folder containing the application. All commands must be executed from this location
    without exceptions.
"""
import datetime
import json
import os

from shutil import copy2
from shutil import copytree
from shutil import rmtree

from .python_utils import cmd_utils
from .python_utils import file_utils
from .python_utils import misc_utils
from .python_utils import shell_utils
from .python_utils import string_utils
from .python_utils.ansi_colors import Ansi

from . import app_data

root_folder = os.path.realpath(os.path.abspath(os.path.join(
    os.path.normpath(os.path.join(os.path.dirname(__file__), *([os.pardir] * 2))))))


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
        if self.should_update():
            self.meta_list = generate_meta_file()
        else:
            with open(app_data.PATHS["all_xlets_meta_file"], "r", encoding="UTF-8") as xlets_metadata:
                self.meta_list = list(json.loads(xlets_metadata.read()))

    def should_update(self):
        """Should the xlets_metadata.json file be re-generated?

        Returns
        -------
        bool
            True if the file doesn't exists or if it's older than 24 hours.
        """
        if not os.path.exists(app_data.PATHS["all_xlets_meta_file"]):
            return True

        # NOTE: If time of last modification is more than 24 hours.
        # WARNING: Calling os.path.getmtime() on a non-existent file will raise an error.
        return round(datetime.datetime.utcnow().timestamp()) - \
            os.path.getmtime(app_data.PATHS["all_xlets_meta_file"]) > 86400


def list_xlets_dirs(xlet_type_subdir):
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
    return sorted([entry.name for entry in os.scandir(os.path.join(root_folder, xlet_type_subdir))
                   if all((entry.is_dir(follow_symlinks=False),
                           not entry.name.startswith("z_"),
                           not entry.name.endswith("~"))
                          )])


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

    applet_dirs = list_xlets_dirs("applets")
    exension_dirs = list_xlets_dirs("extensions")

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

            if f'/applets/{json_meta["slug"]}' in xlet_meta_path:
                json_meta["type"] = "applet"
            elif f'/extensions/{json_meta["slug"]}' in xlet_meta_path:
                json_meta["type"] = "extension"

            xlet_meta.append(json_meta)

    with open(app_data.PATHS["all_xlets_meta_file"], "w", encoding="UTF-8") as outfile:
        json.dump(xlet_meta, outfile, indent=4, ensure_ascii=False)

    if return_data:
        return xlet_meta


def supported_cinnamon_versions_range(start, stop):
    """Generate a list of Cinnamon versions.

    This generates a list of Cinnamon versions from a start version to an end version using only
    mayor and minor version numbers (floats) ignoring micro numbers.

    Parameters
    ----------
    start : float, int
        The start version number.
    stop : float, int
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


def restart_cinnamon():
    """Restart Cinnamon.
    """
    cmd_utils.run_cmd("nohup cinnamon --replace > /dev/null 2>&1 &",
                      stdout=None, stderr=None, shell=True)


def copy_help_pages_to_docs(logger):
    """Copy xlets help pages into built docs.

    Parameters
    ----------
    logger : LogSystem
        The logger.
    """
    logger.info("**Copying xlets help pages into docs folder...**")

    xlets_list = AllXletsMetadata().meta_list

    # NOTE: Copy only once the asset files into the root of the _static folder.
    for asset in app_data.COMMON_HELP_ASSETS:
        src = os.path.join(asset["source_path"], asset["file_name"])
        dst = os.path.join(app_data.PATHS["docs_built"], "_static",
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
        dest_path = os.path.join(app_data.PATHS["docs_built"], "_static",
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

    string_utils.do_string_substitutions(os.path.join(app_data.PATHS["docs_built"],
                                                      "_static", "xlets_help_pages"),
                                         replacement_data,
                                         allowed_extensions=(".html"),
                                         logger=logger)


def generate_repo_changelog(logger):
    """Generate repository changelog.

    Parameters
    ----------
    logger : LogSystem
        The logger.
    """
    xlets_list = AllXletsMetadata().meta_list
    all_xlets_slugs = [xlet["slug"] for xlet in xlets_list]
    log_path = os.path.join(root_folder, "CHANGELOG.md")

    try:
        with open(log_path, "w") as f:
            f.write(app_data.CHANGELOG_HEADER_REPO)

        cmd = app_data.GIT_LOG_CMD_REPO.format(
            all_xlets_slugs="\\|".join(all_xlets_slugs),
            relative_path="./",
            append_or_override=">>",
            log_path=log_path,
            repo_url=app_data.URLS["repo"]
        )
        cmd_utils.run_cmd(cmd, stdout=None, stderr=None, cwd=root_folder, shell=True)
        logger.info(f"**Changelog generated at:**\n{log_path}")
    except Exception as err:
        logger.error(err)


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
    logger : LogSystem, None, optional
        The logger.
    """
    from .python_utils import sphinx_docs_utils

    ignored_apidoc_modules = [
        os.path.join("__app__", "python_modules", "python_utils", "bottle.py"),
        os.path.join("__app__", "python_modules", "python_utils", "colour"),
        os.path.join("__app__", "python_modules", "python_utils", "diff_match_patch"),
        os.path.join("__app__", "python_modules", "python_utils", "docopt.py"),
        os.path.join("__app__", "python_modules", "python_utils", "jsonschema"),
        os.path.join("__app__", "python_modules", "python_utils", "mistune.py"),
        os.path.join("__app__", "python_modules", "python_utils", "polib.py"),
        os.path.join("__app__", "python_modules", "python_utils", "pyperclip"),
        os.path.join("__app__", "python_modules", "python_utils", "sublime_text_utils", "sublime_lib"),
        os.path.join("__app__", "python_modules", "python_utils", "svgelements"),
        os.path.join("__app__", "python_modules", "python_utils", "titlecase.py"),
        os.path.join("__app__", "python_modules", "python_utils", "tqdm"),
        os.path.join("__app__", "python_modules", "python_utils", "yaml"),
        # The following module has perfectly valid docstrings, but Sphinx is being a
        # b*tch and throws a million warnings for no reason.
        # Ignore it until Sphinx gets its sh*t together.
        os.path.join("__app__", "python_modules", "python_utils", "tqdm_wget.py"),
        # Ignore until I finish them.
        os.path.join("__app__", "data", "python_modules", "xlets_settings", "GSettingsWidgets.py"),
    ]

    base_apidoc_dest_path_rel_to_root = os.path.join("__app__", "cinnamon_tools_docs", "modules")

    apidoc_paths_rel_to_root = [
        (os.path.join("__app__", "python_modules"),
            os.path.join(base_apidoc_dest_path_rel_to_root, "python_modules")),
        (os.path.join("__app__", "data", "python_modules", "xlets_settings"),
            os.path.join(base_apidoc_dest_path_rel_to_root, "xlets_settings")),
        (os.path.join("__app__", "data", "python_modules", "file_chooser_dialog"),
            os.path.join(base_apidoc_dest_path_rel_to_root, "file_chooser_dialog"))
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


def get_base_temp_folder():
    """Get base temporary directory.

    Returns
    -------
    str
        Path to a temporary folder.
    """
    return os.path.join(misc_utils.get_system_tempdir(), "CinnamonToolsTemp")


def inform(msg):
    """Inform.

    Parameters
    ----------
    msg : str, list
        Message to display.
    """
    msg = "\n".join(msg) if isinstance(msg, list) else msg
    print(Ansi.LIGHT_MAGENTA(f"**{msg}**"))


def print_separator(logger, sep="-"):
    """Print separator.

    Parameters
    ----------
    logger : LogSystem
        The logger.
    sep : str, optional
        Separator character.
    """
    logger.info(shell_utils.get_cli_separator(sep), date=False, to_file=False)


if __name__ == "__main__":
    pass
