const {
    gi: {
        Gio
    }
} = imports;

const {
    ProvidersData
} = require("js_modules/constants.js");

const {
    _,
    arrayEach,
    escapeHTML,
    tryFn,
    launchUri
} = require("js_modules/globalUtils.js");

const {
    CustomNotification
} = require("js_modules/notificationsUtils.js");

const {
    DebugManager
} = require("js_modules/debugManager.js");

var Debugger = new DebugManager(`org.cinnamon.applets.${__meta.uuid}`);

var GTop;

try {
    GTop = imports.gi.GTop;
} catch (aErr) {
    GTop = null;
}

Debugger.wrapObjectMethods({
    CustomNotification: CustomNotification
});

var Notification = new CustomNotification({
    title: escapeHTML(_(__meta.name)),
    default_buttons: [{
        action: "dialog-information",
        label: escapeHTML(_("Help"))
    }],
    action_invoked_callback: (aSource, aAction) => {
        switch (aAction) {
            case "dialog-information":
                launchUri(`${__meta.path}/HELP.html`);
                break;
        }
    }
});

var Graph = class Graph {
    constructor(aProvider) {
        this.provider = aProvider;
        this.colors = [
            [1, 1, 1, 1]
        ];
        this.data = [];
        this.dim = this.provider.dim;
        this.autoScale = false;
        this.scale = 1;
        this.width = 1;
        this.height = 1;
        this.resize_data = false;
    }

    _setColor(aCr, aIndex) {
        const c = this.colors[aIndex % this.colors.length];
        aCr.setSourceRGBA(c[0], c[1], c[2], c[3]);
    }

    _resizeData() {
        const datasize = this.width - (this.provider.border_color ? 2 : 0);
        if (datasize > this.data.length) {
            const d = Array(datasize - this.data.length);
            // WARNING: Do not attempt to use arrayEach in the following two loops.
            let i = 0,
                iLen = d.length;
            for (; i < iLen; i++) {
                d[i] = Array(this.dim);
                let j = 0;
                for (; j < this.dim; j++) {
                    d[i][j] = 0;
                }
            }
            this.data = [...d, ...this.data];
        } else if (datasize < this.data.length) {
            this.data = this.data.slice(this.data.length - datasize);
        }
    }

    setResolution(aWidth, aHeight) {
        this.width = aWidth;
        this.height = aHeight;
        this.resize_data = true;
    }

    setColors(aColor) {
        this.colors = aColor;
    }

    refresh() {
        const d = this.provider.getData();
        this.data.push(d);
        this.data.shift();

        if (this.autoScale) {
            let maxVal = this.minScale;
            arrayEach(this.data, (aD, aIdx) => {
                const sum = this.dataSum(aIdx, this.dim - 1);

                if (sum > maxVal) {
                    maxVal = sum;
                }
            });

            this.scale = 1.0 / maxVal;
        }
    }

    dataSum(aIndex, aDepth) {
        let sum = 0;
        // WARNING: Do not attempt to use arrayEach in the following loop.
        for (let j = 0; j <= aDepth; ++j) {
            sum += this.data[aIndex][j];
        }

        return sum;
    }

    paint(aCr, aNoLeftBorder) {
        if (this.resize_data) {
            this._resizeData();
            this.resize_data = false;
        }

        const border_width = this.provider.border_color ? 1 : 0;
        const graph_width = this.width - 2 * border_width;
        const graph_height = this.height - 2 * border_width;
        aCr.setLineWidth(1);

        // background
        if (this.provider.bg_color) {
            aCr.setSourceRGBA(this.provider.bg_color[0], this.provider.bg_color[1],
                this.provider.bg_color[2], this.provider.bg_color[3]);
            aCr.rectangle(border_width, border_width, graph_width, graph_height);
            aCr.fill();
        }

        // data
        // WARNING: Do not attempt to use arrayEach in the following two loops.
        if (this.provider.smooth) {
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
                    const v = Math.round(graph_height * Math.min(1, this.scale * this.dataSum(i, j)));
                    aCr.relLineTo(0, -v);
                    aCr.stroke();
                }
            }
        }

        // border
        if (this.provider.border_color) {
            aCr.setSourceRGBA(this.provider.border_color[0], this.provider.border_color[1],
                this.provider.border_color[2], this.provider.border_color[3]);
            aCr.moveTo(0.5, 0.5);
            aCr.lineTo(this.width - 0.5, 0.5);
            aCr.lineTo(this.width - 0.5, this.height - 0.5);
            aCr.lineTo(0.5, this.height - 0.5);

            if (!aNoLeftBorder) {
                aCr.closePath();
            }

            aCr.stroke();
        }
    }

    setAutoScale(aMinScale) {
        if (aMinScale > 0) {
            this.autoScale = true;
            this.minScale = aMinScale;
        } else {
            this.autoScale = false;
        }
    }
};

var Provider = class Provider {
    constructor(aDefinition) {
        this._refresh_rate = 1000;
        this._definition = aDefinition;
        this._text = "";
    }

    setRefreshRate(aRefreshRate) {
        this._refresh_rate = aRefreshRate;
    }

    get id() {
        return this._definition.id;
    }

    get dim() {
        return ProvidersData[this.id].dim;
    }

    get smooth() {
        return this._definition.smooth;
    }

    get bg_color() {
        return this._definition.bg_color;
    }

    get border_color() {
        return this._definition.border_color;
    }

    get position() {
        return this._definition.position;
    }

    get width_height() {
        return this._definition.width_height;
    }

    get text() {
        return [ProvidersData[this.id].title, this._text];
    }
};

