## Multi Translator changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Sat, 18 May 2019 22:22:01 -0300
- **Commit:** [38eed82](https://gitlab.com/Odyseus/CinnamonTools/commit/38eed82)
- **Author:** Odyseus

```
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

```

***

- **Date:** Tue, 14 May 2019 14:33:20 -0300
- **Commit:** [eb77bca](https://gitlab.com/Odyseus/CinnamonTools/commit/eb77bca)
- **Author:** Odyseus

```
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

```

***

- **Date:** Thu, 9 May 2019 05:30:30 -0300
- **Commit:** [d5eab7d](https://gitlab.com/Odyseus/CinnamonTools/commit/d5eab7d)
- **Author:** Odyseus

```
- Restructured theme loading mechanism.

```

***

- **Date:** Thu, 25 Apr 2019 02:00:16 -0300
- **Commit:** [f07f501](https://gitlab.com/Odyseus/CinnamonTools/commit/f07f501)
- **Author:** Odyseus

```
- Added a signal manager to manage existent signal connections and to handle some signals that weren't managed.

TODO

- Re-write it to use the xlets settings framework and Cinnamon's native settings instead of gsettings.
- Fix the super annoying mismatch of GUI behavior between Cinnamon versions. Specifically the misalignment of the grid elements inside the translator dialog.
- Correct a lot of the nonsense that I added when I initially ported this extension from its original. After three years, it is likely that I have learned something. LOL
    - The **enable-shortcuts** setting is useless. Just register the keybindings that were set; just like I have been doing in all my other xlets.
    - Implement the theme loading method that I have been using in all of my other xlets.
    - Re-implement the way **loggin-enabled** works. Maybe implement `prototypeDebugger` but not before I figure out how to toggle its state without using a gsetting. ¬¬
    - Redesign the default theme so it uses classes present on Cinnamon's theme.

```

***

- **Date:** Thu, 17 Jan 2019 14:18:16 -0300
- **Commit:** [f06a50e](https://gitlab.com/Odyseus/CinnamonTools/commit/f06a50e)
- **Author:** Odyseus

```
- Python files improvements:
    - Simplified localization system.
    - Homogenized/Cleaned up code.

```

***

- **Date:** Mon, 24 Dec 2018 21:40:13 -0300
- **Commit:** [a22c604](https://gitlab.com/Odyseus/CinnamonTools/commit/a22c604)
- **Author:** Odyseus

```
- Removed DeepL translator. Removed from translate-shell in https://github.com/soimort/translate-shell/pull/272.

```

***

- **Date:** Fri, 5 Oct 2018 04:40:16 -0300
- **Commit:** [0af034d](https://gitlab.com/Odyseus/CinnamonTools/commit/0af034d)
- **Author:** Odyseus

```
- Fixed handling of clipboard for Cinnamon versions greater than 3.6.x due to API changes.

```

***

- **Date:** Thu, 23 Aug 2018 02:38:41 -0300
- **Commit:** [8faff12](https://gitlab.com/Odyseus/CinnamonTools/commit/8faff12)
- **Author:** Odyseus

```
- Implemented a more transparent way of calling `Gio.File.load_contents_finish`.

```

***

- **Date:** Tue, 7 Aug 2018 03:17:33 -0300
- **Commit:** [38b96da](https://gitlab.com/Odyseus/CinnamonTools/commit/38b96da)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

```

***

- **Date:** Sat, 4 Aug 2018 05:12:10 -0300
- **Commit:** [e195789](https://gitlab.com/Odyseus/CinnamonTools/commit/e195789)
- **Author:** Odyseus

```
- Revamped/simplified settings system.
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.
- Removed support for Cinnamon versions older than 3.0.x.

```

***

- **Date:** Tue, 12 Jun 2018 00:03:55 -0300
- **Commit:** [0636a62](https://gitlab.com/Odyseus/CinnamonTools/commit/0636a62)
- **Author:** Odyseus

```
- gksu deprecation mitigation:
    - Removed gsettings schema installation/removal from the settings.py script. To avoid dealing with retarded policies (pkexec), I moved the installation process to a helper file (common to all xlets) that uses the good old sudo.
- Cleaned some comments/commented lines.

```

***

- **Date:** Sat, 5 May 2018 05:00:45 -0300
- **Commit:** [c41ae2e](https://gitlab.com/Odyseus/CinnamonTools/commit/c41ae2e)
- **Author:** Odyseus

```
- Removed synchronous function calls. This effectively removes the *dangerous* flag displayed on the extensions manager for this extension.
- Added proper **gsettings** handling for gathering proxy data.
- Added two new translation engines (DeepL and Yandex, both used through Translate Shell).
- Now translations providers based on Translate Shell are *sub-classed* from a base *class* so they can be initialized with just a *"couple lines of code"*.

```

***

- **Date:** Tue, 1 May 2018 22:47:20 -0300
- **Commit:** [4c5f7e3](https://gitlab.com/Odyseus/CinnamonTools/commit/4c5f7e3)
- **Author:** Odyseus

```
Fixed wrong function calls inside catch blocks. I copied the `loadStylesheet` and `unloadStylesheet` functions from Cinnamon's code itself, and I didn't do a very good job at adapting the original logging functions.

```

***
