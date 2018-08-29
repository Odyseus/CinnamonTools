## Feeds Reader (Fork By Odyseus) changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

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
