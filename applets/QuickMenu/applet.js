const {
    gi: {
        Clutter,
        Gio,
        GLib,
        St
    },
    ui: {
        applet: Applet,
        dnd: DND,
        main: Main,
        popupMenu: PopupMenu,
        tooltips: Tooltips
    }
} = imports;

const {
    _,
    escapeHTML,
    tryFn,
    launchUri
} = require("js_modules/globalUtils.js");

const {
    CustomSubMenuMenuItem,
    Debugger,
    FileMenuItem,
    Notification
} = require("js_modules/utils.js");

const {
    APPLET_PREFS
} = require("js_modules/constants.js");

const {
    File
} = require("js_modules/customFileUtils.js");

const {
    NotificationUrgency
} = require("js_modules/notificationsUtils.js");

const {
    IntelligentTooltip
} = require("js_modules/customTooltips.js");

const {
    getBaseAppletClass
} = require("js_modules/appletsUtils.js");

class QuickMenu extends getBaseAppletClass(Applet.TextIconApplet) {
    constructor(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
        super({
            metadata: aMetadata,
            orientation: aOrientation,
            panel_height: aPanelHeight,
            instance_id: aInstanceID,
            pref_keys: APPLET_PREFS
        });

        this.__initializeApplet(() => {
            this._expandAppletContextMenu();
        }, () => {
            this._contentSection = new PopupMenu.PopupMenuSection();
            this.menu.addMenuItem(this._contentSection);

            this.main_directory_last = this.$._.main_directory;
            this._main_directory = null;
            this._emptyInfo = null;
            this._failSafeBreachedInfo = null;

            this._subMenusStorage = new Map();
            this.contextMenu = null;
            this.contextMenuParent = null;
            this.main_folder_monitor = null;
            this.main_folder_monitor_id = 0;
            this.total_handled_files_counter = 0;
            this.max_files_to_list_breached = false;
            this.files_blacklist = new Set();
            this.dirs_blacklist = new Set();

            this._buildInfoItems();
            this._updateBlackList("files_blacklist");
            this._updateBlackList("dirs_blacklist");
            this._updateIconAndLabel();
            this.dealWithFolderMonitor();
            this._updateKeybinding();
            this.set_applet_tooltip(this.$._.applet_tooltip);

            if (!this.$._.usage_notified) {
                this.$._.usage_notified = true;
                Notification.notify(
                    escapeHTML(_("Read this xlet help page for usage instructions.")),
                    NotificationUrgency.CRITICAL
                );
            }

            this.updateMenu(true);
        });
    }

    __connectSignals() {
        this.$.signal_manager.connect(this, "orientation-changed", function() {
            this.__seekAndDetroyConfigureContext();
        }.bind(this));
        this.$.signal_manager.connect(this.menu, "open-state-changed", function(aMenu, aOpen) {
            this._onOpenStateChanged(aMenu, aOpen);
        }.bind(this));
    }

    _onOpenStateChanged(aMenu, aOpen) {
        if (!aOpen) {
            this.closeContextMenu(false);
        }
    }

    _informFailSafeBreached() {
        this.$.schedule_manager.setTimeout("inform_fail_safe_breached", function() {
            this._emptyInfo.actor.hide();
            this._failSafeBreachedInfo.actor.show();

            let msg;

            if (this.max_files_to_list_breached) {
                msg = _("One of the folders inside the main directory has an excessive amount of files/folders.");
            } else {
                msg = _("The maximum amount of files/folders allowed to be used to build the menu has been breached.");
            }

            msg = msg + "\n" + _("You can either change the setting to allow more files to be handled or change to a different main directory.");

            this._failSafeBreachedInfo.tooltip.set_text(msg);

            Notification.notify(
                escapeHTML(msg),
                NotificationUrgency.CRITICAL
            );
        }.bind(this), 2000);
    }

