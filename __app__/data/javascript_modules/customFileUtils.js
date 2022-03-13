const {
    byteArray: ByteArray,
    gi: {
        Gio,
        GLib
    },
    misc: {
        params: Params
    }
} = imports;

const {
    arrayEach,
    tryFn,
    USER_DESKTOP_PATH
} = require("js_modules/globalUtils.js");

const DesktopFileParams = Object.freeze({
    file_name: "",
    where: "xdg",
    data_name: "",
    data_comment: "",
    data_exec: "",
    data_icon: "",
    data_categories: "Settings",
    data_hidden: false,
    data_no_display: false
});

const FileClassParams = Object.freeze({
    init_parent: false,
    cache_getters_data: false,
    cancellable: null
});

const ListDirParams = Object.freeze({
    attributes: Gio.FILE_ATTRIBUTE_STANDARD_NAME,
    flags: Gio.FileQueryInfoFlags.NONE,
    io_priority: GLib.PRIORITY_LOW,
    max_files_fail_safe: 100
});

const CopyFileParams = Object.freeze({
    ensure_parents: false,
    flags: Gio.FileCopyFlags.OVERWRITE | Gio.FileCopyFlags.TARGET_DEFAULT_PERMS,
    io_priority: GLib.PRIORITY_DEFAULT,
    progress_callback: null
});

const DeleteFileParams = Object.freeze({
    io_priority: GLib.PRIORITY_DEFAULT
});

const LookupFileInfoParams = Object.freeze({
    attributes: Gio.FILE_ATTRIBUTE_STANDARD_CONTENT_TYPE,
    flags: Gio.FileQueryInfoFlags.NONE,
    io_priority: GLib.PRIORITY_DEFAULT
});

const WriteParams = Object.freeze({
    ensure_parents: false
});

function getDesktopFileContent(aParams) {
    return `[Desktop Entry]
Encoding=UTF-8
Name=${aParams.data_name}
Comment=${aParams.data_comment}
Type=Application
Exec=${aParams.data_exec}
Icon=${aParams.data_icon}
Categories=${aParams.data_categories};
Hidden=${aParams.data_hidden ? "true" : "false"}
NoDisplay=${aParams.data_no_display ? "true" : "false"}
`;
}

/**
 * Helper class to work with Gio.File objects.
 *
 * NOTES:
 * - All methods return a Promise and use asynchronous methods.
 * - All getters perform synchronous operations.
 * - I don't think that implementing a move function would be a good idea so don't think about it.
 *   Mainly because I would have to update this.gio_file property with the new path/file and that
 *   just hurts thinking about it.
 * - I implemented this class in some of my xlets and so far I cleaned more than a thousand lines of
 *   code. And thanks to the Promise notation, the code is more clean and understandable.
 * - I could have integrated the write and append methods into one. But to avoid complications and
 *   errors I just keep them separated.
 *
 * Some examples:
 *
 * const file = new File("path_to_file");
 *
 * // Change file mode (set executable in this example).
 * file.chmod(755)
 *     .then((aSuccess) => global.log(aSuccess))
 *     .catch((aErr) => global.logError(aErr));
 *
 * // Copy the file to a new location.
 * file.copy("path_to_new_location")
 *     .then((aUserData) => global.log(`User data = ${aUserData}`))
 *     .catch((aErr) => global.logError(aErr));
 *
 * // Replace/Overwrite current file content.
 * file.write("new_content_for_file")
 *     .then((aSuccess) => global.log(`Data written successfully = ${aSuccess}`))
 *     .catch((aErr) => global.logError(aErr));
 *
 * // Append data to current file content.
 * file.append("extra_content_to_append_to_file")
 *     .then((aSuccess) => global.log(`Data appended successfully = ${aSuccess}`))
 *     .catch((aErr) => global.logError(aErr));
 *
 * // Delete the file.
 * file.delete()
 *     .then((aSuccess) => global.log(`Delete successful = ${aSuccess}`))
 *     .catch((aErr) => global.logError(aErr));
 *
 * @param {String|Object} aFile                      - A string representing a path/URI or an instance of Gio.File.
 * @param {Object}        aParams                    - An object containing options to selectively initializing class properties.
 * @param {Object}        aParams.init_parent        - Whether to set the this.parent property on initialization.
 *                                                     Default: false
 * @param {Object}        aParams.cache_getters_data - Whether to set the data used by the getters on initialization.
 *                                                     Default: false
 * @param {Object}        aParams.cancellable        - A Gio.Cancellable object.
 *                                                     Default: null
 *
 * @type {Class}
 */
