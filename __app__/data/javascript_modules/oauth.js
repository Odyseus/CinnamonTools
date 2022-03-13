var OAuth = {
    nonce_CHARS: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",

    timestamp: function timestamp() {
        const t = new Date().getTime();
        return Math.floor(t / 1000);
    },

    nonce: function nonce(length) {
        const chars = this.nonce_CHARS;
        let result = "";
        for (let i = 0; i < length; ++i) {
            const rnum = Math.floor(Math.random() * chars.length);
            result += chars.substring(rnum, rnum + 1);
        }
        return result;
    },

    buildBaseString: function(baseURI, method, params) {
        const r = [];

        for (const key in params) {
            r.push(key + "=" + this.percentEncode(params[key]));
        }

        /* NOTE: From Yahoo! API documentation.
         * Make sure all the query parameters ("location", "format", "u", etc) along with
         * oauth parameters are sorted and encoded when generating the signature.
         */
        return method + "&" + this.percentEncode(baseURI) + "&" + this.percentEncode(r.sort().join("&"));
    },

    buildAuthorizationHeader: function(oauth) {
        let h = "OAuth ";
        const values = [];

        for (const key in oauth) {
            if (key === "oauth_signature") {
                values.push(key + '="' + oauth[key] + '"');
            } else {
                values.push(key + '="' + this.percentEncode(oauth[key]) + '"');
            }
        }

        h += values.join(",");
        return h;
    },

    addToURL: function(url, parameters) {
        let newURL = url;
        if (parameters !== null) {
            const toAdd = this.formEncode(parameters);
            if (toAdd.length > 0) {
                const q = url.indexOf("?");
                if (q < 0) {
                    newURL += "?";
                } else {
                    newURL += "&";
                }
                newURL += toAdd;
            }
        }
        return newURL;
    },

    formEncode: function(parameters) {
        let form = "";
        const list = this.getParameterList(parameters);
        for (let p = 0; p < list.length; ++p) {
            let value = list[p][1];
            if (value === null) {
                value = "";
            }
            if (form !== "") {
                form += "&";
            }
            form += this.percentEncode(list[p][0]) + "=" + this.percentEncode(value);
        }
        return form;
    },

    getParameterList: function getParameterList(parameters) {
        if (parameters === null) {
            return [];
        }
        if (typeof parameters !== "object") {
            return this.decodeForm(parameters + "");
        }
        if (Array.isArray(parameters)) {
            return parameters;
        }
        const list = [];
        for (const p in parameters) {
            list.push([
                p,
                parameters[p]
            ]);
        }
        return list;
    },

    decodeForm: function decodeForm(form) {
        const list = [];
        const nvps = form.split("&");
        for (let n = 0; n < nvps.length; ++n) {
            const nvp = nvps[n];
            if (nvp === "") {
                continue;
            }
            const equals = nvp.indexOf("=");
            let name;
            let value;
            if (equals < 0) {
                name = this.decodePercent(nvp);
                value = null;
            } else {
                name = this.decodePercent(nvp.substring(0, equals));
                value = this.decodePercent(nvp.substring(equals + 1));
            }
            list.push([
                name,
                value
            ]);
        }
        return list;
    },

    percentEncode: function percentEncode(s) {
        if (s === null) {
            return "";
        }
        if (Array.isArray(s)) {
            let e = "";
            for (let i = 0; i < s.length; ++s) {
                if (e !== "") {
                    e += "&";
                }
                e += this.percentEncode(s[i]);
            }
            return e;
        }
        s = encodeURIComponent(s);
        s = s.replace(/\!/g, "%21");
        s = s.replace(/\*/g, "%2A");
        s = s.replace(/\'/g, "%27");
        s = s.replace(/\(/g, "%28");
        s = s.replace(/\)/g, "%29");
        return s;
    },

    decodePercent: function decodePercent(s) {
        if (s !== null) {
            s = s.replace(/\+/g, " ");
        }
        return decodeURIComponent(s);
    }
};

/* exported OAuth
 */
