/**
 * Global utilities and constants to be used by all xlets.
 *
 * - Only include functions/classes that will be used by at least 2 or more xlets.
 * - If in the future the file gets too cluttered, or I have to add "heavy" classes
 *     with several core imports (from "gi" or "ui"), add them in separated modules;
 *     like I did with the other modules inside this folder (debugManager.js, customDialogs.js, etc.).
 * - Do not ever import other local modules inside this module nor in any of the other
 *     global modules.
 * - Only include constants that require an import (e.g. the CINNAMON_VERSION constant
 *     requires GLib). Other constants should go in globalConstants.js.
 */

let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui["{{XLET_SYSTEM}}"]["{{XLET_META}}"]["{{UUID}}"];
}

const {
    gettext: Gettext,
    gi: {
        Gtk,
        GLib
    },
    misc: {
        util: Util
    }
} = imports;

Gettext.bindtextdomain(XletMeta.uuid, GLib.get_home_dir() + "/.local/share/locale");

var CINNAMON_VERSION = GLib.getenv("CINNAMON_VERSION");

/**
 * An implementation of the escape/unescape JavaScript functions that are now deprecated.
 *
 * Why? Because sometimes un/escapeURI or un/escapeURIComponent aren't enough!!
 *
 * @type {Object}
 */
