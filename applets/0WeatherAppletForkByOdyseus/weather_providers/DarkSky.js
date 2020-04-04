// {{IMPORTER}}

const $ = __import("utils.js");
const Constants = __import("constants.js");

const {
    misc: {
        params: Params
    }
} = imports;

const {
    _,
    DarkSkySupportedLanguages,
    DayNamesByIndex,
    ErrorMessages,
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
            providerName: WeatherProviderNames["DarkSky"],
            providerID: "DarkSky",
            website: "https://darksky.net/poweredby",
            locationID: options.locationID,
            languageID: options.languageID,
            locationName: options.locationName,
            forecastDays: options.forecastDays,
            forecastRowsCols: options.forecastRowsCols,
            maxForecastsSupport: 7,
            tempUnit: "celsius",
            pressureUnit: "hPa",
            windSpeedUnit: "kph",
            distanceUnit: "km"
        });

        let {
            latitude,
            longitude,
            cityID
        } = this._processLocationID();

        let {
            pref_darksky_credential_app_id: appID
        } = aApplet;

        if (!appID) {
            this._error = ErrorMessages.MISSING_CREDENTIALS;
            return;
        }

        if (cityID) {
            this._error = ErrorMessages.ID_FORMAT;
            return;
        }

        if (!DarkSkySupportedLanguages.has(options.languageID)) {
            this._error = ErrorMessages.NOT_SUPPORTED_LANGUAGE +
                " [%s]".format(options.languageID);
            return;
        }

        let baseURL = "https://api.darksky.net/forecast/%s/%s,%s".format(
            appID, latitude, longitude
        );
        let query = {
            exclude: "minutely,hourly,alerts,flags",
            units: "ca",
            lang: this.languageID
        };

        this._query_url_1 = $.OAuth.addToURL(baseURL, query);
        this._headers_1 = {};

        this._weather_details_url = !cityID ?
            "https://darksky.net/forecast/%s" :
            null;
    },

    parseWeatherData: function(aResponseData) {
        let J = JSON.parse(aResponseData);

        let locationInfo = [
            [_("Coordinates"), $.safeGetEll(J, "latitude") + "," +
                $.safeGetEll(J, "longitude")
            ],
            [_("Time zone"), $.safeGetEll(J, "timezone")]
        ];

        let C = $.safeGet(J, "currently");
        let F = $.safeGet(J, "daily", "data");

        let currentWeather = {
            "cur_cond_code": $.safeGetEll(C, "icon"),
            "cur_cond_text": $.safeGet(C, "summary") || _("Clear"),
            "cur_pub_date": new Date(Number($.safeGet(C, "time") * 1000)).toString(),

            "curTemperature": $.safeGet(C, "temperature"),
            "curHumidity": Math.round($.safeGet(C, "humidity") * 100),
            "curPressure": $.safeGet(C, "pressure"),
            "curWind": {
                speed: $.safeGetEll(C, "windSpeed"),
                dir: this._compassDirection($.safeGet(C, "windBearing"))
            },
            "curWindChill": $.safeGet(C, "apparentTemperature"),
            "curVisibility": $.safeGet(C, "visibility"),
            "curSunrise": this.formatTime($.safeGet(F[0], "sunriseTime")),
            "curSunset": this.formatTime($.safeGet(F[0], "sunsetTime")),
            "curMoonPhase": $.getMoonPhase()
        };

        let forecasts = [];

        if (F !== null) {
            /* NOTE: Sorting not really needed, but just to be sure...
             */
            F = F.sort((a, b) => {
                return a["time"] > b["time"];
            });

            let i = 0,
                iLen = F.length;
            for (; i < iLen; i++) {
                let fDate = new Date(Number($.safeGet(F[i], "time") * 1000));
                forecasts.push({
                    "code": $.safeGetEll(F[i], "icon"),
                    "date": fDate.toDateString(),
                    "day": DayNamesByIndex[fDate.getDay()],
                    "high": $.safeGetEll(F[i], "temperatureHigh"),
                    "low": $.safeGetEll(F[i], "temperatureLow"),
                    "text": $.safeGetEll(F[i], "summary")
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
