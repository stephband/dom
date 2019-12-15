/*
toggleable

<p>A <strong>toggleable</strong> is very similar to a popable. it
is also activated when a link that references it is clicked – but
then deactivated by a second click an any link that references it.</p>

<p>Toggleables can be used for making
<a class="button" href="#content-toggle">expandable drawers</a>.</p>
*/

import { remove } from '../../fn/module.js';
import { get, events, closest, matches, isPrimaryButton, isInternalLink, identify } from '../module.js';
import { matchers } from './dom-activate.js';

// Define

var match = matches('.toggleable, [toggleable]');

// Functions

var on      = events.on;
var off     = events.off;
var trigger = events.trigger;

var actives = [];

function getHash(node) {
	return (node.hash ?
		node.hash :
		node.getAttribute('href')
	).substring(1);
}

function click(e) {
	// A prevented default means this link has already been handled.
	if (e.defaultPrevented) { return; }
	if (!isPrimaryButton(e)) { return; }

	var node = closest('a[href]', e.target);
	if (!node) { return; }
	if (node.hostname && !isInternalLink(node)) { return; }

	// Does it point to an id?
	var id = getHash(node);
	if (!id) { return; }
	if (actives.indexOf(id) === -1) { return; }

	trigger(get(id), 'dom-deactivate', {
		relatedTarget: node
	});

	e.preventDefault();
}

function activate(e) {
	// Use method detection - e.defaultPrevented is not set in time for
	// subsequent listeners on the same node
	if (!e.default) { return; }

	var target = e.target;
	if (!match(target)) { return; }

	actives.push(identify(target));
	e.default();
}

function deactivate(e, data, fn) {
	if (!e.default) { return; }

	var target = e.target;
	if (!match(target)) { return; }

	remove(actives, target.id);
	e.default();
}

on(document.documentElement, 'click', click);
on(document, 'dom-activate', activate);
on(document, 'dom-deactivate', deactivate);

matchers.push(match);
