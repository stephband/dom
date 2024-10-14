
import Signal from 'fn/signal.js';

export default function createProperty(initial) {
    const symbol = Symbol();

    return {
        get: function() {
            const signal = this[symbol] || (this[symbol] = Signal.of(initial));
            return signal.value;
        },

        set: function(value) {
            const signal = this[symbol] || (this[symbol] = Signal.of());
            signal.value = value;
        },

        enumerable: true
    };
}
