const {
    gi: {
        GLib,
        St
    },
    misc: {
        util: Util
    },
    ui: {
        applet: Applet,
        main: Main,
        popupMenu: PopupMenu
    }
} = imports;

const {
    APPLET_PREFS,
    DefaultAttributes,
    Placeholders,
    UnitsMultiplicationFactor
} = require("js_modules/constants.js");

const {
    _,
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
    SpawnReader
} = require("js_modules/spawnUtils.js");

const {
    CustomPopupSliderMenuItem
} = require("js_modules/customPopupMenu.js");

const {
    ConfirmDialog
} = require("js_modules/customDialogs.js");

const {
    getBaseAppletClass
} = require("js_modules/appletsUtils.js");

const {
    File
} = require("js_modules/customFileUtils.js");

const {
    ArgosLineView,
    ArgosMenuItem,
    CustomSubMenuItem,
    Debugger,
    getUnitPluralForm,
    Notification,
    parseLine,
    UnitSelectorSubMenuItem
} = require("js_modules/utils.js");

class Argos extends getBaseAppletClass(Applet.TextIconApplet) {
    constructor(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
        super({
            metadata: aMetadata,
            orientation: aOrientation,
            panel_height: aPanelHeight,
            instance_id: aInstanceID,
            pref_keys: APPLET_PREFS
        });

        this.__initializeApplet(() => {
            this._updateIconAndLabel();
            this._expandAppletContextMenu();
            this.outputReader = new SpawnReader();
        }, () => {
            this._lineView = new ArgosLineView(this.$.settings, null, null, true);
            this.actor.add_actor(this._lineView.actor);

            this._file = null;
            this._timeScriptExecutionStarted = null;
            this._timeScriptExecutionFinished = null;
            this._timeOutputProcessingStarted = null;
            this._timeOutputProcessingFinished = null;
            this._isDestroyed = false;
            this._rotationLineIndex = 0;
            this._updateRunning = false;
            this._processingFile = false;
            this._sliderIsSliding = false;
            this._updatePending = false;
            this._tooltipData = new Map([
                ["scriptName", _("Script file name")],
                ["execInterval", _("Execution interval")],
                ["rotationInterval", _("Rotation interval")],
                ["scriptExecTime", _("Script execution time")],
                ["outputProcesstime", _("Output process time")]
            ]);

            this._processFile(true);
            this._updateKeybinding();

            if (!this.$._.initial_load_done) {
                this.$.schedule_manager.setTimeout("initial_load", function() {
                    this.$._.file_path = `${aMetadata.path}/examples/python_examples.py`;
                    this.$._.initial_load_done = true;
                    this._processFile();
                }.bind(this), 1000);
            }
        });
    }

    __connectSignals() {
        this.$.signal_manager.connect(this, "orientation-changed", function() {
            this.__seekAndDetroyConfigureContext();
        }.bind(this));
        this.$.signal_manager.connect(this.menu, "open-state-changed", function(aMenu, aOpen) {
            if ((this.$._.cycle_on_menu_open || this.$._.update_on_menu_open) &&
                aOpen) {
                this.update();
            }
        }.bind(this));
    }

