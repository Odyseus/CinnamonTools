// {{IMPORTER}}

let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta["{{UUID}}"];
}

const Constants = __import("constants.js");
const GlobalUtils = __import("globalUtils.js");
const DebugManager = __import("debugManager.js");
const DesktopNotificationsUtils = __import("desktopNotificationsUtils.js");

const {
    gi: {
        Clutter,
        Gio,
        St
    },
    ui: {
        main: Main,
        tooltips: Tooltips
    }
} = imports;

const {
    ProvidersData
} = Constants;

const {
    _,
    escapeHTML,
    xdgOpen
} = GlobalUtils;

const {
    CustomNotification
} = DesktopNotificationsUtils;

const {
    wrapObjectMethods
} = DebugManager;

var Debugger = new DebugManager.DebugManager();

var GTop;

try {
    GTop = imports.gi.GTop;
} catch (aErr) {
    GTop = null;
}

wrapObjectMethods(Debugger, {
    CpuData: CpuData,
    CustomNotification: CustomNotification,
    CustomPanelItemTooltip: CustomPanelItemTooltip,
    Graph: Graph,
    LoadData: LoadData,
    MemData: MemData,
    NetData: NetData,
    SwapData: SwapData
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

function Graph() {
    this._init.apply(this, arguments);
}

Graph.prototype = {
    _init: function(aProvider) {
        this.provider = aProvider;
        this.colors = [
            [1, 1, 1, 1]
        ];
        this.bg_color = [0, 0, 0, 1];
        this.border_color = [1, 1, 1, 1];
        this.smooth = false;
        this.data = [];
        this.dim = this.provider.dim;
        this.autoScale = false;
        this.scale = 1;
        this.width = 1;
        this.height = 1;
        this.draw_background = true;
        this.draw_border = true;
        this.resize_data = false;
    },

    _setColor: function(aCr, aIndex) {
        let c = this.colors[aIndex % this.colors.length];
        aCr.setSourceRGBA(c[0], c[1], c[2], c[3]);
    },

    _resizeData: function() {
        let datasize = this.width - (this.draw_border ? 2 : 0);
        if (datasize > this.data.length) {
            let d = Array(datasize - this.data.length);
            let i = 0,
                iLen = d.length;
            for (; i < iLen; i++) {
                d[i] = Array(this.dim);
                let j = 0;
                for (; j < this.dim; j++) {
                    d[i][j] = 0;
                }
            }
            this.data = d.concat(this.data);
        } else if (datasize < this.data.length) {
            this.data = this.data.slice(this.data.length - datasize);
        }
    },

    setResolution: function(aWidth, aHeight) {
        this.width = aWidth;
        this.height = aHeight;
        this.resize_data = true;
    },

    setDrawBackground: function(draw_background) {
        this.draw_background = draw_background;
        this.resize_data = true;
    },

    setDrawBorder: function(aDrawBorder) {
        this.draw_border = aDrawBorder;
        this.resize_data = true;
    },

    setSmooth: function(aSmooth) {
        this.smooth = aSmooth;
    },

    setColors: function(aColor) {
        this.colors = aColor;
    },

    setBGColor: function(aColor) {
        this.bg_color = aColor;
    },

    setBorderColor: function(aColor) {
        this.border_color = aColor;
    },

    refresh: function() {
        let d = this.provider.getData();
        this.data.push(d);
        this.data.shift();

        if (this.autoScale) {
            let maxVal = this.minScale;
            for (let i = 0; i < this.data.length; ++i) {
                let sum = this.dataSum(i, this.dim - 1);

                if (sum > maxVal) {
                    maxVal = sum;
                }
            }
            this.scale = 1.0 / maxVal;
        }
    },

    dataSum: function(aIndex, aDepth) {
        let sum = 0;
        for (let j = 0; j <= aDepth; ++j) {
            sum += this.data[aIndex][j];
        }

        return sum;
    },

    paint: function(aCr, aNoLeftBorder) {
        if (this.resize_data) {
            this._resizeData();
            this.resize_data = false;
        }

        let border_width = this.draw_border ? 1 : 0;
        let graph_width = this.width - 2 * border_width;
        let graph_height = this.height - 2 * border_width;
        aCr.setLineWidth(1);

        // background
        if (this.draw_background) {
            aCr.setSourceRGBA(this.bg_color[0], this.bg_color[1], this.bg_color[2], this.bg_color[3]);
            aCr.rectangle(border_width, border_width, graph_width, graph_height);
            aCr.fill();
        }

        // data
        if (this.smooth) {
            for (let j = this.dim - 1; j >= 0; --j) {
                this._setColor(aCr, j);
                aCr.moveTo(border_width, graph_height + border_width);
                for (let i = 0; i < this.data.length; ++i) {
                    let v = Math.round(graph_height * Math.min(1, this.scale * this.dataSum(i, j)));
                    v = graph_height + border_width - v;
                    if (i === 0) {
                        aCr.lineTo(i + border_width, v);
                    }
                    aCr.lineTo(i + border_width + 0.5, v);
                    if (i === this.data.length - 1) {
                        aCr.lineTo(i + border_width + 1, v);
                    }
                }
                aCr.lineTo(graph_width + border_width, graph_height + border_width);
                aCr.lineTo(border_width, graph_height + border_width);
                aCr.fill();
            }
        } else {
            for (let i = 0; i < this.data.length; ++i) {
                for (let j = this.dim - 1; j >= 0; --j) {
                    this._setColor(aCr, j);
                    aCr.moveTo(i + border_width + 0.5, graph_height + border_width);
                    let v = Math.round(graph_height * Math.min(1, this.scale * this.dataSum(i, j)));
                    aCr.relLineTo(0, -v);
                    aCr.stroke();
                }
            }
        }

        // border
        if (this.draw_border) {
            aCr.setSourceRGBA(this.border_color[0], this.border_color[1], this.border_color[2], this.border_color[3]);
            aCr.moveTo(0.5, 0.5);
            aCr.lineTo(this.width - 0.5, 0.5);
            aCr.lineTo(this.width - 0.5, this.height - 0.5);
            aCr.lineTo(0.5, this.height - 0.5);

            if (!aNoLeftBorder) {
                aCr.closePath();
            }

            aCr.stroke();
        }
    },

    setAutoScale: function(aMinScale) {
        if (aMinScale > 0) {
            this.autoScale = true;
            this.minScale = aMinScale;
        } else {
            this.autoScale = false;
        }
    }
};

function Provider() {
    this._init.apply(this, arguments);
}

Provider.prototype = {
    _init: function(aProviderID) {
        this._refresh_rate = 1000;
        this._id = aProviderID;
        this._dim = ProvidersData[aProviderID].dim;
        this._title = ProvidersData[aProviderID].title;

        this._text = "";
    },

    setRefreshRate: function(aRefreshRate) {
        this._refresh_rate = aRefreshRate;
    },

    get id() {
        return this._id;
    },

    get dim() {
        return this._dim;
    },

    get text() {
        return [this._title, this._text];
    }
};

function CpuData() {
    this._init.apply(this, arguments);
}

CpuData.prototype = {
    __proto__: Provider.prototype,

    _init: function() {
        Provider.prototype._init.call(this, "cpu");

        this.gtop = new GTop.glibtop_cpu();
        this.idle_last = 0;
        this.nice_last = 0;
        this.sys_last = 0;
        this.iowait_last = 0;
        this.total_last = 0;
        this.text_decimals = 0;
    },

    getData: function() {
        GTop.glibtop_get_cpu(this.gtop);
        let delta = (this.gtop.total - this.total_last);
        let idle = 0;
        let nice = 0;
        let sys = 0;
        let iowait = 0;

        if (delta > 0) {
            idle = (this.gtop.idle - this.idle_last) / delta;
            nice = (this.gtop.nice - this.nice_last) / delta;
            sys = (this.gtop.sys - this.sys_last) / delta;
            iowait = (this.gtop.iowait - this.iowait_last) / delta;
        }

        this.idle_last = this.gtop.idle;
        this.nice_last = this.gtop.nice;
        this.sys_last = this.gtop.sys;
        this.iowait_last = this.gtop.iowait;
        this.total_last = this.gtop.total;
        let used = 1 - idle - nice - sys - iowait;
        this._text = (100 * used).toFixed(this.text_decimals) + " %";

        return [used, nice, sys, iowait];
    },

    setTextDecimals: function(decimals) {
        this.text_decimals = Math.max(0, decimals);
    }
};

function MemData() {
    this._init.apply(this, arguments);
}

MemData.prototype = {
    __proto__: Provider.prototype,

    _init: function() {
        Provider.prototype._init.call(this, "mem");
        this.gtop = new GTop.glibtop_mem();
    },

    getData: function() {
        GTop.glibtop_get_mem(this.gtop);
        let used = this.gtop.used / this.gtop.total;
        let cached = (this.gtop.buffer + this.gtop.cached) / this.gtop.total;
        this._text = Math.round((this.gtop.used - this.gtop.cached - this.gtop.buffer) / (1024 * 1024)) +
            " / " + Math.round(this.gtop.total / (1024 * 1024)) + " " + _("MB");

        return [used - cached, cached];
    }
};

function SwapData() {
    this._init.apply(this, arguments);
}

SwapData.prototype = {
    __proto__: Provider.prototype,

    _init: function() {
        Provider.prototype._init.call(this, "swap");
        this.gtop = new GTop.glibtop_swap();
    },

    getData: function() {
        GTop.glibtop_get_swap(this.gtop);
        let used = this.gtop.total > 0 ? (this.gtop.used / this.gtop.total) : 0;
        this._text = Math.round(this.gtop.used / (1024 * 1024)) +
            " / " + Math.round(this.gtop.total / (1024 * 1024)) + " " + _("MB");

        return [used];
    }
};

function NetData() {
    this._init.apply(this, arguments);
}

NetData.prototype = {
    __proto__: Provider.prototype,

    _init: function() {
        Provider.prototype._init.call(this, "net");
        this.gtop = new GTop.glibtop_netload();

        try {
            let nl = new GTop.glibtop_netlist();
            this.devices = GTop.glibtop.get_netlist(nl);
        } catch (e) {
            this.devices = [];
            let d = Gio.File.new_for_path("/sys/class/net");
            let en = d.enumerate_children("standard::name", Gio.FileQueryInfoFlags.NONE, null);
            let info;
            while ((info = en.next_file(null))) {
                this.devices.push(info.get_name());
            }
        }

        this.devices = this.devices.filter(v => v !== "lo"); // don't measure loopback interface

        try {
            // Workaround, because string match() function throws an error for some reason if called after GTop.glibtop.get_netlist(). After the error is thrown, everything works fine.
            // If the match() would not be called here, the error would be thrown somewhere in Cinnamon applet init code and applet init would fail.
            // Error message: Could not locate glibtop_init_s: ‘glibtop_init_s’: /usr/lib64/libgtop-2.0.so.10: undefined symbol: glibtop_init_s
            // No idea why this error happens, but this workaround works.
            "".match(/./);
        } catch (e) {}
        [this.down_last, this.up_last] = this.getNetLoad();
    },

    getData: function() {
        let [down, up] = this.getNetLoad();
        let down_delta = (down - this.down_last) * 1000 / this._refresh_rate;
        let up_delta = (up - this.up_last) * 1000 / this._refresh_rate;
        this.down_last = down;
        this.up_last = up;
        this._text = Math.round(down_delta / 1024) + " / " + Math.round(up_delta / 1024) + " " + _("KB/s");

        return [down_delta, up_delta];
    },

    getNetLoad: function() {
        let down = 0;
        let up = 0;
        let i = 0,
            iLen = this.devices.length;
        for (; i < iLen; ++i) {
            GTop.glibtop.get_netload(this.gtop, this.devices[i]);
            down += this.gtop.bytes_in;
            up += this.gtop.bytes_out;
        }

        return [down, up];
    }
};

function LoadData() {
    this._init.apply(this, arguments);
}

LoadData.prototype = {
    __proto__: Provider.prototype,

    _init: function() {
        Provider.prototype._init.call(this, "load");
        this.gtop = new GTop.glibtop_loadavg();
    },

    getData: function() {
        GTop.glibtop_get_loadavg(this.gtop);
        let load = this.gtop.loadavg[0];
        this._text = this.gtop.loadavg[0] +
            ", " + this.gtop.loadavg[1] +
            ", " + this.gtop.loadavg[2];

        return [load];
    }
};

function CustomPanelItemTooltip() {
    this._init.apply(this, arguments);
}

CustomPanelItemTooltip.prototype = {
    __proto__: Tooltips.PanelItemTooltip.prototype,

    _init: function(aApplet, aOrientation) {
        Tooltips.PanelItemTooltip.prototype._init.call(this, aApplet, "", aOrientation);

        // Destroy the original _tooltip, which is an St.Label.
        this._tooltip.destroy();

        let tooltipBox = new Clutter.GridLayout({
            orientation: Clutter.Orientation.VERTICAL
        });

        this._tooltip = new St.Bin({
            name: "Tooltip"
        });

        let rtl = (St.Widget.get_default_direction() === St.TextDirection.RTL);
        this._tooltip.set_style("text-align:%s;".format(rtl ? "right" : "left"));

        /* NOTE: This is a workaround because Tooltip instances have the _tooltip property hard-coded
         * to be an St.Label(). And the Tooltip's show method calls this._tooltip.get_text() to decide
         * if the tooltip should be displayed or not.
         */
        this._tooltip.get_text = () => {
            return "I'm a dummy string.";
        };
        this._tooltip.show_on_set_parent = false;

        this._tooltip.set_child(new St.Widget({
            layout_manager: tooltipBox
        }));

        this.__markupTemplate = "<b>%s</b>: ";
        this.__ellipsisObj = {
            text: "..."
        };

        let i = 0,
            iLen = aApplet.graph_ids.length;
        for (; i < iLen; i++) {
            let graph_id = aApplet.graph_ids[i];

            this._createLabel(graph_id);
            tooltipBox.attach(this["__" + graph_id + "Title"], 0, i, 1, 1);
            tooltipBox.attach(this["__" + graph_id + "Value"], 1, i, 1, 1);
        }

        Main.uiGroup.add_actor(this._tooltip);
    },

    _createLabel: function(aProviderID) {
        this["__" + aProviderID + "Title"] = new St.Label();
        this["__" + aProviderID + "Title"].clutter_text.set_markup(
            this.__markupTemplate.format(ProvidersData[aProviderID]["title"])
        );
        this["__" + aProviderID + "Value"] = new St.Label(this.__ellipsisObj);
    },

    set_text: function(aProviderID, aValue) {
        this["__" + aProviderID + "Value"].set_text(aValue);
    }
};

function colorToArray(c) {
    c = c.match(/\((.*)\)/)[1].split(",").map(Number);
    c = [c[0] / 255, c[1] / 255, c[2] / 255, 3 in c ? c[3] : 1];
    return c;
}

/* exported colorToArray,
            Notification,
            Debugger
 */
