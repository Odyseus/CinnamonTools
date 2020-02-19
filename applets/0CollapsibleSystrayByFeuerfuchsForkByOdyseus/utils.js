//{{IMPORTER}}

const GlobalUtils = __import("globalUtils.js");
const DebugManager = __import("debugManager.js");

const {
    gi: {
        Clutter,
        Gio,
        St
    },
    mainloop: Mainloop,
    misc: {
        signalManager: SignalManager
    },
    ui: {
        applet: Applet,
        main: Main,
        popupMenu: PopupMenu
    }
} = imports;

const {
    CINNAMON_VERSION,
    versionCompare
} = GlobalUtils;

var Debugger = new DebugManager.DebugManager();

const ICON_SCALE_FACTOR = 0.8; // for custom panel heights, 20 (default icon size) / 25 (default panel height)
const DEFAULT_ICON_SIZE = 20;
const DEFAULT_PANEL_HEIGHT = Applet.DEFAULT_PANEL_HEIGHT;
const PANEL_SYMBOLIC_ICON_DEFAULT_HEIGHT = Applet.PANEL_SYMBOLIC_ICON_DEFAULT_HEIGHT;
const CINN_3_2_PLUS = versionCompare(CINNAMON_VERSION, "3.2.0") >= 0;
const CINN_3_4_PLUS = versionCompare(CINNAMON_VERSION, "3.4.0") >= 0;
const CINN_4_0_PLUS = versionCompare(CINNAMON_VERSION, "4.0.0") >= 0;

function CSCollapseBtn() {
    this._init.apply(this, arguments);
}

CSCollapseBtn.prototype = {
    _init: function(applet) {
        this._applet = applet;
        this.actor = new St.Button({
            style_class: "applet-box"
        });
        this.icon = new St.Icon({
            reactive: true,
            track_hover: true,
            style_class: "applet-icon"
        });

        this.actor.set_child(this.icon);

        this.setIsExpanded(true);
    },

    /*
     * Set the icon using it's qualified name
     */
    setIcon: function(name) {
        this.icon.set_icon_name(name);
        this.icon.set_icon_type(St.IconType.SYMBOLIC);
        this._setStyle();
    },

    /*
     * Set the icon using a file path
     */
    setIconFile: function(iconFile) {
        try {
            this.icon.set_gicon(new Gio.FileIcon({
                file: iconFile
            }));
            this.icon.set_icon_type(St.IconType.SYMBOLIC);
            this._setStyle();
        } catch (e) {
            global.log(e);
        }
    },

    /*
     *
     */
    _setStyle: function() {
        try {
            let symb_scaleup = ((this._applet._panelHeight / DEFAULT_PANEL_HEIGHT) * PANEL_SYMBOLIC_ICON_DEFAULT_HEIGHT) / global.ui_scale;
            this.icon.set_icon_size(this._applet._legacyScaleMode ? symb_scaleup : -1);
        } catch (aErr) {
            //
        }

        this.icon.set_style_class_name("system-status-icon");
    },

    /*
     * Set expanded state and refresh the icon
     */
    setIsExpanded: function(state) {
        let iconName = state ? this._applet.collapseIcon : this._applet.expandIcon;
        if (!iconName) {
            return;
        }

        let iconFile = Gio.File.new_for_path(iconName);
        if (iconFile.query_exists(null)) {
            this.setIconFile(iconFile);
        } else {
            this.setIcon(iconName);
        }
    }
};

function CSRemovableSwitchMenuItem() {
    this._init.apply(this, arguments);
}

CSRemovableSwitchMenuItem.prototype = {
    __proto__: PopupMenu.PopupSwitchMenuItem.prototype,

    _init: function(text, active, params) {
        PopupMenu.PopupSwitchMenuItem.prototype._init.call(this, text, active, params);

        let iconDelete = new St.Icon({
            icon_name: "edit-delete",
            icon_type: St.IconType.SYMBOLIC,
            style_class: "popup-menu-icon"
        });
        this.deleteButton = new St.Button({
            child: iconDelete
        });
        this.deleteButton.connect("clicked", () => this.remove());

        this.removeActor(this._statusBin);
        this._statusBin.destroy();

        this._statusBin = new St.BoxLayout({
            vertical: false,
            style: "spacing: 6px;",
            x_align: St.Align.END
        });
        this.addActor(this._statusBin, {
            expand: true,
            span: -1,
            align: St.Align.END
        });
        this._statusBin.add(this._switch.actor);
        this._statusBin.add(this.deleteButton);
    },

    /*
     * User clicked the "remove" button
     */
    remove: function() {
        this.emit("remove");
        this.destroy();
    }
};

