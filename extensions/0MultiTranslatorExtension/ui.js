let XletMeta,
    Constants,
    $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    Constants = require("./constants.js");
    $ = require("./utils.js");
} else {
    Constants = imports.ui.extensionSystem.extensions["{{UUID}}"].constants;
    $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
}

const {
    gi: {
        Atk,
        Cinnamon,
        Clutter,
        GLib,
        Pango,
        St
    },
    mainloop: Mainloop,
    misc: {
        util: Util,
        params: Params
    },
    signals: Signals,
    ui: {
        cinnamonEntry: CinnamonEntry,
        lightbox: Lightbox,
        main: Main,
        popupMenu: PopupMenu,
        tweener: Tweener
    }
} = imports;

const {
    _,
    TTS_URI,
    TTS_TEXT_MAX_LEN,
    LNG_CHOOSER_COLUMNS,
    STATUS_BAR_MAX_MESSAGE_LENGTH,
    StatusbarMessageType,
    STATUS_BAR_MESSAGE_PARAMS,
    DIALOG_POPUP_ITEM_PARAMS,
    SPINNER_PARAMS,
    Icons,
    ProviderData,
    CINNAMON_VERSION,
    DialogState,
    LoggingLevel,
    MagicKeys,
    Settings
} = Constants;

let Gst;

try {
    imports.gi.versions.Gst = "1.0";
    Gst = imports.gi.Gst;
} catch (aErr) {
    global.logError(aErr);
}

function BaseDialog() {
    this._init.apply(this, arguments);
}

BaseDialog.prototype = {
    _init: function(aParams) {
        let params = Params.parse(aParams, {
            name: "",
            style_class: null,
            cinnamonReactive: false
        });

        this.state = DialogState.CLOSED;
        this._hasModal = false;
        this._cinnamonReactive = params.cinnamonReactive;

        this._group = new St.Widget({
            visible: false,
            x: 0,
            y: 0,
            accessible_role: Atk.Role.DIALOG
        });

        Main.uiGroup.add_actor(this._group);

        this._group.connect("destroy", () => this._onGroupDestroy());

        this._actionKeys = {};
        this._group.connect("key-press-event",
            (aActor, aEvent) => this._onKeyPressEvent(aActor, aEvent));

        this._backgroundBin = new St.Bin();
        this._group.add_actor(this._backgroundBin);

        this._dialogLayout = new St.BoxLayout({
            style_class: "modal-dialog",
            vertical: true
        });

        if (params.name) {
            this._dialogLayout.set_name(params.name);
        }

        if (params.style_class !== null) {
            this._dialogLayout.add_style_class_name(params.style_class);
        }

        if (this._cinnamonReactive) {
            this._backgroundBin.child = this._dialogLayout;
        } else {
            this._lightbox = new Lightbox.Lightbox(this._group, {
                inhibitEvents: true
            });
            this._lightbox.highlight(this._backgroundBin);

            let stack = new Cinnamon.Stack();
            this._backgroundBin.child = stack;

            this._eventBlocker = new Clutter.Actor({
                reactive: true
            });
            stack.add_actor(this._eventBlocker);
            stack.add_actor(this._dialogLayout);
        }

        this.contentLayout = new St.BoxLayout({
            vertical: true
        });
        this._dialogLayout.add(this.contentLayout, {
            x_fill: true,
            y_fill: true,
            x_align: St.Align.MIDDLE,
            y_align: St.Align.START
        });

        global.focus_manager.add_group(this._dialogLayout);
        this._initialKeyFocus = this._dialogLayout;
        this._savedKeyFocus = null;

        this.normalScaleY = this._group.scale_y;
        this.normalScaleX = this._group.scale_x;
    },

    destroy: function() {
        this._group.destroy();
    },

    _onKeyPressEvent: function(aActor, aEvent) {
        let modifiers = Cinnamon.get_event_state(aEvent);
        let ctrlAltMask = Clutter.ModifierType.CONTROL_MASK | Clutter.ModifierType.MOD1_MASK;
        let symbol = aEvent.get_key_symbol();

        if (symbol === Clutter.Escape && !(modifiers & ctrlAltMask)) {
            this.close();
            return;
        }

        let action = this._actionKeys[symbol];

        if (action) {
            action();
        }
    },

    _onGroupDestroy: function() {
        this.emit("destroy");
    },

    setInitialKeyFocus: function(aActor) {
        this._initialKeyFocus = aActor;
    },

    _resize: function() {
        throw new Error(_("Not implemented"));
    },

    open: function() {
        if (this.state == DialogState.OPENED || this.state == DialogState.OPENING) {
            Clutter.EVENT_STOP;
        }

        if (!this.pushModal()) {
            Clutter.EVENT_PROPAGATE;
        }

        let monitor = Main.layoutManager.currentMonitor;

        this._backgroundBin.set_position(monitor.x, monitor.y);
        this._backgroundBin.set_size(monitor.width, monitor.height);

        this.state = DialogState.OPENING;

        this._group.scale_y = 0;
        this._group.scale_x = 0;
        this._group.set_pivot_point(0.5, 0.5);
        this._group.opacity = 0;

        Tweener.addTween(this._group, {
            opacity: 255,
            scale_x: this.normalScaleX,
            scale_y: this.normalScaleY,
            time: $.getUIAnimationTime(),
            transition: "easeOutQuad",
            visible: true,
            onUpdateScope: this,
            onUpdate: () => {
                this._resize();
            },
            onCompleteScope: this,
            onComplete: () => {
                this.state = DialogState.OPENED;
                this.emit("opened");
            }
        });

        Clutter.EVENT_STOP;
    },

    close: function() {
        if (this.state == DialogState.CLOSED || this.state == DialogState.CLOSING) {
            return;
        }

        this.state = DialogState.CLOSING;
        this.popModal();
        this._savedKeyFocus = null;
        this._group.set_pivot_point(0.5, 0.5);

        Tweener.addTween(this._group, {
            opacity: 0,
            scale_x: 0,
            scale_y: 0,
            time: $.getUIAnimationTime(),
            transition: "easeOutQuad",
            visible: false,
            onCompleteScope: this,
            onComplete: () => {
                this.state = DialogState.CLOSED;
                this._group.hide();
            }
        });
    },

    popModal: function() {
        if (!this._hasModal) {
            return;
        }

        let focus = global.stage.key_focus;

        if (focus && this._group.contains(focus)) {
            this._savedKeyFocus = focus;
        } else {
            this._savedKeyFocus = null;
        }

        Main.popModal(this._group);
        global.gdk_screen.get_display().sync();
        this._hasModal = false;

        if (!this._cinnamonReactive) {
            this._eventBlocker.raise_top();
        }
    },

    pushModal: function() {
        if (this._hasModal) {
            return Clutter.EVENT_STOP;
        }

        if (!Main.pushModal(this._group)) {
            return Clutter.EVENT_PROPAGATE;
        }

        this._hasModal = true;

        if (this._savedKeyFocus) {
            this._savedKeyFocus.grab_key_focus();
            this._savedKeyFocus = null;
        } else {
            this._initialKeyFocus.grab_key_focus();
        }

        if (!this._cinnamonReactive) {
            this._eventBlocker.lower_bottom();
        }

        return Clutter.EVENT_STOP;
    }
};
Signals.addSignalMethods(BaseDialog.prototype);

function ButtonsBarButton() {
    this._init.apply(this, arguments);
}

