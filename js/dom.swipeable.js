
import { last, wrap } from '../../fn/fn.js';
import { default as dom, events, closest, matches } from '../dom.js';
import './dom-swipe.js';
import './dom-touch.js';
import './dom.switchable.js';

(function(window) {
	"use strict";

	var on       = events.on;
	var trigger  = events.trigger;
	var tau      = Math.PI * 2;

	var elasticDistance = 800;

	var rspaces = /\s+/;

	function elasticEase(n) {
		return Math.atan(n) / Math.PI ;
	}

	function xMinFromChildren(node) {
		var child = last(dom.children(node).filter(matches('.switchable, [switchable]')));

		// Get the right-most x of the last switchable child's right-most edge
		var w1 = child.offsetLeft + child.clientWidth;
		var w2 = node.parentNode.clientWidth;
		return w2 - w1;
	}

	on(document, 'dom-touch', function touch(e) {
		if (e.defaultPrevented) { return; }

		var node = closest('.swipeable, [swipeable]', e.target);
		if (!node) { return; }

		var classes = dom.classes(node);
		var transform = dom.style('transform', node);

		transform = !transform || transform === 'none' ? '' : transform ;

		var x = dom.style('transform:translateX', node);

		// Elastic flags and limits
		var eMin = false;
		var eMax = false;
		var xMin = dom.attribute('data-slide-min', node);
		var xMax = dom.attribute('data-slide-max', node);

		if (!xMin && !xMax) {
			eMin = true;
			eMax = true;
			xMin = xMinFromChildren(node);
			xMax = 0;
		}
		else {
			eMin = /elastic/.test(xMin);
			eMax = /elastic/.test(xMax);
			xMin = parseFloat(xMin) || 0;
			xMax = parseFloat(xMax) || 0;
		}

		classes.add('no-transition');

		var ax = x;

		// e.detail() is a stream of touch coordinates
		e.detail()
		.map(function(data) {
			ax = x + data.x;
			var tx = ax > 0 ?
					eMax ? elasticEase(ax / elasticDistance) * elasticDistance - x :
					xMax :
				ax < xMin ?
					eMin ? elasticEase((ax - xMin) / elasticDistance) * elasticDistance + xMin - x :
					xMin :
				data.x ;

			return transform + ' translate(' + tx + 'px, 0px)';
		})
		.each(function(transform) {
			node.style.transform = transform;
		})
		.then(function() {
			classes.remove('no-transition');

			// Todo: Watch out, this may interfere with slides
			var xSnaps = dom.attribute('data-slide-snap', node);

			if (!xSnaps) { return; }
			xSnaps = xSnaps.split(rspaces).map(parseFloat);

			// Get closest x from list of snaps
			var tx = xSnaps.reduce(function(prev, curr) {
				return Math.abs(curr - ax) < Math.abs(prev - ax) ?
					curr : prev ;
			});

			//requestAnimationFrame(function() {
				node.style.transform = transform + ' translate(' + tx + 'px, 0px)';
			//});
		});
	});

	function transform(node, active) {
		var l1 = dom.box(node).left;
		var l2 = dom.box(active).left;

		// Round the translation - without rounding images and text become
		// slightly fuzzy as they are antialiased.
		var l  = Math.round(l1 - l2 - dom.style('margin-left', active));
		node.style.transform = 'translate(' + l + 'px, 0px)';
	}

	function update(swipeable, node) {
		var box = dom.box(node);

		// node may not be visible, in which case we can't update
		if (!box) { return; }

		var l1 = box.left;
		var l2 = dom.box(swipeable).left;
		var l  = l1 - l2 - dom.style('margin-left', node);

		swipeable.style.transform = 'translate(' + (-l) + 'px, 0px)';
	}

	on(document, 'dom-swipe', function swipe(e) {
		if (e.defaultPrevented) { return; }

		var node = closest('.swipeable, [swipeable]', e.target);
		if (!node) { return; }

		var angle = wrap(0, tau, e.angle || 0);

			// If angle is rightwards
		var prop = (angle > tau * 1/8 && angle < tau * 3/8) ?
				'previousElementSibling' :
			// If angle is leftwards
			(angle > tau * 5/8 && angle < tau * 7/8) ?
				'nextElementSibling' :
				false ;

		if (!prop) { return; }

		var children = dom.children(node);

		// it is entirely possible there are no active children – the initial
		// HTML may not specify an active child – in which case we assume the
		// first child is displayed
		var active = children
		.filter(matches('.active'))
		.shift() || children.shift();

		if (active[prop]) {
			trigger(active[prop], 'dom-activate');
		}
		else {
			transform(node, active);
		}
	});

	on(document, 'dom-activate', function activate(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var node   = e.target;
		var parent = node.parentNode;

		if (!matches('.swipeable, [swipeable]', parent)) { return; }

		var classes = dom.classes(parent);
		classes.remove('no-transition');
		// Force recalc
		// TODO: check if this gets removed by JS minifier
		dom.root.clientWidth;
		e.preventDefault();
		update(parent, node);
	});

	on(window, 'resize', function resize() {
		// Update swipeable positions
		dom('.swipeable, [swipeable]').forEach(function(swipeable) {
			var node = dom.children(swipeable).find(matches('.active'));
			if (!node) { return; }
			var classes = dom.classes(swipeable);
			classes.add('no-transition');
			update(swipeable, node);
			// Force recalc
			// TODO: check if this gets removed by JS minifier
			dom.root.clientWidth;
			classes.remove('no-transition');
		});
	});
})(window);
