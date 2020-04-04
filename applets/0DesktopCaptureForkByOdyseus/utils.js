// {{IMPORTER}}

let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta["{{UUID}}"];
}

const GlobalConstants = __import("globalConstants.js");
const GlobalUtils = __import("globalUtils.js");
const Constants = __import("constants.js");
const DebugManager = __import("debugManager.js");
const CustomTooltips = __import("customTooltips.js");

const {
    gi: {
        Cinnamon,
        Clutter,
        Gio,
        GLib,
        Meta,
        St
    },
    mainloop: Mainloop,
    misc: {
        params: Params,
        util: Util
    },
    ui: {
        flashspot: Flashspot,
        main: Main,
        popupMenu: PopupMenu,
        tweener: Tweener
    }
} = imports;

const {
    UNICODE_SYMBOLS
} = GlobalConstants;

const {
    _,
    getKeybindingDisplayName,
    tokensReplacer,
    copyToClipboard
} = GlobalUtils;

const {
    IntelligentTooltip
} = CustomTooltips;

const {
    SOUND_ID,
    SelectionType,
    BORDER_NAMES,
    HANDLE_NAMES,
    HANDLE_SIZE,
    SelectionTypeStr
} = Constants;

const {
    LoggingLevel
} = DebugManager;

var Debugger = new DebugManager.DebugManager();

function runtimeInfo(aMsg) {
    Debugger.logging_level !== LoggingLevel.NORMAL && aMsg &&
        global.log("[DesktopCapture] " + aMsg);
}

function runtimeError(aMsg) {
    aMsg && global.logError("[DesktopCapture] " + aMsg);
}

function CustomPopupMenuSection() {
    this._init.apply(this, arguments);
}

CustomPopupMenuSection.prototype = {
    __proto__: PopupMenu.PopupMenuSection.prototype,

    _init: function() {
        PopupMenu.PopupMenuSection.prototype._init.call(this);
    },

    addAction: function(aTitle, aCallback, aDetailText, aCustomClass) {
        let menuItem = PopupMenu.PopupMenuSection.prototype.addAction.call(this, aTitle, aCallback);

        return extendMenuItem(menuItem, aDetailText, aCustomClass);
    }
};

function extendMenuItem(aMenuItem, aDetailText, aCustomclass) {
    aCustomclass && aMenuItem.actor.add_style_class_name(aCustomclass);

    if (aDetailText) {
        let bin = new St.Bin({
            x_align: St.Align.END
        });
        let label = new St.Label();
        let keybinding = aDetailText;

        if (keybinding.indexOf("::") !== -1) {
            let parts = keybinding.split("::");

            if (parts[1].length !== 0) {
                keybinding = parts.map((aKB) => {
                    return getKeybindingDisplayName(aKB);
                }).join("|");
            } else {
                keybinding = getKeybindingDisplayName(parts[0]);
            }
        }

        label.set_text(keybinding);
        bin.add_actor(label);
        aMenuItem.addActor(bin, {
            expand: true,
            span: -1,
            align: St.Align.END
        });
    }

    return aMenuItem;
}

/**
 * [CustomSwitchMenuItem description]
 *
 * A modified PopupSwitchMenuItem item that allows to press Space bar
 * to toggle the switch without closing the menu that contains it.
 */
function CustomSwitchMenuItem() {
    this._init.apply(this, arguments);
}

CustomSwitchMenuItem.prototype = {
    __proto__: PopupMenu.PopupSwitchMenuItem.prototype,

    activate: function(event) {
        if (this._switch.actor.mapped) {
            this.toggle();
        }

        // Allow pressing space to toggle the switch without closing the menu
        if (event.type() === Clutter.EventType.KEY_PRESS &&
            event.get_key_symbol() === Clutter.KEY_space) {
            return;
        }
    }
};

function RadioSelectorMenuItem() {
    this._init.apply(this, arguments);
}

RadioSelectorMenuItem.prototype = {
    __proto__: PopupMenu.PopupIndicatorMenuItem.prototype,

    _init: function(aSubMenu, aParams) {
        let params = Params.parse(aParams, {
            item_label: "",
            item_tooltip: "",
            item_value: "",
            pref_key: false,
            extra_params: {}
        });
        PopupMenu.PopupIndicatorMenuItem.prototype._init.call(this, params.item_label);
        this._subMenu = aSubMenu;
        this._applet = aSubMenu._applet;
        this._value = params.item_value;
        this._prefKey = params.pref_key;
        this._extraParams = params.extra_params;
        this.setOrnament(2); // 2 = OrnamentType.DOT

        if (params.item_tooltip) {
            this.tooltip = new IntelligentTooltip(
                this.actor,
                _(params.item_tooltip)
            );
        }

        this._handler_id = this.connect("activate",
            (aActor, aEvent) => this._doActivate(aActor, aEvent));

        this._ornament.child._delegate.setToggleState(this._applet[this._prefKey] === this._value);
    },

    destroy: function() {
        this.disconnect(this._handler_id);
        PopupMenu.PopupIndicatorMenuItem.prototype.destroy.call(this);
    },

    _doActivate: function(aActor, aEvent) { // jshint ignore:line
        this._applet[this._prefKey] = this._value;
        this._subMenu.setCheckedState();
    }
};

function RadioSelectorSubMenuItem() {
    this._init.apply(this, arguments);
}

RadioSelectorSubMenuItem.prototype = {
    __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,

    _init: function(aApplet, aParams) {
        this._applet = aApplet;

        let params = Params.parse(aParams, {
            skip_auto_close: false,
            item_label: "",
            pref_key: false,
            icon_name: null,
            icon_type: St.IconType.SYMBOLIC,
            item_style_class: null,
            extra_params: {}
        });

        this._device = params.device_name;
        this._prefKey = params.pref_key;
        this._extraParams = params.extra_params;

        PopupMenu.PopupBaseMenuItem.prototype._init.call(this);

        this._triangle = null;

        this.actor.add_style_class_name("popup-submenu-menu-item");

        if (params.icon_name) {
            this._icon = new St.Icon({
                style_class: "popup-menu-icon",
                icon_name: params.icon_name,
                icon_type: params.icon_type
            });
            this.addActor(this._icon, {
                span: 0
            });
        }

        this.label = new St.Label({
            text: params.item_label,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });
        this.addActor(this.label);
        this.actor.label_actor = this.label;
        params.item_style_class &&
            this.label.add_style_class_name(params.item_style_class);

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

        this.menu = new PopupMenu.PopupSubMenu(this.actor, this._triangle);

        if (params.skip_auto_close) {
            this._skip_auto_close = true;
        }

        this.menu.connect("open-state-changed",
            (aMenu, aOpen) => {
                this._subMenuOpenStateChanged(aMenu, aOpen);
                onSubMenuOpenStateChanged(aMenu, aOpen);
            });
    },

    setLabel: function(aLabel) {
        this.label.clutter_text.set_text(aLabel);
    },

    _populateMenu: function() {
        throw "Should be overridden.";
    },

    setCheckedState: function() {
        let children = this.menu._getMenuItems();

        for (let i = children.length - 1; i >= 0; i--) {
            let item = children[i];
            if (item instanceof RadioSelectorMenuItem) { // Just in case
                item._ornament.child._delegate.setToggleState(
                    this._applet[this._prefKey] === item._value);
            }
        }
    }
};

function ProgramSelectorSubMenuItem() {
    this._init.apply(this, arguments);
}

ProgramSelectorSubMenuItem.prototype = {
    __proto__: RadioSelectorSubMenuItem.prototype,

    _init: function(aApplet, aParams) {
        RadioSelectorSubMenuItem.prototype._init.call(this, aApplet, aParams);

        this._populateMenu();
    },

    _populateMenu: function() {
        this.label.grab_key_focus();
        this.menu.removeAll();

        let programs = this._extraParams.device_programs;

        for (let p in programs) {
            this.menu.addMenuItem(new ProgramSelectorMenuItem(
                this, {
                    item_label: programs[p].title,
                    item_value: p,
                    pref_key: this._prefKey,
                    extra_params: {
                        device: this._extraParams.device
                    }
                }
            ));
        }
    }
};

function ProgramSelectorMenuItem() {
    this._init.apply(this, arguments);
}

ProgramSelectorMenuItem.prototype = {
    __proto__: RadioSelectorMenuItem.prototype,

    _init: function(aSubMenu, aParams) {
        RadioSelectorMenuItem.prototype._init.call(this, aSubMenu, aParams);
    },

    _doActivate: function(aActor, aEvent) {
        RadioSelectorMenuItem.prototype._doActivate.call(this, aActor, aEvent);
        this._applet._rebuildDeviceSection(this._extraParams.device);
        return true; // Avoid closing the sub menu.
    }
};

function CinnamonRecorderProfileSelector() {
    this._init.apply(this, arguments);
}

