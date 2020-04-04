// {{IMPORTER}}

let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

const GlobalUtils = __import("globalUtils.js");
const DebugManager = __import("debugManager.js");
const Constants = __import("constants.js");
const DesktopNotificationsUtils = __import("desktopNotificationsUtils.js");
const SpawnUtils = __import("spawnUtils.js");

const {
    gi: {
        Cinnamon,
        Gio,
        GLib,
        Clutter,
        Meta
    },
    mainloop: Mainloop,
    misc: {
        fileUtils: FileUtils,
        signalManager: SignalManager,
        util: Util
    },
    ui: {
        dnd: DND,
        extension: Extension,
        main: Main
    }
} = imports;

const {
    Settings,
    Connections,
    WIN_MOVER_PROP
} = Constants;

const {
    _,
    escapeHTML,
    xdgOpen
} = GlobalUtils;

const {
    wrapObjectMethods
} = DebugManager;

const {
    CustomNotification,
    NotificationUrgency
} = DesktopNotificationsUtils;

var Debugger = new DebugManager.DebugManager("org.cinnamon.{{XLET_TYPE}}s.{{UUID}}");

wrapObjectMethods(Debugger, {
    CustomNotification: CustomNotification
});

var Notification = new CustomNotification({
    title: escapeHTML(_(XletMeta.name)),
    defaultButtons: [{
        action: "dialog-information",
        label: escapeHTML(_("Help"))
    }],
    actionInvokedCallback: (aSource, aAction) => {
        switch (aAction) {
            case "dialog-information":
                xdgOpen(XletMeta.path + "/HELP.html");
                break;
        }
    }
});

const OutputReader = new SpawnUtils.SpawnReader();

function dealWithRejection(aTweakDescription) {
    Notification.notify([
        escapeHTML(_(aTweakDescription)),
        escapeHTML(_("Tweak activation aborted!!!")),
        escapeHTML(_("Your Cinnamon version may not be compatible!!!"))
    ], NotificationUrgency.CRITICAL);
}

function testNotifications() {
    Notification.notify([
        escapeHTML(_("This is a test notification")),
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n" +
        "Suspendisse eleifend, lacus ut tempor vehicula, lorem tortor\n" +
        "suscipit libero, sit amet congue odio libero vitae lacus.\n" +
        "Sed est nibh, lacinia ac magna non, blandit aliquet est.\n" +
        "Mauris volutpat est vel lacinia faucibus. Pellentesque\n" +
        "pulvinar eros at dolor pretium, eget hendrerit leo rhoncus.\n" +
        "Sed nisl leo, posuere eget risus vel, euismod egestas metus.\n" +
        "Praesent interdum, dui sit amet convallis rutrum, velit nunc\n" +
        "sollicitudin erat, ac viverra leo eros in nulla. Morbi feugiat\n" +
        "feugiat est. Nam non libero dolor. Duis egestas sodales massa\n" +
        "sit amet lobortis. Donec sit amet nisi turpis. Morbi aliquet\n" +
        "aliquam ullamcorper."
    ]);
}

function informCinnamonRestart() {
    Notification.notify(escapeHTML(_("Cinnamon needs to be restarted.")));
}

function informAndDisable() {
    try {
        let msg = [
            escapeHTML(_("Extension activation aborted!!!")),
            escapeHTML(_("Your Cinnamon version may not be compatible!!!")),
            escapeHTML(_("Minimum Cinnamon version allowed: 3.0.x"))
        ];
        global.logError(msg);
        Notification.notify(msg, NotificationUrgency.CRITICAL);
    } finally {
        let enabledExtensions = global.settings.get_strv("enabled-extensions");
        Extension.unloadExtension(XletMeta.uuid, Extension.Type.EXTENSION);
        enabledExtensions.splice(enabledExtensions.indexOf(XletMeta.uuid), 1);
        global.settings.set_strv("enabled-extensions", enabledExtensions);
    }
}

function CT_NemoDesktopArea() {
    this._init.apply(this, arguments);
}

CT_NemoDesktopArea.prototype = {
    _init: function() {
        this.actor = global.stage;
        if (!this.actor.hasOwnProperty("_delegate")) {
            this.actor._delegate = this;
        }
    },

    acceptDrop: function(source, actor, x, y, time) { // jshint ignore:line
        let app = source.hasOwnProperty("app") ? source.app : null;

        if (app === null || app.is_window_backed()) {
            return DND.DragMotionResult.NO_DROP;
        }

        let backgroundActor = global.stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);

        if (backgroundActor !== global.window_group) {
            return DND.DragMotionResult.NO_DROP;
        }

        let file = Gio.file_new_for_path(app.get_app_info().get_filename());
        let fPath = FileUtils.getUserDesktopDir() + "/" + app.get_id();
        let destFile = Gio.file_new_for_path(fPath);

        try {
            file.copy(destFile, 0, null, () => {});
            if (FileUtils.hasOwnProperty("changeModeGFile")) {
                FileUtils.changeModeGFile(destFile, 755);
            } else {
                Util.spawnCommandLine('chmod +x "' + fPath + '"');
            }
        } catch (aErr) {
            global.logError(aErr);
            return DND.DragMotionResult.NO_DROP;
        }

        return DND.DragMotionResult.CONTINUE;
    },

    handleDragOver: function(source, actor, x, y, time) { // jshint ignore:line
        let app = source.hasOwnProperty("app") ? source.app : null;

        if (app === null || app.is_window_backed()) {
            return DND.DragMotionResult.NO_DROP;
        }

        let backgroundActor = global.stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);

        if (backgroundActor !== global.window_group) {
            return DND.DragMotionResult.NO_DROP;
        }

        return DND.DragMotionResult.COPY_DROP;
    }
};

