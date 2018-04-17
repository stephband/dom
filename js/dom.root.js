
(function(window) {
	"use strict";

	// Adds classes to the document root depending on the last input device
	// used, enabling you to set :focus styles depending on the type of input
	// responible for focus. Hopefully. Not foolproof, but better than getting
	// rid of focus outlines altogether.

	var dom        = window.dom;
	var on         = dom.events.on;
	var off        = dom.events.off;
	var keyClass   = 'keyboard';
	var mouseClass = 'mouse';

	function mousedown(e) {
		off(document, 'mousedown', mousedown);
		on(document, 'keydown', keydown);

		var classes = dom.classes(dom.root);
		classes.remove(keyClass);
		classes.add(mouseClass);
	}

	function keydown(e) {
		// If key is not tab, enter or escape do nothing
		if ([9, 13, 27].indexOf(e.keyCode) === -1) { return; }

		off(document, 'keydown', keydown);
		on(document, 'mousedown', mousedown);

		var classes = dom.classes(dom.root);
		classes.remove(mouseClass);
		classes.add(keyClass);
	}

	on(document, 'mousedown', mousedown);
})(window);