var escapeUnescapeReplacer = {
    escapeHash: {
        _: (input) => {
            let ret = escapeUnescapeReplacer.escapeHash[input];
            if (!ret) {
                if (input.length - 1) {
                    ret = String.fromCharCode(parseInt(input.substring(input.length - 3 ? 2 : 1), 16));
                } else {
                    let code = input.charCodeAt(0);
                    ret = code < 256 ? "%" + (0 + code.toString(16)).slice(-2).toUpperCase() : "%u" + ("000" + code.toString(16)).slice(-4).toUpperCase();
                }
                escapeUnescapeReplacer.escapeHash[ret] = input;
                escapeUnescapeReplacer.escapeHash[input] = ret;
            }
            return ret;
        }
    },

    escape: (aStr) => {
        return aStr.toString().replace(/[^\w @\*\-\+\.\/]/g, (aChar) => {
            return escapeUnescapeReplacer.escapeHash._(aChar);
        });
    },

    unescape: (aStr) => {
        return aStr.toString().replace(/%(u[\da-f]{4}|[\da-f]{2})/gi, (aSeq) => {
            return escapeUnescapeReplacer.escapeHash._(aSeq);
        });
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
    let customTrans = Gettext.dgettext(XletMeta.uuid, aStr);

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
    let customTrans = Gettext.dngettext(XletMeta.uuid, aSingular, aPlural, aN);

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

function isBlank(aStr) {
    return (!aStr || !String(aStr).trim());
}

/**
 * Execute the xdg-open command with the passed arguments.
 */
function xdgOpen() {
    Util.spawn_async(["xdg-open"].concat(Array.prototype.slice.call(arguments)), null);
}

/**
 * Get the version number of the GLib library.
 *
 * NOTE: I have stumbled upon GLib methods that work differently across GLib versions or
 * that exist only on specific GLib versions. I don't currently use any of such annoying
 * methods, but i will keep this function for possible future problems.
 *
 * @return {String}  The GLib library version.
 */
function getGLibVersion() {
    return "%s.%s.%s".format(GLib.MAJOR_VERSION, GLib.MINOR_VERSION, GLib.MICRO_VERSION);
}

/**
 * Get keybinding display name.
 *
 * The display name of a keybinding widget is different from the keybinding used programaticaly.
 * This function allows to convert the programatic name into the display name.
 *
 * @param {String} aAccelString - The programatic name of a keybinding.
 *
 * @return {String} The display name of a keybinding.
 */
function getKeybindingDisplayName(aAccelString) {
    if (aAccelString) {
        let [key, codes, mods] = Gtk.accelerator_parse_with_keycode(aAccelString);

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
 * @param {String} aV1                      - The first version to be compared.
 * @param {String} aV2                      - The second version to be compared.
 * @param {Object} aOptions                 - Optional flags that affect comparison behavior:
 * @param {Object} aOptions.lexicographical - If true, compares each part of the version strings
 *                                          lexicographically instead of naturally; this allows suffixes
 *                                          such as "b" or "dev" but will cause "1.10" to be considered smaller than "1.2".
 * @param {Object} aOptions.zeroExtend      - If true, changes the result if one version string has
 *                                          less parts than the other. In this case the shorter string
 *                                          will be padded with "zero" parts instead of being considered smaller.
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
function versionCompare(aV1, aV2, aOptions = {
    lexicographical: false,
    zeroExtend: false
}) {
    aV1 = String(aV1);
    aV2 = String(aV2);
    let lexicographical = aOptions.lexicographical,
        zeroExtend = aOptions.zeroExtend,
        v1parts = aV1.split("."),
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
 * Escape HTML entities.
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
    for (let token in aReplacements) {
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
 * Safely get values from an Object.
 *
 * So one doesn't have to use hasOwnProperty a gazillion times!!!!
 *
 * @return {Any/null} [description]
 */
function safeGet() {
    // All arguments passed to the function.
    let args = Array.prototype.slice.call(arguments);
    // Extract the first argument (the object).
    // After this point, args are all the keys to get
    // a value from the object.
    let obj = args.shift();
    let value = null;

    if (!isObject(obj)) {
        return null;
    }

    while (args.length) {
        let key = args.shift();

        if (isObject(obj) && obj.hasOwnProperty(key)) {
            value = obj = obj[key];
        } else {
            value = obj = null;
            break;
        }
    }

    return value;
}

/**
 * Override a method with a new method.
 *
 * @param {Object}   aParent - The object that contain the method to which to override.
 * @param {String}   aName   - The name of a method on aParent.
 * @param {Function} aFunc   - The function that will override the original function.
 */
function overrideMethod(aParent, aName, aNewFunc) {
    let origin = aParent[aName];
    aParent[aName] = function() {
        return aNewFunc.apply(this, arguments);
    };

    return origin;
}

/**
 * Inject code at the end of an existent method.
 *
 * @param {Object}   aParent - The object that contains the method to which to inject.
 * @param {String}   aName   - The name of a method on aParent.
 * @param {Function} aFunc   - The function that will be injected.
 */
function injectMethodAfter(aParent, aName, aFunc) {
    let origin = aParent[aName];
    aParent[aName] = function() {
        let ret;
        ret = origin.apply(this, arguments);

        if (ret === undefined) {
            ret = aFunc.apply(this, arguments);
        }

        return ret;
    };

    return origin;
}

/**
 * Inject code at the start of an existent method.
 *
 * @param {Object}   aParent - The object that contains the method to which to inject.
 * @param {String}   aName   - The name of a method on aParent.
 * @param {Function} aFunc   - The function that will be injected.
 */
function injectMethodBefore(aParent, aName, aFunc) {
    let origin = aParent[aName];
    aParent[aName] = function() {
        let ret;
        ret = aFunc.apply(this, arguments);

        if (ret === undefined) {
            ret = origin.apply(this, arguments);
        }

        return ret;
    };

    return origin;
}

/**
 * Remove injection from a prototype.
 *
 * @param {Object}      aObj        - The object from which to remove an injection or override.
 * @param {Object|null} aInjStorage  - The object where the original function is stored.
 * @param {String}      aMethodName - The name of a method on aObj.
 */
function removeInjection(aObj, aInjStorage, aMethodName) {
    /* NOTE: Only deal with existent injections.
     * Only delete aMethodName from aObj if aInjStorage is identical to null.
     * If the aInjStorage object exists but its aMethodName property is undefined,
     * it could have been caused by failing to inject/override the original method.
     * In which case, aObj[aMethodName] is already the original method.
     * If aObj[aMethodName] was a new method added to aObj, there is no need to call
     * removeInjection and neither would have been needed to call
     * overrideMethod/injectMethodAfter methods. Or so I thing so...
     */
    if (aObj && aInjStorage && aInjStorage.hasOwnProperty(aMethodName)) {
        aObj[aMethodName] = aInjStorage[aMethodName];
        delete aInjStorage[aMethodName];
    }
}

/**
 * See removeInjection.
 *
 * NOTE: It just bothered me to use the function called removeInjection to
 * remove what it is an override, not an injection.
 */
function removeOverride() {
    removeInjection.apply(null, arguments);
}

/* exported _,
            CINNAMON_VERSION,
            WARNING_CHARACTER,
            ELLIPSIS_CHARACTER,
            ngettext,
            isBlank,
            xdgOpen,
            getGLibVersion,
            getKeybindingDisplayName,
            versionCompare,
            escapeHTML,
            tokensReplacer,
            deepMergeObjects,
            safeGet,
            overrideMethod,
            injectMethodAfter,
            injectMethodBefore,
            removeInjection,
            removeOverride,
 */
