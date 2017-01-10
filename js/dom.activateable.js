// dom.toggleable

(function(window) {
	"use strict";

	var dom     = window.dom;

	// Define

	var name = 'activateable';

	// Functions

	var on      = dom.events.on;
	var off     = dom.events.off;

	function activate(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var target = e.target;
		if (!dom.classes(target).contains(name)) { return; }

		var id = dom.identify(target);
		e.default();
	}

	function deactivate(e, data, fn) {
		if (!e.default) { return; }

		var target = e.target;
		if (!dom.classes(target).contains(name)) { return; }

		var id = dom.identify(e.target);
		e.default();
	}

	on(document, 'dom-activate', activate);
	on(document, 'dom-deactivate', deactivate);
})(this);
