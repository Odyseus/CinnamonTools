let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui["{{XLET_SYSTEM}}"]["{{XLET_META}}"]["{{UUID}}"];
}

const {
    ui: {
        settings: {
            AppletSettings,
            ExtensionSettings
        }
    },
    misc: {
        signalManager: SignalManager
    }
} = imports;

function BaseXletSettings() {
    this._init.apply(this, arguments);
}

BaseXletSettings.prototype = {
    _init: function(aBoundSettingsArray) {
        this._boundSettingsArray = aBoundSettingsArray;
        this._sigMan = new SignalManager.SignalManager(null);
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

    _wrapCallback: function(aCallback, aPrefKey) {
        return () => {
            aCallback(aPrefKey);
        };
    },

    connect: function(aPrefKey, aCallback) {
        if (typeof aPrefKey === "object" && Array.isArray(aPrefKey)) {
            let i = aPrefKey.length;
            while (i--) {
                this._sigMan.connect(
                    this.settings,
                    "changed::" + aPrefKey[i],
                    this._wrapCallback(aCallback, aPrefKey[i])
                );
            }

            return true;
        }

        return this._sigMan.connect(
            this.settings,
            "changed::" + aPrefKey,
            this._wrapCallback(aCallback, aPrefKey)
        );
    },

    destroy: function(aFinalize = false) {
        this._sigMan.disconnectAllSignals();

        aFinalize && this.settings.finalize();
    },

    disconnect: function(aPrefKey, aCallback = null) {
        this._sigMan.disconnect(
            "changed::" + aPrefKey,
            this.settings,
            aCallback
        );
    }
};

function CustomExtensionSettings() {
    this._init.apply(this, arguments);
}

CustomExtensionSettings.prototype = {
    __proto__: BaseXletSettings.prototype,

    _init: function(aBoundSettingsArray) {
        BaseXletSettings.prototype._init.call(this, aBoundSettingsArray);
        this.settings = new ExtensionSettings(
            this,
            XletMeta.uuid
        );

        this._bindSettings();
    }
};

function CustomAppletSettings() {
    this._init.apply(this, arguments);
}

CustomAppletSettings.prototype = {
    __proto__: BaseXletSettings.prototype,

    _init: function(aBoundSettingsArray, aInstanceID, aAsync = true) {
        BaseXletSettings.prototype._init.call(this, aBoundSettingsArray);
        this.settings = new AppletSettings(
            this,
            XletMeta.uuid,
            aInstanceID,
            aAsync
        );

        this._bindSettings();
    }
};
