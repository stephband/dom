
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

Returns the result of `node.dispatchEvent()` - `false` if the event was 
prevented, else `true`.
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
	var event = Event(type, properties);
    return node.dispatchEvent(event);
}

export default curry(trigger, true);
