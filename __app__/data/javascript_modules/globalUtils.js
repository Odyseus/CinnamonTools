/**
 * Global utilities and constants to be used by all xlets.
 *
 * - Only include functions/classes that will be used by at least 2 or more xlets.
 * - If in the future the file gets too cluttered, or I have to add "heavy" classes
 *     with several core imports (from "gi" or "ui"), add them in separated modules;
 *     like I did with the other modules inside this folder (debugManager.js, customDialogs.js, etc.).
 * - Do not ever import other local modules inside this module.
 * - Only include constants that require an import (e.g. the CINNAMON_VERSION constant
 *     requires GLib). Other constants should go in globalConstants.js.
 */
const {
    gettext: Gettext,
    gi: {
        Gio,
        Gtk,
        GLib,
        St
    },
    mainloop: Mainloop,
    misc: {
        params: Params,
        util: Util
    },
    ui: {
        main: Main
    }
} = imports;

Gettext.bindtextdomain(__meta.uuid, `${GLib.get_home_dir()}/.local/share/locale`);

const LaunchURIParams = Object.freeze({
    context: null,
    cancellable: null
});

// NOTE: The CINNAMON_VERSION environment variable is set when Cinnamon starts and is only visible
// from within an xlet context. Checking for the variable in any shell is pointless because it
// doesn't exist.
var CINNAMON_VERSION = GLib.getenv("CINNAMON_VERSION");
var USER_HOME = GLib.get_home_dir();
var USER_DESKTOP_PATH = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP);
var CINNAMON_CONFIG_FOLDER = `${USER_HOME}/.cinnamon/configs`;
var CINNAMON_STANDARD_CONFIG_FOLDER = `${USER_HOME}/.local/share/cinnamon/configs`;

var ComparisonOperators = {
    "!=": (a, b) => a !== b,
    "<": (a, b) => a < b,
    "<=": (a, b) => a <= b,
    "=": (a, b) => a === b,
    ">": (a, b) => a > b,
    ">=": (a, b) => a >= b
};

/**
 * Helper class to handle time outs and intervals.
 *
 * @type {Class}
 */
var ScheduleManager = class ScheduleManager {
    constructor() {
        this._storage = new Map();
    }

    /**
     * Start schedule.
     *
     * @param {Boolean}  aRepeat   - Repeat aCallback execution.
     * @param {String}   aKey      - Schedule ID.
     * @param {Function} aCallback - Function to call when timer runs out.
     * @param {Number}   aMs       - Execution delay in milliseconds.
     */
    _schedule(aRepeat, aKey, aCallback, aMs) {
        // NOTE: Monitor this to see if it's a good idea.
        this.clearSchedule(aKey);
        let args = [];
        if (arguments.length > 4) {
            args = args.slice.call(arguments, 4);
        }

        this._storage.set(aKey, Mainloop.timeout_add(aMs, () => {
            // NOTE: Without the try/catch, I have no error message and I only see the usual warning
            // about Mainloop.source_remove() cast on an invalid ID.
            // This way, I see the EXACT error and set aRepeat to false.
            tryFn(() => {
                aCallback.call(null, ...args);
            }, (aErr) => {
                global.logError(aErr);
                aRepeat = false;
            });

            aRepeat || this._storage.set(aKey, 0);

            return aRepeat ? GLib.SOURCE_CONTINUE : GLib.SOURCE_REMOVE;
        }));
    }

    /**
     * Idle call.
     *
     * @param {String}   aKey      - Schedule ID.
     * @param {Function} aCallback - Function to call when the main loop is idle.
     */
    idleCall(aKey, aCallback) {
        this.clearSchedule(aKey);
        let args = [];
        if (arguments.length > 2) {
            args = args.slice.call(arguments, 2);
        }

        this._storage.set(aKey, Mainloop.idle_add(() => {
            // NOTE: Without the try/catch, I have no error message and I only see the usual warning
            // about Mainloop.source_remove() cast on an invalid ID.
            // This way, I see the EXACT error.
            tryFn(() => {
                aCallback.call(null, ...args);
            }, (aErr) => {
                global.logError(aErr);
            });

            this._storage.set(aKey, 0);

            return GLib.SOURCE_REMOVE;
        }));
    }

    /**
     * Executes a function or specified piece of code once the timer expires.
     * See _schedule for parameters.
     */
    setTimeout() {
        this._schedule(false, ...arguments);
    }

    /**
     * Repeatedly call a function or execute a code snippet.
     * See _schedule for parameters.
     */
    setInterval() {
        this._schedule(true, ...arguments);
    }

    /**
     * Check if a specific schedule is running.
     *
     * @param {String} aKey - Schedule ID.
     *
     * @return {Boolean} If schedule is running.
     */
    isScheduled(aKey) {
        return this._storage.has(aKey) && Number(this._storage.get(aKey)) > 0;
    }

    /**
     * Clear an specific schedule.
     *
     * @param {String} aKey - Schedule ID.
     */
    clearSchedule(aKey) {
        if (this._storage.has(aKey)) {
            const id = Number(this._storage.get(aKey));

            if (id > 0) {
                Mainloop.source_remove(id);
                this._storage.set(aKey, 0);
            }
        }
    }

    /**
     * Clear all schedules.
     */
    clearAllSchedules() {
        for (const key of this._storage.keys()) {
            this.clearSchedule(key);
        }

        this._storage.clear();
    }
};

