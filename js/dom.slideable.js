(function(window) {
	"use strict";

	var dom     = window.dom;
	var on      = dom.events.on;
	var trigger = dom.events.trigger;
	var closest = dom.closest;
	var tau     = Math.PI * 2;

	var elasticDistance = 800;

	function elasticEase(n) {
		return Math.atan(n) / Math.PI ;
	}

	on(document, 'touch', function(e) {
		if (e.defaultPrevented) { return; }

		var node = closest('.slideable', e.target);
		if (!node) { return; }

		var classes = dom.classes(node);
		var transform = dom.style('transform', node);

		transform = !transform || transform === 'none' ? '' : transform ;

		var x = dom.style('transform:translateX', node);
		var last = dom(node.children)
			.filter(dom.matches('.switchable'))
			.last()
			.shift();

		// Get the right-most x of the last switchable child's right-most edge
		var w1 = last.offsetLeft + last.clientWidth;
		var w2 = node.parentNode.clientWidth;
		var ws = w1 - w2;

		classes.add('notransition');

		// e.detail() is a stream of touch coordinates
		e.detail()
		.map(function(data) {
			var ax = x + data.x;
			var tx = ax > 0 ? elasticEase(ax / elasticDistance) * elasticDistance - x :
				ax < -ws ? elasticEase((ax + ws) / elasticDistance) * elasticDistance - ws - x :
				data.x ;

			return transform + ' translate(' + tx + 'px, 0px)';
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

			// If angle is rightwards
		var prop = (angle > tau * 1/8 && angle < tau * 3/8) ?
				'previousElementSibling' :
			// If angle is leftwards
			(angle > tau * 5/8 && angle < tau * 7/8) ?
				'nextElementSibling' :
				false ;

		if (!prop) { return; }

		var active = dom(node.children)
		.filter(dom.matches('.active'))
		.shift();

		if (!active[prop]) {
			var l1 = dom.viewportLeft(node);
			var l2 = dom.viewportLeft(active);
			// Round the translation - without rounding images and text become
			// slightly fuzzy as they are antialiased.
			var l  = Math.round(l1 - l2 - dom.style('margin-left', active) - 200);
			node.style.transform = 'translate(' + l + 'px, 0px)';
		}
		else {
			trigger(active[prop], 'activate');
		}
	});

	on(document, 'activate', function(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var node   = e.target;
		var parent = node.parentNode;

		if (!dom.matches('.slideable', parent)) { return; }

		var classes = dom.classes(parent);
		classes.remove('notransition');

		var w = document.documentElement.clientWidth;
		var l1 = dom.viewportLeft(node);
		var l2 = dom.viewportLeft(parent);
		var l  = l1 - l2 - dom.style('margin-left', node);

		parent.style.transform = 'translate(' + (-l) + 'px, 0px)';
		e.preventDefault();
	});
})(this);
