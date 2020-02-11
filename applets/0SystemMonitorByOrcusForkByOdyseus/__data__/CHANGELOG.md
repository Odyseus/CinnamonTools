## System Monitor (Fork By Odyseus) changelog

**This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools).**

***

- **Date:** Mon, 10 Feb 2020 23:16:24 -0300
- **Commit:** [8f573c7](https://gitlab.com/Odyseus/CinnamonTools/commit/8f573c7)
- **Author:** Odyseus

```
- Removed a couple of unused imports.
- Removed leftover code of xlets initialization using a Cinnamon feature that thankfully wasn't implemented.
- Implemented the use of the `xdgOpen` function from the `globalUtils.js` JavaScript module.

```

***

- **Date:** Mon, 27 Jan 2020 02:42:00 -0300
- **Commit:** [6d81829](https://gitlab.com/Odyseus/CinnamonTools/commit/6d81829)
- **Author:** Odyseus

```
Countermeasures for using an external settings application
----------------------------------------------------------

- Removed condition used to selectively override the applet's Configure context menu item depending on Cinnamon version used. This condition caused to not open the settings window on newer Cinnamon versions.
- Added button to the settings-schema.json file so the *real* settings window can be opened from Cinnamon's native settings window. Trying to open the correct xlet settings from the xlets manager isn't possible, so I added this button.
- Removed `external-configuration-app` key from the metadata.json file so the built-in mechanism to open xlet settings doesn't fail silently without displaying error messages.

```

***

- **Date:** Fri, 21 Jun 2019 23:05:27 -0300
- **Commit:** [0a45561](https://gitlab.com/Odyseus/CinnamonTools/commit/0a45561)
- **Author:** Odyseus

```
Applet rewrite
--------------

WARNING: This update is a complete rewrite of the applet and it will reset some of the settings of an existent instance of this applet to their default values.

- Re-based from the version of the original author to take advantage of the performance improvements.
- Redesigned applet tooltip to display information symmetrically.
- Added option to change the order of the graphs in the applet.
- Enabled support for vertical panels. Vertical panels were already supported since a previous re-base from the original applet, but I forgot to actually set the proper flag for the applet to be allowed to be placed in a vertical panel.
- Implemented the use of a custom framework to handle the applet settings to take advantage of features not existent on Cinnamon's native settings system.

```

***

- **Date:** Thu, 30 May 2019 03:48:27 -0300
- **Commit:** [49ddf9d](https://gitlab.com/Odyseus/CinnamonTools/commit/49ddf9d)
- **Author:** Odyseus

```
- Minor changes due to changes in global modules.

```

***

- **Date:** Thu, 23 May 2019 02:16:40 -0300
- **Commit:** [7dff940](https://gitlab.com/Odyseus/CinnamonTools/commit/7dff940)
- **Author:** Odyseus

```
- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Implemented debugger.

```

***

- **Date:** Thu, 28 Feb 2019 20:04:42 -0300
- **Commit:** [129b973](https://gitlab.com/Odyseus/CinnamonTools/commit/129b973)
- **Author:** Odyseus

```
- Updated CONTRIBUTORS.md file to properly give credit.

```

***

- **Date:** Tue, 15 Jan 2019 22:36:25 -0300
- **Commit:** [8e3131d](https://gitlab.com/Odyseus/CinnamonTools/commit/8e3131d)
- **Author:** Odyseus

```
- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

```

***

- **Date:** Tue, 8 Jan 2019 21:40:45 -0300
- **Commit:** [2b83e21](https://gitlab.com/Odyseus/CinnamonTools/commit/2b83e21)
- **Author:** Odyseus

```
- Fixed strict mode warning.

```

***

- **Date:** Tue, 7 Aug 2018 04:35:43 -0300
- **Commit:** [e4bde9a](https://gitlab.com/Odyseus/CinnamonTools/commit/e4bde9a)
- **Author:** Odyseus

```
- Fixed the use of the wrong `for` loop type (`in` was used instead of `of`) that triggered errors when changing the size of an applet graphic.

```

***

- **Date:** Sat, 4 Aug 2018 05:14:05 -0300
- **Commit:** [11ddf15](https://gitlab.com/Odyseus/CinnamonTools/commit/11ddf15)
- **Author:** Odyseus

```
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.

```

***

- **Date:** Wed, 13 Jun 2018 01:10:47 -0300
- **Commit:** [0879c48](https://gitlab.com/Odyseus/CinnamonTools/commit/0879c48)
- **Author:** Odyseus

```
- Implemented one settings changed callback to *rule them all*. At the same time, make the callback work homogeneously on all versions of Cinnamon.
- Added option to display CPU usage decimals in applet tooltip. Upstream feature.
- Fixed the rendering, where some lines were half pixel off and therefore a bit blurry. All graphs should now be pixel perfect. Upstream fix.

```

***

- **Date:** Wed, 9 May 2018 01:12:44 -0300
- **Commit:** [00df64f](https://gitlab.com/Odyseus/CinnamonTools/commit/00df64f)
- **Author:** Odyseus

```
- Rebased from the new applet version from the original author.
    - Support for vertical panels.
    - Changed settings are applied on-the-fly without the need to restart Cinnamon.
- Eradicated *multiversion*. I made the applet be supported on multiple versions of Cinnamon without the need to use Cinnamon's *multiversion* feature.
- Added keyboard shortcut to be able to launch a custom command.
- Added option to hide the graphs background, not just set it transparent.

```

***
