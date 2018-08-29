
Development notes
=================

Xlets development *commandments*
--------------------------------

1. Eradicate from your thoughts the existence of Node.js. I can do infinitely more with just ten lines of Python code than with ten lines of JavaScript code that depend on 10 Node.js modules with a thousand lines of code each.
2. If a Python module is required, make it part of the Python application if possible. Otherwise, create a mechanism to install required modules.
3. Try to use ``Mainloop.idle_add`` inside the initialization code of an xlet if possible. Take into account the following:

     a) The ``_expandAppletContextMenu`` and the ``_bindSettings`` method calls should NOT be inside ``Mainloop.idle_add``.
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

In the example above, the ``symlinks`` key will generate the symbolic links inside a folder called **3.8** (the folder will be created if it doesn't exists). The first tuple will be used to create a symbolic link called **icons** whose target will be **../icons** and so on.

.. warning::

    It's important to make all symbolic links targets relative, not absolute.


z_create_localized_help.py file inside xlets directories
--------------------------------------------------------

This file is used to generate the **HELP.html** page for each xlet. The **HELP.html** file is a standalone HTML page, which means that all resources are in-line (CSS stylesheets, JavaScript code, images, etc.).


.. note::

    I explored several ways of creating a help file with translated content. This one is the most optimal and less dependent of external tools.

    - I have the power as to what should be considered a string that needs to be translated or not.
    - I can write in basic markdown or pure HTML indistinctly. So I can write simple things as paragraphs or complex things as HTML tables without making the source code visible in the translation templates.
    - The Python modules that this method depends on are very simple, one-file-only, and non dependent of third-party Python modules. So I have them integrated in the repository and I can even expand their capabilities (as I did with the **mistune** module).


.. warning::

    What I have considered and discarded:

    - Sphinx

        - By itself, Sphinx has hundreds of moving parts (Python modules and/or external tools).
        - Its internationalization capabilities are too complex.
        - Generating one single HELP.html file that is at the same time self contained is practically impossible.

    - Translate Toolkit

        - None of its converters, tools, and scripts gave me the power that I get with the method that I ended up using.


HTML assets
^^^^^^^^^^^

- `Bootstrap 4 <https://getbootstrap.com/>`__ is used as a CSS framework. No Bootstrap JavaScript plugins nor jQuery is used.
- `Bootswatch's Flatly theme <https://bootswatch.com/flatly/>`__ is used as Bootstrap theme. Only because the colors of the default Bootstrap theme are abhorrent.
- JavaScript is only used for the page localization mechanism and a smooth scroll effect when clicking in-line links.


Main class methods overview (more details in API documentation)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

- **get_content_base:** Basic information about the xlet.
- **get_content_extra:** Detailed information about the xlet.
- **get_css_custom:** Additional CSS styles.
- **get_js_custom:** Some custom JS in case that the page needs it. For example: since I use Base64 encoded images, and if an image is used in more than one place in a page, I insert those images with JS.

:abbr:`EOL (end-of-life)` ideas/plans
-------------------------------------

- Linux Mint 18.x/Ubuntu 16.04.x :abbr:`EOL (end-of-life)` is 2021.
- Remove all retro-compatible code from all xlets. They all are marked with the string *Mark for deletion on EOL*.
- Avoid at all cost to make xlets **multiversion**. I already went through that path. It wasn't pretty all the nonsense that I had to endure.
- Convert all JavaScript code into ECMAScript 2015 syntax. By 2021, I might get used to that annoyance. LOL

    + **Step 1 (Done):** Eradicate the use of the **Lang** Cjs module in favor of arrow/standard functions.
    + **Step 2 (Done):** Convert all functions (that can be converted) to arrow functions.

- Remove all ``try{}catch{}`` blocks on xlets ``_init`` methods. Newer versions of Cinnamon already uses these code blocks to wrap xlets initialization. Keep an eye on it in case that they decide to change this yet again.
