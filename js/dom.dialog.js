(function(window) {
	"use strict";
	
	var Fn      = window.Fn;
	var dom     = window.dom;

	var requestTick   = Fn.requestTick;
	var on            = dom.events.on;
	var off           = dom.events.off;
	var trigger       = dom.events.trigger;
	var disableScroll = dom.disableScroll;
	var enableScroll  = dom.enableScroll;
	var trap          = dom.trap;

	var matches = dom.matches('.dialog-layer');
	var untrap;

	on(document, 'dom-activate', function(e) {
		if (e.defaultPrevented) { return; }
		if (!matches(e.target.parentNode)) { return; }

		disableScroll(dom.root);
		untrap = trap(e.target);
		dom.classes(e.target.parentNode).add('active');
	});

	on(document, 'dom-deactivate', function(e) {
		if (e.defaultPrevented) { return; }
		if (!matches(e.target.parentNode)) { return; }

		enableScroll(dom.root);
		untrap && untrap();
		dom.classes(e.target.parentNode).remove('active');
	});
})(this);
