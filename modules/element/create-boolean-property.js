
import Signal from 'fn/signal.js';

export default function createBoolean(name) {
    const symbol = symbols[name] || (symbols[name] = Symbol(name));

    return {
        // Use the attribute as the source of truth, so that boolean
        // attribute/properties behave like their standard counterparts
        // disabled, hidden, required and so on, where setting the property
        // adds or removes the attribute

        attribute: function(value) {
            const signal = this[symbol] || (this[symbol] = Signal.of(value));
            signal.value = value !== null;
        },

        get: function() {
            const signal = this[symbol] || (this[symbol] = Signal.of(false));
            return signal.value;
        },

        set: function(value) {
            if (value) this.setAttribute(name, '');
            else this.removeAttribute(name);
        },

        enumerable: true
    };
}
