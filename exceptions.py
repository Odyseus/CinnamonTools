#!/usr/bin/python3
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
    Based on an answer from a `StackOverflow question <https://stackoverflow.com/a/41414413>`__.
    Stripped the line number report from the original class because is not needed for my usage case.
    """

    def __init__(self, msg):
        """Initialize.

        Parameters
        ----------
        msg : str
            Message that the exception should display.
        """
        # This is an evil spawn that I don't freaking understand!!!
        # It works as intended for now, so moving on.
        self.args = Ansi.ERROR("{0.__name__}: {1}".format(type(self), msg)),
        sys.exit(self)


class ExceptionWhitoutTraceBackWarning(Exception):
    """Raise an exception without a traceback nor an exit errror.

    Only used when the traceback isn't important and the message is clear, to
    the point, and highlighted in red.

    Attributes
    ----------
    args : tuple
        Arguments.
    """

    def __init__(self, msg):
        """Initialize.

        Parameters
        ----------
        msg : str
            Message that the exception should display.
        """
        # This is an evil spawn that I don't freaking understand!!!
        # It works as intended for now, so moving on.
        self.args = Ansi.WARNING("{0.__name__}: {1}".format(type(self), msg)),
        sys.exit(self)


class BadExecutionLocation(ExceptionWhitoutTraceBack):
    """BadExecutionLocation
    """

    def __init__(self, msg="All commands must be launched from the application's root directory!!!"):
        """Initialize.

        Parameters
        ----------
        msg : str, optional
            Message that the exception should display.
        """
        super().__init__(msg=msg)


class WrongPythonVersion(ExceptionWhitoutTraceBack):
    """WrongPythonVersion
    """

    def __init__(self, msg="Minimum Python version supported: 3.5"):
        """Initialize.

        Parameters
        ----------
        msg : str, optional
            Message that the exception should display.
        """
        super().__init__(msg=msg)


class MissingCommand(ExceptionWhitoutTraceBack):
    """MissingCommand
    """
    pass


class MissingDependencyModule(ExceptionWhitoutTraceBack):
    """MissingDependencyModule
    """
    pass


class ExistentLocation(ExceptionWhitoutTraceBack):
    """ExistentLocation
    """
    pass


class KeyboardInterruption(ExceptionWhitoutTraceBackWarning):
    """KeyboardInterruption
    """

    def __init__(self, msg="Operation aborted."):
        """Initialize.

        Parameters
        ----------
        msg : str, optional
            Message that the exception should display.
        """
        print("")
        super().__init__(msg=msg)


class MissingRequiredFile(ExceptionWhitoutTraceBackWarning):
    """MissingRequiredFile
    """
    pass


class InvalidDestination(ExceptionWhitoutTraceBackWarning):
    """InvalidDestination
    """
    pass


class OperationAborted(ExceptionWhitoutTraceBackWarning):
    """OperationAborted
    """
    pass


class Error(OSError):
    """Error
    """
    pass


class ValidationError(Exception):
    """Raised for validation errors.
    """
    pass


class WrongValueForOption(ExceptionWhitoutTraceBack):
    """WrongValueForOption
    """
    pass


class NoProfileNameProvided(ExceptionWhitoutTraceBack):
    """NoProfileNameProvided
    """
    pass


class MissingConfigFileForProfile(ExceptionWhitoutTraceBack):
    """MissingConfigFileForProfile
    """
    pass


class MissingSourcesOnConfigFile(ExceptionWhitoutTraceBack):
    """MissingSourcesOnConfigFile
    """
    pass


class MalformedSources(ExceptionWhitoutTraceBack):
    """MalformedSources
    """
    pass


class MissingMandatoryField(ExceptionWhitoutTraceBack):
    """MissingMandatoryField
    """
    pass


class MissingMandatoryArgument(ExceptionWhitoutTraceBack):
    """MissingMandatoryArgument
    """
    pass


class InvalidArgument(ExceptionWhitoutTraceBack):
    """InvalidArgument
    """
    pass


class MethodNotImplemented(ExceptionWhitoutTraceBack):
    """MethodNotImplemented
    """

    def __init__(self, method=""):
        """Initialize.

        Parameters
        ----------
        method : str, optional
            A method name.
        """
        msg = "The <%s> method needs to be implemented." % method
        print("")
        super().__init__(msg=msg)


class MissingMandatoryProperty(ExceptionWhitoutTraceBack):
    """MissingMandatoryProperty
    """

    def __init__(self, prop=""):
        """Initialize.

        Parameters
        ----------
        prop : str, optional
            A property name.
        """
        msg = "The property <%s> needs to be declared." % prop
        print("")
        super().__init__(msg=msg)


if __name__ == "__main__":
    pass
