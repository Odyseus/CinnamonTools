
*****
Usage
*****

.. hint::

    This Python application can generate a system executable with bash completions support. See :ref:`system-executable-reference`.

:abbr:`CLI (Command Line Interface)` help page
==============================================

.. docopt-docstring:: cinnamontools

Detailed Usage
==============

**app.py menu** command
-----------------------

This command starts a :abbr:`CLI (Command Line Interface)` menu from which building and development tasks can be performed.

Options
^^^^^^^

- ``-d <domain>`` or ``--domain=<domain>``: See :ref:`build command options <build-command-options-reference>`.
- ``-o <dir>`` or ``--output=<dir>``: See :ref:`build command options <build-command-options-reference>`.
- ``-n`` or ``--no-confirmation``: See :ref:`build command options <build-command-options-reference>`.

.. _how-to-build-xlets-reference:

**app.py build** command
------------------------

This command is used to build all or specifics xlets. All xlets found in Cinnamon Tools' repository aren't directly usable, they need to be *built*. *Building* an xlet just means that the *raw xlet* (as found in the repository) will be copied into another location (chosen when performing the building) and a string substitution will be done that will apply a generated UUID (xlet_name@custom_domain_name) to all files (files content and file names). It will also compile the ``gsettings`` files (if an xlet contains such files) and copy files common to all xlets (LICENSE.md, localizations installer script, etc.).

.. _build-command-options-reference:

Options
^^^^^^^

- ``-x <name>`` or ``--xlet=<name>``: Specify one or more xlets to build.

    + Example usage: ``app.py build -x 0ArgosForCinnamon -x 0CinnamonTweaks``
    + This command will build the Argos for Cinnamon applet and the Cinnamon Tweaks extension into the default output directory.

- ``-d <domain>`` or ``--domain=<domain>``: To be able to build any xlet, it is necessary to specify a domain name. This domain name is then used to generate an xlet UUID (an other data). To avoid passing this command line option every time one builds xlets, a file named **domain_name** can be created at the root of the repository whose only content should be the desired domain name. This command line option has precedence over the **domain_name** file. Which means that if this option is used, the domain name found in an existent **domain_name** file will be ignored.

    + Example usage: ``app.py build -x 0ArgosForCinnamon -d example.com``

    .. warning::

        The domain name isn't internally validated (yet). But it needs to comply with certain basic rules.

        - It cannot be empty.
        - It must contain only ASCII characters (A-Z[0-9]_-.).
        - It **must not** begin nor end with a digit.
        - It **must not** begin nor end with a "." (period) character.
        - It must contain at least one "." (period) character.
        - It **must not** contain consecutive "." (period) characters.
        - It **must not** exceed 128 characters.

        These rules aren't necessarily standard rules to validate a domain name. But since the domain name is used to generate from files names to GTK+ application IDs, I find it easier to comply with a set of general rules.

.. _build-command-option-ooutput-reference:

- ``-o <dir>`` or ``--output=<dir>``: The output directory that will be used to save the built xlets. If not specified, the default storage location will be used.

    + Example usage: ``app.py build -x 0ArgosForCinnamon -o /home/user_name/.local/share/cinnamon``
    + This command will build the Argos for Cinnamon applet directly into the Cinnamon's install location for xlets.

    .. warning::

        By using a custom output directory when building xlets, and if an xlet was previously built into the same location, the previously built xlet will be completely removed. There will be a confirmation dialog before proceeding with the deletion, except when the ``--no-confirmation`` option is used.

    .. note::

        The default storage location for all built xlets is **/tmp/CinnamonToolsTemp/YYYY-MM-DD_HH.MM.SS.MMM/xlet_type/xlet_uuid**. Successive builds will create new dated folders, so an old build can never be overwritten by a new build.

        Built xlets will always be created inside a folder named as the xlet type (applets or extensions). The exception to this are the themes. Themes will be directly built into the output directory.

- ``-n`` or ``--no-confirmation``: Do not confirm the deletion of an already built xlet when the ``--output`` option is used.

- ``-r`` or ``--restart-cinnamon``: Restart Cinnamon's shell after finishing the xlets building process.

