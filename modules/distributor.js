
import remove from '../../fn/modules/remove.js';

const assign = Object.assign;

/** 
Distributor(handler)
Returns an object with `.on()`, `.off()` and `.trigger()` methods, ready to be used as an event 
handler. Incoming event objects are transformed by `handler` (where `handler` is 
passed in) before being distributed to fns bound via `distributor.on(fn)`.
**/

export default function Distributor(fn) {
    // Support construction without `new` keyword
    if (!Distributor.prototype.isPrototypeOf(this)) {
        return new Distributor(fn);
    }

    this.handlers = [];

    if (fn) {
        this.handleEvent = function(e) {
            const data = fn(e);
            return data === undefined ?
                undefined : 
                this.trigger(data) ;
        };
    }
}

assign(Distributor.prototype, {
    on: function(fn) {
        if (this.handlers.indexOf(fn) > -1) {
            throw new Error('Function already bound');
        }

        this.handlers.push(fn);
        return this;
    },

    off: function(fn) {
        remove(this.handlers, fn);
        return this;
    },

    trigger: function(data) {
        var n = -1;
        var fn;

        while (fn = this.handlers[++n]) {
            fn.trigger ? fn.trigger(data) : fn.apply(this, arguments);
        }

        return this;
    },

    /*
    Allow distributor to be used as a DOM event handler by aliasing `.trigger()` to
    `.handleEvent()` by default. This is overriden if Distributor() is passed a transform
    function.
    element.addEventListener(distributor)
    */

    handleEvent: function(e) {
        this.trigger(e);
    }
});
