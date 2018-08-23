
## Theme description

This theme is basically the default **Mint-X** theme with some graphics (check/radio boxes, switch buttons, etc.) from the **Mint-Y** theme.

## Compatibility

- ![Cinnamon 2.8](https://odyseus.gitlab.io/CinnamonTools/lib/badges/cinn-2.8.svg) ![Linux Mint 17.3](https://odyseus.gitlab.io/CinnamonTools/lib/badges/lm-17.3.svg)
- ![Cinnamon 3.0](https://odyseus.gitlab.io/CinnamonTools/lib/badges/cinn-3.0.svg) ![Linux Mint 18](https://odyseus.gitlab.io/CinnamonTools/lib/badges/lm-18.svg)
- ![Cinnamon 3.2](https://odyseus.gitlab.io/CinnamonTools/lib/badges/cinn-3.2.svg) ![Linux Mint 18.1](https://odyseus.gitlab.io/CinnamonTools/lib/badges/lm-18.1.svg)
- ![Gtk 3.18](https://odyseus.gitlab.io/CinnamonTools/lib/badges/gtk-3.18.svg)

<span style="color:red; font-weight: bold;">
If your system has any other version of gtk3 installed, all gtk3 applications' style will be broken (gkt3 versions 3.20 and 3.22) or your .xsession-errors file will be flooded with hundreds of warnings (gtk3 version 3.10).
</span>

## Differences with the Mint-X theme family

- GTK2/GTK3 themes:
    - Restored all removed scroll bars arrows.
    - Restored all removed outlines from focused elements.
    - Removed dashed lines feedback from scrolled views (affects GTK3 applications only).
    - Changed the tooltips appearance of the GTK2 theme to look like the GTK3 tooltips.
- Cinnamon theme:
    - Changed the tooltips appearance to look like the GTK3 tooltips.
    - Changed the switches appearance to look like the GTK3 switches.
    - Removed fixed sizes for entries inside menus.
    - Removed centered text styling in tooltips (!!!).
    - Removed a lot of unnecessary/unused styles.


## Detailed Cinnamon theme changes/fixes

### Removed classes/IDs/properties

These classes/IDs/properties were removed because they aren't used anymore by any version of Cinnamon that this theme supports.

- **.lg-*** and **#LookingGlassPropertyInspector**: Everything related to these classes and *ID* was removed from Cinnamon back in 2014 ([Cinnamon PR#3779](https://github.com/linuxmint/Cinnamon/pull/3779)). **#LookingGlassDialog** was kept because it's still used by Melange. But the styling of elements *inside* this *ID* (**#Toolbar**, **StScrollBar**, etc.) were removed because it seems that they were also removed.
- **.end-session-dialog-***, **.hotplug-*** and **.polkit-dialog-***: Everything related to these classes was removed from Cinnamon back in 2013 ([Cinnamon commit where these classes were removed from the default theme](https://github.com/linuxmint/Cinnamon/commit/b8d1dbba7cc2a6edc2bc429b82518356ff73bf6d)).
- **.popup-menu** and **.popup-menu-boxpointer**: These classes were left for retro-compatibility with Cinnamon versions under 3.2.x. But since version 3.4.x of Cinnamon, it is not possible to make this theme retro-compatible due to the removal of the programmatically added spacing on the **TextIconApplet** prototype by [Cinnamon PR#6271](https://github.com/linuxmint/Cinnamon/pull/6271). I also checked the applets repository, and none of the applets are using these classes anymore.
- **.menu-category-button-button:hover**: This selector's class never existed. And even if it is a typo meant to style the **menu-category-button-selected** class on hover, its result is horrendous. So, I removed it.
- **#overview-corner**: The hot corner icons were removed by [Cinnamon PR#6423](https://github.com/linuxmint/Cinnamon/pull/6423). The images **overview.png** and **overview-hover.png** were also removed.
- **.panel-button** and **.panel-menu**: This classes usage was removed in this [Cinnamon commit](https://github.com/linuxmint/Cinnamon/commit/91b0b76cdc02d659fa6ea08dbfce95648349395d).
    - The third-party xlet called **Weather** defines the **panel-button** class to be used for styling, [but never really uses it](https://github.com/linuxmint/cinnamon-spices-applets/blob/master/weather%40mockturtl/files/weather%40mockturtl/applet.js#L123).
    - The third-party applet called **CPU Frequency Applet** uses the **panel-button** class [but then it removes it](https://github.com/linuxmint/cinnamon-spices-applets/blob/master/cpufreq%40mtwebster/files/cpufreq%40mtwebster/applet.js#L150).
- **.panel-status-button**: Hard to pin-point were this class was removed. My guess is around [Cinnamon PR#4125](https://github.com/linuxmint/Cinnamon/pull/4125). What's easy to realize is that the styles defined in this class are almost the same as the styling for the **applet-box** class. Additionally, the **-natural-hpadding** and **-minimum-hpadding** properties defined in this class are never programmatically applied.
    - Class used by the default applet called **Keyboard** (UUID keyboard@cinnamon.org). I think that this class should be removed from this applet.
- **.label-shadow**: This class is defined by the **TextShadower** prototype. This prototype hasn't been used in Cinnamon [since around 2012](https://github.com/linuxmint/Cinnamon/commit/3f2524048499533393be886cf2c917dfcc539b80) and, if it is usefull to know, it was removed from Gnome Shell [in 2015](333becef45d58be20ea0b9d4404c2c382a9db117). I removed it because [of the comment in this prototype's definition](https://github.com/linuxmint/Cinnamon/blob/master/js/ui/panel.js#L1201), which suggests that the prototype might get removed in case of it not been used anymore (my guess).
- Removed `opacity` and `mouseover-opacity` properties from **#notification** selector. These properties were used before the **Have notifications fade out when hovered over** setting was introduced ([Cinnamon commit](https://github.com/linuxmint/Cinnamon/commit/dae0a218f5cab5fff1ef3b3e52463fb15e0358e2)). Now a days, neither of the properties are used programmatically nor the aforementioned setting exist.
- Removed **xkcd-box** class styling. I found only one class (**xkcd-box**) that belongs to the third-party desklet with UUID [xkcd@rjanja](https://github.com/linuxmint/cinnamon-spices-desklets/tree/master/xkcd%40rjanja).

- Removed **#panel-launcher-box**: This *ID* was removed and replaced with the **panel-launchers** class ([Cinnamon commit](https://github.com/linuxmint/Cinnamon/commit/7158824c25a5ee6a586568ddeb8c4b93e8432239)).
- Removed **.panel-launcher-add-dialog-***: This classes usage were removed [around 2012](https://github.com/linuxmint/Cinnamon/commit/daa013de8ca8e4d22c04b569319dc4a47fa58392).

### Fixes

Fixed missing styles, duplicated properties and wrong references in comments

- Added **url-highlighter** class styling: Links inside notifications weren't styled by the theme. They were hard-coded to **#ccccff**, which makes sense for the default theme with black backgrounds (the one called Cinnamon), but made these links practically unreadable on grey backgrounds like the Mint-X themes have.
- Added support for the **progress** class. Class used by the overlay that display a progress indicator on the window list items.
- Several entry selectors had the **selected-color** property declared twice.
- Several comments that separate sections have a reference to the file that define the classes that are being styled. Some of those comments were wrong (they made reference to the file names from before the *default applets were converted into applets* (somewhere around this [Cinnamon commit](https://github.com/linuxmint/Cinnamon/commit/30d1c580e2de79eaeb7f5da69193898b7df838a5))). For the sake of completeness, I also added references to the sections that didn't have them.


- Added **#menu-search-entry** styling: I added it because I found a third party applet that uses this *ID* for an entry, and the entry wasn't styled until I added this styling to the theme. I didn't look any further into the issue and added it.


- Changed all entries **width** and **height** properties to **min-width** and **min-height**. The fixed width didn't allowed the entry to expand horizontally (maybe this is a desired behavior, please discuss). And the fixed height destroyed the entry capability to expand vertically on word wrapping and on multi-line text (I consider this an undesired behavior). I resorted to change this properties directly in the theme due to my impossibility to override these fixed sizes programmatically from JavaScript code.
- The label on the Run dialog that reads **Please enter a command:** was hidden in the Mint-X themes. I made it visible.

### Changes (these aren't *fixes* per se)

- **height** properties on entries: All entries had the same **height** (16px), except for the workspace name entries (15px). I simply set to 16px all entries to keep the **entry** mixin simple.
- `rgb()` to `hex` color conversion: This was an unintended change. The `sass-convert` command did this without asking me. It appears that there aren't any side effects due to this conversion (yet).
- Changed links colors (**cinnamon-link** and **url-highlighter** classes) to use the same color as the accent color.

- Changed the sound player design to be more in-line with the *design concept* of the Mint-X theme. It didn't made much sense having the sound player with black background and grey elements when every single aspect of the entire theme was having grey backgrounds with black elements.


- Changed the **height** for entries inside menus (**.menu StEntry** selector) to **min-height**. The the fixed height destroyed the entry capability to expand vertically on word wrapping and on multi-line text. I resorted to change this properties directly in the theme due to my impossibility to override these fixed sizes programmatically from JavaScript code (from inside an xlet code).




#### Clean up unused styles.

- Removed **#panel-launcher-box**: This *ID* was removed and replaced with the **panel-launchers** class ([Cinnamon commit](https://github.com/linuxmint/Cinnamon/commit/7158824c25a5ee6a586568ddeb8c4b93e8432239)).
- Removed **.panel-launcher-add-dialog-***: These classes usage were removed [around 2012](https://github.com/linuxmint/Cinnamon/commit/daa013de8ca8e4d22c04b569319dc4a47fa58392).

- Removed **.workspace-controls**, **.workspace-thumbnails-background**, **.workspace-thumbnail-indicator**, **.icon-grid** and **.overview-icon**: These classes usage were removed around 2012 ([#1](https://github.com/linuxmint/Cinnamon/commit/0bdbd02741dacb753bf576e93440d1127b8bdb45), [#2](https://github.com/linuxmint/Cinnamon/commit/379f1663025d0b9dee654a745ab0a79c75e62e19), [#3](https://github.com/linuxmint/Cinnamon/commit/79adc709b9351d880c9b07a8ec1b50ff76d5f44d)).
- Removed **.menu-places-box** and **.menu-places-button**: These two classes seem to never have been applied to any element in the menu applet. The places buttons on the menu uses the generic class **menu-application-button** which are placed inside the box with the **menu-applications-box** class.
- Removed **#workspaceSwitcher**: This was removed when the Workspace switcher was converted into a *real applet* [around 2012](https://github.com/linuxmint/Cinnamon/commit/26ab3695e82e7911680df303d1230072cf304107).

#### Sound applet: player style homogenization.

- Changed the sound player design to be more in-line with the *design concept* of the Mint-X theme. It didn't made much sense having the sound player with black background and grey elements when every single aspect of the entire theme was having grey backgrounds with black elements.

![soundappletbeforeafter](https://user-images.githubusercontent.com/3822556/38194565-a2bcb8ec-364e-11e8-92fb-7248eb96fed2.png)

#### Removed fixed height of entries inside menus.

- Changed the **height** for entries inside menus (**.menu StEntry** selector) to **min-height**. The the fixed height destroyed the entry capability to expand vertically on word wrapping and on multi-line text. I resorted to change this properties directly in the theme due to my impossibility to override these fixed sizes programmatically from JavaScript code (from inside an xlet code).
