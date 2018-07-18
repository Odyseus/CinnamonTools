#!/usr/bin/python3
# -*- coding: utf-8 -*-

import sys
import argparse
import csv
import gi
import json
import os
import uuid
import xml.etree.ElementTree as et

gi.require_version("Gtk", "3.0")
from gi.repository import Gtk

DEFAULT_FEEDS = {
    "profiles": [{
        "name": "Default",
        "interval": 30,
        "feeds": [{
            "id": "",
            "title": "Cheatography",
            "url": "https://www.cheatography.com/explore/new/rss/",
            "enabled": True,
            "notify": True,
            "interval": 30,  # Not implemented.
            "showreaditems": False,
            "showimage": False  # Not implemented.
        }, {
            "id": "",
            "title": "DistroWatch",
            "url": "https://distrowatch.com/news/dw.xml",
            "enabled": True,
            "notify": True,
            "interval": 30,  # Not implemented.
            "showreaditems": False,
            "showimage": False  # Not implemented.
        }, {
            "id": "",
            "title": "gHacks",
            "url": "https://www.ghacks.net/feed/",
            "enabled": True,
            "notify": True,
            "interval": 30,  # Not implemented.
            "showreaditems": False,
            "showimage": False  # Not implemented.
        }, {
            "id": "",
            "title": "Linux Mint Blog",
            "url": "https://www.linuxmint.com/planet/rss20.xml",
            "enabled": True,
            "notify": True,
            "interval": 30,  # Not implemented.
            "showreaditems": False,
            "showimage": False  # Not implemented.
        }]
    }]
}