function CT_WindowMover() {
    this._init.apply(this, arguments);
}

CT_WindowMover.prototype = {

    _init: function() {
        this._windowTracker = Cinnamon.WindowTracker.get_default();
        this._display = global.screen.get_display();
        this.sigMan = new SignalManager.SignalManager(null);
        this._autoMovedAppsMap = new Map();
        this._transientWorkspaces = new Set();
        this._windowCreatedId = 0;
        this._pref1Id = 0;
        this._pref2Id = 0;

        this.connectSignals();
        this._updateAutoMovedApplicationsMap();
    },

    connectSignals: function() {
        /* NOTE: Do not use SignalManager for the _windowCreatedId connection.
         * SignalManager has no connect_after method on the Cinnamon version that I use.
         * This note is here so that you (Odyseus) do not try to implement it
         * for a third time, dumb arse!!!
         */
        // Connect after so the handler from CinnamonWindowTracker has already run
        // Mark for deletion on EOL. Cinnamon 3.6.x+
        // Use SignalManager to manage this._windowCreatedId signal.
        this._windowCreatedId = this._display.connect_after("window-created",
            (aDisplay, aWindow) => {
                this._findAppAndMove(aDisplay, aWindow);
            }
        );

        this._pref1Id = Settings.connect("pref_window_auto_move_application_list", function() {
            this._updateAutoMovedApplicationsMap();
        }.bind(this));

        this._pref2Id = Settings.connect("pref_window_auto_move_fullscreen_in_own_ws", function() {
            this._reconnectFullScreenSignal();
        }.bind(this));

        this._reconnectFullScreenSignal();
    },

    _reconnectFullScreenSignal: function() {
        this.sigMan.disconnectAllSignals();

        if (Settings.pref_window_auto_move_fullscreen_in_own_ws) {
            this.sigMan.connect(global.screen, "in-fullscreen-changed", function(m) {
                Mainloop.idle_add(() => {
                    this._handleFullscreenState(m);

                    return GLib.SOURCE_REMOVE;
                });
            }.bind(this));

            this.sigMan.connect(global.window_manager, "destroy", function() {
                Mainloop.idle_add(() => {
                    let currentWs = global.screen.get_active_workspace();
                    let currentWsIndex = currentWs.index();
                    let winList = currentWs.list_windows().filter((aW) => {
                        return aW.window_type === Meta.WindowType.NORMAL &&
                            !aW.is_on_all_workspaces();
                    });

                    if (this._transientWorkspaces.has(currentWsIndex) &&
                        winList.length === 0) {
                        this._transientWorkspaces.delete(currentWsIndex);
                        global.screen.get_workspace_by_index(0).activate(global.get_current_time());

                        Mainloop.idle_add(() => {
                            global.screen.remove_workspace(currentWs, global.get_current_time());

                            return GLib.SOURCE_REMOVE;
                        });
                    }

                    return GLib.SOURCE_REMOVE;
                });
            }.bind(this));
        }
    },

    _updateAutoMovedApplicationsMap: function() {
        let appList = JSON.parse(JSON.stringify(Settings.pref_window_auto_move_application_list));

        if (appList.length > 0) {
            this._autoMovedAppsMap = new Map(appList.map((aEl) => {
                return [aEl["app_id"], aEl["workspace"]];
            }));
        }
    },

    destroy: function() {
        if (this._windowCreatedId) {
            global.screen.get_display().disconnect(this._windowCreatedId);
            this._windowCreatedId = 0;
        }

        if (this._pref1Id > 0) {
            Settings.disconnect(this._pref1Id);
        }

        if (this._pref2Id > 0) {
            Settings.disconnect(this._pref2Id);
        }

        this.sigMan.disconnectAllSignals();

        this._autoMovedAppsMap.clear();
        this._transientWorkspaces.clear();
    },

    _handleFullscreenState: function(aMetaScreen) {
        let win = aMetaScreen.get_display().focus_window;

        if (!win || win.window_type !== Meta.WindowType.NORMAL ||
            global.screen.get_active_workspace().index() !== win.get_workspace().index()) {
            return;
        }

        let winActor = win.get_compositor_private();

        if (!winActor) {
            return;
        }

        if (win.is_fullscreen()) {
            this._checkWinAndMove(winActor);
        } else {
            this._restoreWinToOriginalWS(winActor);
        }
    },

    _checkWinAndMove: function(aWinActor) {
        let win = aWinActor.meta_window;

        if (!win || win.window_type !== Meta.WindowType.NORMAL) {
            return;
        }

        let app = this._windowTracker.get_window_app(win);

        /* NOTE: If the window belongs to an app. that is configured to be opened in its
         * own workspace, let the proper function handle the window.
         */
        if (app) {
            let appId = app.get_id();

            if (this._autoMovedAppsMap.has(appId)) {
                this._findAppAndMove(null, win);

                return;
            } else if (Settings.pref_window_auto_move_fullscreen_in_own_ws_blacklist.indexOf(appId) !== -1) {
                return;
            }
        }

        let otherWinList = win.get_workspace().list_windows().filter((aW) => {
            return aW !== win &&
                aW.window_type === Meta.WindowType.NORMAL &&
                !aW.is_on_all_workspaces();
        });

        if (otherWinList.length >= 1) {
            // put on last workspace if all else fails (OO)
            let lastworkspace = global.screen.n_workspaces;
            // always start with the second workspace (OO)
            if (lastworkspace < 1) {
                lastworkspace = 1;
            }

            let wc = 0;
            let emptyWorkspace;
            for (emptyWorkspace = 1; emptyWorkspace < lastworkspace; emptyWorkspace++) {
                wc = global.screen.get_workspace_by_index(emptyWorkspace).list_windows().filter((aW) => {
                    return aW.window_type === Meta.WindowType.NORMAL && !aW.is_on_all_workspaces();
                }).length;

                if (wc < 1) {
                    break;
                }
            }

            // don't try to move it if we're already here (break recursion)
            if (emptyWorkspace === win.get_workspace().index()) {
                return;
            }

            /* NOTE: A workspace will be transient because it had to be created to hold
             * the window and it will be removed when the window leaves the workspace.
             */
            let workspaceIsTransient = emptyWorkspace >= global.screen.n_workspaces;

            if (workspaceIsTransient) {
                this._transientWorkspaces.add(emptyWorkspace);
                this._ensureAtLeastWorkspaces(emptyWorkspace);
            }

            /* NOTE: Store the data in the window itself.
             * I tried first storing the data in a preference with the string representation
             * of the window as an ID. But I quickly ended up with hundreds of entries stored
             * because each time a window state changes, its string representation also changes.
             * SO, to cut it short, force the data into the window's throat. The property where
             * the data is stored is reused on each window state change and the data is destroyed
             * when the window is destroyed. Moving on!!!
             */
            win[WIN_MOVER_PROP] = {
                original_workspace: win.get_workspace().index(),
                transient: workspaceIsTransient
            };

            Mainloop.idle_add(() => {
                this._moveWindow(emptyWorkspace, win, true);

                return GLib.SOURCE_REMOVE;
            });
        }
    },

    _restoreWinToOriginalWS: function(aWinActor) {
        let win = aWinActor.meta_window;

        if (!win || win.window_type !== Meta.WindowType.NORMAL) {
            return;
        }

        let currectWinWorkspace = win.get_workspace();

        if (win.hasOwnProperty(WIN_MOVER_PROP)) {
            let previous = win[WIN_MOVER_PROP].original_workspace;

            if (previous >= global.screen.n_workspaces) {
                this._ensureAtLeastWorkspaces(previous);
            }

            Mainloop.idle_add(() => {
                this._moveWindow(previous, win, true);

                let otherWinsList = currectWinWorkspace.list_windows().filter((aW) => {
                    return aW.window_type === Meta.WindowType.NORMAL && !aW.is_on_all_workspaces();
                });

                if (win[WIN_MOVER_PROP].transient && otherWinsList.length === 0) {
                    global.screen.remove_workspace(currectWinWorkspace, global.get_current_time());
                }

                return GLib.SOURCE_REMOVE;
            });
        }
    },

    _ensureAtLeastWorkspaces: function(aNum) {
        for (let j = global.screen.n_workspaces; j <= aNum; j++) {
            Main._addWorkspace();
        }
    },

    _findAppAndMove: function(aDisplay, aWindow, aRecurse = true) {
        if (aWindow.skip_taskbar) {
            return;
        }

        let app = this._windowTracker.get_window_app(aWindow);

        if (!app && aRecurse) {
            // Window is not tracked yet. Try one more time.
            Mainloop.idle_add(() => {
                this._findAppAndMove(aDisplay, aWindow, false);

                return GLib.SOURCE_REMOVE;
            });

            return;
        }

        if (!app) {
            return;
        }

        let app_id = app.get_id();

        if (this._autoMovedAppsMap.has(app_id)) {
            let wsIndex = parseInt(this._autoMovedAppsMap.get(app_id), 10) - 1;

            if (wsIndex >= global.screen.n_workspaces) {
                this._ensureAtLeastWorkspaces(wsIndex);
            }
            Mainloop.idle_add(() => {
                this._moveWindow(wsIndex, aWindow);

                return GLib.SOURCE_REMOVE;
            });

        }
    },

    _moveWindow: function(aWsIndex, aWin, aForceFocus) {
        if (aWin) {
            Main.wm.blockAnimations();
            aWin.change_workspace_by_index(aWsIndex, false, global.get_current_time());

            if (Settings.pref_window_auto_move_auto_focus || aForceFocus) {

                Mainloop.idle_add(() => {
                    aWin.get_workspace().activate_with_focus(aWin, global.get_current_time());
                    Main.wm.unblockAnimations();

                    return GLib.SOURCE_REMOVE;
                });
            } else {
                Main.wm.unblockAnimations();
            }
        }
    }
};

