(function(window) {
	"use strict";
	
	var dom     = window.dom;
	var on      = dom.events.on;
	var matches = dom.matches('.dialog-layer');

	on(document, 'dom-activate', function(e) {
		if (e.defaultPrevented) { return; }
		if (!matches(e.target.parentNode)) { return; }
		dom.classes(e.target.parentNode).add('active');
	});

	on(document, 'dom-deactivate', function(e) {
		if (e.defaultPrevented) { return; }
		if (!matches(e.target.parentNode)) { return; }
		dom.classes(e.target.parentNode).remove('active');
	});
})(this);