    _buildInfoItems() {
        if (this._emptyInfo) {
            this._emptyInfo.destroy();
            this._emptyInfo = null;
        }

        if (this._failSafeBreachedInfo) {
            this._failSafeBreachedInfo.destroy();
            this._failSafeBreachedInfo = null;
        }

        this._emptyInfo = new PopupMenu.PopupMenuItem(_("No directory set or it's empty"), {
            reactive: false,
            activate: false,
            hover: false,
            sensitive: false,
            focusOnHover: false
        });
        this.menu.addMenuItem(this._emptyInfo);

        this._failSafeBreachedInfo = new PopupMenu.PopupIconMenuItem(
            _("Fail safe breached"),
            "dialog-warning",
            St.IconType.FULLCOLOR, {
                reactive: true, // NOTE: To allow showing the tooltip.
                activate: false,
                hover: false,
                sensitive: false,
                focusOnHover: false
            }
        );
        // NOTE: Without setting show_on_set_parent to false, when calling hide() inside
        // this._updateMenu it will not f*cking hide it!!!
        this._failSafeBreachedInfo.actor.show_on_set_parent = false;
        this._failSafeBreachedInfo.tooltip = new IntelligentTooltip(
            this._failSafeBreachedInfo.actor,
            ""
        );
        this.menu.addMenuItem(this._failSafeBreachedInfo);
    }

    handleDragOver(aSource) {
        if (!(this.$._.main_directory && aSource &&
                aSource.hasOwnProperty("isDraggableApp") && aSource.isDraggableApp) ||
            global.settings.get_boolean("panel-edit-mode")) {
            return DND.DragMotionResult.NO_DROP;
        }

        return DND.DragMotionResult.COPY_DROP;
    }

    acceptDrop(aSource, aDragActor) {
        if (this.$._.main_directory &&
            aSource &&
            aSource.hasOwnProperty("isDraggableApp") &&
            aSource.isDraggableApp &&
            !global.settings.get_boolean("panel-edit-mode")) {
            tryFn(() => {
                const originDesktopFilePath = aSource.app.get_app_info().get_filename();

                if (originDesktopFilePath) {
                    const targetDesktopFilePath = this.$._.main_directory + "/" +
                        GLib.path_get_basename(originDesktopFilePath);
                    const originDesktopFile = new File(originDesktopFilePath);
                    originDesktopFile.copy(targetDesktopFilePath)
                        .then(() => {
                            this.updateMenu();
                            originDesktopFile.destroy();
                        })
                        .catch((aErr) => global.logError(aErr));
                }
            }, (aErr) => global.logError(aErr));

            return Clutter.EVENT_STOP;
        }

        aDragActor.destroy();

        return Clutter.EVENT_PROPAGATE;
    }

    closeContextMenu(aAnimate) {
        if (!this.contextMenu || !this.contextMenu.isOpen) {
            return;
        }

        if (aAnimate) {
            this.contextMenu.toggle();
        } else {
            this.contextMenu.close();
        }
    }

    toggleContextMenu(aButton) {
        this.$.schedule_manager.clearSchedule("toggle_context_menu");

        if (!aButton.isDeskFile) {
            this.closeContextMenu(false);

            return;
        }

        this.$.schedule_manager.setTimeout("toggle_context_menu", function() {
            const currentParent = aButton.actor.get_parent();

            if (this.contextMenu && this.contextMenuParent !== currentParent) {
                this.contextMenu.close();
                this.contextMenu.destroy();
                this.contextMenu = null;
                this.contextMenuParent = null;
            }

            if (!this.contextMenuParent) {
                this.contextMenuParent = currentParent;
            }

            if (!this.contextMenu) {
                /* NOTE: Creating a PopupSubMenu without sourceActor.
                 */
                const menu = new PopupMenu.PopupSubMenu(null);
                menu.connect("open-state-changed",
                    (aMenu) => this._contextMenuOpenStateChanged(aMenu));
                this.contextMenu = menu;
                this.contextMenuParent.add_actor(menu.actor);
            }

            if (this.contextMenu.sourceActor !== aButton.actor && this.contextMenu.isOpen) {
                this.contextMenu.close();
            }

            if (!this.contextMenu.isOpen) {
                this.contextMenu.box.destroy_all_children();
                this.contextMenuParent.set_child_above_sibling(this.contextMenu.actor, aButton.actor);
                this.contextMenu.sourceActor = aButton.actor;
                aButton.populateMenu(this.contextMenu);
            }

            this.contextMenu.toggle();
        }.bind(this), 50);
    }

    _contextMenuOpenStateChanged(aMenu) {
        if (!aMenu.isOpen) {
            aMenu.sourceActor = null;
        }
    }

