(function(window) {
	"use strict";

	var dom = window.dom;
	var on      = dom.on;
	var trigger = dom.trigger;
	var closest = dom.closest;

	on(document, 'activate', function(e) {
		if (e.defaultPrevented) { return; }

		var node = e.target;
		var classes = dom.classes(node);

		if (classes.contains('switchable')) {
			var actives = dom('.active', node.parentNode);
			setTimeout(function() {
				actives.forEach(function(node) {
					trigger(node, 'deactivate');
				});
			}, 0);
		}
	});

	on(document, 'activate', function(e) {
		if (e.defaultPrevented) { return; }

		var node = e.target;
		var classes = dom.classes(node);
console.log('ACTIVATE', node);
		if (classes.contains('toggleable') ||
			classes.contains('switchable') ||
			classes.contains('popable')) {
			classes.add('active');
		}
	});

	on(document, 'deactivate', function(e) {
		if (e.defaultPrevented) { return; }

		var node = e.target;
		var classes = dom.classes(node);

		classes.remove('active');
	});

	on(document, 'swipeleft', function(e) {
		if (e.defaultPrevented) { return; }

		var active = dom('.active', e.target)[0];
		var after  = active.nextSibling;
		trigger(after, 'activate');
	});
})(this);
