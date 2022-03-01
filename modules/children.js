/**
children(node)

Returns an array of child elements of `node`.
*/

import toArray from '../../fn/modules/to-array.js';

export default function children(node) {
	// In IE and Safari, document fragments do not have .children, fall back to
	// querySelectorAll.

	// TOIDO: BUg in selector!!!
	return toArray(node.children || node.querySelectorAll('*'));
}

// Expose to console in DEBUG mode
if (window.DEBUG) {
    Object.assign(window.dom || (window.dom = {}), { children });
}
