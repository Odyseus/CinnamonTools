#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys

if sys.version_info < (3, 7):
    msg = r'[1;31m WrongPythonVersion: Minimum Python version supported: 3.7 [0m'
    raise SystemExit(msg)

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(XLET_DIR)

from python_modules.xlets_settings import cli
from python_modules.xlets_settings.builder import WindowDefinition
from python_modules.xlets_settings.builder import get_debugging_section

XLET_UUID = os.path.basename(XLET_DIR)
XLET_TYPE = os.path.basename(os.path.dirname(XLET_DIR))[:-1]

COMBOBOX_OPTIONS_STRING_DICT = {
    "option_1": "Option 1",
    "option_2": "Option 2",
    "option_3": "Option 3",
    "option_4": "Option 4",
}

COMBOBOX_OPTIONS_STRING_LIST = [
    "option_1",
    "option_2",
    "option_3",
    "option_4"
]

COMBOBOX_OPTIONS_PATHS = {
    "file-patterns": ["*.txt"],
    "path-in-xlet": "files_for_combobox",
    "path-in-setting": "path_extra_files_for_combobox"
}

COMBOBOX_OPTIONS_INTEGER = {
    1: "Option 1",
    2: "Option 2",
    3: "Option 3",
    4: "Option 4",
}

LIST_1_COLUMNS = [{
    "id": "app",
    "title": "'app' list widget",
    "type": "app"
}, {
    "id": "boolean",
    "title": "'boolean' list widget",
    "type": "boolean"
}, {
    "id": "color",
    "title": "'color' list widget",
    "type": "color"
}, {
    "id": "file",
    "title": "'file' list widget (select-dir=False)",
    "type": "file"
}, {
    "id": "dir",
    "title": "'file' list widget (select-dir=True)",
    "select-dir": True,
    "type": "file"
}, {
    "id": "float",
    "title": "'float' list widget",
    "type": "float",
    "min": 0.0,
    "max": 1000.0,
    "step": 0.5
}, {
    "id": "integer",
    "title": "'integer' list widget",
    "type": "integer",
    "min": 0,
    "max": 1000,
    "step": 100
}, {
    "id": "icon",
    "title": "'icon' list widget",
    "type": "icon"
}]


LIST_2_COLUMNS = [{
    "id": "keybinding",
    "title": "'keybinding' list widget",
    "type": "keybinding"
}, {
    "id": "keybinding-with-options",
    "title": "'keybinding-with-options' list widget",
    "type": "keybinding-with-options",
    "options": COMBOBOX_OPTIONS_STRING_DICT
}, {
    "id": "multistring",
    "title": "'multistring' list widget",
    "type": "multistring"
}, {
    "id": "string",
    "title": "'string' list widget",
    "type": "string"
}, {
    "id": "string-with-options",
    "title": "'string' list widget (with 'options' set as a dictionary)",
    "type": "string",
    "options": COMBOBOX_OPTIONS_STRING_DICT
}, {
    "id": "string-with-options-list",
    "title": "'string' list widget (with 'options' set as a list)",
    "type": "string",
    "options": COMBOBOX_OPTIONS_STRING_LIST
}, {
    "id": "string-with-options-from_path",
    "title": "'string' list widget (with 'options' set from paths)",
    "type": "string",
    "options": COMBOBOX_OPTIONS_PATHS
}]

LIST_3_COLUMNS = [{
    "id": "title",
    "title": "Title",
    "type": "string"
}, {
    "id": "enabled",
    "title": "Enabled",
    "default": True,
    "type": "boolean"
}, {
    "id": "icon",
    "title": "Icon",
    "type": "icon"
}, {
    "id": "command",
    "title": "Command",
    "type": "string"
}]


win_def = WindowDefinition()

