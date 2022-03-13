const {
    gi: {
        Cinnamon,
        Clutter,
        Meta,
        St
    },
    mainloop: Mainloop,
    misc: {
        util: Util,
        signalManager: SignalManager
    },
    ui: {
        applet: Applet,
        dnd: DND,
        main: Main,
        popupMenu: PopupMenu,
        tooltips: Tooltips
    }
} = imports;

const {
    MAX_TEXT_LENGTH,
    FLASH_INTERVAL,
    FLASH_MAX_COUNT,
    WINDOW_PREVIEW_WIDTH,
    WINDOW_PREVIEW_HEIGHT
} = require("js_modules/constants.js");

const {
    _,
    launchUri
} = require("js_modules/globalUtils.js");

const {
    DebugManager
} = require("js_modules/debugManager.js");

var Debugger = new DebugManager(`org.cinnamon.applets.${__meta.uuid}`);

var WindowPreview = class WindowPreview extends Tooltips.TooltipBase {
    constructor(item, metaWindow, previewScale, showLabel) {
        super(item.actor);
        this._applet = item._applet;
        this.metaWindow = metaWindow;
        this._windowActor = null;
        this.uiScale = global.ui_scale;
        this.thumbScale = previewScale;

        this._sizeChangedId = 0;
        this.thumbnail = null;

        const actorParams = {
            vertical: true,
            style_class: "window-list-preview",
            important: true
        };

        this.actor = new St.BoxLayout(actorParams);
        this.actor.show_on_set_parent = false;
        Main.uiGroup.add_actor(this.actor);

        this.label = new St.Label();
        this.labelBin = new St.Bin({
            y_align: St.Align.MIDDLE
        });
        this.labelBin.set_width(WINDOW_PREVIEW_WIDTH * this.thumbScale * this.uiScale);
        this.labelBin.add_actor(this.label);
        this.actor.add_actor(this.labelBin);

        if (!showLabel) {
            this.labelBin.hide();
        }

        this.thumbnailBin = new St.Bin();
        this.actor.add_actor(this.thumbnailBin);
    }

    get windowActor() {
        if (this._windowActor) {
            return this._windowActor;
        }

        this._windowActor = this.metaWindow.get_compositor_private();

        if (this._windowActor) {
            return this._windowActor;
        } else {
            global.log("metaWindow has no actor!");
            return null;
        }
    }

    _onEnterEvent(actor, event) {
        if (this._applet._tooltipShowing) {
            this.show();
        } else if (!this._showTimer) {
            this._showTimer = Mainloop.timeout_add(300,
                () => {
                    this._onShowTimerComplete();
                }
            );
        }

        this.mousePosition = event.get_coords();
    }

    _getScaledTextureSize(windowTexture) {
        const [width, height] = windowTexture.get_size();
        const scale = this.thumbScale * this.uiScale *
            Math.min(WINDOW_PREVIEW_WIDTH / width, WINDOW_PREVIEW_HEIGHT / height);
        return [width * scale,
            height * scale
        ];
    }

    _hide(actor, event) {
        super._hide(actor, event);
        this._applet.erodeTooltip();
    }

    show() {
        if (!this.actor || this._applet._menuOpen) {
            return;
        }

        if (this.thumbnail) {
            this.thumbnailBin.set_child(null);
            this.thumbnail.destroy();
            this.thumbnail = null;
        }

        const windowTexture = this.windowActor.get_texture();

        if (!windowTexture) {
            this.actor.hide();
            return;
        }

        const [width, height] = this._getScaledTextureSize(windowTexture);

        this.thumbnail = new Clutter.Clone({
            source: windowTexture,
            width: width,
            height: height
        });

        this._sizeChangedId = this.windowActor.connect("size-changed", () => {
            const [width, height] = this._getScaledTextureSize(windowTexture);
            this.thumbnail.set_size(width, height);
            this._set_position();
        });

        this.thumbnailBin.set_child(this.thumbnail);

        this.actor.show();
        this._set_position();

        this.visible = true;
        this._applet.cancelErodeTooltip();
        this._applet._tooltipShowing = true;
    }

    hide() {
        if (this._sizeChangedId > 0) {
            this.windowActor && this.windowActor.disconnect(this._sizeChangedId);
            this._sizeChangedId = 0;
        }
        if (this.thumbnail) {
            this.thumbnailBin.set_child(null);
            this.thumbnail.destroy();
            this.thumbnail = null;
        }
        if (this.actor) {
            this.actor.hide();
        }
        this.visible = false;
    }

    _set_position() {
        if (!this.actor || this.actor.is_finalized()) {
            return;
        }

        const allocation = this.actor.get_allocation_box();
        const previewHeight = allocation.y2 - allocation.y1;
        const previewWidth = allocation.x2 - allocation.x1;

        const monitor = Main.layoutManager.findMonitorForActor(this.item);

        let previewTop;
        if (this._applet.$.orientation === St.Side.BOTTOM) {
            previewTop = this.item.get_transformed_position()[1] - previewHeight - 5;
        } else if (this._applet.$.orientation === St.Side.TOP) {
            previewTop = this.item.get_transformed_position()[1] + this.item.get_transformed_size()[1] + 5;
        } else {
            previewTop = this.item.get_transformed_position()[1];
        }

        let previewLeft;

        if (this._applet.$.orientation === St.Side.BOTTOM || this._applet.$.orientation === St.Side.TOP) {
            // centre the applet on the window list item if window list is on the top or bottom panel
            previewLeft = this.item.get_transformed_position()[0] + this.item.get_transformed_size()[0] / 2 - previewWidth / 2;
        } else if (this._applet.$.orientation === St.Side.LEFT) {
            previewLeft = this.item.get_transformed_position()[0] + this.item.get_transformed_size()[0] + 5;
        } else {
            previewLeft = this.item.get_transformed_position()[0] - previewWidth - 5;
        }

        previewLeft = Math.round(previewLeft);
        previewLeft = Math.max(previewLeft, monitor.x);
        previewLeft = Math.min(previewLeft, monitor.x + monitor.width - previewWidth);

        previewTop = Math.round(previewTop);
        previewTop = Math.min(previewTop, monitor.y + monitor.height - previewHeight);

        this.actor.set_position(previewLeft, previewTop);
    }

    set_text(text) {
        this.label.set_text(text);
    }

    _destroy() {
        if (this._sizeChangedId > 0) {
            this.windowActor && this.windowActor.disconnect(this._sizeChangedId);
            this.sizeChangedId = 0;
        }
        if (this.thumbnail) {
            this.thumbnailBin.set_child(null);
            this.thumbnail.destroy();
            this.thumbnail = null;
        }
        if (this.actor) {
            Main.uiGroup.remove_actor(this.actor);
            this.actor.destroy();
            this.actor = null;
        }
    }
};

