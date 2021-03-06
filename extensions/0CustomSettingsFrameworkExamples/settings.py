#!/usr/bin/python3
# -*- coding: utf-8 -*-
import os
import sys

from html import escape

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(XLET_DIR)

from python_modules.xlets_settings import cli


EXAMPLE_PAGE = {
    # The text that will be displayed in the sidebar to select this page.
    "page-title": "Page title",
    # The sections that this page will contain.
    "sections": [{
        # The section title.
        "section-title": "Section title",
        # The widgets that this section will contain.
        "widgets": [{
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_key",
                "apply_key": "pref_apply_key",
                "imp_exp_path_key": "pref_imp_exp_path_key"
            },
            "widget-kwargs": {
                "description": "'switch' widget"
            }
        }]
    }]
}

ASTERISK = " (*)"

CINN_RESTART = "(*) <i>%s</i>" % escape("Cinnamon needs to be restarted")


LOGGING_LEVEL_TOOLTIP = "\n".join([
    "It enables the ability to log the output of several functions used by the extension.",
    "",
    "%s: %s" % ("Normal", "Only log messages caused by non critical errors."),
    "%s: %s" % ("Verbose", "Additionally log extra output messages and all HTTP responses."),
    "%s: %s" % ("Very verbose",
                "Additionally log all method calls from all JavaScript classes/prototypes along with their execution time.")
])

COMBOBOX_OPTIONS_STRING = {
    "option_1": "Option 1",
    "option_2": "Option 2",
    "option_3": "Option 3",
    "option_4": "Option 4",
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
    "id": "icon",
    "title": "'icon' list widget",
    "type": "icon"
}, {
    "id": "integer",
    "title": "'integer' list widget",
    "type": "integer",
    "min": 0,
    "max": 1000,
    "step": 100
}, {
    "id": "keybinding",
    "title": "'keybinding' list widget",
    "type": "keybinding"
}, {
    "id": "keybinding-with-options",
    "title": "'keybinding-with-options' list widget",
    "type": "keybinding-with-options",
    "options": COMBOBOX_OPTIONS_STRING
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
    "title": "'string' list widget (with 'options' set)",
    "type": "string",
    "options": COMBOBOX_OPTIONS_STRING
}]

LIST_2_COLUMNS = [{
    "id": "title",
    "title": "Title",
    "type": "string"
},{
    "id": "enabled",
    "title": "Enabled",
    "default": True,
    "type": "boolean"
}, {
    "id": "icon",
    "title": "Icon",
    "type": "icon"
},  {
    "id": "command",
    "title": "Command",
    "type": "string"
}]

GENERIC_TAB = {
    "page-title": "Generic",
    "sections": [{
        "section-title": "Generic widgets",
        "widgets": [{
            "widget-type": "label",
            "widget-kwargs": {
                "label": "This is a label, and the content can't be modified nor accessed. You may want to use a label to show additional hints or instructions, for example. 'label' widgets aren't tied to a preference. They are only used to display information."
            }
        }, {
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_switch",
            },
            "widget-kwargs": {
                "description": "'switch' widget"
            }
        }, {
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_entry"
            },
            "widget-kwargs": {
                "description": "'entry' widget (expand-width=true [Default]"
            }
        }, {
            "widget-type": "combobox",
            "widget-attrs": {
                "pref_key": "pref_combobox_string"
            },
            "widget-kwargs": {
                "description": "'combobox' widget (valtype=str)",
                "valtype": str,
                "options": COMBOBOX_OPTIONS_STRING
            }
        }, {
            "widget-type": "combobox",
            "widget-attrs": {
                "pref_key": "pref_combobox_integer"
            },
            "widget-kwargs": {
                "description": "'combobox' widget (valtype=int)",
                "valtype": int,
                "options": COMBOBOX_OPTIONS_INTEGER
            }
        }, {
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_spinbutton"
            },
            "widget-kwargs": {
                "description": "'spinbutton' widget",
                "default": 0,
                "min": -100,
                "max": 100,
                "step": 1,
                "page": 10,
                "units": "units"
            }
        }, {
            "widget-type": "button",
            "widget-attrs": {
                "pref_key": "pref_button"
            },
            "widget-kwargs": {
                "description": "'button' widget",
                "tooltip": "'button' widgets are tied to a boolean preference that can be bound to any action/function."
            }
        }, {
            "widget-type": "textview",
            "widget-attrs": {
                "pref_key": "pref_textview"
            },
            "widget-kwargs": {
                "description": "'textview' widget (height=150)",
                "height": 150
            }
        }]
    }]
}

