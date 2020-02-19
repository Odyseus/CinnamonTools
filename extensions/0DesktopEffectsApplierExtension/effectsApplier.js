//{{IMPORTER}}

let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.extensionSystem.extensionMeta["{{UUID}}"];
}

const Constants = __import("constants.js");

const {
    DEFAULT_SHADER_FILE_RE,
    URI_RE,
    EFFECTS_PROP_NAME
} = Constants;

const {
    gi: {
        Clutter,
        Gio,
        GObject
    }
} = imports;

function _getEffectSourceAsync(aEffectParams, aCallback) {
    switch (aEffectParams.type) {
        case "desaturation":
        case "color":
            try {
                aCallback(aEffectParams.base_name);
            } catch (aErr) {
                global.logError(aErr);
            }
            break;
        case "shader":
            if (aEffectParams.hasOwnProperty("source")) {
                aCallback(aEffectParams["source"]);
                return;
            }

            let fileName = aEffectParams.base_name;
            let filePath = null;

            if (DEFAULT_SHADER_FILE_RE.test(fileName)) {
                filePath = XletMeta.path + "/shaders/" + fileName.replace(DEFAULT_SHADER_FILE_RE, "");
            } else {
                filePath = aEffectParams.extra_shaders_path.replace(URI_RE, "") + "/" + fileName;
            }

            let shaderFile = filePath ? Gio.file_new_for_path(filePath) : null;

            if (shaderFile && shaderFile.query_exists(null)) {
                shaderFile.load_contents_async(null,
                    (aFile, aResponce) => {
                        let success,
                            contents = "",
                            tag;

                        try {
                            [success, contents, tag] = aFile.load_contents_finish(aResponce);
                        } catch (aErr) {
                            global.logError(aErr.message);
                            return;
                        }

                        if (!success) {
                            global.logError("Error reading shader file: %s".format(shaderFile.get_path()));
                            return;
                        }

                        try {
                            /* NOTE: Store the shader source so the file doesn't need to be read
                             * every time the effect is "re-used" (e.g. is applied to windows clones).
                             */
                            aEffectParams["source"] = String(contents);
                            aCallback(String(contents));
                        } catch (aErr) {
                            global.logError(aErr);
                        }
                    }
                );
            }
            break;
        case "contrast":
        case "brightness":
            try {
                aCallback(null);
            } catch (aErr) {
                global.logError(aErr);
            }
            break;
    }
}

function _getNewEffectInstance(aEffectSource, aEffectParams, aActor) {
    let effect = null;

    switch (aEffectParams.type) {
        case "color":
            effect = new Clutter.ColorizeEffect();
            effect.set_tint(_getClutterColorFromString(aEffectSource));
            break;
        case "shader":
            effect = new Clutter.ShaderEffect({
                shader_type: Clutter.ShaderType.FRAGMENT_SHADER
            });

            effect.set_shader_source(aEffectSource);
            effect.set_uniform_value("tex", 0);
            effect.set_uniform_value("height", aActor.get_height());
            effect.set_uniform_value("width", aActor.get_width());
            effect.set_uniform_value("mouseX", global.get_pointer()[0]);
            effect.set_uniform_value("mouseY", global.get_pointer()[1]);
            break;
        case "desaturation":
            effect = new Clutter.DesaturateEffect();
            effect.set_factor(parseFloat(aEffectSource));
            break;
        case "contrast":
        case "brightness":
            effect = new Clutter.BrightnessContrastEffect();
            effect["set_" + aEffectParams.type + "_full"](
                parseFloat(aEffectParams.red),
                parseFloat(aEffectParams.green),
                parseFloat(aEffectParams.blue)
            );
            break;
    }

    return effect;
}

