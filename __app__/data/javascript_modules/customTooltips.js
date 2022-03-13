const {
    gi: {
        Clutter,
        Gio,
        Pango,
        St
    },
    misc: {
        params: Params
    },
    ui: {
        main: Main,
        tooltips: Tooltips
    }
} = imports;

const {
    _,
    arrayEach
} = require("js_modules/globalUtils.js");

var IntelligentTooltipParams = Object.freeze({
    max_width: 0,
    text_alignement: "" // "left", "right", "center" or " justify".
});

var CustomPanelItemTooltipParams = Object.freeze({
    label: "",
    grid_data: null,
    grid_sort_data: false,
    grid_desc_sep: " : "
});

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
var IntelligentTooltip = class IntelligentTooltip extends Tooltips.Tooltip {
    constructor(aActor, aTitle, aOverrides) {
        super(aActor, aTitle);

        this.overrides = Params.parse(aOverrides, IntelligentTooltipParams);

        this._tooltip.get_clutter_text().set_line_wrap(true);
        this._tooltip.get_clutter_text().set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        this._tooltip.get_clutter_text().ellipsize = Pango.EllipsizeMode.NONE; // Just in case

        this.desktop_settings = new Gio.Settings({
            schema_id: "org.cinnamon.desktop.interface"
        });
    }

    show() {
        if (this._tooltip.get_text() === "" || !this.mousePosition) {
            return;
        }

        const monitor = Main.layoutManager.findMonitorForActor(this.item);
        const rtl = (St.Widget.get_default_direction() === St.TextDirection.RTL);

        this._tooltip.set_style("text-align: %s;width:auto;max-width: %spx;".format(
            (this.overrides.text_alignement ?
                // Set a custom text alignement...
                this.overrides.text_alignement :
                // ...or an automatic alignement depending on default text direction.
                (rtl ? "right" : "left")),
            (this.overrides.max_width > 0 ?
                // Set a custom max. tooltip width...
                this.overrides.max_width :
                // ...or a fixed max. width not greater than half the monitor width.
                String(Math.round(Number(monitor.width) / 2)))
        ));

        // NOTE: Ultra cheap hack to fix retarded behavior.
        // Getting the tooltip width before it was ever shown could get a tooltip width
        // bigger than the monitor width, producing tooltips that will show up outside the
        // monitor view. SO, "display the tooltip hidden" once before getting its width.
        // MOVING THE F*CK ON!!!
        this._tooltip.set_opacity(0);
        this._tooltip.show();
        this._tooltip.hide();
        this._tooltip.set_opacity(255);

        const tooltipWidth = this._tooltip.get_allocation_box().x2 - this._tooltip.get_allocation_box().x1;
        const tooltipHeight = this._tooltip.get_allocation_box().y2 - this._tooltip.get_allocation_box().y1;
        const cursorSize = this.desktop_settings.get_int("cursor-size");
        let tooltipTop = this.mousePosition[1] + Math.round(cursorSize / 1.5);
        let tooltipLeft = this.mousePosition[0] + Math.round(cursorSize / 2);
        tooltipLeft = Math.max(tooltipLeft, monitor.x);
        tooltipLeft = Math.min(tooltipLeft, monitor.x + monitor.width - tooltipWidth);

        // NOTE: If the tooltip doesn't fit under the cursor, display it over the cursor.
        if (tooltipTop + tooltipHeight > monitor.height) {
            tooltipTop = tooltipTop - tooltipHeight - Math.round(cursorSize);
        }

        // NOTE: If the tooltip is to big to fit over the cursor, at least make the top of the
        // tooltip "touch" the top of the screen.
        if (tooltipTop < monitor.y) {
            tooltipTop = 0;
        }

        this._tooltip.set_position(tooltipLeft, tooltipTop);

        this._tooltip.show();
        this._tooltip.raise_top();
        this.visible = true;
    }
};

/**
 * An instance of Tooltips.PanelItemTooltip that aligns the text to the left or right
 * depending on the system language. This is to override the centered alignment set
 * by some themes. ¬¬
 *
 * It has the extra capability of displaying data in a grid for easy reading and comprehension.
 * Practical example using a gridded layout:
 *
 * ```
 * Scroll       : Switch between workspaces
 * Left click   : Toggle show desktop
 * Middle click : Run 3rd Custom Command
 * Right click  : Open windows list menu
 * ```
 *
 * The same example NOT using a gridded layout:
 *
 * ```
 * Scroll : Switch between workspaces
 * Left click : Toggle show desktop
 * Middle click : Run 3rd Custom Command
 * Right click : Open windows list menu
 * ```
 *
 * @param {Object}           aApplet                - The applet the tooltip belongs to.
 * @param {Integer}          aOrientation           - The applet orientation.
 * @param {Object}           aParams                - Parameters.
 * @param {String}           aParams.label          - Text to display on the tooltip.
 *                                                    If grid_data exists, this label will act as a
 *                                                    title and set to bold.
 * @param {Array|Map|Object} aParams.grid_data      - Data to build the grid with.
 *                                                    Array: Should be an array of arrays with only
 *                                                           2 elements. The first element should be a title
 *                                                           and the second its description.
 *                                                           Use Array to create tooltips with static data.
 *                                                    Map: A map of IDs mapped to titles.
 *                                                         The IDs are used to create and store the labels
 *                                                         that will display the descriptions dynamically.
 *                                                         Use Array to create tooltips with dynamic data and
 *                                                         the order of the data should be the insertion order.
 *                                                    Object: Same as Map, but simpler to define and insertion
 *                                                            order would not matter if
 *                                                            aParams.grid_sort_data is true.
 * @param {Boolean}          aParams.grid_sort_data - Sort data alphabetically by titles. Mostly useful
 *                                                    for tooltips with dynamic data created with Objects.
 * @param {String}           aParams.grid_desc_sep  - The cell created from the grid data are separated by another cell.
 *                                                    This option allows to choose what to display as a separator.
 *
 * @type {Class}
 */
