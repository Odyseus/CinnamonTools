#!/usr/bin/python3
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
IMPORT_JS_FUNCTION : str
    A JavaScript function used to import JS modules from inside xlets files.
MISSING_THEME_OR_DOMAIN_NAME_MSG : str
    Message used to inform of a missing theme or domain name when building themes/xlets.
PATHS : dict
    Paths storage.
README_LIST_ITEM_TEMPLATE : str
    Template used to create links to each xlet help page inside the repository's README.md file.
root_folder : str
    The main folder containing the application. All commands must be executed from this location
    without exceptions.
SETTINGS_FRAMEWORK_ADDITIONAL_FILES_TO_SCAN : list
    A list of CLI arguments with relative paths to the xlets custom settings framework.
SUPPORTED_CINNAMON_THEME_VERSIONS : list
    A list of Cinnamon versions used when parsing |Sass| sources.
SUPPORTED_CINNAMON_VERSION_MAX : float
    Maximum Cinnamon version number.
SUPPORTED_CINNAMON_VERSION_MIN : float
    Minimum Cinnamon version number.
THEME_BUILD_DATA : str
    The template used to display theme's latest used values from a previous build task.
URLS : dict
    URLs storage.
XLET_DIR_IGNORED_PATTERNS : list
    A list of file patterns to ignore when building xlets.
XLET_EXTRA_FILES_IGNORED_PATTERNS : list
    A list of file patterns to ignore from the path declared when passing the --extra-files
    CLI argument at xlets build time.
XLET_META : dict
    Xlet meta type.
XLET_SYSTEM : dict
    Xlet system type.
XLETS_BUILD_DATA : str
    The template used to display xlets' latest used values from a previous build task.
"""
import os

from .python_utils import file_utils

root_folder = os.path.realpath(os.path.abspath(os.path.join(
    os.path.normpath(os.path.join(os.path.dirname(__file__), *([".."] * 2))))))

SUPPORTED_CINNAMON_VERSION_MIN = 3.0

SUPPORTED_CINNAMON_VERSION_MAX = 7.0

URLS = {
    "repo": "https://gitlab.com/Odyseus/CinnamonTools",
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

IMPORT_JS_FUNCTION = """function __import(aModule) {
    // WARNING: Only use this function to import files directly placed inside the xlet folder,
    // not inside a sub folder.
    return typeof require === "function" ?
        require("./" + aModule) :
        imports.ui["{{XLET_SYSTEM}}"]["{{XLET_TYPE}}s"]["{{UUID}}"][aModule.slice(0, -3)];
}
"""

SUPPORTED_CINNAMON_THEME_VERSIONS = [
    "3.0",
    "3.4",
    "4.0",
    "4.2",
    "4.4"
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
    "file_name": "bootstrap.min.css",
    "depends_on": "HELP.html",
}]

COMMON_HELP_ASSETS = [{
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
    "file_name": "bootstrap.min.css"
}]

SETTINGS_FRAMEWORK_ADDITIONAL_FILES_TO_SCAN = [
    "--scan-additional-file=../../__app__/data/python_modules/xlets_settings/__init__.py",
    "--scan-additional-file=../../__app__/data/python_modules/xlets_settings/SettingsWidgets.py",
    "--scan-additional-file=../../__app__/data/python_modules/xlets_settings/TreeListWidgets.py",
    "--scan-additional-file=../../__app__/data/python_modules/xlets_settings/IconChooserWidgets.py",
    "--scan-additional-file=../../__app__/data/python_modules/xlets_settings/AppChooserWidgets.py"
]

README_LIST_ITEM_TEMPLATE = "- [{xlet_name}](%s/_static/xlets_help_pages/{xlet_slug}/index.html)" % (
    URLS["repo_docs"])

THEME_BUILD_DATA = """
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

XLETS_BUILD_DATA = """
**Domain name:**                 {domain_name}
**Output directory:**            {build_output}
**Install localizations:**       {install_localizations}
**Extra files from:**            {extra_files}
**Ask overwrite confirmation:**  {do_not_confirm}
**Dry run:**                     {dry_run}
"""

GIT_LOG_CMD_XLETS = 'git log --grep={xlet_slug} --pretty=format:"\
**Date:** %aD<br/>%n\
**Commit:** [%h]({repo_url}/commit/%h)<br/>%n\
**Author:** %aN<br/>%n%n%b%n***%n" \
-- {relative_path} {append_or_override} "{log_path}"'

CHANGELOG_HEADER_XLETS = """## {xlet_name} changelog

**This change log is only valid for the version of the xlet hosted on [its original repository]({repo_url}).**

***

"""

# NOTE: Making 'git log' ignore changes for certain paths: https://stackoverflow.com/a/21079437
GIT_LOG_CMD_REPO = 'git log --no-merges --grep="{all_xlets_slugs}" --invert-grep --pretty=format:"\
**Date:** %aD<br/>%n\
**Commit:** [%h]({repo_url}/commit/%h)<br/>%n\
**Author:** %aN<br/>%n%n#### %B%n***%n" \
-- {relative_path} ":(exclude)themes" {append_or_override} "{log_path}"'

CHANGELOG_HEADER_REPO = """## Repository changelog

**The changelogs for xlets can be found inside each xlet folder and/or in their help pages. The changelog for themes can be found inside the *themes* folder.**

***

"""

GIT_LOG_CMD_THEMES = 'git log --pretty=format:"\
**Date:** %aD<br/>%n\
**Commit:** [%h]({repo_url}/commit/%h)<br/>%n\
**Author:** %aN<br/>%n%n%b%n***%n" \
-- {relative_path} ":(exclude)themes/CHANGELOG.md" {append_or_override} "{log_path}"'

CHANGELOG_HEADER_THEMES = """## Themes changelog

***

"""

if __name__ == "__main__":
    pass