CHOOSERS_TAB = {
    "page-title": "Choosers",
    "sections": [{
        "section-title": "Path choosers",
        "widgets": [{
            "widget-type": "filechooser",
            "widget-attrs": {
                "pref_key": "pref_filechooser_directory_select"
            },
            "widget-kwargs": {
                "description": "'filechooser' widget (select-dir=True)",
                "select-dir": True
            }
        }, {
            "widget-type": "filechooser",
            "widget-attrs": {
                "pref_key": "pref_filechooser_file_select"
            },
            "widget-kwargs": {
                "description": "'filechooser' widget (select-dir=False)"
            }
        }]
    }, {
        "section-title": "Other choosers",
        "widgets": [{
            "widget-type": "iconfilechooser",
            "widget-attrs": {
                "pref_key": "pref_iconfilechooser"
            },
            "widget-kwargs": {
                "description": "'iconfilechooser' widget"
            }
        }, {
            "widget-type": "colorchooser",
            "widget-attrs": {
                "pref_key": "pref_colorchooser"
            },
            "widget-kwargs": {
                "description": "'colorchooser' widget"
            }
        }, {
            "widget-type": "appchooser",
            "widget-attrs": {
                "pref_key": "pref_appchooser"
            },
            "widget-kwargs": {
                "description": "'appchooser' widget"
            }
        }, {
            "widget-type": "applist",
            "widget-attrs": {
                "pref_key": "pref_applist"
            },
            "widget-kwargs": {
                "description": "'applist' widget"
            }
        }]
    }]
}

LIST_1_TAB = {
    "page-title": "List",
    "sections": [{
        "section-title": "'list' widget",
        "widgets": [{
            "widget-type": "label",
            "widget-kwargs": {
                "label": ""
            }
        }, {
            "widget-type": "list",
            "widget-attrs": {
                "pref_key": "pref_list_1",
                "apply_key": "pref_list_1_apply",
                "imp_exp_path_key": "pref_list_1_imp_exp_path"
            },
            "widget-kwargs": {
                "columns": LIST_1_COLUMNS,
                "height": 300
            }
        }]
    }]
}

LIST_2_TAB = {
    "page-title": "Immutable list",
    "sections": [{
        "section-title": "'list' widget (immutable=true and move-buttons=false)",
        "widgets": [{
            "widget-type": "label",
            "widget-kwargs": {
                "label": "This is a convenient use of a 'list' widget. In this example, instead of individually creating all widgets (a 'switch', an 'iconfilechooser' and two 'entry's) for each of the following options, they are all grouped in one widget for easy edition and less window space \"consumption\"."
            }
        }, {
            "widget-type": "list",
            "widget-attrs": {
                "pref_key": "pref_list_2",
                "apply_key": "pref_list_2_apply"
            },
            "widget-kwargs": {
                "columns": LIST_2_COLUMNS,
                "immutable": {
                    "read-only-keys": ["title"],
                    "allow-edition": True
                },
                "height": 200,
                "move-buttons": False
            }
        }]
    }]
}

DEPENDENCIES_TAB = {
    "page-title": "Dependencies",
    "sections": [{
        "section-title": "Boolean checks",
        "widgets": [{
            "widget-type": "switch",
            "widget-attrs": {
                "pref_key": "pref_dependency_1_boolean"
            },
            "widget-kwargs": {
                "description": "Dependency 1"
            }
        }, {
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_dependency_1_true"
            },
            "widget-kwargs": {
                "description": "Dependency 1 is true",
                "dependency": "pref_dependency_1_boolean"
            }
        }, {
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_dependency_1_false"
            },
            "widget-kwargs": {
                "description": "Dependency 1 is false",
                "dependency": "!pref_dependency_1_boolean"
            }
        }]
    }, {
        "section-title": "Comparisons",
        "widgets": [{
            "widget-type": "spinbutton",
            "widget-attrs": {
                "pref_key": "pref_dependency_2_comparisons"
            },
            "widget-kwargs": {
                "description": "Dependency 2",
                "min": -1,
                "max": 1,
                "step": 1
            }
        }, {
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_dependency_2_greater_than"
            },
            "widget-kwargs": {
                "description": "Dependency 2 is greater than 1",
                "dependency": "pref_dependency_2_comparisons>1"
            }
        }, {
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_dependency_2_less_than"
            },
            "widget-kwargs": {
                "description": "Dependency 2 is less than 1",
                "dependency": "pref_dependency_2_comparisons<1"
            }
        }, {
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_dependency_2_equal_or_greater_than"
            },
            "widget-kwargs": {
                "description": "Dependency 2 is equal or greater than 0",
                "dependency": "pref_dependency_2_comparisons>=0"
            }
        }, {
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_dependency_2_equal_or_less_than"
            },
            "widget-kwargs": {
                "description": "Dependency 2 is equal or less than 0",
                "dependency": "pref_dependency_2_comparisons<=0"
            }
        }, {
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_dependency_2_equal"
            },
            "widget-kwargs": {
                "description": "Dependency 2 is equal to 0",
                "dependency": "pref_dependency_2_comparisons=0"
            }
        }]
    }, {
        "section-title": "Multiple dependencies",

        "widgets": [{
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_dependency_3_multiple_1"
            },
            "widget-kwargs": {
                "description": "Dependency 1 is true and dependency 2 is greater than 0",
                "dependency": [
                    "pref_dependency_1_boolean",
                    "pref_dependency_2_comparisons>0"
                ]
            }
        }, {
            "widget-type": "entry",
            "widget-attrs": {
                "pref_key": "pref_dependency_3_multiple_2"
            },
            "widget-kwargs": {
                "description": "Dependency 1 is false and dependency 2 is less than 0",
                "dependency": [
                    "!pref_dependency_1_boolean",
                    "pref_dependency_2_comparisons<0"
                ]
            }
        }]
    }]
}

