# -*- coding: utf-8 -*-
"""
Attributes
----------
CHANGELOG_HEADER_REPO : str
    Base Markdown template for the repository's CHANGELOG.md file.
CHANGELOG_HEADER_THEMES : str
    Base Markdown template for the theme's CHANGELOG.md file.
CHANGELOG_HEADER_XLETS : str
    Base Markdown template for the xlets's CHANGELOG.md file.
COMMON_HELP_ASSETS : list
    Common files needed to render the HELP.html file for xlets.
EXISTENT_XLET_DESTINATION_MSG : str
    Message displayed when a build xlet/theme task tries to copy files into an existent location.
EXTRA_COMMON_FILES : list
    Extra common files that need to be copied into an xlet folder at build time.
GIT_LOG_CMD_REPO : str
    Command to generate the repository's CHANGELOG.md file.
GIT_LOG_CMD_THEMES : str
    Command to generate the theme's CHANGELOG.md file.
GIT_LOG_CMD_XLETS : str
    Command to generate the xlets' CHANGELOG.md file.
LOCALIZED_STRINGS : dict
    Localized strings storage.
MISSING_THEME_OR_DOMAIN_NAME_MSG : str
    Message used to inform of a missing theme or domain name when building themes/xlets.
PATHS : dict
    Paths storage.
PYTHON_SHEBANGS : dict
    Different shebangs for development and distribution.
README_LIST_ITEM_TEMPLATE : str
    Template used to create links to each xlet help page inside the repository's README.md file.
root_folder : str
    The main folder containing the application. All commands must be executed from this location
    without exceptions.
SUPPORTED_CINNAMON_VERSION_MAX : float
    Maximum Cinnamon version number.
SUPPORTED_CINNAMON_VERSION_MIN : float
    Minimum Cinnamon version number.
THEME_BOOLEAN_DEFINITIONS : dict
    Theme building data.
THEME_BUILD_DATA : str
    The template used to display theme's latest used values from a previous build task.
THEME_CSS_DEFINITIONS : list
    Theme building data.
THEME_SASS_PARSING_DATA : list
    Theme building data.
URLS : dict
    URLs storage.
XLET_DIR_IGNORED_PATTERNS : list
    A list of file patterns to ignore when building xlets.
XLET_EXEC_FILES : list
    Common files that need to be set as executables.
XLET_EXTRA_FILES_IGNORED_PATTERNS : list
    A list of file patterns to ignore from the path declared when passing the --extra-files
    CLI argument at xlets build time.
XLET_MODULES_MAP : dict
    A mapping of module names.
XLETS_BUILD_DATA : str
    The template used to display xlets' latest used values from a previous build task.
"""
import os

from .python_utils import file_utils

root_folder = os.path.realpath(os.path.abspath(os.path.join(
    os.path.normpath(os.path.join(os.path.dirname(__file__), *([os.pardir] * 2))))))

SUPPORTED_CINNAMON_VERSION_MIN = 5.0

SUPPORTED_CINNAMON_VERSION_MAX = 7.0

PYTHON_SHEBANGS = {
    "dev": "#!/usr/bin/env python3",
    "dist": "#!/usr/bin/python3"
}

THEME_CSS_DEFINITIONS = [
    ('"@csd_shadow_definition@"',
     "0 3px 5px @csd_shadow_spread@px rgba(0, 0, 0, @csd_shadow_opacity@)"),
    ('"@csd_backdrop_shadow_definition@"',
     "0 3px 5px @csd_backdrop_shadow_spread@px rgba(0, 0, 0, @csd_backdrop_shadow_opacity@)"),
    ('"@popover_shadow_definition@"',
     "0 1px 2px @popover_shadow_spread@px rgba(0, 0, 0, @popover_shadow_opacity@)"),
    ('"@undershoots_tb_back_image_definition@"',
     "linear-gradient(to left, rgba(255, 255, 255, @undershoots_opacity@) 50%, rgba(0, 0, 0, @undershoots_opacity@) 50%)"),
    ('"@undershoots_lr_back_image_definition@"',
     "linear-gradient(to top, rgba(255, 255, 255, @undershoots_opacity@) 50%, rgba(0, 0, 0, @undershoots_opacity@) 50%)"),
    ('"@undershoots_padding_definition@"',
     "@undershoots_distance@px"),
    ('"@tooltip_border_definition@"',
     '1px solid "@tooltip_border_rgba_color@"'),
]

