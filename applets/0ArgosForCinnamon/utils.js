let XletMeta,
    Emojis,
    Constants,
    GlobalUtils,
    DebugManager,
    CustomTooltips,
    DesktopNotificationsUtils;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta["{{UUID}}"];
}

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    Emojis = require("./emojis.js").Emojis;
    Constants = require("./constants.js");
    DebugManager = require("./debugManager.js");
    GlobalUtils = require("./globalUtils.js");
    CustomTooltips = require("./customTooltips.js");
    DesktopNotificationsUtils = require("./desktopNotificationsUtils.js");
} else {
    Emojis = imports.ui.appletManager.applets["{{UUID}}"].emojis.Emojis;
    Constants = imports.ui.appletManager.applets["{{UUID}}"].constants;
    DebugManager = imports.ui.appletManager.applets["{{UUID}}"].debugManager;
    GlobalUtils = imports.ui.appletManager.applets["{{UUID}}"].globalUtils;
    CustomTooltips = imports.ui.appletManager.applets["{{UUID}}"].customTooltips;
    DesktopNotificationsUtils = imports.ui.appletManager.applets["{{UUID}}"].desktopNotificationsUtils;
}

const {
    gi: {
        Clutter,
        GdkPixbuf,
        Gio,
        GLib,
        St
    },
    misc: {
        params: Params,
        util: Util
    },
    ui: {
        main: Main,
        popupMenu: PopupMenu,
        tooltips: Tooltips
    }
} = imports;

const {
    SLIDER_SCALE,
    UNITS_MAP,
    AnsiColors,
    BooleanAttrs,
    DefaultAttributes,
    OrnamentType,
    Placeholders,
    TruthyVals
} = Constants;

const {
    _,
    ngettext,
    escapeHTML,
    xdgOpen
} = GlobalUtils;

const {
    InteligentTooltip
} = CustomTooltips;

const {
    CustomNotification
} = DesktopNotificationsUtils;

var Debugger = new DebugManager.DebugManager();

DebugManager.wrapObjectMethods(Debugger, {
    AltSwitcher: AltSwitcher,
    ArgosLineView: ArgosLineView,
    ArgosMenuItem: ArgosMenuItem,
    CustomNotification: CustomNotification,
    CustomPanelItemTooltip: CustomPanelItemTooltip,
    CustomPopupSliderMenuItem: CustomPopupSliderMenuItem,
    CustomSubMenuItem: CustomSubMenuItem,
    InteligentTooltip: InteligentTooltip,
    UnitSelectorMenuItem: UnitSelectorMenuItem,
    UnitSelectorSubMenuMenuItem: UnitSelectorSubMenuMenuItem
});

var Notification = new CustomNotification({
    title: escapeHTML(_(XletMeta.name)),
    defaultButtons: [{
        action: "dialog-information",
        label: escapeHTML(_("Help"))
    }],
    actionInvokedCallback: (aSource, aAction) => {
        switch (aAction) {
            case "dialog-information":
                xdgOpen(XletMeta.path + "/HELP.html");
                break;
        }
    }
});

function getUnitPluralForm(aUnit, aN) {
    switch (aUnit) {
        case "ms":
            return ngettext("millisecond", "milliseconds", aN);
        case "s":
            return ngettext("second", "seconds", aN);
        case "m":
            return ngettext("minute", "minutes", aN);
        case "h":
            return ngettext("hour", "hours", aN);
        case "d":
            return ngettext("day", "days", aN);
    }

    return "";
}

function UnitSelectorMenuItem() {
    this._init.apply(this, arguments);
}

UnitSelectorMenuItem.prototype = {
    __proto__: PopupMenu.PopupIndicatorMenuItem.prototype,

    _init: function(aSubMenu, aLabel, aValue, aUnitsKey) {
        PopupMenu.PopupIndicatorMenuItem.prototype._init.call(this, aLabel);
        this._subMenu = aSubMenu;
        this._applet = aSubMenu._applet;
        this._value = aValue;
        this._unitsKey = aUnitsKey;
        this.setOrnament(OrnamentType.DOT);

        this._handler_id = this.connect("activate", () => {
            this._applet[this._unitsKey] = this._value;
            this._subMenu._setCheckedState();
            this._applet.update();
            return true; // Avoids the closing of the sub menu.
        });

        this._ornament.child._delegate.setToggleState(this._applet[this._unitsKey] === this._value);
    },

    destroy: function() {
        this.disconnect(this._handler_id);
        PopupMenu.PopupIndicatorMenuItem.prototype.destroy.call(this);
    }
};

