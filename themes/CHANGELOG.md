## Themes changelog

***

- **Date:** Mon, 10 Feb 2020 22:49:20 -0300
- **Commit:** [212a45b](https://gitlab.com/Odyseus/CinnamonTools/commit/212a45b)
- **Author:** Odyseus

```
- Fixed styling of `Gtk.FlowBox`es and `Gtk.FlowBoxChild`s. (Upstream fix)

```

***

- **Date:** Wed, 29 Jan 2020 18:25:30 -0300
- **Commit:** [9fd6766](https://gitlab.com/Odyseus/CinnamonTools/commit/9fd6766)
- **Author:** Odyseus

```
- Added styling for the close/maximize/minimize buttons of header bars for the Gtk 3.18 version of the Gtk 3 theme. Now they look like the Gtk 3.22 version, which at the same time look like the buttons of the Metacity theme.
- Reorganized the assets of the Gtk 3 themes to be reusable. There were a lot of duplicated images.

```

***

- **Date:** Tue, 28 Jan 2020 01:26:20 -0300
- **Commit:** [358faf5](https://gitlab.com/Odyseus/CinnamonTools/commit/358faf5)
- **Author:** Odyseus

```
- Added some basic styling to the Gtk 3.18 theme for GtkStackSidebar.

```

***

- **Date:** Fri, 24 Jan 2020 03:11:30 -0300
- **Commit:** [bfb68de](https://gitlab.com/Odyseus/CinnamonTools/commit/bfb68de)
- **Author:** Odyseus

```
- Gtk3 theme: Fixed wrongly colored header bars.
- Cinnamon:
    - Added new class that will be available on next Cinnamon version.
    - Added missing cinnamon.css files that was removed due to incorrect rules on the .gitignore file.

```

***

- **Date:** Sat, 18 Jan 2020 14:56:27 -0300
- **Commit:** [c03b4f4](https://gitlab.com/Odyseus/CinnamonTools/commit/c03b4f4)
- **Author:** Odyseus

```
- General changes:
    - Made it easier for users to create their own theme variants. Read the documentation for instructions: Usage > app.py build_themes > How to create a custom theme variant?.
    - Removed MintGreen variant since I never used it and now users can create their own variant.
    - Exposed for configuration several contextual colors for customization when creating custom variants.
- Gtk2 theme changes:
    - Removed unused image.
- Gtk3 theme changes:
    - Xfce 4.14 fixes. (Upstream fix)
    - Add support for GtkStackSidebar needs attention. (Upstream fix)
    - Compliance with application's request to set a monospace font. (Upstream fix)
- Cinnamon theme changes:
    - [GWL] Fixed justification of label inherited from applet-box. (Upstream fix)
    - [GWL] Adjusted grouped-window-list-thumbnail-menu becoming active. (Upstream fix)

```

***

- **Date:** Tue, 16 Jul 2019 00:48:05 -0300
- **Commit:** [ddee4ac](https://gitlab.com/Odyseus/CinnamonTools/commit/ddee4ac)
- **Author:** Odyseus

```
- Added support for Cinnamon 4.2.x. There is a new class for spacer applets.
- Cinnamon theme SASS sources:
    - Changed the type of certain comments so they don't show up in the built CSS files.
    - Moved some comments inside conditions so they aren't added to the built CSS files.
    - Changed the ridiculous huge size of the **notification-icon-button** class.
    - Unified some styles used by button classes.

```

***

- **Date:** Mon, 15 Apr 2019 20:29:39 -0300
- **Commit:** [81bd8b3](https://gitlab.com/Odyseus/CinnamonTools/commit/81bd8b3)
- **Author:** Odyseus

```
- Exposed for configuration the shadow for client side decorated windows on the Gtk3 theme.

```

***

- **Date:** Mon, 18 Feb 2019 00:24:45 -0300
- **Commit:** [b0424f0](https://gitlab.com/Odyseus/CinnamonTools/commit/b0424f0)
- **Author:** Odyseus

```
- Removed color definition from the `.popup-alternating-menu-item:alternate` selector on the Cinnamon theme. The definition of this color was overwriting the color set by the `active`, `hover`, etc. pseudo classes. Setting the font weight to bold is enough to differentiate an alternate item from a primary one.

```

***

- **Date:** Tue, 1 Jan 2019 13:32:50 -0300
- **Commit:** [4e9a380](https://gitlab.com/Odyseus/CinnamonTools/commit/4e9a380)
- **Author:** Odyseus

```
- Cinnamon theme:
    - Removed italic styling from the menu-category-button-greyed class. This class is applied to the category buttons in the Cinnamon menu applet when performing searches. Every time that a search was performed, the italic styling changed the size of the categories box (ultra ANNOYING!!!). A lighter color for the font is good enough to represent a disabled button.

```

***

- **Date:** Sat, 22 Dec 2018 17:48:26 -0300
- **Commit:** [84c5bbe](https://gitlab.com/Odyseus/CinnamonTools/commit/84c5bbe)
- **Author:** Odyseus

```
- Cinnamon theme: changed fixed font size for the run-dialog-completion-box class to a relative font size.

```

***

- **Date:** Fri, 21 Dec 2018 14:30:45 -0300
- **Commit:** [4523cb5](https://gitlab.com/Odyseus/CinnamonTools/commit/4523cb5)
- **Author:** Odyseus

```
- Cinnamon theme: fixed erroneous styling of items from the grouped window applet when this applet is placed in the bottom panel.

```

***

- **Date:** Mon, 17 Dec 2018 15:37:18 -0300
- **Commit:** [3665405](https://gitlab.com/Odyseus/CinnamonTools/commit/3665405)
- **Author:** Odyseus

```
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

```

***

- **Date:** Mon, 3 Sep 2018 01:08:22 -0300
- **Commit:** [ac665a3](https://gitlab.com/Odyseus/CinnamonTools/commit/ac665a3)
- **Author:** Odyseus

```
- Eradicated the usage of SASS (the Ruby gem) in favor of using the new standalone SASS application. FINALLY some freaking sense!!!
- Rebuilt Cinnamon themes from their SASS sources.

```

***

- **Date:** Wed, 29 Aug 2018 12:45:38 -0300
- **Commit:** [ad39413](https://gitlab.com/Odyseus/CinnamonTools/commit/ad39413)
- **Author:** Odyseus

```
- Removed all hard-coded repository URLs in favor of using a placeholder that will be replaced by the actual URL on xlet build time.
- Cleaned up and modified some of the `z_create_localized_help.py` scripts to use newly created HTML templates from the `localized_help_utils.py` module.

```

***

- **Date:** Thu, 23 Aug 2018 02:36:01 -0300
- **Commit:** [cd4f58f](https://gitlab.com/Odyseus/CinnamonTools/commit/cd4f58f)
- **Author:** Odyseus

```
- GitHub eradication. New home is GitLab.
- Updated documentation's development notes.
- Re-implemented CHANGELOG.md creation and created all change logs
- Corrected the execution order of change logs creation on the CLI application.

```

***

- **Date:** Tue, 24 Jul 2018 09:37:15 -0300
- **Commit:** [19e3a4c](https://gitlab.com/Odyseus/CinnamonTools/commit/19e3a4c)
- **Author:** Odyseus

```
- Gtk3.22: Upstream fix. Fix a couple of issues with slick-greeter.
- Gtk3.22: Upstream fix. Restore the 18.3 styling of mate-panel taskbar.
- Gtk3.22: Upstream fix. Remove a white border from the nemo sidebar.
- Added some missing assets for Mate panel theming.
- Added some fixes from upstream to the Metacity theme that were overlooked.

```

***

- **Date:** Wed, 18 Jul 2018 00:41:38 -0300
- **Commit:** [cbfb4fd](https://gitlab.com/Odyseus/CinnamonTools/commit/cbfb4fd)
- **Author:** Odyseus

```
- Added options to choose on build time the font family/size used by the Cinnamon theme.

```

***

- **Date:** Tue, 12 Jun 2018 00:10:34 -0300
- **Commit:** [de4fd74](https://gitlab.com/Odyseus/CinnamonTools/commit/de4fd74)
- **Author:** Odyseus

```
- Some upstream fixes/improvements:
    - Added theming for Mate OSD window when marco with compositing is enabled.
    - Fixed transparent background in mate-terminal.
    - Metacity: Fixed black border on focused titlebars under hidpi.
    - Gtk 3.22: Fixed the color of some selected labels.
    - Gtk 3.22: Tab alignment fixes.

```

***

- **Date:** Tue, 5 Jun 2018 16:12:11 -0300
- **Commit:** [8e20931](https://gitlab.com/Odyseus/CinnamonTools/commit/8e20931)
- **Author:** Odyseus

```
- More fixes from upstream.
- Added back the removed selectors and instead commented them. Makes it easier to make comparisons with upstream.

```

***

- **Date:** Mon, 14 May 2018 11:27:37 -0300
- **Commit:** [f5eb419](https://gitlab.com/Odyseus/CinnamonTools/commit/f5eb419)
- **Author:** Odyseus

```
- Gtk3 theme: Fix for Mate panel.

```

***

- **Date:** Tue, 8 May 2018 04:55:37 -0300
- **Commit:** [2a2b933](https://gitlab.com/Odyseus/CinnamonTools/commit/2a2b933)
- **Author:** Odyseus

```
- More clean up.

```

***

- **Date:** Tue, 8 May 2018 04:51:45 -0300
- **Commit:** [20066e8](https://gitlab.com/Odyseus/CinnamonTools/commit/20066e8)
- **Author:** Odyseus

```
- Switched to a size in pixels for the sound applet icons to avoid blurring.

```

***

- **Date:** Tue, 8 May 2018 04:23:27 -0300
- **Commit:** [323374c](https://gitlab.com/Odyseus/CinnamonTools/commit/323374c)
- **Author:** Odyseus

```
- Clean up.

```

***

- **Date:** Mon, 30 Apr 2018 22:12:21 -0300
- **Commit:** [e0bd9c2](https://gitlab.com/Odyseus/CinnamonTools/commit/e0bd9c2)
- **Author:** Odyseus

```

```

***
