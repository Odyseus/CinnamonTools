const {
    byteArray: ByteArray,
    gi: {
        Gio,
        GLib
    },
    misc: {
        params: Params
    },
    ui: {
        main: Main
    }
} = imports;

const {
    tryFn
} = require("js_modules/globalUtils.js");

const SpawnReaderParams = Object.freeze({
    flags: GLib.SpawnFlags.DEFAULT,
    childsetup: null
});

/**
 * Spawn command asynchronously and read output asynchronously to then pass it
 * to a callback function.
 *
 * Combines the benefits of spawn sync (easy retrieval of output) with those of spawn_async (non-blocking execution).
 * Based on: https://github.com/p-e-w/argos/blob/master/argos%40pew.worldwidemann.com/utilities.js#L247.
 *
 * @param {Object}  aParams            - Parameters.
 * @param {Integer} aParams.flags      - Flags from GLib.SpawnFlags.
 * @param {Object}  aParams.childsetup - Function to run in the child just before exec().
 *
 */
var SpawnReader = class SpawnReader {
    constructor(aParams = {}) {
        this.params = Params.parse(aParams, SpawnReaderParams);
    }

    /**
     * Spawn arguments.
     *
     * @param {String}   aWorkingDirectory - Child’s current working directory, or null to inherit parent’s.
     * @param {Array}    aArgv             - Child’s argument vector.
     * @param {String}   aEnvp             - Child’s environment, or null to inherit parent’s.
     * @param {Function} aCallback         - Function to run on execution success with the standard output as sole argument.
     */
    spawn(aWorkingDirectory, aArgv, aEnvp, aCallback) {
        let success,
            pid,
            stdinFile,
            stdoutFile,
            stderrFile;

        tryFn(() => {
            [success, pid, stdinFile, stdoutFile, stderrFile] = GLib.spawn_async_with_pipes(
                aWorkingDirectory,
                aArgv,
                aEnvp,
                this.params.flags,
                this.params.childsetup
            );
        }, (aErr) => {
            global.logError(aErr);
            Main.criticalNotify(
                __meta.uuid,
                String(aErr).split("\n")[0]
            );

        });

        if (!success) {
            return;
        }

        GLib.close(stdinFile);

        let standardOutput = "";

        const stdoutStream = this._getDataInputStream(stdoutFile);

        this.read(stdoutStream, (aOutput) => {
            if (aOutput === null) {
                stdoutStream.close(null);
                aCallback(standardOutput);
            } else {
                standardOutput += aOutput;
            }
        });

        let standardError = "";

        const stderrStream = this._getDataInputStream(stderrFile);

        this.read(stderrStream, (aError) => {
            if (aError === null) {
                stderrStream.close(null);

                if (standardError) {
                    global.logError(standardError);
                    Main.criticalNotify(
                        __meta.uuid,
                        String(standardError).split("\n")[0]
                    );
                }
            } else {
                standardError += aError;
            }
        });
    }

    /**
     * Read stream.
     *
     * @param {Gio.DataInputStream} aStream - description
     * @param {Function}            aFunc   - description
     */
    read(aStream, aFunc) {
        aStream.read_line_async(GLib.PRIORITY_LOW, null, (aSource, aResult) => {
            let [line] = aSource.read_line_finish(aResult);

            if (line === null) {
                aFunc(null);
            } else {
                if (line instanceof Uint8Array) {
                    line = ByteArray.toString(line);
                } else {
                    line = line.toString();
                }

                aFunc(`${line}\n`);
                this.read(aSource, aFunc);
            }
        });
    }

    _getDataInputStream(aFile) {
        return new Gio.DataInputStream({
            base_stream: new Gio.UnixInputStream({
                fd: aFile
            })
        });
    }
};

/* exported SpawnReader
 */
