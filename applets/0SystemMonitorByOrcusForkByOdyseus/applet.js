let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
}

const _ = $._;

const Applet = imports.ui.applet;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const Settings = imports.ui.settings;
const St = imports.gi.St;
const Util = imports.misc.util;

function SystemMonitorByOrcusForkByOdyseusApplet() {
    this._init.apply(this, arguments);
}

SystemMonitorByOrcusForkByOdyseusApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(aMetadata, aOrientation, aPanel_height, aInstance_id) {
        Applet.IconApplet.prototype._init.call(this, aOrientation, aPanel_height, aInstance_id);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.HORIZONTAL);
        }

        this.update_id = 0;
        this.orientation = aOrientation;
        this.metadata = aMetadata;
        this.instance_id = aInstance_id;
        this.command_keybinding_name = this.metadata.uuid + "-" + this.instance_id;

        try {
            this.tooltip = new $.CustomTooltip(this, "", this.orientation);
        } catch (aErr) {
            global.logError("Error while initializing tooltip: " + aErr.message);
        }

        if (!$.GTop) {
            this._informDependency();
            this._applet_icon_box.show();
            return;
        }

        try {
            this._bindSettings();
            this._expandAppletContextMenu();
        } catch (aErr) {
            global.logError(aErr);
        }

        Mainloop.idle_add(() => {
            try {
                this._applet_icon_box.hide();

                this.vertical = this.orientation == St.Side.LEFT || this.orientation == St.Side.RIGHT;
                this.graph_ids = ["cpu", "mem", "swap", "net", "load"];
                this.bg_color = $.colorToArray(this.pref_bg_color);
                this.border_color = $.colorToArray(this.pref_border_color);
                this.areas = new Array(this.graph_ids.length);
                this.graphs = new Array(this.graph_ids.length);
                this.graph_indices = new Array(this.graph_ids.length);

                for (let i = 0; i < this.graph_ids.length; i++) {
                    this.areas[i] = null;
                    this.graphs[i] = null;
                    this.graph_indices[i] = null;
                }

                this.graph_order = [0, 1, 2, 3, 4];

                this._changePadding();
                this._changeGraphEnabled();
                this._updateKeybindings();
                this.update();
            } catch (aErr) {
                global.logError(aErr);
            }
        });
    },

    _bindSettings: function() {
        this.settings = new Settings.AppletSettings(this, this.metadata.uuid, this.instance_id);
        // Needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        let bD = {
            IN: 1,
            OUT: 2,
            BIDIRECTIONAL: 3
        };
        let prefKeysArray = [
            "pref_overlay_key",
            "pref_onkeybinding_command",
            "pref_onclick_command",
            "pref_smooth",
            "pref_refresh_rate",
            "pref_draw_background",
            "pref_draw_border",
            "pref_use_padding",
            "pref_padding_lr",
            "pref_padding_tb",
            "pref_bg_color",
            "pref_border_color",
            "pref_graph_width",
            "pref_cpu_enabled",
            "pref_cpu_override_graph_width",
            "pref_cpu_graph_width",
            "pref_cpu_tooltip_decimals",
            "pref_cpu_color_0",
            "pref_cpu_color_1",
            "pref_cpu_color_2",
            "pref_cpu_color_3",
            "pref_mem_enabled",
            "pref_mem_override_graph_width",
            "pref_mem_graph_width",
            "pref_mem_color_0",
            "pref_mem_color_1",
            "pref_swap_enabled",
            "pref_swap_override_graph_width",
            "pref_swap_graph_width",
            "pref_swap_color_0",
            "pref_net_enabled",
            "pref_net_override_graph_width",
            "pref_net_graph_width",
            "pref_net_color_0",
            "pref_net_color_1",
            "pref_load_enabled",
            "pref_load_override_graph_width",
            "pref_load_graph_width",
            "pref_load_color_0"
        ];
        let newBinding = typeof this.settings.bind === "function";
        for (let pref_key of prefKeysArray) {
            // Condition needed for retro-compatibility.
            // Mark for deletion on EOL. Cinnamon 3.2.x+
            // Abandon this.settings.bindProperty and keep this.settings.bind.
            if (newBinding) {
                this.settings.bind(pref_key, pref_key, this._onSettingsChanged, pref_key);
            } else {
                this.settings.bindProperty(bD.BIDIRECTIONAL, pref_key, pref_key, this._onSettingsChanged, pref_key);
            }
        }
    },

    _expandAppletContextMenu: function() {
        let menuItem = new PopupMenu.PopupIconMenuItem(
            _("Help"),
            "dialog-information",
            St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => {
            Util.spawn_async(["xdg-open", this.metadata.path + "/HELP.html"], null);
        });
        this._applet_context_menu.addMenuItem(menuItem);
    },

    _informDependency: function() {
        this.set_applet_icon_symbolic_name("dialog-error");
        let msg = [_("Missing dependency!!!"),
            _("This applet needs the GTop library installed on your system for it  to work."),
            _("Read this applet help for more details (Applet context menu > Help item).")
        ];

        let tt = _(this.metadata.name) + "\n\n" + msg.join("\n");

        if (this.tooltip) {
            try {
                this.tooltip.set_text('<span color="red"><b>' + $.escapeHTML(tt) + "</b></span>");
            } catch (aErr) {
                global.logError(aErr);
                global.logError(_(this.metadata.name) + ": " + aErr.message);
            }
        } else {
            this.set_applet_tooltip(tt);
        }

        let icon = new St.Icon({
            icon_name: "dialog-error",
            icon_type: St.IconType.SYMBOLIC,
            icon_size: 24
        });

        Main.criticalNotify(_(this.metadata.name), msg.join("\n"), icon);
    },

    addGraph: function(provider, graph_idx) {
        let area = new St.DrawingArea();
        this.actor.insert_child_at_index(area, this.graph_indices[graph_idx]);
        let graph = new $.Graph(area, provider);
        this.areas[graph_idx] = area;
        this.graphs[graph_idx] = graph;

        provider.refresh_rate = this.pref_refresh_rate;
        graph.smooth = this.pref_smooth;
        graph.setWidth(this.getGraphWidth(graph_idx), this.vertical);
        graph.setColors(this.getGraphColors(graph_idx));
        graph.setDrawBackground(this.pref_draw_background);
        graph.setDrawBorder(this.pref_draw_border);
        graph.bg_color = this.bg_color;
        graph.border_color = this.border_color;
        let tooltip_decimals = this.getGraphTooltipDecimals(graph_idx);

        if (tooltip_decimals) {
            provider.setTextDecimals(tooltip_decimals);
        }

        return graph;
    },

    update: function() {
        let tooltip = "";

        for (let i = 0; i < this.graphs.length; ++i) {
            if (this.graphs[i]) {
                this.graphs[i].refresh();
                if (i > 0) {
                    tooltip = tooltip + "\n";
                }
                let text = this.graphs[i].provider.getText();
                if (this.tooltip) {
                    tooltip = tooltip + "<b>" + $.escapeHTML(text[0]) + ":</b> " +
                        $.escapeHTML(text[1]);
                } else {
                    tooltip = tooltip + text[0] + " " + text[1];
                }
            }
        }

        if (this.tooltip) {
            this.tooltip.set_text(tooltip);
        } else {
            this.set_applet_tooltip(tooltip);
        }

        this.update_timeout_id = Mainloop.timeout_add(Math.max(100, this.pref_refresh_rate),
            () => this.update());
    },

    recalcGraphIndices: function() {
        let idx = 0;
        for (let i = 0; i < this.graph_ids.length; i++) {
            let graph_id = this.graph_ids[i];
            let enabled = this["pref_" + graph_id + "_enabled"];

            if (!enabled) {
                continue;
            }

            this.graph_indices[i] = idx++;
        }
    },

    getGraphWidth: function(graph_idx) {
        let graph_id = this.graph_ids[graph_idx];
        return this["pref_" + graph_id + "_override_graph_width"] ?
            this["pref_" + graph_id + "_graph_width"] :
            this.pref_graph_width;
    },

    getGraphColors: function(graph_idx) {
        let graph_id = this.graph_ids[graph_idx];
        let c = [];
        for (let j = 0; j < this.graphs[graph_idx].dim; j++) {
            let prop = "pref_" + graph_id + "_color_" + j;
            if (this.hasOwnProperty(prop)) {
                c.push($.colorToArray(this[prop]));
            } else {
                break;
            }
        }
        return c;
    },

    getGraphTooltipDecimals: function(graph_idx) {
        let graph_id = this.graph_ids[graph_idx];
        let prop = "pref_" + graph_id + "_tooltip_decimals";

        if (this.hasOwnProperty(prop)) {
            return this[prop];
        }
    },

    on_applet_clicked: function() {
        if (this.pref_onclick_command) {
            GLib.spawn_command_line_async(this.pref_onclick_command);
        }
    },

    on_applet_removed_from_panel: function() {
        Main.keybindingManager.removeHotKey(this.command_keybinding_name);

        if (this.update_timeout_id > 0) {
            Mainloop.source_remove(this.update_timeout_id);
            this.update_timeout_id = 0;
        }
        if (this.settings) {
            this.settings.finalize();
        }
    },

    on_orientation_changed: function(orientation) {
        this.vertical = orientation == St.Side.LEFT || orientation == St.Side.RIGHT;
        this._changeGraphWidth();
    },

    _changeGraphEnabled: function() {
        this.recalcGraphIndices();
        let enable = (i) => {
            let graph_id = this.graph_ids[i];
            if (this["pref_" + graph_id + "_enabled"]) {
                if (this.graphs[i]) {
                    return;
                }

                if (i == 0) {
                    this.addGraph(new $.CpuData(), i);
                } else if (i == 1) {
                    this.addGraph(new $.MemData(), i);
                } else if (i == 2) {
                    this.addGraph(new $.SwapData(), i);
                } else if (i == 3) {
                    this.addGraph(new $.NetData(), i).setAutoScale(1024);
                } else if (i == 4) {
                    let ncpu = $.GTop.glibtop_get_sysinfo().ncpu;
                    this.addGraph(new $.LoadAvgData(), i).setAutoScale(2 * ncpu);
                }
            } else {
                if (!this.graphs[i]) {
                    return;
                }

                this.actor.remove_child(this.areas[i]);
                this.graphs[i] = null;
                this.areas[i] = null;
            }
        };

        for (let i = 0; i < this.graphs.length; i++) {
            enable(i);
        }
    },

    _changePadding: function() {
        if (this.pref_use_padding) {
            let style = "padding:" + this.pref_padding_tb + "px " + this.pref_padding_lr + "px;";
            this.actor.set_style(style);
        } else {
            this.actor.set_style("");
        }

        for (let g of this.graphs) {
            g && g.updateSize();
        }
    },

    _changeGraphWidth: function() {
        for (let g of this.graphs) {
            g && g.setWidth(this.getGraphWidth(this.graphs.indexOf(g)), this.vertical);
        }
    },

    _updateKeybindings: function() {
        Main.keybindingManager.removeHotKey(this.command_keybinding_name);

        if (this.pref_overlay_key !== "") {
            Main.keybindingManager.addHotKey(
                this.command_keybinding_name,
                this.pref_overlay_key,
                () => {
                    if (this.pref_onkeybinding_command) {
                        GLib.spawn_command_line_async(this.pref_onkeybinding_command);
                    } else {
                        let msg = [_("Command not set!"),
                            _("Set a custom command from this applet settings window.")
                        ];
                        let icon = new St.Icon({
                            icon_name: "dialog-warning",
                            icon_type: St.IconType.SYMBOLIC,
                            icon_size: 24
                        });

                        Main.warningNotify(_(this.metadata.name), msg.join("\n"), icon);
                    }
                }
            );
        }
    },

    _onSettingsChanged: function(aPrefValue, aPrefKey) {
        // Note: On Cinnamon versions greater than 3.2.x, two arguments are passed to the
        // settings callback instead of just one as in older versions. The first one is the
        // setting value and the second one is the user data. To workaround this nonsense,
        // check if the second argument is undefined to decide which
        // argument to use as the pref key depending on the Cinnamon version.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        // Remove the following variable and directly use the second argument.
        let pref_key = aPrefKey || aPrefValue;
        switch (pref_key) {
            case "pref_cpu_color_0":
            case "pref_cpu_color_1":
            case "pref_cpu_color_2":
            case "pref_cpu_color_3":
            case "pref_mem_color_0":
            case "pref_mem_color_1":
            case "pref_swap_color_0":
            case "pref_net_color_0":
            case "pref_net_color_1":
            case "pref_load_color_0":
                for (let g of this.graphs) {
                    g && g.setColors(this.getGraphColors(this.graphs.indexOf(g)));
                }
                break;
            case "pref_cpu_tooltip_decimals":
                for (let g of this.graphs) {
                    if (g && "setTextDecimals" in g.provider) {
                        g.provider.setTextDecimals(this.getGraphTooltipDecimals(this.graphs.indexOf(g)));
                    }
                }
                break;
            case "pref_cpu_enabled":
            case "pref_mem_enabled":
            case "pref_swap_enabled":
            case "pref_net_enabled":
            case "pref_load_enabled":
                this._changeGraphEnabled();
                break;
            case "pref_graph_width":
            case "pref_cpu_override_graph_width":
            case "pref_cpu_graph_width":
            case "pref_mem_override_graph_width":
            case "pref_mem_graph_width":
            case "pref_swap_override_graph_width":
            case "pref_swap_graph_width":
            case "pref_net_override_graph_width":
            case "pref_net_graph_width":
            case "pref_load_override_graph_width":
            case "pref_load_graph_width":
                this._changeGraphWidth();
                break;
            case "pref_bg_color":
            case "pref_border_color":
                this.bg_color = $.colorToArray(this.pref_bg_color);
                this.border_color = $.colorToArray(this.pref_border_color);
                for (let g of this.graphs) {
                    if (g) {
                        g.bg_color = this.bg_color;
                        g.border_color = this.border_color;
                        g.repaint();
                    }
                }
                break;
            case "pref_use_padding":
            case "pref_padding_lr":
            case "pref_padding_tb":
                this._changePadding();
                break;
            case "pref_draw_border":
                for (let g of this.graphs) {
                    if (g) {
                        g.setDrawBorder(this.pref_draw_border);
                        g.repaint();
                    }
                }
                break;
            case "pref_draw_background":
                for (let g of this.graphs) {
                    g && g.setDrawBackground(this.pref_draw_background);
                }
                break;
            case "pref_refresh_rate":
                if (this.update_timeout_id > 0) {
                    Mainloop.source_remove(this.update_timeout_id);
                    this.update_timeout_id = 0;
                }

                for (let g of this.graphs) {
                    if (g) {
                        g.provider.refresh_rate = this.pref_refresh_rate;
                    }
                }

                this.update();
                break;
            case "pref_smooth":
                for (let g of this.graphs) {
                    if (g) {
                        g.smooth = this.pref_smooth;
                        g.repaint();
                    }
                }
                break;
            case "pref_overlay_key":
                this._updateKeybindings();
                break;
        }
    }
};

function main(aMetadata, aOrientation, aPanel_height, aInstance_id) {
    return new SystemMonitorByOrcusForkByOdyseusApplet(aMetadata, aOrientation, aPanel_height, aInstance_id);
}
