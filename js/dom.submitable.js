
// dom.postable

import { compose, get, noop } from '../../fn/fn.js';
import { events, matches, preventDefault } from '../dom.js';

// Define

var match = matches('.submitable, [submitable]');

function isJSONContent(type) {
	return type && type.indexOf("application/json") !== -1;
}

// Functions
events('submit', document)
.filter(compose(match, get('target')))
.tap(preventDefault)
.map(get('target'))
.each(function(form) {
	var method = form.getAttribute('method');
	var url    = form.getAttribute('action');
	var data   = new FormData(form);

	fetch(url, {
		method: method ? method.toUpperCase() : 'POST',
		headers: {
            "Content-Type": method === 'GET' ?
				// Get requests are encoded in the URL
				"application/x-www-form-urlencoded" :
				// Other requests are sent as JSON
				"application/json; charset=utf-8"
        },
		body: data
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
		events.trigger(form, 'dom-submit-error', {
			detail: error.response.data.errors
		});
	});
});
