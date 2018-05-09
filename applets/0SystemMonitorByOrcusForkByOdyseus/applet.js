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
const Lang = imports.lang;
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

                this._onPrefChangedPadding();
                this._onPrefChangedGraphEnabled();
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
        let settingsArray = [
            [bD.IN, "pref_overlay_key", this._updateKeybindings],
            [bD.IN, "pref_onkeybinding_command", null],
            [bD.IN, "pref_onclick_command", null],
            [bD.IN, "pref_smooth", this._onPrefChangedSmooth],
            [bD.IN, "pref_refresh_rate", this._onPrefChangedRefreshRate],
            [bD.IN, "pref_draw_background", this._onPrefChangedDrawBackground],
            [bD.IN, "pref_draw_border", this._onPrefChangedDrawBorder],
            [bD.IN, "pref_use_padding", this._onPrefChangedPadding],
            [bD.IN, "pref_padding_lr", this._onPrefChangedPadding],
            [bD.IN, "pref_padding_tb", this._onPrefChangedPadding],
            [bD.IN, "pref_bg_color", this._onPrefChangedBGBorderColor],
            [bD.IN, "pref_border_color", this._onPrefChangedBGBorderColor],
            [bD.IN, "pref_graph_width", this._onPrefChangedGraphWidth],
            [bD.IN, "pref_cpu_enabled", this._onPrefChangedGraphEnabled, 0],
            [bD.IN, "pref_cpu_override_graph_width", this._onPrefChangedGraphWidth, 0],
            [bD.IN, "pref_cpu_graph_width", this._onPrefChangedGraphWidth, 0],
            [bD.IN, "pref_cpu_color_0", this._onPrefChangedColor, 0],
            [bD.IN, "pref_cpu_color_1", this._onPrefChangedColor, 0],
            [bD.IN, "pref_cpu_color_2", this._onPrefChangedColor, 0],
            [bD.IN, "pref_cpu_color_3", this._onPrefChangedColor, 0],
            [bD.IN, "pref_mem_enabled", this._onPrefChangedGraphEnabled, 1],
            [bD.IN, "pref_mem_override_graph_width", this._onPrefChangedGraphWidth, 1],
            [bD.IN, "pref_mem_graph_width", this._onPrefChangedGraphWidth, 1],
            [bD.IN, "pref_mem_color_0", this._onPrefChangedColor, 1],
            [bD.IN, "pref_mem_color_1", this._onPrefChangedColor, 1],
            [bD.IN, "pref_swap_enabled", this._onPrefChangedGraphEnabled, 2],
            [bD.IN, "pref_swap_override_graph_width", this._onPrefChangedGraphWidth, 2],
            [bD.IN, "pref_swap_graph_width", this._onPrefChangedGraphWidth, 2],
            [bD.IN, "pref_swap_color_0", this._onPrefChangedColor, 2],
            [bD.IN, "pref_net_enabled", this._onPrefChangedGraphEnabled, 3],
            [bD.IN, "pref_net_override_graph_width", this._onPrefChangedGraphWidth, 3],
            [bD.IN, "pref_net_graph_width", this._onPrefChangedGraphWidth, 3],
            [bD.IN, "pref_net_color_0", this._onPrefChangedColor, 3],
            [bD.IN, "pref_net_color_1", this._onPrefChangedColor, 3],
            [bD.IN, "pref_load_enabled", this._onPrefChangedGraphEnabled, 4],
            [bD.IN, "pref_load_override_graph_width", this._onPrefChangedGraphWidth, 4],
            [bD.IN, "pref_load_graph_width", this._onPrefChangedGraphWidth, 4],
            [bD.IN, "pref_load_color_0", this._onPrefChangedColor, 4]
        ];
        let newBinding = typeof this.settings.bind === "function";
        for (let [binding, property_name, callback] of settingsArray) {
            // Condition needed for retro-compatibility.
            // Mark for deletion on EOL. Cinnamon 3.2.x+
            if (newBinding) {
                this.settings.bind(property_name, property_name, callback);
            } else {
                this.settings.bindProperty(binding, property_name, property_name, callback, null);
            }
        }
    },

    _expandAppletContextMenu: function() {
        let menuItem = new PopupMenu.PopupIconMenuItem(
            _("Help"),
            "dialog-information",
            St.IconType.SYMBOLIC);
        menuItem.connect("activate", Lang.bind(this, function() {
            Util.spawn_async(["xdg-open", this.metadata.path + "/HELP.html"], null);
        }));
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
            Lang.bind(this, this.update));
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
        this._onPrefChangedGraphWidth();
    },

    // Configuration change callbacks
    _onPrefChangedGraphEnabled: function(enabled, graph_idx) {
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

        if (graph_idx) {
            enable(graph_idx);
        } else {
            for (let i = 0; i < this.graphs.length; i++) {
                enable(i);
            }
        }
    },

    _onPrefChangedSmooth: function() {
        for (let g of this.graphs) {
            if (g) {
                g.smooth = this.pref_smooth;
                g.repaint();
            }
        }
    },

    _onPrefChangedRefreshRate: function() {
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
    },

    _onPrefChangedDrawBackground: function() {
        for (let g of this.graphs) {
            if (g) {
                g.setDrawBackground(this.pref_draw_background);
            }
        }
    },

    _onPrefChangedDrawBorder: function() {
        for (let g of this.graphs) {
            if (g) {
                g.setDrawBorder(this.pref_draw_border);
                g.repaint();
            }
        }
    },

    _onPrefChangedPadding: function() {
        if (this.pref_use_padding) {
            let style = "padding:" + this.pref_padding_tb + "px " + this.pref_padding_lr + "px;";
            this.actor.set_style(style);
        } else {
            this.actor.set_style("");
        }

        for (let g of this.graphs) {
            if (g) {
                g.updateSize();
            }
        }
    },

    _onPrefChangedBGBorderColor: function() {
        this.bg_color = $.colorToArray(this.pref_bg_color);
        this.border_color = $.colorToArray(this.pref_border_color);
        for (let g of this.graphs) {
            if (g) {
                g.bg_color = this.bg_color;
                g.border_color = this.border_color;
                g.repaint();
            }
        }
    },

    _onPrefChangedGraphWidth: function(width, graph_idx) {
        if (graph_idx) {
            if (this.graphs[graph_idx]) {
                this.graphs[graph_idx].setWidth(this.getGraphWidth(graph_idx), this.vertical);
            }
        } else {
            for (let i = 0; i < this.graphs.length; i++) {
                if (this.graphs[i]) {
                    this.graphs[i].setWidth(this.getGraphWidth(i), this.vertical);
                }
            }
        }
    },

    _onPrefChangedColor: function(width, graph_idx) {
        if (graph_idx) {
            if (this.graphs[graph_idx]) {
                this.graphs[graph_idx].setColors(this.getGraphColors(graph_idx));
            }
        } else {
            for (let i = 0; i < this.graphs.length; i++) {
                if (this.graphs[i]) {
                    this.graphs[i].setColors(this.getGraphColors(i));
                }
            }
        }
    },

    _updateKeybindings: function() {
        Main.keybindingManager.removeHotKey(this.command_keybinding_name);

        if (this.pref_overlay_key !== "") {
            Main.keybindingManager.addHotKey(
                this.command_keybinding_name,
                this.pref_overlay_key,
                Lang.bind(this, function() {
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
                })
            );
        }
    }
};

function main(aMetadata, aOrientation, aPanel_height, aInstance_id) {
    return new SystemMonitorByOrcusForkByOdyseusApplet(aMetadata, aOrientation, aPanel_height, aInstance_id);
}
