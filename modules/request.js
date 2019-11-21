import { cache, get, update } from '../fn/module.js';

export const config = {
	headers: {
		"X-CSRFToken": function(data) {
			// If data is FormData, get CSRFToken from hidden form field
			// otherwise read it from a coookie.
			return data && data.get && data.get('csrfmiddlewaretoken')
				|| readCookie();
		}
	},

	onresponse: function(response) {
		// If redirected, navigate the browser away from here
		if (response.redirected) {
			window.location = response.url;
			return;
		}
	}
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

const createHeaders = choose({
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
			data = jsonify(data);
			return data;
		}

		return data;
	},

	'multipart/form-data': function(data) {
		// If data is FormData don't send CSRF in body of data
		if (data && data.get) {
			data.delete('csrfmiddlewaretoken');
			return data;
		}

		// Todo: convert other formats to multipart formdata...
		return;
	},

	'default': function(data) {
		// Default application/x-www-form-urlencoded serialization
		return serialize(data);
	}
});

function jsonify(formData) {
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

function createOptions(method, mimetype, data) {
	return {
		method:  method,
		headers: createHeaders(mimetype, data),
		body:    createBody(mimetype, data),
		credentials: 'same-origin'
	};
}

function processResponse(response) {
	if (config.onresponse && !config.onresponse(response)) {}

	// Otherwise return data negociated by contentType
	return isJSONContent(response.headers.get("content-type")) ?
		response.json() :
		response.text() ;
}

export function request(url, method = 'GET', mimetype = 'application/json', data) {
	return fetch(url, createOptions(method, mimetype, data))
	.then(processResponse);
}

export function requestGet(url, data) {
	const mimetype = 'application/json';
	return request(url, 'GET', mimetype, data)
	.then(get('data'));
}

export function requestPatch(url, data) {
	const mimetype = 'application/json';
	return request(url, 'PATCH', mimetype, data)
	.then(get('data'));
}

export function requestPost(url, data) {
	const mimetype = 'application/json';
	return request(url, 'POST', mimetype, data)
	.then(get('data'));
}

export function requestDelete(url, data) {
	const mimetype = 'application/json';
	return request(url, 'DELETE', mimetype, data);
}
