[Mint-X/cinnamon] SASS conversion, massive clean up, fixes and minor tweaks

# TL;DR

- Refactored Mint-X Cinnamon theme to SASS. No other theme (gtk2/3, etc) or Cinnamon variant was touched.
- Removed classes/IDs/properties/images that aren't used anymore.
- Fixed several missing styles, duplicated properties, wrongly commented sections, etc.
- This pull request doesn't include fixes/additions from upcoming changes (PRs sent to Cinnamon and not merged yet).
    - [PR#7416](https://github.com/linuxmint/Cinnamon/pull/7416)
    - [PR#7415](https://github.com/linuxmint/Cinnamon/pull/7415)
    - [PR#7391](https://github.com/linuxmint/Cinnamon/pull/7391)
    - [PR#7386](https://github.com/linuxmint/Cinnamon/pull/7386)
    - ...and maybe others.
- Everything removed/added/changed is documented below, along with the reason for the removal/addition/change. Please, feel free to discuss/refute all.

# Details

## About SASS formatting

1. The nesting applied is very basic. I didn't applied any nesting to styles like the panel selectors. That's a can a worms that someone with a lot more experience with SASS should open. LOL
2. There are only two mixins used. Someone with a better mind for it should decide if more mixins are needed.
3. The parse_sass.sh script generates only the **cinnamon.css** file for the *main* Mint-X theme, not its variants. So the theme variants generation still depends on the **generate-themes.py** script.

## Removed classes/IDs/properties

These classes/IDs/properties were removed because they aren't used anymore by any version of Cinnamon that this theme supports.

- **.lg-*** and **#LookingGlassPropertyInspector**: Everything related to these classes and *ID* was removed from Cinnamon back in 2014 ([Cinnamon PR#3779](https://github.com/linuxmint/Cinnamon/pull/3779)). **#LookingGlassDialog** was kept because it's still used by Melange. But the styling of elements *inside* this *ID* (**#Toolbar**, **StScrollBar**, etc.) were removed because it seems that they were also removed.
- **.end-session-dialog-***, **.hotplug-*** and **.polkit-dialog-***: Everything related to these classes was removed from Cinnamon back in 2013 ([Cinnamon commit where these classes were removed from the default theme](https://github.com/linuxmint/Cinnamon/commit/b8d1dbba7cc2a6edc2bc429b82518356ff73bf6d)).
- **.popup-menu** and **.popup-menu-boxpointer**: These classes were left for retro-compatibility with Cinnamon versions under 3.2.x. But since version 3.4.x of Cinnamon, it is not possible to make this theme retro-compatible due to the removal of the programmatically added spacing on the **TextIconApplet** prototype by [Cinnamon PR#6271](https://github.com/linuxmint/Cinnamon/pull/6271). I also checked the applets repository, and none of the applets are using these classes anymore. Please, advice.
- **.menu-category-button-button:hover**: This selector's class never existed. And even if it is a typo meant to style the **menu-category-button-selected** class on hover, its result is horrendous. So, I removed it.
- **#overview-corner**: The hot corner icons were removed by [Cinnamon PR#6423](https://github.com/linuxmint/Cinnamon/pull/6423). The images **overview.png** and **overview-hover.png** were also removed.
- **.panel-button** and **.panel-menu**: This classes usage was removed in this [Cinnamon commit](https://github.com/linuxmint/Cinnamon/commit/91b0b76cdc02d659fa6ea08dbfce95648349395d).
    - The third-party xlet called **Weather** defines the **panel-button** class to be used for styling, [but never really uses it](https://github.com/linuxmint/cinnamon-spices-applets/blob/master/weather%40mockturtl/files/weather%40mockturtl/applet.js#L123).
    - The third-party applet called **CPU Frequency Applet** uses the **panel-button** class [but then it removes it](https://github.com/linuxmint/cinnamon-spices-applets/blob/master/cpufreq%40mtwebster/files/cpufreq%40mtwebster/applet.js#L150).
- **panel-status-button**: Hard to pin-point were this class was removed. My guess is around [Cinnamon PR#4125](https://github.com/linuxmint/Cinnamon/pull/4125). What's easy to realize is that the styles defined in this class are almost the same as the styling for the **applet-box** class. Additionally, the **-natural-hpadding** and **-minimum-hpadding** properties defined in this class are never programmatically applied.
    - Class used by the default applet called **Keyboard** (UUID keyboard@cinnamon.org). I think that this class should be removed from this applet.
- **.label-shadow**: This class is defined by the **TextShadower** prototype. This prototype hasn't been used in Cinnamon [since around 2012](https://github.com/linuxmint/Cinnamon/commit/3f2524048499533393be886cf2c917dfcc539b80) and, if it is usefull to know, it was removed from Gnome Shell [in 2015](333becef45d58be20ea0b9d4404c2c382a9db117). I removed it because [of the comment in this prototype's definition](https://github.com/linuxmint/Cinnamon/blob/master/js/ui/panel.js#L1201), which suggests that the prototype might get removed in case of it not been used anymore (my guess).
- Removed `opacity` and `mouseover-opacity` properties from **#notification** selector. These properties were used before the **Have notifications fade out when hovered over** setting was introduced ([Cinnamon commit](https://github.com/linuxmint/Cinnamon/commit/dae0a218f5cab5fff1ef3b3e52463fb15e0358e2)). Now a days, neither of the properties are used programmatically nor the aforementioned setting exist.


## Fixes

- Added **url-highlighter** class styling: Links inside notifications weren't styled by the theme. They were hard-coded to **#ccccff**, which makes sense for the default theme with black backgrounds (the one called Cinnamon), but made these links practically unreadable on grey backgrounds like the Mint-X themes have.
- Several entry selectors had the **selected-color** property declared twice.
- Several comments that separate sections have a reference to the file that define the classes that are being styled. Most of those comments were wrong (they made reference to the file names from before the *default applets were converted into applets* (somewhere around this [Cinnamon commit](https://github.com/linuxmint/Cinnamon/commit/30d1c580e2de79eaeb7f5da69193898b7df838a5))). I also changed the references to the full path for those files to avoid unnecessary guessing.
- Added **#menu-search-entry** styling: I added it because I found a third party applet that uses this *ID* for an entry, and the entry wasn't styled until I added this styling to the theme. I didn't look any further into the issue and added it.
- Changed all entries **width** and **height** properties to **min-width** and **min-height**. The fixed width didn't allowed the entry to expand horizontally (maybe this is a desired behavior, please discuss). And the fixed height destroyed the entry capability to expand vertically on word wrapping and on multi-line text (I consider this an undesired behavior). I resorted to change this properties directly in the theme due to my impossibility to override these fixed sizes programmatically from JavaScript code.

## Changes (these aren't *fixes* per se)

- **height** properties on entries: All entries had the same **height** (16px), except for the workspace name entries (15px). I simply set to 16px all entries to keep the **entry** mixin simple.
- `rgb()` to `hex` color conversion: This was an unintended change. The `sass-convert` command did this without asking me. It appears that there aren't any side effects due to this conversion (yet).
- Changed  (**cinnamon-link** and **url-highlighter** classes) use the same color as the accent color or a blue tone like the gtk2/3 themes have? Right now all the variants use the same color (**#50a200** (a dark green)).

# Planed changes (not included in this PR)

## Changes that need approval and/or more thought

These are changes that might change the *design concept* of the theme.

1. Should links (**cinnamon-link** and **url-highlighter** classes) use the same color as the accent color or a blue tone like the gtk2/3 themes have? Right now all the variants use the same color (**#50a200** (a dark green)).
2. Should styling for third-party content be removed? I found only one class (**xkcd-box**) that belongs to the third-party desklet with UUID [xkcd@rjanja](https://github.com/linuxmint/cinnamon-spices-desklets/tree/master/xkcd%40rjanja).
3. The label on the Run dialog that reads **Please enter a command:** is hidden in the Mint-X themes. Should I make it visible? I would personally prefer to make it visible. But since it's a change that affects the *design concept* of the theme, I'm asking first.

## *Radical* changes that will need a lot more thought
