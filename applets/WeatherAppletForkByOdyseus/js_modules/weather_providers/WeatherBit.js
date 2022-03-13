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
    Placeholders,
    ErrorMessages,
    WeatherBitSupportedLanguages,
    WeatherProviderNames,
    WeatherProviderDefaultParams
} = require("js_modules/constants.js");

const {
    getMoonPhase,
    WeatherProviderBase,
} = require("js_modules/utils.js");

const {
    OAuth
} = require("js_modules/oauth.js");

var Provider = class Provider extends WeatherProviderBase {
    constructor(aApplet, aOptions) {
        const options = Params.parse(aOptions, WeatherProviderDefaultParams);
        super(aApplet, {
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
            distanceUnit: "km"
        });

        this._twoHTTPRequests = true;

        const {
            latitude,
            longitude,
            cityID
        } = this._processLocationID();

        const appID = aApplet.$._.weatherbit_credential_app_id;

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

        const baseURL1 = "https://api.weatherbit.io/v2.0/current";
        const query_1 = {
            key: appID,
            units: "M",
            lang: options.languageID
        };

        if (cityID) {
            query_1["city_id"] = cityID;
        } else {
            query_1["lat"] = latitude;
            query_1["lon"] = longitude;
        }

        this._query_url_1 = OAuth.addToURL(baseURL1, query_1);
        this._headers_1 = {};

        // Forecast
        const baseURL2 = "https://api.weatherbit.io/v2.0/forecast/daily";
        const query_2 = {
            key: appID,
            units: "M",
            days: "16",
            lang: options.languageID
        };

        if (cityID) {
            query_2["city_id"] = cityID;
        } else {
            query_2["lat"] = latitude;
            query_2["lon"] = longitude;
        }

        this._query_url_2 = OAuth.addToURL(baseURL2, query_2);
        this._headers_2 = {};

        this._weather_details_url = null;
    }

    parseWeatherData(aResponseDataCurrent, aResponseDataForecasts) {
        const J = JSON.parse(aResponseDataCurrent)?.data?.[0];

        const locationInfo = [
            [_("Coordinates"), J?.lat + "," + J?.lon
            ],
            [_("Time zone"), J?.timezone]
        ];

        const currentWeather = {
            "cur_cond_code": J?.weather?.code,
            "cur_cond_text": J?.weather?.description || J?.weather?.code || null,
            "cur_pub_date": new Date(Number(J?.ts * 1000)).toString(),

            "curTemperature": J?.temp,
            "curHumidity": J?.rh,
            "curPressure": J?.pres,
            "curWind": {
                speed: J?.wind_spd,
                dir: this._compassDirection(J?.wind_dir)
            },
            "curWindChill": J?.app_temp,
            "curVisibility": J?.vis,
            /* NOTE: Times returned in UTC. Do not even bother fixing this nonsense!!!
             * F*ck every single web developer!!!!
             */
            "curSunrise": this.formatTime(J?.sunrise),
            "curSunset": this.formatTime(J?.sunset),
            "curMoonPhase": getMoonPhase()
        };

        const forecasts = [];
        let F = JSON.parse(aResponseDataForecasts)?.data;

        if (F !== null) {
            /* NOTE: Not really needed, but just to be sure...
             */
            F = F.sort((a, b) => {
                return a["ts"] > b["ts"];
            });

            let i = 0,
                iLen = F.length;
            for (; i < iLen; i++) {
                const date = F[i]?.ts;
                const fDate = new Date(Number(date * 1000));
                forecasts.push({
                    "code": F[i]?.weather?.code,
                    "date": date !== null ? fDate.toDateString() : Placeholders.ELLIPSIS,
                    "day": DayNamesByIndex[fDate.getDay()],
                    "high": F[i]?.max_temp,
                    "low": F[i]?.min_temp,
                    "text": F[i]?.weather?.description
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

    formatTime(aTimeString) {
        /* NOTE: Convert sunset/sunrise from 24 hours format to AM/PM.
         */
        let tmpArr = aTimeString.split(":"),
            time12;

        if (+tmpArr[0] === 12) {
            time12 = tmpArr[0] + ":" + tmpArr[1] + " pm";
        } else {
            if (+tmpArr[0] === "00") {
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

/* exported Provider
 */
