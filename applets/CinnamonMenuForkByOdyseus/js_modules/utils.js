const {
    gi: {
        Atk,
        Clutter,
        Gio,
        GLib,
        Pango,
        St
    },
    mainloop: Mainloop,
    misc: {
        params: Params,
        signalManager: SignalManager,
        util: Util
    },
    ui: {
        appFavorites: AppFavorites,
        dnd: DND,
        main: Main,
        popupMenu: PopupMenu
    }
} = imports;

const GioSSS = Gio.SettingsSchemaSource;

const {
    SMIDefaultParams,
    GSETTINGS_SCHEMA,
    VECTOR_BOX_DEBUG,
    VECTOR_BOX_LEGACY,
    VECTOR_BOX_MIN_MOVEMENT,
    VECTOR_BOX_POLL_INTERVAL
} = require("js_modules/constants.js");

const {
    _,
    arrayEach,
    launchUri,
    tryFn,
    USER_DESKTOP_PATH
} = require("js_modules/globalUtils.js");

const {
    DebugManager
} = require("js_modules/debugManager.js");

const {
    IntelligentTooltip
} = require("js_modules/customTooltips.js");

const {
    File
} = require("js_modules/customFileUtils.js");

var Debugger = new DebugManager(GSETTINGS_SCHEMA);

/* VisibleChildIterator takes a container (boxlayout, etc.)
 * and creates an array of its visible children and their index
 * positions. We can then work through that list without
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

var VisibleChildIterator = class VisibleChildIterator {
    constructor(container) {
        this.container = container;
        this.reloadVisible();
    }

    reloadVisible() {
        this.array = this.container.get_focus_chain()
            .filter(x => !(x._delegate instanceof PopupMenu.PopupSeparatorMenuItem));
    }

    getNextVisible(curChild) {
        return this.getVisibleItem(this.array.indexOf(curChild) + 1);
    }

    getPrevVisible(curChild) {
        return this.getVisibleItem(this.array.indexOf(curChild) - 1);
    }

    getFirstVisible() {
        return this.array[0];
    }

    getLastVisible() {
        return this.array[this.array.length - 1];
    }

    getVisibleIndex(curChild) {
        return this.array.indexOf(curChild);
    }

    getVisibleItem(index) {
        const len = this.array.length;
        index = ((index % len) + len) % len;
        return this.array[index];
    }

    getNumVisibleChildren() {
        return this.array.length;
    }

    getAbsoluteIndexOfChild(child) {
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
 * @param {Boolean} aParams.reactive    - Item receives events.
 * @param {Boolean} aParams.activatable - Activates via primary click.
 *                                        Must provide an "activate" function on the prototype or instance.
 * @param {Boolean} aParams.withMenu    - Shows menu via secondary click.
 *                                        Must provide a "populateMenu" function on the prototype or instance.
 */
