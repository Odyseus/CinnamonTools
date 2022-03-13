#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys

xlet_dir = os.getcwd()
xlet_slug = os.path.basename(xlet_dir)
repo_folder = os.path.normpath(os.path.join(xlet_dir, *([".."] * 2)))
app_folder = os.path.join(repo_folder, "__app__")

if app_folder not in sys.path:
    sys.path.insert(0, app_folder)


from python_modules.localized_help_creator import LocalizedHelpCreator
from python_modules.localized_help_creator import _


class Main(LocalizedHelpCreator):

    def __init__(self, *args):
        super().__init__(*args)

    def get_content_base(self, for_readme):
        return "\n".join([
            "## %s" % _("Description"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("This applet is a fork of [Mailnag](https://cinnamon-spices.linuxmint.com/applets/view/244) applet by [Hasan Yavuz](https://github.com/hyOzd) (a.k.a. hyOzd)."),
            "",
            "## %s" % _("Differences with the original applet"),
            "",
            "- %s" % _("Added keyboard shortcut to be able to open/close the menu."),
            "- %s" % _("Added option to keep just one sub-menu open."),
            "- %s" % _("Removed obsolete code. Mostly features that doesn't exist anymore in modern JavaScript."),
            "- %s" % _("Added more notification options that complements with the options existing in Mailnag's."),
            "",
            "## " + _("Dependencies"),
            "",
            "- **mailnag:** " + \
            _("Mailnag is a daemon program that checks POP3 and IMAP servers for new mail."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("Detailed installation instructions can be found on [Mailnag's repository](https://github.com/pulb/mailnag)."),
            _("Cinnamon needs to be restarted after installing Mailnag if the applet was already placed in a panel."),
            "",
            "## " + _("Usage"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("To configure Mailnag, launch its configuration program found in the applications menu, or from this applet context menu or by running the `mailnag-config` command."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _(
                "E-mail accounts can be directly added through Mailnag's configuration program or automatically detected by installing [Mailnag GNOME Online Accounts plugin](https://github.com/pulb/mailnag-goa-plugin)."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("The Mailnag plug-in called **DBus Service** needs to be enabled for this applet to be able to use the daemon."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("Mailnag can be configured further by editing its configuration file at **~/.config/mailnag/mailnag.cfg**."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("It is recommended to install the Mailnag's optional dependency package `gir1.2-gnomekeyring-1.0` (or whatever the package is called in a given distribution) so Mailnag uses the keyring to store passwords."),
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            "- %s" % _("The Mailnag's **LibNotify Notifications** plug-in cannot add notification actions such as mark mails as read or open mail client directly from the notification. These features are available only for Gnome (a limitation hard-coded into the plug-in itself). This applet implements its own configurable notifications to bypass such limitations. Needless to say, if one choses to use the notifications provided by this applet, the **LibNotify Notifications** plug-in must be disabled to avoid receiving duplicated notifications."),
            "",
        ])

    def get_content_extra(self):
        return ""

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


def main():
    m = Main(xlet_dir, xlet_slug)
    return m.start()


if __name__ == "__main__":
    sys.exit(main())
