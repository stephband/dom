(function(window) {
	"use strict";

	// Import

	var Fn             = window.Fn;
	var Node           = window.Node;
	var SVGElement     = window.SVGElement;
	var CustomEvent    = window.CustomEvent;
	var Stream         = Fn.Stream;


	// Var

	var A = Array.prototype;
	var rspaces = /\s+/;


	// Utility functions

	var assign = Object.assign;
	var slice  = Function.prototype.call.bind(Array.prototype.slice);


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

	function create(name) {
		// create('comment', 'Text');
		if (name === 'comment' || name === '!') {
			return document.createComment(arguments[1] || '');
		}

		// create('text', 'Text')
		if (name === 'text') {
			return document.createTextNode(arguments[1] || '');
		}

		// create('fragment')
		if (name === 'fragment') {
			return document.createDocumentFragment();
		}

		// create('div', 'HTML')
		var node = document.createElement(name);
		if (arguments[1]) { node.innerHTML = arguments[1]; }
		return node;
	}

	function clone(node) {
		return node.cloneNode(true);
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

	function isExternalLink(node) {
		var location = window.location;

		// IE does not give us a .hostname for links to xxx.xxx.xxx.xxx URLs.
		if (!node.hostname) { return false; }

		// IE gives us the port on link.host, even where it is not specified.
		// Use link.hostname.
		if (location.hostname !== node.hostname) { return true; }

		// IE gives us link.pathname without a leading slash, so add
		// one before comparing.
		if (location.pathname !== prefixSlash(node.pathname)) { return true; }
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
		return node.tagName.toLowerCase();
	}

	function classes(node) {
		return node.classList || new TokenList(node, getClass, setClass);
	}

	function getClass(node) {
		// node.className is an object in SVG. getAttribute
		// is more consistent, if a tad slower.
		return node.getAttribute('class');
	}

	function setClass(node, classes) {
		if (node instanceof SVGElement) {
			node.setAttribute('class', classes);
		}
		else {
			node.className = classes;
		}
	}

	function style(name, node) {
		return window.getComputedStyle ?
			window
			.getComputedStyle(node, null)
			.getPropertyValue(name) :
			0 ;
	}

	// DOM Traversal

	function find(selector, node) {
		node = node || document;
		return A.slice.apply(node.querySelectorAll(selector));
	}

	function findOne(selector, node) {
		node = node || document;
		return node.querySelector(selector);
	}

	function matches(selector, node) {
		return node.matches ? node.matches(selector) :
			node.matchesSelector ? node.matchesSelector(selector) :
			node.webkitMatchesSelector ? node.webkitMatchesSelector(selector) :
			node.mozMatchesSelector ? node.mozMatchesSelector(selector) :
			node.msMatchesSelector ? node.msMatchesSelector(selector) :
			node.oMatchesSelector ? node.oMatchesSelector(selector) :
			// Fall back to simple tag name matching.
			node.tagName.toLowerCase() === selector ;
	}

	function closest(selector, node) {
		var root = arguments[3];

		if (!node || node === document || node === root || node.nodeType === 11) { return; }

		// SVG <use> elements store their DOM reference in
		// .correspondingUseElement.
		node = node.correspondingUseElement || node ;

		return matches(selector, node) ?
			 node :
			 closest(selector, node.parentNode, root) ;
	}

	// DOM Mutation

	function appendChild(target, node) {
		target.appendChild(node);
	}

	function append(target, node) {
		if (node instanceof Node || node instanceof SVGElement) {
			return appendChild(target, node);
		}

		if (node.length) {
			Array.prototype.forEach.call(node, function(node) {
				appendChild(target, node);
			});
		}
	}

	function html(target, html) {
		target.innerHTML = html;
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


	// CSS

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


	// DOM Events

	var eventOptions = { bubbles: true };

	var eventsSymbol = Symbol('events');

	function preventDefault(e) {
		e.preventDefault();
	}

	function isPrimaryButton(e) {
		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		return (e.which === 1 && !e.ctrlKey && !e.altKey);
	}

	function Event(type, properties) {
		var options = Object.assign({}, eventOptions, properties);
		var event   = new CustomEvent(type, options);

		if (properties) {
			delete properties.detail;
			assign(event, properties);
		}

		return event;
	}

	var events = Fn.curryUntil(function events(types, selector, node) {
		// Selector is an optional parameter
		selector = arguments.length > 2 && selector ;
		node     = arguments[arguments.length - 1];

		var stream = Stream.of();
		var _stop = stream.stop;

		function push(e) {
			stream.push(e);
		}

		var fn = selector ? dom.delegate(selector, push) : push ;

		stream.on('done', function() {
			_stop.apply(this);
			off(node, types, fn);
		});

		on(node, types, fn);
		return stream;
	}, function test() {
		// Test that the last argument is a node
		var node = arguments[arguments.length - 1];
		return arguments.length > 3 ||
			!!node.addEvent ||
			!!node.addEventListener;
	});

	function on(node, types, fn, data) {
		types = types.split(rspaces);

		var events = node[eventsSymbol] || (node[eventsSymbol] = {});
		var handlers, type;

		function handler(e) { fn(e, data); }

		for (type of types) {
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

		for (type of types) {
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
			return fn(e);
		};
	}

	assign(events, {
		on:      on,
		off:     off,
		trigger: trigger
	});


	// DOM Fragments and Templates

	var templates = {};

	function fragmentFromChildren(node) {
		var children = slice(node.childNodes);
		var fragment = create('fragment');
		return append(fragment, children);
	}

	function fragmentFromContent(node) {
		// A template tag has a content property that gives us a document
		// fragment. If that doesn't exist we must make a document fragment.
		return node.content || fragmentFromChildren(node);
	}

	function getTemplate(id) {
		var node = document.getElementById(id);
		if (!node) { throw new Error('DOM: element id="' + id + '" is not in the DOM.') }

		var tag = tag(node);
		if (tag !== 'template' && tag !== 'script') { return; }

		if (node.content) {
			return fragmentFromContent(node);
		}
			
		// In browsers where templates are not inert, ids used inside them
		// conflict with ids in any rendered result. To go some way to
		// tackling this, remove the node from the DOM.
		remove(node);
		return fragmentFromContent(node);
	}

	function cloneTemplate(id) {
		var template = templates[id] || (templates[id] = getTemplate(id));
		return template && template.cloneNode(true);
	}

	function registerTemplate(id, node) {
		templates[id] = node;
	}


	// DOM Feature tests

	var testEvent = Event('featuretest');

	function testTemplate() {
		// Older browsers don't know about the content property of templates.
		return 'content' in document.createElement('template');
	}

	function testEventDispatchOnDisabled() {
		// FireFox won't dispatch any events on disabled inputs:
		// https://bugzilla.mozilla.org/show_bug.cgi?id=329509

		var input = document.createElement('input');
		var result = false;

		appendChild(document.body, input);
		input.disabled = true;
		input.addEventListener('featuretest', function(e) { result = true; });
		input.dispatchEvent(testEvent);
		removeNode(input);

		return result;
	}

	// Infer transitionend event from CSS transition prefix and add
	// it's name as jQuery.support.transitionEnd.
	
	function testTransition() {
		var prefixed = prefix('transition');
		return prefixed || false;
	}

	function testTransitionEnd() {
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
	}

	// Units

	var rem = /(\d*\.?\d+)r?em/;
	//var rpercent = /(\d*\.?\d+)%/;

	var fontSize;

	var valueTypes = {
		number: function(n) { return n; },

		string: function(string) {
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

			throw new Error('[window.breakpoint] \'' + string + '\' cannot be parsed as rem, em or %.');
		}
	};

	function valueToPx(value) {
		return valueTypes[typeof value](value);
	}

	function getFontSize() {
		return fontSize ||
			(fontSize = parseFloat(style("font-size", document.documentElement), 10));
	}

	// DOM

	function dom(selector, node) {
		return typeof selector === "string" ?
				Fn((node || document).querySelectorAll(selector)) :
			Node.prototype.isPrototypeOf(selector) ?
				Fn([selector]) :
			Fn(selector) ;
	}

	assign(dom, {

		// Nodes

		isElementNode:  isElementNode,
		isTextNode:     isTextNode,
		isCommentNode:  isCommentNode,
		isFragmentNode: isFragmentNode,
		isExternalLink: isExternalLink,

		create:         create,
		clone:          clone,
		identify:       identify,
		tag:            tag,
		classes:        classes,
		style:          Fn.curry(style),
		append:         Fn.curry(append),
		html:           Fn.curry(html),
		before:         Fn.curry(before),
		after:          Fn.curry(after),
		empty:          empty,
		remove:         remove,
		matches:        Fn.curry(matches),
		closest:        Fn.curry(closest),
		valueToPx:      valueToPx,
		find:           find,
		findOne:        findOne,

		// Fragments and Templates

		template: function(id, node) {
			if (node) { registerTemplate(id, node); }
			else { return cloneTemplate(id); }
		},

		fragmentFromTemplate: cloneTemplate,
		fragmentFromContent: fragmentFromContent,

		// Events

		isPrimaryButton: isPrimaryButton,
		preventDefault:  preventDefault,
		Event:           Event,
		events:          events,

		//on: function on(types, fn, data, node) {
		//	var l = arguments.length;
		//
		//	if (l > 2 && dom.isElementNode(arguments[l - 1])) {
		//		on(arguments[l - 1], types, fn);
		//		return node;
		//	}
		//
		//	return Fn.bind(arguments, on);
		//},

		on:              on,
		off:             off,

		trigger: function triggerNode(type, properties, node) {
			var l = arguments.length;

			node = arguments[l - 1];

			if (dom.isElementNode(node) || node === document) {
				trigger(node, type, l > 2 && properties);
				return node;
			}

			return Fn.bind(arguments, triggerNode);
		},


		delegate:        delegate,

		// Features

		features: {
			template:              testTemplate(),
			inputEventsOnDisabled: testEventDispatchOnDisabled(),
			transition:            testTransition(),
			transitionEnd:         testTransitionEnd()
		}
	});


	// Export

	window.dom = dom;
})(this);
