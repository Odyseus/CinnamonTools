const {
    gi: {
        Cinnamon,
        Clutter,
        Gdk,
        Gio,
        St
    },
    ui: {
        applet: Applet,
        dnd: DND,
        main: Main
    }
} = imports;

const {
    APPLET_PREFS
} = require("js_modules/constants.js");

const {
    AppMenuButton,
    Debugger
} = require("js_modules/utils.js");

const {
    getBaseAppletClass
} = require("js_modules/appletsUtils.js");

class WindowList extends getBaseAppletClass(Applet.Applet) {
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
            this.actor.set_track_hover(false);
            this.actor.set_style_class_name("window-list-box");

            this.icon_size = this.getPanelIconSize(St.IconType.FULLCOLOR) +
                parseInt(this.$._.app_button_auto_size_offset, 10);
            this.appletEnabled = false;

            // A layout manager is used to cater for vertical panels as well as horizontal
            let manager;
            if (aOrientation === St.Side.TOP || aOrientation === St.Side.BOTTOM) {
                manager = new Clutter.BoxLayout({
                    orientation: Clutter.Orientation.HORIZONTAL
                });
            } else {
                manager = new Clutter.BoxLayout({
                    orientation: Clutter.Orientation.VERTICAL
                });
                this.actor.add_style_class_name("vertical");
            }

            this.manager = manager;
            this.manager_container = new Clutter.Actor({
                layout_manager: manager
            });
            this.actor.add_actor(this.manager_container);

            this._removed = false;
            this.dragInProgress = false;
            this._tooltipShowing = false;
            this._menuOpen = false;
            this._urgentSignal = null;
            this.refreshing = false;
            this._windows = [];
            this._monitorWatchList = [];

            this.$.signal_manager.connect(global.screen, "window-added", function(s, w, m) {
                this._onWindowAddedAsync(s, w, m);
            }.bind(this));
            this.$.signal_manager.connect(global.screen, "window-monitor-changed", function(s, w, m) {
                this._onWindowMonitorChanged(s, w, m);
            }.bind(this));
            this.$.signal_manager.connect(global.screen, "window-workspace-changed", function(s, w, ws) {
                this._onWindowWorkspaceChanged(s, w, ws);
            }.bind(this));
            this.$.signal_manager.connect(global.screen, "window-skip-taskbar-changed", function(s, w) {
                this._onWindowSkipTaskbarChanged(s, w);
            }.bind(this));
            this.$.signal_manager.connect(global.screen, "monitors-changed", function() {
                this._updateWatchedMonitors();
            }.bind(this));
            this.$.signal_manager.connect(global.window_manager, "switch-workspace", function() {
                this._refreshAllItems();
            }.bind(this));
            this.$.signal_manager.connect(Cinnamon.WindowTracker.get_default(), "window-app-changed", function(t, m) {
                this._onWindowAppChanged(t, m);
            }.bind(this));
            this.$.signal_manager.connect(this.actor, "style-changed", function() {
                this._updateSpacing();
            }.bind(this));

