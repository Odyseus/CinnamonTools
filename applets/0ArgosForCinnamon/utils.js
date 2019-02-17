const {
    gettext: Gettext,
    gi: {
        Clutter,
        GdkPixbuf,
        Gio,
        GLib,
        Pango,
        St
    },
    misc: {
        params: Params,
        util: Util
    },
    ui: {
        main: Main,
        messageTray: MessageTray,
        popupMenu: PopupMenu,
        tooltips: Tooltips
    }
} = imports;

const GioSSS = Gio.SettingsSchemaSource;

let Emojis;
// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    Emojis = require("./emojis.js").Emojis;
} else {
    Emojis = imports.ui.appletManager.applets["{{UUID}}"].emojis.Emojis;
}

var Constants;
// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    Constants = require("./constants.js");
} else {
    Constants = imports.ui.appletManager.applets["{{UUID}}"].constants;
}

const XletMeta = Constants.XletMeta;

const {
    AnsiColors,
    BooleanAttrs,
    DebugManagerSchema,
    DefaultAttributes,
    NotificationUrgency,
    OrnamentType,
    Placeholders,
    TruthyVals,
} = Constants;

Gettext.bindtextdomain(XletMeta.uuid, GLib.get_home_dir() + "/.local/share/locale");

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
    let customTrans = Gettext.dgettext(XletMeta.uuid, aStr);

    if (customTrans !== aStr && aStr !== "") {
        return customTrans;
    }

    return Gettext.gettext(aStr);
}

/**
 * Return the localized translation of a string, based on the xlet domain or the
 * current global domain (Cinnamon's), but consider plural forms. If a translation
 * is found, apply the plural formula to aN, and return the resulting message
 * (some languages have more than two plural forms). If no translation is found,
 * return singular if aN is 1; return plural otherwise.
 *
 * This function "overrides" the ngettext() function globally defined by Cinnamon.
 *
 * @param {String}  aSingular - The singular string being translated.
 * @param {String}  aPlural   - The plural string being translated.
 * @param {Integer} aN        - The number (e.g. item count) to determine the translation for
 * the respective grammatical number.
 *
 * @return {String} The translated string.
 */
function ngettext(aSingular, aPlural, aN) {
    let customTrans = Gettext.dngettext(XletMeta.uuid, aSingular, aPlural, aN);

    if (aN === 1) {
        if (customTrans !== aSingular) {
            return customTrans;
        }
    } else {
        if (customTrans !== aPlural) {
            return customTrans;
        }
    }

    return Gettext.ngettext(aSingular, aPlural, aN);
}

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

const SLIDER_SCALE = 0.00025;

