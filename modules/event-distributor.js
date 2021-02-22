
import id     from '../../fn/modules/id.js';
import remove from '../../fn/modules/remove.js';

const assign = Object.assign;

/** 
EventDistributor(handler)
Returns an object with a handleEvent method, ready to be used as an event 
handler. Incoming event objects are transformed by `handler` (where `handler` is 
passed in) before being distributed to fns bound via `distributor.on(fn)`.
**/

export default function EventDistributor(handler) {
    this.handlers = [];

    if (handler) {
        this.handler = handler;
    }
}

assign(EventDistributor.prototype, {
    on: function(fn) {
        if (this.handlers.indexOf(fn) > -1) {
            throw new Error('Function already bound');
        }

        this.handlers.push(fn);
    },

    off: function(fn) {
        remove(this.handlers, fn);
    },

    handler: id,

    handleEvent: function(e) {
        const handler = this.handler;
        const data = handler(e);

        // If no data do not distribute
        if (!data) { return; }

        var n = -1;
        var fn;

        while (fn = this.handlers[++n]) {
            fn(data);
        }
    }
});
