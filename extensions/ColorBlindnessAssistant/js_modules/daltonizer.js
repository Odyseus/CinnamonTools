const {
    gi: {
        Cinnamon,
        St
    },
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
    EFFECT_PROP_NAME,
    DaltonizerWizardLabels,
    DaltonizerWizardTooltips
} = require("js_modules/constants.js");

const {
    _,
    arrayEach,
    KeybindingsManager,
    ScheduleManager
} = require("js_modules/globalUtils.js");

const {
    IntelligentTooltip
} = require("js_modules/customTooltips.js");

const {
    Debugger,
    getDaltonizerClass,
    Settings
} = require("js_modules/utils.js");

const CheckButton = class CheckButton {
    constructor(aDaltonizer, aCheckPropertyValue) {
        this.daltonizer = aDaltonizer;
        this.text = DaltonizerWizardLabels[aCheckPropertyValue][
            Settings.daltonizer_compact_ui ?
            "compact" :
            "normal"
        ];
        this.checkPropertyValue = aCheckPropertyValue;
        this.checkPropertyName = null;
        this.actor = new St.Button({
            style_class: getDaltonizerClass("cba-check-button"),
            label: this.text,
            reactive: true,
            can_focus: true,
            track_hover: true
        });

        this.actor.add_style_class_name(getDaltonizerClass("modal-dialog-button"));
        this.actor.connect("button-press-event", () => this._onButtonPress());
        this.tooltip = new IntelligentTooltip(this.actor, DaltonizerWizardTooltips[aCheckPropertyValue]);
    }

    updateCheckedState(aActor, aCheckProp) {
        this.actor.change_style_pseudo_class(
            "checked",
            aCheckProp === this.checkPropertyValue
        );
    }

    _onButtonPress() {
        /* NOTE: Do not trigger signals and function calls when the button is
         * already checked. Otherwise, it will toggle the effect without updating
         * the checked state of the button.
         */
        if (this.actor.has_style_pseudo_class("checked")) {
            return;
        }

        this.daltonizer.setEffectIdDefProperty(this.checkPropertyName, this.checkPropertyValue);
        this.emit("checked-state-changed");

        if (this.checkPropertyName === "actor") {
            this.daltonizer.winTracker.forceScreen = this.checkPropertyValue === "screen";
            this.daltonizer.winTracker._onFocus();
        } else {
            this.daltonizer.toggleEffect();
        }
    }
};
Signals.addSignalMethods(CheckButton.prototype);

const CheckGroup = class CheckGroup {
    constructor(aDaltonizer, aCheckPropertyName) {
        this.actors = [];
        this.daltonizer = aDaltonizer;
        this.checkPropertyName = aCheckPropertyName;
    }

    registerActor(aActor) {
        aActor.connect("checked-state-changed",
            (aActor) => this.updateCheckedState(aActor));
        aActor.checkPropertyName = this.checkPropertyName;
        this.actors.push(aActor);
    }

    updateCheckedState() {
        for (const actor of this.actors) {
            actor.updateCheckedState(
                null,
                this.daltonizer.getEffectIdDef()[this.checkPropertyName]
            );
        }
    }
};

