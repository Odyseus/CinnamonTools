let $,
    GlobalUtils,
    Constants,
    DebugManager,
    NameThatColor;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
    GlobalUtils = require("./globalUtils.js");
    Constants = require("./constants.js");
    DebugManager = require("./debugManager.js");
    NameThatColor = require("./nameThatColor.js");
} else {
    $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
    GlobalUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].globalUtils;
    Constants = imports.ui.extensionSystem.extensions["{{UUID}}"].constants;
    DebugManager = imports.ui.extensionSystem.extensions["{{UUID}}"].debugManager;
    NameThatColor = imports.ui.extensionSystem.extensions["{{UUID}}"].nameThatColor;
}

const {
    gi: {
        Cinnamon,
        Clutter,
        Gdk,
        St
    },
    mainloop: Mainloop,
    misc: {
        signalManager: SignalManager
    },
    ui: {
        main: Main,
        tweener: Tweener
    }
} = imports;

const {
    ColorInspectorInfoBannerLabels,
    ELLIPSIS,
    Settings
} = Constants;

const {
    _,
    escapeHTML
} = GlobalUtils;

const {
    LoggingLevel,
    prototypeDebugger
} = DebugManager;

const {
    NameThatColor: NTC
} = NameThatColor;

/* NOTE: NameThatColor library initialization.
 * Initialized here and not where NameThatColor is declared just because I
 * already import and use Mainloop in this file.
 */
Mainloop.idle_add(() => {
    NTC.init();

    return false;
});

function getCurrentMonitor() {
    return Main.layoutManager.currentMonitor;
}

// <3 https://stackoverflow.com/a/19765382
function rgb2hex(red, green, blue) {
    var rgb = blue | (green << 8) | (red << 16);
    return "#" + (0x1000000 + rgb).toString(16).slice(1);
}

function ColorInspectorBanner() {
    this._init.apply(this, arguments);
}