            global.settings.bind("panel-edit-mode", this.actor, "reactive", Gio.SettingsBindFlags.DEFAULT);
            this.on_orientation_changed(aOrientation);
        }, () => {
            this._updateAttentionGrabber();
        });
    }

    on_applet_added_to_panel(userEnabled) { // jshint ignore:line
        this._updateSpacing();
        this.appletEnabled = true;
    }

    on_applet_removed_from_panel() {
        super.on_applet_removed_from_panel();
        this._removed = true;
    }

    on_applet_instances_changed() {
        this._updateWatchedMonitors();
    }

    on_panel_height_changed() {
        this.icon_size = this.getPanelIconSize(St.IconType.FULLCOLOR) +
            parseInt(this.$._.app_button_auto_size_offset, 10);
        this._refreshAllItems();
    }

    on_panel_icon_size_changed(size) {
        this.icon_size = size +
            parseInt(this.$._.app_button_auto_size_offset, 10);
        this._refreshAllItems();
    }

    on_orientation_changed(orientation) {
        super.on_orientation_changed(orientation);

        for (const window of this._windows) {
            window.updateLabelVisible();
        }

        if (orientation === St.Side.TOP || orientation === St.Side.BOTTOM) {
            this.manager.set_vertical(false);
            this._reTitleItems();
            // NOTE: I added this alignment because when the labels are hidden the icons lose the
            // the elements that displayed them aligned (the labels). I did the same for every child,
            // although it might not be needed.
            this.actor.set_y_align(Clutter.ActorAlign.CENTER);
            this.actor.remove_style_class_name("vertical");
        } else {
            this.manager.set_vertical(true);
            this.actor.add_style_class_name("vertical");
            this.actor.set_x_align(Clutter.ActorAlign.CENTER);
            this.actor.set_important(true);
        }

        // Any padding/margin is removed on one side so that the AppMenuButton
        // boxes butt up against the edge of the screen.
        let btnStyle = "margin-left: 0; margin-right: 0; padding-left: 0; padding-right: 0;";
        const customPadding = parseInt(this.$._.app_button_custom_padding, 10);
        const customStyleH = customPadding !== -1 ?
            `padding-left: ${customPadding}px; padding-right: ${customPadding}px;` :
            "";
        const customStyleV = customPadding !== -1 ?
            `padding-top: ${customPadding}px; padding-bottom: ${customPadding}px;` :
            "";

        // NOTE: The purpose of this delay is that setting the actor style in real time will not
        // actually apply it.
        this.$.schedule_manager.idleCall("on_orientation_changed", function() {
            switch (orientation) {
                case St.Side.TOP:
                    btnStyle = "margin-top: 0; padding-top: 0;";
                    for (const child of this.manager_container.get_children()) {
                        child.set_style_class_name("window-list-item-box top");
                        child.set_style(btnStyle + customStyleH);
                        child.set_y_align(Clutter.ActorAlign.CENTER);
                    }
                    break;
                case St.Side.BOTTOM:
                    btnStyle = "margin-bottom: 0; padding-bottom: 0;";
                    for (const child of this.manager_container.get_children()) {
                        child.set_style_class_name("window-list-item-box bottom");
                        child.set_style(btnStyle + customStyleH);
                        child.set_y_align(Clutter.ActorAlign.CENTER);
                    }
                    break;
                case St.Side.LEFT:
                    for (const child of this.manager_container.get_children()) {
                        child.set_style_class_name("window-list-item-box left");
                        child.set_style(btnStyle + customStyleV);
                        child.set_x_align(Clutter.ActorAlign.CENTER);
                    }
                    break;
                case St.Side.RIGHT:
                    for (const child of this.manager_container.get_children()) {
                        child.set_style_class_name("window-list-item-box right");
                        child.set_style(btnStyle + customStyleV);
                        child.set_x_align(Clutter.ActorAlign.CENTER);
                    }
                    break;
            }

            this.actor.set_style(btnStyle);

            if (this.appletEnabled) {
                this._updateSpacing();
            }

            this._updateAllIconGeometry();
        }.bind(this));
    }

    _updateSpacing() {
        const themeNode = this.actor.get_theme_node();
        const spacing = themeNode.get_length("spacing");
        this.manager.set_spacing(spacing * global.ui_scale);
    }

    _onWindowAddedAsync(screen, metaWindow, monitor) {
        this.$.schedule_manager.setTimeout("on_window_added", function() {
            this._onWindowAdded(screen, metaWindow, monitor);
        }.bind(this), 20);
    }

    _onWindowAdded(screen, metaWindow, monitor) { // jshint ignore:line
        if (this._shouldAdd(metaWindow)) {
            this._addWindow(metaWindow, false);
        }
    }

    _onWindowMonitorChanged(screen, metaWindow, monitor) { // jshint ignore:line
        if (this._shouldAdd(metaWindow)) {
            this._addWindow(metaWindow, false);
        } else {
            this._removeWindow(metaWindow);
        }
    }

    _refreshItemByMetaWindow(metaWindow) {
        const window = this._windows.find(win => (win.metaWindow === metaWindow));

        if (window) {
            this._refreshItem(window);
        }
    }

    _onWindowWorkspaceChanged(screen, metaWindow, metaWorkspace) { // jshint ignore:line
        this._refreshItemByMetaWindow(metaWindow);
    }

    _onWindowAppChanged(tracker, metaWindow) {
        this._refreshItemByMetaWindow(metaWindow);
    }

    _onWindowSkipTaskbarChanged(screen, metaWindow) {
        if (metaWindow && metaWindow.is_skip_taskbar()) {
            this._removeWindow(metaWindow);
            return;
        }

        this._onWindowAdded(screen, metaWindow, 0);
    }

    _updateAttentionGrabber() {
        if (this.$._.enable_alerts) {
            this.$.signal_manager.connect(global.display, "window-marked-urgent",
                function(d, w) {
                    this._onWindowDemandsAttention(d, w);
                }.bind(this)
            );
            this.$.signal_manager.connect(global.display, "window-demands-attention",
                function(d, w) {
                    this._onWindowDemandsAttention(d, w);
                }.bind(this)
            );
        } else {
            this.$.signal_manager.disconnect("window-marked-urgent");
            this.$.signal_manager.disconnect("window-demands-attention");
        }
    }

    _onEnableScrollChanged() {
        for (const window of this._windows) {
            window.onScrollModeChanged();
        }
    }

    _onPreviewChanged() {
        for (const window of this._windows) {
            window.onPreviewChanged();
        }
    }

    _onWindowDemandsAttention(display, window) {
        // Magic to look for AppMenuButton owning window
        let i = this._windows.length;
        while (i-- && this._windows[i].metaWindow !== window) {

        }

        // Window is not in our list
        if (i === -1) {
            return;
        }

        // Asks AppMenuButton to flash. Returns false if already flashing
        if (!this._windows[i].getAttention()) {
            return;
        }

        if (window.get_workspace() !== global.screen.get_active_workspace()) {
            this._addWindow(window, true);
        }
    }

    _refreshItem(window) {
        window.actor.visible = (window.metaWindow.get_workspace() === global.screen.get_active_workspace()) ||
            window.metaWindow.is_on_all_workspaces() ||
            this.$._.show_all_workspaces;

        /* The above calculates the visibility if it were the normal
         * AppMenuButton. If this is actually a temporary AppMenuButton for
         * urgent windows on other workspaces, it is shown iff the normal
         * one isn't shown! */
        if (window.transient) {
            window.actor.visible = !window.actor.visible;
        }

        if (window.actor.visible) {
            window.setIcon();
        }

        window.updateIconGeometry();
    }

    _refreshAllItems() {
        for (const window of this._windows) {
            this._refreshItem(window);
        }
    }

    _reTitleItems() {
        for (const window of this._windows) {
            window.setDisplayTitle();
        }
    }

    _updateWatchedMonitors() {
        const n_mons = Gdk.Screen.get_default().get_n_monitors();
        const on_primary = this.panel.monitorIndex === Main.layoutManager.primaryIndex;
        let instances = Main.AppletManager.getRunningInstancesForUuid(this._uuid);

        /* Simple cases */
        if (n_mons === 1) {
            this._monitorWatchList = [Main.layoutManager.primaryIndex];
        } else if (instances.length > 1 && !on_primary) {
            this._monitorWatchList = [this.panel.monitorIndex];
        } else {
            /* This is an instance on the primary monitor - it will be
             * responsible for any monitors not covered individually.  First
             * convert the instances list into a list of the monitor indices,
             * and then add the monitors not present to the monitor watch list
             * */
            this._monitorWatchList = [this.panel.monitorIndex];

            instances = instances.map((x) => {
                return x.panel.monitorIndex;
            });

            for (let i = 0; i < n_mons; i++) {
                if (instances.indexOf(i) === -1) {
                    this._monitorWatchList.push(i);
                }
            }
        }

        // Now track the windows in our favorite monitors
        const windows = global.display.list_windows(0);
        if (this.$._.show_all_workspaces) {
            for (let wks = 0; wks < global.screen.n_workspaces; wks++) {
                const metaWorkspace = global.screen.get_workspace_by_index(wks);
                const wks_windows = metaWorkspace.list_windows();
                for (const wks_window of wks_windows) {
                    windows.push(wks_window);
                }
            }
        }

        this.refreshing = true;

        for (const window of windows) {
            if (this._shouldAdd(window)) {
                this._addWindow(window, false);
            } else {
                this._removeWindow(window);
            }
        }

        this.refreshing = false;

        // NOTE: The _removed property is used because the following two function calls will
        // attempt to save an applet setting that no longer exist and handle the geometry of
        // icons on an applet that no longer is placed in a panel. ¬¬
        if (!this._removed) {
            this._applySavedOrder();
            this._updateAllIconGeometry();
        }
    }

    _addWindow(metaWindow, transient) {
        for (const window of this._windows) {
            if (window.metaWindow === metaWindow &&
                window.transient === transient) {
                return;
            }
        }

        const appButton = new AppMenuButton(this, metaWindow, transient);
        this.manager_container.add_actor(appButton.actor);

        this._windows.push(appButton);

        /* We want to make the AppMenuButtons look like they are ordered by
         * workspace. So if we add an AppMenuButton for a window in another
         * workspace, put it in the right position. It is at the end by
         * default, so move it to the start if needed */
        if (transient) {
            if (metaWindow.get_workspace().index() < global.screen.get_active_workspace_index()) {
                this.manager_container.set_child_at_index(appButton.actor, 0);
            }
        } else {
            if (metaWindow.get_workspace() !== global.screen.get_active_workspace()) {
                if (!(this.$._.show_all_workspaces)) {
                    appButton.actor.hide();
                }
            }
        }

        this._saveOrder();
        this._updateAllIconGeometry();
    }

    _removeWindow(metaWindow) {
        let i = this._windows.length;
        // Do an inverse loop because we might remove some elements
        while (i--) {
            if (this._windows[i].metaWindow === metaWindow) {
                this._windows[i].destroy();
                this._windows.splice(i, 1);
            }
        }

        this._saveOrder();
        this._updateAllIconGeometry();
    }

    _shouldAdd(metaWindow) {
        return Main.isInteresting(metaWindow) &&
            !metaWindow.is_skip_taskbar() &&
            this._monitorWatchList.indexOf(metaWindow.get_monitor()) !== -1;
    }

    // Store by Windows (XIDs), a simple list
    // xid::xid::xid::xid::xid
    _applySavedOrder() {
        let order = this.$._.last_window_order.split("::");

        let i = order.length;
        while (i--) {
            const xid = parseInt(order[i], 10);

            if (isNaN(xid)) {
                continue;
            }

            const found = this._findWin(xid);

            if (found) {
                this.manager_container.set_child_at_index(found.actor, 0);
            }
        }

        this._saveOrder();
    }

    _findWin(aXID) {
        return this._windows.find((aWin) => (aWin.xid === aXID));
    }

    _saveOrder() {
        if (this.refreshing) {
            return;
        }

        let new_order = [];
        let actors = this.manager_container.get_children();

        for (let i = 0; i < actors.length; i++) {
            new_order.push(actors[i]._delegate.xid);
        }

        if (new_order.length === 0) {
            this.lastWindowOrder = "";
            return;
        }

        this.lastWindowOrder = new_order.join("::");
    }

    _updateAllIconGeometry() {
        for (let window of this._windows) {
            window.updateIconGeometry();
        }
    }

    handleDragOver(source, actor, x, y, time) { // jshint ignore:line
        if (global.settings.get_boolean("panel-edit-mode")) {
            return DND.DragMotionResult.MOVE_DROP;
        }

        if (!(source instanceof AppMenuButton)) {
            return DND.DragMotionResult.NO_DROP;
        }

        const children = this.manager_container.get_children();
        const isVertical = this.$.orientation === St.Side.LEFT || this.$.orientation === St.Side.RIGHT;
        let axis = isVertical ? [y, "y1"] : [x, "x1"];

        this._dragPlaceholderPos = -1;
        let minDist = -1;
        for (let i = 0; i < children.length; i++) {
            if (!children[i].visible) {
                continue;
            }

            const dim = isVertical ? children[i].height : children[i].width;
            const dist = Math.abs(axis[0] - (children[i].get_allocation_box()[axis[1]] + dim / 2));

            if (dist < minDist || minDist === -1) {
                minDist = dist;
                this._dragPlaceholderPos = i;
            }
        }

        source.actor.hide();
        if (this._dragPlaceholder === undefined) {
            this._dragPlaceholder = new DND.GenericDragPlaceholderItem();
            this._dragPlaceholder.child.set_width(source.actor.width);
            this._dragPlaceholder.child.set_height(source.actor.height);

            this.manager_container.insert_child_at_index(this._dragPlaceholder.actor,
                this._dragPlaceholderPos);
        } else {
            this.manager_container.set_child_at_index(this._dragPlaceholder.actor,
                this._dragPlaceholderPos);
        }

        return DND.DragMotionResult.MOVE_DROP;
    }

    acceptDrop(source, actor, x, y, time) { // jshint ignore:line
        if (!(source instanceof AppMenuButton)) {
            return Clutter.EVENT_PROPAGATE;
        }
        if (this._dragPlaceholderPos === undefined) {
            return Clutter.EVENT_PROPAGATE;
        }

        this.manager_container.set_child_at_index(source.actor, this._dragPlaceholderPos);

        this._saveOrder();
        this._updateAllIconGeometry();

        return Clutter.EVENT_STOP;
    }

    clearDragPlaceholder() {
        if (this._dragPlaceholder) {
            this._dragPlaceholder.actor.destroy();
            this._dragPlaceholder = undefined;
            this._dragPlaceholderPos = undefined;
        }
    }

    erodeTooltip() {
        this.cancelErodeTooltip();

        this.$.schedule_manager.setTimeout("tooltip_erode", function() {
            this._tooltipShowing = false;
        }.bind(this), 300);
    }

    cancelErodeTooltip() {
        this.$.schedule_manager.clearSchedule("tooltip_erode");
    }

    __onSettingsChanged(aPrefOldValue, aPrefKey) {
        switch (aPrefKey) {
            case "enable_alerts":
                this._updateAttentionGrabber();
                break;
            case "enable_scrolling":
                this._onEnableScrollChanged();
                break;
            case "buttons_use_entire_space":
                this._refreshAllItems();
                break;
            case "window_preview":
            case "window_preview_show_label":
            case "window_preview_scale":
            case "hide_tooltips":
                this._onPreviewChanged();
                break;
            case "app_button_auto_size_offset":
            case "show_labels":
                this.$.schedule_manager.setTimeout("refresh", function() {
                    this.on_orientation_changed(this.$.orientation);
                    this.on_applet_added_to_panel();
                    // NOTE: This also triggers _refreshAllItems.
                    this.on_panel_height_changed();
                }.bind(this), 300);
                break;
            case "logging_level":
            case "debugger_enabled":
                Debugger.logging_level = this.$._.logging_level;
                Debugger.debugger_enabled = this.$._.debugger_enabled;
                break;
        }
    }
}

function main() {
    Debugger.wrapObjectMethods({
        WindowList: WindowList
    });

    return new WindowList(...arguments);
}
