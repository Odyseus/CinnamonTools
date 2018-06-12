#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Module with utility functions and classes.

Attributes
----------
Ansi : object
    :any:`ANSIColors` class initialization.
base_temp_folder : str
    Path to a temporary folder.
BASH_COMPLETION_LOADER_CONTENT : str
    Bash completions loader script.
bash_completions_step1 : str
    Bash completions creation message. Step 1.
bash_completions_step2 : str
    Bash completions creation message. Step 2.
domain_storage_file : str
    Path to the file were the domain name for xlets is stored.
env : dict
    Copy of the system's environment to be passed to Popen.
existent_xlet_destination_msg : str
    Message to display when creating a new xlet and that xlet already exists.
extra_common_files : list
    List of files common to all xlets.
git_log_cmd : str
    The command to use when generating changelogs.
help_pages_index_template : str
    The template (in reStructuredText format) used to create the index of xlets help pages in this
    repository documentation.
HOME : str
    Path to the current user home folder.
missing_domain_msg : str
    Message to display when the domain name isn't specified at xlet build time.
missing_theme_name_msg : str
    Message to display when the theme name isn't specified at theme build time.
root_folder : str
    The main folder containing the application. All commands must be executed from this location
    without exceptions.
theme_name_storage_file : str
    Path to the file were the theme name for xlets is stored.
xlet_dir_ignored_patterns : list
    List of patterns to ignore while copying files on xlet build time.
"""

import json
import logging
import os
import sys

from datetime import datetime
from glob import glob
from shutil import copy2, get_terminal_size, copytree, ignore_patterns, rmtree, which
from subprocess import Popen, PIPE, call, STDOUT, run


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


class ExceptionWhitoutTraceBack(Exception):
    """Raise an exception without a traceback.

    Only used when the traceback isn't important and the message is clear, to
    the point, and highlighted in red.

    Attributes
    ----------
    args : tuple
        Arguments.

    Note
    ----
    Based on an answer from a `StackOverflow question <https://stackoverflow.com/a/41414413>`__.
    Stripped the line number report from the original class because is not needed for my usage case.
    """

    def __init__(self, msg):
        """Initialize.

        Parameters
        ----------
        msg : str
            Message that the exception should display.
        """
        # This is an evil spawn that I don't freaking understand!!!
        # It works as intended for now, so moving on.
        self.args = Ansi.ERROR("{0.__name__}: {1}".format(type(self), msg)),
        sys.exit(self)


class ExceptionWhitoutTraceBackWarning(Exception):
    """Raise an exception without a traceback nor an exit errror.

    Only used when the traceback isn't important and the message is clear, to
    the point, and highlighted in red.

    Attributes
    ----------
    args : tuple
        Arguments.
    """

    def __init__(self, msg):
        """Initialize.

        Parameters
        ----------
        msg : str
            Message that the exception should display.
        """
        # This is an evil spawn that I don't freaking understand!!!
        # It works as intended for now, so moving on.
        self.args = Ansi.WARNING("{0.__name__}: {1}".format(type(self), msg)),
        sys.exit(self)


class BadExecutionLocation(ExceptionWhitoutTraceBack):
    """BadExecutionLocation
    """

    def __init__(self, msg="All commands must be launched from the application's root directory!!!"):
        """Initialize.

        Parameters
        ----------
        msg : str, optional
            Message that the exception should display.
        """
        super(BadExecutionLocation, self).__init__(msg=msg)


class WrongPythonVersion(ExceptionWhitoutTraceBack):
    """WrongPythonVersion
    """

    def __init__(self, msg="Minimum Python version supported: 3.5"):
        """Initialize.

        Parameters
        ----------
        msg : str, optional
            Message that the exception should display.
        """
        super(WrongPythonVersion, self).__init__(msg=msg)


class MissingCommand(ExceptionWhitoutTraceBack):
    """MissingCommand
    """
    pass


class MissingDependencyModule(ExceptionWhitoutTraceBack):
    """MissingDependencyModule
    """
    pass


class ExistentLocation(ExceptionWhitoutTraceBack):
    """ExistentLocation
    """
    pass


class KeyboardInterruption(ExceptionWhitoutTraceBackWarning):
    """KeyboardInterruption
    """

    def __init__(self, msg="Operation aborted."):
        """Initialize.

        Parameters
        ----------
        msg : str, optional
            Message that the exception should display.
        """
        print("")
        super(KeyboardInterruption, self).__init__(msg=msg)


class MissingRequiredFile(ExceptionWhitoutTraceBackWarning):
    """MissingRequiredFile
    """
    pass


class InvalidDestination(ExceptionWhitoutTraceBackWarning):
    """InvalidDestination
    """
    pass


class OperationAborted(ExceptionWhitoutTraceBackWarning):
    """OperationAborted
    """
    pass


class Error(OSError):
    """Error
    """
    pass


class ValidationError(Exception):
    """Raised for validation errors.
    """
    pass


HOME = os.path.expanduser("~")

# Keeping this variables here so I don't have to use ugly indentation inside functions.
git_log_cmd = 'git log --grep=General --invert-grep --pretty=format:"\
- **Date:** %aD%n\
- **Commit:** [%h](https://github.com/Odyseus/CinnamonTools/commit/%h)%n\
- **Author:** %aN%n%n\`\`\`%n%s%n%b%n\`\`\`%n%n***%n" \
-- {relative_xlet_path} {append_or_override} "{tmp_log_path}"'


bash_completions_step1 = """Bash completions creation. Step 1.
The file {0}
will be created.
"""


bash_completions_step2 = """Bash completions creation. Step 2.
The file {0}/.bash_completion will be created if it doesn't exists.
Or the pertinent code to load bash completions from the .bash_completion.d
directory will be appended to the existent file.
"""


root_folder = os.path.realpath(os.path.abspath(os.path.join(
    os.path.normpath(os.path.join(os.path.dirname(__file__), *([".."] * 2))))))

env = os.environ.copy()

domain_storage_file = os.path.join(root_folder, "domain_name")

theme_name_storage_file = os.path.join(root_folder, "theme_name")

base_temp_folder = os.path.join("/tmp", "CinnamonToolsTemp")


missing_domain_msg = """DomainNameNotSet:
The command line option `--domain=<domain>` should be used to define a domain
name for use when building xlets.
Or a file named "domain_name" should be created at the root of the repository
whose only content should be the desired domain name.
The `--domain` command line option has precedence over the domain name found
inside the "domain_name" file.
"""

missing_theme_name_msg = """ThemeNameNotSet:
The command line option `--theme-name=<name>` should be used to define a theme
name for use when building themes.
Or a file named "theme_name" should be created at the root of the repository
whose only content should be the desired theme name.
The `--theme-name` command line option has precedence over the theme name found
inside the "theme_name" file.
"""

existent_xlet_destination_msg = """Destination folder exists!!!
{path}
Choosing to proceed will completely remove the existent folder.
"""

xlet_dir_ignored_patterns = [
    "__pycache__",
    "__data__",
    "*~",
    "*.bak",
    "*.pyc",
    "z_config.py",
    "z_create_localized_help.py",
]

extra_common_files = [{
    "source_path": root_folder,
    "file_name": "LICENSE.md",
}, {
    "source_path": os.path.join(root_folder, "__app__", "data", "python_scripts"),
    "file_name": "helper.py",
}]

help_pages_index_template = """
Help pages for all xlets in this repository
===========================================

