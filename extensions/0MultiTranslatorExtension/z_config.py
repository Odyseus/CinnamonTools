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
        "source": "__app__/data/python_modules/html_tags_stripper.py",
        "destination": "python_modules/html_tags_stripper.py"
    }]
}


if __name__ == "__main__":
    pass