const DaltonizerTitleBox = class DaltonizerTitleBox {
    constructor(aDaltonizer, aTitleText) {
        this.daltonizer = aDaltonizer;

        this.actor = new St.BoxLayout({
            style_class: getDaltonizerClass("cba-title-box")
        });
        this._titleText = aTitleText;

        this._label = new St.Label({
            style_class: getDaltonizerClass("cba-title-box-label"),
            text: this._titleText
        });

        this._iconBin = new St.Bin({
            style_class: getDaltonizerClass("cba-title-box-app-icon"),
            x_fill: false,
            y_fill: false
        });

        const _closeIcon = new St.Icon({
            icon_name: "window-close",
            icon_size: 24,
            icon_type: St.IconType.SYMBOLIC,
            style_class: getDaltonizerClass("cba-title-box-close-icon")
        });
        this._closeButton = new St.Button({
            style_class: getDaltonizerClass("cba-title-box-close-button"),
            child: _closeIcon
        });

        this._closeButton.connect("button-release-event",
            () => this._onCloseButtonClicked());
        this._closeButton.tooltip = new IntelligentTooltip(this._closeButton, _("Close daltonizer"));

        this.actor.add(this._iconBin);
        this.actor.add(this._label, {
            x_fill: true,
            expand: true
        });
        this.actor.add(this._closeButton, {
            x_fill: false,
            expand: false
        });
    }

    set_title(aTitle) {
        this._titleText = aTitle;
        this._label.text = this._titleText;
    }

    set_app(aApp, aTitle) {
        const iconSize = Settings.daltonizer_compact_ui ? 16 : 24;
        this._titleText = Settings.daltonizer_compact_ui ? "" : `${aApp.get_name()} - ${aTitle}`;
        this._label.text = this._titleText;
        this._icon = aApp.create_icon_texture(iconSize);

        this._iconBin.set_size(iconSize, iconSize);
        this._iconBin.child = this._icon;
    }

    _onCloseButtonClicked() {
        this.daltonizer.toggleUI();
    }
};

