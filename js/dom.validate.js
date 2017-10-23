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
	var remove         = dom.remove;

	var untouchedClass        = 'untouched';
	var errorElementSelector  = '.error-label';
	var errorAttribute        = 'data-error';

    var validitionMessages = window.validitionMessages = assign(window.validitionMessages || {}, {
		//patternMismatch: pattern
		//rangeOverflow:   max
		//rangeUnderflow:  min
		//stepMismatch:    step
		//tooLong:         maxlength
		//typeMismatch:    If value does not parse as correct type
		//valueMissing:    required
	});

	function negate(fn) {
		return function() {
			return !fn.apply(this, arguments);
		};
	}

	function isInput(node) {
		return matches('input, textarea, select', node);
	}

	function isValid(node) {
		return node.validity ? node.validity.valid : true ;
	}

	function isShowingMessage(node) {
		return node.nextElementSibling
			&& matches(errorElementSelector, node.nextElementSibling);
	}

	function isErrorAttribute(error) {
		var node = error.node;
		return !!attribute(errorAttribute, node);
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
					}
				})
			);
		}

		return errors;
	}

	function toError(input) {
		var node     = input;
		var validity = node.validity;

		for (name in validity) {
			if (name !== 'valid' && validity[name]) {
				return {
					type: name,
					name: input.name,
					text: validitionMessages[name] || node.validationMessage,
					node: input
				};
			}
		}
	}

	function renderError(error) {
		var input  = error.node;
		var node   = input;

		while (node.nextElementSibling && matches(errorElementSelector, node.nextElementSibling)) {
			node = node.nextElementSibling;
		}

        var message = dom.create('label', {
			for:   input.id,
			//value: input.value
		});

		//Sparky(errorTemplateSelector, assign({
		//	id:    input.id,
		//	value: input.value
		//}, error));

		after(node, message);

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

	function removeUntouchedClass(input) {
		classes(input).remove(untouchedClass);
	}

	function removeMessages(input) {
		var node  = input;

		while (node.nextElementSibling && matches(errorElementSelector, node.nextElementSibling)) {
			node = node.nextElementSibling;
			remove(node);
		}
	}

	dom
	.event('input', document)
	.map(get('target'))
	.filter(isValid)
	.each(removeMessages);

	dom
	.event('focusout', document)
	.map(get('target'))
	.filter(isInput)
	.each(invoke('checkValidity', nothing));

	dom
	.event('focusout', document)
	.map(get('target'))
	.unique()
	.each(removeUntouchedClass);

	document.addEventListener(
		'invalid',

		// Push to stream
		Stream.of()
		.map(get('target'))
		.tap(once(removeUntouchedClass))
		.filter(negate(isShowingMessage))
		.map(toError)
		.filter(isErrorAttribute)
		.each(renderError)
		.push,

		// Add event in capture phase!!
		true
	);

})(this);
