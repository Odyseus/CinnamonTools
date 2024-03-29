var {
    _
} = require("js_modules/globalUtils.js");

var APPLET_PREFS = [
    "toggle_menu_keybinding",
    "current_weather_icon_size",
    "forecasts_icon_size",
    "refresh_interval",
    "show_current_condition_in_panel",
    "menu_orientation",
    "show_common_sense_hours",
    "show_current_temperature_in_panel",
    "temperature_unit",
    "temperature_high_first",
    "forecats_display_dates",
    "pressure_unit",
    "applet_icon_type",
    "menu_icon_type",
    "wind_speed_unit",
    "distance_unit",
    "current_location",
    "weather_data",
    "open_weather_map_credential_app_id",
    "weatherbit_credential_app_id",
    "locations_storage",
    "locations_storage_apply",
    "initial_load_done",
    "menu_theme",
    "menu_theme_path_custom",
    "icon_theme",
    "icon_theme_path_custom"
];
// Conditions.
const Conditions = {
    BLOWING_SNOW: _("Blowing snow"),
    BLUSTERY: _("Blustery"),
    CLEAR: _("Clear"),
    CLOUDY: _("Cloudy"),
    COLD: _("Cold"),
    DRIZZLE: _("Drizzle"),
    DUST: _("Dust"),
    FAIR: _("Fair"),
    FOGGY: _("Foggy"),
    FREEZING_DRIZZLE: _("Freezing drizzle"),
    FREEZING_RAIN: _("Freezing rain"),
    HAIL: _("Hail"),
    HAZE: _("Haze"),
    HEAVY_SNOW: _("Heavy snow"),
    HOT: _("Hot"),
    HURRICANE: _("Hurricane"),
    ISOLATED_THUNDERSHOWERS: _("Isolated thundershowers"),
    ISOLATED_THUNDERSTORMS: _("Isolated thunderstorms"),
    LIGHT_SNOW_SHOWERS: _("Light snow showers"),
    MIXED_RAIN_AND_HAIL: _("Mixed rain and hail"),
    MIXED_RAIN_AND_SLEET: _("Mixed rain and sleet"),
    MIXED_RAIN_AND_SNOW: _("Mixed rain and snow"),
    MIXED_SNOW_AND_SLEET: _("Mixed snow and sleet"),
    MOSTLY_CLOUDY: _("Mostly cloudy"),
    PARTLY_CLOUDY: _("Partly cloudy"),
    SCATTERED_SHOWERS: _("Scattered showers"),
    SCATTERED_SNOW_SHOWERS: _("Scattered snow showers"),
    SCATTERED_THUNDERSTORMS: _("Scattered thunderstorms"),
    SEVERE_THUNDERSTORMS: _("Severe thunderstorms"),
    SHOWERS: _("Showers"),
    SLEET: _("Sleet"),
    SMOKY: _("Smoky"),
    SNOW_FLURRIES: _("Snow flurries"),
    SNOW_SHOWERS: _("Snow showers"),
    SNOW: _("Snow"),
    SUNNY: _("Sunny"),
    THUNDERSHOWERS: _("Thundershowers"),
    THUNDERSTORMS: _("Thunderstorms"),
    TORNADO: _("Tornado"),
    TROPICAL_STORM: _("Tropical storm"),
    WINDY: _("Windy"),

    THUNDERSTORM_WITH_LIGHT_RAIN: _("Thunderstorm with light rain"),
    THUNDERSTORM_WITH_RAIN: _("Thunderstorm with rain"),
    THUNDERSTORM_WITH_HEAVY_RAIN: _("Thunderstorm with heavy rain"),
    LIGHT_THUNDERSTORM: _("Light thunderstorm"),
    THUNDERSTORM: _("Thunderstorm"),
    HEAVY_THUNDERSTORM: _("Heavy thunderstorm"),
    RAGGED_THUNDERSTORM: _("Ragged thunderstorm"),
    THUNDERSTORM_WITH_LIGHT_DRIZZLE: _("Thunderstorm with light drizzle"),
    THUNDERSTORM_WITH_DRIZZLE: _("Thunderstorm with drizzle"),
    THUNDERSTORM_WITH_HEAVY_DRIZZLE: _("Thunderstorm with heavy drizzle"),
    LIGHT_INTENSITY_DRIZZLE: _("Light intensity drizzle"),
    HEAVY_INTENSITY_DRIZZLE: _("Heavy intensity drizzle"),
    LIGHT_INTENSITY_DRIZZLE_RAIN: _("Light intensity drizzle rain"),
    DRIZZLE_RAIN: _("Drizzle rain"),
    HEAVY_INTENSITY_DRIZZLE_RAIN: _("Heavy intensity drizzle rain"),
    SHOWER_RAIN_AND_DRIZZLE: _("Shower rain and drizzle"),
    HEAVY_SHOWER_RAIN_AND_DRIZZLE: _("Heavy shower rain and drizzle"),
    SHOWER_DRIZZLE: _("Shower drizzle"),
    LIGHT_RAIN: _("Light rain"),
    MODERATE_RAIN: _("Moderate rain"),
    HEAVY_INTENSITY_RAIN: _("Heavy intensity rain"),
    VERY_HEAVY_RAIN: _("Very heavy rain"),
    EXTREME_RAIN: _("Extreme rain"),
    LIGHT_INTENSITY_SHOWER_RAIN: _("Light intensity shower rain"),
    SHOWER_RAIN: _("Shower rain"),
    HEAVY_INTENSITY_SHOWER_RAIN: _("Heavy intensity shower rain"),
    RAGGED_SHOWER_RAIN: _("Ragged shower rain"),
    LIGHT_SNOW: _("Light snow"),
    SHOWER_SLEET: _("Shower sleet"),
    LIGHT_RAIN_AND_SNOW: _("Light rain and snow"),
    RAIN_AND_SNOW: _("Rain and snow"),
    LIGHT_SHOWER_SNOW: _("Light shower snow"),
    SHOWER_SNOW: _("Shower snow"),
    HEAVY_SHOWER_SNOW: _("Heavy shower snow"),
    MIST: _("Mist"),
    SMOKE: _("Smoke"),
    SAND_DUST_WHIRLS: _("Sand, dust whirls"),
    FOG: _("Fog"),
    SAND: _("Sand"),
    VOLCANIC_ASH: _("Volcanic ash"),
    SQUALLS: _("Squalls"),
    CLEAR_SKY: _("Clear sky"),
    FEW_CLOUDS: _("Few clouds"),
    SCATTERED_CLOUDS: _("Scattered clouds"),
    BROKEN_CLOUDS: _("Broken clouds"),
    OVERCAST_CLOUDS: _("Overcast clouds"),

    THUNDERSTORM_WITH_HAIL: _("Thunderstorm with Hail"),
    FREEZING_FOG: _("Freezing Fog")
};