    _processFile(aForceUpdate = false) {
        /* NOTE: The _processingFile property is a fail safe. The file_path
         * preference is bound to trigger this._processFile(). But the freaking
         * preference doesn't always trigger the callback when changed, so I have
         * to manually call this._processFile() in some places. So, in the case
         * that the callback is triggered whenever the f*ck it wants when the pref.
         * is changed AND the callback is manually called, avoid re-processing the
         * file when the _processingFile property is set to true.
         * I could have used Mainloop to throttle this function, but I'm f*cking fed
         * up with dealing with CJS nonsenses! FFS!!!!
         */
        if (this._processingFile) {
            return;
        }

        let do_udpate = true;
        this._processingFile = true;
        this._timeScriptExecutionStarted = null;
        this._timeScriptExecutionFinished = null;
        this._timeOutputProcessingStarted = null;
        this._timeOutputProcessingFinished = null;

        this._setAppletTooltip();

        if (this._file) {
            this._file.destroy();
            this._file = null;
        }

        this._file = new File(this.$._.file_path, {
            init_parent: true
        });

        // Make all checks individually so I can make precise notifications.
        if (!this._file.exists) {
            do_udpate = false;
            // Notify only if the path to the script is set.
            // Otherwise, it would be ultra annoying. LOL
            if (!isBlank(this.$._.file_path)) {
                Notification.notify([
                    escapeHTML(_("Script file doesn't exists.")),
                    escapeHTML(this._file.gio_file.peek_path())
                ]);
            }
        } else if (this._file.is_directory) {
            do_udpate = false;
            Notification.notify([
                escapeHTML(_("Script file isn't a file, but a directory.")),
                escapeHTML(this._file.gio_file.peek_path())
            ]);
        } else if (!this._file.is_executable) {
            do_udpate = false;
            Notification.notify([
                escapeHTML(_("Script file is not executable.")),
                escapeHTML(this._file.gio_file.peek_path()),
                escapeHTML(_("The script file can be made executable from this applet context menu."))
            ]);
        }

        if (do_udpate) {
            this.update(aForceUpdate);
        } else {
            // If this._file is null, it might be because the script assigned to the applet was
            // removed, so clean up all remaining data (menu elements, applet text, etc.).
            this._lineView.setLine(this.defaultAttributes);
            this.menu.removeAll();
        }

        this._processingFile = false;
    }

    update(aForceUpdate) {
        this._syncLabelsWithSlidersValue();

        this.$.schedule_manager.clearSchedule("update");
        this.$.schedule_manager.clearSchedule("update_internal");

        if (this._applet_context_menu.isOpen) {
            return;
        }

        // This is absolutelly needed because this.update could be triggered
        // hundreds of times by the sliders.
        this.$.schedule_manager.setTimeout("update_internal", function() {
            this._update(aForceUpdate);
        }.bind(this), 100);
    }

    _update(aForceUpdate = false) {
        if (this._updateRunning) {
            return;
        }

        this._updateRunning = true;
        const envp = GLib.get_environ();

        tryFn(() => {
            const updateInterval = this._getInterval("update_interval");

            if (!aForceUpdate && this.$._.cycle_on_menu_open && !this.menu.isOpen && updateInterval > 0) {
                this.$.schedule_manager.setTimeout("update", function() {
                    this._update();
                }.bind(this), updateInterval);

                this._updateRunning = false;

                return;
            }

            envp.push("ARGOS_VERSION=2");
            envp.push(`ARGOS_MENU_OPEN=${this.menu.isOpen ? "true" : "false"}`);

            this._timeScriptExecutionStarted = GLib.get_monotonic_time();
            this.outputReader.spawn(this._file.parent_path, [this._file.path], envp, (aStandardOutput) => {
                if (this._isDestroyed) {
                    return;
                }

                this._timeScriptExecutionFinished = GLib.get_monotonic_time();
                this._processOutput(aStandardOutput.split("\n"));

                if (updateInterval > 0) {
                    this.$.schedule_manager.setTimeout("update", function() {
                        this._update();
                    }.bind(this), updateInterval);
                }

                this._updateRunning = false;
            });
        }, (aErr) => {
            // TO TRANSLATORS: Full sentence:
            // "Unable to execute file 'FileName':"
            const msg = _("Unable to execute file '%s':").format(this._file.gio_file.get_basename());
            global.logError(`${msg} ${aErr}`);
            Notification.notify([
                escapeHTML(msg),
                escapeHTML(_("Script file not set, cannot be found or it isn't an executable."))
            ]);
            this._updateRunning = false;
        });
    }

    _getInterval(aPref) {
        if (this.$._[`${aPref}_units`] in UnitsMultiplicationFactor && !isNaN(this.$._[aPref])) {
            return parseInt(this.$._[aPref], 10) * 1000 * UnitsMultiplicationFactor[this.$._[`${aPref}_units`]] || 0;
        }

        return 0;
    }

