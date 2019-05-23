#!/usr/bin/python3
# -*- coding: utf-8 -*-

settings = {
    "make_pot_additional_files": [
        "../../__app__/data/javascript_modules/globalUtils.js"
    ],
    "extra_files": [{
        "source": "__app__/data/javascript_modules/globalUtils.js",
        "destination": "globalUtils.js"
    }, {
        "source": "__app__/data/javascript_modules/customTooltips.js",
        "destination": "customTooltips.js"
    }, {
        "source": "__app__/data/javascript_modules/customFileUtils.js",
        "destination": "customFileUtils.js"
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
