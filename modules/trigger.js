// trigger('type', node)
// trigger({
//     type: 'type',
//     detail: {},
//     relatedTarget: etc.
// }, node)

import Event from './event.js';

const assign = Object.assign;

export default function trigger(type, node) {
    let properties;

    if (typeof type === 'object') {
        properties = type;
        type = properties.type;
    }

    // Don't cache events. It prevents you from triggering an event of a
	// given type from inside the handler of another event of that type.
	var event = Event(type, properties);
	node.dispatchEvent(event);
    return node;
}
