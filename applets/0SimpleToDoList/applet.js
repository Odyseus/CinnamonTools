let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
}

const _ = $._;

const {
    gi: {
        Clutter,
        Gio,
        GLib,
        Gtk,
        St
    },
    mainloop: Mainloop,
    misc: {
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

function SimpleToDoList() {
    this._init.apply(this, arguments);
}

SimpleToDoList.prototype = {
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

        this._initializeSettings(() => {
            this.logger = new $.Logger("SimpleToDoList", this.pref_enable_verbose_logging);
            this._expandAppletContextMenu();
        }, () => {
            this.mainBox = null;
            this.next_id = 0;
            this.sections = [];
            this._request_rebuild = false;
            this._force_storage_dirs_creation = false;
            this._update_label_id = 0;
            this._build_ui_id = 0;
            this._save_tasks_id = 0;
            this._auto_backup_id = 0;

            this.logger.debug("Creating menus");
            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menu = new Applet.AppletPopupMenu(this, aOrientation);
            this.menu.connect("open-state-changed",
                (aMenu, aOpen) => this._onOpenStateChanged(aMenu, aOpen));
            this.menuManager.addMenu(this.menu);

            this.set_applet_tooltip(_(this.metadata.name));
            this._load();
            this._updateKeybindings();
            this._updateIconAndLabel();
        });
    },

    _buildUI: function() {
        this.logger.debug("");

        if (this._build_ui_id > 0) {
            Mainloop.source_remove(this._build_ui_id);
            this._build_ui_id = 0;
        }

        this._build_ui_id = Mainloop.timeout_add(500,
            () => {
                // Destroy previous box
                if (this.mainBox !== null) {
                    this.mainBox.destroy();
                }

                // Create main box
                this.mainBox = new St.BoxLayout();
                this.mainBox.set_vertical(true);

                // Create ToDos box
                this.todosSec = new PopupMenu.PopupMenuSection();

                this.mainBox.add(this.todosSec.actor);

                // Separator
                let separator = new PopupMenu.PopupSeparatorMenuItem();
                this.mainBox.add_actor(separator.actor);

                // Text entry
                this.newTaskList = new St.Entry({
                    hint_text: _("New tasks list..."),
                    track_hover: true,
                    can_focus: true
                });
                this.newTaskList.set_style("padding: 7px 9px;min-width: 150px;");

                let entryNewTask = this.newTaskList.get_clutter_text();

                // Callback to add section when Enter is pressed
                entryNewTask.connect("key-press-event", (aActor, aEvent) => {
                    let symbol = aEvent.get_key_symbol();
                    if (symbol == Clutter.KEY_Return || symbol == Clutter.KEY_KP_Enter) {
                        this._create_section(aActor.get_text());
                        entryNewTask.set_text("");
                    }
                });

                // Bottom section
                let bottomSection = new PopupMenu.PopupMenuSection();
                bottomSection.actor.set_style("padding: 0 20px;");

                bottomSection.actor.add_actor(this.newTaskList);
                this.mainBox.add_actor(bottomSection.actor);
                this.menu.box.add_actor(this.mainBox);

                this._populate_ui();

                this._build_ui_id = 0;
            });
    },

    // Populate UI with the section items
    _populate_ui: function() {
        this.logger.debug("");

        try {
            this._clear();
            this.n_total_tasks = 0;
            this.n_total_completed_tasks = 0;

            let i = 0,
                iLen = this.sections.length;
            for (; i < iLen; i++) {
                if (typeof this.sections[i] === "function") {
                    continue;
                }

                this._add_section(this.sections[i]);
            }
        } finally {
            if (!this.pref_initial_load) {
                // Mark for deletion on EOL. Cinnamon 3.6.x+
                // Replace JSON trick with Object.assign().
                // This bit me hard. Luckily, I found the solution very quickly.
                this._create_section("", JSON.parse(JSON.stringify($.DefaultExampleTasks)));
                this.pref_initial_load = true;
            }

            if (this.pref_show_tasks_counter_on_applet) {
                this._updateLabel();
            }

            this.newTaskList.hint_text = _("New tasks list...");
            this.newTaskList.grab_key_focus();
        }
    },

    _add_section: function(aSection) {
        this.logger.debug("");

        let item = new $.TasksListItem(this, aSection);

        this.todosSec.addMenuItem(item);

        this.n_total_tasks += item.n_tasks;

        item.connect("save_signal",
            (aCallback) => this._saveTasks(aCallback));
        item.connect("remove_section_signal",
            (aActor, aSection) => this._remove_section(aActor, aSection));
        item.connect("task_count_changed",
            (aItem, aDiff) => this._update_counter(aItem, aDiff));
    },

    _update_counter: function(aItem, aDiff) {
        this.logger.debug("");

        this.n_total_tasks -= aDiff;

        if (this.pref_show_tasks_counter_on_applet) {
            this._updateLabel();
        }
    },

    _clear: function() {
        this.logger.debug("");

        Array.prototype.slice.call(this.todosSec._getMenuItems()).forEach((aSection) => {
            aSection._clear();
        });

        this.todosSec.removeAll();
    },

    _create_section: function(aText, aSection) {
        this.logger.debug("");

        let id = this.next_id;
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
        this._saveTasks();

        // Add the section to the UI
        this._add_section(section);
    },

    _remove_section: function(aActor, aSection) {
        this.logger.debug("");

        // Remove the section from the internal database and synchronize it with the setting.
        this.sections = this.sections.filter((aSec) => {
            return aSec["id"] !== aSection.id;
        });

        // Clean-up the section
        aSection.destroy();

        this._saveTasks();
    },

    _saveTasks: function(aCallback) {
        this.logger.debug("");

        if (this.pref_section_keep_alphabetic_order) {
            this.sections = this.sections.sort((a, b) => {
                return a["name"].localeCompare(b["name"]);
            });
        }

        let sections = JSON.stringify(this.sections, null, 4);

        // This function is triggered quite a lot by several events and actions.
        // Adding a timeout will avoid excessive writes to disk when saving.
        if (this._auto_backup_id > 0) {
            Mainloop.source_remove(this._auto_backup_id);
            this._auto_backup_id = 0;
        }

        if (this._save_tasks_id > 0) {
            Mainloop.source_remove(this._save_tasks_id);
            this._save_tasks_id = 0;
        }

        if (this.pref_autobackups_enabled && this._backups_storage_path) {
            this._auto_backup_id = Mainloop.timeout_add(500, () => {
                this.logger.debug("Generating backup...");

                let backupFile = Gio.File.new_for_path(this._backups_storage_path + "/" +
                    new Date().toCustomISOString() + ".json");

                $.saveToFileAsync(sections, backupFile, () => {
                    this._auto_backup_id = 0;
                });

                let now = new Date().getTime();

                if (now - this.pref_last_backup_cleanup > 3600) {
                    this.pref_last_backup_cleanup = now;
                    $.removeSurplusFilesFromDirectory(this._backups_storage_path,
                        this.pref_autobackups_max_files_to_keep);
                }

                this._auto_backup_id = 0;
            });
        }

        this._save_tasks_id = Mainloop.timeout_add(500, () => {
            this.logger.debug("Saving tasks...");

            try {
                $.saveToFileAsync(sections, this._tasks_list_file, () => {
                    if (aCallback && typeof aCallback === "function") {
                        aCallback();
                    }

                    this._save_tasks_id = 0;
                });
            } catch (aErr) {
                global.logError(aErr);
            } finally {
                if (this.pref_section_keep_alphabetic_order) {
                    this.request_rebuild = true;
                }
            }
        });
    },

    _load: function() {
        this.logger.debug("");

        try {
            // Condition needed for retro-compatibility.
            // Mark for deletion on EOL. Cinnamon 3.2.x+
            // As of Cinnamon 3.8.x, keep this.settings.file.
            let settingsFile = this.settings.settings_file || this.settings.file;
            let settingsStoragePath = settingsFile.get_parent().get_path();
            this._tasks_storage_path = settingsStoragePath + "-TasksStorage" + "/" + this.instance_id;
            this._backups_storage_path = this._tasks_storage_path + "/backups";

            if (!this.pref_storage_dirs_created || this._force_storage_dirs_creation) {
                GLib.mkdir_with_parents(this._tasks_storage_path, parseInt("0755", 8));

                if (this.pref_autobackups_enabled) {
                    GLib.mkdir_with_parents(this._backups_storage_path, parseInt("0755", 8));
                }

                this.pref_storage_dirs_created = true;
                this._force_storage_dirs_creation = false;
            }
        } catch (aErr) {
            global.logError(aErr);
            this._tasks_storage_path = null;
            this._backups_storage_path = null;
        } finally {
            this._tasks_list_file = Gio.file_new_for_path(this._tasks_storage_path + "/tasks_list.json");

            if (this._tasks_list_file.query_exists(null)) {
                this._tasks_list_file.load_contents_async(null,
                    (aFile, aResponce) => {
                        let success, contents = "[]",
                            tag;

                        try {
                            [success, contents, tag] = aFile.load_contents_finish(aResponce);
                        } catch (aErr) {
                            global.logError(aErr.message);
                            return;
                        }

                        if (!success) {
                            global.logError("Error parsing %s".format(
                                this._tasks_list_file.get_path()));
                            return;
                        }

                        try {
                            this.sections = JSON.parse(contents);

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

                            if (this.pref_section_keep_alphabetic_order) {
                                this.sections = this.sections.sort((a, b) => {
                                    return a["name"].localeCompare(b["name"]);
                                });
                            }

                            // Compute the next id to avoid collapse of the the ToDo list
                            this.next_id = 0;

                            let i = 0,
                                iLen = this.sections.length;
                            for (; i < iLen; i++) {
                                if (typeof this.sections[i] !== "object") {
                                    continue;
                                }

                                this.sections[i]["id"] = i;

                                if (this.sections[i]["tasks"].length > 0) {
                                    if (this.sections[i]["sort-tasks-by-completed"]) {
                                        let completed = [];
                                        let not_completed = [];
                                        let tasks = this.sections[i]["tasks"];
                                        let t = 0,
                                            tLen = tasks.length;

                                        for (; t < tLen; t++) {
                                            if (tasks[t]["completed"]) {
                                                completed.push(tasks[t]);
                                            } else {
                                                not_completed.push(tasks[t]);
                                            }
                                        }

                                        if (this.sections[i]["sort-tasks-alphabetically"]) {
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

                                        this.sections[i]["tasks"] = not_completed.concat(completed);
                                    } else if (!this.sections[i]["sort-tasks-by-completed"] &&
                                        this.sections[i]["sort-tasks-alphabetically"]) {
                                        this.sections[i]["tasks"] = this.sections[i]["tasks"].sort((a, b) => {
                                            return a["name"].localeCompare(b["name"], undefined, {
                                                numeric: true,
                                                sensitivity: "base"
                                            });
                                        });
                                    }
                                }

                                this.next_id = i + 1;
                            }
                        } catch (aErr) {
                            global.logError(aErr);
                        } finally {
                            this._buildUI();
                        }
                    }
                );
            } else {
                this._buildUI();

                if (this.pref_initial_load) {
                    // Mark for deletion on EOL. Cinnamon 3.6.x+
                    // Replace JSON trick with Object.assign().
                    this._create_section("", JSON.parse(JSON.stringify($.DefaultExampleTasks)));
                }
            }
        }
    },

    _toggleMenu: function() {
        this.logger.debug("");

        if (this.menu.isOpen) {
            this.menu.close(this.pref_animate_menu);
        } else {
            this.menu.open(this.pref_animate_menu);
            this.newTaskList.grab_key_focus();
        }
    },

    _onOpenStateChanged: function(aMenu, aOpen) {
        this.logger.debug("");

        if (aOpen) {
            let i = 0;
            let items = this.todosSec._getMenuItems();
            let itemsLen = items.length;

            for (; i < itemsLen; i++) {
                items[i].menu.close();
            }
        } else {
            // Rebuild the menu on closing if needed.
            if (this.request_rebuild) {
                this._rebuildRequested();
            }
        }
    },

    _rebuildRequested: function() {
        this.logger.debug("");

        // Async needed. Otherwise, the UI is built before the tasks are saved.
        this._saveTasks(() => {
            this._load();
            this.request_rebuild = false;
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
            "pref_custom_icon_for_applet",
            "pref_custom_label_for_applet",
            "pref_show_tasks_counter_on_applet",
            "pref_overlay_key",
            "pref_use_fail_safe",
            "pref_animate_menu",
            "pref_keep_one_menu_open",
            "pref_section_font_size",
            "pref_section_set_min_width",
            "pref_section_set_max_width",
            "pref_section_keep_alphabetic_order",
            "pref_section_set_bold",
            "pref_section_remove_native_entry_theming",
            "pref_section_remove_native_entry_theming_sizing",
            "pref_task_font_size",
            "pref_task_set_min_width",
            "pref_task_set_max_width",
            "pref_task_set_custom_spacing",
            "pref_task_set_bold",
            "pref_task_remove_native_entry_theming",
            "pref_task_remove_native_entry_theming_sizing",
            "pref_task_completed_character",
            "pref_task_notcompleted_character",
            "pref_tasks_priorities_colors_enabled",
            "pref_tasks_priorities_highlight_entire_row",
            "pref_tasks_priorities_critical_background",
            "pref_tasks_priorities_critical_foreground",
            "pref_tasks_priorities_high_background",
            "pref_tasks_priorities_high_foreground",
            "pref_tasks_priorities_medium_background",
            "pref_tasks_priorities_medium_foreground",
            "pref_tasks_priorities_today_background",
            "pref_tasks_priorities_today_foreground",
            "pref_tasks_priorities_low_background",
            "pref_tasks_priorities_low_foreground",
            "pref_enable_verbose_logging",
            "pref_autobackups_enabled",
            "pref_autobackups_max_files_to_keep",
            "pref_last_backup_cleanup",
            "pref_initial_load",
            "pref_imp_exp_last_selected_directory",
            "pref_save_last_selected_directory",
            "pref_storage_dirs_created"
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

    _updateKeybindings: function() {
        this.logger.debug("");

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

    _updateIconAndLabel: function() {
        this.logger.debug("");

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

        this._updateLabel();
    },

    _updateLabel: function() {
        this.logger.debug("");

        if (this._update_label_id > 0) {
            Mainloop.source_remove(this._update_label_id);
            this._update_label_id = 0;
        }

        // this._buildUI is triggered after a delay. If I call _updateLabel without a delay,
        // this.n_total_tasks will be undefined.
        this._update_label_id = Mainloop.timeout_add(500, () => {
            if (this.orientation == St.Side.LEFT || this.orientation == St.Side.RIGHT) { // no menu label if in a vertical panel
                this.set_applet_label("");
            } else {
                if (this.pref_custom_label_for_applet !== "" || this.pref_show_tasks_counter_on_applet) {
                    if (this.pref_show_tasks_counter_on_applet) {
                        this.n_total_completed_tasks = 0;
                        let children = this.todosSec._getMenuItems();
                        let i = 0,
                            iLen = children.length;

                        for (; i < iLen; i++) {
                            let section = children[i];

                            if (section.hasOwnProperty("n_completed") && section instanceof $.TasksListItem) {
                                this.n_total_completed_tasks += section.n_completed;
                            }
                        }
                    }

                    let label = _(this.pref_custom_label_for_applet);
                    // Add an empty space only if the label isn't empty.
                    label += ((this.pref_show_tasks_counter_on_applet &&
                            this.pref_custom_label_for_applet !== "") ?
                        " " :
                        "");
                    label += (this.pref_show_tasks_counter_on_applet ?
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

            this.updateLabelVisibility();
            this._update_label_id = 0;
        });
    },

    _importTasks: function() {
        this.logger.debug("");

        Util.spawn_async([this.metadata.path + "/appletHelper.py",
                "import",
                this.pref_imp_exp_last_selected_directory
            ],
            (aOutput) => {
                let path = aOutput.trim();

                if (!Boolean(path)) {
                    return;
                }

                // Trying the following asynchronous function in replacement of
                // Cinnamon.get_file_contents*utf8_sync.
                let file = Gio.file_new_for_path(path);
                this.pref_imp_exp_last_selected_directory = path;
                file.load_contents_async(null, (aFile, aResponce) => {
                    let success, contents, tag;

                    try {
                        [success, contents, tag] = aFile.load_contents_finish(aResponce);
                    } catch (aErr) {
                        global.logError(aErr.message);
                        return;
                    }

                    if (!success) {
                        global.logError("Error parsing %s".format(file.get_path()));
                        return;
                    }

                    try {
                        let sections = JSON.parse(contents);

                        // For compatibility with older versions of this applet where an object
                        // was used instead of an array.
                        if (!Array.isArray(sections)) {
                            sections = Object.keys(sections).map((aKey) => {
                                sections[aKey]["id"] = this.next_id;
                                this.next_id++;
                                return sections[aKey];
                            });
                        }

                        let i = 0,
                            iLen = sections.length;
                        for (; i < iLen; i++) {
                            if (typeof sections[i] === "object") {
                                this._create_section("", sections[i]);
                            }
                        }
                    } finally {
                        this._buildUI();
                    }
                });
            });
    },

    _exportTasks: function(aActor, aEvent, aSection) {
        this.logger.debug("");

        Util.spawn_async([this.metadata.path + "/appletHelper.py",
                "export",
                this.pref_imp_exp_last_selected_directory
            ],
            (aOutput) => {
                let path = aOutput.trim();

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

                let rawData = JSON.stringify(sectionsContainer, null, 4);
                let file = Gio.file_new_for_path(path);
                this.pref_imp_exp_last_selected_directory = path;
                $.saveToFileAsync(rawData, file);
            });
    },

    _saveAsTODOFile: function(aActor, aEvent, aSection) {
        this.logger.debug("");

        Util.spawn_async([this.metadata.path + "/appletHelper.py",
                "save",
                this.pref_save_last_selected_directory
            ],
            (aOutput) => {
                let path = aOutput.trim();

                if (!Boolean(path)) {
                    return;
                }

                let rawData = "";
                let file = Gio.file_new_for_path(path);
                this.pref_save_last_selected_directory = path;
                let sectionsContainer;

                // Save an specific section...
                if (aSection) {
                    sectionsContainer = [];
                    sectionsContainer[0] = aSection;
                } else { // ...or all sections.
                    sectionsContainer = this.sections;
                }

                try {
                    let i = 0,
                        iLen = sectionsContainer.length;
                    for (; i < iLen; i++) {
                        if (typeof sectionsContainer[i] === "object") {
                            rawData += sectionsContainer[i]["name"] + ":";
                            rawData += "\n";
                            let t = 0,
                                tLen = sectionsContainer[i]["tasks"].length;
                            for (; t < tLen; t++) {
                                let task = sectionsContainer[i]["tasks"][t];
                                rawData += (task["completed"] ?
                                        this.pref_task_completed_character :
                                        this.pref_task_notcompleted_character) +
                                    " ";
                                rawData += task["name"];
                                rawData += "\n";

                                if (t === iLen - 1) {
                                    rawData += "\n";
                                }
                            }
                        }
                    }
                } finally {
                    $.saveToFileAsync(rawData, file);
                }
            });
    },

    _expandAppletContextMenu: function() {
        this.logger.debug("");

        let menuItem;

        // Save as TODO
        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Save as TODO"),
            "document-save-as",
            St.IconType.SYMBOLIC);
        menuItem._icon.icon_size = 14;
        menuItem.connect("activate",
            (aActor, aEvent) => this._saveAsTODOFile(aActor, aEvent));
        menuItem.tooltip = new $.CustomTooltip(
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
        menuItem.tooltip = new $.CustomTooltip(
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
        menuItem.tooltip = new $.CustomTooltip(
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
            try {
                // Mark for deletion on EOL. Cinnamon 3.6.x+
                // Replace JSON trick with Object.assign().
                // This bit me hard. Luckily, I found the solution very quickly.
                this._create_section("", JSON.parse(JSON.stringify($.DefaultExampleTasks)));
            } finally {
                this._buildUI();
            }
        });
        menuItem.tooltip = new $.CustomTooltip(
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
            let confirmDialog = new ModalDialog.ConfirmDialog(
                _("WARNING!!!") + "\n" +
                _("Do you really want to remove all your current tasks?") + "\n" +
                _("This operation cannot be reverted!!!") + "\n",
                () => {
                    this.sections = [];
                    $.saveToFileAsync("[]", this._tasks_list_file, () => this._load());
                }
            );
            confirmDialog.open(global.get_current_time());
        });
        menuItem.tooltip = new $.CustomTooltip(
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
        menuItem.tooltip = new $.CustomTooltip(menuItem.actor, _("Open this applet help file."));
        menuItem.connect("activate", () => {
            Util.spawn_async(["xdg-open", this.metadata.path + "/HELP.html"], null);
        });
        this._applet_context_menu.addMenuItem(menuItem);
    },

    updateLabelVisibility: function() {
        this.logger.debug("");

        this._update_label_id = 0;

        // Condition needed for retro-compatibility.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        if (typeof this.hide_applet_label !== "function") {
            return;
        }

        if (this.orientation == St.Side.LEFT || this.orientation == St.Side.RIGHT) {
            this.hide_applet_label(true);
        } else {
            if (this.pref_custom_label_for_applet === "" && !this.pref_show_tasks_counter_on_applet) {
                this.hide_applet_label(true);
            } else {
                this.hide_applet_label(false);
            }
        }
    },

    on_applet_clicked: function() {
        this.logger.debug("");

        this._toggleMenu();
    },

    on_applet_removed_from_panel: function() {
        this.logger.debug("");

        if (this._build_ui_id > 0) {
            Mainloop.source_remove(this._build_ui_id);
            this._build_ui_id = 0;
        }

        if (this._save_tasks_id > 0) {
            Mainloop.source_remove(this._save_tasks_id);
            this._save_tasks_id = 0;
        }

        if (this._auto_backup_id > 0) {
            Mainloop.source_remove(this._auto_backup_id);
            this._auto_backup_id = 0;
        }

        if (this._update_label_id > 0) {
            Mainloop.source_remove(this._update_label_id);
            this._update_label_id = 0;
        }

        this._clear();
        this.settings.finalize();
        Main.keybindingManager.removeHotKey(this.menu_keybinding_name);
    },

    _onSettingsChanged: function(aPrefValue, aPrefKey) {
        this.logger.debug("");

        // Note: On Cinnamon versions greater than 3.2.x, two arguments are passed to the
        // settings callback instead of just one as in older versions. The first one is the
        // setting value and the second one is the user data. To workaround this nonsense,
        // check if the second argument is undefined to decide which
        // argument to use as the pref key depending on the Cinnamon version.
        // Mark for deletion on EOL. Cinnamon 3.2.x+
        // Remove the following variable and directly use the second argument.
        let pref_key = aPrefKey || aPrefValue;
        switch (pref_key) {
            case "pref_enable_verbose_logging":
                this.logger.info("Logging changed to " + (this.pref_enable_verbose_logging ? "debug" : "info"));
                this.logger.verbose = this.pref_enable_verbose_logging;
                break;
            case "pref_custom_icon_for_applet":
            case "pref_custom_label_for_applet":
                this._updateIconAndLabel();
                break;
            case "pref_show_tasks_counter_on_applet":
                this._updateLabel();
                break;
            case "pref_overlay_key":
                this._updateKeybindings();
                break;
            case "pref_use_fail_safe":
            case "pref_section_font_size":
            case "pref_section_set_min_width":
            case "pref_section_set_max_width":
            case "pref_section_keep_alphabetic_order":
            case "pref_section_set_bold":
            case "pref_section_remove_native_entry_theming":
            case "pref_section_remove_native_entry_theming_sizing":
            case "pref_task_font_size":
            case "pref_task_set_min_width":
            case "pref_task_set_max_width":
            case "pref_task_set_custom_spacing":
            case "pref_task_set_bold":
            case "pref_task_remove_native_entry_theming":
            case "pref_task_remove_native_entry_theming_sizing":
            case "pref_tasks_priorities_colors_enabled":
            case "pref_tasks_priorities_highlight_entire_row":
            case "pref_tasks_priorities_critical_background":
            case "pref_tasks_priorities_critical_foreground":
            case "pref_tasks_priorities_high_background":
            case "pref_tasks_priorities_high_foreground":
            case "pref_tasks_priorities_medium_background":
            case "pref_tasks_priorities_medium_foreground":
            case "pref_tasks_priorities_today_background":
            case "pref_tasks_priorities_today_foreground":
            case "pref_tasks_priorities_low_background":
            case "pref_tasks_priorities_low_foreground":
                this._buildUI();
                break;
            case "pref_autobackups_enabled":
                this._force_storage_dirs_creation = true;
                this._load();
                break;
        }
    },

    get request_rebuild() {
        return this._request_rebuild;
    },

    set request_rebuild(aVal) {
        this._request_rebuild = aVal;
    }
};

function main(aMetadata, aOrientation, aPanel_height, aInstance_id) {
    return new SimpleToDoList(aMetadata, aOrientation, aPanel_height, aInstance_id);
}