ButtonsBarButton.prototype = {
    _init: function(aParams) {
        this.params = Params.parse(aParams, {
            label: "",
            tooltip: "",
            icon_name: "",
            callback: null,
            button_style_class: "",
            track_hover: true,
            reactive: true,
            toggle_mode: false,
            icon_style_class: "mt-button-icon",
            add_default_style_class: false,
            info_bar: false
        });
        this._button_box = new St.BoxLayout();

        this._button_content = new St.BoxLayout();

        this._sensitive = true;
        this._is_hidden = false;
        this._icon = false;
        this._label = false;
        this._info_message = false;

        this._button = new St.Button({
            track_hover: this.params.track_hover,
            reactive: this.params.reactive,
            toggle_mode: this.params.toggle_mode
        });
        this._button.add_style_class_name("mt-buttonsbar-button");

        if (this.params.button_style_class) {
            this._button.add_style_class_name(this.params.button_style_class);
        }

        if (this.params.add_default_style_class) {
            this._button.add_style_class_name("modal-dialog-button");
        }

        this._button.add_actor(this._button_content);
        this._button_box.add_actor(this._button);

        if (typeof this.params.callback === "function") {
            this._button.connect("button-press-event", (aActor, aEvent) => {
                if (this._sensitive) {
                    this.params.callback(aActor, aEvent);
                }

                // Since I changed the event from "clicked" to "button-press-event"
                // (to be able to pass the event to the callback to detect modifier keys),
                // and if the action defined above is the closing of the dialog ("Quit" button),
                // the Cinnamon UI kind of "gets stuck". The following return fixes that.
                // Keep an eye on this in case it has negative repercussions.
                return Clutter.EVENT_STOP;
            });
        }

        if (!$.isBlank(this.params.icon_name)) {
            this._icon = new St.Icon({
                icon_name: this.params.icon_name,
                style_class: this.params.icon_style_class,
                icon_type: (/\-symbolic$/.test(this.params.icon_name) ?
                    St.IconType.SYMBOLIC :
                    St.IconType.FULLCOLOR)
            });

            this._button_content.add(this._icon, {
                x_fill: false,
                x_align: St.Align.START
            });
        }

        if (!$.isBlank(this.params.label)) {
            this._label = new St.Label({
                text: this.params.label
            });

            this._button_content.add(this._label, {
                x_fill: false,
                y_align: St.Align.MIDDLE
            });

            if (this._icon) {
                this._label.visible = false;
            }
        }

        this._button.connect("enter-event",
            (aActor, aEvent) => this._onButtonEnterEvent(aActor, aEvent));
        this._button.connect("leave-event",
            (aActor, aEvent) => this._onButtonLeaveEvent(aActor, aEvent));

        if (this.params.tooltip && this.params.info_bar) {
            this._info_message = this.params.info_bar.add_message({
                message: this.params.tooltip,
                timeout: 0,
                animate: false,
                store_only: true
            });
        }

        if (!this._icon && !this._label) {
            throw new Error(_("Icon and label are both empty."));
        }
    },

    _onButtonEnterEvent: function() {
        if (!this._sensitive) {
            return Clutter.EVENT_STOP;
        }

        this._info_message && this.params.info_bar.show_message(this._info_message);
        this.button.add_style_pseudo_class("hover");
        return Clutter.EVENT_PROPAGATE;
    },

    _onButtonLeaveEvent: function() {
        this.button.remove_style_pseudo_class("hover");
        this._info_message && this.params.info_bar.hide_message(this._info_message);
    },

    connect: function(aSignal, aCallback) {
        this.button.connect(aSignal, aCallback);
    },

    set_checked: function(aState) {
        this.button.change_style_pseudo_class("active", aState);
        this.button.set_checked(aState);
    },

    get_checked: function() {
        return this.button.get_checked();
    },

    set_sensitive: function(aSensitive) {
        this._sensitive = aSensitive;
    },

    destroy: function() {
        this.params = null;
        this._button_box.destroy();
    },

    show: function() {
        if (!this._is_hidden) {
            return;
        }

        this._is_hidden = false;
        this.actor.opacity = 0;
        this.set_sensitive(true);

        Tweener.addTween(this.actor, {
            time: $.getUIAnimationTime(),
            transition: "easeOutQuad",
            opacity: 255
        });
    },

    hide: function() {
        if (this._is_hidden) {
            return;
        }

        this._is_hidden = true;
        this.set_sensitive(false);

        Tweener.addTween(this.actor, {
            time: $.getUIAnimationTime(),
            transition: "easeOutQuad",
            opacity: 0
        });
    },

    get label_actor() {
        return this._label;
    },

    get label() {
        return this._label.clutter_text.get_text();
    },

    set label(aText) {
        this._label.clutter_text.set_text(aText);
    },

    get icon_actor() {
        return this._icon;
    },

    get icon_name() {
        return this._icon.icon_name;
    },

    set icon_name(aName) {
        this._icon.icon_name = aName;
    },

    get has_icon() {
        return !!this._icon;
    },

    get has_label() {
        return !!this._label;
    },

    get button() {
        return this._button;
    },

    get actor() {
        return this._button_box;
    }
};

function ButtonsBarLabel() {
    this._init.apply(this, arguments);
}

ButtonsBarLabel.prototype = {
    _init: function(aParams) {
        this.params = Params.parse(aParams, {
            label: "",
            style_class: ""
        });

        this._label = new St.Label({
            text: this.params.label,
            style_class: "mt-buttonsbar-label"
        });

        if (this.params.style_class) {
            this._label.add_style_class_name(this.params.style_class);
        }

        this.actor = new St.BoxLayout();
        this.actor.add(this._label);
    },

    get label_actor() {
        return this._label;
    },

    get label() {
        return this._label.clutter_text.get_text();
    },

    set label(aText) {
        this._label.clutter_text.set_text(aText);
    }
};

function ButtonsBar() {
    this._init.apply(this, arguments);
}

ButtonsBar.prototype = {
    _init: function(aParams) {
        this.params = Params.parse(aParams, {
            style_class: "",
            vertical: false
        });

        this.actor = new St.BoxLayout({
            style_class: "mt-buttonsbar",
            vertical: this.params.vertical
        });

        if (this.params.style_class) {
            this.actor.add_style_class_name(this.params.style_class);
        }

        this._buttons = [];
    },

    add_button: function(aButton, aButtonParams) {
        let button_params = Params.parse(aButtonParams, {
            x_fill: false,
            y_fill: false,
            x_align: St.Align.START,
            y_align: St.Align.MIDDLE
        });
        this._buttons.push(aButton);
        this.actor.add(aButton.actor, button_params);
    },

    clear: function() {
        let i = 0,
            iLen = this._buttons.length;
        for (; i < iLen; i++) {
            let button = this._buttons[i];
            button.destroy();
        }
    },

    destroy: function() {
        this.actor.destroy();
    }
};

function CharsCounter() {
    this._init.apply(this, arguments);
}

CharsCounter.prototype = {
    _init: function() {
        this.actor = new St.BoxLayout({
            style_class: "mt-chars-counter-box",
            visible: false
        });

        this._current_length = 0;
        this._max_length = 0;

        this._current_length_label = new St.Label({
            style_class: "mt-chars-counter-text-current"
        });

        this._max_length_label = new St.Label({
            style_class: "mt-chars-counter-text-max"
        });

        this._separator_label = new St.Label({
            style_class: "mt-chars-counter-text-separator",
            text: "/"
        });

        this.actor.add_actor(this._current_length_label);
        this.actor.add_actor(this._separator_label);
        this.actor.add_actor(this._max_length_label);
    },

    _show: function() {
        if (this.actor.visible) {
            return;
        }

        this.actor.opacity = 0;
        this.actor.show();

        Tweener.addTween(this.actor, {
            time: $.getUIAnimationTime(),
            transition: "easeOutQuad",
            opacity: 255
        });
    },

    _hide: function() {
        if (!this.actor.visible) {
            return;
        }

        Tweener.addTween(this.actor, {
            time: $.getUIAnimationTime(),
            transition: "easeOutQuad",
            opacity: 0,
            onCompleteScope: this,
            onComplete: () => {
                this.actor.hide();
                this.actor.opacity = 255;
            }
        });
    },

    _maybe_show: function() {
        if (this._max_length < 1 || this._current_length < 1) {
            this._hide();
            return;
        }

        if (this.actor.visible) {
            return;
        }

        this._show();
    },

    _current_length_changed: function() {
        this._maybe_show();

        let current_length = this._current_length.toString();

        if (this._current_length >= this._max_length) {
            this._current_length_label.add_style_class_name("mt-error");
        } else {
            this._current_length_label.remove_style_class_name("mt-error");
        }

        let clutter_text = this._current_length_label.get_clutter_text();

        Tweener.addTween(this._current_length_label, {
            time: $.getUIAnimationTime(),
            transition: "easeOutQuad",
            opacity: 125,
            onCompleteScope: this,
            onComplete: () => {
                clutter_text.set_text(current_length);

                Tweener.addTween(this._current_length_label, {
                    time: $.getUIAnimationTime(),
                    transition: "easeOutQuad",
                    opacity: 255
                });
            }
        });

        clutter_text.set_text(current_length);
    },

    _max_length_changed: function() {
        this._maybe_show();
        let max_length = this._max_length.toString();
        let clutter_text = this._max_length_label.get_clutter_text();

        Tweener.addTween(this._max_length_label, {
            time: $.getUIAnimationTime(),
            transition: "easeOutQuad",
            opacity: 125,
            onCompleteScope: this,
            onComplete: () => {
                clutter_text.set_text(max_length);

                Tweener.addTween(this._max_length_label, {
                    time: $.getUIAnimationTime(),
                    transition: "easeOutQuad",
                    opacity: 255
                });
            }
        });

        clutter_text.set_text(max_length);
        this._current_length_changed();
    },

    destroy: function() {
        this.actor.destroy();
    },

    get current_length() {
        return this._current_length;
    },

    set current_length(length) {
        this._current_length = length;
        this._current_length_changed();
    },

    get max_length() {
        return this._max_length;
    },

    set max_length(length) {
        this._max_length = length;
        this._max_length_changed();
    }
};

