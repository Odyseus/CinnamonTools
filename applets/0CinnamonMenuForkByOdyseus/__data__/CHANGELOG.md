## Cinnamon Menu (Fork By Odyseus) changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Tue, 7 Aug 2018 03:05:01 -0300
- **Commit:** [5b1e2ce](https://gitlab.com/Odyseus/CinnamonTools/commit/5b1e2ce)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.
- Removed leftovers from previous cleanup.

```

***

- **Date:** Sat, 4 Aug 2018 05:16:10 -0300
- **Commit:** [b1bac59](https://gitlab.com/Odyseus/CinnamonTools/commit/b1bac59)
- **Author:** Odyseus

```
- Simplification of the procedure to set the applet icon.
- Changed the **Custom text editor** setting from a **filechooser** to an **entry** (filechoosers on newer Cinnamon versions are garbage).

```

***

- **Date:** Mon, 23 Jul 2018 14:15:35 -0300
- **Commit:** [377907b](https://gitlab.com/Odyseus/CinnamonTools/commit/377907b)
- **Author:** Odyseus

```
- Fixed context menu handlers inside **Recent applications** menu. Now they are correctly closed when other context menus are opened.
- Fixed stuck search results when clearing the search box content. I K.I.S.S.(ed) it. I just call _onOpenStateChanged and move on. ¬¬
- Cleaned some leftover comments.
- Removed unnecessary try{}catch{} block.
- Completely eradicated **Recent files** category.
- Completely eradicated **Places** category.
- Completely eradicated search providers.
- Completely eradicated search in file system.
- Completely eradicated the use of `Lang.bind()` in favor of using arrow functions.
- "Strictified" some comparisons. There were mostly comparisons to **null**, to integers/strings and between actors. The comparisons to **undefined** were eradicated along with all the garbage that I cleared.

```

***

- **Date:** Wed, 13 Jun 2018 00:59:33 -0300
- **Commit:** [a058017](https://gitlab.com/Odyseus/CinnamonTools/commit/a058017)
- **Author:** Odyseus

```
- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

```

***

- **Date:** Mon, 11 Jun 2018 23:57:27 -0300
- **Commit:** [451a97a](https://gitlab.com/Odyseus/CinnamonTools/commit/451a97a)
- **Author:** Odyseus

```
- gksu deprecation mitigation:
    - Changed the *pref_privilege_elevator* setting type from **combobox** to **entry** to be able to set a custom privilege elevator command. Changed its default value from gksu to pkexec.
    - Added a launcher.py helper script to execute programs from the menu as root. This is a workaround that allows to use pkexec, since I wasn't able to directly execute pkexec from any of the available spawn* JavaScript functions. ¬¬
- Renamed the main applet prototype to reflect the applet's name and not the development version of the applet's name.
- Cleaned some comments/commented lines.
- Moved some calls to the close menu function at the beginning of code blocks to avoid *problems* with opened dialogs when activating items.

```

***

- **Date:** Mon, 14 May 2018 07:10:49 -0300
- **Commit:** [bfed61f](https://gitlab.com/Odyseus/CinnamonTools/commit/bfed61f)
- **Author:** Odyseus

```
- Fixed duplication of Recent Applications category.

```

***

- **Date:** Mon, 7 May 2018 04:53:53 -0300
- **Commit:** [d4b4ade](https://gitlab.com/Odyseus/CinnamonTools/commit/d4b4ade)
- **Author:** Odyseus

```
- Implemented key bindings common naming.

```

***