function UnitSelectorSubMenuMenuItem() {
    this._init.apply(this, arguments);
}

UnitSelectorSubMenuMenuItem.prototype = {
    __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,

    _init: function(aApplet, aLabel, aUnitsKey, aValueKey) {
        this._applet = aApplet;
        this._unitsKey = aUnitsKey;
        this._valueKey = aValueKey;
        this._label = aLabel;

        PopupMenu.PopupSubMenuMenuItem.prototype._init.call(this, " "); // ¬¬

        this.setLabel();
        this._populateMenu();
        this._applet.settings.connect("changed::" + this._valueKey,
            () => this.setLabel());
    },

    setLabel: function() {
        this.label.clutter_text.set_markup(
            this._label + " " + this._applet[this._valueKey] + " " +
            getUnitPluralForm(this._applet[this._unitsKey], this._applet[this._valueKey])
        );
    },

    _populateMenu: function() {
        this.label.grab_key_focus();
        this.menu.removeAll();
        for (let unit in UNITS_MAP) {
            let item = new UnitSelectorMenuItem(
                this,
                UNITS_MAP[unit].capital,
                unit,
                this._unitsKey
            );
            this.menu.addMenuItem(item);
        }
    },

    _setCheckedState: function() {
        let children = this.menu._getMenuItems();
        let i = 0,
            iLen = children.length;

        for (; i < iLen; i++) {
            let item = children[i];
            if (item instanceof UnitSelectorMenuItem) { // Just in case
                item._ornament.child._delegate.setToggleState(this._applet[this._unitsKey] === item._value);
            }
        }
    }
};

/*
A custom PopupSliderMenuItem element whose value is changed by a step of 1.
*/
function CustomPopupSliderMenuItem() {
    this._init.apply(this, arguments);
}

CustomPopupSliderMenuItem.prototype = {
    __proto__: PopupMenu.PopupSliderMenuItem.prototype,

    _init: function(aValue) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            activate: false
        });

        this.actor.connect("key-press-event",
            (aActor, aEvent) => this._onKeyPressEvent(aActor, aEvent));

        // Avoid spreading NaNs around
        if (isNaN(aValue)) {
            throw TypeError("The slider value must be a number.");
        }

        this._value = Math.max(Math.min(aValue, 1), 0);

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

        this._releaseId = this._motionId = 0;
        this._dragging = false;
        this._associatedLabel = null;
    },

    _onScrollEvent: function(aActor, aEvent) {
        let direction = aEvent.get_scroll_direction();
        let scale = this.ctrlKey ? SLIDER_SCALE * 11.5 : SLIDER_SCALE;

        if (direction === Clutter.ScrollDirection.DOWN) {
            // Original "scale" was 0.05.
            this._value = Math.max(0, this._value - scale);
        } else if (direction === Clutter.ScrollDirection.UP) {
            this._value = Math.min(1, this._value + scale);
        }

        this._slider.queue_repaint();
        this.emit("value-changed", this._value);
    },

    _onKeyPressEvent: function(aActor, aEvent) {
        let key = aEvent.get_key_symbol();
        let scale = this.ctrlKey ? SLIDER_SCALE * 11.5 : SLIDER_SCALE;

        if (key === Clutter.KEY_Right || key === Clutter.KEY_Left) {
            // Original "scale" was 0.1.
            let delta = key === Clutter.KEY_Right ? scale : -scale;
            this._value = Math.max(0, Math.min(this._value + delta, 1));
            this._slider.queue_repaint();
            this.emit("value-changed", this._value);
            this.emit("drag-end");
            return true;
        }
        return false;
    },

    get ctrlKey() {
        return (Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2]) !== 0;
    }
};

function ArgosLineView() {
    this._init.apply(this, arguments);
}

