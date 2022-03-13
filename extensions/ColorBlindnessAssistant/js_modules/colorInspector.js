const {
    gi: {
        Atk,
        Cinnamon,
        Clutter,
        Gdk,
        GLib,
        St
    },
    mainloop: Mainloop,
    misc: {
        signalManager: SignalManager
    },
    signals: Signals,
    ui: {
        main: Main,
        tweener: Tweener
    }
} = imports;

const {
    ColorInspectorInfoBannerLabels,
    ColorInspectorInfoBannerColorCodes,
    ColorInspectorTooltips,
    ELLIPSIS
} = require("js_modules/constants.js");

const {
    _,
    arrayEach,
    copyToClipboard,
    escapeHTML,
    objectEach,
    ScheduleManager
} = require("js_modules/globalUtils.js");

const {
    NameThatColor
} = require("js_modules/nameThatColor.js");

const {
    Debugger,
    getColorSummary,
    Notification,
    Settings
} = require("js_modules/utils.js");

const {
    IntelligentTooltip
} = require("js_modules/customTooltips.js");

/* NOTE: NameThatColor library initialization.
 * Initialized here and not where NameThatColor is declared just because I
 * already import and use Mainloop in this file.
 */
Mainloop.idle_add(() => {
    NameThatColor.init();

    return GLib.SOURCE_REMOVE;
});

function getCurrentMonitor() {
    return Main.layoutManager.currentMonitor;
}

/**
 * Convert RGB color into hexadecimal.
 *
 * <3 https://stackoverflow.com/a/19765382
 *
 * NOTE: This is the only module in which I use this function for now.
 * Mark for globalization when needed.
 *
 * @param {Number} aRed   - The red component of an RGB color.
 * @param {Number} aGreen - The green component of an RGB color.
 * @param {Number} aBlue  - The blue component of an RGB color.
 *
 * @return {String} A color in hexadecimal notation.
 */
function rgb2hex(aRed, aGreen, aBlue) {
    const rgb = aBlue | (aGreen << 8) | (aRed << 16);
    return "#" + (0x1000000 + rgb).toString(16).slice(1);
}

/**
 * [ColorInfoButton description]
 *
 * NOTE: I had to create a button-like object because I couldn't remove the centered alignment of
 * an St.Button label. ¬¬
 *
 * NOTE: Think of creating a global class. If memory serves me well, It isn't the first time that I'm
 * in need of a button whose label should not be centered.
 * Mark for globalization when needed.
 *
 * @type {Class}
 */
const ColorInfoButton = class ColorInfoButton {
    constructor(aDataProperty) {
        this.dataProperty = aDataProperty;

        this.actor = new St.BoxLayout({
            style_class: "cba-info-color-button",
            reactive: true,
            can_focus: true,
            track_hover: true,
            accessible_role: Atk.Role.PUSH_BUTTON
        });
        // NOTE: The modal-dialog-button CSS class is added to avoid adding any kind of
        // hard-coded styling to the "button".
        this.actor.add_style_class_name("modal-dialog-button");

        this._label = new St.Label({
            style_class: "cba-info-color-button-label",
            text: ELLIPSIS,
            x_align: St.Align.MIDDLE,
            x_expand: true,
            y_align: St.Align.START,
            y_expand: true
        });

        this.actor.add_actor(this._label);

        this.tooltip = new IntelligentTooltip(this.actor,
            ColorInspectorTooltips[this.dataProperty === "summary" ? "copy_summary" : "copy_color"]
        );
    }

    set_label(aText) {
        this._label.set_text(aText);
    }
};
Signals.addSignalMethods(ColorInfoButton.prototype);

