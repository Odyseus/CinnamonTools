## Window list (Fork By Odyseus) changelog

**This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools).**

***

**Date:** Mon, 10 Feb 2020 23:08:51 -0300<br/>
**Commit:** [42738eb](https://gitlab.com/Odyseus/CinnamonTools/commit/42738eb)<br/>
**Author:** Odyseus<br/>

- Removed leftover code of xlets initialization using a Cinnamon feature that thankfully wasn't implemented.
- Implemented the use of the `xdgOpen` function from the `globalUtils.js` javaScript module.

***

**Date:** Mon, 27 Jan 2020 20:22:57 -0300<br/>
**Commit:** [a189739](https://gitlab.com/Odyseus/CinnamonTools/commit/a189739)<br/>
**Author:** Odyseus<br/>

- Rebased from upstream to take advantage of bug fixes and improvements and to make the applet compatible with all Cinnamon versions in existence.
- Changed default settings to suit my needs.
- Removed the need to restart Cinnamon when hiding/showing the buttons labels.

***

**Date:** Fri, 21 Jun 2019 23:06:14 -0300<br/>
**Commit:** [877291f](https://gitlab.com/Odyseus/CinnamonTools/commit/877291f)<br/>
**Author:** Odyseus<br/>

- Corrected typo in settings-schema.json file.

***

**Date:** Wed, 5 Jun 2019 19:57:00 -0300<br/>
**Commit:** [d6c6f9e](https://gitlab.com/Odyseus/CinnamonTools/commit/d6c6f9e)<br/>
**Author:** Odyseus<br/>

- Fix skip_taskbar call on meta window. Upstream fix.
- *Strictified* conditions.

***

**Date:** Thu, 30 May 2019 03:48:50 -0300<br/>
**Commit:** [4441640](https://gitlab.com/Odyseus/CinnamonTools/commit/4441640)<br/>
**Author:** Odyseus<br/>

- Minor changes due to changes in global modules.

***

**Date:** Thu, 23 May 2019 02:17:09 -0300<br/>
**Commit:** [f703c1a](https://gitlab.com/Odyseus/CinnamonTools/commit/f703c1a)<br/>
**Author:** Odyseus<br/>

- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Implemented debugger.

***

**Date:** Fri, 26 Apr 2019 02:51:04 -0300<br/>
**Commit:** [ad6f29a](https://gitlab.com/Odyseus/CinnamonTools/commit/ad6f29a)<br/>
**Author:** Odyseus<br/>

- Fixed windows thumbnails not showing up due to upstream fix that caused more problems than solutions.

***

**Date:** Tue, 5 Mar 2019 03:16:33 -0300<br/>
**Commit:** [beeb461](https://gitlab.com/Odyseus/CinnamonTools/commit/beeb461)<br/>
**Author:** Odyseus<br/>

- Back-ported fixes and features from upstream.
    - Correct handling of icon sizes.
    - Added option to disable window minimization on left click. ¬¬
    - Fixed icons not appearing for some applications.
    - Ensure minimized window button menus update on monitor change.

***

**Date:** Thu, 28 Feb 2019 20:06:55 -0300<br/>
**Commit:** [0ddf56b](https://gitlab.com/Odyseus/CinnamonTools/commit/0ddf56b)<br/>
**Author:** Odyseus<br/>

- Updated CONTRIBUTORS.md file to properly give credit.

***

**Date:** Thu, 21 Feb 2019 10:33:10 -0300<br/>
**Commit:** [0f5d82f](https://gitlab.com/Odyseus/CinnamonTools/commit/0f5d82f)<br/>
**Author:** Odyseus<br/>

- Added call to finalize settings when applet is removed from panel.

***

**Date:** Tue, 15 Jan 2019 22:35:43 -0300<br/>
**Commit:** [f09fd6f](https://gitlab.com/Odyseus/CinnamonTools/commit/f09fd6f)<br/>
**Author:** Odyseus<br/>

- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

***

**Date:** Fri, 21 Dec 2018 13:07:21 -0300<br/>
**Commit:** [ae83195](https://gitlab.com/Odyseus/CinnamonTools/commit/ae83195)<br/>
**Author:** Odyseus<br/>

- Removed usage of Applet._scaleMode calls due to its deprecation and to avoid a myriad of warnings. ¬¬

***

**Date:** Mon, 29 Oct 2018 13:43:27 -0300<br/>
**Commit:** [a50966d](https://gitlab.com/Odyseus/CinnamonTools/commit/a50966d)<br/>
**Author:** Odyseus<br/>

- Some upstream fixes.

***

**Date:** Tue, 7 Aug 2018 03:13:17 -0300<br/>
**Commit:** [c868f1f](https://gitlab.com/Odyseus/CinnamonTools/commit/c868f1f)<br/>
**Author:** Odyseus<br/>

- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

***

**Date:** Sat, 4 Aug 2018 05:13:28 -0300<br/>
**Commit:** [dee7ff0](https://gitlab.com/Odyseus/CinnamonTools/commit/dee7ff0)<br/>
**Author:** Odyseus<br/>

- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.

***

**Date:** Wed, 13 Jun 2018 01:05:52 -0300<br/>
**Commit:** [c880ee1](https://gitlab.com/Odyseus/CinnamonTools/commit/c880ee1)<br/>
**Author:** Odyseus<br/>

- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

***
