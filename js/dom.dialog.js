(function(window) {
	"use strict";
	
	var dom = window.dom;
	var on  = dom.events.on;
	var trigger = dom.events.trigger;

	function disableScroll(layer) {
		var html       = document.documentElement;
		var scrollLeft = html.scrollLeft;
		var scrollTop  = html.scrollTop;

		// Remove scrollbars from the documentElement
		//docElem.css({ overflow: 'hidden' });
		html.style.overflow = 'hidden';

		// FF has a nasty habit of linking the scroll parameters
		// of document with the documentElement, causing the page
		// to jump when overflow is hidden on the documentElement.
		// Reset the scroll position.
		if (scrollTop) { html.scrollTop = scrollTop; }
		if (scrollLeft) { html.scrollLeft = scrollLeft; }

		// Disable gestures on touch devices
		//add(document, 'touchmove', preventDefaultOutside, layer);
	}
	
	function enableScroll() {
		var html       = document.documentElement;
		var scrollLeft = html.scrollLeft;
		var scrollTop  = html.scrollTop;
		
		// Put scrollbars back onto docElem
		html.style.overflow = '';
		
		// FF fix. Reset the scroll position.
		if (scrollTop) { html.scrollTop = scrollTop; }
		if (scrollLeft) { html.scrollLeft = scrollLeft; }

		// Enable gestures on touch devices
		//remove(document, 'touchmove', preventDefaultOutside);
	}
	
	function trapFocus(node, focusNode) {
		// Trap focus as described by Nikolas Zachas:
		// http://www.nczonline.net/blog/2013/02/12/making-an-accessible-dialog-box/
		
		// Find the first focusable thing.
		var firstNode = jQuery('[tabindex], a, input, textarea, button', node)[0];

		if (!firstNode) { return; }

		focusNode = focusNode || document.body;

		function preventFocus(e) {
			// If trying to focus outside node, set the focus back
			// to the first thing inside.
			if (!node.contains(e.target)) {
				e.stopPropagation();
				firstNode.focus();
			}
		}

		setTimeout(function() { firstNode.focus(); }, 0);

		// Prevent focus in capture phase
		if (document.addEventListener) {
			document.addEventListener("focus", preventFocus, true);
		}

		add(node, 'deactivate', function deactivate() {
			// Set focus back to the thing that was last focused when the
			// dialog was opened.
			setTimeout(function() { focusNode.focus(); }, 0);
			remove(node, 'deactivate', deactivate);

			if (document.addEventListener && document.removeEventListener) {
				document.removeEventListener('focus', preventFocus);
			}
		});
	}
	
	function deactivateFocus(e) {
		var focusNode = e.data;
		
		focusNode.focus();
		remove(e.target, 'deactivate', deactivateFocus);
	}

	on(document, 'activate', function(e) {
		if (e.defaultPrevented) { return; }
		if (!dom.matches('.dialog-layer', e.target.parentNode)) { return; }
		disableScroll(e.target.parentNode);
		trapFocus(e.target.parentNode);
		dom.classes(e.target.parentNode).add('active');
	});

	on(document, 'deactivate', function(e) {
		if (e.defaultPrevented) { return; }
		if (!dom.matches('.dialog-layer', e.target.parentNode)) { return; }
		enableScroll(e.target.parentNode);
		trapFocus(e.target.parentNode);
		dom.classes(e.target.parentNode).remove('active');
	});

	on(document, 'activate', dom.delegate('.dialog', function(e) {
		// Activate events from inside a dialog should also activate the dialog
		if (e.defaultPrevented) { return; }
		if (e.target === e.delegateTarget) { return; }
		var delegateTarget = e.delegateTarget;
		requestAnimationFrame(function() {
			trigger(delegateTarget, 'activate');
		});
	}));

})(this);