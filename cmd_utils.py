#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Command utilities.

Attributes
----------
STREAM_BOTH : int
    3
STREAM_STDERR : int
    2
STREAM_STDOUT : int
    1
"""
import os
import platform
import subprocess


STREAM_STDOUT = 1
STREAM_STDERR = 2
STREAM_BOTH = STREAM_STDOUT + STREAM_STDERR


def get_startup_info():
    """Get startup info.

    Returns
    -------
    subprocess.STARTUPINFO
        Startup info fir Windows processes.
    """
    if platform.system() == "Windows":
        info = subprocess.STARTUPINFO()
        info.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        info.wShowWindow = subprocess.SW_HIDE

        return info

    return None


def popen(cmd, stdout=None, stderr=None, output_stream=STREAM_BOTH,
          env=None, cwd=None, logger=None, **kwargs):
    """Open a pipe to an external process and return a Popen object.

    Parameters
    ----------
    cmd : list
        The command to run.
    stdout : None, optional
        Pipe to be connected to the standard output stream.
    stderr : None, optional
        Pipe to be connected to the standard error stream.
    output_stream : int, optional
        Which output streams should be used (stdout, stderr or both).
    env : None, optional
        A mapping object representing the string environment.
    cwd : None, optional
        Path to working directory.
    logger : LogSystem
        The logger.

    Returns
    -------
    subprocess.Popen
        Popen object.
    """
    if output_stream == STREAM_BOTH:
        stdout = stdout or subprocess.PIPE
        stderr = stderr or subprocess.PIPE
    elif output_stream == STREAM_STDOUT:
        stdout = stdout or subprocess.PIPE
        stderr = subprocess.DEVNULL
    elif output_stream == STREAM_STDERR:
        stdout = subprocess.DEVNULL
        stderr = stderr or subprocess.PIPE
    else:
        stdout = subprocess.DEVNULL
        stderr = subprocess.DEVNULL

    if env is None:
        env = get_environment()

    try:
        return subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=stdout,
            stderr=stderr,
            startupinfo=get_startup_info(),
            env=env,
            cwd=cwd,
            **kwargs
        )
    except Exception as err:
        if logger:
            msg = 'Could not launch ' + repr(cmd) + '\nReason: ' + \
                str(err) + '\nPATH: ' + env.get('PATH', '')
            logger.error(msg)

        raise


def exec_command(cmd, cwd=None, do_wait=True, do_log=True, logger=None):
    """Execute command.

    Run commands using Popen.

    Parameters
    ----------
    cmd : str
        The command to run.
    cwd : str
        Working directory used by the command.
    do_wait : bool, optional
        Call or not the Popen wait() method. (default: {True})
    do_log : bool, optional
        Log or not the command output. (default: {True})
    logger : LogSystem
        The logger.
    """
    try:
        po = subprocess.Popen(
            cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stdin=None,
            universal_newlines=True,
            env=get_environment(),
            startupinfo=get_startup_info(),
            cwd=cwd
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


def get_environment(set_vars={}, unset_vars=[]):
    """Return a dict with os.environ.

    Parameters
    ----------
    set_vars : dict, optional
        A dictinary used to add or override keys in the default environment variables.
    unset_vars : list, optional
        A list of keys to remove from the default environment variables.

    Returns
    -------
    dict
        A copy of the system environment.
    """
    env = {}
    env.update(os.environ)

    if set_vars:
        env.update(set_vars)

    if unset_vars:
        for var in unset_vars:
            del env[var]

    return env


def can_exec(path):
    """Return whether the given path is a file and is executable.

    Parameters
    ----------
    path : str
        Path to a file.

    Returns
    -------
    bool
        If the file is executable.
    """
    return os.path.isfile(path) and os.access(path, os.X_OK)


def which(cmd):
    """Return the full path to an executable searching PATH.

    Parameters
    ----------
    cmd : str
        Command to search for in PATH.

    Returns
    -------
    str|None
        The path to the executable.
    """
    for path in find_executables(cmd):
        return path

    return None


def find_executables(executable):
    """Yield full paths to given executable.

    Parameters
    ----------
    executable : str
        Executable to find in PATH.

    Returns
    -------
    str|None
        Path to executable.
    """
    env = get_environment()

    for base in env.get("PATH", "").split(os.pathsep):
        path = os.path.join(os.path.expanduser(base), executable)

        if can_exec(path):
            yield path

    return None


def run_cmd(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=True, **kwargs):
    """See :any:`subprocess.run`.

    Parameters
    ----------
    cmd : list|str
        See :any:`subprocess.run`.
    stdout : None|int|file object, optional
        See :any:`subprocess.run`.
    stderr : None|int|file object, optional
        See :any:`subprocess.run`.
    env : object, optional
        See :any:`subprocess.run`.
    **kwargs
        See :any:`subprocess.run`.

    Returns
    -------
    subprocess.CompletedProcess
        A ``subprocess.CompletedProcess`` instance.
    """
    # NOTE: This is a workaround to avoid putting the call to get_environment directly inside
    # the function definition arguments. Otherwise, when generating the documentation with
    # Sphinx, the entire environment is dumped into the generated documentation. ¬¬
    if env is True:
        env = get_environment()

    return subprocess.run(cmd, stdout=stdout, stderr=stderr, env=env, **kwargs)


def launch_default_for_file(filepath):
    """Launch file with default application.

    Parameters
    ----------
    filepath : str
        File path.
    """
    if platform.system() == "Darwin":       # MacOS
        subprocess.call(("open", filepath))
    elif platform.system() == "Windows":    # Windows
        os.startfile(filepath)
    else:                                   # Linux variants
        subprocess.call(("xdg-open", filepath))


if __name__ == "__main__":
    pass