THEME_BOOLEAN_DEFINITIONS = {
    "display_gtk_2_scrollbar_arrows": {
        True: 'include "styles/display-scrollbar-arrows.rc"',
        False: ""
    },
    "display_gtk_3_scrollbar_arrows": {
        True: "1",
        False: "0"
    }
}

THEME_SASS_PARSING_DATA = [{
    "name": "Cinnamon",
    "versions": ["5.0"],
    "version_sensitive": True,
    "sass_folder": "cinnamon",
    "destination_folder": "cinnamon",
    "cssfile": "cinnamon.css",
    "thumb_size": "120x80"
}, {
    "name": "Gtk 3",
    "versions": ["3.24"],
    "version_sensitive": True,
    "sass_folder": "gtk",
    "destination_folder": "gtk-3.0",
    "cssfile": "gtk-contained.css",
    "thumb_size": "120x35"
}, {
    "name": "Gtk 4",
    "versions": ["4.0"],
    "version_sensitive": True,
    "sass_folder": "gtk",
    "destination_folder": "gtk-4.0",
    "cssfile": "gtk-contained.css",
    "thumb_size": "120x35"
}]

URLS = {
    "repo": "https://gitlab.com/Odyseus/CinnamonTools",
    "repo_docs": "https://odyseus.gitlab.io/cinnamon_tools_docs"
}

PATHS = {
    "xlets_install_location": file_utils.expand_path(os.path.join("~", ".local", "share", "cinnamon")),
    "js_modules": os.path.join(root_folder, "__app__", "data", "javascript_modules"),
    "docs_sources": os.path.join(root_folder, "__app__", "cinnamon_tools_docs"),
    "docs_built": os.path.join(root_folder, "__app__", "cinnamon_tools_docs", "docs"),
    "domain_storage_file": os.path.join(root_folder, "tmp", "domain_name"),
    "theme_name_storage_file": os.path.join(root_folder, "tmp", "theme_name"),
    "all_xlets_meta_file": os.path.join(root_folder, "tmp", "xlets_metadata.json"),
    "themes_folder": os.path.join(root_folder, "themes"),
    "themes_variants_folder": os.path.join(root_folder, "themes", "_variants"),
    "theme_latest_build_data_file": os.path.join(root_folder, "tmp", "theme_latest_default_data.json"),
    "xlets_latest_build_data_file": os.path.join(root_folder, "tmp", "xlets_latest_default_data.json")
}

XLET_MODULES_MAP = {
    "javascript_modules": "js_modules",
    "python_modules": "python_modules"
}

XLET_EXEC_FILES = [
    "appletHelper.py",
    "extensionHelper.py",
    "file_chooser_dialog.py",
    "helper.py",
    "python_modules/html_tags_stripper.py",
    "settings.py",
]

MISSING_THEME_OR_DOMAIN_NAME_MSG = """**{capital}NameNotSet:**

The command line option **--{lower}-name=<name>** should be used to define a {lower}
name for use when building {types}.

Or a file named **{lower}_name** should be created inside a folder named **tmp** at
the root of the repository whose only content should be the desired {lower} name.

The `--{lower}-name` command line option has precedence over the {lower} name found
inside the **{lower}_name** file.
"""

EXISTENT_XLET_DESTINATION_MSG = """**Destination folder exists!!!**
{path}

Choosing to proceed will completely remove the existent folder.
"""

XLET_DIR_IGNORED_PATTERNS = [
    "__pycache__",
    "__data__",
    "*~",
    "*.bak",
    "*.pyc",
    "z_*"
]

XLET_EXTRA_FILES_IGNORED_PATTERNS = [
    "*.js",
    "*.py",
    "*.xml",
    "*.pot",
    "*.json"
]

