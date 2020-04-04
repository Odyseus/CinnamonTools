#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Utils for the localized_help_creator module.

.. note::

    No :any:`LogSystem` available in this module since this module is imported
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
repo_folder : str
    The main repository folder.
"""

import gettext
import json
import os
import time

from datetime import datetime

from . import app_data
from .python_utils import polib
from .python_utils.ansi_colors import Ansi

repo_folder = os.path.normpath(os.path.join(
    os.path.dirname(os.path.abspath(__file__)), *([os.pardir] * 2)))


HTML_DOC = """<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="content-type" content="text/html;charset=utf-8">
    <title>{title}</title>
    <link rel="shortcut icon" type="image/x-icon" href="./icon.png">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link type="text/css" rel="stylesheet" href="./assets/css/bootstrap.min.css">
    <link type="text/css" rel="stylesheet" href="./assets/css/bootstrap-tweaks.css">
    <style type="text/css">
{css_custom}
    </style>
</head>

<body>
<div id="mainarea">
    <nav class="text-bold py-0 navbar navbar-expand-sm navbar-dark bg-gradient-primary fixed-top" role="navigation">
        <div class="container-fluid">
            <div class="nav navbar-nav mr-auto">
                <!-- The preventDefault() calls are to avoid changing the address in the address bar. -->
                <a id="nav-xlet-help" class="navbar-brand nav-link" onclick="event.preventDefault();" href="#xlet-help">Help</a>
                <a id="nav-xlet-contributors" class="navbar-brand nav-link" onclick="event.preventDefault();" href="#xlet-contributors">Contributors</a>
                <a id="nav-xlet-changelog" class="navbar-brand nav-link" onclick="event.preventDefault();" href="#xlet-changelog">Changelog</a>
            </div>
            <form class="form-inline">
                <div class="input-group input-group-sm">
                    <div class="input-group-prepend">
                        <span class="input-group-text" for="localization-switch">🌐</span>
                    </div>
                    <select class="custom-select custom-select-sm text-bold" id="localization-switch">
{options}
                    </select>
                </div>
            </form>
        </div>
    </nav>
<span id="xlet-help">
<div class="container boxed my-3 py-3">
<noscript>
    <div class="alert alert-danger" role="alert">
        <p><strong>Oh snap! This page needs JavaScript enabled to display correctly.</strong></p>
        <p><strong>This page uses JavaScript only to switch between the available languages, smooth scrolling, etc.</strong></p>
        <p><strong>There are no tracking services of any kind and never will be (at least, not from my side).</strong></p>
    </div>
    <!-- .alert.alert-danger -->
</noscript>
{sections}
</div> <!-- .container.boxed -->
<span id="xlet-contributors">
{contributors}
<span id="xlet-changelog">
{changelog}
</div> <!-- #mainarea -->
<!--Footer-->
<footer class="text-bold text-white navbar-dark bg-gradient-primary px-3 pt-4 mt-4">
    <!--Footer Links-->
    <div class="container-fluid text-left">
        <ul class="list-unstyled">
            <li>
                <p>Page created with <a href="https://getbootstrap.com">Bootstrap</a>.</p>
            </li>
            <li>
                <p>Boostrap theme created with <a href="https://gitlab.com/PythonCLIApplications/BootstrapThemesGenerator">Bootstrap Theme Generator</a> and based on <a href="https://bootswatch.com">Bootswatch</a>'s <a href="https://bootswatch.com/flatly">Flatly theme</a>.</p>
            </li>
            <li>
                <p><a href="https://github.com/julienetie/smooth-scroll">Smooth Scroll plugin</a> provided by <a href="https://github.com/julienetie">Julien Etienne</a>.</p>
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
<script type="text/javascript" defer src="./assets/js/localizations-handler.min.js"></script>
<script type="text/javascript">
{js_custom}
</script>
</body>
</html>
""" % (datetime.today().year,
       app_data.URLS["repo"])

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
            "Project-Id-Version"] = "{0}".format(xlet_slug)

    # Sanitize language code to be UNIX compliant
    if "-" in po_file.metadata["Language"]:
        do_save = True
        po_file.metadata["Language"] = po_file.metadata["Language"].replace("-", "_")

    # Add the Report-Msgid-Bugs- field to the header.
    if "Report-Msgid-Bugs-To" not in po_file.metadata or po_file.metadata["Report-Msgid-Bugs-To"] != app_data.URLS["repo"]:
        do_save = True
        po_file.metadata["Report-Msgid-Bugs-To"] = app_data.URLS["repo"]

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


def save_file(file_path, data):
    """Save file.

    Parameters
    ----------
    file_path : str
        Path to a file to save data to.
    data : str
        The data to save into a file.
    """
    try:
        with open(file_path, "w") as f:
            f.write(data)
    except Exception as err:
        print(Ansi.LIGHT_RED(err))
        quit()


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


def get_image_container(extra_classes="", alt="", src="", centered=True):
    """Get image container.

    Parameters
    ----------
    extra_classes : str, optional
        Extra classes to set to the <img> element.
    alt : str, optional
        Text to set the image alt attribute.
    src : str, optional
        Image src HTML attribute.
    centered : bool, optional
        Whether to wrap the <img> element with a <div> with the "img-centered-container" class set.

    Returns
    -------
    srt
        An <img> element or a container with an <img> element.
    """
    container = '<div class="img-centered-container">%s</div>' if centered else "%s"
    return container % """<img {src} class="img-fluid {extra_classes}" alt="{alt}">
""".format(alt=alt,
           src=('src="%s"' % src) if src else "",
           extra_classes=extra_classes)


if __name__ == "__main__":
    pass
