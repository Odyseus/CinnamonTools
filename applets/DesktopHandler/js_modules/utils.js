const {
    gi: {
        Clutter,
        Pango,
        St
    },
    mainloop: Mainloop,
    misc: {
        params: Params
    },
    ui: {
        appSwitcher: {
            classicSwitcher: ClassicSwitcher,
            coverflowSwitcher: CoverflowSwitcher,
            timelineSwitcher: TimelineSwitcher
        },
        main: Main,
        popupMenu: PopupMenu,
        tooltips: Tooltips
    }
} = imports;

const {
    WindowMenuItemParams
} = require("js_modules/constants.js");

const {
    _
} = require("js_modules/globalUtils.js");

const {
    DebugManager
} = require("js_modules/debugManager.js");

var Debugger = new DebugManager(`org.cinnamon.applets.${__meta.uuid}`);

var WindowMenuItem = class MenuItem extends PopupMenu.PopupBaseMenuItem {
    constructor(aApplet, aParams) {
        super();

        this._applet = aApplet;
        this.params = Params.parse(aParams, WindowMenuItemParams);

        const winTitle = this.params.meta_window.get_title();
        const ellipsis = winTitle.length < 69 ? "" : "...";

        this.button_name = winTitle.substring(0, 68) + ellipsis;
        this.label = new St.Label({
            text: this.button_name
        });
        this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;

        this.icon = this._applet.windowTracker.get_window_app(this.params.meta_window)
            .create_icon_texture(this._applet.$._.icon_applications_size);
        this.addActor(this.icon, {
            span: 0
        });

        this.addActor(this.label, {
            expand: true
        });

        if (this._applet.$._.show_close_buttons) {
            this._addCloseButton();
        }
    }

    _addCloseButton() {
        const close_button = new St.Button({
            child: new St.Icon({
                icon_name: this._applet.$._.icon_close_window,
                icon_type: St.IconType.SYMBOLIC,
                icon_size: this._applet.$._.icon_close_window_size,
                style_class: "popup-menu-icon"
            })
        });

        close_button.tooltip = new Tooltips.Tooltip(close_button,
            _("Close window"));
        close_button.connect("clicked",
            this._onCloseWindowButton.bind(this)
        );
        this.addActor(close_button, {
            span: -1,
            align: St.Align.END
        });
    }

    _onCloseWindowButton() {
        const items = this.params.menusection._getMenuItems();

        // NOTE: Grab key focus on the menu itself to avoid auto cloing of the menu.
        this._applet._winMenu.actor.grab_key_focus();

        if (items.length === 2) {
            this.params.menusection.destroy();
        }

        this.destroy();
        this._applet.allWindows.delete(this.params.meta_window);
        this.params.sticky || this.params.windows.delete(this.params.meta_window);
        this.params.meta_window.delete(global.get_current_time());

        this._applet.closeWindowsMenu("keep_menu_open_when_closing");
    }

    _setDotForActiveWorkspace() {
        for (let [idx, item] of this._applet.workspaceSubtitles) {
            item.setShowDot(this.params.workspace.index() === idx);
        }
    }

    activate(aEvent, aKeepMenu) {
        this._applet.closeWindowsMenu("keep_menu_open_when_activating");

        this._setDotForActiveWorkspace();

        if (!this.params.meta_window.is_on_all_workspaces()) {
            this.params.workspace.activate(global.get_current_time());
        }

        this.params.meta_window.unminimize(global.get_current_time());
        this.params.meta_window.activate(global.get_current_time());

        return super.activate(aEvent, aKeepMenu);
    }
};

