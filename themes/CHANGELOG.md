## Themes changelog

***

**Date:** Sat, 12 Mar 2022 22:38:30 -0300<br/>
**Commit:** [9ad1910](https://gitlab.com/Odyseus/CinnamonTools/commit/9ad1910)<br/>
**Author:** Odyseus<br/>

- Mayor changes towards homogenization.
- Removed all retro-compatible code. Cinnamon versions older than 5.0 and Gtk 3 versions older than 3.22 are no longer supported.
- Added Gtk 4 theme. Not tested at all.
- Removed support for all Sass implementations in favor of using only Dart Sass. SassC and node-sass are deprecated.
- Converted the Gtk 3 theme to Sass.
- Less use of images to style elements in favor of pure CSS.
- Minified/Optimized all images.
- More configuration options.
    - Added the **theme/theme_config.yaml** file as a global configuration file for themes.
    - Added more variants.
    - The removal of scrollbar arrows and undershoots is no longer forced.
    - It is no longer needed to interactively specify complex CSS property values in the terminal when building themes.
    - Tooltips background/foreground colors and opacity can be changed.

#### Gtk 3 theme specifics

- Homogenization changes.
    - All sidebars are styled the same.
    - Lightened by about 25% the background color of active buttons. It greatly reduced the contrast of the button labels and icons.
    - Implemented the mixin used by the Adwaita theme for checks and radios. Now all checks and radios across all themes (Gtk2/3/4 and Cinnamon) are rendered almost exactly the same.
    - Changed the rendering of switches to not use images.
- Additions:
    - Added suggested/destructive actions styling.
    - Added :drop() state handling.
    - Added handling of previously not handled widgets inside containers with the `linked` CSS class (`spinbutton` and `filechooserbutton`).
- Fixes:
    - Fixed missing notebook tabs borders. I don't remember how did I fix this. LOL
    - Fixed checked notebook tabs "dancing labels" (LOL). They had the `border-<position>` properties set to `transparent` (it removed the border). I fixed it by setting the `border-<position>` property to `none` and then adding a padding to the tab label.

***

**Date:** Mon, 10 Feb 2020 22:49:20 -0300<br/>
**Commit:** [212a45b](https://gitlab.com/Odyseus/CinnamonTools/commit/212a45b)<br/>
**Author:** Odyseus<br/>

- Fixed styling of `Gtk.FlowBox`es and `Gtk.FlowBoxChild`s. (Upstream fix)

***

**Date:** Wed, 29 Jan 2020 18:25:30 -0300<br/>
**Commit:** [9fd6766](https://gitlab.com/Odyseus/CinnamonTools/commit/9fd6766)<br/>
**Author:** Odyseus<br/>

- Added styling for the close/maximize/minimize buttons of header bars for the Gtk 3.18 version of the Gtk 3 theme. Now they look like the Gtk 3.22 version, which at the same time look like the buttons of the Metacity theme.
- Reorganized the assets of the Gtk 3 themes to be reusable. There were a lot of duplicated images.

***

**Date:** Tue, 28 Jan 2020 01:26:20 -0300<br/>
**Commit:** [358faf5](https://gitlab.com/Odyseus/CinnamonTools/commit/358faf5)<br/>
**Author:** Odyseus<br/>

- Added some basic styling to the Gtk 3.18 theme for GtkStackSidebar.

***

**Date:** Fri, 24 Jan 2020 03:11:30 -0300<br/>
**Commit:** [bfb68de](https://gitlab.com/Odyseus/CinnamonTools/commit/bfb68de)<br/>
**Author:** Odyseus<br/>

- Gtk3 theme: Fixed wrongly colored header bars.
- Cinnamon:
    - Added new class that will be available on next Cinnamon version.
    - Added missing cinnamon.css files that was removed due to incorrect rules on the .gitignore file.

***

**Date:** Tue, 16 Jul 2019 00:48:05 -0300<br/>
**Commit:** [ddee4ac](https://gitlab.com/Odyseus/CinnamonTools/commit/ddee4ac)<br/>
**Author:** Odyseus<br/>

- Added support for Cinnamon 4.2.x. There is a new class for spacer applets.
- Cinnamon theme SASS sources:
    - Changed the type of certain comments so they don't show up in the built CSS files.
    - Moved some comments inside conditions so they aren't added to the built CSS files.
    - Changed the ridiculous huge size of the **notification-icon-button** class.
    - Unified some styles used by button classes.

***

**Date:** Mon, 15 Apr 2019 20:29:39 -0300<br/>
**Commit:** [81bd8b3](https://gitlab.com/Odyseus/CinnamonTools/commit/81bd8b3)<br/>
**Author:** Odyseus<br/>

- Exposed for configuration the shadow for client side decorated windows on the Gtk3 theme.

***

**Date:** Mon, 18 Feb 2019 00:24:45 -0300<br/>
**Commit:** [b0424f0](https://gitlab.com/Odyseus/CinnamonTools/commit/b0424f0)<br/>
**Author:** Odyseus<br/>

- Removed color definition from the `.popup-alternating-menu-item:alternate` selector on the Cinnamon theme. The definition of this color was overwriting the color set by the `active`, `hover`, etc. pseudo classes. Setting the font weight to bold is enough to differentiate an alternate item from a primary one.

***

**Date:** Tue, 1 Jan 2019 13:32:50 -0300<br/>
**Commit:** [4e9a380](https://gitlab.com/Odyseus/CinnamonTools/commit/4e9a380)<br/>
**Author:** Odyseus<br/>

- Cinnamon theme:
    - Removed italic styling from the menu-category-button-greyed class. This class is applied to the category buttons in the Cinnamon menu applet when performing searches. Every time that a search was performed, the italic styling changed the size of the categories box (ultra ANNOYING!!!). A lighter color for the font is good enough to represent a disabled button.

***

**Date:** Sat, 22 Dec 2018 17:48:26 -0300<br/>
**Commit:** [84c5bbe](https://gitlab.com/Odyseus/CinnamonTools/commit/84c5bbe)<br/>
**Author:** Odyseus<br/>

- Cinnamon theme: changed fixed font size for the run-dialog-completion-box class to a relative font size.

***

**Date:** Fri, 21 Dec 2018 14:30:45 -0300<br/>
**Commit:** [4523cb5](https://gitlab.com/Odyseus/CinnamonTools/commit/4523cb5)<br/>
**Author:** Odyseus<br/>

- Cinnamon theme: fixed erroneous styling of items from the grouped window applet when this applet is placed in the bottom panel.

***

**Date:** Mon, 17 Dec 2018 15:37:18 -0300<br/>
**Commit:** [3665405](https://gitlab.com/Odyseus/CinnamonTools/commit/3665405)<br/>
**Author:** Odyseus<br/>

- Metacity theme:
    - Fixed attached dialog titlebar. (Upstream fix)
- Gtk3 theme:
    - Properly place the "grab" area for pane separators. (Upstream fix)
    - Style new overview classes. (Upstream fix)
    - Improve the titlebar styling. (Upstream fix)
    - Special case some headerbars. (Upstream fix)
    - Don't use pure white for file managers sidebar foregrounds. (Upstream fix)
    - Fixed some missing commas.
    - Eradication of single quotes.
    - Fixed some white space inconsistencies.
- Cinnamon theme:
    - Added support for the grouped window list applet. (Upstream fix)
    - Use square menu favorites buttons. (Upstream fix)
    - Center align text in applets. (Upstream fix)
    - Updated the parse_sass.py script to generate on-the-fly from a template the SASS files used to build the Cinnamon theme CSS files.
    - Restructured SASS files to avoid breakages caused by mediocre code formatters.

***

**Date:** Mon, 3 Sep 2018 01:08:22 -0300<br/>
**Commit:** [ac665a3](https://gitlab.com/Odyseus/CinnamonTools/commit/ac665a3)<br/>
**Author:** Odyseus<br/>

- Eradicated the usage of SASS (the Ruby gem) in favor of using the new standalone SASS application. FINALLY some freaking sense!!!
- Rebuilt Cinnamon themes from their SASS sources.

***

**Date:** Wed, 29 Aug 2018 12:45:38 -0300<br/>
**Commit:** [ad39413](https://gitlab.com/Odyseus/CinnamonTools/commit/ad39413)<br/>
**Author:** Odyseus<br/>

- Removed all hard-coded repository URLs in favor of using a placeholder that will be replaced by the actual URL on xlet build time.
- Cleaned up and modified some of the `z_create_localized_help.py` scripts to use newly created HTML templates from the `localized_help_utils.py` module.

***

**Date:** Tue, 24 Jul 2018 09:37:15 -0300<br/>
**Commit:** [19e3a4c](https://gitlab.com/Odyseus/CinnamonTools/commit/19e3a4c)<br/>
**Author:** Odyseus<br/>

- Gtk3.22: Upstream fix. Fix a couple of issues with slick-greeter.
- Gtk3.22: Upstream fix. Restore the 18.3 styling of mate-panel taskbar.
- Gtk3.22: Upstream fix. Remove a white border from the nemo sidebar.
- Added some missing assets for Mate panel theming.
- Added some fixes from upstream to the Metacity theme that were overlooked.

***

**Date:** Wed, 18 Jul 2018 00:41:38 -0300<br/>
**Commit:** [cbfb4fd](https://gitlab.com/Odyseus/CinnamonTools/commit/cbfb4fd)<br/>
**Author:** Odyseus<br/>

- Added options to choose on build time the font family/size used by the Cinnamon theme.

***

**Date:** Tue, 12 Jun 2018 00:10:34 -0300<br/>
**Commit:** [de4fd74](https://gitlab.com/Odyseus/CinnamonTools/commit/de4fd74)<br/>
**Author:** Odyseus<br/>

- Some upstream fixes/improvements:
    - Added theming for Mate OSD window when marco with compositing is enabled.
    - Fixed transparent background in mate-terminal.
    - Metacity: Fixed black border on focused titlebars under hidpi.
    - Gtk 3.22: Fixed the color of some selected labels.
    - Gtk 3.22: Tab alignment fixes.

***

**Date:** Tue, 5 Jun 2018 16:12:11 -0300<br/>
**Commit:** [8e20931](https://gitlab.com/Odyseus/CinnamonTools/commit/8e20931)<br/>
**Author:** Odyseus<br/>

- More fixes from upstream.
- Added back the removed selectors and instead commented them. Makes it easier to make comparisons with upstream.

***

**Date:** Mon, 14 May 2018 11:27:37 -0300<br/>
**Commit:** [f5eb419](https://gitlab.com/Odyseus/CinnamonTools/commit/f5eb419)<br/>
**Author:** Odyseus<br/>

- Gtk3 theme: Fix for Mate panel.

***

**Date:** Tue, 8 May 2018 04:55:37 -0300<br/>
**Commit:** [2a2b933](https://gitlab.com/Odyseus/CinnamonTools/commit/2a2b933)<br/>
**Author:** Odyseus<br/>

- More clean up.

***

**Date:** Tue, 8 May 2018 04:51:45 -0300<br/>
**Commit:** [20066e8](https://gitlab.com/Odyseus/CinnamonTools/commit/20066e8)<br/>
**Author:** Odyseus<br/>

- Switched to a size in pixels for the sound applet icons to avoid blurring.

***

**Date:** Tue, 8 May 2018 04:23:27 -0300<br/>
**Commit:** [323374c](https://gitlab.com/Odyseus/CinnamonTools/commit/323374c)<br/>
**Author:** Odyseus<br/>

- Clean up.

***

**Date:** Mon, 30 Apr 2018 22:12:21 -0300<br/>
**Commit:** [e0bd9c2](https://gitlab.com/Odyseus/CinnamonTools/commit/e0bd9c2)<br/>
**Author:** Odyseus<br/>


***
