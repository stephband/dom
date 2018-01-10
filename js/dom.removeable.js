// dom.toggleable

(function(window) {
	"use strict";

	// Import
	var dom         = window.dom;

	// Define
	var matches     = dom.matches('.removeable, [removeable]');

	// Max duration of deactivation transition in seconds
	var maxDuration = 1;

	// Functions
	var on      = dom.events.on;
	var off     = dom.events.off;
	var remove  = dom.remove;

    function activate(e) {
        // Use method detection - e.defaultPrevented is not set in time for
        // subsequent listeners on the same node
        if (!e.default) { return; }

        var target = e.target;
        if (!matches(target)) { return; }

        //dom.identify(target);
        e.default();
    }

	function deactivate(e, data, fn) {
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }

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
})(this);