Applets
-------

{applets}

Extensions
----------

{extensions}
"""


class LogSystem():
    """Manage the log system.

    A very simple log system.

    Attributes
    ----------
    verbose : bool
        Display message in terminal.
    """

    def __init__(self, filename="backup.log", verbose=False):
        """
        Parameters
        ----------
        filename : str, optional
            Log file name or path to a file.
        verbose : bool, optional
            Display message in terminal.

        Raises
        ------
        RuntimeError
            Raise if the log file destination isn't a folder.
        """
        dirname = os.path.dirname(filename)

        if dirname:
            if os.path.exists(dirname) and (os.path.isfile(dirname) or os.path.islink(dirname)):
                raise RuntimeError(
                    "Destination <%s> should be a directory!!!" % dirname) from None

            if not os.path.isdir(dirname) and not os.path.exists(dirname):
                os.makedirs(dirname)

        self.verbose = verbose
        logging.basicConfig(filename=filename, level=logging.DEBUG)

    def debug(self, msg, term=True, date=True):
        """Log message with "DEBUG" level.

        Parameters
        ----------
        msg : str
            See :any:`LogSystem.update_log` > msg
        term : bool, optional
            See :any:`LogSystem.update_log` > term
        date : bool, optional
            See :any:`LogSystem.update_log` > date
        """
        self.update_log(msg, type="DEBUG", term=term, date=date)

    def info(self, msg, term=True, date=True):
        """Log message with "INFO" level.

        Parameters
        ----------
        msg : str
            See :any:`LogSystem.update_log` > msg
        term : bool, optional
            See :any:`LogSystem.update_log` > term
        date : bool, optional
            See :any:`LogSystem.update_log` > date
        """
        self.update_log(msg, type="INFO", term=term, date=date)

    def success(self, msg, term=True, date=True):
        """Log message with "INFO" level but with green color on screen.

        Parameters
        ----------
        msg : str
            See :any:`LogSystem.update_log` > msg
        term : bool, optional
            See :any:`LogSystem.update_log` > term
        date : bool, optional
            See :any:`LogSystem.update_log` > date
        """
        self.update_log(msg, type="SUCCESS", term=term, date=date)

    def warning(self, msg, term=True, date=True):
        """Log message with "WARNING" level.

        Parameters
        ----------
        msg : str
            See :any:`LogSystem.update_log` > msg
        term : bool, optional
            See :any:`LogSystem.update_log` > term
        date : bool, optional
            See :any:`LogSystem.update_log` > date
        """
        self.update_log(msg, type="WARNING", term=term, date=date)

    def error(self, msg, term=True, date=True):
        """Log message with "ERROR" level.

        Parameters
        ----------
        msg : str
            See :any:`LogSystem.update_log` > msg
        term : bool, optional
            See :any:`LogSystem.update_log` > term
        date : bool, optional
            See :any:`LogSystem.update_log` > date
        """
        self.update_log(msg, term=term, date=date)

    def get_now(self):
        """Get current time.

        Returns
        -------
        str
            Date formatted with milliseconds instead of microseconds.
        """
        return micro_to_milli(get_date_time())

    def update_log(self, msg, type="ERROR", term=True, date=True):
        """Do the actual logging.

        Parameters
        ----------
        msg : str
            The message to log.
        type : str, optional
            The logging level (DEBUG, INFO, WARNING or ERROR).
        term : bool, optional
            Display message in terminal. If set to False, and even with versbose set to True,
            the message will not be printed in terminal.
        date : bool, optional
            Log the date. If set to False, the current date will not be attached to the logged
            message.
        """
        m = "%s%s" % (self.get_now() + ": " if date else "", str(msg))

        if type == "DEBUG":
            logging.debug(m)

            if self.verbose and term:
                print(m)
        elif type == "INFO" or type == "SUCCESS":
            logging.info(m)

            if self.verbose and term:
                print(getattr(Ansi, "SUCCESS" if type == "SUCCESS" else "INFO")(m))
        elif type == "WARNING":
            logging.warning(m)

            if self.verbose and term:
                print(Ansi.WARNING(m))
        elif type == "ERROR":
            logging.error(m)

            if self.verbose and term:
                print(Ansi.ERROR(m))


class XletsHelperCore():
    """Xlets core functions.

    Attributes
    ----------
    logger : object
        See <class :any:`LogSystem`>.
    xlets_meta : dict
        The metadata of all xlets in this repository.
    """

    def __init__(self, logger=None):
        """Initialize.

        Parameters
        ----------
        logger : object
            See <class :any:`LogSystem`>.
        """
        super(XletsHelperCore, self).__init__()
        self.logger = logger

        try:
            self.xlets_meta = AllXletsMetadata()
        except Exception:
            self.generate_meta_file()

    def generate_meta_file(self):
        """See :any:`generate_meta_file`
        """
        generate_meta_file()

    def create_changelogs(self):
        """Create change logs.

        Generate the CHANGELOG.md files for all xlets.
        """
        from . import changelog_sanitizer

        self.logger.info("Generating change logs...")

        logs_storage = os.path.join(root_folder, "tmp", "changelogs")

        os.makedirs(logs_storage, exist_ok=True)

        for xlet in self.xlets_meta.meta_list:
            self.logger.info("Generating change log for %s..." % xlet["name"])

            try:
                xlet_root_folder = get_parent_dir(xlet["meta-path"], 0)
                tmp_log_path = os.path.join(logs_storage, xlet["slug"] + ".md")

                # Generate change log from current repository paths.
                relative_xlet_path1 = "./" + xlet["type"] + "s/" + xlet["slug"]
                cmd1 = git_log_cmd.format(relative_xlet_path=relative_xlet_path1,
                                          append_or_override=">",
                                          tmp_log_path=tmp_log_path)
                exec_command(cmd=cmd1,
                             working_directory=root_folder,
                             logger=self.logger)
            finally:
                # Sanitize and clean up formatting of the change logs and
                # copy them to their final destinations.
                sanitizer = changelog_sanitizer.ChangelogSanitizer(
                    xlet_name=xlet["name"],
                    source_path=tmp_log_path,
                    target_path=os.path.join(xlet_root_folder, "__data__", "CHANGELOG.md")
                )

                sanitizer.sanitize()

    def update_pot_files(self):
        """Update POT files.

        Update all .pot files from all xlets.

        Raises
        ------
        SystemExit
            Halt execution if the make-cinnamon-xlet-pot-app command is not found.
        """
        self.logger.info("Starting POT files update...")

        for xlet in self.xlets_meta.meta_list:
            xlet_root_folder = get_parent_dir(xlet["meta-path"], 0)

            self.logger.info(
                "Updating localization template for %s..." % xlet["name"])

            try:
                if not which("make-cinnamon-xlet-pot-app"):
                    print(Ansi.ERROR("MissingCommand: make-cinnamon-xlet-pot-app command not found!!!"))
                    raise SystemExit()

                cmd = [
                    "make-cinnamon-xlet-pot-app",
                    "--custom-header",
                    "--scan-additional-file=../../__app__/python_modules/localized_help_creator.py",
                    "--ignored-pattern=__data__/*"
                ]
                call(cmd, cwd=xlet_root_folder)
            except Exception:
                continue

    def create_localized_help(self):
        """Create localized help.

        Execute the z_create_localized_help.py script for each xlet to generate their
        HELP.html files.
        """
        self.logger.info("Starting localized help creation...")

        applets_list = []
        extensions_list = []
        list_item_template = "- `%s <../_static/xlets_help_pages/%s.html>`__"

        for xlet in self.xlets_meta.meta_list:
            xlet_root_folder = get_parent_dir(xlet["meta-path"], 0)
            script_file_path = os.path.join(xlet_root_folder, "z_create_localized_help.py")

            if os.path.exists(script_file_path):
                self.logger.info("Creating localized help for %s..." % xlet["name"])
                call([script_file_path], cwd=xlet_root_folder)

                list_item = list_item_template % (
                    xlet["name"], xlet["slug"])

                if xlet["type"] == "applet":
                    applets_list.append(list_item)
                elif xlet["type"] == "extension":
                    extensions_list.append(list_item)

        self.logger.info("Generating xlets help pages index...")

        help_pages_index = os.path.join(root_folder, "__app__", "docs_sources",
                                        "includes", "cinnamontools-help-pages.rst")

        with open(help_pages_index, "w", encoding="UTF-8") as index_file:
            index_file.write(help_pages_index_template.format(
                applets="\n".join(sorted(applets_list)),
                extensions="\n".join(sorted(extensions_list))
            ))

    def generate_trans_stats(self):
        """Generate translations statistics.

        Generates files that contain the amount of untranslated strings an xlet has.

        Raises
        ------
        SystemExit
            Halt execution if the msgmerge command is not found.
        """
        self.logger.info("Generating translation statistics...")

        if not which("msgmerge"):
            print(Ansi.ERROR("MissingCommand: msgmerge command not found!!!"))
            raise SystemExit()

        markdown_content = ""
        po_tmp_storage = os.path.join(root_folder, "tmp", "po_files_updated")
        trans_stats_file = os.path.join(
            root_folder, "tmp", "po_files_untranslated_table.md")
        rmtree(po_tmp_storage, ignore_errors=True)
        os.makedirs(po_tmp_storage, exist_ok=True)

        for xlet in get_xlets_dirs():
            xlet_type, xlet_dir_name = xlet.split(" ")
            xlet_po_dir = os.path.join(
                root_folder, "%ss" % xlet_type.lower(), xlet_dir_name, "po")
            tmp_xlet_po_dir = os.path.join(
                po_tmp_storage, "%ss" % xlet_type.lower(), xlet_dir_name)
            os.makedirs(tmp_xlet_po_dir, exist_ok=True)

            if os.path.isdir(xlet_po_dir):
                xlet_po_list = recursive_glob(xlet_po_dir, "*.po")

                if xlet_po_list:
                    self.logger.info("%s %s" %
                                     (xlet_type, xlet_dir_name), date=False)
                    markdown_content += "\n### %s %s\n" % (
                        xlet_type, xlet_dir_name)
                    markdown_content += "\n"
                    markdown_content += "|LANGUAGE|UNTRANSLATED|\n"
                    markdown_content += "|--------|------------|\n"

                    for po_file_path in xlet_po_list:
                        po_base_name = os.path.basename(po_file_path)
                        tmp_po_file_path = os.path.join(tmp_xlet_po_dir, po_base_name)
                        tmp_pot_file_path = os.path.join(xlet_po_dir, "%s.pot" % xlet_dir_name)

                        self.logger.info("Copying %s to temporary location..." %
                                         po_base_name, date=False)
                        copy2(po_file_path, tmp_po_file_path)

                        self.logger.info("Updating temporary %s from localization template..." %
                                         po_base_name, date=False)
                        call([
                            "msgmerge",
                            "--no-fuzzy-matching",  # Do not use fuzzy matching.
                            "--previous",           # Keep previous msgids of translated messages.
                            "--backup=off",         # Never make backups.
                            "--update",             # Update .po file, do nothing if up to date.
                            tmp_po_file_path,       # The .po file to update.
                            tmp_pot_file_path       # The template file to update from.
                        ])

                        self.logger.info("Counting untranslated strings...", date=False)
                        trans_count_cmd = 'msggrep -v -T -e "." "%s" | grep -c ^msgstr'
                        trans_count_output = run(trans_count_cmd % tmp_po_file_path,
                                                 stderr=STDOUT,
                                                 stdout=PIPE,
                                                 shell=True).stdout
                        trans_count = str(trans_count_output.decode("UTF-8").strip())
                        markdown_content += "|%s|%s|\n" % (po_base_name, trans_count)

        if markdown_content:
            with open(trans_stats_file, "w", encoding="UTF-8") as trans_file:
                trans_file.write(markdown_content)

    def update_spanish_localizations(self):
        """Update Spanish localizations.

        Update all Spanish localizations from all xlets.

        Raises
        ------
        SystemExit
            Halt execution if the msgmerge command is not found.
        """
        self.logger.info("Updating Spanish localizations...")

        if not which("msgmerge"):
            print(Ansi.ERROR("MissingCommand: msgmerge command not found!!!"))
            raise SystemExit()

        for xlet in get_xlets_dirs():
            xlet_type, xlet_dir_name = xlet.split(" ")
            po_dir = os.path.join(root_folder, "%ss" %
                                  xlet_type.lower(), xlet_dir_name, "po")
            po_file = os.path.join(po_dir, "es.po")

            if os.path.isdir(po_dir) and os.path.exists(po_file):
                self.logger.info("Updating localization for %s" % xlet_dir_name)

                if call([
                    "msgmerge",
                    "--no-fuzzy-matching",      # Do not use fuzzy matching.
                    "--previous",               # Keep previous msgids of translated messages.
                    "--backup=off",             # Never make backups.
                    "--update",                 # Update .po file, do nothing if up to date.
                    "es.po",                    # The .po file to update.
                    "%s.pot" % xlet_dir_name    # The template file to update from.
                ], cwd=po_dir):
                    self.logger.warning("Something might have gone wrong!")


class AllXletsMetadata(object):
    """All xlets metadata.

    Attributes
    ----------
    meta_list : list
        A list of dictionaries containing all xlets metadata.
    """

    def __init__(self):
        """Initialization.
        """
        meta_path = os.path.join(root_folder, "tmp", "xlets_metadata.json")

        try:
            if not os.path.exists(meta_path):
                print(Ansi.WARNING("xlets_metadata.json file not found. It will be generated."))
                generate_meta_file()
        finally:
            with open(meta_path, "r", encoding="UTF-8") as xlets_metadata:
                self.meta_list = list(json.loads(xlets_metadata.read()))


def generate_meta_file():
    """Generate the file containing all the metadata of all xlets on this repository.
    This metadata file is used by several functions on the XletsHelperCore class.
    """
    print(Ansi.INFO("Generating xlets metadata file..."))
    xlet_meta_files = []
    xlet_meta = []

    for dirname, dirnames, filenames in os.walk(os.path.join(root_folder, "applets"), topdown=False):
        for filename in filenames:
            if filename == "metadata.json":
                xlet_meta_files.append(os.path.join(dirname, filename))

    for dirname, dirnames, filenames in os.walk(os.path.join(root_folder, "extensions"), topdown=False):
        for filename in filenames:
            if filename == "metadata.json":
                xlet_meta_files.append(os.path.join(dirname, filename))

    for i in range(0, len(xlet_meta_files)):
        with open(xlet_meta_files[i], "r", encoding="UTF-8") as xlet_meta_file:
            raw_meta = xlet_meta_file.read()
            json_meta = json.loads(raw_meta)
            # Store the path to the metadata.json file so I can use it to create
            # the different needed paths when needed.
            # This will allow me to avoid to constantly create a path with
            # os.path.join in my functions. I will just use the metadata.json path
            # and "traverse it".
            json_meta["meta-path"] = xlet_meta_files[i]
            json_meta["slug"] = os.path.basename(
                os.path.dirname(xlet_meta_files[i]))

            if "/applets/" in xlet_meta_files[i]:
                json_meta["type"] = "applet"
            elif "/extensions/" in xlet_meta_files[i]:
                json_meta["type"] = "extension"

            xlet_meta.append(json_meta)

    with open(os.path.join(root_folder, "tmp", "xlets_metadata.json"), "w", encoding="UTF-8") as outfile:
        json.dump(xlet_meta, outfile, indent=4, ensure_ascii=False)


def get_parent_dir(fpath, go_up=0):
    """Get parent directory.

    Parameters
    ----------
    fpath : str
        The full path to a file.
    go_up : int, optional
        How many directories to go up.

    Returns
    -------
    str
        The new path to a directory.
    """
    dir_path = os.path.dirname(fpath)

    if go_up >= 1:
        for x in range(0, int(go_up)):
            dir_path = os.path.dirname(dir_path)

    return dir_path


def is_exec(fpath):
    """Check if file is executable.

    Parameters
    ----------
    fpath : str
        The path to the file to check.

    Returns
    -------
    bool
        If file is executable.
    """
    return os.path.isfile(fpath) and os.access(fpath, os.X_OK)


def get_log_file(storage_dir="tmp/logs", prefix="", subfix="", delimiter="_"):
    """Get log file.

    Returns
    -------
    str
        The log file to be used by :any:`LogSystem`.

    Parameters
    ----------
    storage_dir : str, optional
        Path to the folder to store the log files.
    prefix : str, optional
        String at the beginning of the file name.
    subfix : str, optional
        String at the end of the file name.
    delimiter : str, optional
        Character to separate the different parts of the files name.
    """
    filename = "{prefix}{date}{subfix}.log".format(
        prefix=prefix + delimiter if prefix is not "" else "",
        date=micro_to_milli(get_date_time("filename")),
        subfix=delimiter + subfix if subfix is not "" else ""
    )
    return os.path.abspath(os.path.join(storage_dir, filename))


def get_date_time(type="date"):
    """Get date time.

    Returns
    -------
    str
        The current time formatted by the "type" passed.

    Parameters
    ----------
    type : str, optional
        The time "type" to return (Default: date).
    """
    if type == "appid":
        return datetime.now().strftime("%Y-%m-%d-%H-%M-%S-%f")
    elif type == "filename":
        return datetime.now().strftime("%Y-%m-%d_%H.%M.%S.%f")
    else:  # type == "date"
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")


def micro_to_milli(date):
    """Microseconds to milliseconds.

    Convert a date string from using microseconds to use milliseconds.

    Parameters
    ----------
    date : str
        The date string to convert.

    Returns
    -------
    str
        The date string converted.
    """
    return date[:-6] + str("{0:03d}".format(int(int(date[-6:]) / 1000)))


def get_time_diff(s, e):
    """Get time difference.

    Parameters
    ----------
    s : str
        Start date.
    e : str
        End date.

    Returns
    -------
    str
        The difference in hours, minutes, seconds, and milliseconds between two dates.
    """
    start = datetime.strptime(s, "%Y-%m-%d %H:%M:%S.%f")
    ends = datetime.strptime(e, "%Y-%m-%d %H:%M:%S.%f")

    diff = ends - start

    m, s = divmod(diff.seconds, 60)
    h, m = divmod(m, 60)
    ms = diff.microseconds / 1000

    return "%d hr/s, %d min/s, %d sec/s, %d msec/s" % (h, m, s, ms)


def confirm(prompt=None, response=False):
    """Prompts for yes or no response from the user.

    Parameters
    ----------
    prompt : None, optional
        The prompt text.
    response : bool, optional
        "response" should be set to the default value assumed by the caller when
        user simply types ENTER.

    Returns
    -------
    bool
        True for "yes" or False for "no".

    Examples
    --------

    >>> confirm(prompt='Create Directory?', response=True)
    Create Directory? [Y|n]:
    True
    >>> confirm(prompt='Create Directory?', response=False)
    Create Directory? [N|y]:
    False
    >>> confirm(prompt='Create Directory?', response=False)
    Create Directory? [N|y]: y
    True

    Note
    ----
        `Based on <http://code.activestate.com/recipes/541096-prompt-the-user-for-confirmation>`__.
        Eradicated Python 2 code from original function and added "transparent handling" of upper/
        lower case input responses.

    Raises
    ------
    KeyboardInterruption
        Halt execution on Ctrl + C press.
    """

    if prompt is None:
        prompt = "Confirm"

    if response:
        prompt = "%s [%s/%s]: " % (prompt, "Y", "n")
    else:
        prompt = "%s [%s/%s]: " % (prompt, "N", "y")

    try:
        while True:
            # Lower the input case just so I don't have to micro-manage the answer.
            ans = input(Ansi.INFO(prompt)).lower()

            if not ans:
                return response

            if ans not in ["y", "n"]:
                print(Ansi.INFO("Please enter y or n."))
                continue

            if ans == "y":
                return True

            if ans == "n":
                return False
    except KeyboardInterrupt:
        raise KeyboardInterruption()


def get_cli_header(name, char="#", length=80):
    """Get a "decorated header".

    Get a "decorated header" to display at the beginning of the CLI execution (or whenever it is
    needed).

    Parameters
    ----------
    name : str
        The application name or a "title" to display as a "header".
    char : str, optional
        The "decorator" character.
    length : int, optional
        The total length that each line should have.

    Returns
    -------
    str
        The actual "header".
    """
    term_length = get_terminal_size((80, 24))[0] or 80
    sep = get_cli_separator(char)
    sub_sep = "%s" % (int((term_length - (len(name) + 2)) / 2) * char)
    mid = "%s %s %s" % (sub_sep, name, sub_sep)

    while True:
        if len(mid) < term_length:
            mid += char
            continue

        if len(mid) >= term_length:
            break

    header = sep + "\n"
    header += mid[:term_length] + "\n"
    header += sep

    return header


def get_cli_separator(char):
    """Get a "decorated separator".

    Get a "decorated separator" to display whenever it is needed.

    Parameters
    ----------
    char : str, optional
        The "decorator" character.

    Returns
    -------
    str
        The actual "separator".
    """
    term_length = get_terminal_size((80, 24))[0] or 80
    return "%s" % (term_length * char)


def term_input(prompt):
    """Get input from terminal.

    Parameters
    ----------
    prompt : str
        Text to be prompted with.

    Returns
    -------
    str
        Entered string.

    Note
    ----
        Extracted from Sphinx itself.
    """
    print(prompt, end="")
    return input("")


def nonempty(x):
    """Check for non empty.

    Parameters
    ----------
    x : str
        String to check.

    Returns
    -------
    str
        The string passed.

    Raises
    ------
    ValidationError
        Raise if empty.

    Note
    ----
        Extracted from Sphinx itself.
    """
    if not x:
        raise ValidationError("Please enter some text.")

    return x


def term_decode(text):
    """Decode terminal input.

    Parameters
    ----------
    text : str
        Entered text.

    Returns
    -------
    str
        Decoded text.

    Note
    ----
        Extracted from Sphinx itself. Eradicated Python 2 specific code.
    """
    if isinstance(text, str):
        return text

    print(Ansi.WARNING("* Note: non-ASCII characters entered "
                       "and terminal encoding unknown -- assuming "
                       "UTF-8 or Latin-1."))

    try:
        text = text.decode("utf-8")
    except UnicodeDecodeError:
        text = text.decode("latin1")

    return text


def do_prompt(d, key, text, default=None, validator=nonempty):
    """Prompt function for interactively ask user for data.

    Parameters
    ----------
    d : dict
        A dictionary of options.
    key : str
        The "key" to change from "d".
    text : str
        The prompt text.
    default : None, optional
        Default option if none entered.
    validator : function, optional
        A function to validate the input if needed.

    Note
    ----
        Extracted from Sphinx itself. Eradicated Python 2 specific code.
        Keeping it with the same capabilities just in case that I find more uses for it.
        For example: ask user for multiple options in one go.

    Raises
    ------
    KeyboardInterruption
        Halt execution on Ctrl + C press.
    """
    try:
        while True:
            if default is not None:
                prompt = "> " + "%s [%s]: " % (text, default)
            else:
                prompt = "> " + text + ": "

            prompt = Ansi.INFO(prompt)
            x = term_input(prompt).strip()

            if default and not x:
                x = default

            x = term_decode(x)

            try:
                x = validator(x)
            except ValidationError as err:
                print(Ansi.ERROR("* " + str(err)))
                continue
            break
    except (KeyboardInterrupt, SystemExit):
        raise KeyboardInterruption()
    else:
        d[key] = x


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


BASH_COMPLETION_LOADER_CONTENT = """
if [[ -d "$HOME/.bash_completion.d" ]]; then
    for bcfile in "$HOME/.bash_completion.d"/*; do
        . $bcfile
    done
fi
"""


def system_executable_generation(exec_name, app_root_folder, do_completions=True, logger=None):
    """Generate system executable and bash completions.

    Parameters
    ----------
    exec_name : str
        Default file name in case a custom one isn't chosen.
    app_root_folder : str
        The application's root folder.
    do_completions : bool, optional
        Whether to perform bash completions installation or not.
    logger : object
        See <class :any:`LogSystem`>.
    """
    sys_exec_template = os.path.join(root_folder, "__app__", "data",
                                     "templates", "system_executable")
    sys_exec_path = os.path.join(HOME, ".local", "bin")

    d = {"name": ""}
    do_prompt(d, "name", "Enter a file name", exec_name)

    destination = os.path.join(sys_exec_path, d["name"])

    generate_from_template(sys_exec_template, destination, options={
        "callback": system_executable_generation,
        "args": (exec_name, app_root_folder, logger),
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

    if confirm(prompt="Proceed?", response=False):
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

    if confirm(prompt="Proceed?", response=False):
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

        - **replacements**: A list of tuples to be used by the :any:`str.replace` function found in \
        :any:`do_template_copy`.
        - **set_executable**: A bool used to determine is the file created by :any:`do_template_copy` \
        should be made executable.
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
    KeyboardInterruption
        Halt execution on Ctrl + C press.
    OperationAborted
        Halt execution.
    RuntimeError
        Raised if the destination isn't a folder.
    SystemExit
        Halt execution.
    """
    try:
        if os.path.exists(destination):
            logger.warning("The file <%s> exists!" % destination)

            if confirm(prompt="Overwrite existent file?", response=False):
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
        raise KeyboardInterruption()
    except SystemExit:
        raise OperationAborted("Operation aborted.")
    except Exception as err:
        logger.error("Something went wrong!")
        raise Exception(err)
    else:
        logger.info("File created at:")
        logger.info(destination)


def exec_command(cmd, working_directory, do_wait=True, do_log=True, logger=None):
    """exec_command

    Run commands using Popen.

    Parameters
    ----------
    cmd : str
        The command to run.
    working_directory : str
        Working directory used by the command.
    do_wait : bool, optional
        Call or not the Popen wait() method. (default: {True})
    do_log : bool, optional
        Log or not the command output. (default: {True})
    logger : object
        See <class :any:`LogSystem`>.
    """
    try:
        # Passing a list instead of a string is the recommended.
        # I would do so if it would freaking work!!!
        # Always one step forward and two steps back with Python!!!
        po = Popen(
            cmd,
            shell=True,
            stdout=PIPE,
            stdin=None,
            universal_newlines=True,
            env=env,
            cwd=working_directory
        )

        if do_wait:
            po.wait()

        if do_log:
            output, error_output = po.communicate()

            if po.returncode:
                logger.error(error_output)
            else:
                if output:
                    logger.debug(output)
    except OSError as err:
        logger.error("Execution failed!!!")
        logger.error(err)


def build_xlets(xlets=[], domain_name=None, build_output="",
                do_not_cofirm=False, logger=None, from_menu=False):
    """Build xlets.

    Parameters
    ----------
    xlets : list, optional
        The list of xlets to build.
    domain_name : None, optional
        The domain name to use to build the xlets.
    build_output : str, optional
        Path to the folder were the built xlets are stored.
    do_not_cofirm : bool, optional
        Whether to ask for overwrite confirmation when an xlet destination exists or not.
    logger : object
        See <class :any:`LogSystem`>.
    from_menu : bool, optional
        Whether this function was called from the CLI menu or not.

    Raises
    ------
    SystemExit
        Halt execution if the domain name cannot be obtained.
    """
    if not domain_name:
        try:
            with open(domain_storage_file, "r", encoding="UTF-8") as domain_file:
                domain_name = domain_file.read().strip()
        except Exception:
            print(Ansi.WARNING(missing_domain_msg))
            raise SystemExit()

    # TODO:
    # Implement a "domain name validator" function.
    if not domain_name:
        # Message from the raised exception isn't printed when this function
        # is executed from the CLI menu.
        # So, print the message explicitly.
        print(Ansi.WARNING(missing_domain_msg))
        raise SystemExit()

    if not build_output:
        base_output_path = os.path.join(base_temp_folder, micro_to_milli(get_date_time("filename")))
    else:
        base_output_path = build_output

    all_xlets = get_xlets_dirs()

    xlets_data = []

    if xlets:
        for x in xlets:
            if x in all_xlets:
                xlet_type, xlet_dir_name = x.split(" ")
                uuid = "%s@%s" % (xlet_dir_name, domain_name)
                xlets_data.append({
                    "uuid": uuid,
                    "type": xlet_type.lower(),
                    "slug": xlet_dir_name,
                    "source": os.path.join(root_folder, "%ss" % xlet_type.lower(), xlet_dir_name),
                    "destination": os.path.join(base_output_path, "%ss" % xlet_type.lower(), uuid),
                })
            else:
                logger.warning("%s doesn't exists." % x)

    if xlets_data:
        for data in xlets_data:
            builder = XletBuilder(data, do_not_cofirm, logger)
            builder.build()

    print("")
    logger.info("Built xlets saved in %s" % base_output_path)


class XletBuilder(object):
    """docstring for XletBuilder

    Attributes
    ----------
    config_file : str
        Path to the file z_config.py inside an xlet folder.
    do_not_cofirm : bool
        Whether to ask for overwrite confirmation when an xlet destination exists or not.
    logger : object
        See <class :any:`LogSystem`>.
    replacement_data : list
        Data used to perform string substitutions. It is a list of tuples with two items.
    schemas_dir : str
        Path to the folder schemas inside an xlet folder.
    xlet_data : dict
        The xlet data to handle.
    """

    def __init__(self, xlet_data, do_not_cofirm, logger):
        """Initialize.

        Parameters
        ----------
        xlet_data : dict
            The xlet data to handle.
        do_not_cofirm : bool
            Whether to ask for overwrite confirmation when an xlet destination exists or not.
        logger : object
            See <class :any:`LogSystem`>.
        """
        super(XletBuilder, self).__init__()
        self.xlet_data = xlet_data
        self.do_not_cofirm = do_not_cofirm
        self.logger = logger
        self.schemas_dir = os.path.join(xlet_data["destination"], "schemas")
        self.config_file = os.path.join(xlet_data["source"], "z_config.py")
        self.replacement_data = [
            ("{{UUID}}", xlet_data.get("uuid", "")),
            ("{{XLET_TYPE}}", xlet_data.get("type", "")),
        ]

    def build(self):
        """Build xlet.
        """
        self.logger.info(get_cli_separator("#"), date=False)
        self.logger.info("Building the %s %s" %
                         (self.xlet_data["type"], self.xlet_data["slug"]))

        self._do_copy()
        do_string_substitutions(self.xlet_data["destination"],
                                self.replacement_data,
                                logger=self.logger)
        self._compile_schemas()
        self._handle_config_file()

    def _do_copy(self):
        """Copy xlet files into its final destination.

        Raises
        ------
        InvalidDestination
            Invalid xlet destination.
        OperationAborted
            Halt build operation.
        """
        if os.path.isfile(self.xlet_data["destination"]):
            raise InvalidDestination(
                "Destination exists and is a file!!! Aborted!!!")

        if os.path.isdir(self.xlet_data["destination"]):
            if not self.do_not_cofirm:
                print(Ansi.WARNING(existent_xlet_destination_msg.format(
                    path=self.xlet_data["destination"])))

            if self.do_not_cofirm or confirm(prompt="Proceed?", response=False):
                rmtree(self.xlet_data["destination"], ignore_errors=True)
            else:
                raise OperationAborted("Building the %s %s was canceled." %
                                       (self.xlet_data["type"], self.xlet_data["slug"]))

        self.logger.info("Copying main xlet files...")
        copytree(self.xlet_data["source"], self.xlet_data["destination"], symlinks=False,
                 ignore=ignore_patterns(*xlet_dir_ignored_patterns),
                 ignore_dangling_symlinks=True)

        self.logger.info("Copying common xlet files...")
        for extra in extra_common_files:
            copy2(os.path.join(extra["source_path"], extra["file_name"]),
                  os.path.join(self.xlet_data["destination"], extra["file_name"]))

    def _compile_schemas(self):
        """Compile schemas file if any.
        """
        if os.path.isdir(self.schemas_dir):
            self.logger.info("Compiling gsettings schema...")
            call(["glib-compile-schemas", ".", "--targetdir=."], cwd=self.schemas_dir)

    def _handle_config_file(self):
        """Handle xlet configuration file if any.
        """
        if os.path.exists(self.config_file):
            from runpy import run_path
            extra_settings = run_path(self.config_file)["settings"]

            if extra_settings.get("symlinks", False):
                self.logger.info("Generating symbolic links...")

                os.chdir(self.xlet_data["destination"])

                for dir in extra_settings.get("symlinks"):
                    os.makedirs(os.path.join(self.xlet_data["destination"], dir), exist_ok=True)

                    for src, dst in extra_settings.get("symlinks")[dir]:
                        os.symlink(src, os.path.join(dir, dst))

                os.chdir(root_folder)


def get_xlets_dirs():
    """Get xlets dirs.

    Returns
    -------
    list
        The list of xlets directory names prefixed with their "types".
    """
    applets_dirs = ["Applet " +
                    item for item in os.listdir(os.path.join(root_folder, "applets"))]
    extensions_dirs = ["Extension " +
                       item for item in os.listdir(os.path.join(root_folder, "extensions"))]

    return applets_dirs + extensions_dirs


def validate_themes_options(x):
    """Validate themes options.

    Parameters
    ----------
    x : str
        The entered option to validate.

    Returns
    -------
    str
        The validated option.

    Raises
    ------
    ValidationError
        Halt execution if option is not valid.
    """
    if not x or x not in ["1", "2"]:
        raise ValidationError('Posible options are "1" or "2".')

    return x


def build_themes(theme_name="", build_output="", do_not_cofirm=False, logger=None, from_menu=False):
    """Build themes.

    Parameters
    ----------
    theme_name : str, optional
        The given name of the theme.
    build_output : str, optional
        Path to the destination folder were the built themes will be saved.
    do_not_cofirm : bool, optional
        Whether to ask for overwrite confirmation when a theme destination exists or not.
    logger : object
        See <class :any:`LogSystem`>.
    from_menu : bool, optional
        Whether this function was called from the CLI menu or not.

    Raises
    ------
    SystemExit
        Halt execution if the theme name cannot be obtained.
    """
    options_map = {
        "cinnamon_version": {
            "1": "3.0",
            "2": "3.4"
        },
        "gtk3_version": {
            "1": "3.18",
            "2": "3.22"
        }
    }

    options_map_defaults = {
        "cinnamon_version": "1",
        "gtk3_version": "1"
    }

    print(Ansi.PURPLE("Choose in which Cinnamon version the theme will be used.\n"
                      "1. 3.0.x to 3.2.x (Default)\n"
                      "2. 3.4.x to 3.8.x"))

    do_prompt(options_map_defaults, "cinnamon_version", "Enter an option", "1",
              validator=validate_themes_options)

    print(Ansi.PURPLE("Choose in which Gtk+ version the theme will be used.\n"
                      "1. 3.18.x (Default)\n"
                      "2. 3.22.x"))

    do_prompt(options_map_defaults, "gtk3_version", "Enter an option", "1",
              validator=validate_themes_options)

    theme_data = {
        "cinnamon_version": options_map["cinnamon_version"][options_map_defaults["cinnamon_version"]],
        "gtk3_version": options_map["gtk3_version"][options_map_defaults["gtk3_version"]]
    }

    if not theme_name:
        try:
            with open(theme_name_storage_file, "r", encoding="UTF-8") as theme_file:
                theme_name = theme_file.read().strip()
        except Exception:
            print(Ansi.WARNING(missing_theme_name_msg))
            raise SystemExit()

    if not theme_name:
        print(Ansi.WARNING(missing_theme_name_msg))
        raise SystemExit()

    if not build_output:
        base_output_path = os.path.join(base_temp_folder, micro_to_milli(get_date_time("filename")))
    else:
        base_output_path = build_output

    themes_sources = os.path.join(root_folder, "themes")
    common_version_insensitive_files = os.path.join(
        themes_sources, "_common", "_version_insensitive")
    common_version_sensitive = os.path.join(themes_sources, "_common", "_version_sensitive")
    common_version_sensitive_cinnamon_files = os.path.join(
        common_version_sensitive, "cinnamon", theme_data["cinnamon_version"])
    common_version_sensitive_gtk3_files = os.path.join(
        common_version_sensitive, "gtk-3.0", theme_data["gtk3_version"])
    theme_variants = os.listdir(os.path.join(themes_sources, "_variants"))

    from runpy import run_path

    for variant in theme_variants:
        logger.info("Generating variant: %s" % variant)

        full_theme_name = "%s-%s" % (theme_name, variant)

        destination_folder = os.path.join(base_output_path, full_theme_name)

        if os.path.isfile(destination_folder):
            print(Ansi.ERROR("InvalidDestination: Destination exists and is a file!!! Aborted!!!"))
            raise SystemExit()

        if os.path.isdir(destination_folder):
            if not do_not_cofirm:
                print(Ansi.WARNING(existent_xlet_destination_msg.format(path=destination_folder)))

            if do_not_cofirm or confirm(prompt="Proceed?", response=False):
                rmtree(destination_folder, ignore_errors=True)
            else:
                print(Ansi.ERROR("OperationAborted: The theme building process was canceled."))
                raise SystemExit()

        variant_folder = os.path.join(themes_sources, "_variants", variant)
        variant_config = run_path(os.path.join(variant_folder, "config.py"))["settings"]
        variant_config["replacement_data"].append(("@theme_name@", theme_name))
        variant_config["replacement_data"].append(("@theme_variant@", variant))
        variant_version_insensitive_files = os.path.join(variant_folder, "_version_insensitive")
        variant_version_sensitive = os.path.join(variant_folder, "_version_sensitive")
        variant_version_sensitive_cinnamon_files = os.path.join(
            variant_version_sensitive, "cinnamon", theme_data["cinnamon_version"])
        variant_version_sensitive_gtk3_files = os.path.join(
            variant_version_sensitive, "gtk-3.0", theme_data["gtk3_version"])

        logger.info("Copying files...")
        custom_copytree(common_version_insensitive_files, destination_folder)

        if os.path.exists(common_version_sensitive_cinnamon_files):
            custom_copytree(common_version_sensitive_cinnamon_files,
                            os.path.join(destination_folder, "cinnamon"))

        if os.path.exists(common_version_sensitive_gtk3_files):
            custom_copytree(common_version_sensitive_gtk3_files,
                            os.path.join(destination_folder, "gtk-3.0"))

        custom_copytree(variant_version_insensitive_files, destination_folder)

        if os.path.exists(variant_version_sensitive_gtk3_files):
            custom_copytree(variant_version_sensitive_gtk3_files,
                            os.path.join(destination_folder, "gtk-3.0"))

        if os.path.exists(variant_version_sensitive_cinnamon_files):
            custom_copytree(variant_version_sensitive_cinnamon_files,
                            os.path.join(destination_folder, "cinnamon"))

        logger.info("Performing string substitutions...")
        for root, dirs, files in os.walk(destination_folder, topdown=False):
            for fname in files:
                # Only deal with a limited set of file extensions.
                if not fname.endswith((".css", ".svg", ".xml", ".json", ".rc",
                                       "gtkrc", ".theme", ".ini")):
                    continue

                file_path = os.path.join(root, fname)

                with open(file_path, "r+", encoding="UTF-8") as file:
                    file_data = file.read()
                    file.seek(0)
                    file_data_modified = do_replacements(
                        file_data, variant_config["replacement_data"])

                    if file_data_modified != file_data:
                        file.write(file_data_modified)
                        file.truncate()

        logger.info("Theme variant %s succesfully built." % variant)

    print("")
    logger.info("Built themes saved in %s" % base_output_path)


def do_replacements(data, replacement_data):
    """Do replacements.

    Parameters
    ----------
    data : str
        Data to modify.
    replacement_data : list
        List of tuples containing (template, replacement) data.

    Returns
    -------
    str
        Modified data.
    """
    for template, replacement in replacement_data:
        if template in data:
            data = data.replace(template, replacement)

    return data


def do_string_substitutions(dir_path, replacement_data,
                            allowed_extensions=(".py", ".bash", ".js", ".json", ".xml"),
                            logger=None):
    """Do substitutions.

    Parameters
    ----------
    dir_path : str
        Path to a directory where to perform string substitutions on.
    replacement_data : list
        Data used to perform string substitutions.
    allowed_extensions : tuple, optional
        A tuple of file extensions that are allowed to be modified.
    logger : object
        See <class :any:`LogSystem`>.
    """
    logger.info("Performing string substitutions...")

    for root, dirs, files in os.walk(dir_path, topdown=False):
        for fname in files:
            # Only deal with a limited set of file extensions.
            if not fname.endswith(allowed_extensions):
                continue

            file_path = os.path.join(root, fname)

            if os.path.islink(file_path):
                continue

            with open(file_path, "r+", encoding="UTF-8") as file:
                file_data = file.read()
                file.seek(0)
                file_data = do_replacements(file_data, replacement_data)
                file.write(file_data)
                file.truncate()

            # Check and set execution permissions for Bash and Python scripts.
            if fname.endswith((".py", ".bash")):
                if not is_exec(file_path):
                    os.chmod(file_path, 0o755)

            fname_renamed = do_replacements(fname, replacement_data)

            if fname != fname_renamed:
                os.rename(file_path, os.path.join(os.path.dirname(file_path), fname_renamed))

        for dname in dirs:
            dir_path = os.path.join(root, dname)

            if os.path.islink(dir_path):
                continue

            dname_renamed = do_replacements(dname, replacement_data)

            if dname != dname_renamed:
                os.rename(dir_path, os.path.join(os.path.dirname(dir_path), dname_renamed))


def custom_copytree(src, dst):
    """Custom copytree.

    Parameters
    ----------
    src : str
        Source path to copy from.
    dst : str
        Destination path to copy to.
    """
    if not os.path.exists(dst):
        os.makedirs(dst)

    lst = os.listdir(src)
    for item in lst:
        s = os.path.join(src, item)
        d = os.path.join(dst, item)

        if os.path.isdir(s):
            custom_copytree(s, d)
        else:
            copy2(s, d)


def generate_docs(generate_api_docs=False):
    """Build this application documentation.

    It executes a bash script instead of directly running the sphinx-apidoc command
    so the colors of the terminal output are preserved. Infinitely easier to
    spot build errors this way.

    Parameters
    ----------
    generate_api_docs : bool
        If False, do not extract docstrings from Python modules.
    """
    if generate_api_docs:
        commmon_args = ["-M", "--separate", "--force", "-o"]
        # Ignore modules whose docstrings are a mess and/or are incomplete.
        ignored_modules = [
            os.path.join("__app__", "python_modules", "docopt.py"),
            os.path.join("__app__", "python_modules", "mistune.py"),
            os.path.join("__app__", "python_modules", "polib.py"),
        ]

        call(["sphinx-apidoc"] + commmon_args + [
            os.path.join("__app__", "docs_sources",
                         "modules", "python_modules"),
            os.path.join("__app__", "python_modules"),
        ] + ignored_modules,
            cwd=root_folder)

    try:
        call(["sphinx-build", ".", "-b", "coverage", "-d", "/tmp/CinnamonTools-doctrees", "./coverage"],
             cwd=os.path.join(root_folder, "__app__", "docs_sources"))
    finally:
        call(["sphinx-build", ".", "-b", "html", "-d", "/tmp/CinnamonTools-doctrees",
              os.path.join(root_folder, "docs")],
             cwd=os.path.join(root_folder, "__app__", "docs_sources"))


def recursive_glob(stem, file_pattern):
    """Recursively match files in a directory according to a pattern.

    Parameters
    ----------
    stem : str
        The directory in which to recourse.
    file_pattern : str
        The file name regex pattern to which to match.

    Returns
    -------
    matches_list : list
        A list of file names in the directory that match the file pattern.
    """
    return glob(stem + "/**/" + file_pattern, recursive=True)


