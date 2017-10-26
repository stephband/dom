(function(window) {
	"use strict";

    // Monitors forms and fields with .validateable for input, and generates
    // and manages .error-labels following those that fail validation.
    //
    // Messages are read from:
    //
    // 1. A validation attribute on the input:
    //    <input type="email" data-validation-type="That is not an email address" />
    //    The attribute name can be modified globally by setting dom.validation.attributePrefix.
    //
    // 2. The messages in dom.validation.messages.
    //
    // 3. The browser's default validation message (which is available on the
    //    input at the point that it fails validastion).
    //
    // Inputs inside or with .validateable are given .validated after they are
    // first validated, enabling pre- as well as post- validation styles.

	var Fn             = window.Fn;
	var Stream         = window.Stream;
	var dom            = window.dom;

	var get            = Fn.get;
	var invoke         = Fn.invoke;
	var nothing        = Fn.nothing;
	var once           = Fn.once;

	var after          = dom.after;
	var classes        = dom.classes;
    var matches        = dom.matches;
    var next           = dom.next;
	var remove         = dom.remove;

    var isValidateable = matches('.validateable, .validateable input, .validateable textarea, .validateable select');

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
		return node.nextElementSibling
			&& matches('.' + dom.validation.errorClass, node.nextElementSibling);
	}

	function toError(input) {
		var node     = input;
		var validity = node.validity;
        var prefix   = dom.validation.attributePrefix;
        var messages = dom.validation.messages;
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
					text: (prefix && input.getAttribute(prefix + types[name]))
                        || (messages && messages[types[name]])
                        || node.validationMessage,
					node: input
				};
			}
		}
	}

	function renderError(error) {
		var input  = error.node;
		var node   = input;

		while (node.nextElementSibling && matches('.' + dom.validation.errorClass, node.nextElementSibling)) {
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
		classes(input).add(dom.validation.validatedClass);
	}

	function removeMessages(input) {
		var node = input;

		while ((node = next(node)) && matches('.' + dom.validation.errorClass, node)) {
			remove(node);
		}
	}

	dom
	.event('input', document)
	.map(get('target'))
    .filter(isValidateable)
	.tap(invoke('setCustomValidity', ['']))
	.filter(isValid)
	.each(removeMessages);

	dom
	.event('focusout', document)
	.map(get('target'))
	.filter(isValidateable)
	.each(invoke('checkValidity', nothing));

    dom
	.event('submit', document)
	.map(get('target'))
	.filter(isValidateable)
	.each(addValidatedClass);

	// Add event in capture phase
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

    dom.validation = {
		errorClass: 'error-label',

		// Class added to validated nodes (note: not valid nodes, necessarily)
		validatedClass: 'validated',

        // Prefix for input attributes containing validation messages.
        attributePrefix: 'data-validation-',

        // Global object for validation messages.
        messages: {
            // pattern:
            // max:
            // min:
            // step:
            // maxlength:
            // type:
            // required:
        }
    };

})(this);
