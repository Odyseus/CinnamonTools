## Feeds Reader (Fork By Odyseus) changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Thu, 23 May 2019 02:15:54 -0300
- **Commit:** [af8e1cf](https://gitlab.com/Odyseus/CinnamonTools/commit/af8e1cf)
- **Author:** Odyseus

```
- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Improved debugger.
- Added SVG icon.

```

***

- **Date:** Mon, 15 Apr 2019 22:00:51 -0300
- **Commit:** [3c3afc3](https://gitlab.com/Odyseus/CinnamonTools/commit/3c3afc3)
- **Author:** Odyseus

```
- Implemented a tooltip for feed items that automatically positions itself above the cursor when there is no room on the screen to display the tooltip.
- Added clean up of new lines on the tooltip's text.

```

***

- **Date:** Thu, 21 Feb 2019 10:34:36 -0300
- **Commit:** [245db25](https://gitlab.com/Odyseus/CinnamonTools/commit/245db25)
- **Author:** Odyseus

```
- Added call to finalize settings when applet is removed from panel.

```

***

- **Date:** Thu, 17 Jan 2019 13:59:27 -0300
- **Commit:** [927b262](https://gitlab.com/Odyseus/CinnamonTools/commit/927b262)
- **Author:** Odyseus

```
- Added button to remove profiles to the Feeds Manager GUI (Finally I figured out! LOL).
- Added option to *unify* notifications.
- Cleaned up inaccurate/unnecessary comments.
- Changed default feeds to include a second profile.
- Python files improvements:
    - Simplified localization system.
    - Homogenized/Cleaned up code.
    - Docstrings completion/clean up.

```

***

- **Date:** Tue, 15 Jan 2019 22:37:24 -0300
- **Commit:** [99f22ba](https://gitlab.com/Odyseus/CinnamonTools/commit/99f22ba)
- **Author:** Odyseus

```
- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

```

***

- **Date:** Thu, 23 Aug 2018 02:46:10 -0300
- **Commit:** [7c30cea](https://gitlab.com/Odyseus/CinnamonTools/commit/7c30cea)
- **Author:** Odyseus

```
- Implemented a more transparent way of calling `Gio.File.load_contents_finish`.

```

***

- **Date:** Tue, 7 Aug 2018 03:08:45 -0300
- **Commit:** [0c43e68](https://gitlab.com/Odyseus/CinnamonTools/commit/0c43e68)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

```

***

- **Date:** Sat, 4 Aug 2018 05:15:18 -0300
- **Commit:** [3aecd1d](https://gitlab.com/Odyseus/CinnamonTools/commit/3aecd1d)
- **Author:** Odyseus

```
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.

```

***

- **Date:** Wed, 18 Jul 2018 00:37:54 -0300
- **Commit:** [56ed4bb](https://gitlab.com/Odyseus/CinnamonTools/commit/56ed4bb)
- **Author:** Odyseus

```
- Fixed an issue that prevented to set and use the default profile when the applet was placed in a panel for the first time.
- Added options to set custom icons for use with the applet.
- Removed some `try{} catch{}` blocks that were used for debugging.
- Renamed the icons shipped with the applet to be less generic.

```

***

- **Date:** Wed, 13 Jun 2018 01:01:13 -0300
- **Commit:** [c586d38](https://gitlab.com/Odyseus/CinnamonTools/commit/c586d38)
- **Author:** Odyseus

```
- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

```

***

- **Date:** Tue, 5 Jun 2018 16:15:19 -0300
- **Commit:** [e043ddd](https://gitlab.com/Odyseus/CinnamonTools/commit/e043ddd)
- **Author:** Odyseus

```
- Re-based from the new applet version from the original author.
- Added keyboard shortcut to be able to open/close the menu.
- Added proper keyboard navigation for the menu.
- Eliminated the need of a stylesheet.css file. The menu will be styled respecting the currently used Cinnamon theme.
- Feeds will only be updated from their online sources if the last check was made after the refresh interval.
- Added missing dependency message.
- Forced the use of Python 3 in all Python modules/scripts.

```

***

- **Date:** Wed, 2 May 2018 00:40:33 -0300
- **Commit:** [aec58b6](https://gitlab.com/Odyseus/CinnamonTools/commit/aec58b6)
- **Author:** Odyseus

```
- Fixed preference name type.

```

***
