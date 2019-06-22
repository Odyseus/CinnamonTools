## Mailnag (Fork By Odyseus) changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Fri, 21 Jun 2019 23:02:29 -0300
- **Commit:** [889dcc2](https://gitlab.com/Odyseus/CinnamonTools/commit/889dcc2)
- **Author:** Odyseus

```
- Corrected typo in settings-schema.json file.

```

***

- **Date:** Thu, 30 May 2019 03:47:40 -0300
- **Commit:** [6313e5c](https://gitlab.com/Odyseus/CinnamonTools/commit/6313e5c)
- **Author:** Odyseus

```
- Minor changes due to changes in global modules.

```

***

- **Date:** Thu, 23 May 2019 02:16:03 -0300
- **Commit:** [5962d45](https://gitlab.com/Odyseus/CinnamonTools/commit/5962d45)
- **Author:** Odyseus

```
- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Implemented debugger.
- Added SVG icon.

```

***

- **Date:** Mon, 15 Apr 2019 21:56:22 -0300
- **Commit:** [6a35b28](https://gitlab.com/Odyseus/CinnamonTools/commit/6a35b28)
- **Author:** Odyseus

```
- Fixed error on a plural localization template caused by a typo.
- Added notification to inform about possible errors that might be caused by the custom notifications template.

```

***

- **Date:** Mon, 4 Mar 2019 08:56:33 -0300
- **Commit:** [9559623](https://gitlab.com/Odyseus/CinnamonTools/commit/9559623)
- **Author:** Odyseus

```
- Improved notification system. Now it is possible to choose different layouts for the notification and with more configuration options.
- Set the *No unread mails* item non reactive. Simply because it shouldn't be.

```

***

- **Date:** Fri, 1 Mar 2019 19:50:01 -0300
- **Commit:** [beff53e](https://gitlab.com/Odyseus/CinnamonTools/commit/beff53e)
- **Author:** Odyseus

```
- Added keyboard shortcut to open/close menu.
- Fixed mail client not launching on middle click on applet when the option **Launch mail client on click** was disabled.
- Moved some variables *out of the way* into the utils.js module.
- Moved the function call to update timestamps into the menu open/close event so it is triggered when the menu is opened and not just when the applet is clicked.
- Added some *failsafes* when dealing with objects' properties.
- Expanded applet context menu.
- Changed applet icon.

```

***

- **Date:** Fri, 1 Mar 2019 06:43:08 -0300
- **Commit:** [e827cf5](https://gitlab.com/Odyseus/CinnamonTools/commit/e827cf5)
- **Author:** Odyseus

```
- Fixed the mess that I made when I replaced the now defunct `for each` loops. In some places I was using *common* `for` loops to iterate over objects instead of `for...in` loops. This effectively fixes the update of the e-mail's time of arrival when the applet is clicked to open the menu.
- Added to the metadata.json file some missing fields.
- Removed several `try{}catch{}` blocks.

```

***

- **Date:** Thu, 28 Feb 2019 20:04:03 -0300
- **Commit:** [77f6913](https://gitlab.com/Odyseus/CinnamonTools/commit/77f6913)
- **Author:** Odyseus

```
- Exposed to translation several strings that weren't before.
- Correctly handle plural of translatable strings.
- Fixed bug that displayed incorrect amount of hours for received e-mails.
- Avoided the constant calculation of integers inside the `formatDatetime` function. For example, instead of storing the result of `24 * 60 * 60` in a constant that will be used once, just directly use the `86400` integer.
- Added missing CONTRIBUTORS.md file to properly give credit.
- *Strictified* comparisons.
- Switched to a little more precise way of checking if an object is an object.

```

***

- **Date:** Thu, 21 Feb 2019 10:34:21 -0300
- **Commit:** [b42c9f7](https://gitlab.com/Odyseus/CinnamonTools/commit/b42c9f7)
- **Author:** Odyseus

```
- Added call to finalize settings when applet is removed from panel.

```

***

- **Date:** Tue, 15 Jan 2019 22:37:12 -0300
- **Commit:** [551bef1](https://gitlab.com/Odyseus/CinnamonTools/commit/551bef1)
- **Author:** Odyseus

```
- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

```

***

- **Date:** Tue, 7 Aug 2018 03:09:02 -0300
- **Commit:** [47b88a4](https://gitlab.com/Odyseus/CinnamonTools/commit/47b88a4)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

```

***

- **Date:** Sat, 4 Aug 2018 05:14:59 -0300
- **Commit:** [974afeb](https://gitlab.com/Odyseus/CinnamonTools/commit/974afeb)
- **Author:** Odyseus

```
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.

```

***

- **Date:** Wed, 13 Jun 2018 01:02:10 -0300
- **Commit:** [3a7e5e3](https://gitlab.com/Odyseus/CinnamonTools/commit/3a7e5e3)
- **Author:** Odyseus

```
- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions. Not used by this applet, but doesn't hurt to have a function that actually works.

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
