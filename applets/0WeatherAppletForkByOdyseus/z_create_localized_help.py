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
            _("This applet is a fork of [Weather](https://cinnamon-spices.linuxmint.com/applets/view/17) applet by [mockturtl](https://github.com/mockturtl)."),
            "",
            "## %s" % _("Differences with the original applet"),
            "",
            "- %s" % _("Added support for multiple locations."),
            "- %s" % _("Added support for multiple weather providers."),
            "- %s" % _("This applet caches the weather data used. Which means that weather providers will be contacted only when needed, preventing unnecessary API quota consumption."),
            "- %s" % _("The style sheet of this fork is used to accommodate the layout of its elements and it doesn't modify colors."),
            "- %s" % _("Added detailed tooltip to the applet about the current weather data location."),
            "- %s" % _("Menu layout redesigned."),
            "    - %s" % _("Forecasts can be displayed in one or two rows (or columns if the menu layout is set to vertical)."),
            "    - %s" % _("Forecasts can display the name of the day or the full date."),
            "    - %s" % _("The date in which the weather data was published is always displayed in the menu."),
            "    - %s" % _("More customization options (current weather icon size, forecasts icon size, etc.)."),
            "",
        ])

    def get_content_extra(self):
        return md("{}".format("\n".join([
            utils.get_bootstrap_alert(
                context="warning",
                content=md(
                    "\n".join([
                        "- %s" % _("This applet requires valid credentials from any of the weather provider services for it to work."),
                        "- %s" % _("The credentials cannot be used until they have been activated by the weather providers.")
                    ])
                )
            ),
            "",
            "## %s" % _("Getting API credentials"),
            "",
            _("Follow the instructions made available by the providers."),
            "",
            "### %s" % _("Weather providers"),
            "",
            "| %s | %s | %s |" % (_("Provider"), _(
                "API credentials instructions"), _("Location finder")),
            "| -- | -- | -- |",
            "| %s | [%s](%s) | [%s](%s) |" % (
                _("Dark Sky"),
                _("Get credentials"), "https://darksky.net/dev",
                _("Find location"), "https://darksky.net/forecast",
            ),
            "| %s | [%s](%s) | [%s](%s) |" % (
                _("OpenWeatherMap"),
                _("Get credentials"), "https://openweathermap.org/appid",
                _("Find location"), "https://openweathermap.org/find",
            ),
            "| %s | [%s](%s) | [%s](%s) |" % (
                _("WeatherBit"),
                _("Get credentials"), "https://www.weatherbit.io/pricing",
                _("Find location"), "https://openweathermap.org/find",
            ),
            "| %s | [%s](%s) | [%s](%s) **(*)** |" % (
                _("Yahoo! Weather"),
                _("Get credentials"), "https://developer.yahoo.com/weather",
                _("Find location"), "http://woeid.rosselliot.co.nz",
            ),
            "",
            "**(*)** %s" % _("WeatherBit uses the same city IDs returned by OpenWeatherMap's location finder in addition to coordinates."),
            "",
            "## %s" % _("Menu layout"),
            "",
            utils.get_image_container(
                src="assets/images/menu-layout.png",
                alt=_("Menu layout")
            ),
            "",
            "1. %s" % _("Current weather condition for the currently selected location."),
            "2. %s" % _("Forecasts for the currently selected location."),
            "3. %s" % _(
                "The time in which the currently displayed data was published by the weather provider. Clicking it will attempt to retrieve updated weather data."),
            "4. %s" % _("Button to open the locations selector menu."),
            "5. %s" % _(
                "Weather provider attribution. When clicked, it opens the weather provider website."),
            "",
            "## %s" % _("Locations manager"),
            "",
            utils.get_bootstrap_alert(
                heading=_("Highlights"),
                content=md(
                    "\n".join([
                        "- %s" % _("The locations manager can be accessed from this applet settings window."),
                        # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                        "- %s" % _("Locations with the exact same *Location ID* and *Provider* are considered duplicated and will be automatically removed when applying changes."),
                        # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                        "- %s" % _("The *Apply changes* button must be pressed for the applet to reflect the changes made in the locations manager."),
                    ])
                )
            ),
            "",
            utils.get_image_container(
                src="assets/images/locations-manager.png",
                alt=_("Locations manager")
            ),
            "",
            "- **%s**: %s" % (
                _("Location name"),
                _("This is an informative field and it isn't used to retrieve weather data. It is used to identify the displayed data in the menu and to generate the items inside the locations selector menu.")
            ),
            "- **%s**: %s" % (
                _("Location ID"),
                _("A city/region ID used by the weather service providers to identify a location.")
            ),
            "   - %s" % _("Dark Sky uses only coordinates."),
            "   - %s" % _("Open Weather Map uses city IDs (the number at the end of a location URL) and coordinates."),
            "   - %s" % _("Yahoo! Weather uses WOEIDs and coordinates."),
            "- **%s**: %s" % (
                _("Language"),
                _("Weather conditions localization. Languages are only used by DarkSky and OpenWeatherMap providers and it only affect weather conditions text. Any other text of the applet UI is localized by the applet itself (if available).")
            ),
            "- **%s**: %s" % (
                _("Forecast days"),
                _("The amount of forecasts to display in the menu.")
            ),
            "- **%s**: %s" % (
                _("Forecast rows/columns"),
                _("The amount of rows/cols to display the forecast days in.")
            ),
            "- **%s**: %s" % (
                _("Provider"),
                _("Weather data provider. All weather providers require proper credentials to function.")
            ),
            "",
            "## %s" % _("Menu theme"),
            "",
            "- %s" % _("This applet supports custom themes to style its menu."),
            "- %s" % _("The default theme (found in APPLET_FOLDER/themes/default.css) only sets a generic styling to accommodate the elements in the menu."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("To use a custom theme, just set the **Menu theme** option to **Custom** and set the **Path to custom style sheet** option to point to a style sheet file."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("To create a custom theme, just make a copy of the default theme file anywhere on the file system, **except** inside the applet folder. The default theme file has the complete list of CSS classes used by this applet."),
            "- %s" % _("For the custom theme changes to be reflected on the menu while the theme file is modified, either Cinnamon can be restarted or the Cinnamon theme can be reloaded."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _(
                "Cinnamon provides a command to reload its theme. Just open the **Run command** dialog ([[Alt]] + [[F2]]), type **rt** and press [[Enter]]."),
            "",
            "## %s" % _("Icon theme"),
            "",
            "- %s" % _("This applet supports custom icon themes."),
            "- %s" % _("This applet comes with the possibility to choose 3 icon themes and they are named as follows."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    - **%s**: %s" % (_("System"),
                                  _("The applet will use the icons provided by the currently selected icon theme for the system.")),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    - **%s**: %s" % (_("Built-in"),
                                  _("The icons used are the ones found in APPLET_FOLDER/themes/icons.")),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "    - **%s**: %s" % (_("Custom"), _(
                "The icons used are the ones found in the path defined in the **Path to custom icon theme** option.")),
            "- %s" % _("An icon theme is just a folder that contains specifically named icon files."),
            "- %s" % _("The built-in icon theme is a monochrome theme and is found in APPLET_FOLDER/themes/icons."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("The built-in icon theme can be used as full color or symbolic icons (applet settings **Menu icon type** and **Applet icon type**). The difference is that, if used as a full color theme, the icons will be black no matter if the Cinnamon theme selected has light or dark backgrounds for menus. On the other hand, if it is used as symbolic icons, the color of the icons will be set by the selected Cinnamon theme. Additionally, symbolic icons can be colorized through the custom CSS theme (applet setting **Menu theme**) by styling the `weather-forecast-icon` and `weather-current-icon` classes."),
            "- %s" % _("To create a custom icon theme, the built-in icon theme can be used as a base."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("The built-in icon theme is composed of 36 *real images*, the rest of icons are symbolic links to these *real images*."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("Inside the built-in icon theme is a script called **z_symlinkify.bash** that can be used to create an icon theme from scratch. This script also contains the list of *real images* that are used to create the symbolic links."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("A custom icon theme can contain only full colored icons, only symbolic icons or both. The **Menu icon type** and **Applet icon type** applet settings should be set accordingly to the icon type used by the custom theme."),
            "- %s" % _("A custom icon theme can contain SVG or PNG images; although SVG images are preferable due to their ability to scale into any icon size set in this applet settings without loosing quality. Other image types might be used, but I didn't test them."),
            "- %s" % _("A custom icon theme should contain 240 icons to support both full color and symbolic icons. Or half of that (120) to support one or the other."),
        ])
        ))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
