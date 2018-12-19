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
"""
import os
import sys

from . import exceptions
from . import file_utils
from . import misc_utils
from . import prompts
from . import shell_utils
from .ansi_colors import Ansi


BASH_COMPLETION_LOADER_CONTENT = """
if [[ -d "$HOME/.bash_completion.d" ]]; then
    for bcfile in "$HOME/.bash_completion.d"/*; do
        . $bcfile
    done
fi
"""


bash_completions_step1 = """
**Bash completions creation. Step 1.**

The file {0}
will be created.
"""


bash_completions_step2 = """
**Bash completions creation. Step 2.**

The file **{0}/.bash_completion** will be created if it doesn't exists.

Or the pertinent code to load bash completions from the .bash_completion.d
directory will be appended to the existent file.

The **{0}/.bash_completion** file needs to be manually sourced in your shell's
configuration file (.bashrc, .zshrc, etc.).

The following is the content that will be appended to the
**{0}/.bash_completion** file.
"""


def system_executable_generation(exec_name="",
                                 exec_destination="",
                                 app_root_folder="",
                                 sys_exec_template_path="",
                                 bash_completions_template_path="",
                                 do_completions=True,
                                 logger=None,
                                 bash_comp_step_one=True,
                                 bash_comp_step_two=True,
                                 prompt_for_name=True,
                                 prompt_for_path=True,
                                 bash_comp_step_one_confirmed=False,
                                 confirm_overwrite=True):
    """Generate a system executable.

    Parameters
    ----------
    exec_name : str, optional
        Default file name in case a custom one isn't chosen.
    exec_destination : str, optional
        Default destination in case a custom one isn't chosen.
    app_root_folder : str, optional
        The application's root folder of which the generated executable should be aware of.
    sys_exec_template_path : str, optional
        Path to a file that will be used as a template for generating the system executable.
    bash_completions_template_path : str, optional
        Path to a file that will be used as a template for generating the system executable's
        Bash completions file.
    do_completions : bool, optional
        Perform the bash completions installation.
    logger : object, optional
        See <class :any:`LogSystem`>.
    bash_comp_step_one : bool, optional
        If True, continue with execution. If False, halt execution.
    bash_comp_step_two : bool, optional
        If True, continue with execution. If False, halt execution.
    prompt_for_name : bool, optional
        It True, ask for application name. If False, use default application name.
    prompt_for_path : bool, optional
        It True, ask for executable storage location. If False, use default storage location.
    bash_comp_step_one_confirmed : bool, optional
        Do not ask for confirmation on bash completion file creation, just create it.
    confirm_overwrite : bool, optional
        If True, ask to overwrite files. If False, proceed without confirmation.

    Returns
    -------
    None
        Halt execution.

    Raises
    ------
    SystemExit
        Halt execution.
    """
    if not file_utils.is_real_dir(app_root_folder):
        logger.error("**<app_root_folder> parameter should be a real directory.**")
        raise SystemExit()

    if not file_utils.is_real_file(sys_exec_template_path):
        logger.error("**<sys_exec_template_path> parameter should be a real file.**")
        raise SystemExit()

    if do_completions and not file_utils.is_real_file(bash_completions_template_path):
        logger.error("**<bash_completions_template_path> parameter should be a real file.**")
        raise SystemExit()

    user_home = os.path.expanduser("~")

    d = {
        "name": exec_name,
        "sys_exec_path": exec_destination or os.path.join(user_home, ".local", "bin")
    }

    if prompt_for_name:
        print(Ansi.LIGHT_MAGENTA("Set an executable file name or press Enter to use default"))
        prompts.do_prompt(d, "name", "Enter a file name", d["name"])

    if prompt_for_path:
        print(Ansi.LIGHT_MAGENTA("Set full path to store executable file or press Enter to use default"))
        prompts.do_prompt(d, "sys_exec_path", "Enter absolute path", d["sys_exec_path"])

    d["sys_exec_path"] = os.path.expanduser(d["sys_exec_path"])
    d["sys_exec_path"] = os.path.expandvars(d["sys_exec_path"])

    destination = os.path.join(d["sys_exec_path"], d["name"])

    if not os.path.exists(d["sys_exec_path"]):
        print(Ansi.LIGHT_YELLOW("Path doesn't exists and needs to be created"))

        if prompts.confirm(prompt="Proceed?", response=False):
            os.makedirs(d["sys_exec_path"], exist_ok=True)
    elif not file_utils.is_real_dir(d["sys_exec_path"]):
        print(Ansi.LIGHT_YELLOW("Chosen path isn't a directory. Aborted!!!"))
        raise SystemExit()

    logger.info("**Generating system executable...**")

    generate_from_template(sys_exec_template_path, destination, options={
        "replacements": [
            ("{full_path_to_app_folder}", app_root_folder)
        ],
        "set_executable": True
    }, logger=logger, confirm_overwrite=confirm_overwrite)

    if not do_completions:
        return

    bash_completions_file_destination = os.path.join(
        user_home, ".bash_completion.d", d["name"] + ".completion.bash")
    bash_completions_loader = os.path.join(user_home, ".bash_completion")

    if not bash_comp_step_one:
        return

    print(Ansi.LIGHT_MAGENTA(bash_completions_step1.format(bash_completions_file_destination)))

    if bash_comp_step_one_confirmed or prompts.confirm(prompt="Proceed?", response=False):
        logger.info("**Generating bash completions file...**")

        generate_from_template(bash_completions_template_path, bash_completions_file_destination,
                               options={
                                   "replacements": [
                                       ("{current_date}", misc_utils.get_date_time("function_name")),
                                       ("{full_path_to_app_folder}", app_root_folder),
                                       ("{executable_name}", d["name"])
                                   ],
                                   "set_executable": False
                               }, logger=logger, confirm_overwrite=confirm_overwrite)

    if not bash_comp_step_two:
        return

    print(Ansi.LIGHT_MAGENTA(bash_completions_step2.format(os.path.expanduser("~"))))
    print(Ansi.DEFAULT(shell_utils.get_cli_separator()))
    print(Ansi.DEFAULT(BASH_COMPLETION_LOADER_CONTENT))
    print(Ansi.DEFAULT(shell_utils.get_cli_separator()))

    if prompts.confirm(prompt="Proceed?", response=False):
        logger.info("**Attempting to set up Bash completions loader...**")

        try:
            # KISS. If the exact string "/.bash_completion.d/" is found, assume that it is used to
            # load the content of this directory as bash completions.
            with open(bash_completions_loader, "a+", encoding="UTF-8") as file:
                file.seek(0)
                found = any("/.bash_completion.d/" in line for line in file)

                if found:
                    logger.info("**The <%s/.bash_completion.d> directory seems to be set up.**" %
                                user_home)
                    logger.info("**Check the <%s> file content just in case.**" %
                                bash_completions_loader)
                    sys.exit(0)
                else:
                    file.write(BASH_COMPLETION_LOADER_CONTENT)
                    logger.info("**Bash completions loader set up.**")

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


def generate_from_template(source, destination, options={}, logger=None, confirm_overwrite=True):
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

    logger : object
        See <class :any:`LogSystem`>.
    confirm_overwrite : bool, optional
        If True, ask to overwrite files. If False, proceed without confirmation.

    Raises
    ------
    Exception
        Something went wrong! ¬¬
    exceptions.KeyboardInterruption
        Halt execution on Ctrl + C press.
    exceptions.OperationAborted
        Halt execution.
    SystemExit
        Halt execution.
    """
    try:
        if confirm_overwrite and os.path.exists(destination):
            logger.warning("**The following file already exists:**")
            logger.warning(destination)

            if prompts.confirm(prompt="Overwrite existent file?", response=False):
                do_template_copy(source, destination, options, logger)
            else:
                raise SystemExit()
        else:
            dirname = os.path.dirname(destination)

            if os.path.exists(dirname) and (os.path.isfile(dirname) or os.path.islink(dirname)):
                logger.error("**Destination <%s> should be a directory!!!**" % dirname)
                raise SystemExit()

            os.makedirs(dirname, exist_ok=True)

            do_template_copy(source, destination, options, logger)
    except KeyboardInterrupt:
        raise exceptions.KeyboardInterruption()
    except SystemExit:
        raise exceptions.OperationAborted("Operation aborted.")
    except Exception as err:
        logger.error("**Something went wrong!**")
        raise Exception(err)
    else:
        logger.info("**File created at:**")
        logger.info(destination)
