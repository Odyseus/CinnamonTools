/* ES6 String.prototype.includes polyfill
 * https://github.com/mathiasbynens/String.prototype.includes
 *
 * The MIT License (MIT)
 * Copyright (c) Mathias Bynens <https://mathiasbynens.be/>
 */
if (typeof String.prototype.includes !== "function") {
    (function() {
        // needed to support `apply`/`call` with `undefined`/`null`
        "use strict"; // jshint ignore:line

        var toString = {}.toString;
        var indexOf = "".indexOf;
        var includes = function(search) {
            if (this == null) {
                throw TypeError();
            }
            var string = String(this);
            if (search && toString.call(search) == "[object RegExp]") {
                throw TypeError();
            }
            var stringLength = string.length;
            var searchString = String(search);
            var searchLength = searchString.length;
            var position = arguments.length > 1 ? arguments[1] : undefined;
            // `ToInteger`
            var pos = position ? Number(position) : 0;
            if (pos != pos) { // better `isNaN`
                pos = 0;
            }
            var start = Math.min(Math.max(pos, 0), stringLength);
            // Avoid the `indexOf` call if no match is possible
            if (searchLength + start > stringLength) {
                return false;
            }
            return indexOf.call(string, searchString, pos) != -1;
        };

        Object.defineProperty(String.prototype, "includes", {
            value: includes,
            configurable: true,
            writable: true
        });
    }());
}