function CT_MaximusNG() {
    this._init.apply(this, arguments);
}

CT_MaximusNG.prototype = {

    _init: function() {
        this._windowTracker = Cinnamon.WindowTracker.get_default();
        this.sigMan = new SignalManager.SignalManager(null);
        this.workspacesSigMan = new SignalManager.SignalManager(null);

        this.shouldFocusWindow = true;
        this.oldFullscreenPref = null;
        this._autoMovedApps = new Set();
        this.onetime = 0;
        /* NOTE: This is not used but is kept in case that Cinnamon's developers
         * regain their senses and re-add a feature to muffin that should have never
         * been removed in the first place.
         */
        this.use_set_hide_titlebar = false;
    },

    log: function(aMsg) {
        if (Settings.pref_maximus_enable_logging) {
            global.log("[" + _(XletMeta.name) + "][Maximus] " + aMsg);
        }
    },

    /**
     * Guesses the X ID of a window.
     *
     * It is often in the window's title, being `"0x%x %10s".format(XID, window.title)`.
     * (See `mutter/src/core/window-props.c`).
     *
     * If we couldn't find it there, we use `win`'s actor, `win.get_compositor_private()`.
     * The actor's `x-window` property is the X ID of the window *actor*'s frame
     * (as opposed to the window itself).
     *
     * However, the child window of the window actor is the window itself, so by
     * using `xwininfo -children -id [actor's XID]` we can attempt to deduce the
     * window's X ID.
     *
     * It is not always foolproof, but works good enough for now.
     *
     * @param {Meta.Window} win - the window to guess the XID of. You wil get better
     * success if the window's actor (`win.get_compositor_private()`) exists.
     */
    guessWindowXIDAsync: function(aWin, aCallback) {
        let id = null;
        /* If window title has non-utf8 characters, get_description() complains
         * "Failed to convert UTF-8 string to JS string: Invalid byte sequence in conversion input",
         * event though get_title() works.
         */
        try {
            id = aWin.get_description().match(/0x[0-9a-f]+/);

            if (id) {
                id = id[0];
                aCallback(id);
                return;
            }
        } catch (err) {}

        // Use xwininfo, take first child.
        let winActor = aWin.get_compositor_private();

        if (winActor && winActor.hasOwnProperty("x-window")) {
            OutputReader.spawn("xwininfo -children -id 0x%x"
                .format(winActor["x-window"]), null, null, GLib.SpawnFlags.DEFAULT, null,
                (aStandardOutput) => {
                    let str = aStandardOutput.toString();

                    /* The X ID of the window is the one preceding the target window's title.
                     * This is to handle cases where the window has no frame and so
                     * winActor['x-window'] is actually the X ID we want, not the child.
                     */
                    let regexp = new RegExp('(0x[0-9a-f]+) +"%s"'.format(aWin.title));
                    id = str.match(regexp);

                    if (id) {
                        aCallback(id[1]);
                        return;
                    }

                    // Otherwise, just grab the child and hope for the best
                    id = str.split(/child(?:ren)?:/)[1].match(/0x[0-9a-f]+/);

                    if (id) {
                        aCallback(id[0]);
                    }

                    return;
                }
            );
        }

        this.log("Could not find XID for window with title %s".format(aWin.title));
        aCallback(null);
    },

    /**
     * Undecorates a window.
     *
     * If I use set_decorations(0) from within the GNOME shell extension (i.e.
     *  from within the compositor process), the window dies.
     * If I use the same code but use `gjs` to run it, the window undecorates
     *  properly.
     *
     * Hence I have to make some sort of external call to do the undecoration.
     * I could use 'gjs' on a javascript file (and I'm pretty sure this is installed
     *  with GNOME-shell too), but I decided to use a system call to xprop and set
     *  the window's `_MOTIF_WM_HINTS` property to ask for undecoration.
     *
     * We can use xprop using the window's title to identify the window, but
     *  prefer to use the window's X ID (in case the title changes, or there are
     *  multiple windows with the same title).
     *
     * The Meta.Window object does *not* have a way to access a window's XID.
     * However, the window's description seems to have it.
     * Alternatively, a window's actor's 'x-window' property returns the XID
     *  of the window *frame*, and so if we parse `xwininfo -children -id [frame_id]`
     *  we can extract the child XID being the one we want.
     *
     * See here for xprop usage for undecoration:
     * http://xrunhprof.wordpress.com/2009/04/13/removing-decorations-in-metacity/
     *
     * @param {Meta.Window} win - window to undecorate.
     */
    undecorate: function(aWin) {
        let winApp = this._windowTracker.get_window_app(aWin);
        this.shouldFocusWindow = winApp && !this._autoMovedApps.has(winApp.get_id());

        this.guessWindowXIDAsync(aWin, (aWinId) => {
            // Undecorate with xprop
            let cmd = ["xprop", "-id", aWinId,
                "-f", "_MOTIF_WM_HINTS", "32c",
                "-set", "_MOTIF_WM_HINTS",
                "0x2, 0x0, %s, 0x0, 0x0"
                .format(Settings.pref_maximus_invisible_win_hack ? "0x2" : "0x0")
            ];

            /* _MOTIF_WM_HINTS: see MwmUtil.h from OpenMotif source (cvs.openmotif.org),
             *  or rudimentary documentation here:
             * http://odl.sysworks.biz/disk$cddoc04sep11/decw$book/d3b0aa63.p264.decw$book
             *
             * Struct { flags, functions, decorations, input_mode, status }.
             * Flags: what the hints are for. (functions, decorations, input mode and/or status).
             * Functions: minimize, maximize, close, ...
             * Decorations: title, border, all, none, ...
             * Input Mode: modeless, application modal, system model, ..
             * Status: tearoff window.
             */

            // Fallback: if couldn't get id for some reason, use the window's name
            if (!aWinId) {
                cmd[1] = "-name";
                cmd[2] = aWin.get_title();
            }

            this.log(cmd.join(" "));
            Util.spawn_async(cmd, () => {
                /* #25: when undecorating a Qt app (texmaker, keepassx) somehow focus is lost.
                 * However, is there a use case where this would happen legitimately?
                 * For some reasons the Qt apps seem to take a while to be refocused.
                 */
                /* NOTE: If an application is configured to be auto-moved into another
                 * workspace, do not auto-focus it; it will prevent it from being moved.
                 */
                if (this.shouldFocusWindow) {
                    Meta.later_add(Meta.LaterType.IDLE, () => {
                        if (aWin.focus) {
                            aWin.focus(global.get_current_time());
                        } else {
                            aWin.activate(global.get_current_time());
                        }

                        return GLib.SOURCE_REMOVE;
                    });
                }
            });
        });
    },

    /**
     * Decorates a window by setting its `_MOTIF_WM_HINTS` property to ask for
     * decoration.
     *
     * @param {Meta.Window} win - window to undecorate.
     */
    decorate: function(aWin) {
        this.guessWindowXIDAsync(aWin, (aWinId) => {
            // Decorate with xprop: 1 === DECOR_ALL
            let cmd = ["xprop", "-id", aWinId,
                "-f", "_MOTIF_WM_HINTS", "32c",
                "-set", "_MOTIF_WM_HINTS",
                "0x2, 0x0, 0x1, 0x0, 0x0"
            ];

            // Fallback: if couldn't get id for some reason, use the window's name
            if (!aWinId) {
                cmd[1] = "-name";
                cmd[2] = aWin.get_title();
            }

            this.log(cmd.join(" "));
            Util.spawn_async(cmd, () => {
                /* #25: when undecorating a Qt app (texmaker, keepassx) somehow focus is lost.
                 * However, is there a use case where this would happen legitimately?
                 * For some reaons the Qt apps seem to take a while to be refocused.
                 */
                Meta.later_add(Meta.LaterType.IDLE, () => {
                    if (aWin.focus) {
                        aWin.focus(global.get_current_time());
                    } else {
                        aWin.activate(global.get_current_time());
                    }
                });
            });
        });
    },

    /**
     * Tells the window manager to hide the titlebar on maximised windows.
     * TODO: GNOME 3.2?
     *
     * Note - no checking of blacklists etc is done in the function. You should do
     * it prior to calling the function (same with {@link decorate} and {@link undecorate}).
     *
     * Does this by setting the _GTK_HIDE_TITLEBAR_WHEN_MAXIMIZED hint - means
     * I can do it once and forget about it, rather than tracking maximize/unmaximize
     * events.
     *
     * **Caveat**: doesn't work with Ubuntu's Ambiance and Radiance window themes -
     * my guess is they don't respect or implement this property.
     *
     * @param {Meta.Window} win - window to set the HIDE_TITLEBAR_WHEN_MAXIMIZED property of.
     * @param {boolean} hide - whether to hide the titlebar or not.
     * @param {boolean} [stopAdding] - if `win` does not have an actor and we couldn't
     * find the window's XID, we try one more time to detect the XID, unless this
     * is `true`. Internal use.
     */
    setHideTitlebar: function(aWin, aHide, aStopAdding) {
        this.log("setHideTitlebar: " + aWin.get_title() + ": " + aHide + (aStopAdding ? " (2)" : ""));
        this.guessWindowXIDAsync(aWin, (aWinId) => {
            /* Newly-created windows are added to the workspace before
             * the compositor knows about them: get_compositor_private() is null.
             * Additionally things like .get_maximized() aren't properly done yet.
             * (see workspace.js _doAddWindow)
             */
            if (!aWinId && !aWin.get_compositor_private() && !aStopAdding) {
                Mainloop.idle_add(() => {
                    this.setHideTitlebar(null, aWin, true);

                    return GLib.SOURCE_REMOVE;
                });
                return;
            }

            /* Undecorate with xprop. Use _GTK_HIDE_TITLEBAR_WHEN_MAXIMIZED.
             * See (eg) mutter/src/window-props.c
             */
            let cmd = ["xprop", "-id", aWinId,
                "-f", "_GTK_HIDE_TITLEBAR_WHEN_MAXIMIZED", "32c",
                "-set", "_GTK_HIDE_TITLEBAR_WHEN_MAXIMIZED",
                (aHide ? "0x1" : "0x0")
            ];

            // Fallback: if couldn't get id for some reason, use the window's name
            if (!aWinId) {
                cmd[1] = "-name";
                cmd[2] = aWin.get_title();
            }

            this.log(cmd.join(" "));
            Util.spawn_async(cmd);
        });
    },

    /**
     * Returns whether we should affect `win`'s decoration at all.
     *
     * If the window was originally undecorated we do not do anything with it
     *  (decorate or undecorate),
     *
     * Also if it's in the blacklist, or if it's NOT in the whitelist, we don't
     * do anything with it.
     *
     * @returns {boolean} whether the window is originally decorated and not in
     * the blacklist (or in the whitelist).
     */
    shouldAffect: function(aWin) {
        if (!aWin.__CT_MaximusNG_decoratedOriginal) {
            return false;
        }

        let app = Cinnamon.WindowTracker.get_default().get_window_app(aWin);
        let appid = (app ? app.get_id() : -1);
        let inList = Settings.pref_maximus_app_list.length > 0 &&
            Settings.pref_maximus_app_list.indexOf(appid) >= 0;

        return !((Settings.pref_maximus_is_blacklist && inList) ||
            (!Settings.pref_maximus_is_blacklist && !inList));
    },

    /**
     * Checks if `win` should be undecorated, based *purely* off its maximised
     * state (doesn't incorporate blacklist).
     *
     * If it's fully-maximized or half-maximised and undecorateHalfMaximised is true,
     * this returns true.
     *
     * Use with `shouldAffect` to get a full check..
     */
    shouldBeUndecorated: function(aWin) {
        let max = aWin.get_maximized();
        return (max === (Meta.MaximizeFlags.VERTICAL | Meta.MaximizeFlags.HORIZONTAL) ||
            (Settings.pref_maximus_undecorate_half_maximized && max > 0));
    },

    /**
     * Checks if `aWin` is fully maximised, or half-maximised + undecorateHalfMaximised.
     * If so, undecorates the window.
     */
    possiblyUndecorate: function(aWin) {
        if (this.shouldBeUndecorated(aWin)) {
            if (aWin.get_compositor_private()) {
                this.undecorate(aWin);
            } else {
                Mainloop.idle_add(() => {
                    this.undecorate(aWin);

                    return GLib.SOURCE_REMOVE;
                });
            }
        }
    },

    /**
     * Checks if `aWin` is fully maximised, or half-maximised + undecorateHalfMaximised.
     * If *NOT*, redecorates the window.
     */
    possiblyRedecorate: function(aWin) {
        if (!this.shouldBeUndecorated(aWin)) {
            if (!aWin.get_compositor_private()) {
                Mainloop.idle_add(() => {
                    this.decorate(aWin);

                    return GLib.SOURCE_REMOVE;
                });
            } else {
                this.decorate(aWin);
            }
        }
    },

    /**
     * Called when a window is maximized, including half-maximization.
     *
     * If the window is not in the blacklist (or is in the whitelist), we undecorate
     * it.
     *
     * @param {Meta.WindowActor} actor - the window actor for the maximized window.
     * It is expected to be maximized (in at least one direction) already - we will
     * not check before undecorating.
     */
    onMaximise: function(CinnWM, aActor) {
        if (!aActor) {
            return false;
        }

        let win = aActor.get_meta_window();

        if (!this.shouldAffect(win)) {
            return false;
        }

        let max = win.get_maximized();
        this.log("onMaximise: " + win.get_title() + " [" + win.get_wm_class() + "]");

        /* If this is a partial maximization, and we do not wish to undecorate
         * half-maximized or tiled windows, make sure the window is decorated.
         */
        if (max !== (Meta.MaximizeFlags.VERTICAL | Meta.MaximizeFlags.HORIZONTAL) &&
            ((!Settings.pref_maximus_undecorate_half_maximized && win.tile_type === 0) ||
                (!Settings.pref_maximus_undecorate_tiled && win.tile_type > 0))) {
            this.decorate(win);
            return false;
        }

        // this.undecorate(win);
        Meta.later_add(Meta.LaterType.IDLE, () => {
            this.undecorate(win);

            return GLib.SOURCE_REMOVE;
        });

        return false;
    },

    /**
     * Called when a window is unmaximized.
     *
     * If the window is not in the blacklist (or is in the whitelist), we decorate
     * it.
     *
     * @param {Meta.WindowActor} actor - the window actor for the unmaximized window.
     * It is expected to be unmaximized - we will not check before decorating.
     */
    onUnmaximise: function(CinnWM, aActor) {
        if (!aActor) {
            return false;
        }

        let win = aActor.meta_window;

        if (!this.shouldAffect(win)) {
            return false;
        }

        this.log("onUnmaximise: " + win.get_title());

        /* If the user is unmaximizing by dragging, we wait to decorate until they
         * have dropped the window, so that we don't force the user to drop
         * the window prematurely with the redecorate (which stops the grab).
         *
         * This is only necessary if USE_SET_HIDE_TITLEBAR is `false` (otherwise
         * this is not an issue).
         */
        if (!this.use_set_hide_titlebar && global.display.get_grab_op() === Meta.GrabOp.MOVING) {
            this.sigMan.connect(global.display, "grab-op-end", function() {
                this.possiblyRedecorate(win);
                this.sigMan.disconnect("grab-op-end");
            }.bind(this));
        } else {
            this.decorate(win);
        }

        return false;
    },

    /**
     * Callback for a window's 'notify::maximized-horizontally' and
     * 'notify::maximized-vertically' signals.
     *
     * If the window is half-maximised we force it to show its titlebar.
     * Otherwise we set it to hide if it is maximized.
     *
     * Only used if using the SET_HIDE_TITLEBAR method AND we wish half-maximized
     * windows to be *decorated* (the GTK_HIDE_TITLEBAR_WHEN_MAXIMIZED atom will
     * hide the titlebar of half-maximized windows too).
     *
     * @param {Meta.Window} win - the window whose maximized-horizontally or
     * maximized-vertically properties has changed.
     *
     * @see onWindowAdded
     */
    onWindowChangesMaximiseState: function(aWin) {
        if ((aWin.maximized_horizontally && !aWin.maximized_vertically) ||
            (!aWin.maximized_horizontally && aWin.maximized_vertically)) {
            this.setHideTitlebar(aWin, false);
            this.decorate(aWin);
        } else {
            this.setHideTitlebar(aWin, true);
        }
    },

    /**
     * Callback when a window is added in any of the workspaces.
     * This includes a window switching to another workspace.
     *
     * If it is a window we already know about, we do nothing.
     *
     * Otherwise, we:
     *
     * * record the window as on we know about.
     * * store whether the window was initially decorated (e.g. Chrome windows aren't usually).
     * * if using the SET_HIDE_TITLEBAR method, we:
     *  + set the GTK_HIDE_TITLEBAR_WHEN_MAXIMIZED atom on the window.
     *  + if we wish to keep half-maximised windows decorated, we connect up some signals
     *    to ensure that half-maximised windows remain decorated (the GTK_HIDE_TITLEBAR_WHEN_MAXIMIZED
     *    atom will automatically undecorated half-maximised windows).
     *    See {@link onWindowChangesMaximiseState}.
     * * otherwise (not using SET_HIDE_TITLEBAR):
     *  + if the window is maximized, we undecorate it (see {@link undecorate});
     *  + if the window is half-maximized and we wish to undecorate half-maximised
     *    windows, we also undecorate it.
     *
     * @param {Meta.Window} win - the window that was added.
     *
     * @see undecorate
     */
    onWindowAdded: function(aWorkspace, aWin) {
        if (aWin.__CT_MaximusNG_decoratedOriginal) {
            return false;
        }

        /* Newly-created windows are added to the workspace before
         * the compositor knows about them: get_compositor_private() is null.
         * Additionally things like .get_maximized() aren't properly done yet.
         * (see workspace.js _doAddWindow)
         */
        aWin.__CT_MaximusNG_decoratedOriginal = Boolean(aWin.decorated);
        this.log("onWindowAdded: " + aWin.get_title() + " initially decorated? " +
            aWin.__CT_MaximusNG_decoratedOriginal);

        if (!this.shouldAffect(aWin)) {
            return false;
        }

        // With set_hide_titlebar, set the window hint when the window is added and
        // there is no further need to listen to maximize/unmaximize on the window.
        if (this.use_set_hide_titlebar) {
            this.setHideTitlebar(aWin, true);
            if (this.shouldBeUndecorated(aWin)) {
                aWin.unmaximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
                Mainloop.idle_add(() => {
                    aWin.maximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);

                    return GLib.SOURCE_REMOVE;
                });
            }

            if (!Settings.pref_maximus_undecorate_half_maximized) {
                aWin.__CT_MaximusNG_maxHStateId = aWin.connect("notify::maximized-horizontally",
                    (aW) => this.onWindowChangesMaximiseState(aW));
                aWin.__CT_MaximusNG_maxVStateId = aWin.connect("notify::maximized-vertically",
                    (aW) => this.onWindowChangesMaximiseState(aW));

                if (aWin.get_maximized()) {
                    this.onWindowChangesMaximiseState(aWin);
                }
            }
        } else {
            // If it is added initially maximized, we undecorate it.
            this.possiblyUndecorate(aWin);
        }

        return false;
    },

    /**
     * Callback whenever the number of workspaces changes.
     *
     * We ensure that we are listening to the 'window-added' signal on each of
     * the workspaces.
     *
     * @see onWindowAdded
     */
    onChangeNWorkspaces: function() {
        this.workspacesSigMan.disconnectAllSignals();

        let maxWinAddedFn = () => {
            return function(aWorkspace, aWindow) {
                /* NOTE: We need to add a Mainloop.idle_add, or else in onWindowAdded the
                 * window's maximized state is not correct yet.
                 */
                Mainloop.idle_add(() => {
                    this.onWindowAdded(aWorkspace, aWindow);

                    return GLib.SOURCE_REMOVE;
                });
            };
        };

        let i = global.screen.n_workspaces;
        while (i--) {
            let ws = global.screen.get_workspace_by_index(i);
            this.workspacesSigMan.connect(ws, "window-added", maxWinAddedFn().bind(this));
        }
    },

    // Start listening to events and undecorate already-existing windows.
    startUndecorating: function() {
        Settings.connect("pref_window_auto_move_application_list", function() {
            this._updateAutoMovedApplicationsList();
        }.bind(this));
        this._updateAutoMovedApplicationsList();

        this.sigMan.connect(global.screen, "notify::n-workspaces", function() {
            this.onChangeNWorkspaces();
        }.bind(this));

        // If we are not using the set_hide_titlebar hint, we must listen to maximize and unmaximize events.
        if (!this.use_set_hide_titlebar) {
            this.sigMan.connect(global.window_manager, "maximize", function(CinnWM, aActor) {
                this.onMaximise(CinnWM, aActor);
            }.bind(this));
            this.sigMan.connect(global.window_manager, "unmaximize", function(CinnWM, aActor) {
                this.onUnmaximise(CinnWM, aActor);
            }.bind(this));

            if (Settings.pref_maximus_undecorate_tiled) {
                this.sigMan.connect(global.window_manager, "tile", function(CinnWM, aActor) {
                    this.onMaximise(CinnWM, aActor);
                }.bind(this));
            }

            /* This is needed to prevent Metacity from interpreting an attempted drag
             * of an undecorated window as a fullscreen request. Otherwise thunderbird
             * (in particular) has no way to get out of fullscreen, resulting in the user
             * being stuck there.
             * See issue #6
             * https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension/issue/6
             *
             * Once we can properly set the window's hide_titlebar_when_maximized property
             * this will no loner be necessary.
             */
            this.oldFullscreenPref = Meta.prefs_get_force_fullscreen();
            Meta.prefs_set_force_fullscreen(false);
        }

        /* Go through already-maximised windows & undecorate.
         * This needs a delay as the window list is not yet loaded
         *  when the extension is loaded.
         * Also, connect up the 'window-added' event.
         * Note that we do not connect this before the onMaximise loop
         *  because when one restarts the gnome-shell, window-added gets
         *  fired for every currently-existing window, and then
         *  these windows will have onMaximise called twice on them.
         */
        this.onetime = Mainloop.idle_add(() => {
            let winList = global.get_window_actors().map((w) => {
                return w.meta_window;
            });
            let i = winList.length;

            while (i--) {
                let win = winList[i];
                if (win.window_type === Meta.WindowType.DESKTOP) {
                    continue;
                }
                this.onWindowAdded(null, win);
            }

            this.onChangeNWorkspaces();
            // Attempt to remove the following warning:
            // Invalid or null source id used when attempting to run Mainloop.source_remove()
            this.onetime = 0;

            return GLib.SOURCE_REMOVE;
        });
    },

    stopUndecorating: function() {
        this.sigMan.disconnectAllSignals();
        this.workspacesSigMan.disconnectAllSignals();

        if (this.onetime > 0) {
            Mainloop.source_remove(this.onetime);
            this.onetime = 0;
        }

        let winList = global.get_window_actors().map((w) => {
            return w.meta_window;
        });
        let b = winList.length;

        if (b > 0) {
            while (b--) {
                let win = winList[b];

                if (win.window_type === Meta.WindowType.DESKTOP) {
                    continue;
                }

                this.log("stopUndecorating: " + win.title);

                if (win.CT_MaximusNG_decoratedOriginal) {
                    if (this.use_set_hide_titlebar) {
                        this.setHideTitlebar(win, false);
                        if (win.__CT_MaximusNG_maxHStateId) {
                            win.disconnect(win.__CT_MaximusNG_maxHStateId);
                            delete win.__CT_MaximusNG_maxHStateId;
                        }

                        if (win.__CT_MaximusNG_maxVStateId) {
                            win.disconnect(win.__CT_MaximusNG_maxVStateId);
                            delete win.__CT_MaximusNG_maxVStateId;
                        }
                    }

                    this.decorate(win);
                }

                delete win.CT_MaximusNG_decoratedOriginal;
            }
        }

        if (this.oldFullscreenPref !== null) {
            Meta.prefs_set_force_fullscreen(this.oldFullscreenPref);
            this.oldFullscreenPref = null;
        }
    },

    _updateAutoMovedApplicationsList: function() {
        let appList = JSON.parse(JSON.stringify(Settings.pref_window_auto_move_application_list));

        if (appList.length > 0) {
            this._autoMovedApps = new Set(appList.map((aEl) => {
                return aEl["app_id"];
            }));
        }
    }
};

