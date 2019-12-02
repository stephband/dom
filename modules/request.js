import { choose, compose, id } from '../../fn/module.js';

const assign = Object.assign;

export const config = {
	headers: {},

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
    'application/x-www-form-urlencoded': function(data) {
        return assignConfig({
			"Content-Type": 'application/x-www-form-urlencoded',
			"X-Requested-With": "XMLHttpRequest"
		}, config.headers, data);
    },

	'application/json': function(data) {
		return assignConfig({
			"Content-Type": "application/json; charset=utf-8",
			"X-Requested-With": "XMLHttpRequest"
		}, config.headers, data);
	},

	'multipart/form-data': function(data) {
		return assignConfig({
			"Content-Type": 'multipart/form-data',
			"X-Requested-With": "XMLHttpRequest"
		}, config.headers, data);
	},

	'audio/wav': function(data) {
		return assignConfig({
			"Content-Type": 'audio/wav',
			"X-Requested-With": "XMLHttpRequest"
		}, config.headers, data);
	},

	'default': function(data) {
		return {
			"Content-Type": 'application/x-www-form-urlencoded',
			"X-Requested-With": "XMLHttpRequest"
		};
	}
});

const createBody = choose({
	'application/json': function(data) {
		// If data is FormData don't send CSRF in body of data
		if (data && data.get) {
			data.delete('csrfmiddlewaretoken');
			data = formDataToJSON(data);
			return data;
		}

		return JSON.stringify(data);
	},

    'application/x-www-form-urlencoded': function(data) {
		// If data is FormData don't send CSRF in body of data
		if (data && data.get) {
			data.delete('csrfmiddlewaretoken');
			return data;
		}

		// Todo: convert other formats to multipart formdata...?
		return;
	},

	'multipart/form-data': function(data) {
		// If data is FormData don't send CSRF in body of data
		if (data && data.get) {
			data.delete('csrfmiddlewaretoken');
			return data;
		}

		// Todo: convert other formats to multipart formdata...?
		return;
	},

	'default': function(data) {
		// Default application/x-www-form-urlencoded serialization
		return serialize(data);
	}
});

const responders = {
	'text/html':           respondText,
	'application/json':    respondJSON,
	'multipart/form-data': respondForm,
    'application/x-www-form-urlencoded': respondForm,
	'audio':               respondBlob,
	'audio/wav':           respondBlob,
	'audio/m4a':           respondBlob
};

function assignConfig(target, object, data) {
	// Assigns value unless value is a function, in which case assigns
	// the result of running value(data)
	for (name in object) {
		target[name] = typeof object[name] === 'function' ?
			object[name](data) :
			object[name] ;
	}

	return target;
}

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

function serialize(formData) {
	return new URLSearchParams(formData).toString();
}

function createOptions(method, mimetype, data, controller) {
	return method === 'GET' ? {
		method:  method,
		headers: createHeaders(mimetype, data),
		credentials: 'same-origin',
        signal: controller && controller.signal
	} : {
		method:  method,
		headers: createHeaders(mimetype, data),
		body:    createBody(mimetype, data),
		credentials: 'same-origin',
        signal: controller && controller.signal
	} ;
}

function throwError(object) {
	throw object;
}

function respondBlob(response) {
	return response.blob();
}

function respondJSON(response) {
	return response.json();
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

    const mimetype = response.headers.get('Content-Type');
    return responders[mimetype](response);
}


/*
request(type, mimetype, url, data)
*/

export default function request(type = 'GET', mimetype = 'application/json', url, data) {
	const method = type.toUpperCase();

    // param[4] is an optional abort controller
	return fetch(url, createOptions(method, mimetype, data, arguments[4]))
    .then(respond);
}

export function requestGet(url) {
	return request('GET', 'application/json', url, {});
}

export function requestPatch(url, data) {
	return request('PATCH', 'application/json', url, data);
}

export function requestPost(url, data) {
	return request('POST', 'application/json', url, data);
}

export function requestDelete(url, data) {
	return request('DELETE', 'application/json', url, data);
}


/*
throttledRequest(type, mimetype, url)
*/

function ignoreAbortError(error) {
    // Swallow AbortErrors, since we generate one every time we use
    // the AbortController.
    if (error.name === 'AbortError') {
        console.log('Request aborted deliberately, swollowing error');

        // JS promises have no machanism to conditionally catch different
        // types of error – throw undefined to fall through to the next
        // catch without a value.
        throw undefined;
    }

    // Rethrow all other errors
    throw error;
}

export function throttledRequest(type, mimetype, url) {
    var promise, controller;

    return function throttle(data) {
        var p;

        if (promise) {
            // Cancel previous request
            controller.abort();
        }

        controller = new AbortController();

        return promise = p = request(type, mimetype, url, data, controller)
        .finally(() => {
            // Promise may not be the same promise by the time we get here
            if (promise !== p) { return; }
            promise    = undefined ;
            controller = undefined ;
        })
        .catch(ignoreAbortError);
    };
};
