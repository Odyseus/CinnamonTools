
*******************************
Xlets settings custom framework
*******************************

I created this framework for several reasons.

- I don't want to maintain several versions of my xlets, so I refuse to ever use ``multiversion`` (again) on my xlets. Which is what I would be forced to do if I were to make use of Cinnamon's native settings framework because of the always evolving nature of Cinnamon itself.
- And finally, I don't like the philosophy *the less options the better*.

General changes
===============

- Eradication of :py:class:`Gtk.Box` in favor of :py:class:`Gtk.Grid`.
- This implementation uses header bars instead of traditional windows with a toolbar. Why?

    + Because upstream is planing to switch to this aberration belched from the bowels of corporations full of web developers playing at being software developers. SO, better get used to this garbage in preparation for when it's forced down our throats.
    + :py:class:`Gtk.HeaderBar` is easier to deal with (just create one and throw all widgets inside it). So, there is the barely bright side. LOL
    + In spite of my aversion for header bars, this framework is used for settings windows for xlets. And I create xlets whose settings are "to be set and forgotten". So, one just has to tolerate the settings window once. And for xlet settings that need to be changed frequently, I always create a mechanism to set them on-the-fly, without having to open the settings window.

- This implementation remembers the last state of opened windows (window size, maximized state and selected section on the sidebar). Setting an initial size for a window that will be suitable for every single combination of font sizes, Gtk3 themes, screen resolutions just doesn't cut it for me.
- This implementation doesn't use JSON files for the creation of the widgets. I wanted the power and flexibility of Python scripts.
- The ``dependency`` option for a widget can be a string or a list. It follows the same logic as Cinnamon's native implementation, but instead of just depending on the value of just one setting value, it can depend on several settings' values.
- Each of the pages in the window has their own scrollbars.

Widget changes
==============

- **button**: This widget doesn't use the *proxy* that the Cinnamon implementation uses. Instead, it just toggles a boolean setting that can be bound to any action on the xlet side. Added ``image`` parameter to display an icon on the button. The button can have an icon, a label or both.
- **buttonsgroup**: A new widget whose sole purpose is to contain **button** widgets.
- **stringslist**: A new widget that allows to store a list of strings. It is rendered in the main window as a simple button that when clicked a dialog will appear with the list of strings represented inside a :py:class:`Gtk.TreeView`.
- **entry**: This widget has the ``expand-width`` option set to **true** by default.
- **list**: This widget has several bug fixes (**FIXME**: remember to properly report them if and when I can reproduce them) and several improvements.

    + Added ``color`` cell renderer. It allows to choose a color using a color chooser. The cell will be rendered with the selected color as its background color and the color *name* as its visible value. The color of the text will be black or white depending on the luminance of the background color.
    + Added ``move-buttons`` boolean option. It allows to show/hide the move up/down buttons on the ``list`` widget.
    + Added ``multi-select`` boolean option. It allows to select multiple rows inside the ``list`` widget. Mostly useful for mass deletion of items.
    + Added ``immutable`` option. An *immutable* ``list`` widget can be edited, but items in the list cannot be removed nor new ones be added.

        * This setting can be a boolean or a dictionary.
        * If a dictionary, the ``read-only-keys`` key will allow to specify a list of column IDs whose created widgets should be set as insensitive.

    + Added **Apply changes** button to the list. Since the value of a preference for this widget is a non-primitive type (a list/array), it cannot (should not) be bound to a callback. The **Apply changes** button will only appear if a boolean preference of the same name as the name of the preference handled by the ``list`` widget plus ``_apply`` exist. For example, if the preference that handles the ``list`` widget is called  ``pref_name``, the **Apply changes** button will be created if a preference named exactly ``pref_name_apply`` exists. When the **Apply changes** button is pressed, the callback tied to the ``pref_name_apply`` preference will be triggered.
    + Added ability to export and import the content of the ``list`` widget. When importing, the new data can be appended to the existing data of just overwrite it. To display the export and import buttons, one of two string preferences should exist:

        * If the preference that handles the ``list`` widget is called  ``pref_name``, another generic string preference called ``pref_name_imp_exp_path`` should exist. This preference will be used only by the widget with the preference ``pref_name``.
        * If a generic string preference called ``imp_exp_last_selected_directory`` exist, it will be used by all existing ``list`` widgets.
        * The purpose of the generic string preferences (``pref_name_imp_exp_path`` or ``imp_exp_last_selected_directory``) is twofold. To determine if the import/export buttons should be displayed; and to store the last selected path so it can be re-used when the import/export dialogs are opened again.

    + Added ``dialog-info-labels`` option (an array/list of strings) that allows to display informative labels on the edit/add dialog. This allows to keep the main window clean and at the same time keep basic information at hand.
    + Changed ``keybinding`` cell renderer. The cell will display the exact same name displayed in the ``keybinding`` widget instead of the internal value. For example, a ``keybinding`` with its shortcut set to **Control+d** (the actual internal value is **<Primary>d**), it will display **Control+D** in the ``keybinding`` widget label **AND** in the ``keybinding`` cell renderer.
    + Implemented ``apply-and-quit`` boolean option. It allows to exit the settings window when the apply button on a ``list`` widget is clicked.
    + Added ``app`` cell renderer. It allows to use an ``appchooser`` widget to choose an application from the applications installed in a system. The value stored is the application ID and the value showed in the list is the application name.
    + Added keyboard handling (delete/move) of items.