// NOTE: This is a dummy variable used to store unit abbreviations to expose them
// for localization.
const UnitAbbreviations = [
    _("km"),
    _("mile"),
    _("atm"),
    _("hPa"),
    _("inHg"),
    _("kPa"),
    _("mbar"),
    _("mmHg"),
    _("Pa"),
    _("psi"),
    _("knots"),
    _("kph"),
    _("mph"),
    _("m/s")
];

var URLs = {
    OPEN_WEATHER_MAP_FIND: "https://openweathermap.org/find",
    OPEN_WEATHER_MAP_API_INSTRUCTIONS: "https://openweathermap.org/appid"
};

var OrnamentType = {
    NONE: 0,
    CHECK: 1,
    DOT: 2,
    ICON: 3
};

var WeatherProviderDefaultParams = Object.freeze({
    locationName: "",
    locationID: "",
    providerID: "",
    languageID: "",
    forecastDays: 5,
    forecastRowsCols: 1
});

// Placeholder strings.
var Placeholders = {
    BLANK: "   ",
    ELLIPSIS: "...",
    LOADING: _("Loading...")
};

var KnownStatusCodes = {
    2: "(2) " + _("Unable to resolve destination host name"),
    307: "(307) " + _("Temporary redirect"),
    3: "(3) " + _("Unable to resolve proxy host name"),
    400: "(400) " + _("Bad request"),
    401: "(401) " + _("Unauthorized"),
    402: "(402) " + _("Payment required"),
    404: "(404) " + _("Not found"),
    407: "(407) " + _("Proxy authentication required"),
    408: "(408) " + _("Request timeout"),
    4: "(4) " + _("Unable to connect to remote host"),
    500: "(500) " + _("Internal server error"),
    502: "(502) " + _("Bad Gateway"),
    503: "(503) " + _("Service unavailable"),
    504: "(504) " + _("Gateway Timeout"),
    5: "(5) " + _("Unable to connect to proxy"),
    6: "(6) " + _("SSL/TLS negotiation failed"),
    7: "(7) " + _("A network error occurred, or the other end closed the connection unexpectedly")
};

