
import Stream from '../../fn/stream/stream.js';
import features from './features.js';

const assign  = Object.assign;
const rspaces = /\s+/;

function prefixType(type) {
	return features.events[type] || type ;
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


// DOM click events may be simulated on inputs when their labels are
// clicked. The tell-tale is they have the same timeStamp. Track click
// timeStamps.
var clickTimeStamp = 0;

window.addEventListener('click', (e) => clickTimeStamp = e.timeStamp);

function listen(producer, type) {
    producer.node.addEventListener(type, producer, producer.options);
    return producer;
}

function unlisten(producer, type) {
    producer.node.removeEventListener(type, producer);
    return producer;
}

function Producer(controller, type, options, node) {
	this.controller = controller;
    this.types = type.split(rspaces).map(prefixType);
	this.options = options;
    this.node    = node;
    this.select  = options && options.select;

	// Potential hard-to-find error here if type has repeats, ie 'click click'.
	// Lets assume nobody is dumb enough to do this, I dont want to have to
	// check for that every time.
	this.types.reduce(listen, this);
}

assign(Producer.prototype, {
	stop: function() {
		this.types.reduce(unlisten, this);
	},

    handleEvent: function(e) {
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

        this.controller.push(e);
    }
});

export default function events(type, node) {
	let options;

	if (typeof type === 'object') {
		options = type;
		type    = options.type;
	}

	return new Stream((controller) => 
        new Producer(controller, type, options, node)
    );
}


/**
isPrimaryButton(e)
Returns `true` if event is from the primary (normally the left or only)
button of an input device. Use this to filter out right-clicks.
*/

export function isPrimaryButton(e) {
	// Ignore mousedowns on any button other than the left (or primary)
	// mouse button, or when a modifier key is pressed.
	return (e.which === 1 && !e.ctrlKey && !e.altKey && !e.shiftKey);
}

/**
preventDefault(e)
Calls `e.preventDefault()`.
**/

export function preventDefault(e) {
	e.preventDefault();
}

/** 
isTargetEvent(e)
Tests whether `e.target === e.currentTarget`.  
**/
export function isTargetEvent(e) {
	return e.target === e.currentTarget;
}

export function isNotPrevented(e) {
	return !e.defaultPrevented;
}