function GoogleTTS() {
    this._init.apply(this, arguments);
}

GoogleTTS.prototype = {
    _init: function(aSpinner) {
        Gst.init(null);

        this._spinner = aSpinner;
        this._player = Gst.ElementFactory.make("playbin", "player");
        this._bus = this._player.get_bus();
        this._bus.add_signal_watch();

        this._bus.connect("message::error", () => this._kill_stream());
        this._bus.connect("message::eos", () => this._kill_stream());
    },

    _kill_stream: function() {
        this._spinner.stop();
        this._player.set_state(Gst.State.NULL);
    },

    speak: function(aText, aLang) {
        let extract = aText.substr(0, TTS_TEXT_MAX_LEN - 1).trim();
        this._kill_stream();

        if (extract) {
            this._spinner.start();
            let uri = TTS_URI.format(extract.length, encodeURIComponent(extract), aLang);
            this._player.set_property("uri", uri);
            this._player.set_state(Gst.State.PLAYING);
        }
    },

    destroy: function() {
        this._player.set_state(Gst.State.NULL);
    }
};

function InfoDialogBase() {
    this._init.apply(this, arguments);
}

InfoDialogBase.prototype = {
    __proto__: BaseDialog.prototype,

    _init: function(aParams) {
        this.params = Params.parse(aParams, {
            title: "",
            name: "",
            dialog_style_class: "",
            title_style_class: "",
            scroll_style_class: ""
        }, true);

        BaseDialog.prototype._init.call(this, {
            name: this.params.name,
            style_class: "mt-base-dialog"
        });

        this._dialogLayout.connect("key-press-event",
            (aActor, aEvent) => this._on_key_press_event(aActor, aEvent));

        if (this.params.dialog_style_class) {
            this._dialogLayout.add_style_class_name(this.params.dialog_style_class);
        }

        this._info_grid_layout = new Clutter.GridLayout({
            orientation: Clutter.Orientation.VERTICAL
        });
        this._info_grid_layout.set_column_spacing(4);
        this._info_grid_layout.set_row_spacing(2);

        this._info_table = new St.Widget({
            layout_manager: this._info_grid_layout
        });

        this._box = new St.BoxLayout({
            vertical: true
        });
        this._box.add_actor(this._info_table);

        this._title = new St.Label({
            text: this.params.title,
            style_class: "mt-base-dialog-title",
            x_expand: true,
            y_expand: false
        });

        if (this.params.title_style_class) {
            this._title.add_style_class_name(this.params.title_style_class);
        }

        this._close_button = new ButtonsBarButton({
            tooltip: $.escapeHTML(_("Close")) + " (<b>%s</b>)".format($.escapeHTML(_("Escape"))),
            icon_name: Icons.close,
            callback: () => this.close(),
            button_style_class: "mt-base-dialog-close-button"
        });

        this._scroll = new St.ScrollView({
            style_class: "mt-base-dialog-scroll"
        });
        this._scroll.add_actor(this._box);

        if (this.params.scroll_style_class) {
            this._scroll.add_style_class_name(this.params.scroll_style_class);
        }

        this._grid_layout = new Clutter.GridLayout({
            orientation: Clutter.Orientation.VERTICAL
        });

        this._table = new St.Widget({
            layout_manager: this._grid_layout
        });

        this._grid_layout.attach(this._title, 0, 0, 1, 1);
        this._grid_layout.attach(this._close_button.actor, 1, 0, 1, 1);
        this._grid_layout.attach(this._scroll, 0, 1, 2, 1);

        this.contentLayout.add_actor(this._table);

        this.populateUI();
    },

    populateUI: function() {
        throw new Error(_("Not implemented"));
    },

    _on_key_press_event: function(aActor, aEvent) {
        let symbol = aEvent.get_key_symbol();

        if (symbol === Clutter.Escape) {
            this.close();

            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    },

    _get_close_button: function() {
        let icon = new St.Icon({
            icon_name: Icons.close,
            icon_type: St.IconType.SYMBOLIC,
            icon_size: 20
        });

        let button = new St.Button({
            reactive: true,
            x_expand: false,
            y_expand: false,
            x_fill: false,
            y_fill: false,
            x_align: St.Align.END,
            y_align: St.Align.MIDDLE
        });
        button.connect("clicked", () => this.close());
        button.add_actor(icon);

        return button;
    },

    _resize: function() {
        let width_percents = Settings.pref_width_percents;
        let height_percents = Settings.pref_height_percents;
        let monitor = Main.layoutManager.currentMonitor;

        let translator_width = Math.round(monitor.width / 100 * width_percents);
        let translator_height = Math.round(monitor.height / 100 * height_percents);

        this._dialogLayout.set_size(translator_width, translator_height);
    },

    close: function() {
        BaseDialog.prototype.close.call(this);
    }
};
Signals.addSignalMethods(InfoDialogBase.prototype);

function HelpDialog() {
    this._init.apply(this, arguments);
}

HelpDialog.prototype = {
    __proto__: InfoDialogBase.prototype,

    _init: function() {
        InfoDialogBase.prototype._init.call(this, {
            title: _("Shortcuts"),
            name: "MultiTranslatorHelp",
            dialog_style_class: "mt-help-dialog",
            title_style_class: "mt-help-dialog-title",
            scroll_style_class: "mt-help-dialog-info"
        });
    },

    populateUI: function() {
        this.openDiagLabel = new St.Label({
            style_class: "mt-help-dialog-info-shortcut"
        });
        this._info_grid_layout.attach(this.openDiagLabel, 0, 0, 1, 1);
        this._info_grid_layout.attach(new St.Label({
            text: _("Open translator dialog."),
            style_class: "mt-help-dialog-info-description"
        }), 1, 0, 1, 1);

        this.transFromClipLabel = new St.Label({
            style_class: "mt-help-dialog-info-shortcut"
        });
        this._info_grid_layout.attach(this.transFromClipLabel, 0, 1, 1, 1);
        this._info_grid_layout.attach(new St.Label({
            text: _("Open translator dialog and translate text from clipboard."),
            style_class: "mt-help-dialog-info-description"
        }), 1, 1, 1, 1);

        this.transFromSelLabel = new St.Label({
            style_class: "mt-help-dialog-info-shortcut"
        });
        this._info_grid_layout.attach(this.transFromSelLabel, 0, 2, 1, 1);
        this._info_grid_layout.attach(new St.Label({
            text: _("Open translator dialog and translate from primary selection."),
            style_class: "mt-help-dialog-info-description"
        }), 1, 2, 1, 1);

        let info = [{
            kb: "F1",
            description: _("Show help dialog.")
        }, {
            kb: "%s + %s".format(_("Ctrl"), _("Enter")),
            description: _("Translate text") + "."
        }, {
            kb: "%s + %s".format(_("Shift"), _("Enter")),
            description: _("Force text translation. Ignores translation history.")
        }, {
            kb: "%s + %s + C".format(_("Ctrl"), _("Shift")),
            description: _("Copy translated text to clipboard.")
        }, {
            kb: "%s + S".format(_("Ctrl")),
            description: _("Swap languages") + "."
        }, {
            kb: "%s + R".format(_("Ctrl")),
            description: _("Reset languages to default.")
        }, {
            kb: "%s + P".format(_("Ctrl")),
            description: _("Provider selector menu") + "."
        }, {
            kb: "%s + M".format(_("Ctrl")),
            description: _("Main menu") + "."
        }, {
            kb: "%s".format(_("Escape")),
            description: _("Close dialog.")
        }];

        /* NOTE: Rows 0, 1 and 2 are already attached.
         * So, start adding from row 3.
         */
        let offset = 3;
        let i = 0,
            iLen = info.length;
        for (; i < iLen; i++) {
            this._info_grid_layout.attach(new St.Label({
                text: info[i].kb + ": ",
                style_class: "mt-help-dialog-info-shortcut"
            }), 0, i + offset, 1, 1);
            this._info_grid_layout.attach(new St.Label({
                text: info[i].description,
                style_class: "mt-help-dialog-info-description"
            }), 1, i + offset, 1, 1);
        }
    },

    updateDynamicLabels: function() {
        /* NOTE: No need to call this on initialization. It is called by the
         * keybindings register function.
         */
        this.openDiagLabel.text = (Settings.pref_open_translator_dialog_keybinding ?
            $.getKeybindingDisplayName(Settings.pref_open_translator_dialog_keybinding).split("+").join(" + ") :
            _("Keybinding not assigned"));

        this.transFromClipLabel.text = (Settings.pref_translate_from_clipboard_keybinding ?
            $.getKeybindingDisplayName(Settings.pref_translate_from_clipboard_keybinding).split("+").join(" + ") :
            _("Keybinding not assigned"));

        this.transFromSelLabel.text = (Settings.pref_translate_from_selection_keybinding ?
            $.getKeybindingDisplayName(Settings.pref_translate_from_selection_keybinding).split("+").join(" + ") :
            _("Keybinding not assigned"));
    },

    _resize: function() {
        InfoDialogBase.prototype._resize.call(this);

        let [dialog_width, dialog_height] = this._dialogLayout.get_size(); // jshint ignore:line
        let scroll_height = Math.round(
            dialog_height -
            this._title.height -
            this._dialogLayout.get_theme_node().get_padding(St.Side.BOTTOM) * 3
        );
        this._scroll.set_size(this._scroll.width, scroll_height);
    }
};

function LanguageChooser() {
    this._init.apply(this, arguments);
}

LanguageChooser.prototype = {
    __proto__: InfoDialogBase.prototype,

    _init: function(aParams) {
        this.params = Params.parse(aParams, {
            title: "",
            name: "",
            dialog_style_class: "mt-language-chooser-dialog",
            title_style_class: "mt-language-chooser-title",
            scroll_style_class: "mt-language-chooser-languages",
            languages: null
        });

        InfoDialogBase.prototype._init.call(this, this.params);

        this._languages = this.params.languages;
    },

    populateUI: function() {
        let search_entry_icon = new St.Icon({
            icon_name: "edit-find",
            icon_type: St.IconType.SYMBOLIC,
            style_class: "mt-language-chooser-search-entry-icon"
        });

        this._search_entry = new St.Entry({
            style_class: "mt-language-chooser-search-entry",
            hint_text: _("Type to search..."),
            track_hover: true,
            can_focus: true
        });
        this._search_entry.add_style_class_name("run-dialog-entry");
        this._search_entry.set_primary_icon(search_entry_icon);
        this._search_entry.connect("key-press-event", (aActor, aEvent) => {
            let symbol = aEvent.get_key_symbol();

            if (symbol === Clutter.Escape) {
                this._search_entry.set_text("");
                this._info_table.grab_key_focus();

                return Clutter.EVENT_STOP;
            }

            return Clutter.EVENT_PROPAGATE;
        });
        this._search_entry.clutter_text.connect(
            "text-changed",
            () => this._update_list()
        );

        this._grid_layout.attach(this._search_entry, 0, 2, 2, 1);

        this.set_languages(this.params.languages);

        this._info_grid_layout.set_column_homogeneous(true);
    },

    _resize: function() {
        InfoDialogBase.prototype._resize.call(this);

        let [dialog_width, dialog_height] = this._dialogLayout.get_size(); // jshint ignore:line
        let scroll_height = Math.round(
            dialog_height -
            this._title.height -
            this._search_entry.height -
            this._dialogLayout.get_theme_node().get_padding(St.Side.BOTTOM) * 3
        );
        this._scroll.set_size(this._scroll.width, scroll_height);
    },

    _on_key_press_event: function(aActor, aEvent) {
        let symbol = aEvent.get_key_symbol();

        if (symbol === Clutter.Escape) {
            this.close();

            return Clutter.EVENT_STOP;
        } else {
            let ch = $.getUnichar(symbol);

            if (ch) {
                this._search_entry.set_text(ch);
                this._search_entry.grab_key_focus();

                return Clutter.EVENT_STOP;
            }
        }

        return Clutter.EVENT_PROPAGATE;
    },

    _update_list: function() {
        this._info_table.destroy_all_children();
        let filtered = {};

        for (let key in this._languages) {
            let lang_name = this._languages[key];
            let lang_code = key;
            let search_text = this._search_entry.get_text().toLowerCase();

            if (!$.startsWith(lang_name.toLowerCase(), search_text)) {
                continue;
            }

            filtered[lang_code] = lang_name;
        }

        this.show_languages("", filtered);
    },

    _get_language_button: function(aLangCode, aLangName) {
        let button = new St.Button({
            label: "%s".format(aLangName),
            track_hover: true,
            reactive: true,
            style_class: "mt-language-chooser-button",
            x_fill: false,
            y_fill: false,
            x_expand: true,
            y_expand: false
        });
        button.connect("clicked", () => {
            this.emit("language-chosen", {
                code: aLangCode,
                name: aLangName
            });
        });
        button.lang_code = aLangCode;
        button.lang_name = aLangName;

        return button;
    },

    show_languages: function(aSelectedLangCode, aLangsList) {
        let row = 0;
        let column = 0;
        let languages = this._languages;

        if (!$.isBlank(aLangsList)) {
            languages = aLangsList;
        }

        let keys = Object.keys(languages);
        keys.sort((a, b) => {
            if (a === "auto") {
                return false;
            }

            a = languages[a];
            b = languages[b];
            return a.localeCompare(b);
        });

        for (let code of keys) {
            let button = this._get_language_button(code, languages[code]);

            if (button.lang_code === aSelectedLangCode) {
                button.add_style_pseudo_class("checked");
                button.set_reactive(false);
            }

            this._info_grid_layout.attach(button, column, row, 1, 1);

            if (column === (LNG_CHOOSER_COLUMNS - 1)) {
                column = 0;
                row++;
            } else {
                column++;
            }
        }
    },

    set_languages: function(aLanguages) {
        if (!aLanguages) {
            return;
        }

        this._languages = aLanguages;
    },

    close: function() {
        this._search_entry.set_text("");
        this._info_table.destroy_all_children();
        InfoDialogBase.prototype.close.call(this);
    }
};

function MostUsedLangsBox() {
    this._init.apply(this, arguments);
}

MostUsedLangsBox.prototype = {
    _init: function(aExtension, aLangType) {
        this._extension = aExtension;
        this._lang_type = aLangType;
        this._langs = [];

        this._box = new St.BoxLayout();
        let label = new ButtonsBarLabel({
            label: _("Most used languages​​"),
            style_class: "mt-most-used-label"
        });
        this._label_container = new ButtonsBar({
            style_class: "mt-most-used-box"
        });
        this._label_container.add_button(label);

        this.buttons = new ButtonsBar({
            style_class: "mt-most-used-box"
        });
        this.buttons.actor.hide();
        this._box.add_actor(this._label_container.actor);
        this._box.add_actor(this.buttons.actor);

        this._show_buttons();
    },

    _show_buttons: function() {
        let langsLen = this._langs.length;

        if (langsLen > 0) {
            this.buttons.actor.show();

            let btnClickedFn = (aLangData) => {
                return () => this.emit("clicked", aLangData);
            };

            let i = 0,
                iLen = langsLen;
            for (; i < iLen; i++) {
                let button = new ButtonsBarButton({
                    label: this._langs[i].lang_name,
                    tooltip: $.escapeHTML(this._lang_type === "source" ?
                        _("Set source language") :
                        _("Set target language")),
                    info_bar: this._extension.transDialog.info_bar,
                    button_style_class: "mt-most-used-button"
                });
                this._langs[i].button = button;
                button.connect("clicked", btnClickedFn(this._langs[i]));
                this.buttons.add_button(button);
            }

            let showLabel = langsLen > 1 ?
                false :
                /* NOTE: Logic about "Most used languages​​" label visibility.
                 * If there is only one most used language, chances are that it is the
                 * currently selected language. And since the currently selected language
                 * is never displayed in the most used list, neither this._label_container
                 * nor the language button will be displayed, leaving the most used bar
                 * empty.
                 * The following condition will display this._label_container if the
                 * only most used language is also the current language.
                 */
                this._langs[0].button !== this._extension["current_" + this._lang_type + "_lang"];
            this._label_container.actor.visible = showLabel;
        } else {
            this._label_container.actor.show();
        }
    },

    reload: function() {
        this.buttons.clear();
        this._show_buttons();
    },

    add_languages: function(aNewLangs) {
        this._langs = this._langs.concat(aNewLangs);
        this.reload();
    },

    set_languages: function(aNewLangs) {
        this._langs = aNewLangs;
        this.reload();
    },

    select: function(aLangCode) {
        let i = this._langs.length;
        while (i--) {
            let lang = this._langs[i];

            if (lang.lang_code === aLangCode) {
                lang.button.actor.hide();
                this.emit("selected", lang);
            } else {
                lang.button.actor.show();
            }
        }
    },

    destroy: function() {
        this._langs = null;
        this._box.destroy();
    },

    get actor() {
        return this._box;
    },

    get languages() {
        return this._langs;
    }
};
Signals.addSignalMethods(MostUsedLangsBox.prototype);

function InfoBarMessage() {
    this._init.apply(this, arguments);
}

InfoBarMessage.prototype = {
    _init: function(aParams) {
        this._text = aParams.message;
        this._markup = this._prepare_message(aParams.message, aParams.type);
        this._type = aParams.type;
        this._timeout = aParams.timeout;
        this._animate = aParams.animate;
    },

    _prepare_message: function(aMessage, aType) {
        aMessage = aMessage.trim();
        aMessage = aMessage.slice(0, STATUS_BAR_MAX_MESSAGE_LENGTH);

        let message_markup = {
            text: aMessage
        };

        switch (aType) {
            case StatusbarMessageType.ERROR:
                message_markup["class"] = "mt-infobar-message-error";
                break;
            case StatusbarMessageType.INFO:
                message_markup["class"] = "mt-infobar-message-info";
                break;
            case StatusbarMessageType.SUCCESS:
                message_markup["class"] = "mt-infobar-message-success";
                break;
            default:
                message_markup["class"] = "mt-infobar-message-info";
        }

        return message_markup;
    },

    get text() {
        return this._text;
    },

    get markup() {
        return this._markup;
    },

    get type() {
        return this._type;
    },

    get timeout() {
        return this._timeout;
    },

    get animate() {
        return this._animate;
    }
};

function InfoBar() {
    this._init.apply(this, arguments);
}

InfoBar.prototype = {
    _init: function() {
        this.actor = new St.BoxLayout({
            style_class: "mt-info_bar",
            visible: false
        });

        this._busy = false;

        this._message_label = new St.Label();
        this._message_label.get_clutter_text().use_markup = true;

        this.actor.add(this._message_label);

        this._messages = {};
    },

    _get_max_id: function() {
        let max_id = Math.max.apply(Math, Object.keys(this._messages));
        let result = max_id > 0 ? max_id : 0;
        return result;
    },

    _generate_id: function() {
        let max_id = this._get_max_id();
        let result = max_id > 0 ? (max_id + 1) : 1;
        return result;
    },

    show_message: function(aId) {
        let message = this._messages.hasOwnProperty(aId) ?
            this._messages[aId] :
            null;

        if (this._busy || message === null || !(message instanceof InfoBarMessage)) {
            return;
        }

        this._busy = true;

        this._message_label.get_clutter_text().set_markup(message.markup.text);
        this._message_label.set_style_class_name(message.markup.class);

        this.actor.opacity = 0;
        this.actor.show();

        if (message.animate) {
            Tweener.addTween(this.actor, {
                time: $.getUIAnimationTime(),
                opacity: 255,
                transition: "easeOutQuad",
                onCompleteScope: this,
                onComplete: () => this._onShowComplete(aId, message)
            });
        } else {
            this.actor.opacity = 255;
            this._onShowComplete(aId, message);
        }
    },

    _onShowComplete: function(aId, aMessage) {
        let timeout = parseInt(aMessage.timeout, 10);

        if (timeout > 0) {
            Mainloop.timeout_add(timeout,
                () => {
                    this._busy = false;
                    this.remove_message(aId);
                    return false;
                }
            );
        } else {
            this._busy = false;
        }
    },

    hide_message: function(aId) {
        if (!this._message_label.visible) {
            return;
        }

        let message = this._messages.hasOwnProperty(aId) ?
            this._messages[aId] :
            null;

        if (this._busy || message === null || !(message instanceof InfoBarMessage)) {
            return;
        }

        this._busy = false;

        if (message.animate) {
            Tweener.addTween(this.actor, {
                time: $.getUIAnimationTime(),
                opacity: 0,
                transition: "easeOutQuad",
                onCompleteScope: this,
                onComplete: () => this.actor.hide()
            });
        } else {
            this.actor.opacity = 0;
            this.actor.hide();
        }
    },

    add_message: function(aParams) {
        let params = Params.parse(aParams, STATUS_BAR_MESSAGE_PARAMS);

        if ($.isBlank(params.message)) {
            return false;
        }

        let message = new InfoBarMessage(params);

        let id = this._generate_id();
        this._messages[id] = message;
        params.store_only || this.show_message(id);

        return id;
    },

    remove_message: function(aId) {
        this.hide_message(aId);
        delete this._messages[aId];
    },

    remove_last: function() {
        let max_id = this._get_max_id();

        if (max_id > 0) {
            this.remove_message(max_id);
        }
    },

    hide_last: function() {
        let max_id = this._get_max_id();

        if (max_id > 0) {
            this.hide_message(max_id);
        }
    },

    clear: function() {
        this.actor.hide();
        this._messages = {};
    },

    destroy: function() {
        this.clear();
        this.actor.destroy();
    }
};

function EntryBase() {
    this._init.apply(this, arguments);
}

EntryBase.prototype = {
    _init: function(aParams) {
        this.params = Params.parse(aParams, {
            box_style_class: "",
            entry_style_class: ""
        });

        this.scroll = new St.ScrollView({
            style_class: "mt-entry-box"
        });
        this.scroll.add_style_class_name("run-dialog-entry");

        if (this.params.box_style_class) {
            this.scroll.add_style_class_name(this.params.box_style_class);
        }

        this.actor = new St.BoxLayout({
            reactive: true,
            x_expand: true,
            y_expand: true,
            x_align: St.Align.END,
            y_align: St.Align.MIDDLE
        });
        this.actor.connect("button-press-event",
            () => {
                this._clutter_text.grab_key_focus();
            }
        );
        this.actor.add(this.scroll, {
            x_fill: true,
            y_fill: true,
            expand: true
        });

        this._entry = new St.Entry({
            style_class: "mt-entry"
        });

        if (this.params.entry_style_class) {
            this._entry.add_style_class_name(this.params.entry_style_class);
        }

        /* NOTE: This is completely useless. When the context menu opens, the selected
         * text in an entry unselects and it cannot be copied with the Copy context item.
         * I thought that I had screwed up something, context menus do not work on anything
         * in Cinnamon. The paste item do work.
         */
        CinnamonEntry.addContextMenu(this._entry);

        this._clutter_text = this._entry.get_clutter_text();
        this._clutter_text.set_single_line_mode(false);
        this._clutter_text.set_activatable(false);
        this._clutter_text.set_line_wrap(true);
        this._clutter_text.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        this._clutter_text.set_max_length(0);
        this._clutter_text.connect("key-press-event",
            (aActor, aEvent) => this._onKeyPressEvent(aActor, aEvent));
        this.set_font_size(Settings.pref_font_size);

        this._font_connection_id = Settings.connect(
            "changed::pref_font_size",
            function() {
                this.set_font_size(Settings.pref_font_size);
            }.bind(this)
        );

        this._box = new St.BoxLayout({
            vertical: true
        });
        this._box.add(this._entry, {
            y_align: St.Align.START,
            y_fill: false
        });

        this.scroll.add_actor(this._box);
    },

    _onKeyPressEvent: function(aActor, aEvent) {
        let symbol = aEvent.get_key_symbol();
        let code = aEvent.get_key_code();
        let state = aEvent.get_state();
        let control_mask = state === Clutter.ModifierType.CONTROL_MASK ||
            state === MagicKeys.CYRILLIC_CONTROL;
        let shift_mask = state === Clutter.ModifierType.SHIFT_MASK ||
            state === MagicKeys.CYRILLIC_SHIFT;

        if (symbol === Clutter.Right) {
            let sel = this._clutter_text.get_selection_bound();

            if (sel === -1) {
                this._clutter_text.set_cursor_position(
                    this._clutter_text.text.length
                );
            }

            return Clutter.EVENT_PROPAGATE;
        } else if (
            control_mask && (code === Clutter.ampersand || code === Clutter.KEY_ampersand)
        ) { // Ctrl + A - Select the content of the active entry.
            this._clutter_text.set_selection(0, this._clutter_text.text.length);

            return Clutter.EVENT_STOP;
        } else if (
            control_mask && code === Clutter.KEY_6
        ) { // Ctrl + C - Copy to clipboard the content of the active entry.
            let clipboard = St.Clipboard.get_default();
            let selection = this._clutter_text.get_selection();
            let text;

            if (!$.isBlank(selection)) {
                text = selection;
            } else {
                text = this._clutter_text.text;
            }

            if (St.ClipboardType) {
                clipboard.set_text(St.ClipboardType.CLIPBOARD, text);
            } else {
                clipboard.set_text(text);
            }

            return Clutter.EVENT_STOP;
        } else if (
            control_mask && code === Clutter.KEY_7
        ) { // Ctrl + V - Append  clipboard content into active entry.
            let clipboard = St.Clipboard.get_default();
            let clipCallback = (clipboard, text) => {
                if (!$.isBlank(text)) {
                    this._clutter_text.delete_selection();
                    this._clutter_text.set_text(
                        this._clutter_text.text + text
                    );

                    return Clutter.EVENT_STOP;
                }

                return Clutter.EVENT_PROPAGATE;
            };

            if (St.ClipboardType) {
                clipboard.get_text(St.ClipboardType.CLIPBOARD, clipCallback);
            } else {
                clipboard.get_text(clipCallback);
            }
        } else if (
            (shift_mask || control_mask) &&
            (symbol === Clutter.Return || symbol === Clutter.KP_Enter)
        ) { // Ctrl + Enter or Shift + Enter - Translate or force translation.
            this.emit("activate", aEvent);
            return Clutter.EVENT_STOP;
        } else {
            if (Settings.pref_logging_level !== LoggingLevel.NORMAL) {
                global.log(JSON.stringify({
                    state: state,
                    symbol: symbol,
                    code: code
                }, null, "\t"));
            }
        }

        return Clutter.EVENT_PROPAGATE;
    },

    destroy: function() {
        if (this._font_connection_id > 0) {
            Settings.disconnect(this._font_connection_id);
        }

        this.actor.destroy();
    },

    grab_key_focus: function() {
        this._clutter_text.grab_key_focus();
    },

    set_size: function(aWidth, aHeight) {
        this.scroll.set_size(aWidth, aHeight);
    },

    set_font_size: function(aSize) {
        let style_string = "font-size: %sem".format(String(aSize));
        this.entry.set_style(style_string);
    },

    get entry() {
        return this._entry;
    },

    get clutter_text() {
        return this._clutter_text;
    },

    get text() {
        return this._entry.get_text();
    },

    set text(text) {
        this._entry.set_text(text);
    },

    get markup() {
        return this._clutter_text.get_markup();
    },

    set markup(markup) {
        this._clutter_text.set_markup(markup);
    },

    get length() {
        return this._entry.get_text().length;
    },

    get is_empty() {
        return this._entry.get_text().length < 1;
    },

    get max_length() {
        return this._clutter_text.get_max_length();
    },

    set max_length(length) {
        length = parseInt(length, 10);
        this._clutter_text.set_max_length(length);
        this.emit("max-length-changed");
    }
};
Signals.addSignalMethods(EntryBase.prototype);

function SourceEntry() {
    this._init.apply(this, arguments);
}

SourceEntry.prototype = {
    __proto__: EntryBase.prototype,

    _init: function() {
        EntryBase.prototype._init.call(this, {
            box_style_class: "mt-source-entry-box"
        });

        let v_adjust = this.scroll.vscroll.adjustment;
        v_adjust.connect("changed", () => {
            v_adjust.value = v_adjust.upper - v_adjust.page_size;
        });
    }
};

function TargetEntry() {
    this._init.apply(this, arguments);
}

TargetEntry.prototype = {
    __proto__: EntryBase.prototype,

    _init: function() {
        EntryBase.prototype._init.call(this, {
            box_style_class: "mt-target-entry-box"
        });

        this._clutter_text.set_editable(false);
        this.actor.connect("button-press-event", () => {
            this._clutter_text.set_editable(true);
        });
        this._clutter_text.connect("button-press-event",
            () => {
                this._clutter_text.set_editable(true);
                this._clutter_text.grab_key_focus();
            }
        );
        this._clutter_text.connect("key-focus-out", () => {
            this._clutter_text.set_editable(false);
        });
    }
};

function TranslatorDialog() {
    this._init.apply(this, arguments);
}

TranslatorDialog.prototype = {
    __proto__: BaseDialog.prototype,

    _init: function(aExtension) {
        BaseDialog.prototype._init.call(this, {
            name: "MultiTranslatorDialog",
            style_class: "mt-translator-dialog",
            cinnamonReactive: true
        });

        /* Row 4 START */
        this._info_bar = new InfoBar();
        this._info_bar.actor.set_x_align(Clutter.ActorAlign.CENTER);
        /* Row 4 END */

        this._extension = aExtension;
        this._most_used_bar = false;
        this._spinner = new Spinner();
        this._google_tts = new GoogleTTS(this._spinner);

        this._grid_layout = new Clutter.GridLayout({
            orientation: Clutter.Orientation.VERTICAL
        });
        this._grid_layout.set_column_spacing(4);
        this._grid_layout.set_row_spacing(2);

        this._table = new St.Widget({
            layout_manager: this._grid_layout
        });

        this._connection_ids = {
            source_scroll: 0,
            target_scroll: 0,
            sync_scroll_settings: 0,
            show_most_used: 0
        };

        /* Row 0 START */
        this._source_topbar = new ButtonsBar({
            style_class: "mt-source-topbar"
        });
        this._target_topbar = new ButtonsBar({
            style_class: "mt-target-topbar"
        });
        /* Row 0 END */

        /* Row 2 START */
        this._source_entry = new SourceEntry();
        this._source_entry.clutter_text.connect(
            "text-changed",
            () => this._on_source_changed()
        );
        this._source_entry.connect("max-length-changed",
            () => {
                this._chars_counter.max_length = this._source_entry.max_length;
            }
        );

        this._action_bars_container = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            y_expand: true,
            x_align: St.Align.MIDDLE,
            y_align: St.Align.START
        });

        this._spinner_container = new ButtonsBar({
            style_class: "mt-spinner-box",
            vertical: true
        });
        this._spinner_container.actor.set_y_align(Clutter.ActorAlign.CENTER);
        this._spinner_container.add_button(this._spinner.spinner);

        this._action_bar_1 = new ButtonsBar({
            style_class: "mt-actionbar",
            vertical: true
        });
        this._action_bar_1.actor.set_y_align(Clutter.ActorAlign.START);
        this._action_bar_1.actor.set_y_expand(true);

        this._action_bar_2 = new ButtonsBar({
            style_class: "mt-actionbar",
            vertical: true
        });
        this._action_bar_2.actor.set_y_align(Clutter.ActorAlign.END);
        this._action_bar_2.actor.set_y_expand(true);

        this._action_bars_container.add(this._action_bar_1.actor, {
            expand: true,
            x_fill: true,
            y_fill: true,
            x_align: St.Align.MIDDLE,
            y_align: St.Align.START
        });

        this._action_bars_container.add(this._spinner_container.actor, {
            expand: false,
            x_fill: false,
            y_fill: false,
            x_align: St.Align.MIDDLE,
            y_align: St.Align.MIDDLE
        });

        this._action_bars_container.add(this._action_bar_2.actor, {
            expand: true,
            x_fill: true,
            y_fill: true,
            x_align: St.Align.MIDDLE,
            y_align: St.Align.END
        });

        this._target_entry = new TargetEntry();
        this._target_entry.clutter_text.connect(
            "text-changed",
            () => this._on_target_changed()
        );
        /* Row 2 END */

        /* Row 3 START */
        this._chars_counter = new CharsCounter();

        this._provider_button = new ButtonsBarButton({
            label: "DUMMY",
            tooltip: $.escapeHTML(_("Go to provider's website")),
            button_style_class: "mt-provider-button",
            info_bar: this._info_bar,
            callback: () => {
                this.close();
                Util.spawn_async([
                    "gvfs-open",
                    ProviderData.website[this._extension.providersManager.current.provider_name]
                ], null);
            }
        });

        this._listen_source_button = new ButtonsBarButton({
            icon_name: Icons.listen,
            tooltip: $.escapeHTML(_("Listen")),
            button_style_class: "mt-listen-button",
            info_bar: this._info_bar,
            callback: () => {
                let langCode = this._extension.current_source_lang;

                if (this._extension.current_source_lang === "auto") {
                    langCode = "en";
                    this.info_bar.add_message({
                        message: _("Language for listening enforced to English"),
                        timeout: 2000
                    });
                }

                this.google_tts.speak(
                    this._source_entry.text,
                    langCode
                );
            }
        });
        this._listen_source_button.hide();

        this._listen_target_button = new ButtonsBarButton({
            icon_name: Icons.listen,
            tooltip: $.escapeHTML(_("Listen")),
            button_style_class: "mt-listen-button",
            info_bar: this._info_bar,
            callback: () => {
                let lines_count = this._source_entry.text.split("\n").length;
                let translation = this._target_entry.text.split("\n");

                if (translation[0] === "[" + _("History") + "]") {
                    translation.shift();
                }

                this.google_tts.speak(
                    translation.slice(0, lines_count).join("\n"),
                    this._extension.current_target_lang
                );
            }
        });
        this._listen_target_button.hide();

        this._source_bottombar_left = new ButtonsBar({
            style_class: "mt-source-bottombar-left"
        });
        this._source_bottombar_left.actor.set_x_align(Clutter.ActorAlign.START);
        this._source_bottombar_left.add_button(this._chars_counter);

        this._source_bottombar_right = new ButtonsBar({
            style_class: "mt-source-bottombar-right"
        });
        this._source_bottombar_right.actor.set_x_align(Clutter.ActorAlign.END);
        this._source_bottombar_right.add_button(this._listen_source_button);

        this._target_bottombar_left = new ButtonsBar({
            style_class: "mt-target-bottombar-left"
        });
        this._target_bottombar_left.actor.set_x_align(Clutter.ActorAlign.START);
        this._target_bottombar_left.add_button(this._listen_target_button);

        this._target_bottombar_right = new ButtonsBar({
            style_class: "mt-target-bottombar-right"
        });
        this._target_bottombar_right.actor.set_x_align(Clutter.ActorAlign.END);
        this._target_bottombar_right.add_button(this._provider_button);
        /* Row 3 END */

        /* NOTE: Row 4 is defined at the begening because the info_ bar
         * is used in several places.
         */

        /* ROW 0 */
        this._grid_layout.attach(this._source_topbar.actor, 0, 0, 2, 1);
        this._grid_layout.attach(this._target_topbar.actor, 3, 0, 2, 1);
        /* ROW 2 */
        this._grid_layout.attach(this._source_entry.actor, 0, 2, 2, 1);
        this._grid_layout.attach(this._action_bars_container, 2, 2, 1, 1);
        this._grid_layout.attach(this._target_entry.actor, 3, 2, 2, 1);
        /* ROW 3 */
        this._grid_layout.attach(this._source_bottombar_left.actor, 0, 3, 1, 1);
        this._grid_layout.attach(this._source_bottombar_right.actor, 1, 3, 1, 1);
        this._grid_layout.attach(this._target_bottombar_left.actor, 3, 3, 1, 1);
        this._grid_layout.attach(this._target_bottombar_right.actor, 4, 3, 1, 1);
        /* ROW 4 */
        this._grid_layout.attach(this._info_bar.actor, 0, 4, 5, 1);

        this._init_most_used_bar();

        this.contentLayout.add(this._table);

        this._init_scroll_sync();
    },

    _on_source_changed: function() {
        this._chars_counter.current_length = this._source_entry.length;

        if (this._source_entry.is_empty) {
            this._listen_source_button.hide();
        } else {
            this._listen_source_button.show();
        }
    },

    _on_target_changed: function() {
        if (this._target_entry.is_empty) {
            this._listen_target_button.hide();
        } else {
            this._listen_target_button.show();
        }
    },

    _init_scroll_sync: function() {
        if (Settings.pref_sync_entries_scrolling) {
            this.sync_entries_scroll();
        }

        this._connection_ids.sync_scroll_settings = Settings.connect(
            "changed::pref_sync_entries_scrolling",
            function() {
                let sync = Settings.pref_sync_entries_scrolling;

                if (sync) {
                    this.sync_entries_scroll();
                } else {
                    this.unsync_entries_scroll();
                }
            }.bind(this)
        );
    },

    _init_most_used_bar: function() {
        if (Settings.pref_show_most_used) {
            this._show_most_used_bar();
        }

        this._connection_ids.show_most_used = Settings.connect(
            "changed::pref_show_most_used",
            function() {
                if (Settings.pref_show_most_used) {
                    this._show_most_used_bar();
                } else {
                    this._hide_most_used_bar();
                }
            }.bind(this)
        );
    },

    _show_most_used_bar: function() {
        if (!this._most_used_bar) {
            this._most_used_sources = new MostUsedLangsBox(this._extension, "source");
            this._most_used_targets = new MostUsedLangsBox(this._extension, "target");
            this._most_used_bar = true;
        }

        /* ROW 1 */
        this._grid_layout.attach(this._most_used_sources.actor, 0, 1, 2, 1);
        this._grid_layout.attach(this._most_used_targets.actor, 3, 1, 2, 1);
    },

    _hide_most_used_bar: function() {
        if (this._most_used_bar) {
            this._most_used_sources.destroy();
            this._most_used_targets.destroy();
            this._most_used_bar = false;
        }
    },

    _get_info_bar_height: function() {
        let message_id = this._info_bar.add_message({
            message: "DUMMY MESSAGE",
            timeout: 0
        });
        let [minHeight, naturalHeight] = this._info_bar.actor.get_preferred_height(-1); // jshint ignore:line
        this._info_bar.remove_message(message_id);

        return naturalHeight;
    },

    _resize: function() {
        let width_percents = Settings.pref_width_percents;
        let height_percents = Settings.pref_height_percents;
        let monitor = Main.layoutManager.currentMonitor;

        let translator_width = Math.round(monitor.width / 100 * width_percents);
        let translator_height = Math.round(monitor.height / 100 * height_percents);

        this._dialogLayout.set_size(
            translator_width + (this._dialogLayout.get_theme_node().get_padding(St.Side.LEFT) * 2),
            translator_height + (this._dialogLayout.get_theme_node().get_padding(St.Side.TOP) * 2)
        );

        let text_box_width = Math.round(
            (translator_width / 2) -
            (this._action_bars_container.width / 2) - 10
        );
        let text_box_height = translator_height;
        /* Row 0 */
        text_box_height -= Math.max(
            this._source_topbar.actor.height,
            this._target_topbar.actor.height
        );
        /* Row 1 */
        if (this._most_used_bar) {
            text_box_height -= Math.max(
                this._most_used_sources.actor.height,
                this._most_used_targets.actor.height
            );
        }
        /* Row 2 is where the entries are. */
        /* Row 3 */
        text_box_height -= Math.max(
            this._source_bottombar_left.actor.height,
            this._source_bottombar_right.actor.height,
            this._target_bottombar_left.actor.height,
            this._target_bottombar_right.actor.height
        );
        /* Row 4 */
        text_box_height -= this._info_bar.actor.height;
        text_box_height -= 10;

        this._source_entry.set_size(text_box_width, text_box_height);
        this._target_entry.set_size(text_box_width, text_box_height);
        this._source_topbar.actor.set_width(text_box_width);
        this._target_topbar.actor.set_width(text_box_width);

        /* NOTE: Force the most used language bar to the same width as the entries.
         * This will avoid the language buttons to go out of the dialog and force the
         * ellipsizing of their labels.
         */
        if (this._most_used_bar) {
            this._most_used_sources.actor.set_width(text_box_width);
            this._most_used_targets.actor.set_width(text_box_width);
        }
    },

    sync_entries_scroll: function() {
        if (this._connection_ids.source_scroll < 1) {
            let source_v_adjust = this._source_entry.scroll.vscroll.adjustment;
            this._connection_ids.source_scroll = source_v_adjust.connect(
                "notify::value",
                (adjustment) => {
                    let target_adjustment = this._target_entry.scroll.vscroll.adjustment;

                    if (target_adjustment.value === adjustment.value) {
                        return;
                    }

                    target_adjustment.value = adjustment.value;
                    adjustment.upper = adjustment.upper > target_adjustment.upper ? adjustment.upper : target_adjustment.upper;
                }
            );
        }

        if (this._connection_ids.target_scroll < 1) {
            let target_v_adjust = this._target_entry.scroll.vscroll.adjustment;
            this._connection_ids.target_scroll = target_v_adjust.connect(
                "notify::value",
                (adjustment) => {
                    let source_adjustment = this._source_entry.scroll.vscroll.adjustment;

                    if (source_adjustment.value === adjustment.value) {
                        return;
                    }

                    source_adjustment.value = adjustment.value;

                    adjustment.upper = adjustment.upper > source_adjustment.upper ? adjustment.upper : source_adjustment.upper;
                }
            );
        }
    },

    unsync_entries_scroll: function() {
        if (this._connection_ids.source_scroll > 0) {
            let source_v_adjust = this._source_entry.scroll.vscroll.adjustment;
            source_v_adjust.disconnect(this._connection_ids.source_scroll);
            this._connection_ids.source_scroll = 0;
        }

        if (this._connection_ids.target_scroll > 0) {
            let target_v_adjust = this._target_entry.scroll.vscroll.adjustment;
            target_v_adjust.disconnect(this._connection_ids.target_scroll);
            this._connection_ids.target_scroll = 0;
        }
    },

    close: function() {
        this._extension.closeAllMenus();
        BaseDialog.prototype.close.call(this);
    },

    destroy: function() {
        this.unsync_entries_scroll();

        if (this._connection_ids.sync_scroll_settings > 0) {
            Settings.disconnect(this._connection_ids.sync_scroll_settings);
        }

        if (this._connection_ids.show_most_used > 0) {
            Settings.disconnect(this._connection_ids.show_most_used);
        }

        this._source_topbar.destroy();
        this._target_topbar.destroy();
        this._source_entry.destroy();
        this._target_entry.destroy();
        this._chars_counter.destroy();
        this._provider_button.destroy();
        this._listen_source_button.destroy();
        this._listen_target_button.destroy();
        this._info_bar.destroy();
        this._google_tts.destroy();

        this._extension = null;

        BaseDialog.prototype.destroy.call(this);
    },

    get source_topbar() {
        return this._source_topbar;
    },

    get target_topbar() {
        return this._target_topbar;
    },

    get most_used() {
        let r = {
            sources: this._most_used_sources,
            targets: this._most_used_targets
        };
        return r;
    },

    get source_entry() {
        return this._source_entry;
    },

    get action_bar_1() {
        return this._action_bar_1;
    },

    get action_bar_2() {
        return this._action_bar_2;
    },

    get spinner() {
        return this._spinner;
    },

    get target_entry() {
        return this._target_entry;
    },

    get info_bar() {
        return this._info_bar;
    },

    get provider_button() {
        return this._provider_button;
    },

    get dialog_layout() {
        return this._dialogLayout;
    },

    get google_tts() {
        return this._google_tts;
    }
};

