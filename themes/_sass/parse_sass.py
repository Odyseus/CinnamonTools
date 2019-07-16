#!/usr/bin/python3
# -*- coding: utf-8 -*-
import os

from subprocess import run

variants = {
    "GreybirdBlue": {
        "color": "#398ee7"
    },
    "MintGreen": {
        "color": "#accd8a"
    }
}
supported_cinnamon_versions = [
    "3.0",
    "3.4",
    "4.0",
    "4.2"
]

if __name__ == "__main__":
    files_to_remove = []
    cmd = ["sass", "--no-source-map"]
    template_file_path = os.path.abspath(os.path.join("cinnamon", "template.scss"))

    with open(template_file_path, "r", encoding="UTF-8") as template_file:
        template_data = template_file.read()

    for variant_name, variant_data in variants.items():
        for cinnamon_version in supported_cinnamon_versions:
            sass_file_path = os.path.abspath(os.path.join(
                "cinnamon", "%s-%s.scss" % (variant_name, cinnamon_version)))
            # NOTE: Replace the dot to be able to store an integer since I don't trust SASS comparissons.
            sass_file_data = template_data.replace(
                '"@cinnamon_version@"', cinnamon_version.replace(".", ""))
            sass_file_data = sass_file_data.replace("@variant@", variant_name)
            sass_file_data = sass_file_data.replace('"@selected_bg_color@"', variant_data["color"])

            with open(sass_file_path, "w", encoding="UTF-8") as sass_file:
                sass_file.write(sass_file_data)

            css_file_path = os.path.abspath(
                os.path.join("..", "_variants", variant_name, "_version_sensitive",
                             "cinnamon", cinnamon_version, "cinnamon.css"))

            os.makedirs(os.path.dirname(css_file_path), exist_ok=True)

            run(cmd + ["%s:%s" % (sass_file_path, css_file_path)])

            files_to_remove.append(sass_file_path)

    for file_path in files_to_remove:
        os.remove(file_path)