var SimpleMenuItem = class SimpleMenuItem {
    constructor(aApplet, aParams) {
        const params = Params.parse(aParams, SMIDefaultParams, true);
        this._signals = new SignalManager.SignalManager();

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

        for (const prop in params) {
            this[prop] = params[prop];
        }

        if (params.reactive) {
            const self = this;

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
    }

    _onButtonReleaseEvent(aActor, aEvent) {
        const button = aEvent.get_button();

        if (this.activate && button === Clutter.BUTTON_PRIMARY) {
            this.activate();
            return Clutter.EVENT_STOP;
        } else if (this.populateMenu && button === Clutter.BUTTON_SECONDARY) {
            this.applet.toggleContextMenu(this);
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _onKeyPressEvent(aActor, aEvent) {
        const symbol = aEvent.get_key_symbol();

        if (this.activate &&
            (symbol === Clutter.KEY_space ||
                symbol === Clutter.KEY_Return ||
                symbol === Clutter.KEY_KP_Enter)) {
            this.activate();
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    addIcon(aSize, aIcon = null, aSymbolic = false) {
        if (this.icon || !aIcon) {
            return;
        }

        const params = {
            icon_size: aSize
        };

        switch (typeof aIcon) {
            case "string":
                params.icon_name = aIcon;
                break;
            case "object":
                if (aIcon instanceof Gio.Icon || aIcon instanceof Gio.FileIcon) {
                    params.gicon = aIcon;
                } else if (aIcon instanceof Gio.ThemedIcon) {
                    params.icon_name = aIcon.get_names().toString();
                }
                break;
        }

        params.icon_type = aSymbolic ? St.IconType.SYMBOLIC : St.IconType.FULLCOLOR;

        this.icon = new St.Icon(params);
        this.actor.add_actor(this.icon);
    }

    addLabel(aLabel = "", aStyleClass = "menu-application-button-label") {
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
    }

    destroy(actorDestroySignal = false) {
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
    }

    get shouldBeDisplayed() {
        return this._shouldBeDisplayed;
    }

    set shouldBeDisplayed(aVal) {
        this._shouldBeDisplayed = aVal;
    }
};

var ApplicationContextMenuItem = class ApplicationContextMenuItem extends PopupMenu.PopupBaseMenuItem {
    constructor(aAppButton, aLabel, aAction, aIconName) {
        super({
            focusOnHover: false
        });

        this._appButton = aAppButton;
        this.params = {
            action: aAction,
            app_id: aAppButton.app.get_id(),
            // NOTE: This ID is used as the ID for schedule_manager.idleCall(). This is to avoid
            // to cancel the same action call from different applications buttons.
            // Very unlikely, but better prevent than have to cure.
            action_id: aAction + aAppButton.app.get_id(),
            desktop_file_path: aAppButton.app.get_app_info().get_filename()
        };

        this.likelyHasSucceeded = false;

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
        this._tooltip = new IntelligentTooltip(this.actor, "");
    }

    idleCall(aCallback) {
        // NOTE: The call to Mainloop.idle_add() is to add an "artificial delay" so the
        // menu itself doesn't interfere with the application actions being launched.
        // For example, without the delay, the absolutely retarded gnome-screenshot will
        // capture the menu when taking a screenshot of the screen or the current window.
        this._appButton.applet.$.schedule_manager.idleCall(this.params.action_id, function() {
            aCallback();
        }.bind(this));
    }

    activate(aEvent) { // jshint ignore:line
        switch (this.params.action) {
            case "add_to_panel":
                if (!Main.AppletManager.get_role_provider_exists(Main.AppletManager.Roles.PANEL_LAUNCHER)) {
                    const new_applet_id = global.settings.get_int("next-applet-id");
                    global.settings.set_int("next-applet-id", (new_applet_id + 1));
                    const enabled_applets = global.settings.get_strv("enabled-applets");
                    enabled_applets.push(`panel1:right:0:panel-launchers@cinnamon.org:${new_applet_id}`);
                    global.settings.set_strv("enabled-applets", enabled_applets);
                }

                this.idleCall(() => {
                    const launcherApplet = Main.AppletManager.get_role_provider(Main.AppletManager.Roles.PANEL_LAUNCHER);
                    launcherApplet.acceptNewLauncher(this.params.app_id);
                });
                break;
            case "add_to_desktop":
                const file = new File(this.params.desktop_file_path);
                const destPath = `${USER_DESKTOP_PATH}/${this.params.app_id}`;
                file.copy(destPath).then(() => {
                    const destFile = new File(destPath);
                    destFile.chmod(755).catch((aErr) => global.logError(aErr));
                }).catch((aErr) => global.logError(aErr));
                break;
            case "add_to_favorites":
                AppFavorites.getAppFavorites().addFavorite(this.params.app_id);
                break;
            case "remove_from_favorites":
                AppFavorites.getAppFavorites().removeFavorite(this.params.app_id);

                // Refresh the favorites category. This allows to hide the recently removed favorite.
                if (this._appButton.applet.lastSelectedCategory === this._appButton.applet.favoritesCatName) {
                    this._appButton.applet._displayButtons(this._appButton.applet.lastSelectedCategory);
                }
                break;
            case "uninstall":
                this._appButton.applet.closeMainMenu();

                this.idleCall(() => {
                    Util.spawnCommandLine(`/usr/bin/cinnamon-remove-application "${this.params.desktop_file_path}"`);
                });
                break;
            case "run_with_nvidia_gpu":
                this._appButton.applet.closeMainMenu();

                this.idleCall(() => {
                    tryFn(() => {
                        Util.spawnCommandLine(`optirun gtk-launch ${this.params.app_id}`);
                        this.likelyHasSucceeded = true;
                    }, (aErr) => {
                        global.logError(aErr.message);
                        this.likelyHasSucceeded = false;
                    }, () => {
                        if (this._appButton.applet.$._.recently_used_apps_enabled &&
                            this._appButton instanceof GenericApplicationButton &&
                            this.likelyHasSucceeded) {
                            this._appButton.applet.recentAppsManager.storeRecentApp(this.params.app_id);
                        }
                    });
                });
                break;
            case "launch_from_terminal":
            case "launch_from_terminal_as_root":
                this._appButton.applet.closeMainMenu();

                const elevated = this.params.action === "launch_from_terminal_as_root" ?
                    ` ${this._appButton.applet.$._.privilege_elevator}` :
                    "";
                const cmd = `${elevated}gtk-launch ${this.params.app_id.replace(/.desktop$/g, "")}`;
                const quoted_arg = GLib.shell_quote(`${cmd}; exec ${this._appButton.applet.$._.default_shell}`);
                const argv = [
                    this._appButton.applet.$._.terminal_emulator,
                    "-e",
                    `${this._appButton.applet.$._.default_shell} -c ${quoted_arg}`
                ];

                this.idleCall(() => {
                    tryFn(() => {
                        Util.spawn_async(argv, null);
                        this.likelyHasSucceeded = true;
                    }, (aErr) => {
                        global.logError(aErr.message);
                        this.likelyHasSucceeded = false;
                    }, () => {
                        if (this._appButton.applet.$._.recently_used_apps_enabled &&
                            this._appButton instanceof GenericApplicationButton &&
                            this.likelyHasSucceeded) {
                            this._appButton.applet.recentAppsManager.storeRecentApp(this.params.app_id);
                        }
                    });
                });
                break;
            case "open_desktop_file_folder":
                tryFn(() => {
                    this._openDesktopFileFolder(GLib.path_get_dirname(this.params.desktop_file_path));
                }, (aErr) => {
                    Main.notify(_(this._appButton.applet.$.metadata.name), aErr.message);
                    global.logError(aErr.message);
                    this._openDesktopFileFolder("");
                });
                break;
            case "run_as_root":
                this._appButton.applet.closeMainMenu();

                this.idleCall(() => {
                    tryFn(() => {
                        // The garbage of pkexec will not work with any spawn* function!!!
                        // Tried with Util.spawn_async, GLib.spawn_async, GLib.spawn_command_line_async and
                        // GLib.spawn_async. NOTHING F*CKING WORKS!!!!
                        // So, let's leave a REAL programing language (Python) do the F*CKING job!!!
                        Util.spawn_async([
                            `${this._appButton.applet.$.metadata.path}/launcher.py`,
                            this._appButton.applet.$._.privilege_elevator,
                            "gtk-launch",
                            this.params.app_id
                        ], null);
                        this.likelyHasSucceeded = true;
                    }, (aErr) => {
                        Main.notify(_(this._appButton.applet.$.metadata.name), aErr.message);
                        global.logError(aErr.message);
                        this.likelyHasSucceeded = false;
                    }, () => {
                        if (this._appButton.applet.$._.recently_used_apps_enabled &&
                            this._appButton instanceof GenericApplicationButton &&
                            this.likelyHasSucceeded) {
                            this._appButton.applet.recentAppsManager.storeRecentApp(this.params.app_id);
                        }
                    });
                });
                break;
            case "open_with_text_editor":
                if (this._appButton.applet.$._.context_gain_privileges) {
                    const deskFile = new File(this.params.desktop_file_path);
                    deskFile.info({
                        attributes: Gio.FILE_ATTRIBUTE_OWNER_USER
                    }).then((aFileInfo) => {
                        tryFn(() => {
                            this._openDesktopFile(aFileInfo.get_attribute_as_string(Gio.FILE_ATTRIBUTE_OWNER_USER));
                        }, (aErr) => {
                            this._openDesktopFile("");
                            global.logError(aErr);
                        });
                    }).catch((aErr) => {
                        this._openDesktopFile("");
                        global.logError(aErr);
                    });
                } else {
                    this._openDesktopFile("");
                }
                break;
            case "edit_with_menu_editor":
                this.idleCall(() => {
                    Util.spawn_async([
                        "cinnamon-desktop-editor",
                        "-mlauncher",
                        "-o",
                        this.params.desktop_file_path
                    ], null);
                });
                break;
            default:
                if (this._appButton.appInfo !== null) {
                    this._appButton.applet.closeMainMenu();

                    this.idleCall(() => {
                        tryFn(() => {
                            this._appButton.appInfo.launch_action(
                                this.params.action,
                                global.create_app_launch_context()
                            );
                        }, (aErr) => global.logError(aErr));
                    });
                }

                return Clutter.EVENT_STOP;
        }
        this._appButton.applet.toggleContextMenu(this._appButton);

        return Clutter.EVENT_PROPAGATE;
    }

    _openDesktopFileFolder(aDirPath) {
        this._appButton.applet.closeMainMenu();

        this.idleCall(() => {
            launchUri(aDirPath);
        });
    }

    _openDesktopFile(aFileOwner) {
        this._appButton.applet.closeMainMenu();

        let cmd = "";
        if (this._appButton.applet.$._.context_gain_privileges &&
            GLib.get_user_name().toString() !== aFileOwner) {
            cmd += this._appButton.applet.$._.privilege_elevator;
        }

        const editor = this._appButton.applet.$._.context_custom_editor_for_edit_desktop_file;

        if (editor !== "") {
            cmd += ` ${editor} "${this.params.desktop_file_path}"`;
        } else {
            cmd += ` xdg-open "${this.params.desktop_file_path}"`;
        }

        this.idleCall(() => {
            tryFn(() => {
                GLib.spawn_command_line_async(cmd);
            }, (aErr) => {
                Main.notify(_(this._appButton.applet.$.metadata.name), aErr.message);
                global.logError(aErr.message);
            });
        });
    }
};

var GenericApplicationButton = class GenericApplicationButton extends SimpleMenuItem {
    constructor(aApplet, aParams) {
        const params = Params.parse(aParams, {
            app: {},
            withMenu: true,
            type: "app",
            styleClass: "menu-application-button"
        });

        super(
            aApplet, {
                name: params.app.get_name(),
                description: params.app.get_description() || "",
                type: params.type,
                withMenu: params.withMenu,
                styleClass: params.styleClass,
                app: params.app
            }
        );
        this.appInfo = null;
        this.likelyHasSucceeded = false;
    }

    activate(event) { // jshint ignore:line
        const ctrlKey = (Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2]) !== 0;
        const shiftKey = (Clutter.ModifierType.SHIFT_MASK & global.get_pointer()[2]) !== 0;
        // let altKey = (Clutter.ModifierType.MOD1_MASK & global.get_pointer()[2]) !== 0;
        // global.logError("ctrlKey " + ctrlKey);
        // global.logError("shiftKey " + shiftKey);
        // global.logError("altKey " + altKey);

        this.applet.closeMainMenu();

        // NOTE: The call to Mainloop.idle_add() is to avoid jerkiness when the menu close animation is playing.
        this.applet.$.schedule_manager.idleCall(this.app.get_id(), function() {
            if (ctrlKey) {
                tryFn(() => {
                    const elevated = shiftKey ?
                        `${this.applet.$._.privilege_elevator} ` :
                        "";
                    const cmd = `${elevated}gtk-launch ${this.app.get_id().replace(/.desktop$/g, "")}`;
                    const quoted_arg = GLib.shell_quote(`${cmd}; exec ${this.applet.$._.default_shell}`);
                    const argv = [
                        this.applet.$._.terminal_emulator,
                        "-e",
                        `${this.applet.$._.default_shell} -c ${quoted_arg}`
                    ];

                    GLib.spawn_async(null, argv, null, GLib.SpawnFlags.SEARCH_PATH, null);
                    this.likelyHasSucceeded = true;
                }, (aErr) => {
                    global.logError(aErr.message);
                    this.likelyHasSucceeded = false;
                });
            } else if (shiftKey && !ctrlKey) {
                tryFn(() => {
                    // The garbage of pkexec will not work with any spawn* function!!!
                    // Tried with Util.spawn_async, GLib.spawn_async, GLib.spawn_command_line_async and
                    // GLib.spawn_async. NOTHING F*CKING WORKS!!!!
                    // So, let's leave a REAL programing language (Python) do the F*CKING job!!!
                    Util.spawn_async([
                        `${this.applet.$.metadata.path}/launcher.py`,
                        this.applet.$._.privilege_elevator,
                        "gtk-launch",
                        this.app.get_id()
                    ], null);
                    this.likelyHasSucceeded = true;
                }, (aErr) => {
                    Main.notify(_(this.applet.$.metadata.name), aErr.message);
                    global.logError(aErr.message);
                    this.likelyHasSucceeded = false;
                });
            } else {
                this.app.open_new_window(-1);
                this.likelyHasSucceeded = true;
            }

            if (this.applet.$._.recently_used_apps_enabled &&
                this instanceof GenericApplicationButton &&
                this.likelyHasSucceeded) {
                this.applet.recentAppsManager.storeRecentApp(this.app.get_id());
            }
        }.bind(this));
    }

    // NOTE: This is defined here in the GenericApplicationButton class so it can be used by all
    // applications buttons ("normal" application buttons, search result buttons and recent app.
    // buttons).
    _addAdditionalActions(aMenu) {
        this.appInfo = this.app.get_app_info();

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

            for (const action of applicationActions) {
                menuItem = new ApplicationContextMenuItem(
                    this,
                    // NOTE: The call to _() (gettext) is kind of redundant since the localized
                    // name should be provided by the desktop file. But it doesn't hurt having it.
                    _(action.localized_name),
                    action.name,
                    null
                );
                menuItem._tooltip.set_text(_(action.localized_name));
                aMenu.addMenuItem(menuItem);
            }

            aMenu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }
    }

    _addContextItem(aMenu, aContextID) {
        let menuItem;

        // NOTE: Leave this "very verbose" to avoid complications.
        // TODO: Remember to create a mechanism to handle the context_menu_items preference
        // if I add/remove/modify context menu items.
        switch (aContextID) {
            case "add_to_panel":
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Add to panel"),
                    "add_to_panel",
                    "list-add"
                );
                menuItem._tooltip.set_text(_("Add this application to the Panel launchers applet."));
                break;
            case "add_to_desktop":
                if (USER_DESKTOP_PATH) {
                    menuItem = new ApplicationContextMenuItem(
                        this,
                        _("Add to desktop"),
                        "add_to_desktop",
                        "computer"
                    );
                    menuItem._tooltip.set_text(_("Add this application to the Desktop."));
                }
                break;
            case "add_remove_favorite":
                if (AppFavorites.getAppFavorites().isFavorite(this.app.get_id())) {
                    menuItem = new ApplicationContextMenuItem(
                        this,
                        _("Remove from favorites"),
                        "remove_from_favorites",
                        "starred"
                    );
                    menuItem._tooltip.set_text(_("Remove application from your favorites."));
                } else {
                    menuItem = new ApplicationContextMenuItem(
                        this,
                        _("Add to favorites"),
                        "add_to_favorites",
                        "non-starred"
                    );
                    menuItem._tooltip.set_text(_("Add application to your favorites."));
                }
                break;
            case "uninstall":
                if (this.applet._canUninstallApps) {
                    menuItem = new ApplicationContextMenuItem(
                        this,
                        _("Uninstall"),
                        "uninstall",
                        "edit-delete"
                    );
                    menuItem._tooltip.set_text(_("Uninstall application from your system."));
                }
                break;
            case "run_with_nvidia_gpu":
                if (this.applet._isBumblebeeInstalled) {
                    menuItem = new ApplicationContextMenuItem(
                        this,
                        _("Run with NVIDIA GPU"),
                        "run_with_nvidia_gpu",
                        "cpu"
                    );
                    menuItem._tooltip.set_text(_("Run application through optirun command (Bumblebee)."));
                }
                break;
            case "run_as_root":
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Run as root"),
                    "run_as_root",
                    "system-run"
                );
                menuItem._tooltip.set_text(_("Run application as root."));
                break;
            case "edit_desktop_file":
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Edit .desktop file"),
                    "open_with_text_editor",
                    "custom-entypo-edit"
                );
                menuItem._tooltip.set_text(_("Edit this application .desktop file with a text editor."));
                break;
            case "edit_with_menu_editor":
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Edit with menu editor"),
                    "edit_with_menu_editor",
                    "custom-entypo-edit"
                );
                menuItem._tooltip.set_text(_("Edit this application with Cinnamon menu editor editor."));
                break;
            case "desktop_file_folder":
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Open .desktop file folder"),
                    "open_desktop_file_folder",
                    "folder"
                );
                menuItem._tooltip.set_text(_("Open the folder containing this application .desktop file."));
                break;
            case "run_from_terminal":
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Run from terminal"),
                    "launch_from_terminal",
                    "custom-terminal"
                );
                menuItem._tooltip.set_text(_("Run application from a terminal."));
                break;
            case "run_from_terminal_as_root":
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Run from terminal as root"),
                    "launch_from_terminal_as_root",
                    "custom-terminal"
                );
                menuItem._tooltip.set_text(_("Run application from a terminal as root."));
                break;
        }

        menuItem && aMenu.addMenuItem(menuItem);
    }

    populateMenu(aMenu) {
        // NOTE: Why set height to zero and then -1?
        // If I hide all context menu items and application actions are enabled, opening a context
        // menu with actions and then attempting to open another context menu that doesn't contain
        // application actions, it will open an empty menu with the height of the previously opened
        // context menu.
        aMenu.box.set_height(0);
        this.applet.$._.context_show_additional_application_actions && this._addAdditionalActions(aMenu);

        for (const item_def of this.applet.$._.context_menu_items) {
            item_def.enabled && this._addContextItem(aMenu, item_def.context_id);
        }

        aMenu.box.set_height(-1);
    }
};

