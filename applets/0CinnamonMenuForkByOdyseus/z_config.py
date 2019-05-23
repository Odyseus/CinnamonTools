#!/usr/bin/python3
# -*- coding: utf-8 -*-

settings = {
    "make_pot_additional_files": [
        "../../__app__/data/python_modules/xlets_settings/__init__.py",
        "../../__app__/data/python_modules/xlets_settings/SettingsWidgets.py",
        "../../__app__/data/python_modules/xlets_settings/TreeListWidgets.py",
        "../../__app__/data/javascript_modules/globalUtils.js"
    ],
    "extra_files": [{
        "source": "__app__/data/python_modules/xlets_settings",
        "destination": "python_modules/xlets_settings"
    }, {
        "source": "__app__/data/javascript_modules/globalUtils.js",
        "destination": "globalUtils.js"
    }, {
        "source": "__app__/data/javascript_modules/customTooltips.js",
        "destination": "customTooltips.js"
    }, {
        # NOTE: I'm not including the debugManagerSchema.xml file here because
        # this applet already uses an schema, so I added the keys used by the
        # debug manager into the existent schema.
        "source": "__app__/data/javascript_modules/debugManager.js",
        "destination": "debugManager.js"
    }]
}


if __name__ == "__main__":
    pass
