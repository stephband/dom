
// dom.submittable

import { choose, compose, get, noop, request } from '../../fn/module.js';
import { events, matches, preventDefault } from '../module.js';

// Define

const match = matches('.submittable, [submittable]');

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

	request(method || 'POST', mimetype, url, formData)
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
