## Multi Translator changelog

**This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools).**

***

**Date:** Fri, 14 Feb 2020 19:08:22 -0300<br/>
**Commit:** [3ec0d4b](https://gitlab.com/Odyseus/CinnamonTools/commit/3ec0d4b)<br/>
**Author:** Odyseus<br/>

- Fixed `_` variable exported from wrong module.

***

**Date:** Wed, 12 Feb 2020 22:46:26 -0300<br/>
**Commit:** [da68bc9](https://gitlab.com/Odyseus/CinnamonTools/commit/da68bc9)<br/>
**Author:** Odyseus<br/>

- Adaptations due to changes to the custom settings framework.

***

**Date:** Mon, 10 Feb 2020 23:01:07 -0300<br/>
**Commit:** [cd4f1d4](https://gitlab.com/Odyseus/CinnamonTools/commit/cd4f1d4)<br/>
**Author:** Odyseus<br/>

- Fixed import of the `_` variable from the wrong module.
- Adaptations due to changes to the custom settings framework.
- Adaptations due to changes to the `debugManager.js` JavaScript module.
- Adapted to use the `copyToClipboard` function found on the `globalUtils.js` module.
- Adaptations due to changes to the custom settings framework.

***

**Date:** Mon, 27 Jan 2020 20:26:43 -0300<br/>
**Commit:** [7104783](https://gitlab.com/Odyseus/CinnamonTools/commit/7104783)<br/>
**Author:** Odyseus<br/>

Countermeasures for using an external settings application
----------------------------------------------------------

- Removed condition used to selectively generate a .desktop file to open the extension's settings window. Now the .desktop file will be created in all Cinnamon version the extension is installed.

***

**Date:** Sun, 22 Dec 2019 04:54:47 -0300<br/>
**Commit:** [3572463](https://gitlab.com/Odyseus/CinnamonTools/commit/3572463)<br/>
**Author:** Odyseus<br/>

- Added some checks to the default Google translation provider to minimize the logging of non-fatal errors.

***

**Date:** Fri, 21 Jun 2019 23:07:33 -0300<br/>
**Commit:** [3d3b373](https://gitlab.com/Odyseus/CinnamonTools/commit/3d3b373)<br/>
**Author:** Odyseus<br/>

- Minor changes to the settings application due to changes in the custom settings framework.

***

**Date:** Wed, 5 Jun 2019 19:55:39 -0300<br/>
**Commit:** [3b74138](https://gitlab.com/Odyseus/CinnamonTools/commit/3b74138)<br/>
**Author:** Odyseus<br/>

- Corrected events return values.
- Minor changes due to changes in global modules.

***

**Date:** Sun, 2 Jun 2019 12:34:36 -0300<br/>
**Commit:** [2148486](https://gitlab.com/Odyseus/CinnamonTools/commit/2148486)<br/>
**Author:** Odyseus<br/>

- Fixed impossibility to open the translation history window due to a typo (again!).

***

**Date:** Thu, 30 May 2019 03:51:27 -0300<br/>
**Commit:** [658436a](https://gitlab.com/Odyseus/CinnamonTools/commit/658436a)<br/>
**Author:** Odyseus<br/>

- Minor changes due to changes in global modules.
- Python scripts:
    - Changed the use of cgi.escape to html.escape due to cgi.escape deprecation.
    - Changed to Gtk.IconSize.BUTTON constant to specify icon sizes.
    - Implemented the use of constants to specify default Gtk CSS classes.

***

**Date:** Fri, 24 May 2019 16:18:46 -0300<br/>
**Commit:** [332eb0f](https://gitlab.com/Odyseus/CinnamonTools/commit/332eb0f)<br/>
**Author:** Odyseus<br/>

- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Improved debugger.
- Removed manual mechanism to generate .desktop files to access the extension settings window. Now the .desktop file generation is automatic and will be created only on Cinnamon versions that requires it.
- Fixed empty list of languages in the language selector dialogs under certain conditions.

***

**Date:** Sun, 19 May 2019 12:34:25 -0300<br/>
**Commit:** [e502dd7](https://gitlab.com/Odyseus/CinnamonTools/commit/e502dd7)<br/>
**Author:** Odyseus<br/>

- Finished mechanism that allows to update existent settings when there is a change on the default translation engines.
- Corrected wrong title in the preferences window and added information label.

***

**Date:** Sat, 18 May 2019 22:22:01 -0300<br/>
**Commit:** [38eed82](https://gitlab.com/Odyseus/CinnamonTools/commit/38eed82)<br/>
**Author:** Odyseus<br/>

- Fixed inability to open the translation history window caused by a typo.
- Made it possible to launch the translation history from terminal with a minimal number or arguments (./translatorHistory.py --gui) for debugging purposes.
- Removed Ctrl + V shortcut from the translation dialog. First, it was causing to paste twice the content of the clipboard (an error on my part). And second, the implementation was such that, when there was selected text in an entry, Ctrl + V would replace the selected text. But if there was no selected text, the content of the clipboard was inserted at the end of the entry content. As it was, it wasn't possible to paste text into cursor position, so I removed the shortcut completely. I left the Ctrl + C custom shortcut because in its current implementation it is useful (if there is a selection in the entry, copy it, else copy all the entry content).
- Made all dependencies on external programs optional instead of mandatory. This makes possible to use the extension without the need to install external programs that one might not need/want to install.
- Switched from using Util.spawn_async() in favor of using a function that allowed me to catch execution errors of possibly non existent programs. This was needed since I made all dependencies optional.
- Changed the default translation engine to Google Translate (the one that doesn't use translate-shell). This was done so the first time that the extension is installed, the extension is functional without the need to install external packages.
- Removed the check for the xdg-open command as a dependency. Cinnamon itself uses the xdg-open command in several places.
- Cleaned up left over files that aren't needed anymore since the extension was rewritten.
- Cleaned up all remnants of the removed Transltr engine.
- Homogenization of imports names.

***

**Date:** Tue, 14 May 2019 14:33:20 -0300<br/>
**Commit:** [eb77bca](https://gitlab.com/Odyseus/CinnamonTools/commit/eb77bca)<br/>
**Author:** Odyseus<br/>

WARNING 1: If a user is already using this extension prior to this update, it is recommended to build this extension with a different domain name than the one installed. This update is a complete re-write of the extension and uses a different settings system, so existent settings will be ignored.

WARNING 2: An existent translation history will be compatible with the updated extension, but the existent history will have to be *sanitized*. If installing this new version of the extension with a new domain, the translation history of the previous version can also be imported into the new extension.

- Removed Transltr engine. It seems that it ceased to exist.
- Removed custom icons in favor of using the ones available on a system.

- Better handling of source text with HTML markup (and by *better* I mean *less worse* LOL).
- Better debugging and logging mechanism.

- Removed all themes. Now the default theme is *theme agnostic*. This means that, when using the default theme, the UI will adapt to the currently used Cinnamon theme. Custom themes can still be created and used.
- The translator dialog has been redesigned to better adapt to any screen size.
- Added more keyboard shortcuts to interact with the translation dialog. There is still no traditional keyboard navigation between the UI elements (and never will be; I would have to write 500 lines of code just to make it barely useful), but almost all actions can be performed with a keyboard shortcut. I'm still working on improving it. The final goal would be to make all features accessible using the keyboard.

- The history mechanism is optional now (but enabled by default).
- The translation history can now be imported/exported/cleared from the history window.
- Translation history window changes:
    - Added advanced search capabilities (the history can be searched/filtered).
    - All columns can be sorted.
    - The window size and maximized state are remembered after closing the window.
    - The time stamps displayed will always respect the formatting set in the extension settings.
    - Eradicated the use of markup because I fed up of dealing with nonsense. This has the side effect of making the history loading, filtering and sorting a little bit faster (at least in appearance).
    - Added grid lines to the history tree.

***

**Date:** Thu, 9 May 2019 05:30:30 -0300<br/>
**Commit:** [d5eab7d](https://gitlab.com/Odyseus/CinnamonTools/commit/d5eab7d)<br/>
**Author:** Odyseus<br/>

- Restructured theme loading mechanism.

***

**Date:** Thu, 25 Apr 2019 02:00:16 -0300<br/>
**Commit:** [f07f501](https://gitlab.com/Odyseus/CinnamonTools/commit/f07f501)<br/>
**Author:** Odyseus<br/>

- Added a signal manager to manage existent signal connections and to handle some signals that weren't managed.

TODO

- Re-write it to use the xlets settings framework and Cinnamon's native settings instead of gsettings.
- Fix the super annoying mismatch of GUI behavior between Cinnamon versions. Specifically the misalignment of the grid elements inside the translator dialog.
- Correct a lot of the nonsense that I added when I initially ported this extension from its original. After three years, it is likely that I have learned something. LOL
    - The **enable-shortcuts** setting is useless. Just register the keybindings that were set; just like I have been doing in all my other xlets.
    - Implement the theme loading method that I have been using in all of my other xlets.
    - Re-implement the way **loggin-enabled** works. Maybe implement `prototypeDebugger` but not before I figure out how to toggle its state without using a gsetting. ¬¬
    - Redesign the default theme so it uses classes present on Cinnamon's theme.

***

**Date:** Thu, 17 Jan 2019 14:18:16 -0300<br/>
**Commit:** [f06a50e](https://gitlab.com/Odyseus/CinnamonTools/commit/f06a50e)<br/>
**Author:** Odyseus<br/>

- Python files improvements:
    - Simplified localization system.
    - Homogenized/Cleaned up code.

***

**Date:** Mon, 24 Dec 2018 21:40:13 -0300<br/>
**Commit:** [a22c604](https://gitlab.com/Odyseus/CinnamonTools/commit/a22c604)<br/>
**Author:** Odyseus<br/>

- Removed DeepL translator. Removed from translate-shell in https://github.com/soimort/translate-shell/pull/272.

***

**Date:** Fri, 5 Oct 2018 04:40:16 -0300<br/>
**Commit:** [0af034d](https://gitlab.com/Odyseus/CinnamonTools/commit/0af034d)<br/>
**Author:** Odyseus<br/>

- Fixed handling of clipboard for Cinnamon versions greater than 3.6.x due to API changes.

***

**Date:** Thu, 23 Aug 2018 02:38:41 -0300<br/>
**Commit:** [8faff12](https://gitlab.com/Odyseus/CinnamonTools/commit/8faff12)<br/>
**Author:** Odyseus<br/>

- Implemented a more transparent way of calling `Gio.File.load_contents_finish`.

***

**Date:** Tue, 7 Aug 2018 03:17:33 -0300<br/>
**Commit:** [38b96da](https://gitlab.com/Odyseus/CinnamonTools/commit/38b96da)<br/>
**Author:** Odyseus<br/>

- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

***

**Date:** Sat, 4 Aug 2018 05:12:10 -0300<br/>
**Commit:** [e195789](https://gitlab.com/Odyseus/CinnamonTools/commit/e195789)<br/>
**Author:** Odyseus<br/>

- Revamped/simplified settings system.
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.
- Removed support for Cinnamon versions older than 3.0.x.

***

**Date:** Tue, 12 Jun 2018 00:03:55 -0300<br/>
**Commit:** [0636a62](https://gitlab.com/Odyseus/CinnamonTools/commit/0636a62)<br/>
**Author:** Odyseus<br/>

- gksu deprecation mitigation:
    - Removed gsettings schema installation/removal from the settings.py script. To avoid dealing with retarded policies (pkexec), I moved the installation process to a helper file (common to all xlets) that uses the good old sudo.
- Cleaned some comments/commented lines.

***

**Date:** Sat, 5 May 2018 05:00:45 -0300<br/>
**Commit:** [c41ae2e](https://gitlab.com/Odyseus/CinnamonTools/commit/c41ae2e)<br/>
**Author:** Odyseus<br/>

- Removed synchronous function calls. This effectively removes the *dangerous* flag displayed on the extensions manager for this extension.
- Added proper **gsettings** handling for gathering proxy data.
- Added two new translation engines (DeepL and Yandex, both used through Translate Shell).
- Now translations providers based on Translate Shell are *sub-classed* from a base *class* so they can be initialized with just a *"couple lines of code"*.

***

**Date:** Tue, 1 May 2018 22:47:20 -0300<br/>
**Commit:** [4c5f7e3](https://gitlab.com/Odyseus/CinnamonTools/commit/4c5f7e3)<br/>
**Author:** Odyseus<br/>

Fixed wrong function calls inside catch blocks. I copied the `loadStylesheet` and `unloadStylesheet` functions from Cinnamon's code itself, and I didn't do a very good job at adapting the original logging functions.

***
