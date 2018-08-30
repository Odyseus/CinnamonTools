
## Cinnamon Tools

Applets/Extensions/Themes for the [Cinnamon desktop environment](https://github.com/linuxmint/Cinnamon).

**Bug reports, feature requests and contributions must be done in [GitLab](https://gitlab.com/Odyseus/CinnamonTools).**

## Building xlets

All xlets in the repository aren't directly usable, they need to be *built*. *Building* an xlet just means that the *raw xlet* (as found in the repository) will be copied into another location (chosen when performing the building) and a string substitution will be done that will apply a generated UUID (**xlet_name@custom_domain_name**) to all files (files content and file names). It will also compile the `gsettings` files (if an xlet contains such files) and copy files common to all xlets (LICENSE.md, helper script, etc.).

The same principle applies to the themes in this repository (they need to be *built*). Although, the process is totally different.

The **app.py** script is the *application* that takes care of the xlet building process. It has to be run from a terminal opened inside the repository's folder.

### Examples

#### [Interactive shell menu](https://odyseus.gitlab.io/CinnamonTools/includes/cinnamontools-usage.html#app-py-menu-command)

The following command starts a CLI (Command Line Interface) menu from which one can select the xlets to build or build all xlets/themes at once, among other tasks.

```shell
$ ./app.py menu
```

#### [Building xlets](https://odyseus.gitlab.io/CinnamonTools/includes/cinnamontools-usage.html#app-py-build-command)

The following command will perform the following actions:

```shell
$ ./app.py build --all-xlets --domain="domain.com" --output="$HOME/.local/share/cinnamon" --no-confirmation --restart-cinnamon
```

- `--all-xlets`: Build **all xlets** found on the repository.
- `--output`: All built xlets will be stored directly into Cinnamon's xlets storage for the current user.
- `--domain`: The domain *domain.com* will be used as part of all xlets UUIDs.
- `--no-confirmation`: All existent xlets will be overwritten without confirmation.
- `--restart-cinnamon`: Cinnamon will be restarted when the build process is finished.

**Note:** Refer to the [documentation](#documentation) for detailed command line usage.

#### [Building themes](https://odyseus.gitlab.io/CinnamonTools/includes/cinnamontools-usage.html#app-py-build-themes-command)

The theme building process is interactive (the build process will ask for Cinnamon version, Cinnamon's theme default font size/family and GTK+ 3 version). The following command will perform the following actions:

```shell
$ ./app.py build_themes --theme-name="MyThemeName" --output="$HOME/.themes" --no-confirmation --restart-cinnamon
```

- Build all variants of the theme found on this repository.
- `--theme-name`: *MyThemeName* will be used as part of the generated theme names. *MyThemeName-ThemeVariant* will be the final result.
- `--output`: Themes will be stored into Cinnamon's themes storage for the current user.
- `--no-confirmation`: All existent themes will be overwritten without confirmation.
- `--restart-cinnamon`: Cinnamon will be restarted when the build process is finished.

**Note:** Refer to the [documentation](#documentation) for detailed command line usage.

## Xlets help pages

Most of the xlets in this repository come with help pages that describe their usage, Cinnamon version compatibility, dependencies, etc. These help pages can be read **on-line**, **before** an xlet is actually installed on the system. Or they can be read **off-line**, **after** an xlet has been installed.

### Applets help pages

- [Argos for Cinnamon](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0ArgosForCinnamon/index.html)
- [Cinnamon Menu (Fork By Odyseus)](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0CinnamonMenuForkByOdyseus/index.html)
- [Desktop Handler](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0DesktopHandler/index.html)
- [Extensions Manager](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0ExtensionsManager/index.html)
- [Feeds Reader (Fork By Odyseus)](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0FeedsByJonbrettForkByOdyseus/index.html)
- [Popup Translator](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0PopupTranslator/index.html)
- [Quick Menu](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0QuickMenu/index.html)
- [Simple ToDo List](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0SimpleToDoList/index.html)
- [System Monitor (Fork By Odyseus)](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0SystemMonitorByOrcusForkByOdyseus/index.html)
- [Wallpaper Changer](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0WallpaperChangerApplet/index.html)
- [Window list (Fork By Odyseus)](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0WindowListForkByOdyseus/index.html)

### Extensions help pages

- [Cinnamon Maximus (Fork by Odyseus)](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0CinnamonMaximusForkByOdyseus/index.html)
- [Cinnamon Tweaks](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0CinnamonTweaks/index.html)
- [Multi Translator](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0MultiTranslatorExtension/index.html)
- [Window demands attention behavior](https://odyseus.gitlab.io/CinnamonTools/_static/xlets_help_pages/0WindowDemandsAttentionBehavior/index.html)

## [Documentation](https://odyseus.gitlab.io/CinnamonTools)

The documentation of this repository is mainly a development documentation, but it also documents the xlets/themes building processes. It can be accessed [on-line](https://odyseus.gitlab.io/CinnamonTools) or locally by simply opening the **docs/index.html** file with any web browser.

## Redistribution

Anyone is free to redistribute any of the xlets in this repository as long the following points are respected:

1. **Respect the license (GPL-3.0).**
2. **Complete eradication of my name (Odyseus) from all xlets file names and files content.**
3. **Complete eradication of references to this repository from all xlets files content.**
