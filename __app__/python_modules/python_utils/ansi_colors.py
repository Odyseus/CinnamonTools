#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Utility to colorize terminal output.

Attributes
----------
Ansi : python_utils.ansi_colors.ANSIColors
    An ``ANSIColors`` instance.
color_table : dict
    ANSI color table.
"""
import re

color_table = {
    "default":
    {"fg": "39", "bg": "49"},
    "black":
    {"fg": "30", "bg": "40"},
    "red":
    {"fg": "31", "bg": "41"},
    "green":
    {"fg": "32", "bg": "42"},
    "yellow":
    {"fg": "33", "bg": "43"},
    "blue":
    {"fg": "34", "bg": "44"},
    "magenta":
    {"fg": "35", "bg": "45"},
    "cyan":
    {"fg": "36", "bg": "46"},
    "light-gray":
    {"fg": "37", "bg": "47"},
    "dark-gray":
    {"fg": "90", "bg": "100"},
    "light-red":
    {"fg": "91", "bg": "101"},
    "light-green":
    {"fg": "92", "bg": "102"},
    "light-yellow":
    {"fg": "93", "bg": "103"},
    "light-blue":
    {"fg": "94", "bg": "104"},
    "light-magenta":
    {"fg": "95", "bg": "105"},
    "light-cyan":
    {"fg": "96", "bg": "106"},
    "white":
    {"fg": "97", "bg": "107"},
}

# NOTE: DO NOT TOUCH THIS! It works good enough. Do not ever try to tweak it again. NEEVER!!!
_bold_markdown_re = re.compile(r"\*{2}([\s\S]+?)\*{2}")
_bold_placeholder = r"\033[0m\033[1;49;{code}m\1\033[0m\033[0;49;{code}m"


class ANSIColors():
    """Class to colorize terminal output.
    """

    def __init__(self):
        """Initialization.
        """
        self._extend()

    def _extend(self):
        """Extend class' functions.
        """
        for c in color_table:
            setattr(self, c.upper().replace("-", "_"),
                    self._make_color_function(color_table[c]["fg"]))

    def _colorize(self, text, code):
        """Colorize text.

        Parameters
        ----------
        text : str
            Text to colorize.
        code : str
            ANSI color code.

        Returns
        -------
        str
            ANSI formatted string.
        """
        return "\033[0;49;%sm" % code + re.sub(_bold_markdown_re,
                                               _bold_placeholder.format(code=code),
                                               str(text)) + "\033[0m"

    def _make_color_function(self, code):
        """Make color function.

        Parameters
        ----------
        code : str
            ANSI color code.

        Returns
        -------
        method
            A function that will be dynamically attached to ``self``.
        """
        def f(text):
            """Colorize text.

            Parameters
            ----------
            text : str
                Text to colorize.

            Returns
            -------
            method
                The ``self._colorize`` function with a specific ANSI color code attached.
            """
            return self._colorize(text, code)

        return f


Ansi = ANSIColors()

if __name__ == "__main__":
    pass
