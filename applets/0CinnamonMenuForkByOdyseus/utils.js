let XletMeta,
    GlobalUtils,
    Constants,
    DebugManager,
    CustomTooltips;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta["{{UUID}}"];
}

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
    Constants = require("./constants.js");
    DebugManager = require("./debugManager.js");
    CustomTooltips = require("./customTooltips.js");
} else {
    GlobalUtils = imports.ui.appletManager.applets["{{UUID}}"].globalUtils;
    Constants = imports.ui.appletManager.applets["{{UUID}}"].constants;
    DebugManager = imports.ui.appletManager.applets["{{UUID}}"].debugManager;
    CustomTooltips = imports.ui.appletManager.applets["{{UUID}}"].customTooltips;
}

const {
    gi: {
        Atk,
        Clutter,
        Gio,
        GLib,
        Pango,
        St
    },
    misc: {
        fileUtils: FileUtils,
        params: Params,
        signalManager: SignalManager,
        util: Util
    },
    ui: {
        applet: Applet,
        appFavorites: AppFavorites,
        main: Main,
        popupMenu: PopupMenu
    }
} = imports;

const GioSSS = Gio.SettingsSchemaSource;
const USER_DESKTOP_PATH = FileUtils.getUserDesktopDir();

const {
    SMI_DEFAULT_PARAMS,
    GSETTINGS_SCHEMA
} = Constants;

const {
    _
} = GlobalUtils;

const {
    InteligentTooltip
} = CustomTooltips;

var Debugger = new DebugManager.DebugManager(GSETTINGS_SCHEMA);

/* VisibleChildIterator takes a container (boxlayout, etc.)
 * and creates an array of its visible children and their index
 * positions.  We can then work through that list without
 * mucking about with positions and math, just give a
 * child, and it'll give you the next or previous, or first or
 * last child in the list.
 *
 * We could have this object regenerate off a signal
 * every time the visibles have changed in our applicationBox,
 * but we really only need it when we start keyboard
 * navigating, so increase speed, we reload only when we
 * want to use it.
 */

function VisibleChildIterator() {
    this._init.apply(this, arguments);
}

VisibleChildIterator.prototype = {
    _init: function(container) {
        this.container = container;
        this.reloadVisible();
    },

    reloadVisible: function() {
        this.array = this.container.get_focus_chain()
            .filter(x => !(x._delegate instanceof PopupMenu.PopupSeparatorMenuItem));
    },

    getNextVisible: function(curChild) {
        return this.getVisibleItem(this.array.indexOf(curChild) + 1);
    },

    getPrevVisible: function(curChild) {
        return this.getVisibleItem(this.array.indexOf(curChild) - 1);
    },

    getFirstVisible: function() {
        return this.array[0];
    },

    getLastVisible: function() {
        return this.array[this.array.length - 1];
    },

    getVisibleIndex: function(curChild) {
        return this.array.indexOf(curChild);
    },

    getVisibleItem: function(index) {
        let len = this.array.length;
        index = ((index % len) + len) % len;
        return this.array[index];
    },

    getNumVisibleChildren: function() {
        return this.array.length;
    },

    getAbsoluteIndexOfChild: function(child) {
        return this.container.get_children().indexOf(child);
    }
};

/**
 * A simpler/lighter alternative to PopupBaseMenuItem.
 *
 * It does not implement all interfaces of PopupBaseMenuItem. Any additional properties
 * in the aParams object beyond defaults will also be set on the instance.
 *
 * @param {Object}  aApplet             - The menu applet instance
 * @param {Object}  aParams             - Object containing item parameters, all optional.
 * @param {String}  aParams.name        - The label for the menu item.
 * @param {String}  aParams.description - The app's description the menu item belongs to.
 * @param {String}  aParams.type        - A string describing the type of item.
 * @param {String}  aParams.styleClass  - The item's CSS style class.
 * @param {Boolean} aParams.reactive    - Item recieves events.
 * @param {Boolean} aParams.activatable - Activates via primary click.
 *                                        Must provide an "activate" function on the prototype or instance.
 * @param {Boolean} aParams.withMenu    - Shows menu via secondary click.
 *                                        Must provide a "populateMenu" function on the prototype or instance.
 */
