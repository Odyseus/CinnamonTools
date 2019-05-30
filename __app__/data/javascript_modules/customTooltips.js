const {
    gi: {
        Gio,
        Pango,
        St
    },
    ui: {
        main: Main,
        tooltips: Tooltips
    }
} = imports;

/**
 * An instance of Tooltips.Tooltip with enhancements:
 *
 * 1. Positioning of the tooltip above the mouse cursor if the tooltip is too big
 *     to fit the screen. This is only useful for tooltips close the the bottom of
 *     the screen. Top panel users will surely be screwed if a tooltip is bigger than
 *     the screen height. LOL
 * 2. Text alignment is enforced to right or left depending on language direction.
 *     This was done because some Cinnamon themes have set text-align for the Tooltip ID
 *     to be centered. This breaks text displayed in a grid inside the tooltip.
 *     Plus, I f*cking hate reading centered text, so I will NOT have it.
 * 3. The tooltip max. width is forced to half the monitor width. This was done
 *     for two reasons. First, because a tooltip occupying the entire screen is super
 *     annoying. And second, the default tooltips have no line wrapping.
 */
function InteligentTooltip() {
    this._init.apply(this, arguments);
}

InteligentTooltip.prototype = {
    __proto__: Tooltips.Tooltip.prototype,

    _init: function(aActor, aTitle) {
        Tooltips.Tooltip.prototype._init.call(this, aActor, aTitle);

        this._tooltip.get_clutter_text().set_line_wrap(true);
        this._tooltip.get_clutter_text().set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        this._tooltip.get_clutter_text().ellipsize = Pango.EllipsizeMode.NONE; // Just in case

        this.desktop_settings = new Gio.Settings({
            schema_id: "org.cinnamon.desktop.interface"
        });
    },

    show: function() {
        if (this._tooltip.get_text() == "" || !this.mousePosition) {
            return;
        }

        let tooltipWidth = this._tooltip.get_allocation_box().x2 - this._tooltip.get_allocation_box().x1;
        let tooltipHeight = this._tooltip.get_allocation_box().y2 - this._tooltip.get_allocation_box().y1;

        let monitor = Main.layoutManager.findMonitorForActor(this.item);

        let rtl = (St.Widget.get_default_direction() === St.TextDirection.RTL);

        let cursorSize = this.desktop_settings.get_int("cursor-size");
        let tooltipTop = this.mousePosition[1] + Math.round(cursorSize / 1.5);
        let tooltipLeft = this.mousePosition[0] + Math.round(cursorSize / 2);
        tooltipLeft = Math.max(tooltipLeft, monitor.x);
        tooltipLeft = Math.min(tooltipLeft, monitor.x + monitor.width - tooltipWidth);

        if (tooltipTop + tooltipHeight > monitor.height) {
            tooltipTop = tooltipTop - tooltipHeight - Math.round(cursorSize);
        }

        this._tooltip.set_position(tooltipLeft, tooltipTop);

        this._tooltip.set_style("text-align: %s;width:auto;max-width: %spx;".format(
            // Align to right or left depending on default direction.
            rtl ? "right" : "left",
            // Set max. width of tooltip to half the width of the monitor.
            String(Math.round(Number(monitor.width) / 2))
        ));

        this._tooltip.show();
        this._tooltip.raise_top();
        this.visible = true;
    }
};

/**
 * An instance of Tooltips.PanelItemTooltip that aligns the text to the left or right
 * depending on the system language. This is to override the centered alignment set
 * by some themes. ¬¬
 */
function CustomPanelTooltip() {
    this._init.apply(this, arguments);
}

CustomPanelTooltip.prototype = {
    __proto__: Tooltips.PanelItemTooltip.prototype,

    _init: function(aPanelItem, aInitTitle, aOrientation) {
        Tooltips.PanelItemTooltip.prototype._init.call(this, aPanelItem, aInitTitle, aOrientation);
        let rtl = (St.Widget.get_default_direction() === St.TextDirection.RTL);
        this._tooltip.set_style("text-align:%s;".format(rtl ? "right" : "left"));
    },

    set_text: function(text) {
        this._tooltip.get_clutter_text().set_markup(text);
    }
};
