import { choose, compose, id } from '../../fn/module.js';
import { getCookie } from './cookies.js';

export const config = {
	headers: {
		"X-CSRFToken": function(data) {
			// If data is FormData, get CSRFToken from hidden form field
			// otherwise read it from a coookie.
			return data
				&& data.get
				&& data.get('csrfmiddlewaretoken')
				|| getCookie("csrftoken") ;
		}
	},

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

function createOptions(method, mimetype, data) {
	return method === 'GET' ? {
		method:  method,
		headers: createHeaders(mimetype, data),
		credentials: 'same-origin'
	} : {
		method:  method,
		headers: createHeaders(mimetype, data),
		body:    createBody(mimetype, data),
		credentials: 'same-origin'
	} ;
}

function throwError(object) {
	throw object;
}

function respondBlob(response) {
	if (!response.ok) {
		throw new Error(response.statusText + '');
	}

	return response.blob();
}

function respondJSON(response) {
	return response.ok ?
		response.json() :
		response.json().then(throwError) ;
}

function respondForm(response) {
	return response.ok ?
		response.formData() :
		response.formData().then(throwError) ;
}

function respondText(response) {
	return response.ok ?
		response.text() :
		response.text().then(throwError) ;
}

function respond(response) {
	if (!response.ok) {
		throw new Error(response.statusText + '');
	}

	return response;
}

export default function request(type = 'GET', mimetype = 'application/json', url, data) {
	const method = type.toUpperCase();
	return fetch(url, createOptions(method, mimetype, data))
	.then(compose(
		method === 'DELETE' ? respond : responders[mimetype],
		config.onresponse || id
	));
}

export function requestGet(url) {
	return fetch(url, createOptions('GET', 'application/json'))
	.then(compose(respondJSON, config.onresponse || id));
}

export function requestPatch(url, data) {
	return fetch(url, createOptions('PATCH', 'application/json', data))
	.then(compose(respondJSON, config.response || id));
}

export function requestPost(url, data) {
	return fetch(url, createOptions('POST', 'application/json', data))
	.then(compose(respondJSON, config.onresponse || id));
}

export function requestDelete(url, data) {
	return fetch(url, createOptions('DELETE', 'application/json', data))
	.then(compose(respond, config.onresponse || id));
}