    _processOutput(aOutput) {
        this._timeOutputProcessingStarted = GLib.get_monotonic_time();
        const appletLines = [];
        const menuLines = [];
        let insertToMenu = false;

        for (const line of aOutput) {
            if (line.length === 0) {
                continue;
            }

            const parsedLine = parseLine(line);

            if (!insertToMenu && parsedLine.isSeparator) {
                insertToMenu = true;
            } else if (insertToMenu) {
                menuLines.push(parsedLine);
            } else {
                appletLines.push(parsedLine);
            }
        }

        // NOTE: Miracle that this worked!!! LOL
        // Grabbing the key focus before removing all items in the menu avoids
        // the closing of the menu when the menu is updated while open and the
        // mouse cursor is placed on an active menu item.
        this.menu.actor.grab_key_focus();
        this.menu.removeAll();

        this.$.schedule_manager.clearSchedule("cycle");
        this._lineView.actor.set_style(`spacing: ${this.$._.applet_spacing}px;`);

        if (appletLines.length === 0) {
            const attrs = this.defaultAttributes;

            if (this.$._.show_script_name) {
                attrs.markup = GLib.markup_escape_text(this._file.gio_file.get_basename(), -1);
            }

            this._lineView.setLine(attrs);
        } else if (appletLines.length === 1) {
            this._lineView.setLine(appletLines[0]);
        } else {
            this._lineView.setLine(appletLines[0]);
            this._rotationLineIndex = 0;
            const rotationInterval = this._getInterval("rotation_interval");

            if (rotationInterval > 0) {
                this.$.schedule_manager.setInterval("cycle", function() {
                    this._rotationLineIndex++;
                    this._lineView.setLine(appletLines[this._rotationLineIndex % appletLines.length]);
                }.bind(this), rotationInterval);
            }
        }

        for (const line of appletLines) {
            if (line.dropdown) {
                this.menu.addMenuItem(new ArgosMenuItem({
                    applet_menu: this.menu,
                    update_cb: function() {
                        this.update();
                    }.bind(this),
                    settings: this.$.settings,
                    line: line
                }));
            }
        }

        if (this.menu.numMenuItems > 0) {
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }

        const menus = {};
        menus[0] = this.menu;
        let l = 0,
            lLen = menuLines.length;
        for (; l < lLen; l++) {
            let menu;

            if (menuLines[l].menuLevel in menus) {
                menu = menus[menuLines[l].menuLevel];
            } else {
                // TO TRANSLATORS: Full sentence:
                // "Invalid menu level for line 'LineWithTheError'"
                global.logError(_("Invalid menu level for line '%s'")).format(menuLines[l].text);
                menu = this.menu;
            }

            let menuItem = null;

            if ((l + 1) < menuLines.length &&
                menuLines[l + 1].menuLevel > menuLines[l].menuLevel &&
                !menuLines[l].isSeparator) {
                // GNOME Shell actually supports only a single submenu nesting level
                // (deeper levels are rendered, but opening them closes the parent menu).
                // Since adding PopupSubMenuMenuItems to submenus does not trigger
                // an error or warning, this should be considered a bug in GNOME Shell.
                // Once it is fixed, this code will work as expected for nested submenus.
                //
                // Note by Odyseus:
                // The previous comment by the original author of the Argos extension
                // is not true for Cinnamon submenus. The problem described is caused
                // by the Gnome Shell feature that allows to auto close opened submenus
                // when another one is being opened. Cinnamon doesn't have such feature.
                //
                // As I really like that feature, I add it to all my applets with menus,
                // but without breaking the ability to open submenus inside other submenus.
                const lineView = new ArgosLineView(this.$.settings, menuLines[l]);
                menuItem = new CustomSubMenuItem(this.$.settings, lineView.actor, menuLines[l].menuLevel);
                menus[menuLines[l + 1].menuLevel] = menuItem.menu;
            } else if ((l + 1) < menuLines.length &&
                menuLines[l + 1].menuLevel === menuLines[l].menuLevel &&
                menuLines[l + 1].alternate &&
                !menuLines[l].isSeparator) {
                menuItem = new ArgosMenuItem({
                    applet_menu: this.menu,
                    update_cb: function() {
                        this.update();
                    }.bind(this),
                    settings: this.$.settings,
                    line: menuLines[l],
                    alt_line: menuLines[l + 1]
                });
                // Increment to skip alternate line.
                l++;
            } else {
                if (menuLines[l].isSeparator) {
                    menuItem = new PopupMenu.PopupSeparatorMenuItem();
                } else {
                    menuItem = new ArgosMenuItem({
                        applet_menu: this.menu,
                        update_cb: function() {
                            this.update();
                        }.bind(this),
                        settings: this.$.settings,
                        line: menuLines[l]
                    });
                }
            }

            if (menuItem !== null) {
                menu.addMenuItem(menuItem);
            }
        }

        this._timeOutputProcessingFinished = GLib.get_monotonic_time();
        this._setAppletTooltip();
    }

