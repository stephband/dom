// dom.fullscreenable

import { noop } from '../../fn/fn.js';
import { default as dom, closest, fullscreen, isInternalLink, isPrimaryButton, events, matches } from '../dom.js';
import './dom-activate.js';

(function(window) {
    "use strict";

    var match           = matches('.fullscreenable, [fullscreenable]');
	var on              = events.on;
	var off             = events.off;
	var trigger         = events.trigger;

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
		if (!match(target)) { return; }

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
		if (!match(target)) { return; }

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
    dom.activeMatchers.push(match);
})(window);
