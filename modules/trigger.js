
/**
trigger(type, node)

Triggers event of `type` on `node`. Returns `false` if the event default was 
prevented, otherwise `true`.

```
trigger('dom-activate', node);
```
*/

/**
trigger(data, node)

Triggers an event described by `data` on `node`. The `data` object must have a 
`type` property. Use the `details` property to carry a data payload.

```
trigger({
    type: 'dom-activate',
    details: {...}
}, node);
```

Returns `false` if the event default was prevented, otherwise `true`.
*/

import curry from '../../fn/modules/curry.js';
import Event from './event.js';

export function trigger(type, node) {
    let properties;

    if (typeof type === 'object') {
        properties = type;
        type = properties.type;
        delete properties.type;
    }

    // Don't cache events. It prevents you from triggering an event of a
	// given type from inside the handler of another event of that type.
	const event = Event(type, properties);
    return node.dispatchEvent(event);
}

export default curry(trigger, true);
