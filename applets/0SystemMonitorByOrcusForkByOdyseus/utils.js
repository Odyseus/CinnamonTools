let GlobalUtils,
    DebugManager;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    GlobalUtils = require("./globalUtils.js");
    DebugManager = require("./debugManager.js");
} else {
    GlobalUtils = imports.ui.appletManager.applets["{{UUID}}"].globalUtils;
    DebugManager = imports.ui.appletManager.applets["{{UUID}}"].debugManager;
}

const {
    gi: {
        Gio
    }
} = imports;

const {
    _
} = GlobalUtils;

var Debugger = new DebugManager.DebugManager();

var GTop;

try {
    GTop = imports.gi.GTop;
} catch (aErr) {
    GTop = null;
}

function CpuData() {
    this._init();
}

CpuData.prototype = {
    _init: function() {
        this.gtop = new GTop.glibtop_cpu();
        this.idle_last = 0;
        this.nice_last = 0;
        this.sys_last = 0;
        this.iowait_last = 0;
        this.total_last = 0;
        this.text_decimals = 0;
    },

    getDim: function() {
        return 4;
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
        this.text = (100 * used).toFixed(this.text_decimals) + " %";
        return [used, nice, sys, iowait];
    },

    getText: function() {
        return [_("CPU"), this.text];
    },

    setTextDecimals: function(decimals) {
        this.text_decimals = Math.max(0, decimals);
    }
};

function MemData() {
    this._init();
}

MemData.prototype = {
    _init: function() {
        this.gtop = new GTop.glibtop_mem();
    },

    getDim: function() {
        return 2;
    },

    getData: function() {
        GTop.glibtop_get_mem(this.gtop);
        let used = this.gtop.used / this.gtop.total;
        let cached = (this.gtop.buffer + this.gtop.cached) / this.gtop.total;
        this.text = Math.round((this.gtop.used - this.gtop.cached - this.gtop.buffer) / (1024 * 1024)) +
            " / " + Math.round(this.gtop.total / (1024 * 1024)) + " " + _("MB");
        return [used - cached, cached];
    },

    getText: function() {
        return [_("Memory"), this.text];
    }
};

function SwapData() {
    this._init();
}

SwapData.prototype = {
    _init: function() {
        this.gtop = new GTop.glibtop_swap();
    },

    getDim: function() {
        return 1;
    },

    getData: function() {
        GTop.glibtop_get_swap(this.gtop);
        let used = this.gtop.used / this.gtop.total;
        this.text = Math.round(this.gtop.used / (1024 * 1024)) +
            " / " + Math.round(this.gtop.total / (1024 * 1024)) + " " + _("MB");
        return [used];
    },

    getText: function() {
        return [_("Swap"), this.text];
    }
};

function NetData() {
    this._init();
}

