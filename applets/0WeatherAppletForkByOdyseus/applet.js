let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
}

const _ = $._;

const {
    cairo: Cairo,
    gi: {
        Gio,
        Gtk,
        Soup,
        St
    },
    mainloop: Mainloop,
    misc: {
        util: Util
    },
    ui: {
        applet: Applet,
        main: Main,
        popupMenu: PopupMenu,
        settings: Settings
    }
} = imports;

const APPLET_ICON = "view-refresh-symbolic";
const WOEID_URL = "http://woeid.rosselliot.co.nz";
const CMD_WOEID_LOOKUP = "xdg-open " + WOEID_URL;

// Conversion Factors
const WEATHER_CONV_MPH_IN_MPS = 2.23693629;
const WEATHER_CONV_KPH_IN_MPS = 3.6;
const WEATHER_CONV_KNOTS_IN_MPS = 1.94384449;

// Magic strings
const BLANK = "   ";
const ELLIPSIS = "...";

// Query
const QUERY_PARAMS = "?format=json&q=select ";
const QUERY_TABLE = "weather.forecast";
const QUERY_VIEW = "*";
const QUERY_URL = "http://query.yahooapis.com/v1/public/yql" + QUERY_PARAMS + QUERY_VIEW + " from " + QUERY_TABLE;

// stylesheet.css
const STYLE = {
    LOCATION_LINK: "weather-current-location-link",
    SUMMARYBOX: "weather-current-summarybox",
    SUMMARY: "weather-current-summary",
    DATABOX: "weather-current-databox",
    ICON: "weather-current-icon",
    ICONBOX: "weather-current-iconbox",
    DATABOX_CAPTIONS: "weather-current-databox-captions",
    ASTRONOMY: "weather-current-astronomy",
    FORECAST_ICON: "weather-forecast-icon",
    FORECAST_DATABOX: "weather-forecast-databox",
    FORECAST_DAY: "weather-forecast-day",
    DATABOX_VALUES: "weather-current-databox-values",
    FORECAST_SUMMARY: "weather-forecast-summary",
    FORECAST_TEMPERATURE: "weather-forecast-temperature",
    FORECAST_BOX: "weather-forecast-box",
    POPUP_SEPARATOR_MENU_ITEM: "popup-separator-menu-item",
    CURRENT: "current",
    FORECAST: "forecast",
    WEATHER_MENU: "weather-menu"
};

const WeatherUnits = {
    CELSIUS: "celsius",
    FAHRENHEIT: "fahrenheit"
};

const WeatherWindSpeedUnits = {
    KPH: "kph",
    MPH: "mph",
    MPS: "m/s",
    KNOTS: "knots"
};

const WeatherPressureUnits = {
    MBAR: "mbar",
    MMHG: "mm Hg",
    INHG: "in Hg",
    PA: "Pa",
    KPA: "kPa",
    PSI: "psi",
    ATM: "atm",
    AT: "at"
};

// Pressure conversion factors
const WEATHER_CONV_KPA_IN_MBAR = 0.1;
const WEATHER_CONV_PA_IN_MBAR = 100;
const WEATHER_CONV_MMHG_IN_MBAR = 750.0615613e-3;
const WEATHER_CONV_INHG_IN_MBAR = 2.952998307e-2;
const WEATHER_CONV_AT_IN_MBAR = 1.019716213e-3;
const WEATHER_CONV_ATM_IN_MBAR = 0.986923169e-3;
const WEATHER_CONV_PSI_IN_MBAR = 14.5037738e-3;

const WEATHER_CONV_MBAR_IN_INHG = 3.3863886667e+1;
const WEATHER_CONV_KPA_IN_INHG = 3.386389;
const WEATHER_CONV_PA_IN_INHG = 3.386389e+3;
const WEATHER_CONV_MMHG_IN_INHG = 25.4;
const WEATHER_CONV_PSI_IN_INHG = 491.154152e-3;
const WEATHER_CONV_AT_IN_INHG = 34.531554e-3;
const WEATHER_CONV_ATM_IN_INHG = 33.421054e-3;

const _httpSession = new Soup.SessionAsync();

function WeatherAppletForkByOdyseusApplet() {
    this._init.apply(this, arguments);
}

WeatherAppletForkByOdyseusApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(aMetadata, aOrientation, aPanel_height, aInstance_id) {
        Applet.TextIconApplet.prototype._init.call(this, aOrientation, aPanel_height, aInstance_id);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.metadata = aMetadata;
        this.instance_id = aInstance_id;
        this.orientation = aOrientation;
        this.menu_keybinding_name = this.metadata.uuid + "-" + this.instance_id;

        this._initializeSettings(() => {
            //
        }, () => {
            this.set_applet_icon_name(APPLET_ICON);
            this.set_applet_label(_("..."));
            this.set_applet_tooltip(_("Click to open"));

            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menu = new Applet.AppletPopupMenu(this, this.orientation);

            if (typeof this.menu.setCustomStyleClass === "function") {
                this.menu.setCustomStyleClass(STYLE.WEATHER_MENU);
            } else {
                this.menu.actor.add_style_class_name(STYLE.WEATHER_MENU);
            }

            this.menuManager.addMenu(this.menu);

            this._updateKeybindings();
            this.updateIconType();
            this.refresh_weather_id = 0;

            // ------------------------------
            // render graphics container
            // ------------------------------

            // build menu
            let mainBox = new St.BoxLayout({
                vertical: true
            });
            this.menu.addActor(mainBox);

            //  today's forecast
            this._currentWeather = new St.Bin({
                style_class: STYLE.CURRENT
            });
            mainBox.add_actor(this._currentWeather);

            //  horizontal rule
            this._separatorArea = new St.DrawingArea({
                style_class: STYLE.POPUP_SEPARATOR_MENU_ITEM
            });
            this._separatorArea.width = 200;
            this._separatorArea.connect("repaint",
                (aArea) => this._onSeparatorAreaRepaint(aArea));
            mainBox.add_actor(this._separatorArea);

            //  tomorrow's forecast
            this._futureWeather = new St.Bin({
                style_class: STYLE.FORECAST
            });
            mainBox.add_actor(this._futureWeather);

            this.rebuild();

            this._refresh_weather_id = Mainloop.timeout_add_seconds(3,
                () => {
                    this.refreshWeather(true);
                    this._refresh_weather_id = 0;
                });
        });
    },

    _initializeSettings: function(aDirectCallback, aIdleCallback) {
        this.settings = new Settings.AppletSettings(
            this,
            this.metadata.uuid,
            this.instance_id,
            true // Asynchronous settings initialization.
        );

        let callback = () => {
            try {
                this._bindSettings();
                aDirectCallback();
            } catch (aErr) {
                global.logError(aErr);
            }

            Mainloop.idle_add(() => {
                try {
                    aIdleCallback();
                } catch (aErr) {
                    global.logError(aErr);
                }
            });
        };

        // Needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 4.2.x+
        // Always use promise. Declare content of callback variable
        // directly inside the promise callback.
        switch (this.settings.hasOwnProperty("promise")) {
            case true:
                this.settings.promise.then(() => callback());
                break;
            case false:
                callback();
                break;
        }
    },

    _bindSettings: function() {
        // Needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        let bD = {
            IN: 1,
            OUT: 2,
            BIDIRECTIONAL: 3
        };
        let prefKeysArray = [
            "pref_overlay_key",
            "pref_location_label_override",
            "pref_refresh_interval",
            "pref_show_comment_in_panel",
            "pref_vertical_orientation",
            "pref_show_sunrise",
            "pref_show_common_sense_hours",
            "pref_forecast_days",
            "pref_show_text_in_panel",
            "pref_translate_condition",
            "pref_temperature_unit",
            "pref_temperature_high_first",
            "pref_pressure_unit",
            "pref_use_symbolic_icons",
            "pref_wind_speed_unit",
            "pref_woeid",
            "pref_last_check",
            "pref_weather_data"
        ];
        let newBinding = typeof this.settings.bind === "function";
        for (let pref_key of prefKeysArray) {
            // Condition needed for retro-compatibility.
            // Mark for deletion on EOL. Cinnamon 3.2.x+
            // Abandon this.settings.bindProperty and keep this.settings.bind.
            if (newBinding) {
                this.settings.bind(pref_key, pref_key, this._onSettingsChanged, pref_key);
            } else {
                this.settings.bindProperty(bD.BIDIRECTIONAL, pref_key, pref_key, this._onSettingsChanged, pref_key);
            }
        }
    },

    refreshIcons: function() {
        this.updateIconType();
        this._applet_icon.icon_type = this._icon_type;
        this._currentWeatherIcon.icon_type = this._icon_type;
        for (let i = 0; i < this.pref_forecast_days; i++) {
            this._forecast[i].Icon.icon_type = this._icon_type;
        }
        this.refreshWeather(false);
    },

    refreshAndRebuild: function() {
        this.refreshWeather(false);
        this.rebuild();
    },

    woeidLookup: function() {
        Util.spawnCommandLine(CMD_WOEID_LOOKUP);
    },

    _updateKeybindings: function() {
        Main.keybindingManager.removeHotKey(this.menu_keybinding_name);

        if (this.pref_overlay_key !== "") {
            Main.keybindingManager.addHotKey(
                this.menu_keybinding_name,
                this.pref_overlay_key,
                () => {
                    if (!Main.overview.visible && !Main.expo.visible) {
                        this.menu.toggle();
                    }
                }
            );
        }
    },

    on_applet_removed_from_panel: function(event) { // jshint ignore:line
        Main.keybindingManager.removeHotKey(this.menu_keybinding_name);

        if (this._refresh_weather_id > 0) {
            Mainloop.source_remove(this._refresh_weather_id);
            this._refresh_weather_id = 0;
        }
    },

    on_applet_clicked: function(event) { // jshint ignore:line
        this.menu.toggle();
    },

    _onSeparatorAreaRepaint: function(area) {
        let cr = area.get_context();
        let themeNode = area.get_theme_node();
        let [width, height] = area.get_surface_size();
        let margin = themeNode.get_length("-margin-horizontal");
        let gradientHeight = themeNode.get_length("-gradient-height");
        let startColor = themeNode.get_color("-gradient-start");
        let endColor = themeNode.get_color("-gradient-end");
        let gradientWidth = (width - margin * 2);
        let gradientOffset = (height - gradientHeight) / 2;
        let pattern = new Cairo.LinearGradient(margin, gradientOffset, width - margin, gradientOffset + gradientHeight);

        pattern.addColorStopRGBA(0, startColor.red / 255, startColor.green / 255, startColor.blue / 255, startColor.alpha / 255);
        pattern.addColorStopRGBA(0.5, endColor.red / 255, endColor.green / 255, endColor.blue / 255, endColor.alpha / 255);
        pattern.addColorStopRGBA(1, startColor.red / 255, startColor.green / 255, startColor.blue / 255, startColor.alpha / 255);
        cr.setSource(pattern);
        cr.rectangle(margin, gradientOffset, gradientWidth, gradientHeight);
        cr.fill();
    },

    updateIconType: function() {
        this._icon_type = this.pref_use_symbolic_icons ?
            St.IconType.SYMBOLIC :
            St.IconType.FULLCOLOR;
    },

    loadJsonAsync: function(aUrl, aCallback) {
        if (!this._shouldUpdate() && this.pref_weather_data) {
            aCallback.call(this, this.pref_weather_data);
        } else {
            let context = this;
            let message = Soup.Message.new("GET", aUrl);
            _httpSession.queue_message(message, (session, aMessage) => {
                aCallback.call(context, JSON.parse(aMessage.response_body.data));
            });

        }
    },

    parseDay: function(abr) {
        let yahoo_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        for (let i = 0; i < yahoo_days.length; i++) {
            if (yahoo_days[i].substr(0, abr.length) == abr.toLowerCase()) {
                return i;
            }
        }
        return 0;
    },

    _shouldUpdate: function() {
        if (parseInt(this.pref_last_check, 10) === 0) {
            return true;
        }
        //                                  milliseconds to seconds
        return Math.round((new Date().getTime() - parseInt(this.pref_last_check, 10)) / 1000) >=
            //              minutes to seconds
            Math.round(this.pref_refresh_interval * 60);
    },

    refreshWeather: function(recurse) {
        this.loadJsonAsync(this.weatherUrl(), (aJson) => {
            try {
                let shouldUpdate = this._shouldUpdate();

                if ((aJson && !aJson.query.results && shouldUpdate) || !aJson) {
                    if (this._refresh_weather_id > 0) {
                        Mainloop.source_remove(this._refresh_weather_id);
                        this._refresh_weather_id = 0;
                    }

                    // Polling for likely API throttling
                    this._refresh_weather_id = Mainloop.timeout_add_seconds(5, () => {
                        this.refreshWeather(true);
                        this._refresh_weather_id = 0;
                    });
                    return false;
                }

                let weather = aJson.query.results.channel;

                if (!weather.item) {
                    return false;
                }

                if (shouldUpdate) {
                    this.pref_weather_data = aJson;
                    this.pref_last_check = parseInt(new Date().getTime(), 10);
                }

                let weather_c = weather.item.condition;
                let forecast = weather.item.forecast;

                let location = weather.location.city;
                if (this.nonempty(this.pref_location_label_override)) {
                    location = this.pref_location_label_override;
                }

                this.set_applet_tooltip(_(location));

                // Refresh current weather
                let comment = weather_c.text;
                if (this.pref_translate_condition) {
                    comment = this.weatherCondition(weather_c.code);
                }

                let humidity = weather.atmosphere.humidity + " %";

                let pressure = weather.atmosphere.pressure;

                let temperature = weather_c.temp;

                let wind = weather.wind.speed;
                let wind_chill = weather.wind.chill;
                let wind_direction = this.compassDirection(weather.wind.direction);

                let iconname = this.weatherIconSafely(weather_c.code);
                this._currentWeatherIcon.icon_name = iconname;
                this._icon_type == St.IconType.SYMBOLIC ?
                    this.set_applet_icon_symbolic_name(iconname) :
                    this.set_applet_icon_name(iconname);

                if (this.pref_show_text_in_panel) {
                    if (this.pref_show_comment_in_panel) {
                        this.set_applet_label(comment + " " + temperature + " " + this.unitToUnicode());
                    } else {
                        this.set_applet_label(temperature + " " + this.unitToUnicode());
                    }
                } else {
                    this.set_applet_label("");
                }

                this._currentWeatherSummary.text = comment;
                this._currentWeatherTemperature.text = temperature + " " + this.unitToUnicode();
                this._currentWeatherHumidity.text = humidity;

                // Override wind units with our preference
                // Need to consider what units the Yahoo API has returned it in
                switch (this.pref_wind_speed_unit) {
                    case WeatherWindSpeedUnits.KPH:
                        // Round to whole units
                        if (this.pref_temperature_unit == WeatherUnits.FAHRENHEIT) {
                            wind = Math.round(wind / WEATHER_CONV_MPH_IN_MPS * WEATHER_CONV_KPH_IN_MPS);
                        }
                        // Otherwise no conversion needed - already in correct units
                        break;
                    case WeatherWindSpeedUnits.MPH:
                        // Round to whole units
                        if (this.pref_temperature_unit == WeatherUnits.CELSIUS) {
                            wind = Math.round(wind / WEATHER_CONV_KPH_IN_MPS * WEATHER_CONV_MPH_IN_MPS);
                        }
                        // Otherwise no conversion needed - already in correct units
                        break;
                    case WeatherWindSpeedUnits.MPS:
                        // Precision to one decimal place as 1 m/s is quite a large unit
                        if (this.pref_temperature_unit == WeatherUnits.CELSIUS) {
                            wind = Math.round((wind / WEATHER_CONV_KPH_IN_MPS) * 10) / 10;
                        } else {
                            wind = Math.round((wind / WEATHER_CONV_MPH_IN_MPS) * 10) / 10;
                        }
                        break;
                    case WeatherWindSpeedUnits.KNOTS:
                        // Round to whole units
                        if (this.pref_temperature_unit == WeatherUnits.CELSIUS) {
                            wind = Math.round(wind / WEATHER_CONV_KPH_IN_MPS * WEATHER_CONV_KNOTS_IN_MPS);
                        } else {
                            wind = Math.round(wind / WEATHER_CONV_MPH_IN_MPS * WEATHER_CONV_KNOTS_IN_MPS);
                        }
                        break;
                }
                this._currentWeatherWind.text = (wind_direction ? wind_direction + " " : "") + wind + " " + _(this.pref_wind_speed_unit);

                // Override wind chill units with our preference
                // Yahoo API always returns Fahrenheit
                if (this.pref_temperature_unit == WeatherUnits.CELSIUS) {
                    wind_chill = Math.round((wind_chill - 32) / 1.8);
                }
                this._currentWeatherWindChill.text = wind_chill + " " + this.unitToUnicode();

                // Yahoo API returns values which are off by a factor of inHg to mbar
                pressure = pressure * WEATHER_CONV_INHG_IN_MBAR;

                // Override pressure units with our preference
                // Need to consider what units the Yahoo API has returned it in
                switch (this.pref_pressure_unit) {
                    case WeatherPressureUnits.MBAR:
                        if (this.pref_temperature_unit == WeatherUnits.FAHRENHEIT) {
                            pressure = pressure * WEATHER_CONV_MBAR_IN_INHG;
                        }
                        // Otherwise no conversion needed - already in correct units
                        pressure = parseFloat(pressure).toFixed(2);
                        break;
                    case WeatherPressureUnits.INHG:
                        if (this.pref_temperature_unit == WeatherUnits.CELSIUS) {
                            pressure = pressure * WEATHER_CONV_INHG_IN_MBAR;
                        }
                        // Otherwise no conversion needed - already in correct units
                        pressure = parseFloat(pressure).toFixed(2);
                        break;
                    case WeatherPressureUnits.PSI:
                        if (this.pref_temperature_unit == WeatherUnits.CELSIUS) {
                            pressure = pressure * WEATHER_CONV_PSI_IN_MBAR;
                        } else {
                            pressure = pressure * WEATHER_CONV_PSI_IN_INHG;
                        }
                        pressure = parseFloat(pressure).toFixed(3);
                        break;
                    case WeatherPressureUnits.MMHG:
                        if (this.pref_temperature_unit == WeatherUnits.CELSIUS) {
                            pressure = pressure * WEATHER_CONV_MMHG_IN_MBAR;
                        } else {
                            pressure = pressure * WEATHER_CONV_MMHG_IN_INHG;
                        }
                        pressure = Math.round(pressure);
                        break;
                    case WeatherPressureUnits.AT:
                        if (this.pref_temperature_unit == WeatherUnits.CELSIUS) {
                            pressure = pressure * WEATHER_CONV_AT_IN_MBAR;
                        } else {
                            pressure = pressure * WEATHER_CONV_AT_IN_INHG;
                        }
                        pressure = pressure.toFixed(4);
                        break;
                    case WeatherPressureUnits.ATM:
                        if (this.pref_temperature_unit == WeatherUnits.CELSIUS) {
                            pressure = pressure * WEATHER_CONV_ATM_IN_MBAR;
                        } else {
                            pressure = pressure * WEATHER_CONV_ATM_IN_INHG;
                        }
                        pressure = pressure.toFixed(4);
                        break;
                    case WeatherPressureUnits.PA:
                        if (this.pref_temperature_unit == WeatherUnits.CELSIUS) {
                            pressure = pressure * WEATHER_CONV_PA_IN_MBAR;
                        } else {
                            pressure = pressure * WEATHER_CONV_PA_IN_INHG;
                        }
                        pressure = Math.round(pressure);
                        break;
                    case WeatherPressureUnits.KPA:
                        if (this.pref_temperature_unit == WeatherUnits.CELSIUS) {
                            pressure = pressure * WEATHER_CONV_KPA_IN_MBAR;
                        } else {
                            pressure = pressure * WEATHER_CONV_KPA_IN_INHG;
                        }
                        pressure = parseFloat(pressure).toFixed(2);
                        break;
                }
                this._currentWeatherPressure.text = pressure + " " + _(this.pref_pressure_unit);

                // location is a button
                let tmp = weather.link.split("*");
                this._currentWeatherLocation.url = tmp.length > 1 ? tmp[1] : tmp[0];
                this._currentWeatherLocation.label = _(location);

                // gettext can't see these inline
                let sunriseText = _("Sunrise");
                let sunsetText = _("Sunset");

                let astronomyJson = weather.astronomy;
                let sunriseTime = this.formatAstronomyTime(astronomyJson, "sunrise");
                let sunsetTime = this.formatAstronomyTime(astronomyJson, "sunset");

                this._currentWeatherSunrise.text = this.pref_show_sunrise ? (sunriseText + ": " + sunriseTime) : "";
                this._currentWeatherSunset.text = this.pref_show_sunrise ? (sunsetText + ": " + sunsetTime) : "";

                // Refresh forecast
                for (let i = 0; i < this.pref_forecast_days; i++) {
                    let forecastUi = this._forecast[i];
                    let forecastData = forecast[i];
                    let code = forecastData.code;
                    let t_low = forecastData.low;
                    let t_high = forecastData.high;

                    let first_temperature = this.pref_temperature_high_first ? t_high : t_low;
                    let second_temperature = this.pref_temperature_high_first ? t_low : t_high;

                    let comment = forecastData.text;
                    if (this.pref_translate_condition) {
                        comment = this.weatherCondition(code);
                    }

                    forecastUi.Day.text = this.localeDay(forecastData.day);
                    forecastUi.Temperature.text = first_temperature + " " + "\u002F" + " " + second_temperature + " " + this.unitToUnicode();
                    forecastUi.Summary.text = comment;
                    forecastUi.Icon.icon_name = this.weatherIconSafely(code);
                }

                return true;
            } catch (aErr) {
                global.logError(aErr);
            }

            return true;
        });

        if (recurse) {
            if (this._refresh_weather_id > 0) {
                Mainloop.source_remove(this._refresh_weather_id);
                this._refresh_weather_id = 0;
            }

            this._refresh_weather_id = Mainloop.timeout_add_seconds(this.pref_refresh_interval * 60,
                () => {
                    this.refreshWeather(true);
                    this._refresh_weather_id = 0;
                }
            );
        }
    },

    normalizeMinutes: function(timeStr) {
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

    convertTo24: function(timeStr) {
        let s = timeStr.indexOf(":");
        let t = timeStr.indexOf(" ");
        let n = timeStr.length;
        let hh = timeStr.substr(0, s);
        let mm = timeStr.substring(s + 1, t);

        if (parseInt(hh) < 10) { // pad
            hh = "0" + hh;
        }

        let beforeNoon = timeStr.substr(n - 2).toLowerCase() == "am";
        if (beforeNoon) {
            if (hh == "12") { // 12 AM -> 00
                hh = "00";
            }

            return hh + ":" + mm;
        }

        if (hh == "12") { // 12 PM -> ok
            return hh + ":" + mm;
        }

        return (parseInt(hh, 10) + 12).toString() + ":" + mm;
    },

    destroyCurrentWeather: function() {
        if (this._currentWeather.get_child() !== null) {
            this._currentWeather.get_child().destroy();
        }
    },

    destroyFutureWeather: function() {
        if (this._futureWeather.get_child() !== null) {
            this._futureWeather.get_child().destroy();
        }
    },

    showLoadingUi: function() {
        this.destroyCurrentWeather();
        this.destroyFutureWeather();
        this._currentWeather.set_child(new St.Label({
            text: _("Loading current weather ...")
        }));
        this._futureWeather.set_child(new St.Label({
            text: _("Loading future weather ...")
        }));
    },

    rebuild: function() {
        this.showLoadingUi();
        this.rebuildCurrentWeatherUi();
        this.rebuildFutureWeatherUi();
    },

    rebuildCurrentWeatherUi: function() {
        this.destroyCurrentWeather();

        // This will hold the icon for the current weather
        this._currentWeatherIcon = new St.Icon({
            icon_type: this._icon_type,
            icon_size: 64,
            icon_name: APPLET_ICON,
            style_class: STYLE.ICON
        });

        // The summary of the current weather
        this._currentWeatherSummary = new St.Label({
            text: _("Loading ..."),
            style_class: STYLE.SUMMARY
        });

        this._currentWeatherLocation = new St.Button({
            reactive: true,
            label: _("Refresh"),
            style_class: STYLE.LOCATION_LINK
        });

        // link to the details page
        this._currentWeatherLocation.connect("clicked", () => {
            if (this._currentWeatherLocation.url === null) {
                this.refreshWeather(false);
            } else {
                Gio.app_info_launch_default_for_uri(
                    this._currentWeatherLocation.url,
                    global.create_app_launch_context()
                );
            }
        });

        let bb = new St.BoxLayout({
            vertical: true,
            style_class: STYLE.SUMMARYBOX
        });
        bb.add_actor(this._currentWeatherLocation);
        bb.add_actor(this._currentWeatherSummary);

        let textOb = {
            text: ELLIPSIS
        };
        this._currentWeatherSunrise = new St.Label(textOb);
        this._currentWeatherSunset = new St.Label(textOb);

        let ab = new St.BoxLayout({
            style_class: STYLE.ASTRONOMY
        });

        ab.add_actor(this._currentWeatherSunrise);
        let ab_spacerlabel = new St.Label({
            text: BLANK
        });
        ab.add_actor(ab_spacerlabel);
        ab.add_actor(this._currentWeatherSunset);

        let bb_spacerlabel = new St.Label({
            text: BLANK
        });
        bb.add_actor(bb_spacerlabel);
        bb.add_actor(ab);

        // Other labels
        this._currentWeatherTemperature = new St.Label(textOb);
        this._currentWeatherHumidity = new St.Label(textOb);
        this._currentWeatherPressure = new St.Label(textOb);
        this._currentWeatherWind = new St.Label(textOb);
        this._currentWeatherWindChill = new St.Label(textOb);

        let rb = new St.BoxLayout({
            style_class: STYLE.DATABOX
        });
        let rb_captions = new St.BoxLayout({
            vertical: true,
            style_class: STYLE.DATABOX_CAPTIONS
        });
        let rb_values = new St.BoxLayout({
            vertical: true,
            style_class: STYLE.DATABOX_VALUES
        });
        rb.add_actor(rb_captions);
        rb.add_actor(rb_values);

        rb_captions.add_actor(new St.Label({
            text: _("Temperature:")
        }));
        rb_values.add_actor(this._currentWeatherTemperature);
        rb_captions.add_actor(new St.Label({
            text: _("Humidity:")
        }));
        rb_values.add_actor(this._currentWeatherHumidity);
        rb_captions.add_actor(new St.Label({
            text: _("Pressure:")
        }));
        rb_values.add_actor(this._currentWeatherPressure);
        rb_captions.add_actor(new St.Label({
            text: _("Wind:")
        }));
        rb_values.add_actor(this._currentWeatherWind);
        rb_captions.add_actor(new St.Label({
            text: _("Wind Chill:")
        }));
        rb_values.add_actor(this._currentWeatherWindChill);

        let xb = new St.BoxLayout();
        xb.add_actor(bb);
        xb.add_actor(rb);

        let box = new St.BoxLayout({
            style_class: STYLE.ICONBOX
        });
        box.add_actor(this._currentWeatherIcon);
        box.add_actor(xb);
        this._currentWeather.set_child(box);
    },

    rebuildFutureWeatherUi: function() {
        this.destroyFutureWeather();

        this._forecast = [];
        this._forecastBox = new St.BoxLayout({
            vertical: this.pref_vertical_orientation
        });
        this._futureWeather.set_child(this._forecastBox);

        for (let i = 0; i < this.pref_forecast_days; i++) {
            let forecastWeather = {};

            forecastWeather.Icon = new St.Icon({
                icon_type: this._icon_type,
                icon_size: 48,
                icon_name: APPLET_ICON,
                style_class: STYLE.FORECAST_ICON
            });
            forecastWeather.Day = new St.Label({
                style_class: STYLE.FORECAST_DAY
            });
            forecastWeather.Summary = new St.Label({
                style_class: STYLE.FORECAST_SUMMARY
            });
            forecastWeather.Temperature = new St.Label({
                style_class: STYLE.FORECAST_TEMPERATURE
            });

            let by = new St.BoxLayout({
                vertical: true,
                style_class: STYLE.FORECAST_DATABOX
            });
            by.add_actor(forecastWeather.Day);
            by.add_actor(forecastWeather.Summary);
            by.add_actor(forecastWeather.Temperature);

            let bb = new St.BoxLayout({
                style_class: STYLE.FORECAST_BOX
            });
            bb.add_actor(forecastWeather.Icon);
            bb.add_actor(by);

            this._forecast[i] = forecastWeather;
            this._forecastBox.add_actor(bb);
        }
    },

    unitToUrl: function() {
        return this.pref_temperature_unit == WeatherUnits.FAHRENHEIT ? "f" : "c";
    },

    unitToUnicode: function() {
        return this.pref_temperature_unit == WeatherUnits.FAHRENHEIT ? "\u2109" : "\u2103";
    },

    weatherUrl: function() {
        let output = QUERY_URL + ' where woeid="' + this.pref_woeid + '" and u="' + this.unitToUrl() + '"';
        return output;
    },

    weatherIcon: function(code) {
        /* see http://developer.yahoo.com/weather/#codetable */
        /* fallback icons are: weather-clear-night weather-clear weather-few-clouds-night weather-few-clouds weather-fog weather-overcast weather-severe-alert weather-showers weather-showers-scattered weather-snow weather-storm */
        switch (parseInt(code, 10)) {
            case 0:
                /* tornado */
                return ["weather-severe-alert"];
            case 1:
                /* tropical storm */
                return ["weather-severe-alert"];
            case 2:
                /* hurricane */
                return ["weather-severe-alert"];
            case 3:
                /* severe thunderstorms */
                return ["weather-severe-alert"];
            case 4:
                /* thunderstorms */
                return ["weather-storm"];
            case 5:
                /* mixed rain and snow */
                return ["weather-snow-rain", "weather-snow"];
            case 6:
                /* mixed rain and sleet */
                return ["weather-snow-rain", "weather-snow"];
            case 7:
                /* mixed snow and sleet */
                return ["weather-snow"];
            case 8:
                /* freezing drizzle */
                return ["weather-freezing-rain", "weather-showers"];
            case 9:
                /* drizzle */
                return ["weather-fog"];
            case 10:
                /* freezing rain */
                return ["weather-freezing-rain", "weather-showers"];
            case 11:
                /* showers */
                return ["weather-showers"];
            case 12:
                /* showers */
                return ["weather-showers"];
            case 13:
                /* snow flurries */
                return ["weather-snow"];
            case 14:
                /* light snow showers */
                return ["weather-snow"];
            case 15:
                /* blowing snow */
                return ["weather-snow"];
            case 16:
                /* snow */
                return ["weather-snow"];
            case 17:
                /* hail */
                return ["weather-snow"];
            case 18:
                /* sleet */
                return ["weather-snow"];
            case 19:
                /* dust */
                return ["weather-fog"];
            case 20:
                /* foggy */
                return ["weather-fog"];
            case 21:
                /* haze */
                return ["weather-fog"];
            case 22:
                /* smoky */
                return ["weather-fog"];
            case 23:
                /* blustery */
                return ["weather-few-clouds"];
            case 24:
                /* windy */
                return ["weather-few-clouds"];
            case 25:
                /* cold */
                return ["weather-few-clouds"];
            case 26:
                /* cloudy */
                return ["weather-overcast"];
            case 27:
                /* mostly cloudy (night) */
                return ["weather-clouds-night", "weather-few-clouds-night"];
            case 28:
                /* mostly cloudy (day) */
                return ["weather-clouds", "weather-overcast"];
            case 29:
                /* partly cloudy (night) */
                return ["weather-few-clouds-night"];
            case 30:
                /* partly cloudy (day) */
                return ["weather-few-clouds"];
            case 31:
                /* clear (night) */
                return ["weather-clear-night"];
            case 32:
                /* sunny */
                return ["weather-clear"];
            case 33:
                /* fair (night) */
                return ["weather-clear-night"];
            case 34:
                /* fair (day) */
                return ["weather-clear"];
            case 35:
                /* mixed rain and hail */
                return ["weather-snow-rain", "weather-showers"];
            case 36:
                /* hot */
                return ["weather-clear"];
            case 37:
                /* isolated thunderstorms */
                return ["weather-storm"];
            case 38:
                /* scattered thunderstorms */
                return ["weather-storm"];
            case 39:
                /* http://developer.yahoo.com/forum/YDN-Documentation/Yahoo-Weather-API-Wrong-Condition-Code/1290534174000-1122fc3d-da6d-34a2-9fb9-d0863e6c5bc6 */
            case 40:
                /* scattered showers */
                return ["weather-showers-scattered", "weather-showers"];
            case 41:
                /* heavy snow */
                return ["weather-snow"];
            case 42:
                /* scattered snow showers */
                return ["weather-snow"];
            case 43:
                /* heavy snow */
                return ["weather-snow"];
            case 44:
                /* partly cloudy */
                return ["weather-few-clouds"];
            case 45:
                /* thundershowers */
                return ["weather-storm"];
            case 46:
                /* snow showers */
                return ["weather-snow"];
            case 47:
                /* isolated thundershowers */
                return ["weather-storm"];
            case 3200: // jshint ignore:line
                /* not available */
            default:
                return ["weather-severe-alert"];
        }
    },

    weatherIconSafely: function(code) {
        let iconname = this.weatherIcon(code);
        for (let i = 0; i < iconname.length; i++) {
            if (this.hasIcon(iconname[i])) {
                return iconname[i];
            }
        }
        return "weather-severe-alert";
    },

    hasIcon: function(icon) {
        return Gtk.IconTheme.get_default().has_icon(icon + (this._icon_type == St.IconType.SYMBOLIC ? "-symbolic" : ""));
    },

    nonempty: function(str) {
        return (str !== null && str.length > 0);
    },

    weatherCondition: function(code) {
        switch (parseInt(code, 10)) {
            case 0:
                /* tornado */
                return _("Tornado");
            case 1:
                /* tropical storm */
                return _("Tropical storm");
            case 2:
                /* hurricane */
                return _("Hurricane");
            case 3:
                /* severe thunderstorms */
                return _("Severe thunderstorms");
            case 4:
                /* thunderstorms */
                return _("Thunderstorms");
            case 5:
                /* mixed rain and snow */
                return _("Mixed rain and snow");
            case 6:
                /* mixed rain and sleet */
                return _("Mixed rain and sleet");
            case 7:
                /* mixed snow and sleet */
                return _("Mixed snow and sleet");
            case 8:
                /* freezing drizzle */
                return _("Freezing drizzle");
            case 9:
                /* drizzle */
                return _("Drizzle");
            case 10:
                /* freezing rain */
                return _("Freezing rain");
            case 11:
                /* showers */
                return _("Showers");
            case 12:
                /* showers */
                return _("Showers");
            case 13:
                /* snow flurries */
                return _("Snow flurries");
            case 14:
                /* light snow showers */
                return _("Light snow showers");
            case 15:
                /* blowing snow */
                return _("Blowing snow");
            case 16:
                /* snow */
                return _("Snow");
            case 17:
                /* hail */
                return _("Hail");
            case 18:
                /* sleet */
                return _("Sleet");
            case 19:
                /* dust */
                return _("Dust");
            case 20:
                /* foggy */
                return _("Foggy");
            case 21:
                /* haze */
                return _("Haze");
            case 22:
                /* smoky */
                return _("Smoky");
            case 23:
                /* blustery */
                return _("Blustery");
            case 24:
                /* windy */
                return _("Windy");
            case 25:
                /* cold */
                return _("Cold");
            case 26:
                /* cloudy */
                return _("Cloudy");
            case 27:
                /* mostly cloudy (night) */
            case 28:
                /* mostly cloudy (day) */
                return _("Mostly cloudy");
            case 29:
                /* partly cloudy (night) */
            case 30:
                /* partly cloudy (day) */
                return _("Partly cloudy");
            case 31:
                /* clear (night) */
                return _("Clear");
            case 32:
                /* sunny */
                return _("Sunny");
            case 33:
                /* fair (night) */
            case 34:
                /* fair (day) */
                return _("Fair");
            case 35:
                /* mixed rain and hail */
                return _("Mixed rain and hail");
            case 36:
                /* hot */
                return _("Hot");
            case 37:
                /* isolated thunderstorms */
                return _("Isolated thunderstorms");
            case 38:
                /* scattered thunderstorms */
                return _("Scattered thunderstorms");
            case 39:
                /* http://developer.yahoo.com/forum/YDN-Documentation/Yahoo-Weather-API-Wrong-Condition-Code/1290534174000-1122fc3d-da6d-34a2-9fb9-d0863e6c5bc6 */
            case 40:
                /* scattered showers */
                return _("Scattered showers");
            case 41:
                /* heavy snow */
                return _("Heavy snow");
            case 42:
                /* scattered snow showers */
                return _("Scattered snow showers");
            case 43:
                /* heavy snow */
                return _("Heavy snow");
            case 44:
                /* partly cloudy */
                return _("Partly cloudy");
            case 45:
                /* thundershowers */
                return _("Thundershowers");
            case 46:
                /* snow showers */
                return _("Snow showers");
            case 47:
                /* isolated thundershowers */
                return _("Isolated thundershowers");
            case 3200: // jshint ignore:line
                /* not available */
            default:
                return _("Not available");
        }
    },

    localeDay: function(abr) {
        let days = [_("Monday"), _("Tuesday"), _("Wednesday"), _("Thursday"), _("Friday"), _("Saturday"), _("Sunday")];
        return days[this.parseDay(abr)];
    },

    compassDirection: function(deg) {
        let directions = [_("N"), _("NE"), _("E"), _("SE"), _("S"), _("SW"), _("W"), _("NW")];
        return directions[Math.round(deg / 45) % directions.length];
    },

    formatAstronomyTime: function(astronomyJson, key) {
        let val = astronomyJson[key];
        let pad = this.normalizeMinutes(val);
        return this.pref_show_common_sense_hours ? (this.convertTo24(pad)) : pad;
    },

    _onSettingsChanged: function(aPrefValue, aPrefKey) {
        // Note: On Cinnamon versions greater than 3.2.x, two arguments are passed to the
        // settings callback instead of just one as in older versions. The first one is the
        // setting value and the second one is the user data. To workaround this nonsense,
        // check if the second argument is undefined to decide which
        // argument to use as the pref key depending on the Cinnamon version.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        // Remove the following variable and directly use the second argument.
        let pref_key = aPrefKey || aPrefValue;
        switch (pref_key) {
            case "pref_overlay_key":
                this._updateKeybindings();
                break;
            case "pref_location_label_override":
            case "pref_refresh_interval":
            case "pref_show_comment_in_panel":
            case "pref_vertical_orientation":
            case "pref_show_sunrise":
            case "pref_show_common_sense_hours":
            case "pref_forecast_days":
            case "pref_show_text_in_panel":
            case "pref_translate_condition":
            case "pref_temperature_unit":
            case "pref_temperature_high_first":
            case "pref_pressure_unit":
            case "pref_use_symbolic_icons":
            case "pref_wind_speed_unit":
            case "pref_woeid":
                this.refreshAndRebuild();
                break;
        }
    }
};

function main(aMetadata, aOrientation, aPanel_height, aInstance_id) {
    return new WeatherAppletForkByOdyseusApplet(aMetadata, aOrientation, aPanel_height, aInstance_id);
}