const DaltonizerWizard = class DaltonizerWizard {
    constructor(aDaltonizer, aTitle) {
        /* NOTE: The order of _effects is important so they are "symmetrically"
         * displayed in the wizard.
         */
        this._effects = [
            "none",
            "acromatopia_rod_simulation",
            "acromatopia_blue_cone_simulation",
            "protanopia_compensation",
            "deuteranopia_compensation",
            "tritanopia_compensation",
            "protanopia_simulation",
            "deuteranopia_simulation",
            "tritanopia_simulation"
        ];

        this._actors = [
            "focused_window",
            "screen"
        ];

        this._colorSpaces = [
            "srgb",
            "cie"
        ];

        this.daltonizer = aDaltonizer;
        this.title = aTitle;
        this.x = 0;
        this.y = 0;
        this.interceptHide = false;
        this.keybinding_manager = new KeybindingsManager();

        this.actor = new St.BoxLayout({
            name: "Daltonizer",
            style_class: getDaltonizerClass("cba-box"),
            vertical: true,
            reactive: true,
            can_focus: true,
            track_hover: true
        });
        this.actor.add_style_class_name(getDaltonizerClass("modal-dialog"));
        this.actor.set_opacity(0);
        this.actor.hide();

        this.normalScaleY = this.actor.scale_y;
        this.normalScaleX = this.actor.scale_x;

        this.titleBox = new DaltonizerTitleBox(this.daltonizer, aTitle);

        const sectionOnj = {
            homogeneous: true,
            style_class: getDaltonizerClass("cba-section"),
            can_focus: true,
            track_hover: true,
            reactive: true
        };

        this.effectNamesBox = new St.Table(sectionOnj);
        this.effectNamesBox.add_style_class_name(getDaltonizerClass("cba-effect-names"));
        this.actorsBox = new St.Table(sectionOnj);
        this.actorsBox.add_style_class_name(getDaltonizerClass("cba-actors"));
        this.colorSpacesBox = new St.Table(sectionOnj);
        this.colorSpacesBox.add_style_class_name(getDaltonizerClass("cba-color-spaces"));

        this.additionalInfoText = new St.Label({
            text: _("Press Escape or the close button to exit"),
            style_class: getDaltonizerClass("cba-footer")
        });

        this.actor.add(this.titleBox.actor, {
            x_fill: true
        });
        this.actor.add(this.effectNamesBox, {
            x_fill: false
        });
        this.actor.add(this.actorsBox, {
            x_fill: false
        });
        this.actor.add(this.colorSpacesBox, {
            x_fill: false
        });
        this.actor.add(this.additionalInfoText, {
            x_fill: true
        });

        this._populateUI();
    }

    _populateUI() {
        this.effectsGroup = new CheckGroup(this.daltonizer, "base_name");
        this.actorsGroup = new CheckGroup(this.daltonizer, "actor");
        this.colorSpacesGroup = new CheckGroup(this.daltonizer, "color_space");

        const titleSecColDef = {
            row: 0,
            col: 0,
            col_span: 3,
            x_fill: true,
            y_fill: false
        };

        // Effects names section.
        let titleSecLabel = new St.Label({
            text: _("Effect Name"),
            style_class: getDaltonizerClass("cba-section-title")
        });
        titleSecLabel.add_style_class_name(getDaltonizerClass("cba-effect-names"));

        this.effectNamesBox.add(titleSecLabel, titleSecColDef);
        const breakPoint = 3;
        let row = 1;
        let col = 0;
        for (const effect of this._effects) {
            const check = new CheckButton(this.daltonizer, effect);

            this.effectNamesBox.add(check.actor, {
                row: row,
                col: col,
                x_fill: true,
                y_fill: false
            });
            this.effectsGroup.registerActor(check);

            col++;

            if (col === breakPoint) {
                row += 1;
                col = 0;
            }
        }

        /* NOTE: The following two sections (tables) contain only two elements (columns).
         * So, span the title (the first row in the table) up to two columns.
         */
        titleSecColDef["col_span"] = 2;

        // Actors section.
        titleSecLabel = new St.Label({
            text: _("Actor"),
            style_class: getDaltonizerClass("cba-section-title")
        });
        titleSecLabel.add_style_class_name(getDaltonizerClass("cba-actors"));

        this.actorsBox.add(titleSecLabel, titleSecColDef);
        arrayEach(this._actors, (aActor, aIdx) => {
            const check = new CheckButton(this.daltonizer, aActor);
            this.actorsBox.add(check.actor, {
                row: 1,
                col: aIdx,
                x_fill: true,
                y_fill: false
            });
            this.actorsGroup.registerActor(check);
        });

        // Color spaces section.
        titleSecLabel = new St.Label({
            text: _("Color Space"),
            style_class: getDaltonizerClass("cba-section-title")
        });
        titleSecLabel.add_style_class_name(getDaltonizerClass("cba-color-spaces"));

        this.colorSpacesBox.add(titleSecLabel, titleSecColDef);
        arrayEach(this._colorSpaces, (aColorSpace, aIdx) => {
            const check = new CheckButton(this.daltonizer, aColorSpace);
            this.colorSpacesBox.add(check.actor, {
                row: 1,
                col: aIdx,
                x_fill: true,
                y_fill: false
            });
            this.colorSpacesGroup.registerActor(check);
        });
    }

    set_position(x, y) {
        this.x = x;
        this.y = y;
        this.actor.set_position(x, y);
    }

    show() {
        this.interceptHide = true;

        /* FIXME: I'm using the same trick used by the Cinnamon gTile extension.
         * See if I can implement it properly without messing with keyboard focus.
         * As it is now, the keybinding is added when the wizard is shown and
         * removed when the wizard is hidden. It works perfectly, but I don't
         * think that this is "the right way".
         * NOTE: I tried connecting the "captured-event" event to global.stage just like I do with
         * the ColorInspector class of the colorInspector.js module. But that module
         * uses a modal for its UI, this one doesn't. When doing it in this module, the event
         * source isn't this extension's UI, it's whatever has focus behind it.
         */
        this.keybinding_manager.addKeybinding(
            "close_wizard",
            "Escape",
            this.daltonizer.hideUI.bind(this.daltonizer)
        );

        this.updateCheckedState();

        this.actor.raise_top();
        Main.layoutManager.removeChrome(this.actor);
        Main.layoutManager.addChrome(this.actor);
        this.actor.scale_y = 0;
        this.actor.scale_x = 0;
        this.actor.set_pivot_point(0.5, 0.5);
        const animationTime = Settings.daltonizer_animation_time / 1000;

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
        this.keybinding_manager.clearAllKeybindings();

        if (Settings.daltonizer_animation_time === 0) {
            aImmediate = true;
        }

        this.actor.set_pivot_point(0.5, 0.5);
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
    }

    updateCheckedState() {
        this.effectsGroup.updateCheckedState();
        this.actorsGroup.updateCheckedState();
        this.colorSpacesGroup.updateCheckedState();
    }

    _onHideComplete() {
        if (!this.interceptHide && this.actor) {
            Main.layoutManager.removeChrome(this.actor);
        }

        Main.layoutManager._chrome.updateRegions();
    }

    destroy() {
        this.keybinding_manager.clearAllKeybindings();

        this.titleBox.actor.destroy();
        this.effectNamesBox.destroy();
        this.actorsBox.destroy();
        this.colorSpacesBox.destroy();
        this.additionalInfoText.destroy();
        this.actor.destroy();
        this.title = null;
    }
};

