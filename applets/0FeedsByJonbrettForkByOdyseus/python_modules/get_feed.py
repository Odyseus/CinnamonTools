#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""
feedparser documentation:
    https://pypi.python.org/pypi/feedparser
    https://pythonhosted.org/feedparser/
"""
import json
import sys
import time

try:
    import feedparser
except (SystemError, ImportError):
    print("feedparser_error")
    raise SystemExit()

# NOTE: Just a dummy function so the strings called by it are detected by gettext.
# These strings are actually localized on the JavaScript side.
def _(msg):
    return msg


if __name__ == "__main__":
    rss = sys.argv[1]

    info = {}

    try:
        parser = feedparser.parse(rss)

        if "status" in parser:
            if parser.status == 301:
                info["redirected_url"] = parser.href
            elif parser.status == 401:
                raise Exception(_("Feed is password protected and not supported at this time."))
            elif parser.status == 410:
                raise Exception(_("Feed marked Gone, please remove and stop trying."))

        feed = parser.feed

        if "title" in feed:
            info["title"] = feed["title"]
        else:
            info["title"] = rss

        if "description" in feed:
            info["description"] = feed["description"]
        else:
            info["description"] = feed.get("subtitle", info["title"])

        info["link"] = feed.get("link", rss)
        info["lastcheck"] = int(time.time() * 1000)
        info["entries"] = []

        for entry in parser["entries"]:
            entry_info = {}
            # Invalid feeds will be excluded
            try:
                # guid is optional, so use link if it's not given
                if "guid" in entry:
                    entry_info["id"] = entry["guid"]
                else:
                    entry_info["id"] = entry["link"]

                entry_info["title"] = entry["title"]
                entry_info["link"] = entry["link"]
                entry_info["description"] = entry.get("description", entry_info["title"])

                if "pubDate" in entry:
                    entry_info["pubDate"] = entry["pubDate"]
                elif "published" in entry:
                    entry_info["pubDate"] = entry["published"]
                else:
                    entry_info["pubDate"] = None

                info["entries"].append(entry_info)
            except Exception as err:
                sys.stderr.write(str(err))
    except Exception as err:
        info["exception"] = str(err)

    # This print statement is the return value to the JavaScript code.
    print(json.dumps(info))
