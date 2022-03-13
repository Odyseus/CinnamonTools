const {
    gi: {
        Gio,
        GLib
    },
    misc: {
        params: Params,
        signalManager: SignalManager
    }
} = imports;

const {
    tryFn
} = require("js_modules/globalUtils.js");

const GioSSS = Gio.SettingsSchemaSource;

const DEBUG_MANAGER_SCHEMA = `org.cinnamon.{{XLET_TYPE}}s.${__meta.uuid}`;
const OUTPUT_TEMPLATE = "[%s.%s]: %fms (MAX: %fms AVG: %fms)";
const PrototypeDebuggerParams = Object.freeze({
    object_name: "Object",
    methods: null,
    blacklist_methods: false,
    debug: true,
    verbose: true,
    threshold: 3
});
var LoggingLevel = {
    NORMAL: 0,
    VERBOSE: 1,
    VERY_VERBOSE: 2
};

function _getHandler(aKey, aOptions, aTimes) {
    return {
        apply: function(aTarget, aThisA, aArgs) {
            let val;
            let now;

            if (aOptions.verbose) {
                now = GLib.get_monotonic_time();
            }

            if (aOptions.debug) {
                tryFn(() => {
                    val = aTarget.apply(aThisA, aArgs);
                }, (aErr) => global.logError(aErr));
            } else {
                val = aTarget.apply(aThisA, aArgs);
            }

            if (aOptions.verbose) {
                let time = GLib.get_monotonic_time() - now;

                if (time >= aOptions.threshold) {
                    aTimes.push(time);
                    let total = 0;
                    const timesLength = aTimes.length;
                    let z = timesLength;

                    while (z--) {
                        total += aTimes[z];
                    }

                    const max = (Math.max.apply(null, aTimes) / 1000).toFixed(2);
                    const avg = ((total / timesLength) / 1000).toFixed(2);
                    time = (time / 1000).toFixed(2);

                    global.log(OUTPUT_TEMPLATE.format(
                        aOptions.object_name,
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
}

/**
 * Benchmark function invocations within a given class or prototype.
 *
 * @param {Object}  aObject                   - JavaScript class/prototype/object to benchmark.
 * @param {Object}  aParams                   - Object containing parameters, all are optional.
 * @param {String}  aParams.object_name       - Because it's impossible to get the name of a
 *                                              prototype in JavaScript, force it down its throat. ¬¬
 * @param {Array}   aParams.methods           - By default, all methods in aObject will be "proxyfied".
 *                                              aParams.methods should containg the name of the methods
 *                                              that one wants to debug/benchmark. aParams.methods acts
 *                                              as a whitelist by default.
 * @param {Boolean} aParams.blacklist_methods - If true, ALL methods in aObject will be
 *                                              debugged/benchmarked, except those listed in aParams.methods.
 * @param {Number}  aParams.threshold         - The minimum latency of interest.
 * @param {Boolean} aParams.debug             - If true, the target method will be executed inside
 *                                              a try{} catch{} block.
 */
function methodWrapper(aObject, aParams) {
    const options = Params.parse(aParams, PrototypeDebuggerParams);
    const _obj = Object.getPrototypeOf(aObject) === Object.prototype ?
        aObject :
        aObject.prototype;
    // TODO: The constructor method of JavaScript classes aren't listed with Object.getOwnPropertyNames().
    // Investigate what is it that can be done to fix this.
    let keys = Object.getOwnPropertyNames(aObject.prototype);

    if (Array.isArray(options.methods) && options.methods.length > 0) {
        keys = keys.filter((aKey) => {
            return options.blacklist_methods ?
                // Treat aMethods as a blacklist, so don't include these keys.
                options.methods.indexOf(aKey) === -1 :
                // Keep ONLY the keys in aMethods.
                options.methods.indexOf(aKey) >= 0;
        });
    }

    /* FIXME: For now, I'm just ignoring setters/getters.
     * See if I can wrap getters/setters too.
     * See note inside the last while loop.
     */
    keys = keys.filter((aKey) => {
        return !Object.getOwnPropertyDescriptor(_obj, aKey)["get"] &&
            !Object.getOwnPropertyDescriptor(_obj, aKey)["set"];
    });

    const times = [];

    let i = keys.length;
    while (i--) {
        const key = keys[i];
        /* NOTE: In the original Cinnamon function, getters/setters aren't ignored.
         * As I understand it, a getter would be executed when doing _obj[key], instead
         * of storing the getter function. So, as a workaround, I just ignore all
         * setters/getters and move on.
         */
        const fn = _obj[key];

        if (typeof fn !== "function") {
            continue;
        }

        _obj[key] = new Proxy(fn, _getHandler(key, options, times));
    }
}

/**
 * Wrap object's methods using methodWrapper function.
 *
 * NOTE: Declared at module level but mostly used from a DebugManager instance because I used
 * to wrap classes without using an instance of DebugManager. I don't want to loose this capability,
 * so I will keep this function here.
 *
 * @param {Object} aDebugger     - An instance of DebugManager.
 * @param {Object} aProtos       - The classes whose methods need to be wrapped.
 * @param {Object} aExtraOptions - Extra options to pass to methodWrapper function.
 */
function wrapObjectMethods(aDebugger, aProtos, aExtraOptions = {}) {
    tryFn(() => {
        if (aDebugger.logging_level === LoggingLevel.VERY_VERBOSE || aDebugger.debugger_enabled) {
            for (const name in aProtos) {
                const options = {
                    object_name: name,
                    verbose: aDebugger.logging_level === LoggingLevel.VERY_VERBOSE,
                    debug: aDebugger.debugger_enabled
                };

                if (name in aExtraOptions) {
                    for (const opt in aExtraOptions[name]) {
                        if (aExtraOptions[name].hasOwnProperty(opt)) {
                            options[opt] = aExtraOptions[name][opt];
                        }
                    }
                }

                methodWrapper(aProtos[name], options);
            }
        }
    }, (aErr) => global.logError(aErr));
}

/**
 * Debug manager.
 *
 * @param {String} aSchema - Description.
 *
 * @type {Class}
 */
var DebugManager = class DebugManager {
    constructor(aSchema = false) {
        this._signal_manager = new SignalManager.SignalManager();
        this.schema = null;
        const schema = aSchema || DEBUG_MANAGER_SCHEMA;
        const schemaDir = Gio.file_new_for_path(`${__meta.path}/schemas`);
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

        const schemaObj = schemaSource.lookup(schema, false);

        if (!schemaObj) {
            throw new Error(
                "Schema %s could not be found for xlet %s. Please check your installation."
                .format(schema, __meta.uuid)
            );
        }

        this.schema = new Gio.Settings({
            settings_schema: schemaObj
        });
    }

    set debugger_enabled(aValue) {
        this.schema.set_boolean("debugger-enabled", aValue);
    }

    get debugger_enabled() {
        return this.schema.get_boolean("debugger-enabled");
    }

    set logging_level(aValue) {
        this.schema.set_int("logging-level", parseInt(aValue, 10));
    }

    get logging_level() {
        return parseInt(this.schema.get_int("logging-level"), 10);
    }

    wrapObjectMethods() {
        wrapObjectMethods.call(this, this, ...arguments);
    }

    destroy() {
        this._signal_manager.disconnectAllSignals();
    }

    connect(aSignal, aCallback) {
        this._signal_manager.connect(this.schema, aSignal, aCallback);
    }

    // WARNING: I don't use the connect/disconnect methods. Just pay attention to the parameters.
    disconnect(aSignal, aCallback) {
        this._signal_manager.disconnect(aSignal, this.schema, aCallback);
    }
};

/* exported LoggingLevel,
            wrapObjectMethods,
            DebugManager
 */
