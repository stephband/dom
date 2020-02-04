
/*
query(selector, node)

Returns an array of all descendants of `node` that match `selector`.
*/

import { curry, toArray } from '../../fn/module.js';

export function query(selector, node) {
	return toArray(node.querySelectorAll(selector));
}

export default curry(query, true);