/**
 * Helper class to handle KeybindingManager's methods (/usr/share/cinnamon/js/ui/keybindings.js).
 *
 * I have two main reasons to implement this class.
 *     1. To avoid repeated code across xlets.
 *     2. To remove key bindings "blindly" and in "bulk" without specifying a key binding name.
 *
 * @param {String} aBaseName - A prefix for keybinding names.
 *
 * @type {Class}
 */
var KeybindingsManager = class KeybindingsManager {
    constructor(aBaseName) {
        this._base_name = aBaseName;
        this._storage = new Set();
    }

    /**
     * Add a key binding.
     *
     * @param {String}   aName     - The key binding name.
     * @param {String}   aValue    - The key binding value.
     * @param {Function} aCallback - Function to call when the key binding is triggered.
     *
     * @return {Boolean} If the key binding was registered.
     */
    addKeybinding(aName, aValue, aCallback) {
        const name = `${this._base_name}-${aName}`;

        if (this._storage.has(name)) {
            Main.keybindingManager.removeHotKey(name);
        }

        if (isBlank(aValue) || aValue === "::") {
            return false;
        }

        this._storage.add(name);

        return Main.keybindingManager.addHotKey(
            name,
            aValue,
            aCallback
        );
    }

    /**
     * Remove a key binding.
     *
     * @param {String} aName - The key binding name.
     */
    removeKeybinding(aName) {
        const name = `${this._base_name}-${aName}`;
        this._storage.delete(name);
        Main.keybindingManager.removeHotKey(name);
    }

    /**
     * Clear all registered key bindings.
     */
    clearAllKeybindings() {
        if (this._storage.size) {
            for (const name of this._storage) {
                Main.keybindingManager.removeHotKey(name);
            }

            this._storage.clear();
        }
    }
};

/**
 * Functions injections manager.
 *
 * Helper class to assist with functions injections/overrides.
 *
 * @type {Class}
 */