var CustomPanelItemTooltip = class CustomPanelItemTooltip extends Tooltips.PanelItemTooltip {
    constructor(aApplet, aOrientation, aParams = {}) {
        super(aApplet, "", aOrientation);

        // Destroy the original _tooltip, which is an St.Label.
        this._tooltip.destroy();

        this.params = Params.parse(aParams, CustomPanelItemTooltipParams);
        this.__grid_data_map = null;
        this.__tooltipBox = null;
        this.__storage = new Map();
        this.__markupTemplate = "<b>%s</b>";
        this.__ellipsisObj = {
            text: "..."
        };

        this._tooltip = new St.BoxLayout({
            name: "Tooltip",
            vertical: true,
            x_align: Clutter.ActorAlign.START,
            x_expand: true
        });
        this._tooltip.show_on_set_parent = false;

        const rtl = (St.Widget.get_default_direction() === St.TextDirection.RTL);
        this._tooltip.set_style("text-align:%s;".format(rtl ? "right" : "left"));

        /* NOTE: This is a workaround because Tooltip instances have the _tooltip property hard-coded
         * to be an St.Label(). And the Tooltip's show method calls this._tooltip.get_text() to decide
         * if the tooltip should be displayed or not.
         */
        this._tooltip.get_text = () => {
            return _(__meta.name);
        };

        this.__label = this.__getBaseLabel();
        this._tooltip.add(this.__label, {
            y_fill: true,
            expand: true
        });

        if (this.params.grid_data !== null) {
            const sep = this.__getBaseLabel();
            sep.set_style("height: 5px;");
            this._tooltip.add(sep, {
                y_fill: true,
                expand: true
            });

            this.__tooltipBox = new Clutter.GridLayout({
                orientation: Clutter.Orientation.VERTICAL
            });

            this._tooltip.add(new St.Widget({
                layout_manager: this.__tooltipBox
            }), {
                y_fill: true,
                expand: true
            });

            if (Array.isArray(this.params.grid_data)) {
                this.__buildStaticGrid();
            } else {
                this.__grid_data_map = this.params.grid_data instanceof Map ?
                    this.params.grid_data :
                    Object.entries(this.params.grid_data);

                this.__buildDynamicGrid();
            }
        }

        this.params.label && this.set_text(this.params.label);

        // Add tooltip back since the original was destroyed.
        Main.uiGroup.add_actor(this._tooltip);
    }

    set_text(aText) {
        // NOTE: If this.__tooltipBox exists, this.__label acts as a title. Else the label is just text.
        if (this.__tooltipBox) {
            this.__label.clutter_text.set_markup(this.__markupTemplate.format(aText));
        } else {
            this.__label.set_text(aText);
        }
    }

    set_text_by_id(aID, aValue) {
        this.__storage.get(String(aID)).set_text(aValue);
    }

    __buildDynamicGrid() {
        if (this.params.grid_sort_data) {
            this.__grid_data_map = new Map([...this.__grid_data_map.entries()].sort((a, b) => {
                return a[0].localeCompare(b[0]);
            }));
        }

        let row = 0;
        for (const id of this.__grid_data_map.keys()) {
            const title = this.__getBaseLabel();
            title.clutter_text.set_markup(
                this.__markupTemplate.format(this.__grid_data_map.get(id))
            );
            // NOTE: IDs are explicitly stored and accessed as strings.
            this.__storage.set(String(id), new St.Label(this.__ellipsisObj));

            this.__tooltipBox.attach(title, 0, row, 1, 1);
            this.__tooltipBox.attach(new St.Label({
                text: this.params.grid_desc_sep
            }), 1, row, 1, 1);
            this.__tooltipBox.attach(this.__storage.get(String(id)), 2, row, 1, 1);
            row += 1;
        }
    }

    __buildStaticGrid() {
        arrayEach(this.params.grid_data, (aGridData, aIdx) => {
            const [title, value] = aGridData;

            this.__tooltipBox.attach(this.__createStaticCell(title, true), 0, aIdx, 1, 1);
            this.__tooltipBox.attach(new St.Label({
                text: this.params.grid_desc_sep
            }), 1, aIdx, 1, 1);
            this.__tooltipBox.attach(this.__createStaticCell(value), 2, aIdx, 1, 1);
        });
    }

    __createStaticCell(aText, aAsMarkup = false) {
        const label = this.__getBaseLabel();

        if (aAsMarkup) {
            label.clutter_text.set_markup(this.__markupTemplate.format(aText));
        } else {
            label.set_text(aText);
        }

        return label;
    }

    __getBaseLabel() {
        const label = new St.Label();
        label.get_clutter_text().set_line_wrap(true);
        label.get_clutter_text().set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        label.get_clutter_text().ellipsize = Pango.EllipsizeMode.NONE; // Just in case

        return label;
    }
};

/* exported IntelligentTooltip,
            CustomPanelItemTooltip
 */