EXTRA_COMMON_FILES = [{
    "source_path": root_folder,
    "file_name": "LICENSE.md",
}, {
    "source_path": os.path.join(root_folder, "__app__", "data", "python_scripts"),
    "file_name": "helper.py",
}, {
    "source_path": os.path.join(root_folder, "__app__", "data", "html_assets", "js"),
    "destination_path": "assets/js",
    "file_name": "main.js",
    "depends_on": "HELP.html",
}, {
    "source_path": os.path.join(root_folder, "__app__", "data", "html_assets", "css"),
    "destination_path": "assets/css",
    "file_name": "bootstrap-tweaks.css",
    "depends_on": "HELP.html",
}, {
    "source_path": os.path.join(root_folder, "__app__", "data", "html_assets", "css"),
    "destination_path": "assets/css",
    "file_name": "bootstrap.min.css",
    "depends_on": "HELP.html",
}]

COMMON_HELP_ASSETS = [{
    "source_path": os.path.join(root_folder, "__app__", "data", "html_assets", "js"),
    "destination_path": "js",
    "file_name": "main.js"
}, {
    "source_path": os.path.join(root_folder, "__app__", "data", "html_assets", "css"),
    "destination_path": "css",
    "file_name": "bootstrap-tweaks.css"
}, {
    "source_path": os.path.join(root_folder, "__app__", "data", "html_assets", "css"),
    "destination_path": "css",
    "file_name": "bootstrap.min.css"
}]

README_LIST_ITEM_TEMPLATE = f'- [{{xlet_name}}]({URLS["repo_docs"]}/_static/xlets_help_pages/{{xlet_slug}}/index.html)'

THEME_BUILD_DATA = """
**Theme name:**                  {theme_name}
**Cinnamon version:**            {cinnamon_version}
**Gtk3 version:**                {gtk3_version}
**Gtk4 version:**                {gtk4_version}
**Output directory:**            {build_output}
**Ask overwrite confirmation:**  {do_not_confirm}
"""

XLETS_BUILD_DATA = """
**Domain name:**                 {domain_name}
**Output directory:**            {build_output}
**Install localizations:**       {install_localizations}
**Extra files from:**            {extra_files}
**Ask overwrite confirmation:**  {do_not_confirm}
"""

GIT_LOG_CMD_XLETS = 'git log --grep={xlet_slug} --pretty=format:"\
**Date:** %aD<br/>%n\
**Commit:** [%h]({repo_url}/commit/%h)<br/>%n\
**Author:** %aN<br/>%n%n%b%n***%n" \
-- {relative_path} {append_or_override} "{log_path}"'

CHANGELOG_HEADER_XLETS = """## {xlet_name} changelogs

**These change logs are only valid for the version of the xlet hosted on [its original repository]({repo_url}).**

***

"""

# NOTE: Making 'git log' ignore changes for certain paths: https://stackoverflow.com/a/21079437
GIT_LOG_CMD_REPO = 'git log --since="2021-01-10" --no-merges --grep="Squashed \\|{all_xlets_slugs}" --invert-grep --pretty=format:"\
**Date:** %aD<br/>%n\
**Commit:** [%h]({repo_url}/commit/%h)<br/>%n\
**Author:** %aN<br/>%n%n### %B%n***%n" \
-- {relative_path} ":(exclude)themes" {append_or_override} "{log_path}"'

CHANGELOG_HEADER_REPO = """## Repository changelog

**The changelogs for xlets can be found inside each xlet folder and/or in their help pages. The changelog for themes can be found inside the *themes* folder.**

***

"""

GIT_LOG_CMD_THEMES = 'git log --grep="General" --invert-grep --pretty=format:"\
**Date:** %aD<br/>%n\
**Commit:** [%h]({repo_url}/commit/%h)<br/>%n\
**Author:** %aN<br/>%n%n%b%n***%n" \
-- {relative_path} ":(exclude)themes/CHANGELOG.md" {append_or_override} "{log_path}"'

CHANGELOG_HEADER_THEMES = """## Themes changelog

***

"""


def _(aStr):
    """Dummy function used to be able to declare calls to the gettext _() function.

    Parameters
    ----------
    aStr : str
        String.

    Returns
    -------
    str
        String.
    """
    return aStr


LOCALIZED_STRINGS = {
    "metadata-contributors": _("See this xlet help file."),
    "metadata-comments": _("Bug reports, feature requests and contributions should be done on this xlet's repository linked next.")
}


if __name__ == "__main__":
    pass
