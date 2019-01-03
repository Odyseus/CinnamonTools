const XletUUID = "{{UUID}}";
let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta[XletUUID];
}

const AppFavorites = imports.ui.appFavorites;
const Atk = imports.gi.Atk;
const Clutter = imports.gi.Clutter;
const FileUtils = imports.misc.fileUtils;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GioSSS = Gio.SettingsSchemaSource;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const Pango = imports.gi.Pango;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Tooltips = imports.ui.tooltips;
const Util = imports.misc.util;

const USER_DESKTOP_PATH = FileUtils.getUserDesktopDir();

var INITIAL_BUTTON_LOAD = 30; // jshint ignore:line
var SETTINGS_SCHEMA = "org.cinnamon.applets." + XletUUID;

Gettext.bindtextdomain(XletMeta.uuid, GLib.get_home_dir() + "/.local/share/locale");

/**
 * Return the localized translation of a string, based on the xlet domain or
 * the current global domain (Cinnamon's).
 *
 * This function "overrides" the _() function globally defined by Cinnamon.
 *
 * @param {String} aStr - The string being translated.
 *
 * @return {String} The translated string.
 */
function _(aStr) {
    let customTrans = Gettext.dgettext(XletMeta.uuid, aStr);

    if (customTrans !== aStr && aStr !== "") {
        return customTrans;
    }

    return Gettext.gettext(aStr);
}

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
            if (this.icon) {
                this.addActor(this.icon);
                this.icon.realize();
            }
        }

        this.addActor(this.label);
        this._tooltip = new CustomTooltip(this.actor, "");
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

                this._appButton.toggleMenu();
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
                this._appButton.toggleMenu();
                break;
            case "add_to_favorites":
                AppFavorites.getAppFavorites().addFavorite(this._appButton.app.get_id());
                this._appButton.toggleMenu();
                break;
            case "remove_from_favorites":
                AppFavorites.getAppFavorites().removeFavorite(this._appButton.app.get_id());
                this._appButton.toggleMenu();
                break;
            case "uninstall":
                this._appButton._applet.closeMainMenu();
                Util.spawnCommandLine("/usr/bin/cinnamon-remove-application '" + this._appButton.app.get_app_info().get_filename() + "'");
                break;
            case "run_with_nvidia_gpu":
                this._appButton._applet.closeMainMenu();

                try {
                    Util.spawnCommandLine("optirun gtk-launch " + this._appButton.app.get_id());
                    likelyHasSucceeded = true;
                } catch (aErr) {
                    global.logError(aErr.message);
                    likelyHasSucceeded = false;
                } finally {
                    if (this._appButton._applet.pref_recently_used_apps_enabled &&
                        this._appButton instanceof ApplicationButton &&
                        likelyHasSucceeded) {
                        this._appButton._applet.recentAppsManager.storeRecentApp(this._appButton.app.get_id());
                    }
                }
                break;
            case "launch_from_terminal":
            case "launch_from_terminal_as_root":
                this._appButton._applet.closeMainMenu();

                let elevated = this._action === "launch_from_terminal_as_root" ?
                    this._appButton._applet.pref_privilege_elevator + " " :
                    "";
                let cmd = elevated + "gtk-launch " + this._appButton.app.get_id().replace(/.desktop$/g, "");
                let argv = [
                    this._appButton._applet.pref_terminal_emulator,
                    "-e",
                    this._appButton._applet.pref_default_shell + " -c " +
                    GLib.shell_quote(cmd + "; exec " + this._appButton._applet.pref_default_shell)
                ];

                try {
                    Util.spawn_async(argv, null);
                    likelyHasSucceeded = true;
                } catch (aErr) {
                    global.logError(aErr.message);
                    likelyHasSucceeded = false;
                } finally {
                    if (this._appButton._applet.pref_recently_used_apps_enabled &&
                        this._appButton instanceof ApplicationButton &&
                        likelyHasSucceeded) {
                        this._appButton._applet.recentAppsManager.storeRecentApp(this._appButton.app.get_id());
                    }
                }
                break;
            case "open_desktop_file_folder":
                try {
                    this._openDesktopFileFolder(GLib.path_get_dirname(pathToDesktopFile));
                } catch (aErr) {
                    Main.notify(_(this._appButton._applet.metadata.name), aErr.message);
                    global.logError(aErr.message);
                    this._openDesktopFileFolder("");
                }
                break;
            case "run_as_root":
                this._appButton._applet.closeMainMenu();

                try {
                    // The garbage of pkexec will not work with any spawn* function!!!
                    // Tried with Util.spawn_async, GLib.spawn_async, GLib.spawn_command_line_async and
                    // GLib.spawn_async. NOTHING F*CKING WORKS!!!!
                    // So, let's leave a REAL programing language (Python) do the F*CKING job!!!
                    Util.spawn_async([
                        this._appButton._applet.metadata.path + "/launcher.py",
                        this._appButton._applet.pref_privilege_elevator,
                        "gtk-launch",
                        this._appButton.app.get_id()
                    ], null);
                    likelyHasSucceeded = true;
                } catch (aErr) {
                    Main.notify(_(this._appButton._applet.metadata.name), aErr.message);
                    global.logError(aErr.message);
                    likelyHasSucceeded = false;
                } finally {
                    if (this._appButton._applet.pref_recently_used_apps_enabled &&
                        this._appButton instanceof ApplicationButton &&
                        likelyHasSucceeded) {
                        this._appButton._applet.recentAppsManager.storeRecentApp(this._appButton.app.get_id());
                    }
                }
                break;
            case "open_with_text_editor":
                if (this._appButton._applet.pref_context_gain_privileges) {
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
        }
        return false;
    },

    _openDesktopFileFolder: function(aDirPath) {
        this._appButton._applet.closeMainMenu();

        try {
            if (aDirPath !== "") {
                GLib.spawn_command_line_async("xdg-open " + '"' + aDirPath + '"');
            }
        } catch (aErr) {
            Main.notify(_(this._appButton._applet.metadata.name), aErr.message);
            global.logError(aErr.message);
        }
    },

    _launchDesktopFile: function(aFileOwner) {
        this._appButton._applet.closeMainMenu();

        let cmd = "";
        if (this._appButton._applet.pref_context_gain_privileges &&
            GLib.get_user_name().toString() !== aFileOwner) {
            cmd += this._appButton._applet.pref_privilege_elevator;
        }

        let editor = this._appButton._applet.pref_context_custom_editor_for_edit_desktop_file;

        if (editor !== "") {
            cmd += " " + editor + " " + '"' + this._appButton.app.get_app_info().get_filename() + '"';
        } else {
            cmd += " xdg-open " + '"' + this._appButton.app.get_app_info().get_filename() + '"';
        }

        try {
            GLib.spawn_command_line_async(cmd);
        } catch (aErr) {
            Main.notify(_(this._appButton._applet.metadata.name), aErr.message);
            global.logError(aErr.message);
        }
    }
};

