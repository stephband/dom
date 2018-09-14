
// dom.submittable

import { choose, compose, get, noop } from '../../fn/fn.js';
import { events, matches, preventDefault } from '../dom.js';

// Define

const match = matches('.submittable, [submittable]');

function isJSONContent(type) {
	return type && type.indexOf("application/json") !== -1;
}

function serialize(formData) {
	return new URLSearchParams(formData).toString();
}

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

const createHeaders = choose({
	'application/json': function(data) {
		return {
			"X-CSRFToken": data.get('csrfmiddlewaretoken'),
			"Content-Type": "application/json; charset=utf-8"
		};
	},

	'multipart/form-data': function(data) {
		return {
			"X-CSRFToken": data.get('csrfmiddlewaretoken'),
			"Content-Type": 'multipart/form-data'
		};
	},

	'default': function(data) {
		return {
			"Content-Type": 'application/x-www-form-urlencoded'
		};
	}
});

const createBody = choose({
	'application/json': function(data) {
		const csrf = data.get('csrfmiddlewaretoken');

		if (csrf) {
			data.delete('csrfmiddlewaretoken');
		}

		// data.entries() is an iterator, not an array
		return jsonify(data);
	},

	'multipart/form-data': function(data) {
		const csrf = data.get('csrfmiddlewaretoken');

		if (csrf) {
			data.delete('csrfmiddlewaretoken');
		}

		// FormData objects are already in multipart/form-data format
		return data;
	},

	'default': function(data) {
		// Default application/x-www-form-urlencoded serialization
		return serialize(data);
	},
});

// Functions
events('submit', document)
.filter(compose(match, get('target')))
.tap(preventDefault)
.map(get('target'))
.each(function(form) {
	const method   = form.getAttribute('method');
	const url      = form.getAttribute('action');
	const mimetype = form.getAttribute('enctype');
	const formData = new FormData(form);

	fetch(url, {
		method:  method ? method.toUpperCase() : 'POST',
		headers: createHeaders(mimetype, formData),
		body:    createBody(mimetype, formData)
	})
	.then(function(response) {
		// If redirected, navigate the browser away from here
		if (response.redirected) {
			window.location = response.url;
		}

		const contentType = response.headers.get("content-type");

		(isJSONContent(contentType) ?
			response.json() :
			response.text()
		)
		.then(function(data) {
			if (response.ok) {
				events.trigger(form, 'dom-submit-response', {
					detail: data
				});
			}
			else {
				events.trigger(form, 'dom-submit-error', {
					detail: data
				});
			}
		});
	})
	.catch(function(error) {
		events.trigger(form, 'dom-submit-error');
	});
});
