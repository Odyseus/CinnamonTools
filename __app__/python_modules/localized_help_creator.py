#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Summary

Attributes
----------
md : TYPE
    Description
pyuca_collator : TYPE
    Description
repo_folder : TYPE
    Description
translations : TYPE
    Description
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
    """Summary

    Parameters
    ----------
    aStr : TYPE
        Description

    Returns
    -------
    TYPE
        Description
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
        Description
    compatibility_data : TYPE
        Description
    contributors : str
        Description
    help_file_path : TYPE
        Description
    html_assets : TYPE
        Description
    html_templates : TYPE
        Description
    lang_list : list
        Description
    options : list
        Description
    sections : list
        Description
    xlet_dir : TYPE
        Description
    xlet_meta : TYPE
        Description
    xlet_slug : TYPE
        Description
    """

    def __init__(self, xlet_dir="", xlet_slug=""):
        """Initialize.

        Parameters
        ----------
        xlet_dir : str, optional
            Description
        xlet_slug : str, optional
            Description
        """
        self.xlet_dir = xlet_dir
        self.xlet_slug = xlet_slug
        self.xlet_meta = localized_help_utils.XletMetadata(
            os.path.join(xlet_dir)).xlet_meta

        self.html_templates = localized_help_utils.HTMLTemplates()
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

        contributors_path = os.path.join(self.xlet_dir, "CONTRIBUTORS.md")
        changelog_path = os.path.join(self.xlet_dir, "CHANGELOG.md")
        old_changelog_path = os.path.join(self.xlet_dir, "CHANGELOG-OLD.md")

        if os.path.exists(contributors_path):
            try:
                with open(contributors_path, "r") as contributors_file:
                    contributors_rawdata = contributors_file.read()

                self.contributors += self.html_templates.boxed_container.format(
                    md(contributors_rawdata))
            except Exception as detail:
                print(detail)
                self.contributors += ""

        if os.path.exists(changelog_path):
            try:
                with open(changelog_path, "r") as changelog_file:
                    changelog_rawdata = changelog_file.read()

                self.changelog += self.html_templates.boxed_container.format(md(changelog_rawdata))
            except Exception as detail:
                print(detail)
                self.changelog += ""

        if os.path.exists(old_changelog_path):
            try:
                with open(old_changelog_path, "r") as old_changelog_file:
                    old_changelog_rawdata = old_changelog_file.read()

                self.changelog += self.html_templates.boxed_container.format(
                    md(old_changelog_rawdata))
            except Exception as detail:
                print(detail)
                self.changelog += ""

    def start(self):
        """Start procedure.

        Raises
        ------
        SystemExit
            Description
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

            # Append english to lang_list AFTER storing the translations.
            self.lang_list.append("en")
            self._create_html_document()
        else:
            raise SystemExit("Dummy install failed.")

    def _create_html_document(self):
        """Summary
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

            compatibility_block = self.html_templates.bt_panel.format(
                context="success",
                custom_class="compatibility",
                title=_("Compatibility"),
                content=self.compatibility_data + "\n<br/>" + compatibility_disclaimer,
            )

            section = self.html_templates.locale_section_base.format(
                language_code=current_language,
                hidden="" if current_language is "en" else " hidden",
                introduction=self._get_introduction(),
                compatibility=compatibility_block,
                content_base=md(self.get_content_base(for_readme=False)),
                content_extra=self.get_content_extra(),
                localize_info=self._get_localized_info(),
                only_english_alert=only_english_alert,
            )

            option = self._get_option()

            # option could be None if the the language has no endonym or if the amount
            # of translated strings is lower than 50% of the total translatable strings.
            if option is not None:
                self.sections.append(section)
                self.options.append(option)

        html_doc = self.html_templates.html_doc.format(
            # This string doesn't need to be translated.
            # It's the initial title of the page that it's always in English.
            title="Help for {xlet_name}".format(xlet_name=self.xlet_meta["name"]),
            # WARNING!!! Insert the inline files (.css and .js) AFTER all string formatting has been done.
            # CSS code interferes with formatting variables. ¬¬
            js_localizations_handler=self.html_assets.js_localizations_handler if
            self.html_assets.js_localizations_handler else "",
            css_bootstrap=self.html_assets.css_bootstrap if self.html_assets.css_bootstrap else "",
            css_tweaks=self.html_assets.css_tweaks if self.html_assets.css_tweaks else "",
            css_base=self.html_templates.css_base,
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
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        stats_total = str(current_language_stats["total"])
        stats_translated = str(current_language_stats["translated"])

        return int(100 * float(stats_translated) / float(stats_total))

    def _get_option(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        try:
            endonym = locale_list[current_language]["endonym"]
            language_name = locale_list[current_language]["name"]
        except Exception:
            endonym = None
            language_name = None

        # Define them first before self._get_language_stats() is called so these
        # strings are also counted.
        if current_language == "en" or (endonym is not None and self._get_language_stats() >= 50):
            xlet_help = _("Help")
            xlet_contributors = _("Contributors")
            xlet_changelog = _("Changelog")
            title = _("Help for %s") % self.xlet_meta["name"]

            return self.html_templates.option_base.format(
                endonym=endonym,
                language_name=language_name,
                selected="selected " if current_language is "en" else "",
                language_code=current_language,
                xlet_help=xlet_help,
                xlet_contributors=xlet_contributors,
                xlet_changelog=xlet_changelog,
                title=title
            )
        else:
            return None

    def _get_introduction(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        return self.html_templates.introduction_base.format(
            # TO TRANSLATORS: Full sentence:
            # "Help for <xlet_name>"
            md("# %s" % (_("Help for %s") % self.xlet_meta["name"])),
            md("## %s" % _("IMPORTANT!!!")),
            md(_("Never delete any of the files found inside this xlet folder. It might break this xlet functionality.")),
            md(_("Bug reports, feature requests and contributions should be done on this xlet's repository linked next.") +
               " %s" % ("[GitHub](%s)" % self.xlet_meta["website"] if self.xlet_meta["website"] else self.xlet_meta["url"]))
        )

    def _get_localized_info(self):
        """Summary

        Returns
        -------
        TYPE
            Description
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

        Parameters
        ----------
        for_readme : bool, optional
            Description

        Returns
        -------
        TYPE
            Description
        """
        return ""

    def get_content_extra(self):
        """Get extra content.

        Returns
        -------
        TYPE
            Description
        """
        return ""

    def get_css_custom(self):
        """Get custom CSS code.

        Returns
        -------
        TYPE
            Description
        """
        return ""

    def get_js_custom(self):
        """Get custom JS code.

        Returns
        -------
        TYPE
            Description
        """
        return ""


if __name__ == "__main__":
    pass
