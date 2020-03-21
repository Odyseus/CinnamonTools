#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Bottle.py utilities.
"""
import os

try:
    from . import bottle
except (ImportError, SystemError):
    import bottle

bottle_app = bottle.Bottle()


_missing_psutil_msg = """Missing **psutil** module. Read the documentation.
This module is used to programmatically terminate the HTTP server.
Without this Python module, the server can only be stopped/restarted manually.
"""


class WebApp():
    """Base web server.

    Attributes
    ----------
    host : str
        The host name used by the web server.
    port : str
        The port number used by the web server.
    """

    def __init__(self, host, port):
        """Initialization.

        Parameters
        ----------
        host : str
            The host name used by the web server.
        port : str
            The port number used by the web server.
        """
        self.host = host
        self.port = port

    def run(self):
        """Run web application.
        """
        bottle_app.run(host=self.host, port=self.port)


def start_server(server_args):
    """Start HTTP server.

    Parameters
    ----------
    server_args : dict
        Server arguments.
    """
    os.chdir(server_args.get("www_root"))
    os.execv(server_args.get("web_app_path"), [" "] + [
        server_args.get("host"),
        server_args.get("port"),
        os.path.dirname(server_args.get("web_app_path"))
    ])


def stop_server(restart=False, server_args={}, logger=None):
    """Stop HTTP server.

    Parameters
    ----------
    restart : bool, optional
        Whether to start the server after being stopped.
    server_args : dict, optional
        Server arguments.
    logger : None, optional
        See :any:`LogSystem`.

    Returns
    -------
    None
        Stop execution.
    """
    try:
        import psutil
    except (ImportError, SystemError):
        logger.warning(_missing_psutil_msg)
        return

    # NOTE: Do not stop at the first occurrence of the application one is looking for;
    # always iterate through all processes and terminate all occurrences.
    # If the server is launched with different hosts/ports, one could end up
    # serving the same location through different hosts/ports. This is just a conjecture;
    # I didn't really test it, but it seems obvious at a glance.
    for proc in psutil.process_iter():
        try:
            # NOTE: Using proc.cmdline() to check the entire path because putil.name() NEVER
            # F*CKING gives a complete process name!!! FFS!!! I implemented the use of a f*cking
            # third-party module to simplify things, and I always end up eating the same sh*t!!!
            if server_args.get("web_app_path") in proc.cmdline():
                proc.terminate()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

    if restart:
        start_server(server_args)


def handle_server(action="", server_args={}, logger=None):
    """Handle HTTP server.

    Parameters
    ----------
    action : str, optional
        Any of the following: start/stop/restart.
    server_args : dict, optional
        Server arguments.
    logger : None, optional
        See :any:`LogSystem`.
    """
    if action == "start":
        start_server(server_args=server_args)
    elif action == "stop":
        stop_server(server_args=server_args, logger=logger)
    elif action == "restart":
        stop_server(restart=True, server_args=server_args, logger=logger)


if __name__ == "__main__":
    pass
