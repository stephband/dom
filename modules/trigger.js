import Event from './event.js';

export default function trigger(type, node) {
    let options;

    if (typeof type === 'object') {
        type = type.type;
        options = type;
    }

    if (typeof node) {
        node = node.target;
        options = assign({}, options, node);
    }

    // Don't cache events. It prevents you from triggering an event of a
	// given type from inside the handler of another event of that type.
	var event = Event(type, options);
	node.dispatchEvent(event);
    return node;
}
