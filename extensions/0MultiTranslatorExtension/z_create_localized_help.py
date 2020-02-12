#!/usr/bin/python3
# -*- coding: utf-8 -*-

import os
import sys

xlet_dir = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
xlet_slug = os.path.basename(xlet_dir)
repo_folder = os.path.normpath(os.path.join(xlet_dir, *([".."] * 2)))
app_folder = os.path.join(repo_folder, "__app__")

if app_folder not in sys.path:
    sys.path.insert(0, app_folder)

from python_modules.localized_help_creator import LocalizedHelpCreator
from python_modules.localized_help_creator import _
from python_modules.localized_help_creator import md
from python_modules.localized_help_creator import utils


class Main(LocalizedHelpCreator):

    def __init__(self, *args):
        super().__init__(*args)

    def get_content_base(self, for_readme):
        return "\n".join([
            "## %s" % _("Description"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("The Multi Translator extension is an extension ported from a gnome-shell extension called [Text Translator](https://github.com/gufoe/text-translator) by [gufoe](https://github.com/gufoe). It provides translation of text by different translation providers (currently [Google](https://translate.google.com), [Yandex](https://translate.yandex.net), [Bing](https://www.bing.com/translator), and [Apertium](https://www.apertium.org))."),
            "",
            "## %s" % _("Dependencies"),
            "",
            utils.get_bootstrap_alert(
                context="info",
                heading=_("All dependencies are optional"),
                content=md("\n".join([
                    "- %s" % _("If the xsel command is missing, one cannot directly perform translations from selected text."),
                    "- %s" % _("If the trans command is missing, one cannot use translation engines that make use of translate-shell."),
                ]))
            ),
            "",
            # TO TRANSLATORS: Do not translate the word "xsel".
            "- **%s**: %s" % (_("xsel command"),
                              _("XSel is a command-line program for getting and setting the contents of the X selection.")),
            # TO TRANSLATORS: Do not translate the word "trans".
            "- **%s**: %s" % (_("trans command"),
                              _("Command provided by the package translate-shell. Is a simple command line interface for several translation providers (Google Translate, Yandex Translate, Bing Translate and Apertium) which allows you to translate strings in your terminal.")),
            "    - [%s](https://github.com/soimort/translate-shell#dependencies)" % _(
                "Check translate-shell dependencies."),
            "    - [%s](https://github.com/soimort/translate-shell#recommended-dependencies)" % _(
                "Check translate-shell recommended dependencies."),
            "",
            utils.get_bootstrap_alert(
                context="warning",
                content=_("The translate-shell package available on Ubuntu 16.04.x/Linux Mint 18.x repositories is outdated and broken. It can be installed anyway so it will also install its dependencies. But updating to the latest version should be done as described bellow.")
            ),
            "",
        ])

    def get_content_extra(self):
        return md("{}".format("\n".join([
            "### %s" % _("How to install latest version of translate-shell"),
            "#### %s" % _("Option 1. Direct Download"),
            _("This method will only install the trans script into the specified locations."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("For the current user only. **~/.local/bin** needs to be in your PATH."),
            "",
            """```shell
$ wget -O ~/.local/bin/trans git.io/trans && chmod ugo+rx ~/.local/bin/trans
```""",
            "",
            _("For all users without overwriting the installed version."),
            "",
            """```shell
$ sudo wget -O /usr/local/bin/trans git.io/trans && sudo chmod ugo+rx /usr/local/bin/trans
```""",
            "",
            "#### %s" %
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("Option 2. From Git - [More details](https://github.com/soimort/translate-shell/blob/develop/README.md#option-3-from-git-recommended-for-seasoned-hackers)"),
            _("This method will not just install the trans script but also its man pages. Refer to the link above for more installation details."),
            "",
            """```shell
$ git clone https://github.com/soimort/translate-shell
$ cd translate-shell
$ make
$ sudo make install
```""",
            "",
            "## %s" % _("Extension usage"),
            _("Once installed and enabled, the following shortcuts will be available."),
            "### %s" % _("Global keyboard shortcuts"),
            "",
            "These shortcuts are empty by default and need to be configured from the extension settings window."
            "",
            "1. %s" % _("Open translator dialog."),
            "2. %s" % _("Open translator dialog and translate text from clipboard."),
            "3. %s" % _("Open translator dialog and translate from primary selection."),
            "",
            "### %s" % _("Keyboard shortcuts available on the translation dialog"),
            "",
            "- **[[F1]]**: %s" % _("Show help dialog."),
            "- **[[%s]] + [[%s]]**: %s." % (
                _("Ctrl"),
                _("Enter"),
                _("Translate text")
            ),
            "- **[[%s]] + [[%s]]**: %s" % (
                _("Shift"),
                _("Enter"),
                _("Force text translation. Ignores translation history.")
            ),
            "- **[[%s]] + [[%s]] + [[C]]**: %s" % (
                _("Ctrl"),
                _("Shift"),
                _("Copy translated text to clipboard.")
            ),
            "- **[[%s]] + [[S]]**: %s." % (
                _("Ctrl"),
                _("Swap languages")
            ),
            "- **[[%s]] + [[R]]**: %s" % (
                _("Ctrl"),
                _("Reset languages to default.")
            ),
            "- **[[%s]] + [[P]]**: %s." % (
                _("Ctrl"),
                _("Provider selector menu")
            ),
            "- **[[%s]] + [[M]]**: %s." % (
                _("Ctrl"),
                _("Main menu")
            ),
            "- **[[%s]]**: %s" % (
                _("Escape"),
                _("Close dialog.")
            ),
            "",
            "## %s" % _("Translation history"),
            "",
            utils.get_bootstrap_alert(
                context="warning",
                content=_(
                    "NEVER edit the translation history file manually!!! Always use the translation history window to import/export/clear the history.")
            ),
            "",
            utils.get_image_container(
                src="assets/images/translation-history.png",
                alt=_("Translation history window.")
            ),
            "",
            "",
            "- %s" % _("The main purpose of the translation history is to avoid or at the very least minimize possible abuses while using a translation provider service."),
            "    - %s" % _("If the Google Translate service is \"abused\", Google may block temporarily your IP. Or what is worse, they could change the translation mechanism making this extension useless and forcing me to update its code."),
            "    - %s" % _("If the Yandex Translate service is \"abused\", you are \"wasting\" your API keys quota and they will be blocked (temporarily or permanently)."),
            "- %s" % _("The translation history can be accessed from the main menu found in the translation dialog."),
            "",
            "## %s" % _("GUI theme"),
            "",
            utils.get_image_container(
                src="assets/images/translation-dialog.png",
                alt=_("Translation dialog.")
            ),
            "",
            "- %s" % _("This extension supports custom themes to style its GUI (the translation dialog)."),
            "- %s" % _("The default theme (found in EXTENSION_FOLDER/themes/default.css) only sets a generic styling to accommodate the elements in the GUI."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("To use a custom theme, just set the **Dialog theme** option to **Custom** and set the **Custom theme path** option to point to a style sheet file."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("To create a custom theme, just make a copy of the default theme file anywhere on the file system, **except** inside the extension folder. The default theme file has the complete list of CSS classes and IDs used by this extension."),
            "- %s" % _("For the custom theme changes to be reflected while the theme file is modified, either Cinnamon can be restarted or the Cinnamon theme can be reloaded."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _(
                "Cinnamon provides a command to reload its theme. Just open the **Run command** dialog ([[Alt]] + [[F2]]), type **rt** and press [[Enter]]."),
            "",
            "## %s" % _("How to get Yandex translator API keys"),
            "",
            "- %s" % _("Visit one of the following links and register a Yandex account (or use one of the available social services)."),
            # TO TRANSLATORS: URL pointing to website in English
            "    - %s: %s" % (_("English"), "https://tech.yandex.com/keys/get/?service=trnsl"),
            # TO TRANSLATORS: URL pointing to website in Russian
            "    - %s: %s" % (_("Russian"), "https://tech.yandex.ru/keys/get/?service=trnsl"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("Once you successfully finish creating your Yandex account, you can visit the link provided several times to create several API keys. **DO NOT ABUSE!!!**"),
            "- %s" % _("Once you have several API keys, you can add them to Multi Translator's settings window (one API key per line)."),
            "",
            "### %s" % _("Important notes about Yandex API keys"),
            "",
            "- %s" % _("The API keys will be stored into a preference. Keep your API keys backed up in case you reset Multi Translator's preferences."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**NEVER make your API keys public!!!** The whole purpose of going to the trouble of getting your own API keys is that the only one \"consuming their limits\" is you and nobody else."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("With each Yandex translator API key you can translate **UP TO** 1.000.000 (1 million) characters per day **BUT NOT MORE** than 10.000.000 (10 millions) per month."),
            "",
            "## %s" % _("Custom xlet settings system"),
            "",
            _("This xlet uses a custom application to handle its settings. Cinnamon's native settings system handles external applications for xlets settings in a very limited way. To work around these limitations, I put in place different mechanisms depending on the xlet type."),
            "",
            "- **%s:** %s" % (
                _("Applets"),
                # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                _("The **Configure...** context menu item is overridden so it opens the proper settings application.")
            ),
            "- **%s:** %s" % (
                _("Extensions"),
                # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                _("A shortcut (a .desktop file) to open the proper settings application is automatically generated upon enabling the extension and it is removed when the extension is disabled. The .desktop file is created at **~/.local/share/applications**, so it will make the shortcut available in your applications menu inside the **Preferences** category.")
            ),
            "- **%s:** %s" % (
                _("For all xlets types"),
                # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                _("If the *wrong* settings window is opened, a button to open the *right* settings window will be available.")
            ),
            ""
        ])
        ))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


def main():
    m = Main(xlet_dir, xlet_slug)
    return m.start()


if __name__ == "__main__":
    sys.exit(main())
