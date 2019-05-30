let translator = null,
    XletMeta,
    C,
    G,
    D,
    UI,
    SpawnUtils,
    CustomFileUtils,
    $,
    // constants.js
    _,
    Settings,
    // globalUtils.js
    OutputReader,
    DesktopNotificationsUtils;

const {
    gi: {
        Cinnamon,
        Clutter,
        Gio,
        GLib,
        St
    },
    mainloop: Mainloop,
    misc: {
        signalManager: SignalManager,
        util: Util
    },
    ui: {
        main: Main
    }
} = imports;

function MultiTranslator() {
    this._init.apply(this, arguments);
}

MultiTranslator.prototype = {
    _timeout_ids: {
        load_theme: 0
    },
    _keybindings: [
        "pref_open_translator_dialog_keybinding",
        "pref_translate_from_clipboard_keybinding",
        "pref_translate_from_selection_keybinding"
    ],

    _init: function() {
        this.sigMan = new SignalManager.SignalManager(null);
        this.transDialog = new UI.TranslatorDialog(this);
        this.helpDialog = new UI.HelpDialog();

        this.transProvidersButton = null;
        this.transProvidersButtonPopup = null;
        this.preferencesMenuButton = null;
        this.preferencesMenuButtonPopup = null;
        this.providersManager = null;
        this.registeredKeybindings = [];
        this.langsStats = null;
        this.theme = null;
        this.stylesheet = null;
        this.forceTranslation = false;
        this.historyFile = null;
        this._current_source_lang = null;
        this._current_target_lang = null;
        this._translation_history = null;
        this._sourceLanguageChooser = null;
        this._targetLanguageChooser = null;
        this._settingsDesktopFileName = "org.Cinnamon.Extensions.MultiTranslator.Settings";
        this._settingsDesktopFilePath = GLib.get_home_dir() +
            "/.local/share/applications/%s.desktop".format(this._settingsDesktopFileName);
    },

    enable: function() {
        this._checkTranslatorPrefsVersion();
        this._registerKeybindings();
        this._initProvidersManager();
        this._initLanguagesChooser();
        this._populateSourceTopbar();
        this._populateActionBar();
        this._populateTargetTopbar();
        this._setCurrentLanguages();
        this._initMostUsed();
        this._loadTheme();
        this._connectSignals();

        if (Settings.pref_history_enabled) {
            this._ensureHistoryFileExists();
        }

        if (!Settings.pref_informed_about_dependencies) {
            $.checkDependencies();
        }

        this._generateSettingsDesktopFile();
    },

    disable: function() {
        /* NOTE: Set pref_desktop_file_generated to false so it forces the re-generation
         * of the desktop file (if it's needed) the next time the extension is enabled.
         */
        Settings.pref_desktop_file_generated = false;

        this._removeSettingsDesktopFile();
        this.transDialog.close();
        this.unloadStylesheet();
        this._removeKeybindings();

        this.helpDialog.destroy();
        this._sourceLanguageChooser.destroy();
        this._targetLanguageChooser.destroy();
        this.transDialog.destroy();

        this.sigMan.disconnectAllSignals();
        Settings.destroy();
    },

    _connectSignals: function() {
        this.transDialog.dialog_layout.connect("key-press-event",
            (aActor, aEvent) => this._on_key_press_event(aActor, aEvent));

        this.transDialog.source_entry.connect("activate",
            (aActor, aEvent) => this._translate(aActor, aEvent));

        this.sigMan.connect(Main.themeManager, "theme-set", function() {
            this._loadTheme(false);
        }.bind(this));

        let cS = (aPref, aCallback) => {
            Settings.connect(
                "changed::" + aPref,
                aCallback
            );
        };

        cS("trigger_translators_prefs_defaults", this._reapplyDefaults.bind(this));
        cS("trigger_date_format_syntax_info", this.openDateFormatSyntaxInfo.bind(this));
        cS("pref_show_most_used", function() {
            if (!Settings.pref_show_most_used) {
                this.langsStats = null;
            }

            this._initMostUsed();
        }.bind(this));
        cS("pref_dialog_theme", function() {
            this._loadTheme(true);
        }.bind(this));
        cS("pref_dialog_theme_custom", function() {
            /* NOTE: Do not trigger the theme reload when setting the path if
             * the theme isn't set to custom.
             */
            if (Settings.pref_dialog_theme !== "custom") {
                return;
            }

            this._loadTheme(true);
        }.bind(this));
        cS("pref_open_translator_dialog_keybinding", function() {
            this._registerKeybindings();
        }.bind(this));
        cS("pref_translate_from_clipboard_keybinding", function() {
            this._registerKeybindings();
        }.bind(this));
        cS("pref_translate_from_selection_keybinding", function() {
            this._registerKeybindings();
        }.bind(this));
        cS("pref_history_enabled", function() {
            this._ensureHistoryFileExists();
        }.bind(this));
    },

    _reapplyDefaults: function() {
        let defaults = JSON.parse(JSON.stringify(Settings.pref_translators_prefs_defaults));
        let transPrefs = JSON.parse(JSON.stringify(Settings.pref_translators_prefs));
        let i = defaults.length;
        while (i--) {
            let defEng = defaults[i];

            if (transPrefs.hasOwnProperty(defEng["provider_name"])) {
                let existentEngine = transPrefs[defEng["provider_name"]];
                existentEngine["default_source"] = defEng["default_source"];
                existentEngine["default_target"] = defEng["default_target"];
                existentEngine["remember_last_lang"] = defEng["remember_last_lang"];
                transPrefs[defEng["provider_name"]] = existentEngine;
            }
        }

        Settings.pref_translators_prefs = transPrefs;
    },

    _ensureLangsStats: function() {
        if (!this.langsStats) {
            this.langsStats = new $.LanguagesStats();
        }
    },

    _initMostUsed: function() {
        if (!Settings.pref_show_most_used) {
            return;
        }

        this._ensureLangsStats();

        this.langsStats.connect(
            "stats-changed", () => this._showMostUsed()
        );
        this.transDialog.most_used.sources.connect(
            "clicked",
            (aActor, aData) => {
                this.transDialog.most_used.sources.select(aData.lang_code);
                this._setCurrentSource(aData.lang_code);
                this._current_langs_changed();
                Settings.pref_auto_translate_when_switching_language && this._translate();
            }
        );
        this.transDialog.most_used.targets.connect(
            "clicked",
            (aActor, aData) => {
                this.transDialog.most_used.targets.select(aData.lang_code);
                this._setCurrentTarget(aData.lang_code);
                this._current_langs_changed();
                Settings.pref_auto_translate_when_switching_language && this._translate();
            }
        );
    },

    _showMostUsed: function() {
        if (!Settings.pref_show_most_used) {
            return;
        }

        this._ensureLangsStats();

        let most_used_sources = this.langsStats.getNMostUsed(
            this.providersManager.current.name,
            C.STATS_TYPE_SOURCE,
            5
        );
        this.transDialog.most_used.sources.set_languages(most_used_sources);

        let most_used_targets = this.langsStats.getNMostUsed(
            this.providersManager.current.name,
            C.STATS_TYPE_TARGET,
            5
        );
        this.transDialog.most_used.targets.set_languages(most_used_targets);

        this._mostUsedBarSelectCurrent();
    },

    _mostUsedBarSelectCurrent: function() {
        if (!Settings.pref_show_most_used) {
            return;
        }

        this.transDialog.most_used.sources.select(this._current_source_lang);
        this.transDialog.most_used.targets.select(this._current_target_lang);
    },

    _removeTimeouts: function(aTimeoutKey = false) {
        if (!G.isBlank(aTimeoutKey)) {
            if (this._timeout_ids.hasOwnProperty(aTimeoutKey) &&
                this._timeout_ids[aTimeoutKey] > 0) {
                Mainloop.source_remove(this._timeout_ids[aTimeoutKey]);
                this._timeout_ids[aTimeoutKey] = 0;
            }
        } else {
            for (let key in this._timeout_ids) {
                if (this._timeout_ids[key] > 0) {
                    Mainloop.source_remove(this._timeout_ids[key]);
                    this._timeout_ids[key] = 0;
                }
            }
        }
    },

    _on_key_press_event: function(aActor, aEvent) {
        let state = aEvent.get_state();
        let symbol = aEvent.get_key_symbol();
        let code = aEvent.get_key_code();
        let control = state === Clutter.ModifierType.CONTROL_MASK ||
            state === C.MagicKeys.CYRILLIC_CONTROL;
        let controlShift = state === Clutter.ModifierType.SHIFT_MASK + Clutter.ModifierType.CONTROL_MASK ||
            state === C.MagicKeys.CYRILLIC_SHIFT + C.MagicKeys.CYRILLIC_CONTROL;

        if (symbol === Clutter.Escape) {
            this.transDialog.close();
        } else if (controlShift && code === Clutter.KEY_6) { // Ctrl + Shift + C - Copy translated text to clipboard.
            let text = this.transDialog.target_entry.text;

            if (G.isBlank(text)) {
                this.transDialog.info_bar.add_message({
                    message: G.escapeHTML(_("There is nothing to copy")),
                    type: C.StatusbarMessageType.ERROR
                });
            } else {
                let clipboard = St.Clipboard.get_default();

                if (St.ClipboardType) {
                    clipboard.set_text(St.ClipboardType.CLIPBOARD, text);
                } else {
                    clipboard.set_text(text);
                }

                this.transDialog.info_bar.add_message({
                    message: G.escapeHTML(_("Translated text copied to clipboard"))
                });
            }
        } else if (control && (code === Clutter.exclam || code === Clutter.KEY_exclam)) { // Ctrl + M - Open main menu.
            this.transProvidersButton.params.callback();
        } else if (control && (code === Clutter.colon || code === Clutter.KEY_colon)) { // Ctrl + M - Open main menu.
            this.preferencesMenuButton.params.callback();
        } else if (control && (code === Clutter.apostrophe || code === Clutter.KEY_apostrophe)) { // Ctrl + S - Swap languages.
            this._swapLanguages();
            /* NOTE: Should I acquire a crystal ball to divine the Clutter constant for
             * the key with code 27? Isn't enough nonsense that the code's names have
             * nothing whatsof*ckingever with the actual keys? FOR F*UCK'S SAKE!!!!!
             */
        } else if (control && code === 27) { // Crtl + R - Reset languages to default.
            this._resetLanguages();
        } else if (symbol === Clutter.KEY_Super_L || symbol === Clutter.KEY_Super_R) { // Super - Close dialog.
            this.transDialog.close();
        } else if (symbol === Clutter.KEY_F1) { // F1 - Open quick help dialog.
            this._showHelpDialog();
        } else {
            if (Settings.pref_logging_level !== D.LoggingLevel.NORMAL) {
                global.log(JSON.stringify({
                    state: state,
                    symbol: symbol,
                    code: code
                }, null, "\t"));
            }
        }
    },

    _setCurrentTranslator: function(aName, aSaveLastUsedToPrefFile = false) {
        this.providersManager.current = aName;
        this.transDialog.source_entry.max_length = this.providersManager.current.char_limit;
        this._setCurrentLanguages(aSaveLastUsedToPrefFile);
        this._showMostUsed();
        this._updateProviderButton(aName);

        this.transDialog.source_entry.grab_key_focus();
    },

    _updateProviderButton: function(aName) {
        let requiresTransShell = /TS$/.test(aName);
        this.transDialog.provider_button.label = _("Service provided by %s")
            .format(C.ProviderData.display_name[aName] +
                (requiresTransShell ? " (*)" : ""));
    },

    _setCurrentSource: function(aLangCode, aSaveLastUsedToPrefFile = true) {
        this._current_source_lang = aLangCode;

        /* NOTE: Minimize writes to disk.
         * Only save the preference when a language is actually chosen and not
         * every time the dialog is opened.
         */
        if (aSaveLastUsedToPrefFile) {
            this.providersManager.current.prefs = {
                key: "last_source",
                val: aLangCode
            };
        }
    },

    _setCurrentTarget: function(aLangCode, aSaveLastUsedToPrefFile = true) {
        this._current_target_lang = aLangCode;

        /* NOTE: Same as source language.
         */
        if (aSaveLastUsedToPrefFile) {
            this.providersManager.current.prefs = {
                key: "last_target",
                val: aLangCode
            };
        }
    },

    _setCurrentLanguages: function(aSaveLastUsedToPrefFile = false) {
        let current_translator = this.providersManager.current;
        let current_source = (current_translator.prefs.remember_last_lang &&
                current_translator.prefs.hasOwnProperty("last_source") &&
                current_translator.prefs.last_source) ?
            current_translator.prefs.last_source :
            current_translator.prefs.default_source;
        let current_target = (current_translator.prefs.remember_last_lang &&
                current_translator.prefs.hasOwnProperty("last_target") &&
                current_translator.prefs.last_target) ?
            current_translator.prefs.last_target :
            current_translator.prefs.default_target;

        this._setCurrentSource(current_source, aSaveLastUsedToPrefFile);
        this._setCurrentTarget(current_target, aSaveLastUsedToPrefFile);
        this._current_langs_changed();
    },

    _swapLanguages: function() {
        let source = this._current_source_lang;
        let target = this._current_target_lang;

        if (source === "auto") {
            this.transDialog.info_bar.add_message({
                message: G.escapeHTML(_("Languages cannot be swapped")),
                type: C.StatusbarMessageType.ERROR
            });

            return;
        }

        this._setCurrentSource(target);
        this._setCurrentTarget(source);
        this._current_langs_changed();
        this._mostUsedBarSelectCurrent();
        Settings.pref_auto_translate_when_switching_language && this._translate();
    },

    _resetLanguages: function() {
        let current = this.providersManager.current;
        this._setCurrentSource(current.prefs.default_source);
        this._setCurrentTarget(current.prefs.default_target);
        this._current_langs_changed();
        this._mostUsedBarSelectCurrent();
    },

    _updateStats: function() {
        if (!Settings.pref_show_most_used) {
            return;
        }

        this._ensureLangsStats();

        let source_data = {
            code: this._current_source_lang,
            name: this.providersManager.current.getLanguageName(
                this._current_source_lang
            )
        };
        this.langsStats.increment(
            this.providersManager.current.name,
            C.STATS_TYPE_SOURCE,
            source_data
        );
        let target_data = {
            code: this._current_target_lang,
            name: this.providersManager.current.getLanguageName(
                this._current_target_lang
            )
        };
        this.langsStats.increment(
            this.providersManager.current.name,
            C.STATS_TYPE_TARGET,
            target_data
        );
    },

    _showHelpDialog: function() {
        this.closeAllMenus();

        if (this.helpDialog.state === C.DialogState.OPENED ||
            this.helpDialog.state === C.DialogState.OPENING) {
            this.helpDialog.close();
        } else {
            this.helpDialog.open();
        }
    },

    _openTranslationHistory: function() {
        if (!Settings.pref_history_enabled) {
            return;
        }

        let timestampFormat;

        switch (Settings.pref_history_timestamp) {
            case "custom":
                timestampFormat = Settings.pref_history_timestamp_custom; // Custom
                break;
            case "iso":
                timestampFormat = "%Y %m-%d %H:%M:%S"; // ISO8601
                break;
            case "eu":
                timestampFormat = "%Y %d-%m %H:%M:%S"; // European
                break;
        }

        this.transDialog.close();

        Util.spawn_async([
            XletMeta.path + "/translatorHistory.py",
            "--gui",
            "--word-wrap=" + String(Settings.pref_history_width_to_trigger_word_wrap),
            "--timestamp-format=" + timestampFormat
        ], null);
    },

    _on_source_language_chosen: function(aActor, aLang) {
        this._mostUsedBarSelectCurrent();
        this._setCurrentSource(aLang.code);
        this._current_langs_changed();
        this._sourceLanguageChooser.close();
        Settings.pref_auto_translate_when_switching_language && this._translate();
    },

    _on_target_language_chosen: function(aActor, aLang) {
        this._mostUsedBarSelectCurrent();
        this._setCurrentTarget(aLang.code);
        this._current_langs_changed();
        this._targetLanguageChooser.close();
        Settings.pref_auto_translate_when_switching_language && this._translate();
    },

    _current_langs_changed: function() {
        this._source_lang_button.label = this.providersManager.current.getLanguageName(
            this._current_source_lang
        );
        this._target_lang_button.label = this.providersManager.current.getLanguageName(
            this._current_target_lang
        );
    },

    _getPreferencesMenuDialogPopup: function() {
        this.preferencesMenuButton = new UI.ButtonsBarButton({
            icon_name: C.Icons.menu,
            tooltip: "%s (<b>%s + M</b>)".format(
                G.escapeHTML(_("Main menu")),
                G.escapeHTML(_("Ctrl"))
            ),
            button_style_class: "mt-main-menu-button",
            info_bar: this.transDialog.info_bar,
            callback: () => {
                this.closeAllMenus("main");

                if (this.preferencesMenuButtonPopup && this.preferencesMenuButtonPopup.isOpen) {
                    this.preferencesMenuButtonPopup.close();
                } else {
                    this.preferencesMenuButtonPopup = new UI.DialogPopup(
                        this.preferencesMenuButton,
                        this.transDialog,
                        St.Side.BOTTOM
                    );
                    let items = [
                        [_("Preferences"),
                            () => this.openExtensionSettings(),
                            C.Icons.preferences
                        ]
                    ];

                    if (Settings.pref_history_enabled) {
                        items.push([
                            _("Translation history"),
                            () => this._openTranslationHistory(),
                            C.Icons.history
                        ]);
                    }

                    items = items.concat([
                        ["separator"],
                        [_("Check dependencies"),
                            () => {
                                this.transDialog.close();
                                $.checkDependencies();
                            },
                            C.Icons.find
                        ],
                        [_("Extended help"),
                            () => this.openHelpPage(),
                            C.Icons.help
                        ]
                    ]);

                    let i = 0,
                        iLen = items.length;
                    for (; i < iLen; i++) {
                        this.preferencesMenuButtonPopup.add_item({
                            label: items[i][0],
                            callback: items[i][1],
                            icon_name: items[i][2]
                        });
                    }

                    this.preferencesMenuButtonPopup.open();
                }
            }
        });

        return this.preferencesMenuButton;
    },

    _getTransProvidersDialogPopup: function() {
        if (this.providersManager.num_translators < 2) {
            this.transProvidersButton = new UI.ButtonsBarLabel({
                icon_name: C.Icons.providers,
                button_style_class: "mt-provider-selector-button"
            });
        } else {
            this.transProvidersButton = new UI.ButtonsBarButton({
                icon_name: C.Icons.providers,
                tooltip: "%s (<b>%s + P</b>)".format(
                    G.escapeHTML(_("Provider selector menu")),
                    G.escapeHTML(_("Ctrl"))
                ),
                button_style_class: "mt-provider-selector-button",
                info_bar: this.transDialog.info_bar,
                callback: () => {
                    this.closeAllMenus("translators");

                    if (this.transProvidersButtonPopup && this.transProvidersButtonPopup.isOpen) {
                        this.transProvidersButtonPopup.close();
                    } else {
                        this.transProvidersButtonPopup = new UI.DialogPopup(
                            this.transProvidersButton,
                            this.transDialog,
                            St.Side.TOP
                        );

                        let names = this.providersManager.translators_names.sort((a, b) => {
                            return a.localeCompare(b);
                        });

                        let setCurrentTrans = (name) => {
                            return () => {
                                this._setCurrentTranslator(name, true);
                            };
                        };

                        let i = 0,
                            iLen = names.length;
                        for (; i < iLen; i++) {
                            let name = names[i];

                            if (name === this.providersManager.current.name) {
                                continue;
                            }

                            this.transProvidersButtonPopup.add_item({
                                label: name,
                                callback: setCurrentTrans(name),
                                icon_name: C.ProviderData.icon[name],
                                is_translators_popup: true
                            });
                        }
                        this.transProvidersButtonPopup.open();
                    }
                }
            });
        }

        return this.transProvidersButton;
    },

    _initProvidersManager: function() {
        this.providersManager = new $.ProvidersManager(this);
        this.transDialog.source_entry.max_length = this.providersManager.current.char_limit;
    },

    _initLanguagesChooser: function() {
        this._sourceLanguageChooser = new UI.LanguageChooser({
            title: _("Choose source language"),
            name: "MultiTranslatorSourceChooser"
        });
        this._sourceLanguageChooser.connect("language-chosen",
            (aActor, aLang) => this._on_source_language_chosen(aActor, aLang)
        );

        this._targetLanguageChooser = new UI.LanguageChooser({
            title: _("Choose target language"),
            name: "MultiTranslatorTargetChooser"
        });
        this._targetLanguageChooser.connect("language-chosen",
            (aActor, aLang) => this._on_target_language_chosen(aActor, aLang)
        );
    },

    _populateSourceTopbar: function() {
        this._source_lang_button = new UI.ButtonsBarButton({
            label: this.providersManager.current.getLanguageName(
                this._current_source_lang || ""
            ) || "?",
            tooltip: G.escapeHTML(_("Choose source language")),
            button_style_class: "mt-source-language-button",
            add_default_style_class: true,
            info_bar: this.transDialog.info_bar,
            callback: () => {
                this.closeAllMenus();
                this._sourceLanguageChooser.open();
                this._sourceLanguageChooser.set_languages(
                    this.providersManager.current.getLanguages()
                );
                this._sourceLanguageChooser.show_languages(
                    this._current_source_lang
                );
            }
        });
        this.transDialog.source_topbar.add_button(this._source_lang_button);
    },

    _populateActionBar: function() {
        /* NOTE: Do not add more buttons directly into the action bar.
         * If I need more buttons for directly accessing features,
         * add them inside the preferences menu. This is to avoid the
         * action bar to grow beyond the dialog size.
         */
        this._translators_button = this._getTransProvidersDialogPopup();
        this.transDialog.action_bar_1.add_button(this._translators_button);

        this.transDialog.action_bar_1.add_button(new UI.ButtonsBarButton({
            icon_name: C.Icons.swap,
            tooltip: G.escapeHTML(_("Swap languages")) +
                " (<b>%s + S</b>)".format(G.escapeHTML(_("Ctrl"))),
            button_style_class: "mt-swap-languages-button",
            info_bar: this.transDialog.info_bar,
            callback: () => this._swapLanguages()
        }));

        this.transDialog.action_bar_1.add_button(new UI.ButtonsBarButton({
            icon_name: C.Icons.translate,
            tooltip: G.escapeHTML(_("Translate text")) +
                " (<b>%s + %s</b>)".format(G.escapeHTML(_("Ctrl")), G.escapeHTML(_("Enter"))),
            button_style_class: "mt-translate-button",
            info_bar: this.transDialog.info_bar,
            callback: (aActor, aEvent) => this._translate(aActor, aEvent)
        }));

        this.transDialog.action_bar_2.add_button(this._getPreferencesMenuDialogPopup());

        this.transDialog.action_bar_2.add_button(new UI.ButtonsBarButton({
            icon_name: C.Icons.help,
            tooltip: G.escapeHTML(_("Quick help")) +
                " (<b>F1</b>)",
            button_style_class: "mt-quick-help-button",
            info_bar: this.transDialog.info_bar,
            callback: () => this._showHelpDialog()
        }));

        this.transDialog.action_bar_2.add_button(new UI.ButtonsBarButton({
            icon_name: C.Icons.shutdown,
            tooltip: G.escapeHTML(_("Quit")) +
                " (<b>%s</b>)".format(G.escapeHTML(_("Escape"))),
            button_style_class: "mt-quit-button",
            info_bar: this.transDialog.info_bar,
            callback: () => this.transDialog.close()
        }));
    },

    _populateTargetTopbar: function() {
        this._target_lang_button = new UI.ButtonsBarButton({
            label: this.providersManager.current.getLanguageName(
                this._current_target_lang || ""
            ) || "?",
            tooltip: G.escapeHTML(_("Choose target language")),
            button_style_class: "mt-target-language-button",
            add_default_style_class: true,
            info_bar: this.transDialog.info_bar,
            callback: () => {
                this.closeAllMenus();
                this._targetLanguageChooser.open();
                this._targetLanguageChooser.set_languages(
                    this.providersManager.current.getPairs(this._current_source_lang)
                );
                this._targetLanguageChooser.show_languages(
                    this._current_target_lang
                );
            }
        });
        this.transDialog.target_topbar.add_button(this._target_lang_button);
    },

    _html2text: function(aHTML, aCallback) {
        if (G.isBlank(String(aHTML))) {
            this.transDialog.info_bar.add_message({
                message: G.escapeHTML(_("Nothing to translate")),
                timeout: 2000
            });

            return;
        }

        OutputReader.spawn(
            null, [
                XletMeta.path + "/extensionHelper.py",
                /* NOTE: Without explicitly using String the aHTML argument isn't
                 * recognized as a string or as a single argument. ¬¬
                 */
                "--strip-markup=" + String(aHTML)
            ],
            null,
            GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
            null,
            (aTextCleaned) => {
                aCallback(String(aTextCleaned).trim());
            }
        );
    },

    _translate: function(aActor, aEvent) {
        /* NOTE: The existence of HTML markup on the source text was an absolute
         * nightmare to deal with. In some circumstances the markup had to be escaped,
         * in some others it didn't. Some translators could handle the markup, some
         * others just broke it. And all this made difficult to use that markup in
         * the history window.
         * So, I decided to KISS it.
         * - Completely eradicate markup from the source text.
         * - The destination text can have markup to be rendered by the destination entry.
         * - All text is safely cleaned in the history window and always used as text.
         * - All problems solved. LOL
         *
         * I'm using a Python script that uses only the standard library to parse and clean HTML.
         * I'm not willing to write a million lines of JavaScript code nor to depend on
         * Node and use a Node module with a trillion lines of code just to parse HTML.
         */
        this._html2text(this.transDialog.source_entry.text, (aSourceCleaned) => {
            if (G.isBlank(aSourceCleaned)) {
                this.transDialog.info_bar.add_message({
                    message: G.escapeHTML(_("Nothing to translate")),
                    timeout: 2000
                });

                return;
            }

            this.forceTranslation = false;

            if (aEvent) {
                /* NOTE: Keep this try{}catch{} block.
                 */
                try {
                    // The event used by this block is passed by mouse clicks and key press events.
                    let state = aEvent.get_state();
                    let shift_mask =
                        // For key press
                        (state === Clutter.ModifierType.SHIFT_MASK || state === C.MagicKeys.CYRILLIC_SHIFT) ||
                        // For mouse button press
                        (Clutter.ModifierType.SHIFT_MASK & global.get_pointer()[2]) !== 0;

                    this.forceTranslation = shift_mask;
                } catch (aErr) {
                    if (Settings.pref_logging_level !== D.LoggingLevel.NORMAL) {
                        global.logError(aErr);
                    }

                    this.forceTranslation = false;
                }
            }

            if (Settings.pref_history_enabled) {
                let historyEntry = (this.transHistory.hasOwnProperty(this._current_target_lang) &&
                        this.transHistory[this._current_target_lang].hasOwnProperty(aSourceCleaned)) ?
                    this.transHistory[this._current_target_lang][aSourceCleaned] :
                    false;

                if (this.forceTranslation) {
                    historyEntry = false;
                }

                if (historyEntry && this._current_target_lang === historyEntry["tL"]) {
                    this._displayHistory(aSourceCleaned);
                    return;
                }
            }

            this._updateStats();
            this.transDialog.target_entry.text = "";
            this.transDialog.spinner.start();

            this.providersManager.current.translate(
                this._current_source_lang,
                this._current_target_lang,
                aSourceCleaned,
                (aResponse) => {
                    this.transDialog.spinner.stop();

                    let message;

                    if (typeof aResponse === "string") {
                        message = aResponse;
                    } else {
                        message = aResponse.message;
                    }

                    /* NOTE: Keep this try{}catch{} block.
                     */
                    try {
                        this.transDialog.target_entry.markup = "%s".format(message);

                        // Do not save history if the source text is equal to the
                        // translated text.
                        if (Settings.pref_history_enabled &&
                            aSourceCleaned !== this.transDialog.target_entry.text) {
                            this.setTransHistory(
                                aSourceCleaned, {
                                    d: new Date().getTime() / 1000,
                                    sL: (this._current_source_lang === "auto" ?
                                        this._getDetectedLang(aResponse) :
                                        this._current_source_lang),
                                    tL: this._current_target_lang,
                                    tT: message
                                }
                            );
                        }
                    } catch (aErr) {
                        global.logError(aErr);
                        this.transDialog.target_entry.text = String(aErr);
                    }
                }
            );
        });

        return false;
    },

    _translateSelection: function() {
        $.getSelection((aSelection) => {
            if (G.isBlank(aSelection)) {
                this.transDialog.info_bar.add_message({
                    message: G.escapeHTML(_("Selection is empty or xsel was not able to grab it")),
                    type: C.StatusbarMessageType.ERROR
                });
            }

            this.transDialog.source_entry.text = aSelection;
            this.open();
            /* NOTE: Using Mainloop.idle_add to avoid jerky animations.
             */
            Mainloop.idle_add(() => {
                this._translate();

                return GLib.SOURCE_REMOVE;
            });
        });
    },

    _translateFromClipboard: function() {
        let clipboard = St.Clipboard.get_default();
        let clipCallback = (aClipboard, aText) => {
            if (G.isBlank(aText)) {
                this.transDialog.info_bar.add_message({
                    message: G.escapeHTML(_("Clipboard is empty")),
                    type: C.StatusbarMessageType.ERROR
                });
            }

            this.transDialog.source_entry.text = aText;
            this.open();
            /* NOTE: Using Mainloop.idle_add to avoid jerky animations.
             */
            Mainloop.idle_add(() => {
                this._translate();

                return GLib.SOURCE_REMOVE;
            });
        };

        if (St.ClipboardType) {
            clipboard.get_text(St.ClipboardType.CLIPBOARD, clipCallback);
        } else {
            clipboard.get_text(clipCallback);
        }
    },

    _getDetectedLang: function(aResult) {
        /* NOTE: aResult might be a string or an object. In any case, always fall back
         * to the current source language, since the detected language is only used by
         * the translation history.
         */
        try {
            switch (this.providersManager.current.name) {
                case "Google.Translate":
                    return aResult.detectedLang;
                case "Google.TranslateTS":
                    let lines = aResult.split("\n");
                    let i = 0,
                        iLen = lines.length;
                    for (; i < iLen; i++) {
                        if (/^\[/.test(lines[i]) && /\]$/.test(lines[i])) {
                            let str = (lines[i].replace(/<[^>]*>/g, "")).split("->")[0];
                            str = str.slice(1, str.length).trim();
                            return $.getKeyByValue(C.Languages, C.Endonyms[str]) ||
                                this._current_source_lang;
                        } else {
                            continue;
                        }
                    }

                    return this._current_source_lang;
                case "Yandex.Translate":
                    return aResult.detected ? aResult.detected.lang : this._current_source_lang;
                default:
                    return this._current_source_lang;
            }
        } catch (aErr) {
            return this._current_source_lang;
        }
    },

    closeAllMenus: function(aIgnore) {
        aIgnore === "translators" || this.transProvidersButtonPopup &&
            this.transProvidersButtonPopup.isOpen &&
            this.transProvidersButtonPopup.close();
        aIgnore === "main" || this.preferencesMenuButtonPopup &&
            this.preferencesMenuButtonPopup.isOpen &&
            this.preferencesMenuButtonPopup.close();
    },

    open: function() {
        this._setCurrentTranslator((Settings.pref_remember_last_translator &&
                this.providersManager.last_used) ?
            this.providersManager.last_used.name :
            this.providersManager.default.name);
        this.transDialog.source_entry.max_length = this.providersManager.current.char_limit;

        if (this.transDialog.state === C.DialogState.CLOSED ||
            this.transDialog.state === C.DialogState.CLOSING) {
            this.transDialog.open();
        }

        this.transDialog.source_entry.clutter_text.set_selection(
            Settings.pref_keep_source_entry_text_selected ? 0 : -1,
            this.transDialog.source_entry.length
        );
        this.transDialog.source_entry.clutter_text.grab_key_focus();
        this._setCurrentLanguages();
        this._showMostUsed();
    },

    _loadTheme: function(aFullReload = false) {
        this._removeTimeouts("load_theme");

        try {
            this.unloadStylesheet();
        } catch (aErr) {
            global.logError(aErr);
        } finally {
            this._timeout_ids.load_theme = Mainloop.timeout_add(1000,
                () => {
                    try {
                        /* NOTE: Without calling Main.themeManager._changeTheme() this xlet stylesheet
                         * doesn't reload correctly. ¬¬
                         */
                        if (aFullReload) {
                            Main.themeManager._changeTheme();
                        }

                        this.loadStylesheet();
                    } catch (aErr) {
                        global.logError(aErr);
                    }

                    this._timeout_ids.load_theme = 0;
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
            } finally {
                this.theme = null;
                this.stylesheet = null;
            }
        }
    },

    _getCssPath: function() {
        let defaultThemepath = XletMeta.path + "/themes/default.css";
        let cssPath = Settings.pref_dialog_theme === "custom" ?
            Settings.pref_dialog_theme_custom :
            defaultThemepath;

        if (/^file:\/\//.test(cssPath)) {
            cssPath = cssPath.substr(7);
        }

        try {
            let cssFile = Gio.file_new_for_path(cssPath);

            if (!cssPath || !cssFile.query_exists(null)) {
                global.logError("CSS theme file not found. Loading default...");
                cssPath = defaultThemepath;
            }
        } catch (aErr) {
            global.logError("Error loading CSS theme file. Loading default...");
            cssPath = defaultThemepath;
            global.logError(aErr);
        }

        return cssPath;
    },

    _ensureHistoryFileExists: function() {
        if (!Settings.pref_history_enabled) {
            return;
        }

        let configPath = [GLib.get_home_dir(), ".cinnamon", "configs", "{{UUID}}-History"].join("/");
        let configDir = Gio.file_new_for_path(configPath);

        if (!configDir.query_exists(null)) {
            configDir.make_directory_with_parents(null);
        }

        this.historyFile = configDir.get_child("translation_history.json");

        if (this.historyFile.query_exists(null)) {
            this.historyFile.load_contents_async(null, (aFile, aResponce) => {
                let success,
                    contents,
                    tag;

                try {
                    [success, contents, tag] = aFile.load_contents_finish(aResponce);
                } catch (aErr) {
                    global.logError(aErr);
                    return;
                }

                if (!success) {
                    global.logError("Error parsing %s".format(this.historyFile.get_path()));
                    return;
                }

                try {
                    this._translation_history = JSON.parse(contents);

                    if (this._translation_history["__version__"] !== C.HISTORY_FILE_VERSION) {
                        $.Notification.notify([
                                G.escapeHTML(_("The translation history requires sanitation.")),
                                G.escapeHTML(_("The sanitation can be performed from the translation history window.")),
                                G.escapeHTML(_("Check this extension help file for more details."))
                            ],
                            DesktopNotificationsUtils.NotificationUrgency.CRITICAL
                        );
                    }
                } catch (aErr) {
                    this._translation_history = null;
                    global.logError(aErr);
                    $.Notification.notify([
                            G.escapeHTML(_("Something might have gone wrong parsing the translation history.")),
                            G.escapeHTML(String(aErr))
                        ],
                        DesktopNotificationsUtils.NotificationUrgency.CRITICAL
                    );
                }
            });
        } else {
            this._translation_history = {
                __version__: C.HISTORY_FILE_VERSION
            };
            this.saveHistoryToFile();
        }
    },

    saveHistoryToFile: function() {
        if (!Settings.pref_history_enabled) {
            return;
        }

        let rawData;

        if (Settings.pref_loggin_save_history_indented) {
            rawData = JSON.stringify(this._translation_history, null, "    ");
        } else {
            rawData = JSON.stringify(this._translation_history);
        }

        let raw = this.historyFile.replace(null, false, Gio.FileCreateFlags.NONE, null);
        let out_file = Gio.BufferedOutputStream.new_sized(raw, 4096);
        Cinnamon.write_string_to_stream(out_file, rawData);
        out_file.close(null);
    },

    _displayHistory: function(aSourceText) {
        if (!Settings.pref_history_enabled) {
            return;
        }

        let historyEntry = this.transHistory[this._current_target_lang][aSourceText];

        if (Settings.pref_logging_level !== D.LoggingLevel.NORMAL) {
            global.log("\n_displayHistory()>historyEntry:\n" + JSON.stringify(historyEntry));
        }

        try {
            this.transDialog.target_entry.markup = "%s".format("[" + G.escapeHTML(_("History")) + "]\n" + historyEntry["tT"]);
        } catch (aErr) {
            global.logError(aErr);
            this.transDialog.target_entry.text = "[" + _("History") + "]\n" + historyEntry["tT"];
        }
    },

    _checkTranslatorPrefsVersion: function() {
        if (Number(Settings.pref_translators_prefs_defaults_control) !== C.DEFAULT_ENGINES_CONTROL) {
            let currentDefaults = JSON.parse(JSON.stringify(Settings.pref_translators_prefs_defaults));
            let newEngines = [];
            let defaultsNeedUpdate = false;

            // Find engines that need to be added and store them.
            let n = C.DEFAULT_ENGINES.length;
            while (n--) {
                let id = C.DEFAULT_ENGINES[n]["provider_name"];
                let eng = $.getEngineByName(id, currentDefaults);

                if (eng === null) {
                    newEngines.push($.getEngineByName(id, C.DEFAULT_ENGINES));
                    defaultsNeedUpdate = true;
                }
            }

            // Find engines that doesn't exist anymore and remove them.
            let o = currentDefaults.length;
            while (o--) {
                let id = currentDefaults[o]["provider_name"];
                let eng = $.getEngineByName(id, C.DEFAULT_ENGINES);

                if (eng === null) {
                    currentDefaults.splice(o, 1);
                    defaultsNeedUpdate = true;
                }
            }

            if (defaultsNeedUpdate) {
                currentDefaults = (currentDefaults.concat(newEngines)).sort((a, b) => {
                    return a.provider_name.localeCompare(b.provider_name);
                });
                Settings.pref_translators_prefs_defaults = currentDefaults;
            }

            Settings.pref_translators_prefs_defaults_control = C.DEFAULT_ENGINES_CONTROL;
        }
    },

    get transHistory() {
        return this._translation_history;
    },

    setTransHistory: function(aSourceText, aTransObj) {
        if (!Settings.pref_history_enabled) {
            return;
        }

        if (!this._translation_history.hasOwnProperty(aTransObj.tL)) {
            this._translation_history[aTransObj.tL] = {};
        }

        this._translation_history[aTransObj.tL][aSourceText] = aTransObj;
        this.saveHistoryToFile();
    },

    get current_target_lang() {
        return this._current_target_lang;
    },

    get current_source_lang() {
        return this._current_source_lang;
    },

    _removeKeybindings: function() {
        let i = this.registeredKeybindings.length;
        while (i--) {
            Main.keybindingManager.removeHotKey(this.registeredKeybindings[i]);
        }

        delete this.registeredKeybindings;
        this.registeredKeybindings = [];
    },

    _registerKeybindings: function() {
        this._removeKeybindings();

        let registerKb = (aKbProp) => {
            let kbName = XletMeta.uuid + "-" + aKbProp;
            Main.keybindingManager.addHotKey(
                kbName,
                Settings[aKbProp],
                () => {
                    switch (aKbProp) {
                        case "pref_open_translator_dialog_keybinding":
                            if (this.transDialog.state === C.DialogState.OPENED ||
                                this.transDialog.state === C.DialogState.OPENING) {
                                this.transDialog.close();
                            } else {
                                this.open();
                            }
                            break;
                        case "pref_translate_from_clipboard_keybinding":
                            this._translateFromClipboard();
                            break;
                        case "pref_translate_from_selection_keybinding":
                            this._translateSelection();
                            break;
                    }
                }
            );

            this.registeredKeybindings.push(kbName);
        };

        let i = this._keybindings.length;
        while (i--) {
            if (Settings[this._keybindings[i]]) {
                registerKb(this._keybindings[i]);
            }
        }

        this.helpDialog.updateDynamicLabels();
    },

    openDateFormatSyntaxInfo: function() {
        G.xdgOpen("https://docs.python.org/3/library/time.html#time.strftime");
    },

    openHelpPage: function() {
        this.transDialog.close();
        G.xdgOpen(XletMeta.path + "/HELP.html");
    },

    openExtensionSettings: function() {
        this.transDialog.close();
        Util.spawn_async([XletMeta.path + "/settings.py"], null);
    },

    _generateSettingsDesktopFile: function() {
        if (G.versionCompare(G.CINNAMON_VERSION, "3.6.0") < 0 &&
            !Settings.pref_desktop_file_generated) {
            CustomFileUtils.generateDesktopFile({
                fileName: this._settingsDesktopFileName,
                dataName: _(XletMeta.name),
                dataComment: _("Settings for %s").format(_(XletMeta.name)),
                dataExec: XletMeta.path + "/settings.py",
                dataIcon: XletMeta.path + "/icon.svg"
            });

            $.Notification.notify([
                G.escapeHTML(_("A shortcut to open this extension settings has been generated.")),
                G.escapeHTML(_("Search for it on your applications menu.")),
                G.escapeHTML(_("Read this extension help page for more details."))
            ]);

            Settings.pref_desktop_file_generated = true;
        }
    },

    _removeSettingsDesktopFile: function() {
        try {
            let desktopFile = Gio.file_new_for_path(this._settingsDesktopFilePath);

            if (desktopFile.query_exists(null)) {
                desktopFile.delete_async(GLib.PRIORITY_LOW, null, null);
            }
        } catch (aErr) {
            global.logError(aErr);
        }
    }
};

function init(aXletMeta) {
    XletMeta = aXletMeta;

    /* NOTE: I have to initialize the modules and all its exported variables
     * at this stage because the stupid asynchronicity of newer versions of Cinnamon.
     * Since I'm using Cinnamon's native settings system declared and instantiated
     * in the constants.js module (so I can use it globally from all modules and without
     * the need to pass the settings object through a trillion other objects),
     * attempting to initialize the settings outside init() fails because the stupid
     * extension isn't loaded yet. ¬¬
     */

    // Mark for deletion on EOL. Cinnamon 3.6.x+
    if (typeof require === "function") {
        G = require("./globalUtils.js");
        D = require("./debugManager.js");
        C = require("./constants.js");
        UI = require("./ui.js");
        SpawnUtils = require("./spawnUtils.js");
        CustomFileUtils = require("./customFileUtils.js");
        $ = require("./utils.js");
        DesktopNotificationsUtils = require("./desktopNotificationsUtils.js");
    } else {
        G = imports.ui.extensionSystem.extensions["{{UUID}}"].globalUtils;
        D = imports.ui.extensionSystem.extensions["{{UUID}}"].debugManager;
        C = imports.ui.extensionSystem.extensions["{{UUID}}"].constants;
        UI = imports.ui.extensionSystem.extensions["{{UUID}}"].ui;
        SpawnUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].spawnUtils;
        CustomFileUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].customFileUtils;
        $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
        DesktopNotificationsUtils = imports.ui.extensionSystem.extensions["{{UUID}}"].desktopNotificationsUtils;
    }

    _ = G._;
    Settings = C.Settings;
    OutputReader = new SpawnUtils.SpawnReader();
}

function enable() {
    D.wrapObjectMethods(Settings, {
        MultiTranslator: MultiTranslator
    });

    try {
        translator = new MultiTranslator();
        /* NOTE: Do not return anything inside Mainloop.idle_add()!!!
         * INFINITE LOOP ASSURED, DUMB ARSE!!! LOL
         */
        Mainloop.idle_add(() => {
            translator.enable();

            return GLib.SOURCE_REMOVE;
        });

        /* NOTE: Object needed to be able to trigger callbacks when pressing
         * buttons in the settings window. Cinnamon 3.0.x, we are screwed.
         */
        return {
            openSettings: translator.openExtensionSettings
        };
    } catch (aErr) {
        global.logError(aErr);
    }

    return null;
}

function disable() {
    if (translator !== null) {
        translator.disable();
        translator = null;
    }
}