CinnamonRecorderProfileSelector.prototype = {
    __proto__: RadioSelectorSubMenuItem.prototype,

    _init: function(aApplet, aParams) {
        RadioSelectorSubMenuItem.prototype._init.call(this, aApplet, aParams);

        this._populateMenu();
    },

    _populateMenu: function() {
        this.label.grab_key_focus();
        this.menu.removeAll();

        let profiles = this._applet.cinnamonRecorderProfiles;
        for (let p in profiles) {
            this.menu.addMenuItem(new CinnamonRecorderProfileItem(
                this, {
                    item_label: profiles[p].title,
                    item_tooltip: profiles[p].description,
                    item_value: p,
                    pref_key: this._prefKey
                }
            ));
        }
    }
};

function CinnamonRecorderProfileItem() {
    this._init.apply(this, arguments);
}

CinnamonRecorderProfileItem.prototype = {
    __proto__: RadioSelectorMenuItem.prototype,

    _init: function(aSubMenu, aParams) {
        RadioSelectorMenuItem.prototype._init.call(this, aSubMenu, aParams);
    },

    _doActivate: function(aActor, aEvent) {
        RadioSelectorMenuItem.prototype._doActivate.call(this, aActor, aEvent);

        this._subMenu.setLabel(_("Profile") + ": " +
            this._applet.cinnamonRecorderProfiles[
                this._applet[this._prefKey]
            ]["title"]);

        return true; // Avoid closing the sub menu.
    }
};

/* WOW!!! Simplifying things in one place it sure does complicates things
   exponentially for a lot of other things!! */
function onSubMenuOpenStateChanged(aMenu, aOpen) {
    if (aOpen) {
        let children = aMenu._getTopMenu()._getMenuItems();
        let extraChildren = [];
        let tryToCloseMenus = (aChildren, aHandlingTopMenu) => {
            for (let child of aChildren) {
                if (aHandlingTopMenu &&
                    child instanceof CustomPopupMenuSection) {
                    for (let childItem of child._getMenuItems()) {
                        if (childItem instanceof PopupMenu.PopupSubMenuMenuItem) {
                            extraChildren.push(childItem);
                        }
                    }
                    continue;
                }

                if (child instanceof RadioSelectorSubMenuItem ||
                    child instanceof PopupMenu.PopupSubMenuMenuItem) {
                    if (aMenu !== child.menu) {
                        child.hasOwnProperty("_skip_auto_close") ||
                            child.menu.close(true);
                    }
                }
            }
        };

        try {
            tryToCloseMenus(children, true);
        } finally {
            tryToCloseMenus(extraChildren, false);
        }
    }
}

/*
A custom PopupSliderMenuItem element whose value is changed by a step of 1.
*/
function CustomPopupSliderMenuItem() {
    this._init.apply(this, arguments);
}

CustomPopupSliderMenuItem.prototype = {
    __proto__: PopupMenu.PopupSliderMenuItem.prototype,

    _init: function(aApplet, aParams) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            activate: false
        });

        let params = Params.parse(aParams, {
            slider_value: 0,
            item_value: "",
            pref_key: false,
            header: null,
            info_label_cb: null,
            slider_value_min: 0,
            slider_value_max: 0
        });

        // Avoid spreading NaNs around
        if (isNaN(params.slider_value)) {
            throw TypeError("The slider value must be a number.");
        }

        this._applet = aApplet;
        this._prefKey = params.pref_key;
        this._header = params.header;
        this._infoLabelCallback = params.info_label_cb;
        this._minVal = params.slider_value_min;
        this._maxVal = params.slider_value_max;

        this.actor.connect("key-press-event",
            (aActor, aEvent) => this._onKeyPressEvent(aActor, aEvent));

        this._value = Math.max(Math.min(params.slider_value, 1), 0);

        this._slider = new St.DrawingArea({
            style_class: "popup-slider-menu-item",
            reactive: true
        });
        this.addActor(this._slider, {
            span: -1,
            expand: true
        });
        this._slider.connect("repaint",
            (aArea) => this._sliderRepaint(aArea));
        this.actor.connect("button-press-event",
            (aActor, aEvent) => this._startDragging(aActor, aEvent));
        this.actor.connect("scroll-event",
            (aActor, aEvent) => this._onScrollEvent(aActor, aEvent));

        this.connect("drag-begin",
            () => this._syncHeader());
        this.connect("drag-end",
            (aSlider, aVal) => aSlider.emit("value-changed", aVal));
        this.connect("value-changed",
            (aSlider, aValue) => {
                let value = Math.max(0, Math.min(1, parseFloat(aValue)));

                let newValue = parseInt(Math.floor(value * this._maxVal), 10);

                // Prevent Nan values. Otherwise, Cinnamons settings system
                // screws up because it moght try to set the save function
                // to null/undefined. ¬¬
                if (!isNaN(newValue)) {
                    // This doesn't trigger the callback!!!!!
                    this._applet[this._prefKey] = newValue;
                }

                this._syncHeader();
            }
        );

        this._releaseId = this._motionId = 0;
        this._dragging = false;
    },

    _syncHeader: function() {
        let children = this._header.actor.get_children();
        let label = children[children.length - 1].get_children()[0];

        if (this._applet[this._prefKey] <= 0) {
            label.set_text(_("Off"));
        } else if (this._applet[this._prefKey] >= 1) {
            label.set_text(this._applet[this._prefKey] +
                " " + this._infoLabelCallback());
        }
    },

    _onScrollEvent: function(aActor, aEvent) {
        let direction = aEvent.get_scroll_direction();
        let scale = 1 / this._maxVal;

        if (direction === Clutter.ScrollDirection.DOWN) {
            this._value = Math.max(0, this._value - scale);
        } else if (direction === Clutter.ScrollDirection.UP) {
            this._value = Math.min(1, this._value + scale);
        }

        this._slider.queue_repaint();
        this.emit("value-changed", this._value);
    },

    _onKeyPressEvent: function(aActor, aEvent) {
        let key = aEvent.get_key_symbol();
        let scale = 1 / this._maxVal;

        if (key === Clutter.KEY_Right || key === Clutter.KEY_Left) {
            let delta = key === Clutter.KEY_Right ? scale : -scale;
            this._value = Math.max(0, Math.min(this._value + delta, 1));
            this._slider.queue_repaint();
            this.emit("value-changed", this._value);
            this.emit("drag-end");
            return true;
        }
        return false;
    }
};

function ScreenshotHelper() {
    this._init.apply(this, arguments);
}

