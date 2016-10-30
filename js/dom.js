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

	function Events(node, types, selector) {
		var stream = Stream.of();
		var _stop = stream.stop;

		function push(e) {
			stream.push(e);
		}

		stream.on('done', function() {
			_stop.apply(this);
			off(node, types, push, selector);
		});

		on(node, types, push, selector);
		return stream;
	}

	function on(node, types, fn, data, selector) {
		types = types.split(rspaces);

		var events = node[eventsSymbol] || (node[eventsSymbol] = {});
		var handlers, type;

		function handler(e) { fn(e, data); }

		for (type of types) {
			handlers = events[type] || (events[type] = []);
			handlers.push([fn, handler]);
			node.addEventListener(type, handler);
		}
	}

	function off(node, types, fn, selector) {
		types = types.split(rspaces);

		var events = node[eventsSymbol];
		var type, handlers, i;

		if (!events) { return; }

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
				A.slice.apply((node || document).querySelectorAll(selector)) :
			Node.prototype.isPrototypeOf(selector) ?
				[selector] :
			A.slice.call(selector) ;
	}

	assign(dom, {

		// Nodes

		isElementNode:  isElementNode,
		isTextNode:     isTextNode,
		isCommentNode:  isCommentNode,
		isFragmentNode: isFragmentNode,

		create:         create,
		clone:          clone,
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
		Events:          Fn.curry(Events),
		Event:           Event,
		on:              on,
		off:             off,
		trigger:         trigger,
		delegate:        delegate,

		// Features

		features: {
			template: testTemplate(),
			inputEventsOnDisabled: testEventDispatchOnDisabled()
		}
	});


	// Export

	window.dom = dom;
})(this);
