import choose  from '../../fn/modules/choose.js';
import id      from '../../fn/modules/id.js';

const assign = Object.assign;

/*
config

```{
    headers:    fn(data),    // Must return an object with properties to add to the header
    body:       fn(data),    // Must return an object to send as data
    onresponse: function(response)
}```
*/

export const config = {
    // Takes data, returns headers
    headers: function(data) { return {}; },

    // Takes data (can be FormData object or plain object), returns data
    body: id,

    // Takes response, returns response
    onresponse: function(response) {
        // If redirected, navigate the browser away from here. Can get
        // annoying when receiving 404s, maybe not a good default...
        if (response.redirected) {
            window.location = response.url;
            return;
        }

        return response;
    }
};

const createHeaders = choose({
    'application/x-www-form-urlencoded': function(headers) {
        return assign(headers, {
            "Content-Type": 'application/x-www-form-urlencoded',
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'application/json': function(headers) {
        return assign(headers, {
            "Content-Type": "application/json; charset=utf-8",
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'multipart/form-data': function(headers) {
        return assign(headers, {
            "Content-Type": 'multipart/form-data',
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'audio/wav': function(headers) {
        return assign(headers, {
            "Content-Type": 'audio/wav',
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'default': function(headers) {
        return assign(headers, {
            "Content-Type": 'application/x-www-form-urlencoded',
            "X-Requested-With": "XMLHttpRequest"
        });
    }
});

const createBody = choose({
    'application/json': function(data) {
        return data.get ?
            formDataToJSON(data) :
            JSON.stringify(data);
    },

    'application/x-www-form-urlencoded': function(data) {
        return data.get ?
            formDataToQuery(data) :
            dataToQuery(data) ;
    },

    'multipart/form-data': function(data) {
        // Mmmmmhmmm?
        return data.get ?
            data :
            dataToFormData(data) ;
    }
});

function formDataToJSON(formData) {
    return JSON.stringify(
        // formData.entries() is an iterator, not an array
        Array
        .from(formData.entries())
        .reduce(function(output, entry) {
            output[entry[0]] = entry[1];
            return output;
        }, {})
    );
}

function formDataToQuery(data) {
    return new URLSearchParams(data).toString();
}

function dataToQuery(data) {
    return Object.keys(data).reduce((params, key) => {
        params.append(key, data[key]);
        return params;
    }, new URLSearchParams());
}

function dataToFormData(data) {
    throw new Error('TODO: dataToFormData(data)');
}

function urlFromData(url, data) {
    // Form data
    return data instanceof FormData ?
        url + '?' + formDataToQuery(data) :
        url + '?' + dataToQuery(data) ;
}

function createOptions(method, data, head, controller) {
    const contentType =
        typeof head === 'string' ? head :
        head && head['Content-Type'] ||
        'application/json' ;

    const headers = createHeaders(contentType, assign(
        config.headers && data ? config.headers(data) : {},
        typeof head === 'string' ? {} : head
    ));

    const options = {
        method:  method,
        headers: headers,
        credentials: 'same-origin',
        signal: controller && controller.signal
    };

    if (method !== 'GET') {
        options.body = createBody(contentType, config.body ? config.body(data) : data);
    }

    return options;
}

const responders = {
    'text/html': respondText,
    'application/json': respondJSON,
    'multipart/form-data': respondForm,
    'application/x-www-form-urlencoded': respondForm,
    'audio': respondBlob,
    'audio/wav': respondBlob,
    'audio/m4a': respondBlob
};

function respondBlob(response) {
    return response.blob();
}

function respondJSON(response) {
    return response.json().catch((e) => {
        throw new Error('Cannot parse JSON ' + response.url + '. ' + e.message + '');
    });
}

function respondForm(response) {
    return response.formData();
}

function respondText(response) {
    return response.text();
}

function respond(response) {
    if (config.onresponse) {
        response = config.onresponse(response);
    }

    if (!response.ok) {
        throw new Error(response.statusText + '');
    }

    // Get mimetype from Content-Type, remembering to hoik off any
    // parameters first
    const mimetype = response.headers
    .get('Content-Type')
    .replace(/\;.*$/, '');

    return responders[mimetype](response);
}


/**
request(method, url, data, mimetype | headers)

Uses `fetch()` to send a request to `url`. Where `type` is `"GET"`, `data` is
serialised and appended to the URL, otherwise it is sent as a request body.
The 4th parameter may be a content type string or a headers object (in which
case it must have a `'Content-Type'` property).
**/

export default function request(method = 'GET', url, data, contenttype = 'application/json') {
    if (url.startsWith('application/') || url.startsWith('multipart/') || url.startsWith('text/') || url.startsWith('audio/')) {
        throw new Error('request(method, url, data, contenttype) parameter order has changed. You passed (method, contenttype, url, data).');
    }

    method = method.toUpperCase();

    // If this is a GET and there is data, append data to the URL query string
    if (method === 'GET' && data) {
        url = urlFromData(url, data);
    }

    // param[4] is an optional abort controller
    const options = createOptions(method, data, contenttype, arguments[4]);
    return fetch(url, options).then(respond);
}

/**
requestGet(url)
A shortcut for `request('get', url, null, 'application/json')`
**/

export function requestGet(url) {
    return request('GET', url);
}

/**
requestPatch(url, data)
A shortcut for `request('patch', 'application/json', url, data)`
**/

export function requestPatch(url, data) {
    return request('PATCH', url, data, 'application/json');
}

/**
requestPost(url, data)
A shortcut for `request('post', 'application/json', url, data)`
**/

export function requestPost(url, data) {
    return request('POST', url, data, 'application/json');
}

/**
requestDelete(url, data)
A shortcut for `request('delete', 'application/json', url, data)`
**/

export function requestDelete(url, data) {
    return request('DELETE', url, data, 'application/json');
}

/*
throttledRequest(type, mimetype, url)
*/

function ignoreAbortError(error) {
    // Swallow AbortErrors, since we generate one every time we use
    // the AbortController.
    if (error.name === 'AbortError') {
        console.log('Request aborted by throttle. Nothing to worry about.');

        // JS promises have no machanism to conditionally catch different
        // types of error – throw undefined to fall through to the next
        // catch without a value.
        throw undefined;
    }

    // Rethrow all other errors
    throw error;
}

export function throttledRequest(type, mimetype, url) {
    var controller, data, promise;

    function then() {
        controller = undefined;
    }

    function send() {
        controller = new AbortController();
        var req = request(type, mimetype, url, data, controller);
        req.then(then);
        promise = undefined;
        data    = undefined;
        return req;
    }

    return function(object) {
        data = object;

        if (promise) {
            return promise;
        }

        // Cancel previous request
        if (controller) {
            controller.abort();
            controller = undefined;
        }

        // Batch requests to ticks
        return promise = Promise
        .resolve()
        .then(send)
        .catch(ignoreAbortError);
    };
}
