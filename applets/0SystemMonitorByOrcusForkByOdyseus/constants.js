// {{IMPORTER}}

const GlobalUtils = __import("globalUtils.js");

const {
    _
} = GlobalUtils;

var ProvidersData = {
    cpu: {
        title: _("CPU"),
        dim: 4
    },
    mem: {
        title: _("Memory"),
        dim: 2
    },
    swap: {
        title: _("Swap"),
        dim: 1
    },
    net: {
        title: _("Network"),
        dim: 2
    },
    load: {
        title: _("Load average"),
        dim: 1
    }
};

/* exported ProvidersData
 */