var AppMenuButtonRightClickMenu = class AppMenuButtonRightClickMenu extends Applet.AppletPopupMenu {
    constructor(launcher, metaWindow, orientation) {
        super(launcher, orientation);

        this._launcher = launcher;
        this._windows = launcher._applet._windows;
        this._signals.connect(this, "open-state-changed", function(aMenu, aOpen) {
            this._onToggled(aMenu, aOpen);
        }.bind(this));

        this.orientation = orientation;
        this.metaWindow = metaWindow;
        this.appInfo = null;
    }

    _addAdditionalActions() {
        // FIXME: The app. returned by Cinnamon.WindowTracker.get_window_app() not always contains
        // the Gio.DesktopAppInfo instance required to get an app. actions. As far as I can tell,
        // the problem seems to be that the returned app. doesn't have the actual app. ID (its
        // desktop file name) of an application, but an "artificial ID" (window:[number]).
        // As far as I could tolerate reading the code of the GWL abomination, the app/appinfo is
        // obtained using various "tricks" that I prefer not to implement.
        // I will wait until I'm willing to use (if ever) a newer version of Cinnamon as my main
        // system to see if the problem persist and if it can be fixed.
        const tracker = Cinnamon.WindowTracker.get_default();
        const app = tracker ? tracker.get_window_app(this.metaWindow) : null;

        this.appInfo = app ? app.get_app_info() : null;
        const actions = this.appInfo ? this.appInfo.list_actions() : [];

        if (actions.length) {
            const applicationActions = actions.map((aActionName) => {
                return {
                    localized_name: this.appInfo.get_action_name(aActionName),
                    name: aActionName
                };
            }).sort((a, b) => {
                a = Util.latinise(a.localized_name.toLowerCase());
                b = Util.latinise(b.localized_name.toLowerCase());
                return a > b;
            });

            let menuItem;
            let i = 0,
                iLen = applicationActions.length;
            for (; i < iLen; i++) {
                menuItem = new ApplicationActionMenuItem(
                    this,
                    // NOTE: The call to _() (gettext) is kind of redundant since the localized
                    // name should be provided by the desktop file. But it doesn't hurt having it.
                    _(applicationActions[i].localized_name),
                    applicationActions[i].name
                );
                this.addMenuItem(menuItem);
            }

            this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }
    }

    _populateMenu() {
        this.box.pack_start = this._launcher._applet.$._.invert_menu_items_order;

        const mw = this.metaWindow;
        let item;
        let amount;

        let subMenu;

        if (this._launcher._applet.$._.sub_menu_placement !== 0) {
            subMenu = new PopupMenu.PopupSubMenuMenuItem(_("Preferences"));
        }

        if (this._launcher._applet.$._.sub_menu_placement === 1) {
            this.addMenuItem(subMenu);
            this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }

        // Move to monitor
        if ((amount = Main.layoutManager.monitors.length) === 2) {
            Main.layoutManager.monitors.forEach((monitor, index) => {
                if (index === mw.get_monitor()) {
                    return;
                }
                item = new PopupMenu.PopupMenuItem(_("Move to the other monitor"));
                this._signals.connect(item, "activate", function() {
                    mw.move_to_monitor(index);
                });
                this.addMenuItem(item);
            }, this);
        } else if ((amount = Main.layoutManager.monitors.length) > 2) {
            Main.layoutManager.monitors.forEach((monitor, index) => {
                if (index === mw.get_monitor()) {
                    return;
                }
                item = new PopupMenu.PopupMenuItem(_("Move to monitor %d").format(index + 1));
                this._signals.connect(item, "activate", function() {
                    mw.move_to_monitor(index);
                });
                this.addMenuItem(item);
            }, this);
        }

        // Move to workspace
        if ((amount = global.screen.n_workspaces) > 1) {
            if (mw.is_on_all_workspaces()) {
                item = new PopupMenu.PopupMenuItem(_("Only on this workspace"));
                this._signals.connect(item, "activate", function() {
                    mw.unstick();
                });
                this.addMenuItem(item);
            } else {
                item = new PopupMenu.PopupMenuItem(_("Visible on all workspaces"));
                this._signals.connect(item, "activate", function() {
                    mw.stick();
                });
                this.addMenuItem(item);

                item = new PopupMenu.PopupSubMenuMenuItem(_("Move to another workspace"));
                this.addMenuItem(item);

                const activateEmittedFn = (aMetaWindow, aWorkspaceIndex) => {
                    return () => {
                        aMetaWindow.change_workspace(global.screen.get_workspace_by_index(aWorkspaceIndex));
                    };
                };

                const curr_index = mw.get_workspace().index();
                for (let i = 0; i < amount; i++) {
                    // Make the index a local variable to pass to function
                    const j = i;
                    const name = Main.workspace_names[i] ? Main.workspace_names[i] : Main._makeDefaultWorkspaceName(i);
                    const ws = new PopupMenu.PopupMenuItem(name);

                    if (i === curr_index) {
                        ws.setSensitive(false);
                    }

                    this._signals.connect(ws, "activate", activateEmittedFn(mw, j));
                    item.menu.addMenuItem(ws);
                }

            }
        }

        this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        if (this._launcher._applet.$._.show_additional_application_actions) {
            this._addAdditionalActions();
        }

        // Close all/others
        item = new PopupMenu.PopupIconMenuItem(_("Close all"), "application-exit", St.IconType.SYMBOLIC);
        this._signals.connect(item, "activate", function() {
            for (const window of this._windows) {
                if (window.actor.visible &&
                    !window._needsAttention) {
                    window.metaWindow.delete(global.get_current_time());
                }
            }
        }.bind(this));
        this.addMenuItem(item);

        item = new PopupMenu.PopupIconMenuItem(_("Close others"), "window-close", St.IconType.SYMBOLIC);
        this._signals.connect(item, "activate", function() {
            for (const window of this._windows) {
                if (window.actor.visible &&
                    window.metaWindow !== this.metaWindow &&
                    !window._needsAttention) {
                    window.metaWindow.delete(global.get_current_time());
                }
            }
        });
        this.addMenuItem(item);

        this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Miscellaneous
        if (mw.get_compositor_private().opacity !== 255) {
            item = new PopupMenu.PopupMenuItem(_("Restore to full opacity"));
            this._signals.connect(item, "activate", function() {
                mw.get_compositor_private().set_opacity(255);
            });
            this.addMenuItem(item);
        }

        if (mw.minimized) {
            item = new PopupMenu.PopupIconMenuItem(_("Restore"), "view-sort-descending", St.IconType.SYMBOLIC);
            this._signals.connect(item, "activate", function() {
                Main.activateWindow(mw, global.get_current_time());
            });
        } else {
            item = new PopupMenu.PopupIconMenuItem(_("Minimize"), "view-sort-ascending", St.IconType.SYMBOLIC);
            this._signals.connect(item, "activate", function() {
                mw.minimize();
            });
        }
        this.addMenuItem(item);

        if (mw.get_maximized()) {
            item = new PopupMenu.PopupIconMenuItem(_("Unmaximize"), "view-restore", St.IconType.SYMBOLIC);
            this._signals.connect(item, "activate", function() {
                mw.unmaximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
            });
        } else {
            item = new PopupMenu.PopupIconMenuItem(_("Maximize"), "view-fullscreen", St.IconType.SYMBOLIC);
            this._signals.connect(item, "activate", function() {
                mw.maximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
            });
        }
        this.addMenuItem(item);
        item.setSensitive(mw.can_maximize());

        item = new PopupMenu.PopupIconMenuItem(_("Close"), "edit-delete", St.IconType.SYMBOLIC);
        this._signals.connect(item, "activate", function() {
            mw.delete(global.get_current_time());
        });
        this.addMenuItem(item);

        if (this._launcher._applet.$._.sub_menu_placement === 2) {
            this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this.addMenuItem(subMenu);
        }

        if (this._launcher._applet.$._.sub_menu_placement !== 0) {
            item = new PopupMenu.PopupIconMenuItem(_("Help"), "dialog-information",
                St.IconType.SYMBOLIC);
            this._signals.connect(item, "activate", function() {
                launchUri(this._launcher._applet.$.metadata.path + "/HELP.html");
            }.bind(this));
            subMenu.menu.addMenuItem(item);

            item = new PopupMenu.PopupIconMenuItem(_("About..."), "dialog-question",
                St.IconType.SYMBOLIC);
            this._signals.connect(item, "activate", function() {
                this._launcher._applet.openAbout();
            }.bind(this));
            subMenu.menu.addMenuItem(item);

            item = new PopupMenu.PopupIconMenuItem(_("Configure..."), "system-run",
                St.IconType.SYMBOLIC);
            this._signals.connect(item, "activate", function() {
                this._launcher._applet.configureApplet();
            }.bind(this));
            subMenu.menu.addMenuItem(item);

            item = new PopupMenu.PopupIconMenuItem(
                _("Remove '%s'").format(_(this._launcher._applet.$.metadata.name)),
                "edit-delete",
                St.IconType.SYMBOLIC);
            this._signals.connect(item, "activate", function(aActor, aEvent) {
                this._launcher._applet.confirmRemoveApplet(aEvent);
            }.bind(this));
            subMenu.menu.addMenuItem(item);
        }
    }

    _onToggled(actor, isOpening) { // jshint ignore:line
        if (this.isOpen) {
            this._launcher._applet._menuOpen = true;
        } else {
            this._launcher._applet._menuOpen = false;
        }
    }

    toggle() {
        if (!this.isOpen) {
            this.removeAll();
            this._populateMenu();
        }

        super.toggle();
    }
};

