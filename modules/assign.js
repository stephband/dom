/**
assign(node, properties)

Assigns each property of `properties` to `node`, as a property where that
property exists in `node`, otherwise as an attribute.

If `properties` has a property `'children'` it must be an array of nodes;
they are appended to 'node'.

The property `'html'` is aliased to `'innerHTML'`. The property `'text'`
is aliased to `'textContent'`. The property `'tag'` is treated as an alias
of `'tagName'` (which is ignored, as `node.tagName` is read-only). The
property `'is'` is also ignored.
*/

import curry from '../../fn/modules/curry.js';
import id from '../../fn/modules/id.js';
import noop from '../../fn/modules/noop.js';
import overload from '../../fn/modules/overload.js';

const assignProperty = overload(id, {
	// Ignore read-only properties or attributes
	is: noop,
	tag: noop,

	data: function(name, node, object) {
		Object.assign(node.dataset, object);
	},

	html: function(name, node, content) {
		node.innerHTML = content;
	},

	text: function(name, node, content) {
		node.textContent = content;
	},

	children: function(name, node, content) {
		// Empty the node and append children
		node.innerHTML = '';
		node.append.apply(node, content);
	},

	// SVG elements have a read-only properties, and must be set as string
	// attributes. Todo: explore the SVG property API to make these take
	// advantage of it
	points:    setAttribute,
    cx:        setAttribute,
    cy:        setAttribute,
    r:         setAttribute,
	transform: setAttribute,
    preserveAspectRatio: setAttribute,
    viewBox:   setAttribute,

	default: function(name, node, content) {
		if (name in node) {
			node[name] = content;
		}
		else {
			node.setAttribute(name, content);
		}
	}
});

function setAttribute(name, node, content) {
	node.setAttribute(name, content);
}

export function assign(node, attributes) {
	var names = Object.keys(attributes);
	var n = names.length;

	while (n--) {
		assignProperty(names[n], node, attributes[names[n]]);
	}

	return node;
}

export default curry(assign, true);