def remove_surplus_files(folder, file_pattern, max_files_to_keep=20):
    """Remove surplus files from folder.

    Parameters
    ----------
    folder : str
        Path to a folder were to search for files.
    file_pattern : str
        The file name pattern to search for.
    max_files_to_keep : int, optional
        Maximum amount of files to keep inside the folder.
    """
    all_files = sorted(recursive_glob(folder, file_pattern))

    if len(all_files) > max_files_to_keep:
        files_to_delete = all_files[:len(all_files) - max_files_to_keep]

        for f in files_to_delete:
            os.remove(f)


def restart_cinnamon():
    """Restart Cinnamon.
    """
    call("nohup cinnamon --replace > /dev/null 2>&1 &", shell=True)


def split_on_uppercase(string, keep_contiguous=True):
    """Split string on uppercase.

    Based on `an answer <https://stackoverflow.com/a/40382663>`__ from a StackOverflow question.

    Parameters
    ----------
    string : str
        The string to split by its uppercase characters.
    keep_contiguous : bool
        Option to indicate we want to keep contiguous uppercase characters together.

    Returns
    -------
    list
        The parts of the passed string.
    """
    string_length = len(string)
    is_lower_around = (lambda: string[i - 1].islower() or
                       string_length > (i + 1) and string[i + 1].islower())

    start = 0
    parts = []

    for i in range(1, string_length):
        if string[i].isupper() and (not keep_contiguous or is_lower_around()):
            parts.append(string[start: i])
            start = i

    parts.append(string[start:])

    return parts


