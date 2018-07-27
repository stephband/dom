// dom.popable
//
// Extends the default behaviour of events for the .tip class.

import { noop } from '../../fn/fn.js';
import { default as dom, events, matches } from '../dom.js';
import { matchers } from './dom-activate.js';

(function(window) {
	var trigger = events.trigger;
	var match   = matches('.popable, [popable]');

	function activate(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var node    = e.target;
		if (!match(node)) { return; }

		// Make user actions outside node deactivat the node

		requestAnimationFrame(function() {
			function click(e) {
				if (node.contains(e.target) || node === e.target) { return; }
				trigger(node, 'dom-deactivate');
			}

			function deactivate(e) {
				if (node !== e.target) { return; }
				if (e.defaultPrevented) { return; }
				document.removeEventListener('click', click);
				document.removeEventListener('dom-deactivate', deactivate);
			}

			document.addEventListener('click', click);
			document.addEventListener('dom-deactivate', deactivate);
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
})(window);
