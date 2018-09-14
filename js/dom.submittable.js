
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
	const method = form.getAttribute('method');
	const url    = form.getAttribute('action');
	const type   = form.getAttribute('enctype');
	const data   = new FormData(form);

	const body = type === 'application/json' ?
		// data.entries() is an iterator, not an array
		JSON.stringify(
			Array
			.from(data.entries())
			.reduce(function(output, entry) {
				output[entry[0]] = entry[1];
				return output;
			}, {})
		) :

		data ;

	fetch(url, {
		method: method ? method.toUpperCase() : 'POST',
		headers: {
            "Content-Type": type === 'application/json' ?
				// Other requests are sent as JSON
				"application/json; charset=utf-8" :
				// Get requests are encoded in the URL
				"application/x-www-form-urlencoded"
        },
		body: body
	})
	.then(function(response) {
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
