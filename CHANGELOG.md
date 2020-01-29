## Repository changelog

#### The changelogs for xlets can be found inside each xlet folder and/or in their help pages.

***

- **Date:** Wed, 29 Jan 2020 03:11:32 -0300
- **Commit:** [1c0975d](https://gitlab.com/Odyseus/CinnamonTools/commit/1c0975d)
- **Author:** Odyseus

```
Python modules

- cli.py: Implemented a better way to decide when the log file should be printed.

```

***

- **Date:** Wed, 29 Jan 2020 03:09:54 -0300
- **Commit:** [d0502a9](https://gitlab.com/Odyseus/CinnamonTools/commit/d0502a9)
- **Author:** Odyseus

```
 Merge ref. 'master' of git@gitlab.com:Odyseus/python_utils.git

```

***

- **Date:** Wed, 29 Jan 2020 03:09:54 -0300
- **Commit:** [189c3cd](https://gitlab.com/Odyseus/CinnamonTools/commit/189c3cd)
- **Author:** Odyseus

```
Squashed '__app__/python_modules/python_utils/' changes from 0f986ce..639a5e5

639a5e5 cli_utils.py

git-subtree-dir: __app__/python_modules/python_utils
git-subtree-split: 639a5e5b4862250dc1b8efeb1afb8de6f72cba7b

```

***

- **Date:** Wed, 29 Jan 2020 00:44:14 -0300
- **Commit:** [5591e57](https://gitlab.com/Odyseus/CinnamonTools/commit/5591e57)
- **Author:** Odyseus

```
Python modules

- All modules: Some tweaks to docstrings references.
- localized_help_creator.py: Modified the Cinnamon compatibility block to display the min. and max. version overrides declared on an xlet z_config.py file.
- app_menu.py: Removed initialization of the XletsHelperCore class. This was used when development tasks could be performed from the CLI menu, a thing that I removed a long time ago.
- cli.py: Don't print log file path when executing the print_xlets_slugs command. This was interfering with the Bash completions.
- app_utils.py:
    - Simplified generation of the global metadata file.
    - Renamed some arguments/variables/functions to better depict what they contain.
    - Removed unnecessary check when building xlets. I was checking the validity of the passed xlets inside the build_xlets function, but I already do that on the CLI commands parsing side.

```

***

- **Date:** Tue, 28 Jan 2020 18:34:58 -0300
- **Commit:** [b7765ea](https://gitlab.com/Odyseus/CinnamonTools/commit/b7765ea)
- **Author:** Odyseus

```
General

- Added CHANGELOG.md.
- Updated Bash completions.

```

***

- **Date:** Tue, 28 Jan 2020 18:34:14 -0300
- **Commit:** [b79d40b](https://gitlab.com/Odyseus/CinnamonTools/commit/b79d40b)
- **Author:** Odyseus

```
Python modules

- Added mechanism to generate a CHANGELOG file for the repository.
- Removed changelog_handler.py module.

```

***

- **Date:** Tue, 28 Jan 2020 04:51:37 -0300
- **Commit:** [efc03f2](https://gitlab.com/Odyseus/CinnamonTools/commit/efc03f2)
- **Author:** Odyseus

```
Python modules

- app_utils.py: Added the xlets settings framework to the documentation building process.

```

***

- **Date:** Tue, 28 Jan 2020 04:51:27 -0300
- **Commit:** [831ef71](https://gitlab.com/Odyseus/CinnamonTools/commit/831ef71)
- **Author:** Odyseus

```
Xlets settings framework

- AppChooserWidgets.py
    - Fixed sensitivity of the delete button of the `applist` widget.
    - Corrected `applist` widget's deletion of multiple selected applications.
    - Removed call to `set_icon_name` for the applications chooser dialog since it will always be transient for a parent and the icon will never be displayed.
    - Removed the action area margin since the buttons are now displayed in a header bar.
- All modules: Advances in the completion of docstrings and framework documentation. A couple of more years and I might finish them all (LOL).

```

***

- **Date:** Tue, 28 Jan 2020 04:51:07 -0300
- **Commit:** [c1917b2](https://gitlab.com/Odyseus/CinnamonTools/commit/c1917b2)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Tue, 28 Jan 2020 01:37:55 -0300
- **Commit:** [b91cdf4](https://gitlab.com/Odyseus/CinnamonTools/commit/b91cdf4)
- **Author:** Odyseus

```
All xlets

- Removed `indent` key from all settings-schema.json files.
- Updated localization templates.
- Updated Spanish localizations.
- Updated change logs.
- Updated help pages.

```

***

- **Date:** Tue, 28 Jan 2020 01:26:20 -0300
- **Commit:** [358faf5](https://gitlab.com/Odyseus/CinnamonTools/commit/358faf5)
- **Author:** Odyseus

```
Themes

- Added some basic styling to the Gtk 3.18 theme for GtkStackSidebar.

```

***

- **Date:** Mon, 27 Jan 2020 00:20:36 -0300
- **Commit:** [2e774b8](https://gitlab.com/Odyseus/CinnamonTools/commit/2e774b8)
- **Author:** Odyseus

```
Squashed '__app__/python_modules/python_utils/' changes from efb13da..0f986ce

0f986ce General
27ad57d All modules
ac56d68 sphinx_docs_utils.py
b6c5298 Renamed .sublime folder to .editor

git-subtree-dir: __app__/python_modules/python_utils
git-subtree-split: 0f986ce8790ac1699bc3d86402527f2d834d079e

```

***

- **Date:** Mon, 27 Jan 2020 00:20:36 -0300
- **Commit:** [f2013d2](https://gitlab.com/Odyseus/CinnamonTools/commit/f2013d2)
- **Author:** Odyseus

```
 Merge ref. 'master' of git@gitlab.com:Odyseus/python_utils.git

```

***

- **Date:** Fri, 24 Jan 2020 03:11:30 -0300
- **Commit:** [bfb68de](https://gitlab.com/Odyseus/CinnamonTools/commit/bfb68de)
- **Author:** Odyseus

```
Themes

- Gtk3 theme: Fixed wrongly colored header bars.
- Cinnamon:
    - Added new class that will be available on next Cinnamon version.
    - Added missing cinnamon.css files that was removed due to incorrect rules on the .gitignore file.

```

***

- **Date:** Fri, 24 Jan 2020 03:10:37 -0300
- **Commit:** [0a18db5](https://gitlab.com/Odyseus/CinnamonTools/commit/0a18db5)
- **Author:** Odyseus

```
Xlets settings framework

- Suppressed some warnings by using the proper CSS selectors depending on the Gtk 3 version the application runs in.

```

***

- **Date:** Fri, 24 Jan 2020 03:09:39 -0300
- **Commit:** [b3126fb](https://gitlab.com/Odyseus/CinnamonTools/commit/b3126fb)
- **Author:** Odyseus

```
Python modules

- Don't exit when there is no specified build output location. Directly use the temporary location.

```

***

- **Date:** Fri, 24 Jan 2020 03:09:27 -0300
- **Commit:** [cc674b9](https://gitlab.com/Odyseus/CinnamonTools/commit/cc674b9)
- **Author:** Odyseus

```
General

- Fixed .gitignore ignores that prevented correct tracking of the themes folder.

```

***

- **Date:** Tue, 21 Jan 2020 16:54:10 -0300
- **Commit:** [4fe0522](https://gitlab.com/Odyseus/CinnamonTools/commit/4fe0522)
- **Author:** Odyseus

```
Python modules

- app_utils.py: Implemented min/max Cinnamon version overrides for individual xlets. This allows to generate the cinnamon-version key of a metadata.json file for specific xlets to min/max values other than the ones hardcoded in the Python application.

```

***

- **Date:** Sat, 18 Jan 2020 15:02:59 -0300
- **Commit:** [f80e2cf](https://gitlab.com/Odyseus/CinnamonTools/commit/f80e2cf)
- **Author:** Odyseus

```
General

- Updated submodules.
- Updated README.
- Updated Bash completions.
- Updated manual page.
- Updated .gitignore to allow user modifications at themes/_variants.
- Updated the Bootstrap theme used by the help pages to its latest version.

```

***

- **Date:** Sat, 18 Jan 2020 15:01:52 -0300
- **Commit:** [b59ba06](https://gitlab.com/Odyseus/CinnamonTools/commit/b59ba06)
- **Author:** Odyseus

```
All xlets

- Removed xlet settings initialization argument that was added in preparation for a change in Cinnamon that luckily didn't make it into production.
- Updated localization templates.
- Updated Spanish localizations.
- Updated change logs.
- Updated help pages.

```

***

- **Date:** Sat, 18 Jan 2020 14:57:35 -0300
- **Commit:** [f50d3af](https://gitlab.com/Odyseus/CinnamonTools/commit/f50d3af)
- **Author:** Odyseus

```
Python modules

- app_utils.py:
    - Added support for building the Cinnamon theme with compatibility for latest Cinnamon version.
    - Added special handling for the values of Cinnamon's font size/family in preparation for newest Cinnamon versions that will not need to have those properties hardcoded into the theme.
- cli.py: Added parse_sass subcommand. A convenience for users that want to create their own theme variants.
- localized_help_creator.py: Added missing CSS class to an info section.
- localized_help_utils.py: Removed the display of the Bootstrap version from the help pages template. It's irrelevant and annoying to keep up to date.

```

***

- **Date:** Sat, 18 Jan 2020 14:57:06 -0300
- **Commit:** [0c043c5](https://gitlab.com/Odyseus/CinnamonTools/commit/0c043c5)
- **Author:** Odyseus

```
JavaScript modules

- Fixed some typos inside some comments and added some comments.

```

***

- **Date:** Sat, 18 Jan 2020 14:56:27 -0300
- **Commit:** [c03b4f4](https://gitlab.com/Odyseus/CinnamonTools/commit/c03b4f4)
- **Author:** Odyseus

```
Themes

- General changes:
    - Made it easier for users to create their own theme variants. Read the documentation for instructions: Usage > app.py build_themes > How to create a custom theme variant?.
    - Removed MintGreen variant since I never used it and now users can create their own variant.
    - Exposed for configuration several contextual colors for customization when creating custom variants.
- Gtk2 theme changes:
    - Removed unused image.
- Gtk3 theme changes:
    - Xfce 4.14 fixes. (Upstream fix)
    - Add support for GtkStackSidebar needs attention. (Upstream fix)
    - Compliance with application's request to set a monospace font. (Upstream fix)
- Cinnamon theme changes:
    - [GWL] Fixed justification of label inherited from applet-box. (Upstream fix)
    - [GWL] Adjusted grouped-window-list-thumbnail-menu becoming active. (Upstream fix)

```

***

- **Date:** Sun, 22 Dec 2019 05:10:21 -0300
- **Commit:** [725b7c6](https://gitlab.com/Odyseus/CinnamonTools/commit/725b7c6)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Sun, 22 Dec 2019 05:08:21 -0300
- **Commit:** [71ad269](https://gitlab.com/Odyseus/CinnamonTools/commit/71ad269)
- **Author:** Odyseus

```
All xlets

- Updated localization templates.
- Updated Spanish localizations.
- Updated change logs.
- Updated help pages.
- Updated metadata.json files due to changes to their handling.

```

***

- **Date:** Sun, 22 Dec 2019 05:04:08 -0300
- **Commit:** [7359152](https://gitlab.com/Odyseus/CinnamonTools/commit/7359152)
- **Author:** Odyseus

```
Python modules

- Modified the handling of the metadata.json file for xlets. Now this file is modified at xlet build time to avoid having to manually keep it up to date (the cinnamon-version key more than anything).
- Simplified the compatibility data displayed in all xlets help pages. It was pointless to display the specific Cinnamon versions (read from the metadata.json file) since all my xlets are *compatible* with a minimum Cinnamon version up to the latest version.
- Added some missing docstrings of features previously added.

```

***

- **Date:** Tue, 16 Jul 2019 00:48:05 -0300
- **Commit:** [ddee4ac](https://gitlab.com/Odyseus/CinnamonTools/commit/ddee4ac)
- **Author:** Odyseus

```
Themes

- Added support for Cinnamon 4.2.x. There is a new class for spacer applets.
- Cinnamon theme SASS sources:
    - Changed the type of certain comments so they don't show up in the built CSS files.
    - Moved some comments inside conditions so they aren't added to the built CSS files.
    - Changed the ridiculous huge size of the **notification-icon-button** class.
    - Unified some styles used by button classes.

```

***

- **Date:** Tue, 16 Jul 2019 00:44:54 -0300
- **Commit:** [89422aa](https://gitlab.com/Odyseus/CinnamonTools/commit/89422aa)
- **Author:** Odyseus

```
Python modules

- Modified the logic when handling stored settings of xlets/themes building processes. Up to now, every time that I added/removed/modified the options of either build process, I simply reseted the existing settings to their default values. This forced users to constantly re-set their personalized values. From now on, every time that I add/remove/modify an option, existing options stored from a previous build process will remain untouched.
- Corrected a typo in a keyword name (do_not_cofirm to do_not_confirm).

```

***

- **Date:** Sat, 22 Jun 2019 00:13:11 -0300
- **Commit:** [937fb0a](https://gitlab.com/Odyseus/CinnamonTools/commit/937fb0a)
- **Author:** Odyseus

```
General

- Updated README.
- Updated issue template.
- Updated sub-modules.
- Updated manual page.
- Corrected typo on base xlet.

```

***

- **Date:** Sat, 22 Jun 2019 00:07:57 -0300
- **Commit:** [251781d](https://gitlab.com/Odyseus/CinnamonTools/commit/251781d)
- **Author:** Odyseus

```
All xlets

- Updated localization templates.
- Updated Spanish localizations.
- Updated change logs.
- Updated help pages.

```

***

- **Date:** Fri, 21 Jun 2019 22:52:07 -0300
- **Commit:** [da13ab4](https://gitlab.com/Odyseus/CinnamonTools/commit/da13ab4)
- **Author:** Odyseus

```
JavaScript modules

- debugManager.js: Added possibility to pass extra options.
- xletsSettingsUtils.js: Removed CustomAppletSettings class since I don't use it and it's only useful for single instance applets.

```

***

- **Date:** Fri, 21 Jun 2019 22:46:29 -0300
- **Commit:** [f4baf44](https://gitlab.com/Odyseus/CinnamonTools/commit/f4baf44)
- **Author:** Odyseus

```
Xlets settings framework

Complete redesign
-----------------

Taking advantage of the redesign done upstream to the Cinnamons's settings style (mainly the implementation of sidebars instead of stack switchers at the top), I also redesigned this framework.

- Implemented the use of sidebars instead of using stack switchers in the header bars. This completely removes the problem of never having enough space in the header bar to accommodate the stack switcher. Furthermore, now I'm able to display extra information (the xlet UUID and instance ID) as a subtitle in the header bar.
- Implemented multi-instance handling. Now only one window is used to handle the settings for all instances of an xlet.
- Added an extra button to the "filechooser" widget to clear a previously selected path. As it was, it wasn't possible to remove a selected path (to a file or folder) once was set.
- Removed CSS workaround for sections info buttons since now the buttons aren't inside a toolbar.
- Removed calls to `Gtk.Widget.set_margin_left()` and `Gtk.Widget.set_margin_right()` (both deprecated) in favor of using `Gtk.Widget.set_margin_start()` and `Gtk.Widget.set_margin_end()`.
- Enabled word wrapping for all labels inside a settings window to avoid unnecessary constrains when resizing them.
- Set centered vertical alignment for all widgets to avoid being expanded with their containers.

```

***

- **Date:** Thu, 13 Jun 2019 01:57:14 -0300
- **Commit:** [c923846](https://gitlab.com/Odyseus/CinnamonTools/commit/c923846)
- **Author:** Odyseus

```
Python modules

- Fixed error on the theme building process when there is no previous build data.

```

***

- **Date:** Thu, 13 Jun 2019 00:13:45 -0300
- **Commit:** [d3657c8](https://gitlab.com/Odyseus/CinnamonTools/commit/d3657c8)
- **Author:** Odyseus

```
Python modules

- Adapted xlets build mechanism to the removed flatly_bootstrap_theme sub-module.
- Added missing information dialog to one of the interactive stages of the xlets build process.
- Corrected a typo in a dialog of one of the interactive stages of the xlets build process.

```

***

- **Date:** Wed, 12 Jun 2019 23:53:17 -0300
- **Commit:** [8755d92](https://gitlab.com/Odyseus/CinnamonTools/commit/8755d92)
- **Author:** Odyseus

```
General

- Removed the flatly_bootstrap_theme repository as a sub-module in favor of directly using the needed CSS file. This is to avoid forcing a user to deep clone the repository to be able to build xlets. In fact, `git` shouldn't be needed at all, just downloading the zipped repository is needed to buid the xlets and deep cloning should be needed only to perform development tasks.

```

***

- **Date:** Wed, 5 Jun 2019 20:21:45 -0300
- **Commit:** [1b1f711](https://gitlab.com/Odyseus/CinnamonTools/commit/1b1f711)
- **Author:** Odyseus

```
General

- Updated sub-modules.

```

***

- **Date:** Wed, 5 Jun 2019 20:13:30 -0300
- **Commit:** [9979807](https://gitlab.com/Odyseus/CinnamonTools/commit/9979807)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.
- Updated Bash completions.

```

***

- **Date:** Wed, 5 Jun 2019 20:12:41 -0300
- **Commit:** [de5acba](https://gitlab.com/Odyseus/CinnamonTools/commit/de5acba)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated help pages.

```

***

- **Date:** Wed, 5 Jun 2019 19:55:14 -0300
- **Commit:** [0df8dc1](https://gitlab.com/Odyseus/CinnamonTools/commit/0df8dc1)
- **Author:** Odyseus

```
JavaScript modules

- Renamed extensionSettingsUtils.js module to xletsSettingsUtils.js since now it can handle applets settings too, not just extensions settings.

```

***

- **Date:** Wed, 5 Jun 2019 19:52:33 -0300
- **Commit:** [c6e2502](https://gitlab.com/Odyseus/CinnamonTools/commit/c6e2502)
- **Author:** Odyseus

```
Python modules

- Added `--install-localizations` CLI option to the xlets building process to install xlets localizations. This option can also be specified from the interactive menu.
- Added `--extra-files=<dir>` CLI option to the xlets building process to allow to copy extra files into a built xlet directory. For users that want to make their own modifications to the xlets on the repository is very easy to create a branch in their forks and rebase when needed...if they are `git` experts. Read the documentation for details. This option can also be specified from the interactive menu.
- Simplified prompt validation functions.

```

***

- **Date:** Wed, 5 Jun 2019 19:44:19 -0300
- **Commit:** [a8579bb](https://gitlab.com/Odyseus/CinnamonTools/commit/a8579bb)
- **Author:** Odyseus

```
Squashed '__app__/python_modules/python_utils/' changes from 106f577..efb13da

efb13da simple_validators.py
7915f2c Added simple_validators.py module
d9c0599 file_utils.py

git-subtree-dir: __app__/python_modules/python_utils
git-subtree-split: efb13dafc2bac8360025fa0a1bf096b70fbff10e

```

***

- **Date:** Wed, 5 Jun 2019 19:44:19 -0300
- **Commit:** [1b84dc0](https://gitlab.com/Odyseus/CinnamonTools/commit/1b84dc0)
- **Author:** Odyseus

```
 Merge ref. 'master' of git@gitlab.com:Odyseus/python_utils.git

```

***

- **Date:** Sun, 2 Jun 2019 21:07:10 -0300
- **Commit:** [178210d](https://gitlab.com/Odyseus/CinnamonTools/commit/178210d)
- **Author:** Odyseus

```
All xlets

- Modified all SignalManagers of all xlets to ALWAYS and WITHOUT exceptions use bound normal functions.

```

***

- **Date:** Sun, 2 Jun 2019 17:01:28 -0300
- **Commit:** [644beac](https://gitlab.com/Odyseus/CinnamonTools/commit/644beac)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated README. Corrected links to parts of the documentation.

```

***

- **Date:** Sun, 2 Jun 2019 14:46:57 -0300
- **Commit:** [6ed5b37](https://gitlab.com/Odyseus/CinnamonTools/commit/6ed5b37)
- **Author:** Odyseus

```
Python modules

- Fixed chosen domain name not recognized when building xlets in interactive mode (from the menu).
- Corrected interactivity of the themes building process. When re-implementing interactivity in a previous commit, I forgot to adapt the themes building process.
- Restart Cinnamon (when requested) only if there were no exceptions when executing any of the tasks.

```

***

- **Date:** Sun, 2 Jun 2019 14:45:47 -0300
- **Commit:** [10d02b7](https://gitlab.com/Odyseus/CinnamonTools/commit/10d02b7)
- **Author:** Odyseus

```
Squashed '__app__/python_modules/python_utils/' changes from befc87b..106f577

106f577 cli_utils.py

git-subtree-dir: __app__/python_modules/python_utils
git-subtree-split: 106f577ba3fca608080300729bddfca6c34b601e

```

***

- **Date:** Sun, 2 Jun 2019 14:45:47 -0300
- **Commit:** [dad7405](https://gitlab.com/Odyseus/CinnamonTools/commit/dad7405)
- **Author:** Odyseus

```
 Merge ref. 'master' of git@gitlab.com:Odyseus/python_utils.git

```

***

- **Date:** Sun, 2 Jun 2019 12:42:14 -0300
- **Commit:** [a33c927](https://gitlab.com/Odyseus/CinnamonTools/commit/a33c927)
- **Author:** Odyseus

```
General

- Base xlet: Removed unnecessary file listed in the **make_pot_additional_files** option of the z_config.py file.
- Updated sub-modules.
- Updated manual page.
- Updated Bash completions.

```

***

- **Date:** Sun, 2 Jun 2019 12:39:11 -0300
- **Commit:** [0a731cd](https://gitlab.com/Odyseus/CinnamonTools/commit/0a731cd)
- **Author:** Odyseus

```
Python modules

INFO: All users that take advantage of the Python application's executable being installed into their systems need to reinstall the executable to be able to update the Bash completions.

- Now the use of the CLI menu is totally interactive. There is no need now to start the menu with extra CLI parameters to build xlets or themes. All configuration options that where set with CLI parameters are now set interactively and, after each use, they are stored for later use.
- Made possible to perform development tasks (the **dev** sub-command) on individual xlets. Previously, all development tasks were performed on all xlets at once, modifying a lot of files that didn't need to be modified. For example, when updating POT files (localization templates) for one xlet, all POT files from all xlets were updated; the one from the xlet that needed to be updated (new translatable strings added, old strings removed, etc.), and all the POT files from all the other xlets that didn't need update were also modified (their creation date only). This new change not only avoids unnecessary changes to files, but also speeds up development tasks.

```

***

- **Date:** Sun, 2 Jun 2019 12:38:35 -0300
- **Commit:** [735a41c](https://gitlab.com/Odyseus/CinnamonTools/commit/735a41c)
- **Author:** Odyseus

```
All xlets

- Removed unnecessary file listed in the **make_pot_additional_files** option of the z_config.py file.
- Updated localization templates.
- Updated Spanish localizations.
- Updated change logs.
- Updated help pages.

```

***

- **Date:** Sun, 2 Jun 2019 07:56:45 -0300
- **Commit:** [ffb61c6](https://gitlab.com/Odyseus/CinnamonTools/commit/ffb61c6)
- **Author:** Odyseus

```
Squashed '__app__/python_modules/python_utils/' changes from ad13980..befc87b

befc87b cli_utils.py

git-subtree-dir: __app__/python_modules/python_utils
git-subtree-split: befc87b737955eb7ea1350b0cac199ff9b12dd7b

```

***

- **Date:** Sun, 2 Jun 2019 07:56:45 -0300
- **Commit:** [7b52ae5](https://gitlab.com/Odyseus/CinnamonTools/commit/7b52ae5)
- **Author:** Odyseus

```
 Merge ref. 'master' of git@gitlab.com:Odyseus/python_utils.git

```

***

- **Date:** Sat, 1 Jun 2019 06:07:32 -0300
- **Commit:** [5a588a5](https://gitlab.com/Odyseus/CinnamonTools/commit/5a588a5)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.
- Base xlet: Minor changes due to changes in global modules.

```

***

- **Date:** Sat, 1 Jun 2019 06:07:15 -0300
- **Commit:** [1c3e1a7](https://gitlab.com/Odyseus/CinnamonTools/commit/1c3e1a7)
- **Author:** Odyseus

```
Python modules

- app_utils.py: Get replacement data dynamically when building xlets.

```

***

- **Date:** Sat, 1 Jun 2019 05:43:49 -0300
- **Commit:** [c0a7065](https://gitlab.com/Odyseus/CinnamonTools/commit/c0a7065)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Thu, 30 May 2019 03:46:22 -0300
- **Commit:** [468cac2](https://gitlab.com/Odyseus/CinnamonTools/commit/468cac2)
- **Author:** Odyseus

```
Xlets settings framework

- Modified settings dependency system. Now it is possible for the display of a setting to depend on the values of more than one setting.
- Added application chooser widgets:
    - applist: A setting that stores a list of applications IDs.
    - appchooser: A setting that stores an application ID. Also added its use to the "list" widget as "app" type.
- Replaced the use of the cgi.escape method (due to its deprecation) for the html.escape method.
- Added exception handling when creating widgets to facilitate debugging.
- Desisted of the idea of displaying the application title in the header bar (it never showed the entire title when a stack switcher was used, which made it useless). Instead, I added an icon at the start of the header bar and the application title as a tooltip for that icon.
- Implemented the use of constants to specify default Gtk CSS classes.
- Updated README.

```

***

- **Date:** Thu, 30 May 2019 03:45:51 -0300
- **Commit:** [09bef81](https://gitlab.com/Odyseus/CinnamonTools/commit/09bef81)
- **Author:** Odyseus

```
JavaScript modules

- customDialogs.js: Fixed not working callback.
- customTooltips.js: Tweaked InteligentTooltip.
- debugManager.js:
    - Renamed **prototypeDebugger** method to **methodWrapper** since now it can handle plain objects, not just prototypes.
    - Renamed **wrapPrototypes** method to **wrapObjectMethods** (due to previous point). This function is also modified so it can use any type of settings system on the aDebugger parameter.
    - *Globalized* the template string used inside **wrapPrototypes** so it doesn't have to be redefined in each call.
- globalUtils.js:
    - Improved isBlank function.
    - Modified **removeInjection** function for easy use and safe removals.
    - Renamed **injectMethod** to **injectMethodAfter**.
    - Added **overrideMethod** function. It allows to replace a method inside an object and return the original method for later restoring it.
    - Added **removeOverride** function. It's just a wrapper for **removeInjection**, but with a more accurate name.
    - Added **injectMethodBefore** function.
- Added extensionSettingsUtils.js module.

```

***

- **Date:** Fri, 24 May 2019 20:01:27 -0300
- **Commit:** [7b5a934](https://gitlab.com/Odyseus/CinnamonTools/commit/7b5a934)
- **Author:** Odyseus

```
General

- Updated sub-modules.

```

***

- **Date:** Fri, 24 May 2019 18:48:03 -0300
- **Commit:** [4946be9](https://gitlab.com/Odyseus/CinnamonTools/commit/4946be9)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Fri, 24 May 2019 18:47:38 -0300
- **Commit:** [3c6e5a7](https://gitlab.com/Odyseus/CinnamonTools/commit/3c6e5a7)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Thu, 23 May 2019 02:14:22 -0300
- **Commit:** [6c0f10e](https://gitlab.com/Odyseus/CinnamonTools/commit/6c0f10e)
- **Author:** Odyseus

```
General

- Global JavaScript modules implementation to be used by all xlets. I was using a lot of duplicated functions/classes across all xlets. When I needed to update or fix something, I had to make changes across several files. These global modules "fixes" all of these "problems".
- JavaScript polyfills implementation. I don't really like to use polyfills, but they are comfortable to use (they just need to be imported once and when it is time to stop using them, just remove the polyfill without changing the actual code).
- Updated base xlet to use the global JavaScript modules implementation.
- Minified an HTML asset that erroneously got un-minified.

```

***

- **Date:** Thu, 23 May 2019 02:13:58 -0300
- **Commit:** [aacaff4](https://gitlab.com/Odyseus/CinnamonTools/commit/aacaff4)
- **Author:** Odyseus

```
Python modules

- Added extra data to be replaced in the strings substitution phase of the xlet building process.
- Changed the default values for the client-side decorated shadows when building the Gtk+ 3 themes.

```

***

- **Date:** Sun, 19 May 2019 00:03:08 -0300
- **Commit:** [81a3f66](https://gitlab.com/Odyseus/CinnamonTools/commit/81a3f66)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Sun, 19 May 2019 00:02:05 -0300
- **Commit:** [92b85ca](https://gitlab.com/Odyseus/CinnamonTools/commit/92b85ca)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Thu, 16 May 2019 15:13:01 -0300
- **Commit:** [a2b1b35](https://gitlab.com/Odyseus/CinnamonTools/commit/a2b1b35)
- **Author:** Odyseus

```
General

- Updated README.
- Updated sub-modules.

```

***

- **Date:** Thu, 16 May 2019 15:12:22 -0300
- **Commit:** [f5787df](https://gitlab.com/Odyseus/CinnamonTools/commit/f5787df)
- **Author:** Odyseus

```
All xlets

- Updated localization templates.

```

***

- **Date:** Tue, 14 May 2019 14:44:42 -0300
- **Commit:** [15b7919](https://gitlab.com/Odyseus/CinnamonTools/commit/15b7919)
- **Author:** Odyseus

```
General

- Updated README.
- Updated sub-modules.
- Updated manual page.
- Renamed .sublime folder to .editor. I can smell it; the time in which I will be forced to change the text editor that i use; only, this time, there is not one single usable alternative that is not programed in the worst programing language that ever contaminated the software world!!!
- Added html_tags_striper.py module to make it available for use by xlets.

```

***

- **Date:** Wed, 15 May 2019 09:21:46 -0300
- **Commit:** [07d783b](https://gitlab.com/Odyseus/CinnamonTools/commit/07d783b)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Tue, 14 May 2019 14:20:51 -0300
- **Commit:** [f0cccc9](https://gitlab.com/Odyseus/CinnamonTools/commit/f0cccc9)
- **Author:** Odyseus

```
Xlets settings framework

- Added sorting for the options in a "combobox" widget because it was getting on my nerves having its options completely scrambled every time the widget was re-built! LOL
- Added comments to each element in JSON_SETTINGS_PROPERTIES_MAP to inform by which widget every property is used.
- Added missing tooltip to the "textview" widget.
- Added back the ability to append an xlet "icons" folder to be able to use icons shipped with an xlet. This is needed because the stack switcher can use icons instead of labels and these icons are shipped with an xlet.
- Exposed for configuration the **valtype** option for "combobox" widgets.
- Updated README.

```

***

- **Date:** Mon, 13 May 2019 04:51:12 -0300
- **Commit:** [95fdf21](https://gitlab.com/Odyseus/CinnamonTools/commit/95fdf21)
- **Author:** Odyseus

```
0ExtensionsManager

DEPRECATED

See https://gitlab.com/Odyseus/CinnamonToolsLegacy.

```

***

- **Date:** Mon, 13 May 2019 04:32:52 -0300
- **Commit:** [7ae7e4e](https://gitlab.com/Odyseus/CinnamonTools/commit/7ae7e4e)
- **Author:** Odyseus

```
0PopupTranslator

DEPRECATED

See https://gitlab.com/Odyseus/CinnamonToolsLegacy.

```

***

- **Date:** Mon, 13 May 2019 04:32:34 -0300
- **Commit:** [0335dde](https://gitlab.com/Odyseus/CinnamonTools/commit/0335dde)
- **Author:** Odyseus

```
0WallpaperChangerApplet

DEPRECATED

See https://gitlab.com/Odyseus/CinnamonToolsLegacy.

```

***

- **Date:** Mon, 13 May 2019 04:32:14 -0300
- **Commit:** [096ffc5](https://gitlab.com/Odyseus/CinnamonTools/commit/096ffc5)
- **Author:** Odyseus

```
0CinnamonMaximusForkByOdyseus

DEPRECATED

See https://gitlab.com/Odyseus/CinnamonToolsLegacy.

```

***

- **Date:** Mon, 13 May 2019 04:31:48 -0300
- **Commit:** [ae67d90](https://gitlab.com/Odyseus/CinnamonTools/commit/ae67d90)
- **Author:** Odyseus

```
0WindowDemandsAttentionBehavior

DEPRECATED

See https://gitlab.com/Odyseus/CinnamonToolsLegacy.

```

***

- **Date:** Thu, 9 May 2019 05:13:50 -0300
- **Commit:** [b7a69a4](https://gitlab.com/Odyseus/CinnamonTools/commit/b7a69a4)
- **Author:** Odyseus

```
Xlet settings framework

- Finally fixed TextView annoyance!!!
- Added "immutable" setting to "list" widget. An "immutable" widget can be edited, but items in the list cannot be added nor removed.
- Added "accept-tabs" option to "textview" widget. Setting it to **false** will allow to insert a tab character when pressing the Tab key. Setting it to **false** the Tab key will move the keyboard focus out of the widget.
- Modified the add_reveal_row method of the SectionContainer class to avoid adding double borders to row when a setting depends on another setting.
- Prefer an SVG image instead of a PNG one for the icon used by the settings window.
- Made a couple of custom icons be part of the framework instead of needing to ship them with each xlet.
- Prefer the icons provided by the currently used theme (document-export-symbolic and document-import-symbolic) instead of the custom icon shipped with the framework.

```

***

- **Date:** Sat, 27 Apr 2019 15:12:25 -0300
- **Commit:** [bd31eb8](https://gitlab.com/Odyseus/CinnamonTools/commit/bd31eb8)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Sat, 27 Apr 2019 15:09:18 -0300
- **Commit:** [a2d620c](https://gitlab.com/Odyseus/CinnamonTools/commit/a2d620c)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Fri, 26 Apr 2019 13:44:32 -0300
- **Commit:** [29381df](https://gitlab.com/Odyseus/CinnamonTools/commit/29381df)
- **Author:** Odyseus

```
Xlets settings framework

- Implemented a mechanism to add extra information on specific sections of a window. It adds a button to a section title that when pressed will display a message dialog. This allows to have basic info always at hand without occupying window space and without depending on Gtk tooltips that will show up whenever the hell they want (if at all). ¬¬

```

***

- **Date:** Thu, 25 Apr 2019 02:07:49 -0300
- **Commit:** [100c4bf](https://gitlab.com/Odyseus/CinnamonTools/commit/100c4bf)
- **Author:** Odyseus

```
Xlets settings framework

- Fixed an exception thrown when using a generic setting to control a `spinbutton` widget.
- Inverted the definition of the `options` option for the `combobox` widget.

```

***

- **Date:** Tue, 16 Apr 2019 14:27:40 -0300
- **Commit:** [97c2099](https://gitlab.com/Odyseus/CinnamonTools/commit/97c2099)
- **Author:** Odyseus

```
General

- Updated README.
- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Tue, 16 Apr 2019 14:22:33 -0300
- **Commit:** [cb7b195](https://gitlab.com/Odyseus/CinnamonTools/commit/cb7b195)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Tue, 16 Apr 2019 00:12:19 -0300
- **Commit:** [919d8b3](https://gitlab.com/Odyseus/CinnamonTools/commit/919d8b3)
- **Author:** Odyseus

```
Python modules

- app_utils.py: Corrected reference to non existent property.

```

***

- **Date:** Mon, 15 Apr 2019 20:29:39 -0300
- **Commit:** [81bd8b3](https://gitlab.com/Odyseus/CinnamonTools/commit/81bd8b3)
- **Author:** Odyseus

```
Themes

- Exposed for configuration the shadow for client side decorated windows on the Gtk3 theme.

```

***

- **Date:** Mon, 15 Apr 2019 20:28:37 -0300
- **Commit:** [c177fe6](https://gitlab.com/Odyseus/CinnamonTools/commit/c177fe6)
- **Author:** Odyseus

```
General

- Added a framework to create custom xlet settings windows. It's a simplified version of Cinnamon's native settings widgets, but more configurable and with more widget types, amongst other improvements.
- Corrected a grammar error on one of the base xlet template files.

```

***

- **Date:** Mon, 15 Apr 2019 20:21:34 -0300
- **Commit:** [2ff3e95](https://gitlab.com/Odyseus/CinnamonTools/commit/2ff3e95)
- **Author:** Odyseus

```
Python modules

- app_utils.py:
    - Added option to the themes building process to configure the shadows of client side decorated window on the Gtk3 theme.
    - Implemented the option `make_pot_additional_files` on z_config.py files. It allows to pass extra paths to scan (relative to an xlet source directory) when generating translation templates.
    - Implemented the option `extra_files` on z_config.py files. It allows to specify extra paths to files or folders that need to be copied into an xlet folder when building it.
    - Moved the call to the `_handle_config_file` method before performing string substitutions. This is needed since z_config.py files can be configured to add extra files to an xlet that may contain *substitution data*.
    - Corrected a description when building a base xlet.
    - Added a *1* to all calls to `raise SystemExit()` where was needed so a shell can properly reflect the exit status of a command.

```

***

- **Date:** Tue, 5 Mar 2019 12:51:02 -0300
- **Commit:** [add69c3](https://gitlab.com/Odyseus/CinnamonTools/commit/add69c3)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Tue, 5 Mar 2019 12:50:35 -0300
- **Commit:** [85b12dc](https://gitlab.com/Odyseus/CinnamonTools/commit/85b12dc)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Tue, 5 Mar 2019 02:58:31 -0300
- **Commit:** [56b0905](https://gitlab.com/Odyseus/CinnamonTools/commit/56b0905)
- **Author:** Odyseus

```
All xlets

- Removed files that weren't used by xlets nor the xlet building process. Most of them were leftovers from the old repository.
- Renamed all instances of the applet's main prototypes. For applets with verbose logging enabled, it was very annoying to see the logs of prototypes with names of more than 20 characters.

```

***

- **Date:** Mon, 4 Mar 2019 09:18:01 -0300
- **Commit:** [476c40e](https://gitlab.com/Odyseus/CinnamonTools/commit/476c40e)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Mon, 4 Mar 2019 09:17:41 -0300
- **Commit:** [6485498](https://gitlab.com/Odyseus/CinnamonTools/commit/6485498)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Fri, 1 Mar 2019 20:32:50 -0300
- **Commit:** [dcfd2d7](https://gitlab.com/Odyseus/CinnamonTools/commit/dcfd2d7)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated README.
- Updated manual page.

```

***

- **Date:** Fri, 1 Mar 2019 20:32:18 -0300
- **Commit:** [8157661](https://gitlab.com/Odyseus/CinnamonTools/commit/8157661)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Thu, 28 Feb 2019 20:37:11 -0300
- **Commit:** [7433742](https://gitlab.com/Odyseus/CinnamonTools/commit/7433742)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Thu, 28 Feb 2019 20:36:45 -0300
- **Commit:** [e20b560](https://gitlab.com/Odyseus/CinnamonTools/commit/e20b560)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Thu, 28 Feb 2019 20:02:01 -0300
- **Commit:** [b19a637](https://gitlab.com/Odyseus/CinnamonTools/commit/b19a637)
- **Author:** Odyseus

```
Base xlet

- Switched to a little more precise way of checking if an object is an object.

```

***

- **Date:** Mon, 25 Feb 2019 12:09:45 -0300
- **Commit:** [d7b7815](https://gitlab.com/Odyseus/CinnamonTools/commit/d7b7815)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Mon, 25 Feb 2019 12:09:23 -0300
- **Commit:** [99443e1](https://gitlab.com/Odyseus/CinnamonTools/commit/99443e1)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Thu, 21 Feb 2019 10:52:10 -0300
- **Commit:** [e9a1091](https://gitlab.com/Odyseus/CinnamonTools/commit/e9a1091)
- **Author:** Odyseus

```
Base xlet

- Added call to finalize settings when applet is removed from panel.

```

***

- **Date:** Thu, 21 Feb 2019 10:49:44 -0300
- **Commit:** [17e89c7](https://gitlab.com/Odyseus/CinnamonTools/commit/17e89c7)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Thu, 21 Feb 2019 10:49:17 -0300
- **Commit:** [f6779bd](https://gitlab.com/Odyseus/CinnamonTools/commit/f6779bd)
- **Author:** Odyseus

```
All xelts

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Thu, 21 Feb 2019 10:33:24 -0300
- **Commit:** [a7c88cc](https://gitlab.com/Odyseus/CinnamonTools/commit/a7c88cc)
- **Author:** Odyseus

```
0PopupTranslator

- Added call to finalize settings when applet is removed from panel.

```

***

- **Date:** Tue, 19 Feb 2019 12:43:40 -0300
- **Commit:** [a0cdc9f](https://gitlab.com/Odyseus/CinnamonTools/commit/a0cdc9f)
- **Author:** Odyseus

```
All xlets

- Removed call to function that added the folder called **icons** into Gtk.IconTheme's search path (to be able to use by name the icons shipped with an xlet). This call was needed on older versions of Cinnamon. But since all versions of Cinnamon that I support (in theory) already add said folder into Gtk.IconTheme's search path, I don't need to add it in any of my xlets anymore.

```

***

- **Date:** Tue, 19 Feb 2019 04:38:23 -0300
- **Commit:** [5394cd1](https://gitlab.com/Odyseus/CinnamonTools/commit/5394cd1)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual pages.

```

***

- **Date:** Mon, 18 Feb 2019 02:44:14 -0300
- **Commit:** [8c25e00](https://gitlab.com/Odyseus/CinnamonTools/commit/8c25e00)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Mon, 18 Feb 2019 02:43:03 -0300
- **Commit:** [a4b454e](https://gitlab.com/Odyseus/CinnamonTools/commit/a4b454e)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Mon, 18 Feb 2019 02:42:25 -0300
- **Commit:** [7612643](https://gitlab.com/Odyseus/CinnamonTools/commit/7612643)
- **Author:** Odyseus

```
Python modules

- localized_help_utils.py:
    - Cleaned up unused imports.
    - Removed workaround from the help pages template due to bug fixed upstream (Bootstrap).

```

***

- **Date:** Mon, 18 Feb 2019 00:24:45 -0300
- **Commit:** [b0424f0](https://gitlab.com/Odyseus/CinnamonTools/commit/b0424f0)
- **Author:** Odyseus

```
Themes

- Removed color definition from the `.popup-alternating-menu-item:alternate` selector on the Cinnamon theme. The definition of this color was overwriting the color set by the `active`, `hover`, etc. pseudo classes. Setting the font weight to bold is enough to differentiate an alternate item from a primary one.

```

***

- **Date:** Sun, 17 Feb 2019 02:58:20 -0300
- **Commit:** [f49e859](https://gitlab.com/Odyseus/CinnamonTools/commit/f49e859)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Sun, 17 Feb 2019 02:49:52 -0300
- **Commit:** [a9c9824](https://gitlab.com/Odyseus/CinnamonTools/commit/a9c9824)
- **Author:** Odyseus

```
All xlets

- z_create_localized_help.py script: Use *args instead of named parameters to avoid collisions with variable names.
- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Wed, 13 Feb 2019 00:06:27 -0300
- **Commit:** [83760f5](https://gitlab.com/Odyseus/CinnamonTools/commit/83760f5)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Wed, 13 Feb 2019 00:04:16 -0300
- **Commit:** [9d2c7ee](https://gitlab.com/Odyseus/CinnamonTools/commit/9d2c7ee)
- **Author:** Odyseus

```
General

- Updated README.
- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Tue, 12 Feb 2019 23:59:22 -0300
- **Commit:** [f999313](https://gitlab.com/Odyseus/CinnamonTools/commit/f999313)
- **Author:** Odyseus

```
Base xlet

- Added a couple of utility functions and improved existent ones.

```

***

- **Date:** Tue, 12 Feb 2019 23:58:23 -0300
- **Commit:** [5c53ecc](https://gitlab.com/Odyseus/CinnamonTools/commit/5c53ecc)
- **Author:** Odyseus

```
Python modules

- Modified xlets help pages build process to use external assets instead of in-line ones. This allows smaller HELP.html files and a smaller footprint of these files on the repository size.

```

***

- **Date:** Mon, 21 Jan 2019 22:20:56 -0300
- **Commit:** [a6ae6e6](https://gitlab.com/Odyseus/CinnamonTools/commit/a6ae6e6)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Mon, 21 Jan 2019 22:19:21 -0300
- **Commit:** [fd6c70e](https://gitlab.com/Odyseus/CinnamonTools/commit/fd6c70e)
- **Author:** Odyseus

```
All xlets

- Removed all version fields from metadata.json files. I never remember to update them and newer version of Cinnamon doesn't even use this field anymore.
- Python files clean up/homogenization.
- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Mon, 21 Jan 2019 21:53:32 -0300
- **Commit:** [8b49e1e](https://gitlab.com/Odyseus/CinnamonTools/commit/8b49e1e)
- **Author:** Odyseus

```
0ExtensionsManager

- Changed applet icon.

```

***

- **Date:** Thu, 17 Jan 2019 16:02:21 -0300
- **Commit:** [8004853](https://gitlab.com/Odyseus/CinnamonTools/commit/8004853)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Thu, 17 Jan 2019 16:00:06 -0300
- **Commit:** [512c345](https://gitlab.com/Odyseus/CinnamonTools/commit/512c345)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Thu, 17 Jan 2019 15:50:43 -0300
- **Commit:** [460ccc0](https://gitlab.com/Odyseus/CinnamonTools/commit/460ccc0)
- **Author:** Odyseus

```
BaseXlet

- Homogenized/Cleaned up code.
- Added method to benchmark function invocations within a given class or prototype.
- Added escape/unescape replacer.

```

***

- **Date:** Thu, 17 Jan 2019 14:16:56 -0300
- **Commit:** [83966c3](https://gitlab.com/Odyseus/CinnamonTools/commit/83966c3)
- **Author:** Odyseus

```
0WallpaperChangerApplet

- Python files improvements:
    - Simplified localization system.
    - Homogenized/Cleaned up code.

```

***

- **Date:** Thu, 17 Jan 2019 14:15:49 -0300
- **Commit:** [040fe52](https://gitlab.com/Odyseus/CinnamonTools/commit/040fe52)
- **Author:** Odyseus

```
0PopupTranslator

- Python files improvements:
    - Simplified localization system.
    - Homogenized/Cleaned up code.

```

***

- **Date:** Thu, 17 Jan 2019 14:15:20 -0300
- **Commit:** [6c88fce](https://gitlab.com/Odyseus/CinnamonTools/commit/6c88fce)
- **Author:** Odyseus

```
0ExtensionsManager

- Python files improvements:
    - Simplified localization system.
    - Homogenized/Cleaned up code.

```

***

- **Date:** Tue, 15 Jan 2019 22:37:39 -0300
- **Commit:** [2ccca02](https://gitlab.com/Odyseus/CinnamonTools/commit/2ccca02)
- **Author:** Odyseus

```
0ExtensionsManager

- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

```

***

- **Date:** Tue, 15 Jan 2019 22:36:52 -0300
- **Commit:** [bd43310](https://gitlab.com/Odyseus/CinnamonTools/commit/bd43310)
- **Author:** Odyseus

```
0PopupTranslator

- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

```

***

- **Date:** Sat, 12 Jan 2019 03:25:45 -0300
- **Commit:** [7e0b3b5](https://gitlab.com/Odyseus/CinnamonTools/commit/7e0b3b5)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Sat, 12 Jan 2019 03:24:20 -0300
- **Commit:** [bc08c54](https://gitlab.com/Odyseus/CinnamonTools/commit/bc08c54)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Tue, 8 Jan 2019 21:29:58 -0300
- **Commit:** [35dc780](https://gitlab.com/Odyseus/CinnamonTools/commit/35dc780)
- **Author:** Odyseus

```
All xlets

- Implemented assignments destructuring for all imports. A completely unnecessary change implemented for the sole purpose of getting used to this JavaScript feature.

```

***

- **Date:** Tue, 1 Jan 2019 13:32:50 -0300
- **Commit:** [4e9a380](https://gitlab.com/Odyseus/CinnamonTools/commit/4e9a380)
- **Author:** Odyseus

```
Themes

- Cinnamon theme:
    - Removed italic styling from the menu-category-button-greyed class. This class is applied to the category buttons in the Cinnamon menu applet when performing searches. Every time that a search was performed, the italic styling changed the size of the categories box (ultra ANNOYING!!!). A lighter color for the font is good enough to represent a disabled button.

```

***

- **Date:** Tue, 25 Dec 2018 21:06:28 -0300
- **Commit:** [862da4d](https://gitlab.com/Odyseus/CinnamonTools/commit/862da4d)
- **Author:** Odyseus

```
Squashed '__app__/python_modules/python_utils/' changes from 8569483..ad13980

ad13980 mistune_utils.py
ba65e36 json_schema_utils.py
3af411f Updated README

git-subtree-dir: __app__/python_modules/python_utils
git-subtree-split: ad139808b4cf9c17033c1c39e8b17bc6054e36a0

```

***

- **Date:** Tue, 25 Dec 2018 21:06:28 -0300
- **Commit:** [19afc54](https://gitlab.com/Odyseus/CinnamonTools/commit/19afc54)
- **Author:** Odyseus

```
 Merge ref. 'master' of git@gitlab.com:Odyseus/python_utils.git

```

***

- **Date:** Tue, 25 Dec 2018 21:06:08 -0300
- **Commit:** [6c3ae09](https://gitlab.com/Odyseus/CinnamonTools/commit/6c3ae09)
- **Author:** Odyseus

```
All xlets

- Updated localization templates, Spanish localizations and help pages.

```

***

- **Date:** Tue, 25 Dec 2018 21:05:16 -0300
- **Commit:** [9877e66](https://gitlab.com/Odyseus/CinnamonTools/commit/9877e66)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Tue, 25 Dec 2018 00:05:20 -0300
- **Commit:** [94cfb4c](https://gitlab.com/Odyseus/CinnamonTools/commit/94cfb4c)
- **Author:** Odyseus

```
All xlets

- Updated change logs.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.
- Organized import statements from all z_create_localized_help.py scripts.

```

***

- **Date:** Tue, 25 Dec 2018 00:00:22 -0300
- **Commit:** [f3cb8c8](https://gitlab.com/Odyseus/CinnamonTools/commit/f3cb8c8)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.
- Organized import statements of the BaseXlet's z_create_localized_help.py script.

```

***

- **Date:** Mon, 24 Dec 2018 23:59:39 -0300
- **Commit:** [a77b913](https://gitlab.com/Odyseus/CinnamonTools/commit/a77b913)
- **Author:** Odyseus

```
Python modules

- Updated xlets help page template footer.
- Blacklisted jsonschema Python module when generating documentation.

```

***

- **Date:** Sat, 22 Dec 2018 17:48:26 -0300
- **Commit:** [84c5bbe](https://gitlab.com/Odyseus/CinnamonTools/commit/84c5bbe)
- **Author:** Odyseus

```
Themes

- Cinnamon theme: changed fixed font size for the run-dialog-completion-box class to a relative font size.

```

***

- **Date:** Fri, 21 Dec 2018 14:30:45 -0300
- **Commit:** [4523cb5](https://gitlab.com/Odyseus/CinnamonTools/commit/4523cb5)
- **Author:** Odyseus

```
Themes

- Cinnamon theme: fixed erroneous styling of items from the grouped window applet when this applet is placed in the bottom panel.

```

***

- **Date:** Thu, 20 Dec 2018 18:20:44 -0300
- **Commit:** [6223ecb](https://gitlab.com/Odyseus/CinnamonTools/commit/6223ecb)
- **Author:** Odyseus

```
General

- Added paths completion to the Bash completions script.

```

***

- **Date:** Wed, 19 Dec 2018 07:07:29 -0300
- **Commit:** [2248f0a](https://gitlab.com/Odyseus/CinnamonTools/commit/2248f0a)
- **Author:** Odyseus

```
Squashed '__app__/python_modules/python_utils/' changes from 699056e..8569483

8569483 template_utils.py
c01c0d4 string_utils.py
8905cb7 sphinx_docs_utils.py
ec1750a misc_utils.py

git-subtree-dir: __app__/python_modules/python_utils
git-subtree-split: 8569483f1f0dafca898fb58f3009646ab04df07b

```

***

- **Date:** Wed, 19 Dec 2018 07:07:29 -0300
- **Commit:** [087a23f](https://gitlab.com/Odyseus/CinnamonTools/commit/087a23f)
- **Author:** Odyseus

```
 Merge ref. 'master' of git@gitlab.com:Odyseus/python_utils.git

```

***

- **Date:** Wed, 19 Dec 2018 06:08:01 -0300
- **Commit:** [0b08f75](https://gitlab.com/Odyseus/CinnamonTools/commit/0b08f75)
- **Author:** Odyseus

```
Python modules

- Cosmetic tweaks due to changes to the python_utils.ansi_colors.py module.
- app_utils.py module:
    - Improved theme building process.
    - Now it is possible to non-interactively build themes if previous build data is found.
    - Previous build data can now be previewed.
    - Added support for building version 4.0.x+ of the Cinnamon theme.
    - Unified missing theme/domain name messages.

```

***

- **Date:** Mon, 17 Dec 2018 15:43:52 -0300
- **Commit:** [8493bf3](https://gitlab.com/Odyseus/CinnamonTools/commit/8493bf3)
- **Author:** Odyseus

```
Squashed '__app__/python_modules/python_utils/' changes from a85ed7f..699056e

699056e git_utils.py
64f5075 mail_system.py
b22fc10 log_system.py
008e543 All modules
1a62085 template_utils.py
aa6d2f5 prompts.py
07e4d3e menu.py
31c4987 exceptions.py
3ffca3a log_system.py
86479b9 ansi_colors.py
067297c cli_utils.py
8dd6b24 Added json_schema_utils.py module
6eefefa shell_utils.py
2452b3f Added jsonschema module

git-subtree-dir: __app__/python_modules/python_utils
git-subtree-split: 699056ecc3e79a1e746a8ec22957748bbbb47932

```

***

- **Date:** Mon, 17 Dec 2018 15:43:52 -0300
- **Commit:** [9e0f5c3](https://gitlab.com/Odyseus/CinnamonTools/commit/9e0f5c3)
- **Author:** Odyseus

```
Merge ref. 'master' of git@gitlab.com:Odyseus/python_utils.git

```

***

- **Date:** Mon, 17 Dec 2018 15:37:18 -0300
- **Commit:** [3665405](https://gitlab.com/Odyseus/CinnamonTools/commit/3665405)
- **Author:** Odyseus

```
Themes

- Metacity theme:
    - Fixed attached dialog titlebar. (Upstream fix)
- Gtk3 theme:
    - Properly place the "grab" area for pane separators. (Upstream fix)
    - Style new overview classes. (Upstream fix)
    - Improve the titlebar styling. (Upstream fix)
    - Special case some headerbars. (Upstream fix)
    - Don't use pure white for file managers sidebar foregrounds. (Upstream fix)
    - Fixed some missing commas.
    - Eradication of single quotes.
    - Fixed some white space inconsistencies.
- Cinnamon theme:
    - Added support for the grouped window list applet. (Upstream fix)
    - Use square menu favorites buttons. (Upstream fix)
    - Center align text in applets. (Upstream fix)
    - Updated the parse_sass.py script to generate on-the-fly from a template the SASS files used to build the Cinnamon theme CSS files.
    - Restructured SASS files to avoid breakages caused by mediocre code formatters.

```

***

- **Date:** Thu, 29 Nov 2018 10:27:03 -0300
- **Commit:** [a1afdc0](https://gitlab.com/Odyseus/CinnamonTools/commit/a1afdc0)
- **Author:** Odyseus

```
Squashed '__app__/python_modules/python_utils/' changes from 32f916b..a85ed7f

a85ed7f Updated README
ab11c25 mistune_utils.py

git-subtree-dir: __app__/python_modules/python_utils
git-subtree-split: a85ed7f9e80a4d2f6cac663485dd3e2e9f9fadfe

```

***

- **Date:** Thu, 29 Nov 2018 10:27:03 -0300
- **Commit:** [1ee96b4](https://gitlab.com/Odyseus/CinnamonTools/commit/1ee96b4)
- **Author:** Odyseus

```
Merge commit 'a1afdc02cdb09102a51fd47b8ede2162c241f48b'

```

***

- **Date:** Thu, 29 Nov 2018 10:26:42 -0300
- **Commit:** [dfda8f2](https://gitlab.com/Odyseus/CinnamonTools/commit/dfda8f2)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Wed, 28 Nov 2018 06:44:59 -0300
- **Commit:** [721b53b](https://gitlab.com/Odyseus/CinnamonTools/commit/721b53b)
- **Author:** Odyseus

```
Python modules

- localized_help_creator.py module:
    - Implemented the use of the new python_utils.mistune_utils module.

```

***

- **Date:** Wed, 28 Nov 2018 06:43:21 -0300
- **Commit:** [9598609](https://gitlab.com/Odyseus/CinnamonTools/commit/9598609)
- **Author:** Odyseus

```
Squashed '__app__/python_modules/python_utils/' changes from 87d1c2c..32f916b

32f916b Added mistune_utils.py module
0ad9296 mistune.py
e1481ae sphinx_docs_utils.py
97a519e All modules
6691d3a All modules
322ff84 file_utils.py
a138fcf prompts.py
ebfe98e string_utils.py
9f1d45f All modules docstrings
aaf3797 string_utils.py

git-subtree-dir: __app__/python_modules/python_utils
git-subtree-split: 32f916b66253389a537f0995dddac7ab2d894812

```

***

- **Date:** Wed, 28 Nov 2018 06:43:21 -0300
- **Commit:** [029f82a](https://gitlab.com/Odyseus/CinnamonTools/commit/029f82a)
- **Author:** Odyseus

```
Merge commit '95986094b05ebe424e997ece7e084ae418525f0d'

```

***

- **Date:** Sat, 24 Nov 2018 02:22:51 -0300
- **Commit:** [ebbaf2d](https://gitlab.com/Odyseus/CinnamonTools/commit/ebbaf2d)
- **Author:** Odyseus

```
General

- Updated README.
- Updated sub-modules.

```

***

- **Date:** Sat, 24 Nov 2018 02:20:06 -0300
- **Commit:** [5b0709c](https://gitlab.com/Odyseus/CinnamonTools/commit/5b0709c)
- **Author:** Odyseus

```
All xlets

- Updated localization templates.
- Updated Spanish localizations.
- Updated change logs.
- Updated help pages.

```

***

- **Date:** Sat, 24 Nov 2018 00:54:39 -0300
- **Commit:** [61a2aff](https://gitlab.com/Odyseus/CinnamonTools/commit/61a2aff)
- **Author:** Odyseus

```
Python modules

- Implemented --dry-run CLI option. Not used for development tasks, just for "end-users tasks".
- Removed some unnecessary calls to super().
- Renamed/grouped some modules/classes properties to minimize the amount of docstrings. I'm feeling like a real developer that goes to extreme lengths to avoid writing documentation. LOL
- cli.py module:
    - Updated the manage_repo_subtrees method due to changes to the python_utils.git_utils module.
- localized_help_creator.py module:
    - Made the usage of the third-party module called pyuca optional.

```

***

- **Date:** Sat, 24 Nov 2018 00:42:35 -0300
- **Commit:** [f78d29d](https://gitlab.com/Odyseus/CinnamonTools/commit/f78d29d)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.
- Updated Bash completions script.

```

***

- **Date:** Fri, 23 Nov 2018 02:06:44 -0300
- **Commit:** [1849b4f](https://gitlab.com/Odyseus/CinnamonTools/commit/1849b4f)
- **Author:** Odyseus

```
Squashed '__app__/python_modules/python_utils/' content from commit 87d1c2c

git-subtree-dir: __app__/python_modules/python_utils
git-subtree-split: 87d1c2c3b61ac837797fbcd9c6549a955e8607fa

```

***

- **Date:** Fri, 23 Nov 2018 02:06:44 -0300
- **Commit:** [a8bde80](https://gitlab.com/Odyseus/CinnamonTools/commit/a8bde80)
- **Author:** Odyseus

```
Merge commit '1849b4f19efd545411195dd2656e0f5dac54bced' as '__app__/python_modules/python_utils'

```

***

- **Date:** Fri, 23 Nov 2018 02:02:07 -0300
- **Commit:** [feb5d95](https://gitlab.com/Odyseus/CinnamonTools/commit/feb5d95)
- **Author:** Odyseus

```
Reset python_utils subtree

```

***

- **Date:** Fri, 23 Nov 2018 01:30:41 -0300
- **Commit:** [f2f3d53](https://gitlab.com/Odyseus/CinnamonTools/commit/f2f3d53)
- **Author:** Odyseus

```
Merge branch 'master' of gitlab.com:Odyseus/python_utils

```

***

- **Date:** Wed, 21 Nov 2018 21:07:26 -0300
- **Commit:** [87d1c2c](https://gitlab.com/Odyseus/CinnamonTools/commit/87d1c2c)
- **Author:** Odyseus

```
git_utils.py

- Corrected submodule command formatting.

```

***

- **Date:** Tue, 20 Nov 2018 17:46:50 -0300
- **Commit:** [473ea71](https://gitlab.com/Odyseus/CinnamonTools/commit/473ea71)
- **Author:** Odyseus

```
git_utils.py

- Corrected erroneous reference.

```

***

- **Date:** Mon, 19 Nov 2018 13:49:08 -0300
- **Commit:** [02a7181](https://gitlab.com/Odyseus/CinnamonTools/commit/02a7181)
- **Author:** Odyseus

```
Updated README

```

***

- **Date:** Mon, 19 Nov 2018 13:48:46 -0300
- **Commit:** [bdff73b](https://gitlab.com/Odyseus/CinnamonTools/commit/bdff73b)
- **Author:** Odyseus

```
git_utils.py

- Modified the manage_repo method to use the git-subtree command to handle sub-tree repositories instead of using the subtree merge strategy.
- Added dry_run parameter to the manage_repo method and switched to use the cmd_utils module instead of using subprocess.call.

```

***

- **Date:** Mon, 19 Nov 2018 13:43:55 -0300
- **Commit:** [83aefbe](https://gitlab.com/Odyseus/CinnamonTools/commit/83aefbe)
- **Author:** Odyseus

```
Updated tqdm module from upstream

```

***

- **Date:** Mon, 19 Nov 2018 13:43:36 -0300
- **Commit:** [d3b7ef5](https://gitlab.com/Odyseus/CinnamonTools/commit/d3b7ef5)
- **Author:** Odyseus

```
Updated pyperclip module from upstream

```

***

- **Date:** Mon, 19 Nov 2018 13:43:19 -0300
- **Commit:** [1455c96](https://gitlab.com/Odyseus/CinnamonTools/commit/1455c96)
- **Author:** Odyseus

```
Updated bottle module from upstream

```

***

- **Date:** Mon, 19 Nov 2018 13:42:10 -0300
- **Commit:** [dbbdb1b](https://gitlab.com/Odyseus/CinnamonTools/commit/dbbdb1b)
- **Author:** Odyseus

```
Removed pyuca module

```

***

- **Date:** Wed, 14 Nov 2018 14:49:03 -0300
- **Commit:** [a07ca85](https://gitlab.com/Odyseus/CinnamonTools/commit/a07ca85)
- **Author:** Odyseus

```
git_utils.py

- Reverted the addition of the --squash parameter when updating sub-trees. It causes more damage than good. I CAN'T CATCH A BREAK!!!

```

***

- **Date:** Wed, 14 Nov 2018 09:55:22 -0300
- **Commit:** [94949af](https://gitlab.com/Odyseus/CinnamonTools/commit/94949af)
- **Author:** Odyseus

```
git_utils.py

- Added --squash parameter to squash commits when updating sub-trees.

```

***

- **Date:** Wed, 14 Nov 2018 08:43:32 -0300
- **Commit:** [ae16273](https://gitlab.com/Odyseus/CinnamonTools/commit/ae16273)
- **Author:** Odyseus

```
log_system.py

- Changed approach to handle logging levels.

```

***

- **Date:** Tue, 13 Nov 2018 21:26:43 -0300
- **Commit:** [abc14a2](https://gitlab.com/Odyseus/CinnamonTools/commit/abc14a2)
- **Author:** Odyseus

```
log_system.py

- Fixed erroneous default attribute call.
- Renamed parameter named type to log_type to avoid problems.

```

***

- **Date:** Tue, 13 Nov 2018 15:41:51 -0300
- **Commit:** [5eca64b](https://gitlab.com/Odyseus/CinnamonTools/commit/5eca64b)
- **Author:** Odyseus

```
mail_system.py

- Removed unnecessary call to super().

```

***

- **Date:** Tue, 13 Nov 2018 15:31:58 -0300
- **Commit:** [2f3b5e2](https://gitlab.com/Odyseus/CinnamonTools/commit/2f3b5e2)
- **Author:** Odyseus

```
log_system.py

- Simplified _update_log method.

```

***

- **Date:** Tue, 13 Nov 2018 13:55:17 -0300
- **Commit:** [fd0b251](https://gitlab.com/Odyseus/CinnamonTools/commit/fd0b251)
- **Author:** Odyseus

```
log_system.py

- Added log_dry_run method.

```

***

- **Date:** Sat, 10 Nov 2018 06:27:44 -0300
- **Commit:** [c24faf3](https://gitlab.com/Odyseus/CinnamonTools/commit/c24faf3)
- **Author:** Odyseus

```
sphinx_docs_utils.py

- Usage of the cmd_utils module.
- Made coverage docs building optional.
-

```

***

- **Date:** Sat, 10 Nov 2018 06:26:31 -0300
- **Commit:** [f22c18c](https://gitlab.com/Odyseus/CinnamonTools/commit/f22c18c)
- **Author:** Odyseus

```
exceptions.py

- Added new exception.

```

***

- **Date:** Mon, 29 Oct 2018 13:59:21 -0300
- **Commit:** [8dea2a0](https://gitlab.com/Odyseus/CinnamonTools/commit/8dea2a0)
- **Author:** Odyseus

```
General

- Updated sub-modules.

```

***

- **Date:** Mon, 29 Oct 2018 13:57:56 -0300
- **Commit:** [3593cd2](https://gitlab.com/Odyseus/CinnamonTools/commit/3593cd2)
- **Author:** Odyseus

```
Python modules

- Implemented the use of methods declared in the cmd_utils module.
- Updated docstrings.
- `app_utils.py` module:
    - Added capability to remember and reuse the values used in the themes building process.

```

***

- **Date:** Mon, 29 Oct 2018 13:49:55 -0300
- **Commit:** [3ef9471](https://gitlab.com/Odyseus/CinnamonTools/commit/3ef9471)
- **Author:** Odyseus

```
General

- Updated README.
- Updated manual page.
- Updated sub-modules.
- Updated helper.py script.

```

***

- **Date:** Mon, 29 Oct 2018 13:46:33 -0300
- **Commit:** [b03d503](https://gitlab.com/Odyseus/CinnamonTools/commit/b03d503)
- **Author:** Odyseus

```
All xlets

- Updated localization templates.
- Updated Spanish localizations.
- Updated help pages.

```

***

- **Date:** Mon, 29 Oct 2018 13:30:31 -0300
- **Commit:** [16d2ff4](https://gitlab.com/Odyseus/CinnamonTools/commit/16d2ff4)
- **Author:** Odyseus

```
Merge branch 'master' of gitlab.com:Odyseus/python_utils

```

***

- **Date:** Mon, 29 Oct 2018 13:30:05 -0300
- **Commit:** [a1db2d7](https://gitlab.com/Odyseus/CinnamonTools/commit/a1db2d7)
- **Author:** Odyseus

```
mail_system.py

- Made the keyring module optional.
- Added password prompt feature.
- Separated the key to get a password with the keyring module into two keys to facilitate options merging.

```

***

- **Date:** Mon, 29 Oct 2018 13:25:10 -0300
- **Commit:** [14d5156](https://gitlab.com/Odyseus/CinnamonTools/commit/14d5156)
- **Author:** Odyseus

```
Docstrings update

```

***

- **Date:** Sun, 28 Oct 2018 13:56:00 -0300
- **Commit:** [c86cf4f](https://gitlab.com/Odyseus/CinnamonTools/commit/c86cf4f)
- **Author:** Odyseus

```
mistune.py

- Added upstream fixes.
- Added blockquote class to the blockquote tag.

```

***

- **Date:** Sun, 28 Oct 2018 13:55:15 -0300
- **Commit:** [ce476df](https://gitlab.com/Odyseus/CinnamonTools/commit/ce476df)
- **Author:** Odyseus

```
misc_utils.py

- Added method to merge two dictionaries.

```

***

- **Date:** Sun, 28 Oct 2018 13:54:01 -0300
- **Commit:** [d6b2c6e](https://gitlab.com/Odyseus/CinnamonTools/commit/d6b2c6e)
- **Author:** Odyseus

```
log_system.py

- Added method to get path to the log file.
- Changed default log file name.
- Renamed some methods to make them "private".

```

***

- **Date:** Sun, 28 Oct 2018 13:42:57 -0300
- **Commit:** [1d10309](https://gitlab.com/Odyseus/CinnamonTools/commit/1d10309)
- **Author:** Odyseus

```
file_utils.py

- Use is_real_dir instead of os.path.exists inside custom_copy2 method.

```

***

- **Date:** Sun, 28 Oct 2018 13:40:46 -0300
- **Commit:** [da74d40](https://gitlab.com/Odyseus/CinnamonTools/commit/da74d40)
- **Author:** Odyseus

```
cmd_utils.py

- Added parameters to set and unset environment variables to the get_environment method.
- Added the env parameter to the run_cmd method.

```

***

- **Date:** Sun, 7 Oct 2018 12:38:41 -0300
- **Commit:** [b6e9675](https://gitlab.com/Odyseus/CinnamonTools/commit/b6e9675)
- **Author:** Odyseus

```
Merge branch 'master' of gitlab.com:Odyseus/python_utils

```

***

- **Date:** Sun, 7 Oct 2018 09:32:30 -0300
- **Commit:** [576dfea](https://gitlab.com/Odyseus/CinnamonTools/commit/576dfea)
- **Author:** Odyseus

```
Python modules

- `cli.py` module:
    - Corrected logs storage path.

```

***

- **Date:** Sat, 6 Oct 2018 09:54:59 -0300
- **Commit:** [afff7f1](https://gitlab.com/Odyseus/CinnamonTools/commit/afff7f1)
- **Author:** Odyseus

```
cmd_utils.py

- Added some default parameters to the run_cmd method.

```

***

- **Date:** Sat, 6 Oct 2018 08:49:57 -0300
- **Commit:** [328e8a0](https://gitlab.com/Odyseus/CinnamonTools/commit/328e8a0)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.
- Updated Bash completions script to be less dependent on Bash functions that may or may not exist. Also removed a Bash function if favor of using a call the the Python application to get data more reliably.

```

***

- **Date:** Sat, 6 Oct 2018 08:49:48 -0300
- **Commit:** [c293c7c](https://gitlab.com/Odyseus/CinnamonTools/commit/c293c7c)
- **Author:** Odyseus

```
Python modules

- `cli.py` and `app_utils.py` modules:
    - Added method and CLI command to print xlets slugs. This is used only by the Bash completions script.

```

***

- **Date:** Sat, 6 Oct 2018 08:45:24 -0300
- **Commit:** [dc2d4c7](https://gitlab.com/Odyseus/CinnamonTools/commit/dc2d4c7)
- **Author:** Odyseus

```
All xlets

- Updated localization templates.
- Updated Spanish localization.
- Updated change logs.
- Updated help pages.

```

***

- **Date:** Fri, 5 Oct 2018 04:40:41 -0300
- **Commit:** [7ef1100](https://gitlab.com/Odyseus/CinnamonTools/commit/7ef1100)
- **Author:** Odyseus

```
0PopupTranslator

- Fixed handling of clipboard for Cinnamon versions greater than 3.6.x due to API changes.

```

***

- **Date:** Tue, 2 Oct 2018 04:24:42 -0300
- **Commit:** [eab372f](https://gitlab.com/Odyseus/CinnamonTools/commit/eab372f)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Tue, 2 Oct 2018 04:19:00 -0300
- **Commit:** [673b6b3](https://gitlab.com/Odyseus/CinnamonTools/commit/673b6b3)
- **Author:** Odyseus

```
Merge branch 'master' of gitlab.com:Odyseus/python_utils

```

***

- **Date:** Tue, 2 Oct 2018 04:17:22 -0300
- **Commit:** [243e8e6](https://gitlab.com/Odyseus/CinnamonTools/commit/243e8e6)
- **Author:** Odyseus

```
log_system.py

- Added obfuscation of User's home folder path when printing "on screen".

```

***

- **Date:** Tue, 2 Oct 2018 04:15:41 -0300
- **Commit:** [c147856](https://gitlab.com/Odyseus/CinnamonTools/commit/c147856)
- **Author:** Odyseus

```
hash_utils.py

- New module with utilities to get the checksum of a file or a folder.

```

***

- **Date:** Tue, 2 Oct 2018 04:14:37 -0300
- **Commit:** [39beaeb](https://gitlab.com/Odyseus/CinnamonTools/commit/39beaeb)
- **Author:** Odyseus

```
file_utils.py

- Added expand_path method used to expand environment variables used in a path.
- Renamed copy_symlink method to copy_create_symlink.
- Removed commented not used file_hash method.

```

***

- **Date:** Tue, 2 Oct 2018 04:11:23 -0300
- **Commit:** [22d71e6](https://gitlab.com/Odyseus/CinnamonTools/commit/22d71e6)
- **Author:** Odyseus

```
cmd_utils.py

- Added run_cmd method.

```

***

- **Date:** Tue, 2 Oct 2018 04:10:18 -0300
- **Commit:** [122051d](https://gitlab.com/Odyseus/CinnamonTools/commit/122051d)
- **Author:** Odyseus

```
All modules

- Standardized organization of import statements.

```

***

- **Date:** Fri, 28 Sep 2018 04:14:58 -0300
- **Commit:** [3e90dbf](https://gitlab.com/Odyseus/CinnamonTools/commit/3e90dbf)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated link to image in README.

```

***

- **Date:** Fri, 28 Sep 2018 00:38:44 -0300
- **Commit:** [16a109c](https://gitlab.com/Odyseus/CinnamonTools/commit/16a109c)
- **Author:** Odyseus

```
Python modules

- Updated all modules to an standardized organization of import statements.

```

***

- **Date:** Fri, 28 Sep 2018 00:36:54 -0300
- **Commit:** [2f9cfd0](https://gitlab.com/Odyseus/CinnamonTools/commit/2f9cfd0)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.
- Updated README.
- Updated Sublime Text project files.

```

***

- **Date:** Fri, 28 Sep 2018 00:34:52 -0300
- **Commit:** [c2f6942](https://gitlab.com/Odyseus/CinnamonTools/commit/c2f6942)
- **Author:** Odyseus

```
All xlets

- Updated localization templates.
- Updated help pages.
- Updated changelogs.

```

***

- **Date:** Sat, 22 Sep 2018 18:08:02 -0300
- **Commit:** [2e50226](https://gitlab.com/Odyseus/CinnamonTools/commit/2e50226)
- **Author:** Odyseus

```
Python modules

- `cli.py` module:
    - Redesigned to use the python_utils.cli_utils module.
    - Corrected options description of the docopt docstring.

```

***

- **Date:** Sat, 22 Sep 2018 18:05:29 -0300
- **Commit:** [10553a9](https://gitlab.com/Odyseus/CinnamonTools/commit/10553a9)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.

```

***

- **Date:** Sat, 22 Sep 2018 17:38:53 -0300
- **Commit:** [0ef84bc](https://gitlab.com/Odyseus/CinnamonTools/commit/0ef84bc)
- **Author:** Odyseus

```
Merge branch 'master' of gitlab.com:Odyseus/python_utils

```

***

- **Date:** Sat, 22 Sep 2018 17:38:20 -0300
- **Commit:** [1da11b1](https://gitlab.com/Odyseus/CinnamonTools/commit/1da11b1)
- **Author:** Odyseus

```
cli_utils.py

- Corrected logic of the _cli_header_blacklist handling.

```

***

- **Date:** Sat, 22 Sep 2018 17:21:35 -0300
- **Commit:** [57eaf06](https://gitlab.com/Odyseus/CinnamonTools/commit/57eaf06)
- **Author:** Odyseus

```
Merge branch 'master' of gitlab.com:Odyseus/python_utils

```

***

- **Date:** Sat, 22 Sep 2018 15:26:17 -0300
- **Commit:** [14043ff](https://gitlab.com/Odyseus/CinnamonTools/commit/14043ff)
- **Author:** Odyseus

```
cli_utils.py

- Updated docstrings.

```

***

- **Date:** Sat, 22 Sep 2018 15:25:49 -0300
- **Commit:** [6c75b77](https://gitlab.com/Odyseus/CinnamonTools/commit/6c75b77)
- **Author:** Odyseus

```
exceptions.py

- Added new exception.

```

***

- **Date:** Fri, 21 Sep 2018 20:29:55 -0300
- **Commit:** [4998a84](https://gitlab.com/Odyseus/CinnamonTools/commit/4998a84)
- **Author:** Odyseus

```
cli_utils.py

- Modified to pass individual parameters instead of passing an imported module. Because Python can be as retarded as JavaScript sometimes. ¬¬

```

***

- **Date:** Fri, 21 Sep 2018 16:53:24 -0300
- **Commit:** [9bbdfbb](https://gitlab.com/Odyseus/CinnamonTools/commit/9bbdfbb)
- **Author:** Odyseus

```
Added new cli_utils.py module

```

***

- **Date:** Fri, 21 Sep 2018 16:53:17 -0300
- **Commit:** [3d68176](https://gitlab.com/Odyseus/CinnamonTools/commit/3d68176)
- **Author:** Odyseus

```
exceptions.py

- Removed unnecessary parameters when calling super().
- Added new exceptions.

```

***

- **Date:** Fri, 21 Sep 2018 16:52:42 -0300
- **Commit:** [199ad08](https://gitlab.com/Odyseus/CinnamonTools/commit/199ad08)
- **Author:** Odyseus

```
mail_system.py

- Removed unnecessary parameters when calling super().

```

***

- **Date:** Thu, 20 Sep 2018 16:08:04 -0300
- **Commit:** [3f916e0](https://gitlab.com/Odyseus/CinnamonTools/commit/3f916e0)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated manual page.
- Updated Bash completions file to have unique function names.

```

***

- **Date:** Thu, 20 Sep 2018 16:03:44 -0300
- **Commit:** [061373c](https://gitlab.com/Odyseus/CinnamonTools/commit/061373c)
- **Author:** Odyseus

```
Python modules

- `app_utils.py` module:
    - Changed the way the man page is built to be more simple.
    - Changed the name of the application used to create the localization templates.
- `cli.py` module:
    - Cleaned up some docstrings.
    - Organized the docopt docstring to be more concise and avoid repeated information.

```

***

- **Date:** Tue, 18 Sep 2018 11:14:29 -0300
- **Commit:** [2becc17](https://gitlab.com/Odyseus/CinnamonTools/commit/2becc17)
- **Author:** Odyseus

```
Merge branch 'master' of gitlab.com:Odyseus/python_utils

```

***

- **Date:** Tue, 18 Sep 2018 10:42:09 -0300
- **Commit:** [3eafddb](https://gitlab.com/Odyseus/CinnamonTools/commit/3eafddb)
- **Author:** Odyseus

```
docopt.py

- Added a basic Markdown parsing for highlighting the help message with bold text.

```

***

- **Date:** Tue, 18 Sep 2018 10:41:37 -0300
- **Commit:** [6249f82](https://gitlab.com/Odyseus/CinnamonTools/commit/6249f82)
- **Author:** Odyseus

```
cmd_utils.py

- Allow not using any output stream in the popen method.
- Changed the name of the working_directory in the exec_command method to cwd.

```

***

- **Date:** Mon, 17 Sep 2018 11:01:50 -0300
- **Commit:** [dd56954](https://gitlab.com/Odyseus/CinnamonTools/commit/dd56954)
- **Author:** Odyseus

```
git_utils.py

- Added do_not_confirm parameter to manage_repo method to avoid halts when executing from a loop.

```

***

- **Date:** Mon, 17 Sep 2018 07:30:35 -0300
- **Commit:** [f26808f](https://gitlab.com/Odyseus/CinnamonTools/commit/f26808f)
- **Author:** Odyseus

```
template_utils.py

- Added user and variables expansions of the selected system executable storage path to the system_executable_generation method.

```

***

- **Date:** Fri, 14 Sep 2018 04:55:20 -0300
- **Commit:** [ee755a5](https://gitlab.com/Odyseus/CinnamonTools/commit/ee755a5)
- **Author:** Odyseus

```
General

- Updated README.
- Created manual page.
- Updated Bash completions file.
- Updated sub-modules.

```

***

- **Date:** Fri, 14 Sep 2018 04:52:46 -0300
- **Commit:** [cb5d98a](https://gitlab.com/Odyseus/CinnamonTools/commit/cb5d98a)
- **Author:** Odyseus

```
Python modules

- `__init__.py` module:
    - Defined __appdescription__ so it can be re-used across all modules.
- `app_utils.py` module:
    - Updated **generate_docs** method to also build a manual page for the Python application. Also moved some variable definitions inside this method so they are defined when they are needed.
- `cli.py` module:
    - Cleaned up some docstrings.
    - Implemented the use of the __appdescription__ variable defined in the `__init__.py` module.
    - Added **manual** sub-command to display the application manual page.
    - Updated **template_utils.system_executable_generation** call to use the new update sub-module code.

```

***

- **Date:** Fri, 14 Sep 2018 04:24:31 -0300
- **Commit:** [3ec23b2](https://gitlab.com/Odyseus/CinnamonTools/commit/3ec23b2)
- **Author:** Odyseus

```
Merge branch 'master' of gitlab.com:Odyseus/python_utils

```

***

- **Date:** Fri, 14 Sep 2018 04:22:10 -0300
- **Commit:** [d279c12](https://gitlab.com/Odyseus/CinnamonTools/commit/d279c12)
- **Author:** Odyseus

```
sphinx_docs_utils.py

- Added generate_man_pages method.

```

***

- **Date:** Thu, 13 Sep 2018 07:03:20 -0300
- **Commit:** [6e66be7](https://gitlab.com/Odyseus/CinnamonTools/commit/6e66be7)
- **Author:** Odyseus

```
Merge branch 'master' of gitlab.com:Odyseus/python_utils

```

***

- **Date:** Thu, 13 Sep 2018 06:57:13 -0300
- **Commit:** [a16a991](https://gitlab.com/Odyseus/CinnamonTools/commit/a16a991)
- **Author:** Odyseus

```
template_utils.py

- Updated system_executable_generation method to be more portable,
- Simplified generate_from_template method.

```

***

- **Date:** Thu, 13 Sep 2018 06:55:45 -0300
- **Commit:** [230804e](https://gitlab.com/Odyseus/CinnamonTools/commit/230804e)
- **Author:** Odyseus

```
sphinx_docs_utils.py

- Updated generate_docs method to be more portable.

```

***

- **Date:** Thu, 13 Sep 2018 06:54:23 -0300
- **Commit:** [31c5a46](https://gitlab.com/Odyseus/CinnamonTools/commit/31c5a46)
- **Author:** Odyseus

```
misc_utils.py

- Added new return format to the get_date_time method.

```

***

- **Date:** Thu, 13 Sep 2018 06:53:43 -0300
- **Commit:** [1d4da2d](https://gitlab.com/Odyseus/CinnamonTools/commit/1d4da2d)
- **Author:** Odyseus

```
file_utils.py

- Added is_real_dir and is_real_file methods.

```

***

- **Date:** Thu, 13 Sep 2018 06:53:05 -0300
- **Commit:** [225f5a2](https://gitlab.com/Odyseus/CinnamonTools/commit/225f5a2)
- **Author:** Odyseus

```
exceptions.py

- Added new exceptions.

```

***

- **Date:** Thu, 13 Sep 2018 06:52:16 -0300
- **Commit:** [9b7f1d5](https://gitlab.com/Odyseus/CinnamonTools/commit/9b7f1d5)
- **Author:** Odyseus

```
New module cmd_utils.py.

```

***

- **Date:** Thu, 13 Sep 2018 06:52:00 -0300
- **Commit:** [818d7dc](https://gitlab.com/Odyseus/CinnamonTools/commit/818d7dc)
- **Author:** Odyseus

```
New module mail_system.py.

```

***

- **Date:** Mon, 10 Sep 2018 19:08:54 -0300
- **Commit:** [b220e04](https://gitlab.com/Odyseus/CinnamonTools/commit/b220e04)
- **Author:** Odyseus

```
General

- Updated sub-modules.

```

***

- **Date:** Sun, 9 Sep 2018 23:15:18 -0300
- **Commit:** [2530f26](https://gitlab.com/Odyseus/CinnamonTools/commit/2530f26)
- **Author:** Odyseus

```
All xlets

- Updated help files due to changes in their source files.

```

***

- **Date:** Sun, 9 Sep 2018 23:14:28 -0300
- **Commit:** [7f32dd9](https://gitlab.com/Odyseus/CinnamonTools/commit/7f32dd9)
- **Author:** Odyseus

```
Python modules

- `localized_help_utils.py` module:
    - Added some missing punctuation marks to the help pages template footer.

```

***

- **Date:** Sun, 9 Sep 2018 23:12:22 -0300
- **Commit:** [8231659](https://gitlab.com/Odyseus/CinnamonTools/commit/8231659)
- **Author:** Odyseus

```
General

- Updated sub-modules.
- Updated Sublime Text project files to make the HELP.html files visible.

```

***

- **Date:** Sun, 9 Sep 2018 19:51:04 -0300
- **Commit:** [44cff5c](https://gitlab.com/Odyseus/CinnamonTools/commit/44cff5c)
- **Author:** Odyseus

```
General

- Updated sub-modules.

```

***

- **Date:** Sun, 9 Sep 2018 04:58:03 -0300
- **Commit:** [dcc0f28](https://gitlab.com/Odyseus/CinnamonTools/commit/dcc0f28)
- **Author:** Odyseus

```
General

- Updated sub-modules.

```

***

- **Date:** Sun, 9 Sep 2018 04:57:45 -0300
- **Commit:** [fd8dd52](https://gitlab.com/Odyseus/CinnamonTools/commit/fd8dd52)
- **Author:** Odyseus

```
Python modules

- `cli.py` module:
    - Corrected relative import.

```

***

- **Date:** Sun, 9 Sep 2018 02:48:33 -0300
- **Commit:** [5c927a6](https://gitlab.com/Odyseus/CinnamonTools/commit/5c927a6)
- **Author:** Odyseus

```
General

- Implemented the documentation repository as a sub-module. I was reluctant to do this because it forces me to push the changes made to the sub-module. But it turned out to be not as complex as I thought it would be.
- Updated .gitignore.

```

***

- **Date:** Sat, 8 Sep 2018 23:33:37 -0300
- **Commit:** [d73edfb](https://gitlab.com/Odyseus/CinnamonTools/commit/d73edfb)
- **Author:** Odyseus

```
All xlets

- Updated localization templates.
- Updated help files.

```

***

- **Date:** Sat, 8 Sep 2018 23:32:10 -0300
- **Commit:** [a7bf7bf](https://gitlab.com/Odyseus/CinnamonTools/commit/a7bf7bf)
- **Author:** Odyseus

```
General

- Updated README to use the new documentation location.

```

***

- **Date:** Sat, 8 Sep 2018 23:23:04 -0300
- **Commit:** [4c0a0d9](https://gitlab.com/Odyseus/CinnamonTools/commit/4c0a0d9)
- **Author:** Odyseus

```
Python modules

- `app_utils.py` module:
    - Updated README generation to use the new documentation location.
- `localized_help_utils.py` module:
    - Corrected wrong call to outsourced method.

```

***

- **Date:** Sat, 8 Sep 2018 22:54:41 -0300
- **Commit:** [0b76669](https://gitlab.com/Odyseus/CinnamonTools/commit/0b76669)
- **Author:** Odyseus

```
Python modules

- `app_utils.py` module:
    - Corrected path to docs sources.

```

***

- **Date:** Sat, 8 Sep 2018 22:49:00 -0300
- **Commit:** [1af2460](https://gitlab.com/Odyseus/CinnamonTools/commit/1af2460)
- **Author:** Odyseus

```
General

- Updated .gitignore.

```

***

- **Date:** Sat, 8 Sep 2018 22:48:47 -0300
- **Commit:** [a67088d](https://gitlab.com/Odyseus/CinnamonTools/commit/a67088d)
- **Author:** Odyseus

```
Python modules

- `app_utils.py` module:
    - Moved the location of the **domain_name** and **theme_name** files into the repository's **tmp** folder to avoid clutter at the root of the repository.

```

***

- **Date:** Sat, 8 Sep 2018 22:45:46 -0300
- **Commit:** [fa92003](https://gitlab.com/Odyseus/CinnamonTools/commit/fa92003)
- **Author:** Odyseus

```
General

- Documentation removal. Moved the documentation into its own repository to avoid exponential growth of repository history and data.
- Removed sub-modules that were used by the documentation.
- Removed .gitlab-ci.yml file that was used to host the documentation.

```

***

- **Date:** Sat, 8 Sep 2018 21:44:10 -0300
- **Commit:** [84e99a0](https://gitlab.com/Odyseus/CinnamonTools/commit/84e99a0)
- **Author:** Odyseus

```
Python modules

- `app_utils.py` module:
    - Changed the `get_xlets_dirs` function to ignore xlets whose folder name start with 0z. These xlets aren't functional.
    - Corrected a typo.

```

***

- **Date:** Sat, 8 Sep 2018 03:37:38 -0300
- **Commit:** [2804167](https://gitlab.com/Odyseus/CinnamonTools/commit/2804167)
- **Author:** Odyseus

```
Documentation

- Documentation rebuilt.

```

***

- **Date:** Sat, 8 Sep 2018 03:08:27 -0300
- **Commit:** [8171770](https://gitlab.com/Odyseus/CinnamonTools/commit/8171770)
- **Author:** Odyseus

```
Python modules

- `cli.py` module:
    - Added new CLI commands to perform repository's complex tasks and updated Bash completions file.
- `app_utils.py` module:
    - Blacklisted some of the newly added python_utils modules.

```

***

- **Date:** Sat, 8 Sep 2018 02:46:45 -0300
- **Commit:** [260255f](https://gitlab.com/Odyseus/CinnamonTools/commit/260255f)
- **Author:** Odyseus

```
Merge branch 'master' of gitlab.com:Odyseus/python_utils

```

***

- **Date:** Sat, 8 Sep 2018 02:44:44 -0300
- **Commit:** [8f2ca5e](https://gitlab.com/Odyseus/CinnamonTools/commit/8f2ca5e)
- **Author:** Odyseus

```
Added new modules.

```

***

- **Date:** Fri, 7 Sep 2018 02:51:53 -0300
- **Commit:** [c184f8f](https://gitlab.com/Odyseus/CinnamonTools/commit/c184f8f)
- **Author:** Odyseus

```
Documentation

- Documentation rebuilt.

```

***

- **Date:** Fri, 7 Sep 2018 02:47:37 -0300
- **Commit:** [ac1bfa3](https://gitlab.com/Odyseus/CinnamonTools/commit/ac1bfa3)
- **Author:** Odyseus

```
Merge branch 'master' of gitlab.com:Odyseus/python_utils

```

***

- **Date:** Fri, 7 Sep 2018 02:47:14 -0300
- **Commit:** [dd4434f](https://gitlab.com/Odyseus/CinnamonTools/commit/dd4434f)
- **Author:** Odyseus

```
Documentation

- Documentation rebuilt.

```

***

- **Date:** Fri, 7 Sep 2018 02:46:42 -0300
- **Commit:** [a5252da](https://gitlab.com/Odyseus/CinnamonTools/commit/a5252da)
- **Author:** Odyseus

```
Python modules

- Moved all common Python utilities into their own repository and included that repository as a sub-module using the sub-tree merge strategy.

```

***

- **Date:** Fri, 7 Sep 2018 02:44:21 -0300
- **Commit:** [33a944c](https://gitlab.com/Odyseus/CinnamonTools/commit/33a944c)
- **Author:** Odyseus

```
General

- Updated .gitignore.
- Updated sub-modules.
- Updated `app.py` to print full CLI help when executed without arguments.

```

***

- **Date:** Fri, 7 Sep 2018 02:41:51 -0300
- **Commit:** [cdf6f42](https://gitlab.com/Odyseus/CinnamonTools/commit/cdf6f42)
- **Author:** Odyseus

```
Merge remote-tracking branch 'python_utils/master'

```

***

- **Date:** Fri, 7 Sep 2018 02:31:00 -0300
- **Commit:** [d969756](https://gitlab.com/Odyseus/CinnamonTools/commit/d969756)
- **Author:** Odyseus

```
Added licenses.

```

***

- **Date:** Thu, 6 Sep 2018 23:40:28 -0300
- **Commit:** [79b4030](https://gitlab.com/Odyseus/CinnamonTools/commit/79b4030)
- **Author:** Odyseus

```
Initial commit.

```

***

- **Date:** Tue, 4 Sep 2018 20:23:24 -0300
- **Commit:** [a5f9c61](https://gitlab.com/Odyseus/CinnamonTools/commit/a5f9c61)
- **Author:** Odyseus

```
Documentation

- Documentation rebuilt.

```

***

- **Date:** Tue, 4 Sep 2018 20:22:23 -0300
- **Commit:** [fc2bac3](https://gitlab.com/Odyseus/CinnamonTools/commit/fc2bac3)
- **Author:** Odyseus

```
All xlets

- Updated help files due to changes in the building process.

```

***

- **Date:** Tue, 4 Sep 2018 20:21:35 -0300
- **Commit:** [255c550](https://gitlab.com/Odyseus/CinnamonTools/commit/255c550)
- **Author:** Odyseus

```
Python modules

- Updated some docstrings.
- `localized_help_utils.py` and `localized_help_creator.py` modules:
    - Adapted the handling the HTML assets due to the implementation of newly added sub-modules.
- `cli.py` module:
    - Moved the ellipsis used in the docopt docstring from being declared next to a group of argument options into the individual argument options. This is to avoid slow docopt arguments parsing.
    - Clarified some descriptions in the docopt docstring.

```

***

- **Date:** Tue, 4 Sep 2018 20:14:27 -0300
- **Commit:** [2814cf6](https://gitlab.com/Odyseus/CinnamonTools/commit/2814cf6)
- **Author:** Odyseus

```
General

- Added Bootstrap theme sub-module. It's part of the HTML assets used by the help pages generation process.
- Removed HTML assets that aren't used anymore.
- Updated Sublime Text project files to blacklist newlly added sub-modules.
- Removed unused module import from helper.py script.

```

***

- **Date:** Tue, 4 Sep 2018 19:30:36 -0300
- **Commit:** [b4c34f4](https://gitlab.com/Odyseus/CinnamonTools/commit/b4c34f4)
- **Author:** Odyseus

```
Genera

- Updated sub-modules.

```

***

- **Date:** Tue, 4 Sep 2018 19:28:54 -0300
- **Commit:** [2f4fd5c](https://gitlab.com/Odyseus/CinnamonTools/commit/2f4fd5c)
- **Author:** Odyseus

```
Genera

- Updated sub-modules.

```

***

- **Date:** Mon, 3 Sep 2018 19:53:12 -0300
- **Commit:** [c5b82f7](https://gitlab.com/Odyseus/CinnamonTools/commit/c5b82f7)
- **Author:** Odyseus

```
Documentation

- Documentation rebuilt.

```

***

- **Date:** Mon, 3 Sep 2018 19:52:59 -0300
- **Commit:** [075410d](https://gitlab.com/Odyseus/CinnamonTools/commit/075410d)
- **Author:** Odyseus

```
General

- Updated sphinx_extensions sub-module.
- Implemented a new sphinx extension to specifically handle docopt docstrings inside the documentation.

```

***

- **Date:** Mon, 3 Sep 2018 13:36:15 -0300
- **Commit:** [fbe9356](https://gitlab.com/Odyseus/CinnamonTools/commit/fbe9356)
- **Author:** Odyseus

```
General

- Updated sub-modules.

```

***

- **Date:** Mon, 3 Sep 2018 03:28:18 -0300
- **Commit:** [718f7dd](https://gitlab.com/Odyseus/CinnamonTools/commit/718f7dd)
- **Author:** Odyseus

```
Documentation

- Documentation rebuilt.

```

***

- **Date:** Mon, 3 Sep 2018 03:27:49 -0300
- **Commit:** [c586f0b](https://gitlab.com/Odyseus/CinnamonTools/commit/c586f0b)
- **Author:** Odyseus

```
Python modules

- `localized_help_utils.py` module:
    - Reverted back to saving the generated HELP.html files for on-line hosting into the **docs_sources** folder instead of the **docs** folder. It forced me to re-create all help files every time that I re-built the documentation. And I kept forgetting to do it resulting in broken links on the repository README.

```

***

- **Date:** Mon, 3 Sep 2018 01:21:05 -0300
- **Commit:** [c4df481](https://gitlab.com/Odyseus/CinnamonTools/commit/c4df481)
- **Author:** Odyseus

```
General

- Updated sub-modules.

```

***

- **Date:** Mon, 3 Sep 2018 01:08:58 -0300
- **Commit:** [311f873](https://gitlab.com/Odyseus/CinnamonTools/commit/311f873)
- **Author:** Odyseus

```
Documentation

- Documentation rebuilt.

```

***

- **Date:** Mon, 3 Sep 2018 01:08:22 -0300
- **Commit:** [ac665a3](https://gitlab.com/Odyseus/CinnamonTools/commit/ac665a3)
- **Author:** Odyseus

```
Themes

- Eradicated the usage of SASS (the Ruby gem) in favor of using the new standalone SASS application. FINALLY some freaking sense!!!
- Rebuilt Cinnamon themes from their SASS sources.

```

***

- **Date:** Mon, 3 Sep 2018 01:02:09 -0300
- **Commit:** [dc7f72c](https://gitlab.com/Odyseus/CinnamonTools/commit/dc7f72c)
- **Author:** Odyseus

```
Python modules

- `app_utils.py` and `cli.py` modules:
    - Added the CLI option --force-clean-build to force the clearing of the doctree cache and the destination folder when building the documentation.
    - Added the CLI option --update-inventories to update inventory files from their on-line resources when building the documentation.
- Added new Python modules (`tqdm` and `tqdm_wget.py`) to facilitate the download of files from on-line sources.
- Updated bash completions template to include the newly added CLI options.

```

***

- **Date:** Mon, 3 Sep 2018 00:53:39 -0300
- **Commit:** [aec7fd5](https://gitlab.com/Odyseus/CinnamonTools/commit/aec7fd5)
- **Author:** Odyseus

```
General

- Removed Sphinx extensions and re-implemented them as a git sub-module.
- Re-organized/improved the documentation to be more concise and straight to the point.
- Avoid git ignoring the empty \_static folder inside the documentation sources folder.
- Updated some docstrings from the BaseXlet's utils.js file. The intent was to include this file for docstrings extraction, but since there is no decent JavaScript docstrings processor in existence, I didn't bother to finish.

```

***

- **Date:** Sat, 1 Sep 2018 12:58:18 -0300
- **Commit:** [5058ba6](https://gitlab.com/Odyseus/CinnamonTools/commit/5058ba6)
- **Author:** Odyseus

```
General

- Updated repository README.md.

```

***

- **Date:** Sat, 1 Sep 2018 12:57:50 -0300
- **Commit:** [5ebdb3f](https://gitlab.com/Odyseus/CinnamonTools/commit/5ebdb3f)
- **Author:** Odyseus

```
All xlets

- Updated localization templates.
- Updated help files.
- Updated change logs.

```

***

- **Date:** Sat, 1 Sep 2018 12:56:36 -0300
- **Commit:** [f3a39a3](https://gitlab.com/Odyseus/CinnamonTools/commit/f3a39a3)
- **Author:** Odyseus

```
General

- Updated .gitignore.
- Cleaned tracked files that are now ignored.
- Added files that aren't ignored anymore.

```

***

- **Date:** Fri, 31 Aug 2018 22:13:16 -0300
- **Commit:** [bb593d0](https://gitlab.com/Odyseus/CinnamonTools/commit/bb593d0)
- **Author:** Odyseus

```
Documentation

- Switched to a modified version of sphinx-rtd-theme.
- Documentation rebuilt.

```

***

- **Date:** Fri, 31 Aug 2018 20:30:35 -0300
- **Commit:** [1b42a59](https://gitlab.com/Odyseus/CinnamonTools/commit/1b42a59)
- **Author:** Odyseus

```
General

- Updated the repository README.md file to be a little less verbose.
- Removed Sphinx theme and re-implemented it as a git sub-module.
- Dynamically set current copyright year on documentation conf.py.
- Renamed some unnecessarily long .rst files from the documentation.

```

***

- **Date:** Thu, 30 Aug 2018 19:13:59 -0300
- **Commit:** [4bfb7e1](https://gitlab.com/Odyseus/CinnamonTools/commit/4bfb7e1)
- **Author:** Odyseus

```
Documentation

- Switched to a modified version of sphinx-rtd-theme.
- Documentation rebuilt.

```

***

- **Date:** Thu, 30 Aug 2018 13:19:39 -0300
- **Commit:** [d233ca8](https://gitlab.com/Odyseus/CinnamonTools/commit/d233ca8)
- **Author:** Odyseus

```
Documentation

- Documentation rebuilt.

```

***

- **Date:** Thu, 30 Aug 2018 13:18:32 -0300
- **Commit:** [efd4e13](https://gitlab.com/Odyseus/CinnamonTools/commit/efd4e13)
- **Author:** Odyseus

```
All xlets

- Updated localization templates.
- Updated help files.

```

***

- **Date:** Thu, 30 Aug 2018 13:16:53 -0300
- **Commit:** [33f6c00](https://gitlab.com/Odyseus/CinnamonTools/commit/33f6c00)
- **Author:** Odyseus

```
General

- Updated the repository README.md file.
- Re-formatted some CSS files used by the help pages and the documentation.
- Updated helper.py script.

```

***

- **Date:** Thu, 30 Aug 2018 09:02:03 -0300
- **Commit:** [c2a782e](https://gitlab.com/Odyseus/CinnamonTools/commit/c2a782e)
- **Author:** Odyseus

```
Python modules

- Cleaned up docstrings.
- Cleaned up unused/unnecessary methods.
- `app_menu.py` module:
    - The CLI menu can now perform all the tasks that the Python app is able to.

```

***

- **Date:** Wed, 29 Aug 2018 14:26:31 -0300
- **Commit:** [4ac1d1b](https://gitlab.com/Odyseus/CinnamonTools/commit/4ac1d1b)
- **Author:** Odyseus

```
Documentation

- Documentation rebuilt.

```

***

- **Date:** Wed, 29 Aug 2018 13:12:13 -0300
- **Commit:** [9f8cb8e](https://gitlab.com/Odyseus/CinnamonTools/commit/9f8cb8e)
- **Author:** Odyseus

```
General

- Re-generated the repository README.md file with correct links to help pages.

```

***

- **Date:** Wed, 29 Aug 2018 13:11:42 -0300
- **Commit:** [16e8101](https://gitlab.com/Odyseus/CinnamonTools/commit/16e8101)
- **Author:** Odyseus

```
Documentation

- Added missing help pages inside the **\_static** folder.

```

***

- **Date:** Wed, 29 Aug 2018 13:09:21 -0300
- **Commit:** [4e96b88](https://gitlab.com/Odyseus/CinnamonTools/commit/4e96b88)
- **Author:** Odyseus

```
Python modules

- `app_utils.py` module:
    - Corrected URL for README.md file xlet help pages list items.

```

***

- **Date:** Wed, 29 Aug 2018 12:58:53 -0300
- **Commit:** [47bf75e](https://gitlab.com/Odyseus/CinnamonTools/commit/47bf75e)
- **Author:** Odyseus

```
Documentation

- Removed xlet help pages index from the documentation since the list of help pages is now part of the repository README.md file.
- Removed all help pages from the **\_static** folder since they are now copied directly into the **docs** folder._
- Cleaned up/improved **Usage** section.
- Cleaned up/improved **Development notes** section.
- Documentation rebuilt.

```

***

- **Date:** Wed, 29 Aug 2018 12:52:55 -0300
- **Commit:** [401c006](https://gitlab.com/Odyseus/CinnamonTools/commit/401c006)
- **Author:** Odyseus

```
General

- Added template to generate the repository README.md file.
- Generated the repository README.md file.

```

***

- **Date:** Wed, 29 Aug 2018 12:50:31 -0300
- **Commit:** [e8531bf](https://gitlab.com/Odyseus/CinnamonTools/commit/e8531bf)
- **Author:** Odyseus

```
All xlets

- Updated localization templates.
- Updated Spanish localizations.
- Updated change logs.
- Updated help files.

```

***

- **Date:** Wed, 29 Aug 2018 12:45:38 -0300
- **Commit:** [ad39413](https://gitlab.com/Odyseus/CinnamonTools/commit/ad39413)
- **Author:** Odyseus

```
All xlets

- Removed all hard-coded repository URLs in favor of using a placeholder that will be replaced by the actual URL on xlet build time.
- Cleaned up and modified some of the `z_create_localized_help.py` scripts to use newly created HTML templates from the `localized_help_utils.py` module.

```

***

- **Date:** Wed, 29 Aug 2018 12:34:06 -0300
- **Commit:** [5ead8b6](https://gitlab.com/Odyseus/CinnamonTools/commit/5ead8b6)
- **Author:** Odyseus

```
HTML assets for help pages

- Switched from Bootstrap 3 to Bootstrap 4.
- Cleaned up unused styles.
- Added minified versions of assets.

```

***

- **Date:** Wed, 29 Aug 2018 12:30:16 -0300
- **Commit:** [2dc7dbd](https://gitlab.com/Odyseus/CinnamonTools/commit/2dc7dbd)
- **Author:** Odyseus

```
Python modules

- `app_utils.py` module:
    - More detailed description of the bash completion creation process.
    - Repository and repository pages URLs stored in a variable to make future repository changes easier.
    - Removed the index of xlets help pages from the documentation in favor of adding it to the repository README.md file.
    - Re-implemented CHANGELOG.md files creation since they don't need to be sanitized anymore.
    - Implemented generation of the repository README.md file from a template. This file is generated when the `create_localized_help` command is executed.
    - Added prompt for choosing the location of the executable generated by the `system_executable_generation` function instead of hard-coding it to $HOME/.local/bin.
- `changelog_handler.py` module:
    - Cleaned up to reflect changes to the `app_utils.py` module.
- `localized_help_utils.py` module:
    - Changed all HTML templates from using Bootstrap 3 to use Bootstrap 4.
    - Added more complex HTML templates.
    - Modified the `save_file` function to copy the generated HELP.html files directly into the **docs** folder to avoid having duplicated files. It now also copies the icon.png files so the on-line hostes hELP.html pages can display their favicons.
- `localized_help_creator.py` module:
    - Cleaned up to reflect changes to the `localized_help_utils.py` module.
    - Minimized the display of false percentages in the language selection menu on the HELP.html pages. The untranslated percentage will now be displayed only if the the percentage of untranslated strings is lower than 95%.
- `mistune.py` module:
    - Added Bootstrap 4 classes to the `table` tag template.

```

***

- **Date:** Thu, 23 Aug 2018 03:08:30 -0300
- **Commit:** [4ab065a](https://gitlab.com/Odyseus/CinnamonTools/commit/4ab065a)
- **Author:** Odyseus

```
Documentation

- Documentation rebuilt.

```

***

- **Date:** Thu, 23 Aug 2018 03:06:40 -0300
- **Commit:** [4026075](https://gitlab.com/Odyseus/CinnamonTools/commit/4026075)
- **Author:** Odyseus

```
General

- Changed the .gitlab-ci.yml file to trigger the build of pages when the title of a commit is "Documentation".

```

***

- **Date:** Thu, 23 Aug 2018 02:57:13 -0300
- **Commit:** [9cff425](https://gitlab.com/Odyseus/CinnamonTools/commit/9cff425)
- **Author:** Odyseus

```
All xlets

- Cleaned up all help page creator scripts.
    - Removed all on-line hosted images in favor of in-line Base64 encoded images.
    - Removed all conditions that formerly were used to generate a README.md file.
- Updated localization templates.
- Updated Spanish localizations.
- Updated help files.

```

***

- **Date:** Thu, 23 Aug 2018 02:48:06 -0300
- **Commit:** [781d840](https://gitlab.com/Odyseus/CinnamonTools/commit/781d840)
- **Author:** Odyseus

```
BaseXlet

- Set the **Cancel** button in the `ConfirmationDialog` prototype as focused by default.

```

***

- **Date:** Thu, 23 Aug 2018 02:46:50 -0300
- **Commit:** [9c831e6](https://gitlab.com/Odyseus/CinnamonTools/commit/9c831e6)
- **Author:** Odyseus

```
0ExtensionsManager

- Implemented a more transparent way of calling `Gio.File.load_contents_finish`.
- Set the **Cancel** button in the `ConfirmationDialog` prototype as focused by default.

```

***

- **Date:** Thu, 23 Aug 2018 02:45:25 -0300
- **Commit:** [9a40db2](https://gitlab.com/Odyseus/CinnamonTools/commit/9a40db2)
- **Author:** Odyseus

```
0PopupTranslator

- Implemented a more transparent way of calling `Gio.File.load_contents_finish`.
- Changed the styling of the buttons inside the main menu to actually look like button.

```

***

- **Date:** Thu, 23 Aug 2018 02:36:01 -0300
- **Commit:** [cd4f58f](https://gitlab.com/Odyseus/CinnamonTools/commit/cd4f58f)
- **Author:** Odyseus

```
General

- GitHub eradication. New home is GitLab.
- Updated documentation's development notes.
- Re-implemented CHANGELOG.md creation and created all change logs
- Corrected the execution order of change logs creation on the CLI application.

```

***

- **Date:** Tue, 7 Aug 2018 03:53:34 -0300
- **Commit:** [4782063](https://gitlab.com/Odyseus/CinnamonTools/commit/4782063)
- **Author:** Odyseus

```
Documentation

- Documentation rebuilt.

```

***

- **Date:** Tue, 7 Aug 2018 03:50:14 -0300
- **Commit:** [5d2d76a](https://gitlab.com/Odyseus/CinnamonTools/commit/5d2d76a)
- **Author:** Odyseus

```
All xlets

- Updated localization templates.
- Updated Spanish localizations.
- Updated help files.

```

***

- **Date:** Tue, 7 Aug 2018 03:26:29 -0300
- **Commit:** [49add35](https://gitlab.com/Odyseus/CinnamonTools/commit/49add35)
- **Author:** Odyseus

```
Main Python application

- Added to the helper.py script the ability to clean up an xlet gsettings leftovers. Since I couldn't find a clear way of clearing the leftover gsettings keys of an xlet programmatically, I had to resort to the use of an external command (`dconf`).

```

***

- **Date:** Tue, 7 Aug 2018 03:18:33 -0300
- **Commit:** [5577120](https://gitlab.com/Odyseus/CinnamonTools/commit/5577120)
- **Author:** Odyseus

```
BaseXlet

- Cleaned leftovers from previous cleanup.

```

***

- **Date:** Tue, 7 Aug 2018 03:13:51 -0300
- **Commit:** [5c10856](https://gitlab.com/Odyseus/CinnamonTools/commit/5c10856)
- **Author:** Odyseus

```
0CinnamonMaximusForkByOdyseus

- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

```

***

- **Date:** Tue, 7 Aug 2018 03:12:39 -0300
- **Commit:** [780aaf6](https://gitlab.com/Odyseus/CinnamonTools/commit/780aaf6)
- **Author:** Odyseus

```
0WallpaperChangerApplet

- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.
- Cleaned leftovers from previous cleanup.

```

***

- **Date:** Tue, 7 Aug 2018 03:09:39 -0300
- **Commit:** [e2d20e3](https://gitlab.com/Odyseus/CinnamonTools/commit/e2d20e3)
- **Author:** Odyseus

```
0PopupTranslator

- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

```

***

- **Date:** Tue, 7 Aug 2018 03:07:07 -0300
- **Commit:** [e093145](https://gitlab.com/Odyseus/CinnamonTools/commit/e093145)
- **Author:** Odyseus

```
0ExtensionsManager

- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

```

***

- **Date:** Sat, 4 Aug 2018 05:17:38 -0300
- **Commit:** [1c1aa7b](https://gitlab.com/Odyseus/CinnamonTools/commit/1c1aa7b)
- **Author:** Odyseus

```
General

- Updated .jshintrc and .gitignore files.

```

***

- **Date:** Sat, 4 Aug 2018 05:15:28 -0300
- **Commit:** [8c2b1c7](https://gitlab.com/Odyseus/CinnamonTools/commit/8c2b1c7)
- **Author:** Odyseus

```
0ExtensionsManager

- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.
- Simplification of the procedure to set the applet icon.
- Removed support for Cinnamon versions older than 3.0.x.

```

***

- **Date:** Sat, 4 Aug 2018 05:14:39 -0300
- **Commit:** [e680392](https://gitlab.com/Odyseus/CinnamonTools/commit/e680392)
- **Author:** Odyseus

```
0PopupTranslator

- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.
- Simplification of the procedure to set the applet icon.
- Removed support for Cinnamon versions older than 3.0.x.

```

***

- **Date:** Sat, 4 Aug 2018 05:13:53 -0300
- **Commit:** [931fd03](https://gitlab.com/Odyseus/CinnamonTools/commit/931fd03)
- **Author:** Odyseus

```
0WallpaperChangerApplet

- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.
- Simplification of the procedure to set the applet icon.

```

***

- **Date:** Sat, 4 Aug 2018 05:13:09 -0300
- **Commit:** [0be81cb](https://gitlab.com/Odyseus/CinnamonTools/commit/0be81cb)
- **Author:** Odyseus

```
0CinnamonMaximusForkByOdyseus

- Removed support for Cinnamon versions older than 3.0.x.

```

***

- **Date:** Sat, 4 Aug 2018 05:11:56 -0300
- **Commit:** [a01e724](https://gitlab.com/Odyseus/CinnamonTools/commit/a01e724)
- **Author:** Odyseus

```
0WindowDemandsAttentionBehavior

- Eradication of **Lang** module usage in favor of arrow/standard functions. Also removed Cjs JS class notation in favor of prototypes. First step towards moving all JavaScript code to ES6.
- Removed support for Cinnamon versions older than 3.0.x.

```

***

- **Date:** Sat, 4 Aug 2018 05:11:32 -0300
- **Commit:** [c08ffc8](https://gitlab.com/Odyseus/CinnamonTools/commit/c08ffc8)
- **Author:** Odyseus

```
BaseXlet

- Eradication of **Lang** module usage in favor of arrow/standard functions. Also removed Cjs JS class notation in favor of prototypes. First step towards moving all JavaScript code to ES6.
- Removed support for Cinnamon versions older than 3.0.x.

```

***

- **Date:** Tue, 24 Jul 2018 09:37:15 -0300
- **Commit:** [19e3a4c](https://gitlab.com/Odyseus/CinnamonTools/commit/19e3a4c)
- **Author:** Odyseus

```
Themes

- Gtk3.22: Upstream fix. Fix a couple of issues with slick-greeter.
- Gtk3.22: Upstream fix. Restore the 18.3 styling of mate-panel taskbar.
- Gtk3.22: Upstream fix. Remove a white border from the nemo sidebar.
- Added some missing assets for Mate panel theming.
- Added some fixes from upstream to the Metacity theme that were overlooked.

```

***

- **Date:** Mon, 23 Jul 2018 16:14:22 -0300
- **Commit:** [8db2696](https://gitlab.com/Odyseus/CinnamonTools/commit/8db2696)
- **Author:** Odyseus

```
Documentation

- Documentation rebuilt.

```

***

- **Date:** Mon, 23 Jul 2018 16:14:03 -0300
- **Commit:** [3f5fe0d](https://gitlab.com/Odyseus/CinnamonTools/commit/3f5fe0d)
- **Author:** Odyseus

```
All xlets

- Updated localization templates.
- Updated Spanish localizations.
- Updated help files.

```

***

- **Date:** Mon, 23 Jul 2018 15:54:43 -0300
- **Commit:** [18d4dd0](https://gitlab.com/Odyseus/CinnamonTools/commit/18d4dd0)
- **Author:** Odyseus

```
General

- Updated .gitignore.

```

***

- **Date:** Fri, 20 Jul 2018 07:07:04 -0300
- **Commit:** [169473f](https://gitlab.com/Odyseus/CinnamonTools/commit/169473f)
- **Author:** Odyseus

```
General

- Update README.

```

***

- **Date:** Wed, 18 Jul 2018 08:11:20 -0300
- **Commit:** [5565439](https://gitlab.com/Odyseus/CinnamonTools/commit/5565439)
- **Author:** Odyseus

```
General

Added issue templates for GitHub and GitLab.

```

***

- **Date:** Wed, 18 Jul 2018 08:09:41 -0300
- **Commit:** [ee53956](https://gitlab.com/Odyseus/CinnamonTools/commit/ee53956)
- **Author:** Odyseus

```
0WallpaperChangerApplet

- Finally fixed issues when handling gsettings (probably ¬¬).

```

***

- **Date:** Wed, 18 Jul 2018 00:41:38 -0300
- **Commit:** [cbfb4fd](https://gitlab.com/Odyseus/CinnamonTools/commit/cbfb4fd)
- **Author:** Odyseus

```
Themes

- Added options to choose on build time the font family/size used by the Cinnamon theme.

```

***

- **Date:** Wed, 13 Jun 2018 01:04:20 -0300
- **Commit:** [4295411](https://gitlab.com/Odyseus/CinnamonTools/commit/4295411)
- **Author:** Odyseus

```
0PopupTranslator

- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

```

***

- **Date:** Wed, 13 Jun 2018 01:01:03 -0300
- **Commit:** [d3e1ad8](https://gitlab.com/Odyseus/CinnamonTools/commit/d3e1ad8)
- **Author:** Odyseus

```
0ExtensionsManager

- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

```

***

- **Date:** Tue, 12 Jun 2018 00:30:00 -0300
- **Commit:** [1be3fb3](https://gitlab.com/Odyseus/CinnamonTools/commit/1be3fb3)
- **Author:** Odyseus

```
Documentation

- Documentation rebuilt.

```

***

- **Date:** Tue, 12 Jun 2018 00:29:45 -0300
- **Commit:** [da472d2](https://gitlab.com/Odyseus/CinnamonTools/commit/da472d2)
- **Author:** Odyseus

```
All xlets

- Updated localization templates.
- Updated Spanish localizations.
- Updated help files.

```

***

- **Date:** Tue, 12 Jun 2018 00:25:15 -0300
- **Commit:** [08bed3a](https://gitlab.com/Odyseus/CinnamonTools/commit/08bed3a)
- **Author:** Odyseus

```
Main Python application

- Renamed the vars.md file inside the base xlet template directory to README.md.
- Re-implemented the localizations.bash script into a Python script. Renamed to helper.py and added functions to install/remove gsettings schemas to mitigate gksu deprecation.
- Changed the xlet builder function into a class.
- Removed the string substitution methods from the BaseXletGenerator class and made them global functions to allow the re-usability of the code by other classes/functions.
- Corrected/Improved some docstrings.

```

***

- **Date:** Tue, 12 Jun 2018 00:16:26 -0300
- **Commit:** [3bcc8ee](https://gitlab.com/Odyseus/CinnamonTools/commit/3bcc8ee)
- **Author:** Odyseus

```
All xlets

- Added/Improved some function's docstrings.

```

***

- **Date:** Tue, 12 Jun 2018 00:13:13 -0300
- **Commit:** [d3625b9](https://gitlab.com/Odyseus/CinnamonTools/commit/d3625b9)
- **Author:** Odyseus

```
0WallpaperChangerApplet

- gksu deprecation mitigation:
    - Removed gsettings schema installation/removal from the settings.py script. To avoid dealing with retarded policies (pkexec), I moved the installation process to a helper file (common to all xlets) that uses the good old sudo.
- Cleaned some comments/commented lines.

```

***

- **Date:** Tue, 12 Jun 2018 00:11:05 -0300
- **Commit:** [be476ba](https://gitlab.com/Odyseus/CinnamonTools/commit/be476ba)
- **Author:** Odyseus

```
Added .gitlab-ci.yml

- Preparing for the move to GitLab.

```

***

- **Date:** Tue, 12 Jun 2018 00:10:34 -0300
- **Commit:** [de4fd74](https://gitlab.com/Odyseus/CinnamonTools/commit/de4fd74)
- **Author:** Odyseus

```
Theme

- Some upstream fixes/improvements:
    - Added theming for Mate OSD window when marco with compositing is enabled.
    - Fixed transparent background in mate-terminal.
    - Metacity: Fixed black border on focused titlebars under hidpi.
    - Gtk 3.22: Fixed the color of some selected labels.
    - Gtk 3.22: Tab alignment fixes.

```

***

- **Date:** Tue, 5 Jun 2018 16:18:26 -0300
- **Commit:** [6ec0f1a](https://gitlab.com/Odyseus/CinnamonTools/commit/6ec0f1a)
- **Author:** Odyseus

```
Documentation

- Documentation rebuilt.

```

***

- **Date:** Tue, 5 Jun 2018 16:17:51 -0300
- **Commit:** [9ef05cf](https://gitlab.com/Odyseus/CinnamonTools/commit/9ef05cf)
- **Author:** Odyseus

```
All xlets

- Updated localization templates, Spanish localizations and help files.

```

***

- **Date:** Tue, 5 Jun 2018 16:12:11 -0300
- **Commit:** [8e20931](https://gitlab.com/Odyseus/CinnamonTools/commit/8e20931)
- **Author:** Odyseus

```
Theme

- More fixes from upstream.
- Added back the removed selectors and instead commented them. Makes it easier to make comparisons with upstream.

```

***

- **Date:** Mon, 14 May 2018 11:27:37 -0300
- **Commit:** [f5eb419](https://gitlab.com/Odyseus/CinnamonTools/commit/f5eb419)
- **Author:** Odyseus

```
Theme

- Gtk3 theme: Fix for Mate panel.

```

***

- **Date:** Wed, 9 May 2018 08:18:33 -0300
- **Commit:** [449233a](https://gitlab.com/Odyseus/CinnamonTools/commit/449233a)
- **Author:** Odyseus

```
All JavaScript files

- General formatting corrections.

```

***

- **Date:** Wed, 9 May 2018 08:17:52 -0300
- **Commit:** [7ccddf1](https://gitlab.com/Odyseus/CinnamonTools/commit/7ccddf1)
- **Author:** Odyseus

```
All xlets

- Uber simplification of the applet settings bindings.

```

***

- **Date:** Wed, 9 May 2018 01:19:59 -0300
- **Commit:** [e18bdd7](https://gitlab.com/Odyseus/CinnamonTools/commit/e18bdd7)
- **Author:** Odyseus

```
Documentation

- Updated and re-built documentation.

```

***

- **Date:** Wed, 9 May 2018 01:18:09 -0300
- **Commit:** [2317a73](https://gitlab.com/Odyseus/CinnamonTools/commit/2317a73)
- **Author:** Odyseus

```
All xlets

- Updated POT files, Spanish localizations and help pages.

```

***

- **Date:** Wed, 9 May 2018 01:16:58 -0300
- **Commit:** [a5a0cba](https://gitlab.com/Odyseus/CinnamonTools/commit/a5a0cba)
- **Author:** Odyseus

```
Development application

- Moved the files CHANGELOG-OLD.md and CONTRIBUTORS.md into the xlet's __data__ folder so they are not included when an xlet is built.

```

***

- **Date:** Tue, 8 May 2018 05:37:55 -0300
- **Commit:** [d0ed517](https://gitlab.com/Odyseus/CinnamonTools/commit/d0ed517)
- **Author:** Odyseus

```
All xlets

- Updated POT files and Spanish localizations.
- Renamed all JavaScript files inside __data__ folders bask to .js since now the update POT files function ignores that folder.

```

***

- **Date:** Tue, 8 May 2018 04:57:40 -0300
- **Commit:** [49645a9](https://gitlab.com/Odyseus/CinnamonTools/commit/49645a9)
- **Author:** Odyseus

```
Development application

- Added .sass-cache folder to .gitignore.
- Added missing argument to bash completions file.
- Added --ignored-pattern to the function that generates the xlets POT files.

```

***

- **Date:** Tue, 8 May 2018 04:55:37 -0300
- **Commit:** [2a2b933](https://gitlab.com/Odyseus/CinnamonTools/commit/2a2b933)
- **Author:** Odyseus

```
Themes

- More clean up.

```

***

- **Date:** Tue, 8 May 2018 04:51:45 -0300
- **Commit:** [20066e8](https://gitlab.com/Odyseus/CinnamonTools/commit/20066e8)
- **Author:** Odyseus

```
Themes

- Switched to a size in pixels for the sound applet icons to avoid blurring.

```

***

- **Date:** Tue, 8 May 2018 04:23:27 -0300
- **Commit:** [323374c](https://gitlab.com/Odyseus/CinnamonTools/commit/323374c)
- **Author:** Odyseus

```
Themes

- Clean up.

```

***

- **Date:** Mon, 7 May 2018 04:53:42 -0300
- **Commit:** [7f167a2](https://gitlab.com/Odyseus/CinnamonTools/commit/7f167a2)
- **Author:** Odyseus

```
0PopupTranslator

- Implemented key bindings common naming.

```

***

- **Date:** Mon, 7 May 2018 04:52:28 -0300
- **Commit:** [130cad8](https://gitlab.com/Odyseus/CinnamonTools/commit/130cad8)
- **Author:** Odyseus

```
0WallpaperChangerApplet

- Revamped/simplified settings system.

```

***

- **Date:** Sun, 6 May 2018 03:49:19 -0300
- **Commit:** [51cd53d](https://gitlab.com/Odyseus/CinnamonTools/commit/51cd53d)
- **Author:** Odyseus

```
All xlets

- Changed from a specific nomenclature for defining xlets metadata to a generic nomenclature.

```

***

- **Date:** Fri, 4 May 2018 21:43:51 -0300
- **Commit:** [1b6b1d5](https://gitlab.com/Odyseus/CinnamonTools/commit/1b6b1d5)
- **Author:** Odyseus

```
Documentation

- Updated and re-built documentation.

```

***

- **Date:** Fri, 4 May 2018 21:42:22 -0300
- **Commit:** [7a537fe](https://gitlab.com/Odyseus/CinnamonTools/commit/7a537fe)
- **Author:** Odyseus

```
All xlets

- Updated all POT files.
- Updated Spanish localizations.
- Updated all HELP.html files.
- Renamed some JavaScript files to avoid them been scanned for translatable strings.

```

***

- **Date:** Fri, 4 May 2018 20:35:40 -0300
- **Commit:** [725eeea](https://gitlab.com/Odyseus/CinnamonTools/commit/725eeea)
- **Author:** Odyseus

```
Development application

- Updated the docstrings of all Python modules.
- Clean up Python modules comments.

```

***

- **Date:** Fri, 4 May 2018 19:12:37 -0300
- **Commit:** [e4d26b6](https://gitlab.com/Odyseus/CinnamonTools/commit/e4d26b6)
- **Author:** Odyseus

```
Development application

- cli.py
    - Use set() (to remove duplicated items) before sorting the list, not after. This fixes the wrong order of execution of certain CLI arguments.
- menu.py
    - Add the space in the prompt definition instead of hard-coding it.
    - Exception handling inside child threads nightmare. Print messages and raise *clear exceptions* instead of raising exceptions with messages.
- app_utils.py
    - Removed unused `remove_file` method.
    - Change **symlink** argument to **False** in the call to `copytree` inside the `handle_xlet` method. I removed all symbolic links from all xlets in favor of creating them on building time.
- localized_help_utils.py
    - Moved the `BASE_CSS` *constant* and added the CSS style sheet directly into the tweaks.css file.
    - Removed the `HTMLTemplates` class in favor of directly using the module's *constants*.
    - Removed some properties in the `HTMLInlineAssets` class in favor of declaring them as variables.
    - Removed unused `get_parent_dir` method.
    - Removed unused `README_POEDITOR_BLOCK` *constant*.
    - Changed the check with `endswith` inside the `save_file` method to directly checking the file name.
- localized_help_creator.py
    - Changed the use of the `HTMLTemplates` class due to its removal from the **localized_help_utils.py** module.
    - Now the help page will be created with all available languages regardless of the percentage of translated strings a language has. An approximate percentage of translated strings will appear in the help page language selection menu next to the language name.
- multi_select.py
    - Changed some properties and arguments names to make the code a little more legible.
- Removed the files **localized_help_creator.py.bt4** and **localized_help_utils.py.bt4**.

```

***

- **Date:** Tue, 1 May 2018 22:17:09 -0300
- **Commit:** [a320955](https://gitlab.com/Odyseus/CinnamonTools/commit/a320955)
- **Author:** Odyseus

```
Development application

Updated the Python modules README.

```

***

- **Date:** Mon, 30 Apr 2018 22:22:11 -0300
- **Commit:** [c376488](https://gitlab.com/Odyseus/CinnamonTools/commit/c376488)
- **Author:** Odyseus

```
Documentation update.

```

***

- **Date:** Mon, 30 Apr 2018 22:12:21 -0300
- **Commit:** [e0bd9c2](https://gitlab.com/Odyseus/CinnamonTools/commit/e0bd9c2)
- **Author:** Odyseus

```
Initial commit.

```

***
