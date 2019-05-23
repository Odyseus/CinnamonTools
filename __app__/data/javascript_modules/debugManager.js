let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui["{{XLET_SYSTEM}}"]["{{XLET_META}}"]["{{UUID}}"];
}

const {
    gi: {
        Gio,
        GLib
    },
    misc: {
        params: Params
    }
} = imports;

const GioSSS = Gio.SettingsSchemaSource;

const DEBUG_MANAGER_SCHEMA = "org.cinnamon.{{XLET_TYPE}}s." + XletMeta.uuid;
const PROTOTYPE_DEBUGGER_PARAMS = Object.freeze({
    objectName: "Object",
    methods: [],
    blacklistMethods: false,
    debug: true,
    verbose: true,
    threshold: 3
});
var LoggingLevel = {
    NORMAL: 0,
    VERBOSE: 1,
    VERY_VERBOSE: 2
};

/**
 * Benchmark function invocations within a given class or prototype.
 *
 * @param  {Object}  aObject                    JavaScript class or prototype to benchmark.
 * @param  {Object}  aParams                    Object containing parameters, all are optional.
 * @param  {String}  aParams.objectName         Because it's impossible to get the name of a prototype
 *                                              in JavaScript, force it down its throat. ¬¬
 * @param  {Array}   aParams.methods            By default, all methods in aObject will be
 *                                              "proxyfied". aParams.methods should containg the name
 *                                              of the methods that one wants to debug/benchmark.
 *                                              aParams.methods acts as a whitelist by default.
 * @param  {Boolean} aParams.blacklistMethods   If true, ALL methods in aObject will be
 *                                              debugged/benchmarked, except those listed in aParams.methods.
 * @param  {Number}  aParams.threshold          The minimum latency of interest.
 * @param  {Boolean}  aParams.debug              If true, the target method will be executed inside a
 *                                              try{} catch{} block.
 */
function prototypeDebugger(aObject, aParams) {
    let options = Params.parse(aParams, PROTOTYPE_DEBUGGER_PARAMS);
    let keys = Object.getOwnPropertyNames(aObject.prototype);

    if (options.methods.length > 0) {
        keys = keys.filter((aKey) => {
            return options.blacklistMethods ?
                // Treat aMethods as a blacklist, so don't include these keys.
                options.methods.indexOf(aKey) === -1 :
                // Keep ONLY the keys in aMethods.
                options.methods.indexOf(aKey) >= 0;
        });
    }

    let outpuTemplate = "[%s.%s]: %fms (MAX: %fms AVG: %fms)";
    let times = [];
    let i = keys.length;

    let getHandler = (aKey) => {
        return {
            apply: function(aTarget, aThisA, aArgs) { // jshint ignore:line
                let val;
                let now;

                if (options.verbose) {
                    now = GLib.get_monotonic_time();
                }

                if (options.debug) {
                    try {
                        val = aTarget.apply(aThisA, aArgs);
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                } else {
                    val = aTarget.apply(aThisA, aArgs);
                }

                if (options.verbose) {
                    let time = GLib.get_monotonic_time() - now;

                    if (time >= options.threshold) {
                        times.push(time);
                        let total = 0;
                        let timesLength = times.length;
                        let z = timesLength;

                        while (z--) {
                            total += times[z];
                        }

                        let max = (Math.max.apply(null, times) / 1000).toFixed(2);
                        let avg = ((total / timesLength) / 1000).toFixed(2);
                        time = (time / 1000).toFixed(2);

                        global.log(outpuTemplate.format(
                            options.objectName,
                            aKey,
                            time,
                            max,
                            avg
                        ));
                    }
                }

                return val;
            }
        };
    };

    while (i--) {
        let key = keys[i];

        /* NOTE: If key is a setter or getter, aObject.prototype[key] will throw.
         */
        if (!!Object.getOwnPropertyDescriptor(aObject.prototype, key)["get"] ||
            !!Object.getOwnPropertyDescriptor(aObject.prototype, key)["set"]) {
            continue;
        }

        let fn = aObject.prototype[key];

        if (typeof fn !== "function") {
            continue;
        }

        aObject.prototype[key] = new Proxy(fn, getHandler(key));
    }
}

function wrapPrototypes(aDebugger, aPrototypes) {
    try {
        if (aDebugger.logging_level === LoggingLevel.VERY_VERBOSE ||
            aDebugger.debugger_enabled) {
            for (let name in aPrototypes) {
                prototypeDebugger(aPrototypes[name], {
                    objectName: name,
                    verbose: aDebugger.logging_level === LoggingLevel.VERY_VERBOSE,
                    debug: aDebugger.debugger_enabled
                });
            }
        }
    } catch (aErr) {
        global.logError(aErr);
    }
}

function DebugManager() {
    this._init.apply(this, arguments);
}

DebugManager.prototype = {
    _init: function(aSchema = false) {
        let schema = aSchema || DEBUG_MANAGER_SCHEMA;
        let schemaDir = Gio.file_new_for_path(XletMeta.path + "/schemas");
        let schemaSource;

        if (schemaDir.query_exists(null)) {
            schemaSource = GioSSS.new_from_directory(
                schemaDir.get_path(),
                GioSSS.get_default(),
                false
            );
        } else {
            schemaSource = GioSSS.get_default();
        }

        let schemaObj = schemaSource.lookup(schema, false);

        if (!schemaObj) {
            throw new Error(
                "Schema %s could not be found for xlet %s. Please check your installation."
                .format(schema, XletMeta.uuid)
            );
        }

        this.schema = new Gio.Settings({
            settings_schema: schemaObj
        });

        this._handlers = [];
    },

    set debugger_enabled(aValue) {
        this.schema.set_boolean("pref-debugger-enabled", aValue);
    },

    get debugger_enabled() {
        return this.schema.get_boolean("pref-debugger-enabled");
    },

    set logging_level(aValue) {
        this.schema.set_int("pref-logging-level", aValue);
    },

    get logging_level() {
        return this.schema.get_int("pref-logging-level");
    },

    connect: function(signal, callback) {
        let handler_id = this.schema.connect(signal, callback);
        this._handlers.push(handler_id);
        return handler_id;
    },

    destroy: function() {
        // Remove the remaining signals...
        while (this._handlers.length) {
            this.disconnect(this._handlers[0]);
        }
    },

    disconnect: function(handler_id) {
        let index = this._handlers.indexOf(handler_id);
        this.schema.disconnect(handler_id);

        if (index > -1) {
            this._handlers.splice(index, 1);
        }
    }
};

/* exported LoggingLevel,
            wrapPrototypes
 */