.. _how-to-build-themes-reference:

**app.py build_themes** command
-------------------------------

This command is used to build all the themes. Just like xlets, the themes found in Cinnamon Tools' repository aren't directly usable, they need to be *built*. The themes building process is interactive. The build process will ask for Cinnamon version, Cinnamon's theme default font size/family and GTK+ 3 version.

Options
^^^^^^^

- ``-t <name>`` or ``--theme-name=<name>``: To be able to build the themes, it is necessary to specify a theme name. This theme name is then used to generate the full theme name (theme_name-theme_variant). To avoid passing this command line option every time one builds themes, a file named **theme_name** can be created at the root of the repository whose only content should be the desired theme name. This command line option has precedence over the **theme_name** file. Which means that if this option is used, the theme name found in an existent **theme_name** file will be ignored.

- ``-o <dir>`` or ``--output=<dir>``: The output directory that will be used to save the built themes. If not specified, the default storage location will be used. See :ref:`build command --output <build-command-option-ooutput-reference>` option notes for more details.

- ``-n`` or ``--no-confirmation``: Do not confirm the deletion of an already built theme when the ``--output`` option is used. See :ref:`build command --output <build-command-option-ooutput-reference>` option notes for more details.

- ``-r`` or ``--restart-cinnamon``: Restart Cinnamon's shell after finishing the themes building process.

.. note::

    There is actually one theme in this repository, but with two variants (two different color accents). One is called **GreybirdBlue**, because is the same blue used by the `Greybird <https://github.com/shimmerproject/Greybird>`__ theme. And the other variant is called **MintGreen**, because it uses as accent color a similar (but brighter) green color as the default Linux Mint theme called **Mint-X**.

    The theme is basically the **Mint-X** theme with some graphics from the **Mint-Y** theme. But with added features that were removed from the previously mentioned default themes.


Detailed differences with the Mint-X theme family
_________________________________________________

- GTK2/GTK3 themes:
    - Restored all removed scroll bars arrows.
    - Restored all removed outlines from focused elements.
    - Removed dashed lines feedback from scrolled views (affects GTK3 applications only).
    - Changed the tooltips appearance of the GTK2 theme to look like the GTK3 tooltips.
- Cinnamon theme:
    - Changed the tooltips appearance to look like the GTK3 tooltips.
    - Changed the switches appearance to look like the GTK3 switches.
    - Removed fixed sizes for entries inside menus.


**app.py dev** command
----------------------

This command is used to perform development tasks.

Sub-commands
^^^^^^^^^^^^

- ``generate_meta_file``: Generates a unified metadata file with the content of the metadata.json file from all xlets. It also contains extra data for all xlets to facilitate their development.
- ``create_localized_help``: Generates the localized **HELP.html** file for all xlets. This file is a standalone HTML file that contains detailed a description and usage instructions for each xlet. It also contains their changelogs and list of contributors/mentions.
- ``generate_trans_stats``: Generates a simple table with information about missing translated strings inside the PO files.
- ``update_pot_files``: It re-generates all xlets POT files to reflect the changes made to the translatable strings on them.
- ``update_spanish_localizations``: It updates the **es.po** files from all xlets from their respective POT files.
- ``create_changelogs``: Generates *human readable* changelogs from the Git history of changes.
- ``check_executables`` **(*)**: It checks if the files that need to be executable, actually are.
- ``set_executables`` **(*)**: Same as ``check_executables``, but if non executable files are found, they will be set as such.

**(*)**: This check is not *very smart*. Currently, it simply checks for files with ``.py`` or ``.sh`` extension. And they will be set as executable regardless if they need to be or not.

.. _system-executable-reference:

**app.py generate** command
---------------------------

Sub-commands
^^^^^^^^^^^^

- ``system_executable``: Create an executable for the ``app.py`` application on the system PATH to be able to run it from anywhere.

    + The system executable creation process will ask for an executable name (the default is **cinnamon-tools-app**) and the absolute path to store the executable file (the default is **$HOME/.local/bin**).
    + It will also ask for bash completions creation.

- ``docs``: Generate this documentation page.
- ``docs_no_api``: Generate this documentation page without extracting Python modules docstrings.
