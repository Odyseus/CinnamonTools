let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
}

const _ = $._;

const {
    misc: {
        params: Params
    }
} = imports;

const {
    DayNamesByIndex,
    Ellipsis,
    ErrorMessages,
    WeatherBitSupportedLanguages,
    WeatherProviderNames,
    WeatherProviderDefaultParams
} = $.Constants;

function Provider() {
    this._init.apply(this, arguments);
}

Provider.prototype = {
    __proto__: $.WeatherProviderBase.prototype,

    _init: function(aApplet, aOptions) {
        let options = Params.parse(aOptions, WeatherProviderDefaultParams);
        $.WeatherProviderBase.prototype._init.call(this, aApplet, {
            providerName: WeatherProviderNames["WeatherBit"],
            providerID: "WeatherBit",
            website: "https://www.weatherbit.io",
            locationID: options.locationID,
            languageID: options.languageID,
            locationName: options.locationName,
            forecastDays: options.forecastDays,
            forecastRowsCols: options.forecastRowsCols,
            maxForecastsSupport: 16,
            tempUnit: "celsius",
            pressureUnit: "mbar",
            windSpeedUnit: "m/s",
            distanceUnit: "km",
        });

        this._twoHTTPRequests = true;

        let {
            latitude,
            longitude,
            cityID
        } = this._processLocationID();

        let {
            pref_weatherbit_credential_app_id: appID,
        } = aApplet;

        if (!appID) {
            this._error = ErrorMessages.MISSING_CREDENTIALS;
            return;
        }

        if (!cityID && !latitude && !longitude) {
            this._error = ErrorMessages.ID_FORMAT;
            return;
        }

        if (!WeatherBitSupportedLanguages.has(options.languageID)) {
            this._error = ErrorMessages.NOT_SUPPORTED_LANGUAGE +
                "[%s]".format(options.languageID);
            return;
        }

        let baseURL1 = "https://api.weatherbit.io/v2.0/current";
        let query_1 = {
            key: appID,
            units: "M",
            lang: options.languageID,
        };

        if (cityID) {
            query_1["city_id"] = cityID;
        } else {
            query_1["lat"] = latitude;
            query_1["lon"] = longitude;
        }

        this._query_url_1 = $.OAuth.addToURL(baseURL1, query_1);
        this._headers_1 = {};

        // Forecast
        let baseURL2 = "https://api.weatherbit.io/v2.0/forecast/daily";
        let query_2 = {
            key: appID,
            units: "M",
            lang: options.languageID,
        };

        if (cityID) {
            query_2["city_id"] = cityID;
        } else {
            query_2["lat"] = latitude;
            query_2["lon"] = longitude;
        }

        this._query_url_2 = $.OAuth.addToURL(baseURL2, query_2);
        this._headers_2 = {};

        this._weather_details_url = null;
    },

    parseWeatherData: function(aResponseDataCurrent, aResponseDataForecasts) {
        let J = $.safeGetEll(JSON.parse(aResponseDataCurrent), "data")[0];

        let locationInfo = [
            [_("Location name"), $.safeGetEll(J, "city_name")],
            [_("Coordinates"), $.safeGetEll(J, "lat") + "," +
                $.safeGetEll(J, "lon")
            ],
            [_("Time zone"), $.safeGetEll(J, "timezone")]
        ];

        let currentWeather = {
            "cur_cond_code": $.safeGetEll(J, "weather", "code"),
            "cur_cond_text": $.safeGetEll(J, "weather", "description") || $.safeGetEll(J, "weather", "code") || null,
            "cur_pub_date": new Date(Number($.safeGet(J, "ts") * 1000)).toString(),

            "curTemperature": $.safeGet(J, "temp"),
            "curHumidity": $.safeGet(J, "rh"),
            "curPressure": $.safeGet(J, "pres"),
            "curWind": {
                speed: $.safeGet(J, "wind_spd"),
                dir: this._compassDirection($.safeGet(J, "wind_dir"))
            },
            "curWindChill": $.safeGet(J, "app_temp"),
            "curVisibility": $.safeGet(J, "vis"),
            /* NOTE: Times returned in UTC. Do not even bother fixing this nonsense!!!
             * F*ck every single web developer!!!!
             */
            "curSunrise": this.formatTime($.safeGet(J, "sunrise")),
            "curSunset": this.formatTime($.safeGet(J, "sunset")),
            "curMoonPhase": $.getMoonPhase(this.applet.pref_abbreviated_moon_phases),
        };

        let forecasts = [];
        let F = $.safeGet(JSON.parse(aResponseDataForecasts), "data");

        if (F !== null) {
            /* NOTE: Not really needed, but just to be sure...
             */
            F = F.sort((a, b) => {
                return a["ts"] > b["ts"];
            });

            let i = 0,
                iLen = F.length;
            for (; i < iLen; i++) {
                let date = $.safeGet(F[i], "ts");
                let fDate = new Date(Number(date * 1000));
                forecasts.push({
                    "code": $.safeGetEll(F[i], "weather", "code"),
                    "date": date !== null ? fDate.toDateString() : Ellipsis,
                    "day": DayNamesByIndex[fDate.getDay()],
                    "high": $.safeGetEll(F[i], "max_temp"),
                    "low": $.safeGetEll(F[i], "min_temp"),
                    "text": $.safeGetEll(F[i], "weather", "description")
                });
            }
        }

        return {
            locationInfo: locationInfo,
            currentWeather: currentWeather,
            forecasts: forecasts,
            lastCheck: new Date().getTime()
        };
    },

    formatTime: function(aTimeString) {
        /* NOTE: Convert sunset/sunrise from 24 hours format to AM/PM.
         */
        let tmpArr = aTimeString.split(":"),
            time12;

        if (+tmpArr[0] == 12) {
            time12 = tmpArr[0] + ":" + tmpArr[1] + " pm";
        } else {
            if (+tmpArr[0] == "00") {
                time12 = "12:" + tmpArr[1] + " am";
            } else {
                if (+tmpArr[0] > 12) {
                    time12 = (+tmpArr[0] - 12) + ":" + tmpArr[1] + " pm";
                } else {
                    time12 = (+tmpArr[0]) + ":" + tmpArr[1] + " am";
                }
            }
        }

        return time12;
    }
};
