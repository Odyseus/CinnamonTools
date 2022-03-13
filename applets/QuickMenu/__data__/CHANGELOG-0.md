## Old repository history

***

- **Date:** Tue, 6 Jun 2017 22:30:14 -0300
- **Author:** Odyseus

```
Quick Menu applet
- Better handling of **Settings.BindingDirection**. Just to avoid surprises when that constant is
removed on future versions of Cinnamon.

```

***

- **Date:** Sun, 4 Jun 2017 19:36:56 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sat, 3 Jun 2017 19:33:46 -0300
- **Author:** Odyseus

```
Quick Menu applet
- Fixed an issue that kept an empty label visible on Cinnamon 3.4.x, adding extra spacing to the
elements of the applet when it shouldn't.

```

***

- **Date:** Sat, 3 Jun 2017 09:05:18 +0200
- **Author:** Åke Engelbrektson

```
QuickMenu: Update sv.po

```

***

- **Date:** Tue, 30 May 2017 19:50:41 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Mon, 29 May 2017 02:52:43 -0300
- **Author:** Odyseus

```
Quick Menu applet
- Updated localization template and Spanish localization.

```

***

- **Date:** Sat, 27 May 2017 22:34:37 -0300
- **Author:** Odyseus

```
Quick Menu applet
- Updated help file due to updated localization.

```

***

- **Date:** Sat, 27 May 2017 22:02:22 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sat, 27 May 2017 19:53:12 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Mon, 15 May 2017 00:40:50 -0300
- **Author:** Odyseus

```
Quick Menu applet
- Re-generated help file based on new localizations.

LANGUAGE  UNTRANSLATED
zh_CN.po  0
es.po     0
sv.po     0
hr.po     27

```

***

- **Date:** Sun, 14 May 2017 11:43:10 -0300
- **Author:** Odyseus

```
Quick Menu applet
- Added Swedish localization.
```

***

- **Date:** Sun, 14 May 2017 22:26:44 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sun, 14 May 2017 10:59:11 +0200
- **Author:** Åke Engelbrektson

```
Update sv.po
Didn't understand the use of ** until later, so here's a minor correction.
```

***

- **Date:** Sun, 14 May 2017 08:35:16 +0200
- **Author:** Åke Engelbrektson

```
Create sv.po
Swedish translation
```

***

- **Date:** Sat, 13 May 2017 20:55:21 -0300
- **Author:** Odyseus

```
Quick Menu applet
- Redesigned help file generation. Now the help file is created from a python script
(create_localized_help.py) from which strings can be extracted by xgettext to be added to the xlet
localization template to be able to localize the content of the help file.

LANGUAGE  UNTRANSLATED
zh_CN.po  28
es.po     0
hr.po     27

```

***

- **Date:** Mon, 8 May 2017 13:20:11 +0200
- **Author:** muzena

```
0QuickMenu@odyseus.ong.hr: update hr.po

```

***

- **Date:** Sat, 6 May 2017 08:25:53 -0300
- **Author:** Odyseus

```
Quick Menu applet
- Cleaned up metadata.json file.

```

***

- **Date:** Fri, 5 May 2017 13:27:31 -0300
- **Author:** Odyseus

```
Quick Menu applet
- Minor code tweaks.

```

***

- **Date:** Thu, 4 May 2017 05:15:01 -0300
- **Author:** Odyseus

```
Quick Menu applet
- Removed *multiversion* because it is not worth the trouble.
- Removed default main folder set to Desktop. This was done because if the Desktop contains a lot of
files (by the thousands), Cinnamon will simply freeze and/or crash. This happens because Clutter
menus can barely handle large amounts of menu items.
- Moved some prototypes into a separate "modules file".
- Removed *dangerous* flag. Achieved by changing all synchronous functions to their asynchronous
counterparts.
- Some minor code clean up.

```

***

- **Date:** Sun, 30 Apr 2017 01:06:28 -0300
- **Author:** Odyseus

```
Quick Menu applet
- Cleaned metadata.json file.

```

***

- **Date:** Thu, 13 Apr 2017 16:16:07 -0300
- **Author:** Odyseus

```
Quick Menu applet - Added localized help.

```

***

- **Date:** Sat, 18 Mar 2017 04:09:36 -0300
- **Author:** Odyseus

```
Merge pull request #33 from giwhub/giwhub-patch-4
Add Chinese translation for Quick Menu
```

***

- **Date:** Fri, 17 Mar 2017 22:46:37 +0800
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

- **Date:** Tue, 10 Jan 2017 12:29:04 -0300
- **Author:** Odyseus

```
[Quick Menu applet] - Fixed menu breakage after changing main folder under Cinnamon 3.2.x. Fixes #16

```

***

- **Date:** Wed, 21 Dec 2016 04:32:51 -0300
- **Author:** Odyseus

```
[Quick Menu applet] - Improved support for Cinnamon 3.2.x
- Improved hotkey handling
- Improved application's icon recognition for use on the menu items
- Improved support for files launching. Now, if there isn't a handler for certain file types, the
**"Open with"** dialog will appear
- Added support for symbolic links
- Fixed the display of symbolic icons for the applet.

```

***

- **Date:** Fri, 7 Oct 2016 21:09:16 -0300
- **Author:** Odyseus

```
[Quick Menu applet] Added option to auto-hide opened sub-menus. Added option to keep the menu open
after activating a menu item. Some code cleaning/corrections.

```

***

- **Date:** Thu, 6 Oct 2016 03:35:15 -0300
- **Author:** Odyseus

```
Corrected some terms and removed BASICS.md in favor of Wiki.

```

***

- **Date:** Mon, 3 Oct 2016 00:12:50 -0300
- **Author:** Odyseus

```
White space cleaning.

```

***

- **Date:** Sun, 25 Sep 2016 01:37:02 -0300
- **Author:** Odyseus

```
Added support for localizations.

```

***

- **Date:** Thu, 15 Sep 2016 07:03:44 -0300
- **Author:** Odyseus

```
Initial commit..

```

***

- **Date:** Wed, 14 Sep 2016 14:23:03 -0300
- **Author:** Odyseus

```
Initial commit.

```

***

- **Date:** Fri, 2 Sep 2016 00:22:09 -0300
- **Author:** Odyseus

```
Initial commit..

```

***

- **Date:** Wed, 31 Aug 2016 12:03:17 -0300
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

- **Date:** Sat, 6 Aug 2016 01:11:31 -0300
- **Author:** Odyseus

```
Initial commit....

```

***

- **Date:** Sat, 6 Aug 2016 01:08:09 -0300
- **Author:** Odyseus

```
Initial commit...

```

***

- **Date:** Sat, 6 Aug 2016 00:08:42 -0300
- **Author:** Odyseus

```
Initial commit..

```

***

- **Date:** Fri, 5 Aug 2016 23:54:23 -0300
- **Author:** Odyseus

```
Initial commit.

```

***

- **Date:** Fri, 5 Aug 2016 23:37:54 -0300
- **Author:** Odyseus

```
Initial commit.

```

***