// Error messages.
var ErrorMessages = {
    MISSING_CREDENTIALS: _("Missing credentials for weather provider!"),
    ID_FORMAT: _("Wrong location ID format!"),
    NOT_SUPPORTED_LANGUAGE: _("Selected language not supported by weather provider!"),
    FAILED_RESPONSE: _("Error getting data! Status code: %s"),
    FAILED_PARSING_WEATHER: _("Error parsing weather data.")
};

// Day names.
var DayNamesByAbbr = {
    sun: _("Sunday"),
    mon: _("Monday"),
    tue: _("Tuesday"),
    wed: _("Wednesday"),
    thu: _("Thursday"),
    fri: _("Friday"),
    sat: _("Saturday")
};

var DayNamesByIndex = {
    0: DayNamesByAbbr.sun,
    1: DayNamesByAbbr.mon,
    2: DayNamesByAbbr.tue,
    3: DayNamesByAbbr.wed,
    4: DayNamesByAbbr.thu,
    5: DayNamesByAbbr.fri,
    6: DayNamesByAbbr.sat
};

var WeatherProviderNames = {
    YahooWeather: _("Yahoo! Weather"),
    OpenWeatherMap: _("OpenWeatherMap"),
    WeatherBit: _("WeatherBit")
};

// Icons.
var Icons = {
    CLEAR: "weather-clear",
    CLEAR_NIGHT: "weather-clear-night",
    CLOUDS: "weather-clouds",
    CLOUDS_NIGHT: "weather-clouds-night",
    FEW_CLOUDS: "weather-few-clouds",
    FEW_CLOUDS_NIGHT: "weather-few-clouds-night",
    FOG: "weather-fog",
    FREEZING_RAIN: "weather-freezing-rain",
    OVERCAST: "weather-overcast",
    REFRESH_ICON: "view-refresh-symbolic",
    SEVERE_ALERT: "weather-severe-alert",
    SHOWERS: "weather-showers",
    SHOWERS_SCATTERED: "weather-showers-scattered",
    SNOW: "weather-snow",
    SNOW_RAIN: "weather-snow-rain",
    STORM: "weather-storm"
};

// CSS classes.
var CssClasses = {
    CURRENT: "weather-current",
    CURRENT_ICON: "weather-current-icon",
    CURRENT_ICON_BOX: "weather-current-iconbox",
    CURRENT_LOCATION_BUTTON: "weather-current-location-button",
    CURRENT_SUMMARY: "weather-current-summary",
    CURRENT_SUMMARY_BOX: "weather-current-summary-box",
    CURRENT_SUMMARY_DETAILS_BOX: "weather-current-summary-details-box",
    CURRENT_SUMMARY_DETAILS_TITLE: "weather-current-summary-details-title",
    CURRENT_SUMMARY_DETAILS_VALUE: "weather-current-summary-details-value",
    ERROR_BOX: "weather-error-box",
    ERROR_MESSAGE: "weather-error-message",
    FOOTER_BOX: "weather-footer-box",
    FOOTER_BUTTON: "weather-footer-button",
    FORECAST: "weather-forecast",
    FORECAST_BOX: "weather-forecast-box",
    FORECAST_DATA_BOX: "weather-forecast-data-box",
    FORECAST_DAY: "weather-forecast-day",
    FORECAST_ICON: "weather-forecast-icon",
    FORECAST_SUMMARY: "weather-forecast-summary",
    FORECAST_TEMPERATURE: "weather-forecast-temperature",
    POPUP_SEPARATOR_MENU_ITEM: "popup-separator-menu-item",
    WEATHER_MENU: "weather-menu"
};

var SumaryDetailLabels = {
    curTemperature: _("Temperature"),
    curHumidity: _("Humidity"),
    curPressure: _("Pressure"),
    curWind: _("Wind"),
    curWindChill: _("Wind chill"),
    curVisibility: _("Visibility"),
    curSunrise: _("Sunrise"),
    curSunset: _("Sunset"),
    curMoonPhase: _("Moon phase")
};

