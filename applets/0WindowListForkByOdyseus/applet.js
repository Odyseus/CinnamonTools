const AppletUUID = "{{UUID}}";

let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets[AppletUUID].utils;
}

const Applet = imports.ui.applet;
const Clutter = imports.gi.Clutter;
const DND = imports.ui.dnd;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Settings = imports.ui.settings;
const SignalManager = imports.misc.signalManager;
const St = imports.gi.St;

function WindowListForkByOdyseusApplet() {
    this._init.apply(this, arguments);
}

WindowListForkByOdyseusApplet.prototype = {
    __proto__: Applet.Applet.prototype,

    _init: function(aMetadata, aOrientation, aPanel_height, aInstance_id) {
        Applet.Applet.prototype._init.call(this, aOrientation, aPanel_height, aInstance_id);

        this.signals = new SignalManager.SignalManager(null);

        // Needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.metadata = aMetadata;
        this.instance_id = aInstance_id;

        this.actor.set_track_hover(false);
        this.actor.set_style_class_name("window-list-box");
        this.orientation = aOrientation;
        this.appletEnabled = false;

        // A layout manager is used to cater for vertical panels as well as horizontal
        let manager;
        if (this.orientation == St.Side.TOP || this.orientation == St.Side.BOTTOM) {
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

        this.dragInProgress = false;
        this._tooltipShowing = false;
        this._tooltipErodeTimer = null;
        this._menuOpen = false;
        this._urgentSignal = null;
        this._windows = [];
        this._monitorWatchList = [];

        this.settings = new Settings.AppletSettings(this, "{{UUID}}", this.instance_id);
        this._bindSettings();

        this.signals.connect(global.screen, "window-added", this._onWindowAddedAsync, this);
        this.signals.connect(global.screen, "window-monitor-changed", this._onWindowMonitorChanged, this);
        this.signals.connect(global.screen, "window-workspace-changed", this._onWindowWorkspaceChanged, this);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if ($.versionCompare($.CINNAMON_VERSION, "3.2.0") >= 0) {
            this.signals.connect(global.screen, "window-skip-taskbar-changed", this._onWindowSkipTaskbarChanged, this);
        }

        this.signals.connect(global.screen, "monitors-changed", this._updateWatchedMonitors, this);
        this.signals.connect(global.window_manager, "switch-workspace", this._refreshAllItems, this);

        this.actor.connect("style-changed", Lang.bind(this, this._updateSpacing));

        global.settings.bind("panel-edit-mode", this.actor, "reactive", Gio.SettingsBindFlags.DEFAULT);

        this.on_orientation_changed(aOrientation);
        this._updateAttentionGrabber();
    },

    _bindSettings: function() {
        // Needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        let bD = {
            IN: 1,
            OUT: 2,
            BIDIRECTIONAL: 3
        };
        let settingsArray = [
            [bD.IN, "pref_show_all_workspaces", null],
            [bD.IN, "pref_enable_alerts", this._updateAttentionGrabber],
            [bD.IN, "pref_enable_scrolling", this._onEnableScrollChanged],
            [bD.IN, "pref_reverse_scrolling", null],
            [bD.IN, "pref_middle_click_close", null],
            [bD.IN, "pref_buttons_use_entire_space", this._refreshAllItems],
            [bD.IN, "pref_window_preview", this._onPreviewChanged],
            [bD.IN, "pref_window_preview_show_label", this._onPreviewChanged],
            [bD.IN, "pref_window_preview_scale", this._onPreviewChanged],
            [bD.IN, "pref_hide_tooltips", this._onPreviewChanged],
            [bD.IN, "pref_hide_labels", this._onLabelsHidden],
            [bD.IN, "pref_invert_menu_items_order", null],
            [bD.IN, "pref_sub_menu_placement", null]
        ];

        let newBinding = typeof this.settings.bind === "function";
        for (let [binding, property_name, callback] of settingsArray) {
            // Condition needed for retro-compatibility.
            // Mark for deletion on EOL. Cinnamon 3.2.x+
            if (newBinding) {
                this.settings.bind(property_name, property_name, callback);
            } else {
                this.settings.bindProperty(binding, property_name, property_name, callback, null);
            }
        }
    },

    _onLabelsHidden: function() {
        this.on_orientation_changed(this.orientation);
    },

    on_applet_added_to_panel: function(userEnabled) { // jshint ignore:line
        this._updateSpacing();
        this.appletEnabled = true;
    },

    on_applet_removed_from_panel: function() {
        this.signals.disconnectAllSignals();
    },

    on_applet_instances_changed: function() {
        this._updateWatchedMonitors();
    },

    on_panel_height_changed: function() {
        this._refreshAllItems();
    },

    on_orientation_changed: function(aOrientation) {
        let orientation = aOrientation || this.orientation;

        this.orientation = orientation;

        for (let window of this._windows) {
            window.updateLabelVisible();
        }

        if (orientation == St.Side.TOP || orientation == St.Side.BOTTOM) {
            this.manager.set_vertical(false);
            this._reTitleItems();
            this.actor.remove_style_class_name("vertical");
        } else {
            this.manager.set_vertical(true);
            this.actor.add_style_class_name("vertical");
            this.actor.set_x_align(Clutter.ActorAlign.CENTER);
            this.actor.set_important(true);
        }

        // Any padding/margin is removed on one isInterestingside so that the AppMenuButton
        // boxes butt up against the edge of the screen
        let btnStyle = "margin-left: 0px; margin-right: 0px; padding-left: 0px; padding-right: 0px;";

        if (orientation == St.Side.TOP) {
            btnStyle = "margin-top: 0px; " +
                this.pref_hide_labels ? "padding: 0;" : "padding-top: 0px;";
            for (let child of this.manager_container.get_children()) {
                child.set_style_class_name("window-list-item-box top");
                child.set_style(btnStyle);
            }
            this.actor.set_style(btnStyle);
        } else if (orientation == St.Side.BOTTOM) {
            btnStyle = "margin-bottom: 0px; " +
                this.pref_hide_labels ? "padding: 0;" : "padding-bottom: 0px;";
            for (let child of this.manager_container.get_children()) {
                child.set_style_class_name("window-list-item-box bottom");
                child.set_style(btnStyle);
            }
            this.actor.set_style(btnStyle);
        } else if (orientation == St.Side.LEFT) {
            for (let child of this.manager_container.get_children()) {
                child.set_style_class_name("window-list-item-box left");
                child.set_style(btnStyle);
                child.set_x_align(Clutter.ActorAlign.CENTER);
            }
            this.actor.set_style(btnStyle);
        } else if (orientation == St.Side.RIGHT) {
            for (let child of this.manager_container.get_children()) {
                child.set_style_class_name("window-list-item-box right");
                child.set_style(btnStyle);
                child.set_x_align(Clutter.ActorAlign.CENTER);
            }
            this.actor.set_style(btnStyle);
        }

        if (this.appletEnabled) {
            this._updateSpacing();
        }
    },

    _updateSpacing: function() {
        let themeNode = this.actor.get_theme_node();
        let spacing = themeNode.get_length("spacing");
        this.manager.set_spacing(spacing * global.ui_scale);
    },

    _onWindowAddedAsync: function(screen, metaWindow, monitor) {
        Mainloop.timeout_add(20, Lang.bind(this, this._onWindowAdded, screen, metaWindow, monitor));
    },

    _onWindowAdded: function(screen, metaWindow, monitor) { // jshint ignore:line
        if (this._shouldAdd(metaWindow)) {
            this._addWindow(metaWindow, false);
        }
    },

    _onWindowMonitorChanged: function(screen, metaWindow, monitor) { // jshint ignore:line
        if (this._shouldAdd(metaWindow)) {
            this._addWindow(metaWindow, false);
        } else {
            this._removeWindow(metaWindow);
        }
    },

    _onWindowWorkspaceChanged: function(screen, metaWindow, metaWorkspace) { // jshint ignore:line
        let window = this._windows.find(win => (win.metaWindow == metaWindow));

        if (window) {
            this._refreshItem(window);
        }
    },

    _onWindowSkipTaskbarChanged: function(screen, metaWindow) {
        let window = this._windows.find(win => (win.metaWindow == metaWindow));

        if (window && !Main.isInteresting(metaWindow)) {
            this._removeWindow(metaWindow);
            return;
        }

        this._onWindowAdded(screen, metaWindow, 0);
    },

    _updateAttentionGrabber: function() {
        if (this.pref_enable_alerts) {
            this.signals.connect(global.display, "window-marked-urgent", this._onWindowDemandsAttention, this);
            this.signals.connect(global.display, "window-demands-attention", this._onWindowDemandsAttention, this);
        } else {
            this.signals.disconnect("window-marked-urgent");
            this.signals.disconnect("window-demands-attention");
        }
    },

    _onEnableScrollChanged: function() {
        for (let window of this._windows)
            window.onScrollModeChanged();
    },

    _onPreviewChanged: function() {
        for (let window of this._windows)
            window.onPreviewChanged();
    },

    _onWindowDemandsAttention: function(display, window) {
        // Magic to look for AppMenuButton owning window
        let i = this._windows.length;
        while (i-- && this._windows[i].metaWindow != window) {

        }

        // Window is not in our list
        if (i == -1) {
            return;
        }

        // Asks AppMenuButton to flash. Returns false if already flashing
        if (!this._windows[i].getAttention()) {
            return;
        }

        if (window.get_workspace() != global.screen.get_active_workspace()) {
            this._addWindow(window, true);
        }
    },

    _refreshItem: function(window) {
        window.actor.visible = (window.metaWindow.get_workspace() == global.screen.get_active_workspace()) ||
            window.metaWindow.is_on_all_workspaces() ||
            this.pref_show_all_workspaces;

        /* The above calculates the visibility if it were the normal
         * AppMenuButton. If this is actually a temporary AppMenuButton for
         * urgent windows on other workspaces, it is shown iff the normal
         * one isn't shown! */
        if (window.alert) {
            window.actor.visible = !window.actor.visible;
        }
    },

    _refreshAllItems: function() {
        for (let window of this._windows) {
            this._refreshItem(window);
        }
    },

    _reTitleItems: function() {
        for (let window of this._windows) {
            window.setDisplayTitle();
        }
    },

    _updateWatchedMonitors: function() {
        let n_mons = Gdk.Screen.get_default().get_n_monitors();
        let on_primary = this.panel.monitorIndex == Main.layoutManager.primaryIndex;
        let instances = Main.AppletManager.getRunningInstancesForUuid(this._uuid);

        /* Simple cases */
        if (n_mons == 1) {
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

            instances = instances.map(function(x) {
                return x.panel.monitorIndex;
            });

            for (let i = 0; i < n_mons; i++) {
                if (instances.indexOf(i) == -1) {
                    this._monitorWatchList.push(i);
                }
            }
        }

        // Now track the windows in our favorite monitors
        let windows = global.display.list_windows(0);
        if (this.pref_show_all_workspaces) {
            for (let wks = 0; wks < global.screen.n_workspaces; wks++) {
                let metaWorkspace = global.screen.get_workspace_by_index(wks);
                let wks_windows = metaWorkspace.list_windows();
                for (let wks_window of wks_windows) {
                    windows.push(wks_window);
                }
            }
        }

        for (let window of windows) {
            if (this._shouldAdd(window)) {
                this._addWindow(window, false);
            } else {
                this._removeWindow(window);
            }
        }
    },

    _addWindow: function(metaWindow, alert) {
        for (let window of this._windows)
            if (window.metaWindow == metaWindow &&
                window.alert == alert) {
                return;
            }

        let appButton = new $.AppMenuButton(this, metaWindow, alert);
        this.manager_container.add_actor(appButton.actor);

        this._windows.push(appButton);

        /* We want to make the AppMenuButtons look like they are ordered by
         * workspace. So if we add an AppMenuButton for a window in another
         * workspace, put it in the right position. It is at the end by
         * default, so move it to the start if needed */
        if (alert) {
            if (metaWindow.get_workspace().index() < global.screen.get_active_workspace_index()) {
                this.manager_container.set_child_at_index(appButton.actor, 0);
            }
        } else {
            if (metaWindow.get_workspace() != global.screen.get_active_workspace()) {
                if (!(this.pref_show_all_workspaces)) {
                    appButton.actor.hide();
                }
            }
        }
    },

    _removeWindow: function(metaWindow) {
        let i = this._windows.length;
        // Do an inverse loop because we might remove some elements
        while (i--) {
            if (this._windows[i].metaWindow == metaWindow) {
                this._windows[i].destroy();
                this._windows.splice(i, 1);
            }
        }
    },

    _shouldAdd: function(metaWindow) {
        return Main.isInteresting(metaWindow) &&
            this._monitorWatchList.indexOf(metaWindow.get_monitor()) != -1;
    },

    handleDragOver: function(source, actor, x, y, time) { // jshint ignore:line
        if (this._inEditMode) {
            return DND.DragMotionResult.MOVE_DROP;
        }
        if (!(source instanceof $.AppMenuButton)) {
            return DND.DragMotionResult.NO_DROP;
        }

        let children = this.manager_container.get_children();
        let isVertical = this.manager_container.height > this.manager_container.width;

        this._dragPlaceholderPos = -1;
        for (let i = children.length - 1; i >= 0; i--) {
            if (!children[i].visible) {
                continue;
            }

            if (isVertical) {
                if (y > children[i].get_allocation_box().y1) {
                    this._dragPlaceholderPos = i;
                    break;
                }
            } else if (x > children[i].get_allocation_box().x1) {
                this._dragPlaceholderPos = i;
                break;
            }
        }

        source.actor.hide();
        if (this._dragPlaceholder == undefined) {
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
    },

    acceptDrop: function(source, actor, x, y, time) { // jshint ignore:line
        if (!(source instanceof $.AppMenuButton)) {
            return false;
        }
        if (this._dragPlaceholderPos == undefined) {
            return false;
        }

        this.manager_container.set_child_at_index(source.actor, this._dragPlaceholderPos);

        return true;
    },

    clearDragPlaceholder: function() {
        if (this._dragPlaceholder) {
            this._dragPlaceholder.actor.destroy();
            this._dragPlaceholder = undefined;
            this._dragPlaceholderPos = undefined;
        }
    },

    erodeTooltip: function() {
        if (this._tooltipErodeTimer) {
            Mainloop.source_remove(this._tooltipErodeTimer);
            this._tooltipErodeTimer = null;
        }

        this._tooltipErodeTimer = Mainloop.timeout_add(300, Lang.bind(this, function() {
            this._tooltipShowing = false;
            this._tooltipErodeTimer = null;
            return false;
        }));
    },

    cancelErodeTooltip: function() {
        if (this._tooltipErodeTimer) {
            Mainloop.source_remove(this._tooltipErodeTimer);
            this._tooltipErodeTimer = null;
        }
    }
};

function main(aMetadata, aOrientation, aPanel_height, aInstance_id) {
    return new WindowListForkByOdyseusApplet(aMetadata, aOrientation, aPanel_height, aInstance_id);
}
