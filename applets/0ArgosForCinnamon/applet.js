// {{IMPORTER}}

const GlobalUtils = __import("globalUtils.js");
const Constants = __import("constants.js");
const DebugManager = __import("debugManager.js");
const CustomTooltips = __import("customTooltips.js");
const SpawnUtils = __import("spawnUtils.js");
const $ = __import("utils.js");

const {
    gi: {
        Gio,
        GLib,
        St
    },
    mainloop: Mainloop,
    misc: {
        fileUtils: FileUtils,
        util: Util
    },
    ui: {
        applet: Applet,
        main: Main,
        modalDialog: ModalDialog,
        popupMenu: PopupMenu,
        settings: Settings
    }
} = imports;

const {
    DefaultAttributes,
    Placeholders,
    UnitsMultiplicationFactor
} = Constants;

const {
    _,
    escapeHTML,
    xdgOpen
} = GlobalUtils;

const {
    IntelligentTooltip
} = CustomTooltips;

const OutputReader = new SpawnUtils.SpawnReader();

function Argos() {
    this._init.apply(this, arguments);
}

Argos.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(aMetadata, aOrientation, aPanelHeight, aInstanceId) {
        Applet.TextIconApplet.prototype._init.call(this, aOrientation, aPanelHeight, aInstanceId);

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (Applet.hasOwnProperty("AllowedLayout")) {
            this.setAllowedLayout(Applet.AllowedLayout.BOTH);
        }

        this.metadata = aMetadata;
        this.instance_id = aInstanceId;
        this.orientation = aOrientation;
        this.menu_keybinding_name = this.metadata.uuid + "-" + this.instance_id;

        this._initializeSettings(() => {
            this._expandAppletContextMenu();
        }, () => {
            this._lineView = new $.ArgosLineView(this.settings, null, null, true);
            this.actor.add_actor(this._lineView.actor);

            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menu = new Applet.AppletPopupMenu(this, aOrientation);
            this.menuManager.addMenu(this.menu);

            this._file = null;
            this._timeScriptExecutionStarted = null;
            this._timeScriptExecutionFinished = null;
            this._timeOutputProcessingStarted = null;
            this._timeOutputProcessingFinished = null;
            this._isDestroyed = false;
            this._setFileModeTimeout = 0;
            this._updateTimeout = 0;
            this._callToUpdateTimeout = 0;
            this._cycleTimeout = 0;
            this._initialLoadTimeout = 0;
            this._updateRunning = false;
            this._processingFile = false;
            this._sliderIsSliding = false;
            this._script_path = "";

            this._processFile(true);
            this._updateKeybindings();
            this._updateIconAndLabel();

            this.menu.connect("open-state-changed", (aMenu, aOpen) => {
                if ((this.pref_cycle_on_menu_open || this.pref_update_on_menu_open) &&
                    aOpen) {
                    this.update();
                }
            });

            if (!this.pref_initial_load_done) {
                if (this._initialLoadTimeout > 0) {
                    Mainloop.source_remove(this._initialLoadTimeout);
                    this._initialLoadTimeout = 0;
                }

                this._initialLoadTimeout = Mainloop.timeout_add_seconds(1,
                    () => {
                        this.pref_file_path = aMetadata.path + "/examples/python_examples.py";
                        this.pref_initial_load_done = true;
                        this._processFile();
                    }
                );
            }
        });
    },

    _processFile: function(aForceUpdate = false) {
        /* NOTE: The _processingFile property is a fail safe. The pref_file_path
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

        this._processingFile = true;
        this._timeScriptExecutionStarted = null;
        this._timeScriptExecutionFinished = null;
        this._timeOutputProcessingStarted = null;
        this._timeOutputProcessingFinished = null;

        this._setAppletTooltip();

        this._script_path = this.pref_file_path;

        if (/^file:\/\//.test(this._script_path)) {
            this._script_path = this._script_path.substr(7);
        }

        // Make all checks individually so I can make precise notifications.
        if (GLib.file_test(this._script_path, GLib.FileTest.EXISTS)) {
            if (!GLib.file_test(this._script_path, GLib.FileTest.IS_DIR)) {
                if (GLib.file_test(this._script_path, GLib.FileTest.IS_EXECUTABLE)) {
                    this._file = Gio.file_new_for_path(this._script_path);
                } else {
                    this._file = null;
                    $.Notification.notify([
                        escapeHTML(_("Script file is not executable.")),
                        escapeHTML(this._script_path),
                        escapeHTML(_("The script file can be made executable from this applet context menu."))
                    ]);
                }
            } else {
                this._file = null;
                $.Notification.notify([
                    escapeHTML(_("Script file isn't a file, but a directory.")),
                    escapeHTML(this._script_path)
                ]);
            }
        } else {
            this._file = null;
            // Notify only if the path to the script is not set.
            // Otherwise, it would be ultra annoying. LOL
            if (this._script_path !== "") {
                $.Notification.notify([
                    escapeHTML(_("Script file doesn't exists.")),
                    escapeHTML(this._script_path)
                ]);
            }
        }

        if (GLib.file_test(this._script_path, GLib.FileTest.EXISTS) &&
            GLib.file_test(this._script_path, GLib.FileTest.IS_EXECUTABLE) &&
            !GLib.file_test(this._script_path, GLib.FileTest.IS_DIR)) {
            this._file = Gio.file_new_for_path(this._script_path);
        } else {
            this._file = null;
        }

        if (this._file !== null) {
            this.update(aForceUpdate);
        } else {
            // If this._file is null, it might be because the script assigned to the applet was
            // removed, so clean up all remaining data (menu elements, applet text, etc.).
            this._lineView.setLine(this.defaultAttributes);
            this.menu.removeAll();
        }
        this._processingFile = false;
    },

    update: function(aForceUpdate) {
        this._syncLabelsWithSlidersValue();

        if (this._updateTimeout > 0) {
            Mainloop.source_remove(this._updateTimeout);
            this._updateTimeout = 0;
        }

        if (this._callToUpdateTimeout > 0) {
            Mainloop.source_remove(this._callToUpdateTimeout);
            this._callToUpdateTimeout = 0;
        }

        // This is absolutelly needed because this.update could be triggered
        // hundreds of times by the sliders.
        this._callToUpdateTimeout = Mainloop.timeout_add(100,
            () => {
                this._update(aForceUpdate);
                this._callToUpdateTimeout = 0;

                return GLib.SOURCE_REMOVE;
            }
        );
    },

    _update: function(aForceUpdate = false) {
        if (this._updateRunning) {
            return;
        }

        this._updateRunning = true;

        try {
            let updateInterval = this._getInterval("pref_update_interval");

            if (!aForceUpdate && this.pref_cycle_on_menu_open && !this.menu.isOpen && updateInterval > 0) {
                this._updateTimeout = Mainloop.timeout_add_seconds(updateInterval,
                    () => {
                        this._update();
                        this._updateTimeout = 0;

                        return GLib.SOURCE_REMOVE;
                    }
                );

                this._updateRunning = false;

                return;
            }

            let envp = GLib.get_environ();
            envp.push("ARGOS_VERSION=2");
            envp.push("ARGOS_MENU_OPEN=" + (this.menu.isOpen ? "true" : "false"));

            this._timeScriptExecutionStarted = GLib.get_monotonic_time();
            OutputReader.spawn(GLib.path_get_dirname(this._file.get_path()), [this._file.get_path()],
                envp, GLib.SpawnFlags.DEFAULT, null,
                (aStandardOutput) => {
                    if (this._isDestroyed) {
                        return;
                    }

                    this._timeScriptExecutionFinished = GLib.get_monotonic_time();
                    this._processOutput(aStandardOutput.split("\n"));

                    if (updateInterval > 0) {
                        this._updateTimeout = Mainloop.timeout_add_seconds(updateInterval,
                            () => {
                                this._update();
                                this._updateTimeout = 0;

                                return GLib.SOURCE_REMOVE;
                            }
                        );
                    }

                    this._updateRunning = false;
                }
            );
        } catch (aErr) {
            // TO TRANSLATORS: Full sentence:
            // "Unable to execute file 'FileName':"
            let msg = _("Unable to execute file '%s':").format(this._file.get_basename());
            global.logError(msg + " " + aErr);
            $.Notification.notify([
                escapeHTML(msg),
                escapeHTML(_("Script file not set, cannot be found or it isn't an executable."))
            ]);
            this._updateRunning = false;
        }
    },

    _getInterval: function(aPref) {
        if (this[aPref + "_units"] in UnitsMultiplicationFactor && !isNaN(this[aPref])) {
            return parseInt(this[aPref], 10) * UnitsMultiplicationFactor[this[aPref + "_units"]] || 0;
        }

        return 0;
    },

    _processOutput: function(aOutput) {
        this._timeOutputProcessingStarted = GLib.get_monotonic_time();
        let appletLines = [];
        let menuLines = [];

        let insertToMenu = false;
        let i = 0,
            iLen = aOutput.length;
        for (; i < iLen; i++) {
            if (aOutput[i].length === 0) {
                continue;
            }

            let line = $.parseLine(aOutput[i]);

            if (!insertToMenu && line.isSeparator) {
                insertToMenu = true;
            } else if (insertToMenu) {
                menuLines.push(line);
            } else {
                appletLines.push(line);
            }
        }

        /* NOTE: Miracle that this worked!!! LOL
         * Grabbing the key focus before removing all items in the menu avoids
         * the closing of the menu when the menu is updated while open and the
         * mouse cursor is placed on an active menu item.
         */
        this.menu.actor.grab_key_focus();
        this.menu.removeAll();

        if (this._cycleTimeout > 0) {
            Mainloop.source_remove(this._cycleTimeout);
            this._cycleTimeout = 0;
        }

        this._lineView.actor.set_style("spacing: " + this.pref_applet_spacing + "px;");

        if (appletLines.length === 0) {
            let attrs = this.defaultAttributes;

            if (this.pref_show_script_name) {
                attrs.markup = GLib.markup_escape_text(this._file.get_basename(), -1);
            }

            this._lineView.setLine(attrs);
        } else if (appletLines.length === 1) {
            this._lineView.setLine(appletLines[0]);
        } else {
            this._lineView.setLine(appletLines[0]);
            let i = 0;
            let rotationInterval = this._getInterval("pref_rotation_interval");

            if (rotationInterval > 0) {
                this._cycleTimeout = Mainloop.timeout_add_seconds(rotationInterval, () => {
                    i++;
                    this._lineView.setLine(appletLines[i % appletLines.length]);

                    return GLib.SOURCE_CONTINUE;
                });
            }
        }

        let j = 0,
            jLen = appletLines.length;
        for (; j < jLen; j++) {
            if (appletLines[j].dropdown) {
                this.menu.addMenuItem(new $.ArgosMenuItem({
                    applet_menu: this.menu,
                    update_cb: function() {
                        this.update();
                    }.bind(this),
                    settings: this.settings,
                    line: appletLines[j]
                }));
            }
        }

        if (this.menu.numMenuItems > 0) {
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }

        let menus = {};
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
                let lineView = new $.ArgosLineView(this.settings, menuLines[l]);
                menuItem = new $.CustomSubMenuItem(this.settings, lineView.actor, menuLines[l].menuLevel);
                menus[menuLines[l + 1].menuLevel] = menuItem.menu;
            } else if ((l + 1) < menuLines.length &&
                menuLines[l + 1].menuLevel === menuLines[l].menuLevel &&
                menuLines[l + 1].alternate &&
                !menuLines[l].isSeparator) {
                menuItem = new $.ArgosMenuItem({
                    applet_menu: this.menu,
                    update_cb: function() {
                        this.update();
                    }.bind(this),
                    settings: this.settings,
                    line: menuLines[l],
                    alt_line: menuLines[l + 1]
                });
                // Increment to skip alternate line.
                l++;
            } else {
                if (menuLines[l].isSeparator) {
                    menuItem = new PopupMenu.PopupSeparatorMenuItem();
                } else {
                    menuItem = new $.ArgosMenuItem({
                        applet_menu: this.menu,
                        update_cb: function() {
                            this.update();
                        }.bind(this),
                        settings: this.settings,
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
    },

    _setAppletTooltip: function() {
        if (!this.tooltip) {
            this.tooltip = new $.CustomPanelItemTooltip(this, this.orientation);
        }

        let scriptExecTime = null;
        let outputProcesstime = null;

        if (typeof this._timeScriptExecutionStarted === "number" &&
            typeof this._timeScriptExecutionFinished === "number") {
            let executionTime = ((this._timeScriptExecutionFinished -
                this._timeScriptExecutionStarted) / 1000).toFixed(2);
            scriptExecTime = executionTime +
                " %s".format($.getUnitPluralForm("ms", executionTime));
        }

        if (typeof this._timeOutputProcessingStarted === "number" &&
            typeof this._timeOutputProcessingFinished === "number") {
            let processTime = ((this._timeOutputProcessingFinished -
                this._timeOutputProcessingStarted) / 1000).toFixed(2);
            outputProcesstime = processTime +
                " %s".format($.getUnitPluralForm("ms", processTime));
        }

        this.tooltip.set_text({
            scriptName: (this._file ?
                escapeHTML(this._file.get_basename()) :
                escapeHTML(_("No script set"))),
            execInterval: this.pref_update_interval + " " +
                $.getUnitPluralForm(this.pref_update_interval_units, this.pref_update_interval),
            rotationInterval: this.pref_rotation_interval + " " +
                $.getUnitPluralForm(this.pref_rotation_interval_units, this.pref_rotation_interval),
            scriptExecTime: (scriptExecTime === null ?
                Placeholders.ELLIPSIS :
                scriptExecTime),
            outputProcesstime: (outputProcesstime === null ?
                Placeholders.ELLIPSIS :
                outputProcesstime)
        });
    },

    onSliderChanged: function(aSlider, aValue, aStopUpdate, aPref) {
        if (aStopUpdate || !aPref) {
            return;
        }

        let value = Math.max(0, Math.min(1, parseFloat(aValue)));

        let newValue = parseInt(Math.floor(value * 3600), 10);

        this[aPref] = newValue;

        this._syncLabelsWithSlidersValue(aSlider);

        if (!this._sliderIsSliding) {
            this.update();
        }
    },

    onSliderGrabbed: function(aSlider) { // jshint ignore:line
        this._sliderIsSliding = true;
        this._syncLabelsWithSlidersValue(aSlider);
    },

    onSliderReleased: function(aSlider) {
        this._sliderIsSliding = false;
        aSlider.emit("value-changed", aSlider.value);
    },

    _syncLabelsWithSlidersValue: function(aSlider = null) {
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
    },

    _expandAppletContextMenu: function() {
        // Execution interval unit selector submenu.
        this.updateIntervalLabel = new $.UnitSelectorSubMenuItem({
            settings: this.settings,
            label: "<b>%s:</b>".format(_("Execution interval")),
            tooltip: _("Choose the time unit for the script execution interval."),
            value_key: "pref_update_interval",
            units_key: "pref_update_interval_units",
            set_unit_cb: function() {
                this._setUpdateInterval();
            }.bind(this)
        });
        this.updateIntervalLabel.menu.connect("open-state-changed",
            (aMenu, aOpen) => this._contextSubMenuOpenStateChanged(aMenu, aOpen));

        this._applet_context_menu.addMenuItem(this.updateIntervalLabel);

        // Execution interval slider
        this.updateIntervalSlider = new $.CustomPopupSliderMenuItem({
            value: parseFloat(this.pref_update_interval / 3600),
            associated_submenu: "updateIntervalLabel",
            tooltip: _("Set the script execution interval."),
            value_changed_cb: function(aSlider, aValue) {
                this.onSliderChanged(aSlider, aValue, false, "pref_update_interval");
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
        this.rotationIntervalLabel = new $.UnitSelectorSubMenuItem({
            settings: this.settings,
            label: "<b>%s:</b>".format(_("Rotation interval")),
            tooltip: _("Choose the time unit for the applet text rotation interval."),
            value_key: "pref_rotation_interval",
            units_key: "pref_rotation_interval_units",
            set_unit_cb: function() {
                this._setRotationInterval();
            }.bind(this)
        });
        this.rotationIntervalLabel.menu.connect("open-state-changed",
            (aMenu, aOpen) => this._contextSubMenuOpenStateChanged(aMenu, aOpen));

        this._applet_context_menu.addMenuItem(this.rotationIntervalLabel);

        // Rotation interval slider
        this.rotationIntervalSlider = new $.CustomPopupSliderMenuItem({
            value: parseFloat(this.pref_rotation_interval / 3600),
            associated_submenu: "rotationIntervalLabel",
            tooltip: _("Set the applet text rotation interval."),
            value_changed_cb: function(aSlider, aValue) {
                this.onSliderChanged(aSlider, aValue, false, "pref_rotation_interval");
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
            Util.spawn_async([this.metadata.path + "/appletHelper.py",
                    "open",
                    this.pref_last_selected_directory
                ],
                (aOutput) => {
                    let path = aOutput.trim();

                    if (!Boolean(path)) {
                        return;
                    }

                    // I don't know why this doesn't trigger the callback attached to the preference.
                    // That's why I added the call to this._processFile in here too.
                    // Just in case, I also added the this._processingFile check in case in some
                    // other versions of Cinnamon the callback it's triggered.
                    this.pref_file_path = path;
                    this.pref_last_selected_directory = path;
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
            if (this._file === null) {
                $.Notification.notify(
                    escapeHTML(_("Script file not set, cannot be found or it isn't an executable."))
                );
            } else {
                // The original Argos extension uses Gio.AppInfo.launch_default_for_uri
                // to open the script file. I prefer to stay away from non asynchronous functions.
                // Gio.AppInfo.launch_default_for_uri_async is still too new.
                xdgOpen(this._file.get_path());
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
            if (this._file === null) {
                $.Notification.notify(
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
        let subMenu = new PopupMenu.PopupSubMenuMenuItem(_("Extras"));
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
            new ModalDialog.ConfirmDialog(
                _('This operation will remove the current script from this applet leaving it "blank".') + "\n" +
                _("The current applet settings will be untouched and the actual script file will not be deleted.") + "\n" +
                _("Do you want to proceed?") + "\n",
                () => {
                    // Clear the applet text. Otherwise, it will keep rotating.
                    if (this._cycleTimeout > 0) {
                        Mainloop.source_remove(this._cycleTimeout);
                        this._cycleTimeout = 0;
                    }

                    this.pref_file_path = "";
                    this._lineView.setLine(this.defaultAttributes);
                    this._processFile();
                }
            ).open(global.get_current_time());
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
            // Make all checks individually so I can make precise notifications.
            if (GLib.file_test(this._script_path, GLib.FileTest.EXISTS)) {
                if (!GLib.file_test(this._script_path, GLib.FileTest.IS_DIR)) {
                    if (!GLib.file_test(this._script_path, GLib.FileTest.IS_EXECUTABLE)) {
                        try {
                            if (FileUtils.hasOwnProperty("changeModeGFile")) {
                                let file = Gio.file_new_for_path(this._script_path);
                                FileUtils.changeModeGFile(file, 755);
                            } else {
                                Util.spawnCommandLine('chmod +x "' + this._script_path + '"');
                            }
                        } finally {
                            this._setFileModeTimeout = Mainloop.timeout_add_seconds(1,
                                () => {
                                    this._processFile();
                                    this._setFileModeTimeout = 0;
                                });
                        }
                    } else {
                        $.Notification.notify([
                            escapeHTML(_("Script file is already executable.")),
                            escapeHTML(this._script_path)
                        ]);
                    }
                } else {
                    $.Notification.notify([
                        escapeHTML(_("Script file isn't a file, but a directory.")),
                        escapeHTML(this._script_path)
                    ]);
                }
            } else {
                $.Notification.notify([
                    escapeHTML(_("Script file doesn't exists.")),
                    escapeHTML(this._script_path)
                ]);
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
        menuItem.connect("activate", () => {
            xdgOpen(this.metadata.path + "/HELP.html");
        });
        subMenu.menu.addMenuItem(menuItem);

        this._syncLabelsWithSlidersValue();
    },

    _initializeSettings: function(aDirectCallback, aIdleCallback) {
        this.settings = new Settings.AppletSettings(
            this,
            this.metadata.uuid,
            this.instance_id
        );

        this._bindSettings();
        aDirectCallback();

        Mainloop.idle_add(() => {
            aIdleCallback();

            return GLib.SOURCE_REMOVE;
        });
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
            "pref_custom_icon_for_applet",
            "pref_custom_label_for_applet",
            "pref_show_script_name",
            "pref_prevent_applet_lines_ellipsation",
            "pref_overlay_key",
            "pref_animate_menu",
            "pref_keep_one_menu_open",
            "pref_file_path",
            "pref_default_icon_size",
            "pref_menu_spacing",
            "pref_applet_spacing",
            "pref_update_on_menu_open",
            "pref_cycle_on_menu_open",
            "pref_update_interval",
            "pref_update_interval_units",
            "pref_rotation_interval",
            "pref_rotation_interval_units",
            "pref_terminal_emulator",
            "pref_terminal_emulator_argument",
            "pref_shell",
            "pref_shell_argument",
            "pref_last_selected_directory",
            "pref_initial_load_done",
            "pref_logging_level",
            "pref_debugger_enabled"
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

    _setUpdateInterval: function() {
        this.updateIntervalSlider.setValue(this.pref_update_interval / 3600);
        this._syncLabelsWithSlidersValue(this.updateIntervalSlider);

        Mainloop.idle_add(() => {
            if (!this._sliderIsSliding) {
                this.update();
            }

            return GLib.SOURCE_REMOVE;
        });
    },

    _setRotationInterval: function() {
        this.rotationIntervalSlider.setValue(this.pref_rotation_interval / 3600);
        this._syncLabelsWithSlidersValue(this.rotationIntervalSlider);

        Mainloop.idle_add(() => {
            if (!this._sliderIsSliding) {
                this.update();
            }

            return GLib.SOURCE_REMOVE;
        });
    },

    _contextSubMenuOpenStateChanged: function(aMenu, aOpen) {
        if (aOpen && this.pref_keep_one_menu_open) {
            let children = aMenu._getTopMenu()._getMenuItems();
            let i = 0,
                iLen = children.length;
            for (; i < iLen; i++) {
                let item = children[i];

                if (item instanceof PopupMenu.PopupSubMenuMenuItem ||
                    item instanceof $.UnitSelectorSubMenuItem) {
                    if (aMenu !== item.menu) {
                        item.menu.close(true);
                    }
                }
            }
        }
    },

    _updateIconAndLabel: function() {
        let icon = this.pref_custom_icon_for_applet;
        let setIcon = (aIcon, aIsPath) => {
            if (aIcon.search("-symbolic") !== -1) {
                this[aIsPath ?
                    "set_applet_icon_symbolic_path" :
                    "set_applet_icon_symbolic_name"](aIcon);
            } else {
                this[aIsPath ?
                    "set_applet_icon_path" :
                    "set_applet_icon_name"](aIcon);
            }
        };

        if (GLib.path_is_absolute(icon) &&
            GLib.file_test(icon, GLib.FileTest.EXISTS)) {
            setIcon(icon, true);
        } else {
            try {
                setIcon(icon);
            } catch (aErr) {
                global.logWarning('Could not load icon "' + icon + '" for applet.');
            }
        }

        if (this.pref_custom_icon_for_applet === "") {
            this._applet_icon_box.hide();
        } else {
            this._applet_icon_box.show();
        }

        if (this.orientation === St.Side.LEFT || this.orientation === St.Side.RIGHT) { // no menu label if in a vertical panel
            this.set_applet_label("");
        } else {
            if (this.pref_custom_label_for_applet !== "") {
                this.set_applet_label(_(this.pref_custom_label_for_applet));
            } else {
                this.set_applet_label("");
            }
        }

        this.updateLabelVisibility();
    },

    updateLabelVisibility: function() {
        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (typeof this.hide_applet_label !== "function") {
            return;
        }

        if (this.orientation == St.Side.LEFT || this.orientation == St.Side.RIGHT) {
            this.hide_applet_label(true);
        } else {
            if (this.pref_custom_label_for_applet === "") {
                this.hide_applet_label(true);
            } else {
                this.hide_applet_label(false);
            }
        }
    },

    _toggleMenu: function() {
        if (!this.menu.isOpen && this.menu.numMenuItems > 0) {
            this.menu.open(this.pref_animate_menu);
        } else {
            this.menu.close(this.pref_animate_menu);
        }
    },

    on_applet_clicked: function() {
        this._toggleMenu();
    },

    on_applet_removed_from_panel: function() {
        this._isDestroyed = true;

        if (this._updateTimeout > 0) {
            Mainloop.source_remove(this._updateTimeout);
        }

        if (this._callToUpdateTimeout > 0) {
            Mainloop.source_remove(this._callToUpdateTimeout);
        }

        if (this._cycleTimeout > 0) {
            Mainloop.source_remove(this._cycleTimeout);
        }

        Main.keybindingManager.removeHotKey(this.menu_keybinding_name);

        this.menu.removeAll();

        if (this.settings) {
            this.settings.finalize();
        }
    },

    _updateKeybindings: function() {
        Main.keybindingManager.removeHotKey(this.menu_keybinding_name);

        if (this.pref_overlay_key !== "") {
            Main.keybindingManager.addHotKey(
                this.menu_keybinding_name,
                this.pref_overlay_key,
                () => {
                    if (!Main.overview.visible && !Main.expo.visible) {
                        this._toggleMenu();
                    }
                }
            );
        }
    },

    get defaultAttributes() {
        // Mark for deletion on EOL. Cinnamon 3.6.x+
        // Replace JSON trick with Object.assign().
        return JSON.parse(JSON.stringify(DefaultAttributes));
    },

    _onSettingsChanged: function(aPrefValue, aPrefKey) {
        // Note: On Cinnamon versions greater than 3.2.x, two arguments are passed to the
        // settings callback instead of just one as in older versions. The first one is the
        // setting value and the second one is the user data. To workaround this nonsense,
        // check if the second argument is undefined to decide which
        // argument to use as the pref key depending on the Cinnamon version.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        // Remove the following variable and directly use the second argument.
        let pref_key = aPrefKey || aPrefValue;
        switch (pref_key) {
            case "pref_custom_icon_for_applet":
            case "pref_custom_label_for_applet":
                this._updateIconAndLabel();
                break;
            case "pref_show_script_name":
            case "pref_default_icon_size":
            case "pref_menu_spacing":
            case "pref_applet_spacing":
            case "pref_prevent_applet_lines_ellipsation":
                this.update();
                break;
            case "pref_overlay_key":
                this._updateKeybindings();
                break;
            case "pref_file_path":
                this._processFile();
                break;
            case "pref_logging_level":
            case "pref_debugger_enabled":
                $.Debugger.logging_level = this.pref_logging_level;
                $.Debugger.debugger_enabled = this.pref_debugger_enabled;
                break;
        }
    }
};

function main(aMetadata, aOrientation, aPanelHeight, aInstanceId) {
    DebugManager.wrapObjectMethods($.Debugger, {
        Argos: Argos,
        IntelligentTooltip: IntelligentTooltip
    });

    return new Argos(aMetadata, aOrientation, aPanelHeight, aInstanceId);
}
