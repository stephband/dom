// validation.js
//
// The dom-error event is sent from forms that fail AJAX requests. It is a hook
// for custom handling of responses where you want to use the dom library's
// 'postable' but still want custom validation. Event.detail is the reponse
// object.
//
// This script takes .data.errors from a response and sets input validity on
// inputs that caused the error. It expects the errors object to be in the form:
//
// {
//     'input name': ['Message 1', 'Message 2']
// }
//
// The HTML validation API can only set one custom validation message at a time,
// so the last message per input will be displayed.

(function(window) {
    function toSelector(str) {
		return '[name="' + str + '"]';
	}

	function flattenErrors(object) {
		var errors = [];

		// Flatten errors into a list
		for (name in object) {
			errors.push.apply(errors,
				object[name].map(function(text) {
					return {
						name: name,
						text: text
					};
				})
			);
		}

		return errors;
	}

	function setValidity(error) {
		var selector = toSelector(error.name);
		var input    = dom.find(selector, form);

		if (!input) {
			console.warn('Error given for non-existent field name="' + error.name + '"', error);
			return;
		}

		input.setCustomValidity(error.text);
	}

	dom
	.events('dom-error', document)
	.each(function(e) {
		var form    = e.target;
		var reponse = e.detail;

		if (response && response.data && typeof response.data.errors === 'object') {
			// Format data and set custom validation messages on inputs
			flattenErrors(response.data.errors)
			.forEach(setValidity);

			// Cause the validation handling found in dom.validation.js to
			// pick up the custom validation messages and render them
			form.checkValidity();
		}
	});
})(this);