var File = class File {
    constructor(aFile, aParams = {}) {
        const params = Params.parse(aParams, FileClassParams);

        this.cancellable = params.cancellable;
        this.gio_file = null;
        this.path = "";
        this.parent = null;
        this.parent_path = null;

        this._parent_exists = null;
        this._exists = null;
        this._file_type_query_none = null;
        this._file_type_query_nofollow_symlinks = null;

        if (!aFile) {
            return;
        }

        // NOTE: This trickery is to give time to this.gio_file to be set before attempting to set
        // the other properties. It might not be needed at all, but it doesn't hurt(?).
        tryFn(() => {
            this.gio_file = this._get_gio_file(aFile);
        }, (aErr) => {
            global.logError(aErr);
        }, () => {
            this.path = this._get_gio_file_path();
            params.init_parent && this.init_parent();
            params.cache_getters_data && this.cache_getters_data();
        });
    }

    /**
     * Cache some of the data used by the getters.
     */
    init_parent() {
        this.parent = this.gio_file ? this.gio_file.get_parent() : null;
        this.parent_path = this.parent ? this.parent.get_path() : null;
    }

    /**
     * Cache some of the data used by the getters.
     */
    cache_getters_data() {
        if (this.gio_file) {
            this._exists = this.gio_file.query_exists(this.cancellable);
            this._file_type_query_none = this.gio_file.query_file_type(
                Gio.FileQueryInfoFlags.NONE, this.cancellable
            );
            this._file_type_query_nofollow_symlinks = this.gio_file.query_file_type(
                Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, this.cancellable
            );
        }
    }

    /**
     * Get a path from an instance of a Gio.File.
     *
     * NOTE: I implemented this function mainly to avoid having to call get_path() on this.gio_file.
     * The documentation says that the string returned by get_path() should be freed with GLib.free().
     * Calling GLib.free() every single time that I use get_path() would be a chore. So I call it
     * once, store it, free it, and make it available as a property of this class.
     *
     * @return {String} An instance of Gio.File.
     */
    _get_gio_file_path() {
        if (this.gio_file) {
            const gio_file_path = this.gio_file.get_path();
            const path = `${gio_file_path}`;
            GLib.free(gio_file_path);

            return path;
        }

        return "";
    }

    /**
     * Get an instance of a Gio.File.
     *
     * @param {String|Object} aFile - A string representing a path/URI or an instance of Gio.File.
     *
     * @return {Object} An instance of Gio.File.
     */
    _get_gio_file(aFile) {
        /* WARNING: An empty string passed to Gio.File.new_for_path will return the user's home directory. ¬¬
         * Always use absolute paths. Relative paths will be always relative to user's home.
         */
        if (aFile && (typeof aFile === "string" || aFile instanceof String)) {
            aFile = aFile.trim();

            if (!aFile) {
                return null;
            }

            if (aFile.startsWith("file://")) {
                return Gio.File.new_for_uri(aFile);
            } else {
                return Gio.File.new_for_path(aFile);
            }
        } else if (aFile instanceof Gio.File) {
            return aFile;
        }

        return null;
    }

    /**
     * Copy a file into another location.
     *
     * @param   {String|Object} aDestination              - Where to copy the file.
     * @param   {Object}        aParams                   - Parameters.
     * @param   {Object}        aParams.flags             - A set of Gio.FileCopyFlags.
     *                                                      Default: Gio.FileCopyFlags.OVERWRITE | Gio.FileCopyFlags.TARGET_DEFAULT_PERMS
     * @param   {Object}        aParams.io_priority       - A GLib.PRIORITY_*.
     *                                                      Default: GLib.PRIORITY_DEFAULT
     * @param   {Object}        aParams.progress_callback - A Gio.FileProgressCallback to call back with progress information.
     *                                                      Default: null
     * @param   {Any}           aUserData                 - Data to pass to the resolve function.
     *
     * @return  {Promise}       A Promise.
     * @resolve {Any}           aUserData
     */
    copy(aDestination, aParams = {}, aUserData = null) {
        return new Promise((aResolve, aReject) => {
            if (!this.gio_file) {
                return aReject(new Error("Gio.File instance not initialized."));
            }

            // NOTE: Allow only "real files" to be copied copy.
            if (!this.is_real_file) {
                return aReject(new Error("File does not exist, is a directory or a symbolic link."));
            }

            let parentCreationError = null;
            const params = Params.parse(aParams, CopyFileParams);
            const destination = this._get_gio_file(aDestination);

            if (params.ensure_parents) {
                tryFn(() => {
                    this.ensure_parents(destination);
                }, (aErr) => {
                    parentCreationError = aErr;
                });
            }

            if (parentCreationError) {
                return aReject(parentCreationError);
            }

            this.gio_file.copy_async(
                destination,
                params.flags,
                params.io_priority,
                this.cancellable,
                params.progress_callback,
                (aSource, aResult) => {
                    tryFn(() => {
                        if (!aSource.copy_finish(aResult)) {
                            return aReject(new Error("File cannot be copied."));
                        }

                        aResolve(aUserData);
                    }, (aErr) => aReject(aErr));
                }
            );

            return undefined;
        });
    }

    /**
     * Delete a file.
     *
     * @param {Object} aParams - See _delete.
     *
     * @return  {Promise} A Promise.
     * @resolve {Boolean} If the delete operation was successful.
     */
    delete(aParams = {}) {
        return this._delete(this.gio_file, aParams);
    }

    /**
     * Read file content and do something with it.
     *
     * @return  {Promise} A Promise.
     * @resolve {String}  The read data.
     */
    read() {
        return new Promise((aResolve, aReject) => {
            if (!this.gio_file) {
                return aReject(new Error("Gio.File instance not initialized."));
            }

            // NOTE: Allow only files to be read.
            if (!this.is_file) {
                return aReject(new Error("File does not exist or is a directory."));
            }

            this.gio_file.load_contents_async(this.cancellable, (aSource, aResult) => {
                tryFn(() => {
                    let data;
                    let [success, contents] = aSource.load_contents_finish(aResult);

                    if (!success) {
                        GLib.free(contents);
                        return aReject(new Error("File cannot be read."));
                    }

                    if (contents instanceof Uint8Array) {
                        data = ByteArray.toString(contents);
                    } else {
                        data = contents.toString();
                    }

                    GLib.free(contents);
                    aResolve(data);
                }, (aErr) => aReject(aErr));
            });

            return undefined;
        });
    }

    /**
     * Append data to file.
     *
     * @param   {String}  aData - Data to append to the file.
     *
     * @return  {Promise} A Promise.
     * @resolve {Boolean} If the data was successfully written to the file.
     */
    append(aData, aParams = {}) {
        return new Promise((aResolve, aReject) => {
            if (!this.gio_file) {
                return aReject(new Error("Gio.File instance not initialized."));
            }

            let parentCreationError = null;
            const params = Params.parse(aParams, WriteParams);

            if (params.ensure_parents) {
                tryFn(() => {
                    this.ensure_parents();
                }, (aErr) => {
                    parentCreationError = aErr;
                });
            }

            if (parentCreationError) {
                return aReject(parentCreationError);
            }

            this.gio_file.append_to_async(
                Gio.FileCreateFlags.NONE,
                GLib.PRIORITY_DEFAULT,
                this.cancellable,
                (aSource1, Resource1) => {
                    tryFn(() => {
                        const stream = aSource1.append_to_finish(Resource1);

                        stream.write_bytes_async(
                            ByteArray.fromString(String(aData)),
                            GLib.PRIORITY_DEFAULT,
                            this.cancellable,
                            (aSource2, Resource2) => {
                                tryFn(() => {
                                    aSource2.write_bytes_finish(Resource2);
                                    tryFn(() => {
                                        aSource2.close_async(
                                            GLib.PRIORITY_DEFAULT,
                                            this.cancellable,
                                            (aSource3, aResult3) => {
                                                aResolve(aSource3.close_finish(aResult3));
                                            }
                                        );
                                    }, (aErr) => aReject(aErr));
                                }, (aErr) => aReject(aErr));
                            }
                        );
                    }, (aErr) => aReject(aErr));
                }
            );

            return undefined;
        });
    }

    /**
     * Write data to a file.
     *
     * @param   {String}  aData - Data to write to the file.
     *
     * @return  {Promise} A Promise.
     * @resolve {Boolean} If the data was successfully written to the file.
     */
    write(aData, aParams = {}) {
        return new Promise((aResolve, aReject) => {
            if (!this.gio_file) {
                return aReject(new Error("Gio.File instance not initialized."));
            }

            let parentCreationError = null;
            const params = Params.parse(aParams, WriteParams);

            if (params.ensure_parents) {
                tryFn(() => {
                    this.ensure_parents();
                }, (aErr) => {
                    parentCreationError = aErr;
                });
            }

            if (parentCreationError) {
                return aReject(parentCreationError);
            }

            const write = (aStream) => {
                aStream.truncate(0, this.cancellable);
                aStream.output_stream.write_bytes_async(
                    ByteArray.fromString(String(aData)),
                    GLib.PRIORITY_DEFAULT,
                    this.cancellable,
                    (aSource1, aResult1) => {
                        aSource1.write_bytes_finish(aResult1);
                        aSource1.flush_async(
                            GLib.PRIORITY_DEFAULT,
                            this.cancellable,
                            (aSource2, aResult2) => {
                                aSource2.flush_finish(aResult2);
                                aSource2.close_async(
                                    GLib.PRIORITY_DEFAULT,
                                    this.cancellable,
                                    (aSource3, aResult3) => {
                                        aResolve(aSource3.close_finish(aResult3));
                                    }
                                );
                            }
                        );
                    }
                );
            };

            this.gio_file.create_readwrite_async(
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                GLib.PRIORITY_DEFAULT,
                this.cancellable,
                (aSource1, aResult1) => {
                    tryFn(() => {
                        write(aSource1.create_readwrite_finish(aResult1));
                    }, (aErr1) => { // jshint ignore:line
                        tryFn(() => {
                            aSource1.open_readwrite_async(
                                GLib.PRIORITY_DEFAULT,
                                this.cancellable,
                                (aSource2, aResult2) => {
                                    write(aSource2.open_readwrite_finish(aResult2));
                                }
                            );
                        }, (aErr2) => aReject(aErr2));
                    });
                }
            );

            return undefined;
        });
    }

    /**
     * List the content of a directory.
     *
     * @param   {Object}       aParams                     - Parameters.
     * @param   {String|Array} aParams.attributes          - One or more Gio.FILE_ATTRIBUTE_*s.
     *                                                       Default: Gio.FILE_ATTRIBUTE_STANDARD_NAME
     * @param   {Integer}      aParams.flags               - A set of Gio.FileQueryInfoFlags.
     *                                                       Default: Gio.FileQueryInfoFlags.NONE
     * @param   {Integer}      aParams.io_priority         - A GLib.PRIORITY_*.
     *                                                       Default: GLib.PRIORITY_LOW
     * @param   {Integer}      aParams.max_files_fail_safe - Maximum amount of files to retrieve.
     *                                                       Default: 100
     *
     * @return  {Promise}      A Promise.
     * @resolve {Object}       Object.files_info           - A list of Gio.FileInfos.
     * @resolve {Object}       Object.fail_safe_breached   - If max_files_fail_safe was breached.
     */
    listDir(aParams = {}) {
        return new Promise((aResolve, aReject) => {
            if (!this.gio_file) {
                return aReject(new Error("Gio.File instance not initialized."));
            }

            if (!this.is_directory) {
                return aReject(new Error("File isn't a directory."));
            }

            const params = Params.parse(aParams, ListDirParams);

            this.gio_file.enumerate_children_async(
                this._handleAttributes(params.attributes),
                params.flags,
                params.io_priority,
                this.cancellable,
                (aSource1, aResponse1) => {
                    const enumerator = aSource1.enumerate_children_finish(aResponse1);
                    let allFiles = [],
                        allFilesLength = 0,
                        failSafeBreached = false;

                    tryFn(() => {
                        const onNextFileComplete = (aSource2, aResponse2) => {
                            const files = aSource2.next_files_finish(aResponse2);
                            const filesLength = files.length;
                            allFilesLength += filesLength;
                            failSafeBreached = allFilesLength > params.max_files_fail_safe;

                            if (filesLength && !failSafeBreached) {
                                allFiles = [...allFiles, ...files];
                                enumerator.next_files_async(100, params.io_priority, this.cancellable, onNextFileComplete);
                            } else {
                                enumerator.close(this.cancellable);
                                aResolve({
                                    files_info: allFiles,
                                    fail_safe_breached: failSafeBreached
                                });
                            }
                        };

                        enumerator.next_files_async(100, params.io_priority, this.cancellable, onNextFileComplete);
                    }, (aErr) => aReject(aErr));
                });

            return undefined;
        });
    }

    /**
     * Change file mode bits.
     *
     * TODO: I can't figure out how to get the UInt32 value and convert it back to octal.
     * I only want to be able to get the value of the Gio.FILE_ATTRIBUTE_UNIX_MODE attribute
     * before and after setting it and display it in a legible form and not just a couple
     * of numbers that mean nothing.
     *
     * @param   {Octal} aOctal      - An octal number representing the bit pattern for the new mode bits.
     *
     * @return  {Promise} A Promise.
     * @resolve {Boolean} If the operation was successful.
     */
    chmod(aOctal) {
        return this.info({
            attributes: Gio.FILE_ATTRIBUTE_UNIX_MODE,
            flags: Gio.FileQueryInfoFlags.NONE
        }).then((aFileInfo) => {
            return new Promise((aResolve, aReject) => {
                tryFn(() => {
                    aFileInfo.set_attribute_uint32(Gio.FILE_ATTRIBUTE_UNIX_MODE, parseInt(aOctal, 8));
                    aResolve(this.gio_file.set_attributes_from_info(
                        aFileInfo,
                        Gio.FileQueryInfoFlags.NONE,
                        this.cancellable
                    ));
                }, (aErr) => aReject(aErr));
            });
            // FIXME: Is this the right way? What should I actually do here?
        }).catch((aErr) => {
            return new Promise((aResolve, aReject) => {
                aReject(aErr);
            });
        });
    }

    /**
     * Make directory.
     *
     * NOTE: I have no use for this since I mostly do file operations that call this.ensure_parents.
     * Keeping it just in case.
     *
     * @return {Promise} A Promise.
     */
    mkdir() {
        return new Promise((aResolve, aReject) => {
            tryFn(() => {
                this.ensure_parents();
            }, (aErr) => {
                aReject(aErr);
            }, () => {
                this.gio_file.make_directory_async(
                    GLib.PRIORITY_DEFAULT,
                    this.cancellable,
                    (aSource, aResponse) => {
                        tryFn(() => {
                            aResolve(aSource.make_directory_finish(aResponse));
                        }, (aErr) => aReject(aErr));
                    }
                );

            });
        });
    }

    /**
     * Lookup file info.
     *
     * @param   {Object}       aParams             - Parameters.
     * @param   {String|Array} aParams.attributes  - One or more Gio.FILE_ATTRIBUTE_*s.
     *                                               Default: Gio.FILE_ATTRIBUTE_STANDARD_CONTENT_TYPE
     * @param   {Integer}      aParams.flags       - A set of Gio.FileQueryInfoFlags.
     *                                               Default: Gio.FileQueryInfoFlags.NONE
     * @param   {Integer}      aParams.io_priority - A GLib.PRIORITY_*.
     *                                               Default: GLib.PRIORITY_DEFAULT
     *
     * @return  {Promise}      A Promise.
     * @resolve {Object}       A Gio.FileInfo object.
     */
    info(aParams = {}) {
        return new Promise((aResolve, aReject) => {
            if (!this.gio_file) {
                return aReject(new Error("Gio.File instance not initialized."));
            }

            const params = Params.parse(aParams, LookupFileInfoParams);

            this.gio_file.query_info_async(
                this._handleAttributes(params.attributes),
                params.flags,
                params.io_priority,
                this.cancellable,
                (aSource, aResult) => {
                    tryFn(() => {
                        const fileInfo = aSource.query_info_finish(aResult);
                        aResolve(fileInfo);
                    }, (aErr) => aReject(aErr));
                }
            );

            return undefined;
        });
    }

    /**
     * Delete a file.
     *
     * NOTE: This method is "private" because in my initial "mental sketch" for this class I
     * planned to re-use it from other functions.
     *
     * @param   {String|Object} aFile               - The file to delete.
     * @param   {Object}        aParams             - Parameters.
     * @param   {Integer}       aParams.io_priority - A GLib.PRIORITY_*.
     *                                                Default: GLib.PRIORITY_DEFAULT
     *
     * @return  {Promise}       A Promise.
     * @resolve {Boolean}       If the delete operation was successful.
     */
    _delete(aFile, aParams = {}) {
        return new Promise((aResolve, aReject) => {
            const gio_file = this._get_gio_file(aFile);

            if (!gio_file) {
                return aReject(new Error("Gio.File instance not initialized."));
            }

            const params = Params.parse(aParams, DeleteFileParams);

            gio_file.delete_async(
                params.io_priority,
                this.cancellable,
                (aSource, aResponse) => {
                    tryFn(() => {
                        const result = aSource.delete_finish(aResponse);
                        aResolve(result);
                    }, (aErr) => {
                        if (aErr.matches(aErr.domain, Gio.IOErrorEnum.NOT_FOUND)) {
                            aResolve(true);
                        } else {
                            aReject(aErr);
                        }
                    });
                }
            );

            return undefined;
        });
    }

    /**
     * Ensure that all parent directories exist.
     *
     * NOTE: This method accepts a Gio.File because it isn't just used to ensure this.gio_file
     * parents, it's also used in the File.copy method to ensure the parents of the destination.
     *
     * @param {Object} aGioFile - A Gio.File.
     */
    ensure_parents(aGioFile = null) {
        let parent = null;

        if (aGioFile) {
            parent = aGioFile.get_parent();
        } else {
            parent = (this.parent === null && this.gio_file) ?
                this.gio_file.get_parent() :
                this.parent;
        }

        if (parent && !parent.query_exists(this.cancellable)) {
            parent.make_directory_with_parents(this.cancellable);
        }
    }

    /**
     * Handle attributes.
     *
     * This allows to pass an array of Gio.FILE_ATTRIBUTE_*s without having to specify a
     * string with the raw values and without having to build a string with the needed
     * Gio.FILE_ATTRIBUTE_* constants.
     *
     * @param {String|Array} aAttributes - The attribute/s to handle.
     *
     * @return {String} The handled attributes.
     */
    _handleAttributes(aAttributes) {
        return Array.isArray(aAttributes) ? aAttributes.join(",") : aAttributes;
    }

    /**
     * @return {Boolean} If the self file is set and it exists in the file system.
     */
    get exists() {
        return this.gio_file && this.path &&
            (this._exists === null ? this.gio_file.query_exists(this.cancellable) : this._exists);
    }

    /**
     * @return {Boolean} If the self file is a directory.
     */
    get is_directory() {
        return this.exists &&
            (this._file_type_query_none === null ?
                this.gio_file.query_file_type(Gio.FileQueryInfoFlags.NONE, this.cancellable) :
                this._file_type_query_none) === Gio.FileType.DIRECTORY;
    }

    /**
     * @return {Boolean} If the self file is a real directory and not a symbolic link to one.
     */
    get is_real_directory() {
        return this.is_directory && !this.is_symlink;
    }

    /**
     * @return {Boolean} If the self file is a file.
     */
    get is_file() {
        return this.exists &&
            (this._file_type_query_none === null ?
                this.gio_file.query_file_type(Gio.FileQueryInfoFlags.NONE, this.cancellable) :
                this._file_type_query_none) === Gio.FileType.REGULAR;
    }

    /**
     * @return {Boolean} If the self file is a real file and not a symbolic link to one.
     */
    get is_real_file() {
        return this.is_file && !this.is_symlink;
    }

    /**
     * @return {Boolean} If the self file is a symbolic link.
     */
    get is_symlink() {
        return this.exists &&
            (this._file_type_query_nofollow_symlinks === null ?
                this.gio_file.query_file_type(Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, this.cancellable) :
                this._file_type_query_nofollow_symlinks) === Gio.FileType.SYMBOLIC_LINK;
    }

    /**
     * @return {Boolean} If the self file is executable.
     */
    get is_executable() {
        return this.exists && !this.is_directory && GLib.file_test(this.path, GLib.FileTest.IS_EXECUTABLE);
    }

    /**
     * @return {Boolean} If the self file is executable.
     */
    get parent_exists() {
        return this.parent && this.parent.query_exists(this.cancellable) &&
            (this._file_type_query_none === null ?
                this.parent.query_file_type(Gio.FileQueryInfoFlags.NONE, this.cancellable) :
                this._file_type_query_none) === Gio.FileType.DIRECTORY;
    }

    destroy() {
        this.gio_file = null;
        this.path = "";
        this.parent = null;
        this.parent_path = null;
        this._parent_exists = null;
        this._exists = null;
        this._file_type_query_none = null;
        this._file_type_query_nofollow_symlinks = null;
    }
};

