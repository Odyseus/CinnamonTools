const Applet = imports.ui.applet;
const AppletManager = imports.ui.appletManager;
const AppletUUID = "{{UUID}}";
const Cinnamon = imports.gi.Cinnamon;
const Clutter = imports.gi.Clutter;
const DND = imports.ui.dnd;
const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Meta = imports.gi.Meta;
const PopupMenu = imports.ui.popupMenu;
const SignalManager = imports.misc.signalManager;
const St = imports.gi.St;
const Tooltips = imports.ui.tooltips;
const Util = imports.misc.util;

var CINNAMON_VERSION = GLib.getenv("CINNAMON_VERSION");

Gettext.bindtextdomain(AppletUUID, GLib.get_home_dir() + "/.local/share/locale");

/**
 * Return the localized translation of a string, based on the xlet domain or
 * the current global domain (Cinnamon's).
 *
 * This function "overrides" the _() function globally defined by Cinnamon.
 *
 * @param {String} aStr - The string being translated.
 *
 * @return {String} The translated string.
 */
function _(aStr) {
    let customTrans = Gettext.dgettext(AppletUUID, aStr);

    if (customTrans !== aStr && aStr !== "") {
        return customTrans;
    }

    return Gettext.gettext(aStr);
}

const HORIZONTAL_ICON_SIZE = 16; // too bad this can't be defined in theme (cinnamon-app.create_icon_texture returns a clutter actor, not a themable object -
// probably something that could be addressed
const ICON_HEIGHT_FACTOR = 0.75;
const VERTICAL_ICON_HEIGHT_FACTOR = 0.75;
const MAX_TEXT_LENGTH = 1000;
const FLASH_INTERVAL = 500;

const WINDOW_PREVIEW_WIDTH = 200;
const WINDOW_PREVIEW_HEIGHT = 150;

function WindowPreview() {
    this._init.apply(this, arguments);
}

