

/**
swipeable
**/

import { last, wrap, set, toPolar } from '../../fn/module.js';
import { attribute, rect, events, children, classes, closest, gestures, matches, select, style, on } from '../module.js';
import './switchable.js';

const selector = '.swipeable, [swipeable]';

var trigger  = events.trigger;
var tau      = Math.PI * 2;

var elasticDistance = 800;

var rspaces = /\s+/;

function elasticEase(n) {
	return Math.atan(n) / Math.PI ;
}

function xMinFromChildren(node) {
	var child = last(children(node).filter(matches('.switchable, [switchable]')));

	// Get the right-most x of the last switchable child's right-most edge
	var w1 = child.offsetLeft + child.clientWidth;
	var w2 = node.parentNode.clientWidth;
	return w2 - w1;
}

function swipe(node, angle) {
	angle = wrap(0, tau, angle || 0);

	// If angle is rightwards
	var prop = (angle > tau * 1 / 8 && angle < tau * 3 / 8) ?
		'previousElementSibling' :
		// If angle is leftwards
		(angle > tau * 5 / 8 && angle < tau * 7 / 8) ?
			'nextElementSibling' :
			false;

	if (!prop) { return; }

	var kids = children(node);

	// it is entirely possible there are no active children – the initial
	// HTML may not specify an active child – in which case we assume the
	// first child is displayed
	var active = kids.find(matches('.active')) || kids[0];

	if (active[prop]) {
		trigger(active[prop], 'dom-activate');
	}
	else {
		transform(node, active);
	}
}

function transform(node, active) {
	var l1 = rect(node).left;
	var l2 = rect(active).left;

	// Round the translation - without rounding images and text become
	// slightly fuzzy as they are antialiased.
	var l  = Math.round(l1 - l2 - style('margin-left', active));
	node.style.transform = 'translate3d(' + l + 'px, 0px, 0px)';
}

function update(swipeable, node) {
	var pos = rect(node);

	// node may not be visible, in which case we can't update
	if (!pos) { return; }

	var l1 = pos.left;
	var l2 = rect(swipeable).left;
	var l  = l1 - l2 - style('margin-left', node);

	swipeable.style.transform = 'translate3d(' + (-l) + 'px, 0px, 0px)';
}


gestures({ selector: selector, threshold: 4 }, document)
.each(function touch(stream) {
	// First event is touchstart or mousedown
	var e = stream.shift();

	if (e.defaultPrevented) { return; }

	var node = closest(selector, e.target);
	var classy = classes(node);
	var transform = style('transform', node);

	transform = !transform || transform === 'none' ? '' : transform ;

	var x = style('transform:translateX', node);

	// Elastic flags and limits
	var eMin = false;
	var eMax = false;
	var xMin = attribute('data-slide-min', node);
	var xMax = attribute('data-slide-max', node);

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

	classy.add('no-transition');

	var ax = x;
    var x0 = e.clientX;
	var y0 = e.clientY;

	// TEMP: keep it around to use the last one in .done().
	var x1, y1;

	stream.map(function(e) {
		x1 = e.clientX;
		y1 = e.clientY;

		var diffX = e.clientX - x0;
		ax = x + diffX;
		var tx = ax > 0 ?
				eMax ? elasticEase(ax / elasticDistance) * elasticDistance - x :
				xMax :
			ax < xMin ?
				eMin ? elasticEase((ax - xMin) / elasticDistance) * elasticDistance + xMin - x :
				xMin :
			diffX ;

		return transform + ' translate3d(' + tx + 'px, 0px, 0px)';
	})
	.each(set('transform', node.style))
	.done(function() {
		classy.remove('no-transition');

		// Todo: Watch out, this may interfere with slides
		var xSnaps = attribute('data-slide-snap', node);
		var tx;

		if (xSnaps) {
			xSnaps = xSnaps.split(rspaces).map(parseFloat);

			// Get closest x from list of snaps
			tx = xSnaps.reduce(function(prev, curr) {
				return Math.abs(curr - ax) < Math.abs(prev - ax) ?
					curr : prev ;
			});

			node.style.transform = transform + ' translate3d(' + tx + 'px, 0px, 0px)';
		}

		//var x = data.x;
		//var y = data.y;
		//var w = node.offsetWidth;
		//var h = node.offsetHeight;
		var polar = toPolar([x1 - x0, y1 - y0]);

		// Todo: check if swipe has enough velocity and distance
		//x/w > settings.threshold || e.velocityX * x/w * settings.sensitivity > 1
		swipe(node, polar[1]);
	});
});

on('dom-activate', function activate(e) {
	// Use method detection - e.defaultPrevented is not set in time for
	// subsequent listeners on the same node
	if (!e.default) { return; }

	var node   = e.target;
	var parent = node.parentNode;

	if (!matches(selector, parent)) { return; }

	var classy = classes(parent);
	classy.remove('no-transition');
	// Force recalc
	// TODO: check if this gets removed by JS minifier
	document.documentElement.clientWidth;
	e.preventDefault();
	update(parent, node);
}, document);

on('resize', function resize() {
	// Update swipeable positions
	select(selector, document).forEach(function(swipeable) {
		var node = children(swipeable).find(matches('.active'));
		if (!node) { return; }
		var classy = classes(swipeable);
		classy.add('no-transition');
		update(swipeable, node);
		// Force recalc
		// TODO: check if this gets removed by JS minifier
		document.documentElement.clientWidth;
		classy.remove('no-transition');
	});
}, window);