/**
 * Remove surplus files from a directory.
 *
 * This function is mainly used with directories that store particular types of files. For example,
 * dated log files or dated backup files in which the file names are "homogeneous".
 *
 * NOTE: I didn't dare to add this function as a method of File. It's too risky of a function to
 * have at hand on every instance of File. Plus, I want to keep the File class as light as possible.
 *
 * @param {String|Object} aDirPath        - The path to a directory.
 * @param {Integer}       aMaxFilesToKeep - The maximum number of files to keep.
 */
function removeSurplusFilesFromDirectory(aDir, aMaxFilesToKeep) {
    const dir = new File(aDir);
    // NOTE: File.listDir already checks if we are dealing with a directory.
    dir.listDir().then((aParams) => { // jshint ignore:line
        const allFiles = aParams.files_info.map((aFileInfo) => { // NOTE: Generate paths from Gio.FileInfo.
            return `${dir.path}/${aFileInfo.get_name()}`;
        }).sort((a, b) => { // NOTE: Sort paths.
            return a - b;
        });

        // NOTE: Slice the paths of the files that are going to be deleted and convert them
        // to file objects.
        const filesToBeRemoved = allFiles.slice(0, -aMaxFilesToKeep).map((aFilePath) => {
            return new File(aFilePath);
        });

        // NOTE: <3 https://stackoverflow.com/a/38574458
        // We create the start of a promise chain
        let chain = Promise.resolve();

        // And append each function in the array to the promise chain
        arrayEach(filesToBeRemoved, (aFile) => {
            chain = chain.then(() => aFile.delete());
        });
    }).catch((aErr) => global.logError(aErr));
}

