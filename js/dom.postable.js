
import { noop } from '../../fn/fn.js';
import { default as dom, events, matches, preventDefault } from '../dom.js';

// dom.postable

(function(window) {
	"use strict";

	var axios   = window.axios;
	var dom     = window.dom;
	var Fn      = window.Fn;
	var compose = Fn.compose;
	var get     = Fn.get;

	// Define

	var match = matches('.postable, [postable]');


	// Functions
	dom
	.events('submit', document)
	.filter(compose(match, get('target')))
	.tap(dom.preventDefault)
	.map(get('target'))
	.each(function(form){
		var action = form.getAttribute('action');
		var post_data = new FormData(form);

		axios
		.post(action, post_data)
		.then(function(response){
			if(response.status < 300) {
				dom.events.trigger(form, 'dom-posted', { detail: response.data });
			}
			else {
				dom.events.trigger(form, 'dom-error', { detail: response.data.errors });
			}
		})
		.catch(function(error) {
			dom.events.trigger(form, 'dom-error', { detail: error.response.data.errors });
		});
	});
})(window);