const ColorInspectorBanner = class ColorInspectorBanner {
    constructor(aColorInspector) {
        this.colorInspector = aColorInspector;
        this.x = 0;
        this.y = 0;
        this.colorInfoButtons = [];
        this.interceptHide = false;

        this.container = new Cinnamon.GenericContainer({
            reactive: true,
            can_focus: true,
            track_hover: true
        });

        this.actor = new St.BoxLayout({
            name: "ColorInspectorBanner",
            style_class: "cba-box",
            vertical: true,
            x_expand: true,
            y_expand: true,
            x_align: St.Align.MIDDLE,
            y_align: St.Align.START
        });
        this.actor.add_style_class_name("modal-dialog");

        this.normalScaleY = this.actor.scale_y;
        this.normalScaleX = this.actor.scale_x;

        this._populateUI();
    }

    get animationTime() {
        return Settings.color_inspector_animation_time / 1000;
    }

    _populateUI() {
        const infoGrid = new Clutter.GridLayout({
            orientation: Clutter.Orientation.VERTICAL
        });
        infoGrid.set_column_spacing(2);
        infoGrid.set_row_spacing(2);

        const infoBox = new St.Widget({
            layout_manager: infoGrid
        });

        this.colorNameLabel = new St.Label({
            text: _("No matches"),
            style_class: "cba-header"
        });
        this.helpLabel = new St.Label({
            text: _("Press F1 to toggle the visibility of extra help"),
            style_class: "cba-footer"
        });
        this.extraHelpLabel = new St.Label({
            text: [
                _("Press Escape or click to exit"),
                _("Press Tab or Pause to toggle color inspection"),
                _("Press Control to toggle event pass through")
            ].join("\n"),
            style_class: "cba-footer"
        });
        this.extraHelpLabel.visible = false;

        // NOTE: The *Feedback buttons are colorized.
        this.inputFeedback = new St.Button({
            style_class: "cba-info-feedback"
        });
        this.detectedFeedback = new St.Button({
            style_class: "cba-info-feedback"
        });
        this.hueFeedback = new St.Button({
            style_class: "cba-info-feedback"
        });

        // Color info.
        let row = 0;
        objectEach(ColorInspectorInfoBannerLabels, (aID) => {
            let col = 2;
            this[`${aID}Title`] = new St.Label({
                text: ColorInspectorInfoBannerLabels[aID],
                style_class: "cba-info-title"
            });

            infoGrid.attach(this[`${aID}Title`], 0, row, 1, 1);
            infoGrid.attach(this[`${aID}Feedback`], 1, row, 1, 1);

            objectEach(ColorInspectorInfoBannerColorCodes, (aCode) => {
                if (!Settings[`color_inspector_${aCode}_visible`]) {
                    return;
                }

                const baseProp = `${aID}_${aCode}`;
                const colorInfoButton = this[`${baseProp}Button`] = new ColorInfoButton(baseProp);
                this.colorInspector.signal_manager.connect(
                    colorInfoButton.actor,
                    "button-release-event",
                    this._onColorInfoButtonClicked.bind(this, baseProp)
                );
                infoGrid.attach(colorInfoButton.actor, col, row, 1, 1);
                this.colorInfoButtons.push(colorInfoButton);

                col++;
            });

            row++;
        });

        // for (const id in ColorInspectorInfoBannerLabels) {
        //     let col = 2;
        //     this[`${id}Title`] = new St.Label({
        //         text: ColorInspectorInfoBannerLabels[id],
        //         style_class: "cba-info-title"
        //     });

        //     infoGrid.attach(this[`${id}Title`], 0, row, 1, 1);
        //     infoGrid.attach(this[`${id}Feedback`], 1, row, 1, 1);

        //     for (const code of ColorInspectorInfoBannerColorCodes) {
        //         if (!Settings[`color_inspector_${code}_visible`]) {
        //             continue;
        //         }

        //         const baseProp = `${id}_${code}`;
        //         const colorInfoButton = this[`${baseProp}Button`] = new ColorInfoButton(baseProp);
        //         this.colorInspector.signal_manager.connect(
        //             colorInfoButton.actor,
        //             "button-release-event",
        //             this._onColorInfoButtonClicked.bind(this, baseProp)
        //         );
        //         infoGrid.attach(colorInfoButton.actor, col, row, 1, 1);
        //         this.colorInfoButtons.push(colorInfoButton);

        //         col++;
        //     }

        //     row++;
        // }

        this.actor.add(this.colorNameLabel);
        this.actor.add(infoBox, {
            x_fill: true,
            y_fill: true,
            expand: true
        });
        this.actor.add(this.helpLabel);
        this.actor.add(this.extraHelpLabel);
    }

    show() {
        global.set_cursor(Cinnamon.Cursor.CROSSHAIR);

        Main.uiGroup.add_actor(this.container);
        Main.pushModal(this.container);

        this.interceptHide = true;
        this.actor.raise_top();
        Main.layoutManager.removeChrome(this.actor);
        Main.layoutManager.addChrome(this.actor);
        this.actor.scale_y = 0;
        this.actor.scale_x = 0;
        const [pivX, pivY] = this._getPivotPoint();
        const animationTime = this.animationTime;
        this.actor.set_pivot_point(pivX, pivY);

        Tweener.addTween(this.actor, {
            time: animationTime === 0 ? 0.01 : animationTime,
            opacity: 255,
            visible: true,
            transition: "easeOutQuad",
            scale_y: this.normalScaleY,
            scale_x: this.normalScaleX,
            onComplete: Main.layoutManager._chrome.updateRegions,
            onCompleteScope: Main.layoutManager._chrome
        });

        this.interceptHide = false;
    }

    hide(aImmediate) {
        global.unset_cursor();

        if (this.animationTime === 0) {
            aImmediate = true;
        }

        const [pivX, pivY] = this._getPivotPoint();
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
    }

    // WARNING: The actor and event parameters are still passed after the aBaseProperty parameter.
    _onColorInfoButtonClicked(aBaseProperty) {
        this.colorInspector.copyColorInfoToClipboard(aBaseProperty);
        // NOTE: The aPreventUpdate parameter is to avoid triggering ColorInspector.update when the
        // ColorInspector.toggleEventsPassthrough and ColorInspector.togglePauseUpdate methods
        // are called before ColorInspector.hideUI is called. Without this "fail safe", a color info
        // value will update under the cursor when a button is clicked to copy its value, which will
        // be very confusing/annoying.
        this.colorInspector.toggleUI(true);

        return Clutter.EVENT_PROPAGATE;
    }

    _onHideComplete() {
        if (!this.interceptHide && this.actor) {
            Main.layoutManager.removeChrome(this.actor);
        }

        Main.layoutManager._chrome.updateRegions();
    }

    setBannerPosition(x, y) {
        this.x = x;
        this.y = y;
        this.actor.set_position(x, y);
    }

    setContainerPosition() {
        const curMon = getCurrentMonitor();
        this.container.set_position(curMon.x, curMon.y);
        this.container.set_size(curMon.width, curMon.height);
    }

    _getPivotPoint() {
        const [xMouse, yMouse, mask] = global.get_pointer(); // jshint ignore:line
        this._xMouse = xMouse;
        this._yMouse = yMouse;

        const currentMonitor = getCurrentMonitor();
        const xHalf = currentMonitor.width / 2;
        const yHalf = currentMonitor.height / 2;

        if (this._xMouse >= xHalf && this._yMouse >= yHalf) { // SW quadrant.
            return [1, 1];
        } else if (this._xMouse <= xHalf && this._yMouse <= yHalf) { // NE quadrant.
            return [0, 0];
        } else if (this._xMouse >= xHalf && this._yMouse <= yHalf) { // NW quadrant.
            return [1, 0];
        }

        return [0, 1]; // SE quadrant.
    }

    destroy() {
        this.colorNameLabel.destroy();
        this.helpLabel.destroy();
        this.extraHelpLabel.destroy();
        this.inputFeedback.destroy();
        this.detectedFeedback.destroy();
        this.hueFeedback.destroy();

        arrayEach(this.colorInfoButtons, (aBtn) => {
            aBtn.destroy();
        });

        this.colorInfoButtons = [];

        this.actor.destroy();
    }
};

