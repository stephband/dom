
/*
popable

An element with the `popable` attribute is activated when a link that
references it is hijacked, and deactivated by user interaction outside of it.

An active `popable` gets the class `"active"`, and all links to it get the
class `"on"`.

With a little hide/show style, a popable can be used to make menus, tooltips,
accordions and so on.
*/

import { noop } from '../../fn/module.js';
import { events, matches } from '../module.js';
import { matchers } from './dom-activate.js';

var trigger = events.trigger;
var match   = matches('.popable, [popable]');
var timeStamp = 0;

function activate(e) {
	// Use method detection - e.defaultPrevented is not set in time for
	// subsequent listeners on the same node
	if (!e.default) { return; }

	const node = e.target;
	if (!match(node)) { return; }

	// Make user actions outside node deactivate the node

	requestAnimationFrame(function() {
		function click(e) {
			// Ignore clicks that follow clicks with the same timeStamp – this
			// is true of clicks simulated by browsers on inputs when a label
			// with a corresponding for="id" is clicked. In old Safari the order
			// of thiese simulations with respoect to input and change events
			// does not match other browsers and in rare cases causing Sparky
			// to redo it's rendering
			if (e.timeStamp === timeStamp) { return; }
			timeStamp = e.timeStamp;

			if (node.contains(e.target) || node === e.target) { return; }
			trigger(node, 'dom-deactivate');
		}

		function deactivate(e) {
			if (node !== e.target) { return; }
			if (e.defaultPrevented) { return; }
			document.removeEventListener('click', click);
			document.documentElement.removeEventListener('dom-deactivate', deactivate);
		}

		document.addEventListener('click', click);
		document.documentElement.addEventListener('dom-deactivate', deactivate);
	});

	e.default();
}

function deactivate(e) {
	if (!e.default) { return; }

	var target = e.target;
	if (!match(target)) { return; }
	e.default();
}

document.addEventListener('dom-activate', activate);
document.addEventListener('dom-deactivate', deactivate);
matchers.push(match);
