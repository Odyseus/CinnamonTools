<br/>
<br/>
***

**Date:** Mon, 10 Feb 2020 23:56:56 -0300<br/>
**Commit:** [4d1f03e](https://gitlab.com/Odyseus/CinnamonTools/commit/4d1f03e)<br/>
**Author:** Odyseus<br/>

- Removed leftover code of xlets initialization using a Cinnamon feature that thankfully wasn't implemented.
- Implemented the use of the `xdgOpen` function from the `globalUtils.js` JavaScript module.

***

**Date:** Fri, 21 Jun 2019 23:02:09 -0300<br/>
**Commit:** [984a0d6](https://gitlab.com/Odyseus/CinnamonTools/commit/984a0d6)<br/>
**Author:** Odyseus<br/>

- Corrected typo in settings-schema.json file.

***

**Date:** Thu, 30 May 2019 03:47:16 -0300<br/>
**Commit:** [7346c65](https://gitlab.com/Odyseus/CinnamonTools/commit/7346c65)<br/>
**Author:** Odyseus<br/>

- Minor changes due to changes in global modules.

***

**Date:** Thu, 23 May 2019 02:15:46 -0300<br/>
**Commit:** [20a83f2](https://gitlab.com/Odyseus/CinnamonTools/commit/20a83f2)<br/>
**Author:** Odyseus<br/>

- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Implemented debugger.
- Added an ID to the custom confirmation dialog to avoid conflictive styling with other xlets.

***

**Date:** Tue, 15 Jan 2019 22:37:49 -0300<br/>
**Commit:** [7525419](https://gitlab.com/Odyseus/CinnamonTools/commit/7525419)<br/>
**Author:** Odyseus<br/>

- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

***

**Date:** Tue, 7 Aug 2018 03:06:49 -0300<br/>
**Commit:** [b3398ba](https://gitlab.com/Odyseus/CinnamonTools/commit/b3398ba)<br/>
**Author:** Odyseus<br/>

- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

***

**Date:** Sat, 4 Aug 2018 05:15:41 -0300<br/>
**Commit:** [0b0574c](https://gitlab.com/Odyseus/CinnamonTools/commit/0b0574c)<br/>
**Author:** Odyseus<br/>

- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.
- Removed support for Cinnamon versions older than 3.0.x.
- Minor code cleanup.

***

**Date:** Wed, 13 Jun 2018 01:00:54 -0300<br/>
**Commit:** [5c56c7a](https://gitlab.com/Odyseus/CinnamonTools/commit/5c56c7a)<br/>
**Author:** Odyseus<br/>

- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

***
