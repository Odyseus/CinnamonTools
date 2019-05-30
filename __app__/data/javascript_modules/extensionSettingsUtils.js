/* NOTE: Future me, ULTRA-VERY-IMPORTANT!!!
 * TL;DR;: Keep using Cinnamon's native settings system initialized inside an
 * applet/desklet class/prototype, not globally declared and initialized in its
 * own class/prototype.
 * Do NOT bother using Cinnamon's native settings system initialized with its own
 * class/prototype on any type of xlet other than extensions.
 * The settings system for applets/desklets requires an xlet instance ID to be
 * passed for the settings to be initialized. This will force me to initialize the
 * settings class/prototype inside main(). That would defeat the purpose of having
 * a class initialized in a module to be able to use it by any other module.
 * It is worth mentioning that, if an xlet is NOT multi-instance (like extension are),
 * its instance ID is also its UUID; which is available globally.
 */
let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

const {
    ui: {
        settings: {
            ExtensionSettings
        }
    },
    misc: {
        signalManager: SignalManager
    }
} = imports;

function CustomExtensionSettings() {
    this._init.apply(this, arguments);
}

CustomExtensionSettings.prototype = {
    _init: function(aBoundSettingsArray) {
        this._boundSettingsArray = aBoundSettingsArray;
        this._sigMan = new SignalManager.SignalManager(null);
        this.settings = new ExtensionSettings(
            this,
            XletMeta.uuid
        );

        this._bindSettings();
    },

    _bindSettings: function() {
        let i = this._boundSettingsArray.length;
        while (i--) {
            Object.defineProperty(
                this,
                this._boundSettingsArray[i],
                this._getDescriptor(this._boundSettingsArray[i])
            );
        }
    },

    _getDescriptor: function(aKey) {
        return Object.create({
            get: () => {
                return this.settings.getValue(aKey);
            },
            set: (aVal) => {
                this.settings.setValue(aKey, aVal);
            },
            enumerable: true,
            configurable: true
        });
    },

    connect: function(aSignalId, aCallback) {
        return this._sigMan.connect(this.settings, aSignalId, aCallback);
    },

    destroy: function() {
        this._sigMan.disconnectAllSignals();
    },

    disconnect: function(aSignalId, aCallback = null) {
        this._sigMan.disconnect(aSignalId, this.settings, aCallback);
    }
};
