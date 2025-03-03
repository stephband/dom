/**
find(selector, element)
Returns the first element matching `selector`.
**/

import curry from 'fn/curry.js';

export function find(selector, node) {
	return node.querySelector(selector);
}

export default curry(find, true);
