const {
    gi: {
        Clutter,
        St
    },
    misc: {
        params: Params
    },
    ui: {
        modalDialog: ModalDialog
    }
} = imports;

function ConfirmDialog() {
    this._init.apply(this, arguments);
}

ConfirmDialog.prototype = {
    __proto__: ModalDialog.ModalDialog.prototype,

    _init: function(aParams) {
        ModalDialog.ModalDialog.prototype._init.call(this, {
            styleClass: null
        });

        let params = Params.parse(aParams, {
            dialogName: "",
            headline: "",
            description: "",
            cancelLabel: "",
            okLabel: "",
            callback: null
        });

        if (params.dialogName) {
            this._dialogLayout.set_name(params.dialogName);
        }

        let mainContentBox = new St.BoxLayout({
            style_class: "confirm-dialog-main-layout",
            vertical: false
        });
        this.contentLayout.add(mainContentBox, {
            x_fill: true,
            y_fill: true
        });

        let messageBox = new St.BoxLayout({
            style_class: "confirm-dialog-message-layout",
            vertical: true
        });
        mainContentBox.add(messageBox, {
            y_align: St.Align.START
        });

        this._subjectLabel = new St.Label({
            style_class: "confirm-dialog-headline",
            text: params.headline
        });

        messageBox.add(this._subjectLabel, {
            y_fill: false,
            y_align: St.Align.START
        });

        this._descriptionLabel = new St.Label({
            style_class: "confirm-dialog-description",
            text: params.description
        });

        messageBox.add(this._descriptionLabel, {
            y_fill: true,
            y_align: St.Align.START
        });

        this.setButtons([{
            label: params.cancelLabel,
            focused: true,
            action: () => {
                this.close();
            },
            key: Clutter.Escape
        }, {
            label: params.okLabel,
            action: () => {
                this.close();

                if (params.callback && typeof params.callback === "function") {
                    params.callback();
                }
            }
        }]);
    }
};
