
import matches  from '../../fn/modules/matches.js';

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
        if (!arguments.length) {
            throw new Error('Cannot pass `' + fn + '` to distributor.on()');
        }

        if (this.handlers.find(matches(arguments))) {
            throw new Error(arguments.length === 1 ?
                'Distributor: function ' + arguments[0].name + '() already bound' :
                'Distributor: object.' + arguments[0] + '() already bound'
            );
        }

        this.handlers.push(arguments);
        return this;
    },

    off: function(fn) {
        const i = this.handlers.findIndex(matches(arguments));
        if (i === -1) { return this; }

        this.handlers.splice(i, 1);
        return this;
    },

    push: function(data) {
        var n = -1;
        var handled, handler, output;

        while (handler = this.handlers[++n]) {
            output = handler.length === 1 ?
                // Functions are called with this as context
                handler[0].apply(this, arguments) :
                // Methods are invoked normally
                handler[1][handler[0]].apply(handler[1], arguments) ;

            handled = handled === undefined ?
                output :
                output === undefined ? handled :
                handled + output ;
        }

        return handled;
    },

    handleEvent: function(e) {
        return this.push(e);
    }
});