NetData.prototype = {
    _init: function() {
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

    getDim: function() {
        return 2;
    },

    getData: function() {
        let [down, up] = this.getNetLoad();
        let down_delta = (down - this.down_last) * 1000 / this.refresh_rate;
        let up_delta = (up - this.up_last) * 1000 / this.refresh_rate;
        this.down_last = down;
        this.up_last = up;
        this.text = Math.round(down_delta / 1024) + " / " + Math.round(up_delta / 1024) +
            " " + _("KB/s");
        return [down_delta, up_delta];
    },

    getText: function() {
        return [_("Network D/U"), this.text];
    },

    getNetLoad: function() {
        let down = 0;
        let up = 0;
        for (let i = 0; i < this.devices.length; ++i) {
            GTop.glibtop.get_netload(this.gtop, this.devices[i]);
            down += this.gtop.bytes_in;
            up += this.gtop.bytes_out;
        }
        return [down, up];
    }
};

function LoadAvgData() {
    this._init();
}

LoadAvgData.prototype = {
    _init: function() {
        this.gtop = new GTop.glibtop_loadavg();
    },

    getDim: function() {
        return 1;
    },

    getData: function() {
        GTop.glibtop_get_loadavg(this.gtop);
        let load = this.gtop.loadavg[0];
        this.text = this.gtop.loadavg[0] +
            ", " + this.gtop.loadavg[1] +
            ", " + this.gtop.loadavg[2];
        return [load];
    },

    getText: function() {
        return [_("Load average"), this.text];
    }
};

function Graph() {
    this._init.apply(this, arguments);
}

Graph.prototype = {
    _init: function(area, provider) {
        this.area = area;
        this.provider = provider;
        this.colors = [
            [1, 1, 1, 1]
        ];
        this.bg_color = [0, 0, 0, 1];
        this.border_color = [1, 1, 1, 1];
        this.smooth = false;
        this.data = [];
        this.dim = this.provider.getDim();
        this.autoScale = false;
        this.scale = 1;
        this.width = 1;
        this.draw_background = true;
        this.draw_border = true;
        this.paint_queued = false;
        this.area.connect("repaint", () => this.paint());
    },

    _setColor: function(cr, i) {
        let c = this.colors[i % this.colors.length];
        cr.setSourceRGBA(c[0], c[1], c[2], c[3]);
    },

    _resizeData: function() {
        let datasize = this.width - (this.draw_border ? 2 : 0);
        if (datasize > this.data.length) {
            let d = Array(datasize - this.data.length);
            for (let i = 0; i < d.length; i++) {
                d[i] = Array(this.dim);
                for (let j = 0; j < this.dim; j++) {
                    d[i][j] = 0;
                }
            }
            this.data = d.concat(this.data);
        } else if (datasize < this.data.length) {
            this.data = this.data.slice(this.data.length - datasize);
        }
    },

    updateSize: function() {
        this.width = null;
        this.repaint();
    },

    setWidth: function(width, vertical) {
        if (vertical) {
            this.area.set_width(-1);
            this.area.set_height(width);
        } else {
            this.area.set_width(width);
            this.area.set_height(-1);
        }
        this.updateSize();
    },

    setDrawBackground: function(draw_background) {
        this.draw_background = draw_background;
        this.repaint();
    },

    setDrawBorder: function(draw_border) {
        this.draw_border = draw_border;
        this.updateSize();
    },

    setColors: function(c) {
        this.colors = c;
        this.repaint();
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
        this.repaint();
    },

    dataSum: function(i, depth) {
        let sum = 0;
        for (let j = 0; j <= depth; ++j) {
            sum += this.data[i][j];
        }
        return sum;
    },

    repaint: function() {
        if (!this.paint_queued) {
            this.paint_queued = true;
            this.area.queue_repaint();
        }
    },

    paint: function() {
        this.paint_queued = false;
        let cr = this.area.get_context();
        let [width, height] = this.area.get_size();

        if (!this.width) {
            this.width = width;
            this._resizeData();
        }

        let border_width = this.draw_border ? 1 : 0;
        let graph_width = width - 2 * border_width;
        let graph_height = height - 2 * border_width;
        cr.setLineWidth(1);

        // background
        if (this.draw_background) {
            cr.setSourceRGBA(this.bg_color[0], this.bg_color[1], this.bg_color[2], this.bg_color[3]);
            cr.rectangle(border_width, border_width, graph_width, graph_height);
            cr.fill();
        }

        // data
        if (this.smooth) {
            for (let j = this.dim - 1; j >= 0; --j) {
                this._setColor(cr, j);
                cr.moveTo(border_width, graph_height + border_width);
                for (let i = 0; i < this.data.length; ++i) {
                    let v = Math.round(graph_height * Math.min(1, this.scale * this.dataSum(i, j)));
                    v = graph_height + border_width - v;

                    if (i == 0) {
                        cr.lineTo(i + border_width, v);
                    }

                    cr.lineTo(i + border_width + 0.5, v);

                    if (i == this.data.length - 1) {
                        cr.lineTo(i + border_width + 1, v);
                    }
                }
                cr.lineTo(graph_width + border_width, graph_height + border_width);
                cr.lineTo(border_width, graph_height + border_width);
                cr.fill();
            }
        } else {
            for (let i = 0; i < this.data.length; ++i) {
                for (let j = this.dim - 1; j >= 0; --j) {
                    this._setColor(cr, j);
                    cr.moveTo(i + border_width + 0.5, graph_height + border_width);
                    let v = Math.round(graph_height * Math.min(1, this.scale * this.dataSum(i, j)));
                    cr.relLineTo(0, -v);
                    cr.stroke();
                }
            }
        }

        // border
        if (this.draw_border) {
            cr.setSourceRGBA(this.border_color[0], this.border_color[1], this.border_color[2], this.border_color[3]);
            cr.rectangle(0.5, 0.5, width - 1, height - 1);
            cr.stroke();
        }
    },

    setAutoScale: function(minScale) {
        if (minScale > 0) {
            this.autoScale = true;
            this.minScale = minScale;
        } else {
            this.autoScale = false;
        }
    }
};

function colorToArray(c) {
    c = c.match(/\((.*)\)/)[1].split(",").map(Number);
    c = [c[0] / 255, c[1] / 255, c[2] / 255, 3 in c ? c[3] : 1];
    return c;
}

DebugManager.wrapPrototypes(Debugger, {
    CpuData: CpuData,
    LoadAvgData: LoadAvgData,
    MemData: MemData,
    NetData: NetData,
    SwapData: SwapData
});

/* exported colorToArray
 */
