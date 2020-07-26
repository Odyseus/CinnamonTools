#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""
Borrowed from GoSublime

Copyright (c) 2012 The GoSublime Authors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""
# NOTE: try/except block needed for Sphinx.
try:
    import sublime
except Exception:
    pass

from ..diff_match_patch import diff_match_patch


class MergeException(Exception):
    """MergeException.
    """
    pass


def _merge_code(view, edit, original, modified):
    """Merge code.

    Parameters
    ----------
    view : object
        A Sublime Text view object.
    edit : object
        A Sublime Text edit object.
    original : str
        Original string.
    modified : str
        Modified string.

    Returns
    -------
    bool
        Is view dirty.

    Raises
    ------
    MergeException
        Error merging.
    """
    dmp = diff_match_patch()
    diffs = dmp.diff_main(original, modified)
    dmp.diff_cleanupEfficiency(diffs)
    i = 0
    dirty = False

    for k, s in diffs:
        ln = len(s)

        if k == 0:
            # match
            ln = len(s)

            if view.substr(sublime.Region(i, i + ln)) != s:
                raise MergeException("mismatch", dirty)

            i += ln
        else:
            dirty = True

            if k > 0:
                # insert
                view.insert(edit, i, s)
                i += ln
            else:
                # delete
                if view.substr(sublime.Region(i, i + ln)) != s:
                    raise MergeException("mismatch", dirty)

                view.erase(edit, sublime.Region(i, i + ln))

    return dirty


def merge_code(view, edit, original, modified):
    """Merge code.

    Parameters
    ----------
    view : object
        A Sublime Text view object.
    edit : object
        A Sublime Text edit object.
    original : str
        Original string.
    modified : str
        Modified string.

    Returns
    -------
    tuple
        View state and error.
    """
    vs = view.settings()
    ttts = vs.get("translate_tabs_to_spaces")

    if not original.strip():
        return (False, "")

    vs.set("translate_tabs_to_spaces", False)
    dirty = False
    err = ""

    try:
        dirty = _merge_code(view, edit, original, modified)
    except MergeException as exc:
        dirty = True
        err = "Could not merge changes into the buffer, edit aborted: %s" % exc
        view.replace(edit, sublime.Region(0, view.size()), original)
    except Exception as ex:
        err = "Unknown exception: %s" % ex
    finally:
        vs.set("translate_tabs_to_spaces", ttts)
        return (dirty, err)
