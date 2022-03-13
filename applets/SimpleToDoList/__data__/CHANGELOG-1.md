<br/>
<br/>
***

**Date:** Mon, 10 Feb 2020 23:20:27 -0300<br/>
**Commit:** [3c56847](https://gitlab.com/Odyseus/CinnamonTools/commit/3c56847)<br/>
**Author:** Odyseus<br/>

- Removed leftover code of xlets initialization using a Cinnamon feature that thankfully wasn't implemented.
- Adaptations due to changes to global JavaScript modules.

***

**Date:** Fri, 21 Jun 2019 23:04:23 -0300<br/>
**Commit:** [262a933](https://gitlab.com/Odyseus/CinnamonTools/commit/262a933)<br/>
**Author:** Odyseus<br/>

- Corrected typo in settings-schema.json file.

***

**Date:** Thu, 30 May 2019 03:48:15 -0300<br/>
**Commit:** [306c938](https://gitlab.com/Odyseus/CinnamonTools/commit/306c938)<br/>
**Author:** Odyseus<br/>

- Minor changes due to changes in global modules.

***

**Date:** Thu, 23 May 2019 02:16:29 -0300<br/>
**Commit:** [5cbcc12](https://gitlab.com/Odyseus/CinnamonTools/commit/5cbcc12)<br/>
**Author:** Odyseus<br/>

- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Improved debugger.

***

**Date:** Thu, 9 May 2019 05:20:31 -0300<br/>
**Commit:** [e7bca0b](https://gitlab.com/Odyseus/CinnamonTools/commit/e7bca0b)<br/>
**Author:** Odyseus<br/>

- Prefer the icons provided by the currently used theme instead of the custom icons shipped with the xlet.

***

**Date:** Thu, 17 Jan 2019 14:16:29 -0300<br/>
**Commit:** [6da6e7e](https://gitlab.com/Odyseus/CinnamonTools/commit/6da6e7e)<br/>
**Author:** Odyseus<br/>

- Python files improvements:
    - Simplified localization system.
    - Homogenized/Cleaned up code.

***

**Date:** Tue, 15 Jan 2019 22:36:36 -0300<br/>
**Commit:** [a4afb66](https://gitlab.com/Odyseus/CinnamonTools/commit/a4afb66)<br/>
**Author:** Odyseus<br/>

- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

***

**Date:** Thu, 23 Aug 2018 02:43:14 -0300<br/>
**Commit:** [349a399](https://gitlab.com/Odyseus/CinnamonTools/commit/349a399)<br/>
**Author:** Odyseus<br/>

- Implemented a more transparent way of calling `Gio.File.load_contents_finish`.
- Added some hover feedback to the buttons (delete task/section, etc.) inside the main menu.

***

**Date:** Tue, 7 Aug 2018 03:11:18 -0300<br/>
**Commit:** [02d99a8](https://gitlab.com/Odyseus/CinnamonTools/commit/02d99a8)<br/>
**Author:** Odyseus<br/>

- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

***

**Date:** Sat, 4 Aug 2018 05:14:16 -0300<br/>
**Commit:** [fe56992](https://gitlab.com/Odyseus/CinnamonTools/commit/fe56992)<br/>
**Author:** Odyseus<br/>

- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.
- Simplification of the procedure to set the applet icon.
- Removed support for Cinnamon versions older than 3.0.x.

***

**Date:** Wed, 18 Jul 2018 00:54:18 -0300<br/>
**Commit:** [d29db40](https://gitlab.com/Odyseus/CinnamonTools/commit/d29db40)<br/>
**Author:** Odyseus<br/>

- Switched from using a JavaScript object to store/handle sections to an array. The change is "transparent" (stored tasks from older versions of this applet will be automatically converted).
- Added option to keep the sections inside the menu sorted alphabetically.

***

**Date:** Wed, 13 Jun 2018 01:04:46 -0300<br/>
**Commit:** [f3b918e](https://gitlab.com/Odyseus/CinnamonTools/commit/f3b918e)<br/>
**Author:** Odyseus<br/>

- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

***

**Date:** Mon, 14 May 2018 07:17:55 -0300<br/>
**Commit:** [3f24413](https://gitlab.com/Odyseus/CinnamonTools/commit/3f24413)<br/>
**Author:** Odyseus<br/>

- Implemented a logger *prototype* instead of using a logger function.

***

**Date:** Mon, 7 May 2018 04:53:16 -0300<br/>
**Commit:** [30d3f17](https://gitlab.com/Odyseus/CinnamonTools/commit/30d3f17)<br/>
**Author:** Odyseus<br/>

- Implemented key bindings common naming.

***
