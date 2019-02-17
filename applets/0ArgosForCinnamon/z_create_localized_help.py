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
            _("Argos for Cinnamon is an applet that turns executables' standard output into panel dropdown menus. It is inspired by, and fully compatible with, the Gnome Shell extension called [Argos](https://github.com/p-e-w/argos) by [Philipp Emanuel Weidmann](https://github.com/p-e-w), which in turn is inspired by, and fully compatible with, the [BitBar](https://github.com/matryer/bitbar) application for macOS. Argos for Cinnamon supports many [BitBar plugins](https://github.com/matryer/bitbar-plugins) without modifications, giving you access to a large library of well-tested scripts in addition to being able to write your own."),
            "",
            "## %s" % _("Key features"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            ("- %s %s" % (
                _("**100% API compatible with BitBar 1.9.2:** All BitBar plugins that run on Linux (i.e. do not contain macOS-specific code) will work with Argos (else it's a bug)."),
                _("See %s.") % (
                    "**[%s](#bitbar-plugins-with-argos-for-cinnamon-{{lhc_lang_id}})**" % _("BitBar plugins with Argos for Cinnamon"))
            )).strip(),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**Beyond BitBar:** Argos can do everything that BitBar can do, but also some things that BitBar can't do (yet). See the documentation for details."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**Sophisticated asynchronous execution engine:** No matter how long your scripts take to run, Argos will schedule them intelligently and prevent blocking."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" %
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("**Unicode support:** Just print your text to stdout. It will be rendered the way you expect."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("**Optimized for minimum resource consumption:** Even with multiple plugins refreshing every second, Argos typically uses less than 1 percent of the CPU."),
            ("- **%s** %s" % (
                _("Fully documented:"),
                # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                md(_("See %s.") % ("**[%s](#usage-{{lhc_lang_id}})**" % _("Usage")))
            )).strip(),
            "",
            "## %s" % _("Dependencies"),
            "",
            "- **%s:** %s" % (_("xdg-open command"),
                              ("Open a URI in the user's preferred application that handles the respective URI or file type.")),
            "    - %s %s %s" % (_("Debian and Archlinux based distributions:"),
                                _("This command is installed with the package called **xdg-utils**."),
                                _("Installed by default in modern versions of Linux Mint.")),
            "\n"
        ])

    def get_content_extra(self):
        return md("{}".format("\n".join([
            '<span id="usage-{{lhc_lang_id}}"></span>',
            "## %s" % _("Usage"),
            "",
            utils.get_bootstrap_alert(
                content=md(
                    _("I will use the words *plugin* or *script* when referring to a script file associated with an instance of **Argos for Cinnamon** applet."))
            ),
            "",
            _("After placing a new instance of **Argos for Cinnamon** into a panel, one of the example scripts provided by this applet will be automatically attached to it and a menu will be created based on the output of the executed plugin. These example scripts contain various examples of what **Argos for Cinnamon** can do."),
            "",
            _("A just placed applet will have an initial execution interval of 0 seconds (zero seconds) and an initial applet text rotation interval of 3 seconds (three seconds). The execution interval is set to 0 seconds because the initial example script doesn't have any dynamic data that requires update. And the applet text rotation interval is set to 3 seconds so the text rotation of the example script can be seen in action."),
            "",
            _("For scripts that display non dynamic data, it isn't needed an execution interval. But if your script displays dynamic data (a clock for example), then an execution and/or applet text rotation interval needs to be specified. Both of these values can be set from the applet context menu."),
            "",
            utils.get_bootstrap_alert(
                content=md(_("The three example scripts provided by this applet will produce the exact same output, but they are created using three different languages (**bash_examples.bash**, **python_examples.py** and **ruby_examples.rb**)."))
            ),
            "",
            utils.get_bootstrap_alert(
                context="warning",
                content="<strong>%s</strong>" % _(
                    "Never save your custom plugins/scripts inside this applet folder. Otherwise, you will loose them all when there is an update for the applet.")
            ),
            "",
            "### %s" % _("File name format"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("**Argos for Gnome Shell** parses the script's file name to extract certain set of preferences. **Argos for Cinnamon** doesn't parse the script's file name in such way (nor in any other way). All the applet settings can be set from the applet settings window and/or from the applet context menu."),
            "### %s" % _("Output format"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("Argos plugins are executables (such as shell scripts **(*)**) that print to standard output lines of the following form:"),
            """```
    TEXT | ATTRIBUTE_1=VALUE ATTRIBUTE_2=VALUE ...
    ```""",
            "",
            _("All attributes are optional, so the most basic plugins simply print lines consisting of text to be displayed. To include whitespace, attribute values may be quoted using the same convention employed by most command line shells."),
            "",
            utils.get_bootstrap_alert(
                content="<strong>%s</strong>" % _(
                    "(*) Not just shell scripts, but also python scripts, ruby scripts or any other script in any other language that can print to standard output.")
            ),
            "",
            "### %s" % _("Rendering"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("Lines containing only dashes (`---`) are *separators*."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("Lines above the first separator belong to the applet button itself. If there are multiple such lines, they are displayed in succession, each of them for a configurable amount of time (rotation interval) before switching to the next. Additionally, all button lines get a dropdown menu item, except if their `dropdown` attribute is set to `false`."),
            "",
            _("Lines below the first separator are rendered as dropdown menu items. Further separators create graphical separator menu items."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("Lines beginning with `--` are rendered in a submenu associated with the preceding unindented line. **Argos for Cinnamon** supports unlimited number of nested submenus."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("[Emoji codes](http://www.emoji-cheat-sheet.com) like `:horse:` and `:smile:` in the line text are replaced with their corresponding Unicode characters (unless the `emojize` attribute is set to `false`). Note that unpatched Cinnamon does not yet support multicolor emoji."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("[ANSI SGR escape sequences](https://en.wikipedia.org/wiki/ANSI_escape_code#graphics) and [Pango markup](https://developer.gnome.org/pango/stable/PangoMarkupFormat.html) tags may be used for styling. This can be disabled by setting the `ansi` and `useMarkup` attributes, respectively, to `false`."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("Backslash escapes such as `\\n` and `\\t` in the line text are converted to their corresponding characters (newline and tab in this case), which can be prevented by setting the `unescape` attribute to `false`. Newline escapes can be used to create multi-line menu items."),
            "",
            "## %s" % _("Line attributes"),
            "",
            "### %s" % _("Display"),
            _("Control how the line is rendered."),
            "",
            "| %s | %s | %s |" % (_("Attribute"), _("Value"), _("Description")),
            "| --- | --- | --- |",
            "| `color` | %s | %s |" % (_("Hex RGB/RGBA or color name"),
                                       _("Sets the text color for the item.")),
            "| `font` | %s | %s |" % (_("Font name"), _("Sets the font for the item.")),
            "| `size` | %s | %s |" % (_("Font size in points"), _(
                "Sets the font size for the item.")),
            "| `iconName` | %s | %s |" % (_("Icon name"),
                                          # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                                          _("Sets a menu icon for the item. See the [freedesktop.org icon naming specification](https://specifications.freedesktop.org/icon-naming-spec/icon-naming-spec-latest.html) for a list of names that should work anywhere, or run [gtk3-icon-browser](https://developer.gnome.org/gtk3/unstable/gtk3-icon-browser.html) to see the names of all icons in your current icon theme. **Argos only**. **Argos for Cinnamon** also supports a path to an icon file (paths starting with `~/` will be expanded to the user's home folder).")),
            "| `image`, `templateImage` | %s | %s |" % (_("Base64-encoded image file"),
                                                        # TO TRANSLATORS: MARKDOWN string. Respect
                                                        # formatting.
                                                        _("Renders an image inside the item. The image is positioned to the left of the text and to the right of the icon. Cinnamon does not have a concept of *template images*, so `image` and `templateImage` are interchangeable in Argos.")),
            "| `imageWidth`, `imageHeight` | %s | %s |" % (_("Width/height in pixels"),
                                                           # TO TRANSLATORS: MARKDOWN string. Respect
                                                           # formatting.
                                                           _("Sets the dimensions of the image. If only one dimension is specified, the image's original aspect ratio is maintained. **Argos only**.")),
            "| `length` | %s | %s |" % (_("Length in characters"), _(
                "Truncate the line text to the specified number of characters, ellipsizing the truncated part.")),
            "| `trim` | **[(2)](#about-boolean-attributes-{{lhc_lang_id}})** %s | %s %s |" %
            (_("Boolean value"),
             _("If disabled, preserve leading and trailing whitespace of the line text."), _("Enabled by default if not specified.")),
            "| `dropdown` | **[(2)](#about-boolean-attributes-{{lhc_lang_id}})** %s | %s %s |" %
            (_("Boolean value"),
             _("If disabled and the line is a button line (see above), exclude it from being displayed in the dropdown menu."), _("Enabled by default if not specified.")),
            "| `alternate` | **[(2)](#about-boolean-attributes-{{lhc_lang_id}})** %s | %s |" %
            (_("Boolean value"),
             # TO TRANSLATORS: MARKDOWN string. Respect formatting.
             _("If enabled, the item is hidden by default, and shown in place of the preceding item when the [[Alt]] key is pressed.")),
            "| `emojize` | **[(2)](#about-boolean-attributes-{{lhc_lang_id}})** %s | %s %s |" %
            (_("Boolean value"),
             # TO TRANSLATORS: MARKDOWN string. Respect formatting.
             _("If disabled, disable substitution of `:emoji_name:` with emoji characters in the line text."), _("Enabled by default if not specified.")),
            "| `ansi` | **[(2)](#about-boolean-attributes-{{lhc_lang_id}})** %s | %s %s |" %
            (_("Boolean value"),
             _("If disabled, disable interpretation of ANSI escape sequences in the line text."), _("Enabled by default if not specified.")),
            "| `useMarkup` | **[(2)](#about-boolean-attributes-{{lhc_lang_id}})** %s | %s %s |" %
            (_("Boolean value"),
             _("If disabled, disable interpretation of Pango markup in the line text. **Argos only**."), _("Enabled by default if not specified.")),
            "| `unescape` | **[(2)](#about-boolean-attributes-{{lhc_lang_id}})** %s | %s %s |" %
            (_("Boolean value"),
             # TO TRANSLATORS: MARKDOWN string. Respect formatting.
             _("If disabled, disable interpretation of backslash escapes such as `\\n` in the line text. **Argos only**."), _("Enabled by default if not specified.")),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("Attributes available on **Argos for Cinnamon** only."),
            "",
            "| %s | %s | %s |" % (_("Attribute"), _("Value"), _("Description")),
            "| --- | --- | --- |",
            "| `tooltip` | %s | %s |" % (_("Text to display as toolip"),
                                         _("Sets the tooltip for the item.")),
            "| `iconSize` | %s | %s |" % (_("An integer from 12 to 512"),
                                          # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                                          _("Sets the size for the menu item's icon if any. The size for menu item icons can be defined globally in the settings of an instance of Argos for Cinnamon.")),
            "| `iconIsSymbolic` | **[(2)](#about-boolean-attributes-{{lhc_lang_id}})** %s | %s |" %
            (_("Boolean value"),
             # TO TRANSLATORS: MARKDOWN string. Respect formatting.
             _("If enabled, the symbolic version of `iconName` will be used on the item (if exists). This attribute is ignored if the icon defined in `iconName` is a path to an icon file.")),
            "### %s" % _("Actions"),
            _("Define actions to be performed when the user clicks on the line's menu item."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("Action attributes are *not* mutually exclusive. Any combination of them may be associated with the same item, and all actions are executed when the item is clicked."),
            "",
            "| %s | %s | %s |" % (_("Attribute"), _("Value"), _("Description")),
            "| --- | --- | --- |",
            "| `command`, `bash` | %s | **[(1)](#about-command-bash-attributes-{{lhc_lang_id}})** %s |" % (_("A command to execute"), _(
                "Runs a command using a default shell specified in the options of an instance of Argos for Cinnamon or specified by the `shell` attribute.")),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "| `shell` | %s | %s |" % (_("Path or executable name of a shell program"), _(
                "This attribute overrides the default shell set on the settings of an instance of Argos for Cinnamon. This attribute should only be used if one decides to use different shells to execute commands whithin the menu created by an instance of Argos for Cinnamon.")),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "| `shellArgument` | %s | %s |" % (_("Argument to pass to a shell program"), _(
                "The argument used by a shell program that allows to execute a command. In most shells is '-c'. This attribute overrides the shell argument set on the settings of an instance of Argos for Cinnamon. This attribute should only be used if the shell argument set on the settings of an instance of Argos for Cinnamon isn't compatible with the shell specified in the `shell` attribute.")),
            "| `terminal` | **[(2)](#about-boolean-attributes-{{lhc_lang_id}})** %s | %s |" %
            (_("Boolean value"),
             # TO TRANSLATORS: MARKDOWN string. Respect formatting.
             _("If disabled, runs the command specified in the `command` or `bash` attributes in the background (i.e. without opening a terminal window). If enabled, a terminal will be opened to execute a command and will be kept open.")),
            "| `param1`, `param2`, ... | %s | %s |" % (_("Command line arguments"),
                                                       # TO TRANSLATORS: MARKDOWN string. Respect
                                                       # formatting.
                                                       _("Arguments to be passed to the command specified in the `command` or `bash` attributes. *Note: Provided for compatibility with BitBar only. Argos allows placing arguments directly in the command string.*")),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "| `href` | URI | %s |" % _("Opens a URI in the application registered to handle it. URIs starting with `http://` launch the web browser, while `file://` URIs open the file in its associated default application. **Argos for Cinnamon** also supports paths starting with `~/` that will be automatically expanded to the user's home folder."),
            "| `eval` | %s | %s |" % (_("JavaScript code"),
                                      # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                                      _("Passes the code to JavaScript's `eval` function. **Argos only**.")),
            "| `refresh` | **[(2)](#about-boolean-attributes-{{lhc_lang_id}})** %s | %s |" %
            (_("Boolean value"),
             # TO TRANSLATORS: MARKDOWN string. Respect formatting.
             _("If enabled, re-runs the plugin, updating its output.")),
            "",
            '<span id="about-command-bash-attributes-{{lhc_lang_id}}"></span>',
            "",
            utils.get_bootstrap_alert(
                heading="<strong>(1)</strong> %s" % _(
                    # TO TRANSLATORS: Full sentence:
                    # About the "command" and "bash" attributes.
                    # Do not translate nor modify the {command} and {bash} placeholders.
                    "About the {command} and {bash} attributes").format(
                    command="<code>command</code>",
                    bash="<code>bash</code>"),
                content=md(_("These attributes are mutually exclusive. I added the `command` attribute because it didn't make much sense to have it named `bash` when Argos for Cinnamon can use any shell, not just Bash. I left the `bash` attribute so any scripts written for BitBar or for the original Argos for Gnome Shell extension can be used without modifications. I will never remove the `bash` attribute while the two previously mentioned tools keep using it."))
            ),
            "",
            '<span id="about-boolean-attributes-{{lhc_lang_id}}"></span>',
            "",
            utils.get_bootstrap_alert(
                heading="<strong>(2)</strong> %s" % _("About boolean attributes"),
                content=md(_("Any boolean attribute can have a value of `true` or `1` (one) to enable a feature/option. Or a value of `false` or `0` (zero) to disable a feature/option. Values are case-insensitive. Any other value will be considered `false`."))
            ),
            "",
            "### %s" % _("Environment variables"),
            _("Plugin executables are run with the following special environment variables set:"),
            "",
            "| %s | %s |" % (_("Name"), _("Value")),
            "| --- | --- |",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "| `ARGOS_VERSION` | %s |" % _(
                "Version number of the Argos for Cinnamon applet. The presence of this environment variable can also be used to determine that the plugin is actually running in Argos, rather than BitBar or [kargos](https://github.com/lipido/kargos)."),
            "| `ARGOS_MENU_OPEN` | %s |" % _(
                "`true` if the dropdown menu was open at the time the plugin was run, and `false` otherwise."),
            "",
            '<span id="bitbar-plugins-with-argos-for-cinnamon-{{lhc_lang_id}}"></span>',
            "",
            "## %s" % _("BitBar plugins with Argos for Cinnamon"),
            "",
            utils.get_bootstrap_alert(
                context="warning",
                heading=_("WARNING!!! DO NOT RANDOMLY TEST SCRIPTS!!!"),
                content=md("""
{0}
{1}
{2}
""".format("1. %s" % _("Apply common sense. Read and understand what a script does and how demanding it could be."),
                    "2. %s" % _(
                        "Test unknown scripts on an environment from which you can recover easily (for example, a virtual machine)."),
                    "3. %s" % _("I found one specific case in which a script can freeze and ultimately crash Cinnamon. It's a script that downloads a GIF image from the internet, converts it to Base64 and then that encoded image is inserted into a menu item using the *image* attribute. I will not provide a link to that script, but if you follow the very first advice that I listed here, when you see that script, you will know.")
           )
                )),
            "",
            _("These screenshots show how some scripts from the BitBar plugin repository look when rendered by Argos compared to the \"canonical\" BitBar rendering (macOS screenshots taken from https://getbitbar.com)."),
            "",
            "| %s | %s | %s |" % (_("Plugin"), _("BitBar on macOS"), _("Argos on Cinnamon")),
            "| --- | :---: | :---: |",
            "| [**Ping**](https://getbitbar.com/plugins/Network/ping.10s.sh) | <img src=\"./assets/images/image-ping-bitbar.png\" class=\"img-fluid\" alt=\"Ping/BitBar\"> | <img src=\"./assets/images/image-ping-argos.png\" class=\"img-fluid\" alt=\"Ping/Argos\"> |",
            "| [**Stock Ticker**](https://getbitbar.com/plugins/Finance/gfinance.5m.py) | <img src=\"./assets/images/stock-ticker-bitbar.png\" class=\"img-fluid\" alt=\"Stock Ticker/BitBar\"> | <img src=\"./assets/images/stock-ticker-argos.png\" class=\"img-fluid\" alt=\"Stock Ticker/BitBar\"> |",
            "| [**World Clock**](https://getbitbar.com/plugins/Time/worldclock.1s.sh) | <img src=\"./assets/images/world-clock-bitbar.png\" class=\"img-fluid\" alt=\"World Clock/BitBar\"> | <img src=\"./assets/images/world-clock-argos.png\" class=\"img-fluid\" alt=\"World Clock/BitBar\"> |",
            "| [**ANSI**](https://getbitbar.com/plugins/Tutorial/ansi.sh) | <img src=\"./assets/images/ansi-bitbar.png\" class=\"img-fluid\" alt=\"ANSI/BitBar\"> | <img src=\"./assets/images/ansi-argos.png\" class=\"img-fluid\" alt=\"ANSI/BitBar\"> |",
        ])
        ))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
