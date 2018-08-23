## Old repository history

***

- **Date:** Tue, 4 Jul 2017 19:17:57 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Updated Czech localization. Thanks to [Radek71](https://github.com/Radek71).

```

***

- **Date:** Thu, 8 Jun 2017 01:19:07 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Updated Czech localization.

```

***

- **Date:** Tue, 6 Jun 2017 22:29:58 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Better handling of **Settings.BindingDirection**. Just to avoid surprises when that constant is
removed on future versions of Cinnamon.

```

***

- **Date:** Sun, 4 Jun 2017 19:35:05 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sat, 3 Jun 2017 19:33:30 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Fixed an issue that kept an empty label visible on Cinnamon 3.4.x, adding extra spacing to the
elements of the applet when it shouldn't.

```

***

- **Date:** Sat, 3 Jun 2017 09:06:34 +0200
- **Author:** Åke Engelbrektson

```
PopupTranslator: Update sv.po

```

***

- **Date:** Mon, 29 May 2017 02:51:15 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Fixed a styling inconsistency on the create_localized_help.py script.
- Updated all localization files due to changes in the create_localizaed_help.py script.
- Updated help file due to updated localizations.

```

***

- **Date:** Sat, 27 May 2017 22:34:28 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Updated help file due to updated localization.

```

***

- **Date:** Sat, 27 May 2017 22:02:30 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sat, 27 May 2017 19:52:03 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Wed, 17 May 2017 16:08:42 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Removed CJS 3.4 warnings and fixed errors exposed by the use of CJS 3.4.

LANGUAGE  UNTRANSLATED
zh_CN.po  0
de.po     64
es.po     0
cs.po     64
sv.po     0
ru.po     63
hr.po     63

```

***

- **Date:** Mon, 15 May 2017 00:40:29 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Re-generated help file based on new localizations.

LANGUAGE  UNTRANSLATED
zh_CN.po  0
de.po     64
es.po     0
cs.po     64
sv.po     0
ru.po     63
hr.po     63

```

***

- **Date:** Mon, 15 May 2017 00:19:05 -0300
- **Author:** Odyseus

```
Merge pull request #81 from giwhub/giwhub-patch-2
Update Chinese translations for xlets
```

***

- **Date:** Mon, 15 May 2017 00:05:12 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sun, 14 May 2017 10:45:55 +0200
- **Author:** Åke Engelbrektson

```
Update sv.po

```

***

- **Date:** Sat, 13 May 2017 20:54:56 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Redesigned help file generation. Now the help file is created from a python script
(create_localized_help.py) from which strings can be extracted by xgettext to be added to the xlet
localization template to be able to localize the content of the help file.

LANGUAGE  UNTRANSLATED
zh_CN.po  64
de.po     64
es.po     0
cs.po     64
sv.po     64
ru.po     63
hr.po     63

```

***

- **Date:** Mon, 8 May 2017 13:17:41 +0200
- **Author:** muzena

```
0PopupTranslator@odyseus.ong.hr: update hr.po

```

***

- **Date:** Sun, 7 May 2017 12:50:34 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Added Russian localization. Thanks to [Ilis](https://github.com/Ilis).

```

***

- **Date:** Sun, 7 May 2017 08:40:15 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Removed *multiversion* because it is not worth the trouble. Fixes #60

```

***

- **Date:** Sun, 7 May 2017 06:00:10 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Corrected execution permission for appletHelper.py file. Fixes #58

```

***

- **Date:** Sat, 6 May 2017 08:26:11 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Cleaned up metadata.json file.

```

***

- **Date:** Fri, 5 May 2017 13:27:16 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Minor code tweaks.

```

***

- **Date:** Thu, 4 May 2017 03:21:24 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Fixed Google Translate language detection due to changes on Google's side.

```

***

- **Date:** Sun, 30 Apr 2017 01:07:28 -0300
- **Author:** Odyseus

```
Popup Translator applet
- Updated README and metadata.json file to reflect new localization.

```

***

- **Date:** Sat, 29 Apr 2017 12:25:39 +0200
- **Author:** Åke Engelbrektson

```
Create sv.po
Swedish translation

```

***

- **Date:** Thu, 13 Apr 2017 15:52:02 -0300
- **Author:** Odyseus

```
Popup Translator applet - Added localized help.

```

***

- **Date:** Tue, 7 Mar 2017 22:50:20 +0800
- **Author:** giwhub

```
Create zh_CN.po

```

***

- **Date:** Sun, 19 Feb 2017 12:41:46 -0300
- **Author:** Odyseus

```
Popup Translator applet - Updated German and Czech localizations.

```

***

- **Date:** Sun, 12 Feb 2017 00:51:31 -0300
- **Author:** Odyseus

```
Popup Translator applet - Fixed keybindings not registered on applet initialization
- Implemented 4 different translation mechanisms that will allow to have various translation options
at hand without the need to constantly change the applet settings. Read the HELP.md file for more
details (It can be accessed from this applet context menu)
- Re-designed the translation history mechanism to be *smarter*. Now, if, for example, a string is
translated into four different languages, the strings will be stored into four different entries in
the translation history
- Re-designed the translation history window. Now, only one instance of the history window can be
opened at the same time. Removed **Reload** button in favor of auto-update of the history window
content every time the translation history changes and the translation window is open
- Moved some of the context menu entries into a sub-menu
- Removed unused import from appletHelper.py file
- Added new icons to the icons folder that represent the translation services used by this applet
- Added debugging options to facilitate development
- Added LICENSE.md file to applet.

```

***

- **Date:** Mon, 6 Feb 2017 18:14:08 -0300
- **Author:** Odyseus

```
Popup Translator applet - Fixed keybinding display on applet tooltip.

```

***

- **Date:** Fri, 3 Feb 2017 14:05:11 -0300
- **Author:** Odyseus

```
Popup Translator applet - Added German localization. Thanks to
[NikoKrause](https://github.com/NikoKrause).

```

***

- **Date:** Thu, 2 Feb 2017 17:33:00 -0300
- **Author:** Odyseus

```
Popup Translator applet - Added Czech localization. Thanks to [Radek71](https://github.com/Radek71).
Closes #21 - Added missing translatable strings
- Improved clean up when removing applet.

```

***

- **Date:** Wed, 1 Feb 2017 15:23:43 -0300
- **Author:** Odyseus

```
Popup Translator applet - First stable version
- Initial Spices publication.

```

***
- **Date:** Tue, 31 Jan 2017 15:32:16 -0300
- **Author:** Odyseus

```
Popup Translator applet - Sixth prototype
- Removed the history.ui file and placed its content inside the appletHelper.py file
- Translatable strings untouched.

```

***

- **Date:** Sun, 29 Jan 2017 14:55:52 -0300
- **Author:** Odyseus

```
Popup Translator applet - Fifth prototype
- Tested on Cinnamon 2.8.8, 3.0.7 and 3.2.8
- Translatable strings might need corrections.

```

***

- **Date:** Sun, 29 Jan 2017 08:52:57 -0300
- **Author:** Odyseus

```
Popup Translator applet - Fourth prototype.

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

- **Date:** Tue, 24 Jan 2017 09:27:42 -0300
- **Author:** Odyseus

```
Popup Translator - Third prototype.

```

***

- **Date:** Mon, 23 Jan 2017 04:51:14 -0300
- **Author:** Odyseus

```
Popup Translator - Second prototype.

```

***

- **Date:** Sun, 22 Jan 2017 20:29:22 -0300
- **Author:** Odyseus

```
Applets - Formatted repository to conform Spices repository.

```

***

- **Date:** Sun, 15 Jan 2017 05:42:06 -0300
- **Author:** Odyseus

```
[Popup Translator applet] - Initial prototype.

```

***