var InjectionsManager = class InjectionsManager {
    constructor() {
        this._storage = new Map();
    }

    /**
     * Override a method.
     *
     * @param {Object} aParent     - The parent object the aMethodName belongs to.
     * @param {String} aMethodName - The name of aParent's method.
     * @param {Object} aNewFunc    - A function to override the original method with.
     */
    overrideMethod(aParent, aMethodName, aNewFunc) {
        this._store_original(aParent, aMethodName);

        aParent[aMethodName] = function() {
            return aNewFunc.apply(this, arguments);
        };
    }

    /**
     * Inject method after original method.
     *
     * @param {Object} aParent     - The parent object the aMethodName belongs to.
     * @param {String} aMethodName - The name of aParent's method.
     * @param {Object} aNewFunc    - A function to inject into the original method.
     */
    injectMethodAfter(aParent, aMethodName, aNewFunc) {
        const original = this._store_original(aParent, aMethodName, true);

        aParent[aMethodName] = function() {
            let ret;
            ret = original.apply(this, arguments);

            if (ret === undefined) {
                ret = aNewFunc.apply(this, arguments);
            }

            return ret;
        };
    }

    /**
     * Inject method before original.
     *
     * @param {Object} aParent     - The parent object the aMethodName belongs to.
     * @param {String} aMethodName - The name of aParent's method.
     * @param {Object} aNewFunc    - A function to inject into the original method.
     */
    injectMethodBefore(aParent, aMethodName, aNewFunc) {
        const original = this._store_original(aParent, aMethodName, true);

        aParent[aMethodName] = function() {
            let ret;
            ret = aNewFunc.apply(this, arguments);

            if (ret === undefined) {
                ret = original.apply(this, arguments);
            }

            return ret;
        };
    }

    /**
     * See _restore_original.
     */
    restore() {
        this._restore_original.apply(null, arguments);
    }

    /**
     * Restore all methods injected/overwritten in all parents.
     */
    restoreAll() {
        tryFn(() => {
            for (const [parent, methods] of this._storage) {
                for (const method of methods.keys()) {
                    this._restore_original(parent, method);
                }
            }
        }, (aErr) => {
            global.logError(aErr);
        }, () => {
            this._storage.clear();
        });
    }

    /**
     * Store original method.
     *
     * @param {Object}  aParent       - The parent object the aMethodName belongs to.
     * @param {String}  aMethodName   - The name of aParent's method.
     * @param {Boolean} aReturnOrigin - If the original function should be returned.
     *
     * @return {Object} The original function to store for later restoration.
     */
    _store_original(aParent, aMethodName, aReturnOrigin = false) {
        if (!this._storage.has(aParent)) {
            this._storage.set(aParent, new Map());
        }

        this._storage.get(aParent).set(aMethodName, aParent[aMethodName]);

        if (aReturnOrigin) {
            return aParent[aMethodName];
        }
    }

    /**
     * Restore an specific method injected/overwritten in a parent.
     *
     * @param {Object} aParent     - The parent object the aMethodName belongs to.
     * @param {String} aMethodName - The name of aParent's method.
     */
    _restore_original(aParent, aMethodName) {
        if (this._storage.has(aParent) && this._storage.get(aParent).has(aMethodName)) {
            const storedParent = this._storage.get(aParent);
            aParent[aMethodName] = storedParent.get(aMethodName);
            storedParent.delete(aMethodName);

            if (storedParent.size === 0) {
                this._storage.delete(aParent);
            }
        }
    }
};

/**
 * Return the localized translation of a string, based on the xlet domain or
 * the current global domain (Cinnamon's).
 *
 * This function "overrides" the _() function globally defined by Cinnamon.
 *
 * @param {String} aStr - The string being translated.
 *
 * @return {String} The translated string.
 */
function _(aStr) {
    const customTrans = Gettext.dgettext(__meta.uuid, aStr);

    if (customTrans !== aStr && aStr !== "") {
        return customTrans;
    }

    return Gettext.gettext(aStr);
}

/**
 * Return the localized translation of a string, based on the xlet domain or the
 * current global domain (Cinnamon's), but consider plural forms. If a translation
 * is found, apply the plural formula to aN, and return the resulting message
 * (some languages have more than two plural forms). If no translation is found,
 * return singular if aN is 1; return plural otherwise.
 *
 * This function "overrides" the ngettext() function globally defined by Cinnamon.
 *
 * @param {String}  aSingular - The singular string being translated.
 * @param {String}  aPlural   - The plural string being translated.
 * @param {Integer} aN        - The number (e.g. item count) to determine the translation for
 * the respective grammatical number.
 *
 * @return {String} The translated string.
 */
function ngettext(aSingular, aPlural, aN) {
    const customTrans = Gettext.dngettext(__meta.uuid, aSingular, aPlural, aN);

    if (aN === 1) {
        if (customTrans !== aSingular) {
            return customTrans;
        }
    } else {
        if (customTrans !== aPlural) {
            return customTrans;
        }
    }

    return Gettext.ngettext(aSingular, aPlural, aN);
}

/**
 * Check if a string is empty.
 *
 * @param {String} aStr - String to check.
 *
 * @return {Boolean} If the string is empty.
 */
function isBlank(aStr) {
    return (!aStr || !String(aStr).trim());
}