ArgosLineView.prototype = {
    _init: function(aApplet, aLine = null, aMenuItem = null) {
        this._applet = aApplet;
        this._menuItem = aMenuItem;

        this.actor = new St.BoxLayout();
        this.actor._delegate = this;

        if (aLine !== null) {
            this.setLine(aLine);
        }
    },

    setLine: function(aLine) {
        this.line = aLine;

        this.actor.remove_all_children();

        if (this._menuItem !== null && aLine.tooltip) {
            this._menuItem.tooltip.set_text(aLine.tooltip);
        }

        if (aLine.iconname) {
            let icon = null;
            let iconName = aLine.iconname;
            let iconSize = aLine.iconsize ?
                aLine.iconsize :
                this._applet.pref_default_icon_size;

            // If aLine.iconName is a path to an icon.
            if (iconName[0] === "/" || iconName[0] === "~") {
                // Expand ~ to the user's home folder.
                if (/^~\//.test(iconName)) {
                    iconName = iconName.replace(/^~\//, GLib.get_home_dir() + "/");
                }

                let file = Gio.file_new_for_path(iconName);
                let iconFile = new Gio.FileIcon({
                    file: file
                });

                icon = new St.Icon({
                    style_class: "popup-menu-icon",
                    gicon: iconFile,
                    icon_size: iconSize
                });
            } else { // use a themed icon
                icon = new St.Icon({
                    style_class: "popup-menu-icon",
                    icon_size: iconSize,
                    icon_name: iconName,
                    icon_type: (aLine.iconissymbolic ?
                        St.IconType.SYMBOLIC :
                        St.IconType.FULLCOLOR)
                });
            }

            if (icon !== null) {
                this.actor.add_actor(icon);
            }
        }

        if (aLine.image || aLine.templateimage) {
            let image = aLine.image ?
                aLine.image :
                aLine.templateimage ?
                aLine.templateimage :
                null;

            try {
                // Source: https://github.com/GNOME/gnome-maps (mapSource.js)
                let bytes = GLib.Bytes.new(GLib.base64_decode(image));
                let stream = Gio.MemoryInputStream.new_from_bytes(bytes);

                let pixbuf = GdkPixbuf.Pixbuf.new_from_stream(stream, null);

                // TextureCache.load_gicon returns a square texture no matter what the Pixbuf's
                // actual dimensions are, so we request a size that can hold all pixels of the
                // image and then resize manually afterwards
                let size = Math.max(pixbuf.width, pixbuf.height);
                let texture = St.TextureCache.get_default().load_gicon(null, pixbuf, size, 1);

                let aspectRatio = pixbuf.width / pixbuf.height;

                let width = parseInt(aLine.imagewidth, 10);
                let height = parseInt(aLine.imageheight, 10);

                if (isNaN(width) && isNaN(height)) {
                    width = pixbuf.width;
                    height = pixbuf.height;
                } else if (isNaN(width)) {
                    width = Math.round(height * aspectRatio);
                } else if (isNaN(height)) {
                    height = Math.round(width / aspectRatio);
                }

                texture.set_size(width, height);

                this.actor.add_actor(texture);
                // Do not stretch the texture to the height of the container
                this.actor.child_set_property(texture, "y-fill", false);
            } catch (aErr) {
                // TO TRANSLATORS: Full sentence:
                // "Unable to load image from Base64 representation: ErrorMessage"
                global.logError(_("Unable to load image from Base64 representation: %s")
                    .format(aErr));
            }
        }

        if (aLine.markup.length > 0) {
            let label = new St.Label({
                y_expand: true,
                y_align: Clutter.ActorAlign.CENTER
            });

            this.actor.add_actor(label);

            let clutterText = label.get_clutter_text();
            clutterText.use_markup = true;
            clutterText.text = aLine.markup;

            if (aLine.length) {
                let maxLength = parseInt(aLine.length, 10);
                // "clutterText.text.length" fails for non-BMP Unicode characters
                let textLength = clutterText.buffer.get_length();

                if (!isNaN(maxLength) && textLength > maxLength) {
                    clutterText.set_cursor_position(maxLength);
                    clutterText.delete_chars(textLength);
                    clutterText.insert_text("...", maxLength);
                }
            }
        }
    },

    setMarkup: function(aLine) {
        this.setLine(aLine);
    }
};

/*
Implemented the AltSwitcher used by Gnome Shell instead of using the Cinnamon's
native PopupAlternatingMenuItem.
I did this so I can keep the applet code as close to the original extension as possible.
Plus, AltSwitcher is infinitely easier to use than PopupAlternatingMenuItem. So, it's a win-win.
*/
function AltSwitcher() {
    this._init.apply(this, arguments);
}

AltSwitcher.prototype = {
    _init: function(aMenuItem, aStandard, aAlternate) {
        this._menuItem = aMenuItem;

        this._standard = aStandard;
        this._standard.connect("notify::visible", () => this._sync());

        this._alternate = aAlternate;
        this._alternate.connect("notify::visible", () => this._sync());

        this._capturedEventId = global.stage.connect("captured-event",
            (aActor, aEvent) => this._onCapturedEvent(aActor, aEvent));

        this._flipped = false;

        this._clickAction = new Clutter.ClickAction();
        this._clickAction.connect("long-press",
            (aAction, aActor, aState) => this._onLongPress(aAction, aActor, aState));

        this.actor = new St.Bin();
        this.actor.add_style_class_name("popup-alternating-menu-item");
        this.actor.connect("destroy", () => this._onDestroy());
        this.actor.connect("notify::mapped", () => {
            this._flipped = false;
        });
    },

    _sync: function() {
        let childToShow = null;

        if (this._standard.visible && this._alternate.visible) {
            // I almost had to use a crystal ball to divine that the Right Alt modifier
            // is called Clutter.ModifierType.MOD5_MASK. ¬¬
            if (this._flipped) {
                childToShow = this.altKey ? this._standard : this._alternate;
            } else {
                childToShow = this.altKey ? this._alternate : this._standard;
            }
        } else if (this._standard.visible) {
            childToShow = this._standard;
        } else if (this._alternate.visible) {
            childToShow = this._alternate;
        }

        let childShown = this.actor.get_child();
        if (childShown !== childToShow) {
            if (childShown) {
                if (childShown.fake_release) {
                    childShown.fake_release();
                }
                childShown.remove_action(this._clickAction);
            }
            childToShow.add_action(this._clickAction);

            let hasFocus = this.actor.contains(global.stage.get_key_focus());
            this.actor.set_child(childToShow);
            if (hasFocus) {
                childToShow.grab_key_focus();
            }

            // The actors might respond to hover, so
            // sync the pointer to make sure they update.
            global.sync_pointer();
        }

        if (childToShow !== null) {
            this._menuItem.tooltip.set_text(childToShow._delegate.line.tooltip);
        }

        this.actor.visible = (childToShow !== null);
    },

    _onDestroy: function() {
        if (this._capturedEventId > 0) {
            global.stage.disconnect(this._capturedEventId);
            this._capturedEventId = 0;
        }
    },

    _onCapturedEvent: function(aActor, aEvent) {
        let type = aEvent.type();

        if (type === Clutter.EventType.KEY_PRESS || type === Clutter.EventType.KEY_RELEASE) {
            let key = aEvent.get_key_symbol();

            // Nonsense time!!! On Linux Mint 18 with Cinnamon 3.0.7, pressing the Alt Right key
            // gives a keycode of 65027 and Clutter docs say that that keycode belongs
            // to Clutter.KEY_ISO_Level3_Shift. That's why I make that third ckeck,
            // because Clutter.KEY_Alt_R isn't recognised as pressing Alt Right key. ¬¬
            // See _sync, because the stupid nonsense continues!!!
            switch (key) {
                case Clutter.KEY_ISO_Level3_Shift:
                case Clutter.KEY_Alt_L:
                case Clutter.KEY_Alt_R:
                    this._sync();
                    break;
            }
        }

        return Clutter.EVENT_PROPAGATE;
    },

    _onLongPress: function(aAction, aActor, aState) {
        if (aState === Clutter.LongPressState.QUERY ||
            aState === Clutter.LongPressState.CANCEL) {
            return true;
        }

        this._flipped = !this._flipped;
        this._sync();

        return true;
    },

    get altKey() {
        return (Clutter.ModifierType.MOD1_MASK & global.get_pointer()[2]) !== 0 ||
            (Clutter.ModifierType.MOD5_MASK & global.get_pointer()[2]) !== 0;
    }
};

function ArgosMenuItem() {
    this._init.apply(this, arguments);
}

ArgosMenuItem.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(aApplet, aLine, aAlternateLine = null) {
        let hasAction = aLine.hasAction || (aAlternateLine !== null &&
            aAlternateLine.hasAction);

        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            activate: hasAction,
            hover: hasAction,
            focusOnHover: hasAction
        });

        this._applet = aApplet;
        this.tooltip = new InteligentTooltip(this.actor, "");

        let altSwitcher = null;

        let lineView = new ArgosLineView(aApplet, aLine, this);
        lineView.actor.set_style("spacing: " + aApplet.pref_menu_spacing + "em;");

        if (aAlternateLine === null) {
            this.addActor(lineView.actor);
        } else {
            let alternateLineView = new ArgosLineView(aApplet, aAlternateLine, this);
            alternateLineView.actor.set_style("spacing: " + aApplet.pref_menu_spacing + "em;");
            // The following class and pseudo class are set so the AltSwitcher is styled somewhat
            // the same as the Cinnamon's default.
            alternateLineView.actor.add_style_class_name("popup-alternating-menu-item");
            alternateLineView.actor.add_style_pseudo_class("alternate");
            altSwitcher = new AltSwitcher(this, lineView.actor, alternateLineView.actor);
            lineView.actor.visible = true;
            alternateLineView.actor.visible = true;
            this.addActor(altSwitcher.actor);
        }

        if (hasAction) {
            this.connect("activate", () => {
                let activeLine = (altSwitcher === null) ?
                    aLine :
                    altSwitcher.actor.get_child()._delegate.line;

                if (activeLine.href) {
                    // On the original extension was:
                    // Gio.AppInfo.launch_default_for_uri(activeLine.href, null);
                    Util.spawn_async(["xdg-open", activeLine.href], null);
                }

                if (activeLine.eval) {
                    try {
                        eval(activeLine.eval);
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                }

                if (activeLine.command || activeLine.bash) {
                    let argv = [];
                    let shell = activeLine.shell ?
                        activeLine.shell :
                        aApplet.pref_shell ?
                        aApplet.pref_shell :
                        "/bin/bash";
                    let shellArg = activeLine.shellargument ?
                        activeLine.shellargument :
                        aApplet.pref_shell_argument ?
                        aApplet.pref_shell_argument :
                        "-c";
                    let cmd = activeLine.command ?
                        activeLine.command :
                        activeLine.bash ?
                        activeLine.bash :
                        'echo "Something is screwed up!"';

                    if (activeLine.terminal) {
                        // Run shell immediately after executing the command to keep the terminal window open
                        // (see http://stackoverflow.com/q/3512055)
                        argv = [
                            aApplet.pref_terminal_emulator,
                            aApplet.pref_terminal_emulator_argument
                        ].concat(
                            // Workaround for the terminal that decided to reinvent the wheel. ¬¬
                            aApplet.pref_terminal_emulator_argument === "--" ?
                            [shell, shellArg, cmd + "; exec " + shell] :
                            [shell + " " + shellArg + " " + GLib.shell_quote(cmd + "; exec " + shell)]
                        );
                    } else {
                        argv = [shell, shellArg, cmd];
                    }

                    let [success, pid] = GLib.spawn_async(null, argv, null,
                        GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD, null);

                    if (success) {
                        GLib.child_watch_add(GLib.PRIORITY_DEFAULT_IDLE, pid, () => {
                            if (activeLine.refresh) {
                                aApplet.update();
                            }
                        });
                    }
                }

                if (activeLine.refresh) {
                    aApplet.update();
                }

                this._applet.menu.close();
            });
        }
    }
};

