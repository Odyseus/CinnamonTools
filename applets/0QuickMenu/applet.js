let $,
    GlobalUtils,
    DebugManager;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
    DebugManager = require("./debugManager.js");
    $ = require("./utils.js");
} else {
    GlobalUtils = imports.ui.appletManager.applets["{{UUID}}"].globalUtils;
    DebugManager = imports.ui.appletManager.applets["{{UUID}}"].debugManager;
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
}

const {
    gi: {
        Gio,
        GLib,
        St
    },
    mainloop: Mainloop,
    misc: {
        util: Util
    },
    ui: {
        applet: Applet,
        main: Main,
        popupMenu: PopupMenu,
        settings: Settings,
        tooltips: Tooltips
    }
} = imports;

const {
    _
} = GlobalUtils;

function QuickMenu() {
    this._init.apply(this, arguments);
}

QuickMenu.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(aMetadata, aOrientation, aPanelHeight, aInstanceId) {
        Applet.TextIconApplet.prototype._init.call(this, aOrientation, aPanelHeight, aInstanceId);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.metadata = aMetadata;
        this.orientation = aOrientation;
        this.instance_id = aInstanceId;
        this.menu_keybinding_name = this.metadata.uuid + "-" + this.instance_id;

        this._initializeSettings(() => {
            this._expandAppletContextMenu();
        }, () => {
            this.menuManager = new PopupMenu.PopupMenuManager(this);

            this.directory_last = this.pref_directory;

            this.set_applet_tooltip(this.pref_customtooltip);

            this.main_folder_monitor = null;
            this.monitor_id = 0;
            this.update_menu_id = 0;
            this.folder_changed_id = 0;

            this._createMenu();
            this._updateIconAndLabel();
            this.dealWithFolderMonitor();
            this._updateMenu(true);
            this._updateKeybinding();
        });
    },

    dealWithFolderMonitor: function(aRem) {
        if (this.monitor_id > 0) {
            this.main_folder_monitor.disconnect(this.monitor_id);
        }

        if (!this.pref_autoupdate || aRem) {
            return;
        }

        /* NOTE: Monitoring the directory is very limited. It doesn't monitor files
         * recursively and it doesn't even monitor file changes inside sub-folders.
         * The only solution would be to add a monitor per file,
         * which I will never even consider doing. That's why the Auto-update menu
         * option is disabled by default, it's totally useless.
         */
        if (this.directory_last && GLib.file_test(this.directory_last, GLib.FileTest.IS_DIR)) {
            this.main_folder_monitor = Gio.file_new_for_path(this.directory_last)
                .monitor_directory(Gio.FileMonitorFlags.NONE, null);
            this.monitor_id = this.main_folder_monitor.connect("changed",
                (aMonitor, aFileObj, aN, aEventType) => {
                    this._onMainFolderChanged(aMonitor, aFileObj, aN, aEventType);
                });
        }
    },

    _onMainFolderChanged: function(aMonitor, aFileObj, aN, aEventType) {
        if (aEventType === Gio.FileMonitorEvent.DELETED ||
            aEventType === Gio.FileMonitorEvent.RENAMED ||
            aEventType === Gio.FileMonitorEvent.ATTRIBUTE_CHANGED ||
            aEventType === Gio.FileMonitorEvent.CHANGES_DONE_HINT ||
            aEventType === Gio.FileMonitorEvent.CREATED ||
            aEventType === Gio.FileMonitorEvent.MOVED ||
            aEventType === Gio.FileMonitorEvent.MOVED_OUT) {
            if (this.folder_changed_id > 0) {
                Mainloop.source_remove(this.folder_changed_id);
                this.folder_changed_id = null;
            }

            this.folder_changed_id = Mainloop.timeout_add(1000,
                () => this._updateMenu());
        }
    },

    _subMenuOpenStateChanged: function(aMenu, aOpen) {
        if (aOpen) {
            let children = aMenu._getTopMenu()._getMenuItems();
            let i = 0,
                iLen = children.length;
            for (; i < iLen; i++) {
                let item = children[i];
                if (item instanceof $.CustomSubMenuMenuItem) {
                    if (aMenu !== item.menu) {
                        item.menu.close(true);
                    }
                }
            }
        }
    },

    _initializeSettings: function(aDirectCallback, aIdleCallback) {
        this.settings = new Settings.AppletSettings(
            this,
            this.metadata.uuid,
            this.instance_id
        );

        let callback = () => {
            try {
                this._bindSettings();
                aDirectCallback();
            } catch (aErr) {
                global.logError(aErr);
            }

            Mainloop.idle_add(() => {
                try {
                    aIdleCallback();
                } catch (aErr) {
                    global.logError(aErr);
                }

                return GLib.SOURCE_REMOVE;
            });
        };

        // Needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 4.2.x+
        // Always use promise. Declare content of callback variable
        // directly inside the promise callback.
        switch (this.settings.hasOwnProperty("promise")) {
            case true:
                this.settings.promise.then(() => callback());
                break;
            case false:
                callback();
                break;
        }
    },

    _bindSettings: function() {
        // Needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        let bD = {
            IN: 1,
            OUT: 2,
            BIDIRECTIONAL: 3
        };
        let prefKeysArray = [
            "pref_directory",
            "pref_sub_menu_icons_file_name",
            "pref_auto_close_opened_sub_menus",
            "pref_ignore_sub_folders",
            "pref_show_only_desktop_files",
            "pref_show_submenu_icons",
            "pref_show_applications_icons",
            "pref_show_applet_title",
            "pref_applet_title",
            "pref_show_hidden_files",
            "pref_show_hidden_folders",
            "pref_autoupdate",
            "pref_customtooltip",
            "pref_show_customicon",
            "pref_customicon",
            "pref_icon_for_menus",
            "pref_hotkey",
            "pref_use_different_icons_for_sub_menus",
            "pref_style_for_sub_menus",
            "pref_style_for_menu_items",
            "pref_sub_menu_icon_size",
            "pref_menu_item_icon_size",
            "pref_logging_level",
            "pref_debugger_enabled"
        ];
        let newBinding = typeof this.settings.bind === "function";
        for (let pref_key of prefKeysArray) {
            // Condition needed for retro-compatibility.
            // Mark for deletion on EOL. Cinnamon 3.2.x+
            // Abandon this.settings.bindProperty and keep this.settings.bind.
            if (newBinding) {
                this.settings.bind(pref_key, pref_key, this._onSettingsChanged, pref_key);
            } else {
                this.settings.bindProperty(bD.BIDIRECTIONAL, pref_key, pref_key, this._onSettingsChanged, pref_key);
            }
        }
    },

    updateLabelVisibility: function() {
        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (typeof this.hide_applet_label !== "function") {
            return;
        }

        if (this.orientation == St.Side.LEFT || this.orientation == St.Side.RIGHT) {
            this.hide_applet_label(true);
        } else {
            if (this.pref_applet_title === "") {
                this.hide_applet_label(true);
            } else {
                this.hide_applet_label(false);
            }
        }
    },

    on_orientation_changed: function(orientation) {
        this.orientation = orientation;

        this._createMenu();
        this._updateIconAndLabel();
        this._updateMenu();

        // Temporarily added to fix an upstream bug.
        Mainloop.timeout_add_seconds(5, () => {
            if (this.context_menu_item_remove) {
                // NOTE: This string could be left blank because it's a default string,
                // so it's already translated by Cinnamon. It's up to the translators.
                this.context_menu_item_remove.label.set_text(_("Remove '%s'")
                    .format(_(this.metadata.name)));
            }
        });
    },

    _createMenu: function() {
        if (this.menu) {
            // This generates a mile of Cjs warnings. Ignore them.
            // Fixed in newer versions of Cinnamon and it actually doesn't break
            // the menu destruction/creation process.
            this.menu.destroy();
        }

        this.menu = new Applet.AppletPopupMenu(this, this.orientation, this.instance_id);
        this.menuManager.addMenu(this.menu);
    },

    _updateMenu: function(aRightNow) {
        if (this.update_menu_id > 0) {
            Mainloop.source_remove(this.update_menu_id);
            this.update_menu_id = 0;
        }

        this.update_menu_id = Mainloop.timeout_add((aRightNow ? 10 : 1000),
            () => {
                this._createMenu();
                this._loadDir(this.pref_directory, this.menu);
                this.update_menu_id = 0;

                return GLib.SOURCE_REMOVE;
            });
    },

    _loadDir: function(aDir, aMenu) {
        if (!aDir || !aMenu) {
            return;
        }

        // Workaround for Cinnamon 3.2.x settings window path selectors.
        // They return an URI instead of a path like they used to. ¬¬
        if (/^file:\/\//.test(aDir)) {
            aDir = aDir.substr(7);
        }

        let currentDir = Gio.file_new_for_path(aDir);

        if (currentDir.query_exists(null)) {
            let iconsForFolders = null;

            if (this.pref_use_different_icons_for_sub_menus) {
                if (this.pref_sub_menu_icons_file_name === "") {
                    this.pref_sub_menu_icons_file_name = "0_icons_for_sub_menus.json";
                }

                let iconsForSubMenusFile = Gio.file_new_for_path(aDir + "/" +
                    this.pref_sub_menu_icons_file_name);

                if (iconsForSubMenusFile.query_exists(null)) {
                    iconsForSubMenusFile.load_contents_async(null,
                        (aFile, aResponce) => {
                            let success,
                                contents,
                                tag;

                            try {
                                [success, contents, tag] = aFile.load_contents_finish(aResponce);
                            } catch (aErr) {
                                global.logError("ERROR: " + aErr.message);
                                this._handleDir(aDir, currentDir, aMenu, null);
                                return;
                            }

                            if (success) {
                                try {
                                    let iconsForFolders = JSON.parse(contents);
                                    this._handleDir(aDir, currentDir, aMenu, iconsForFolders);
                                } catch (aErr) {
                                    this._handleDir(aDir, currentDir, aMenu, null);
                                }
                            } else {
                                this._handleDir(aDir, currentDir, aMenu, null);
                            }
                        });
                }
            } else {
                this._handleDir(aDir, currentDir, aMenu, iconsForFolders);
            }
        }

        this.update_menu_id = 0;
    },

    _handleDir: function(aDir, aCurrentDir, aMenu, aIconsForFolders) {
        let dirs = [];
        let files = [];
        let filter = "standard::name,standard::is-symlink,standard::is-hidden," +
            "standard::type,standard::size";
        // KEEP AN EYE ON THIS!!!
        // Depending on the Gio version, enumerate_children might need different
        // amount of arguments. "Thank you" GNOME for all your "stable" APIs!!! ¬¬
        let enumerator = aCurrentDir.enumerate_children(
            filter,
            Gio.FileQueryInfoFlags.NONE,
            null
        );
        let file;

        try {
            // Get all dirs and files
            while ((file = enumerator.next_file(null)) !== null) {
                let fileName = file.get_name();
                let fileType = file.get_file_type();

                if (fileType === Gio.FileType.DIRECTORY) {
                    if (this.pref_ignore_sub_folders) {
                        continue;
                    }

                    if (/^\./.test(fileName) && !this.pref_show_hidden_folders) {
                        continue;
                    }

                    let iconName = this.pref_icon_for_menus;
                    if (this.pref_show_submenu_icons &&
                        this.pref_use_different_icons_for_sub_menus &&
                        aIconsForFolders !== null &&
                        aIconsForFolders[fileName]) {
                        iconName = aIconsForFolders[fileName];

                        if (/^\~\//.test(iconName)) {
                            iconName = iconName.replace(/^\~/, GLib.get_home_dir());
                        }
                    }

                    dirs.push({
                        folderName: fileName,
                        iconName: iconName
                    });
                } else {
                    if (!/.desktop$/.test(fileName) && this.pref_show_only_desktop_files) {
                        continue;
                    }

                    if (/^\./.test(fileName) && !this.pref_show_hidden_files) {
                        continue;
                    }

                    if (fileName === this.pref_sub_menu_icons_file_name) {
                        continue;
                    }

                    let filePath = aDir + "/" + fileName;
                    let isSymlink = GLib.file_test(filePath, GLib.FileTest.IS_SYMLINK);

                    // If in the presence of a symlink, use the path to the "real file",
                    // not the path to the symlink.
                    if (isSymlink) {
                        filePath = GLib.file_read_link(filePath);
                    }

                    // If the symlink leads to an invalid file, ignore it.
                    if (isSymlink && !GLib.file_test(filePath, GLib.FileTest.EXISTS)) {
                        continue;
                    }

                    let contentType = Gio.content_type_guess(filePath, null);

                    let isDeskFile = contentType.indexOf("application/x-desktop") !== -1;
                    let app = Gio.file_new_for_path(filePath);
                    if (!app) {
                        global.logError("File " + filePath + " not found");
                        continue;
                    }

                    if (isDeskFile) {
                        app = Gio.DesktopAppInfo.new_from_filename(filePath);
                    }

                    if (!app) {
                        continue;
                    }

                    files.push({
                        app: app,
                        name: (isDeskFile ?
                            app.get_name() :
                            fileName)
                    });
                }
            }
        } finally {
            // Populate dirs first
            if (dirs.length > 0 && !this.pref_ignore_sub_folders) {
                dirs = dirs.sort((a, b) => {
                    return a.folderName.localeCompare(b.folderName);
                });
                let d = 0,
                    dLen = dirs.length;
                for (; d < dLen; d++) {
                    let dirPath = aCurrentDir.get_path() + "/" + dirs[d].folderName;
                    let submenu = new $.CustomSubMenuMenuItem(this, {
                        folderName: dirs[d].folderName,
                        iconName: dirs[d].iconName
                    });

                    this._loadDir(dirPath, submenu.menu);

                    if (aDir === this.pref_directory && this.pref_auto_close_opened_sub_menus) {
                        submenu.menu.connect("open-state-changed",
                            (aMenu, aOpen) => this._subMenuOpenStateChanged(aMenu, aOpen));
                    }

                    aMenu.addMenuItem(submenu);
                }
            }

            // Populate files
            if (files.length > 0) {
                files = files.sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });
                let f = 0,
                    fLen = files.length;
                for (; f < fLen; f++) {
                    let item = new $.FileMenuItem(this, files[f]);

                    if (!item) {
                        continue;
                    }

                    aMenu.addMenuItem(item);
                }
            }
        }
    },

    _updateIconAndLabel: function() {
        let icon = this.pref_customicon;
        let setIcon = (aIcon, aIsPath) => {
            if (aIcon.search("-symbolic") !== -1) {
                this[aIsPath ?
                    "set_applet_icon_symbolic_path" :
                    "set_applet_icon_symbolic_name"](aIcon);
            } else {
                this[aIsPath ?
                    "set_applet_icon_path" :
                    "set_applet_icon_name"](aIcon);
            }
        };

        if (GLib.path_is_absolute(icon) &&
            GLib.file_test(icon, GLib.FileTest.EXISTS)) {
            setIcon(icon, true);
        } else {
            try {
                setIcon(icon);
            } catch (aErr) {
                global.logWarning('Could not load icon "' + icon + '" for applet.');
            }
        }

        if (this.pref_customicon === "") {
            this._applet_icon_box.hide();
        } else {
            this._applet_icon_box.show();
        }

        if (this.orientation === St.Side.TOP || this.orientation === St.Side.BOTTOM) { // no menu label if in a vertical panel
            if (this.pref_show_applet_title && this.pref_applet_title !== "") {
                this.set_applet_label(_(this.pref_applet_title));
            } else {
                this.set_applet_label("");
            }
        } else {
            this.set_applet_label("");
        }

        this.updateLabelVisibility();
    },

    _expandAppletContextMenu: function() {
        this.update_menu_item = new PopupMenu.PopupIconMenuItem(_("Update menu"),
            "edit-redo",
            St.IconType.SYMBOLIC);
        this.update_menu_item.connect("activate", () => this._updateMenu(true));
        new Tooltips.Tooltip(this.update_menu_item.actor,
            _("Scan the main folder to re-create the menu."), this.orientation);
        this._applet_context_menu.addMenuItem(this.update_menu_item);

        this.open_dir_menu_item = new PopupMenu.PopupIconMenuItem(_("Open folder"),
            "folder",
            St.IconType.SYMBOLIC);
        this.open_dir_menu_item.connect("activate", () => {
            Util.spawn_async(["xdg-open", this.pref_directory]);
        });
        new Tooltips.Tooltip(this.open_dir_menu_item.actor, _("Open the main folder."),
            this.orientation);
        this._applet_context_menu.addMenuItem(this.open_dir_menu_item);

        this.help_menu_item = new PopupMenu.PopupIconMenuItem(_("Help"),
            "dialog-information",
            St.IconType.SYMBOLIC);
        this.help_menu_item.connect("activate", () => {
            Util.spawn_async(["xdg-open", this.metadata.path + "/HELP.html"]);
        });
        new Tooltips.Tooltip(this.help_menu_item.actor, _("Open the help file."), this.orientation);
        this._applet_context_menu.addMenuItem(this.help_menu_item);
    },

    _updateKeybinding: function() {
        Main.keybindingManager.removeHotKey(this.menu_keybinding_name);

        Main.keybindingManager.addHotKey(
            this.menu_keybinding_name,
            this.pref_hotkey,
            () => {
                if (!Main.overview.visible && !Main.expo.visible) {
                    this.menu.toggle();
                }
            });
    },

    on_applet_removed_from_panel: function() {
        this.dealWithFolderMonitor(true);
        Main.keybindingManager.removeHotKey(this.menu_keybinding_name);
        this.settings && this.settings.finalize();
    },

    on_applet_clicked: function(event) { // jshint ignore:line
        this.menu.toggle();
    },

    _onSettingsChanged: function(aPrefValue, aPrefKey) {
        // Note: On Cinnamon versions greater than 3.2.x, two arguments are passed to the
        // settings callback instead of just one as in older versions. The first one is the
        // setting value and the second one is the user data. To workaround this nonsense,
        // check if the second argument is undefined to decide which
        // argument to use as the pref key depending on the Cinnamon version.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        // Remove the following variable and directly use the second argument.
        let pref_key = aPrefKey || aPrefValue;
        switch (pref_key) {
            case "pref_directory":
                if (this.pref_directory !== this.directory_last) {
                    this.directory_last = this.pref_directory;
                    this.dealWithFolderMonitor();
                    this._updateMenu();
                }
                break;
            case "pref_auto_close_opened_sub_menus":
            case "pref_ignore_sub_folders":
            case "pref_show_only_desktop_files":
            case "pref_show_submenu_icons":
            case "pref_show_applications_icons":
            case "pref_show_hidden_files":
            case "pref_show_hidden_folders":
            case "pref_icon_for_menus":
            case "pref_use_different_icons_for_sub_menus":
            case "pref_style_for_sub_menus":
            case "pref_style_for_menu_items":
            case "pref_sub_menu_icon_size":
            case "pref_menu_item_icon_size":
                this._updateMenu();
                break;
            case "pref_show_applet_title":
            case "pref_applet_title":
            case "pref_show_customicon":
            case "pref_customicon":
                this._updateIconAndLabel();
                break;
            case "pref_autoupdate":
                this.dealWithFolderMonitor();
                this._updateMenu();
                break;
            case "pref_customtooltip":
                this.set_applet_tooltip(this.pref_customtooltip);
                break;
            case "pref_hotkey":
                this._updateKeybinding();
                break;
            case "pref_logging_level":
            case "pref_debugger_enabled":
                $.Debugger.logging_level = this.pref_logging_level;
                $.Debugger.debugger_enabled = this.pref_debugger_enabled;
                break;
        }
    }
};

function main(aMetadata, aOrientation, aPanelHeight, aInstanceId) {
    DebugManager.wrapObjectMethods($.Debugger, {
        QuickMenu: QuickMenu
    });

    return new QuickMenu(aMetadata, aOrientation, aPanelHeight, aInstanceId);
}
