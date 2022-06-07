
/**
gestures(options, node)

Returns a stream of streams of events. Each stream of events represents the
motion of a single finger. The types of events the stream contains is a
`'pointerdown'` followed by any number of `'pointermove'`s and a `'pointerup'`
or `'pointercancel'` event.

```js
gestures({ select: '.thing', threshold: '0.5rem', device: 'mouse pen touch' }, document)
.each(function(events) {
    const e0 = events.shift();

    events.each(function(e1) {
        const distance = Math.pow(
            Math.pow(e1.clientX - e0.clientX, 2),
            Math.pow(e1.clientY - e0.clientY, 2),
        0.5);

        console.log(distance);
    });
});
```

The `options` object may optionally contain any of:

```js
{
    // Listen to gestures on a given device type. Internally the pointer events'
    // e.pointerType is matched against this string: it may contain any of the
    // types 'pen', 'mouse' and 'touch'. Where not defined, all pointer types
    // trigger a gesture
    device: 'mouse pen',

    // Listen to gestures inside a selected element or elements
    select: '.class'

    // Determine a minimum distance a finger must travel before a gesture is
    // considered to have started
    threshold: '0.25rem'
}
```
*/

import get      from '../../fn/modules/get.js';
import overload from '../../fn/modules/overload.js';
import Stream, { pipe, unpipe, push, stop } from '../../fn/modules/stream/stream.js';
//import Producer from '../../fn/modules/stream/producer.js';
import px       from './parse-length.js';

const A      = Array.prototype;
const assign = Object.assign;

const userSelect = 'webkitUserSelect' in document.body.style ?
    'webkitUserSelect' :
    'userSelect' ;

export const config = {
    // Number of pixels, or string CSS length, that a pressed pointer travels
    // before gesture is started.
    threshold: 4,

    ignoreTags: {
        textarea: true,
        input: true,
        select: true
    }
};


/* Pointermove, pointerup and pointercancel handler */

function distanceThreshold(distance, x, y) {
    return (x * x + y * y) >= (distance * distance);
}

function Pointermove(stream, events, options) {
    this.stream    = stream;
    this.events    = events;
    this.options   = options;
    this.pointerId = events[0].pointerId;

    if (typeof options.threshold === 'function') {
        // options.threshold is a function
        this.checkThreshold = options.threshold;
    }
    else {
        // options.threshold is a string or number
        const distance = px(options.threshold);
        this.checkThreshold = (x, y) => distanceThreshold(distance, x, y);
    }

    document.addEventListener('pointermove', this);
    document.addEventListener('pointerup', this);
    document.addEventListener('pointercancel', this);
}

assign(Pointermove.prototype, {
    handleEvent: overload(get('type'), {
        'pointermove': function(e) {
            if (this.pointerId !== e.pointerId) {
                console.log('Not the same pointer');
                return;
            }

            this.events.push(e);

            if (!this.isGesture) {
                // Check to see if we have satisfied the threshold check for
                // x, y and time, if so start the gesture
                const e0 = this.events[0];
                const x  = e.clientX - e0.clientX;
                const y  = e.clientY - e0.clientY;
                const t  = (e.timeStamp - e0.timeStamp) / 1000;

                if (this.checkThreshold(x, y, t)) {
                    this.createGesture();
                }
            }
        },

        'default': function(e) {
            if (this.pointerId !== e.pointerId) {
                console.log('Not the same pointer');
                return;
            }

            this.events.push(e);
            this.stop();
        }
    }),

    createGesture: function() {
        // We are gesturing! Let's go
        this.isGesture = true;

        // For the duration of us dragging the pointer around we need to
        // prevent text selection on the document. Note doing this does not
        // deselect any text that has already been selected.
        this.userSelectState = document.body.style[userSelect];
        document.body.style[userSelect] = 'none';

        // Push a new gesture stream that uses this as producer
        this.stream.push(new Stream(this));
    },

    pipe: function(output) {
        // Sets this[0] and listens to stops on output
        pipe(this, output);

        // Empty buffer into stream
        while(this.events.length) {
            // Stream may be stopped during this loop so push to `this[0]`
            // rather than to `output`
            push(this[0], A.shift.apply(this.events));
        }

        // Have the output stream take over as the events buffer
        this.events = output;
    },

    stop: function() {
        // Remove the listeners
        document.removeEventListener('pointermove', this);
        document.removeEventListener('pointerup', this);
        document.removeEventListener('pointercancel', this);

        // Is it already stopped?
        if (this.isGesture) {
            // Reset text selectability
            document.body.style[userSelect] = this.userSelectState;
        }

        if (this[0]) {
            const output = this[0];
            unpipe(this, 0);
            stop(output);
        }
    }
});


/* Pointerdown handler */

function isIgnoreTag(e) {
    var tag = e.target.tagName;
    return tag && (!!config.ignoreTags[tag.toLowerCase()] || e.target.draggable);
}

function PointerProducer(node, options) {
    this.node    = node;
    this.options = options;
}

assign(PointerProducer.prototype, /*Producer.prototype, */ {
    pipe: function(output) {
        this[0] = output;
        this.node.addEventListener('pointerdown', this);
        return output;
    },

    handleEvent: function(e) {
        // Ignore non-primary buttons
        if (e.button !== 0) { return; }

        // Check pointer type is in options
        if (this.options.device && !this.options.device.includes(e.pointerType)) { return; }

        // Ignore form and interactive elements
        if (isIgnoreTag(e)) { return; }

        // Check target matches selector
        if (this.options.select && !e.target.closest(this.options.select)) { return; }

        // Copy event to keep the true target around, as target is mutated on
        // the event if it passes through a shadow boundary after being handled
        // here, resulting in a rare but gnarly bug hunt.
        var event = {
            type:          e.type,
            target:        e.target,
            currentTarget: e.currentTarget,
            clientX:       e.clientX,
            clientY:       e.clientY,
            timeStamp:     e.timeStamp,
            pointerId:     e.pointerId
        };

        new Pointermove(this[0], [event], this.options);
    },

    // Stop the gestures stream
    stop: function() {
        if (this[0]) {
            this.node.removeEventListener('pointerdown', this);
            stop(this[0]);
        }

        return this;
    }
});


/* Gestures */

export default function gestures(options, node) {
    options = node ?
        options ? assign({}, config, options) : config :
        config ;

    node = node ?
        node :
        options ;

    if (window.DEBUG && options.selector) {
        console.warn('gestures(options) options.selector is now options.select');
    }

    return new Stream(new PointerProducer(node, options));
}

// Expose to console in DEBUG mode
if (window.DEBUG) {
    Object.assign(window.dom || (window.dom = {}), { gestures });
}
