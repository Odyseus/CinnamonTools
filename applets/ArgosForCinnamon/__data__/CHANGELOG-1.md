<br/>
<br/>
***

**Date:** Tue, 11 Feb 2020 00:00:48 -0300<br/>
**Commit:** [3fa9bdc](https://gitlab.com/Odyseus/CinnamonTools/commit/3fa9bdc)<br/>
**Author:** Odyseus<br/>

- Removed leftover code of xlets initialization using a Cinnamon feature that thankfully wasn't implemented.
- Adaptations due to changes to global JavaScript modules.

***

**Date:** Fri, 21 Jun 2019 23:01:00 -0300<br/>
**Commit:** [9b7e3b1](https://gitlab.com/Odyseus/CinnamonTools/commit/9b7e3b1)<br/>
**Author:** Odyseus<br/>

- Removed workarounds for older versions of Cinnamon (2.8.x and below).
- Added option to only execute the script assigned to an applet when the menu is opened. This is different from the **ARGOS_MENU_OPEN** environment variable set on execution time and that can be used inside the scripts. For the environment variable to be read, the script has to be executed. For the option set on the applet settings, the script is not executed at all unless the menu is opened.
- Added option to avoid ellipsation of the lines displayed on the applet. Applet text of only 3 characters was being ellipsized, which was ultra-annoying.
- Fixed misbehavior of the menu closing while the mouse cursor was placed over an activatable item in the menu and the menu content was updated. This was misbehaving because; when an item inside a menu is hovered, it has focus; when all items in a menu are removed, the menu loses focus; when a menu loses focus, it closes. I simply moved the focus to the menu itself before removing all its items to prevent the menu from closing.
- Moved the rotation interval selector found in the applet context menu outside the Extras sub-menu to keep it more accessible.
- Corrected not being able to set the script name as the applet label.

***

**Date:** Thu, 30 May 2019 03:46:35 -0300<br/>
**Commit:** [ae5e64a](https://gitlab.com/Odyseus/CinnamonTools/commit/ae5e64a)<br/>
**Author:** Odyseus<br/>

- Minor changes due to changes in global modules.

***

**Date:** Thu, 23 May 2019 02:14:46 -0300<br/>
**Commit:** [0806714](https://gitlab.com/Odyseus/CinnamonTools/commit/0806714)<br/>
**Author:** Odyseus<br/>

- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Improved debugger.
- Added SVG icon.

***

**Date:** Tue, 14 May 2019 14:39:50 -0300<br/>
**Commit:** [8630083](https://gitlab.com/Odyseus/CinnamonTools/commit/8630083)<br/>
**Author:** Odyseus<br/>

- Changed the *chained module imports* approach for a *direct module import* approach. This is to avoid errors caused by the garbage that is the implementation of `require()`.
- Better debugging and logging mechanism. Now the debugger is separated from the verbose logging, allowing to see the debugger messages without having to scroll through a million lines of text.

***

**Date:** Thu, 21 Feb 2019 10:35:40 -0300<br/>
**Commit:** [77f404a](https://gitlab.com/Odyseus/CinnamonTools/commit/77f404a)<br/>
**Author:** Odyseus<br/>

- Added call to finalize settings when applet is removed from panel.

***

**Date:** Mon, 18 Feb 2019 01:28:04 -0300<br/>
**Commit:** [491c8b3](https://gitlab.com/Odyseus/CinnamonTools/commit/491c8b3)<br/>
**Author:** Odyseus<br/>

- Made button lines behavior match that of the described by the documentation (*...all button lines get a dropdown menu item...*). In practice, this applet had the same behavior as the extension is based on; button lines would get a dropdown menu only if there were more than one button line. Argos for Cinnamon now will always create a dropdown item for each button line (respecting the `dropdown` attribute, of course).

***

**Date:** Mon, 18 Feb 2019 00:20:47 -0300<br/>
**Commit:** [a581b5f](https://gitlab.com/Odyseus/CinnamonTools/commit/a581b5f)<br/>
**Author:** Odyseus<br/>

- Better handling of the `tooltip` attribute. Now a standard item and an alternate item can each have their own tooltips.
- Made user defined attributes parsing case insensitive. This makes line definitions less strict.

***

**Date:** Sun, 17 Feb 2019 02:12:37 -0300<br/>
**Commit:** [8f2938b](https://gitlab.com/Odyseus/CinnamonTools/commit/8f2938b)<br/>
**Author:** Odyseus<br/>

- Fixed commands execution when terminal is set to false.
- Added the possibility to insert separators inside sub-menus.
- Redesigned applet tooltip for better readability by using a grid.
- Added debug mode for troubleshooting.
- Removing some try{}catch{} blocks. When debug mode is enabled all methods are called with a try{}catch{} block.
- Implemented the use of GLib.get_monotonic_time() to measure execution times more precisely.
- Improved lines parsing by using default parameters. This avoids constantly checking for the existence of an option.
- Cleaned call to log function that was left over.

***

**Date:** Mon, 21 Jan 2019 21:48:00 -0300<br/>
**Commit:** [2d5dfec](https://gitlab.com/Odyseus/CinnamonTools/commit/2d5dfec)<br/>
**Author:** Odyseus<br/>

- Updated emoji library.
- Changed applet icon.

***

**Date:** Thu, 17 Jan 2019 14:00:29 -0300<br/>
**Commit:** [c910029](https://gitlab.com/Odyseus/CinnamonTools/commit/c910029)<br/>
**Author:** Odyseus<br/>

- Python files improvements:
    - Simplified localization system.
    - Homogenized/Cleaned up code.

***

**Date:** Tue, 15 Jan 2019 22:38:48 -0300<br/>
**Commit:** [3a99b80](https://gitlab.com/Odyseus/CinnamonTools/commit/3a99b80)<br/>
**Author:** Odyseus<br/>

- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

***

**Date:** Mon, 24 Dec 2018 21:58:49 -0300<br/>
**Commit:** [60aefee](https://gitlab.com/Odyseus/CinnamonTools/commit/60aefee)<br/>
**Author:** Odyseus<br/>

- Now it is possible to specify the shell used to execute commands instead of having Bash hard-coded. A shell can be globally configured in an applet instance or specified individually for each menu item through the `shell` attribute. The argument used by a shell program that allows to execute a command is also exposed through an applet setting and can also be specified with the `shellArgument` attribute.
- Exposed as an option the argument used by a terminal program that allows to execute a command inside a terminal window. Workaround due to retarded terminals that keep being dumbed down to the point of uselessness.
- Removed retro compatible code that was left over when removing compatibility with Cinnamon versions older than 3.0.x.
- Implemented a getBoolean function to simplify conditions.

***

**Date:** Tue, 7 Aug 2018 03:36:48 -0300<br/>
**Commit:** [c114f50](https://gitlab.com/Odyseus/CinnamonTools/commit/c114f50)<br/>
**Author:** Odyseus<br/>

- Removed from the example files references to the ~/.cinnamon/glass.log file. This file doesn't exist anymore since Cinnamon version 3.6.x.

***

**Date:** Tue, 7 Aug 2018 03:03:20 -0300<br/>
**Commit:** [8a25f65](https://gitlab.com/Odyseus/CinnamonTools/commit/8a25f65)<br/>
**Author:** Odyseus<br/>

- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.
- Moved the **Emojis** variable into its own JavaScript module.

***

**Date:** Sat, 4 Aug 2018 05:16:23 -0300<br/>
**Commit:** [cb6dd7e](https://gitlab.com/Odyseus/CinnamonTools/commit/cb6dd7e)<br/>
**Author:** Odyseus<br/>

- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.
- Simplification of the procedure to set the applet icon.
- Removed support for Cinnamon versions older than 3.0.x.

***

**Date:** Wed, 13 Jun 2018 00:59:17 -0300<br/>
**Commit:** [5618e00](https://gitlab.com/Odyseus/CinnamonTools/commit/5618e00)<br/>
**Author:** Odyseus<br/>

- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

***

**Date:** Mon, 7 May 2018 04:54:07 -0300<br/>
**Commit:** [4d36d68](https://gitlab.com/Odyseus/CinnamonTools/commit/4d36d68)<br/>
**Author:** Odyseus<br/>

- Implemented key bindings common naming.

***
