#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""Helper script to bypass pkexec limitations.

    ....................../´¯/)
    ....................,/¯../
    .................../..../
    ............./´¯/'...'/´¯¯`·¸
    ........../'/.../..../......./¨¯\
    ........('(...´...´.... ¯~/'...')
    .........\.................'...../
    ..........''...\.......... _.·´
    ............\..............(
    ..............\.............\...

Attributes
----------
env : dict
    Copy of the system's environment to be passed to Popen.
"""

import os
import sys

from subprocess import Popen

env = os.environ.copy()


if __name__ == "__main__":
    try:
        po = Popen(
            " ".join(sys.argv[1:]),
            shell=True,
            env=env
        )
        po.communicate()
        raise SystemExit()
    except Exception as err:
        raise err