function DialogPopup() {
    this._init.apply(this, arguments);
}

DialogPopup.prototype = {
    __proto__: PopupMenu.PopupMenu.prototype,

    _init: function(aButton, aTransDialog, aPopupSide) {
        this._button = aButton;
        this._transDialog = aTransDialog;

        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if ($.versionCompare(CINNAMON_VERSION, "3.2") < 0) {
            PopupMenu.PopupMenu.prototype._init.call(this, this._button.actor, 0.5, aPopupSide);
        } else {
            PopupMenu.PopupMenu.prototype._init.call(this, this._button.actor, aPopupSide);
        }

        this.actor.hide();
        Main.uiGroup.add_actor(this.actor);

        this._transDialog.source_entry.actor.connect("button-press-event",
            () => this.close());
        this._transDialog.target_entry.actor.connect("button-press-event",
            () => this.close());
    },

    add_item: function(aParams) {
        let params = Params.parse(aParams, DIALOG_POPUP_ITEM_PARAMS);

        let item,
            requiresTransShell = /TS$/.test(params.label);

        if (params.label === "separator") {
            item = new PopupMenu.PopupSeparatorMenuItem();
        } else {
            let display_name = params.is_translators_popup ?
                ProviderData.display_name[params.label] :
                params.label;

            if (params.is_translators_popup && requiresTransShell) {
                display_name += " (*)";
            }

            if (params.icon_name) {
                item = new PopupMenu.PopupIconMenuItem(
                    display_name,
                    params.icon_name,
                    (/\-symbolic$/.test(params.icon_name) ?
                        St.IconType.SYMBOLIC :
                        St.IconType.FULLCOLOR)
                );

                item._icon.set_icon_size(18);
            } else {
                item = new PopupMenu.PopupMenuItem(display_name);
            }

            if (params.callback) {
                item.connect("activate", () => {
                    params.callback();
                    this.close();
                });
            }
        }

        if (params.is_translators_popup) {
            let tt_text = _("This translation provider doesn't require translate-shell to work.");

            if (requiresTransShell) {
                tt_text = _("This translation provider requires translate-shell to work.") + "\n" +
                    _("See the extended help of this extension for more information.");
            }

            item.tooltip = new $.CustomTooltip(item.actor, tt_text);
        }

        this.addMenuItem(item);
    },

    open: function() {
        this.addMenuItem(new PopupMenu.PopupMenuItem(
            _("Press <Esc> to close"), {
                style_class: "popup-inactive-menu-item",
                reactive: false,
                activate: false,
                hover: false,
                sensitive: false,
                focusOnHover: false
            }
        ));

        PopupMenu.PopupMenu.prototype.open.call(this, true);
        this.firstMenuItem.actor.grab_key_focus();
    },

    close: function() {
        if (this.isOpen) {
            PopupMenu.PopupMenu.prototype.close.call(this, true);
            this._transDialog.source_entry.grab_key_focus();
            this.destroy();
        }
    },

    destroy: function() {
        this.removeAll();
        this.actor.destroy();

        this.emit("destroy");
    }
};

