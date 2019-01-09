const AppletUUID = "{{UUID}}";

let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets[AppletUUID].utils;
}

const _ = $._;
const Settings = $.Settings;

const {
    gi: {
        GLib,
        St
    },
    mainloop: Mainloop,
    misc: {
        util: Util
    },
    ui: {
        applet: Applet,
        main: Main,
        popupMenu: PopupMenu
    }
} = imports;

function WallpaperChangerApplet() {
    this._init.apply(this, arguments);
}

WallpaperChangerApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    appletActivationAllowed: true,
    _init: function(aMetadata, aOrientation, aPanel_height, aInstance_id) {
        Applet.TextIconApplet.prototype._init.call(this, aOrientation, aPanel_height, aInstance_id);

        if ($.versionCompare($.CINNAMON_VERSION, "3.0") < 0) {
            this.appletActivationAllowed = false;
            $.informAndDisable(aInstance_id);
            return;
        }

        $.debug("Initializing applet version: %s".format(aMetadata.version));

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.orientation = aOrientation;
        this.metadata = aMetadata;
        this.instance_id = aInstance_id;
        let baseKeybindingName = this.metadata.uuid + "-" + this.instance_id;
        this.next_wall_keybinding_name = baseKeybindingName + "-next-wallpaper";
        this.prev_wall_keybinding_name = baseKeybindingName + "-prev-wallpaper";
        this.menu_keybinding_name = baseKeybindingName + "-menu";

        try {
            this._daemon = new $.WallChangerDaemon();
            this._bindSettings();
            this._expandAppletContextMenu();
        } catch (aErr) {
            global.logError(aErr);
        }

        Mainloop.idle_add(() => {
            try {
                this._add_context_menu_id = 0;
                this._daemon_changed_id = 0;
                this._daemon_error_id = 0;

                this.set_applet_tooltip(_(this.metadata.name));
                this._updateIconAndLabel();
                this._startConnections();

                this.menuManager = new PopupMenu.PopupMenuManager(this);
                this.menu = new Applet.AppletPopupMenu(this, aOrientation);
                this.menuManager.addMenu(this.menu);

                this._buildMenu();

                if (!this._daemon.is_running && Settings.auto_start) {
                    // Run if auto start is enabled and its not already running
                    this._daemon.toggle();
                }
            } catch (aErr) {
                global.logError(aErr);
            }
        });
    },

    _buildMenu: function() {
        this.menu.box.pack_start = Settings.invert_menu_items_order;

        if (this.wallChangerControls) {
            this.wallChangerControls.destroy();
        }

        this.menu.removeAll();

        // Stored so I can use it for the keybindings creation.
        this.wallChangerControls = new $.WallChangerControls(this._daemon.bus);

        let subMenu = new PopupMenu.PopupSubMenuMenuItem(_("Extra Options"));
        subMenu.menu.connect("open-state-changed",
            (aMenu, aOpen) => this._subMenuOpenStateChanged(aMenu, aOpen));
        subMenu.menu.addMenuItem(new $.WallChangerDaemonControl(this._daemon));
        subMenu.menu.addMenuItem(new $.WallChangerSwitch(
            _("Auto Start Daemon"),
            _("When enabled, the daemon will be automatically started when the applet is loaded. If it is already running or this is disabled, no action will be taken."),
            "auto-start"
        ));
        subMenu.menu.addMenuItem(new $.WallChangerSwitch(
            _("Change with Profile"),
            _("When enabled, this will cause the daemon to automatically change the wallpaper whenever the current profile is changed."),
            "auto-rotate"
        ));
        subMenu.menu.addMenuItem(new $.WallChangerSwitch(
            _("Notifications"),
            _("Display a notification each time an event happens with wallpaper changer. This does not stop the applet from reporting errors."),
            "notifications"
        ));
        subMenu.menu.addMenuItem(new $.WallChangerSwitch(
            _("Remember Profile State"),
            _("When enabled, the daemon will remember its current and next wallpaper for the current profile when the profile is changed. This means returning back to the profile will restore the previous background plus the next in queue."),
            "remember-profile-state"
        ));

        // Start insertions
        this.menu.addMenuItem(new $.WallChangerPreviewMenuItem(this._daemon));
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(new $.WallChangerOpenCurrent());
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(this.wallChangerControls);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(subMenu);
        this.menu.addMenuItem(new $.WallChangerProfile(true));

        this._updateKeybindings();
    },

    _subMenuOpenStateChanged: function(aMenu, aOpen) {
        if (aOpen) {
            let children = aMenu._getTopMenu()._getMenuItems();
            let i = 0,
                iLen = children.length;
            for (; i < iLen; i++) {
                let item = children[i];

                if (item instanceof PopupMenu.PopupSubMenuMenuItem ||
                    item instanceof $.WallChangerProfile) {
                    if (aMenu !== item.menu) {
                        item.menu.close(true);
                    }
                }
            }
        }
    },

    _updateKeybindings: function() {
        Main.keybindingManager.removeHotKey(this.next_wall_keybinding_name);
        Main.keybindingManager.removeHotKey(this.prev_wall_keybinding_name);
        Main.keybindingManager.removeHotKey(this.menu_keybinding_name);

        if (Boolean(Settings.next_wallpaper_shortcut) && this.wallChangerControls) {
            Main.keybindingManager.addHotKey(
                this.next_wall_keybinding_name,
                Settings.next_wallpaper_shortcut + "::",
                () => this.wallChangerControls.next()
            );
        }

        if (Boolean(Settings.prev_wallpaper_shortcut) && this.wallChangerControls) {
            Main.keybindingManager.addHotKey(
                this.prev_wall_keybinding_name,
                Settings.prev_wallpaper_shortcut + "::",
                () => this.wallChangerControls.prev()
            );
        }

        if (Boolean(Settings.toggle_menu_shortcut) && this.wallChangerControls) {
            Main.keybindingManager.addHotKey(
                this.menu_keybinding_name,
                Settings.toggle_menu_shortcut + "::",
                () => this._toggleMenu()
            );
        }
    },

    _startConnections: function() {
        this._daemon_changed_id = this._daemon.connectSignal("changed",
            (emitter, signalName, parameters) => {
                if (Settings.notifications) {
                    Main.notify(_(this.metadata.name), _("Wallpaper Changed") +
                        ": " + parameters[0]);
                }
            });

        this._daemon_error_id = this._daemon.connectSignal("error",
            (emitter, signalName, parameters) => {
                Main.notifyError(_(this.metadata.name), _("Daemon Error") +
                    ": " + parameters[0]);
            });
    },

    _bindSettings: function() {
        $.connectSettings([
            "notifications"
        ], () => {
            // TO TRANSLATORS: Full sentence:
            // "Notifications are now enabled/disabled"
            Main.notify(_(this.metadata.name), _("Notifications are now %s")
                // TO TRANSLATORS: Full sentence:
                // "Notifications are now enabled/disabled"
                .format((Settings.notifications) ? _("enabled") : _("disabled")));
        });

        $.connectSettings([
            "toggle-daemon"
        ], this._daemon.toggle);

        $.connectSettings([
            "custom-applet-label",
            "custom-applet-icon"
        ], this._updateIconAndLabel);

        $.connectSettings([
            "current-profile"
        ], () => {
            if (Settings.notifications) {
                Main.notify(_(this.metadata.name), _("Profile changed to %s")
                    .format(Settings.current_profile));
            }
        });

        $.connectSettings([
            "next-wallpaper-shortcut",
            "prev-wallpaper-shortcut",
            "toggle-menu-shortcut"
        ], this._updateKeybindings);

        $.connectSettings([
            "wallpaper-preview-width",
            "invert-menu-items-order"
        ], this._buildMenu);
    },

    _expandAppletContextMenu: function() {
        if (this._add_context_menu_id > 0) {
            Mainloop.source_remove(this._add_context_menu_id);
            this._add_context_menu_id = 0;
        }

        this._add_context_menu_id = Mainloop.timeout_add(
            5000,
            () => {
                if (!this.context_menu_item_configure) {
                    let items = this._applet_context_menu._getMenuItems();

                    this.context_menu_item_configure = new PopupMenu.PopupIconMenuItem(
                        _("Configure..."),
                        "system-run",
                        St.IconType.SYMBOLIC
                    );

                    this.context_menu_item_configure.connect("activate",
                        () => {
                            Util.spawn_async([this.metadata.path + "/settings.py"], null);
                        });

                    this._applet_context_menu.addMenuItem(this.context_menu_item_configure,
                        items.indexOf(this.context_menu_item_remove));
                }

                this._add_context_menu_id = 0;
            }
        );
    },

    _updateIconAndLabel: function() {
        let icon = Settings.custom_applet_icon;
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

        if (Settings.custom_applet_icon === "") {
            this._applet_icon_box.hide();
        } else {
            this._applet_icon_box.show();
        }

        if (this.orientation == St.Side.LEFT || this.orientation == St.Side.RIGHT) { // no menu label if in a vertical panel
            this.set_applet_label("");
        } else {
            if (Settings.custom_applet_label !== "") {
                this.set_applet_label(_(Settings.custom_applet_label));
            } else {
                this.set_applet_label("");
            }
        }

        this.updateLabelVisibility();
    },

    updateLabelVisibility: function() {
        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (typeof this.hide_applet_label !== "function") {
            return;
        }

        if (this.orientation == St.Side.LEFT || this.orientation == St.Side.RIGHT) {
            this.hide_applet_label(true);
        } else {
            if (Settings.custom_applet_label === "") {
                this.hide_applet_label(true);
            } else {
                this.hide_applet_label(false);
            }
        }
    },

    on_applet_removed_from_panel: function() {
        // No need to clean up if the applet activation wasn't allowed.
        if (!this.appletActivationAllowed) {
            return;
        }

        $.debug("Disabling applet");

        $.disconnectAllSettings();
        Settings.destroy();

        if (this._add_context_menu_id > 0) {
            Mainloop.source_remove(this._add_context_menu_id);
        }

        if (this._daemon_changed_id > 0) {
            this._daemon.disconnectSignal(this._daemon_changed_id);
        }

        if (this._daemon_error_id > 0) {
            this._daemon.disconnectSignal(this._daemon_error_id);
        }

        this._add_context_menu_id = 0;
        this._daemon_changed_id = 0;
        this._daemon_error_id = 0;

        if (this._daemon.is_running) {
            $.debug("Appplet disabled, stopping daemon");
            this._daemon.stop();
        }

        Main.keybindingManager.removeHotKey(this.next_wall_keybinding_name);
        Main.keybindingManager.removeHotKey(this.prev_wall_keybinding_name);
        Main.keybindingManager.removeHotKey(this.menu_keybinding_name);
    },

    _toggleMenu: function() {
        this.menu.toggle();
    },

    on_applet_clicked: function() {
        this._toggleMenu();
    }
};

function main(aMetadata, aOrientation, aPanel_height, aInstance_id) {
    return new WallpaperChangerApplet(aMetadata, aOrientation, aPanel_height, aInstance_id);
}
