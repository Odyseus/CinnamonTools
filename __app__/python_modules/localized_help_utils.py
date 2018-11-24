#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Utils for the localized_help_creator module.

.. note::

    No <class :any:`LogSystem`> available in this module since this module is imported
    by scripts executed outside the main Python application.

Attributes
----------
BOXED_CONTAINER : str
    Boxed container template.
HTML_DOC : str
    HTML document template.
LOCALE_SECTION : str
    Localized section template.
OPTION : str
    Option tag template.
README_DOC : str
    README file template.
"""

import gettext
import json
import os
import time

from datetime import datetime
from shutil import copy2

from . import app_utils
from .python_utils import file_utils
from .python_utils import polib
from .python_utils.ansi_colors import Ansi


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
{css_bootstrap_theme}
{css_bootstrap_tweaks}
{css_custom}
</style>
</head>

<body>
<noscript>
<div class="alert alert-warning" role="alert">
<p><strong>Oh snap! This page needs JavaScript enabled to display correctly.</strong></p>
<p><strong>This page uses JavaScript only to switch between the available languages, display images, smooth scrolling, etc.</strong></p>
<p><strong>There are no tracking services of any kind and never will be (at least, not from my side).</strong></p>
</div>
<!-- .alert.alert-warning -->
</noscript>
<div id="mainarea">
    <nav class="text-bold py-0 py-md-0 navbar navbar-expand-sm navbar-light fixed-top bg-light" role="navigation">
        <div class="container-fluid">
            <div class="navbar-header">
                <ul class="nav navbar-nav">
                    <!-- The preventDefault() calls are to avoid changing the address in the address bar. -->
                    <li><a id="nav-xlet-help" class="navbar-brand" onclick="event.preventDefault();" href="#xlet-help">Help</a></li>
                    <li><a id="nav-xlet-contributors" class="navbar-brand" onclick="event.preventDefault();" href="#xlet-contributors">Contributors</a></li>
                    <li><a id="nav-xlet-changelog" class="navbar-brand" onclick="event.preventDefault();" href="#xlet-changelog">Changelog</a></li>
                </ul>
            </div>
            <form class="form-inline">
                <div class="input-group input-group-sm">
                    <div class="input-group-prepend">
                        <span class="input-group-text text-bold text-font-size-xx-large" for="localization-switch">⊛</span>
                    </div>
                    <select class="custom-select custom-select-sm text-bold" id="localization-switch" onchange="self.toggleLocalizationVisibility(value, this);">
{options}
                    </select>
                </div>
            </form>
        </div>
    </nav>
<span id="xlet-help">
<div class="container boxed my-3 py-3">
{sections}
</div> <!-- .container.boxed -->
<span id="xlet-contributors">
{contributors}
<span id="xlet-changelog">
{changelog}
</div> <!-- #mainarea -->
<!--Footer-->
<footer class="page-footer text-bold bg-light pt-4 mt-4">
    <!--Footer Links-->
    <div class="container-fluid text-left">
        <ul class="list-unstyled">
            <li>
                <p>Page created with <a href="https://getbootstrap.com"><b>Bootstrap</b></a> v4.1.3.</p>
            </li>
            <li>
                <p><a href="https://bootswatch.com/flatly"><b>Flatly</b></a> Bootstrap theme by <a href="https://bootswatch.com"><b>Bootswatch</b></a>.</p>
            </li>
            <li>
                <p><a href="https://github.com/julienetie/smooth-scroll"><b>Smooth Scroll plugin</b></a> provided by <a href="https://github.com/julienetie"><b>Julien Etienne</b></a>.</p>
            </li>
        </ul>
    </div>
    <!--/.Footer Links-->
    <!--Copyright-->
    <div class="text-center py-3">
        <div class="container-fluid">
            © 2016-%s <a href="%s">Odyseus</a>
        </div>
    </div>
    <!--/.Copyright-->
</footer>
<!--/.Footer-->
<script type="text/javascript">toggleLocalizationVisibility(null);
{js_custom}
</script>
</body>
</html>
""" % (datetime.today().year, app_utils.URLS["repo"])

