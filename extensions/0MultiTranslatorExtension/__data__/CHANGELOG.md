## Multi Translator changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Thu, 23 Aug 2018 02:38:41 -0300
- **Commit:** [8faff12](https://gitlab.com/Odyseus/CinnamonTools/commit/8faff12)
- **Author:** Odyseus

```
- Implemented a more transparent way of calling `Gio.File.load_contents_finish`.

```

***

- **Date:** Tue, 7 Aug 2018 03:17:33 -0300
- **Commit:** [38b96da](https://gitlab.com/Odyseus/CinnamonTools/commit/38b96da)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

```

***

- **Date:** Sat, 4 Aug 2018 05:12:10 -0300
- **Commit:** [e195789](https://gitlab.com/Odyseus/CinnamonTools/commit/e195789)
- **Author:** Odyseus

```
- Revamped/simplified settings system.
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.
- Removed support for Cinnamon versions older than 3.0.x.

```

***

- **Date:** Tue, 12 Jun 2018 00:03:55 -0300
- **Commit:** [0636a62](https://gitlab.com/Odyseus/CinnamonTools/commit/0636a62)
- **Author:** Odyseus

```
- gksu deprecation mitigation:
    - Removed gsettings schema installation/removal from the settings.py script. To avoid dealing with retarded policies (pkexec), I moved the installation process to a helper file (common to all xlets) that uses the good old sudo.
- Cleaned some comments/commented lines.

```

***

- **Date:** Sat, 5 May 2018 05:00:45 -0300
- **Commit:** [c41ae2e](https://gitlab.com/Odyseus/CinnamonTools/commit/c41ae2e)
- **Author:** Odyseus

```
- Removed synchronous function calls. This effectively removes the *dangerous* flag displayed on the extensions manager for this extension.
- Added proper **gsettings** handling for gathering proxy data.
- Added two new translation engines (DeepL and Yandex, both used through Translate Shell).
- Now translations providers based on Translate Shell are *sub-classed* from a base *class* so they can be initialized with just a *"couple lines of code"*.

```

***

- **Date:** Tue, 1 May 2018 22:47:20 -0300
- **Commit:** [4c5f7e3](https://gitlab.com/Odyseus/CinnamonTools/commit/4c5f7e3)
- **Author:** Odyseus

```
Fixed wrong function calls inside catch blocks. I copied the `loadStylesheet` and `unloadStylesheet` functions from Cinnamon's code itself, and I didn't do a very good job at adapting the original logging functions.

```

***
