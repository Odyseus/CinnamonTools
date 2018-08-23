## Wallpaper Changer changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Tue, 7 Aug 2018 03:12:39 -0300
- **Commit:** [780aaf6](https://gitlab.com/Odyseus/CinnamonTools/commit/780aaf6)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be
converted) to arrow functions.
- Cleaned leftovers from previous cleanup.

```

***

- **Date:** Sat, 4 Aug 2018 05:13:53 -0300
- **Commit:** [931fd03](https://gitlab.com/Odyseus/CinnamonTools/commit/931fd03)
- **Author:** Odyseus

```
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards
moving all JavaScript code to ES6.
- Simplification of the procedure to set the applet icon.

```

***

- **Date:** Wed, 18 Jul 2018 08:09:41 -0300
- **Commit:** [ee53956](https://gitlab.com/Odyseus/CinnamonTools/commit/ee53956)
- **Author:** Odyseus

```
- Finally fixed issues when handling gsettings (probably ¬¬).

```

***

- **Date:** Tue, 12 Jun 2018 00:13:13 -0300
- **Commit:** [d3625b9](https://gitlab.com/Odyseus/CinnamonTools/commit/d3625b9)
- **Author:** Odyseus

```
- gksu deprecation mitigation:
- Removed gsettings schema installation/removal from the settings.py script. To avoid dealing
with retarded policies (pkexec), I moved the installation process to a helper file (common to all
xlets) that uses the good old sudo.
- Cleaned some comments/commented lines.

```

***

- **Date:** Mon, 7 May 2018 04:52:28 -0300
- **Commit:** [130cad8](https://gitlab.com/Odyseus/CinnamonTools/commit/130cad8)
- **Author:** Odyseus

```
- Revamped/simplified settings system.

```

***