function SimpleMenuItem() {
    this._init.apply(this, arguments);
}

SimpleMenuItem.prototype = {
    _init: function(aApplet, aParams) {
        let params = Params.parse(aParams, SMI_DEFAULT_PARAMS, true);
        this._signals = new SignalManager.SignalManager(null);

        this.actor = new St.BoxLayout({
            style_class: params.styleClass,
            style: aApplet.max_width_for_buttons,
            reactive: params.reactive,
            accessible_role: Atk.Role.MENU_ITEM
        });

        this._signals.connect(this.actor, "destroy", function() {
            this.destroy(true);
        }.bind(this));

        this.actor._delegate = this;
        this.applet = aApplet;
        this.label = null;
        this.icon = null;
        this._shouldBeDisplayed = true;

        for (let prop in params) {
            this[prop] = params[prop];
        }

        if (params.reactive) {
            let self = this;

            this._signals.connect(this.actor, "enter-event",
                function() {
                    this._buttonEnterEvent(self);
                }.bind(aApplet)
            );
            this._signals.connect(this.actor, "leave-event",
                function() {
                    this._buttonLeaveEvent(self);
                }.bind(aApplet)
            );

            if (params.activatable || params.withMenu) {
                this._signals.connect(this.actor, "button-release-event",
                    function(aActor, aEvent) {
                        this._onButtonReleaseEvent(aActor, aEvent);
                    }.bind(this)
                );
                this._signals.connect(this.actor, "key-press-event",
                    function(aActor, aEvent) {
                        this._onKeyPressEvent(aActor, aEvent);
                    }.bind(this)
                );
            }
        }
    },

    _onButtonReleaseEvent: function(aActor, aEvent) {
        let button = aEvent.get_button();

        if (this.activate && button === Clutter.BUTTON_PRIMARY) {
            this.activate();
            return Clutter.EVENT_STOP;
        } else if (this.populateMenu && button === Clutter.BUTTON_SECONDARY) {
            this.applet.toggleContextMenu(this);
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    },

    _onKeyPressEvent: function(aActor, aEvent) {
        let symbol = aEvent.get_key_symbol();

        if (this.activate &&
            (symbol === Clutter.KEY_space ||
                symbol === Clutter.KEY_Return ||
                symbol === Clutter.KP_Enter)) {
            this.activate();
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    },

    addIcon: function(aSize, aIcon = null, aSymbolic = false) {
        if (this.icon || !aIcon) {
            return;
        }

        let params = {
            icon_size: aSize
        };

        switch (typeof aIcon) {
            case "string":
                params.icon_name = aIcon;
                break;
            case "object":
                if (aIcon instanceof Gio.FileIcon) {
                    params.gicon = aIcon;
                } else if (aIcon.get_names) {
                    params.icon_name = aIcon.get_names().toString();
                }
                break;
        }

        params.icon_type = aSymbolic ? St.IconType.SYMBOLIC : St.IconType.FULLCOLOR;

        this.icon = new St.Icon(params);
        this.actor.add_actor(this.icon);
    },

    addLabel: function(aLabel = "", aStyleClass = "menu-application-button-label") {
        if (this.label) {
            return;
        }

        this.label = new St.Label({
            text: aLabel,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });

        aStyleClass && this.label.set_style_class_name(aStyleClass);
        this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;
        this.actor.add_actor(this.label);
    },

    destroy: function(actorDestroySignal = false) {
        this._signals.disconnectAllSignals();

        this.label && this.label.destroy();
        this.icon && this.icon.destroy();
        actorDestroySignal || this.actor && this.actor.destroy();

        this.actor && this.actor._delegate &&
            delete this.actor._delegate;
        this.actor &&
            delete this.actor;
        this.label &&
            delete this.label;
        this.icon &&
            delete this.icon;
    },

    get shouldBeDisplayed() {
        return this._shouldBeDisplayed;
    },

    set shouldBeDisplayed(aVal) {
        this._shouldBeDisplayed = aVal;
    }
};

function ApplicationContextMenuItem() {
    this._init.apply(this, arguments);
}

ApplicationContextMenuItem.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(aAppButton, aLabel, aAction, aIconName) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            focusOnHover: false
        });

        this._appButton = aAppButton;
        this._action = aAction;
        this.label = new St.Label({
            text: aLabel
        });

        if (aIconName !== null) {
            this.icon = new St.Icon({
                icon_name: aIconName,
                icon_size: 12,
                icon_type: St.IconType.SYMBOLIC
            });

            this.icon && this.addActor(this.icon);
        }

        this.addActor(this.label);
        this._tooltip = new InteligentTooltip(this.actor, "");
    },

    activate: function(event) { // jshint ignore:line
        let pathToDesktopFile = this._appButton.app.get_app_info().get_filename();
        let likelyHasSucceeded = false;

        switch (this._action) {
            case "add_to_panel":
                if (!Main.AppletManager.get_role_provider_exists(Main.AppletManager.Roles.PANEL_LAUNCHER)) {
                    let new_applet_id = global.settings.get_int("next-applet-id");
                    global.settings.set_int("next-applet-id", (new_applet_id + 1));
                    let enabled_applets = global.settings.get_strv("enabled-applets");
                    enabled_applets.push("panel1:right:0:panel-launchers@cinnamon.org:" + new_applet_id);
                    global.settings.set_strv("enabled-applets", enabled_applets);
                }

                let launcherApplet = Main.AppletManager.get_role_provider(Main.AppletManager.Roles.PANEL_LAUNCHER);
                launcherApplet.acceptNewLauncher(this._appButton.app.get_id());
                break;
            case "add_to_desktop":
                let file = Gio.file_new_for_path(this._appButton.app.get_app_info().get_filename());
                let destFile = Gio.file_new_for_path(USER_DESKTOP_PATH + "/" + this._appButton.app.get_id());
                try {
                    file.copy(destFile, 0, null, () => {});

                    if (FileUtils.hasOwnProperty("changeModeGFile")) {
                        FileUtils.changeModeGFile(destFile, 755);
                    } else {
                        Util.spawnCommandLine('chmod +x "' + USER_DESKTOP_PATH + "/" + this._appButton.app.get_id() + '"');
                    }
                } catch (e) {
                    global.log(e);
                }
                break;
            case "add_to_favorites":
                AppFavorites.getAppFavorites().addFavorite(this._appButton.app.get_id());
                break;
            case "remove_from_favorites":
                AppFavorites.getAppFavorites().removeFavorite(this._appButton.app.get_id());

                // Refresh the favorites category. This allows to hide the recently removed favorite.
                if (this._appButton.applet.lastSelectedCategory === this._appButton.applet.favoritesCatName) {
                    this._appButton.applet._displayButtons(this._appButton.applet.lastSelectedCategory);
                }
                break;
            case "uninstall":
                this._appButton.applet.closeMainMenu();
                Util.spawnCommandLine("/usr/bin/cinnamon-remove-application '" + this._appButton.app.get_app_info().get_filename() + "'");
                break;
            case "run_with_nvidia_gpu":
                this._appButton.applet.closeMainMenu();

                try {
                    Util.spawnCommandLine("optirun gtk-launch " + this._appButton.app.get_id());
                    likelyHasSucceeded = true;
                } catch (aErr) {
                    global.logError(aErr.message);
                    likelyHasSucceeded = false;
                } finally {
                    if (this._appButton.applet.pref_recently_used_apps_enabled &&
                        this._appButton instanceof GenericApplicationButton &&
                        likelyHasSucceeded) {
                        this._appButton.applet.recentAppsManager.storeRecentApp(this._appButton.app.get_id());
                    }
                }
                break;
            case "launch_from_terminal":
            case "launch_from_terminal_as_root":
                this._appButton.applet.closeMainMenu();

                let elevated = this._action === "launch_from_terminal_as_root" ?
                    this._appButton.applet.pref_privilege_elevator + " " :
                    "";
                let cmd = elevated + "gtk-launch " + this._appButton.app.get_id().replace(/.desktop$/g, "");
                let argv = [
                    this._appButton.applet.pref_terminal_emulator,
                    "-e",
                    this._appButton.applet.pref_default_shell + " -c " +
                    GLib.shell_quote(cmd + "; exec " + this._appButton.applet.pref_default_shell)
                ];

                try {
                    Util.spawn_async(argv, null);
                    likelyHasSucceeded = true;
                } catch (aErr) {
                    global.logError(aErr.message);
                    likelyHasSucceeded = false;
                } finally {
                    if (this._appButton.applet.pref_recently_used_apps_enabled &&
                        this._appButton instanceof GenericApplicationButton &&
                        likelyHasSucceeded) {
                        this._appButton.applet.recentAppsManager.storeRecentApp(this._appButton.app.get_id());
                    }
                }
                break;
            case "open_desktop_file_folder":
                try {
                    this._openDesktopFileFolder(GLib.path_get_dirname(pathToDesktopFile));
                } catch (aErr) {
                    Main.notify(_(this._appButton.applet.metadata.name), aErr.message);
                    global.logError(aErr.message);
                    this._openDesktopFileFolder("");
                }
                break;
            case "run_as_root":
                this._appButton.applet.closeMainMenu();

                try {
                    // The garbage of pkexec will not work with any spawn* function!!!
                    // Tried with Util.spawn_async, GLib.spawn_async, GLib.spawn_command_line_async and
                    // GLib.spawn_async. NOTHING F*CKING WORKS!!!!
                    // So, let's leave a REAL programing language (Python) do the F*CKING job!!!
                    Util.spawn_async([
                        this._appButton.applet.metadata.path + "/launcher.py",
                        this._appButton.applet.pref_privilege_elevator,
                        "gtk-launch",
                        this._appButton.app.get_id()
                    ], null);
                    likelyHasSucceeded = true;
                } catch (aErr) {
                    Main.notify(_(this._appButton.applet.metadata.name), aErr.message);
                    global.logError(aErr.message);
                    likelyHasSucceeded = false;
                } finally {
                    if (this._appButton.applet.pref_recently_used_apps_enabled &&
                        this._appButton instanceof GenericApplicationButton &&
                        likelyHasSucceeded) {
                        this._appButton.applet.recentAppsManager.storeRecentApp(this._appButton.app.get_id());
                    }
                }
                break;
            case "open_with_text_editor":
                if (this._appButton.applet.pref_context_gain_privileges) {
                    try {
                        Util.spawn_async(["stat", "-c", '"%U"', pathToDesktopFile],
                            (aOutput) => {
                                let fileOwner = aOutput.replace(/\s+/g, "")
                                    // Mark for deletion on EOL. Cinnamon 3.8.x+
                                    // The following was caused by the use of --language=C instead of
                                    // --language=JavaScript. In Cinnamon 3.8.x, the script to
                                    // generate .pot files was re-written from scratch and this
                                    // error was fixed.
                                    //
                                    // If I use the literal double quotes inside the RegEx,
                                    // cinnamon-json-makepot with the --js argument breaks.
                                    // SyntaxError: unterminated string literal
                                    .replace(/\u0022/g, "");
                                this._launchDesktopFile(fileOwner);
                            });
                    } catch (aErr) {
                        this._launchDesktopFile("");
                        global.logError(aErr.message);
                    }
                } else {
                    this._launchDesktopFile("");
                }
                break;
            default:
                return true;
        }
        this._appButton.applet.toggleContextMenu(this._appButton);
        return false;
    },

    _openDesktopFileFolder: function(aDirPath) {
        this._appButton.applet.closeMainMenu();

        try {
            if (aDirPath !== "") {
                GLib.spawn_command_line_async("xdg-open " + '"' + aDirPath + '"');
            }
        } catch (aErr) {
            Main.notify(_(this._appButton.applet.metadata.name), aErr.message);
            global.logError(aErr.message);
        }
    },

    _launchDesktopFile: function(aFileOwner) {
        this._appButton.applet.closeMainMenu();

        let cmd = "";
        if (this._appButton.applet.pref_context_gain_privileges &&
            GLib.get_user_name().toString() !== aFileOwner) {
            cmd += this._appButton.applet.pref_privilege_elevator;
        }

        let editor = this._appButton.applet.pref_context_custom_editor_for_edit_desktop_file;

        if (editor !== "") {
            cmd += " " + editor + " " + '"' + this._appButton.app.get_app_info().get_filename() + '"';
        } else {
            cmd += " xdg-open " + '"' + this._appButton.app.get_app_info().get_filename() + '"';
        }

        try {
            GLib.spawn_command_line_async(cmd);
        } catch (aErr) {
            Main.notify(_(this._appButton.applet.metadata.name), aErr.message);
            global.logError(aErr.message);
        }
    }
};

