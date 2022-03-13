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
    misc: {
        util: Util
    },
    ui: {
        applet: Applet,
        extensionSystem: ExtensionSystem,
        main: Main,
        popupMenu: PopupMenu,
        tooltips: Tooltips,
        tweener: Tweener
    }
} = imports;

const {
    APPLET_PREFS,
    STRINGS_MAP
} = require("js_modules/constants.js");

const {
    _,
    tryFn
} = require("js_modules/globalUtils.js");

const {
    ConfirmDialog
} = require("js_modules/customDialogs.js");

const {
    CustomPanelItemTooltip
} = require("js_modules/customTooltips.js");

const {
    Debugger,
    WindowMenuItem,
    MyClassicSwitcher,
    MyCoverflowSwitcher,
    MyTimelineSwitcher
} = require("js_modules/utils.js");

const {
    getBaseAppletClass
} = require("js_modules/appletsUtils.js");

class DesktopHandler extends getBaseAppletClass(Applet.IconApplet) {
    constructor(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
        super({
            metadata: aMetadata,
            orientation: aOrientation,
            panel_height: aPanelHeight,
            instance_id: aInstanceID,
            init_keybinding_manager: false,
            pref_keys: APPLET_PREFS,
            init_menu: false
        });

        this.__initializeApplet(() => {
            this._setAppletStyle();
        }, () => {
            this.cwm_settings = new Gio.Settings({
                schema: "org.cinnamon.desktop.wm.preferences"
            });
            this.muf_settings = new Gio.Settings({
                schema: "org.cinnamon.muffin"
            });

            this.vertical = this.$.orientation === St.Side.LEFT || this.$.orientation === St.Side.RIGHT;
            this._lastScroll = this.last_show_desktop_request = Date.now();
            this._did_peek = false;
            this.workspaceSubtitles = new Map();
            this.allWindows = new Set();
            this._winMenu = null;
            this.menuManager = null;
            this.scrollBox = null;
            this.windowsBox = null;
            this.windowsContainer = null;
            this.windowTracker = Cinnamon.WindowTracker.get_default();
            this.winMenuBuildRequested = false;

            this._handleHover();
            this._handleWindowList();
        });
    }

    __connectSignals() {
        this.$.signal_manager.connect(this.actor, "scroll-event", function(aActor, aEvent) {
            this._onScroll(aActor, aEvent);
        }.bind(this));
    }

    _handleHover() {
        this.$.signal_manager.disconnect("enter-event", this.actor);
        this.$.signal_manager.disconnect("leave-event", this.actor);
        this.$.schedule_manager.clearSchedule("hover");

        if (!this.$._.hover_enabled) {
            return;
        }

        this.$.signal_manager.connect(this.actor, "enter-event", function() {
            this._onEntered();
        }.bind(this));
        this.$.signal_manager.connect(this.actor, "leave-event", function() {
            this._onLeft();
        }.bind(this));
    }

    _handleWindowList() {
        // LOGIC: If the left mouse button is configured to open the windows list menu,
        // set the left click action to none.
        if (this.$._.button_to_open_menu === "winlistmenu1") {
            this.$._.left_click_action = "none";
        }

        // LOGIC: If the middle mouse button is configured to open the windows list menu,
        // set the middle click action to none.
        if (this.$._.button_to_open_menu === "winlistmenu2") {
            this.$._.middle_click_action = "none";
        }

        // LOGIC: If the windows list menu is disabled, set the setting to configure the
        // button to open the menu to right click. This is done so the left and middle click
        // actions can be set to visible and be configured.
        if (!this.$._.windows_list_menu_enabled) {
            this.$._.button_to_open_menu = "winlistmenu3";

            try {
                this._expandAppletContextMenu(true);
            } catch (aErr) {}
            return;
        }

        this._winMenu && this._winMenu instanceof Applet.AppletPopupMenu && this._winMenu.destroy();
        this.menuManager && this.menuManager.destroy();

        if (this.$._.button_to_open_menu === "winlistmenu3") { // Right click
            this._winMenu = this._applet_context_menu;
        } else { // Left or Middle click
            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this._winMenu = new Applet.AppletPopupMenu(this, this.$.orientation);
            this.menuManager.addMenu(this._winMenu);
        }

        this.$.signal_manager.connect(this._winMenu, "open-state-changed", function(aActor, aOpen) {
            this._onWindowsMenuToggled(aActor, aOpen);
        }.bind(this));
    }