ScreenshotHelper.prototype = {
    _init: function(selectionType, callback, params) {
        this._capturedEventId = null;
        this._selectionType = selectionType;
        this._callback = callback;
        this._modifiers = {};
        this._timeout = 0;
        this._interactive = false;
        this._initX = 0;
        this._initY = 0;
        this._params = Params.parse(params, {
            filename: "",
            useFlash: true,
            includeFrame: true,
            includeCursor: true,
            includeStyles: true,
            windowAsArea: false,
            playShutterSound: true,
            useTimer: true,
            showTimer: true,
            playTimerSound: true,
            timerDuration: 3,
            timerSound: "dialog-warning",
            shutterSound: "camera-shutter",
            uploadToImgur: false,
            monitorIndex: null,
            selectionHelper: false
        });

        runtimeInfo("Initializing screenshot tool");

        if (selectionType !== null) {
            this.runCaptureMode(selectionType);
        }
    },

    playSound: function(effect) {
        global.cancel_sound(SOUND_ID);
        global.play_theme_sound(SOUND_ID, effect);
    },

    runCaptureMode: function(mode) {
        this._selectionType = mode;

        if (mode === SelectionType.WINDOW) {
            this.selectWindow();
        } else if (mode === SelectionType.AREA) {
            this.selectArea();
        } else if (mode === SelectionType.CINNAMON) {
            this.selectCinnamon();
        } else if (mode === SelectionType.SCREEN) {
            this.selectScreen();
        } else if (mode === SelectionType.MONITOR) {
            this.selectMonitor();
        }
    },

    getModifier: function(symbol) {
        return this._modifiers[symbol] || false;
    },

    setModifier: function(symbol, value) {
        this._modifiers[symbol] = value;
    },

    captureTimer: function(options, onFinished, onInterval) {
        let timeoutId;

        if (options.useTimer && options.timerDuration > 0) {
            if (!options.showTimer) {
                timeoutId = Mainloop.timeout_add(options.timerDuration * 1000, () => {
                    Mainloop.source_remove(timeoutId);
                    onFinished();
                    return false;
                });
            } else {
                this._setTimer(options.timerDuration);
                this._fadeOutTimer();

                if (options.playTimerSound) {
                    this.playSound(options.timerSound);
                }

                timeoutId = Mainloop.timeout_add(1000, () => {
                    this._timeout--;

                    if (onInterval && typeof onInterval === "function") {
                        onInterval();
                    }

                    if (this._timeout > 0) {
                        this._timer.set_text("" + this._timeout);

                        if (options.playTimerSound) {
                            this.playSound(options.timerSound);
                        }

                        this._fadeOutTimer();
                    } else {
                        Mainloop.source_remove(timeoutId);
                        onFinished();
                        return false;
                    }

                    return true;
                });
            }
        } else {
            onFinished();
        }
    },

    _setTimer: function(timeout) {
        if (timeout === 0) {
            if (this._timer) {
                Main.uiGroup.remove_actor(this._timer);
                this._timer.destroy();
                this._timer = null;
            }
        } else {
            if (!this._timer) {
                this._timer = new St.Label({
                    style_class: "desktop-capture-capture-countdown-timer"
                });

                Main.uiGroup.add_actor(this._timer);

                let monitor;

                if (typeof(this._params.monitorIndex) === "number") {
                    monitor = Main.layoutManager.monitors[this._params.monitorIndex];
                } else {
                    monitor = Main.layoutManager.primaryMonitor;
                }

                this._timer.set_position(
                    (monitor.width / 2 + monitor.x),
                    (monitor.height / 2 + monitor.y)
                );

                this._timer.set_anchor_point_from_gravity(Clutter.Gravity.CENTER);
            }

            this._timer.set_text("" + timeout);
        }

        this._timeout = timeout;
    },

    _fadeOutTimer: function() {
        this._timer.opacity = 255;
        this._timer.scale_x = 1.0;
        this._timer.scale_y = 1.0;

        Tweener.addTween(this._timer, {
            opacity: 0,
            scale_x: 2.5,
            scale_y: 2.5,
            delay: 0.200,
            time: 0.700,
            transition: "linear"
        });
    },

    flash: function(x, y, width, height) {
        let flashspot = new Flashspot.Flashspot({
            x: x,
            y: y,
            width: width,
            height: height
        });
        global.f = flashspot;
        flashspot.fire();
    },

    selectScreen: function() {
        this.captureTimer(this._params, () => this.screenshotScreen());
    },

    selectMonitor: function() {
        this.captureTimer(this._params, () => this.screenshotMonitor());
    },

    selectCinnamon: function() {
        this._modal = true;
        this._target = null;
        this._pointerTarget = null;
        this._borderPaintTarget = null;
        this._borderPaintId = null;
        this._screenWidth = global.screen_width;
        this._screenHeight = global.screen_height;

        this.container = new Cinnamon.GenericContainer({
            name: "frame-container",
            reactive: false,
            visible: true,
            x: 0,
            y: 0
        });

        Main.uiGroup.add_actor(this.container);

        if (!Main.pushModal(this.container)) {
            return;
        }

        this.initializeShadow();

        this.showInstructions("ui");
        this._capturedEventId = global.stage.connect("captured-event",
            (aActor, aEvent) => this._onCapturedEvent(aActor, aEvent));
    },

    _updateCinnamon: function(event) {
        let [stageX, stageY] = event.get_coords();
        let target = global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE,
            stageX,
            stageY);

        if (this.instructionsShowing()) {
            this.maybeHideInstructions();
        }

        if (target !== this._pointerTarget) {
            this._target = target;
        }

        this._pointerTarget = target;

        if (this._borderPaintTarget !== this._target) {
            if (this.uiContainer) {
                this.clearActorOutline();
            }

            this.showActorOutline(this._target);
        }
    },

    _onDestroy: function() {
        this.reset();
    },

    selectArea: function() {
        this._modal = true;
        this._mouseDown = false;
        this._isMoving = false;
        this._isResizing = false;
        this._resizeActor = null;
        this._timeout = 0;
        this._xStart = -1;
        this._yStart = -1;
        this._xEnd = -1;
        this._yEnd = -1;
        this._selectionMade = false;
        this._screenWidth = global.screen_width;
        this._screenHeight = global.screen_height;

        this.container = new St.Group({
            reactive: true,
            style_class: "desktop-capture-capture-area-selection",
            x_align: St.Align.START,
            y_align: St.Align.START
        });

        Main.uiGroup.add_actor(this.container);

        if (!Main.pushModal(this.container)) {
            return;
        }

        this.border1 = new St.Bin({
            style_class: "desktop-capture-border-h",
            x_fill: true,
            y_fill: false,
            y_align: St.Align.START
        });
        this.border2 = new St.Bin({
            style_class: "desktop-capture-border-h",
            x_fill: true,
            y_fill: false,
            y_align: St.Align.END
        });
        this.border3 = new St.Bin({
            style_class: "desktop-capture-border-v",
            x_fill: false,
            y_fill: true,
            x_align: St.Align.START,
            y_align: St.Align.START
        });
        this.border4 = new St.Bin({
            style_class: "desktop-capture-border-v",
            x_fill: false,
            y_fill: true,
            x_align: St.Align.END,
            y_align: St.Align.START
        });

        this.container.add_actor(this.border1);
        this.container.add_actor(this.border2);
        this.container.add_actor(this.border3);
        this.container.add_actor(this.border4);

        for (let handleName of HANDLE_NAMES) {
            this[handleName] = new St.Bin({
                style_class: "desktop-capture-handle",
                name: handleName,
                reactive: true
            });
            this[handleName]["is_handle"] = true;
            this[handleName].set_opacity(255);
            this.container.add_actor(this[handleName]);
        }

        this.initializeShadow();
        this.drawShadows(0, 0, 0, 0);

        this.showInstructions("area");

        this._capturedEventId = global.stage.connect("captured-event",
            (aActor, aEvent) => this._onCapturedEvent(aActor, aEvent));
    },

    instructionsShowing: function() {
        return this.instructionsContainer && this.instructionsContainer !== null;
    },

    maybeHideInstructions: function() {
        if (this._selectionType === SelectionType.CINNAMON) {
            let [x, y, mask] = global.get_pointer(); // jshint ignore:line

            if (Math.abs(x - this._initX) > 200 || Math.abs(y - this._initY) > 200) {
                this.hideInstructions();
            }
        }
    },

    hideInstructions: function() {
        if (this.instructionsShowing()) {
            Main.uiGroup.remove_actor(this.instructionsContainer);
            this.instructionsContainer.destroy();
            this.instructionsContainer = null;
            return true;
        } else {
            return false;
        }
    },

    showInstructions: function(cssExtra) {
        let [x, y, mask] = global.get_pointer(); // jshint ignore:line
        this._initX = x;
        this._initY = y;

        this.instructionsContainer = new St.Group({
            reactive: false,
            style_class: "desktop-capture-instructions-container" + " " + cssExtra
        });

        Main.uiGroup.add_actor(this.instructionsContainer);

        let monitor = Main.layoutManager.primaryMonitor;
        let [startX, startY] = [monitor.x + 50, monitor.height / 2 + monitor.y + 50];

        let labelWidth = monitor.width - 100;

        this.instructionsContainer.set_size(monitor.width, monitor.height);
        this.instructionsContainer.set_position(monitor.x, monitor.y);

        function instructionHeader(container, labelText) {
            let label = new St.Label({
                text: labelText,
                style_class: "desktop-capture-instructions-label-header"
            });
            container.add_actor(label);
            label.set_position(startX, startY);
            label.set_size(labelWidth, 40);
            return true;
        }

        let subCount = 0;

        function instructionSub(container, labelText) {
            subCount++;
            let label = new St.Label({
                text: labelText,
                style_class: "desktop-capture-instructions-label-text"
            });
            container.add_actor(label);
            label.set_position(startX, startY + (subCount * 40));
            label.set_size(labelWidth, 30);
            return true;
        }

        if (this._selectionType === SelectionType.AREA) {
            startY -= 140; // 30*3 + 50 ???
            instructionHeader(this.instructionsContainer,
                _("Select an area by clicking and dragging"));
            instructionSub(this.instructionsContainer,
                _("Use arrow keys to move the selection"));
            instructionSub(this.instructionsContainer,
                _("Use SHIFT and arrow keys to resize the selection"));
            instructionSub(this.instructionsContainer,
                _("Press ENTER to confirm or ESC to cancel"));
        } else if (this._selectionType === SelectionType.CINNAMON) {
            startY -= 140;
            instructionHeader(this.instructionsContainer,
                _("Select a UI element by moving the mouse"));
            instructionSub(this.instructionsContainer,
                _("Use mouse wheel to traverse hierarchy"));
            instructionSub(this.instructionsContainer,
                _("Hold SHIFT to allow clicking UI element"));
            instructionSub(this.instructionsContainer,
                _("Click to complete the capture, or ESC to cancel"));
        }
    },

    initializeShadow: function() {
        this.shadowContainer = new St.Group({
            reactive: false,
            style_class: "desktop-capture-shadow-container"
        });

        Main.uiGroup.add_actor(this.shadowContainer);

        this.coverLeft = new St.Bin({
            style_class: "desktop-capture-cover",
            x_fill: true,
            y_fill: true
        });
        this.coverRight = new St.Bin({
            style_class: "desktop-capture-cover",
            x_fill: true,
            y_fill: true
        });
        this.coverTop = new St.Bin({
            style_class: "desktop-capture-cover",
            x_fill: true,
            y_fill: true
        });
        this.coverBottom = new St.Bin({
            style_class: "desktop-capture-cover",
            x_fill: true,
            y_fill: true
        });

        this.shadowContainer.add_actor(this.coverLeft);
        this.shadowContainer.add_actor(this.coverRight);
        this.shadowContainer.add_actor(this.coverTop);
        this.shadowContainer.add_actor(this.coverBottom);
    },

    selectWindow: function() {
        this._modal = true;
        this._mouseDown = false;
        this._outlineBackground = null;
        this._outlineFrame = null;
        this.bringWindowsToFront = false;

        this.container = new Cinnamon.GenericContainer({
            name: "frame-container",
            reactive: true,
            visible: true,
            x: 0,
            y: 0
        });

        Main.uiGroup.add_actor(this.container);

        if (!Main.pushModal(this.container)) {
            return;
        }

        this._windows = global.get_window_actors();

        global.set_cursor(Cinnamon.Cursor.POINTING_HAND);

        this._capturedEventId = global.stage.connect("captured-event",
            (aActor, aEvent) => this._onCapturedEvent(aActor, aEvent));
    },

    getFilename: function(options) {
        let date = new Date();
        return tokensReplacer(options["filename"], {
            "%Y": date.getFullYear(),
            "%M": String(date.getMonth() + 1).padStart(2, "0"),
            "%D": String(date.getDate()).padStart(2, "0"),
            "%H": String(date.getHours()).padStart(2, "0"),
            "%I": String(date.getMinutes()).padStart(2, "0"),
            "%S": String(date.getSeconds()).padStart(2, "0"),
            "%m": String(date.getMilliseconds()).padStart(2, "0"),
            "%TYPE": this.getSelectionTypeStr(this._selectionType)
        });
    },

    getSelectionTypeStr: function() {
        return SelectionTypeStr[this._selectionType];
    },

    getParams: function(options) {
        if (options) {
            return Params.parse(this._params, options);
        }

        return this._params;
    },

    screenshotScreen: function(options) {
        let opts = this.getParams(options);
        let filename = this.getFilename(opts);
        let screenshot = new Cinnamon.Screenshot();
        screenshot.screenshot(opts.includeCursor, filename,
            () => {
                this.runCallback({
                    file: filename,
                    options: opts
                });
            });

        return true;
    },

    screenshotMonitor: function(options) {
        let opts = this.getParams(options);
        let filename = this.getFilename(opts);

        let monitor;

        if (typeof(this._params.monitorIndex) === "number") {
            monitor = Main.layoutManager.monitors[opts.monitorIndex];
        } else {
            monitor = Main.layoutManager.primaryMonitor;
        }

        let screenshot = new Cinnamon.Screenshot();
        screenshot.screenshot_area(opts.includeCursor,
            monitor.x, monitor.y,
            monitor.width, monitor.height,
            filename,
            () => {
                this.runCallback({
                    x: monitor.x,
                    y: monitor.y,
                    width: monitor.width,
                    height: monitor.height,
                    file: filename,
                    options: opts
                });
            });

        return true;
    },

    screenshotCinnamon: function(actor, stageX, stageY, options) {
        if (actor.get_paint_visibility() === false) {
            runtimeInfo("Actor is not visible. Cancelling screenshot to prevent empty output.");
            this.reset();
            return false;
        }

        // Reset after a short delay so we don't activate the actor we
        // have clicked.
        let timeoutId = Mainloop.timeout_add(200, () => {
            this.reset();
            Mainloop.source_remove(timeoutId);
            return false;
        });

        let opts = this.getParams(options);
        let filename = this.getFilename(opts);

        // If we don't use a short timer here, we end up capturing any
        // CSS styles we're applying to the selection. So use a short timer,
        // and make it into an option.
        let captureTimer = 200;

        if (opts.includeStyles) {
            captureTimer = 0;
        }

        let captureTimeoutId = Mainloop.timeout_add(captureTimer, () => {
            Mainloop.source_remove(captureTimeoutId);

            let [x, y] = actor.get_transformed_position();
            let [width, height] = actor.get_transformed_size();

            let screenshot = new Cinnamon.Screenshot();
            screenshot.screenshot_area(opts.includeCursor, x, y, width, height, filename,
                () => {
                    this.runCallback({
                        stageX: stageX,
                        stageY: stageY,
                        actor: actor,
                        x: x,
                        y: y,
                        width: width,
                        height: height,
                        file: filename,
                        options: opts
                    });
                });
        });

        return true;
    },

    screenshotArea: function(x, y, width, height, options) {
        this.reset();

        let opts = this.getParams(options);
        let filename = this.getFilename(opts);

        if (this._callback && opts.selectionHelper) {
            this._callback({
                x: x,
                y: y,
                width: width,
                height: height,
                file: filename,
                options: opts
            });
            return false;
        }

        let screenshot = new Cinnamon.Screenshot();
        this.captureTimer(opts, () => {
            screenshot.screenshot_area(opts.includeCursor, x, y, width, height, filename,
                () => {
                    this.runCallback({
                        x: x,
                        y: y,
                        width: width,
                        height: height,
                        file: filename,
                        options: opts
                    });
                });
        });

        return true;
    },

    screenshotWindow: function(window, options) {
        if (!window.get_meta_window().has_focus()) {
            let tracker = Cinnamon.WindowTracker.get_default();
            let focusEventId = tracker.connect("notify::focus-app", () => {
                let timeoutId = Mainloop.timeout_add(1, () => {
                    this.screenshotWindow(window, options);
                    Mainloop.source_remove(timeoutId);
                    return false;
                });

                tracker.disconnect(focusEventId);
            });

            Main.activateWindow(window.get_meta_window(), global.get_current_time());

            return true;
        }

        let rect = window.get_meta_window().get_outer_rect();
        let [width, height, x, y] = [rect.width, rect.height, rect.x, rect.y];

        this.reset();

        let opts = this.getParams(options);
        let filename = this.getFilename(opts);

        let screenshot = new Cinnamon.Screenshot();

        if (this._callback && opts.selectionHelper) {
            this._callback({
                window: window,
                x: x,
                y: y,
                width: width,
                height: height,
                file: filename,
                options: opts
            });
            return false;
        }

        this.captureTimer(opts, () => {
            if (opts.windowAsArea) {
                screenshot.screenshot_area(opts.includeCursor, x, y, width, height, filename,
                    () => {
                        this.runCallback({
                            window: window,
                            x: x,
                            y: y,
                            width: width,
                            height: height,
                            file: filename,
                            options: opts
                        });
                    });
            } else {
                screenshot.screenshot_window(opts.includeFrame, opts.includeCursor, filename,
                    () => {
                        this.runCallback({
                            window: window,
                            x: x,
                            y: y,
                            width: width,
                            height: height,
                            file: filename,
                            options: opts
                        });
                    });
            }
        }, () => {
            // Make sure we have the right window focused.
            Main.activateWindow(window.get_meta_window(), global.get_current_time());
        });

        return true;
    },

    runCallback: function(screenshot) {
        screenshot.selectionType = this._selectionType;
        screenshot.selectionTypeVerbose = this.getSelectionTypeStr(this._selectionType);

        let fileCapture = Gio.file_new_for_path(screenshot.file);
        screenshot.outputFilename = fileCapture.get_basename();
        screenshot.outputDirectory = fileCapture.get_parent().get_path();

        if (screenshot.options.useFlash) {
            if (this._selectionType === SelectionType.WINDOW &&
                screenshot.window.get_meta_window().get_window_type() !==
                Meta.WindowType.DESKTOP &&
                screenshot.options.padWindowFlash) {
                let pad = 1;
                this.flash(screenshot.x - pad, screenshot.y - pad, screenshot.width + (2 * pad), screenshot.height + (2 * pad));
            } else if (this._selectionType === SelectionType.SCREEN) {
                this.flash(0, 0, global.screen_width, global.screen_height);
            } else {
                this.flash(screenshot.x, screenshot.y, screenshot.width, screenshot.height);
            }
        }

        if (screenshot.options.playShutterSound) {
            this.playSound("camera-shutter");
        }

        if (this._callback) {
            this._callback(screenshot);
        }

        return true;
    },

    abort: function() {
        this.reset();
        return true;
    },

    reset: function() {
        // Mode-specific resets
        if (this._selectionType === SelectionType.WINDOW) {
            if (this._windowSelected) {
                this.clearWindowOutline();
            }
        } else if (this._selectionType === SelectionType.CINNAMON) {
            if (this.uiContainer) {
                this.clearActorOutline();
            }

            if (this._borderPaintTarget !== null) {
                this._borderPaintTarget.disconnect(this._borderPaintId);
            }

            if (this._eventHandler) {
                this._eventHandler.destroy();
            }
            this._eventHandler = null;
        }

        if (this.shadowContainer) {
            Main.uiGroup.remove_actor(this.shadowContainer);
            this.shadowContainer.destroy();
        }

        this.hideInstructions();

        if (this._timer) {
            Main.uiGroup.remove_actor(this._timer);
            this._timer.destroy();
            this._timer = null;
        }

        if (this._modal) {
            Main.popModal(this.container);
        }

        if (this._lightbox) {
            this._lightbox.hide();
            this._lightbox.destroy();
        }

        global.unset_cursor();

        this._modal = false;

        if (this.container) {
            Main.uiGroup.remove_actor(this.container);
            this.container.destroy();
        }

        if (this._capturedEventId) {
            global.stage.disconnect(this._capturedEventId);
            this._capturedEventId = null;
        }
    },

    drawBorders: function(width, height) {
        for (let borderName of BORDER_NAMES) {
            let m = this._calcBorderMeasures(borderName, width, height);
            this[borderName].set_clip(0, 0, m.clip_w, m.clip_h);
            this[borderName].set_position(m.pos_x, m.pos_y);
            this[borderName].set_size(m.size_w, m.size_h);
        }

        for (let handleName of HANDLE_NAMES) {
            let pos = this._calcHandlePos(handleName, width, height);
            this[handleName].set_position(pos.x, pos.y);
            this[handleName].set_size(HANDLE_SIZE, HANDLE_SIZE);
        }
    },

    drawShadows: function(x, y, width, height) {
        this.coverLeft.set_position(0, 0);
        this.coverLeft.set_size(x, this._screenHeight);

        this.coverRight.set_position(x + width, 0);
        this.coverRight.set_size(this._screenWidth - (x + width), this._screenHeight);

        this.coverTop.set_position(x, 0);
        this.coverTop.set_size(width, y);

        this.coverBottom.set_position(x, y + height);
        this.coverBottom.set_size(width, (this._screenHeight - (y + height)));
    },

    redrawAreaSelection: function(x, y) {
        let width = Math.abs(this._xEnd - this._xStart);
        let height = Math.abs(this._yEnd - this._yStart);

        // Constrain selection area to screen dimensions
        if (x + width > this._screenWidth) {
            x = this._screenWidth - width;
        }

        if (y + height > this._screenHeight) {
            y = this._screenHeight - height;
        }

        this.container.set_position(x, y);
        this.container.set_size(width, height);

        this.drawBorders(width, height);
        this.drawShadows(x, y, width, height);
    },

    _onCapturedEvent: function(actor, aEvent) {
        let eventType = aEvent.type();
        let symbol = aEvent.get_key_symbol();

        if (eventType === Clutter.EventType.KEY_PRESS) {
            this.hideInstructions();

            if (symbol === Clutter.Escape) {
                runtimeInfo("Aborting screenshot.");
                this.abort();
                return true;
            } else if (symbol === Clutter.Shift_L) {
                this.setModifier(symbol, true);
                return true;
            } else if (this._selectionType === SelectionType.AREA) {
                if (this._selectionMade && (symbol === Clutter.KEY_Return ||
                        symbol === Clutter.KEY_KP_Enter)) {
                    let [x, y] = this.container.get_position();
                    let [w, h] = this.container.get_size();
                    runtimeInfo("Selection area is " + x + "," + y + " - " + w + " x " + h);
                    this.screenshotArea(x, y, w, h);
                    return true;
                } else if (this._selectionMade) {
                    let isMovementKey = (symbol === Clutter.KEY_Up ||
                        symbol === Clutter.KEY_Down || symbol === Clutter.KEY_Left ||
                        symbol === Clutter.KEY_Right);

                    if (isMovementKey) {
                        if (this.getModifier(Clutter.Shift_L)) {
                            // Resize selection
                            switch (symbol) {
                                case Clutter.KEY_Up:
                                    this._yEnd -= 1;
                                    break;
                                case Clutter.KEY_Down:
                                    this._yEnd += 1;
                                    break;
                                case Clutter.KEY_Left:
                                    this._xEnd -= 1;
                                    break;
                                case Clutter.KEY_Right:
                                    this._xEnd += 1;
                                    break;
                            }
                        } else {
                            // Move selection
                            switch (symbol) {
                                case Clutter.KEY_Up:
                                    if (this._yStart > 1) {
                                        this._yStart -= 1;
                                        this._yEnd -= 1;
                                    }
                                    break;
                                case Clutter.KEY_Down:
                                    if (this._yEnd < this._screenHeight) {
                                        this._yStart += 1;
                                        this._yEnd += 1;
                                    }
                                    break;
                                case Clutter.KEY_Left:
                                    if (this._xStart > 1) {
                                        this._xStart -= 1;
                                        this._xEnd -= 1;
                                    }
                                    break;
                                case Clutter.KEY_Right:
                                    if (this._xEnd < this._screenWidth) {
                                        this._xStart += 1;
                                        this._xEnd += 1;
                                    }
                                    break;
                            }
                        }

                        let x = Math.min(this._xEnd, this._xStart);
                        let y = Math.min(this._yEnd, this._yStart);
                        this.redrawAreaSelection(x, y);
                        return true;
                    }
                }
            }
        } else if (eventType === Clutter.EventType.KEY_RELEASE) {
            if (symbol === Clutter.Shift_L) {
                this.setModifier(symbol, false);
            }
        } else if (eventType === Clutter.EventType.BUTTON_PRESS) {
            if (this.instructionsShowing()) {
                this.hideInstructions();
            }

            let button = aEvent.get_button();
            if (button === Clutter.BUTTON_LEFT || button === Clutter.BUTTON_RIGHT) {
                return true;
            }

            let [xMouse, yMouse, mask] = global.get_pointer(); // jshint ignore:line

            let eventSource = aEvent.get_source();

            if (aEvent.get_source() === this.container) {
                this._isMoving = true;
                this._mouseDown = true;
                this._xMouse = xMouse;
                this._yMouse = yMouse;
            } else if (
                /*eventSource.style_class === "desktop-capture-handle"*/
                eventSource.hasOwnProperty("is_handle")) {
                // THIS IS F*CKING ABSURD!!!! ¬¬
                // Not checking if eventSource has the style_class property
                // pollutes the logs with warnings on Cinnamon 3.8.x because
                // one of the eventSources might not have the style_class property.
                // Checking if eventSource has the style_class property breaks
                // area resizing completely!!! WTF!!!!
                //
                // SO!!! Instead of checking if the element has the desktop-capture-handle
                // class, I simply force down the handle's throat a new property
                // ("is_handle") and then check for that property in this condition.
                // MOVING THE F*CK ON!!!
                this._isResizing = true;
                this._mouseDown = true;
                this._resizeActor = eventSource;
                return true;
            } else {
                this._isMoving = false;
                this._mouseDown = true;
                this._xStart = xMouse;
                this._yStart = yMouse;
                this._xEnd = xMouse;
                this._yEnd = yMouse;
            }

            if (this._selectionMade) {
                return true;
            }

            if (this._selectionType === SelectionType.AREA) {
                this.container.set_position(this._xStart, this._yStart);
                this.container.set_size(1, 1);
            } else if (this._selectionType === SelectionType.CINNAMON) {
                if (this.getModifier(Clutter.Shift_L)) {
                    if (this._capturedEventId) {
                        global.stage.disconnect(this._capturedEventId);
                        this._capturedEventId = null;
                        global.unset_cursor();

                        Mainloop.timeout_add(100, () => {
                            global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
                            this._capturedEventId = global.stage.connect("captured-event",
                                (aActor, aEvent) => this._onCapturedEvent(aActor, aEvent));
                            return false;
                        });
                    }

                    return false;
                } else if (this._target) {
                    let [stageX, stageY] = aEvent.get_coords();
                    this.screenshotCinnamon(this._target, stageX, stageY);
                    return true;
                }
                return true;
            }
        } else if (eventType === Clutter.EventType.MOTION &&
            this._selectionType === SelectionType.WINDOW) {
            let [x, y, mask] = global.get_pointer(); // jshint ignore:line

            let windows = this._windows.filter((w) => {
                let [_w, _h] = w.get_size();
                let [_x, _y] = w.get_position();

                return (w["get_meta_window"] && w.visible && _x <= x && _x + _w >= x && _y <= y && _y + _h >= y);
            });

            // Sort windows by layer
            windows.sort((a, b) => {
                return a["get_meta_window"] && b["get_meta_window"] &&
                    a.get_meta_window().get_layer() <= b.get_meta_window().get_layer();
            });

            if (windows.length > 0) {
                this._windowSelected = windows[0];
                this.showWindowOutline(this._windowSelected);
            }

            return true;
        } else if (eventType === Clutter.EventType.MOTION &&
            this._selectionType === SelectionType.CINNAMON) {
            global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
            this._updateCinnamon(aEvent);
        } else if (eventType === Clutter.EventType.SCROLL &&
            this._selectionType === SelectionType.CINNAMON) {
            this.hideInstructions();
            switch (aEvent.get_scroll_direction()) {
                case Clutter.ScrollDirection.UP:
                    // Select parent
                    let parent = this._target.get_parent();
                    if (parent !== null) {
                        this._target = parent;
                        this._updateCinnamon(aEvent);
                    }
                    break;
                case Clutter.ScrollDirection.DOWN:
                    // Select child
                    if (this._target !== this._pointerTarget) {
                        let child = this._pointerTarget;
                        while (child) {
                            let parent = child.get_parent();
                            if (parent === this._target) {
                                break;
                            }
                            child = parent;
                        }
                        if (child) {
                            this._target = child;
                            this._updateCinnamon(aEvent);
                        }
                    }
                    break;
                default:
                    break;
            }
            return true;
        } else if (this._mouseDown) {
            if (eventType === Clutter.EventType.MOTION &&
                this._selectionType === SelectionType.AREA) {
                let [xMouse, yMouse, mask] = global.get_pointer(); // jshint ignore:line

                if (xMouse !== this._xStart || yMouse !== this._yStart) {
                    let x,
                        y;
                    if (this._isMoving) {
                        x = Math.min(this._xStart, this._xEnd) - (this._xMouse - xMouse);
                        y = Math.min(this._yStart, this._yEnd) - (this._yMouse - yMouse);

                        // Constrain selection area to screen dimensions
                        if (x < 0) {
                            x = 0;
                        }
                        if (y < 0) {
                            y = 0;
                        }
                    } else if (this._isResizing) {
                        let dragName = this._resizeActor.name;
                        if (dragName === "handleN") {
                            this._yStart = yMouse;
                        } else if (dragName === "handleS") {
                            this._yEnd = yMouse;
                        } else if (dragName === "handleW") {
                            this._xStart = xMouse;
                        } else if (dragName === "handleE") {
                            this._xEnd = xMouse;
                        } else if (dragName === "handleNw") {
                            this._xStart = xMouse;
                            this._yStart = yMouse;
                        } else if (dragName === "handleNe") {
                            this._xEnd = xMouse;
                            this._yStart = yMouse;
                        } else if (dragName === "handleSw") {
                            this._xStart = xMouse;
                            this._yEnd = yMouse;
                        } else if (dragName === "handleSe") {
                            this._xEnd = xMouse;
                            this._yEnd = yMouse;
                        }

                        x = Math.min(this._xEnd, this._xStart);
                        y = Math.min(this._yEnd, this._yStart);
                    } else {
                        this._xEnd = xMouse;
                        this._yEnd = yMouse;
                        x = Math.min(this._xEnd, this._xStart);
                        y = Math.min(this._yEnd, this._yStart);
                    }

                    this.redrawAreaSelection(x, y);
                }
            } else if (eventType === Clutter.EventType.BUTTON_RELEASE) {
                let button = aEvent.get_button();

                if (button === Clutter.BUTTON_LEFT || button === Clutter.BUTTON_RIGHT) {
                    return true;
                }

                if (this._selectionType === SelectionType.WINDOW) {
                    this.screenshotWindow(this._windowSelected);
                    return true;
                } else if (this._selectionType === SelectionType.AREA) {
                    let width = Math.abs(this._xEnd - this._xStart);
                    let height = Math.abs(this._yEnd - this._yStart);

                    if (this._isMoving) {
                        this._isMoving = false;
                        this._yMouse = 0;
                        this._xMouse = 0;
                    } else if (this._isResizing) {
                        this._isResizing = false;
                        this._resizeActor = null;
                    }
                    [this._xStart, this._yStart] = this.container.get_position();
                    [this._xEnd, this._yEnd] = [this._xStart + width, this._yStart + height];

                    this._mouseDown = false;

                    this._selectionMade = true;
                    return true;
                } else if (this._selectionType === SelectionType.CINNAMON) {
                    return true;
                }
            }
        } else if (this._selectionType === SelectionType.AREA &&
            (eventType === Clutter.EventType.ENTER ||
                eventType === Clutter.EventType.LEAVE)) {
            let eventSource = aEvent.get_source();

            if (eventSource === this.container) {
                global.set_cursor(Cinnamon.Cursor.DND_MOVE);
            } else if (eventSource.hasOwnProperty("is_handle")) {
                switch (eventType) {
                    case Clutter.EventType.ENTER:
                        eventSource.add_style_pseudo_class("hover");
                        break;
                    default:
                        eventSource.remove_style_pseudo_class("hover");
                        break;
                }
                // Keep the try{}catch{} block in case one of the Cinnamon.Cursor
                // constants "disappears mysteriously".
                try {
                    switch (eventSource.name) {
                        case "handleNw":
                            global.set_cursor(Cinnamon.Cursor.RESIZE_TOP_LEFT);
                            break;
                        case "handleN":
                            global.set_cursor(Cinnamon.Cursor.RESIZE_TOP);
                            break;
                        case "handleNe":
                            global.set_cursor(Cinnamon.Cursor.RESIZE_TOP_RIGHT);
                            break;
                        case "handleW":
                            global.set_cursor(Cinnamon.Cursor.RESIZE_LEFT);
                            break;
                        case "handleE":
                            global.set_cursor(Cinnamon.Cursor.RESIZE_RIGHT);
                            break;
                        case "handleSw":
                            global.set_cursor(Cinnamon.Cursor.RESIZE_BOTTOM_LEFT);
                            break;
                        case "handleS":
                            global.set_cursor(Cinnamon.Cursor.RESIZE_BOTTOM);
                            break;
                        case "handleSe":
                            global.set_cursor(Cinnamon.Cursor.RESIZE_BOTTOM_RIGHT);
                            break;
                        default:
                            global.set_cursor(Cinnamon.Cursor.CROSSHAIR);
                    }
                } catch (aErr) {
                    global.logError(aErr);
                    global.set_cursor(Cinnamon.Cursor.CROSSHAIR);
                }
            } else {
                global.set_cursor(Cinnamon.Cursor.CROSSHAIR);
            }
        }

        return true;
    },

    clearActorOutline: function() {
        if (this._lightbox) {
            this._lightbox.hide();
        }

        Main.uiGroup.remove_actor(this.uiContainer);
        this.uiContainer.destroy();

        this.container.remove_actor(this._outlineFrame);
        this._outlineFrame.destroy();
    },

    showActorOutline: function(actor) {
        // Create the actor that will serve as background for the clone.
        let frameClass = "desktop-capture-capture-outline-frame";
        let ag = actor.get_allocation_geometry();
        let [width, height] = [ag.width, ag.height];
        let [x, y] = actor.get_transformed_position();

        let childBox = new Clutter.ActorBox();
        childBox.x1 = x;
        childBox.x2 = x + width;
        childBox.y1 = y;
        childBox.y2 = y + height;

        global.cb = childBox;

        // The frame is needed to draw the border round the clone.
        let frame = this._outlineFrame = new St.Bin({
            style_class: frameClass
        });
        this.container.add_actor(frame); // must not be a child of the background
        frame.allocate(childBox, 0); // same dimensions

        this.uiContainer = new St.Group({
            reactive: false,
            x: x,
            y: y,
            width: width,
            height: height,
            style_class: "test-container"
        });

        Main.uiGroup.add_actor(this.uiContainer);

        this.drawShadows(x, y, width, height);
    },

    clearWindowOutline: function() {
        if (this._lightbox) {
            this._lightbox.hide();
        }

        Main.uiGroup.remove_actor(this.uiContainer);
        this.uiContainer.destroy();

        this.container.remove_actor(this._outlineBackground);
        this._outlineBackground.destroy();
        this._outlineBackground = null;

        this.container.remove_actor(this._outlineFrame);
        this._outlineFrame.destroy();

        return true;
    },

    showWindowOutline: function(window) {
        if (this._outlineBackground) {
            this.clearWindowOutline();
        }

        let metaWindow = window.get_meta_window();

        // Create the actor that will serve as background for the clone.
        let binClass = "desktop-capture-capture-outline-background desktop-capture-capture-outline-frame";
        let frameClass = "desktop-capture-capture-outline-frame";

        if (metaWindow.get_window_type() === Meta.WindowType.DESKTOP) {
            binClass += " desktop";
            frameClass += " desktop";
        }

        let background = new St.Bin({
            style_class: binClass
        });
        this._outlineBackground = background;
        this.container.add_actor(background);
        // Make sure that the frame does not overlap the switcher.
        // background.lower(this._appSwitcher.actor);

        // We need to know the border width so that we can
        // make the background slightly bigger than the clone window.
        let themeNode = background.get_theme_node();
        let borderWidth = themeNode.get_border_width(St.Side.LEFT); // assume same for all sides
        let borderAdj = borderWidth / 2;

        let or = metaWindow.get_outer_rect();
        or.x -= borderAdj;
        or.y -= borderAdj;
        or.width += borderAdj;
        or.height += borderAdj;

        let childBox = new Clutter.ActorBox();
        childBox.x1 = or.x;
        childBox.x2 = or.x + or.width;
        childBox.y1 = or.y;
        childBox.y2 = or.y + or.height;
        background.allocate(childBox, 0);

        // The frame is needed to draw the border round the clone.
        let frame = this._outlineFrame = new St.Bin({
            style_class: frameClass
        });
        this.container.add_actor(frame); // must not be a child of the background
        frame.allocate(childBox, 0); // same dimensions
        background.lower(frame);

        if (this.bringWindowsToFront) {
            // Show a clone of the target window
            let outlineClone = new Clutter.Clone({
                source: metaWindow.get_compositor_private().get_texture()
            });
            background.add_actor(outlineClone);
            outlineClone.opacity = 100; // translucent to get a tint from the background color

            // The clone's rect is not the same as the window's outer rect
            let ir = metaWindow.get_input_rect();
            let diffX = (ir.width - or.width) / 2;
            let diffY = (ir.height - or.height) / 2;

            childBox.x1 = -diffX;
            childBox.x2 = or.width + diffX;
            childBox.y1 = -diffY;
            childBox.y2 = or.height + diffY;

            outlineClone.allocate(childBox, 0);
        }

        this.uiContainer = new St.Group({
            reactive: true,
            x: or.x,
            y: or.y,
            width: or.width,
            height: or.height,
            style_class: "test-container",
            x_align: St.Align.MIDDLE,
            y_align: St.Align.MIDDLE
        });

        Main.uiGroup.add_actor(this.uiContainer);

        let tracker = Cinnamon.WindowTracker.get_default();
        let app = tracker.get_window_app(metaWindow);
        let icon = null;
        if (app) {
            icon = app.create_icon_texture(22);
        }
        if (!icon) {
            icon = new St.Icon({
                icon_name: "application-default-icon",
                icon_type: St.IconType.FULLCOLOR,
                icon_size: 22,
                style_class: "desktop-capture-overlay-icon"
            });
        }

        icon.width = 32;
        icon.height = 32;

        this._iconBin = new St.Bin({
            visible: true,
            reactive: true,
            x_fill: false,
            y_fill: false,
            style_class: "desktop-capture-overlay-iconbox",
            child: icon,
            y_align: St.Align.END
        });

        let sizeInfo = or.width + " " + UNICODE_SYMBOLS.multiplication_sign + " " + or.height;
        let title = new St.Label({
            text: metaWindow.get_title(),
            style_class: "desktop-capture-overlay-label-title"
        });
        let subtitle = new St.Label({
            text: sizeInfo,
            style_class: "desktop-capture-overlay-label-size"
        });

        let box = new St.BoxLayout({
            vertical: true,
            width: this.uiContainer.width,
            height: this.uiContainer.height
        });
        box.add(this._iconBin, {
            expand: true,
            y_fill: true,
            y_align: St.Align.END
        });

        let box2 = new St.BoxLayout({
            vertical: true,
            width: this.uiContainer.width,
            height: 50,
            x_align: St.Align.MIDDLE,
            style_class: "desktop-capture-overlay-box-2"
        });
        box2.add(title, {
            expand: true,
            x_fill: false,
            x_align: St.Align.MIDDLE
        });
        box2.add(subtitle, {
            expand: true,
            x_fill: false,
            x_align: St.Align.MIDDLE
        });

        box.add(box2, {
            expand: true,
            x_fill: true,
            y_fill: false,
            x_align: St.Align.MIDDLE,
            y_align: St.Align.START
        });

        this.uiContainer.add_actor(box);
        box.show();

        return true;
    },

    _calcBorderMeasures: function(aElName, aWidth, aHeight) {
        let m = {
            clip_w: 0,
            clip_h: 0,
            pos_x: 0,
            pos_y: 0,
            size_w: 0,
            size_h: 0
        };

        switch (aElName) {
            case "border1":
                m.clip_w = aWidth;
                m.clip_h = 1;
                m.size_w = aWidth;
                m.size_h = 1;
                break;
            case "border2":
                m.clip_w = aWidth;
                m.clip_h = 1;
                m.pos_y = aHeight - 1;
                m.size_w = aWidth;
                m.size_h = 1;
                break;
            case "border3":
                m.clip_w = 1;
                m.clip_h = aHeight;
                m.size_w = 1;
                m.size_h = aHeight;
                break;
            case "border4":
                m.clip_w = 1;
                m.clip_h = aHeight;
                m.pos_x = aWidth - 1;
                m.size_w = 1;
                m.size_h = aHeight;
                break;
        }

        return m;
    },

    _calcHandlePos: function(aElName, aWidth, aHeight) {
        let pos = {
            x: 0,
            y: 0
        };

        switch (aElName) {
            case "handleNw":
                break;
            case "handleN":
                pos.x = aWidth / 2 - (HANDLE_SIZE / 2);
                break;
            case "handleNe":
                pos.x = aWidth - HANDLE_SIZE;
                break;
            case "handleW":
                pos.y = aHeight / 2 - (HANDLE_SIZE / 2);
                break;
            case "handleE":
                pos.x = aWidth - HANDLE_SIZE;
                pos.y = aHeight / 2 - (HANDLE_SIZE / 2);
                break;
            case "handleSw":
                pos.y = aHeight - HANDLE_SIZE;
                break;
            case "handleS":
                pos.x = aWidth / 2 - (HANDLE_SIZE / 2);
                pos.y = aHeight - HANDLE_SIZE;
                break;
            case "handleSe":
                pos.x = aWidth - HANDLE_SIZE;
                pos.y = aHeight - HANDLE_SIZE;
                break;
        }

        return pos;
    }
};