var Units = {
    DISTANCE: {
        KM: "km",
        MILE: "mile"
    },
    PRESSURE: {
        ATM: "atm",
        HPA: "hPa",
        INHG: "inHg",
        KPA: "kPa",
        MBAR: "mbar",
        MMHG: "mmHg",
        PA: "Pa",
        PSI: "psi"
    },
    TEMPERATURE: {
        CELSIUS: "celsius",
        FAHRENHEIT: "fahrenheit",
        KELVIN: "kelvin"
    },
    WIND_SPEED: {
        KNOTS: "knots",
        KPH: "kph",
        MPH: "mph",
        MPS: "m/s"
    }
};

var QtyTempUnits = {
    celsius: "tempC",
    fahrenheit: "tempF",
    kelvin: "tempK"
};

var OpenWeatherMapConditionData = {
    // thunderstorm with light rain
    200: {
        icon: [Icons.STORM],
        name: Conditions.THUNDERSTORM_WITH_LIGHT_RAIN
    },
    // thunderstorm with rain
    201: {
        icon: [Icons.STORM],
        name: Conditions.THUNDERSTORM_WITH_RAIN
    },
    // thunderstorm with heavy rain
    202: {
        icon: [Icons.STORM],
        name: Conditions.THUNDERSTORM_WITH_HEAVY_RAIN
    },
    // light thunderstorm
    210: {
        icon: [Icons.STORM],
        name: Conditions.LIGHT_THUNDERSTORM
    },
    // thunderstorm
    211: {
        icon: [Icons.STORM],
        name: Conditions.THUNDERSTORM
    },
    // heavy thunderstorm
    212: {
        icon: [Icons.STORM],
        name: Conditions.HEAVY_THUNDERSTORM
    },
    // ragged thunderstorm
    221: {
        icon: [Icons.STORM],
        name: Conditions.RAGGED_THUNDERSTORM
    },
    // thunderstorm with light drizzle
    230: {
        icon: [Icons.STORM],
        name: Conditions.THUNDERSTORM_WITH_LIGHT_DRIZZLE
    },
    // thunderstorm with drizzle
    231: {
        icon: [Icons.STORM],
        name: Conditions.THUNDERSTORM_WITH_DRIZZLE
    },
    // thunderstorm with heavy drizzle
    232: {
        icon: [Icons.STORM],
        name: Conditions.THUNDERSTORM_WITH_HEAVY_DRIZZLE
    },
    // light intensity drizzle
    300: {
        icon: [Icons.SHOWERS],
        name: Conditions.LIGHT_INTENSITY_DRIZZLE
    },
    // drizzle
    301: {
        icon: [Icons.SHOWERS],
        name: Conditions.DRIZZLE
    },
    // heavy intensity drizzle
    302: {
        icon: [Icons.SHOWERS],
        name: Conditions.HEAVY_INTENSITY_DRIZZLE
    },
    // light intensity drizzle rain
    310: {
        icon: [Icons.SHOWERS],
        name: Conditions.LIGHT_INTENSITY_DRIZZLE_RAIN
    },
    // drizzle rain
    311: {
        icon: [Icons.SHOWERS],
        name: Conditions.DRIZZLE_RAIN
    },
    // heavy intensity drizzle rain
    312: {
        icon: [Icons.SHOWERS],
        name: Conditions.HEAVY_INTENSITY_DRIZZLE_RAIN
    },
    // shower rain and drizzle
    313: {
        icon: [Icons.SHOWERS],
        name: Conditions.SHOWER_RAIN_AND_DRIZZLE
    },
    // heavy shower rain and drizzle
    314: {
        icon: [Icons.SHOWERS],
        name: Conditions.HEAVY_SHOWER_RAIN_AND_DRIZZLE
    },
    // shower drizzle
    321: {
        icon: [Icons.SHOWERS],
        name: Conditions.SHOWER_DRIZZLE
    },
    // light rain
    500: {
        icon: [Icons.SHOWERS],
        name: Conditions.LIGHT_RAIN
    },
    // moderate rain
    501: {
        icon: [Icons.SHOWERS],
        name: Conditions.MODERATE_RAIN
    },
    // heavy intensity rain
    502: {
        icon: [Icons.SHOWERS],
        name: Conditions.HEAVY_INTENSITY_RAIN
    },
    // very heavy rain
    503: {
        icon: [Icons.SHOWERS],
        name: Conditions.VERY_HEAVY_RAIN
    },
    // extreme rain
    504: {
        icon: [Icons.SHOWERS],
        name: Conditions.EXTREME_RAIN
    },
    // freezing rain
    511: {
        icon: [Icons.FREEZING_RAIN],
        name: Conditions.FREEZING_RAIN
    },
    // light intensity shower rain
    520: {
        icon: [Icons.SHOWERS],
        name: Conditions.LIGHT_INTENSITY_SHOWER_RAIN
    },
    // shower rain
    521: {
        icon: [Icons.SHOWERS],
        name: Conditions.SHOWER_RAIN
    },
    // heavy intensity shower rain
    522: {
        icon: [Icons.SHOWERS],
        name: Conditions.HEAVY_INTENSITY_SHOWER_RAIN
    },
    // ragged shower rain
    531: {
        icon: [Icons.SHOWERS],
        name: Conditions.RAGGED_SHOWER_RAIN
    },
    // light snow
    600: {
        icon: [Icons.SNOW],
        name: Conditions.LIGHT_SNOW
    },
    // snow
    601: {
        icon: [Icons.SNOW],
        name: Conditions.SNOW
    },
    // heavy snow
    602: {
        icon: [Icons.SNOW],
        name: Conditions.HEAVY_SNOW
    },
    // sleet
    611: {
        icon: [Icons.SNOW_RAIN, Icons.SNOW],
        name: Conditions.SLEET
    },
    // shower sleet
    612: {
        icon: [Icons.SNOW_RAIN, Icons.SNOW],
        name: Conditions.SHOWER_SLEET
    },
    // light rain and snow
    615: {
        icon: [Icons.SNOW_RAIN, Icons.SNOW],
        name: Conditions.LIGHT_RAIN_AND_SNOW
    },
    // rain and snow
    616: {
        icon: [Icons.SNOW_RAIN, Icons.SNOW],
        name: Conditions.RAIN_AND_SNOW
    },
    // light shower snow
    620: {
        icon: [Icons.SNOW_RAIN, Icons.SNOW],
        name: Conditions.LIGHT_SHOWER_SNOW
    },
    // shower snow
    621: {
        icon: [Icons.SNOW_RAIN, Icons.SNOW],
        name: Conditions.SHOWER_SNOW
    },
    // heavy shower snow
    622: {
        icon: [Icons.SNOW_RAIN, Icons.SNOW],
        name: Conditions.HEAVY_SHOWER_SNOW
    },
    // mist
    701: {
        icon: [Icons.FOG],
        name: Conditions.MIST
    },
    // smoke
    711: {
        icon: [Icons.FOG],
        name: Conditions.SMOKE
    },
    // haze
    721: {
        icon: [Icons.FOG],
        name: Conditions.HAZE
    },
    // sand, dust whirls
    731: {
        icon: [Icons.FOG],
        name: Conditions.SAND_DUST_WHIRLS
    },
    // fog
    741: {
        icon: [Icons.FOG],
        name: Conditions.FOG
    },
    // sand
    751: {
        icon: [Icons.FOG],
        name: Conditions.SAND
    },
    // dust
    761: {
        icon: [Icons.FOG],
        name: Conditions.DUST
    },
    // volcanic ash
    762: {
        icon: [Icons.FOG],
        name: Conditions.VOLCANIC_ASH
    },
    // squalls
    771: {
        icon: [Icons.FOG],
        name: Conditions.SQUALLS
    },
    // tornado
    781: {
        icon: [Icons.SEVERE_ALERT],
        name: Conditions.TORNADO
    },
    // clear sky
    800: {
        icon: [Icons.CLEAR],
        name: Conditions.CLEAR_SKY
    },
    // few clouds
    801: {
        icon: [Icons.FEW_CLOUDS],
        name: Conditions.FEW_CLOUDS
    },
    // scattered clouds
    802: {
        icon: [Icons.SCATTERED_CLOUDS],
        name: Conditions.SCATTERED_CLOUDS
    },
    // broken clouds
    803: {
        icon: [Icons.SCATTERED_CLOUDS],
        name: Conditions.BROKEN_CLOUDS
    },
    // overcast clouds
    804: {
        icon: [Icons.FEW_CLOUDS],
        name: Conditions.OVERCAST_CLOUDS
    }
};