    _setAppletTooltip() {
        if (this._applet_tooltip && !(this._applet_tooltip instanceof CustomPanelItemTooltip)) {
            this._applet_tooltip.destroy();
            this._applet_tooltip = new CustomPanelItemTooltip(this, this.$.orientation, {
                label: _(this.$.metadata.name),
                grid_data: this._tooltipData
            });
        }

        let scriptExecTime = null;
        let outputProcesstime = null;

        if (typeof this._timeScriptExecutionStarted === "number" &&
            typeof this._timeScriptExecutionFinished === "number") {
            const executionTime = ((this._timeScriptExecutionFinished -
                this._timeScriptExecutionStarted) / 1000).toFixed(2);
            scriptExecTime = `${executionTime} ${getUnitPluralForm("ms", executionTime)}`;
        }

        if (typeof this._timeOutputProcessingStarted === "number" &&
            typeof this._timeOutputProcessingFinished === "number") {
            const processTime = ((this._timeOutputProcessingFinished -
                this._timeOutputProcessingStarted) / 1000).toFixed(2);
            outputProcesstime = `${processTime} ${getUnitPluralForm("ms", processTime)}`;
        }

        const execIntervalUnit = getUnitPluralForm(this.$._.update_interval_units, this.$._.update_interval);
        const rotationIntervalUnit = getUnitPluralForm(this.$._.rotation_interval_units, this.$._.rotation_interval);

        tryFn(() => {
            this._applet_tooltip.set_text_by_id("scriptName", (this._file && this._file.exists ?
                escapeHTML(this._file.gio_file.get_basename()) :
                escapeHTML(_("No script set"))));
            this._applet_tooltip.set_text_by_id("execInterval", `${this.$._.update_interval} ${execIntervalUnit}`);
            this._applet_tooltip.set_text_by_id("rotationInterval", `${this.$._.rotation_interval} ${rotationIntervalUnit}`);
            this._applet_tooltip.set_text_by_id("scriptExecTime", (scriptExecTime === null ?
                Placeholders.ELLIPSIS :
                scriptExecTime));
            this._applet_tooltip.set_text_by_id("outputProcesstime", (outputProcesstime === null ?
                Placeholders.ELLIPSIS :
                outputProcesstime));
        }, (aErr) => {
            global.logError(aErr);
        });
    }

    onSliderChanged(aSlider, aValue, aStopUpdate, aPref) {
        if (aStopUpdate || !aPref) {
            return;
        }

        const value = Math.max(0, Math.min(1, parseFloat(aValue)));
        const newValue = parseInt(Math.floor(value * 3600), 10);

        this.$._[aPref] = newValue;

        this._syncLabelsWithSlidersValue(aSlider);

        if (!this._sliderIsSliding) {
            this.update();
        }
    }

    onSliderGrabbed(aSlider) { // jshint ignore:line
        this._sliderIsSliding = true;
        this._syncLabelsWithSlidersValue(aSlider);
    }

    onSliderReleased(aSlider) {
        this._sliderIsSliding = false;
        aSlider.emit("value-changed", aSlider.value);
    }