function LastCaptureContainer() {
    this._init.apply(this, arguments);
}

LastCaptureContainer.prototype = {
    __proto__: PopupMenu.PopupMenuSection.prototype,

    _init: function(aApplet, aParams) {
        PopupMenu.PopupMenuSection.prototype._init.call(this);

        let params = Params.parse(aParams, {
            device: ""
        });

        let baseButton = (aLabel) => {
            let btn = new St.Button({
                style_class: "notification-button",
                style: "padding: 2px 5px;"
            });
            btn.label = aLabel;

            return btn;
        };

        this._applet = aApplet;
        this._device = params.device;
        this._thumbnail = null;

        this._emptyLabel = new St.Label({
            text: _("File no longer available"),
            style_class: "popup-menu-item"
        });

        this._mainBox = new St.BoxLayout({
            vertical: true
        });
        this._thumbnailContainer = new St.Bin({
            reactive: false
        });

        this._toolbar = new St.BoxLayout({
            style_class: "popup-menu-item",
            style: "spacing:4px;",
            vertical: false
        });

        let toolbarButtons = {
            delButton: {
                label: _("Delete"),
                tooltip: _("Delete captured file from file system."),
                action: "delete-file"
            },
            copyDataButton: {
                label: _("Copy data"),
                tooltip: _("Copy image data to clipboard."),
                action: "copy-image-data"
            },
            copyPathButton: {
                label: _("Copy path"),
                tooltip: _("Copy image path to clipboard."),
                action: "copy-image-path"
            }
        };

        for (let btn in toolbarButtons) {
            if (params.device === "recorder" &&
                btn === "copyDataButton") {
                continue;
            }

            this[btn] = baseButton(toolbarButtons[btn].label);
            this._addConnsAndTooltipToActor({
                self_actor: btn,
                tooltip_text: toolbarButtons[btn].tooltip,
                action: toolbarButtons[btn].action
            });
            this._toolbar.add(this[btn], {
                x_align: St.Align.MIDDLE,
                x_fill: true,
                x_expand: true
            });
        }

        this._mainBox.add(this._thumbnailContainer, {
            x_align: St.Align.MIDDLE,
            x_fill: true,
            x_expand: true
        });
        this._mainBox.add(this._toolbar, {
            x_align: St.Align.MIDDLE,
            x_fill: true,
            x_expand: true
        });

        this.addActor(this._emptyLabel);
        this.addActor(this._mainBox, {
            expand: true,
            span: 1,
            align: St.Align.MIDDLE
        });

        this.connect("file-data-changed", () => this._onFileDataChanged(true));
    },

    _onFileDataChanged: function(aSetUnsetThumbnail) {
        let fileData = this.fileData;

        if (fileData && fileData.f &&
            GLib.path_is_absolute(fileData.f) &&
            GLib.file_test(fileData.f, GLib.FileTest.EXISTS)) {
            this._switchVisibility(false);
            aSetUnsetThumbnail && this._setThumbnail();
        } else {
            this._switchVisibility(true);
            aSetUnsetThumbnail && this._unsetThumbnail();
        }
    },

    _switchVisibility: function(aEmpty) {
        if (aEmpty) {
            this._mainBox.hide();
            this._emptyLabel.show();
        } else {
            this._mainBox.show();
            this._emptyLabel.hide();
        }
    },

    _addConnsAndTooltipToActor: function(aParams) {
        let params = Params.parse(aParams, {
            self_actor: "",
            tooltip_text: "",
            activation_signal: "clicked",
            add_hover_events: false,
            action: ""
        });

        this[params.self_actor].connect(params.activation_signal,
            (aActor, aEvent) => {
                this._performAction(aActor, aEvent, params.action);
            });

        if (params.add_hover_events) {
            this[params.self_actor].connect("enter-event",
                (aActor, aEvent) => this._onActorEnterEvent(aActor, aEvent));
            this[params.self_actor].connect("leave-event",
                (aActor, aEvent) => this._onActorLeaveEvent(aActor, aEvent));
        }

        if (params.tooltip_text) {
            this[params.self_actor].tooltip = new IntelligentTooltip(
                this[params.self_actor], params.tooltip_text);
        }
    },

    _performAction: function(aActor, aEvent, aAction) {
        this._applet.closeMainMenu();

        switch (aAction) {
            case "thumbnail-clicked":
                Mainloop.timeout_add(200, () => {
                    switch (aEvent.get_button()) {
                        case 1: // Left click.
                            this._applet._doRunHandler(this.fileData.f);
                            break;
                        case 3: // Right click.
                            this._applet._doRunHandler(
                                GLib.path_get_dirname(this.fileData.f));
                            break;
                    }

                    return false;
                });
                break;
            case "delete-file":
                askForConfirmation({
                    message: _("Do you really want to delete this file?")
                }, () => {
                    let file = Gio.file_new_for_path(this.fileData.f);

                    try {
                        file.delete(null);
                        this.fileData = {};
                    } catch (aErr) {
                        global.log(aErr);
                        global.log("Could not delete file " + file.get_path());
                    }
                });
                break;
            case "copy-image-data":
                TryExec({
                    command: this._applet.appletHelper + " copy_image_data " +
                        this.fileData.f,
                    on_failure: (aParams) => {
                        global.logError(aParams.command);
                    },
                    on_complete: (aParams) => {
                        if (Number(aParams.status) > 0) {
                            notify([
                                    _("Failed copying image data."),
                                    "\n",
                                    aParams.stdout
                                ],
                                "error"
                            );
                        }
                    }
                });
                notify([_("Image data copied to clipboard.")]);
                break;
            case "copy-image-path":
                copyToClipboard(this.fileData.f);
                notify([_("File path copied to clipboard.")]);
                break;
            default:
                break;
        }
    },

    _setThumbnail: function() {
        this._unsetThumbnail();

        let icon;

        this._thumbnail = new St.Bin({
            reactive: true
        });

        // When using St.TextureCache.get_default().load_uri_sync(), the result
        // is totally disgusting. The resulting thumbnail "jumps" all over the
        // place when the sub menu is opened with an animation.
        // Using a ThemedIcon/FileIcon icon the result is "rock solid".
        if (this._device === "recorder") {
            icon = new Gio.ThemedIcon({
                name: "video-x-generic"
            });
        } else {
            icon = new Gio.FileIcon({
                file: Gio.file_new_for_path(this.fileData.f)
            });
        }
        let image = St.TextureCache.get_default().load_gicon(null, icon, 128);

        this._thumbnail.set_child(image);
        this._thumbnailContainer.set_child(this._thumbnail);

        this._addConnsAndTooltipToActor({
            self_actor: "_thumbnail",
            tooltip_text: "<b>%s</b>: %s".format(_("Left click"), _("Open image file.")) + "\n" +
                "<b>%s</b>: %s".format(_("Right click"), _("Open folder.")),
            action: "thumbnail-clicked",
            activation_signal: "button-press-event",
            add_hover_events: true
        });
    },

    _unsetThumbnail: function() {
        if (this._thumbnail) {
            this._thumbnailContainer.remove_child(this._thumbnail);
            this._thumbnail = null;
        }
    },

    _onActorEnterEvent: function(aActor, aEvent) { // jshint ignore:line
        global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
        return false;
    },

    _onActorLeaveEvent: function(aActor, aEvent) { // jshint ignore:line
        global.unset_cursor();
    },

    get fileData() {
        return this._fileData;
    },

    set fileData(aData) {
        let data = Params.parse(aData, {
            d: "",
            f: ""
        });

        this._fileData = data;
        this.emit("file-data-changed");
    }
};