generic_page = win_def.add_page("Generic")
generic_section = generic_page.add_section("Generic widgets")
generic_section.add_label({
    "label": "This is a label, and the content can't be modified nor accessed. You may want to use a label to show additional hints or instructions, for example. 'label' widgets aren't tied to a preference. They are only used to display information."
})
generic_section.add_label({
    "label": 'This is a label that uses <a href="https://developer.gnome.org/pygtk/stable/pango-markup-language.html" title="Click to find out more">Pango markup</a> and is selectable. Text can be <small>small</small>, <big>big</big>, <b>bold</b>, <i>italic</i> and even point to somewhere in the <a href="https://github.com/linuxmint/cinnamon" title="Click to find out more">internets</a>.',
    "selectable": True,
    "use_markup": True
})
generic_section.add_widget("switch", "switch", {
    "description": "'switch' widget"
})
generic_section.add_widget("entry", "entry", {
    "description": "'entry' widget (expand-width=true [Default]"
})
generic_section.add_widget("combobox", "combobox_string", {
    "description": "'combobox' widget (valtype=str set as dictionary)",
    "valtype": str,
    "options": COMBOBOX_OPTIONS_STRING_DICT
})
generic_section.add_widget("combobox", "combobox_string_list", {
    "description": "'combobox' widget (valtype=str set as list)",
    "valtype": str,
    "options": COMBOBOX_OPTIONS_STRING_LIST
})
generic_section.add_widget("combobox", "combobox_paths", {
    "description": "'combobox' widget (valtype=str set from paths)",
    "valtype": str,
    "options": COMBOBOX_OPTIONS_PATHS
})
generic_section.add_widget("combobox", "combobox_integer", {
    "description": "'combobox' widget (valtype=int)",
    "valtype": int,
    "options": COMBOBOX_OPTIONS_INTEGER
})
generic_section.add_widget("spinbutton", "spinbutton", {
    "description": "'spinbutton' widget",
    "default": 0,
    "min": -100,
    "max": 100,
    "step": 1,
    "page": 10,
    "units": "units"
})
generic_section.add_widget("button", "button", {
    "description": "'button' widget",
    "tooltip": "'button' widgets are tied to a boolean preference that can be bound to any action/function."
})
generic_section.add_widget("textview", "textview", {
    "description": "'textview' widget (height=150)",
    "height": 150
})
generic_section.add_widget("textviewbutton", "textviewbutton", {
    "description": "'textviewbutton' widget"
})

choosers_page = win_def.add_page("Choosers")
path_choosers_section = choosers_page.add_section("Path choosers")
path_choosers_section.add_widget("filechooser", "filechooser_directory_select", {
    "description": "'filechooser' widget (select-dir=True)",
    "select-dir": True
})
path_choosers_section.add_widget("filechooser", "filechooser_file_select", {
    "description": "'filechooser' widget (select-dir=False)"
})
other_choosers_section = choosers_page.add_section("Other choosers")
other_choosers_section.add_widget("iconfilechooser", "iconfilechooser", {
    "description": "'iconfilechooser' widget"
})
other_choosers_section.add_widget("colorchooser", "colorchooser", {
    "description": "'colorchooser' widget"
})
other_choosers_section.add_widget("soundfilechooser", "soundfilechooser", {
    "description": "'soundfilechooser' widget"
})
other_choosers_section.add_widget("appchooser", "appchooser", {
    "description": "'appchooser' widget"
})
other_choosers_section.add_widget("applist", "applist", {
    "description": "'applist' widget"
})
other_choosers_section.add_widget("stringslist", "stringslist", {
    "description": "'stringslist' widget"
})

sliders_page = win_def.add_page("Sliders")
sliders_section = sliders_page.add_section("'scale' widget")
sliders_section.add_widget("scale", "scale_1", {
    "description": "'scale' widget (min-label and max-label same as min and max)",
    "default": 125,
    "min": 0,
    "max": 255,
    "step": 1
})
sliders_section.add_widget("scale", "scale_2", {
    "description": "'scale' widget (custom min-label and max-label, invert=True)",
    "default": 125,
    "min-label": "transparent",
    "max-label": "opaque",
    "invert": True,
    "min": 0,
    "max": 255,
    "step": 1
})
sliders_section.add_widget("scale", "scale_3", {
    "description": "'scale' widget with marks (min-label and max-label hidden, show-value=False)",
    "default": 125,
    "show-value": False,
    "min-label": None,
    "max-label": None,
    "min": 0,
    "max": 100,
    "step": 1,
    "marks": {
        "0": "0%",
        "25": "25%",
        "50": "50%",
        "75": "75%",
        "100": "100%",
    },
    # NOTE: Same marks but without mark labels.
    # "marks": [0,25,50,75,100],
})

list_page = win_def.add_page("Lists")
list_section = list_page.add_section("Basic 'list' widget")
list_section.add_widget("list", "list_1", {
    "columns": LIST_1_COLUMNS,
    "height": 150
})

