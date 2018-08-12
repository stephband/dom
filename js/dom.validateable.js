
// Monitors forms and fields with .validateable for input, and generates
// and manages .error-labels following those that fail validation.
//
// Messages are read from:
//
// 1. A validation attribute on the input:
//    <input type="email" data-validation-type="That is not an email address" />
//    The attribute name can be modified globally by setting config.attributePrefix.
//
// 2. The messages in config.messages.
//
// 3. The browser's default validation message (which is available on the
//    input at the point that it fails validastion).
//
// Inputs inside or with .validateable are given .validated after they are
// first validated, enabling pre- as well as post- validation styles.

import { get, invoke, Stream } from '../../fn/fn.js';
import { default as dom, create, events, matches, next, remove, validate, isValid, classes, after } from '../dom.js';

var isValidateable = matches('.validateable, .validateable input, .validateable textarea, .validateable select, [validateable], [validateable] input, [validateable] textarea, [validateable] select');

var types = {
	patternMismatch: 'pattern',
	rangeOverflow:   'max',
	rangeUnderflow:  'min',
	stepMismatch:    'step',
	tooLong:         'maxlength',
	typeMismatch:    'type',
	valueMissing:    'required'
};

export const config = {
	errorClass: 'error-label',

	// Class added to validated nodes (note: not valid nodes, necessarily,
	// but nodes that have been validated).
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


function negate(fn) {
	return function() {
		return !fn.apply(this, arguments);
	};
}

function isShowingMessage(node) {
	return node.nextElementSibling
		&& matches('.' + config.errorClass, node.nextElementSibling);
}

function toError(input) {
	var node     = input;
	var validity = node.validity;
	var prefix   = config.attributePrefix;
	var messages = config.messages;
	var name;

	for (name in validity) {
		if (name !== 'valid' && validity[name]) {
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
	var input = error.node;
	var node  = input;

	// Find the last error
	while (node.nextElementSibling && matches('.' + config.errorClass, node.nextElementSibling)) {
		node = node.nextElementSibling;
	}

	var label = create('label', {
		textContent: error.text,
		for:         input.id,
		class:       'error-label'
	});

	after(node, label);

	if (error.type === 'customError') {
		node.setCustomValidity(error.text);

		events('input', node)
		.take(1)
		.each(function() {
			node.setCustomValidity('');
		});
	}
}

function addValidatedClass(input) {
	classes(input).add(config.validatedClass);
}

function removeMessages(input) {
	var node = input;

	while ((node = next(node)) && matches('.' + config.errorClass, node)) {
		remove(node);
	}
}

events('input', document)
.map(get('target'))
.filter(isValidateable)
// This came from somewhere - is it for nullifying custom messages? Review.
.tap(invoke('setCustomValidity', ['']))
.filter(isValid)
.each(removeMessages);

events('focusout', document)
.map(get('target'))
.filter(isValidateable)
.each(validate);

events('submit', document)
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
