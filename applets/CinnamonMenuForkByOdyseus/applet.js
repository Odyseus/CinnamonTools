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
    misc: {
        util: Util
    },
    ui: {
        appFavorites: AppFavorites,
        applet: Applet,
        main: Main,
        popupMenu: PopupMenu
    }
} = imports;

const {
    APPLET_PREFS,
    PADDED_ELEMENTS,
    PADDING_CSS,
    SEARCH_DATA,
    SEARCH_PRIORITY,
    VECTOR_BOX_LEGACY
} = require("js_modules/constants.js");

const {
    _,
    arrayEach,
    escapeHTML,
    isBlank,
    tryFn
} = require("js_modules/globalUtils.js");

const {
    getBaseAppletClass
} = require("js_modules/appletsUtils.js");

const {
    ApplicationButton,
    CategoriesApplicationsBox,
    CategoryButton,
    CustomCommandButton,
    Debugger,
    DummyApplicationButton,
    GenericApplicationButton,
    getVectorBox,
    RecentAppsManager,
    SimpleMenuItem,
    VisibleChildIterator
} = require("js_modules/utils.js");

class CinnamonMenuForkByOdyseus extends getBaseAppletClass(Applet.TextIconApplet) {
    constructor(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
        super({
            metadata: aMetadata,
            orientation: aOrientation,
            panel_height: aPanelHeight,
            instance_id: aInstanceID,
            pref_keys: APPLET_PREFS
        });

        this.initial_load_done = false;

        this.__initializeApplet(() => {
            this.set_applet_tooltip(_("Menu"));
            this._updateIconAndLabel();
            this._expandAppletContextMenu();
        }, () => {
            this.appsys = Cinnamon.AppSystem.get_default();
            this.recentAppsCatName = `${this.$.instance_id}recent_applications`;
            this.favoritesCatName = `${this.$.instance_id}favorites`;
            this.searchResultsCatName = `${this.$.instance_id}search_results`;
            this.allAppsCatName = `${this.$.instance_id}all_applications`;
            this.vectorBox = getVectorBox(this);

            this.menu.setCustomStyleClass("menu-background");

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
            this._applicationsButtons = [];
            this._searchDatabase = [];
            this._searchResultButtons = [];
            this._recentAppsButtons = [];
            this._applicationsButtonFromApp = {};
            this._categoryButtons = [];
            this._selectedItemIndex = null;
            this._previousSelectedActor = null;
            this._previousVisibleIndex = null;
            this._previousTreeSelectedActor = null;
            this._activeContainer = null;
            this._activeActor = null;
            this._searchResultsLength = 0;
            this.menuIsOpening = false;
            this._activeContextMenuParent = null;
            this._activeContextMenuItem = null;
            this.refreshing = false;
            this.recentAppsManager = null;
            this.lastSelectedCategory = null;
            this.recentAppsEmptyButton = null;
            this.recentAppsClearButton = null;
            this.searchResultsEmptyButton = null;
            this.searching = false;
            this.contextMenu = null;
            this._updateGlobalPreferences();
            this._display();

            this._setupRecentAppsManager();
            this._updateActivateOnHover();
            this._updateKeybinding();

            // We shouldn't need to call _refreshAll() here... since we get a "icon-theme-changed"
            // signal when CSD starts. The reason we do is in case the Cinnamon icon theme is the
            // same as the one specified in GTK itself (in .config). In that particular case we get
            // no signal at all.
            this._refreshAll();

            this.set_show_label_in_vertical_panels(false);
        });
    }

    __connectSignals() {
        /* NOTE: Triggering this.onAppSysChanged in the below connections
         * because inside this.onAppSysChanged is triggered this._hardRefreshAll.
         * this._hardRefreshAll is triggered because I fed up of the asymmetry
         * of the menu elements when they are re-allocated/styled. So,
         * using this._hardRefreshAll will rebuild the entire menu from scratch.
         * (When the scalpel doesn't cut it, use the freaking sledgehammer!!!)
         */
        this.$.signal_manager.connect(Main.themeManager, "theme-set", function() {
            this.onAppSysChanged();
        }.bind(this));
        this.$.signal_manager.connect(this.appsys, "installed-changed", function() {
            this.onAppSysChanged();
        }.bind(this));
        this.$.signal_manager.connect(this, "orientation-changed", function() {
            this.__seekAndDetroyConfigureContext();
        }.bind(this));
        this.$.signal_manager.connect(this.actor, "key-press-event", function(aActor, aEvent) {
            this._onSourceKeyPress(aActor, aEvent);
        }.bind(this));
        this.$.signal_manager.connect(this.menu, "open-state-changed", function(aMenu, aOpen) {
            this._onOpenStateChanged(aMenu, aOpen);
        }.bind(this));
    }

    _expandAppletContextMenu() {
        let menuItem = new PopupMenu.PopupIconMenuItem(_("Open the menu editor"),
            "text-editor", St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => this._launch_editor());
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(_("Help"), "dialog-information", St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => this.__openHelpPage());
        this._applet_context_menu.addMenuItem(menuItem);

        this.__seekAndDetroyConfigureContext();
    }

    _setupRecentAppsManager() {
        this.recentAppsManager && this.recentAppsManager.destroy();

        if (this.$._.recently_used_apps_enabled && !this.recentAppsManager) {
            this.recentAppsManager = new RecentAppsManager(this);
            this.recentAppsManager.init();
        }

        if (this.recentAppsManager && !this.$._.recently_used_apps_enabled) {
            this.recentAppsManager.destroy();
            this.recentAppsManager = null;
        }
    }

    _updateGlobalPreferences() {
        // Added the context_show_uninstall check here so it doesn't have to check
        // file existence when disabled. Otherwise, it will check for file existence every single
        // time a context menu is opened.
        this._canUninstallApps = GLib.file_test("/usr/bin/cinnamon-remove-application", GLib.FileTest.EXISTS);

        // Added the context_show_bumblebee check here so it doesn't have to check
        // file existence when disabled.
        this._isBumblebeeInstalled = GLib.file_test("/usr/bin/optirun", GLib.FileTest.EXISTS);

        this.max_width_for_buttons = `max-width: ${this.$._.max_width_for_buttons}em;`;
    }

    _updateKeybinding() {
        this.$.keybinding_manager.addKeybinding("toggle_menu", this.$._.toggle_menu_keybinding, () => {
            if (!Main.overview.visible && !Main.expo.visible) {
                this.menu.toggle_with_options(this.$._.animate_menu);
            }
        });
    }

    onAppSysChanged() {
        this.$.schedule_manager.setTimeout("app_sys_changed", function() {
            if (this.refreshing) {
                // Return true so this callback is called again.
                return GLib.SOURCE_CONTINUE;
            }

            this.refreshing = true;
            this._hardRefreshAll();
        }.bind(this), 3000);
    }

    _refreshAll() {
        tryFn(() => {
            this._refreshApps();
        }, (aErr) => {
            global.logError(aErr);
        }, () => {
            this._resizeApplicationsBox();
            this.refreshing = false;
        });
    }

    openMenu() {
        if (!this._applet_context_menu.isOpen) {
            this.menu.open(this.$._.animate_menu);
        }
    }

    _clearDelayCallbacks() {
        this.$.schedule_manager.clearSchedule("applet_hover_delay");
        this.$.signal_manager.disconnect("leave-event", this.actor);

        return false;
    }

