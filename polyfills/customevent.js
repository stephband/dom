
// window.CustomEvent polyfill
// http://caniuse.com/#search=customevent

(function(window) {
	if (window.CustomEvent && typeof window.CustomEvent === 'function') { return; }
	if (window.console) { console.log('Polyfill: CustomEvent'); }

	var Event = window.Event;
	var defaults = { bubbles: false, cancelable: false, detail: undefined };

	function CustomEvent(event, params) {
		params = params || defaults;
		
		var e = document.createEvent('CustomEvent');
		e.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		
		return e;
	};

	CustomEvent.prototype = Event.prototype;
	window.CustomEvent = CustomEvent;
})(window);
