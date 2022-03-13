## Old repository history

***

- **Date:** Tue, 15 Aug 2017 05:36:01 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Updated Czech localization. Thanks to [Radek71](https://github.com/Radek71).

```

***

- **Date:** Sat, 29 Jul 2017 22:15:16 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Tue, 4 Jul 2017 19:18:58 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extensions
- Updated Czech localization. Thanks to [Radek71](https://github.com/Radek71).

```

***

- **Date:** Thu, 8 Jun 2017 01:36:50 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Corrected Markdown formatting on some links of the Czech localization.

```

***

- **Date:** Thu, 8 Jun 2017 00:58:34 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Updated Czech localization.

```

***

- **Date:** Tue, 6 Jun 2017 22:32:31 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Better handling of **Settings.BindingDirection**. Just to avoid surprises when that constant is
removed on future versions of Cinnamon.
- Windows decorations removal tweak. Added option to handle invisible windows problem. On the
original Maximus extension (by fmete) I changed one of the _MOTIF_WM_HINTS flags from 0x2 to 0x0 to
avoid having a border at the top of a maximized window with its title bar removed. This was working
perfectly fine until Cinnamon 3.4. On Cinnamon 3.4, setting that flag to 0x0 would result on windows
that started maximized and with their title bars removed to become invisible. I simply added an
option for people using Cinnamon 3.4 or greater to change that flag.

```

***

- **Date:** Mon, 5 Jun 2017 16:39:48 -0300
- **Author:** Odyseus

```
Update da.po

```

***

- **Date:** Mon, 5 Jun 2017 14:31:37 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Updated help file due to updated localization.

```

***

- **Date:** Mon, 5 Jun 2017 19:30:56 +0200
- **Author:** Alan01

```
Fixed typo

```

***

- **Date:** Mon, 5 Jun 2017 19:23:49 +0200
- **Author:** Alan01

```
Fixed translation omission

```

***

- **Date:** Sun, 4 Jun 2017 19:47:39 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sat, 3 Jun 2017 08:46:13 +0200
- **Author:** Åke Engelbrektson

```
CinnamonTweaks: Update sv.po

```

***

- **Date:** Wed, 31 May 2017 03:26:21 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Updated help file due to new localization.

```

***

- **Date:** Tue, 30 May 2017 21:15:43 +0200
- **Author:** Alan01

```
Create da.po

```

***

- **Date:** Tue, 30 May 2017 19:55:50 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sat, 27 May 2017 22:38:05 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Updated help file due to updated localization.

```

***

- **Date:** Sat, 27 May 2017 22:01:17 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sat, 27 May 2017 19:59:11 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Thu, 25 May 2017 21:01:41 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Updated HELP.html file due to new localization.

```

***

- **Date:** Thu, 25 May 2017 21:44:08 +0200
- **Author:** Åke Engelbrektson

```
CinnamonTweaks: create sv.po
Add Swedish translation
```

***

- **Date:** Mon, 15 May 2017 22:53:19 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Removed CJS 3.4 warnings.

LANGUAGE  UNTRANSLATED
zh_CN.po  0
es.po     0
cs.po     96
hr.po     93

```

***

- **Date:** Mon, 15 May 2017 14:09:33 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Re-generated help file based on new localizations.

LANGUAGE  UNTRANSLATED
zh_CN.po  0
es.po     0
cs.po     96
hr.po     93

```

***

- **Date:** Mon, 15 May 2017 22:35:34 +0800
- **Author:** giwhub

```
Update zh_CN.po

```

***

- **Date:** Sat, 13 May 2017 20:58:40 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Redesigned help file generation. Now the help file is created from a python script
(create_localized_help.py) from which strings can be extracted by xgettext to be added to the xlet
localization template to be able to localize the content of the help file.

LANGUAGE  UNTRANSLATED
zh_CN.po  94
es.po     0
cs.po     96
hr.po     93

```

***

- **Date:** Mon, 8 May 2017 13:26:23 +0200
- **Author:** muzena

```
0CinnamonTweaks@odyseus.ong.hr: update hr.po

```

***

- **Date:** Sun, 7 May 2017 19:33:46 +0800
- **Author:** giwhub

```
Cinnamon Tweaks extension
- Updated Chinese localization.

```

***

- **Date:** Sat, 6 May 2017 08:20:25 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Cleaned up metadata.json file.
- Some minor code clean up.
- Updated localization template.

```

***

- **Date:** Sat, 6 May 2017 04:48:00 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Updated help file to provide information about an alternative method to hide the window
decorations of maximized windows.

```

***

- **Date:** Fri, 5 May 2017 13:31:38 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Minor code tweaks.

```

***

- **Date:** Thu, 4 May 2017 10:36:06 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Fixed a warnings logged into the .xsession-errors file.
- Fixed a wrong dependency key set on the settings window.
- Added a button to display a test notification to the **Notifications Tweaks** section of the
settings window. This will allow us to test the notifications when we are tweaking the
notification's position.

```

***

- **Date:** Sun, 30 Apr 2017 01:01:16 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Cleaned metadata.json file.

```

***

- **Date:** Thu, 27 Apr 2017 17:56:01 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension
- Fixed spelling error on Spanish localization.
- Fixed error on *Tooltips show delay* function for Cinnamon 3.2.x caused by a wrong callback call.
- Fixed an error on the *Auto move windows* tweak caused by lack of context.
- Fixed the keybinding registration for the *Window focus tweaks* caused by the move from Cinnamon's
native settings system to gsettings.

```

***

- **Date:** Thu, 27 Apr 2017 01:45:27 +0800
- **Author:** giwhub

```
Create zh_CN.po

```

***

- **Date:** Mon, 17 Apr 2017 13:38:12 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension - Updated changelog.

```

***

- **Date:** Fri, 14 Apr 2017 11:14:46 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension - Added localized help.

```

***

- **Date:** Wed, 5 Apr 2017 19:09:56 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension - Updated Czech localization.

```

***

- **Date:** Wed, 5 Apr 2017 23:55:49 +0200
- **Author:** gogogogi

```
0CinnamonTweaks@odyseus.ong: update hr.po (#37)
* 0CinnamonTweaks@odyseus.ong: update hr.po
```

***

- **Date:** Wed, 5 Apr 2017 04:53:00 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension - Added some missing translatable strings
- Changed some default sizes for windows/dialogs to better accommodate strings from verbose
languages
- Changed the contributors key on the metadata.json file for easier reviewing and better legibility
- Reworked the About dialog to add more information and to display the contributors section
translated.

```

***

- **Date:** Sat, 1 Apr 2017 15:12:04 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension - Some tweaks to the settings.py file
- Updated screenshot.png file
- Updated help file.

```

***

- **Date:** Tue, 28 Mar 2017 12:33:26 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension - Added some more details to the help file
- Some tweaks to the About dialog on the settings window.

```

***

- **Date:** Tue, 28 Mar 2017 00:10:53 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension - Added *Window decorations removal* option (a.k.a. Maximus). Allows to
remove the windows decorations from maximized/half-maximized/tiled windows
- Added *Auto move windows* tweak. This tweak enables the ability to set rules to open determined
applications on specific workspaces
- Fixed *Tooltips show delay* on Cinnamon 3.2.x. Now it actually works
- Redesigned again the settings window. This time, I changed from a vertical layout to an horizontal
one to make better use of the available space.

```

***

- **Date:** Wed, 22 Mar 2017 23:03:10 -0300
- **Author:** Odyseus

```
Cinnamon Tweaks extension - Redesigned extension to a custom settings system using gsettings. The
reason behind this is that, with the introduction of the new windows shadows tweaks, the extension
needed a custom widget to be able to configure the custom shadow values, something that the
Cinnamon's native settings system isn't able to do just yet
- Removed *multiversion* option from extension. It's not needed anymore
- Added windows shadows tweaks.

```

***
- **Date:** Fri, 27 Jan 2017 11:58:09 -0300
- **Author:** Odyseus

```
Extensions - Cleaned up irrelevant files
- Updated READMEs
- Updated metadata.json
- Updated some icons.

```

***

- **Date:** Sun, 22 Jan 2017 23:43:00 -0300
- **Author:** Odyseus

```
Extensions - Fixed some broken links
- Fixed wrong author name on info.json files.

```

***

- **Date:** Sun, 22 Jan 2017 21:51:40 -0300
- **Author:** Odyseus

```
Extensions - Formatted repository to conform Spices repository.

```

***

- **Date:** Wed, 4 Jan 2017 08:38:17 -0300
- **Author:** Odyseus

```
[Cinnamon Tweaks extension] - Added Czech localization. Thanks to
[Radek71](https://github.com/Radek71). Closes #15

```

***

- **Date:** Fri, 25 Nov 2016 06:50:13 -0300
- **Author:** Odyseus

```
[Cinnamon Tweaks extension] - Added popup menus tweaks. Allows to change the behaviour of the
applets menus
- Added desktop tweaks. Allows to drag applications from the menu or from the launchers applets into
the desktop.

```

***

- **Date:** Thu, 17 Nov 2016 15:25:46 -0300
- **Author:** Odyseus

```
[Cinnamon Tweaks extension] - Fixed duplication of context menu items after moving an applet in
panel edit mode.

```

***

- **Date:** Wed, 16 Nov 2016 13:18:25 -0300
- **Author:** Odyseus

```
[Cinnamon Tweaks extension] - Added **Tooltips** tweaks (affect only Cinnamon's UI tooltips).     -
The tooltips can have a custom show delay (system default is 300 milliseconds).     - The tooltips
position can be moved to be aligned to the bottom right corner of the mouse cursor, avoiding the
cursor to overlap the tooltip text. This tweak is available only for Cinnamon versions older than
3.2
- Added the posibility to display 2 new menu items to the context menu for applets/desklets.     -
**Open applet/desklet folder:** this context menu item will open the folder belonging to the
applet/desklet with the default file manager.     - **Edit applet/desklet main file:** this context
menu item will open the applet's main file (applet.js) or the desklet's main file (desklet.js) with
the default text editor.

```

***

- **Date:** Fri, 21 Oct 2016 17:39:55 -0300
- **Author:** Odyseus

```
[Cinnamon Tweaks extension] - Added **Hot Corners** tweaks (hover activation delay).

```

***

- **Date:** Wed, 12 Oct 2016 11:29:50 -0300
- **Author:** Odyseus

```
[Cinnamon Tweaks extension] - Refactored extension code to allow easy updates/maintenance
- Added support for localizations. If someone wants to contribute with translations, the Help.md
file inside this extension folder has some pointers on how to do it
- Re-enabled show/hide animation for notifications on the bottom. Now the animation plays in the
right directions
- Now the distance from panel can be set for notifiations shown at the bottom and at the top
- Added option to disable notifications animation
- Added option to customize the notification right margin
- Merged functionality from [Window demands attention
behavior](https://cinnamon-spices.linuxmint.com/extensions/view/40) extension.

```

***

- **Date:** Sun, 9 Oct 2016 04:26:28 -0300
- **Author:** Odyseus

```
[Cinnamon Tweaks extension] Minor corrections. Added screenshot. Added link to Spices in main
README.

```

***

- **Date:** Sat, 8 Oct 2016 07:21:04 -0300
- **Author:** Odyseus

```
[Cinnamon Tweaks extension] Initial release.

```

***
