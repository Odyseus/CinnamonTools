#!/usr/bin/python3
# -*- coding: utf-8 -*-

import os
import sys

xlet_dir = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
xlet_slug = os.path.basename(xlet_dir)
repo_folder = os.path.normpath(os.path.join(xlet_dir, *([".."] * 2)))
app_folder = os.path.join(repo_folder, "__app__")

if app_folder not in sys.path:
    sys.path.insert(0, app_folder)

from python_modules.localized_help_creator import LocalizedHelpCreator
from python_modules.localized_help_creator import _
from python_modules.localized_help_creator import md
from python_modules.localized_help_creator import utils


class Main(LocalizedHelpCreator):

    def __init__(self, *args):
        super().__init__(*args)

    def get_content_base(self, for_readme):
        return "\n".join([
            "## %s" % _("Description"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("Applet based on two gnome-shell extensions ([Todo list](https://github.com/bsaleil/todolist-gnome-shell-extension) and [Section Todo List](https://github.com/tomMoral/ToDoList)). It allows to create simple ToDo lists from a menu on the panel."),
            "",
            "## %s" % _("Applet usage and features"),
            "",
            _("The usage of this applet is very simple. Each task list is represented by a sub menu and each sub menu item inside a sub menu represents a task."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _(
                "To add a new tasks list, simply focus the **New tasks list...** entry, give a name to the tasks list and press [[Enter]]."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _(
                "To add a new task, simply focus the **New task...** entry, give a name to the task and press [[Enter]]."),
            "- %s" % _("All tasks lists and tasks can be edited in-line."),
            "- %s" % _("Tasks can be marked as completed by changing the checked state of their sub menu items."),
            "- %s" % _("Each tasks list can have its own settings for sorting tasks (by name and/or by completed state), remove task button visibility and completed tasks visibility."),
            "- %s" % _("Each tasks list can be saved as individual TODO files and also can be exported into a file for backup purposes."),
            "- %s" % _("Tasks can be reordered by simply dragging them inside the tasks list they belong to (only if all automatic sorting options for the tasks list are disabled)."),
            "- %s" % _("Tasks can be deleted by simply pressing the delete task button (if visible)."),
            "- %s" % _("Colorized priority tags support. The background and text colors of a task can be colorized depending on the @tag found inside the task text."),
            "- %s" % _("Configurable hotkey to open/close the menu."),
            "- %s" % _("Read the tooltips of each option on this applet settings window for more details."),
        ])

    def get_content_extra(self):
        return md("{}".format("\n".join([
            "## %s" % _("Keyboard shortcuts"),
            _("The keyboard navigation inside this applet menu is very similar to the keyboard navigation used by any other menu on Cinnamon. But it's slightly changed to facilitate tasks and sections handling and edition."),
            "",
            "### %s" % _("When the focus is on a task"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- " + _("[[Ctrl]] + [[Spacebar]]: Toggle the completed (checked) state of a task."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- " + \
            _("[[Shift]] + [[Delete]]: Deletes a task and focuses the element above of the deleted task."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- " + _("[[Alt]] + [[Delete]]: Deletes a task and focuses the element bellow the deleted task."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- " + \
            _("[[Ctrl]] + [[Arrow Up]] or [[Ctrl]] + [[Arrow Down]]: Moves a task inside its tasks list."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- " + _("[[Insert]]: Will focus the **New task...** entry of the currently opened task section."),
            "",
            "### %s" % _("When the focus is on a task section"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- " + _("[[Arrow Left]] and [[Arrow Right]]: If the tasks list (sub menu) is closed, these keys will open the sub menu. If the sub menu is open, these keys will move the cursor inside the sub menu label to allow the edition of the section text."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- " + _("[[Insert]]: Will focus the **New task...** entry inside the task section. If the task section sub menu isn't open, it will be opened."),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "### %s" % _("When the focus is on the **New task...** entry"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- " + _("[[Ctrl]] + [[Spacebar]]: Toggles the visibility of the tasks list options menu."),
            "",
            "## %s" % _("Known issues"),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- " + _("**Hovering over items inside the menu doesn't highlight menu items nor sub menus:** This is actually a desired feature. Allowing the items to highlight on mouse hover would cause the entries to loose focus, resulting in the impossibility to keep typing text inside them and constantly forcing us to move the mouse cursor to regain focus."),
            "- **%s** %s" % (_("Task entries look wrong:"), _(
                # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                "Task entries on this applet have the ability to wrap its text in case one sets a fixed width for them. They also can be multi line ([[Shift]] + [[Enter]] inside an entry will create a new line). Some Cinnamon themes, like the default Mint-X family of themes, set a fixed width and a fixed height for entries inside menus. These fixed sizes makes it impossible to programmatically set a desired width for the entries (at least, I couldn't find a way to do it). And the fixed height doesn't allow the entries to expand, completely breaking the entries capability to wrap its text and to be multi line.")),
            "",
            "### %s" % _("This is how entries should look like"),
            "",
            utils.get_image_container(
                src="./assets/images/correct-entries-styling.png",
                alt=_("Correct entries styling")
            ),
            "",
            "### %s" % _("This is how entries SHOULD NOT look like"),
            "",
            utils.get_image_container(
                src="./assets/images/incorrect-entries-styling.png",
                alt=_("Incorrect entries styling")
            ),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("The only way to fix this (that I could find) is by editing the Cinnamon theme that one is using and remove those fixed sizes. The CSS selectors that needs to be edited are **.menu StEntry**, **.menu StEntry:focus**, **.popup-menu StEntry** and **.popup-menu StEntry:focus**. Depending on the Cinnamon version the theme was created for, one might find just the first two selectors or the last two or all of them. The CSS properties that need to be edited are **width** and **height**. They could be removed, but the sensible thing to do is to rename them to **min-width** and **min-height** respectively. After editing the theme's file and restarting Cinnamon, the entries inside this applet will look and work like they should."),
        ])
        ))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
