const assign      = Object.assign;
const CustomEvent = window.CustomEvent;
const defaults    = { bubbles: true };

export default function Event(type, options) {
	var event   = new CustomEvent(type, options ?
		assign({}, defaults, options) :
		defaults
	);

	if (options) {
		console.warn('deprecated: Setting options on event', options);
		delete options.detail;
		assign(event, options);
	}

	return event;
}
