let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets["{{UUID}}"].utils;
}

const _ = $._;

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const Settings = imports.ui.settings;
const SignalManager = imports.misc.signalManager;
const St = imports.gi.St;
const Tweener = imports.ui.tweener;

const MENU = {
    ACTIVE_APPLICATIONS: true,
    INACTIVE_APPLICATIONS: false
};

const APPLET_DIRECTION = {
    HORIZONTAL: 0,
    VERTICAL: 1
};

function CollapsibleSystrayApplet() {
    this._init.apply(this, arguments);
}

CollapsibleSystrayApplet.prototype = {
    __proto__: $.CollapsibleSystrayByFeuerfuchsForkByOdyseusApplet.prototype,

    _init: function(metadata, orientation, panel_height, instance_id) {
        this.metadata = metadata;
        this.instance_id = instance_id;
        this._panelHeight = panel_height;
        this._direction = (orientation == St.Side.TOP || orientation == St.Side.BOTTOM) ? APPLET_DIRECTION.HORIZONTAL : APPLET_DIRECTION.VERTICAL;
        this._bindSettings();

        //
        // Expand/collapse button
        this.collapseBtn = new $.CSCollapseBtn(this);
        this.collapseBtn.actor.connect("clicked", Lang.bind(this, function(o, event) { // jshint ignore:line
            if (this._hoverTimerID) {
                Mainloop.source_remove(this._hoverTimerID);
                this._hoverTimerID = null;
            }
            if (this._initialCollapseTimerID) {
                Mainloop.source_remove(this._initialCollapseTimerID);
                this._initialCollapseTimerID = null;
            }

            if (this._iconsAreHidden) {
                this._showAppIcons(true);
            } else {
                this._hideAppIcons(true);
            }
        }));

        //
        // Initialize Cinnamon applet

        $.CollapsibleSystrayByFeuerfuchsForkByOdyseusApplet.prototype._init.call(
            this,
            metadata,
            orientation,
            panel_height,
            instance_id
        );

        this.actor.add_style_class_name("ff-collapsible-systray");

        this.actor.remove_actor(this.manager_container);

        //
        // Variables

        this._signalManager = new SignalManager.SignalManager(this);
        this._hovering = false;
        this._hoverTimerID = null;
        this._registeredAppIcons = {};
        this._activeMenuItems = {};
        this._inactiveMenuItems = {};
        this._animating = false;
        this._iconsAreHidden = false;

        //
        // Root container

        this.mainLayout = new St.BoxLayout({
            vertical: this._direction == APPLET_DIRECTION.VERTICAL
        });

        //
        // Container for hidden icons

        this.hiddenIconsContainer = new St.BoxLayout({
            vertical: this._direction == APPLET_DIRECTION.VERTICAL
        });

        // Add horizontal scrolling and scroll to the end on each redraw so that it looks like the
        // collapse button "eats" the icons on collapse
        this.hiddenIconsContainer.hadjustment = new St.Adjustment();
        this.hiddenIconsContainer.connect("queue-redraw", Lang.bind(this.hiddenIconsContainer, function() {
            this.hadjustment.set_value(this.hadjustment.upper);
        }));

        //
        // Container for shown icons

        this.shownIconsContainer = new St.BoxLayout({
            vertical: this._direction == APPLET_DIRECTION.VERTICAL
        });

        //
        // Assemble layout

        this.mainLayout.add_actor(this.collapseBtn.actor);
        this.mainLayout.add_actor(this.hiddenIconsContainer);
        this.mainLayout.add_actor(this.shownIconsContainer);
        this.mainLayout.set_child_above_sibling(this.shownIconsContainer, this.hiddenIconsContainer);
        this.actor.add_actor(this.mainLayout);

        //
        // Context menu items

        this.cmitemActiveItems = new PopupMenu.PopupSubMenuMenuItem(_("Active applications"));
        this.cmitemInactiveItems = new PopupMenu.PopupSubMenuMenuItem(_("Inactive applications"));

        this._populateMenus();

        //
        // Settings

        // FIXME
        // I'll wait for the next Cinnamon release that contains support for vertical panels before I introduce these settings
        this.verticalExpandIconName = "pan-up";
        this.verticalCollapseIconName = "pan-down";

        this._loadAppIconVisibilityList();
        this.collapseBtn.setIsExpanded(!this._iconsAreHidden);

        //
        // Hover events

        this._signalManager.connect(this.actor, "enter-event", Lang.bind(this, this._onEnter));
        this._signalManager.connect(this.actor, "leave-event", Lang.bind(this, this._onLeave));
    },

    _bindSettings: function() {
        this._settings = new Settings.AppletSettings(this, this.metadata.uuid, this.instance_id);
        this._settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "icon-visibility-list", "savedIconVisibilityList", this._loadAppIconVisibilityList, null);
        this._settings.bindProperty(Settings.BindingDirection.IN, "init-delay", "initDelay", this._onSettingsUpdated, "initDelay");
        this._settings.bindProperty(Settings.BindingDirection.IN, "animation-duration", "animationDuration", this._onSettingsUpdated, "animationDuration");
        this._settings.bindProperty(Settings.BindingDirection.IN, "horizontal-expand-icon-name", "horizontalExpandIconName", this._onSettingsUpdated, "horizontalExpandIconName");
        this._settings.bindProperty(Settings.BindingDirection.IN, "horizontal-collapse-icon-name", "horizontalCollapseIconName", this._onSettingsUpdated, "horizontalCollapseIconName");
        this._settings.bindProperty(Settings.BindingDirection.IN, "tray-icon-padding", "trayIconPadding", this._onSettingsUpdated, "trayIconPadding");
        this._settings.bindProperty(Settings.BindingDirection.IN, "expand-on-hover", "expandOnHover", this._onSettingsUpdated, "expandOnHover");
        this._settings.bindProperty(Settings.BindingDirection.IN, "expand-on-hover-delay", "expandOnHoverDelay", this._onSettingsUpdated, "expandOnHoverDelay");
        this._settings.bindProperty(Settings.BindingDirection.IN, "collapse-on-leave", "collapseOnLeave", this._onSettingsUpdated, "collapseOnLeave");
        this._settings.bindProperty(Settings.BindingDirection.IN, "collapse-on-leave-delay", "collapseOnLeaveDelay", this._onSettingsUpdated, "collapseOnLeaveDelay");
        this._settings.bindProperty(Settings.BindingDirection.IN, "no-hover-for-tray-icons", "noHoverForTrayIcons", this._onSettingsUpdated, "noHoverForTrayIcons");
        this._settings.bindProperty(Settings.BindingDirection.IN, "sort-icons", "sortIcons", this._onSettingsUpdated, "sortIcons");

    },

    /*
     * Get the correct collapse icon according to the user settings and the applet orientation
     */
    get collapseIcon() {
        if (this._direction == APPLET_DIRECTION.HORIZONTAL) {
            return this.horizontalCollapseIconName;
        } else {
            return this.verticalCollapseIconName;
        }
    },

    /*
     * Get the correct expand icon according to the user settings and the applet orientation
     */
    get expandIcon() {
        if (this._direction == APPLET_DIRECTION.HORIZONTAL) {
            return this.horizontalExpandIconName;
        } else {
            return this.verticalExpandIconName;
        }
    },

    /*
     * Add all necessary menu items to the context menu
     */
    _populateMenus: function() {
        let i = -1;
        this._applet_context_menu.addMenuItem(this.cmitemActiveItems, ++i);
        this._applet_context_menu.addMenuItem(this.cmitemInactiveItems, ++i);
        this._applet_context_menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(), ++i);
    },

    /*
     * Add the specified icon to the item list and create a menu entry
     */
    _registerAppIcon: function(id, actor) {
        if (!this._registeredAppIcons.hasOwnProperty(id)) {
            this._registeredAppIcons[id] = [];
        }

        let instanceArray = this._registeredAppIcons[id];

        if (instanceArray.indexOf(actor) != -1) {
            return;
        }

        instanceArray.push(actor);

        if (!this.iconVisibilityList.hasOwnProperty(id)) {
            this.iconVisibilityList[id] = true;
            this._saveAppIconVisibilityList();
        }

        let container = this.iconVisibilityList[id] ? this.shownIconsContainer : this.hiddenIconsContainer;
        let index = 0;
        if (this.sortIcons) {
            let icons = container.get_children();
            for (let len = icons.length; index < len; ++index) {
                if (icons[index].appID.localeCompare(id) >= 1) {
                    break;
                }
            }
        }
        container.insert_actor(actor, index);

        let [minWidth, natWidth] = actor.get_preferred_width(-1); // jshint ignore:line
        let [minHeight, natHeight] = actor.get_preferred_height(-1); // jshint ignore:line

        actor.appID = id;

        if (this._iconsAreHidden && !this.iconVisibilityList[id]) {
            actor.csDisable();
        }

        this._addApplicationMenuItem(id, MENU.ACTIVE_APPLICATIONS);
    },

    /*
     * Remove the icon from the list and move the menu entry to the list of inactive applications
     */
    _unregisterAppIcon: function(id, actor) {

        let instanceArray = this._registeredAppIcons[id];
        let iconIndex = instanceArray.indexOf(actor);
        if (iconIndex != -1) {
            instanceArray.splice(iconIndex, 1);
        }

        // actor.destroy();
        actor.get_parent().remove_actor(actor);

        if (instanceArray.length === 0) {

            delete this._registeredAppIcons[id];
            this._addApplicationMenuItem(id, MENU.INACTIVE_APPLICATIONS);
        }
    },

    /*
     * Create a menu entry for the specified icon in the "active applications" section
     */
    _addApplicationMenuItem: function(id, menu) {
        let curMenuItems = menu == MENU.ACTIVE_APPLICATIONS ? this._activeMenuItems : this._inactiveMenuItems;
        let curMenu = menu == MENU.ACTIVE_APPLICATIONS ? this.cmitemActiveItems.menu : this.cmitemInactiveItems.menu;
        let otherMenuItems = menu == MENU.ACTIVE_APPLICATIONS ? this._inactiveMenuItems : this._activeMenuItems;
        let menuItem = null;

        // If there's a menu item in the other menu, delete it
        if (otherMenuItems.hasOwnProperty(id)) {
            otherMenuItems[id].actor.destroy();
            delete otherMenuItems[id];
        }

        // If there's already a menu item in the current menu, do nothing
        if (curMenuItems.hasOwnProperty(id)) {
            return;
        }

        switch (menu) {
            case MENU.ACTIVE_APPLICATIONS:
                menuItem = new PopupMenu.PopupSwitchMenuItem(id, this.iconVisibilityList[id]);
                menuItem.appID = id;
                menuItem.connect("toggled", Lang.bind(this, function(o, state) {
                    this._updateAppIconVisibility(id, state);
                }));
                break;

            default:
            case MENU.INACTIVE_APPLICATIONS:
                menuItem = new $.CSRemovableSwitchMenuItem(id, this.iconVisibilityList[id]);
                menuItem.appID = id;
                menuItem.connect("toggled", Lang.bind(this, function(o, state) {
                    this._updateAppIconVisibility(id, state);
                }));
                menuItem.connect("remove", Lang.bind(this, function(o, state) { // jshint ignore:line
                    delete this.iconVisibilityList[id];
                    this._saveAppIconVisibilityList();

                    delete this._inactiveMenuItems[id];
                }));
                break;
        }

        // Find insertion index so all menu items are alphabetically sorted
        let index = 0;
        let items = curMenu._getMenuItems();
        for (let len = items.length; index < len; ++index) {
            if (items[index].appID.localeCompare(id) >= 1) {
                break;
            }
        }

        curMenu.addMenuItem(menuItem, index);
        curMenuItems[id] = menuItem;
    },

    /*
     * Hide all icons that are marked as hidden
     */
    _hideAppIcons: function(animate) {
        if (animate && this._animating) {
            return;
        }

        if (this.hiddenIconsContainer.hasOwnProperty("tweenParams")) {
            Tweener.removeTweens(this.hiddenIconsContainer);
            this.hiddenIconsContainer.tweenParams.onComplete();
        }

        this._iconsAreHidden = true;

        let onFinished = Lang.bind(this, function() {
            delete this.hiddenIconsContainer.tweenParams;

            let icons = this.hiddenIconsContainer.get_children();
            for (let i = icons.length - 1; i >= 0; --i) {
                icons[i].csDisable();
            }

            this._animating = false;
            this.collapseBtn.setIsExpanded(false);
        });

        if (animate) {
            this._animating = true;
            this.hiddenIconsContainer.tweenParams = {
                time: this.animationDuration / 1000,
                transition: "easeInOutQuart",
                onComplete: onFinished
            };

            if (this._direction == APPLET_DIRECTION.HORIZONTAL) {
                this.hiddenIconsContainer.tweenParams.width = 0;
            } else {
                this.hiddenIconsContainer.tweenParams.height = 0;
            }

            Tweener.addTween(this.hiddenIconsContainer, this.hiddenIconsContainer.tweenParams);
        } else {
            if (this._direction == APPLET_DIRECTION.HORIZONTAL) {
                this.hiddenIconsContainer.set_width(0);
            } else {
                this.hiddenIconsContainer.set_height(0);
            }
            onFinished();
        }
    },

    /*
     * Unhide all icons that are marked as hidden
     */
    _showAppIcons: function(animate) {
        if (animate && this._animating) {
            return;
        }

        if (this.hiddenIconsContainer.hasOwnProperty("tweenParams")) {
            Tweener.removeTweens(this.hiddenIconsContainer);
            this.hiddenIconsContainer.tweenParams.onComplete();
        }

        this._iconsAreHidden = false;

        let onFinished = Lang.bind(this, function() {
            delete this.hiddenIconsContainer.tweenParams;

            this.hiddenIconsContainer.get_children().forEach(function(icon, index) { // jshint ignore:line
                icon.csEnableAfter();
            });

            this.hiddenIconsContainer.set_width(-1);

            this._animating = false;
            this.collapseBtn.setIsExpanded(true);
        });

        this.hiddenIconsContainer.get_children().forEach(function(icon, index) { // jshint ignore:line
            icon.csEnable();
        });

        if (animate) {
            this._animating = true;

            this.hiddenIconsContainer.tweenParams = {
                time: this.animationDuration / 1000,
                transition: "easeInOutQuart",
                onComplete: onFinished
            };

            if (this._direction == APPLET_DIRECTION.HORIZONTAL) {
                let [minWidth, natWidth] = this.hiddenIconsContainer.get_preferred_width(-1);
                let prevWidth = natWidth;

                this.hiddenIconsContainer.set_width(-1);
                [minWidth, natWidth] = this.hiddenIconsContainer.get_preferred_width(-1);
                this.hiddenIconsContainer.tweenParams.width = natWidth;

                this.hiddenIconsContainer.set_width(prevWidth);
            } else {
                let [minHeight, natHeight] = this.hiddenIconsContainer.get_preferred_height(-1);
                let prevHeight = natHeight;

                this.hiddenIconsContainer.set_height(-1);
                [minHeight, natHeight] = this.hiddenIconsContainer.get_preferred_height(-1);
                this.hiddenIconsContainer.tweenParams.height = natHeight;

                this.hiddenIconsContainer.set_height(prevHeight);
            }

            Tweener.addTween(this.hiddenIconsContainer, this.hiddenIconsContainer.tweenParams);
        } else {
            if (this._direction == APPLET_DIRECTION.HORIZONTAL) {
                this.hiddenIconsContainer.set_width(-1);
            } else {
                this.hiddenIconsContainer.set_height(-1);
            }
            onFinished();
        }
    },

    /*
     * Update the specified icon's visibility state and (un)hide it if necessary
     */
    _updateAppIconVisibility: function(id, state) {

        this.iconVisibilityList[id] = state;

        // Application is active, show/hide the icon if necessary
        if (this._registeredAppIcons.hasOwnProperty(id)) {
            let instances = this._registeredAppIcons[id];

            let container = state ? this.shownIconsContainer : this.hiddenIconsContainer;
            let index = 0;

            if (this.sortIcons) {
                let icons = container.get_children();
                for (let len = icons.length; index < len; ++index) {
                    if (icons[index].appID.localeCompare(id) >= 1) {
                        break;
                    }
                }
            }

            instances.forEach(Lang.bind(this, function(actor, index) {
                actor.reparent(container);
                container.set_child_at_index(actor, index);

                if (this._iconsAreHidden) {
                    if (state) {
                        actor.csEnable();
                        actor.csEnableAfter();
                    } else {
                        actor.csDisable();
                    }
                }
            }));
        }

        this._saveAppIconVisibilityList();
    },

    /*
     * Update the tray icons' padding
     */
    _updateTrayIconPadding: function() {
        this.shownIconsContainer.get_children()
            .concat(this.hiddenIconsContainer.get_children())
            .filter(function(iconWrapper) {
                return iconWrapper.isIndicator !== true;
            })
            .forEach(Lang.bind(this, function(iconWrapper, index) { // jshint ignore:line
                if (this._direction == APPLET_DIRECTION.HORIZONTAL) {
                    iconWrapper.set_style("padding-left: " + this.trayIconPadding + "px; padding-right: " + this.trayIconPadding + "px;");
                } else {
                    iconWrapper.set_style("padding-top: " + this.trayIconPadding + "px; padding-bottom: " + this.trayIconPadding + "px;");
                }
            }));
    },

    /*
     * Load the list of hidden icons from the settings
     */
    _loadAppIconVisibilityList: function() {
        try {
            this.iconVisibilityList = JSON.parse(this.savedIconVisibilityList);

            for (let id in this.iconVisibilityList) {
                if (this.iconVisibilityList.hasOwnProperty(id) && !this._registeredAppIcons.hasOwnProperty(id)) {
                    this._addApplicationMenuItem(id, MENU.INACTIVE_APPLICATIONS);
                }
            }
        } catch (e) {
            this.iconVisibilityList = {};
        }
    },

    /*
     * Save the list of hidden icons
     */
    _saveAppIconVisibilityList: function() {
        this.savedIconVisibilityList = JSON.stringify(this.iconVisibilityList);
    },

    /*
     * An applet setting with visual impact has been changed; reload
     * collapse/expand button's icons and reload all tray icons
     */
    _onSettingsUpdated: function(setting) {
        switch (setting) {
            case "expandIconName":
            case "collapseIconName":
                this.collapseBtn.setIsExpanded(!this._iconsAreHidden);
                break;

            case "trayIconPadding":
                this._updateTrayIconPadding();
                break;
        }
    },

    //
    // Events
    // ---------------------------------------------------------------------------------

    _onEnter: function() {
        this._hovering = true;

        if (this._hoverTimerID) {
            Mainloop.source_remove(this._hoverTimerID);
            this._hoverTimerID = null;
        }

        if (!this.expandOnHover) {
            return;
        }
        if (!this._draggable.inhibit) {
            return;
        }

        if (this._initialCollapseTimerID) {
            Mainloop.source_remove(this._initialCollapseTimerID);
            this._initialCollapseTimerID = null;
        }

        this._hoverTimerID = Mainloop.timeout_add(this.expandOnHoverDelay, Lang.bind(this, function() {
            this._hoverTimerID = null;

            if (this._iconsAreHidden) {
                this._showAppIcons(true);
            }
        }));
    },

    _onLeave: function() {
        this._hovering = false;

        if (this._hoverTimerID) {
            Mainloop.source_remove(this._hoverTimerID);
            this._hoverTimerID = null;
        }

        if (!this.collapseOnLeave) {
            return;
        }
        if (!this._draggable.inhibit) {
            return;
        }

        if (this._initialCollapseTimerID) {
            Mainloop.source_remove(this._initialCollapseTimerID);
            this._initialCollapseTimerID = null;
        }

        this._hoverTimerID = Mainloop.timeout_add(this.collapseOnLeaveDelay, Lang.bind(this, function() {
            this._hoverTimerID = null;

            if (!this._iconsAreHidden) {
                this._hideAppIcons(true);
            }
        }));
    },

    //
    // Overrides
    // ---------------------------------------------------------------------------------

    /*
     * Disable the collapse/expand button if the panel is in edit mode so the user can
     * perform drag and drop on that button
     */
    _setAppletReactivity: function() {

        $.CollapsibleSystrayByFeuerfuchsForkByOdyseusApplet.prototype._setAppletReactivity.call(this);

        this.collapseBtn.actor.set_reactive(this._draggable.inhibit);

        if (this._hoverTimerID) {
            Mainloop.source_remove(this._hoverTimerID);
            this._hoverTimerID = null;
        }
    },

    /*
     * The Cinnamon applet invalidates all tray icons if this event occurs, so I have to
     * unregister all tray icons when this happens
     */
    _onBeforeRedisplay: function() {

        $.CollapsibleSystrayByFeuerfuchsForkByOdyseusApplet.prototype._onBeforeRedisplay.call(this);

        this._showAppIcons(false);

        this.shownIconsContainer.get_children()
            .concat(this.hiddenIconsContainer.get_children())
            .filter(function(iconWrapper) {
                return iconWrapper.isIndicator !== true;
            })
            .forEach(Lang.bind(this, function(iconWrapper, index) { // jshint ignore:line
                iconWrapper.icon.destroy();
            }));

        if (this._initialCollapseTimerID) {
            Mainloop.source_remove(this._initialCollapseTimerID);
            this._initialCollapseTimerID = null;
        }

        this._initialCollapseTimerID = Mainloop.timeout_add(this.initDelay * 1000, Lang.bind(this, function() {
            this._initialCollapseTimerID = null;

            if (this._draggable.inhibit) {
                this._hideAppIcons(true);
            }
        }));
    },

    /*
     * Remove icon from tray, wrap it in an applet-box and re-add it. This way,
     * tray icons are displayed like applets and thus integrate nicely in the panel.
     */
    _insertStatusItem: function(role, icon, position) {
        if (icon.obsolete === true) {
            return;
        }

        $.CollapsibleSystrayByFeuerfuchsForkByOdyseusApplet.prototype._insertStatusItem.call(this, role, icon, position);

        this.manager_container.remove_child(icon);

        let iconWrap = new St.BoxLayout({
            style_class: "applet-box",
            reactive: true,
            track_hover: !this.noHoverForTrayIcons
        });
        let iconWrapContent = new St.Bin({
            child: icon
        });
        iconWrap.add_style_class_name("ff-collapsible-systray__status-icon");
        if (this._direction == APPLET_DIRECTION.HORIZONTAL) {
            iconWrap.set_style("padding-left: " + this.trayIconPadding + "px; padding-right: " + this.trayIconPadding + "px;");
        } else {
            iconWrap.set_style("padding-top: " + this.trayIconPadding + "px; padding-bottom: " + this.trayIconPadding + "px;");
        }
        iconWrap.add(iconWrapContent, {
            a_align: St.Align.MIDDLE,
            y_fill: false
        });
        iconWrap.isIndicator = false;
        iconWrap.icon = icon;

        if (["livestreamer-twitch-gui", "chromium", "swt"].indexOf(role) != -1) {
            iconWrap.csDisable = function() {
                iconWrapContent.set_child(null);
            };
            iconWrap.csEnable = function() {
                iconWrapContent.set_child(icon);
            };
            iconWrap.csEnableAfter = function() {};
        } else if (["pidgin"].indexOf(role) != -1) {
            iconWrap.csDisable = function() {
                icon.window.hide();
            };
            iconWrap.csEnable = function() {};
            iconWrap.csEnableAfter = function() {
                icon.window.show();
            };
        } else {
            iconWrap.csDisable = function() {
                icon.window.hide();
            };
            iconWrap.csEnable = function() {
                icon.window.show();
            };
            iconWrap.csEnableAfter = function() {};
        }

        icon.connect("destroy", Lang.bind(this, function() {
            this._unregisterAppIcon(role, iconWrap);
        }));

        this._registerAppIcon(role, iconWrap);
    },

    /*
     * An AppIndicator has been added; prepare its actor and register the icon
     */
    _onIndicatorAdded: function(manager, appIndicator) {

        $.CollapsibleSystrayByFeuerfuchsForkByOdyseusApplet.prototype._onIndicatorAdded.call(this, manager, appIndicator);

        if (appIndicator.id in this._shellIndicators) {
            let iconActor = this._shellIndicators[appIndicator.id];

            this.manager_container.remove_actor(iconActor.actor);

            iconActor.actor.isIndicator = true;
            iconActor.actor.csDisable = function() {
                iconActor.actor.set_reactive(false);
            };
            iconActor.actor.csEnable = function() {
                iconActor.actor.set_reactive(true);
            };
            iconActor.actor.connect("destroy", Lang.bind(this, function() {
                this._unregisterAppIcon(appIndicator.id, iconActor.actor);
            }));

            this._registerAppIcon(appIndicator.id, iconActor.actor);
        }
    },

    /*
     * The applet's orientation changed; adapt accordingly
     */
    on_orientation_changed: function(orientation) {

        $.CollapsibleSystrayByFeuerfuchsForkByOdyseusApplet.prototype.on_orientation_changed.call(this, orientation);

        this.orientation = orientation;
        this._direction = (orientation == St.Side.TOP || orientation == St.Side.BOTTOM) ? APPLET_DIRECTION.HORIZONTAL : APPLET_DIRECTION.VERTICAL;

        if (this._direction == APPLET_DIRECTION.VERTICAL) {
            this.mainLayout.set_vertical(true);
            this.hiddenIconsContainer.set_vertical(true);
            this.shownIconsContainer.set_vertical(true);
        } else {
            this.mainLayout.set_vertical(false);
            this.hiddenIconsContainer.set_vertical(false);
            this.shownIconsContainer.set_vertical(false);
        }
    },

    /*
     * The applet has been added to the panel; save settings
     */
    on_applet_added_to_panel: function() {

        $.CollapsibleSystrayByFeuerfuchsForkByOdyseusApplet.prototype.on_applet_added_to_panel.call(this);

        // Automatically collapse after X seconds
        this._initialCollapseTimerID = Mainloop.timeout_add(this.initDelay * 1000, Lang.bind(this, function() {
            this._initialCollapseTimerID = null;

            if (this._draggable.inhibit) {
                this._hideAppIcons(true);
            }
        }));
    },

    /*
     * The applet has been removed from the panel; save settings
     */
    on_applet_removed_from_panel: function() {

        $.CollapsibleSystrayByFeuerfuchsForkByOdyseusApplet.prototype.on_applet_removed_from_panel.call(this);

        this._settings.finalize();
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new CollapsibleSystrayApplet(metadata, orientation, panel_height, instance_id);
}
