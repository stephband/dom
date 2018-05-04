
import { default as dom, matches, events } from './dom.js';


// dom.toggleable

(function(window) {
	"use strict";

	// Define

	var match = matches('.activateable, [activateable]');

	// Functions

	var on = events.on;

	function activate(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var target = e.target;
		if (!match(target)) { return; }

		//dom.identify(target);
		e.default();
	}

	function deactivate(e, data, fn) {
		if (!e.default) { return; }

		var target = e.target;
		if (!match(target)) { return; }

		//dom.identify(target);
		e.default();
	}

	on(document, 'dom-activate', activate);
	on(document, 'dom-deactivate', deactivate);
	dom.activeMatchers.push(match);
})(window);
