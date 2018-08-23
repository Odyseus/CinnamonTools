#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Utils for the localized_help_creator module.

Attributes
----------
Ansi : object
    :any:`app_utils.ANSIColors` class initialization.
BOOTSTRAP_ALERT : str
    Bootstrap alert template.
BOOTSTRAP_PANEL : str
    Bootstrap panel template.
BOXED_CONTAINER : str
    Boxed container template.
COMPATIBILITY_BADGE : str
    Compatibility badge template.
HTML_DOC : str
    HTML document template.
INTRODUCTION : str
    Introduction section template.
LOCALE_SECTION : str
    Localized section template.
OPTION : str
    Option tag template.
README_DOC : str
    README file template.
"""

import os
import json
import gettext
import datetime
import time

from shutil import copy2

from . import app_utils
from . import polib


Ansi = app_utils.Ansi

HTML_DOC = """<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="content-type" content="text/html;charset=utf-8">
    <title>{title}</title>
    <link rel="shortcut icon" type="image/x-icon" href="./icon.png">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script type="text/javascript">
    {js_localizations_handler}
    </script>
    <style type="text/css">
    {css_bootstrap}
    {css_tweaks}
    {css_custom}
    </style>
</head>
<body>
<noscript>
<div class="alert alert-warning">
<p><strong>Oh snap! This page needs JavaScript enabled to display correctly.</strong></p>
<p><strong>This page uses JavaScript only to switch between the available languages and/or display images.</strong></p>
<p><strong>There are no tracking services of any kind and never will be (at least, not from my side).</strong></p>
</div> <!-- .alert.alert-warning -->
</noscript>
<div id="mainarea">
<nav class="navbar navbar-default navbar-fixed-top" role="navigation">
    <div class="container-fluid">
    <div class="navbar-header">
        <ul class="nav navbar-nav navbar-left">
            <li><a id="nav-xlet-help" class="js_smoothScroll navbar-brand" href="#xlet-help">Help</a></li>
            <li><a id="nav-xlet-contributors" class="js_smoothScroll navbar-brand" href="#xlet-contributors">Contributors</a></li>
            <li><a id="nav-xlet-changelog" class="js_smoothScroll navbar-brand" href="#xlet-changelog">Changelog</a></li>
        </ul>
    </div>
    <form class="navbar-form navbar-right">
        <div class="form-group">
            <span class="standalone-glyphicon-globe-wrapper"><span class="standalone-glyphicon-globe"></span></span>
<!-- WARNING!!! -->
<!-- Using the Bootstrap classes "form-control" or "input-sm" and the like
     breaks the styling of the "select" elements!!! ¬¬ -->
            <select class="form-control-static" id="localization-switch" onchange="self.toggleLocalizationVisibility(value, this);">
{options}
            </select>
        </div>
    </form>
    </div>
</nav>
<span id="xlet-help" style="padding-top:70px;">
<div class="container boxed">
{sections}
</div> <!-- .container.boxed -->
<span id="xlet-contributors" style="padding-top:140px;">
{contributors}
<span id="xlet-changelog" style="padding-top:70px;">
{changelog}
</div> <!-- #mainarea -->
<script type="text/javascript">toggleLocalizationVisibility(null);
{js_custom}</script>
</body>
</html>
"""

BOXED_CONTAINER = """<div class="container boxed">
{0}
</div> <!-- .container.boxed -->
"""


INTRODUCTION = """
{0}
<div style="font-weight:bold;" class="alert alert-warning">
{1}
{2}
{3}
</div>
"""


LOCALE_SECTION = """
<div id="{language_code}" class="localization-content{hidden}">
{introduction}
{compatibility}
{content_base}
{content_extra}
{localization_info}
{only_english_alert}
</div> <!-- .localization-content -->
"""

# {endonym} inside an HTML comment at the very begening of the string so I can sort all
# the "option" elements by endonym.
OPTION = """<!-- {endonym} --><option {selected}data-title="{title}" data-xlet-help="{xlet_help}" data-xlet-contributors="{xlet_contributors}" data-xlet-changelog="{xlet_changelog}" value="{language_code}">{endonym} ({language_name}){translated_percentage}</option>"""


README_DOC = """{readme_compatibility}
{readme_content}
"""

BOOTSTRAP_PANEL = """
<div class="panel panel-{context}">
    <div class="panel-heading">
        <h3 class="panel-title">{title}</h3>
    </div>
    <div class="panel-body {custom_class}">
        {content}
    </div>