function Spinner() {
    this._init.apply(this, arguments);
}

Spinner.prototype = {
    _init: function(aParams) {
        let params = Params.parse(aParams, SPINNER_PARAMS);

        this.spinner = new ButtonsBarButton({
            label: "0",
            button_style_class: "mt-spinner",
            track_hover: false,
            reactive: false,
        });
        this.spinner.connect("destroy", () => this._onDestroy());
        this.spinner.hide();

        this._speed = params.speed;
        this._sequence = params.sequence;

        this._isPlaying = false;
        this._timeoutId = 0;
        this._frame = 0;
    },

    start: function() {
        if (this._isPlaying) {
            this.stop();
        }

        if (this._timeoutId === 0) {
            if (this._frame === 0) {
                this._showFrame(0);
            }

            this._timeoutId = GLib.timeout_add(
                GLib.PRIORITY_LOW,
                this._speed,
                () => this._update()
            );
            GLib.Source.set_name_by_id(
                this._timeoutId,
                "[%s] Spinner".format(_(XletMeta.name))
            );
        }

        this.spinner.show();

        this._isPlaying = true;
    },

    stop: function() {
        this.spinner.hide();

        if (this._timeoutId > 0) {
            Mainloop.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }

        this._isPlaying = false;
    },

    _showFrame: function(aFrame) {
        this.spinner.label = this._sequence[aFrame > this._sequence.length ? 0 : aFrame];

        this._frame = (aFrame % (this._sequence.length - 1));
    },

    _update: function() {
        this._showFrame(this._frame + 1);
        return GLib.SOURCE_CONTINUE;
    },

    _onDestroy: function() {
        this.stop();
    }
};

if (Settings.pref_logging_level === LoggingLevel.VERY_VERBOSE || Settings.pref_debugger_enabled) {
    try {
        let protos = {
            BaseDialog: BaseDialog,
            ButtonsBar: ButtonsBar,
            ButtonsBarButton: ButtonsBarButton,
            ButtonsBarLabel: ButtonsBarLabel,
            CharsCounter: CharsCounter,
            DialogPopup: DialogPopup,
            EntryBase: EntryBase,
            GoogleTTS: GoogleTTS,
            HelpDialog: HelpDialog,
            InfoBar: InfoBar,
            InfoBarMessage: InfoBarMessage,
            InfoDialogBase: InfoDialogBase,
            LanguageChooser: LanguageChooser,
            MostUsedLangsBox: MostUsedLangsBox,
            SourceEntry: SourceEntry,
            Spinner: Spinner,
            TargetEntry: TargetEntry,
            TranslatorDialog: TranslatorDialog,
        };

        for (let name in protos) {
            $.prototypeDebugger(protos[name], {
                objectName: name,
                verbose: Settings.pref_logging_level == LoggingLevel.VERY_VERBOSE,
                debug: Settings.pref_debugger_enabled
            });
        }
    } catch (aErr) {
        global.logError(aErr);
    }
}
