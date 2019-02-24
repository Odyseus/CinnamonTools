let $,
    SHA1;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
    SHA1 = require("./lib/sha1.js");
} else {
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
    SHA1 = imports.ui.appletManager.applets["{{UUID}}"].lib.sha1;
}

const _ = $._;

const {
    misc: {
        params: Params
    }
} = imports;

const {
    DayNamesByAbbr,
    Ellipsis,
    ErrorMessages,
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
            distanceUnit: "km",
        });

        let {
            latitude,
            longitude,
            cityID
        } = this._processLocationID();

        let {
            // Name of the preference/s that will store the API credentials.
            pref_credential_app_id: appID,
        } = aApplet;

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
        let baseURL = "https://api-url";
        // Default queries to attach to URL.
        let query = {
            format: "json",
            u: "c"
        };

        if (cityID) {
            query["city-id-query-name"] = cityID;
        } else {
            query["latitude-query-name"] = latitude;
            query["longitude-query-name"] = longitude;
        }

        /* NOTE: See YahooWeather.js for OAuth usage example.
         */
        this._query_url_1 = $.OAuth.addToURL(baseURL, query);
        this._headers_1 = {
            "Header-Key": "Header-Value",
        };
        this._weather_details_url = cityID ?
            "https://www.yahoo.com/news/weather/country/state/city-%s" :
            null;
    },

    parseWeatherData: function(aResponseData) {
        let J = JSON.parse(aResponseData);

        // An Array of Arrays with two elements. At index 0 the translated
        // label and at index 1 the value.
        // locationInfo is used to generate detailed tooltips to attach to the applet.
        let locationInfo = [
            [_("City ID"), $.safeGetEll(J, "location", "woeid")],
            [_("Coordinates"), $.safeGetEll(J, "location", "lat") + "," +
                $.safeGetEll(J, "location", "long")
            ],
            [_("Time zone"), $.safeGetEll(J, "location", "timezone_id")]
        ];

        let C = $.safeGet(J, "current_observation");
        let currentWeather = {
            "cur_cond_code": $.safeGetEll(C, "condition", "code"),
            "cur_cond_text": null,
            "cur_pub_date": new Date(Number($.safeGet(C, "pubDate") * 1000)).toString(),

            "curTemperature": $.safeGet(C, "condition", "temperature"),
            "curHumidity": $.safeGet(C, "atmosphere", "humidity"),
            "curPressure": $.safeGet(C, "atmosphere", "pressure"),
            "curWind": {
                speed: $.safeGet(C, "wind", "speed"),
                dir: this._compassDirection($.safeGet(C, "wind", "direction"))
            },
            "curWindChill": $.safeGet(C, "wind", "chill"),
            "curVisibility": $.safeGet(C, "atmosphere", "visibility"),
            "curSunrise": this.formatTime($.safeGet(C, "astronomy", "sunrise")),
            "curSunset": this.formatTime($.safeGet(C, "astronomy", "sunset")),
            "curMoonPhase": $.getMoonPhase(),
        };

        let forecasts = [];
        let F = $.safeGet(J, "forecasts");

        if (F !== null) {
            /* NOTE: Not really needed, but just to be sure...
             */
            F = F.sort((a, b) => {
                return a["date"] > b["date"];
            });

            let i = 0,
                iLen = F.length;
            for (; i < iLen; i++) {
                let date = $.safeGet(F[i], "date");
                let day = $.safeGet(F[i], "day");
                forecasts.push({
                    "code": $.safeGetEll(F[i], "code"),
                    "date": date !== null ? new Date(Number(date * 1000)).toDateString() : Ellipsis,
                    "day": day !== null ? DayNamesByAbbr[F[i].day.toLowerCase()] : Ellipsis,
                    "high": $.safeGetEll(F[i], "high"),
                    "low": $.safeGetEll(F[i], "low"),
                    "text": $.safeGetEll(F[i], "text")
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
        return aTimeString === null ? Ellipsis : this._normalizeMinutes(aTimeString);
    }
};
