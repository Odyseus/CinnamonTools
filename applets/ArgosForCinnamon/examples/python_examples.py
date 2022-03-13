#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import gettext
import os

gettext.bindtextdomain("{{UUID}}", os.path.expanduser("~") + "/.local/share/locale")
gettext.textdomain("{{UUID}}")
_ = gettext.gettext

# TO TRANSLATORS:
# Sentence: "eval, tooltip and alternate examples"
# The words "eval", "tooltip" and "alternate" are attributes
# and aren't meant to be translated.

# TO TRANSLATORS:
# Sentence: "Default item - eval example"
# The word "eval" is an attribute and isn't meant to be translated.

# TO TRANSLATORS: Full sentence:
# The expresion _("%s attributes") % "&lt;span&gt;" becomes "<span> attributes",
# which means "attributes that can be used on
# the Pango tag called span"
print(f"""
{_("Argos line 1")} | iconName=folder dropdown=false
{_("Argos line 2")} | iconName=folder iconIsSymbolic=true dropdown=false
---
<b>{_("eval, tooltip and alternate examples")}</b> | iconName=folder iconSize=24 size=12
--<i><b>{_("Press Alt key to see effect")}</b></i>
--{_("Default item - eval example")} | iconName=folder tooltip='{_("Default item tooltip - Press Alt key to display alternate item")}' eval='imports.ui.main.notify("{_("Default item")}", "{_("Notification activated by default item.")}");'
--{_("Alternate item - eval example")} | iconName=folder iconIsSymbolic=true tooltip='{_("Alternate item tooltip")}' eval='imports.ui.main.notify("{_("Alternate item")}", "{_("Notification activated by alternate item.")}");' alternate=true
--{_("Default - PyGObject API Reference - URL example")} | iconName=folder href='https://lazka.github.io/pgi-docs/'
--{_("Alternate - DistroWatch - URL example")} | iconName=folder iconIsSymbolic=true href='http://distrowatch.com/' alternate=true
---
<b>{_("Menu and submenu examples")}</b> | iconName=folder iconSize=24 size=12
--{_("Sub menu level 2")}
----{_("Sub menu item level 2")}
----{_("Sub menu level 3")}
------{_("Sub menu item level 3")}
------{_("Sub menu level 4")}
--------{_("Sub menu item level 4")}
---
<b>{_("Menu items with icons examples")}</b> | iconName=folder iconSize=24 size=12
--<b><i>{_("A default icon size can be set on the applet settings window")}</i></b>
--{_("Item with a 12 pixels symbolic icon")} | iconName=folder iconSize=12 iconIsSymbolic=true
--{_("Item with a 14 pixels icon")} | iconName=folder iconSize=14
--{_("Item with a 16 pixels symbolic icon")} | iconName=folder iconSize=16 iconIsSymbolic=true
--{_("Item with a 18 pixels icon")} | iconName=folder iconSize=18
--{_("Item with a 20 pixels symbolic icon")} | iconName=folder iconSize=20 iconIsSymbolic=true
---
<b>{_("ANSI colors and emojis examples")}</b> | iconName=folder iconSize=24 size=12
--\033[34m{_("ANSI colors example")} :smile:\033[0m | ansi=true size=20
--\033[30m:smiley_cat: \033[31m:smile_cat: \033[32m:joy_cat: \033[33m:heart_eyes_cat: \033[34m:smirk_cat: \033[35m:kissing_cat: \033[36m:scream_cat: | ansi=true size=20
--\033[30m:smiley: \033[31m:smile: \033[32m:joy: \033[33m:heart_eyes: \033[34m:smirk: \033[35m:kissing: \033[36m:scream: | ansi=true size=20
---
<b>{_("Pango markup examples")}</b> | iconName=folder iconSize=24 size=12
--<b>{_("Convenience tags")}</b> | size=12
--<b>{_("Bold text")}</b> - <i>{_("Italic text")}</i> - <s>{_("Strikethrough text")}</s> - <u>{_("Underline text")}</u> | size=12
--{_("Subscript text")}<sub>{_("Subscript text")}</sub> - {_("Superscript text")}<sup>{_("Superscript text")}</sup> | size=12
--<big>{_("Big text")}</big> - <small>{_("Small text")}</small> - <tt>{_("Monospace font")}</tt> | size=12
--<b>{_("%s attributes") % "&lt;span&gt;"}</b> | size=12
--<span font_weight='bold' bgcolor='#FF0000' fgcolor='#FFFF00'>{_("Background and foreground colors")}</span> | size=12
--<span underline='single' underline_color='#FF0000'>{_("Single underline")}</span> | size=12
--<span underline='double' underline_color='#00FF00'>{_("Double underline")}</span> | size=12
--<span underline='low' underline_color='#FF00FF'>{_("Low underline")}</span> | size=12
--<span underline='error' underline_color='#00FFFF'>{_("Error underline")}</span> | size=12
""")