function WindowDemandsAttention() {
    this._init.apply(this, arguments);
}

WindowDemandsAttention.prototype = {
    wdae_shortcut_id: XletMeta.uuid + "-window-demands-attention-shortcut",

    _init: function() {
        this._handlerid = 0;

        if (Settings.pref_win_demands_attention_activation_mode === "hotkey") {
            this._windows = [];
            Connections.WDAE_CONNECTION = global.display.connect(
                "window-demands-attention",
                (aDisplay, aWin) => {
                    this._on_window_demands_attention(aDisplay, aWin);
                }
            );
        } else if (Settings.pref_win_demands_attention_activation_mode === "force") {
            this._tracker = Cinnamon.WindowTracker.get_default();
            Connections.WDAE_CONNECTION = global.display.connect("window-demands-attention",
                (aDisplay, aWin) => {
                    this._on_window_demands_attention(aDisplay, aWin);
                }
            );
        }
    },

    _on_window_demands_attention: function(aDisplay, aWin) {
        switch (Settings.pref_win_demands_attention_activation_mode) {
            case "hotkey":
                this._windows.push(aWin);
                break;
            case "force":
                Main.activateWindow(aWin);
                break;
        }
    },

    _activate_last_window: function() {
        if (this._windows.length === 0) {
            Notification.notify(_("No windows in the queue."));
            return;
        }

        let last_window = this._windows.pop();
        Main.activateWindow(last_window);
    },

    _add_keybindings: function() {
        Main.keybindingManager.addHotKey(
            this.wdae_shortcut_id,
            Settings.pref_win_demands_attention_keyboard_shortcut + "::",
            () => this._activate_last_window());
    },

    _remove_keybindings: function() {
        Main.keybindingManager.removeHotKey(this.wdae_shortcut_id);
    },

    enable: function() {
        if (Settings.pref_win_demands_attention_activation_mode === "hotkey") {
            this._add_keybindings();
        }
    },

    _destroy: function() {
        if (Connections.WDAE_CONNECTION > 0) {
            global.display.disconnect(Connections.WDAE_CONNECTION);
            Connections.WDAE_CONNECTION = 0;
        }

        this._windows = null;
        this._remove_keybindings();
    }
};