var ApplicationButton = class ApplicationButton extends GenericApplicationButton {
    constructor(aApplet, aApp) {
        super(
            aApplet, {
                app: aApp,
                type: "app"
            }
        );
        this.category = [];

        if (aApplet.$._.show_application_icons) {
            this.icon = this.app.create_icon_texture(aApplet.$._.application_icon_size);
            this.actor.add_actor(this.icon);
        }

        this.addLabel(this.name);
        this.tooltip = new IntelligentTooltip(this.actor, "");
        this._draggable = DND.makeDraggable(this.actor);
        this.isDraggableApp = true;
    }

    get_app_id() {
        return this.app.get_id();
    }

    getDragActor() {
        // NOTE: Adding a setting for the drag actor size would indeed be overkill. 32 is big/small enough.
        return this.app.create_icon_texture(32);
    }

    getDragActorSource() {
        return this.actor;
    }

    destroy() {
        delete this._draggable;
        super.destroy();
    }
};

var DummyApplicationButton = class DummyApplicationButton extends GenericApplicationButton {
    constructor(aApplet, aButtonType, aIconSize) {
        const dummyApp = {
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
        };
        super(
            aApplet, {
                app: dummyApp,
                type: aButtonType
            }
        );

        this.category = [];

        if (this.applet.$._.show_application_icons) {
            this.addIcon(aIconSize, "custom-really-empty");
        }

        this.addLabel(this.name);
        this.tooltip = new IntelligentTooltip(this.actor, "");
        this._draggable = DND.makeDraggable(this.actor);
        this.isDraggableApp = true;
    }

    populateItem(aApp) {
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

        if (this.applet.$._.show_application_icons) {
            const icon = this.app.get_app_info().get_icon();

            if (icon instanceof Gio.Icon || icon instanceof Gio.FileIcon) {
                this.icon.set_gicon(icon);
            } else {
                this.icon.set_icon_name(icon.get_names().toString());
            }
        }

        return true;
    }

    get_app_id() {
        return this.app.get_id();
    }

    getDragActor() {
        // NOTE: Addding a setting for the drag actor size would indeed be overkill. 32 is big/small enough.
        return this.app.create_icon_texture(32);
    }

    getDragActorSource() {
        return this.actor;
    }

    destroy() {
        delete this._draggable;
        super.destroy();
    }

};

