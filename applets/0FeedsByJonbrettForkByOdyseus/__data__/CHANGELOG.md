## Feeds Reader (Fork By Odyseus) changelog

**This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools).**

***

**Date:** Mon, 17 Feb 2020 10:40:52 -0300<br/>
**Commit:** [85ea0ca](https://gitlab.com/Odyseus/CinnamonTools/commit/85ea0ca)<br/>
**Author:** Odyseus<br/>

- Fixed formatting of translatable string.

***

**Date:** Wed, 12 Feb 2020 22:47:55 -0300<br/>
**Commit:** [ab9d1fc](https://gitlab.com/Odyseus/CinnamonTools/commit/ab9d1fc)<br/>
**Author:** Odyseus<br/>

- Adaptations due to changes to the custom settings framework.

***

**Date:** Mon, 10 Feb 2020 23:56:24 -0300<br/>
**Commit:** [1ed7456](https://gitlab.com/Odyseus/CinnamonTools/commit/1ed7456)<br/>
**Author:** Odyseus<br/>

Applet rewrite
--------------

WARNING: This update is a complete rewrite of the applet and it will reset most of the settings of an existent instance to their default values. Read the help page for this applet for detailed usage.

WARNING: This update will not recognize existent feeds. It is recommended to export all feeds from all profiles of a previous version of this applet so they can be imported into the new version.

- Completely rewritten from scratch to remove unused code, remove unimplemented features and add new features.
- More accessible options. Now each feed on the menu has a context menu that can toggle its options without the need to open the applet settings window.
- Correct localization for plurals.
- Removed the Feeds Manager GUI in favor of using the same custom framework to handle the applet settings that I use in other xlets. Now the feeds are stored in an applet setting and can be managed from the applet settings page.
- Added option to show/hide icons on the menu.
- Added confirmation dialog for when all feeds are marked as read.

***

**Date:** Tue, 16 Jul 2019 00:52:14 -0300<br/>
**Commit:** [6d9d7f4](https://gitlab.com/Odyseus/CinnamonTools/commit/6d9d7f4)<br/>
**Author:** Odyseus<br/>

- Added basic integration with Panel Drawer applet.

***

**Date:** Fri, 21 Jun 2019 23:02:18 -0300<br/>
**Commit:** [7d7041a](https://gitlab.com/Odyseus/CinnamonTools/commit/7d7041a)<br/>
**Author:** Odyseus<br/>

- Corrected typo in settings-schema.json file.

***

**Date:** Thu, 30 May 2019 03:47:29 -0300<br/>
**Commit:** [ffd29d0](https://gitlab.com/Odyseus/CinnamonTools/commit/ffd29d0)<br/>
**Author:** Odyseus<br/>

- Minor changes due to changes in global modules.
- Python scripts:
    - Changed the use of cgi.escape to html.escape due to cgi.escape deprecation.
    - Changed to Gtk.IconSize.BUTTON constant to specify icon sizes.
    - Implemented the use of constants to specify default Gtk CSS classes.

***

**Date:** Thu, 23 May 2019 02:15:54 -0300<br/>
**Commit:** [af8e1cf](https://gitlab.com/Odyseus/CinnamonTools/commit/af8e1cf)<br/>
**Author:** Odyseus<br/>

- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Improved debugger.
- Added SVG icon.

***

**Date:** Mon, 15 Apr 2019 22:00:51 -0300<br/>
**Commit:** [3c3afc3](https://gitlab.com/Odyseus/CinnamonTools/commit/3c3afc3)<br/>
**Author:** Odyseus<br/>

- Implemented a tooltip for feed items that automatically positions itself above the cursor when there is no room on the screen to display the tooltip.
- Added clean up of new lines on the tooltip's text.

***

**Date:** Thu, 21 Feb 2019 10:34:36 -0300<br/>
**Commit:** [245db25](https://gitlab.com/Odyseus/CinnamonTools/commit/245db25)<br/>
**Author:** Odyseus<br/>

- Added call to finalize settings when applet is removed from panel.

***

**Date:** Thu, 17 Jan 2019 13:59:27 -0300<br/>
**Commit:** [927b262](https://gitlab.com/Odyseus/CinnamonTools/commit/927b262)<br/>
**Author:** Odyseus<br/>

- Added button to remove profiles to the Feeds Manager GUI (Finally I figured out! LOL).
- Added option to *unify* notifications.
- Cleaned up inaccurate/unnecessary comments.
- Changed default feeds to include a second profile.
- Python files improvements:
    - Simplified localization system.
    - Homogenized/Cleaned up code.
    - Docstrings completion/clean up.

***

**Date:** Tue, 15 Jan 2019 22:37:24 -0300<br/>
**Commit:** [99f22ba](https://gitlab.com/Odyseus/CinnamonTools/commit/99f22ba)<br/>
**Author:** Odyseus<br/>

- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).

***

**Date:** Thu, 23 Aug 2018 02:46:10 -0300<br/>
**Commit:** [7c30cea](https://gitlab.com/Odyseus/CinnamonTools/commit/7c30cea)<br/>
**Author:** Odyseus<br/>

- Implemented a more transparent way of calling `Gio.File.load_contents_finish`.

***

**Date:** Tue, 7 Aug 2018 03:08:45 -0300<br/>
**Commit:** [0c43e68](https://gitlab.com/Odyseus/CinnamonTools/commit/0c43e68)<br/>
**Author:** Odyseus<br/>

- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.

***

**Date:** Sat, 4 Aug 2018 05:15:18 -0300<br/>
**Commit:** [3aecd1d](https://gitlab.com/Odyseus/CinnamonTools/commit/3aecd1d)<br/>
**Author:** Odyseus<br/>

- Eradication of **Lang** module usage in favor of arrow/standard functions. First step towards moving all JavaScript code to ES6.

***

**Date:** Wed, 18 Jul 2018 00:37:54 -0300<br/>
**Commit:** [56ed4bb](https://gitlab.com/Odyseus/CinnamonTools/commit/56ed4bb)<br/>
**Author:** Odyseus<br/>

- Fixed an issue that prevented to set and use the default profile when the applet was placed in a panel for the first time.
- Added options to set custom icons for use with the applet.
- Removed some `try{} catch{}` blocks that were used for debugging.
- Renamed the icons shipped with the applet to be less generic.

***

**Date:** Wed, 13 Jun 2018 01:01:13 -0300<br/>
**Commit:** [c586d38](https://gitlab.com/Odyseus/CinnamonTools/commit/c586d38)<br/>
**Author:** Odyseus<br/>

- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

***

**Date:** Tue, 5 Jun 2018 16:15:19 -0300<br/>
**Commit:** [e043ddd](https://gitlab.com/Odyseus/CinnamonTools/commit/e043ddd)<br/>
**Author:** Odyseus<br/>

- Re-based from the new applet version from the original author.
- Added keyboard shortcut to be able to open/close the menu.
- Added proper keyboard navigation for the menu.
- Eliminated the need of a stylesheet.css file. The menu will be styled respecting the currently used Cinnamon theme.
- Feeds will only be updated from their online sources if the last check was made after the refresh interval.
- Added missing dependency message.
- Forced the use of Python 3 in all Python modules/scripts.

***

**Date:** Wed, 2 May 2018 00:40:33 -0300<br/>
**Commit:** [aec58b6](https://gitlab.com/Odyseus/CinnamonTools/commit/aec58b6)<br/>
**Author:** Odyseus<br/>

- Fixed preference name type.

***