function GenericApplicationButton() {
    this._init.apply(this, arguments);
}

GenericApplicationButton.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(aApplet, aApp, aWithContextMenu) {
        this.app = aApp;
        this._applet = aApplet;
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            hover: false
        });

        this.withContextMenu = aWithContextMenu;

        if (this.withContextMenu) {
            this.menu = new PopupMenu.PopupSubMenu(this.actor);
            this.menu.actor.set_style_class_name("menu-context-menu");
            this.menu.connect("open-state-changed",
                () => this._subMenuOpenStateChanged());
        }
    },

    highlight: function() {
        this.actor.add_style_pseudo_class("highlighted");
    },

    unhighlight: function() {
        let app_key = this.app.get_id();

        if (app_key === null) {
            app_key = this.app.get_name() + ":" + this.app.get_description();
        }

        this._applet._knownApps.push(app_key);
        this.actor.remove_style_pseudo_class("highlighted");
    },

    _onButtonReleaseEvent: function(actor, event) {
        if (event.get_button() === 1) {
            this.activate(event);
        }
        if (event.get_button() === 3) {
            this.activateContextMenus(event);
        }
        return true;
    },

    activate: function(event) { // jshint ignore:line
        this.unhighlight();
        let likelyHasSucceeded = false;

        let ctrlKey = (Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2]) !== 0;
        let shiftKey = (Clutter.ModifierType.SHIFT_MASK & global.get_pointer()[2]) !== 0;
        // let altKey = (Clutter.ModifierType.MOD1_MASK & global.get_pointer()[2]) !== 0;
        // global.logError("ctrlKey " + ctrlKey);
        // global.logError("shiftKey " + shiftKey);
        // global.logError("altKey " + altKey);

        this._applet.closeMainMenu();

        if (ctrlKey) {
            try {
                let elevated = shiftKey ?
                    this._applet.pref_privilege_elevator + " " :
                    "";
                let cmd = elevated + "gtk-launch " + this.app.get_id().replace(/.desktop$/g, "");
                let argv = [
                    this._applet.pref_terminal_emulator,
                    "-e",
                    this._applet.pref_default_shell + " -c " +
                    GLib.shell_quote(cmd + "; exec " + this._applet.pref_default_shell)
                ];

                GLib.spawn_async(null, argv, null, GLib.SpawnFlags.SEARCH_PATH, null);
                likelyHasSucceeded = true;
            } catch (aErr) {
                global.logError(aErr.message);
                likelyHasSucceeded = false;
            }
        } else if (shiftKey && !ctrlKey) {
            try {
                Util.spawnCommandLine(this._applet.pref_privilege_elevator +
                    " gtk-launch " + this.app.get_id());
                likelyHasSucceeded = true;
            } catch (aErr) {
                Main.notify(_(this._appButton._applet.metadata.name), aErr.message);
                global.logError(aErr.message);
                likelyHasSucceeded = false;
            }
        } else {
            this.app.open_new_window(-1);
            likelyHasSucceeded = true;
        }

        if (this._applet.pref_recently_used_apps_enabled &&
            this instanceof ApplicationButton &&
            likelyHasSucceeded) {
            this._applet.recentAppsManager.storeRecentApp(this.app.get_id());
        }
    },

    activateContextMenus: function(event) { // jshint ignore:line
        if (this.withContextMenu && !this.menu.isOpen) {
            this._applet.closeContextMenus(this.app, true);
        }
        this.toggleMenu();
    },

    closeMenu: function() {
        if (this.withContextMenu) {
            this.menu.close();
        }
    },

    toggleMenu: function() {
        if (!this.withContextMenu) {
            return;
        }

        if (!this.menu.isOpen) {
            let children = this.menu.box.get_children();

            for (let i = children.length - 1; i >= 0; i--) {
                this.menu.box.remove_actor(children[i]);
            }

            let menuItem;

            if (this._applet.pref_context_show_add_to_panel) {
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Add to panel"),
                    "add_to_panel",
                    "list-add"
                );
                menuItem._tooltip.set_text(_("Add this application to the Panel launchers applet."));
                this.menu.addMenuItem(menuItem);
            }

            if (this._applet.pref_context_show_add_to_desktop && USER_DESKTOP_PATH) {
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Add to desktop"),
                    "add_to_desktop",
                    "computer"
                );
                menuItem._tooltip.set_text(_("Add this application to the Desktop."));
                this.menu.addMenuItem(menuItem);
            }

            if (this._applet.pref_context_show_add_remove_favorite) {
                if (AppFavorites.getAppFavorites().isFavorite(this.app.get_id())) {
                    menuItem = new ApplicationContextMenuItem(
                        this,
                        _("Remove from favorites"),
                        "remove_from_favorites",
                        "starred"
                    );
                    menuItem._tooltip.set_text(_("Remove application from your favorites."));
                    this.menu.addMenuItem(menuItem);
                } else {
                    menuItem = new ApplicationContextMenuItem(
                        this,
                        _("Add to favorites"),
                        "add_to_favorites",
                        "non-starred"
                    );
                    menuItem._tooltip.set_text(_("Add application to your favorites."));
                    this.menu.addMenuItem(menuItem);
                }
            }

            if (this._applet._canUninstallApps) {
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Uninstall"),
                    "uninstall",
                    "edit-delete"
                );
                menuItem._tooltip.set_text(_("Uninstall application from your system."));
                this.menu.addMenuItem(menuItem);
            }

            if (this._applet._isBumblebeeInstalled) {
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Run with NVIDIA GPU"),
                    "run_with_nvidia_gpu",
                    "cpu"
                );
                menuItem._tooltip.set_text(_("Run application through optirun command (Bumblebee)."));
                this.menu.addMenuItem(menuItem);
            }

            if (this._applet.pref_context_show_run_as_root) {
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Run as root"),
                    "run_as_root",
                    "system-run"
                );
                menuItem._tooltip.set_text(_("Run application as root."));
                this.menu.addMenuItem(menuItem);
            }

            if (this._applet.pref_context_show_edit_desktop_file) {
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Edit .desktop file"),
                    "open_with_text_editor",
                    "custom-entypo-edit"
                );
                menuItem._tooltip.set_text(_("Edit this application .desktop file with a text editor."));
                this.menu.addMenuItem(menuItem);
            }

            if (this._applet.pref_context_show_desktop_file_folder) {
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Open .desktop file folder"),
                    "open_desktop_file_folder",
                    "folder"
                );
                menuItem._tooltip.set_text(_("Open the folder containg this application .desktop file."));
                this.menu.addMenuItem(menuItem);
            }

            if (this._applet.pref_context_show_run_from_terminal) {
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Run from terminal"),
                    "launch_from_terminal",
                    "custom-terminal"
                );
                menuItem._tooltip.set_text(_("Run application from a terminal."));
                this.menu.addMenuItem(menuItem);
            }

            if (this._applet.pref_context_show_run_from_terminal_as_root) {
                menuItem = new ApplicationContextMenuItem(
                    this,
                    _("Run from terminal as root"),
                    "launch_from_terminal_as_root",
                    "custom-terminal"
                );
                menuItem._tooltip.set_text(_("Run application from a terminal as root."));
                this.menu.addMenuItem(menuItem);
            }
        }
        this.menu.toggle();
    },

    _subMenuOpenStateChanged: function() {
        if (this.menu.isOpen) {
            this._applet._activeContextMenuParent = this;
            this._applet._scrollToButton(this.menu);
        } else {
            this._applet._activeContextMenuItem = null;
            this._applet._activeContextMenuParent = null;
        }
    },

    get _contextIsOpen() {
        return this.menu.isOpen;
    },

    destroy: function() {
        this.label.destroy();

        if (this.icon) {
            this.icon.destroy();
        }

        if (this.withContextMenu) {
            this.menu.destroy();
        }

        PopupMenu.PopupBaseMenuItem.prototype.destroy.call(this);
    }
};

