const {
    gi: {
        Clutter,
        St
    },
    mainloop: Mainloop,
    misc: {
        params: Params
    },
    ui: {
        modalDialog: ModalDialog
    }
} = imports;

/**
 * A confirmation dialog with more options than the one that can be found at js/ui/modalDialog.js.
 *
 * @param {Object} aParams                 - Parameters.
 * @param {Object} aParams.dialog_name     - A name for the main content box with class confirm-dialog-main-layout.
 * @param {Object} aParams.headline        - Text used a the title for the dialog.
 * @param {Object} aParams.description     - Text for the dialog to display.
 * @param {Object} aParams.cancel_label    - Text for the button that closes the dialog without performing an action.
 * @param {Object} aParams.ok_label        - Text for the button that will confirm an action.
 * @param {Object} aParams.set_base_styles - If basic styling should be applied.
 * @param {Object} aParams.callback        - Function to execute upon confirmation.
 *
 * @type {Class}
 */
var ConfirmDialog = class ConfirmDialog extends ModalDialog.ModalDialog {
    constructor(aParams) {
        super({
            styleClass: null
        });

        const params = Params.parse(aParams, {
            dialog_name: "",
            headline: "",
            description: "",
            cancel_label: "",
            ok_label: "",
            set_base_styles: true,
            callback: null
        });

        params.dialog_name && this._dialogLayout.set_name(params.dialog_name);

        const mainContentBox = new St.BoxLayout({
            style_class: "confirm-dialog-main-layout",
            vertical: false
        });
        params.set_base_styles && mainContentBox.set_style("spacing: 24px;");

        this.contentLayout.add(mainContentBox, {
            x_fill: true,
            y_fill: true
        });

        const messageBox = new St.BoxLayout({
            style_class: "confirm-dialog-message-layout",
            vertical: true
        });
        params.set_base_styles && messageBox.set_style("spacing: 16px;");

        mainContentBox.add(messageBox, {
            y_align: St.Align.START
        });

        this._subjectLabel = new St.Label({
            style_class: "confirm-dialog-headline",
            text: params.headline
        });
        params.set_base_styles && this._subjectLabel.set_style("font-size: 1.1em; font-weight: bold;");

        messageBox.add(this._subjectLabel, {
            y_fill: false,
            y_align: St.Align.START
        });

        this._descriptionLabel = new St.Label({
            style_class: "confirm-dialog-description",
            text: params.description
        });
        params.set_base_styles && this._descriptionLabel.set_style("font-size: 1em;");

        messageBox.add(this._descriptionLabel, {
            y_fill: true,
            y_align: St.Align.START
        });

        // NOTE: The Mainloop.idle_add call is to let the close animation run "unmolested".
        this.setButtons([{
            label: params.cancel_label,
            focused: true,
            action: () => {
                this.close();
                Mainloop.idle_add(() => {
                    this.destroy();

                    // return GLib.SOURCE_REMOVE;
                    return false;
                });
            },
            key: Clutter.KEY_Escape
        }, {
            label: params.ok_label,
            action: () => {
                this.close();

                Mainloop.idle_add(() => {
                    this.destroy();

                    if (params.callback && typeof params.callback === "function") {
                        params.callback();
                    }

                    // return GLib.SOURCE_REMOVE;
                    return false;
                });
            },
            key: Clutter.KEY_Return
        }]);
    }
};

/* exported ConfirmDialog
 */
