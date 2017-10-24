// dom.toggleable

(function(window) {
	"use strict";

	var dom     = window.dom;

	// Define

	var matches = dom.matches('.activateable, [activateable]');

	// Functions

	var on      = dom.events.on;

	function activate(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }

		//dom.identify(target);
		e.default();
	}

	function deactivate(e, data, fn) {
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }

		//dom.identify(target);
		e.default();
	}

	on(document, 'dom-activate', activate);
	on(document, 'dom-deactivate', deactivate);
	dom.activeMatchers.push(matches);
})(this);