/**
 * Execute the xdg-open command with the passed arguments.
 */
function xdgOpen() {
    Util.spawn_async(["xdg-open", ...arguments], null);
}

/**
 * Launch the default application registered to handle the specified URI.
 *
 * @param {String} aURI                - The URI to launch.
 * @param {Object} aParams             - Parameters.
 * @param {Object} aParams.context     - An optional Gio.AppLaunchContext.
 *                                       Default: null
 * @param {Object} aParams.cancellable - A Gio.Cancellable object.
 *                                       Default: null
 *
 * @return {Promise} A Promise.
 */
function launchDefaultForUriAsync(aURI, aParams = {}) {
    return new Promise((aResolve, aReject) => {
        const params = Params.parse(aParams, LaunchURIParams);

        Gio.AppInfo.launch_default_for_uri_async(
            aURI,
            params.context,
            params.cancellable,
            (aSource, aResult) => {
                tryFn(() => {
                    Gio.AppInfo.launch_default_for_uri_finish(aResult) && aResolve();
                }, (aErr) => aReject(aErr));
            }
        );
    });
}

/**
 * Launch the default application registered to handle the specified URI.
 *
 * This function uses the launchDefaultForUriAsync function but performs some "URI manipulations"
 * before attempting to open an URI.
 *
 * @param {String}  aURI      - The URI to launch.
 * @param {Boolean} aFallback - If the URI couldn't be launched, use Nemo's Open with dialog.
 *                              Default: false
 */
function launchUri(aURI, aFallback = true) {
    if (isBlank(aURI)) {
        return;
    }

    aURI = expandPath(aURI);

    if (aURI.startsWith("/")) {
        aURI = `file://${aURI}/`;
    }

    launchDefaultForUriAsync(aURI).catch((aErr) => {
        aFallback ?
            Util.spawnCommandLine(`nemo-open-with "${aURI}"`) :
            global.logError(aErr);
    });
}

/**
 * Get the version number of the GLib library.
 *
 * NOTE: I have stumbled upon GLib methods that work differently across GLib versions or
 * that exist only on specific GLib versions. I don't currently use any of such annoying
 * methods, but I will keep this function for possible future problems.
 *
 * @return {String}  The GLib library version.
 */
function getGLibVersion() {
    return "%s.%s.%s".format(GLib.MAJOR_VERSION, GLib.MINOR_VERSION, GLib.MICRO_VERSION);
}

/**
 * Get keybinding display name.
 *
 * The display name of a keybinding widget is different from the keybinding used programmatically.
 * This function allows to convert the programmatic name into the display name.
 *
 * @param {String} aAccelString - The programmatic name of a keybinding.
 *
 * @return {String} The display name of a keybinding.
 */
function getKeybindingDisplayName(aAccelString) {
    if (aAccelString) {
        const [key, codes, mods] = Gtk.accelerator_parse_with_keycode(aAccelString);

        if (codes !== null && codes.length > 0) {
            aAccelString = Gtk.accelerator_get_label_with_keycode(null, key, codes[0], mods);
        }
    }

    return aAccelString;
}

/**
 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
 *
 * This function was born in http://stackoverflow.com/a/6832721.
 *
 * @param {String} aV1                     - The first version to be compared.
 * @param {String} aV2                     - The second version to be compared.
 * @param {Object} aParams                 - Optional flags that affect comparison behavior:
 * @param {Object} aParams.lexicographical - If true, compares each part of the version strings
 *                                           lexicographically instead of naturally; this allows suffixes
 *                                           such as "b" or "dev" but will cause "1.10" to be considered smaller than "1.2".
 * @param {Object} aParams.zeroExtend      - If true, changes the result if one version string has
 *                                           less parts than the other. In this case the shorter string
 *                                           will be padded with "zero" parts instead of being considered smaller.
 *
 * @return {Number|NaN}
 *         - 0 if the versions are equal.
 *         - A negative integer if v1 < v2.
 *         - A positive integer if v1 > v2.
 *         - NaN if either version string is in the wrong format.
 *
 * @copyright by Jon Papaioannou (["john", "papaioannou"].join(".") + "@gmail.com")
 * @license This function is in the public domain. Do what you want with it, no strings attached.
 */
