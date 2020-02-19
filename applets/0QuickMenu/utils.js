//{{IMPORTER}}

const GlobalConstants = __import("globalConstants.js");
const DebugManager = __import("debugManager.js");

const {
    gi: {
        Clutter,
        Gio,
        Gtk,
        Pango,
        St
    },
    misc: {
        util: Util
    },
    ui: {
        popupMenu: PopupMenu
    }
} = imports;

var Debugger = new DebugManager.DebugManager();

const {
    UNICODE_SYMBOLS
} = GlobalConstants;

// Redefine a PopupSubMenuMenuItem to get a colored image to the left side
function CustomSubMenuMenuItem() {
    this._init.apply(this, arguments);
}

CustomSubMenuMenuItem.prototype = {
    __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,

    _init: function(appsMenuButton, aData) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this);

        this.appsMenuButton = appsMenuButton;
        this.actor.add_style_class_name("popup-submenu-menu-item");

        if (this.appsMenuButton.pref_show_submenu_icons) {
            this._icon = this._createIcon(aData.iconName);
            this.addActor(this._icon);
        }

        this.label = new St.Label({
            text: aData.folderName
        });

        if (this.appsMenuButton.pref_style_for_sub_menus !== "") {
            this.label.set_style(this.appsMenuButton.pref_style_for_sub_menus);
        }

        this.addActor(this.label);

        this._triangle = new St.Label({
            text: (this.actor.get_direction() === St.TextDirection.RTL ?
                UNICODE_SYMBOLS.black_left_pointing_small_triangle :
                UNICODE_SYMBOLS.black_right_pointing_small_triangle)
        });

        this.addActor(this._triangle, {
            align: St.Align.END
        });

        this.menu = new PopupMenu.PopupSubMenu(this.actor, this._triangle);
    },

    _createIcon: function(aIconName) {
        // if the aIconName is a path to an icon
        if (aIconName[0] === "/") {
            let file = Gio.file_new_for_path(aIconName);
            let iconFile = new Gio.FileIcon({
                file: file
            });

            return new St.Icon({
                gicon: iconFile,
                icon_size: this.appsMenuButton.pref_sub_menu_icon_size
            });
        } else { // use a themed icon
            return new St.Icon({
                icon_name: aIconName,
                icon_size: this.appsMenuButton.pref_sub_menu_icon_size,
                icon_type: St.IconType.FULLCOLOR
            });
        }
    }
};

function FileMenuItem() {
    this._init.apply(this, arguments);
}

FileMenuItem.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(appsMenuButton, aData) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this);

        try {
            this.mimeType = null;
            this.uri = null;
            this.app = aData.app;
            this.isDeskFile = this.app instanceof Gio.DesktopAppInfo;

            if (!this.isDeskFile) {
                this.mimeType = Gio.content_type_guess(this.app.get_path(), null)[0];
                this.uri = this.app.get_uri();
            }

            this.button_name = aData.name;
            this.appsMenuButton = appsMenuButton;
            this.label = new St.Label({
                text: this.button_name
            });
            this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;

            if (this.appsMenuButton.pref_style_for_menu_items !== "") {
                this.label.set_style(this.appsMenuButton.pref_style_for_menu_items);
            }

            if (this.appsMenuButton.pref_show_applications_icons) {
                this.icon = this._createIcon();
                this.addActor(this.icon);
            }

            this.addActor(this.label);

            this.menu = new PopupMenu.PopupSubMenu(this.actor);
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    _createIcon: function() {
        try {
            let iconName;
            let icon = this.isDeskFile ?
                this.app.get_icon() :
                Gio.content_type_get_icon(this.mimeType);

            if (icon) {
                if (icon instanceof(Gio.FileIcon)) {
                    iconName = icon.get_file().get_path();
                } else {
                    iconName = this._tryToGetValidIcon(icon.get_names());
                }

                if (!iconName) {
                    if (this.isDeskFile) {
                        iconName = icon.get_names()[0];
                    } else {
                        iconName = "application-octet-stream";
                    }
                }
            } else {
                iconName = "application-octet-stream";
            }

            // if the iconName is a path to an icon
            if (iconName[0] === "/") {
                let file = Gio.file_new_for_path(iconName);
                let iconFile = new Gio.FileIcon({
                    file: file
                });

                return new St.Icon({
                    gicon: iconFile,
                    icon_size: this.appsMenuButton.pref_menu_item_icon_size
                });
            } else { // Try to use a themed icon
                // This is a fallback for some .desktop files.
                // Gtk.IconTheme.get_default().has_icon() somtimes refuses to return a valid icon. ¬¬
                // So I let the create_icon_texture method from an app object to create the icon, which
                // it also works whenever the heck it wants, hence the try{}catch{} block!!!!
                if (this.isDeskFile) {
                    try {
                        return this.app.create_icon_texture(this.appsMenuButton.pref_menu_item_icon_size);
                    } catch (aErr) {}
                }

                return new St.Icon({
                    icon_name: iconName,
                    icon_size: this.appsMenuButton.pref_menu_item_icon_size,
                    icon_type: St.IconType.FULLCOLOR
                });
            }
        } catch (aErr) {
            global.logError(aErr);
        }

        return new St.Icon({
            icon_name: "application-octet-stream",
            icon_size: this.appsMenuButton.pref_menu_item_icon_size,
            icon_type: St.IconType.FULLCOLOR
        });
    },

    _tryToGetValidIcon: function(aArr) {
        let i = 0,
            iLen = aArr.length;
        for (; i < iLen; i++) {
            if (Gtk.IconTheme.get_default().has_icon(aArr[i])) {
                return aArr[i].toString();
            }
        }

        return false;
    },

    _onButtonReleaseEvent: function(actor, aE) {
        if (aE.get_button() === 1 || aE.get_button() === 2) {
            this.activate(aE);
        }

        return true;
    },

    activate: function(aE) {
        try {
            let ctrlKey = Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2];

            if (this.isDeskFile) {
                this.app.launch([], null);
            } else {
                try {
                    Gio.app_info_launch_default_for_uri(this.uri, global.create_app_launch_context());
                } catch (aErr) {
                    Util.spawnCommandLine('nemo-open-with "' + this.uri + '"');
                }
            }

            if (!(aE.get_button() === 2 || (aE.get_button() === 1 && ctrlKey))) {
                this.appsMenuButton.menu.close(true);
            }
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    closeMenu: function() {
        this.menu.close(true);
    }
};

DebugManager.wrapObjectMethods(Debugger, {
    CustomSubMenuMenuItem: CustomSubMenuMenuItem,
    FileMenuItem: FileMenuItem
});
