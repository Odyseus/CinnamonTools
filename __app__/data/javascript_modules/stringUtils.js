/**
 * String manipulation function that are rarely used.
 */
/**
 * Convert HTML to plain text.
 *
 * @param {String} aHtml - The string to convert.
 *
 * @return {String} The converted string.
 */
function html2text(aHtml) {
    return aHtml.replace("<br/>", "\n")
        .replace("</p>", "\n")
        .replace(/<\/h[0-9]>/g, "\n\n")
        .replace(/<.*?>/g, "")
        .replace("&nbsp;", " ")
        .replace("&quot;", '"')
        .replace("&rdquo;", '"')
        .replace("&ldquo;", '"')
        .replace("&#8220;", '"')
        .replace("&#8221;", '"')
        .replace("&rsquo;", "'")
        .replace("&lsquo;", "'")
        .replace("&#8216;", "'")
        .replace("&#8217;", "'")
        .replace("&#8230;", "...");
}

/**
 * Convert HTML to Pango markup.
 *
 * @param {String} aHtml - The string to convert.
 *
 * @return {String} The converted string.
 */
function html2pango(aHtml) {
    const esc_open = "-@~]";
    const esc_close = "]~@-";

    // </p> <br/> --> newline
    let ret = aHtml.replace("<br/>", "\n").replace("</p>", "\n")
        // &nbsp; --> space
        .replace(/&nbsp;/g, " ")
        // Headings --> <b> + 2*newline
        .replace(/<h[0-9]>/g, `${esc_open}span weight="bold"${esc_close}`)
        .replace(/<\/h[0-9]>\s*/g, `${esc_open}/span${esc_close}\n\n`)
        // <strong> -> <b>
        .replace("<strong>", `${esc_open}b${esc_close}`)
        .replace("</strong>", `${esc_open}/b${esc_close}`)
        // <i> -> <i>
        .replace("<i>", `${esc_open}i${esc_close}`)
        .replace("</i>", `${esc_open}/i${esc_close}`)
        // Strip remaining tags
        .replace(/<.*?>/g, "");

    // Replace escaped <, > with actual angle-brackets
    const re1 = new RegExp(esc_open, "g");
    const re2 = new RegExp(esc_close, "g");
    ret = ret.replace(re1, "<").replace(re2, ">");

    return ret.replace(/[\r\n]+/g, "\n");
}

/**
 * An implementation of the escape/unescape JavaScript functions that are now deprecated.
 *
 * Why? Because sometimes un/escapeURI or un/escapeURIComponent aren't enough!!
 *
 * @type {Object}
 */
var escapeUnescapeReplacer = {
    escapeHash: {
        _: (input) => {
            let ret = escapeUnescapeReplacer.escapeHash[input];
            if (!ret) {
                if (input.length - 1) {
                    ret = String.fromCharCode(parseInt(input.substring(input.length - 3 ? 2 : 1), 16));
                } else {
                    const code = input.charCodeAt(0);
                    ret = code < 256 ? "%" + (0 + code.toString(16)).slice(-2).toUpperCase() : "%u" + ("000" + code.toString(16)).slice(-4).toUpperCase();
                }
                escapeUnescapeReplacer.escapeHash[ret] = input;
                escapeUnescapeReplacer.escapeHash[input] = ret;
            }
            return ret;
        }
    },

    escape: (aStr) => {
        return aStr.toString().replace(/[^\w @\*\-\+\.\/]/g, (aChar) => {
            return escapeUnescapeReplacer.escapeHash._(aChar);
        });
    },

    unescape: (aStr) => {
        return aStr.toString().replace(/%(u[\da-f]{4}|[\da-f]{2})/gi, (aSeq) => {
            return escapeUnescapeReplacer.escapeHash._(aSeq);
        });
    }
};

/* exported html2text,
            html2pango
 */