list_section = list_page.add_section("A 'list' widget with more features",
                                     notes=["Items can be exported/imported. Imported items can be appended or overwrite existent ones."])
list_section.add_widget("list", "list_2", {
    "columns": LIST_2_COLUMNS,
    "height": 150
})

list_immutable_page = win_def.add_page("Immutable list")
list_immutable_section = list_immutable_page.add_section(
    "'list' widget (immutable=true and move-buttons=false)")
list_immutable_section.add_label({
    "label": "This is a convenient use of a 'list' widget. In this example, instead of individually creating all widgets (a 'switch', an 'iconfilechooser' and two 'entry's) for each of the following options, they are all grouped in one widget for easy edition and less window space \"consumption\"."
})
list_immutable_section.add_widget("list", "list_3", {
    "columns": LIST_3_COLUMNS,
    "immutable": {
        "read-only-keys": ["title"],
        "allow-edition": True
    },
    "height": 200,
    "move-buttons": False
})

dep_page = win_def.add_page("Dependencies")
dep_section = dep_page.add_section("Boolean checks")
dep_section.add_widget("switch", "dependency_1_boolean", {
    "description": "Dependency 1"
})
dep_section.add_widget("entry", "dependency_1_true", {
    "description": "Dependency 1 is true",
    "dependency": "dependency_1_boolean"
})
dep_section.add_widget("entry", "dependency_1_false", {
    "description": "Dependency 1 is false",
    "dependency": "!dependency_1_boolean"
})

dep_section = dep_page.add_section("Comparisons")
dep_section.add_widget("spinbutton", "dependency_2_comparisons", {
    "description": "Dependency 2",
    "min": -1,
    "max": 1,
    "step": 1
})
dep_section.add_widget("entry", "dependency_2_greater_than", {
    "description": "Dependency 2 is greater than 1",
    "dependency": "dependency_2_comparisons>1"
})
dep_section.add_widget("entry", "dependency_2_less_than", {
    "description": "Dependency 2 is less than 1",
    "dependency": "dependency_2_comparisons<1"
})
dep_section.add_widget("entry", "dependency_2_equal_or_greater_than", {
    "description": "Dependency 2 is equal or greater than 0",
    "dependency": "dependency_2_comparisons>=0"
})
dep_section.add_widget("entry", "dependency_2_equal_or_less_than", {
    "description": "Dependency 2 is equal or less than 0",
    "dependency": "dependency_2_comparisons<=0"
})
dep_section.add_widget("entry", "dependency_2_equal", {
    "description": "Dependency 2 is equal to 0",
    "dependency": "dependency_2_comparisons=0"
})

dep_section = dep_page.add_section("Multiple dependencies")
dep_section.add_widget("entry", "dependency_3_multiple_1", {
    "description": "Dependency 1 is true and dependency 2 is greater than 0",
    "dependency": [
        "dependency_1_boolean",
        "dependency_2_comparisons>0"
    ]
})
dep_section.add_widget("entry", "dependency_3_multiple_2", {
    "description": "Dependency 1 is false and dependency 2 is less than 0",
    "dependency": [
        "!dependency_1_boolean",
        "dependency_2_comparisons<0"
    ]
})

key_page = win_def.add_page("Keybindings")
key_section = key_page.add_section("Keybindings")
key_section.add_widget("keybinding", "keybinding_1", {
    "description": "keybinding (num-bind=1 [Default])",
    "num-bind": 1
})
key_section.add_widget("keybinding", "keybinding_2", {
    "description": "keybindings (num-bind=2)",
    "num-bind": 2
})
key_section.add_widget("keybinding-with-options", "keybinding_with_options", {
    "description": "keybinding-with-options",
    "options": COMBOBOX_OPTIONS_STRING_DICT
})

###############################
# File JavaScript class tests #
###############################

