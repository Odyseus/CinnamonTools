const {
    gi: {
        Clutter,
        Gtk,
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
    DefaultExampleTasks,
    DEFAULT_TAG_DEFINITIONS
} = require("js_modules/constants.js");

const {
    _,
    arrayEach,
    CINNAMON_STANDARD_CONFIG_FOLDER,
    isBlank,
    tryFn
} = require("js_modules/globalUtils.js");

const {
    File,
    removeSurplusFilesFromDirectory
} = require("js_modules/customFileUtils.js");

const {
    ConfirmDialog
} = require("js_modules/customDialogs.js");

const {
    IntelligentTooltip
} = require("js_modules/customTooltips.js");

const {
    Debugger,
    runtimeInfo,
    TasksListItem
} = require("js_modules/utils.js");

const {
    getBaseAppletClass
} = require("js_modules/appletsUtils.js");

class SimpleToDoList extends getBaseAppletClass(Applet.TextIconApplet) {
    constructor(aMetadata, aOrientation, aPanelHeight, aInstanceID) {
        super({
            metadata: aMetadata,
            orientation: aOrientation,
            panel_height: aPanelHeight,
            instance_id: aInstanceID,
            pref_keys: APPLET_PREFS
        });

        this.__initializeApplet(() => {
            this.set_applet_tooltip(_(this.$.metadata.name));
            this.__setAppletIcon(this.$._.applet_icon);
            this._expandAppletContextMenu();
        }, () => {
            this._tasks_storage_path =
                `${CINNAMON_STANDARD_CONFIG_FOLDER}/${this.$.metadata.uuid}-TasksStorage/${this.$.instance_id}`;
            this._backups_storage_path = this._tasks_storage_path + "/backups";
            this._tasks_list_file = new File(this._tasks_storage_path + "/tasks_list.json", {
                cache_getters_data: true
            });
            this.next_id = 0;
            this.sections = [];
            this.request_rebuild = false;

            this._buildUI();

            if (this.$._.tag_definitions.length === 0) {
                this.$._.tag_definitions = DEFAULT_TAG_DEFINITIONS;
            }

            this._load();
            this._updateKeybindings();
        });
    }

    __connectSignals() {
        this.$.signal_manager.connect(this, "orientation-changed", function() {
            this.__seekAndDetroyConfigureContext();
        }.bind(this));
        this.$.signal_manager.connect(this.menu, "open-state-changed", function(aMenu, aOpen) {
            this._onOpenStateChanged(aMenu, aOpen);
        }.bind(this));
    }

    _buildUI() {
        // Create main box
        this.mainBox = new St.BoxLayout();
        this.mainBox.set_vertical(true);

        // Create ToDos box
        this.todosSec = new PopupMenu.PopupMenuSection();

        this.mainBox.add(this.todosSec.actor);

        // Separator
        const separator = new PopupMenu.PopupSeparatorMenuItem();
        this.mainBox.add_actor(separator.actor);

        // Text entry
        this.newTaskList = new St.Entry({
            hint_text: _("New tasks list..."),
            track_hover: true,
            can_focus: true
        });
        this.newTaskList.set_style("padding: 7px 9px;min-width: 150px;");

        const entryNewTask = this.newTaskList.get_clutter_text();

        // Callback to add section when Enter is pressed
        entryNewTask.connect("key-press-event", (aActor, aEvent) => {
            const symbol = aEvent.get_key_symbol();
            if (symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter) {
                this._create_section(aActor.get_text());
                entryNewTask.set_text("");
            }
        });

        // Bottom section
        const bottomSection = new PopupMenu.PopupMenuSection();
        bottomSection.actor.set_style("padding: 0 20px;");

        bottomSection.actor.add_actor(this.newTaskList);
        this.mainBox.add_actor(bottomSection.actor);
        this.menu.box.add_actor(this.mainBox);
    }

    // Populate UI with the section items
    _populate_ui() {
        this.$.schedule_manager.setTimeout("populate_ui", function() {
            tryFn(() => {
                this._clear();
                this.n_total_tasks = 0;
                this.n_total_completed_tasks = 0;

                for (const section of this.sections) {
                    if (typeof aSection === "function") {
                        break;
                    }

                    this._add_section(section);
                }
            }, (aErr) => { // jshint ignore:line
                //
            }, () => {
                if (!this.$._.initial_load) {
                    // Stick with the JSON trick. Do not use Object.assign().
                    this._create_section("", JSON.parse(JSON.stringify(DefaultExampleTasks)));
                    this.$._.initial_load = true;
                }

                this.newTaskList.hint_text = _("New tasks list...");
                this.newTaskList.grab_key_focus();

                this._updateLabel();

            });
        }.bind(this), 500);
    }

    _add_section(aSection) {
        const item = new TasksListItem(this, aSection);

        this.todosSec.addMenuItem(item);

        this.n_total_tasks += item.n_tasks;

        item.connect("save_signal",
            (aCallback) => this._saveTasks(aCallback));
        item.connect("remove_section_signal",
            (aActor, aSection) => this._remove_section(aActor, aSection));
        item.connect("task_count_changed",
            (aItem, aDiff) => this._update_counter(aItem, aDiff));
    }

    _update_counter(aItem, aDiff) {
        this.n_total_tasks -= aDiff;
        this._updateLabel();
    }

    _clear() {
        [...this.todosSec._getMenuItems()].forEach((aSection) => {
            aSection._clear();
        });

        this.todosSec.removeAll();
    }

    _create_section(aText, aSection) {
        const id = this.next_id;
        let section;

        if (aSection) {
            section = aSection;
            section["id"] = id;
        } else { // Don't add empty section.
            if (!aText.trim()) {
                return;
            }

            section = {
                "id": id,
                "name": aText,
                "sort-tasks-alphabetically": true,
                "sort-tasks-by-completed": true,
                "display-remove-task-buttons": true,
                "keep-completed-tasks-hidden": false,
                "tasks": []
            };
        }

        // Add the new section to the sections array.
        this.sections.push(section);
        this.next_id += 1;

        // Add the section to the UI
        this._add_section(section);

        this._saveTasks();
    }

    _remove_section(aActor, aSection) {
        // Remove the section from the internal database and synchronize it with the setting.
        this.sections = this.sections.filter((aSec) => {
            return aSec["id"] !== aSection.id;
        });

        // Clean-up the section
        aSection.destroy();

        this._saveTasks();
    }

    _saveTasks(aCallback) {
        if (this.$._.section_keep_alphabetic_order) {
            this.sections = this.sections.sort((a, b) => {
                return a["name"].localeCompare(b["name"]);
            });
        }

        const sections = JSON.stringify(this.sections, null, 4);

        // This function is triggered quite a lot by several events and actions.
        // Adding a timeout will avoid excessive writes to disk when saving.
        this.$.schedule_manager.clearSchedule("auto_backup");
        this.$.schedule_manager.clearSchedule("save_tasks");

        if (this.$._.autobackups_enabled) {
            this.$.schedule_manager.setTimeout("auto_backup", function() {
                runtimeInfo("Generating backup...");

                const backupFile = new File(this._backups_storage_path + "/" +
                    new Date().toCustomISOString() + ".json", {
                        init_parent: true
                    });

                backupFile.write(sections, {
                    ensure_parents: !backupFile.parent_exists
                }).then(() => {
                    const now = new Date().getTime();

                    // NOTE: Only perform cleanup after 10 minutes passed from the last cleanup.
                    if (now - this.$._.last_backup_cleanup > 600000) {
                        this.$._.last_backup_cleanup = now;
                        removeSurplusFilesFromDirectory(this._backups_storage_path,
                            this.$._.autobackups_max_files_to_keep);
                    }

                    backupFile.destroy();
                }).catch((aErr) => global.logError(aErr));
            }.bind(this), 500);
        }

        this.$.schedule_manager.setTimeout("save_tasks", function() {
            runtimeInfo("Saving tasks...");

            this._tasks_list_file.write(sections, {
                ensure_parents: !this._tasks_list_file.exists
            }).then(() => {
                if (aCallback && typeof aCallback === "function") {
                    aCallback();
                }

                if (this.$._.section_keep_alphabetic_order) {
                    this.request_rebuild = true;
                }
            }).catch((aErr) => global.logError(aErr));
        }.bind(this), 500);
    }

    _load() {
        this._tasks_list_file.read().then((aData) => {
            tryFn(() => {
                this.sections = JSON.parse(aData);

                // For compatibility with older versions of this applet where an object
                // was used instead of an array.
                if (!Array.isArray(this.sections)) {
                    this.sections = Object.keys(this.sections).map((aKey, aIndex) => {
                        // Override id.
                        this.sections[aKey]["id"] = aIndex;
                        return this.sections[aKey];
                    });
                    this.request_rebuild = true;
                }

                if (this.$._.section_keep_alphabetic_order) {
                    this.sections = this.sections.sort((a, b) => {
                        return a["name"].localeCompare(b["name"]);
                    });
                }

                // Compute the next id to avoid collapse of the the ToDo list
                this.next_id = 0;

                arrayEach(this.sections, (aSection, aIdx) => {
                    if (typeof aSection !== "object") {
                        return;
                    }

                    this.sections[aIdx]["id"] = aIdx;

                    if (aSection["tasks"].length > 0) {
                        if (aSection["sort-tasks-by-completed"]) {
                            let completed = [];
                            let not_completed = [];

                            for (const task of aSection["tasks"]) {
                                if (task["completed"]) {
                                    completed.push(task);
                                } else {
                                    not_completed.push(task);
                                }
                            }

                            if (aSection["sort-tasks-alphabetically"]) {
                                completed = completed.sort((a, b) => {
                                    return a["name"].localeCompare(b["name"], undefined, {
                                        numeric: true,
                                        sensitivity: "base"
                                    });
                                });
                                not_completed = not_completed.sort((a, b) => {
                                    return a["name"].localeCompare(b["name"], undefined, {
                                        numeric: true,
                                        sensitivity: "base"
                                    });
                                });
                            }

                            this.sections[aIdx]["tasks"] = [...not_completed, ...completed];
                        } else if (!aSection["sort-tasks-by-completed"] &&
                            aSection["sort-tasks-alphabetically"]) {
                            this.sections[aIdx]["tasks"] = aSection["tasks"].sort((a, b) => {
                                return a["name"].localeCompare(b["name"], undefined, {
                                    numeric: true,
                                    sensitivity: "base"
                                });
                            });
                        }
                    }

                    this.next_id = aIdx + 1;
                });
            }, (aErr) => {
                global.logError(aErr);
            }, () => {
                this._populate_ui();
            });
        }).catch((aErr) => { // jshint ignore:line
            this._populate_ui();

            if (this.$._.initial_load) {
                // Stick with the JSON trick. Do not use Object.assign().
                this._create_section("", JSON.parse(JSON.stringify(DefaultExampleTasks)));
            }
        });
    }

    _toggleMenu() {
        if (this.menu.isOpen) {
            this.menu.close(this.$._.animate_menu);
        } else {
            this.menu.open(this.$._.animate_menu);
            this.newTaskList && this.newTaskList.grab_key_focus();
        }
    }

    _onOpenStateChanged(aMenu, aOpen) {
        if (aOpen && this.todosSec) {
            for (const section of this.todosSec._getMenuItems()) {
                section.menu.close();
            }
        } else {
            // Rebuild the menu on closing if needed.
            if (this.request_rebuild) {
                this._rebuildRequested();
            }
        }
    }

    _rebuildRequested() {
        // Async needed. Otherwise, the UI is built before the tasks are saved.
        this._saveTasks(() => {
            this._load();
            this.request_rebuild = false;
        });
    }

    _updateKeybindings() {
        this.$.keybinding_manager.addKeybinding("toggle_menu", this.$._.toggle_menu_keybinding, () => {
            if (!Main.overview.visible && !Main.expo.visible) {
                this._toggleMenu();
            }
        });
    }

    _updateLabel() {
        // NOTE: this._populate_ui is triggered after a delay. If I call _updateLabel without a delay,
        // this.n_total_tasks will be undefined.
        this.$.schedule_manager.setTimeout("update_label", function() {
            if (this.$.orientation === St.Side.LEFT || this.$.orientation === St.Side.RIGHT) { // no menu label if in a vertical panel
                this.set_applet_label("");
            } else {
                if (!isBlank(this.$._.applet_label) || this.$._.show_tasks_counter_on_applet) {
                    if (this.$._.show_tasks_counter_on_applet) {
                        this.n_total_completed_tasks = 0;

                        for (const section of this.todosSec._getMenuItems()) {
                            if (section.hasOwnProperty("n_completed") && section instanceof TasksListItem) {
                                this.n_total_completed_tasks += section.n_completed;
                            }
                        }
                    }

                    let label = _(this.$._.applet_label);
                    // Add an empty space only if the label isn't empty.
                    label += ((this.$._.show_tasks_counter_on_applet &&
                            this.$._.applet_label !== "") ?
                        " " :
                        "");
                    label += (this.$._.show_tasks_counter_on_applet ?
                        "(" + (this.n_total_completed_tasks || 0) + "/" + (this.n_total_tasks || 0) + ")" :
                        "");

                    this.set_applet_label(label);

                    // Just in case.
                    if (typeof this.n_total_tasks !== "number") {
                        this._updateLabel();
                    }
                } else {
                    this.set_applet_label("");
                }
            }
        }.bind(this), 550);
    }

    _importTasks() {
        Util.spawn_async([
                `${this.$.metadata.path}/file_chooser_dialog.py`,
                "--action-open",
                "--title",
                _("Select a file to import"),
                "--pattern-filters",
                _("JSON files") + ";*.json",
                _("All files") + ";*",
                "--buttons-labels",
                _("_Cancel") + ":" + _("_OK"),
                "--last-dir",
                this.$._.imp_exp_last_selected_directory_tasks
            ],
            (aOutput) => {
                const path = aOutput.trim();

                if (!Boolean(path)) {
                    return;
                }

                const file = new File(path);
                this.$._.imp_exp_last_selected_directory_tasks = path;
                file.read().then((aData) => {
                    tryFn(() => {
                        let sections = JSON.parse(aData);

                        // For compatibility with older versions of this applet where an object
                        // was used instead of an array.
                        if (!Array.isArray(sections)) {
                            sections = Object.keys(sections).map((aKey) => {
                                sections[aKey]["id"] = this.next_id;
                                this.next_id++;
                                return sections[aKey];
                            });
                        }

                        for (const section of sections) {
                            if (typeof section === "object") {
                                this._create_section("", section);
                            }
                        }
                    }, (aErr) => {
                        global.logError(aErr);
                    }, () => {
                        this._populate_ui();
                    });
                }).catch((aErr) => global.logError(aErr));
            });
    }

    _exportTasks(aActor, aEvent, aSection) {
        Util.spawn_async([
                `${this.$.metadata.path}/file_chooser_dialog.py`,
                "--action-save",
                "--title",
                _("Select or enter file to export to"),
                "--pattern-filters",
                _("JSON files") + ";*.json",
                _("All files") + ";*",
                "--buttons-labels",
                _("_Cancel") + ":" + _("_Save"),
                "--last-dir",
                this.$._.imp_exp_last_selected_directory_tasks
            ],
            (aOutput) => {
                const path = aOutput.trim();

                if (!Boolean(path)) {
                    return;
                }

                let sectionsContainer;

                // Export an specific section...
                if (aSection) {
                    sectionsContainer = [];
                    sectionsContainer[0] = aSection;
                } else { // ...or all sections.
                    sectionsContainer = this.sections;
                }

                const rawData = JSON.stringify(sectionsContainer, null, 4);
                const file = new File(path);
                this.$._.imp_exp_last_selected_directory_tasks = path;
                file.write(rawData).catch((aErr) => global.logError(aErr));
            });
    }

    _saveAsTODOFile(aActor, aEvent, aSection) {
        Util.spawn_async([
                `${this.$.metadata.path}/file_chooser_dialog.py`,
                "--action-save",
                "--title",
                _("Select or enter file to export to"),
                "--pattern-filters",
                _("All files") + ";*",
                "--buttons-labels",
                _("_Cancel") + ":" + _("_Save"),
                "--last-dir",
                this.$._.imp_exp_last_selected_directory_tasks
            ],
            (aOutput) => {
                const path = aOutput.trim();

                if (!Boolean(path)) {
                    return;
                }

                let rawData = "";
                const file = new File(path);
                this.$._.save_last_selected_directory = path;
                let sectionsContainer;

                // Save an specific section...
                if (aSection) {
                    sectionsContainer = [];
                    sectionsContainer[0] = aSection;
                } else { // ...or all sections.
                    sectionsContainer = this.sections;
                }

                tryFn(() => {
                    for (const section of sectionsContainer) {
                        if (typeof section === "object") {
                            rawData += section["name"] + ":";
                            rawData += "\n";

                            arrayEach(section["tasks"], (aTask, aIdx, aLen) => {
                                rawData += (aTask["completed"] ?
                                        this.$._.task_completed_character :
                                        this.$._.task_notcompleted_character) +
                                    " ";
                                rawData += aTask["name"];
                                rawData += "\n";

                                if (aIdx === aLen - 1) {
                                    rawData += "\n";
                                }
                            });
                        }
                    }
                }, (aErr) => { // jshint ignore:line

                }, () => {
                    file.write(rawData).catch((aErr) => global.logError(aErr));
                });
            });
    }

    _expandAppletContextMenu() {
        let menuItem;

        // Save as TODO
        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Save as TODO"),
            "document-save-as",
            St.IconType.SYMBOLIC);
        menuItem._icon.icon_size = 14;
        menuItem.connect("activate",
            (aActor, aEvent) => this._saveAsTODOFile(aActor, aEvent));
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _("Save all current tasks lists as a TODO file.")
        );
        this._applet_context_menu.addMenuItem(menuItem);

        // Export tasks
        let iconName = Gtk.IconTheme.get_default().has_icon("document-export-symbolic") ?
            "document-export" :
            "simple-todo-list-export-tasks";

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Export tasks"),
            iconName,
            St.IconType.SYMBOLIC);
        menuItem._icon.icon_size = 14;
        menuItem.connect("activate",
            (aActor, aEvent) => this._exportTasks(aActor, aEvent));
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _("Export all current tasks lists into a JSON file.") + "\n\n" +
            _("JSON files exported by this applet can be imported back into the applet and the tasks list found inside the files are added to the tasks lists currently loaded into the applet.")
        );
        this._applet_context_menu.addMenuItem(menuItem);

        // Import tasks
        iconName = Gtk.IconTheme.get_default().has_icon("document-import-symbolic") ?
            "document-import" :
            "simple-todo-list-import-tasks";

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Import tasks"),
            iconName,
            St.IconType.SYMBOLIC);
        menuItem._icon.icon_size = 14;
        menuItem.connect("activate", () => this._importTasks());
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _("Import tasks lists from a previously exported JSON file into this applet.") + "\n\n" +
            _("JSON files exported by this applet can be imported back into the applet and the tasks list found inside the files are added to the tasks lists currently loaded into the applet.")
        );
        this._applet_context_menu.addMenuItem(menuItem);

        // Separator
        this._applet_context_menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Restore example tasks
        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Restore example tasks"),
            "edit-redo",
            St.IconType.SYMBOLIC);
        menuItem._icon.icon_size = 14;
        menuItem.connect("activate", () => {
            tryFn(() => {
                // Stick with the JSON trick. Do not use Object.assign().
                this._create_section("", JSON.parse(JSON.stringify(DefaultExampleTasks)));
            }, (aErr) => { // jshint ignore:line
                //
            }, () => {
                this._populate_ui();
            });
        });
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _("Restore the example tasks list that were present when the applet was first loaded.")
        );
        this._applet_context_menu.addMenuItem(menuItem);

        // Reset tasks
        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Reset tasks"),
            "dialog-warning",
            St.IconType.SYMBOLIC);
        menuItem._icon.icon_size = 14;
        menuItem.connect("activate", () => {
            const dialog = new ConfirmDialog({
                headline: _(this.$.metadata.name),
                description: _("WARNING!!!") + "\n" +
                    _("Do you really want to remove all your current tasks?") + "\n" +
                    _("This operation cannot be reverted!!!") + "\n",
                cancel_label: _("Cancel"),
                ok_label: _("OK"),
                callback: () => {
                    this.sections = [];
                    this._tasks_list_file.write("[]", {
                        ensure_parents: !this._tasks_list_file.exists
                    }).then(() => this._load()).catch((aErr) => global.logError(aErr));
                }
            });
            dialog.open();
        });
        menuItem.tooltip = new IntelligentTooltip(
            menuItem.actor,
            _("Remove all currently loaded tasks lists from this applet.") + "\n\n" +
            _("WARNING!!!") + " " + _("This operation cannot be reverted!!!")
        );
        this._applet_context_menu.addMenuItem(menuItem);

        // Separator
        this._applet_context_menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Help
        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Help"),
            "dialog-information",
            St.IconType.SYMBOLIC);
        menuItem._icon.icon_size = 14;
        menuItem.tooltip = new IntelligentTooltip(menuItem.actor, _("Open this applet help file."));
        menuItem.connect("activate", () => this.__openHelpPage());
        this._applet_context_menu.addMenuItem(menuItem);

        this.__seekAndDetroyConfigureContext();
    }

    on_applet_clicked() {
        this._toggleMenu();
    }

    on_applet_removed_from_panel() {
        super.on_applet_removed_from_panel();

        this._clear();
        this._tasks_list_file.destroy();
    }

    __onSettingsChanged(aPrefOldValue, aPrefKey) {
        switch (aPrefKey) {
            case "applet_icon":
                this.__setAppletIcon(this.$._.applet_icon);
                break;
            case "applet_label":
            case "show_tasks_counter_on_applet":
                this._updateLabel();
                break;
            case "toggle_menu_keybinding":
                this._updateKeybindings();
                break;
            case "use_fail_safe":
            case "section_font_size":
            case "section_set_min_width":
            case "section_set_max_width":
            case "section_keep_alphabetic_order":
            case "section_set_bold":
            case "section_remove_native_entry_theming":
            case "section_remove_native_entry_theming_sizing":
            case "task_font_size":
            case "task_set_min_width":
            case "task_set_max_width":
            case "task_set_custom_spacing":
            case "task_set_bold":
            case "task_remove_native_entry_theming":
            case "task_remove_native_entry_theming_sizing":
            case "tasks_priorities_colors_enabled":
            case "tasks_priorities_highlight_entire_row":
            case "tag_definitions_apply":
                this._populate_ui();
                break;
            case "autobackups_enabled":
                this._load();
                break;
        }
    }
}

function main() {
    Debugger.wrapObjectMethods({
        IntelligentTooltip: IntelligentTooltip,
        SimpleToDoList: SimpleToDoList
    });

    return new SimpleToDoList(...arguments);
}
