#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Common utilities to perform string manipulation operations.
"""
import fnmatch
import os
import re
import unicodedata

from . import file_utils


def split_on_uppercase(string, keep_contiguous=True):
    """Split string on uppercase.

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

    Note
    ----
    Based on: `Split a string at uppercase letters <https://stackoverflow.com/a/40382663>`__
    """

    string_length = len(string)
    is_lower_around = (lambda: string[i - 1].islower()  # noqa
                       or string_length > (i + 1) and string[i + 1].islower())

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
    logger.info("**Performing string substitutions...**")

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


def super_filter(names, inclusion_patterns=[], exclusion_patterns=[]):
    """Super filter.

    Enhanced version of fnmatch.filter() that accepts multiple inclusion and exclusion patterns.

    - If only ``inclusion_patterns`` is specified, only the names which match one or more \
    patterns are returned.
    - If only ``exclusion_patterns`` is specified, only the names which do not match any \
    pattern are returned.
    - If both are specified, the exclusion patterns take precedence.
    - If neither is specified, the input is returned as-is.

    Parameters
    ----------
    names : list
        A list of strings to filter.
    inclusion_patterns : list, optional
        A list of patterns to keep in names.
    exclusion_patterns : list, optional
        A list of patterns to exclude from names.

    Returns
    -------
    list
        A filtered list of strings.

    Note
    ----
    Based on: `Filtering with multiple inclusion and exclusion patterns \
    <https://codereview.stackexchange.com/a/74849>`__
    """
    included = multi_filter(names, inclusion_patterns) if inclusion_patterns else names
    excluded = multi_filter(names, exclusion_patterns) if exclusion_patterns else []
    return list(set(included) - set(excluded))


def multi_filter(names, patterns):
    """Multi filter.

    Generator function which yields the names that match one or more of the patterns.

    Parameters
    ----------
    names : list
        A list of strings to filter.
    patterns : list
        A list of patterns to match in names.

    Yields
    ------
    str
        A name in names parameter that matches any of the patterns in patterns parameter.
    """
    for name in names:
        if any(fnmatch.fnmatch(name, pattern) for pattern in patterns):
            yield name


def get_valid_filename(string, separator="_"):
    """Get valid file name.

    Return the given string converted to a string that can be used for a clean
    filename.

    - Removes leading and trailing spaces.
    - Converts any succesion of white spaces into a single underscore (configurable, \
    althogh it cannot be anything other than a dash, an underscore or a dot).
    - Removes anything that is not an alphanumeric, dash, underscore, or dot.

    Example
    -------

    >>> get_valid_filename("john's portrait in 2004.jpg")
    "johns_portrait_in_2004.jpg"

    Parameters
    ----------
    string : str
        The string to validate.
    separator : str, optional
        Which character to use to replace white spaces.

    Returns
    -------
    str
        A *safe to use* string for file names.

    Note
    ----
    Based on: Utilities found in `Django Web framework <https://github.com/django/django>`__
    """
    string = re.sub(r"\s+", separator, str(string).strip())
    return re.sub(r"(?u)[^-\w.]", "", string)


def slugify(string, allow_unicode=False):
    """Slugify.

    - Convert to ASCII if ``allow_unicode`` is False.
    - Convert spaces to hyphens.
    - Remove characters that aren't alphanumerics, underscores, or hyphens.
    - Convert to lowercase.
    - Strip leading and trailing whitespace.

    Example
    -------

    >>> slugify("john's portrait in 2004.jpg")
    "johns-portrait-in-2004jpg"

    Parameters
    ----------
    string : str
        The string to slugify.
    allow_unicode : bool, optional
        Whether or not to allow unicode characters in the slugified string.

    Returns
    -------
    str
        A slugified string.

    Note
    ----
    Based on: Utilities found in `Django Web framework <https://github.com/django/django>`__
    """
    string = str(string)

    if allow_unicode:
        string = unicodedata.normalize("NFKC", string)
    else:
        string = unicodedata.normalize("NFKD", string).encode("ascii", "ignore").decode("ascii")

    string = re.sub(r"[^\w\s-]", "", string).strip().lower()

    return re.sub(r"[-\s]+", "-", string)


if __name__ == "__main__":
    pass
