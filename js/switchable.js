/*
switchable

Extends the default behaviour of the activate and deactivate
events with things to do when they are triggered on nodes.

<p>In any group of <strong>switchable</strong> siblings, one is
always active. A switchable is activated when a link that references
it is clicked, while the currently active switchable is
deactivated.</p>
<p>Groups of switchables can be styled to make tabs or
slideshows.</p

<p>For any group of siblings with the class <code>switchable</code>,
only one can be <code>active</code> at any one time.</p>

<ul class="inline-index index">
    <li><a class="tab-button button" href="#tab-1">1</a></li>
    <li><a class="tab-button button" href="#tab-2">2</a></li>
    <li><a class="tab-button button" href="#tab-3">3</a></li>
</ul>

<div class="tab-block block switchable" id="tab-1">
    Tab 1
</div

><div class="tab-block block switchable" id="tab-2">
    Tab 2
</div

><div class="tab-block block switchable" id="tab-3">
    Tab 3
</div>
*/

import { Fn } from '../../fn/module.js';
import { events, trigger, matches, children } from '../module.js';
import { matchers } from './dom-activate.js';

// Define

var match   = matches('.switchable, [switchable]');
var on      = events.on;
var triggerDeactivate = trigger('dom-deactivate');

function activate(e) {
	if (!e.default) { return; }

	var target = e.target;
	if (!match(target)) { return; }

	var nodes = children(target.parentNode).filter(match);
	var i     = nodes.indexOf(target);

	nodes.splice(i, 1);
	var active = nodes.filter(matches('.active'));

	e.default();

	// Deactivate the previous active pane AFTER this pane has been
	// activated. It's important for panes who's style depends on the
	// current active pane, eg: .slide.active ~ .slide
	Fn.from(active).each(triggerDeactivate);
}

function deactivate(e) {
	if (!e.default) { return; }

	var target = e.target;
	if (!match(target)) { return; }

	e.default();
}

on(document, 'dom-activate', activate);
on(document, 'dom-deactivate', deactivate);
matchers.push(match);