var CategoryButton = class CategoryButton extends SimpleMenuItem {
    constructor(aApplet, aCategory) {
        super(
            aApplet, {
                activatable: false,
                name: aCategory.get_name(),
                styleClass: "menu-category-button",
                categoryId: aCategory.get_menu_id()
            }
        );
        this.actor.accessible_role = Atk.Role.LIST_ITEM;

        if (aApplet.$._.show_category_icons) {
            this.addIcon(aApplet.$._.category_icon_size, aCategory.get_icon());
        }

        this.addLabel(this.name, "menu-category-button-label");

        if (!VECTOR_BOX_LEGACY) {
            this._signals.connect(this.actor, "motion-event",
                (aActor, aEvent) => this._categoryMotionEvent(aActor, aEvent));
        }
    }

    _categoryMotionEvent(aActor, aEvent) { // jshint ignore:line
        if (this.applet.vectorBox.vector_update_id === 0) {
            this.applet.vectorBox.enableMask.call(this.applet.vectorBox, aActor);
        }

        return Clutter.EVENT_PROPAGATE;
    }

    destroy() {
        this._signals.disconnect("motion-event", this.actor);
        super.destroy();
    }
};

var CategoriesApplicationsBox = class CategoriesApplicationsBox {
    constructor() {
        this.actor = new St.BoxLayout();
        this.actor._delegate = this;
    }
};

