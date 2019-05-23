let $,
    DebugManager,
    CustomDialogs,
    GlobalUtils;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
    DebugManager = require("./debugManager.js");
    CustomDialogs = require("./customDialogs.js");
    $ = require("./utils.js");
} else {
    GlobalUtils = imports.ui.appletManager.applets["{{UUID}}"].globalUtils;
    DebugManager = imports.ui.appletManager.applets["{{UUID}}"].debugManager;
    CustomDialogs = imports.ui.appletManager.applets["{{UUID}}"].customDialogs;
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
}

const {
    gi: {
        Cinnamon,
        Clutter,
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
        applet: Applet,
        extensionSystem: ExtensionSystem,
        main: Main,
        popupMenu: PopupMenu,
        settings: Settings,
        tooltips: Tooltips,
        tweener: Tweener
    }
} = imports;

const {
    _
} = GlobalUtils;

function DesktopHandler() {
    this._init.apply(this, arguments);
}

DesktopHandler.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(aMetadata, aOrientation, aPanelHeight, aInstanceId) {
        Applet.IconApplet.prototype._init.call(this, aOrientation, aPanelHeight, aInstanceId);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.metadata = aMetadata;
        this.orientation = aOrientation;
        this.instance_id = aInstanceId;

        this._initializeSettings(() => {
            //
        }, () => {
            this.cwm_settings = new Gio.Settings({
                schema: "org.cinnamon.desktop.wm.preferences"
            });
            this.muf_settings = new Gio.Settings({
                schema: "org.cinnamon.muffin"
            });

            this._lastScroll = this.last_sd_req = Date.now();
            this.didpeek = false;
            this.uptgg = true;

            this.actor.connect("scroll-event",
                (aActor, aEvent) => this._onScroll(aActor, aEvent));

            this._handleDesktopPeek();
            this._handleWindowList();
            this._setAppletStyle();

            // Workaround to apply background color on applet load.
            // Without the timeout, the style is not applied. ¬¬
            Mainloop.timeout_add(3000, () => this._setAppletStyle(true));
        });
    },

    _initializeSettings: function(aDirectCallback, aIdleCallback) {
        this.settings = new Settings.AppletSettings(
            this,
            this.metadata.uuid,
            this.instance_id,
            true // Asynchronous settings initialization.
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

                return false;
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
            "pref_applet_background_color",
            "pref_applet_with",
            "pref_custom_icon",
            "pref_scroll_action",
            "pref_separated_scroll_action",
            "pref_left_click_action",
            "pref_middle_click_action",
            "pref_windows_list_menu_enabled",
            "pref_button_to_open_menu",
            "pref_scroll_up_action",
            "pref_scroll_down_action",
            "pref_custom_cmd1_action",
            "pref_custom_cmd2_action",
            "pref_custom_cmd3_action",
            "pref_custom_cmd4_action",
            "pref_prevent_fast_scroll",
            "pref_scroll_delay",
            "pref_switcher_style",
            "pref_switcher_scope",
            "pref_switcher_modified",
            "pref_switcher_modifier",
            "pref_show_context_menu_default_items",
            "pref_show_context_menu_help",
            "pref_show_context_menu_about",
            "pref_show_context_menu_configure",
            "pref_show_context_menu_remove",
            "pref_keep_menu_open",
            "pref_show_close_buttons",
            "pref_show_close_all_buttons",
            "pref_peek_desktop_enabled",
            "pref_peek_desktop_delay",
            "pref_peek_opacity",
            "pref_opacify_desktop_icons",
            "pref_opacify_desklets",
            "pref_blur_effect_enabled",
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

    _handleDesktopPeek: function() {
        try {
            if (this.enterAct) {
                this.actor.disconnect(this.enterAct);
            }
            if (this.leaveAct) {
                this.actor.disconnect(this.leaveAct);
            }
        } catch (aErr) {}

        if (!this.pref_peek_desktop_enabled) {
            return;
        }

        this.enterAct = this.actor.connect("enter-event",
            () => this._onEnter());
        this.leaveAct = this.actor.connect("leave-event",
            () => this._onLeave());
    },

    _handleWindowList: function() {
        if (this.pref_button_to_open_menu === "winlistmenu1") {
            this.pref_left_click_action = "none";
        }

        if (this.pref_button_to_open_menu === "winlistmenu2") {
            this.pref_middle_click_action = "none";
        }

        if (!this.pref_windows_list_menu_enabled) {
            this.pref_button_to_open_menu = "winlistmenu3";
        }

        if (this._winMenu) {
            try {
                this._winMenu.disconnect(this.openAct);
            } catch (aErr) {}
            try {
                // this._winMenu.removeAll();
                // this.finalizeContextMenu();
                this._expand_applet_context_menu(true);
            } catch (aErr) {}
        }

        if (!this.pref_windows_list_menu_enabled) {
            return;
        }

        if (this.pref_button_to_open_menu === "winlistmenu3") // Right click
        {
            this._winMenu = this._applet_context_menu;
        } else { // Left or Middle click
            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this._winMenu = new Applet.AppletPopupMenu(this, this.orientation, this.instance_id);
            this.menuManager.addMenu(this._winMenu);
        }

        try {
            this.openAct = this._winMenu.connect("open-state-changed",
                (actor, isOpening) => this._onToggled(actor, isOpening));
        } catch (aErr) {}
    },

    _createCloseIcon: function(aIsWindow) {
        let close_icon = new St.Icon({
            icon_name: (aIsWindow ? "window-close" : "edit-delete"),
            icon_type: St.IconType.SYMBOLIC,
            icon_size: 14,
            style_class: "popup-menu-icon"
        });

        if (aIsWindow) {
            close_icon["style_class"] = "popup-menu-icon";
        }

        return new St.Button({
            child: close_icon
        });
    },

    updateMenu: function() {
        let allwins = [];
        this._winMenu.removeAll();
        let empty_menu = true;

        try {
            let menuItemFn = (aMetaWorkspace, aMetaWindow) => {
                return () => this.activateWindow(aMetaWorkspace, aMetaWindow);
            };

            let closeButtonFn = (aItem, aMetaWindow, aSticky, aWindows) => {
                return () => {
                    let fallback = false;
                    let items = this._winMenu._getMenuItems();
                    let ii = items.indexOf(aItem);

                    if (!aSticky) {
                        if (items[ii + 1] instanceof PopupMenu.PopupSeparatorMenuItem &&
                            (ii < 2 || items[ii - 2] instanceof PopupMenu.PopupSeparatorMenuItem)) {
                            items[ii - 1].destroy();
                        }
                    }

                    if (this.pref_keep_menu_open) {
                        if (items[ii + 1] && items[ii + 1].actor) {
                            items[ii + 1].actor.grab_key_focus();
                        } else {
                            fallback = true;
                        }
                    }

                    aItem.destroy();
                    delete allwins[allwins.indexOf(aMetaWindow)];
                    aSticky ||
                        delete aWindows[aWindows.indexOf(aMetaWindow)];
                    aMetaWindow.delete(global.get_current_time());

                    // Fallback in case there wasn't an item to focus on.
                    if (this.pref_keep_menu_open && fallback) {
                        this.uptgg = false;
                        this._winMenu.toggle();
                    }
                };
            };

            let closeAllButtonFn = (aWindows) => {
                return () => () => {
                    let items = this._winMenu._getMenuItems();
                    for (let ii = items.indexOf(item); ii < items.length; ii++) {
                        if (items[ii] instanceof PopupMenu.PopupSeparatorMenuItem) {
                            break;
                        }
                        items[ii].destroy();
                    }
                    let wi = 0,
                        wiLen = aWindows.length;
                    for (; wi < wiLen; wi++) {
                        if (aWindows[wi]) {
                            aWindows[wi].delete(global.get_current_time());
                            delete allwins[allwins.indexOf(aWindows[wi])];
                        }
                    }

                    if (this._winMenu.isOpen) {
                        this._winMenu.toggle();
                    }

                    // Keep this method to keep the menu open.
                    // Implementing the same that I did in the other cases
                    // would be a nightmare.
                    if (this.pref_keep_menu_open) {
                        this.uptgg = false;
                        this._winMenu.toggle();
                    }
                };
            };

            let tracker = Cinnamon.WindowTracker.get_default();
            for (let wks = 0; wks < global.screen.n_workspaces; ++wks) {
                // construct a list with all windows
                let workspace_name = Main.getWorkspaceName(wks);
                let metaWorkspace = global.screen.get_workspace_by_index(wks);
                let windows = metaWorkspace.list_windows();
                let sticky_windows = windows.filter(
                    (w) => {
                        return !w.is_skip_taskbar() && w.is_on_all_workspaces();
                    });
                windows = windows.filter(
                    (w) => {
                        return !w.is_skip_taskbar() && !w.is_on_all_workspaces();
                    });

                if (sticky_windows.length && (wks === 0)) {
                    let i = 0,
                        iLen = sticky_windows.length;
                    for (; i < iLen; ++i) {
                        let metaWindow = sticky_windows[i];
                        let TL_Dot = "...";

                        if (metaWindow.get_title().length < 69) {
                            TL_Dot = "";
                        }

                        let app = tracker.get_window_app(metaWindow);
                        let icon = app.create_icon_texture(18);
                        let item = new $.MenuItem(
                            metaWindow.get_title().substring(0, 68) + TL_Dot,
                            icon,
                            menuItemFn(metaWorkspace, metaWindow)
                        );

                        if (this.pref_show_close_buttons) {
                            let close_button = this._createCloseIcon(true);
                            close_button.tooltip = new Tooltips.Tooltip(close_button,
                                _("Close window"));
                            close_button.connect("clicked",
                                closeButtonFn(item, metaWindow, true));
                            item.addActor(close_button, {
                                align: St.Align.END
                            });
                            allwins.push(sticky_windows[i]);
                        }
                        this._winMenu.addMenuItem(item);
                    }

                    empty_menu = false;

                    if (windows.length) {
                        this._winMenu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                    }
                }

                if (windows.length) {
                    if (wks > 0) {
                        this._winMenu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                    }
                    if (global.screen.n_workspaces > 1) {
                        let item = new PopupMenu.PopupMenuItem(workspace_name);
                        item.actor.reactive = false;
                        item.actor.can_focus = false;
                        item.label.add_style_class_name("popup-subtitle-menu-item");

                        if (wks == global.screen.get_active_workspace().index()) {
                            item.setShowDot(true);
                        }

                        if (this.pref_show_close_buttons && this.pref_show_close_all_buttons) {
                            let close_all_button = this._createCloseIcon(false);
                            close_all_button.tooltip = new Tooltips.Tooltip(close_all_button,
                                _("Close all windows from this wrokspace"));
                            close_all_button.connect("clicked",
                                closeAllButtonFn(windows));
                            item.addActor(close_all_button, {
                                align: St.Align.MIDDLE
                            });
                        }

                        this._winMenu.addMenuItem(item);
                        empty_menu = false;
                    }

                    let i = 0,
                        iLen = windows.length;
                    for (; i < iLen; ++i) {
                        let metaWindow = windows[i];
                        let TL_Dot = "...";
                        if (metaWindow.get_title().length < 69) {
                            TL_Dot = "";
                        }
                        let app = tracker.get_window_app(metaWindow);
                        let icon = app.create_icon_texture(18);
                        let item = new $.MenuItem(
                            metaWindow.get_title().substring(0, 68) + TL_Dot,
                            icon,
                            menuItemFn(metaWorkspace, metaWindow)
                        );

                        if (this.pref_show_close_buttons) {
                            let close_button = this._createCloseIcon(true);
                            close_button.tooltip = new Tooltips.Tooltip(close_button,
                                _("Close window"));
                            close_button.connect("clicked",
                                closeButtonFn(item, metaWindow, false, windows));
                            item.addActor(close_button, {
                                align: St.Align.END
                            });
                            allwins.push(windows[i]);
                        }

                        this._winMenu.addMenuItem(item);
                        empty_menu = false;
                    }
                }
            }
        } catch (e) {
            global.logError(e);
        }

        if (empty_menu) {
            let item = new PopupMenu.PopupMenuItem(_("No open windows"));
            item.actor.reactive = false;
            item.actor.can_focus = false;
            item.label.add_style_class_name("popup-subtitle-menu-item");
            this._winMenu.addMenuItem(item);
        }

        this._winMenu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        let icon = new St.Icon({
            icon_name: "cinnamon-expo-symbolic",
            icon_type: St.IconType.SYMBOLIC,
            icon_size: 18
        });
        let item = new $.MenuItem(_("Expo"), icon, () => {
            if (!Main.expo.animationInProgress) {
                Main.expo.toggle();
            }
        });

        if (allwins.length > 0 && this.pref_show_close_buttons && this.pref_show_close_all_buttons) {
            let close_button = this._createCloseIcon(false);
            close_button.tooltip = new Tooltips.Tooltip(close_button,
                _("Close all windows from all workspaces"));
            close_button.connect("clicked", () => {
                let wi = 0,
                    wiLen = allwins.length;
                for (; wi < wiLen; wi++) {
                    if (allwins[wi]) {
                        allwins[wi].delete(global.get_current_time());
                    }
                }
                this._winMenu.toggle();
            });
            item.addActor(close_button, {
                align: St.Align.MIDDLE
            });
        }

        this._winMenu.addMenuItem(item);

        if (this.pref_button_to_open_menu === "winlistmenu3") {
            this._expand_applet_context_menu();
        } else {
            this.finalizeContextMenu();
        }
    },

    _expand_applet_context_menu: function(aRestore) {
        if (aRestore) {
            this._applet_context_menu.removeAll();
        }

        let addSeparator = 0;

        if (this.pref_show_context_menu_about) {
            addSeparator += 1;
        }

        if (this.pref_show_context_menu_configure) {
            addSeparator += 1;
        }

        if (this.pref_show_context_menu_remove) {
            addSeparator += 1;
        }

        /**
         * The default context menu items need to have the following names
         * to overwrite the original ones.
         */
        if (!aRestore && addSeparator !== 0) {
            this.context_menu_separator = new PopupMenu.PopupSeparatorMenuItem();
            this._applet_context_menu.addMenuItem(this.context_menu_separator);
        }

        if (this.pref_show_context_menu_help || aRestore) {
            let menuItem = new PopupMenu.PopupIconMenuItem(_("Help"),
                "dialog-information", St.IconType.SYMBOLIC);
            menuItem.connect("activate", () => {
                Util.spawn_async(["xdg-open", this.metadata.path + "/HELP.html"], null);
            });
            this._applet_context_menu.addMenuItem(menuItem);
        }

        if (this.pref_show_context_menu_about || aRestore) {
            this.context_menu_item_about = new PopupMenu.PopupIconMenuItem(_("About..."),
                "dialog-question",
                St.IconType.SYMBOLIC);
            this.context_menu_item_about.connect("activate", () => this.openAbout());
            this._applet_context_menu.addMenuItem(this.context_menu_item_about);
        }

        if (this.pref_show_context_menu_configure || aRestore) {
            this.context_menu_item_configure = new PopupMenu.PopupIconMenuItem(_("Configure..."),
                "system-run",
                St.IconType.SYMBOLIC);
            this.context_menu_item_configure.connect("activate", () => {
                Util.spawn_async(["cinnamon-settings", "applets", this.metadata.uuid,
                    this.instance_id
                ], null);
            });
            this._applet_context_menu.addMenuItem(this.context_menu_item_configure);
        }

        if (this.pref_show_context_menu_remove || aRestore) {
            this.context_menu_item_remove = new PopupMenu.PopupIconMenuItem(_("Remove '%s'")
                .format(_(this.metadata.name)),
                "edit-delete",
                St.IconType.SYMBOLIC);
            this.context_menu_item_remove.connect("activate", () => {
                let dialog = new CustomDialogs.ConfirmDialog({
                    dialogName: "DesktopHandlerDialog",
                    headline: _(this.metadata.name),
                    description: _("Are you sure that you want to remove '%s' from your panel?")
                        .format(_(this.metadata.name)),
                    cancelLabel: _("Cancel"),
                    okLabel: _("OK"),
                    callback: () => {
                        Main.AppletManager._removeAppletFromPanel(this.metadata.uuid, this.instance_id);
                    }
                });
                dialog.open();
            });
            this._applet_context_menu.addMenuItem(this.context_menu_item_remove);
        }
    },

    activateWindow: function(metaWorkspace, metaWindow) {
        if (!metaWindow.is_on_all_workspaces()) {
            metaWorkspace.activate(global.get_current_time());
        }

        metaWindow.unminimize(global.get_current_time());
        metaWindow.activate(global.get_current_time());
    },

    _onToggled: function(actor, isOpening) {
        if (isOpening) {
            if (this.uptgg) {
                this.updateMenu();
            } else if (this._winMenu._getMenuItems()[0] instanceof PopupMenu.PopupSeparatorMenuItem &&
                (this._winMenu._getMenuItems().length < 3 ||
                    (this._winMenu._getMenuItems().length < 4 && this._winMenu._getMenuItems()[1] instanceof PopupMenu.PopupSeparatorMenuItem) || (this._winMenu._getMenuItems().length < 5 &&
                        this._winMenu._getMenuItems()[1] instanceof PopupMenu.PopupSeparatorMenuItem &&
                        this._winMenu._getMenuItems()[2] instanceof PopupMenu.PopupSeparatorMenuItem)
                )
            ) {
                this._winMenu.toggle();
            }
        }

        this.uptgg = true;
    },

    show_all: function(time) {
        let windows = global.get_window_actors();
        let i = 0,
            iLen = windows.length;
        for (; i < iLen; i++) {
            let window = windows[i].meta_window;
            let compositor = windows[i];

            if (window.get_title() == "Desktop") {
                Tweener.addTween(compositor, {
                    opacity: 255,
                    time: time,
                    transition: "easeOutSine"
                });
            }

            if (this.pref_blur_effect_enabled && compositor.eff) {
                compositor.remove_effect(compositor.eff);
            }
        }
        Tweener.addTween(global.window_group, {
            opacity: 255,
            time: time,
            transition: "easeOutSine"
        });
        Tweener.addTween(Main.deskletContainer.actor, {
            opacity: 255,
            time: time,
            transition: "easeOutSine"
        });
    },

    _onEnter: function() {
        if (this.pref_peek_desktop_enabled) {
            if (this._peektimeoutid) {
                Mainloop.source_remove(this._peektimeoutid);
            }

            this._peektimeoutid = Mainloop.timeout_add(this.pref_peek_desktop_delay,
                () => {
                    if (this.actor.hover && !this._applet_context_menu.isOpen && !global.settings.get_boolean("panel-edit-mode")) {

                        Tweener.addTween(global.window_group, {
                            opacity: this.pref_peek_opacity,
                            time: 0.275,
                            transition: "easeInSine"
                        });

                        let windows = global.get_window_actors();
                        let i = 0,
                            iLen = windows.length;
                        for (; i < iLen; i++) {
                            let window = windows[i].meta_window;
                            let compositor = windows[i];
                            if (window.get_title() == "Desktop") {
                                if (this.pref_opacify_desktop_icons) {
                                    Tweener.addTween(compositor, {
                                        opacity: this.pref_peek_opacity,
                                        time: 0.275,
                                        transition: "easeInSine"
                                    });
                                } else {
                                    continue;
                                }
                            }

                            if (this.pref_blur_effect_enabled) {
                                if (!compositor.eff) {
                                    compositor.eff = new Clutter.BlurEffect();
                                }
                                compositor.add_effect_with_name("blur", compositor.eff);
                            }
                        }

                        if (this.pref_opacify_desklets) {
                            Tweener.addTween(Main.deskletContainer.actor, {
                                opacity: this.pref_peek_opacity,
                                time: 0.275,
                                transition: "easeInSine"
                            });
                        }
                        this.didpeek = true;
                    }

                }
            );
        }
    },

    _onLeave: function() {
        if (this.didpeek) {
            this.show_all(0.2);
            this.didpeek = false;
        }

        if (this._peektimeoutid) {
            Mainloop.source_remove(this._peektimeoutid);
        }
    },

    _setAppletStyle: function(aInit) {
        this.actor.style = "background-color:" + this.pref_applet_background_color + ";";

        if (aInit) {
            return;
        }

        // If I use this.actor.style to set the applet width, it will not apply the width
        // when the applet is loaded. ¬¬
        if (this.pref_applet_with !== 0) {
            this.actor.set_width(this.pref_applet_with);
        }

        // Set icon block extracted from default Cinnamon Menu applet.
        try {
            if (this.pref_custom_icon === "") {
                this.set_applet_icon_name("");
                this.hide_applet_icon();
            } else if (GLib.path_is_absolute(this.pref_custom_icon) &&
                GLib.file_test(this.pref_custom_icon, GLib.FileTest.EXISTS)) {
                if (this.pref_custom_icon.search("-symbolic") !== -1) {
                    this.set_applet_icon_symbolic_path(this.pref_custom_icon);
                } else {
                    this.set_applet_icon_path(this.pref_custom_icon);
                }
            } else if (Gtk.IconTheme.get_default().has_icon(this.pref_custom_icon)) {
                if (this.pref_custom_icon.search("-symbolic") !== -1) {
                    this.set_applet_icon_symbolic_name(this.pref_custom_icon);
                } else {
                    this.set_applet_icon_name(this.pref_custom_icon);
                }
            } else {
                try {
                    if (this.pref_custom_icon.search("-symbolic") != -1) {
                        this.set_applet_icon_symbolic_name(this.pref_custom_icon);
                    } else {
                        this.set_applet_icon_name(this.pref_custom_icon);
                    }
                } catch (aErr) {
                    global.logError(aErr);
                }
            }
        } catch (e) {
            global.logWarning('Could not load icon file "' + this.pref_custom_icon + '" for applet.');
        }

        this._setAppletTooltip();
    },

    _strMap: function(aKey) {
        let strMap = {
            "expo": _("Expo"),
            "overview": _("Overview"),
            "appswitcher": _("Launch App Switcher"),
            "cc1": _("Run 1st Custom Command"),
            "cc2": _("Run 2nd Custom Command"),
            "cc3": _("Run 3rd Custom Command"),
            "cc4": _("Run 4rd Custom Command"),
            "none": _("None"),
            "icons": _("Icons only"),
            "thumbnails": _("Thumbnails only"),
            "icons+thumbnails": _("Icons and thumbnails"),
            "icons+preview": _("Icons and window preview"),
            "preview": _("Window preview (no icons)"),
            "coverflow": _("Coverflow (3D)"),
            "timeline": _("Timeline (3D)"),
            "default": _("System default"),
            "switch_workspace": _("Switch between workspaces"),
            "adjust_opacity": _("Adjust opacity of windows"),
            "desktop": _("Toggle show desktop"),
            "switch-windows": _("Switch between windows"),
            "winmenu": _("Open windows list menu")
        };

        return strMap[aKey];
    },

    _setAppletTooltip: function() {
        if (this.tooltip) {
            this.tooltip.destroy();
        }

        let boldSpan = (aStr) => {
            return '<span weight="bold">' + aStr + "</span>";
        };

        let tt = boldSpan(_(this.metadata.name)) + "\n\n";

        if (this.pref_separated_scroll_action) {
            tt += boldSpan(_("Scroll Up") + ": ") + this._strMap(this.pref_scroll_up_action) + "\n";
            tt += boldSpan(_("Scroll Down") + ": ") + this._strMap(this.pref_scroll_down_action) + "\n";
        } else {
            tt += boldSpan(_("Scroll") + ": ") + this._strMap(this.pref_scroll_action) + "\n";
        }

        let lCA = (this.pref_windows_list_menu_enabled &&
                this.pref_button_to_open_menu === "winlistmenu1") ?
            this._strMap("winmenu") :
            this._strMap(this.pref_left_click_action);
        tt += boldSpan(_("Left click") + ": ") + _(lCA) + "\n";

        let mCA = (this.pref_windows_list_menu_enabled &&
                this.pref_button_to_open_menu === "winlistmenu2") ?
            this._strMap("winmenu") :
            this._strMap(this.pref_middle_click_action);
        tt += boldSpan(_("Middle click") + ": ") + _(mCA) + "\n";

        if (this.pref_windows_list_menu_enabled &&
            this.pref_button_to_open_menu === "winlistmenu3") {
            tt += boldSpan(_("Right click") + ": ") + this._strMap("winmenu") + "\n";
        }

        this.tooltip = new Tooltips.PanelItemTooltip(this, "", this.orientation);

        try {
            this.tooltip._tooltip.set_style("text-align: left;");
            this.tooltip._tooltip.get_clutter_text().set_line_wrap(true);
            this.tooltip._tooltip.get_clutter_text().set_markup(tt);
        } catch (aErr) {
            global.logError("Error Tweaking Tooltip: " + aErr);
            /* If we couldn't tweak the tooltip format this is likely because
             * the underlying implementation has changed. Don't issue any
             * failure here */
        }
    },

    _onScrollActionChanged: function() {
        if (this.pref_scroll_action !== "none") {
            this.pref_separated_scroll_action = false;
        }

        this._setAppletTooltip();
    },

    _onScrollSettingsChanged: function() {
        if (this.pref_separated_scroll_action === true) {
            this.pref_scroll_action = "none";
        }

        this._setAppletTooltip();
    },

    _onButtonPressEvent: function(aActor, aE) {
        let button = aE.get_button();
        let open_menu = false;

        if (button === 1) {
            open_menu = this.pref_windows_list_menu_enabled &&
                this.pref_button_to_open_menu === "winlistmenu1";
            this.Do(open_menu ?
                this.pref_button_to_open_menu :
                this.pref_left_click_action);
        } else if (button === 2) {
            open_menu = this.pref_windows_list_menu_enabled &&
                this.pref_button_to_open_menu === "winlistmenu2";
            this.Do(open_menu ?
                this.pref_button_to_open_menu :
                this.pref_middle_click_action);
        }

        this.show_all(0);

        if (this._peektimeoutid) {
            Mainloop.source_remove(this._peektimeoutid);
        }

        this.didpeek = false;

        return Applet.Applet.prototype._onButtonPressEvent.call(this, aActor, aE);
    },

    _onScroll: function(aActor, aE) {
        let currentTime = Date.now();
        let direction = aE.get_scroll_direction();

        if (this.pref_separated_scroll_action) {
            if (direction == Clutter.ScrollDirection.UP) {
                this.Do(this.pref_scroll_up_action);
            } else if (direction == Clutter.ScrollDirection.DOWN) {
                this.Do(this.pref_scroll_down_action);
            }
        } else {
            let scrollDirection;
            switch (direction) {
                case Clutter.ScrollDirection.UP:
                    scrollDirection = 1;
                    break;
                case Clutter.ScrollDirection.DOWN:
                    scrollDirection = -1;
                    break;
                default:
                    return Clutter.EVENT_PROPAGATE;
            }

            if (this.pref_scroll_action === "adjust_opacity") { // Tested OK
                let min_opacity = this.cwm_settings.get_int("min-window-opacity") * 255 / 100;
                let m = 50;
                m = global.window_group.opacity + m * scrollDirection;
                if (m < min_opacity) {
                    m = min_opacity;
                }
                if (m > 255) {
                    m = 255;
                }
                global.window_group.opacity = m;
            } else if (this.pref_scroll_action === "desktop") { // Tested OK
                if (Main.panel.bottomPosition) {
                    scrollDirection = -scrollDirection;
                }
                if (scrollDirection === 1) {
                    GLib.spawn_command_line_async("wmctrl -k on");
                } else if (scrollDirection === -1) {
                    GLib.spawn_command_line_async("wmctrl -k off");
                }
            } else {
                let limit = this._lastScroll + this.pref_scroll_delay;
                if (this.pref_prevent_fast_scroll &&
                    currentTime < limit &&
                    currentTime >= this._lastScroll) {} else if (this.pref_scroll_action === "switch_workspace") {
                    if (ExtensionSystem.runningExtensions["Flipper@connerdev"]) {
                        if (!this.Flipper) {
                            this.Flipper = ExtensionSystem.extensions["Flipper@connerdev"]["extension"];
                        }

                        let binding = [];
                        binding.get_mask = () => {
                            return 0x0;
                        };

                        if (scrollDirection === 1) {
                            binding.get_name = () => {
                                return "switch-to-workspace-left";
                            };
                        } else if (scrollDirection == -1) {
                            binding.get_name = () => {
                                return "switch-to-workspace-right";
                            };
                        }

                        let flipper = new this.Flipper.Flipper(null, null, null, binding);

                        if (flipper.is_animating) {
                            flipper.destroy_requested = true;
                        } else {
                            flipper.destroy_requested = true;
                            flipper.onDestroy();
                        }
                    } else {
                        let activeWsIndex = global.screen.get_active_workspace_index();
                        let reqWsInex = activeWsIndex - scrollDirection;
                        let last = global.screen.get_n_workspaces() - 1;
                        let first = 0;
                        let flast = last;
                        if (this.muf_settings.get_boolean("workspace-cycle")) {
                            first = last;
                            flast = 0;
                        }

                        if (reqWsInex < 0) {
                            reqWsInex = first;
                        } else if (reqWsInex > last) {
                            reqWsInex = flast;
                        }

                        let reqWs = global.screen.get_workspace_by_index(reqWsInex);
                        reqWs.activate(global.get_current_time());
                        this.showWorkspaceOSD();
                    }
                } else if (this.pref_scroll_action === "switch-windows") {
                    let current = 0;
                    let vis_windows = [];
                    this.window_list = global.screen.get_active_workspace().list_windows();
                    let v = 0,
                        vLen = this.window_list.length;
                    for (; v < vLen; v++) {
                        if (!this.window_list[v].is_skip_taskbar()) {
                            vis_windows.push(v);
                        }
                    }
                    let n = 0;
                    let num_windows = vis_windows.length;
                    for (; n < num_windows; n++) {
                        if (this.window_list[vis_windows[n]].has_focus()) {
                            current = n;
                            break;
                        }
                    }
                    let target = current - scrollDirection;
                    if (target < 0) {
                        target = num_windows - 1;
                    }
                    if (target > num_windows - 1) {
                        target = 0;
                    }
                    Main.activateWindow(this.window_list[vis_windows[target]],
                        global.get_current_time());
                }
            }
        }
        this._lastScroll = currentTime;
        return true;
    },

    Do: function(aAction) {
        let activeWs = 0,
            reqWs = 0;
        switch (aAction) {
            case "winlistmenu1":
            case "winlistmenu2":
                this._winMenu.toggle();
                break;
            case "expo":
                if (!Main.expo.animationInProgress) {
                    Main.expo.toggle();
                }
                break;
            case "overview":
                if (!Main.overview.animationInProgress) {
                    Main.overview.toggle();
                }
                break;
            case "desktop":
                let currentTime = Date.now();
                if (currentTime < this.last_sd_req + this.pref_scroll_delay &&
                    currentTime > this.last_sd_req) {
                    this.last_sd_req = currentTime;
                    return true;
                }
                global.screen.toggle_desktop(global.get_current_time());
                this.last_sd_req = currentTime;
                break;
            case "cc1":
                Util.spawnCommandLine(this.pref_custom_cmd1_action);
                break;
            case "cc2":
                Util.spawnCommandLine(this.pref_custom_cmd2_action);
                break;
            case "cc3":
                Util.spawnCommandLine(this.pref_custom_cmd3_action);
                break;
            case "cc4":
                Util.spawnCommandLine(this.pref_custom_cmd4_action);
                break;
            case "leftWS":
                activeWs = global.screen.get_active_workspace();
                reqWs = activeWs.get_neighbor(Meta.MotionDirection.LEFT);
                break;
            case "rightWS":
                activeWs = global.screen.get_active_workspace();
                reqWs = activeWs.get_neighbor(Meta.MotionDirection.RIGHT);
                break;
            case "firstWS":
                reqWs = global.screen.get_workspace_by_index(0);
                break;
            case "lastWS":
                let n = global.screen.get_n_workspaces() - 1;
                reqWs = global.screen.get_workspace_by_index(n);
                break;
            case "appswitcher":
                this.get_name = () => {
                    if (eval(this.pref_switcher_modifier) & global.get_pointer()[2]) {
                        return this.pref_switcher_modified;
                    } else {
                        return this.pref_switcher_scope;
                    }
                };
                this.get_mask = () => {
                    return 0xFFFF;
                };
                let style = this.pref_switcher_style;

                if (style === "default") {
                    style = global.settings.get_string("alttab-switcher-style");
                }

                let delay = global.settings.get_int("alttab-switcher-delay");
                switch (style) {
                    case "coverflow":
                        if (!this._switcherIsRuning) {
                            new $.MyCoverflowSwitcher(this);
                        }

                        this._switcherIsRuning = true;
                        Mainloop.timeout_add(delay, () => {
                            this._switcherIsRuning = false;
                        });
                        break;
                    case "timeline":
                        if (!this._switcherIsRuning) {
                            new $.MyTimelineSwitcher(this);
                        }

                        this._switcherIsRuning = true;
                        Mainloop.timeout_add(delay, () => {
                            this._switcherIsRuning = false;
                        });
                        break;
                    default:
                        new $.MyClassicSwitcher(this);
                        break;
                }

                break;
        }

        if (reqWs) {
            reqWs.activate(global.get_current_time());
            this.showWorkspaceOSD();
        }

        return true;
    },

    showWorkspaceOSD: function() {
        this._hideWorkspaceOSD();
        if (global.settings.get_boolean("workspace-osd-visible")) {
            let current_workspace_index = global.screen.get_active_workspace_index();
            let monitor = Main.layoutManager.primaryMonitor;

            if (!this._workspace_osd) {
                this._workspace_osd = new St.Label({
                    style_class: "workspace-osd"
                });
            }

            this._workspace_osd.set_text(Main.getWorkspaceName(current_workspace_index));
            this._workspace_osd.set_opacity = 0;
            Main.layoutManager.addChrome(this._workspace_osd, {
                visibleInFullscreen: false,
                affectsInputRegion: false
            });
            let workspace_osd_x = global.settings.get_int("workspace-osd-x");
            let workspace_osd_y = global.settings.get_int("workspace-osd-y");
            /*
             * This aligns the osd edges to the minimum/maximum values from gsettings,
             *
             * if those are selected to be used. For values in between minimum/maximum,
             * it shifts the osd by half of the percentage used of the overall space available
             * for display (100% - (left and right "padding")).
             * The horizontal minimum/maximum values are 5% and 95%, resulting in 90% available for
             *  positioning
             * If the user chooses 50% as osd position, these calculations result the osd being
             *  centered onscreen
             */
            let [minX, maxX, minY, maxY] = [5, 95, 5, 95];
            let delta = (workspace_osd_x - minX) / (maxX - minX);
            let x = Math.round((monitor.width * workspace_osd_x / 100) -
                (this._workspace_osd.width * delta));
            delta = (workspace_osd_y - minY) / (maxY - minY);
            let y = Math.round((monitor.height * workspace_osd_y / 100) -
                (this._workspace_osd.height * delta));
            this._workspace_osd.set_position(x, y);
            let duration = global.settings.get_int("workspace-osd-duration") / 1000;
            Tweener.addTween(this._workspace_osd, {
                opacity: 255,
                time: duration,
                transition: "linear",
                onComplete: this._fadeWorkspaceOSD,
                onCompleteScope: this
            });
        }
    },

    _fadeWorkspaceOSD: function() {
        if (this._workspace_osd) {
            let duration = global.settings.get_int("workspace-osd-duration") / 2000;
            Tweener.addTween(this._workspace_osd, {
                opacity: 0,
                time: duration,
                transition: "easeOutExpo",
                onComplete: this._hideWorkspaceOSD,
                onCompleteScope: this
            });
        }
    },

    _hideWorkspaceOSD: function() {
        if (this._workspace_osd) {
            this._workspace_osd.hide();
            Main.layoutManager.removeChrome(this._workspace_osd);
            this._workspace_osd.destroy();
            this._workspace_osd = null;
        }
    },

    checkEventSource: function(aActor, aE) {
        let source = aE.get_source();
        let not_ours = (source !== aActor);
        return not_ours;
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
            case "pref_applet_background_color":
            case "pref_applet_with":
            case "pref_custom_icon":
                this._setAppletStyle();
                break;
            case "pref_scroll_action":
                this._onScrollActionChanged();
                break;
            case "pref_separated_scroll_action":
            case "pref_scroll_up_action":
            case "pref_scroll_down_action":
                this._onScrollSettingsChanged();
                break;
            case "pref_left_click_action":
            case "pref_middle_click_action":
                this._setAppletTooltip();
                break;
            case "pref_windows_list_menu_enabled":
            case "pref_button_to_open_menu":
                this._handleWindowList();
                this._setAppletTooltip();
                break;
            case "pref_keep_menu_open":
                this.updateMenu();
                break;
            case "pref_peek_desktop_enabled":
                this._handleDesktopPeek();
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
    DebugManager.wrapPrototypes($.Debugger, {
        DesktopHandler: DesktopHandler
    });

    return new DesktopHandler(aMetadata, aOrientation, aPanelHeight, aInstanceId);
}