function askForConfirmation(aParams, aCallback) {
    let params = Params.parse(aParams, {
        message: "",
        pref_name: "",
        pref_empty_value: ""
    });

    let msg = {
        title: _(XletMeta.name),
        message: "<b>" + _("WARNING!!!") + "</b>\n" + params.message
    };

    // Same as with the displayDialogMessage function.
    // Clutter dialogs (ModalDialog class) are absolute GARBAGE.
    // Avoid them at all cost.
    Util.spawn_async([XletMeta.path + "/appletHelper.py", "confirm", JSON.stringify(msg)],
        (aOutput) => {
            let response = aOutput.trim();

            if (response && response !== "_just_do_it_") {
                return;
            }

            if (aCallback) {
                aCallback(params);
            }
        }
    );
}

function notify(aMsg, aLevel = "info") {
    let iconName,
        fnName;

    switch (aLevel) {
        case "error":
            iconName = "dialog-error";
            fnName = "criticalNotify";
            break;
        case "warning":
            iconName = "dialog-warning";
            fnName = "warningNotify";
            break;
        case "info":
            iconName = "dialog-info";
            fnName = "notify";
            break;
    }

    let icon = new St.Icon({
        icon_name: iconName,
        icon_type: St.IconType.SYMBOLIC,
        icon_size: 48
    });

    Main[fnName](_(XletMeta.name), aMsg.join("\n"), icon);
}

