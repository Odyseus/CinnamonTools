#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Localized help creator.

Attributes
----------
md : object
    The mistune Markdown parser.
pyuca_collator : object
    See <class :any:`pyuca.collator.Collator`>.
repo_folder : str
    The main repository folder. All commands must be executed from this location without exceptions.
translations : object
    See <class :any:`localized_help_utils.Translations`>.
"""

import os

from subprocess import call

from . import localized_help_utils
from . import mistune
from .locale_list import locale_list
from .pyuca import Collator

pyuca_collator = Collator()
md = mistune.Markdown()

repo_folder = os.path.normpath(os.path.join(
    os.path.dirname(os.path.abspath(__file__)), *([".."] * 2)))

translations = localized_help_utils.Translations()


def _(aStr):
    """Gettext translation mechanism.

    Parameters
    ----------
    aStr : str
        String to retrieve a translation of.

    Returns
    -------
    str
        The translated string if any.
    """
    trans = translations.get([current_language]).gettext

    if not aStr.strip():
        return aStr

    current_language_stats["total"] = current_language_stats["total"] + 1

    if trans:
        result = trans(aStr)

        try:
            result = result.decode("utf-8")
        except Exception:
            result = result

        if result != aStr:
            current_language_stats["translated"] = current_language_stats["translated"] + 1
            return result

    return aStr


class LocalizedHelpCreator(object):
    """LocalizedHelpCreator

    Attributes
    ----------
    changelog : str
        Xlet changelog.
    compatibility_data : str
        Xlet compatibility data (the Cinnamon version/s with which an xlet is compatible). It
        could be in HTML or Markdown.
    contributors : str
        If existent, the content of the CONTRIBUTORS.md (inside the xlet folder) formatted in HTML.
    help_file_path : str
        The path of an xlet HELP.html file.
    html_assets : object
        See <class :any:`localized_help_utils.HTMLInlineAssets`>.
    lang_list : list
        The list of languages (.po files) that will be used to create the HELP.html file
        localized content.
    options : list
        The list of options (HTML tags) that will be used to populate the language selector menu.
    sections : list
        The list of sections that contain the localized content.
    xlet_dir : str
        Path to the xlet directory.
    xlet_meta : dict
        The xlet metadata.
    xlet_slug : str
        The name of the folder that contains the source files for an xlet.
    """

    def __init__(self, xlet_dir="", xlet_slug=""):
        """Initialize.

        Parameters
        ----------
        xlet_dir : str, optional
            Path to the xlet directory.
        xlet_slug : str, optional
            The name of the folder that contains the source files for an xlet.
        """
        self.xlet_dir = xlet_dir
        self.xlet_slug = xlet_slug
        self.xlet_meta = localized_help_utils.XletMetadata(
            os.path.join(xlet_dir)).xlet_meta

        self.html_assets = localized_help_utils.HTMLInlineAssets(repo_folder=repo_folder)
        self.compatibility_data = localized_help_utils.get_compatibility(
            xlet_meta=self.xlet_meta,
            for_readme=False
        )
        self.lang_list = []
        self.sections = []
        self.options = []
        self.contributors = ""
        self.changelog = ""
        self.help_file_path = os.path.join(self.xlet_dir, "HELP.html")

        contributors_path = os.path.join(self.xlet_dir, "__data__", "CONTRIBUTORS.md")
        changelog_path = os.path.join(self.xlet_dir, "__data__", "CHANGELOG.md")
        old_changelog_path = os.path.join(self.xlet_dir, "__data__", "CHANGELOG-OLD.md")

        if os.path.exists(contributors_path):
            try:
                with open(contributors_path, "r") as contributors_file:
                    contributors_rawdata = contributors_file.read()

                self.contributors += localized_help_utils.BOXED_CONTAINER.format(
                    md(contributors_rawdata))
            except Exception as err:
                print(localized_help_utils.Ansi.ERROR(err))
                self.contributors += ""

        if os.path.exists(changelog_path):
            try:
                with open(changelog_path, "r") as changelog_file:
                    changelog_rawdata = changelog_file.read()

                self.changelog += localized_help_utils.BOXED_CONTAINER.format(md(changelog_rawdata))
            except Exception as err:
                print(localized_help_utils.Ansi.ERROR(err))
                self.changelog += ""

        if os.path.exists(old_changelog_path):
            try:
                with open(old_changelog_path, "r") as old_changelog_file:
                    old_changelog_rawdata = old_changelog_file.read()

                self.changelog += localized_help_utils.BOXED_CONTAINER.format(
                    md(old_changelog_rawdata))
            except Exception as err:
                print(localized_help_utils.Ansi.ERROR(err))
                self.changelog += ""

    def start(self):
        """Start procedure.
        """
        podir = os.path.join(self.xlet_dir, "po")
        done_one = False
        dummy_locale_path = os.path.join(repo_folder, "tmp", "locales", self.xlet_slug)

        print("Starting temporary installation of locales...")

        if not os.path.exists(dummy_locale_path):
            os.makedirs(dummy_locale_path)

        for root, subFolders, files in os.walk(podir, topdown=False):
            for file in files:
                pofile_path = os.path.join(root, file)
                parts = os.path.splitext(file)

                if parts[1] == ".po":
                    try:
                        try:
                            lang_name = locale_list[parts[0]]["name"]
                        except Exception:
                            lang_name = ""

                        localized_help_utils.validate_po_file(
                            pofile_path=pofile_path,
                            lang_name=lang_name,
                            xlet_meta=self.xlet_meta,
                            xlet_slug=self.xlet_slug,
                        )
                    finally:
                        self.lang_list.append(parts[0])
                        this_locale_dir = os.path.join(dummy_locale_path, parts[0], "LC_MESSAGES")
                        os.makedirs(this_locale_dir, exist_ok=True)
                        call(["msgfmt", "-c", pofile_path, "-o",
                              os.path.join(this_locale_dir, "%s.mo" % self.xlet_slug)])
                        done_one = True

        if done_one:
            print("Dummy install complete.")

            if len(self.lang_list) > 0:
                translations.store(self.xlet_slug, dummy_locale_path, self.lang_list)

            # Append English to lang_list AFTER storing the translations.
            self.lang_list.append("en")
            self._create_html_document()
        else:
            print(localized_help_utils.Ansi.ERROR("Dummy install failed."))

    def _create_html_document(self):
        """Create HTML document.

        Create the HELP.html file for an xlet directly into the xlet directory.
        """
        print("Creating HTML document...")
        for lang in self.lang_list:
            print("Processing language: %s" % lang)

            global current_language
            current_language = lang

            global current_language_stats
            current_language_stats = {
                "total": 0,
                "translated": 0
            }

            only_english_alert = md("<div style=\"font-weight:bold;\" class=\"alert alert-info\">{0}</div>".format(
                _("The following two sections are available only in English."))
            )

            compatibility_disclaimer = "<p class=\"text-danger compatibility-disclaimer\">{}</p>".format(
                _("Do not install on any other version of Cinnamon.")
            )

            compatibility_block = localized_help_utils.BOOTSTRAP_PANEL.format(
                context="success",
                custom_class="compatibility",
                title=_("Compatibility"),
                content=self.compatibility_data + "\n<br/>" + compatibility_disclaimer,
            )

            section = localized_help_utils.LOCALE_SECTION.format(
                language_code=current_language,
                hidden="" if current_language is "en" else " hidden",
                introduction=self._get_introduction(),
                compatibility=compatibility_block,
                content_base=md(self.get_content_base(for_readme=False)),
                content_extra=self.get_content_extra(),
                localization_info=self._get_localization_info(),
                only_english_alert=only_english_alert,
            )

            option = self._get_option()

            # option could be None if the the language has no endonym or if the amount
            # of translated strings is lower than 50% of the total translatable strings.
            if option is not None:
                self.sections.append(section)
                self.options.append(option)

        html_doc = localized_help_utils.HTML_DOC.format(
            # This string doesn't need to be translated.
            # It's the initial title of the page that it's always in English.
            title="Help for {xlet_name}".format(xlet_name=self.xlet_meta["name"]),
            # WARNING!!! Insert the inline files (.css and .js) AFTER all string formatting has been done.
            # CSS code interferes with formatting variables. ¬¬
            js_localizations_handler=self.html_assets.js_localizations_handler if
            self.html_assets.js_localizations_handler else "",
            css_bootstrap=self.html_assets.css_bootstrap if self.html_assets.css_bootstrap else "",
            css_tweaks=self.html_assets.css_tweaks if self.html_assets.css_tweaks else "",
            css_custom=self.get_css_custom(),
            options="\n".join(sorted(self.options, key=pyuca_collator.sort_key)),
            sections="\n".join(self.sections),
            contributors=self.contributors if self.contributors else "",
            changelog=self.changelog if self.changelog else "",
            js_custom=self.get_js_custom()
        )

        print("Saving file...")

        localized_help_utils.save_file(path=self.help_file_path,
                                       data=html_doc)

    def _get_language_stats(self):
        """Get language stats.

        Returns
        -------
        int
            The total approximate percentage of translated strings for a HELP.html file an xlet has.
        """
        stats_total = str(current_language_stats["total"])
        stats_translated = str(current_language_stats["translated"])

        return int(100 * float(stats_translated) / float(stats_total))

    def _get_option(self):
        """Get option.

        Returns
        -------
        str
            An option HTML tag ready to be inserted into a select HTML tag.
        """
        try:
            endonym = locale_list[current_language]["endonym"]
            language_name = locale_list[current_language]["name"]
        except Exception:
            endonym = None
            language_name = None

        # Define them before self._get_language_stats() is called so these
        # strings are also counted.
        xlet_help = _("Help")
        xlet_contributors = _("Contributors")
        xlet_changelog = _("Changelog")
        title = _("Help for %s") % _(self.xlet_meta["name"])

        if current_language == "en" or endonym is not None:
            translated_percentage = 100 if current_language == "en" else self._get_language_stats()
            trans_perc_msg = " (%s%%)" % translated_percentage if translated_percentage < 100 else ""

            return localized_help_utils.OPTION.format(
                endonym=endonym,
                language_name=language_name,
                selected="selected " if current_language is "en" else "",
                language_code=current_language,
                xlet_help=xlet_help,
                xlet_contributors=xlet_contributors,
                xlet_changelog=xlet_changelog,
                title=title,
                translated_percentage=trans_perc_msg
            )
        else:
            return None

    def _get_introduction(self):
        """Get introduction.

        Returns
        -------
        str
            The main title of the page and a generic warning.
        """
        return localized_help_utils.INTRODUCTION.format(
            # TO TRANSLATORS: Full sentence:
            # "Help for <xlet_name>"
            md("# %s" % (_("Help for %s") % self.xlet_meta["name"])),
            md("## %s" % _("IMPORTANT!!!")),
            md(_("Never delete any of the files found inside this xlet folder. It might break this xlet functionality.")),
            md(_("Bug reports, feature requests and contributions should be done on this xlet's repository linked next.") +
               " %s" % ("[GitHub](%s)" % self.xlet_meta["website"] if self.xlet_meta["website"] else self.xlet_meta["url"]))
        )

    def _get_localization_info(self):
        """Get localization info.

        Returns
        -------
        str
            Information about xlets localization mechanism.
        """
        return md("\n".join([
            "## %s" % _("Applets/Desklets/Extensions (a.k.a. xlets) localization"),
            "- %s" % _("If this xlet was installed from Cinnamon Settings, all of this xlet's localizations were automatically installed."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("If this xlet was installed manually and not trough Cinnamon Settings, localizations can be installed by executing the script called **localizations.bash** from a terminal opened inside the xlet's folder."),
            "- %s" % _("If this xlet has no locale available for your language, you could create it by following the following instructions.") +
            " %s" % "[Wiki](https://github.com/Odyseus/CinnamonTools/wiki/Xlet-localization)"
        ]))

    def get_content_base(self, for_readme=False):
        """Get base content.

        The information returned by this method can be used to generate a README.md file.

        Parameters
        ----------
        for_readme : bool, optional
            Option used to decide if certain information should be added to the
            generated README.md file.

        Returns
        -------
        str
            Basic information about an xlet that can be used as an introduction to the xlet's
            features inside the content of the HELP.html file or as the content of a README.md file.
        """
        return ""

    def get_content_extra(self):
        """Get extra content.

        Returns
        -------
        str
            Detailed information about an xlet (features, dependencies, keyboard
            shortcuts description, etc.).
        """
        return ""

    def get_css_custom(self):
        """Get custom CSS code.

        Returns
        -------
        str
            CSS stylesheet that extends or overrides the global CSS stylesheets.
        """
        return ""

    def get_js_custom(self):
        """Get custom JS code.

        Returns
        -------
        str
            Extra JavaScript functions that can perform any action that it is specific to a
            HELP.html file for an xlet.
        """
        return ""


if __name__ == "__main__":
    pass
