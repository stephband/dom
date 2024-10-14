
import Signal from 'fn/signal.js';
import TokenList, { update } from './token-list-2.js';

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