var CustomCommandButton = class CustomCommandButton extends SimpleMenuItem {
    constructor(aApplet, aApp, aCallback) {
        super(
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
            this.applet.$._.custom_launchers_icon_size,
            icon,
            this.app.icon.search("-symbolic") !== -1
        );

        this.tooltip = new IntelligentTooltip(this.actor, "");
    }

    activate(event) { // jshint ignore:line
        if (this.callback) {
            this.applet.closeMainMenu();

            this.applet.$.schedule_manager.idleCall(this.app.id, function() {
                this.callback();
            }.bind(this));
        } else {
            const cmd = this.app.command;
            this.applet.closeMainMenu();

            this.applet.$.schedule_manager.idleCall(this.app.id, function() {
                tryFn(() => {
                    // From the docs:
                    // spawn_command_line_async: A simple version of GLib.spawn_async() that parses a
                    // command line with GLib.shell_parse_argv() and passes it to GLib.spawn_async().
                    // Runs a command line in the background. Unlike GLib.spawn_async(), the
                    // GLib.SpawnFlags.SEARCH_PATH flag is enabled, other flags are not.
                    GLib.spawn_command_line_async(cmd);
                }, (aErr) => { // jshint ignore:line
                    // FIXME: This catch block is kind of useless.
                    // Maybe I should remove it?
                    try {
                        if (cmd.indexOf("/") !== -1) { // Try to open file if cmd is a path
                            Main.Util.spawnCommandLine(`xdg-open "${cmd}"`);
                        }
                    } catch (aErr2) {
                        Main.notify(_(this.applet.$.metadata.name), aErr2.message);
                    }
                });
            }.bind(this));
        }
    }
};