BOXED_CONTAINER = """<div class="container boxed my-3 py-3">
{0}
</div> <!-- .container.boxed -->
"""


LOCALE_SECTION = """
<div id="{language_code}" class="localization-content" {hidden}>
{title}
{warning}
{compatibility}
{localization}
{content_base}
{content_extra}
</br>
{only_english_alert}
</div> <!-- .localization-content -->
"""

# {endonym} inside an HTML comment at the very begening of the string so I can sort all
# the "option" elements by endonym.
OPTION = """<!-- {endonym} --><option {selected}data-title="{title}" data-xlet-help="{xlet_help}" data-xlet-contributors="{xlet_contributors}" data-xlet-changelog="{xlet_changelog}" value="{language_code}">{endonym} ({language_name}){translated_percentage}</option>"""


README_DOC = """{readme_compatibility}
{readme_content}
"""


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


class HTMLInlineAssets():
    """HTML inline assets.

    Attributes
    ----------
    css_bootstrap_theme : str
        The content of the CSS Bootstrap theme.
    css_bootstrap_tweaks : str
        The content of the CSS with tweaks for the Bootstrap theme.
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
        self.css_bootstrap_theme = ""
        self.css_bootstrap_tweaks = ""
        self.js_localizations_handler = ""

        assets_folder_path = os.path.join(repo_folder, "__app__", "data", "html_assets")
        path_css_bootstrap_theme = os.path.join(assets_folder_path, "css", "flatly_bootstrap_theme",
                                                "dist", "flatly_bootstrap_theme.min.css")
        path_css_bootstrap_tweaks = os.path.join(assets_folder_path, "css", "bootstrap-tweaks.css")
        path_js_localizations_handler = os.path.join(
            assets_folder_path, "js", "localizations-handler.min.js")

        # Do the "heavy lifting" first.
        if os.path.exists(path_css_bootstrap_theme):
            with open(path_css_bootstrap_theme, "r", encoding="UTF-8") as bootstrap_css:
                self.css_bootstrap_theme = bootstrap_css.read()

        if os.path.exists(path_css_bootstrap_tweaks):
            with open(path_css_bootstrap_tweaks, "r", encoding="UTF-8") as bootstrap_css_tweaks:
                self.css_bootstrap_tweaks = bootstrap_css_tweaks.read()

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
    now = datetime.now()
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
    if "Report-Msgid-Bugs-To" not in po_file.metadata or po_file.metadata["Report-Msgid-Bugs-To"] != app_utils.URLS["repo"]:
        do_save = True
        po_file.metadata["Report-Msgid-Bugs-To"] = app_utils.URLS["repo"]

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


def save_file(file_path, data, is_xlet_help_file=False):
    """Save file.

    Parameters
    ----------
    file_path : str
        Path to a file to save data to.
    data : str
        The data to save into a file.
    is_xlet_help_file : bool, optional
        If the saved file is the xlet's HELP.html file, copy it into the docs folder
        for on-line hosting.
    """
    try:
        with open(file_path, "w") as f:
            f.write(data)
    except Exception as err:
        print(Ansi.ERROR(err))
        quit()
    else:
        if is_xlet_help_file:
            xlet_folder = file_utils.get_parent_dir(file_path, 0)
            xlet_icon = os.path.join(xlet_folder, "icon.png")
            xlet_slug = os.path.basename(file_utils.get_parent_dir(file_path))
            dest_path = os.path.join(app_utils.PATHS["docs_sources"], "_static",
                                     "xlets_help_pages", xlet_slug)
            dest_html_file = os.path.join(dest_path, "index.html")
            dest_icon_file = os.path.join(dest_path, "icon.png")

            os.makedirs(dest_path, exist_ok=True)

            if os.path.exists(dest_html_file):
                os.remove(dest_html_file)

            if os.path.exists(dest_icon_file):
                os.remove(dest_icon_file)

            copy2(file_path, dest_html_file)
            copy2(xlet_icon, dest_icon_file)


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
            data += "![Cinnamon {0}]({1}/lib/badges/cinn-{0}.svg)\n".format(version,
                                                                            app_utils.URLS["repo_pages"])
        else:
            # The help files uses a Bootstrap badge for the compatibility badges.
            if version[0] in ["2", "5", "8"]:
                data += get_bootstrap_badge(context="warning",
                                            extra_classes="text-monospace",
                                            content="v" + version)
            elif version[0] in ["3", "6", "9"]:
                data += get_bootstrap_badge(context="success",
                                            extra_classes="text-monospace",
                                            content="v" + version)
            elif version[0] in ["4", "7"]:
                data += get_bootstrap_badge(context="info",
                                            extra_classes="text-monospace",
                                            content="v" + version)
            else:
                data += get_bootstrap_badge(context="warning",
                                            extra_classes="text-monospace",
                                            content="v" + version)

    if for_readme:
        data += "\n<span style=\"color:red;\"><strong>Do not install on any other version of Cinnamon.</strong></span>\n"

    return data


# Complex Bootstrap elements.

def get_bootstrap_alert(context="info", content="", heading="", bold_text=True):
    """Get bootstrap alert.

    Parameters
    ----------
    context : str, optional
        A Boostrap "context color class". Examples: "primary", "secondary", "success",
        "danger", "warning", "info", etc.
    content : str, optional
        The content text.
    heading : str, optional
        A title for the alert.
    bold_text : bool, optional
        Whether to use the "text-bold" class or not.

    Returns
    -------
    str
        A bootstrap alert.
    """
    h = ('<h4 class="alert-heading">%s</h4>' % heading) if heading else ""
    return """
