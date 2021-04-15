
import remove from '../../fn/modules/remove.js';

const assign = Object.assign;

/** 
Distributor(handle)

Returns an object with `.on()`, `.off()` and `.push()` methods, and also 
`.handleEvent()` so that it may be used directly as a DOM event handler. 
Incoming event objects are transformed by `handle` (where `handle` is 
passed in) before being distributed to listeners bound via `distributor.on(fn)`.
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
                this.push(data) ;
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

    push: function(data) {
        var n = -1;
        var fn;

        while (fn = this.handlers[++n]) {
            typeof fn === 'function' ?
                // Functions are called with this as context
                fn.apply(this, arguments) :
                // Methods are invoked normally
                fn.push.apply(fn, arguments) ;
        }

        return this;
    },

    handleEvent: function(e) {
        this.push(e);
    }
});
