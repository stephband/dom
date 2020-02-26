
const assign      = Object.assign;
const CustomEvent = window.CustomEvent;

const defaults    = {
	// The event bubbles (false by default)
	// https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
	bubbles: true,

	// The event may be cancelled (false by default)
	// https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
	cancelable: true

	// Trigger listeners outside of a shadow root (false by default)
	// https://developer.mozilla.org/en-US/docs/Web/API/Event/composed
	//composed: false
};

/**
Event(type, properties)

Creates a CustomEvent of type `type`.
Additionally, `properties` are assigned to the event object.
*/

export default function Event(type, options) {
	let settings;

	if (typeof type === 'object') {
		settings = assign({}, defaults, type);
		type = settings.type;
	}

	if (options && options.detail) {
		if (settings) {
			settings.detail = options.detail;
		}
		else {
			settings = assign({ detail: options.detail }, defaults);
		}
	}

	var event = new CustomEvent(type, settings || defaults);

	if (options) {
		delete options.detail;
		assign(event, options);
	}

	return event;
}
