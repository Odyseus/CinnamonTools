
## Cinnamon Tools

Applets/Extensions/Themes for the [Cinnamon desktop environment](https://github.com/linuxmint/Cinnamon).

## Building xlets

All xlets in the repository aren't directly usable, they need to be *built*. *Building* an xlet just means that the *raw xlet* (as found in the repository) will be copied into another location (chosen when performing the building) and a string substitution will be done that will apply a generated UUID (**xlet_name@custom_domain_name**) to all files (files content and file names). It will also compile the `gsettings` files (if an xlet contains such files) and copy files common to all xlets (LICENSE.md, helper script, etc.).

The same principle applies to the themes in this repository (they need to be *built*). Although, the process is totally different.

The **app.py** script is the *application* that takes care of the xlet building process. It has to be run from a terminal opened inside the repository's folder.

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