function ApplicationButton() {
    this._init.apply(this, arguments);
}

ApplicationButton.prototype = {
    __proto__: GenericApplicationButton.prototype,

    _init: function(aApplet, aApp) {
        GenericApplicationButton.prototype._init.call(this, aApplet, aApp, true);
        this.category = [];
        this.actor.set_style_class_name("menu-application-button");

        if (aApplet.pref_show_application_icons) {
            this.icon = this.app.create_icon_texture(aApplet.pref_application_icon_size);
            this.addActor(this.icon);
        }
        this.name = this.app.get_name();
        this.label = new St.Label({
            text: this.name,
            style_class: "menu-application-button-label"
        });
        this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;
        this.label.set_style(aApplet.max_width_for_buttons);
        this.addActor(this.label);

        this.actor.label_actor = this.label;
        if (aApplet.pref_show_application_icons) {
            this.icon.realize();
        }
        this.label.realize();
        this.tooltip = new CustomTooltip(this.actor, "");
    },

    get_app_id: function() {
        return this.app.get_id();
    }
};

function GenericButton() {
    this._init.apply(this, arguments);
}

GenericButton.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(aApplet, aLabel, aIcon, aReactive, aCallback) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            hover: false
        });
        this.actor.set_style_class_name("menu-application-button");
        this.actor._delegate = this;
        this.button_name = "";

        this.label = new St.Label({
            text: aLabel,
            style_class: "menu-application-button-label"
        });
        this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;
        this.label.set_style(aApplet.max_width_for_buttons);

        if (aIcon !== null) {
            let icon_actor = new St.Icon({
                icon_name: aIcon,
                icon_type: St.IconType.FULLCOLOR,
                icon_size: aApplet.pref_application_icon_size
            });
            this.addActor(icon_actor);
        }

        this.addActor(this.label);
        this.label.realize();

        this.actor.reactive = aReactive;
        this.callback = aCallback;
    },

    _onButtonReleaseEvent: function(actor, event) {
        if (event.get_button() === 1) {
            this.callback();
        }
    }
};

