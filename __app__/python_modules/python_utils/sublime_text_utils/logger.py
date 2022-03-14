#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Logger.
"""
import functools
import logging
import os
import sys

from glob import glob

try:
    import sublime
except Exception:
    pass

_valid_logging_levels = [
    "ERROR",
    "WARNING",
    "INFO",
    "DEBUG"
]


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
    all_files = sorted(glob(folder + "/" + file_pattern))

    if len(all_files) > max_files_to_keep:
        files_to_delete = all_files[:len(all_files) - max_files_to_keep]

        for f in files_to_delete:
            os.remove(f)


class SublimeLogger():
    """LogSystem class.
    """

    def __init__(self, logger_name=None, log_file=""):
        """Initialization.

        Parameters
        ----------
        logger_name : None, optional
            A name for the logger.
        log_file : str, optional
            Path to a log file.

        Raises
        ------
        RuntimeError
            Raise if the log file destination isn't a folder.
        """
        if log_file:
            dirname = os.path.dirname(log_file)

            if dirname:
                if os.path.exists(dirname) and (os.path.isfile(dirname) or os.path.islink(dirname)):
                    raise RuntimeError(
                        "Destination <%s> should be a directory!!!" % dirname) from None

                if not os.path.isdir(dirname) and not os.path.exists(dirname):
                    os.makedirs(dirname)

                remove_surplus_files(dirname, "LOG*")

        if not logger_name:
            logger_name = __name__

        self._log_file = log_file
        self._user_home = os.path.expanduser("~")

        self._logger = logging.getLogger(logger_name)
        self._logger.handlers = []

        if self._log_file:
            self._file_handler = logging.FileHandler(
                filename=self._log_file)
            self._file_handler.setFormatter(logging.Formatter(
                fmt="%(asctime)s:%(levelname)s: %(message)s"))
            self._logger.addHandler(self._file_handler)
        else:
            self._file_handler = None

        self._stream_handler = logging.StreamHandler()
        self._stream_handler.setFormatter(logging.Formatter(
            fmt="%(name)s:%(levelname)s: %(message)s"))
        self._logger.addHandler(self._stream_handler)

        self.set_logging_level()

    def set_logging_level(self, logging_level="ERROR"):
        """Set logger and handlers logging level.

        This is not called at initialization because it would be in vain. self.verbose is set by a Sublime
        setting, and settings aren't ready at import time. So, this function is called by the
        plugin_loaded function that it's called when a plugin is loaded...allegedly.

        Parameters
        ----------
        logging_level : str, optional
            One of the logging leves defined in ``_valid_logging_levels``.
        """
        if logging_level.upper() in _valid_logging_levels:
            level = getattr(logging, logging_level.upper())
        else:
            level = logging.ERROR

        self._logger.setLevel(level)
        self._stream_handler.setLevel(level)

        if self._file_handler:
            self._file_handler.setLevel(level)

    def get_log_file(self):
        """Get log file path.

        Returns
        -------
        str
            The path to the log file.
        """
        return self._log_file

    def debug(self, msg):
        """Log a debug message.

        Parameters
        ----------
        msg : str
            Message to log.
        """
        self._log(logging.DEBUG, msg)

    def info(self, msg):
        """Log a info message.

        Parameters
        ----------
        msg : str
            Message to log.
        """
        self._log(logging.INFO, msg)

    def error(self, msg, exc_info=False):
        """Log a error message.

        Parameters
        ----------
        msg : str
            Message to log.
        exc_info : bool, sys.exc_info, optional
            Exception info.
        """
        self._log(logging.ERROR, msg, exc_info=exc_info)

    def exception(self, msg):
        """Log a exception message.

        Parameters
        ----------
        msg : str
            Message to log.
        """
        self.error(msg, exc_info=sys.exc_info())

    def warning(self, msg):
        """Log a warning message.

        Parameters
        ----------
        msg : str
            Message to log.
        """
        self._log(logging.WARN, msg)

    def _log(self, level, msg, **kwargs):
        """Log a message.

        Parameters
        ----------
        level : int
            Logging level.
        msg : str
            Message to log.
        **kwargs
            Keyword arguments.
        """
        sublime.set_timeout(functools.partial(
            self._logger.log, level, msg, **kwargs
        ), 0)

    def _obfuscate_user_home(self, msg):
        """Obfuscate User's home path.

        Parameters
        ----------
        msg : str
            The string from which the path to the User's home will be replaced by the "~" character.

        Returns
        -------
        str
            The obfuscated string.
        """
        return msg.replace(self._user_home, "~")


if __name__ == "__main__":
    pass