/* WeatherBit codes.
 *
 * Exactly the same as OpenWeatherMap.
 *
 * 200     Thunderstorm with light rain
 * 201     Thunderstorm with rain
 * 202     Thunderstorm with heavy rain
 * 230     Thunderstorm with light drizzle
 * 231     Thunderstorm with drizzle
 * 232     Thunderstorm with heavy drizzle
 * 300     Light Drizzle
 * 301     Drizzle
 * 302     Heavy Drizzle
 * 500     Light Rain
 * 501     Moderate Rain
 * 502     Heavy Rain
 * 511     Freezing rain
 * 520     Light shower rain
 * 521     Shower rain
 * 522     Heavy shower rain
 * 600     Light snow
 * 601     Snow
 * 602     Heavy Snow
 * 611     Sleet
 * 612     Heavy sleet
 * 621     Snow shower
 * 622     Heavy snow shower
 * 711     Smoke
 * 721     Haze
 * 731     Sand/dust
 * 741     Fog
 * 800     Clear sky
 * 801     Few clouds
 * 802     Scattered clouds
 * 803     Broken clouds
 * 804     Overcast clouds
 * 900     Unknown Precipitation
 *
 * Different from OpenWeatherMap.
 *
 * 233     Thunderstorm with Hail
 * 610     Mix snow/rain
 * 623     Flurries
 * 700     Mist
 * 751     Freezing Fog
 */
