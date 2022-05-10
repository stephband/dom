
import { remove } from '../../../fn/modules/remove.js';

const assign = Object.assign;

/*
TokenList(element, definitions)
The definitions object is a map of accepted tokens, each one represented by an
object with the functions `enable()` and `disable()`:

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
