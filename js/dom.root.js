
import { classes, events } from '../module.js';

// Adds classes to the document root depending on the last input device
// used, enabling you to set :focus styles depending on the type of input
// responible for focus. Hopefully. Not foolproof, but better than getting
// rid of focus outlines altogether.

var on         = events.on;
var off        = events.off;
var keyClass   = 'keyboard';
var mouseClass = 'mouse';

function mousedown(e) {
	off(document, 'mousedown', mousedown);
	on(document, 'keydown', keydown);

	var cls = classes(document.documentElement);
	cls.remove(keyClass);
	cls.add(mouseClass);
}

function keydown(e) {
	// If key is not tab, enter or escape do nothing
	if ([9, 13, 27].indexOf(e.keyCode) === -1) { return; }

	off(document, 'keydown', keydown);
	on(document, 'mousedown', mousedown);

	var cls = classes(document.documentElement);
	cls.remove(mouseClass);
	cls.add(keyClass);
}

on(document, 'mousedown', mousedown);
