
## Cinnamon Tools

Applets/Extensions/Themes for the [Cinnamon desktop environment](https://github.com/linuxmint/Cinnamon).

[GitLabLogo]: https://i.imgur.com/Z4XcUKe.png "GitLab"
[GitHubLogo]: https://i.imgur.com/J015ugC.png "GitHub"

**Bug reports, feature requests and contributions must be done in GitLab [![GitLabLogo][GitLabLogo]](https://gitlab.com/Odyseus/CinnamonTools)**. Repository mirror: [![GitHubLogo][GitHubLogo]](https://github.com/Odyseus/CinnamonTools )

## Dependencies

The application used in this repository to build xlets and several other tasks requires Python 3.5+ to be available in `/usr/bin/python3`. All xlets that are shipped with Python scripts to perform different tasks have the exact same requirement.

Additionally, each xlet can depend on certain commands to be available on PATH or packages to be installed on a system. These dependencies are listed in each xlet help pages. See [Xlets help pages](#xlets-help-pages).

## Building xlets

All xlets in this repository aren't directly usable, they need to be *built*. The same principle applies to the themes in this repository (they need to be *built*).

The **app.py** script found at the root of the repository is the *application* that takes care of the xlet building process. It has to be run from a terminal opened inside the repository's folder.

### Examples

#### [Interactive shell menu](https://odyseus.gitlab.io/cinnamon_tools_docs/includes/01-usage.html#app-py-menu)

The following command starts a CLI (Command Line Interface) interactive menu from which one can select the xlets to build or build all xlets/themes at once. From this menu all building tasks are interactive and all chosen options are saved for later reuse.

```shell
$ ./app.py menu
```

![CLI menu](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/images/cli-menu.gif "CLI menu")

#### [Building xlets](https://odyseus.gitlab.io/cinnamon_tools_docs/includes/01-usage.html#app-py-build)

The command bellow will perform the following actions:

```shell
$ ./app.py build --all-xlets --domain="domain.com" --output="$HOME/.local/share/cinnamon" --no-confirmation --restart-cinnamon
```

- `--all-xlets`: Build **all xlets** found on the repository.
- `--output`: All built xlets will be stored directly into Cinnamon's xlets storage for the current user.
- `--domain`: The domain *domain.com* will be used as part of all xlets UUIDs.
- `--no-confirmation`: All existent xlets will be overwritten without confirmation.
- `--restart-cinnamon`: Cinnamon will be restarted when the build process is finished.

**Note:** Refer to the [documentation](#documentation) for detailed command line usage.

#### [Building themes](https://odyseus.gitlab.io/cinnamon_tools_docs/includes/01-usage.html#app-py-build-themes)

The theme building process is interactive (the build process will ask for Cinnamon version, Cinnamon's theme default font size/family, GTK+ 3 version, and Gtk+ 3 client-side-decorated windows shadows). There is only one theme variant in this repository, but an infinite number of variants can be created. See [How to create a custom theme variant?](https://odyseus.gitlab.io/cinnamon_tools_docs/includes/01-usage.html#how-to-create-custom-variant-reference).

The command bellow will perform the following actions:

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

Most of the xlets in this repository come with help pages that describe their usage, Cinnamon version compatibility, list of dependencies (if any), list of contributors, change logs, etc. These help pages can be read **on-line**, **before** an xlet is actually installed on the system. Or they can be read **off-line**, **after** an xlet has been installed.

The help pages are standalone HTML files named **HELP.html** that can be found inside each xlet folder.

### Applets help pages

Applet's help pages can be accessed from an applet context menu (item named **Help**).

- [Argos for Cinnamon](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0ArgosForCinnamon/index.html)
- [Cinnamon Menu (Fork By Odyseus)](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0CinnamonMenuForkByOdyseus/index.html)
- [Desktop Capture (Fork By Odyseus)](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0DesktopCaptureForkByOdyseus/index.html)
- [Desktop Handler](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0DesktopHandler/index.html)
- [Feeds Reader (Fork By Odyseus)](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0FeedsByJonbrettForkByOdyseus/index.html)
- [Mailnag (Fork By Odyseus)](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0MailnagAppletForkByOdyseus/index.html)
- [Panel Drawer (Fork By Odyseus)](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0PanelDrawerForkByOdyseus/index.html)
- [Quick Menu](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0QuickMenu/index.html)
- [Simple ToDo List](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0SimpleToDoList/index.html)
- [System Monitor (Fork By Odyseus)](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0SystemMonitorByOrcusForkByOdyseus/index.html)
- [Weather (Fork By Odyseus)](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0WeatherAppletForkByOdyseus/index.html)
- [Window list (Fork By Odyseus)](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0WindowListForkByOdyseus/index.html)

### Extensions help pages

- [Cinnamon Tweaks](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0CinnamonTweaks/index.html)
- [Color Blindness Assistant](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0ColorBlindnessAssistant/index.html)
- [Desktop Effects Applier](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0DesktopEffectsApplierExtension/index.html)
- [Multi Translator](https://odyseus.gitlab.io/cinnamon_tools_docs/_static/xlets_help_pages/0MultiTranslatorExtension/index.html)

## [Documentation](https://odyseus.gitlab.io/cinnamon_tools_docs)

The documentation of this repository is mainly a development documentation, but it also documents the xlets/themes building processes.

The documentation also has a Cinnamon tips & tricks section which describes some basic concepts and how to recover from an unresponsive Cinnamon session, amongst other things.

## Redistribution

Anyone is free to redistribute any of the xlets in this repository as long as the following points are respected:

1. **Respect the license (GPL-3.0).**
2. **Complete eradication of my name (Odyseus) from all xlets file names and files content.**
3. **Complete eradication of references to this repository (or any of its mirrors) from all xlets files content.**
