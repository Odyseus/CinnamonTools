## Drawer (show/hide applets) (Fork By Odyseus) changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

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