- **keybinding**: Added ``num-bind`` integer option that exposes for configuration the number of keybindings to create for each ``keybinding`` widget.
- **keybinding-with-options**. A new widget that allows to attach a keybinding to a combo box. The objective is to be able to easily tie a keybinding to a predefined action. This widget is also exposed to be used with the ``list`` widget.
- **label**: Added ``use-markup`` boolean option that allows to use markup in labels.
- **colorchooser**:

    + Added ability to activate the color chooser button when clicking the row is in, just like switches.
    + Exposed the capability for the color chooser to select color with or without alpha with the boolean option ``use-alpha``.
    + Added a button next to the widget that allows to clear its value.

- **textview**: Added ``accept-tabs`` boolean option. Setting it to **true** will allow to insert a tab character when pressing the :kbd:`Tab` key. Setting it to **false** the :kbd:`Tab` key will move the keyboard focus out of the widget.
- **textviewbutton**: A new widget similar to the **textview** widget. The editable entry is not rendered in the window page but visible by activation of a button that displays a dialog with the editable entry. In a **textview** widget, the editable entry has a fixed size. In the **textviewbutton** widget the editable entry has the size of the dialog and the dialog can be resized. The size of the dialog will persist throughout the life time of the settings window.
- **combobox**:

    + Changed the ``options`` option. I inverted the definition of ``options`` when they are declared as a dictionary. In Cinnamon's implementation, the key in the dictionary is used as a label and the value is used as the value for that label. In this implementation, the value is used as a key in the dictionary and the label as the value of that key. This was done to be able to localize the labels declared in a Python script. If I would have left the Cinnamon implementation intact, I would have been forced to create a *dummy strings storage* for ``gettext`` to be able to *see them* (which would have been a chore). Additionally, in Cinnamon's implementation, one ended up using keys with spaces, which freaked me out (LOL).
    + The ``options`` option in this implementation will have its items sorted alphabetically.
    + Added the possibility to create a combo box widget based on files found inside an specified path to a folder. To achieve this, the ``options`` option must be a dictionary that must contain a key named ``file-patterns``.

        * ``file-patterns``: A list of file patterns to be used by the :py:class:`fnmatch.filter` Python function. The names of the files that matches the patterns will be used to populate the combo box.
        * ``path-in-xlet``: A relative path to a folder inside the xlet folder that will be scanned for files using the ``file-patterns`` option. The items generated by files found in the folder specified by this option will be prefixed with a double colon (``::``).
        * ``path-in-setting``: The name of a setting that stores a custom path to a folder to scan for files.
        * Either the ``path-in-xlet`` option or the ``path-in-setting`` option or both can be specified, but at least one must be set.

    + Added ``first-option`` option. It allows to specify an ``options`` key to be always at the top of the combobox.
    + Exposed for configuration the ``valtype`` option for this widget. This was a necessity born of the change that I made to the ``options`` option.

    .. note::

        I finally figure out why in Cinnamon's implementation the ``options`` option is implemented in an *unnatural* way. It's because when the widgets are generated from definitions found in a settings-schema.json file, the values can be defined in the type that is needed (integer, float, string or boolean). Then, when the widget is built, the type is extracted from the values themselves. Since I inverted the ``options`` option into a *natural* behavior, I broke that very clever feature, and that's why I exposed the ``valtype`` option; to be able to explicitly set a type for an option.

