
import TokenList from './token-list.js';

const A = Array.prototype;


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


/**
createTokenList(definitions)
Creates a token list attribute/property definition ready for element(), where
`definitions` is an object of named token definitions of the form:

```js
createTokenList({
    token: {
        enable: fn,
        disable: fn
    },

    ...
})
```
**/

export default function createTokenList(definitions) {
    // We lazily create a TokenList as needed, not so much for efficacy, but
    // because we don't have a reference to element until the attribute or
    // property is accessed. We have to store that TokenList somewhere unique -
    // this definition may be shared across many elements - so lets make a
    // symbol property that identifies this definition. I know. It's a little
    // bit meh, but this is a problem with the custom elements API, really.
    const $tokenlist = Symbol('TokenList');

    function update(element, string) {
        const list = element[$tokenlist] || (element[$tokenlist] = new TokenList(element, definitions));
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
            return this[$tokenlist] || (this[$tokenlist] = new TokenList(this, definitions));
        },

        enumerable: true
    };
}