const WindowTracker = class WindowTracker {
    constructor(aDaltonizer) {
        this.signal_manager = new SignalManager.SignalManager();
        this.schedule_manager = new ScheduleManager();
        this.daltonizer = aDaltonizer;
        this.focusMetaWindow = null;
        this.forceScreen = false;
        this._tracker = Cinnamon.WindowTracker.get_default();
        this.signal_manager.connect(
            this._tracker,
            "notify::focus-app",
            this._onFocus.bind(this)
        );
    }

    destroy() {
        this.signal_manager.disconnectAllSignals();
        this.schedule_manager.clearAllSchedules();
    }

    _onFocus() {
        if (!this.daltonizer.daltonizerActive) {
            return;
        }

        /* NOTE: Some signals (possibly "notify::focus-app" or "notify::title"; who the hell knows)
         * force the trigger of _onFocus a million times per second! ¬¬
         * Put a stop to it!!!
         * 200 milliseconds is fast enough for the changes to the wizard to seem instant
         * and slow enough to avoid triggering the function from different signals at
         * the same time.
         */
        this.schedule_manager.setTimeout("on_focus", () => {
            this.resetFocusMetaWindow();
            const window = this.focusMetaWindow = (this.forceScreen ? null : this.getFocusApp());
            const winType = window ? window.get_window_type() : 1;
            let actor;
            let actorRepr;

            if (window && winType !== 1) {
                this.signal_manager.connect(window, "notify::title", this._onFocus.bind(this));

                actor = window.get_compositor_private();

                if (actor) {
                    this.signal_manager.connect(actor, "size-changed",
                        this.daltonizer.moveUI.bind(this.daltonizer)
                    );
                    this.signal_manager.connect(actor, "position-changed",
                        this.daltonizer.moveUI.bind(this.daltonizer)
                    );
                }

                const app = this._tracker.get_window_app(window);
                const title = window.get_title();

                if (app) {
                    this.daltonizer.wizard.titleBox.set_app(app, title);
                } else {
                    this.daltonizer.wizard.titleBox.set_title(Settings.daltonizer_compact_ui ? "" : title);
                }

                actorRepr = "focused_window";
            } else {
                actor = Main.uiGroup;
                actorRepr = "screen";
                this.daltonizer.wizard.titleBox.set_title(_("Screen"));

                if (this.daltonizer.wizard.titleBox._iconBin.child) {
                    this.daltonizer.wizard.titleBox._iconBin.child.destroy();
                }
            }

            if (actor && actor.hasOwnProperty(EFFECT_PROP_NAME)) {
                this.daltonizer.setEffectIdDef(actor[EFFECT_PROP_NAME].id);
            } else {
                this.daltonizer.setEffectIdDef(null);
            }

            this.daltonizer.moveUI();
            this.daltonizer.setEffectIdDefProperty("actor", actorRepr);
            this.daltonizer.wizard.updateCheckedState();
        }, 200);
    }

    resetFocusMetaWindow() {
        this.signal_manager.disconnect("notify::title");
        this.signal_manager.disconnect("size-changed");
        this.signal_manager.disconnect("position-changed");
        this.focusMetaWindow = null;
    }

    getFocusApp() {
        return global.display.focus_window;
    }

    getCurrentMonitor() {
        return Main.layoutManager.currentMonitor;
    }
};

