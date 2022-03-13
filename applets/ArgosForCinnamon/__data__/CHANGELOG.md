## Argos for Cinnamon changelogs

**These change logs are only valid for the version of the xlet hosted on [its original repository](https://gitlab.com/Odyseus/CinnamonTools).**

***

**Date:** Sat, 12 Mar 2022 22:49:34 -0300<br/>
**Commit:** [89d77be](https://gitlab.com/Odyseus/CinnamonTools/commit/89d77be)<br/>
**Author:** Odyseus<br/>

#### Warning

- Complete re-write.
- New settings not compatible with older versions of this xlet.

#### General changes

- Better organization of xlets files (in their "raw" form and when they are built):
    - JavaScript modules into their own sub-folder **js_modules**. See **config.py** changes.
    - Python modules were already in their own sub-folder(**python_modules**). See **config.py** changes.
    - In the root folder of an xlet only the applet.js/extension.js files and Python scripts that are meant to be executed.
    - All configuration files and/or auto-generated data goes into the **__data__** folder inside an xlet root folder.
    - No need for any file to be prefixed with `z_` anymore since they don't reside inside an xlet root folder anymore.
- Execution permission changes. See **config.py** changes.
- **config.py** files changes:
    - Implemented the use of YAML files for configuration files. This file is now named **config.yaml**.
    - Implemented `set_executable` setting. An array of file paths to files relative to an xlet root folder to set as executables instead of setting as executable all files with a specific file extension.
    - Implemented `python_modules` and `javascript_modules` settings. An array of file/folder paths relative to **REPO_FOLDER/__app__/data/{python_modules|javascript_modules}** to be copied into **XLET_ROOT_FOLDER/{python_modules|js_modules}**. These settings complement the `extra_files` setting.
- Removed starting zeros from all xlets slugs (their folder names). I started naming them like so for convenience, but I found more problems than is worth (Python module names can't start with a number, Gtk application IDs cannot start with a number, etc.).

#### New features and other changes

- Changing settings from the applet context menu will now not trigger a menu rebuild (this caused the context menu to be closed when changing a setting). Now the context menu will be kept open and when closed, and if any setting was changed, then the menu will be rebuilt.
- Implemented custom settings framework to change the xlets settings.
- Added JavaScript example file.

***
