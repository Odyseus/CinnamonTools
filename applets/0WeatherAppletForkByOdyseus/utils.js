const {
    gi: {
        Gio,
        GLib,
        Pango,
        Soup,
        St
    },
    misc: {
        params: Params
    },
    ui: {
        messageTray: MessageTray,
        popupMenu: PopupMenu,
        tooltips: Tooltips,
        tweener: Tweener
    }
} = imports;

const GioSSS = Gio.SettingsSchemaSource;

var Constants;
// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    Constants = require("./constants.js");
} else {
    Constants = imports.ui.appletManager.applets["{{UUID}}"].constants;
}

const XletMeta = Constants.XletMeta;

const {
    DebugManagerSchema,
    ErrorMessages,
    KnownStatusCodes,
    OrnamentType,
    Placeholders,
    WeatherProviderNames,
} = Constants;

var _ = Constants._;

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
        this.geoIPProvider = null;
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
            distanceUnit: "",
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

    formatTime: function(aTime) { // jshint ignore:line
        global.logError("Not implemented method: formatTime");
        return null;
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
        let ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12 || 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;

        return hours + ':' + minutes + ' ' + ampm;
    },

    _normalizeMinutes: function(timeStr) {
        // verify expected time format
        let result = timeStr.match(/^\d{1,2}:(\d{1,2}) [ap]m$/);

        if (result !== null) {
            let minutes = result[1];
            // single-digit minutes values need normalizing (zero-padding)
            if (minutes.length < 2) {
                let timeSegments = timeStr.split(":");
                return timeSegments[0] + ":0" + timeSegments[1];
            }
        }

        return timeStr;
    },

    get weather_details_url() {
        return this._weather_details_url;
    }
};

function CustomPanelTooltip() {
    this._init.apply(this, arguments);
}

CustomPanelTooltip.prototype = {
    __proto__: Tooltips.PanelItemTooltip.prototype,

    _init: function(panelItem, initTitle, orientation) {
        Tooltips.PanelItemTooltip.prototype._init.call(this, panelItem, initTitle, orientation);
        this._tooltip.set_style("text-align:left;");
    },

    set_text: function(text) {
        this._tooltip.get_clutter_text().set_markup(text);
    }
};

function CustomTooltip() {
    this._init.apply(this, arguments);
}

CustomTooltip.prototype = {
    __proto__: Tooltips.Tooltip.prototype,

    _init: function(aActor, aText) {
        Tooltips.Tooltip.prototype._init.call(this, aActor, aText);

        this._tooltip.set_style("text-align: left;width:auto;max-width: 450px;");
        this._tooltip.get_clutter_text().set_line_wrap(true);
        this._tooltip.get_clutter_text().set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        this._tooltip.get_clutter_text().ellipsize = Pango.EllipsizeMode.NONE; // Just in case

        aActor.connect("destroy", () => this.destroy());
    },

    destroy: function() {
        Tooltips.Tooltip.prototype.destroy.call(this);
    }
};

function WeatherMessageTraySource() {
    this._init.apply(this, arguments);
}

