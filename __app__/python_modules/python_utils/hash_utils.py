#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Common utilities to get files/directories hashes.
"""

import hashlib
import os

HASH_FUNCS = {
    "md5": hashlib.md5,
    "sha1": hashlib.sha1,
    "sha256": hashlib.sha256,
    "sha512": hashlib.sha512
}

blocksize = 128 * 1024


def dir_hash(dirname, hashfunc="sha256", followlinks=False):
    hash_func = HASH_FUNCS.get(hashfunc)

    if not hash_func:
        raise NotImplementedError("{} not implemented.".format(hashfunc))

    hashvalues = []

    for root, dirs, files in os.walk(dirname, topdown=True, followlinks=followlinks):
        hashvalues.extend(
            [file_hash(os.path.join(root, f), hasher=hash_func) for f in sorted(files)]
        )

    return _reduce_hash(hashvalues, hash_func)


def file_hash(filepath, hashfunc="sha256", hasher=None):
    h = hasher() if hasher is not None else HASH_FUNCS.get(hashfunc)()

    if not h:
        raise NotImplementedError("{} not implemented.".format(hashfunc))

    with open(filepath, "rb", buffering=0) as f:
        for b in iter(lambda: f.read(blocksize), b""):
            h.update(b)

    return h.hexdigest()


def _reduce_hash(hashlist, hashfunc):
    h = hashfunc()

    for hashvalue in sorted(hashlist):
        h.update(hashvalue.encode("utf-8"))

    return h.hexdigest()


if __name__ == "__main__":
    pass
