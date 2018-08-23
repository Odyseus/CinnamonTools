#!/usr/bin/python3
# -*- coding: utf-8 -*-

import sys
import os

xlet_dir = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))

xlet_slug = os.path.basename(xlet_dir)

repo_folder = os.path.normpath(os.path.join(xlet_dir, *([".."] * 2)))

app_folder = os.path.join(repo_folder, "__app__")

if app_folder not in sys.path:
    sys.path.insert(0, app_folder)


from python_modules.localized_help_creator import LocalizedHelpCreator, _, md


class Main(LocalizedHelpCreator):

    def __init__(self, xlet_dir, xlet_slug):
        super(Main, self).__init__(xlet_dir, xlet_slug)

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
            "### %s" % _("Python 3"),
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
            '<img class="translation-history-window" alt="%s">' % _("Translation history window"),
            "",
            "## %s" % _("Usage"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("There are 4 *translations mechanisms* (**Left click**, **Middle click**, **Hotkey #1** and **Hotkey #2**). Each translation mechanism can be configured with their own service providers, language pairs and hotkeys."),
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
            _("All translations are stored into the translation history. If a string of text was already translated in the past, the popup will display that stored translated text without making use of the provider's translation service."),
            "",
            "## %s" % _("About translation history"),
            _("I created the translation history mechanism mainly to avoid the abuse of the translation services."),
            "",
            "- %s" % _("If the Google Translate service is \"abused\", Google may block temporarily your IP. Or what is worse, they could change the translation mechanism making this applet useless and forcing me to update its code."),
            "- %s" % _("If the Yandex Translate service is \"abused\", you are \"wasting\" your API keys quota and they will be blocked (temporarily or permanently)."),
            _("In the context menu of this applet is an item that can open the folder were the translation history file is stored. From there, the translation history file can be backed up or deleted."),
            "",
            "**%s**" % _("NEVER edit the translation history file manually!!!"),
            "",
            "**%s**" % _("If the translation history file is deleted/renamed/moved, Cinnamon needs to be restarted."),
            "",
            "## %s" % _("How to get Yandex translator API keys"),
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
        return """
Array.prototype.slice.call(document.getElementsByClassName("translation-history-window")).forEach(function(aEl) {
    aEl.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyIAAAJyCAMAAAAPaoQvAAADAFBMVEX////////+/v79/f36+vr29vb29vb29vb19fX09PTz8/Px8fHw8PDu7u7t7e3r6+vq6uro6Ojm5ubl5eXk5OTj4+Pi4uLh4eHg4ODf39/f39/e3t7d3d3d3d3c3Nzb29vb29va2tra2trZ2dnZ2dnY2NjY2NjX19fX19fW1tbW1tbV1dXV1dXU1NTT09PS0tLQ0NDOzs7Ozs7MzMzLy8vJycnIyMjHx8fGxsbFxcXExMTDw8PCwsLBwcHAwMC/v7++vr68vLy6urq5ubm4uLi3t7e2tra1tbWzs7Ozs7OxsbGwsLCurq6tra2srKyqqqqpqamnp6enp6elpaWjo6OhoaGgoKCfn5+dnZ2cnJybm5uampqZmZmYmJiXl5eXl5eWlpaWlpaVlZWVlZWUlJSTk5OSkpKRkZGQkJCPj4+Ojo6NjY2MjIyLi4uLi4uJiYmIiIiHh4eGhoaFhYWEhISDg4OCgoKBgYGAgIB/f39+fn5+fn59fX18fHx7e3t6enp5eXl4eHh3d3d2dnZ1dXV0dHRzc3NycnJxcXFwcHBvb29ubm5sbGxra2tqamppaWlnZ2dmZmZlZWVkZGRjY2NiYmJgYGBfX19dXV1bW1taWlpZWVlYWFhXV1dWVlZVVVVUVFRTU1NSUlJRUVFQUFBOTk5MTExMTExKSkpJSUlISEhHR0dGRkZFRUVERERDQ0NBQUFAQEA/Pz8+Pj49PT08PDw7Ozs6Ojo6Ojo5OTk4ODg4ODg3Nzc2NjY2NjY1NTU1NTUzMzMzMzMyMjIxMTEwMDAwMDAvLy8vLy8uLi4tLS0tLS0sLCwsLCwrKysqKioqKiopKSkoKCgoKCgnJycmJiYlJSUlJSUkJCQkJCQjIyMiIiIiIiIiIiIhISEfHx8RERHh4eHi4uLj4+Pk5OTl5eXm5ubn5+fo6Ojp6enq6urr6+vs7Ozt7e3u7u7v7+/w8PDx8fHy8vLz8/P09PT19fX29vb39/f4+Pj5+fn6+vr7+/v8/Pz9/f3+/v7///861oUqAAABAHRSTlP///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AU/cHJQAAAAlwSFlzAAALEwAACxMBAJqcGAAAUqpJREFUeAHs1v1PE1kXB3CGdok71NJS+jK5kzuZkGCMWSmuisFFWha3vEReRB+xvRpi1l0KSTeLW3kMWGSpZcrt+Zvdc2kdBzqQbkrMJp7PD3PvPfec+1O/SXs+ocPi+hmEkM3DTwgjUnnQrxFC2oQmKyoi78N6NEYIaRMNRyoYkSl9iBDiL/Op5zAUHSKE+DOrPVtanBBynmLPeiBxHkLIes968KJ7QigifcnzEEIwInrqP4XIesctrPLeSF0WcmeepVLG7HjKCyMS8hxvPhcn8qOpDpF3AM7bmY5aS3Bi8uIu6aRc1x9fv6jFePXS29kxIkR7LZ0XOYPNiXz6TETCxhexG+LEDzGjQ6QMT/5Xb0wYHZheKcCHlZUbxoWkY7iWIO3bUmtt+q54OztGhGivxTJC5OaEyMS8VYxIhHkMTAmUDbNOkTKk9Bwss/RGtb41xpj882n17wVmQpWxBXjqFlBYvw5FXY8zWZitrrHZnXptYxQbNvKHNcEZf3YoK6tMOuzz1aNjABhzn26OIbm/WqsVTNzUW1N+nW8hy1gFxhlpIwRrY+iTAk3qBvPAiESZV2hJiOUQ6xgpwyhbgXlrF9aeNfaHmYRXU/swzuCAsYcYHbeg3IZNhmRNbmdZ9nV2DX5TDVuTO5BjM1DKPPlFReTz1fgu5O6b7tPNMSTh3aMDnMDe1pRf5yQU2F3YHmLktIJoYmf1Lwmx2M8Ub0SGTC8WWXseNcyOkTK8LMr6yBT8qut5mDElhAemYdWEA9PEiJhuQbkDm2qRMBocMCNXwlHYVafoQAYbJuDDTHjAlI75+SpaAnvA8DytxpCEwZB6EntbU36dsVrNXoWs+c0SLWfrhXPqfFageW56YUSS/JTEyLU4J50rA9SKw4kcrHK+BHNcHjM+BWscDjifhWXuFhSMCOeq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");
});
"""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
