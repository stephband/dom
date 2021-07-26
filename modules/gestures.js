
/**
gestures(options, node)

Returns a stream of streams of events. Each stream of events represents the
motion of a single finger. The types of events the stream contains is a
`'pointerdown'` followed by any number of `'pointermove'`s and a `'pointerup'`
or `'pointercancel'` event.

```js
gestures({ selector: '.thing', threshold: '0.5rem', device: 'mouse pen touch' }, document)
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
    selector: '.class'

    // Determine a minimum distance a finger must travel before a gesture is 
    // considered to have started
    threshold: '0.25rem'
}
```
*/

import get        from '../../fn/modules/get.js';
import overload   from '../../fn/modules/overload.js';
import Stream     from '../../fn/modules/stream.js';
import parseValue from './parse-value.js';

const assign = Object.assign;

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

function checkThreshold(threshold, e0, e1) {
    var distX = e1.clientX - e0.clientX;
    var distY = e1.clientY - e0.clientY;

    // Return false if the threshold has not been crossed.
    return !(
        (distX * distX) + (distY * distY) < (threshold * threshold)
    );
}

function Pointermove(push, events, options) {
    this.pushGesture = push;
    this.events      = events;
    this.options     = options;
    this.pointerId   = events[0].pointerId;
    this.threshold   = parseValue(options.threshold);

    document.addEventListener('pointermove', this);
    document.addEventListener('pointerup', this);
    document.addEventListener('pointercancel', this);

    // If threshold is 0 start gesture immediately
    if (this.threshold === 0) {
        this.createGesture();
    }
}

assign(Pointermove.prototype, {
    handleEvent: overload(get('type'), {
        'pointermove': function(e) {
            if (this.pointerId !== e.pointerId) {
                console.log('Not the same pointer');
                return;                
            }

            this.push(e);
        },

        'default': function(e) {
            if (this.pointerId !== e.pointerId) {
                console.log('Not the same pointer');
                return;                
            }

            this.push(e);
            this.stop();
        }
    }),

    createGesture: function() {
        const events = this.events;

        this.isGesture = true;
        this.pushGesture(new Stream((push, stop) => {    
            // Push in existing events
            push.apply(null, events);
    
            // Override events so that events are pushed directly to the stream
            this.events = {
                push: push,
                stop: stop
            };
    
            return {};
        }));        
    },

    push: function(e) {
        this.events.push(e);

        // Before we cross the threshold we need to check it on each move
        if (!this.isGesture && checkThreshold(this.threshold, this.events[0], e)) {
            this.createGesture();
        }

        // After we want to cancel any default actions
        else {
            e.preventDefault();
        }
    },

    stop: function() {
        // Stop the gesture stream
        this.events.stop && this.events.stop();

        // Remove the listeners
        document.removeEventListener('pointermove', this);
        document.removeEventListener('pointerup', this);
        document.removeEventListener('pointercancel', this);
    }
});


/* Pointerdown handler */

function isIgnoreTag(e) {
    var tag = e.target.tagName;
    return tag && (!!config.ignoreTags[tag.toLowerCase()] || e.target.draggable);
}

function Pointerdown(push, stop, node, options) {
    this.node        = node;
    this.pushGesture = push;
    this.stopGesture = stop;
    this.options     = options;
    this.node.addEventListener('pointerdown', this);
}

assign(Pointerdown.prototype, {
    handleEvent: function(e) {
        // Ignore non-primary buttons
        if (e.button !== 0) { return; };

        // Check pointer type is in options
        if (this.options.device && !this.options.device.includes(e.pointerType)) { return; }

        // Ignore form and interactive elements
        if (isIgnoreTag(e)) { return; }

        // Check target matches selector
        if (this.options.selector && !e.target.closest(this.options.selector)) { return; }
    
        // Copy event to keep the true target around, as target is mutated on the
        // event if it passes through a shadow boundary after being handled here
        var event = {
            type:          e.type,
            target:        e.target,
            currentTarget: e.currentTarget,
            clientX:       e.clientX,
            clientY:       e.clientY,
            timeStamp:     e.timeStamp,
            pointerId:     e.pointerId
        };

        new Pointermove(this.pushGesture, [event], this.options);
    },

    // Stop the gestures stream
    stop: function() {
        this.node.removeEventListener('pointerdown', this);
        this.stopGesture();
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

    return new Stream(function(push, stop) {
        return new Pointerdown(push, stop, node, options);
    });
}
