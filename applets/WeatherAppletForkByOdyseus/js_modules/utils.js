const GlobalUtils = require("js_modules/globalUtils.js");

const {
    gi: {
        Soup
    },
    misc: {
        params: Params
    },
    ui: {
        popupMenu: PopupMenu,
        tweener: Tweener
    }
} = imports;

const {
    ErrorMessages,
    KnownStatusCodes,
    OrnamentType,
    Placeholders,
    WeatherProviderNames
} = require("js_modules/constants.js");

const {
    _,
    isBlank,
    escapeHTML,
    launchUri
} = GlobalUtils;

const {
    CustomNotification
} = require("js_modules/notificationsUtils.js");

const {
    tryFn
} = GlobalUtils;

const {
    DebugManager
} = require("js_modules/debugManager.js");

var Debugger = new DebugManager(`org.cinnamon.applets.${__meta.uuid}`);

Debugger.wrapObjectMethods({
    CustomNotification: CustomNotification
});

var Notification = new CustomNotification({
    title: escapeHTML(_(__meta.name)),
    default_buttons: [{
        action: "dialog-information",
        label: escapeHTML(_("Help"))
    }],
    action_invoked_callback: (aSource, aAction) => {
        switch (aAction) {
            case "dialog-information":
                launchUri(`${__meta.path}/HELP.html`);
                break;
        }
    }
});

/**
 * [WeatherProviderBase description]
 *
 *
 *
 * @param  {[type]} aApplet [description]
 * @param  {[type]} aParams [description]
 */
var WeatherProviderBase = class WeatherProviderBase {
    constructor(aApplet, aParams) {
        this._error = null;
        this.locationInfo = [];
        this._method_1 = "GET";
        this._method_2 = "GET";
        this._headers_1 = {};
        this._headers_2 = {};
        this._query_url_1 = "";
        this._query_url_2 = "";
        this._weather_details_url = "%s";
        this._twoHTTPRequests = false;

        this.applet = aApplet;

        const params = Params.parse(aParams, {
            providerName: "",
            providerID: "",
            website: "",
            locationID: "",
            locationName: "",
            languageID: "",
            forecastDays: 10,
            forecastRowsCols: 1,
            maxForecastsSupport: 10,
            tempUnit: "",
            pressureUnit: "",
            windSpeedUnit: "",
            distanceUnit: ""
        });

        this.uuid = params.locationID + ":" + params.providerID;

        for (const prop in params) {
            this[prop] = params[prop];
        }
    }

    _processLocationID() {
        /* NOTE: Remove ALL white spaces, not just trim() it.
         */
        const locationID = this.locationID.replace(/\s/g, "");
        let latitude = null,
            longitude = null,
            cityID = null;

        if (locationID.indexOf(",") !== -1) {
            [latitude, longitude] = locationID.split(",");
        } else {
            cityID = locationID;
        }

        return {
            latitude: latitude,
            longitude: longitude,
            cityID: cityID
        };
    }

    getWeatherData(aRefreshCallback) {
        if (this._twoHTTPRequests) {
            this._doubleHTTPRequest(aRefreshCallback);
        } else {
            this._singleHTTPRequest(aRefreshCallback);
        }
    }

    _singleHTTPRequest(aRefreshCallback) {
        const request = Soup.Message.new(this._method_1, this._query_url_1);

        if (this._headers_1) {
            for (const key in this._headers_1) {
                request.request_headers.append(key, this._headers_1[key]);
            }
        }

        this.applet._httpSession.queue_message(request,
            (aSession, aMessage) => {
                if (aMessage.status_code === Soup.KnownStatusCode.OK) {
                    tryFn(() => {
                        aRefreshCallback.call(this.applet,
                            this.parseWeatherData(aMessage.response_body.data));
                    }, (aErr) => {
                        global.logError("Error parsing data.");
                        global.logError("Response data:\n" + aMessage.response_body.data);
                        global.logError(aErr);
                        this._callBackWithError(aRefreshCallback,
                            ErrorMessages.FAILED_PARSING_WEATHER);
                    });
                } else {
                    this._callBackWithError(aRefreshCallback, aMessage);
                }
            }
        );
    }

    _doubleHTTPRequest(aRefreshCallback) {
        const request1 = Soup.Message.new(this._method_1, this._query_url_1);

        if (this._headers_1) {
            for (const key in this._headers_1) {
                request1.request_headers.append(key, this._headers_1[key]);
            }
        }

        this.applet._httpSession.queue_message(request1,
            (aSession1, aMessage1) => {
                if (aMessage1.status_code === Soup.KnownStatusCode.OK) {
                    const request2 = Soup.Message.new(this._method_2, this._query_url_2);

                    if (this._headers_2) {
                        for (const key in this._headers_2) {
                            request2.request_headers.append(key, this._headers_2[key]);
                        }
                    }

                    this.applet._httpSession.queue_message(request2,
                        (aSession2, aMessage2) => {
                            if (aMessage2.status_code === Soup.KnownStatusCode.OK) {
                                tryFn(() => {
                                    aRefreshCallback.call(this.applet, this.parseWeatherData(
                                        aMessage1.response_body.data,
                                        aMessage2.response_body.data
                                    ));
                                }, (aErr) => {
                                    global.logError("Error parsing data.");
                                    global.logError("Response data 1:\n" + aMessage1.response_body.data);
                                    global.logError("Response data 2:\n" + aMessage2.response_body.data);
                                    global.logError(aErr);
                                    this._callBackWithError(aRefreshCallback,
                                        ErrorMessages.FAILED_PARSING_WEATHER);

                                });
                            } else {
                                this._callBackWithError(aRefreshCallback, aMessage2);
                            }
                        });
                } else {
                    this._callBackWithError(aRefreshCallback, aMessage1);
                }
            }
        );
    }

    _callBackWithError(aRefreshCallback, aMessage) {
        if (typeof aMessage === "string") {
            aRefreshCallback.call(this.applet, {
                error: aMessage
            });
        } else if (aMessage instanceof Soup.Message) {
            aRefreshCallback.call(this.applet, {
                error: ErrorMessages.FAILED_RESPONSE.format(
                    (aMessage.status_code in KnownStatusCodes ?
                        KnownStatusCodes[aMessage.status_code] :
                        aMessage.status_code)
                )
            });

            global.logError("Status code: " + aMessage.status_code);
            global.logError("Response body data: " + aMessage.response_body.data);
        }
    }

    parseWeatherData(aRawResponseData) { // jshint ignore:line
        global.logError("Not implemented method: parseWeatherData");
        return null;
    }

    formatTime(aTime) {
        return isNaN(parseInt(aTime, 10)) ? Placeholders.ELLIPSIS : this._getTimeFromDate(aTime);
    }

    _compassDirection(deg) {
        if (deg === null) {
            return null;
        }

        const directions = [_("N"), _("NE"), _("E"), _("SE"), _("S"), _("SW"), _("W"), _("NW")];
        return directions[Math.round(deg / 45) % directions.length];
    }

    _getTimeFromDate(aSeconds) {
        const date = new Date(aSeconds * 1000);
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? "pm" : "am";
        hours = hours % 12 || 12;
        minutes = minutes < 10 ? "0" + minutes : minutes;

        return hours + ":" + minutes + " " + ampm;
    }

    _normalizeMinutes(aTimeStr) {
        if (isBlank(aTimeStr)) {
            return Placeholders.ELLIPSIS;
        }

        // verify expected time format
        const result = aTimeStr.match(/^\d{1,2}:(\d{1,2}) [ap]m$/);

        if (result !== null) {
            const minutes = result[1];
            // single-digit minutes values need normalizing (zero-padding)
            if (minutes.length < 2) {
                const timeSegments = aTimeStr.split(":");
                return timeSegments[0] + ":0" + timeSegments[1];
            }
        }

        return aTimeStr;
    }

    get weather_details_url() {
        return this._weather_details_url;
    }
};

