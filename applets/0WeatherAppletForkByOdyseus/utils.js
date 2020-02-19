//{{IMPORTER}}

var XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta["{{UUID}}"];
}

const GlobalUtils = __import("globalUtils.js");
const Constants = __import("constants.js");
const DebugManager = __import("debugManager.js");
const DesktopNotificationsUtils = __import("desktopNotificationsUtils.js");

const {
    gi: {
        Clutter,
        Soup,
        St
    },
    misc: {
        params: Params
    },
    ui: {
        main: Main,
        popupMenu: PopupMenu,
        tooltips: Tooltips,
        tweener: Tweener
    }
} = imports;

const {
    ErrorMessages,
    KnownStatusCodes,
    OrnamentType,
    Placeholders,
    WeatherProviderNames
} = Constants;

const {
    _,
    isBlank,
    escapeHTML,
    xdgOpen
} = GlobalUtils;

const {
    CustomNotification
} = DesktopNotificationsUtils;

var Debugger = new DebugManager.DebugManager();
var safeGet = GlobalUtils.safeGet;

DebugManager.wrapObjectMethods(Debugger, {
    CustomNotification: CustomNotification,
    LocationSelectorMenu: LocationSelectorMenu,
    LocationSelectorMenuItem: LocationSelectorMenuItem,
    WeatherProviderBase: WeatherProviderBase
});

var Notification = new CustomNotification({
    title: escapeHTML(_(XletMeta.name)),
    defaultButtons: [{
        action: "dialog-information",
        label: escapeHTML(_("Help"))
    }],
    actionInvokedCallback: (aSource, aAction) => {
        switch (aAction) {
            case "dialog-information":
                xdgOpen(XletMeta.path + "/HELP.html");
                break;
        }
    }
});

