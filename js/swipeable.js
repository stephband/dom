
import { last, wrap } from '../../fn/module.js';
import { attribute, box, events, children, classes, closest, matches, query, style } from '../module.js';
import './dom-swipe.js';
import './dom-gesture.js';
import './switchable.js';

const selector = '.swipeable, [swipeable]';

var on       = events.on;
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

on(document, 'dom-gesture', function touch(e) {
	if (e.defaultPrevented) { return; }

	var node = closest(selector, e.target);
	if (!node) { return; }

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

	// e.detail() is a stream of touch coordinates
	var stream = e.detail();
    var x0 = stream.shift().pageX;

	stream.map(function(e) {
        var diffX = e.pageX - pageX;
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
	.each(function(transform) {
		node.style.transform = transform;
	})
	.done(function() {
		classy.remove('no-transition');

		// Todo: Watch out, this may interfere with slides
		var xSnaps = attribute('data-slide-snap', node);

		if (!xSnaps) { return; }
		xSnaps = xSnaps.split(rspaces).map(parseFloat);

		// Get closest x from list of snaps
		var tx = xSnaps.reduce(function(prev, curr) {
			return Math.abs(curr - ax) < Math.abs(prev - ax) ?
				curr : prev ;
		});

		//requestAnimationFrame(function() {
			node.style.transform = transform + ' translate3d(' + tx + 'px, 0px, 0px)';
		//});
	});
});

function transform(node, active) {
	var l1 = box(node).left;
	var l2 = box(active).left;

	// Round the translation - without rounding images and text become
	// slightly fuzzy as they are antialiased.
	var l  = Math.round(l1 - l2 - style('margin-left', active));
	node.style.transform = 'translate3d(' + l + 'px, 0px, 0px)';
}

function update(swipeable, node) {
	var pos = box(node);

	// node may not be visible, in which case we can't update
	if (!pos) { return; }

	var l1 = pos.left;
	var l2 = box(swipeable).left;
	var l  = l1 - l2 - style('margin-left', node);

	swipeable.style.transform = 'translate3d(' + (-l) + 'px, 0px, 0px)';
}

on(document, 'dom-swipe', function swipe(e) {
	if (e.defaultPrevented) { return; }

	var node = closest(selector, e.target);
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

	var kids = children(node);

	// it is entirely possible there are no active children – the initial
	// HTML may not specify an active child – in which case we assume the
	// first child is displayed
	var active = kids
	.filter(matches('.active'))
	.shift() || kids.shift();

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

	if (!matches(selector, parent)) { return; }

	var classy = classes(parent);
	classy.remove('no-transition');
	// Force recalc
	// TODO: check if this gets removed by JS minifier
	document.documentElement.clientWidth;
	e.preventDefault();
	update(parent, node);
});

on(window, 'resize', function resize() {
	// Update swipeable positions
	query(selector, document).forEach(function(swipeable) {
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
});