</div>
"""

BOOTSTRAP_ALERT = """
<div class="alert alert-{context}">
{content}
</div>
"""


COMPATIBILITY_BADGE = '<span class="compatibility-badge"><span class="label label-primary">Cinnamon\
</span><span class="label label-{0}">{1}</span></span>\n'


class XletMetadata():
    """Xlet metadata.

    Attributes
    ----------
    xlet_meta : dict
        The parsed content of the metadata.json file from an xlet.
    """

    def __init__(self, xlet_dir):
        """initialization.

        Parameters
        ----------
        xlet_dir : str
            Path to an xlet directory.
        """
        try:
            file = open(os.path.join(xlet_dir, "metadata.json"), "r")
            raw_meta = file.read()
            file.close()
            self.xlet_meta = json.loads(raw_meta)
        except Exception as err:
            print("Failed to get metadata - missing, corrupt, or incomplete metadata.json file")
            print(err)
            self.xlet_meta = None


class Translations(object):
    """Translations mechanism.
    """

    def __init__(self):
        """Initialization.
        """
        self._translations = {}
        self._null = gettext.NullTranslations()

    def store(self, domain, localedir, languages):
        """Store all translations.

        Parameters
        ----------
        domain : str
            The domain to get translations from.
        localedir : str
            The directory were the translations are stored.
        languages : list
            The list of languages to retrieve.
        """
        for lang in languages:
            try:
                translations = gettext.translation(domain,
                                                   localedir,
                                                   [lang])
            except IOError:
                print("No translations found for language code '{}'".format(lang))
                translations = None

            if translations is not None:
                self._translations[lang] = translations

    def get(self, languages):
        """Get translations.

        Parameters
        ----------
        languages : list
            The languages to get the translation for.

        Returns
        -------
        dict
            The translations object for the requested languages.
        """
        for lang in languages:
            if lang in self._translations:
                return self._translations[lang]
        return self._null


class HTMLInlineAssets(object):
    """HTML inline assets.

    Attributes
    ----------
    css_bootstrap : str
        Bootstrap CSS stylesheet.
    css_tweaks : str
        CSS stylesheet tweaks.
    js_localizations_handler : str
        Localizations handler JavaScript code.
    """

    def __init__(self, repo_folder):
        """Initialization.

        Parameters
        ----------
        repo_folder : str
            Path to the repository folder.
        """
        super(HTMLInlineAssets, self).__init__()
        self.css_bootstrap = ""
        self.css_tweaks = ""
        self.js_localizations_handler = ""

        assets_folder_path = os.path.join(repo_folder, "__app__", "data", "html_assets")
        path_css_bootstrap = os.path.join(
            assets_folder_path, "css", "bootstrap-for-standalone.min.css")
        path_css_tweaks = os.path.join(assets_folder_path, "css", "tweaks.css")
        path_js_localizations_handler = os.path.join(
            assets_folder_path, "js", "localizations-handler.js")

        # Do the "heavy lifting" first.
        if os.path.exists(path_css_bootstrap):
            with open(path_css_bootstrap, "r", encoding="UTF-8") as bootstrap_css:
                self.css_bootstrap = bootstrap_css.read()

        if os.path.exists(path_css_tweaks):
            with open(path_css_tweaks, "r", encoding="UTF-8") as tweaks_css:
                self.css_tweaks = tweaks_css.read()

        if os.path.exists(path_js_localizations_handler):
            with open(path_js_localizations_handler, "r", encoding="UTF-8") as localizations_handler_js:
                self.js_localizations_handler = localizations_handler_js.read()


def get_time_zone():
    """Get time zone.

    Returns
    -------
    str
        String representation of a time zone.
    """
    if time.localtime().tm_isdst and time.daylight:
        tzone = -time.altzone
    else:
        tzone = -time.timezone

    # Up to here, tzone is an integer.
    tzone = str(tzone / 60 / 60)

    # And the ugliness begins!!!
    [h, m] = tzone.split(".")

    isNegative = int(h) < 0
    hours = "{0:03d}".format(int(h)) if isNegative else "{0:02d}".format(int(h))
    minutes = "{0:02d}".format(int(m))

    try:
        return (hours if isNegative else "+" + hours) + minutes
    except Exception:
        return "+0000"


def get_timestamp():
    """Get time stamp.

    Returns a time stamp in the same format used by xgettex.

    Returns
    -------
    str
        A time stamp in the same format used in .pot files.
    """
    now = datetime.datetime.now()
    # Since the "padding" with zeroes of the rest of the values converts
    # them into strings, lets convert to string the year too.
    YEAR = str(now.year)
    # "Pad" all the following values with zeroes.
    MO = "{0:02d}".format(now.month)
    DA = "{0:02d}".format(now.day)
    HO = "{0:02d}".format(now.hour)
    MI = "{0:02d}".format(now.minute)
    ZONE = get_time_zone()

    return "%s-%s-%s %s:%s%s" % (YEAR, MO, DA, HO, MI, ZONE)


def validate_po_file(pofile_path, lang_name, xlet_meta, xlet_slug):
    """Validate .po file.

    Parameters
    ----------
    pofile_path : str
        Path to a .po file.
    lang_name : str
        A language name.
    xlet_meta : dict
        An xlet metadata.
    xlet_slug : str
        An xlet folder name.
    """
    po_file = polib.pofile(pofile_path, wrapwidth=99999999)
    do_save = False

    # Add package information to the .po files headers.
    if xlet_meta:
        do_save = True
        po_file.metadata[
            "Project-Id-Version"] = "{0} {1}".format(xlet_slug, xlet_meta["version"])

    # Sanitize language code to be UNIX compliant
    if "-" in po_file.metadata["Language"]:
        do_save = True
        po_file.metadata["Language"] = po_file.metadata["Language"].replace("-", "_")

    # Add the Report-Msgid-Bugs- field to the header.
    if "Report-Msgid-Bugs-To" not in po_file.metadata or po_file.metadata["Report-Msgid-Bugs-To"] != "https://gitlab.com/Odyseus/CinnamonTools":
        do_save = True
        po_file.metadata["Report-Msgid-Bugs-To"] = "https://gitlab.com/Odyseus/CinnamonTools"

    # Add the Language-Team field to the header to STFU all msgfmt warnings.
    if "Language-Team" not in po_file.metadata or po_file.metadata["Language-Team"] == "":
        do_save = True
        po_file.metadata["Language-Team"] = lang_name

    # Add the PO-Revision-Date field to the header to STFU all msgfmt warnings.
    if "PO-Revision-Date" not in po_file.metadata:
        do_save = True
        po_file.metadata["PO-Revision-Date"] = get_timestamp()

    # Add the Last-Translator field to the header to STFU all msgfmt warnings.
    if "Last-Translator" not in po_file.metadata:
        do_save = True
        po_file.metadata["Last-Translator"] = ""

    if po_file.metadata["X-Generator"] == "POEditor.com":
        do_save = True
        po_file.metadata["X-Generator"] = ""

    # Save only if the PO file metadata/header has been changed.
    if do_save:
        po_file.save()


def save_file(path, data):
    """Save file.

    Parameters
    ----------
    path : str
        Path to a file to save data to.
    data : str
        The data to save into a file.
    """
    try:
        with open(path, "w") as f:
            f.write(data)
    except Exception as err:
        print(app_utils.Ansi.ERROR(err))
        quit()
    else:
        # This copies the HELP.html files just created to
        # docs_sources/_static/xlets_help_pages for on-line hosting.
        if os.path.basename(path) == "HELP.html":
            repo_folder = app_utils.get_parent_dir(path, 2)
            xlet_slug = os.path.basename(app_utils.get_parent_dir(path))
            destination = os.path.join(repo_folder, "__app__", "docs_sources",
                                       "_static", "xlets_help_pages", xlet_slug + ".html")

            os.makedirs(os.path.dirname(destination), exist_ok=True)

            if os.path.exists(destination):
                os.remove(destination)

            copy2(path, destination)


def get_compatibility(xlet_meta=None, for_readme=False):
    """Get compatibility.

    Parameters
    ----------
    xlet_meta : None, optional
        Xlet metadata.
    for_readme : bool, optional
        Option used to decide if certain information should be added to the
        generated README.md file.

    Returns
    -------
    str
        A *compatibility block* that can be in HTML or Markdown.
    """
    data = ""

    if for_readme:
        data += "## Compatibility\n\n"

    for version in sorted(xlet_meta["cinnamon-version"]):
        if for_readme:
            # The README files uses SVG images hosted on-line for the compatibility badges.
            data += "![Cinnamon {0}](https://odyseus.gitlab.io/CinnamonTools/lib/badges/cinn-{0}.svg)\n".format(version)
        else:
            # The help files uses a custom Bootstrap label for the compatibility badges.
            if version[0] in ["2", "5", "8"]:
                data += COMPATIBILITY_BADGE.format("warning", version)
            elif version[0] in ["3", "6", "9"]:
                data += COMPATIBILITY_BADGE.format("success", version)
            elif version[0] in ["4", "7"]:
                data += COMPATIBILITY_BADGE.format("info", version)
            else:
                data += COMPATIBILITY_BADGE.format("warning", version)

    if for_readme:
        data += "\n<span style=\"color:red;\"><strong>Do not install on any other version of Cinnamon.</strong></span>\n"

    return data


if __name__ == "__main__":
    pass