class ConfigFileManager:
    """
        Class used to manage the new json multi-profile config file.
    """

    def __init__(self, filename, profile_name):
        """
            This requires the filename that is being read along
            with the profile name to bind to the feed array
        """
        self.feeds = Gtk.ListStore(str, bool, str, str, bool, int, bool, bool)
        self.profiles = Gtk.ListStore(str, str)
        self.__filename = filename
        self.__json = ConfigFileManager.read(filename)
        self.set_profile(profile_name)

    def set_profile(self, profile_name):
        """
            Method used to change which profile list is being bound to the feeds array
        """
        self.__profile_selected = profile_name
        self.__load_feeds()
        for iid, row in enumerate(self.profiles):
            if row[0] == profile_name:
                return iid
        # Not found (might indicate bigger issues?)
        return -1

    def get_profile(self):
        """
            Returns the current selected profile name
        """
        return self.__profile_selected

    def get_profile_id(self):
        """
            Returns the current selected profile ID
        """
        for iid, row in enumerate(self.profiles):
            if row[0] == self.__profile_selected:
                return iid
        # Not found (might indicate bigger issues?)
        return -1

    def save(self):
        """
            Convert the array back into feeds profile in the config file and then save / export it
        """
        for profile in self.__json["profiles"]:
            if profile["name"] == self.__profile_selected:
                # Remove the feed
                profile.pop("feeds")
                # add a new empty section
                profile["feeds"] = []

                # Add all the feeds back in
                for feed in self.feeds:
                    profile["feeds"].append({
                        "id": feed[0],
                        "enabled": feed[1],
                        "url": feed[2],
                        "title": feed[3],
                        "notify": feed[4],
                        "interval": feed[5],
                        "showreaditems": feed[6],
                        "showimage": feed[7]})

        ConfigFileManager.write(self.__filename, self.__json)

    def add_profile(self, new_name):
        """
            Add a new profile (if doesnt exist) and switch the profile to it
        """
        # Check if name is already in list of profiles
        if not self.__profile_exists(new_name):
            # Add new profile
            self.__json["profiles"].append({
                "name": new_name,
                "interval": 30,
                "feeds": []})

        return self.set_profile(new_name)

    def get_profile_name(self, index):
        """
            Get the name of an profile by index in profile array
        """
        return self.profiles[index][0]

    def __profile_exists(self, name):
        """
            Check if the profile already exists
        """
        for profile in self.__json["profiles"]:
            if profile["name"] == name:
                return True
        return False

    def __load_feeds(self):
        """
            This will parse the loaded json file and populate the profiles and feeds arrays
        """
        # reset the lists
        self.feeds = Gtk.ListStore(str, bool, str, str, bool, int, bool, bool)
        self.profiles = Gtk.ListStore(str, str)

        # Populate the lists.
        for profile in self.__json["profiles"]:
            self.profiles.append([profile["name"], profile["name"]])
            if profile["name"] == self.__profile_selected:
                for feed in profile["feeds"]:
                    self.feeds.append([
                        feed["id"],
                        feed["enabled"],
                        feed["url"],
                        feed["title"],
                        feed["notify"],
                        feed["interval"],
                        feed["showreaditems"],
                        feed["showimage"]])

    def import_opml_file(self, file_name):
        """
            Reads feeds list from an OPML file
        """
        cnt = 0
        tree = et.parse(file_name)
        root = tree.getroot()
        for outline in root.findall('.//outline[@type="rss"]'):
            url = outline.attrib.get("xmlUrl", "")
            try:
                title = outline.attrib.get("text", "")
            except Exception:
                title = ""

            self.feeds.append([
                ConfigFileManager.get_new_id(),
                False,
                url,
                title,
                True,
                30,
                False,
                False])

            cnt += 1
        return cnt

    def export_feeds(self, output_name):
        """
            Writes the selected feeds array to a file.
            Note that the ID is not exported, it is created on import.
        """
        if len(self.feeds) > 0:
            with open(output_name, mode="w") as file:
                file.write("### feeds export v=1.0\n")
                filewriter = csv.writer(file, quoting=csv.QUOTE_NONNUMERIC)

                for feed in self.feeds:
                    filewriter.writerow(feed[1:])

    def import_feeds(self, input_name):
        """
            Import a file in the feeds csv format.
        """
        cnt = 0

        with open(input_name, mode="r") as file:
            header = file.readline()
            if header != "### feeds export v=1.0\n":
                raise Exception(
                    "Invalid file, must have a first line matching: ### feeds export v=1.0")

            filereader = csv.reader(file)

            for line in filereader:
                url = line[1]
                title = line[2]

                self.feeds.append(
                    [ConfigFileManager.get_new_id()] + [self.__to_bool(line[0]),
                                                        url,
                                                        title,
                                                        self.__to_bool(line[3]),
                                                        int(line[4]),
                                                        self.__to_bool(line[5]),
                                                        self.__to_bool(line[6])])
                cnt += 1
        return cnt

    @classmethod
    def __to_bool(cls, val):
        return val.lower() == "true"

    @staticmethod
    def read(file_name):
        """
            Returns the config.json file or creates a new one with
            default values if it does not exist
        """
        try:
            with open(file_name, mode="r") as json_file:
                json_obj = json.load(json_file)
        except FileNotFoundError:
            # No file found, return default values # everything else throws.
            json_obj = DEFAULT_FEEDS
            # Populate the UUIDs
            for profile in json_obj["profiles"]:
                if profile["name"].lower() == "default":
                    for feed in profile["feeds"]:
                        # This unique ID is the identifier for this feed for life
                        feed["id"] = ConfigFileManager.get_new_id()
            # Create the UUID folder if it does not exist.
            path = os.path.dirname(file_name)
            if not os.path.exists(path):
                os.makedirs(path)

            ConfigFileManager.write(file_name, json_obj)

        return json_obj

    @staticmethod
    def write(jsonfile, json_obj):
        """
            Takes a passed in json object and writes the file to disk
        """
        with open(jsonfile, mode="w", encoding="utf-8") as file:
            content = json.dumps(json_obj, ensure_ascii=False)
            file.write(content)

    @staticmethod
    def get_new_id():
        """
            Common method used to return a unique id in a string format.
        """
        return str(uuid.uuid4())

    @staticmethod
    def update_redirected_feed(config_file, profile_name, current_url, redirected_url):
        """
            This static method will change a feed to an new updated current_url
        """
        feeds = ConfigFileManager.read(config_file)
        # Find the url to update
        for profile in feeds["profiles"]:
            if profile["name"] == profile_name:
                for feed in profile["feeds"]:
                    if feed["url"] == current_url:
                        feed["url"] = redirected_url
        # Save the changes back out.
        ConfigFileManager.write(filename, feeds)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("filename", help="Settings filename including path.")
    parser.add_argument("--profile", help="Instance name to update the redirected url.")
    parser.add_argument("--oldurl", help="URL to be updated.")
    parser.add_argument("--newurl", help="New URL to be used.")

    args = parser.parse_args()

    filename = args.filename

    if args.profile and args.oldurl and args.newurl:
        oldurl = args.oldurl
        newurl = args.newurl
        profile = args.profile
        try:
            ConfigFileManager.update_redirected_feed(filename, profile, oldurl, newurl)
        except Exception as e:
            sys.stderr.write("Error updating feed\n" + e + "\n")

    elif args.profile or args.oldurl or args.newurl:
        raise "--profile, --oldurl AND --newurl are required to redirect to a new url."
    else:
        jsonfile = ConfigFileManager.read(filename)
        print(json.dumps(jsonfile))
