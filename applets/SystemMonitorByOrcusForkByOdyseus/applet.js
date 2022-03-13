const $ = require("js_modules/utils.js");

const {
    gi: {
        GLib,
        St
    },
    ui: {
        applet: Applet,
        popupMenu: PopupMenu
    }
} = imports;

const {
    _,
    escapeHTML,
    tryFn
} = require("js_modules/globalUtils.js");

const {
    NotificationUrgency
} = require("js_modules/notificationsUtils.js");

const {
    APPLET_PREFS,
    ProvidersData
} = require("js_modules/constants.js");

const {
    CustomPanelItemTooltip
} = require("js_modules/customTooltips.js");

const {
    colorToArray,
    Debugger,
    Graph,
    GTop,
    LoadData,
    Notification
} = $;

const {
    getBaseAppletClass
} = require("js_modules/appletsUtils.js");

class SystemMonitor extends getBaseAppletClass(Applet.TextIconApplet) {
    constructor(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
        super({
            metadata: aMetadata,
            orientation: aOrientation,
            panel_height: aPanelHeight,
            instance_id: aInstanceID,
            pref_keys: APPLET_PREFS,
            init_menu: false
        });

        this.holdInitialization = false;

        this.__initializeApplet(() => {
            this._expandAppletContextMenu();

            /* NOTE: Inform about missing dependency AFTER the applet context menu is expanded.
             * Otherwise, the Help menu item in the context menu will not exist.
             */
            if (!GTop) {
                this._informDependency();
                this.holdInitialization = true;
            }
        }, () => {
            if (this.holdInitialization) {
                return;
            }

            this.vertical = this.$.orientation === St.Side.LEFT || this.$.orientation === St.Side.RIGHT;

            this.graphs = new Set();
            this.resolution_needs_update = true;

            this.area = new St.DrawingArea();
            this.actor.add_child(this.area);

            this._changeGraphEnabled();
            this._changePadding();
            this._updateKeybindings();
            this._startRefreshLoop();
        });
    }

    __connectSignals() {
        this.$.signal_manager.connect(this.area, "repaint", function() {
            this.paint();
        }.bind(this));
        this.$.signal_manager.connect(this, "orientation-changed", function() {
            this.__seekAndDetroyConfigureContext();
        }.bind(this));
    }

    _expandAppletContextMenu() {
        const menuItem = new PopupMenu.PopupIconMenuItem(
            _("Help"),
            "dialog-information",
            St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => this.__openHelpPage());
        this._applet_context_menu.addMenuItem(menuItem);

        this.__seekAndDetroyConfigureContext();
    }

    _informDependency() {
        this.$.schedule_manager.idleCall("inform_dependency", function() {
            this._applet_icon_box.show();
            this.set_applet_icon_symbolic_name("dialog-error");
            const msg = [
                escapeHTML(_("Missing dependency!!!")),
                escapeHTML(_("This applet needs the GTop library installed on your system for it to work.")),
                escapeHTML(_("Read this applet help for more details (Applet context menu > Help item)."))
            ];

            const tt = _(this.$.metadata.name) + "\n\n" + msg.join("\n");

            this.set_applet_tooltip(tt);

            Notification.notify(msg, NotificationUrgency.CRITICAL);
        }.bind(this));
    }

    createGraph(aProvider) {
        aProvider.setRefreshRate(this.$._.refresh_rate);

        const graph = new Graph(aProvider);

        graph.setColors(this.getGraphColors(graph));

        if ("setTextDecimals" in aProvider) {
            aProvider.setTextDecimals(this.getGraphTooltipDecimals(aProvider.id));
        }

        return graph;
    }

    _startRefreshLoop() {
        this.$.schedule_manager.clearSchedule("refresh");
        this.update();
        this.$.schedule_manager.setInterval(
            "refresh",
            this.update.bind(this),
            Math.max(100, this.$._.refresh_rate)
        );
    }

    update() {
        let tooltip = "";

        for (const graph of this.graphs) { // jshint ignore:line
            if (graph) {
                graph.refresh();

                const text = graph.provider.text;

                if (this._applet_tooltip) {
                    this._applet_tooltip.set_text_by_id?.(
                        graph.provider.id,
                        text[1]
                    );
                } else {
                    tooltip += `${text[0]} ${text[1]}\n`;
                }
            }
        }

        if (!this._applet_tooltip) {
            this.set_applet_tooltip(tooltip);
        }

        this.repaint();
    }

    paint() {
        if (this.resolution_needs_update) {
            // Drawing area size can be reliably retrieved only in repaint callback
            const [area_width, area_height] = this.area.get_size();

            for (const graph of this.graphs) { // jshint ignore:line
                graph && this.updateGraphResolution(graph, area_width, area_height);
            }

            this.resolution_needs_update = false;
        }

        const cr = this.area.get_context();
        let graph_offset = 0;

        for (const graph of this.graphs) { // jshint ignore:line
            if (graph) {
                if (this.vertical) {
                    cr.translate(0, graph_offset);
                } else {
                    cr.translate(graph_offset, 0);
                }

                graph.paint(cr, this.$._.graph_spacing === -1 && graph.provider.position > 0);

                graph_offset = graph.provider.width_height + this.$._.graph_spacing;
            }
        }

        cr.$dispose();
    }

    repaint() {
        this.area.queue_repaint();
    }

    getGraphColors(aGraph) {
        const c = [];

        for (const colorIdx of [...Array(aGraph.provider.dim).keys()]) {
            const prop = `${aGraph.provider.id}_color_${colorIdx}`;

            if (this.$._?.[prop]) {
                c.push(colorToArray(this.$._[prop]));
            } else {
                break;
            }
        }

        return c;
    }

