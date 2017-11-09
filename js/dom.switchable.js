// dom.switchable
//
// Extends the default behaviour of the activate and deactivate
// events with things to do when they are triggered on nodes.

(function(window) {
	"use strict";

	// Import

	var Fn      = window.Fn;
	var dom     = window.dom;

	// Define

	var matches = dom.matches('.switchable, [switchable]');
	var on      = dom.events.on;
	var triggerDeactivate = dom.trigger('dom-deactivate');

	function activate(e) {
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }

		var nodes = dom.children(target.parentNode).filter(matches);
		var i     = nodes.indexOf(target);

		nodes.splice(i, 1);
		var active = nodes.filter(dom.matches('.active'));

		e.default();

		// Deactivate the previous active pane AFTER this pane has been
		// activated. It's important for panes who's style depends on the
		// current active pane, eg: .slide.active ~ .slide
		Fn.from(active).each(triggerDeactivate);
	}

	function deactivate(e) {
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }

		e.default();
	}

	on(document, 'dom-activate', activate);
	on(document, 'dom-deactivate', deactivate);
	dom.activeMatchers.push(matches);
})(this);