var AppMenuButton = class AppMenuButton {
    constructor(applet, metaWindow, transient) {
        this.actor = new Cinnamon.GenericContainer({
            name: "appMenu",
            style_class: "window-list-item-box",
            reactive: true,
            can_focus: true,
            track_hover: true
        });

        this._applet = applet;
        this.metaWindow = metaWindow;
        this.transient = transient;
        const initially_urgent = transient || metaWindow.is_demanding_attention() || metaWindow.is_urgent();
        this.labelVisible = false;
        this._signals = new SignalManager.SignalManager();
        this.xid = metaWindow.get_xwindow();

        switch (this._applet.$.orientation) {
            case St.Side.TOP:
                this.actor.add_style_class_name("top");
                break;
            case St.Side.BOTTOM:
                this.actor.add_style_class_name("bottom");
                break;
            case St.Side.LEFT:
                this.actor.add_style_class_name("left");
                break;
            case St.Side.RIGHT:
                this.actor.add_style_class_name("right");
                break;
        }

        this.actor._delegate = this;
        this._signals.connect(this.actor, "button-release-event", function(aActor, aEvent) {
            this._onButtonRelease(aActor, aEvent);
        }.bind(this));
        this._signals.connect(this.actor, "button-press-event", function(aActor, aEvent) {
            this._onButtonPress(aActor, aEvent);
        }.bind(this));
        this._signals.connect(this.actor, "get-preferred-width", function(actor, forHeight, alloc) {
            this._getPreferredWidth(actor, forHeight, alloc);
        }.bind(this));
        this._signals.connect(this.actor, "get-preferred-height", function(actor, forWidth, alloc) {
            this._getPreferredHeight(actor, forWidth, alloc);
        }.bind(this));
        this._signals.connect(this.actor, "allocate", function(actor, box, flags) {
            this._allocate(actor, box, flags);
        }.bind(this));
        this._signals.connect(this.actor, "notify::allocation", function() {
            this.updateIconGeometry();
        }.bind(this));

        this.progressOverlay = new St.Widget({
            style_class: "progress",
            reactive: false,
            important: true
        });

        this.actor.add_actor(this.progressOverlay);

        this._iconBox = new Cinnamon.Slicer({
            name: "appMenuIcon"
        });
        this.actor.add_actor(this._iconBox);

        this._label = new St.Label();
        this.actor.add_actor(this._label);

        this.updateLabelVisible();

        this._visible = true;

        this._progress = 0;

        if (this.metaWindow.progress !== undefined) {
            this._progress = this.metaWindow.progress;
            if (this._progress > 0) {
                this.progressOverlay.show();
            } else {
                this.progressOverlay.hide();
            }
            this._updateProgressId = this.metaWindow.connect("notify::progress", () => {
                if (this.metaWindow.progress !== this._progress) {
                    this._progress = this.metaWindow.progress;

                    if (this._progress > 0) {
                        this.progressOverlay.show();
                    } else {
                        this.progressOverlay.hide();
                    }

                    this.actor.queue_relayout();
                }
            });
        } else {
            this.progressOverlay.hide();
        }

        /* TODO: this._progressPulse = this.metaWindow.progress_pulse; */

        this.onPreviewChanged();

        if (!this.transient) {
            this._menuManager = new PopupMenu.PopupMenuManager(this);
            this.rightClickMenu = new AppMenuButtonRightClickMenu(this, this.metaWindow, this._applet.$.orientation);
            this._menuManager.addMenu(this.rightClickMenu);

            this._draggable = DND.makeDraggable(this.actor, null, this._applet.actor);
            this._signals.connect(this._draggable, "drag-begin", function() {
                this._onDragBegin();
            }.bind(this));
            this._signals.connect(this._draggable, "drag-cancelled", function() {
                this._onDragCancelled();
            }.bind(this));
            this._signals.connect(this._draggable, "drag-end", function() {
                this._onDragEnd();
            }.bind(this));
        }

        this.onPanelEditModeChanged();
        this._signals.connect(global.settings, "changed::panel-edit-mode", function() {
            this.onPanelEditModeChanged();
        }.bind(this));

        this._windows = this._applet._windows;

        this.scrollConnector = null;
        this.onScrollModeChanged();
        this._needsAttention = false;

        this.setDisplayTitle();
        this.onFocus();
        this.setIcon();

        if (initially_urgent) {
            this.getAttention();
        }

        this._signals.connect(this.metaWindow, "notify::title", function() {
            this.setDisplayTitle();
        }.bind(this));
        this._signals.connect(this.metaWindow, "notify::minimized", function() {
            this.setDisplayTitle();
        }.bind(this));
        this._signals.connect(this.metaWindow, "notify::tile-type", function() {
            this.setDisplayTitle();
        }.bind(this));
        this._signals.connect(this.metaWindow, "icon-changed",
            function() {
                this.setIcon();
            }.bind(this)
        );
        this._signals.connect(this.metaWindow, "notify::appears-focused", function() {
            this.onFocus();
        }.bind(this));
        this._signals.connect(this.metaWindow, "unmanaged", function() {
            this.onUnmanaged();
        }.bind(this));
    }

    onUnmanaged() {
        this.destroy();
        this._windows.splice(this._windows.indexOf(this), 1);
    }

    onPreviewChanged() {
        if (this._tooltip) {
            this._tooltip.destroy();
        }

        if (this._applet.$._.window_preview) {
            this._tooltip = new WindowPreview(this, this.metaWindow, this._applet.$._.window_preview_scale, this._applet.$._.window_preview_show_label);
        } else {
            this._tooltip = new Tooltips.PanelItemTooltip(this, "", this._applet.$.orientation);
        }

        this.setDisplayTitle();
    }

    onPanelEditModeChanged() {
        const editMode = global.settings.get_boolean("panel-edit-mode");
        if (this._draggable) {
            this._draggable.inhibit = editMode;
        }
        this.actor.reactive = !editMode;
    }

    onScrollModeChanged() {
        if (this._applet.$._.enable_scrolling) {
            this.scrollConnector = this.actor.connect("scroll-event",
                (aActor, aEvent) => this._onScrollEvent(aActor, aEvent));
        } else {
            if (this.scrollConnector) {
                this.actor.disconnect(this.scrollConnector);
                this.scrollConnector = null;
            }
        }
    }

    _onScrollEvent(actor, event) {
        const direction = event.get_scroll_direction();

        // Find the current focused window
        let windows = this.actor.get_parent().get_children()
            .filter((item) => {
                return item.visible;
            }).map((item) => {
                return item._delegate;
            });

        windows = windows.reverse();

        let i = windows.length;
        while (i-- && !windows[i].metaWindow.has_focus()) {

            if (i === -1) {
                return;
            }

            //                   v   home-made xor
            if ((direction === 0) !== this._applet.$._.reverse_scrolling) {
                i++;
            } else {
                i--;
            }

            if (i === windows.length) {
                i = 0;
            } else if (i === -1) {
                i = windows.length - 1;
            }

            Main.activateWindow(windows[i].metaWindow, global.get_current_time());
        }
    }

    _onDragBegin() {
        if (this._applet.$.orientation === St.Side.TOP || this._applet.$.orientation === St.Side.BOTTOM) {
            this._draggable._overrideY = this.actor.get_transformed_position()[1];
            this._draggable._overrideX = null;
        } else {
            this._draggable._overrideX = this.actor.get_transformed_position()[0];
            this._draggable._overrideY = null;
        }

        this._tooltip.hide();
        this._tooltip.preventShow = true;
    }

    _onDragEnd() {
        this.actor.show();
        this._applet.clearDragPlaceholder();
        this._tooltip.preventShow = false;
    }

    _onDragCancelled() {
        this.actor.show();
        this._applet.clearDragPlaceholder();
        this._tooltip.preventShow = false;
    }

    getDragActor() {
        const clone = new Clutter.Clone({
            source: this.actor
        });
        clone.width = this.actor.width;
        clone.height = this.actor.height;
        return clone;
    }

    getDragActorSource() {
        return this.actor;
    }

    handleDragOver(source, actor, x, y, time) { // jshint ignore:line
        if (this._draggable && this._draggable.inhibit) {
            return DND.DragMotionResult.CONTINUE;
        }

        if (source instanceof AppMenuButton) {
            return DND.DragMotionResult.CONTINUE;
        }

        /* Users can drag things from one window to another window (eg drag an
         * image from Firefox to LibreOffice). However, if the target window is
         * hidden, they will drag to the AppWindowButton of the target window,
         * and we will open the window for them. */
        this._toggleWindow(true);
        return DND.DragMotionResult.NO_DROP;
    }

    acceptDrop(source, actor, x, y, time) { // jshint ignore:line
        return Clutter.EVENT_PROPAGATE;
    }

    setDisplayTitle() {
        let title = this.metaWindow.get_title();
        const tracker = Cinnamon.WindowTracker.get_default();
        const app = tracker.get_window_app(this.metaWindow);

        if (!title) {
            title = app ? app.get_name() : "?";
        }

        // Sanitize the window title to prevent dodgy window titles such as
        // "); DROP TABLE windows; --. Turn all whitespaces into " " because
        // newline characters are known to cause trouble. Also truncate the
        // title when necessary or else cogl might get unhappy and crash
        // Cinnamon.
        title = title.replace(/\s/g, " ");
        if (title.length > MAX_TEXT_LENGTH) {
            title = title.substr(0, MAX_TEXT_LENGTH);
        }

        if (this._tooltip && this._tooltip.set_text) {
            if ((this._applet.$._.window_preview && this._applet.$._.window_preview_show_label) ||
                (!this._applet.$._.window_preview && !this._applet.$._.hide_tooltips)) {
                this._tooltip.set_text(title);
            }
        }

        if (this.metaWindow.minimized) {
            title = "[" + title + "]";
        } else if (this.metaWindow.tile_type === Meta.WindowTileType.TILED) {
            title = "|" + title;
        } else if (this.metaWindow.tile_type === Meta.WindowTileType.SNAPPED) {
            title = "||" + title;
        }

        if (this._applet.$._.show_labels) {
            this._label.set_text(title);
        } else {
            this._label.set_text("");
        }
    }

    destroy() {
        this._signals.disconnectAllSignals();
        this._tooltip.destroy();

        if (!this.transient) {
            this.rightClickMenu.destroy();

            if (this._menuManager) {
                this._menuManager.destroy();
            }
        }

        this.actor.destroy();
    }

    _hasFocus() {
        if (this.metaWindow.minimized) {
            return false;
        }

        if (this.metaWindow.has_focus()) {
            return true;
        }

        let transientHasFocus = false;
        this.metaWindow.foreach_transient((transient) => { // jshint ignore:line
            if (transient.has_focus()) {
                transientHasFocus = true;
                return false;
            }
            return true;
        });
        return transientHasFocus;
    }

    onFocus() {
        if (this._hasFocus()) {
            this.actor.add_style_pseudo_class("focus");
            this.actor.remove_style_class_name("window-list-item-demands-attention");
            this.actor.remove_style_class_name("window-list-item-demands-attention-top");
            this._needsAttention = false;

            if (this.transient) {
                this.destroy();
                this._windows.splice(this._windows.indexOf(this), 1);
            }
        } else {
            this.actor.remove_style_pseudo_class("focus");
        }
    }

    _onButtonRelease(actor, event) {
        this._tooltip.hide();
        const button = event.get_button();

        if (this.transient) {
            if (button === Clutter.BUTTON_PRIMARY) {
                this._toggleWindow(false);
            }
            return Clutter.EVENT_PROPAGATE;
        }

        if (button === Clutter.BUTTON_PRIMARY) {
            if (this.rightClickMenu.isOpen) {
                this.rightClickMenu.toggle();
            }

            this._toggleWindow(false);
        } else if (button === Clutter.BUTTON_MIDDLE && this._applet.$._.middle_click_close) {
            this.metaWindow.delete(global.get_current_time());
        }

        return Clutter.EVENT_STOP;
    }

    _onButtonPress(actor, event) {
        this._tooltip.hide();

        if (!this.transient && event.get_button() === Clutter.BUTTON_SECONDARY) {
            this.rightClickMenu.mouseEvent = event;
            this.rightClickMenu.toggle();

            if (this._hasFocus()) {
                this.actor.add_style_pseudo_class("focus");
            }
        }
    }

    _toggleWindow(fromDrag) {
        if (!this._hasFocus()) {
            Main.activateWindow(this.metaWindow, global.get_current_time());
            this.actor.add_style_pseudo_class("focus");
        } else if (!fromDrag && this._applet.$._.left_click_minimize) {
            this.metaWindow.minimize();
            this.actor.remove_style_pseudo_class("focus");
        }
    }

    updateIconGeometry() {
        this._applet.$.schedule_manager.setTimeout("update_icon_geometry", function() {
            this._updateIconGeometryTimeout();
        }.bind(this), 50);
    }

    _updateIconGeometryTimeout() {
        let rect = new Meta.Rectangle();
        [rect.x, rect.y] = this.actor.get_transformed_position();
        [rect.width, rect.height] = this.actor.get_transformed_size();

        this.metaWindow.set_icon_geometry(rect);
    }

    _getPreferredWidth(actor, forHeight, alloc) {
        const [minSize, naturalSize] = this._iconBox.get_preferred_width(forHeight); // jshint ignore:line
        alloc.min_size = 1 * global.ui_scale;

        if (this._applet.$.orientation === St.Side.TOP || this._applet.$.orientation === St.Side.BOTTOM) {
            if (this.labelVisible) {
                if (this._applet.$._.buttons_use_entire_space) {
                    const [lminSize, lnaturalSize] = this._label.get_preferred_width(forHeight); // jshint ignore:line
                    const spacing = this.actor.get_theme_node().get_length("spacing");
                    alloc.natural_size = Math.max(150 * global.ui_scale,
                        naturalSize + spacing + lnaturalSize);
                } else {
                    alloc.natural_size = 150 * global.ui_scale;
                }
            } else {
                alloc.natural_size = naturalSize;
            }
        } else {
            alloc.natural_size = this._applet._panelHeight;
        }
    }

    _getPreferredHeight(actor, forWidth, alloc) {
        const [minSize1, naturalSize1] = this._iconBox.get_preferred_height(forWidth);

        if (this.labelVisible) {
            const [minSize2, naturalSize2] = this._label.get_preferred_height(forWidth); // jshint ignore:line
            alloc.min_size = Math.max(minSize1, minSize2);
        } else {
            alloc.min_size = minSize1;
        }

        if (this._applet.$.orientation === St.Side.TOP || this._applet.$.orientation === St.Side.BOTTOM) {
            /* putting a container around the actor for layout management reasons affects the allocation,
               causing the visible border to pull in close around the contents which is not the desired
               (pre-existing) behaviour, so need to push the visible border back towards the panel edge.
               Assigning the natural size to the full panel height used to cause recursion errors but seems fine now.
               If this happens to avoid this you can subtract 1 or 2 pixels, but this will give an unreactive
               strip at the edge of the screen */
            alloc.natural_size = this._applet._panelHeight;
        } else {
            alloc.natural_size = naturalSize1;
        }
    }

    _allocate(actor, box, flags) {
        const allocWidth = box.x2 - box.x1;
        const allocHeight = box.y2 - box.y1;

        const childBox = new Clutter.ActorBox();

        let [minWidth, minHeight, naturalWidth, naturalHeight] = this._iconBox.get_preferred_size();

        const direction = this.actor.get_text_direction();
        const spacing = Math.floor(this.actor.get_theme_node().get_length("spacing"));
        let yPadding = Math.floor(Math.max(0, allocHeight - naturalHeight) / 2);

        childBox.y1 = box.y1 + yPadding;
        childBox.y2 = childBox.y1 + Math.min(naturalHeight, allocHeight);

        if (this.labelVisible) {
            if (direction === Clutter.TextDirection.LTR) {
                childBox.x1 = box.x1;
            } else {
                childBox.x1 = Math.max(box.x1, box.x2 - naturalWidth);
            }
            childBox.x2 = Math.min(childBox.x1 + naturalWidth, box.x2);
        } else {
            childBox.x1 = box.x1 + Math.floor(Math.max(0, allocWidth - naturalWidth) / 2);
            childBox.x2 = Math.min(childBox.x1 + naturalWidth, box.x2);
        }
        this._iconBox.allocate(childBox, flags);

        if (this.labelVisible) {
            [minWidth, minHeight, naturalWidth, naturalHeight] = this._label.get_preferred_size();

            yPadding = Math.floor(Math.max(0, allocHeight - naturalHeight) / 2);
            childBox.y1 = box.y1 + yPadding;
            childBox.y2 = childBox.y1 + Math.min(naturalHeight, allocHeight);
            if (direction === Clutter.TextDirection.LTR) {
                // Reuse the values from the previous allocation
                childBox.x1 = Math.min(childBox.x2 + spacing, box.x2);
                childBox.x2 = box.x2;
            } else {
                childBox.x2 = Math.max(childBox.x1 - spacing, box.x1);
                childBox.x1 = box.x1;
            }

            this._label.allocate(childBox, flags);
        }

        if (!this.progressOverlay.visible) {
            return;
        }

        childBox.x1 = 0;
        childBox.y1 = 0;
        childBox.x2 = this.actor.width;
        childBox.y2 = this.actor.height;

        this.progressOverlay.allocate(childBox, flags);

        const clip_width = Math.max((this.actor.width) * (this._progress / 100.0), 1.0);
        this.progressOverlay.set_clip(0, 0, clip_width, this.actor.height);
    }

    updateLabelVisible() {
        if (this._applet.$._.show_labels &&
            (this._applet.$.orientation === St.Side.TOP || this._applet.$.orientation === St.Side.BOTTOM)) {
            this._label.show();
            this.labelVisible = true;
        } else {
            this._label.hide();
            this.labelVisible = false;
        }
    }

    setIcon() {
        const tracker = Cinnamon.WindowTracker.get_default();
        const app = tracker.get_window_app(this.metaWindow);

        this.icon_size = this._applet.icon_size;

        const icon = app ?
            app.create_icon_texture_for_window(this.icon_size, this.metaWindow) :
            new St.Icon({
                icon_name: "application-default-icon",
                icon_type: St.IconType.FULLCOLOR,
                icon_size: this.icon_size
            });

        const old_child = this._iconBox.get_child();
        this._iconBox.set_child(icon);

        if (old_child) {
            old_child.destroy();
        }
    }

    getAttention() {
        if (this._needsAttention) {
            return false;
        }

        this._needsAttention = true;
        this._flashButton();
        return true;
    }

    _flashButton() {
        if (!this._needsAttention) {
            return;
        }

        let counter = 0;
        const sc = "window-list-item-demands-attention";

        Mainloop.timeout_add(FLASH_INTERVAL, () => {
            if (!this._needsAttention) {
                return false;
            }

            if (this.actor.has_style_class_name(sc)) {
                this.actor.remove_style_class_name(sc);
            } else {
                this.actor.add_style_class_name(sc);
            }

            return counter++ < FLASH_MAX_COUNT;
        });
    }
};

var ApplicationActionMenuItem = class ApplicationActionMenuItem extends PopupMenu.PopupMenuItem {
    constructor(aAppButton, aLabel, aAction) {
        super(aLabel);

        this._appButton = aAppButton;
        this._action = aAction;
    }

    activate(event) { // jshint ignore:line
        if (this._appButton.appInfo !== null) {
            // NOTE: The call to Mainloop.idle_add() is to add an "artificial delay" so the
            // menu itself doesn't interfere with the application action being launched.
            // For example, without the delay, the absolutely retarded gnome-screenshot will
            // capture the menu when taking a screenshot of the screen or the current window.
            this.$.schedule_manager.idleCall("activate", function() {
                this._appButton.appInfo.launch_action(this._action,
                    global.create_app_launch_context());
            }.bind(this));
        }

        super.activate();
    }
};

Debugger.wrapObjectMethods({
    ApplicationActionMenuItem: ApplicationActionMenuItem,
    AppMenuButton: AppMenuButton,
    AppMenuButtonRightClickMenu: AppMenuButtonRightClickMenu,
    WindowPreview: WindowPreview
});
