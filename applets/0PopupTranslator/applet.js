const AppletUUID = "{{UUID}}";

let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.appletManager.applets[AppletUUID].utils;
}

const _ = $._;

const Applet = imports.ui.applet;
const Cinnamon = imports.gi.Cinnamon;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const Settings = imports.ui.settings;
const St = imports.gi.St;
const Tooltips = imports.ui.tooltips;
const Util = imports.misc.util;

function PopupTranslatorApplet() {
    this._init.apply(this, arguments);
}

PopupTranslatorApplet.prototype = {
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
        this.keybindings_base_name = this.metadata.uuid + "-" + this.instance_id;

        try {
            this._bindSettings();
            this._expandAppletContextMenu();
            Gtk.IconTheme.get_default().append_search_path(aMetadata.path + "/icons/");
        } catch (aErr) {
            global.logError(aErr);
        }

        Mainloop.idle_add(() => {
            try {
                this.menuManager = new PopupMenu.PopupMenuManager(this);
                this.forceTranslation = false;
                this._isDestroyed = false;
                this._buildMenuId = 0;
                this.key_1_id = null;
                this.key_forced_1_id = null;
                this.key_2_id = null;
                this.key_forced_2_id = null;
                this.key_3_id = null;
                this.key_forced_3_id = null;
                this.key_4_id = null;
                this.key_forced_4_id = null;

                this._buildMenu();
                this._updateIconAndLabel();
                this._setAppletTooltip();
                this._updateKeybindings();
                this.ensureHistoryFileExists();

                if (!this.pref_all_dependencies_met) {
                    this.checkDependencies();
                }

                // I use a custom cinnamon-json-makepot command to extract strings.
                // One of the features that I added to that command is the ability to
                // ignore specified settings on the settings-schema.json file at the
                // moment of extracting strings.
                // As a side effect, some strings that would need to be extracted are ignored.
                // That's the purpose of this "dummy object", store strings that were ignored.
                // This strings belong to the two settings that lists languages (pref_target_lang_# and pref_source_lang_#).
                // I purposely ignore them because if they were translated, it will break their
                // alphabetical order on the comboboxes. I have chosen the least of the evils.
                // And I have chosen this approach to avoid at all cost the manual edition
                // of the .pot file.
                this.dummyTransObject = {
                    1: _("Source language"),
                    2: _("Target language"),
                    3: _("(G) = Language supported only by Google Translate.\n(Y) = Language supported only by Yandex Translate.")
                };
            } catch (aErr) {
                global.logError(aErr);
            }
        });
    },

    getLegibleKeybinding: function(aHKStr) {
        if (this.pref_loggin_enabled) {
            global.logError("\ngetLegibleKeybinding()>aHKStr:\n" + aHKStr);
        }

        if (aHKStr.search("<Alt>") !== -1) {
            aHKStr = aHKStr.replace("<Alt>", "Alt + ");
        }

        if (aHKStr.search("<Primary>") !== -1) {
            aHKStr = aHKStr.replace("<Primary>", "Ctrl + ");
        }

        if (aHKStr.search("<Shift>") !== -1) {
            aHKStr = aHKStr.replace("<Shift>", "Shift + ");
        }

        if (aHKStr.search("<Super>") !== -1) {
            aHKStr = aHKStr.replace("<Super>", "Super + ");
        }

        // I realized that modifier keys are named differently when "used alone".
        // Lets put this here just in case.
        if (aHKStr.search("Alt_L") !== -1) {
            aHKStr = aHKStr.replace("Alt_L", "Alt L + ");
        }

        if (aHKStr.search("Alt_R") !== -1) {
            aHKStr = aHKStr.replace("Alt_R", "Alt R + ");
        }

        if (aHKStr.search("Control_L") !== -1) {
            aHKStr = aHKStr.replace("Control_L", "Ctrl L + ");
        }

        if (aHKStr.search("Control_R") !== -1) {
            aHKStr = aHKStr.replace("Control_R", "Ctrl R + ");
        }

        if (aHKStr.search("Super_L") !== -1) {
            aHKStr = aHKStr.replace("Super_L", "Super L + ");
        }

        if (aHKStr.search("Super_R") !== -1) {
            aHKStr = aHKStr.replace("Super_R", "Super R + ");
        }

        return aHKStr;
    },

    _setAppletTooltip: function() {
        if (this.tooltip) {
            this.tooltip.destroy();
        }

        let bD = function(aStr) {
            return '<span weight="bold">' + aStr + "</span>";
        };

        let tt = bD(_(this.metadata.name));

        [1, 2, 3, 4].forEach((aID) => {
            let forceHeaderCreation;

            let hK = this["pref_translate_key_" + aID],
                fHK = this["pref_translate_key_forced_" + aID];

            switch (aID) {
                case 1:
                    forceHeaderCreation = true;
                    tt += "\n\n" + bD(_("First translation mechanism (Left click on applet)")) + "\n";
                    break;
                case 2:
                    forceHeaderCreation = true;
                    tt += "\n\n" + bD(_("Second translation mechanism (Middle click on applet)")) + "\n";
                    break;
                case 3:
                    forceHeaderCreation = hK !== "" || fHK !== "";

                    if (forceHeaderCreation) {
                        tt += "\n\n" + bD(_("Third translation mechanism (Hotkey #1)")) + "\n";
                    }
                    break;
                case 4:
                    forceHeaderCreation = hK !== "" || fHK !== "";

                    if (forceHeaderCreation) {
                        tt += "\n\n" + bD(_("Fourth translation mechanism (Hotkey #2)")) + "\n";
                    }
                    break;
            }

            if (forceHeaderCreation) {
                tt += "\t" + bD(_("Service provider") + ": ") +
                    this.providerData[this["pref_service_provider_" + aID]].name + "\n";
                tt += "\t" + bD(_("Language pair") + ": ") + $.langs[this["pref_source_lang_" + aID]] +
                    " > " +
                    $.langs[this["pref_target_lang_" + aID]];
            }

            if (hK !== "") {
                let [leftKB, rightKB] = hK.split("::");
                tt += "\n\t" + bD(_("Translation hotkey") + ": ") +
                    (leftKB ? this.getLegibleKeybinding(leftKB) : "") +
                    ((leftKB && rightKB) ? " :: " : "") +
                    (rightKB ? this.getLegibleKeybinding(rightKB) : "");
            }

            if (fHK !== "") {
                let [leftKB, rightKB] = fHK.split("::");
                tt += "\n\t" + bD(_("Force translation hotkey") + ": ") +
                    (leftKB ? this.getLegibleKeybinding(leftKB) : "") +
                    ((leftKB && rightKB) ? " :: " : "") +
                    (rightKB ? this.getLegibleKeybinding(rightKB) : "");
            }
        });

        if (!this.pref_all_dependencies_met) {
            tt += '\n<span color="red">' + bD(_("Unmet dependencies found!!!") + "\n" +
                _("A detailed error has been logged into ~/.cinnamon/glass.log file.")) + "</span>";
        }

        this.tooltip = new Tooltips.PanelItemTooltip(this, "", this.orientation);

        this.tooltip._tooltip.set_style("text-align: left;");
        this.tooltip._tooltip.get_clutter_text().set_line_wrap(true);
        this.tooltip._tooltip.get_clutter_text().set_markup(tt);

        this.connect("destroy", () => {
            this.tooltip.destroy();
        });
    },

    _setProviderVisibility: function(aID) {
        let hide = this["pref_translate_key_" + aID] === "" &&
            this["pref_translate_key_forced_" + aID] === "";

        this["ctx_header_" + aID].actor[hide ? "hide" : "show"]();
        this["g_ctx_chk_" + aID].actor[hide ? "hide" : "show"]();
        this["y_ctx_chk_" + aID].actor[hide ? "hide" : "show"]();
        this["ctx_separator_" + aID].actor[hide ? "hide" : "show"]();
    },

    _expandAppletContextMenu: function() {
        try {
            [1, 2, 3, 4].forEach((aID) => {
                let header = "ctx_header_" + aID,
                    separator = "ctx_separator_" + aID;

                this[header] = new PopupMenu.PopupBaseMenuItem({
                    hover: false,
                    focusOnHover: false
                });

                let headerLabel = new St.Label({
                    style: "font-weight: bold;"
                });
                this[header].addActor(headerLabel);

                switch (aID) {
                    case 1:
                        headerLabel.set_text(_("Left click on applet"));
                        break;
                    case 2:
                        headerLabel.set_text(_("Middle click on applet"));
                        break;
                    case 3:
                        headerLabel.set_text(_("Hotkey #1"));
                        break;
                    case 4:
                        headerLabel.set_text(_("Hotkey #2"));
                        break;
                }

                this._applet_context_menu.addMenuItem(this[header]);

                let gCheck = "g_ctx_chk_" + aID,
                    yCheck = "y_ctx_chk_" + aID,
                    provider = this["pref_service_provider_" + aID];

                this[gCheck] = new PopupMenu.PopupIndicatorMenuItem(this.providerData.google.name);
                this[gCheck].tooltip = new Tooltips.Tooltip(
                    this[gCheck].actor,
                    _("Set %s as default translation engine.").format(this.providerData.google.name)
                );
                this[gCheck].setOrnament($.OrnamentType.DOT, provider === "google");
                this[gCheck].connect("activate",
                    () => this._setContextCheckboxes("google", aID));
                this._applet_context_menu.addMenuItem(this[gCheck]);

                this[yCheck] = new PopupMenu.PopupIndicatorMenuItem(this.providerData.yandex.name);
                this[yCheck].tooltip = new Tooltips.Tooltip(
                    this[yCheck].actor,
                    _("Set %s as default translation engine.").format(this.providerData.yandex.name)
                );
                this[yCheck].setOrnament($.OrnamentType.DOT, provider === "yandex");
                this[yCheck].connect("activate",
                    () => this._setContextCheckboxes("yandex", aID));
                this._applet_context_menu.addMenuItem(this[yCheck]);

                this[separator] = new PopupMenu.PopupSeparatorMenuItem();

                this._applet_context_menu.addMenuItem(this[separator]);

                if (aID > 2) {
                    this._setProviderVisibility(aID);
                }
            });
        } catch (aErr) {
            global.logError(aErr);
        }

        let subMenu = new PopupMenu.PopupSubMenuMenuItem(_("Applet extras"));
        this._applet_context_menu.addMenuItem(subMenu);

        let menuItem = new PopupMenu.PopupIconMenuItem(
            _("Translation history"),
            "popup-translator-document-open-recent",
            St.IconType.SYMBOLIC
        );
        menuItem.tooltip = new Tooltips.Tooltip(
            menuItem.actor,
            _("Open translation history window.")
        );
        menuItem.connect("activate", () => {
            try {
                this.openTranslationHistory();
            } catch (aErr) {
                global.logError(aErr);
            }
        });
        subMenu.menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("History storage"),
            "folder",
            St.IconType.SYMBOLIC
        );
        menuItem.tooltip = new Tooltips.Tooltip(
            menuItem.actor,
            _("Open the location where the translation history file is stored.")
        );
        menuItem.connect("activate", () => {
            Util.spawn_async(["xdg-open", [
                GLib.get_home_dir(),
                ".cinnamon",
                "configs",
                this.metadata.uuid + "History"
            ].join("/")], null);
        });
        subMenu.menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Check dependencies"),
            "popup-translator-edit-find",
            St.IconType.SYMBOLIC
        );
        menuItem.tooltip = new Tooltips.Tooltip(
            menuItem.actor,
            _("Check whether the dependencies for this applet are met.")
        );
        menuItem.connect("activate", () => {
            this.checkDependencies();
        });
        subMenu.menu.addMenuItem(menuItem);

        menuItem = new PopupMenu.PopupIconMenuItem(
            _("Help"),
            "dialog-information",
            St.IconType.SYMBOLIC
        );
        menuItem.tooltip = new Tooltips.Tooltip(
            menuItem.actor,
            _("Open this applet help file.")
        );
        menuItem.connect("activate", () => {
            Util.spawn_async(["xdg-open", this.metadata.path + "/HELP.html"], null);
        });
        subMenu.menu.addMenuItem(menuItem);
    },

    _setContextCheckboxes: function(aProvider, aID) {
        try {
            this["pref_service_provider_" + aID] = aProvider;

            this["g_ctx_chk_" + aID]._ornament.child._delegate.setToggleState(aProvider === "google");
            this["y_ctx_chk_" + aID]._ornament.child._delegate.setToggleState(aProvider === "yandex");
        } catch (aErr) {
            global.logError(aErr);
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

        if (this.orientation == St.Side.LEFT || this.orientation == St.Side.RIGHT) { // no menu label if in a vertical panel
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

    on_orientation_changed: function(orientation) {
        this.orientation = orientation;
        this._buildMenu();
        this._updateIconAndLabel();
    },

    _buildMenu: function() {
        try {
            if (this._buildMenuId > 0) {
                Mainloop.source_remove(this._buildMenuId);
                this._buildMenuId = 0;
            }

            this._buildMenuId = Mainloop.timeout_add(500,
                () => {
                    if (this.menu) {
                        this.menuManager.removeMenu(this.menu);
                        this.menu.destroy();
                    }

                    this.menu = new Applet.AppletPopupMenu(this, this.orientation);
                    this.menu._transTable = new $.TranslationMenuItem(this);
                    this.menu.addMenuItem(this.menu._transTable);
                    this.menuManager.addMenu(this.menu);
                }
            );
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    _displayHistory: function(aSourceText, aMechId) {
        let historyEntry = this.transHistory[this["pref_target_lang_" + aMechId]][aSourceText];

        if (this.pref_loggin_enabled) {
            global.logError("\n_displayHistory()>historyEntry:\n" + JSON.stringify(historyEntry));
        }

        this._displayPopup(
            historyEntry["sL"],
            historyEntry["tL"],
            aSourceText,
            "[" + _("History") + "] " + historyEntry["tT"],
            aMechId
        );
    },

    _displayPopup: function(aDetectedLang, aTargetLang, aSourceText, aTranslatedText, aMechId) {
        try {
            let m = this.menu._transTable,
                provider = this["pref_service_provider_" + aMechId];
            if (m) {
                m.sourceText = aSourceText;
                m.providerURL = this.providerData[provider].websiteURL;
                m.providerURI = (this.providerData[provider].websiteURI)
                    .format(aTargetLang, encodeURIComponent(aSourceText));
                m.languagePair.set_text($.langs[aDetectedLang] + " > " + $.langs[aTargetLang]);
                m.translatedText.set_text(aTranslatedText);
                m.footerButton.tooltip._tooltip.set_text(_("Go to %s's website")
                    .format(this.providerData[provider].name));
                m.footerLabel.set_text(_("Powered By %s")
                    .format(this.providerData[provider].name));
            }
        } finally {
            if (!this.menu.isOpen) {
                this.menu.open(true);
            }
        }
    },

    _bindSettings: function() {
        this.settings = new Settings.AppletSettings(this, this.metadata.uuid, this.instance_id);

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
            "pref_service_provider_1",
            "pref_source_lang_1",
            "pref_target_lang_1",
            "pref_translate_key_1",
            "pref_translate_key_forced_1",
            "pref_service_provider_2",
            "pref_source_lang_2",
            "pref_target_lang_2",
            "pref_translate_key_2",
            "pref_translate_key_forced_2",
            "pref_service_provider_3",
            "pref_source_lang_3",
            "pref_target_lang_3",
            "pref_translate_key_3",
            "pref_translate_key_forced_3",
            "pref_service_provider_4",
            "pref_source_lang_4",
            "pref_target_lang_4",
            "pref_translate_key_4",
            "pref_translate_key_forced_4",
            "pref_style_for_language_pair",
            "pref_style_for_translated_text",
            "pref_style_for_footer",
            "pref_history_timestamp",
            "pref_history_timestamp_custom",
            "pref_history_initial_window_width",
            "pref_history_initial_window_height",
            "pref_history_width_to_trigger_word_wrap",
            "pref_yandex_api_keys",
            "pref_all_dependencies_met",
            "pref_loggin_enabled",
            "pref_loggin_save_history_indented"
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

    translate: function(aForce, aMechId) {
        this.forceTranslation = aForce;

        this.getSelection((aStr) => {
            let selection = aStr,
                targetLang = this["pref_target_lang_" + aMechId];

            try {
                if (selection === "" || selection === " ") {
                    return;
                }

                let historyEntry = this.transHistory[targetLang] && this.transHistory[targetLang][selection] ?
                    this.transHistory[targetLang][selection] :
                    false;

                if (this.forceTranslation) {
                    historyEntry = false;
                }

                if (historyEntry && targetLang === historyEntry["tL"]) {
                    this._displayHistory(selection, aMechId);
                    return;
                }
            } catch (aErr) {
                global.logError(aErr);
            }

            switch (this["pref_service_provider_" + aMechId]) {
                case "google":
                    this.Google_provider(selection, aMechId);
                    break;
                case "yandex":
                    this.Yandex_provider(selection, aMechId);
                    break;
            }
        });
    },

    Yandex_provider: function(aSourceText, aMechId) {
        try {
            let APIKeys = this.pref_yandex_api_keys.split("\n").filter((aKey) => { // Filter possible empty elements.
                if (aKey !== "") {
                    return true;
                }
                return false;
            });

            if (this.pref_loggin_enabled) {
                global.logError("\nYandex_provider()>APIKeys:\n" + APIKeys);
            }

            if (APIKeys.length === 0) {
                Main.criticalNotify(_(this.metadata.name), [
                    _("No Yandex API keys were found!!!"),
                    _("Check this applet help file for instructions."),
                    _("It can be accessed from this applet context menu.")
                ].join("\n"));
                return;
            }

            let sourceLang = this["pref_source_lang_" + aMechId];
            let targetLang = this["pref_target_lang_" + aMechId];
            let langPair = (sourceLang === "") ?
                targetLang :
                sourceLang + "-" + targetLang;
            let randomKey = APIKeys[Math.floor(Math.random() * APIKeys.length - 1) + 1];
            // There are 3 string substitutions in the following URL.
            // Those substitutions are done on the Python script (appletHelper.py).
            let YandexURL = "https://translate.yandex.net/api/v1.5/tr.json/translate?key=%s&lang=%s&text=%s&format=plain&options=1";

            Util.spawn_async([
                    this.metadata.path + "/appletHelper.py",
                    "yandex",
                    YandexURL,
                    randomKey,
                    langPair,
                    aSourceText
                ],
                (aResponse) => {
                    if (this.pref_loggin_enabled) {
                        global.logError("\nYandex_provider()>aResponse:\n" + aResponse);
                    }

                    try {
                        let result = JSON.parse(aResponse);
                        let transText = "",
                            errorMessage = "",
                            detectedLang = "",
                            informError = true;
                        switch (result.code) {
                            case 200:
                                informError = false;
                                transText = result.text[0];

                                if (sourceLang === "") {
                                    detectedLang = result.detected.lang || "?";
                                } else {
                                    detectedLang = sourceLang;
                                }

                                // Do not save history if the source text is equal to the
                                // translated text.
                                if (aSourceText !== transText) {
                                    this.setTransHistory(
                                        aSourceText, {
                                            d: this._getTimeStamp(new Date().getTime()),
                                            sL: detectedLang,
                                            tL: targetLang,
                                            tT: transText
                                        }
                                    );
                                }

                                this._displayPopup(
                                    detectedLang,
                                    targetLang,
                                    aSourceText,
                                    transText,
                                    aMechId
                                );
                                break;
                            case 401:
                                errorMessage = _("API key is invalid");
                                break;
                            case 402:
                                errorMessage = _("Blocked API key");
                                break;
                            case 404:
                                errorMessage = _("Exceeded the daily limit on the amount of translated text");
                                break;
                            case 413:
                                errorMessage = _("Exceeded the maximum text size");
                                break;
                            case 422:
                                errorMessage = _("The text cannot be translated");
                                break;
                            case 501:
                                errorMessage = _("The specified translation direction is not supported");
                                break;
                        }

                        if (informError) {
                            this._notifyParseError("Yandex Translator");
                            global.logError(errorMessage);

                            if (result.code === 401 || result.code === 402) {
                                global.logError("API key: " + randomKey);
                            }
                        }
                    } catch (aErr) {
                        this._notifyParseError("Yandex Translator");
                        global.logError(aErr);
                    }
                });
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    Google_provider: function(aSourceText, aMechId) {
        try {
            let sourceLang = this["pref_source_lang_" + aMechId];
            let targetLang = this["pref_target_lang_" + aMechId];
            let GoogleURL = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=%s&tl=%s&dt=t&q=".format(
                sourceLang === "" ?
                "auto" :
                sourceLang,
                targetLang);

            Util.spawn_async([
                    this.metadata.path + "/appletHelper.py",
                    "google",
                    GoogleURL,
                    encodeURIComponent(aSourceText)
                ],
                (aResponse) => {
                    if (this.pref_loggin_enabled) {
                        global.logError("\nGoogle_provider()>aResponse:\n" + aResponse);
                    }

                    let transText = "",
                        detectedLang;
                    try {
                        let result = JSON.parse(aResponse.replace(/,+/g, ","));

                        let i = 0,
                            iLen = result[0].length;

                        if (iLen && iLen > 1) {
                            for (; i < iLen; i++) {
                                if (result[0][i][0]) {
                                    transText += (result[0][i][0]).trim() + " ";
                                }
                            }
                        } else {
                            transText = result[0][0][0] || "";
                        }

                        if (sourceLang === "") {
                            detectedLang = result[1] ? result[1] : result[2] ? result[2] : "?";
                        } else {
                            detectedLang = sourceLang;
                        }

                        // Do not save history if the source text is equal to the translated text.
                        if (aSourceText !== transText) {
                            this.setTransHistory(
                                aSourceText, {
                                    d: this._getTimeStamp(new Date().getTime()),
                                    sL: detectedLang,
                                    tL: targetLang,
                                    tT: transText
                                }
                            );
                        }

                        this._displayPopup(
                            detectedLang,
                            targetLang,
                            aSourceText,
                            transText,
                            aMechId
                        );
                    } catch (aErr) {
                        this._notifyParseError("Google Translator");
                        global.logError(aErr);
                    }
                });
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    _onButtonPressEvent: function(aActor, aE) {
        let btn = aE.get_button();

        if (btn === 1 || btn === 2) {
            if (this.pref_all_dependencies_met) {
                let ctrlKey = (Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2]) !== 0;
                this.translate(ctrlKey, btn);
            } else {
                this.informAboutMissingDependencies();
            }
        }

        return Applet.Applet.prototype._onButtonPressEvent.call(this, aActor, aE);
    },

    _updateKeybindings: function() {
        [1, 2, 3, 4].forEach((aID) => {
            let id = "key_" + aID + "_id",
                forcedId = "key_forced_" + aID + "_id";

            if (this[id]) {
                Main.keybindingManager.removeHotKey(this[id]);
                this[id] = null;
            }

            if (this[forcedId]) {
                Main.keybindingManager.removeHotKey(this[forcedId]);
                this[forcedId] = null;
            }

            let prefId = "pref_translate_key_" + aID,
                prefForcedId = "pref_translate_key_forced_" + aID;

            if (this[prefId]) {
                this[id] = this.keybindings_base_name + "-" + aID;

                Main.keybindingManager.addHotKey(
                    this[id],
                    this[prefId],
                    () => this.translate(false, aID)
                );
            }

            if (this[prefForcedId]) {
                this[forcedId] = this.keybindings_base_name + "-forced-" + aID;

                Main.keybindingManager.addHotKey(
                    this[forcedId],
                    this[prefForcedId],
                    () => this.translate(true, aID)
                );
            }

            if (aID > 2) {
                this._setProviderVisibility(aID);
            }
        });

        this._setAppletTooltip();
    },

    _notifyParseError: function(aProvider) {
        Main.criticalNotify(_(this.metadata.name),
            _("Error parsing %s's request.").format(aProvider) + "\n" +
            _("A detailed error has been logged into ~/.cinnamon/glass.log file."));
    },

    _getTimeStamp: function(aDate) {
        let ts;
        switch (this.pref_history_timestamp) {
            case 0:
                ts = this.pref_history_timestamp_custom; // Custom
                break;
            case 1:
                ts = "YYYY MM-DD hh.mm.ss"; // ISO8601
                break;
            case 2:
                ts = "YYYY DD.MM hh.mm.ss"; // European
                break;
        }
        let dte = new Date(parseInt(aDate));
        let YYYY = String(dte.getFullYear());
        let MM = String(dte.getMonth() + 1);
        if (MM.length === 1) {
            MM = "0" + MM;
        }

        let DD = String(dte.getDate());
        if (DD.length === 1) {
            DD = "0" + DD;
        }

        let hh = String(dte.getHours());
        if (hh.length === 1) {
            hh = "0" + hh;
        }

        let mm = String(dte.getMinutes());
        if (mm.length === 1) {
            mm = "0" + mm;
        }

        let ss = String(dte.getSeconds());
        if (ss.length === 1) {
            ss = "0" + ss;
        }

        ts = ts.replace("YYYY", YYYY);
        ts = ts.replace("MM", MM);
        ts = ts.replace("DD", DD);
        ts = ts.replace("hh", hh);
        ts = ts.replace("mm", mm);
        ts = ts.replace("ss", ss);
        return ts;
    },

    providerData: {
        google: {
            name: "Google Translate",
            websiteURL: "https://translate.google.com/",
            websiteURI: "https://translate.google.com/?source=gtx_c#auto/%s/%s"
        },
        yandex: {
            name: "Yandex Translate",
            websiteURL: "http://translate.yandex.com/",
            websiteURI: "http://translate.yandex.com/?lang=%s&text=%s"
        }
    },

    ensureHistoryFileExists: function() {
        let configPath = [GLib.get_home_dir(), ".cinnamon", "configs", this.metadata.uuid + "History"].join("/");
        let configDir = Gio.file_new_for_path(configPath);

        if (!configDir.query_exists(null)) {
            configDir.make_directory_with_parents(null);
        }

        this.historyFile = configDir.get_child("translation_history.json");

        let data;

        if (this.historyFile.query_exists(null)) {
            // Trying the following asynchronous function in replacement of
            // Cinnamon.get_file_contents*utf8_sync.
            this.historyFile.load_contents_async(null, (aFile, aResponce) => {
                let rawData;
                try {
                    rawData = aFile.load_contents_finish(aResponce)[1];
                } catch (aErr) {
                    global.logError("ERROR: " + aErr.message);
                    return;
                }

                try {
                    data = JSON.parse(rawData);
                } finally {
                    this.dealWithHistoryData(data, false);
                }
            });
        } else {
            data = {
                __version__: 1
            };
            this.dealWithHistoryData(data, true);
        }
    },

    dealWithHistoryData: function(aData, aForceSaving) {
        try {
            // Implemented __version__ in case that in the future I decide
            // to change again the history mechanism. Not likely (LOL).
            if (!aData.__version__) {
                aForceSaving = true;
                let newData = JSON.stringify($.convertHistoryZeroToOne(aData));
                this._translation_history = JSON.parse(newData);
                this._translation_history.__version__ = 1;
            } else if (aData.__version__ === 1) {
                this._translation_history = aData;
            }
        } finally {
            if (aForceSaving) {
                this.saveHistoryToFile();
            }
        }
    },

    saveHistoryToFile: function() {
        let rawData;

        if (this.pref_loggin_save_history_indented) {
            rawData = JSON.stringify(this._translation_history, null, "    ");
        } else {
            rawData = JSON.stringify(this._translation_history);
        }

        let raw = this.historyFile.replace(null, false, Gio.FileCreateFlags.NONE, null);
        let out_file = Gio.BufferedOutputStream.new_sized(raw, 4096);
        Cinnamon.write_string_to_stream(out_file, rawData);
        out_file.close(null);
    },

    informAboutMissingDependencies: function() {
        Main.criticalNotify(_(this.metadata.name),
            _("Unmet dependencies found!!!") + "\n" +
            _("A detailed error has been logged into ~/.cinnamon/glass.log file."));
    },

    checkDependencies: function() {
        Util.spawn_async([
                this.metadata.path + "/appletHelper.py",
                "check-dependencies"
            ],
            (aResponse) => {
                if (this.pref_loggin_enabled) {
                    global.logError("\ncheckDependencies()>aResponse:\n" + aResponse);
                }

                let res = (aResponse.split("<!--SEPARATOR-->")[1])
                    // Preserve line breaks.
                    .replace(/\n+/g, "<br>")
                    .replace(/\s+/g, " ")
                    .replace(/<br>/g, "\n");
                res = res.trim();

                if (res.length > 1) {
                    global.logError(
                        "\n# [" + _(this.metadata.name) + "]" + "\n" +
                        "# " + _("Unmet dependencies found!!!") + "\n" +
                        res + "\n" +
                        "# " + _("Check this applet help file for instructions.") + "\n" +
                        "# " + _("It can be accessed from this applet context menu.")
                    );
                    this.informAboutMissingDependencies();
                    this.pref_all_dependencies_met = false;
                } else {
                    Main.notify(_(this.metadata.name),
                        _("All dependencies seem to be met."));
                    this.pref_all_dependencies_met = true;
                }
                this._setAppletTooltip();
            });
    },

    openTranslationHistory: function() {
        try {
            Util.spawn_async([
                this.metadata.path + "/appletHelper.py",
                "history",
                this.pref_history_initial_window_width + "," +
                this.pref_history_initial_window_height + "," +
                this.pref_history_width_to_trigger_word_wrap
            ], null);
            this.menu.close(true);
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    get transHistory() {
        return this._translation_history;
    },

    setTransHistory: function(aSourceText, aTransObj) {
        this._translation_history[aTransObj.tL] = this._translation_history[aTransObj.tL] || {};
        this._translation_history[aTransObj.tL][aSourceText] = aTransObj;
        this.saveHistoryToFile();
    },

    getSelection: function(aCallback) {
        let cmd = ["xsel", "-o"];

        try {
            Util.spawn_async(cmd, (aStandardOutput) => {
                if (this._isDestroyed) {
                    return;
                }

                let str = aStandardOutput.replace(/[\"'<>]/g, "");
                // Replace line breaks and duplicated white spaces with a single space.
                str = (str.replace(/\s+/g, " ")).trim();

                aCallback(str);

                if (this.pref_loggin_enabled) {
                    global.logError("\nselection()>str:\n" + str);
                }
            });
        } catch (aErr) {
            // TO TRANSLATORS: Full sentence:
            // "Unable to execute file/command 'FileName or Command':"
            let msg = _("Unable to execute file/command '%s':").format(cmd.join(" "));
            global.logError(msg + " " + aErr);
            Main.notify(_(this.metadata.name), msg);
        }
    },

    on_applet_removed_from_panel: function() {
        this._isDestroyed = true;

        [1, 2, 3, 4].forEach((aID) => {
            let id = "key_" + aID + "_id",
                forcedId = "key_forced_" + aID + "_id";

            if (this[id]) {
                Main.keybindingManager.removeHotKey(this[id]);
                this[id] = null;
            }

            if (this[forcedId]) {
                Main.keybindingManager.removeHotKey(this[forcedId]);
                this[forcedId] = null;
            }
        });

        if (this.menu) {
            this.menuManager.removeMenu(this.menu);
            this.menu.destroy();
        }
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
            case "pref_service_provider_1":
            case "pref_source_lang_1":
            case "pref_target_lang_1":
            case "pref_service_provider_2":
            case "pref_source_lang_2":
            case "pref_target_lang_2":
            case "pref_service_provider_3":
            case "pref_source_lang_3":
            case "pref_target_lang_3":
            case "pref_service_provider_4":
            case "pref_source_lang_4":
            case "pref_target_lang_4":
                this._setAppletTooltip();
                break;
            case "pref_translate_key_1":
            case "pref_translate_key_forced_1":
            case "pref_translate_key_2":
            case "pref_translate_key_forced_2":
            case "pref_translate_key_3":
            case "pref_translate_key_forced_3":
            case "pref_translate_key_4":
            case "pref_translate_key_forced_4":
                this._updateKeybindings();
                break;
            case "pref_style_for_language_pair":
            case "pref_style_for_translated_text":
            case "pref_style_for_footer":
                this._buildMenu();
                break;
        }
    }
};

function main(aMetadata, aOrientation, aPanel_height, aInstance_id) {
    return new PopupTranslatorApplet(aMetadata, aOrientation, aPanel_height, aInstance_id);
}
