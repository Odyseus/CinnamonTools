## Weather (Fork By Odyseus) changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools)

***

- **Date:** Thu, 21 Feb 2019 10:30:38 -0300
- **Commit:** [8c41de9](https://gitlab.com/Odyseus/CinnamonTools/commit/8c41de9)
- **Author:** Odyseus

```
- Added theming support.

```

***

- **Date:** Sun, 17 Feb 2019 02:31:28 -0300
- **Commit:** [c95eefe](https://gitlab.com/Odyseus/CinnamonTools/commit/c95eefe)
- **Author:** Odyseus

```
- Improved description of known status codes.
- Improved the display of error messages in the applet menu.
- Improved identification of method names when verbose debug mode is enabled.
- Avoid the hiding of the error box when it shouldn't be hidden.

```

***

- **Date:** Wed, 13 Feb 2019 04:04:10 -0300
- **Commit:** [5e59cee](https://gitlab.com/Odyseus/CinnamonTools/commit/5e59cee)
- **Author:** Odyseus

```
- Corrected the logic of the sanitizeStoredLocations method.
    - First, this.locationsMap doesn't need deduplication since it's a Map.
    - And second, I'm iterating over the stored data keys (a location UUID), not its values (the weather data for a location). So there is no need to re-create the UUIDs.

```

***

- **Date:** Tue, 12 Feb 2019 23:33:32 -0300
- **Commit:** [4fc8ec3](https://gitlab.com/Odyseus/CinnamonTools/commit/4fc8ec3)
- **Author:** Odyseus

```
- Rewritten from scratch to suport changes to the Yahoo! Weather API and to add several features.
- Added support for multiple locations.
- Added support for multiple weather providers.
- Added detailed tooltip to the applet about the current weather data location.
- Menu layout redesigned.
    - Forecasts can be displayed in one or two rows (or columns if the menu layout is set to vertical).
    - Forecasts can display the name of the day or the full date.
    - The date in which the weather data was published is always displayed in the menu.
    - More customization options (current weather icon size, forecasts icon size, etc.).

```

***

- **Date:** Mon, 21 Jan 2019 21:55:26 -0300
- **Commit:** [24e684b](https://gitlab.com/Odyseus/CinnamonTools/commit/24e684b)
- **Author:** Odyseus

```
- Changed applet icon.

```

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
