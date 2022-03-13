#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Strip HTML tags from text.

Source: https://stackoverflow.com/a/925630 and https://stackoverflow.com/a/11063816
"""
from html.parser import HTMLParser


class MLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.fed = []

    def handle_data(self, d):
        self.fed.append(d)

    def get_data(self):
        return "".join(self.fed)


def strip_html_tags(html):
    s = MLStripper()
    s.feed(html)

    return s.get_data()


if __name__ == "__main__":
    pass
