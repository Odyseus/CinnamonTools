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
    _,
    EFFECT_PROP_NAME,
    DaltonizerWizardLabels,
    DaltonizerWizardTooltips
} = constants;

const {
    gi: {
        Cinnamon,
        Pango,
        St
    },
    mainloop: Mainloop,
    misc: {
        signalManager: SignalManager
    },
    signals: Signals,
    ui: {
        main: Main,
        tooltips: Tooltips,
        tweener: Tweener
    }
} = imports;

function CustomTooltip() {
    this._init.apply(this, arguments);
}

CustomTooltip.prototype = {
    __proto__: Tooltips.Tooltip.prototype,

    _init: function(aActor, aText) {
        Tooltips.Tooltip.prototype._init.call(this, aActor, aText);

        this._tooltip.set_style("text-align: left;width:auto;max-width: 450px;");
        this._tooltip.get_clutter_text().set_line_wrap(true);
        this._tooltip.get_clutter_text().set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        this._tooltip.get_clutter_text().ellipsize = Pango.EllipsizeMode.NONE; // Just in case

        aActor.connect("destroy", () => this.destroy());
    },

    destroy: function() {
        Tooltips.Tooltip.prototype.destroy.call(this);
    }
};

function CheckButton() {
    this._init.apply(this, arguments);
}

