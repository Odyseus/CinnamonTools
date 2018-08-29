/*
exported toggleLocalizationVisibility
 */

/* jshint varstmt: false */

// Source: https://github.com/julienetie/smooth-scroll
(function(window, document) {
    var prefixes = ["moz", "webkit", "o"],
        stickyNavbarOffset = 50,
        animationFrame;

    // Modern rAF prefixing without setTimeout
    function requestAnimationFrameNative() {
        prefixes.map(function(prefix) {
            if (!window.requestAnimationFrame) {
                animationFrame = window[prefix + "RequestAnimationFrame"];
            } else {
                animationFrame = requestAnimationFrame;
            }
        });
    }
    requestAnimationFrameNative();

    function getOffsetTop(el) {
        if (!el) {
            // Account for the sticky navbar height.
            return -stickyNavbarOffset;
        }

        var yOffset = el.offsetTop,
            parent = el.offsetParent;

        yOffset += getOffsetTop(parent);

        return yOffset;
    }

    function getScrollTop(scrollable) {
        return scrollable.scrollTop || document.body.scrollTop || document.documentElement.scrollTop;
    }

    function scrollTo(scrollable, coords, millisecondsToTake) {
        var currentY = getScrollTop(scrollable),
            diffY = coords.y - currentY,
            startTimestamp = null;

        if (coords.y === currentY || typeof scrollable.scrollTo !== "function") {
            return;
        }

        function doScroll(currentTimestamp) {
            if (startTimestamp === null) {
                startTimestamp = currentTimestamp;
            }

            var progress = currentTimestamp - startTimestamp,
                fractionDone = (progress / millisecondsToTake),
                pointOnSineWave = Math.sin(fractionDone * Math.PI / 2);
            scrollable.scrollTo(0, currentY + (diffY * pointOnSineWave));

            if (progress < millisecondsToTake) {
                animationFrame(doScroll);
            } else {
                // Ensure we're at our destination
                scrollable.scrollTo(coords.x, coords.y);
            }
        }

        animationFrame(doScroll);
    }

    // Declaire scroll duration, (before script)
    var speed = window.smoothScrollSpeed || 750;

    function smoothScroll(e) { // no smooth scroll class to ignore links
        if (e.target.classList.contains("no-smooth-scroll")) {
            return;
        }

        var source = e.target,
            targetHref = source.hash,
            target = null;

        if (!source || !targetHref) {
            return;
        }

        targetHref = targetHref.substring(1);
        target = document.getElementById(targetHref);

        if (!target) {
            return;
        }

        scrollTo(window, {
            x: 0,
            y: getOffsetTop(target)
        }, speed);
    }

    // Uses target's hash for scroll
    document.addEventListener("click", smoothScroll, false);
}(window, document));

if (!window.localStorage) {
    /*
    Storage objects are a recent addition to the standard. As such they may not be present
    in all browsers. You can work around this by inserting one of the following two codes at
    the beginning of your scripts, allowing use of localStorage object in implementations which
    do not natively support it.

    This algorithm is an exact imitation of the localStorage object, but makes use of cookies.

    Source: https://developer.mozilla.org/en-US/docs/Web/API/Storage/LocalStorage
     */
    Object.defineProperty(window, "localStorage", new(function() { // jshint ignore:line
        var aKeys = [],
            oStorage = {};
        Object.defineProperty(oStorage, "getItem", {
            value: function(sKey) {
                return sKey ? this[sKey] : null;
            },
            writable: false,
            configurable: false,
            enumerable: false
        });
        Object.defineProperty(oStorage, "key", {
            value: function(nKeyId) {
                return aKeys[nKeyId];
            },
            writable: false,
            configurable: false,
            enumerable: false
        });
        Object.defineProperty(oStorage, "setItem", {
            value: function(sKey, sValue) {
                if (!sKey) {
                    return;
                }
                document.cookie = escape(sKey) + "=" + escape(sValue) +
                    "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
            },
            writable: false,
            configurable: false,
            enumerable: false
        });
        Object.defineProperty(oStorage, "length", {
            get: function() {
                return aKeys.length;
            },
            configurable: false,
            enumerable: false
        });
        Object.defineProperty(oStorage, "removeItem", {
            value: function(sKey) {
                if (!sKey) {
                    return;
                }
                document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
            },
            writable: false,
            configurable: false,
            enumerable: false
        });
        this.get = function() {
            var iThisIndx;
            for (var sKey in oStorage) {
                iThisIndx = aKeys.indexOf(sKey);
                if (iThisIndx === -1) {
                    oStorage.setItem(sKey, oStorage[sKey]);
                } else {
                    aKeys.splice(iThisIndx, 1);
                }
                delete oStorage[sKey];
            }
            for (aKeys; aKeys.length > 0; aKeys.splice(0, 1)) {
                oStorage.removeItem(aKeys[0]);
            }
            for (var aCouple, iKey, nIdx = 0, aCouples = document.cookie.split(/\s*;\s*/); nIdx < aCouples.length; nIdx++) {
                aCouple = aCouples[nIdx].split(/\s*=\s*/);
                if (aCouple.length > 1) {
                    oStorage[iKey = unescape(aCouple[0])] = unescape(aCouple[1]);
                    aKeys.push(iKey);
                }
            }
            return oStorage;
        };
        this.configurable = false;
        this.enumerable = true;
    })());
}

