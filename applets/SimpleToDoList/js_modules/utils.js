const {
    gi: {
        Clutter,
        Gtk,
        Meta,
        Pango,
        St
    },
    ui: {
        dnd: DND,
        popupMenu: PopupMenu
    }
} = imports;

const {
    _,
    arrayEach,
    isBlank,
    tryFn
} = require("js_modules/globalUtils.js");

const {
    IntelligentTooltip
} = require("js_modules/customTooltips.js");

const {
    OrnamentType
} = require("js_modules/constants.js");

const {
    DebugManager,
    LoggingLevel
} = require("js_modules/debugManager.js");

var Debugger = new DebugManager(`org.cinnamon.applets.${__meta.uuid}`);

function runtimeInfo(aMsg) {
    Debugger.logging_level !== LoggingLevel.NORMAL && aMsg &&
        global.log("[SimpleToDoList] " + aMsg);
}

var TaskItem = class TaskItem extends PopupMenu.PopupIndicatorMenuItem {
    constructor(aApplet, aTask, aInitialOptions) {
        super("", {
            reactive: true,
            activate: true,
            hover: false
        });

        this._applet = aApplet;
        this._moved = false;
        this.task = aTask;
        this.isMovable = !aInitialOptions.sort_tasks_alphabetically &&
            !aInitialOptions.sort_tasks_by_completed;

        this._ornament = new St.Bin();
        this.setOrnament(OrnamentType.CHECK, this.task.completed || false);

        // Add an editable label to the layout to display the task
        this._label = new St.Entry({
            text: this.task.name,
            x_expand: true,
            can_focus: true
        });
        this._label.clutter_text.set_single_line_mode(false);
        this._label.clutter_text.set_line_wrap(true);
        this._label.clutter_text.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);

        // Set custom styles to the entry.
        this._setTaskStyle();

        this._del_btn = new ReactiveButton("edit-delete");
        this._del_btn.actor.tooltip = new RemoveTaskButtonTooltip(this._del_btn.actor, {
            applet: this._applet,
            is_section: false
        });

        this.addActor(this._ornament, {
            span: 0
        });

        this.addActor(this._del_btn.actor, {
            align: St.Align.START
        });

        this.addActor(this._label, {
            expand: true,
            align: St.Align.START,
            // Setting span to -1 causes the entry to span beyond the right border
            // of the menu on Cinnamon 2.8.x. ¬¬
            span: 1
        });

        // Only make item draggable if none of the sorting options are enabled.
        if (this.isMovable) {
            this._draggable = DND.makeDraggable(this.actor);
        }

        // Set initial visibility of the remove task buttons.
        if (!aInitialOptions.display_remove_task_buttons) {
            this._del_btn.actor.set_width(0);
            this._del_btn.actor.hide();
        }

        // Set initial visibility of the task.
        if (aInitialOptions.keep_completed_tasks_hidden && this.task.completed) {
            this.actor.set_height(0);
            this.actor.hide();
        }

        // Create connection for rename and clicks
        const _ct = this._label.get_clutter_text();
        _ct.set_line_wrap(true);

        this._signals.connect(_ct, "key_focus_in", function(aActor) {
            this._onKeyFocusIn(aActor);
        }.bind(this));
        this._signals.connect(_ct, "key_focus_out", function(aActor) {
            this._rename(aActor);
        }.bind(this));
        this._signals.connect(_ct, "key-press-event", function(aActor, aEvent) {
            this._onKeyPressEvent(aActor, aEvent);
        }.bind(this));
        this._signals.connect(this._ornament.child, "clicked", function() {
            this._setCheckedState();
        }.bind(this));
        this._signals.connect(this._del_btn.actor, "clicked", function() {
            this._emit_delete();
        }.bind(this));
        this._signals.connect(this.actor, "button-release-event", function(aActor, aEvent) {
            this._onButtonReleaseEvent(aActor, aEvent);
        }.bind(this));
    }

    _onButtonReleaseEvent(aActor, aEvent) {
        this.activate(aEvent, true);
        return Clutter.EVENT_STOP;
    }

    getDragActor() {
        return new Clutter.Clone({
            source: this.actor
        });
    }

    // Returns the original actor that should align with the actor
    // we show as the item is being dragged.
    getDragActorSource() {
        return this.actor;
    }

    _setTaskStyle() {
        let firstFoundTask = null;

        if (this._applet.$._.tasks_priorities_colors_enabled) {
            const tagDefinitions = this._applet.$._.tag_definitions.filter((aDef) => {
                return aDef.enabled;
            });

            arrayEach(tagDefinitions, (aDef) => {
                const tagRegEx = new RegExp(aDef.tag);

                if (tagRegEx.test(this.task.name)) {
                    firstFoundTask = aDef;
                    return false;
                }
                return null;
            });

            if (firstFoundTask && this._applet.$._.tasks_priorities_highlight_entire_row) {
                this.actor.set_style(
                    (firstFoundTask.bg_color ? `background-color: ${firstFoundTask.bg_color};` : "")
                );
            }
        }

        this._label.set_style(
            (firstFoundTask && this._applet.$._.tasks_priorities_colors_enabled && firstFoundTask.text_color ?
                `color: ${firstFoundTask.text_color};` :
                "") +
            (this._applet.$._.task_set_bold ?
                "font-weight: bold !important;" :
                "") +
            (this._applet.$._.task_set_min_width !== 0 ?
                `min-width: ${this._applet.$._.task_set_min_width}px !important;` :
                "") +
            (this._applet.$._.task_set_max_width !== 0 ?
                `max-width: ${this._applet.$._.task_set_max_width}px !important;` :
                "") +
            `font-size: ${this._applet.$._.task_font_size}em !important;` +
            (this._applet.$._.task_remove_native_entry_theming ?
                "background: transparent !important;" +
                "background-image: none !important;" +
                "background-gradient-direction: none !important;" +
                "background-gradient-start: transparent !important;" +
                "background-gradient-end: transparent !important;" +
                "background-color: transparent !important;" +
                (firstFoundTask && this._applet.$._.tasks_priorities_colors_enabled &&
                    !this._applet.$._.tasks_priorities_highlight_entire_row &&
                    firstFoundTask.bg_color ?
                    `background-color: ${firstFoundTask.bg_color};` :
                    "background-color: transparent !important;") +
                "border: none !important;" +
                "border-style: none !important;" +
                "border-image: none !important;" +
                "border-width: 0 !important;" +
                (this._applet.$._.task_remove_native_entry_theming_sizing ?
                    "border-color: transparent !important;" +
                    "border-radius: 0 !important;" +
                    "padding: 0 !important;" +
                    "margin: 0 !important;" : "") :
                (firstFoundTask && this._applet.$._.tasks_priorities_colors_enabled &&
                    !this._applet.$._.tasks_priorities_highlight_entire_row &&
                    firstFoundTask.bg_color ?
                    `background-color: ${firstFoundTask.bg_color};` :
                    "")
            )
        );
    }

    _onStyleChanged(aActor) {
        if (this._applet.$._.task_set_custom_spacing !== 0) {
            this._spacing = this._applet.$._.task_set_custom_spacing;
        } else {
            this._spacing = Math.round(aActor.get_theme_node().get_length("spacing"));
        }
    }

    _navigateEntries(aDirection) {
        if (aDirection === "up") {
            let prev = this.actor.get_previous_sibling();

            try {
                // "Filter out" hidden/completed tasks.
                while (prev !== null) {
                    if (!prev.get_paint_visibility()) {
                        prev = prev.get_previous_sibling();
                        continue;
                    } else {
                        break;
                    }
                }
            } finally {
                const prev_obj = prev ? prev._delegate : null;

                if (prev_obj && prev_obj instanceof TaskItem && prev_obj._label) {
                    prev_obj._label.grab_key_focus();
                    return Clutter.EVENT_STOP;
                }
            }

            if (this._delegated_section && this._delegated_section._label) {
                this._delegated_section._label.grab_key_focus();
                return Clutter.EVENT_STOP;
            }
        } else if (aDirection === "down") {
            let next = this.actor.get_next_sibling();

            try {
                // "Filter out" hidden/completed tasks.
                while (next !== null) {
                    if (!next.get_paint_visibility()) {
                        next = next.get_next_sibling();
                        continue;
                    } else {
                        break;
                    }
                }
            } finally {
                const next_obj = next ? next._delegate : null;

                if (next_obj && next_obj instanceof TaskItem && next_obj._label) {
                    next_obj._label.grab_key_focus();
                    return Clutter.EVENT_STOP;
                }
            }

            if (this._delegated_section && this._delegated_section.newTaskEntry &&
                this._delegated_section.newTaskEntry.newTask) {
                this._delegated_section.newTaskEntry.newTask.grab_key_focus();
                return Clutter.EVENT_STOP;
            }
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _onKeyPressEvent(aActor, aEvent) {
        const symbol = aEvent.get_key_symbol();

        // Insert: Jump to the "New task..." entry.
        if (!this.ctrlKey && symbol === Clutter.KEY_Insert) {
            this._delegated_section.newTaskEntry.newTask.grab_key_focus();
            return Clutter.EVENT_PROPAGATE;
        }

        // Shift + Delete: deletes the current task entry and focuses the previous task entry or
        // the section entry.
        // Alt + Delete: deletes the current task entry and focuses the next task entry or
        // the new task entry creator.
        // The cursor needs to be inside the task that one wishes to delete.
        if ((this.altKey || this.shiftKey) && symbol === Clutter.KEY_Delete) {
            runtimeInfo("'remove_task_signal' signal emitted");
            this.emit("remove_task_signal", this.task);
            this._navigateEntries(this.shiftKey ? "up" : "down");
            this.destroy();
            return Clutter.EVENT_STOP;
        }

        // Ctrl + Spacebar: toggle the completed state of the current focused task entry.
        // The cursor needs to be inside the task that one wishes to toggle its completed state.
        if (this.ctrlKey && symbol === Clutter.KEY_space) {
            this._ornament.child.checked = !this.checked;

            // If completed tasks are set to hide, navigate one element up.
            // Otherwise, the entire menu will close due to the loss of focus.
            if (this._delegated_section.section["keep-completed-tasks-hidden"]) {
                this._navigateEntries("up");
            }

            this._setCheckedState();
            return Clutter.EVENT_STOP;
        }

        // Ctrl + Arrow Down or Arrow Up keys: moves the currently focused task up/down.
        if (this.isMovable && this.ctrlKey &&
            (symbol === Clutter.KEY_Up || symbol === Clutter.KEY_Down)) {
            this._moveItem(symbol === Clutter.KEY_Up ? -1 : 1);
            return Clutter.EVENT_STOP;
        }

        // Arrow Down and Arrow Up keys: triggers a custom navigation that ensures
        // the focus on just the editable entries.
        if (!this.ctrlKey && (symbol === Clutter.KEY_Up || symbol === Clutter.KEY_Down)) {
            this._navigateEntries(symbol === Clutter.KEY_Up ? "up" : "down");
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _moveItem(aDirection) {
        const dir = aDirection === 1 ? "down" : "up";
        let dummy;

        if (dir === "up") {
            dummy = this.actor.get_previous_sibling();
        } else {
            dummy = this.actor.get_next_sibling();
        }

        if (dummy === null) {
            return Clutter.EVENT_STOP;
        }

        if (dummy && !(dummy._delegate instanceof TaskItem)) {
            if (dir === "up") {
                dummy = this.actor.get_next_sibling();
            } else {
                dummy = this.actor.get_previous_sibling();
            }
        }

        if (!dummy || !(dummy._delegate instanceof TaskItem)) {
            return Clutter.EVENT_STOP;
        }

        const children = this._delegated_section.tasksContainer.box.get_children();
        const taskCurPos = children.indexOf(this.actor);
        runtimeInfo("taskCurPos = " + taskCurPos);

        const taskNewPos = taskCurPos + aDirection;
        runtimeInfo("taskNewPos = " + taskNewPos);

        if (taskNewPos !== taskCurPos) {
            dummy._delegate._label.grab_key_focus();
            this._delegated_section.tasksContainer.box.remove_actor(this.actor);
            this._delegated_section.tasksContainer.box.insert_actor(this.actor, taskNewPos);
            arrayMove(this._delegated_section.tasks, taskCurPos, taskNewPos);
            this._delegated_section._saveTasks();
            this._label.grab_key_focus();
        }

        return Clutter.EVENT_STOP;
    }

    _onKeyFocusIn(aActor) { // jshint ignore:line
        const _ct = this._label.get_clutter_text();
        _ct.set_selection(0, _ct.text.length);
        this._delegated_section._scrollToItem(this);
    }

    destroy() {
        super.destroy();
    }

    isEntry() {
        return false;
    }

    _emit_delete() {
        if (this._applet.$._.use_fail_safe && !this.ctrlKey) {
            return;
        } else {
            runtimeInfo("'remove_task_signal' signal emitted");
            this.emit("remove_task_signal", this.task);
            this.destroy();
        }
    }

    _setCheckedState() {
        const completed = this.checked;

        // Return if completed state wasn't changed.
        if (completed === this.task.completed) {
            return;
        }

        this._applet.request_rebuild = true;

        this._ornament.child._delegate.setToggleState(completed);

        runtimeInfo("Set task completed state " + this.task.name + " to " + completed);

        this.task.completed = completed;
        runtimeInfo("'completed_state_changed' signal emitted");
        this.emit("completed_state_changed");

        this._delegated_section._set_text();

        if (this._delegated_section.section["keep-completed-tasks-hidden"] && this.task.completed) {
            this.actor.set_height(0);
            this.actor.hide();
        }
    }

    _rename() {
        // Rename the task and notify the ToDo list so it is updated.
        const name = this._label.get_text();

        // Return if the name did not changed or is not set
        if (name === this.task.name || name.length === 0) {
            return;
        }

        runtimeInfo("Rename task " + this.task.name + " to " + name);

        this.task.name = name;

        if (this.tooltip) {
            this._setTooltip();
        }

        this._setTaskStyle();

        this._applet.request_rebuild = true;

        runtimeInfo("'name_changed' signal emitted");
        this.emit("name_changed");
    }

    _setTooltip() {
        this.tooltip.set_text(this.task.name);
    }

    get checked() {
        return this._ornament.child.checked;
    }

    get ctrlKey() {
        return (Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2]) !== 0;
    }

    get shiftKey() {
        return (Clutter.ModifierType.SHIFT_MASK & global.get_pointer()[2]) !== 0;
    }

    get altKey() {
        return (Clutter.ModifierType.MOD1_MASK & global.get_pointer()[2]) !== 0;
    }
};

var NewTaskEntry = class NewTaskEntry extends PopupMenu.PopupSubMenuMenuItem {
    constructor(aApplet) {
        super(null);

        // NOTE: Remove all the connections added by PopupBaseMenuItem since I cannot initialize
        // PopupSubMenuMenuItem with parameters that should be passed to PopupBaseMenuItem.
        this._signals.disconnect("notify::hover", this.actor);
        this._signals.disconnect("button-release-event", this.actor);
        this._signals.disconnect("key-press-event", this.actor);
        this._signals.disconnect("key-focus-in", this.actor);
        this._signals.disconnect("key-focus-out", this.actor);

        // Just in case, murder this too.
        this._activatable = false;

        this._applet = aApplet;
        this._contextMenu = null;

        // Add a text entry in the BaseMenuItem layout
        this.newTask = new St.Entry({
            hint_text: _("New task..."),
            x_expand: true,
            track_hover: true,
            can_focus: true
        });

        this.newTask.clutter_text.set_single_line_mode(false);
        this.newTask.clutter_text.set_line_wrap(true);
        this.newTask.clutter_text.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);

        this.opt_btn = new ReactiveButton("system-run");
        this.opt_btn.actor.tooltip = new IntelligentTooltip(this.opt_btn.actor, _("Tasks list options"));

        this.addActor(this.opt_btn.actor, {
            align: St.Align.START,
            expand: false,
            span: 0
        });
        this.addActor(this.newTask, {
            align: St.Align.START,
            expand: true,
            span: -1
        });

        const _ct = this.newTask.get_clutter_text();

        // Callback to add section when ENTER is pressed.
        this._signals.connect(_ct, "key-press-event", function(aEntry, aEvent) {
            this._onKeyPressEvent(aEntry, aEvent);
        }.bind(this));
        this._signals.connect(_ct, "key_focus_in", function(aActor) {
            this._onKeyFocusIn(aActor);
        }.bind(this));
        this._signals.connect(this.opt_btn.actor, "clicked", this.toggleMenu.bind(this, false));
    }

    // This function was the only thing that I could come up with to overcome the absolutely
    // retarded behavior of a sub-menu item inside another sub-menu item.
    toggleMenu(aDestroy = false) {
        this.newTask.grab_key_focus();

        if (aDestroy && !this._contextMenu) {
            return Clutter.EVENT_STOP;
        }

        if (this._contextMenu) {
            this._contextMenu.destroy();
            this._contextMenu = null;

            return Clutter.EVENT_STOP;
        }

        this._contextMenu = new PopupMenu.PopupMenuSection();
        this._contextMenu.actor.set_style_class_name("popup-sub-menu");

        // WARNING: this.menu.addMenuItem(this._contextMenu) adds a lot of signals that I simply
        // don't want to deal with. Furthermore, it crashes Cinnamon when I click any instance
        // of PopupMenuItem added to this._contextMenu.
        // The funny thing (in a completely sick way) is that in previous versions of Cinnamon,
        // using addMenuItem worked without problems. ¬¬
        this.menu.box.add_actor(this._contextMenu.actor);

        const section = this._delegated_section.section;

        const exportSection = new PopupMenu.PopupMenuItem(
            _("Export this tasks list")
        );
        exportSection.connect("activate",
            (aActor, aEvent) => this._activateContext(aActor, aEvent, "_exportTasks"));
        this._contextMenu.addMenuItem(exportSection);

        const saveSectionAsToDo = new PopupMenu.PopupMenuItem(
            _("Save this tasks list as TODO")
        );
        saveSectionAsToDo.connect("activate",
            (aActor, aEvent) => this._activateContext(aActor, aEvent, "_saveAsTODOFile"));
        this._contextMenu.addMenuItem(saveSectionAsToDo);

        const sortAlphaSwitch = new PopupMenu.PopupSwitchMenuItem(
            _("Sort tasks alphabetically"),
            section["sort-tasks-alphabetically"]
        );
        sortAlphaSwitch.tooltip = new IntelligentTooltip(
            sortAlphaSwitch.actor,
            _("Takes effect after closing and re-opening the main menu.")
        );
        sortAlphaSwitch.connect("activate",
            (aActor, aEvent) => this._toggleSwitch(aActor, aEvent, "sort-tasks-alphabetically"));
        this._contextMenu.addMenuItem(sortAlphaSwitch);

        const sortCompletedSwitch = new PopupMenu.PopupSwitchMenuItem(
            _("Sort tasks by completed state"),
            section["sort-tasks-by-completed"]
        );
        sortCompletedSwitch.tooltip = new IntelligentTooltip(
            sortCompletedSwitch.actor,
            _("Takes effect after closing and re-opening the main menu.")
        );
        sortCompletedSwitch.connect("activate",
            (aActor, aEvent) => this._toggleSwitch(aActor, aEvent, "sort-tasks-by-completed"));
        this._contextMenu.addMenuItem(sortCompletedSwitch);

        const showRemoveTaskSwitch = new PopupMenu.PopupSwitchMenuItem(
            _("Display remove tasks buttons"),
            section["display-remove-task-buttons"]
        );
        showRemoveTaskSwitch.tooltip = new IntelligentTooltip(
            showRemoveTaskSwitch.actor,
            _("Takes effect immediately.")
        );
        showRemoveTaskSwitch.connect("activate",
            (aActor, aEvent) => this._toggleSwitch(aActor, aEvent, "display-remove-task-buttons"));
        this._contextMenu.addMenuItem(showRemoveTaskSwitch);

        const keepCompletedHiddenSwitch = new PopupMenu.PopupSwitchMenuItem(
            _("Keep completed tasks hidden"),
            section["keep-completed-tasks-hidden"]
        );
        keepCompletedHiddenSwitch.tooltip = new IntelligentTooltip(
            keepCompletedHiddenSwitch.actor,
            _("Takes effect immediately.")
        );
        keepCompletedHiddenSwitch.connect("activate",
            (aActor, aEvent) => this._toggleSwitch(aActor, aEvent, "keep-completed-tasks-hidden"));
        this._contextMenu.addMenuItem(keepCompletedHiddenSwitch);

        this._delegated_section._scrollToItem(this);
    }

    _activateContext(aActor, aEvent, aOption) {
        this.toggleMenu(true);
        this._applet.on_applet_clicked.call(this._applet);
        this._applet[aOption].call(this._applet, aActor, aEvent, this._delegated_section.section);
    }

    _toggleSwitch(aActor, aEvent, aOption) {
        this._delegated_section.section[aOption] = !this._delegated_section.section[aOption];
        aActor.setToggleState(this._delegated_section.section[aOption]);

        this._applet.request_rebuild = true;

        if (aOption === "display-remove-task-buttons" || aOption === "keep-completed-tasks-hidden") {
            this._delegated_section._setTasksElementsVisibility();
        }
    }

    _onKeyFocusIn() {
        this._delegated_section._scrollToItem(this);
    }

    destroy() {
        super.destroy();
    }

    isEntry() {
        return true;
    }

    _onKeyPressEvent(aEntry, aEvent) {
        const symbol = aEvent.get_key_symbol();

        // Ctrl + Spacebar: Opens/Closes the tasks list options menu.
        if (this.ctrlKey && symbol === Clutter.KEY_space) {
            this.toggleMenu();
            return Clutter.EVENT_STOP;
        }

        if ((!this.altKey && !this.shiftKey) &&
            (symbol === Clutter.KEY_Return ||
                symbol === Clutter.KEY_KP_Enter)) {
            runtimeInfo("'new_task' signal emitted");
            this.emit("new_task", aEntry.get_text());
            aEntry.set_text("");
            this._delegated_section._scrollToItem(this);
            return Clutter.EVENT_PROPAGATE;
        } else if (symbol === Clutter.KEY_Up) {
            const boxChildren = this._delegated_section.tasksContainer.box.get_children();
            let prev = boxChildren[boxChildren.length - 1];

            if (prev) {
                try {
                    // "Filter out" hidden/completed tasks.
                    while (prev !== null) {
                        if (!prev.get_paint_visibility()) {
                            prev = prev.get_previous_sibling();
                            continue;
                        } else {
                            break;
                        }
                    }
                } finally {
                    const prev_obj = prev ? prev._delegate : null;

                    if (prev_obj) {
                        prev_obj._label.grab_key_focus();
                    } else {
                        return Clutter.EVENT_PROPAGATE;
                    }
                }

                return Clutter.EVENT_STOP;
            } else {
                return Clutter.EVENT_PROPAGATE;
            }
        } else if (symbol === Clutter.KEY_Down) {
            this._delegated_section.menu.navigate_focus(this.actor, Gtk.DirectionType.DOWN, false);
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    get ctrlKey() {
        return (Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2]) !== 0;
    }

    get shiftKey() {
        return (Clutter.ModifierType.SHIFT_MASK & global.get_pointer()[2]) !== 0;
    }

    get altKey() {
        return (Clutter.ModifierType.MOD1_MASK & global.get_pointer()[2]) !== 0;
    }
};

var TasksContainer = class TasksContainer extends PopupMenu.PopupMenuSection {
    constructor() {
        super();

        this._dragPlaceholder = null;
        this._dragPlaceholderPos = -1;
        this._animatingPlaceholdersCount = 0;
    }

    handleDragOver(aSource, aActor, aX, aY, aTime) { // jshint ignore:line
        try {
            const task = aSource.task;
            const taskPos = this._delegated_section.tasks.indexOf(task);

            if (!task || !(aSource instanceof TaskItem)) {
                this._clearDragPlaceholder();
                return DND.DragMotionResult.NO_DROP;
            }

            const n_tasks = this._delegated_section.tasks.length;
            const children = this.box.get_children();
            let numChildren = children.length;
            let boxHeight = this.box.height;

            // Keep the placeholder out of the index calculation; assuming that
            // the remove target has the same size as "normal" items, we don't
            // need to do the same adjustment there.
            if (this._dragPlaceholder) {
                boxHeight -= this._dragPlaceholder.actor.height;
                numChildren--;
            }
            const pos = Math.round(aY * n_tasks / boxHeight);

            if (pos <= n_tasks) {
                this._dragPlaceholderPos = pos;
                let fadeIn;

                if (this._dragPlaceholder) {
                    const parentPlaceHolder = this._dragPlaceholder.actor.get_parent();
                    if (parentPlaceHolder) {
                        parentPlaceHolder.remove_actor(this._dragPlaceholder.actor);
                    }
                    this._dragPlaceholder.actor.destroy();
                    fadeIn = false;
                } else {
                    fadeIn = true;
                }

                this._dragPlaceholder = new DND.GenericDragPlaceholderItem();
                this._dragPlaceholder.child.set_width(aSource.actor.width);
                this._dragPlaceholder.child.set_height(aSource.actor.height);
                this.box.insert_actor(this._dragPlaceholder.actor,
                    this._dragPlaceholderPos);

                if (fadeIn) {
                    this._dragPlaceholder.animateIn();
                }
            }

            const srcIsCurrentItem = (taskPos !== -1);

            if (srcIsCurrentItem) {
                return DND.DragMotionResult.MOVE_DROP;
            }

            return DND.DragMotionResult.COPY_DROP;
        } catch (aErr) {
            global.logError(aErr.message);
        }

        this._clearDragPlaceholder();
        return DND.DragMotionResult.NO_DROP;
    }

    acceptDrop(aSource, aActor, aX, aY, aTime) { // jshint ignore:line
        try {
            const task = aSource.task;

            if (!task || !(aSource instanceof TaskItem)) {
                return DND.DragMotionResult.NO_DROP;
            }

            const taskCurPos = this._delegated_section.tasks.indexOf(task);
            const taskNewPos = this._dragPlaceholderPos;

            Meta.later_add(Meta.LaterType.BEFORE_REDRAW,
                () => {
                    try {
                        if (taskNewPos !== taskCurPos) {
                            this.box.remove_actor(aSource.actor);
                            this.box.insert_actor(aSource.actor, taskNewPos);
                            arrayMove(this._delegated_section.tasks, taskCurPos, taskNewPos);
                            this._delegated_section._applet.request_rebuild = true;
                            this._delegated_section._saveTasks();
                        }

                        this.box.show();
                        this._clearDragPlaceholder();
                    } catch (aErr) {
                        global.logError((aErr));
                    }
                    // return GLib.SOURCE_REMOVE;
                    return false;
                });
        } catch (aErr) {
            global.logError(aErr);
        }

        return Clutter.EVENT_STOP;
    }

    _clearDragPlaceholder() {
        if (this._dragPlaceholder) {
            this._dragPlaceholder.animateOutAndDestroy();
            this._dragPlaceholder = null;
            this._dragPlaceholderPos = -1;
        }
    }
};

var TasksListItem = class TasksListItem extends PopupMenu.PopupSubMenuMenuItem {
    constructor(aApplet, aSection) {
        super(null);

        // NOTE: Remove the connection added by PopupBaseMenuItem since I cannot initialize
        // PopupSubMenuMenuItem without hover.
        this._signals.disconnect("notify::hover", this.actor);

        this._applet = aApplet;
        this.section = aSection;
        this.id = aSection.id;
        this.name = aSection.name;
        this.tasks = aSection.tasks;
        runtimeInfo("Got section with name: " + this.name);

        this.n_tasks = 0;

        this._triangleBin = new St.Bin({
            x_expand: true,
            x_align: St.Align.END
        });
        this._triangle = arrowIcon(St.Side.RIGHT);
        this._triangle.pivot_point = new Clutter.Point({
            x: 0.5,
            y: 0.6
        });
        this._triangleBin.child = this._triangle;
        this.menu.box.set_y_expand = true;
        this.menu.box.set_x_expand = true;

        // Add an editable label to display the section title.
        this._label = new St.Entry({
            text: this.section.name,
            x_expand: false,
            y_expand: false,
            track_hover: true,
            can_focus: true
        });

        // Add an editable label to display the section title.
        this._counter = new St.Label({
            x_expand: false
        });

        // Set custom styles to the entry.
        this._setSectionStyle();

        this.delete_btn = new ReactiveButton("edit-delete");
        this.delete_btn.actor.tooltip = new RemoveTaskButtonTooltip(this.delete_btn.actor, {
            applet: this._applet,
            is_section: true
        });

        // Add a delete button that will be showed if there is no more task in the section.
        this.addActor(this.delete_btn.actor);

        // Add our label by replacing the default label in PopupSubMenuMenuItem
        this.addActor(this._label, {
            align: St.Align.START,
            expand: false,
            span: 0
        });

        // Add our label by replacing the default label in PopupSubMenuMenuItem
        this.addActor(this._counter, {
            align: St.Align.START,
            expand: false,
            span: 0
        });

        // Add the triangle to emulate accurately a sub menu item.
        this.addActor(this._triangleBin, {
            expand: true,
            span: -1,
            align: St.Align.END
        });

        // Create connection for rename and clicks
        const _ct = this._label.get_clutter_text();
        this._signals.connect(_ct, "key_focus_out", function(aActor) {
            this._rename(aActor);
        }.bind(this));
        this._signals.connect(_ct, "key-press-event", function(aActor, aEvent) {
            this._onKeyPressEvent(aActor, aEvent);
        }.bind(this));
        // Create connection for delete button
        this._signals.connect(this.delete_btn.actor, "clicked", this._supr_call.bind(this));

        // Draw the section
        this._draw_section();
    }

    _setSectionStyle() {
        let style = ["font-size: " + this._applet.$._.section_font_size + "em;"];

        this._applet.$._.section_set_bold && style.push("font-weight: bold;");

        this._counter.set_style(style.join(""));

        this._applet.$._.section_set_min_width !== 0 && style.push(
            "min-width: " + this._applet.$._.section_set_min_width + "px;"
        );

        this._applet.$._.section_set_max_width !== 0 && style.push(
            "max-width: " + this._applet.$._.section_set_max_width + "px;"
        );

        if (this._applet.$._.section_remove_native_entry_theming) {
            style = [...style, ...[
                "background: transparent;",
                "background-image: none;",
                "background-gradient-direction: none;",
                "background-gradient-start: transparent;",
                "background-gradient-end: transparent;",
                "background-color: transparent;",
                "border: none;",
                "border-style: none;",
                "border-image: none;",
                "border-color: transparent;",
            ]];
        }

        if (this._applet.$._.section_remove_native_entry_theming_sizing) {
            style = [...style, ...[
                "border-width: 0;",
                "border-radius: 0;",
                "padding: 0;",
                "margin: 0;",
            ]];
        }

        this._label.set_style(style.join(""));
    }

    _onButtonReleaseEvent(aActor, aEvent) { // jshint ignore:line
        // Always force the focus on the section entry. Otherwise, if the focus is inside
        // an entry inside an opened sub-menu, and then the sub-menu is closed, the
        // closing of the sub-menu will force the closing of the applet's main menu.
        this._label.grab_key_focus();

        if (this.menu.isOpen) {
            this.menu.close(this._applet.$._.animate_menu);
            return;
        }

        super._onButtonReleaseEvent();
    }

    // Taken from the default Cinnamon menu applet.
    // Works beautifully!!!
    _scrollToItem(aItem) {
        const current_scroll_value = this.menu.actor.get_vscroll_bar().get_adjustment().get_value();
        const box_height = this.menu.actor.get_allocation_box().y2 -
            this.menu.actor.get_allocation_box().y1;
        let new_scroll_value = current_scroll_value;

        if (current_scroll_value > aItem.actor.get_allocation_box().y1 - 10) {
            new_scroll_value = aItem.actor.get_allocation_box().y1 - 10;
        }

        if (box_height + current_scroll_value < aItem.actor.get_allocation_box().y2 + 20) {
            new_scroll_value = aItem.actor.get_allocation_box().y2 - box_height + 20;
        }

        if (new_scroll_value !== current_scroll_value) {
            this.menu.actor.get_vscroll_bar().get_adjustment().set_value(new_scroll_value);
        }
    }

    _setTasksElementsVisibility() {
        arrayEach(this.tasksContainer.box.get_children(), (aChild) => {
            const taskItem = aChild._delegate;

            if (taskItem instanceof TaskItem) { // Just to be sure.
                const del_btn = taskItem._del_btn.actor;

                if (del_btn) {
                    if (this.section["display-remove-task-buttons"]) {
                        del_btn.set_width(-1);
                        del_btn.show();
                    } else {
                        del_btn.set_width(0);
                        del_btn.hide();
                    }
                }

                if (this.section["keep-completed-tasks-hidden"] && taskItem.task.completed) {
                    taskItem.actor.set_height(0);
                    taskItem.actor.hide();
                } else {
                    taskItem.actor.set_height(-1);
                    taskItem.actor.show();
                }
            }
        });
    }

    _onKeyFocusIn() {
        const _ct = this._label.get_clutter_text();
        this._label.grab_key_focus();

        _ct.set_selection(
            this._applet.$._.auto_select_all ? 0 : -1,
            _ct.text.length
        );
    }

    _onKeyPressEvent(aActor, aEvent) {
        const symbol = aEvent.get_key_symbol();
        const cursor = this._label.get_clutter_text().get_cursor_position();

        // Insert: Jump to the "New task..." entry. If sub menu isn't open, open it.
        if (!this.ctrlKey && symbol === Clutter.KEY_Insert) {
            if (!this.menu.isOpen) {
                this.menu.open(this._applet.$._.animate_menu);
            }

            this.newTaskEntry.newTask.grab_key_focus();
            return Clutter.EVENT_PROPAGATE;
        }

        // Do not let the Right Arrow key open the menu unless the menu is closed and
        // the cursor position is at the end of the section label text.
        if (!this.ctrlKey && ((symbol === Clutter.KEY_Right && cursor !== -1 && this.menu.isOpen) ||
                // Do not let the Left Arrow key close the menu unless the menu is opened and
                // the cursor position is at the beginning of the section label text.
                (symbol === Clutter.KEY_Left && cursor !== 0 && this.menu.isOpen))) {
            return Clutter.EVENT_PROPAGATE;
        }

        if (!this.ctrlKey && symbol === Clutter.KEY_Down && this.menu.isOpen) {
            // Explicitly focus the first menu item if it exists.
            // I have no idea how navigate_focus works nor how to use it.
            if (this.tasksContainer.firstMenuItem) {
                this.tasksContainer.firstMenuItem.actor._delegate._label.grab_key_focus();
                return Clutter.EVENT_STOP;
            } else {
                return Clutter.EVENT_PROPAGATE;
            }
        }

        if (!this.ctrlKey && symbol === Clutter.KEY_Right) {
            this.menu.open(this._applet.$._.animate_menu);
            // Explicitly focus the first menu item if it exists.
            // I have no idea how navigate_focus works nor how to use it.
            if (this.tasksContainer.firstMenuItem) {
                this.tasksContainer.firstMenuItem.actor._delegate._label.grab_key_focus();
                return Clutter.EVENT_STOP;
            } else {
                this._applet.menu.actor.navigate_focus(this.actor, Gtk.DirectionType.DOWN, false);
                return Clutter.EVENT_PROPAGATE;
            }
        } else if (!this.ctrlKey && symbol === Clutter.KEY_Left && this.menu.isOpen) {
            this.menu.close(this._applet.$._.animate_menu);
            return Clutter.EVENT_STOP;
        }

        // Shift/Alt + Delete: Removes a section but only if it's empty.
        if (!this.ctrlKey && (this.altKey || this.shiftKey) &&
            symbol === Clutter.KEY_Delete &&
            this.delete_btn.actor.get_paint_visibility()) {
            tryFn(() => {
                this._applet.menu.actor.navigate_focus(this.actor, Gtk.DirectionType.UP, false);
                this.menu.close(this._applet.$._.animate_menu);
            }, (aErr) => { // jshint ignore:line
                //
            }, () => {
                runtimeInfo("'remove_section_signal' signal emitted");
                this.emit("remove_section_signal", this);
            });

            return Clutter.EVENT_PROPAGATE;
        }

        // Do not let Spacebar to activate the sub menu opening/closing.
        // Let it actually type the space.
        if (!this.ctrlKey && symbol === Clutter.KEY_space) {
            return Clutter.EVENT_PROPAGATE;
        }

        if (this.ctrlKey) {
            return Clutter.EVENT_PROPAGATE;
        } else {
            return super._onKeyPressEvent(aActor, aEvent);
        }
    }

    _draw_section() {
        this._clear();

        this.tasksContainer = new TasksContainer();
        this.tasksContainer._delegated_section = this;
        this.menu.addMenuItem(this.tasksContainer);

        // Initiate the task count
        this.n_tasks = 0;

        // Initiate completed count
        this.n_completed = 0;

        // Add tasks item in the section
        arrayEach(this.tasks, (a, aIdx) => {
            this._add_task(aIdx);
        });

        // Update the title of the section with the right task count
        // and notify the ToDo list applet if this count changed.
        this._set_text();

        // If there is no task in the section,show the delete button.
        if (this.n_tasks === 0) {
            this.delete_btn.actor.set_width(-1);
            this.delete_btn.actor.show();
        }

        // Add the NewTaskEntry to allow adding new tasks in this section.
        this.newTaskEntry = new NewTaskEntry(this._applet);
        this.newTaskEntry._delegated_section = this;
        this.newTaskEntry.menu = this.tasksContainer;

        this._signals.connect(this.newTaskEntry, "new_task", function(aItem, aText) {
            this._create_task(aItem, aText);
        }.bind(this));

        this.menu.addMenuItem(this.newTaskEntry);
    }

    destroy() {
        this.menu.close(this._applet.$._.animate_menu);

        this.disconnectAll();

        // Remove all sub items
        if (this.newTaskEntry) {
            this.newTaskEntry.destroy();
        }

        this.menu.removeAll();

        super.destroy();

        runtimeInfo("Section clean-up done");
    }

    _add_task(aI) {
        // Create a task item and set its callback
        const taskItem = new TaskItem(this._applet, this.section.tasks[aI], {
            sort_tasks_alphabetically: this.section["sort-tasks-alphabetically"],
            sort_tasks_by_completed: this.section["sort-tasks-by-completed"],
            display_remove_task_buttons: this.section["display-remove-task-buttons"],
            keep_completed_tasks_hidden: this.section["keep-completed-tasks-hidden"]
        });

        taskItem._delegated_section = this;

        // Connect the signals to taskItem
        this._signals.connect(taskItem, "name_changed", function() {
            this._saveTasks();
        }.bind(this));
        this._signals.connect(taskItem, "completed_state_changed", function(aActor) {
            this._rename(aActor);
        }.bind(this));
        this._signals.connect(taskItem, "remove_task_signal", function(aActor, aTask) {
            this._remove_task(aActor, aTask);
        }.bind(this));

        // Add the task to the section
        this.tasksContainer.addMenuItem(taskItem, aI);

        this.n_tasks++;

        if (taskItem.task.completed) {
            this.n_completed++;
        }

        // If it is the first task added, hide the delete button for the section.
        if (this.n_tasks > 0) {
            this.delete_btn.actor.set_width(0);
            this.delete_btn.actor.hide();
        }
    }

    _create_task(aItem, aText) {
        // Create a new task to add in the ToDo list and displays it while
        // updating the counters of our widget.

        // Don't add empty task
        if (isBlank(aText)) {
            return;
        }

        // New task object
        const task = {
            completed: false,
            name: aText
        };

        const id = this.tasks.push(task) - 1;
        this._add_task(id);
        this._set_text();

        runtimeInfo("'task_count_changed' signal emitted");
        this.emit("task_count_changed", -1);
        this._saveTasks();
    }

    _remove_task(aActor, aTask) {
        // Remove task from the section
        const id = this.section.tasks.indexOf(aTask);
        this.section.tasks.splice(id, 1);
        this.n_tasks--;

        if (aTask.completed) {
            this.n_completed--;
        }

        // If there is no more tasks, show the delete button
        if (this.n_tasks === 0) {
            this.delete_btn.actor.set_width(-1);
            this.delete_btn.actor.show();
        }

        // Set section title
        this._set_text();
        runtimeInfo("'task_count_changed' signal emitted");
        this.emit("task_count_changed", 1);
        this._saveTasks();
    }

    _rename(aTaskItem) {
        // Update number of completed tasks inside this tasks list.
        if (aTaskItem && aTaskItem.task) {
            if (aTaskItem.task.completed) {
                this.n_completed++;
            } else {
                this.n_completed--;
            }
        }

        const name = this._label.get_text();

        // No change needed.
        if (!aTaskItem || (name === this.name || name.length === 0)) {
            return;
        }

        // Update
        this.section.name = name;
        this.name = name;
        this._set_text();

        if (this.tooltip) {
            this._setTooltip();
        }

        this._saveTasks();
    }

    _setTooltip() {
        this.tooltip.set_text(this.section.name);
    }

    _clear() {
        // let item = null;
        // const items = this.menu._getMenuItems();
        // let i = 0,
        //     iLen = items.length;

        // for (; i < iLen; i++) {
        //     item = items[i];
        //     item.disconnectAll();
        //     item.destroy();
        // }

        // FIXME: Why on earth were the items stored before being destroyed?
        // Keep an eye on this.
        arrayEach(this.menu._getMenuItems(), (aItem) => {
            aItem.disconnectAll();
            aItem.destroy();
        });

        this.menu.removeAll();
    }

    _supr_call() {
        if (this._applet.$._.use_fail_safe && !this.ctrlKey) {
            return;
        } else {
            runtimeInfo("'remove_section_signal' signal emitted");
            this.emit("remove_section_signal", this);
        }
    }

    _set_text() {
        // Set the label text with the amount of tasks and how many are completed
        this._label.set_text(this.section.name);
        this._counter.set_text(this.n_completed + "/" + this.n_tasks);
    }

    _saveTasks() {
        tryFn(() => {
            // This might not be needed anymore, since I now store all task items
            // inside their own menu section. But I will keep it just in case.
            //
            // I have to "clean up" the tasks array because the Drag&Drop operation could
            // create a task with a value of null.
            // Instead of allowing to save those null "objects" and be forced to
            // check the tasks everywhere they are used, I just clean them before saving.
            // FIXME: Keep an eye on this. I kept this to remove nulls, but I was checking for
            // non-objects, a thing that nulls are. ¬¬
            arrayEach(this.tasks, (aTask, aIdx) => {
                if (!aTask || typeof aTask !== "object") {
                    this.tasks.splice(aIdx, 1);
                }
            }, true);
        }, (aErr) => { // jshint ignore:line
            //
        }, () => {
            runtimeInfo("'save_signal' signal emitted");
            this.emit("save_signal", false);

        });
    }

    _subMenuOpenStateChanged(aMenu, aOpen) {
        if (aOpen && this._applet.$._.keep_one_menu_open) {
            arrayEach(this._applet.todosSec._getMenuItems(), (aItem) => {
                if (aItem instanceof TasksListItem) {
                    if (this.menu !== aItem.menu) {
                        aItem.menu.close(this._applet.$._.animate_menu);
                    }
                }
            });
        }
    }

    get ctrlKey() {
        return (Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2]) !== 0;
    }

    get shiftKey() {
        return (Clutter.ModifierType.SHIFT_MASK & global.get_pointer()[2]) !== 0;
    }

    get altKey() {
        return (Clutter.ModifierType.MOD1_MASK & global.get_pointer()[2]) !== 0;
    }
};

var RemoveTaskButtonTooltip = class RemoveTaskButtonTooltip extends IntelligentTooltip {
    constructor(aActor, aObj) {
        // TO TRANSLATORS: Full sentence.
        // "Remove this section/task"
        let tt = _("Remove this %s".format(aObj.is_section ? "section" : "task"));

        if (aObj.applet.$._.use_fail_safe) {
            tt += " " + _("(Hold Ctrl key)");
        }

        super(aActor, tt);
    }
};

var ReactiveButton = class ReactiveButton {
    constructor(aIconName) {
        const icon = new St.Icon({
            icon_name: aIconName,
            icon_size: 16,
            icon_type: St.IconType.SYMBOLIC,
            style_class: "popup-menu-icon"
        });

        this.actor = new St.Button({
            child: icon
        });
        this.actor.connect("notify::hover", () => this._onHover());
    }

    _onHover() {
        this.actor.opacity = this.actor.hover ? 128 : 255;
    }
};

function arrowIcon(side) {
    let iconName;
    switch (side) {
        case St.Side.TOP:
            iconName = "pan-up";
            break;
        case St.Side.RIGHT:
            iconName = "pan-end";
            break;
        case St.Side.BOTTOM:
            iconName = "pan-down";
            break;
        case St.Side.LEFT:
            iconName = "pan-start";
            break;
    }

    const arrow = new St.Icon({
        style_class: "popup-menu-arrow",
        icon_name: iconName,
        icon_type: St.IconType.SYMBOLIC,
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        important: true
    });

    return arrow;
}

function arrayMove(array, old_index, new_index) {
    if (new_index >= array.length) {
        let k = new_index - array.length;
        while ((k--) + 1) {
            array.push(undefined);
        }
    }
    array.splice(new_index, 0, array.splice(old_index, 1)[0]);
    // return this; // for testing purposes
}

Date.prototype.toCustomISOString = function() { // jshint ignore:line
    var tzo = -this.getTimezoneOffset(),
        dif = tzo >= 0 ? "+" : "-",
        pad = function(num) {
            var norm = Math.floor(Math.abs(num));
            return (norm < 10 ? "0" : "") + norm;
        };
    return this.getFullYear() +
        "-" + pad(this.getMonth() + 1) +
        "-" + pad(this.getDate()) +
        "_" + pad(this.getHours()) +
        "." + pad(this.getMinutes()) +
        "." + pad(this.getSeconds()) +
        "." + pad(this.getMilliseconds()) +
        dif + pad(tzo / 60) +
        "." + pad(tzo % 60);
};

Debugger.wrapObjectMethods({
    IntelligentTooltip: IntelligentTooltip,
    NewTaskEntry: NewTaskEntry,
    ReactiveButton: ReactiveButton,
    RemoveTaskButtonTooltip: RemoveTaskButtonTooltip,
    TaskItem: TaskItem,
    TasksContainer: TasksContainer,
    TasksListItem: TasksListItem
});