function CategoryButton() {
    this._init.apply(this, arguments);
}

CategoryButton.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(aApplet, aCategory) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            hover: false
        });

        this.actor.set_style_class_name("menu-category-button");
        let label;
        let icon = null;
        if (aCategory) {
            if (aApplet.pref_show_category_icons) {
                if (aCategory.get_menu_id() === "favorites" ||
                    aCategory.get_menu_id() === "recentApps") {
                    this.icon_name = aCategory.get_icon();
                    icon = new St.Icon({
                        icon_name: this.icon_name,
                        icon_size: aApplet.pref_category_icon_size,
                        icon_type: St.IconType.FULLCOLOR
                    });
                } else {
                    icon = aCategory.get_icon();
                    if (icon && icon.get_names) {
                        this.icon_name = icon.get_names().toString();
                    } else {
                        this.icon_name = "";
                    }
                }
            } else {
                this.icon_name = "";
            }
            label = aCategory.get_name();
        } else {
            label = _("All Applications");
        }

        this.actor._delegate = this;
        this.label = new St.Label({
            text: label,
            style_class: "menu-category-button-label"
        });
        if (aCategory && this.icon_name) {
            if (aCategory.get_menu_id() === "favorites" ||
                aCategory.get_menu_id() === "recentApps") {
                this.icon = icon;
            } else {
                this.icon = new St.Icon({
                    gicon: icon,
                    icon_size: aApplet.pref_category_icon_size,
                    icon_type: St.IconType.FULLCOLOR
                });
            }
            if (this.icon) {
                this.addActor(this.icon);
                this.icon.realize();
            }
        }
        this.actor.accessible_role = Atk.Role.LIST_ITEM;
        this.addActor(this.label);
        this.label.realize();
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