function GenericApplicationButton() {
    this._init.apply(this, arguments);
}

GenericApplicationButton.prototype = {
    __proto__: SimpleMenuItem.prototype,

    _init: function(aApplet, aParams) {
        let params = Params.parse(aParams, {
            app: {},
            withMenu: true,
            type: "app",
            styleClass: "menu-application-button"
        });

        SimpleMenuItem.prototype._init.call(this,
            aApplet, {
                name: params.app.get_name(),
                description: params.app.get_description() || "",
                type: params.type,
                withMenu: params.withMenu,
                styleClass: params.styleClass,
                app: params.app
            }
        );
    },

    activate: function(event) { // jshint ignore:line
        let likelyHasSucceeded = false;

        let ctrlKey = (Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2]) !== 0;
        let shiftKey = (Clutter.ModifierType.SHIFT_MASK & global.get_pointer()[2]) !== 0;
        // let altKey = (Clutter.ModifierType.MOD1_MASK & global.get_pointer()[2]) !== 0;
        // global.logError("ctrlKey " + ctrlKey);
        // global.logError("shiftKey " + shiftKey);
        // global.logError("altKey " + altKey);

        this.applet.closeMainMenu();

        if (ctrlKey) {
            try {
                let elevated = shiftKey ?
                    this.applet.pref_privilege_elevator + " " :
                    "";
                let cmd = elevated + "gtk-launch " + this.app.get_id().replace(/.desktop$/g, "");
                let argv = [
                    this.applet.pref_terminal_emulator,
                    "-e",
                    this.applet.pref_default_shell + " -c " +
                    GLib.shell_quote(cmd + "; exec " + this.applet.pref_default_shell)
                ];

                GLib.spawn_async(null, argv, null, GLib.SpawnFlags.SEARCH_PATH, null);
                likelyHasSucceeded = true;
            } catch (aErr) {
                global.logError(aErr.message);
                likelyHasSucceeded = false;
            }
        } else if (shiftKey && !ctrlKey) {
            try {
                Util.spawnCommandLine(this.applet.pref_privilege_elevator +
                    " gtk-launch " + this.app.get_id());
                likelyHasSucceeded = true;
            } catch (aErr) {
                Main.notify(_(this._appButton.applet.metadata.name), aErr.message);
                global.logError(aErr.message);
                likelyHasSucceeded = false;
            }
        } else {
            this.app.open_new_window(-1);
            likelyHasSucceeded = true;
        }

        if (this.applet.pref_recently_used_apps_enabled &&
            this instanceof GenericApplicationButton &&
            likelyHasSucceeded) {
            this.applet.recentAppsManager.storeRecentApp(this.app.get_id());
        }
    },

    populateMenu: function(aMenu) {
        let menuItem;

        if (this.applet.pref_context_show_add_to_panel) {
            menuItem = new ApplicationContextMenuItem(
                this,
                _("Add to panel"),
                "add_to_panel",
                "list-add"
            );
            menuItem._tooltip.set_text(_("Add this application to the Panel launchers applet."));
            aMenu.addMenuItem(menuItem);
        }

        if (this.applet.pref_context_show_add_to_desktop && USER_DESKTOP_PATH) {
            menuItem = new ApplicationContextMenuItem(
                this,
                _("Add to desktop"),
                "add_to_desktop",
                "computer"
            );
            menuItem._tooltip.set_text(_("Add this application to the Desktop."));
            aMenu.addMenuItem(menuItem);
        }

        if (this.applet.pref_context_show_add_remove_favorite) {
            if (AppFavorites.getAppFavorites().isFavorite(this.app.get_id())) {
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Remove from favorites"),
                    "remove_from_favorites",
                    "starred"
                );
                menuItem._tooltip.set_text(_("Remove application from your favorites."));
                aMenu.addMenuItem(menuItem);
            } else {
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Add to favorites"),
                    "add_to_favorites",
                    "non-starred"
                );
                menuItem._tooltip.set_text(_("Add application to your favorites."));
                aMenu.addMenuItem(menuItem);
            }
        }

        if (this.applet._canUninstallApps) {
            menuItem = new ApplicationContextMenuItem(
                this,
                _("Uninstall"),
                "uninstall",
                "edit-delete"
            );
            menuItem._tooltip.set_text(_("Uninstall application from your system."));
            aMenu.addMenuItem(menuItem);
        }

        if (this.applet._isBumblebeeInstalled) {
            menuItem = new ApplicationContextMenuItem(
                this,
                _("Run with NVIDIA GPU"),
                "run_with_nvidia_gpu",
                "cpu"
            );
            menuItem._tooltip.set_text(_("Run application through optirun command (Bumblebee)."));
            aMenu.addMenuItem(menuItem);
        }

        if (this.applet.pref_context_show_run_as_root) {
            menuItem = new ApplicationContextMenuItem(
                this,
                _("Run as root"),
                "run_as_root",
                "system-run"
            );
            menuItem._tooltip.set_text(_("Run application as root."));
            aMenu.addMenuItem(menuItem);
        }

        if (this.applet.pref_context_show_edit_desktop_file) {
            menuItem = new ApplicationContextMenuItem(
                this,
                _("Edit .desktop file"),
                "open_with_text_editor",
                "custom-entypo-edit"
            );
            menuItem._tooltip.set_text(_("Edit this application .desktop file with a text editor."));
            aMenu.addMenuItem(menuItem);
        }

        if (this.applet.pref_context_show_desktop_file_folder) {
            menuItem = new ApplicationContextMenuItem(
                this,
                _("Open .desktop file folder"),
                "open_desktop_file_folder",
                "folder"
            );
            menuItem._tooltip.set_text(_("Open the folder containg this application .desktop file."));
            aMenu.addMenuItem(menuItem);
        }

        if (this.applet.pref_context_show_run_from_terminal) {
            menuItem = new ApplicationContextMenuItem(
                this,
                _("Run from terminal"),
                "launch_from_terminal",
                "custom-terminal"
            );
            menuItem._tooltip.set_text(_("Run application from a terminal."));
            aMenu.addMenuItem(menuItem);
        }

        if (this.applet.pref_context_show_run_from_terminal_as_root) {
            menuItem = new ApplicationContextMenuItem(
                this,
                _("Run from terminal as root"),
                "launch_from_terminal_as_root",
                "custom-terminal"
            );
            menuItem._tooltip.set_text(_("Run application from a terminal as root."));
            aMenu.addMenuItem(menuItem);
        }
    }
};

