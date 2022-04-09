# -*- coding: utf-8 -*-
"""Miscellaneous exceptions.
"""
import sys

from .ansi_colors import Ansi


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
    Based on: `Print an error message without printing a traceback... \
    <https://stackoverflow.com/a/41414413>`__.

    **Modifications**:

    - Stripped the line number report from the original class because it isn't \
    needed for my usage case.
    """

    def __init__(self, msg, exit=True):
        """Initialization.

        Parameters
        ----------
        msg : str
            Message that the exception should display.
        exit : bool, optional
            Whether to exit the program.
        """
        # This is an evil spawn that I don't freaking understand!!!
        # It works as intended for now, so moving on.
        self.args = Ansi.LIGHT_RED("**{0.__name__}:** {1}".format(type(self), msg)),

        if exit:
            sys.exit(self)


class ExceptionWhitoutTraceBackWarning(Exception):
    """Raise an exception without a traceback nor an exit error.

    Only used when the traceback isn't important and the message is clear, to
    the point, and highlighted in red.

    Attributes
    ----------
    args : tuple
        Arguments.
    """

    def __init__(self, msg):
        """Initialization.

        Parameters
        ----------
        msg : str
            Message that the exception should display.
        """
        # This is an evil spawn that I don't freaking understand!!!
        # It works as intended for now, so moving on.
        self.args = Ansi.LIGHT_YELLOW("**{0.__name__}:** {1}".format(type(self), msg)),
        sys.exit(self)


class MissingRequiredArgument(ExceptionWhitoutTraceBack):
    """MissingRequiredArgument
    """

    def __init__(self, args=[]):
        """Initialization.

        Parameters
        ----------
        args : list, optional
            A list of missing required arguments.
        """
        msg = "Missing required arguments: %s" % ", ".join(args)
        print("")
        super().__init__(msg=msg)


class WrongType(ExceptionWhitoutTraceBack):
    """WrongType
    """

    def __init__(self, expected="", received=""):
        """Initialization.

        Parameters
        ----------
        expected : str, optional
            Expected type.
        received : str, optional
            Received type.
        """
        msg = f'{expected} expected, {received} received.'
        print("")
        super().__init__(msg=msg, exit=False)


class MalformedJSONFile(ExceptionWhitoutTraceBack):
    """MalformedJSONFile
    """

    def __init__(self, file_path=""):
        """Initialization.

        Parameters
        ----------
        file_path : str, optional
            A file path.
        """
        msg = f'Failed to parse JSON data for file <{file_path}>.'
        print("")
        super().__init__(msg=msg)


class CannotBackend(ExceptionWhitoutTraceBack):
    """CannotBackend
    """

    def __init__(self, subclass=""):
        """Initialization.

        Parameters
        ----------
        subclass : str, optional
            A property name.
        """
        msg = f'The <{subclass}> subclass cannot be backended.'
        print("")
        super().__init__(msg=msg)


class PEBCAK(ExceptionWhitoutTraceBack):
    """CannotBackend
    """

    def __init__(self):
        """Initialization.
        """
        print("")
        super().__init__(msg="PEBCAK")


class UnkownWidgetType(Exception):
    """CannotBackend
    """

    def __init__(self, widget_type=""):
        """Initialization.

        Parameters
        ----------
        widget_type : str, optional
            A property name.
        """
        msg = f"UnkownWidgetType: The <{widget_type}> widget type doesn't exist."
        print("")
        super().__init__(msg)


class MissingPreferenceKey(Exception):
    """CannotBackend
    """

    def __init__(self, widget_pref_key=""):
        """Initialization.

        Parameters
        ----------
        widget_pref_key : str, optional
            The missing preference key.
        """
        msg = f'MissingPreferenceKey: <{widget_pref_key}> preference key is not defined in settings-schema.json file.'
        print("")
        super().__init__(msg)


class MethodNotimplemented(ExceptionWhitoutTraceBack):
    """MethodNotimplemented
    """

    def __init__(self, method="", cls=""):
        """Initialization.

        Parameters
        ----------
        method : str, optional
            A method name.
        cls : str, optional
            A class name.
        """
        msg = f'The <{method}> method in class <{cls}> needs to be implemented.'
        print("")
        super().__init__(msg)


if __name__ == "__main__":
    pass