// Override the factory and create an AppletPopupMenu instead of a PopupMenu
function IndicatorMenuFactory() {
    this._init.apply(this, arguments);
}

IndicatorMenuFactory.prototype = {
    __proto__: PopupMenu.PopupMenuFactory.prototype,

    _init: function() {
        PopupMenu.PopupMenuFactory.prototype._init.call(this);
    },

    _createShellItem: function(factoryItem, launcher, orientation) {
        // Decide whether it's a submenu or not
        let shellItem = null;
        let item_type = factoryItem.getFactoryType();
        if (item_type == PopupMenu.FactoryClassTypes.RootMenuClass) {
            shellItem = new Applet.AppletPopupMenu(launcher, orientation);
        }
        if (item_type == PopupMenu.FactoryClassTypes.SubMenuMenuItemClass) {
            shellItem = new PopupMenu.PopupSubMenuMenuItem("FIXME");
        } else if (item_type == PopupMenu.FactoryClassTypes.MenuSectionMenuItemClass) {
            shellItem = new PopupMenu.PopupMenuSection();
        } else if (item_type == PopupMenu.FactoryClassTypes.SeparatorMenuItemClass) {
            shellItem = new PopupMenu.PopupSeparatorMenuItem("");
        } else if (item_type == PopupMenu.FactoryClassTypes.MenuItemClass) {
            shellItem = new PopupMenu.PopupIndicatorMenuItem("FIXME");
        }
        return shellItem;
    }
};

function CollapsibleSystrayByFeuerfuchsForkByOdyseusApplet() {
    this._init.apply(this, arguments);
}

