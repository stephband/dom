(function(window) {
	"use strict";

	var dom     = window.dom;
	var on      = dom.events.on;
	var trigger = dom.events.trigger;
	var closest = dom.closest;
	var tau     = Math.PI * 2;

	on(document, 'touch', function(e) {
		if (e.defaultPrevented) { return; }

		var node = closest('.slideable', e.target);
		if (!node) { return; }

		var transform = dom.style('transform', node);
		transform = !transform || transform === 'none' ? '' : transform; 

		var x = 0;
		var classes = dom.classes(node);

		classes.add('notransition');

		// e.detail() is a stream of touch coordinates
		e.detail()
		.tap(function(data) { x = data.x; })
		.map(function(data) {
			return transform + ' translate(' + data.x + 'px, 0px)';
		})
		.each(function(transform) {
			node.style.transform = transform;
		})
		.on('done', function() {
			classes.remove('notransition');
		});
	});

	on(document, 'swipe', function(e) {
		if (e.defaultPrevented) { return; }

		var node = closest('.slideable', e.target);
		if (!node) { return; }

		var angle    = Fn.wrap(0, tau, e.angle || 0);
		var velocity = e.velocity || 0;
		var prop     = (angle > tau * 1/8 && angle < tau * 3/8) ?
				'previousElementSibling' :
			(angle > tau * 5/8 && angle < tau * 7/8) ?
				'nextElementSibling' :
				false ;

		if (!prop) { return; }

		var active = dom('.slideable > .switchable', node)
		.filter(dom.matches('.active'))
		.shift();

		if (!active[prop]) {
			var l1 = dom.viewportLeft(node);
			var l2 = dom.viewportLeft(active);
			var l  = l1 - l2;
			node.style.transform = 'translate(' + l + 'px, 0px)';
		}
		else {
			trigger(active[prop], 'activate');
		}
	});

	on(document, 'activate', function(e) {
		if (e.defaultPrevented) { return; }

		var node   = e.target;
		var parent = node.parentNode;

		if (!dom.matches('.slideable', parent)) { return; }

		//var transform = dom.style('transform', parent);
		//transform = !transform || transform === 'none' ? '' : transform; 

		var l1 = dom.viewportLeft(node);
		var l2 = dom.viewportLeft(parent);
		var l  = l1 - l2;

		parent.style.transform = 'translate(' + (-l) + 'px, 0px)';
		e.preventDefault();
	});
})(this);
