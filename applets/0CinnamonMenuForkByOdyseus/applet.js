let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
}

const _ = $._;

const AppFavorites = imports.ui.appFavorites;
const Applet = imports.ui.applet;
const Atk = imports.gi.Atk;
const Cinnamon = imports.gi.Cinnamon;
const Clutter = imports.gi.Clutter;
const CMenu = imports.gi.CMenu;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Meta = imports.gi.Meta;
const PopupMenu = imports.ui.popupMenu;
const Settings = imports.ui.settings;
const St = imports.gi.St;
const Util = imports.misc.util;

let appsys = Cinnamon.AppSystem.get_default();

function CinnamonMenuSecondGeneration() {
    this._init.apply(this, arguments);
}

CinnamonMenuSecondGeneration.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
        Applet.TextIconApplet.prototype._init.call(this, aOrientation, aPanelHeight, aInstanceID);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.initial_load_done = false;
        this.metadata = aMetadata;
        this.orientation = aOrientation;
        this.instance_id = aInstanceID;

        try {
            this._bindSettings();
            this.set_applet_tooltip(_("Menu"));
            this._performConditionalImports();
            this._expandAppletContextMenu();
            Gtk.IconTheme.get_default().append_search_path(this.metadata.path + "/icons/");
        } catch (aErr) {
            global.logError(aErr);
        }

        Mainloop.idle_add(() => {
            try {
                this.menuManager = new PopupMenu.PopupMenuManager(this);
                this.menu = new Applet.AppletPopupMenu(this, aOrientation);
                this.menuManager.addMenu(this.menu);
                this.menu_keybinding_name = this.metadata.uuid + "-" + this.instance_id;

                this._appletEnterEventId = 0;
                this._appletLeaveEventId = 0;
                this._appletHoverDelayId = 0;
                this._hardRefreshTimeout = 0;
                this._updateRecentAppsId = 0;
                this._recentFilesManagerId = 0;
                this._privacySettingsId = 0;

                this._recentAppsButtons = [];
                this._recentAppsApps = [];

                // Condition needed for retro-compatibility.
                // Mark for deletion on EOL. Cinnamon 3.2.x+
                // Keep the use of this.menu.setCustomStyleClass.
                if (typeof this.menu.setCustomStyleClass === "function") {
                    this.menu.setCustomStyleClass("menu-background");
                } else {
                    this.menu.actor.add_style_class_name("menu-background");
                }

                this._searchInactiveIcon = new St.Icon({
                    style_class: "menu-search-entry-icon",
                    icon_name: "edit-find",
                    icon_type: St.IconType.SYMBOLIC
                });
                this._searchActiveIcon = new St.Icon({
                    style_class: "menu-search-entry-icon",
                    icon_name: "edit-clear",
                    icon_type: St.IconType.SYMBOLIC
                });
                this._searchIconClickedId = 0;
                this._applicationsButtons = [];
                this._applicationsButtonFromApp = {};
                this._placesButtons = [];
                this._transientButtons = [];
                this.recentButton = null;
                this._recentButtons = [];
                this._categoryButtons = [];
                this._searchProviderButtons = [];
                this._selectedItemIndex = null;
                this._previousSelectedActor = null;
                this._previousVisibleIndex = null;
                this._previousTreeSelectedActor = null;
                this._activeContainer = null;
                this._activeActor = null;
                this._applicationsBoxWidth = 0;
                this.menuIsOpening = false;
                this._knownApps = [];
                this._appsWereRefreshed = false;
                this.noRecentDocuments = true;
                this._activeContextMenuParent = null;
                this._activeContextMenuItem = null;
                this._display();
                this._fileFolderAccessActive = false;
                this.lastAcResults = [];
                this.refreshing = false;
                this.recentAppsManager = null;
                this.recentContextMenu = null;
                this.appsContextMenu = null;
                this.lastSelectedCategory = null;
                this.SearchProviderManager = null;
                this._pathCompleter = null;
                this.recentFilesManager = null;
                this.privacy_settings = null;

                this.actor.connect("key-press-event",
                    Lang.bind(this, this._onSourceKeyPress));
                this.menu.connect("open-state-changed",
                    Lang.bind(this, this._onOpenStateChanged));
                Main.themeManager.connect("theme-set",
                    Lang.bind(this, this._updateIconAndLabel));
                appsys.connect("installed-changed",
                    Lang.bind(this, this.onAppSysChanged));
                Main.placesManager.connect("places-updated",
                    Lang.bind(this, this._refreshBelowApps));

                this._setupFilesystemSearch();
                this._setupRecentFilesManager(true);
                this._setupRecentAppsManager();
                this._updateGlobalPreferences();
                this._updateActivateOnHover();
                this._updateKeybinding();
                this._updateIconAndLabel();

                // We shouldn't need to call refreshAll() here... since we get a "icon-theme-changed" signal when CSD starts.
                // The reason we do is in case the Cinnamon icon theme is the same as the one specificed in GTK itself (in .config)
                // In that particular case we get no signal at all.
                this._refreshAll();

                // Condition needed for retro-compatibility.
                // Mark for deletion on EOL. Cinnamon 3.2.x+
                // Remove condition.
                if (Applet.TextIconApplet.hasOwnProperty("set_show_label_in_vertical_panels")) {
                    this.set_show_label_in_vertical_panels(false);
                }
            } catch (aErr) {
                global.logError(aErr);
            }
        });
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
            "pref_activate_on_hover",
            "pref_use_a_custom_icon_for_applet",
            "pref_custom_icon_for_applet",
            "pref_custom_label_for_applet",
            "pref_overlay_key",
            "pref_show_category_icons",
            "pref_show_application_icons",
            "pref_animate_menu",
            "pref_search_filesystem",
            "pref_show_places",
            "pref_enable_autoscroll",
            "pref_menu_hover_delay",
            // Extras
            "pref_swap_categories_box",
            "pref_hide_applications_list_scrollbar",
            "pref_category_icon_size",
            "pref_application_icon_size",
            "pref_terminal_emulator",
            "pref_default_shell",
            "pref_privilege_elevator",
            "pref_context_custom_editor_for_edit_desktop_file",
            "pref_context_gain_privileges",
            "pref_custom_launchers",
            "pref_custom_launchers_icon_size",
            "pref_custom_launchers_box_alignment",
            "pref_max_width_for_buttons",
            "pref_custom_launchers_box_padding_top",
            "pref_custom_launchers_box_padding_right",
            "pref_custom_launchers_box_padding_bottom",
            "pref_custom_launchers_box_padding_left",
            "pref_categories_box_padding_top",
            "pref_categories_box_padding_right",
            "pref_categories_box_padding_bottom",
            "pref_categories_box_padding_left",
            "pref_applications_box_padding_top",
            "pref_applications_box_padding_right",
            "pref_applications_box_padding_bottom",
            "pref_applications_box_padding_left",
            "pref_search_entry_padding_top",
            "pref_search_entry_padding_right",
            "pref_search_entry_padding_bottom",
            "pref_search_entry_padding_left",
            "pref_search_box_padding_top",
            "pref_search_box_padding_right",
            "pref_search_box_padding_bottom",
            "pref_search_box_padding_left",
            "pref_custom_launchers_box_invert_buttons_order",
            "pref_invert_menu_layout",
            "pref_disable_new_apps_highlighting",
            "pref_show_recent_files",
            "pref_context_show_add_to_panel",
            "pref_context_show_add_to_desktop",
            "pref_context_show_add_remove_favorite",
            "pref_context_show_uninstall",
            "pref_context_show_bumblebee",
            "pref_context_show_run_as_root",
            "pref_context_show_edit_desktop_file",
            "pref_context_show_desktop_file_folder",
            "pref_context_show_run_from_terminal",
            "pref_context_show_run_from_terminal_as_root",
            "pref_recently_used_apps_enabled",
            "pref_recently_used_apps_ignore_favorites",
            "pref_recently_used_apps_invert_order",
            "pref_recently_used_apps_max_amount",
            "pref_search_providers_results_enabled",
            "pref_hard_refresh_menu"
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

    _expandAppletContextMenu: function() {
        let menuItem = new PopupMenu.PopupIconMenuItem(_("Open the menu editor"),
            "text-editor", St.IconType.SYMBOLIC);
        menuItem.connect("activate", Lang.bind(this, this._launch_editor));
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(_("Edit custom launchers"),
            "preferences-other", St.IconType.SYMBOLIC);
        menuItem.connect("activate", Lang.bind(this, function() {
            Util.spawn_async([this.metadata.path + "/appletHelper.py", this.instance_id], null);
        }));
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(_("Help"),
            "dialog-information", St.IconType.SYMBOLIC);
        menuItem.connect("activate", Lang.bind(this, function() {
            Util.spawn_async(["xdg-open", this.metadata.path + "/HELP.html"], null);
        }));
        this._applet_context_menu.addMenuItem(menuItem);
    },

    _performConditionalImports: function() {
        if (this.pref_search_providers_results_enabled && !this.SearchProviderManager) {
            this.SearchProviderManager = imports.ui.searchProviderManager;
        }

        if (this.SearchProviderManager && !this.pref_search_providers_results_enabled) {
            this.SearchProviderManager = null;
        }

        if (this.pref_show_recent_files && !this.SearchProviderManager) {
            this.DocInfo = imports.misc.docInfo;
        }

        if (this.SearchProviderManager && !this.pref_show_recent_files) {
            this.DocInfo = null;
        }
    },

    _setupFilesystemSearch: function() {
        if (this.pref_search_filesystem && !this._pathCompleter) {
            this._pathCompleter = new Gio.FilenameCompleter();
            this._pathCompleter.set_dirs_only(false);
        }

        if (this._pathCompleter && !this.pref_search_filesystem) {
            this._pathCompleter = null;
        }
    },

    _setupRecentFilesManager: function(aStartup) {
        if (!aStartup) {
            this._performConditionalImports();
        }

        if (this.recentFilesManager && this._recentFilesManagerId > 0) {
            this.recentFilesManager.disconnect(this._recentFilesManagerId);
        }

        if (this.privacy_settings && this._privacySettingsId > 0) {
            this.privacy_settings.disconnect(this._privacySettingsId);
        }

        if (this.pref_show_recent_files) {
            if (!this.privacy_settings) {
                this.privacy_settings = new Gio.Settings({
                    schema_id: $.PRIVACY_SCHEMA
                });
                this._privacySettingsId = this.privacy_settings.connect("changed::" + $.REMEMBER_RECENT_KEY,
                    Lang.bind(this, this._refreshRecent));
            }

            if (!this.recentFilesManager) {
                this.recentFilesManager = new this.DocInfo.DocManager();

                this._recentFilesManagerId = this.recentFilesManager.connect("changed",
                    Lang.bind(this, this._refreshRecent));
            }
        }

        if (this.recentFilesManager && !this.pref_show_recent_files) {
            this.recentFilesManager.disconnect(this._privacySettingsId);
            this.recentFilesManager = null;
        }

        if (this.privacy_settings && !this.pref_show_recent_files) {
            this.privacy_settings.disconnect(this._privacySettingsId);
            this.privacy_settings = null;
        }
    },

    _setupRecentAppsManager: function() {
        if (this.recentAppsManager && this._updateRecentAppsId > 0) {
            this.recentAppsManager.disconnect(this._updateRecentAppsId);
        }

        if (this.pref_recently_used_apps_enabled && !this.recentAppsManager) {
            this.recentAppsManager = new $.RecentAppsManager(this);
            this._updateRecentAppsId = this.recentAppsManager.connect(
                "changed::pref-recently-used-applications",
                Lang.bind(this, function() {
                    this._refreshRecentApps();
                })
            );
        }

        if (this.recentAppsManager && !this.pref_recently_used_apps_enabled) {
            this.recentAppsManager.destroy();
            this.recentAppsManager = null;
        }
    },

    _updateGlobalPreferences: function() {
        // Added the pref_context_show_uninstall check here so it doesn't have to check
        // file existence when disabled.
        this._canUninstallApps = this.pref_context_show_uninstall &&
            GLib.file_test("/usr/bin/cinnamon-remove-application", GLib.FileTest.EXISTS);

        // Added the pref_context_show_bumblebee check here so it doesn't have to check
        // file existence when disabled.
        this._isBumblebeeInstalled = this.pref_context_show_bumblebee &&
            GLib.file_test("/usr/bin/optirun", GLib.FileTest.EXISTS);

        this.max_width_for_buttons = "max-width: " + this.pref_max_width_for_buttons + "em;";
    },

    _updateKeybinding: function() {
        Main.keybindingManager.removeHotKey(this.menu_keybinding_name);
        Main.keybindingManager.addHotKey(this.menu_keybinding_name, this.pref_overlay_key, Lang.bind(this, function() {
            if (!Main.overview.visible && !Main.expo.visible) {
                this.menu.toggle_with_options(this.pref_animate_menu);
            }
        }));
    },

    onAppSysChanged: function() {
        if (this.refreshing == false) {
            this.refreshing = true;
            Mainloop.timeout_add_seconds(1, Lang.bind(this, this._refreshAll));
        }
    },

    _refreshAll: function() {
        try {
            this._refreshApps();
            this._refreshPlaces();
            this._refreshRecent();
            this._refreshRecentApps();
            this._resizeApplicationsBox();
        } catch (aErr) {
            global.logError(aErr);
        }
        this.refreshing = false;
    },

    _refreshBelowApps: function() {
        this._refreshPlaces();
        this._refreshRecent();
        this._resizeApplicationsBox();
    },

    openMenu: function() {
        if (!this._applet_context_menu.isOpen) {
            this.menu.open(this.pref_animate_menu);
        }
    },

    _clearDelayCallbacks: function() {
        if (this._appletHoverDelayId > 0) {
            Mainloop.source_remove(this._appletHoverDelayId);
            this._appletHoverDelayId = 0;
        }

        if (this._appletLeaveEventId > 0) {
            this.actor.disconnect(this._appletLeaveEventId);
            this._appletLeaveEventId = 0;
        }

        return false;
    },

    _updateActivateOnHover: function() {
        if (this._appletEnterEventId > 0) {
            this.actor.disconnect(this._appletEnterEventId);
            this._appletEnterEventId = 0;
        }

        this._clearDelayCallbacks();

        if (this.pref_activate_on_hover) {
            this._appletEnterEventId = this.actor.connect("enter-event", Lang.bind(this, function() {
                if (this.pref_menu_hover_delay > 0) {
                    this._appletLeaveEventId = this.actor.connect("leave-event", Lang.bind(this, this._clearDelayCallbacks));
                    this._appletHoverDelayId = Mainloop.timeout_add(this.pref_menu_hover_delay,
                        Lang.bind(this, function() {
                            this.openMenu();
                            this._clearDelayCallbacks();
                        }));
                } else {
                    this.openMenu();
                }
            }));
        }
    },

    _recalc_height: function() {
        let scrollBoxHeight = (this.categoriesBox.get_allocation_box().y2 - this.categoriesBox.get_allocation_box().y1) -
            (this.searchBox.get_allocation_box().y2 - this.searchBox.get_allocation_box().y1);

        scrollBoxHeight = scrollBoxHeight - (this.customLaunchersBox.get_allocation_box().y2 -
            this.customLaunchersBox.get_allocation_box().y1);

        this.applicationsScrollBox.style = "height: " + scrollBoxHeight / global.ui_scale + "px;";
    },

    on_orientation_changed: function(orientation) {
        this.orientation = orientation;

        this.menu.destroy();
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+.
        // Keep the use of this.menu.setCustomStyleClass.
        if (typeof this.menu.setCustomStyleClass === "function") {
            this.menu.setCustomStyleClass("menu-background");
        } else {
            this.menu.actor.add_style_class_name("menu-background");
        }

        this.menu.connect("open-state-changed", Lang.bind(this, this._onOpenStateChanged));
        this._display();

        if (this.initial_load_done) {
            this._refreshAll();
            this.initial_load_done = false;
        }
        this._updateIconAndLabel();
    },

    on_applet_added_to_panel: function() {
        this.initial_load_done = true;
    },

    on_applet_removed_from_panel: function() {
        Main.keybindingManager.removeHotKey(this.menu_keybinding_name);

        if (this.recentFilesManager && this._recentFilesManagerId > 0) {
            this.recentFilesManager.disconnect(this._recentFilesManagerId);
        }

        if (this.privacy_settings && this._privacySettingsId > 0) {
            this.privacy_settings.disconnect(this._privacySettingsId);
        }

        if (this.recentAppsManager && this._updateRecentAppsId > 0) {
            this.recentAppsManager.disconnect(this._updateRecentAppsId);
        }

        if (this._hardRefreshTimeout) {
            Mainloop.source_remove(this._hardRefreshTimeout);
            this._hardRefreshTimeout = 0;
        }

    },

    _launch_editor: function() {
        Util.spawnCommandLine("cinnamon-menu-editor");
    },

    on_applet_clicked: function(event) { // jshint ignore:line
        this.menu.toggle_with_options(this.pref_animate_menu);
    },

    _onSourceKeyPress: function(actor, event) {
        let symbol = event.get_key_symbol();

        if (symbol == Clutter.KEY_space || symbol == Clutter.KEY_Return) {
            this.menu.toggle();
            return true;
        } else if (symbol == Clutter.KEY_Escape && this.menu.isOpen) {
            this.closeMainMenu();
            return true;
        } else if (symbol == Clutter.KEY_Down) {
            if (!this.menu.isOpen) {
                this.menu.toggle();
            }
            this.menu.actor.navigate_focus(this.actor, Gtk.DirectionType.DOWN, false);
            return true;
        } else {
            return false;
        }
    },

    _onOpenStateChanged: function(aMenu, aOpen) {
        if (aOpen) {
            // Condition needed for retro-compatibility.
            // Mark for deletion on EOL. Cinnamon 3.2.x+
            // Remove condition
            if (this._appletEnterEventId > 0 && typeof this.actor.handler_block === "function") {
                this.actor.handler_block(this._appletEnterEventId);
            }

            this.menuIsOpening = true;
            this.actor.add_style_pseudo_class("active");
            global.stage.set_key_focus(this.searchEntry);
            this._selectedItemIndex = null;
            this._activeContainer = null;
            this._activeActor = null;

            this.lastSelectedCategory = null;

            this._favoritesCategoryButton.actor.style_class = "menu-category-button-selected";
            this._selectCategory("favorites");
        } else {
            // Condition needed for retro-compatibility.
            // Mark for deletion on EOL. Cinnamon 3.2.x+
            // Remove condition
            if (this._appletEnterEventId > 0 && typeof this.actor.handler_unblock === "function") {
                this.actor.handler_unblock(this._appletEnterEventId);
            }

            this.actor.remove_style_pseudo_class("active");

            if (this.searchActive) {
                this.resetSearch();
            }

            this._previousTreeSelectedActor = null;
            this._previousSelectedActor = null;
            this.closeContextMenus(null, false);

            this._clearAllSelections(true);
            this.destroyVectorBox();
        }
    },

    destroy: function() {
        this.actor._delegate = null;
        this.menu.destroy();
        this.actor.destroy();
        this.emit("destroy");
    },

    _set_default_menu_icon: function() {
        let path = global.datadir + "/theme/menu.svg";
        if (GLib.file_test(path, GLib.FileTest.EXISTS)) {
            this.set_applet_icon_path(path);
            return;
        }

        path = global.datadir + "/theme/menu-symbolic.svg";
        if (GLib.file_test(path, GLib.FileTest.EXISTS)) {
            this.set_applet_icon_symbolic_path(path);
            return;
        }
        // If all else fails, this will yield no icon
        this.set_applet_icon_path("");
    },

    _updateIconAndLabel: function() {
        try {
            if (this.pref_use_a_custom_icon_for_applet) {
                if (this.pref_custom_icon_for_applet === "") {
                    this.set_applet_icon_name("");
                } else if (GLib.path_is_absolute(this.pref_custom_icon_for_applet) &&
                    GLib.file_test(this.pref_custom_icon_for_applet, GLib.FileTest.EXISTS)) {
                    if (this.pref_custom_icon_for_applet.search("-symbolic") != -1) {
                        this.set_applet_icon_symbolic_path(this.pref_custom_icon_for_applet);
                    } else {
                        this.set_applet_icon_path(this.pref_custom_icon_for_applet);
                    }
                } else if (Gtk.IconTheme.get_default().has_icon(this.pref_custom_icon_for_applet)) {
                    if (this.pref_custom_icon_for_applet.search("-symbolic") != -1) {
                        this.set_applet_icon_symbolic_name(this.pref_custom_icon_for_applet);
                    } else {
                        this.set_applet_icon_name(this.pref_custom_icon_for_applet);
                    }
                    /**
                     * START mark Odyseus
                     * I added the last condition without checking Gtk.IconTheme.get_default.
                     * Otherwise, if there is a valid icon name added by
                     *  Gtk.IconTheme.get_default().append_search_path, it will not be recognized.
                     * With the following extra condition, the worst that can happen is that
                     *  the applet icon will not change/be set.
                     */
                } else {
                    try {
                        if (this.pref_custom_icon_for_applet.search("-symbolic") != -1) {
                            this.set_applet_icon_symbolic_name(this.pref_custom_icon_for_applet);
                        } else {
                            this.set_applet_icon_name(this.pref_custom_icon_for_applet);
                        }
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                }
            } else {
                this._set_default_menu_icon();
            }
        } catch (aErr) {
            global.logWarning('Could not load icon file "' + this.pref_custom_icon_for_applet + '" for menu button');
        }

        if (this.pref_use_a_custom_icon_for_applet && this.pref_custom_icon_for_applet === "") {
            this._applet_icon_box.hide();
        } else {
            this._applet_icon_box.show();
        }

        // no menu label if in a vertical panel
        if (this.orientation == St.Side.LEFT || this.orientation == St.Side.RIGHT) {
            this.set_applet_label("");
        } else {
            if (this.pref_custom_label_for_applet !== "") {
                this.set_applet_label(_(this.pref_custom_label_for_applet));
            } else {
                this.set_applet_label("");
            }
        }

        this._updateLabelVisibility();
    },

    _updateLabelVisibility: function() {
        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        // Remove condition
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

    _recentMenuOpenStateChanged: function(recentContextMenu) {
        if (recentContextMenu.isOpen) {
            this._activeContextMenuParent = recentContextMenu.sourceActor._delegate;
            this._scrollToButton(recentContextMenu);
        } else {
            this._activeContextMenuItem = null;
            this._activeContextMenuParent = null;
            for (let i = this._recentButtons.length - 1; i >= 0; i--) {
                if (this._recentButtons[i].menu) {
                    this._recentButtons[i].menu = null;
                }
            }
        }
    },

    createRecentContextMenu: function(actor) {
        let menu = new PopupMenu.PopupSubMenu(actor);
        menu.actor.set_style_class_name("menu-context-menu");
        menu.connect("open-state-changed", Lang.bind(this, this._recentMenuOpenStateChanged));
        this.recentContextMenu = menu;
    },

    _navigateContextMenu: function(button, symbol, ctrlKey) {
        if (symbol === Clutter.KEY_Menu || symbol === Clutter.Escape ||
            (ctrlKey && (symbol === Clutter.KEY_Return || symbol === Clutter.KP_Enter))) {
            button.activateContextMenus();
            return;
        }

        let minIndex = 0;
        let goUp = symbol === Clutter.KEY_Up;
        let nextActive = null;
        let menuItems = button.menu._getMenuItems(); // The context menu items

        // The first context menu item of a RecentButton is used just as a label.
        // So remove it from the iteration.
        if (button && button instanceof $.RecentButton) {
            minIndex = 1;
        }

        let menuItemsLength = menuItems.length;

        switch (symbol) {
            case Clutter.KEY_Page_Up:
                this._activeContextMenuItem = menuItems[minIndex];
                this._activeContextMenuItem.setActive(true);
                return;
            case Clutter.KEY_Page_Down:
                this._activeContextMenuItem = menuItems[menuItemsLength - 1];
                this._activeContextMenuItem.setActive(true);
                return;
        }

        if (!this._activeContextMenuItem) {
            if (symbol === Clutter.KEY_Return || symbol === Clutter.KP_Enter) {
                button.activate();
            } else {
                this._activeContextMenuItem = menuItems[goUp ? menuItemsLength - 1 : minIndex];
                this._activeContextMenuItem.setActive(true);
            }
            return;
        } else if (this._activeContextMenuItem &&
            (symbol === Clutter.KEY_Return || symbol === Clutter.KP_Enter)) {
            this._activeContextMenuItem.activate();
            this._activeContextMenuItem = null;
            return;
        }
        // DO NOT USE INVERSE LOOP HERE!!!
        let i = minIndex;
        for (; i < menuItemsLength; i++) {
            if (menuItems[i] === this._activeContextMenuItem) {
                let nextActiveIndex = (goUp ? i - 1 : i + 1);

                if (nextActiveIndex < minIndex) {
                    nextActiveIndex = menuItemsLength - 1;
                } else if (nextActiveIndex > menuItemsLength - 1) {
                    nextActiveIndex = minIndex;
                }

                nextActive = menuItems[nextActiveIndex];
                nextActive.setActive(true);
                this._activeContextMenuItem = nextActive;

                break;
            }
        }
    },

    _onMenuKeyPress: function(actor, event) {
        let symbol = event.get_key_symbol();
        let item_actor;
        let index = 0;

        this.appBoxIter.reloadVisible();
        this.catBoxIter.reloadVisible();
        this.customLaunchersBoxIter.reloadVisible();

        let keyCode = event.get_key_code();
        let modifierState = Cinnamon.get_event_state(event);

        // Check for a keybinding and quit early, otherwise we get a double hit
        // of the keybinding callback.
        let action = global.display.get_keybinding_action(keyCode, modifierState);

        if (action == Meta.KeyBindingAction.CUSTOM) {
            return true;
        }

        index = this._selectedItemIndex;

        let ctrlKey = modifierState & Clutter.ModifierType.CONTROL_MASK;

        // If a context menu is open, hijack keyboard navigation and concentrate on the context menu.
        if (this._activeContextMenuParent && this._activeContextMenuParent._contextIsOpen &&
            this._activeContainer === this.applicationsBox &&
            (this._activeContextMenuParent instanceof $.ApplicationButton ||
                this._activeContextMenuParent instanceof $.RecentButton)) {
            let continueNavigation = false;
            switch (symbol) {
                case Clutter.KEY_Up:
                case Clutter.KEY_Down:
                case Clutter.KEY_Return:
                case Clutter.KP_Enter:
                case Clutter.KEY_Menu:
                case Clutter.KEY_Page_Up:
                case Clutter.KEY_Page_Down:
                case Clutter.Escape:
                    this._navigateContextMenu(this._activeContextMenuParent, symbol, ctrlKey);
                    break;
                case Clutter.KEY_Right:
                case Clutter.KEY_Left:
                case Clutter.Tab:
                case Clutter.ISO_Left_Tab:
                    continueNavigation = true;

                    if (symbol === Clutter.Tab || symbol === Clutter.ISO_Left_Tab) {
                        this.closeContextMenus(null, false);
                    }
                    break;
            }
            if (!continueNavigation) {
                return true;
            }
        }

        let navigationKey = true;
        let whichWay = "none";

        switch (symbol) {
            case Clutter.KEY_Up:
                whichWay = "up";
                break;
            case Clutter.KEY_Down:
                whichWay = "down";
                break;
            case Clutter.KEY_Page_Up:
                whichWay = "top";
                break;
            case Clutter.KEY_Page_Down:
                whichWay = "bottom";
                break;
            case Clutter.KEY_Right:
                if (!this.searchActive) {
                    whichWay = this.pref_swap_categories_box ? "left" : "right";
                }
                if (this._activeContainer === this.applicationsBox) {
                    this.pref_swap_categories_box ? "left" : "none";
                } else if (this._activeContainer === this.categoriesBox && this.noRecentDocuments &&
                    (this.categoriesBox.get_child_at_index(index))._delegate instanceof $.RecentCategoryButton) {
                    whichWay = "none";
                } else if (this._activeContainer === this.customLaunchersBox) {
                    whichWay = "jump-right";
                }
                break;
            case Clutter.KEY_Left:
                if (!this.searchActive) {
                    whichWay = this.pref_swap_categories_box ? "right" : "left";
                }

                if ((this._activeContainer === this.categoriesBox || this._activeContainer === null)) {
                    whichWay = this.pref_swap_categories_box ? "right" : "none";
                } else if (this._activeContainer === this.customLaunchersBox) {
                    whichWay = "jump-left";
                }
                break;
            case Clutter.Tab:
            case Clutter.ISO_Left_Tab:
                if (!this.searchActive) {
                    whichWay = "jump";
                } else {
                    navigationKey = false;
                }
                break;
            default:
                navigationKey = false;
        }

        if (navigationKey) {
            switch (this._activeContainer) {
                case null:
                    switch (whichWay) {
                        case "jump":
                            this._activeContainer = this.customLaunchersBox;
                            item_actor = this.customLaunchersBoxIter.getLastVisible();
                            break;
                        case "up":
                            this._activeContainer = this.categoriesBox;
                            item_actor = this.catBoxIter.getLastVisible();
                            this._scrollToButton(this.appBoxIter.getFirstVisible()._delegate);
                            break;
                        case "down":
                            this._activeContainer = this.categoriesBox;
                            item_actor = this.catBoxIter.getFirstVisible();
                            item_actor = this.catBoxIter.getNextVisible(item_actor);
                            this._scrollToButton(this.appBoxIter.getFirstVisible()._delegate);
                            break;
                        case "right":
                            this._activeContainer = this.applicationsBox;
                            item_actor = this.appBoxIter.getFirstVisible();
                            this._scrollToButton(item_actor._delegate);
                            break;
                        case "left":
                            this._activeContainer = this.applicationsBox;
                            item_actor = this.appBoxIter.getFirstVisible();
                            this._scrollToButton(item_actor._delegate);
                            break;
                        case "top":
                            this._activeContainer = this.categoriesBox;
                            item_actor = this.catBoxIter.getFirstVisible();
                            this._scrollToButton(this.appBoxIter.getFirstVisible()._delegate);
                            break;
                        case "bottom":
                            this._activeContainer = this.categoriesBox;
                            item_actor = this.catBoxIter.getLastVisible();
                            this._scrollToButton(this.appBoxIter.getFirstVisible()._delegate);
                            break;
                    }
                    break;
                case this.customLaunchersBox:
                    switch (whichWay) {
                        case "jump-left":
                            this._previousSelectedActor = this.customLaunchersBox.get_child_at_index(index);
                            item_actor = this.customLaunchersBoxIter.getPrevVisible(this._previousSelectedActor);
                            break;
                        case "jump-right":
                            this._previousSelectedActor = this.customLaunchersBox.get_child_at_index(index);
                            item_actor = this.customLaunchersBoxIter.getNextVisible(this._previousSelectedActor);
                            break;
                        case "jump":
                        case "up":
                        case "down":
                        case "top":
                        case "bottom":
                            item_actor = this.catBoxIter.getFirstVisible();
                            this._previousTreeSelectedActor = item_actor;
                            break;
                    }
                    break;
                case this.categoriesBox:
                    switch (whichWay) {
                        case "jump":
                            this._previousSelectedActor = this.categoriesBox.get_child_at_index(index);
                            item_actor = this.customLaunchersBoxIter.getLastVisible();
                            this._previousTreeSelectedActor = item_actor;
                            break;
                        case "up":
                            this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(index);
                            this._previousTreeSelectedActor._delegate.isHovered = false;
                            item_actor = this.catBoxIter.getPrevVisible(this._activeActor);
                            this._scrollToButton(this.appBoxIter.getFirstVisible()._delegate);
                            break;
                        case "down":
                            this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(index);
                            this._previousTreeSelectedActor._delegate.isHovered = false;
                            item_actor = this.catBoxIter.getNextVisible(this._activeActor);
                            this._scrollToButton(this.appBoxIter.getFirstVisible()._delegate);
                            break;
                        case "right":
                            if ((this.categoriesBox.get_child_at_index(index))._delegate instanceof $.RecentCategoryButton &&
                                this.noRecentDocuments) {
                                item_actor = this.categoriesBox.get_child_at_index(index);
                            } else {
                                item_actor = (this._previousVisibleIndex != null) ?
                                    this.appBoxIter.getVisibleItem(this._previousVisibleIndex) :
                                    this.appBoxIter.getFirstVisible();
                            }
                            break;
                        case "left":
                            if ((this.categoriesBox.get_child_at_index(index))._delegate instanceof $.RecentCategoryButton &&
                                this.noRecentDocuments) {
                                item_actor = this.categoriesBox.get_child_at_index(index);
                            } else {
                                item_actor = (this._previousVisibleIndex != null) ?
                                    this.appBoxIter.getVisibleItem(this._previousVisibleIndex) :
                                    this.appBoxIter.getFirstVisible();
                            }
                            break;
                        case "top":
                            this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(index);
                            this._previousTreeSelectedActor._delegate.isHovered = false;
                            item_actor = this.catBoxIter.getFirstVisible();
                            this._scrollToButton(this.appBoxIter.getFirstVisible()._delegate);
                            break;
                        case "bottom":
                            this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(index);
                            this._previousTreeSelectedActor._delegate.isHovered = false;
                            item_actor = this.catBoxIter.getLastVisible();
                            this._scrollToButton(this.appBoxIter.getFirstVisible()._delegate);
                            break;
                    }
                    break;
                case this.applicationsBox:
                    switch (whichWay) {
                        case "jump":
                            this._previousSelectedActor = this.applicationsBox.get_child_at_index(index);
                            item_actor = this.customLaunchersBoxIter.getLastVisible();
                            this._previousTreeSelectedActor = item_actor;
                            break;
                        case "up":
                            this._previousSelectedActor = this.applicationsBox.get_child_at_index(index);
                            item_actor = this.appBoxIter.getPrevVisible(this._previousSelectedActor);
                            this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
                            this._scrollToButton(item_actor._delegate);
                            break;
                        case "down":
                            this._previousSelectedActor = this.applicationsBox.get_child_at_index(index);
                            item_actor = this.appBoxIter.getNextVisible(this._previousSelectedActor);
                            this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
                            this._scrollToButton(item_actor._delegate);
                            break;
                        case "right":
                            this._previousSelectedActor = this.applicationsBox.get_child_at_index(index);
                            item_actor = (this._previousTreeSelectedActor != null) ?
                                this._previousTreeSelectedActor :
                                this.catBoxIter.getFirstVisible();
                            this._previousTreeSelectedActor = item_actor;
                            index = item_actor.get_parent()._vis_iter.getAbsoluteIndexOfChild(item_actor);
                            break;
                        case "left":
                            this._previousSelectedActor = this.applicationsBox.get_child_at_index(index);
                            item_actor = (this._previousTreeSelectedActor != null) ?
                                this._previousTreeSelectedActor :
                                this.catBoxIter.getFirstVisible();
                            this._previousTreeSelectedActor = item_actor;
                            break;
                        case "top":
                            item_actor = this.appBoxIter.getFirstVisible();
                            this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
                            this._scrollToButton(item_actor._delegate);
                            break;
                        case "bottom":
                            item_actor = this.appBoxIter.getLastVisible();
                            this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
                            this._scrollToButton(item_actor._delegate);
                            break;
                    }
                    break;
                default:
                    break;
            }
            if (!item_actor) {
                return false;
            }
            index = item_actor.get_parent()._vis_iter.getAbsoluteIndexOfChild(item_actor);
        } else {
            if (this._activeContainer !== this.categoriesBox && (symbol === Clutter.KEY_Return || symbol === Clutter.KP_Enter)) {
                if (!ctrlKey) {
                    item_actor = this._activeContainer.get_child_at_index(this._selectedItemIndex);
                    item_actor._delegate.activate();
                } else if (ctrlKey && this._activeContainer === this.applicationsBox) {
                    item_actor = this.applicationsBox.get_child_at_index(this._selectedItemIndex);
                    if (item_actor._delegate instanceof $.ApplicationButton || item_actor._delegate instanceof $.RecentButton) {
                        item_actor._delegate.activateContextMenus();
                    }
                }
                return true;
            } else if (this._activeContainer === this.applicationsBox && symbol === Clutter.KEY_Menu) {
                item_actor = this.applicationsBox.get_child_at_index(this._selectedItemIndex);
                if (item_actor._delegate instanceof $.ApplicationButton || item_actor._delegate instanceof $.RecentButton) {
                    item_actor._delegate.activateContextMenus();
                }
                return true;
            } else if (this.pref_search_filesystem && (this._fileFolderAccessActive || symbol === Clutter.slash)) {
                if (symbol === Clutter.Return || symbol === Clutter.KP_Enter) {
                    if (this._run(this.searchEntry.get_text())) {
                        this.closeMainMenu();
                    }
                    return true;
                }
                if (symbol === Clutter.Escape) {
                    this.searchEntry.set_text("");
                    this._fileFolderAccessActive = false;
                }
                if (symbol === Clutter.slash) {
                    // Need preload data before get completion. GFilenameCompleter load content of parent directory.
                    // Parent directory for /usr/include/ is /usr/. So need to add fake name('a').
                    let text = this.searchEntry.get_text().concat("/a");
                    let prefix;
                    if (text.lastIndexOf(" ") == -1) {
                        prefix = text;
                    } else {
                        prefix = text.substr(text.lastIndexOf(" ") + 1);
                    }
                    this._getCompletion(prefix);

                    return false;
                }
                if (symbol === Clutter.Tab) {
                    let text = actor.get_text();
                    let prefix;
                    if (text.lastIndexOf(" ") == -1) {
                        prefix = text;
                    } else {
                        prefix = text.substr(text.lastIndexOf(" ") + 1);
                    }
                    let postfix = this._getCompletion(prefix);
                    if (postfix != null && postfix.length > 0) {
                        actor.insert_text(postfix, -1);
                        actor.set_cursor_position(text.length + postfix.length);
                        if (postfix[postfix.length - 1] == "/") {
                            this._getCompletion(text + postfix + "a");
                        }
                    }
                    return true;
                }
                if (symbol === Clutter.ISO_Left_Tab) {
                    return true;
                }
                return false;
            } else if (symbol === Clutter.Tab || symbol === Clutter.ISO_Left_Tab) {
                return true;
            } else {
                return false;
            }
        }

        this._selectedItemIndex = index;

        if (!item_actor || item_actor === this.searchEntry) {
            return false;
        }

        item_actor._delegate.emit("enter-event");
        return true;
    },

    _addEnterEvent: function(button, callback) {
        let _callback = Lang.bind(this, function() {
            let parent = button.actor.get_parent();
            if (this._activeContainer === this.categoriesBox && parent !== this._activeContainer) {
                this._previousTreeSelectedActor = this._activeActor;
                this._previousSelectedActor = null;
            }
            if (this._previousTreeSelectedActor && this._activeContainer !== this.categoriesBox &&
                parent !== this._activeContainer && button !== this._previousTreeSelectedActor && !this.searchActive) {
                this._previousTreeSelectedActor.style_class = "menu-category-button";
            }
            if (parent != this._activeContainer) {
                parent._vis_iter.reloadVisible();
            }
            let _maybePreviousActor = this._activeActor;
            if (_maybePreviousActor && this._activeContainer !== this.categoriesBox) {
                this._previousSelectedActor = _maybePreviousActor;
                this._clearPrevSelection();
            }
            if (parent === this.categoriesBox && !this.searchActive) {
                this._previousSelectedActor = _maybePreviousActor;
                this._clearPrevCatSelection();
            }
            this._activeContainer = parent;
            this._activeActor = button.actor;
            this._selectedItemIndex = this._activeContainer._vis_iter.getAbsoluteIndexOfChild(this._activeActor);
            callback();
        });
        button.connect("enter-event", _callback);
        button.actor.connect("enter-event", _callback);
    },

    _clearPrevSelection: function(actor) {
        if (this._previousSelectedActor && this._previousSelectedActor != actor) {
            if (this._previousSelectedActor._delegate instanceof $.ApplicationButton ||
                this._previousSelectedActor._delegate instanceof $.RecentButton ||
                this._previousSelectedActor._delegate instanceof $.SearchProviderResultButton ||
                this._previousSelectedActor._delegate instanceof $.PlaceButton ||
                this._previousSelectedActor._delegate instanceof $.RecentClearButton ||
                this._previousSelectedActor._delegate instanceof $.CustomCommandButton ||
                this._previousSelectedActor._delegate instanceof $.TransientButton) {
                this._previousSelectedActor.style_class = "menu-application-button";
            }
        }
    },

    _clearPrevCatSelection: function(actor) {
        if (this._previousTreeSelectedActor && this._previousTreeSelectedActor != actor) {
            this._previousTreeSelectedActor.style_class = "menu-category-button";

            if (this._previousTreeSelectedActor._delegate) {
                this._previousTreeSelectedActor._delegate.emit("leave-event");
            }

            if (actor !== undefined) {
                this._previousVisibleIndex = null;
                this._previousTreeSelectedActor = actor;
            }
        } else {
            let catChildren = this.categoriesBox.get_children();
            for (let i = catChildren.length - 1; i >= 0; i--) {
                catChildren[i].style_class = "menu-category-button";
            }
        }
    },

    /*
     * The vectorBox overlays the the categoriesBox to aid in navigation from categories to apps
     * by preventing misselections. It is set to the same size as the categoriesOverlayBox and
     * categoriesBox.
     *
     * The actor is a quadrilateral that we turn into a triangle by setting the A and B vertices to
     * the same position. The size and origin of the vectorBox are calculated in _getVectorInfo().
     * Using those properties, the bounding box is sized as (w, h) and the triangle is defined as
     * follows:
     *   _____
     *  |    /|D
     *  |   / |     AB: (mx, my)
     *  | A/  |      C: (w, h)
     *  | B\  |      D: (w, 0)
     *  |   \ |
     *  |____\|C
     */

    _getVectorInfo: function() {
        let [mx, my, mask] = global.get_pointer(); // jshint ignore:line
        let [bx, by] = this.categoriesOverlayBox.get_transformed_position();
        let [bw, bh] = this.categoriesOverlayBox.get_transformed_size();

        let xformed_mx = mx - bx;
        let xformed_my = my - by;

        if (xformed_mx < 0 || xformed_mx > bw || xformed_my < 0 || xformed_my > bh) {
            return null;
        }

        return {
            mx: xformed_mx + (this.pref_swap_categories_box ? -2 : +2),
            my: xformed_my + (this.pref_swap_categories_box ? -2 : +2),
            w: this.pref_swap_categories_box ? 0 : bw,
            h: bh
        };
    },

    makeVectorBox: function(actor) {
        this.destroyVectorBox(actor);
        let vi = this._getVectorInfo();
        if (!vi) {
            return;
        }

        this.vectorBox = new St.Polygon({
            debug: false,
            width: vi.w,
            height: vi.h,
            ulc_x: vi.mx,
            ulc_y: vi.my,
            llc_x: vi.mx,
            llc_y: vi.my,
            urc_x: vi.w,
            urc_y: 0,
            lrc_x: vi.w,
            lrc_y: vi.h
        });

        this.categoriesOverlayBox.add_actor(this.vectorBox);

        this.vectorBox.show();
        this.vectorBox.set_reactive(true);

        this.vectorBox.connect("leave-event", Lang.bind(this, this.destroyVectorBox));
        this.vectorBox.connect("motion-event", Lang.bind(this, this.maybeUpdateVectorBox));
        this.actor_motion_id = actor.connect("motion-event", Lang.bind(this, this.maybeUpdateVectorBox));
        this.current_motion_actor = actor;
    },

    maybeUpdateVectorBox: function() {
        if (this.vector_update_loop) {
            Mainloop.source_remove(this.vector_update_loop);
            this.vector_update_loop = 0;
        }
        this.vector_update_loop = Mainloop.timeout_add(50, Lang.bind(this, this.updateVectorBox));
    },

    updateVectorBox: function(actor) {
        if (this.vectorBox) {
            let vi = this._getVectorInfo();
            if (vi) {
                this.vectorBox.ulc_x = vi.mx;
                this.vectorBox.llc_x = vi.mx;
                this.vectorBox.queue_repaint();
            } else {
                this.destroyVectorBox(actor);
            }
        }
        this.vector_update_loop = 0;
        return false;
    },

    destroyVectorBox: function(actor) { // jshint ignore:line
        if (this.vectorBox != null) {
            this.vectorBox.destroy();
            this.vectorBox = null;
        }
        if (this.actor_motion_id > 0 && this.current_motion_actor != null) {
            this.current_motion_actor.disconnect(this.actor_motion_id);
            this.actor_motion_id = 0;
            this.current_motion_actor = null;
        }
    },

    _refreshPlaces: function() {
        for (let p = this._placesButtons.length - 1; p >= 0; p--) {
            this._placesButtons[p].actor.destroy();
        }

        this._placesButtons = [];

        for (let c = this._categoryButtons.length - 1; c >= 0; c--) {
            if (this._categoryButtons[c] instanceof $.PlaceCategoryButton) {
                this._categoryButtons[c].destroy();
                this._categoryButtons.splice(c, 1);
                this.placesButton = null;
                break;
            }
        }

        if (this.pref_show_places) {
            this.placesButton = new $.PlaceCategoryButton(this);
            this._addEnterEvent(this.placesButton, Lang.bind(this, function() {
                if (!this.searchActive) {
                    this.placesButton.isHovered = true;

                    this._clearPrevCatSelection(this.placesButton);
                    this.placesButton.actor.style_class = "menu-category-button-selected";
                    this.closeContextMenus(null, false);
                    this._selectCategory("places");

                    this.makeVectorBox(this.placesButton.actor);
                }
            }));
            this.placesButton.actor.connect("leave-event", Lang.bind(this, function() {
                if (this._previousTreeSelectedActor === null) {
                    this._previousTreeSelectedActor = this.placesButton.actor;
                } else {
                    let prevIdx = this.catBoxIter.getVisibleIndex(this._previousTreeSelectedActor);
                    let nextIdx = this.catBoxIter.getVisibleIndex(this.placesButton.actor);
                    let idxDiff = Math.abs(prevIdx - nextIdx);
                    if (idxDiff <= 1 || Math.min(prevIdx, nextIdx) < 0) {
                        this._previousTreeSelectedActor = this.placesButton.actor;
                    }
                }

                this.placesButton.isHovered = false;
            }));
            this._categoryButtons.push(this.placesButton);
            this.categoriesBox.add_actor(this.placesButton.actor);

            let bookmarks = this._listBookmarks();
            let devices = this._listDevices();
            let places = bookmarks.concat(devices);

            let handleEnterEvent = (button) => {
                this._addEnterEvent(button, () => {
                    this._clearPrevSelection(button.actor);
                    button.actor.style_class = "menu-application-button-selected";
                });
            };

            let handleLeaveEvent = (button) => {
                button.actor.connect("leave-event", () => {
                    this._previousSelectedActor = button.actor;
                });
            };

            // DO NOT USE INVERSE LOOP HERE!!!
            let i = 0,
                iLen = places.length;
            for (; i < iLen; i++) {
                let button = new $.PlaceButton(this, places[i]);
                handleEnterEvent(button);
                handleLeaveEvent(button);
                this._placesButtons.push(button);
                this.applicationsBox.add_actor(button.actor);

                let selectedAppId = $.escapeUnescapeReplacer.unescape(button.place.id);
                selectedAppId = selectedAppId.substr(selectedAppId.indexOf(":") + 1);
                let fileIndex = selectedAppId.indexOf("file:///");

                if (fileIndex !== -1) {
                    selectedAppId = selectedAppId.substr(fileIndex + 7);
                }

                this._setSelectedItemTooltip(button, "", selectedAppId);
            }
        }

        this._setCategoriesButtonActive(!this.searchActive);

        this._resizeApplicationsBox();
    },

    _refreshRecent: function() {
        if (this.privacy_settings && this.privacy_settings.get_boolean($.REMEMBER_RECENT_KEY) && this.pref_show_recent_files) {
            if (this.recentButton == null) {
                this.recentButton = new $.RecentCategoryButton(this);
                this._addEnterEvent(this.recentButton, Lang.bind(this, function() {
                    if (!this.searchActive) {
                        this.recentButton.isHovered = true;

                        this._clearPrevCatSelection(this.recentButton.actor);
                        this.recentButton.actor.style_class = "menu-category-button-selected";
                        this.closeContextMenus(null, false);
                        this._selectCategory("recentFiles");

                        this.makeVectorBox(this.recentButton.actor);
                    }
                }));
                this.recentButton.actor.connect("leave-event", Lang.bind(this, function() {

                    if (this._previousTreeSelectedActor === null) {
                        this._previousTreeSelectedActor = this.recentButton.actor;
                    } else {
                        let prevIdx = this.catBoxIter.getVisibleIndex(this._previousTreeSelectedActor);
                        let nextIdx = this.catBoxIter.getVisibleIndex(this.recentButton.actor);

                        if (Math.abs(prevIdx - nextIdx) <= 1) {
                            this._previousTreeSelectedActor = this.recentButton.actor;
                        }
                    }

                    this.recentButton.isHovered = false;
                }));

                this._categoryButtons.push(this.recentButton);
            }

            // Make sure the recent category is at the bottom (can happen when refreshing places
            // or apps, since we don't destroy the recent category button each time we refresh recents,
            // as it happens a lot)

            let parent = this.recentButton.actor.get_parent();

            if (parent != null) {
                parent.remove_child(this.recentButton.actor);
            }

            this.categoriesBox.add_actor(this.recentButton.actor);
            this._categoryButtons.splice(this._categoryButtons.indexOf(this.recentButton), 1);
            this._categoryButtons.push(this.recentButton);

            let new_recents = [];

            if (this.recentFilesManager._infosByTimestamp.length > 0) {
                let handleEnterEvent = (button) => {
                    this._addEnterEvent(button, () => {
                        this._clearPrevSelection(button.actor);
                        button.actor.style_class = "menu-application-button-selected";

                        let selectedAppUri = $.escapeUnescapeReplacer.unescape(button.uri);
                        let file = Gio.file_new_for_uri(selectedAppUri);
                        let fileExists = file.query_exists(null);
                        let fileIndex = selectedAppUri.indexOf("file:///");

                        if (fileIndex !== -1) {
                            selectedAppUri = selectedAppUri.substr(fileIndex + 7);
                        }

                        this._setSelectedItemTooltip(button,
                            (fileExists ?
                                "" :
                                _("This file is no longer available")),
                            selectedAppUri);
                    });
                };

                let handleLeaveEvent = (button) => {
                    button.actor.connect("leave-event", () => {
                        button.actor.style_class = "menu-application-button";
                        this._previousSelectedActor = button.actor;
                    });
                };

                let handleNewButton = (id) => {
                    let uri = this.recentFilesManager._infosByTimestamp[id].uri;
                    return this._recentButtons.find(button => ((button instanceof $.RecentButton) &&
                        (button.uri) && (button.uri == uri)));
                };

                let id = 0;
                while (id < this.recentFilesManager._infosByTimestamp.length) {
                    let new_button = null;

                    new_button = handleNewButton(id);

                    if (new_button == undefined) {
                        let button = new $.RecentButton(this, this.recentFilesManager._infosByTimestamp[id]);
                        handleEnterEvent(button);
                        handleLeaveEvent(button);

                        new_button = button;
                    }

                    new_recents.push(new_button);

                    id++;
                }

                let recent_clear_button = null;

                recent_clear_button = this._recentButtons.find(button => (button instanceof $.RecentClearButton));

                if (recent_clear_button == undefined) {
                    let button = new $.RecentClearButton(this);
                    this._addEnterEvent(button, Lang.bind(this, function() {
                        this._clearPrevSelection(button.actor);
                        button.actor.style_class = "menu-application-button-selected";
                    }));
                    button.actor.connect("leave-event", Lang.bind(this, function() {
                        button.actor.style_class = "menu-application-button";
                        this._previousSelectedActor = button.actor;
                    }));

                    recent_clear_button = button;
                }

                new_recents.push(recent_clear_button);

                this.noRecentDocuments = false;
            } else {
                let new_button = null;
                // DO NOT USE INVERSE LOOP HERE!!!
                let i = 0,
                    iLen = this._recentButtons.length;
                for (; i < iLen; i++) {
                    if (this._recentButtons[i] instanceof $.GenericButton) {
                        new_button = this._recentButtons[i];
                        break;
                    }
                }

                if (new_button == null) {
                    new_button = new $.GenericButton(this, _("No recent documents"), null, false, null);
                }

                this.noRecentDocuments = true;
                new_recents.push(new_button);
            }

            let to_remove = [];

            // Remove no-longer-valid items
            for (let i = this._recentButtons.length - 1; i >= 0; i--) {
                let button = this._recentButtons[i];

                if (button instanceof $.GenericButton && !this.noRecentDocuments) {
                    to_remove.push(button);
                } else if (button instanceof $.RecentButton) {
                    if (new_recents.indexOf(button) == -1) {
                        to_remove.push(button);
                    }
                }
            }

            if (to_remove.length > 0) {
                // FIXME:
                // Find out if an inverted loop can be used here?
                let i = 0,
                    iLen = to_remove.length;
                for (; i < iLen; i++) {
                    to_remove[i].destroy();
                    this._recentButtons.splice(this._recentButtons.indexOf(to_remove[i]), 1);
                }
            }

            to_remove = [];

            // Now, add new actors, shuffle existing actors

            let placeholder = null;

            // Find the first occurrence of a RecentButton, if it exists
            let children = this.applicationsBox.get_children();
            for (let i = children.length - 1; i > 0; i--) {
                if ((children[i]._delegate instanceof $.RecentButton) ||
                    (children[i]._delegate instanceof $.RecentClearButton) ||
                    (i == children.length - 1)) {
                    placeholder = children[i - 1];
                    break;
                }
            }

            children = null;

            // FIXME:
            // Find out if an inverted loop can be used here?
            let i = 0,
                iLen = new_recents.length;
            for (; i < iLen; i++) {
                let actor = new_recents[i].actor;

                let parent = actor.get_parent();
                if (parent != null) {
                    parent.remove_child(actor);
                }

                if (placeholder != actor) {
                    this.applicationsBox.insert_child_above(actor, placeholder);
                } else {
                    this.applicationsBox.add_child(actor);
                }

                placeholder = actor;
            }

            this._recentButtons = new_recents;
        } else {
            for (let i = this._recentButtons.length - 1; i >= 0; i--) {
                this._recentButtons[i].destroy();
            }

            this._recentButtons = [];

            for (let i = this._categoryButtons.length - 1; i >= 0; i--) {
                if (this._categoryButtons[i] instanceof $.RecentCategoryButton) {
                    this._categoryButtons[i].destroy();
                    this._categoryButtons.splice(i, 1);
                    this.recentButton = null;
                    break;
                }
            }
        }

        this._setCategoriesButtonActive(!this.searchActive);

        this._resizeApplicationsBox();
    },

    _refreshRecentApps: function() {
        for (let r = this._recentAppsButtons.length - 1; r >= 0; r--) {
            this._recentAppsButtons[r].actor.destroy();
        }

        this._recentAppsButtons = [];
        this._recentAppsApps = [];

        if (!this.pref_recently_used_apps_enabled) {
            for (let c = this._categoryButtons.length - 1; c >= 0; c--) {
                if (this._categoryButtons[c] instanceof $.RecentAppsCategoryButton) {
                    this._categoryButtons[c].actor.destroy();
                }
            }
            return;
        }

        if (this.recentAppsManager.recentApps.length > 0) {
            // It doesn't matter the "direction" of either of these loops.
            // this._recentAppsApps will be sorted anyways.
            for (let i = this._applicationsButtons.length - 1; i >= 0; i--) {
                for (let c = this.recentAppsManager.recentApps.length - 1; c >= 0; c--) {
                    let [recAppID, recLastAccess] = this.recentAppsManager.recentApps[c].split(":");

                    if (recAppID === this._applicationsButtons[i].get_app_id()) {
                        this._applicationsButtons[i].app.lastAccess = recLastAccess;
                        this._recentAppsApps.push(this._applicationsButtons[i].app);
                        continue;
                    }
                }
            }

            let clearBtn = new $.RecentAppsClearButton(this);
            this._addEnterEvent(clearBtn, Lang.bind(this, function() {
                this._clearPrevSelection(clearBtn.actor);
                clearBtn.actor.style_class = "menu-application-button-selected";
            }));
            clearBtn.actor.connect("leave-event", Lang.bind(this, function() {
                clearBtn.actor.style_class = "menu-application-button";
                this._previousSelectedActor = clearBtn.actor;
            }));

            if (this.pref_recently_used_apps_invert_order) {
                this._recentAppsButtons.push(clearBtn);
                this.applicationsBox.add_actor(clearBtn.actor);
            }

            this._recentAppsApps = this._recentAppsApps.sort(Lang.bind(this, function(a, b) {
                if (this.pref_recently_used_apps_invert_order) {
                    return a["lastAccess"] > b["lastAccess"];
                }
                return a["lastAccess"] < b["lastAccess"];
            }));

            let id = 0,
                idLen = this._recentAppsApps.length;
            for (; id < this.pref_recently_used_apps_max_amount && id < idLen; id++) {
                let button = new $.ApplicationButton(this, this._recentAppsApps[id]);
                button.actor.connect("leave-event", Lang.bind(this, this._appLeaveEvent, button));
                this._addEnterEvent(button, Lang.bind(this, this._appEnterEvent, button));
                this._recentAppsButtons.push(button);
                this.applicationsBox.add_actor(button.actor);
                this.applicationsBox.add_actor(button.menu.actor);
            }

            if (!this.pref_recently_used_apps_invert_order) {
                this._recentAppsButtons.push(clearBtn);
                this.applicationsBox.add_actor(clearBtn.actor);
            }
        } else {
            let button = new $.GenericButton(this, _("No recent applications"), null, false, null);
            this._recentAppsButtons.push(button);
            this.applicationsBox.add_actor(button.actor);
        }

        this._setCategoriesButtonActive(!this.searchActive);

        this._recalc_height();
        this._resizeApplicationsBox();
    },

    _sortDirs: function(a, b) {
        let prefIdA = ["administration", "preferences"].indexOf(a.get_menu_id().toLowerCase());
        let prefIdB = ["administration", "preferences"].indexOf(b.get_menu_id().toLowerCase());

        if (prefIdA < 0 && prefIdB >= 0) {
            return -1;
        }
        if (prefIdA >= 0 && prefIdB < 0) {
            return 1;
        }

        let nameA = a.get_name().toLowerCase();
        let nameB = b.get_name().toLowerCase();

        if (nameA > nameB) {
            return 1;
        }
        if (nameA < nameB) {
            return -1;
        }
        return 0;
    },

    _refreshApps: function() {
        // Iterate in reverse, so multiple splices will not upset
        // the remaining elements
        for (let i = this._categoryButtons.length - 1; i > -1; i--) {
            if (this._categoryButtons[i] instanceof $.CategoryButton) {
                this._categoryButtons[i].destroy();
                this._categoryButtons.splice(i, 1);
            }
        }

        for (let i = this._applicationsButtons.length - 1; i >= 0; i--) {
            this._applicationsButtons[i].destroy();
        }

        this._applicationsButtons = [];
        this._transientButtons = [];
        this._applicationsButtonFromApp = {};
        this._applicationsBoxWidth = 0;

        let favCat = {
            get_menu_id: function() {
                return "favorites";
            },
            get_id: function() {
                return -1;
            },
            get_description: function() {
                return this.get_name();
            },
            get_name: function() {
                return _("Favorites");
            },
            get_is_nodisplay: function() {
                return false;
            },
            get_icon: function() {
                return "user-bookmarks";
            }
        };

        this._favoritesCategoryButton = new $.CategoryButton(this, favCat);
        this._addEnterEvent(this._favoritesCategoryButton, Lang.bind(this, function() {
            if (!this.searchActive) {
                this._favoritesCategoryButton.isHovered = true;

                this._clearPrevCatSelection(this._favoritesCategoryButton.actor);
                this._favoritesCategoryButton.actor.style_class = "menu-category-button-selected";
                this._selectCategory("favorites");

                this.makeVectorBox(this._favoritesCategoryButton.actor);
            }
        }));
        this._favoritesCategoryButton.actor.connect("leave-event", Lang.bind(this, function() {
            this._previousSelectedActor = this._favoritesCategoryButton.actor;
            this._favoritesCategoryButton.isHovered = false;
        }));

        this.categoriesBox.add_actor(this._favoritesCategoryButton.actor);
        this._categoryButtons.push(this._favoritesCategoryButton);

        if (this.pref_recently_used_apps_enabled) {
            this.recentAppsCatButton = new $.RecentAppsCategoryButton(this);
            this._addEnterEvent(this.recentAppsCatButton, Lang.bind(this, function() {
                if (!this.searchActive) {
                    this.recentAppsCatButton.isHovered = true;

                    this._clearPrevCatSelection(this.recentAppsCatButton.actor);
                    this.recentAppsCatButton.actor.style_class = "menu-category-button-selected";
                    this._selectCategory("recentApps");

                    this.makeVectorBox(this.recentAppsCatButton.actor);
                }
            }));

            this.recentAppsCatButton.actor.connect("leave-event", Lang.bind(this, function() {
                this._previousSelectedActor = this.recentAppsCatButton.actor;
                this.recentAppsCatButton.isHovered = false;
            }));
            this.categoriesBox.add_actor(this.recentAppsCatButton.actor);
            this._categoryButtons.push(this.recentAppsCatButton);
        }

        let trees = [appsys.get_tree()];

        // DO NOT USE INVERSE LOOP HERE!!!
        let t = 0,
            tLen = trees.length;
        for (; t < tLen; t++) {
            let root = trees[t].get_root_directory();
            let dirs = [];
            let iter = root.iter();
            let nextType;

            while ((nextType = iter.next()) != CMenu.TreeItemType.INVALID) {
                if (nextType == CMenu.TreeItemType.DIRECTORY) {
                    dirs.push(iter.get_directory());
                }
            }

            dirs = dirs.sort(this._sortDirs);

            let handleEnterEvent = (categoryButton, dir) => {
                this._addEnterEvent(categoryButton, () => {
                    if (!this.searchActive) {
                        categoryButton.isHovered = true;

                        this._clearPrevCatSelection(categoryButton.actor);
                        categoryButton.actor.style_class = "menu-category-button-selected";
                        this._selectCategory(dir.get_menu_id());

                        this.makeVectorBox(categoryButton.actor);
                    }
                });
            };

            let handleLeaveEvent = (categoryButton, dir) => { // jshint ignore:line
                categoryButton.actor.connect("leave-event", () => {
                    if (this._previousTreeSelectedActor === null) {
                        this._previousTreeSelectedActor = categoryButton.actor;
                    } else {
                        let prevIdx = this.catBoxIter.getVisibleIndex(this._previousTreeSelectedActor);
                        let nextIdx = this.catBoxIter.getVisibleIndex(categoryButton.actor);
                        if (Math.abs(prevIdx - nextIdx) <= 1) {
                            this._previousTreeSelectedActor = categoryButton.actor;
                        }
                    }
                    categoryButton.isHovered = false;
                });
            };

            // DO NOT USE INVERSE LOOP HERE!!!
            let d = 0,
                dLen = dirs.length;
            for (; d < dLen; d++) {
                if (dirs[d].get_is_nodisplay()) {
                    continue;
                }
                if (this._loadCategory(dirs[d])) {
                    let categoryButton = new $.CategoryButton(this, dirs[d]);
                    handleEnterEvent(categoryButton, dirs[d]);
                    handleLeaveEvent(categoryButton, dirs[d]);

                    this._categoryButtons.push(categoryButton);
                    this.categoriesBox.add_actor(categoryButton.actor);
                }
            }
        }
        // Sort apps and add to applicationsBox
        this._applicationsButtons.sort(function(a, b) {
            a = Util.latinise(a.app.get_name().toLowerCase());
            b = Util.latinise(b.app.get_name().toLowerCase());
            return a > b;
        });

        // DO NOT USE INVERSE LOOP HERE!!!
        let i = 0,
            iLen = this._applicationsButtons.length;
        for (; i < iLen; i++) {
            this.applicationsBox.add_actor(this._applicationsButtons[i].actor);
            this.applicationsBox.add_actor(this._applicationsButtons[i].menu.actor);
        }

        this._appsWereRefreshed = true;
        this._setStyling();
    },

    _loadCategory: function(dir, top_dir) {
        let iter = dir.iter();
        let has_entries = false;
        let nextType;

        if (!top_dir) {
            top_dir = dir;
        }

        while ((nextType = iter.next()) != CMenu.TreeItemType.INVALID) {
            if (nextType == CMenu.TreeItemType.ENTRY) {
                let entry = iter.get_entry();
                if (!entry.get_app_info().get_nodisplay()) {
                    has_entries = true;
                    let app = appsys.lookup_app_by_tree_entry(entry);
                    if (!app) {
                        app = appsys.lookup_settings_app_by_tree_entry(entry);
                    }
                    let app_key = app.get_id();
                    if (app_key == null) {
                        app_key = app.get_name() + ":" +
                            app.get_description();
                    }
                    if (!(app_key in this._applicationsButtonFromApp)) {

                        let applicationButton = new $.ApplicationButton(this, app);

                        if (!this.pref_disable_new_apps_highlighting) {
                            let app_is_known = false;
                            for (let i = this._knownApps.length - 1; i >= 0; i--) {
                                if (this._knownApps[i] == app_key) {
                                    app_is_known = true;
                                }
                            }

                            if (!app_is_known) {
                                if (this._appsWereRefreshed) {
                                    applicationButton.highlight();
                                } else {
                                    this._knownApps.push(app_key);
                                }
                            }
                        }

                        applicationButton.actor.connect("leave-event", Lang.bind(this, this._appLeaveEvent, applicationButton));
                        this._addEnterEvent(applicationButton, Lang.bind(this, this._appEnterEvent, applicationButton));
                        this._setSelectedItemTooltip(applicationButton, applicationButton.app.get_name(), applicationButton.app.get_description() || "");
                        this._applicationsButtons.push(applicationButton);
                        applicationButton.category.push(top_dir.get_menu_id());
                        this._applicationsButtonFromApp[app_key] = applicationButton;
                    } else {
                        this._applicationsButtonFromApp[app_key].category.push(dir.get_menu_id());
                    }
                }
            } else if (nextType == CMenu.TreeItemType.DIRECTORY) {
                let subdir = iter.get_directory();
                if (this._loadCategory(subdir, top_dir)) {
                    has_entries = true;
                }
            }
        }
        return has_entries;
    },

    _appLeaveEvent: function(a, b, applicationButton) {
        this._previousSelectedActor = applicationButton.actor;
        applicationButton.actor.style_class = "menu-application-button";
    },

    _appEnterEvent: function(aApplicationButton) {
        this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(aApplicationButton.actor);
        this._clearPrevSelection(aApplicationButton.actor);
        aApplicationButton.actor.style_class = "menu-application-button-selected";
    },

    // Created a new exclusive function to avoid adding a condition to _appEnterEvent.
    _customLauncherEnterEvent: function(aApplicationButton) {
        this._previousVisibleIndex = this.customLaunchersBoxIter.getVisibleIndex(aApplicationButton.actor);
        this._clearPrevSelection(aApplicationButton.actor);
        aApplicationButton.actor.style_class = "menu-application-button-selected";
    },

    _scrollToButton: function(button) {
        let current_scroll_value = this.applicationsScrollBox.get_vscroll_bar().get_adjustment().get_value();
        let box_height = this.applicationsScrollBox.get_allocation_box().y2 - this.applicationsScrollBox.get_allocation_box().y1;
        let new_scroll_value = current_scroll_value;
        if (current_scroll_value > button.actor.get_allocation_box().y1 - 10) {
            new_scroll_value = button.actor.get_allocation_box().y1 - 10;
        }
        if (box_height + current_scroll_value < button.actor.get_allocation_box().y2 + 10) {
            new_scroll_value = button.actor.get_allocation_box().y2 - box_height + 10;
        }
        if (new_scroll_value != current_scroll_value) {
            this.applicationsScrollBox.get_vscroll_bar().get_adjustment().set_value(new_scroll_value);
        }
    },

    _display: function() {
        this._activeContainer = null;
        this._activeActor = null;
        this.vectorBox = null;
        this.actor_motion_id = 0;
        this.vector_update_loop = 0;
        this.current_motion_actor = null;
        let section = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(section);

        this.rightPane = new St.BoxLayout({
            vertical: true
        });

        this.searchBox = new St.BoxLayout({
            style_class: "menu-search-box"
        });

        this.searchEntry = new St.Entry({
            name: "menu-search-entry",
            hint_text: _("Type to search..."),
            track_hover: true,
            can_focus: true
        });
        this.searchEntry.set_secondary_icon(this._searchInactiveIcon);
        this.searchBox.add(this.searchEntry, {
            x_fill: true,
            x_align: St.Align.START,
            y_align: St.Align.MIDDLE,
            y_fill: false,
            expand: true
        });

        this.searchActive = false;
        this.searchEntryText = this.searchEntry.clutter_text;
        this.searchEntryText.connect("text-changed", Lang.bind(this, this._onSearchTextChanged));
        this.searchEntryText.connect("key-press-event", Lang.bind(this, this._onMenuKeyPress));
        this._previousSearchPattern = "";

        this.categoriesApplicationsBox = new $.CategoriesApplicationsBox();

        this.customLaunchersBox = new St.BoxLayout({
            vertical: false,
            accessible_role: Atk.Role.LIST
        });
        this.customLaunchersBox.set_width(-1);

        let customLaunchersBoxProperties = {
            x_fill: false,
            y_fill: false,
            x_align: this.pref_custom_launchers_box_alignment,
            y_align: St.Align.MIDDLE,
            expand: true
        };

        // I tried setting this.rightPane.pack_start property and it breaks keyboard navigation.
        // I "KISSed" it and as result I don't have to touch the keyboard navigation code.
        // Did something similar to the customLaunchersBox, instead of using pack_start,
        // I simply reverse()ed the array of custom launchers.
        if (this.pref_invert_menu_layout) {
            this.rightPane.add(this.customLaunchersBox, customLaunchersBoxProperties);
            this.rightPane.add_actor(this.categoriesApplicationsBox.actor);
            this.rightPane.add_actor(this.searchBox);
        } else {
            this.rightPane.add_actor(this.searchBox);
            this.rightPane.add_actor(this.categoriesApplicationsBox.actor);
            this.rightPane.add(this.customLaunchersBox, customLaunchersBoxProperties);
        }

        this.categoriesOverlayBox = new Clutter.Actor();
        this.categoriesBox = new St.BoxLayout({
            style_class: "menu-categories-box",
            vertical: true,
            accessible_role: Atk.Role.LIST
        });
        this.categoriesOverlayBox.add_actor(this.categoriesBox);

        this.applicationsScrollBox = new St.ScrollView({
            x_fill: true,
            y_fill: false,
            y_align: St.Align.START,
            style_class: "vfade menu-applications-scrollbox"
        });

        if (this.pref_hide_applications_list_scrollbar) {
            this.applicationsScrollBox.get_vscroll_bar().hide();
        } else {
            this.applicationsScrollBox.get_vscroll_bar().show();
        }

        this.a11y_settings = new Gio.Settings({
            schema_id: "org.cinnamon.desktop.a11y.applications"
        });
        this.a11y_settings.connect("changed::screen-magnifier-enabled", Lang.bind(this, this._updateVFade));
        this.a11y_mag_settings = new Gio.Settings({
            schema_id: "org.cinnamon.desktop.a11y.magnifier"
        });
        this.a11y_mag_settings.connect("changed::mag-factor", Lang.bind(this, this._updateVFade));

        this._updateVFade();

        this._update_autoscroll();

        let vscroll = this.applicationsScrollBox.get_vscroll_bar();
        vscroll.connect("scroll-start",
            Lang.bind(this, function() {
                this.menu.passEvents = true;
            }));
        vscroll.connect("scroll-stop",
            Lang.bind(this, function() {
                this.menu.passEvents = false;
            }));

        this.applicationsBox = new St.BoxLayout({
            style_class: "menu-applications-inner-box",
            vertical: true
        });
        // Eradicated
        // this.applicationsBox.add_style_class_name("menu-applications-box"); // this is to support old themes
        this.applicationsScrollBox.add_actor(this.applicationsBox);
        this.applicationsScrollBox.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);

        if (!this.pref_swap_categories_box) {
            this.categoriesApplicationsBox.actor.add_actor(this.categoriesOverlayBox);
        }

        this.categoriesApplicationsBox.actor.add_actor(this.applicationsScrollBox);

        if (this.pref_swap_categories_box) {
            this.categoriesApplicationsBox.actor.add_actor(this.categoriesOverlayBox);
        }

        this.mainBox = new St.BoxLayout({
            style_class: "menu-applications-outer-box",
            vertical: false
        });
        // Eradicated
        // this.mainBox.add_style_class_name("menu-applications-box"); // this is to support old themes

        this.mainBox.add(this.rightPane, {
            span: 1
        });
        this.mainBox._delegate = null;
        section.actor.add(this.mainBox);

        this.appBoxIter = new $.VisibleChildIterator(this.applicationsBox);
        this.applicationsBox._vis_iter = this.appBoxIter;
        this.catBoxIter = new $.VisibleChildIterator(this.categoriesBox);
        this.categoriesBox._vis_iter = this.catBoxIter;

        Mainloop.idle_add(Lang.bind(this, function() {
            this._clearAllSelections(true);
        }));

        this.menu.actor.connect("allocation-changed", Lang.bind(this, this._on_allocation_changed));

        this._updateCustomLaunchersBox();
        this._setStyling();
    },

    _setStyling: function() {
        this.customLaunchersBox.set_style("padding-top: " + this.pref_custom_launchers_box_padding_top +
            "px; padding-right: " + this.pref_custom_launchers_box_padding_right +
            "px; padding-bottom: " + this.pref_custom_launchers_box_padding_bottom +
            "px; padding-left: " + this.pref_custom_launchers_box_padding_left + "px;");

        this.searchEntry.set_style("padding-top: " + this.pref_search_entry_padding_top +
            "px; padding-right: " + this.pref_search_entry_padding_right +
            "px; padding-bottom: " + this.pref_search_entry_padding_bottom +
            "px; padding-left: " + this.pref_search_entry_padding_left + "px;");

        this.searchBox.set_style("padding-top: " + this.pref_search_box_padding_top +
            "px; padding-right: " + this.pref_search_box_padding_right +
            "px; padding-bottom: " + this.pref_search_box_padding_bottom +
            "px; padding-left: " + this.pref_search_box_padding_left + "px;");

        this.categoriesBox.set_style("padding-top: " + this.pref_categories_box_padding_top +
            "px; padding-right: " + this.pref_categories_box_padding_right +
            "px; padding-bottom: " + this.pref_categories_box_padding_bottom +
            "px; padding-left: " + this.pref_categories_box_padding_left + "px;");

        this.applicationsBox.set_style("padding-top: " + this.pref_applications_box_padding_top +
            "px; padding-right: " + this.pref_applications_box_padding_right +
            "px; padding-bottom: " + this.pref_applications_box_padding_bottom +
            "px; padding-left: " + this.pref_applications_box_padding_left + "px;");

        let searchEntryWidth = (this.applicationsBox.get_allocation_box().x2 -
            this.applicationsBox.get_allocation_box().x1);
        searchEntryWidth = searchEntryWidth + (this.categoriesBox.get_allocation_box().x2 -
            this.categoriesBox.get_allocation_box().x1);

        this.searchEntry.set_width(searchEntryWidth);
    },

    _updateCustomLaunchersBox: function() {
        this.customLaunchersBox.destroy_all_children();
        this.customLaunchersBoxIter = new $.VisibleChildIterator(this.customLaunchersBox);
        this.customLaunchersBox._vis_iter = this.customLaunchersBoxIter;
        let customLaunchers = this.pref_custom_launchers;

        // Non-inverted = The "first" button is the left-most one.
        // Inverted = The "first" button is the right-most one.
        if (this.pref_custom_launchers_box_invert_buttons_order) {
            customLaunchers = customLaunchers.slice().reverse();
        }

        // Don't bother optimizing this loop.
        for (let btn_props of customLaunchers) {
            if (btn_props["command"] === "" || btn_props["icon"] === "") {
                continue;
            }

            let app = {
                command: btn_props["command"],
                description: btn_props["description"],
                label: btn_props["title"],
                icon: btn_props["icon"],
                icon_size: this.pref_custom_launchers_icon_size
            };

            let button = new $.CustomCommandButton(this, app);
            button.actor.connect("leave-event", Lang.bind(this, this._appLeaveEvent, button));
            this._addEnterEvent(button, Lang.bind(this, this._customLauncherEnterEvent, button));
            this._setSelectedItemTooltip(button, button.app.label, button.app.description || "");
            this.customLaunchersBox.add_actor(button.actor);
        }
    },

    _updateVFade: function() {
        let mag_on = this.a11y_settings.get_boolean("screen-magnifier-enabled") &&
            this.a11y_mag_settings.get_double("mag-factor") > 1.0;
        if (mag_on) {
            this.applicationsScrollBox.style_class = "menu-applications-scrollbox";
        } else {
            this.applicationsScrollBox.style_class = "vfade menu-applications-scrollbox";
        }
    },

    _update_autoscroll: function() {
        this.applicationsScrollBox.set_auto_scrolling(this.pref_enable_autoscroll);
    },

    _on_allocation_changed: function(box, flags, data) { // jshint ignore:line
        this._recalc_height();
    },

    _clearAllSelections: function(hide_apps) {
        let actors = this.applicationsBox.get_children();
        for (let i = actors.length - 1; i >= 0; i--) {
            actors[i].style_class = "menu-application-button";
            if (hide_apps) {
                actors[i].hide();
            }
        }

        actors = this.categoriesBox.get_children();
        for (let i = actors.length - 1; i >= 0; i--) {
            actors[i].style_class = "menu-category-button";
            actors[i].show();
        }
    },

    _selectCategory: function(aName) {
        if (aName === this.lastSelectedCategory) {
            return;
        }

        this.lastSelectedCategory = aName;

        if (aName === "favorites") {
            this._displayButtons(aName);
        } else if (aName === "recentApps") {
            this._displayButtons(aName, null, null, null, null, true);
        } else if (aName === "places") {
            this._displayButtons(null, -1);
        } else if (aName === "recentFiles") {
            this._displayButtons(null, null, -1);
        } else if (aName == null) {
            this._displayButtons(this._listApplications(null));
        } else {
            this._displayButtons(this._listApplications(aName));
        }

        this.closeContextMenus(null, false);
    },

    closeContextMenus: function(excluded, animate) {
        for (let i = this._applicationsButtons.length - 1; i >= 0; i--) {
            if (this._applicationsButtons[i] != excluded && this._applicationsButtons[i].menu.isOpen) {
                if (animate) {
                    this._applicationsButtons[i].toggleMenu();
                } else {
                    this._applicationsButtons[i].closeMenu();
                }
            }
        }

        if (this.recentContextMenu) {
            let item = this.recentContextMenu.sourceActor._delegate;

            if ((item != excluded || excluded == null) && item.menu && item.menu.isOpen) {
                if (animate) {
                    this.recentContextMenu.toggle();
                } else {
                    this.recentContextMenu.close();
                }

                this._activeContextMenuParent = null;
                this._activeContextMenuItem = null;
            }
        }
    },

    _resize_actor_iter: function(actor) {
        let [min, nat] = actor.get_preferred_width(-1.0); // jshint ignore:line
        if (nat > this._applicationsBoxWidth) {
            this._applicationsBoxWidth = nat;
            this.applicationsBox.set_width(this._applicationsBoxWidth + 42); // The answer to life...
        }
    },

    _resizeApplicationsBox: function() {
        this._applicationsBoxWidth = 0;
        this.applicationsBox.set_width(-1);
        let child = this.applicationsBox.get_first_child();
        this._resize_actor_iter(child);

        while ((child = child.get_next_sibling()) != null) {
            this._resize_actor_iter(child);
        }
    },

    _loopAppButtons: function(aButtons, aAction) {
        for (let i = aButtons.length - 1; i >= 0; i--) {
            aButtons[i].actor[aAction]();
        }
    },

    _displayButtons: function(aAppCategory, aPlaces, aRecentFiles, aApps, aAutocompletes, aRecentApps) {
        if (aAppCategory) {
            if (aAppCategory == "favorites") {
                for (let i = this._applicationsButtons.length - 1; i >= 0; i--) {
                    if (AppFavorites.getAppFavorites().isFavorite(this._applicationsButtons[i].app.get_id())) {
                        this._applicationsButtons[i].actor.show();
                    } else {
                        this._applicationsButtons[i].actor.hide();
                    }
                }
            } else {
                for (let i = this._applicationsButtons.length - 1; i >= 0; i--) {
                    if (this._applicationsButtons[i].category.indexOf(aAppCategory) != -1) {
                        this._applicationsButtons[i].actor.show();
                    } else {
                        this._applicationsButtons[i].actor.hide();
                    }
                }
            }
        } else if (aApps) {
            for (let i = this._applicationsButtons.length - 1; i >= 0; i--) {
                if (aApps.indexOf(this._applicationsButtons[i].app.get_id()) != -1) {
                    this._applicationsButtons[i].actor.show();
                } else {
                    this._applicationsButtons[i].actor.hide();
                }
            }
        } else {
            this._loopAppButtons(this._applicationsButtons, "hide");
            // for (let i = this._applicationsButtons.length - 1; i >= 0; i--) {
            //     this._applicationsButtons[i].actor.hide();
            // }
        }
        if (aPlaces) {
            if (aPlaces == -1) {
                this._loopAppButtons(this._placesButtons, "show");
                // for (let i = this._placesButtons.length - 1; i >= 0; i--) {
                //     this._placesButtons[i].actor.show();
                // }
            } else {
                for (let i = this._placesButtons.length - 1; i >= 0; i--) {
                    if (aPlaces.indexOf(this._placesButtons[i].button_name) != -1) {
                        this._placesButtons[i].actor.show();
                    } else {
                        this._placesButtons[i].actor.hide();
                    }
                }
            }
        } else {
            this._loopAppButtons(this._placesButtons, "hide");
            // for (let i = this._placesButtons.length - 1; i >= 0; i--) {
            //     this._placesButtons[i].actor.hide();
            // }
        }
        if (aRecentFiles) {
            if (aRecentFiles == -1) {
                this._loopAppButtons(this._recentButtons, "show");
                // for (let i = this._recentButtons.length - 1; i >= 0; i--) {
                //     this._recentButtons[i].actor.show();
                // }
            } else {
                for (let i = this._recentButtons.length - 1; i >= 0; i--) {
                    if (aRecentFiles.indexOf(this._recentButtons[i].button_name) != -1) {
                        this._recentButtons[i].actor.show();
                    } else {
                        this._recentButtons[i].actor.hide();
                    }
                }
            }
        } else {
            this._loopAppButtons(this._recentButtons, "hide");
            // for (let i = this._recentButtons.length - 1; i >= 0; i--) {
            //     this._recentButtons[i].actor.hide();
            // }
        }

        if (aRecentApps) {
            this._loopAppButtons(this._recentAppsButtons, "show");
            // for (let i = this._recentAppsButtons.length - 1; i >= 0; i--) {
            //     this._recentAppsButtons[i].actor.show();
            // }
        } else {
            this._loopAppButtons(this._recentAppsButtons, "hide");
            // for (let i = this._recentAppsButtons.length - 1; i >= 0; i--) {
            //     this._recentAppsButtons[i].actor.hide();
            // }
        }

        if (aAutocompletes) {
            for (let i = this._transientButtons.length - 1; i >= 0; i--) {
                this._transientButtons[i].actor.destroy();
            }
            this._transientButtons = [];
            // DO NOT USE INVERSE LOOP HERE!!!
            let i = 0,
                iLen = aAutocompletes.length;
            for (; i < iLen; i++) {
                let button = new $.TransientButton(this, aAutocompletes[i]);
                button.actor.connect("leave-event", Lang.bind(this, this._appLeaveEvent, button));
                this._addEnterEvent(button, Lang.bind(this, this._appEnterEvent, button));
                this._setSelectedItemTooltip(button, button.app.get_name(), button.app.get_description() || "");
                this._transientButtons.push(button);
                this.applicationsBox.add_actor(button.actor);
                button.actor.realize();
            }
        }

        for (let i = this._searchProviderButtons.length - 1; i >= 0; i--) {
            if (this._searchProviderButtons[i].actor.visible) {
                this._searchProviderButtons[i].actor.hide();
            }
        }
    },

    _setCategoriesButtonActive: function(active) {
        try {
            let categoriesButtons = this.categoriesBox.get_children();
            for (let i = categoriesButtons.length - 1; i >= 0; i--) {
                if (active) {
                    categoriesButtons[i].set_style_class_name("menu-category-button");
                } else {
                    categoriesButtons[i].set_style_class_name("menu-category-button-greyed");
                }

            }
        } catch (e) {
            global.log(e);
        }
    },

    resetSearch: function() {
        this.searchEntry.set_text("");
        this._previousSearchPattern = "";
        this.searchActive = false;
        this._clearAllSelections(true);
        this._setCategoriesButtonActive(true);
        global.stage.set_key_focus(this.searchEntry);
    },

    _onSearchTextChanged: function(se, prop) { // jshint ignore:line
        if (this.menuIsOpening) {
            this.menuIsOpening = false;
            return;
        } else {
            let searchString = this.searchEntry.get_text();
            if (searchString == "" && !this.searchActive) {
                return;
            }
            this.searchActive = searchString != "";
            this._fileFolderAccessActive = this.searchActive && this.pref_search_filesystem;
            this._clearAllSelections();

            if (this.searchActive) {
                this.searchEntry.set_secondary_icon(this._searchActiveIcon);
                if (this._searchIconClickedId == 0) {
                    this._searchIconClickedId = this.searchEntry.connect("secondary-icon-clicked",
                        Lang.bind(this, function() {
                            this.resetSearch();
                            this._selectCategory("favorites");
                        }));
                }
                this._setCategoriesButtonActive(false);
                this._doSearch();
            } else {
                if (this._searchIconClickedId > 0) {
                    this.searchEntry.disconnect(this._searchIconClickedId);
                }
                this._searchIconClickedId = 0;
                this.searchEntry.set_secondary_icon(this._searchInactiveIcon);
                this._previousSearchPattern = "";
                this._setCategoriesButtonActive(true);
                this._selectCategory("favorites");
                this._favoritesCategoryButton.actor.style_class = "menu-category-button-selected";
                this._activeContainer = null;
            }
            return;
        }
    },

    _listBookmarks: function(pattern) {
        let bookmarks = Main.placesManager.getBookmarks();
        let res = [];
        // DO NOT USE INVERSE LOOP HERE!!!
        let i = 0,
            iLen = bookmarks.length;
        for (; i < iLen; i++) {
            if (!pattern || bookmarks[i].name.toLowerCase().indexOf(pattern) != -1) {
                res.push(bookmarks[i]);
            }
        }
        return res;
    },

    _listDevices: function(pattern) {
        let devices = Main.placesManager.getMounts();
        let res = [];
        // DO NOT USE INVERSE LOOP HERE!!!
        let i = 0,
            iLen = devices.length;
        for (; i < iLen; i++) {
            if (!pattern || devices[i].name.toLowerCase().indexOf(pattern) != -1) {
                res.push(devices[i]);
            }
        }
        return res;
    },

    _listApplications: function(category_menu_id, pattern) {
        let applist = [];
        if (category_menu_id) {
            applist = category_menu_id;
        } else {
            applist = "all";
        }
        let res;
        if (pattern) {
            res = [];
            let regexpPattern = new RegExp("\\b" + pattern);
            let foundByName = false;
            // DO NOT USE INVERSE LOOP HERE!!!
            let i = 0,
                iLen = this._applicationsButtons.length;
            for (; i < iLen; i++) {
                if (Util.latinise(this._applicationsButtons[i].app.get_name().toLowerCase()).match(regexpPattern) != null) {
                    res.push(this._applicationsButtons[i].app.get_id());
                    foundByName = true;
                }
            }

            if (!foundByName) {
                // DO NOT USE INVERSE LOOP HERE!!!
                let i = 0,
                    iLen = this._applicationsButtons.length;
                for (; i < iLen; i++) {
                    if (Util.latinise(this._applicationsButtons[i].app.get_name().toLowerCase()).indexOf(pattern) != -1 ||
                        (this._applicationsButtons[i].app.get_keywords() &&
                            Util.latinise(this._applicationsButtons[i].app.get_keywords().toLowerCase()).indexOf(pattern) != -1) ||
                        (this._applicationsButtons[i].app.get_description() &&
                            Util.latinise(this._applicationsButtons[i].app.get_description().toLowerCase()).indexOf(pattern) != -1) ||
                        (this._applicationsButtons[i].app.get_id() &&
                            Util.latinise(this._applicationsButtons[i].app.get_id().slice(0, -8).toLowerCase()).indexOf(pattern) != -1)) {
                        res.push(this._applicationsButtons[i].app.get_id());
                    }
                }
            }
        } else {
            res = applist;
        }
        return res;
    },

    _doSearch: function() {
        this._searchTimeoutId = 0;
        let pattern = this.searchEntryText.get_text().replace(/^\s+/g, "").replace(/\s+$/g, "").toLowerCase();
        pattern = Util.latinise(pattern);
        if (pattern == this._previousSearchPattern) {
            return false;
        }
        this._previousSearchPattern = pattern;
        this._activeContainer = null;
        this._activeActor = null;
        this._selectedItemIndex = null;
        this._previousTreeSelectedActor = null;
        this._previousSelectedActor = null;

        // _listApplications returns all the applications when the search
        // string is zero length. This will happened if you type a space
        // in the search entry.
        if (pattern.length == 0) {
            return false;
        }

        let appResults = this._listApplications(null, pattern);
        let placesResults = [];
        let bookmarks = this._listBookmarks(pattern);
        // DO NOT USE INVERSE LOOP HERE!!!
        let b = 0,
            bLen = bookmarks.length;
        for (; b < bLen; b++) {
            placesResults.push(bookmarks[b].name);
        }

        let devices = this._listDevices(pattern);
        // DO NOT USE INVERSE LOOP HERE!!!
        let d = 0,
            dLen = devices.length;
        for (; d < dLen; d++) {
            placesResults.push(devices[d].name);
        }

        let recentResults = [];
        // DO NOT USE INVERSE LOOP HERE!!!
        let r = 0,
            rLen = this._recentButtons.length;
        for (; r < rLen; r++) {
            if (!(this._recentButtons[r] instanceof $.RecentClearButton) && this._recentButtons[r].button_name.toLowerCase().indexOf(pattern) != -1) {
                recentResults.push(this._recentButtons[r].button_name);
            }
        }

        let acResults = []; // search box autocompletion results
        if (this.pref_search_filesystem) {
            // Don't use the pattern here, as filesystem is case sensitive
            acResults = this._getCompletions(this.searchEntryText.get_text());
        }

        this._displayButtons(null, placesResults, recentResults, appResults, acResults);

        this.appBoxIter.reloadVisible();
        if (this.appBoxIter.getNumVisibleChildren() > 0) {
            let item_actor = this.appBoxIter.getFirstVisible();
            this._selectedItemIndex = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
            this._activeContainer = this.applicationsBox;
            if (item_actor && item_actor != this.searchEntry) {
                item_actor._delegate.emit("enter-event");
            }
        }

        if (this.SearchProviderManager && this.pref_search_providers_results_enabled) {
            this.SearchProviderManager.launch_all(pattern, Lang.bind(this, function(provider, results) {
                try {
                    // DO NOT USE INVERSE LOOP HERE!!!
                    let i = 0,
                        iLen = results.length;
                    for (; i < iLen; i++) {
                        if (results[i].type != "software") {
                            let button = new $.SearchProviderResultButton(this, provider, results[i]);
                            button.actor.connect("leave-event", Lang.bind(this, this._appLeaveEvent, button));
                            this._addEnterEvent(button, Lang.bind(this, this._appEnterEvent, button));
                            this._setSelectedItemTooltip(button, button.app.get_name(), button.app.get_description() || "");
                            this._searchProviderButtons.push(button);
                            this.applicationsBox.add_actor(button.actor);
                            button.actor.realize();
                        }
                    }
                } catch (e) {
                    global.log(e);
                }
            }));
        }

        return false;
    },

    _getCompletion: function(text) {
        if (text.indexOf("/") != -1) {
            if (text.substr(text.length - 1) == "/") {
                return "";
            } else {
                return this._pathCompleter.get_completion_suffix(text);
            }
        } else {
            return false;
        }
    },

    _getCompletions: function(text) {
        if (text.indexOf("/") != -1) {
            return this._pathCompleter.get_completions(text);
        } else {
            return [];
        }
    },

    _run: function(input) {
        this._commandError = false;
        if (input) {
            let path = null;
            if (input.charAt(0) == "/") {
                path = input;
            } else {
                if (input.charAt(0) == "~") {
                    input = input.slice(1);
                }
                path = GLib.get_home_dir() + "/" + input;
            }

            if (GLib.file_test(path, GLib.FileTest.EXISTS)) {
                let file = Gio.file_new_for_path(path);
                try {
                    Gio.app_info_launch_default_for_uri(file.get_uri(),
                        global.create_app_launch_context());
                } catch (e) {
                    // The exception from gjs contains an error string like:
                    //     Error invoking Gio.app_info_launch_default_for_uri: No application
                    //     is registered as handling this file
                    // We are only interested in the part after the first colon.
                    // let message = e.message.replace(/[^:]*: *(.+)/, '$1');
                    return false;
                }
            } else {
                return false;
            }
        }

        return true;
    },

    closeMainMenu: function() {
        this.menu.close(this.pref_animate_menu);
    },

    _setSelectedItemTooltip: function(aEl, aTitle, aDescription) {
        if (aEl && aEl.tooltip) {
            try {
                // Whithout using the escapeHTML function, the following warning is logged.
                // Clutter-WARNING **: Failed to set the markup of the actor 'ClutterText':
                // Error on line 1: Entity did not end with a semicolon; most likely you used
                // an ampersand character without intending to start an entity - escape ampersand
                // as &amp;
                aEl.tooltip._tooltip.get_clutter_text().set_markup(
                    (aTitle ? '<span weight="bold">' + $.escapeHTML(aTitle) + "</span>" : "") +
                    (aTitle && aDescription ? "\n" : "") +
                    (aDescription ? $.escapeHTML(aDescription) : "")
                );
            } catch (aErr) {
                global.logError(aErr);
                aEl.tooltip._tooltip.set_text(
                    (aTitle ? aTitle : "") +
                    (aTitle && aDescription ? "\n" : "") +
                    (aDescription ? aDescription : "")
                );
            }
        }
    },

    _hardRefreshAll: function() {
        if (this._hardRefreshTimeout) {
            Mainloop.source_remove(this._hardRefreshTimeout);
            this._hardRefreshTimeout = 0;
        }

        this._hardRefreshTimeout = Mainloop.timeout_add(500, Lang.bind(this, function() {
            this.initial_load_done = true;
            this.on_orientation_changed(this.orientation);
            this._hardRefreshTimeout = 0;
        }));
    },

    _onSettingsChanged: function(aPrefKey) {
        switch (aPrefKey) {
            case "pref_activate_on_hover":
            case "pref_menu_hover_delay":
                this._updateActivateOnHover();
                break;
            case "pref_use_a_custom_icon_for_applet":
            case "pref_custom_icon_for_applet":
            case "pref_custom_label_for_applet":
                this._updateIconAndLabel();
                break;
            case "pref_overlay_key":
                this._updateKeybinding();
                break;
            case "pref_show_category_icons":
            case "pref_show_application_icons":
                this._refreshAll();
                break;
            case "pref_search_filesystem":
                this._setupFilesystemSearch();
                break;
            case "pref_show_places":
                this._refreshBelowApps();
                break;
            case "pref_enable_autoscroll":
                this._update_autoscroll();
                break;
            case "pref_max_width_for_buttons":
            case "pref_context_show_uninstall":
            case "pref_context_show_bumblebee":
                this._updateGlobalPreferences();
                break;
            case "pref_show_recent_files":
                this._setupRecentFilesManager();
                break;
            case "pref_recently_used_apps_enabled":
                this._setupRecentAppsManager();
                break;
            case "pref_search_providers_results_enabled":
                this._performConditionalImports();
                break;
            case "pref_hard_refresh_menu":
                this._hardRefreshAll();
                break;
        }
    }
};

function main(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
    return new CinnamonMenuSecondGeneration(aMetadata, aOrientation, aPanelHeight, aInstanceID);
}