ColorInspectorBanner.prototype = {
    _init: function(aInspector) {
        this.inspector = aInspector;
        this.x = 0;
        this.y = 0;
        this.interceptHide = false;

        this.container = new Cinnamon.GenericContainer({
            reactive: true,
            can_focus: true,
            track_hover: true
        });

        this.actor = new St.BoxLayout({
            name: "ColorInspectorBanner",
            style_class: "cba-box",
            vertical: true
        });
        this.actor.add_style_class_name("modal-dialog");

        this.normalScaleY = this.actor.scale_y;
        this.normalScaleX = this.actor.scale_x;

        this._populateUI();
    },

    _populateUI: function() {
        let infoGrid = new Clutter.GridLayout({
            orientation: Clutter.Orientation.VERTICAL
        });

        let infoBox = new St.Bin({
            style_class: "cba-info-box",
            y_align: St.Align.START,
            y_fill: true,
            x_align: St.Align.START,
            x_fill: true
        });

        infoBox.set_child(new St.Widget({
            layout_manager: infoGrid
        }));

        this.colorNameLabel = new St.Label({
            text: _("No matches"),
            style_class: "cba-header"
        });
        this.passThroughText = new St.Label({
            text: ELLIPSIS,
            style_class: "cba-footer"
        });

        this._additionalInfoText = new St.Label({
            text: _("Press Escape or click to exit"),
            style_class: "cba-footer"
        });

        this.inputFeedback = new St.Button({
            style_class: "cba-info-feedback"
        });
        this.codeFeedback = new St.Button({
            style_class: "cba-info-feedback"
        });
        this.hueFeedback = new St.Button({
            style_class: "cba-info-feedback"
        });

        let labelObj = {
            text: ELLIPSIS,
            style_class: "cba-info-value"
        };

        // Color info.
        let index = 1;
        for (let id in ColorInspectorInfoBannerLabels) {
            let vProp = id + "Value";

            let title = new St.Label({
                text: ColorInspectorInfoBannerLabels[id] + ":",
                style_class: "cba-info-title"
            });

            this[vProp] = new St.Label(labelObj);

            infoGrid.attach(title, 0, index, 1, 1);
            infoGrid.attach(this[id + "Feedback"], 1, index, 1, 1);
            infoGrid.attach(this[vProp], 2, index, 1, 1);

            index++;
        }

        this.actor.add(this.colorNameLabel);
        this.actor.add(infoBox);
        this.actor.add(this.passThroughText);
        this.actor.add(this._additionalInfoText);
    },

    show: function() {
        global.set_cursor(Cinnamon.Cursor.CROSSHAIR);

        Main.uiGroup.add_actor(this.container);
        Main.pushModal(this.container);

        this.interceptHide = true;
        this.actor.raise_top();
        Main.layoutManager.removeChrome(this.actor);
        Main.layoutManager.addChrome(this.actor);
        this.actor.scale_y = 0;
        this.actor.scale_x = 0;
        let [pivX, pivY] = this._getPivotPoint();
        this.actor.set_pivot_point(pivX, pivY);

        Tweener.addTween(this.actor, {
            time: this.inspector.animationTime === 0 ? 0.01 : this.inspector.animationTime,
            opacity: 255,
            visible: true,
            transition: "easeOutQuad",
            scale_y: this.normalScaleY,
            scale_x: this.normalScaleX,
            onComplete: Main.layoutManager._chrome.updateRegions,
            onCompleteScope: Main.layoutManager._chrome
        });

        this.interceptHide = false;
    },

    hide: function(aImmediate) {
        global.unset_cursor();

        if (this.inspector.animationTime === 0) {
            aImmediate = true;
        }

        let [pivX, pivY] = this._getPivotPoint();
        this.actor.set_pivot_point(pivX, pivY);
        Tweener.addTween(this.actor, {
            time: aImmediate ? 0.01 : 0.2,
            opacity: 0,
            visible: false,
            scale_y: 0,
            scale_x: 0,
            transition: "easeOutQuad",
            onComplete: this._onHideComplete,
            onCompleteScope: this
        });

        Main.popModal(this.container);
        Main.uiGroup.remove_actor(this.container);
    },

    _onHideComplete: function() {
        if (!this.interceptHide && this.actor) {
            Main.layoutManager.removeChrome(this.actor);
        }

        Main.layoutManager._chrome.updateRegions();
    },

    setBannerPosition: function(x, y) {
        this.x = x;
        this.y = y;
        this.actor.set_position(x, y);
    },

    setContainerPosition: function() {
        let curMon = getCurrentMonitor();
        this.container.set_position(curMon.x, curMon.y);
        this.container.set_size(curMon.width, curMon.height);
    },

    _getPivotPoint: function() {
        let [xMouse, yMouse, mask] = global.get_pointer(); // jshint ignore:line
        this._xMouse = xMouse;
        this._yMouse = yMouse;

        let currentMonitor = getCurrentMonitor();
        let xHalf = currentMonitor.width / 2;
        let yHalf = currentMonitor.height / 2;

        if (this._xMouse >= xHalf && this._yMouse >= yHalf) { // SW quadrant.
            return [1, 1];
        } else if (this._xMouse <= xHalf && this._yMouse <= yHalf) { // NE quadrant.
            return [0, 0];
        } else if (this._xMouse >= xHalf && this._yMouse <= yHalf) { // NW quadrant.
            return [1, 0];
        }

        return [0, 1]; // SE quadrant.
    },

    destroy: function() {
        this.colorNameLabel.destroy();
        this.passThroughText.destroy();
        this._additionalInfoText.destroy();
        this.inputFeedback.destroy();
        this.codeFeedback.destroy();
        this.hueFeedback.destroy();
        this.actor.destroy();
    }
};

function ColorInspector() {
    this._init.apply(this, arguments);
}

