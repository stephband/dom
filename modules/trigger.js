// trigger(type, node)
//
// type - a string or an object with a 'type' property
// node - a DOM node or an object with a 'target' property

import Event from './event.js';

const assign = Object.assign;

export default function trigger(type, node) {
    let options;

    if (typeof type === 'object') {
        type = type.type;
        options = type;
    }

    if (!'nodeType' in node) {
        node = node.target;
        options = assign({}, options, node);
    }

    // Don't cache events. It prevents you from triggering an event of a
	// given type from inside the handler of another event of that type.
	var event = Event(type, options);
	node.dispatchEvent(event);
    return node;
}
