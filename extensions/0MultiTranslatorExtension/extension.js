let $;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof require === "function") {
    $ = require("./utils.js");
} else {
    $ = imports.ui.extensionSystem.extensions["{{UUID}}"].utils;
}

const _ = $._;
const Settings = $.Settings;

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

let XletMeta;

function TranslatorExtension() {
    this._init.apply(this, arguments);
}

TranslatorExtension.prototype = {
    _init: function() {
        try {
            this.sigMan = new SignalManager.SignalManager(null);
            this._dialog = new $.TranslatorDialog(this);
            this._dialog.dialog_layout.connect("key-press-event",
                (aActor, aEvent) => this._on_key_press_event(aActor, aEvent));
            this._translators_manager = new $.TranslatorsManager(this);

            this._dialog.source.max_length = this._translators_manager.current.limit;
            this._dialog.source.connect("activate",
                (aActor, aEvent) => this._translate(aActor, aEvent));

            this._languages_stats = new $.LanguagesStats();
            this._add_topbar_buttons();
            this._add_dialog_menu_buttons();
            this._init_languages_chooser();
            this._set_current_languages();

            this._init_most_used();

            this.sigMan.connect(Main.themeManager, "theme-set", function() {
                this._loadTheme(false);
            }.bind(this));
            this.sigMan.connect(Settings, "changed", this._onSettingsChanged.bind(this));

            this._current_source_lang = null;
            this._current_target_lang = null;
            this.theme = null;
            this.stylesheet = null;
            this.forceTranslation = false;
            this.historyFile = null;
            this._translation_history = null;
            this._translators_button_popup = null;
            this._main_menu_button_popup = null;

            this.ensureHistoryFileExists();
            this._loadTheme();

            if (!Settings.all_dependencies_met) {
                $.checkDependencies();
            }
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    _init_most_used: function() {
        if (!Settings.show_most_used) {
            return;
        }

        this._languages_stats.connect(
            "stats-changed", () => this._show_most_used()
        );
        this._dialog.most_used.sources.connect(
            "clicked",
            (aActor, aData) => {
                this._dialog.most_used.sources.select(aData.lang_code);
                this._set_current_source(aData.lang_code);
                this._current_langs_changed();
            }
        );
        this._dialog.most_used.targets.connect(
            "clicked",
            (aActor, aData) => {
                this._dialog.most_used.targets.select(aData.lang_code);
                this._set_current_target(aData.lang_code);
                this._current_langs_changed();
            }
        );
    },

    _show_most_used: function() {
        if (!Settings.show_most_used) {
            return;
        }

        let most_used_sources = this._languages_stats.get_n_most_used(
            this._translators_manager.current.name,
            $.STATS_TYPE_SOURCE,
            5
        );
        this._dialog.most_used.sources.set_languages(most_used_sources);

        let most_used_targets = this._languages_stats.get_n_most_used(
            this._translators_manager.current.name,
            $.STATS_TYPE_TARGET,
            5
        );
        this._dialog.most_used.targets.set_languages(most_used_targets);

        this._most_used_bar_select_current();
    },

    _most_used_bar_select_current: function() {
        if (!Settings.show_most_used) {
            return;
        }

        this._dialog.most_used.sources.select(this._current_source_lang);
        this._dialog.most_used.targets.select(this._current_target_lang);
    },

    _init_languages_chooser: function() {
        this._source_language_chooser = new $.LanguageChooser(
            _("Choose source language") + ":",
            null
        );
        this._source_language_chooser.connect("language-chose",
            (aActor, aLang) => this._on_source_language_chose(aActor, aLang)
        );

        this._target_language_chooser = new $.LanguageChooser(
            _("Choose target language") + ":",
            null
        );
        this._target_language_chooser.connect("language-chose",
            (aActor, aLang) => this._on_target_language_chose(aActor, aLang)
        );
    },

    /**
     * Since the removal of certain features from the original extension,
     * this function is not used.
     * Keep it just in case it's useful in the future.
     */
    _remove_timeouts: function(timeout_key) {
        if (!$.is_blank(timeout_key)) {
            if ($.TIMEOUT_IDS[timeout_key] > 0) {
                Mainloop.source_remove($.TIMEOUT_IDS[timeout_key]);
                $.TIMEOUT_IDS[timeout_key] = 0;
            }
        } else {
            for (let key in $.TIMEOUT_IDS) {
                if ($.TIMEOUT_IDS[key] > 0) {
                    Mainloop.source_remove($.TIMEOUT_IDS[key]);
                    $.TIMEOUT_IDS[timeout_key] = 0;
                }
            }
        }
    },

    _on_key_press_event: function(object, event) {
        let state = event.get_state();
        let symbol = event.get_key_symbol();
        let code = event.get_key_code();

        let cyrillic_control = 8196;
        let cyrillic_shift = 8192;

        if (symbol == Clutter.Escape) {
            this.close();
        } else if (
            (
                state == Clutter.ModifierType.SHIFT_MASK + Clutter.ModifierType.CONTROL_MASK ||
                state == cyrillic_shift + cyrillic_control
            ) &&
            code == 54
        ) { // ctrl+shift+c - copy translated text to clipboard
            let text = this._dialog.target.text;

            if ($.is_blank(text)) {
                this._dialog.statusbar.add_message(
                    _("There is nothing to copy."),
                    1500,
                    $.STATUS_BAR_MESSAGE_TYPES.error,
                    false
                );
            } else {
                let clipboard = St.Clipboard.get_default();

                if (St.ClipboardType) {
                    clipboard.set_text(St.ClipboardType.CLIPBOARD, text);
                } else {
                    clipboard.set_text(text);
                }

                this._dialog.statusbar.add_message(
                    _("Translated text copied to clipboard."),
                    1500,
                    $.STATUS_BAR_MESSAGE_TYPES.info,
                    false
                );
            }
        } else if (
            (state == Clutter.ModifierType.CONTROL_MASK || state == cyrillic_control) &&
            code == 39
        ) { // ctr+s - swap languages
            this._swap_languages();
        } else if (
            (state == Clutter.ModifierType.CONTROL_MASK || state == cyrillic_control) &&
            code == 40
        ) { // ctrl+d - reset languages to default
            this._reset_languages();
        } else if (symbol == Clutter.KEY_Super_L || symbol == Clutter.KEY_Super_R) { // Super - close
            this.close();
        } else {
            if (Settings.loggin_enabled) {
                global.logError(JSON.stringify({
                    state: state,
                    symbol: symbol,
                    code: code
                }, null, "\t"));
            }
        }
    },

    _set_current_translator: function(name) {
        let requires_ts = /TS$/.test(name);
        let display_name = $.PROVIDERS.display_name[name];

        if (requires_ts) {
            display_name += " (*)";
        }

        this._translators_button.label = "<i>%s</i>".format(display_name);

        this._translators_manager.current = name;
        this._dialog.source.max_length = this._translators_manager.current.limit;
        this._set_current_languages();
        this._show_most_used();
        this._set_providerbar(name);

        this._dialog.source.grab_key_focus();
    },

    _set_providerbar: function(name) {
        this._dialog.providerbar.providerURL = $.PROVIDERS.website[name];
        this._dialog.providerbar._button.tooltip._tooltip.set_text(_("Go to %s's website")
            .format($.PROVIDERS.display_name[name]));
        this._dialog.providerbar._label.set_text(_("Service provided by %s")
            .format($.PROVIDERS.display_name[name]));
    },

    _set_current_source: function(lang_code) {
        this._current_source_lang = lang_code;
        this._translators_manager.current.prefs.last_source = lang_code;
    },

    _set_current_target: function(lang_code) {
        this._current_target_lang = lang_code;
        this._translators_manager.current.prefs.last_target = lang_code;
    },

    _set_current_languages: function() {
        let current_translator = this._translators_manager.current;
        let current_source = current_translator.prefs.default_source;
        let current_target = current_translator.prefs.default_target;

        if (current_translator.prefs.remember_last_lang) {
            current_source = current_translator.prefs.last_source !== false ? current_translator.prefs.last_source : current_translator.prefs.default_source;
            current_target = current_translator.prefs.last_target ? current_translator.prefs.last_target : current_translator.prefs.default_target;
        }

        this._set_current_source(current_source);
        this._set_current_target(current_target);
        this._current_langs_changed();
    },

    _swap_languages: function() {
        let source = this._current_source_lang;
        let target = this._current_target_lang;

        if (source === "auto") {
            return;
        }

        this._set_current_source(target);
        this._set_current_target(source);
        this._current_langs_changed();
        this._most_used_bar_select_current();
        this._translate();
    },

    _reset_languages: function() {
        let current = this._translators_manager.current;
        this._set_current_source(current.prefs.default_source);
        this._set_current_target(current.prefs.default_target);
        this._current_langs_changed();
        this._most_used_bar_select_current();
    },

    _update_stats: function() {
        let source_data = {
            code: this._current_source_lang,
            name: this._translators_manager.current.get_language_name(
                this._current_source_lang
            )
        };
        this._languages_stats.increment(
            this._translators_manager.current.name,
            $.STATS_TYPE_SOURCE,
            source_data
        );
        let target_data = {
            code: this._current_target_lang,
            name: this._translators_manager.current.get_language_name(
                this._current_target_lang
            )
        };
        this._languages_stats.increment(
            this._translators_manager.current.name,
            $.STATS_TYPE_TARGET,
            target_data
        );
    },

    _show_help: function() {
        this._close_all_menus();
        let help_dialog = new $.HelpDialog();
        help_dialog.open();
    },

    _openTranslationHistory: function() {
        this.close();
        Util.spawn_async([
            XletMeta.path + "/extensionHelper.py",
            "history",
            Settings.history_initial_window_width + "," +
            Settings.history_initial_window_height + "," +
            Settings.history_width_to_trigger_word_wrap
        ], null);
    },

    _on_source_language_chose: function(aActor, aLang) {
        this._most_used_bar_select_current();
        this._set_current_source(aLang.code);
        this._current_langs_changed();
        this._source_language_chooser.close();
        this._translate();
    },

    _on_target_language_chose: function(aActor, aLang) {
        this._most_used_bar_select_current();
        this._set_current_target(aLang.code);
        this._current_langs_changed();
        this._target_language_chooser.close();
        this._translate();
    },

    _current_langs_changed: function() {
        this._source_lang_button.label = "%s <i>%s</i>".format(
            // TO TRANSLATORS: Full sentence:
            // "»From« source language to target language with service provider."
            _("From"),
            this._translators_manager.current.get_language_name(
                this._current_source_lang
            )
        );
        this._target_lang_button.label = "%s <i>%s</i>".format(
            // TO TRANSLATORS: Full sentence:
            // "From source language »to« target language with service provider."
            _("to"),
            this._translators_manager.current.get_language_name(
                this._current_target_lang
            )
        );
    },

    _get_source_lang_button: function() {
        let button_params = {
            button_style_class: "translator-top-bar-button-reactive",
            statusbar: this._dialog.statusbar
        };
        let button = new $.ButtonsBarButton(
            false,
            "<i>%s: %s</i>".format(
                _("From"),
                this._translators_manager.current.get_language_name(
                    this._current_source_lang || ""
                )
            ),
            _("Choose source language"),
            button_params,
            () => {
                this._close_all_menus();
                this._source_language_chooser.open();
                this._source_language_chooser.set_languages(
                    this._translators_manager.current.get_languages()
                );
                this._source_language_chooser.show_languages(
                    this._current_source_lang
                );
            }
        );

        return button;
    },

    _get_target_lang_button: function() {
        let button_params = {
            button_style_class: "translator-top-bar-button-reactive",
            statusbar: this._dialog.statusbar
        };
        let button = new $.ButtonsBarButton(
            false,
            "<i>%s: %s</i>".format(
                _("to"),
                this._translators_manager.current.get_language_name(
                    this._current_target_lang || ""
                )
            ),
            _("Choose target language"),
            button_params,
            () => {
                this._close_all_menus();
                this._target_language_chooser.open();
                this._target_language_chooser.set_languages(
                    this._translators_manager.current.get_pairs(this._current_source_lang)
                );
                this._target_language_chooser.show_languages(
                    this._current_target_lang
                );
            }
        );

        return button;
    },

    _get_swap_langs_button: function() {
        let button_params = {
            button_style_class: "translator-top-bar-button-reactive",
            statusbar: this._dialog.statusbar
        };
        let button = new $.ButtonsBarButton(
            false,
            " \u21C4 ",
            _("Swap languages"),
            button_params,
            () => this._swap_languages()
        );

        return button;
    },

    _get_translators_button: function() {
        let button;

        if (this._translators_manager.num_translators < 2) {
            button = new $.ButtonsBarLabel(
                this._translators_manager.current.name,
                "translator-top-bar-button"
            );
        } else {
            let button_params = {
                button_style_class: "translator-top-bar-button-reactive",
                statusbar: this._dialog.statusbar
            };
            button = new $.ButtonsBarButton(
                false,
                "<i>%s</i>".format(this._translators_manager.current.name),
                _("Choose translation provider"),
                button_params,
                () => {
                    this._close_all_menus("translators");

                    if (this._translators_button_popup && this._translators_button_popup.isOpen) {
                        this._translators_button_popup.close();
                    } else {
                        this._translators_button_popup = new $.DialogPopup(
                            button,
                            this._dialog
                        );

                        let names = this._translators_manager.translators_names.sort((a, b) => {
                            return a.localeCompare(b);
                        });

                        let setCurrentTrans = (name) => {
                            return () => {
                                this._set_current_translator(name);
                            };
                        };

                        let i = 0,
                            iLen = names.length;
                        for (; i < iLen; i++) {
                            let name = names[i];

                            if (name === this._translators_manager.current.name) {
                                continue;
                            }

                            this._translators_button_popup.add_item(
                                name,
                                setCurrentTrans(name),
                                $.PROVIDERS.icon[name], // Icon name
                                false, // Icon is symbolic?
                                true // Is a list of translators providers?
                            );
                        }
                        this._translators_button_popup.open();
                    }
                }
            );
        }

        return button;
    },

    _get_translate_button: function() {
        let button_params = {
            button_style_class: "translator-top-bar-go-button",
            statusbar: this._dialog.statusbar
        };
        let button = new $.ButtonsBarButton(
            false,
            _("Go!"),
            _("Translate text (<Ctrl> + <Enter>)"),
            button_params,
            (aActor, aEvent) => this._translate(aActor, aEvent)
        );

        return button;
    },

    _get_menu_button: function() {
        let button_params = {
            button_style_class: "translator-dialog-menu-button",
            statusbar: this._dialog.statusbar
        };

        let button = new $.ButtonsBarButton(
            $.ICONS.hamburger,
            "",
            _("Main menu"),
            button_params,
            () => {
                this._close_all_menus("main");

                if (this._main_menu_button_popup && this._main_menu_button_popup.isOpen) {
                    this._main_menu_button_popup.close();
                } else {
                    this._main_menu_button_popup = new $.DialogPopup(
                        button,
                        this._dialog
                    );
                    let items = [
                        [
                            _("Preferences"),
                            () => {
                                this.close();
                                Util.spawn_async([XletMeta.path + "/settings.py"], null);
                            },
                            $.ICONS.preferences
                        ],
                        [
                            _("Translation history"),
                            () => this._openTranslationHistory(),
                            $.ICONS.history
                        ],
                        [
                            "separator"
                        ],
                        [
                            _("Check dependencies"),
                            () => {
                                this.close();
                                $.checkDependencies();
                            },
                            $.ICONS.find
                        ],
                        [
                            _("Extended help"),
                            () => {
                                this.close();
                                Util.spawn_async([
                                    "xdg-open",
                                    XletMeta.path + "/HELP.html"
                                ], null);
                            },
                            $.ICONS.help
                        ]
                    ];

                    let i = 0,
                        iLen = items.length;
                    for (; i < iLen; i++) {
                        //                  name       , action     , icon       , is symbolic?    , is translators popup?
                        this._main_menu_button_popup.add_item(items[i][0], items[i][1], items[i][2], true);
                    }

                    this._main_menu_button_popup.open();
                }
            }
        );

        return button;
    },

    _get_help_button: function() {
        let button_params = {
            button_style_class: "translator-dialog-menu-button",
            statusbar: this._dialog.statusbar
        };

        let button = new $.ButtonsBarButton(
            $.ICONS.help,
            "",
            _("Quick help"),
            button_params,
            () => this._show_help());

        return button;
    },

    _get_close_button: function() {
        let button_params = {
            button_style_class: "translator-dialog-menu-button",
            statusbar: this._dialog.statusbar
        };
        let button = new $.ButtonsBarButton(
            $.ICONS.shutdown,
            "",
            _("Quit"),
            button_params,
            () => this.close()
        );

        return button;
    },

    _add_topbar_buttons: function() {
        let translate_label = new $.ButtonsBarLabel(
            " ",
            "translator-top-bar-button"
        );
        this._dialog.topbar.add_button(translate_label);

        this._source_lang_button = this._get_source_lang_button();
        this._dialog.topbar.add_button(this._source_lang_button);

        this._swap_languages_button = this._get_swap_langs_button();
        this._dialog.topbar.add_button(this._swap_languages_button);

        this._target_lang_button = this._get_target_lang_button();
        this._dialog.topbar.add_button(this._target_lang_button);

        let by_label = new $.ButtonsBarLabel(
            // TO TRANSLATORS: Full sentence:
            // "From source language to target language »with« service provider."
            " %s ".format(_("with")),
            "translator-top-bar-button"
        );
        this._dialog.topbar.add_button(by_label);

        this._translators_button = this._get_translators_button();
        this._dialog.topbar.add_button(this._translators_button);

        translate_label = new $.ButtonsBarLabel(
            " ",
            "translator-top-bar-button"
        );
        this._dialog.topbar.add_button(translate_label);

        this._translate_button = this._get_translate_button();
        this._dialog.topbar.add_button(this._translate_button);
    },

    _add_dialog_menu_buttons: function() {
        let menu_button = this._get_menu_button();
        this._dialog.dialog_menu.add_button(menu_button);

        let help_button = this._get_help_button();
        this._dialog.dialog_menu.add_button(help_button);

        let close_button = this._get_close_button();
        this._dialog.dialog_menu.add_button(close_button);
    },

    _translate: function(actor, event) {
        if ($.is_blank(this._dialog.source.text)) {
            return;
        }

        try {
            // The event used by this block is passed by mouse clicks and key press events.
            let state = event.get_state();
            let cyrillic_shift = 8192;
            let shift_mask =
                // For key press
                (state === Clutter.ModifierType.SHIFT_MASK || state === cyrillic_shift) ||
                // For mouse button press
                (Clutter.ModifierType.SHIFT_MASK & global.get_pointer()[2]) !== 0;

            this.forceTranslation = shift_mask;
        } catch (aErr) {
            if (Settings.loggin_enabled) {
                global.logError(aErr);
            }

            this.forceTranslation = false;
        }

        let historyEntry = this.transHistory[this._current_target_lang] ?
            this.transHistory[this._current_target_lang][this._dialog.source.text] :
            false;

        if (this.forceTranslation) {
            historyEntry = false;
        }

        if (historyEntry && this._current_target_lang === historyEntry["tL"]) {
            this._displayHistory(this._dialog.source.text);
            return;
        }

        this._update_stats();
        this._dialog.target.text = "";
        let message_id = this._dialog.statusbar.add_message(
            _("Translating..."),
            0,
            $.STATUS_BAR_MESSAGE_TYPES.info,
            true
        );

        this._translators_manager.current.translate(
            this._current_source_lang,
            this._current_target_lang,
            this._dialog.source.text,
            (result) => {
                this._dialog.statusbar.remove_message(message_id);

                // Leave this try{}catch{} block
                try {
                    if (result.error) {
                        this._dialog.statusbar.add_message(
                            result.message,
                            4000,
                            $.STATUS_BAR_MESSAGE_TYPES.error
                        );
                    } else {
                        this._dialog.target.markup = "%s".format(result.message);

                        // Do not save history if the source text is equal to the
                        // translated text.
                        if (this._dialog.source.text !== this._dialog.target.text) {
                            this.setTransHistory(
                                this._dialog.source.text, {
                                    d: $.getTimeStamp(new Date().getTime()),
                                    sL: (this._current_source_lang === "auto" ?
                                        this._getDetectedLang(result) :
                                        this._current_source_lang),
                                    tL: this._current_target_lang,
                                    tT: result.message
                                }
                            );
                        }
                    }
                } catch (aErr) {
                    global.logError(aErr);
                }
            }
        );
    },

    _translate_from_clipboard: function(aTranslateSelection) {
        if (aTranslateSelection) {
            $.getSelection((aSelection) => {
                this._dialog.source.text = aSelection;
                this.open();
                this._translate();
            });
        } else {
            let clipboard = St.Clipboard.get_default();
            let clipCallback = (clipboard, text) => {
                if ($.is_blank(text)) {
                    this._dialog.statusbar.add_message(
                        _("Clipboard is empty."),
                        2000,
                        $.STATUS_BAR_MESSAGE_TYPES.error,
                        false
                    );
                    return;
                }

                this._dialog.source.text = text;
                this.open();
                this._translate();
            };

            if (St.ClipboardType) {
                clipboard.get_text(St.ClipboardType.CLIPBOARD, clipCallback);
            } else {
                clipboard.get_text(clipCallback);
            }
        }
    },

    _getDetectedLang: function(aResult) {
        switch (this._translators_manager.current.name) {
            case "Transltr":
            case "Google.Translate":
                return aResult.detectedLang;
            case "Google.TranslateTS":
                let lines = aResult.message.split("\n");
                let i = 0,
                    iLen = lines.length;
                for (; i < iLen; i++) {
                    if (/^\[/.test(lines[i]) && /\]$/.test(lines[i])) {
                        let str = (lines[i].replace(/<[^>]*>/g, "")).split("->")[0];
                        str = str.slice(1, str.length).trim();
                        return $.getKeyByValue($.LANGUAGES_LIST, $.LANGUAGES_LIST_ENDONYMS[str]) ||
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
    },

    _close_all_menus: function(aIgnore) {
        aIgnore === "translators" || this._translators_button_popup &&
            this._translators_button_popup.isOpen &&
            this._translators_button_popup.close();
        aIgnore === "main" || this._main_menu_button_popup &&
            this._main_menu_button_popup.isOpen &&
            this._main_menu_button_popup.close();
    },

    _add_keybindings: function() {
        Main.keybindingManager.addHotKey(
            "multi_translator_open_translator_dialog_keybinding",
            Settings.open_translator_dialog_keybinding + "::",
            () => {
                if (this._dialog.state === $.State.OPENED || this._dialog.state === $.State.OPENING) {
                    this.close();
                } else {
                    this.open();
                }
            }
        );

        Main.keybindingManager.addHotKey(
            "multi_translator_translate_from_clipboard_keybinding",
            Settings.translate_from_clipboard_keybinding + "::",
            () => this._translate_from_clipboard(false)
        );

        Main.keybindingManager.addHotKey(
            "multi_translator_translate_from_selection_keybinding",
            Settings.translate_from_selection_keybinding + "::",
            () => this._translate_from_clipboard(true)
        );
    },

    _remove_keybindings: function(aReEnable) {
        Main.keybindingManager.removeHotKey("multi_translator_open_translator_dialog_keybinding");
        Main.keybindingManager.removeHotKey("multi_translator_translate_from_clipboard_keybinding");
        Main.keybindingManager.removeHotKey("multi_translator_translate_from_selection_keybinding");

        if (aReEnable && Settings.enable_shortcuts) {
            this._add_keybindings();
        }
    },

    open: function() {
        try {
            if (Settings.remember_last_translator) {
                let translator = this._translators_manager.last_used ?
                    this._translators_manager.last_used.name :
                    this._translators_manager.default.name;
                this._set_current_translator(translator);
            } else {
                this._set_current_translator(this._translators_manager.default.name);
            }

            this._dialog.open();
            this._dialog.source.clutter_text.set_selection(
                Settings.keep_source_entry_text_selected ? 0 : -1,
                this._dialog.source.length
            );
            this._dialog.source.clutter_text.grab_key_focus();
            this._dialog.source.max_length = this._translators_manager.current.limit;
            this._set_current_languages();
            this._show_most_used();
        } catch (aErr) {
            global.logError(aErr);
        }
    },

    close: function() {
        this._dialog.close();
    },

    enable: function() {
        if (Settings.enable_shortcuts) {
            this._add_keybindings();
        }
    },

    disable: function() {
        this.close();
        this.unloadStylesheet();
        this._dialog.destroy();
        this._translators_manager.destroy();
        this._source_language_chooser.destroy();
        this._target_language_chooser.destroy();
        this._remove_keybindings();

        this.sigMan.disconnectAllSignals();
    },

    _loadTheme: function(aFullReload = false) {
        this._remove_timeouts("load_theme_id");
        let newTheme;

        if (Settings.dialog_theme !== "custom") {
            newTheme = this._getCssPath(Settings.dialog_theme);
        } else {
            newTheme = this._getCustomCssPath(Settings.dialog_theme_custom);
        }

        if (!newTheme) {
            return;
        }

        try {
            this.unloadStylesheet();
        } catch (aErr) {
            global.logError(aErr);
        } finally {
            $.TIMEOUT_IDS.load_theme_id = Mainloop.timeout_add(
                $.LOAD_THEME_DELAY,
                () => {
                    try {
                        /* NOTE: Without calling Main.themeManager._changeTheme() this xlet stylesheet
                         * doesn't reload correctly. ¬¬
                         */
                        if (aFullReload) {
                            Main.themeManager._changeTheme();
                        }

                        this.loadStylesheet(newTheme);
                    } catch (aErr) {
                        global.logError(aErr);
                    }

                    $.TIMEOUT_IDS.load_theme_id = 0;
                }
            );
        }
    },

    loadStylesheet: function(aThemePath) {
        try {
            let themeContext = St.ThemeContext.get_for_stage(global.stage);
            this.theme = themeContext.get_theme();
        } catch (aErr) {
            global.logError(_("Error trying to get theme"));
            global.logError(aErr);
        }

        try {
            this.theme.load_stylesheet(aThemePath);
            this.stylesheet = aThemePath;
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

    _getCssPath: function(theme) {
        // Get CSS of new theme, and check it exists, falling back to "default"
        let cssPath = XletMeta.path + "/themes/" + theme + ".css";

        try {
            let cssFile = Gio.file_new_for_path(cssPath);

            if (!cssFile.query_exists(null)) {
                cssPath = XletMeta.path + "/themes/default.css";
                Settings.dialog_theme = "default";
            }
        } catch (aErr) {
            global.logError(aErr);
        }

        return cssPath;
    },

    _getCustomCssPath: function(aPath) {
        if (/^file:\/\//.test(aPath)) {
            aPath = aPath.substr(7);
        }

        let cssPath = aPath;

        try {
            let cssFile = Gio.file_new_for_path(cssPath);

            if (!cssFile.query_exists(null)) {
                cssPath = XletMeta.path + "/themes/default.css";
                Settings.dialog_theme = "default";
            }
        } catch (aErr) {
            global.logError(aErr);
        } finally {
            return cssPath;
        }
    },

    ensureHistoryFileExists: function() {
        let configPath = [GLib.get_home_dir(), ".cinnamon", "configs", "{{UUID}}-History"].join("/");
        let configDir = Gio.file_new_for_path(configPath);

        if (!configDir.query_exists(null)) {
            configDir.make_directory_with_parents(null);
        }

        this.historyFile = configDir.get_child("translation_history.json");

        if (this.historyFile.query_exists(null)) {
            this.historyFile.load_contents_async(null, (aFile, aResponce) => {
                let success, contents, tag;

                try {
                    [success, contents, tag] = aFile.load_contents_finish(aResponce);
                } catch (aErr) {
                    global.logError(aErr.message);
                    return;
                }

                if (!success) {
                    global.logError("Error parsing %s".format(this.historyFile.get_path()));
                    return;
                }

                try {
                    this._translation_history = JSON.parse(contents);
                } catch (aErr) {
                    global.logError(aErr.message);
                }
            });
        } else {
            this._translation_history = {
                __version__: 1
            };
            this.saveHistoryToFile();
        }
    },

    saveHistoryToFile: function() {
        let rawData;

        if (Settings.loggin_save_history_indented) {
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
        let historyEntry = this.transHistory[this._current_target_lang][aSourceText];

        if (Settings.loggin_enabled) {
            global.logError("\n_displayHistory()>historyEntry:\n" + JSON.stringify(historyEntry));
        }

        try {
            this._dialog.target.markup = "%s".format("[" + _("History") + "]\n" + historyEntry["tT"]);
        } catch (aErr) {
            global.logError(aErr);
            this._dialog.target.text = "[" + _("History") + "]\n" + historyEntry["tT"];
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

    get current_target_lang() {
        return this._current_target_lang;
    },

    get current_source_lang() {
        return this._current_source_lang;
    },

    _onSettingsChanged: function(aObj, aPref) {
        switch (aPref) {
            case "enable-shortcuts":
                if (Settings.enable_shortcuts) {
                    this._add_keybindings();
                } else {
                    this._remove_keybindings();
                }
                break;
            case "show-most-used":
                this._init_most_used();
                break;
            case "dialog-theme":
            case "dialog-theme-custom":
                this._loadTheme(true);
                break;
            case "open-translator-dialog-keybinding":
            case "translate-from-clipboard-keybinding":
            case "translate-from-selection-keybinding":
                this._remove_keybindings(true);
                break;
        }
    }
};

let translator = null;

function init(aXletMeta) {
    XletMeta = aXletMeta;
}

function enable() {
    Mainloop.idle_add(() => {
        try {
            translator = new TranslatorExtension();
            translator.enable();
            // Make $ available for use on Multi Translator applet.
            // This will save me the bother to re-declare dozens of methods on the applet's side.
            translator._extensionsModules = $;
        } catch (aErr) {
            global.logError(aErr);
        }
    });
}

function disable() {
    if (translator !== null) {
        translator.disable();
        translator = null;
    }
}
