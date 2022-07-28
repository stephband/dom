
/**
createBoolean(definition)
Creates a boolean attribute/property definition for element(), where
`definition` is an object with the functions:

```js
{
    enable: fn,
    disable: fn,
    getState: fn
}
```
**/

export default function createBoolean(definition, name) {
    function update(element, state) {
        if (definition.getState(element) === state) { return; }
        return definition[state ? 'enable' : 'disable'](element);
    }

    return {
        attribute: function(value) {
            return update(this, value !== null);
        },

        set: function(value) {
            return update(this, !!value);
        },

        get: function() {
            return definition.getState(this);
        },

        enumerable: true
    };
}
