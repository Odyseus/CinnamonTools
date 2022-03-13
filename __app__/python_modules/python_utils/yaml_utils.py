#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""
"""
from collections import OrderedDict

from . import yaml

try:
    from .yaml import CSafeDumper as SafeDumper
    from .yaml import CSafeLoader as SafeLoader
except ImportError:
    from .yaml import SafeDumper
    from .yaml import SafeLoader


def load(stream, **kwargs):
    """Summary

    Parameters
    ----------
    stream : str, byte, object
        The YAML data to parse into a Python object. It could be a string,
        bytes or a file object.

    Returns
    -------
    object
        A Python object.
    """
    return yaml.load(stream, Loader=SafeLoader, **kwargs)


def dump(data, stream=None, **kwargs):
    """Summary

    Parameters
    ----------
    data : object
        Description
    stream : object, None, optional
        Description

    Returns
    -------
    str, byte, None
        The serialized data if ``stream`` is ``None``.
    """
    return yaml.dump(data, stream, Dumper=SafeDumper, **kwargs)


def ordered_load(stream, Loader=SafeLoader, object_pairs_hook=OrderedDict):
    class OrderedLoader(Loader):
        pass

    def construct_mapping(loader, node):
        loader.flatten_mapping(node)
        return object_pairs_hook(loader.construct_pairs(node))

    OrderedLoader.add_constructor(
        yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
        construct_mapping
    )

    return yaml.load(stream, OrderedLoader)


def ordered_dump(data, stream=None, Dumper=SafeDumper, **kwargs):
    class OrderedDumper(Dumper):
        pass

    def _dict_representer(dumper, data):
        return dumper.represent_mapping(
            yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
            data.items()
        )

    OrderedDumper.add_representer(OrderedDict, _dict_representer)

    return yaml.dump(data, stream, OrderedDumper, **kwargs)


if __name__ == "__main__":
    pass
