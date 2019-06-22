let $,
    SHA1,
    Constants;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
    SHA1 = require("./lib/sha1.js");
    Constants = require("./constants.js");
} else {
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
    SHA1 = imports.ui.appletManager.applets["{{UUID}}"].lib.sha1;
    Constants = imports.ui.appletManager.applets["{{UUID}}"].constants;
}

const {
    misc: {
        params: Params
    }
} = imports;

const {
    _,
    DayNamesByAbbr,
    ErrorMessages,
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
            providerName: WeatherProviderNames["YahooWeather"],
            providerID: "YahooWeather",
            website: "https://www.yahoo.com/?ilc=401",
            locationID: options.locationID,
            languageID: options.languageID,
            locationName: options.locationName,
            forecastDays: options.forecastDays,
            forecastRowsCols: options.forecastRowsCols,
            maxForecastsSupport: 10,
            tempUnit: "celsius",
            pressureUnit: "mbar",
            windSpeedUnit: "kph",
            distanceUnit: "km"
        });

        let {
            latitude,
            longitude,
            cityID
        } = this._processLocationID();

        let {
            pref_yahoo_credential_app_id: appID,
            pref_yahoo_credential_client_id: consumerKey,
            pref_yahoo_credential_client_secret: consumerSecret
        } = aApplet;

        if (!appID || !consumerKey || !consumerSecret) {
            this._error = ErrorMessages.MISSING_CREDENTIALS;
            return;
        }

        if (!cityID && !latitude && !longitude) {
            this._error = ErrorMessages.ID_FORMAT;
            return;
        }

        let baseURL = "https://weather-ydn-yql.media.yahoo.com/forecastrss";
        let query = {
            format: "json",
            u: "c"
        };

        if (cityID) {
            query["woeid"] = cityID;
        } else {
            query["lat"] = latitude;
            query["long"] = longitude;
        }

        let oauth = {
            oauth_consumer_key: consumerKey,
            oauth_nonce: $.OAuth.nonce(11),
            oauth_signature_method: "HMAC-SHA1",
            oauth_timestamp: $.OAuth.timestamp(),
            oauth_version: "1.0"
        };
        let params = {};

        for (let key in oauth) {
            params[key] = oauth[key];
        }

        for (let key in query) {
            params[key] = query[key];
        }

        let base_info = $.OAuth.buildBaseString(
            baseURL,
            "GET",
            params);
        let composite_key = $.OAuth.percentEncode(consumerSecret) + "&";
        let oauth_signature = SHA1.b64_hmac_sha1(composite_key, base_info);
        oauth["oauth_signature"] = oauth_signature;

        this._query_url_1 = $.OAuth.addToURL(baseURL, query);
        this._headers_1 = {
            "Yahoo-App-Id": appID,
            "Authorization": $.OAuth.buildAuthorizationHeader(oauth),
            "Content-Type": "application/json"
        };
        this._weather_details_url = cityID ?
            "https://www.yahoo.com/news/weather/country/state/city-%s" :
            null;
    },

    parseWeatherData: function(aResponseData) {
        let J = JSON.parse(aResponseData);

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
            "curMoonPhase": $.getMoonPhase()
        };

        let forecasts = [];
        let F = $.safeGet(J, "forecasts");

        if (F !== null) {
            /* NOTE: Sorting not really needed, but just to be sure...
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
                    "date": date !== null ? new Date(Number(date * 1000)).toDateString() : Placeholders.ELLIPSIS,
                    "day": day !== null ? DayNamesByAbbr[F[i].day.toLowerCase()] : Placeholders.ELLIPSIS,
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
        try {
            return aTimeString ? this._normalizeMinutes(aTimeString) : Placeholders.ELLIPSIS;
        } catch (aErr) {}

        return Placeholders.ELLIPSIS;
    }
};
