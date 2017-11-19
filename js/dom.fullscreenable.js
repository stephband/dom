// dom.fullscreenable

(function(window) {
    "use strict";

    // Import

	var Fn      = window.Fn;
	var dom     = window.dom;

    // Define

    var matches = dom.matches('.fullscreenable, [fullscreenable]');
	var on      = dom.events.on;
	var triggerDeactivate = dom.trigger('dom-deactivate');

	function activate(e) {
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }

        console.log('FULL');

        dom.fullscreen(e.target);

        // Don't call the default activate actions, we are hijacking the
        // activate and making it do fullscreen stuff. There is a
        // fullscreenchange event to listen to for changes, and you can check
        // the current fullscreened element with document.fullscreenElement.
		//e.default();
	}

    on(document, 'dom-activate', activate);
    dom.activeMatchers.push(matches);
})(this);
