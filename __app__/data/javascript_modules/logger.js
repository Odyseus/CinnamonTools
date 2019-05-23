/* NOTE: I don't use this class anymore, but it works very well and it would
 * be a shame to discard it.
 */

/**
 * A logger that logs the file name and line number where the log function was called.
 *
 * Implemented using the functions found in: http://stackoverflow.com/a/13227808.
 *
 * @param {String}  aDisplayName      - An identifiable name that will be prefixed to all log messages.
 * @param {Boolean} aVerbose          - Log the debug level messages.
 * @param {Number}  aSuperfluousCalls - How many superfluous calls to remove from the error stack.
 */
function Logger() {
    this._init.apply(this, arguments);
}

Logger.prototype = {
    _init: function(aDisplayName, aVerbose = false, aSuperfluousCalls = 3) {
        this._verbose = aVerbose;
        this._superfluous = aSuperfluousCalls;
        this.base_message = "[" + aDisplayName + "::%s]%s";
    },

    _log: function(aLevel, aMsg, aIsRuntime) {
        if (typeof aMsg === "object") {
            /* NOTE: Logging function in global can handle objects.
             */
            global[aLevel](this.base_message.format(
                aIsRuntime ? "" : this._getCaller(),
                this._formatMessage("")
            ));
            global[aLevel](aMsg);
        } else {
            global[aLevel](this.base_message.format(
                aIsRuntime ? "" : this._getCaller(),
                this._formatMessage(aMsg)
            ));
        }
    },

    /**
     * runtime_error
     *
     * Log a message without specifying the caller.
     *
     * @param  {String} aMsg The message to log.
     */
    runtime_error: function(aMsg) {
        this._log("logError", aMsg, true);
    },

    /**
     * runtime_info
     *
     * Log a message without specifying the caller.
     *
     * @param  {String} aMsg The message to log.
     */
    runtime_info: function(aMsg) {
        this._log("log", aMsg, true);
    },

    /**
     * debug
     *
     * Log a message only when verbose logging is enabled.
     *
     * @param  {String} aMsg The message to log.
     */
    debug: function(aMsg) {
        if (this.verbose) {
            this._log("log", aMsg);
        }
    },

    /**
     * error
     *
     * Log an error message.
     *
     * @param  {String} aMsg The message to log.
     */
    error: function(aMsg) {
        this._log("logError", aMsg);
    },

    /**
     * warning
     *
     * Log a warning message.
     *
     * @param  {String} aMsg The message to log.
     */
    warning: function(aMsg) {
        this._log("logWarning", aMsg);
    },

    /**
     * info
     *
     * Log an info message.
     *
     * @param {String} aMsg - The message to log.
     */
    info: function(aMsg) {
        this._log("log", aMsg);
    },

    /**
     * _formatMessage
     *
     * It just adds a space at the beginning of a string if the string isn't empty.
     *
     * @param  {String} aMsg The message to "format".
     * @return {String}      The formatted message.
     */
    _formatMessage: function(aMsg) {
        return aMsg ? " " + aMsg : "";
    },

    /**
     * [_getCaller description]
     * @return {String} A string representing the caller function name plus the
     * file name and line number.
     */
    _getCaller: function() {
        let stack = this._getStack();

        // Remove superfluous function calls on stack
        stack.shift(); // _getCaller --> _getStack
        stack.shift(); // debug --> _getCaller

        let caller = stack[0].split("/");
        // Return only the caller function and the file name and line number.
        return (caller.shift() + "@" + caller.pop()).replace(/\@+/g, "@");
    },

    _getStack: function() {
        // Save original Error.prepareStackTrace
        let origPrepareStackTrace = Error.prepareStackTrace;

        // Override with function that just returns `stack`
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };

        // Create a new `Error`, which automatically gets `stack`
        let err = new Error();

        // Evaluate `err.stack`, which calls our new `Error.prepareStackTrace`
        let stack = err.stack.split("\n");

        // Restore original `Error.prepareStackTrace`
        Error.prepareStackTrace = origPrepareStackTrace;

        // Remove superfluous function call on stack
        let i = this._superfluous;
        while (i--) {
            stack.shift();
        }

        return stack;
    },

    get verbose() {
        return this._verbose;
    },

    set verbose(aVal) {
        this._verbose = aVal;
    }
};