/**
 * Return if a particular option exists in a <select> object
 * @param {String} aValue A string representing the option you are looking for
 * @param {Object} aSelect A Select object
 *
 * Usage:
 *
 * optionExists('searchedOption', document.getElementById('myselect'));
 *
 * Source: https://stackoverflow.com/a/17166899
 */
function optionExists(aValue, aSelect) {
    var optionExists = false,
        optionsLength = aSelect.length;

    while (optionsLength--) {
        if (aSelect.options[optionsLength].value === aValue) {
            optionExists = true;
            break;
        }
    }
    return optionExists;
}

function toggleLocalizationVisibility(aValue) {
    // Store the language passed to the function or retrieve it from localStorage (or cookie).
    var language = aValue ? aValue : localStorage.getItem("cinnamon_tools_help_language");
    var selector = document.getElementById("localization-switch");
    var validLanguage = optionExists(language, selector);

    // If there is no selector, the page build must have gone very wrong.
    if (!selector) {
        return;
    }

    // aValue is null on page load.
    if (aValue === null) {
        /*
         If there is no language is because localStorage (or cookies) is disabled.
         If a user reloads a help page when another language other than English is shown:
         - With localStorage (or cookies) allowed: The currently selected language will stay selected.
         - With localStorage (or cookies) NOT allowed: The help page will be switched to English.
         */
        // Set the chosen (or retrieved from localStorage (or a cookie)) language,
        // but only if the language is also an element of the language selector...
        if (language && validLanguage) {
            selector.value = language;
        } else { // ...or default to English.
            selector.value = "en";
        }
    }

    try {
        // Hide all sections.
        Array.prototype.slice.call(document.getElementsByClassName("localization-content"))
            .forEach(function(aEl) {
                // aEl && aEl.classList.add("hidden");
                aEl && aEl.setAttribute("hidden", true);
            });

        var option = selector.options[selector.selectedIndex];
        var navXletHelp = document.getElementById("nav-xlet-help");
        var navXletContributors = document.getElementById("nav-xlet-contributors");
        var navXletChangelog = document.getElementById("nav-xlet-changelog");

        if (option) {
            // Set localized navigation bar labels.
            if (navXletHelp) {
                navXletHelp.innerText = option.getAttribute("data-xlet-help");
            }

            if (navXletContributors) {
                navXletContributors.innerText = option.getAttribute("data-xlet-contributors");
            }

            if (navXletChangelog) {
                navXletChangelog.innerText = option.getAttribute("data-xlet-changelog");
            }

            // Set localized page title.
            document.title = option.getAttribute("data-title");
        }
    } finally {
        if (language && validLanguage) {
            // If there is language and it's also an element of the language selector,
            // use it to unhide the respective section...
            document.getElementById(language).removeAttribute("hidden");
            // document.getElementById(language).classList.remove("hidden");
            // ...and save it into localStorage (or a cookie).
            localStorage.setItem("cinnamon_tools_help_language", language);
        } else {
            // If there is no language, unhide the English section and move on.
            document.getElementById("en").removeAttribute("hidden");
            // document.getElementById("en").classList.remove("hidden");
        }
    }
}
