/* FIXME: The quantities and sha1 libraries are a strict mode nightmare.
 * Try to tweak them to make them not vomit millions of useless warnings.
 * Or "simply" look for other libraries. ¬¬
 * I barely find out of this because Cinnamon's import mechanism using
 * require is an absolute garbage!!! &%$·%()/&% WEB DEVELOPERS!!!!
 * NOTE: Do not even think about adding automatic location lookup until
 * I can use async/await (around 2021). By that time, I might have already
 * fed up with all the nonsense that happen in Cinnamon, so why the hell bother!
 */
const Constants = require("js_modules/constants.js");

const {
    gi: {
        Cinnamon,
        Clutter,
        Gio,
        Gtk,
        Pango,
        Soup,
        St
    },
    ui: {
        applet: Applet,
        main: Main,
        popupMenu: PopupMenu,
        tweener: Tweener
    }
} = imports;

const {
    APPLET_PREFS,
    CssClasses: CLASS,
    Icons,
    Placeholders,
    QtyTempUnits,
    SumaryDetailLabels,
    Units: {
        // DISTANCE: DistanceUnits,
        // TEMPERATURE: TempUnits,
        // WIND_SPEED: WindSpeedUnits,
        PRESSURE: PressureUnits
    }
} = Constants;

const {
    UNICODE_SYMBOLS
} = require("js_modules/globalConstants.js");

const {
    _,
    copyToClipboard,
    escapeHTML,
    isBlank,
    tryFn,
    launchUri
} = require("js_modules/globalUtils.js");

const {
    CustomPanelItemTooltip,
    IntelligentTooltip
} = require("js_modules/customTooltips.js");

const {
    LoggingLevel,
    methodWrapper
} = require("js_modules/debugManager.js");

const {
    NotificationUrgency
} = require("js_modules/notificationsUtils.js");

const {
    Qty
} = require("js_modules/quantities.js");

const {
    Debugger,
    LocationSelectorMenu,
    Notification
} = require("js_modules/utils.js");

const {
    File
} = require("js_modules/customFileUtils.js");

const {
    getBaseAppletClass
} = require("js_modules/appletsUtils.js");

class Weather extends getBaseAppletClass(Applet.TextIconApplet) {
    constructor(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
        super({
            metadata: aMetadata,
            orientation: aOrientation,
            panel_height: aPanelHeight,
            instance_id: aInstanceID,
            pref_keys: APPLET_PREFS
        });

        this.__initializeApplet(() => {
            this._expandAppletContextMenu();
            this._initSoupSession();
        }, () => {
            this.forceMenuReload = false;
            this.theme = null;
            this.stylesheet = null;
            this.weatherProvider = null;
            this.locationsMap = null;
            this._forecast = [];
            this._locationInfo = [];

            this.set_applet_icon_name(Icons.REFRESH_ICON);
            this.set_applet_label(Placeholders.ELLIPSIS);

            this.menu.actor.set_name("WeatherApplet");
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
            this.appendIconThemePath();
            this.rebuild();
            this._startRefreshWeatherLoop();
            this._loadTheme();

            if (!this.$._.initial_load_done) {
                this.$._.initial_load_done = true;
                Notification.notify([
                        escapeHTML(_("Read the help page")),
                        escapeHTML(_("This applet requires valid credentials from any of the weather provider services for it to work."))
                    ],
                    NotificationUrgency.CRITICAL
                );
            }

        });
    }

    __connectSignals() {
        this.$.signal_manager.connect(Main.themeManager, "theme-set", function() {
            this._loadTheme(false);
        }.bind(this));
        this.$.signal_manager.connect(this, "orientation-changed", function() {
            this.__seekAndDetroyConfigureContext();
        }.bind(this));
    }

    _expandAppletContextMenu() {
        let menuItem = new PopupMenu.PopupIconMenuItem(_("Copy current location data"),
            "edit-copy", St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => {
            copyToClipboard(this._getReadableLocationData(false).join("\n"));
        });
        this._applet_context_menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(_("Help"), "dialog-information", St.IconType.SYMBOLIC);
        menuItem.connect("activate", () => this.__openHelpPage());
        this._applet_context_menu.addMenuItem(menuItem);

        this.__seekAndDetroyConfigureContext();
    }

