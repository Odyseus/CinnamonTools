#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Localized help creator.

.. note::

    No :any:`LogSystem` available in this module since this module is imported
    by scripts executed outside the main Python application.

Attributes
----------
repo_folder : str
    The main repository folder. All commands must be executed from this location without exceptions.
translations : Translations
    See :any:`localized_help_utils.Translations`.
"""

import os
import sys

from . import localized_help_utils as utils
from .locale_list import locale_list
from .python_utils import cmd_utils
from .python_utils.mistune_utils import md

try:
    from pyuca import Collator
    pyuca_collator = Collator()
except (ImportError, SystemError):
    pyuca_collator = None

repo_folder = os.path.normpath(os.path.join(
    os.path.dirname(os.path.abspath(__file__)), *([os.pardir] * 2)))

translations = utils.Translations()


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

        # REMINDER 1: Some strings doesn't need to be translated, like the name of a program,
        # a programming language, etc. So, in these cases, the "total" and "translated" stats
        # will differ, reporting a false percentage of translated strings.
        # I'm reluctant to create a blacklist mechanism to handle these untranslated strings.
        # For now, I will simply avoid using `_()` call on these strings.
        if result != aStr:
            current_language_stats["translated"] = current_language_stats["translated"] + 1
            return result
        # Debugging
        # else:
        #     if current_language != "en":
        #         print(aStr)

    return aStr


class LocalizedHelpCreator():
    """LocalizedHelpCreator

    Attributes
    ----------
    changelog : str
        Xlet changelog.
    contributors : str
        If existent, the content of the CONTRIBUTORS.md (inside the xlet folder) formatted in HTML.
    help_file_path : str
        The path of an xlet HELP.html file.
    lang_list : list
        The list of languages (.po files) that will be used to create the HELP.html file
        localized content.
    options : list
        The list of options (HTML tags) that will be used to populate the language selector menu.
    sections : list
        The list of sections that contain the localized content.
    xlet_config : dict
        Xlet configuration defined in a z_config.py file.
    xlet_dir : str
        Path to the xlet directory.
    xlet_meta : dict
        The xlet metadata.
    xlet_slug : str
        The name of the folder that contains the source files for an xlet.
    """

    def __init__(self, xlet_dir="", xlet_slug="", xlet_config={}):
        """Initialize.

        Parameters
        ----------
        xlet_dir : str, optional
            Path to the xlet directory.
        xlet_slug : str, optional
            The name of the folder that contains the source files for an xlet.
        xlet_config : dict, optional
            Xlet configuration defined in a z_config.py file.
        """
        self.xlet_dir = xlet_dir
        self.xlet_slug = xlet_slug
        self.xlet_config = xlet_config
        self.xlet_meta = utils.XletMetadata(
            os.path.join(xlet_dir)).xlet_meta

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

                self.contributors += utils.BOXED_CONTAINER.format(
                    md(contributors_rawdata))
            except Exception as err:
                print(utils.Ansi.LIGHT_RED(err))
                self.contributors += ""

        if os.path.exists(changelog_path):
            try:
                with open(changelog_path, "r") as changelog_file:
                    changelog_rawdata = changelog_file.read()

                self.changelog += utils.BOXED_CONTAINER.format(md(changelog_rawdata))
            except Exception as err:
                print(utils.Ansi.LIGHT_RED(err))
                self.changelog += ""

        if os.path.exists(old_changelog_path):
            try:
                with open(old_changelog_path, "r") as old_changelog_file:
                    old_changelog_rawdata = old_changelog_file.read()

                self.changelog += utils.BOXED_CONTAINER.format(
                    md(old_changelog_rawdata))
            except Exception as err:
                print(utils.Ansi.LIGHT_RED(err))
                self.changelog += ""

    def start(self):
        """Start procedure.
        """
        errors = []
        dummy_locale_path = os.path.join(repo_folder, "tmp", "locales", self.xlet_slug)
        po_dir = os.path.join(self.xlet_dir, "po")
        po_files = [entry.path for entry in os.scandir(po_dir) if all(
            (entry.is_file(follow_symlinks=False), entry.name.endswith(".po"))
        )]

        print(utils.Ansi.DEFAULT("Starting temporary installation of locales..."))

        os.makedirs(dummy_locale_path, exist_ok=True)

        for po_file_path in po_files:
            po_file = os.path.basename(po_file_path)
            parts = os.path.splitext(po_file)

            try:
                try:
                    lang_name = locale_list[parts[0]]["name"]
                except Exception:
                    lang_name = ""

                utils.validate_po_file(
                    pofile_path=po_file_path,
                    lang_name=lang_name,
                    xlet_meta=self.xlet_meta,
                    xlet_slug=self.xlet_slug,
                )
            finally:
                self.lang_list.append(parts[0])
                this_locale_dir = os.path.join(dummy_locale_path, parts[0], "LC_MESSAGES")
                os.makedirs(this_locale_dir, exist_ok=True)
                po = cmd_utils.run_cmd(["msgfmt", "-c", po_file_path, "-o",
                                        os.path.join(this_locale_dir, "%s.mo" % self.xlet_slug)],
                                       stdout=None)

                if po.stderr:
                    errors.append(po.stderr.decode("UTF-8"))

        print("Dummy install complete.")

        if len(self.lang_list) > 0:
            translations.store(self.xlet_slug, dummy_locale_path, self.lang_list)

        # Append English to lang_list AFTER storing the translations.
        self.lang_list.append("en")
        self._create_html_document()

        if errors:
            for error in errors:
                sys.stderr.write(error.replace(repo_folder, ""))

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

            section = utils.LOCALE_SECTION.format(
                language_code=current_language,
                hidden="" if current_language == "en" else 'hidden="true"',
                title=md("# %s" % (_("Help for %s") % _(self.xlet_meta["name"]))),
                warning=self._get_warning_block(),
                compatibility=self._get_compatibility_block(),
                content_base=md(self.get_content_base(for_readme=False)),
                content_extra=self.get_content_extra(),
                localization=self._get_localization_block(),
                only_english_alert=self._get_only_english_alert(),
            )

            section = section.replace("{{lhc_lang_id}}", current_language)

            option = self._get_option()

            # option could be None if the the language has no endonym or if the amount
            # of translated strings is lower than 50% of the total translatable strings.
            if option is not None:
                self.sections.append(section)
                self.options.append(option)

        if pyuca_collator is None:
            print(utils.Ansi.LIGHT_YELLOW("<pyuca> module not installed."))

        options_sort_function = pyuca_collator.sort_key if pyuca_collator else str.lower

        html_doc = utils.HTML_DOC.format(
            # This string doesn't need to be translated.
            # It's the initial title of the page that it's always in English.
            title="Help for {xlet_name}".format(xlet_name=self.xlet_meta["name"]),
            # WARNING!!! Insert the inline files (.css and .js) AFTER all string formatting has been done.
            # CSS code interferes with formatting variables. ¬¬
            css_custom=self.get_css_custom(),
            options="\n".join(sorted(self.options, key=options_sort_function)),
            sections="\n".join(self.sections),
            contributors=self.contributors if self.contributors else "",
            changelog=self.changelog if self.changelog else "",
            js_custom=self.get_js_custom()
        )

        print("Saving HELP.html file...")

        utils.save_file(file_path=self.help_file_path,
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

        xlet_help = _("Help")
        xlet_contributors = _("Contributors")
        xlet_changelog = _("Changelog")
        title = _("Help for %s") % _(self.xlet_meta["name"])
        # Define them before self._get_language_stats() is called so these
        # strings are also counted.
        # Comment put bellow so gettext doesn't catch the comments.

        if current_language == "en" or endonym is not None:
            translated_percentage = 100 if current_language == "en" else self._get_language_stats()
            # REMINDER 2: Consider a 95% of translated strings a complete translation.
            # This is done to minimize the display of false percentages in the language selection
            # menu on the HELP.html pages. See REMINDER 1.
            trans_perc_msg = " (%s%%)" % translated_percentage if translated_percentage < 95 else ""

            return utils.OPTION.format(
                endonym=endonym,
                language_name=language_name,
                selected="selected " if current_language == "en" else "",
                language_code=current_language,
                xlet_help=xlet_help,
                xlet_contributors=xlet_contributors,
                xlet_changelog=xlet_changelog,
                title=title,
                translated_percentage=trans_perc_msg
            )
        else:
            return None

    def _get_only_english_alert(self):
        """Get compatibility block.

        Returns
        -------
        str
            A bootstrap panel containing Cinnamon compatibility data.
        """
        return utils.get_bootstrap_alert(
            content=_("The following sections are available only in English.")
        )

    def _get_compatibility_block(self):
        """Get compatibility block.

        Returns
        -------
        str
            A bootstrap panel containing Cinnamon compatibility data.
        """
        min_ver_override = self.xlet_config.get("min_cinnamon_version_override", None)
        max_ver_override = self.xlet_config.get("max_cinnamon_version_override", None)
        min_ver = min_ver_override if min_ver_override else \
            utils.app_data.SUPPORTED_CINNAMON_VERSION_MIN
        max_ver = max_ver_override if max_ver_override else \
            utils.app_data.SUPPORTED_CINNAMON_VERSION_MAX

        if max_ver == utils.app_data.SUPPORTED_CINNAMON_VERSION_MAX and \
                min_ver == utils.app_data.SUPPORTED_CINNAMON_VERSION_MIN:
            body = _("This xlet is compatible with Cinnamon %s up to latest Cinnamon version.") % \
                str(min_ver)
        else:
            body = _("This xlet is compatible with Cinnamon {0} up to {1}.").format(
                str(min_ver), str(max_ver))

        return utils.get_bootstrap_card(
            context="success",
            body_extra_classes="text-font-size-large",
            header=_("Cinnamon compatibility"),
            body=body
        )

    def _get_warning_block(self):
        """Get warning block.

        Returns
        -------
        str
            A bootstrap panel containing generic warnings about xlets.
        """
        body = """<p>{line1}</p>
<p>{line2} <a href="{repo_url}">GitLab</a></p>"""
        return utils.get_bootstrap_card(
            context="warning",
            body_extra_classes="text-font-size-large",
            header=_("Warning"),
            body=body.format(
                line1=_(
                    "Never delete any of the files found inside this xlet folder. It might break this xlet functionality."),
                line2=_(
                    "Bug reports, feature requests and contributions should be done on this xlet's repository linked next."),
                repo_url=utils.app_data.URLS["repo"]
            )
        )

    def _get_localization_block(self):
        """Get localization block

        Returns
        -------
        str
            A bootstrap panel containing xlets localization information.
        """
        body = """{line1}
{line2}"""
        return utils.get_bootstrap_card(
            header=_("Xlets localization"),
            body_extra_classes="text-font-size-large",
            body=body.format(
                line1=md(_(
                    "If this xlet was installed from Cinnamon Settings, all of this xlet's localizations were automatically installed.")),
                line2=md(_("If this xlet was installed manually and not trough Cinnamon Settings, localizations can be installed by executing the script called helper.py from a terminal opened inside the xlet's folder."))
            )
        )

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
