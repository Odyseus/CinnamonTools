
## Cinnamon Tools

Applets/Extensions/Themes for the [Cinnamon desktop environment](https://github.com/linuxmint/Cinnamon).

**Bug reports, feature requests and contributions must be done in [GitLab]({repo_url}).**

## Building xlets

All xlets in this repository aren't directly usable, they need to be *built*. The same principle applies to the themes in this repository (they need to be *built*).

The **app.py** script found at the root of the repository is the *application* that takes care of the xlet building process. It has to be run from a terminal opened inside the repository's folder. This Python *application* has no external dependencies other than Python 3.

### Examples

#### [Interactive shell menu]({repo_pages_url}/includes/cinnamontools-usage.html#app-py-menu-command)

The following command starts a CLI (Command Line Interface) menu from which one can select the xlets to build or build all xlets/themes at once, among other tasks.

```shell
$ ./app.py menu
```

#### [Building xlets]({repo_pages_url}/includes/cinnamontools-usage.html#app-py-build-command)

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

#### [Building themes]({repo_pages_url}/includes/cinnamontools-usage.html#app-py-build-themes-command)

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

{applets_help_pages}

### Extensions help pages

{extensions_help_pages}

## [Documentation]({repo_pages_url})

The documentation of this repository is mainly a development documentation, but it also documents the xlets/themes building processes. It can be accessed [on-line]({repo_pages_url}) or locally by simply opening the **docs/index.html** file with any web browser.

## Redistribution

Anyone is free to redistribute any of the xlets in this repository as long the following points are respected:

1. **Respect the license (GPL-3.0).**
2. **Complete eradication of my name (Odyseus) from all xlets file names and files content.**
3. **Complete eradication of references to this repository from all xlets files content.**