function RecentAppsCategoryButton() {
    this._init.apply(this, arguments);
}

RecentAppsCategoryButton.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(aApplet) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            hover: false
        });
        this.actor.set_style_class_name("menu-category-button");
        this.actor._delegate = this;
        this.label = new St.Label({
            text: _("Recent Applications"),
            style_class: "menu-category-button-label"
        });

        if (aApplet.pref_show_category_icons) {
            this.icon = new St.Icon({
                icon_name: "folder-recent",
                icon_size: aApplet.pref_category_icon_size,
                icon_type: St.IconType.FULLCOLOR
            });
            this.addActor(this.icon);
            this.icon.realize();
        } else {
            this.icon = null;
        }

        this.addActor(this.label);
        this.label.realize();
    }
};

function CustomCommandButton() {
    this._init.apply(this, arguments);
}

CustomCommandButton.prototype = {
    __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,

    _init: function(aApplet, aApp, aCallback) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            hover: false
        });
        this.actor.set_style_class_name("menu-application-button");

        this.app = aApp;
        this._applet = aApplet;
        // this.callback is a remnants of past version of this applet. Not used at present.
        // Leave it just in case I want to add custom launchers programmatically.
        this.callback = aCallback;

        let icon_type = (this.app.icon.search("-symbolic") !== -1) ? 0 : 1;
        let iconObj = {
            icon_size: this._applet.pref_custom_launchers_icon_size,
            icon_type: icon_type
        };

        if (this.app.icon.indexOf("/") !== -1) {
            iconObj["gicon"] = new Gio.FileIcon({
                file: Gio.file_new_for_path(this.app.icon)
            });
        } else {
            iconObj["icon_name"] = this.app.icon;
        }

        this.icon = new St.Icon(iconObj);
        this.addActor(this.icon);

        this.name = this.app.label;
        this.isDraggableApp = false;

        this.tooltip = new CustomTooltip(this.actor, "");
    },

    _onButtonReleaseEvent: function(actor, event) {
        if (event.get_button() === 1) {
            this.activate(event);
        }
        return true;
    },

    activate: function(event) { // jshint ignore:line
        this.actor.set_style_class_name("menu-application-button");
        // Remnants of past version of this applet. Not used at present.
        // Leave it just in case.
        if (this.callback) {
            this.callback();
            this._applet.closeMainMenu();
        } else {
            let cmd = this.app.command;
            this._applet.closeMainMenu();
            try { // Try to execute
                // From the docs:
                // spawn_command_line_async: A simple version of GLib.spawn_async() that parses a
                // command line with GLib.shell_parse_argv() and passes it to GLib.spawn_async().
                // Runs a command line in the background. Unlike GLib.spawn_async(), the
                // GLib.SpawnFlags.SEARCH_PATH flag is enabled, other flags are not.
                GLib.spawn_command_line_async(cmd);
            } catch (aErr1) {
                // FIXME:
                // This catch block is kind of useless.
                // Maybe I should remove it.
                try {
                    if (cmd.indexOf("/") !== -1) { // Try to open file if cmd is a path
                        Main.Util.spawnCommandLine("xdg-open " + '"' + cmd + '"');
                    }
                } catch (aErr2) {
                    Main.notify(_(this._applet.metadata.name), aErr2.message);
                }
            }
        }
    }
};

