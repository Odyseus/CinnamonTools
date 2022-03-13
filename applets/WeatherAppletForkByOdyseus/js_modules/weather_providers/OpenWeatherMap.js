const {
    misc: {
        params: Params
    }
} = imports;

const {
    _
} = require("js_modules/globalUtils.js");

const {
    DayNamesByIndex,
    ErrorMessages,
    OpenWeatherMapSupportedLanguages,
    Placeholders,
    WeatherProviderNames,
    WeatherProviderDefaultParams
} = require("js_modules/constants.js");

const {
    getMoonPhase,
    WeatherProviderBase
} = require("js_modules/utils.js");

const {
    OAuth
} = require("js_modules/oauth.js");

var Provider = class Provider extends WeatherProviderBase {
    constructor(aApplet, aOptions) {
        const options = Params.parse(aOptions, WeatherProviderDefaultParams);
        super(aApplet, {
            providerName: WeatherProviderNames["OpenWeatherMap"],
            providerID: "OpenWeatherMap",
            website: "https://openweathermap.org",
            locationID: options.locationID,
            languageID: options.languageID,
            locationName: options.locationName,
            forecastDays: options.forecastDays,
            forecastRowsCols: options.forecastRowsCols,
            maxForecastsSupport: 16,
            tempUnit: "celsius",
            pressureUnit: "hPa",
            windSpeedUnit: "m/s",
            distanceUnit: "km"
        });

        this._twoHTTPRequests = true;

        const {
            latitude,
            longitude,
            cityID
        } = this._processLocationID();

        const appID = aApplet.$._.open_weather_map_credential_app_id;

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

        const baseURL1 = "https://api.openweathermap.org/data/2.5/weather";
        const query_1 = {
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

        this._query_url_1 = OAuth.addToURL(baseURL1, query_1);
        this._headers_1 = {};

        // Forecast
        const baseURL2 = "https://api.openweathermap.org/data/2.5/forecast/daily";
        const query_2 = {
            APPID: appID,
            mode: "json",
            cnt: "16",
            units: "metric",
            lang: options.languageID
        };

        if (cityID) {
            query_2["id"] = cityID;
        } else {
            query_2["lat"] = latitude;
            query_2["lon"] = longitude;
        }

        this._query_url_2 = OAuth.addToURL(baseURL2, query_2);
        this._headers_2 = {};

        this._weather_details_url = cityID ?
            "https://openweathermap.org/city/%s" :
            null;
    }

    parseWeatherData(aResponseDataCurrent, aResponseDataForecasts) {
        const C = JSON.parse(aResponseDataCurrent);

        const locationInfo = [
            [_("City ID"), C?.id],
            [_("Coordinates"), C?.coord?.lat + "," + C?.coord?.lon]
        ];

        const w = C?.weather;

        const currentWeather = {
            "cur_cond_code": w ? w?.[0]?.id : Placeholders.ELLIPSIS,
            /* NOTE: Fall back to getting the description based on condition ID.
             */
            "cur_cond_text": w ? w?.[0]?.description : null,
            "cur_pub_date": new Date(Number(C?.dt * 1000)).toString(),

            "curTemperature": C?.main?.temp,
            "curHumidity": C?.main?.temp?.humidity,
            "curPressure": C?.main?.temp?.pressure,
            "curWind": {
                speed: C?.wind?.speed,
                dir: this._compassDirection(C?.wind?.deg)
            },
            "curWindChill": null,
            "curVisibility": null,
            "curSunrise": this.formatTime(C?.sys?.sunrise),
            "curSunset": this.formatTime(C?.sys?.sunset),
            "curMoonPhase": getMoonPhase()
        };

        const forecasts = [];
        let F = JSON.parse(aResponseDataForecasts).list;

        if (F !== null) {
            /* NOTE: Sorting not really needed, but just to be sure...
             */
            F = F.sort((a, b) => {
                return a["dt"] > b["dt"];
            });

            const control = new Set();

            let i = 0,
                iLen = F.length;
            for (; i < iLen; i++) {
                const date = F[i]?.dt;
                const fDate = new Date(Number(date * 1000));

                if (control.has(date)) {
                    continue;
                }

                control.add(date);

                const weather = F[i]?.weather;
                forecasts.push({
                    "code": weather !== null ? weather[0]?.id : Placeholders.ELLIPSIS,
                    "date": fDate.toDateString(),
                    "day": DayNamesByIndex[fDate.getDay()],
                    "high": F[i]?.temp?.max,
                    "low": F[i]?.temp?.min,
                    /* NOTE: Fall back to getting the description based on condition ID.
                     */
                    "text": weather !== null ? weather[0]?.description : null
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

/* exported Provider
 */
