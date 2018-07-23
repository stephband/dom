
import { cache, curry, denormalise, deprecate, Functor as Fn, id, noop, overload, pipe, pow, set, Stream, requestTick, toType } from '../../fn/fn.js';
import append from '../modules/append.js';
import create from '../modules/create.js';
import prefix from '../modules/prefix.js';
import style  from '../modules/style.js';

var Node        = window.Node;
var SVGElement  = window.SVGElement;
var CustomEvent = window.CustomEvent;

var assign      = Object.assign;
var define      = Object.defineProperties;

var A            = Array.prototype;
var svgNamespace = 'http://www.w3.org/2000/svg';
var rspaces      = /\s+/;
var rpx          = /px$/;


// Features

var features = define({
	events: define({}, {
		fullscreenchange: {
			get: cache(function() {
				// TODO: untested event names
				return ('fullscreenElement' in document) ? 'fullscreenchange' :
				('webkitFullscreenElement' in document) ? 'webkitfullscreenchange' :
				('mozFullScreenElement' in document) ? 'mozfullscreenchange' :
				('msFullscreenElement' in document) ? 'MSFullscreenChange' :
				'fullscreenchange' ;
			}),

			enumerable: true
		},

		transitionend: {
			// Infer transitionend event from CSS transition prefix

			get: cache(function() {
				var end = {
					KhtmlTransition: false,
					OTransition: 'oTransitionEnd',
					MozTransition: 'transitionend',
					WebkitTransition: 'webkitTransitionEnd',
					msTransition: 'MSTransitionEnd',
					transition: 'transitionend'
				};

				var prefixed = prefix('transition');
				return prefixed && end[prefixed];
			}),

			enumerable: true
		}
	})
}, {
	inputEventsWhileDisabled: {
		// FireFox won't dispatch any events on disabled inputs:
		// https://bugzilla.mozilla.org/show_bug.cgi?id=329509

		get: cache(function() {
			var input     = document.createElement('input');
			var testEvent = Event('featuretest');
			var result    = false;

			document.body.appendChild(input);
			input.disabled = true;
			input.addEventListener('featuretest', function(e) { result = true; });
			input.dispatchEvent(testEvent);
			input.remove();

			return result;
		}),

		enumerable: true
	},

	template: {
		get: cache(function() {
			// Older browsers don't know about the content property of templates.
			return 'content' in document.createElement('template');
		}),

		enumerable: true
	},

	textareaPlaceholderSet: {
		// IE sets textarea innerHTML (but not value) to the placeholder
		// when setting the attribute and cloning and so on. The twats have
		// marked it "Won't fix":
		//
		// https://connect.microsoft.com/IE/feedback/details/781612/placeholder-text-becomes-actual-value-after-deep-clone-on-textarea

		get: cache(function() {
			var node = document.createElement('textarea');
			node.setAttribute('placeholder', '---');
			return node.innerHTML === '';
		}),

		enumerable: true
	},

	transition: {
		get: cache(function testTransition() {
			var prefixed = prefix('transition');
			return prefixed || false;
		}),

		enumerable: true
	},

	fullscreen: {
		get: cache(function testFullscreen() {
			var node = document.createElement('div');
			return !!(node.requestFullscreen ||
				node.webkitRequestFullscreen ||
				node.mozRequestFullScreen ||
				node.msRequestFullscreen);
		}),

		enumerable: true
	},

	// Deprecated

	transitionend: {
		get: function() {
			console.warn('dom.features.transitionend deprecated in favour of dom.features.events.transitionend.');
			return features.events.transitionend;
		},

		enumerable: true
	}
});


// Utilities

function bindTail(fn) {
	// Takes arguments 1 and up and appends them to arguments
	// passed to fn.
	var args = A.slice.call(arguments, 1);
	return function() {
		A.push.apply(arguments, args);
		fn.apply(null, arguments);
	};
}

