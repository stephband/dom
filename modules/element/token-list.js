
import { remove } from '../../../fn/modules/remove.js';

const assign = Object.assign;


/*
TokenList(element, definitions)

Create a TokenList-like object.

The optional `definitions` object is a map of accepted tokens, each one
represented by an object with the functions `enable()` and `disable()`:

```js
new TokenList(element, {
    token: {
        enable: function(element) { ... },
        disable: function(element) { ... }
    }
});
```
*/

export default function TokenList(element, definitions) {
    this.element     = element;
    this.definitions = definitions;
    this.tokens      = [];
}

assign(TokenList.prototype, {
    contains: function(string) {
		return this.tokens.includes(string);
	},

    add: function() {
        let n = arguments.length;

        while (n--) {
            const token = arguments[n];

            if (!this.tokens.includes(token)) {
                this.tokens.push(token);

                // Call definition.enable() with element as context
                if (this.supports(token)) {
                    this.definitions[token].enable(this.element);
                }
            }
        }
    },

    remove: function() {
        let n = arguments.length;

        while (n--) {
            const token = arguments[n];

            if (this.tokens.includes(token)) {
                remove(this.tokens, token);

                // Call the definition.disable() with element as context
                if (this.supports(token)) {
                    this.definitions[token].disable(this.element);
                }
            }
        }
    },

    supports: function(token) {
        return !!this.definitions && !!this.definitions[token];
    }
});
