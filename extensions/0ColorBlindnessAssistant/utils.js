let XletMeta,
    constants;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    constants = require("./constants.js");
} else {
    constants = imports.ui.extensionSystem.extensions["{{UUID}}"].constants;
}

const {
    gi: {
        Cinnamon,
        Clutter,
        Gdk,
        Gio,
        GLib,
        St
    },
    mainloop: Mainloop,
    misc: {
        fileUtils: FileUtils,
        util: Util
    },
    signals: Signals,
    ui: {
        main: Main
    }
} = imports;

const {
    InfoBannerLabels,
    ELLIPSIS,
    NameThatColor
} = constants;

var {
    _,
    EffectTypeMap,
    ColorSpaceMap,
    EFFECT_DEFAULT_PARAMS
} = constants;

const DESKTOP_FILE_TEMPLATE = '[Desktop Entry]\n\
Encoding=UTF-8\n\
Name=%%NAME%%\n\
Comment=%%COMMENT%%\n\
Type=Application\n\
Exec=%%EXEC%%\n\
Icon=%%ICON%%\n\
Categories=Settings;\n\
Hidden=false\n\
NoDisplay=false\n\
';

/* NOTE: NameThatColor library initialization.
 * Initialized here and not where NameThatColor is declared just because I
 * already import and use Mainloop in this file.
 */
Mainloop.idle_add(() => {
    NameThatColor.init();
});

// <3 https://stackoverflow.com/a/19765382
function rgb2hex(red, green, blue) {
    var rgb = blue | (green << 8) | (red << 16);
    return "#" + (0x1000000 + rgb).toString(16).slice(1);
}

function ColorInspector() {
    this._init.apply(this, arguments);
}

