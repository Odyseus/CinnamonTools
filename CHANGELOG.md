## Repository changelog

**The changelogs for xlets can be found inside each xlet folder and/or in their help pages. The changelog for themes can be found inside the *themes* folder.**

***

**Date:** Mon, 14 Mar 2022 19:50:54 -0300<br/>
**Commit:** [735007d](https://gitlab.com/Odyseus/CinnamonTools/commit/735007d)<br/>
**Author:** Odyseus<br/>

### General

- Updated change logs.

***

**Date:** Mon, 14 Mar 2022 19:50:23 -0300<br/>
**Commit:** [9bfa787](https://gitlab.com/Odyseus/CinnamonTools/commit/9bfa787)<br/>
**Author:** Odyseus<br/>

### Python modules

- Updated change logs generation commands to avoid bloat.

***

**Date:** Mon, 14 Mar 2022 00:07:05 -0300<br/>
**Commit:** [6c05b9a](https://gitlab.com/Odyseus/CinnamonTools/commit/6c05b9a)<br/>
**Author:** Odyseus<br/>

### General

- Updated submodules.
- Updated manual page.
- Updated README.

***

**Date:** Sun, 13 Mar 2022 23:53:43 -0300<br/>
**Commit:** [8b4b8f9](https://gitlab.com/Odyseus/CinnamonTools/commit/8b4b8f9)<br/>
**Author:** Odyseus<br/>

### All xlets

- Updated all help pages.

***

**Date:** Sun, 13 Mar 2022 03:10:23 -0300<br/>
**Commit:** [46212d9](https://gitlab.com/Odyseus/CinnamonTools/commit/46212d9)<br/>
**Author:** Odyseus<br/>

### General

- Updated sub-modules.
- Updated HTML assets used by the xlets HELP pages to use Bootstrap 5.
- Updated the debug manager gsettings schema.
- Updated manual pages.
- Updated README.
- Updated all CHANGELOGs.
- Updated app.py to abort execution if it is executed with a *not valid* Python version.

***

**Date:** Sun, 13 Mar 2022 02:05:08 -0300<br/>
**Commit:** [e7c1144](https://gitlab.com/Odyseus/CinnamonTools/commit/e7c1144)<br/>
**Author:** Odyseus<br/>

### Python modules

- Main Python application:
    - Renamed `build` command to `build_xlets`.
    - Removed `--all-xlets` parameter from `build_xlets` command. If no `--xlet-name` parameter is passed, all xlets will be built.
    - Removed `--dry-run` parameter. Too annoying to maintain.
    - Added `--variant-name` parameter to the `build_themes` command to allow to build/develop specific variants instead of always building/developing all variants.
    - Renamed `dev` command to `dev_xlets`.
    - Added `dev_themes` command to perform development tasks with themes.
    - Added theme variant selector to the interactive CLI menu.
- `file_chooser_dialog`: Added `--action-save` and `--last-dir` parameters.
- Updated `helper.py` script to recognize if an xlet has a gsettings schema at execution time instead of the *hacky* way previously used.

***

**Date:** Sun, 13 Mar 2022 00:54:18 -0300<br/>
**Commit:** [1ccca3c](https://gitlab.com/Odyseus/CinnamonTools/commit/1ccca3c)<br/>
**Author:** Odyseus<br/>

### General

- Updated README template.
- Updated Bash completions template.
- Updated system executable template.
- Update BaseXlet.

***

**Date:** Sun, 13 Mar 2022 00:48:29 -0300<br/>
**Commit:** [4abcff4](https://gitlab.com/Odyseus/CinnamonTools/commit/4abcff4)<br/>
**Author:** Odyseus<br/>

### Xlets settings framework

- Removed all retro-compatible code.
- Implemented **scale** widget (called **Range** internally).
- Implemented **soundfilechooser** widget.
- Implemented a `builder` to help in the creation of window definitions inside the **settings.py** files. Advantages:
    - Window definitions code reduced by +-30% and creation time (time spent in creating them) reduced even more.
    - No more need of *safely getting values* from the definitions.
- Removed the need to always pass certain CLI arguments to the **settings.py** files when dealing with applets/desklets. This allows to open the settings window from anywhere. Notes:
    - I'm still creating .desktop files to open extension's settings. Because having to open a window to be able to open another window is ultra-mega-annoying.
    - I'm still overriding the **Configure...** context menu for applets. Because this item is still hardcoded to only open the Cinnamon's native settings window and completely ignore the application defined in `external-configuration-app` inside **metadata.json** files.
- Added **textviewbutton** widget, a new widget similar to the **textview** widget that is rendered as a button that opens a text view.
- Added **stringslist** widget, a new widget that allows to store a list of strings.

***

**Date:** Sun, 13 Mar 2022 00:47:10 -0300<br/>
**Commit:** [faf0951](https://gitlab.com/Odyseus/CinnamonTools/commit/faf0951)<br/>
**Author:** Odyseus<br/>

### JavaScript modules

- Removed all retro-compatible code.
- Removed all polyfills. I never used them and now none of them are needed.
- Updated all existent modules to JavaScript class notation and other ES6 useless nonsense.
- Added **appletsUtils.js** module. A module with "boilerplate" code to facilitate applets creation.
- Added **extensionsUtils.js** module. A module with "boilerplate" code to facilitate extensions creation.
- Added **customPopupMenu.js** module. A module with custom elements based on elements found in Cinnamon's **popupMenu.js** module.
- Removed the **xletsSettingsUtils.js** module in favor of the **extensionsUtils.js** module.
- **globalUtils.js** module:
    - Added `ScheduleManager` class. A class used to manage timeouts/intervals without the need to keep track of them. Similar to how the `SignalManager` class of Cinnamon's **signalManager.js** module works.
    - Added `KeybindingsManager` class. A class used to manage key bindings created with the `KeybindingManager` class found in Cinnamon's **keybindings.js** module. It's main purpose is to be able to remove all registered key bindings "in bulk".
    - Added `InjectionsManager` class. A class to assist with functions injections/overrides.
    - Added `check_version` method. A function that is a proxy to the `versionCompare` function to allow a more "natural" usage.
    - Removed `safeGet` method. Now there is the optional chaining operator `?.`.
- **customTooltips.js** module: Removed the `CustomPanelTooltip` (that wasn't used by any of my xlets) class and added the `CustomPanelItemTooltip` class. The `CustomPanelItemTooltip` class has a mechanism to display data in a grid for easy reading and comprehension.

***

**Date:** Sun, 13 Mar 2022 00:24:14 -0300<br/>
**Commit:** [4f75779](https://gitlab.com/Odyseus/CinnamonTools/commit/4f75779)<br/>
**Author:** Odyseus<br/>

### General

- Updated Sublime Text project file.
- Updated GitLab bug report template.
- Updated .eslintrc.json file.
- Updated .gitignore file.
- Updated .jshintrc file.
- Added .esformatter.json file.

***
