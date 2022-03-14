#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Events.

Attributes
----------
listeners : collections.defaultdict
    Registered listeners storage.
map_fn_to_topic : dict
    Registered functions storage.
"""
import traceback

from collections import defaultdict


listeners = defaultdict(set)


def subscribe(topic, fn):
    """Register event.

    Parameters
    ----------
    topic : str
        Event name.
    fn : method
        Method to register.
    """
    listeners[topic].add(fn)


def unsubscribe(topic, fn):
    """Unregister event.

    Parameters
    ----------
    topic : str
        Event name.
    fn : method
        Method to unregister.
    """
    try:
        listeners[topic].remove(fn)
    except KeyError:
        pass


def broadcast(topic, payload={}):
    """Emit event.

    Parameters
    ----------
    topic : srt
        Event name.
    payload : dict, optional
        Parameters passed to executed method.
    """
    for fn in listeners.get(topic, []):
        try:
            fn(**payload)
        except Exception:
            traceback.print_exc()


map_fn_to_topic = {}


def on(topic):
    """Event registration decorator.

    Parameters
    ----------
    topic : str
        Event name.

    Returns
    -------
    method
        Decorator function.
    """
    def inner(fn):
        """Decorator.

        Parameters
        ----------
        fn : method
            Method to execute.

        Returns
        -------
        method
            Method to execute.
        """
        subscribe(topic, fn)
        map_fn_to_topic[fn] = topic
        return fn

    return inner


def off(fn):
    """Remove event.

    Parameters
    ----------
    fn : method
        Method to unregister.
    """
    topic = map_fn_to_topic.get(fn, None)
    if topic:
        unsubscribe(topic, fn)


if __name__ == "__main__":
    pass
