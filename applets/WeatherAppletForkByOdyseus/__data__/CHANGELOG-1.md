<br/>
<br/>
***

**Date:** Fri, 14 Feb 2020 21:30:10 -0300<br/>
**Commit:** [88cb363](https://gitlab.com/Odyseus/CinnamonTools/commit/88cb363)<br/>
**Author:** Odyseus<br/>

- quantities.js library update:
    - Add Imperial Gallons, and Barrels (US Beer, Imperial Beer, Oil). (Upstream feature)
    - Add support for imperial version of fluid ounces and pints. (Upstream feature)
    - Marked strict warnings fixes to facilitate comparisson with upstream.

***

**Date:** Fri, 14 Feb 2020 19:08:58 -0300<br/>
**Commit:** [5a7beb0](https://gitlab.com/Odyseus/CinnamonTools/commit/5a7beb0)<br/>
**Author:** Odyseus<br/>

- Fixed `_` variable exported from wrong module.
- Fixed stric mode error in quantities.js libraries.
- Implemented a different SHA library that it's strict mode compliant to avoid spamming **~/.xsession-errors** with strict mode errors/warnings.

***

**Date:** Wed, 12 Feb 2020 22:47:25 -0300<br/>
**Commit:** [56a3f44](https://gitlab.com/Odyseus/CinnamonTools/commit/56a3f44)<br/>
**Author:** Odyseus<br/>

- Adaptations due to changes to the custom settings framework.

***

**Date:** Mon, 10 Feb 2020 23:14:40 -0300<br/>
**Commit:** [c1170b5](https://gitlab.com/Odyseus/CinnamonTools/commit/c1170b5)<br/>
**Author:** Odyseus<br/>

- Added a couple more known status codes to better identify network problems.
- Removed leftover code of xlets initialization using a Cinnamon feature that thankfully wasn't implemented.
- Implemented the use of the `xdgOpen`, `copyToClipboard`, and `safeGet` functions from the `globalUtils.js` javaScript module.

***

**Date:** Mon, 27 Jan 2020 02:41:38 -0300<br/>
**Commit:** [c9d9edb](https://gitlab.com/Odyseus/CinnamonTools/commit/c9d9edb)<br/>
**Author:** Odyseus<br/>

Countermeasures for using an external settings application
----------------------------------------------------------

- Removed condition used to selectively override the applet's Configure context menu item depending on Cinnamon version used. This condition caused to not open the settings window on newer Cinnamon versions.
- Added button to the settings-schema.json file so the *real* settings window can be opened from Cinnamon's native settings window. Trying to open the correct xlet settings from the xlets manager isn't possible, so I added this button.
- Removed `external-configuration-app` key from the metadata.json file so the built-in mechanism to open xlet settings doesn't fail silently without displaying error messages.

***

**Date:** Sat, 18 Jan 2020 14:46:45 -0300<br/>
**Commit:** [06693ef](https://gitlab.com/Odyseus/CinnamonTools/commit/06693ef)<br/>
**Author:** Odyseus<br/>

- Exposed for localization the units abbreviations.

***

**Date:** Fri, 21 Jun 2019 23:06:01 -0300<br/>
**Commit:** [f913c7e](https://gitlab.com/Odyseus/CinnamonTools/commit/f913c7e)<br/>
**Author:** Odyseus<br/>

- Corrected error caused by random missing data from Yahoo! provider.
- Redesigned applet tooltip to display information symmetrically.
- Corrected the use of undefined constant in some providers.
- Removed duplicated field from tooltip when the weather provider is WeatherBit.
- Minor changes to the settings application due to changes in the custom settings framework.

***

**Date:** Wed, 5 Jun 2019 19:56:38 -0300<br/>
**Commit:** [0e2e18e](https://gitlab.com/Odyseus/CinnamonTools/commit/0e2e18e)<br/>
**Author:** Odyseus<br/>

- Eliminated from the quantities.js library all strict warnings (FINALLY).

***

**Date:** Thu, 30 May 2019 03:48:37 -0300<br/>
**Commit:** [cd63982](https://gitlab.com/Odyseus/CinnamonTools/commit/cd63982)<br/>
**Author:** Odyseus<br/>

- Minor changes due to changes in global modules.
- Python scripts: Changed the use of cgi.escape to html.escape due to cgi.escape deprecation.

***

**Date:** Thu, 23 May 2019 02:16:58 -0300<br/>
**Commit:** [e0d44f6](https://gitlab.com/Odyseus/CinnamonTools/commit/e0d44f6)<br/>
**Author:** Odyseus<br/>

- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Improved debugger.
- Override the **Configure..** context menu item only when it is needed.
- Fixed (at least tried to) warnings about "function does not always return value" nonsense.
- Added SVG icon.

***

**Date:** Sat, 18 May 2019 22:29:33 -0300<br/>
**Commit:** [581cbbe](https://gitlab.com/Odyseus/CinnamonTools/commit/581cbbe)<br/>
**Author:** Odyseus<br/>

- Removed unused file.
- Added "external-configuration-app" option to the metadata.json file to minimize probability of opening the "fake" settings window.

***

**Date:** Tue, 14 May 2019 14:29:06 -0300<br/>
**Commit:** [9762324](https://gitlab.com/Odyseus/CinnamonTools/commit/9762324)<br/>
**Author:** Odyseus<br/>

WARNING: Before updating to this version of the applet, make sure to backup the list of locations using the locations manager. There is a very slim chance that the current settings will prevent the settings window to open. In that case, the current settings will have to be completely reseted (by deleting the folder ~/.cinnamon/configs/0WeatherAppletForkByOdyseus@your.domain.com). I tried to make sure that this could not happen, but better safe than sorry.

- Finally fixed asymmetry issues inside the applet menu elements. Everything is beautifully symmetric now.
- Removed option to abbreviate the name of the moon phases since it was just a workaround that is not needed anymore.
- Changed the *chained module imports* approach for a *direct module import* approach. This is to avoid errors caused by the garbage that is the implementation of `require()`.
- Added the ID (name) WeatherApplet to the applet menu and updated the default theme (default.css) to use the ID. This was added to minimize possible conflicts with xlets that might use the same class names and it doesn't break custom themes in use.
- Changed default current weather icon size to 128 and maximum icon size to 512.
- Implemented the use of a custom framework to handle the applet settings since I was already using the framework to create the locations manager window.

***

**Date:** Thu, 9 May 2019 05:22:15 -0300<br/>
**Commit:** [0f06d1d](https://gitlab.com/Odyseus/CinnamonTools/commit/0f06d1d)<br/>
**Author:** Odyseus<br/>

- Prefer the icons provided by the currently used theme instead of the custom icons shipped with the xlet.
- Corrected infinite loop caused by the use of an absolutely retarded language.
- Restructured theme loading mechanism.
- Removed unnecessary icons.

***

**Date:** Thu, 25 Apr 2019 02:06:28 -0300<br/>
**Commit:** [5ddbc74](https://gitlab.com/Odyseus/CinnamonTools/commit/5ddbc74)<br/>
**Author:** Odyseus<br/>

- Added a signal manager to manage signal connections that weren't managed.
- Added settings finalization on applet removal.

***

**Date:** Tue, 16 Apr 2019 02:57:35 -0300<br/>
**Commit:** [ef59ee2](https://gitlab.com/Odyseus/CinnamonTools/commit/ef59ee2)<br/>
**Author:** Odyseus<br/>

- Removed leftover call to log function.

***

**Date:** Mon, 15 Apr 2019 22:45:45 -0300<br/>
**Commit:** [41e1d57](https://gitlab.com/Odyseus/CinnamonTools/commit/41e1d57)<br/>
**Author:** Odyseus<br/>

- Added WeatherBit weather provider.
- Added option to display the moon phases abbreviated. This is just a workaround to avoid the moon phase's long text to move the entire current weather information off center. Until I figure out a better way this will have to do.
- Modified the locations manager GUI to use a centralized framework.
- Added weather provider info to the list of languages in the locations manager to easily identify which provider supports which languages.
- Added a script to assist in the creation of the languages menu.

***

**Date:** Thu, 28 Feb 2019 20:06:14 -0300<br/>
**Commit:** [c510888](https://gitlab.com/Odyseus/CinnamonTools/commit/c510888)<br/>
**Author:** Odyseus<br/>

- Removed unused icons from the icons folder.
- Added missing CONTRIBUTORS.md file to properly give credit.
- Added the possibility to select an icon theme. One can select from 3 different icon themes.
    - System: the system icon theme is used.
    - Built-in: the icon theme provided by this applet is used.
    - Custom: an icon theme created by the user is used.

***

**Date:** Sun, 24 Feb 2019 18:36:21 -0300<br/>
**Commit:** [a9f994a](https://gitlab.com/Odyseus/CinnamonTools/commit/a9f994a)<br/>
**Author:** Odyseus<br/>

- Added moon phase to current condition details. Since none of the weather services provide such information, a JavaScript function is used to calculate the moon phases.
- Changed the method of creating the current weather details. Instead of creating them "by hand", use a loop.
- Removed custom separator used in the menu in favor of using PopupSeparatorMenuItem.
- Removed hard-coded max. width for the current weather condition. It is now defined in the CSS theme, so it can be modified with a custom theme.
- Removed unused function and property.
- Removed call to function in favor of in-line declaration.

***

**Date:** Thu, 21 Feb 2019 10:30:38 -0300<br/>
**Commit:** [8c41de9](https://gitlab.com/Odyseus/CinnamonTools/commit/8c41de9)<br/>
**Author:** Odyseus<br/>

- Added theming support.

***

**Date:** Sun, 17 Feb 2019 02:31:28 -0300<br/>
**Commit:** [c95eefe](https://gitlab.com/Odyseus/CinnamonTools/commit/c95eefe)<br/>
**Author:** Odyseus<br/>

- Improved description of known status codes.
- Improved the display of error messages in the applet menu.
- Improved identification of method names when verbose debug mode is enabled.
- Avoid the hiding of the error box when it shouldn't be hidden.

***

**Date:** Wed, 13 Feb 2019 04:04:10 -0300<br/>
**Commit:** [5e59cee](https://gitlab.com/Odyseus/CinnamonTools/commit/5e59cee)<br/>
**Author:** Odyseus<br/>

- Corrected the logic of the sanitizeStoredLocations method.
    - First, this.locationsMap doesn't need deduplication since it's a Map.
    - And second, I'm iterating over the stored data keys (a location UUID), not its values (the weather data for a location). So there is no need to re-create the UUIDs.

***

**Date:** Tue, 12 Feb 2019 23:33:32 -0300<br/>
**Commit:** [4fc8ec3](https://gitlab.com/Odyseus/CinnamonTools/commit/4fc8ec3)<br/>
**Author:** Odyseus<br/>

- Rewritten from scratch to suport changes to the Yahoo! Weather API and to add several features.
- Added support for multiple locations.
- Added support for multiple weather providers.
- Added detailed tooltip to the applet about the current weather data location.
- Menu layout redesigned.
    - Forecasts can be displayed in one or two rows (or columns if the menu layout is set to vertical).
    - Forecasts can display the name of the day or the full date.
    - The date in which the weather data was published is always displayed in the menu.
    - More customization options (current weather icon size, forecasts icon size, etc.).

***

**Date:** Mon, 21 Jan 2019 21:55:26 -0300<br/>
**Commit:** [24e684b](https://gitlab.com/Odyseus/CinnamonTools/commit/24e684b)<br/>
**Author:** Odyseus<br/>

- Changed applet icon.

***

**Date:** Tue, 15 Jan 2019 22:36:02 -0300<br/>
**Commit:** [5797433](https://gitlab.com/Odyseus/CinnamonTools/commit/5797433)<br/>
**Author:** Odyseus<br/>

- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

***

**Date:** Tue, 8 Jan 2019 21:40:05 -0300<br/>
**Commit:** [fbdef6f](https://gitlab.com/Odyseus/CinnamonTools/commit/fbdef6f)<br/>
**Author:** Odyseus<br/>

- Fixed strict mode warning.

***

**Date:** Tue, 7 Aug 2018 03:12:54 -0300<br/>
**Commit:** [ea72172](https://gitlab.com/Odyseus/CinnamonTools/commit/ea72172)<br/>
**Author:** Odyseus<br/>

- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

***

**Date:** Sat, 4 Aug 2018 05:13:40 -0300<br/>
**Commit:** [4bfbd34](https://gitlab.com/Odyseus/CinnamonTools/commit/4bfbd34)<br/>
**Author:** Odyseus<br/>

- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.

***

**Date:** Wed, 13 Jun 2018 01:05:41 -0300<br/>
**Commit:** [0225402](https://gitlab.com/Odyseus/CinnamonTools/commit/0225402)<br/>
**Author:** Odyseus<br/>

- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

***

**Date:** Mon, 14 May 2018 07:15:52 -0300<br/>
**Commit:** [2e7d01c](https://gitlab.com/Odyseus/CinnamonTools/commit/2e7d01c)<br/>
**Author:** Odyseus<br/>

- Corrected the logic when polling for weather data.

***

**Date:** Mon, 7 May 2018 04:47:37 -0300<br/>
**Commit:** [e8d1011](https://gitlab.com/Odyseus/CinnamonTools/commit/e8d1011)<br/>
**Author:** Odyseus<br/>

- Revamped/simplified settings mechanism.
    - Renamed all settings keys to be prefixed with "pref_".
    - Removed unnecessary properties definition.
- Cleaned up unnecessary variable definitions.
- Proper handling of key bindings.
- Moved utility functions into the utils.js files.
- Added a mechanism to update weather data from the online source only when it is needed.
- Added Spanish localization.

***
