#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Settings.
"""
try:
    import sublime
except Exception:
    pass

from . import events
from .. import misc_utils


class Settings():
    """This class provides global access to and management of plugin settings.

    Attributes
    ----------
    logger : TYPE
        Description
    """

    def __init__(self, name_space="", logger=None):
        """Summary

        Parameters
        ----------
        name_space : str, optional
            Description
        logger : None, optional
            Description
        """
        self.logger = logger
        self._name_space = name_space
        self._reload_key = "%s-reload-settings" % self._name_space
        self._previous_state = {}
        self._current_state = {}
        self.__project_settings = None
        self.__settings = None
        self._change_count = 0

    def load(self):
        """Load the plugin settings.
        """
        self.observe()
        self.on_update()

    @property
    def settings(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        s = self.__settings
        if not s:
            s = self.__settings = sublime.load_settings("%s.sublime-settings" % self._name_space)
        return s

    @property
    def project_settings(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        # NOTE: Monitor this. I smell disaster!!! LOL
        # It works good enough for now.
        # Also keep an eye on utils.py > ProjectSettingsController.
        try:
            s = sublime.active_window().project_data().get("settings", {}).get(self._name_space, {})
        except Exception:
            s = {}

        return s

    def has(self, name):
        """Return whether the given setting exists.

        Parameters
        ----------
        name : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        return self.settings.has(name)

    def get(self, name, default=None):
        """Return a plugin setting, defaulting to default if not found.

        Parameters
        ----------
        name : TYPE
            Description
        default : None, optional
            Description

        Returns
        -------
        TYPE
            Description
        """
        try:
            return self._current_state[name]
        except KeyError:
            global_value = self.settings.get(name, default)
            project_value = self.project_settings.get(name, global_value)
            self._current_state[name] = current_value = misc_utils.merge_dict(
                global_value, project_value,
                logger=self.logger, extend_lists=False, append_to_lists=False
            )
            return current_value

    def set(self, name, value):
        """Summary

        Parameters
        ----------
        name : TYPE
            Description
        value : TYPE
            Description
        """
        try:
            self.__settings.set(name, value)
            sublime.save_settings("%s.sublime-settings" % self._name_space)
        except BaseException as err:
            print(err)

    def has_changed(self, name):
        """Summary

        Parameters
        ----------
        name : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        current_value = self.get(name)
        try:
            old_value = self._previous_state[name]
        except KeyError:
            return False
        else:
            return (old_value != current_value)

    def change_count(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        return self._change_count

    def observe(self):
        """Observe changes.
        """
        self.settings.clear_on_change(self._reload_key)
        self.settings.add_on_change(self._reload_key, self.on_update)

    def unobserve(self):
        """Summary
        """
        self.settings.clear_on_change(self._reload_key)

    def on_update(self):
        """Update state when the user settings change.
        """
        self._previous_state = self._current_state.copy()
        self._current_state.clear()
        self._change_count += 1
        events.broadcast("settings_changed", {"settings": self})


class SettingsToggleBoolean():
    """Summary
    """
    _ody_key = ""
    _ody_settings = {}
    _ody_is_checkbox = True
    _ody_description = "%s"
    _ody_true_label = "Enabled"
    _ody_false_label = "Disabled"

    def run(self):
        """Summary
        """
        try:
            new_val = not self._ody_settings.get(self._ody_key, False)
            self._ody_settings.set(self._ody_key, new_val)
            sublime.status_message("%s changed to %r" % (self._ody_key, new_val))
        except Exception as err:
            print(err)

    def is_checked(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        return self._ody_settings.get(self._ody_key, False)

    def description(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        try:
            return self._ody_description % (
                self._ody_true_label if self.is_checked() else self._ody_false_label)
        except TypeError:
            return self._ody_description


class SettingsToggleList():
    """Summary
    """
    _ody_key = ""
    _ody_settings = {}
    _ody_description = "%s"
    _ody_values_list = []

    def run(self):
        """Summary
        """
        try:
            old_val = self._ody_settings.get(self._ody_key, "")
            new_val = self._ody_get_new_value(old_val)
            self._ody_settings.set(self._ody_key, new_val)
            sublime.status_message("%s changed to %r" % (self._ody_key, new_val))
        except Exception as err:
            print(err)

    def _ody_get_new_value(self, old_val):
        """Summary

        Parameters
        ----------
        old_val : TYPE
            Description

        Returns
        -------
        TYPE
            Description
        """
        try:
            # Get index of value that's after current value.
            val_idx = self._ody_values_list.index(old_val) + 1
        except ValueError:
            # Fallback to index 0.
            val_idx = 0

        try:
            return self._ody_values_list[val_idx]
        except IndexError:
            return self._ody_values_list[0]

    def description(self):
        """Summary

        Returns
        -------
        TYPE
            Description
        """
        try:
            return self._ody_description % self._ody_settings.get(self._ody_key, "")
        except TypeError:
            return self._ody_description


if __name__ == "__main__":
    pass
