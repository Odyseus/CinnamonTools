## Extensions Manager changelog

#### This change log is only valid for the version of the xlet hosted on [its original repository](https://github.com/Odyseus/CinnamonTools)

***

- **Date:** Tue, 4 Jul 2017 19:17:36 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Updated Czech localization. Thanks to [Radek71](https://github.com/Radek71).

```

***

- **Date:** Thu, 8 Jun 2017 01:11:05 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Updated Czech localization.

```

***

- **Date:** Tue, 6 Jun 2017 22:29:43 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Better handling of **Settings.BindingDirection**. Just to avoid surprises when that constant is
removed on future versions of Cinnamon.

```

***

- **Date:** Sun, 4 Jun 2017 19:33:13 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sat, 3 Jun 2017 19:33:14 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Fixed an issue that kept an empty label visible on Cinnamon 3.4.x, adding extra spacing to the
elements of the applet when it shouldn't.

```

***

- **Date:** Sat, 3 Jun 2017 09:07:38 +0200
- **Author:** Åke Engelbrektson

```
ExtensionsManager: Update sv.po

```

***

- **Date:** Mon, 29 May 2017 17:09:49 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Mon, 29 May 2017 02:48:21 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Added missing Help item on applet context menu.
- Updated localization template.
- Updated help file due to updated localizations.

```

***

- **Date:** Sun, 28 May 2017 02:00:26 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Updated README, metadata.json file and help file due to new localization.
- Updated localization template and Spanish localization.

```

***

- **Date:** Sun, 28 May 2017 06:49:19 +0200
- **Author:** Åke Engelbrektson

```
ExtensionsManager: add sv.po
Add Swedish translation
```

***

- **Date:** Sat, 27 May 2017 22:34:14 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Updated help file due to updated localization.

```

***

- **Date:** Sat, 27 May 2017 22:02:38 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sat, 27 May 2017 19:51:09 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Mon, 15 May 2017 00:01:52 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Ported the appletHelper.py script to Python 3.
- Better general handling of errors.
- Added a **Debug** context menu item that will help to discover why an extension is not being
loaded by this applet menu.

Closes #75

LANGUAGE  UNTRANSLATED
zh_CN.po  0
es.po     0
cs.po     17
hr.po     11

```

***

- **Date:** Sun, 14 May 2017 18:55:32 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sat, 13 May 2017 20:54:28 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Redesigned help file generation. Now the help file is created from a python script
(create_localized_help.py) from which strings can be extracted by xgettext to be added to the xlet
localization template to be able to localize the content of the help file.

LANGUAGE  UNTRANSLATED
zh_CN.po  14
es.po     0
cs.po     17
hr.po     11

```

***

- **Date:** Mon, 8 May 2017 19:52:37 +0200
- **Author:** muzena

```
0ExtensionsManager@odyseus.ong.hr: update hr.po

```

***

- **Date:** Mon, 8 May 2017 12:19:55 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Updated localization template.

```

***

- **Date:** Sun, 7 May 2017 05:59:11 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Corrected execution permission for appletHelper.py file.

```

***

- **Date:** Sat, 6 May 2017 08:26:38 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Cleaned up metadata.json file.

```

***

- **Date:** Fri, 5 May 2017 13:26:59 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Minor code tweaks.

```

***

- **Date:** Thu, 4 May 2017 02:45:35 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Added option to set a custom icon size for the extension option buttons. This serves to avoid the
enabling/disabling of extensions when one clicks accidentally (because of too small icons) an option
button.
- Changed the name of all custom icons to avoid possible conflicts with icons imported by other
xlets.
- Some code clean up.
- Updated changelog

```

***

- **Date:** Thu, 4 May 2017 00:10:48 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Updated localization template.
- Updated metadata.json file.

```

***

- **Date:** Sun, 30 Apr 2017 15:00:13 +0200
- **Author:** muzena

```
Update hr.po

```

***

- **Date:** Sun, 30 Apr 2017 02:05:02 -0300
- **Author:** Odyseus

```
Extensions Manager applet
- Removed *multiversion* because it is not worth the trouble.
- Moved some prototypes into a separate "modules file".
- Removed the use of *get_file_contents_utf8_sync* in favor of an asynchronous function to avoid the
*dangerous* flag.
- Fixed a warning logged into the *.xsession-errors* file on initial applet load.

```

***

- **Date:** Thu, 13 Apr 2017 13:43:04 -0300
- **Author:** Odyseus

```
Extensions Manager applet - Added localized help.

```

***

- **Date:** Sat, 18 Mar 2017 04:09:21 -0300
- **Author:** Odyseus

```
Merge pull request #31 from giwhub/giwhub-patch-2
Add Chinese for Extensions Manager
```

***

- **Date:** Wed, 15 Mar 2017 22:46:50 +0800
- **Author:** giwhub

```
Create zh_CN.po

```

***

- **Date:** Sat, 11 Mar 2017 00:39:05 -0300
- **Author:** Odyseus

```
Extensions Manager applet - Fixed incorrect setting name that prevented the correct update of the
enabled/disabled extensions on this applet menu.

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

- **Date:** Mon, 2 Jan 2017 07:25:00 -0300
- **Author:** Odyseus

```
[Extensions Manager applet] - Added Czech localization. Thanks to
[Radek71](https://github.com/Radek71). Closes #14 - Added some missing strings that needed to be
translated.

```

***

- **Date:** Fri, 9 Dec 2016 09:35:58 -0300
- **Author:** Odyseus

```
[Extensions Manager applet] - Some fixes/improvements for Cinnamon 3.2.x.

```

***

- **Date:** Sat, 26 Nov 2016 05:15:47 -0300
- **Author:** Odyseus

```
[Extensions Manager applet] - Reverted back to use Python 2 on the helper script and force to use
Python 2 to execute it.

```

***

- **Date:** Mon, 14 Nov 2016 08:40:23 -0300
- **Author:** Odyseus

```
[Extensions Manager applet] - Fixed initial detection of extensions with multi version enabled
- Removed unnecessary directory.

```

***

- **Date:** Sun, 13 Nov 2016 16:21:36 -0300
- **Author:** Odyseus

```
[Extensions Manager applet] Initial release.

```

***
