
import clamp  from 'fn/clamp.js';
import Signal from 'fn/signal.js';

export default function createNumberProperty(initial = 0, min = -Infinity, max = Infinity, parse = Number) {
    const symbol = Symbol();
    const descriptor = {
        attribute: function(value) {
            descriptor.set.apply(this, arguments);
        },

        get: function() {
            const signal = this[symbol] || (this[symbol] = Signal.of(clamp(min, max, initial)));
            return signal.value;
        },

        set: function(value) {
            const signal = this[symbol] || (this[symbol] = Signal.of());
            const number = parse(value);

            if (Number.isNaN(number)) {
                throw new TypeError('Attempt to set ' + typeof value + ' on property, expects a number');
            }

            signal.value = clamp(min, max, number);
        },

        enumerable: true
    };

    return descriptor;
}
