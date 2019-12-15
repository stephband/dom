
/*
popable

<p>A <strong>popable</strong> is activated when a link that
references it is clicked, and deactivated by user events heard
outside of it.</p>

<p>Popables can be useful for making pop-down menus and
<a class="button" href="#popable-dialog">dialogs</a>.</p>

<div class="dialog-layer layer fixed" href="#popable-dialog">
    <div class="dialog popable focusable" id="popable-dialog" style="max-width: 30rem;">
        <p>A popable goes away when clicked outside of, so you can click
        on the background layer to close this dialog.</p>
    </div>
</div>
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
