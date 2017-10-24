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
	var compose     = Fn.compose;
	var curry       = Fn.curry;
	var denormalise = Fn.denormalise;
	var deprecate   = Fn.deprecate;
	var id          = Fn.id;
	var noop        = Fn.noop;
	var overload    = Fn.overload;
	var pipe        = Fn.pipe;
	var pow         = Fn.pow;
	var set         = Fn.set;
	var requestTick = Fn.requestTick;
	var toType      = Fn.toType;


	// Var

	var A            = Array.prototype;
	var svgNamespace = 'http://www.w3.org/2000/svg';
	var rspaces      = /\s+/;
	var rpx          = /px$/;


	// Features

	var features = define({}, {
		inputEventsWhileDisabled: {
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
			if (names[n] in node) {
				node[names[n]] = attributes[names[n]];
			}
			else {
				node.setAttribute(names[n], attributes[names[n]]);
			}
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
		// create(type)
		// create(type, text)
		// create(tag, attributes)
		// create(tag, text, attributes)

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

		if (attributes) {
			assignAttributes(node, attributes);
		}

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

	function children(node) {
		// In IE and Safari, document fragments do not have .children
		return toArray(node.children || node.querySelectorAll('*'));
	}


	// DOM Traversal

	function query(selector, node) {
		node = node || document;
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

/*
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
*/

	function windowBox() {
		return {
			left:   0,
			top:    0,
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

	function position(node) {
		var rect = box(node);
		return [rect.left, rect.top];
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

	var keyCodes = {
		8:  'backspace',
		9:  'tab',
		13: 'enter',
		16: 'shift',
		17: 'ctrl',
		18: 'alt',
		27: 'escape',
		32: 'space',
		33: 'pageup',
		34: 'pagedown',
		35: 'pageright',
		36: 'pageleft',
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

		var events  = node[eventsSymbol] || (node[eventsSymbol] = {});
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

	function end(e, fn) {
		off(e.currentTarget, features.transitionend, end);
		fn(e.timeStamp);
	}

	function requestEvent(type, fn, node) {
		if (type === 'transitionend') {
			if (!features.transition) {
				fn(performance.now());
				return;
			}

			type = features.transitionend;
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

	function event(types, node) {
		types = types.split(rspaces);

		return new Stream(function setup(notify, stop) {
			var buffer = [];

			function update(value) {
				buffer.push(value);
				notify('push');
			}

			types.forEach(function(type) {
				node.addEventListener(type, update);
			});

			return {
				shift: function() {
					return buffer.shift();
				},

				stop: function stop() {
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
		var pre  = document.createElement('pre');
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

	function animateScroll(value) {
		return animate(0.6, pow(2), 'scrollTop', dom.view, toPx(value));
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

		get: function get(id) {
			return document.getElementById(id) || undefined;
		},

		find:     Fn.deprecate(function get(id) {
			return document.getElementById(id) || undefined;
		}, 'dom.find(id) is now dom.get(id)'),

		query:    curry(query,    true),
		closest:  curry(closest,  true),
		contains: curry(contains, true),
		matches:  curry(matches,  true),
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

		type:        type,
		tag:         tag,
		attribute:   curry(attribute, true),
		classes:     classes,
		addClass:    curry(addClass,    true),
		removeClass: curry(removeClass, true),
		flashClass:  curry(flashClass,  true),

		box:         box,
		bounds:      bounds,
		rectangle:   deprecate(box, 'dom.rectangle(node) now dom.box(node)'),

		offset:      curry(offset, true),
		position:    position,

		prefix:      prefix,
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
		delegate:        delegate,
		isPrimaryButton: isPrimaryButton,
		preventDefault:  preventDefault,
		toKey:           toKey,
		trapFocus:       trapFocus,
		trap:            Fn.deprecate(trapFocus, 'dom.trap() is now dom.trapFocus()'),

		events: {
			on:      on,
			off:     off,
			trigger: trigger
		},

		on:     Fn.deprecate(curry(event, true), 'dom.on() is now dom.event()'),

		trigger: curry(function(type, node) {
			trigger(node, type);
			return node;
		}, true),

		event: curry(event, true),

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

		// scrollRatio(node)
		//
		// Returns scrollTop as ratio of scrollHeight

		scrollRatio: scrollRatio,

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
		view: { get: function() { return document.scrollingElement; }, enumerable: true },
		viewport: { get: function() {
			console.warn('Deprecated: dom.viewport is now dom.view');
			return document.scrollingElement;
		}, enumerable: true }
	});


	// Export

	window.dom = dom;
})(this);
(function(window) {
	"use strict";

	var debug     = false;

	var Fn        = window.Fn;
	var dom       = window.dom;
	var classes   = dom.classes;
	var tag       = dom.tag;
	var on        = dom.events.on;
	var off       = dom.events.off;
	var trigger   = dom.events.trigger;
	var curry     = Fn.curry;
	var isDefined = Fn.isDefined;
	var overload  = Fn.overload;

	var activeClass = "active";
	var onClass   = "on";
	var location  = window.location;
	var id        = location.hash;
	var settings  = { cache: true };

	var store     = new WeakMap();

	var apply = curry(function apply(node, fn) {
		return fn(node);
	});


	// We need a place to register node matchers for activate events
	Object.defineProperties(dom, {
		activeMatchers: { value: [] }
	});

	function findButtons(id) {
		return dom
		.query('[href$="#' + id + '"]', dom.body)
		.filter(overload(tag, {
			a:       dom.isInternalLink,
			default: function() { return true; }
		}))
		.concat(dom.query('[data-href="#' + id + '"]', document));
	}

	function getData(node) {
		var data = store.get(node);
		if (!data) {
			data = {};
			store.set(node, data);
		}
		return data;
	}

	function cacheData(target) {
		var data = getData(target);
		var id   = target.id;

		if (!data.node) { data.node = target; }
		if (!data.buttons) { data.buttons = settings.cache && id && findButtons(id); }

		return data;
	}

	function getButtons(data) {
		return (settings.cache && data.buttons) || (data.node.id && findButtons(data.node.id));
	}

	// Listen to activate events

	function defaultActivate() {
		var data = this.data || cacheData(this.target);
		var buttons;

		// Don't do anything if elem is already active
		if (data.active) { return; }
		data.active = true;
		this.preventDefault();

		if (debug) { console.log('[activate] default | target:', this.target.id, 'data:', data); }

		classes(data.node).add(activeClass);
		buttons = getButtons(data);

		if (buttons) {
			buttons.forEach(function(node) {
				dom.classes(node).add(onClass);
			});
		}
	}

	function defaultDeactivate() {
		var data = this.data || cacheData(this.target);
		var buttons;

		// Don't do anything if elem is already inactive
		if (!data.active) { return; }
		data.active = false;
		this.preventDefault();

		if (debug) { console.log('[deactivate] default | target:', this.target.id, 'data:', data); }

		classes(data.node).remove(activeClass);
		buttons = getButtons(data);

		if (buttons) {
			buttons.forEach(function(node) {
				dom.classes(node).remove(onClass);
			});
		}
	}

	on(document, 'dom-activate', function(e) {
		if (e.defaultPrevented) { return; }

		var data = cacheData(e.target);

		// Don't do anything if elem is already active
		if (data.active) {
			e.preventDefault();
			return;
		}

		e.data    = data;
		e.default = defaultActivate;
	});

	on(document, 'dom-deactivate', function(e) {
		if (e.defaultPrevented) { return; }

		var data = cacheData(e.target);

		// Don't do anything if elem is already inactive
		if (!data.active) {
			e.preventDefault();
			return;
		}

		e.data    = data;
		e.default = defaultDeactivate;
	});


	// Listen to clicks

	var triggerActivate = dom.trigger('dom-activate');

	var nodeCache = {};

	var dialogs = {};

	var targets = {
		dialog: function(e) {
			var href = e.delegateTarget.getAttribute('data-href') || e.delegateTarget.hash || e.delegateTarget.href;

			//Todo: more reliable way of getting id from a hash ref
			var id = href.substring(1);
			var fragment;

//			if (!id) { return loadResource(e, href); }

//			if (parts = /([\w-]+)\/([\w-]+)/.exec(id)) {
//				id = parts[1];
//			}

			var node = nodeCache[id] || (nodeCache[id] = document.getElementById(id));

//			if (!node) { return loadResource(e, href); }

			e.preventDefault();

			// If the node is html hidden inside a text/html script tag,
			// extract the html.
			if (node.getAttribute && node.getAttribute('type') === 'text/html') {
				// Todo: trim whitespace from html?
				fragment = dom.create('fragment', node.innerHTML);
			}

			// If it's a template...
			if (node.tagName && node.tagName.toLowerCase() === 'template') {
				// If it is not inert (like in IE), remove it from the DOM to
				// stop ids in it clashing with ids in the rendered result.
				if (!node.content) { dom.remove(node); }
				fragment = dom.fragmentFromContent(node);
			}

			var dialog = dialogs[id] || (dialogs[id] = createDialog(fragment));
			trigger(dialog, 'dom-activate');
		}
	};

//	var rImage   = /\.(?:png|jpeg|jpg|gif|PNG|JPEG|JPG|GIF)$/;
//	var rYouTube = /youtube\.com/;

	function createDialog(content) {
		var layer = dom.create('div', { class: 'dialog-layer layer' });
		var dialog = dom.create('div', { class: 'dialog popable' });
		var button = dom.create('button', { class: 'close-thumb thumb' });

		dom.append(dialog, content);
		dom.append(layer, dialog);
		dom.append(layer, button);
		dom.append(document.body, layer);

		return dialog;
	}

//	function loadResource(e, href) {
//		var link = e.currentTarget;
//		var path = link.pathname;
//		var node, elem, dialog;
//
//		if (rImage.test(link.pathname)) {
//			e.preventDefault();
//			img = new Image();
//			dialog = createDialog();
//			var classes = dom.classes(dialog);
//			classes.add('loading');
//			dom.append(dialog, img);
//			on(img, 'load', function() {
//				classes.remove('loading');
//			});
//			img.src = href;
//			return;
//		}
//
//		if (rYouTube.test(link.hostname)) {
//			e.preventDefault();
//
//			// We don't need a loading indicator because youtube comes with
//			// it's own.
//			elem = dom.create('iframe', {
//				src:             href,
//				class:           "youtube_iframe",
//				width:           "560",
//				height:          "315",
//				frameborder:     "0",
//				allowfullscreen: true
//			});
//
//			node = elem[0];
//			elem.dialog('lightbox');
//			return;
//		}
//	}

	function preventClick(e) {
		// Prevent the click that follows the mousedown. The preventDefault
		// handler unbinds itself as soon as the click is heard.
		if (e.type === 'mousedown') {
			on(e.currentTarget, 'click', function prevent(e) {
				off(e.currentTarget, 'click', prevent);
				e.preventDefault();
			});
		}
	}

	function isIgnorable(e) {
		// Default is prevented indicates that this link has already
		// been handled. Save ourselves the overhead of further handling.
		if (e.defaultPrevented) { return true; }

		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		if (!dom.isPrimaryButton(e)) { return true; }

		// Ignore key presses other than the enter key
		if ((e.type === 'keydown' || e.type === 'keyup') && e.keyCode !== 13) { return true; }
	}

	function activate(e, node) {
		e.preventDefault();

		if (e.type === 'mousedown') {
			preventClick(e);
		}

		//if (data.active === undefined ?
		//		data.bolt.elem.hasClass('active') :
		//		data.active ) {
		//	return;
		//}

		trigger(node, 'dom-activate', { relatedTarget: e.currentTarget });
	}

	function getHash(node) {
		return (isDefined(node.hash) ?
			node.hash :
			node.getAttribute('href')
		).substring(1);
	}

	function activateId(e, id) {
		// Does it point to a node?
		var node = document.getElementById(id);
		if (!node) { return; }

		// Is the node popable, switchable or toggleable?
		var classes = dom.classes(node);

		if (dom.activeMatchers.find(apply(node))) {
			activate(e, node);
		}
		// A bit of a fudge, but smooth scrolling is so project-dependent it is
		// hard to design a consistent way of doing it. The function
		// dom.activateOther() is an optional hook that allows otherwise
		// inactivateable things to get some action.
		else if (dom.activateOther) {
			dom.activateOther(node);
		}
	}

	function activateHref(e) {
		if (isIgnorable(e)) { return; }
		if (e.delegateTarget.hostname && !dom.isInternalLink(e.delegateTarget)) { return; }

		// Does it point to an id?
		var id = getHash(e.delegateTarget);
		if (!id) { return; }

		activateId(e, id);
	}

	function activateTarget(e) {
		var target = e.delegateTarget.target;

		if (isIgnorable(e)) { return; }

		// If the target is not listed, ignore
		if (!targets[target]) { return; }
		return targets[target](e);
	}

	// Clicks on buttons toggle activate on their hash
	on(document, 'click', dom.delegate('a[href]', activateHref));

	// Clicks on buttons toggle activate on their targets
	on(document, 'click', dom.delegate('a[target]', activateTarget));

	// Document setup
	dom.ready(function() {
		// Setup all things that should start out active
		dom('.' + activeClass).forEach(triggerActivate);

		// Activate the node that corresponds to the hashref in
		// location.hash, checking if it's an alphanumeric id selector
		// (not a hash bang)
		if (!id || !(/^#\S+$/.test(id))) { return; }

		// Catch errors, as id may nonetheless be an invalid selector
		try { dom(id).forEach(triggerActivate); }
		catch(e) {}
	});
})(this);
(function(window) {
	"use strict";

	var Fn     = window.Fn;
	var Stream = window.Stream;
	var dom    = window.dom;


	// Number of pixels a pressed pointer travels before movestart
	// event is fired.
	var threshold = 8;

	var ignoreTags = {
			textarea: true,
			input: true,
			select: true,
			button: true
		};

	var mouseevents = {
		move:   'mousemove',
		cancel: 'mouseup dragstart',
		end:    'mouseup'
	};

	var touchevents = {
		move:   'touchmove',
		cancel: 'touchend',
		end:    'touchend'
	};


	// Functions

	var requestTick     = Fn.requestTick;
	var on              = dom.events.on;
	var off             = dom.events.off;
	var trigger         = dom.events.trigger;
	var isPrimaryButton = dom.isPrimaryButton;
	var preventDefault  = dom.preventDefault;

	function isIgnoreTag(e) {
		var tag = e.target.tagName;
		return tag && !!ignoreTags[tag.toLowerCase()];
	}

	function identifiedTouch(touchList, id) {
		var i, l;

		if (touchList.identifiedTouch) {
			return touchList.identifiedTouch(id);
		}

		// touchList.identifiedTouch() does not exist in
		// webkit yet… we must do the search ourselves...

		i = -1;
		l = touchList.length;

		while (++i < l) {
			if (touchList[i].identifier === id) {
				return touchList[i];
			}
		}
	}

	function changedTouch(e, data) {
		var touch = identifiedTouch(e.changedTouches, data.identifier);

		// This isn't the touch you're looking for.
		if (!touch) { return; }

		// Chrome Android (at least) includes touches that have not
		// changed in e.changedTouches. That's a bit annoying. Check
		// that this touch has changed.
		if (touch.pageX === data.pageX && touch.pageY === data.pageY) { return; }

		return touch;
	}


	// Handlers that decide when the first movestart is triggered

	function mousedown(e){
		// Ignore non-primary buttons
		if (!isPrimaryButton(e)) { return; }

		// Ignore form and interactive elements
		if (isIgnoreTag(e)) { return; }

		on(document, mouseevents.move, mousemove, [e]);
		on(document, mouseevents.cancel, mouseend, [e]);
	}

	function mousemove(e, events){
		events.push(e);
		checkThreshold(e, events, e, removeMouse);
	}

	function mouseend(e, data) {
		removeMouse();
	}

	function removeMouse() {
		off(document, mouseevents.move, mousemove);
		off(document, mouseevents.cancel, mouseend);
	}

	function touchstart(e) {
		// Don't get in the way of interaction with form elements
		if (ignoreTags[e.target.tagName.toLowerCase()]) { return; }

		var touch = e.changedTouches[0];

		// iOS live updates the touch objects whereas Android gives us copies.
		// That means we can't trust the touchstart object to stay the same,
		// so we must copy the data. This object acts as a template for
		// movestart, move and moveend event objects.
		var event = {
			target:     touch.target,
			pageX:      touch.pageX,
			pageY:      touch.pageY,
			identifier: touch.identifier,

			// The only way to make handlers individually unbindable is by
			// making them unique. This is a crap place to put them, but it
			// will work.
			touchmove:  function() { touchmove.apply(this, arguments); },
			touchend:   function() { touchend.apply(this, arguments); }
		};

		on(document, touchevents.move, event.touchmove, [event]);
		on(document, touchevents.cancel, event.touchend, [event]);
	}

	function touchmove(e, events) {
		var touch = changedTouch(e, events[0]);
		if (!touch) { return; }
		checkThreshold(e, events, touch, removeTouch);
	}

	function touchend(e, events) {
		var touch = identifiedTouch(e.changedTouches, events[0].identifier);
		if (!touch) { return; }
		removeTouch(events);
	}

	function removeTouch(events) {
		off(document, touchevents.move, events[0].touchmove);
		off(document, touchevents.cancel, events[0].touchend);
	}

	function checkThreshold(e, events, touch, fn) {
		var distX = touch.pageX - events[0].pageX;
		var distY = touch.pageY - events[0].pageY;

		// Do nothing if the threshold has not been crossed.
		if ((distX * distX) + (distY * distY) < (threshold * threshold)) { return; }

		var e0   = events[0];
		var node = events[0].target;
		var stream;

		// Unbind handlers that tracked the touch or mouse up till now.
		fn(events);

		// Trigger the touch event
		trigger(events[0].target, 'dom-touch', {
			pageX:  e0.pageX,
			pageY:  e0.pageY,
			detail: function() {
				if (!stream) {
					stream = TouchStream(node, events);
				}

				//return stream.clone();
				return stream;
			}
		});
	}


	// Handlers that control what happens following a movestart

	function activeMousemove(e, data) {
		data.touch = e;
		data.timeStamp = e.timeStamp;
		data.stream.push(e);
	}

	function activeMouseend(e, data) {
		var target = data.target;

		removeActiveMouse();
		data.stream.stop();
	}

	function removeActiveMouse() {
		off(document, mouseevents.move, activeMousemove);
		off(document, mouseevents.end, activeMouseend);
	}

	function activeTouchmove(e, data) {
		var touch = changedTouch(e, data);

		if (!touch) { return; }

		// Stop the interface from gesturing
		e.preventDefault();

		data.touch = touch;
		data.timeStamp = e.timeStamp;
		data.stream.push(touch);
	}

	function activeTouchend(e, data) {
		var touch  = identifiedTouch(e.changedTouches, data.identifier);

		// This isn't the touch you're looking for.
		if (!touch) { return; }

		removeActiveTouch(data);
		data.stream.stop();
	}

	function removeActiveTouch(data) {
		off(document, touchevents.move, data.activeTouchmove);
		off(document, touchevents.end, data.activeTouchend);
	}

	function TouchStream(node, events) {
		var stream = Stream.from(events).map(function(e) {
			return {
				x:    e.pageX - events[0].pageX,
				y:    e.pageY - events[0].pageY,
				time: (e.timeStamp - events[0].timeStamp) / 1000
			};
		});

		var data = {
			stream:     stream,
			target:     node,
			touch:      undefined,
			identifier: events[0].identifier
		};

		if (data.identifier === undefined) {
			// We're dealing with a mouse event.
			// Stop clicks from propagating during a move
			on(node, 'click', preventDefault);
			on(document, mouseevents.move, activeMousemove, data);
			on(document, mouseevents.cancel, activeMouseend, data);
		}
		else {
			// In order to unbind correct handlers they have to be unique
			data.activeTouchmove = function(e, data) { activeTouchmove(e, data); };
			data.activeTouchend  = function(e, data) { activeTouchend(e, data); };

			// We're dealing with a touch.
			on(document, touchevents.move, data.activeTouchmove, data);
			on(document, touchevents.end, data.activeTouchend, data);
		}

		stream.then(function() {
			// Unbind the click suppressor, waiting until after mouseup
			// has been handled. I don't know why it has to be any longer than
			// a tick, but it does, in Chrome at least.
			setTimeout(function() {
				off(node, 'click', preventDefault);
			}, 200);
		});

		return stream;
	}

	on(document, 'mousedown', mousedown);
	on(document, 'touchstart', touchstart);

})(this);
(function(window) {
	"use strict";

	var Fn      = window.Fn;
	var dom     = window.dom;

	var on      = dom.events.on;
	var trigger = dom.events.trigger;
	var closest = dom.closest;

//	var settings = {
//		// Ratio of distance over target finger must travel to be
//		// considered a swipe.
//		threshold: 0.4,
//		// Faster fingers can travel shorter distances to be considered
//		// swipes. 'sensitivity' controls how much. Bigger is shorter.
//		sensitivity: 6
//	};

	function touchdone(node, data) {
		data = data.shift();

		//var x = data.x;
		//var y = data.y;
		//var w = node.offsetWidth;
		//var h = node.offsetHeight;
		var polar = Fn.toPolar([data.x, data.y]);

		// Todo: check if swipe has enough velocity and distance
		//x/w > settings.threshold || e.velocityX * x/w * settings.sensitivity > 1

		trigger(node, 'dom-swipe', {
			detail:   data,
			angle:    polar[1],
			velocity: polar[0] / data.time
		});
	}

	on(document, 'dom-touch', function(e) {
		if (e.defaultPrevented) { return; }

		var node = closest('.swipeable', e.target);
		if (!node) { return; }

		var touch = e.detail();
		var data  = touch.clone().latest();

		data.then(function() {
			touchdone(node, data);
		});
	});
})(this);
// dom.popable
//
// Extends the default behaviour of events for the .tip class.

(function(window) {

	var dom     = window.dom;
	var trigger = dom.events.trigger;
	var matches = dom.matches('.popable, [popable]');

	function activate(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var node    = e.target;
		if (!matches(node)) { return; }

		// Make user actions outside node deactivat the node

		requestAnimationFrame(function() {
			function click(e) {
				if (node.contains(e.target) || node === e.target) { return; }
				trigger(node, 'dom-deactivate');
			}

			function deactivate(e) {
				if (node !== e.target) { return; }
				if (e.defaultPrevented) { return; }
				document.removeEventListener('click', click);
				document.removeEventListener('dom-deactivate', deactivate);
			}

			document.addEventListener('click', click);
			document.addEventListener('dom-deactivate', deactivate);
		});

		e.default();
	}

	function deactivate(e) {
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }
		e.default();
	}

	document.addEventListener('dom-activate', activate);
	document.addEventListener('dom-deactivate', deactivate);
	dom.activeMatchers.push(matches);
})(this);
// dom.toggleable

(function(window) {
	"use strict";

	var dom     = window.dom;

	// Define

	var matches = dom.matches('.toggleable, [toggleable]');

	// Functions

	var on      = dom.events.on;
	var off     = dom.events.off;
	var trigger = dom.events.trigger;

	function click(e, activeTarget) {
		// A prevented default means this link has already been handled.
		if (e.defaultPrevented) { return; }
		if (!dom.isPrimaryButton(e)) { return; }

		var node = e.currentTarget;
		if (!node) { return; }

		trigger(activeTarget, 'dom-deactivate', {
			relatedTarget: e.target
		});

		e.preventDefault();
	}

	function activate(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }

		var id = dom.identify(target);

		dom('a[href$="#' + id + '"]')
		.forEach(function(node) {
			on(node, 'click', click, e.target);
		});

		e.default();
	}

	function deactivate(e, data, fn) {
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }

		var id = e.target.id;

		dom('a[href$="#' + id + '"]')
		.forEach(function(node) {
			off(node, 'click', click);
		});

		e.default();
	}

	on(document, 'dom-activate', activate);
	on(document, 'dom-deactivate', deactivate);

	dom.activeMatchers.push(matches);
})(this);
// dom.switchable
//
// Extends the default behaviour of the activate and deactivate
// events with things to do when they are triggered on nodes.

(function(window) {
	"use strict";

	// Import

	var Fn      = window.Fn;
	var dom     = window.dom;

	// Define

	var matches = dom.matches('.switchable, [switchable]');
	var on      = dom.events.on;
	var triggerDeactivate = dom.trigger('dom-deactivate');

	function activate(e) {
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }

		var nodes = dom.query('.switchable', target.parentNode);
		var i     = nodes.indexOf(target);

		nodes.splice(i, 1);
		var active = nodes.filter(dom.matches('.active'));

		e.default();

		// Deactivate the previous active pane AFTER this pane has been
		// activated. It's important for panes who's style depends on the
		// current active pane, eg: .slide.active ~ .slide
		Fn.from(active).each(triggerDeactivate);
	}

	function deactivate(e) {
		if (!e.default) { return; }

		var target = e.target;
		if (!matches(target)) { return; }

		e.default();
	}

	on(document, 'dom-activate', activate);
	on(document, 'dom-deactivate', deactivate);
	dom.activeMatchers.push(matches);
})(this);
(function(window) {
	"use strict";

	var Fn       = window.Fn;
	var last     = Fn.last;
	var dom      = window.dom;
	var children = dom.children;
	var on       = dom.events.on;
	var trigger  = dom.events.trigger;
	var closest  = dom.closest;
	var tau      = Math.PI * 2;

	var elasticDistance = 800;

	var rspaces = /\s+/;

	function elasticEase(n) {
		return Math.atan(n) / Math.PI ;
	}

	function xMinFromChildren(node) {
		var child = last(children(node).filter(dom.matches('.switchable')));

		// Get the right-most x of the last switchable child's right-most edge
		var w1 = child.offsetLeft + child.clientWidth;
		var w2 = node.parentNode.clientWidth;
		return w2 - w1;
	}

	on(document, 'dom-touch', function(e) {
		if (e.defaultPrevented) { return; }

		var node = closest('.swipeable', e.target);
		if (!node) { return; }

		var classes = dom.classes(node);
		var transform = dom.style('transform', node);

		transform = !transform || transform === 'none' ? '' : transform ;

		var x = dom.style('transform:translateX', node);

		// Elastic flags and limits
		var eMin = false;
		var eMax = false;
		var xMin = dom.attribute('data-slide-min', node);
		var xMax = dom.attribute('data-slide-max', node);

		if (!xMin && !xMax) {
			eMin = true;
			eMax = true;
			xMin = xMinFromChildren(node);
			xMax = 0;
		}
		else {
			eMin = /elastic/.test(xMin);
			eMax = /elastic/.test(xMax);
			xMin = parseFloat(xMin) || 0;
			xMax = parseFloat(xMax) || 0;
		}

		classes.add('notransition');

		var ax = x;

		// e.detail() is a stream of touch coordinates
		e.detail()
		.map(function(data) {
			ax = x + data.x;
			var tx = ax > 0 ?
					eMax ? elasticEase(ax / elasticDistance) * elasticDistance - x :
					xMax :
				ax < xMin ?
					eMin ? elasticEase((ax - xMin) / elasticDistance) * elasticDistance + xMin - x :
					xMin :
				data.x ;

			return transform + ' translate(' + tx + 'px, 0px)';
		})
		.each(function(transform) {
			node.style.transform = transform;
		})
		.then(function() {
			classes.remove('notransition');

			// Todo: Watch out, this may interfere with slides
			var xSnaps = dom.attribute('data-slide-snap', node);

			if (!xSnaps) { return; }
			xSnaps = xSnaps.split(rspaces).map(parseFloat);

			// Get closest x from list of snaps
			var tx = xSnaps.reduce(function(prev, curr) {
				return Math.abs(curr - ax) < Math.abs(prev - ax) ?
					curr : prev ;
			});

			//requestAnimationFrame(function() {
				node.style.transform = transform + ' translate(' + tx + 'px, 0px)';
			//});
		});
	});

	function transform(node, active) {
		var l1 = dom.box(node).left;
		var l2 = dom.box(active).left;

		// Round the translation - without rounding images and text become
		// slightly fuzzy as they are antialiased.
		var l  = Math.round(l1 - l2 - dom.style('margin-left', active));
		node.style.transform = 'translate(' + l + 'px, 0px)';
	}

	on(document, 'dom-swipe', function(e) {
		if (e.defaultPrevented) { return; }

		var node = closest('.swipeable', e.target);
		if (!node) { return; }

		var angle = Fn.wrap(0, tau, e.angle || 0);

			// If angle is rightwards
		var prop = (angle > tau * 1/8 && angle < tau * 3/8) ?
				'previousElementSibling' :
			// If angle is leftwards
			(angle > tau * 5/8 && angle < tau * 7/8) ?
				'nextElementSibling' :
				false ;

		if (!prop) { return; }

		var active = children(node)
		.filter(dom.matches('.active'))
		.shift();

		if (active[prop]) {
			trigger(active[prop], 'dom-activate');
		}
		else {
			transform(node, active);
		}
	});

	on(document, 'dom-activate', function(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var node   = e.target;
		var parent = node.parentNode;

		if (!dom.matches('.swipeable', parent)) { return; }

		var classes = dom.classes(parent);
		classes.remove('notransition');
		document.documentElement.clientWidth;

		var l1 = dom.box(node).left;
		var l2 = dom.box(parent).left;
		var l  = l1 - l2 - dom.style('margin-left', node);

		parent.style.transform = 'translate(' + (-l) + 'px, 0px)';
		e.preventDefault();
	});
})(this);
(function(window) {
	"use strict";

	var Fn      = window.Fn;
	var dom     = window.dom;

	var noop          = Fn.noop;
	var on            = dom.events.on;
	var off           = dom.events.off;
	var trigger       = dom.events.trigger;
	var disableScroll = dom.disableScroll;
	var enableScroll  = dom.enableScroll;
	var trapFocus     = dom.trapFocus;
	var untrapFocus   = noop;

	var matches = dom.matches('.focusable, [focusable]');
	var delay   = 600;

	on(document, 'dom-activate', function(e) {
		if (e.defaultPrevented) { return; }
		if (!matches(e.target)) { return; }

		// Trap focus

		var node = e.target;
		var trap = function trap(e) {
			clearTimeout(timer);
			off(e.target, 'transitionend', trap);
			untrapFocus = trapFocus(e.target);
		};

		var timer = setTimeout(trap, delay, e);
		on(e.target, 'transitionend', trap);

		// Prevent scrolling of main document

		disableScroll(dom.root);

		// Make the escape key deactivate the focusable

		requestAnimationFrame(function() {
			function keydown(e) {
				if (e.keyCode !== 27) { return; }
				trigger(node, 'dom-deactivate');
				e.preventDefault();
			}

			function deactivate(e) {
				if (node !== e.target) { return; }
				if (e.defaultPrevented) { return; }
				document.removeEventListener('keydown', keydown);
				document.removeEventListener('dom-deactivate', deactivate);
			}

			document.addEventListener('keydown', keydown);
			document.addEventListener('dom-deactivate', deactivate);
		});
	});

	on(document, 'dom-deactivate', function(e) {
		if (e.defaultPrevented) { return; }
		if (!matches(e.target)) { return; }

		var untrap = function untrap(e) {
			clearTimeout(timer);
			off(e.target, 'transitionend', untrap);
			untrapFocus();
			untrapFocus = noop;
		};

		var timer = setTimeout(untrap, delay, e);
		on(e.target, 'transitionend', untrap);
		enableScroll(dom.root);
	});

	dom.activeMatchers.push(matches);
})(this);
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

	on(document, 'dom-deactivate', deactivate);
})(this);
// dom.locateable
//
// Extends the default behaviour of events for the .tip class.

(function(window) {

    var Fn       = window.Fn;
    var dom      = window.dom;

    var by       = Fn.by;
    var noop     = Fn.noop;
    var powOut   = Fn.exponentialOut;
    var animate  = dom.animate;
    var box      = dom.box;
    var offset   = dom.offset;
    var on       = dom.events.on;
    var matches  = dom.matches(".locateable, [locateable]");

    // Time after scroll event to consider the document is scrolling
    var idleTime = 90;

    // Duration and easing of scroll animation
    var scrollDuration  = 0.8;
    var scrollTransform = powOut(6);

    // Time of latest scroll event
    var scrollTime = 0;

    var activeNode;
    var cancel = noop;

    function activate(e) {
        if (!e.default) { return; }

        var target = e.target;
        if (!matches(target)) { return; }

        // If node is already active, ignore
        if (target === activeNode) { return; }

        if (activeNode) {
            if (target === activeNode) {
                return;
            }

            cancel();
            //scrollTime = e.timeStamp;
            dom.trigger('dom-deactivate', activeNode);
        }

        var t = e.timeStamp;
        var coords, safeTop;

        // Heuristic for whether we are currently actively scrolling. Checks:
        // Is scroll currently being animated OR
        // was the last scroll event ages ago ?
        // TODO: test on iOS
        if (scrollTime > t || t > scrollTime + idleTime) {
            coords     = offset(dom.view, target);
            safeTop    = dom.safe.top;
            scrollTime = t + scrollDuration * 1000;
            cancel     = animate(scrollDuration, scrollTransform, 'scrollTop', dom.view, coords[1] - safeTop);
        }

        e.default();
        activeNode = target;
    }

	function deactivate(e) {
        if (!e.default) { return; }

        var target = e.target;

        if (!matches(target)) { return; }

        e.default();

        // If node is already active, ignore
        if (target === activeNode) {
            activeNode = undefined;
        }
	}

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

    function update() {
        var locateables = dom('.locateable');
        var boxes       = locateables.map(box).sort(by('top'));
        var winBox      = windowBox();

        var n = -1;
        while (boxes[++n]) {
            // Stop on locateable lower than the break
            if (boxes[n].top > winBox.height / 2) {
                break;
            }
        }
        --n;

        if (n < 0) { return; }
        if (n >= boxes.length) { return; }

        var node = locateables[n];

        if (activeNode) {
            if (node === activeNode) {
                return;
            }

            dom.trigger('dom-deactivate', activeNode);
        }

        dom.trigger('dom-activate', node);
    }

    function scroll(e) {
        // If scrollTime is in the future we are currently animating scroll,
        // best do nothing
        if (scrollTime >= e.timeStamp) { return; }
        scrollTime = e.timeStamp;
        update();
    }

    on(document, 'dom-activate', activate);
    on(document, 'dom-deactivate', deactivate);
    on(window, 'scroll', scroll);
    update();
    dom.activeMatchers.push(matches);
})(this);
(function(window) {
	"use strict";

	var assign         = Object.assign;
	var Fn             = window.Fn;
	var Stream         = window.Stream;
	var dom            = window.dom;

	var get            = Fn.get;
	var invoke         = Fn.invoke;
	var nothing        = Fn.nothing;
	var once           = Fn.once;

	var after          = dom.after;
	var attribute      = dom.attribute;
	var classes        = dom.classes;
    var matches        = dom.matches;
	var remove         = dom.remove;

    var isValidateable = dom.matches('input.validateable, select.validateable, textarea.validateable, .validateable input, .validateable textarea, .validateable select');
	var validatedClass = 'validated';
	var errorSelector  = '.error-label';
	//var errorAttribute        = 'data-error';

	var types = {
		patternMismatch: 'pattern',
		rangeOverflow:   'max',
		rangeUnderflow:  'min',
		stepMismatch:    'step',
		tooLong:         'maxlength',
		typeMismatch:    'type',
		valueMissing:    'required'
	};

	function negate(fn) {
		return function() {
			return !fn.apply(this, arguments);
		};
	}

	function isValid(node) {
		return node.validity ? node.validity.valid : true ;
	}

	function isShowingMessage(node) {
		return node.nextElementSibling
			&& matches(errorSelector, node.nextElementSibling);
	}

	//function isErrorAttribute(error) {
	//	var node = error.node;
	//	return !!attribute(errorAttribute, node);
	//}

	//function flattenErrors(object) {
	//	var errors = [];
    //
	//	// Flatten errors into a list
	//	for (name in object) {
	//		errors.push.apply(errors,
	//			object[name].map(function(text) {
	//				return {
	//					name: name,
	//					text: text
	//				}
	//			})
	//		);
	//	}
    //
	//	return errors;
	//}

	function toError(input) {
		var node     = input;
		var validity = node.validity;
        var name;

		for (name in validity) {
			if (name !== 'valid' && validity[name]) {
				return {
					type: name,
					attr: types[name],
					name: input.name,
					text: dom.validation[types[name]] || node.validationMessage,
					node: input
				};
			}
		}
	}

	function renderError(error) {
		var input  = error.node;
		var node   = input;

		while (node.nextElementSibling && matches(errorSelector, node.nextElementSibling)) {
			node = node.nextElementSibling;
		}

        var label = dom.create('label')
        dom.assign(label, {
            textContent: error.text,
			for:         input.id,
            class:       'error-label'
		});

		after(node, label);

		if (error.type === 'customError') {
			node.setCustomValidity(error.text);

			dom
			.on('input', node)
			.take(1)
			.each(function() {
				node.setCustomValidity('');
			});
		}
	}

	function addValidatedClass(input) {
		classes(input).add(validatedClass);
	}

	function removeMessages(input) {
		var node = input;

		while (node.nextElementSibling && matches(errorSelector, node.nextElementSibling)) {
			node = node.nextElementSibling;
			remove(node);
		}
	}

	dom
	.event('input', document)
	.map(get('target'))
    .filter(isValidateable)
	.filter(isValid)
	.each(removeMessages);

	dom
	.event('focusout', document)
	.map(get('target'))
	.filter(isValidateable)
	.each(invoke('checkValidity', nothing));

	//dom
	//.event('focusout', document)
	//.map(get('target'))
	//.unique()
	//.each(addValidatedClass);

	// Add event in capture phase
	document.addEventListener(
		'invalid',

		// Push to stream
		Stream.of()
		.map(get('target'))
		.tap(once(addValidatedClass))
		.filter(negate(isShowingMessage))
		.map(toError)
        //.filter(isErrorAttribute)
		//.filter(isMessage)
		.each(renderError)
		.push,

		// Capture phase
		true
	);

    dom.validation = dom.validation || {};

})(this);
