#!/usr/bin/python3
# -*- coding: utf-8 -*-

settings = {
    "make_pot_additional_files": [
        "../../__app__/data/python_modules/file_chooser_dialog/__init__.py"
    ],
    "extra_files": [{
        "source": "__app__/data/javascript_modules/globalUtils.js",
        "destination": "globalUtils.js"
    }, {
        "source": "__app__/data/python_modules/xlets_settings",
        "destination": "python_modules/xlets_settings"
    }, {
        "source": "__app__/data/python_modules/file_chooser_dialog",
        "destination": "python_modules/file_chooser_dialog"
    }, {
        "source": "__app__/data/javascript_modules/customTooltips.js",
        "destination": "customTooltips.js"
    }, {
        "source": "__app__/data/javascript_modules/customFileUtils.js",
        "destination": "customFileUtils.js"
    }, {
        "source": "__app__/data/javascript_modules/customTooltips.js",
        "destination": "customTooltips.js"
    }, {
        "source": "__app__/data/javascript_modules/desktopNotificationsUtils.js",
        "destination": "desktopNotificationsUtils.js"
    }, {
        "source": "__app__/data/javascript_modules/debugManager.js",
        "destination": "debugManager.js"
    }, {
        "source": "__app__/data/gschemas/debugManagerSchema.xml",
        "destination": "schemas/org.cinnamon.{{XLET_TYPE}}s.{{UUID}}.gschema.xml"
    }, {
        "source": "__app__/data/javascript_modules/customDialogs.js",
        "destination": "customDialogs.js"
    }]
}


if __name__ == "__main__":
    pass
