// dom.fullscreenable

(function(window) {
    "use strict";

    // Import

	var Fn      = window.Fn;
	var dom     = window.dom;

    // Define

    var noop            = Fn.noop;
    var matches         = dom.matches('.fullscreenable, [fullscreenable]');
    var closest         = dom.closest;
	var on              = dom.events.on;
	var off             = dom.events.off;
	var trigger         = dom.events.trigger;
    var fullscreen      = dom.fullscreen;
    var isInternalLink  = dom.isInternalLink;
    var isPrimaryButton = dom.isPrimaryButton;

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

        // Does the id match the fullscreen element?
        if (id !== e.currentTarget.id) { return; }

        trigger(e.currentTarget, 'dom-deactivate', { relatedTarget: node });
        e.preventDefault();
    }

	function activate(e) {
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }

        fullscreen(e.target);
        on(e.target, 'click', click);

        // Don't call the default activate actions, we are hijacking the
        // activate and making it do fullscreen stuff. There is a
        // fullscreenchange event to listen to for changes, and you can check
        // the current fullscreened element with document.fullscreenElement.
		e.default();
	}

	function deactivate(e, data, fn) {
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }

        document.exitFullscreen ? document.exitFullscreen() :
        document.webkitExitFullscreen ? document.webkitExitFullscreen() :
        document.mozCancelFullScreen ? document.mozCancelFullScreen() :
        document.msExitFullscreen ? document.msExitFullscreen() :
        noop() ;

        off(e.target, 'click', click);
		e.default();
	}

    on(document, 'dom-activate', activate);
    on(document, 'dom-deactivate', deactivate);
    dom.activeMatchers.push(matches);
})(window);