var RecentAppsManager = class RecentAppsManager {
    constructor(aApplet) {
        this.applet = aApplet;
        this._signal_manager = new SignalManager.SignalManager();

        const schemaDir = Gio.file_new_for_path(`${__meta.path}/schemas`);
        let schemaSource;

        if (schemaDir.query_exists(null)) {
            schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
                GioSSS.get_default(),
                false);
        } else {
            schemaSource = GioSSS.get_default();
        }

        const schemaObj = schemaSource.lookup(GSETTINGS_SCHEMA, false);

        if (!schemaObj) {
            throw new Error(`Schema ${GSETTINGS_SCHEMA} could not be found for xlet ${__meta.uuid}. Please check your installation.`);
        }

        this.schema = new Gio.Settings({
            settings_schema: schemaObj
        });
    }

    storeRecentApp(aAppID) {
        if (this.applet.$._.recently_used_apps_ignore_favorites &&
            AppFavorites.getAppFavorites().isFavorite(aAppID)) {
            return;
        }

        const t = new Date().getTime();
        const recApps = this.recentApps;
        let recAppUpdated = false;

        // Update recent app if it was previously launched.
        arrayEach(recApps, (aApp, aIdx) => {
            if (aApp.indexOf(aAppID) === 0) {
                recApps[aIdx] = `${aAppID}:${t}`;
                recAppUpdated = true;
                return false;
            }
            return true;
        });

        // Push the app if it wasn't previously launched.
        if (!recAppUpdated) {
            recApps.push(`${aAppID}:${t}`);
        }

        this.filterAndStore(recApps);
    }

    filterAndStore(aRecentApps) {
        /* NOTE: This function is also called when favorites are changed, so when a
         * favorite is added, the recent apps. list is also updated.
         */
        const recentApps = aRecentApps || this.recentApps;
        // Holy ·$%&/()!!! The only freaking way that I could find to remove duplicates!!!
        // Like always, Stack Overflow is a life saver.
        // http://stackoverflow.com/questions/31014324/remove-duplicated-object-in-array
        const temp = new Set();

        this.recentApps = recentApps.filter((aVal) => {
            const appID = aVal.split(":")[0];
            return (temp.has(appID) ? false : temp.add(appID)) ||
                (this.applet.$._.recently_used_apps_ignore_favorites &&
                    !AppFavorites.getAppFavorites().isFavorite(appID));
        });
    }

    set recentApps(aValue) {
        this.schema.set_strv("recently-used-applications", aValue);
    }

    get recentApps() {
        return this.schema.get_strv("recently-used-applications");
    }

    init() {
        this._signal_manager.connect(this.schema, "changed::recently-used-applications", function() {
            this.applet._refreshRecentApps.call(this.applet);
        }.bind(this));
        this._signal_manager.connect(
            AppFavorites.getAppFavorites(),
            "changed",
            function() {
                /* NOTE: When adding a favorite from the applications listed inside the
                 * recent apps. category, the list of recent apps. will be updated
                 * to ignore the recently favorited app. (if configured to do so) and
                 * a call to this._displayButtons will be made to update the list
                 * of recent apps. category. WOW Isn't this micro-managing!?
                 */
                if (this.applet.$._.recently_used_apps_ignore_favorites) {
                    this.filterAndStore();

                    if (this.applet.lastSelectedCategory === this.applet.recentAppsCatName) {
                        this.applet._displayButtons.call(this.applet, this.applet.lastSelectedCategory);
                    }
                }
            }.bind(this)
        );
    }

    destroy() {
        this._signal_manager.disconnectAllSignals();
    }
};

/**
 * FIXME: The following two "vector box classes" are the isolated code that takes care of the
 * categories navigation on mouse hover.
 * The VectorBoxLegacy class is the one that makes use of an St.Polygon and the VectorBox class
 * is the one that uses arithmetic calculations.
 * For now I'm using by default the VectorBoxLegacy class because I still have to figure out how
 * to make the VectorBox class work when the categories and applications boxes swap places.
 * I already tested the VectorBox class and it works perfectly.
 * Although the St.Polygon widget is used for debugging in the VectorBox class, I have to hurry
 * up on making the class work fully with the swap_categories_box preference because the St.Polygon
 * widget was added specifically to be used by the menu applet and might get deleted any time now.
 */