    _syncLabelsWithSlidersValue(aSlider = null) {
        // If there is no slider specified, update all of them.
        if (aSlider) {
            if (aSlider.params.associated_submenu &&
                this.hasOwnProperty(aSlider.params.associated_submenu)) {
                this[aSlider.params.associated_submenu].setLabel();
                this[aSlider.params.associated_submenu]._setCheckedState();
            }
        } else {
            this.updateIntervalLabel.setLabel();
            this.updateIntervalLabel._setCheckedState();
            this.rotationIntervalLabel.setLabel();
            this.rotationIntervalLabel._setCheckedState();
        }
    }

    _expandAppletContextMenu() {
        // Execution interval unit selector submenu.
        this.updateIntervalLabel = new UnitSelectorSubMenuItem({
            settings: this.$.settings,
            label: `<b>${_("Execution interval")}:</b>`,
            tooltip: _("Choose the time unit for the script execution interval."),
            value_key: "update_interval",
            units_key: "update_interval_units",
            set_unit_cb: function() {
                this._updatePending = true;
                this._setUpdateInterval();
            }.bind(this)
        });
        this.updateIntervalLabel.menu.connect("open-state-changed",
            (aMenu, aOpen) => this._contextSubMenuOpenStateChanged(aMenu, aOpen));

        this._applet_context_menu.addMenuItem(this.updateIntervalLabel);

        // Execution interval slider
        this.updateIntervalSlider = new CustomPopupSliderMenuItem({
            value: parseFloat(this.$._.update_interval / 3600),
            associated_submenu: "updateIntervalLabel",
            tooltip: _("Set the script execution interval."),
            value_changed_cb: function(aSlider, aValue) {
                this._updatePending = true;
                this.onSliderChanged(aSlider, aValue, false, "update_interval");
            }.bind(this),
            drag_begin_cb: function(aSlider) {
                this.onSliderGrabbed(aSlider);
            }.bind(this),
            drag_end_cb: function(aSlider) {
                this.onSliderReleased(aSlider);
            }.bind(this)
        });

        this._applet_context_menu.addMenuItem(this.updateIntervalSlider);

        this._applet_context_menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Rotation interval unit selector submenu.
        this.rotationIntervalLabel = new UnitSelectorSubMenuItem({
            settings: this.$.settings,
            label: `<b>${_("Rotation interval")}:</b>`,
            tooltip: _("Choose the time unit for the applet text rotation interval."),
            value_key: "rotation_interval",
            units_key: "rotation_interval_units",
            set_unit_cb: function() {
                this._updatePending = true;
                this._setRotationInterval();
            }.bind(this)
        });
        this.rotationIntervalLabel.menu.connect("open-state-changed",
            (aMenu, aOpen) => this._contextSubMenuOpenStateChanged(aMenu, aOpen));

        this._applet_context_menu.addMenuItem(this.rotationIntervalLabel);

        // Rotation interval slider
        this.rotationIntervalSlider = new CustomPopupSliderMenuItem({
            value: parseFloat(this.$._.rotation_interval / 3600),
            associated_submenu: "rotationIntervalLabel",
            tooltip: _("Set the applet text rotation interval."),
            value_changed_cb: function(aSlider, aValue) {
                this._updatePending = true;
                this.onSliderChanged(aSlider, aValue, false, "rotation_interval");
            }.bind(this),
            drag_begin_cb: function(aSlider) {
                this.onSliderGrabbed(aSlider);
            }.bind(this),
            drag_end_cb: function(aSlider) {
                this.onSliderReleased(aSlider);
            }.bind(this)
        });

        this._applet_context_menu.addMenuItem(this.rotationIntervalSlider);

        this._applet_context_menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        let menuItem;

        // Choose script file
        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Choose script"),
            "document-open",
            St.IconType.SYMBOLIC
        );
        menuItem.connect("activate", () => {
            Util.spawn_async([`${this.$.metadata.path}/appletHelper.py`,
                    "open",
                    this.$._.last_selected_directory
                ],
                (aOutput) => {
                    const path = aOutput.trim();

                    if (!Boolean(path)) {
                        return;
                    }

                    // I don't know why this doesn't trigger the callback attached to the preference.
                    // That's why I added the call to this._processFile in here too.
                    // Just in case, I also added the this._processingFile check in case in some
                    // other versions of Cinnamon the callback it's triggered.
                    this.$._.file_path = path;
                    this.$._.last_selected_directory = path;
                    this._processFile();
                });
        });
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _("Choose a script file.")
        );
        this._applet_context_menu.addMenuItem(menuItem);

        // Edit script
        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Edit script"),
            "text-editor",
            St.IconType.SYMBOLIC
        );
        menuItem.connect("activate", () => {
            if (!this._file.exists) {
                Notification.notify(
                    escapeHTML(_("Script file not set, cannot be found or it isn't an executable."))
                );
            } else {
                // The original Argos extension uses Gio.AppInfo.launch_default_for_uri
                // to open the script file. I prefer to stay away from non asynchronous functions.
                // Gio.AppInfo.launch_default_for_uri_async is still too new.
                launchUri(this._file.path);
            }
        });
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _("Edit the script file with your prefered text editor.") + "\n" +
            _("After saving the changes made, the applet will update its data automatically if there is an interval set.") + "\n" +
            _("Or the update could be done manually with the »Refresh« item on this applet context menu.")
        );
        this._applet_context_menu.addMenuItem(menuItem);

        // Refresh
        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Refresh"),
            "view-refresh",
            St.IconType.SYMBOLIC
        );
        menuItem.connect("activate", () => {
            if (!this._file.exists) {
                Notification.notify(
                    escapeHTML(_("Script file not set, cannot be found or it isn't an executable."))
                );
            } else {
                this.update(true);
            }
        });
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _("This will re-run on demand the script assigned to this applet for the purpose of updating its output.") + "\n" +
            _("This is only needed when there is no update interval set (or the interval is too long), so the update needs to be done manually in case the script is edited.")
        );
        this._applet_context_menu.addMenuItem(menuItem);

        this._applet_context_menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Extras submenu
        const subMenu = new PopupMenu.PopupSubMenuMenuItem(_("Extras"));
        subMenu.menu.connect("open-state-changed",
            (aMenu, aOpen) => this._contextSubMenuOpenStateChanged(aMenu, aOpen));
        this._applet_context_menu.addMenuItem(subMenu);

        // Clear script
        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Clear script"),
            "edit-clear",
            St.IconType.SYMBOLIC
        );
        menuItem.connect("activate", () => {
            const dialog = new ConfirmDialog({
                headline: _(this.$.metadata.name),
                description: _('This operation will remove the current script from this applet leaving it "blank".') + "\n" +
                    _("The current applet settings will be untouched and the actual script file will not be deleted.") + "\n" +
                    _("Do you want to proceed?") + "\n",
                cancel_label: _("No"),
                ok_label: _("Yes"),
                callback: () => {
                    // Clear the applet text. Otherwise, it will keep rotating.
                    this.$.schedule_manager.clearSchedule("cycle");

                    this.$._.file_path = "";
                    this._lineView.setLine(this.defaultAttributes);
                    this._processFile();
                }
            });
            dialog.open();
        });
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _('This operation will remove the current script from this applet leaving it "blank".')
        );
        subMenu.menu.addMenuItem(menuItem);

        // Make script executable
        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Make script executable"),
            "application-x-executable",
            St.IconType.SYMBOLIC
        );
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _("Make the script file executable so it can be used by this applet.")
        );
        menuItem.connect("activate", () => {
            if (this._file === null || !this.$._.file_path) {
                Notification.notify([
                    escapeHTML(_("Script file not set."))
                ]);
                return;
            }

            if (this._file.is_executable) {
                Notification.notify([
                    escapeHTML(_("Script file is already executable.")),
                    escapeHTML(this._file.path)
                ]);
            } else {
                if (this._file.is_directory) {
                    Notification.notify([
                        escapeHTML(_("Script file isn't a file, but a directory.")),
                        escapeHTML(this._file.path)
                    ]);
                } else if (this._file.exists) {
                    this._file.chmod(755).then(() => {
                        this.$.schedule_manager.setTimeout("set_file_mode", function() {
                            this._processFile();
                        }.bind(this), 1000);
                    }).catch((aErr) => global.logError(aErr));
                } else {
                    Notification.notify([
                        escapeHTML(_("Script file doesn't exists.")),
                        escapeHTML(this._file.path)
                    ]);
                }
            }
        });
        subMenu.menu.addMenuItem(menuItem);

        // Help
        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Help"),
            "dialog-information",
            St.IconType.SYMBOLIC
        );
        menuItem.tooltip = new IntelligentTooltip(menuItem.actor, _("Open this applet help file."));
        menuItem.connect("activate", () => this.__openHelpPage());
        subMenu.menu.addMenuItem(menuItem);

        this._applet_context_menu.connect("open-state-changed", (aMenu, aOpen) => {
            if (!aOpen && this._updatePending) {
                this._updatePending = false;
                this.update(true);
            }
        });

        this._syncLabelsWithSlidersValue();
        this.__seekAndDetroyConfigureContext();
    }

    _setUpdateInterval() {
        this.updateIntervalSlider.setValue(this.$._.update_interval / 3600);
        this._syncLabelsWithSlidersValue(this.updateIntervalSlider);

        this.$.schedule_manager.idleCall("update_interval", function() {
            this._sliderIsSliding || this.update();
        }.bind(this));
    }

    _setRotationInterval() {
        this.rotationIntervalSlider.setValue(this.$._.rotation_interval / 3600);
        this._syncLabelsWithSlidersValue(this.rotationIntervalSlider);

        this.$.schedule_manager.idleCall("update_interval", function() {
            this._sliderIsSliding || this.update();
        }.bind(this));
    }

    _contextSubMenuOpenStateChanged(aMenu, aOpen) {
        if (aOpen && this.$._.keep_one_menu_open) {
            for (const child of aMenu._getTopMenu()._getMenuItems()) {
                if (child instanceof PopupMenu.PopupSubMenuMenuItem ||
                    child instanceof UnitSelectorSubMenuItem) {
                    if (aMenu !== child.menu) {
                        child.menu.close(true);
                    }
                }
            }
        }
    }

    _updateIconAndLabel() {
        this.__setAppletIcon(this.$._.applet_icon);
        this.set_applet_label(_(this.$._.applet_label));
    }

    _toggleMenu() {
        if (!this.menu.isOpen && this.menu.numMenuItems > 0) {
            this.menu.open(this.$._.animate_menu);
        } else {
            this.menu.close(this.$._.animate_menu);
        }
    }

    on_applet_clicked() {
        this._toggleMenu();
    }

    on_applet_removed_from_panel() {
        super.on_applet_removed_from_panel();
        this._isDestroyed = true;

        this.menu.removeAll();
    }

    _updateKeybinding() {
        this.$.keybinding_manager.addKeybinding("toggle_menu", this.$._.toggle_menu_keybinding, () => {
            if (!Main.overview.visible && !Main.expo.visible) {
                this._toggleMenu();
            }
        });
    }

    get defaultAttributes() {
        return Object.assign({}, DefaultAttributes);
    }

    __onSettingsChanged(aPrefOldValue, aPrefKey) {
        switch (aPrefKey) {
            case "applet_icon":
            case "applet_label":
                this._updateIconAndLabel();
                break;
            case "show_script_name":
            case "default_icon_size":
            case "menu_spacing":
            case "applet_spacing":
            case "prevent_applet_lines_ellipsation":
                this.update();
                break;
            case "toggle_menu_keybinding":
                this._updateKeybinding();
                break;
            case "file_path":
                this._processFile();
                break;
        }
    }
}

function main() {
    Debugger.wrapObjectMethods({
        Argos: Argos,
        CustomPanelItemTooltip: CustomPanelItemTooltip,
        CustomPopupSliderMenuItem: CustomPopupSliderMenuItem,
        IntelligentTooltip: IntelligentTooltip,
        SpawnReader: SpawnReader
    });

    return new Argos(...arguments);
}
