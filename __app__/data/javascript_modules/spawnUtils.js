let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui["{{XLET_SYSTEM}}"]["{{XLET_META}}"]["{{UUID}}"];
}

const {
    gi: {
        Gio,
        GLib
    },
    ui: {
        main: Main
    }
} = imports;

/**
 * Spawn command asynchronously and read output asynchronously to then pass it
 * to a callback function.
 *
 * Combines the benefits of spawn sync (easy retrieval of output)
 * with those of spawn_async (non-blocking execution).
 * Based on: https://github.com/p-e-w/argos/blob/master/argos%40pew.worldwidemann.com/utilities.js#L247.
 */
var SpawnReader = function() {};

/**
 * Spawn arguments.
 *
 * @param {String}                        aWorkingDirectory - Child’s current working directory, or null to inherit parent’s.
 * @param {Array}                         aArgv             - Child’s argument vector.
 * @param {String}                        aEnvp             - Child’s environment, or null to inherit parent’s.
 * @param {GLib.SpawnFlags}               aFlags            - Flags from GLib.SpawnFlags.
 * @param {GLib.SpawnChildSetupFunc\null} aChildSetup       - Function to run in the child just before exec().
 * @param {Function}                      aCallback         - Function to run on execution success with the standard output as sole argument.
 */
SpawnReader.prototype.spawn = function(aWorkingDirectory, aArgv, aEnvp, aFlags, aChildSetup, aCallback) {
    let success,
        pid,
        stdinFile,
        stdoutFile,
        stderrFile;

    try {
        [success, pid, stdinFile, stdoutFile, stderrFile] = // jshint ignore:line
        GLib.spawn_async_with_pipes(aWorkingDirectory, aArgv, aEnvp, aFlags, aChildSetup);
    } catch (aErr) {
        global.logError(aErr);
        Main.criticalNotify(
            XletMeta.uuid,
            String(aErr).split("\n")[0]
        );
    }

    if (!success) {
        return;
    }

    GLib.close(stdinFile);

    let standardOutput = "";

    let stdoutStream = new Gio.DataInputStream({
        base_stream: new Gio.UnixInputStream({
            fd: stdoutFile
        })
    });

    this.read(stdoutStream, (aOutput) => {
        if (aOutput === null) {
            stdoutStream.close(null);
            aCallback(standardOutput);
        } else {
            standardOutput += aOutput;
        }
    });

    let standardError = "";

    let stderrStream = new Gio.DataInputStream({
        base_stream: new Gio.UnixInputStream({
            fd: stderrFile
        })
    });

    this.read(stderrStream, (aError) => {
        if (aError === null) {
            stderrStream.close(null);

            if (standardError) {
                global.logError(standardError);
                Main.criticalNotify(
                    XletMeta.uuid,
                    String(standardError).split("\n")[0]
                );
            }
        } else {
            standardError += aError;
        }
    });
};

/**
 * Read stream.
 *
 * @param {Gio.DataInputStream} aStream - description
 * @param {Function}            aFunc   - description
 */
SpawnReader.prototype.read = function(aStream, aFunc) {
    aStream.read_line_async(GLib.PRIORITY_LOW, null, (aSource, aResult) => {
        let [line] = aSource.read_line_finish(aResult);

        if (line === null) {
            aFunc(null);
        } else {
            aFunc(String(line) + "\n");
            this.read(aSource, aFunc);
        }
    });
};
