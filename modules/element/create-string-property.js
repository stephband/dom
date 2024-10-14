
import Signal from 'fn/signal.js';

export default function createString(pattern) {
    const symbol = Symbol();
    const descriptor = {
        attribute: function(value) {
            descriptor.set.call(this, value === null ? '' : value);
        },

        get: function() {
            const signal = this[symbol] || (this[symbol] = Signal.of(''));
            return signal.value;
        },

        set: function(value) {
            const signal = this[symbol] || (this[symbol] = Signal.of(value));
            // Where pattern exists check string matches pattern
            if (pattern && !pattern.test('' + value)) return;
            signal.value = '' + value;
        },

        enumerable: true
    };

    return descriptor;
}
