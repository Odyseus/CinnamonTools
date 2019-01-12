let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
}

const _ = $._;

const {
    gi: {
        Atk,
        Cinnamon,
        Clutter,
        CMenu,
        Gio,
        GLib,
        Gtk,
        Meta,
        St
    },
    mainloop: Mainloop,
    misc: {
        util: Util
    },
    ui: {
        appFavorites: AppFavorites,
        applet: Applet,
        main: Main,
        popupMenu: PopupMenu,
        settings: Settings
    }
} = imports;

function CinnamonMenuForkByOdyseus() {
    this._init.apply(this, arguments);
}

CinnamonMenuForkByOdyseus.prototype = {
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
            this._expandAppletContextMenu();
            Gtk.IconTheme.get_default().append_search_path(this.metadata.path + "/icons/");
        } catch (aErr) {
            global.logError(aErr);
        }

        Mainloop.idle_add(() => {
            try {
                this.appsys = Cinnamon.AppSystem.get_default();
                this.menuManager = new PopupMenu.PopupMenuManager(this);
                this.menu = new Applet.AppletPopupMenu(this, aOrientation);
                this.menuManager.addMenu(this.menu);
                this.menu_keybinding_name = this.metadata.uuid + "-" + this.instance_id;
                this.recentAppsCatName = this.instance_id + "recent_applications";
                this.favoritesCatName = this.instance_id + "favorites";
                this.searchResultsCatName = this.instance_id + "search_results";

                this._appletEnterEventId = 0;
                this._appletLeaveEventId = 0;
                this._appletHoverDelayId = 0;
                this._hardRefreshTimeout = 0;
                this._searchingTimeout = 0;
                this._updateRecentAppsId = 0;
                this._updateRecentAppsOnFavChangedId = 0;

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
                this._searchDatabase = [];
                this._searchResultButtons = [];
                this._recentAppsButtons = [];
                this._applicationsOrder = {};
                this._applicationsButtonFromApp = {};
                this._categoryButtons = [];
                this._selectedItemIndex = null;
                this._previousSelectedActor = null;
                this._previousVisibleIndex = null;
                this._previousTreeSelectedActor = null;
                this._activeContainer = null;
                this._activeActor = null;
                this._applicationsBoxWidth = 0;
                this.menuIsOpening = false;
                this._activeContextMenuParent = null;
                this._activeContextMenuItem = null;
                this._display();
                this.refreshing = false;
                this.recentAppsManager = null;
                this.lastSelectedCategory = null;
                this.recentAppsEmptyButton = null;
                this.recentAppsClearButton = null;
                this.searchResultsEmptyButton = null;
                this.searching = false;

                this.actor.connect("key-press-event",
                    (actor, event) => this._onSourceKeyPress(actor, event));
                this.menu.connect("open-state-changed",
                    (aMenu, aOpen) => this._onOpenStateChanged(aMenu, aOpen));
                /* NOTE: Triggering this.onAppSysChanged in the below connections
                 * because inside this.onAppSysChanged is triggered this._hardRefreshAll.
                 * this._hardRefreshAll is triggered because I fed up of the asymmetry
                 * of the menu elements when they are re-allocated/styled. So,
                 * using this._hardRefreshAll will rebuild the entire menu from scratch.
                 * (When the scalpel doesn't cut it, use the freaking sledgehammer!!!)
                 */
                Main.themeManager.connect("theme-set",
                    () => this.onAppSysChanged());
                this.appsys.connect("installed-changed",
                    () => this.onAppSysChanged());

                this._setupRecentAppsManager();
                this._updateGlobalPreferences();
                this._updateActivateOnHover();
                this._updateKeybinding();
                this._updateIconAndLabel();

                // We shouldn't need to call _refreshAll() here... since we get a "icon-theme-changed" signal when CSD starts.
                // The reason we do is in case the Cinnamon icon theme is the same as the one specified in GTK itself (in .config)
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
            "pref_enable_autoscroll",
            "pref_menu_hover_delay",
            // Extras
            "pref_strict_search_results",
            "pref_swap_categories_box",
            "pref_hide_applications_list_scrollbar",
            "pref_category_icon_size",
            "pref_application_icon_size",
            "pref_search_result_icon_size",
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
            "pref_hard_refresh_menu",
            "pref_max_search_results"
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
        menuItem.connect("activate", () => this._launch_editor());
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(_("Edit custom launchers"),
            "preferences-other", St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => {
            Util.spawn_async([this.metadata.path + "/appletHelper.py", this.instance_id], null);
        });
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(_("Help"),
            "dialog-information", St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => {
            Util.spawn_async(["xdg-open", this.metadata.path + "/HELP.html"], null);
        });
        this._applet_context_menu.addMenuItem(menuItem);
    },

    _setupRecentAppsManager: function() {
        if (this.recentAppsManager && this._updateRecentAppsId > 0) {
            this.recentAppsManager.disconnect(this._updateRecentAppsId);
        }

        if (this._updateRecentAppsOnFavChangedId > 0) {
            AppFavorites.getAppFavorites().disconnect(this._updateRecentAppsOnFavChangedId);
        }

        if (this.pref_recently_used_apps_enabled && !this.recentAppsManager) {
            this.recentAppsManager = new $.RecentAppsManager(this);
            this._updateRecentAppsId = this.recentAppsManager.connect(
                "changed::pref-recently-used-applications",
                () => this._refreshRecentApps()
            );

            /* NOTE: When adding a favorite from the applications listed inside the
             * recent apps. category, the list of recent apps. will be updated
             * to ignore the recently favorited app. (if configured to do so) and
             * a call to this._displayButtons will be made to update the list
             * of recent apps. category. WOW Isn't this micro-managing!?
             */
            if (this.pref_recently_used_apps_ignore_favorites) {
                this._updateRecentAppsOnFavChangedId = AppFavorites
                    .getAppFavorites().connect("changed",
                        () => {
                            this.recentAppsManager.filterAndStore();

                            if (this.lastSelectedCategory === this.recentAppsCatName) {
                                this._displayButtons(this.lastSelectedCategory);
                            }
                        });
            }
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
        Main.keybindingManager.addHotKey(this.menu_keybinding_name, this.pref_overlay_key, () => {
            if (!Main.overview.visible && !Main.expo.visible) {
                this.menu.toggle_with_options(this.pref_animate_menu);
            }
        });
    },

    onAppSysChanged: function() {
        if (!this.refreshing) {
            this.refreshing = true;
            Mainloop.timeout_add_seconds(1, () => this._hardRefreshAll());
        }
    },

    _refreshAll: function() {
        try {
            this._refreshApps();
        } catch (aErr) {
            global.logError(aErr);
        } finally {
            this._resizeApplicationsBox();
            this.refreshing = false;
        }
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
            this._appletEnterEventId = this.actor.connect("enter-event", () => {
                if (this.pref_menu_hover_delay > 0) {
                    this._appletLeaveEventId = this.actor.connect("leave-event", () => this._clearDelayCallbacks());
                    this._appletHoverDelayId = Mainloop.timeout_add(this.pref_menu_hover_delay,
                        () => {
                            this.openMenu();
                            this._clearDelayCallbacks();
                        });
                } else {
                    this.openMenu();
                }
            });
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

        this.menu.connect("open-state-changed",
            (aMenu, aOpen) => this._onOpenStateChanged(aMenu, aOpen));
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

        if (this.recentAppsManager && this._updateRecentAppsId > 0) {
            this.recentAppsManager.disconnect(this._updateRecentAppsId);
        }

        if (this._updateRecentAppsOnFavChangedId > 0) {
            AppFavorites.getAppFavorites().disconnect(this._updateRecentAppsOnFavChangedId);
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

        if (symbol === Clutter.KEY_space || symbol === Clutter.KEY_Return) {
            this.menu.toggle();
            return true;
        } else if (symbol === Clutter.KEY_Escape && this.menu.isOpen) {
            this.closeMainMenu();
            return true;
        } else if (symbol === Clutter.KEY_Down) {
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
            this._selectCategory(this.favoritesCatName);
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
            } else {
                // _clearAllSelections is also called by resetSearch.
                this._clearAllSelections();
            }

            this._previousTreeSelectedActor = null;
            this._previousSelectedActor = null;
            this.closeContextMenus(null, false);
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
        if (this.pref_use_a_custom_icon_for_applet) {
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
        } else {
            this._set_default_menu_icon();
        }

        if (this.pref_use_a_custom_icon_for_applet && this.pref_custom_icon_for_applet === "") {
            this._applet_icon_box.hide();
        } else {
            this._applet_icon_box.show();
        }

        // no menu label if in a vertical panel
        if (this.orientation === St.Side.LEFT || this.orientation === St.Side.RIGHT) {
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

        if (this.orientation === St.Side.LEFT || this.orientation === St.Side.RIGHT) {
            this.hide_applet_label(true);
        } else {
            if (this.pref_custom_label_for_applet === "") {
                this.hide_applet_label(true);
            } else {
                this.hide_applet_label(false);
            }
        }
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

        if (action === Meta.KeyBindingAction.CUSTOM) {
            return true;
        }

        index = this._selectedItemIndex;

        let ctrlKey = modifierState & Clutter.ModifierType.CONTROL_MASK;

        // If a context menu is open, hijack keyboard navigation and concentrate on the context menu.
        if (this._activeContextMenuParent && this._activeContextMenuParent._contextIsOpen &&
            this._activeContainer === this.applicationsBox &&
            (this._activeContextMenuParent instanceof $.GenericApplicationButton)) {
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
                } else {
                    navigationKey = false;
                }

                switch (this._activeContainer) {
                    case this.applicationsBox:
                        whichWay = this.pref_swap_categories_box ? "left" : "right";
                        break;
                    case this.categoriesBox:
                        let catBtn = this.categoriesBox.get_child_at_index(index)._delegate;
                        let isRecentAppsCatButton = catBtn.hasOwnProperty("category_id") &&
                            catBtn.category_id === this.recentAppsCatName;

                        if (isRecentAppsCatButton && this.recentAppsManager.recentApps.length === 0) {
                            whichWay = "none";
                        } else {
                            whichWay = this.pref_swap_categories_box ? "right" : "left";
                        }
                        break;
                    case this.customLaunchersBox:
                        whichWay = "jump-right";
                        break;
                    case null:
                        whichWay = "none";
                        break;
                }
                break;
            case Clutter.KEY_Left:
                if (!this.searchActive) {
                    whichWay = this.pref_swap_categories_box ? "right" : "left";
                } else {
                    navigationKey = false;
                }

                switch (this._activeContainer) {
                    case this.applicationsBox:
                        whichWay = this.pref_swap_categories_box ? "left" : "right";
                        break;
                    case this.categoriesBox:
                        let catBtn = this.categoriesBox.get_child_at_index(index)._delegate;
                        let isRecentAppsCatButton = catBtn.hasOwnProperty("category_id") &&
                            catBtn.category_id === this.recentAppsCatName;

                        if (isRecentAppsCatButton && this.recentAppsManager.recentApps.length === 0) {
                            whichWay = "none";
                        } else {
                            whichWay = this.pref_swap_categories_box ? "left" : "right";
                        }
                        break;
                    case this.customLaunchersBox:
                        whichWay = "jump-left";
                        break;
                    case null:
                        whichWay = "none";
                        break;
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
                            item_actor = (this._previousVisibleIndex !== null) ?
                                this.appBoxIter.getVisibleItem(this._previousVisibleIndex) :
                                this.appBoxIter.getFirstVisible();
                            break;
                        case "left":
                            item_actor = (this._previousVisibleIndex !== null) ?
                                this.appBoxIter.getVisibleItem(this._previousVisibleIndex) :
                                this.appBoxIter.getFirstVisible();
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
                            item_actor = (this._previousTreeSelectedActor !== null) ?
                                this._previousTreeSelectedActor :
                                this.catBoxIter.getFirstVisible();
                            this._previousTreeSelectedActor = item_actor;
                            index = item_actor.get_parent()._vis_iter.getAbsoluteIndexOfChild(item_actor);
                            break;
                        case "left":
                            this._previousSelectedActor = this.applicationsBox.get_child_at_index(index);
                            item_actor = (this._previousTreeSelectedActor !== null) ?
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
                    if (item_actor._delegate instanceof $.GenericApplicationButton) {
                        item_actor._delegate.activateContextMenus();
                    }
                }
                return true;
            } else if (this._activeContainer === this.applicationsBox && symbol === Clutter.KEY_Menu) {
                item_actor = this.applicationsBox.get_child_at_index(this._selectedItemIndex);
                if (item_actor._delegate instanceof $.GenericApplicationButton) {
                    item_actor._delegate.activateContextMenus();
                }
                return true;
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
        let _callback = () => {
            let parent = button.actor.get_parent();
            if (this._activeContainer === this.categoriesBox && parent !== this._activeContainer) {
                this._previousTreeSelectedActor = this._activeActor;
                this._previousSelectedActor = null;
            }
            if (this._previousTreeSelectedActor && this._activeContainer !== this.categoriesBox &&
                parent !== this._activeContainer && button !== this._previousTreeSelectedActor && !this.searchActive) {
                this._previousTreeSelectedActor.style_class = "menu-category-button";
            }
            if (parent !== this._activeContainer) {
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
        };
        button.connect("enter-event", _callback);
        button.actor.connect("enter-event", _callback);
    },

    _clearPrevSelection: function(actor) {
        if (this._previousSelectedActor && this._previousSelectedActor !== actor) {
            if (this._previousSelectedActor._delegate instanceof $.GenericApplicationButton ||
                this._previousSelectedActor._delegate instanceof $.RecentAppsClearButton ||
                this._previousSelectedActor._delegate instanceof $.CustomCommandButton) {
                this._previousSelectedActor.style_class = "menu-application-button";
            }
        }
    },

    _clearPrevCatSelection: function(actor) {
        if (this._previousTreeSelectedActor && this._previousTreeSelectedActor !== actor) {
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
            let i = catChildren.length;
            while (i--) {
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
        this.destroyVectorBox();
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

        this.vectorBox.connect("leave-event", () => this.destroyVectorBox());
        this.vectorBox.connect("motion-event", () => this.maybeUpdateVectorBox());
        this.actor_motion_id = actor.connect("motion-event", () => this.maybeUpdateVectorBox());
        this.current_motion_actor = actor;
    },

    maybeUpdateVectorBox: function() {
        if (this.vector_update_loop > 0) {
            Mainloop.source_remove(this.vector_update_loop);
            this.vector_update_loop = 0;
        }
        this.vector_update_loop = Mainloop.timeout_add(50, () => this.updateVectorBox());
    },

    updateVectorBox: function() {
        if (this.vectorBox) {
            let vi = this._getVectorInfo();
            if (vi) {
                this.vectorBox.ulc_x = vi.mx;
                this.vectorBox.llc_x = vi.mx;
                this.vectorBox.queue_repaint();
            } else {
                this.destroyVectorBox();
            }
        }
        this.vector_update_loop = 0;
        return false;
    },

    destroyVectorBox: function() {
        if (this.vectorBox !== null) {
            this.vectorBox.destroy();
            this.vectorBox = null;
        }

        if (this.actor_motion_id > 0 && this.current_motion_actor !== null) {
            this.current_motion_actor.disconnect(this.actor_motion_id);
            this.actor_motion_id = 0;
            this.current_motion_actor = null;
        }
    },

    _refreshRecentApps: function() {
        if (!this.pref_recently_used_apps_enabled) {
            let c = this._categoryButtons.length;
            while (c--) {
                if (this._categoryButtons[c].category_id === this.recentAppsCatName) {
                    this._categoryButtons[c].actor.destroy();
                    this._categoryButtons.splice(c, 1);
                    break;
                }
            }
            return;
        }

        let recentApplications = [];

        if (this.recentAppsManager.recentApps.length > 0) {
            // It doesn't matter the "direction" of either of these loops.
            // recentApplications will be sorted anyways.
            let i = this._applicationsButtons.length;
            while (i--) {
                if (this._applicationsButtons[i].buttonType === "app") {
                    let c = this.recentAppsManager.recentApps.length;
                    while (c--) {
                        let [recAppID, recLastAccess] = this.recentAppsManager.recentApps[c].split(":");

                        if (recAppID === this._applicationsButtons[i].get_app_id()) {
                            this._applicationsButtons[i].app.lastAccess = recLastAccess;
                            recentApplications.push({
                                app: this._applicationsButtons[i].app,
                                categories: this._applicationsButtons[i].category
                            });
                            continue;
                        }
                    }
                }
            }
            this.recentAppsEmptyButton.shouldBeDisplayed = false;
            this.recentAppsClearButton.shouldBeDisplayed = true;
        } else {
            if (this.recentAppsEmptyButton !== null) {
                this.recentAppsEmptyButton.shouldBeDisplayed = true;
            }

            if (this.recentAppsClearButton !== null) {
                this.recentAppsClearButton.shouldBeDisplayed = false;
            }
        }

        if (recentApplications.length > 0) {
            recentApplications = recentApplications.sort((a, b) => {
                return this.pref_recently_used_apps_invert_order ?
                    a["app"]["lastAccess"] > b["app"]["lastAccess"] :
                    a["app"]["lastAccess"] < b["app"]["lastAccess"];
            });
        }

        let i = 0,
            iLen = this._recentAppsButtons.length;
        for (; i < iLen; i++) {
            let rAB = this._recentAppsButtons[i];
            if (recentApplications[i]) {
                let app = recentApplications[i].app;
                rAB.populateItem(app);
                rAB.shouldBeDisplayed = true;
                this._setSelectedItemTooltip(
                    rAB,
                    rAB.app.get_name(),
                    rAB.app.get_description() || "",
                    recentApplications[i].categories
                );
            } else {
                rAB.shouldBeDisplayed = false;
            }
        }
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
        let c = this._categoryButtons.length;
        while (c--) {
            if (this._categoryButtons[c] instanceof $.CategoryButton) {
                this._categoryButtons[c].destroy();
                this._categoryButtons.splice(c, 1);
            }
        }

        let a = this._applicationsButtons.length;
        while (a--) {
            this._applicationsButtons[a].destroy();
            this._applicationsButtons.splice(a, 1);
        }

        this._applicationsButtons = [];
        this._applicationsButtonFromApp = {};
        this._applicationsBoxWidth = 0;
        this._searchDatabase = [];

        let favCat = {
            get_menu_id: () => {
                return this.favoritesCatName;
            },
            get_id: () => {
                return -1;
            },
            get_description: () => {
                return this.get_name();
            },
            get_name: () => {
                return _("Favorites");
            },
            get_is_nodisplay: () => {
                return false;
            },
            get_icon: () => {
                return "user-bookmarks";
            }
        };

        this._favoritesCategoryButton = new $.CategoryButton(this, favCat);
        this._addEnterEvent(this._favoritesCategoryButton, () => {
            this._favoritesCategoryButton.isHovered = true;

            this._clearPrevCatSelection(this._favoritesCategoryButton.actor);
            this._favoritesCategoryButton.actor.style_class = "menu-category-button-selected";
            this._selectCategory(this.favoritesCatName);

            this.makeVectorBox(this._favoritesCategoryButton.actor);
        });
        this._favoritesCategoryButton.actor.connect("leave-event", () => {
            this._previousSelectedActor = this._favoritesCategoryButton.actor;
            this._favoritesCategoryButton.isHovered = false;
        });

        this.categoriesBox.add_actor(this._favoritesCategoryButton.actor);
        this._categoryButtons.push(this._favoritesCategoryButton);

        if (this.pref_recently_used_apps_enabled) {
            let recentAppsCat = {
                get_menu_id: () => {
                    return this.recentAppsCatName;
                },
                get_id: () => {
                    return -1;
                },
                get_description: () => {
                    return this.get_name();
                },
                get_name: () => {
                    return _("Recent Applications");
                },
                get_is_nodisplay: () => {
                    return false;
                },
                get_icon: () => {
                    return "folder-recent";
                }
            };

            this.recentAppsCatButton = new $.CategoryButton(this, recentAppsCat);
            this._addEnterEvent(this.recentAppsCatButton, () => {
                this.recentAppsCatButton.isHovered = true;

                this._clearPrevCatSelection(this.recentAppsCatButton.actor);
                this.recentAppsCatButton.actor.style_class = "menu-category-button-selected";
                this._selectCategory(this.recentAppsCatName);

                this.makeVectorBox(this.recentAppsCatButton.actor);
            });

            this.recentAppsCatButton.actor.connect("leave-event", () => {
                this._previousSelectedActor = this.recentAppsCatButton.actor;
                this.recentAppsCatButton.isHovered = false;
            });
            this.categoriesBox.add_actor(this.recentAppsCatButton.actor);
            this._categoryButtons.push(this.recentAppsCatButton);
        }

        let trees = [this.appsys.get_tree()];

        let handleEnterEvent = (categoryButton, dir) => {
            this._addEnterEvent(categoryButton, () => {
                categoryButton.isHovered = true;

                this._clearPrevCatSelection(categoryButton.actor);
                categoryButton.actor.style_class = "menu-category-button-selected";
                this._selectCategory(dir.get_menu_id());

                this.makeVectorBox(categoryButton.actor);
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
        let t = 0,
            tLen = trees.length;
        for (; t < tLen; t++) {
            let root = trees[t].get_root_directory();
            let dirs = [];
            let iter = root.iter();
            let nextType;

            while ((nextType = iter.next()) !== CMenu.TreeItemType.INVALID) {
                if (nextType === CMenu.TreeItemType.DIRECTORY) {
                    dirs.push(iter.get_directory());
                }
            }

            dirs = dirs.sort(this._sortDirs);

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
        // Sort apps and add to applicationsBox.
        // At this point, this._applicationsButtons only contains "pure"
        // application buttons.
        this._applicationsButtons.sort((a, b) => {
            a = Util.latinise(a.app.get_name().toLowerCase());
            b = Util.latinise(b.app.get_name().toLowerCase());
            return a > b;
        });

        /* NOTE:
         * From this point on, insertion order into this._applicationsButtons matters.
         */
        this.searchResultsEmptyButton = new $.GenericButton(this, {
            label: _("No search results"),
            button_type: "search_result"
        });
        this._applicationsButtons.push(this.searchResultsEmptyButton);

        // Add search result buttons here.
        let s = this.pref_max_search_results;
        while (s--) {
            let searchResultButton = new $.DummyApplicationButton(this, "search_result",
                this.pref_search_result_icon_size);
            this._handleButtonEnterEvent(searchResultButton);
            this._handleButtonLeaveEvent(searchResultButton);
            this._applicationsButtons.push(searchResultButton);
        }

        // Add recent apps buttons here.
        if (this.pref_recently_used_apps_enabled) {
            this.recentAppsEmptyButton = new $.GenericButton(this, {
                label: _("No recent applications"),
                button_type: "recent_application"
            });
            this._applicationsButtons.push(this.recentAppsEmptyButton);

            this.recentAppsClearButton = new $.RecentAppsClearButton(this);
            this._addEnterEvent(this.recentAppsClearButton, () => {
                this._clearPrevSelection(this.recentAppsClearButton.actor);
                this.recentAppsClearButton.actor.style_class = "menu-application-button-selected";
            });
            this.recentAppsClearButton.actor.connect("leave-event", () => {
                this.recentAppsClearButton.actor.style_class = "menu-application-button";
                this._previousSelectedActor = this.recentAppsClearButton.actor;
            });

            if (this.pref_recently_used_apps_invert_order) {
                this._applicationsButtons.push(this.recentAppsClearButton);
            }

            let r = this.pref_recently_used_apps_max_amount;
            while (r--) {
                let recentAppButton = new $.DummyApplicationButton(this,
                    "recent_application",
                    this.pref_application_icon_size);
                this._handleButtonEnterEvent(recentAppButton);
                this._handleButtonLeaveEvent(recentAppButton);
                this._applicationsButtons.push(recentAppButton);
            }

            if (!this.pref_recently_used_apps_invert_order) {
                this._applicationsButtons.push(this.recentAppsClearButton);
            }
        }

        // "Multipurpose" loop.
        // DO NOT USE INVERSE LOOP HERE!!!
        let i = 0,
            iLen = this._applicationsButtons.length;
        for (; i < iLen; i++) {
            let button = this._applicationsButtons[i];
            // Add button to menu.
            this.applicationsBox.add_actor(button.actor);

            // Add menu, if any. Check for menu existence instead of creating dummy
            // menus for buttons that doesn't need one.
            if (button.hasOwnProperty("menu")) {
                this.applicationsBox.add_actor(button.menu.actor);
            }

            // Handle only "pure" application buttons.
            if (button.buttonType === "app") {
                // Set the tooltip here because at this point is when the category
                // property of a button contains all categories an app. belongs to.
                this._setSelectedItemTooltip(
                    button,
                    button.app.get_name(),
                    button.app.get_description() || "",
                    button.category
                );

                // Store search data.
                this._storeAppSearchData(button.app, button.category);
            }
        }

        this._setStyling();

        Mainloop.idle_add(() => {
            // Store at menu build time the search results and recent apps. buttons.
            this._searchResultButtons = this._applicationsButtons.filter((x) => {
                return x.buttonType === "search_result" &&
                    x instanceof $.DummyApplicationButton;
            });

            this._recentAppsButtons = this._applicationsButtons.filter((x) => {
                return x.buttonType === "recent_application" &&
                    x instanceof $.DummyApplicationButton;
            });

            // Lets hope that reassigning this property eradicates from memory
            // its original and never to be used again content. ¬¬
            this._applicationsButtonFromApp = {};
            this._refreshRecentApps();
        });
    },

    _loadCategory: function(dir, top_dir) {
        let iter = dir.iter();
        let has_entries = false;
        let nextType;

        if (!top_dir) {
            top_dir = dir;
        }

        while ((nextType = iter.next()) !== CMenu.TreeItemType.INVALID) {
            if (nextType === CMenu.TreeItemType.ENTRY) {
                let entry = iter.get_entry();
                let appInfo = entry.get_app_info();

                if (appInfo && !appInfo.get_nodisplay()) {
                    has_entries = true;
                    let app = this.appsys.lookup_app_by_tree_entry(entry);
                    if (!app) {
                        app = this.appsys.lookup_settings_app_by_tree_entry(entry);
                    }
                    let app_key = app.get_id();
                    if (app_key === null) {
                        app_key = app.get_name() + ":" +
                            app.get_description();
                    }

                    if (!(app_key in this._applicationsButtonFromApp)) {
                        let applicationButton = new $.ApplicationButton(this, app);

                        this._handleButtonEnterEvent(applicationButton);
                        this._handleButtonLeaveEvent(applicationButton);
                        this._applicationsButtons.push(applicationButton);
                        applicationButton.category.push(top_dir.get_menu_id());
                        this._applicationsButtonFromApp[app_key] = applicationButton;
                    } else {
                        this._applicationsButtonFromApp[app_key].category.push(dir.get_menu_id());
                    }
                }
            } else if (nextType === CMenu.TreeItemType.DIRECTORY) {
                let subdir = iter.get_directory();
                if (this._loadCategory(subdir, top_dir)) {
                    has_entries = true;
                }
            }
        }
        return has_entries;
    },

    _handleButtonEnterEvent: function(aButton) {
        this._addEnterEvent(aButton, () => {
            this._appEnterEvent(aButton);
        });
    },

    _handleButtonLeaveEvent: function(aButton) {
        aButton.actor.connect("leave-event", (actor, event) => {
            this._appLeaveEvent(actor, event, aButton);
        });
    },

    _appLeaveEvent: function(actor, event, applicationButton) {
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
        if (new_scroll_value !== current_scroll_value) {
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
        this.searchEntryText.connect("text-changed", () => this._onSearchTextChanged());
        this.searchEntryText.connect("key-press-event",
            (actor, event) => this._onMenuKeyPress(actor, event));
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
        this.a11y_settings.connect("changed::screen-magnifier-enabled", () => this._updateVFade());
        this.a11y_mag_settings = new Gio.Settings({
            schema_id: "org.cinnamon.desktop.a11y.magnifier"
        });
        this.a11y_mag_settings.connect("changed::mag-factor", () => this._updateVFade());

        this._updateVFade();

        this._update_autoscroll();

        let vscroll = this.applicationsScrollBox.get_vscroll_bar();
        vscroll.connect("scroll-start",
            () => {
                this.menu.passEvents = true;
            });
        vscroll.connect("scroll-stop",
            () => {
                this.menu.passEvents = false;
            });

        this.applicationsBox = new St.BoxLayout({
            style_class: "menu-applications-inner-box",
            vertical: true
        });
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

        this.mainBox.add(this.rightPane, {
            span: 1
        });
        this.mainBox._delegate = null;
        section.actor.add(this.mainBox);

        this.appBoxIter = new $.VisibleChildIterator(this.applicationsBox);
        this.applicationsBox._vis_iter = this.appBoxIter;
        this.catBoxIter = new $.VisibleChildIterator(this.categoriesBox);
        this.categoriesBox._vis_iter = this.catBoxIter;

        Mainloop.idle_add(() => this._clearAllSelections());

        this.menu.actor.connect("allocation-changed",
            (box, flags, data) => this._on_allocation_changed(box, flags, data));

        this._updateCustomLaunchersBox();
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
    },

    _updateCustomLaunchersBox: function() {
        this.customLaunchersBox.destroy_all_children();
        this.customLaunchersBoxIter = new $.VisibleChildIterator(this.customLaunchersBox);
        this.customLaunchersBox._vis_iter = this.customLaunchersBoxIter;
        let customLaunchers = this.pref_custom_launchers;

        // Non-inverted = The "first" button is the left-most one.
        // Inverted = The "first" button is the right-most one.
        // Due to using an inverse loop for adding the button, reverse
        // the array if pref_custom_launchers_box_invert_buttons_order is disabled. LOL
        if (!this.pref_custom_launchers_box_invert_buttons_order) {
            customLaunchers = customLaunchers.slice().reverse();
        }

        let handleEnterEvent = (aButton) => {
            this._addEnterEvent(aButton, () => {
                this._customLauncherEnterEvent(aButton);
            });
        };

        let handleLeaveEvent = (aButton) => {
            aButton.actor.connect("leave-event", (actor, event) => {
                this._appLeaveEvent(actor, event, aButton);
            });
        };

        let i = customLaunchers.length;
        while (i--) {
            let btn_props = customLaunchers[i];

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
            handleLeaveEvent(button);
            handleEnterEvent(button);
            this._setSelectedItemTooltip(
                button,
                button.app.label,
                button.app.description || ""
            );
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

    _clearAllSelections: function() {
        /* NOTE: Take care of selected items, NOTHING more!
         */
        let actors = this.applicationsBox.get_children()
            .concat(this.customLaunchersBox.get_children());
        let i = actors.length;
        while (i--) {
            actors[i].style_class = "menu-application-button";
        }

        actors = this.categoriesBox.get_children();
        i = actors.length;
        while (i--) {
            actors[i].style_class = "menu-category-button";
        }
    },

    _selectCategory: function(aName) {
        if (aName === this.lastSelectedCategory) {
            return;
        }

        this.lastSelectedCategory = aName;
        this._displayButtons(aName);
        this.closeContextMenus(null, false);
    },

    closeContextMenus: function(excluded, animate) {
        let i = this._applicationsButtons.length;
        while (i--) {
            if (this._applicationsButtons[i] !== excluded &&
                this._applicationsButtons[i].hasOwnProperty("menu") &&
                this._applicationsButtons[i].menu.isOpen) {
                this._applicationsButtons[i][animate ?
                    "toggleMenu" :
                    "closeMenu"
                ]();
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

        while ((child = child.get_next_sibling()) !== null) {
            this._resize_actor_iter(child);
        }
    },

    _displayButtons: function(aAppCategory) {
        let i = this._applicationsButtons.length;
        while (i--) {
            let btn = this._applicationsButtons[i];
            let action;
            switch (aAppCategory) {
                case this.favoritesCatName:
                    action = (btn.buttonType === "app" &&
                            AppFavorites.getAppFavorites().isFavorite(btn.app.get_id())) ?
                        "show" :
                        "hide";
                    break;
                case this.searchResultsCatName:
                    action = btn.buttonType === "search_result" &&
                        btn instanceof $.DummyApplicationButton ?
                        "show" :
                        "hide";
                    break;
                case this.recentAppsCatName:
                    action = (btn.buttonType === "recent_application" &&
                            btn.shouldBeDisplayed) ?
                        "show" :
                        "hide";
                    break;
                default:
                    action = (btn.buttonType === "app" &&
                            btn.category.indexOf(aAppCategory) !== -1) ?
                        "show" :
                        "hide";
            }

            btn.actor[action]();
        }
    },

    _setCategoriesButtonActive: function(active) {
        let categoriesButtons = this.categoriesBox.get_children();
        let i = categoriesButtons.length;
        while (i--) {
            // If the mouse is moved over the categories box while performing a search,
            // the keyboard focus of the applications box will be lost.
            // Toggling the reactive state of the category buttons fixes this.
            categoriesButtons[i].reactive = active;
            categoriesButtons[i].set_style_class_name(
                active ?
                "menu-category-button" :
                "menu-category-button-greyed"
            );
        }
    },

    resetSearch: function() {
        this.searchEntry.set_secondary_icon(this._searchInactiveIcon);
        this.searchEntry.set_text("");
        this._previousSearchPattern = "";
        this.searchActive = false;
        this.searching = false;
        this._clearAllSelections();
        this._setCategoriesButtonActive(true);
        global.stage.set_key_focus(this.searchEntry);
    },

    _onSearchTextChanged: function(se, prop) { // jshint ignore:line
        if (this.menuIsOpening) {
            this.menuIsOpening = false;
            return;
        } else {
            this._searchingTimeout = Mainloop.timeout_add(50, () => {
                let searchString = this.searchEntry.get_text();
                if (searchString === "" && !this.searchActive) {
                    return false;
                }
                this.searchActive = searchString !== "";
                this._clearAllSelections();

                if (this.searchActive) {
                    this.searchEntry.set_secondary_icon(this._searchActiveIcon);
                    if (this._searchIconClickedId === 0) {
                        this._searchIconClickedId = this.searchEntry.connect("secondary-icon-clicked",
                            () => {
                                this.resetSearch();
                                this._onOpenStateChanged(null, true);
                            });
                    }
                    this._setCategoriesButtonActive(false);
                    this._doSearch();
                } else {
                    this.searching = false;
                    if (this._searchIconClickedId > 0) {
                        this.searchEntry.disconnect(this._searchIconClickedId);
                    }
                    this._searchIconClickedId = 0;
                    this.searchEntry.set_secondary_icon(this._searchInactiveIcon);
                    this._previousSearchPattern = "";
                    this._setCategoriesButtonActive(true);
                    this._onOpenStateChanged(null, true);
                }

                return false;
            });

            return;
        }
    },

    _fuzzyMatch: function(aNeedle, aHaystack, aResult, aMatchCount, aPriority) {
        let result = this._fuzzySearch(aNeedle, aHaystack, aPriority);

        if (result.matches) {
            aMatchCount += 1;
            aResult.matches = true;
            aResult.priority += result.priority + aPriority;
        }

        return {
            result: aResult,
            match_count: aMatchCount
        };
    },

    _fuzzySort: function() {
        return (a, b) => {
            let avalue = this._applicationsOrder[a] || 99999;
            let bvalue = this._applicationsOrder[b] || 99999;
            return avalue > bvalue;
        };
    },

    _fuzzySearch: function(aNeedle, aHaystack, aPriority) {
        let hlen = aHaystack.length;
        let nlen = aNeedle.length;
        let occurrenceAt = 0;
        let previousJ = 0;

        if (nlen > hlen) {
            return {
                matches: false,
                priority: 0
            };
        }

        if (nlen === hlen) {
            return {
                matches: aNeedle === aHaystack,
                priority: aPriority
            };
        }

        outer:
            for (let i = 0, j = 0; i < nlen; i++) {
                let nch = aNeedle.charCodeAt(i);
                while (j < hlen) {
                    if (aHaystack.charCodeAt(j++) === nch) {
                        if (previousJ === 0) {
                            previousJ = j;
                        } else {
                            if (aHaystack.charCodeAt(j - 2) == 32 && (previousJ == 1 ||
                                    aHaystack.charCodeAt(previousJ - 1) == 32)) {
                                // If every character in search pattern is preceded by
                                // a space and matches it should be first result.
                                occurrenceAt -= 100;
                            } else {
                                // Otherwise sort result based on the distance between
                                // matching characters
                                occurrenceAt = occurrenceAt + ((j - previousJ - 1) * 10);
                            }
                            previousJ = j;
                        }
                        occurrenceAt += j;
                        continue outer;
                    }
                }
                return {
                    matches: false,
                    priority: 0
                };
            }

        return {
            matches: true,
            priority: occurrenceAt
        };
    },

    _doSearch: function() {
        let pattern = Util.latinise(this.searchEntryText.get_text().trim().toLowerCase());

        if (pattern === this._previousSearchPattern) {
            this._ensureFirstAppSelected();
            return false;
        }

        this._previousSearchPattern = pattern;
        this._activeContainer = null;
        this._activeActor = null;
        this._selectedItemIndex = null;
        this._previousTreeSelectedActor = null;
        this._previousSelectedActor = null;

        // Don't bother to trigger search with just one character.
        if (pattern.length <= 1) {
            return false;
        }

        // Avoid triggering this._displayButtons on every keystroke while searching.
        // When searching, all buttons that need to be displayed are already visible,
        // and all that need to be hidden already are.
        /* NOTE: this.searchActive serves a different purpose and is set at
         * different times than this.searching.
         */
        if (!this.searching) {
            this.searching = true;
            this._displayButtons(this.searchResultsCatName);
        }

        let appResults = {};

        this._applicationsOrder = {};
        let i = this._searchDatabase.length;
        while (i--) {
            let result = {
                matches: false,
                priority: 0
            };
            let matchCount = 0;

            /* NOTE: Labeled statements.
             * Since I just learned of their existence, lets use them. LOL
             */
            let d = this._searchDatabase[i].haystacks.length;
            comb:
                while (d--) {
                    let haystack = this._searchDatabase[i].haystacks[d];

                    let h = haystack.data.length;
                    while (h--) {
                        /* NOTE: Exact app. name match logic.
                         * If the haystack is the app. name and the app. name
                         * contains the search pattern, stop looking for matches,
                         * set matchCount to one (so there is no average calculation) and
                         * multiply negative "distance" by 10.
                         * patternIndex is added (subtracted because priority is a very
                         * large negative number) so that when a pattern is closer to the
                         * beginning of a string (lower index), a greater priority it has.
                         */
                        let patternIndex = haystack.data[h].indexOf(pattern);
                        if (haystack.context === "name" &&
                            patternIndex >= 0) {
                            result = {
                                matches: true,
                                priority: (haystack.priority * 10) + patternIndex
                            };
                            matchCount = 1;
                            break comb;
                        }

                        let match = this._fuzzyMatch(
                            pattern, haystack.data[h], result, matchCount, haystack.priority
                        );
                        result = match.result;
                        matchCount = match.match_count;
                    }
                }

            if (result.matches) {
                result.priority = result.priority / matchCount;

                if (this.pref_strict_search_results &&
                    result.priority >= $.SEARCH_PRIORITY.VERY_LOW) {
                    continue;
                }

                appResults[this._searchDatabase[i].app.get_id()] = {
                    app: this._searchDatabase[i].app,
                    categories: this._searchDatabase[i].categories
                };
                this._applicationsOrder[this._searchDatabase[i].app.get_id()] = result.priority;
            }
        }

        let sortedResuls = Object.keys(appResults).sort(this._fuzzySort());
        // DO NOT USE INVERSE LOOP HERE!!!
        let b = 0,
            bLen = this._searchResultButtons.length;
        for (; b < bLen; b++) {
            let sRB = this._searchResultButtons[b];
            if (sortedResuls[b]) {
                sRB.populateItem(appResults[sortedResuls[b]].app);
                sRB.actor.show();
                this._setSelectedItemTooltip(
                    sRB,
                    appResults[sortedResuls[b]].app.get_name(),
                    appResults[sortedResuls[b]].app.get_description() || "",
                    appResults[sortedResuls[b]].categories
                );
            } else {
                sRB.actor.hide();
            }
        }

        this.searchResultsEmptyButton.actor[sortedResuls.length === 0 ? "show" : "hide"]();
        this._ensureFirstAppSelected();

        return false;
    },

    _ensureFirstAppSelected: function() {
        this.appBoxIter.reloadVisible();
        if (this.appBoxIter.getNumVisibleChildren() > 0) {
            let item_actor = this.appBoxIter.getFirstVisible();
            this._selectedItemIndex = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
            this._activeContainer = this.applicationsBox;
            if (item_actor && item_actor !== this.searchEntry) {
                item_actor._delegate.emit("enter-event");
            }
        }
    },

    _storeAppSearchData: function(aApp, aCategories) {
        let haystacks = [];

        let s = $.SEARCH_DATA.length;
        while (s--) {
            let context = $.SEARCH_DATA[s].context;

            let haystack = [];

            /* NOTE: Using regular expressions instead of .split() because
             * .split() in JavaScript is an ABOMINATION!
             * Splitting a string using an array works however and whenever
             * it F***ING wants!!!
             */
            switch (context) {
                case "keywords":
                    /* NOTE: The filter(Boolean) part is just in case.
                     * I don't think that it is need after using the
                     * "word boundary match", but it doesn't hurt.
                     */
                    haystack = aApp.get_keywords() ?
                        aApp.get_keywords().match(/\b(\w+)/g).filter(Boolean) :
                        [];
                    break;
                case "generic_name":
                    /* NOTE: I don't trust this thing. That's why the try{}catch{} block.
                     */
                    try {
                        haystack = aApp.get_app_info().get_generic_name() ?
                            [aApp.get_app_info().get_generic_name()] :
                            [];
                    } catch (aErr) {
                        haystack = [];
                    }
                    break;
                    /* NOTE: This is too strict.
                     * Furthermore, for applications whose description was redacted
                     * by a F***ING salesman, it will not produce any relevant results.
                     * case "get_description":
                     *     // Split sentence into words.
                     *     // <3 https://stackoverflow.com/a/36508315
                     *     haystack = (aApp.get_description().match(/\b(\w+)'?(\w+)?\b/g)).filter((x) => {
                     *         // Ignore most contractions, articles, etc.
                     *         return x && x.length > 4;
                     *     });
                     *     break;
                     */
                case "name":
                case "description":
                    haystack = aApp["get_" + context]() ?
                        [aApp["get_" + context]()] :
                        [];
                    break;
            }

            if (haystack.length === 0) {
                continue;
            }

            /* NOTE:
             * data: Array of strings.
             * context: Part of an app. the array of strings was extracted from.
             * priority: Priority level.
             */
            haystacks.push({
                data: haystack.map(this._normalizeHaystack),
                context: context,
                priority: $.SEARCH_DATA[s].priority
            });
        }

        /* NOTE:
         * app: The app. whose data will be used to populate the search result menu items.
         * categories: The categories to which the app. belongs to. Used to set the
         *             search result items tooltip. Stored in the database to avoid
         *             accessing buttons at search time.
         * haystacks: All the haystacks to search through.
         */
        this._searchDatabase.push({
            app: aApp,
            categories: aCategories,
            haystacks: haystacks
        });
    },

    _normalizeHaystack: function(aStr) {
        return Util.latinise(aStr.trim().toLowerCase());
    },

    closeMainMenu: function() {
        this.menu.close(this.pref_animate_menu);
    },

    _setSelectedItemTooltip: function(aEl, aTitle, aDescription, aCategories = []) {
        if (aEl && aEl.tooltip) {
            try {
                // Without using the escapeHTML function, the following warning is logged.
                // Clutter-WARNING **: Failed to set the markup of the actor 'ClutterText':
                // Error on line 1: Entity did not end with a semicolon; most likely you used
                // an ampersand character without intending to start an entity - escape ampersand
                // as &amp;
                aEl.tooltip._tooltip.get_clutter_text().set_markup(
                    (aTitle ? '<span weight="bold">' + $.escapeHTML(aTitle) + "</span>" : "") +
                    (aDescription ? "\n" + $.escapeHTML(aDescription) : "") +
                    (aCategories.length > 0 ?
                        "\n\n" + '<span weight="bold">' + $.escapeHTML(_("Categories")) + "</span>" +
                        ": " + $.escapeHTML(aCategories.join(" - ")) :
                        "")
                );
            } catch (aErr) {
                global.logError(aErr);
                aEl.tooltip._tooltip.set_text(
                    (aTitle ? aTitle : "") +
                    (aDescription ? "\n" + aDescription : "") +
                    (aCategories.length > 0 ?
                        "\n\n" + _("Categories") + ": " + aCategories.join(" - ") :
                        "")
                );
            }
        }
    },

    _hardRefreshAll: function() {
        if (this._hardRefreshTimeout) {
            Mainloop.source_remove(this._hardRefreshTimeout);
            this._hardRefreshTimeout = 0;
        }

        this._hardRefreshTimeout = Mainloop.timeout_add(500, () => {
            this.initial_load_done = true;
            this.on_orientation_changed(this.orientation);
            this._hardRefreshTimeout = 0;
        });
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
            case "pref_enable_autoscroll":
                this._update_autoscroll();
                break;
            case "pref_max_width_for_buttons":
            case "pref_context_show_uninstall":
            case "pref_context_show_bumblebee":
                this._updateGlobalPreferences();
                break;
            case "pref_recently_used_apps_ignore_favorites":
            case "pref_recently_used_apps_enabled":
                this._setupRecentAppsManager();
                break;
                /* NOTE: Setting toggled from the Edit Custom launchers
                 * GUI when applying changes.
                 */
            case "pref_hard_refresh_menu":
                this._hardRefreshAll();
                break;
        }
    }
};

function main(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
    return new CinnamonMenuForkByOdyseus(aMetadata, aOrientation, aPanelHeight, aInstanceID);
}