    _initSoupSession() {
        /* NOTE: Supposedly, Soup.SessionAsync is deprecated. And supposedly,
         * Soup.Session.queue_message is asynchronous by default and it has a
         * proxy resolver by default. But Soup.Session feels ultra slow!!!
         * So, I will keep using Soup.SessionAsync with a fallback to
         * Soup.Session just in case.
         */
        tryFn(() => {
            this._httpSession = new Soup.SessionAsync();

            Soup.Session.prototype.add_feature.call(
                this._httpSession,
                new Soup.ProxyResolverDefault()
            );
        }, (aErr) => {
            if (Debugger.logging_level !== LoggingLevel.NORMAL) {
                global.logError(aErr);
            }

            this._httpSession = new Soup.Session();
        });

        this._httpSession.user_agent = "Mozilla/5.0";
        this._httpSession.timeout = 10;

        if (Debugger.logging_level !== LoggingLevel.NORMAL) {
            const SoupLogger = Soup.Logger.new(Soup.LoggerLogLevel.HEADERS |
                Soup.LoggerLogLevel.BODY, -1);

            Soup.Session.prototype.add_feature.call(
                this._httpSession,
                SoupLogger
            );
            SoupLogger.set_printer(this.soupPrinter);
        }
    }

    soupPrinter(aLog, aLevel = null, aDirection = null, aData = null) {
        /* WARNING: The context inside this function (this) isn't the applet.
         */
        if (aLevel && aDirection && aData) {
            global.log(String(aData));
        }
    }

