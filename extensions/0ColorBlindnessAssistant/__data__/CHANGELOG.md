## Color Blindness Assistant changelog

**This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools).**

***

**Date:** Wed, 12 Feb 2020 22:46:58 -0300<br/>
**Commit:** [2030699](https://gitlab.com/Odyseus/CinnamonTools/commit/2030699)<br/>
**Author:** Odyseus<br/>

- Adaptations due to changes to the custom settings framework.

***

**Date:** Mon, 10 Feb 2020 23:05:01 -0300<br/>
**Commit:** [11964fd](https://gitlab.com/Odyseus/CinnamonTools/commit/11964fd)<br/>
**Author:** Odyseus<br/>

- Adaptations due to changes to the custom settings framework.
- Adaptations due to changes to the `debugManager.js` JavaScript module.

***

**Date:** Mon, 27 Jan 2020 20:26:56 -0300<br/>
**Commit:** [5053983](https://gitlab.com/Odyseus/CinnamonTools/commit/5053983)<br/>
**Author:** Odyseus<br/>

Countermeasures for using an external settings application
----------------------------------------------------------

- Removed condition used to selectively generate a .desktop file to open the extension's settings window. Now the .desktop file will be created in all Cinnamon version the extension is installed.

***

**Date:** Fri, 21 Jun 2019 23:07:12 -0300<br/>
**Commit:** [d7cbc4e](https://gitlab.com/Odyseus/CinnamonTools/commit/d7cbc4e)<br/>
**Author:** Odyseus<br/>

- Minor changes to the settings application due to changes in the custom settings framework.

***

**Date:** Wed, 5 Jun 2019 19:55:27 -0300<br/>
**Commit:** [754078e](https://gitlab.com/Odyseus/CinnamonTools/commit/754078e)<br/>
**Author:** Odyseus<br/>

- Minor changes due to changes in global modules.

***

**Date:** Thu, 30 May 2019 03:49:46 -0300<br/>
**Commit:** [2c57b3b](https://gitlab.com/Odyseus/CinnamonTools/commit/2c57b3b)<br/>
**Author:** Odyseus<br/>

- Minor changes due to changes in global modules.
- Python scripts: Changed the use of cgi.escape to html.escape due to cgi.escape deprecation.

***

**Date:** Fri, 24 May 2019 16:19:26 -0300<br/>
**Commit:** [a302240](https://gitlab.com/Odyseus/CinnamonTools/commit/a302240)<br/>
**Author:** Odyseus<br/>

- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Improved debugger.
- Removed manual mechanism to generate .desktop files to access the extension settings window. Now the .desktop file generation is automatic and will be created only on Cinnamon versions that requires it.

***

**Date:** Sat, 18 May 2019 22:27:24 -0300<br/>
**Commit:** [25640a0](https://gitlab.com/Odyseus/CinnamonTools/commit/25640a0)<br/>
**Author:** Odyseus<br/>

- Homogenization of imports names.

***

**Date:** Thu, 9 May 2019 05:28:14 -0300<br/>
**Commit:** [f65a2e0](https://gitlab.com/Odyseus/CinnamonTools/commit/f65a2e0)<br/>
**Author:** Odyseus<br/>

- Removed unnecessary icons.
- Corrected infinite loop caused by the use of an absolutely retarded language.
- Restructured theme loading mechanism.

***

**Date:** Sat, 27 Apr 2019 15:02:34 -0300<br/>
**Commit:** [e52ab8d](https://gitlab.com/Odyseus/CinnamonTools/commit/e52ab8d)<br/>
**Author:** Odyseus<br/>

- Some grammar corrections.

***

**Date:** Fri, 26 Apr 2019 14:05:46 -0300<br/>
**Commit:** [d8a4c21](https://gitlab.com/Odyseus/CinnamonTools/commit/d8a4c21)<br/>
**Author:** Odyseus<br/>

- Added inheritance of windows effects into their clones.
- Renamed all occurrences of "acromatopsia" to "acromatopia". Since I'm naming all the other pathologies with their synonyms ending with "pia", lets keep it homogeneous.
- Changed the way an effect is stored "inside" an actor. Instead of storing the effect ID as a string, store the effect definition as an object. This allows me to have direct access to the effect definition without constantly having to reconstruct the definition from the effect ID and vice versa.

***

**Date:** Thu, 25 Apr 2019 02:06:00 -0300<br/>
**Commit:** [d60d6ed](https://gitlab.com/Odyseus/CinnamonTools/commit/d60d6ed)<br/>
**Author:** Odyseus<br/>

- Implemented *wizard* to apply effects on-the-fly (I call it daltonizer). Now one can assign just one keyboard shortcut to invoke the *wizard* to be able to apply any effect to a focused window or the screen.
- Redesigned the color inspector. I used the same technique that I used in the daltonizer *wizard* that allows me to use animations when the color inspector banner is moved about the screen.
- Moved the Name that color library and the color inspector into their own files.
- Corrected the shader file after performing tests inside a virtual machine. It seems that the shader language is susceptible to certain combination of software versions and/or hardware.
- Reorganized the settings window.
- Added option to configure the animation time of the color inspector banner.
- Added notification that informs when the color information retrieved by the color inspector is copied to the clipboard.
- Corrected some import errors that prevented the effects to be applied.
- Implemented themes for the daltonizer and color inspector GUIs. The default theme is *theme agnostic*. This means that the currently in use Cinnamon theme is used to apply some basic styling. The rest of the style sheet used by this extension just changes font styling and elements sizes.

***

**Date:** Tue, 16 Apr 2019 14:19:55 -0300<br/>
**Commit:** [56e7d49](https://gitlab.com/Odyseus/CinnamonTools/commit/56e7d49)<br/>
**Author:** Odyseus<br/>

Initial commit. An extension whose main purpose is to serve as an assistant to users with color vision deficiency (CVD). It provides compensation effects (it allows users with CVD to better differentiate colors that they can't see), simulation effects (it allows developers to see how users with CVD see certain combination of colors and ascertain if a color palette is *CVD friendly*) and a *color naming tool* that allows to get the name of a color on the screen.


TODO:

- Complete Spanish localization.
- Complete help page.
- Complete contributors section.
- Implement a wizard-like mechanism to apply effects.

***