CollapsibleSystrayByFeuerfuchsForkByOdyseusApplet.prototype = {
    __proto__: Applet.Applet.prototype,

    _init: function(metadata, orientation, panel_height, instance_id) {
        Applet.Applet.prototype._init.call(this, orientation, panel_height, instance_id);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.actor.remove_style_class_name("applet-box");

        if (CINN_3_4_PLUS) {
            this.actor.set_style_class_name("systray");
            this.actor.set_important(true); // ensure we get class details from the default theme if not present
        } else {
            this.actor.style = "spacing: 5px;";
        }

        this._signalManager = new SignalManager.SignalManager(null);
        let manager;

        this.orientation = orientation;

        if (this.orientation == St.Side.TOP || this.orientation == St.Side.BOTTOM) {
            manager = new Clutter.BoxLayout({
                spacing: 2 * global.ui_scale,
                orientation: Clutter.Orientation.HORIZONTAL
            });
        } else {
            manager = new Clutter.BoxLayout({
                spacing: 2 * global.ui_scale,
                orientation: Clutter.Orientation.VERTICAL
            });
        }
        this.manager = manager;
        this.manager_container = new Clutter.Actor({
            layout_manager: manager
        });
        this.actor.add_actor(this.manager_container);
        this.manager_container.show();

        this._statusItems = [];
        this._shellIndicators = {};
        this.menuFactory = new IndicatorMenuFactory();
        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this._signalAdded = 0;
        this._signalRemoved = 0;
    },

    _addIndicatorSupport: function() {
        let manager = Main.indicatorManager;

        // Blacklist some of the icons
        // quassel: The proper icon in Quassel is "QuasselIRC",
        // this is a fallback icon which Quassel launches when it fails to detect
        // our indicator support (i.e. when Cinnamon is restarted for instance)
        // The problem is.. Quassel doesn't kill that icon when it creates QuasselIRC again..
        //
        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (typeof manager.insertInBlackList === "function") {
            manager.insertInBlackList("quassel");
        }

        let currentIndicators = manager.getIndicatorIds();
        for (let pos in currentIndicators) {
            if (!manager.isInBlackList(currentIndicators[pos])) {
                let appIndicator = manager.getIndicatorById(currentIndicators[pos]);
                // Condition needed for retro-compatibility.
                // Mark for deletion on EOL. Cinnamon 3.2.x+
                if (CINN_3_2_PLUS) {
                    this._onIndicatorAddedNew(manager, appIndicator);
                } else {
                    this._onIndicatorAddedOld(manager, appIndicator);
                }
            }
        }
        if (this._signalAdded === 0) {
            this._signalAdded = manager.connect("indicator-added",
                // Condition needed for retro-compatibility.
                // Mark for deletion on EOL. Cinnamon 3.2.x+
                (manager, appIndicator) => {
                    CINN_3_2_PLUS ?
                        this._onIndicatorAddedNew(manager, appIndicator) :
                        this._onIndicatorAddedOld(manager, appIndicator);
                }
            );
        }
        if (this._signalRemoved === 0) {
            this._signalRemoved = manager.connect("indicator-removed",
                (manager, appIndicator) => this._onIndicatorRemoved(manager, appIndicator)
            );
        }
    },

    _onIndicatorAddedNew: function(manager, appIndicator) {
        if (!(appIndicator.id in this._shellIndicators)) {
            let size = null;
            if (this._legacyScaleMode) {
                size = this._getIconSize();
            }

            let indicatorActor = appIndicator.getActor(size);
            indicatorActor._applet = this;

            this._shellIndicators[appIndicator.id] = indicatorActor;
            this._signalManager.connect(indicatorActor.actor, "destroy", function(aActor) {
                this._onIndicatorIconDestroy(aActor);
            }.bind(this));
            this._signalManager.connect(indicatorActor.actor, "enter-event", function(aActor, aEvent) {
                this._onEnterEvent(aActor, aEvent);
            }.bind(this));
            this._signalManager.connect(indicatorActor.actor, "leave-event", function(aActor, aEvent) {
                this._onLeaveEvent(aActor, aEvent);
            }.bind(this));

            this.manager_container.add_actor(indicatorActor.actor);

            appIndicator.createMenuClientAsync((client) => {
                if (client !== null) {
                    let newMenu = client.getShellMenu();
                    if (!newMenu) {
                        newMenu = this.menuFactory.buildShellMenu(client, indicatorActor, this.orientation);
                        this.menuManager.addMenu(newMenu);
                    }
                    indicatorActor.setMenu(newMenu);
                }
            });
        }
    },

    _removeIndicatorSupport: function() {
        if (this.signalAdded) {
            Main.indicatorManager.disconnect(this.signalAdded);
            this.signalAdded = 0;
        }
        if (this.signalRemoved) {
            Main.indicatorManager.disconnect(this.signalRemoved);
            this.signalRemoved = 0;
        }

        for (let id in this._shellIndicators) {
            this._shellIndicators[id].destroy();
        }

        this._shellIndicators = {};

    },

    // Needed for retro-compatibility.
    // Mark for deletion on EOL. Cinnamon 3.2.x+
    _onIndicatorAddedOld: function(manager, appIndicator) {
        if (!(appIndicator.id in this._shellIndicators)) {
            let hiddenIcons = Main.systrayManager.getRoles();

            if (hiddenIcons.indexOf(appIndicator.id) !== -1) {
                // We've got an applet for that
                return;
            } else if (["quassel"].indexOf(appIndicator.id) !== -1) {
                // Blacklist some of the icons
                // quassel: The proper icon in Quassel is "QuasselIRC", this is a fallback icon which Quassel launches when it fails to detect
                // our indicator support (i.e. when Cinnamon is restarted for instance)
                // The problem is.. Quassel doesn't kill that icon when it creates QuasselIRC again..
                return;
            } else {
                // global.log("Adding indicator: " + appIndicator.id);
            }

            let iconActor = appIndicator.getIconActor(this._getIndicatorSize(appIndicator));
            iconActor._applet = this;

            this._shellIndicators[appIndicator.id] = iconActor;

            this.manager_container.add_actor(iconActor.actor);
            appIndicator.createMenuClientAsync((client) => {
                if (client !== null) {
                    let newMenu = client.getShellMenu();
                    if (!newMenu) {
                        newMenu = this.menuFactory.buildShellMenu(client, iconActor, this._applet_context_menu._arrowSide);
                        this.menuManager.addMenu(newMenu);
                    }
                    iconActor.setMenu(newMenu);
                }
            });
        }
    },

    // Needed for retro-compatibility.
    // Mark for deletion on EOL. Cinnamon 4.0.x+
    get _legacyScaleMode() {
        if (CINN_4_0_PLUS) {
            return true;
        } else {
            return this._scaleMode;
        }
    },

    _getIndicatorSize: function(appIndicator) { // jshint ignore:line
        if (this._legacyScaleMode) {
            return this._panelHeight * ICON_SCALE_FACTOR / global.ui_scale;
        }
        return 16;
    },

    _onEnterEvent: function(actor, event) { // jshint ignore:line
        this.set_applet_tooltip(actor._delegate.getToolTip());
    },

    _onLeaveEvent: function(actor, event) { // jshint ignore:line
        this.set_applet_tooltip("");
    },

    _onIndicatorIconDestroy: function(actor) {
        for (let id in this._shellIndicators) {
            if (this._shellIndicators[id].actor == actor) {
                delete this._shellIndicators[id];
                break;
            }
        }
    },

    _getIconSize: function() {
        let size;
        let disp_size = this._panelHeight * ICON_SCALE_FACTOR;
        if (disp_size < 22) {
            size = 16;
        } else if (disp_size < 32) {
            size = 22;
        } else if (disp_size < 48) {
            size = 32;
        } else {
            size = 48;
        }
        return size;
    },

    _onIndicatorRemoved: function(manager, appIndicator) {
        if (appIndicator.id in this._shellIndicators) {
            let indicatorActor = this._shellIndicators[appIndicator.id];
            delete this._shellIndicators[appIndicator.id];
            indicatorActor.destroy();
        }
    },

    on_applet_clicked: function(event) {}, // jshint ignore:line

    //
    // override getDisplayLayout to declare that this applet is suitable for both horizontal and
    // vertical orientations
    //
    getDisplayLayout: function() {
        return Applet.DisplayLayout.BOTH;
    },

    on_orientation_changed: function(neworientation) {
        if (neworientation == St.Side.TOP || neworientation == St.Side.BOTTOM) {
            this.manager.set_vertical(false);
        } else {
            this.manager.set_vertical(true);
        }
    },

    on_applet_removed_from_panel: function() {
        this._signalManager.disconnectAllSignals();
        this._removeIndicatorSupport();
    },

    on_applet_added_to_panel: function() {
        Main.statusIconDispatcher.start(this.actor.get_parent().get_parent());

        this._signalManager.connect(Main.statusIconDispatcher, "status-icon-added",
            function(o, icon, role) {
                this._onTrayIconAdded(o, icon, role);
            }.bind(this)
        );
        this._signalManager.connect(Main.statusIconDispatcher, "status-icon-removed",
            function(o, icon) {
                this._onTrayIconRemoved(o, icon);
            }.bind(this)
        );
        this._signalManager.connect(Main.statusIconDispatcher, "before-redisplay",
            function() {
                this._onBeforeRedisplay();
            }.bind(this)
        );
        this._signalManager.connect(Main.systrayManager, "changed",
            function() {
                Main.statusIconDispatcher.redisplay();
            }.bind(Main.statusIconDispatcher)
        );
        this._addIndicatorSupport();
    },

    on_panel_height_changed: function() {
        Main.statusIconDispatcher.redisplay();

        if (CINN_3_2_PLUS) {
            let size = null;

            if (this._legacyScaleMode) {
                size = this._getIconSize();
            }

            for (let id in this._shellIndicators) {
                let indicator = Main.indicatorManager.getIndicatorById(id);
                if (indicator) {
                    this._shellIndicators[id].setSize(size);
                }
            }
        } else {
            for (let id in this._shellIndicators) {
                let indicator = Main.indicatorManager.getIndicatorById(id);
                if (indicator) {
                    let size = this._getIndicatorSize(indicator);
                    this._shellIndicators[id].setSize(size);
                }
            }
        }
    },

    _onBeforeRedisplay: function() {
        // Mark all icons as obsolete
        // There might still be pending delayed operations to insert/resize of them
        // And that would crash Cinnamon
        for (let i = 0; i < this._statusItems.length; i++) {
            this._statusItems[i].obsolete = true;
        }
        this._statusItems = [];

        let children = this.manager_container.get_children().filter((child) => {
            // We are only interested in the status icons and apparently we can not ask for
            // child instanceof CinnamonTrayIcon.
            return (child.toString().indexOf("CinnamonTrayIcon") !== -1);
        });
        for (let i = 0; i < children.length; i++) {
            children[i].destroy();
        }
    },

    _onTrayIconAdded: function(o, icon, role) {
        try {
            let hiddenIcons = Main.systrayManager.getRoles();

            if (hiddenIcons.indexOf(role) !== -1) {
                // We've got an applet for that
                return;
            }

            if (icon.get_parent()) {
                icon.get_parent().remove_child(icon);
            }

            icon.obsolete = false;
            this._statusItems.push(icon);

            if (["pidgin"].indexOf(role) !== -1) {
                // Delay pidgin insertion by 10 seconds
                // Pidgin is very weird.. it starts with a small icon
                // Then replaces that icon with a bigger one when the connection is established
                // Pidgin can be fixed by inserting or resizing after a delay
                // The delay is big because resizing/inserting too early
                // makes pidgin invisible (in absence of disk cache).. even if we resize/insert again later
                this._insertStatusItemLater(role, icon, -1, 10000);
            } else if (["shutter", "filezilla", "dropbox", "thunderbird", "unknown", "blueberry-tray.py", "mintupdate.py"].indexOf(role) !== -1) {
                // Delay insertion by 1 second
                // This fixes an invisible icon in the absence of disk cache for : shutter
                // filezilla, dropbox, thunderbird, blueberry, mintupdate are known to show up in the wrong size or position, this should fix them as well
                // Note: as of Oct 2015, the dropbox systray is calling itself "unknown"
                this._insertStatusItemLater(role, icon, -1, 1000);
            } else {
                // Delay all other apps by 1 second...
                // For many of them, we don't need to do that,
                // It's a small delay though and that fixes most buggy apps
                // And we're far from having an exhaustive list of them..
                this._insertStatusItemLater(role, icon, -1, 1000);
            }

        } catch (e) {
            global.logError(e);
        }
    },

    _insertStatusItemLater: function(role, icon, position, delay) {
        // Inserts an icon in the systray after a delay (useful for buggy icons)
        // Delaying the insertion of pidgin by 10 seconds for instance is known to fix it on empty disk cache
        let timerId = Mainloop.timeout_add(delay, () => {
            this._insertStatusItem(role, icon, position);
            Mainloop.source_remove(timerId);
        });
    },

    _onTrayIconRemoved: function(o, icon) {
        icon.obsolete = true;
        for (let i = 0; i < this._statusItems.length; i++) {
            if (this._statusItems[i] == icon) {
                this._statusItems.splice(i, 1);
            }
        }
        this.manager_container.remove_child(icon);
        icon.destroy();
    },

    _insertStatusItem: function(role, icon, position) {
        if (icon.obsolete === true) {
            return;
        }
        let children = this.manager_container.get_children().filter((child) => {
            // We are only interested in the status icons and apparently we can not ask for
            // child instanceof CinnamonTrayIcon.
            return (child.toString().indexOf("CinnamonTrayIcon") !== -1);
        });
        let i;
        for (i = children.length - 1; i >= 0; i--) {
            let rolePosition = children[i]._rolePosition;
            if (position > rolePosition) {
                this.manager_container.insert_child_at_index(icon, i + 1);
                break;
            }
        }
        if (i == -1) {
            // If we didn't find a position, we must be first
            this.manager_container.insert_child_at_index(icon, 0);
        }
        icon._rolePosition = position;

        if (this._legacyScaleMode) {
            let timerId = Mainloop.timeout_add(500, () => {
                this._resizeStatusItem(role, icon);
                Mainloop.source_remove(timerId);
            });
        } else {
            icon.set_pivot_point(0.5, 0.5);
            icon.set_scale((DEFAULT_ICON_SIZE * global.ui_scale) / icon.width,
                (DEFAULT_ICON_SIZE * global.ui_scale) / icon.height);
        }
    },

    _resizeStatusItem: function(role, icon) {
        if (icon.obsolete === true) {
            return;
        }

        if (["shutter", "filezilla"].indexOf(role) !== -1) {
            // global.log("Not resizing " + role + " as it's known to be buggy (" + icon.get_width() + "x" + icon.get_height() + "px)");
        } else {
            let size = this._getIconSize();
            icon.set_size(size, size);
            // global.log("Resized " + role + " with normalized size (" + icon.get_width() + "x" + icon.get_height() + "px)");
            // Note: dropbox doesn't scale, even though we resize it...
        }
    }

};

DebugManager.wrapObjectMethods(Debugger, {
    CollapsibleSystrayByFeuerfuchsForkByOdyseusApplet: CollapsibleSystrayByFeuerfuchsForkByOdyseusApplet,
    CSCollapseBtn: CSCollapseBtn,
    CSRemovableSwitchMenuItem: CSRemovableSwitchMenuItem,
    IndicatorMenuFactory: IndicatorMenuFactory
});
