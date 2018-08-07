const AppletUUID = "{{UUID}}";

let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets[AppletUUID].utils;
}

const _ = $._;

const Applet = imports.ui.applet;
const Extension = imports.ui.extension;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Mainloop = imports.mainloop;
const Pango = imports.gi.Pango;
const PopupMenu = imports.ui.popupMenu;
const Settings = imports.ui.settings;
const St = imports.gi.St;
const Util = imports.misc.util;

function ExtensionsManagerApplet() {
    this._init.apply(this, arguments);
}

ExtensionsManagerApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(aMetadata, aOrientation, aPanel_height, aInstance_id) {
        Applet.TextIconApplet.prototype._init.call(this, aOrientation, aPanel_height, aInstance_id);

        // Needed for retro-compatibility
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.metadata = aMetadata;
        this.instance_id = aInstance_id;
        this.orientation = aOrientation;

        try {
            this._bindSettings();
            this.set_applet_tooltip(_(aMetadata.name));
            this._expandAppletContextMenu();
            Gtk.IconTheme.get_default().append_search_path(this.metadata.path + "/icons/");
        } catch (aErr) {
            global.logError(aErr);
        }

        Mainloop.idle_add(() => {
            try {
                this.menuManager = new PopupMenu.PopupMenuManager(this);
                this.spices_data = null;
                this.spices_file_path = GLib.get_home_dir() + "/.cinnamon/spices.cache/extension/index.json";
                this._buildMenuId = null;
                this._populateSubMenusId = 0;
                this._spicesCacheUpdatedId = null;
                this._forceMenuRebuild = false;
                this._forceMenuRebuildDelay = 200;

                global.settings.connect("changed::enabled-extensions",
                    () => {
                        this._forceMenuRebuild = this.menu && !this.menu.isOpen;
                        this._forceMenuRebuildDelay = 1000;
                        this._populateSubMenus();
                    });

                let extSpicesCache = Gio.file_new_for_path(this.spices_file_path);
                this._monitor = extSpicesCache.monitor(Gio.FileMonitorFlags.NONE, null);
                this._monitor.connect("changed",
                    (aMonitor, aFileObj, aN, aEventType) => {
                        this._spices_cache_updated(aMonitor, aFileObj, aN, aEventType);
                    }
                );

                this._updateIconAndLabel();

                if (this.pref_initial_load_done) {
                    this._build_menu();
                } else {
                    this.store_extension_data();
                    this.pref_initial_load_done = true;
                }
            } catch (aErr) {
                global.logError(aErr);
            }
        });
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
            if (this.pref_custom_label_for_applet === "") {
                this.hide_applet_label(true);
            } else {
                this.hide_applet_label(false);
            }
        }
    },

    on_orientation_changed: function(orientation) {
        this.orientation = orientation;
        this.menu.destroy();
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);
        this.menu.connect("open-state-changed",
            (aMenu, aOpen) => this._onOpenStateChanged(aMenu, aOpen));
        this._updateIconAndLabel();
    },

    _expandAppletContextMenu: function() {
        let menuItem = new PopupMenu.PopupIconMenuItem(
            _("Open extensions manager"),
            "extensions-manager-cs-extensions",
            St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => {
            try {
                Util.spawn_async(["cinnamon-settings", "extensions"]);
            } catch (aErr) {
                global.logError(aErr);
            }
        });
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Disable all extensions"),
            "edit-delete",
            St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => {
            try {
                let dialog = new $.ConfirmationDialog(() => {
                        Util.spawn_async(["gsettings", "reset", "org.cinnamon", "enabled-extensions"],
                            () => this._build_menu());
                    },
                    "Extensions",
                    _("This will disable all active extensions. Are you sure you want to do this?"));
                dialog.open();
            } catch (aErr) {
                global.logError(aErr);
            }
        });
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Refresh extension list"),
            "extensions-manager-refresh-icon",
            St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => this.store_extension_data());
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Restart Cinnamon"),
            "extensions-manager-view-refresh",
            St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => global.reexec_self());
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Debug"),
            "extensions-manager-debugging",
            St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => {
            Util.spawn_async([this.metadata.path + "/appletHelper.py", "--debug-window"], null);
        });
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Help"),
            "dialog-information",
            St.IconType.SYMBOLIC
        );
        menuItem.connect("activate", () => {
            Util.spawn_async(["xdg-open", this.metadata.path + "/HELP.html"], null);
        });
        this._applet_context_menu.addMenuItem(menuItem);
    },

    getEnabledExtensionsUUIDs: function() {
        return global.settings.get_strv("enabled-extensions");
    },

    setEnabledExtensionsUUIDs: function(aExtensionsArray) {
        global.settings.set_strv("enabled-extensions", aExtensionsArray);
    },

    _bindSettings: function() {
        this.settings = new Settings.AppletSettings(this, this.metadata.uuid, this.instance_id);
        // Needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        let bD = {
            IN: 1,
            OUT: 2,
            BIDIRECTIONAL: 3
        };
        let prefKeysArray = [
            "pref_initial_load_done",
            "pref_max_width_for_menu_items_label",
            "pref_set_max_menu_height",
            "pref_max_menu_height",
            "pref_enabled_extensions_style",
            "pref_disabled_extensions_style",
            "pref_keep_enabled_extension_menu_open",
            "pref_keep_disabled_extension_menu_open",
            "pref_show_config_button",
            "pref_show_spices_button",
            "pref_show_open_extension_folder_button",
            "pref_show_edit_extension_file_button",
            "pref_use_extension_names_as_label",
            "pref_keep_only_one_menu_open",
            "pref_extension_icon_size",
            "pref_extension_options_icon_size",
            "pref_icons_on_menu",
            "pref_all_extensions_list",
            "pref_custom_icon_for_applet",
            "pref_custom_label_for_applet"
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

    on_applet_clicked: function() {
        this.menu.toggle(true);
    },

    /**
     * Triggered only by the changes made to the monitored index.json file on Spices cache folder.
     */
    _spices_cache_updated: function(aMonitor, aFileObj, aN, aEventType) {
        if (aEventType && aEventType === Gio.FileMonitorEvent.CHANGES_DONE_HINT) {
            if (this._spicesCacheUpdatedId) {
                Mainloop.source_remove(this._spicesCacheUpdatedId);
                this._spicesCacheUpdatedId = null;
            }

            this._spicesCacheUpdatedId = Mainloop.timeout_add(3000,
                () => this.store_extension_data());
        }
    },

    /**
     * @param  {String} aResponse Data returned by the appletHelper.py script
     * @return {Nothing}
     */
    store_extension_data: function() {
        try {
            Util.spawn_async([this.metadata.path + "/appletHelper.py", "--list"],
                (aResponse) => {
                    let extensionData;
                    try {
                        extensionData = JSON.parse(aResponse);
                    } catch (aErr) {
                        let msg = _("Source of error: %s").format("appletHelper.py --list");
                        $.informJSONError(msg);
                        global.logError(_(this.metadata.name) + ":\n" + msg + "\n" + aErr);
                        extensionData = {};
                    }

                    try {
                        let spicesCacheFile = Gio.file_new_for_path(this.spices_file_path);
                        if (spicesCacheFile.query_exists(null)) {
                            spicesCacheFile.load_contents_async(null,
                                (aFile, aResponce) => {
                                    let rawData;
                                    try {
                                        rawData = aFile.load_contents_finish(aResponce)[1];
                                    } catch (aErr) {
                                        global.logError("ERROR: " + aErr.message);
                                        this.store_spices_data(null, extensionData);
                                        return;
                                    }

                                    this.store_spices_data(rawData, extensionData);
                                });
                        } else {
                            this.store_spices_data(null, extensionData);
                        }
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                });
            this._spicesCacheUpdatedId = null;
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    /**
     * Store Spices data to the extensions data.
     * Done from JavaScript to avoid importing the "Spices harvester" in the appletHelper.py script.
     * @param  {String} aResponse Data returned by reading the index.json file on Spices cache folder
     * @return {Nothing}
     */
    store_spices_data: function(aResponse, aExtensionData) {
        let spicesData;
        try {
            spicesData = JSON.parse(aResponse);
        } catch (aErr) {
            let msg = _("Source of error: %s").format("Spices cache file");
            $.informJSONError(msg);
            global.logError(_(this.metadata.name) + ":\n" + msg + "\n" + aErr);
            spicesData = null;
        }

        let finalExtensionData;
        try {
            finalExtensionData = Object.keys(aExtensionData).map((aKey) => {
                let extObj = aExtensionData[aKey];
                extObj["spices_id"] = spicesData ?
                    (spicesData[extObj.uuid] ?
                        spicesData[extObj.uuid]["spices-id"] :
                        "") :
                    "";
                return extObj;
            });
        } catch (aErr) {
            global.logError(aErr);
            finalExtensionData = [];
        } finally {
            try {
                if (finalExtensionData.length > 1) {
                    finalExtensionData = finalExtensionData.sort((a, b) => {
                        if (this.pref_use_extension_names_as_label) {
                            return a.name.localeCompare(b.name);
                        }
                        return a.uuid.localeCompare(b.uuid);
                    });
                }
            } finally {
                this.pref_all_extensions_list = finalExtensionData;
                this._build_menu();
            }
        }

    },

    _onOpenStateChanged: function(menu, open) {
        if (this.pref_set_max_menu_height) {
            menu.actor.style = ("max-height: " + this.pref_max_menu_height + "px;");
        }

        this._populateSubMenus();
        if (open) {
            this.actor.add_style_pseudo_class("active");
            this.ignore = true;
            if (this.pref_keep_enabled_extension_menu_open) {
                this.enabledExtSubmenu.menu.open(false);
            }

            if (this.pref_keep_disabled_extension_menu_open) {
                this.disabledExtSubmenu.menu.open(false);
            }
            this.ignore = false;
        } else {
            this.actor.remove_style_pseudo_class("active");
        }
    },

    _build_menu: function() {
        if (this._buildMenuId) {
            Mainloop.source_remove(this._buildMenuId);
            this._buildMenuId = null;
        }

        this._buildMenuId = Mainloop.timeout_add(500, () => {
            if (this.menu) {
                this.menuManager.removeMenu(this.menu);
                this.menu.destroy();
            }

            this.menu = new Applet.AppletPopupMenu(this, this.orientation);
            this.menu.connect("open-state-changed",
                (aMenu, aOpen) => this._onOpenStateChanged(aMenu, aOpen));
            this.menuManager.addMenu(this.menu);

            this._forceMenuRebuild = true;
            this._populateSubMenus();
            this._buildMenuId = null;
        });
    },

    _populateSubMenus: function() {
        let enabledExtensionsGSetting = this.getEnabledExtensionsUUIDs();

        if (this._populateSubMenusId > 0) {
            Mainloop.source_remove(this._populateSubMenusId);
            this._populateSubMenusId = 0;
        }

        this._populateSubMenusId = Mainloop.timeout_add(this._forceMenuRebuildDelay,
            () => {
                if (this.pref_all_extensions_list.length === 0) {
                    this.menu.removeAll();
                    let label = new $.GenericButton(_("There aren't any extensions installed on your system. Or you may need to refresh the list of extensions from this applet context menu."));
                    label.label.set_style("text-align: left;max-width: 20em;");
                    label.label.get_clutter_text().set_line_wrap(true);
                    label.label.get_clutter_text().set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
                    label.label.get_clutter_text().ellipsize = Pango.EllipsizeMode.NONE; // Just in case
                    this.menu.addMenuItem(label);
                }

                if (!this._forceMenuRebuild || this.menu.isOpen) {
                    this._populateSubMenusId = 0;
                    return;
                }

                if (this.enabledExtSubmenu) {
                    this.enabledExtSubmenu.destroy();
                }

                if (this.disabledExtSubmenu) {
                    this.disabledExtSubmenu.destroy();
                }

                this.enabledExtSubmenu = new PopupMenu.PopupSubMenuMenuItem("");
                this.enabledExtSubmenu.menu.connect("open-state-changed",
                    (aMenu, aOpen) => this._subMenuOpenStateChanged(aMenu, aOpen));
                this.menu.addMenuItem(this.enabledExtSubmenu);

                this.disabledExtSubmenu = new PopupMenu.PopupSubMenuMenuItem("");
                this.disabledExtSubmenu.menu.connect("open-state-changed",
                    (aMenu, aOpen) => this._subMenuOpenStateChanged(aMenu, aOpen));
                this.menu.addMenuItem(this.disabledExtSubmenu);

                this.enabledExtSubmenu.menu.removeAll();
                this.disabledExtSubmenu.menu.removeAll();
                this._update_menu_items_style();

                let e = 0,
                    eCount = 0,
                    dCount = 0,
                    eLen = this.pref_all_extensions_list.length;

                try {
                    for (; e < eLen; e++) {
                        let extObj = this.pref_all_extensions_list[e];
                        let prefix = extObj.version_supported ? "" : "!";
                        extObj.is_enabled = enabledExtensionsGSetting.indexOf(prefix + extObj.uuid) !== -1;

                        let item = null;
                        try {
                            item = new $.CustomSwitchMenuItem(this, extObj);
                        } catch (aErr) {
                            global.logError(aErr);
                        }

                        if (!item) {
                            continue;
                        }

                        item.connect("toggled",
                            (aSwitch) => this._toggleExtensionState(aSwitch));

                        if (extObj.is_enabled) {
                            eCount++;
                            this.enabledExtSubmenu.menu.addMenuItem(item);
                        } else {
                            dCount++;
                            this.disabledExtSubmenu.menu.addMenuItem(item);
                        }
                    }
                } catch (aErr) {
                    global.logError(aErr);
                } finally {
                    try {

                        this.enabledExtSubmenu.label.set_text(_("Enabled extensions") + " (" + eCount + ")");
                        let label;
                        if (eCount === 0) {
                            label = new $.GenericButton(_("No enabled extensions"));
                            this.enabledExtSubmenu.menu.addMenuItem(label);
                        }

                        this.disabledExtSubmenu.label.set_text(_("Disabled extensions") + " (" + dCount + ")");
                        if (dCount === 0) {
                            label = new $.GenericButton(_("No disabled extensions"));
                            this.disabledExtSubmenu.menu.addMenuItem(label);
                        }
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                }

                this._forceMenuRebuild = false;
                this._forceMenuRebuildDelay = 200;
                this._populateSubMenusId = 0;
            });
    },

    _toggleExtensionState: function(aSwitch) {
        let enabledExtensions = this.getEnabledExtensionsUUIDs();
        let uuid = aSwitch.extension.uuid;

        this._forceMenuRebuild = true;

        switch (aSwitch.state) {
            case true:
                if (aSwitch.extension.version_supported) {
                    Extension.loadExtension(uuid, Extension.Type.EXTENSION);
                    enabledExtensions.push(uuid);
                    this.setEnabledExtensionsUUIDs(enabledExtensions);
                    aSwitch.extension.is_enabled = true;
                } else {
                    let dialog = new $.ConfirmationDialog(() => {
                            aSwitch.extension.is_enabled = true;
                            Extension.loadExtension("!" + uuid, Extension.Type.EXTENSION);
                            enabledExtensions.push("!" + uuid);
                            this.setEnabledExtensionsUUIDs(enabledExtensions);
                            this._forceMenuRebuild = true;
                            this._populateSubMenus();
                        },
                        "Extensions",
                        _("Extension %s is not compatible with current version of cinnamon. Using it may break your system. Load anyway?")
                        .format(aSwitch.extension.name));
                    dialog.open();
                }
                break;
            case false:
                if (aSwitch.extension.version_supported) {
                    Extension.unloadExtension(uuid, Extension.Type.EXTENSION);
                    enabledExtensions.splice(enabledExtensions.indexOf(uuid), 1);
                    this.setEnabledExtensionsUUIDs(enabledExtensions);
                } else {
                    Extension.unloadExtension("!" + uuid, Extension.Type.EXTENSION);
                    enabledExtensions.splice(enabledExtensions.indexOf("!" + uuid), 1);
                    this.setEnabledExtensionsUUIDs(enabledExtensions);
                }
                aSwitch.extension.is_enabled = false;
                break;
        }
    },

    _subMenuOpenStateChanged: function(aMenu, aOpen) {
        if (this.ignore || !this.pref_keep_only_one_menu_open) {
            return;
        }

        if (aOpen) {
            let children = aMenu._getTopMenu()._getMenuItems();
            let i = 0,
                iLen = children.length;
            for (; i < iLen; i++) {
                let item = children[i];
                if (item instanceof PopupMenu.PopupSubMenuMenuItem) {
                    if (aMenu !== item.menu) {
                        item.menu.close(true);
                    }
                }
            }
        }
    },

    _update_menu_items_style: function() {
        this.enabledExtSubmenu.label.set_style(this.pref_enabled_extensions_style);
        this.disabledExtSubmenu.label.set_style(this.pref_disabled_extensions_style);
    },

    _updateIconAndLabel: function() {
        let icon = this.pref_custom_icon_for_applet;
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

        if (this.pref_custom_icon_for_applet === "") {
            this._applet_icon_box.hide();
        } else {
            this._applet_icon_box.show();
        }

        // No menu label if in a vertical panel
        if (this.orientation === St.Side.LEFT || this.orientation === St.Side.RIGHT) {
            this.set_applet_label("");
        } else {
            if (this.pref_custom_label_for_applet !== "") {
                this.set_applet_label(_(this.pref_custom_label_for_applet));
            } else {
                this.set_applet_label("");
            }
        }

        this.updateLabelVisibility();
    },

    on_applet_removed_from_panel: function() {
        this.settings.finalize();
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
            case "pref_max_width_for_menu_items_label":
            case "pref_show_config_button":
            case "pref_show_spices_button":
            case "pref_show_open_extension_folder_button":
            case "pref_show_edit_extension_file_button":
            case "pref_use_extension_names_as_label":
            case "pref_extension_icon_size":
            case "pref_extension_options_icon_size":
            case "pref_icons_on_menu":
                this._build_menu();
                break;
            case "pref_enabled_extensions_style":
            case "pref_disabled_extensions_style":
                this._update_menu_items_style();
                break;
            case "pref_custom_icon_for_applet":
            case "pref_custom_label_for_applet":
                this._updateIconAndLabel();
                break;
        }
    }
};

function main(aMetadata, aOrientation, aPanel_height, aInstance_id) {
    return new ExtensionsManagerApplet(aMetadata, aOrientation, aPanel_height, aInstance_id);
}
