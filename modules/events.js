
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

import cache  from '../../fn/modules/cache.js';
import Stream, { pipe, push, stop } from '../../fn/modules/stream/stream.js';

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

function EventsProducer(type, options, node) {
    // Potential hard-to-find error here if type has repeats, ie 'click click'.
    // Lets assume nobody is dumb enough to do this, I dont want to have to
    // check for that every time.
    this.types   = type.split(rspaces);
    this.options = options;
    this.node    = node;
    this.select  = options && options.select;
}

assign(EventsProducer.prototype, {
    pipe: function(output) {
        pipe(this, output);
        this.types.reduce(listen, this);
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

        push(this[0], e);
    },

    stop: function() {
        this.types.reduce(unlisten, this);
        stop(this[0]);
    }
});

export default function events(type, node) {
    let options;

    if (typeof type === 'object') {
        options = type;
        type    = options.type;
    }

    return new Stream(new EventsProducer(type, options, node));
}