var LocationSelectorMenuItem = class LocationSelectorMenuItem extends PopupMenu.PopupIndicatorMenuItem {
    constructor(aSubMenu, aLocationUUID, aLocationData) {
        const label = aLocationData.locationName + " - " +
            aLocationData.locationID + " - " +
            WeatherProviderNames[aLocationData.providerID];

        super(label, {
            // To avoid closing the applet menu when the sub menu is
            // closed after hovering/activating an item.
            focusOnHover: false
        });

        this.applet = aSubMenu.applet;
        this._subMenu = aSubMenu;
        this._locationUUID = aLocationUUID;
        this.setOrnament(OrnamentType.DOT);

        this._handler_id = this.connect("activate", () => {
            // This doesn't trigger the callback!!!!!
            this.applet.$._.current_location = this._locationUUID;
            this._subMenu.setCheckedState();
            this.applet._animateLocationSwitch("hide",
                () => {
                    this.applet.refreshAndRebuild(false, false);
                });
            return true; // Do not close menu when activating items.
        });

        this._ornament.child._delegate.setToggleState(
            this.applet.$._.current_location === this._locationUUID
        );
    }

    destroy() {
        this.disconnect(this._handler_id);
        super.destroy();
    }
};

var LocationSelectorMenu = class LocationSelectorMenu extends PopupMenu.PopupSubMenu {
    constructor(aApplet, aAnchorActor) {
        super(aAnchorActor);

        this.applet = aApplet;
        this._anchor = aAnchorActor;
        // Set a max. height so the applet menu doesn't look even more gigantic
        // when the locations selector sub-menu is opened.
        this.actor.set_style("max-height:250px;");
    }

    populateMenu() {
        this.removeAll();

        const locationsMap = this.applet.locationsMap;

        for (const [uuid, locationData] of locationsMap) {
            const item = new LocationSelectorMenuItem(this, uuid, locationData);
            this.addMenuItem(item);
        }

        if (!locationsMap.has(this.applet.$._.current_location)) {
            const msg = _("Displayed weather data doesn't belong to any currently configured location!");
            this.applet.displayErrorMessage(msg, "warning");
        }
    }

    setCheckedState() {
        const children = this._getMenuItems();
        let i = children.length;
        while (i--) {
            const item = children[i];
            if (item instanceof LocationSelectorMenuItem) { // Just in case
                item._ornament.child._delegate.setToggleState(
                    this.applet.$._.current_location === item._locationUUID
                );
            }
        }
    }

    open(animate) { // jshint ignore:line
        /* NOTE: Overwrite the default open method.
         * I force the height of this menu to 250px. Due to this restrain, the calculations
         * to decide if the menu needs to be animated are different than the one done
         * in the default method.
         */
        if (this.isOpen) {
            return;
        }

        this.isOpen = true;

        this.actor.show();

        const needsScrollbar = this._needsScrollbar();

        const [minHeight, naturalHeight] = this.actor.get_preferred_height(-1); // jshint ignore:line

        animate = animate && (naturalHeight < 250 || !needsScrollbar);
        // 1 === Gtk.PolicyType.AUTOMATIC
        // 2 === Gtk.PolicyType.NEVER
        this.actor.vscrollbar_policy = animate ? 2 : 1;

        if (animate) {
            this.actor.height = 0;
            Tweener.addTween(this.actor, {
                height: naturalHeight < 250 ? naturalHeight : 250,
                time: 0.25,
                onComplete: () => {
                    this.actor.set_height(-1);
                    this.emit("open-state-changed", true);
                }
            });
        } else {
            this.emit("open-state-changed", true);
        }
    }
};

