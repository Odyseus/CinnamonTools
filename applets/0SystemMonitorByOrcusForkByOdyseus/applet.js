let GlobalUtils,
    DebugManager,
    DesktopNotificationsUtils,
    $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
    DebugManager = require("./debugManager.js");
    DesktopNotificationsUtils = require("./desktopNotificationsUtils.js");
    $ = require("./utils.js");
} else {
    GlobalUtils = imports.ui.appletManager.applets["{{UUID}}"].globalUtils;
    DebugManager = imports.ui.appletManager.applets["{{UUID}}"].debugManager;
    DesktopNotificationsUtils = imports.ui.appletManager.applets["{{UUID}}"].desktopNotificationsUtils;
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
}

const {
    gi: {
        GLib,
        St
    },
    mainloop: Mainloop,
    misc: {
        signalManager: SignalManager,
        util: Util
    },
    ui: {
        applet: Applet,
        main: Main,
        popupMenu: PopupMenu,
        settings: Settings
    }
} = imports;

const {
    _,
    escapeHTML,
    versionCompare,
    CINNAMON_VERSION
} = GlobalUtils;

const {
    NotificationUrgency
} = DesktopNotificationsUtils;

function SystemMonitor() {
    this._init.apply(this, arguments);
}

SystemMonitor.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(aMetadata, aOrientation, aPanelHeight, aInstanceId) {
        Applet.TextIconApplet.prototype._init.call(this, aOrientation, aPanelHeight, aInstanceId);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.update_timeout_id = 0;
        this.orientation = aOrientation;
        this.metadata = aMetadata;
        this.instance_id = aInstanceId;
        this.command_keybinding_name = this.metadata.uuid + "-" + this.instance_id;
        this.holdInitialization = false;

        this._initializeSettings(() => {
            this._expandAppletContextMenu();

            /* NOTE: Inform about missing dependency AFTER the applet context menu is expanded.
             * Otherwise, the Help menu item in the context menu will not exist.
             */
            if (!$.GTop) {
                this._informDependency();
                this.holdInitialization = true;
            }
        }, () => {
            if (this.holdInitialization) {
                return;
            }

            this.sigMan = new SignalManager.SignalManager(null);
            this.vertical = this.orientation === St.Side.LEFT || this.orientation === St.Side.RIGHT;

            this.bg_color = $.colorToArray(this.pref_bg_color);
            this.border_color = $.colorToArray(this.pref_border_color);
            this.graphs = null;
            this.resolution_needs_update = true;
            this.tooltip = null;
            this._graph_ids = null;

            this.area = new St.DrawingArea();
            this.actor.add_child(this.area);

            this.sigMan.connect(this.area, "repaint", function() {
                this.paint();
            }.bind(this));

            this.sigMan.connect(this, "orientation-changed", function() {
                this._seekAndDetroyConfigureContext();
            }.bind(this));

            this._changeGraphEnabled();
            this._changePadding();
            this._updateKeybindings();
            this.update();
        });
    },

    _initializeSettings: function(aDirectCallback, aIdleCallback) {
        this.settings = new Settings.AppletSettings(
            this,
            this.metadata.uuid,
            this.instance_id
        );

        let callback = () => {
            try {
                this._bindSettings();
                aDirectCallback();
            } catch (aErr) {
                global.logError(aErr);
            }

            Mainloop.idle_add(() => {
                try {
                    aIdleCallback();
                } catch (aErr) {
                    global.logError(aErr);
                }

                return GLib.SOURCE_REMOVE;
            });
        };

        // Needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 4.2.x+
        // Always use promise. Declare content of callback variable
        // directly inside the promise callback.
        switch (this.settings.hasOwnProperty("promise")) {
            case true:
                this.settings.promise.then(() => callback());
                break;
            case false:
                callback();
                break;
        }
    },

    _bindSettings: function() {
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
            "pref_graph_spacing",
            "pref_cpu_override_graph_width",
            "pref_cpu_graph_width",
            "pref_cpu_tooltip_decimals",
            "pref_cpu_color_0",
            "pref_cpu_color_1",
            "pref_cpu_color_2",
            "pref_cpu_color_3",
            "pref_mem_override_graph_width",
            "pref_mem_graph_width",
            "pref_mem_color_0",
            "pref_mem_color_1",
            "pref_swap_override_graph_width",
            "pref_swap_graph_width",
            "pref_swap_color_0",
            "pref_net_override_graph_width",
            "pref_net_graph_width",
            "pref_net_color_0",
            "pref_net_color_1",
            "pref_load_override_graph_width",
            "pref_load_graph_width",
            "pref_load_color_0",
            "pref_logging_level",
            "pref_debugger_enabled",
            "pref_graph_ids"
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

        this._seekAndDetroyConfigureContext();
    },

    _seekAndDetroyConfigureContext: function() {
        let menuItem = new PopupMenu.PopupIconMenuItem(_("Configure..."),
            "system-run", St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => {
            this.openXletSettings();
        });

        Mainloop.timeout_add_seconds(5, () => {
            try {
                let children = this._applet_context_menu._getMenuItems();
                let i = children.length;
                while (i--) {
                    if (this.hasOwnProperty("context_menu_item_configure") &&
                        children[i] === this.context_menu_item_configure) {
                        children[i].destroy();
                        this.context_menu_item_configure = menuItem;
                        this._applet_context_menu.addMenuItem(
                            this.context_menu_item_configure,
                            i
                        );
                        break;
                    }
                }
            } catch (aErr) {
                global.logError(aErr);
            }

            return GLib.SOURCE_REMOVE;
        });
    },

    _informDependency: function() {
        Mainloop.idle_add(() => {
            this._applet_icon_box.show();
            this.set_applet_icon_symbolic_name("dialog-error");
            let msg = [
                escapeHTML(_("Missing dependency!!!")),
                escapeHTML(_("This applet needs the GTop library installed on your system for it to work.")),
                escapeHTML(_("Read this applet help for more details (Applet context menu > Help item)."))
            ];

            let tt = _(this.metadata.name) + "\n\n" + msg.join("\n");

            this.set_applet_tooltip(tt);

            $.Notification.notify(msg, NotificationUrgency.CRITICAL);

            return GLib.SOURCE_REMOVE;
        });
    },

    addGraph: function(aProvider, aGraphIdx) {
        let graph = new $.Graph(aProvider);
        this.graphs[aGraphIdx] = graph;

        aProvider.setRefreshRate(this.pref_refresh_rate);
        graph.setSmooth(this.pref_smooth);
        graph.setDrawBorder(this.pref_draw_border);
        graph.setDrawBackground(this.pref_draw_background);
        graph.setColors(this.getGraphColors(graph));
        graph.setBGColor(this.bg_color);
        graph.setBorderColor(this.border_color);

        if ("setTextDecimals" in aProvider) {
            aProvider.setTextDecimals(this.getGraphTooltipDecimals(aProvider.id));
        }

        return graph;
    },

    update: function() {
        let tooltip = "";
        let i = 0,
            iLen = this.graphs.length;
        for (; i < iLen; ++i) {
            if (this.graphs[i]) {
                this.graphs[i].refresh();

                let text = this.graphs[i].provider.text;

                if (this.tooltip) {
                    this.tooltip.set_text(
                        this.graphs[i].provider.id,
                        text[1]
                    );
                } else {
                    if (i > 0) {
                        tooltip += "\n";
                    }

                    tooltip += text[0] + " " + text[1];
                }
            }
        }

        if (!this.tooltip) {
            this.set_applet_tooltip(tooltip);
        }

        this.repaint();

        this.update_timeout_id = Mainloop.timeout_add(
            Math.max(100, this.pref_refresh_rate),
            () => this.update()
        );
    },

    paint: function() {
        if (this.resolution_needs_update) {
            // Drawing area size can be reliably retrieved only in repaint callback
            let [area_width, area_height] = this.area.get_size();
            let i = 0,
                iLen = this.graphs.length;
            for (; i < iLen; i++) {
                if (this.graphs[i]) {
                    this.updateGraphResolution(i, area_width, area_height);
                }
            }
            this.resolution_needs_update = false;
        }

        let cr = this.area.get_context();
        let graph_offset = 0;
        let i = 0,
            iLen = this.graphs.length;
        for (; i < iLen; i++) {
            if (this.graphs[i]) {
                if (this.vertical) {
                    cr.translate(0, graph_offset);
                } else {
                    cr.translate(graph_offset, 0);
                }

                this.graphs[i].paint(cr, this.pref_graph_spacing === -1 && i > 0);

                graph_offset = this.getGraphWidth(this.graphs[i].provider.id) + this.pref_graph_spacing;
            }
        }

        cr.$dispose();
    },

    repaint: function() {
        this.area.queue_repaint();
    },

    getGraphWidth: function(aGraphId) {
        return this["pref_" + aGraphId + "_override_graph_width"] ?
            this["pref_" + aGraphId + "_graph_width"] :
            this.pref_graph_width;
    },

    getGraphColors: function(aGraph) {
        let c = [];

        for (let j = 0; j < aGraph.dim; j++) {
            let prop = "pref_" + aGraph.provider.id + "_color_" + j;

            if (this.hasOwnProperty(prop)) {
                c.push($.colorToArray(this[prop]));
            } else {
                break;
            }
        }

        return c;
    },

    getGraphTooltipDecimals: function(aGraphId) {
        let prop = "pref_" + aGraphId + "_tooltip_decimals";

        if (this.hasOwnProperty(prop)) {
            return this[prop];
        }

        return null;
    },

    resizeArea: function() {
        let total_graph_width = 0;
        let enabled_graphs = 0;
        let i = 0,
            iLen = this.graphs.length;
        for (; i < iLen; i++) {
            if (this.graphs[i]) {
                total_graph_width += this.getGraphWidth(this.graphs[i].provider.id);
                enabled_graphs++;
            }
        }
        if (enabled_graphs > 1) {
            total_graph_width += this.pref_graph_spacing * (enabled_graphs - 1);
        }

        if (this.vertical) {
            this.area.set_size(-1, total_graph_width);
        } else {
            this.area.set_size(total_graph_width, -1);
        }

        this.resolution_needs_update = true;
    },

    updateGraphResolution: function(aGraphIdx, aAreaWidth, aAreaHeight) {
        if (this.vertical) {
            this.graphs[aGraphIdx].setResolution(
                aAreaWidth,
                this.getGraphWidth(this.graphs[aGraphIdx].provider.id)
            );
        } else {
            this.graphs[aGraphIdx].setResolution(
                this.getGraphWidth(this.graphs[aGraphIdx].provider.id),
                aAreaHeight
            );
        }
    },

    on_applet_clicked: function() {
        if (this.pref_onclick_command) {
            GLib.spawn_command_line_async(this.pref_onclick_command);
        }
    },

    on_applet_removed_from_panel: function() {
        if (this.update_timeout_id > 0) {
            Mainloop.source_remove(this.update_timeout_id);
            this.update_timeout_id = 0;
        }

        this.sigMan.disconnectAllSignals();
        this.settings && this.settings.finalize();
    },

    on_orientation_changed: function(aOrientation) {
        this.vertical = aOrientation === St.Side.LEFT || aOrientation === St.Side.RIGHT;
        this._changeGraphSize();
    },

    _updateGraphIds: function() {
        this._graph_ids = this.pref_graph_ids.filter((aEl) => {
            return aEl.enabled;
        }).map((aEl) => {
            return aEl.graph_id;
        });
    },

    _createCustomTooltip: function() {
        this.tooltip && this.tooltip.destroy();

        try {
            this.tooltip = new $.CustomPanelItemTooltip(this, this.orientation);
        } catch (aErr) {
            this.tooltip = null;
            global.logError(aErr);
        }
    },

    _changeGraphEnabled: function() {
        this._updateGraphIds();
        this._createCustomTooltip();

        this.graphs = null;
        this.graphs = new Array(this.graph_ids.length);

        let enable = (aGraphId, aIndex) => {
            if (aGraphId === "load") {
                let ncpu = $.GTop.glibtop_get_sysinfo().ncpu;
                this.addGraph(new $.LoadData(), aIndex).setAutoScale(2 * ncpu);
            } else {
                let upper = aGraphId.charAt(0).toUpperCase() + aGraphId.slice(1);
                this.addGraph(new $[upper + "Data"](), aIndex);
            }
        };

        let i = 0,
            iLen = this.graph_ids.length;
        for (; i < iLen; i++) {
            enable(this.graph_ids[i], i);
        }

        this.resizeArea();
    },

    _changePadding: function() {
        if (this.pref_use_padding) {
            let style = "padding:" + this.pref_padding_tb + "px " + this.pref_padding_lr + "px;";
            this.actor.set_style(style);
        } else {
            this.actor.set_style("");
        }

        this.resolution_needs_update = true;
        this.repaint();
    },

    _changeGraphSize: function() {
        this.resizeArea();
        this.repaint();
    },

    _updateKeybindings: function() {
        Main.keybindingManager.removeHotKey(this.command_keybinding_name);

        if (this.pref_overlay_key) {
            Main.keybindingManager.addHotKey(
                this.command_keybinding_name,
                this.pref_overlay_key,
                () => {
                    if (this.pref_onkeybinding_command) {
                        GLib.spawn_command_line_async(this.pref_onkeybinding_command);
                    } else {
                        let msg = [
                            escapeHTML(_("Command not set!")),
                            escapeHTML(_("Set a custom command from this applet settings window."))
                        ];

                        $.Notification.notify(msg, NotificationUrgency.CRITICAL);
                    }
                }
            );
        }
    },

    openXletSettings: function() {
        Util.spawn_async([
            this.metadata.path + "/settings.py",
            "--xlet-type=applet",
            "--xlet-instance-id=" + this.instance_id,
            "--xlet-uuid=" + this.metadata.uuid
        ], null);
    },

    get graph_ids() {
        return this._graph_ids;
    },

    _onSettingsChanged: function(aPrefValue, aPrefKey) {
        let i = 0,
            iLen = this.graphs.length;
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
                for (; i < iLen; i++) {
                    this.graphs[i] && this.graphs[i].setColors(this.getGraphColors(this.graphs[i]));
                }

                this.repaint();
                break;
            case "pref_cpu_tooltip_decimals":
                for (; i < iLen; i++) {
                    if (this.graphs[i] && "setTextDecimals" in this.graphs[i].provider) {
                        this.graphs[i].provider.setTextDecimals(
                            this.getGraphTooltipDecimals(this.graphs[i].provider.id)
                        );
                    }
                }
                break;
            case "pref_graph_ids":
                this._changeGraphEnabled();
                break;
            case "pref_graph_width":
            case "pref_graph_spacing":
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
                this._changeGraphSize();
                break;
            case "pref_bg_color":
            case "pref_border_color":
                this.bg_color = $.colorToArray(this.pref_bg_color);
                this.border_color = $.colorToArray(this.pref_border_color);

                for (; i < iLen; i++) {
                    if (this.graphs[i]) {
                        this.graphs[i].setBGColor(this.bg_color);
                        this.graphs[i].setBorderColor(this.border_color);
                    }
                }

                this.repaint();
                break;
            case "pref_use_padding":
            case "pref_padding_lr":
            case "pref_padding_tb":
                this._changePadding();
                break;
            case "pref_draw_border":
                for (; i < iLen; i++) {
                    this.graphs[i] && this.graphs[i].setDrawBorder(this.pref_draw_border);
                }

                this.repaint();
                break;
            case "pref_draw_background":
                for (; i < iLen; i++) {
                    this.graphs[i] && this.graphs[i].setDrawBackground(this.pref_draw_background);
                }
                break;
            case "pref_refresh_rate":
                if (this.update_timeout_id > 0) {
                    Mainloop.source_remove(this.update_timeout_id);
                    this.update_timeout_id = 0;
                }

                for (; i < iLen; i++) {
                    this.graphs[i] && this.graphs[i].provider.setRefreshRate(this.pref_refresh_rate);
                }

                this.update();
                break;
            case "pref_smooth":
                for (; i < iLen; i++) {
                    this.graphs[i] && this.graphs[i].setSmooth(this.pref_smooth);
                }

                this.repaint();
                break;
            case "pref_overlay_key":
                this._updateKeybindings();
                break;
            case "pref_logging_level":
            case "pref_debugger_enabled":
                $.Debugger.logging_level = this.pref_logging_level;
                $.Debugger.debugger_enabled = this.pref_debugger_enabled;
                break;
        }
    }
};

function main(aMetadata, aOrientation, aPanelHeight, aInstanceId) {
    DebugManager.wrapObjectMethods($.Debugger, {
        SystemMonitor: SystemMonitor
    });

    return new SystemMonitor(aMetadata, aOrientation, aPanelHeight, aInstanceId);
}
