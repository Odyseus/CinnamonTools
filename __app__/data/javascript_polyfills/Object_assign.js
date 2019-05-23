/* Object.assign polyfill.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 *
 * This polyfill doesn't support symbol properties, since ES5 doesn't have symbols anyway.
 *
 * [About MDN](https://developer.mozilla.org/en-US/docs/MDN/About)
 * by [Mozilla Contributors](https://developer.mozilla.org/en-US/docs/MDN/About$history)
 * is licensed under [CC-BY-SA 2.5](http://creativecommons.org/licenses/by-sa/2.5/).
 */
if (typeof Object.assign !== "function") {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
        value: function assign(target, varArgs) { // jshint ignore:line
            if (target == null) { // TypeError if undefined or null
                throw new TypeError("Cannot convert undefined or null to object!");
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];

                if (nextSource != null) { // Skip over if undefined or null
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        },
        writable: true,
        configurable: true
    });
}