- **appchooser**: A new widget that allows to select an application from the list of installed applications on a system. The value stored in the setting for this widget is the application ID (the name of its .desktop file).
- **applist**: A new widget that allows to store a list of unique applications that can be selected from the list of installed applications on a system. The value stored in the setting for this widget is an array with the list of application IDs (the name of their .desktop files).
- **filechooser**: Added a button that allows to clear the path set by this widget.
- **iconchooser**:

    + Modified to use a custom icon chooser widget that behaves similarly to the one used by Cinnamon's native settings system. Since Cinnamon's native depends on ``XApp``, I created almost from scratch a widget in Python (:any:`IconChooserDialog`).
    + The value in the widget is always displayed inside an entry for the quick edition of it without the need to open the icon chooser dialog. The entry also has auto-completion of icons.

- **scale**: Added ``min-label``, ``max-label`` and ``invert`` options. I just exposed already existent parameters.


Limitations
===========

- See :ref:`Countermeasures for xlets that make use of the custom settings framework <custom-settings-framework-countermeasures-reference>`.

TODO
====

1. Implement the rest of widgets (``datechooser``, ``fontchooser`` and ``tween``). Since I don't use them in any of my xlets, I didn't implemented these widgets just yet. I don't think that I will ever use nor implement any of these widgets (implementing them will require at least a couple of thousands lines of code!). **Ultra low priority**
2. Try to implement a mechanism that allows me to instantiate only the widgets that are going to be used for creating all widgets a window is going to need. Right now the *widget factory functions* (``JSONSettingsWidgets.json_settings_factory`` and ``GSettingsWidgets.g_settings_factory``) will register globally all widgets whether they will be used or not. I consider this kind of a waste of resources that **could** otherwise be used to improve the performance of displaying big amounts of data or creating a big number of widgets. I put emphasis in **could** because I don't know if this is something that actually harms the performance of the window display and/or operation. This is the main reason for me not to implement all the widgets that Cinnamon's native implementation has and why I only instantiate 2 of the 8 widgets the ``GSettingsWidgets`` module could handle. **Ultra low priority**
3. Try to get rid of all Python *wild-card imports* (``import *``). I wanted to get rid of this since day one, but in the couple of attempts that I made, I found X or Y problem. I'm tolerating them so far because most of the imported classes using this *abstract way* are also instantiated in an *abstract way*. **Ultra low priority**
4. I wanted to add to some of the dialogs the capability to be maximized.
5. The items in *dynamic combo box widgets* (combo boxes created based on a list of files) will not be updated (the setting window needs to be closed and re-opened) if any files are added/removed from the file system.

Done
====

.. contextual-admonition::
    :title: Implemented

    Final implementation details:

    - Use of side bars instead of stack switchers in the header bar.
    - At the start of the header bar, the instance switcher. If only one instance, the image of the xlet.
    - In the middle of the header, just the xlet name as the window title and the xlet UUID and instance ID as sub-title.
    - At the end of the header bar, the menu button to handle importing/exporting/reseting settings and optionally an item to open the xlet help page.
    - Implemented handling of multiple xlets instances.
    - Implemented handling of ``gsettings``.

Abandoned ideas
===============

