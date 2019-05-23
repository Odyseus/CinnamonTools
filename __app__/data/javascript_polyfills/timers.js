const Mainloop = imports.mainloop;

function readOnlyError(property) {
    global.logError("The " + property + " object is read-only.");
}

if (!("setTimeout" in window)) {
    /**
     * setTimeout implementation extracted from newer versions of Cinnamon (util.js).
     *
     * Convenience wrapper for a Mainloop.timeout_add loop that returns false.
     *
     * @callback {Function} : - Function to call at the end of the timeout.
     * @ms       {Number}   : - Milliseconds until the timeout expires.
     *
     * @return {Number} : The ID of the loop.
     */
    var setTimeoutFn = function setTimeoutFn(callback, ms) {
        let args = [];
        if (arguments.length > 2) {
            args = args.slice.call(arguments, 2);
        }

        let id = Mainloop.timeout_add(ms, () => {
            callback.call(null, Array.prototype.slice.call(args));
            return false; // Stop repeating
        }, null);

        return id;
    };

    Object.defineProperty(window, "setTimeout", {
        get: function() {
            return setTimeoutFn;
        },
        set: function() {
            readOnlyError("setTimeout");
        },
        configurable: false,
        enumerable: false
    });
}

if (!("clearTimeout" in window)) {
    /**
     * clearTimeout implementation extracted from newer versions of Cinnamon (util.js).
     *
     * Convenience wrapper for Mainloop.source_remove.
     *
     * @id {Number} : - The ID of the loop to remove.
     */
    var clearTimeoutFn = function clearTimeoutFn(id) {
        if (id) {
            Mainloop.source_remove(id);
        }
    };

    Object.defineProperty(window, "clearTimeout", {
        get: function() {
            return clearTimeoutFn;
        },
        set: function() {
            readOnlyError("clearTimeout");
        },
        configurable: false,
        enumerable: false
    });
}

if (!("setTimeout" in window)) {
    /**
     * setInterval implementation extracted from newer versions of Cinnamon (util.js).
     *
     * Convenience wrapper for a Mainloop.timeout_add loop that
     * returns true.
     *
     * @callback {Function} : - Function to call on every interval.
     * @ms       {Number}   : - Milliseconds between invocations.
     *
     * @returns {Number} : The ID of the loop.
     */
    var setIntervalFn = function setIntervalFn(callback, ms) {
        let args = [];
        if (arguments.length > 2) {
            args = args.slice.call(arguments, 2);
        }

        let id = Mainloop.timeout_add(ms, () => {
            callback.call(null, Array.prototype.slice.call(args));
            return true; // Repeat
        }, null);

        return id;
    };

    Object.defineProperty(window, "setInterval", {
        get: function() {
            return setIntervalFn;
        },
        set: function() {
            readOnlyError("setInterval");
        },
        configurable: false,
        enumerable: false
    });
}

if (!("clearInterval" in window)) {
    /**
     * clearInterval implementation extracted from newer versions of Cinnamon (util.js).
     *
     * Convenience wrapper for Mainloop.source_remove.
     *
     * @id {Number} : - The ID of the loop to remove.
     */
    var clearIntervalFn = function clearIntervalFn(id) {
        if (id) {
            Mainloop.source_remove(id);
        }
    };

    Object.defineProperty(window, "clearInterval", {
        get: function() {
            return clearIntervalFn;
        },
        set: function() {
            readOnlyError("clearInterval");
        },
        configurable: false,
        enumerable: false
    });
}

/* setImmediate polyfill.
 * https://github.com/taylorhakes/setAsap
 *
 * The MIT License (MIT)
 * Copyright (c) 2014 Taylor Hakes
 */
(function() {
    var hasSetImmediate = typeof setImmediate === "function";
    var setAsap = (function() {
        var timeoutFn = (hasSetImmediate && setImmediate) || setTimeout;
        return function setAsap(callback) {
            timeoutFn(callback);
        };
    })();

    if (!("setImmediate" in window)) {
        Object.defineProperty(window, "setImmediate", {
            get: function() {
                return setAsap;
            },
            set: function() {
                readOnlyError("setImmediate");
            },
            configurable: false,
            enumerable: false
        });
    }
})();
