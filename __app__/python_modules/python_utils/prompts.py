#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""CLI prompts and confirmation "dialogs" utilities.
"""
import sys
import termios
import tty

from . import exceptions
from .ansi_colors import Ansi


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

    Raises
    ------
    exceptions.KeyboardInterruption
        Halt execution on Ctrl + C press.

    Note
    ----
    Based on: `Prompt the user for confirmation (Python recipe) \
    <http://code.activestate.com/recipes/541096-prompt-the-user-for-confirmation>`__.

    **Modifications**:

    - Eradicated Python 2 code and added *transparent handling* of \
    upper/lower case input responses.
    """

    if prompt is None:
        prompt = "Confirm"

    if response:
        prompt = "**%s [%s/%s]:** " % (prompt, "Y", "n")
    else:
        prompt = "**%s [%s/%s]:** " % (prompt, "N", "y")

    try:
        while True:
            # Lower the input case just so I don't have to micro-manage the answer.
            ans = input(Ansi.DEFAULT(prompt)).lower()

            if not ans:
                return response

            if ans not in ["y", "n"]:
                print(Ansi.LIGHT_YELLOW("**Please enter y or n.**"))
                continue

            if ans == "y":
                return True

            if ans == "n":
                return False
    except KeyboardInterrupt:
        raise exceptions.KeyboardInterruption()


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
    Based on: Utilities found in `Sphinx <https://github.com/sphinx-doc/sphinx>`__

    **Modifications**:

    - Eradicated Python 2 specific code.
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
    exceptions.ValidationError
        Raise if empty.

    Note
    ----
    Based on: Utilities found in `Sphinx <https://github.com/sphinx-doc/sphinx>`__

    **Modifications**:

    - Eradicated Python 2 specific code.
    """
    if not x:
        raise exceptions.ValidationError("Please enter some text.")

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
    Based on: Utilities found in `Sphinx <https://github.com/sphinx-doc/sphinx>`__

    **Modifications**:

    - Eradicated Python 2 specific code.
    """
    if isinstance(text, str):
        return text

    print(Ansi.LIGHT_YELLOW("* Note: non-ASCII characters entered "
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

    Raises
    ------
    exceptions.KeyboardInterruption
        Halt execution on Ctrl + C press.

    Note
    ----
    Based on: Utilities found in `Sphinx <https://github.com/sphinx-doc/sphinx>`__

    **Modifications**:

    - Eradicated Python 2 specific code.
    """
    try:
        while True:
            if default is not None:
                prompt = "**> %s:\n> Default [**%s**]:** " % (text, default)
            else:
                prompt = "**> %s:** " % text

            prompt = Ansi.DEFAULT(prompt)
            x = term_input(prompt).strip()

            if default and not x:
                x = default

            x = term_decode(x)

            try:
                x = validator(x)
            except exceptions.ValidationError as err:
                print(Ansi.LIGHT_YELLOW("*** %s**" % str(err)))
                continue
            break
    except (KeyboardInterrupt, SystemExit):
        raise exceptions.KeyboardInterruption()
    else:
        d[key] = x


def read_char(txt):
    """Read character.

    Read single characters from standard input.

    Parameters
    ----------
    txt : str
        Message to display.

    Returns
    -------
    str
        The read character.
    """
    print(Ansi.DEFAULT(txt))
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)

    try:
        tty.setraw(sys.stdin.fileno())
        ch = sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)

    return ch


if __name__ == "__main__":
    pass
