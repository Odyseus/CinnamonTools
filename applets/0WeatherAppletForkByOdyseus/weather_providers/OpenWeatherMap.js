let $,
    Constants;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
    Constants = require("./constants.js");
} else {
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
    Constants = imports.ui.appletManager.applets["{{UUID}}"].constants;
}

const {
    misc: {
        params: Params
    }
} = imports;

const {
    _,
    DayNamesByIndex,
    ErrorMessages,
    OpenWeatherMapSupportedLanguages,
    Placeholders,
    WeatherProviderNames,
    WeatherProviderDefaultParams
} = Constants;

function Provider() {
    this._init.apply(this, arguments);
}

Provider.prototype = {
    __proto__: $.WeatherProviderBase.prototype,

    _init: function(aApplet, aOptions) {
        let options = Params.parse(aOptions, WeatherProviderDefaultParams);
        $.WeatherProviderBase.prototype._init.call(this, aApplet, {
            providerName: WeatherProviderNames["OpenWeatherMap"],
            providerID: "OpenWeatherMap",
            website: "https://openweathermap.org",
            locationID: options.locationID,
            languageID: options.languageID,
            locationName: options.locationName,
            forecastDays: options.forecastDays,
            forecastRowsCols: options.forecastRowsCols,
            maxForecastsSupport: 5,
            tempUnit: "celsius",
            pressureUnit: "hPa",
            windSpeedUnit: "m/s",
            distanceUnit: "km"
        });

        this._twoHTTPRequests = true;

        let {
            latitude,
            longitude,
            cityID
        } = this._processLocationID();

        let {
            pref_open_weather_map_credential_app_id: appID
        } = aApplet;

        if (!appID) {
            this._error = ErrorMessages.MISSING_CREDENTIALS;
            return;
        }

        if (!cityID && !latitude && !longitude) {
            this._error = ErrorMessages.ID_FORMAT;
            return;
        }

        if (!OpenWeatherMapSupportedLanguages.has(options.languageID)) {
            this._error = ErrorMessages.NOT_SUPPORTED_LANGUAGE +
                "[%s]".format(options.languageID);
            return;
        }

        let baseURL1 = "https://api.openweathermap.org/data/2.5/weather";
        let query_1 = {
            APPID: appID,
            mode: "json",
            units: "metric",
            lang: options.languageID
        };

        if (cityID) {
            query_1["id"] = cityID;
        } else {
            query_1["lat"] = latitude;
            query_1["lon"] = longitude;
        }

        this._query_url_1 = $.OAuth.addToURL(baseURL1, query_1);
        this._headers_1 = {};

        // Forecast
        let baseURL2 = "http://api.openweathermap.org/data/2.5/forecast";
        let query_2 = {
            APPID: appID,
            mode: "json",
            units: "metric",
            lang: options.languageID
        };

        if (cityID) {
            query_2["id"] = cityID;
        } else {
            query_2["lat"] = latitude;
            query_2["lon"] = longitude;
        }

        this._query_url_2 = $.OAuth.addToURL(baseURL2, query_2);
        this._headers_2 = {};

        this._weather_details_url = cityID ?
            "https://openweathermap.org/city/%s" :
            null;
    },

    parseWeatherData: function(aResponseDataCurrent, aResponseDataForecasts) {
        let C = JSON.parse(aResponseDataCurrent);

        let locationInfo = [
            [_("City ID"), $.safeGetEll(C, "id")],
            [_("Coordinates"), $.safeGetEll(C, "coord", "lat") + "," +
                $.safeGetEll(C, "coord", "lon")
            ]
        ];

        let w = $.safeGet(C, "weather");

        let currentWeather = {
            "cur_cond_code": w !== null ? $.safeGetEll(w[0], "id") : Placeholders.ELLIPSIS,
            /* NOTE: Fall back to getting the description based on condition ID.
             */
            "cur_cond_text": w !== null ? $.safeGetEll(w[0], "description") : null,
            "cur_pub_date": new Date(Number($.safeGet(C, "dt") * 1000)).toString(),

            "curTemperature": $.safeGet(C, "main", "temp"),
            "curHumidity": $.safeGet(C, "main", "humidity"),
            "curPressure": $.safeGet(C, "main", "pressure"),
            "curWind": {
                speed: $.safeGet(C, "wind", "speed"),
                dir: this._compassDirection($.safeGet(C, "wind", "deg"))
            },
            "curWindChill": null,
            "curVisibility": null,
            "curSunrise": this.formatTime($.safeGet(C, "sys", "sunrise")),
            "curSunset": this.formatTime($.safeGet(C, "sys", "sunset")),
            "curMoonPhase": $.getMoonPhase()
        };

        let forecasts = [];
        let F = JSON.parse(aResponseDataForecasts).list;

        if (F !== null) {
            /* NOTE: Sorting not really needed, but just to be sure...
             */
            F = F.sort((a, b) => {
                return a["dt"] > b["dt"];
            });

            let control = new Set();

            let i = 0,
                iLen = F.length;
            for (; i < iLen; i++) {
                let date = $.safeGet(F[i], "dt");
                let fDate = new Date(Number(date * 1000));
                let controlDay = fDate.getDay();

                if (control.has(controlDay)) {
                    continue;
                }

                control.add(controlDay);

                let weather = $.safeGet(F[i], "weather");
                forecasts.push({
                    "code": weather !== null ? $.safeGetEll(weather[0], "id") : Placeholders.ELLIPSIS,
                    "date": fDate.toDateString(),
                    "day": DayNamesByIndex[controlDay],
                    "high": $.safeGetEll(F[i], "main", "temp_max"),
                    "low": $.safeGetEll(F[i], "main", "temp_min"),
                    /* NOTE: Fall back to getting the description based on condition ID.
                     */
                    "text": weather !== null ? $.safeGetEll(weather[0], "description") : null
                });
            }
        }

        return {
            locationInfo: locationInfo,
            currentWeather: currentWeather,
            forecasts: forecasts,
            lastCheck: new Date().getTime()
        };
    }
};
