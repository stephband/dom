
/*
validateable

<p>The <strong>validateable</strong> attribute can be set on an
individual input, or on a form to make all descendant inputs
validateable.</p>

<p>A validateable input is validated on <code>focusout</code>, and
if an <code>invalid</code> event is emitted an error label is
appended to the DOM directly after it. The label's text is read
from&hellip;</p>

<ol>
    <li>a <code>data-validation-xxx</code> attribute on the input,
    (where <code>xxxx</code> is the name of the failed constraint), OR</li>
    <li>the object <code>dom.validation.messages</code>, OR</li>
    <li>the browser's default message</li>
</ol>

<p>In addition, the first time a validation is performed on an
element the class <code>validated</code> is added, providing a
hook for pre- and post- validation <code>:invalid</code> styles.</p>

<p>Constraints are named after the validation attributes that impose
them.</p>

<pre><code>dom.validation.messages = {
    pattern:   'Pattern does not match',
    max:       'Number too small',
    min:       'Number too big',
    step:      'Number not in step',
    maxlength: 'Input too long',
    type:      'Input not of type',
    required:  ''
};
</code></pre>
<p>This messages object is unpopulated by default.</p>

<form class="block @2-grid-4/15 @2-grid-left-1/15 @3-grid-left-1/9 validateable" style="height: 0; overflow: visible; margin-top: -440px;">
<label for="text">text</label>
<input type="text" id="text" name="text" required maxlength="20" />

<label for="password">password</label>
<input type="password" id="password" name="password" required />

<label for="number">number</label>
<input type="number" id="number" name="number" min="0" max="1" step="0.1" />

<label for="url">url</label>
<input type="url" id="url" name="url" />

<label for="email">email</label>
<input type="email" id="email" name="email" data-val-type="Wrong type, knucklehead" />
</form>
*/






// Monitors forms and fields with .validateable for input, and generates
// and manages .error-labels following those that fail validation.
//
// Messages are read from:
//
// 1. A validation attribute on the input:
//    <input type="email" data-validation-type="That is not an email address" />
//    The attribute name can be modified globally by setting
//    config.attributePrefix. The postfix word is always one of 'pattern',
//    'max', 'min', 'step', 'maxlength', 'type' or 'required'.
//
// 2. The messages in config.messages.
//
// 3. The browser's default validation message (which is available on the
//    input at the point that it fails validation).
//
// Inputs inside or with .validateable are given .validated after they are
// first validated, enabling pre- as well as post- validation styles.

import { get, id, invoke, Stream } from '../../fn/module.js';
import { create, events, matches, next, remove, validate, isValid, classes, after } from '../module.js';

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
    // Class added to labels displaying errors
	errorLabelClass: 'error-label',

	// Class added to validated nodes (note: not valid nodes, necessarily,
	// but nodes that have been validated at least once).
	validatedInputClass:  'validated',

	// Prefix for input attributes containing node specific validation messages.
    // Example: data-validation-max="You have gone too far"
    messageAttributePrefix: 'data-validation-',

	// Global object for validation messages, overiding the browser defaults.
	messages: {
		// pattern:
		// max:
		// min:
		// step:
		// maxlength:
		// type:
		// required:
	},

    // Given an input, select or textarea (that may have been augmented in some
    // way such that it is not the node that an error should be attached to),
    // selectNode() should return the node that the error should follow.
    selectNode: id
};

function negate(fn) {
	return function() {
		return !fn.apply(this, arguments);
	};
}

function isShowingMessage(input) {
    var node = config.selectNode(input);
	return node.nextElementSibling
		&& matches('.' + config.errorLabelClass.trim().split(/\s+/).join('.'), node.nextElementSibling);
}

function toError(node) {
	var validity = node.validity;
	var prefix   = config.messageAttributePrefix;
	var messages = config.messages;
	var name;

	for (name in validity) {
		if (name !== 'valid' && validity[name]) {
			return {
				type: name,
				attr: types[name],
				name: node.name,
				text: (prefix && node.getAttribute(prefix + types[name]))
					|| (messages && messages[types[name]])
					|| node.validationMessage,
				node: node
			};
		}
	}
}

function renderError(error) {
	var input = error.node;
    var node  = config.selectNode(input);

	// Find the last error
	while (node.nextElementSibling && matches('.' + config.errorLabelClass.trim().split(/\s+/).join('.'), node.nextElementSibling)) {
		node = node.nextElementSibling;
	}

	var label = create('label', {
		textContent: error.text,
		for:         input.id,
		class:       config.errorLabelClass
	});

	after(node, label);

	if (error.type === 'customError') {
		input.setCustomValidity(error.text);

		events('input', input)
		.take(1)
		.each(function(e) {
			e.target.setCustomValidity('');
		});
	}
}

function addValidatedClass(input) {
	classes(input).add(config.validatedInputClass);
}

function removeMessages(input) {
	var node = config.selectNode(input);

	while ((node = next(node)) && matches('.' + config.errorLabelClass.trim().split(/\s+/).join('.'), node)) {
		remove(node);
	}
}

events('input dom-update', document)
.map(get('target'))
.filter(isValidateable)
// This came from somewhere - is it for nullifying custom messages? Todo: review.
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
