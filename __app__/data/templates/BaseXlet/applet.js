const {
    gi: {
        St
    },
    ui: {
        applet: Applet,
        popupMenu: PopupMenu
    }
} = imports;

const {
    APPLET_PREFS
} = require("js_modules/constants.js");

const {
    _
} = require("js_modules/globalUtils.js");

const {
    Debugger
} = require("js_modules/utils.js");

const {
    getBaseAppletClass
} = require("js_modules/appletsUtils.js");

class MyApplet extends getBaseAppletClass(Applet.TextIconApplet) {
    constructor(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
        super({
            /********************************************
             * Properties set at applet initialization. *
             ********************************************/
            // The following 4 properties are the arguments passed by an applet's main() function.
            metadata: aMetadata,
            orientation: aOrientation,
            panel_height: aPanelHeight, // Keep an eye on this one. It will be removed in the future.
            instance_id: aInstanceID,
            // The list of all the applet's settings.
            pref_keys: APPLET_PREFS
        });

        this.__initializeApplet(() => {
            /* NOTE: Direct function calls.
             * These calls are performed AFTER the applet's settings are initialized.
             * These function calls can depend on settings (they were already initialized)
             * but should't depend on any other properties.
             */
            // Add new items to the applet context menu or override the default ones.
            this._expandAppletContextMenu();
            this.__setAppletIcon(this.$._.pref_name);
        }, () => {
            /* NOTE: Idle function calls.
             * All these function calls are performed inside a Mainloop.idle_add() call.
             */
        });
    }

    _expandAppletContextMenu() {
        const menuItem = new PopupMenu.PopupIconMenuItem(_("Help"),
            "dialog-information", St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => this.__openHelpPage());
        this._applet_context_menu.addMenuItem(menuItem);
    }

    on_applet_removed_from_panel() {
        super.on_applet_removed_from_panel();
    }

    __onSettingsChanged(aPrefOldValue, aPrefKey) {
        // WARNING: Do not bind settings whose values aren't primitives.
        // Bound non-primitive settings will always trigger a settings changed signal.
        // It will trigger a "changed::pref_name" signal and a "settings-changed" signal.
        switch (aPrefKey) {
            case "pref_name":
                // Function/s to call when the settings pref_name is changed.
                break;
        }
    }
}

function main() {
    Debugger.wrapObjectMethods({
        MyApplet: MyApplet
    });

    return new MyApplet(...arguments);
}
