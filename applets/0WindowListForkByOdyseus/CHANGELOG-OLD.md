## Window list (Fork By Odyseus) changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://github.com/Odyseus/CinnamonTools)

***

- **Date:** Mon, 24 Jul 2017 01:10:49 -0300
- **Author:** Odyseus

```
Window list (Fork By Odyseus) applet
- Added Czech localization. Thanks to [Radek71](https://github.com/Radek71).

```

***

- **Date:** Sun, 11 Jun 2017 03:13:23 -0300
- **Author:** Odyseus

```
Window list (Fork By Odyseus) applet
- Fixed the impossibility to open the applet settings window. This was caused when I changed the use
of spawnCommandLine for spawn_async and passed the wrong arguments. Affected only Cinnamon versions
2.8 and 3.0.
- Applied window preview upstream tweaks.

```

***

- **Date:** Tue, 6 Jun 2017 22:31:11 -0300
- **Author:** Odyseus

```
Window list (Fork By Odyseus) applet
- Better handling of **Settings.BindingDirection**. Just to avoid surprises when that constant is
removed on future versions of Cinnamon.

```

***

- **Date:** Sun, 4 Jun 2017 19:43:55 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sat, 3 Jun 2017 09:00:29 +0200
- **Author:** Åke Engelbrektson

```
window-list-fork: Update sv.po

```

***

- **Date:** Tue, 30 May 2017 19:54:20 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Mon, 29 May 2017 05:39:26 -0300
- **Author:** Odyseus

```
Window list (Fork By Odyseus) applet
- Updated README, metadata.json file and help file due to new localization.
- Updated localization template and Spanish localization.

```

***

- **Date:** Mon, 29 May 2017 10:21:28 +0200
- **Author:** Åke Engelbrektson

```
window-list-fork: add sv.po
Add Swedish translation
```

***

- **Date:** Sat, 27 May 2017 22:35:37 -0300
- **Author:** Odyseus

```
Window list (Fork By Odyseus) applet
- Updated help file due to updated localization.

```

***

- **Date:** Sat, 27 May 2017 22:01:58 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sat, 27 May 2017 19:55:20 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Tue, 23 May 2017 06:11:19 -0300
- **Author:** Odyseus

```
Window list (Fork By Odyseus) applet
- Added a retro-compatibility tweak to fix an error caused by a change in new versions of Cinnamon.

LANGUAGE  UNTRANSLATED
zh_CN.po  0
de.po     16
es.po     0
hr.po     11

```

***

- **Date:** Mon, 22 May 2017 01:24:01 -0300
- **Author:** Odyseus

```
Window list (Fork By Odyseus) applet
- Added missing dependency to a settings key. Upstream fix.
- Fixed a bug that prevented to move an application to another workspace. This bug was caused by the
movement of a function outside a loop.

LANGUAGE  UNTRANSLATED
zh_CN.po  0
de.po     16
es.po     0
hr.po     11

```

***

- **Date:** Mon, 15 May 2017 22:50:36 -0300
- **Author:** Odyseus

```
WIndow list (Fork By Odyseus) applet
- Removed CJS 3.4 warnings.

LANGUAGE  UNTRANSLATED
zh_CN.po  0
de.po     16
es.po     0
hr.po     11

```

***

- **Date:** Mon, 15 May 2017 00:42:47 -0300
- **Author:** Odyseus

```
Window list (Fork By Odyseus) applet
- Re-generated help file based on new localizations.

LANGUAGE  UNTRANSLATED
zh_CN.po  0
de.po     16
es.po     0
hr.po     11

```

***

- **Date:** Sun, 14 May 2017 18:58:44 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sat, 13 May 2017 20:57:49 -0300
- **Author:** Odyseus

```
Window list (Fork By Odyseus) applet
- Redesigned help file generation. Now the help file is created from a python script
(create_localized_help.py) from which strings can be extracted by xgettext to be added to the xlet
localization template to be able to localize the content of the help file.

LANGUAGE  UNTRANSLATED
zh_CN.po  16
de.po     16
es.po     0
hr.po     11

```

***

- **Date:** Mon, 8 May 2017 13:22:57 +0200
- **Author:** muzena

```
0WindowListFork@odyseus.ong.hr: update hr.po

```

***

- **Date:** Sat, 6 May 2017 08:23:50 -0300
- **Author:** Odyseus

```
Window list (Fork By Odyseus) applet
- Cleaned up metadata.json file.
- Updated localization template.

```

***

- **Date:** Fri, 5 May 2017 13:29:43 -0300
- **Author:** Odyseus

```
Window List (Fork By Odyseus) applet
- Minor code tweaks.

```

***

- **Date:** Thu, 4 May 2017 06:28:06 -0300
- **Author:** Odyseus

```
Window list (Fork By Odyseus) applet
- Added missing context menu to open the help file.
- Updated metadata.json file.
- Changed *multiversion* implementation. Created symlinks inside the version folders so I don't keep
forgetting to copy the files from the root folder.
- Moved some functions into a separate "modules file". Only the ones that can be shared between all
versions.
- Some minor code clean up.

```

