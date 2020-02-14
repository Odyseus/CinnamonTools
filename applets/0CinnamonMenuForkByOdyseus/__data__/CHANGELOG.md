## Cinnamon Menu (Fork By Odyseus) changelog

**This change log is only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools).**

***

- **Date:** Wed, 12 Feb 2020 22:48:07 -0300
- **Commit:** [30fce2b](https://gitlab.com/Odyseus/CinnamonTools/commit/30fce2b)
- **Author:** Odyseus

```
- Adaptations due to changes to the custom settings framework.

```

***

- **Date:** Tue, 11 Feb 2020 00:00:15 -0300
- **Commit:** [9c2c2e7](https://gitlab.com/Odyseus/CinnamonTools/commit/9c2c2e7)
- **Author:** Odyseus

```
- Corrected keyboard navigation behavior. Now menu items are correctly focused when performing *jumps*.
- Adaptations due to changes to global JavaScript modules.
- Implemented the use of the `xdgOpen` function from the `globalUtils.js` JavaScript module.
- Adaptations due to changes to custom xlets settings framework.

```

***

- **Date:** Mon, 27 Jan 2020 02:42:56 -0300
- **Commit:** [ffe5de8](https://gitlab.com/Odyseus/CinnamonTools/commit/ffe5de8)
- **Author:** Odyseus

```
Countermeasures for using an external settings application
----------------------------------------------------------

- Removed condition used to selectively override the applet's Configure context menu item depending on Cinnamon version used. This condition caused to not open the settings window on newer Cinnamon versions.
- Added button to the settings-schema.json file so the *real* settings window can be opened from Cinnamon's native settings window. Trying to open the correct xlet settings from the xlets manager isn't possible, so I added this button.
- Removed `external-configuration-app` key from the metadata.json file so the built-in mechanism to open xlet settings doesn't fail silently without displaying error messages.

```

***

- **Date:** Fri, 21 Jun 2019 23:01:39 -0300
- **Commit:** [5cfae62](https://gitlab.com/Odyseus/CinnamonTools/commit/5cfae62)
- **Author:** Odyseus

```
- Implemented the use of a custom framework to handle the applet settings since I was already using the framework to create the custom launchers manager window.

```

***

- **Date:** Thu, 30 May 2019 03:46:46 -0300
- **Commit:** [da83098](https://gitlab.com/Odyseus/CinnamonTools/commit/da83098)
- **Author:** Odyseus

```
- Minor changes due to changes in global modules.
- Added SVG icon.

```

***

- **Date:** Thu, 23 May 2019 02:14:57 -0300
- **Commit:** [1335515](https://gitlab.com/Odyseus/CinnamonTools/commit/1335515)
- **Author:** Odyseus

```
- JavaScript modules globalization. Moved functions/classes out of the xlet itself into global modules added at build time to minimize duplicated code across all xlets and facilitate maintenance.
- JavaScript code homogenization.
- Implemented debugger.
- Fixed error caused by erroneous binding.

```

***

- **Date:** Thu, 9 May 2019 05:16:44 -0300
- **Commit:** [61ea514](https://gitlab.com/Odyseus/CinnamonTools/commit/61ea514)
- **Author:** Odyseus

```
- Corrected infinite loop caused by the use of an absolutely retarded language.
- Removed unnecessary icons.

```

***

- **Date:** Thu, 25 Apr 2019 02:07:06 -0300
- **Commit:** [b50f17d](https://gitlab.com/Odyseus/CinnamonTools/commit/b50f17d)
- **Author:** Odyseus

```
- Added a signal manager to manage existent signal connections and to handle some signals that weren't managed.
- Added proper binding to several signals.

```

***

- **Date:** Mon, 15 Apr 2019 22:46:55 -0300
- **Commit:** [b1bf6ae](https://gitlab.com/Odyseus/CinnamonTools/commit/b1bf6ae)
- **Author:** Odyseus

```
- Modified the custom launchers manager GUI to use a centralized framework.

```

***

- **Date:** Thu, 28 Feb 2019 20:02:22 -0300
- **Commit:** [b01f23c](https://gitlab.com/Odyseus/CinnamonTools/commit/b01f23c)
- **Author:** Odyseus

```
- Updated CONTRIBUTORS.md file to properly give credit.

```

***

- **Date:** Thu, 21 Feb 2019 10:35:29 -0300
- **Commit:** [03d3586](https://gitlab.com/Odyseus/CinnamonTools/commit/03d3586)
- **Author:** Odyseus

```
- Added call to finalize settings when applet is removed from panel.

```

***

- **Date:** Tue, 12 Feb 2019 23:52:51 -0300
- **Commit:** [3ed94a6](https://gitlab.com/Odyseus/CinnamonTools/commit/3ed94a6)
- **Author:** Odyseus

```
- Removed some try{}catch{} blocks left for debugging.
- Changed some defaults to suit my needs.
- Several minor optimizations and clean ups (most of them from upstream).

```

***

- **Date:** Mon, 21 Jan 2019 21:50:38 -0300
- **Commit:** [ebb12e6](https://gitlab.com/Odyseus/CinnamonTools/commit/ebb12e6)
- **Author:** Odyseus

```
- Mayor performance improvements based on changes from upstream. Highlights:
    - One context menu to rule them all.
    - A generic and more simple button class not based on PopupMenu.PopupBaseMenuItem.
    - Function calls instead of signals for button enter/leave events.
- Added back "All Applications" category. There is no reason not to have it now, since the code is a lot more simple than it was and having this category doesn't add any complexity.
- Added option to display a separator below "Recently Used" category
- Custom launchers GUI improvements:
    - Added ability to enable/disable launchers instead of being forced to delete them and enter all data back.
    - Added icon preview to the list instead of displaying the icon names.
    - Added confirmation dialog when deleting items. It can be bypassed by holding Ctrl key.
    - Added keyboard shortcuts to be able to add/remove/move items in the list of launchers.
    - Added ability to export/import the list of launchers.

```

***

- **Date:** Thu, 17 Jan 2019 14:14:12 -0300
- **Commit:** [9713b1f](https://gitlab.com/Odyseus/CinnamonTools/commit/9713b1f)
- **Author:** Odyseus

```
- Modified procurement of application keywords due to changes to Cinnamon.AppSystem in the upcoming Cinnamon version (4.2.x?). Currently it returns a string, but it will return an array in the future.
- Python files improvements:
    - Simplified localization system.
    - Homogenized/Cleaned up code.

```

***

- **Date:** Tue, 15 Jan 2019 22:54:01 -0300
- **Commit:** [431f936](https://gitlab.com/Odyseus/CinnamonTools/commit/431f936)
- **Author:** Odyseus

```
- Modified applet initialization code in preparation for asynchronous settings initialization that will be available in the next Cinnamon version (4.2.x?).
- Improved *throttle* of the callback triggered when applications are installed/uninstalled.
- Improved *throttle* of the callback triggered when performing searches.
- Improved selected state of first item while performing searches.
- Improved favorites removal. Now the list of favorites is instantly updated when a favorite is removed. Previously, it was needed to *deselect* the favorites category and select it back to update its content.
- Improved search mechanism. Favor inline declarations instead of function declarations/calls.
- Simplified _resizeApplicationsBox().
- Adapted usage of Cinnamon.AppSystem to account for methods that will be removed in the next Cinnamon version (4.2.x?) (upstream tweak).
- Don't manually realize actors (upstream tweak).

```

***

- **Date:** Sat, 12 Jan 2019 03:05:32 -0300
- **Commit:** [2e2562f](https://gitlab.com/Odyseus/CinnamonTools/commit/2e2562f)
- **Author:** Odyseus

```
- Fuzzy search mechanism improvements.
    - Added option to change the icon size of search results.
    - Added option to not display low priority search results.
    - Changed maximum search results preferences default value to 15, lowered minimum value to 5 and increased maximum value to 100.
    - Now the generic name of an application will also be searched.
    - Now the search is performed using a "data base" created at menu build time instead of looking up for search data in each button actor at search time.
    - The search result items are now populated (their icon and label) in-place instead of removed and re-added.
- Recent applications mechanism improvements.
    - Implemented a mechanism similar to the one used by the search results.
    - Instead of sorting actual button actors, only application data is sorted and then used to populate existent buttons.
- Category selection mechanism improvements.
    - Made the "custom category" names somewhat unique to prevent possible "complications".
- Fixed issue that removed focus from a selected application when the mouse cursor was moved over the inactive categories box while performing a search.
- Fixed issue that prevented the icon inside the search box to correctly change state.
- Added category names to applications tooltips. This helps to know to which category belongs an application in the list of search results for example.
- Keyboard navigation improvements.
- Eradicated recently installed applications highlighting. It was never that useful to begin with because:
    - Highlighting an application that one doesn't know in which category to find it was pointless.
    - The list of "known applications" was ephemeral. Restarting Cinnamon or the system itself leave us still no knowing where the heck is the recently installed application.
    - And finally, with fuzzy search implemented now, it is easier and more likely to find an unknown application.
- Cleaned up more left over code.

```

***

- **Date:** Thu, 3 Jan 2019 20:03:04 -0300
- **Commit:** [dccd24e](https://gitlab.com/Odyseus/CinnamonTools/commit/dccd24e)
- **Author:** Odyseus

```
- Implemented fuzzy search.
- Added option to display a maximum amount of search results.

```

***

- **Date:** Thu, 3 Jan 2019 08:38:01 -0300
- **Commit:** [91dc16f](https://gitlab.com/Odyseus/CinnamonTools/commit/91dc16f)
- **Author:** Odyseus

```
- Cleaned up left over code from previous features removal.
- Cleaned up appletHelper.py script of unused code and re-organized import statements.

```

***

- **Date:** Mon, 29 Oct 2018 13:44:46 -0300
- **Commit:** [e971d74](https://gitlab.com/Odyseus/CinnamonTools/commit/e971d74)
- **Author:** Odyseus

```
- Some upstream fixes.

```

***

- **Date:** Tue, 7 Aug 2018 03:05:01 -0300
- **Commit:** [5b1e2ce](https://gitlab.com/Odyseus/CinnamonTools/commit/5b1e2ce)
- **Author:** Odyseus

```
- Second step towards moving all JavaScript code to ES6. Convert all functions (that can be converted) to arrow functions.
- Removed leftovers from previous cleanup.

```

***

- **Date:** Sat, 4 Aug 2018 05:16:10 -0300
- **Commit:** [b1bac59](https://gitlab.com/Odyseus/CinnamonTools/commit/b1bac59)
- **Author:** Odyseus

```
- Simplification of the procedure to set the applet icon.
- Changed the **Custom text editor** setting from a **filechooser** to an **entry** (filechoosers on newer Cinnamon versions are garbage).

```

***

- **Date:** Mon, 23 Jul 2018 14:15:35 -0300
- **Commit:** [377907b](https://gitlab.com/Odyseus/CinnamonTools/commit/377907b)
- **Author:** Odyseus

```
- Fixed context menu handlers inside **Recent applications** menu. Now they are correctly closed when other context menus are opened.
- Fixed stuck search results when clearing the search box content. I K.I.S.S.(ed) it. I just call _onOpenStateChanged and move on. ¬¬
- Cleaned some leftover comments.
- Removed unnecessary try{}catch{} block.
- Completely eradicated **Recent files** category.
- Completely eradicated **Places** category.
- Completely eradicated search providers.
- Completely eradicated search in file system.
- Completely eradicated the use of `Lang.bind()` in favor of using arrow functions.
- "Strictified" some comparisons. There were mostly comparisons to **null**, to integers/strings and between actors. The comparisons to **undefined** were eradicated along with all the garbage that I cleared.

```

***

- **Date:** Wed, 13 Jun 2018 00:59:33 -0300
- **Commit:** [a058017](https://gitlab.com/Odyseus/CinnamonTools/commit/a058017)
- **Author:** Odyseus

```
- Corrected settings changed callback function due to different amount of arguments passed by different Cinnamon versions.

```

***

- **Date:** Mon, 11 Jun 2018 23:57:27 -0300
- **Commit:** [451a97a](https://gitlab.com/Odyseus/CinnamonTools/commit/451a97a)
- **Author:** Odyseus

```
- gksu deprecation mitigation:
    - Changed the *pref_privilege_elevator* setting type from **combobox** to **entry** to be able to set a custom privilege elevator command. Changed its default value from gksu to pkexec.
    - Added a launcher.py helper script to execute programs from the menu as root. This is a workaround that allows to use pkexec, since I wasn't able to directly execute pkexec from any of the available spawn* JavaScript functions. ¬¬
- Renamed the main applet prototype to reflect the applet's name and not the development version of the applet's name.
- Cleaned some comments/commented lines.
- Moved some calls to the close menu function at the beginning of code blocks to avoid *problems* with opened dialogs when activating items.

```

***

- **Date:** Mon, 14 May 2018 07:10:49 -0300
- **Commit:** [bfed61f](https://gitlab.com/Odyseus/CinnamonTools/commit/bfed61f)
- **Author:** Odyseus

```
- Fixed duplication of Recent Applications category.

```

***

- **Date:** Mon, 7 May 2018 04:53:53 -0300
- **Commit:** [d4b4ade](https://gitlab.com/Odyseus/CinnamonTools/commit/d4b4ade)
- **Author:** Odyseus

```
- Implemented key bindings common naming.

```

***