    dealWithFolderMonitor(aRemove) {
        if (this.main_folder_monitor && this.main_folder_monitor_id > 0) {
            this.main_folder_monitor.disconnect(this.main_folder_monitor_id);
        }

        if (!this.$._.autoupdate || aRemove) {
            return;
        }

        /* NOTE: Monitoring the directory is very limited. It doesn't monitor files
         * recursively and it doesn't even monitor file changes inside sub-folders.
         * The only solution would be to add a monitor per file,
         * which I will never even consider doing. That's why the Auto-update menu
         * option is disabled by default, it's totally useless.
         */
        if (this._main_directory && this._main_directory.is_directory) {
            this.main_folder_monitor = Gio.file_new_for_path(this.$._.main_directory)
                .monitor_directory(Gio.FileMonitorFlags.NONE, null);
            this.main_folder_monitor_id = this.main_folder_monitor.connect("changed",
                (aMonitor, aFileObj, aN, aEventType) => {
                    this._onMainFolderChanged(aMonitor, aFileObj, aN, aEventType);
                });
        }
    }

    _onMainFolderChanged(aMonitor, aFileObj, aN, aEventType) {
        if (aEventType === Gio.FileMonitorEvent.DELETED ||
            aEventType === Gio.FileMonitorEvent.RENAMED ||
            aEventType === Gio.FileMonitorEvent.ATTRIBUTE_CHANGED ||
            aEventType === Gio.FileMonitorEvent.CHANGES_DONE_HINT ||
            aEventType === Gio.FileMonitorEvent.CREATED ||
            aEventType === Gio.FileMonitorEvent.MOVED ||
            aEventType === Gio.FileMonitorEvent.MOVED_OUT) {
            this.$.schedule_manager.setTimeout("folder_changed", function() {
                this.updateMenu();
            }.bind(this), 1000);
        }
    }

    _subMenuOpenStateChanged(aMenu, aOpen) {
        if (aOpen) {
            for (const item of aMenu._getTopMenu()._getMenuItems()) {
                if (item instanceof CustomSubMenuMenuItem) {
                    if (aMenu !== item.menu) {
                        item.menu.close(true);
                    }
                }
            }
        }
    }

    updateMenu(aRightNow) {
        this.$.schedule_manager.setTimeout("update_menu", function() {
            if (!this._main_directory) {
                this._main_directory = new File(this.$._.main_directory);
                this._main_directory.is_directory && this._updateMenu();
            } else {
                this._updateMenu();
            }
        }.bind(this), aRightNow ? 10 : 1000);
    }

    _updateMenu() {
        this.total_handled_files_counter = 0;
        this.max_files_to_list_breached = false;
        this._emptyInfo.actor.show();
        this._failSafeBreachedInfo.actor.hide();
        this._subMenusStorage.clear();
        this._contentSection.removeAll();
        // TODO: Investigate if this._contentSection can be re-allocated (if that's the right term).
        // If I don't force to zero and then to -1 (auto?), when the menu is updated with less items
        // than it had, it will be displayed with the size it previously had.
        // I tried emitting the allocate and queue-relayout signals, but it didn't work.
        this._contentSection.actor.set_height(0);
        this._contentSection.actor.set_height(-1);
        this._contentSection.actor.set_width(0);
        this._contentSection.actor.set_width(-1);
        this._loadDir(this._main_directory, this._contentSection);
    }

