const assign = Object.assign;
const eventOptions = { bubbles: true };

export default function Event(type, properties) {
	var options = assign({}, eventOptions, properties);
	var event   = new CustomEvent(type, options);

	if (properties) {
		delete properties.detail;
		assign(event, properties);
	}

	return event;
}
