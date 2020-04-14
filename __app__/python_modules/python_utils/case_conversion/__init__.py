#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Based on `case-conversion <https://github.com/AlejandroFrias/case-conversion>`__.

Note
----
Removed dependency on ``regex`` Python module. I don't care for Unicode compatibility. If and
when this functionality is added to the standard library in an LTS Python version, I might
start to consider implementing it.
"""
import re


__all__ = [
    "camelcase",
    "pascalcase",
    "snakecase",
    "dashcase",
    "kebabcase",
    "spinalcase",
    "constcase",
    "screaming_snakecase",
    "dotcase",
    "separate_words",
    "slashcase",
    "backslashcase",
    "parse_case"
]


def parse_case(var, detect_acronyms=True, acronyms=[], preserve_case=False):
    """
    Parses a variable into a list of words.
    Also returns the case type, which can be one of the following:

        - upper: All words are upper-case.
        - lower: All words are lower-case.
        - pascal: All words are title-case or upper-case. Note that the
                  variable may still have separators.
        - camel: First word is lower-case, the rest are title-case or
                 upper-case. Variable may still have separators.
        - mixed: Any other mixing of word casing. Never occurs if there are
                 no separators.
        - unknown: Variable contains no words.

    Also returns the first separator character, or False if there isn't one.

    Parameters
    ----------
    var : TYPE
        Description
    detect_acronyms : bool, optional
        Description
    acronyms : list, optional
        Description
    preserve_case : bool, optional
        Description

    Returns
    -------
    TYPE
        Description

    TODO
    ----
    Include unicode characters.
    """
    upper = re.compile("^[A-Z]$")
    sep = re.compile("^[^a-zA-Z0-9]$")
    notsep = re.compile("^[a-zA-Z0-9]$")

    words = []
    has_sep = False

    # Index of current character. Initially 1 because we don't want to check
    # if the 0th character is a boundary.
    i = 1
    # Index of first character in a sequence
    s = 0
    # Previous character.
    p = var[0:1]

    # Treat an all-caps variable as lower-case, so that every letter isn't
    # counted as a boundary.
    was_upper = False
    if var.isupper():
        var = var.lower()
        was_upper = True

    # Iterate over each character, checking for boundaries, or places where
    # the variable should divided.
    while i <= len(var):
        c = var[i:i + 1]

        split = False
        if i < len(var):
            # Detect upper-case letter as boundary.
            if upper.match(c):
                split = True
            # Detect transition from separator to not separator.
            elif notsep.match(c) and sep.match(p):
                split = True
            # Detect transition not separator to separator.
            elif sep.match(c) and notsep.match(p):
                split = True
        else:
            # The loop goes one extra iteration so that it can handle the
            # remaining text after the last boundary.
            split = True

        if split:
            if notsep.match(p):
                words.append(var[s:i])
            else:
                # Variable contains at least one separator.
                # Use the first one as the variable's primary separator.
                if not has_sep:
                    has_sep = var[s:s + 1]

                # Use None to indicate a separator in the word list.
                words.append(None)
                # If separators weren't included in the list, then breaks
                # between upper-case sequences ("AAA_BBB") would be
                # disregarded; the letter-run detector would count them as one
                # sequence ("AAABBB").
            s = i

        i = i + 1
        p = c

    if detect_acronyms:
        if acronyms:
            # Use advanced acronym detection with list

            # Sanitize acronyms list by discarding invalid acronyms and
            # normalizing valid ones to upper-case.
            valid_acronym = re.compile("^[a-zA-Z0-9]+$")
            unsafe_acronyms = acronyms
            acronyms = []
            for a in unsafe_acronyms:
                if valid_acronym.match(a):
                    acronyms.append(a.upper())
                else:
                    print("Case Conversion: acronym '%s' was discarded for being invalid" % a)

            # Check a run of words represented by the range [s, i]. Should
            # return last index of new word groups.
            def check_acronym(s, i):
                # Combine each letter into single string.
                acstr = "".join(words[s:i])

                # List of ranges representing found acronyms.
                range_list = []
                # Set of remaining letters.
                not_range = set(range(len(acstr)))

                # Search for each acronym in acstr.
                for acronym in acronyms:
                    # TODO: Sanitize acronyms to include only letters.
                    rac = re.compile(str(acronym))

                    # Loop so that all instances of the acronym are found,
                    # instead of just the first.
                    n = 0
                    while True:
                        m = rac.search(acstr, n)
                        if not m:
                            break

                        a, b = m.start(), m.end()
                        n = b

                        # Make sure found acronym doesn't overlap with others.
                        ok = True
                        for r in range_list:
                            if a < r[1] and b > r[0]:
                                ok = False
                                break

                        if ok:
                            range_list.append((a, b))
                            for j in range(a, b):
                                not_range.remove(j)

                # Add remaining letters as ranges.
                for nr in not_range:
                    range_list.append((nr, nr + 1))

                # No ranges will overlap, so it's safe to sort by lower bound,
                # which sort() will do by default.
                range_list.sort()

                # Remove original letters in word list.
                for j in range(s, i):
                    del words[s]

                # Replace them with new word grouping.
                for j in range(len(range_list)):
                    r = range_list[j]
                    words.insert(s + j, acstr[r[0]:r[1]])

                return s + len(range_list) - 1
        else:
            # Fallback to simple acronym detection.
            def check_acronym(s, i):
                # Combine each letter into a single string.
                acronym = "".join(words[s:i])

                # Remove original letters in word list.
                for j in range(s, i):
                    del words[s]

                # Replace them with new word grouping.
                words.insert(s, "".join(acronym))

                return s

        # Letter-run detector

        # Index of current word.
        i = 0
        # Index of first letter in run.
        s = None

        # Find runs of single upper-case letters.
        while i < len(words):
            word = words[i]
            if word is not None and upper.match(word):
                if s is None:
                    s = i
            elif s is not None:
                i = check_acronym(s, i) + 1
                s = None

            i += 1

        if s is not None:
            check_acronym(s, i)

    # Separators are no longer needed, so they can be removed. They *should*
    # be removed, since it's supposed to be a *word* list.
    words = [w for w in words if w is not None]

    # Determine case type.
    case_type = "unknown"
    if was_upper:
        case_type = "upper"
    elif var.islower():
        case_type = "lower"
    elif len(words) > 0:
        camel_case = words[0].islower()
        pascal_case = words[0].istitle() or words[0].isupper()

        if camel_case or pascal_case:
            for word in words[1:]:
                c = word.istitle() or word.isupper()
                camel_case &= c
                pascal_case &= c
                if not c:
                    break

        if camel_case:
            case_type = "camel"
        elif pascal_case:
            case_type = "pascal"
        else:
            case_type = "mixed"

    if preserve_case:
        if was_upper:
            words = [w.upper() for w in words]
    else:
        # Normalize case of each word to PascalCase. From there, other cases
        # can be worked out easily.
        for i in range(len(words)):
            if detect_acronyms:
                if acronyms:
                    if words[i].upper() in acronyms:
                        # Convert known acronyms to upper-case.
                        words[i] = words[i].upper()
                    else:
                        # Capitalize everything else.
                        words[i] = words[i].capitalize()
                else:
                    # Fallback behavior: Preserve case on upper-case words.
                    if not words[i].isupper():
                        words[i] = words[i].capitalize()
            else:
                words[i] = words[i].capitalize()

    return words, case_type, has_sep


def camelcase(text, detect_acronyms=False, acronyms=[]):
    """Return text in camelCase style.

    Parameters
    ----------
    text : TYPE
        Description
    detect_acronyms : bool, optional
        Description
    acronyms : list, optional
        Description

    Examples
    --------
    >>> camelcase("hello world")
    "helloWorld"
    >>> camelcase("HELLO_HTML_WORLD", True, ["HTML"])
    "helloHTMLWorld"

    Returns
    -------
    TYPE
        Description
    """
    words, case, sep = parse_case(text, detect_acronyms, acronyms)
    if words:
        words[0] = words[0].lower()
    return "".join(words)


def pascalcase(text, detect_acronyms=False, acronyms=[]):
    """Return text in PascalCase style (aka MixedCase).

    Parameters
    ----------
    text : TYPE
        Description
    detect_acronyms : bool, optional
        Description
    acronyms : list, optional
        Description

    Examples
    --------
    >>> pascalcase("hello world")
    "HelloWorld"
    >>> pascalcase("HELLO_HTML_WORLD", True, ["HTML"])
    "HelloHTMLWorld"

    Returns
    -------
    TYPE
        Description
    """
    words, case, sep = parse_case(text, detect_acronyms, acronyms)
    return "".join(words)


def snakecase(text, detect_acronyms=False, acronyms=[]):
    """Return text in snake_case style.

    Parameters
    ----------
    text : TYPE
        Description
    detect_acronyms : bool, optional
        Description
    acronyms : list, optional
        Description

    Examples
    --------
    >>> snakecase("hello world")
    "hello_world"
    >>> snakecase("HelloHTMLWorld", True, ["HTML"])
    "hello_html_world"

    Returns
    -------
    TYPE
        Description
    """
    words, case, sep = parse_case(text, detect_acronyms, acronyms)
    return "_".join([w.lower() for w in words])


def dashcase(text, detect_acronyms=False, acronyms=[]):
    """Return text in dash-case style (aka kebab-case, spinal-case).

    Parameters
    ----------
    text : TYPE
        Description
    detect_acronyms : bool, optional
        Description
    acronyms : list, optional
        Description

    Examples
    --------
    >>> dashcase("hello world")
    "hello-world"
    >>> dashcase("HelloHTMLWorld", True, ["HTML"])
    "hello-html-world"

    Returns
    -------
    TYPE
        Description
    """
    words, case, sep = parse_case(text, detect_acronyms, acronyms)
    return "-".join([w.lower() for w in words])


def kebabcase(text, detect_acronyms=False, acronyms=[]):
    """Return text in kebab-case style (aka snake-case, spinal-case).

    Parameters
    ----------
    text : TYPE
        Description
    detect_acronyms : bool, optional
        Description
    acronyms : list, optional
        Description

    Examples
    --------
    >>> kebabcase("hello world")
    "hello-world"
    >>> kebabcase("HelloHTMLWorld", True, ["HTML"])
    "hello-html-world"

    Returns
    -------
    TYPE
        Description
    """
    return dashcase(text, detect_acronyms, acronyms)


def spinalcase(text, detect_acronyms=False, acronyms=[]):
    """Return text in spinal-case style (aka snake-case, kebab-case).

    Parameters
    ----------
    text : TYPE
        Description
    detect_acronyms : bool, optional
        Description
    acronyms : list, optional
        Description

    Examples
    --------
    >>> spinalcase("hello world")
    "hello-world"
    >>> spinalcase("HELLO_HTML_WORLD", True, ["HTML"])
    "hello-html-world"

    Returns
    -------
    TYPE
        Description
    """
    return dashcase(text, detect_acronyms, acronyms)


def constcase(text, detect_acronyms=False, acronyms=[]):
    """Return text in CONST_CASE style (aka SCREAMING_SNAKE_CASE).

    Parameters
    ----------
    text : TYPE
        Description
    detect_acronyms : bool, optional
        Description
    acronyms : list, optional
        Description

    Examples
    --------
    >>> constcase("hello world")
    "HELLO_WORLD"
    >>> constcase("helloHTMLWorld", True, ["HTML"])
    "HELLO_HTML_WORLD"

    Returns
    -------
    TYPE
        Description
    """
    words, case, sep = parse_case(text, detect_acronyms, acronyms)
    return "_".join([w.upper() for w in words])


def screaming_snakecase(text, detect_acronyms=False, acronyms=[]):
    """Return text in SCREAMING_SNAKE_CASE style (aka CONST_CASE).

    Parameters
    ----------
    text : TYPE
        Description
    detect_acronyms : bool, optional
        Description
    acronyms : list, optional
        Description

    Examples
    --------
    >>> screaming_snakecase("hello world")
    "HELLO_WORLD"
    >>> screaming_snakecase("helloHTMLWorld", True, ["HTML"])
    "HELLO_HTML_WORLD"

    Returns
    -------
    TYPE
        Description
    """
    return constcase(text, detect_acronyms, acronyms)


def dotcase(text, detect_acronyms=False, acronyms=[]):
    """Return text in dot.case style.

    Parameters
    ----------
    text : TYPE
        Description
    detect_acronyms : bool, optional
        Description
    acronyms : list, optional
        Description

    Examples
    --------
    >>> dotcase("hello world")
    "hello.world"
    >>> dotcase("helloHTMLWorld", True, ["HTML"])
    "hello.html.world"

    Returns
    -------
    TYPE
        Description
    """
    words, case, sep = parse_case(text, detect_acronyms, acronyms)
    return ".".join([w.lower() for w in words])


def separate_words(text, detect_acronyms=False, acronyms=[]):
    """Return text in "seperate words" style.

    Parameters
    ----------
    text : TYPE
        Description
    detect_acronyms : bool, optional
        Description
    acronyms : list, optional
        Description

    Examples
    --------
    >>> separate_words("HELLO_WORLD")
    "HELLO WORLD"
    >>> separate_words("helloHTMLWorld", True, ["HTML"])
    "hello HTML World"

    Returns
    -------
    TYPE
        Description
    """
    words, case, sep = parse_case(
        text, detect_acronyms, acronyms, preserve_case=True)
    return " ".join(words)


def slashcase(text, detect_acronyms=False, acronyms=[]):
    """Return text in slash/case style.

    Parameters
    ----------
    text : TYPE
        Description
    detect_acronyms : bool, optional
        Description
    acronyms : list, optional
        Description

    Examples
    --------
    >>> slashcase("HELLO_WORLD")
    "HELLO/WORLD"
    >>> slashcase("helloHTMLWorld", True, ["HTML"])
    "hello/HTML/World"

    Returns
    -------
    TYPE
        Description
    """
    words, case, sep = parse_case(
        text, detect_acronyms, acronyms, preserve_case=True)
    return "/".join(words)


def backslashcase(text, detect_acronyms=False, acronyms=[]):
    r"""Return text in backslash\case style.

    Parameters
    ----------
    text : TYPE
        Description
    detect_acronyms : bool, optional
        Description
    acronyms : list, optional
        Description

    Examples
    --------
    >>> backslashcase("HELLO_WORLD") == r"HELLO\WORLD"
    True
    >>> backslashcase("helloHTMLWorld", True, ["HTML"]) == r"hello\HTML\World"
    True

    Returns
    -------
    TYPE
        Description
    """
    words, case, sep = parse_case(
        text, detect_acronyms, acronyms, preserve_case=True)
    return "\\".join(words)


if __name__ == "__main__":
    pass