    _loadDir(aRootDir, aMenu) {
        if (!aRootDir || !aMenu) {
            return;
        }

        if (this.total_handled_files_counter >= this.$._.max_files_to_handle_fail_safe ||
            this.max_files_to_list_breached) {
            this._informFailSafeBreached();
            return;
        }

        const isMainDirectory = aRootDir === this._main_directory;
        const rootDirObj = isMainDirectory ? this._main_directory : new File(aRootDir);
        rootDirObj.listDir({
            attributes: [
                Gio.FILE_ATTRIBUTE_STANDARD_IS_HIDDEN,
                Gio.FILE_ATTRIBUTE_STANDARD_IS_SYMLINK,
                Gio.FILE_ATTRIBUTE_STANDARD_NAME,
                Gio.FILE_ATTRIBUTE_STANDARD_SIZE,
                Gio.FILE_ATTRIBUTE_STANDARD_TYPE
            ],
            max_files_fail_safe: this.$._.max_files_to_list_fail_safe
        }).then((aParams) => {
            this.max_files_to_list_breached = aParams.fail_safe_breached;

            const dirs = [];
            const files = [];
            for (const fileInfo of aParams.files_info) {
                const fileName = fileInfo.get_name();
                const fileType = fileInfo.get_file_type();

                if (fileType === Gio.FileType.DIRECTORY) {
                    if (!this.$._.create_sub_menus ||
                        this.dirs_blacklist.has(fileName)) {
                        return;
                    }

                    // NOTE: I can't use the Gio.FILE_ATTRIBUTE_STANDARD_IS_HIDDEN flag to ignore
                    // hidden files because I have separated settings for files and folders.
                    if (!this.$._.show_hidden_folders && fileName.startsWith(".")) {
                        return;
                    }

                    dirs.push({
                        folderName: fileName,
                        iconName: this.$._.icon_for_submenus
                    });
                } else {
                    if (this.$._.parse_directory_files_for_icons &&
                        !isMainDirectory && fileName === ".directory" &&
                        this._subMenusStorage.has(rootDirObj.path)) {
                        this._subMenusStorage.get(rootDirObj.path).setIconFromDirectoryFile();
                    }

                    if (this.files_blacklist.has(fileName)) {
                        return;
                    }

                    let filePath = `${rootDirObj.path}/${fileName}`;
                    const contentType = Gio.content_type_guess(filePath, null);
                    const isDeskFile = contentType.includes("application/x-desktop");

                    if (this.$._.show_only_desktop_files && !isDeskFile) {
                        return;
                    }

                    // NOTE: I can't use the Gio.FILE_ATTRIBUTE_STANDARD_IS_HIDDEN flag to ignore
                    // hidden files because I have separated settings for files and folders.
                    if (!this.$._.show_hidden_files && fileName.startsWith(".")) {
                        return;
                    }

                    const isSymlink = GLib.file_test(filePath, GLib.FileTest.IS_SYMLINK);

                    // If in the presence of a symlink, use the path to the "real file",
                    // not the path to the symlink.
                    if (isSymlink) {
                        filePath = GLib.file_read_link(filePath);
                    }

                    // If the symlink leads to an invalid file, ignore it.
                    if (isSymlink && !GLib.file_test(filePath, GLib.FileTest.EXISTS)) {
                        return;
                    }

                    let app = Gio.file_new_for_path(filePath);

                    if (!app) {
                        global.logError(`File ${filePath} not found`);
                        return;
                    }

                    if (isDeskFile) {
                        app = Gio.DesktopAppInfo.new_from_filename(filePath);
                    }

                    if (!app) {
                        return;
                    }

                    files.push({
                        app: app,
                        name: (isDeskFile ?
                            app.get_name() :
                            fileName)
                    });
                }
            }

            this._populateMenu(aMenu, dirs, files, rootDirObj.path);
            isMainDirectory || rootDirObj.destroy();
        }).catch((aErr) => global.logError(aErr));
    }

    _populateMenu(aMenu, aFolders, aFiles, aDir) {
        // Populate dirs first
        const foldersLen = aFolders.length;

        if (this.$._.create_sub_menus && foldersLen > 0) {
            this.total_handled_files_counter += foldersLen;

            aFolders = aFolders.sort((a, b) => {
                return a.folderName.localeCompare(b.folderName);
            });

            for (const folder of aFolders) {

                if (this.total_handled_files_counter >= this.$._.max_files_to_handle_fail_safe ||
                    this.max_files_to_list_breached) {
                    this._informFailSafeBreached();
                    return false;
                }

                const dirPath = `${aDir}/${folder.folderName}`;
                const submenu = new CustomSubMenuMenuItem(this, {
                    folderName: folder.folderName,
                    iconName: folder.iconName,
                    folderPath: dirPath
                });

                this._loadDir(dirPath, submenu.menu);

                if (this.$._.parse_directory_files_for_icons) {
                    this._subMenusStorage.set(dirPath, submenu);
                }

                // NOTE: Only auto-close first level sub-menus.
                if (aDir === this.$._.main_directory && this.$._.auto_close_opened_sub_menus) {
                    submenu.menu.connect("open-state-changed",
                        (aMenu, aOpen) => this._subMenuOpenStateChanged(aMenu, aOpen));
                }

                aMenu.addMenuItem(submenu);
            }

            if (this._emptyInfo.actor.visible) {
                this._emptyInfo.actor.hide();
            }
        }

        // Populate files
        const filesLen = aFiles.length;
        this.total_handled_files_counter += filesLen;

        if (filesLen > 0) {
            aFiles = aFiles.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });

            for (const file of aFiles) {
                if (this.total_handled_files_counter >= this.$._.max_files_to_handle_fail_safe ||
                    this.max_files_to_list_breached) {
                    this._informFailSafeBreached();
                    break;
                }

                const item = new FileMenuItem(this, file);

                if (!item) {
                    continue;
                }

                aMenu.addMenuItem(item);
            }

