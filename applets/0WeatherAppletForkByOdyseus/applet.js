/* FIXME: The quantities and sha1 libraries are a stric mode nightmare.
 * Try to tweak them to make them not vomit millions of useless warnings.
 * Or "simply" look for other libraries. ¬¬
 * I barelly find out of this because Cinnamon's import mechanism using
 * require is an absolute garbage!!! &%$·%()/&% WEB DEVELOPERS!!!!
 * NOTE: Do not even think about adding automatic location lookup until
 * I can use async/await (around 2021). By that time, I might have already
 * fed up with all the nonsense that happen in Cinnamon, so why the hell bother!
 */

let $,
    Qty;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
    Qty = require("./lib/quantities.js").Qty;
} else {
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
    Qty = imports.ui.appletManager.applets["{{UUID}}"].lib.quantities.Qty;
}

const _ = $._;
const DebugManager = new $.DebugManager();

const {
    cairo: Cairo,
    gi: {
        Cinnamon,
        Clutter,
        Gio,
        Gtk,
        Pango,
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
        messageTray: MessageTray,
        popupMenu: PopupMenu,
        settings: Settings,
        tweener: Tweener
    }
} = imports;

const {
    CssClasses: CLASS,
    Icons,
    NotificationsUrgency,
    Placeholders,
    QtyTempUnits,
    SumaryDetailLabels,
    Units: {
        // DISTANCE: DistanceUnits,
        // TEMPERATURE: TempUnits,
        // WIND_SPEED: WindSpeedUnits,
        PRESSURE: PressureUnits
    },
} = $.Constants;

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

        try {
            this.tooltip = new $.CustomPanelTooltip(this, _("Click to open"), this.orientation);
        } catch (aErr) {
            this.tooltip = null;
            global.logError("Error while initializing tooltip: " + aErr.message);
        }

        this._initializeSettings(() => {
            this._expandAppletContextMenu();
            this._initSoupSession();
        }, () => {
            this.theme = null;
            this.stylesheet = null;
            this.load_theme_id = 0;
            this.prototypeDebuggersAttached = false;
            this.desktopNotification = null;
            this.weatherProvider = null;
            this.locationsMap = null;
            this._forecast = [];
            this._locationInfo = [];
            this._notificationSource = null;
            this._notificationParams = {
                titleMarkup: true,
                bannerMarkup: true,
                bodyMarkup: true,
                clear: true
            };

            this.set_applet_icon_name(Icons.REFRESH_ICON);
            this.set_applet_label(Placeholders.ELLIPSIS);

            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menu = new Applet.AppletPopupMenu(this, this.orientation);
            this.menuManager.addMenu(this.menu);
            this.menu.connect("open-state-changed", () => {
                this.locationSelectorMenu.isOpen &&
                    this.locationSelectorMenu.close();
            });

            if (typeof this.menu.setCustomStyleClass === "function") {
                this.menu.setCustomStyleClass(CLASS.WEATHER_MENU);
            } else {
                this.menu.actor.add_style_class_name(CLASS.WEATHER_MENU);
            }

            this.updateLocationsMap();
            this._updateKeybindings();
            this.createMainContainers();
            this.rebuild();
            this._startRefreshWeatherLoop();
            this._loadTheme();

            if (!this.pref_initial_load_done) {
                this.pref_initial_load_done = true;
                this._notifyMessage(
                    _("Read the help page"),
                    _("This applet requires valid credentials from any of the weather provider services for it to work."),
                    NotificationsUrgency.CRITICAL
                );
            }

            Main.themeManager.connect("theme-set", () => {
                this._loadTheme();
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
            "pref_current_weather_icon_size",
            "pref_forecasts_icon_size",
            "pref_refresh_interval",
            "pref_show_current_condition_in_panel",
            "pref_menu_orientation",
            "pref_show_common_sense_hours",
            "pref_show_current_temperature_in_panel",
            "pref_temperature_unit",
            "pref_temperature_high_first",
            "pref_forecats_display_dates",
            "pref_pressure_unit",
            "pref_applet_icon_type",
            "pref_menu_icon_type",
            "pref_wind_speed_unit",
            "pref_distance_unit",
            "pref_current_location",
            "pref_weather_data",
            "pref_enable_verbose_logging",
            "pref_darksky_credential_app_id",
            "pref_open_weather_map_credential_app_id",
            "pref_yahoo_credential_app_id",
            "pref_yahoo_credential_client_id",
            "pref_yahoo_credential_client_secret",
            "pref_locations_storage",
            "trigger_reload_locations",
            "pref_initial_load_done",
            "pref_menu_theme",
            "pref_menu_theme_path_custom",
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

    _expandAppletContextMenu: function() {
        let menuItem = new PopupMenu.PopupIconMenuItem(_("Open locations manager"),
            "edit-copy", St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => {
            this._openLocationsManager();
        });
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(_("Copy current location data"),
            "edit-copy", St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => {
            let clipboard = St.Clipboard.get_default();

            if (St.ClipboardType) {
                clipboard.set_text(St.ClipboardType.CLIPBOARD, this._getReadableLocationData(false));
            } else {
                clipboard.set_text(this._getReadableLocationData(false));
            }
        });
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(_("Help"),
            "dialog-information", St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => {
            this._openHelpPage();
        });
        this._applet_context_menu.addMenuItem(menuItem);
    },

    _initSoupSession: function() {
        /* NOTE: Supposedly, Soup.SessionAsync is deprecated. And supposedly,
         * Soup.Session.queue_message is asynchronous by default and it has a
         * proxy resolver by default. But Soup.Session feels ultra slow!!!
         * So, I will keep using Soup.SessionAsync with a fallback to
         * Soup.Session just in case.
         */
        try {
            this._httpSession = new Soup.SessionAsync();

            Soup.Session.prototype.add_feature.call(
                this._httpSession,
                new Soup.ProxyResolverDefault()
            );
        } catch (aErr) {
            this.pref_enable_verbose_logging && global.logError(aErr);
            this._httpSession = new Soup.Session();
        }

        this._httpSession.user_agent = "Mozilla/5.0";
        this._httpSession.timeout = 10;

        if (this.pref_enable_verbose_logging) {
            const SoupLogger = Soup.Logger.new(Soup.LoggerLogLevel.HEADERS |
                Soup.LoggerLogLevel.BODY, -1);

            Soup.Session.prototype.add_feature.call(
                this._httpSession,
                SoupLogger
            );
            SoupLogger.set_printer(this.soupPrinter);
        }
    },

    soupPrinter: function(aLog, aLevel = null, aDirection = null, aData = null) {
        /* WARNING: The context inside this function (this) isn't the applet.
         */
        if (aLevel && aDirection && aData) {
            global.log(String(aData));
        }
    },

    createMainContainers: function() {
        let mainBox = new St.BoxLayout({
            vertical: true
        });
        this.menu.addActor(mainBox);

        // Error message box.
        this._errorBox = new St.Bin({
            style_class: CLASS.ERROR_BOX
        });

        this._errorMessage = new St.Button({
            can_focus: false,
            reactive: true,
            label: Placeholders.BLANK,
            style_class: CLASS.ERROR_MESSAGE
        });

        this._errorMessage.get_child().set_line_wrap(true);
        this._errorMessage.get_child().set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        this._errorMessage.get_child().ellipsize = Pango.EllipsizeMode.NONE; // Just in case

        this._connectEnterLeaveEvents(this._errorMessage);
        this._errorMessage.connect("clicked", () => {
            let clipboard = St.Clipboard.get_default();

            if (St.ClipboardType) {
                clipboard.set_text(St.ClipboardType.CLIPBOARD, this._errorMessage.label);
            } else {
                clipboard.set_text(this._errorMessage.label);
            }
        });
        this._errorMessage._tooltip = new $.CustomTooltip(
            this._errorMessage,
            _("Click to copy error to clipboard.") + "\n" +
            _("Look at the logs for details.") +
            "\n~/.cinnamon/glass.log - ~/.xsession-errors"
        );

        this._errorBox.set_child(this._errorMessage);
        this._errorBox.hide();

        // Today's forecast
        this._currentWeather = new St.Bin({
            style_class: CLASS.CURRENT
        });

        // Separators.
        let sep1 = new PopupMenu.PopupSeparatorMenuItem();
        let sep2 = new PopupMenu.PopupSeparatorMenuItem();
        /* NOTE: A PopupSeparatorMenuItem is an instance of PopupBaseMenuItem.
         * PopupBaseMenuItem has the popup-menu-item class that, depending on the
         * theme used, it adds margins to the separator. Removing the popup-menu-item
         * class will allow the separator to fill the menu width.
         */
        sep1.actor.remove_style_class_name("popup-menu-item");
        sep2.actor.remove_style_class_name("popup-menu-item");

        // Tomorrow's forecast
        this._futureWeather = new St.Bin({
            style_class: CLASS.FORECAST
        });

        // Footer box.
        let footerBox = new St.BoxLayout({
            style_class: CLASS.FOOTER_BOX
        });

        // Refresh weather button.
        this._refreshButton = new St.Button({
            can_focus: true,
            reactive: true,
            label: _("Refresh"),
            style_class: CLASS.FOOTER_BUTTON
        });
        this._refreshButton._refDate = null;
        this._refreshButton.connect("clicked",
            () => {
                this._animateLocationSwitch("hide", () => {
                    this.refreshAndRebuild(true);
                });
            });
        this._connectEnterLeaveEvents(this._refreshButton);
        this._refreshButton._tooltip = new $.CustomTooltip(
            this._refreshButton,
            _("Click to refresh weather data")
        );

        // Attribution button.
        this._poweredButton = new St.Button({
            can_focus: true,
            reactive: true,
            label: Placeholders.ELLIPSIS,
            style_class: CLASS.FOOTER_BUTTON
        });
        this._poweredButton.connect("clicked", () => {
            this.menu.close();
            this._xdgOpen(this.weatherProvider.website);
        });
        this._connectEnterLeaveEvents(this._poweredButton);

        footerBox.add(this._refreshButton, {
            x_fill: false,
            x_align: St.Align.START,
            y_align: St.Align.MIDDLE,
            y_fill: false,
            expand: true
        });
        footerBox.add(new St.Label({
            text: Placeholders.BLANK
        }), {
            x_fill: true,
            expand: true
        });

        let locationSelectorButton = new St.Button({
            can_focus: true,
            reactive: true,
            child: new St.Icon({
                icon_type: St.IconType.SYMBOLIC,
                icon_size: 12,
                icon_name: "weather-applet-hamburger-menu"
            }),
            style_class: CLASS.FOOTER_BUTTON
        });
        locationSelectorButton.connect("clicked", () => {
            this.locationSelectorMenu.isOpen ?
                this.locationSelectorMenu.close(true) :
                this.locationSelectorMenu.open(false);
        });
        this._connectEnterLeaveEvents(locationSelectorButton);

        this.locationSelectorMenu = new $.LocationSelectorMenu(this, locationSelectorButton);
        this.locationSelectorMenu.populateMenu();

        footerBox.add(locationSelectorButton, {
            x_align: St.Align.START,
            x_fill: false,
            expand: false
        });

        footerBox.add(new St.Label({
            text: Placeholders.BLANK
        }), {
            x_fill: true,
            expand: true
        });

        /* NOTE: Keep this commented block.
         */
        // // TEST
        // let errorTest = new St.Button({
        //     can_focus: true,
        //     reactive: true,
        //     label: "ERROR",
        //     style_class: CLASS.FOOTER_BUTTON
        // });
        // errorTest.connect("clicked", () => {
        //     this.displayErrorMessage("This is a very long error message. This is a very long error message. This is a very long error message. This is a very long error message.", "error", false);
        // });
        // let warningTest = new St.Button({
        //     can_focus: true,
        //     reactive: true,
        //     label: "WARNING",
        //     style_class: CLASS.FOOTER_BUTTON
        // });
        // warningTest.connect("clicked", () => {
        //     this.displayErrorMessage("This is a warning", "warning", false);
        // });
        // let appendTest = new St.Button({
        //     can_focus: true,
        //     reactive: true,
        //     label: "WARNING",
        //     style_class: CLASS.FOOTER_BUTTON
        // });
        // appendTest.connect("clicked", () => {
        //     this.displayErrorMessage("This is a another warning", "warning", true);
        // });
        // footerBox.add(errorTest);
        // footerBox.add(warningTest);
        // footerBox.add(appendTest);
        // // TEST

        footerBox.add(this._poweredButton, {
            x_fill: false,
            x_align: St.Align.END,
            y_align: St.Align.MIDDLE,
            y_fill: false,
            expand: true
        });

        mainBox.add_actor(this._errorBox);
        mainBox.add_actor(this._currentWeather);
        mainBox.add_actor(sep1.actor);
        mainBox.add_actor(this._futureWeather);
        mainBox.add_actor(sep2.actor);
        mainBox.add_actor(this.locationSelectorMenu.actor);
        mainBox.add_actor(footerBox);
    },

    _animateLocationSwitch: function(aAction, aOnCompleteCallback) {
        let params = {
            opacity: aAction === "show" ? 255 : 0,
            transition: aAction === "show" ? "easeInQuad" : "easeOutQuad",
            time: 0.2,
        };

        Tweener.removeTweens(this._currentWeather);
        Tweener.removeTweens(this._futureWeather);

        Tweener.addTween(this._currentWeather, params);

        if (aOnCompleteCallback) {
            params["onComplete"] = aOnCompleteCallback;
            params["onCompleteScope"] = this;
        }

        Tweener.addTween(this._futureWeather, params);

    },

    _connectEnterLeaveEvents: function(aButton) {
        aButton.connect("enter-event",
            (aActor, aEvent) => this._onButtonEnterEvent(aActor, aEvent));
        aButton.connect("leave-event",
            (aActor, aEvent) => this._onButtonLeaveEvent(aActor, aEvent));
    },

    refreshIcons: function() {
        this._applet_icon.icon_type = this.pref_applet_icon_type;
        this._currentWeatherIcon.icon_type = this.pref_menu_icon_type;
        this._currentWeatherIcon.icon_size = this.pref_current_weather_icon_size;

        for (let i = this._forecast.length - 1; i >= 0; i--) {
            this._forecast[i].Icon.icon_type = this.pref_menu_icon_type;
            this._forecast[i].Icon.icon_size = this.pref_forecasts_icon_size;
        }

        this.refreshWeather();
    },

    refreshAndRebuild: function(aForceRetrieval = false) {
        this._refreshButton._refDate = null;
        this.rebuild();
        this.refreshWeather(aForceRetrieval);
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
    },

    on_applet_clicked: function(event) { // jshint ignore:line
        this.menu.toggle();
    },

    loadJsonAsync: function(aForceRetrieval, aCallback) {
        let providerStoredData = this.getProviderStoredData(true);
        let shouldUpdate = this._shouldUpdate(aForceRetrieval, providerStoredData);

        if (!shouldUpdate && providerStoredData !== null) {
            try {
                aCallback.call(this, providerStoredData);
            } catch (aErr) {
                global.logError(aErr);
            }
        } else {
            this.weatherProvider.getWeatherData(aCallback);
        }
    },

    _getWeatherProvider: function() {
        delete this.weatherProvider;

        let weatherProvider = null;

        if (!this.pref_current_location) {
            let msg = _("No current location set!");
            this.displayErrorMessage(msg, "warning");
            global.logError(msg);
            return null;
        }

        if (this.locationsMap && this.locationsMap.has(this.pref_current_location)) {
            let currentLocation = this.locationsMap.get(this.pref_current_location);

            if (!currentLocation) {
                return null;
            }

            let {
                locationName,
                locationID,
                providerID,
            } = currentLocation;

            try {
                // Mark for deletion on EOL. Cinnamon 3.6.x+
                let provider;

                if (typeof require === "function") {
                    provider = require("./weather_providers/" + providerID + ".js").Provider;
                } else {
                    provider = imports.ui.appletManager.applets[this.metadata.uuid]
                        .weather_providers[providerID].Provider;
                }

                if (this.pref_enable_verbose_logging) {
                    $.prototypeDebugger(provider, {
                        objectName: providerID + ".Provider"
                    });
                    weatherProvider = new provider(this, currentLocation || {});
                } else {
                    weatherProvider = new provider(this, currentLocation || {});
                }

                if (weatherProvider._error !== null) {
                    this.displayErrorMessage(weatherProvider._error);
                    return null;
                }
            } catch (aErr) {
                global.logError([
                    "Error initializing weather provider:",
                    "Provider ID: " + providerID,
                    "Location name: " + locationName,
                    "Location ID: " + locationID
                ].join("\n"));
                this.displayErrorMessage(_("Error initializing weather provider!"));
                global.logError(aErr);
            }
        }

        return weatherProvider;
    },

    _shouldUpdate: function(aForceRetrieval, aProviderData) {
        if (aForceRetrieval || aProviderData === null) {
            return true;
        }

        let latCheck = parseInt(aProviderData.lastCheck, 10);
        //                                  milliseconds to seconds
        return Math.round((new Date().getTime() - latCheck) / 1000) >=
            //              minutes to seconds
            Math.round(this.pref_refresh_interval * 60);
    },

    getProviderStoredData: function(aReturnData) {
        if (this.weatherProvider === null ||
            this.locationsMap === null ||
            !this.locationsMap.has(this.pref_current_location) ||
            !this.pref_weather_data.hasOwnProperty(this.weatherProvider.uuid)) {
            return null;
        }

        if (aReturnData) {
            return this.pref_weather_data[this.pref_current_location];
        }

        return true;
    },

    refreshWeather: function(aForceRetrieval = false) {
        this._ensureProvider();

        if (this.weatherProvider === null) {
            return false;
        }

        this.loadJsonAsync(aForceRetrieval, (aWeatherData) => {
            let hasToUpdate = false;

            /* NOTE: aWeatherData is null or if it has an error stored,
             * display the error in the menu and attempt to get the cached
             * weather data. Don't return yet,
             */
            if (aWeatherData === null || "error" in aWeatherData) {
                hasToUpdate = true;
                this.displayErrorMessage(aWeatherData.error);
                aWeatherData = this.getProviderStoredData(true);
            }

            /* NOTE: If aWeatherData is still null, or if it doesn't contain the
             * necessary data, display the error in the menu and halt execution.
             */
            if (aWeatherData === null || (typeof aWeatherData === "object" &&
                    !aWeatherData.hasOwnProperty("currentWeather") &&
                    !aWeatherData.hasOwnProperty("forecasts") &&
                    !aWeatherData.hasOwnProperty("locationInfo"))) {
                this.displayErrorMessage(
                    _("No weather data available!"), "error", true
                );
                return false;
            }

            /* NOTE: If the value stored in this._refreshButton._refDate is identical
             * to the lastCheck property in aWeatherData, halt execution. This is
             * done so the menu isn't unnecessarily repopulated with the exact same data.
             */
            if (this._refreshButton._refDate !== null &&
                aWeatherData.hasOwnProperty("lastCheck") &&
                this._refreshButton._refDate === aWeatherData.lastCheck) {
                return false;
            }

            let {
                currentWeather,
                forecasts,
                locationInfo
            } = aWeatherData;

            let conditionText;

            if (currentWeather.cur_cond_text === null) {
                conditionText = _(this._getConditionData("name", currentWeather.cur_cond_code));
            } else {
                /* NOTE: It isn't possible to provide translations for DarkSky conditions.
                 * They are provided from the server side.
                 */
                conditionText = currentWeather.cur_cond_text;
            }

            conditionText = conditionText.charAt(0).toUpperCase() + conditionText.slice(1);

            let iconName = this.weatherIconSafely(currentWeather.cur_cond_code);

            // Refresh current condition
            // this._currentWeatherLocation is a button
            if (this.weatherProvider.weather_details_url === null) {
                this._currentWeatherLocation.url = null;
                this._currentWeatherLocation.reactive = false;
            } else {
                this._currentWeatherLocation.url = this.weatherProvider.weather_details_url.format(
                    this.weatherProvider.locationID
                );
            }

            this._currentWeatherLocation.label = this.weatherProvider.locationName;

            this._currentWeatherIcon.icon_name = iconName;
            this.pref_applet_icon_type === St.IconType.SYMBOLIC ?
                this.set_applet_icon_symbolic_name(iconName) :
                this.set_applet_icon_name(iconName);

            this._currentWeatherSummary.text = conditionText;
            this._currentWeatherSummary._tooltip.set_text(conditionText);

            for (let id in SumaryDetailLabels) {
                let titleActor = this["_" + id + "SummaryTitle"];
                let valueActor = this["_" + id + "SummaryValue"];
                let curSummaryValue = currentWeather[id];

                if (curSummaryValue === null) {
                    titleActor.hide();
                    valueActor.hide();
                    continue;
                }

                titleActor.show();
                valueActor.show();

                switch (id) {
                    case "curTemperature":
                    case "curWindChill":
                        valueActor.text = this.tempUnitsFormatter(curSummaryValue) +
                            " " + this.unitToUnicode();
                        break;
                    case "curHumidity":
                        valueActor.text = curSummaryValue + " %";
                        break;
                    case "curPressure":
                        valueActor.text = this.pressureUnitsFormatter(curSummaryValue) +
                            " " + _(this.pref_pressure_unit);
                        break;
                    case "curWind":
                        valueActor.text = (curSummaryValue.dir !== null ?
                                curSummaryValue.dir + " " :
                                "!") + this.speedUnitsFormatter(curSummaryValue.speed) +
                            " " + _(this.pref_wind_speed_unit);
                        break;
                    case "curVisibility":
                        valueActor.text = this.distanceUnitsFormatter(curSummaryValue) +
                            " " + _(this.pref_distance_unit);
                        break;
                    case "curSunrise":
                    case "curSunset":
                        valueActor.text = this.pref_show_common_sense_hours ?
                            this.convertTo24Hours(curSummaryValue) :
                            curSummaryValue;
                        break;
                    default:
                        valueActor.text = curSummaryValue;
                }
            }

            this._refreshButton.label = currentWeather.cur_pub_date;
            this._refreshButton._refDate = hasToUpdate ? null : aWeatherData.lastCheck;
            this._poweredButton.label = _("Powered by %s".format(
                this.weatherProvider.providerName
            ));

            // Refresh forecast
            let f = 0,
                fLen = this._forecast.length;
            for (; f < fLen; f++) {
                let forecastUi = this._forecast[f];

                let data = forecasts[f];
                let firstTemp = this.tempUnitsFormatter(this.pref_temperature_high_first ?
                    data.high :
                    data.low);
                let secondTemp = this.tempUnitsFormatter(this.pref_temperature_high_first ?
                    data.low :
                    data.high);

                if (this.pref_forecats_display_dates) {
                    forecastUi.Day.text = data.date;
                    forecastUi.Day._tooltip.set_text("");
                } else {
                    forecastUi.Day.text = data.day;
                    forecastUi.Day._tooltip.set_text(data.date);
                }

                forecastUi.Temperature.text = firstTemp + " / " +
                    secondTemp + " " + this.unitToUnicode();
                forecastUi.Icon.icon_name = this.weatherIconSafely(data.code);

                let condText;

                if (data.text === null) {
                    condText = _(this._getConditionData("name", data.code));
                } else {
                    condText = data.text;
                }

                condText = condText.charAt(0).toUpperCase() + condText.slice(1);

                forecastUi.Summary.text = condText;
                forecastUi.Summary._tooltip.set_text(condText);
            }

            Mainloop.idle_add(() => {
                this._animateLocationSwitch("show");
                hasToUpdate || this._errorBox.hide();

                if (!this.pref_weather_data.hasOwnProperty(this.pref_current_location) ||
                    /* NOTE: If lastCheck is identical in the passed data and the stored data,
                     * it's because they are the same data that was returned as a fallback.
                     * So, don't store it back.
                     */
                    this.pref_weather_data[this.pref_current_location].lastCheck !== aWeatherData.lastCheck) {
                    let storedWeatherData = JSON.parse(JSON.stringify(this.pref_weather_data));
                    storedWeatherData[this.pref_current_location] = aWeatherData;
                    this.pref_weather_data = storedWeatherData;
                }

                /* NOTE: Store location data globally because it is accessed
                 * from several places.
                 */
                this._locationInfo = locationInfo;
                this._setCustomAppletTooltip();

                if (this.pref_show_current_temperature_in_panel) {
                    if (this.pref_show_current_condition_in_panel) {
                        this.set_applet_label(conditionText + " " +
                            this.tempUnitsFormatter(currentWeather.curTemperature) +
                            " " + this.unitToUnicode());
                    } else {
                        this.set_applet_label(this.tempUnitsFormatter(currentWeather.curTemperature) + " " +
                            this.unitToUnicode());
                    }
                } else {
                    this.set_applet_label("");
                }
            });

            return true;
        });
    },

    _startRefreshWeatherLoop: function() {
        this.refreshWeather();

        Mainloop.timeout_add_seconds(60, () => {
            this._startRefreshWeatherLoop();
            return false;
        });
    },

    _setCustomAppletTooltip: function() {
        if (this.tooltip) {
            this.tooltip.set_text(this._getReadableLocationData(true));
        } else {
            this.set_applet_tooltip(this._getReadableLocationData(false));
        }
    },

    _getReadableLocationData: function(aAsMarkup) {
        let locationInfo = [
            [_("Location name"), this.weatherProvider.locationName]
        ].concat(this._locationInfo);

        return locationInfo.map((aEl) => {
            if (aAsMarkup) {
                return "<b>" + $.escapeHTML(aEl[0]) + "</b>" + ": " +
                    $.escapeHTML((aEl[1] + "").trim());
            }

            return aEl[0] + ": " + (aEl[1] + "").trim();
        }).join("\n");
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

    rebuild: function() {
        this.rebuildCurrentWeatherUi();
        this.rebuildFutureWeatherUi();
    },

    rebuildCurrentWeatherUi: function() {
        this.destroyCurrentWeather();

        let midleBox = new St.BoxLayout({
            vertical: true,
            style_class: CLASS.CURRENT_SUMMARY_BOX
        });

        let rightBox = new St.Bin({
            style_class: CLASS.CURRENT_SUMMARY_DETAILS_BOX
        });

        // This will hold the icon for the current weather.
        this._currentWeatherIcon = new St.Icon({
            icon_type: this.pref_menu_icon_type,
            icon_size: this.pref_current_weather_icon_size,
            icon_name: Icons.REFRESH_ICON,
            style_class: CLASS.CURRENT_ICON
        });

        // The link to the details page.
        this._currentWeatherLocation = new St.Button({
            can_focus: true,
            reactive: true,
            label: _("Current location"),
            style_class: CLASS.CURRENT_LOCATION_BUTTON
        });
        this._currentWeatherLocation.connect("clicked", () => {
            this.menu.close();

            if (this._currentWeatherLocation.url) {
                this._xdgOpen(this._currentWeatherLocation.url);
            }
        });
        this._connectEnterLeaveEvents(this._currentWeatherLocation);
        this._currentWeatherLocation._tooltip = new $.CustomTooltip(
            this._currentWeatherLocation,
            _("Open location weather details page")
        );

        /* NOTE: this._currentWeatherSummary is a button so the freaking label is
         * centered without having to reinvent the wheel. SHEESH!!!
         */
        // The summary of the current weather.
        // Set reactive to trigger tooltips.
        this._currentWeatherSummary = new St.Label({
            reactive: true,
            text: Placeholders.LOADING,
            style_class: CLASS.CURRENT_SUMMARY,
            x_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });
        this._currentWeatherSummary.get_clutter_text().set_line_wrap(true);
        this._currentWeatherSummary.get_clutter_text().set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        this._currentWeatherSummary.get_clutter_text().ellipsize = Pango.EllipsizeMode.NONE; // Just in case
        this._currentWeatherSummary._tooltip = new $.CustomTooltip(this._currentWeatherSummary, "");

        midleBox.add_actor(this._currentWeatherLocation);
        midleBox.add(this._currentWeatherSummary, {
            y_fill: true,
            y_align: St.Align.MIDDLE,
            x_align: St.Align.MIDDLE,
            x_fill: true,
            expand: true
        });

        let summaryGrid = new Clutter.GridLayout({
            orientation: Clutter.Orientation.VERTICAL
        });

        rightBox.set_child(new St.Widget({
            layout_manager: summaryGrid
        }));

        let textOb = {
            text: Placeholders.LOADING,
            style_class: CLASS.CURRENT_SUMMARY_DETAILS_VALUE
        };

        // Summary details.
        let index = 0;
        for (let id in SumaryDetailLabels) {
            let tProp = "_" + id + "SummaryTitle";
            let vProp = "_" + id + "SummaryValue";

            this[tProp] = new St.Label({
                text: SumaryDetailLabels[id] + ":",
                style_class: CLASS.CURRENT_SUMMARY_DETAILS_TITLE
            });
            this[vProp] = new St.Label(textOb);

            summaryGrid.attach(this[tProp], 0, index, 1, 1);
            summaryGrid.attach(this[vProp], 1, index, 1, 1);

            index++;
        }

        let box = new St.BoxLayout({
            style_class: CLASS.CURRENT_ICON_BOX
        });
        box.add_actor(this._currentWeatherIcon);
        box.add_actor(midleBox);
        box.add_actor(rightBox);
        this._currentWeather.set_child(box);
    },

    rebuildFutureWeatherUi: function() {
        this._ensureProvider();

        if (this.weatherProvider === null) {
            return false;
        }

        this.destroyFutureWeather();

        this._forecast = [];

        this._forecastBox = new Clutter.GridLayout({
            orientation: this.pref_menu_orientation === "vertical" ? 1 : 0
        });

        let table = new St.Widget({
            layout_manager: this._forecastBox
        });

        this._futureWeather.set_child(table);

        let maxDays = Math.min(
            this.weatherProvider.forecastDays,
            this.weatherProvider.maxForecastsSupport
        );

        let breakPoint = Math.ceil(maxDays / this.weatherProvider.forecastRowsCols);

        for (let i = 0; i < maxDays; i++) {
            let forecastWeather = {};

            forecastWeather.Icon = new St.Icon({
                icon_type: this.pref_menu_icon_type,
                icon_size: this.pref_forecasts_icon_size,
                icon_name: Icons.REFRESH_ICON,
                style_class: CLASS.FORECAST_ICON
            });

            // Set reactive to trigger tooltips.
            forecastWeather.Day = new St.Label({
                text: Placeholders.LOADING,
                style_class: CLASS.FORECAST_DAY,
                reactive: true
            });
            forecastWeather.Day._tooltip = new $.CustomTooltip(forecastWeather.Day, "");

            // Set reactive to trigger tooltips.
            forecastWeather.Summary = new St.Label({
                text: Placeholders.LOADING,
                style_class: CLASS.FORECAST_SUMMARY,
                reactive: true
            });
            forecastWeather.Summary._tooltip = new $.CustomTooltip(forecastWeather.Summary, "");

            forecastWeather.Temperature = new St.Label({
                text: Placeholders.LOADING,
                style_class: CLASS.FORECAST_TEMPERATURE
            });

            let by = new St.BoxLayout({
                vertical: true,
                style_class: CLASS.FORECAST_DATA_BOX
            });
            by.add_actor(forecastWeather.Day);
            by.add_actor(forecastWeather.Summary);
            by.add_actor(forecastWeather.Temperature);

            let bb = new St.BoxLayout({
                style_class: CLASS.FORECAST_BOX
            });

            bb.add_actor(forecastWeather.Icon);
            bb.add_actor(by);

            this._forecast[i] = forecastWeather;

            let breakIt = i > breakPoint - 1;
            let col = this.pref_menu_orientation === "vertical" ?
                breakIt ? 1 : 0 :
                breakIt ? i - breakPoint : i;
            let row = this.pref_menu_orientation === "vertical" ?
                breakIt ? i - breakPoint : i :
                breakIt ? 1 : 0;
            this._forecastBox.attach(bb, col, row, 1, 1);
        }
    },

    unitToUnicode: function() {
        switch (this.pref_temperature_unit) {
            case "celsius":
                return "\u2103";
            case "fahrenheit":
                return "\u2109";
            case "kelvin":
                return "°K";
        }

        return "";
    },

    _getConditionData: function(aType, aCode) {
        let providerData = $.Constants[this.weatherProvider.providerID + "ConditionData"];

        if (aCode !== null && aCode !== Placeholders.ELLIPSIS &&
            aCode in providerData) {
            return providerData[aCode][aType];
        } else {
            global.logWarning("Possible missing data for code: %s".format(aCode + ""));
            global.logWarning("Provider ID: %s".format(this.weatherProvider.providerID));
        }

        switch (aType) {
            case "icon":
                return ["weather-severe-alert"];
            case "name":
                return _("Not available");
        }
    },

    weatherIconSafely: function(code) {
        let iconname = this._getConditionData("icon", code);
        for (let i = 0; i < iconname.length; i++) {
            if (Gtk.IconTheme.get_default().has_icon(iconname[i] +
                    (this.pref_menu_icon_type === St.IconType.SYMBOLIC ? "-symbolic" : ""))) {
                return iconname[i];
            }
        }
        return "weather-severe-alert";
    },

    _onButtonEnterEvent: function(aActor, aEvent) { // jshint ignore:line
        global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
        return false;
    },

    _onButtonLeaveEvent: function(aActor, aEvent) { // jshint ignore:line
        global.unset_cursor();
    },

    _ensureNotificationSource: function() {
        if (!this._notificationSource) {
            this._notificationSource = new $.WeatherMessageTraySource();
            this._notificationSource.connect("destroy", () => {
                this._notificationSource = null;
            });

            if (Main.messageTray) {
                Main.messageTray.add(this._notificationSource);
            }
        }
    },

    _notifyMessage: function(aTitle, aMessage, aUrgency = NotificationsUrgency.NORMAL, aButtons = []) {
        this._ensureNotificationSource();

        let body = "";

        body += "<b>" + $.escapeHTML(aTitle) + "</b>\n";
        body += aMessage + "\n";

        body = body.trim();

        if (this._notificationSource && !this.desktopNotification) {
            this.desktopNotification = new MessageTray.Notification(
                this._notificationSource,
                $.escapeHTML(_(this.metadata.name)),
                body,
                this._desktopNotificationParams
            );
            this.desktopNotification.setUrgency(aUrgency);
            this.desktopNotification.setTransient(false);
            this.desktopNotification.setResident(true);
            this.desktopNotification.connect("destroy", () => {
                this.desktopNotification = null;
            });
            this.desktopNotification.connect("action-invoked", (aSource, aAction) => {
                switch (aAction) {
                    case "dialog-information":
                        this._openHelpPage();
                        break;
                }
            });

            this._notificationSource.notify(this.desktopNotification);
        }

        if (body) {
            this.desktopNotification.update(
                _(this.metadata.name),
                body,
                this._notificationParams
            );

            this.desktopNotification.addButton("dialog-information", _("Help"));

            for (let i = aButtons.length - 1; i >= 0; i--) {
                this.desktopNotification.addButton(aButtons[i].action, aButtons[i].label);
            }

            this._notificationSource.notify(this.desktopNotification);
        } else {
            this.desktopNotification && this.desktopNotification.destroy();
        }
    },

    convertTo24Hours: function(aTimeStr) {
        let s = aTimeStr.indexOf(":");
        let t = aTimeStr.indexOf(" ");
        let n = aTimeStr.length;
        let hh = aTimeStr.substr(0, s);
        let mm = aTimeStr.substring(s + 1, t);

        if (parseInt(hh) < 10) { // pad
            hh = "0" + hh;
        }

        let beforeNoon = aTimeStr.substr(n - 2).toLowerCase() === "am";
        if (beforeNoon) {
            if (hh === "12") { // 12 AM -> 00
                hh = "00";
            }

            return hh + ":" + mm;
        }

        if (hh === "12") { // 12 PM -> ok
            return hh + ":" + mm;
        }

        return (parseInt(hh, 10) + 12).toString() + ":" + mm;
    },

    /**
     * Convert from the temperature unit received by the weather provider
     * into the temperature unit set on this applet preferences.
     *
     * NOTE: Qty temperature conversion is a total mess.
     * Using kelvin, celsius and fahrenheit as unit names gives wrong values.
     * Using tempK, tempC and tempF as unit names gives the right values.
     *
     * NOTE: If the conversion went wrong, the non-converted value will be
     * returned with a warning sign at the beginning.
     *
     * @param {Number} aVal - The value to convert.
     *
     * @return {String} The converted value.
     */
    tempUnitsFormatter: function(aVal) {
        try {
            let converter = Qty.swiftConverter(
                QtyTempUnits[this.weatherProvider.tempUnit],
                QtyTempUnits[this.pref_temperature_unit]
            );

            return String(Math.round(Number(converter(aVal))));
        } catch (aErr) {
            global.logWarning("Input unit: " + QtyTempUnits[this.weatherProvider.tempUnit]);
            global.logWarning("Output unit: " + QtyTempUnits[this.pref_temperature_unit]);
            global.logWarning(aErr);
        }

        return "\u26A0" + aVal;
    },

    /**
     * Convert from the pressure unit received by the weather provider
     * into the pressure unit set on this applet preferences.
     *
     * NOTE: Special case to handle Hectopascals. Converting from/to Hectopascals
     * isn't supported by the quantities library. ¬¬
     * So, I simply convert to kPA and then multiply/divide by 10.
     *
     * NOTE: If the conversion went wrong, the non-converted value will be
     * returned with a warning sign at the beginning.
     *
     * @param {Number} aVal - The value to convert.
     *
     * @return {String} The converted value.
     */
    pressureUnitsFormatter: function(aVal) {
        let inUnit = this.weatherProvider.pressureUnit;
        let outUnit = this.pref_pressure_unit;

        try {
            let inFactor = 1;
            let outFactor = 1;

            if (inUnit === PressureUnits.HPA) {
                inUnit = PressureUnits.KPA;
                inFactor = 10;
            }

            if (outUnit === PressureUnits.HPA) {
                outUnit = PressureUnits.KPA;
                outFactor = 10;
            }

            let converter = Qty.swiftConverter(
                inUnit,
                outUnit
            );

            let convertedValue = converter(aVal / inFactor) * outFactor;

            switch (this.pref_pressure_unit) {
                case PressureUnits.MBAR:
                case PressureUnits.INHG:
                case PressureUnits.KPA:
                    convertedValue = parseFloat(convertedValue).toFixed(2);
                    break;
                case PressureUnits.PSI:
                case "psi":
                    convertedValue = parseFloat(convertedValue).toFixed(3);
                    break;
                case PressureUnits.MMHG:
                case PressureUnits.PA:
                case PressureUnits.HPA:
                    convertedValue = Math.round(convertedValue);
                    break;
                case PressureUnits.ATM:
                    convertedValue = convertedValue.toFixed(4);
                    break;
            }

            return String(convertedValue);
        } catch (aErr) {
            global.logWarning("Input unit: " + inUnit);
            global.logWarning("Output unit: " + outUnit);
            global.logWarning(aErr);
        }

        return "\u26A0" + aVal;
    },

    /**
     * Convert from the speed unit received by the weather provider
     * into the speed unit set on this applet preferences.
     *
     * NOTE: If the conversion went wrong, the non-converted value will be
     * returned with a warning sign at the beginning.
     *
     * @param {Number} aVal - The value to convert.
     *
     * @return {String} The converted value.
     */
    speedUnitsFormatter: function(aVal) {
        try {
            let converter = Qty.swiftConverter(
                this.weatherProvider.windSpeedUnit,
                this.pref_wind_speed_unit
            );

            return String(Math.round(converter(aVal)));

        } catch (aErr) {
            global.logWarning("Input unit: " + this.weatherProvider.windSpeedUnit);
            global.logWarning("Output unit: " + this.pref_wind_speed_unit);
            global.logWarning(aErr);
        }

        return "\u26A0" + aVal;
    },

    distanceUnitsFormatter: function(aVal) {
        try {
            let converter = Qty.swiftConverter(
                this.weatherProvider.distanceUnit,
                this.pref_distance_unit
            );

            return String(Math.round(converter(aVal)));

        } catch (aErr) {
            global.logWarning("Input unit: " + this.weatherProvider.distanceUnit);
            global.logWarning("Output unit: " + this.pref_distance_unit);
            global.logWarning(aErr);
        }

        return "\u26A0" + aVal;
    },

    _ensureProvider: function() {
        // If there is no provider.
        if (this.weatherProvider === null ||
            // Or if the current location changed.
            this.weatherProvider.uuid !== this.pref_current_location) {
            this.weatherProvider = this._getWeatherProvider();

            return true;
        }

        if (this.locationsMap && this.locationsMap.has(this.pref_current_location)) {
            let location = this.locationsMap.get(this.pref_current_location);

            // If the forecasts days or rows/cols numbers changed.
            if (location.forecastDays !== this.weatherProvider.forecastDays ||
                location.forecastRowsCols !== this.weatherProvider.forecastRowsCols) {
                this.weatherProvider = this._getWeatherProvider();
                return true;
            }
        }

        return true;
    },

    sortLocations: function(aLocationsObj) {
        return JSON.parse(JSON.stringify(aLocationsObj)).sort((a, b) => {
            return a.locationName.localeCompare(b.locationName);
        });
    },

    updateLocationsMap: function() {
        try {
            this.locationsMap = new Map(
                this.sortLocations(this.pref_locations_storage).map((aObj) => {
                    if (aObj && typeof aObj !== "function") {
                        return [aObj.locationID + ":" + aObj.providerID, aObj];
                    }
                })
            );
        } catch (aErr) {
            global.logError(aErr);
            this.locationsMap = null;
        }
    },

    displayErrorMessage: function(aMsg, aContext = "error", aAppend = false) {
        this._errorBox.show();

        if (aAppend) {
            this._errorMessage.label = this._errorMessage.label + " " + aMsg;
        } else {
            this._errorMessage.label = aMsg;
        }

        this._errorBox.set_style_pseudo_class(aContext);
        this._errorMessage.set_style_pseudo_class(aContext);
    },

    sanitizeStoredLocations: function() {
        // Remove cached data of locations that don't exist anymore.
        let cachedLocationKeys = Object.keys(JSON.parse(JSON.stringify(this.pref_weather_data)));
        let i = cachedLocationKeys.length;
        while (i--) {
            if (!this.locationsMap.has(cachedLocationKeys[i])) {
                delete this.pref_weather_data[cachedLocationKeys[i]];
            }
        }
    },

    _openLocationsManager: function() {
        Util.spawn_async([this.metadata.path + "/locationsManager.py", this.instance_id], null);
    },

    _openHelpPage: function() {
        this._xdgOpen(this.metadata.path + "/HELP.html");
    },

    _xdgOpen: function() {
        Util.spawn_async(["xdg-open"].concat(Array.prototype.slice.call(arguments)), null);
    },

    _loadTheme: function(aFullReload) {
        if (this.load_theme_id > 0) {
            Mainloop.source_remove(this.load_theme_id);
            this.load_theme_id = 0;
        }

        try {
            this.unloadStylesheet();
        } catch (aErr) {
            global.logError(aErr);
        } finally {
            this.load_theme_id = Mainloop.timeout_add(300,
                () => {
                    // This block doesn't make any sense, but it's what it works.
                    // So I will leave it as is or else. ¬¬
                    try {
                        this.loadStylesheet();
                    } catch (aErr) {
                        global.logError(aErr);
                    } finally {
                        if (aFullReload) {
                            Main.themeManager._changeTheme();
                        }
                    }
                }
            );
        }
    },

    loadStylesheet: function() {
        let themePath = this._getCssPath();

        try {
            let themeContext = St.ThemeContext.get_for_stage(global.stage);
            this.theme = themeContext.get_theme();
        } catch (aErr) {
            global.logError(_("Error trying to get theme"));
            global.logError(aErr);
        }

        try {
            this.theme.load_stylesheet(themePath);
            this.stylesheet = themePath;
        } catch (aErr) {
            global.logError(_("Stylesheet parse error"));
            global.logError(aErr);
        }
    },

    unloadStylesheet: function() {
        if (this.theme && this.stylesheet) {
            try {
                this.theme.unload_stylesheet(this.stylesheet);
            } catch (aErr) {
                global.logError(_("Error unloading stylesheet"));
                global.logError(aErr);
            }
        }
    },

    _getCssPath: function() {
        let defaultThemepath = this.metadata.path + "/themes/default.css";
        let cssPath = this.pref_menu_theme === "custom" ?
            this.pref_menu_theme_path_custom :
            defaultThemepath;

        if (/^file:\/\//.test(cssPath)) {
            cssPath = cssPath.substr(7);
        }

        try {
            let cssFile = Gio.file_new_for_path(cssPath);

            if (!cssPath || !cssFile.query_exists(null)) {
                cssPath = defaultThemepath;
            }
        } catch (aErr) {
            cssPath = defaultThemepath;
            global.logError(aErr);
        }

        return cssPath;
    },

    _onSettingsChanged: function(aPrefValue, aPrefKey) {
        /* NOTE: On Cinnamon versions greater than 3.2.x, two arguments are passed to the
         * settings callback instead of just one as in older versions. The first one is the
         * setting value and the second one is the user data. To workaround this nonsense,
         * check if the second argument is undefined to decide which
         * argument to use as the pref key depending on the Cinnamon version.
         */
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        // Remove the following variable and directly use the second argument.
        let pref_key = aPrefKey || aPrefValue;
        switch (pref_key) {
            case "pref_overlay_key":
                this._updateKeybindings();
                break;
            case "pref_refresh_interval":
            case "pref_show_current_condition_in_panel":
            case "pref_show_current_temperature_in_panel":
            case "pref_menu_orientation":
            case "pref_show_common_sense_hours":
            case "pref_temperature_unit":
            case "pref_temperature_high_first":
            case "pref_forecats_display_dates":
            case "pref_pressure_unit":
            case "pref_wind_speed_unit":
            case "pref_distance_unit":
                this.refreshAndRebuild();
                break;
            case "pref_current_weather_icon_size":
            case "pref_forecasts_icon_size":
            case "pref_applet_icon_type":
            case "pref_menu_icon_type":
                this.refreshIcons();
                break;
            case "pref_enable_verbose_logging":
                DebugManager.verboseLogging = this.pref_enable_verbose_logging;

                this._notifyMessage(
                    _("Debugging toggled"),
                    _("Remember to restart Cinnamon to fully enable/disable this option."),
                    NotificationsUrgency.CRITICAL
                );
                break;
                /* NOTE: Settings toggled from the Locations Manager GUI.
                 */
            case "trigger_reload_locations":
                this.updateLocationsMap();
                this.sanitizeStoredLocations();
                this.refreshAndRebuild();
                this.locationSelectorMenu.populateMenu();
                break;
            case "pref_menu_theme":
            case "pref_menu_theme_path_custom":
                this._loadTheme(true);
                break;
                /* NOTE: In case that I decide to add some "links" to the locations manager GUI.
                 */
                // case "trigger_woeid_lookup":
                //     this._xdgOpen(URLs.YAHOO_WOEID);
                //     break;
                // case "trigger_yahoo_api_instructions":
                //     this._xdgOpen(URLs.YAHOO_API_INSTRUCTIONS);
                //     break;
                // case "trigger_open_weather_map_finder":
                //     this._xdgOpen(URLs.OPEN_WEATHER_MAP_FIND);
                //     break;
                // case "trigger_open_weather_map_api_instructions":
                //     this._xdgOpen(URLs.OPEN_WEATHER_MAP_API_INSTRUCTIONS);
                //     break;
                // case "trigger_darksky_find":
                //     this._xdgOpen(URLs.DARK_SKY_API_FIND);
                //     break;
                // case "trigger_darksky_api_instructions":
                //     this._xdgOpen(URLs.DARK_SKY_API_INSTRUCTIONS);
                //     break;
        }
    }
};

function main(aMetadata, aOrientation, aPanel_height, aInstance_id) {
    if (DebugManager.verboseLogging) {
        try {
            let protos = {
                CustomPanelTooltip: $.CustomPanelTooltip,
                CustomTooltip: $.CustomTooltip,
                LocationSelectorMenu: $.LocationSelectorMenu,
                LocationSelectorMenuItem: $.LocationSelectorMenuItem,
                WeatherAppletForkByOdyseusApplet: WeatherAppletForkByOdyseusApplet,
                WeatherMessageTraySource: $.WeatherMessageTraySource,
                WeatherProviderBase: $.WeatherProviderBase,
            };

            for (let name in protos) {
                $.prototypeDebugger(protos[name], {
                    objectName: name + aInstance_id
                });
            }
        } catch (aErr) {
            global.logError(aErr);
        }
    }

    return new WeatherAppletForkByOdyseusApplet(aMetadata, aOrientation, aPanel_height, aInstance_id);
}
