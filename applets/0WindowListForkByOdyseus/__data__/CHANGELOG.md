## Window list (Fork By Odyseus) changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Thu, 30 May 2019 03:48:50 -0300
- **Commit:** [4441640](https://gitlab.com/Odyseus/CinnamonTools/commit/4441640)
- **Author:** Odyseus

```
- Minor changes due to changes in global modules.

```

***

- **Date:** Thu, 23 May 2019 02:17:09 -0300
- **Commit:** [f703c1a](https://gitlab.com/Odyseus/CinnamonTools/commit/f703c1a)
- **Author:** Odyseus

```
- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Implemented debugger.

```

***

- **Date:** Fri, 26 Apr 2019 02:51:04 -0300
- **Commit:** [ad6f29a](https://gitlab.com/Odyseus/CinnamonTools/commit/ad6f29a)
- **Author:** Odyseus

```
- Fixed windows thumbnails not showing up due to upstream fix that caused more problems than solutions.

```

***

- **Date:** Tue, 5 Mar 2019 03:16:33 -0300
- **Commit:** [beeb461](https://gitlab.com/Odyseus/CinnamonTools/commit/beeb461)
- **Author:** Odyseus

```
- Back-ported fixes and features from upstream.
    - Correct handling of icon sizes.
    - Added option to disable window minimization on left click. ¬¬
    - Fixed icons not appearing for some applications.
    - Ensure minimized window button menus update on monitor change.

```

***

- **Date:** Thu, 28 Feb 2019 20:06:55 -0300
- **Commit:** [0ddf56b](https://gitlab.com/Odyseus/CinnamonTools/commit/0ddf56b)
- **Author:** Odyseus

```
- Updated CONTRIBUTORS.md file to properly give credit.

```

***

- **Date:** Thu, 21 Feb 2019 10:33:10 -0300
- **Commit:** [0f5d82f](https://gitlab.com/Odyseus/CinnamonTools/commit/0f5d82f)
- **Author:** Odyseus

```
- Added call to finalize settings when applet is removed from panel.

```

***

- **Date:** Tue, 15 Jan 2019 22:35:43 -0300
- **Commit:** [f09fd6f](https://gitlab.com/Odyseus/CinnamonTools/commit/f09fd6f)
- **Author:** Odyseus

```
- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

```

***

- **Date:** Fri, 21 Dec 2018 13:07:21 -0300
- **Commit:** [ae83195](https://gitlab.com/Odyseus/CinnamonTools/commit/ae83195)
- **Author:** Odyseus

```
- Removed usage of Applet._scaleMode calls due to its deprecation and to avoid a myriad of warnings. ¬¬

```

***

- **Date:** Mon, 29 Oct 2018 13:43:27 -0300
- **Commit:** [a50966d](https://gitlab.com/Odyseus/CinnamonTools/commit/a50966d)
- **Author:** Odyseus

```
- Some upstream fixes.

```

***

- **Date:** Tue, 7 Aug 2018 03:13:17 -0300
- **Commit:** [c868f1f](https://gitlab.com/Odyseus/CinnamonTools/commit/c868f1f)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

```

***

- **Date:** Sat, 4 Aug 2018 05:13:28 -0300
- **Commit:** [dee7ff0](https://gitlab.com/Odyseus/CinnamonTools/commit/dee7ff0)
- **Author:** Odyseus

```
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.

```

***

- **Date:** Wed, 13 Jun 2018 01:05:52 -0300
- **Commit:** [c880ee1](https://gitlab.com/Odyseus/CinnamonTools/commit/c880ee1)
- **Author:** Odyseus

```
- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

```

***
