const {
    gi: {
        Gio,
        GLib
    },
    misc: {
        fileUtils: FileUtils,
        params: Params,
        util: Util
    }
} = imports;

const DESKTOP_FILE_PARAMS = Object.freeze({
    fileName: "",
    where: "xdg",
    dataName: "",
    dataComment: "",
    dataExec: "",
    dataIcon: "",
    dataCategories: "Settings;",
    dataHidden: false,
    dataNoDisplay: false
});
const DESKTOP_FILE_TEMPLATE = "[Desktop Entry]\n\
Encoding=UTF-8\n\
Name=%%NAME%%\n\
Comment=%%COMMENT%%\n\
Type=Application\n\
Exec=%%EXEC%%\n\
Icon=%%ICON%%\n\
Categories=%%CATEGORIES%%;\n\
Hidden=%%HIDDEN%%\n\
NoDisplay=%%NODISPLAY%%\n\
";

/**
 * Save data to a file asynchronously.
 *
 * @param {String}   aData     - The data to save to a file.
 * @param {Gio.File} aFile     - The file object that will be replaced/overwritten.
 * @param {Function} aCallback - The optional callback to execute after the file has been written.
 */
function saveToFileAsync(aData, aFile, aCallback = null) {
    let data = new GLib.Bytes(aData);

    aFile.replace_async(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION,
        GLib.PRIORITY_DEFAULT, null,
        (aObj, aResponse) => {
            let stream = aObj.replace_finish(aResponse);

            stream.write_bytes_async(data, GLib.PRIORITY_DEFAULT,
                null,
                (aW_obj, aW_res) => {

                    aW_obj.write_bytes_finish(aW_res);
                    stream.close(null);

                    if (aCallback && typeof aCallback === "function") {
                        aCallback();
                    }
                });
        });
}

/**
 * List file in a directory asynchronously.
 *
 * It will gather the list of all files found inside a directory in chunks of 100
 * files at a time and then call the callback function with the array of all found
 * files as its sole argument.
 *
 * @param {Gio.File} aFileObj  - The file object (a directory) to lookup file on.
 * @param {Function} aCallback - The function to execute after gathering the list of all files.
 */
function listDirAsync(aFileObj, aCallback) {
    let allFiles = [];
    aFileObj.enumerate_children_async(Gio.FILE_ATTRIBUTE_STANDARD_NAME,
        Gio.FileQueryInfoFlags.NONE,
        GLib.PRIORITY_LOW, null,
        (aFileObj_a, aResponse_a) => {
            let enumerator = aFileObj_a.enumerate_children_finish(aResponse_a);

            function onNextFileComplete(aFileObj_b, aResponse_b) {
                let files = aFileObj_b.next_files_finish(aResponse_b);

                if (files.length) {
                    allFiles = allFiles.concat(files);
                    enumerator.next_files_async(100, GLib.PRIORITY_LOW, null, onNextFileComplete);
                } else {
                    enumerator.close(null);

                    if (aCallback && typeof aCallback === "function") {
                        aCallback(allFiles);
                    }
                }
            }
            enumerator.next_files_async(100, GLib.PRIORITY_LOW, null, onNextFileComplete);
        });
}

/**
 * Remove surplus files from a directory.
 *
 * @param {String}  aDirPath        - The path to a directory.
 * @param {Integer} aMaxFilesToKeep - The maximum number of files to keep.
 */
function removeSurplusFilesFromDirectory(aDirPath, aMaxFilesToKeep) {
    try {
        listDirAsync(Gio.file_new_for_path(aDirPath), (aAllFiles) => {
            // Generate file paths from Gio.FileInfo objects.
            let allFilesPaths = aAllFiles.map((aFile) => {
                return aDirPath + "/" + aFile.get_name();
            });

            // Sort paths in ascending order.
            allFilesPaths.sort((a, b) => {
                return a - b;
            });

            // Slice from the list the files to keep.
            let pathsToBeRemoved = allFilesPaths.slice(0, -aMaxFilesToKeep);

            // Proceed with removal.
            for (let path of pathsToBeRemoved) {
                try {
                    Gio.file_new_for_path(path).delete_async(GLib.PRIORITY_LOW, null, null);
                } catch (aErr) {
                    global.logError(aErr);
                }
            }
        });
    } catch (aErr) {
        global.logError(aErr);
    }
}

/**
 * Mark for deletion on EOL. Cinnamon 3.8.x+
 * Generating the .desktop file will not be needed, so remove the use of this function.
 *
 * Generate a .desktop file to launch an extension settings window.
 *
 * This is a workaround for extensions only (since the settings for applets can be
 * accessed from their context menus).
 *
 * The problem lies in a design flaw in certain Cinnamon versions.
 * Up to Cinnamon 3.8.x (IIRC), if using an external application for an xlet settings
 * ("external-configuration-app" key in metadata.json) and at the same time inside
 * the xlet folder exists the file settings-schema.json, then Cinnamon will not
 * open the external application, it will open instead its native settings window. To
 * overcome this, I also add a button to be displayed in the native settings system
 * to open the "real" settings window (the one defined in "external-configuration-app" key).
 * But even that will not work in certain Cinnamon versions in which buttons aren't functional.
 * And that's why I provide this function to create a .desktop file to open the "real"
 * settings window.
 *
 * @param  {String} aFileame The name that the .desktop file will have.
 * @param  {String} aWhere   Where to create the .desktop file.
 *                           xdg: The file is created at ~/.local/share/applications.
 *                           desktop: The file is created at ~/Desktop.
 */

/**
 * [generateDesktopFile description]
 * @param  {Object} aParams - description
 *                              - fileName {String}:
 *                              - where {String}:
 *                              - dataName {String}:
 *                              - dataComment {String}:
 *                              - dataExec {String}:
 *                              - dataIcon {String}:
 *                              - dataCategories {String}:
 *                              - dataHidden {Boolean}:
 *                              - dataNoDisplay {Boolean}:
 */
function generateDesktopFile(aParams) {
    let params = Params.parse(aParams, DESKTOP_FILE_PARAMS);

    let desktopFilePath = "%s/%s.desktop";

    switch (params.where) {
        case "desktop":
            desktopFilePath = desktopFilePath.format(
                GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP),
                params.fileName
            );
            break;
        case "xdg":
            desktopFilePath = desktopFilePath.format(
                GLib.get_home_dir() + "/.local/share/applications",
                params.fileName
            );
            break;
    }

    let desktopFile = Gio.file_new_for_path(desktopFilePath);
    let data = DESKTOP_FILE_TEMPLATE
        .replace("%%NAME%%", params.dataName)
        .replace("%%COMMENT%%", params.dataComment)
        .replace("%%EXEC%%", params.dataExec)
        .replace("%%ICON%%", params.dataIcon)
        .replace("%%CATEGORIES%%", params.dataCategories)
        .replace("%%HIDDEN%%", params.dataHidden ? "true" : "false")
        .replace("%%NODISPLAY%%", params.dataNoDisplay ? "true" : "false");

    saveToFileAsync(data, desktopFile, () => {
        if (FileUtils.hasOwnProperty("changeModeGFile")) {
            FileUtils.changeModeGFile(desktopFile, 755);
        } else {
            Util.spawnCommandLine('chmod +x "' + desktopFile.get_path() + '"');
        }
    });
}

/* exported removeSurplusFilesFromDirectory,
            generateDesktopFile
 */