    createMainContainers() {
        const mainBox = new St.BoxLayout({
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
            copyToClipboard(this._errorMessage.label);
        });
        this._errorMessage._tooltip = new IntelligentTooltip(
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
        const sep1 = new PopupMenu.PopupSeparatorMenuItem();
        const sep2 = new PopupMenu.PopupSeparatorMenuItem();
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
        const footerBox = new St.BoxLayout({
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
        this._refreshButton._tooltip = new IntelligentTooltip(
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
            launchUri(this.weatherProvider.website);
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

        const locationSelectorButton = new St.Button({
            can_focus: true,
            reactive: true,
            child: new St.Icon({
                icon_type: St.IconType.SYMBOLIC,
                icon_size: 12,
                icon_name: "open-menu"
            }),
            style_class: CLASS.FOOTER_BUTTON
        });
        locationSelectorButton.connect("clicked", () => {
            this.locationSelectorMenu.isOpen ?
                this.locationSelectorMenu.close(true) :
                this.locationSelectorMenu.open(false);
        });
        this._connectEnterLeaveEvents(locationSelectorButton);

        this.locationSelectorMenu = new LocationSelectorMenu(this, locationSelectorButton);
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
    }

    _animateLocationSwitch(aAction, aOnCompleteCallback) {
        const params = {
            opacity: aAction === "show" ? 255 : 0,
            transition: aAction === "show" ? "easeInQuad" : "easeOutQuad",
            time: 0.2
        };

        Tweener.removeTweens(this._currentWeather);
        Tweener.removeTweens(this._futureWeather);

        Tweener.addTween(this._currentWeather, params);

        if (aOnCompleteCallback) {
            params["onComplete"] = aOnCompleteCallback;
            params["onCompleteScope"] = this;
        }

        Tweener.addTween(this._futureWeather, params);

    }

    _connectEnterLeaveEvents(aButton) {
        aButton.connect("enter-event",
            (aActor, aEvent) => this._onButtonEnterEvent(aActor, aEvent));
        aButton.connect("leave-event",
            (aActor, aEvent) => this._onButtonLeaveEvent(aActor, aEvent));
    }

    refreshIcons() {
        this._applet_icon.icon_type = this.$._.applet_icon_type;
        this._currentWeatherIcon.icon_type = this.$._.menu_icon_type;
        this._currentWeatherIcon.icon_size = this.$._.current_weather_icon_size;

        for (let i = this._forecast.length - 1; i >= 0; i--) {
            this._forecast[i].Icon.icon_type = this.$._.menu_icon_type;
            this._forecast[i].Icon.icon_size = this.$._.forecasts_icon_size;
        }

        this.refreshWeather();
    }

    appendIconThemePath() {
        const defaultSearchPath = Gtk.IconTheme.get_default().get_search_path();
        const builtInIconThemePath = this.$.metadata.path + "/themes/icons";
        let customIconThemePath = this.$._.icon_theme_path_custom;
        let pathToAppend = null;

        if (customIconThemePath.startsWith("file://")) {
            customIconThemePath = customIconThemePath.substr(7);
        }

        const allPaths = [builtInIconThemePath, customIconThemePath];

        for (let i = allPaths.length - 1; i >= 0; i--) {
            if (defaultSearchPath.indexOf(allPaths[i]) !== -1) {
                defaultSearchPath.splice(defaultSearchPath.indexOf(allPaths[i]), 1);
            }
        }

        switch (this.$._.icon_theme) {
            case "built-in":
                pathToAppend = builtInIconThemePath;
                break;
            case "custom":
                /* WARNING: An empty string passed to Gio.file_new_for_path will
                 * return the user's home directory. ¬¬
                 */
                const iconDir = Gio.file_new_for_path(customIconThemePath);

                if (customIconThemePath && iconDir.query_exists(null)) {
                    pathToAppend = customIconThemePath;
                } else {
                    const msg = _("Selected path for custom icon theme doesn't exist!");
                    this.displayErrorMessage(msg);
                    global.logError(msg);
                }
                break;
            default:
                pathToAppend = null;
                this.forceMenuReload = true;
                break;
        }

        if (pathToAppend !== null) {
            this.forceMenuReload = true;
            defaultSearchPath.push(pathToAppend);
            Gtk.IconTheme.get_default().set_search_path(defaultSearchPath);
        }
    }

    refreshAndRebuild(aForceRetrieval = false) {
        this._refreshButton._refDate = null;
        this.rebuild();
        this.refreshWeather(aForceRetrieval);
    }

    _updateKeybindings() {
        this.$.keybinding_manager.addKeybinding("toggle_menu", this.$._.toggle_menu_keybinding, () => {
            if (!Main.overview.visible && !Main.expo.visible) {
                this.menu.toggle_with_options(this.$._.animate_menu);
            }
        });
    }

    on_applet_removed_from_panel(event) { // jshint ignore:line
        super.on_applet_removed_from_panel();
        this.unloadStylesheet();
        Debugger.destroy();
    }

    on_applet_clicked(event) { // jshint ignore:line
        this.menu.toggle();
    }

    loadJsonAsync(aForceRetrieval, aCallback) {
        const providerStoredData = this.getProviderStoredData(true);
        const shouldUpdate = this._shouldUpdate(aForceRetrieval, providerStoredData);

        if (!shouldUpdate && providerStoredData !== null) {
            tryFn(() => {
                aCallback.call(this, providerStoredData);

            }, (aErr) => global.logError(aErr));
        } else {
            this.weatherProvider.getWeatherData(aCallback);
        }
    }

    _getWeatherProvider() {
        delete this.weatherProvider;

        let weatherProvider = null;

        if (!this.$._.current_location) {
            const msg = _("No current location set!");
            this.displayErrorMessage(msg, "warning");
            global.logError(msg);
            return null;
        }

        if (this.locationsMap && this.locationsMap.has(this.$._.current_location)) {
            const currentLocation = this.locationsMap.get(this.$._.current_location);

            if (!currentLocation) {
                return null;
            }

            const {
                locationName,
                locationID,
                providerID
            } = currentLocation;

            tryFn(() => {
                const provider = require("js_modules/weather_providers/" + providerID + ".js").Provider;

                if (Debugger.logging_level === LoggingLevel.VERY_VERBOSE ||
                    Debugger.debugger_enabled) {
                    methodWrapper(provider, {
                        object_name: providerID + ".Provider",
                        verbose: Debugger.logging_level === LoggingLevel.VERY_VERBOSE,
                        debug: Debugger.debugger_enabled
                    });
                    weatherProvider = new provider(this, currentLocation || {});
                } else {
                    weatherProvider = new provider(this, currentLocation || {});
                }

                if (weatherProvider._error !== null) {
                    this.displayErrorMessage(weatherProvider._error);
                    weatherProvider = null;
                }
            }, (aErr) => {
                global.logError([
                    "Error initializing weather provider:",
                    "Provider ID: " + providerID,
                    "Location name: " + locationName,
                    "Location ID: " + locationID
                ].join("\n"));
                this.displayErrorMessage(_("Error initializing weather provider!"));
                global.logError(aErr);
            });

        }

        return weatherProvider;
    }

    _shouldUpdate(aForceRetrieval, aProviderData) {
        if (aForceRetrieval || aProviderData === null) {
            return true;
        }

        const latCheck = parseInt(aProviderData.lastCheck, 10);
        //                                  milliseconds to seconds
        return Math.round((new Date().getTime() - latCheck) / 1000) >=
            //              minutes to seconds
            Math.round(this.$._.refresh_interval * 60);
    }

    getProviderStoredData(aReturnData) {
        if (this.weatherProvider === null ||
            this.locationsMap === null ||
            !this.locationsMap.has(this.$._.current_location) ||
            !this.$._.weather_data.hasOwnProperty(this.weatherProvider.uuid)) {
            return null;
        }

        if (aReturnData) {
            return this.$._.weather_data[this.$._.current_location];
        }

        return true;
    }

    refreshWeather(aForceRetrieval = false) {
        this._ensureProvider();

        if (this.weatherProvider === null) {
            return;
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
            if (!this.forceMenuReload &&
                this._refreshButton._refDate !== null &&
                aWeatherData.hasOwnProperty("lastCheck") &&
                this._refreshButton._refDate === aWeatherData.lastCheck) {
                return false;
            }

            const {
                currentWeather,
                forecasts,
                locationInfo
            } = aWeatherData;

            let conditionText;

            if (currentWeather.cur_cond_text === null) {
                conditionText = _(this._getConditionData("name", currentWeather.cur_cond_code));
            } else {
                conditionText = currentWeather.cur_cond_text;
            }

            conditionText = conditionText.charAt(0).toUpperCase() + conditionText.slice(1);

            const iconName = this.weatherIconSafely(currentWeather.cur_cond_code);

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
            this.$._.applet_icon_type === St.IconType.SYMBOLIC ?
                this.set_applet_icon_symbolic_name(iconName) :
                this.set_applet_icon_name(iconName);

            this._currentWeatherSummary.text = conditionText;
            this._currentWeatherSummary._tooltip.set_text(conditionText);

            for (const id in SumaryDetailLabels) {
                const titleActor = this["_" + id + "SummaryTitle"];
                const valueActor = this["_" + id + "SummaryValue"];
                const curSummaryValue = currentWeather[id];

                if (isBlank(curSummaryValue)) {
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
                            " " + _(this.$._.pressure_unit);
                        break;
                    case "curWind":
                        valueActor.text = (curSummaryValue.dir !== null ?
                                curSummaryValue.dir + " " :
                                "!") + this.speedUnitsFormatter(curSummaryValue.speed) +
                            " " + _(this.$._.wind_speed_unit);
                        break;
                    case "curVisibility":
                        valueActor.text = this.distanceUnitsFormatter(curSummaryValue) +
                            " " + _(this.$._.distance_unit);
                        break;
                    case "curSunrise":
                    case "curSunset":
                        valueActor.text = this.$._.show_common_sense_hours ?
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
                const forecastUi = this._forecast[f];

                const data = forecasts[f];
                const firstTemp = this.tempUnitsFormatter(this.$._.temperature_high_first ?
                    data.high :
                    data.low);
                const secondTemp = this.tempUnitsFormatter(this.$._.temperature_high_first ?
                    data.low :
                    data.high);

                if (this.$._.forecats_display_dates) {
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

            this.$.schedule_manager.idleCall("refresh_weather", function() {
                this._animateLocationSwitch("show");
                hasToUpdate || this._errorBox.hide();

                if (!this.$._.weather_data.hasOwnProperty(this.$._.current_location) ||
                    /* NOTE: If lastCheck is identical in the passed data and the stored data,
                     * it's because they are the same data that was returned as a fallback.
                     * So, don't store it back.
                     */
                    this.$._.weather_data[this.$._.current_location].lastCheck !== aWeatherData.lastCheck) {
                    // Stick with the JSON trick. Do not use Object.assign().
                    const storedWeatherData = JSON.parse(JSON.stringify(this.$._.weather_data));
                    storedWeatherData[this.$._.current_location] = aWeatherData;
                    this.$._.weather_data = storedWeatherData;
                }

                /* NOTE: Store location data globally because it is accessed
                 * from several places.
                 */
                this._locationInfo = locationInfo;
                this._setCustomAppletTooltip();

                if (this.$._.show_current_temperature_in_panel) {
                    if (this.$._.show_current_condition_in_panel) {
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
            }.bind(this));

            this.forceMenuReload = false;

            return true;
        });
    }

    _startRefreshWeatherLoop() {
        this.refreshWeather();
        this.$.schedule_manager.setInterval("refresh_weather", function() {
            this.refreshWeather();
        }.bind(this), 60000);
    }

    _setCustomAppletTooltip() {
        tryFn(() => {
            this._applet_tooltip && this._applet_tooltip.destroy();
            this._applet_tooltip = new CustomPanelItemTooltip(
                this,
                this.$.orientation, {
                    label: _(this.$.metadata.name),
                    grid_data: this._getReadableLocationData(true)
                }
            );
        }, (aErr) => { // jshint ignore:line
            this.set_applet_tooltip(this._getReadableLocationData(false).join("\n"));
        });
    }

    _getReadableLocationData(aAsMarkup) {
        const locationInfo = [
            [_("Location name"), this.weatherProvider.locationName],
            ...this._locationInfo
        ];

        return locationInfo.map((aEl) => {
            if (aAsMarkup) {
                return [escapeHTML(aEl[0]), escapeHTML((aEl[1] + "").trim())];
            }

            return aEl[0] + ": " + (aEl[1] + "").trim();
        });
    }

    destroyCurrentWeather() {
        if (this._currentWeather.get_child() !== null) {
            this._currentWeather.get_child().destroy();
        }
    }

    destroyFutureWeather() {
        if (this._futureWeather.get_child() !== null) {
            this._futureWeather.get_child().destroy();
        }
    }

    rebuild() {
        this.rebuildCurrentWeatherUi();
        this.rebuildFutureWeatherUi();
    }

    rebuildCurrentWeatherUi() {
        this.destroyCurrentWeather();

        const leftBox = new St.BoxLayout({
            vertical: true,
            x_align: Clutter.ActorAlign.END,
            x_expand: true,
            style_class: CLASS.CURRENT_ICON_BOX
        });

        const midleBox = new St.BoxLayout({
            vertical: true,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
            style_class: CLASS.CURRENT_SUMMARY_BOX
        });

        const rightBox = new St.BoxLayout({
            vertical: true,
            x_align: Clutter.ActorAlign.START,
            x_expand: true,
            style_class: CLASS.CURRENT_SUMMARY_DETAILS_BOX
        });

        // This will hold the icon for the current weather.
        this._currentWeatherIcon = new St.Icon({
            icon_type: this.$._.menu_icon_type,
            icon_size: this.$._.current_weather_icon_size,
            icon_name: Icons.REFRESH_ICON,
            style_class: CLASS.CURRENT_ICON
        });
        leftBox.add(this._currentWeatherIcon, {
            y_fill: true,
            expand: true
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
                launchUri(this._currentWeatherLocation.url);
            }
        });
        this._connectEnterLeaveEvents(this._currentWeatherLocation);
        this._currentWeatherLocation._tooltip = new IntelligentTooltip(
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
        this._currentWeatherSummary._tooltip = new IntelligentTooltip(this._currentWeatherSummary, "");

        midleBox.add_actor(this._currentWeatherLocation);
        midleBox.add(this._currentWeatherSummary, {
            y_fill: true,
            y_align: St.Align.MIDDLE,
            x_align: St.Align.MIDDLE,
            expand: true
        });

        const summaryGrid = new Clutter.GridLayout({
            orientation: Clutter.Orientation.VERTICAL
        });
        summaryGrid.set_column_homogeneous(true);

        const summaryBox = new St.Widget({
            layout_manager: summaryGrid
        });

        rightBox.add(summaryBox, {
            y_fill: true,
            expand: true
        });

        const textOb = {
            text: Placeholders.LOADING,
            style_class: CLASS.CURRENT_SUMMARY_DETAILS_VALUE
        };

        // Summary details.
        let index = 0;
        for (const id in SumaryDetailLabels) {
            const tProp = "_" + id + "SummaryTitle";
            const vProp = "_" + id + "SummaryValue";

            this[tProp] = new St.Label({
                text: SumaryDetailLabels[id] + ":",
                style_class: CLASS.CURRENT_SUMMARY_DETAILS_TITLE
            });

            this[vProp] = new St.Label(textOb);

            summaryGrid.attach(this[tProp], 0, index, 1, 1);
            summaryGrid.attach(this[vProp], 1, index, 1, 1);

            index++;
        }

        const grid = new Clutter.GridLayout({
            orientation: Clutter.Orientation.HORIZONTAL
        });
        grid.set_column_homogeneous(true);

        const table = new St.Widget({
            layout_manager: grid
        });

        grid.attach(leftBox, 0, 1, 1, 1);
        grid.attach(midleBox, 1, 1, 1, 1);
        grid.attach(rightBox, 2, 1, 1, 1);

        this._currentWeather.set_child(table);
    }

    rebuildFutureWeatherUi() {
        this._ensureProvider();

        if (this.weatherProvider === null) {
            return;
        }

        this.destroyFutureWeather();

        this._forecast = [];

        this._forecastBox = new Clutter.GridLayout({
            orientation: this.$._.menu_orientation === "vertical" ?
                Clutter.Orientation.VERTICAL : Clutter.Orientation.HORIZONTAL
        });
        this._forecastBox.set_column_homogeneous(true);

        const table = new St.Widget({
            layout_manager: this._forecastBox
        });

        this._futureWeather.set_child(table);

        const maxDays = Math.min(
            this.weatherProvider.forecastDays,
            this.weatherProvider.maxForecastsSupport
        );

        const breakPoint = Math.ceil(maxDays / this.weatherProvider.forecastRowsCols);

        for (let i = 0; i < maxDays; i++) {
            const forecastWeather = {};

            forecastWeather.Icon = new St.Icon({
                icon_type: this.$._.menu_icon_type,
                icon_size: this.$._.forecasts_icon_size,
                icon_name: Icons.REFRESH_ICON,
                style_class: CLASS.FORECAST_ICON
            });

            // Set reactive to trigger tooltips.
            forecastWeather.Day = new St.Label({
                text: Placeholders.LOADING,
                style_class: CLASS.FORECAST_DAY,
                reactive: true
            });
            forecastWeather.Day._tooltip = new IntelligentTooltip(forecastWeather.Day, "");

            // Set reactive to trigger tooltips.
            forecastWeather.Summary = new St.Label({
                text: Placeholders.LOADING,
                style_class: CLASS.FORECAST_SUMMARY,
                reactive: true
            });
            forecastWeather.Summary._tooltip = new IntelligentTooltip(forecastWeather.Summary, "");

            forecastWeather.Temperature = new St.Label({
                text: Placeholders.LOADING,
                style_class: CLASS.FORECAST_TEMPERATURE
            });

            const by = new St.BoxLayout({
                vertical: true,
                style_class: CLASS.FORECAST_DATA_BOX
            });
            by.add_actor(forecastWeather.Day);
            by.add_actor(forecastWeather.Summary);
            by.add_actor(forecastWeather.Temperature);

            const bb = new St.BoxLayout({
                style_class: CLASS.FORECAST_BOX
            });

            bb.add_actor(forecastWeather.Icon);
            bb.add_actor(by);

            this._forecast[i] = forecastWeather;

            const breakIt = i > breakPoint - 1;
            const col = this.$._.menu_orientation === "vertical" ?
                breakIt ? 1 : 0 :
                breakIt ? i - breakPoint : i;
            const row = this.$._.menu_orientation === "vertical" ?
                breakIt ? i - breakPoint : i :
                breakIt ? 1 : 0;
            this._forecastBox.attach(bb, col, row, 1, 1);
        }
    }

    unitToUnicode() {
        return UNICODE_SYMBOLS[this.$._.temperature_unit];
    }

    _getConditionData(aType, aCode) {
        const providerData = Constants[this.weatherProvider.providerID + "ConditionData"];

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

        return _("Not available");
    }

    weatherIconSafely(code) {
        if (this.$._.icon_theme !== "system") {
            return "wi-" + code;
        }

        const iconname = this._getConditionData("icon", code);
        for (let i = 0; i < iconname.length; i++) {
            if (Gtk.IconTheme.get_default().has_icon(iconname[i] +
                    (this.$._.menu_icon_type === St.IconType.SYMBOLIC ? "-symbolic" : ""))) {
                return iconname[i];
            }
        }
        return "weather-severe-alert";
    }

    _onButtonEnterEvent(aActor, aEvent) { // jshint ignore:line
        global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
        return false;
    }

    _onButtonLeaveEvent(aActor, aEvent) { // jshint ignore:line
        global.unset_cursor();
    }

    convertTo24Hours(aTimeStr) {
        if (!aTimeStr) {
            return "";
        }

        const s = aTimeStr.indexOf(":");
        const t = aTimeStr.indexOf(" ");
        const n = aTimeStr.length;
        let hh = aTimeStr.substr(0, s);
        const mm = aTimeStr.substring(s + 1, t);

        if (parseInt(hh, 10) < 10) { // pad
            hh = "0" + hh;
        }

        const beforeNoon = aTimeStr.substr(n - 2).toLowerCase() === "am";
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
    }

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
    tempUnitsFormatter(aVal) {
        let convertedValue = UNICODE_SYMBOLS.warning + aVal;

        tryFn(() => {
            const converter = Qty.swiftConverter(
                QtyTempUnits[this.weatherProvider.tempUnit],
                QtyTempUnits[this.$._.temperature_unit]
            );

            convertedValue = Math.round(Number(converter(aVal)));
        }, (aErr) => {
            global.logWarning("Input unit: " + QtyTempUnits[this.weatherProvider.tempUnit]);
            global.logWarning("Output unit: " + QtyTempUnits[this.$._.temperature_unit]);
            global.logWarning(aErr);
        });

        return String(convertedValue);
    }

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
    pressureUnitsFormatter(aVal) {
        let inUnit = this.weatherProvider.pressureUnit;
        let outUnit = this.$._.pressure_unit;
        let convertedValue = UNICODE_SYMBOLS.warning + aVal;

        tryFn(() => {
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

            const converter = Qty.swiftConverter(
                inUnit,
                outUnit
            );

            convertedValue = converter(aVal / inFactor) * outFactor;

            switch (this.$._.pressure_unit) {
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
        }, (aErr) => {
            global.logWarning("Input unit: " + inUnit);
            global.logWarning("Output unit: " + outUnit);
            global.logWarning(aErr);
        });

        return String(convertedValue);
    }

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
    speedUnitsFormatter(aVal) {
        let convertedValue = UNICODE_SYMBOLS.warning + aVal;

        tryFn(() => {
            const converter = Qty.swiftConverter(
                this.weatherProvider.windSpeedUnit,
                this.$._.wind_speed_unit
            );

            convertedValue = Math.round(converter(aVal));
        }, (aErr) => {
            global.logWarning("Input unit: " + this.weatherProvider.windSpeedUnit);
            global.logWarning("Output unit: " + this.$._.wind_speed_unit);
            global.logWarning(aErr);
        });

        return String(convertedValue);
    }

    distanceUnitsFormatter(aVal) {
        let convertedValue = UNICODE_SYMBOLS.warning + aVal;

        tryFn(() => {
            const converter = Qty.swiftConverter(
                this.weatherProvider.distanceUnit,
                this.$._.distance_unit
            );

            convertedValue = Math.round(converter(aVal));
        }, (aErr) => {
            global.logWarning("Input unit: " + this.weatherProvider.distanceUnit);
            global.logWarning("Output unit: " + this.$._.distance_unit);
            global.logWarning(aErr);
        });

        return String(convertedValue);
    }

    _ensureProvider() {
        // If there is no provider.
        if (this.weatherProvider === null ||
            // Or if the current location changed.
            this.weatherProvider.uuid !== this.$._.current_location) {
            this.weatherProvider = this._getWeatherProvider();

            return true;
        }

        if (this.locationsMap && this.locationsMap.has(this.$._.current_location)) {
            const location = this.locationsMap.get(this.$._.current_location);

            // If the forecasts days or rows/cols numbers changed.
            if (location.forecastDays !== this.weatherProvider.forecastDays ||
                location.forecastRowsCols !== this.weatherProvider.forecastRowsCols) {
                this.weatherProvider = this._getWeatherProvider();
                return true;
            }
        }

        return true;
    }

    sortLocations(aLocationsObj) {
        // Stick with the JSON trick. Do not use Object.assign().
        return JSON.parse(JSON.stringify(aLocationsObj)).sort((a, b) => {
            return a.locationName.localeCompare(b.locationName);
        });
    }

    updateLocationsMap() {
        tryFn(() => {
            this.locationsMap = new Map(
                this.sortLocations(this.$._.locations_storage).map((aObj) => {
                    return [aObj.locationID + ":" + aObj.providerID, aObj];
                })
            );
        }, (aErr) => {
            global.logError(aErr);
            this.locationsMap = null;
        });
    }

    displayErrorMessage(aMsg, aContext = "error", aAppend = false) {
        this._errorBox.show();

        if (aAppend) {
            this._errorMessage.label = this._errorMessage.label + " " + aMsg;
        } else {
            this._errorMessage.label = aMsg;
        }

        this._errorBox.set_style_pseudo_class(aContext);
        this._errorMessage.set_style_pseudo_class(aContext);
    }

    sanitizeStoredLocations() {
        // Stick with the JSON trick. Do not use Object.assign().
        const cachedLocationKeys = Object.keys(JSON.parse(JSON.stringify(this.$._.weather_data)));
        let i = cachedLocationKeys.length;
        while (i--) {
            if (!this.locationsMap.has(cachedLocationKeys[i])) {
                delete this.$._.weather_data[cachedLocationKeys[i]];
            }
        }
    }

    _loadTheme(aFullReload = false) {
        tryFn(() => {
            this.unloadStylesheet();
        }, (aErr) => {
            global.logError(aErr);
        }, () => {
            this.$.schedule_manager.setTimeout("load_theme", function() {
                tryFn(() => {
                    /* NOTE: Without calling Main.loadTheme() this xlet stylesheet
                     * doesn't reload correctly. ¬¬
                     */
                    if (aFullReload) {
                        Main.themeManager._changeTheme();
                    }

                    this.loadStylesheet();

                }, (aErr) => global.logError(aErr));
            }.bind(this), 1000);
        });
    }

    loadStylesheet() {
        this.stylesheet = this._getCssPath();

        tryFn(() => {
            const themeContext = St.ThemeContext.get_for_stage(global.stage);
            this.theme = themeContext.get_theme();
        }, (aErr) => {
            global.logError(_("Error trying to get theme"));
            global.logError(aErr);
        });

        tryFn(() => {
            this.theme.load_stylesheet(this.stylesheet);
        }, (aErr) => {
            global.logError(_("Stylesheet parse error"));
            global.logError(aErr);
        });
    }

    unloadStylesheet() {
        if (this.theme && this.stylesheet) {
            tryFn(() => {
                this.theme.unload_stylesheet(this.stylesheet);
            }, (aErr) => {
                global.logError(_("Error unloading stylesheet"));
                global.logError(aErr);
            }, () => {
                this.theme = null;
                this.stylesheet = null;
            });
        }
    }

    _getCssPath() {
        const defaultThemepath = this.$.metadata.path + "/themes/default.css";
        const cssFile = new File(this.$._.menu_theme === "custom" ?
            this.$._.menu_theme_path_custom :
            defaultThemepath);

        if (cssFile.is_file) {
            return cssFile.path;
        }

        return defaultThemepath;
    }

    __onSettingsChanged(aPrefOldValue, aPrefKey) {
        switch (aPrefKey) {
            case "toggle_menu_keybinding":
                this._updateKeybindings();
                break;
            case "refresh_interval":
            case "show_current_condition_in_panel":
            case "show_current_temperature_in_panel":
            case "menu_orientation":
            case "show_common_sense_hours":
            case "temperature_unit":
            case "temperature_high_first":
            case "forecats_display_dates":
            case "pressure_unit":
            case "wind_speed_unit":
            case "distance_unit":
                this.refreshAndRebuild();
                break;
            case "current_weather_icon_size":
            case "forecasts_icon_size":
            case "applet_icon_type":
            case "menu_icon_type":
            case "icon_theme":
            case "icon_theme_path_custom":
                if (aPrefKey === "icon_theme_path_custom" ||
                    aPrefKey === "icon_theme") {
                    this.appendIconThemePath();
                }

                this.refreshIcons();
                break;
            case "locations_storage_apply":
                this.updateLocationsMap();
                this.sanitizeStoredLocations();
                this.refreshAndRebuild();
                this.locationSelectorMenu.populateMenu();
                break;
            case "menu_theme":
            case "menu_theme_path_custom":
                if (aPrefKey === "menu_theme_path_custom" &&
                    this.$._.menu_theme !== "custom") {
                    return;
                }

                this._loadTheme(true);
                break;
        }
    }
}

function main() {
    Debugger.wrapObjectMethods({
        CustomPanelItemTooltip: CustomPanelItemTooltip,
        IntelligentTooltip: IntelligentTooltip,
        Weather: Weather
    });

    return new Weather(...arguments);
}
