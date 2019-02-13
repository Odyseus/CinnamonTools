#!/usr/bin/python3
# -*- coding: utf-8 -*-

import os
import sys

xlet_dir = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))

xlet_slug = os.path.basename(xlet_dir)

repo_folder = os.path.normpath(os.path.join(xlet_dir, *([".."] * 2)))

app_folder = os.path.join(repo_folder, "__app__")

if app_folder not in sys.path:
    sys.path.insert(0, app_folder)


from python_modules.localized_help_creator import LocalizedHelpCreator
from python_modules.localized_help_creator import _
from python_modules.localized_help_creator import md
from python_modules.localized_help_creator import utils


class Main(LocalizedHelpCreator):

    def __init__(self, xlet_dir, xlet_slug):
        super().__init__(xlet_dir, xlet_slug)

    def get_content_base(self, for_readme):
        return "\n".join([
            "## %s" % _("Description"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("This applet is a fork of [Desktop Capture](https://github.com/rjanja/desktop-capture) applet by Rob Adams (a.k.a. rjanja)."),
            "",
            "## %s" % _("Differences with the original applet"),
            "",
            _("The principal differences of this fork with the original applet are in usability and of the kind 'do more with less code'."),
            "",
            "- %s" % _("More convenient handling of settings. Most settings can be changed directly from the applet menu or its context menu without the need to constantly open the applet settings window."),
            "- %s" % _("Keyboard shortcuts are not only available for Cinnamon's built-in features, but for all screenshot/screencast programs."),
            "- %s" % _("Settings are immediately available after changed without the need to restart Cinnamon."),
            "- %s" % _("The 'Repeat last' item isn't only available for Cinnamon's screenshots, but for any device and any program."),
            "",
        ])

    def get_content_extra(self):
        return md("{}".format("\n".join([
            "",
            "## %s" % _("Programs support"),
            "",
            _("In addition to Cinnamon's built-in screenshot/screencast tools, this applet also supports third-party programs to take captures. By default, this applet comes with support for several known programs (Shutter, Gnome Screenshot, XWD, ImageMagic, FFmepg, RecordMyDesktop, Byzanz and Kazam)."),
            "",
            utils.get_bootstrap_alert(
                heading=_("Highlights"),
                content=md("""
- {0}
- {1}
- {2}
- {3}
- {4}
- {5}
- {6}""".format(
                    # TO TRANSLATORS: Do not translate the words "camera" and "recorder".
                    # MARKDOWN string. Respect formatting.
                    _("Programs are stored inside an applet preference. They are grouped by devices. A device called **camera** that contains programs that take screenshots. And a device called **recorder** that contains programs that capture screencasts."),
                    _("Programs can be added/removed/modified as much as needed/wanted from this applet context menu by simply exporting the existent programs, modifying the generated JSON file and importing the modified file again."),
                    _("Commands are exactly that, commands. They are composed of command line arguments , placeholders, and/or flags."),
                    # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                    _(
                        "Placeholders are strings specifically formatted with double curly braces (`{{PLACEHOLDER_NAME}}`) and can be placed in any part of a string. These strings are replaced with dynamically generated data (an applet preference, screen coordinates, etc.) when a command is executed."),
                    # TO TRANSLATORS: MARKDOWN string. Respect formatting.
                    _("Flags are another type of specifically formatted strings surrounded by hashes (`#FLAG_NAME#`) and they always must be placed at the beginning of a string. Flags indicate that an action must be taken before a command is executed."),
                    _("The exported JSON file exemplifies almost all the options, flags and placeholders documented below."),
                    _("The command that will be executed can be previewed before actually executing it by simply right clicking a menu item."),
                ))
            ),
            "",
            utils.get_bootstrap_alert(
                context="warning",
                heading=_("Warnings"),
                content=md("""
- {0}
- {1}
- {2}
- {3}""".format(
                    _("All option names, flags, and placeholders are case sensitive. Command option names are lower cased and use dashes as word separators. Placeholders and flags are upper cased and use low dashes as word separators."),
                    _("An imported JSON file will overwrite an existent preference."),
                    _("Importing a malformed/invalid JSON file will cancel the import operation without modifying an existent preference."),
                    _("There isn't a mechanism to check if a command is available or not on the system the applet is installed. So, use common sense."),
                ))
            ),
            "",
            "### %s" % _("Basic example"),
            "",
            """```
{{
    "camera": {{
        "{pro_name}": {{
            "title": "{pro_title}",
            "cursor": {{
                "on": "{cursor_on}",
                "off": "{cursor_off}"
            }},
            "timer": true,
            "append-1": "{append_1}",
            "menuitems": {{
                "{item_label} 1": "{item_command}",
                "---": "{separator}",
                "{item_label} 2": "{item_command}",
            }}
        }}
    }},
    "recorder": {{
        "{pro_name}": {{
            "title": "{pro_title}",
            "fps": true,
            "cursor": {{
                "on": "{cursor_on}",
                "off": "{cursor_off}"
            }},
            "sound": {{
                "on": "{sound_on}",
                "off": "{sound_off}"
            }},
            "menuitems": {{
                "#{item_label} 1": "{item_command} ({item_label_hash})",
                "---": "{separator}",
                "{item_label} 2": "{item_command}",
            }},
            "stop-command": "{stop_command}"
        }}
    }}
}}
```""".format(
                pro_name=_("Program/Command name"),
                pro_title=_("Name of the program shown on the program selector menu"),
                sound_on=_("Argument to include sound in capture"),
                sound_off=_("Argument to not include sound in capture"),
                stop_command=_("Command to stop recording"),
                separator=_("This is a separator"),
                cursor_on=_("Argument to include cursor in capture"),
                cursor_off=_("Argument to not include cursor in capture"),
                # TO TRANSLATORS: Do not translate the word "APPEND_1".
                append_1=_("The content here will be used to replace the {{APPEND_1}} placeholder"),
                item_label=_("Menu item label"),
                item_label_hash=_("See %s." % ("**%s**" % _("Menu item label flags"))),
                item_command=_("Command to execute when clicking this menu item"),
            ),
            "",
            "### %s" % _("Program options"),
            "",
            "| %s | %s | %s |" % (_("Option"), _("Usage"), _("Description")),
            "| --- | --- | --- |",
            "| `title` | %s | %s |" % (_("Mandatory"), _(
                "This option will be used as the program name in the program selector sub-menu.")),
            "| `menuitems` | %s | %s |" % (_("Mandatory"), _(
                "This option contains all the data that will be used to create the menu items for a program.")),
            "| `stop-command` | %s - %s | %s |" % (_("Mandatory"), _(
                "Recorder only"), _("The command to stop recording a screencast.")),
            "| `timer` | %s - %s | %s |" % (_("Optional"), _("Camera only"),
                                            # TO TRANSLATORS: Do not translate the words "true" and "DELAY".
                                            # MARKDOWN string. Respect formatting.
                                            _("This option is used in combination with the `{{DELAY}}` placeholder. If set to **true**, sets the visibility of the **Capture delay** option inside this applet menu.")),
            "| `fps` | %s - %s | %s |" % (_("Optional"), _("Recorder only"),
                                          # TO TRANSLATORS: Do not translate the word "true".
                                          # MARKDOWN string. Respect formatting.
                                          _("This option, if set to **true**, sets the visibility of the **Frames per second** option inside this applet menu.")),
            "| `cursor` | %s | %s |" % (_("Optional"),
                                        # TO TRANSLATORS: Do not translate the words "on", "off", and "CURSOR".
                                        # MARKDOWN string. Respect formatting.
                                        _("This option is used in combination with the `{{CURSOR}}` placeholder. It must contain two keys named **on** and **off** which respectively must contain a comand line argument for enabling/disabling the display of the mouse cursor on the captured file.")),
            "| `sound` | %s - %s | %s |" % (_("Optional"), _("Recorder only"),
                                            # TO TRANSLATORS: Do not translate the words "on", "off", and "SOUND".
                                            # MARKDOWN string. Respect formatting.
                                            _("This option is used in combination with the `{{SOUND}}` placeholder. It must contain two keys named **on** and **off** which respectively must contain a comand line argument for enabling/disabling the inclusion of sound on the captured file.")),
            "| `append-1` ... `append-10` | %s | %s |" % (_("Optional"), _(
                "These options are used in combination with the `{{APPEND_1}}` to `{{APPEND_10}}` placeholders. This is done to avoid repeating the same arguments on all menu items commands.")),
            "",
            "### %s" % _("Flags"),
            "",
            "#### %s" % _("Menu item label flags"),
            "",
            "| %s | %s |" % (_("Flag"), _("Description")),
            "| --- | --- |",
            "| `#` | %s |" % _(
                "The hash (#) character in front of a menu item label is a flag that inhibits the menu item from changing the state of the applet (the change of the applet icon from normal to recording)."),
            "",
            "#### %s" % _("Menu item command flags"),
            "",
            "| %s | %s |" % (_("Flag"), _("Description")),
            "| --- | --- |",
            "| `#INTERACTIVE_AREA_HELPER#` | %s |" % _(
                "This flag will allow the use of this applet area selector helper. See %s" % ("**[%s](#menu-item-command-interactive-placeholders-{{lhc_lang_id}})**" % _("Menu item command interactive placeholders"))),
            "| `#INTERACTIVE_WINDOW_HELPER#` | %s |" % _(
                "This flag will allow the use of this applet window selector helper. See %s" % ("**[%s](#menu-item-command-interactive-placeholders-{{lhc_lang_id}})**" % _("Menu item command interactive placeholders"))),
            "",
            "### %s" % _("Menu item command placeholders"),
            "",
            "| %s | %s | %s |" % (_("Placeholder"), _("Usage"), _("Description")),
            "| --- | --- | --- |",
            # TO TRANSLATORS: Do not translate the word "append".
            # MARKDOWN string. Respect formatting.
            "| `{{APPEND_1}}` ... `{{APPEND_10}}` |  | %s |" % _(
                "Placeholder for the program options `append-1` to `append-10`."),
            "| `{{CURSOR}}` |  | %s |" % _(
                "The command line argument used to decide if the capture will display the cursor or not."),
            "| `{{DELAY}}` | %s | %s |" % (_("Camera only"), _(
                "Delay in seconds before taking a screenshot.")),
            "| `{{DIRECTORY}}` |  | %s |" % _("The directory used as storage for the captures."),
            "| `{{EXT}}` |  | %s |" % _(
                "The file extension that the generated capture will have. It has to be used in pairs (Example: `{{EXT}}png{{EXT}}`)."),
            "| `{{FILENAME}}` |  | %s |" % _(
                "The file name (no extension included) that the generated capture will have."),
            "| `{{FPS}}` | %s | %s |" % (_("Recorder only"), _(
                "Frames per second (frame rate).")),
            "| `{{RECORDER_DIR}}` |  | %s |" % _(
                "The directory used to store the screencast captures."),
            "| `{{SCREEN_DIMENSIONS}}` |  | %s |" %
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("The screen dimensions with format `widthxheight`. Example: `1440x900`"),

            "| `{{SCREEN_HEIGHT}}`  |  | %s |" % _("The screen height."),
            "| `{{SCREEN_WIDTH}}`  |  | %s |" % _("The screen width."),
            "| `{{SCREENSHOT_DIR}}`  |  | %s |" % _(
                "The directory used to store the screenshot captures."),
            "| `{{SOUND}}` | %s | %s |" % (_("Recorder only"), _(
                "The command line argument used to decide if the capture include sound or not.")),
            "",
            '<span id="menu-item-command-interactive-placeholders-{{lhc_lang_id}}"></span>',
            "",
            "### %s" % _("Menu item command interactive placeholders"),
            "",
            "| %s | %s |" % (_("Placeholder"), _("Description")),
            "| --- | --- |",
            "| `{{I_X}}` | %s |" % _("`x` screen coordinates."),
            "| `{{I_Y}}` | %s |" % _("`y` screen coordinates."),
            "| `{{I_X_Y}}` | %s |" % _("`x` and `y` screen coordinates separated by a comma."),
            "| `{{I_WIDTH}}` | %s |" % _(
                "It could be either the width of a selected area or the width of a selected window."),
            "| `{{I_HEIGHT}}` | %s |" % _(
                "It could be either the height of a selected area or the height of a selected window."),
            "| `{{I_NICE_WIDTH}}` | %s |" % _(
                "Same as `I_WIDTH`, but with `1` added to its value."),
            "| `{{I_NICE_HEIGHT}}` | %s |" % _(
                "Same as `I_HEIGHT`, but with `1` added to its value."),
            "| `{{I_X_WINDOW_ID}}` | %s |" % _("The selected window ID."),
            "| `{{I_X_WINDOW_FRAME}}` | %s |" % _(
                "The 'x-window' property of the selected window."),
            "| `{{I_WM_CLASS}}` | %s |" % _("The selected window class name."),
            "| `{{I_WINDOW_TITLE}}` | %s |" % _("The selected window class title."),
            "",
            "## %s" % _("Cinnamon recorder profiles"),
            "",
            # TO TRANSLATORS: MARKDOWN string. Respect formatting.
            _("The built-in Cinnamon recorder uses the GStreamer general-purpose multimedia framework ([GStreamer documentation](https://gstreamer.freedesktop.org/documentation/index.html)). It generates a video file with the `webm` extension using the `vp8enc` encoder and the `webmmux` muxer. This applet exposes the use of the Cinnamon recorder through profiles."),
            "",
            utils.get_bootstrap_alert(
                heading=_("Highlights"),
                content=md("""
- {0}
- {1}
""".format(
                    _("Profiles are stored inside an applet preference."),
                    _("Profiles can be added/removed/modified as much as needed/wanted from this applet context menu by simply exporting the existent profiles, modifying the generated JSON file and importing the modified file again."),
                ))
            ),
            "",
            utils.get_bootstrap_alert(
                context="warning",
                heading=_("Warnings"),
                content=md("""
- {0}
- {1}
- {2}""".format(
                    _("An imported JSON file will overwrite an existent preference."),
                    _("Importing a malformed/invalid JSON file will cancel the import operation without modifying an existent preference."),
                    _("Like everything coming from Gnome, GStreamer is an always-evolving-never-finished-barely-functional piece of software. With that in mind, when using the wrong combination of encoder/muxer, Cinnamon will miserably crash. So, experiment at your own risk."),
                ))
            ),
            "",
            "### %s" % _("Basic example"),
            "",
            _("Below are the two Cinnamon recorder profiles shipped with this applet. The profile named default cannot be modified/deleted."),
            "",
            """```
{
    "default": {
        "title": "Default",
        "description": "Encoder: On2 VP8\\nMuxer: WebM\\nFile extension: webm",
        "file-extension": "webm",
        "pipeline": "vp8enc min_quantizer=13 max_quantizer=13 cpu-used=5 deadline=1000000 threads=%T ! queue ! webmmux"
    },
    "x264enc": {
        "title": "H264",
        "description": "Encoder: H264\\nMuxer: Matroska\\nFile extension: mkv",
        "file-extension": "mkv",
        "pipeline": "x264enc ! queue ! matroskamux"
    }
}
```""",
            "",
            "### %s" % _("Profile options"),
            "",
            _("All profile options are mandatory."),
            "",
            "| %s | %s |" % (_("Option"), _("Description")),
            "| --- | --- |",
            "| `title` | %s |" % _("Name of the profile shown on the profile selector menu."),
            "| `description` | %s |" % _(
                "Basic description of the profile that will be displayed as a tooltip."),
            "| `file-extension` | %s |" % _("The file extension of the generated file."),
            "| `pipeline` | %s |" % _("GStreamer pipeline."),
            "",
            "## %s" % _("Keyboard shortcuts"),
            "",
            _("Keyboard shortcuts are tied to specific capture types."),
            "",
            "## %s" % _("Known issues"),
            "",
            "<h3 class='text-danger'>%s</h3>" % _(
                "Cinnamon 3.0.x and its built-in screenshot mechanism"),
            "",
            "<p class='text-danger'><strong>%s</strong></p>" % _(
                "The Cinnamon's 3.0.x built-in screenshot mechanism is broken!"),
            "",
            "<p class='text-danger'><strong>%s</strong></p>" % _(
                "Do not use it or Cinnamon will crash!"),
            "",
            "<p class='text-danger'><strong>%s</strong></p>" % _(
                "It can only be fixed by building from source the cinnamon package for version 3.0.x with the following patch (%s). Or by simply updating to any other newer version of Cinnamon (3.2.x, 3.4.x, etc.)." % "<a href='https://github.com/linuxmint/Cinnamon/pull/5777'>PR#5777</a>"),
            "",
            "<p class='text-danger'><strong>%s</strong></p>" % _(
                "To permanently dismiss the critical notification displayed when the applet is used under Cinnamon 3.0.x, enable the option found in this applet settings window called \"I read the disclaimer and I'm aware of the consequences\", under the \"Disclaimer\" section."),
            "",
        ])
        ))

    def get_css_custom(self):
        return ""

    def get_js_custom(self):
        return ""


if __name__ == "__main__":
    m = Main(xlet_dir, xlet_slug)
    m.start()
