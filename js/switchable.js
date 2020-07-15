/**
switchable

A `switchable` is given the class `"active"` when a link that references
it is clicked, and all links to it are given the class `"on"`. In any group of
siblings with the `switchable` attribute, exactly one is always active.

Switchables can be used to make tabs, slideshows, accordions and so on.

```html
<nav>
    <a class="tab-button button on" href="#tab-1">1</a>
    <a class="tab-button button" href="#tab-2">2</a>
    <a class="tab-button button" href="#tab-3">3</a>
</nav>

<section class="tab-block block active" switchable id="tab-1">
    Tab 1
</section>

<section class="tab-block block" switchable id="tab-2">
    Tab 2
</section>

<section class="tab-block block" switchable id="tab-3">
    Tab 3
</section>
```
**/

import { on, trigger, matches, children } from '../module.js';
import { matchers } from './dom-activate.js';

// Define

var match   = matches('.switchable, [switchable]');
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
	active.forEach(triggerDeactivate);
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
