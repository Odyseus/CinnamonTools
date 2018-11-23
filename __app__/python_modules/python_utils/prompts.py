#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""CLI prompts and confirmation "dialogs" utilities.
"""
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

    Note
    ----
        `Based on <http://code.activestate.com/recipes/541096-prompt-the-user-for-confirmation>`__.
        Eradicated Python 2 code from original function and added "transparent handling" of upper/
        lower case input responses.

    Raises
    ------
    exceptions.KeyboardInterruption
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
    exceptions.ValidationError
        Raise if empty.

    Note
    ----
        Extracted from Sphinx itself.
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
    exceptions.KeyboardInterruption
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
            except exceptions.ValidationError as err:
                print(Ansi.ERROR("* " + str(err)))
                continue
            break
    except (KeyboardInterrupt, SystemExit):
        raise exceptions.KeyboardInterruption()
    else:
        d[key] = x


if __name__ == "__main__":
    pass