function CustomTooltip() {
    this._init.apply(this, arguments);
}

CustomTooltip.prototype = {
    __proto__: Tooltips.Tooltip.prototype,

    _init: function(aActor, aText) {
        Tooltips.Tooltip.prototype._init.call(this, aActor, aText);

        this._tooltip.set_style("text-align: left;width:auto;max-width: 450px;");
        this._tooltip.get_clutter_text().set_line_wrap(true);
        this._tooltip.get_clutter_text().set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        this._tooltip.get_clutter_text().ellipsize = Pango.EllipsizeMode.NONE; // Just in case

        aActor.connect("destroy", () => this.destroy());
    },

    destroy: function() {
        Tooltips.Tooltip.prototype.destroy.call(this);
    }
};

function RecentAppsClearButton() {
    this._init.apply(this, arguments);
}

RecentAppsClearButton.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(aApplet) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            hover: false
        });
        this._applet = aApplet;
        this.actor.set_style_class_name("menu-application-button");
        this.button_name = _("Clear list");
        this.actor._delegate = this;
        this.label = new St.Label({
            text: this.button_name,
            style_class: "menu-application-button-label"
        });
        this.icon = new St.Icon({
            icon_name: "edit-clear",
            icon_type: St.IconType.SYMBOLIC,
            icon_size: this._applet.pref_application_icon_size
        });
        this.addActor(this.icon);
        this.addActor(this.label);

        this.menu = new PopupMenu.PopupSubMenu(this.actor);
    },

    _onButtonReleaseEvent: function(actor, event) {
        if (event.get_button() === 1) {
            this.activate(event);
        }
    },

    activate: function(event) { // jshint ignore:line
        this._applet.closeMainMenu();
        this._applet.recentAppsManager.recentApps = [];
        this._applet._refreshRecentApps();
    }
};

function RecentAppsManager() {
    this._init.apply(this, arguments);
}

RecentAppsManager.prototype = {
    _init: function(aApplet) {
        this._applet = aApplet;

        let schema = SETTINGS_SCHEMA;
        let schemaDir = Gio.file_new_for_path(XletMeta.path + "/schemas");
        let schemaSource;

        if (schemaDir.query_exists(null)) {
            schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
                GioSSS.get_default(),
                false);
        } else {
            schemaSource = GioSSS.get_default();
        }

        this.schemaObj = schemaSource.lookup(schema, false);

        if (!this.schemaObj) {
            throw new Error(_("Schema %s could not be found for xlet %s.")
                .format(schema, XletUUID) + _("Please check your installation."));
        }

        this.schema = new Gio.Settings({
            settings_schema: this.schemaObj
        });

        this._handlers = [];
    },

    storeRecentApp: function(aAppID) {
        if (this._applet.pref_recently_used_apps_ignore_favorites &&
            AppFavorites.getAppFavorites().isFavorite(aAppID)) {
            return;
        }

        try {
            let t = new Date().getTime();
            let recApps = this.recentApps;
            let recAppUpdated = false;

            // Update recent app if it was previously launched.
            for (let i = recApps.length; i--;) {
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

            // Holy ·$%&/()!!! The only freaking way that I could find to remove duplicates!!!
            // Like always, Stack Overflow is a life saver.
            // http://stackoverflow.com/questions/31014324/remove-duplicated-object-in-array
            let temp = [];

            this.recentApps = recApps.filter((aVal) => {
                let appID = aVal.split(":")[0];
                return temp.indexOf(appID) === -1 ? temp.push(appID) : false;
            });
        } catch (aErr) {
            global.logError(aErr);
        }
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

function escapeHTML(aStr) {
    aStr = String(aStr)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    return aStr;
}

/* exported escapeHTML
 */
