#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Common utilities to perform file operations.
"""
import os

from glob import glob
from shutil import copy2
from shutil import copystat
from shutil import ignore_patterns
from shutil import rmtree
from stat import ST_MTIME

from . import exceptions


def expand_path(path):
    """Expand environment variables used in ``path``. See :any:`os.path.expandvars` and
    :any:`os.path.expanduser`.

    Parameters
    ----------
    path : str
        Path with environment variables or with a start "~" character that will
        be expanded.

    Returns
    -------
    str
        An absolute path with expanded environment variables.
    """
    return os.path.expandvars(os.path.expanduser(path))


def is_real_dir(dir_path):
    """Directory is a real directory.

    Parameters
    ----------
    dir_path : str
        Path to the directory to check.

    Returns
    -------
    bool
        If dir_path is a directory and not a symbolic link to a directory.
    """
    return os.path.isdir(dir_path) and not os.path.islink(dir_path)


def is_real_file(file_path):
    """File is a real file, not a symbolic link to a file.

    Parameters
    ----------
    file_path : str
        Path to the file to check.

    Returns
    -------
    bool
        If file_path is a file and not a symbolic link to a file.
    """
    return os.path.isfile(file_path) and not os.path.islink(file_path)


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


def custom_copytree2(source, destination):
    """Custom copytree.

    Parameters
    ----------
    source : str
        Source path to copy from.
    destination : str
        Destination path to copy to.

    Note
    ----
    I don't remember why I had to use this custom function instead of :any:`shutil.copytree`.
    When it comes back to me, I will document it (LOL).
    """
    if not os.path.exists(destination):
        os.makedirs(destination)

    lst = os.listdir(source)
    for item in lst:
        src = os.path.join(source, item)
        dst = os.path.join(destination, item)

        if os.path.isdir(src):
            custom_copytree2(src, dst)
        else:
            copy2(src, dst)


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


def newer(source, target):
    """Check if "source" is newer than "target".

    Parameters
    ----------
    source : str
        Source file path.
    target : str
        Target file path.

    Returns
    -------
    bool
        Return true if "source" exists and is more recently modified than "target", or if "source"
        exists and "target" doesn't.  Return false if both exist and "target" is the same age or
        younger than "source".


    Raises
    ------
    Exception
        Raise if "source" does not exist.
    """
    if not os.path.exists(source):
        raise Exception("File <%s> does not exist!!!" % os.path.abspath(source))

    if not os.path.exists(target):
        return True

    if os.path.islink(target):
        os.unlink(target)
        return True

    mtime1 = os.stat(source)[ST_MTIME]
    mtime2 = os.stat(target)[ST_MTIME]

    return mtime1 > mtime2


def custom_copy2(source, destination, logger=None, log_copied_file=False, relative_path="",
                 overwrite=False):
    """Custom copy function.

    This function is basically :any:`shutil.copy2`, but it uses the :any:`newer` function
    before performing the copy.

    Parameters
    ----------
    source : str
        Source file path.
    destination : str
        Target file path.
    logger : object
        See :any:`LogSystem`.
    log_copied_file : bool, optional
        If True, log the relative destination path of the copied file.
    relative_path : str, optional
        A relative path to exctract from the path that's going to be logged.
    overwrite : bool, optional
        Overwrite existent files without doing any checks.
    """
    try:
        if overwrite or newer(source, destination):
            destination_parent = os.path.dirname(destination)

            if not is_real_dir(destination_parent):
                os.makedirs(destination_parent)

            copy2(source, destination, follow_symlinks=False)

            if log_copied_file:
                path_to_log = os.path.relpath(destination, relative_path) \
                    if relative_path else destination
                logger.info("**File copied:** %s" % path_to_log, date=False)
    except Exception as err:
        logger.error(err)


def copy_create_symlink(source, destination, source_is_symlink=False, logger=None, follow_symlinks=False):
    """Copy symlinks avoiding at all cost throwing errors.

    This function is always triggered when "source" is a symlink. It will create the symlink only
    after the following three tasks has been performed:

        1. If "destination" is a symlink, use :any:`os.unlink` to eradicate it.
        2. If "destination" is a directory, eradicate it with :any:`shutil.rmtree`.
        3. If "destination" is a file, eradicate it with :any:`os.remove`.

    Parameters
    ----------
    source : str
        Source.
    destination : str
        Destination.
    source_is_symlink : bool, optional
        If the source path is a symbolic link.
    logger : object
        See :any:`LogSystem`.
    follow_symlinks : bool, optional
        Follow symlinks.

    Notes
    -----
    This function is mostly needed when performing an "incremental" backup, since in a "compressed"
    backup job, the "copy" is handled by tar, and in a "stacked" backup job the "destination" is
    always empty.
    """
    try:
        if os.path.islink(destination):
            os.unlink(destination)

        if os.path.isdir(destination):
            rmtree(destination)

        if os.path.isfile(destination):
            os.remove(destination)

        os.symlink(os.readlink(source) if source_is_symlink else source, destination)
        copystat(source, destination, follow_symlinks=follow_symlinks)
    except Exception as err:
        logger.error(err)


def custom_copytree(src, dst, symlinks=True, ignored_patterns=None, ignore_dangling_symlinks=True,
                    logger=None, log_copied_file=False, relative_path="", overwrite=False):
    """Recursively copy a directory tree.

    This function is basically the same as :any:`shutil.copytree`, but with the following
    differences:

    - It copies directories whether the destination directory exists or not.
    - It uses a custom function to copy symlinks (:any:`copy_create_symlink`), it not just uses \
    :any:`os.symlink` directly.
    - Switched the *ignore* parameter (originally a method) into *ignored_patterns* (now a list \
    of file patterns). Just for the kick of it, not really needed.

    Parameters
    ----------
    src : str
        Source directory.
    dst : str
        Destination directory.
    symlinks : bool, optional
        Handle symlinks.
    ignored_patterns : None, optional
         A list of file name patterns to be ignored by the copy functions.
    ignore_dangling_symlinks : bool, optional
        Whether to ignore dangling symlinks.
    logger : object
        See :any:`LogSystem`.
    log_copied_file : bool, optional
        See :any:`custom_copy2` > log_copied_file parameter.
    relative_path : str, optional
        A relative path to exctract from the path that's going to be logged.
    overwrite : bool, optional
        Overwrite existent files without doing any checks.

    Returns
    -------
    str
        The destination if no errors were raised.

    Raises
    ------
    exceptions.Error
        A list of errors after all items in a directory were processed.
    """
    names = os.listdir(src)

    try:
        if ignored_patterns is not None:
            ignored_names = ignore_patterns(*ignored_patterns)(src, names)
        else:
            ignored_names = set()

        if not os.path.exists(dst):
            os.makedirs(dst)
    except Exception as err:
        logger.error(err)

    errors = []

    for name in names:
        if name in ignored_names:
            continue

        srcname = os.path.join(src, name)
        dstname = os.path.join(dst, name)

        try:
            if os.path.islink(srcname):
                linkto = os.readlink(srcname)

                if symlinks:
                    # os.symlink(linkto, dstname)
                    # copystat(srcname, dstname, follow_symlinks=not symlinks)
                    # Let :any:`copy_create_symlink` take care of symlinks. With the approach taken by
                    # the original :any:`shutil.copytree` function, I'm constantly spammed with
                    # useless errors thrown by the direct use of :any:`os.symlink`.
                    # I fixed this nuisance by simply getting rid of the destination.
                    # MOVING ON!!!
                    copy_create_symlink(srcname, dstname, source_is_symlink=True,
                                        logger=logger, follow_symlinks=not symlinks)
                else:
                    # Ignore dangling symlink if the flag is on
                    if not os.path.exists(linkto) and ignore_dangling_symlinks:
                        continue
                    # Otherwise let the copy occurs. copy2 will raise an error
                    if os.path.isdir(srcname):
                        custom_copytree(srcname, dstname,
                                        symlinks=symlinks,
                                        ignored_patterns=ignored_patterns,
                                        logger=logger,
                                        log_copied_file=log_copied_file,
                                        relative_path=relative_path)
                    else:
                        custom_copy2(srcname, dstname,
                                     logger=logger,
                                     log_copied_file=log_copied_file,
                                     relative_path=relative_path,
                                     overwrite=overwrite)
            elif os.path.isdir(srcname):
                custom_copytree(srcname, dstname,
                                symlinks=symlinks,
                                ignored_patterns=ignored_patterns,
                                logger=logger,
                                log_copied_file=log_copied_file,
                                relative_path=relative_path,
                                overwrite=overwrite)
            else:
                # Will raise a SpecialFileError for unsupported file types
                custom_copy2(srcname, dstname,
                             logger=logger,
                             log_copied_file=log_copied_file,
                             relative_path=relative_path,
                             overwrite=overwrite)
        # Catch the Error from the recursive custom_copytree so that we can
        # continue with other files
        except exceptions.Error as err:
            errors.extend(err.args[0])
        except OSError as why:
            errors.append((srcname, dstname, str(why)))

    try:
        copystat(src, dst)
    except OSError as why:
        # Copying file access times may fail on Windows
        if getattr(why, "winerror", None) is None:
            errors.append((src, dst, str(why)))

    if errors:
        raise exceptions.Error(errors)

    return dst


def get_folder_size(dir_path):
    """Get folder size

    Parameters
    ----------
    dir_path : str
        Path to a directory.

    Returns
    -------
    int
        A directory size in bytes.

    Note
    ----
    Based on: `Calculating a directory's size using Python? <https://stackoverflow.com/a/37367965>`__
    """
    total = 0

    for entry in os.scandir(dir_path):
        if entry.is_file() and not entry.is_symlink():
            total += entry.stat().st_size
        elif entry.is_dir() and not entry.is_symlink():
            total += get_folder_size(entry.path)

    return total


if __name__ == "__main__":
    pass