function prefixSlash(str) {
	// Prefixes a slash when there is not an existing one
	return (/^\//.test(str) ? '' : '/') + str ;
}

function toArray(object) {
	// Speed test for array conversion:
	// https://jsperf.com/nodelist-to-array/27

	var array = [];
	var l = array.length = object.length;
	var i;

	for (i = 0; i < l; i++) {
		array[i] = object[i];
	}

	return array;
}


// TokenList
// TokenList constructor to emulate classList property. The get fn should
// take the arguments (node), and return a string of tokens. The set fn
// should take the arguments (node, string).

function TokenList(node, get, set) {
	this.node = node;
	this.get = get;
	this.set = set;
}

TokenList.prototype = {
	add: function() {
		var n = arguments.length;
		var tokens = this.get(this.node);
		var array = tokens ? tokens.trim().split(rspaces) : [] ;

		while (n--) {
			if (array.indexOf(arguments[n]) === -1) {
				array.push(arguments[n]);
			}
		}

		this.set(this.node, array.join(' '));
	},

	remove: function() {
		var n = arguments.length;
		var tokens = this.get(this.node);
		var array = tokens ? tokens.trim().split(rspaces) : [] ;
		var i;

		while (n--) {
			i = array.indexOf(arguments[n]);
			if (i !== -1) { array.splice(i, 1); }
		}

		this.set(this.node, array.join(' '));
	},

	contains: function(string) {
		var tokens = this.get(this.node);
		var array = tokens ? tokens.trim().split(rspaces) : [] ;
		return array.indexOf(string) !== -1;
	}
};


// DOM Nodes

var types = {
	1:  'element',
	3:  'text',
	8:  'comment',
	9:  'document',
	10: 'doctype',
	11: 'fragment'
};

var clone = features.textareaPlaceholderSet ?

	function clone(node) {
		return node.cloneNode(true);
	} :

	function cloneWithHTML(node) {
		// IE sets textarea innerHTML to the placeholder when cloning.
		// Reset the resulting value.

		var clone     = node.cloneNode(true);
		var textareas = dom.query('textarea', node);
		var n         = textareas.length;
		var clones;

		if (n) {
			clones = dom.query('textarea', clone);

			while (n--) {
				clones[n].value = textareas[n].value;
			}
		}

		return clone;
	} ;

function type(node) {
	return types[node.nodeType];
}

function isElementNode(node) {
	return node.nodeType === 1;
}

function isTextNode(node) {
	return node.nodeType === 3;
}

function isCommentNode(node) {
	return node.nodeType === 8;
}

function isFragmentNode(node) {
	return node.nodeType === 11;
}

function isInternalLink(node) {
	var location = window.location;

		// IE does not give us a .hostname for links to
		// xxx.xxx.xxx.xxx URLs
	return node.hostname &&
		// IE gives us the port on node.host, even where it is not
		// specified. Use node.hostname
		location.hostname === node.hostname &&
		// IE gives us node.pathname without a leading slash, so
		// add one before comparing
		location.pathname === prefixSlash(node.pathname);
}

function isValid(node) {
	return node.validity ? node.validity.valid : true ;
}

function identify(node) {
	var id = node.id;

	if (!id) {
		do { id = Math.ceil(Math.random() * 100000); }
		while (document.getElementById(id));
		node.id = id;
	}

	return id;
}

function tag(node) {
	return node.tagName && node.tagName.toLowerCase();
}

function attribute(name, node) {
	return node.getAttribute && node.getAttribute(name) || undefined ;
}

function setClass(node, classes) {
	if (node instanceof SVGElement) {
		node.setAttribute('class', classes);
	}
	else {
		node.className = classes;
	}
}

function classes(node) {
	return node.classList || new TokenList(node, dom.attribute('class'), setClass);
}

function addClass(string, node) {
	classes(node).add(string);
}

function removeClass(string, node) {
	classes(node).remove(string);
}

function flashClass(string, node) {
	var list = classes(node);
	list.add(string);
	requestAnimationFrame(function() {
		list.remove(string);
	});
}


// DOM Traversal

function find(selector, node) {
	return node.querySelector(selector);
}

function query(selector, node) {
	return toArray(node.querySelectorAll(selector));
}

function contains(child, node) {
	return node.contains ?
		node.contains(child) :
	child.parentNode ?
		child.parentNode === node || contains(child.parentNode, node) :
	false ;
}

function matches(selector, node) {
	return node.matches ? node.matches(selector) :
		node.matchesSelector ? node.matchesSelector(selector) :
		node.webkitMatchesSelector ? node.webkitMatchesSelector(selector) :
		node.mozMatchesSelector ? node.mozMatchesSelector(selector) :
		node.msMatchesSelector ? node.msMatchesSelector(selector) :
		node.oMatchesSelector ? node.oMatchesSelector(selector) :
		// Dumb fall back to simple tag name matching. Nigh-on useless.
		tag(node) === selector ;
}

function closest(selector, node) {
	var root = arguments[2];

	if (!node || node === document || node === root || node.nodeType === 11) { return; }

	// SVG <use> elements store their DOM reference in
	// .correspondingUseElement.
	node = node.correspondingUseElement || node ;

	return matches(selector, node) ?
		 node :
		 closest(selector, node.parentNode, root) ;
}

function next(node) {
	return node.nextElementSibling || undefined;
}

function previous(node) {
	return node.previousElementSibling || undefined;
}


// DOM Mutation

function appendChild(target, node) {
	target.appendChild(node);

	// Use this fn as a reducer
	return target;
}

function empty(node) {
	while (node.lastChild) { node.removeChild(node.lastChild); }
}

function removeNode(node) {
	node.parentNode && node.parentNode.removeChild(node);
}

function remove(node) {
	if (node instanceof Node || node instanceof SVGElement) {
		removeNode(node);
	}
	else {
		A.forEach.call(node, removeNode);
	}
}

function before(target, node) {
	target.parentNode && target.parentNode.insertBefore(node, target);
}

function after(target, node) {
	target.parentNode && target.parentNode.insertBefore(node, target.nextSibling);
}

function replace(target, node) {
	before(target, node);
	remove(target);
	return target;
}


// CSS

function windowBox() {
	return {
		left:   0,
		top:    0,
		right:  window.innerWidth,
		bottom: window.innerHeight,
		width:  window.innerWidth,
		height: window.innerHeight
	};
}

function box(node) {
	return node === window ?
		windowBox() :
		node.getClientRects()[0] ;
}

function bounds(node) {
	return node.getBoundingClientRect();
}

//function offset(node) {
//	var rect = box(node);
//	var scrollX = window.scrollX === undefined ? window.pageXOffset : window.scrollX ;
//	var scrollY = window.scrollY === undefined ? window.pageYOffset : window.scrollY ;
//	return [rect.left + scrollX, rect.top + scrollY];
//}

function offset(node1, node2) {
	var box1 = box(node1);
	var box2 = box(node2);
	return [box2.left - box1.left, box2.top - box1.top];
}


// DOM Events

var eventOptions = { bubbles: true };

var eventsSymbol = Symbol('events');

var untrapFocus = noop;

function Event(type, properties) {
	var options = assign({}, eventOptions, properties);
	var event   = new CustomEvent(type, options);

	if (properties) {
		delete properties.detail;
		assign(event, properties);
	}

	return event;
}

function preventDefault(e) {
	e.preventDefault();
}

function isTargetEvent(e) {
	return e.target === e.currentTarget;
}

function isPrimaryButton(e) {
	// Ignore mousedowns on any button other than the left (or primary)
	// mouse button, or when a modifier key is pressed.
	return (e.which === 1 && !e.ctrlKey && !e.altKey && !e.shiftKey);
}

function on(node, type, fn, data) {
	var options;

	if (typeof type === 'object') {
		options = type;
		type    = options.type;
	}

	var types   = type.split(rspaces);
	var events  = node[eventsSymbol] || (node[eventsSymbol] = {});
	var handler = data ? bindTail(fn, data) : fn ;
	var handlers;

	var n = -1;
	while (++n < types.length) {
		type = types[n];
		handlers = events[type] || (events[type] = []);
		handlers.push([fn, handler]);
		node.addEventListener(type, handler, options);
	}

	return node;
}

function once(node, types, fn, data) {
	on(node, types, function once() {
		off(node, types, once);
		fn.apply(null, arguments);
	}, data);
}

function off(node, type, fn) {
	var options;

	if (typeof type === 'object') {
		options = type;
		type    = options.type;
	}

	var types   = type.split(rspaces);
	var events  = node[eventsSymbol];
	var handlers, i;

	if (!events) { return node; }

	var n = -1;
	while (n++ < types.length) {
		type = types[n];
		handlers = events[type];
		if (!handlers) { continue; }
		i = handlers.length;
		while (i--) {
			if (handlers[i][0] === fn) {
				node.removeEventListener(type, handlers[i][1]);
				handlers.splice(i, 1);
			}
		}
	}

	return node;
}

function trigger(node, type, properties) {
	// Don't cache events. It prevents you from triggering an event of a
	// given type from inside the handler of another event of that type.
	var event = Event(type, properties);
	node.dispatchEvent(event);
}

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

function delegate(selector, fn) {
	// Create an event handler that looks up the ancestor tree
	// to find selector.
	return function handler(e) {
		var node = closest(selector, e.target, e.currentTarget);
		if (!node) { return; }
		e.delegateTarget = node;
		fn(e, node);
		e.delegateTarget = undefined;
	};
}

function prefixType(type) {
	return features.events[type] || type ;
}

function event(type, node) {
	var options;

	if (typeof type === 'object') {
		options = type;
		type    = options.type;
	}

	var types = type.split(rspaces).map(prefixType);

	return new Stream(function setup(notify, stop) {
		var buffer = [];

		function update(value) {
			buffer.push(value);
			notify('push');
		}

		types.forEach(function(type) {
			node.addEventListener(type, update, options);
		});

		return {
			shift: function shiftEvent() {
				return buffer.shift();
			},

			stop: function stopEvent() {
				types.forEach(function(type) {
					node.removeEventListener(type, update);
				});

				stop(buffer.length);
			}
		};
	});
}

function trapFocus(node) {
	// Trap focus as described by Nikolas Zachas:
	// http://www.nczonline.net/blog/2013/02/12/making-an-accessible-dialog-box/

	// If there is an existing focus trap, remove it
	untrapFocus();

	// Cache the currently focused node
	var focusNode = document.activeElement || document.body;

	function resetFocus() {
		var focusable = dom.query('[tabindex], a, input, textarea, button', node)[0];
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


// DOM Fragments and Templates

function fragmentFromChildren(node) {
	if (node.domFragmentFromChildren) {
		return node.domFragmentFromChildren;
	}

	var fragment = create('fragment');
	node.domFragmentFromChildren = fragment;

	var n = -1;
	while (node.childNodes[++n] !== undefined) {
		append(fragment, node.childNodes[n]);
	}

	return fragment;
}

function fragmentFromHTML(html, tag) {
	var node = document.createElement(tag || 'div');
	node.innerHTML = html;
	return fragmentFromChildren(node);
}

function fragmentFromTemplate(node) {
	// A template tag has a content property that gives us a document
	// fragment. If that doesn't exist we must make a document fragment.
	return node.content || fragmentFromChildren(node);
}

function fragmentFromId(id) {
	var node = document.getElementById(id);

	if (!node) { throw new Error('DOM: element id="' + id + '" is not in the DOM.') }

	var t = tag(node);

	// In browsers where templates are not inert their content can clash
	// with content in the DOM - ids, for example. Remove the template as
	// a precaution.
	if (t === 'template' && !features.template) {
		remove(node);
	}

	return t === 'template' ? fragmentFromTemplate(node) :
		t === 'script' ? fragmentFromHTML(node.innerHTML, attribute('data-parent-tag', node)) :
		fragmentFromChildren(node) ;
}


// Units

var runit = /(\d*\.?\d+)(r?em|vw|vh)/;
//var rpercent = /(\d*\.?\d+)%/;

var fontSize;

var units = {
	em: function(n) {
		return getFontSize() * n;
	},

	rem: function(n) {
		return getFontSize() * n;
	},

	vw: function(n) {
		return window.innerWidth * n / 100;
	},

	vh: function(n) {
		return window.innerHeight * n / 100;
	}
};

var toPx = overload(toType, {
	'number': id,

	'string': function(string) {
		var data = runit.exec(string);

		if (data) {
			return units[data[2]](parseFloat(data[1]));
		}

		throw new Error('dom: "' + string + '" cannot be parsed as rem, em, vw or vh units.');
	}
});

function toRem(n) {
	return (toPx(n) / getFontSize()) + 'rem';
}

function toVw(n) {
	return (100 * toPx(n) / window.innerWidth) + 'vw';
}

function toVh(n) {
	return (100 * toPx(n) / window.innerHeight) + 'vh';
}

function getFontSize() {
	return fontSize ||
		(fontSize = parseFloat(style("font-size", document.documentElement), 10));
}


// Animation and scrolling

function transition(duration, fn) {
	var t0 = performance.now();

	function frame(t1) {
		// Progress from 0-1
		var progress = (t1 - t0) / (duration * 1000);

		if (progress < 1) {
			if (progress > 0) {
				fn(progress);
			}
			id = requestAnimationFrame(frame);
		}
		else {
			fn(1);
		}
	}

	var id = requestAnimationFrame(frame);

	return function cancel() {
		cancelAnimationFrame(id);
	};
}

function animate(duration, transform, name, object, value) {
	return transition(
		duration,
		pipe(transform, denormalise(object[name], value), set(name, object))
	);
}

function animateScroll(coords) {
	var duration = 0.6;
	var ease = pow(2);

	// coords may be a single y value or a an [x, y] array
	var x, y;

	if (typeof coords === "number") {
		x = false;
		y = coords;
	}
	else {
		x = coords[0];
		y = coords[1];
	}

	var denormaliseX = x !== false && denormalise(dom.view.scrollLeft, x);
	var denormaliseY = denormalise(dom.view.scrollTop, y);

	return transition(
		duration,
		pipe(ease, function(progress) {
			x !== false && (dom.view.scrollLeft = denormaliseX(progress));
			dom.view.scrollTop  = denormaliseY(progress);
		})
	);
}

function disableScroll(node) {
	node = node || document.documentElement;

	var scrollLeft = node.scrollLeft;
	var scrollTop  = node.scrollTop;

	// Remove scrollbars from the documentElement
	//docElem.css({ overflow: 'hidden' });
	node.style.overflow = 'hidden';

	// FF has a nasty habit of linking the scroll parameters
	// of document with the documentElement, causing the page
	// to jump when overflow is hidden on the documentElement.
	// Reset the scroll position.
	if (scrollTop)  { node.scrollTop = scrollTop; }
	if (scrollLeft) { node.scrollLeft = scrollLeft; }

	// Disable gestures on touch devices
	//add(document, 'touchmove', preventDefaultOutside, layer);
}

function enableScroll(node) {
	node = node || document.documentElement;

	var scrollLeft = node.scrollLeft;
	var scrollTop  = node.scrollTop;

	// Put scrollbars back onto docElem
	node.style.overflow = '';

	// FF fix. Reset the scroll position.
	if (scrollTop) { node.scrollTop = scrollTop; }
	if (scrollLeft) { node.scrollLeft = scrollLeft; }

	// Enable gestures on touch devices
	//remove(document, 'touchmove', preventDefaultOutside);
}

// dom

export default function dom(selector) {
	return query(selector, document);
};

var ready = new Promise(function(accept, reject) {
	function handle() {
		document.removeEventListener('DOMContentLoaded', handle);
		window.removeEventListener('load', handle);
		accept();
	}

	document.addEventListener('DOMContentLoaded', handle);
	window.addEventListener('load', handle);
});

assign(dom, {

	// DOM lifecycle

	ready:   ready.then.bind(ready),

	now:     function() {
		// Return DOM time in seconds
		return window.performance.now() / 1000;
	},

	// DOM traversal

	get: function get(id) {
		return document.getElementById(id) || undefined;
	},

	find:     curry(find,     true),
	query:    curry(query,    true),
	closest:  curry(closest,  true),
	contains: curry(contains, true),
	matches:  curry(matches,  true),
	next:     next,
	previous: previous,

	// DOM mutation

	clone:    clone,
	identify: identify,
	before:   curry(before,  true),
	after:    curry(after,   true),
	replace:  curry(replace, true),
	empty:    empty,
	remove:   remove,

	validate: function(node) {
		return node.checkValidity ? node.checkValidity() : true ;
	},

	fullscreen: function fullscreen(node) {
		// Find the right method and call it
		return node.requestFullscreen ? node.requestFullscreen() :
			node.webkitRequestFullscreen ? node.webkitRequestFullscreen() :
			node.mozRequestFullScreen ? node.mozRequestFullScreen() :
			node.msRequestFullscreen ? node.msRequestFullscreen() :
			undefined ;
	},

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

	// DOM inspection

	isElementNode:  isElementNode,
	isTextNode:     isTextNode,
	isCommentNode:  isCommentNode,
	isFragmentNode: isFragmentNode,
	isInternalLink: isInternalLink,
	isValid:        isValid,

	type:        type,
	tag:         tag,
	attribute:   curry(attribute, true),
	classes:     classes,
	addClass:    curry(addClass,    true),
	removeClass: curry(removeClass, true),
	flashClass:  curry(flashClass,  true),

	box:         box,
	bounds:      bounds,
	offset:      curry(offset, true),

	toPx:           toPx,
	toRem:          toRem,
	toVw:           toVw,
	toVh:           toVh,

	// DOM fragments and templates

	fragmentFromTemplate: fragmentFromTemplate,
	fragmentFromChildren: fragmentFromChildren,
	fragmentFromHTML:     fragmentFromHTML,
	fragmentFromId:       fragmentFromId,

	// DOM events

	Event:           Event,
	delegate:        delegate,
	isPrimaryButton: isPrimaryButton,
	isTargetEvent:   isTargetEvent,
	preventDefault:  preventDefault,
	trapFocus:       trapFocus,
	trap:            deprecate(trapFocus, 'dom.trap() is now dom.trapFocus()'),

	trigger: curry(function(type, node) {
		trigger(node, type);
		return node;
	}, true),

	events: assign(curry(event, true), {
		on:      on,
		once:    once,
		off:     off,
		trigger: trigger
	}),

	on:    deprecate(curry(event, true), 'dom.on() is now dom.events()'),
	event: deprecate(curry(event, true), 'Deprecated dom.event() – now dom.events()'),

	// DOM animation adn scrolling

	// transition(duration, fn)
	//
	// duration  - duration seconds
	// fn        - callback that is called with a float representing
	//             progress in the range 0-1

	transition: curry(transition, true),
	schedule:   deprecate(transition, 'dom: .schedule() is now .transition()'),

	// animate(duration, transform, value, name, object)
	//
	// duration  - in seconds
	// transform - function that maps x (0-1) to y (0-1)
	// name      - name of property to animate
	// object    - object to animate
	// value     - target value

	animate: curry(animate, true),

	// animateScroll(n)
	//
	// Animate scrollTop of scrollingElement to n (in px)

	animateScroll: animateScroll,
	scrollTo: deprecate(animateScroll, 'scrollTo(px, node) renamed to animateScroll(px)'),

	// disableScroll(node)
	//
	// Disables scrolling without causing node's content to jump

	disableScroll: disableScroll,

	// enableScroll(node)
	//
	// Enables scrolling without causing node's content to jump

	enableScroll: enableScroll,

	// requestEvent(type, fn, node)

	requestEvent: requestEvent,

	requestFrame: requestAnimationFrame.bind(null),

	requestFrameN: curry(deprecate(function requestFrameN(n, fn) {
		(function frame() {
			return requestAnimationFrame(--n ? frame : fn);
		}());
	}, 'requestFrameN() will be removed soon'), true),

	// Features

	features: features,

	// Safe visible area

	safe: define({
		left: 0
	}, {
		right:  { get: function() { return window.innerWidth; }, enumerable: true, configurable: true },
		top:    { get: function() { return style('padding-top', document.body); }, enumerable: true, configurable: true },
		bottom: { get: function() { return window.innerHeight; }, enumerable: true, configurable: true }
	})
});

define(dom, {
	// Element shortcuts
	root: { value: document.documentElement, enumerable: true },
	head: { value: document.head, enumerable: true },
	body: { get: function() { return document.body; }, enumerable: true	},
	view: { get: function() { return document.scrollingElement; }, enumerable: true }
});
