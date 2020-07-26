#!/usr/bin/python3
# -*- coding: utf-8 -*-

open_weather_map = [
    "ar",
    "bg",
    "ca",
    "cz",
    "de",
    "el",
    "en",
    "fa",
    "fi",
    "fr",
    "gl",
    "hr",
    "hu",
    "it",
    "ja",
    "kr",
    "la",
    "lt",
    "mk",
    "nl",
    "pl",
    "pt",
    "ro",
    "ru",
    "se",
    "sk",
    "sl",
    "es",
    "tr",
    "ua",
    "vi",
    "zh_cn",
    "zh_tw",
]

weather_bit = [
    "ar",
    "az",
    "be",
    "bg",
    "bs",
    "ca",
    "cz",
    "da",
    "de",
    "el",
    "en",
    "et",
    "fi",
    "fr",
    "hr",
    "hu",
    "id",
    "is",
    "it",
    "kw",
    "lt",
    "nb",
    "nl",
    "pl",
    "pt",
    "ro",
    "ru",
    "sk",
    "sl",
    "sr",
    "sv",
    "tr",
    "uk",
    "zh",
    "zh-tw"
]

all = set(open_weather_map + weather_bit)


if __name__ == "__main__":
    for lang in all:
        suffix = " %s%s" % (
            ("(O)" if lang in open_weather_map else ""),
            ("(W)" if lang in weather_bit else "")
        )
        print('"%s",' % (lang + suffix))