// https://github.com/tingletech/moon-phase
// http://stackoverflow.com/questions/11759992/calculating-jdayjulian-day-in-javascript
// http://jsfiddle.net/gkyYJ/
// http://stackoverflow.com/users/965051/adeneo
Date.prototype.getJulianDate = function() { // jshint ignore:line
    return ((this / 86400000) - (this.getTimezoneOffset() / 1440) + 2440587.5);
};

// http://www.ben-daglish.net/moon.shtml
function moonDay(today) {
    const GetFrac = (fr) => {
        return (fr - Math.floor(fr));
    };
    const thisJD = today.getJulianDate();
    const year = today.getFullYear();
    const degToRad = 3.14159265 / 180;
    let K0,
        T,
        T2,
        T3,
        J0,
        F0,
        M0,
        M1,
        B1,
        oldJ;
    K0 = Math.floor((year - 1900) * 12.3685);
    T = (year - 1899.5) / 100;
    T2 = T * T;
    T3 = T * T * T;
    J0 = 2415020 + 29 * K0;
    F0 = 0.0001178 * T2 - 0.000000155 * T3 + (0.75933 + 0.53058868 * K0) - (0.000837 * T + 0.000335 * T2);
    M0 = 360 * (GetFrac(K0 * 0.08084821133)) + 359.2242 - 0.0000333 * T2 - 0.00000347 * T3;
    M1 = 360 * (GetFrac(K0 * 0.07171366128)) + 306.0253 + 0.0107306 * T2 + 0.00001236 * T3;
    B1 = 360 * (GetFrac(K0 * 0.08519585128)) + 21.2964 - (0.0016528 * T2) - (0.00000239 * T3);
    let phase = 0;
    let jday = 0;
    while (jday < thisJD) {
        let F = F0 + 1.530588 * phase;
        let M5 = (M0 + phase * 29.10535608) * degToRad;
        let M6 = (M1 + phase * 385.81691806) * degToRad;
        let B6 = (B1 + phase * 390.67050646) * degToRad;
        F -= 0.4068 * Math.sin(M6) + (0.1734 - 0.000393 * T) * Math.sin(M5);
        F += 0.0161 * Math.sin(2 * M6) + 0.0104 * Math.sin(2 * B6);
        F -= 0.0074 * Math.sin(M5 - M6) - 0.0051 * Math.sin(M5 + M6);
        F += 0.0021 * Math.sin(2 * M5) + 0.0010 * Math.sin(2 * B6 - M6);
        F += 0.5 / 1440;
        oldJ = jday;
        jday = J0 + 28 * phase + Math.floor(F);
        phase++;
    }

    // 29.53059 days per lunar month
    return (((thisJD - oldJ) / 29.53059));
}

function getMoonPhase() {
    const phase = moonDay(new Date());

    if (phase <= 0.0625 || phase > 0.9375) {
        return _("New Moon");
    } else if (phase <= 0.1875) {
        return _("Waxing Crescent");
    } else if (phase <= 0.3125) {
        return _("First Quarter");
    } else if (phase <= 0.4375) {
        return _("Waxing Gibbous");
    } else if (phase <= 0.5625) {
        return _("Full Moon");
    } else if (phase <= 0.6875) {
        return _("Waning Gibbous");
    } else if (phase <= 0.8125) {
        return _("Third Quarter");
    } else if (phase <= 0.9375) {
        return _("Waning Crescent");
    }

    return _("New Moon");
}

Debugger.wrapObjectMethods({
    LocationSelectorMenu: LocationSelectorMenu,
    LocationSelectorMenuItem: LocationSelectorMenuItem,
    WeatherProviderBase: WeatherProviderBase
});

/* exported soupPrinter,
            getMoonPhase,
            Notification
 */