            if (this._emptyInfo.actor.visible) {
                this._emptyInfo.actor.hide();
            }
        }
    }

    _updateBlackList(aPref) {
        this[aPref].clear();
        this[aPref] = new Set(this.$._[aPref].split(";"));
    }

    _updateIconAndLabel() {
        this.__setAppletIcon(this.$._.applet_icon);
        this.set_applet_label(this.$._.applet_label);
    }

    _expandAppletContextMenu() {
        let menuitem = new PopupMenu.PopupIconMenuItem(_("Update menu"),
            "edit-redo",
            St.IconType.SYMBOLIC);
        menuitem.connect("activate", () => this.updateMenu(true));
        menuitem.tooltip = new Tooltips.Tooltip(menuitem.actor,
            _("Scan the main folder to re-create the menu."));
        this._applet_context_menu.addMenuItem(menuitem);

        menuitem = new PopupMenu.PopupIconMenuItem(_("Open folder"),
            "folder",
            St.IconType.SYMBOLIC);
        menuitem.connect("activate", () => {
            launchUri(this.$._.main_directory);
        });
        menuitem.tooltip = new Tooltips.Tooltip(menuitem.actor, _("Open the main folder."));
        this._applet_context_menu.addMenuItem(menuitem);

        menuitem = new PopupMenu.PopupIconMenuItem(_("Help"),
            "dialog-information",
            St.IconType.SYMBOLIC);
        menuitem.connect("activate", () => this.__openHelpPage());
        menuitem.tooltip = new Tooltips.Tooltip(menuitem.actor, _("Open the help file."));
        this._applet_context_menu.addMenuItem(menuitem);

        this.__seekAndDetroyConfigureContext();
    }

    _updateKeybinding() {
        this.$.keybinding_manager.addKeybinding("toggle_menu", this.$._.toggle_menu_keybinding, () => {
            if (!Main.overview.visible && !Main.expo.visible) {
                this.menu.toggle();
            }
        });
    }

    on_orientation_changed(aOrientation) {
        super.on_orientation_changed(aOrientation);

        this.contextMenu && this.contextMenu.destroy();
        this.contextMenu = null;
        this.contextMenuParent = null;

        this._updateIconAndLabel();
        // NOTE: The re-built it due to one of the items having a tooltip.
        this._buildInfoItems();
        this.updateMenu();
    }

    on_applet_removed_from_panel() {
        this.dealWithFolderMonitor(true);
        this._subMenusStorage.clear();
        this._main_directory && this._main_directory.destroy();
        super.on_applet_removed_from_panel();
    }

    on_applet_clicked() { // jshint ignore:line
        this.menu.toggle();
    }

    __onSettingsChanged(aPrefOldValue, aPrefKey) {
        switch (aPrefKey) {
            case "main_directory":
                if (this.$._.main_directory !== this.main_directory_last) {
                    this.main_directory_last = this.$._.main_directory;
                    this.dealWithFolderMonitor();
                    this.updateMenu();
                }
                break;
            case "auto_close_opened_sub_menus":
            case "create_sub_menus":
            case "show_only_desktop_files":
            case "show_submenu_icons":
            case "show_menuitem_icons":
            case "show_hidden_files":
            case "show_hidden_folders":
            case "icon_for_submenus":
            case "sub_menu_icon_size":
            case "menuitem_icon_size":
            case "apply_styles":
            case "autoupdate":
            case "parse_directory_files_for_icons":
                aPrefKey === "autoupdate" && this.dealWithFolderMonitor();
                this.updateMenu();
                break;
            case "applet_label":
            case "applet_icon":
                this.$.schedule_manager.setTimeout("label_icon_changed", function() {
                    this._updateIconAndLabel();
                }.bind(this), 300);
                break;
            case "applet_tooltip":
                this.$.schedule_manager.setTimeout("applet_tooltip_changed", function() {
                    this.set_applet_tooltip(this.$._.applet_tooltip);
                }.bind(this), 300);
                break;
            case "toggle_menu_keybinding":
                this._updateKeybinding();
                break;
            case "files_blacklist":
            case "dirs_blacklist":
                this.$.schedule_manager.setTimeout("blacklist_changed", function() {
                    this._updateBlackList(aPrefKey);
                }.bind(this), 300);
                break;
        }
    }
}

function main() {
    Debugger.wrapObjectMethods({
        QuickMenu: QuickMenu
    });

    return new QuickMenu(...arguments);
}
