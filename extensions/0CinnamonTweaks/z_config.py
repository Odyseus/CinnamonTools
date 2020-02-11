#!/usr/bin/python3
# -*- coding: utf-8 -*-

settings = {
    "make_pot_additional_files": [
        "../../__app__/data/python_modules/xlets_settings/__init__.py",
        "../../__app__/data/python_modules/xlets_settings/SettingsWidgets.py",
        "../../__app__/data/python_modules/xlets_settings/TreeListWidgets.py"
    ],
    "extra_files": [{
        "source": "__app__/data/python_modules/xlets_settings",
        "destination": "python_modules/xlets_settings"
    }, {
        "source": "__app__/data/javascript_modules/globalUtils.js",
        "destination": "globalUtils.js"
    }, {
        "source": "__app__/data/javascript_modules/desktopNotificationsUtils.js",
        "destination": "desktopNotificationsUtils.js"
    }, {
        "source": "__app__/data/javascript_modules/customDialogs.js",
        "destination": "customDialogs.js"
    }, {
        "source": "__app__/data/javascript_modules/customFileUtils.js",
        "destination": "customFileUtils.js"
    }, {
        "source": "__app__/data/javascript_modules/spawnUtils.js",
        "destination": "spawnUtils.js"
    }, {
        "source": "__app__/data/javascript_modules/xletsSettingsUtils.js",
        "destination": "xletsSettingsUtils.js"
    }, {
        "source": "__app__/data/javascript_modules/debugManager.js",
        "destination": "debugManager.js"
    }, {
        "source": "__app__/data/gschemas/debugManagerSchema.xml",
        "destination": "schemas/org.cinnamon.{{XLET_TYPE}}s.{{UUID}}.gschema.xml"
    }]
}


if __name__ == "__main__":
    pass