ColorInspector.prototype = {
    _init: function(aParams) {
        this.params = aParams;
        this.passThroughEvents = false;
        this._infoBanner = null;
        this._colorInfoForClipboard = [];
        this._modal = false;
        this._capturedEventId = 0;
        this._updateId = 0;
        this._xMouse = 0;
        this._yMouse = 0;
    },

    inspect: function() {
        if (this._colorPicking) {
            this.resetColorInspector();
            return;
        }

        this._modal = true;
        this._colorPicking = true;

        this.container = new Cinnamon.GenericContainer({
            reactive: true,
            can_focus: true,
            track_hover: true
        });
        this.container.connect("allocate",
            (aActor, aBox, aFlags) => this._allocate(aActor, aBox, aFlags));
        this.container.set_position(0, 0);
        this.container.set_size(global.screen_width, global.screen_height);

        Main.uiGroup.add_actor(this.container);

        this._infoBanner = new St.BoxLayout({
            name: "ColorInspectorBanner",
            style_class: "modal-dialog",
            vertical: true,
            reactive: true
        });

        let infoGrid = new Clutter.GridLayout({
            orientation: Clutter.Orientation.VERTICAL
        });

        let infoBox = new St.Bin({
            style_class: "cba-info-box",
            y_align: St.Align.START,
            y_fill: true,
            x_align: St.Align.START,
            x_fill: true,
        });

        infoBox.set_child(new St.Widget({
            layout_manager: infoGrid
        }));

        this.container.add_actor(this._infoBanner);

        this._colorNameLabel = new St.Label({
            text: _("No matches"),
            style_class: "cba-header"
        });
        this._passThroughText = new St.Label({
            text: ELLIPSIS,
            style_class: "cba-footer"
        });

        this._additionalInfoText = new St.Label({
            text: _("Press Escape or click to exit"),
            style_class: "cba-footer"
        });

        this._inputFeedback = new St.Button({
            style_class: "cba-info-feedback"
        });
        this._codeFeedback = new St.Button({
            style_class: "cba-info-feedback"
        });
        this._hueFeedback = new St.Button({
            style_class: "cba-info-feedback"
        });

        let labelObj = {
            text: ELLIPSIS,
            style_class: "cba-info-value",
        };

        // Color info.
        let index = 1;
        for (let id in InfoBannerLabels) {
            let vProp = "_" + id + "Value";

            let title = new St.Label({
                text: InfoBannerLabels[id] + ":",
                style_class: "cba-info-title",
            });

            this[vProp] = new St.Label(labelObj);

            infoGrid.attach(title, 0, index, 1, 1);
            infoGrid.attach(this["_" + id + "Feedback"], 1, index, 1, 1);
            infoGrid.attach(this[vProp], 2, index, 1, 1);

            index++;
        }

        this._infoBanner.add(this._colorNameLabel);
        this._infoBanner.add(infoBox);
        this._infoBanner.add(this._passThroughText);
        this._infoBanner.add(this._additionalInfoText);

        if (!Main.pushModal(this.container)) {
            return;
        }

        global.set_cursor(Cinnamon.Cursor.CROSSHAIR);

        this._capturedEventId = global.stage.connect("captured-event",
            (aActor, aEvent) => this._onCapturedEvent(aActor, aEvent));

        this._update();
        this._updatePassthroughText();
    },

    _updateModal: function() {
        /* NOTE: passThroughEvents allows to interact with Cinnamon's UI but not
         * with other applications UI. I don't think that it is possible to fix this.
         * - lower_bottom/raise_top(): This is needed when the banner follows the
         * cursor. Otherwise, the banner will be placed behind an opened Cinnamon
         * menu.
         */
        if (this.passThroughEvents) {
            this.container.lower_bottom();

            /* NOTE: I tried the following code to attempt to fix the previously
             * mentioned note. It "half works". When this.container is raised back
             * after the time out, it doesn't grab the needed focus for it to work.
             * And if it would, an application menu would be auto-closed.
             * So, I don't think that what I'm trying to achieve is possible at all (?).
             */
            // Main.popModal(this.container);

            // if (this._modalId > 0) {
            //     Mainloop.source_remove(this._modalId);
            //     this._modalId = 0;
            // }

            // this._modalId = Mainloop.timeout_add(3000, () => {
            //     this.passThroughEvents = !this.passThroughEvents;
            //     Main.pushModal(this.container);
            //     this.container.raise_top();
            //     this._updatePassthroughText();
            // });
        } else {
            this.container.raise_top();
        }
    },

    _updatePassthroughText: function() {
        if (this.passThroughEvents) {
            this._passThroughText.text = _("Press Pause or Control to disable event pass through");
        } else {
            this._passThroughText.text = _("Press Pause or Control to enable event pass through");
        }
    },

    _onCapturedEvent: function(aActor, aEvent) {
        if (aEvent.type() === Clutter.EventType.KEY_PRESS &&
            (aEvent.get_key_symbol() === Clutter.Control_L ||
                aEvent.get_key_symbol() === Clutter.Control_R ||
                aEvent.get_key_symbol() === Clutter.Pause)) {
            this.passThroughEvents = !this.passThroughEvents;
            this._updateModal();
            this._updatePassthroughText();
            /* NOTE: Trigger update so the banner is repositioned near the cursor
             * and at the same time is filled with the current pixel color.
             */
            this._update();
            return true;
        }

        if (this.passThroughEvents) {
            return false;
        }

        switch (aEvent.type()) {
            case Clutter.EventType.KEY_PRESS:
                return this._onKeyPressEvent(aActor, aEvent);
            case Clutter.EventType.BUTTON_PRESS:
                return this._onButtonPressEvent(aActor, aEvent);
            case Clutter.EventType.MOTION:
                return this._onMotionEvent(aActor, aEvent);
            default:
                return true;
        }
    },

    _onKeyPressEvent: function(aActor, aEvent) {
        if (aEvent.get_key_symbol() === Clutter.Escape) {
            this.abort();
        }

        return true;
    },

    _onButtonPressEvent: function(aActor, aEvent) {
        if (aEvent.get_source() === this.container) {
            this.params.copyInfoToClipboard && this._copyColorInfoToClipboard();
            this.abort();
        }

        return true;
    },

    _onMotionEvent: function(aActor, aEvent) { // jshint ignore:line
        if (this._updateId > 0) {
            Mainloop.source_remove(this._updateId);
            this._updateId = 0;
        }

        this._updateId = Mainloop.timeout_add(50, () => {
            this._update();
        });

        return true;
    },

    _update: function() {
        let [xMouse, yMouse, mask] = global.get_pointer(); // jshint ignore:line
        this._xMouse = xMouse;
        this._yMouse = yMouse;
        let pixel = this.getPixelAt(xMouse, yMouse);
        let inputRGB = "rgb(%s, %s, %s)".format(pixel[0], pixel[1], pixel[2]);
        let colorInfo = NameThatColor.name(rgb2hex(
            pixel[0],
            pixel[1],
            pixel[2]
        ));
        this._colorInfoForClipboard = [];

        this._inputFeedback.set_style("background-color: %s;".format(inputRGB));
        this._codeFeedback.set_style("background-color: %s;".format(colorInfo.hex));
        this._hueFeedback.set_style("background-color: %s;".format(colorInfo.hueHex));

        let colorNameText = "%s: %s".format((colorInfo.exact_match ?
            _("Exact Match") :
            _("Approximation")), colorInfo.name);

        this._colorNameLabel.text = colorNameText;
        this._colorInfoForClipboard.push(colorNameText);

        for (let id in InfoBannerLabels) {
            let vProp = "_" + id + "Value";
            let text;

            switch (id) {
                case "input":
                    text = "%s - %s".format(
                        colorInfo.input,
                        inputRGB
                    );
                    break;
                case "code":
                    text = "%s - %s".format(
                        colorInfo.hex,
                        colorInfo.rgb
                    );
                    break;
                case "hue":
                    text = "%s - %s".format(
                        colorInfo.hueName,
                        colorInfo.hueHex
                    );
                    break;
            }

            this[vProp].text = text;
            this._colorInfoForClipboard.push(InfoBannerLabels[id] + ": " + text);
        }
    },

    getPixelAt: function(x, y) {
        let window = Gdk.get_default_root_window();
        let pixbuf = Gdk.pixbuf_get_from_window(window, x, y, 1, 1);
        return pixbuf.get_pixels();
    },

    _allocate: function(aActor, aBox, aFlags) {
        if (!this._infoBanner) {
            return;
        }

        let [minWidth, minHeight, bannerNatW, bannerNatH] = this._infoBanner.get_preferred_size(); // jshint ignore:line
        let primary = Main.layoutManager.primaryMonitor;
        /* NOTE: When the magnifier is inactive, keep the banner near the mouse cursor.
         * When the magnifier is active, just snap the banner to the opposite
         * monitor quadrant. It is just too annoying to calculate the size of the
         * magnifier actor to keep the banner close to it but outside its magnifying effect.
         * FIXME: The magnifier presents another problem that I wasn't able to fix yet.
         * When magnifying, the mouse coordinates returned by the call to global.get_pointer()
         * aren't the coordinates of the pixel from which I want to extract the color.
         */
        let magIsActive = Main.magnifier.isActive();
        let xHalf = primary.width / 2;
        let yHalf = primary.height / 2;
        let extraDistance = 32 * global.ui_scale;
        let childBox = new Clutter.ActorBox();

        if (magIsActive) {
            childBox.x1 = this._xMouse >= xHalf ?
                primary.x :
                Math.floor(primary.width - bannerNatW);
        } else {
            childBox.x1 = this._xMouse >= xHalf ?
                Math.floor(this._xMouse - bannerNatW) - extraDistance :
                this._xMouse + extraDistance;
        }

        childBox.x2 = childBox.x1 + bannerNatW;

        if (magIsActive) {
            childBox.y1 = this._yMouse >= yHalf ?
                primary.y :
                Math.floor(primary.height - bannerNatH);
        } else {
            childBox.y1 = this._yMouse >= yHalf ?
                Math.floor(this._yMouse - bannerNatH) - extraDistance :
                this._yMouse + extraDistance;
        }

        childBox.y2 = childBox.y1 + bannerNatH;

        this._infoBanner.allocate(childBox, aFlags);
    },

    _copyColorInfoToClipboard: function() {
        let clipboard = St.Clipboard.get_default();
        let colorInfo = this._colorInfoForClipboard.join("\n");

        if (St.ClipboardType) {
            clipboard.set_text(St.ClipboardType.CLIPBOARD, colorInfo);
        } else {
            clipboard.set_text(colorInfo);
        }
    },

    abort: function() {
        this.resetColorInspector();
        return true;
    },

    resetColorInspector: function() {
        if (this._modal) {
            Main.popModal(this.container);
        }

        this._modal = false;

        global.unset_cursor();

        if (this._capturedEventId > 0) {
            global.stage.disconnect(this._capturedEventId);
            this._capturedEventId = 0;
        }

        if (this.container) {
            Main.uiGroup.remove_actor(this.container);
            this.container.destroy();
        }

        if (this._infoBanner) {
            this._infoBanner.destroy();
            this._infoBanner = null;
        }

        this._colorPicking = false;
    }

};
Signals.addSignalMethods(ColorInspector.prototype);

