const {
    gi: {
        GLib,
        Gio,
        Meta,
        Cinnamon
    },
    mainloop: Mainloop,
    ui: {
        main: Main
    }
} = imports;

const LAST_WINDOW_GRACE_TIME = 1000;

function WorkspaceTracker() {
    this._init.apply(this, arguments);
}

WorkspaceTracker.prototype = {
    _init: function(aWm) {
        this._wm = aWm;

        this._workspaces = [];
        this._checkWorkspacesId = 0;

        this._pauseWorkspaceCheck = false;

        let tracker = Cinnamon.WindowTracker.get_default();
        tracker.connect("startup-sequence-changed",
            () => this._queueCheckWorkspaces());

        global.screen.connect("notify::n-workspaces",
            () => this._nWorkspacesChanged());
        global.window_manager.connect("switch-workspace",
            () => this._queueCheckWorkspaces());

        global.screen.connect("window-entered-monitor",
            (metaScreen, monitorIndex, metaWin) => {
                this._windowEnteredMonitor(metaScreen, monitorIndex, metaWin);
            }
        );
        global.screen.connect("window-left-monitor",
            (metaScreen, monitorIndex, metaWin) => {
                this._windowLeftMonitor(metaScreen, monitorIndex, metaWin);
            }
        );
        global.screen.connect("restacked", () => this._windowsRestacked());

        this._workspaceSettings = this._getWorkspaceSettings();
        this._workspaceSettings.connect("changed::dynamic-workspaces",
            () => this._queueCheckWorkspaces());

        this._nWorkspacesChanged();
    },

    _getWorkspaceSettings: function() {
        return new Gio.Settings({
            schema_id: "org.cinnamon.muffin"
        });
    },

    blockUpdates: function() {
        this._pauseWorkspaceCheck = true;
    },

    unblockUpdates: function() {
        this._pauseWorkspaceCheck = false;
    },

    _checkWorkspaces: function() {
        if (!Meta.prefs_get_dynamic_workspaces()) {
            this._checkWorkspacesId = 0;
            return false;
        }

        let emptyWorkspaces = new Array(this._workspaces.length);

        let a = 0,
            aLen = this._workspaces.length;
        for (; a < aLen; a++) {
            let lastRemoved = this._workspaces[a]._lastRemovedWindow;
            if ((lastRemoved &&
                    (lastRemoved.get_window_type() === Meta.WindowType.SPLASHSCREEN ||
                        lastRemoved.get_window_type() === Meta.WindowType.DIALOG ||
                        lastRemoved.get_window_type() === Meta.WindowType.MODAL_DIALOG)) ||
                this._workspaces[a]._keepAliveId) {
                emptyWorkspaces[a] = false;
            } else {
                emptyWorkspaces[a] = true;
            }
        }

        let sequences = Cinnamon.WindowTracker.get_default().get_startup_sequences();
        let b = 0,
            bLen = sequences.length;
        for (; b < bLen; b++) {
            let index = sequences[b].get_workspace();
            if (index >= 0 && index <= global.screen.n_workspaces) {
                emptyWorkspaces[index] = false;
            }
        }

        let windows = global.get_window_actors();
        let c = 0,
            cLen = windows.length;
        for (; c < cLen; c++) {
            let winActor = windows[c];
            let win = winActor.meta_window;
            if (win.is_on_all_workspaces()) {
                continue;
            }

            let workspaceIndex = win.get_workspace().index();
            emptyWorkspaces[workspaceIndex] = false;
        }

        // If we don't have an empty workspace at the end, add one
        if (!emptyWorkspaces[emptyWorkspaces.length - 1]) {
            global.screen.append_new_workspace(false, global.get_current_time());
            emptyWorkspaces.push(false);
        }

        let activeWorkspaceIndex = global.screen.get_active_workspace_index();
        let removingCurrentWorkspace = (emptyWorkspaces[activeWorkspaceIndex] &&
            activeWorkspaceIndex < emptyWorkspaces.length - 1);

        emptyWorkspaces[activeWorkspaceIndex] = false;

        if (removingCurrentWorkspace) {
            // "Merge" the empty workspace we are removing with the one at the end
            this.wm.blockAnimations();
        }

        // Delete other empty workspaces; do it from the end to avoid index changes
        let i;
        for (i = emptyWorkspaces.length - 2; i >= 0; i--) {
            if (emptyWorkspaces[i]) {
                global.screen.remove_workspace(this._workspaces[i], global.get_current_time());
            } else {
                break;
            }
        }

        if (removingCurrentWorkspace) {
            global.screen.get_workspace_by_index(global.screen.n_workspaces - 1).activate(global.get_current_time());
            this.wm.unblockAnimations();
        }

        this._checkWorkspacesId = 0;
        return false;
    },

    keepWorkspaceAlive: function(aWorkspace, aDuration) {
        if (aWorkspace._keepAliveId) {
            Mainloop.source_remove(aWorkspace._keepAliveId);
        }

        aWorkspace._keepAliveId = Mainloop.timeout_add(aDuration, () => {
            aWorkspace._keepAliveId = 0;
            this._queueCheckWorkspaces();
            return GLib.SOURCE_REMOVE;
        });
        GLib.Source.set_name_by_id(aWorkspace._keepAliveId, "[Cinnamon Tweaks] this._queueCheckWorkspaces");
    },

    _windowRemoved: function(aWorkspace, aWindow) {
        aWorkspace._lastRemovedWindow = aWindow;
        this._queueCheckWorkspaces();
        let id = Mainloop.timeout_add(LAST_WINDOW_GRACE_TIME, () => {
            if (aWorkspace._lastRemovedWindow === aWindow) {
                aWorkspace._lastRemovedWindow = null;
                this._queueCheckWorkspaces();
            }
            return GLib.SOURCE_REMOVE;
        });
        GLib.Source.set_name_by_id(id, "[Cinnamon Tweaks] this._queueCheckWorkspaces");
    },

    _windowLeftMonitor: function(aMetaScreen, aMonitorIndex, aMetaWin) { // jshint ignore:line
        // If the window left the primary monitor, that
        // might make that workspace empty
        if (aMonitorIndex === Main.layoutManager.primaryIndex) {
            this._queueCheckWorkspaces();
        }
    },

    _windowEnteredMonitor: function(aMetaScreen, aMonitorIndex, aMetaWin) { // jshint ignore:line
        // If the window entered the primary monitor, that
        // might make that workspace non-empty
        if (aMonitorIndex === Main.layoutManager.primaryIndex) {
            this._queueCheckWorkspaces();
        }
    },

    _windowsRestacked: function() {
        // Figure out where the pointer is in case we lost track of
        // it during a grab. (In particular, if a trayicon popup menu
        // is dismissed, see if we need to close the message tray.)
        global.sync_pointer();
    },

    _queueCheckWorkspaces: function() {
        if (this._checkWorkspacesId === 0) {
            this._checkWorkspacesId = Meta.later_add(Meta.LaterType.BEFORE_REDRAW,
                () => this._checkWorkspaces());
        }
    },

    _nWorkspacesChanged: function() {
        let oldNumWorkspaces = this._workspaces.length;
        let newNumWorkspaces = global.screen.n_workspaces;

        if (oldNumWorkspaces === newNumWorkspaces) {
            return false;
        }

        if (newNumWorkspaces > oldNumWorkspaces) {
            let w;

            // Assume workspaces are only added at the end
            for (w = oldNumWorkspaces; w < newNumWorkspaces; w++) {
                this._workspaces[w] = global.screen.get_workspace_by_index(w);
            }

            for (w = oldNumWorkspaces; w < newNumWorkspaces; w++) {
                let workspace = this._workspaces[w];
                workspace._windowAddedId = workspace.connect("window-added",
                    () => this._queueCheckWorkspaces());
                workspace._windowRemovedId = workspace.connect("window-removed",
                    (aWorkspace, aWindow) => this._windowRemoved(aWorkspace, aWindow));
            }
        } else {
            // Assume workspaces are only removed sequentially
            // (e.g. 2,3,4 - not 2,4,7)
            let removedIndex;
            let removedNum = oldNumWorkspaces - newNumWorkspaces;
            for (let w = 0; w < oldNumWorkspaces; w++) {
                let workspace = global.screen.get_workspace_by_index(w);
                if (this._workspaces[w] !== workspace) {
                    removedIndex = w;
                    break;
                }
            }

            let lostWorkspaces = this._workspaces.splice(removedIndex, removedNum);
            lostWorkspaces.forEach(function(aWorkspace) {
                aWorkspace.disconnect(aWorkspace._windowAddedId);
                aWorkspace.disconnect(aWorkspace._windowRemovedId);
            });
        }

        this._queueCheckWorkspaces();

        return false;
    }
};

/* exported WorkspaceTracker
 */
