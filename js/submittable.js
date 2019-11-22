
// dom.submittable

import { choose, compose, get, noop } from '../../fn/module.js';
import { events, matches, preventDefault, request } from '../module.js';

// Define

const match = matches('.submittable, [submittable]');

// Functions
events('submit', document)
.filter(compose(match, get('target')))
.tap(preventDefault)
.map(get('target'))
.each(function(form) {
	const method   = form.method;
	const url      = form.action || '';
    // Allow other values for enctype by reading the attribute first
	const mimetype = form.getAttribute('enctype') || form.enctype;
	const formData = new FormData(form);

	request(method, mimetype, url, formData)
	.then(function(data) {
		events.trigger(form, 'dom-submitted', {
			detail: data
		});
	})
	.catch(function(error) {
		events.trigger(form, 'dom-submit-error', {
			detail: error
		});
	});
});
