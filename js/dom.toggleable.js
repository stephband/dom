// dom.toggleable

(function(window) {
	"use strict";

	var dom     = window.dom;
	var Fn      = window.Fn;

	// Define

	var matches = dom.matches('.toggleable, [toggleable]');

	// Functions

	var closest = dom.closest;
	var on      = dom.events.on;
	var off     = dom.events.off;
	var trigger = dom.events.trigger;
	var remove  = Fn.remove;

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
		if (!dom.isPrimaryButton(e)) { return; }

		var node = closest('a[href]', e.target);
		if (!node) { return; }
		if (node.hostname && !dom.isInternalLink(node)) { return; }

		// Does it point to an id?
		var id = getHash(node);
		if (!id) { return; }
		if (actives.indexOf(id) === -1) { return; }

		trigger(dom.get(id), 'dom-deactivate', {
			relatedTarget: node
		});

		e.preventDefault();
	}

	function activate(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }

		actives.push(dom.identify(target));
		e.default();
	}

	function deactivate(e, data, fn) {
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }

		remove(actives, target.id)
		e.default();
	}

	on(dom.root, 'click', click);
	on(document, 'dom-activate', activate);
	on(document, 'dom-deactivate', deactivate);

	dom.activeMatchers.push(matches);
})(window);