/*
I had to implement a custom sub menu item due to the fact that I never could make
the insert_child_below method to work on Cinnamon.
*/
function CustomSubMenuItem() {
    this._init.apply(this, arguments);
}

CustomSubMenuItem.prototype = {
    __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,

    _init: function(aApplet, aActor, aMenuLevel) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this);

        this._applet = aApplet;

        this._triangleBin = new St.Bin({
            x_expand: true,
            x_align: St.Align.END
        });
        this._triangle = arrowIcon(St.Side.RIGHT);
        this._triangle.pivot_point = new Clutter.Point({
            x: 0.5,
            y: 0.6
        });
        this._triangleBin.child = this._triangle;
        this.menu = new PopupMenu.PopupSubMenu(this.actor, this._triangle);

        if (Number(aMenuLevel) === 0) {
            this.menu.connect("open-state-changed",
                (aMenu, aOpen) => this._subMenuOpenStateChanged(aMenu, aOpen));
        }

        this.menu.box.set_y_expand = true;
        this.menu.box.set_x_expand = true;

        this.addActor(aActor, {
            expand: false,
            span: 0,
            align: St.Align.START
        });
        // Kind of pointless to set a spacing, but it doesn't hurt.
        aActor.set_style("spacing: " + this._applet.pref_menu_spacing + "em;");

        // Add the triangle to emulate accurately a sub menu item.
        this.addActor(this._triangleBin, {
            expand: true,
            span: -1,
            align: St.Align.END
        });
    },

    destroy: function() {
        this.menu.close(this._applet.pref_animate_menu);
        this.disconnectAll();
        this.menu.removeAll();
        this.actor.destroy();
    },

    _subMenuOpenStateChanged: function(aMenu, aOpen) {
        if (aOpen && this._applet.pref_keep_one_menu_open) {
            let children = aMenu._getTopMenu()._getMenuItems();
            let i = 0,
                iLen = children.length;
            for (; i < iLen; i++) {
                let item = children[i];

                if (item instanceof CustomSubMenuItem) {
                    if (aMenu !== item.menu) {
                        item.menu.close(true);
                    }
                }
            }
        }
    }
};

