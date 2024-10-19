
import nothing from 'fn/nothing.js';
import TokenList, { update } from './token-list-2.js';

export function createTokenList(name, tokens = nothing) {
    return {
        // Use the attribute as the source of truth rather than the property,
        // so that TokenList attribute/properties behave like standard
        // `classList` and `controls` properties, which update their attributes
        attribute: function(value) {
            const tokenlist = this[name];
            update(tokenlist, value === null ? '' : value);
        },

        get: function() {
            const internals = getInternals(element);
            return internals[name] || (internals[name] = new TokenList());
        },

        set: function(value) {
            this.setAttribute(name, value);
        },

        enumerable: true
    };
}