ColorInspector.prototype = {
    _init: function(aCopyInfoToClipboard, aAnimationTime) {
        this.sigMan = new SignalManager.SignalManager(null);
        this.banner = new ColorInspectorBanner(this);
        this.copyInfoToClipboard = aCopyInfoToClipboard;
        this.animationTime = aAnimationTime;
        this.passThroughEvents = false;
        this._colorInfoForClipboard = [];
        this._updateId = 0;
        this._xMouse = 0;
        this._yMouse = 0;
        this.interceptHide = false;
        this.inspectorActive = false;
    },

    initUI: function() {
        Main.layoutManager.addChrome(this.banner.actor, {
            visibleInFullscreen: true
        });
    },

    destroyUI: function() {
        this.banner.hide(true);
        Main.layoutManager.removeChrome(this.banner.actor);

        if (this.banner !== null) {
            this.banner.destroy();
            this.banner = null;
        }

        this.sigMan.disconnectAllSignals();
    },

    moveUI: function() {
        if (!this.inspectorActive) {
            return;
        }

        this.banner.setContainerPosition();

        let [posX, posY] = this.calcBannerPosition();

        Tweener.addTween(this.banner.actor, {
            time: this.animationTime === 0 ? 0.01 : this.animationTime,
            x: posX,
            y: posY,
            transition: "easeOutQuad",
            onComplete: Main.layoutManager._chrome.updateRegions,
            onCompleteScope: Main.layoutManager._chrome
        });
    },

    showUI: function() {
        this.sigMan.connect(global.stage, "captured-event", this._onCapturedEvent.bind(this));
        this.update();
        this.updatePassthroughText();

        let [posX, posY] = this.calcBannerPosition();

        this.banner.setBannerPosition(posX, posY);
        this.banner.show();
        this.inspectorActive = true;

        this.moveUI();
    },

    hideUI: function() {
        this.banner.hide(false);
        this.inspectorActive = false;
        Main.layoutManager._chrome.updateRegions();
        this.sigMan.disconnectAllSignals();
    },

    toggleUI: function() {
        if (this.inspectorActive) {
            this.hideUI();
        } else {
            this.showUI();
        }
    },

    calcBannerPosition: function() {
        /* NOTE: When the magnifier is inactive, keep the banner near the mouse cursor.
         * When the magnifier is active, just snap the banner to the opposite
         * monitor quadrant. It is just too annoying to calculate the size of the
         * magnifier actor to keep the banner close to it but outside its magnifying effect.
         * FIXME: The magnifier presents another problem that I wasn't able to fix yet.
         * When magnifying, the mouse coordinates returned by the call to global.get_pointer()
         * aren't always the coordinates of the pixel from which I want to extract the color.
         */
        let magIsActive = Main.magnifier.isActive();
        let [minWidth, minHeight, bannerNatW, bannerNatH] = this.banner.actor.get_preferred_size(); // jshint ignore:line
        let primary = getCurrentMonitor();
        let xHalf = primary.width / 2;
        let yHalf = primary.height / 2;
        let posX,
            posY;
        /* NOTE: The extraDistance is to separate the banner from the mouse cursor.
         * This way, the banner is close enough to the mouse cursor so to not keep it to
         * far away from sight, and at the same time the banner is far enough so the
         * cursor doesn't overlap it.
         */
        let extraDistance = 32 * global.ui_scale;

        if (magIsActive) {
            posX = this._xMouse >= xHalf ?
                primary.x :
                Math.floor(primary.width - bannerNatW);
        } else {
            posX = this._xMouse >= xHalf ?
                Math.floor(this._xMouse - bannerNatW) - extraDistance :
                this._xMouse + extraDistance;
        }

        if (magIsActive) {
            posY = this._yMouse >= yHalf ?
                primary.y :
                Math.floor(primary.height - bannerNatH);
        } else {
            posY = this._yMouse >= yHalf ?
                Math.floor(this._yMouse - bannerNatH) - extraDistance :
                this._yMouse + extraDistance;
        }

        return [posX, posY];
    },

    _updateModal: function() {
        /* NOTE: passThroughEvents allows to interact with Cinnamon's UI but not
         * with other applications UI. I don't think that it is possible to fix this.
         * - lower_bottom/raise_top(): This is needed when the banner follows the
         * cursor. Otherwise, the banner will be placed behind an opened Cinnamon
         * menu.
         */
        if (this.passThroughEvents) {
            this.banner.actor.lower_bottom();
            this.banner.container.lower_bottom();
        } else {
            this.banner.container.raise_top();
            this.banner.actor.raise_top();
        }
    },

    updatePassthroughText: function() {
        if (this.passThroughEvents) {
            this.banner.passThroughText.text = _("Press Pause or Control to disable event pass through");
        } else {
            this.banner.passThroughText.text = _("Press Pause or Control to enable event pass through");
        }
    },

    _onCapturedEvent: function(aActor, aEvent) {
        if (aEvent.type() === Clutter.EventType.KEY_PRESS &&
            (aEvent.get_key_symbol() === Clutter.Control_L ||
                aEvent.get_key_symbol() === Clutter.Control_R ||
                aEvent.get_key_symbol() === Clutter.Pause)) {
            this.passThroughEvents = !this.passThroughEvents;
            this._updateModal();
            this.updatePassthroughText();
            /* NOTE: Trigger update so the banner is repositioned near the cursor
             * and at the same time is filled with the current pixel color.
             */
            this.update();
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
            this.hideUI();
        }

        return true;
    },

    _onButtonPressEvent: function(aActor, aEvent) {
        if (aEvent.get_source() === this.banner.container) {
            this.copyInfoToClipboard && this._copyColorInfoToClipboard();
            this.hideUI();
        }

        return true;
    },

    _onMotionEvent: function(aActor, aEvent) { // jshint ignore:line
        if (this._updateId > 0) {
            Mainloop.source_remove(this._updateId);
            this._updateId = 0;
        }

        this._updateId = Mainloop.timeout_add(50, () => {
            this.update();
            this.moveUI();
            this._updateId = 0;
        });

        return true;
    },

    update: function() {
        let [xMouse, yMouse, mask] = global.get_pointer(); // jshint ignore:line
        this._xMouse = xMouse;
        this._yMouse = yMouse;
        let pixel = this.getPixelAt(xMouse, yMouse);
        let inputRGB = "rgb(%s, %s, %s)".format(pixel[0], pixel[1], pixel[2]);
        let colorInfo = NTC.name(rgb2hex(
            pixel[0],
            pixel[1],
            pixel[2]
        ));
        this._colorInfoForClipboard = [];

        this.banner.inputFeedback.set_style("background-color: %s;".format(inputRGB));
        this.banner.codeFeedback.set_style("background-color: %s;".format(colorInfo.hex));
        this.banner.hueFeedback.set_style("background-color: %s;".format(colorInfo.hueHex));

        let colorNameText = "%s: %s".format((colorInfo.exact_match ?
            _("Exact Match") :
            _("Approximation")), colorInfo.name);

        this.banner.colorNameLabel.text = colorNameText;
        this._colorInfoForClipboard.push(colorNameText);

        for (let id in ColorInspectorInfoBannerLabels) {
            let vProp = id + "Value";
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

            this.banner[vProp].text = text;
            this._colorInfoForClipboard.push(ColorInspectorInfoBannerLabels[id] + ": " + text);
        }
    },

    getPixelAt: function(x, y) {
        let window = Gdk.get_default_root_window();
        let pixbuf = Gdk.pixbuf_get_from_window(window, x, y, 1, 1);
        return pixbuf.get_pixels();
    },

    _copyColorInfoToClipboard: function() {
        let clipboard = St.Clipboard.get_default();
        let colorInfo = this._colorInfoForClipboard.join("\n");

        if (St.ClipboardType) {
            clipboard.set_text(St.ClipboardType.CLIPBOARD, colorInfo);
        } else {
            clipboard.set_text(colorInfo);
        }

        $.Notification.notify(
            escapeHTML(_("Color information copied to clipboard."))
        );
    }
};

if (Settings.pref_logging_level === LoggingLevel.VERY_VERBOSE ||
    Settings.pref_debugger_enabled) {
    try {
        let protos = {
            ColorInspectorBanner: ColorInspectorBanner,
            ColorInspector: ColorInspector
        };

        for (let name in protos) {
            prototypeDebugger(protos[name], {
                objectName: name,
                verbose: Settings.pref_logging_level === LoggingLevel.VERY_VERBOSE,
                debug: Settings.pref_debugger_enabled
            });
        }
    } catch (aErr) {
        global.logError(aErr);
    }
}
