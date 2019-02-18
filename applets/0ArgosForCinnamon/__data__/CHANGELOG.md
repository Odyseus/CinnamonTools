## Argos for Cinnamon changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Mon, 18 Feb 2019 01:28:04 -0300
- **Commit:** [491c8b3](https://gitlab.com/Odyseus/CinnamonTools/commit/491c8b3)
- **Author:** Odyseus

```
- Made button lines behavior match that of the described by the documentation (*...all button lines get a dropdown menu item...*). In practice, this applet had the same behavior as the extension is based on; button lines would get a dropdown menu only if there were more than one button line. Argos for Cinnamon now will always create a dropdown item for each button line (respecting the `dropdown` attribute, of course).

```

***

- **Date:** Mon, 18 Feb 2019 00:20:47 -0300
- **Commit:** [a581b5f](https://gitlab.com/Odyseus/CinnamonTools/commit/a581b5f)
- **Author:** Odyseus

```
- Better handling of the `tooltip` attribute. Now a standard item and an alternate item can each have their own tooltips.
- Made user defined attributes parsing case insensitive. This makes line definitions less strict.

```

***

- **Date:** Sun, 17 Feb 2019 02:12:37 -0300
- **Commit:** [8f2938b](https://gitlab.com/Odyseus/CinnamonTools/commit/8f2938b)
- **Author:** Odyseus

```
- Fixed commands execution when terminal is set to false.
- Added the possibility to insert separators inside sub-menus.
- Redesigned applet tooltip for better readability by using a grid.
- Added debug mode for troubleshooting.
- Removing some try{}catch{} blocks. When debug mode is enabled all methods are called with a try{}catch{} block.
- Implemented the use of GLib.get_monotonic_time() to measure execution times more precisely.
- Improved lines parsing by using default parameters. This avoids constantly checking for the existence of an option.
- Cleaned call to log function that was left over.

```

***

- **Date:** Mon, 21 Jan 2019 21:48:00 -0300
- **Commit:** [2d5dfec](https://gitlab.com/Odyseus/CinnamonTools/commit/2d5dfec)
- **Author:** Odyseus

```
- Updated emoji library.
- Changed applet icon.

```

***

- **Date:** Thu, 17 Jan 2019 14:00:29 -0300
- **Commit:** [c910029](https://gitlab.com/Odyseus/CinnamonTools/commit/c910029)
- **Author:** Odyseus

```
- Python files improvements:
    - Simplified localization system.
    - Homogenized/Cleaned up code.

```

***

- **Date:** Tue, 15 Jan 2019 22:38:48 -0300
- **Commit:** [3a99b80](https://gitlab.com/Odyseus/CinnamonTools/commit/3a99b80)
- **Author:** Odyseus

```
- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

```

***

- **Date:** Mon, 24 Dec 2018 21:58:49 -0300
- **Commit:** [60aefee](https://gitlab.com/Odyseus/CinnamonTools/commit/60aefee)
- **Author:** Odyseus

```
- Now it is possible to specify the shell used to execute commands instead of having Bash hard-coded. A shell can be globally configured in an applet instance or specified individually for each menu item through the `shell` attribute. The argument used by a shell program that allows to execute a command is also exposed through an applet setting and can also be specified with the `shellArgument` attribute.
- Exposed as an option the argument used by a terminal program that allows to execute a command inside a terminal window. Workaround due to retarded terminals that keep being dumbed down to the point of uselessness.
- Removed retro compatible code that was left over when removing compatibility with Cinnamon versions older than 3.0.x.
- Implemented a getBoolean function to simplify conditions.

```

***

- **Date:** Tue, 7 Aug 2018 03:36:48 -0300
- **Commit:** [c114f50](https://gitlab.com/Odyseus/CinnamonTools/commit/c114f50)
- **Author:** Odyseus

```
- Removed from the example files references to the ~/.cinnamon/glass.log file. This file doesn't exist anymore since Cinnamon version 3.6.x.

```

***

- **Date:** Tue, 7 Aug 2018 03:03:20 -0300
- **Commit:** [8a25f65](https://gitlab.com/Odyseus/CinnamonTools/commit/8a25f65)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.
- Moved the **Emojis** variable into its own JavaScript module.

```

***

- **Date:** Sat, 4 Aug 2018 05:16:23 -0300
- **Commit:** [cb6dd7e](https://gitlab.com/Odyseus/CinnamonTools/commit/cb6dd7e)
- **Author:** Odyseus

```
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.
- Simplification of the procedure to set the applet icon.
- Removed support for Cinnamon versions older than 3.0.x.

```

***

- **Date:** Wed, 13 Jun 2018 00:59:17 -0300
- **Commit:** [5618e00](https://gitlab.com/Odyseus/CinnamonTools/commit/5618e00)
- **Author:** Odyseus

```
- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

```

***

- **Date:** Mon, 7 May 2018 04:54:07 -0300
- **Commit:** [4d36d68](https://gitlab.com/Odyseus/CinnamonTools/commit/4d36d68)
- **Author:** Odyseus

```
- Implemented key bindings common naming.

```

***
