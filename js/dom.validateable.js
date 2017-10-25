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

    var isValidateable = dom.matches('.validateable, .validateable input, .validateable textarea, .validateable select');
	var validatedClass = 'validated';
	var errorSelector  = '.error-label';
	//var errorAttribute        = 'data-error';

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
			&& matches(errorSelector, node.nextElementSibling);
	}

	//function isErrorAttribute(error) {
	//	var node = error.node;
	//	return !!attribute(errorAttribute, node);
	//}

	//function flattenErrors(object) {
	//	var errors = [];
    //
	//	// Flatten errors into a list
	//	for (name in object) {
	//		errors.push.apply(errors,
	//			object[name].map(function(text) {
	//				return {
	//					name: name,
	//					text: text
	//				}
	//			})
	//		);
	//	}
    //
	//	return errors;
	//}

	function toError(input) {
		var node     = input;
		var validity = node.validity;
        var name;

		for (name in validity) {
			if (name !== 'valid' && validity[name]) {
				return {
					type: name,
					attr: types[name],
					name: input.name,
					text: (dom.validation.prefix && input.getAttribute(dom.validation.prefix + types[name]))
                        || (dom.validation.messages && dom.validation.messages[types[name]])
                        || node.validationMessage,
					node: input
				};
			}
		}
	}

	function renderError(error) {
		var input  = error.node;
		var node   = input;

		while (node.nextElementSibling && matches(errorSelector, node.nextElementSibling)) {
			node = node.nextElementSibling;
		}

        var label = dom.create('label')
        dom.assign(label, {
            textContent: error.text,
			for:         input.id,
            class:       'error-label'
		});

		after(node, label);

		if (error.type === 'customError') {
			node.setCustomValidity(error.text);

			dom
			.on('input', node)
			.take(1)
			.each(function() {
				node.setCustomValidity('');
			});
		}
	}

	function addValidatedClass(input) {
		classes(input).add(validatedClass);
	}

	function removeMessages(input) {
		var node = input;

		while ((node = next(node)) && matches(errorSelector, node)) {
			remove(node);
		}
	}

	dom
	.event('input', document)
	.map(get('target'))
    .filter(isValidateable)
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

	//dom
	//.event('focusout', document)
	//.map(get('target'))
	//.unique()
	//.each(addValidatedClass);

	// Add event in capture phase
	document.addEventListener(
		'invalid',

		// Push to stream
		Stream.of()
		.map(get('target'))
        .filter(isValidateable)
		.tap(once(addValidatedClass))
		.filter(negate(isShowingMessage))
		.map(toError)
        //.filter(isErrorAttribute)
		//.filter(isMessage)
		.each(renderError)
		.push,

		// Capture phase
		true
	);

    dom.validation = dom.validation || {};

})(this);