function versionCompare(aV1, aV2, aParams = {
    lexicographical: false,
    zeroExtend: false
}) {
    aV1 = String(aV1);
    aV2 = String(aV2);
    const lexicographical = aParams.lexicographical,
        zeroExtend = aParams.zeroExtend;
    let v1parts = aV1.split("."),
        v2parts = aV2.split(".");

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) {
            v1parts.push("0");
        }
        while (v2parts.length < v1parts.length) {
            v2parts.push("0");
        }
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (let i = 0; i < v1parts.length; ++i) {
        if (v2parts.length === i) {
            return 1;
        }

        if (v1parts[i] === v2parts[i]) {
            continue;
        } else if (v1parts[i] > v2parts[i]) {
            return 1;
        } else {
            return -1;
        }
    }

    if (v1parts.length !== v2parts.length) {
        return -1;
    }

    return 0;
}

/**
 * Check versions.
 *
 * This function is a proxy to the versionCompare function to allow a more "natural" usage.
 *
 * Examples
 * --------
 *
 * check_version("3.0", ">=", "2.0") // Is version 3.0 greater or equal to 2.0?
 *
 * @param {String} aV1     - The first version to be compared.
 * @param {String} aOp     - The comparison operator.
 * @param {String} aV2     - The second version to be compared.
 * @param {Object} aParams - See versionCompare aParams.
 *
 * @return {Boolean} The result of the comparison.
 */
function check_version(aV1, aOp, aV2, aParams = {}) {
    if (!(aOp in ComparisonOperators)) {
        throw new ReferenceError("Allowed operators are: " + Object.keys(ComparisonOperators).join(", "));
    }

    return ComparisonOperators[aOp](versionCompare(aV1, aV2, aParams), 0);
}

/**
 * Escape HTML entities.
 *
 * NOTE: Keep this function here; do not move to stringUtils.js module.
 *
 * @param {String} aStr - The string to escape.
 *
 * @return {String} The escaped string.
 */
function escapeHTML(aStr) {
    return String(aStr)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/**
 * Tokens replacer.
 *
 * @param {String} aData         - The string where to search and replace tokens.
 * @param {Object} aReplacements - The replacement data. Each key represents a token and their values the data with which to replace the tokens.
 *
 * @return {String} The string with all tokens replaced.
 */
function tokensReplacer(aData, aReplacements) {
    for (const token in aReplacements) {
        aData = aData.split(token).join(aReplacements[token]);
    }

    return aData;
}

/**
 * Source: https://stackoverflow.com/a/34749873
 *
 * @param {Object} aItem - The object to check.
 *
 * @return {Boolean} Whether aItem is an object.
 */
function isObject(aItem) {
    return (aItem && typeof aItem === "object" && !Array.isArray(aItem));
}

/**
 * Deep merge objects.
 *
 * Merges objects recursively merging properties that are objects and overriding
 * everything else.
 * Source: https://stackoverflow.com/a/16178864
 *
 * NOTE: The passed objects should be copies of the original objects to avoid infinite loops.
 * For now, I'm using the JSON.parse(JSON.stringify(object)) trick until I can use
 * Object.assign({}, object).
 *
 * NOTE: When it is time to use Object.assign(), make sure that functions are stripped.
 * Otherwise, keep using the JSON trick.
 *
 * @return {Object} A new object with all the passed objects merged.
 */
function deepMergeObjects() {
    let dst = {},
        src,
        p,
        args = [].splice.call(arguments, 0);

    while (args.length > 0) {
        src = args.splice(0, 1)[0];
        if (isObject(src)) {
            for (p in src) {
                if (src.hasOwnProperty(p)) {
                    if (isObject(src[p])) {
                        dst[p] = deepMergeObjects(dst[p] || {}, src[p]);
                    } else {
                        dst[p] = src[p];
                    }
                }
            }
        }
    }

    return dst;
}

/**
 * Copy to clipboard.
 *
 * @param {String} aText - The string to copy.
 */
function copyToClipboard(aText) {
    St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, aText);
}

/**
 * Paste from clipboard.
 *
 * @param {Function} aCallback - Function to call to make use of the stored text.
 */
