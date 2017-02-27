(function(window) {
	"use strict";

	var dom     = window.dom;
	var on      = dom.events.on;
	var closest = dom.closest;

	on(document, 'dom-touch', function(e) {
		if (e.defaultPrevented) { return; }

		var moveable = closest('.moveable', e.target);
		if (!moveable) { return; }

		var transform = dom.style('transform', moveable);
		transform = !transform || transform === 'none' ? '' : transform; 

		e
		.detail()
		.map(function(data) {
			return transform + ' translate(' + data.x + 'px, ' + data.y + 'px)';
		})
		.each(function(transform) {
			moveable.style.transform = transform;
		})
		.on('stop', function() {
			//moveable.style.transform = transform;
		});
	});
})(this);