// Stick with the JSON trick. Do not use Object.assign().
var WeatherBitConditionData = JSON.parse(JSON.stringify(OpenWeatherMapConditionData));
WeatherBitConditionData[233] = {
    icon: [Icons.STORM],
    name: Conditions.THUNDERSTORM_WITH_HAIL
};
WeatherBitConditionData[610] = {
    icon: [Icons.SNOW_RAIN, Icons.SNOW],
    name: Conditions.MIXED_RAIN_AND_SNOW
};
WeatherBitConditionData[623] = {
    icon: [Icons.SNOW],
    name: Conditions.SNOW_FLURRIES
};
WeatherBitConditionData[700] = {
    icon: [Icons.FOG],
    name: Conditions.MIST
};
/* NOTE: This one overrides the one from OpenWeatherMap.
 */
WeatherBitConditionData[751] = {
    icon: [Icons.FOG],
    name: Conditions.FREEZING_FOG
};

var OpenWeatherMapSupportedLanguages = new Set([
    "af",
    "al",
    "ar",
    "az",
    "bg",
    "ca",
    "cz",
    "da",
    "de",
    "el",
    "en",
    "es",
    "eu",
    "fa",
    "fi",
    "fr",
    "gl",
    "he",
    "hi",
    "hr",
    "hu",
    "id",
    "it",
    "ja",
    "kr",
    "la",
    "lt",
    "mk",
    "nl",
    "no",
    "pl",
    "pt",
    "pt",
    "ro",
    "ru",
    "se",
    "sk",
    "sl",
    "sp",
    "sr",
    "sv",
    "th",
    "tr",
    "ua",
    "uk",
    "vi",
    "zh_cn",
    "zh_tw",
    "zu"
]);

var WeatherBitSupportedLanguages = new Set([
    "ar",
    "az",
    "be",
    "bg",
    "bs",
    "ca",
    "cz",
    "da",
    "de",
    "el",
    "en",
    "es",
    "et",
    "fi",
    "fr",
    "hr",
    "hu",
    "id",
    "is",
    "it",
    "iw",
    "ja",
    "kw",
    "lt",
    "nb",
    "nl",
    "pl",
    "pt",
    "ro",
    "ru",
    "sk",
    "sl",
    "sr",
    "sv",
    "tr",
    "uk",
    "zh",
    "zh-tw"
]);

/* exported CssClasses,
            UnitAbbreviations,
            DayNamesByIndex,
            DebugManagerSchema,
            ErrorMessages,
            KnownStatusCodes,
            LoggingLevel,
            OpenWeatherMapConditionData,
            WeatherBitConditionData,
            OpenWeatherMapSupportedLanguages,
            WeatherBitSupportedLanguages,
            OrnamentType,
            Placeholders,
            WeatherProviderDefaultParams,
            WeatherProviderNames,
            QtyTempUnits,
            SumaryDetailLabels,
            Units,
            URLs,
            APPLET_PREFS,
 */
