
/**
gestures(options, node)

Returns a stream of streams of events. Each stream of events represents the
motion of a single finger. The types of events the stream contains is a
`'pointerdown'` followed by any number of `'pointermove'`s and a `'pointerup'`
or `'pointercancel'` event.

```js
gestures({ select: '.thing', threshold: '0.5rem', device: 'mouse pen touch' }, document.body)
.each(function(events) { ... });
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
    // considered to have started. Defaults to 4px.
    threshold: '0.25rem'
}
```

It is a Very Good Idea to style whatever element is being gestured with
`touch-action` to avoid the browser sending `pointercancel` events when it
thinks you are trying to perform some native pan or scroll
([MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action))
*/

import get      from 'fn/get.js';
import overload from 'fn/overload.js';
import Stream   from 'fn/stream/stream.js';
import px       from './parse-length.js';

const A      = Array.prototype;
const assign = Object.assign;

const userSelect = 'webkitUserSelect' in document.body.style ?
    'webkitUserSelect' :
    'userSelect' ;

const store = {};

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

let clickSuppressionTimestamp = -Infinity;

function stopPropagation(e) {
    if (e.timeStamp - clickSuppressionTimestamp > 60) { return; }
    e.stopPropagation();
    e.preventDefault();
}

/* PointerStream, pointerup and pointercancel handler */

function distanceThreshold(distance, x, y) {
    return (x * x + y * y) >= (distance * distance);
}

function PointerStream(stream, target, e, options) {
    this.stream    = stream;
    this.target    = target;
    this.buffer    = [e];
    this.options   = options;
    this.pointerId = e.pointerId;

    if (typeof options.threshold === 'function') {
        // options.threshold is a function
        this.checkThreshold = options.threshold;
    }
    else {
        // options.threshold is a string or number
        const distance = px(options.threshold);
        this.checkThreshold = (x, y, t) => distanceThreshold(distance, x, y, t);
    }

    document.addEventListener('pointermove', this);
    document.addEventListener('pointerup', this);
    document.addEventListener('pointercancel', this);
}

assign(PointerStream.prototype, Stream.prototype, {
    handleEvent: overload(get('type'), {
        'pointermove': function(e) {
            // If it's not a move from this gesture's pointer we're not interested
            if (this.pointerId !== e.pointerId) return;

            // If pointer is already gesturing don't allow it to start another
            if (this.pointerId in store && this !== store[this.pointerId]) return this.stop();

            // We are still buffering
            if (this.buffer) this.buffer.push(e);

            // We are actively observing
            else Stream.push(this, e);

            // Not yet pushed to gestures
            if (!this.isGesture) {
                // Check to see if we have satisfied the threshold check for
                // x, y and time, if so start the gesture
                const e0 = this.buffer[0];
                const x  = e.clientX - e0.clientX;
                const y  = e.clientY - e0.clientY;
                const t  = (e.timeStamp - e0.timeStamp) / 1000;

                if (this.checkThreshold(x, y, t)) this.createGesture();
            }
        },

        'pointerup': function(e) {
            // Pointer ids do not match
            if (this.pointerId !== e.pointerId) return;

            // We are still buffering
            if (this.buffer) this.buffer.push(e);

            // We are actively observing
            else Stream.push(this, e);

            this.target.releasePointerCapture(this.pointerId);
            this.stop();

            // Suppress click event that follows pointerup
            if (this.isGesture) {
                clickSuppressionTimestamp = e.timeStamp;
                document.addEventListener('click', stopPropagation, {
                    capture: true,
                    once: true
                });
            }
        },

        'default': function(e) {
            if (this.pointerId !== e.pointerId) return;
            this.buffer.push(e);
            this.target.releasePointerCapture(this.pointerId);
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

        // Keep a record of which pointers are currently responsible for
        // gestures - we only want one per pointer, max
        store[this.pointerId] = this;

        // Encourage pointer events for this pointerId to come from this
        // element only
        this.target.setPointerCapture(this.pointerId);

        // Push this pointer stream to gestures
        Stream.push(this.stream, this);
    },

    start: function() {
        // Empty buffer into stream
        while(this.buffer.length) Stream.push(this, this.buffer.shift());

        // Remove buffer
        this.buffer = undefined;
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

            // Remove record that keeps this pointerId bound to this gesture
            delete store[this.pointerId];
        }

        return Stream.stop(this);
    }
});


/* Pointerdown handler */

function isIgnoreTag(e) {
    var tag = e.target.tagName;
    return tag && (!!config.ignoreTags[tag.toLowerCase()] || e.target.draggable);
}

function Gestures(node, options) {
    this.node    = node;
    this.options = options;
}

assign(Gestures.prototype, Stream.prototype, {
    handleEvent: function(e) {
        // Ignore non-primary buttons
        if (e.button !== 0) return;

        // Check pointer type is in options
        if (this.options.device && !this.options.device.includes(e.pointerType)) return;

        // Ignore form and interactive elements
        if (isIgnoreTag(e)) return;

        // Check target matches selector
        let target = e.target;
        if (this.options.select) {
            target = e.target.closest(this.options.select);
            if (!target) return;
        }

        // Copy event to keep the true target around, as target is mutated on
        // the event if it passes through a shadow boundary after being handled
        // here, causing a rare but very gnarly bug hunt.
        var event = {
            type:          e.type,
            target:        e.target,
            currentTarget: e.currentTarget,
            clientX:       e.clientX,
            clientY:       e.clientY,
            timeStamp:     e.timeStamp,
            pointerId:     e.pointerId
        };

        new PointerStream(this, target, event, this.options);
    },

    start: function() {
        this.node.addEventListener('pointerdown', this);
        return this;
    },

    // Stop the gestures stream
    stop: function() {
        this.node.removeEventListener('pointerdown', this);
        return Stream.stop(this);
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
        console.warn('gestures(options) deprecated options.selector, name changed to options.select');
    }

    return new Gestures(node, options);
}
