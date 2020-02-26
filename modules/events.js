
import { Stream } from '../../fn/module.js';
import Event from './event.js';
import features from './features.js';

const assign  = Object.assign;
const rspaces = /\s+/;

function prefixType(type) {
	return features.events[type] || type ;
}


// Handle event types

// DOM click events may be simulated on inputs when their labels are
// clicked. The tell-tale is they have the same timeStamp. Track click
// timeStamps.
var clickTimeStamp = 0;

window.addEventListener('click', function(e) {
	clickTimeStamp = e.timeStamp;
});

function listen(source, type) {
	if (type === 'click') {
		source.clickUpdate = function click(e) {
			// Ignore clicks with the same timeStamp as previous clicks –
			// they are likely simulated by the browser.
			if (e.timeStamp <= clickTimeStamp) { return; }
			source.update(e);
		};

		source.node.addEventListener(type, source.clickUpdate, source.options);
		return source;
	}

	source.node.addEventListener(type, source.update, source.options);
	return source;
}

function unlisten(source, type) {
	source.node.removeEventListener(type, type === 'click' ?
		source.clickUpdate :
		source.update
	);

	return source;
}

/**
events(type, node)

Returns a mappable stream of events heard on `node`:

    var stream = events('click', document.body);
    .map(get('target'))
    .each(function(node) {
        // Do something with nodes
    });

Stopping the stream removes the event listeners:

    stream.stop();
*/

function Source(notify, stop, type, options, node) {
	const types  = type.split(rspaces).map(prefixType);
	const buffer = [];

	function update(value) {
		buffer.push(value);
		notify();
	}

	this._stop   = stop;
	this.types   = types;
	this.node    = node;
	this.buffer  = buffer;
	this.update  = update;
	this.options = options;

	// Potential hard-to-find error here if type has repeats, ie 'click click'.
	// Lets assume nobody is dumb enough to do this, I dont want to have to
	// check for that every time.
	types.reduce(listen, this);
}

assign(Source.prototype, {
	shift: function shiftEvent() {
		const buffer = this.buffer;
		return buffer.shift();
	},

	stop: function stopEvent() {
		this.types.reduce(unlisten, this);
		this._stop(this.buffer.length);
	}
});

export default function events(type, node) {
	let options;

	if (typeof type === 'object') {
		options = type;
		type    = options.type;
	}

	return new Stream(function(notify, stop) {
		return new Source(notify, stop, type, options, node)
	});
}


/**
isPrimaryButton(e)

Returns `true` if user event is from the primary (normally the left or only)
button of an input device. Use this to avoid listening to right-clicks.
*/

export function isPrimaryButton(e) {
	// Ignore mousedowns on any button other than the left (or primary)
	// mouse button, or when a modifier key is pressed.
	return (e.which === 1 && !e.ctrlKey && !e.altKey && !e.shiftKey);
}

/**
preventDefault(e)

Calls `e.preventDefault()`.
*/

export function preventDefault(e) {
	e.preventDefault();
}

export function isTargetEvent(e) {
	return e.target === e.currentTarget;
}


// -----------------

const A = Array.prototype;
const eventsSymbol = Symbol('events');

function applyTail(fn, args) {
	return function() {
		A.push.apply(arguments, args);
		fn.apply(null, arguments);
	};
}

export function on(node, type, fn) {
	var options;

	if (typeof type === 'object') {
		options = type;
		type    = options.type;
	}

	var types   = type.split(rspaces);
	var events  = node[eventsSymbol] || (node[eventsSymbol] = {});
	var handler = arguments.length > 3 ? applyTail(fn, A.slice.call(arguments, 3)) : fn ;
	var handlers, listener;
	var n = -1;

	while (++n < types.length) {
		type = types[n];
		handlers = events[type] || (events[type] = []);
		listener = type === 'click' ?
			function(e) {
				// Ignore clicks with the same timeStamp as previous clicks –
				// they are likely simulated by the browser on inputs when
				// their labels are clicked
				if (e.timeStamp <= clickTimeStamp) { return; }
				handler(e);
			} :
			handler ;
		handlers.push([fn, listener]);
		node.addEventListener(type, listener, options);
	}

	return node;
}

export function once(node, types, fn, data) {
	on(node, types, function once() {
		off(node, types, once);
		fn.apply(null, arguments);
	}, data);
}

export function off(node, type, fn) {
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

/**
trigger(type, node)

Triggers event of `type` on `node`.

```
trigger('dom-activate', node);
```
*/

export function trigger(node, type, properties) {
	// Don't cache events. It prevents you from triggering an event of a
	// given type from inside the handler of another event of that type.
	var event = Event(type, properties);
	node.dispatchEvent(event);
}
