let $,
    _,
    C,
    D,
    NotificationsUtils,
    E,
    F,
    G,
    OutputReader,
    Settings,
    SpawnReader,
    UI,
    XletMeta,
    translator = null;

const {
    gi: {
        Clutter,
        Gio,
        GLib,
        St
    },
    mainloop: Mainloop,
    misc: {
        util: Util
    },
    ui: {
        main: Main
    }
} = imports;

function getExtensionClass(aBaseExtension) {
    class MultiTranslator extends aBaseExtension {
        constructor() {
            super({
                metadata: XletMeta,
                init_signal_manager: true,
                init_schedule_manager: true,
                init_keybinding_manager: true,
                settings: Settings,
                notification: $.Notification,
                pref_keys: C.EXTENSION_PREFS
            });

            this._keybindings = [
                "open_translator_dialog_keybinding",
                "translate_from_clipboard_keybinding",
                "translate_from_selection_keybinding"
            ];

            this.transDialog = new UI.TranslatorDialog(this);
            this.helpDialog = new UI.HelpDialog();

            this.transProvidersButton = null;
            this.transProvidersButtonPopup = null;
            this.preferencesMenuButton = null;
            this.preferencesMenuButtonPopup = null;
            this.providersManager = null;
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
        }

        enable() {
            this._checkTranslatorPrefsVersion();
            this._registerKeybindings();
            this._initProvidersManager();
            this._loadTheme();

            // NOTE: The next interval is due to the ProvidersManager class loading modules asynchronously.
            Mainloop.timeout_add(3000, () => {
                // If the ProvidersManager hasn't finished loading all translator providers,
                // keep looping this function.
                if (!this.providersManager.translatorsSet) {
                    return GLib.SOURCE_CONTINUE;
                }

                this._initLanguagesChooser();
                this._populateSourceTopbar();
                this._populateActionBar();
                this._populateTargetTopbar();
                this._setCurrentLanguages();
                this._initMostUsed();

                return GLib.SOURCE_REMOVE;
            });

            if (Settings.history_enabled) {
                this._ensureHistoryFileExists();
            }

            if (!Settings.informed_about_dependencies) {
                $.checkDependencies();
            }

            super.enable();
        }

        disable() {
            this.transDialog.close();
            this.unloadStylesheet();
            this.helpDialog.destroy();
            this._sourceLanguageChooser.destroy();
            this._targetLanguageChooser.destroy();
            this.transDialog.destroy();

            super.disable();
        }

        __connectSignals() {
            this.transDialog.dialog_layout.connect("key-press-event",
                (aActor, aEvent) => this._on_key_press_event(aActor, aEvent));

            this.transDialog.source_entry.connect("activate",
                (aActor, aEvent) => this._translate(aActor, aEvent));

            this.$.signal_manager.connect(
                Main.themeManager,
                "theme-set",
                this._loadTheme.bind(this, false)
            );
            Settings.connect(C.EXTENSION_PREFS, function(aPrefKey) {
                this.__onSettingsChanged(aPrefKey);
            }.bind(this));
        }

        _reapplyDefaults() {
            // const defaults = JSON.parse(JSON.stringify(Settings.translators_prefs_defaults));
            const transPrefs = JSON.parse(JSON.stringify(Settings.translators_prefs));

            for (const defaultEngine of JSON.parse(JSON.stringify(Settings.translators_prefs_defaults))) {
                if (transPrefs.hasOwnProperty(defaultEngine["provider_name"])) {
                    const existentEngine = transPrefs[defaultEngine["provider_name"]];
                    existentEngine["default_source"] = defaultEngine["default_source"];
                    existentEngine["default_target"] = defaultEngine["default_target"];
                    existentEngine["remember_last_lang"] = defaultEngine["remember_last_lang"];
                    transPrefs[defaultEngine["provider_name"]] = existentEngine;
                }
            }

            Settings.translators_prefs = transPrefs;
        }

        _ensureLangsStats() {
            if (!this.langsStats) {
                this.langsStats = new $.LanguagesStats();
            }
        }

        _initMostUsed() {
            if (!Settings.show_most_used) {
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
                    Settings.auto_translate_when_switching_language && this._translate();
                }
            );
            this.transDialog.most_used.targets.connect(
                "clicked",
                (aActor, aData) => {
                    this.transDialog.most_used.targets.select(aData.lang_code);
                    this._setCurrentTarget(aData.lang_code);
                    this._current_langs_changed();
                    Settings.auto_translate_when_switching_language && this._translate();
                }
            );
        }

        _showMostUsed() {
            if (!Settings.show_most_used) {
                return;
            }

            this._ensureLangsStats();

            const most_used_sources = this.langsStats.getNMostUsed(
                this.providersManager.current.name,
                C.STATS_TYPE_SOURCE,
                5
            );
            this.transDialog.most_used.sources.set_languages(most_used_sources);

            const most_used_targets = this.langsStats.getNMostUsed(
                this.providersManager.current.name,
                C.STATS_TYPE_TARGET,
                5
            );
            this.transDialog.most_used.targets.set_languages(most_used_targets);

            this._mostUsedBarSelectCurrent();
        }

        _mostUsedBarSelectCurrent() {
            if (!Settings.show_most_used) {
                return;
            }

            this.transDialog.most_used.sources.select(this._current_source_lang);
            this.transDialog.most_used.targets.select(this._current_target_lang);
        }

        _on_key_press_event(aActor, aEvent) {
            const state = aEvent.get_state();
            const symbol = aEvent.get_key_symbol();
            const code = aEvent.get_key_code();
            const control = state === Clutter.ModifierType.CONTROL_MASK ||
                state === C.MagicKeys.CYRILLIC_CONTROL;
            const controlShift = state === Clutter.ModifierType.SHIFT_MASK + Clutter.ModifierType.CONTROL_MASK ||
                state === C.MagicKeys.CYRILLIC_SHIFT + C.MagicKeys.CYRILLIC_CONTROL;

            if (symbol === Clutter.KEY_Escape) {
                this.transDialog.close();
            } else if (controlShift && code === Clutter.KEY_6) { // Ctrl + Shift + C - Copy translated text to clipboard.
                const text = this.transDialog.target_entry.text;

                if (G.isBlank(text)) {
                    this.transDialog.info_bar.add_message({
                        message: G.escapeHTML(_("There is nothing to copy")),
                        type: C.StatusbarMessageType.ERROR
                    });
                } else {
                    G.copyToClipboard(text);

                    this.transDialog.info_bar.add_message({
                        message: G.escapeHTML(_("Translated text copied to clipboard"))
                    });
                }
            } else if (control && code === Clutter.KEY_exclam) { // Ctrl + M - Open main menu.
                this.transProvidersButton.params.callback();
            } else if (control && code === Clutter.KEY_colon) { // Ctrl + M - Open main menu.
                this.preferencesMenuButton.params.callback();
            } else if (control && code === Clutter.KEY_apostrophe) { // Ctrl + S - Swap languages.
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
                if ($.Debugger.logging_level !== D.LoggingLevel.NORMAL) {
                    global.log(JSON.stringify({
                        state: state,
                        symbol: symbol,
                        code: code
                    }, null, "\t"));
                }
            }
        }

        _setCurrentTranslator(aName, aSaveLastUsedToPrefFile = false) {
            this.providersManager.current = aName;
            this.transDialog.source_entry.max_length = this.providersManager.current.char_limit;
            this._setCurrentLanguages(aSaveLastUsedToPrefFile);
            this._showMostUsed();
            this._updateProviderButton(aName);

            this.transDialog.source_entry.grab_key_focus();
        }

        _updateProviderButton(aName) {
            const requiresTransShell = /TS$/.test(aName);
            this.transDialog.provider_button.label = _("Service provided by %s")
                .format(C.ProviderData.display_name[aName] +
                    (requiresTransShell ? " (*)" : ""));
        }

        _setCurrentSource(aLangCode, aSaveLastUsedToPrefFile = true) {
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
        }

        _setCurrentTarget(aLangCode, aSaveLastUsedToPrefFile = true) {
            this._current_target_lang = aLangCode;

            /* NOTE: Same as source language.
             */
            if (aSaveLastUsedToPrefFile) {
                this.providersManager.current.prefs = {
                    key: "last_target",
                    val: aLangCode
                };
            }
        }

        _setCurrentLanguages(aSaveLastUsedToPrefFile = false) {
            const current_translator = this.providersManager.current;
            const current_source = (current_translator.prefs.remember_last_lang &&
                    current_translator.prefs.hasOwnProperty("last_source") &&
                    current_translator.prefs.last_source) ?
                current_translator.prefs.last_source :
                current_translator.prefs.default_source;
            const current_target = (current_translator.prefs.remember_last_lang &&
                    current_translator.prefs.hasOwnProperty("last_target") &&
                    current_translator.prefs.last_target) ?
                current_translator.prefs.last_target :
                current_translator.prefs.default_target;

            this._setCurrentSource(current_source, aSaveLastUsedToPrefFile);
            this._setCurrentTarget(current_target, aSaveLastUsedToPrefFile);
            this._current_langs_changed();
        }

        _swapLanguages() {
            const source = this._current_source_lang;
            const target = this._current_target_lang;

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
            Settings.auto_translate_when_switching_language && this._translate();
        }

        _resetLanguages() {
            const current = this.providersManager.current;
            this._setCurrentSource(current.prefs.default_source);
            this._setCurrentTarget(current.prefs.default_target);
            this._current_langs_changed();
            this._mostUsedBarSelectCurrent();
        }

        _updateStats() {
            if (!Settings.show_most_used) {
                return;
            }

            this._ensureLangsStats();

            const source_data = {
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
            const target_data = {
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
        }

        _showHelpDialog() {
            this.closeAllMenus();

            if (this.helpDialog.state === C.DialogState.OPENED ||
                this.helpDialog.state === C.DialogState.OPENING) {
                this.helpDialog.close();
            } else {
                this.helpDialog.open();
            }
        }

        _openTranslationHistory() {
            if (!Settings.history_enabled) {
                return;
            }

            let timestampFormat;

            switch (Settings.history_timestamp) {
                case "custom":
                    timestampFormat = Settings.history_timestamp_custom; // Custom
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
                `${XletMeta.path}/translatorHistory.py`,
                "--gui",
                `--word-wrap=${String(Settings.history_width_to_trigger_word_wrap)}`,
                `--timestamp-format=${timestampFormat}`
            ], null);
        }

        _on_source_language_chosen(aActor, aLang) {
            this._mostUsedBarSelectCurrent();
            this._setCurrentSource(aLang.code);
            this._current_langs_changed();
            this._sourceLanguageChooser.close();
            Settings.auto_translate_when_switching_language && this._translate();
        }

        _on_target_language_chosen(aActor, aLang) {
            this._mostUsedBarSelectCurrent();
            this._setCurrentTarget(aLang.code);
            this._current_langs_changed();
            this._targetLanguageChooser.close();
            Settings.auto_translate_when_switching_language && this._translate();
        }

        _current_langs_changed() {
            this._source_lang_button.label = this.providersManager.current.getLanguageName(
                this._current_source_lang
            );
            this._target_lang_button.label = this.providersManager.current.getLanguageName(
                this._current_target_lang
            );
        }

        _getPreferencesMenuDialogPopup() {
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
                                () => this.__openXletSettings(),
                                C.Icons.preferences
                            ]
                        ];

                        if (Settings.history_enabled) {
                            items.push([
                                _("Translation history"),
                                () => this._openTranslationHistory(),
                                C.Icons.history
                            ]);
                        }

                        items = [...items,
                            ["separator"],
                            [_("Check dependencies"),
                                () => {
                                    this.transDialog.close();
                                    $.checkDependencies();
                                },
                                C.Icons.find
                            ],
                            [_("Extended help"),
                                () => this.__openHelpPage(),
                                C.Icons.help
                            ]
                        ];

                        for (const item of items) {
                            this.preferencesMenuButtonPopup.add_item({
                                label: item[0],
                                callback: item[1],
                                icon_name: item[2]
                            });
                        }

                        this.preferencesMenuButtonPopup.open();
                    }
                }
            });

            return this.preferencesMenuButton;
        }

        _getTransProvidersDialogPopup() {
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

                            const names = this.providersManager.translators_names.sort((a, b) => {
                                return a.localeCompare(b);
                            });

                            const setCurrentTrans = (name) => {
                                return () => {
                                    this._setCurrentTranslator(name, true);
                                };
                            };

                            for (const name of names) {
                                if (name === this.providersManager.current.name) {
                                    break;
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
        }

        _initProvidersManager() {
            this.providersManager = new $.ProvidersManager(this);
            // NOTE: Commented out because now the _translators property of the ProvidersManager class
            // is set asynchronously.
            // this.transDialog.source_entry.max_length = this.providersManager.current.char_limit;
        }

        _initLanguagesChooser() {
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
        }

        _populateSourceTopbar() {
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
        }

        _populateActionBar() {
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
        }

        _populateTargetTopbar() {
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
        }

        _html2text(aHTML, aCallback) {
            if (G.isBlank(String(aHTML))) {
                this.transDialog.info_bar.add_message({
                    message: G.escapeHTML(_("Nothing to translate")),
                    timeout: 2000
                });

                return;
            }

            OutputReader.spawn(
                null, [
                    `${XletMeta.path}/extensionHelper.py`,
                    /* NOTE: Without explicitly using String the aHTML argument isn't
                     * recognized as a string or as a single argument. ¬¬
                     */
                    `--strip-markup=${String(aHTML)}`
                ],
                null,
                (aTextCleaned) => {
                    aCallback(aTextCleaned.trim());
                }
            );
        }

        _translate(aActor, aEvent) {
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
                        const state = aEvent.get_state();
                        const shift_mask =
                            // For key press
                            (state === Clutter.ModifierType.SHIFT_MASK || state === C.MagicKeys.CYRILLIC_SHIFT) ||
                            // For mouse button press
                            (Clutter.ModifierType.SHIFT_MASK & global.get_pointer()[2]) !== 0;

                        this.forceTranslation = shift_mask;
                    } catch (aErr) {
                        if ($.Debugger.logging_level !== D.LoggingLevel.NORMAL) {
                            global.logError(aErr);
                        }

                        this.forceTranslation = false;
                    }
                }

                if (Settings.history_enabled) {
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
                            if (Settings.history_enabled &&
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
        }

        _translateSelection() {
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
        }

        _translateFromClipboard() {
            const clipboard = St.Clipboard.get_default();
            const clipCallback = (aClipboard, aText) => {
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
        }

        _getDetectedLang(aResult) {
            /* NOTE: aResult might be a string or an object. In any case, always fall back
             * to the current source language, since the detected language is only used by
             * the translation history.
             */
            try {
                switch (this.providersManager.current.name) {
                    case "Google.Translate":
                        return aResult.detectedLang;
                    case "Google.TranslateTS":
                        const lines = aResult.split("\n");
                        for (const line of lines) {
                            if (/^\[/.test(line) && /\]$/.test(line)) {
                                let str = (line.replace(/<[^>]*>/g, "")).split("->")[0];
                                str = str.slice(1, str.length).trim();
                                return $.getKeyByValue(C.Languages, C.Endonyms[str]) ||
                                    this._current_source_lang;
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
        }

        closeAllMenus(aIgnore) {
            aIgnore === "translators" || this.transProvidersButtonPopup &&
                this.transProvidersButtonPopup.isOpen &&
                this.transProvidersButtonPopup.close();
            aIgnore === "main" || this.preferencesMenuButtonPopup &&
                this.preferencesMenuButtonPopup.isOpen &&
                this.preferencesMenuButtonPopup.close();
        }

        open() {
            this._setCurrentTranslator((Settings.remember_last_translator &&
                    this.providersManager.last_used) ?
                this.providersManager.last_used.name :
                this.providersManager.default.name);
            this.transDialog.source_entry.max_length = this.providersManager.current.char_limit;

            if (this.transDialog.state === C.DialogState.CLOSED ||
                this.transDialog.state === C.DialogState.CLOSING) {
                this.transDialog.open();
            }

            this.transDialog.source_entry.clutter_text.set_selection(
                Settings.keep_source_entry_text_selected ? 0 : -1,
                this.transDialog.source_entry.length
            );
            this.transDialog.source_entry.clutter_text.grab_key_focus();
            this._setCurrentLanguages();
            this._showMostUsed();
        }

        _loadTheme(aFullReload = false) {
            this.$.schedule_manager.clearSchedule("load_theme");

            G.tryFn(() => {
                this.unloadStylesheet();
            }, (aErr) => {
                global.logError(aErr);
            }, () => {
                this.$.schedule_manager.setTimeout("load_theme", () => {
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
                }, 1000);
            });
        }

        loadStylesheet() {
            const themePath = this._getCssPath();

            try {
                const themeContext = St.ThemeContext.get_for_stage(global.stage);
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
        }

        unloadStylesheet() {
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
        }

        _getCssPath() {
            const defaultThemepath = `${XletMeta.path}/themes/default.css`;
            const cssFile = new F.File(Settings.dialog_theme === "custom" ?
                Settings.dialog_theme_custom :
                defaultThemepath);

            if (cssFile.is_file) {
                return cssFile.path;
            }

            return defaultThemepath;
        }

        _ensureHistoryFileExists() {
            if (!Settings.history_enabled) {
                return;
            }

            const configPath = [GLib.get_home_dir(), ".cinnamon", "configs", `${XletMeta.uuid}-History`].join("/");
            const configDir = Gio.file_new_for_path(configPath);

            if (!configDir.query_exists(null)) {
                configDir.make_directory_with_parents(null);
            }

            this.historyFile = new F.File(`${configPath}/translation_history.json`);
            this.historyFile.read().then((aData) => {
                G.tryFn(() => {
                    this._translation_history = JSON.parse(aData);

                    if (this._translation_history["__version__"] !== C.HISTORY_FILE_VERSION) {
                        $.Notification.notify([
                                G.escapeHTML(_("The translation history requires sanitation.")),
                                G.escapeHTML(_("The sanitation can be performed from the translation history window.")),
                                G.escapeHTML(_("Check this extension help file for more details."))
                            ],
                            NotificationsUtils.NotificationUrgency.CRITICAL
                        );
                    }
                }, (aErr) => {
                    this._translation_history = null;
                    global.logError(aErr);
                    $.Notification.notify([
                            G.escapeHTML(_("Something might have gone wrong parsing the translation history.")),
                            G.escapeHTML(String(aErr))
                        ],
                        NotificationsUtils.NotificationUrgency.CRITICAL
                    );
                });

            }).catch((aErr) => { // jshint ignore:line
                this._translation_history = {
                    __version__: C.HISTORY_FILE_VERSION
                };
                this.saveHistoryToFile();
            });
        }

        saveHistoryToFile() {
            if (!Settings.history_enabled) {
                return;
            }

            let rawData;

            if (Settings.loggin_save_history_indented) {
                rawData = JSON.stringify(this._translation_history, null, "    ");
            } else {
                rawData = JSON.stringify(this._translation_history);
            }

            this.historyFile.write(rawData).catch((aErr) => global.logError(aErr));
        }

        _displayHistory(aSourceText) {
            if (!Settings.history_enabled) {
                return;
            }

            const historyEntry = this.transHistory[this._current_target_lang][aSourceText];

            if ($.Debugger.logging_level !== D.LoggingLevel.NORMAL) {
                global.log("\n_displayHistory()>historyEntry:\n" + JSON.stringify(historyEntry));
            }

            try {
                this.transDialog.target_entry.markup = "%s".format("[" + G.escapeHTML(_("History")) + "]\n" + historyEntry["tT"]);
            } catch (aErr) {
                global.logError(aErr);
                this.transDialog.target_entry.text = "[" + _("History") + "]\n" + historyEntry["tT"];
            }
        }

        _checkTranslatorPrefsVersion() {
            if (Number(Settings.translators_prefs_defaults_control) !== C.DEFAULT_ENGINES_CONTROL) {
                let currentDefaults = JSON.parse(JSON.stringify(Settings.translators_prefs_defaults));
                const newEngines = [];
                let defaultsNeedUpdate = false;

                // Find engines that need to be added and store them.
                for (const defaultEngine of C.DEFAULT_ENGINES) {
                    const id = defaultEngine["provider_name"];
                    const eng = $.getEngineByName(id, currentDefaults);

                    if (eng === null) {
                        newEngines.push($.getEngineByName(id, C.DEFAULT_ENGINES));
                        defaultsNeedUpdate = true;
                    }
                }

                // Find engines that doesn't exist anymore and remove them.
                G.arrayEach(currentDefaults, (aDefEng, aIdx) => {
                    const id = aDefEng["provider_name"];
                    const eng = $.getEngineByName(id, C.DEFAULT_ENGINES);

                    if (eng === null) {
                        currentDefaults.splice(aIdx, 1);
                        defaultsNeedUpdate = true;
                    }
                }, true);

                if (defaultsNeedUpdate) {
                    currentDefaults = ([...currentDefaults, ...newEngines]).sort((a, b) => {
                        return a.provider_name.localeCompare(b.provider_name);
                    });
                    Settings.translators_prefs_defaults = currentDefaults;
                }

                Settings.translators_prefs_defaults_control = C.DEFAULT_ENGINES_CONTROL;
            }
        }

        get transHistory() {
            return this._translation_history;
        }

        setTransHistory(aSourceText, aTransObj) {
            if (!Settings.history_enabled) {
                return;
            }

            if (!this._translation_history.hasOwnProperty(aTransObj.tL)) {
                this._translation_history[aTransObj.tL] = {};
            }

            this._translation_history[aTransObj.tL][aSourceText] = aTransObj;
            this.saveHistoryToFile();
        }

        get current_target_lang() {
            return this._current_target_lang;
        }

        get current_source_lang() {
            return this._current_source_lang;
        }

        _triggerKeybinding(aKbName) {
            switch (aKbName) {
                case "open_translator_dialog_keybinding":
                    if (this.transDialog.state === C.DialogState.OPENED ||
                        this.transDialog.state === C.DialogState.OPENING) {
                        this.transDialog.close();
                    } else {
                        this.open();
                    }
                    break;
                case "translate_from_clipboard_keybinding":
                    this._translateFromClipboard();
                    break;
                case "translate_from_selection_keybinding":
                    this._translateSelection();
                    break;
            }
        }

        _registerKeybindings() {
            this.$.keybinding_manager.clearAllKeybindings();

            for (const kb of this._keybindings) {
                if (Settings[kb]) {
                    this.$.keybinding_manager.addKeybinding(
                        kb,
                        Settings[kb],
                        this._triggerKeybinding.bind(this, kb)
                    );
                }
            }

            this.helpDialog.updateDynamicLabels();
        }

        openDateFormatSyntaxInfo() {
            G.launchUri("https://docs.python.org/3/library/time.html#time.strftime");
        }

        __openHelpPage() {
            this.transDialog.close();
            super.__openHelpPage();
        }

        __openXletSettings() {
            this.transDialog.close();
            super.__openXletSettings();
        }

        __onSettingsChanged(aPrefkey) {
            switch (aPrefkey) {
                case "translators_prefs_defaults_apply":
                    this._reapplyDefaults();
                    break;
                case "trigger_date_format_syntax_info":
                    this.openDateFormatSyntaxInfo();
                    break;
                case "show_most_used":
                    if (!Settings.show_most_used) {
                        this.langsStats = null;
                    }

                    this._initMostUsed();
                    break;
                case "dialog_theme":
                case "dialog_theme_custom":
                    if (Settings.dialog_theme_custom &&
                        Settings.dialog_theme !== "custom") {
                        return;
                    }

                    this._loadTheme(true);
                    break;
                case "open_translator_dialog_keybinding":
                case "translate_from_clipboard_keybinding":
                case "translate_from_selection_keybinding":
                    this._registerKeybindings();
                    break;
                case "history_enabled":
                    this._ensureHistoryFileExists();
                    break;
            }
        }
    }

    $.Debugger.wrapObjectMethods({
        MultiTranslator: MultiTranslator
    });

    return new MultiTranslator();
}

function init(aXletMeta) {
    XletMeta = aXletMeta;

    /* NOTE: I have to initialize the modules and all their exported variables
     * at this stage because the stupid asynchronicity of newer versions of Cinnamon.
     * Since I'm using Cinnamon's native settings system declared and instantiated
     * in the constants.js module (so I can use it globally from all modules and without
     * the need to pass the settings object through a trillion other objects),
     * attempting to initialize the settings outside init() fails because the stupid
     * extension isn't loaded yet. ¬¬
     */

    $ = require("js_modules/utils.js");
    C = require("js_modules/constants.js");
    D = require("js_modules/debugManager.js");
    NotificationsUtils = require("js_modules/notificationsUtils.js");
    E = require("js_modules/extensionsUtils.js");
    F = require("js_modules/customFileUtils.js");
    G = require("js_modules/globalUtils.js");
    SpawnReader = require("js_modules/spawnUtils.js").SpawnReader;
    UI = require("js_modules/ui.js");

    _ = G._;
    Settings = $.Settings;

    $.Debugger.wrapObjectMethods({
        BaseExtension: E.BaseExtension,
        SpawnReader: SpawnReader
    });

    OutputReader = new SpawnReader({
        flags: GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD
    });
}

function enable() {
    G.tryFn(() => {
        translator = getExtensionClass(E.BaseExtension);

        Mainloop.idle_add(() => {
            translator.enable();

            return GLib.SOURCE_REMOVE;
        });
    }, (aErr) => global.logError(aErr));

    return translator ? {
        __openXletSettings: translator.__openXletSettings
    } : null;
}

function disable() {
    if (translator !== null) {
        translator.disable();
        translator = null;
    }
}