class BaseXletGenerator():
    """Base xlet generator.

    Attributes
    ----------
    base_xlet_path : str
        Path to the base application (the template).
    logger : object
        See <class :any:`LogSystem`>.
    new_xlet_destination : str
        The path to the new generated application.
    replacement_data : list
        List of tuples containing (template, replacement) data.
    xlet_data : dict
        Storage for xlet data that will be used to generate a base xlet.
    """

    def __init__(self, logger):
        """Initialize.

        Parameters
        ----------
        logger : object
            See <class :any:`LogSystem`>.
        """
        super(BaseXletGenerator, self).__init__()
        self.logger = logger
        self.xlet_data = {}

    def generate(self):
        """Generate.
        """
        self._do_setup()
        self._do_copy()
        do_string_substitutions(self.new_xlet_destination,
                                self.replacement_data, logger=self.logger)

    def _do_setup(self):
        """Do setup.

        Raises
        ------
        SystemExit
            Halt execution if the destination exists.
        """
        prompt_data = {
            "type": "1",
            "name": "My Custom Xlet",
            "description": "My custom xlet description.",
            "max_instances": "-1",
        }

        prompt_data_map = {
            "1": {
                "type": "applet",
                "manager": "appletManager",
                "files": [
                    "applet.js",
                    "metadata.json",
                    "settings-schema.json",
                    "z_create_localized_help.py"
                ]
            },
            "2": {
                "type": "extension",
                "manager": "extensionSystem",
                "files": [
                    "extension.js",
                    "metadata.json",
                    "z_create_localized_help.py"
                ]
            }
        }

        print(Ansi.PURPLE("\nEnter an xlet type:\n\n1. applet\n2. extension"))
        do_prompt(prompt_data, "type", "Choose an option", prompt_data["type"])
        self.xlet_data["type"] = prompt_data_map[prompt_data["type"]]["type"]

        print(Ansi.PURPLE("\nEnter a name for the xlet:"))
        do_prompt(prompt_data, "name", "Enter name", prompt_data["name"])
        self.xlet_data["name"] = prompt_data["name"]

        # Define these here so I can check for existent destination immediately after the
        # xlet name is defined and exit if it already exists.
        self.xlet_data["slug"] = "0" + "".join([part.title()
                                                for part in self.xlet_data["name"].split(" ")])

        self.base_xlet_path = os.path.join(root_folder, "__app__", "data", "templates", "BaseXlet")
        self.new_xlet_destination = os.path.join(root_folder,
                                                 "%ss" % self.xlet_data["type"],
                                                 self.xlet_data["slug"])

        if os.path.exists(self.new_xlet_destination):
            self.logger.warning("ExistentLocation: New xlet cannot be created.")
            raise SystemExit()

        print(Ansi.PURPLE("\nEnter a description for the xlet:"))
        do_prompt(prompt_data, "description", "Enter description", prompt_data["description"])
        self.xlet_data["description"] = prompt_data["description"]

        if self.xlet_data["type"] != "extension":
            print(Ansi.PURPLE("\nEnter max instances for the xlet:"))
            do_prompt(prompt_data, "max_instances",
                      "Enter description", prompt_data["max_instances"])
            self.xlet_data["max_instances"] = prompt_data["max_instances"]

        self.xlet_data["manager"] = prompt_data_map[prompt_data["type"]]["manager"]
        self.xlet_data["files"] = prompt_data_map[prompt_data["type"]]["files"]
        self.xlet_data["type_title_case"] = prompt_data["type"].title()

        self.replacement_data = [
            ("$$XLET_NAME$$", self.xlet_data["name"]),
            ("$$XLET_DESCRIPTION$$", self.xlet_data["description"]),
            ("$$XLET_MANAGER$$", self.xlet_data["manager"]),
            ("$$XLET_TYPE$$", self.xlet_data["type"]),
            ("$$XLET_TYPE_TITLE_CASE$$", self.xlet_data["type_title_case"]),
        ]

    def _do_copy(self):
        """Do copy.
        """
        os.makedirs(self.new_xlet_destination, exist_ok=True)

        self.logger.info("Copying files...")

        for file_name in self.xlet_data["files"]:
            copy2(os.path.join(self.base_xlet_path, file_name),
                  os.path.join(self.new_xlet_destination, file_name))


if __name__ == "__main__":
    pass
