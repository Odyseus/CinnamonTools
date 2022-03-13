(function(window, document) {
    // NOTE: Workaround implemented due to the mediocrity without limits
    // of all web developers that ever existed.
    const noScriptBlock = document.getElementById("no-js-main");

    if (noScriptBlock) {
        noScriptBlock.style.display = "none";
    }

    // NOTE: Start localizations handler.
    const localizationSelector = document.getElementById("localization-switch");
    const localizationContent = document.getElementsByClassName("localization-content");
    const navXletHelp = document.getElementById("nav-xlet-help");
    const navXletContributors = document.getElementById("nav-xlet-contributors");
    const navXletChangelog = document.getElementById("nav-xlet-changelogs");

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
        let optExists = false,
            optionsLength = aSelect.length;

        while (optionsLength--) {
            if (aSelect.options[optionsLength].value === aValue) {
                optExists = true;
                break;
            }
        }
        return optExists;
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
        const language = aE ? aE.currentTarget.value : getFromStorage();
        const validLanguage = optionExists(language, localizationSelector);

        // If there is no localizationSelector, the page build must have gone very wrong.
        if (!localizationSelector) {
            return;
        }

        // event is null on page load.
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
            let i = 0,
                iLen = localizationContent.length;
            for (; i < iLen; i++) {
                localizationContent[i].setAttribute("hidden", true);
            }

            const option = localizationSelector.options[localizationSelector.selectedIndex];

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
    // NOTE: End localizations handler.

    // NOTE: Start collapsible containers handler.
    const coll = document.getElementsByClassName("collapsible");

    let i = 0,
        iLen = coll.length;
    for (; i < iLen; i++) {
        coll[i].addEventListener("click", function() {
            const content = this.nextElementSibling;

            if (content.style.display === "block") {
                content.style.display = "none";
                this.classList.remove("active");
            } else {
                content.style.display = "block";
                this.classList.add("active");
            }
        });
    }
    // NOTE: End collapsible containers handler.

    // NOTE: Start smooth scroll.
    // Source: https://github.com/julienetie/smooth-scroll
    const prefixes = ["moz", "webkit", "o"],
        stickyNavbarOffset = getElementOuterHeight(
            document.getElementById("main-navbar"), true);
    let animationFrame;

    function getElementOuterHeight(aEl, aIncludeMargin = false) {
        let height = aEl.offsetHeight;

        if (aIncludeMargin) {
            let style = getComputedStyle(aEl);
            height += parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10);
        }

        return height;
    }

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

        let yOffset = el.offsetTop;

        yOffset += getOffsetTop(el.offsetParent);

        return yOffset;
    }

    function getScrollTop(scrollable) {
        return scrollable.scrollTop || document.body.scrollTop || document.documentElement.scrollTop;
    }

    function scrollTo(scrollable, coords, millisecondsToTake) {
        const currentY = getScrollTop(scrollable),
            diffY = coords.y - currentY;
        let startTimestamp = null;

        if (coords.y === currentY || typeof scrollable.scrollTo !== "function") {
            return;
        }

        function doScroll(currentTimestamp) {
            if (startTimestamp === null) {
                startTimestamp = currentTimestamp;
            }

            const progress = currentTimestamp - startTimestamp,
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

    // Declare scroll duration, (before script)
    const speed = window.smoothScrollSpeed || 750;

    function smoothScroll(aE) { // no smooth scroll class to ignore links
        if (aE.target.classList.contains("no-smooth-scroll")) {
            return;
        }

        const source = aE.target;
        let targetHref = source.hash,
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
    // NOTE: End smooth scroll.
}(window, document));

/* jshint browser: true */
