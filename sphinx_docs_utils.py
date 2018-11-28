#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Utilities to generate documentations with Sphinx.
"""
import os

from shutil import rmtree

from . import cmd_utils
from . import exceptions
from . import tqdm_wget
from .misc_utils import get_system_tempdir


def check_inventories_existence(update_inventories=False,
                                docs_sources_path="",
                                logger=None):
    """Check inventories existence. Download them if they don't exists.

    These inventory files are the ones used by the intersphinx Sphinx extension. Since
    I couldn't make the intersphinx_mapping option to download the inventory files
    automatically, I simply cut to the chase and did it myself.

    Parameters
    ----------
    update_inventories : bool
        Whether to force the update of the inventory files. Inventory files will be updated
        anyway f they don't exist.
    docs_sources_path : str, optional
        Path to the documentation source files that will be used to store the
        downloaded inventories.
    logger : object
        See <class :any:`LogSystem`>.

    Raises
    ------
    exceptions.KeyboardInterruption
        Halt execution on Ctrl + C press.

    Note
    ----
    I may need to implement the inventory_files_map variable as an argument so I can
    selectively use different inventories for specific documentations. As of now, Python
    inventory is enough.
    """
    inventory_files_map = [
        ("https://docs.python.org/3.5/objects.inv",
         os.path.join(docs_sources_path, "python-3.5-objects.inv"))
    ]

    logger.info("Checking existence of inventory files...")

    for url, downloaded_file in inventory_files_map:
        if update_inventories or not os.path.exists(downloaded_file):
            logger.info("Downloading inventory file...")
            logger.info("Download URL:")
            logger.info(url, date=False)
            logger.info("Download location")
            logger.info(downloaded_file, date=False)

            try:
                tqdm_wget.download(url, downloaded_file)
            except (KeyboardInterrupt, SystemExit):
                raise exceptions.KeyboardInterruption()
            except Exception as err:
                logger.error(err)
        else:
            logger.info("Inventory file exists:")
            logger.info(downloaded_file, date=False)


def generate_docs(root_folder="",
                  docs_src_path_rel_to_root="",
                  docs_dest_path_rel_to_root="docs",
                  apidoc_paths_rel_to_root=[],
                  doctree_temp_location_rel_to_sys_temp="",
                  ignored_modules=[],
                  generate_api_docs=False,
                  update_inventories=False,
                  force_clean_build=False,
                  build_coverage=True,
                  logger=None):
    """Build this application documentation.

    Parameters
    ----------
    root_folder : str, optional
        Path to the main folder that most paths should be relative to.
    docs_src_path_rel_to_root : str, optional
        Docs sources path relative to root_folder.
    docs_dest_path_rel_to_root : str, optional
        Built docs destination path relative to root_folder.
    apidoc_paths_rel_to_root : list, optional
        A list of tuples. Each tuple of length two contains the path to the Python modules
        folder at index zero from which to extract docstrings and the path to where to store
        the generated rst files at index one.
    doctree_temp_location_rel_to_sys_temp : str, optional
        Name of a temporary folder that will be used to create a path relative to the
        system temporary folder.
    ignored_modules : list, optional
        A list of paths to Python modules relative to the root_folder. These are ignored
        modules whose docstrings are a mess and/or are incomplete. Because such docstrings
        will produce hundred of annoying Sphinx warnings.
    generate_api_docs : bool
        If False, do not extract docstrings from Python modules.
    update_inventories : bool, optional
        Whether to force the update of the inventory files. Inventory files will be updated
        anyway f they don't exist.
    force_clean_build : bool, optional
        Remove destination and doctrees directories before building the documentation.
    build_coverage : bool, optional
        If True, build Sphinx coverage documents.
    logger : object
        See <class :any:`LogSystem`>.
    """
    doctree_temp_location = os.path.join(get_system_tempdir(),
                                         doctree_temp_location_rel_to_sys_temp)
    docs_sources_path = os.path.join(root_folder, docs_src_path_rel_to_root)
    docs_destination_path = os.path.join(root_folder, docs_dest_path_rel_to_root)

    check_inventories_existence(update_inventories, docs_sources_path, logger)

    if force_clean_build:
        rmtree(doctree_temp_location, ignore_errors=True)
        rmtree(docs_destination_path, ignore_errors=True)

    if generate_api_docs:
        commmon_args = ["--module-first", "--separate", "--private",
                        "--force", "--suffix", "rst", "--output-dir"]

        for rel_source_path, rel_destination_path in apidoc_paths_rel_to_root:
            apidoc_destination_path = os.path.join(root_folder, rel_destination_path)

            if force_clean_build:
                rmtree(apidoc_destination_path, ignore_errors=True)

            cmd_utils.run_cmd(["sphinx-apidoc"] + commmon_args + [
                apidoc_destination_path,
                os.path.join(root_folder, rel_source_path)
            ] + ignored_modules,
                stdout=None,
                stderr=None,
                cwd=root_folder)

    try:
        if build_coverage:
            cmd_utils.run_cmd(["sphinx-build", ".", "-b", "coverage", "-d", doctree_temp_location, "./coverage"],
                              stdout=None,
                              stderr=None,
                              cwd=docs_sources_path)
    finally:
        cmd_utils.run_cmd(["sphinx-build", ".", "-b", "html", "-d", doctree_temp_location,
                           docs_destination_path],
                          stdout=None,
                          stderr=None,
                          cwd=docs_sources_path)


def generate_man_pages(root_folder="",
                       docs_src_path_rel_to_root="",
                       docs_dest_path_rel_to_root="",
                       doctree_temp_location_rel_to_sys_temp="",
                       logger=None):
    """Generate man pages.

    Parameters
    ----------
    root_folder : str, optional
        Path to the main folder that most paths should be relative to.
    docs_src_path_rel_to_root : str, optional
        Docs sources path relative to root_folder.
    docs_dest_path_rel_to_root : str, optional
        Built docs destination path relative to root_folder.
    doctree_temp_location_rel_to_sys_temp : str, optional
        Name of a temporary folder that will be used to create a path relative to the
        system temporary folder.
    logger : object
        See <class :any:`LogSystem`>.
    """
    doctree_temp_location = os.path.join(get_system_tempdir(),
                                         doctree_temp_location_rel_to_sys_temp)
    docs_sources_path = os.path.join(root_folder, docs_src_path_rel_to_root)
    man_pages_destination_path = os.path.join(root_folder, docs_dest_path_rel_to_root)

    cmd_utils.run_cmd(["sphinx-build", ".", "-b", "man", "-d", doctree_temp_location,
                       man_pages_destination_path],
                      stdout=None,
                      stderr=None,
                      cwd=docs_sources_path)


if __name__ == "__main__":
    pass
