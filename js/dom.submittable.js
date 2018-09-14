
// dom.submittable

import { compose, get, noop } from '../../fn/fn.js';
import { events, matches, preventDefault } from '../dom.js';

// Define

const match = matches('.submittable, [submittable]');

function isJSONContent(type) {
	return type && type.indexOf("application/json") !== -1;
}

// Functions
events('submit', document)
.filter(compose(match, get('target')))
.tap(preventDefault)
.map(get('target'))
.each(function(form) {
	const method   = form.getAttribute('method');
	const url      = form.getAttribute('action');
	const mimetype = form.getAttribute('enctype');
	const data     = new FormData(form);

	const body = mimetype === 'application/json' ?
		// data.entries() is an iterator, not an array
		JSON.stringify(
			Array
			.from(data.entries())
			.reduce(function(output, entry) {
				if (entry[0] !== 'csrfmiddlewaretoken') {
					output[entry[0]] = entry[1];
				}

				return output;
			}, {})
		) :

	mimetype === 'application/x-www-form-urlencoded' ?
		// Todo: serialize form data
		data :

	data ;

	fetch(url, {
		method: method ? method.toUpperCase() : 'POST',
		headers: {
			"X-CSRFToken": data.get('csrfmiddlewaretoken'),
            "Content-Type": mimetype === 'application/json' ?
				// Other requests are sent as JSON
				"application/json; charset=utf-8" :
				// If type exists, use it
				mimetype ||
				// FormData, of type "multipart/form-data", is our default
				"multipart/form-data"
        },
		body: body
	})
	.then(function(response) {
		if (response.redirected) {
			console.log('REDIRECT', reponse);
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
					detail: data.errors
				});
			}
		});
	})
	.catch(function(error) {
		events.trigger(form, 'dom-submit-error');
	});
});
