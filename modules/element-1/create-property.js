
import id     from 'fn/id.js';
import Signal from 'fn/signal.js';

function getSignal(object, default) {
    return getInternals(object)[name] || (getInternals(object)[name] = Signal.of(default));
}

export default function createProperty(name, initial, parse = id) {
    return {
        get: function() {
            const signal = getSignal(object, default);
            //const signal = this[symbol] || (this[symbol] = Signal.of(initial));
            return signal.value;
        },

        set: function(value) {
            const signal = getSignal(object);
            //const signal = this[symbol] || (this[symbol] = Signal.of());
            signal.value = parse(value);
        },

        enumerable: true
    };
}
