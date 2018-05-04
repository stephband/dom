// dom.toggleable

import { remove } from '../../fn/fn.js';
import { default as dom, get, events, closest, matches, children, isPrimaryButton, isInternalLink, identify } from './dom.js';


(function(window) {
	"use strict";

	// Define

	var match = matches('.toggleable, [toggleable]');

	// Functions

	var on      = events.on;
	var off     = events.off;
	var trigger = events.trigger;

	var actives = [];

	function getHash(node) {
		return (node.hash ?
			node.hash :
			node.getAttribute('href')
		).substring(1);
	}

	function click(e) {
		// A prevented default means this link has already been handled.
		if (e.defaultPrevented) { return; }
		if (!isPrimaryButton(e)) { return; }

		var node = closest('a[href]', e.target);
		if (!node) { return; }
		if (node.hostname && !isInternalLink(node)) { return; }

		// Does it point to an id?
		var id = getHash(node);
		if (!id) { return; }
		if (actives.indexOf(id) === -1) { return; }

		trigger(get(id), 'dom-deactivate', {
			relatedTarget: node
		});

		e.preventDefault();
	}

	function activate(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var target = e.target;
		if (!match(target)) { return; }

		actives.push(identify(target));
		e.default();
	}

	function deactivate(e, data, fn) {
		if (!e.default) { return; }

		var target = e.target;
		if (!match(target)) { return; }

		remove(actives, target.id);
		e.default();
	}

	on(dom.root, 'click', click);
	on(document, 'dom-activate', activate);
	on(document, 'dom-deactivate', deactivate);

	dom.activeMatchers.push(match);
})(window);
