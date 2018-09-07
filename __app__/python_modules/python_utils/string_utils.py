#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Common utilities to perform string manipulation operations.
"""
import os

from . import file_utils


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
            # FIXME: Should I hard-code the file names that should be set as executable?
            # I don't see a problem setting all Python files as exec., since I only use
            # Python scripts, not Python modules.
            # Lets put a pin on it and revisit in the future.
            if fname.endswith((".py", ".bash")):
                if not file_utils.is_exec(file_path):
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


if __name__ == "__main__":
    pass