WeatherMessageTraySource.prototype = {
    __proto__: MessageTray.Source.prototype,

    _init: function() {
        MessageTray.Source.prototype._init.call(this, _(XletMeta.name));
        this._setSummaryIcon(this.createNotificationIcon());
    },

    createNotificationIcon: function() {
        return new St.Icon({
            gicon: Gio.icon_new_for_string(XletMeta.path + "/icon.png"),
            icon_size: 24
        });
    },

    open: function() {
        this.destroy();
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

function escapeHTML(aStr) {
    aStr = String(aStr)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    return aStr;
}

function isObject(item) {
    return (item && typeof item === "object" && !Array.isArray(item));
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

function safeGetEll() {
    let val = safeGet.apply(null, arguments);
    return val === null ? Placeholders.ELLIPSIS : val;
}

/**
 * Benchmark function invocations within a given class or prototype.
 *
 * @param  {Object}  aObject                    JavaScript class or prototype to benchmark.
 * @param  {Object}  aParams                    Object containing parameters, all are optional.
 * @param  {String}  aParams.objectName         Because it's impossible to get the name of a prototype
 *                                              in JavaScript, force it down its throat. ¬¬
 * @param  {Array}   aParams.methods            By default, all methods in aObject will be
 *                                              "proxyfied". aParams.methods should containg the name
 *                                              of the methods that one wants to debug/benchmark.
 *                                              aParams.methods acts as a whitelist by default.
 * @param  {Boolean} aParams.blacklistMethods   If true, ALL methods in aObject will be
 *                                              debugged/benchmarked, except those listed in aParams.methods.
 * @param  {Number}  aParams.threshold          The minimum latency of interest.
 * @param  {Boolean}  aParams.debug              If true, the target method will be executed inside a
 *                                              try{} catch{} block.
 */
function prototypeDebugger(aObject, aParams) {
    let options = Params.parse(aParams, {
        objectName: "Object",
        methods: [],
        blacklistMethods: false,
        debug: true,
        threshold: 3
    });
    let keys = Object.getOwnPropertyNames(aObject.prototype);

    if (options.methods.length > 0) {
        keys = keys.filter((aKey) => {
            return options.blacklistMethods ?
                // Treat aMethods as a blacklist, so don't include these keys.
                options.methods.indexOf(aKey) === -1 :
                // Keep ONLY the keys in aMethods.
                options.methods.indexOf(aKey) >= 0;
        });
    }

    let outpuTemplate = "[%s.%s]: %fms (MAX: %fms AVG: %fms)";
    let times = [];
    let i = keys.length;

    let getHandler = (aKey) => {
        return {
            apply: function(aTarget, aThisA, aArgs) { // jshint ignore:line
                let val;
                let now = GLib.get_monotonic_time();

                if (options.debug) {
                    try {
                        val = aTarget.apply(aThisA, aArgs);
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                } else {
                    val = aTarget.apply(aThisA, aArgs);
                }

                let time = GLib.get_monotonic_time() - now;

                if (time >= options.threshold) {
                    times.push(time);
                    let total = 0;
                    let timesLength = times.length;
                    let z = timesLength;

                    while (z--) {
                        total += times[z];
                    }

                    let max = (Math.max.apply(null, times) / 1000).toFixed(2);
                    let avg = ((total / timesLength) / 1000).toFixed(2);
                    time = (time / 1000).toFixed(2);

                    global.log(outpuTemplate.format(
                        options.objectName,
                        aKey,
                        time,
                        max,
                        avg
                    ));
                }

                return val;
            }
        };
    };

    while (i--) {
        let key = keys[i];

        /* NOTE: If key is a setter or getter, aObject.prototype[key] will throw.
         */
        if (!!Object.getOwnPropertyDescriptor(aObject.prototype, key)["get"] ||
            !!Object.getOwnPropertyDescriptor(aObject.prototype, key)["set"]) {
            continue;
        }

        let fn = aObject.prototype[key];

        if (typeof fn !== "function") {
            continue;
        }

        aObject.prototype[key] = new Proxy(fn, getHandler(key));
    }
}

function DebugManager() {
    this._init.apply(this, arguments);
}

DebugManager.prototype = {
    _init: function() {
        let schema = DebugManagerSchema;
        let schemaDir = Gio.file_new_for_path(XletMeta.path + "/schemas");
        let schemaSource;

        if (schemaDir.query_exists(null)) {
            schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
                GioSSS.get_default(),
                false);
        } else {
            schemaSource = GioSSS.get_default();
        }

        this.schemaObj = schemaSource.lookup(schema, false);

        if (!this.schemaObj) {
            throw new Error(_("Schema %s could not be found for xlet %s.")
                .format(schema, XletMeta.uuid) + _("Please check your installation."));
        }

        this.schema = new Gio.Settings({
            settings_schema: this.schemaObj
        });

        this._handlers = [];
    },

    set verboseLogging(aValue) {
        this.schema.set_boolean("pref-enable-verbose-logging", aValue);
    },

    get verboseLogging() {
        return this.schema.get_boolean("pref-enable-verbose-logging");
    },

    connect: function(signal, callback) {
        let handler_id = this.schema.connect(signal, callback);
        this._handlers.push(handler_id);
        return handler_id;
    },

    destroy: function() {
        // Remove the remaining signals...
        while (this._handlers.length) {
            this.disconnect(this._handlers[0]);
        }
    },

    disconnect: function(handler_id) {
        let index = this._handlers.indexOf(handler_id);
        this.schema.disconnect(handler_id);

        if (index > -1) {
            this._handlers.splice(index, 1);
        }
    }
};

/* exported escapeHTML,
            OAuth,
            safeGetEll,
            soupPrinter,
            prototypeDebugger,
 */