WindowPreview.prototype = {
    __proto__: Tooltips.TooltipBase.prototype,

    _init: function(item, metaWindow, previewScale, showLabel) {
        Tooltips.TooltipBase.prototype._init.call(this, item.actor);
        this._applet = item._applet;
        this.uiScale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        this.thumbScale = previewScale;
        this.metaWindow = metaWindow;
        this.muffinWindow = null;
        this._sizeChangedId = null;

        // Mark for deletion on EOL. Cinnamon 3.6.x+
        // window-list-preview class introduced in Cinnamon 3.6.x+
        let actorParams = {
            vertical: true,
            style_class: versionCompare(CINNAMON_VERSION, "3.6.6") >= 0 ? "window-list-preview" : "switcher-list",
            important: true
        };

        if (versionCompare(CINNAMON_VERSION, "3.6.6") >= 0) {
            actorParams["style"] = "margin: 0px; padding: 4px;";
        }

        this.actor = new St.BoxLayout(actorParams);
        this.actor.show_on_set_parent = false;
        Main.uiGroup.add_actor(this.actor);

        this.label = new St.Label();
        this.labelBin = new St.Bin({
            y_align: St.Align.MIDDLE
        });
        this.labelBin.set_width(WINDOW_PREVIEW_WIDTH * this.thumbScale * this.uiScale);
        this.labelBin.add_actor(this.label);
        this.actor.add_actor(this.labelBin);

        if (!showLabel) {
            this.labelBin.hide();
        }

        this.thumbnailBin = new St.Bin();
        this.actor.add_actor(this.thumbnailBin);
    },

    _onEnterEvent: function(actor, event) {
        if (this._applet._tooltipShowing) {
            this.show();
        } else if (!this._showTimer) {
            this._showTimer = Mainloop.timeout_add(300,
                // Condition needed for retro-compatibility.
                // Mark for deletion on EOL. Cinnamon 3.2.x+
                () => {
                    (typeof this._onShowTimerComplete === "function" ?
                        this._onShowTimerComplete() :
                        this._onTimerComplete());
                }
            );
        }

        this.mousePosition = event.get_coords();
    },

    _getScaledTextureSize: function(windowTexture) {
        let [width, height] = windowTexture.get_size();
        let scale = this.thumbScale * this.uiScale *
            Math.min(WINDOW_PREVIEW_WIDTH / width, WINDOW_PREVIEW_HEIGHT / height);
        return [width * scale,
            height * scale
        ];
    },

    _hide: function(actor, event) {
        Tooltips.TooltipBase.prototype._hide.call(this, actor, event);
        this._applet.erodeTooltip();
    },

    show: function() {
        if (!this.actor || this._applet._menuOpen) {
            return;
        }

        this.muffinWindow = this.metaWindow.get_compositor_private();
        let windowTexture = this.muffinWindow.get_texture();
        let [width, height] = this._getScaledTextureSize(windowTexture);

        if (this.thumbnail) {
            this.thumbnailBin.set_child(null);
            this.thumbnail.destroy();
        }

        this.thumbnail = new Clutter.Clone({
            source: windowTexture,
            width: width,
            height: height
        });

        this._sizeChangedId = this.muffinWindow.connect("size-changed",
            () => {
                let [width, height] = this._getScaledTextureSize(windowTexture);
                this.thumbnail.set_size(width, height);
            });

        this.thumbnailBin.set_child(this.thumbnail);

        let allocation = this.actor.get_allocation_box();
        let previewHeight = allocation.y2 - allocation.y1;
        let previewWidth = allocation.x2 - allocation.x1;

        let monitor = Main.layoutManager.findMonitorForActor(this.item);
        let previewTop;

        if (this._applet.orientation == St.Side.BOTTOM) {
            previewTop = this.item.get_transformed_position()[1] - previewHeight - 5;
        } else if (this._applet.orientation == St.Side.TOP) {
            previewTop = this.item.get_transformed_position()[1] + this.item.get_transformed_size()[1] + 5;
        } else {
            previewTop = this.item.get_transformed_position()[1];
        }

        let previewLeft;
        if (this._applet.orientation == St.Side.BOTTOM || this._applet.orientation == St.Side.TOP) {
            // centre the applet on the window list item if window list is on the top or bottom panel
            previewLeft = this.item.get_transformed_position()[0] + this.item.get_transformed_size()[0] / 2 - previewWidth / 2;
        } else if (this._applet.orientation == St.Side.LEFT) {
            previewLeft = this.item.get_transformed_position()[0] + this.item.get_transformed_size()[0] + 5;
        } else if (this._applet.orientation == St.Side.RIGHT) {
            previewLeft = this.item.get_transformed_position()[0] - previewWidth - 5;
        }
        previewLeft = Math.round(previewLeft);
        previewLeft = Math.max(previewLeft, monitor.x);
        previewLeft = Math.min(previewLeft, monitor.x + monitor.width - previewWidth);

        previewTop = Math.round(previewTop);
        previewTop = Math.min(previewTop, monitor.y + monitor.height - previewHeight);

        this.actor.set_position(previewLeft, previewTop);

        this.actor.show();
        this.visible = true;
        this._applet.cancelErodeTooltip();
        this._applet._tooltipShowing = true;
    },

    hide: function() {
        if (this._sizeChangedId != null) {
            this.muffinWindow.disconnect(this._sizeChangedId);
            this._sizeChangedId = null;
        }
        if (this.thumbnail) {
            this.thumbnailBin.set_child(null);
            this.thumbnail.destroy();
        }
        if (this.actor) {
            this.actor.hide();
        }
        this.visible = false;
    },

    set_text: function(text) {
        this.label.set_text(text);
    },

    _destroy: function() {
        if (this._sizeChangedId != null) {
            this.muffinWindow.disconnect(this._sizeChangedId);
            this.sizeChangedId = null;
        }
        if (this.thumbnail) {
            this.thumbnailBin.set_child(null);
            this.thumbnail.destroy();
        }
        if (this.actor) {
            this.actor.destroy();
        }
        this.actor = null;
    }
};

function AppMenuButton() {
    this._init.apply(this, arguments);
}