    _updateActivateOnHover() {
        this.$.signal_manager.disconnect("enter-event", this.actor);

        this._clearDelayCallbacks();

        if (this.$._.activate_on_hover) {
            this.$.signal_manager.connect(this.actor, "enter-event", function() {
                if (this.$._.menu_hover_delay > 0) {
                    this.$.signal_manager.connect(this.actor, "leave-event", function() {
                        this._clearDelayCallbacks();
                    }.bind(this));
                    this.$.schedule_manager.setTimeout("applet_hover_delay", function() {
                        this.openMenu();
                        this._clearDelayCallbacks();
                    }.bind(this), this.$._.menu_hover_delay);
                } else {
                    this.openMenu();
                }
            }.bind(this));
        }
    }

    _recalc_height() {
        let scrollBoxHeight = (this.categoriesBox.get_allocation_box().y2 - this.categoriesBox.get_allocation_box().y1) -
            (this.searchBox.get_allocation_box().y2 - this.searchBox.get_allocation_box().y1);

        scrollBoxHeight = scrollBoxHeight - (this.customLaunchersBox.get_allocation_box().y2 -
            this.customLaunchersBox.get_allocation_box().y1);

        this.applicationsScrollBox.style = `height: ${scrollBoxHeight / global.ui_scale}px;`;
    }

    on_orientation_changed(aOrientation) {
        super.on_orientation_changed(aOrientation);

        this.contextMenu && this.contextMenu.destroy();
        this.contextMenu = null;

        this.__initMainMenu();

        this.menu.setCustomStyleClass("menu-background");

        this.menu.connect("open-state-changed",
            (aMenu, aOpen) => this._onOpenStateChanged(aMenu, aOpen));
        this._display();

        if (this.initial_load_done) {
            this._refreshAll();
            this.initial_load_done = false;
        }
        this._updateIconAndLabel();
    }

    on_applet_added_to_panel() {
        this.initial_load_done = true;
    }

    on_applet_removed_from_panel() {
        super.on_applet_removed_from_panel();
    }

    _launch_editor() {
        Util.spawnCommandLine("cinnamon-menu-editor");
    }

    on_applet_clicked(event) { // jshint ignore:line
        this.menu.toggle_with_options(this.$._.animate_menu);
    }