    _resetMenu() {
        this._winMenu.removeAll();
        this.windowsBox && this.windowsBox.destroy();
        this.scrollBox && this.scrollBox.destroy();
        this.windowsContainer && this.windowsContainer.destroy();

        this.windowsContainer = new St.BoxLayout({
            vertical: true
        });
        this._winMenu.addActor(this.windowsContainer);

        this.scrollBox = new St.ScrollView({
            x_fill: true,
            y_fill: false,
            y_align: St.Align.START
        });
        this.scrollBox.set_auto_scrolling(true);
        this.windowsContainer.add(this.scrollBox);

        this.windowsBox = new St.BoxLayout({
            vertical: true
        });
        this.scrollBox.add_actor(this.windowsBox);
        this.scrollBox.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
    }

    _createSubtitleItem(aLabel) {
        const item = new PopupMenu.PopupMenuItem(aLabel);
        item.actor.reactive = false;
        item.actor.can_focus = false;
        item.label.add_style_class_name("popup-subtitle-menu-item");

        return item;
    }

    _createCloseIcon() {
        const close_icon = new St.Icon({
            icon_name: this.$._.icon_close_all_windows,
            icon_type: St.IconType.SYMBOLIC,
            icon_size: this.$._.icon_close_all_windows_size,
            style_class: "popup-menu-icon"
        });

        return new St.Button({
            child: close_icon
        });
    }

    _onCloseAllWindowsButton(aMenuSection, aWindows) {
        // NOTE: Grab key focus on the menu itself to avoid auto cloing of the menu.
        this._winMenu.actor.grab_key_focus();

        aMenuSection.destroy();

        // LOGIC: aWindows is the list of all windows that are represented by menu items.
        // Delete all these windows from the windows storage (this.allWindows) and close them.
        for (const metaWindow of aWindows) {
            if (metaWindow) {
                this.allWindows.delete(metaWindow);
                metaWindow.delete(global.get_current_time());
            }
        }

        this.closeWindowsMenu("keep_menu_open_when_closing");
    }

    closeWindowsMenu(aPref) {
        if (Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2] || this.$._[aPref]) {
            return;
        }

