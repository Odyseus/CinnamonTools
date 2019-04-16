#!/usr/bin/python3
# -*- coding: utf-8 -*-
import argparse
import os
import sys

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
modules_dir = os.path.join(XLET_DIR)
sys.path.append(modules_dir)

from python_modules.xlets_settings import MainApplication
from python_modules.xlets_settings import _


COLUMNS = [{
    "id": "enabled",
    "title": _("Enabled"),
    "type": "boolean"
}, {
    "id": "icon",
    "title": "%s (*)" % _("Icon"),
    "type": "icon"
}, {
    "id": "title",
    "title": "%s (*)" % _("Title"),
    "type": "string"
}, {
    "id": "command",
    "title": "%s (*)" % _("Command"),
    "type": "string"
}, {
    "id": "description",
    "title": _("Description"),
    "type": "string"
}]

INFO_LABEL = [
    "<b>(*) %s</b>" % _("Mandatory fields")
]

LAUNCHERS_TAB = {
    "page-title": _("Custom launchers"),
    "sections": [{
        "section-title": _("Custom launchers"),
        "widgets": [{
            "widget-type": "list",
            "args": {
                "pref_key": "pref_custom_launchers",
                "apply_key": "pref_hard_refresh_menu",
                "imp_exp_path_key": "pref_imp_exp_last_selected_directory",
                "properties": {
                    "columns": COLUMNS,
                    "height": 300,
                    "dialog-info-labels": INFO_LABEL
                }
            }
        }, {
            "widget-type": "label",
            "args": {
                "label": INFO_LABEL[0],
                "use_markup": True
            }
        }]
    }]
}


PAGES_OBJECT = [
    LAUNCHERS_TAB
]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--xlet-type", dest="xlet_type")
    parser.add_argument("--xlet-instance-id", dest="xlet_instance_id")
    parser.add_argument("--xlet-uuid", dest="xlet_uuid")

    args = parser.parse_args()

    app = MainApplication(
        application_base_id="org.Cinnamon.Applets.CinnamonMenu.CustomLaunchersManager",
        xlet_type=args.xlet_type or "extension",
        xlet_instance_id=args.xlet_instance_id or None,
        xlet_uuid=args.xlet_uuid or "{{UUID}}",
        pages_definition=PAGES_OBJECT,
        application_title=_("Custom launchers manager"),
        win_initial_width=800,
        win_initial_height=520,
        display_settings_handling=False
    )
    app.run()
