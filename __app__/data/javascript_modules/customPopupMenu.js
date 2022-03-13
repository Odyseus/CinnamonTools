const {
    gi: {
        Clutter
    },
    misc: {
        params: Params
    },
    ui: {
        popupMenu: PopupMenu
    }
} = imports;

var SLIDER_SCALE = 0.00025;

var CustomPopupSliderMenuItemParams = Object.freeze({
    value: "",
    associated_submenu: "",
    tooltip: "",
    value_changed_cb: null,
    drag_begin_cb: null,
    drag_end_cb: null
});

var CustomPopupSliderMenuItem = class CustomPopupSliderMenuItem extends PopupMenu.PopupSliderMenuItem {
    constructor(aParams) {
        super(0);

        this.params = Params.parse(aParams, CustomPopupSliderMenuItemParams);

        this._signals.connect(this, "value-changed", this.params.value_changed_cb);
        this._signals.connect(this, "drag-begin", this.params.drag_begin_cb);
        this._signals.connect(this, "drag-end", this.params.drag_end_cb);
    }

    _onScrollEvent(aActor, aEvent) {
        const direction = aEvent.get_scroll_direction();
        const scale = this.ctrlKey ? SLIDER_SCALE * 11.5 : SLIDER_SCALE;

        if (direction === Clutter.ScrollDirection.DOWN) {
            // Original "scale" was 0.05.
            this._value = Math.max(0, this._value - scale);
        } else if (direction === Clutter.ScrollDirection.UP) {
            this._value = Math.min(1, this._value + scale);
        }

        this._slider.queue_repaint();
        this.emit("value-changed", this._value);
    }

    _onKeyPressEvent(aActor, aEvent) {
        const key = aEvent.get_key_symbol();
        const scale = this.ctrlKey ? SLIDER_SCALE * 11.5 : SLIDER_SCALE;

        if (key === Clutter.KEY_Right || key === Clutter.KEY_Left) {
            // Original "scale" was 0.1.
            const delta = key === Clutter.KEY_Right ? scale : -scale;
            this._value = Math.max(0, Math.min(this._value + delta, 1));
            this._slider.queue_repaint();
            this.emit("value-changed", this._value);
            this.emit("drag-end");
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    get ctrlKey() {
        return (Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2]) !== 0;
    }
};

/* exported CustomPopupSliderMenuItem
 */