/**
 * Generate a .desktop file to launch an extension settings window.
 *
 * I use an external application to manage my extensions settings. Generating a .desktop file
 * conveniently generates a shortcut that can be launched from the applications menu without the
 * need to open Cinnamon's extensions manager to open an extension's settings window.
 *
 * NOTE: The following notes are kept for historical reasons and are no longer relevant.
 *
 * Generating the .desktop file will not be needed, so remove the use of this function.
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
 * @param {Object}  aParams                - Parameters.
 * @param {String}  aParams.file_name       - The name that the .desktop file will have.
 *                                           Default: Empty
 * @param {String}  aParams.where          - Where to create the .desktop file.
 *                                           xdg: The file is created at ~/.local/share/applications.
 *                                           desktop: The file is created at ~/Desktop.
 *                                           Default: xdg
 * @param {String}  aParams.data_name       - The Name key in the .desktop file.
 *                                           Default: Empty
 * @param {String}  aParams.data_comment    - The Comment key in the .desktop file.
 *                                           Default: Empty
 * @param {String}  aParams.data_exec       - The Exec key in the .desktop file.
 *                                           Default: Empty
 * @param {String}  aParams.data_icon       - The Icon key in the .desktop file.
 *                                           Default: Empty
 * @param {String}  aParams.data_categories - The Categories key in the .desktop file.
 *                                           Default: Settings
 * @param {Boolean} aParams.data_hidden     - The Hidden key in the .desktop file.
 *                                           Default: false
 * @param {Boolean} aParams.data_no_display  - The NoDisplay key in the .desktop file.
 *                                           Default: false
 */
function generateDesktopFile(aParams) {
    const params = Params.parse(aParams, DesktopFileParams);

    let desktopFilePath = "%s/%s.desktop";

    switch (params.where) {
        case "desktop":
            desktopFilePath = desktopFilePath.format(USER_DESKTOP_PATH, params.file_name);
            break;
        case "xdg":
            desktopFilePath = desktopFilePath.format(
                `${GLib.get_home_dir()}/.local/share/applications`,
                params.file_name
            );
            break;
    }

    const desktopFile = new File(desktopFilePath);

    desktopFile.write(getDesktopFileContent(params)).then(() => {
        desktopFile.chmod(755).catch((aErr) => global.logError(aErr));
    }).catch((aErr) => global.logError(aErr));
}

/* exported File,
            generateDesktopFile,
            removeSurplusFilesFromDirectory
 */
