## Weather (Fork By Odyseus) changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Tue, 15 Jan 2019 22:36:02 -0300
- **Commit:** [5797433](https://gitlab.com/Odyseus/CinnamonTools/commit/5797433)
- **Author:** Odyseus

```
- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

```

***

- **Date:** Tue, 8 Jan 2019 21:40:05 -0300
- **Commit:** [fbdef6f](https://gitlab.com/Odyseus/CinnamonTools/commit/fbdef6f)
- **Author:** Odyseus

```
- Fixed strict mode warning.

```

***

- **Date:** Tue, 7 Aug 2018 03:12:54 -0300
- **Commit:** [ea72172](https://gitlab.com/Odyseus/CinnamonTools/commit/ea72172)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

```

***

- **Date:** Sat, 4 Aug 2018 05:13:40 -0300
- **Commit:** [4bfbd34](https://gitlab.com/Odyseus/CinnamonTools/commit/4bfbd34)
- **Author:** Odyseus

```
- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.

```

***

- **Date:** Wed, 13 Jun 2018 01:05:41 -0300
- **Commit:** [0225402](https://gitlab.com/Odyseus/CinnamonTools/commit/0225402)
- **Author:** Odyseus

```
- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

```

***

- **Date:** Mon, 14 May 2018 07:15:52 -0300
- **Commit:** [2e7d01c](https://gitlab.com/Odyseus/CinnamonTools/commit/2e7d01c)
- **Author:** Odyseus

```
- Corrected the logic when polling for weather data.

```

***

- **Date:** Mon, 7 May 2018 04:47:37 -0300
- **Commit:** [e8d1011](https://gitlab.com/Odyseus/CinnamonTools/commit/e8d1011)
- **Author:** Odyseus

```
- Revamped/simplified settings mechanism.
    - Renamed all settings keys to be prefixed with "pref_".
    - Removed unnecessary properties definition.
- Cleaned up unnecessary variable definitions.
- Proper handling of key bindings.
- Moved utility functions into the utils.js files.
- Added a mechanism to update weather data from the online source only when it is needed.
- Added Spanish localization.

```

***
