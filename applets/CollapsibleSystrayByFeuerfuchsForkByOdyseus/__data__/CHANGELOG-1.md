<br/>
<br/>
***

**Date:** Mon, 10 Feb 2020 23:58:00 -0300<br/>
**Commit:** [b7bcae9](https://gitlab.com/Odyseus/CinnamonTools/commit/b7bcae9)<br/>
**Author:** Odyseus<br/>

- Removed leftover code of xlets initialization using a Cinnamon feature that thankfully wasn't implemented.

***

**Date:** Tue, 21 Jan 2020 16:54:29 -0300<br/>
**Commit:** [9957231](https://gitlab.com/Odyseus/CinnamonTools/commit/9957231)<br/>
**Author:** Odyseus<br/>

- Limited compatibility up to Cinnamon 4.0.x.

***

**Date:** Sat, 18 Jan 2020 08:58:00 -0300<br/>
**Commit:** [994c314](https://gitlab.com/Odyseus/CinnamonTools/commit/994c314)<br/>
**Author:** Odyseus<br/>

- Fixed the impossibility to open the applet settings window on CInnamon 4.4.x caused by wrong setting dependency key declared in the settings-schema.json file.

Fixes #5

***

**Date:** Fri, 21 Jun 2019 23:01:49 -0300<br/>
**Commit:** [ae7c885](https://gitlab.com/Odyseus/CinnamonTools/commit/ae7c885)<br/>
**Author:** Odyseus<br/>

- Corrected typo in settings-schema.json file.

***

**Date:** Thu, 30 May 2019 03:46:56 -0300<br/>
**Commit:** [d9d0d7a](https://gitlab.com/Odyseus/CinnamonTools/commit/d9d0d7a)<br/>
**Author:** Odyseus<br/>

- Minor changes due to changes in global modules.

***

**Date:** Thu, 23 May 2019 02:15:07 -0300<br/>
**Commit:** [d092844](https://gitlab.com/Odyseus/CinnamonTools/commit/d092844)<br/>
**Author:** Odyseus<br/>

- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Implemented debugger.

***

**Date:** Tue, 15 Jan 2019 22:38:26 -0300<br/>
**Commit:** [09adeb2](https://gitlab.com/Odyseus/CinnamonTools/commit/09adeb2)<br/>
**Author:** Odyseus<br/>

- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

***

**Date:** Fri, 21 Dec 2018 13:10:06 -0300<br/>
**Commit:** [a509ddd](https://gitlab.com/Odyseus/CinnamonTools/commit/a509ddd)<br/>
**Author:** Odyseus<br/>

- Fixed crash caused by an unbelievable retarded behavior.

***

**Date:** Thu, 20 Dec 2018 18:18:17 -0300<br/>
**Commit:** [c44799e](https://gitlab.com/Odyseus/CinnamonTools/commit/c44799e)<br/>
**Author:** Odyseus<br/>

- Removed _panelHeight property declaration from applet initialization. This caused an error that prevented the applet from loading on Cinnamon 4.0.x since in this version of Cinnamon that property is a getter without a setter.
- Removed usage of Applet._scaleMode calls due to its deprecation and to avoid a myriad of warnings. ¬¬

***

**Date:** Wed, 19 Sep 2018 12:34:31 -0300<br/>
**Commit:** [f7913e1](https://gitlab.com/Odyseus/CinnamonTools/commit/f7913e1)<br/>
**Author:** Odyseus<br/>

- Avoid passing xlet context to SignalManager due to changes on Cinnamon's core.

***

**Date:** Tue, 7 Aug 2018 03:06:00 -0300<br/>
**Commit:** [742ed1c](https://gitlab.com/Odyseus/CinnamonTools/commit/742ed1c)<br/>
**Author:** Odyseus<br/>

- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.
- Added upstream fix for Skype tray icon.
- *Strictified* comparisons.
- Some minor cleanup.

***

**Date:** Sat, 4 Aug 2018 05:15:56 -0300<br/>
**Commit:** [5aa79f8](https://gitlab.com/Odyseus/CinnamonTools/commit/5aa79f8)<br/>
**Author:** Odyseus<br/>

- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.

***

**Date:** Wed, 13 Jun 2018 00:59:44 -0300<br/>
**Commit:** [43f937a](https://gitlab.com/Odyseus/CinnamonTools/commit/43f937a)<br/>
**Author:** Odyseus<br/>

- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

***

**Date:** Tue, 1 May 2018 21:31:53 -0300<br/>
**Commit:** [77c7ef5](https://gitlab.com/Odyseus/CinnamonTools/commit/77c7ef5)<br/>
**Author:** Odyseus<br/>

- Fixed the following warnings:

    > Cjs-Message: JS WARNING: Too many arguments to method Clutter.Container.add_actor: expected 1, got 2

    I changed `add_actor` to simply `add`.

    > Cjs-Message: JS WARNING: reference to undefined property "_direction"

    The `_direction` property was defined on initialization of the applet AFTER it was used for the first time. Fixing this uncovered more undefined properties. All fixed.

- Moved applet settings initialization into a function and moved the call to the function at the beginning of the initialization code of the applet.
- Changed a couple of properties into constants.
- Added metadata to the applet's initialization arguments.
- Some minor clean up.

***