/* TODO: Make the daltonizer work with the effect definition, not the effect ID.
 * I gave it a try and I found more problems than solutions.
 * - The toggling of the effect time went so slow that when enabling an effect
 *     and then quickly disabling it, it would get stuck. I have no idea why!
 * - Another problem was that when the daltonizer was closed with the keybinding
 *     that opened it, the WindowTracker connections stored in its signal manager
 *     would not get cleared. This caused the call to the daltonizer's moveUI
 *     method be triggered a trillion times per second! JEESH!!!
 * HINT: Could it be related to something called "circular references"? Too
 * advanced a concept for me to even start thinking about it.
 */
var Daltonizer = class Daltonizer {
    constructor(aToggleEffectCallback) {
        this._effectIdDef = this.defaultEffectIdDef;
        this.toggleEffectCallback = aToggleEffectCallback;
        this.daltonizerActive = false;
        this.wizard = new DaltonizerWizard(this, _("Daltonizer"));
        this.winTracker = new WindowTracker(this);
    }

    toggleEffect() {
        const effectIdDef = this.getEffectIdDef();
        this.toggleEffectCallback({
            base_name: effectIdDef.base_name,
            actor: effectIdDef.actor,
            color_space: effectIdDef.color_space,
            keybinding: "",
            id: `${effectIdDef.base_name}:${effectIdDef.actor}:${effectIdDef.color_space}`
        });
    }

    initUI() {
        Main.layoutManager.addChrome(this.wizard.actor, {
            visibleInFullscreen: true
        });
    }

    destroyUI() {
        this.wizard.hide(true);
        Main.layoutManager.removeChrome(this.wizard.actor);

        if (this.winTracker !== null) {
            this.winTracker.destroy();
            this.winTracker = null;
        }

        if (this.wizard !== null) {
            this.wizard.destroy();
            this.wizard = null;
        }
    }

    _calcFinalPosition(aPosX, aPosY) {
        return [
            Math.floor(aPosX - this.wizard.actor.width / 2),
            Math.floor(aPosY - this.wizard.actor.height / 2)
        ];

    }

    moveUI() {
        if (!this.daltonizerActive) {
            return;
        }

        const window = this.winTracker.focusMetaWindow;
        const currentMonitor = this.winTracker.getCurrentMonitor();
        let pos_x = currentMonitor.x + currentMonitor.width / 2;
        let pos_y = currentMonitor.y + currentMonitor.height / 2;

        if (window) {
            if (window.get_monitor() === currentMonitor.index) {
                pos_x = window.get_outer_rect().width / 2 + window.get_outer_rect().x;
                pos_y = window.get_outer_rect().height / 2 + window.get_outer_rect().y;
            }
            [pos_x, pos_y] = this._calcFinalPosition(pos_x, pos_y);

            if (window.get_monitor() === currentMonitor.index) {
                pos_x = (pos_x < currentMonitor.x) ? currentMonitor.x : pos_x;
                pos_x = ((pos_x + this.wizard.actor.width) > (currentMonitor.width + currentMonitor.x)) ?
                    currentMonitor.x + currentMonitor.width - this.wizard.actor.width :
                    pos_x;
                pos_y = (pos_y < currentMonitor.y) ? currentMonitor.y : pos_y;
                pos_y = ((pos_y + this.wizard.actor.height) > (currentMonitor.height + currentMonitor.y)) ?
                    currentMonitor.y + currentMonitor.height - this.wizard.actor.height :
                    pos_y;
            }
        } else {
            [pos_x, pos_y] = this._calcFinalPosition(pos_x, pos_y);
        }
        const animationTime = Settings.daltonizer_animation_time / 1000;

        Tweener.addTween(this.wizard.actor, {
            time: animationTime === 0 ? 0.01 : animationTime,
            x: pos_x,
            y: pos_y,
            transition: "easeOutQuad",
            onComplete: Main.layoutManager._chrome.updateRegions,
            onCompleteScope: Main.layoutManager._chrome
        });
    }

    showUI() {
        const window = this.winTracker.focusMetaWindow = this.winTracker.getFocusApp();
        const currentMonitor = this.winTracker.getCurrentMonitor();
        /* NOTE: winType 1 = Desktop
         */
        const winType = window ? window.get_window_type() : 1;
        let pos_x = currentMonitor.x + currentMonitor.width / 2;
        let pos_y = currentMonitor.y + currentMonitor.height / 2;
        let actor;
        let actorRepr;

        if (window && winType !== 1) {
            const layer = window.get_layer();

            if (window && layer > 0) {
                if (window.get_monitor() === currentMonitor.index) {
                    pos_x = window.get_outer_rect().width / 2 + window.get_outer_rect().x;
                    pos_y = window.get_outer_rect().height / 2 + window.get_outer_rect().y;
                }

                actor = window.get_compositor_private();
            }

            actorRepr = "focused_window";
        } else {
            actor = Main.uiGroup;
            actorRepr = "screen";
        }

        if (actor && actor.hasOwnProperty(EFFECT_PROP_NAME)) {
            this.setEffectIdDef(actor[EFFECT_PROP_NAME].id);
        } else {
            this.setEffectIdDef(null);
        }
        [pos_x, pos_y] = this._calcFinalPosition(pos_x, pos_y);

        this.wizard.set_position(pos_x, pos_y);

        this.setEffectIdDefProperty("actor", actorRepr);

        /* NOTE: It's easier to just set their visibility than to selectively
         * create/destroy them.
         */
        this.wizard.actorsBox[Settings.daltonizer_show_actors_box ? "show" : "hide"]();
        this.wizard.colorSpacesBox[Settings.daltonizer_show_colorspaces_box ? "show" : "hide"]();

        this.wizard.show();
        this.daltonizerActive = true;
        this.winTracker._onFocus();

        this.moveUI();
    }

    hideUI() {
        this.wizard.hide(false);
        this.winTracker.resetFocusMetaWindow();
        this.daltonizerActive = false;
        Main.layoutManager._chrome.updateRegions();
    }

    toggleUI() {
        if (this.daltonizerActive) {
            this.hideUI();
        } else {
            this.showUI();
        }
    }

    getEffectIdDef() {
        return this._effectIdDef;
    }

    setEffectIdDef(aEffectID = null) {
        if (aEffectID === null) {
            this._effectIdDef = this.defaultEffectIdDef;
        } else {
            const [base_name, actor, color_space] = aEffectID.split(":");
            this._effectIdDef["base_name"] = base_name;
            this._effectIdDef["actor"] = actor;
            this._effectIdDef["color_space"] = color_space;
        }
    }

    setEffectIdDefProperty(aProperty, aValue) {
        this._effectIdDef[aProperty] = aValue;
    }

    get defaultEffectIdDef() {
        return {
            base_name: "none",
            actor: "focused_window",
            color_space: "srgb"
        };
    }
};

Debugger.wrapObjectMethods({
    CheckButton: CheckButton,
    CheckGroup: CheckGroup,
    Daltonizer: Daltonizer,
    DaltonizerTitleBox: DaltonizerTitleBox,
    DaltonizerWizard: DaltonizerWizard,
    IntelligentTooltip: IntelligentTooltip,
    WindowTracker: WindowTracker
});
