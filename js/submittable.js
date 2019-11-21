
// dom.submittable

import { choose, compose, get, noop } from '../../fn/module.js';
import { events, matches, preventDefault, request } from '../module.js';

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
	const formData = new FormData(form);

	request(url, method ? method.toUpperCase() : 'POST', mimetype, formData)
	.then(function(data) {
		if (response.ok) {
			events.trigger(form, 'dom-submitted', {
				detail: data
			});
		}
		else {
			events.trigger(form, 'dom-submit-error', {
				detail: data
			});
		}
	})
	.catch(function(error) {
		events.trigger(form, 'dom-submit-error');
	});
});
