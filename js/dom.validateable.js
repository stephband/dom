(function(window) {
	"use strict";

	var assign         = Object.assign;
	var Fn             = window.Fn;
	var Stream         = window.Stream;
	var dom            = window.dom;

	var get            = Fn.get;
	var invoke         = Fn.invoke;
	var nothing        = Fn.nothing;
	var once           = Fn.once;

	var after          = dom.after;
	var attribute      = dom.attribute;
	var classes        = dom.classes;
    var matches        = dom.matches;
    var next           = dom.next;
	var remove         = dom.remove;

    var isValidateable = matches('.validateable, .validateable input, .validateable textarea, .validateable select');
	var isErrorLabel   = matches('.error-label');
	var validatedClass = 'validated';

	var types = {
		patternMismatch: 'pattern',
		rangeOverflow:   'max',
		rangeUnderflow:  'min',
		stepMismatch:    'step',
		tooLong:         'maxlength',
		typeMismatch:    'type',
		valueMissing:    'required'
	};

	function negate(fn) {
		return function() {
			return !fn.apply(this, arguments);
		};
	}

	function isValid(node) {
		return node.validity ? node.validity.valid : true ;
	}

	function isShowingMessage(node) {
		return node.nextElementSibling && isErrorLabel(node.nextElementSibling);
	}

	function toError(input) {
		var node     = input;
		var validity = node.validity;
        var name, text;

		for (name in validity) {
			if (name !== 'valid' && validity[name]) {
				text = dom.validation[types[name]];

				if (text) {
					input.setCustomValidity(text);
				}

				return {
					type: name,
					attr: types[name],
					name: input.name,
					text: node.validationMessage,
					node: input
				};
			}
		}
	}

	function renderError(error) {
		var input  = error.node;
		var node   = input;

		while (node.nextElementSibling && isErrorLabel(node.nextElementSibling)) {
			node = node.nextElementSibling;
		}

        var label = dom.create('label')
        dom.assign(label, {
            textContent: error.text,
			for:         input.id,
            class:       'error-label'
		});

		after(node, label);
	}

	function addValidatedClass(input) {
		classes(input).add(validatedClass);
	}

	function removeMessages(input) {
		var node = input;

		while ((node = next(node)) && isErrorLabel(node)) {
			remove(node);
		}
	}

	// Clear validation on new input
	dom
	.event('input', document)
	.map(get('target'))
    .filter(isValidateable)
	.tap(invoke('setCustomValidity', ['']))
	.filter(isValid)
	.each(removeMessages);

	// Check validity on focus out
	dom
	.event('focusout', document)
	.map(get('target'))
	.filter(isValidateable)
	.each(invoke('checkValidity', nothing));

	// Check validation on form submit
	// TODO doesnt work because 'submit' is not received if the validity
	// check shows the form is invalid
    dom
	.event('submit', document)
	.map(get('target'))
	.filter(isValidateable)
	.each(addValidatedClass);

	// Add error labels after invalid inputs. Listen to events in the
	// capture phase.
	document.addEventListener(
		'invalid',

		// Push to stream
		Stream.of()
		.map(get('target'))
        .filter(isValidateable)
		.tap(addValidatedClass)
		.filter(negate(isShowingMessage))
		.map(toError)
		.each(renderError)
		.push,

		// Capture phase
		true
	);

    dom.validation = dom.validation || {};

})(this);
