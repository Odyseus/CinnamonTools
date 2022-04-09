#!/usr/bin/env python3
"""See :any:`file_chooser_dialog`.
"""
import os
import sys

XLET_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, XLET_DIR)

from python_modules.file_chooser_dialog import cli


if __name__ == "__main__":
    sys.exit(cli())
