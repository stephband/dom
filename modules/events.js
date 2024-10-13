
/**
events(type, element)

Returns a mappable stream of events heard on `element`.

```js
events('click', element)
.map((e) => e.target.id)
```

The first parameter may alternatively be a select object. It must have a
`.type` property.

```js
events({ type: 'click' }, element)
.map((e) => e.target.id)
```

The object may contain a number of other properties that select the events
received. It supports the standard addEventListener options, for passive and
capture phase event binding.

```js
events({ type: 'scroll', passive: true, capture true }, window)
.map((e) => window.scrollTop)
```

And a `.select` property, a CSS selector, that filters events to those with
targets that match or have a `closest()` ancestor that matches the selector.

```js
events({ type: 'click', select: '[name="button"]' }, element)
.map((e) => e.target.id)
```

However, if you need to delegate events it is recommended to use the
`delegate()` function, which has the added benefit of direct access to the
delegated target.

```js
events('click', element)
.each(delegate({
    '[name="button"]': (target, e) => console.log(target.id),
    '[name="remove"]': (target, e) => document.getElementById(target.value).remove(),
    ...
}))
```

Stopping an event stream removes its event listeners.

```js
events('click', element).stop()
```
**/

/*
events(type, element, initial)

Pass in an `initial` event object to have the event stream start synchronously
with an initial value when consumed.
*/

import cache  from 'fn/cache.js';
import Stream from 'fn/stream/stream.js';

const assign  = Object.assign;
const rspaces = /\s+/;
const types   = {
    fullscreenchange: cache(() => (
        'fullscreenElement' in document ? 'fullscreenchange' :
        'webkitFullscreenElement' in document ? 'webkitfullscreenchange' :
        'mozFullScreenElement' in document ? 'mozfullscreenchange' :
        'msFullscreenElement' in document ? 'MSFullscreenChange' :
        'fullscreenchange'
    ))
};


// DOM click events may be simulated on inputs when their labels are
// clicked. The tell-tale is they have the same timeStamp. Track click
// timeStamps.
var clickTimeStamp = 0;

window.addEventListener('click', (e) => clickTimeStamp = e.timeStamp);

function listen(listener, type) {
    listener.node.addEventListener(types[type] ? types[type]() : type, listener, listener.options);
    return listener;
}

function unlisten(listener, type) {
    listener.node.removeEventListener(types[type] ? types[type]() : type, listener);
    return listener;
}

function Events(type, options, node, initialEvent) {
    // Potential hard-to-find error here if type has repeats, ie 'click click'.
    // Lets assume nobody is dumb enough to do this, I dont want to have to
    // check for that every time.
    this.types        = type.split(rspaces);
    this.options      = options;
    this.node         = node;
    this.select       = options && options.select;
    this.initialEvent = initialEvent;
}

assign(Events.prototype, Stream.prototype, {
    start: function() {
        this.types.reduce(listen, this);

        if (this.initialEvent) {
            this.handleEvent(this.initialEvent);
            delete this.initialEvent;
        };

        return this;
    },

    handleEvent: function(e) {
        // Ignore clicks with the same timeStamp as previous clicks –
        // they are likely simulated by the browser, like how clicks on labels
        // cause simulated clicks to be emitted from inputs
        if (e.type === 'click' && e.timeStamp <= clickTimeStamp) return;

        // If there is a selector and the target doesn't match, shoofty
        // outta here
        if (this.select) {
            const selectedTarget = e.target.closest(this.select);
            if (!selectedTarget) { return; }
            e.selectedTarget = selectedTarget;
        }

        Stream.push(this, e);
    },

    stop: function() {
        this.types.reduce(unlisten, this);
        return Stream.prototype.stop.apply(this);
    }
});

export default function events(type, node, initialEvent) {
    let options;

    if (typeof type === 'object') {
        options = type;
        type    = options.type;
    }

    return new Events(type, options, node, initialEvent);
}