var ColorInspector = class ColorInspector {
    constructor() {
        this.signal_manager = new SignalManager.SignalManager();
        this.schedule_manager = new ScheduleManager();
        this.banner = new ColorInspectorBanner(this);
        this.passThroughEvents = false;
        this.pauseUpdate = false;
        this._xMouse = 0;
        this._yMouse = 0;
        this.interceptHide = false;
        this.inspectorActive = false;
        this.colorInfo = null;
    }

    initUI() {
        Main.layoutManager.addChrome(this.banner.actor, {
            visibleInFullscreen: true
        });
    }

    destroyUI() {
        // NOTE: Check if active before trying to hide. Mainly because popModal will fail.
        if (this.inspectorActive) {
            this.banner.hide(true);
        }

        Main.layoutManager.removeChrome(this.banner.actor);

        this.signal_manager.disconnectAllSignals();
        this.schedule_manager.clearAllSchedules();

        if (this.banner !== null) {
            this.banner.destroy();
            this.banner = null;
        }
    }

    moveUI() {
        if (!this.inspectorActive ||
            (this.inspectorActive && Settings.color_inspector_positioning_mode === "initial")) {
            return;
        }

        this.banner.setContainerPosition();

        const [posX, posY] = this.calcBannerPosition();
        const animationTime = this.banner.animationTime;

        Tweener.addTween(this.banner.actor, {
            time: animationTime === 0 ? 0.01 : animationTime,
            x: posX,
            y: posY,
            transition: "easeOutQuad",
            onComplete: Main.layoutManager._chrome.updateRegions,
            onCompleteScope: Main.layoutManager._chrome
        });
    }

    showUI() {
        this.signal_manager.connect(global.stage, "captured-event", function(aActor, aEvent) {
            this._onCapturedEvent(aActor, aEvent);
        }.bind(this));
        this.update();

        const [posX, posY] = this.calcBannerPosition();

        this.banner.setBannerPosition(posX, posY);
        this.banner.show();
        this.inspectorActive = true;

        this.moveUI();
    }

    hideUI() {
        this.banner.hide(false);
        this.inspectorActive = false;
        Main.layoutManager._chrome.updateRegions();
        this.signal_manager.disconnect("captured-event", global.stage);
        this.colorInfo = null;
    }

    toggleUI(aPreventUpdate) {
        if (this.inspectorActive) {
            this.passThroughEvents && this.toggleEventsPassthrough(aPreventUpdate);
            this.pauseUpdate && this.togglePauseUpdate(aPreventUpdate);
            this.hideUI();
        } else {
            this.showUI();
        }
    }

    toggleEventsPassthrough(aPreventUpdate) {
        this.passThroughEvents = !this.passThroughEvents;
        this._updateModal();
        /* NOTE: Trigger update so the banner is repositioned near the cursor
         * and at the same time is filled with the current pixel color.
         */
        aPreventUpdate || this.update();
    }

    toggleHelpText() {
        this.banner.extraHelpLabel.visible = !this.banner.extraHelpLabel.visible;
    }

    togglePauseUpdate(aPreventUpdate) {
        this.pauseUpdate = !this.pauseUpdate;

        if (this.pauseUpdate) {
            global.unset_cursor();
        } else {
            global.set_cursor(Cinnamon.Cursor.CROSSHAIR);
            aPreventUpdate || this.update();
        }
    }

    calcBannerPosition() {
        /* NOTE: When the magnifier is inactive, keep the banner near the mouse cursor.
         * When the magnifier is active, just snap the banner to the opposite
         * monitor quadrant. It is just too annoying to calculate the size of the
         * magnifier actor to keep the banner close to it but outside its magnifying effect.
         * FIXME: The magnifier presents another problem that I wasn't able to fix yet.
         * When magnifying, the mouse coordinates returned by the call to global.get_pointer()
         * aren't always the coordinates of the pixel from which I want to extract the color.
         */
        const cornerMode = Main.magnifier.isActive() || Settings.color_inspector_positioning_mode === "corners";
        const [minWidth, minHeight, bannerNatW, bannerNatH] = this.banner.actor.get_preferred_size(); // jshint ignore:line
        const primary = getCurrentMonitor();
        const xHalf = primary.width / 2;
        const yHalf = primary.height / 2;
        let posX,
            posY;
        /* NOTE: The extraDistance is to separate the banner from the mouse cursor.
         * This way, the banner is close enough to the mouse cursor so to not keep it to
         * far away from sight, and at the same time the banner is far enough so the
         * cursor doesn't overlap it.
         */
        const extraDistance = 32 * global.ui_scale;

        if (cornerMode) {
            posX = this._xMouse >= xHalf ?
                primary.x :
                Math.floor(primary.width - bannerNatW);
        } else {
            posX = this._xMouse >= xHalf ?
                Math.floor(this._xMouse - bannerNatW) - extraDistance :
                this._xMouse + extraDistance;
        }

        if (cornerMode) {
            posY = this._yMouse >= yHalf ?
                primary.y :
                Math.floor(primary.height - bannerNatH);
        } else {
            posY = this._yMouse >= yHalf ?
                Math.floor(this._yMouse - bannerNatH) - extraDistance :
                this._yMouse + extraDistance;
        }

        return [posX, posY];
    }

    _updateModal() {
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
    }

    _onCapturedEvent(aActor, aEvent) {
        const eventType = aEvent.type();

        switch (eventType) {
            case Clutter.EventType.KEY_PRESS:
                return this._onKeyPressEvent(aActor, aEvent);
        }

        if (this.pauseUpdate || this.passThroughEvents) {
            return Clutter.EVENT_PROPAGATE;
        }

        switch (eventType) {
            case Clutter.EventType.KEY_PRESS:
                return this._onKeyPressEvent(aActor, aEvent);
            case Clutter.EventType.BUTTON_PRESS:
                return this._onButtonPressEvent(aActor, aEvent);
            case Clutter.EventType.MOTION:
                return this._onMotionEvent(aActor, aEvent);
            default:
                return Clutter.EVENT_STOP;
        }
    }

    _onKeyPressEvent(aActor, aEvent) {
        const symbol = aEvent.get_key_symbol();

        switch (symbol) {
            case Clutter.KEY_Escape:
                this.passThroughEvents && this.toggleEventsPassthrough();
                this.pauseUpdate && this.togglePauseUpdate();
                this.hideUI();
                break;
            case Clutter.KEY_Control_L:
            case Clutter.KEY_Control_R:
                this.toggleEventsPassthrough();
                break;
                // NOTE: The Pause key is too annoying to use.
            case Clutter.KEY_Tab:
            case Clutter.KEY_ISO_Left_Tab:
            case Clutter.KEY_Pause:
                this.togglePauseUpdate();
                break;
            case Clutter.KEY_F1:
            case Clutter.KEY_KP_F1:
                this.toggleHelpText();
                break;
        }

        return Clutter.EVENT_STOP;
    }

    _onButtonPressEvent(aActor, aEvent) {
        if (aEvent.get_source() === this.banner.container) {
            let prop = null;

            switch (aEvent.get_button()) {
                case Clutter.BUTTON_PRIMARY:
                    prop = Settings.color_inspector_always_copy_to_clipboard_lc;
                    break;
                case Clutter.BUTTON_SECONDARY:
                    prop = Settings.color_inspector_always_copy_to_clipboard_rc;
                    break;

            }

            this.copyColorInfoToClipboard(prop);

            this.hideUI();
        }

        return Clutter.EVENT_STOP;
    }

    _onMotionEvent(aActor, aEvent) { // jshint ignore:line
        this.schedule_manager.setTimeout("update_on_motion", () => {
            this.update();
            this.moveUI();
        }, 50);

        return Clutter.EVENT_STOP;
    }

    update() {
        const [xMouse, yMouse, mask] = global.get_pointer(); // jshint ignore:line
        this._xMouse = xMouse;
        this._yMouse = yMouse;
        const pixel = this.getPixelAt(xMouse, yMouse);
        const inputRGB = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        const inputHEX = rgb2hex(pixel[0], pixel[1], pixel[2]);
        const inputHSL = NameThatColor.hsl(inputHEX, true);
        this.colorInfo = NameThatColor.name(inputHEX);
        this.colorInfo["input_rgb"] = inputRGB;
        this.colorInfo["input_hsl"] = inputHSL;

        this.banner.inputFeedback.set_style(`background-color: ${this.colorInfo.input_hex};`);
        this.banner.detectedFeedback.set_style(`background-color: ${this.colorInfo.detected_hex};`);
        this.banner.hueFeedback.set_style(`background-color: ${this.colorInfo.hue_hex};`);

        const colorNameText = "%s: %s".format((this.colorInfo.exact_match ?
            _("Exact Match") :
            _("Approximation")), this.colorInfo.detected_name);

        this.banner.colorNameLabel.text = colorNameText;
        this.banner.hueTitle.text = ColorInspectorInfoBannerLabels.hue.format(this.colorInfo.hue_name);

        objectEach(ColorInspectorInfoBannerLabels, (aID) => {
            objectEach(ColorInspectorInfoBannerColorCodes, (aCode) => {
                if (!Settings[`color_inspector_${aCode}_visible`]) {
                    return;
                }

                const baseProp = `${aID}_${aCode}`;
                this.banner[`${baseProp}Button`].set_label(this.colorInfo[baseProp]);
            });
        });

        // for (const id in ColorInspectorInfoBannerLabels) {
        //     for (const code of ColorInspectorInfoBannerColorCodes) {
        //         if (!Settings[`color_inspector_${code}_visible`]) {
        //             continue;
        //         }

        //         const baseProp = `${id}_${code}`;
        //         this.banner[`${baseProp}Button`].set_label(this.colorInfo[baseProp]);
        //     }
        // }
    }

    getPixelAt(x, y) {
        const window = Gdk.get_default_root_window();
        const pixbuf = Gdk.pixbuf_get_from_window(window, x, y, 1, 1);
        return pixbuf.get_pixels();
    }

    copyColorInfoToClipboard(aProp = null) {
        if (!aProp || aProp === "disabled") {
            return true;
        }

        if (!this.colorInfo) {
            Notification.notify(
                escapeHTML(_("No color information available."))
            );

            return true;
        }

        switch (aProp) {
            case "summary":
                copyToClipboard(getColorSummary(this.colorInfo));
                break;
                // input_hex
                // input_rgb
                // input_hsl
                // detected_hex
                // detected_rgb
                // detected_hsl
                // hue_hex
                // hue_rgb
                // hue_hsl
            default:
                copyToClipboard(this.colorInfo[aProp]);
        }

        Settings.color_inspector_always_copy_to_clipboard_notify && Notification.notify(
            escapeHTML(_("Color information copied to clipboard."))
        );

        return true;
    }
};

Debugger.wrapObjectMethods({
    ColorInspectorBanner: ColorInspectorBanner,
    ColorInspector: ColorInspector
});