var OAuth = {
    nonce_CHARS: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",

    timestamp: function timestamp() {
        let t = new Date().getTime();
        return Math.floor(t / 1000);
    },

    nonce: function nonce(length) {
        let chars = this.nonce_CHARS;
        let result = "";
        for (let i = 0; i < length; ++i) {
            let rnum = Math.floor(Math.random() * chars.length);
            result += chars.substring(rnum, rnum + 1);
        }
        return result;
    },

    buildBaseString: function(baseURI, method, params) {
        let r = [];

        for (let key in params) {
            r.push(key + "=" + this.percentEncode(params[key]));
        }

        /* NOTE: From Yahoo! API documentation.
         * Make sure all the query parameters ("location", "format", "u", etc) along with
         * oauth parameters are sorted and encoded when generating the signature.
         */
        return method + "&" + this.percentEncode(baseURI) + "&" + this.percentEncode(r.sort().join("&"));
    },

    buildAuthorizationHeader: function(oauth) {
        let h = "OAuth ";
        let values = [];

        for (let key in oauth) {
            if (key === "oauth_signature") {
                values.push(key + '="' + oauth[key] + '"');
            } else {
                values.push(key + '="' + this.percentEncode(oauth[key]) + '"');
            }
        }

        h += values.join(",");
        return h;
    },

    addToURL: function(url, parameters) {
        let newURL = url;
        if (parameters !== null) {
            let toAdd = this.formEncode(parameters);
            if (toAdd.length > 0) {
                let q = url.indexOf("?");
                if (q < 0) {
                    newURL += "?";
                } else {
                    newURL += "&";
                }
                newURL += toAdd;
            }
        }
        return newURL;
    },

    formEncode: function(parameters) {
        let form = "";
        let list = this.getParameterList(parameters);
        for (let p = 0; p < list.length; ++p) {
            let value = list[p][1];
            if (value === null) {
                value = "";
            }
            if (form !== "") {
                form += "&";
            }
            form += this.percentEncode(list[p][0]) + "=" + this.percentEncode(value);
        }
        return form;
    },

    getParameterList: function getParameterList(parameters) {
        if (parameters === null) {
            return [];
        }
        if (typeof parameters !== "object") {
            return this.decodeForm(parameters + "");
        }
        if (Array.isArray(parameters)) {
            return parameters;
        }
        let list = [];
        for (let p in parameters) {
            list.push([
                p,
                parameters[p]
            ]);
        }
        return list;
    },

    decodeForm: function decodeForm(form) {
        let list = [];
        let nvps = form.split("&");
        for (let n = 0; n < nvps.length; ++n) {
            let nvp = nvps[n];
            if (nvp === "") {
                continue;
            }
            let equals = nvp.indexOf("=");
            let name;
            let value;
            if (equals < 0) {
                name = this.decodePercent(nvp);
                value = null;
            } else {
                name = this.decodePercent(nvp.substring(0, equals));
                value = this.decodePercent(nvp.substring(equals + 1));
            }
            list.push([
                name,
                value
            ]);
        }
        return list;
    },

    percentEncode: function percentEncode(s) {
        if (s === null) {
            return "";
        }
        if (Array.isArray(s)) {
            let e = "";
            for (let i = 0; i < s.length; ++s) {
                if (e !== "") {
                    e += "&";
                }
                e += this.percentEncode(s[i]);
            }
            return e;
        }
        s = encodeURIComponent(s);
        s = s.replace(/\!/g, "%21");
        s = s.replace(/\*/g, "%2A");
        s = s.replace(/\'/g, "%27");
        s = s.replace(/\(/g, "%28");
        s = s.replace(/\)/g, "%29");
        return s;
    },

    decodePercent: function decodePercent(s) {
        if (s !== null) {
            s = s.replace(/\+/g, " ");
        }
        return decodeURIComponent(s);
    }
};

/**
 * [WeatherProviderBase description]
 *
 *
 *
 * @param  {[type]} aApplet [description]
 * @param  {[type]} aParams [description]
 */

function WeatherProviderBase() {
    this._init.apply(this, arguments);
}

WeatherProviderBase.prototype = {

    _init: function(aApplet, aParams) {
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

        let params = Params.parse(aParams, {
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

        for (let prop in params) {
            this[prop] = params[prop];
        }
    },

    _processLocationID: function() {
        /* NOTE: Remove ALL white spaces, not just trim() it.
         */
        let locationID = this.locationID.replace(/\s/g, "");
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
    },

    getWeatherData: function(aRefreshCallback) {
        if (this._twoHTTPRequests) {
            this._doubleHTTPRequest(aRefreshCallback);
        } else {
            this._singleHTTPRequest(aRefreshCallback);
        }
    },

    _singleHTTPRequest: function(aRefreshCallback) {
        let request = Soup.Message.new(this._method_1, this._query_url_1);

        if (this._headers_1) {
            for (let key in this._headers_1) {
                request.request_headers.append(key, this._headers_1[key]);
            }
        }

        this.applet._httpSession.queue_message(request,
            (aSession, aMessage) => {
                if (aMessage.status_code === Soup.KnownStatusCode.OK) {
                    try {
                        aRefreshCallback.call(this.applet,
                            this.parseWeatherData(aMessage.response_body.data));
                    } catch (aErr) {
                        global.logError("Error parsing data.");
                        global.logError("Response data:\n" + aMessage.response_body.data);
                        global.logError(aErr);
                        this._callBackWithError(aRefreshCallback,
                            ErrorMessages.FAILED_PARSING_WEATHER);
                    }
                } else {
                    this._callBackWithError(aRefreshCallback, aMessage);
                }
            }
        );
    },

    _doubleHTTPRequest: function(aRefreshCallback) {
        let request1 = Soup.Message.new(this._method_1, this._query_url_1);

        if (this._headers_1) {
            for (let key in this._headers_1) {
                request1.request_headers.append(key, this._headers_1[key]);
            }
        }

        this.applet._httpSession.queue_message(request1,
            (aSession1, aMessage1) => {
                if (aMessage1.status_code === Soup.KnownStatusCode.OK) {
                    let request2 = Soup.Message.new(this._method_2, this._query_url_2);

                    if (this._headers_2) {
                        for (let key in this._headers_2) {
                            request2.request_headers.append(key, this._headers_2[key]);
                        }
                    }

                    this.applet._httpSession.queue_message(request2,
                        (aSession2, aMessage2) => {
                            if (aMessage2.status_code === Soup.KnownStatusCode.OK) {
                                try {
                                    aRefreshCallback.call(this.applet, this.parseWeatherData(
                                        aMessage1.response_body.data,
                                        aMessage2.response_body.data
                                    ));
                                } catch (aErr) {
                                    global.logError("Error parsing data.");
                                    global.logError("Response data 1:\n" + aMessage1.response_body.data);
                                    global.logError("Response data 2:\n" + aMessage2.response_body.data);
                                    global.logError(aErr);
                                    this._callBackWithError(aRefreshCallback,
                                        ErrorMessages.FAILED_PARSING_WEATHER);
                                }
                            } else {
                                this._callBackWithError(aRefreshCallback, aMessage2);
                            }
                        });
                } else {
                    this._callBackWithError(aRefreshCallback, aMessage1);
                }
            }
        );
    },

    _callBackWithError: function(aRefreshCallback, aMessage) {
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
    },

    parseWeatherData: function(aRawResponseData) { // jshint ignore:line
        global.logError("Not implemented method: parseWeatherData");
        return null;
    },

    formatTime: function(aTime) {
        return isNaN(parseInt(aTime, 10)) ? Placeholders.ELLIPSIS : this._getTimeFromDate(aTime);
    },

    _compassDirection: function(deg) {
        if (deg === null) {
            return null;
        }

        let directions = [_("N"), _("NE"), _("E"), _("SE"), _("S"), _("SW"), _("W"), _("NW")];
        return directions[Math.round(deg / 45) % directions.length];
    },

    _getTimeFromDate: function(aSeconds) {
        let date = new Date(aSeconds * 1000);
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let ampm = hours >= 12 ? "pm" : "am";
        hours = hours % 12 || 12;
        minutes = minutes < 10 ? "0" + minutes : minutes;

        return hours + ":" + minutes + " " + ampm;
    },

    _normalizeMinutes: function(aTimeStr) {
        if (isBlank(aTimeStr)) {
            return Placeholders.ELLIPSIS;
        }

        // verify expected time format
        let result = aTimeStr.match(/^\d{1,2}:(\d{1,2}) [ap]m$/);

        if (result !== null) {
            let minutes = result[1];
            // single-digit minutes values need normalizing (zero-padding)
            if (minutes.length < 2) {
                let timeSegments = aTimeStr.split(":");
                return timeSegments[0] + ":0" + timeSegments[1];
            }
        }

        return aTimeStr;
    },

    get weather_details_url() {
        return this._weather_details_url;
    }
};

function LocationSelectorMenuItem() {
    this._init.apply(this, arguments);
}

LocationSelectorMenuItem.prototype = {
    __proto__: PopupMenu.PopupIndicatorMenuItem.prototype,

    _init: function(aSubMenu, aLocationUUID, aLocationData) {
        let label = aLocationData.locationName + " - " +
            aLocationData.locationID + " - " +
            WeatherProviderNames[aLocationData.providerID];

        PopupMenu.PopupIndicatorMenuItem.prototype._init.call(this, label, {
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
            this.applet.pref_current_location = this._locationUUID;
            this._subMenu.setCheckedState();
            this.applet._animateLocationSwitch("hide",
                () => {
                    this.applet.refreshAndRebuild(false, false);
                });
            return true; // Do not close menu when activating items.
        });

        this._ornament.child._delegate.setToggleState(
            this.applet.pref_current_location === this._locationUUID
        );
    },

    destroy: function() {
        this.disconnect(this._handler_id);
        PopupMenu.PopupIndicatorMenuItem.prototype.destroy.call(this);
    }
};

function LocationSelectorMenu() {
    this._init.apply(this, arguments);
}

LocationSelectorMenu.prototype = {
    __proto__: PopupMenu.PopupSubMenu.prototype,

    _init: function(aApplet, aAnchorActor) {
        this.applet = aApplet;
        this._anchor = aAnchorActor;

        PopupMenu.PopupSubMenu.prototype._init.call(this, this._anchor);
        // Set a max. height so the applet menu doesn't look even more gigantic
        // when the locations selector sub-menu is opened.
        this.actor.set_style("max-height:250px;");
    },

    populateMenu: function() {
        this.removeAll();

        let locationsMap = this.applet.locationsMap;

        for (let [uuid, locationData] of locationsMap) {
            let item = new LocationSelectorMenuItem(this, uuid, locationData);
            this.addMenuItem(item);
        }

        if (!locationsMap.has(this.applet.pref_current_location)) {
            let msg = _("Displayed weather data doesn't belong to any currently configured location!");
            this.applet.displayErrorMessage(msg, "warning");
        }
    },

    setCheckedState: function() {
        let children = this._getMenuItems();
        let i = children.length;
        while (i--) {
            let item = children[i];
            if (item instanceof LocationSelectorMenuItem) { // Just in case
                item._ornament.child._delegate.setToggleState(
                    this.applet.pref_current_location === item._locationUUID
                );
            }
        }
    },

    open: function(animate) { // jshint ignore:line
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

        let needsScrollbar = this._needsScrollbar();

        let [minHeight, naturalHeight] = this.actor.get_preferred_height(-1); // jshint ignore:line

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

function CustomPanelItemTooltip() {
    this._init.apply(this, arguments);
}

CustomPanelItemTooltip.prototype = {
    __proto__: Tooltips.PanelItemTooltip.prototype,

    _init: function(aApplet, aOrientation, aLocationData = null) {
        Tooltips.PanelItemTooltip.prototype._init.call(this, aApplet, "", aOrientation);

        // Destroy the original _tooltip, which is an St.Label.
        this._tooltip.destroy();

        let tooltipBox = new Clutter.GridLayout({
            orientation: Clutter.Orientation.VERTICAL
        });

        this._tooltip = new St.Bin({
            name: "Tooltip"
        });

        let rtl = (St.Widget.get_default_direction() === St.TextDirection.RTL);
        this._tooltip.set_style("text-align:%s;".format(rtl ? "right" : "left"));

        /* NOTE: This is a workaround because Tooltip instances have the _tooltip property hard-coded
         * to be an St.Label(). And the Tooltip's show method calls this._tooltip.get_text() to decide
         * if the tooltip should be displayed or not.
         */
        this._tooltip.get_text = () => {
            return _(XletMeta.name);
        };
        this._tooltip.show_on_set_parent = false;

        this._tooltip.set_child(new St.Widget({
            layout_manager: tooltipBox
        }));

        if (aLocationData) {
            let i = 0,
                iLen = aLocationData.length;
            for (; i < iLen; i++) {
                let [title, value] = aLocationData[i];

                tooltipBox.attach(this._createLabel(title, true), 0, i, 1, 1);
                tooltipBox.attach(this._createLabel(value), 1, i, 1, 1);
            }
        }

        Main.uiGroup.add_actor(this._tooltip);
    },

    _createLabel: function(aText, aAsMarkup = false) {
        let label = new St.Label();

        if (aAsMarkup) {
            label.clutter_text.set_markup("<b>%s</b>: ".format(aText));
        } else {
            label.set_text(aText);
        }

        return label;
    }
};

function safeGetEll() {
    let val = safeGet.apply(null, arguments);
    return val === null ? Placeholders.ELLIPSIS : val;
}

// https://github.com/tingletech/moon-phase
// http://stackoverflow.com/questions/11759992/calculating-jdayjulian-day-in-javascript
// http://jsfiddle.net/gkyYJ/
// http://stackoverflow.com/users/965051/adeneo
Date.prototype.getJulianDate = function() {
    return ((this / 86400000) - (this.getTimezoneOffset() / 1440) + 2440587.5);
};

// http://www.ben-daglish.net/moon.shtml
function moonDay(today) {
    let GetFrac = (fr) => {
        return (fr - Math.floor(fr));
    };
    let thisJD = today.getJulianDate();
    let year = today.getFullYear();
    let degToRad = 3.14159265 / 180;
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
    let phase = moonDay(new Date());

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

/* exported OAuth,
            safeGetEll,
            soupPrinter,
            getMoonPhase,
            Notification
 */
