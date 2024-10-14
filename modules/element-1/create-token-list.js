
import TokenList       from './token-list.js';
import updateTokenList from './update-token-list.js';


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
        updateTokenList(list, string.trim().split(/\s+/));
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
