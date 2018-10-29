#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Simple interactive CLI menu.

Attributes
----------
Ansi : object
    :any:`ANSIColors` class initialization.
menu_actions : dict
    Storage for menu actions.
schema : str
    The gsettings schema.
schema_filename : str
    The name of the gsettings schema file.
xlet_has_schema : bool
    Whether or not an xlet contains a directory named schemas.
"""
import os

from shutil import which
from subprocess import run

menu_actions = {}
schema = "org.cinnamon.{{XLET_TYPE}}s.{{UUID}}"
schema_path = "/org/cinnamon/{{XLET_TYPE}}s/{{UUID}}/"
schema_filename = "%s.gschema.xml" % schema
schema_storage = "/usr/share/glib-2.0/schemas/"
xlet_has_schema = "{{XLET_HAS_SCHEMA}}"


class ANSIColors():
    """Class to colorize terminal output.
    """

    def ERROR(self, string):
        """Red color that symbolizes error.

        Parameters
        ----------
        string : str
            The string that will be "colorized".

        Returns
        -------
        str
            String surrounded by ANSI codes.
        """
        return "\033[38;5;166;1m" + str(string) + "\033[0m"

    def INFO(self, string):
        """No color, just bold text.

        Parameters
        ----------
        string : str
            The string that will be "colorized".

        Returns
        -------
        str
            String surrounded by ANSI codes.
        """
        return "\033[1m" + str(string) + "\033[0m"

    def WARNING(self, string):
        """Yellow color that symbolizes warning.

        Parameters
        ----------
        string : str
            The string that will be "colorized".

        Returns
        -------
        str
            String surrounded by ANSI codes.
        """
        return "\033[38;5;220;1m" + str(string) + "\033[0m"

    def SUCCESS(self, string):
        """Green color that symbolizes success.

        Parameters
        ----------
        string : str
            The string that will be "colorized".

        Returns
        -------
        str
            String surrounded by ANSI codes.
        """
        return "\033[38;5;77;1m" + str(string) + "\033[0m"

    def PURPLE(self, string):
        """Purple color.

        Parameters
        ----------
        string : str
            The string that will be "colorized".

        Returns
        -------
        str
            String surrounded by ANSI codes.
        """
        return "\033[38;5;164;1m" + str(string) + "\033[0m"


Ansi = ANSIColors()


def exit():
    """Exit.

    Raises
    ------
    SystemExit
        Exit.
    """
    raise SystemExit()


def main_menu():
    """Main menu.
    """
    print(Ansi.INFO("{{UUID}}"))
    print()
    print(Ansi.INFO("Pick an option and press Enter:"))
    print()
    print(Ansi.INFO("1. Install translations"))
    print(Ansi.INFO("2. Uninstall translations"))

    if xlet_has_schema:
        print(Ansi.INFO("3. Install settings schema"))
        print(Ansi.INFO("4. Remove settings schema"))
        print(Ansi.INFO("5. Clean settings leftovers"))

    print(Ansi.INFO("%s. Restart Cinnamon" % ("6" if xlet_has_schema else "3")))
    print()
    print(Ansi.INFO("0. Quit (or Ctrl + C)"))

    try:
        option = input(Ansi.INFO(">> "))
        execute_option(str(option))
    except KeyboardInterrupt:
        print()
        print(Ansi.WARNING("Operation aborted."))
        exit()


def execute_option(option):
    """Execute option.

    Parameters
    ----------
    option : str
        The option to execute.
    """
    ch = option.lower()

    if ch == "":
        menu_actions["main_menu"]()
    else:
        try:
            menu_actions[ch]()
        except KeyError:
            print(Ansi.WARNING("Invalid selection, please try again."))
            print()
            menu_actions["main_menu"]()


def inform_cinnamon_restart():
    """Inform that Cinnamon needs to be restarted.
    """
    print(Ansi.WARNING("Remember to restart Cinnamon!!!"))


def inform_root_required():
    """Inform that the root password is required to continue.
    """
    print(Ansi.WARNING("Root password is required!"))


def handle_translations(arg):
    """Handle the command to install/uninstall xlets translations.

    Parameters
    ----------
    arg : str
        The argument to pass to the appropriate command.
    """
    if which("cinnamon-xlet-makepot"):
        run("cinnamon-xlet-makepot %s" % arg, shell=True)
    else:
        run("cinnamon-json-makepot %s" % arg, shell=True)

    inform_cinnamon_restart()
    main_menu()


def install_translations():
    """Install xlet translations.
    """
    handle_translations("-i")


def uninstall_translations():
    """Uninstall xlet translations.
    """
    handle_translations("-r")


def compile_schemas():
    """Compile gsettings schemas.
    """
    print(Ansi.INFO("Compiling schema files..."))
    run("sudo glib-compile-schemas %s" % schema_storage, shell=True)


def install_gsettings():
    """Install a gsetting schema.
    """
    inform_root_required()
    schema_file_path = "./schemas/%s" % schema_filename
    print(Ansi.INFO("Copying file: %s" % schema_file_path))
    print(Ansi.INFO("Destination: %s" % schema_storage))
    run("sudo cp %s %s" % (schema_file_path, schema_storage), shell=True)
    compile_schemas()


def uninstall_gsettings():
    """Uninstall a gsetting schema.
    """
    inform_root_required()
    schema_file_path = "%s%s" % (schema_storage, schema_filename)
    print(Ansi.INFO("Removing file: %s" % schema_file_path))
    run("sudo rm %s" % schema_file_path, shell=True)
    compile_schemas()


def clean_leftovers_gsettings():
    """Clean the user's dconf database of gsettings leftovers.
    """
    print(Ansi.INFO("Attempting to cleanup leftovers from the dconf database."))
    run("dconf reset -f %s" % schema_path, shell=True)


def restart_cinnamon():
    """Restart Cinnamon.
    """
    run("nohup cinnamon --replace > /dev/null 2>&1 &", shell=True)


if __name__ == "__main__":
    if not os.path.exists(os.path.join(os.path.abspath(os.getcwd()), "metadata.json")):
        print(Ansi.ERROR("This script should be executed from inside the xlet folder!!!"))
        raise SystemExit()

    print(Ansi.PURPLE("This script has to be executed from inside this xlet folder and after this \
xlet is installed."))
    print(Ansi.PURPLE("If you installed this xlet via Cinnamon Settings, translations \
where already installed automatically by Cinnamon. Otherwise, they need to be installed through this menu."))

    if xlet_has_schema:
        print(Ansi.PURPLE("If you installed this xlet via Cinnamon Settings, and depending on the \
Cinnamon version, the gsettings schema was already installed automatically by Cinnamon. Otherwise, \
they need to be installed through this menu."))
        print(Ansi.PURPLE("The dconf command is required to perform gsettings cleanup operations."))

    print()

    menu_actions["main_menu"] = main_menu
    menu_actions["1"] = install_translations
    menu_actions["2"] = uninstall_translations

    if xlet_has_schema:
        menu_actions["3"] = install_gsettings
        menu_actions["4"] = uninstall_gsettings
        menu_actions["5"] = clean_leftovers_gsettings

    menu_actions["6" if xlet_has_schema else "3"] = restart_cinnamon
    menu_actions["0"] = exit

    main_menu()
