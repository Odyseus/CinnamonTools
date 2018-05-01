#!/usr/bin/python3
# -*- coding: utf-8 -*-
import os
from subprocess import call

variant_names = ["GreybirdBlue", "MintGreen"]
supported_cinnamon_versions = ["3.0", "3.4"]

if __name__ == "__main__":
    cmd = ["sass", "--sourcemap=none", "--no-cache"]

    for variant in variant_names:
        # Parse Cinnamon themes
        for cinnamon_version in supported_cinnamon_versions:
            sass_file = os.path.abspath(os.path.join(
                "cinnamon", "%s-%s.scss" % (variant, cinnamon_version)))
            css_file = os.path.abspath(os.path.join("..", "_variants", variant, "_version_sensitive",
                                                    "cinnamon", cinnamon_version, "cinnamon.css"))

            call(cmd + ["%s:%s" % (sass_file, css_file)])
            # print(sass_file)
            # print(css_file)
            # if variant["name"] == "default":
            #     call(cmd + ["%s:.cinnamon.css" % os.path.abspath(sass_file.name)])
            # else:
            #     variant_path = os.path.join(
            #         all_variants_path, variant["name"], "cinnamon", "cinnamon.css")

            #     call(cmd + ["%s:%s" % (os.path.abspath(sass_file.name), variant_path)])
