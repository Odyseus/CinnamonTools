#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Git utilities.
"""
from subprocess import call

from . import prompts


def manage_repo(mechanism, action, subtrees=[], cwd=None, logger=None):
    """Manage repository.

    Perform some complex tasks on a repository. Mostly sub-trees and sub-modules initialization.

    Parameters
    ----------
    mechanism : str
        Which "mechanism" to work with ("submodule" or "subtree").
    action : str
        Which action to perform ("init" or "update").
    subtrees : list, optional
        A list of dictionaries representing sub-tree options.

        - **remote_name**: The sub-tree remote name.
        - **remote_url**: The sub-tree remote URL.
        - **path**: Path inside the parent repository where the sub-tree will be stored.
    cwd : None, optional
        Path to working directory. It should be a folder that belongs to a Git repository.
    logger : object
        See <class :any:`LogSystem`>.
    """
    commands = []

    if mechanism == "submodule":
        if action == "init":
            commands.append("git submodule update --init")
        elif action == "update":
            commands.append("git submodule update --remote --merge")
    elif mechanism == "subtree":
        for sub_tree in subtrees:
            if action == "init":
                commands.append("git remote add -f {remote_name} {remote_url}".format(
                    remote_name=sub_tree["remote_name"],
                    remote_url=sub_tree["remote_url"]
                ))
            elif action == "update":
                commands.append("git pull --strategy-option=subtree={path} {remote_name} master".format(
                    path=sub_tree["path"],
                    remote_name=sub_tree["remote_name"]
                ))

    if commands:
        logger.info("The following command/s will be executed:")

        for cmd in commands:
            logger.info(cmd, date=False)

        print()

        if prompts.confirm(prompt="Proceed?", response=False):
            for cmd in commands:
                call(cmd, shell=True, cwd=cwd)


if __name__ == "__main__":
    pass