List of ideas/concepts that I abandoned or that I dimmed too annoying or complex to implement. I leave these notes here so if in the future I have a similar idea, reading these notes will refresh the memories of the wounds they inflicted on me (LOL).

- **Abandoned due to being to complex**:

    + Implement a *multi-widget widget*. Something similar to the ``keybinding-with-options`` widget. But instead of binding a combo box to a key binding, I would like to bind any type of widget to an option selector widget (a combo box or a stack switcher). Very green idea yet.

- **Abandoned in favor of sidebars so I don't have to deal with the lack of space in the header bar**:

    + Forget about adding the window title to the header bar. If I implement this, I would have to add the instance switcher buttons at the start of the header bar, leaving no place whatsoever to display the window title.
    + Maybe add a status bar at the bottom of the window that can hold the window title along with other information; like the instance ID perhaps? Or maybe just a simple label at the top of the window and bellow the header bar? But what I like the most so far is:

        1. Add a button at the start of the header bar with the xlet icon as an image and the text "Settings for..." as a tooltip.
        2. In most cases, the image alone will serve to quickly identify to which xlet the window belongs.
        3. K.I.S.S. it. Do not add a menu nor any other action to the button.
        4. I already implemented this button without implementing multi-instance support. It was bothering me a big deal to see the title text ellipsized 90% of the time; it just made that text in that place totally useless. Like I said in point 3, in most cases the image is enough.


Migrating to Gtk4 (`attack of the web developers <https://docs.gtk.org/gtk4/migrating-3to4.html>`__)
====================================================================================================

Changes that can be done now on Gtk3 code
-----------------------------------------

- ``Gtk.Toolbar`` has been removed (good riddance!!!).

    + Already changed to containers with a CSS class set and normal widgets inside (Why on earth didn't I do this to begin with!?).

- ``Gtk.Menu``, ``Gtk.MenuBar`` and ``Gtk.MenuItem`` are gone.

    + Already changed the only menu that I used into a popover. If the animation of popovers cannot be eradicated globally I will destroy every single computer that I stumble upon!!!

- Stop using ``Gtk.Box`` padding, fill and expand child properties.

    + Done. I never used them.

- Set a proper application ID.

    + Done. Application ID and .desktop file base name are exactly the same.

- Stop using ``Gtk.main()`` and related APIs.

    + Done. I never used them.

- Stop using ``Gtk.FileChooserButton``.

    + And the stupidity continues!!! Now anyone that wants to implement ``Gtk.FileChooserButton`` as they were would have to write more than 3000 lines of code to replicate something that took just ONE F\*CKING LINE OF CODE!!! On the other hand, GOOD RIDDANCE!!! These buttons weren't even treated as buttons by Gtk themes when placed inside linked containers and their dialogs worked like crap.

Changes that cannot be done now on Gtk3 code
--------------------------------------------

- Stop using Gtk.Widget event signals.

    + Window state storage. Remove the use of ``window-state-event`` signal in favor of ``GtkWindow:default-width``, ``GtkWindow:default-height``, ``GtkWindow:maximized`` or ``GtkWindow:fullscreened``. Problems found:

        * Resizing a window triggers no property change whatsof\*ckingever.
        * The property for maximized state is called ``is-maximized``, not ``maximized``.

    + Replace ``button-press-event`` and ``button-release-event`` signals with ``Gtk.GestureClick``. Problems found:

        * ``Gtk.GestureClick`` doesn't exist.

    + Replace ``key-press-event`` and ``key-release-event`` signals with ``Gtk.EventControllerKey``. Problems found:

        * ``Gtk.EventControllerKey`` doesn't exist.

- Adapt to ``Gtk.CssProvider`` API changes.

    + Code marked. Replace ``Gtk.StyleContext.add_class`` with ``Gtk.Widget.add_css_class``.

- Stop using ``Gtk.ShadowType`` and ``Gtk.Relief`` properties.

    + Code marked. Replace the use of ``set_shadow_type`` and ``set_relief`` and set the boolean property ``has-frame``.

- Switch to ``Gtk.Widget`` children APIs.

    + Code marked.