CheckButton.prototype = {
    _init: function(aDaltonizer, aCheckPropertyValue) {
        this.daltonizer = aDaltonizer;
        this.text = DaltonizerWizardLabels[aCheckPropertyValue];
        this.checkPropertyValue = aCheckPropertyValue;
        this.checkPropertyName = null;
        this.actor = new St.Button({
            style_class: "cba-check-button",
            label: this.text,
            reactive: true,
            can_focus: true,
            track_hover: true
        });

        this.actor.add_style_class_name("modal-dialog-button");
        this.actor.connect("button-press-event", () => this._onButtonPress());
        this.tooltip = new CustomTooltip(this.actor, DaltonizerWizardTooltips[aCheckPropertyValue]);
    },

    updateCheckedState: function(aActor, aCheckProp) {
        this.actor.change_style_pseudo_class(
            "checked",
            aCheckProp === this.checkPropertyValue
        );
    },

    _onButtonPress: function() {
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

function CheckGroup() {
    this._init.apply(this, arguments);
}

CheckGroup.prototype = {
    _init: function(aDaltonizer, aCheckPropertyName) {
        this.actors = [];
        this.daltonizer = aDaltonizer;
        this.checkPropertyName = aCheckPropertyName;
    },

    registerActor: function(aActor) {
        aActor.connect("checked-state-changed",
            (aActor) => this.updateCheckedState(aActor));
        aActor.checkPropertyName = this.checkPropertyName;
        this.actors.push(aActor);
    },

    updateCheckedState: function() {
        let i = this.actors.length;
        while (i--) {
            this.actors[i].updateCheckedState(
                null,
                this.daltonizer.getEffectIdDef()[this.checkPropertyName]
            );
        }
    }
};

function DaltonizerTitleBox() {
    this._init.apply(this, arguments);
}

DaltonizerTitleBox.prototype = {
    _init: function(aDaltonizer, aTitleText) {
        this.daltonizer = aDaltonizer;

        this.actor = new St.BoxLayout({
            style_class: "cba-title-box"
        });
        this._titleText = aTitleText;

        this._label = new St.Label({
            style_class: "cba-title-box-label",
            text: this._titleText
        });

        this._iconBin = new St.Bin({
            style_class: "cba-title-box-app-icon",
            x_fill: false,
            y_fill: false
        });

        let _closeIcon = new St.Icon({
            icon_name: "window-close",
            icon_size: 24,
            icon_type: St.IconType.SYMBOLIC,
            style_class: "cba-title-box-close-icon"
        });
        this._closeButton = new St.Button({
            style_class: "cba-title-box-close-button",
            child: _closeIcon
        });

        this._closeButton.connect("button-release-event",
            () => this._onCloseButtonClicked());

        this.actor.add(this._iconBin);
        this.actor.add(this._label, {
            x_fill: true,
            expand: true
        });
        this.actor.add(this._closeButton, {
            x_fill: false,
            expand: false
        });
    },

    set_title: function(aTitle) {
        this._titleText = aTitle;
        this._label.text = this._titleText;
    },

    set_app: function(aApp, aTitle) {
        this._titleText = aApp.get_name() + " - " + aTitle;
        this._label.text = this._titleText;
        this._icon = aApp.create_icon_texture(24);

        this._iconBin.set_size(24, 24);
        this._iconBin.child = this._icon;
    },

    _onCloseButtonClicked: function() {
        this.daltonizer.toggleUI();
    }
};

function DaltonizerWizard() {
    this._init.apply(this, arguments);
}

DaltonizerWizard.prototype = {
    /* NOTE: The order of _effects is important so they are "symmetrically"
     * displayed in the wizard.
     */
    _effects: [
        "none",
        "acromatopsia_rod_simulation",
        "acromatopsia_blue_cone_simulation",
        "deuteranopia_compensation",
        "protanopia_compensation",
        "tritanopia_compensation",
        "deuteranopia_simulation",
        "protanopia_simulation",
        "tritanopia_simulation"
    ],

    _actors: [
        "focused_window",
        "screen"
    ],

    _colorSpaces: [
        "srgb",
        "cie"
    ],

    _init: function(aDaltonizer, aTitle) {
        this.keybinding_name = XletMeta.uuid + "-close-daltonizer-keybinding";
        this.daltonizer = aDaltonizer;
        this.title = aTitle;
        this.x = 0;
        this.y = 0;
        this.interceptHide = false;

        this.actor = new St.BoxLayout({
            name: "Daltonizer",
            style_class: "cba-box",
            vertical: true,
            reactive: true,
            can_focus: true,
            track_hover: true
        });
        this.actor.add_style_class_name("modal-dialog");
        this.actor.set_opacity(0);
        this.actor.hide();

        this.normalScaleY = this.actor.scale_y;
        this.normalScaleX = this.actor.scale_x;

        this.titleBox = new DaltonizerTitleBox(this.daltonizer, aTitle);

        let sectionOnj = {
            homogeneous: true,
            style_class: "cba-section",
            can_focus: true,
            track_hover: true,
            reactive: true
        };

        this.effectNamesBox = new St.Table(sectionOnj);
        this.effectNamesBox.add_style_class_name("cba-effect-names");
        this.actorsBox = new St.Table(sectionOnj);
        this.actorsBox.add_style_class_name("cba-actors");
        this.colorSpacesBox = new St.Table(sectionOnj);
        this.colorSpacesBox.add_style_class_name("cba-color-spaces");

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

        this._populateUI();
    },

    _populateUI: function() {
        this.effectsGroup = new CheckGroup(this.daltonizer, "base_name");
        this.actorsGroup = new CheckGroup(this.daltonizer, "actor");
        this.colorSpacesGroup = new CheckGroup(this.daltonizer, "color_space");

        let titleSecColDef = {
            row: 0,
            col: 0,
            col_span: 3,
            x_fill: true,
            y_fill: false
        };

        // Effects names section.
        let titleSecLabel = new St.Label({
            text: _("Effect Name"),
            style_class: "cba-section-title"
        });
        titleSecLabel.add_style_class_name("cba-effect-names");

        this.effectNamesBox.add(titleSecLabel, titleSecColDef);
        let breakPoint = 3;
        let row = 1;
        let col = 0;
        let e = 0,
            iLen = this._effects.length;
        for (; e < iLen; e++) {
            let check = new CheckButton(this.daltonizer, this._effects[e]);

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

        /* NOTE: The following two sections (tables) contain only to elements (columns).
         * So, span the title (the first row in the table) up to two columns.
         */
        titleSecColDef["col_span"] = 2;

        // Actors section.
        titleSecLabel = new St.Label({
            text: _("Actor"),
            style_class: "cba-section-title"
        });
        titleSecLabel.add_style_class_name("cba-actors");

        this.actorsBox.add(titleSecLabel, titleSecColDef);
        let a = 0,
            aLen = this._actors.length;
        for (; a < aLen; a++) {
            let check = new CheckButton(this.daltonizer, this._actors[a]);
            this.actorsBox.add(check.actor, {
                row: 1,
                col: a,
                x_fill: true,
                y_fill: false
            });
            this.actorsGroup.registerActor(check);
        }

        // Color spaces section.
        titleSecLabel = new St.Label({
            text: _("Color Space"),
            style_class: "cba-section-title"
        });
        titleSecLabel.add_style_class_name("cba-color-spaces");

        this.colorSpacesBox.add(titleSecLabel, titleSecColDef);
        let c = 0,
            cLen = this._colorSpaces.length;
        for (; c < cLen; c++) {
            let check = new CheckButton(this.daltonizer, this._colorSpaces[c]);
            this.colorSpacesBox.add(check.actor, {
                row: 1,
                col: c,
                x_fill: true,
                y_fill: false
            });
            this.colorSpacesGroup.registerActor(check);
        }
    },

    set_position: function(x, y) {
        this.x = x;
        this.y = y;
        this.actor.set_position(x, y);
    },

    show: function() {
        this.interceptHide = true;

        /* FIXME: I'm using the same trick used by the Cinnamon gTile extension.
         * See if I can implement it properly without messing with keyboard focus.
         * As it is now, the keybinding is added when the wizard is shown and
         * removed when the wizard is hidden. It works perfectly, but I don't
         * think that this is "the right way".
         */
        Main.keybindingManager.addHotKey(
            this.keybinding_name,
            "Escape",
            () => this.daltonizer.hideUI()
        );

        this.updateCheckedState();

        this.actor.raise_top();
        Main.layoutManager.removeChrome(this.actor);
        Main.layoutManager.addChrome(this.actor);
        this.actor.scale_y = 0;
        this.actor.scale_x = 0;
        this.actor.set_pivot_point(0.5, 0.5);

        Tweener.addTween(this.actor, {
            time: this.daltonizer.animationTime === 0 ? 0.01 : this.daltonizer.animationTime,
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
        Main.keybindingManager.removeHotKey(this.keybinding_name);

        if (this.daltonizer.animationTime === 0) {
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
    },

    updateCheckedState: function() {
        this.effectsGroup.updateCheckedState();
        this.actorsGroup.updateCheckedState();
        this.colorSpacesGroup.updateCheckedState();
    },

    _onHideComplete: function() {
        if (!this.interceptHide && this.actor) {
            Main.layoutManager.removeChrome(this.actor);
        }

        Main.layoutManager._chrome.updateRegions();
    },

    destroy: function() {
        this.titleBox.actor.destroy();
        this.effectNamesBox.destroy();
        this.actorsBox.destroy();
        this.colorSpacesBox.destroy();
        this.actor.destroy();
        this.title = null;
    }
};

function WindowTracker() {
    this._init.apply(this, arguments);
}

WindowTracker.prototype = {
    _init: function(aDaltonizer) {
        this.sigMan = new SignalManager.SignalManager(null);
        this.daltonizer = aDaltonizer;
        this.focusMetaWindow = null;
        this.forceScreen = false;
        this._tracker = Cinnamon.WindowTracker.get_default();
        this._onFocusId = 0;
        this.sigMan.connect(this._tracker, "notify::focus-app", this._onFocus.bind(this));
    },

    destroy: function() {
        this.sigMan.disconnectAllSignals();
    },

    _onFocus: function() {
        if (!this.daltonizer.daltonizerActive) {
            return;
        }

        /* NOTE: Some signals (possibly "notify::focus-app" or "notify::title"; who the hell knows)
         * force the trigger of _onFocus a million times per second! ¬¬
         * Put a stop to it!!!
         * 200 milliseconds is fast enough to for the changes to the wizard to seem instant
         * and slow enough to avoid triggering the function from different signals at
         * the same time.
         */
        if (this._onFocusId > 0) {
            Mainloop.source_remove(this._onFocusId);
            this._onFocusId = 0;
        }

        this._onFocusId = Mainloop.timeout_add(200, () => {
            this.resetFocusMetaWindow();
            let window = this.focusMetaWindow = (this.forceScreen ? null : this.getFocusApp());
            let winType = window ? window.get_window_type() : 1;
            let actor;
            let actorRepr;

            if (window && winType !== 1) {
                this.sigMan.connect(window, "notify::title", this._onFocus.bind(this));

                actor = window.get_compositor_private();

                if (actor) {
                    this.sigMan.connect(
                        actor,
                        "size-changed",
                        this.daltonizer.moveUI.bind(this.daltonizer)
                    );
                    this.sigMan.connect(
                        actor,
                        "position-changed",
                        this.daltonizer.moveUI.bind(this.daltonizer)
                    );
                }

                let app = this._tracker.get_window_app(window);
                let title = window.get_title();

                if (app) {
                    this.daltonizer.wizard.titleBox.set_app(app, title);
                } else {
                    this.daltonizer.wizard.titleBox.set_title(title);
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
                this.daltonizer.setEffectIdDef(actor[EFFECT_PROP_NAME]);
            } else {
                this.daltonizer.setEffectIdDef(null);
            }

            this.daltonizer.moveUI();
            this.daltonizer.setEffectIdDefProperty("actor", actorRepr);
            this.daltonizer.wizard.updateCheckedState();
            this._onFocusId = 0;
        });
    },

    resetFocusMetaWindow: function() {
        this.sigMan.disconnect("notify::title");
        this.sigMan.disconnect("size-changed");
        this.sigMan.disconnect("position-changed");
        this.focusMetaWindow = null;
    },

    getFocusApp: function() {
        return global.display.focus_window;
    },

    getCurrentMonitor: function() {
        return Main.layoutManager.currentMonitor;
    }
};

function Daltonizer() {
    this._init.apply(this, arguments);
}

Daltonizer.prototype = {
    _init: function(aToggleEffectCallback, aAnimationTime, aShowActorsBox, aShowColorspacesBox) {
        this._effectIdDef = this.defaultEffectIdDef;
        this.toggleEffectCallback = aToggleEffectCallback;
        this.animationTime = aAnimationTime;
        this.showActorsBox = aShowActorsBox;
        this.showColorspacesBox = aShowColorspacesBox;
        this.daltonizerActive = false;
        this.wizard = new DaltonizerWizard(this, _("Daltonizer"));
        this.winTracker = new WindowTracker(this);
    },

    toggleEffect: function() {
        let effectIdDef = this.getEffectIdDef();
        this.toggleEffectCallback({
            base_name: effectIdDef.base_name,
            actor: effectIdDef.actor,
            color_space: effectIdDef.color_space,
            keybinding: "",
            id: "%s:%s:%s".format(effectIdDef.base_name, effectIdDef.actor, effectIdDef.color_space)
        });
    },

    initUI: function() {
        Main.layoutManager.addChrome(this.wizard.actor, {
            visibleInFullscreen: true
        });
    },

    destroyUI: function() {
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
    },

    _calcFinalPosition: function(aPosX, aPosY) {
        return [
            Math.floor(aPosX - this.wizard.actor.width / 2),
            Math.floor(aPosY - this.wizard.actor.height / 2)
        ];

    },

    moveUI: function() {
        if (!this.daltonizerActive) {
            return;
        }

        let window = this.winTracker.focusMetaWindow;
        let currentMonitor = this.winTracker.getCurrentMonitor();
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

        Tweener.addTween(this.wizard.actor, {
            time: this.animationTime === 0 ? 0.01 : this.animationTime,
            x: pos_x,
            y: pos_y,
            transition: "easeOutQuad",
            onComplete: Main.layoutManager._chrome.updateRegions,
            onCompleteScope: Main.layoutManager._chrome
        });
    },

    showUI: function() {
        let window = this.winTracker.focusMetaWindow = this.winTracker.getFocusApp();
        let currentMonitor = this.winTracker.getCurrentMonitor();
        /* NOTE: winType 1 = Desktop
         */
        let winType = window ? window.get_window_type() : 1;
        let pos_x = currentMonitor.x + currentMonitor.width / 2;
        let pos_y = currentMonitor.y + currentMonitor.height / 2;
        let actor;
        let actorRepr;

        if (window && winType !== 1) {
            let layer = window.get_layer();

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
            this.setEffectIdDef(actor[EFFECT_PROP_NAME]);
        } else {
            this.setEffectIdDef(null);
        }

        [pos_x, pos_y] = this._calcFinalPosition(pos_x, pos_y);

        this.wizard.set_position(pos_x, pos_y);

        this.setEffectIdDefProperty("actor", actorRepr);

        /* NOTE: It's easier to just set their visibility than to selectively
         * create/destroy them.
         */
        this.wizard.actorsBox[this.showActorsBox ? "show" : "hide"]();
        this.wizard.colorSpacesBox[this.showColorspacesBox ? "show" : "hide"]();

        this.wizard.show();
        this.daltonizerActive = true;
        this.winTracker._onFocus();

        this.moveUI();
    },

    hideUI: function() {
        this.wizard.hide(false);
        this.winTracker.resetFocusMetaWindow();
        this.daltonizerActive = false;
        Main.layoutManager._chrome.updateRegions();
    },

    toggleUI: function() {
        if (this.daltonizerActive) {
            this.hideUI();
        } else {
            this.showUI();
        }
    },

    getEffectIdDef: function() {
        return this._effectIdDef;
    },

    setEffectIdDef: function(aEffectProperty = null) {
        if (aEffectProperty === null) {
            this._effectIdDef = this.defaultEffectIdDef;
        } else {
            let [base_name, actor, color_space] = aEffectProperty.split(":");
            this._effectIdDef["base_name"] = base_name;
            this._effectIdDef["actor"] = actor;
            this._effectIdDef["color_space"] = color_space;
        }
    },

    setEffectIdDefProperty: function(aProperty, aValue) {
        this._effectIdDef[aProperty] = aValue;
    },

    get defaultEffectIdDef() {
        return {
            base_name: "none",
            actor: "focused_window",
            color_space: "srgb"
        };
    },
};
