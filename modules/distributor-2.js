import is       from '../../fn/modules/is.js';
import matches  from '../../fn/modules/matches.js';

const assign      = Object.assign;
const define      = Object.defineProperties;


/** 
Distributor(handle)

Returns an object with `.on()`, `.off()` and `.push()` methods, and also 
`.handleEvent()` so that it may be used directly as a DOM event handler. 
Incoming event objects are transformed by `handle` (where `handle` is 
passed in) before being distributed to listeners bound via `distributor.on(fn)`.
**/

function callHandler(handler, names, value) {
    var n = -1;
    var output;

    while (names[++n]) {
        if (names[n] in handler) {
            output = handler[names[n]](value);
        }
    }

    return output;
}

export default function Distributor() {
    define(this, {
        handlers: { value: [] }
    });
}

assign(Distributor.prototype, {
    on: function(name, fn) {
        if (!arguments.length) {
            throw new Error('Cannot pass `' + fn + '` to distributor.on()');
        }

        const listener = typeof name === 'string' ?
            { [name]: fn } :
            name ;

        this.handlers.push(listener);
        return this;
    },

    off: function(name, fn) {
        const i = typeof name === 'string' ?
            this.handlers.findIndex(matches({ [name]: fn })) :
            this.handlers.findIndex(is(name)) ;

        if (i > -1) {
            this.handlers.splice(i, 1);
        }

        return this;
    }
});

assign(Distributor, {
    trigger: function(names, value, distributor) {
        const handlers = distributor.handlers;
        var n = -1;
        var handled, handler;
    
        while (handler = handlers[++n]) {
            const output = callHandler(handler, names, value);
    
            handled = handled === undefined ? output :
                output === undefined ? handled :
                handled + output ;
        }
    
        return handled;
    }
});