<div class="alert alert-{context} {bold_text} shadow-sm" role="alert">
{heading}
{content}
</div>
""".format(context=context,
           content=content,
           heading=h,
           bold_text="text-bold" if bold_text else "")


def get_bootstrap_card(context="info",
                       header="",
                       body="",
                       body_extra_classes="",
                       marging_y=3,
                       white_header=True):
    """Get bootstrap card.

    Parameters
    ----------
    context : str, optional
        A Boostrap "context color class". Examples: "primary", "secondary", "success",
        "danger", "warning", "info", etc.
    header : str, optional
        The header text.
    body : str, optional
        The content text.
    body_extra_classes : str, optional
        Extra classes to set to the card body.
    marging_y : int, optional
        Margin top and botton for the card.
    white_header : bool, optional
        Whether to set the "text-white" class to the card header.

    Returns
    -------
    str
        A bootstrap card.
    """
    return """<div class="card text-bold my-{marging_y} border-{context} shadow-sm">
    <div class="card-header bg-{context} {white_header}">{header}</div>
    <div class="card-body text-{context} {body_extra_classes}">{body}</div>
</div>""".format(
        context=context,
        body=body,
        header=header,
        body_extra_classes=body_extra_classes,
        marging_y=str(marging_y),
        white_header="text-white" if white_header else "")


def get_bootstrap_badge(context="info", content="", extra_classes="", is_pill=False):
    """Get bootstrap badge.

    Parameters
    ----------
    context : str, optional
        A Boostrap "context color class". Examples: "primary", "secondary", "success",
        "danger", "warning", "info", etc.
    content : str, optional
        The content text.
    extra_classes : str, optional
        Extra classes to set to the <img> element.
    is_pill : bool, optional
        Whether to use the "badge-pill" class or not.

    Returns
    -------
    srt
        A bootstrap badge.
    """
    return """<span class="badge {is_pill} badge-{context} shadow-sm {extra_classes}">{content}</span>
""".format(context=context,
           content=content,
           extra_classes=extra_classes,
           is_pill="badge-pill" if is_pill else "")


def get_image_container(extra_classes="", alt="", centered=True):
    """Get image container.

    Parameters
    ----------
    extra_classes : str, optional
        Extra classes to set to the <img> element.
    alt : str, optional
        Text to set the image alt attribute.
    centered : bool, optional
        Whether to wrap the <img> element with a <div> with the "img-centered-container" class set.

    Returns
    -------
    srt
        An <img> element or a container with an <img> element.
    """
    container = '<div class="img-centered-container">%s</div>' if centered else "%s"
    return container % """<img class="img-fluid {extra_classes}" alt="{alt}">
""".format(alt=alt,
           extra_classes=extra_classes)


if __name__ == "__main__":
    pass