AppMenuButton.prototype = {
    _init: function(applet, metaWindow, alert) {

        this.actor = new Cinnamon.GenericContainer({
            name: "appMenu",
            style_class: "window-list-item-box",
            reactive: true,
            can_focus: true,
            track_hover: true
        });

        this._applet = applet;
        this.metaWindow = metaWindow;
        this.alert = alert;
        this.labelVisible = false;
        this.window_signals = new SignalManager.SignalManager(null);

        if (this._applet.orientation == St.Side.TOP) {
            this.actor.add_style_class_name("top");
        } else if (this._applet.orientation == St.Side.BOTTOM) {
            this.actor.add_style_class_name("bottom");
        } else if (this._applet.orientation == St.Side.LEFT) {
            this.actor.add_style_class_name("left");
        } else if (this._applet.orientation == St.Side.RIGHT) {
            this.actor.add_style_class_name("right");
        }

        if (this._applet.pref_hide_labels) {
            this.actor.set_style("padding: 0;");
        }

        this.actor._delegate = this;
        this.actor.connect("button-release-event",
            (aActor, aEvent) => this._onButtonRelease(aActor, aEvent));
        this.actor.connect("button-press-event",
            (aActor, aEvent) => this._onButtonPress(aActor, aEvent));

        this.actor.connect("get-preferred-width",
            (actor, forHeight, alloc) => {
                this._getPreferredWidth(actor, forHeight, alloc);
            });
        this.actor.connect("get-preferred-height",
            (actor, forWidth, alloc) => {
                this._getPreferredHeight(actor, forWidth, alloc);
            });
        this.actor.connect("allocate",
            (actor, box, flags) => this._allocate(actor, box, flags));

        this.progressOverlay = new St.Widget({
            style_class: "progress",
            reactive: false,
            important: true
        });

        this.actor.add_actor(this.progressOverlay);

        this._iconBox = new Cinnamon.Slicer({
            name: "appMenuIcon"
        });
        this._iconBox.connect("style-changed",
            () => this._onIconBoxStyleChanged());
        this._iconBox.connect("notify::allocation",
            () => this._updateIconBoxClipAndGeometry());
        this.actor.add_actor(this._iconBox);

        this._label = new St.Label();
        this.actor.add_actor(this._label);

        this.updateLabelVisible();

        this._iconBottomClip = 0;
        this._visible = true;

        this._progress = 0;

        if (this.metaWindow.progress !== undefined) {
            this._progress = this.metaWindow.progress;
            if (this._progress > 0) {
                this.progressOverlay.show();
            } else {
                this.progressOverlay.hide();
            }
            this._updateProgressId = this.metaWindow.connect("notify::progress", () => {
                if (this.metaWindow.progress != this._progress) {
                    this._progress = this.metaWindow.progress;

                    if (this._progress > 0) {
                        this.progressOverlay.show();
                    } else {
                        this.progressOverlay.hide();
                    }

                    this.actor.queue_relayout();
                }
            });
        } else {
            this.progressOverlay.hide();
        }

        /* TODO: this._progressPulse = this.metaWindow.progress_pulse; */

        this.onPreviewChanged();

        if (!this.alert) {
            this._menuManager = new PopupMenu.PopupMenuManager(this);
            this.rightClickMenu = new AppMenuButtonRightClickMenu(this, this.metaWindow, this._applet.orientation);
            this._menuManager.addMenu(this.rightClickMenu);

            this._draggable = DND.makeDraggable(this.actor, null, this._applet.actor);
            this._draggable.connect("drag-begin",
                () => this._onDragBegin());
            this._draggable.connect("drag-cancelled",
                () => this._onDragCancelled());
            this._draggable.connect("drag-end",
                () => this._onDragEnd());
        }

        this.onPanelEditModeChanged();
        global.settings.connect("changed::panel-edit-mode",
            () => this.onPanelEditModeChanged());

        this._windows = this._applet._windows;

        this.scrollConnector = null;
        this.onScrollModeChanged();
        this._needsAttention = false;

        this.setDisplayTitle();
        this.onFocus();
        this.setIcon();

        if (this.alert) {
            this.getAttention();
        }

        this.window_signals.connect(this.metaWindow, "notify::title", this.setDisplayTitle, this);
        this.window_signals.connect(this.metaWindow, "notify::minimized", this.setDisplayTitle, this);
        this.window_signals.connect(this.metaWindow, "notify::tile-type", this.setDisplayTitle, this);
        this.window_signals.connect(this.metaWindow, "notify::icon", this.setIcon, this);
        this.window_signals.connect(this.metaWindow, "notify::appears-focused", this.onFocus, this);
        this.window_signals.connect(this.metaWindow, "unmanaged", this.onUnmanaged, this);
    },

    onUnmanaged: function() {
        this.destroy();
        this._windows.splice(this._windows.indexOf(this), 1);
    },

    onPreviewChanged: function() {
        if (this._tooltip) {
            this._tooltip.destroy();
        }

        if (this._applet.pref_window_preview) {
            this._tooltip = new WindowPreview(this, this.metaWindow, this._applet.pref_window_preview_scale, this._applet.pref_window_preview_show_label);
        } else {
            this._tooltip = new Tooltips.PanelItemTooltip(this, "", this._applet.orientation);
        }

        this.setDisplayTitle();
    },

    onPanelEditModeChanged: function() {
        let editMode = global.settings.get_boolean("panel-edit-mode");
        if (this._draggable) {
            this._draggable.inhibit = editMode;
        }
        this.actor.reactive = !editMode;
    },

    onScrollModeChanged: function() {
        if (this._applet.pref_enable_scrolling) {
            this.scrollConnector = this.actor.connect("scroll-event",
                (aActor, aEvent) => this._onScrollEvent(aActor, aEvent));
        } else {
            if (this.scrollConnector) {
                this.actor.disconnect(this.scrollConnector);
                this.scrollConnector = null;
            }
        }
    },

    _onScrollEvent: function(actor, event) {
        let direction = event.get_scroll_direction();

        // Find the current focused window
        let windows = this.actor.get_parent().get_children()
            .filter(function(item) {
                return item.visible;
            }).map(function(item) {
                return item._delegate;
            });

        windows = windows.reverse();

        let i = windows.length;
        while (i-- && !windows[i].metaWindow.has_focus()) {

        }

        if (i == -1) {
            return;
        }

        //                   v   home-made xor
        if ((direction == 0) != this._applet.pref_reverse_scrolling) {
            i++;
        } else {
            i--;
        }

        if (i == windows.length) {
            i = 0;
        } else if (i == -1) {
            i = windows.length - 1;
        }

        Main.activateWindow(windows[i].metaWindow, global.get_current_time());
    },

    _onDragBegin: function() {
        if (this._applet.orientation == St.Side.TOP || this._applet.orientation == St.Side.BOTTOM) {
            this._draggable._overrideY = this.actor.get_transformed_position()[1];
            this._draggable._overrideX = null;
        } else {
            this._draggable._overrideX = this.actor.get_transformed_position()[0];
            this._draggable._overrideY = null;
        }

        this._tooltip.hide();
        this._tooltip.preventShow = true;
    },

    _onDragEnd: function() {
        this.actor.show();
        this._applet.clearDragPlaceholder();
        this._tooltip.preventShow = false;
    },

    _onDragCancelled: function() {
        this.actor.show();
        this._applet.clearDragPlaceholder();
        this._tooltip.preventShow = false;
    },

    getDragActor: function() {
        let clone = new Clutter.Clone({
            source: this.actor
        });
        clone.width = this.actor.width;
        clone.height = this.actor.height;
        return clone;
    },

    getDragActorSource: function() {
        return this.actor;
    },

    handleDragOver: function(source, actor, x, y, time) { // jshint ignore:line
        if (this._draggable && this._draggable.inhibit) {
            return DND.DragMotionResult.CONTINUE;
        }

        if (source instanceof AppMenuButton) {
            return DND.DragMotionResult.CONTINUE;
        }

        /* Users can drag things from one window to another window (eg drag an
         * image from Firefox to LibreOffice). However, if the target window is
         * hidden, they will drag to the AppWindowButton of the target window,
         * and we will open the window for them. */
        this._toggleWindow(true);
        return DND.DragMotionResult.NO_DROP;
    },

    acceptDrop: function(source, actor, x, y, time) { // jshint ignore:line
        return false;
    },

    setDisplayTitle: function() {
        let title = this.metaWindow.get_title();
        let tracker = Cinnamon.WindowTracker.get_default();
        let app = tracker.get_window_app(this.metaWindow);

        if (!title) {
            title = app ? app.get_name() : "?";
        }

        // Sanitize the window title to prevent dodgy window titles such as
        // "); DROP TABLE windows; --. Turn all whitespaces into " " because
        // newline characters are known to cause trouble. Also truncate the
        // title when necessary or else cogl might get unhappy and crash
        // Cinnamon.
        title = title.replace(/\s/g, " ");
        if (title.length > MAX_TEXT_LENGTH) {
            title = title.substr(0, MAX_TEXT_LENGTH);
        }

        if (this._tooltip && this._tooltip.set_text) {
            if ((this._applet.pref_window_preview && this._applet.pref_window_preview_show_label) ||
                (!this._applet.pref_window_preview && !this._applet.pref_hide_tooltips)) {
                this._tooltip.set_text(title);
            }
        }

        if (this.metaWindow.minimized) {
            title = "[" + title + "]";
        } else if (this.metaWindow.tile_type == Meta.WindowTileType.TILED) {
            title = "|" + title;
        } else if (this.metaWindow.tile_type == Meta.WindowTileType.SNAPPED) {
            title = "||" + title;
        }

        if (this._applet.pref_hide_labels) {
            this._label.set_text("");
        } else {
            this._label.set_text(title);
        }
    },

    destroy: function() {
        this.window_signals.disconnectAllSignals();
        this._tooltip.destroy();
        if (this.rightClickMenu) {
            this.rightClickMenu.destroy();
        }
        this.actor.destroy();
    },

    _hasFocus: function() {
        if (this.metaWindow.minimized) {
            return false;
        }

        if (this.metaWindow.has_focus()) {
            return true;
        }

        let transientHasFocus = false;
        this.metaWindow.foreach_transient(function(transient) {
            if (transient.has_focus()) {
                transientHasFocus = true;
                return false;
            }
            return true;
        });
        return transientHasFocus;
    },

    onFocus: function() {
        if (this._hasFocus()) {
            this.actor.add_style_pseudo_class("focus");
            this.actor.remove_style_class_name("window-list-item-demands-attention");
            this.actor.remove_style_class_name("window-list-item-demands-attention-top");
            this._needsAttention = false;

            if (this.alert) {
                this.destroy();
                this._windows.splice(this._windows.indexOf(this), 1);
            }
        } else {
            this.actor.remove_style_pseudo_class("focus");
        }
    },

    _onButtonRelease: function(actor, event) {
        this._tooltip.hide();
        if (this.alert) {
            if (event.get_button() == 1) {
                this._toggleWindow(false);
            }
            return false;
        }

        if (event.get_button() == 1) {
            if (this.rightClickMenu.isOpen) {
                this.rightClickMenu.toggle();
            }

            this._toggleWindow(false);
        } else if (event.get_button() == 2 && this._applet.pref_middle_click_close) {
            this.metaWindow.delete(global.get_current_time());
        }
        return true;
    },

    _onButtonPress: function(actor, event) {
        this._tooltip.hide();
        if (!this.alert && event.get_button() == 3) {
            this.rightClickMenu.mouseEvent = event;
            this.rightClickMenu.toggle();

            if (this._hasFocus()) {
                this.actor.add_style_pseudo_class("focus");
            }
        }
    },

    _toggleWindow: function(fromDrag) {
        if (!this._hasFocus()) {
            Main.activateWindow(this.metaWindow, global.get_current_time());
            this.actor.add_style_pseudo_class("focus");
        } else if (!fromDrag) {
            this.metaWindow.minimize();
            this.actor.remove_style_pseudo_class("focus");
        }
    },

    _onIconBoxStyleChanged: function() {
        let node = this._iconBox.get_theme_node();
        this._iconBottomClip = node.get_length("app-icon-bottom-clip");
        this._updateIconBoxClipAndGeometry();
    },

    _updateIconBoxClipAndGeometry: function() {
        let allocation = this._iconBox.allocation;
        if (this._iconBottomClip > 0) {
            this._iconBox.set_clip(0, 0,
                allocation.x2 - allocation.x1,
                allocation.y2 - allocation.y1 - this._iconBottomClip);
        } else {
            this._iconBox.remove_clip();
        }

        let rect = new Meta.Rectangle();
        [rect.x, rect.y] = this.actor.get_transformed_position();
        [rect.width, rect.height] = this.actor.get_transformed_size();

        this.metaWindow.set_icon_geometry(rect);
    },

    _getPreferredWidth: function(actor, forHeight, alloc) {
        let [minSize, naturalSize] = this._iconBox.get_preferred_width(forHeight); // jshint ignore:line
        // minimum size just enough for icon if we ever get that many apps going

        alloc.min_size = naturalSize + 2 * 3 * global.ui_scale;

        if (!this._applet.pref_hide_labels) {
            if (this._applet.orientation == St.Side.TOP || this._applet.orientation == St.Side.BOTTOM) {
                // the 'buttons use entire space' option only makes sense on horizontal panels
                if (this._applet.pref_buttons_use_entire_space) {
                    let [lminSize, lnaturalSize] = this._label.get_preferred_width(forHeight); // jshint ignore:line
                    alloc.natural_size = Math.max(150 * global.ui_scale,
                        lnaturalSize + naturalSize + 3 * 3 * global.ui_scale);
                } else {
                    alloc.natural_size = 150 * global.ui_scale;
                }
            } else {
                alloc.natural_size = this._applet._panelHeight;
            }
        }
    },

    _getPreferredHeight: function(actor, forWidth, alloc) {
        let [minSize1, naturalSize1] = this._iconBox.get_preferred_height(forWidth);

        if (this.labelVisible) {
            let [minSize2, naturalSize2] = this._label.get_preferred_height(forWidth); // jshint ignore:line
            alloc.min_size = Math.max(minSize1, minSize2);
        } else {
            alloc.min_size = minSize1;
        }

        if (this._applet.orientation == St.Side.TOP || this._applet.orientation == St.Side.BOTTOM) {
            /* putting a container around the actor for layout management reasons affects the allocation,
               causing the visible border to pull in close around the contents which is not the desired
               (pre-existing) behaviour, so need to push the visible border back towards the panel edge.
               Assigning the natural size to the full panel height used to cause recursion errors but seems fine now.
               If this happens to avoid this you can subtract 1 or 2 pixels, but this will give an unreactive
               strip at the edge of the screen */
            alloc.natural_size = this._applet._panelHeight;
        } else {
            alloc.natural_size = naturalSize1;
        }
    },

    _allocate: function(actor, box, flags) {
        let allocWidth = box.x2 - box.x1;
        let allocHeight = box.y2 - box.y1;

        let childBox = new Clutter.ActorBox();

        let [minWidth, minHeight, naturalWidth, naturalHeight] = this._iconBox.get_preferred_size();

        let direction = this.actor.get_text_direction();
        let xPadding = 3 * global.ui_scale;
        let yPadding = Math.floor(Math.max(0, allocHeight - naturalHeight) / 2);

        childBox.y1 = yPadding;
        childBox.y2 = childBox.y1 + Math.min(naturalHeight, allocHeight);

        if (this.labelVisible) {
            if (direction == Clutter.TextDirection.LTR) {
                if (allocWidth < naturalWidth + xPadding * 2) {
                    childBox.x1 = Math.max(0, (allocWidth - naturalWidth) / 2);
                } else {
                    childBox.x1 = Math.min(allocWidth, xPadding);
                }
                childBox.x2 = Math.min(childBox.x1 + naturalWidth, allocWidth);
            } else {
                if (allocWidth < naturalWidth + xPadding * 2) {
                    childBox.x1 = Math.max(0, (allocWidth - naturalWidth) / 2);
                } else {
                    childBox.x1 = allocWidth - naturalWidth - xPadding;
                }
                childBox.x2 = Math.min(childBox.x1 + naturalWidth, allocWidth);
            }
        } else {
            if (allocWidth < naturalWidth) {
                childBox.x1 = Math.max(0, (allocWidth - naturalWidth) / 2);
            } else {
                childBox.x1 = (allocWidth - naturalWidth) / 2;
            }
            childBox.x2 = Math.min(childBox.x1 + naturalWidth, allocWidth);
        }

        this._iconBox.allocate(childBox, flags);

        if (this.labelVisible) {
            [minWidth, minHeight, naturalWidth, naturalHeight] = this._label.get_preferred_size();

            yPadding = Math.floor(Math.max(0, allocHeight - naturalHeight) / 2);
            childBox.y1 = yPadding;
            childBox.y2 = childBox.y1 + Math.min(naturalHeight, allocHeight);
            if (direction == Clutter.TextDirection.LTR) {
                // Reuse the values from the previous allocation
                childBox.x1 = Math.min(childBox.x2 + xPadding, Math.max(0, allocWidth - xPadding));
                childBox.x2 = Math.max(childBox.x1, allocWidth - xPadding);
            } else {
                childBox.x2 = Math.max(childBox.x1 - xPadding, 0);
                childBox.x1 = Math.min(childBox.x2, xPadding);
            }

            this._label.allocate(childBox, flags);
        }

        if (!this.progressOverlay.visible) {
            return;
        }

        childBox.x1 = 0;
        childBox.y1 = 0;
        childBox.x2 = this.actor.width;
        childBox.y2 = this.actor.height;

        this.progressOverlay.allocate(childBox, flags);

        let clip_width = Math.max((this.actor.width) * (this._progress / 100.0), 1.0);
        this.progressOverlay.set_clip(0, 0, clip_width, this.actor.height);
    },

    updateLabelVisible: function() {
        if (this._applet.orientation == St.Side.TOP || this._applet.orientation == St.Side.BOTTOM) {
            if (this._applet.pref_hide_labels) {
                this._label.hide();
                this.labelVisible = false;
            } else {
                this._label.show();
                this.labelVisible = true;
            }
        } else {
            this._label.hide();
            this.labelVisible = false;
        }
    },

    setIcon: function() {
        let tracker = Cinnamon.WindowTracker.get_default();
        let app = tracker.get_window_app(this.metaWindow);

        if (this._applet._scaleMode && this.labelVisible) {
            this.iconSize = Math.round(this._applet._panelHeight * ICON_HEIGHT_FACTOR / global.ui_scale);
        } else if (!this.labelVisible) {
            this.iconSize = Math.round(this._applet._panelHeight * VERTICAL_ICON_HEIGHT_FACTOR / global.ui_scale);
        } else {
            this.iconSize = HORIZONTAL_ICON_SIZE;
        }

        // Mark for deletion on EOL. Cinnamon 3.6.x+
        // create_icon_texture_for_window introduced in Cinnamon 3.6.x+.
        let useLegacyFunction = app && typeof app.create_icon_texture === "function";

        let icon = app ?
            useLegacyFunction ?
            app.create_icon_texture(this.iconSize) :
            app.create_icon_texture_for_window(this.iconSize, this.metaWindow) :
            new St.Icon({
                icon_name: "application-default-icon",
                icon_type: St.IconType.FULLCOLOR,
                icon_size: this.iconSize
            });

        let old_child = this._iconBox.get_child();
        this._iconBox.set_child(icon);

        if (old_child) {
            old_child.destroy();
        }
    },

    getAttention: function() {
        if (this._needsAttention) {
            return false;
        }

        this._needsAttention = true;
        let counter = 0;
        this._flashButton(counter);
        return true;
    },

    _flashButton: function(counter) {
        if (!this._needsAttention) {
            return;
        }

        this.actor.add_style_class_name("window-list-item-demands-attention");
        if (counter < 4) {
            Mainloop.timeout_add(FLASH_INTERVAL, () => {
                if (this.actor.has_style_class_name("window-list-item-demands-attention")) {
                    this.actor.remove_style_class_name("window-list-item-demands-attention");
                }
                Mainloop.timeout_add(FLASH_INTERVAL, () => {
                    this._flashButton(++counter);
                });
            });
        }
    }
};

