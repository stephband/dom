(function(window) {
	"use strict";

	var dom = window.dom;
	var on      = dom.on;
	var trigger = dom.trigger;
	var closest = dom.closest;

	on(document, 'touch', function(e) {
		if (e.defaultPrevented) { return; }

		var slideable = closest('.slideable', e.target);
		if (!slideable) { return; }

		var transform = dom.style('transform', slideable);
		transform = !transform || transform === 'none' ? '' : transform; 

		var x = 0;

		e
		.detail()
		.tap(function(data) { x = data.x; })
		.map(function(data) {
			return transform + ' translate(' + data.x + 'px, 0px)';
		})
		.each(function(transform) {
			slideable.style.transform = transform;
		});
	});

	on(document, 'swipeleft', function(e) {
		if (e.defaultPrevented) { return; }

		var active = dom('.active', e.target)[0];
		var after  = active.nextSibling;
		trigger(after, 'activate');
	});
})(this);