function ApplicationButton() {
    this._init.apply(this, arguments);
}

ApplicationButton.prototype = {
    __proto__: GenericApplicationButton.prototype,

    _init: function(aApplet, aApp) {
        GenericApplicationButton.prototype._init.call(this,
            aApplet, {
                app: aApp,
                type: "app"
            }
        );
        this.category = [];

        if (aApplet.pref_show_application_icons) {
            this.icon = this.app.create_icon_texture(aApplet.pref_application_icon_size);
            this.actor.add_actor(this.icon);
        }

        this.addLabel(this.name);
        this.tooltip = new InteligentTooltip(this.actor, "");
    },

    get_app_id: function() {
        return this.app.get_id();
    }
};

function DummyApplicationButton() {
    this._init.apply(this, arguments);
}

DummyApplicationButton.prototype = {
    __proto__: GenericApplicationButton.prototype,
    _dummyApp: {
        get_app_info: {
            get_filename: () => {
                return "";
            }
        },
        get_keywords: () => {
            return false;
        },
        get_id: () => {
            return -1;
        },
        get_description: () => {
            return "";
        },
        get_name: () => {
            return "";
        },
        get_icon: () => {
            return "custom-really-empty";
        }
    },

    _init: function(aApplet, aButtonType, aIconSize) {
        GenericApplicationButton.prototype._init.call(this,
            aApplet, {
                app: this._dummyApp,
                type: aButtonType
            }
        );
        this.category = [];

        if (this.applet.pref_show_application_icons) {
            this.addIcon(aIconSize, "custom-really-empty");
        }

        this.addLabel(this.name);
        this.tooltip = new InteligentTooltip(this.actor, "");
    },

    populateItem: function(aApp) {
        /* NOTE TO SELF: Do NOT compare objects, you moron!
         */
        /* NOTE: If this.app hasn't changed, do not modify an item.
         * This most likely will fail with apps. that have no ID.
         * The day that one such app. is found, put it in banned apps. list
         * that should never contaminate a system!!!
         */
        if (this.app.get_id() === aApp.get_id()) {
            return true;
        }

        this.app = aApp;

        this.name = this.app.get_name();
        this.label.set_text(this.name);

        if (this.applet.pref_show_application_icons) {
            let icon = this.app.get_app_info().get_icon();

            if (icon instanceof Gio.FileIcon) {
                this.icon.set_gicon(icon);
            } else {
                this.icon.set_icon_name(icon.get_names().toString());
            }
        }

        return true;
    },

    get_app_id: function() {
        return this.app.get_id();
    }
};