function pasteFromClipboard(aCallback) {
    St.Clipboard.get_default().get_text(St.ClipboardType.CLIPBOARD, (aClipboard, aText) => {
        aCallback(aClipboard, aText);
    });
}

/**
 * Check if something is a primitive data type.
 *
 * @param {Any} aVal - The data to check.
 *
 * @return {Boolean} If the data is a primitive data type.
 */
function isPrimitive(aVal) {
    return aVal === null || !(typeof aVal === "object" || typeof aVal === "function");
}

/**
 * Expand a starting tilde in a path into the user's home directory.
 *
 * @param {String} aPath - The path to expand.
 *
 * @return {String} The expanded path.
 */
function expandPath(aPath) {
    return aPath.replace(/^\~/, USER_HOME);
}

/**
 * try/catch/finally wrapper.
 *
 * I redefined this function instead of using the one that is found at js/misc/util.js because
 * of strict mode warnings (function does not always return a value). And since it "costs nothing",
 * I implemented the finally block too.
 *
 * NOTE: Extracted from the original docstring (js/misc/util.js).
 * Try-catch can degrade performance in the function scope it is
 * called in. By using a wrapper for try-catch, the function scope is
 * reduced to the wrapper and not a potentially performance critical
 * function calling the wrapper. Use of try-catch in any form will
 * be slower than writing defensive code.
 *
 * @param {Function} aTryCB     - The function to wrap in a try-catch block.
 * @param {Function} aCatchCB   - The function to call on error.
 * @param {Function} aFinallyCB - The function to always call.
 *
 * @return {Any} The output of whichever callback gets called.
 */
function tryFn(aTryCB, aCatchCB, aFinallyCB) {
    try {
        return aTryCB();
    } catch (aErr) {
        if (typeof aCatchCB === "function") {
            return aCatchCB(aErr);
        }
    } finally {
        if (typeof aFinallyCB === "function") {
            return aFinallyCB();
        }
    }

    // NOTE: To shut the hell up warning!!!
    return undefined;
}

/**
 * An iterator function to iterate over arrays. Explicitly returning false will break iteration.
 *
 * Note about speed: I tested the performance of all kinds of iterations of array-like objects on
 * almost all existent engines.
 *
 * @param {Array}    aObj      - Array to be iterated.
 * @param {Function} aCallback - The function to call on every iteration. The arguments
 *                               passed to aCallback will be (Element, Index, Length).
 * @param {Boolean}  aReverse  - Whether to iterate in reverse.
 */
function arrayEach(aObj, aCallback, aReverse = false) {
    const iLen = aObj.length;

    if (aReverse) {
        for (let i = iLen - 1; i > -1; i--) {
            if (aCallback.call(null, aObj[i], i, iLen) === false) {
                break;
            }
        }
    } else {
        let i = 0;
        for (; i < iLen; i++) {
            if (aCallback.call(null, aObj[i], i, iLen) === false) {
                break;
            }
        }
    }
}

/**
 * An iterator function to iterate over objects. Explicitly returning false will break iteration.
 *
 * @param  {Object}   aObj      - Object to be iterated.
 * @param  {Function} aCallback - The function to call on every iteration. The arguments passed
 *                                to aCallback will be (Key, Value, Index, Length).
 */
function objectEach(aObj, aCallback) {
    const keys = Object.keys(aObj);
    const iLen = keys.length;
    let i = 0;
    for (; i < iLen; i++) {
        const key = keys[i];
        if (aCallback.call(null, key, aObj[key], i, iLen) === false) {
            break;
        }
    }
}

/* exported _,
            isPrimitive,
            CINNAMON_VERSION,
            USER_DESKTOP_PATH,
            CINNAMON_CONFIG_FOLDER,
            CINNAMON_STANDARD_CONFIG_FOLDER,
            ngettext,
            isBlank,
            xdgOpen,
            launchDefaultForUriAsync,
            launchUri,
            getGLibVersion,
            getKeybindingDisplayName,
            versionCompare,
            check_version,
            escapeHTML,
            tokensReplacer,
            deepMergeObjects,
            copyToClipboard,
            pasteFromClipboard,
            ScheduleManager,
            KeybindingsManager,
            InjectionsManager,
            tryFn,
            arrayEach,
            objectEach
 */
