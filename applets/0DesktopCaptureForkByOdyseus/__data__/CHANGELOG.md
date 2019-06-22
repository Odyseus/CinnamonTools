## Desktop Capture (Fork By Odyseus) changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Fri, 21 Jun 2019 23:01:59 -0300
- **Commit:** [556b3ce](https://gitlab.com/Odyseus/CinnamonTools/commit/556b3ce)
- **Author:** Odyseus

```
- Corrected typo in settings-schema.json file.

```

***

- **Date:** Thu, 30 May 2019 03:47:07 -0300
- **Commit:** [6845519](https://gitlab.com/Odyseus/CinnamonTools/commit/6845519)
- **Author:** Odyseus

```
- Minor changes due to changes in global modules.

```

***

- **Date:** Thu, 23 May 2019 02:15:34 -0300
- **Commit:** [fa96932](https://gitlab.com/Odyseus/CinnamonTools/commit/fa96932)
- **Author:** Odyseus

```
- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Implemented debugger.

```

***

- **Date:** Thu, 9 May 2019 05:18:37 -0300
- **Commit:** [dd42032](https://gitlab.com/Odyseus/CinnamonTools/commit/dd42032)
- **Author:** Odyseus

```
- Corrected infinite loop caused by the use of an absolutely retarded language.
- Restructured theme loading mechanism.

```

***

- **Date:** Fri, 26 Apr 2019 13:51:39 -0300
- **Commit:** [5501d72](https://gitlab.com/Odyseus/CinnamonTools/commit/5501d72)
- **Author:** Odyseus

```
- Added missing call to keybinding registration when the recorder device is set to any other than Cinnamon's.

```

***

- **Date:** Thu, 25 Apr 2019 02:06:50 -0300
- **Commit:** [373d11e](https://gitlab.com/Odyseus/CinnamonTools/commit/373d11e)
- **Author:** Odyseus

```
- Added a signal manager to manage signal connections that weren't managed.

```

***

- **Date:** Thu, 28 Feb 2019 20:03:45 -0300
- **Commit:** [ee49e70](https://gitlab.com/Odyseus/CinnamonTools/commit/ee49e70)
- **Author:** Odyseus

```
- Switched to a little more precise way of checking if an object is an object.

```

***

- **Date:** Mon, 21 Jan 2019 21:52:17 -0300
- **Commit:** [a1b18e7](https://gitlab.com/Odyseus/CinnamonTools/commit/a1b18e7)
- **Author:** Odyseus

```
- Changed applet icon file. The same icon but 48x48 in size.

```

***

- **Date:** Thu, 17 Jan 2019 14:14:50 -0300
- **Commit:** [dfc83ac](https://gitlab.com/Odyseus/CinnamonTools/commit/dfc83ac)
- **Author:** Odyseus

```
- Python files improvements:
    - Simplified localization system.
    - Homogenized/Cleaned up code.

```

***

- **Date:** Tue, 15 Jan 2019 22:37:58 -0300
- **Commit:** [7ec10d8](https://gitlab.com/Odyseus/CinnamonTools/commit/7ec10d8)
- **Author:** Odyseus

```
- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

```

***

- **Date:** Tue, 8 Jan 2019 21:41:13 -0300
- **Commit:** [7609cc8](https://gitlab.com/Odyseus/CinnamonTools/commit/7609cc8)
- **Author:** Odyseus

```
- Fixed strict mode warning.

```

***

- **Date:** Fri, 5 Oct 2018 04:40:55 -0300
- **Commit:** [85bb665](https://gitlab.com/Odyseus/CinnamonTools/commit/85bb665)
- **Author:** Odyseus

```
- Fixed handling of clipboard for Cinnamon versions greater than 3.6.x due to API changes.

```

***

- **Date:** Wed, 19 Sep 2018 12:35:24 -0300
- **Commit:** [3ca9a5a](https://gitlab.com/Odyseus/CinnamonTools/commit/3ca9a5a)
- **Author:** Odyseus

```
- Added localization template options file.

```

***

- **Date:** Sat, 1 Sep 2018 12:49:18 -0300
- **Commit:** [daf1136](https://gitlab.com/Odyseus/CinnamonTools/commit/daf1136)
- **Author:** Odyseus

```
Fork of [Desktop Capture](https://github.com/rjanja/desktop-capture) applet by Rob Adams (a.k.a. rjanja).

- Initial fork version.
- Principal differences with the original applet:
    - More convenient handling of settings. Most settings can be changed directly from the applet menu or its context menu without the need to constantly open the applet settings window.
    - Keyboard shortcuts are not only available for Cinnamon's built-in features, but for all screenshot/screencast programs.
    - Settings are immediately available after changed without the need to restart Cinnamon.
    - The 'Repeat last' item isn't only available for Cinnamon's screenshots, but for any device and any program.
- TODOs:
    - Decide if I should add back the notification and upload services mechanisms.
    - Decide if I should implement a history mechanism.
    - Check if the HELP.html page content is complete.
    - Finish Spanish localization.

```

***