/**
 * queryCollection:
 * @collection (array): an array of objects to query
 * @query (object): key-value pairs to find in the collection
 * @indexOnly (boolean): defaults to false, returns only the matching
 * object's index if true.
 *
 * Returns (object|null): the matched object, or null if no object
 * in the collection matches all conditions of the query.
 *
 * I fed up of the stupid retarded "SpiderMoron" engine belching stric
 * warnings all over the ][{¬½~}] place!!!!
 */
function queryCollection(collection, query, indexOnly = false) {
    let queryKeys = Object.keys(query);
    for (let i = 0; i < collection.length; i++) {
        let matches = 0;
        for (let z = 0; z < queryKeys.length; z++) {
            if (collection[i][queryKeys[z]] === query[queryKeys[z]]) {
                matches += 1;
            }
        }
        if (matches === queryKeys.length) {
            return indexOnly ? i : collection[i];
        }
    }
    return indexOnly ? -1 : null;
}

wrapObjectMethods(Debugger, {
    CT_MaximusNG: CT_MaximusNG,
    CT_NemoDesktopArea: CT_NemoDesktopArea,
    CT_WindowMover: CT_WindowMover,
    WindowDemandsAttention: WindowDemandsAttention
});

/* exported dealWithRejection,
            testNotifications,
            informCinnamonRestart,
            informAndDisable,
            CT_MyCheckWorkspaces,
            queryCollection
 */
