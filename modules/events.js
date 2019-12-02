
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


// Stream of events

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


// -----------------

export function isPrimaryButton(e) {
	// Ignore mousedowns on any button other than the left (or primary)
	// mouse button, or when a modifier key is pressed.
	return (e.which === 1 && !e.ctrlKey && !e.altKey && !e.shiftKey);
}

export function preventDefault(e) {
	e.preventDefault();
}

export function isTargetEvent(e) {
	return e.target === e.currentTarget;
}


// -----------------

const A = Array.prototype;
const eventsSymbol = Symbol('events');

function bindTail(fn) {
	// Takes arguments 1 and up and appends them to arguments
	// passed to fn.
	var args = A.slice.call(arguments, 1);
	return function() {
		A.push.apply(arguments, args);
		fn.apply(null, arguments);
	};
}

export function on(node, type, fn, data) {
	var options;

	if (typeof type === 'object') {
		options = type;
		type    = options.type;
	}

	var types   = type.split(rspaces);
	var events  = node[eventsSymbol] || (node[eventsSymbol] = {});
	var handler = data ? bindTail(fn, data) : fn ;
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

export function trigger(node, type, properties) {
	// Don't cache events. It prevents you from triggering an event of a
	// given type from inside the handler of another event of that type.
	var event = Event(type, properties);
	node.dispatchEvent(event);
}
