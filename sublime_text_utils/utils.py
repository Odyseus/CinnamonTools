#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Various utilities.
"""
import os
import sys

from collections import ChainMap
from collections import Mapping
from collections import Sequence
from functools import wraps

# NOTE: try/except block needed for Sphinx.
try:
    import sublime
    import sublime_plugin
except Exception:
    pass

from .. import cmd_utils


def has_right_syntax(view, view_syntaxes=[], strict=False):
    """Has right syntax.

    Check if the view is of the desired syntax listed in ``view_syntaxes``.

    Parameters
    ----------
    view : object
        A Sublime Text view.
    view_syntaxes : list, string, optional
        List of syntaxes to check against.
    strict : bool, optional
        Perform equality checks instead of membership checks.

    Returns
    -------
    bool
        If the view has the right syntax.
    """
    syntax = view.settings().get("syntax").split("/")[-1].lower()

    if isinstance(view_syntaxes, list):
        return any([(s.lower() == syntax if strict else s.lower() in syntax)
                    for s in view_syntaxes])
    elif isinstance(view_syntaxes, str):
        return view_syntaxes.lower() == syntax if strict else view_syntaxes.lower() in syntax

    return False


def has_right_extension(view, file_extensions=[]):
    """Has the right file extension.

    Parameters
    ----------
    view : object
        A Sublime Text view.
    file_extensions : list, optional
        The list of file extensions to check against.

    Returns
    -------
    bool
        Whether if file is of the right syntax.

    Note
    ----
    Borrowed from JSFormat.
    """
    file_name = get_file_path(view)
    ext = None

    if file_name:  # file exists, pull syntax type from extension
        ext = os.path.splitext(file_name)[1][1:]

    if ext is not None:
        return ext in file_extensions

    return False


def remove_bad_chars(text, bad_chars=[]):
    """Remove *bad characters* from selection.

    Parameters
    ----------
    text : str
        The string to clean.
    bad_chars : list, optional
        A list of *bad characters* to remove.

    Returns
    -------
    str
        String with *bad characters* removed.
    """
    if bad_chars and isinstance(bad_chars, Sequence):
        for letter in bad_chars:
            text = text.replace(letter, "")

    return text


def get_selections(view, extract_words=True, bad_chars=[]):
    """Get all selections.

    Parameters
    ----------
    view : object
        A Sublime Text view.
    extract_words : bool, optional
        If no selection is found at region's coordinates, extract words from regions.
    bad_chars : list, optional
        A list of *bad characters* to remove.

    Returns
    -------
    list
        A list of strings.
    """
    selections = []

    for region in view.sel():
        sel = remove_bad_chars(view.substr(region), bad_chars=bad_chars) or \
            (remove_bad_chars(view.substr(view.word(region)),
                              bad_chars=bad_chars) if extract_words else None)

        if sel:
            selections.append(sel)

    return selections if selections else None


def get_executable_from_settings(view, settings):
    """Get executable.

    Parameters
    ----------
    view : object
        A Sublime Text view.
    settings : list
        The list of executable names and/or paths to check.

    Returns
    -------
    str
        The path or name to an existent program.
    None
        No program found.
    """
    settings = substitute_variables(get_view_context(view), settings)

    for exec in settings:
        if exec and (cmd_utils.can_exec(exec) or cmd_utils.which(exec)):
            return exec

    return None


def substitute_variables(variables, value):
    """Substitute variables.

    Utilizes Sublime Text's `expand_variables` API, which uses the `${varname}` syntax and
    supports placeholders (`${varname:placeholder}`).

    Parameters
    ----------
    variables : dict
        A dictionary containing variables as keys mapped to values to replace those variables.
    value : str, list, dict
        The str/list/dict containing the data where to perform substitutions.

    Returns
    -------
    list
    dict
    str
        The modified data.

    Note
    ----
    Borrowed from SublimeLinter.
    """
    if isinstance(value, str):
        # Workaround https://github.com/SublimeTextIssues/Core/issues/1878
        # (E.g. UNC paths on Windows start with double backslashes.)
        value = value.replace(r"\\", r"\\\\")

        if os.pardir + os.sep in value:
            value = os.path.normpath(value)

        value = os.path.expandvars(os.path.expanduser(value))

        return sublime.expand_variables(value, variables)
    elif isinstance(value, Mapping):
        return {key: substitute_variables(variables, val) for key, val in value.items()}
    elif isinstance(value, Sequence):
        return [substitute_variables(variables, item) for item in value]
    else:
        return value


def guess_project_root_of_view(view):
    """Guess project root folder from view.

    Parameters
    ----------
    view : object
        A Sublime Text view.

    Returns
    -------
    None
        No project root folder could be ascertained.
    str
        The project root folder.

    Note
    ----
    Borrowed from SublimeLinter. I <3 these guys!
    """
    window = view.window()
    if not window:
        return None

    folders = window.folders()
    if not folders:
        return None

    filename = get_file_path(view)

    if not filename:
        return folders[0]

    for folder in folders:
        # Take the first one; should we take the deepest one? The shortest?
        if os.path.commonprefix([folder, filename]) == folder:
            return folder

    return None


def get_file_path(view):
    """Get file from view.

    Parameters
    ----------
    view : object
        A Sublime Text view.

    Returns
    -------
    str
        The view's file path.
    """
    return str(view.file_name()) if view and view.file_name() else ""


def get_filename(view):
    """Get view's file name.

    Parameters
    ----------
    view : object
        A Sublime Text view.

    Returns
    -------
    str
        File name.

    Note
    ----
    Borrowed from SublimeLinter.
    """
    return view.file_name() or "<untitled {}>".format(view.buffer_id())


def _extract_window_variables(window):
    """Extract window variables.

    We explicitly want to compute all variables around the current file on our own.

    Parameters
    ----------
    window : object
        A sublime.Window object.

    Returns
    -------
    dict
        Window variables.
    """
    variables = window.extract_variables()

    for key in ("file", "file_path", "file_name", "file_base_name", "file_extension"):
        variables.pop(key, None)

    return variables


def get_view_context(view, additional_context=None):
    """Get view context.

    Note that we ship a enhanced version for ``folder`` if you have multiple
    folders open in a window. See ``guess_project_root_of_view``.

    Parameters
    ----------
    view : object
        A Sublime Text view.
    additional_context : None, optional
        Additional context.

    Returns
    -------
    collections.ChainMap
        Extended window variables with environment variables and more "persistent"
        files/folders names/paths.
    """
    view = view or sublime.active_window().active_view()
    window = view.window() if view else sublime.active_window()
    context = ChainMap({}, _extract_window_variables(window) if window else {}, os.environ)

    project_folder = guess_project_root_of_view(view)

    if project_folder:
        context["folder"] = project_folder

    # ``window.extract_variables`` actually resembles data from the
    # ``active_view``, so we need to pass in all the relevant data around
    # the filename manually in case the user switches to a different
    # view, before we're done here.
    filename = get_file_path(view)

    if filename:
        basename = os.path.basename(filename)
        file_base_name, file_extension = os.path.splitext(basename)

        context["file"] = filename
        context["file_path"] = os.path.dirname(filename)
        context["file_name"] = basename
        context["file_base_name"] = file_base_name
        context["file_extension"] = file_extension

    context["canonical_filename"] = get_filename(view)

    if additional_context:
        context.update(additional_context)

    return context


def distinct_until_buffer_changed(method):
    """Distinct until buffer changed.

    Sublime has problems to hold the distinction between buffers and views.
    It usually emits multiple identical events if you have multiple views
    into the same buffer.

    Parameters
    ----------
    method : method
        Method to wrap.

    Returns
    -------
    method
        Wrapped method.
    """
    last_call = None

    @wraps(method)
    def wrapper(self, view):
        """Wrapper.

        Parameters
        ----------
        view : object
            An instance of ``sublime.View``.

        Returns
        -------
        None
            Halt execution.
        """
        nonlocal last_call

        this_call = (view.buffer_id(), view.change_count())
        if this_call == last_call:
            return

        last_call = this_call
        method(self, view)

    return wrapper


def reload_plugins(prefix):
    """Reload Sublime 'plugins' using official API.

    Parameters
    ----------
    prefix : str
        Python module prefix.
    """
    toplevel = []
    for name, module in sys.modules.items():
        if name.startswith(prefix):
            depth = len(name.split("."))
            if depth == 2:
                toplevel.append(name)

    for name in sorted(toplevel):
        sublime_plugin.reload_plugin(name)


'''
NOTE: This classes won't work anymore in Sublime Text 4.
In Sublime Text 3 I was able to declare it here and sub-class it in a top-level plugin.
In Sublime Text 4 I'm forced to declare it in a top-level plugin.

class ProjectSettingsController():
    @distinct_until_buffer_changed
    def on_post_save_async(self, view):
        # NOTE: Monitor this. I smell disaster!!! LOL
        # It works good enough for now.
        # Also keep an eye on settings.py > Settings > project_settings.
        window = view.window()
        filename = view.file_name()
        if window and filename and window.project_file_name() == filename:
            for window in sublime.windows():
                if window.project_file_name() == filename:
                    self._on_post_save_async_callback()
            return

    def _on_post_save_async_callback(self):
        pass


class SublimeConsoleController():
    """Keep Sublime Text console always open on debug mode.
    """

    def on_activated_async(self, view):
        self._ody_display_console(view)

    def on_new_async(self, view):
        self._ody_display_console(view)

    def _ody_display_console(self, view):
        if view and view.is_valid() and \
                not view.settings().get("is_widget") and \
                not view.settings().get("edit_settings_view") and \
                view.window() and view.window().active_panel() != "console":
            view.window().run_command("show_panel", {"panel": "console"})
'''


class CompletionsSuperClass():
    """Register completions from a plugin settings file.
    """
    _completions_scope = ""
    _completions = []
    _settings = {}
    _logger = None

    def __enabled(self, location):
        """Check if completions should be triggered.

        Parameters
        ----------
        location : int
            A ``sublime.View`` point.

        Returns
        -------
        bool
            If an auto completions should be triggered.
        """
        if not getattr(self, "view", None) or not self._completions:
            return False

        if sublime.active_window().active_view().id() != self.view.id():
            return False

        if not self.view.match_selector(location,
                                        self._settings.get("completions_scope", self._completions_scope)):
            return False

        return True

    def on_query_completions(self, prefix, locations):
        """On query completions.

        Parameters
        ----------
        prefix : str
            Text to complete.
        locations : tuple
            A list of points (a point is an :py:class:`int` that represents the offset from the
            beginning of the editor buffer).

        Returns
        -------
        tuple, None
            A completions object.
        """
        if self.__enabled(locations[0]):
            return (
                self._completions,
                self._settings.get("completions_ignore_content", False) *
                sublime.INHIBIT_WORD_COMPLETIONS |
                self._settings.get("completions_ignore_files", False) *
                sublime.INHIBIT_EXPLICIT_COMPLETIONS
            )

        return None

    @classmethod
    def update_completions(self):
        """Update completions.
        """
        try:
            self._completions = [[c["trigger"], c["contents"]]
                                 for c in self._settings.get("completions", [])]
        except KeyError:
            sublime.status_message("Error updating completions")
            self._completions = []
            self._logger.error(
                "Completions must be a list of dictionaries with only two keys ('trigger' and 'contents')."
            )


if __name__ == "__main__":
    pass
