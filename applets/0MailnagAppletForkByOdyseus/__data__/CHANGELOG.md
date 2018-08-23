## Mailnag (Fork By Odyseus) changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Tue, 7 Aug 2018 03:09:02 -0300
- **Commit:** [47b88a4](https://gitlab.com/Odyseus/CinnamonTools/commit/47b88a4)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be
converted) to arrow functions.

```

***

- **Date:** Sat, 4 Aug 2018 05:14:59 -0300
- **Commit:** [974afeb](https://gitlab.com/Odyseus/CinnamonTools/commit/974afeb)
- **Author:** Odyseus

```
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards
moving all JavaScript code to ES6.

```

***

- **Date:** Wed, 13 Jun 2018 01:02:10 -0300
- **Commit:** [3a7e5e3](https://gitlab.com/Odyseus/CinnamonTools/commit/3a7e5e3)
- **Author:** Odyseus

```
- Corrected settings changed callback function due to different amount of arguments passed by
different Cinnamon versions. Not used by this applet, but doesn't hurt to have a function that
actually works.

```

***

- **Date:** Tue, 8 May 2018 07:01:06 -0300
- **Commit:** [78afdf2](https://gitlab.com/Odyseus/CinnamonTools/commit/78afdf2)
- **Author:** Odyseus

```
- Removed call to log function accidentally left.

```

***

- **Date:** Tue, 8 May 2018 05:29:34 -0300
- **Commit:** [7b67bd6](https://gitlab.com/Odyseus/CinnamonTools/commit/7b67bd6)
- **Author:** Odyseus

```
- Revamped/simplified settings mechanism.
    - Renamed all settings keys to be prefixed with "pref_".
- Moved utility functions into the utils.js file.
- Added option to keep only one menu at a time.
- Cleaned up comments.
- Updated POT file and added Spanish localization.

```

***

- **Date:** Wed, 2 May 2018 00:40:23 -0300
- **Commit:** [6389c57](https://gitlab.com/Odyseus/CinnamonTools/commit/6389c57)
- **Author:** Odyseus

```
- Moved some property declarations inside the applet object.
- Moved settings initialization and context menu expansion outside the `Mainloop.idle_add` call.

```

***
