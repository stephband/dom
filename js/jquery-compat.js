(function(window) {
	"use strict";

	if (!window.jQuery) { return; }

	// Support jQuery's special event binding system. jQuery will not trigger
	// custom events in the actual DOM unless one has been bound via jQuery, or
	// unless they are declared as special events that force them to the DOM.

	var assign = Object.assign;
	var definition = {
		setup: returnFalse,
		teardown: returnFalse
	};

	function returnFalse() { return false; }

	assign(jQuery.event.special, {
		'dom-activate': definition,
		'dom-deactivate': definition,
		'dom-gesture': definition,
		'dom-swipe': definition
	});

})(window);
