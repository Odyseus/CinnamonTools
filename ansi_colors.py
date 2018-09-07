#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Utility to colorize terminal output.

Attributes
----------
Ansi : object
    :any:`ANSIColors` class initialization.
"""


class ANSIColors():
    """Class to colorize terminal output.
    """

    def ERROR(self, string):
        """Red color that symbolizes error.

        Parameters
        ----------
        string : str
            The string that will be "colorized".

        Returns
        -------
        str
            String surrounded by ANSI codes.
        """
        return "\033[38;5;166;1m" + str(string) + "\033[0m"

    def INFO(self, string):
        """No color, just bold text.

        Parameters
        ----------
        string : str
            The string that will be "colorized".

        Returns
        -------
        str
            String surrounded by ANSI codes.
        """
        return "\033[1m" + str(string) + "\033[0m"

    def WARNING(self, string):
        """Yellow color that symbolizes warning.

        Parameters
        ----------
        string : str
            The string that will be "colorized".

        Returns
        -------
        str
            String surrounded by ANSI codes.
        """
        return "\033[38;5;220;1m" + str(string) + "\033[0m"

    def SUCCESS(self, string):
        """Green color that symbolizes success.

        Parameters
        ----------
        string : str
            The string that will be "colorized".

        Returns
        -------
        str
            String surrounded by ANSI codes.
        """
        return "\033[38;5;77;1m" + str(string) + "\033[0m"

    def PURPLE(self, string):
        """Purple color.

        Parameters
        ----------
        string : str
            The string that will be "colorized".

        Returns
        -------
        str
            String surrounded by ANSI codes.
        """
        return "\033[38;5;164;1m" + str(string) + "\033[0m"


Ansi = ANSIColors()


if __name__ == "__main__":
    pass
