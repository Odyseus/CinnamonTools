#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Module with utility functions and classes.

Attributes
----------
root_folder : str
    The main folder containing the application. All commands must be executed from this location
    without exceptions.
validate_options_1 : method
    Function to validate numeric input.
validate_options_1_2 : method
    Function to validate numeric input.
"""
import json
import os

from shutil import rmtree

from .python_utils import cmd_utils
from .python_utils import file_utils
from .python_utils import misc_utils
from .python_utils import prompts
from .python_utils import string_utils
from .python_utils import yaml_utils
from .python_utils.simple_validators import generate_numeral_options_validator
from .python_utils.simple_validators import validate_output_path

from . import app_data
from . import app_utils

root_folder = os.path.realpath(os.path.abspath(os.path.join(
    os.path.normpath(os.path.join(os.path.dirname(__file__), *([os.pardir] * 2))))))
validate_options_1 = generate_numeral_options_validator(1)
validate_options_1_2 = generate_numeral_options_validator(2)
strings_subst_extensions = (".css", ".svg", ".xml", ".json", ".rc",
                            "gtkrc", ".theme", ".ini")


class ThemeHelperCore():
    """
    Attributes
    ----------
    logger : LogSystem
        The logger.
    sass_parser : str
        Path or name of the Dart Sass executable.
    theme_variants : list
        The theme variant names to work with.
    """

    def __init__(self, theme_variants=[], sass_parser=None, logger=None):
        """Initialization.

        Parameters
        ----------
        theme_variants : list, optional
            The theme variant names to work with.
        sass_parser : None, optional
            Path or name of the Dart Sass executable.
        logger : LogSystem
            The logger.
        """
        self.theme_variants = theme_variants if theme_variants else get_theme_variant_names()
        self.sass_parser = sass_parser
        self.logger = logger

    def parse_sass(self):
        """Parse |Sass|.

        Raises
        ------
        SystemExit
            Halt execution.
        """
        self.logger.info("**Parsing Sass files.**")

        cmd_str = cmd_utils.which(self.sass_parser) if self.sass_parser else cmd_utils.which("sass")

        if not cmd_str:
            self.logger.error("Invalid or not found Sass parser.")

            if self.sass_parser:
                self.logger.error(f"Parser passed: {cmd_str}")
            else:
                self.logger.error(f"Parser detected: {cmd_str}")

            self.logger.error("Read documentation for requirements.")

            raise SystemExit(1)

        self.logger.info(f"**Parser used: {cmd_str}**")

        cmd = [f"'{cmd_str}'", "--no-source-map", "--style", "expanded"]

        files_to_remove = []
        sass_path = os.path.join(app_data.PATHS["themes_folder"], "_sass")

        for variant_name in self.theme_variants:
            app_utils.print_separator(self.logger)
            self.logger.info(f"**Attempting to parse Sass files for variant: {variant_name}**")
            variant_config_path = os.path.join(
                app_data.PATHS["themes_variants_folder"], variant_name, "config.yaml"
            )

            if not os.path.exists(variant_config_path):
                self.logger.warning(f"{variant_name} is not a valid folder for a theme variant.")
                continue

            try:
                with open(variant_config_path, "r") as variant_config_file:
                    variant_config = yaml_utils.load(variant_config_file)
            except Exception as err:
                self.logger.warning(
                    "Error reading variant config file. Read documentation for usage.")
                self.logger.warning(err)
                continue

            for theme_data in app_data.THEME_SASS_PARSING_DATA:
                template_file_path = os.path.join(
                    sass_path, theme_data["sass_folder"], "template.scss")

                with open(template_file_path, "r", encoding="UTF-8") as template_file:
                    template_data = template_file.read()

                for theme_version in theme_data["versions"]:
                    self.logger.info("**Parsing files for %s version: %s**" %
                                     (theme_data["name"], theme_version))
                    sass_file_path = os.path.join(
                        sass_path, theme_data["sass_folder"], f"{variant_name}-{theme_version}.scss"
                    )
                    sass_file_data = string_utils.do_replacements(template_data, [
                        # NOTE: This sets the variables $gtk_version and $cinnamon_version in the Sass sources.
                        # Replace the dot to be able to store an integer since I don't trust Sass comparisons.
                        # In fact, I don't trust floats in any programming language in existence.
                        ("@version@", theme_version.replace(".", "")),
                        # NOTE: This is not implemented yet...and might never be. LOL
                        ("@variant@", variant_name),
                    ] + tokenize_variant_config(variant_config))

                    with open(sass_file_path, "w", encoding="UTF-8") as sass_file:
                        sass_file.write(sass_file_data)

                    css_file_path = os.path.abspath(os.path.join(
                        app_data.PATHS["themes_variants_folder"],
                        variant_name,
                        "_version_sensitive" if theme_data["version_sensitive"] else "_version_insensitive",
                        theme_data["destination_folder"],
                        theme_version if theme_data["version_sensitive"] else "",
                        theme_data["cssfile"]
                    ))

                    os.makedirs(os.path.dirname(css_file_path), exist_ok=True)

                    final_cmd = cmd + [
                        f"'{sass_file_path}':'{css_file_path}'"
                    ]

                    cmd_utils.run_cmd(" ".join(final_cmd), stdout=None, stderr=None,
                                      cwd=os.path.dirname(sass_file_path), shell=True)

                    files_to_remove.append(sass_file_path)

        self.logger.info("**Cleaning temporary files...**")

        for file_path in files_to_remove:
            try:
                os.remove(file_path)
            except Exception:
                continue

    def generate_gtk_sass_includes_index(self):
        """Generate Gtk includes index.
        """
        self.logger.info("**Generating Sass includes files.**")

        sass_folder = os.path.join(app_data.PATHS["themes_folder"], "_sass", "gtk")
        includes_folder = os.path.join(sass_folder, "includes")
        apps_folder = os.path.join(includes_folder, "apps")
        includes_index_file = os.path.join(includes_folder, "__index__.scss")

        apps_files = sorted([f"apps/{entry.name}" for entry in os.scandir(apps_folder)
                             if all((entry.is_file(follow_symlinks=False),
                                     entry.name.startswith("_"),
                                     entry.name.endswith(".scss"))
                                    )])
        root_files = [entry.name for entry in os.scandir(includes_folder)
                      if all((entry.is_file(follow_symlinks=False),
                              entry.name != "__index__.scss",
                              entry.name.startswith("_"),
                              entry.name.endswith(".scss"))
                             )]

        root_files_to_modify = []

        for f in root_files:
            if "-gtk4" in f:
                root_files_to_modify.append(f)

        for f in root_files_to_modify:
            root_files.remove(f)
            root_files.remove(f.replace("-gtk4", ""))
            root_files.append(f.replace("-gtk4", "#{$includes_suffix}"))

        includes = []

        for files_list in (sorted(root_files), apps_files):
            for include in files_list:
                if include.startswith("_"):
                    includes.append(f'@import "{include[1:-5]}";')
                else:
                    includes.append(f'@import "{include[:-5]}";')

        with open(includes_index_file, "w") as f:
            f.write("// NOTE: File auto-generated. Do not edit.\n" + "\n".join(includes))

    def generate_thumbnails(self):
        """Generate themes thumbnails.

        Raises
        ------
        SystemExit
            Halt execution if the required command isn't available.
        """
        self.logger.info("**Generating themes thumbnails.**")

        cmd_str = cmd_utils.which("magick") or cmd_utils.which("convert")

        if cmd_str:
            cmd = [f"'{cmd_str}'"]
        else:
            self.logger.error("Missing ImageMagick command. Read documentation for requirements.")
            raise SystemExit(1)

        for variant_name in self.theme_variants:
            app_utils.print_separator(self.logger)
            self.logger.info(f"**Attempting to generate thumbnails for variant: {variant_name}**")
            variant_config_path = os.path.join(
                app_data.PATHS["themes_variants_folder"], variant_name, "config.yaml"
            )

            if not os.path.exists(variant_config_path):
                self.logger.warning(f"{variant_name} is not a valid folder for a theme variant.")
                continue

            try:
                with open(variant_config_path, "r") as variant_config_file:
                    variant_config = yaml_utils.load(variant_config_file)
            except Exception as err:
                self.logger.warning(
                    "Error reading variant config file. Read documentation for usage.")
                self.logger.warning(err)
                continue

            variant_path = os.path.join(
                app_data.PATHS["themes_folder"], "_variants", variant_name, "_version_insensitive"
            )

            for theme_data in app_data.THEME_SASS_PARSING_DATA:
                self.logger.info(f'**Generating thumbnail for {theme_data["name"]} theme...**')

                thumb_path = os.path.join(
                    variant_path,
                    theme_data["destination_folder"],
                    "thumbnail.png")

                os.makedirs(os.path.dirname(thumb_path), exist_ok=True)

                final_cmd = cmd + [
                    "-size",
                    theme_data["thumb_size"],
                    f'canvas:"{variant_config["selected_bg_color"]}"',
                    f'PNG32:"{thumb_path}"'
                ]

                cmd_utils.run_cmd(" ".join(final_cmd), stdout=None, stderr=None,
                                  cwd=os.path.dirname(thumb_path), shell=True)


def tokenize_variant_config(variant_config):
    """Tokenize variant config.

    Parameters
    ----------
    variant_config : dict
        The variant config to tokenize.

    Returns
    -------
    list
        The tokenized variant config.
    """
    variant_tokens = []

    for key, value in variant_config.items():
        variant_tokens.append((f'@{key}@', str(value)))

    return variant_tokens


def get_gradient_dark_stop_color(hex):
    """Gradient stop color.

    Very cheap and lazy way of generating the second stop color from a base color for a gradient
    used in images from the Gtk 2 theme.

    Parameters
    ----------
    hex : str
        A color in hexadecimal notation.

    Returns
    -------
    str
        A color in hexadecimal notation.
    """
    from .python_utils.colour import Color

    color = Color(color=hex)
    color.set_luminance(color.get_luminance() / 1.36)

    return str(color)


def get_gradient_border_color(hex):
    """Get gadient border color.

    Parameters
    ----------
    hex : str
        A color in hexadecimal notation.

    Returns
    -------
    str
        A color in hexadecimal notation with 30% less saturation.
    """
    from .python_utils.colour import Color

    color = Color(color=hex)
    color.set_saturation(color.get_saturation() / 1.3)

    return str(color)


def hex_to_rgba(hex, alpha=None):
    """Hex to RGBA color convertion.

    Parameters
    ----------
    hex : str
        A color in hexadecimal notation.
    alpha : None, optional
        Color opacity.

    Returns
    -------
    str
        A color in RGBA notation.
    """
    hex_str = hex.lstrip("#")
    r = int(hex_str[0:2], 16)
    g = int(hex_str[2:4], 16)
    b = int(hex_str[4:6], 16)
    a = alpha if alpha is not None else alpha

    return f'rgba({r},{g},{b},{a})'


def get_theme_variant_names():
    """Get xlets dirs.

    Returns
    -------
    list
        The list of xlets directory names prefixed with their "types".
    """

    return sorted([entry.name for entry in os.scandir(os.path.join(root_folder, "themes", "_variants"))
                   if all((entry.is_dir(follow_symlinks=False),
                           os.path.isfile(os.path.join(
                               app_data.PATHS["themes_variants_folder"], entry.name, "config.yaml"
                           )),
                           not entry.name.startswith("z_"),
                           not entry.name.endswith("~"))
                          )])


def build_themes(theme_name="", theme_variants=[], build_output="", do_not_confirm=False,
                 logger=None, from_menu=False):
    """Build themes.

    Parameters
    ----------
    theme_name : str, optional
        The given name of the theme.
    theme_variants : list, optional
        The theme variant names to work with.
    build_output : str, optional
        Path to the destination folder were the built themes will be saved.
    do_not_confirm : bool, optional
        Whether to ask for overwrite confirmation when a theme destination exists or not.
    logger : LogSystem
        The logger.
    from_menu : bool, optional
        Whether this function was called from the CLI menu or not.

    Raises
    ------
    SystemExit
        Halt execution if the theme name cannot be obtained.
    """
    # NOTE: o_m_l_v a.k.a. options_map_latest_used_values
    try:
        with open(app_data.PATHS["theme_latest_build_data_file"], "r", encoding="UTF-8") as f:
            o_m_l_v = json.loads(f.read())
    except Exception:
        o_m_l_v = None

    if not theme_name:
        try:
            with open(app_data.PATHS["theme_name_storage_file"], "r", encoding="UTF-8") as theme_file:
                theme_name = theme_file.read().strip()
        except Exception:
            theme_name = "MyThemeName"

    opt_map = {
        "cinnamon_version": {
            "1": "5.0"
        },
        "gtk3_version": {
            "1": "3.24"
        },
        "gtk4_version": {
            "1": "4.0"
        },
        "do_not_confirm": {
            "1": False,
            "2": True
        }
    }

    opt_map_def = {
        "theme_name": theme_name,
        # Note: Check needed to avoid storing None.
        "build_output": build_output or "",
        "do_not_confirm": "2" if do_not_confirm else "1",
        "cinnamon_version": "1",
        "gtk3_version": "1",
        "gtk4_version": "1"
    }

    interactive = True

    if o_m_l_v is not None and opt_map_def != o_m_l_v:
        app_utils.print_separator(logger)
        app_utils.inform("Build data from a previous theme build found at:")
        logger.info(f'**{app_data.PATHS["theme_latest_build_data_file"]}**',
                    date=False, to_file=False)
        app_utils.inform("Details:")
        try:
            logger.info(app_data.THEME_BUILD_DATA.format(
                cinnamon_version=opt_map["cinnamon_version"][
                    o_m_l_v.get("cinnamon_version", opt_map_def["cinnamon_version"])
                ],
                gtk3_version=opt_map["gtk3_version"][
                    o_m_l_v.get("gtk3_version", opt_map_def["gtk3_version"])
                ],
                gtk4_version=opt_map["gtk4_version"][
                    o_m_l_v.get("gtk4_version", opt_map_def["gtk4_version"])
                ],
                theme_name=o_m_l_v.get("theme_name",
                                       opt_map_def["theme_name"]),
                build_output=opt_map_def["build_output"] if opt_map_def["build_output"] else
                o_m_l_v.get("build_output", opt_map_def["build_output"]),
                do_not_confirm=str(not opt_map["do_not_confirm"][
                    o_m_l_v.get("do_not_confirm", opt_map_def["do_not_confirm"])
                ])
            ), date=False, to_file=False)
            app_utils.print_separator(logger)
            app_utils.inform("Choose an option:")
            question = "%s\n%s\n%s" % ("**1.** Use data interactively.",
                                       "**2.** Use data and directly build themes.",
                                       "**Press any other key to not use stored data.**")

            answer = prompts.read_char(question)
        except KeyError:
            answer = None

        # Do not change defaults if one chooses not to use stored build data.
        if answer == "1" or answer == "2":
            # Check that the stored options contain all options needed for the building process.
            # If not, add them.
            for opt, val in opt_map_def.items():
                if opt not in o_m_l_v:
                    o_m_l_v[opt] = val

            # Check that the stored options doesn't contain options that aren't used anymore.
            # If they do, remove them.
            new_o_m_l_v = {}
            for opt, val in o_m_l_v.items():
                if opt in opt_map_def:
                    new_o_m_l_v[opt] = o_m_l_v[opt]

            opt_map_def = new_o_m_l_v
        else:
            pass

        interactive = answer != "2"

    if interactive:
        # Ask for Cinnamon theme version.
        app_utils.print_separator(logger)
        app_utils.inform(["Choose in which Cinnamon version the theme will be used.",
                          "1. 5.0.x plus"])

        prompts.do_prompt(opt_map_def,
                          "cinnamon_version",
                          "Enter an option",
                          opt_map_def["cinnamon_version"],
                          validator=validate_options_1)

        # Ask for Gtk3 theme version.
        app_utils.print_separator(logger)
        app_utils.inform(["Choose in which Gtk3 version the theme will be used.",
                          "1. 3.24.x and above"])

        prompts.do_prompt(opt_map_def,
                          "gtk3_version",
                          "Enter an option",
                          opt_map_def["gtk3_version"],
                          validator=validate_options_1)

        # Ask for Gtk4 theme version.
        app_utils.print_separator(logger)
        app_utils.inform(["Choose in which Gtk4 version the theme will be used.",
                          "1. 4.0.x and above"])

        prompts.do_prompt(opt_map_def,
                          "gtk4_version",
                          "Enter an option",
                          opt_map_def["gtk4_version"],
                          validator=validate_options_1)

        # Ask for build output.
        app_utils.print_separator(logger)
        app_utils.inform(["Where to store built themes?",
                          "Choose an option:"])
        question = "%s\n%s\n%s" % ("**1.** Temporary location.",
                                   "**2.** Install into user home.",
                                   "**Press any other key to specify a location.**")

        answer = prompts.read_char(question)
        ask_for_confirmation_options = answer != "1"

        if answer == "1":
            opt_map_def["build_output"] = os.path.join(
                app_utils.get_base_temp_folder(),
                misc_utils.micro_to_milli(misc_utils.get_date_time("filename"))
            )
        elif answer == "2":
            opt_map_def["build_output"] = os.path.join(
                "~", ".themes"
            )
        else:
            # Ask for output directory.
            app_utils.print_separator(logger)
            app_utils.inform("Choose a storage location:")
            # NOTE: Yes, if the previous build_output was the temporary location,
            # inform that it will be overwritten with a new temporary location.
            # This is to avoid dealing with existing xlets built into /tmp.
            if opt_map_def["build_output"].startswith(app_utils.get_base_temp_folder()):
                logger.info(
                    "The following default value, if chosen, it will be re-generated and overwritten.",
                    date=False, to_file=False)

            prompts.do_prompt(opt_map_def,
                              "build_output",
                              "Enter a path",
                              opt_map_def["build_output"],
                              validator=validate_output_path)

        # NOTE: Yes, check again (just in case) if build_output is inside /tmp.
        # So I can cancel asking for confirmation options since there is no
        # need to ask for confirmation options when the possibility of
        # overwriting an existing xlet is null.
        if opt_map_def["build_output"].startswith(app_utils.get_base_temp_folder()):
            ask_for_confirmation_options = False
            opt_map_def["do_not_confirm"] = "2"

        if ask_for_confirmation_options:
            # Ask for overwrite confirmation.
            app_utils.print_separator(logger)
            app_utils.inform(["Choose what to do when a built theme already exists at the destination.",
                              "1. Confirm each overwrite operation",
                              "2. Directly overwrite existent themes"])
            prompts.do_prompt(opt_map_def,
                              "do_not_confirm",
                              "Enter option",
                              opt_map_def["do_not_confirm"],
                              validator=validate_options_1_2)

    theme_data = {
        "cinnamon_version": opt_map["cinnamon_version"][opt_map_def["cinnamon_version"]],
        "gtk3_version": opt_map["gtk3_version"][opt_map_def["gtk3_version"]],
        "gtk4_version": opt_map["gtk4_version"][opt_map_def["gtk4_version"]]
    }

    if interactive:
        app_utils.print_separator(logger)
        app_utils.inform("Enter a name for the theme:")
        prompts.do_prompt(opt_map_def,
                          "theme_name",
                          "Enter name",
                          opt_map_def["theme_name"])

    if not opt_map_def["theme_name"].strip():
        logger.warning(app_data.MISSING_THEME_OR_DOMAIN_NAME_MSG.format(
            capital="Theme",
            lower="theme",
            types="themes"
        ), date=False, to_file=False)

        raise SystemExit(1)

    if opt_map_def["build_output"].startswith(app_utils.get_base_temp_folder()) or \
            not opt_map_def["build_output"]:
        opt_map_def["build_output"] = os.path.join(
            app_utils.get_base_temp_folder(),
            misc_utils.micro_to_milli(misc_utils.get_date_time("filename"))
        )

    themes_sources = os.path.join(root_folder, "themes")
    common_version_insensitive_files = os.path.join(
        themes_sources, "_common", "_version_insensitive")
    common_version_sensitive = os.path.join(themes_sources, "_common", "_version_sensitive")
    common_version_sensitive_cinnamon_files = os.path.join(
        common_version_sensitive, "cinnamon", theme_data["cinnamon_version"])
    common_version_sensitive_gtk3_files = os.path.join(
        common_version_sensitive, "gtk-3.0", theme_data["gtk3_version"])
    common_version_sensitive_gtk4_files = os.path.join(
        common_version_sensitive, "gtk-4.0", theme_data["gtk4_version"])
    theme_variants = theme_variants if theme_variants else get_theme_variant_names()

    do_not_confirm = opt_map["do_not_confirm"][opt_map_def["do_not_confirm"]]
    built_theme_variants = []

    for variant_name in theme_variants:
        app_utils.print_separator(logger)
        logger.info(f'**Generating variant:** {variant_name}')

        variant_config_path = os.path.join(
            app_data.PATHS["themes_variants_folder"], variant_name, "config.yaml"
        )

        if not os.path.exists(variant_config_path):
            logger.warning(f"{variant_name} is not a valid folder for a theme variant.")
            continue

        try:
            with open(variant_config_path, "r") as variant_config_file:
                variant_config = yaml_utils.load(variant_config_file)
        except Exception as err:
            logger.warning("Error reading variant config file. Read documentation for usage.")
            logger.warning(err)
            continue

        try:
            theme_config_file = os.path.join(app_data.PATHS["themes_folder"], "theme_config.yaml")
            with open(theme_config_file, "r") as themes_global_config_file:
                theme_config = yaml_utils.load(themes_global_config_file)
        except Exception as err:
            logger.warning("Error reading global theme config file. Read documentation for usage.")
            logger.warning(err)
            continue

        try:
            theme_config_file = os.path.join(root_folder, "tmp", "theme_config.yaml")

            if os.path.exists(theme_config_file):
                with open(theme_config_file, "r") as themes_user_config_file:
                    theme_config = misc_utils.merge_dict(
                        theme_config,
                        yaml_utils.load(themes_user_config_file),
                        logger=logger
                    )
        except Exception:
            pass

        full_theme_name = f'{opt_map_def["theme_name"].strip()}-{variant_name}'

        destination_folder = file_utils.expand_path(
            os.path.join(opt_map_def["build_output"], full_theme_name)
        )

        if file_utils.is_real_file(destination_folder):
            logger.warning("**InvalidDestination:** Destination exists and is a file!!! Aborted!!!",
                           date=False)
            continue

        if file_utils.is_real_dir(destination_folder):
            if not do_not_confirm:
                logger.warning(app_data.EXISTENT_XLET_DESTINATION_MSG.format(path=destination_folder),
                               date=False)

            if do_not_confirm or prompts.confirm(prompt="Proceed?", response=False):
                rmtree(destination_folder, ignore_errors=True)
            else:
                logger.warning("**OperationAborted:** The theme building process was canceled.",
                               date=False)
                continue

        # WARNING: Keep THEME_CSS_DEFINITIONS always first. It contains replacement data in itself.
        # And always make a copy of it.
        replacement_data = app_data.THEME_CSS_DEFINITIONS[:]
        replacement_data.extend(tokenize_variant_config(variant_config))
        replacement_data.extend(tokenize_variant_config(theme_config))
        replacement_data.append(("@repo_url@", app_data.URLS["repo"]))
        replacement_data.append(("@theme_name@", opt_map_def["theme_name"].strip()))
        replacement_data.append(("@theme_variant@", variant_name))
        replacement_data.append((
            # NOTE: No, this doesn't need "quoted quotes" because it's defined inside a call
            # to Sass' unquote() function.
            "@colorswatch_outline_opacity@",
            min(1, float(theme_config.get("outline_opacity") * 2))
        ))
        # WARNING: Yes, the quotes in the following tokens are intentional. DO NOT REMOVE!!!
        replacement_data.append((
            '"@display_gtk_2_scrollbar_arrows@"',
            app_data.THEME_BOOLEAN_DEFINITIONS["display_gtk_2_scrollbar_arrows"][
                bool(theme_config.get("display_scrollbar_arrows"))
            ]
        ))
        replacement_data.append((
            '"@display_gtk_3_scrollbar_arrows@"',
            app_data.THEME_BOOLEAN_DEFINITIONS["display_gtk_3_scrollbar_arrows"][
                bool(theme_config.get("display_scrollbar_arrows"))
            ]
        ))
        replacement_data.append((
            '"@tooltip_border_rgba_color@"',
            hex_to_rgba(
                variant_config.get("tooltip_fg_color"),
                theme_config.get("tooltip_border_opacity")
            )
        ))
        replacement_data.append((
            '"@tooltip_background_rgba_color@"',
            hex_to_rgba(
                variant_config.get("tooltip_bg_color"),
                theme_config.get("tooltip_background_opacity")
            )
        ))
        replacement_data.append((
            '"@tooltip_background_gtk2_opacity@"',
            int(theme_config.get("tooltip_background_opacity") * 255)
        ))
        # Gradient colors for the images at:
        # - gtk-2.0/images/treeview/iconview-selected.svg
        # - gtk-2.0/images/treeview/progress-bar.svg
        # - gtk-2.0/images/treeview/row-selected.svg
        replacement_data.append(("@gradient_dark_stop_color@",
                                 get_gradient_dark_stop_color(variant_config["selected_bg_color"])))
        replacement_data.append(("@gradient_border_color@",
                                 get_gradient_border_color(variant_config["selected_bg_color"])))

        # NOTE: Store the replacement data for debugging purposes.
        # I store it as YAML so it is easier to compare.
        replacement_data_file = os.path.join(
            root_folder, "tmp", "replacement_data", f"{variant_name}.yaml")
        os.makedirs(os.path.dirname(replacement_data_file), exist_ok=True)

        with open(replacement_data_file, "w", encoding="UTF-8") as outfile:
            yaml_utils.dump(replacement_data, outfile)

        variant_folder = os.path.join(app_data.PATHS["themes_variants_folder"], variant_name)
        variant_version_insensitive_files = os.path.join(variant_folder, "_version_insensitive")
        variant_version_sensitive = os.path.join(variant_folder, "_version_sensitive")
        variant_version_sensitive_cinnamon_files = os.path.join(
            variant_version_sensitive, "cinnamon", theme_data["cinnamon_version"])
        variant_version_sensitive_gtk3_files = os.path.join(
            variant_version_sensitive, "gtk-3.0", theme_data["gtk3_version"])
        variant_version_sensitive_gtk4_files = os.path.join(
            variant_version_sensitive, "gtk-4.0", theme_data["gtk4_version"])

        logger.info("**Copying files...**")

        file_utils.custom_copytree2(common_version_insensitive_files, destination_folder)

        if os.path.exists(common_version_sensitive_cinnamon_files):
            file_utils.custom_copytree2(common_version_sensitive_cinnamon_files,
                                        os.path.join(destination_folder, "cinnamon"))

        if os.path.exists(common_version_sensitive_gtk3_files):
            file_utils.custom_copytree2(common_version_sensitive_gtk3_files,
                                        os.path.join(destination_folder, "gtk-3.0"))

        if os.path.exists(common_version_sensitive_gtk4_files):
            file_utils.custom_copytree2(common_version_sensitive_gtk4_files,
                                        os.path.join(destination_folder, "gtk-4.0"))

        file_utils.custom_copytree2(variant_version_insensitive_files, destination_folder)

        if os.path.exists(variant_version_sensitive_gtk3_files):
            file_utils.custom_copytree2(variant_version_sensitive_gtk3_files,
                                        os.path.join(destination_folder, "gtk-3.0"))

        if os.path.exists(variant_version_sensitive_gtk4_files):
            file_utils.custom_copytree2(variant_version_sensitive_gtk4_files,
                                        os.path.join(destination_folder, "gtk-4.0"))

        if os.path.exists(variant_version_sensitive_cinnamon_files):
            file_utils.custom_copytree2(variant_version_sensitive_cinnamon_files,
                                        os.path.join(destination_folder, "cinnamon"))

        logger.info("**Performing string substitutions...**")
        for root, dirs, files in os.walk(destination_folder, topdown=False):
            for fname in files:
                # Only deal with a limited set of file extensions.
                if not fname.endswith(strings_subst_extensions):
                    continue

                file_path = os.path.join(root, fname)

                with open(file_path, "r+", encoding="UTF-8") as file:
                    file_data = file.read()
                    file.seek(0)
                    file_data_modified = string_utils.do_replacements(
                        file_data, replacement_data)

                    if file_data_modified != file_data:
                        file.write(file_data_modified)
                        file.truncate()

        built_theme_variants.append(variant_name)
        logger.success(f'**Theme variant {variant_name} successfully built.**')

    if len(theme_variants) != len(built_theme_variants):
        app_utils.print_separator(logger)
        logger.warning(
            "The build process of some themes was canceled or there was an error while building them.")
        logger.warning("Check the logs for more details.")

    print("")
    logger.info(f'**Built themes saved at {opt_map_def["build_output"]}**')

    with open(app_data.PATHS["theme_latest_build_data_file"], "w", encoding="UTF-8") as outfile:
        json.dump(opt_map_def, outfile, indent=4, ensure_ascii=False)


def print_theme_variants():
    """Print theme variants.

    This method is called by the Bash completions script to auto-complete
    theme variant names for the ``--variant-name=`` and ``-v`` CLI options.
    """
    for variant_dir_name in get_theme_variant_names():
        print(variant_dir_name)


def generate_themes_changelog(logger):
    """Generate themes changelog.

    Parameters
    ----------
    logger : LogSystem
        The logger.
    """
    log_path = os.path.join(root_folder, "themes", "CHANGELOG.md")

    try:
        with open(log_path, "w") as f:
            f.write(app_data.CHANGELOG_HEADER_THEMES)

        cmd = app_data.GIT_LOG_CMD_THEMES.format(
            relative_path="./themes",
            append_or_override=">>",
            log_path=log_path,
            repo_url=app_data.URLS["repo"]
        )
        cmd_utils.run_cmd(cmd, stdout=None, stderr=None, cwd=root_folder, shell=True)
        logger.info(f"**Changelog generated at:**\n{log_path}")
    except Exception as err:
        logger.error(err)


if __name__ == "__main__":
    pass
