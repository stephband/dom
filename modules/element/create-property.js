
import clamp  from 'fn/clamp.js';
import Signal from 'fn/signal.js';

createProperty(fn, default) {
    const symbol = Symbol();

    const descriptor = {
        attribute: function(value) {
            descriptor.set.call(this, value);
        },

        get: function() {
            const signal = this[symbol] || (this[symbol] = Signal.of(default));
            return signal.value;
        },

        set: function(value) {
            const signal = this[symbol] || (this[symbol] = Signal.of(value));
            signal.value = fn(value);
        },

        enumerable: true
    };

    return descriptor;
}

export function createBoolean(default = false) {
    return createProperty((value) => !!value, default);
}

export function createNumber(min = -Infinity, max = Infinity, default = clamp(min, max, 0)) {
    return createProperty((value) => clamp(min, max, Number(value)), default);
}