function Exec(cmd) {
    let success,
        argc, // jshint ignore:line
        argv,
        pid,
        stdin,
        stdout,
        stderr;
    [success, argv] = GLib.shell_parse_argv(cmd);
    [success, pid, stdin, stdout, stderr] = GLib.spawn_async_with_pipes(null, argv, null, GLib.SpawnFlags.SEARCH_PATH, null, null);

    return true;
}

function TryExec(aParams) {
    let p;

    p = Params.parse(aParams, {
        command: "",
        device: "",
        can_repeat: false,
        is_recording: false,
        on_start: null,
        on_failure: null,
        on_complete: null,
        current_file_name: "",
        current_file_path: false,
        current_file_extension: false
    });

    let success,
        argv,
        pid,
        in_fd,
        out_fd,
        err_fd;
    [success, argv] = GLib.shell_parse_argv(p.command);

    try {
        [success, pid, in_fd, out_fd, err_fd] = GLib.spawn_async_with_pipes(
            null,
            argv,
            null,
            GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
            null);
    } catch (e) {
        runtimeError("Failure creating process");
        typeof p.on_failure === "function" && p.on_failure({
            command: p.command,
            stderr: err_fd,
            stdout: out_fd
        });
        return false;
    }

    if (success && pid !== 0) {
        let out_reader = new Gio.DataInputStream({
            base_stream: new Gio.UnixInputStream({
                fd: out_fd
            })
        });
        // Wait for answer
        runtimeInfo("Spawned process with pid=" + pid);
        typeof p.on_start === "function" && p.on_start({
            is_recording: p.is_recording
        });

        GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid,
            (aPid, aStatus) => {
                GLib.spawn_close_pid(aPid);

                let [line, size, buf] = [null, 0, ""];
                while (([line, size] = out_reader.read_line(null)) !== null && line !== null) {
                    buf += line;
                }

                typeof p.on_complete === "function" && p.on_complete({
                    status: aStatus,
                    stdout: buf,
                    is_recording: p.is_recording,
                    can_repeat: p.can_repeat,
                    command: p.command,
                    device: p.device,
                    current_file_path: p.current_file_path,
                    current_file_extension: p.current_file_extension,
                    current_file_name: p.current_file_name
                });
            });
    } else {
        runtimeError("Failed to spawn process");
        typeof p.on_failure === "function" && p.on_failure({
            command: p.command,
            stderr: err_fd,
            stdout: out_fd
        });
    }

    return true;
}

DebugManager.wrapObjectMethods(Debugger, {
    CinnamonRecorderProfileItem: CinnamonRecorderProfileItem,
    CinnamonRecorderProfileSelector: CinnamonRecorderProfileSelector,
    CustomPopupMenuSection: CustomPopupMenuSection,
    CustomPopupSliderMenuItem: CustomPopupSliderMenuItem,
    CustomSwitchMenuItem: CustomSwitchMenuItem,
    IntelligentTooltip: IntelligentTooltip,
    LastCaptureContainer: LastCaptureContainer,
    ProgramSelectorMenuItem: ProgramSelectorMenuItem,
    ProgramSelectorSubMenuItem: ProgramSelectorSubMenuItem,
    RadioSelectorMenuItem: RadioSelectorMenuItem,
    RadioSelectorSubMenuItem: RadioSelectorSubMenuItem,
    ScreenshotHelper: ScreenshotHelper
});

/* exported Exec
 */