var MyClassicSwitcher = class MyClassicSwitcher extends ClassicSwitcher.ClassicSwitcher {
    constructor() {
        super(...arguments);
    }

    _setupModal() {
        this._haveModal = Main.pushModal(this.actor);
        if (!this._haveModal) {
            this._activateSelected();
        } else {
            this._disableHover();
            this.actor.connect("key-press-event",
                (aActor, aEvent) => this._keyPressEvent(aActor, aEvent));
            this.actor.connect("key-release-event",
                (aActor, aEvent) => this._keyReleaseEvent(aActor, aEvent));
            this.actor.connect("scroll-event",
                (aActor, aEvent) => this._scrollEvent(aActor, aEvent));
            this.actor.connect("button-press-event",
                () => this.owndestroy());
            const delay = global.settings.get_int("alttab-switcher-delay");
            this._initialDelayTimeoutId = Mainloop.timeout_add(delay,
                () => this._show());
            this._currentIndex--;
        }
        return this._haveModal;
    }

    _keyReleaseEvent(actor, event) {
        const key = event.get_key_symbol();
        if (key === Clutter.KEY_Right || key === Clutter.KEY_Left) {
            return true;
        }
        if (this._initialDelayTimeoutId !== 0) {
            this._currentIndex = (this._currentIndex + 1) % this._windows.length;
        }
        this._activateSelected();
        return true;
    }

    owndestroy() {
        this._activateSelected();
    }
};

var MyTimelineSwitcher = class MyTimelineSwitcher extends TimelineSwitcher.TimelineSwitcher {
    constructor() {
        super(...arguments);
    }

    _setupModal() {
        this._haveModal = Main.pushModal(this.actor);
        if (!this._haveModal) {
            this._activateSelected();
        } else {
            this._disableHover();

            this.actor.connect("key-press-event",
                (aActor, aEvent) => this._keyPressEvent(aActor, aEvent));
            this.actor.connect("key-release-event",
                (aActor, aEvent) => this._keyReleaseEvent(aActor, aEvent));
            this.actor.connect("scroll-event",
                (aActor, aEvent) => this._scrollEvent(aActor, aEvent));
            this.actor.connect("button-press-event",
                () => this.owndestroy());
            const delay = global.settings.get_int("alttab-switcher-delay");
            this._initialDelayTimeoutId = Mainloop.timeout_add(delay,
                () => this._show());
            this._currentIndex--;
        }
        return this._haveModal;
    }

    _keyReleaseEvent(actor, event) {
        const key = event.get_key_symbol();
        if (key === Clutter.KEY_Right || key === Clutter.KEY_Left) {
            return true;
        }
        if (this._initialDelayTimeoutId !== 0) {
            this._currentIndex = (this._currentIndex + 1) % this._windows.length;
        }
        this._activateSelected();
        return true;
    }

    owndestroy() {
        this._activateSelected();
    }
};

var MyCoverflowSwitcher = class MyCoverflowSwitcher extends CoverflowSwitcher.CoverflowSwitcher {
    constructor() {
        super(...arguments);
    }

    _setupModal() {
        this._haveModal = Main.pushModal(this.actor);
        if (!this._haveModal) {
            this._activateSelected();
        } else {
            this._disableHover();

            this.actor.connect("key-press-event",
                (aActor, aEvent) => this._keyPressEvent(aActor, aEvent));
            this.actor.connect("key-release-event",
                (aActor, aEvent) => this._keyReleaseEvent(aActor, aEvent));
            this.actor.connect("scroll-event",
                (aActor, aEvent) => this._scrollEvent(aActor, aEvent));
            this.actor.connect("button-press-event",
                () => this.owndestroy());
            const delay = global.settings.get_int("alttab-switcher-delay");
            this._initialDelayTimeoutId = Mainloop.timeout_add(delay,
                () => this._show());
            this._currentIndex--;
        }
        return this._haveModal;
    }

    _keyReleaseEvent(actor, event) {
        const key = event.get_key_symbol();
        if (key === Clutter.KEY_Right || key === Clutter.KEY_Left) {
            return true;
        }
        if (this._initialDelayTimeoutId !== 0) {
            this._currentIndex = (this._currentIndex + 1) % this._windows.length;
        }
        this._activateSelected();
        return true;
    }

    owndestroy() {
        this._activateSelected();
    }

};

Debugger.wrapObjectMethods({
    WindowMenuItem: WindowMenuItem,
    MyClassicSwitcher: MyClassicSwitcher,
    MyCoverflowSwitcher: MyCoverflowSwitcher,
    MyTimelineSwitcher: MyTimelineSwitcher
});
