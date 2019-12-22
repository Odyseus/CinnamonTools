## Panel Drawer (Fork By Odyseus) changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Tue, 16 Jul 2019 00:51:35 -0300
- **Commit:** [831d2bd](https://gitlab.com/Odyseus/CinnamonTools/commit/831d2bd)
- **Author:** Odyseus

```
- Added a property to applets handled by this applet to allow handled applets to enable a basic integration with the panel drawer.

```

***

- **Date:** Fri, 21 Jun 2019 23:03:47 -0300
- **Commit:** [5429260](https://gitlab.com/Odyseus/CinnamonTools/commit/5429260)
- **Author:** Odyseus

```
Applet rewrite
--------------

WARNING: This update is a complete rewrite of the applet and it will reset the settings of an existent instance to their default values. Read the help page for this applet for detailed usage.

- Added vertical panels support.
- Added multi-instance support. Now it is possible to add an instance of this applet to each existent panel (vertical or horizontal).
- Added all items of a panel context menu into this applet context menu.
- Simplified and cleaned the code.
- Removed workarounds to handle system tray applets. These workarounds were doing *more damage than good*. DO NOT USE THIS APPLET to hide a system try applet (not the Cinnamon's default nor any other). Simply use a collapsible system tray applet.

```

***

- **Date:** Thu, 30 May 2019 03:47:50 -0300
- **Commit:** [090e1a9](https://gitlab.com/Odyseus/CinnamonTools/commit/090e1a9)
- **Author:** Odyseus

```
- Minor changes due to changes in global modules.

```

***

- **Date:** Thu, 23 May 2019 02:16:11 -0300
- **Commit:** [718c1dd](https://gitlab.com/Odyseus/CinnamonTools/commit/718c1dd)
- **Author:** Odyseus

```
- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Implemented debugger.

```

***

- **Date:** Thu, 21 Feb 2019 10:33:38 -0300
- **Commit:** [3155c00](https://gitlab.com/Odyseus/CinnamonTools/commit/3155c00)
- **Author:** Odyseus

```
- Added call to finalize settings when applet is removed from panel.

```

***

- **Date:** Mon, 21 Jan 2019 21:54:37 -0300
- **Commit:** [cea22b7](https://gitlab.com/Odyseus/CinnamonTools/commit/cea22b7)
- **Author:** Odyseus

```
- Changed applet icon.

```

***

- **Date:** Tue, 15 Jan 2019 22:37:00 -0300
- **Commit:** [bdac179](https://gitlab.com/Odyseus/CinnamonTools/commit/bdac179)
- **Author:** Odyseus

```
- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

```

***

- **Date:** Tue, 7 Aug 2018 03:09:23 -0300
- **Commit:** [198c667](https://gitlab.com/Odyseus/CinnamonTools/commit/198c667)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

```

***

- **Date:** Sat, 4 Aug 2018 05:14:49 -0300
- **Commit:** [71e8143](https://gitlab.com/Odyseus/CinnamonTools/commit/71e8143)
- **Author:** Odyseus

```
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.

```

***

- **Date:** Wed, 13 Jun 2018 01:03:24 -0300
- **Commit:** [e7da167](https://gitlab.com/Odyseus/CinnamonTools/commit/e7da167)
- **Author:** Odyseus

```
- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.
- Fixed some warnings shown on Cinnamon 3.8.x.

```

***

- **Date:** Wed, 2 May 2018 00:17:26 -0300
- **Commit:** [de934e4](https://gitlab.com/Odyseus/CinnamonTools/commit/de934e4)
- **Author:** Odyseus

```
- Move context menu items insertion into a function and call that function outside `Mainloop.idle_add` call.
- Minor clean up.

```

***
