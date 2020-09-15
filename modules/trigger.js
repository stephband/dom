
/**
trigger(type, node)

Triggers event of `type` on `node`.

```
trigger('dom-activate', node);
```
*/

/**
trigger(data, node)

Triggers event described by `data` on `node`.

```
trigger({
    type: 'dom-activate',
    details: {...}
}, node);
```
*/

import Event from './event.js';

const assign = Object.assign;

export default function trigger(type, node) {
    let properties;

    if (typeof type === 'object') {
        properties = type;
        type = properties.type;
        delete properties.type;
    }

    // Don't cache events. It prevents you from triggering an event of a
	// given type from inside the handler of another event of that type.
	var event = Event(type, properties);
	node.dispatchEvent(event);
    return node;
}
