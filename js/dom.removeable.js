// dom.toggleable

import { noop } from '../../fn/module.js';
import { remove, events, matches } from '../module.js';
import './dom-activate.js';

// Define
var match = matches('.removeable, [removeable]');

// Max duration of deactivation transition in seconds
var maxDuration = 1;

// Functions
var on      = events.on;
var off     = events.off;

function activate(e) {
	// Use method detection - e.defaultPrevented is not set in time for
	// subsequent listeners on the same node
	if (!e.default) { return; }

	var target = e.target;
	if (!match(target)) { return; }

	//dom.identify(target);
	e.default();
}

function deactivate(e, data, fn) {
	if (!e.default) { return; }

	var target = e.target;
	if (!match(target)) { return; }

	function update() {
		clearTimeout(timer);
		off(target, 'transitionend', update);
		remove(target);
	}

	var timer = setTimeout(update, maxDuration * 1000);
	on(target, 'transitionend', update);

	e.default();
}

on(document, 'dom-activate', activate);
on(document, 'dom-deactivate', deactivate);
