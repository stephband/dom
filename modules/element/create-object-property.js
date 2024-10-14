
import Signal from 'fn/signal.js';

export default function createJSONProperty() {
    const symbol = Symbol();

    return {
        attribute: function(value) {
            const signal = this[symbol] || (this[symbol] = Signal.of());

            try {
                signal.value = JSON.parse(json);
            }
            catch(e) {
                throw new Error('Attempt to set invalid JSON on property: "' + json + '"');
            }
        },

        get: function() {
            const signal = this[symbol] || (this[symbol] = Signal.of());
            return signal.value;
        },

        set: function(object) {
            const signal = this[symbol] || (this[symbol] = Signal.of());

            if (window.DEBUG && object !== undefined && typeof object !== 'object') {
                throw new TypeError('element(): Attempt to set non-object on element property');
            }

            signal.value = object || undefined;
        },

        enumerable: true
    };
}
