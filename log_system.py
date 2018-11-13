#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""A very simple logging system.
"""
import logging
import os

from .ansi_colors import Ansi
from .misc_utils import get_date_time
from .misc_utils import micro_to_milli


class LogSystem():
    """LogSystem class.

    Attributes
    ----------
    verbose : bool
        Display message in terminal.
    """

    def __init__(self, filename="log.log", verbose=False):
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
        self._log_file = filename
        self._user_home = os.path.expanduser("~")
        logging.basicConfig(filename=filename, level=logging.DEBUG)

    def get_log_file(self):
        """Get log file path.

        Returns
        -------
        str
            The path to the log file.
        """
        return self._log_file

    def log_dry_run(self, msg):
        """Log message with "INFO" level prefixed with "[DRY_RUN]" and no date.

        Parameters
        ----------
        msg : str
            See :any:`LogSystem._update_log` > msg
        """
        self.info("[DRY_RUN] %s" % str(msg), date=False)

    def debug(self, msg, term=True, date=True):
        """Log message with "DEBUG" level.

        Parameters
        ----------
        msg : str
            See :any:`LogSystem._update_log` > msg
        term : bool, optional
            See :any:`LogSystem._update_log` > term
        date : bool, optional
            See :any:`LogSystem._update_log` > date
        """
        self._update_log(msg, type="DEBUG", term=term, date=date)

    def info(self, msg, term=True, date=True):
        """Log message with "INFO" level.

        Parameters
        ----------
        msg : str
            See :any:`LogSystem._update_log` > msg
        term : bool, optional
            See :any:`LogSystem._update_log` > term
        date : bool, optional
            See :any:`LogSystem._update_log` > date
        """
        self._update_log(msg, type="INFO", term=term, date=date)

    def success(self, msg, term=True, date=True):
        """Log message with "INFO" level but with green color on screen.

        Parameters
        ----------
        msg : str
            See :any:`LogSystem._update_log` > msg
        term : bool, optional
            See :any:`LogSystem._update_log` > term
        date : bool, optional
            See :any:`LogSystem._update_log` > date
        """
        self._update_log(msg, type="SUCCESS", term=term, date=date)

    def warning(self, msg, term=True, date=True):
        """Log message with "WARNING" level.

        Parameters
        ----------
        msg : str
            See :any:`LogSystem._update_log` > msg
        term : bool, optional
            See :any:`LogSystem._update_log` > term
        date : bool, optional
            See :any:`LogSystem._update_log` > date
        """
        self._update_log(msg, type="WARNING", term=term, date=date)

    def error(self, msg, term=True, date=True):
        """Log message with "ERROR" level.

        Parameters
        ----------
        msg : str
            See :any:`LogSystem._update_log` > msg
        term : bool, optional
            See :any:`LogSystem._update_log` > term
        date : bool, optional
            See :any:`LogSystem._update_log` > date
        """
        self._update_log(msg, term=term, date=date)

    def _get_now(self):
        """Get current time.

        Returns
        -------
        str
            Date formatted with milliseconds instead of microseconds.
        """
        return micro_to_milli(get_date_time())

    def _update_log(self, msg, type="ERROR", term=True, date=True):
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
        m = "%s%s" % (self._get_now() + ": " if date else "", str(msg))

        if type == "DEBUG":
            logging.debug(m)

            if self.verbose and term:
                print(self._obfuscate_user_home(m))
        elif type == "INFO" or type == "SUCCESS":
            logging.info(m)

            if self.verbose and term:
                print(getattr(Ansi, "SUCCESS" if type == "SUCCESS" else "INFO")
                      (self._obfuscate_user_home(m)))
        elif type == "WARNING":
            logging.warning(m)

            if self.verbose and term:
                print(Ansi.WARNING(self._obfuscate_user_home(m)))
        elif type == "ERROR":
            logging.error(m)

            if self.verbose and term:
                print(Ansi.ERROR(self._obfuscate_user_home(m)))

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


if __name__ == "__main__":
    pass