/* Category Box
 *   _____
 *  |    /|T
 *  |   / |
 *  |  /__|__________pointer Y
 *  | |\  |
 *  | | \ |
 *  |_|__\|B
 *    |
 *    |
 *    |pointer X
 */

/*
 * The vector mask activates on any motion from a category button. At this point, all
 * category buttons are made non-reactive.
 *
 * The starting point and two corners of the category box are taken, and two angles are
 * calculated to intersect with the right box corners. If a movement is within those two
 * angles, the current position is made the last position and used on the next interval.
 *
 * In this manner the left vertex of the triangle follows the mouse and category-switching
 * is disabled as long as the pointer stays in bounds.
 *
 * If the poll interval is made too large, category switching will become sluggish. Polling
 * stops when there is no movement.
 */
var VectorBox = class VectorBox {
    constructor(aApplet) {
        this._applet = aApplet;
        this.vector_mask_info = {
            debug_actor: null
        };

        this.vector_update_id = 0;
    }

    get catAlloc() {
        return this._applet.categoriesScrollBox.get_allocation_box();
    }

    get catPos() {
        return this._applet.categoriesScrollBox.get_transformed_position();
    }

    calc_angle(x, y) {
        if (x === 0 || y === 0) {
            return 0;
        }

        return Math.atan2(y, x) * (180 / Math.PI);
    }

    _getNewVectorInfo() {
        let [mx, my, mask] = global.get_pointer(); // jshint ignore:line
        let [bx, by] = this.catPos;

        // The allocation is the only thing that works here - the 'height'
        // property (and natural height) are the size of the entire scrollable
        // area (the inner categoriesBox), which is weird...
        let alloc = this.catAlloc;
        let bw = alloc.x2 - alloc.x1;
        let bh = alloc.y2 - alloc.y1;

        let x_dist = bx + bw - mx;
        let y_dist = my - by;

        // Calculate their angle from 3 o'clock.
        let top_angle = this.calc_angle(x_dist, y_dist);
        y_dist -= bh;
        let bottom_angle = this.calc_angle(x_dist, y_dist);

        let debug_actor = null;

        if (VECTOR_BOX_DEBUG) {
            debug_actor = new St.Polygon({
                ulc_x: mx,
                ulc_y: my,
                llc_x: mx,
                llc_y: my,
                urc_x: bx + bw,
                urc_y: by,
                lrc_x: bx + bw,
                lrc_y: by + bh,
                debug: true
            });

            global.stage.add_actor(debug_actor);
        }

        return {
            start_x: mx,
            start_y: my,
            bx: bx,
            by1: by,
            by2: by + bh,
            bw: bw,
            bh: bh,
            top_angle: top_angle,
            bottom_angle: bottom_angle,
            debug_actor: debug_actor
        };
    }

    _updateVectorInfo(mx, my) {
        let bx = this.vector_mask_info.bx;
        let by = this.vector_mask_info.by1;
        let bw = this.vector_mask_info.bw;
        let bh = this.vector_mask_info.bh;

        let x_dist = bx + bw - mx;
        let y_dist = my - by;

        // Calculate their angle from 3 o'clock.
        let top_angle = this.calc_angle(x_dist, y_dist);
        y_dist -= bh;

        let bottom_angle = this.calc_angle(x_dist, y_dist);

        // Padding moves the saved x position slightly left, this makes the mask
        // more forgiving of random small movement when starting to choose an
        // app button.
        this.vector_mask_info.start_x = mx;
        this.vector_mask_info.start_y = my;
        this.vector_mask_info.top_angle = top_angle;
        this.vector_mask_info.bottom_angle = bottom_angle;

        if (VECTOR_BOX_DEBUG) {
            this.vector_mask_info.debug_actor.ulc_x = mx;
            this.vector_mask_info.debug_actor.llc_x = mx;
            this.vector_mask_info.debug_actor.ulc_y = my;
            this.vector_mask_info.debug_actor.llc_y = my;
        }
    }

    _keepMaskActive() {
        let ret = false;
        let angle = 0;

        let [mx, my, mask] = global.get_pointer(); // jshint ignore:line

        // Check for out of range entirely.
        if (mx >= this.vector_mask_info.bx + this.vector_mask_info.bw ||
            my < this.vector_mask_info.by1 ||
            my > this.vector_mask_info.by2) {
            return false;
        }

        let x_dist = mx - this.vector_mask_info.start_x;
        let y_dist = this.vector_mask_info.start_y - my;

        if (Math.abs(Math.hypot(x_dist, y_dist)) < VECTOR_BOX_MIN_MOVEMENT) {
            return false;
        }

        angle = this.calc_angle(x_dist, y_dist);

        ret = angle <= this.vector_mask_info.top_angle &&
            angle >= this.vector_mask_info.bottom_angle;

        this._updateVectorInfo(mx, my);

        if (VECTOR_BOX_DEBUG) {
            global.log(`${this.vector_mask_info.top_angle.toFixed()} <---${angle.toFixed()}---> ${this.vector_mask_info.bottom_angle.toFixed()} - Continue? ${ret}`);
        }

        return ret;
    }

    enableMask(actor) {
        this.disableMask();

        this.vector_mask_info = this._getNewVectorInfo(actor);

        // While the mask is active, disable category buttons.
        this._setCategoryButtonsReactive(false);

        this.vector_update_id = Mainloop.timeout_add(VECTOR_BOX_POLL_INTERVAL,
            this._maskPollTimeout.bind(this));
    }

    disableMask() {
        if (this.vector_update_id > 0) {
            Mainloop.source_remove(this.vector_update_id);
            this.vector_update_id = 0;
            this._setCategoryButtonsReactive(true);

            if (VECTOR_BOX_DEBUG) {
                this.vector_mask_info.debug_actor.destroy();
            }
        }
    }

    _maskPollTimeout() {
        if (this._keepMaskActive()) {
            return GLib.SOURCE_CONTINUE;
        }

        this.disableMask();
        return GLib.SOURCE_REMOVE;
    }

    _setCategoryButtonsReactive(aActive) {
        for (const btn of this._applet._categoryButtons) {
            btn.actor.reactive = aActive;
        }
    }
};

