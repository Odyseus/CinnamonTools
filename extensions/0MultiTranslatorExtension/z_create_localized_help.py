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


class Main(LocalizedHelpCreator):

    def __init__(self, *args):
        super().__init__(*args)

    def get_content_base(self, for_readme):
        return "\n".join([
            "## %s" % _("Description"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("The Multi Translator extension is an extension ported from a gnome-shell extension called [Text Translator](https://github.com/gufoe/text-translator) by [gufoe](https://github.com/gufoe). It provides translation of text by different translation providers (currently [Google](https://translate.google.com), [Yandex](https://translate.yandex.net), [Bing](https://www.bing.com/translator), [Apertium](https://www.apertium.org) and [Transltr](http://transltr.org))."),
            "",
            "## %s" % _("Dependencies"),
            "",
            "**%s**" % _("If one or more of these dependencies are missing in your system, you will not be able to use this extension."),
            "",
            "- %s %s" % (_("xsel command:"),
                         _("XSel is a command-line program for getting and setting the contents of the X selection.")),
            "- %s %s" % (_("trans command:"),
                         _("Command provided by the package translate-shell. Is a simple command line interface for several translation providers (Google Translate, Yandex Translate, Bing Translate and Apertium) which allows you to translate strings in your terminal.")),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    - %s" % _("Check translate-shell [dependencies](https://github.com/soimort/translate-shell#dependencies) and [recommended dependencies](https://github.com/soimort/translate-shell#recommended-dependencies)."),
            "",
            "**%s** %s" % (_("Note:"), _("The translate-shell package available on Ubuntu 16.04.x/Linux Mint 18.x repositories is outdated and broken. It can be installed anyway so it will also install its dependencies. But updating to the latest version should be done as described bellow.")),
        ])

    def get_content_extra(self):
        return md("{}".format("\n".join([
            "## %s" % _("How to install latest version of translate-shell"),
            "### %s" % _("Option 1. Direct Download"),
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
            "### %s" %
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
            "### %s" % _("Global shortcuts (configurable from the extension settings)"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**[[Super]] + [[T]]:** Open translator dialog."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**[[Super]] + [[Shift]] + [[T]]:** Open translator dialog and translate text from clipboard."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**[[Super]] + [[Alt]] + [[T]]:** Open translator dialog and translate from primary selection."),
            "",
            "### %s" % _("Shortcuts available on the translation dialog"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**[[Ctrl]] + [[Enter]]:** Translate text."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**[[Shift]] + [[Enter]]:** Force text translation. Ignores translation history."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**[[Ctrl]] + [[Shift]] + [[C]]:** Copy translated text to clipboard."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**[[Ctrl]] + [[S]]:** Swap languages."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**[[Ctrl]] + [[D]]:** Reset languages to default."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**[[Escape]]:** Close dialog."),
            "",
            "## %s" % _("Xlet's settings window"),
            _("From this xlet settings window, all options can be imported, exported and/or reseted to their defaults."),
            "",
            "- %s" % _("To be able to perform any of these actions, the settings schema needs to be installed in the system. This is done automatically when the xlet is installed from the Cinnamon xlets manager. But if the xlet was installed manually, the settings schema also needs to be installed manually. This is achieved by simply going to the xlet folder and launch the following command:"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    - %s %s" % (_("Command to install the settings schema:"),
                             "`./settings.py install-schema`"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    - %s %s" % (_("Command to uninstall the settings schema:"),
                             "`./settings.py remove-schema`"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("To import/export settings, the **dconf** command needs to be available on the system."),
            "",
        ])
        ))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
