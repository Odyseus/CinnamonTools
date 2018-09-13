#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Miscellaneous utility functions/properties.
"""
from datetime import datetime


def get_system_tempdir():
    """Get system's temporary directory.

    Returns
    -------
    str
        Path to system's temporary directory.
    """
    import tempfile

    return tempfile.gettempdir()


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
    elif type == "function_name":
        return datetime.now().strftime("%Y_%m_%d_%H_%M_%S_%f")
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


if __name__ == "__main__":
    pass