KEYBINDINGS_TAB = {
    "page-title": "Keybindings",
    "sections": [{
        "section-title": "Debugging",
        "widgets": [{
            "widget-type": "keybinding",
            "widget-attrs": {
                "pref_key": "pref_keybinding_1"
            },
            "widget-kwargs": {
                "description": "keybinding (num-bind=1 [Default])",
                "num-bind": 1
            }
        }, {
            "widget-type": "keybinding",
            "widget-attrs": {
                "pref_key": "pref_keybinding_2"
            },
            "widget-kwargs": {
                "description": "keybindings (num-bind=2)",
                "num-bind": 2
            }
        }, {
            "widget-type": "keybinding-with-options",
            "widget-attrs": {
                "pref_key": "pref_keybinding_with_options"
            },
            "widget-kwargs": {
                "description": "keybinding-with-options",
                "options": COMBOBOX_OPTIONS_STRING
            }
        }]
    }]
}

OTHER_TAB = {
    "page-title": "Other",
    "sections": [{
        "section-title": "gsettings widgets",
        "section-notes": [
            "The settings in this section are the same found in System Settings > Windows > Alt-Tab."
        ],
        "widgets": [{
            "widget-type": "gcombobox",
            "widget-attrs": {
                "pref_key": "alttab-switcher-style",
                "schema": "org.cinnamon"
            },
            "widget-kwargs": {
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
            }
        }, {
            "widget-type": "gswitch",
            "widget-attrs": {
                "pref_key": "alttab-switcher-enforce-primary-monitor",
                "schema": "org.cinnamon"
            },
            "widget-kwargs": {
                "description": "Display the alt-tab switcher on the primary monitor instead of the active one"
            }
        }, {
            "widget-type": "gspinbutton",
            "widget-attrs": {
                "pref_key": "alttab-switcher-delay",
                "schema": "org.cinnamon"
            },
            "widget-kwargs": {
                "description": "Delay before displaying the alt-tab switcher",
                "min": 0,
                "max": 1000,
                "step": 50,
                "page": 150,
                "units": "milliseconds"
            }
        }]
    }, {
        "section-title": "Debugging",
        "section-notes": [
            CINN_RESTART,
            "In addition to being used by this extension, this section contains widgets that can control gsettings."
        ],
        "widgets": [{
            "widget-type": "gcombobox",
            "widget-attrs": {
                "pref_key": "pref-logging-level",
                "schema": "org.cinnamon.{{XLET_TYPE}}s.{{UUID}}"
            },
            "widget-kwargs": {
                "description": "Logging level" + ASTERISK + " 'gcombobox' widget",
                "tooltip": LOGGING_LEVEL_TOOLTIP,
                "options": {
                    0: "Normal",
                    1: "Verbose",
                    2: "Very verbose"
                }
            }
        }, {
            "widget-type": "gswitch",
            "widget-attrs": {
                "pref_key": "pref-debugger-enabled",
                "schema": "org.cinnamon.{{XLET_TYPE}}s.{{UUID}}"
            },
            "widget-kwargs": {
                "description": "Enable debugger" + ASTERISK + " 'gswitch' widget",
                "tooltip": "It enables the ability to catch all exceptions that under normal use would not be caught."
            }
        }]
    }]
}


PAGES_DEFINITION = [
    GENERIC_TAB,
    CHOOSERS_TAB,
    KEYBINDINGS_TAB,
    LIST_1_TAB,
    LIST_2_TAB,
    DEPENDENCIES_TAB,
    OTHER_TAB
]


if __name__ == "__main__":
    # NOTE: I extend sys.argv for extensions so I can call the settings.py script without arguments.
    sys.argv.extend(("--xlet-uuid={{UUID}}",
                     "--app-id=org.Cinnamon.Extensions.CustomSettingsFrameworkExamples.Settings"))
    sys.exit(cli(PAGES_DEFINITION))
