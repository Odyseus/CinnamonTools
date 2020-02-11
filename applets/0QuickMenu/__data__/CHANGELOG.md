## Quick Menu changelog

**This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools).**

***

- **Date:** Mon, 10 Feb 2020 23:21:47 -0300
- **Commit:** [e223984](https://gitlab.com/Odyseus/CinnamonTools/commit/e223984)
- **Author:** Odyseus

```
- Removed leftover code of xlets initialization using a Cinnamon feature that thankfully wasn't implemented.
- Implemented the use of the `xdgOpen` function from the `globalUtils.js` JavaScript module.

```

***

- **Date:** Tue, 16 Jul 2019 00:53:10 -0300
- **Commit:** [a7cade1](https://gitlab.com/Odyseus/CinnamonTools/commit/a7cade1)
- **Author:** Odyseus

```
- Just a couple of typos/grammar corrections.

```

***

- **Date:** Fri, 21 Jun 2019 23:04:11 -0300
- **Commit:** [b2b85bf](https://gitlab.com/Odyseus/CinnamonTools/commit/b2b85bf)
- **Author:** Odyseus

```
- Corrected typo in settings-schema.json file.
- Attempt to remove a warning.

```

***

- **Date:** Thu, 30 May 2019 03:48:00 -0300
- **Commit:** [cdcab86](https://gitlab.com/Odyseus/CinnamonTools/commit/cdcab86)
- **Author:** Odyseus

```
- Minor changes due to changes in global modules.

```

***

- **Date:** Thu, 23 May 2019 02:16:19 -0300
- **Commit:** [142fa93](https://gitlab.com/Odyseus/CinnamonTools/commit/142fa93)
- **Author:** Odyseus

```
- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Implemented debugger.

```

***

- **Date:** Tue, 5 Mar 2019 03:03:43 -0300
- **Commit:** [35839a0](https://gitlab.com/Odyseus/CinnamonTools/commit/35839a0)
- **Author:** Odyseus

```
- Fixed keybinding to open/close the menu not being registered on applet initialization.
- Improved the *Auto-update menu* option by adding more Gio.FileMonitorEvent checks. Still not very useful, but it's better than nothing.
- Removed unnecessary function definitions.

```

***

- **Date:** Tue, 15 Jan 2019 22:36:44 -0300
- **Commit:** [07f567c](https://gitlab.com/Odyseus/CinnamonTools/commit/07f567c)
- **Author:** Odyseus

```
- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

```

***

- **Date:** Thu, 23 Aug 2018 02:43:58 -0300
- **Commit:** [8cb1610](https://gitlab.com/Odyseus/CinnamonTools/commit/8cb1610)
- **Author:** Odyseus

```
- Implemented a more transparent way of calling `Gio.File.load_contents_finish`.

```

***

- **Date:** Tue, 7 Aug 2018 03:10:29 -0300
- **Commit:** [3d58cc3](https://gitlab.com/Odyseus/CinnamonTools/commit/3d58cc3)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.
- Cleaned leftovers from previous cleanup.

```

***

- **Date:** Sat, 4 Aug 2018 05:14:27 -0300
- **Commit:** [5c6797d](https://gitlab.com/Odyseus/CinnamonTools/commit/5c6797d)
- **Author:** Odyseus

```
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.
- Simplification of the procedure to set the applet icon.
- Removed support for Cinnamon versions older than 3.0.x.

```

***

- **Date:** Wed, 13 Jun 2018 01:04:30 -0300
- **Commit:** [0ad1606](https://gitlab.com/Odyseus/CinnamonTools/commit/0ad1606)
- **Author:** Odyseus

```
- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

```

***

- **Date:** Mon, 7 May 2018 04:53:29 -0300
- **Commit:** [9cc8173](https://gitlab.com/Odyseus/CinnamonTools/commit/9cc8173)
- **Author:** Odyseus

```
- Implemented key bindings common naming.

```

***