function AppMenuButtonRightClickMenu() {
    this._init.apply(this, arguments);
}

AppMenuButtonRightClickMenu.prototype = {
    __proto__: Applet.AppletPopupMenu.prototype,

    _init: function(launcher, metaWindow, orientation) {
        Applet.AppletPopupMenu.prototype._init.call(this, launcher, orientation);

        this._launcher = launcher;
        this._windows = launcher._applet._windows;
        this.connect("open-state-changed",
            (aMenu, aOpen) => this._onToggled(aMenu, aOpen));

        this.orientation = orientation;
        this.metaWindow = metaWindow;
    },

    _populateMenu: function() {
        this.box.pack_start = this._launcher._applet.pref_invert_menu_items_order;

        let mw = this.metaWindow;
        let item;
        let amount;

        let subMenu;

        if (this._launcher._applet.pref_sub_menu_placement !== 0) {
            subMenu = new PopupMenu.PopupSubMenuMenuItem(_("Preferences"));
        }

        if (this._launcher._applet.pref_sub_menu_placement === 1) {
            this.addMenuItem(subMenu);
            this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }

        // Move to monitor
        if ((amount = Main.layoutManager.monitors.length) == 2) {
            Main.layoutManager.monitors.forEach(function(monitor, index) {
                if (index === mw.get_monitor()) {
                    return;
                }
                item = new PopupMenu.PopupMenuItem(_("Move to the other monitor"));
                item.connect("activate", function() {
                    mw.move_to_monitor(index);
                });
                this.addMenuItem(item);
            }, this);
        } else if ((amount = Main.layoutManager.monitors.length) > 2) {
            Main.layoutManager.monitors.forEach(function(monitor, index) {
                if (index === mw.get_monitor()) {
                    return;
                }
                item = new PopupMenu.PopupMenuItem(_("Move to monitor %d").format(index + 1));
                item.connect("activate", function() {
                    mw.move_to_monitor(index);
                });
                this.addMenuItem(item);
            }, this);
        }

        // Move to workspace
        if ((amount = global.screen.n_workspaces) > 1) {
            if (mw.is_on_all_workspaces()) {
                item = new PopupMenu.PopupMenuItem(_("Only on this workspace"));
                item.connect("activate", function() {
                    mw.unstick();
                });
                this.addMenuItem(item);
            } else {
                item = new PopupMenu.PopupMenuItem(_("Visible on all workspaces"));
                item.connect("activate", function() {
                    mw.stick();
                });
                this.addMenuItem(item);

                item = new PopupMenu.PopupSubMenuMenuItem(_("Move to another workspace"));
                this.addMenuItem(item);

                let activateEmittedFn = (aMetaWindow, aWorkspaceIndex) => {
                    return () => {
                        aMetaWindow.change_workspace(global.screen.get_workspace_by_index(aWorkspaceIndex));
                    };
                };

                let curr_index = mw.get_workspace().index();
                for (let i = 0; i < amount; i++) {
                    // Make the index a local variable to pass to function
                    let j = i;
                    let name = Main.workspace_names[i] ? Main.workspace_names[i] : Main._makeDefaultWorkspaceName(i);
                    let ws = new PopupMenu.PopupMenuItem(name);

                    if (i === curr_index) {
                        ws.setSensitive(false);
                    }

                    ws.connect("activate", activateEmittedFn(mw, j));
                    item.menu.addMenuItem(ws);
                }

            }
        }

        this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Close all/others
        item = new PopupMenu.PopupIconMenuItem(_("Close all"), "application-exit", St.IconType.SYMBOLIC);
        item.connect("activate", () => {
            for (let window of this._windows)
                if (window.actor.visible &&
                    !window._needsAttention) {
                    window.metaWindow.delete(global.get_current_time());
                }
        });
        this.addMenuItem(item);

        item = new PopupMenu.PopupIconMenuItem(_("Close others"), "window-close", St.IconType.SYMBOLIC);
        item.connect("activate", () => {
            for (let window of this._windows)
                if (window.actor.visible &&
                    window.metaWindow != this.metaWindow &&
                    !window._needsAttention) {
                    window.metaWindow.delete(global.get_current_time());
                }
        });
        this.addMenuItem(item);

        this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Miscellaneous
        if (mw.get_compositor_private().opacity != 255) {
            item = new PopupMenu.PopupMenuItem(_("Restore to full opacity"));
            item.connect("activate", function() {
                mw.get_compositor_private().set_opacity(255);
            });
            this.addMenuItem(item);
        }

        if (mw.minimized) {
            item = new PopupMenu.PopupIconMenuItem(_("Restore"), "view-sort-descending", St.IconType.SYMBOLIC);
            item.connect("activate", function() {
                Main.activateWindow(mw, global.get_current_time());
            });
        } else {
            item = new PopupMenu.PopupIconMenuItem(_("Minimize"), "view-sort-ascending", St.IconType.SYMBOLIC);
            item.connect("activate", function() {
                mw.minimize();
            });
        }
        this.addMenuItem(item);

        if (mw.get_maximized()) {
            item = new PopupMenu.PopupIconMenuItem(_("Unmaximize"), "view-restore", St.IconType.SYMBOLIC);
            item.connect("activate", function() {
                mw.unmaximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
            });
        } else {
            item = new PopupMenu.PopupIconMenuItem(_("Maximize"), "view-fullscreen", St.IconType.SYMBOLIC);
            item.connect("activate", function() {
                mw.maximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
            });
        }
        this.addMenuItem(item);

        item = new PopupMenu.PopupIconMenuItem(_("Close"), "edit-delete", St.IconType.SYMBOLIC);
        item.connect("activate", function() {
            mw.delete(global.get_current_time());
        });
        this.addMenuItem(item);

        if (this._launcher._applet.pref_sub_menu_placement === 2) {
            this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this.addMenuItem(subMenu);
        }

        if (this._launcher._applet.pref_sub_menu_placement !== 0) {
            item = new PopupMenu.PopupIconMenuItem(_("Help"), "dialog-information",
                St.IconType.SYMBOLIC);
            item.connect("activate", () => {
                Util.spawn_async(["xdg-open", this._launcher._applet.metadata.path + "/HELP.html"], null);
            });
            subMenu.menu.addMenuItem(item);

            item = new PopupMenu.PopupIconMenuItem(_("About..."), "dialog-question",
                St.IconType.SYMBOLIC);
            item.connect("activate", () => this._launcher._applet.openAbout());
            subMenu.menu.addMenuItem(item);

            item = new PopupMenu.PopupIconMenuItem(_("Configure..."), "system-run",
                St.IconType.SYMBOLIC);
            item.connect("activate", () => {
                // Condition needed for retro-compatibility.
                // Mark for deletion on EOL. Cinnamon 3.4.x+
                if (typeof this._launcher._applet.configureApplet === "function") {
                    this._launcher._applet.configureApplet();
                } else {
                    Util.spawn_async(["cinnamon-settings", "applets",
                        this._launcher._applet._uuid, this._launcher._applet.instance_id
                    ], null);
                }
            });
            subMenu.menu.addMenuItem(item);

            item = new PopupMenu.PopupIconMenuItem(
                _("Remove '%s'").format(_(this._launcher._applet.metadata.name)),
                "edit-delete",
                St.IconType.SYMBOLIC);
            item.connect("activate", () => {
                AppletManager._removeAppletFromPanel(this._launcher._applet._uuid,
                    this._launcher._applet.instance_id);
            });
            subMenu.menu.addMenuItem(item);
        }
    },

    _onToggled: function(actor, isOpening) { // jshint ignore:line
        if (this.isOpen) {
            this._launcher._applet._menuOpen = true;
        } else {
            this._launcher._applet._menuOpen = false;
        }
    },

    toggle: function() {
        if (!this.isOpen) {
            this.removeAll();
            this._populateMenu();
        }

        Applet.AppletPopupMenu.prototype.toggle.call(this);
    }
};