file_page = win_def.add_page("File tests")
file_section = file_page.add_section("File JavaScript class tests", info={
    "message": "\n".join([
        "This page is for testing the <i>File</i> class of the <b>customFileUtils.js</b> JavaScript module.",
        "For safety reasons, files/folders paths must be manually specified in the respective section's entries and must always point to a location inside the folder named <b>file_tests_playground</b> at the root of this extension's folder.",
        "The <b>Init file object</b> button creates an instance of the <i>File</i> class using the path specified in an entry's section. The <b>Destroy file object</b> button simply sets the stored instance to <i>null</i>.",
        "Each action performed by any of the buttons is logged.",
    ])
})
file_section.add_widget("entry", "filetest_instancepath", {
    "description": "Path for instance",
    "tooltip": "This is the path with which an instance of the <i>File</i> class will be intantiated. All actions performed by all the buttons bellow will interact with the file or folder specified here."
})
file_section.add_widget("entry", "filetest_secondarypath", {
    "description": "Secondary path",
    "tooltip": "For now, this path is only used by the <b>Copy</b> button. The file or folder specified as instance path will be copied to the path specified here."
})
file_section.add_buttons_group(widget_kwargs={
    "buttons": [
        [
            "filetest_init", {
                "description": "Init file object"
            }
        ], [
            "filetest_destroy", {
                "description": "Destroy file object"
            }
        ]
    ]
})
file_section.add_buttons_group(widget_kwargs={
    "buttons": [
        [
            "filetest_exists", {
                "tooltip": "Exists?",
                "image": "filetest-exists-symbolic"
            }
        ], [
            "filetest_isfile", {
                "tooltip": "Is file?",
                "image": "filetest-isfile-symbolic"
            }
        ], [
            "filetest_isrealfile", {
                "tooltip": "Is real file?",
                "image": "filetest-isfile-symbolic"
            }
        ], [
            "filetest_isdirectory", {
                "tooltip": "Is directory?",
                "image": "filetest-isdirectory-symbolic"
            }
        ], [
            "filetest_isrealdirectory", {
                "tooltip": "Is real directory?",
                "image": "filetest-isdirectory-symbolic"
            }
        ], [
            "filetest_issymlink", {
                "tooltip": "Is symbolic link?",
                "image": "filetest-issymlink-symbolic"
            }
        ], [
            "filetest_isexecutable", {
                "tooltip": "Is executable?",
                "image": "filetest-isexecutable-symbolic"
            }
        ]
    ]
})
file_section.add_buttons_group(widget_kwargs={
    "buttons": [
        [
            "filetest_info", {
                "description": "Get file info"
            }
        ], [
            "filetest_read", {
                "description": "Read file content"
            }
        ], [
            "filetest_listdir", {
                "description": "List directory"
            }
        ], [
            "filetest_setexecutable", {
                "description": "Set executable"
            }
        ]
    ]
})
file_section.add_buttons_group(widget_kwargs={
    "buttons": [
        [
            "filetest_copy", {
                "description": "Copy"
            }
        ], [
            "filetest_delete", {
                "description": "Delete"
            }
        ], [
            "filetest_write", {
                "description": "Write to file"
            }
        ], [
            "filetest_append", {
                "description": "Append to file"
            }
        ]
    ]
})


file_section = file_page.add_section("")
file_section.add_widget("textview", "filetest_data_to_write", {
    "description": "Data to write/append to the instance file",
    "height": 100
})
file_section.add_widget("switch", "filetest_ensureparents", {
    "description": "Ensure parents",
    "tooltip": "Ensure that parent directories are created when writing to non-existent files."
})

###############################
# File JavaScript class tests #
###############################

other_page = win_def.add_page("Other")
other_section = other_page.add_section("gsettings widgets", notes=[
    "The settings in this section are the same found in System Settings > Windows > Alt-Tab."
])
other_section.add_widget("gcombobox", "alttab-switcher-style", {
    "description": "Alt-Tab switcher style",
    "options": {
        "icons": "Icons only",
        "thumbnails": "Thumbnails only",
        "icons+thumbnails": "Icons and thumbnails",
        "icons+preview": "Icons and window preview",
        "preview": "Window preview (no icons)",
        "coverflow": "Coverflow (3D)",
        "timeline": "Timeline (3D)"
    }
}, schema="org.cinnamon")
other_section.add_widget("gswitch", "alttab-switcher-enforce-primary-monitor", {
    "description": "Display the alt-tab switcher on the primary monitor instead of the active one"
}, schema="org.cinnamon")

other_page.add_section(get_debugging_section(XLET_TYPE, XLET_UUID))


if __name__ == "__main__":
    sys.argv.extend((f'--xlet-uuid={XLET_UUID}', f'--xlet-type={XLET_TYPE}'))
    sys.exit(cli(win_def))
