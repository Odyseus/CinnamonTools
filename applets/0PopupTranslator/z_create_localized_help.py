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
            _("Simple translator applet that will allow to display the translation of any selected text from any application on a system in a popup."),
            "",
            "## %s" % _("Dependencies"),
            "",
            "**%s**" % _("If one or more of these dependencies are missing in your system, you will not be able to use this applet."),
            "",
            "### %s" % _("xsel command"),
            "",
            _("XSel is a command-line program for getting and setting the contents of the X selection."),
            "",
            "- %s %s" % (
                _("Debian and Archlinux based distributions:"),
                # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                _("The package is called **xsel**.")
            ),
            "",
            "### %s" % _("xdg-open command"),
            "",
            _("Open a URI in the user's preferred application that handles the respective URI or file type."),
            "",
            "- %s %s %s" % (
                _("Debian and Archlinux based distributions:"),
                # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                _("This command is installed with the package called **xdg-utils**."),
                _("Installed by default in modern versions of Linux Mint.")
            ),
            "",
            "### %s" % "Python 3",
            "",
            _("It should come already installed in all Linux distributions."),
            "",
            "### %s" % _("requests Python 3 module"),
            "",
            _("Requests allow you to send HTTP/1.1 requests. You can add headers, form data, multi-part files, and parameters with simple Python dictionaries, and access the response data in the same way. It's powered by httplib and urllib3, but it does all the hard work and crazy hacks for you."),
            "",
            "- %s %s %s" % (
                _("Debian and Archlinux based distributions:"),
                # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                _("This command is installed with the package called **xdg-utils**."),
                _("Installed by default in modern versions of Linux Mint.")
            ),
            "- %s %s %s" % (
                _("Debian based distributions:"),
                # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                _("The package is called **python3-requests**."),
                _("Installed by default in modern versions of Linux Mint.")
            ),
            "- %s %s" % (
                _("Archlinux based distributions:"),
                # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                _("The package is called **python-requests**.")
            ),
            "",
            "**%s**" % _("After installing any of the missing dependencies, Cinnamon needs to be restarted"),
            "",
            "**%s** %s" % (_("Note:"), _("I don't use any other type of Linux distribution (Gentoo based, Slackware based, etc.). If any of the previous packages/modules are named differently, please, let me know and I will specify them in this help file.")),
        ])

    def get_content_extra(self):
        return md("{}".format("\n".join([
            "## %s" % _("Translation history window"),
            "",
            utils.get_image_container(
                src="./assets/images/translation-history-window.png",
                alt=_("Translation history window")
            ),
            "",
            "## %s" % _("Usage"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("There are 4 *translations mechanisms* (**Left click**, **Middle click**, **Hotkey #1** and **Hotkey #2**). Each translation mechanism can be configured with their own service providers, language pairs and hotkeys."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**First translation mechanism (Left click):** Translates any selected text from any application on your system. A hotkey can be assigned to perform this task."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**First translation mechanism ([[Ctrl]] + Left click):** Same as **Left click**, but it will bypass the translation history. A hotkey can be assigned to perform this task."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**Second translation mechanism (Middle click):** Same as **Left click**."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _(
                "**Second translation mechanism ([[Ctrl]] + Middle click):** Same as [[Ctrl]] + **Left click**."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**Third translation mechanism (Hotkey #1):** Two hotkeys can be configured to perform a translation and a forced translation."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**Fourth translation mechanism (Hotkey #2):** Two hotkeys can be configured to perform a translation and a forced translation."),
            "",
            _("All translations are stored into the translation history. If a string of text was already translated in the past, the popup will display that stored translated text without making use of the provider's translation service."),
            "",
            "## %s" % _("About translation history"),
            "",
            _("I created the translation history mechanism mainly to avoid the abuse of the translation services."),
            "",
            "- %s" % _("If the Google Translate service is \"abused\", Google may block temporarily your IP. Or what is worse, they could change the translation mechanism making this applet useless and forcing me to update its code."),
            "- %s" % _("If the Yandex Translate service is \"abused\", you are \"wasting\" your API keys quota and they will be blocked (temporarily or permanently)."),
            "",
            _("In the context menu of this applet is an item that can open the folder were the translation history file is stored. From there, the translation history file can be backed up or deleted."),
            "",
            "**%s**" % _("NEVER edit the translation history file manually!!!"),
            "",
            "**%s**" % _("If the translation history file is deleted/renamed/moved, Cinnamon needs to be restarted."),
            "",
            "## %s" % _("How to get Yandex translator API keys"),
            "",
            "- %s" % _("Visit one of the following links and register a Yandex account (or use one of the available social services)."),
            # TO TRANSLATORS: URL pointing to website in English
            "    - %s" % (_("English:") + " " + "https://tech.yandex.com/keys/get/?service=trnsl"),
            # TO TRANSLATORS: URL pointing to website in Russian
            "    - %s" % (_("Russian:") + " " + "https://tech.yandex.ru/keys/get/?service=trnsl"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("Once you successfully finish creating your Yandex account, you can visit the link provided several times to create several API keys. **DO NOT ABUSE!!!**"),
            "- %s" % _("Once you have several API keys, you can add them to Popup Translator's settings window (one API key per line)."),
            "",
            "### %s" % _("Important notes about Yandex API keys"),
            "",
            "- %s" % _("The API keys will be stored into a preference. Keep your API keys backed up in case you reset Popup Translator's preferences."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**NEVER make your API keys public!!!** The whole purpose of going to the trouble of getting your own API keys is that the only one \"consuming their limits\" is you and nobody else."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("With each Yandex translator API key you can translate **UP TO** 1.000.000 (1 million) characters per day **BUT NOT MORE** than 10.000.000 (10 millions) per month."),
        ])
        ))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
