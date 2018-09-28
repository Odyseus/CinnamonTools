## Collapsible Systray (Fork By Odyseus) changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Wed, 19 Sep 2018 12:34:31 -0300
- **Commit:** [f7913e1](https://gitlab.com/Odyseus/CinnamonTools/commit/f7913e1)
- **Author:** Odyseus

```
- Avoid passing xlet context to SignalManager due to changes on Cinnamon's core.

```

***

- **Date:** Tue, 7 Aug 2018 03:06:00 -0300
- **Commit:** [742ed1c](https://gitlab.com/Odyseus/CinnamonTools/commit/742ed1c)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.
- Added upstream fix for Skype tray icon.
- *Strictified* comparisons.
- Some minor cleanup.

```

***

- **Date:** Sat, 4 Aug 2018 05:15:56 -0300
- **Commit:** [5aa79f8](https://gitlab.com/Odyseus/CinnamonTools/commit/5aa79f8)
- **Author:** Odyseus

```
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.

```

***

- **Date:** Wed, 13 Jun 2018 00:59:44 -0300
- **Commit:** [43f937a](https://gitlab.com/Odyseus/CinnamonTools/commit/43f937a)
- **Author:** Odyseus

```
- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

```

***

- **Date:** Tue, 1 May 2018 21:31:53 -0300
- **Commit:** [77c7ef5](https://gitlab.com/Odyseus/CinnamonTools/commit/77c7ef5)
- **Author:** Odyseus

```
- Fixed the following warnings:

    > Cjs-Message: JS WARNING: Too many arguments to method Clutter.Container.add_actor: expected 1, got 2

    I changed `add_actor` to simply `add`.

    > Cjs-Message: JS WARNING: reference to undefined property "_direction"

    The `_direction` property was defined on initialization of the applet AFTER it was used for the first time. Fixing this uncovered more undefined properties. All fixed.

- Moved applet settings initialization into a function and moved the call to the function at the beginning of the initialization code of the applet.
- Changed a couple of properties into constants.
- Added metadata to the applet's initialization arguments.
- Some minor clean up.

```

***