    _onSourceKeyPress(actor, event) {
        const symbol = event.get_key_symbol();

        if (symbol === Clutter.KEY_space || symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter) {
            this.menu.toggle();
            return Clutter.EVENT_STOP;
        } else if (symbol === Clutter.KEY_Escape && this.menu.isOpen) {
            this.closeMainMenu();
            return Clutter.EVENT_STOP;
        } else if (symbol === Clutter.KEY_Down) {
            if (!this.menu.isOpen) {
                this.menu.toggle();
            }
            this.menu.actor.navigate_focus(this.actor, Gtk.DirectionType.DOWN, false);
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _onOpenStateChanged(aMenu, aOpen) {
        if (aOpen) {
            this.menuIsOpening = true;
            this.actor.add_style_pseudo_class("active");
            global.stage.set_key_focus(this.searchEntry);
            this._selectedItemIndex = null;
            this._activeContainer = null;
            this._activeActor = null;
            this.lastSelectedCategory = null;
            this._selectFirstCategory();
        } else {
            this.actor.remove_style_pseudo_class("active");
            if (this.searchActive) {
                this.resetSearch();
            } else {
                // _clearAllSelections is also called by resetSearch.
                this._clearAllSelections();
            }

            this._previousTreeSelectedActor = null;
            this._previousSelectedActor = null;
            this.closeContextMenu(false);
            this.vectorBox.disableMask();
        }
    }

    destroy() {
        this.actor._delegate = null;
        this.actor.destroy();
        this.emit("destroy");
    }

    _set_default_menu_icon() {
        let path = `${global.datadir}/theme/menu.svg`;
        if (GLib.file_test(path, GLib.FileTest.EXISTS)) {
            this.set_applet_icon_path(path);
            return;
        }

        path = `${global.datadir}/theme/menu-symbolic.svg`;
        if (GLib.file_test(path, GLib.FileTest.EXISTS)) {
            this.set_applet_icon_symbolic_path(path);
            return;
        }
        // If all else fails, this will yield no icon
        this.set_applet_icon_path("");
    }

    _updateIconAndLabel() {
        if (this.$._.use_a_custom_icon_for_applet) {
            this.__setAppletIcon(this.$._.custom_icon_for_applet);
        } else {
            this._set_default_menu_icon();
        }

        this._applet_icon_box.visible = !(this.$._.use_a_custom_icon_for_applet &&
            isBlank(this.$._.custom_icon_for_applet));

        this.set_applet_label(this.$._.custom_label_for_applet);
    }

    _contextMenuOpenStateChanged(menu) {
        if (menu.isOpen) {
            this._activeContextMenuParent = menu.sourceActor._delegate;
            this._scrollToButton(menu);
        } else {
            this._activeContextMenuItem = null;
            this._activeContextMenuParent = null;
            menu.sourceActor = null;
        }
    }

    toggleContextMenu(button) {
        this.$.schedule_manager.clearSchedule("toggle_context_menu");

        if (!button.withMenu) {
            return;
        }

        this.$.schedule_manager.setTimeout("toggle_context_menu", function() {
            if (!this.contextMenu) {
                /* NOTE: Creating a PopupSubMenu without sourceActor.
                 */
                const menu = new PopupMenu.PopupSubMenu(null);
                /* NOTE: This overrides the popup-sub-menu default class.
                 */
                menu.actor.set_style_class_name("menu-context-menu");
                menu.connect("open-state-changed",
                    (aMenu) => this._contextMenuOpenStateChanged(aMenu));
                this.contextMenu = menu;
                this.applicationsBox.add_actor(menu.actor);
            }

            if (this.contextMenu.sourceActor !== button.actor &&
                this.contextMenu.isOpen) {
                this.contextMenu.close();
            }

            if (!this.contextMenu.isOpen) {
                this.contextMenu.box.destroy_all_children();
                this.applicationsBox.set_child_above_sibling(this.contextMenu.actor, button.actor);
                this.contextMenu.sourceActor = button.actor;
                button.populateMenu(this.contextMenu);
            }

            this.contextMenu.toggle();
        }.bind(this), 10);
    }

    _navigateContextMenu(button, symbol, modifierState) {
        if (symbol === Clutter.KEY_Menu || symbol === Clutter.Escape ||
            (modifierState & Clutter.ModifierType.MOD1_MASK /* Alt key */ &&
                (symbol === Clutter.KEY_Return || symbol === Clutter.KP_Enter))) {
            if (this._activeContainer._vis_iter) {
                this._selectedItemIndex = this._activeContainer._vis_iter.getAbsoluteIndexOfChild(this._activeActor);
            }

            this.toggleContextMenu(button);
            return;
        }

        const menuItems = this.contextMenu._getMenuItems(); // The context menu items
        const firstItemIndex = 0;
        const lastItemIndex = menuItems.length - 1;
        let navigationKey = true;
        let whichWay = "none";
        let activeIndex = this._activeContextMenuItem ?
            menuItems.indexOf(this._activeContextMenuItem) :
            firstItemIndex;

        switch (symbol) {
            case Clutter.KEY_Tab:
            case Clutter.KEY_ISO_Left_Tab:
                whichWay = (modifierState & Clutter.ModifierType.SHIFT_MASK) /* Shift key */ ? "up" : "down";
                break;
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
            default:
                navigationKey = false;
        }

        if (navigationKey) {
            switch (whichWay) {
                case "up":
                    if (this._activeContextMenuItem) {
                        activeIndex = activeIndex === 0 ? lastItemIndex : activeIndex - 1;
                        this._activeContextMenuItem = menuItems[activeIndex];
                    } else {
                        this._activeContextMenuItem = menuItems[lastItemIndex];
                    }
                    break;
                case "down":
                    if (this._activeContextMenuItem) {
                        activeIndex = activeIndex === lastItemIndex ? firstItemIndex : activeIndex + 1;
                        this._activeContextMenuItem = menuItems[activeIndex];
                    } else {
                        this._activeContextMenuItem = menuItems[firstItemIndex];
                    }
                    break;
                case "top":
                    this._activeContextMenuItem = menuItems[firstItemIndex];
                    break;
                case "bottom":
                    this._activeContextMenuItem = menuItems[lastItemIndex];
                    break;
            }

            if (this._activeContextMenuItem) {
                if (this._activeContextMenuItem instanceof PopupMenu.PopupSeparatorMenuItem) {
                    switch (whichWay) {
                        case "up":
                            this._activeContextMenuItem = menuItems[activeIndex - 1];
                            break;
                        case "down":
                            this._activeContextMenuItem = menuItems[activeIndex + 1];
                            break;
                    }
                }

                this._activeContextMenuItem.setActive(true);
            } else {
                return Clutter.EVENT_PROPAGATE;
            }
        } else {
            if (this._activeContextMenuItem &&
                (symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter)) {
                this._activeContextMenuItem.activate();
                this._activeContextMenuItem = null;
                return Clutter.EVENT_STOP;
            }

            return Clutter.EVENT_PROPAGATE;
        }

        return Clutter.EVENT_STOP;
    }

    _onMenuKeyPress(actor, event) {
        const symbol = event.get_key_symbol();
        const keyCode = event.get_key_code();
        const modifierState = Cinnamon.get_event_state(event);

        let item_actor;
        let index = 0;

        // Check for a keybinding and quit early, otherwise we get a double hit
        // of the keybinding callback.
        const action = global.display.get_keybinding_action(keyCode, modifierState);

        if (action === Meta.KeyBindingAction.CUSTOM) {
            return Clutter.EVENT_STOP;
        }

        index = this._selectedItemIndex;

        // const ctrlKey = modifierState & Clutter.ModifierType.CONTROL_MASK;
        const altKey = modifierState & Clutter.ModifierType.MOD1_MASK;
        const shiftKey = modifierState & Clutter.ModifierType.SHIFT_MASK;

        // If a context menu is open, hijack keyboard navigation and concentrate on the context menu.
        if (this._activeContextMenuParent &&
            this._activeContainer === this.applicationsBox) {
            let continueNavigation = false;
            switch (symbol) {
                case Clutter.KEY_Tab:
                case Clutter.KEY_ISO_Left_Tab:
                case Clutter.KEY_Up:
                case Clutter.KEY_Down:
                case Clutter.KEY_Return:
                case Clutter.KEY_KP_Enter:
                case Clutter.KEY_Menu:
                case Clutter.KEY_Page_Up:
                case Clutter.KEY_Page_Down:
                case Clutter.KEY_Escape:
                    this._navigateContextMenu(this._activeContextMenuParent, symbol, altKey);
                    break;
                case Clutter.KEY_Right:
                case Clutter.KEY_Left:
                    continueNavigation = true;
                    break;
            }
            if (!continueNavigation) {
                return Clutter.EVENT_STOP;
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
                    whichWay = this.$._.swap_categories_box ? "left" : "right";
                } else {
                    navigationKey = false;
                }

                switch (this._activeContainer) {
                    case this.applicationsBox:
                        whichWay = this.$._.swap_categories_box ? "left" : "right";
                        break;
                    case this.categoriesBox:
                        if (this.categoriesBox.get_child_at_index(index)
                            ._delegate.categoryId === this.recentAppsCatName &&
                            this.recentAppsManager.recentApps.length === 0) {
                            whichWay = "none";
                        } else {
                            whichWay = this.$._.swap_categories_box ? "right" : "left";
                        }
                        break;
                    case this.customLaunchersBox:
                        whichWay = "jump-right";
                        break;
                    default:
                        break;
                }
                break;
            case Clutter.KEY_Left:
                if (!this.searchActive) {
                    whichWay = this.$._.swap_categories_box ? "right" : "left";
                } else {
                    navigationKey = false;
                }

                switch (this._activeContainer) {
                    case this.applicationsBox:
                        whichWay = this.$._.swap_categories_box ? "left" : "right";
                        break;
                    case this.categoriesBox:
                        if (this.categoriesBox.get_child_at_index(index)
                            ._delegate.categoryId === this.recentAppsCatName &&
                            this.recentAppsManager.recentApps.length === 0) {
                            whichWay = "none";
                        } else {
                            whichWay = this.$._.swap_categories_box ? "left" : "right";
                        }
                        break;
                    case this.customLaunchersBox:
                        whichWay = "jump-left";
                        break;
                    default:
                        break;

                }
                break;
            case Clutter.KEY_Tab:
            case Clutter.KEY_ISO_Left_Tab:
                // NOTE: If Tab key (with or without Shift modifier) is pressed and the applications
                // box (including search results) is focused, navigate through the menu items. If any
                // other container is focused (categories box or custom launchers box), the Tab key will
                // "jump" between them.
                whichWay = this._activeContainer === this.applicationsBox ?
                    (shiftKey ? "up" : "down") :
                    "jump";
                break;
            default:
                navigationKey = false;
        }

        // Do not navigate to the empty search results button!!! SHEESH!!!
        switch (whichWay) {
            case "up":
            case "down":
            case "top":
            case "bottom":
                if (this.searchActive && this._searchResultsLength === 0) {
                    navigationKey = false;
                }
                break;
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
                            this._scrollToButton();
                            break;
                        case "down":
                            this._activeContainer = this.categoriesBox;
                            item_actor = this.catBoxIter.getFirstVisible();
                            item_actor = this.catBoxIter.getNextVisible(item_actor);
                            this._scrollToButton();
                            break;
                        case "right":
                            this._activeContainer = this.applicationsBox;
                            item_actor = this.appBoxIter.getFirstVisible();
                            this._scrollToButton();
                            break;
                        case "left":
                            this._activeContainer = this.applicationsBox;
                            item_actor = this.appBoxIter.getFirstVisible();
                            this._scrollToButton();
                            break;
                        case "top":
                            this._activeContainer = this.categoriesBox;
                            item_actor = this.catBoxIter.getFirstVisible();
                            this._scrollToButton();
                            break;
                        case "bottom":
                            this._activeContainer = this.categoriesBox;
                            item_actor = this.catBoxIter.getLastVisible();
                            this._scrollToButton();
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
                            this._scrollToButton();
                            break;
                        case "down":
                            this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(index);
                            this._previousTreeSelectedActor._delegate.isHovered = false;
                            item_actor = this.catBoxIter.getNextVisible(this._activeActor);
                            this._scrollToButton();
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
                            this._scrollToButton();
                            break;
                        case "bottom":
                            this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(index);
                            this._previousTreeSelectedActor._delegate.isHovered = false;
                            item_actor = this.catBoxIter.getLastVisible();
                            this._scrollToButton();
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
                return Clutter.EVENT_PROPAGATE;
            }
            index = item_actor.get_parent()._vis_iter.getAbsoluteIndexOfChild(item_actor);
        } else {
            if (this._activeContainer !== this.categoriesBox && (symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter)) {
                if (!altKey) {
                    item_actor = this._activeContainer.get_child_at_index(this._selectedItemIndex);
                    item_actor._delegate.activate();
                } else if (altKey && this._activeContainer === this.applicationsBox) {
                    item_actor = this.applicationsBox.get_child_at_index(this._selectedItemIndex);
                    this.toggleContextMenu(item_actor._delegate);
                }
                return Clutter.EVENT_STOP;
            } else if (this._activeContainer === this.applicationsBox && symbol === Clutter.KEY_Menu) {
                item_actor = this.applicationsBox.get_child_at_index(this._selectedItemIndex);
                this.toggleContextMenu(item_actor._delegate);
                return Clutter.EVENT_STOP;
            } else if (symbol === Clutter.KEY_Tab || symbol === Clutter.KEY_ISO_Left_Tab) {
                return Clutter.EVENT_STOP;
            } else {
                return Clutter.EVENT_PROPAGATE;
            }
        }

        this._selectedItemIndex = index;

        if (!item_actor || item_actor === this.searchEntry) {
            return Clutter.EVENT_PROPAGATE;
        }

        this._buttonEnterEvent(item_actor._delegate);
        return Clutter.EVENT_STOP;
    }

    _buttonEnterEvent(aButton) {
        const parent = aButton.actor.get_parent();

        if (this._activeContainer === this.categoriesBox && parent !== this._activeContainer) {
            this._previousTreeSelectedActor = this._activeActor;
            this._previousSelectedActor = null;
        }
        if (this._previousTreeSelectedActor && this._activeContainer !== this.categoriesBox &&
            parent !== this._activeContainer && aButton !== this._previousTreeSelectedActor && !this.searchActive) {
            this._previousTreeSelectedActor.style_class = "menu-category-button";
        }
        if (parent !== this._activeContainer && parent._vis_iter) {
            parent._vis_iter.reloadVisible();
        }
        const _maybePreviousActor = this._activeActor;
        if (_maybePreviousActor && this._activeContainer !== this.categoriesBox) {
            this._previousSelectedActor = _maybePreviousActor;
            this._clearPrevSelection();
        }
        if (parent === this.categoriesBox && !this.searchActive) {
            this._previousSelectedActor = _maybePreviousActor;
            this._clearPrevCatSelection();
        }
        this._activeContainer = parent;
        this._activeActor = aButton.actor;

        if (this._activeContainer._vis_iter) {
            this._selectedItemIndex = this._activeContainer._vis_iter.getAbsoluteIndexOfChild(this._activeActor);
        }

        // Callback
        if (aButton instanceof CategoryButton) {
            if (this.searchActive) {
                return;
            }

            aButton.isHovered = true;
            this._clearPrevCatSelection(aButton.actor);
            this.closeContextMenu(false);
            this._selectCategory(aButton.categoryId);
            VECTOR_BOX_LEGACY && this.vectorBox.enableMask(aButton.actor);
        } else {
            this._previousVisibleIndex = parent._vis_iter.getVisibleIndex(aButton.actor);
            this._clearPrevSelection(aButton.actor);
        }

        aButton.actor.set_style_class_name(`${aButton.styleClass}-selected`);
    }

    _buttonLeaveEvent(aButton) {
        if (aButton instanceof CategoryButton) {
            if (this._previousTreeSelectedActor === null) {
                this._previousTreeSelectedActor = aButton.actor;
            } else {
                const prevIdx = this.catBoxIter.getVisibleIndex(this._previousTreeSelectedActor);
                const nextIdx = this.catBoxIter.getVisibleIndex(aButton.actor);

                if (Math.abs(prevIdx - nextIdx) <= 1) {
                    this._previousTreeSelectedActor = aButton.actor;
                }
            }
            aButton.isHovered = false;
        } else {
            this._previousSelectedActor = aButton.actor;

            // Category unselects are handled when the category actually changes
            aButton.actor.set_style_class_name(aButton.styleClass);
        }
    }

    _clearPrevSelection(actor) {
        if (this._previousSelectedActor && this._previousSelectedActor !== actor) {
            if (this._previousSelectedActor._delegate instanceof GenericApplicationButton ||
                this._previousSelectedActor._delegate === this.recentAppsClearButton ||
                this._previousSelectedActor._delegate instanceof CustomCommandButton) {
                this._previousSelectedActor.style_class = "menu-application-button";
            }
        }
    }

    _clearPrevCatSelection(actor) {
        if (this._previousTreeSelectedActor && this._previousTreeSelectedActor !== actor) {
            this._previousTreeSelectedActor.style_class = "menu-category-button";

            if (this._previousTreeSelectedActor._delegate) {
                this._buttonLeaveEvent(this._previousTreeSelectedActor._delegate);
            }

            if (actor !== undefined) {
                this._previousVisibleIndex = null;
                this._previousTreeSelectedActor = actor;
            }
        } else {
            for (const child of this.categoriesBox.get_children()) {
                child.style_class = "menu-category-button";
            }
        }
    }

    _refreshRecentApps() {
        if (!this.$._.recently_used_apps_enabled) {
            arrayEach(this._categoryButtons, (aBtn, aIdx) => {
                if (aBtn.categoryId === this.recentAppsCatName) {
                    aBtn.actor.destroy();
                    this._categoryButtons.splice(aIdx, 1);
                    return false;
                }
                return true;
            }, true);

            return;
        }

        let recentApplications = [];

        if (this.recentAppsManager.recentApps.length > 0) {
            // It doesn't matter the "direction" of either of these loops.
            // recentApplications will be sorted anyways.
            for (const btn of this._applicationsButtons) {
                if (btn.type === "app") {
                    for (const app of this.recentAppsManager.recentApps) {
                        let [recAppID, recLastAccess] = app.split(":");

                        if (recAppID === btn.get_app_id()) {
                            btn.app.lastAccess = recLastAccess;
                            recentApplications.push({
                                app: btn.app,
                                categories: btn.category
                            });
                            // FIXME: Revisit the logic here. Did I meant to break here?
                            // If so, did I meant to break the outer or inner loop?
                            // It doesn't make sense to use continue here.
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
                return this.$._.recently_used_apps_invert_order ?
                    a["app"]["lastAccess"] > b["app"]["lastAccess"] :
                    a["app"]["lastAccess"] < b["app"]["lastAccess"];
            });
        }

        // DO NOT USE INVERSE LOOP HERE!!!
        arrayEach(this._recentAppsButtons, (aBtn, aIdx) => {
            if (recentApplications[aIdx]) {
                const app = recentApplications[aIdx].app;
                aBtn.populateItem(app);
                aBtn.shouldBeDisplayed = true;
                this._setSelectedItemTooltip(
                    aBtn,
                    aBtn.app.get_name(),
                    aBtn.app.get_description() || "",
                    recentApplications[aIdx].categories
                );
            } else {
                aBtn.shouldBeDisplayed = false;
            }
        });

        this.customLaunchersBoxIter.reloadVisible();
    }

    _refreshApps() {
        // Iterate in reverse, so multiple splices will not upset
        // the remaining elements
        arrayEach(this._categoryButtons, (aBtn, aIdx) => {
            if (aBtn instanceof CategoryButton) {
                aBtn.destroy();
                this._categoryButtons.splice(aIdx, 1);
            }
        }, true);

        arrayEach(this._applicationsButtons, (aBtn, aIdx) => {
            aBtn.destroy();
            this._applicationsButtons.splice(aIdx, 1);
        }, true);

        this._applicationsButtons = [];
        this._applicationsButtonFromApp = {};
        this._searchDatabase = [];

        const favCat = {
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

        const favoritesCategoryButton = new CategoryButton(this, favCat);
        this.categoriesBox.add_actor(favoritesCategoryButton.actor);
        this._categoryButtons.push(favoritesCategoryButton);

        if (this.$._.recently_used_apps_enabled) {
            const recentAppsCat = {
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
                    return _("Recently Used");
                },
                get_is_nodisplay: () => {
                    return false;
                },
                get_icon: () => {
                    return "folder-recent";
                }
            };

            const recentAppsCatButton = new CategoryButton(this, recentAppsCat);
            this.categoriesBox.add_actor(recentAppsCatButton.actor);
            this._categoryButtons.push(recentAppsCatButton);

            this.$._.recently_used_apps_show_separator &&
                this.categoriesBox.add_actor(new PopupMenu.PopupSeparatorMenuItem().actor);
        }

        if (this.$._.show_all_applications_category) {
            const allAppsCat = {
                get_menu_id: () => {
                    return this.allAppsCatName;
                },
                get_id: () => {
                    return -1;
                },
                get_description: () => {
                    return this.get_name();
                },
                get_name: () => {
                    return _("All Applications");
                },
                get_is_nodisplay: () => {
                    return false;
                },
                get_icon: () => {
                    return "applications-other";
                }
            };

            const allAppsCatButton = new CategoryButton(this, allAppsCat);
            this.categoriesBox.add_actor(allAppsCatButton.actor);
            this._categoryButtons.push(allAppsCatButton);
        }

        const tree = new CMenu.Tree({
            menu_basename: "cinnamon-applications.menu"
        });
        tree.load_sync();
        const root = tree.get_root_directory();
        const iter = root.iter();
        let dirs = [];
        let nextType;

        while ((nextType = iter.next()) !== CMenu.TreeItemType.INVALID) {
            if (nextType === CMenu.TreeItemType.DIRECTORY) {
                dirs.push(iter.get_directory());
            }
        }

        dirs = dirs.sort((x, y) => {
            const prefIdA = ["administration", "preferences"].indexOf(x.get_menu_id().toLowerCase());
            const prefIdB = ["administration", "preferences"].indexOf(y.get_menu_id().toLowerCase());

            if (prefIdA < 0 && prefIdB >= 0) {
                return -1;
            }
            if (prefIdA >= 0 && prefIdB < 0) {
                return 1;
            }

            const nameA = x.get_name().toLowerCase();
            const nameB = y.get_name().toLowerCase();

            if (nameA > nameB) {
                return 1;
            }
            if (nameA < nameB) {
                return -1;
            }
            return 0;
        });

        // DO NOT USE INVERSE LOOP HERE!!!
        for (const dir of dirs) {
            if (dir.get_is_nodisplay()) {
                continue;
            }
            if (this._loadCategory(dir)) {
                let categoryButton = new CategoryButton(this, dir);
                this._categoryButtons.push(categoryButton);
                this.categoriesBox.add_actor(categoryButton.actor);
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
        this.searchResultsEmptyButton = new SimpleMenuItem(this, {
            reactive: false,
            activatable: false,
            name: _("No search results"),
            styleClass: "menu-application-button",
            type: "search_result"
        });
        this.searchResultsEmptyButton.addLabel(this.searchResultsEmptyButton.name);
        this._applicationsButtons.push(this.searchResultsEmptyButton);

        // Add search result buttons here.
        let s = this.$._.max_search_results;
        while (s--) {
            const searchResultButton = new DummyApplicationButton(this,
                "search_result",
                this.$._.search_result_icon_size
            );
            this._applicationsButtons.push(searchResultButton);
        }

        // Add recent apps buttons here.
        if (this.$._.recently_used_apps_enabled) {
            this.recentAppsEmptyButton = new SimpleMenuItem(this, {
                reactive: false,
                activatable: false,
                name: _("No recent applications"),
                styleClass: "menu-application-button",
                type: "recent_application"
            });
            this.recentAppsEmptyButton.addLabel(this.recentAppsEmptyButton.name);
            this._applicationsButtons.push(this.recentAppsEmptyButton);

            this.recentAppsClearButton = new SimpleMenuItem(this, {
                name: _("Clear list"),
                styleClass: "menu-application-button",
                type: "recent_application"
            });
            this.recentAppsClearButton.addIcon(this.$._.application_icon_size,
                "edit-clear", true);
            this.recentAppsClearButton.addLabel(this.recentAppsClearButton.name);
            this.recentAppsClearButton.activate = () => {
                this.closeMainMenu();
                this.recentAppsManager.recentApps = [];

                this.$.schedule_manager.idleCall("refresh_recent_apps", function() {
                    this._refreshRecentApps();
                }.bind(this));
            };

            if (this.$._.recently_used_apps_invert_order) {
                this._applicationsButtons.push(this.recentAppsClearButton);
            }

            let r = this.$._.recently_used_apps_max_amount;
            while (r--) {
                const recentAppButton = new DummyApplicationButton(this,
                    "recent_application",
                    this.$._.application_icon_size
                );
                this._applicationsButtons.push(recentAppButton);
            }

            if (!this.$._.recently_used_apps_invert_order) {
                this._applicationsButtons.push(this.recentAppsClearButton);
            }
        }

        // "Multipurpose" loop.
        // DO NOT USE INVERSE LOOP HERE!!!
        for (const btn of this._applicationsButtons) {
            // Add button to menu.
            this.applicationsBox.add_actor(btn.actor);

            // Handle only "pure" application buttons.
            if (btn.type === "app") {
                // Set the tooltip here because at this point is when the category
                // property of a button contains all categories an app. belongs to.
                this._setSelectedItemTooltip(
                    btn,
                    btn.app.get_name(),
                    btn.app.get_description() || "",
                    btn.category
                );

                // Store search data.
                this._storeAppSearchData(btn.app, btn.category);
            }
        }

        this._setStyling();

        this.$.schedule_manager.idleCall("store_search_and_recent_buttons", function() {
            // Store at menu build time the search results and recent apps. buttons.
            this._searchResultButtons = this._applicationsButtons.filter((x) => {
                return x.type === "search_result" &&
                    x instanceof DummyApplicationButton;
            });

            this._recentAppsButtons = this._applicationsButtons.filter((x) => {
                return x.type === "recent_application" &&
                    x instanceof DummyApplicationButton;
            });

            // Lets hope that reassigning this property eradicates from memory
            // its original and never to be used again content. ¬¬
            this._applicationsButtonFromApp = {};
            this.catBoxIter.reloadVisible();
            this.appBoxIter.reloadVisible();
            this._refreshRecentApps();
        }.bind(this));
    }

    _loadCategory(dir, top_dir) {
        const iter = dir.iter();
        let has_entries = false;
        let nextType;

        if (!top_dir) {
            top_dir = dir;
        }

        while ((nextType = iter.next()) !== CMenu.TreeItemType.INVALID) {
            if (nextType === CMenu.TreeItemType.ENTRY) {
                const entry = iter.get_entry();
                const appInfo = entry.get_app_info();

                if (appInfo && !appInfo.get_nodisplay()) {
                    has_entries = true;
                    const app = this.appsys.lookup_app(entry.get_desktop_file_id());
                    let app_key = app.get_id();
                    if (app_key === null) {
                        app_key = `${app.get_name()}:${app.get_description()}`;
                    }

                    if (!(app_key in this._applicationsButtonFromApp)) {
                        let applicationButton = new ApplicationButton(this, app);
                        this._applicationsButtons.push(applicationButton);
                        applicationButton.category.push(top_dir.get_menu_id());
                        this._applicationsButtonFromApp[app_key] = applicationButton;
                    } else {
                        this._applicationsButtonFromApp[app_key].category.push(dir.get_menu_id());
                    }
                }
            } else if (nextType === CMenu.TreeItemType.DIRECTORY) {
                const subdir = iter.get_directory();
                if (this._loadCategory(subdir, top_dir)) {
                    has_entries = true;
                }
            }
        }
        return has_entries;
    }

    _scrollToButton(button, scrollBox = null) {
        if (!scrollBox) {
            scrollBox = this.applicationsScrollBox;
        }

        const adj = scrollBox.get_vscroll_bar().get_adjustment();
        if (button) {
            const box = scrollBox.get_allocation_box();
            const boxHeight = box.y2 - box.y1;
            const actorBox = button.actor.get_allocation_box();
            const currentValue = adj.get_value();
            let newValue = currentValue;

            if (currentValue > actorBox.y1 - 10) {
                newValue = actorBox.y1 - 10;
            }
            if (boxHeight + currentValue < actorBox.y2 + 10) {
                newValue = actorBox.y2 - boxHeight + 10;
            }

            if (newValue !== currentValue) {
                adj.set_value(newValue);
            }
        } else {
            adj.set_value(0);
        }
    }

    _display() {
        this._activeContainer = null;
        this._activeActor = null;
        const section = new PopupMenu.PopupMenuSection();
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

        this.categoriesApplicationsBox = new CategoriesApplicationsBox();

        this.customLaunchersBox = new St.BoxLayout({
            vertical: false,
            accessible_role: Atk.Role.LIST
        });
        this.customLaunchersBox.set_width(-1);

        const customLaunchersBoxProperties = {
            x_fill: false,
            y_fill: false,
            x_align: this.$._.custom_launchers_box_alignment,
            y_align: St.Align.MIDDLE,
            expand: true
        };

        // I tried setting this.rightPane.pack_start property and it breaks keyboard navigation.
        // I "KISSed" it and as result I don't have to touch the keyboard navigation code.
        // Did something similar to the customLaunchersBox, instead of using pack_start,
        // I simply reverse()ed the array of custom launchers.
        if (this.$._.invert_menu_layout) {
            this.rightPane.add(this.customLaunchersBox, customLaunchersBoxProperties);
            this.rightPane.add_actor(this.categoriesApplicationsBox.actor);
            this.rightPane.add_actor(this.searchBox);
        } else {
            this.rightPane.add_actor(this.searchBox);
            this.rightPane.add_actor(this.categoriesApplicationsBox.actor);
            this.rightPane.add(this.customLaunchersBox, customLaunchersBoxProperties);
        }

        // TODO: Replace the Clutter.Actor with a St.ScrollView for this.categoriesScrollBox
        // when I replace the VectorBoxLegacy class with the VectorBox class.
        // this.categoriesScrollBox = new St.ScrollView({
        //     style_class: "vfade menu-applications-scrollbox"
        // });
        this.categoriesScrollBox = new Clutter.Actor();
        this.categoriesBox = new St.BoxLayout({
            style_class: "menu-categories-box",
            vertical: true,
            accessible_role: Atk.Role.LIST
        });
        this.categoriesScrollBox.add_actor(this.categoriesBox);
        // this.categoriesScrollBox.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);

        this.applicationsScrollBox = new St.ScrollView({
            x_fill: true,
            y_fill: false,
            y_align: St.Align.START,
            style_class: "vfade menu-applications-scrollbox"
        });

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

        const vscroll = this.applicationsScrollBox.get_vscroll_bar();
        vscroll.connect("scroll-start",
            () => {
                this.menu.passEvents = true;
            });
        vscroll.connect("scroll-stop",
            () => {
                this.menu.passEvents = false;
            });

        // let vscrollCat = this.categoriesScrollBox.get_vscroll_bar();
        // vscrollCat.connect("scroll-start",
        //     () => {
        //         this.menu.passEvents = true;
        //     });
        // vscrollCat.connect("scroll-stop",
        //     () => {
        //         this.menu.passEvents = false;
        //     });

        vscroll.visible = !this.$._.hide_applications_list_scrollbar;
        // vscrollCat.visible = !this.$._.hide_categories_list_scrollbar;

        this.applicationsBox = new St.BoxLayout({
            style_class: "menu-applications-inner-box",
            vertical: true
        });
        this.applicationsScrollBox.add_actor(this.applicationsBox);
        this.applicationsScrollBox.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);

        if (!this.$._.swap_categories_box) {
            this.categoriesApplicationsBox.actor.add_actor(this.categoriesScrollBox);
        }

        this.categoriesApplicationsBox.actor.add_actor(this.applicationsScrollBox);

        if (this.$._.swap_categories_box) {
            this.categoriesApplicationsBox.actor.add_actor(this.categoriesScrollBox);
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

        this.appBoxIter = new VisibleChildIterator(this.applicationsBox);
        this.applicationsBox._vis_iter = this.appBoxIter;
        this.catBoxIter = new VisibleChildIterator(this.categoriesBox);
        this.categoriesBox._vis_iter = this.catBoxIter;

        this.$.schedule_manager.idleCall("clear_all_selections", function() {
            this._clearAllSelections();
        }.bind(this));

        this.menu.actor.connect("allocation-changed",
            (box, flags, data) => this._on_allocation_changed(box, flags, data));

        this._updateCustomLaunchersBox();
    }

    _setStyling() {
        // TODO: Remember to create a mechanism to handle the menu_elements_padding preference
        // if I add/remove/modify elements.
        for (const padding_def of this.$._.menu_elements_padding) {
            this[PADDED_ELEMENTS[padding_def["element_id"]]].set_style(PADDING_CSS.format(
                padding_def.top_padding,
                padding_def.right_padding,
                padding_def.bottom_padding,
                padding_def.left_padding
            ));
        }

        const appAllocBox = this.applicationsBox.get_allocation_box();
        const catAllocBox = this.categoriesBox.get_allocation_box();

        this.searchEntry.set_width((appAllocBox.x2 - appAllocBox.x1) +
            (catAllocBox.x2 - catAllocBox.x1));
    }

    _updateCustomLaunchersBox() {
        this.customLaunchersBox.destroy_all_children();
        this.customLaunchersBoxIter = new VisibleChildIterator(this.customLaunchersBox);
        this.customLaunchersBox._vis_iter = this.customLaunchersBoxIter;

        arrayEach(this.$._.custom_launchers, (aProps, aIdx) => {
            if (isBlank(aProps["command"]) || isBlank(aProps["icon"]) || !aProps["enabled"]) {
                return;
            }

            const app = {
                id: `custom-command-${aIdx}`,
                command: aProps["command"],
                description: aProps["description"],
                label: aProps["title"],
                icon: aProps["icon"],
                icon_size: this.$._.custom_launchers_icon_size
            };

            const button = new CustomCommandButton(this, app);
            this._setSelectedItemTooltip(
                button,
                button.app.label,
                button.app.description || ""
            );
            this.customLaunchersBox.add_actor(button.actor);
        }, this.$._.custom_launchers_box_invert_buttons_order);
    }

    _updateVFade() {
        const mag_on = this.a11y_settings.get_boolean("screen-magnifier-enabled") &&
            this.a11y_mag_settings.get_double("mag-factor") > 1.0;
        if (mag_on) {
            this.applicationsScrollBox.style_class = "menu-applications-scrollbox";
        } else {
            this.applicationsScrollBox.style_class = "vfade menu-applications-scrollbox";
        }
    }

    _update_autoscroll() {
        this.applicationsScrollBox.set_auto_scrolling(this.$._.enable_autoscroll);
    }

    _on_allocation_changed(box, flags, data) { // jshint ignore:line
        this._recalc_height();
    }

    _clearAllSelections() {
        // NOTE: Take care of selected items, NOTHING more!
        let actors = [...this.applicationsBox.get_children(), ...this.customLaunchersBox.get_children()];
        for (const actor of actors) {
            actor.style_class = "menu-application-button";
        }

        actors = this.categoriesBox.get_children();
        for (const actor of actors) {
            actor.style_class = "menu-category-button";
        }
    }

    _selectCategory(aName) {
        if (aName === this.lastSelectedCategory) {
            return;
        }

        this.lastSelectedCategory = aName;
        this._displayButtons(aName);
        this.closeContextMenu(false);
    }

    _selectFirstCategory() {
        const firstCategoryButton = this.categoriesBox.get_child_at_index(0)._delegate;
        firstCategoryButton.actor.style_class = "menu-category-button-selected";
        this._selectCategory(firstCategoryButton.categoryId);
    }

    closeContextMenu(animate) {
        if (!this.contextMenu || !this.contextMenu.isOpen) {
            return;
        }

        if (animate) {
            this.contextMenu.toggle();
        } else {
            this.contextMenu.close();
        }
    }

    _resizeApplicationsBox() {
        const children = this.applicationsBox.get_children();
        // let c = children.length;
        let width = -1;

        for (const child of children) {
            const [min, nat] = child.get_preferred_width(-1.0); // jshint ignore:line
            width = (nat > width) ? nat : width;
        }

        this.applicationsBox.set_width(width + 42); // The answer to life...
    }

    _displayButtons(aAppCategory) {
        for (const btn of this._applicationsButtons) {
            let visible = false;
            switch (aAppCategory) {
                case this.favoritesCatName:
                    visible = (btn.type === "app" &&
                        AppFavorites.getAppFavorites().isFavorite(btn.app.get_id()));
                    break;
                case this.searchResultsCatName:
                    visible = btn.type === "search_result" && btn instanceof DummyApplicationButton;
                    break;
                case this.recentAppsCatName:
                    visible = (btn.type === "recent_application" && btn.shouldBeDisplayed);
                    break;
                case this.allAppsCatName:
                    visible = (btn.type === "app");
                    break;
                default:
                    visible = (btn.type === "app" && btn.category.indexOf(aAppCategory) !== -1);
            }

            btn.actor.visible = visible;
        }

        this.appBoxIter.reloadVisible();
    }

    _setCategoriesButtonActive(active) {
        for (const btn of this.categoriesBox.get_children()) {
            if (btn._delegate instanceof CategoryButton) {
                btn._delegate.hasOwnProperty("icon") &&
                    btn._delegate.icon.set_opacity(active ?
                        255 :
                        200);
                // If the mouse is moved over the categories box while performing a search,
                // the keyboard focus of the applications box will be lost.
                // Toggling the reactive state of the category buttons fixes this.
                btn.reactive = active;
                btn.set_style_class_name(
                    active ?
                    "menu-category-button" :
                    "menu-category-button-greyed"
                );
            }
        }
    }

    resetSearch() {
        this.searchEntry.set_secondary_icon(this._searchInactiveIcon);
        this.searchEntry.set_text("");
        this._previousSearchPattern = "";
        this.searchActive = false;
        this.searching = false;
        this._clearAllSelections();
        this._setCategoriesButtonActive(true);
        global.stage.set_key_focus(this.searchEntry);
    }

    _onSearchTextChanged(se, prop) { // jshint ignore:line
        if (this.menuIsOpening) {
            this.menuIsOpening = false;
            return;
        } else {
            this.$.schedule_manager.clearSchedule("search_text_changed");

            /* NOTE: Avoid rapid-fire of the search mechanism.
             */
            this.$.schedule_manager.setTimeout("search_text_changed", function() {
                const searchString = this.searchEntry.get_text();

                if (!searchString && !this.searchActive) {
                    return;
                }

                this.searchActive = !!searchString;
                this._clearAllSelections();

                if (this.searchActive) {
                    this.searchEntry.set_secondary_icon(this._searchActiveIcon);
                    this.$.signal_manager.connect(this.searchEntry, "secondary-icon-clicked", function() {
                        this.resetSearch();
                        this._onOpenStateChanged(null, true);
                    }.bind(this));
                    this._setCategoriesButtonActive(false);
                    this._doSearch();
                } else {
                    this.searching = false;
                    this.$.signal_manager.disconnect("secondary-icon-clicked", this.searchEntry);
                    this.searchEntry.set_secondary_icon(this._searchInactiveIcon);
                    this._previousSearchPattern = "";
                    this._setCategoriesButtonActive(true);
                    this._onOpenStateChanged(null, true);
                }
            }.bind(this), 50);

            return;
        }
    }

    _fuzzySearch(aNeedle, aHaystack, aPriority) {
        const hlen = aHaystack.length;
        const nlen = aNeedle.length;
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
                const nch = aNeedle.charCodeAt(i);
                while (j < hlen) {
                    if (aHaystack.charCodeAt(j++) === nch) {
                        if (previousJ === 0) {
                            previousJ = j;
                        } else {
                            if (aHaystack.charCodeAt(j - 2) === 32 && (previousJ === 1 ||
                                    aHaystack.charCodeAt(previousJ - 1) === 32)) {
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
    }

    _doSearch() {
        const pattern = Util.latinise(this.searchEntryText.get_text().trim().toLowerCase());

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
        if (pattern.length < 2) {
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

        const appResults = {};

        let i = this._searchDatabase.length;
        while (i--) {
            let allHaystacksResult = {
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
                        const patternIndex = haystack.data[h].indexOf(pattern);
                        if (haystack.context === "name" &&
                            patternIndex >= 0) {
                            allHaystacksResult = {
                                matches: true,
                                priority: (haystack.priority * 10) + patternIndex
                            };
                            matchCount = 1;
                            break comb;
                        }

                        const haystackResult = this._fuzzySearch(
                            pattern,
                            haystack.data[h],
                            haystack.priority
                        );

                        if (haystackResult.matches) {
                            matchCount += 1;
                            allHaystacksResult.matches = true;
                            allHaystacksResult.priority += haystackResult.priority + haystack.priority;
                        }
                    }
                }

            if (allHaystacksResult.matches) {
                allHaystacksResult.priority = allHaystacksResult.priority / matchCount;

                if (this.$._.strict_search_results &&
                    allHaystacksResult.priority >= SEARCH_PRIORITY.VERY_LOW) {
                    continue;
                }

                appResults[this._searchDatabase[i].app.get_id()] = {
                    app: this._searchDatabase[i].app,
                    categories: this._searchDatabase[i].categories,
                    priority: allHaystacksResult.priority
                };
            }
        }

        const sortedResuls = Object.keys(appResults).sort((a, b) => {
            return (appResults[a].priority || 99999) >
                (appResults[b].priority || 99999);
        });

        this._searchResultsLength = sortedResuls.length;

        // DO NOT USE INVERSE LOOP HERE!!!
        arrayEach(this._searchResultButtons, (aBtn, aIdx) => {
            if (sortedResuls[aIdx]) {
                aBtn.populateItem(appResults[sortedResuls[aIdx]].app);
                aBtn.actor.visible = true;
                this._setSelectedItemTooltip(
                    aBtn,
                    appResults[sortedResuls[aIdx]].app.get_name(),
                    appResults[sortedResuls[aIdx]].app.get_description() || "",
                    appResults[sortedResuls[aIdx]].categories
                );
            } else {
                aBtn.actor.visible = false;
            }
        });

        this.searchResultsEmptyButton.actor.visible = this._searchResultsLength === 0;
        this._ensureFirstAppSelected();

        return false;
    }

    _ensureFirstAppSelected() {
        this.appBoxIter.reloadVisible();
        if (this.appBoxIter.getNumVisibleChildren() > 0) {
            const item_actor = this.appBoxIter.getFirstVisible();
            this._selectedItemIndex = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
            this._activeContainer = this.applicationsBox;

            if (item_actor && item_actor !== this.searchEntry && item_actor.reactive) {
                this._scrollToButton(item_actor._delegate);
                this._buttonEnterEvent(item_actor._delegate);
            }
        }
    }

    _storeAppSearchData(aApp, aCategories) {
        this.$.schedule_manager.idleCall("store_app_search_data", function() {
            const haystacks = [];

            let s = SEARCH_DATA.length;
            while (s--) {
                const context = SEARCH_DATA[s].context;

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
                        const keywords = aApp.get_keywords();
                        haystack = keywords ?
                            // Mark for deletion on EOL. Cinnamon 4.2.x+
                            // Remove Array.isArray check and assume get_keywords
                            // returns an array.
                            // TODO: Leave as it is for now. Looking at the source code, I see that
                            // aApp.get_keywords() should always return a string (even in the default
                            // Cinnamon menu is treated as such).
                            Array.isArray(keywords) ?
                            keywords.filter(Boolean) :
                            keywords.match(/\b(\w+)/g).filter(Boolean) : [];
                        break;
                    case "generic_name":
                        // NOTE: I don't trust this thing. That's why the try{}catch{} block.
                        try {
                            haystack = aApp.get_app_info().get_generic_name() ? [aApp.get_app_info().get_generic_name()] : [];
                        } catch (aErr) {
                            haystack = [];
                            global.logError(aErr);
                        }
                        break;
                        //     // NOTE: This is too strict.
                        //     //  Furthermore, for applications whose description was redacted
                        //     //  by a F***ING salesman, it will not produce any relevant results.
                        // case "get_description":
                        //     // Split sentence into words.
                        //     // <3 https://stackoverflow.com/a/36508315
                        //     haystack = (aApp.get_description().match(/\b(\w+)'?(\w+)?\b/g)).filter((x) => {
                        //         // Ignore most contractions, articles, etc.
                        //         return x && x.length > 4;
                        //     });
                        //     break;
                    case "name":
                    case "description":
                        const val = aApp[`get_${context}`]();
                        haystack = val ? [val] : [];
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
                    priority: SEARCH_DATA[s].priority
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
        }.bind(this));
    }

    _normalizeHaystack(aStr) {
        return Util.latinise(aStr.trim().toLowerCase());
    }

    closeMainMenu() {
        this.menu.close(this.$._.animate_menu);
    }

    _setSelectedItemTooltip(aEl, aTitle, aDescription, aCategories = []) {
        if (aEl && aEl.tooltip) {
            tryFn(() => {
                // Without using the escapeHTML function, the following warning is logged.
                // Clutter-WARNING **: Failed to set the markup of the actor 'ClutterText':
                // Error on line 1: Entity did not end with a semicolon; most likely you used
                // an ampersand character without intending to start an entity - escape ampersand
                // as &amp;
                aEl.tooltip._tooltip.get_clutter_text().set_markup(
                    (aTitle ? `<span weight="bold">${escapeHTML(aTitle)}</span>` : "") +
                    (aDescription ? `
${escapeHTML(aDescription)}` : "") +
                    (aCategories.length > 0 ?
                        `

<span weight="bold">${escapeHTML(_("Categories"))}</span>` +
                        `: ${escapeHTML(aCategories.join(" - "))}` :
                        "")
                );
            }, (aErr) => {
                global.logError(aErr);
                aEl.tooltip._tooltip.set_text(
                    (aTitle ? aTitle : "") +
                    (aDescription ? `
${aDescription}` : "") +
                    (aCategories.length > 0 ?
                        `

${_("Categories")}: ${aCategories.join(" - ")}` :
                        "")
                );
            });
        }
    }

    _hardRefreshAll() {
        this.$.schedule_manager.setTimeout("hard_refresh", function() {
            this.initial_load_done = true;
            this.on_orientation_changed(this.$.orientation);
        }.bind(this), 500);
    }

    __onSettingsChanged(aPrefOldValue, aPrefKey) {
        switch (aPrefKey) {
            case "activate_on_hover":
            case "menu_hover_delay":
                this._updateActivateOnHover();
                break;
            case "use_a_custom_icon_for_applet":
            case "custom_icon_for_applet":
            case "custom_label_for_applet":
                this._updateIconAndLabel();
                break;
            case "toggle_menu_keybinding":
                this._updateKeybinding();
                break;
            case "enable_autoscroll":
                this._update_autoscroll();
                break;
            case "max_width_for_buttons":
                this._updateGlobalPreferences();
                break;
            case "recently_used_apps_ignore_favorites":
            case "recently_used_apps_enabled":
                this._setupRecentAppsManager();
                break;
                /* NOTE: Setting toggled from the Edit Custom launchers
                 * GUI when applying changes.
                 */
            case "hard_refresh_menu":
            case "custom_launchers_apply":
                this._hardRefreshAll();
                break;
            case "hide_applications_list_scrollbar":
                this.applicationsScrollBox.get_vscroll_bar().visible = !this.$._.hide_applications_list_scrollbar;
                break;
            case "hide_categories_list_scrollbar":
                this.categoriesScrollBox.get_vscroll_bar().visible = !this.$._.hide_categories_list_scrollbar;
                break;
        }
    }
}

function main() {
    Debugger.wrapObjectMethods({
        CinnamonMenu: CinnamonMenuForkByOdyseus
    });

    return new CinnamonMenuForkByOdyseus(...arguments);
}