***

- **Date:** Sun, 30 Apr 2017 01:03:07 -0300
- **Author:** Odyseus

```
Window list (Fork By Odyseus) applet
- Cleaned metadata.json file.

```

***

- **Date:** Thu, 13 Apr 2017 13:45:16 -0300
- **Author:** Odyseus

```
Window list (Fork By Odyseus) applet - Added localized help.

```

***

- **Date:** Thu, 23 Mar 2017 09:32:19 -0300
- **Author:** Odyseus

```
Window List (Fork By Odyseus) applet - Moved localization file to the right place.

```

***

- **Date:** Sat, 18 Mar 2017 04:10:05 -0300
- **Author:** Odyseus

```
Merge pull request #32 from giwhub/giwhub-patch-3
Add Chinese translation for Window list (Fork By Odyseus)
```

***

- **Date:** Thu, 16 Mar 2017 22:20:49 +0800
- **Author:** giwhub

```
Create zh_CN.po

```

***
- **Date:** Fri, 27 Jan 2017 11:40:53 -0300
- **Author:** Odyseus

```
Applet - Cleaned some irrelevant files
- Updated READMEs
- Updated metadata.json
- Updated some applet icons.

```

***

- **Date:** Sun, 22 Jan 2017 23:50:00 -0300
- **Author:** Odyseus

```
Applets - Fixed some broken links.

```

***

- **Date:** Sun, 22 Jan 2017 20:29:22 -0300
- **Author:** Odyseus

```
Applets - Formatted repository to conform Spices repository.

```

***

- **Date:** Mon, 16 Jan 2017 09:21:47 -0300
- **Author:** Odyseus

```
[Window list (Fork By Odyseus) applet] - Added compatibility for Cinnamon 2.8.x
- Some minor fixes.

```

***

- **Date:** Sat, 10 Dec 2016 10:48:32 -0300
- **Author:** Odyseus

```
[Window list (Fork By Odyseus) applet] - Re-based on the Window list applet that comes with Cinnamon
3.2.x to add support for vertical panels
- Added option to invert the context menu items order
- Added option to hide/move to top/move to bottom the **Preferences** sub-menu
- Added option to set a custom size for windows thumbnails
- Fixed the removal of focused style from windows buttons on right click
- Now all preferences will take effect without the need to restart Cinnamon.

```

***

- **Date:** Thu, 6 Oct 2016 03:35:15 -0300
- **Author:** Odyseus

```
Corrected some terms and removed BASICS.md in favor of Wiki.

```

***

- **Date:** Mon, 3 Oct 2016 00:31:48 -0300
- **Author:** Odyseus

```
Fixed icons resizing.

```

***

- **Date:** Mon, 3 Oct 2016 00:19:42 -0300
- **Author:** Odyseus

```
Merge branch 'resize-icon' of https://github.com/NikoKrause/CinnamonTools into
NikoKrause-resize-icon
Trying icon resize issues

```

***

- **Date:** Mon, 3 Oct 2016 00:12:50 -0300
- **Author:** Odyseus

```
White space cleaning.

```

***

- **Date:** Sun, 2 Oct 2016 13:53:00 +0200
- **Author:** NikoKrause

```
resize icons when changing panel height

```

***

- **Date:** Fri, 30 Sep 2016 22:14:40 -0300
- **Author:** Odyseus

```
Added German localization by NikoKrause.

```

***

- **Date:** Fri, 30 Sep 2016 22:02:24 -0300
- **Author:** Odyseus

```
Merge branch 'translation_german' of https://github.com/NikoKrause/CinnamonTools into
NikoKrause-translation_german
Testing German localization.

```

***

- **Date:** Fri, 30 Sep 2016 21:55:46 -0300
- **Author:** Odyseus

```
Added support for localizations.

```

***

- **Date:** Sat, 1 Oct 2016 00:28:23 +0200
- **Author:** NikoKrause

```
added German translation and rephrased a sentence

```

***

- **Date:** Sun, 25 Sep 2016 01:37:02 -0300
- **Author:** Odyseus

```
Added support for localizations.

```

***

- **Date:** Wed, 14 Sep 2016 14:23:03 -0300
- **Author:** Odyseus

```
Initial commit.

```

***

- **Date:** Sun, 4 Sep 2016 04:59:49 -0300
- **Author:** Odyseus

```
Initial commit.

```

***

- **Date:** Sat, 20 Aug 2016 14:55:18 -0300
- **Author:** Odyseus

```
Initial commit.

```

***

- **Date:** Fri, 12 Aug 2016 05:34:24 -0300
- **Author:** Odyseus

```
Initial commit.....

```

***

- **Date:** Mon, 8 Aug 2016 00:40:39 -0300
- **Author:** Odyseus

```
Initial commit.....

```

***

- **Date:** Mon, 8 Aug 2016 00:02:21 -0300
- **Author:** Odyseus

```
Initial commit.....

```

***

- **Date:** Sun, 7 Aug 2016 23:57:41 -0300
- **Author:** Odyseus

```
Initial commit....

```

***
