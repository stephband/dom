
import '../../fn/modules/stream.wait.js';
import Stream from '../../fn/modules/stream.js';
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
	source.node.addEventListener(type, source, source.options);
	return source;
}

function unlisten(source, type) {
	source.node.removeEventListener(type, source);
	return source;
}

/**
events(type, node)

Returns a mappable stream of events heard on `node`:

```js
var stream = events('click', document.body);
.map(get('target'))
.each(function(node) {
    // Do something with nodes
});
```

Stopping the stream removes the event listeners:

```js
stream.stop();
```

The first parameter may also be an options object, which must have a `type`
property. The `select: '...'` property allows for delegation of an event from 
the selected target. Other properties, eg. `passive: true` are passed to 
addEventListener options.

```js
var stream = events({ type: 'scroll', passive: true, select: '' }, document.body);
```
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
    this.select  = options && options.select;

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
	},

    /* Make source double as our DOM listener object */
    handleEvent: function handleEvent(e) {
        // Ignore clicks with the same timeStamp as previous clicks –
        // they are likely simulated by the browser.
        if (e.type === 'click' && e.timeStamp <= clickTimeStamp) {
            return;
        }

        // If there is a selector and the target doesn't match, shoofty 
        // outta here
        if (this.select) {
            const selectedTarget = e.target.closest(this.select);
            if (!selectedTarget) { return; }
            e.selectedTarget = selectedTarget;
        }

        this.update(e);
    }
});

export default function events(type, node) {
	let options;

	if (typeof type === 'object') {
		options = type;
		type    = options.type;
	}

	return new Stream(function(notify, stop) {
		return new Source(notify, stop, type, options, node);
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

export function isNotPrevented(e) {
	return !e.defaultPrevented;
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

export function on(type, fn, node) {
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
	on(types, function once() {
		off(types, once, node);
		fn.apply(null, arguments);
	}, node, data);
}

export function off(type, fn, node) {
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
