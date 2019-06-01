## Desktop Handler changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Thu, 30 May 2019 03:47:16 -0300
- **Commit:** [7346c65](https://gitlab.com/Odyseus/CinnamonTools/commit/7346c65)
- **Author:** Odyseus

```
- Minor changes due to changes in global modules.

```

***

- **Date:** Thu, 23 May 2019 02:15:46 -0300
- **Commit:** [20a83f2](https://gitlab.com/Odyseus/CinnamonTools/commit/20a83f2)
- **Author:** Odyseus

```
- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Implemented debugger.
- Added an ID to the custom confirmation dialog to avoid conflictive styling with other xlets.

```

***

- **Date:** Tue, 15 Jan 2019 22:37:49 -0300
- **Commit:** [7525419](https://gitlab.com/Odyseus/CinnamonTools/commit/7525419)
- **Author:** Odyseus

```
- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

```

***

- **Date:** Tue, 7 Aug 2018 03:06:49 -0300
- **Commit:** [b3398ba](https://gitlab.com/Odyseus/CinnamonTools/commit/b3398ba)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

```

***

- **Date:** Sat, 4 Aug 2018 05:15:41 -0300
- **Commit:** [0b0574c](https://gitlab.com/Odyseus/CinnamonTools/commit/0b0574c)
- **Author:** Odyseus

```
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.
- Removed support for Cinnamon versions older than 3.0.x.
- Minor code cleanup.

```

***

- **Date:** Wed, 13 Jun 2018 01:00:54 -0300
- **Commit:** [5c56c7a](https://gitlab.com/Odyseus/CinnamonTools/commit/5c56c7a)
- **Author:** Odyseus

```
- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

```

***
