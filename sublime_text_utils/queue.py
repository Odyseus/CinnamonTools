#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Queue.

Attributes
----------
MYPY : bool
    MyPy module utilization(?).
timers : dict
    Map from key to :any:`threading.Timer` objects.
"""
import threading

MYPY = False
if MYPY:
    from typing import Callable, Dict, Hashable

    Key = Hashable


timers = {}  # type: Dict[Key, threading.Timer]


def debounce(callback, delay, key):
    """Execute a method after a delay.

    Parameters
    ----------
    callback : method
        Method to execute.
    delay : int
        Execution delay.
    key : str
        Timer registration key.

    Returns
    -------
    threading.Timer
        Instantiated timer.
    """
    # type: (Callable[[], None], float, Key) -> threading.Timer
    try:
        timers[key].cancel()
    except KeyError:
        pass

    timers[key] = timer = threading.Timer(delay / 1000, callback)
    timer.start()
    return timer


def cleanup(key):
    """Unregister a timer.

    Parameters
    ----------
    key : str
        Timer registration key.
    """
    # type: (Key) -> None
    try:
        timers.pop(key).cancel()
    except KeyError:
        pass


def unload():
    """Unregister all timers.

    Returns
    -------
    None
        Continue loop(?).
    """
    while True:
        try:
            _key, timer = timers.popitem()
        except KeyError:
            return
        else:
            timer.cancel()


if __name__ == "__main__":
    pass