function addEffect(aEffectParams, aActor) {
    _getEffectSourceAsync(aEffectParams, (aEffectSource) => {
        let state = _getEffectState(aActor, aEffectParams.id);
        let effect = _getNewEffectInstance(aEffectSource, aEffectParams, aActor);

        if (!effect) {
            return;
        }

        aActor.add_effect_with_name(aEffectParams.id, effect);

        state.getNewEffect = function(aNewActor) {
            return _getNewEffectInstance(this.effectSource, this.effectParams, aNewActor);
        };
        state.effect = effect;
        state.effectSource = aEffectSource;
        state.effectParams = aEffectParams;
        state.effectId = aEffectParams.id;
        state.actor = aActor;

        state.actorDestroyedId = aActor.connect("destroy",
            (aA) => _resetEffectState(aA, aEffectParams.id));

        /* NOTE: Do not bother to check for effect type when adding the following signals.
         * Only Clutter.ShaderEffect types define these properties. When using any other
         * effect type, these properties are set to 0/false.
         */
        if (aEffectParams.new_frame_signal !== 0) {
            state.timeline = new Clutter.Timeline({
                duration: aEffectParams.new_frame_signal,
                repeat_count: -1
            });
            state.newFrameId = state.timeline.connect("new-frame",
                () => _newFrame(aActor, aEffectParams.id));
            state.timeline.start();
        }

        if (aEffectParams.add_size_changed_signal) {
            state.sizeChangedId = aActor.connect("size-changed",
                (aA) => _sizeChanged(aA, aEffectParams.id));
        }
    });
}

function removeEffect(aEffectId, aActor) {
    _resetEffectState(aActor, aEffectId);
}

function _getEffectState(aActor, aEffectId) {
    if (!aActor.hasOwnProperty(EFFECTS_PROP_NAME)) {
        aActor[EFFECTS_PROP_NAME] = {
            removeAllEffects: function() {
                for (let prop in this) {
                    if (this.hasOwnProperty(prop) &&
                        this[prop].hasOwnProperty("__state__")) {
                        _resetEffectState(this[prop].actor, this[prop].effectId);
                    }
                }
            }
        };
    }

    if (!aActor[EFFECTS_PROP_NAME].hasOwnProperty(aEffectId)) {
        aActor[EFFECTS_PROP_NAME][aEffectId] = {
            __state__: null,
            timeline: null,
            actorDestroyedId: 0,
            newFrameId: 0,
            sizeChangedId: 0
        };
    }

    return aActor[EFFECTS_PROP_NAME][aEffectId];
}

function _resetEffectState(aActor, aEffectId) {
    if (!aActor || (
            aActor &&
            typeof aActor.is_finalized === "function" &&
            aActor instanceof GObject.Object &&
            aActor.is_finalized()
        )) {
        return;
    }

    let state = (aActor.hasOwnProperty(EFFECTS_PROP_NAME) &&
            aActor[EFFECTS_PROP_NAME].hasOwnProperty(aEffectId)) ?
        aActor[EFFECTS_PROP_NAME][aEffectId] : null;

    if (state && state.actor) {
        for (let connectionId of ["actorDestroyedId", "newFrameId", "sizeChangedId"]) {
            if (state[connectionId] > 0) {
                state.actor.disconnect(state[connectionId]);
            }
        }

        if (state.timeline !== null) {
            state.timeline.stop();
            state.timeline = null;
        }

        aActor[EFFECTS_PROP_NAME][aEffectId] = null;
        delete aActor[EFFECTS_PROP_NAME][aEffectId];
    }

    aActor.remove_effect_by_name(aEffectId);
}

function _newFrame(aActor, aEffectId) {
    aActor[EFFECTS_PROP_NAME][aEffectId].effect
        .set_uniform_value("height", aActor.get_height());
    aActor[EFFECTS_PROP_NAME][aEffectId].effect
        .set_uniform_value("width", aActor.get_width());
    aActor[EFFECTS_PROP_NAME][aEffectId].effect
        .set_uniform_value("mouseX", global.get_pointer()[0]);
    aActor[EFFECTS_PROP_NAME][aEffectId].effect
        .set_uniform_value("mouseY", global.get_pointer()[1]);
}

function _sizeChanged(aActor, aEffectId) {
    aActor[EFFECTS_PROP_NAME][aEffectId].effect
        .set_uniform_value("height", aActor.get_height());
    aActor[EFFECTS_PROP_NAME][aEffectId].effect
        .set_uniform_value("width", aActor.get_width());
}

function _getClutterColorFromString(aColorString) {
    let clutterColor,
        res;

    if (typeof Clutter.Color.from_string !== "function") {
        clutterColor = new Clutter.Color();
        clutterColor.from_string(aColorString);
    } else {
        [res, clutterColor] = Clutter.Color.from_string(aColorString);
    }

    return clutterColor;
}

/* exported addEffect,
            removeEffect
 */
