
import clamp     from 'fn/clamp.js';
import nothing   from 'fn/nothing.js';
import Signal    from 'fn/signal.js';
import TokenList, { update } from './token-list-2.js';

const symbols = {};

export function createProperty(name, initial) {
    const symbol = symbols[name] || (symbols[name] = Symbol(name));

    return {
        get: function() {
            const signal = this[symbol] || (this[symbol] = Signal.of(initial));
            return signal.value;
        },

        set: function(value) {
            const signal = this[symbol] || (this[symbol] = Signal.of(value));
            signal.value = value;
        },

        enumerable: true
    };
}

export function createBoolean(name) {
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

export function createNumber(name, min = -Infinity, max = Infinity, initial = clamp(min, max, 0)) {
    const symbol = symbols[name] || (symbols[name] = Symbol(name));

    return {
        attribute: function(value) {
            this[name] = value;
        },

        get: function() {
            const signal = this[symbol] || (this[symbol] = Signal.of(initial));
            return signal.value;
        },

        set: function(value) {
            const signal = this[symbol] || (this[symbol] = Signal.of(value));
            const number = Number(value);

            if (Number.isNaN(number)) {
                throw new TypeError('Attempt to set ' + typeof value + ' on ' + name + ' property, expects a number');
            }

            signal.value = clamp(min, max, number);
        },

        enumerable: true
    };
}

export function createString(name, pattern) {
    const symbol = symbols[name] || (symbols[name] = Symbol(name));

    return {
        attribute: function(value) {
            this[name] = value === null ? '' : value ;
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
}

export function createTokenList(name, tokens = nothing) {
    const symbol = symbols[name] || (symbols[name] = Symbol(name));

    return {
        // Use the attribute as the source of truth rather than the property,
        // so that TokenList attribute/properties behave like standard
        // `classList` and `controls` properties, which update their attributes

        attribute: function(string) {
            update(this[name], value === null ? '' : value);
        },

        get: function() {
            return this[symbol] || (this[symbol] = new TokenList(tokens));
        },

        set: function(value) {
            this.setAttribute(name, value);
        },

        enumerable: true
    };
}
