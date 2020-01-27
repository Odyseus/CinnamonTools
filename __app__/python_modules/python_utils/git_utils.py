#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Git utilities.
"""
from subprocess import CalledProcessError

from . import cmd_utils
from . import prompts
from . import shell_utils


def manage_repo(mechanism, action, subtrees=[], do_not_confirm=False,
                cwd=None, dry_run=False, logger=None):
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

        - **url**: The sub-tree repository URL.
        - **path**: Path inside the parent repository where the sub-tree will be stored.
        - **ref**: The sub-tree repository remote reference (Default: master).
    do_not_confirm : bool, optional
        Do not ask for confirmation before executing commands.
    cwd : None, optional
        Path to working directory. It should be a folder that belongs to a Git repository.
    dry_run : bool, optional
        Do not execute the final commads, just log them.
    logger : object
        See :any:`LogSystem`.

    Note
    ----
    Sub-modules are initialized or updated *in-bulk* with just one command. Sub-trees are
    initialized or updated with one command per sub-tree repository.
    """
    commands = []

    if mechanism == "submodule":
        commands.append("git submodule update %s" %
                        ("--init" if action is "init" else "--remote --merge"))
    elif mechanism == "subtree":
        for sub_tree in subtrees:
            sub_ref = sub_tree.get("ref", "master")
            commit_message = "Merge ref. '{ref}' of {sub_url}".format(
                ref=sub_ref,
                sub_url=sub_tree["url"]
            )
            commands.append("git subtree {cmd} {msg} --prefix {prefix} {url} {ref} --squash".format(
                cmd="add" if action is "init" else "pull",
                msg="" if action is "init" else '"-m %s"' % commit_message,
                prefix=sub_tree["path"],
                url=sub_tree["url"],
                ref=sub_ref
            ))

    if commands:
        if do_not_confirm or prompts.confirm(prompt="Proceed?", response=False):
            for cmd in commands:
                logger.info(shell_utils.get_cli_separator("-"), date=False)

                if dry_run:
                    logger.log_dry_run("**Command that will be executed:**\n%s" % cmd)
                    logger.log_dry_run("**Command will be executed at:**\n%s" % cwd)
                else:
                    try:
                        logger.info("**Executing command:**\n%s" % cmd)
                        cmd_utils.run_cmd(cmd, stdout=None, stderr=None,
                                          check=True, shell=True, cwd=cwd)
                    except CalledProcessError as err:
                        logger.error(err)
                        continue


if __name__ == "__main__":
    pass
