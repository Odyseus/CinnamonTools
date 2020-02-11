## Desktop Effects Applier changelog

**This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools).**

***

- **Date:** Mon, 10 Feb 2020 23:01:49 -0300
- **Commit:** [c3e81ea](https://gitlab.com/Odyseus/CinnamonTools/commit/c3e81ea)
- **Author:** Odyseus

```
- Adaptations due to changes to the custom settings framework.
- Adaptations due to changes to the `debugManager.js` JavaScript module.

```

***

- **Date:** Tue, 28 Jan 2020 01:24:52 -0300
- **Commit:** [89b9ed3](https://gitlab.com/Odyseus/CinnamonTools/commit/89b9ed3)
- **Author:** Odyseus

```
Brought up to date with the rest of xlets.

- Implementation of JavaScript global modules.
- Removed unused icons.
- Updated metadata.json files due to changes to their handling.
- Replaced the use of the cgi.escape method (due to its deprecation) in the settings application for the html.escape method.
- Fixed non functional keybinding effects when there are more than one of the same type defined. This lead to having effects with the same internal IDs.

```

***

- **Date:** Sat, 27 Apr 2019 15:03:02 -0300
- **Commit:** [93e2b71](https://gitlab.com/Odyseus/CinnamonTools/commit/93e2b71)
- **Author:** Odyseus

```
- Some grammar corrections.

```

***

- **Date:** Thu, 25 Apr 2019 02:04:13 -0300
- **Commit:** [a60ae21](https://gitlab.com/Odyseus/CinnamonTools/commit/a60ae21)
- **Author:** Odyseus

```
- Corrected all the shader files. It seems that the shader language is susceptible to certain combination of software versions and/or hardware.
- Removed the redundant declaration of the XletMeta variable in extension.js.
- Moved the addition of the Help button for the desktop notification when the notification is created, not updated.

```

***

- **Date:** Tue, 16 Apr 2019 14:12:23 -0300
- **Commit:** [fac2ce7](https://gitlab.com/Odyseus/CinnamonTools/commit/fac2ce7)
- **Author:** Odyseus

```
Initial commit. An extension that allows to apply effects to windows or the screen. It has the ability to apply effects as simple as brightness, desaturation, contrast and colors and as complex as OpenGL shaders.

TODO:

- Complete Spanish localization.
- Complete help page.
- Complete contributors section.
- Implement a wizard-like mechanism to apply effects. This extension works exclusively with keyboard shortcuts and can be configured with hundreds of effects. No one (including me) will ever bother to configure and remember hundreds of keyboard shortcuts!

```

***