var CpuData = class CpuData extends Provider {
    constructor(aDefinition) {
        super(aDefinition);

        this.gtop = new GTop.glibtop_cpu();
        this.idle_last = 0;
        this.nice_last = 0;
        this.sys_last = 0;
        this.iowait_last = 0;
        this.total_last = 0;
        this.text_decimals = 0;
    }

    getData() {
        GTop.glibtop_get_cpu(this.gtop);
        const delta = (this.gtop.total - this.total_last);
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
        const used = 1 - idle - nice - sys - iowait;
        this._text = (100 * used).toFixed(this.text_decimals) + " %";

        return [used, nice, sys, iowait];
    }

    setTextDecimals(decimals) {
        this.text_decimals = Math.max(0, decimals);
    }
};

var MemData = class MemData extends Provider {
    constructor(aDefinition) {
        super(aDefinition);
        this.gtop = new GTop.glibtop_mem();
    }

    getData() {
        GTop.glibtop_get_mem(this.gtop);
        const used = this.gtop.used / this.gtop.total;
        const cached = (this.gtop.buffer + this.gtop.cached) / this.gtop.total;
        this._text = Math.round((this.gtop.used - this.gtop.cached - this.gtop.buffer) / (1024 * 1024)) +
            " / " + Math.round(this.gtop.total / (1024 * 1024)) + " " + _("MB");

        return [used - cached, cached];
    }
};

var SwapData = class SwapData extends Provider {
    constructor(aDefinition) {
        super(aDefinition);
        this.gtop = new GTop.glibtop_swap();
    }

    getData() {
        GTop.glibtop_get_swap(this.gtop);
        const used = this.gtop.total > 0 ? (this.gtop.used / this.gtop.total) : 0;
        this._text = Math.round(this.gtop.used / (1024 * 1024)) +
            " / " + Math.round(this.gtop.total / (1024 * 1024)) + " " + _("MB");

        return [used];
    }
};

var NetData = class NetData extends Provider {
    constructor(aDefinition) {
        super(aDefinition);
        this.gtop = new GTop.glibtop_netload();

        tryFn(() => {
            const nl = new GTop.glibtop_netlist();
            this.devices = GTop.glibtop.get_netlist(nl);
        }, (aErr) => { // jshint ignore:line
            this.devices = [];
            const d = Gio.File.new_for_path("/sys/class/net");
            const en = d.enumerate_children("standard::name", Gio.FileQueryInfoFlags.NONE, null);
            let info;
            while ((info = en.next_file(null))) {
                this.devices.push(info.get_name());
            }
        });

        this.devices = this.devices.filter(v => v !== "lo"); // don't measure loopback interface

        tryFn(() => {
            // Workaround, because string match() function throws an error for some reason if called after GTop.glibtop.get_netlist(). After the error is thrown, everything works fine.
            // If the match() would not be called here, the error would be thrown somewhere in Cinnamon applet init code and applet init would fail.
            // Error message: Could not locate glibtop_init_s: ‘glibtop_init_s’: /usr/lib64/libgtop-2.0.so.10: undefined symbol: glibtop_init_s
            // No idea why this error happens, but this workaround works.
            "".match(/./);
        }, (aErr) => {}); // jshint ignore:line

        [this.down_last, this.up_last] = this.getNetLoad();
    }

    getData() {
        const [down, up] = this.getNetLoad();
        const down_delta = (down - this.down_last) * 1000 / this._refresh_rate;
        const up_delta = (up - this.up_last) * 1000 / this._refresh_rate;
        this.down_last = down;
        this.up_last = up;
        this._text = Math.round(down_delta / 1024) + " / " + Math.round(up_delta / 1024) + " " + _("KB/s");

        return [down_delta, up_delta];
    }

    getNetLoad() {
        let down = 0;
        let up = 0;
        for (const device of this.devices) {
            GTop.glibtop.get_netload(this.gtop, device);
            down += this.gtop.bytes_in;
            up += this.gtop.bytes_out;
        }

        return [down, up];
    }
};

var LoadData = class LoadData extends Provider {
    constructor(aDefinition) {
        super(aDefinition);
        this.gtop = new GTop.glibtop_loadavg();
    }

    getData() {
        GTop.glibtop_get_loadavg(this.gtop);
        const load = this.gtop.loadavg[0];
        this._text = this.gtop.loadavg[0] +
            ", " + this.gtop.loadavg[1] +
            ", " + this.gtop.loadavg[2];

        return [load];
    }
};

function colorToArray(c) {
    if (c) {
        c = c.match(/\((.*)\)/)[1].split(",").map(Number);
        c = [c[0] / 255, c[1] / 255, c[2] / 255, 3 in c ? c[3] : 1];
    } else {
        c = [0, 0, 0, 0];
    }

    return c;
}

Debugger.wrapObjectMethods({
    CpuData: CpuData,
    Graph: Graph,
    LoadData: LoadData,
    MemData: MemData,
    NetData: NetData,
    SwapData: SwapData
});

/* exported colorToArray,
            Notification,
            Debugger,
            APPLET_PREFS
 */