/**
 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
 *
 * This function was born in http://stackoverflow.com/a/6832721.
 *
 * @param {string} v1 The first version to be compared.
 * @param {string} v2 The second version to be compared.
 * @param {object} [options] Optional flags that affect comparison behavior:
 * <ul>
 *     <li>
 *         <tt>lexicographical: true</tt> compares each part of the version strings lexicographically instead of
 *         naturally; this allows suffixes such as "b" or "dev" but will cause "1.10" to be considered smaller than
 *         "1.2".
 *     </li>
 *     <li>
 *         <tt>zeroExtend: true</tt> changes the result if one version string has less parts than the other. In
 *         this case the shorter string will be padded with "zero" parts instead of being considered smaller.
 *     </li>
 * </ul>
 * @returns {number|NaN}
 * <ul>
 *    <li>0 if the versions are equal</li>
 *    <li>a negative integer iff v1 < v2</li>
 *    <li>a positive integer iff v1 > v2</li>
 *    <li>NaN if either version string is in the wrong format</li>
 * </ul>
 *
 * @copyright by Jon Papaioannou (["john", "papaioannou"].join(".") + "@gmail.com")
 * @license This function is in the public domain. Do what you want with it, no strings attached.
 */
function versionCompare(v1, v2, options) {
    let lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split("."),
        v2parts = v2.split(".");

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) {
            v1parts.push("0");
        }
        while (v2parts.length < v1parts.length) {
            v2parts.push("0");
        }
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (let i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        } else if (v1parts[i] > v2parts[i]) {
            return 1;
        } else {
            return -1;
        }
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
}

/*
exported _,
         versionCompare,
         CINNAMON_VERSION
 */
