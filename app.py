#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

# NOTE: Keep this check here to avoid triggering syntax errors when importing modules and
# to display a helpful message instead.
if sys.version_info < (3, 7):
    msg = r'[1;31m WrongPythonVersion: Minimum Python version supported: 3.7 [0m'
    raise SystemExit(msg)

from __app__.python_modules.cli import main

if __name__ == "__main__":
    if len(sys.argv) == 1:
        sys.argv.append("--help")

    sys.exit(main())
