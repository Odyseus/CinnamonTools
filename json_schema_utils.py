#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Utilities to validate data from JSON schemas.
"""
from collections import Callable
from copy import deepcopy

from . import shell_utils

from .exceptions import ExceptionWhitoutTraceBack
from .jsonschema import Draft4Validator as schema_validator
from .jsonschema import draft4_format_checker as format_checker


_extra_types = {
    "custom_callable": Callable,
    "custom_tuple": tuple
}


class SchemaValidationError(ExceptionWhitoutTraceBack):
    """SchemaValidationError
    """

    def __init__(self, msg):
        """Initialization.

        Parameters
        ----------
        msg : str
            Message that the exception should display.
        """
        super().__init__(msg)


def validate(instance, schema,
             raise_error=True,
             error_message_extra_info="",
             error_header="Data didn't pass validation!",
             extra_types={},
             logger=None):
    """Validate data using a JSON schema.

    Parameters
    ----------
    instance : dict|list
        The data to validate.
    schema : dict
        The schema to use for validation.
    raise_error : bool, optional
        Whether or not to raise an exception.
    error_message_extra_info : str, optional
        Extra information to display wehn raising a :any:`SchemaValidationError` error.
    error_header : str, optional
        Text to be displayed as "CLI header".
    extra_types : dict, optional
        Extra type checks.
    logger : object
        See :any:`LogSystem`.

    Raises
    ------
    SchemaValidationError
        See :any:`SchemaValidationError`.

    Returns
    -------
    int
        1 (one) if errors were found. 0 (zero) if no errors were found.
        It only returns if raise_error is False.
    """
    # Just in case, use a copy of instance to validate, not the original.
    try:
        instance_copy = deepcopy(instance)
    except Exception as err:
        instance_copy = instance
        logger.warning(err)

    v = schema_validator(schema,
                         types={**extra_types, **_extra_types},
                         format_checker=format_checker)
    errors = sorted(v.iter_errors(instance_copy), key=lambda e: e.path)

    if errors:
        logger.error("**%s**" % shell_utils.get_cli_header(error_header), date=False, to_file=False)

        for error in errors:
            logger.info(shell_utils.get_cli_separator("-"), date=False)

            abs_path = " > ".join([str(key) for key in list(error.absolute_path)])

            if bool(abs_path):
                logger.info("**Index or property path:** %s" % str(abs_path), date=False)

            logger.info(error.message, date=False)

            if error.context:
                for e in error.context:
                    logger.info(e.message, date=False)

            extra_info_keys = ["title", "description", "default"]
            error_schema = error.schema

            if any(key in error_schema for key in extra_info_keys):
                logger.info("**Extra information**", date=False)

                for x in extra_info_keys:
                    if error_schema.get(x):
                        logger.info("**%s:** %s" %
                                    (x.capitalize(), error_schema.get(x)), date=False)

        logger.info(shell_utils.get_cli_separator("-"), date=False)

        error_message = "\n".join(["%sTo continue, all errors must be fixed." %
                                   ("" if raise_error else "**SchemaValidationError:** "),
                                   "**Total errors found:** %s" % str(len(errors)),
                                   error_message_extra_info])
        if raise_error:
            raise SchemaValidationError(error_message)
        else:
            logger.error(error_message, date=False)
            return 1

    return 0


if __name__ == "__main__":
    pass
