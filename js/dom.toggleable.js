// dom.toggleable

(function(window) {
	"use strict";

	var Fn      = window.Fn;
	var dom     = window.dom;

	// Define

	var name = 'toggleable';

	// Functions

	var noop            = Fn.noop;
	var on              = dom.events.on;
	var off             = dom.events.off;
	var trigger         = dom.events.trigger;

	function click(e, activeTarget) {
		// A prevented default means this link has already been handled.
		if (e.defaultPrevented) { return; }
		if (!dom.isPrimaryButton(e)) { return; }

		var node = e.currentTarget;
		if (!node) { return; }

		trigger(activeTarget, 'deactivate', {
			relatedTarget: e.target
		});

		e.preventDefault();
	}

	function activate(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var target = e.target;
		if (!dom.classes(target).contains(name)) { return; }

		var id = dom.identify(target);

		dom('[href$="#' + id + '"]')
		.each(function(node) {
			on(node, 'click', click, e.target);
		});

		e.default();
	}

	function deactivate(e, data, fn) {
		if (!e.default) { return; }

		var target = e.target;
		if (!dom.classes(target).contains(name)) { return; }

		var id = dom.identify(e.target);

		dom('[href$="#' + id + '"]')
		.each(function(node) {
			off(node, 'click', click);
		});

		e.default();
	}

	on(document, 'activate', activate);
	on(document, 'deactivate', deactivate);

})(this);
