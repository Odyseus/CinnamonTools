#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Utilities to generate data from templates.


Attributes
----------
BASH_COMPLETION_LOADER_CONTENT : str
    Bash completions loader script.
bash_completions_step1 : str
    Bash completions creation message. Step 1.
bash_completions_step2 : str
    Bash completions creation message. Step 2.
HOME : str
    Path to a user's home folder.
"""
import os
import sys

from . import exceptions, prompts, shell_utils
from .ansi_colors import Ansi


HOME = os.path.expanduser("~")

BASH_COMPLETION_LOADER_CONTENT = """
if [[ -d "$HOME/.bash_completion.d" ]]; then
    for bcfile in "$HOME/.bash_completion.d"/*; do
        . $bcfile
    done
fi
"""


bash_completions_step1 = """
Bash completions creation. Step 1.

The file {0}
will be created.
"""


bash_completions_step2 = """
Bash completions creation. Step 2.

The file {0}/.bash_completion will be created if it doesn't exists.

Or the pertinent code to load bash completions from the .bash_completion.d
directory will be appended to the existent file.

The {0}/.bash_completion file needs to be manually sourced in your shell's
configuration file (.bashrc, .zshrc, etc.).

The following is the content that will be appended to the
{0}/.bash_completion file.
"""


def system_executable_generation(exec_name,
                                 app_root_folder,
                                 sys_exec_template="",
                                 do_completions=True,
                                 logger=None):
    """Generate system executable and bash completions.

    Parameters
    ----------
    exec_name : str
        Default file name in case a custom one isn't chosen.
    app_root_folder : str
        The application's root folder.
    sys_exec_template : str, optional
        Path to a system executable template file.
    do_completions : bool, optional
        Whether to perform bash completions installation or not.
    logger : object
        See <class :any:`LogSystem`>.
    """
    d = {
        "name": "",
        "sys_exec_path": os.path.join(HOME, ".local", "bin")
    }

    print(Ansi.PURPLE("Set an executable file name or press Enter to use default"))
    prompts.do_prompt(d, "name", "Enter a file name", exec_name)

    print(Ansi.PURPLE("Set full path to store executable file or press Enter to use default"))
    prompts.do_prompt(d, "sys_exec_path", "Enter absolute path", d["sys_exec_path"])

    destination = os.path.join(d["sys_exec_path"], d["name"])

    if not os.path.exists(d["sys_exec_path"]):
        print(Ansi.WARNING("Path doesn't exists and needs to be created"))

        if prompts.confirm(prompt="Proceed?", response=False):
            os.makedirs(d["sys_exec_path"], exist_ok=True)
    elif not os.path.isdir(d["sys_exec_path"]):
        print(Ansi.WARNING("Chosen path isn't a directory. Aborted!!!"))
        sys.exit(0)

    generate_from_template(sys_exec_template, destination, options={
        "callback": system_executable_generation,
        "args": (exec_name, app_root_folder, sys_exec_template, do_completions, logger),
        "replacements": [
            ("{full_path_to_app_folder}", app_root_folder)
        ],
        "set_executable": True
    }, logger=logger)

    if not do_completions:
        sys.exit(0)

    bash_completions_file_source = os.path.join(
        app_root_folder, "__app__", "data", "templates", "bash_completions.bash")
    bash_completions_file_destination = os.path.join(
        HOME, ".bash_completion.d", d["name"] + ".completion.bash")
    bash_completions_loader = os.path.join(HOME, ".bash_completion")

    print(Ansi.PURPLE(bash_completions_step1.format(
        bash_completions_file_destination)))

    if prompts.confirm(prompt="Proceed?", response=False):
        generate_from_template(bash_completions_file_source, bash_completions_file_destination,
                               options={
                                   "replacements": [
                                       # Not implemented yet, but leave it.
                                       # Come back to it when I figure out how to make the bash
                                       # completions work as I want them to work. ¬¬
                                       ("{full_path_to_app_folder}",
                                        app_root_folder),
                                       ("{executable_name}", d["name"])
                                   ],
                                   "set_executable": False
                               }, logger=logger)

    print(Ansi.PURPLE(bash_completions_step2.format(HOME)))
    print(Ansi.INFO(shell_utils.get_cli_separator()))
    print(Ansi.INFO(BASH_COMPLETION_LOADER_CONTENT))
    print(Ansi.INFO(shell_utils.get_cli_separator()))

    if prompts.confirm(prompt="Proceed?", response=False):
        try:
            # KISS. If the exact string "/.bash_completion.d/" is found, assume that it is used to
            # load the content of this directory as bash completions.
            with open(bash_completions_loader, "a+", encoding="UTF-8") as file:
                file.seek(0)
                found = any("/.bash_completion.d/" in line for line in file)

                if found:
                    logger.info(
                        "The <%s/.bash_completion.d> directory seems to be set up." % HOME)
                    logger.info("Check the <%s> file content just in case." %
                                bash_completions_loader)
                    sys.exit(0)
                else:
                    file.write(BASH_COMPLETION_LOADER_CONTENT)
                    logger.info("Bash completion loader set up.")

            sys.exit(0)
        except Exception as err:
            logger.error(err)


def do_template_copy(source, destination, options={}, logger=None):
    """Do the actual copy of template files.

    Parameters
    ----------
    source : str
        Full file path source.
    destination : str
        Full file path destination.
    options : dict, optional
        A dictionary of options.
    logger : object
        See <class :any:`LogSystem`>.

    Raises
    ------
    err
        Halt execution if any error is found.
    """
    with open(source, "r", encoding="UTF-8") as template_file:
        template_data = template_file.read()

    try:
        if options.get("replacements", False):
            for old, new in options.get("replacements"):
                template_data = template_data.replace(old, new)
    except Exception as err:
        raise err

    with open(destination, "w", encoding="UTF-8") as destination_file:
        destination_file.write(template_data)

    if options.get("set_executable", False):
        os.chmod(destination, 0o777)


def generate_from_template(source, destination, options={}, logger=None):
    """Generate a file from a template.

    Parameters
    ----------
    source : str
        Full file path source.
    destination : str
        Full file path destination.
    options : dict, optional
        A set of options. Possible values are:

        - **replacements**: A list of tuples to be used by the :any:`str.replace` function \
        found in :any:`do_template_copy`.
        - **set_executable**: A bool used to determine if the file created by \
        :any:`do_template_copy` should be made executable.
        - **callback**: A reference to the function that called :any:`generate_from_template`.
        - **args**: The arguments passed to "callback".

    logger : object
        See <class :any:`LogSystem`>.

    Returns
    -------
    None
        Stops execution when calling a callback function.

    Raises
    ------
    Exception
        Something went wrong! ¬¬
    exceptions.KeyboardInterruption
        Halt execution on Ctrl + C press.
    exceptions.OperationAborted
        Halt execution.
    RuntimeError
        Raised if the destination isn't a folder.
    SystemExit
        Halt execution.
    """
    try:
        if os.path.exists(destination):
            logger.warning("The file <%s> exists!" % destination)

            if prompts.confirm(prompt="Overwrite existent file?", response=False):
                do_template_copy(source, destination, options, logger)
            else:
                # Call back the function that called this function. LOL
                if options.get("callback", False):
                    logger.info("Retrying...")
                    options.get("callback")(*options.get("args"))
                    return
                else:
                    print(Ansi.WARNING("Operation aborted."))
                    raise SystemExit()
        else:
            dirname = os.path.dirname(destination)

            if dirname:
                if os.path.exists(dirname) and (os.path.isfile(dirname) or os.path.islink(dirname)):
                    raise RuntimeError(
                        "Destination <%s> should be a directory!!!" % dirname) from None

                if not os.path.exists(dirname):
                    os.makedirs(dirname)

            do_template_copy(source, destination, options, logger)
    except KeyboardInterrupt:
        raise exceptions.KeyboardInterruption()
    except SystemExit:
        raise exceptions.OperationAborted("Operation aborted.")
    except Exception as err:
        logger.error("Something went wrong!")
        raise Exception(err)
    else:
        logger.info("File created at:")
        logger.info(destination)
