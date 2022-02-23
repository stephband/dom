
/**
select(selector, node)

Returns an array of all descendants of `node` that match `selector`.
*/

import curry from '../../fn/modules/curry.js';
import toArray from '../../fn/modules/to-array.js';

export function select(selector, node) {
	return toArray(node.querySelectorAll(selector));
}

export default curry(select, true)

if (window.DEBUG) {
	window.select = select;
}
