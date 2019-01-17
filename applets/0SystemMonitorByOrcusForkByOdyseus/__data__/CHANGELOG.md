## System Monitor (Fork By Odyseus) changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

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