function arrowIcon(side) {
    let iconName;
    switch (side) {
        case St.Side.TOP:
            iconName = "pan-up";
            break;
        case St.Side.RIGHT:
            iconName = "pan-end";
            break;
        case St.Side.BOTTOM:
            iconName = "pan-down";
            break;
        case St.Side.LEFT:
            iconName = "pan-start";
            break;
    }

    let arrow = new St.Icon({
        style_class: "popup-menu-arrow",
        icon_name: iconName,
        icon_type: St.IconType.SYMBOLIC,
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        important: true
    });

    return arrow;
}

/**
 * Get a boolean from a string.
 *
 * Return true if aVal is identical to "true" or "1". For everything else, return false.
 *
 * @param {aVal}  aObj     - The string to check.
 *
 * @return {Boolean} Boolean representation of a string.
 */
function getBoolean(aVal) {
    return TruthyVals.has(String(aVal).toLowerCase());
}

function parseAttributes(aAttrString) {
    let attrs = {};
    try {
        let [_, a] = GLib.shell_parse_argv(aAttrString); // jshint ignore:line
        let i = a.length;
        while (i--) {
            let assignmentIndex = a[i].indexOf("=");

            if (assignmentIndex >= 0) {
                let key = a[i].substring(0, assignmentIndex).trim().toLowerCase();
                let value = a[i].substring(assignmentIndex + 1).trim();

                /* NOTE: Can't check if attribute exists in DefaultAttributes (to avoid
                 * setting attributes that will not be used) due to the existence
                 * of paramN feature.
                 * Adding complex conditions checking will slow down lines parsing.
                 */
                if (key.length > 0 && value.length > 0) {
                    attrs[key] = BooleanAttrs.has(key) ? getBoolean(value) : value;
                }
            }
        }

        if (attrs.bash ||
            attrs.command ||
            attrs.href ||
            attrs.eval ||
            attrs.refresh) {
            attrs.hasAction = true;
        }

        /* NOTE: The parameter true at the end is to not throw when a not used
         * attribute is added to a parsed line. Those are just ignored.
         */
        return Params.parse(attrs, DefaultAttributes, true);
    } catch (aErr) {
        global.logError("Unable to parse attributes for line '" + aAttrString + "': " + aErr);
    }

    return DefaultAttributes;
}

