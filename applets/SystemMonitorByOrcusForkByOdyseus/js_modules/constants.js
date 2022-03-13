const {
    _
} = require("js_modules/globalUtils.js");

var APPLET_PREFS = [
    "run_command_keybinding",
    "onkeybinding_command",
    "onclick_command",
    "refresh_rate",
    "use_padding",
    "padding_lr",
    "padding_tb",
    "graph_spacing",
    "cpu_tooltip_decimals",
    "cpu_color_0",
    "cpu_color_1",
    "cpu_color_2",
    "cpu_color_3",
    "mem_color_0",
    "mem_color_1",
    "swap_color_0",
    "net_color_0",
    "net_color_1",
    "load_color_0",
    "graph_definitions",
    "graph_definitions_apply"
];

var ProvidersData = {
    cpu: {
        title: _("CPU"),
        dim: 4,
        cls: "Cpu"
    },
    mem: {
        title: _("Memory"),
        dim: 2,
        cls: "Mem"
    },
    swap: {
        title: _("Swap"),
        dim: 1,
        cls: "Swap"
    },
    net: {
        title: _("Network"),
        dim: 2,
        cls: "Net"
    },
    load: {
        title: _("Load average"),
        dim: 1,
        cls: "Load"
    }
};

/* exported ProvidersData,
            APPLET_PREFS
 */
