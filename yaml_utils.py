#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""YAML utils.

Note
----
The PyYaml module has not one single docstring anywhere! A total and absolute waste use of
the only programing language in existence that has native documentation capabilities! And its
manually written documentation (¬¬) is perfect for explaining absolutely nothing with a trillion
words! Since I don't have a f*cking magic ball to divine what the f*ck each thing is or does, the
incomplete docstrings on this module can stay as they are.
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
    """Parse the first YAML document in a stream and produce the corresponding Python object.

    Parameters
    ----------
    stream : str, byte, object
        The YAML data to parse into a Python object. It could be a string,
        bytes or a file object.
    **kwargs
        Extra keyword arguments to pass to ``yaml.load``.

    Returns
    -------
    object
        A Python object.
    """
    return yaml.load(stream, Loader=SafeLoader, **kwargs)


def dump(data, stream=None, **kwargs):
    """Serialize a Python object into a YAML stream.

    Parameters
    ----------
    data : object
        Description
    stream : object, None, optional
        Description
    **kwargs
        Extra keyword arguments to pass to ``yaml.dump``.

    Returns
    -------
    str, byte, None
        The serialized data if ``stream`` is ``None``.
    """
    return yaml.dump(data, stream, Dumper=SafeDumper, **kwargs)


class OrderedLoader(SafeLoader):
    """Ordered YAML loader.
    """
    pass


def _construct_mapping(loader, node):
    """Construct mapping.

    Parameters
    ----------
    loader : TYPE
        Description
    node : TYPE
        Description

    Returns
    -------
    OrderedDict
        Description
    """
    loader.flatten_mapping(node)
    return OrderedDict(loader.construct_pairs(node))


OrderedLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
    _construct_mapping
)


class OrderedDumper(SafeDumper):
    """Ordered YAML dumper.
    """
    pass


def _dict_representer(dumper, data):
    """Dict representer.

    Parameters
    ----------
    dumper : TYPE
        Description
    data : TYPE
        Description

    Returns
    -------
    TYPE
        Description
    """
    return dumper.represent_mapping(
        yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
        data.items()
    )


OrderedDumper.add_representer(OrderedDict, _dict_representer)


def ordered_load(stream):
    """Same as :any:`yaml_utils.load`.

    Parameters
    ----------
    stream : str, byte, object
        The YAML data to parse into a Python object. It could be a string,
        bytes or a file object.
    **kwargs
        Extra keyword arguments to pass to ``yaml.load``.

    Returns
    -------
    object
        A Python object.
    """
    return yaml.load(stream, Loader=OrderedLoader)


def ordered_dump(data, stream=None, **kwargs):
    """Same as :any:`yaml_utils.dump`.

    Parameters
    ----------
    data : object
        Description
    stream : object, None, optional
        Description
    **kwargs
        Extra keyword arguments to pass to ``yaml.dump``.

    Returns
    -------
    str, byte, None
        The serialized data if ``stream`` is ``None``.
    """
    return yaml.dump(data, stream=stream, Dumper=OrderedDumper, **kwargs)


if __name__ == "__main__":
    pass
