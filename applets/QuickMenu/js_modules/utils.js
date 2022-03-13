const {
    gi: {
        Clutter,
        Gio,
        Gtk,
        Pango,
        St
    },
    misc: {
        params: Params,
        util: Util
    },
    ui: {
        popupMenu: PopupMenu
    }
} = imports;

const {
    DebugManager
} = require("js_modules/debugManager.js");

const {
    _,
    escapeHTML,
    launchUri,
    tryFn
} = require("js_modules/globalUtils.js");

const {
    CustomNotification
} = require("js_modules/notificationsUtils.js");

var Debugger = new DebugManager(`org.cinnamon.applets.${__meta.uuid}`);

Debugger.wrapObjectMethods({
    CustomNotification: CustomNotification
});

var Notification = new CustomNotification({
    title: escapeHTML(_(__meta.name)),
    default_buttons: [{
        action: "dialog-information",
        label: escapeHTML(_("Help"))
    }],
    action_invoked_callback: (aSource, aAction) => {
        switch (aAction) {
            case "dialog-information":
                launchUri(`${__meta.path}/HELP.html`);
                break;
        }
    }
});

/**
 * Custom sub-menu item that displays an image to the left side.
 *
 * @type {Class}
 */
var CustomSubMenuMenuItem = class CustomSubMenuMenuItem extends PopupMenu.PopupSubMenuMenuItem {
    constructor(aApplet, aParams = {}) {
        super(null);

        this.params = Params.parse(aParams, {
            folderName: "",
            folderPath: "",
            iconName: ""
        }, true);

        this._applet = aApplet;
        this._icon = null;
        this.actor.add_style_class_name("popup-submenu-menu-item");

        if (this._applet.$._.show_submenu_icons) {
            this._icon = this._createIcon(this.params.iconName);
            this._icon && this.addActor(this._icon, {
                span: 0
            });
        }

        this.label = new St.Label({
            text: this.params.folderName,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });
        this.addActor(this.label, {
            expand: true
        });
        this.actor.label_actor = this.label;

        const style_for_sub_menus = this._applet.$._.style_for_sub_menus.replace(/\s/g, "");
        style_for_sub_menus && this.label.set_style(style_for_sub_menus);

        this._triangleBin = new St.Bin({
            x_align: St.Align.END
        });
        this.addActor(this._triangleBin, {
            expand: true,
            span: -1,
            align: St.Align.END
        });

        this._triangle = PopupMenu.arrowIcon(St.Side.RIGHT);
        this._triangle.pivot_point = new Clutter.Point({
            x: 0.5,
            y: 0.5
        });
        this._triangleBin.child = this._triangle;
    }

    setIconFromDirectoryFile() {
        this._applet.$.schedule_manager.idleCall(this.params.folderPath, function() {
            tryFn(() => {
                const dirFile = Gio.DesktopAppInfo.new_from_filename(`${this.params.folderPath}/.directory`);
                const dirIcon = dirFile ? dirFile.get_icon() : null;
                dirIcon && this._icon && this._icon.set_gicon(dirIcon);
            }, (aErr) => global.logError(aErr));
        }.bind(this));
    }

    _subMenuOpenStateChanged(aMenu, aOpen) {
        super._subMenuOpenStateChanged(aMenu, aOpen);

        this._applet.closeContextMenu.call(this._applet, false);
    }

    _createIcon(aIconName) {
        // if the aIconName is a path to an icon
        if (aIconName.includes("/")) {
            const file = Gio.file_new_for_path(aIconName);
            const iconFile = new Gio.FileIcon({
                file: file
            });

            return new St.Icon({
                gicon: iconFile,
                icon_size: this._applet.$._.sub_menu_icon_size
            });
        }

        return new St.Icon({
            icon_name: aIconName,
            icon_size: this._applet.$._.sub_menu_icon_size,
            icon_type: St.IconType.FULLCOLOR
        });
    }
};

var FileContextMenuItem = class FileContextMenuItem extends PopupMenu.PopupMenuItem {
    constructor(aMenuItem, aLabel, aAction) {
        super(aLabel);

        this._signals.connect(this, "activate", function() {
            this._launchAction(aAction);
        }.bind(aMenuItem));
    }
};

