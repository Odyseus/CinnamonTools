## Color Blindness Assistant changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Fri, 24 May 2019 16:19:26 -0300
- **Commit:** [a302240](https://gitlab.com/Odyseus/CinnamonTools/commit/a302240)
- **Author:** Odyseus

```
- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Improved debugger.
- Removed manual mechanism to generate .desktop files to access the extension settings window. Now the .desktop file generation is automatic and will be created only on Cinnamon versions that requires it.

```

***

- **Date:** Sat, 18 May 2019 22:27:24 -0300
- **Commit:** [25640a0](https://gitlab.com/Odyseus/CinnamonTools/commit/25640a0)
- **Author:** Odyseus

```
- Homogenization of imports names.

```

***

- **Date:** Thu, 9 May 2019 05:28:14 -0300
- **Commit:** [f65a2e0](https://gitlab.com/Odyseus/CinnamonTools/commit/f65a2e0)
- **Author:** Odyseus

```
- Removed unnecessary icons.
- Corrected infinite loop caused by the use of an absolutely retarded language.
- Restructured theme loading mechanism.

```

***

- **Date:** Sat, 27 Apr 2019 15:02:34 -0300
- **Commit:** [e52ab8d](https://gitlab.com/Odyseus/CinnamonTools/commit/e52ab8d)
- **Author:** Odyseus

```
- Some grammar corrections.

```

***

- **Date:** Fri, 26 Apr 2019 14:05:46 -0300
- **Commit:** [d8a4c21](https://gitlab.com/Odyseus/CinnamonTools/commit/d8a4c21)
- **Author:** Odyseus

```
- Added inheritance of windows effects into their clones.
- Renamed all occurrences of "acromatopsia" to "acromatopia". Since I'm naming all the other pathologies with their synonyms ending with "pia", lets keep it homogeneous.
- Changed the way an effect is stored "inside" an actor. Instead of storing the effect ID as a string, store the effect definition as an object. This allows me to have direct access to the effect definition without constantly having to reconstruct the definition from the effect ID and vice versa.

```

***

- **Date:** Thu, 25 Apr 2019 02:06:00 -0300
- **Commit:** [d60d6ed](https://gitlab.com/Odyseus/CinnamonTools/commit/d60d6ed)
- **Author:** Odyseus

```
- Implemented *wizard* to apply effects on-the-fly (I call it daltonizer). Now one can assign just one keyboard shortcut to invoke the *wizard* to be able to apply any effect to a focused window or the screen.
- Redesigned the color inspector. I used the same technique that I used in the daltonizer *wizard* that allows me to use animations when the color inspector banner is moved about the screen.
- Moved the Name that color library and the color inspector into their own files.
- Corrected the shader file after performing tests inside a virtual machine. It seems that the shader language is susceptible to certain combination of software versions and/or hardware.
- Reorganized the settings window.
- Added option to configure the animation time of the color inspector banner.
- Added notification that informs when the color information retrieved by the color inspector is copied to the clipboard.
- Corrected some import errors that prevented the effects to be applied.
- Implemented themes for the daltonizer and color inspector GUIs. The default theme is *theme agnostic*. This means that the currently in use Cinnamon theme is used to apply some basic styling. The rest of the style sheet used by this extension just changes font styling and elements sizes.

```

***

- **Date:** Tue, 16 Apr 2019 14:19:55 -0300
- **Commit:** [56e7d49](https://gitlab.com/Odyseus/CinnamonTools/commit/56e7d49)
- **Author:** Odyseus

```
Initial commit. An extension whose main purpose is to serve as an assistant to users with color vision deficiency (CVD). It provides compensation effects (it allows users with CVD to better differentiate colors that they can't see), simulation effects (it allows developers to see how users with CVD see certain combination of colors and ascertain if a color palette is *CVD friendly*) and a *color naming tool* that allows to get the name of a color on the screen.


TODO:

- Complete Spanish localization.
- Complete help page.
- Complete contributors section.
- Implement a wizard-like mechanism to apply effects.

```

***