        this._winMenu.close(false);
    }

    // NOTE: Not used for now. After implementing the menu update on a million events so I don't
    // have to update the menu on EVERY SINGLE F*CKING OPENING OF IT, I discovered that making
    // a window stycky will not trigger a f*cking event. So, I will keep updating the menu
    // EVERY SINGLE TIME THAT IT'S OPENED and wait for muffin to be less r*tarded.
    // _updateWindowsMenu() {
    //     this.$.schedule_manager.setTimeout("update_windows_menu", function() {
    //         this.updateWindowsMenu();
    //     }.bind(this), 500);
    // }

    updateWindowsMenu() {
        this.workspaceSubtitles.clear();
        this.allWindows.clear();
        this._resetMenu();

        let empty_menu = true;

        tryFn(() => {
            for (const wksIdx of [...Array(global.screen.n_workspaces).keys()]) {
                // const windowTracker = Cinnamon.WindowTracker.get_default();
                const workspace_name = Main.getWorkspaceName(wksIdx);
                const metaWorkspace = global.screen.get_workspace_by_index(wksIdx);
                let menuSection;
                let windows = metaWorkspace.list_windows();
                const stickyWindows = new Set(windows.filter((w) => {
                    return !w.is_skip_taskbar() && w.is_on_all_workspaces();
                }));
                windows = new Set(windows.filter((w) => {
                    return !w.is_skip_taskbar() && !w.is_on_all_workspaces();
                }));

                if (stickyWindows.size && wksIdx === 0) {
                    menuSection = new PopupMenu.PopupMenuSection();
                    this.windowsBox.add_child(menuSection.actor);

                    const item = this._createSubtitleItem(_("Sticky windows"));

                    if (this.$._.show_close_buttons && this.$._.show_close_all_buttons) {
                        const close_all_button = this._createCloseIcon();
                        close_all_button.tooltip = new Tooltips.Tooltip(close_all_button,
                            _("Close all sticky windows"));
                        close_all_button.connect("clicked",
                            this._onCloseAllWindowsButton.bind(this, menuSection, stickyWindows)
                        );
                        item.addActor(close_all_button, {
                            span: -1,
                            align: St.Align.END
                        });
                    }

                    menuSection.addMenuItem(item);

                    for (const metaWindow of stickyWindows) {
                        const item = new WindowMenuItem(this, {
                            // window_tracker: windowTracker,
                            windows: windows,
                            sticky: true,
                            menusection: menuSection,
                            workspace: metaWorkspace,
                            meta_window: metaWindow
                        });

                        this.allWindows.add(metaWindow);
                        menuSection.addMenuItem(item);
                    }

                    empty_menu = false;
                }

                if (windows.size) {
                    menuSection = new PopupMenu.PopupMenuSection();
                    this.windowsBox.add_child(menuSection.actor);

                    if (global.screen.n_workspaces > 1) {
                        const item = this._createSubtitleItem(workspace_name);
                        this.workspaceSubtitles.set(wksIdx, item);

                        if (wksIdx === global.screen.get_active_workspace().index()) {
                            item.setShowDot(true);
                        }

                        if (this.$._.show_close_buttons && this.$._.show_close_all_buttons) {
                            const close_all_button = this._createCloseIcon(false);
                            close_all_button.tooltip = new Tooltips.Tooltip(close_all_button,
                                _("Close all windows from this workspace"));
                            close_all_button.connect("clicked",
                                this._onCloseAllWindowsButton.bind(this, menuSection, windows)
                            );
                            item.addActor(close_all_button, {
                                span: -1,
                                align: St.Align.END
                            });
                        }

                        menuSection.addMenuItem(item);
                        empty_menu = false;
                    }

                    for (const metaWindow of windows) {
                        const item = new WindowMenuItem(this, {
                            // window_tracker: windowTracker,
                            windows: windows,
                            sticky: false,
                            menusection: menuSection,
                            workspace: metaWorkspace,
                            meta_window: metaWindow
                        });

                        this.allWindows.add(metaWindow);
                        menuSection.addMenuItem(item);
                        empty_menu = false;
                    }
                }
            }
        }, (aErr) => global.logError(aErr));

        if (empty_menu) {
            const item = this._createSubtitleItem(_("No open windows"));
            this._winMenu.addMenuItem(item);
        }

        this._winMenu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const item = new PopupMenu.PopupIconMenuItem(_("Expo"),
            "cinnamon-expo-symbolic", St.IconType.SYMBOLIC);
        item.connect("activate", () => {
            if (!Main.expo.animationInProgress) {
                Main.expo.toggle();
            }
        });

        if (this.allWindows.size > 0 && this.$._.show_close_buttons && this.$._.show_close_all_buttons) {
            const close_button = this._createCloseIcon(false);
            close_button.tooltip = new Tooltips.Tooltip(close_button,
                _("Close all windows from all workspaces"));
            close_button.connect("clicked", () => {
                for (const metaWindow of this.allWindows) {
                    metaWindow && metaWindow.delete(global.get_current_time());
                }
                this._winMenu.toggle();
            });
            item.addActor(close_button, {
                span: -1,
                align: St.Align.END
            });
        }

        this._winMenu.addMenuItem(item);

        if (this.$._.button_to_open_menu === "winlistmenu3") {
            this._expandAppletContextMenu();
        } else {
            this.finalizeContextMenu();
        }
    }

    _expandAppletContextMenu(aRestore) {
        if (aRestore) {
            this._applet_context_menu.removeAll();
        }

        this.context_menu_separator = new PopupMenu.PopupSeparatorMenuItem();
        this._applet_context_menu.addMenuItem(this.context_menu_separator);

        if (this.$._.show_context_menu_help || aRestore) {
            const menuItem = new PopupMenu.PopupIconMenuItem(_("Help"),
                "dialog-information", St.IconType.SYMBOLIC);
            menuItem.connect("activate", () => this.__openHelpPage());
            this._applet_context_menu.addMenuItem(menuItem);
        }

        if (this.$._.show_context_menu_about || aRestore) {
            this.context_menu_item_about = new PopupMenu.PopupIconMenuItem(_("About..."),
                "dialog-question",
                St.IconType.SYMBOLIC);
            this.context_menu_item_about.connect("activate", () => this.openAbout());
            this._applet_context_menu.addMenuItem(this.context_menu_item_about);
        }

        // NOTE: Always display the configure menu.
        this.context_menu_item_configure = new PopupMenu.PopupIconMenuItem(_("Configure..."),
            "system-run",
            St.IconType.SYMBOLIC);
        this.context_menu_item_configure.connect("activate", () => this.__openXletSettings());
        this._applet_context_menu.addMenuItem(this.context_menu_item_configure);

        if (this.$._.show_context_menu_remove || aRestore) {
            this.context_menu_item_remove = new PopupMenu.PopupIconMenuItem(_("Remove '%s'")
                .format(_(this.$.metadata.name)),
                "edit-delete",
                St.IconType.SYMBOLIC);
            this.context_menu_item_remove.connect("activate", () => {
                const dialog = new ConfirmDialog({
                    dialog_name: "DesktopHandlerDialog",
                    headline: _(this.$.metadata.name),
                    description: _("Are you sure that you want to remove '%s' from your panel?")
                        .format(_(this.$.metadata.name)),
                    cancel_label: _("Cancel"),
                    ok_label: _("OK"),
                    callback: () => {
                        Main.AppletManager._removeAppletFromPanel(this.$.metadata.uuid, this.$.instance_id);
                    }
                });
                dialog.open();
            });
            this._applet_context_menu.addMenuItem(this.context_menu_item_remove);
        }
    }

    _onWindowsMenuToggled(aActor, aOpen) {
        if (aOpen) {
            this._winMenu.actor.grab_key_focus();
            this.updateWindowsMenu();
        }
    }

    showAllWindows(aTime) {
        for (const winActor of global.get_window_actors()) {
            if (winActor.meta_window.get_title() === "Desktop") {
                Tweener.addTween(winActor, {
                    opacity: 255,
                    time: aTime,
                    transition: "easeOutSine"
                });
            }

            if (this.$._.blur_effect_enabled && winActor.eff) {
                winActor.remove_effect(winActor.eff);
            }
        }

        Tweener.addTween(global.window_group, {
            opacity: 255,
            time: aTime,
            transition: "easeOutSine"
        });
        Tweener.addTween(Main.deskletContainer.actor, {
            opacity: 255,
            time: aTime,
            transition: "easeOutSine"
        });
    }

    _performDesktopPeek() {
        Tweener.addTween(global.window_group, {
            opacity: this.$._.peek_opacity,
            time: 0.275,
            transition: "easeInSine"
        });

        for (const winActor of global.get_window_actors()) {
            if (winActor.meta_window.get_title() === "Desktop") {
                if (this.$._.opacify_desktop_icons) {
                    Tweener.addTween(winActor, {
                        opacity: this.$._.peek_opacity,
                        time: 0.275,
                        transition: "easeInSine"
                    });
                } else {
                    return;
                }
            }

            if (this.$._.blur_effect_enabled) {
                if (!winActor.eff) {
                    winActor.eff = new Clutter.BlurEffect();
                }
                winActor.add_effect_with_name("blur", winActor.eff);
            }
        }

        if (this.$._.opacify_desklets) {
            Tweener.addTween(Main.deskletContainer.actor, {
                opacity: this.$._.peek_opacity,
                time: 0.275,
                transition: "easeInSine"
            });
        }
        this._did_peek = true;
    }

    _onEntered() {
        this.$.schedule_manager.clearSchedule("hover");

        if (!this.$._.hover_enabled) {
            return;
        }

        if (global.settings.get_boolean("panel-edit-mode")) {
            return;
        }

        this.$.schedule_manager.setTimeout("hover", function() {
            if (this.actor.hover && !this._applet_context_menu.isOpen) {
                if (this.$._.hover_action === "peek") {
                    this._performDesktopPeek();
                } else {
                    this.launchAction(this.$._.hover_action);
                }
            }
        }.bind(this), this.$._.hover_delay);
    }

    _onLeft() {
        if (this._did_peek) {
            this.showAllWindows(0.2);
            this._did_peek = false;
        }

        this.$.schedule_manager.clearSchedule("hover");
    }

    _setAppletStyle() {
        // If I use this.actor.style to set the applet width, it will not apply the width
        // when the applet is loaded. ¬¬
        if (this.$._.applet_width_height !== 0) {
            this.actor[this.vertical ? "set_height" : "set_width"](this.$._.applet_width_height);
        }

        this.__setAppletIcon(this.$._.applet_icon);
        this._setAppletTooltip();
    }

    _setAppletTooltip() {
        this._applet_tooltip && this._applet_tooltip.destroy();

        const tooltipData = [];

        if (this.$._.separated_scroll_action) {
            tooltipData.push([_("Scroll Up"), STRINGS_MAP[this.$._.scroll_up_action]]);
            tooltipData.push([_("Scroll Down"), STRINGS_MAP[this.$._.scroll_down_action]]);
        } else {
            tooltipData.push([_("Scroll"), STRINGS_MAP[this.$._.scroll_action]]);
        }

        const lCA = (this.$._.windows_list_menu_enabled &&
                this.$._.button_to_open_menu === "winlistmenu1") ?
            STRINGS_MAP["winmenu"] :
            STRINGS_MAP[this.$._.left_click_action];
        tooltipData.push([_("Left click"), _(lCA)]);

        const mCA = (this.$._.windows_list_menu_enabled &&
                this.$._.button_to_open_menu === "winlistmenu2") ?
            STRINGS_MAP["winmenu"] :
            STRINGS_MAP[this.$._.middle_click_action];
        tooltipData.push([_("Middle click"), _(mCA)]);

        if (this.$._.windows_list_menu_enabled &&
            this.$._.button_to_open_menu === "winlistmenu3") {
            tooltipData.push([_("Right click"), STRINGS_MAP["winmenu"]]);
        }

        this._applet_tooltip = new CustomPanelItemTooltip(this, this.$.orientation, {
            label: _(this.$.metadata.name),
            grid_data: tooltipData
        });
    }

    _onScrollActionChanged() {
        if (this.$._.scroll_action !== "none") {
            this.$._.separated_scroll_action = false;
        }

        this._setAppletTooltip();
    }

    _onScrollSettingsChanged() {
        if (this.$._.separated_scroll_action === true) {
            this.$._.scroll_action = "none";
        }

        this._setAppletTooltip();
    }

    _onButtonPressEvent(aActor, aE) {
        const button = aE.get_button();
        let open_menu = false;

        if (button === Clutter.BUTTON_PRIMARY) {
            open_menu = this.$._.windows_list_menu_enabled &&
                this.$._.button_to_open_menu === "winlistmenu1";
            this.launchAction(open_menu ?
                this.$._.button_to_open_menu :
                this.$._.left_click_action);
        } else if (button === Clutter.BUTTON_MIDDLE) {
            open_menu = this.$._.windows_list_menu_enabled &&
                this.$._.button_to_open_menu === "winlistmenu2";
            this.launchAction(open_menu ?
                this.$._.button_to_open_menu :
                this.$._.middle_click_action);
        }

        this.showAllWindows(0);

        this.$.schedule_manager.clearSchedule("hover");

        this._did_peek = false;

        return super._onButtonPressEvent.call(this, aActor, aE);
    }

    _onScroll(aActor, aE) {
        const currentTime = Date.now();
        const direction = aE.get_scroll_direction();

        if (this.$._.separated_scroll_action) {
            if (direction === Clutter.ScrollDirection.UP) {
                this.launchAction(this.$._.scroll_up_action);
            } else if (direction === Clutter.ScrollDirection.DOWN) {
                this.launchAction(this.$._.scroll_down_action);
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

            if (this.$._.scroll_action === "adjust_opacity") { // Tested OK
                const min_opacity = this.cwm_settings.get_int("min-window-opacity") * 255 / 100;
                let m = 50;
                m = global.window_group.opacity + m * scrollDirection;
                if (m < min_opacity) {
                    m = min_opacity;
                }
                if (m > 255) {
                    m = 255;
                }
                global.window_group.opacity = m;
            } else if (this.$._.scroll_action === "desktop") { // Tested OK
                if (Main.panel.bottomPosition) {
                    scrollDirection = -scrollDirection;
                }
                if (scrollDirection === 1) {
                    GLib.spawn_command_line_async("wmctrl -k on");
                } else if (scrollDirection === -1) {
                    GLib.spawn_command_line_async("wmctrl -k off");
                }
            } else {
                const limit = this._lastScroll + this.$._.scroll_delay;
                if (this.$._.prevent_fast_scroll &&
                    currentTime < limit &&
                    currentTime >= this._lastScroll) {} else if (this.$._.scroll_action === "switch_workspace") {
                    if (ExtensionSystem.runningExtensions["Flipper@connerdev"]) {
                        if (!this.Flipper) {
                            this.Flipper = ExtensionSystem.extensions["Flipper@connerdev"]["extension"];
                        }

                        const binding = {};
                        binding.get_mask = () => {
                            return 0x0;
                        };

                        if (scrollDirection === 1) {
                            binding.get_name = () => {
                                return "switch-to-workspace-left";
                            };
                        } else if (scrollDirection === -1) {
                            binding.get_name = () => {
                                return "switch-to-workspace-right";
                            };
                        }

                        const flipper = new this.Flipper.Flipper(null, null, null, binding);

                        if (flipper.is_animating) {
                            flipper.destroy_requested = true;
                        } else {
                            flipper.destroy_requested = true;
                            flipper.onDestroy();
                        }
                    } else {
                        const activeWsIndex = global.screen.get_active_workspace_index();
                        let reqWsInex = activeWsIndex - scrollDirection;
                        const last = global.screen.get_n_workspaces() - 1;
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

                        const reqWs = global.screen.get_workspace_by_index(reqWsInex);
                        reqWs.activate(global.get_current_time());
                        this.showWorkspaceOSD();
                    }
                } else if (this.$._.scroll_action === "switch-windows") {
                    let current = 0;
                    const vis_windows = [];
                    const windows = global.screen.get_active_workspace().list_windows();

                    let v = 0,
                        vLen = windows.length;
                    for (; v < vLen; v++) {
                        if (!windows[v].is_skip_taskbar()) {
                            vis_windows.push(v);
                        }
                    }
                    let n = 0;
                    const num_windows = vis_windows.length;
                    for (; n < num_windows; n++) {
                        if (windows[vis_windows[n]].has_focus()) {
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
                    Main.activateWindow(windows[vis_windows[target]],
                        global.get_current_time());
                }
            }
        }
        this._lastScroll = currentTime;
        return true;
    }

    get switcher_binding_object() {
        const self = this;
        return {
            get_switcher_style: function() {
                return this.$._.switcher_style;
            }.bind(self),
            get_name: function() {
                if (Number(this.$._.switcher_scope_modifier) & global.get_pointer()[2]) {
                    return this.$._.switcher_scope_modified;
                } else {
                    return this.$._.switcher_scope;
                }
            }.bind(self),
            get_mask: () => {
                return 0xFFFF;
            }
        };
    }

    launchAction(aAction) {
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
                const currentTime = Date.now();
                if (currentTime < this.last_show_desktop_request + this.$._.scroll_delay &&
                    currentTime > this.last_show_desktop_request) {
                    this.last_show_desktop_request = currentTime;
                    return true;
                }
                global.screen.toggle_desktop(global.get_current_time());
                this.last_show_desktop_request = currentTime;
                break;
            case "cc1":
                Util.spawnCommandLine(this.$._.custom_cmd1_action);
                break;
            case "cc2":
                Util.spawnCommandLine(this.$._.custom_cmd2_action);
                break;
            case "cc3":
                Util.spawnCommandLine(this.$._.custom_cmd3_action);
                break;
            case "cc4":
                Util.spawnCommandLine(this.$._.custom_cmd4_action);
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
                const n = global.screen.get_n_workspaces() - 1;
                reqWs = global.screen.get_workspace_by_index(n);
                break;
            case "appswitcher":
                let style = this.$._.switcher_style;
                const systemStyle = global.settings.get_string("alttab-switcher-style");

                if (style === "default") {
                    style = systemStyle;
                }

                const delay = global.settings.get_int("alttab-switcher-delay");
                let switcher = null;
                this.$.schedule_manager.clearSchedule("switcher");
                switch (style) {
                    case "coverflow":
                        if (!this._switcherIsRuning) {
                            switcher = new MyCoverflowSwitcher(this.switcher_binding_object);
                        }

                        this._switcherIsRuning = true;
                        this.$.schedule_manager.setTimeout("switcher", function() {
                            this._switcherIsRuning = false;
                        }.bind(this), delay);
                        break;
                    case "timeline":
                        if (!this._switcherIsRuning) {
                            switcher = new MyTimelineSwitcher(this.switcher_binding_object);
                        }

                        this._switcherIsRuning = true;
                        this.$.schedule_manager.setTimeout("switcher", function() {
                            this._switcherIsRuning = false;
                        }.bind(this), delay);
                        break;
                    default:
                        // NOTE: This is a total hack. But I will NOT write three hundreds lines of
                        // code to replicate an entire class!!! Who the hell designed that shite,
                        // a Gnome "developer"!?!?! FFS!!!
                        tryFn(() => {
                            global.settings.set_string("alttab-switcher-style", style);
                            switcher = new MyClassicSwitcher(this.switcher_binding_object);
                        }, null, () => {
                            global.settings.set_string("alttab-switcher-style", systemStyle);
                        });
                        break;
                }
                break;
        }

        if (reqWs) {
            reqWs.activate(global.get_current_time());
            this.showWorkspaceOSD();
        }

        return true;
    }

    showWorkspaceOSD() {
        this._hideWorkspaceOSD();
        if (global.settings.get_boolean("workspace-osd-visible")) {
            const current_workspace_index = global.screen.get_active_workspace_index();
            const monitor = Main.layoutManager.primaryMonitor;

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
            const workspace_osd_x = global.settings.get_int("workspace-osd-x");
            const workspace_osd_y = global.settings.get_int("workspace-osd-y");
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
            const [minX, maxX, minY, maxY] = [5, 95, 5, 95];
            let delta = (workspace_osd_x - minX) / (maxX - minX);
            const x = Math.round((monitor.width * workspace_osd_x / 100) -
                (this._workspace_osd.width * delta));
            delta = (workspace_osd_y - minY) / (maxY - minY);
            const y = Math.round((monitor.height * workspace_osd_y / 100) -
                (this._workspace_osd.height * delta));
            this._workspace_osd.set_position(x, y);
            const duration = global.settings.get_int("workspace-osd-duration") / 1000;
            Tweener.addTween(this._workspace_osd, {
                opacity: 255,
                time: duration,
                transition: "linear",
                onComplete: this._fadeWorkspaceOSD,
                onCompleteScope: this
            });
        }
    }

    _fadeWorkspaceOSD() {
        if (this._workspace_osd) {
            const duration = global.settings.get_int("workspace-osd-duration") / 2000;
            Tweener.addTween(this._workspace_osd, {
                opacity: 0,
                time: duration,
                transition: "easeOutExpo",
                onComplete: this._hideWorkspaceOSD,
                onCompleteScope: this
            });
        }
    }

    _hideWorkspaceOSD() {
        if (this._workspace_osd) {
            this._workspace_osd.hide();
            Main.layoutManager.removeChrome(this._workspace_osd);
            this._workspace_osd.destroy();
            this._workspace_osd = null;
        }
    }

    checkEventSource(aActor, aE) {
        const source = aE.get_source();
        const not_ours = (source !== aActor);
        return not_ours;
    }

    on_applet_removed_from_panel() {
        super.on_applet_removed_from_panel();
    }

    on_orientation_changed(aOrientation) {
        super.on_orientation_changed(aOrientation);

        this.vertical = this.$.orientation === St.Side.LEFT || this.$.orientation === St.Side.RIGHT;

        this.$.schedule_manager.idleCall("on_orientation_changed", function() {
            this._setAppletStyle();
            this.updateWindowsMenu();
        }.bind(this));
    }

    __onSettingsChanged(aPrefOldValue, aPrefKey) {
        switch (aPrefKey) {
            case "applet_width_height":
            case "applet_icon":
            case "applet_label":
                this._setAppletStyle();
                break;
            case "scroll_action":
                this._onScrollActionChanged();
                break;
            case "separated_scroll_action":
            case "scroll_up_action":
            case "scroll_down_action":
                this._onScrollSettingsChanged();
                break;
            case "left_click_action":
            case "middle_click_action":
                this._setAppletTooltip();
                break;
            case "button_to_open_menu":
                this._handleWindowList();
                this._setAppletTooltip();
                break;
            case "keep_menu_open_when_closing":
            case "keep_menu_open_when_activating":
                this.updateWindowsMenu();
                break;
            case "hover_enabled":
                this._handleHover();
                break;
        }
    }
}

function main() {
    Debugger.wrapObjectMethods({
        DesktopHandler: DesktopHandler
    });

    return new DesktopHandler(...arguments);
}