var FileMenuItem = class FileMenuItem extends PopupMenu.PopupBaseMenuItem {
    constructor(aApplet, aParams = {}) {
        super();

        this.params = Params.parse(aParams, {
            app: null,
            name: ""
        }, true);

        this.mimeType = null;
        this.uri = null;
        this.app = this.params.app;
        this.isDeskFile = this.app instanceof Gio.DesktopAppInfo;
        this.deskActions = this.isDeskFile ? this.app.list_actions() : null;
        this.hasDeskActions = !!(this.deskActions && this.deskActions.length);

        if (!this.isDeskFile) {
            this.mimeType = Gio.content_type_guess(this.app.get_path(), null)[0];
            this.uri = this.app.get_uri();
        }

        this.button_name = this.params.name;
        this._applet = aApplet;
        this.label = new St.Label({
            text: this.button_name
        });
        this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;
        const style_for_menu_items = this._applet.$._.style_for_menu_items.replace(/\s/g, "");
        style_for_menu_items && this.label.set_style(style_for_menu_items);

        if (this._applet.$._.show_menuitem_icons) {
            this.icon = this._createIcon();
            this.icon && this.addActor(this.icon, {
                span: 0
            });
        }

        this.addActor(this.label, {
            expand: true,
            span: -1
        });
    }

    _editDesktopFile() {
        this._applet.menu.close(false);
        launchUri(this.app.get_filename());
    }

    _launchAction(aAction) {
        this._applet.menu.close(false);

        if (this.isDeskFile) {
            tryFn(() => {
                this.app.launch_action(aAction, global.create_app_launch_context());
            }, (aErr) => global.logError(aErr));
        }
    }

    populateMenu(aMenu) {
        let menuitem = new PopupMenu.PopupIconMenuItem(_("Edit .desktop file"),
            "document-edit",
            St.IconType.SYMBOLIC
        );
        menuitem.connect("activate", () => this._editDesktopFile());
        aMenu.box.add_actor(menuitem.actor);

        // NOTE: Not worth adding more context menu items like the Cinnamon applications menu has;
        // whether the ones from my own fork or just the ones from the default menu.
        // The .desktop files used by this applet are in their own folders and outside PATH,
        // so editing them however one likes will not affect anything on the system.
        if (this.deskActions.length) {
            const applicationActions = this.deskActions.map((aActionName) => {
                return {
                    localized_name: this.app.get_action_name(aActionName),
                    name: aActionName
                };
            }).sort((a, b) => {
                a = Util.latinise(a.localized_name.toLowerCase());
                b = Util.latinise(b.localized_name.toLowerCase());
                return a > b;
            });

            for (const app of applicationActions) {
                // NOTE: If I use aMenu.addMenuItem() or if I create the menu item here inside the
                // loop Cinnamon crashes when activating the menu item.
                // I don't know WTF is going on!!! I remember experiencing something similar in
                // the Simple ToDO List applet, but I don't remember what was the cause or how I fixed it.
                aMenu.box.add_actor(new FileContextMenuItem(this,
                    _(app.localized_name),
                    app.name
                ).actor);
            }
        }
    }

    _onKeyPressEvent(aActor, aEvent) {
        const symbol = aEvent.get_key_symbol();

        if (symbol === Clutter.KEY_Menu) {
            this._applet.toggleContextMenu(this);

            return Clutter.EVENT_STOP;
        }

        return super._onKeyPressEvent(aActor, aEvent);
    }

    _onButtonReleaseEvent(aActor, aEvent) {
        switch (aEvent.get_button()) {
            case Clutter.BUTTON_PRIMARY:
            case Clutter.BUTTON_MIDDLE:
                this.activate(aEvent);
                return Clutter.EVENT_STOP;
            case Clutter.BUTTON_SECONDARY:
                this._applet.toggleContextMenu(this);
                return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    activate(aEvent) {
        const ctrlKey = Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2];
        const button = aEvent.get_button();

        // LOGIC: If middle click or left click while pressing Control, keep the menu open.
        if (!(button === Clutter.BUTTON_MIDDLE || (button === Clutter.BUTTON_PRIMARY && ctrlKey))) {
            this._applet.menu.close(false);
        }

        tryFn(() => {
            if (this.isDeskFile) {
                this.app.launch([], null);
            } else {
                launchUri(this.uri);
            }
        }, (aErr) => global.logError(aErr));
    }

    _createIcon() {
        let iconName;

        const icon = this.isDeskFile ?
            this.app.get_icon() :
            Gio.content_type_get_icon(this.mimeType);

        if (icon) {
            if (icon instanceof Gio.Icon || icon instanceof Gio.FileIcon) {
                return new St.Icon({
                    gicon: icon,
                    icon_size: this._applet.$._.menuitem_icon_size
                });
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

        // If the iconName is a path to an icon
        if (iconName && iconName[0] === "/") {
            const file = Gio.file_new_for_path(iconName);
            const iconFile = new Gio.FileIcon({
                file: file
            });

            return new St.Icon({
                gicon: iconFile,
                icon_size: this._applet.$._.menuitem_icon_size
            });
        } else { // Try to use a themed icon
            // This is a fallback for some .desktop files.
            // Gtk.IconTheme.get_default().has_icon() somtimes refuses to return a valid icon. ¬¬
            // So I let the create_icon_texture method from an app object to create the icon, which
            // it also works whenever the heck it wants, hence the try{}catch{} block!!!!
            if (this.isDeskFile) {
                try {
                    return this.app.create_icon_texture(this._applet.$._.menuitem_icon_size);
                } catch (aErr) {
                    return new St.Icon({
                        icon_name: iconName,
                        icon_size: this._applet.$._.menuitem_icon_size,
                        icon_type: St.IconType.FULLCOLOR
                    });
                }
            }
        }

        return null;
    }

    _tryToGetValidIcon(aArr) {
        let i = 0,
            iLen = aArr.length;
        for (; i < iLen; i++) {
            if (Gtk.IconTheme.get_default().has_icon(aArr[i])) {
                return aArr[i].toString();
            }
        }

        return false;
    }
};

Debugger.wrapObjectMethods({
    CustomSubMenuMenuItem: CustomSubMenuMenuItem,
    FileContextMenuItem: FileContextMenuItem,
    FileMenuItem: FileMenuItem
});

/* exported Notification
 */