function CategoryButton() {
    this._init.apply(this, arguments);
}

CategoryButton.prototype = {
    __proto__: SimpleMenuItem.prototype,

    _init: function(aApplet, aCategory) {
        SimpleMenuItem.prototype._init.call(this,
            aApplet, {
                activatable: false,
                name: aCategory.get_name(),
                styleClass: "menu-category-button",
                categoryId: aCategory.get_menu_id()
            }
        );
        this.actor.accessible_role = Atk.Role.LIST_ITEM;

        if (aApplet.pref_show_category_icons) {
            this.addIcon(aApplet.pref_category_icon_size, aCategory.get_icon());
        }

        this.addLabel(this.name, "menu-category-button-label");
    }
};

function CategoriesApplicationsBox() {
    this._init.apply(this, arguments);
}

CategoriesApplicationsBox.prototype = {
    _init: function() {
        this.actor = new St.BoxLayout();
        this.actor._delegate = this;
    }
};

function CustomCommandButton() {
    this._init.apply(this, arguments);
}

CustomCommandButton.prototype = {
    __proto__: SimpleMenuItem.prototype,

    _init: function(aApplet, aApp, aCallback) {
        SimpleMenuItem.prototype._init.call(this,
            aApplet, {
                name: aApp.label,
                styleClass: "menu-application-button"
            }
        );

        this.app = aApp;
        // this.callback is a remnants of past version of this applet. Not used at present.
        // Leave it just in case I want to add custom launchers programmatically.
        this.callback = aCallback;

        let icon;

        if (this.app.icon.indexOf("/") !== -1) {
            icon = new Gio.FileIcon({
                file: Gio.file_new_for_path(this.app.icon)
            });
        } else {
            icon = this.app.icon;
        }

        this.addIcon(
            this.applet.pref_custom_launchers_icon_size,
            icon,
            this.app.icon.search("-symbolic") !== -1
        );

        this.tooltip = new InteligentTooltip(this.actor, "");
    },

    activate: function(event) { // jshint ignore:line
        // this.actor.set_style_class_name("menu-application-button");
        // Remnants of past version of this applet. Not used at present.
        // Leave it just in case.
        if (this.callback) {
            this.applet.closeMainMenu();
            this.callback();
        } else {
            let cmd = this.app.command;
            this.applet.closeMainMenu();
            try { // Try to execute
                // From the docs:
                // spawn_command_line_async: A simple version of GLib.spawn_async() that parses a
                // command line with GLib.shell_parse_argv() and passes it to GLib.spawn_async().
                // Runs a command line in the background. Unlike GLib.spawn_async(), the
                // GLib.SpawnFlags.SEARCH_PATH flag is enabled, other flags are not.
                GLib.spawn_command_line_async(cmd);
            } catch (aErr1) {
                /* FIXME:
                 * This catch block is kind of useless.
                 * Maybe I should remove it.
                 */
                try {
                    if (cmd.indexOf("/") !== -1) { // Try to open file if cmd is a path
                        Main.Util.spawnCommandLine("xdg-open " + '"' + cmd + '"');
                    }
                } catch (aErr2) {
                    Main.notify(_(this.applet.metadata.name), aErr2.message);
                }
            }
        }
    }
};

