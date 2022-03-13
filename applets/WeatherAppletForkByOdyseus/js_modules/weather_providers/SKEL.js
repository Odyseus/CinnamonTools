const SHA1 = require("js_modules/sha1.js"); // jshint ignore:line

const {
    misc: {
        params: Params
    }
} = imports;

const {
    _
} = require("js_modules/globalUtils.js");

const {
    DayNamesByAbbr,
    Placeholders,
    ErrorMessages,
    WeatherProviderNames,
    WeatherProviderDefaultParams
} = require("js_modules/constants.js");

const {
    getMoonPhase,
    WeatherProviderBase,
} = require("js_modules/utils.js");

const {
    OAuth,
} = require("js_modules/oauth.js");

var Provider = class Provider extends WeatherProviderBase {
    constructor(aApplet, aOptions) {
        const options = Params.parse(aOptions, WeatherProviderDefaultParams);
        super(aApplet, {
            providerName: WeatherProviderNames["ProviderID"],
            providerID: "ProviderID",
            website: "provider-url",
            locationID: options.locationID,
            languageID: options.languageID,
            locationName: options.locationName,
            forecastDays: options.forecastDays,
            forecastRowsCols: options.forecastRowsCols,
            // Maximum number of forecast days returned by API call
            maxForecastsSupport: 10,
            // Unit returned by API call.
            tempUnit: "celsius",
            // Unit returned by API call.
            pressureUnit: "mbar",
            // Unit returned by API call.
            windSpeedUnit: "kph",
            // Unit returned by API call.
            distanceUnit: "km"
        });

        const {
            latitude,
            longitude,
            cityID
        } = this._processLocationID();

        // Name of the preference/s that will store the API credentials.
        const appID = aApplet.$._.credential_app_id;

        // If one of more of the credential fields are missing,
        // stop initialization and store the error message to be
        // displayed in the applet menu.
        if (!appID) {
            this._error = ErrorMessages.MISSING_CREDENTIALS;
            return;
        }

        // If no ID can be obtained, stop initialization and store
        // the error message to be displayed in the applet menu.
        if (!cityID && !latitude && !longitude) {
            this._error = ErrorMessages.ID_FORMAT;
            return;
        }

        // URL to contact to make API calls.
        const baseURL = "https://api-url";
        // Default queries to attach to URL.
        const query = {
            format: "json",
            u: "c"
        };

        if (cityID) {
            query["city-id-query-name"] = cityID;
        } else {
            query["latitude-query-name"] = latitude;
            query["longitude-query-name"] = longitude;
        }

        /* NOTE: See WeatherBit.js for OAuth usage example.
         */
        this._query_url_1 = OAuth.addToURL(baseURL, query);
        this._headers_1 = {
            "Header-Key": "Header-Value"
        };
        this._weather_details_url = cityID ?
            "https://www.yahoo.com/news/weather/country/state/city-%s" :
            null;
    }

    parseWeatherData(aResponseData) {
        let J = JSON.parse(aResponseData);

        // An Array of Arrays with two elements. At index 0 the translated
        // label and at index 1 the value.
        // locationInfo is used to generate detailed tooltips to attach to the applet.
        let locationInfo = [
            [_("City ID"), J?.location?.woeid],
            [_("Coordinates"), J?.location?.lat + "," + J?.location?.long],
            [_("Time zone"), J?.location?.timezone_id]
        ];

        let C = J?.current_observation;
        let currentWeather = {
            "cur_cond_code": C?.condition?.code,
            "cur_cond_text": null,
            "cur_pub_date": new Date(Number(C?.pubDate * 1000)).toString(),

            "curTemperature": C?.condition?.temperature,
            "curHumidity": C?.atmosphere?.humidity,
            "curPressure": C?.atmosphere?.pressure,
            "curWind": {
                speed: C?.wind?.speed,
                dir: this._compassDirection(C?.wind?.direction)
            },
            "curWindChill": C?.wind?.chill,
            "curVisibility": C?.atmosphere?.visibility,
            "curSunrise": this.formatTime(C?.astronomy?.sunrise),
            "curSunset": this.formatTime(C?.astronomy?.sunset),
            "curMoonPhase": getMoonPhase()
        };

        let forecasts = [];
        let F = J?.forecasts;

        if (F !== null) {
            /* NOTE: Not really needed, but just to be sure...
             */
            F = F.sort((a, b) => {
                return a["date"] > b["date"];
            });

            let i = 0,
                iLen = F.length;
            for (; i < iLen; i++) {
                let date = F[i]?.date;
                let day = F[i]?.day;
                forecasts.push({
                    "code": F[i]?.code,
                    "date": (date !== null ?
                        new Date(Number(date * 1000)).toDateString() :
                        Placeholders.ELLIPSIS),
                    "day": (day !== null ?
                        DayNamesByAbbr[F[i].day.toLowerCase()] :
                        Placeholders.ELLIPSIS),
                    "high": F[i]?.high,
                    "low": F[i]?.low,
                    "text": F[i]?.text
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