const UNITS_MAP = {
    s: {
        capital: _("Seconds")
    },
    m: {
        capital: _("Minutes")
    },
    h: {
        capital: _("Hours")
    },
    d: {
        capital: _("Days")
    }
};

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
    _init: function(aApplet, aLine) {
        this._applet = aApplet;

        this.actor = new St.BoxLayout();
        this.actor._delegate = this;

        if (typeof aLine !== "undefined") {
            this.setLine(aLine);
        }
    },

    setLine: function(aLine) {
        this.line = aLine;

        this.actor.remove_all_children();

        if (aLine.iconName) {
            let icon = null;
            let iconName = aLine.iconName;
            let iconSize = aLine.iconSize ?
                aLine.iconSize :
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
                    icon_type: (aLine.iconIsSymbolic ?
                        St.IconType.SYMBOLIC :
                        St.IconType.FULLCOLOR)
                });
            }

            if (icon !== null) {
                this.actor.add_actor(icon);
            }
        }

        if (aLine.image || aLine.templateImage) {
            let image = aLine.image ?
                aLine.image :
                aLine.templateImage ?
                aLine.templateImage :
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

                let width = parseInt(aLine.imageWidth, 10);
                let height = parseInt(aLine.imageHeight, 10);

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
    _init: function(aStandard, aAlternate) {
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

        let altSwitcher = null;

        let lineView = new ArgosLineView(aApplet, aLine);
        lineView.actor.set_style("spacing: " + aApplet.pref_menu_spacing + "em;");

        if (aLine.tooltip) {
            this.tooltip = new CustomTooltip(
                this.actor,
                aLine.tooltip
            );
        }

        if (aAlternateLine === null) {
            this.addActor(lineView.actor);
        } else {
            let alternateLineView = new ArgosLineView(aApplet, aAlternateLine);
            alternateLineView.actor.set_style("spacing: " + aApplet.pref_menu_spacing + "em;");
            // The following class and pseudo class are set so the AltSwitcher is styled somewhat
            // the same as the Cinnamon's default.
            alternateLineView.actor.add_style_class_name("popup-alternating-menu-item");
            alternateLineView.actor.add_style_pseudo_class("alternate");
            altSwitcher = new AltSwitcher(lineView.actor, alternateLineView.actor);
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
                    let shellArg = activeLine.shellArgument ?
                        activeLine.shellArgument :
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
                            aApplet.pref_terminal_emulator_argument,
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

/*
A custom tooltip with the following features:
- Text aligned to the left.
- Line wrap set to true.
- A max width of 450 pixels to force the line wrap.
*/
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
                let key = a[i].substring(0, assignmentIndex).trim();
                let value = a[i].substring(assignmentIndex + 1).trim();

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

    if (!line.useMarkup) {
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

// Combines the benefits of spawn sync (easy retrieval of output)
// with those of spawn_async (non-blocking execution).
// Based on https://github.com/optimisme/gjs-examples/blob/master/assets/spawn.js.
function spawnWithCallback(aWorkingDirectory, aArgv, aEnvp, aFlags, aChildSetup, aCallback) {
    let [success, pid, stdinFile, stdoutFile, stderrFile] = // jshint ignore:line
    GLib.spawn_async_with_pipes(aWorkingDirectory, aArgv, aEnvp, aFlags, aChildSetup);

    if (!success) {
        return;
    }

    GLib.close(stdinFile);

    let standardOutput = "";

    let stdoutStream = new Gio.DataInputStream({
        base_stream: new Gio.UnixInputStream({
            fd: stdoutFile
        })
    });

    readStream(stdoutStream, (aOutput) => {
        if (aOutput === null) {
            stdoutStream.close(null);
            aCallback(standardOutput);
        } else {
            standardOutput += aOutput;
        }
    });

    let standardError = "";

    let stderrStream = new Gio.DataInputStream({
        base_stream: new Gio.UnixInputStream({
            fd: stderrFile
        })
    });

    readStream(stderrStream, (aError) => {
        if (aError === null) {
            stderrStream.close(null);

            if (standardError) {
                global.logError(standardError);
            }
        } else {
            standardError += aError;
        }
    });
}

function readStream(aStream, aCallback) {
    aStream.read_line_async(GLib.PRIORITY_LOW, null, (aSource, aResult) => {
        let [line] = aSource.read_line_finish(aResult);

        if (line === null) {
            aCallback(null);
        } else {
            aCallback(String(line) + "\n");
            readStream(aSource, aCallback);
        }
    });
}

// KEEP ME: There will always be non retro compatible changes on Cinnamon as long
// as it keeps being treated as a F***ING web application!!!
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
// function versionCompare(v1, v2, options) {
//     let lexicographical = options && options.lexicographical,
//         zeroExtend = options && options.zeroExtend,
//         v1parts = v1.split("."),
//         v2parts = v2.split(".");

//     function isValidPart(x) {
//         return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
//     }

//     if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
//         return NaN;
//     }

//     if (zeroExtend) {
//         while (v1parts.length < v2parts.length) {
//             v1parts.push("0");
//         }
//         while (v2parts.length < v1parts.length) {
//             v2parts.push("0");
//         }
//     }

//     if (!lexicographical) {
//         v1parts = v1parts.map(Number);
//         v2parts = v2parts.map(Number);
//     }

//     for (let i = 0; i < v1parts.length; ++i) {
//         if (v2parts.length === i) {
//             return 1;
//         }

//         if (v1parts[i] === v2parts[i]) {
//             continue;
//         } else if (v1parts[i] > v2parts[i]) {
//             return 1;
//         } else {
//             return -1;
//         }
//     }

//     if (v1parts.length !== v2parts.length) {
//         return -1;
//     }

//     return 0;
// }

function informAboutMissingDependencies(aMsg, aRes) {
    customNotify(
        _(XletMeta.name),
        aMsg + "\n" + "<b>" + aRes + "</b>" + "\n\n" +
        _("Check this applet help file for instructions."),
        "dialog-warning",
        NotificationUrgency.CRITICAL, [{
            label: _("Help"), // Just in case.
            tooltip: _("Open this applet help file."),
            callback: () => {
                // Use of launch_default_for_uri instead of executing "xdg-open"
                // asynchronously because most likely this is informing
                // of a failed command that could be "xdg-open".
                Gio.AppInfo.launch_default_for_uri(
                    "file://" + XletMeta.path + "/HELP.html",
                    null
                );
            }
        }]);
}

function customNotify(aTitle, aBody, aIconName, aUrgency, aButtons) {
    let icon = new St.Icon({
        icon_name: aIconName,
        icon_type: St.IconType.SYMBOLIC,
        icon_size: 24
    });
    let source = new MessageTray.SystemNotificationSource();
    Main.messageTray.add(source);
    let notification = new MessageTray.Notification(source, aTitle, aBody, {
        icon: icon,
        bodyMarkup: true,
        titleMarkup: true,
        bannerMarkup: true
    });
    notification.setTransient(aUrgency === NotificationUrgency.LOW);

    if (aUrgency !== NotificationUrgency.LOW && typeof aUrgency === "number") {
        notification.setUrgency(aUrgency);
    }

    try {
        if (aButtons && typeof aButtons === "object") {
            let destroyEmitted = (aButton) => {
                return () => aButton.tooltip.destroy();
            };

            let i = 0,
                iLen = aButtons.length;
            for (; i < iLen; i++) {
                let btnObj = aButtons[i];
                try {
                    if (!notification._buttonBox) {

                        let box = new St.BoxLayout({
                            name: "notification-actions"
                        });
                        notification.setActionArea(box, {
                            x_expand: true,
                            y_expand: false,
                            x_fill: true,
                            y_fill: false,
                            x_align: St.Align.START
                        });
                        notification._buttonBox = box;
                    }

                    let button = new St.Button({
                        can_focus: true
                    });

                    if (btnObj.iconName) {
                        notification.setUseActionIcons(true);
                        button.add_style_class_name("notification-icon-button");
                        button.child = new St.Icon({
                            icon_name: btnObj.iconName,
                            icon_type: St.IconType.SYMBOLIC,
                            icon_size: 16
                        });
                    } else {
                        button.add_style_class_name("notification-button");
                        button.label = btnObj.label;
                    }

                    button.connect("clicked", btnObj.callback);

                    if (btnObj.tooltip) {
                        button.tooltip = new Tooltips.Tooltip(
                            button,
                            btnObj.tooltip
                        );
                        button.connect("destroy", destroyEmitted(button));
                    }

                    if (notification._buttonBox.get_n_children() > 0) {
                        notification._buttonFocusManager.remove_group(notification._buttonBox);
                    }

                    notification._buttonBox.add(button);
                    notification._buttonFocusManager.add_group(notification._buttonBox);
                    notification._inhibitTransparency = true;
                    notification.updateFadeOnMouseover();
                    notification._updated();
                } catch (aErr) {
                    global.logError(aErr);
                    continue;
                }
            }
        }
    } finally {
        source.notify(notification);
    }
}

function escapeHTML(aStr) {
    aStr = String(aStr)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    return aStr;
}

/**
 * Benchmark function invocations within a given class or prototype.
 *
 * @param  {Object}  aObject                    JavaScript class or prototype to benchmark.
 * @param  {Object}  aParams                    Object containing parameters, all are optional.
 * @param  {String}  aParams.objectName         Because it's impossible to get the name of a prototype
 *                                              in JavaScript, force it down its throat. ¬¬
 * @param  {Array}   aParams.methods            By default, all methods in aObject will be
 *                                              "proxyfied". aParams.methods should containg the name
 *                                              of the methods that one wants to debug/benchmark.
 *                                              aParams.methods acts as a whitelist by default.
 * @param  {Boolean} aParams.blacklistMethods   If true, ALL methods in aObject will be
 *                                              debugged/benchmarked, except those listed in aParams.methods.
 * @param  {Number}  aParams.threshold          The minimum latency of interest.
 * @param  {Boolean}  aParams.debug              If true, the target method will be executed inside a
 *                                              try{} catch{} block.
 */
function prototypeDebugger(aObject, aParams) {
    let options = Params.parse(aParams, {
        objectName: "Object",
        methods: [],
        blacklistMethods: false,
        debug: true,
        threshold: 3
    });
    let keys = Object.getOwnPropertyNames(aObject.prototype);

    if (options.methods.length > 0) {
        keys = keys.filter((aKey) => {
            return options.blacklistMethods ?
                // Treat aMethods as a blacklist, so don't include these keys.
                options.methods.indexOf(aKey) === -1 :
                // Keep ONLY the keys in aMethods.
                options.methods.indexOf(aKey) >= 0;
        });
    }

    let outpuTemplate = "[%s.%s]: %fms (MAX: %fms AVG: %fms)";
    let times = [];
    let i = keys.length;

    let getHandler = (aKey) => {
        return {
            apply: function(aTarget, aThisA, aArgs) { // jshint ignore:line
                let val;
                let now = GLib.get_monotonic_time();

                if (options.debug) {
                    try {
                        val = aTarget.apply(aThisA, aArgs);
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                } else {
                    val = aTarget.apply(aThisA, aArgs);
                }

                let time = GLib.get_monotonic_time() - now;

                if (time >= options.threshold) {
                    times.push(time);
                    let total = 0;
                    let timesLength = times.length;
                    let z = timesLength;

                    while (z--) {
                        total += times[z];
                    }

                    let max = (Math.max.apply(null, times) / 1000).toFixed(2);
                    let avg = ((total / timesLength) / 1000).toFixed(2);
                    time = (time / 1000).toFixed(2);

                    global.log(outpuTemplate.format(
                        options.objectName,
                        aKey,
                        time,
                        max,
                        avg
                    ));
                }

                return val;
            }
        };
    };

    while (i--) {
        let key = keys[i];

        /* NOTE: If key is a setter or getter, aObject.prototype[key] will throw.
         */
        if (!!Object.getOwnPropertyDescriptor(aObject.prototype, key)["get"] ||
            !!Object.getOwnPropertyDescriptor(aObject.prototype, key)["set"]) {
            continue;
        }

        let fn = aObject.prototype[key];

        if (typeof fn !== "function") {
            continue;
        }

        aObject.prototype[key] = new Proxy(fn, getHandler(key));
    }
}

function DebugManager() {
    this._init.apply(this, arguments);
}

DebugManager.prototype = {
    _init: function() {
        let schema = DebugManagerSchema;
        let schemaDir = Gio.file_new_for_path(XletMeta.path + "/schemas");
        let schemaSource;

        if (schemaDir.query_exists(null)) {
            schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
                GioSSS.get_default(),
                false);
        } else {
            schemaSource = GioSSS.get_default();
        }

        this.schemaObj = schemaSource.lookup(schema, false);

        if (!this.schemaObj) {
            throw new Error(_("Schema %s could not be found for xlet %s.")
                .format(schema, XletMeta.uuid) + _("Please check your installation."));
        }

        this.schema = new Gio.Settings({
            settings_schema: this.schemaObj
        });

        this._handlers = [];
    },

    set verboseLogging(aValue) {
        this.schema.set_boolean("pref-enable-verbose-logging", aValue);
    },

    get verboseLogging() {
        return this.schema.get_boolean("pref-enable-verbose-logging");
    },

    connect: function(signal, callback) {
        let handler_id = this.schema.connect(signal, callback);
        this._handlers.push(handler_id);
        return handler_id;
    },

    destroy: function() {
        // Remove the remaining signals...
        while (this._handlers.length) {
            this.disconnect(this._handlers[0]);
        }
    },

    disconnect: function(handler_id) {
        let index = this._handlers.indexOf(handler_id);
        this.schema.disconnect(handler_id);

        if (index > -1) {
            this._handlers.splice(index, 1);
        }
    }
};

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
        "outputProcesstime",
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
            text: Placeholders.ELLIPSIS,
        };
        let blankObj = {
            text: Placeholders.BLANK,
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
            spawnWithCallback,
            informAboutMissingDependencies,
            escapeHTML,
            prototypeDebugger,
            versionCompare
 */
