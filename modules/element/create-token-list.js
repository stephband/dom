
import { remove } from '../../../fn/modules/remove.js';

const A      = Array.prototype;
const assign = Object.assign;


/*
updateList(list, tokens)
The missing update function for TokenLists. Compares existing tokens with
a new list of tokens, removes those that are not in the new list, and adds
those that do not exist.
*/

function updateList(list, tokens) {
    const removes = list.tokens.slice();
    const adds    = A.slice.apply(tokens);

    let n = removes.length;
    while (n--) {
        if (adds.includes(removes[n])) {
            removes.splice(n, 1);
        }
    }

    list.remove.apply(list, removes);
    list.add.apply(list, adds);
}


/*
TokenList(element, definitions)
The definitions object is a map of accepted tokens, each one represented by an
object with the functions `enable()` and `disable()`.
*/

function TokenList(element, definitions) {
    this.element     = element;
    this.definitions = definitions;
    this.tokens      = [];
}

assign(TokenList.prototype, {
    add: function() {
        let n = arguments.length;
        while (n--) {
            const token = arguments[n];
            if (!this.tokens.includes(token) && this.definitions[token]) {
                // Call the definition.add() with element as context
                this.definitions[token].enable(this.element);
                this.tokens.push(token);
            }
        }
    },

    remove: function() {
        let n = arguments.length;
        while (n--) {
            const token = arguments[n];
            if (this.tokens.includes(token)) {
                // Call the definition.remove() with element as context
                this.definitions[token].disable(this.element);
                remove(this.tokens, token);
            }
        }
    },

    supports: function(token) {
        return !!this.definitions[token];
    }
});


/**
createTokenList(definitions)
Creates a token list attribute/property definition ready for element(), where
`definitions` is an object of named token definitions of the form:

```js
{
    tokenName: {
        enable: fn,
        disable: fn,
        getState: fn
    },

    ...
}
```
**/

export default function createTokenList(definitions) {
    // We lazily create a TokenList as needed, not so much for efficacy, but
    // because we don't have a reference to element until the attribute or
    // property is accessed.
    var list;

    function update(element, string) {
        list = list || new TokenList(element, definitions);
        updateList(list, string.trim().split(/\s+/));
    }

    return {
        attribute: function(value) {
            update(this, value || '');
        },

        set: function(value) {
            update(this, value + '');
        },

        get: function() {
            list = list || new TokenList(this, definitions);
            return list;
        }
    };
}
