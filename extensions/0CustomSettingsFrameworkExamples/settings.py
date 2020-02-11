#!/usr/bin/python3
# -*- coding: utf-8 -*-
import argparse
import os
import sys

from html import escape

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(XLET_DIR)

from python_modules.xlets_settings import MainApplication


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

COMBOBOX_OPTIONS = {
    "option_1": "Option 1",
    "option_2": "Option 2",
    "option_3": "Option 3",
    "option_4": "Option 4",
}

LIST_1_COLUMNS = [{
    "id": "ap",
    "title": "app",
    "type": "app"
}, {
    "id": "boolea",
    "title": "boolean",
    "type": "boolean"
}, {
    "id": "color",
    "title": "color",
    "type": "color"
}, {
    "id": "fil",
    "title": "file",
    "type": "file"
}, {
    "id": "float",
    "title": "float",
    "type": "float",
    "min": 0.0,
    "max": 1000.0,
    "step": 0.5
}, {
    "id": "ico",
    "title": "icon",
    "type": "icon"
}, {
    "id": "integer",
    "title": "integer",
    "type": "integer",
    "min": 0,
    "max": 1000,
    "step": 100
}, {
    "id": "keybindin",
    "title": "keybinding",
    "type": "keybinding"
}, {
    "id": "keybinding-with-option",
    "title": "keybinding-with-options",
    "type": "keybinding-with-options",
    "options": COMBOBOX_OPTIONS
}, {
    "id": "multistrin",
    "title": "multistring",
    "type": "multistring"
}, {
    "id": "strin",
    "title": "string",
    "type": "string"
}, {
    "id": "string-with-options",
    "title": "string",
    "type": "string",
    "options": COMBOBOX_OPTIONS
}]

LIST_2_COLUMNS = [{
    "id": "enabled",
    "title": "Enabled",
    "default": True,
    "type": "boolean"
}, {
    "id": "icon",
    "title": "Icon",
    "type": "icon"
}, {
    "id": "title",
    "title": "Title",
    "type": "string"
}, {
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
                "pref_key": "pref_combobox"
            },
            "widget-kwargs": {
                "description": "'combobox' widget",
                "options": COMBOBOX_OPTIONS
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
                "options": COMBOBOX_OPTIONS
            }
        }]
    }]
}

OTHER_TAB = {
    "page-title": "Other",
    "sections": [{
        "section-title": "Debugging",
        "section-notes": [CINN_RESTART],
        "widgets": [{
            "widget-type": "gcombobox",
            "widget-attrs": {
                "pref_key": "pref-logging-level",
                "schema": "org.cinnamon.{{XLET_TYPE}}s.{{UUID}}"
            },
            "widget-kwargs": {
                "description": "Logging level" + ASTERISK,
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
                "description": "Enable debugger" + ASTERISK,
                "tooltip": "It enables the ability to catch all exceptions that under normal use would not be caught."
            }
        }]
    }]
}


PAGES_OBJECT = [
    GENERIC_TAB,
    CHOOSERS_TAB,
    KEYBINDINGS_TAB,
    LIST_1_TAB,
    LIST_2_TAB,
    DEPENDENCIES_TAB,
    OTHER_TAB
]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--xlet-type", dest="xlet_type")
    parser.add_argument("--xlet-instance-id", dest="xlet_instance_id")
    parser.add_argument("--xlet-uuid", dest="xlet_uuid")

    args = parser.parse_args()

    app = MainApplication(
        application_id="org.Cinnamon.Extensions.CustomSettingsFrameworkExamples.Settings",
        xlet_type=args.xlet_type or "extension",
        xlet_instance_id=args.xlet_instance_id or None,
        xlet_uuid=args.xlet_uuid or "{{UUID}}",
        pages_definition=PAGES_OBJECT,
        win_initial_width=800,
        win_initial_height=600,
    )
    app.run()
