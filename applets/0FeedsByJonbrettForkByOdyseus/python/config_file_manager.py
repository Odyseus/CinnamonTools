#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Summary

Attributes
----------
DEFAULT_FEEDS : dict
    List of default feeds.
"""

import argparse
import csv
import gi
import json
import os
import sys
import uuid
import xml.etree.ElementTree as et

gi.require_version("Gtk", "3.0")

from gi.repository import Gtk

DEFAULT_FEEDS = {
    "profiles": [{
        "name": "Default",
        "interval": 30,
        "feeds": [{
            "enabled": True,
            "interval": 30,  # TODO: Not implemented.
            "id": "",
            "showimage": False,  # TODO: Not implemented.
            "title": "Cheatography",
            "notify": True,
            "showreaditems": False,
            "url": "https://www.cheatography.com/explore/new/rss/"
        }, {
            "enabled": True,
            "interval": 30,  # TODO: Not implemented.
            "id": "",
            "showimage": False,  # TODO: Not implemented.
            "title": "DistroWatch",
            "notify": True,
            "showreaditems": False,
            "url": "https://distrowatch.com/news/dw.xml"
        }, {
            "enabled": True,
            "interval": 30,  # TODO: Not implemented.
            "id": "",
            "showimage": False,  # TODO: Not implemented.
            "title": "gHacks",
            "notify": True,
            "showreaditems": False,
            "url": "https://www.ghacks.net/feed/"
        }, {
            "enabled": True,
            "interval": 30,  # TODO: Not implemented.
            "id": "",
            "showimage": False,  # TODO: Not implemented.
            "title": "Linux Mint Blog",
            "notify": True,
            "showreaditems": False,
            "url": "https://www.linuxmint.com/planet/rss20.xml"
        }]
    }, {
        "name": "StackExchange",
        "interval": 300,
        "feeds": [{
            "enabled": True,
            "interval": 5,  # TODO: Not implemented.
            "title": "StackOverflow - Linux",
            "showimage": False,  # TODO: Not implemented.
            "id": "",
            "notify": True,
            "showreaditems": False,
            "url": "https://stackoverflow.com/feeds/tag/linux"
        }, {
            "enabled": True,
            "interval": 5,  # TODO: Not implemented.
            "title": "StackOverflow - JavaScript",
            "showimage": False,  # TODO: Not implemented.
            "id": "",
            "notify": True,
            "showreaditems": False,
            "url": "https://stackoverflow.com/feeds/tag/javascript"
        }, {
            "enabled": True,
            "interval": 5,  # TODO: Not implemented.
            "title": "StackOverflow - Python",
            "showimage": False,  # TODO: Not implemented.
            "id": "",
            "notify": True,
            "showreaditems": False,
            "url": "https://stackoverflow.Com/feeds/tag/python"
        }, {
            "enabled": True,
            "interval": 5,  # TODO: Not implemented.
            "title": "SuperUser - Linux",
            "showimage": False,  # TODO: Not implemented.
            "id": "",
            "notify": True,
            "showreaditems": False,
            "url": "https://superuser.com/feeds/tag/linux"
        }, {
            "enabled": True,
            "interval": 5,  # TODO: Not implemented.
            "title": "StackExchange - Unix - Linux",
            "showimage": False,  # TODO: Not implemented.
            "id": "",
            "notify": True,
            "showreaditems": False,
            "url": "https://unix.stackexchange.com/feeds/tag/linux"
        }, {
            "enabled": True,
            "interval": 5,  # TODO: Not implemented.
            "title": "StackExchange - Unix - Bash",
            "showimage": False,  # TODO: Not implemented.
            "id": "",
            "notify": True,
            "showreaditems": False,
            "url": "https://unix.stackexchange.com/feeds/tag/bash"
        }, {
            "enabled": True,
            "interval": 5,  # TODO: Not implemented.
            "title": "StackExchange - Unix - Debian",
            "showimage": False,  # TODO: Not implemented.
            "id": "",
            "notify": True,
            "showreaditems": False,
            "url": "https://unix.stackexchange.com/feeds/tag/debian"
        }, {
            "enabled": True,
            "interval": 5,  # TODO: Not implemented.
            "title": "StackExchange - Unix - Shell",
            "showimage": False,  # TODO: Not implemented.
            "id": "",
            "notify": True,
            "showreaditems": False,
            "url": "https://unix.stackexchange.com/feeds/tag/shell"
        }]
    }]
}


class ConfigFileManager():
    """Class used to manage the JSON multi-profile config file.

    Attributes
    ----------
    feeds : object
        Instance of Gtk.ListStore.
    profiles : object
        Instance of Gtk.ListStore.
    """

    def __init__(self, filename, profile_name):
        """Initialization.

        Parameters
        ----------
        filename : str
            Path to the file where all the feeds and profiles are stored.
        profile_name : str
            The name of the profile that will be initially listed when opening the GUI.
        """
        self.feeds = Gtk.ListStore(str, bool, str, str, bool, int, bool, bool)
        self.profiles = Gtk.ListStore(str, str)
        self.__filename = filename
        self.__json = ConfigFileManager.read(filename)
        self.set_profile(profile_name)

    def set_profile(self, profile_name):
        """Method used to change which profile list is being bound to the feeds array.

        Parameters
        ----------
        profile_name : str
            The name f the profile to switch to.

        Returns
        -------
        int
            The index at which the profile is listed.
        """
        self.__profile_selected = profile_name
        self.__load_feeds()
        for iid, row in enumerate(self.profiles):
            if row[0] == profile_name:
                return iid
        # Not found (might indicate bigger issues?)
        return -1

    def get_profile(self):
        """Returns the current selected profile name.

        Returns
        -------
        str
            Currently selected profile name.
        """
        return self.__profile_selected

    def get_profile_id(self):
        """Returns the current selected profile ID.

        Returns
        -------
        int
            Currently selected profile ID.
        """
        for iid, row in enumerate(self.profiles):
            if row[0] == self.__profile_selected:
                return iid
        # Not found (might indicate bigger issues?)
        return -1

    def save(self):
        """Convert the array back into feeds profile in the config file and then save/export it.
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
        """Add a new profile (if doesn't exist) and switch the profile to it.

        Parameters
        ----------
        new_name : str
            New profile name.

        Returns
        -------
        int
            Index of the newly created profile.
        """
        # Check if name is already in list of profiles
        if not self.__profile_exists(new_name):
            # Add new profile
            self.__json["profiles"].append({
                "name": new_name,
                "interval": 30,
                "feeds": []})

        return self.set_profile(new_name)

    def remove_profile(self, profile_name):
        """Add a new profile (if doesn't exist) and switch the profile to it.

        Parameters
        ----------
        profile_name : str
            Name of the profile to delete.

        Returns
        -------
        int
            Index of default profile.
        """
        if self.__profile_exists(profile_name):
            self.__json["profiles"] = [
                p for p in self.__json["profiles"] if p["name"] != profile_name]

        return self.set_profile("Default")

    def get_profile_name(self, index):
        """Get the name of an profile by index in profile array.

        Parameters
        ----------
        index : int
            A profile index.

        Returns
        -------
        str
            The name of a profile.
        """
        return self.profiles[index][0]

    def __profile_exists(self, name):
        """Check if the profile already exists.

        Parameters
        ----------
        name : str
            Profile name.

        Returns
        -------
        bool
            If profile exists.
        """
        for profile in self.__json["profiles"]:
            if profile["name"] == name:
                return True
        return False

    def __load_feeds(self):
        """This will parse the loaded JSON file and populate the profiles and feeds arrays.
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
        """Reads feeds list from an OPML file.

        Parameters
        ----------
        file_name : str
            Path to a file.

        Returns
        -------
        int
            Number of feeds the imported file has.
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

    def export_feeds(self, output_file):
        """Writes the selected feeds array to a file. Note that the ID is not exported,
        it is created on import.

        Parameters
        ----------
        output_file : str
            Path to the file that will store the exported feeds.
        """
        if len(self.feeds) > 0:
            with open(output_file, mode="w") as file:
                file.write("### feeds export v=1.0\n")
                filewriter = csv.writer(file, quoting=csv.QUOTE_NONNUMERIC)

                for feed in self.feeds:
                    filewriter.writerow(feed[1:])

    def import_feeds(self, input_file):
        """Import a file in the feeds csv format.

        Parameters
        ----------
        input_file : str
            Path to a file to import feeds from.

        Returns
        -------
        int
            Number of feeds the imported file has.

        Raises
        ------
        Exception
            Invalid file content.
        """
        cnt = 0

        with open(input_file, mode="r") as file:
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
        """To boolean.

        Parameters
        ----------
        val : str
            Value.

        Returns
        -------
        bool
            Boolean.
        """
        return val.lower() == "true"

    @staticmethod
    def read(file_name):
        """Returns the feeds.json file or creates a new one with
        default values if it does not exist.

        Parameters
        ----------
        file_name : str
            Path to the feeds.json file.

        Returns
        -------
        dict
            The content of the feeds.json file parsed.
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
        """Takes a passed in json object and writes the file to disk.

        Parameters
        ----------
        jsonfile : str
            Path to the feeds.json file.
        json_obj : dict
            The data that will be saved into the feeds.json file.
        """
        with open(jsonfile, mode="w", encoding="utf-8") as file:
            content = json.dumps(json_obj, ensure_ascii=False)
            file.write(content)

    @staticmethod
    def get_new_id():
        """Common method used to return a unique ID in a string format.

        Returns
        -------
        str
            The generated UUID.
        """
        return str(uuid.uuid4())

    @staticmethod
    def update_redirected_feed(config_file, profile_name, current_url, redirected_url):
        """This static method will change a feed to a new updated current_url.

        Parameters
        ----------
        config_file : str
            Path to the feeds.json file.
        profile_name : str
            Name of the profile where the feed with the URL to change is stored.
        current_url : str
            Current feed URL.
        redirected_url : str
            The URL to which the feed has been redirected to.
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
