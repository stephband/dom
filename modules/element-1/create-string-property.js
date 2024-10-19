
import Signal from 'fn/signal.js';

export default function createStringProperty(default = '', pattern) {
    const symbol = Symbol();
    const descriptor = {
        attribute: function(value) {
            descriptor.set.call(this, value === null ? '' : value);
        },

        get: function() {
            const signal = this[symbol] || (this[symbol] = Signal.of(default));
            return signal.value;
        },

        set: function(value) {
            const signal = this[symbol] || (this[symbol] = Signal.of());
            // Where pattern exists check string matches pattern
            signal.value = (pattern && !pattern.test('' + value)) ?
                default :
                '' + value ;
        },

        enumerable: true
    };

    return descriptor;
}