    getGraphTooltipDecimals(aGraphId) {
        const prop = `${aGraphId}_tooltip_decimals`;

        if (this.$._?.[prop]) {
            return this.$._[prop];
        }

        return null;
    }

    resizeArea() {
        let total_graph_width = 0;
        let enabled_graphs = 0;

        for (const graph of this.graphs) {
            if (graph) {
                total_graph_width += graph.provider.width_height;
                enabled_graphs++;
            }
        }

        if (enabled_graphs > 1) {
            total_graph_width += this.$._.graph_spacing * (enabled_graphs - 1);
        }

        if (this.vertical) {
            this.area.set_size(-1, total_graph_width);
        } else {
            this.area.set_size(total_graph_width, -1);
        }

        this.resolution_needs_update = true;
    }

    updateGraphResolution(aGraph, aAreaWidth, aAreaHeight) {
        if (this.vertical) {
            aGraph.setResolution(
                aAreaWidth,
                aGraph.provider.width_height
            );
        } else {
            aGraph.setResolution(
                aGraph.provider.width_height,
                aAreaHeight
            );
        }
    }

    on_applet_clicked() {
        if (this.$._.onclick_command) {
            GLib.spawn_command_line_async(this.$._.onclick_command);
        }
    }

    on_applet_removed_from_panel() {
        super.on_applet_removed_from_panel();
    }

    on_orientation_changed(aOrientation) {
        super.on_orientation_changed(aOrientation);
        this.vertical = aOrientation === St.Side.LEFT || aOrientation === St.Side.RIGHT;
        this._changeGraphSize();
    }

    _updateGraphs() {
        this.graphs.clear();

        this.graphs = new Set(this.$._.graph_definitions.filter((aEl) => {
            return aEl.enabled;
        }).map((aDef, aIndex) => {
            let graph;
            aDef.position = aIndex;
            aDef.bg_color = aDef.bg_color ? colorToArray(aDef.bg_color) : "";
            aDef.border_color = aDef.border_color ? colorToArray(aDef.border_color) : "";

            if (aDef.id === "load") {
                const ncpu = GTop.glibtop_get_sysinfo().ncpu;
                graph = this.createGraph(new LoadData(aDef));
                graph.setAutoScale(2 * ncpu);
            } else {
                graph = this.createGraph(new $[`${ProvidersData[aDef.id]["cls"]}Data`](aDef));
            }

            return graph;
        }));
    }

    _createCustomTooltip() {
        this._applet_tooltip?.destroy?.();

        tryFn(() => {
            this._applet_tooltip = new CustomPanelItemTooltip(this, this.$.orientation, {
                label: _(this.$.metadata.name),
                grid_sort_data: false,
                grid_data: new Map([...this.graphs].map((aGraph) => { // jshint ignore:line
                    return [aGraph.provider.id, ProvidersData[aGraph.provider.id]["title"]];
                }))
            });
        }, (aErr) => {
            this._applet_tooltip = null;
            global.logError(aErr);
        });
    }

    _changeGraphEnabled() {
        this._updateGraphs();
        this._createCustomTooltip();
        this.resizeArea();
    }

    _changePadding() {
        if (this.$._.use_padding) {
            const style = `padding: ${this.$._.padding_tb}px ${this.$._.padding_lr}px;`;
            this.actor.set_style(style);
        } else {
            this.actor.set_style("");
        }

        this.resolution_needs_update = true;
        this.repaint();
    }

    _changeGraphSize() {
        this.resizeArea();
        this.repaint();
    }

    _updateKeybindings() {
        this.$.keybinding_manager.addKeybinding("run_command", this.$._.run_command_keybinding, () => {
            if (this.$._.onkeybinding_command) {
                GLib.spawn_command_line_async(this.$._.onkeybinding_command);
            } else {
                const msg = [
                    escapeHTML(_("Command not set!")),
                    escapeHTML(_("Set a custom command from this applet settings window."))
                ];

                Notification.notify(msg, NotificationUrgency.CRITICAL);
            }
        });
    }

    __onSettingsChanged(aPrefOldValue, aPrefKey) {
        switch (aPrefKey) {
            case "cpu_color_0":
            case "cpu_color_1":
            case "cpu_color_2":
            case "cpu_color_3":
            case "mem_color_0":
            case "mem_color_1":
            case "swap_color_0":
            case "net_color_0":
            case "net_color_1":
            case "load_color_0":
                for (const graph of this.graphs) { // jshint ignore:line
                    graph && graph.setColors(this.getGraphColors(graph));
                }

                this.repaint();
                break;
            case "cpu_tooltip_decimals":
                for (const graph of this.graphs) { // jshint ignore:line
                    if (graph) {
                        graph.provider?.setTextDecimals?.(
                            this.getGraphTooltipDecimals(graph.provider.id)
                        );
                    }
                }
                break;
            case "graph_definitions_apply":
                this._changeGraphEnabled();
                break;
            case "graph_spacing":
                this._changeGraphSize();
                break;
            case "use_padding":
            case "padding_lr":
            case "padding_tb":
                this._changePadding();
                break;
            case "refresh_rate":
                this.$.schedule_manager.clearSchedule("refresh");

                for (const graph of this.graphs) { // jshint ignore:line
                    graph && graph.provider.setRefreshRate(this.$._.refresh_rate);
                }

                this._startRefreshLoop();
                break;
            case "run_command_keybinding":
                this._updateKeybindings();
                break;
        }
    }
}

function main() {
    Debugger.wrapObjectMethods({
        CustomPanelItemTooltip: CustomPanelItemTooltip,
        SystemMonitor: SystemMonitor
    });

    return new SystemMonitor(...arguments);
}
