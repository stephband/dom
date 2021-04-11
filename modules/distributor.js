
import id     from '../../fn/modules/id.js';
import remove from '../../fn/modules/remove.js';

const assign = Object.assign;

console.warn('Import "./dom/modules/event-distributor.js" has moved to "./fn/modules/distributor.js". The original will be removed.');

/** 
Distributor(handler)
Returns an object with `.on()`, `.off()` and `.trigger()` methods, ready to be used as an event 
handler. Incoming event objects are transformed by `handler` (where `handler` is 
passed in) before being distributed to fns bound via `distributor.on(fn)`.
**/

export default function Distributor(fn) {
    this.handlers = [];

    if (fn) {
        const handleEvent = this.handleEvent;
        this.handleEvent = function(e) {
            return handleEvent.call(this, fn(e));
        };
    }
}

assign(Distributor.prototype, {
    on: function(fn) {
        if (this.handlers.indexOf(fn) > -1) {
            throw new Error('Function already bound');
        }

        this.handlers.push(fn);
    },

    off: function(fn) {
        remove(this.handlers, fn);
    },

    /*
    Allow distributor to be used as a DON event handler by aliasing `.trigger()` to
    `.handleEvent()`
    element.addEventListener(distributor)
    */

    handleEvent: function(e) {
        const transform = this.transform;
        const data = transform ? transform(e) : e ;

        // If no data do not distribute
        if (!data) { return; }

        var n = -1;
        var fn;

        while (fn = this.handlers[++n]) {
            fn(data);
        }
    }
});
