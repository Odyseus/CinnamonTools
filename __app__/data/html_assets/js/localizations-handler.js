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

    function smoothScroll(aE) { // no smooth scroll class to ignore links
        if (aE.target.classList.contains("no-smooth-scroll")) {
            return;
        }

        var source = aE.target,
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

    var localizationSelector = document.getElementById("localization-switch");
    var navXletHelp = document.getElementById("nav-xlet-help");
    var navXletContributors = document.getElementById("nav-xlet-contributors");
    var navXletChangelog = document.getElementById("nav-xlet-changelog");

    localizationSelector.addEventListener("change", toggleLocalizationVisibility, false);

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

    function saveToStorage(aLang) {
        if (!window.localStorage) {
            return;
        }

        localStorage.setItem("cinnamon_tools_help_language", aLang);
    }

    /**
     * Get preferences from window.localStorage.
     *
     * @return {Object} Preferences stored in window.localStorage or the defaults if window.localStorage is not available.
     */
    function getFromStorage() {
        if (!window.localStorage) {
            return "";
        }

        return localStorage.getItem("cinnamon_tools_help_language") || "";
    }

    function toggleLocalizationVisibility(aE) {
        // Store the language passed to the function or retrieve it from localStorage (or cookie).
        var language = aE ? aE.currentTarget.value : getFromStorage();
        var validLanguage = optionExists(language, localizationSelector);

        // If there is no localizationSelector, the page build must have gone very wrong.
        if (!localizationSelector) {
            return;
        }

        // aValue is null on page load.
        if (aE === null) {
            /*
             If there is no language is because localStorage is not available.
             If a user reloads a help page when another language other than English is shown:
             - With localStorage allowed: The currently selected language will stay selected.
             - With localStorage NOT allowed: The help page will be switched to English.
             */
            // Set the chosen (or retrieved from localStorage) language,
            // but only if the language is also an element of the language selector...
            if (language && validLanguage) {
                localizationSelector.value = language;
            } else { // ...or default to English.
                localizationSelector.value = "en";
            }
        }

        try {
            // Hide all sections.
            Array.prototype.slice.call(document.getElementsByClassName("localization-content"))
                .forEach(function(aEl) {
                    aEl && aEl.setAttribute("hidden", true);
                });

            var option = localizationSelector.options[localizationSelector.selectedIndex];

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
                // ...and save it into localStorage (or a cookie).
                saveToStorage(language);
            } else {
                // If there is no language, unhide the English section and move on.
                document.getElementById("en").removeAttribute("hidden");
            }
        }
    }

    toggleLocalizationVisibility(null);
}(window, document));

/* exported toggleLocalizationVisibility
 */

/* jshint varstmt: false */