/**
 * Save data to a file asynchronously whether the file exists or not.
 *
 * @param {String}   aData     - The data to save to the file.
 * @param {Gio.File} aFile     - The Gio.File object of the file to save to.
 * @param {Function} aCallback - The function to call after the save operation finishes.
 */
function saveToFileAsync(aData, aFile, aCallback) {
    let data = new GLib.Bytes(aData);

    aFile.replace_async(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION,
        GLib.PRIORITY_DEFAULT, null,
        function(aObj, aResponse) {
            let stream = aObj.replace_finish(aResponse);

            stream.write_bytes_async(data, GLib.PRIORITY_DEFAULT,
                null,
                function(aW_obj, aW_res) {
                    aW_obj.write_bytes_finish(aW_res);
                    stream.close(null);

                    if (aCallback && typeof aCallback === "function") {
                        aCallback();
                    }
                });
        });
}

function generateSettingsDesktopFile(aWhere) {
    let desktopFilePath = "%s/org.Cinnamon.Extensions.ColorBlindnessAssistant.Settings.desktop";

    switch (aWhere) {
        case "desktop":
            desktopFilePath = desktopFilePath.format(
                GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP));
            break;
        case "xdg":
            desktopFilePath = desktopFilePath.format(
                GLib.get_home_dir() + "/.local/share/applications");
            break;
    }

    let desktopFile = Gio.file_new_for_path(desktopFilePath);
    let data = DESKTOP_FILE_TEMPLATE
        .replace("%%NAME%%", _(XletMeta.name))
        .replace("%%COMMENT%%", _("Settings for %s").format(_(XletMeta.name)))
        .replace("%%EXEC%%", XletMeta.path + "/settings.py")
        .replace("%%ICON%%", XletMeta.path + "/icon.svg");

    saveToFileAsync(data, desktopFile, () => {
        if (FileUtils.hasOwnProperty("changeModeGFile")) {
            FileUtils.changeModeGFile(desktopFile.get_path(), 755);
        } else {
            Util.spawnCommandLine('chmod +x "' + desktopFile.get_path() + '"');
        }
    });
}

/* exported _,
            getEffect,
            rgbToHex,
            EffectTypeMap,
            ColorSpaceMap,
            generateSettingsDesktopFile,
            EFFECT_DEFAULT_PARAMS,
            EFFECT_PROP_NAME,
 */
