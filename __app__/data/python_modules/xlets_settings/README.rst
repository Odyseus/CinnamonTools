
===========================================
Cinnamon's xlets settings re-implementation
===========================================

General changes
---------------

- This implementation uses header bars instead of traditional windows. Why?

    + Because upstream is planing to switch to this aberration belched from the bowels of corporations full of web developers playing at being software developers. SO, better get used to this garbage in preparation for when it's forced down our throats.
    + Gtk.HeaderBars are easier to deal with (just create one and throw all widgets inside it). So, there is the barely bright side. LOL
    + In spite of my aversion for header bars, this framework is used for setting windows for xlets. And I create xlets whose settings are "to be set and forgotten". So, one just has to tolerate the settings window once. And for xlet settings that need to be changed frequently, I always create a mechanism to set them on-the-fly, without having to open the settings window.

- This implementation remembers the last state of opened windows. Setting an initial size for a window that will be suitable for every single combination of font sizes, Gtk3 themes, screen resolutions just doesn't cut it for me.
- This implementation doesn't use JSON files for the creation of the widgets. I wanted the power and flexibility of Python scripts.


Widget changes made on this implementation
------------------------------------------

- **button**: This widget doesn't use the *proxy* that the Cinnamon implementation uses. Instead, it just toggles a boolean setting that can be bound to any action on the xlet side.
- **entry**: This widget has the ``expand-width`` option set to True by default, as it should be.
- **list**: This widget has several bug fixes (**FIXME**: remember to properly report them) and several improvements.

    + Added ``color`` cell renderer. It allows to choose a color using a color chooser. The cell will be rendered with the selected color as its background color and the color *name* as its visible value. The color of the text will be black or white depending on the luminance of the background color.
    + Added a ``keybinding-with-options`` cell renderer. It allows to attach a keybinding to a combo box. The objective is to be able to easily tie a keybinding to a predefined action.
    + Added ``move-buttons`` boolean option. It allows to show/hide the move up/down buttons on the ``list`` widget.
    + Added ability to export and import the content of the list.
    + Added ``apply_key`` and ``imp_exp_path_key`` arguments.

        + The ``apply_key`` is a generic setting that can be bound to a function on the xlet side to allow to apply the changes made to the list on demand.
        + The ``imp_exp_path_key`` key is a generic setting that is used to store the last selected path when using the import/export dialogs.

    + Added ``dialog-info-labels`` option (an array/list of strings) that allows to display informative labels on the edit/add dialog. This allows to keep the window clean and at the same time keep basic information at hand.
    + Changed ``keybinding`` cell renderer. The cell will display the exact same name displayed in the ``keybinding`` widget instead of the internal value. For example, a ``keybinding`` with its shortcut set to **Control+d** (the actual internal value is **<Primary>d**), it will display **Control+D** in the ``keybinding`` widget label **AND** in the ``keybinding`` cell renderer.
    + Changed the ``options`` option. I inverted the definition of ``options`` when they are declared as a dictionary. In Cinnamon's implementation, the key in the dictionary is used as a label and the value is used as the value for that label. In this implementation, the value is used as a key in the dictionary and the label as the value of that key. This was done to be able to localize the labels declared in a Python script. If I would have left the Cinnamon implementation intact, I would have been forced to create a *dummy strings storage* for ``gettext`` to be able to see them (which would have been a chore). Additionally, in Cinnamon's implementation, one ended up using keys with spaces, which freaked me out (LOL).

- **keybinding**: Added ``num-bind`` integer option that exposes for configuration the number of keybindings to create for each ``keybinding`` widget.
- **label**: Added ``use-markup`` boolean option that allows to use markup in labels.
- **colorchooser**: Added ability to activate the color chooser button when clicking the row is in, just like switches.


Limitations of this implementation
----------------------------------

- Settings windows aren't multi instance. When dealing with multiple instances of the same xlet, a setting window for each instance of an xlet will be opened. This was done to simplify the code and to not depend on features dependent on specific Cinnamon versions nor on third-party libraries like XApps.


TODO
----

- Implement the rest of widgets (``datechooser``, ``fontchooser``, ``scale``, ``soundfilechooser`` and ``tween``). Since I don't use them in any of my xlets, I didn't implemented these widgets just yet.
- Implement handling of gsettings. This will allow me to use this framework on the xlets in which I use gsettings with custom GUIs.
- Implement a *multi-widget widget*. Something similar to the ``keybinding-with-options`` widget. But instead of binding a combo box to a key binding, I would like to bind any type of widget to an option selector widget (a combo box or a stack switcher). Very green idea yet.