// Performs (mostly) BitBar-compatible output line parsing
// (see https://github.com/matryer/bitbar#plugin-api)
function parseLine(aLineString) {
    let line = {};

    let separatorIndex = aLineString.indexOf("|");

    if (separatorIndex >= 0) {
        line = parseAttributes(aLineString.substring(separatorIndex + 1));
        line.text = aLineString.substring(0, separatorIndex);
    } else {
        line = Params.parse(line, DefaultAttributes, true);
        line.text = aLineString;
    }

    line.isSeparator = /^-+$/.test(line.text.trim());

    /* NOTE: I'm treating separators separately because I want to be able to
     * insert separators inside sub-menus. That's why I'm setting menuLevel
     * to separators too.
     * I can't use line.text.search(/[^-]/) because it always returns -1
     * when the string contains only dashes. ¬¬
     * I'm not sure about BitBar, but the logic in Argos for Gnome Shell
     * doesn't allow to insert separators inside sub-menus.
     */
    if (line.isSeparator) {
        let dashCount = (line.text.trim().match(/\-/g) || []).length - 3;

        if (dashCount <= 0) {
            line.menuLevel = 0;
        } else {
            line.menuLevel = Math.floor(dashCount / 2);
        }
    } else {
        let leadingDashes = line.text.search(/[^-]/);

        if (leadingDashes >= 2) {
            line.menuLevel = Math.floor(leadingDashes / 2);
            line.text = line.text.substring(line.menuLevel * 2);
        } else {
            line.menuLevel = 0;
        }
    }

    let markupAttributes = [];

    if (line.color) {
        markupAttributes.push("color='" + GLib.markup_escape_text(line.color, -1) + "'");
    }

    if (line.font) {
        markupAttributes.push("font_family='" + GLib.markup_escape_text(line.font, -1) + "'");
    }

    if (line.size) {
        let pointSize = parseFloat(line.size);
        // Pango expects numerical sizes in 1024ths of a point
        // (see https://developer.gnome.org/pango/stable/PangoMarkupFormat.html)
        let fontSize = (isNaN(pointSize)) ? line.size : Math.round(1024 * pointSize).toString();
        markupAttributes.push("font_size='" + GLib.markup_escape_text(fontSize, -1) + "'");
    }

    line.markup = line.text;

    if (line.unescape) {
        line.markup = GLib.strcompress(line.markup);
    }

    if (line.emojize) {
        line.markup = line.markup.replace(/:([\w+-]+):/g, (aMatch, aEmojiName) => {
            let emojiName = aEmojiName.toLowerCase();
            return emojiName in Emojis ? Emojis[emojiName] : aMatch;
        });
    }

    if (line.trim) {
        line.markup = line.markup.trim();
    }

    if (!line.usemarkup) {
        line.markup = GLib.markup_escape_text(line.markup, -1);
        // Restore escaped ESC characters (needed for ANSI sequences)
        line.markup = line.markup.replace("&#x1b;", "\x1b");
    }

    // Note that while it is possible to format text using a combination of Pango markup
    // and ANSI escape sequences, lines like "<b>ABC \e[1m DEF</b>" lead to unmatched tags
    if (line.ansi) {
        line.markup = ansiToMarkup(line.markup);
    }

    if (markupAttributes.length > 0) {
        line.markup = "<span " + markupAttributes.join(" ") + ">" + line.markup + "</span>";
    }

    for (let x in ["bash", "command"]) {
        if (line[x]) {
            // Append BitBar's legacy "paramN" attributes to the bash command
            // (Argos allows placing arguments directly in the command string)
            let i = 1;
            while (line.hasOwnProperty("param" + i)) {
                line[x] += " " + GLib.shell_quote(line["param" + i]);
                i++;
            }
        }
    }

    // Expand ~ to the user's home folder.
    if (line.href) {
        if (/^~\//.test(line.href)) {
            line.href = line.href.replace(/^~\//, "file://" + GLib.get_home_dir() + "/");
        }
    }

    return line;
}

function ansiToMarkup(aText) {
    let markup = "";

    let markupAttributes = {};

    let regex = new GLib.Regex("(\\e\\[([\\d;]*)m)", 0, 0);

    // GLib's Regex.split is a fantastic tool for tokenizing strings because of an important detail:
    // If the regular expression contains capturing groups, their matches are also returned.
    // Therefore, tokens will be an array of the form
    //   TEXT, [(FULL_ESC_SEQUENCE, SGR_SEQUENCE, TEXT), ...]
    let tokens = regex.split(aText, 0);

    let i = 0,
        iLen = tokens.length;
    for (; i < iLen; i++) {
        if (regex.match(tokens[i], 0)[0]) {
            // Default is SGR 0 (reset)
            let sgrSequence = (tokens[i + 1].length > 0) ? tokens[i + 1] : "0";
            let sgrCodes = sgrSequence.split(";");

            let j = 0,
                jLen = sgrCodes.length;
            for (; j < jLen; j++) {
                if (sgrCodes[j].length === 0) {
                    continue;
                }

                let code = parseInt(sgrCodes[j], 10);

                if (code === 0) {
                    // Reset all attributes
                    markupAttributes = {};
                } else if (code === 1) {
                    markupAttributes.font_weight = "bold";
                } else if (code === 3) {
                    markupAttributes.font_style = "italic";
                } else if (code === 4) {
                    markupAttributes.underline = "single";
                } else if (30 <= code && code <= 37) {
                    markupAttributes.color = AnsiColors[code - 30];
                } else if (40 <= code && code <= 47) {
                    markupAttributes.bgcolor = AnsiColors[code - 40];
                }
            }

            let textToken = tokens[i + 2];

            if (textToken.length > 0) {
                let attributeString = "";
                for (let attribute in markupAttributes) {
                    attributeString += " " + attribute + "='" + markupAttributes[attribute] + "'";
                }

                if (attributeString.length > 0) {
                    markup += "<span" + attributeString + ">" + textToken + "</span>";
                } else {
                    markup += textToken;
                }
            }

            // Skip processed tokens
            i += 2;

        } else {
            markup += tokens[i];
        }
    }

    return markup;
}

function CustomPanelItemTooltip() {
    this._init.apply(this, arguments);
}

CustomPanelItemTooltip.prototype = {
    __proto__: Tooltips.PanelItemTooltip.prototype,
    elementIDs: [
        "scriptName",
        "execInterval",
        "rotationInterval",
        "scriptExecTime",
        "outputProcesstime"
    ],

    _init: function(aApplet, aOrientation) {
        Tooltips.PanelItemTooltip.prototype._init.call(this, aApplet, "", aOrientation);

        // Destroy the original _tooltip, which is a St.Label.
        this._tooltip.destroy();

        let tooltipBox = new Clutter.GridLayout({
            orientation: Clutter.Orientation.VERTICAL
        });

        this._tooltip = new St.Bin({
            name: "Tooltip"
        });
        this._tooltip.get_text = () => {
            return "I'm a dummy string.";
        };
        this._tooltip.show_on_set_parent = false;

        this._tooltip.set_child(new St.Widget({
            layout_manager: tooltipBox
        }));

        let ellipsisObj = {
            text: Placeholders.ELLIPSIS
        };
        let blankObj = {
            text: Placeholders.BLANK
        };
        let markupTemp = "<b>%s</b>: ";

        this.__scriptNameTitle = new St.Label();
        this.__scriptNameTitle.clutter_text.set_markup(markupTemp
            .format(_("Script file name")));
        this.__scriptNameValue = new St.Label(ellipsisObj);

        this.__execIntervalTitle = new St.Label();
        this.__execIntervalTitle.clutter_text.set_markup(markupTemp
            .format(_("Execution interval")));
        this.__execIntervalValue = new St.Label(ellipsisObj);

        this.__rotationIntervalTitle = new St.Label();
        this.__rotationIntervalTitle.clutter_text.set_markup(markupTemp
            .format(_("Rotation interval")));
        this.__rotationIntervalValue = new St.Label(ellipsisObj);

        this.__scriptExecTimeTitle = new St.Label();
        this.__scriptExecTimeTitle.clutter_text.set_markup(markupTemp
            .format(_("Script execution time")));
        this.__scriptExecTimeValue = new St.Label(ellipsisObj);

        this.__outputProcesstimeTitle = new St.Label();
        this.__outputProcesstimeTitle.clutter_text.set_markup(markupTemp
            .format(_("Output process time")));
        this.__outputProcesstimeValue = new St.Label(ellipsisObj);

        let appletName = new St.Label();
        appletName.clutter_text.set_markup("<b>%s</b>".format(_(XletMeta.name)));
        tooltipBox.attach(appletName, 0, 0, 1, 1);
        tooltipBox.attach(new St.Label(blankObj), 0, 1, 1, 1);

        let i = 0,
            iLen = this.elementIDs.length;
        for (; i < iLen; i++) {
            tooltipBox.attach(
                this["__" + this.elementIDs[i] + "Title"], 0, i + 2, 1, 1
            );
            tooltipBox.attach(new St.Label(blankObj), 1, i + 2, 1, 1);
            tooltipBox.attach(
                this["__" + this.elementIDs[i] + "Value"], 2, i + 2, 1, 1
            );
        }

        Main.uiGroup.add_actor(this._tooltip);
    },

    set_text: function(aObj) {
        let i = 0,
            iLen = this.elementIDs.length;
        for (; i < iLen; i++) {
            this["__" + this.elementIDs[i] + "Value"].set_text(aObj[this.elementIDs[i]]);
        }
    }
};

/* exported parseLine,
            Debugger,
            Notification
 */