/*
 * The vectorBox overlays the the categoriesBox to aid in navigation from categories to apps
 * by preventing misselections. It is set to the same size as the categoriesScrollBox and
 * categoriesBox.
 *
 * The actor is a quadrilateral that we turn into a triangle by setting the A and B vertices to
 * the same position. The size and origin of the vectorBox are calculated in _getVectorInfo().
 * Using those properties, the bounding box is sized as (w, h) and the triangle is defined as
 * follows:
 *   _____
 *  |    /|D
 *  |   / |     AB: (mx, my)
 *  | A/  |      C: (w, h)
 *  | B\  |      D: (w, 0)
 *  |   \ |
 *  |____\|C
 */
var VectorBoxLegacy = class VectorBoxLegacy {
    constructor(aApplet) {
        this._applet = aApplet;
        this.actor = null;
        this.vector_update_id = 0;
        this.actor_motion_id = 0;
    }

    _getVectorInfo() {
        const [mx, my, mask] = global.get_pointer(); // jshint ignore:line
        const [bx, by] = this._applet.categoriesScrollBox.get_transformed_position();
        const [bw, bh] = this._applet.categoriesScrollBox.get_transformed_size();

        const xformed_mx = mx - bx;
        const xformed_my = my - by;

        if (xformed_mx < 0 || xformed_mx > bw || xformed_my < 0 || xformed_my > bh) {
            return null;
        }

        return {
            mx: xformed_mx + (this._applet.$._.swap_categories_box ? -2 : +2),
            my: xformed_my + (this._applet.$._.swap_categories_box ? -2 : +2),
            w: this._applet.$._.swap_categories_box ? 0 : bw,
            h: bh
        };
    }

    enableMask(aCatActor) {
        this.disableMask();
        const vi = this._getVectorInfo();

        if (!vi) {
            return;
        }

        this.actor = new St.Polygon({
            debug: VECTOR_BOX_DEBUG,
            reactive: true,
            width: vi.w,
            height: vi.h,
            ulc_x: vi.mx,
            ulc_y: vi.my,
            llc_x: vi.mx,
            llc_y: vi.my,
            urc_x: vi.w,
            urc_y: 0,
            lrc_x: vi.w,
            lrc_y: vi.h
        });

        this._applet.categoriesScrollBox.add_actor(this.actor);
        this.actor.connect("leave-event", () => this.disableMask());
        this.actor.connect("motion-event", () => this._maybeUpdateVectorBox());
        this.actor_motion_id = aCatActor.connect("motion-event", () => this._maybeUpdateVectorBox());
        this.current_motion_actor = aCatActor;
    }

    _maybeUpdateVectorBox() {
        if (this.vector_update_id > 0) {
            Mainloop.source_remove(this.vector_update_id);
            this.vector_update_id = 0;
        }
        this.vector_update_id = Mainloop.timeout_add(VECTOR_BOX_POLL_INTERVAL, () => this._updateVectorBox());
    }

    _updateVectorBox() {
        if (this.actor) {
            const vi = this._getVectorInfo();
            if (vi) {
                this.actor.ulc_x = vi.mx;
                this.actor.llc_x = vi.mx;
                this.actor.queue_repaint();
            } else {
                this.disableMask();
            }
        }
        this.vector_update_id = 0;

        return Clutter.EVENT_PROPAGATE;
    }

    disableMask() {
        if (this.actor !== null) {
            this.actor.destroy();
            this.actor = null;
        }

        if (this.actor_motion_id > 0 && this.current_motion_actor !== null) {
            this.current_motion_actor.disconnect(this.actor_motion_id);
            this.actor_motion_id = 0;
            this.current_motion_actor = null;
        }
    }
};

function getVectorBox(aApplet) {
    return VECTOR_BOX_LEGACY ? new VectorBoxLegacy(aApplet) : new VectorBox(aApplet);
}

Debugger.wrapObjectMethods({
    ApplicationButton: ApplicationButton,
    ApplicationContextMenuItem: ApplicationContextMenuItem,
    CategoriesApplicationsBox: CategoriesApplicationsBox,
    CategoryButton: CategoryButton,
    CustomCommandButton: CustomCommandButton,
    DummyApplicationButton: DummyApplicationButton,
    GenericApplicationButton: GenericApplicationButton,
    IntelligentTooltip: IntelligentTooltip,
    RecentAppsManager: RecentAppsManager,
    SimpleMenuItem: SimpleMenuItem,
    VectorBox: VectorBox,
    VectorBoxLegacy: VectorBoxLegacy,
    VisibleChildIterator: VisibleChildIterator
});

/* exported getVectorBox
 */
