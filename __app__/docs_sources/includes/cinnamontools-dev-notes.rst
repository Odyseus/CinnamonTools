
Development notes
=================

Xlets development *commandments*
--------------------------------

1. Eradicate from your thoughts the existence of Node.js.
2. If a Python module is required, make it part of the Python application if possible. Otherwise, create a mechanism to install required modules.
3. Try to use ``Mainloop.idle_add`` inside the initialization code of an xlet if possible. Take into account the following:

     a) The ``_expandAppletContextMenu`` method call should NOT be inside ``Mainloop.idle_add``.
     b) Avoid using ``Mainloop.idle_add`` inside an extension code for obvious reasons.
     c) Be aware of using ``Mainloop.idle_add`` inside a *very advanced* xlet. For example, using ``Mainloop.idle_add`` to delay the initialization of the **Window list applet** or the **System Tray applet** will inevitably break these applets initialization process.

z_config.py file inside xlets directories
-----------------------------------------

This file contains a single variable called **settings** (a dictionary). These settings are read and applied when an xlet is built.

.. note::

    I was forced to implement this configuration file due to one single reason. If I manually create the symbolic links inside the xlets folders, and since I'm working directly inside a Dropbox folder, the symbolic links are constantly *resolving themselves* (a Dropbox *feature*). So I came up with the idea of creating those symbolic links when the xlets are built.

    Right now it only contains a single setting (``symlinks``). But it has the potential of containing more settings in the future.

Example:

.. code::

    settings = {
        "symlinks": {
            "3.8": [
                ("../icons", "icons"),
                ("../applet.js", "applet.js"),
                ("../HELP.html", "HELP.html"),
                ("../icon.png", "icon.png"),
                ("../utils.js", "utils.js")
            ]
        }
    }


``symlinks`` key
^^^^^^^^^^^^^^^^

The main use of the ``symlinks`` key is to generate symbolic links to files in the root folder of an xlet inside a *version sub-folder* to be used by **multiversion** enabled xlets.

This key is a dictionary of keys representing a sub-folder name inside an xlet directory. Each key contains a list of tuples representing the symbolic link target as its first index and the symbolic link name as its second index.

In the example above, the ``symlinks`` key will generate the symbolic links inside a folder called **3.8** (the folder will be created if it doesn't exists). The first tuple will be used to create a symbolic link called **icons** whose target will be **../icons**.

.. warning::

    It's important to make all symbolic links targets relative, not absolute.


z_create_localized_help.py file inside xlets directories
--------------------------------------------------------

This file is used to generate the **HELP.html** page for each xlet.


:abbr:`EOL (end-of-life)` ideas/plans
-------------------------------------

- Linux Mint 18.x/Ubuntu 16.04.x :abbr:`EOL (end-of-life)` is 2021.
- Remove all retro-compatible code from all xlets. They all are marked with the string *Mark for deletion on EOL*.
- Avoid at all cost to make xlets **multiversion**. I already went through that path. It wasn't pretty all the nonsense that I had to endure.
- Convert all JavaScript code into ECMAScript 2015 syntax. By 2021, I might get used to that annoyance. LOL
- Remove all ``try{}catch{}`` blocks on xlets ``_init`` methods. Newer versions of Cinnamon already uses these code blocks to wrap xlets initialization. Keep an eye on it in case that they decide to change this yet again.
