#!/usr/bin/python3
# -*- coding: utf-8 -*-
import argparse
import gettext
import os

HOME = os.path.expanduser("~")

gettext.bindtextdomain("{{UUID}}", HOME + "/.local/share/locale")
gettext.textdomain("{{UUID}}")
_ = gettext.gettext


def main():
    parser = argparse.ArgumentParser()

    group = parser.add_mutually_exclusive_group()
    group.add_argument("--check-dependencies", dest="check_dependencies", action="store_true")
    group.add_argument("--strip-markup", dest="strip_markup")

    args = parser.parse_args()

    if args.check_dependencies:
        import subprocess

        msg = "<!--SEPARATOR-->"

        try:
            subprocess.check_call(["xsel", "--version"])
        except OSError:
            # TO TRANSLATORS: "xsel" is a command, do not translate.
            msg += "# %s\n" % _("xsel command not found!!!")

        try:
            subprocess.check_call(["trans", "-V"])
        except OSError:
            # TO TRANSLATORS: "trans" is a command and "PATH" is an
            # environmental variable, do not translate.
            msg += "# %s\n" % _("trans command not found or it isn't in your PATH!!!")

        print(msg)
    elif args.strip_markup:
        from python_modules.html_tags_stripper import strip_html_tags

        try:
            print(strip_html_tags(str(args.strip_markup)))
        except Exception as err:
            print(err)


if __name__ == "__main__":
    main()