function RecentAppsManager() {
    this._init.apply(this, arguments);
}

RecentAppsManager.prototype = {
    _init: function(aApplet) {
        this.applet = aApplet;

        let schemaDir = Gio.file_new_for_path(XletMeta.path + "/schemas");
        let schemaSource;

        if (schemaDir.query_exists(null)) {
            schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
                GioSSS.get_default(),
                false);
        } else {
            schemaSource = GioSSS.get_default();
        }

        let schemaObj = schemaSource.lookup(GSETTINGS_SCHEMA, false);

        if (!schemaObj) {
            throw new Error("Schema %s could not be found for xlet %s."
                .format(GSETTINGS_SCHEMA, XletMeta.uuid) + "Please check your installation.");
        }

        this.schema = new Gio.Settings({
            settings_schema: schemaObj
        });

        this._handlers = [];
    },

    storeRecentApp: function(aAppID) {
        if (this.applet.pref_recently_used_apps_ignore_favorites &&
            AppFavorites.getAppFavorites().isFavorite(aAppID)) {
            return;
        }

        let t = new Date().getTime();
        let recApps = this.recentApps;
        let recAppUpdated = false;

        // Update recent app if it was previously launched.
        let i = recApps.length;
        while (i--) {
            if (recApps[i].indexOf(aAppID) === 0) {
                recApps[i] = aAppID + ":" + t;
                recAppUpdated = true;
                break;
            }
        }

        // Push the app if it wasn't previously launched.
        if (!recAppUpdated) {
            recApps.push(aAppID + ":" + t);
        }

        this.filterAndStore(recApps);
    },

    filterAndStore: function(aRecentApps) {
        /* NOTE: This function is also called when favorites are changed, so when a
         * favorite is added, the recent apps. list is also updated.
         */
        let recentApps = aRecentApps || this.recentApps;
        // Holy ·$%&/()!!! The only freaking way that I could find to remove duplicates!!!
        // Like always, Stack Overflow is a life saver.
        // http://stackoverflow.com/questions/31014324/remove-duplicated-object-in-array
        let temp = new Set();

        this.recentApps = recentApps.filter((aVal) => {
            let appID = aVal.split(":")[0];
            return (temp.has(appID) ? false : temp.add(appID)) ||
                (this.applet.pref_recently_used_apps_ignore_favorites &&
                    !AppFavorites.getAppFavorites().isFavorite(appID));
        });
    },

    set recentApps(aValue) {
        this.schema.set_strv("pref-recently-used-applications", aValue);
    },

    get recentApps() {
        return this.schema.get_strv("pref-recently-used-applications");
    },

    connect: function(signal, callback) {
        let handler_id = this.schema.connect(signal, callback);
        this._handlers.push(handler_id);
        return handler_id;
    },

    destroy: function() {
        // Remove the remaining signals...
        while (this._handlers.length) {
            this.disconnect(this._handlers[0]);
        }
    },

    disconnect: function(handler_id) {
        let index = this._handlers.indexOf(handler_id);
        this.schema.disconnect(handler_id);

        if (index > -1) {
            this._handlers.splice(index, 1);
        }
    }
};

DebugManager.wrapObjectMethods(Debugger, {
    ApplicationButton: ApplicationButton,
    ApplicationContextMenuItem: ApplicationContextMenuItem,
    CategoriesApplicationsBox: CategoriesApplicationsBox,
    CategoryButton: CategoryButton,
    CustomCommandButton: CustomCommandButton,
    DummyApplicationButton: DummyApplicationButton,
    GenericApplicationButton: GenericApplicationButton,
    InteligentTooltip: InteligentTooltip,
    RecentAppsManager: RecentAppsManager,
    SimpleMenuItem: SimpleMenuItem,
    VisibleChildIterator: VisibleChildIterator
});
