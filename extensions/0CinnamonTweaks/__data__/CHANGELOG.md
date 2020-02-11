## Cinnamon Tweaks changelog

**This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools).**

***

- **Date:** Mon, 10 Feb 2020 23:05:37 -0300
- **Commit:** [d3492bc](https://gitlab.com/Odyseus/CinnamonTools/commit/d3492bc)
- **Author:** Odyseus

```
- Adaptations due to changes to the custom settings framework.
- Adaptations due to changes to the `debugManager.js` JavaScript module.

```

***

- **Date:** Mon, 27 Jan 2020 20:27:08 -0300
- **Commit:** [4a83c5e](https://gitlab.com/Odyseus/CinnamonTools/commit/4a83c5e)
- **Author:** Odyseus

```
Countermeasures for using an external settings application
----------------------------------------------------------

- Removed condition used to selectively generate a .desktop file to open the extension's settings window. Now the .desktop file will be created in all Cinnamon version the extension is installed.

```

***

- **Date:** Fri, 21 Jun 2019 23:06:57 -0300
- **Commit:** [6b9cf1e](https://gitlab.com/Odyseus/CinnamonTools/commit/6b9cf1e)
- **Author:** Odyseus

```
- Selectively disabled the xlets tweaks section from the settings window (confirmation dialogs for applets/desklets removal) in Cinnamon version greater than 4.2.x since that feature was added to Cinnamon.
- Minor changes to the settings application due to changes in the custom settings framework.

```

***

- **Date:** Wed, 5 Jun 2019 19:52:53 -0300
- **Commit:** [126e856](https://gitlab.com/Odyseus/CinnamonTools/commit/126e856)
- **Author:** Odyseus

```
- Corrected events return values.
- Minor changes due to changes in global modules.

```

***

- **Date:** Sun, 2 Jun 2019 12:35:29 -0300
- **Commit:** [c78bee1](https://gitlab.com/Odyseus/CinnamonTools/commit/c78bee1)
- **Author:** Odyseus

```
- Changed some translatable strings for easier localization.

```

***

- **Date:** Sat, 1 Jun 2019 04:47:18 -0300
- **Commit:** [854e3d3](https://gitlab.com/Odyseus/CinnamonTools/commit/854e3d3)
- **Author:** Odyseus

```
Extension rewrite
=================

WARNING 1: If a user is already using this extension prior to this update, it is recommended to build this extension with a different domain name than the one installed. This update is a complete re-write of the extension and uses a different settings system, so existent settings will be ignored.

WARNING 2: Needless to say that a previous version of the extension should be disabled before enabling this new version.

General changes
===============

- Switched from a gsettings settings system to Cinnamon's native settings system. This was done so I can use my own xlet settings framework that I already use in several of my xlets without the need to maintain the GUI (more than 2500 lines of code) I created exclusively for this extension.
- Added SVG icon.
- Modified the stylesheet.css file to use IDs to avoid possible conflicts with other xlets styles.

Specific tweaks changes
=======================

Auto move windows
-----------------

- Fixed the window mover tweak not being able to open an application to a non existent workspace.
- Added option to allow to switch to the workspace of the recently opened application.
- Added option to always move a full screen application into its own workspace.

Tooltips tweaks
---------------

- Changed the tweak that allowed to display the tooltip without the mouse cursor overlapping it. Now this tweak is called *intelligent positioning*. It not only avoids the mouse cursor overlap issue, but also allows to display a tooltip above the mouse cursor if there is no room on the screen to completely show the tooltip bellow it.
- Added tweak that allows to override the centered alignment of tooltips text set by certain Cinnamon themes (all the default ones). With this tweak enabled, the tooltip text will be aligned to the left or right depending on the text direction of the current system language.
- Added tweak to restrict tooltips width to half the monitor width.

Windows decorations removal
---------------------------

- Removed the use of synchronous functions to use their asynchronous counterparts instead. This effectively removes the warning seen on this extension in the extensions list.
- Fixed an issue with this tweak that prevented a window from an application from being auto-moved when the application was configured for both, decorations removal and auto-moved to a new workspace.

Removals
========

Applets/Desklets tweaks
-----------------------

- Removed the context menu items that allowed to open an installed applet/desklet folder and main file. I removed them for two main reasons:
    1. I don't use these items anymore since I don't ever edit the xlets directly where they are installed.
    2. Adding new context menu items indiscriminately to all xlets is invasive because an xlet might want to make use of the context menu on its own way (like I do myself with the Desktop Handler applet).

Popup menus tweaks
------------------

- Removed the Gnome Shell behavior for menus. This was never finished and it's a nightmare to implement now for two reasons:
    1. Gnome Shell is light years apart from Cinnamon and it currently uses a totally different mechanism to handle grab focus.
    2. And Cinnamon implementation is a total nightmare.

```

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
