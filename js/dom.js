(function(window) {
	if (!window.console || !window.console.log) { return; }
	console.log('dom         – https://github.com/stephband/dom');
})(this);

(function(window) {
	"use strict";


	// Import

	var Fn          = window.Fn;
	var Node        = window.Node;
	var SVGElement  = window.SVGElement;
	var CustomEvent = window.CustomEvent;
	var Stream      = window.Stream;

	var assign      = Object.assign;
	var define      = Object.defineProperties;
	var cache       = Fn.cache;
	var curry       = Fn.curry;
	var denormalise = Fn.denormalise;
	var id          = Fn.id;
	var noop        = Fn.noop;
	var overload    = Fn.overload;
	var pow         = Fn.pow;
	var requestTick = Fn.requestTick;
	var toType      = Fn.toType;


	// Var

	var A            = Array.prototype;
	var svgNamespace = 'http://www.w3.org/2000/svg';
	var rspaces      = /\s+/;
	var rpx          = /px$/;


	// Features

	var features = define({}, {
		inputEventsOnDisabled: {
			// FireFox won't dispatch any events on disabled inputs:
			// https://bugzilla.mozilla.org/show_bug.cgi?id=329509

			get: cache(function() {
				var input     = document.createElement('input');
				var testEvent = Event('featuretest');
				var result    = false;
			
				appendChild(document.body, input);
				input.disabled = true;
				input.addEventListener('featuretest', function(e) { result = true; });
				input.dispatchEvent(testEvent);
				removeNode(input);
			
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

		transitionEnd: {
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

	var testDiv = document.createElement('div');

	var types = {
		1:  'element',
		3:  'text',
		8:  'comment',
		9:  'document',
		10: 'doctype',
		11: 'fragment'
	};

	var svgs = [
		'circle',
		'ellipse',
		'g',
		'line',
		'rect',
		//'text',
		'use',
		'path',
		'polygon',
		'polyline',
		'svg'
	];

	var constructors = {
		text: function(text) {
			return document.createTextNode(text || '');
		},

		comment: function(text) {
			return document.createComment(text || '');
		},

		fragment: function(html) {
			var fragment = document.createDocumentFragment();

			if (html) {
				testDiv.innerHTML = html;
				append(fragment, testDiv.childNodes);
				testDiv.innerHTML = '';
			}

			return fragment;
		}
	};

	svgs.forEach(function(tag) {
		constructors[tag] = function(attributes) {
			var node = document.createElementNS(svgNamespace, tag);
			if (attributes) { setSVGAttributes(node, attributes); }
			return node;
		};
	});

	function assignAttributes(node, attributes) {
		var names = Object.keys(attributes);
		var n = names.length;
	
		while (n--) {
			node.setAttribute(names[n], attributes[names[n]]);
		}
	}

	function setSVGAttributes(node, attributes) {
		var names = Object.keys(attributes);
		var n = names.length;

		while (n--) {
			node.setAttributeNS(null, names[n], attributes[names[n]]);
		}
	}

	function create(name) {
		// create(name)
		// create(name, text)
		// create(name, attributes)
		// create(name, text, attributes)

		if (constructors[name]) {
			return constructors[name](arguments[1]);
		}
	
		var node = document.createElement(name);
		var attributes;
	
		if (typeof arguments[1] === 'string') {
			node.innerHTML = arguments[1];
			attributes = arguments[2];
		}
		else {
			attributes = arguments[1];
		}
	
		var names, n;
	
		if (attributes) { assignAttributes(node, attributes); }
	
		return node;
	}

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

	function children(node) {
		// In IE and Safari, document fragments do not have .children
		return toArray(node.children || node.querySelectorAll('*'));
	}


	// DOM Traversal

	function find(id) {
		return document.getElementById(id) || undefined;
	}

	function query(selector, node) {
		node = node || document;
		return toArray(node.querySelectorAll(selector));
	}

	function matches(selector, node) {
		return node.matches ? node.matches(selector) :
			node.matchesSelector ? node.matchesSelector(selector) :
			node.webkitMatchesSelector ? node.webkitMatchesSelector(selector) :
			node.mozMatchesSelector ? node.mozMatchesSelector(selector) :
			node.msMatchesSelector ? node.msMatchesSelector(selector) :
			node.oMatchesSelector ? node.oMatchesSelector(selector) :
			// Dumb fall back to simple tag name matching.
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

	function append(target, node) {
		if (node instanceof Node || node instanceof SVGElement) {
			appendChild(target, node);
			return node;
		}

		if (!node.length) { return; }

		var array = node.reduce ? node : A.slice.call(node) ;
		array.reduce(appendChild, target);

		return node;
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

	var styleParsers = {
		"transform:translateX": function(node) {
			var matrix = style('transform', node);
			if (!matrix || matrix === "none") { return 0; }
			var values = valuesFromCssFn(matrix);
			return parseFloat(values[4]);
		},

		"transform:translateY": function(node) {
			var matrix = style('transform', node);
			if (!matrix || matrix === "none") { return 0; }
			var values = valuesFromCssFn(matrix);
			return parseFloat(values[5]);
		},

		"transform:scale": function(node) {
			var matrix = style('transform', node);
			if (!matrix || matrix === "none") { return 0; }
			var values = valuesFromCssFn(matrix);
			var a = parseFloat(values[0]);
			var b = parseFloat(values[1]);
			return Math.sqrt(a * a + b * b);
		},

		"transform:rotate": function(node) {
			var matrix = style('transform', node);
			if (!matrix || matrix === "none") { return 0; }
			var values = valuesFromCssFn(matrix);
			var a = parseFloat(values[0]);
			var b = parseFloat(values[1]);
			return Math.atan2(b, a);
		}
	};

	var prefix = (function(prefixes) {
		var node = document.createElement('div');
		var cache = {};

		function testPrefix(prop) {
			if (prop in node.style) { return prop; }

			var upper = prop.charAt(0).toUpperCase() + prop.slice(1);
			var l = prefixes.length;
			var prefixProp;

			while (l--) {
				prefixProp = prefixes[l] + upper;

				if (prefixProp in node.style) {
					return prefixProp;
				}
			}

			return false;
		}

		return function prefix(prop){
			return cache[prop] || (cache[prop] = testPrefix(prop));
		};
	})(['Khtml','O','Moz','Webkit','ms']);

	function valuesFromCssFn(string) {
		return string.split('(')[1].split(')')[0].split(/\s*,\s*/);
	}

	function style(name, node) {
		return window.getComputedStyle ?
			window
			.getComputedStyle(node, null)
			.getPropertyValue(name) :
			0 ;
	}

	function viewportLeft(elem) {
		var body = document.body;
		var html = document.documentElement;
		var box  = elem.getBoundingClientRect();
		var scrollLeft = window.pageXOffset || html.scrollLeft || body.scrollLeft;
		var clientLeft = html.clientLeft || body.clientLeft || 0;
		return (box.left + scrollLeft - clientLeft);
	}

	function viewportTop(elem) {
		var body = document.body;
		var html = document.documentElement;
		var box  = elem.getBoundingClientRect();
		var scrollTop = window.pageYOffset || html.scrollTop || body.scrollTop;
		var clientTop = html.clientTop || body.clientTop || 0;
		return box.top +  scrollTop - clientTop;
	}

	function getPositionParent(node) {
		var offsetParent = node.offsetParent;

		while (offsetParent && style("position", offsetParent) === "static") {
			offsetParent = offsetParent.offsetParent;
		}

		return offsetParent || document.documentElement;
	}

	function offset(node) {
		// Pinched from jQuery.offset...
	    // Return zeros for disconnected and hidden (display: none) elements
	    // Support: IE <=11 only
	    // Running getBoundingClientRect on a
	    // disconnected node in IE throws an error
	    if (!node.getClientRects().length) { return [0, 0]; }

	    var rect     = node.getBoundingClientRect();
	    var document = node.ownerDocument;
	    var window   = document.defaultView;
	    var docElem  = document.documentElement;

	    return [
			 rect.left + window.pageXOffset - docElem.clientLeft,
			 rect.top  + window.pageYOffset - docElem.clientTop
	    ];
	}

	function position(node) {
		var rect;

	    // Fixed elements are offset from window (parentOffset = {top:0, left: 0},
	    // because it is its only offset parent
	    if (style('position', node) === 'fixed') {
	        rect = node.getBoundingClientRect();

	        return [
		        rect.left - (parseFloat(style("marginLeft", node)) || 0),
		        rect.top  - (parseFloat(style("marginTop", node)) || 0)
	        ];
	    }

		// Get *real* offsetParent
		var parent = getPositionParent(node);

		// Get correct offsets
		var nodeOffset = offset(node);
		var parentOffset = tag(parent) !== "html" ? [0, 0] : offset(parent);

		// Add parent borders
		parentOffset[0] += parseFloat(style("borderLeftWidth", parent)) || 0;
		parentOffset[1] += parseFloat(style("borderTopWidth", parent)) || 0;
	
	    // Subtract parent offsets and element margins
		nodeOffset[0] -= (parentOffset[0] + (parseFloat(style("marginLeft", node)) || 0)),
		nodeOffset[1] -= (parentOffset[1] + (parseFloat(style("marginTop", node)) || 0))

		return nodeOffset;
	}


	// DOM Events

	var eventOptions = { bubbles: true };

	var eventsSymbol = Symbol('events');

	var keyCodes = {
		8:  'backspace',
		9:  'tab',
		13: 'enter',
		16: 'shift',
		17: 'ctrl',
		18: 'alt',
		27: 'escape',
		32: 'space',
		37: 'left',
		38: 'up',
		39: 'right',
		40: 'down',
		46: 'delete',
		48: '0',
		49: '1',
		50: '2',
		51: '3',
		52: '4',
		53: '5',
		54: '6',
		55: '7',
		56: '8',
		57: '9',
		65: 'a',
		66: 'b',
		67: 'c',
		68: 'd',
		69: 'e',
		70: 'f',
		71: 'g',
		72: 'h',
		73: 'i',
		74: 'j',
		75: 'k',
		76: 'l',
		77: 'm',
		78: 'n',
		79: 'o',
		80: 'p',
		81: 'q',
		82: 'r',
		83: 's',
		84: 't',
		85: 'u',
		86: 'v',
		87: 'w',
		88: 'x',
		89: 'y',
		90: 'z',
		// Mac Chrome left CMD
		91: 'cmd',
		// Mac Chrome right CMD
		93: 'cmd',
		186: ';',
		187: '=',
		188: ',',
		189: '-',
		190: '.',
		191: '/',
		219: '[',
		220: '\\',
		221: ']',
		222: '\'',
		// Mac FF
		224: 'cmd'
	};
	
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

	function isPrimaryButton(e) {
		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		return (e.which === 1 && !e.ctrlKey && !e.altKey && !e.shiftKey);
	}

	function toKey(e) {
		return keyCodes[e.keyCode];
	}

	function on(node, types, fn, data) {
		types = types.split(rspaces);

		var events = node[eventsSymbol] || (node[eventsSymbol] = {});
		var handler = bindTail(fn, data);
		var handlers, type;

		var n = -1;
		while (n++ < types.length) {
			type = types[n];
			handlers = events[type] || (events[type] = []);
			handlers.push([fn, handler]);
			node.addEventListener(type, handler);
		}

		return node;
	}

	function off(node, types, fn) {
		types = types.split(rspaces);

		var events = node[eventsSymbol];
		var type, handlers, i;

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

	var mimetypes = {
		xml:  'application/xml',
		html: 'text/html',
		svg:  'image/svg+xml'
	};

	function fragmentFromChildren(node) {
		if (node.domFragmentFromChildren) {
			return node.domFragmentFromChildren;
		}

		var fragment = create('fragment');
		node.domFragmentFromChildren = fragment;
		append(fragment, node.childNodes);
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

	function parse(type, string) {
		var mimetype = mimetypes[type];
		var xml;

		// From jQuery source...
		try {
			xml = (new window.DOMParser()).parseFromString(string, mimetype);
		} catch (e) {
			xml = undefined;
		}

		if (!xml || xml.getElementsByTagName("parsererror").length) {
			throw new Error("dom: Invalid XML: " + string);
		}

		return xml;
	}

	var escape = (function() {
		var pre = document.createElement('pre');
		var text = document.createTextNode('');

		pre.appendChild(text);

		return function escape(value) {
			text.textContent = value;
			return pre.innerHTML;
		};
	})();


	// Units

	var rem = /(\d*\.?\d+)r?em/;
	//var rpercent = /(\d*\.?\d+)%/;

	var fontSize;

	var toPx = overload(toType, {
		'number': id,

		'string': function(string) {
			var data, n;

			data = rem.exec(string);
			if (data) {
				n = parseFloat(data[1]);
				return getFontSize() * n;
			}

			//data = rpercent.exec(string);
			//if (data) {
			//	n = parseFloat(data[1]) / 100;
			//	return width * n;
			//}

			throw new Error('dom: ' + string + '\' cannot be parsed as rem, em or %.');
		}
	});

	var toRem = overload(toType, {
		'number': function(n) {
			return n / getFontSize();
		}
	});

	function getFontSize() {
		return fontSize ||
			(fontSize = parseFloat(style("font-size", document.documentElement), 10));
	}


	// Animation

	function animate(fn, duration, value, name, object) {
		var t = performance.now();
		var scale = denormalise(object[name], value);

		function frame(time) {
			// Progress from 0-1
			var p = (time - t) / (duration * 1000);

			if (p < 1) {
				object[name] = scale(fn(p));
				requestAnimationFrame(frame);
			}
			else {
				object[name] = value;
			}
		}

		requestAnimationFrame(frame);
	}

	function requestFrameN(n, fn) {
		(function frame() {
			return requestAnimationFrame(--n ? frame : fn);
		}());
	}


	// Scrolling

	function scrollTo(px, node) {
		px = toPx(px);
		animate(pow(2), 0.6, px, 'scrollTop', node || dom.viewport);
	}

	function scrollRatio(node) {
		return node.scrollTop / (node.scrollHeight - node.clientHeight);
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

	function dom(selector) {
		return query(selector, document);
	}

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

		ready:    ready.then.bind(ready),

		// DOM traversal

		find:     find,
		query:    curry(query,   true),
		closest:  curry(closest, true),
		matches:  curry(matches, true),
		children: children,
		next:     next,
		previous: previous,

		// DOM mutation

		assign:   curry(assignAttributes,  true),
		create:   create,
		clone:    clone,
		identify: identify,
		append:   curry(append,  true),
		before:   curry(before,  true),
		after:    curry(after,   true),
		replace:  curry(replace, true),
		empty:    empty,
		remove:   remove,

		// DOM inspection

		isElementNode:  isElementNode,
		isTextNode:     isTextNode,
		isCommentNode:  isCommentNode,
		isFragmentNode: isFragmentNode,
		isInternalLink: isInternalLink,

		type:      type,
		tag:       tag,
		attribute: curry(attribute, true),
		offset:    offset,
		position:  position,
		classes:   classes,
		prefix:    prefix,

		style: curry(function(name, node) {
			// If name corresponds to a custom property name in styleParsers...
			if (styleParsers[name]) { return styleParsers[name](node); }

			var value = style(name, node);

			// Pixel values are converted to number type
			return typeof value === 'string' && rpx.test(value) ?
				parseFloat(value) :
				value ;
		}, true),

		toPx:           toPx,
		toRem:          toRem,
		viewportLeft:   viewportLeft,
		viewportTop:    viewportTop,

		// DOM fragments and templates

		fragmentFromTemplate: fragmentFromTemplate,
		fragmentFromChildren: fragmentFromChildren,
		fragmentFromHTML:     fragmentFromHTML,
		fragmentFromId:       fragmentFromId,
		escape:               escape,
		parse:                curry(parse),

		// DOM events

		Event:           Event,

		events: {
			on:      on,
			off:     off,
			trigger: trigger
		},

		delegate:        delegate,
		isPrimaryButton: isPrimaryButton,
		preventDefault:  preventDefault,
		toKey:           toKey,
		trapFocus:       trapFocus,
		trap:            Fn.deprecate(trapFocus, 'dom.trap() is now dom.trapFocus()'),

		on: curry(Stream.Events, true),

		trigger: curry(function(type, node) {
			trigger(node, type);
			return node;
		}, true),

		// DOM animation

		// animate(fn, duration, value, name, object)
		//
		// fn       - function that maps x (0-1) to y (0-1)
		// duration - in seconds
		// value    - target value
		// name     - name of property to animate
		// object   - object to animate

		animate: curry(animate, true),

		// request(n, fn)
		//
		// calls fn on the nth requestAnimationFrame

		requestFrameN: curry(requestFrameN, true),

		// Scrolling

		// scrollTo(n)
		//
		// Animate scrollTop to n (in px)

		scrollTo:      scrollTo,
		scrollRatio:   scrollRatio,
		disableScroll: disableScroll,
		enableScroll:  enableScroll,

		// Features

		features: features
	});

	define(dom, {
		// Element shortcuts
		root: { value: document.documentElement, enumerable: true },
		head: { value: document.head, enumerable: true },
		body: { get: function() { return document.body; }, enumerable: true	},
		viewport: { get: function() { return document.scrollingElement; }, enumerable: true }
	});


	// Export

	window.dom = dom;
})(this);
