
import { cache, curry, denormalise, deprecate, Functor as Fn, id, noop, overload, pipe, pow, set, Stream, requestTick, toType } from '../../fn/fn.js';
import append from '../modules/append.js';
import create from '../modules/create.js';
import features from '../modules/features.js';
import prefix from '../modules/prefix.js';
import query from '../modules/query.js';
import style  from '../modules/style.js';
import tag    from '../modules/tag.js';
import Event  from '../modules/event.js';

var Node        = window.Node;

var assign      = Object.assign;
var define      = Object.defineProperties;

var A            = Array.prototype;
var rspaces      = /\s+/;





// DOM Events


var untrapFocus = noop;


function end(e, fn) {
	off(e.currentTarget, features.events.transitionend, end);
	fn(e.timeStamp);
}

function requestEvent(type, fn, node) {
	if (type === 'transitionend') {
		if (!features.transition) {
			fn(performance.now());
			return;
		}

		type = features.events.transitionend;
	}

	on(node, type, end, fn);
}





function trapFocus(node) {
	// Trap focus as described by Nikolas Zachas:
	// http://www.nczonline.net/blog/2013/02/12/making-an-accessible-dialog-box/

	// If there is an existing focus trap, remove it
	untrapFocus();

	// Cache the currently focused node
	var focusNode = document.activeElement || document.body;

	function resetFocus() {
		var focusable = query('[tabindex], a, input, textarea, button', node)[0];
		if (focusable) { focusable.focus(); }
	}

	function preventFocus(e) {
		if (node.contains(e.target)) { return; }

		// If trying to focus outside node, set the focus back
		// to the first thing inside.
		resetFocus();
		e.preventDefault();
		e.stopPropagation();
	}

	// Prevent focus in capture phase
	document.addEventListener("focus", preventFocus, true);

	// Move focus into node
	requestTick(resetFocus);

	return untrapFocus = function() {
		untrapFocus = noop;
		document.removeEventListener('focus', preventFocus, true);

		// Set focus back to the thing that was last focused when the
		// dialog was opened.
		requestTick(function() {
			focusNode.focus();
		});
	};
}



// dom

const dom = {

	// EXAMPLE CODE for mutation observers  ------

	//		var observer = new MutationObserver(function(mutationsList) {
	//		    var mutation;
	//		    for(mutation of mutationsList) {
	//		        if (mutation.addedNodes.length) {
	//		            dom
	//		            .query('a[href="' + router.path + '"]', mutation.target)
	//		            .forEach(dom.addClass('current'));
	//		        }
	//		    }
	//		});
	//
	//		observer.observe(dom.get('calendar'), { childList: true, subtree: true });

	// DOM events

	trapFocus:       trapFocus,
	trap:            deprecate(trapFocus, 'dom.trap() is now dom.trapFocus()'),


	// requestEvent(type, fn, node)

	requestEvent: requestEvent,

	requestFrame: requestAnimationFrame.bind(null),

	requestFrameN: curry(deprecate(function requestFrameN(n, fn) {
		(function frame() {
			return requestAnimationFrame(--n ? frame : fn);
		}());
	}, 'requestFrameN() will be removed soon'), true)
};

define(dom, {
	// Element shortcuts
	root: { value: document.documentElement, enumerable: true },
	head: { value: document.head, enumerable: true },
	body: { get: function() { return document.body; }, enumerable: true	},
	view: { get: function() { return document.scrollingElement; }, enumerable: true }
});

export default dom;
