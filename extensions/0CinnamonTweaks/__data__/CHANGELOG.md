## Cinnamon Tweaks changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Thu, 17 Jan 2019 14:17:49 -0300
- **Commit:** [1bc1bc4](https://gitlab.com/Odyseus/CinnamonTools/commit/1bc1bc4)
- **Author:** Odyseus

```
- Python files improvements:
    - Simplified localization system.
    - Homogenized/Cleaned up code.

```

***

- **Date:** Thu, 23 Aug 2018 02:40:12 -0300
- **Commit:** [f50c0a8](https://gitlab.com/Odyseus/CinnamonTools/commit/f50c0a8)
- **Author:** Odyseus

```
- Set the **Cancel** button in the `ConfirmationDialog` prototype as focused by default.

```

***

- **Date:** Tue, 7 Aug 2018 03:14:28 -0300
- **Commit:** [e794665](https://gitlab.com/Odyseus/CinnamonTools/commit/e794665)
- **Author:** Odyseus

```
- Fixed notifications close buttons not working. This was caused by an unbound callback after the elimiation of the **Lang** module usage.
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

```

***

- **Date:** Sat, 4 Aug 2018 05:12:26 -0300
- **Commit:** [340e7de](https://gitlab.com/Odyseus/CinnamonTools/commit/340e7de)
- **Author:** Odyseus

```
- Eradication of **Lang** module usage in favor of arrow/standard functions. Also removed Cjs JS class notation in favor of prototypes. First step towards moving all JavaScript code to ES6.
- Removed support for Cinnamon versions older than 3.0.x.

```

***

- **Date:** Wed, 18 Jul 2018 08:09:09 -0300
- **Commit:** [81ec82e](https://gitlab.com/Odyseus/CinnamonTools/commit/81ec82e)
- **Author:** Odyseus

```
- Finally fixed issues when handling gsettings (probably ¬¬).

```

***

- **Date:** Tue, 12 Jun 2018 00:13:52 -0300
- **Commit:** [85054cc](https://gitlab.com/Odyseus/CinnamonTools/commit/85054cc)
- **Author:** Odyseus

```
- gksu deprecation mitigation:
    - Removed gsettings schema installation/removal from the settings.py script. To avoid dealing with retarded policies (pkexec), I moved the installation process to a helper file (common to all xlets) that uses the good old sudo.
- Cleaned some comments/commented lines.

```

***

- **Date:** Mon, 14 May 2018 07:12:36 -0300
- **Commit:** [53d5934](https://gitlab.com/Odyseus/CinnamonTools/commit/53d5934)
- **Author:** Odyseus

```
- Fixed use of undefined variable.

```

***

- **Date:** Sun, 6 May 2018 03:29:16 -0300
- **Commit:** [ecff4ab](https://gitlab.com/Odyseus/CinnamonTools/commit/ecff4ab)
- **Author:** Odyseus

```
- Revamped settings system. Switched to a JavaScript class which automatically generates getters/setters based on the schema keys.

```

***
