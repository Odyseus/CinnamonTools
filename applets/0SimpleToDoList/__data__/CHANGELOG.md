## Simple ToDo List changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Thu, 30 May 2019 03:48:15 -0300
- **Commit:** [306c938](https://gitlab.com/Odyseus/CinnamonTools/commit/306c938)
- **Author:** Odyseus

```
- Minor changes due to changes in global modules.

```

***

- **Date:** Thu, 23 May 2019 02:16:29 -0300
- **Commit:** [5cbcc12](https://gitlab.com/Odyseus/CinnamonTools/commit/5cbcc12)
- **Author:** Odyseus

```
- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Improved debugger.

```

***

- **Date:** Thu, 9 May 2019 05:20:31 -0300
- **Commit:** [e7bca0b](https://gitlab.com/Odyseus/CinnamonTools/commit/e7bca0b)
- **Author:** Odyseus

```
- Prefer the icons provided by the currently used theme instead of the custom icons shipped with the xlet.

```

***

- **Date:** Thu, 17 Jan 2019 14:16:29 -0300
- **Commit:** [6da6e7e](https://gitlab.com/Odyseus/CinnamonTools/commit/6da6e7e)
- **Author:** Odyseus

```
- Python files improvements:
    - Simplified localization system.
    - Homogenized/Cleaned up code.

```

***

- **Date:** Tue, 15 Jan 2019 22:36:36 -0300
- **Commit:** [a4afb66](https://gitlab.com/Odyseus/CinnamonTools/commit/a4afb66)
- **Author:** Odyseus

```
- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

```

***

- **Date:** Thu, 23 Aug 2018 02:43:14 -0300
- **Commit:** [349a399](https://gitlab.com/Odyseus/CinnamonTools/commit/349a399)
- **Author:** Odyseus

```
- Implemented a more transparent way of calling `Gio.File.load_contents_finish`.
- Added some hover feedback to the buttons (delete task/section, etc.) inside the main menu.

```

***

- **Date:** Tue, 7 Aug 2018 03:11:18 -0300
- **Commit:** [02d99a8](https://gitlab.com/Odyseus/CinnamonTools/commit/02d99a8)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

```

***

- **Date:** Sat, 4 Aug 2018 05:14:16 -0300
- **Commit:** [fe56992](https://gitlab.com/Odyseus/CinnamonTools/commit/fe56992)
- **Author:** Odyseus

```
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.
- Simplification of the procedure to set the applet icon.
- Removed support for Cinnamon versions older than 3.0.x.

```

***

- **Date:** Wed, 18 Jul 2018 00:54:18 -0300
- **Commit:** [d29db40](https://gitlab.com/Odyseus/CinnamonTools/commit/d29db40)
- **Author:** Odyseus

```
- Switched from using a JavaScript object to store/handle sections to an array. The change is "transparent" (stored tasks from older versions of this applet will be automatically converted).
- Added option to keep the sections inside the menu sorted alphabetically.

```

***

- **Date:** Wed, 13 Jun 2018 01:04:46 -0300
- **Commit:** [f3b918e](https://gitlab.com/Odyseus/CinnamonTools/commit/f3b918e)
- **Author:** Odyseus

```
- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

```

***

- **Date:** Mon, 14 May 2018 07:17:55 -0300
- **Commit:** [3f24413](https://gitlab.com/Odyseus/CinnamonTools/commit/3f24413)
- **Author:** Odyseus

```
- Implemented a logger *prototype* instead of using a logger function.

```

***

- **Date:** Mon, 7 May 2018 04:53:16 -0300
- **Commit:** [30d3f17](https://gitlab.com/Odyseus/CinnamonTools/commit/30d3f17)
- **Author:** Odyseus

```
- Implemented key bindings common naming.

```

***
